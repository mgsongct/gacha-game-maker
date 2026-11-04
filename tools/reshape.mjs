#!/usr/bin/env node
// 재설계 1단계(기계적으로 옮기기): node tools/reshape.mjs [--apply]
//   입력: 빌드된 www/index.html의 ggm-main 스크립트(사용자 지시 U21 — 재설계 입력은 index.html) + 추상 매핑 결과(tools/out/redesign-map-www.json — node tools/redesign.mjs --map)
//   함수마다 매핑된 기능·종류대로 class의 static 메서드로: 기능 X → X(Model: Repository·Generator·Service·Helper) · XView(Screen·Dialog) · XCtl(Controller)
//     Shared → Core·CoreView·CoreCtl, 미정 → Misc…, 브라우저 전역과 겹치는 이름(Image)은 바꿈(Art)
//   함수를 가리키는 곳(부름·값으로 넘김·{이름} 줄임)은 범위를 따져 Owner.name으로 — 지역 이름이 가리면 그대로
//   파일: src/main/00-core.js(상위 class 뼈대 + Core…) · 10-<기능>.js(기능의 class들) · 90-load.js(함수가 아닌 맨 위 문장 — 상수·상태·리스너 — 원래 순서)
//     · 99-aliases.js(옛 전역 이름 → Owner.name 임시 다리: 시험·HTML onclick·엔진 모듈이 부르는 이름 — 이슈로 기록하고 나중에 지움)
//   class 선언은 끌어올려지지 않으므로 class 파일을 앞에, 불러올 때 도는 문장(90-load)을 뒤에 둠. 깨지는 것은 고치지 않고 이슈로(사용자 지시 U16)
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { loadHtmlUnits } from './lib/source.mjs';
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
const applyEdits = (text, base, edits) => { let t = text; edits.filter(e => e.a >= base && e.b <= base + text.length).sort((x, y) => y.a - x.a).forEach(e => { t = t.slice(0, e.a - base) + e.to + t.slice(e.b - base); }); return t; };
// function 선언 글 → static 메서드 글
export const toMethod = (fnText, name) => fnText.replace(new RegExp(`^(\\s*)(async\\s+)?function(\\s*\\*)?\\s+${name.replace(/\$/g, '\\$')}\\s*\\(`), (m, sp, as, gen) => `${sp}static ${as || ''}${gen ? '*' : ''}${name}(`);

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const html = readFileSync(join(ROOT, 'www/index.html'), 'utf8'), units = await loadHtmlUnits(html, 'www/index.html'), main = units.find(u => u.name === 'main'), src = main.text, root = main.tree.rootNode;
  const map = JSON.parse(readFileSync(join(ROOT, 'tools/out/redesign-map-www.json'), 'utf8')).filter(x => /#ggm-main/.test(x.loc)), info = new Map(map.map(x => [x.name, x]));
  const owner = new Map(); for (let i = 0; i < root.namedChildCount; i++) { const c = root.namedChild(i); if (FN.test(c.type)) { const nm = c.childForFieldName('name')?.text, m = info.get(nm); owner.set(nm, ownerOf(m?.feature || '미정', m?.kind || 'Helper')); } }
  const edits = renameEdits(root, owner), classes = new Map(), rest = []; let prevEnd = 0;
  for (let i = 0; i < root.childCount; i++) { const c = root.child(i); if (c.type === 'comment') continue; const start = Math.max(prevEnd, leadComments(src, src.lastIndexOf('\n', c.startIndex - 1) + 1)) /* 한 줄에 문장이 여럿이면 앞 문장 끝부터 */;
    if (FN.test(c.type)) { const nm = c.childForFieldName('name').text, o = owner.get(nm), body = applyEdits(src.slice(c.startIndex, c.endIndex), c.startIndex, edits), lead = src.slice(start, c.startIndex);
      if (!classes.has(o)) classes.set(o, []); classes.get(o).push(lead.replace(/^/gm, '  ').replace(/ +$/, '') + toMethod(body, nm).replace(/\n/g, '\n  ')); }
    else rest.push(applyEdits(src.slice(start, c.endIndex), start, edits)); prevEnd = c.endIndex; }
  const featOfClass = o => o.replace(/(View|Ctl)$/, ''), files = new Map(); for (const [o, ms] of classes) { const f = FILE[featOfClass(o)] || `10-${featOfClass(o).toLowerCase()}`; if (!files.has(f)) files.set(f, []); files.get(f).push(`class ${o} {\n${ms.map(m => '  ' + m).join('\n\n')}\n}\n`); }
  console.log(`함수 ${owner.size} → class ${classes.size}(${[...classes].map(([o, m]) => `${o} ${m.length}`).join(' · ')}) · 이름 바꾼 자리 ${edits.length} · 함수 아닌 맨 위 문장 ${rest.length} · 파일 ${files.size + 2}`);
  if (APPLY) { try { execFileSync('git', ['rm', '-r', '-q', '-f', '--ignore-unmatch', MAIN], { cwd: ROOT, stdio: 'ignore' }); } catch { /* 이미 지움 */ } rmSync(MAIN, { recursive: true, force: true }); mkdirSync(MAIN, { recursive: true });
    const HEAD = { '00-core': '상위 class와 공용(Shared — 여러 기능이 같이 쓰는 함수). 재설계 docs/redesign.md 3절의 상위 class(Repository·Generator·View·Dialog·Service)로 옮겨 갈 자리', '80-misc': '미정(매핑 표에 없는 data만 다루거나 이어진 함수가 없음) — 매핑 표를 채우거나 지울 대상' };
    for (const [f, cs] of [...files].sort()) writeFileSync(join(MAIN, f + '.js'), `/* ===== ${f.replace(/^\d+-/, '')} — ${HEAD[f] || '기능 class(Model · View · Ctl) — docs/redesign.md 2·3절, tools/reshape.mjs가 매핑대로 옮김'} ===== */\n` + cs.join('\n'));
    writeFileSync(join(MAIN, '90-load.js'), '/* ===== 불러올 때 — 상수·상태·리스너(함수가 아닌 맨 위 문장, 원래 순서). class 선언 뒤에 둠(class는 끌어올려지지 않음) ===== */\n' + rest.join('\n') + '\n');
    writeFileSync(join(MAIN, '99-aliases.js'), '/* ===== 임시 다리: 옛 전역 함수 이름 → class 메서드(시험·HTML onclick·엔진 모듈이 옛 이름으로 부름) — 다 바꾸면 지움(docs/restructure.md 이슈) ===== */\n' + [...owner].map(([n, o]) => `function ${n}(...a) { return ${o}.${n}(...a); }`).join('\n') + '\n');
    console.log(`src/main을 새로 씀: ${readdirSync(MAIN).join(' ')}`); } }
