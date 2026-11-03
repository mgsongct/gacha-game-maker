// 함수 그래프: 선언·호출(콜스택)·복잡도(조건/분기)·가중치(호출 횟수)·병목(팬인×복잡도)·순환(SCC)·가장 깊은 호출 사슬, 중복 정의, 안 쓰는 함수
import { walk } from './source.mjs';

const CTRL = new Set(['if_statement', 'for_statement', 'for_in_statement', 'while_statement', 'do_statement', 'switch_case', 'catch_clause', 'ternary_expression']);
const FN = new Set(['function_declaration', 'function_expression', 'arrow_function', 'method_definition', 'generator_function_declaration']);
function fnName(n) {
  if (n.type === 'function_declaration' || n.type === 'generator_function_declaration') return n.childForFieldName('name')?.text;
  const p = n.parent; if (!p) return null;
  if (p.type === 'variable_declarator') return p.childForFieldName('name')?.text;
  if (p.type === 'assignment_expression') { const l = p.childForFieldName('left'); return l?.type === 'identifier' ? l.text : null; }
  return null;
}
// 복잡도: 분기 노드 + 논리 연산(&& || ??) + 1, 최대 중첩
function complexity(body) { let c = 1, maxDepth = 0;
  const rec = (n, d) => { if (n !== body && FN.has(n.type)) return; let dd = d;
    if (CTRL.has(n.type)) { c++; if (n.type !== 'ternary_expression' && n.type !== 'switch_case') { dd = d + 1; maxDepth = Math.max(maxDepth, dd); } }
    else if (n.type === 'binary_expression') { const op = n.childForFieldName('operator')?.type; if (op === '&&' || op === '||' || op === '??') c++; }
    for (let i = 0; i < n.childCount; i++) rec(n.child(i), dd); };
  rec(body, 0); return { cc: c, depth: maxDepth }; }

// 액션 분배기(switch(a)·switch(act)가 본문의 중심)는 case마다 따로 잰다 — 전체 복잡도는 case 수일 뿐이라 꼬인 곳을 가림
function dispatchCases(body, u) { const sw = body.namedChildren?.find(c => c.type === 'switch_statement' && /^\(?\s*(a|act)\s*\)?$/.test(c.childForFieldName('value')?.text || '')); if (!sw) return null;
  const out = []; sw.childForFieldName('body').namedChildren.filter(c => c.type === 'switch_case').forEach(c => { const v = c.childForFieldName('value'); const { cc, depth } = complexity(c); out.push({ act: v?.text.slice(1, -1) || 'default', cc: cc - 1, depth, lines: c.endPosition.row - c.startPosition.row + 1, loc: u.loc(c) }); }); return out; }
export function buildGraph(units) {
  const fns = new Map(), issues = [], scopes = new Map(); // scopes: '단위@함수시작'(최상위는 '단위@0') → Map(이름 → 함수 기록 | null(함수 아닌 지역 변수))
  const fnAnc = n => { for (let p = n.parent; p; p = p.parent) if (FN.has(p.type)) return p; return null; };
  const depthOf = n => { let d = 0; for (let p = fnAnc(n); p; p = fnAnc(p)) d++; return d; };
  const scopeKey = (u, n) => `${u.name}@${n ? n.startIndex : 0}`, declare = (k, name, v) => { if (!scopes.has(k)) scopes.set(k, new Map()); const m = scopes.get(k); if (!m.has(name) || v) m.set(name, v); };
  for (const u of units) {
    walk(u.tree.rootNode, n => { if (!FN.has(n.type)) return; const name = fnName(n); if (!name) return;
      const d = depthOf(n), top = u.name === 'main' ? d === 0 : d <= 1; // 모듈은 IIFE 안이 최상위
      const key = u.name === 'main' && top ? name : `${u.name}#${name}${top ? '' : '@' + n.startIndex}`, body = n.childForFieldName('body') || n;
      const { cc, depth } = complexity(body), cases = dispatchCases(body, u), rec = { key, name, unit: u.name, loc: u.loc(n), lines: n.endPosition.row - n.startPosition.row + 1, cc, depth, cases, node: n, calls: new Map(), async: new Set() /* 동기로 부르는 대상 */, callers: new Set(), top };
      if (u.name === 'main' && top && fns.has(key) && fns.get(key).top) issues.push({ sev: 'error', kind: '중복 정의', msg: `${name}: ${fns.get(key).loc} 와 ${rec.loc} 에 두 번 정의(뒤의 것이 앞을 덮어씀)` });
      if (!fns.has(key) || top) fns.set(key, rec);
      const owner = n.type === 'function_declaration' ? fnAnc(n) : fnAnc(n.parent?.type === 'variable_declarator' ? n.parent : n); declare(scopeKey(u, owner), name, rec); });
    // 함수가 아닌 지역 이름(매개변수·변수)도 기록 — 같은 이름의 전역 함수를 가림
    walk(u.tree.rootNode, n => { let ids = []; if (n.type === 'variable_declarator') { const v = n.childForFieldName('value'); if (v && FN.has(v.type)) return; const nm = n.childForFieldName('name'); if (nm?.type === 'identifier') ids = [nm.text]; }
      else if (n.type === 'formal_parameters') ids = n.namedChildren.map(c => c.type === 'identifier' ? c.text : c.type === 'assignment_pattern' ? c.childForFieldName('left')?.text : null).filter(Boolean);
      else if (n.type === 'arrow_function' && n.childForFieldName('parameter')) { declare(scopeKey(u, n), n.childForFieldName('parameter').text, null); return; }
      if (!ids.length) return; const sc = n.type === 'formal_parameters' ? n.parent : fnAnc(n); ids.forEach(id => declare(scopeKey(u, sc), id, null)); });
  }
  const resolve = (u, n, name) => { for (let p = fnAnc(n); p; p = fnAnc(p)) { const m = scopes.get(scopeKey(u, p)); if (m && m.has(name)) return m.get(name); } const m = scopes.get(scopeKey(u, null)); if (m && m.has(name)) return m.get(name); return u.name === 'main' ? null : fns.get(name) || null; };
  // 호출: 가장 안쪽 이름 있는 함수에 붙인다. 타이머·프로미스·이벤트 콜백 안의 호출은 비동기 간선(콜스택 깊이·동기 순환에서 뺌)
  const ASYNC = /^(setTimeout|setInterval|requestAnimationFrame|queueMicrotask)$|\.(then|catch|finally|addEventListener)$/;
  const owner = (u, n) => { let as = false; for (let p = fnAnc(n); p; p = fnAnc(p)) { const call = p.parent?.type === 'arguments' ? p.parent.parent : null; if (call?.type === 'call_expression' && ASYNC.test(call.childForFieldName('function')?.text || '')) as = true; const nm = fnName(p); if (nm) { const f = resolve(u, p, nm) || [...fns.values()].find(r => r.node.startIndex === p.startIndex && r.unit === u.name); if (f && f.node.startIndex === p.startIndex) return { f, as }; } } return null; };
  for (const u of units) walk(u.tree.rootNode, n => { if (n.type !== 'call_expression') return; const f = n.childForFieldName('function'); if (f?.type !== 'identifier') return;
    const to = resolve(u, n, f.text); if (!to) return; const o = owner(u, n); if (!o || o.f === to) return; const from = o.f;
    from.calls.set(to.key, (from.calls.get(to.key) || 0) + 1); to.callers.add(from.key); if (!o.as) from.async.add(to.key); }); /* async 집합 = 동기로 부르는 대상 */
  // main 최상위 이름 충돌(let/const 중복은 실행 시 SyntaxError)
  const mainU = units.find(u => u.name === 'main'), seen = new Map(); // main 한 스크립트가 없는 묶음(도구 코드 메타 점검)은 이름 충돌 검사 없음
  for (let i = 0; mainU && i < mainU.tree.rootNode.childCount; i++) { const n = mainU.tree.rootNode.child(i), names = [];
    if (n.type === 'function_declaration' || n.type === 'class_declaration') names.push([n.childForFieldName('name')?.text, n.type === 'class_declaration' ? 'class' : 'function']);
    else if (n.type === 'lexical_declaration' || n.type === 'variable_declaration') walk(n, d => { if (d.type === 'variable_declarator') { const id = d.childForFieldName('name'); if (id?.type === 'identifier') names.push([id.text, n.child(0).type]); return false; } });
    for (const [nm, kind] of names) { if (!nm) continue; const prev = seen.get(nm); if (prev && (kind === 'let' || kind === 'const' || prev.kind === 'let' || prev.kind === 'const' || kind === 'class')) issues.push({ sev: 'error', kind: '이름 충돌', msg: `${nm}: ${prev.loc}(${prev.kind}) 와 ${mainU.loc(n)}(${kind}) — 한 스크립트라 실행 시 오류` }); else if (!prev) seen.set(nm, { kind, loc: mainU.loc(n) }); } }
  return { fns, issues, tops: seen };
}
// 안 쓰는 최상위 변수·상수(함수 아닌 것)
export function unusedVars(tops, fns, allText) { const out = []; for (const [nm, v] of tops) { if (v.kind === 'function' || fns.has(nm)) continue; const n = (allText.match(new RegExp(`(?<![\\w$])${nm.replace(/\$/g, '\\$')}(?![\\w$])`, 'g')) || []).length; if (n <= 1) out.push({ name: nm, loc: v.loc }); } return out; }
// 안 쓰는 함수: 이름이 선언 말고는 어디에도(코드·문자열·HTML 템플릿) 안 나옴
export function unused(fns, allText, unitOk = u => u === 'main') { const out = []; for (const f of fns.values()) { if (!f.top || !unitOk(f.unit)) continue; const re = new RegExp(`(?<![\\w$])${f.name.replace(/\$/g, '\\$')}(?![\\w$])`, 'g'); const n = (allText.match(re) || []).length; if (n <= 1) out.push(f); } return out; }
// 이름 없는 콜백(인자로 넘긴 함수: page.evaluate(async () => {…}), addEventListener('click', e => {…}), arr.map(x => {…}))은 함수 그래프에 안 들어가
// 복잡도를 따로 잼 — 큰 익명 콜백이 측정에서 빠지던 구멍. 이름: 둘러싼 함수→부른 함수(예: runQA→page.evaluate), 같은 이름이 또 있으면 #2…
export function complexAnon(units, cc = 40, lines = 120) { const out = [];
  for (const u of units) { const seen = new Map();
    walk(u.tree.rootNode, n => { if (!FN.has(n.type) || fnName(n) || n.parent?.type !== 'arguments') return;
      const call = n.parent.parent, callee = (call?.childForFieldName('function')?.text || '?').replace(/\s+/g, '').slice(-40); let encl = null; for (let p = n.parent; p && !encl; p = p.parent) if (FN.has(p.type)) encl = fnName(p) || null;
      const loc = u.loc(n), file = loc.split(':')[0], base = `${encl || '(최상위)'}→${callee}`, sk = file + ' ' + base, k = (seen.get(sk) || 0) + 1; seen.set(sk, k); // 번호는 파일 안에서만(다른 파일에 콜백이 늘어도 이름이 안 밀리게)
      const body = n.childForFieldName('body') || n, c = complexity(body), ln = n.endPosition.row - n.startPosition.row + 1;
      if (c.cc >= cc || c.depth >= 7 || (ln >= lines && c.cc >= 10)) out.push({ name: `${base}${k > 1 ? ' #' + k : ''} @${file}`, unit: u.name, loc, cc: c.cc, lines: ln, depth: c.depth }); }); } // 줄 수만 큰 감싸기(본문이 다른 콜백 하나)는 빼요
  return out.sort((a, b) => b.cc - a.cc); }
// Tarjan SCC → 2개 이상이 서로 부르는 순환
export function cycles(fns, syncOnly = false) { let idx = 0; const st = [], on = new Set(), I = new Map(), L = new Map(), out = [];
  const sc = v => { I.set(v, idx); L.set(v, idx); idx++; st.push(v); on.add(v);
    for (const w of fns.get(v).calls.keys()) { if (syncOnly && !fns.get(v).async.has(w)) continue; if (!I.has(w)) { sc(w); L.set(v, Math.min(L.get(v), L.get(w))); } else if (on.has(w)) L.set(v, Math.min(L.get(v), I.get(w))); }
    if (L.get(v) === I.get(v)) { const c = []; let w; do { w = st.pop(); on.delete(w); c.push(w); } while (w !== v); if (c.length > 1) out.push(c); } };
  for (const k of fns.keys()) if (!I.has(k)) sc(k); return out.sort((a, b) => b.length - a.length); }
// 가장 깊은 호출 사슬(순환은 한 덩어리로)
export function deepest(fns, limit = 5) { const memo = new Map(), stack = new Set();
  const d = k => { if (memo.has(k)) return memo.get(k); if (stack.has(k)) return [k]; stack.add(k); let best = [];
    for (const w of fns.get(k).calls.keys()) { if (!fns.get(k).async.has(w)) continue; const p = d(w); if (p.length > best.length) best = p; } /* 동기 호출만 */ stack.delete(k); const r = [k, ...best]; memo.set(k, r); return r; };
  return [...fns.keys()].filter(k => !fns.get(k).callers.size).map(d).sort((a, b) => b.length - a.length).slice(0, limit); }
// 병목: 여러 곳에서 부르는(팬인) 복잡한 함수 — 바꾸면 영향이 넓고, 상태를 바꾸면 경합 지점
export function hubs(fns, mutators, limit = 15) { return [...fns.values()].map(f => ({ f, fanIn: f.callers.size, fanOut: f.calls.size, sites: [...fns.values()].reduce((a, g) => a + (g.calls.get(f.key) || 0), 0), score: f.callers.size * Math.log2(2 + f.cc), mut: mutators.has(f.key) })).filter(x => x.fanIn >= 3).sort((a, b) => b.score - a.score).slice(0, limit); }
// 순환의 멈춤 조건 추정: 본문 앞부분(첫 3문장)에 깊이·바쁨·방문·별칭 같은 검사 뒤 return이 있는 함수
export function cycleGuard(fns, cyc) { for (const k of cyc) { const b = fns.get(k)?.node.childForFieldName('body'); if (!b?.namedChildren) continue; for (const st of b.namedChildren.slice(0, 3)) { if (st.type !== 'if_statement') continue; const c = st.childForFieldName('condition')?.text || '', body = st.childForFieldName('consequence')?.text || ''; if (/return|break/.test(body) && /depth|busy|Busy|seen|visited|guard|alias|>=|\.length|!==?\s*\w+|===?\s*null/.test(c)) return `${fns.get(k).name}: if${c.slice(0, 50)}`; } } return ''; }
