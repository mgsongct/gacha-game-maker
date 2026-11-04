// 프롬프트 스튜디오 밖 프롬프트 글(정적 분석): 글 AI에 보내는 지시문이 스튜디오 조각(pfDef)이 아니라 코드에 직접 들어 있는 곳.
// 프롬프트는 프롬프트 스튜디오로 따로 관리(사용자 지시) — 조각이면 게임마다 덮어쓰기·덧붙이기·AI 다듬기가 되지만, 코드에 직접 쓴 문장은 못 고침.
// 범위: 글 AI 호출(aiJSON·aiJSONRetry·aiCall·SAMPLE.json과, 받은 인자를 그대로 넘기는 감싸기 함수)의 프롬프트 인자,
//       그 안에서 부르거나 가리키는 최상위 함수·상수(프롬프트 조립 — ctx·charSchema 등, 5단계까지). 화면 글·샘플 이야기는 프롬프트로 가지 않으면 셈하지 않음.
// 지시문은 해라체(…한다·…쓴다·…않는다·…하라·JSON만 출력)라 데이터 글과 갈림. pfDef에 등록된 기본값(getter가 가리키는 함수·상수)은 스튜디오 조각이라 뺌.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { walk, calleeName } from './source.mjs';
import { aliasOf } from './graph.mjs';
import { moduleOf, inModule, localDefs } from './scope.mjs';

// 해라체 판별: 받침 ㄴ 음절 + 다(…한다·…는다·…쓴다) · 이다·아니다 · …하라/…어라 · 명사로 끝낸 지시(…금지·…필수). 해요체(화면 글)는 걸리지 않음.
// "JSON만 출력:"(쌍점 — 형식 견본 앞)은 지시문이 아니라 표식(llmWrap이 지침·교훈을 그 앞에 끼우고 aiJSON이 형식을 찾음 — 코드가 의존)이라 셈하지 않음
export const imperative = t => /(하라|써라|어라|아라|여라)(?=[.)\s"'`,:;]|$)|[가-힣\s](금지|필수)(?=[.)\s,;]|$)/.test(t.replace(/JSON만 출력\s*:[^\n]*/g, '')) || [...t.replace(/JSON만 출력\s*:[^\n]*/g, '').matchAll(/([가-힣])다(?=[.)\s"'`,(:;—]|$)/g)].some(m => { const c = m[1].charCodeAt(0) - 0xAC00; return c % 28 === 4 || m[1] === '이' || m[1] === '니'; });
const AI_CALLS = new Set(['aiJSON', 'aiJSONRetry', 'aiCall', 'SAMPLE.json']);
const FN = new Set(['function_declaration', 'arrow_function', 'function_expression', 'method_definition']);
const declName = n => { if (n.type === 'function_declaration') return n.childForFieldName('name')?.text;
  if (n.type === 'lexical_declaration' || n.type === 'variable_declaration') return n.namedChildren.find(c => c.type === 'variable_declarator')?.childForFieldName('name')?.text;
  return null; };
const topOf = n => { while (n.parent && n.parent.type !== 'program') n = n.parent; return n; };
// 글이 속한 이름: 가장 가까운 이름 있는 함수(모듈 IIFE 안 함수 포함), 없으면 최상위 선언
const ownerOf = n => { for (let p = n.parent; p; p = p.parent) { if (p.type === 'function_declaration' || (p.type === 'method_definition' && p.parent?.type === 'class_body')) return p.childForFieldName('name')?.text; /* class 메서드는 메서드 이름(실행 호출 경로의 Class.이름과 맞춤) */ if (p.type === 'variable_declarator' && /function|arrow_function/.test(p.childForFieldName('value')?.type || '') && p.parent?.parent?.type === 'program') return p.childForFieldName('name')?.text; } return declName(topOf(n)); };
// 따라갈 이름: 불린 함수, 또는 글(문자열·템플릿·그 연결·화살표 함수)을 값으로 가진 상수 — 배열·객체 데이터(샘플 게임 등)는 프롬프트 조립이 아님
const assembles = (n, t) => { if (n.parent?.type === 'call_expression' && n.parent.childForFieldName('function')?.id === n.id) return true; /* 노드 객체는 접근마다 새로 만들어져 id로 비교 */
  const v = t.node.namedChildren.find(c => c.type === 'variable_declarator')?.childForFieldName('value'); return /^(string|template_string|binary_expression|arrow_function|function_expression)$/.test(v?.type || ''); };
const callee = calleeName; // Class.이름(…)은 이름으로(lib/source.mjs)

// pfDef(id, label, get): get이 가리키는 이름 — 조각 기본값 선언
function fragBases(units) { const out = new Set();
  for (const u of units) walk(u.tree.rootNode, n => { if (n.type !== 'call_expression' || callee(n) !== 'pfDef') return; const get = n.childForFieldName('arguments')?.namedChildren[2]; if (get) walk(get, m => { if (m.type === 'identifier') out.add(m.text); }); });
  return out; }
// 감싸기 함수: 매개변수를 글 AI 호출의 프롬프트 인자로 그대로 넘기는 함수(예: story-memory의 request, 전투 브리지의 v2SkillRequest(SAMPLE,prompt)) —
//   그 함수를 부르는 곳도 글 AI 호출. 돌려주는 표: 이름 → 프롬프트 인자 자리(기본 받는 호출은 0)
function aiCallees(units, sinks) { const at = new Map((sinks || [...AI_CALLS]).map(k => [k, 0])), idx = n => { const c = callee(n); return at.has(c) ? at.get(c) : !sinks && /\.json$/.test(c || '') && (n.childForFieldName('arguments')?.namedChildren.length || 0) >= 1 ? 0 : -1; }; let grew = true;
  while (grew) { grew = false; for (const u of units) walk(u.tree.rootNode, n => { if (n.type !== 'call_expression') return; const i = idx(n); if (i < 0) return; const a0 = n.childForFieldName('arguments')?.namedChildren[i]; if (a0?.type !== 'identifier') return;
    const pnames = f => { const ps = f.childForFieldName('parameters'), single = f.childForFieldName('parameter'); return ps ? ps.namedChildren.map(c => c.type === 'identifier' ? c.text : c.type === 'assignment_pattern' ? c.childForFieldName('left')?.text : null) : single ? [single.text] : []; };
    let f = n.parent, j = -1; for (; f; f = f.parent) if (FN.has(f.type)) { j = pnames(f).indexOf(a0.text); if (j >= 0) break; } if (!f) return; /* 안쪽 콜백(.then(()=>…))이 바깥 함수 인자를 씀 */
    const holder = f.type === 'function_declaration' ? f.childForFieldName('name')?.text : f.parent?.type === 'variable_declarator' ? f.parent.childForFieldName('name')?.text : null; if (holder && !at.has(holder)) { at.set(holder, j); grew = true; } }); }
  at.idx = idx; return at; }
// 첫 인자가 이름이면 감싼 함수 안의 같은 이름 선언 값으로
function resolveArg(a0) { if (a0?.type === 'member_expression' && a0.childForFieldName('object')?.type === 'identifier') a0 = a0.childForFieldName('object'); /* p.input → const p=composeNai(…) */ if (a0?.type !== 'identifier') return a0; let f = a0.parent; while (f && !FN.has(f.type)) f = f.parent; let hit = null;
  if (f) walk(f, n => { if (hit) return false; if (n.type === 'variable_declarator' && n.childForFieldName('name')?.text === a0.text) hit = n.childForFieldName('value'); }); return hit || a0; }
// 글이 출력 자리에 있는지: 비교값·switch case·객체 키·첨자·조각 id(pf('ID'))·검사·자르기 메서드의 인자(includes·split·test·replace의 첫 인자 …)는 데이터라 프롬프트 글이 아님
const DATA_CALL = /^(includes|startsWith|endsWith|indexOf|lastIndexOf|test|split|match|matchAll|search|has|get|set|delete|getItem|setItem|removeItem|querySelector|querySelectorAll|getElementById|addEventListener|removeEventListener|closest|getAttribute|setAttribute|T|pf|promptFrag|mark|parseInt|parseFloat|Number)$/;
export function outputPos(n) { const p = n.parent; if (!p) return true;
  if (p.type === 'binary_expression' && /^(===|!==|==|!=|<|>|<=|>=|in|instanceof)$/.test(p.childForFieldName('operator')?.text || '')) return false;
  if (p.type === 'arguments' && p.parent?.type === 'new_expression' && /Error$/.test(p.parent.childForFieldName('constructor')?.text || '')) return false; // 오류 문구는 실행 중 데이터
  if (p.type === 'switch_case' || (p.type === 'pair' && p.childForFieldName('key')?.id === n.id) || (p.type === 'subscript_expression' && p.childForFieldName('index')?.id === n.id)) return false;
  if (p.type === 'arguments') { const c = p.parent, f = c?.childForFieldName('function'), nm = f?.type === 'member_expression' ? f.childForFieldName('property')?.text : f?.text; if (DATA_CALL.test(nm || '')) return false; if (nm === 'replace' || nm === 'replaceAll') return p.namedChildren[0]?.id !== n.id; }
  return true; }
export const ownText = n => n.type === 'template_string' ? n.namedChildren.filter(c => c.type === 'string_fragment').map(c => c.text).join('') : n.text.slice(1, -1);
// 최상위 선언이 프롬프트에 내는 식: 함수면 돌려주는 식(return·화살표 식 본문), 글 상수면 그 값, 표(opts.tables)면 값 전체
function outputs(d) { let f = d;
  if (d.type === 'lexical_declaration' || d.type === 'variable_declaration') { const v = d.namedChildren.find(c => c.type === 'variable_declarator')?.childForFieldName('value'); if (!v) return []; if (!/^(arrow_function|function_expression)$/.test(v.type)) return [v]; f = v; }
  const body = f.childForFieldName('body'); if (!body) return []; if (body.type !== 'statement_block') return [body];
  const out = []; walk(body, n => { if (n.id !== body.id && FN.has(n.type)) return false; if (n.type === 'return_statement' && n.namedChildren[0]) out.push(n.namedChildren[0]); }); return out; }
// 오류 처리(catch) 안에서 정한 값은 실행 중 데이터(오류 설명을 다음 요청에 피드백) — 프롬프트 글이 아님
const inCatch = n => { for (let p = n.parent; p && !FN.has(p.type); p = p.parent) if (p.type === 'catch_clause') return true; return false; };
const PURE = /^\s*\/\*[^*]*?(순수|DOM-free|Pure)/;
// 공용 글 도구(tools/prompt-shared.json): 게임 데이터를 글로 나타내 화면과 프롬프트가 같이 쓰는 함수 — 스튜디오 밖에 두기로 정한 것(이유와 함께 적음). 프롬프트 흐름은 이 함수 안으로 들어가지 않음
export const sharedHelpers = root => { const f = join(root, 'tools/prompt-shared.json'); return existsSync(f) ? Object.keys(JSON.parse(readFileSync(f, 'utf8')).shared || {}) : []; };
const TEXT_METHOD = /^(join|trim|slice|replace|replaceAll|concat|toString|padStart|padEnd|toUpperCase|toLowerCase|repeat)$/;
// 프롬프트 흐름(정적): 받는 호출(글 AI — 감싸기 함수 포함, 또는 opts.sinks)마다 프롬프트 인자 식(site.root)과,
//   그 식에서 닿는 식들 — 글로 쓰는 지역 변수의 값(선언·대입·push), 부르거나 가리키는 최상위 함수가 돌려주는 식·글 상수(5단계), GGM 모듈 함수가 돌려주는 식.
//   flow(seeds, visit): seeds에서 닿는 식을 차례로 visit(node, u, depth) — 프롬프트 조합 도구(tools/lib/combos.mjs)와 스튜디오 밖 글 셈이 같이 씀
export function promptFlow(units, opts = {}) {
  const shared = new Set(opts.shared || []), bases = fragBases(units), calls = aiCallees(units, opts.sinks), tops = new Map();
  for (const u of units) { const r = u.tree.rootNode; for (let i = 0; i < r.childCount; i++) { const nm = declName(r.child(i)); if (nm && !tops.has(nm)) tops.set(nm, { u, node: r.child(i) }); } }
  // 창 게터: Object.defineProperty(window,'RULES',{get:rulesText}) → RULES는 rulesText처럼 따라감 / 모듈 이름공간(GGM…)의 함수: GGMCombat.promptData → 모듈 안 function promptData
  const getters = new Map(), modFns = new Map();
  for (const u of units) walk(u.tree.rootNode, n => { if (n.type === 'call_expression' && callee(n) === 'Object.defineProperty') { const a = n.childForFieldName('arguments')?.namedChildren || []; const nm = a[1]?.text.replace(/^['"]|['"]$/g, ''), get = a[2]?.namedChildren.find(c => c.type === 'pair' && c.childForFieldName('key')?.text === 'get')?.childForFieldName('value'); if (a[0]?.text === 'window' && nm && get?.type === 'identifier' && tops.has(get.text)) getters.set(nm, get.text); }
    if (u.name.startsWith('module:') && !PURE.test(u.text) && n.type === 'function_declaration') { const nm = n.childForFieldName('name')?.text; if (nm && !modFns.has(nm)) modFns.set(nm, { u, node: n }); } }); // 순수 모듈(규칙 엔진)의 글은 엔진 데이터 — 원칙상 프롬프트를 둘 수 없는 곳
  const sites = []; for (const u of units) walk(u.tree.rootNode, n => { if (n.type !== 'call_expression') return; const ai = calls.idx(n); if (ai >= 0) { /* 인자를 받는 .json(…)도(넘겨받은 글 AI — fetch 응답의 .json()은 인자 없음) */ const root = resolveArg(n.childForFieldName('arguments')?.namedChildren[ai]); if (root) sites.push({ u, call: n, root, sink: callee(n), owner: ownerOf(n) || '(최상위 문장)', loc: u.loc(n) }); } });
  // 연결 층: 받는 호출(aiCall·aiJSON …)이 받은 프롬프트를 넘겨받는 함수(인자 자리로 따라감)에서 그 프롬프트에 덧붙이는 글(P2=prompt+'…JSON만 출력한다' 등) — 모든 요청에 붙는 글
  const carry = new Map(); for (const [k, i] of calls) if (tops.has(k)) carry.set(k, new Set([i]));
  const paramsOf = t => { let f = t.node; if (f.type !== 'function_declaration') f = f.namedChildren.find(c => c.type === 'variable_declarator')?.childForFieldName('value'); const ps = f?.childForFieldName('parameters'); return ps ? ps.namedChildren.map(c => c.type === 'identifier' ? c.text : c.type === 'assignment_pattern' ? c.childForFieldName('left')?.text : null) : []; };
  for (let grew = true; grew;) { grew = false; for (const [k, idx] of [...carry]) { const t = tops.get(k), names = paramsOf(t).filter((x, i) => idx.has(i));
    walk(t.node, n => { if (n.type !== 'call_expression') return; const f = callee(n); if (!tops.has(f) || f === k) return; (n.childForFieldName('arguments')?.namedChildren || []).forEach((a, i) => { if (a.type === 'identifier' && names.includes(a.text)) { const s2 = carry.get(f) || new Set(); if (!s2.has(i)) { s2.add(i); carry.set(f, s2); grew = true; } } }); }); } }
  for (const [k, idx] of carry) { const t = tops.get(k), names = paramsOf(t).filter((x, i) => idx.has(i)), mentions = v => { let hit = false; walk(v, m => { if ((m.type === 'identifier' || m.type === 'shorthand_property_identifier') && names.includes(m.text)) hit = true; }); return hit; };
    walk(t.node, n => { const v = n.type === 'variable_declarator' ? n.childForFieldName('value') : (n.type === 'assignment_expression' || n.type === 'augmented_assignment_expression') ? n.childForFieldName('right') : null;
      if (v && /^(binary_expression|template_string|ternary_expression|call_expression)$/.test(v.type) && mentions(v)) sites.push({ u: t.u, call: n, root: v, sink: '(연결 층)', owner: k, loc: t.u.loc(n), layer: true }); }); }
  const flow = (seeds, visit, onExpr) => { const done = new Set(), seen = new Set(), q = seeds.map(x => ({ ...x, depth: 0 }));
    while (q.length) { const { u, node, depth } = q.shift(); if (!node || done.has(node.id)) continue; done.add(node.id); if (onExpr) onExpr(node, u, depth); /* 흐름에 든 식 하나(인자·지역 변수 값·돌려주는 식) */
      walk(node, n => { if (n.type === 'call_expression' && callee(n) === 'pfDef') return false; if (/^(arrow_function|function_expression)$/.test(n.type) && n.parent?.type === 'pair') return false; /* 객체 속성에 넣은 콜백(onProgress 등)은 값이 아님 */ visit(n, u, depth);
        if (n.type === 'identifier' || n.type === 'shorthand_property_identifier') { const p = n.parent, asCallee = p?.type === 'call_expression' && p.childForFieldName('function')?.id === n.id, asObj = !opts.tables && p?.type === 'member_expression' && p.childForFieldName('object')?.id === n.id && !TEXT_METHOD.test(p.childForFieldName('property')?.text || ''); /* 그림 태그는 설정 객체의 필드(C.quality)로도 감 */
          const defs = asCallee || asObj ? [] : localDefs(n).filter(d => !inCatch(d)); if (defs.length) { defs.forEach(d => q.push({ u, node: d, depth })); return; } // 글로 쓰는 지역 변수
          const name = getters.get(n.text) || n.text; if (depth < 5 && tops.has(name) && !bases.has(name) && !shared.has(name) && !seen.has(name) && (getters.has(n.text) || opts.tables || assembles(n, tops.get(name)))) { seen.add(name); const t = tops.get(name); (opts.tables && !asCallee ? [t.node] : outputs(t.node)).forEach(o => q.push({ u: t.u, node: o, depth: depth + 1 })); } }
        if (n.type === 'member_expression' && /^GGM\w+$/.test(n.childForFieldName('object')?.text || '') && depth < 5) { const p = n.childForFieldName('property')?.text, k = 'mod:' + p; if (modFns.has(p) && !seen.has(k)) { seen.add(k); const t = modFns.get(p); outputs(t.node).forEach(o => q.push({ u: t.u, node: o, depth: depth + 1 })); } } }); }
    return seen; };
  return { sites, flow, tops, getters, bases, calls }; }
export function inlinePrompts(units, opts = {}) { /* opts.nodes: 원문(text)도 돌려줌(tools/prompts-move.mjs) · opts.sinks: 받는 호출(기본 글 AI) · opts.pred: 셀 글(기본 해라체 지시문) · opts.home: 이 모듈(스튜디오) 글은 뺌 · opts.tables: 배열·객체 상수(태그 표)도 따라감 */
  const pred = opts.pred || imperative, { sites, flow } = promptFlow(units, opts), lits = new Set();
  flow(sites.map(s => ({ u: s.u, node: s.root })), n => { if ((n.type === 'string' || n.type === 'template_string') && outputPos(n)) lits.add(n); }); // 같은 글 노드는 한 번만(Set)
  // 지시문 글 하나가 한 항목(최상위 선언 + 글 머리로 키) — 새로 넣은 문장은 새 항목으로, 늘린 문장은 글자 수로 드러남
  const unitOf = new Map(), out = [], dup = new Map(); units.forEach(u => walk(u.tree.rootNode, n => { if (n.type === 'string' || n.type === 'template_string') unitOf.set(n.id, u); }));
  for (const n of lits) { const t = ownText(n); if (!pred(t)) continue; const u = unitOf.get(n.id), loc = u.loc(n); if (inModule(loc, opts.home)) continue; const file = loc.split(':')[0], top = ownerOf(n) || '(최상위 문장)', head = t.replace(/\s+/g, ' ').trim().slice(0, 40), base = `${file} ${top} 「${head}」`, k = (dup.get(base) || 0) + 1; dup.set(base, k);
    out.push({ key: k > 1 ? `${base} #${k}` : base, site: `${file} ${top}`, head, chars: t.length, loc, ...(opts.nodes ? { text: n.text } : {}) }); }
  return out.sort((a, b) => b.chars - a.chars); }
// 위치(최상위 선언)별로 모음 — 보고서 표
export const promptSites = rows => [...rows.reduce((m, r) => { const x = m.get(r.site) || { site: r.site, n: 0, chars: 0 }; x.n++; x.chars += r.chars; return m.set(r.site, x); }, new Map()).values()].sort((a, b) => b.chars - a.chars);

// 프롬프트 글 전체(지시문만이 아니라 답 형식 견본·머리말 포함): 한글 글이나 JSON 키("x":)가 든 글 — 스튜디오 파일 밖 것
export const promptText = t => /[가-힣]{2}|"\w+"\s*:/.test(t); // 한글 낱말(두 음절 이상 — 조사 '이'·'가' 같은 한 음절은 글 도구) 또는 JSON 키
// 이미지 프롬프트 조각: 그림 생성(naiGenerate·comfyGenerate·composeNai)에 들어가는 영어 태그 글
export const IMAGE_SINKS = ['naiGenerate', 'naiGenerate0', 'comfyGenerate'];
export const tagText = t => /[a-z]{3,}/.test(t) && !/^[\w.-]+$/.test(t.trim()) && !/^https?:|<\/?[a-z]|&[a-z]+;/.test(t); // 주소·HTML 조각은 태그가 아님
// 조각이 한곳에 모였는지: 프롬프트 스튜디오는 지시문을 파편화되지 않게 한곳에 모아 두고 거기서 개선하는 곳(사용자) — pfDef 등록이 여러 파일에 있으면 흩어진 것
export function fragmentFiles(units) { const files = new Map(), mods = new Map();
  for (const u of units) walk(u.tree.rootNode, n => { if (aliasOf(n)) return false; /* 옛 이름 다리(function pfDef(...a){ return X.pfDef(...a); })는 조각 정의가 아님 */ if (n.type === 'call_expression' && callee(n) === 'pfDef') { const f = u.loc(n).split(':')[0]; files.set(f, (files.get(f) || 0) + 1); mods.set(moduleOf(f), (mods.get(moduleOf(f)) || 0) + 1); } });
  const home = [...mods].sort((a, b) => b[1] - a[1])[0]?.[0] || null; /* 스튜디오 모듈: 조각이 가장 많은 모듈(폴더 모듈이면 폴더) */
  return { home, stray: [...files].filter(([f]) => moduleOf(f) !== home).sort((a, b) => b[1] - a[1]).map(([file, n]) => ({ file, n })) }; }
// 순수 모듈 경계: 머리 주석에 "순수·DOM-free·Pure"라고 밝힌 모듈(규칙 엔진 — 건조·원정·전투 코어, 전투 코어는 Web Worker에서도 돎)은
// DOM·브라우저 전역·앱 상태(G·P()·render·toast·aiJSON 등)를 참조하면 안 됨(docs/build.md §3, docs/modules.md §6·§8-1·§8-2)
const APP_GLOBALS = new Set(['document', 'window', 'localStorage', 'sessionStorage', 'navigator', 'G', 'P', 'render', 'toast', 'mark', 'flush', 'appStorage', 'SAMPLE', 'aiJSON', 'T', 'ctx', 'openModal', 'closeModal', 'esc', '$']);
export function pureModules(units) { const out = [];
  for (const u of units) { if (!u.name.startsWith('module:') || !PURE.test(u.text)) continue; const local = new Set();
    walk(u.tree.rootNode, n => { if (n.type === 'variable_declarator' || n.type === 'function_declaration') { const nm = n.childForFieldName('name'); if (nm?.type === 'identifier') local.add(nm.text); }
      if (n.type === 'formal_parameters') walk(n, m => { if (m.type === 'identifier') local.add(m.text); });
      if (n.type === 'arrow_function' && n.childForFieldName('parameter')) local.add(n.childForFieldName('parameter').text); });
    walk(u.tree.rootNode, n => { if (n.type === 'identifier' && APP_GLOBALS.has(n.text) && !local.has(n.text)) out.push({ loc: u.loc(n), name: n.text, unit: u.name }); }); }
  return out; }
// 프롬프트 조립 함수가 스튜디오 밖: 프롬프트 흐름에 든 최상위 함수 중 돌려주는 글에 스튜디오 조각(pf('ID')·promptFrag('ID')·조각 게터)을 넣는 함수 —
//   글자는 없어도 조각을 고르고 잇는 프롬프트 조립(규칙 글·성별·출연 규칙 등)이라 스튜디오 일. 조각을 데이터와 함께 바로 보내는 기능 코드(aiJSON(pf('ID',{…})))는 셈하지 않음(요청 지점 식)
// 불러올 때 조각을 읽음: 함수 밖(불러올 때)에서 pf()·promptFrag()를 부르면 게임별 수정(G.meta.prompts)이 그 뒤로 반영되지 않음
export function promptBuilders(units, opts = {}) { const F = promptFlow(units, opts), ids = new Set(); for (const u of units) walk(u.tree.rootNode, n => { if (n.type === 'call_expression' && callee(n) === 'pfDef') { const a = n.childForFieldName('arguments')?.namedChildren[0]; if (a?.type === 'string') ids.add(a.text.slice(1, -1)); } });
  const isFrag = n => (n.type === 'call_expression' && /^(pf|promptFrag)$/.test(callee(n) || '')) || ((n.type === 'identifier' || n.type === 'shorthand_property_identifier') && ids.has(n.text) && n.parent?.type !== 'variable_declarator');
  const out = new Map(), siteRoots = new Set(F.sites.map(s => s.root.id));
  F.flow(F.sites.map(s => ({ u: s.u, node: s.root })), (n, u, depth) => { if (depth < 1 || !isFrag(n)) return; const loc = u.loc(n); if (inModule(loc, opts.home)) return; const own = ownerOf(n); if (own && !out.has(own)) out.set(own, loc); });
  const loadTime = []; for (const u of units) { const r = u.tree.rootNode; for (let i = 0; i < r.childCount; i++) { const c = r.child(i); if (c.type === 'function_declaration') continue; walk(c, n => { if (/^(arrow_function|function_expression|method_definition)$/.test(n.type)) return false; if (n.type === 'call_expression' && /^(pf|promptFrag)$/.test(callee(n) || '') && !inModule(u.loc(n), opts.home)) loadTime.push({ loc: u.loc(n), text: n.text.slice(0, 60) }); }); } }
  void siteRoots; return { builders: [...out].map(([fn, loc]) => ({ fn, loc })), loadTime }; }
