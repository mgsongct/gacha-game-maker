#!/usr/bin/env node
// 재구조화(모듈 통합) 적용: node tools/restructure.mjs [--apply]
//   계획은 docs/restructure.md 2절 표 한곳(목표 모듈 · 모으는 지금 파일). 기본은 미리 보기, --apply면 git mv로 옮김.
//   파일이 하나인 목표는 src/main/<목표>.js로, 여럿이면 src/main/<목표>/ 폴더에 원래 파일 이름으로(같은 모듈 안 순서 유지).
//   깨진 연관은 고치지 않고(사용자 지시 U16) 세어서 docs/restructure.md 4절 이슈에 기록 — 옛 경로를 가리키는 문서·도구 설정, 나머지는 빌드·점검 도구가 잡음
// 해체: node tools/restructure.mjs --dissolve <src/main 기준 파일> [--apply] — 그 파일의 함수마다 연결 무게(자연 경계 그래프 naturalLean)가 가장 큰 다른 모듈이
//   제 모듈보다 무거우면 그 모듈로 옮김(tools/move.mjs). 옮길 곳: 폴더 모듈이면 <폴더>/<원래 파일 이름>, 파일 모듈이면 그 파일. 무게가 없거나 제 모듈이 무거우면 남김
// 계층으로 다시 짜기: node tools/restructure.mjs --layers [<모듈>] [--apply] — 모듈 안의 함수 선언을 계층(lib/arch.mjs LAYER_DEF)대로
//   <모듈>/1-model.js(Model·효과 없음) · 2-controller.js(Controller·액션 처리기·섞임 — 섞임은 나중에 나눔) · 3-view.js(View)로. 함수 선언만 옮김
//   (한 스크립트 안에서 끌어올려져 불러오는 순서 문제가 없음) — 상수·맨 위 문장은 원래 파일에 남고 이슈로 기록. 파일 모듈은 폴더로 바꿈.
//   프롬프트 스튜디오(설계상 층 — 조각·요청·조립)는 그대로
// 남은 조각 합치기: node tools/restructure.mjs --merge-rest [--apply] — 계층 파일(1-model·2-controller·3-view) 밖에 남은 옛 조각(상수·상태·불러올 때 문장)을
//   모듈마다 0-load.js 하나로(이름 순 = 불러오는 순서 그대로 이어 붙임), 주석뿐인 조각은 지움(git 이력에 있음 — 사용자 지시 U17)
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { loadUnits } from './lib/source.mjs';
import { buildGraph } from './lib/graph.mjs';
import { stateFlow } from './lib/flow.mjs';
import { moduleMap, naturalLean } from './lib/modules.mjs';
import { moduleOf } from './lib/scope.mjs';
import { fragmentFiles } from './lib/prompts.mjs';
import { analyze } from './lib/analyze.mjs';
import { buildMap } from './lib/map.mjs';
import { layers } from './lib/arch.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..'), MAIN = join(ROOT, 'src/main'), PLAN = join(ROOT, 'docs/restructure.md'), APPLY = process.argv.includes('--apply');
// 계획 표 읽기: | `목표` | 책임 | data | `파일` `폴더/*` … |
export function readPlan(md) { const rows = []; for (const line of String(md).split('\n')) { const c = line.split('|').map(s => s.trim()); if (c.length < 6 || !/^`\d{4}-[\w-]+`$/.test(c[1])) continue;
    rows.push({ target: c[1].slice(1, -1), files: [...c[4].matchAll(/`([^`]+)`/g)].map(m => m[1]) }); } return rows; }
// 계획 → 옮김 목록(원래 경로 → 새 경로, src/main 기준)
export function moves(plan, exists = p => existsSync(join(MAIN, p)), list = d => readdirSync(join(MAIN, d)).sort(), isDir = p => existsSync(join(MAIN, p)) && statSync(join(MAIN, p)).isDirectory()) { const out = [];
  for (const { target, files } of plan) { const srcs = files.flatMap(f => f.endsWith('/*') ? list(f.slice(0, -2)).map(x => `${f.slice(0, -2)}/${x}`) : [f]).filter(exists);
    if (!srcs.length) continue; const one = srcs.length === 1 && !files.some(f => f.endsWith('/*')) && !isDir(target) && (srcs[0] === `${target}.js` || !exists(`${target}.js`)) /* 이미 있는 목표(폴더·다른 파일)에 더하면 폴더로 */;
    for (const s of srcs) { const to = one ? `${target}.js` : `${target}/${basename(s)}`; if (to !== s) out.push({ from: s, to, target }); } }
  return out; }
// 옛 경로를 가리키는 곳(문서·도구 설정·시험) — 고치지 않고 셈
function staleRefs(mv) { const files = [], walkDir = d => { for (const x of readdirSync(d)) { const p = join(d, x); if (/node_modules|\/out$|ref-src|ref-tree|\.git$/.test(p)) continue; const s = statSync(p); if (s.isDirectory()) walkDir(p); else if (/\.(md|json|mjs)$/.test(x)) files.push(p); } };
  ['docs', 'tools', 'build'].forEach(d => walkDir(join(ROOT, d))); files.push(join(ROOT, 'CLAUDE.md'));
  const hits = new Map(); for (const f of files) { const t = readFileSync(f, 'utf8'); for (const m of mv) { const old = `src/main/${m.from}`; if (t.includes(old)) hits.set(f.replace(ROOT + '/', ''), (hits.get(f.replace(ROOT + '/', '')) || 0) + 1); } }
  return hits; }

// 해체 계획: 파일의 최상위 함수 → 연결 무게가 가장 큰 다른 모듈(제 모듈보다 무거울 때)
export async function dissolvePlan(root, rel) { const units = await loadUnits(root), { fns, tops } = buildGraph(units), sf = stateFlow(units, fns), home = fragmentFiles(units).home, M = moduleMap(units, fns, sf, { modOf: moduleOf, layer: home }), consts = new Set([...tops].filter(([, v]) => v.kind !== 'function').map(([k]) => k)), file = `src/main/${rel}`, own = moduleOf(file), out = new Map(), stay = [];
  /* 그래프에서 빠진 함수(공용 기반 모듈의 화면 함수 등)는 부르는 함수의 모듈별 수(25곳↑에서 불리는 공용 함수 빼고)로 */
  const calleeLean = f => { const by = new Map(); for (const k of f.calls.keys()) { const g = fns.get(k); if (!g?.top || g.callers.size >= 25) continue; const m = moduleOf(g.loc.split(':')[0]); by.set(m, (by.get(m) || 0) + 1); } return by.size ? [...by].sort((a, b) => b[1] - a[1]) : null; };
  for (const f of fns.values()) { if (!f.top || f.table || f.loc.split(':')[0] !== file) continue; const L = naturalLean(fns, sf, M, f.key, moduleOf, home, consts) || calleeLean(f), mine = (L || []).find(([m]) => m === own)?.[1] || 0, top = (L || []).find(([m]) => m !== own);
    if (!top || top[1] <= mine) { stay.push(f.name); continue; } const to = top[0].endsWith('/') ? `${top[0]}${basename(file)}` : top[0]; if (!out.has(to)) out.set(to, []); out.get(to).push(f.name); }
  return { moves: out, stay }; }
// 계층 계획: 모듈 → { '1-model.js': [이름], '2-controller.js': [...], '3-view.js': [...] }
const LAYER_FILE = { Model: '1-model.js', Controller: '2-controller.js', '섞임': '2-controller.js', View: '3-view.js' };
export async function layerPlan(root, only) { const A = await analyze(root), html = existsSync(join(root, 'www/index.html')) ? readFileSync(join(root, 'www/index.html'), 'utf8') : '', M = buildMap(A.units, A.fns, stateFlow(A.units, A.fns), html), L = layers(A.fns, new Set(Object.values(M.data).flatMap(d => Object.values(d.writers).flat()))), home = fragmentFiles(A.units).home, plan = new Map();
  for (const f of A.fns.values()) { if (!f.top || f.table || f.unit !== 'main' || f.node.type !== 'function_declaration') continue; const file = f.loc.split(':')[0], mod = moduleOf(file); if (mod === home || (only && !mod.includes(only))) continue;
    const lay = L.layer.get(f.key)?.layer || 'Model', base = mod.endsWith('/') ? mod : mod.replace(/\.js$/, '/'), to = base + (LAYER_FILE[lay] || '1-model.js'); if (file === to) continue;
    if (!plan.has(to)) plan.set(to, []); plan.get(to).push(f.name); }
  return plan; }
const LAYERS = process.argv.includes('--layers') ? (process.argv[process.argv.indexOf('--layers') + 1] || '').replace(/^--.*/, '') : null;
if (LAYERS !== null && process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) { const plan = await layerPlan(ROOT, LAYERS || null); let n = 0, bad = 0;
  for (const [to, names] of [...plan].sort()) { n += names.length; console.log(`  ${to.replace(/^src\/main\//, '')} ← ${names.length}`); if (!APPLY) continue;
    /* 파일 모듈(src/main/x.js)은 폴더로: 원래 파일을 폴더 안으로 먼저 옮김 */ const dir = dirname(join(ROOT, to)), single = dir + '.js'; if (existsSync(single) && !existsSync(dir)) { mkdirSync(dir, { recursive: true }); execFileSync('git', ['mv', single, join(dir, basename(single))], { cwd: ROOT }); }
    const args = ['tools/move.mjs', '--to', to, names.join(',')]; if (!existsSync(join(ROOT, to))) args.splice(3, 0, '--head', `${basename(dir)} — ${{ '1-model.js': 'Model(상태·규칙·저장·외부 서비스)', '2-controller.js': 'Controller(동작을 받아 Model을 바꾸고 다시 그리게 함 · 섞인 함수는 나눌 것)', '3-view.js': 'View(HTML·DOM을 만듦)' }[basename(to)]}`);
    try { execFileSync('node', args, { cwd: ROOT, encoding: 'utf8' }); } catch (e) { bad++; console.log('    옮기지 못함: ' + String(e.stdout || e.message).trim().split('\n').pop()); } }
  console.log(`${APPLY ? '' : '(미리 보기) '}계층으로: 함수 ${n} · 목표 파일 ${plan.size}${APPLY ? ` · 못 옮김 ${bad}` : ''}`); process.exit(0); }
const LAYER_SET = new Set(['0-load.js', '1-model.js', '2-controller.js', '3-view.js']), codeOf = t => t.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '').trim();
if (process.argv.includes('--merge-rest') && process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) { const home = 'src/main/0015-prompt-studio/'; let merged = 0, dropped = 0;
  for (const d of readdirSync(MAIN).sort()) { const dir = join(MAIN, d); if (!statSync(dir).isDirectory() || `src/main/${d}/` === home) continue; const rest = readdirSync(dir).filter(f => f.endsWith('.js') && !LAYER_SET.has(f)).sort(); if (!rest.length) continue;
    const keep = rest.filter(f => codeOf(readFileSync(join(dir, f), 'utf8'))), drop = rest.filter(f => !keep.includes(f)); console.log(`  ${d}: 합침 ${keep.length}(${keep.join(' ')}) · 지움 ${drop.length}`); merged += keep.length; dropped += drop.length; if (!APPLY) continue;
    const prev = existsSync(join(dir, '0-load.js')) ? readFileSync(join(dir, '0-load.js'), 'utf8').replace(/\n*$/, '\n') : `/* ===== ${d} — 불러올 때(상수·상태·리스너): 계층 파일 밖에 남은 옛 조각을 이름 순(불러오는 순서)으로 이음 ===== */\n`;
    writeFileSync(join(dir, '0-load.js'), prev + keep.map(f => `\n/* ── ${f}에서 ── */\n` + readFileSync(join(dir, f), 'utf8').replace(/\n*$/, '\n')).join(''));
    execFileSync('git', ['add', join(dir, '0-load.js')], { cwd: ROOT }); for (const f of rest) execFileSync('git', ['rm', '-q', '-f', join(dir, f)], { cwd: ROOT }); }
  console.log(`${APPLY ? '' : '(미리 보기) '}남은 조각: 합침 ${merged} · 지움(주석뿐) ${dropped}`); process.exit(0); }
const DISSOLVE = process.argv.includes('--dissolve') ? process.argv[process.argv.indexOf('--dissolve') + 1] : null;
if (DISSOLVE && process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) { const P = await dissolvePlan(ROOT, DISSOLVE);
  for (const [to, names] of P.moves) { console.log(`  → ${to.replace(/^src\/main\//, '')}: ${names.join(', ')}`); if (APPLY) { const args = ['tools/move.mjs', '--to', to, names.join(',')]; if (!existsSync(join(ROOT, to))) args.splice(3, 0, '--head', `${basename(dirname(to))} 화면(${basename(DISSOLVE)}에서 옮김)`); try { console.log('    ' + execFileSync('node', args, { cwd: ROOT, encoding: 'utf8' }).trim().split('\n').pop()); } catch (e) { console.log('    옮기지 못함: ' + String(e.stdout || e.message).trim().split('\n').pop()); } } }
  console.log(`${APPLY ? '' : '(미리 보기) '}${DISSOLVE}: 옮김 ${[...P.moves.values()].flat().length} · 남김 ${P.stay.length}(${P.stay.slice(0, 12).join(', ')}${P.stay.length > 12 ? ' …' : ''})`); process.exit(0); }
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const plan = readPlan(readFileSync(PLAN, 'utf8')), mv = moves(plan), targets = new Set(plan.map(p => p.target));
  mv.forEach(m => console.log(`  ${m.from} → ${m.to}`));
  const before = readdirSync(MAIN).length; console.log(`${APPLY ? '' : '(미리 보기) '}옮김 ${mv.length} · 목표 모듈 ${targets.size} (src/main 항목 ${before} → ${APPLY ? '' : '약 '}${targets.size})`);
  if (APPLY) { for (const m of mv) { const to = join(MAIN, m.to); mkdirSync(dirname(to), { recursive: true }); execFileSync('git', ['mv', join(MAIN, m.from), to], { cwd: ROOT }); }
    for (const d of new Set(mv.map(m => dirname(m.from)).filter(d => d !== '.'))) { try { if (!readdirSync(join(MAIN, d)).length) execFileSync('rmdir', [join(MAIN, d)]); } catch { /* 이미 없음 */ } }
    const refs = staleRefs(mv), n = [...refs.values()].reduce((a, b) => a + b, 0), md = readFileSync(PLAN, 'utf8'), at = new Date().toISOString().slice(0, 10);
    const row = `| R${(md.match(/^\| R\d+ /gm) || []).length + 1} | 1 모으기(${at}) | 옛 src/main 경로를 가리키는 곳 ${n}(파일 ${refs.size}: ${[...refs.keys()].slice(0, 8).join(' · ')}${refs.size > 8 ? ' …' : ''}) · 불러올 때 순서가 바뀌어 생길 수 있는 TDZ·정의 안 된 이름 | 경로: 옛 → 새 경로 바꾸기(이 도구의 옮김 목록) · TDZ·이름: \`node tools/check.mjs\` |`;
    writeFileSync(PLAN, md.replace(/\n*$/, '\n') + row + '\n'); console.log(`이슈 기록: 옛 경로 참조 ${n}곳(파일 ${refs.size}) → docs/restructure.md 4절`); } }
