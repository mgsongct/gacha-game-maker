// 프롬프트 스튜디오 밖 프롬프트 글(정적 분석): 글 AI에 보내는 지시문이 스튜디오 조각(pfDef)이 아니라 코드에 직접 들어 있는 곳.
// 프롬프트는 프롬프트 스튜디오로 따로 관리(사용자 지시) — 조각이면 게임마다 덮어쓰기·덧붙이기·AI 다듬기가 되지만, 코드에 직접 쓴 문장은 못 고침.
// 범위: 글 AI 호출(aiJSON·aiJSONRetry·aiCall·SAMPLE.json과, 받은 인자를 그대로 넘기는 감싸기 함수)의 프롬프트 인자,
//       그 안에서 부르거나 가리키는 최상위 함수·상수(프롬프트 조립 — ctx·charSchema 등, 5단계까지). 화면 글·샘플 이야기는 프롬프트로 가지 않으면 셈하지 않음.
// 지시문은 해라체(…한다·…쓴다·…않는다·…하라·JSON만 출력)라 데이터 글과 갈림. pfDef에 등록된 기본값(getter가 가리키는 함수·상수)은 스튜디오 조각이라 뺌.
import { walk } from './source.mjs';

// 해라체 판별: 받침 ㄴ 음절 + 다(…한다·…는다·…쓴다) · 이다·아니다 · …하라/…어라 · 명사로 끝낸 지시(…금지·…필수). 해요체(화면 글)는 걸리지 않음.
// "JSON만 출력"은 지시문이 아니라 표식(llmWrap이 지침·교훈을 그 앞에 끼우고 aiJSON이 형식을 찾음 — 코드가 의존)이라 셈하지 않음
export const imperative = t => /(하라|써라|어라|아라|여라)(?=[.)\s"'`,:;]|$)|[가-힣\s](금지|필수)(?=[.)\s,;]|$)/.test(t.replace(/JSON만 출력[^\n]*/g, '')) || [...t.replace(/JSON만 출력[^\n]*/g, '').matchAll(/([가-힣])다(?=[.)\s"'`,(:;—]|$)/g)].some(m => { const c = m[1].charCodeAt(0) - 0xAC00; return c % 28 === 4 || m[1] === '이' || m[1] === '니'; });
const AI_CALLS = new Set(['aiJSON', 'aiJSONRetry', 'aiCall', 'SAMPLE.json']);
const FN = new Set(['function_declaration', 'arrow_function', 'function_expression', 'method_definition']);
const declName = n => { if (n.type === 'function_declaration') return n.childForFieldName('name')?.text;
  if (n.type === 'lexical_declaration' || n.type === 'variable_declaration') return n.namedChildren.find(c => c.type === 'variable_declarator')?.childForFieldName('name')?.text;
  return null; };
const topOf = n => { while (n.parent && n.parent.type !== 'program') n = n.parent; return n; };
// 글이 속한 이름: 가장 가까운 이름 있는 함수(모듈 IIFE 안 함수 포함), 없으면 최상위 선언
const ownerOf = n => { for (let p = n.parent; p; p = p.parent) { if (p.type === 'function_declaration') return p.childForFieldName('name')?.text; if (p.type === 'variable_declarator' && /function|arrow_function/.test(p.childForFieldName('value')?.type || '') && p.parent?.parent?.type === 'program') return p.childForFieldName('name')?.text; } return declName(topOf(n)); };
// 따라갈 이름: 불린 함수, 또는 글(문자열·템플릿·그 연결·화살표 함수)을 값으로 가진 상수 — 배열·객체 데이터(샘플 게임 등)는 프롬프트 조립이 아님
const assembles = (n, t) => { if (n.parent?.type === 'call_expression' && n.parent.childForFieldName('function')?.id === n.id) return true; // 노드 객체는 접근마다 새로 만들어져 id로 비교 if (t.node.type === 'function_declaration') return false;
  const v = t.node.namedChildren.find(c => c.type === 'variable_declarator')?.childForFieldName('value'); return /^(string|template_string|binary_expression|arrow_function|function_expression)$/.test(v?.type || ''); };
const callee = n => n.childForFieldName('function')?.text;
// pfDef(id, label, get): get이 가리키는 이름 — 조각 기본값 선언
function fragBases(units) { const out = new Set();
  for (const u of units) walk(u.tree.rootNode, n => { if (n.type !== 'call_expression' || callee(n) !== 'pfDef') return; const get = n.childForFieldName('arguments')?.namedChildren[2]; if (get) walk(get, m => { if (m.type === 'identifier') out.add(m.text); }); });
  return out; }
// 감싸기 함수: 매개변수를 글 AI 호출의 첫 인자로 그대로 넘기는 함수(예: story-memory의 request) — 그 함수를 부르는 곳도 글 AI 호출
function aiCallees(units) { const set = new Set(AI_CALLS); let grew = true;
  while (grew) { grew = false; for (const u of units) walk(u.tree.rootNode, n => { if (n.type !== 'call_expression' || !set.has(callee(n))) return; const a0 = n.childForFieldName('arguments')?.namedChildren[0]; if (a0?.type !== 'identifier') return;
    let f = n.parent; while (f && !FN.has(f.type)) f = f.parent; if (!f) return; const ps = f.childForFieldName('parameters') || f.childForFieldName('parameter'); if (!ps || !ps.text.includes(a0.text)) return;
    const holder = f.type === 'function_declaration' ? f.childForFieldName('name')?.text : f.parent?.type === 'variable_declarator' ? f.parent.childForFieldName('name')?.text : null; if (holder && !set.has(holder)) { set.add(holder); grew = true; } }); }
  return set; }
// 첫 인자가 이름이면 감싼 함수 안의 같은 이름 선언 값으로
function resolveArg(a0) { if (a0?.type !== 'identifier') return a0; let f = a0.parent; while (f && !FN.has(f.type)) f = f.parent; let hit = null;
  if (f) walk(f, n => { if (hit) return false; if (n.type === 'variable_declarator' && n.childForFieldName('name')?.text === a0.text) hit = n.childForFieldName('value'); }); return hit || a0; }
const ownText = n => n.type === 'template_string' ? n.namedChildren.filter(c => c.type === 'string_fragment').map(c => c.text).join('') : n.text.slice(1, -1);
export function inlinePrompts(units) { const bases = fragBases(units), calls = aiCallees(units), tops = new Map(), roots = [];
  for (const u of units) { const r = u.tree.rootNode; for (let i = 0; i < r.childCount; i++) { const nm = declName(r.child(i)); if (nm && !tops.has(nm)) tops.set(nm, { u, node: r.child(i) }); } }
  // 창 게터: Object.defineProperty(window,'RULES',{get:rulesText}) → RULES는 rulesText처럼 따라감 / 모듈 이름공간(GGM…)의 함수: GGMCombat.prompt → 모듈 안 function prompt
  const getters = new Map(), modFns = new Map();
  for (const u of units) walk(u.tree.rootNode, n => { if (n.type === 'call_expression' && callee(n) === 'Object.defineProperty') { const a = n.childForFieldName('arguments')?.namedChildren || []; const nm = a[1]?.text.replace(/^['"]|['"]$/g, ''), get = a[2]?.namedChildren.find(c => c.type === 'pair' && c.childForFieldName('key')?.text === 'get')?.childForFieldName('value'); if (a[0]?.text === 'window' && nm && get?.type === 'identifier' && tops.has(get.text)) getters.set(nm, get.text); }
    if (u.name.startsWith('module:') && n.type === 'function_declaration') { const nm = n.childForFieldName('name')?.text; if (nm && !modFns.has(nm)) modFns.set(nm, { u, node: n }); } });
  for (const u of units) walk(u.tree.rootNode, n => { if (n.type === 'call_expression' && calls.has(callee(n))) { const a = resolveArg(n.childForFieldName('arguments')?.namedChildren[0]); if (a) roots.push({ u, node: a }); } });
  const seen = new Set(), lits = new Set(), visit = (u, node, depth) => walk(node, n => { if (n.type === 'call_expression' && callee(n) === 'pfDef') return false;
    if (n.type === 'string' || n.type === 'template_string') lits.add(n); // 같은 글 노드는 한 번만(Set)
    const name = n.type === 'identifier' ? (getters.get(n.text) || n.text) : null; if (name && depth < 5 && tops.has(name) && !bases.has(name) && !seen.has(name) && (getters.has(n.text) || assembles(n, tops.get(name)))) { seen.add(name); const t = tops.get(name); visit(t.u, t.node, depth + 1); }
    if (n.type === 'member_expression' && /^GGM\w+$/.test(n.childForFieldName('object')?.text || '') && depth < 5) { const p = n.childForFieldName('property')?.text, k = 'mod:' + p; if (modFns.has(p) && !seen.has(k)) { seen.add(k); const t = modFns.get(p); visit(t.u, t.node, depth + 1); } } });
  for (const r of roots) visit(r.u, r.node, 0);
  // 지시문 글 하나가 한 항목(최상위 선언 + 글 머리로 키) — 새로 넣은 문장은 새 항목으로, 늘린 문장은 글자 수로 드러남
  const unitOf = new Map(), out = [], dup = new Map(); units.forEach(u => walk(u.tree.rootNode, n => { if (n.type === 'string' || n.type === 'template_string') unitOf.set(n.id, u); }));
  for (const n of lits) { const t = ownText(n); if (!imperative(t)) continue; const u = unitOf.get(n.id), loc = u.loc(n), file = loc.split(':')[0], top = ownerOf(n) || '(최상위 문장)', head = t.replace(/\s+/g, ' ').trim().slice(0, 40), base = `${file} ${top} 「${head}」`, k = (dup.get(base) || 0) + 1; dup.set(base, k);
    out.push({ key: k > 1 ? `${base} #${k}` : base, site: `${file} ${top}`, head, chars: t.length, loc }); }
  return out.sort((a, b) => b.chars - a.chars); }
// 위치(최상위 선언)별로 모음 — 보고서 표
export const promptSites = rows => [...rows.reduce((m, r) => { const x = m.get(r.site) || { site: r.site, n: 0, chars: 0 }; x.n++; x.chars += r.chars; return m.set(r.site, x); }, new Map()).values()].sort((a, b) => b.chars - a.chars);

// 조각이 한곳에 모였는지: 프롬프트 스튜디오는 지시문을 파편화되지 않게 한곳에 모아 두고 거기서 개선하는 곳(사용자) — pfDef 등록이 여러 파일에 있으면 흩어진 것
export function fragmentFiles(units) { const files = new Map();
  for (const u of units) walk(u.tree.rootNode, n => { if (n.type === 'call_expression' && callee(n) === 'pfDef') { const f = u.loc(n).split(':')[0]; files.set(f, (files.get(f) || 0) + 1); } });
  const all = [...files].sort((a, b) => b[1] - a[1]); return { home: all[0]?.[0] || null, stray: all.slice(1).map(([file, n]) => ({ file, n })) }; }

// 순수 모듈 경계: 머리 주석에 "순수·DOM-free·Pure"라고 밝힌 모듈(규칙 엔진 — 건조·원정·전투 코어, 전투 코어는 Web Worker에서도 돎)은
// DOM·브라우저 전역·앱 상태(G·P()·render·toast·aiJSON 등)를 참조하면 안 됨(docs/build.md §3, docs/modules.md §6·§8-1·§8-2)
const APP_GLOBALS = new Set(['document', 'window', 'localStorage', 'sessionStorage', 'navigator', 'G', 'P', 'render', 'toast', 'mark', 'flush', 'appStorage', 'SAMPLE', 'aiJSON', 'T', 'ctx', 'openModal', 'closeModal', 'esc', '$']);
export function pureModules(units) { const out = [];
  for (const u of units) { if (!u.name.startsWith('module:') || !/^\s*\/\*[^*]*?(순수|DOM-free|Pure)/.test(u.text)) continue; const local = new Set();
    walk(u.tree.rootNode, n => { if (n.type === 'variable_declarator' || n.type === 'function_declaration') { const nm = n.childForFieldName('name'); if (nm?.type === 'identifier') local.add(nm.text); }
      if (n.type === 'formal_parameters') walk(n, m => { if (m.type === 'identifier') local.add(m.text); });
      if (n.type === 'arrow_function' && n.childForFieldName('parameter')) local.add(n.childForFieldName('parameter').text); });
    walk(u.tree.rootNode, n => { if (n.type === 'identifier' && APP_GLOBALS.has(n.text) && !local.has(n.text)) out.push({ loc: u.loc(n), name: n.text, unit: u.name }); }); }
  return out; }
