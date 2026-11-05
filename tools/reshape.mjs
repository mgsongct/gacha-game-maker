#!/usr/bin/env node
// 재설계 1단계(기계적으로 옮기기): node tools/reshape.mjs [--apply]
//   입력: 빌드된 www/index.html의 ggm-main 스크립트(사용자 지시 U21 — 재설계 입력은 index.html) + 추상 매핑 결과(tools/out/redesign-map-www.json — node tools/redesign.mjs --map)
//   함수마다 매핑된 기능·종류대로 class의 static 메서드로: 기능 X → X(Model: Repository·Generator·Service·Helper) · XView(Screen·Dialog) · XCtl(Controller)
//     Shared → Core·CoreView·CoreCtl, 미정 → Misc…, 브라우저 전역과 겹치는 이름(Image)은 바꿈(Art)
//   함수를 가리키는 곳(부름·값으로 넘김·{이름} 줄임)은 범위를 따져 Owner.name으로 — 지역 이름이 가리면 그대로
//   파일: src/main/00-core.js(상위 class 뼈대 + Core…) · 10-<기능>.js(기능의 class들) · 90-load.js(함수가 아닌 맨 위 문장 — 상수·상태·리스너 — 원래 순서)
//     · 99-aliases.js(옛 전역 이름 → Owner.name 임시 다리: 시험·HTML onclick·엔진 모듈이 부르는 이름 — 이슈로 기록하고 나중에 지움)
//   class 선언은 끌어올려지지 않으므로 class 파일을 앞에, 불러올 때 도는 문장(90-load)을 뒤에 둠. 깨지는 것은 고치지 않고 이슈로(사용자 지시 U16)
// node tools/reshape.mjs --hoist [--apply]: src/main/90-load.js에서 부작용 없는 선언(글자 값·객체·배열·정규식·함수 값·new Map 같은 빈 그릇 — 부름·대입이 없음)을
//   실행 문장(부팅·리스너·불러올 때 부름)보다 앞으로, 원래 순서대로 올림. 아직 안 올린 이름을 읽는 선언은 두고 감(더 바뀌지 않을 때까지).
//   불러올 때 도는 문장이 갈래에 따라 아직 선언 안 된 상태를 쓰는 TDZ(node tools/check.mjs — 갈래 안: data에 따라 앱이 뜨지 않음)를 일괄로 없앰
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { loadHtmlUnits, tsInit, walk } from './lib/source.mjs';
import { leadComments } from './lib/extra.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..'), APPLY = process.argv.includes('--apply'), MAIN = join(ROOT, 'src/main');
const FN = /^(function_declaration|generator_function_declaration)$/, SCOPE = /^(function_declaration|function_expression|arrow_function|method_definition|generator_function_declaration|generator_function)$/;
const RENAME = { Image: 'Art', Shared: 'Core', '미정': 'Misc' }, FILE = { Core: '00-core', Misc: '80-misc' };
export const ownerOf = (feature, kind) => { const b = RENAME[feature] || feature; return /^(Screen|Dialog)$/.test(kind) ? b + 'View' : kind === 'Controller' ? b + 'Ctl' : b; };
// 지역 이름이 가리나: 감싸는 함수의 매개변수·블록의 선언(let·const·var·function·class)·catch 매개변수·for 머리
function declaredIn(scope, name) { let hit = false; const params = scope.childForFieldName?.('parameters') || scope.childForFieldName?.('parameter');
  if (params) { const walkP = n => { if (hit) return; if ((n.type === 'identifier' || n.type === 'shorthand_property_identifier_pattern') && n.text === name) hit = true; for (let i = 0; i < n.childCount; i++) walkP(n.child(i)); }; walkP(params); }
  return hit; }
function blockDeclares(block, name) { for (let i = 0; i < block.namedChildCount; i++) { const c = block.namedChild(i); if (/^(lexical_declaration|variable_declaration)$/.test(c.type)) { for (const d of c.namedChildren) { if (d.type !== 'variable_declarator') continue; const nm = d.childForFieldName('name'); let found = false; const w = n => { if (found) return; if ((n.type === 'identifier' || n.type === 'shorthand_property_identifier_pattern') && n.text === name) found = true; for (let j = 0; j < n.childCount; j++) w(n.child(j)); }; if (nm) w(nm); if (found) return true; } }
    else if (/^(function_declaration|class_declaration|generator_function_declaration)$/.test(c.type) && c.childForFieldName('name')?.text === name && block.type !== 'program') return true; }
  return false; }
function shadowed(node, name) { for (let p = node.parent; p && p.type !== 'program'; p = p.parent) { if (SCOPE.test(p.type) && declaredIn(p, name)) return true; if (/^(statement_block|switch_body|class_body)$/.test(p.type) && blockDeclares(p, name)) return true;
    if (p.type === 'catch_clause' && p.childForFieldName('parameter')?.text === name) return true; if (/^(for_statement|for_in_statement)$/.test(p.type)) { const init = p.childForFieldName('initializer') || p.childForFieldName('left'); if (init && new RegExp(`\\b${name}\\b`).test(init.text) && /^(lexical_declaration|variable_declaration|let|const)/.test(init.type + ' ' + (init.parent?.child(2)?.type || ''))) return true; } }
  return false; }
// 옮길 함수를 가리키는 자리 → 바꿀 글(Owner.name, {name} 줄임은 name: Owner.name)
export function renameEdits(root, owner) { const out = []; const walk = n => { if ((n.type === 'identifier' || n.type === 'shorthand_property_identifier') && owner.has(n.text)) {
      const par = n.parent, isDeclName = par && FN.test(par.type) && par.childForFieldName('name')?.startIndex === n.startIndex;
      if (!isDeclName && !(par?.type === 'variable_declarator' && par.childForFieldName('name')?.startIndex === n.startIndex) && !shadowed(n, n.text)) out.push({ a: n.startIndex, b: n.endIndex, to: n.type === 'shorthand_property_identifier' ? `${n.text}: ${owner.get(n.text)}.${n.text}` : `${owner.get(n.text)}.${n.text}` }); }
    for (let i = 0; i < n.childCount; i++) walk(n.child(i)); }; walk(root); return out; }
/* 글 안 줄바꿈 자리: 템플릿·문자열의 글 조각(string_fragment) 안 '\n' 바로 뒤 — 들여쓰기를 더하거나 빼면 글(프롬프트 등)이 바뀜 */
export function textNewlines(root) { const out = new Set(); walk(root, n => { if (n.type === 'string_fragment' && /^(template_string|string)$/.test(n.parent?.type || '')) for (let i = n.text.indexOf('\n'); i >= 0; i = n.text.indexOf('\n', i + 1)) out.add(n.startIndex + i + 1); }); return out; }
/* 코드 줄만 들여 씀(글 안 줄은 그대로): text는 root 안 [base, base+len) 구간 */
export function indentCode(text, base, inText, pad = '  ') { let out = ''; for (let i = 0; i < text.length; i++) { out += text[i]; if (text[i] === '\n' && !inText.has(base + i + 1)) out += pad; } return out; }
const applyEdits = (text, base, edits) => { let t = text; edits.filter(e => e.a >= base && e.b <= base + text.length).sort((x, y) => y.a - x.a).forEach(e => { t = t.slice(0, e.a - base) + e.to + t.slice(e.b - base); }); return t; };
// function 선언 글 → static 메서드 글
export const toMethod = (fnText, name) => fnText.replace(new RegExp(`^(\\s*)(async\\s+)?function(\\s*\\*)?\\s+${name.replace(/\$/g, '\\$')}\\s*\\(`), (m, sp, as, gen) => `${sp}static ${as || ''}${gen ? '*' : ''}${name}(`);

/* 부작용 없는 선언인가: 값마다 앱 함수 부름·대입·증감·await가 없음. 부름은 JS 내장 순수 함수(Object.fromEntries·JSON.parse·Math.* …)와 값의 내장 메서드(map·filter·join …)만 —
   그때 도는 콜백 본문도 같은 기준으로 봄. new는 빈 그릇(Map·Set …)만. 다른 함수 값의 본문은 그때 안 돎. 읽는 맨 위 이름(free)·안 되는 까닭(why)을 돌려줌 */
const PURE_NEW = /^(Map|Set|WeakMap|WeakSet|Array|Object|Date|RegExp)$/, PURE_FN = /^(Object\.(freeze|fromEntries|entries|keys|values)|Array\.(from|isArray)|JSON\.(parse|stringify)|Math\.\w+|Promise\.resolve|String|Number|Boolean|parseInt|parseFloat)$/;
const PURE_M = /^(map|flatMap|filter|reduce|concat|join|slice|flat|split|trim|toLowerCase|toUpperCase|replace|replaceAll|includes|indexOf|some|every|find|findIndex|padStart|padEnd|repeat|at|fill|keys|values|entries)$/;
export function pureDecl(st) { if (!/^(lexical_declaration|variable_declaration)$/.test(st.type)) return { free: null, why: '선언 아님' }; const free = new Set(); let why = '';
  for (const d of st.namedChildren) { if (d.type !== 'variable_declarator') continue; const v = d.childForFieldName('value'); if (!v) continue;
    walk(v, n => { if (why) return false; if (/^(arrow_function|function_expression|generator_function|class)$/.test(n.type) && n.parent?.type !== 'arguments') return false;
      if (n.type === 'call_expression') { const f = n.childForFieldName('function'); if (!(PURE_FN.test(f?.text || '') || (f?.type === 'member_expression' && PURE_M.test(f.childForFieldName('property')?.text || '') && !/^[A-Z][a-z]\w*$/.test(f.childForFieldName('object')?.text || '') /* Class.이름(…)은 앱 함수 */))) why = '부름 ' + (f?.text || '').slice(0, 40); }
      else if (/^(assignment_expression|augmented_assignment_expression|update_expression|await_expression|yield_expression)$/.test(n.type)) why = n.type;
      else if (n.type === 'new_expression' && !PURE_NEW.test(n.childForFieldName('constructor')?.text || '')) why = 'new ' + n.childForFieldName('constructor')?.text;
      if (n.type === 'identifier') free.add(n.text); }); }
  return why ? { free: null, why } : { free, why: '' }; }
export function hoistPlan(src, root) { const sts = [], names = new Map(); let prevEnd = 0;
  for (let i = 0; i < root.childCount; i++) { const c = root.child(i); if (c.type === 'comment') continue; const start = Math.max(prevEnd, leadComments(src, src.lastIndexOf('\n', c.startIndex - 1) + 1));
    const decl = []; if (/^(lexical_declaration|variable_declaration)$/.test(c.type)) walk(c, n => { if (n.type === 'variable_declarator') { const nm = n.childForFieldName('name'); walk(nm, x => { if (/^(identifier|shorthand_property_identifier_pattern)$/.test(x.type)) decl.push(x.text); }); return false; } });
    const pd = pureDecl(c); sts.push({ i: sts.length, text: src.slice(start, c.endIndex), free: pd.free, why: pd.why, decl }); decl.forEach(n => names.set(n, sts.length - 1)); prevEnd = c.endIndex; }
  const up = new Set(sts.filter(x => x.free).map(x => x.i)); for (let ch = true; ch;) { ch = false; for (const i of [...up]) { const bad = [...sts[i].free].find(n => names.has(n) && !up.has(names.get(n))); if (bad) { up.delete(i); sts[i].why = `안 올린 ${bad}를 읽음`; ch = true; } } }
  return { up: sts.filter(x => up.has(x.i)), rest: sts.filter(x => !up.has(x.i)), tail: src.slice(prevEnd) }; }

// node tools/reshape.mjs --strings [--apply]: 1단계가 메서드 본문을 2칸 들여 쓰며 여러 줄 템플릿·문자열 글 안 줄까지 들여 쓴 것(보낸 프롬프트가 기준 빌드와 다름 —
//   node tools/play/combos.mjs --ref <커밋>)을 class 파일(00-core·10-*·80-misc)에서 되돌림: 글 안 줄바꿈 뒤 두 칸을 뺌
export async function stringFixes(src) { const { parser } = await tsInit(), root = parser.parse(src).rootNode, at = [...textNewlines(root)].filter(i => src.slice(i, i + 2) === '  ').sort((a, b) => b - a); let t = src; for (const i of at) t = t.slice(0, i) + t.slice(i + 2); return { text: t, n: at.length }; }
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes('--strings')) {
  for (const f of readdirSync(MAIN).filter(f => /^(00-core|10-[a-z]+|80-misc)\.js$/.test(f))) { const E = await stringFixes(readFileSync(join(MAIN, f), 'utf8')); if (E.n) { console.log(`${f}: 글 안 줄 ${E.n}`); if (APPLY) writeFileSync(join(MAIN, f), E.text); } }
  process.exit(0); }
// node tools/reshape.mjs --move <메서드 이름> <대상 class> [--apply]: class의 static 메서드를 다른 class 끝으로 옮김(설명 주석 같이, 글은 그대로) — 기능 분산(점검 자연 경계: 연결이
//   더 많은 기능)·자리를 잘못 정한 매핑(docs/restructure.md R8)을 고칠 때. 원래Class.이름 참조는 src/main·시험(build/test.mjs·tools/play)에서 같이 바꿈(옛 이름 다리 본문 포함)
export function moveMethod(files, name, to) { const { parser } = TS; let from = null, cut = null;
  for (const [f, src] of Object.entries(files)) { const root = parser.parse(src).rootNode; for (let i = 0; i < root.childCount; i++) { const c = root.child(i); if (c.type !== 'class_declaration') continue;
      for (const m of c.childForFieldName('body').namedChildren) if (m.type === 'method_definition' && m.childForFieldName('name')?.text === name && m.child(0)?.text === 'static') { let first = m; for (let p = m.previousSibling; p?.type === 'comment' && !/\S/.test(src.slice(p.endIndex, first.startIndex).replace(/\n/, '')) && !/\n\s*\n/.test(src.slice(p.endIndex, first.startIndex)); p = p.previousSibling) first = p; /* 바로 위 설명 주석(들여 쓴 것도) */
        const a = src.lastIndexOf('\n', first.startIndex - 1) + 1; from = { f, cls: c.childForFieldName('name').text }; cut = { a, b: m.endIndex, text: src.slice(a, m.endIndex) }; } } }
  if (!from) return { error: `static 메서드 ${name} 없음` }; const out = { ...files }; out[from.f] = out[from.f].slice(0, cut.a) + out[from.f].slice(cut.b).replace(/^[ \t]*\n/, '');
  const tf = Object.keys(out).find(f => new RegExp(`^class ${to}\\b`, 'm').test(out[f])); if (!tf) return { error: `class ${to} 없음` }; const troot = parser.parse(out[tf]).rootNode; let end = -1;
  for (let i = 0; i < troot.childCount; i++) { const c = troot.child(i); if (c.type === 'class_declaration' && c.childForFieldName('name')?.text === to) end = c.childForFieldName('body').endIndex - 1; }
  out[tf] = out[tf].slice(0, end).replace(/\s*$/, '\n\n') + cut.text.replace(/^\n+/, '') + '\n' + out[tf].slice(end); const re = new RegExp(`\\b${from.cls}\\.${name}\\b`, 'g'); let n = 0;
  for (const f of Object.keys(out)) out[f] = out[f].replace(re, () => { n++; return `${to}.${name}`; }); return { from, to: tf, refs: n, files: out }; }
const TS = await tsInit();
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes('--move')) {
  const i = process.argv.indexOf('--move'), name = process.argv[i + 1], to = process.argv[i + 2], paths = refFiles();
  const files = Object.fromEntries(paths.map(f => [f, readFileSync(join(ROOT, f), 'utf8')])), R = moveMethod(files, name, to); if (R.error) { console.log(R.error); process.exit(1); }
  console.log(`${R.from.cls}.${name}(${R.from.f}) → ${to}(${R.to}) · 참조 ${R.refs}`); if (APPLY) for (const f of paths) if (R.files[f] !== files[f]) writeFileSync(join(ROOT, f), R.files[f]); process.exit(0); }
// node tools/reshape.mjs --studio [--apply]: 90-load.js의 프롬프트 조각 등록 문장(X.pfDef('ID', …) — 불러올 때 도는 맨 위 문장)을 프롬프트 스튜디오 class의 메서드
//   PromptStudio.defineFragments()로 모으고, 첫 등록 자리에서 그 메서드를 부름(도는 때는 그대로 — 불러올 때, 같은 순서). 조각이 스튜디오 파일 한곳에(규칙 P1·사용자 지시: 스튜디오가 있는데 흩어 넣지 않음)
export function studioPlan(src, root) { const NL = textNewlines(root), regs = [], isReg = c => c.type === 'expression_statement' && c.namedChildren[0]?.type === 'call_expression' && /^([A-Z][\w$]*\.)?pfDef$/.test(c.namedChildren[0].childForFieldName('function')?.text || '');
  let prevEnd = 0; for (let i = 0; i < root.childCount; i++) { const c = root.child(i); if (c.type === 'comment') continue; const start = Math.max(prevEnd, leadComments(src, src.lastIndexOf('\n', c.startIndex - 1) + 1)); if (isReg(c)) { let a = start; while (src[a] === '\n') a++; regs.push({ start, end: c.endIndex, text: '    ' + indentCode(src.slice(a, c.endIndex), a, NL, '    ') }); } prevEnd = c.endIndex; }
  return regs; }
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes('--studio')) {
  const F = join(MAIN, '90-load.js'), S = join(MAIN, '10-promptstudio.js'), src = readFileSync(F, 'utf8'), { parser } = await tsInit(), regs = studioPlan(src, parser.parse(src).rootNode);
  console.log(`90-load.js 조각 등록 ${regs.length}문장 → PromptStudio.defineFragments()`);
  /* 점검(analyze — 규칙 P1)이 스튜디오 밖 프롬프트 글로 찾은 90-load.js의 맨 위 선언(조각 기본 글·그림 태그 상수) → 스튜디오 파일 머리로(class보다 앞 — 먼저 불러와짐) */
  const { analyze } = await import('./lib/analyze.mjs'), A = await analyze(ROOT), keys = new Set([...A.R.prompts, ...A.R.promptAll, ...A.R.promptImg].filter(x => /^src\/main\/90-load\.js:/.test(x.loc)).map(x => x.top || String(x.key).split(' ')[1]));
  const root0 = parser.parse(src).rootNode, decls = []; let pe = 0; for (let i = 0; i < root0.childCount; i++) { const c = root0.child(i); if (c.type === 'comment') continue; const start = Math.max(pe, leadComments(src, src.lastIndexOf('\n', c.startIndex - 1) + 1)); pe = c.endIndex;
    if (/^(lexical_declaration|variable_declaration)$/.test(c.type) && c.namedChildren.some(d => d.type === 'variable_declarator' && keys.has(d.childForFieldName('name')?.text))) { let a0 = start; while (src[a0] === '\n') a0++; decls.push({ start, end: c.endIndex, text: src.slice(a0, c.endIndex), names: c.namedChildren.filter(d => d.type === 'variable_declarator').map(d => d.childForFieldName('name')?.text) }); } }
  console.log(`스튜디오 밖 프롬프트 글을 가진 맨 위 선언 ${decls.length}: ${decls.flatMap(d => d.names).join(' · ')}`);
  if (APPLY && (regs.length || decls.length)) { const cut = [...regs.map((r, i) => ({ ...r, call: i === 0 })), ...decls].sort((x, y) => y.start - x.start); let t = src; for (const r of cut) t = t.slice(0, r.start) + (r.call ? '\nPromptStudio.defineFragments(); /* 프롬프트 조각 등록(스튜디오 — tools/reshape.mjs --studio) */' : '') + t.slice(r.end); writeFileSync(F, t);
    let st = readFileSync(S, 'utf8'); const at = st.indexOf('class PromptStudio {') + 'class PromptStudio {'.length;
    if (regs.length) st = st.slice(0, at) + '\n  /* 프롬프트 조각 등록(pfDef — 조각마다 이름·설명·기본 글): 불러올 때 90-load.js가 한 번 부름(원래 자리·순서) */\n  static defineFragments(){\n' + regs.map(r => r.text).join('\n') + '\n  }\n' + st.slice(at);
    if (decls.length) { const h = st.indexOf('\n') + 1; st = st.slice(0, h) + '/* 프롬프트 조각의 기본 글·그림 태그(스튜디오 — tools/reshape.mjs --studio가 90-load.js에서 옮김) */\n' + decls.map(d => d.text).join('\n') + '\n' + st.slice(h); }
    writeFileSync(S, st); console.log('고침: 90-load.js · 10-promptstudio.js'); }
  /* 부르는 자리: 등록이 불러올 때 읽는 이름의 선언보다 뒤여야 함 — TDZ 점검(lib/extra.mjs tdzRefs)이 그 부름에서 난 TDZ를 내면 그 선언 문장 뒤로 옮김(더 없을 때까지) */
  if (APPLY) { const { loadUnits } = await import('./lib/source.mjs'), { tdzRefs } = await import('./lib/extra.mjs'), CALL = /\nPromptStudio\.defineFragments\(\);[^\n]*/;
    for (let k = 0; k < 20; k++) { const t = readFileSync(F, 'utf8'), m = t.match(CALL), callLine = m ? t.slice(0, m.index + 1).split('\n').length : 0, bad = tdzRefs(await loadUnits(ROOT)).filter(x => String(x.via || '').startsWith(`src/main/90-load.js:${callLine} `) && /^src\/main\/90-load\.js:/.test(x.decl));
      if (!m || !bad.length) break; const line = Math.max(...bad.map(x => +x.decl.split(':')[1])), root2 = parser.parse(t).rootNode; let endAt = -1; for (let i = 0; i < root2.childCount; i++) { const c = root2.child(i); if (c.startPosition.row + 1 <= line && c.endPosition.row + 1 >= line) { endAt = c.endIndex; break; } }
      if (endAt < 0) break; const u = t.replace(CALL, ''), shift = endAt > m.index ? m[0].length : 0, at = endAt - shift; writeFileSync(F, u.slice(0, at) + m[0] + u.slice(at)); console.log(`부르는 자리를 ${bad.map(x => x.name).join('·')} 선언 뒤로(90-load.js:${line})`); } }
  process.exit(0); }
/* Class.이름을 쓰는 파일: src/main · src/modules(모듈 블록도 Class.이름으로 부름) · 시험 도구 */
function refFiles() { return [...readdirSync(MAIN).filter(f => f.endsWith('.js')).map(f => `src/main/${f}`), ...readdirSync(join(ROOT, 'src/modules'), { recursive: true }).filter(f => String(f).endsWith('.js')).map(f => `src/modules/${f}`), 'build/test.mjs', ...readdirSync(join(ROOT, 'tools/play'), { recursive: true }).filter(f => String(f).endsWith('.mjs') && !/^(games|reports|fixtures|node_modules)\//.test(f)).map(f => `tools/play/${f}`)]; } /* 함수 선언 — 앞쪽 --move에서도 씀 */
// node tools/reshape.mjs --gateway [--apply]: data 창구 모으기(규칙 D3 — 한 data 경로를 여러 모듈이 씀, 사용자 지시: 생성·수정·제거를 한 창구에서). 경로의 주인 기능(docs/redesign.md 2절 매핑 표)이 아닌 class에 있으면서
//   쓰는 data가 모두 그 주인 기능 것인 Model 메서드를 주인 기능의 Model class로 옮김(--move와 같이 — 설명 주석·Class.이름 참조). 화면(…View)·처리(…Ctl)·모든 data를 만지는 불러오기 정규화(fix)는 두고 알림
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes('--gateway')) {
  const { analyze } = await import('./lib/analyze.mjs'), { buildMap } = await import('./lib/map.mjs'), { stateFlow } = await import('./lib/flow.mjs'), { readDataMap } = await import('./redesign.mjs');
  const A = await analyze(ROOT), M = buildMap(A.units, A.fns, stateFlow(A.units, A.fns), readFileSync(join(ROOT, 'www/index.html'), 'utf8')), DM = readDataMap(readFileSync(join(ROOT, 'docs/redesign.md'), 'utf8'));
  const ownerOfPath = k => { const [file, sub] = k.replace(/\s+/g, '').split('›'); return DM.get(sub ? `${file}›${sub.replace(/^\[\]\./, '').split(/[.[]/)[0]}` : file) || DM.get(file) || null; };
  const byFn = new Map(); for (const [k, d] of Object.entries(M.data)) { const ws = [...new Set(Object.values(d.writers).flat())].filter(w => M.fns[w]), mods = new Set(ws.map(w => M.fns[w].module)); if (mods.size < 2) continue; const o = ownerOfPath(k); for (const w of ws) { if (!byFn.has(w)) byFn.set(w, new Set()); byFn.get(w).add(o); } }
  const all = new Map(); for (const [k, d] of Object.entries(M.data)) for (const w of new Set(Object.values(d.writers).flat())) { if (!all.has(w)) all.set(w, new Set()); all.get(w).add(ownerOfPath(k)); }
  const plan = [], kept = []; for (const [w] of byFn) { const f = A.fns.get(w) || [...A.fns.values()].find(x => x.top && x.name === M.fns[w]?.name && !x.key.includes('.')), owners = [...all.get(w)], o = owners[0], to = RENAME[o] || o, home = `src/main/${FILE[to] || '10-' + String(to).toLowerCase()}.js`; /* 열쇠로 정확히 · 주인 = 주인 기능의 파일 */
    const why = !f?.cls ? '모듈 블록 함수' : /(View|Ctl)$/.test(f.cls) ? '화면·처리 계층' : f.name === 'fix' ? '불러오기 정규화(모든 data)' : owners.length !== 1 || !o ? `주인이 여럿(${owners.join('·')})` : f.loc.startsWith(home + ':') ? '이미 주인' : /Gen$/.test(f.cls) || f.cls !== (RENAME[o] ? f.cls : f.cls) && A.fns.get(`${f.cls}.${f.name}`) ? '상위 class 훅(하위 class째 옮겨야 함)' : null;
    if (why) { if (why !== '이미 주인') kept.push(`${f?.cls ? f.cls + '.' : ''}${M.fns[w]?.name}(${why})`); } else plan.push({ name: f.name, from: f.cls, to }); }
  console.log(`창구 모으기: 옮길 메서드 ${plan.length}: ${plan.map(x => `${x.from}.${x.name} → ${x.to}`).join(' · ')}\n두는 것 ${kept.length}: ${kept.join(' · ')}`);
  if (APPLY && plan.length) { const paths = refFiles(); let files = Object.fromEntries(paths.map(f => [f, readFileSync(join(ROOT, f), 'utf8')])); const orig = { ...files };
    for (const x of plan) { const R = moveMethod(files, x.name, x.to); if (R.error) { console.log(`${x.name}: ${R.error}`); continue; } files = R.files; }
    for (const f of paths) if (files[f] !== orig[f]) writeFileSync(join(ROOT, f), files[f]); console.log('옮김'); }
  process.exit(0); }
// node tools/reshape.mjs --dead [--apply]: 진입점(부팅·src/index.html·화면 조작·생성·실행 중 AI·불러오기 — lib/history.mjs reachable)에서 닿지 않는 class의 static 메서드(YAGNI — 규칙 판정
//   「닿지 않음」)를 설명 주석과 함께 지움(사용자 지시: 폐기, 지운 것은 git 이력에서). 시험 도구(build/test.mjs·tools/play)가 이름으로 부르는 것은 두고 알림
export function dropMethods(src, names, parser) { const root = parser.parse(src).rootNode, cuts = [];
  walk(root, n => { if (n.type !== 'method_definition' || n.parent?.type !== 'class_body' || !names.has(`${n.parent.parent?.childForFieldName('name')?.text}.${n.childForFieldName('name')?.text}`)) return;
    let first = n; for (let p = n.previousSibling; p?.type === 'comment' && !/\n\s*\n/.test(src.slice(p.endIndex, first.startIndex)); p = p.previousSibling) first = p; cuts.push([src.lastIndexOf('\n', first.startIndex - 1) + 1, n.endIndex]); return false; });
  let t = src; for (const [a, b] of cuts.sort((x, y) => y[0] - x[0])) t = t.slice(0, a) + t.slice(b).replace(/^[ \t]*\n/, ''); return { text: t, n: cuts.length }; }
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes('--dead')) {
  const { analyze } = await import('./lib/analyze.mjs'), { reachable } = await import('./lib/history.mjs'), A = await analyze(ROOT), html = readFileSync(join(ROOT, 'src/index.html'), 'utf8'), reach = reachable(A.units, A.fns, html, new Set((A.R.act?.deadH || []).map(x => x.act)));
  const drv = ['build/test.mjs', ...readdirSync(join(ROOT, 'tools/play'), { recursive: true }).filter(f => String(f).endsWith('.mjs') && !/^(games|reports|fixtures|node_modules)\//.test(f)).map(f => `tools/play/${f}`)].map(f => readFileSync(join(ROOT, f), 'utf8')).join('\n');
  const dead = [...A.fns.values()].filter(f => f.top && f.cls && f.unit === 'main' && !reach.has(f.key)), inTests = dead.filter(f => new RegExp(`\\b${f.name}\\b`).test(drv)), drop = dead.filter(f => !inTests.includes(f));
  console.log(`닿지 않는 메서드 ${dead.length}: 지울 것 ${drop.length}(${drop.map(f => `${f.cls}.${f.name}`).join(' · ')}) · 시험 도구가 부르니 둠 ${inTests.length}(${inTests.map(f => `${f.cls}.${f.name}`).join(' · ')})`);
  if (APPLY && drop.length) { const names = new Set(drop.map(f => `${f.cls}.${f.name}`)); for (const f of readdirSync(MAIN).filter(f => f.endsWith('.js'))) { const R = dropMethods(readFileSync(join(MAIN, f), 'utf8'), names, TS.parser); if (R.n) { writeFileSync(join(MAIN, f), R.text); console.log(`${f}: ${R.n}개 지움`); } } }
  process.exit(0); }
// node tools/reshape.mjs --refs [--apply] [--drop-aliases]: 규칙 A1(옛 이름 다리로 부름)이 낸 고칠 자리(파일·줄·칸·길이)를 그대로 바꿈 — 앱 코드·시험 도구의 페이지 안 코드에서
//   다리 이름 → Class.이름(줄임 {이름} → 이름: Class.이름, window.이름 → Class.이름). 동적 전역 접근(window[…])은 바꾸지 않고 남은 수만 알림. --drop-aliases: 다 바꿨으면 src/main/99-aliases.js를 지움
export function applyRefEdits(text, edits) { const L = String(text).split('\n'), seen = new Set(); for (const e of [...edits].sort((x, y) => y.line - x.line || y.col - x.col)) { const k = `${e.line}:${e.col}`; if (seen.has(k)) continue; seen.add(k); const l = L[e.line - 1]; L[e.line - 1] = l.slice(0, e.col) + e.to + l.slice(e.col + e.len); } return L.join('\n'); }
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes('--refs')) {
  const { analyze } = await import('./lib/analyze.mjs'), { aliasUses } = await import('./lib/rules.mjs'), A = await analyze(ROOT), drv = ['build/test.mjs', ...readdirSync(join(ROOT, 'tools/play'), { recursive: true }).filter(f => String(f).endsWith('.mjs') && !/^(games|reports|fixtures|node_modules)\//.test(f)).map(f => `tools/play/${f}`)];
  const items = aliasUses(A.units, readFileSync(join(ROOT, 'src/index.html'), 'utf8'), drv.map(f => ({ path: f, text: readFileSync(join(ROOT, f), 'utf8') }))), byFile = new Map(); for (const x of items.filter(x => x.edit)) { if (!byFile.has(x.edit.file)) byFile.set(x.edit.file, []); byFile.get(x.edit.file).push(x.edit); }
  const left = items.filter(x => !x.edit); console.log(`다리 거치는 곳 ${items.length}: 바꿀 자리 ${items.length - left.length}(파일 ${byFile.size}) · 못 바꿈 ${left.length}${left.length ? ` (${[...new Set(left.map(x => x.kind))].join(' · ')}: ${left.slice(0, 6).map(x => x.at).join(', ')})` : ''}`);
  if (APPLY) { for (const [f, es] of byFile) writeFileSync(join(ROOT, f), applyRefEdits(readFileSync(join(ROOT, f), 'utf8'), es)); console.log('고침: ' + [...byFile.keys()].join(' · '));
    if (process.argv.includes('--drop-aliases')) { if (left.length) console.log('다리를 지우지 않음 — 못 바꾼 곳이 남음'); else { execFileSync('git', ['rm', '-q', 'src/main/99-aliases.js'], { cwd: ROOT }); console.log('지움: src/main/99-aliases.js'); } } }
  process.exit(0); }
// node tools/reshape.mjs --drivers [--apply]: 페이지를 모는 시험 도구(build/test.mjs·tools/play)가 다리 이름을 덮어써 가로채는 줄(규칙 A1 — 시험 도구가 덮어씀)에서
//   그 줄의 다리 이름(window.이름·이름)을 모두 Class.이름으로 — 덮어쓰기와 원본 담기(const tt = toast)를 같이 바꿔야 가짜가 다리를 거쳐 자기를 부르지 않음
export function driverEdits(text, path, items) { const L = String(text).split('\n'), lines = new Map(); for (const x of items) { const m = String(x.at).match(/^(.*):(\d+)$/); if (m && m[1] === path) { if (!lines.has(+m[2])) lines.set(+m[2], new Map()); lines.get(+m[2]).set(x.name, x.to); } }
  let n = 0; for (const [ln, names] of lines) { const re = new RegExp(`(?<![\\w$.])(?:window\\.|globalThis\\.)?(${[...names.keys()].join('|')})(?![\\w$])(?!\\s*:)`, 'g'); L[ln - 1] = L[ln - 1].replace(re, (m0, nm) => { n++; return `${names.get(nm)}.${nm}`; }); }
  return { text: L.join('\n'), n, lines: lines.size }; }
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes('--drivers')) {
  const { analyze } = await import('./lib/analyze.mjs'), { aliasUses } = await import('./lib/rules.mjs'), A = await analyze(ROOT), files = ['build/test.mjs', ...readdirSync(join(ROOT, 'tools/play'), { recursive: true }).filter(f => String(f).endsWith('.mjs') && !/^(games|reports|fixtures|node_modules)\//.test(f)).map(f => `tools/play/${f}`)];
  const items = aliasUses(A.units, '', files.map(f => ({ path: f, text: readFileSync(join(ROOT, f), 'utf8') }))).filter(x => x.driver);
  for (const f of new Set(items.map(x => x.at.replace(/:\d+$/, '')))) { const E = driverEdits(readFileSync(join(ROOT, f), 'utf8'), f, items); console.log(`${f}: 줄 ${E.lines} · 바꿈 ${E.n}`); if (APPLY) writeFileSync(join(ROOT, f), E.text); }
  process.exit(0); }
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes('--hoist')) {
  const F = join(MAIN, '90-load.js'), src = readFileSync(F, 'utf8'), { parser } = await tsInit(), root = parser.parse(src).rootNode, head = (src.match(/^\/\* =====[^\n]*\n/) || [''])[0];
  const P = hoistPlan(src.slice(head.length), parser.parse(src.slice(head.length)).rootNode), firstRun = P.rest.findIndex(x => !x.decl.length), moved = P.up.filter(x => x.i > (P.rest[firstRun]?.i ?? Infinity));
  console.log(`90-load.js 문장 ${P.up.length + P.rest.length}: 부작용 없는 선언 ${P.up.length}(그중 실행 문장 뒤에 있던 것 ${moved.length}: ${moved.flatMap(x => x.decl).slice(0, 30).join(' · ')}${moved.length > 30 ? ' …' : ''}) · 나머지 ${P.rest.length}`);
  const kept = P.rest.filter(x => x.decl.length); console.log(`안 올린 선언 ${kept.length}: ${kept.map(x => `${x.decl.slice(0, 3).join(',')}(${x.why})`).join(' · ')}`);
  if (APPLY) { writeFileSync(F, head + '/* ── 부작용 없는 선언(상수·상태 초기값 — tools/reshape.mjs --hoist가 실행 문장 앞으로 올림, 원래 순서) ── */\n' + P.up.map(x => x.text.replace(/^\n+/, '')).join('\n') + '\n/* ── 불러올 때 도는 문장(원래 순서) ── */\n' + P.rest.map(x => x.text.replace(/^\n+/, '')).join('\n') + P.tail); console.log('고침: src/main/90-load.js'); }
  process.exit(0); }
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const html = readFileSync(join(ROOT, 'www/index.html'), 'utf8'), units = await loadHtmlUnits(html, 'www/index.html'), main = units.find(u => u.name === 'main'), src = main.text, root = main.tree.rootNode;
  const map = JSON.parse(readFileSync(join(ROOT, 'tools/out/redesign-map-www.json'), 'utf8')).filter(x => /#ggm-main/.test(x.loc)), info = new Map(map.map(x => [x.name, x]));
  const owner = new Map(); for (let i = 0; i < root.namedChildCount; i++) { const c = root.namedChild(i); if (FN.test(c.type)) { const nm = c.childForFieldName('name')?.text, m = info.get(nm); owner.set(nm, ownerOf(m?.feature || '미정', m?.kind || 'Helper')); } }
  const edits = renameEdits(root, owner), classes = new Map(), rest = []; let prevEnd = 0;
  for (let i = 0; i < root.childCount; i++) { const c = root.child(i); if (c.type === 'comment') continue; const start = Math.max(prevEnd, leadComments(src, src.lastIndexOf('\n', c.startIndex - 1) + 1)) /* 한 줄에 문장이 여럿이면 앞 문장 끝부터 */;
    if (FN.test(c.type)) { const nm = c.childForFieldName('name').text, o = owner.get(nm), body = applyEdits(src.slice(c.startIndex, c.endIndex), c.startIndex, edits), lead = src.slice(start, c.startIndex);
      if (!classes.has(o)) classes.set(o, []); classes.get(o).push(lead.replace(/^/gm, '  ').replace(/ +$/, '') + toMethod(body, nm).replace(/\n/g, '\n  ')); /* 글 안 줄도 들여 씀 — 프롬프트가 바뀜(아래 --strings로 고침; 다시 옮길 때는 indentCode로) */ }
    else rest.push(applyEdits(src.slice(start, c.endIndex), start, edits)); prevEnd = c.endIndex; }
  const featOfClass = o => o.replace(/(View|Ctl)$/, ''), files = new Map(); for (const [o, ms] of classes) { const f = FILE[featOfClass(o)] || `10-${featOfClass(o).toLowerCase()}`; if (!files.has(f)) files.set(f, []); files.get(f).push(`class ${o} {\n${ms.map(m => '  ' + m).join('\n\n')}\n}\n`); }
  console.log(`함수 ${owner.size} → class ${classes.size}(${[...classes].map(([o, m]) => `${o} ${m.length}`).join(' · ')}) · 이름 바꾼 자리 ${edits.length} · 함수 아닌 맨 위 문장 ${rest.length} · 파일 ${files.size + 2}`);
  if (APPLY) { try { execFileSync('git', ['rm', '-r', '-q', '-f', '--ignore-unmatch', MAIN], { cwd: ROOT, stdio: 'ignore' }); } catch { /* 이미 지움 */ } rmSync(MAIN, { recursive: true, force: true }); mkdirSync(MAIN, { recursive: true });
    const HEAD = { '00-core': '상위 class와 공용(Shared — 여러 기능이 같이 쓰는 함수). 재설계 docs/redesign.md 3절의 상위 class(Repository·Generator·View·Dialog·Service)로 옮겨 갈 자리', '80-misc': '미정(매핑 표에 없는 data만 다루거나 이어진 함수가 없음) — 매핑 표를 채우거나 지울 대상' };
    for (const [f, cs] of [...files].sort()) writeFileSync(join(MAIN, f + '.js'), `/* ===== ${f.replace(/^\d+-/, '')} — ${HEAD[f] || '기능 class(Model · View · Ctl) — docs/redesign.md 2·3절, tools/reshape.mjs가 매핑대로 옮김'} ===== */\n` + cs.join('\n'));
    writeFileSync(join(MAIN, '90-load.js'), '/* ===== 불러올 때 — 상수·상태·리스너(함수가 아닌 맨 위 문장, 원래 순서). class 선언 뒤에 둠(class는 끌어올려지지 않음) ===== */\n' + rest.join('\n') + '\n');
    writeFileSync(join(MAIN, '99-aliases.js'), '/* ===== 임시 다리: 옛 전역 함수 이름 → class 메서드(시험·HTML onclick·엔진 모듈이 옛 이름으로 부름) — 다 바꾸면 지움(docs/restructure.md 이슈) ===== */\n' + [...owner].map(([n, o]) => `function ${n}(...a) { return ${o}.${n}(...a); }`).join('\n') + '\n');
    console.log(`src/main을 새로 씀: ${readdirSync(MAIN).join(' ')}`); } }
