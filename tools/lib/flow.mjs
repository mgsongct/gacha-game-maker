// 데이터 ↔ 화면 흐름: ① 화면 액션(data-act) 발신·처리 짝 ② 상태(G·P()) 변경과 저장 표시(mark) ③ 상태 키별 쓰는 곳·읽는 화면
import { walk } from './source.mjs';

const ACT_VAR = /^(a|act)$|\.dataset\.act$/;
const ownerFn = (fns, unit, n) => { for (let p = n.parent; p; p = p.parent) if (/function|arrow_function|method_definition/.test(p.type)) { const nm = p.type === 'function_declaration' ? p.childForFieldName('name')?.text : p.parent?.type === 'variable_declarator' ? p.parent.childForFieldName('name')?.text : null; if (nm) return fns.get(unit.name === 'main' ? nm : `${unit.name}#${nm}`) || null; } return null; };
const strVal = n => n && (n.type === 'string' ? n.text.slice(1, -1) : null);

// ① 액션
// 처리기로 보는 것: switch(a|act|…)의 case, a==='x' 비교, ['x'].includes(a), closest('[data-act="x"]') 선택자. 발신: data-act="x"(템플릿·문자열), dataset.act='x'
// 같은 액션을 문서 전역 리스너 여러 곳에서 처리하면 경고(특정 요소·대화상자에 붙인 리스너는 그 화면 안에서만 돌아서 제외)
const scopeOf = n => { for (let p = n.parent; p; p = p.parent) if (p.type === 'call_expression') { const f = p.childForFieldName('function'); if (f?.type === 'member_expression' && f.childForFieldName('property')?.text === 'addEventListener') { const o = f.childForFieldName('object')?.text, ev = strVal(p.childForFieldName('arguments')?.namedChild(0)) || '?'; return /^(document|window)$/.test(o) ? 'global:' + ev : 'scoped'; } } return 'global:click'; }; // 이벤트 종류별로 비교(pointerdown 쓰다듬기와 click 터치는 다른 동작)
export function actions(units, extraHTML = '') {
  const emit = new Map(), handle = new Map(), emitArg = [], add = (m, k, v) => { if (!m.has(k)) m.set(k, []); m.get(k).push(v); };
  for (const u of units) {
    const t = u.text, lineOf = i => u.at(t.slice(0, i).split('\n').length - 1), actVars = new Set(['a', 'act']);
    const declAt = new Set(); // '함수시작:이름' — 그 함수 안에서 dataset.act로 만든 변수
    const fnOf = n => { for (let p = n.parent; p; p = p.parent) if (/function|arrow_function|method_definition/.test(p.type)) return p; return null; };
    walk(u.tree.rootNode, n => { if (n.type === 'variable_declarator' && /\.dataset\.act$/.test(n.childForFieldName('value')?.text || '')) { const nm = n.childForFieldName('name')?.text; actVars.add(nm); declAt.add(`${fnOf(n)?.startIndex}:${nm}`); } });
    const isActVar = x => { if (!x) return false; if (/\.dataset\.act$/.test(x.text)) return true; if (x.type !== 'identifier') return false; for (let f = fnOf(x); f; f = fnOf(f)) if (declAt.has(`${f.startIndex}:${x.text}`)) return true; return false; };
    for (const m of t.matchAll(/data-act=\\?["']([a-z0-9_-]+)\\?["']/gi)) { const before = t.slice(Math.max(0, m.index - 12), m.index); const p = lineOf(m.index); if (/closest\(\s*['"`]\[$|querySelector(All)?\(\s*['"`]\[$/.test(before)) { add(handle, m[1], { site: `${u.name}@sel:${m.index}`, loc: `${p.file}:${p.line}`, sel: true }); continue; } add(emit, m[1], `${p.file}:${p.line}`); }
    for (const m of t.matchAll(/data-act=\\?"\$\{([^}]{1,200})\}\\?"/g)) { const p = lineOf(m.index); for (const s of m[1].matchAll(/'([a-z0-9_-]+)'/gi)) add(emit, s[1], `${p.file}:${p.line}`); }
    // 도우미 함수가 받은 인자로 data-act를 만드는 경우: ico('daily',…) → function ico(act,…){ …data-act="${act}"… }
    walk(u.tree.rootNode, n => { if (!/function_declaration|arrow_function|function_expression/.test(n.type)) return; const ps = n.childForFieldName('parameters'), one = n.childForFieldName('parameter'), names = one ? [one.text] : (ps ? ps.namedChildren.map(c => c.type === 'identifier' ? c.text : c.type === 'assignment_pattern' ? c.childForFieldName('left')?.text : null) : []);
      const body = n.childForFieldName('body')?.text || ''; names.forEach((pn, i) => { if (pn && new RegExp(`data-act=\\\\?"\\$\\{${pn}\\}`).test(body)) { const nm = n.type === 'function_declaration' ? n.childForFieldName('name')?.text : n.parent?.type === 'variable_declarator' ? n.parent.childForFieldName('name')?.text : null; if (nm) emitArg.push([nm, i]); } }); });
    for (const m of t.matchAll(/dataset\.act\s*=\s*['"]([a-z0-9_-]+)['"]/gi)) { const p = lineOf(m.index); add(emit, m[1], `${p.file}:${p.line}`); }
    const swAct = x => !!x && (/^(a|act)$/.test(x.text) || isActVar(x)); // switch(a)·switch(act)는 액션 분배기 관례
    const actSwitch = n => { for (let p = n.parent; p; p = p.parent) if (p.type === 'switch_statement' && swAct(p.childForFieldName('value')?.namedChild(0) || p.childForFieldName('value'))) return p; return null; };
    walk(u.tree.rootNode, n => {
      if (n.type === 'switch_case') { const v = strVal(n.childForFieldName('value')); if (!v) return; const sw = actSwitch(n); if (sw && sw.startIndex === n.parent?.parent?.startIndex) add(handle, v, { site: `${u.name}@switch:${sw.startIndex}`, loc: u.loc(n), scope: scopeOf(sw) }); }
      else if (n.type === 'binary_expression' && /^(===|==)$/.test(n.childForFieldName('operator')?.type)) { const l = n.childForFieldName('left'), r = n.childForFieldName('right'), v = strVal(r) ?? strVal(l), o = strVal(r) != null ? l : r; const sw = v && swAct(o) ? actSwitch(n) : null; if (v && (isActVar(o) || (sw && swAct(o)))) { let f = n.parent; while (f && !/function|arrow_function/.test(f.type)) f = f.parent; add(handle, v, { site: sw ? `${u.name}@switch:${sw.startIndex}` : `${u.name}@fn:${f ? f.startIndex : 0}`, loc: u.loc(n), scope: scopeOf(n) }); } }
      else if (n.type === 'call_expression') { const f = n.childForFieldName('function'); if (f?.type === 'member_expression' && f.childForFieldName('property')?.text === 'includes' && isActVar(n.childForFieldName('arguments')?.namedChild(0))) { const arr = f.childForFieldName('object'); if (arr?.type === 'array') arr.namedChildren.forEach(s => { const v = strVal(s); if (v) add(handle, v, { site: `${u.name}@incl:${n.startIndex}`, loc: u.loc(n), guard: true }); }); } }
    });
  }
  for (const m of extraHTML.matchAll(/data-act=["']?([a-z0-9_-]+)/gi)) add(emit, m[1], 'src/index.html');
  // 분배 표(예: APP_ACTION_HANDLERS = {"act": handleXAction}) ↔ 그 처리기 switch의 case 대조
  const reg = [], cases = new Map(); // 함수명 → Set(case)
  for (const u of units) walk(u.tree.rootNode, n => {
    if (n.type === 'switch_case') { const v = strVal(n.childForFieldName('value')); if (!v) return; let f = n.parent; while (f && f.type !== 'function_declaration') f = f.parent; const nm = f?.childForFieldName('name')?.text; if (nm) { if (!cases.has(nm)) cases.set(nm, new Map()); cases.get(nm).set(v, u.loc(n)); } }
    if (n.type === 'object') { const pairs = n.namedChildren.filter(c => c.type === 'pair'); if (pairs.length < 20) return; const ok = pairs.filter(pr => strVal(pr.childForFieldName('key')) && pr.childForFieldName('value')?.type === 'identifier'); if (ok.length < pairs.length * .9) return; ok.forEach(pr => reg.push({ act: strVal(pr.childForFieldName('key')), fn: pr.childForFieldName('value').text, loc: u.loc(pr) })); } });
  const regFns = new Set(reg.map(r => r.fn)), regMap = new Map(reg.map(r => [r.act, r]));
  const regMissing = reg.filter(r => cases.has(r.fn) && !cases.get(r.fn).has(r.act)).map(r => ({ act: r.act, fn: r.fn, loc: r.loc }));
  const regOrphan = []; for (const fn of regFns) for (const [v, loc] of cases.get(fn) || []) { const r = regMap.get(v); if (!r || r.fn !== fn) regOrphan.push({ act: v, fn, loc, to: r ? r.fn : null }); }
  for (const u of units) walk(u.tree.rootNode, n => { if (n.type !== 'call_expression') return; const f = n.childForFieldName('function'); if (f?.type !== 'identifier') return; for (const [nm, i] of emitArg) if (nm === f.text) { const v = strVal(n.childForFieldName('arguments')?.namedChild(i)); if (v) add(emit, v, u.loc(n) + ' (' + nm + ')'); } });
  const missing = [...emit.keys()].filter(k => !handle.has(k)).map(k => ({ act: k, at: [...new Set(emit.get(k))].slice(0, 3) }));
  const deadH = [...handle.keys()].filter(k => !emit.has(k)).map(k => ({ act: k, at: handle.get(k).slice(0, 2).map(h => h.loc) }));
  const multi = [...handle.entries()].map(([k, hs]) => { const g = hs.filter(h => !h.guard && h.scope !== 'scoped'), by = new Map(); g.forEach(h => { const k2 = h.scope || 'global:click'; if (!by.has(k2)) by.set(k2, []); by.get(k2).push(h); }); const worst = [...by.values()].sort((x, y) => new Set(y.map(h => h.site)).size - new Set(x.map(h => h.site)).size)[0] || []; return { act: k, sites: [...new Set(worst.map(h => h.site))], locs: worst.map(h => h.loc) }; }).filter(x => x.sites.length > 1);
  return { emitted: emit.size, handled: handle.size, missing, deadH, multi, registry: reg.length, regMissing, regOrphan };
}

// ② 상태 변경 · 저장 표시
const ROOT_OF = n => { let x = n; while (x && (x.type === 'member_expression' || x.type === 'subscript_expression')) x = x.childForFieldName('object'); return x; };
const isState = n => { const r = ROOT_OF(n); return r && (r.text === 'G' || (r.type === 'call_expression' && r.text === 'P()')); };
const SAVE = new Set(['mark', 'markAll', 'flush', 'save', 'saveNow', 'storeImage', 'storeAudio']);
export function mutations(units, fns) {
  const mut = new Map(); // key → [{loc,what}]
  for (const u of units) { if (u.name !== 'main') continue; walk(u.tree.rootNode, n => { let target = null;
    if (n.type === 'assignment_expression' || n.type === 'augmented_assignment_expression') target = n.childForFieldName('left');
    else if (n.type === 'update_expression') target = n.childForFieldName('argument');
    else if (n.type === 'unary_expression' && n.child(0)?.type === 'delete') target = n.childForFieldName('argument');
    else if (n.type === 'call_expression') { const f = n.childForFieldName('function'); if (f?.type === 'member_expression' && /^(push|splice|unshift|pop|shift|sort|reverse)$/.test(f.childForFieldName('property')?.text || '')) target = f.childForFieldName('object'); }
    if (!target || (target.type !== 'member_expression' && target.type !== 'subscript_expression') || !isState(target) || /\.__/.test(target.text)) return; /* G.__임시 값은 저장 대상 아님 */
    const f = ownerFn(fns, u, n); if (!f) return; if (!mut.has(f.key)) mut.set(f.key, []); mut.get(f.key).push({ loc: u.loc(n), what: target.text.slice(0, 60) }); }); }
  const saves = k => [...fns.get(k).calls.keys()].some(c => SAVE.has(fns.get(c)?.name));
  const unsaved = [...mut.entries()].filter(([k]) => !/^[A-Z_]+$/.test(fns.get(k).name) /* PLAN()·SCHED() 같은 대문자 접근자는 기본값 지연 생성 */ && !saves(k) && ![...fns.get(k).callers].some(saves) && !SAVE.has(fns.get(k).name)).map(([k, v]) => ({ fn: fns.get(k), n: v.length, ex: v[0] }));
  return { mut, unsaved };
}

// ③ 상태 키 흐름: G.meta.x · G.world.x · G.x · P().x 를 쓰는 함수와 읽는 함수(화면 함수 표시)
const SCREEN = /HTML$|Panel$|^render|^open[A-Z]|Draw$|^draw[A-Z]|^show[A-Z]/;
export function stateFlow(units, fns) {
  const keys = new Map(), K = k => { if (!keys.has(k)) keys.set(k, { w: new Set(), r: new Set(), wl: [] }); return keys.get(k); };
  const BASES = { 'G.meta': 'G.meta', 'G.world': 'G.world', 'G': 'G', 'P()': 'P()', 'G.prog': 'P()' } /* G.prog는 P()와 같은 객체 */, fnAt = n => { for (let x = n.parent; x; x = x.parent) if (/function|arrow_function|method_definition/.test(x.type)) return x; return null; };
  for (const u of units) { if (u.name !== 'main') continue; const alias = new Map(); // '함수시작:이름' → 'P()' 등 (const p=P(), w=G.world …)
    walk(u.tree.rootNode, n => { if (n.type === 'variable_declarator') { const v = n.childForFieldName('value')?.text, nm = n.childForFieldName('name'); if (nm?.type === 'identifier' && BASES[v] && v !== 'G') alias.set(`${fnAt(n)?.startIndex}:${nm.text}`, BASES[v]); } });
    const aliasOf = id => { for (let f = fnAt(id); f; f = fnAt(f)) { const b = alias.get(`${f.startIndex}:${id.text}`); if (b) return b; } return null; };
    walk(u.tree.rootNode, n => { if (n.type !== 'member_expression') return; const o = n.childForFieldName('object'), p = n.childForFieldName('property'); if (!o || !p) return;
    const base = BASES[o.text] || (o.type === 'identifier' ? aliasOf(o) : null); if (!base || n.parent?.type === 'member_expression' && n.parent.childForFieldName('object')?.startIndex === n.startIndex && base === 'G' && /^(meta|world)$/.test(p.text)) return;
    const key = `${base}.${p.text}`, f = ownerFn(fns, u, n), par = n.parent, write = (par?.type === 'assignment_expression' || par?.type === 'augmented_assignment_expression') && par.childForFieldName('left')?.startIndex === n.startIndex; /* tree-sitter 노드는 매번 새 객체라 위치로 비교 */
    const rec = K(key); if (write) { if (f) rec.w.add(f.key); rec.wl.push(u.loc(n)); } else if (f) rec.r.add(f.key); }); }
  const seen = r => SCREEN.test(r) || [...(fns.get(r)?.callers || [])].some(c => SCREEN.test(c)); // 화면 함수가 직접 읽거나, 읽는 함수를 화면 함수가 부름
  const list = [...keys.entries()].map(([k, v]) => ({ key: k, writers: v.w.size, readers: v.r.size, screens: [...v.r].filter(seen).length, w: v.w, r: v.r, wl: v.wl }));
  return { list, writeOnly: list.filter(x => (x.writers || x.wl.length) && !x.readers), scattered: list.filter(x => x.writers >= 8).sort((a, b) => b.writers - a.writers), noScreen: list.filter(x => x.readers && !x.screens && x.key.startsWith('G.meta.') && [...x.w].some(w => /^handle\w+Action$/.test(w) || SCREEN.test(w))) }; /* 사용자가 화면에서 바꾸는 설정인데 어느 화면도 안 보여 줌(생성기·이전용 내부 표시는 제외) */
}
export function mermaid(flow, limit = 18) { const top = flow.list.filter(x => x.writers && x.screens).sort((a, b) => (b.writers + b.screens) - (a.writers + a.screens)).slice(0, limit), id = s => s.replace(/[^\w]/g, '_');
  const L = ['flowchart LR']; top.forEach(x => { L.push(`  ${id(x.key)}[("${x.key}")]`); [...x.w].slice(0, 5).forEach(w => L.push(`  ${id(w)}["${w}"] --> ${id(x.key)}`)); [...x.r].filter(r => SCREEN.test(r)).slice(0, 5).forEach(r => L.push(`  ${id(x.key)} --> ${id(r)}(["${r}"])`)); }); return L.join('\n'); }
