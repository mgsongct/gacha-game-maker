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

export function buildGraph(units) {
  const fns = new Map(), byUnit = new Map(), issues = [];
  for (const u of units) {
    const local = new Map(); byUnit.set(u.name, local);
    walk(u.tree.rootNode, n => { if (!FN.has(n.type)) return; const name = fnName(n); if (!name) return;
      const key = u.name === 'main' ? name : `${u.name}#${name}`, body = n.childForFieldName('body') || n, top = n.parent?.type === 'program' || n.parent?.parent?.parent?.type === 'program';
      const { cc, depth } = complexity(body), rec = { key, name, unit: u.name, loc: u.loc(n), lines: n.endPosition.row - n.startPosition.row + 1, cc, depth, node: n, calls: new Map(), async: new Set() /* 동기로 부르는 대상 */, callers: new Set(), top };
      if (u.name === 'main' && top && fns.has(key) && fns.get(key).top) issues.push({ sev: 'error', kind: '중복 정의', msg: `${name}: ${fns.get(key).loc} 와 ${rec.loc} 에 두 번 정의(뒤의 것이 앞을 덮어씀)` });
      if (!fns.has(key) || top) { fns.set(key, rec); local.set(name, rec); } });
  }
  // 호출: 가장 안쪽 함수에 붙인다
  // 타이머·프로미스·이벤트 콜백 안의 호출은 비동기 간선(콜스택 깊이에서 뺌)
  const ASYNC = /^(setTimeout|setInterval|requestAnimationFrame|queueMicrotask)$|\.(then|catch|finally|addEventListener)$/;
  const owner = (u, n) => { let as = false; for (let p = n.parent; p; p = p.parent) if (FN.has(p.type)) { const call = p.parent?.type === 'arguments' ? p.parent.parent : null; if (call?.type === 'call_expression' && ASYNC.test(call.childForFieldName('function')?.text || '')) as = true; const nm = fnName(p); if (nm) { const f = byUnit.get(u.name).get(nm) || fns.get(nm); return f ? { f, as } : null; } } return null; };
  for (const u of units) walk(u.tree.rootNode, n => { if (n.type !== 'call_expression') return; const f = n.childForFieldName('function'); if (f?.type !== 'identifier') return;
    const to = byUnit.get(u.name).get(f.text) || fns.get(f.text); if (!to) return; const o = owner(u, n); if (!o || o.f === to) return; const from = o.f;
    from.calls.set(to.key, (from.calls.get(to.key) || 0) + 1); to.callers.add(from.key); if (!o.as) from.async.add(to.key); }); /* async 집합 = 동기로 부르는 대상 */
  // main 최상위 이름 충돌(let/const 중복은 실행 시 SyntaxError)
  const mainU = units.find(u => u.name === 'main'), seen = new Map();
  for (let i = 0; i < mainU.tree.rootNode.childCount; i++) { const n = mainU.tree.rootNode.child(i), names = [];
    if (n.type === 'function_declaration' || n.type === 'class_declaration') names.push([n.childForFieldName('name')?.text, n.type === 'class_declaration' ? 'class' : 'function']);
    else if (n.type === 'lexical_declaration' || n.type === 'variable_declaration') walk(n, d => { if (d.type === 'variable_declarator') { const id = d.childForFieldName('name'); if (id?.type === 'identifier') names.push([id.text, n.child(0).type]); return false; } });
    for (const [nm, kind] of names) { if (!nm) continue; const prev = seen.get(nm); if (prev && (kind === 'let' || kind === 'const' || prev.kind === 'let' || prev.kind === 'const' || kind === 'class')) issues.push({ sev: 'error', kind: '이름 충돌', msg: `${nm}: ${prev.loc}(${prev.kind}) 와 ${mainU.loc(n)}(${kind}) — 한 스크립트라 실행 시 오류` }); else if (!prev) seen.set(nm, { kind, loc: mainU.loc(n) }); } }
  return { fns, issues, tops: seen };
}
// 안 쓰는 최상위 변수·상수(함수 아닌 것)
export function unusedVars(tops, fns, allText) { const out = []; for (const [nm, v] of tops) { if (v.kind === 'function' || fns.has(nm)) continue; const n = (allText.match(new RegExp(`(?<![\\w$])${nm.replace(/\$/g, '\\$')}(?![\\w$])`, 'g')) || []).length; if (n <= 1) out.push({ name: nm, loc: v.loc }); } return out; }
// 안 쓰는 함수: 이름이 선언 말고는 어디에도(코드·문자열·HTML 템플릿) 안 나옴
export function unused(fns, allText) { const out = []; for (const f of fns.values()) { if (!f.top || f.unit !== 'main') continue; const re = new RegExp(`(?<![\\w$])${f.name.replace(/\$/g, '\\$')}(?![\\w$])`, 'g'); const n = (allText.match(re) || []).length; if (n <= 1) out.push(f); } return out; }
// Tarjan SCC → 2개 이상이 서로 부르는 순환
export function cycles(fns) { let idx = 0; const st = [], on = new Set(), I = new Map(), L = new Map(), out = [];
  const sc = v => { I.set(v, idx); L.set(v, idx); idx++; st.push(v); on.add(v);
    for (const w of fns.get(v).calls.keys()) { if (!I.has(w)) { sc(w); L.set(v, Math.min(L.get(v), L.get(w))); } else if (on.has(w)) L.set(v, Math.min(L.get(v), I.get(w))); }
    if (L.get(v) === I.get(v)) { const c = []; let w; do { w = st.pop(); on.delete(w); c.push(w); } while (w !== v); if (c.length > 1) out.push(c); } };
  for (const k of fns.keys()) if (!I.has(k)) sc(k); return out.sort((a, b) => b.length - a.length); }
// 가장 깊은 호출 사슬(순환은 한 덩어리로)
export function deepest(fns, limit = 5) { const memo = new Map(), stack = new Set();
  const d = k => { if (memo.has(k)) return memo.get(k); if (stack.has(k)) return [k]; stack.add(k); let best = [];
    for (const w of fns.get(k).calls.keys()) { if (!fns.get(k).async.has(w)) continue; const p = d(w); if (p.length > best.length) best = p; } /* 동기 호출만 */ stack.delete(k); const r = [k, ...best]; memo.set(k, r); return r; };
  return [...fns.keys()].filter(k => !fns.get(k).callers.size).map(d).sort((a, b) => b.length - a.length).slice(0, limit); }
// 병목: 여러 곳에서 부르는(팬인) 복잡한 함수 — 바꾸면 영향이 넓고, 상태를 바꾸면 경합 지점
export function hubs(fns, mutators, limit = 15) { return [...fns.values()].map(f => ({ f, fanIn: f.callers.size, fanOut: f.calls.size, sites: [...fns.values()].reduce((a, g) => a + (g.calls.get(f.key) || 0), 0), score: f.callers.size * Math.log2(2 + f.cc), mut: mutators.has(f.key) })).filter(x => x.fanIn >= 3).sort((a, b) => b.score - a.score).slice(0, limit); }
