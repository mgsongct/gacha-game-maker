#!/usr/bin/env node
// 스튜디오 밖 지시문을 프롬프트 스튜디오 조각으로 옮기기(치환 도구). 원칙: 프롬프트는 스튜디오에 파편화되지 않게 한곳에 모아 두고 거기서 개선(CLAUDE.md §0-1).
//   node tools/prompts-move.mjs <목록.json> [--dry]
//   node tools/prompts-move.mjs --req [--dry]   남은 요청 글: 요청 조립 식째 스튜디오 「요청 조립」으로(아래 codeMove)
//   node tools/prompts-move.mjs --fns [--dry]   프롬프트 글을 돌려주는 조립 함수·글 상수를 선언째 스튜디오 「조립 함수」로
//   node tools/prompts-move.mjs --slots [--dry]   이미 옮긴 조각의 뜻 없는 자리 이름({v}·{String} 등)을 식에서 다시 짓기
//   목록: {"group":"묶음 이름","items":[{"at":"src/main/x.js:줄","head":"지시문 글 머리(도구 보고서의 「…」)","id":"조각_ID","label":"스튜디오에 보일 이름"}]}
// 하는 일: 그 지시문 글(문자열·템플릿)을 원문 그대로 조각 기본값으로 옮기고, 템플릿의 ${식}은 이름 붙은 자리 {이름}으로 바꿔
//   호출 지점을 pf('조각_ID',{이름:식}) 으로 바꿈. 템플릿에 "JSON만 출력"(llmWrap·aiJSON이 찾는 표식)이 있으면 그 앞까지만 옮기고 표식·스키마는 둠.
//   조각은 pfDef가 있는 파일(스튜디오) 「조각 모음」 끝에 묶음으로 넣음. 옮긴 뒤 보낸 프롬프트는 바이트 단위로 같아야 함(회귀 재생으로 확인).
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadUnits, walk } from './lib/source.mjs';
import { inlinePrompts, fragmentFiles } from './lib/prompts.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..'), END = '/* ===== 조각 모음 끝';

// 템플릿 원문(백틱 안) 훑기: 맨 위 ${식} 목록과 위치 — 문자열·중첩 템플릿·중괄호를 건너뜀
function exprEnd(s, i) { let d = 0;
  for (;;) { const c = s[i];
    if (c === "'" || c === '"') { const q = c; i++; while (s[i] !== q) { if (s[i] === '\\') i++; i++; } }
    else if (c === '`') i = tmplEnd(s, i + 1);
    else if (c === '{') d++;
    else if (c === '}') { if (!d) return i; d--; }
    i++; } }
function tmplEnd(s, i) { for (;;) { const c = s[i]; if (c === '\\') { i += 2; continue; } if (c === '`') return i; if (s.startsWith('${', i)) { i = exprEnd(s, i + 2) + 1; continue; } i++; } }
export function topSubs(body) { const out = []; for (let i = 0; i < body.length;) { if (body[i] === '\\') { i += 2; continue; } if (body.startsWith('${', i)) { const e = exprEnd(body, i + 2); out.push({ from: i, to: e + 1, expr: body.slice(i + 2, e) }); i = e + 1; continue; } i++; } return out; }
// 자리 이름: T('x') → x, 이름 → 그대로, 그 밖에는 식 안의 뜻 있는 속성 이름(c.profile → profile, m.elems.map(…) → elems, ROLE → role) —
// 메서드·내장 이름(slice·join·map·String·JSON …)은 건너뜀. 못 찾으면 v(겹치면 뒤에 번호)
const NOT_SLOT = new Set('slice join map filter trim length replace includes find some every keys values entries stringify parse max min round floor ceil from concat split toString padStart reduce sort reverse flat push indexOf toLowerCase toUpperCase test match String JSON Math Object Array Number Boolean Date new c o e x l s t n i k p r g m w f b d v a'.split(' '));
const meaningful = t => { const props = [...t.matchAll(/\.([A-Za-z_$][\w$]*)/g)].map(m => m[1]).filter(w => !NOT_SLOT.has(w)), ids = [...t.matchAll(/(^|[^.\w$'"])([A-Za-z_$][\w$]*)/g)].map(m => m[2]).filter(w => !NOT_SLOT.has(w) && !/^(G|P|T|esc|own|charById|true|false|null|undefined)$/.test(w));
  const w = props[0] || ids[0] || ''; return /^[A-Z][A-Z0-9_]+$/.test(w) ? w.toLowerCase().replace(/_(\w)/g, (_, c) => c.toUpperCase()) : w; };
export function slotName(expr, used) { const t = expr.trim(); let n = (t.match(/^T\('(\w+)'\)$/) || [])[1] || (/^[A-Za-z_$][\w$]*$/.test(t) ? t : '') || meaningful(t) || 'v';
  n = n.replace(/\$/g, '') || 'v'; if (!/^[A-Za-z]/.test(n)) n = 'v' + n; let k = n, i = 2; while (used.has(k) && used.get(k) !== t) k = n + i++; used.set(k, t); return k; }
// 지시문 글(원문 리터럴) → { frag: 조각 글, call: 호출 지점 식, keep: 리터럴에 남길 꼬리(표식·스키마) }
export function moveLiteral(lit, id) { const q = lit[0];
  if (q !== '`') { const body = lit.slice(1, -1).replace(q === "'" ? /\\'/g : /\\"/g, q); return { frag: body, call: `pf('${id}')`, keep: null }; }
  const body = lit.slice(1, -1), subs = topSubs(body), mk = (() => { let i = -1; for (let p = body.indexOf('JSON만 출력'); p >= 0; p = body.indexOf('JSON만 출력', p + 1)) if (!subs.some(x => p >= x.from && p < x.to)) i = p; return i; })();
  let cut = mk < 0 ? body.length : mk; while (cut > 0 && body.slice(cut - 2, cut) === '\\n') cut -= 2;
  const head = body.slice(0, cut), used = new Map(); let frag = '', last = 0; const vars = [];
  for (const x of subs.filter(x => x.to <= cut)) { const nm = slotName(x.expr, used); frag += head.slice(last, x.from) + '{' + nm + '}'; last = x.to; if (!vars.some(v => v[0] === nm)) vars.push([nm, x.expr.trim()]); }
  frag += head.slice(last);
  const call = `pf('${id}'${vars.length ? ',{' + vars.map(([n, e]) => n === e ? n : `${n}:${e}`).join(',') + '}' : ''})`;
  return { frag, call, keep: mk < 0 ? null : body.slice(cut), vars: vars.map(v => v[0]) }; }
// 호출 지점 pf('ID',{…})의 자리 목록 [{name, expr, from, to}] — 맨 위 쉼표로 나눔
export function callSlots(src, id) { const at = src.indexOf(`pf('${id}',{`); if (at < 0) return null; const o = at + `pf('${id}',`.length, end = exprEnd(src, o + 1), body = src.slice(o + 1, end), out = [];
  let d = 0, start = 0; const push = (a, b) => { const t = body.slice(a, b), m = t.match(/^\s*([A-Za-z_$][\w$]*)\s*(?::([\s\S]*))?$/); if (m) out.push({ name: m[1], expr: (m[2] ?? m[1]).trim() }); };
  for (let i = 0; i < body.length; i++) { const c = body[i]; if (c === "'" || c === '"') { const q = c; i++; while (body[i] !== q) { if (body[i] === '\\') i++; i++; } } else if (c === '`') i = tmplEnd(body, i + 1); else if ('([{'.includes(c)) d++; else if (')]}'.includes(c)) d--; else if (c === ',' && !d) { push(start, i); start = i + 1; } }
  push(start, body.length); return { at, from: o, to: end + 1, slots: out }; }
// 뜻 없는 자리 이름(v·v2·String·length 같은 옮기기 도구의 예전 이름)을 식에서 다시 짓기 — 조각 글·자리 목록·호출 지점을 같이 바꿈
const POOR = /^(v\d*|String|length|JSON|Math|join|slice|map)$/;
export function renameSlots(studio, srcs) { let changed = 0; const out = new Map(srcs);
  studio = studio.replace(/^pfDef\('(\w+)','((?:[^'\\]|\\.)*)',\(\)=>`((?:[^`\\]|\\.)*)`,'자리: ([^']*)'\);$/gms, (all, id, label, frag, where) => {
    const file = [...out.keys()].find(f => out.get(f).includes(`pf('${id}',{`)); if (!file) return all; const src = out.get(file), cs = callSlots(src, id); if (!cs || !cs.slots.some(x => POOR.test(x.name))) return all;
    const used = new Map(cs.slots.filter(x => !POOR.test(x.name)).map(x => [x.name, x.expr])), ren = new Map();
    for (const x of cs.slots) if (POOR.test(x.name)) { const n = slotName(x.expr, used); ren.set(x.name, n); }
    const sub = t => t.replace(/\{([A-Za-z]\w*)\}/g, (m, k) => ren.has(k) ? `{${ren.get(k)}}` : m);
    const call = '{' + cs.slots.map(x => { const n = ren.get(x.name) || x.name; return n === x.expr ? n : `${n}:${x.expr}`; }).join(',') + '}';
    out.set(file, src.slice(0, cs.from) + call + src.slice(cs.to)); changed++;
    return `pfDef('${id}','${label}',()=>\`${sub(frag)}\`,'자리: ${sub(where)}');`; });
  return { studio, srcs: out, changed }; }
const pfLine = (id, label, frag, vars) => `pfDef('${id}','${label.replace(/'/g, "\\'")}',()=>\`${frag}\`${vars && vars.length ? `,'자리: ${vars.map(v => '{' + v + '}').join(' ')}'` : ''});`;

// 요청 조립 코드 옮기기(--req · --fns): 스튜디오 밖에 남은 프롬프트 글을 그 글을 만드는 코드째 스튜디오 모듈로(원문 그대로 — 뜻이 같아야 함).
//   --req: 글 AI·그림 AI 호출의 프롬프트 인자 식과 그 식이 글로 쓰는 지역 변수의 값(const FAN=…) → 스튜디오 「요청 조립」 파일의 함수. 자리에는 그 함수 호출.
//          식이 쓰는 지역 이름만 인자로 넘김(최상위·전역 이름은 그대로 — scope.freeNames). await·바깥 지역 이름에 쓰기·this가 든 식은 옮기지 않고 알림
//   --fns: 그 식이 부르거나 가리키는 최상위 함수·글 상수 중 프롬프트 글을 돌려주는 것(ctx·charSchema·*_SCHEMA·composeNai·태그 표 …) → 스튜디오 「조립 함수」 파일로 선언째.
//          옮긴 const가 불러올 때 계산되면 앞뒤 파일 순서(모듈 → main 이름순)로 아직 없는 이름을 쓰는지(TDZ) 보고 막음
//   스튜디오는 폴더 모듈(src/main/0025-prompt-studio/)이어야 함. 옮긴 뒤: 빌드 · node build/test.mjs · node tools/play/combos.mjs --ref HEAD(보낸 프롬프트가 바이트 단위로 같은지)
const MAIN_ORDER = root => { const tree = d => readdirSync(d).filter(f => !f.startsWith('.')).sort().flatMap(f => statSync(join(d, f)).isDirectory() ? tree(join(d, f)) : [join(d, f)]);
  return [...['src/modules/app', 'src/modules/combat'].flatMap(d => existsSync(join(root, d)) ? tree(join(root, d)) : []), ...tree(join(root, 'src/main'))].filter(f => f.endsWith('.js')).map(f => relative(root, f)); }; // 실행 순서: 모듈 블록 → main(src/index.html)
// 옮길 것 모으기: 요청 지점마다 프롬프트 흐름(깊이 0 = 인자 식·지역 변수 값 → --req, 깊이 1↑ = 부르는 최상위 선언 → --fns)
function collectMoves(L, mode) { const { units, home, P, freeNames, inModule, read, notes, adds, edit, fresh } = L;
  const has = (node, pred) => { let hit = false; walk(node, n => { if (hit) return false; if ((n.type === 'string' || n.type === 'template_string') && P.outputPos(n) && pred(P.ownText(n))) hit = true; }); return hit; };
  const place = (file, node, line) => { const src = read(file), t = node.text; let best = -1, bd = Infinity; for (let i = src.indexOf(t); i >= 0; i = src.indexOf(t, i + 1)) { const d = Math.abs(src.slice(0, i).split('\n').length - line); if (d < bd) { bd = d; best = i; } } return best; }; // 같은 원문이 여럿이면 그 줄의 것
  for (const [sinks, pred] of [[undefined, P.promptText], [P.IMAGE_SINKS, P.tagText]]) { const F = P.promptFlow(units, { sinks, tables: sinks === P.IMAGE_SINKS }), seen = new Set();
    for (const s of F.sites) { if (inModule(s.loc, home)) continue; const exprs = [], tops = [];
      F.flow([{ u: s.u, node: s.root }], () => {}, (node, u, depth) => { if (depth === 0) exprs.push({ u, node }); else { let t = node; while (t.parent && t.parent.type !== 'program') t = t.parent; tops.push({ u, node: t }); } });
      for (const { u, node } of mode === 'req' ? exprs : tops) { const [file, line] = u.loc(node).split(':'); if (inModule(file, home) || seen.has(node.id) || !has(node, pred)) continue; seen.add(node.id);
        if (mode === 'req') reqMove({ ...L, place }, s, u, node, file, +line, sinks, exprs, seen); else fnMove({ ...L, place }, node, u, file, +line); } } } }
// --req 하나: 식을 함수로 — 지역 이름만 인자로(바깥 식을 옮기면 안쪽은 같이 감)
function reqMove(L, s, u, node, file, line, sinks, exprs, seen) { const { freeNames, notes, adds, edit, fresh, place } = L;
  if (exprs.some(o => o.node.id !== node.id && o.u === u && o.node.startIndex <= node.startIndex && o.node.endIndex >= node.endIndex && seen.has(o.node.id))) return;
  const fn = freeNames(node); if (fn.hasAwait || fn.hasThis || fn.writes.length) { notes.push(`옮기지 않음 ${file}:${line} ${s.owner} — ${fn.hasAwait ? 'await' : fn.hasThis ? 'this' : '바깥 이름에 씀 ' + fn.writes.join(',')}`); return; }
  let kase = null; for (let c = node; c && c.type !== 'program'; c = c.parent) if (c.type === 'switch_case') { kase = c.childForFieldName('value')?.text.replace(/^['"]|['"]$/g, ''); break; }
  const decl = node.parent?.type === 'variable_declarator' ? node.parent.childForFieldName('name')?.text : null, base = (kase || s.owner).replace(/[^\w$]/g, '');
  const name = fresh(decl ? `${base}${decl[0].toUpperCase()}${decl.slice(1)}Text` : `${base}${sinks ? 'Tags' : 'Prompt'}`), arg = fn.locals.length ? `{${fn.locals.join(',')}}` : '', at = place(file, node, line);
  if (at < 0) { notes.push(`원문을 못 찾음 ${file}:${line}`); return; }
  edit(file, at, node.text.length, `${name}(${arg})`); adds.push({ file, line, owner: s.owner, text: `function ${name}(${arg}){ return ${node.text}; }` }); }
// --fns 하나: 최상위 선언째(바로 위 // 주석 포함)
function fnMove(L, node, u, file, line) { const { read, notes, adds, edit, place } = L;
  const nm = node.type === 'function_declaration' ? node.childForFieldName('name')?.text : node.namedChildren?.find(c => c.type === 'variable_declarator')?.childForFieldName('name')?.text;
  if (!nm || node.type === 'expression_statement') return; const at = place(file, node, line); if (at < 0) { notes.push(`선언을 못 찾음 ${file}:${line} ${nm}`); return; }
  const src = read(file), pre = src.slice(0, at).match(/(?:^|\n)((?:\/\/[^\n]*\n)+)$/), a0 = pre ? at - pre[1].length : at;
  edit(file, a0, at - a0 + node.text.length + (src[at + node.text.length] === '\n' ? 1 : 0), ''); adds.push({ file, line, owner: nm, decl: node, u, text: src.slice(a0, at + node.text.length) }); }
// TDZ: 옮긴 const가 불러올 때 계산하는 이름이 스튜디오보다 늦게 실행되는 파일의 const면 옮기지 않음
function tdzFilter(L, target) { const { units, adds, edits, read, notes } = L, order = MAIN_ORDER(ROOT), ti = order.indexOf(target) >= 0 ? order.indexOf(target) : order.findIndex(f => f > target), lexIn = new Map();
  units.forEach(u => { const r = u.tree.rootNode; for (let i = 0; i < r.childCount; i++) { const c = r.child(i); if (c.type === 'lexical_declaration') c.namedChildren.filter(d => d.type === 'variable_declarator').forEach(d => lexIn.set(d.childForFieldName('name')?.text, u.loc(c).split(':')[0])); } });
  for (const x of adds.filter(y => y.decl && y.decl.type === 'lexical_declaration')) { const bad = []; walk(x.decl, n => { if (/^(arrow_function|function_expression|function_declaration)$/.test(n.type)) return false; if (n.type === 'identifier' && lexIn.has(n.text) && order.indexOf(lexIn.get(n.text)) >= ti && !adds.some(y => y.owner === n.text)) bad.push(n.text); });
    if (bad.length) { notes.push(`TDZ: ${x.owner}(${x.file}) 값이 스튜디오보다 늦게 정해지는 ${[...new Set(bad)].join(',')}를 씀 — 옮기지 않음`); adds.splice(adds.indexOf(x), 1); const es = edits.get(x.file); es.splice(es.findIndex(e => e.rep === '' && read(x.file).slice(e.at, e.at + e.len).includes(x.text)), 1); } } }
async function codeMove(mode, dry) {
  const P = await import('./lib/prompts.mjs'), { freeNames, inModule } = await import('./lib/scope.mjs'), units = await loadUnits(ROOT), home = fragmentFiles(units).home;
  if (!home || !home.endsWith('/')) { console.log(`스튜디오(${home})가 폴더 모듈이 아니에요 — src/main/0025-prompt-studio/ 폴더로 먼저 옮기세요`); process.exit(1); }
  const files = new Map(), read = f => { if (!files.has(f)) files.set(f, readFileSync(join(ROOT, f), 'utf8')); return files.get(f); }, notes = [], adds = [], edits = new Map(), topNames = new Set();
  units.forEach(u => { const r = u.tree.rootNode; for (let i = 0; i < r.childCount; i++) { const c = r.child(i), nm = c.type === 'function_declaration' ? c.childForFieldName('name')?.text : (c.type === 'lexical_declaration' || c.type === 'variable_declaration') ? c.namedChildren.find(x => x.type === 'variable_declarator')?.childForFieldName('name')?.text : null; if (nm) topNames.add(nm); } });
  const L = { units, home, P, freeNames, inModule, read, notes, adds, edits, edit: (file, at, len, rep) => { if (!edits.has(file)) edits.set(file, []); edits.get(file).push({ at, len, rep }); }, fresh: n => { let k = n, i = 2; while (topNames.has(k)) k = n + i++; topNames.add(k); return k; } };
  collectMoves(L, mode); const target = home + (mode === 'req' ? '020-requests.js' : '030-builders.js'); if (mode === 'fns') tdzFilter(L, target);
  const groups = new Map(); adds.forEach(x => { if (!groups.has(x.file)) groups.set(x.file, []); groups.get(x.file).push(x); });
  const head = mode === 'req' ? '/* ===== 프롬프트 스튜디오: 요청 조립 — 기능 파일이 글 AI·그림 AI에 보내는 요청 글(머리말·답 형식 견본·조건부 지시)을 여기서 만들고, 기능 파일은 데이터만 넘김 ===== */' : '/* ===== 프롬프트 스튜디오: 조립 함수 — 여러 요청이 같이 쓰는 프롬프트 글(AI 컨텍스트·답 형식 견본·그림 태그 표·태그 조립) ===== */';
  if (!dry) { for (const [f, es] of edits) { let t = read(f); es.sort((a, b) => b.at - a.at).forEach(e => { t = t.slice(0, e.at) + e.rep + t.slice(e.at + e.len); }); writeFileSync(join(ROOT, f), t); }
    if (adds.length) { const tf = join(ROOT, target), cur = existsSync(tf) ? readFileSync(tf, 'utf8') : head + '\n'; writeFileSync(tf, cur.replace(/\n*$/, '\n') + [...groups].map(([f, xs]) => `/* ${f} */\n${xs.map(x => x.text).join('\n')}`).join('\n') + '\n'); } }
  console.log(`${dry ? '(미리보기) ' : ''}${mode === 'req' ? '요청 조립 식' : '조립 함수·글 상수'} ${adds.length}개 → ${target} (파일 ${groups.size}곳)`); groups.forEach((xs, f) => console.log(`  ${f}: ${xs.map(x => x.owner).join(', ')}`)); notes.forEach(n => console.log('  ' + n)); }
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url) && (process.argv.includes('--req') || process.argv.includes('--fns'))) { await codeMove(process.argv.includes('--req') ? 'req' : 'fns', process.argv.includes('--dry')); process.exit(0); }
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes('--slots')) { // 이미 옮긴 조각의 뜻 없는 자리 이름 다시 짓기
  const units = await loadUnits(ROOT), home = fragmentFiles(units).home, files = units.flatMap(u => u.files.map(f => f.path)).filter(f => f !== home), srcs = new Map(files.map(f => [f, readFileSync(join(ROOT, f), 'utf8')]));
  const r = renameSlots(readFileSync(join(ROOT, home), 'utf8'), srcs); if (!process.argv.includes('--dry')) { writeFileSync(join(ROOT, home), r.studio); for (const [f, t] of r.srcs) if (t !== srcs.get(f)) writeFileSync(join(ROOT, f), t); }
  console.log(`자리 이름을 다시 지은 조각 ${r.changed}개${process.argv.includes('--dry') ? '(미리보기)' : ''}`); process.exit(0); }
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const spec = JSON.parse(readFileSync(resolve(process.argv[2]), 'utf8')), dry = process.argv.includes('--dry'), units = await loadUnits(ROOT), rows = inlinePrompts(units, { nodes: true }), home = fragmentFiles(units).home;
  const files = new Map(), read = f => { if (!files.has(f)) files.set(f, readFileSync(join(ROOT, f), 'utf8')); return files.get(f); }, lines = [];
  const found = spec.items.map(it => ({ it, r: rows.find(x => x.loc === it.at && x.head.startsWith(it.head)) })).sort((a, b) => (b.r?.text.length || 0) - (a.r?.text.length || 0)); // 바깥 글(긴 것)부터 — 안쪽 글은 바깥을 옮긴 뒤에도 호출 지점 식에 그대로 남음
  for (const { it, r } of found) { const [file] = it.at.split(':');
    if (!r) { console.log(`없음: ${it.at} 「${it.head}」 — 도구 보고서의 위치·머리를 확인하세요`); process.exitCode = 1; continue; }
    const src = read(file), at = src.indexOf(r.text); if (at < 0 || src.indexOf(r.text, at + 1) >= 0) { console.log(`원문을 하나로 찾지 못함: ${it.at} 「${it.head}」`); process.exitCode = 1; continue; }
    const m = moveLiteral(r.text, it.id), rep = m.keep != null ? '`${' + m.call + '}' + m.keep + '`' : m.call;
    files.set(file, src.slice(0, at) + rep + src.slice(at + r.text.length)); lines.push(pfLine(it.id, it.label, m.frag, m.vars));
    console.log(`${it.id} ← ${it.at} 「${it.head}」${m.vars && m.vars.length ? ' 자리 ' + m.vars.join(' ') : ''}`); }
  if (!lines.length) process.exit(process.exitCode || 1);
  const st = read(home).split('\n'), k = st.findIndex(l => l.startsWith(END)); if (k < 0) { console.log(`스튜디오(${home})에 조각 모음 끝 표식(${END}…)이 없어요`); process.exit(1); } // 여러 줄 조각이 있어 줄 머리로는 끝을 못 찾음 — 표식 앞에 넣음
  files.set(home, [...st.slice(0, k), `// ── ${spec.group}`, ...lines, ...st.slice(k)].join('\n'));
  if (dry) { console.log(`(미리보기) 조각 ${lines.length}개 → ${home}`); process.exit(0); }
  for (const [f, t] of files) writeFileSync(join(ROOT, f), t); console.log(`조각 ${lines.length}개를 ${home}의 「${spec.group}」 묶음으로 옮김 — 빌드·테스트·회귀 재생(보낸 프롬프트 동일)으로 확인하세요`);
}
