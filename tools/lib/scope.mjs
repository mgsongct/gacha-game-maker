// 이름 범위(정적 분석): 식 하나가 쓰는 바깥 이름(자유 변수)을 그 자리의 지역 이름과 최상위·전역 이름으로 가름.
//   식을 다른 파일의 함수로 옮길 때(tools/prompts-move.mjs --req) 지역 이름만 인자로 넘기면 뜻이 같음 — 그 판단의 근거.
//   moduleOf: 모듈 단위 — src/main의 폴더(예: 0510-actions/)는 폴더 전체가 한 모듈, 그 밖은 파일 하나가 한 모듈(docs/build.md §2)
import { walk } from './source.mjs';

export const moduleOf = path => { const m = /^(src\/main\/[^/]+\/)/.exec(String(path)); return m ? m[1] : String(path).split(':')[0]; };
export const inModule = (loc, mod) => mod && moduleOf(String(loc).split(':')[0]) === mod;

const FN = new Set(['function_declaration', 'function_expression', 'arrow_function', 'method_definition', 'generator_function_declaration', 'generator_function']);
// 바인딩 패턴의 이름: a · {a, b: c, d = 1} · [a, ...b] · a = 기본값
export function patternNames(p, out = []) { if (!p) return out;
  switch (p.type) {
    case 'identifier': case 'shorthand_property_identifier_pattern': out.push(p.text); break;
    case 'assignment_pattern': patternNames(p.childForFieldName('left'), out); break;
    case 'pair_pattern': patternNames(p.childForFieldName('value'), out); break;
    case 'rest_pattern': case 'object_pattern': case 'array_pattern': case 'formal_parameters': p.namedChildren.forEach(c => patternNames(c, out)); break;
    case 'object_assignment_pattern': patternNames(p.childForFieldName('left'), out); break;
  }
  return out; }
const params = f => f.type === 'arrow_function' && f.childForFieldName('parameter') ? [f.childForFieldName('parameter').text] : patternNames(f.childForFieldName('parameters'));
// 블록이 곧바로 선언하는 이름(let·const·var·function·class) — var는 중첩 블록 것도(함수 범위)
function blockNames(b, fnScope) { const out = [];
  const visit = n => { for (const c of n.namedChildren) {
    if (c.type === 'lexical_declaration' || c.type === 'variable_declaration') c.namedChildren.filter(d => d.type === 'variable_declarator').forEach(d => patternNames(d.childForFieldName('name'), out));
    else if (c.type === 'function_declaration' || c.type === 'class_declaration' || c.type === 'generator_function_declaration') { const nm = c.childForFieldName('name'); if (nm) out.push(nm.text); }
    if (fnScope && !FN.has(c.type) && c.type !== 'class_declaration') walkVar(c); } };
  const walkVar = n => walk(n, m => { if (FN.has(m.type)) return false; if (m.type === 'variable_declaration') m.namedChildren.filter(d => d.type === 'variable_declarator').forEach(d => patternNames(d.childForFieldName('name'), out)); });
  visit(b); return out; }
// node 자리에서 name이 지역 이름인지(최상위 program 범위가 아닌 곳에서 묶였는지). stop: 이 노드에 닿으면 멈춤(식 안의 범위만 볼 때)
function boundBetween(node, name, stop) {
  for (let p = node.parent; p && (!stop || p.id !== stop.id); p = p.parent) { // 노드 객체는 접근마다 새로 만들어져 id로 비교
    if (FN.has(p.type)) { if (params(p).includes(name)) return true; const nm = p.type === 'function_expression' ? p.childForFieldName('name') : null; if (nm && nm.text === name) return true; }
    if (p.type === 'statement_block') { const fnBody = FN.has(p.parent?.type); if (blockNames(p, fnBody).includes(name)) return true; }
    if (p.type === 'catch_clause' && patternNames(p.childForFieldName('parameter')).includes(name)) return true;
    if (p.type === 'for_statement') { const init = p.childForFieldName('initializer'); if (init && /declaration$/.test(init.type) && init.namedChildren.some(d => d.type === 'variable_declarator' && patternNames(d.childForFieldName('name')).includes(name))) return true; }
    if (p.type === 'for_in_statement' && p.childForFieldName('kind') && patternNames(p.childForFieldName('left')).includes(name)) return true;
  }
  return false; }
// 식 expr이 쓰는 바깥 이름: locals(그 자리 지역 이름 — 넘겨야 함) · globals(최상위·전역) · writes(바깥 이름에 씀 — 옮기면 뜻이 바뀜) · await · this
export function freeNames(expr) { const refs = new Map(), writes = new Set(); let hasAwait = false, hasThis = false;
  const isBinding = n => { const p = n.parent; if (!p) return false;
    if (p.type === 'variable_declarator' && p.childForFieldName('name')?.id === n.id) return true;
    if ((p.type === 'function_declaration' || p.type === 'function_expression' || p.type === 'class_declaration') && p.childForFieldName('name')?.id === n.id) return true;
    if (p.type === 'arrow_function' && p.childForFieldName('parameter')?.id === n.id) return true;
    for (let q = p; q && q.id !== expr.id; q = q.parent) { if (q.type === 'formal_parameters') return true; if (/_pattern$/.test(q.type) && q.type !== 'assignment_pattern') return true; if (q.type === 'assignment_pattern' && q.childForFieldName('right') && n.startIndex >= q.childForFieldName('right').startIndex) break; }
    return false; };
  walk(expr, n => {
    if (n.type === 'await_expression') { let f = n.parent; while (f && f.id !== expr.id && !FN.has(f.type)) f = f.parent; if (!f || f.id === expr.id) hasAwait = true; }
    if (n.type === 'this' || (n.type === 'identifier' && n.text === 'arguments')) { let f = n.parent; while (f && f.id !== expr.id && !(FN.has(f.type) && f.type !== 'arrow_function')) f = f.parent; if (!f || f.id === expr.id) hasThis = true; }
    if (n.type !== 'identifier' && n.type !== 'shorthand_property_identifier') return;
    if (n.type === 'identifier' && isBinding(n)) return;
    if (boundBetween(n, n.text, expr.parent)) return; // 식 안에서 묶인 이름(콜백 인자 등)
    if (!refs.has(n.text)) refs.set(n.text, n);
    const p = n.parent; if ((p.type === 'assignment_expression' || p.type === 'augmented_assignment_expression') && p.childForFieldName('left')?.id === n.id || p.type === 'update_expression') writes.add(n.text); });
  const locals = [], globals = [];
  for (const [name, n] of refs) (boundBetween(expr, name, null) ? locals : globals).push(name);
  return { locals, globals, writes: [...writes].filter(w => locals.includes(w)), hasAwait, hasThis }; }
// 지역 이름 ref의 값이 되는 식: 그 이름을 묶은 블록 안의 선언 값·대입 오른쪽(인자로 묶였거나 최상위면 없음 — 부르는 쪽·최상위 선언이 값)
export function localDefs(ref) { const name = ref.text; let scope = null;
  for (let p = ref.parent; p && !scope; p = p.parent) {
    if (FN.has(p.type) && params(p).includes(name)) return [];
    if (p.type === 'statement_block' && blockNames(p, FN.has(p.parent?.type)).includes(name)) scope = p;
    if (p.type === 'program') return []; }
  if (!scope) return []; const out = [];
  walk(scope, n => { if (n.id !== scope.id && FN.has(n.type) && params(n).includes(name)) return false; /* 안쪽 함수가 같은 이름을 다시 묶음 */
    if (n.type === 'variable_declarator' && n.childForFieldName('name')?.type === 'identifier' && n.childForFieldName('name').text === name && n.childForFieldName('value')) out.push(n.childForFieldName('value'));
    if ((n.type === 'assignment_expression' || n.type === 'augmented_assignment_expression') && n.childForFieldName('left')?.type === 'identifier' && n.childForFieldName('left').text === name) out.push(n.childForFieldName('right'));
    if (n.type === 'call_expression') { const f = n.childForFieldName('function'); if (f?.type === 'member_expression' && f.childForFieldName('object')?.text === name && /^(push|unshift)$/.test(f.childForFieldName('property')?.text || '')) out.push(...n.childForFieldName('arguments').namedChildren); } }); // 배열에 넣은 글
  return out; }
// 정의 안 된 이름(ReferenceError 후보): 프로그램 하나를 두 번 훑어(① 범위마다 선언 모음 — var·function은 함수 범위로 끌어올림, let·const·class는 블록, 매개변수·catch·for 머리 ② 범위 사슬로 참조 풀기)
//   어느 범위에도 묶이지 않은 참조 이름을 돌려줌(그 프로그램 맨 위 선언은 묶임 — 여러 스크립트가 나눠 쓰는 전역은 부르는 쪽이 따로 맞춤). typeof X는 없어도 안전해서 뺌
const FN_ALL = new Set([...FN, 'generator_function_declaration', 'generator_function']), DECL_NAMED = new Set(['function_declaration', 'generator_function_declaration', 'class_declaration']), BLOCKS = new Set(['statement_block', 'switch_body', 'for_statement', 'class_body']);
const declNames = n => n.namedChildren.filter(d => d.type === 'variable_declarator').flatMap(d => patternNames(d.childForFieldName('name')));
// 노드 하나가 선언하는 이름을 범위에 넣고, 아래로 내려갈 때의 [함수 범위, 블록 범위]
function declare(n, fs, bs, add) { const t = n.type, nm = n.childForFieldName('name');
  if (DECL_NAMED.has(t) && nm) add(bs, [nm.text]);
  if (FN_ALL.has(t)) { add(n, params(n)); if ((t === 'function_expression' || t === 'generator_function') && nm) add(n, [nm.text]); return [n, n]; }
  if (t === 'class' && nm) { add(n, [nm.text]); return [fs, n]; }
  if (BLOCKS.has(t)) return [fs, n];
  if (t === 'catch_clause') { add(n, patternNames(n.childForFieldName('parameter'))); return [fs, n]; }
  if (t === 'for_in_statement') { const k = n.childForFieldName('kind')?.text, names = patternNames(n.childForFieldName('left')); if (k === 'var') add(fs, names); else if (k) { add(n, names); return [fs, n]; } }
  if (t === 'variable_declaration') add(fs, declNames(n)); else if (t === 'lexical_declaration') add(bs, declNames(n));
  return [fs, bs]; }
export function unboundRefs(root) { const decl = new Map(), add = (s, names) => { let x = decl.get(s.id); if (!x) decl.set(s.id, x = new Set()); for (const n of names) x.add(n); };
  const p1 = (n, fs, bs) => { const [f2, b2] = declare(n, fs, bs, add); for (const c of n.namedChildren) p1(c, f2, b2); };
  p1(root, root, root);
  const out = [], stack = [], p2 = n => { const s = decl.get(n.id); if (s) stack.push(s); const t = n.type;
    if ((t === 'identifier' || t === 'shorthand_property_identifier') && !(n.parent?.type === 'unary_expression' && n.parent.child(0)?.type === 'typeof') && n.text !== 'arguments') { let ok = false; for (let i = stack.length - 1; i >= 0 && !ok; i--) ok = stack[i].has(n.text); if (!ok) out.push(n); }
    for (const c of n.namedChildren) p2(c); if (s) stack.pop(); };
  p2(root); return { refs: out, top: decl.get(root.id) || new Set() }; }
