// 규칙 전수검사: node tools/rules.mjs [--strict] [--update-baseline] [--rebase <커밋>] → tools/out/rules.md · rules.json
//   규칙표(lib/rules.mjs — 원칙 · 판정 · 고치는 법 · 막는 정도)를 SPA에 들어가는 코드 전체(src/main · src/modules · src/boot)에 한 번에 돌림.
//   하나씩 고치지 않고 규칙 단위로 — 규칙마다 고치는 법 하나를 그 규칙의 모든 건에.
//   --strict: 「오류」 규칙에 건이 있거나, 「래칫」 규칙(파일별 건수 — tools/baseline.json의 rules)이 기준선보다 새로 생기거나 늘면 exit 1(CI)
//   --update-baseline: 줄었을 때만 기준선 낮춤 · --rebase <커밋>: 판정이 바뀌었을 때 그 커밋 코드를 지금 규칙으로 재서 기준선으로(지금 코드로 올리지 않음)
import { writeFileSync, mkdirSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { analyze } from './lib/analyze.mjs';
import { stateFlow } from './lib/flow.mjs';
import { buildMap } from './lib/map.mjs';
import { runRules, LAYER_DEF, L2_CAUSES, judgeModules, JUDGE_DEF } from './lib/rules.mjs';
import { compare, readBaseline, writeBaseline } from './lib/ratchet.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..'), OUT = join(ROOT, 'tools/out'), argv = process.argv.slice(2), arg = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; }, t0 = Date.now();
let JM = null; // 모듈 판정(지금 코드만)
/* 페이지를 모는 시험 도구(규칙 A1 — 다리 이름 덮어쓰기): build/test.mjs · tools/play의 .mjs */
function drivers(dir) { const out = [], add = f => { if (existsSync(join(dir, f))) out.push({ path: f, text: readFileSync(join(dir, f), 'utf8') }); }; add('build/test.mjs');
  const walkD = d => { if (!existsSync(join(dir, d))) return; for (const e of readdirSync(join(dir, d), { withFileTypes: true })) { if (e.isDirectory() && !/^(node_modules|games|reports|fixtures)$/.test(e.name)) walkD(`${d}/${e.name}`); else if (e.name.endsWith('.mjs')) add(`${d}/${e.name}`); } }; walkD('tools/play'); return out; }
async function inspect(dir, judge = false) { const A = await analyze(dir), html = existsSync(join(dir, 'www/index.html')) ? readFileSync(join(dir, 'www/index.html'), 'utf8') : '', M = buildMap(A.units, A.fns, stateFlow(A.units, A.fns), html), RS = runRules({ A, M, html: existsSync(join(dir, 'src/index.html')) ? readFileSync(join(dir, 'src/index.html'), 'utf8') : '', drivers: drivers(dir) });
  if (judge) { const covF = join(OUT, 'coverage.json'), L = { fns: A.fns, R: A.R, M }; JM = judgeModules(L, RS, { units: A.units, html: readFileSync(join(dir, 'src/index.html'), 'utf8'), cov: existsSync(covF) ? JSON.parse(readFileSync(covF, 'utf8')) : null }); } return RS; }
// 래칫 항목: 「래칫」 규칙의 파일별 건수(파일은 위치일 뿐 — 옮겨도 합계가 그대로면 옮김, lib/ratchet.mjs)
const findings = RS => RS.filter(r => r.block.startsWith('래칫')).flatMap(r => { const by = new Map(); r.items.forEach(x => { const f = String(x.at).replace(/:\d+$/, ''); by.set(f, (by.get(f) || 0) + 1); }); return [...by].map(([f, n]) => ({ key: `규칙 ${r.id}|${f}`, num: { 건: n }, text: `${r.id} ${r.name} ${f.replace(/^src\//, '')} ${n}` })); });
const RS = await inspect(ROOT, true), esc = x => String(x ?? '').replace(/\|/g, '/');
/* 건의 갈래(kind — 예: C1의 역할 무리, A1의 코드·글 속)별 수: 화면 요약·보고서에 */
const kinds = r => { const g = new Map(); r.items.forEach(x => { if (x.kind) g.set(x.kind, (g.get(x.kind) || 0) + 1); }); return [...g].sort((a, b) => b[1] - a[1]); };
const md = [`# 규칙 전수검사`, '', `생성: \`node tools/rules.mjs\` · ${new Date().toISOString().slice(0, 16)} · ${((Date.now() - t0) / 1000).toFixed(1)}초 · 대상: SPA에 들어가는 코드 전체(src/main · src/modules · src/boot)`, '',
  '원칙은 CLAUDE.md §0-2(개발자 역할)·§0-1(구조 원칙). 규칙표는 `tools/lib/rules.mjs` 한곳 — 규칙마다 판정·고치는 법 하나·막는 정도. 하나씩 고치지 않고 규칙 단위로 처리', '',
  '계층 정의(LAYER_DEF — 모든 계층 규칙이 이 정의 하나로 판정, lib/arch.mjs):', '', `- 효과: ${LAYER_DEF.effects}`, `- 계층: ${LAYER_DEF.layer}`, `- 바꾸는 함수: ${LAYER_DEF.changes}`, `- 방향: ${LAYER_DEF.direction}`, '',
  '| 규칙 | 무리 | 이름 | 건(main · modules · boot) | 막는 정도 | 고치는 법 |', '|---|---|---|---|---|---|',
  ...RS.map(r => `| ${r.id} | ${r.group} | ${r.name} | **${r.n}** (${r.by.main} · ${r.by.modules} · ${r.by.boot}) | ${r.block} | ${esc(r.fix)} |`), ''];
for (const r of RS) { md.push(`## ${r.id} ${r.name} — ${r.n}건`, '', `- 원칙: ${r.why}`, `- 판정: ${r.judge}`, `- 고치는 법: ${r.fix}`, `- 막는 정도: ${r.block}`, '');
  if (r.items.some(x => x.cause)) { md.push('| 원인 | 건 | 판정 | 고치는 법 | 끝 함수(건) |', '|---|---|---|---|---|'); for (const [k, d] of Object.entries(L2_CAUSES)) { const xs = r.items.filter(x => x.cause === k), g = new Map(); xs.forEach(x => g.set(x.end, (g.get(x.end) || 0) + 1));
    md.push(`| ${k} | **${xs.length}** | ${esc(d.judge)} | ${esc(d.fix)} | ${[...g].sort((a, b) => b[1] - a[1]).map(([e, n]) => `${e} ${n}`).join(' · ')} |`); } md.push(''); }
  if (r.items.some(x => x.kind)) md.push('| 갈래 | 건 |', '|---|---|', ...kinds(r).map(([k, n]) => `| ${esc(k)} | **${n}** |`), '');
  if (r.items.length) md.push(`| 자리 | 건 |${r.items.some(x => x.cause) ? ' 원인 |' : ''} 단위 |`, `|---|---|${r.items.some(x => x.cause) ? '---|' : ''}---|`, ...r.items.map(x => `| ${esc(String(x.at).replace(/^src\//, ''))} | ${esc(x.what)} |${x.cause ? ` ${x.cause} |` : ''} ${x.scope} |`), ''); }
{ const cnt = v => JM.filter(x => x.verdict === v).length, short = m => String(m).replace(/^src\/(main|modules)\//, '');
  md.push('## 모듈 판정 — SOLID/DRY/KISS/YAGNI', '', '사용자 지시: 「SOLID/DRY/KISS/YAGNI로 재면서 위반하는것들을 쳐 내서」「지금 있다고 그냥 유지하는게 아니라. 대다수는 폐기/통합/재구축으로 쳐내야」', '', ...Object.values(JUDGE_DEF).map(x => `- ${x}`), '',
    `모듈 ${JM.length} — 폐기 ${cnt('폐기')} · 통합 ${cnt('통합')} · 해체 ${cnt('해체')} · 재구축 ${cnt('재구축')} · 유지 ${cnt('유지')}${JM.some(x => x.notRan != null) ? '' : ' (실행 기록 없음 — GGM_COVERAGE=1 node build/test.mjs)'}`, '',
    '| 모듈 | 함수 | 판정 | 대상 | S | O | D | DRY | KISS | YAGNI(닿지 않음) | 시험에서 실행 안 됨 | 연관 맵 판정 |', '|---|---|---|---|---|---|---|---|---|---|---|---|',
    ...JM.map(x => `| ${short(x.mod)} | ${x.n} | **${x.verdict}** | ${x.to.map(short).join(', ')} | ${x.S} | ${x.O} | ${x.D} | ${x.DRY} | ${x.KISS} | ${x.YAGNI}${x.dead.length ? ` (${esc(x.dead.slice(0, 4).join('·'))}${x.dead.length > 4 ? '…' : ''})` : ''} | ${x.notRan ?? '—'} | ${x.kind || '—'} |`), ''); }
mkdirSync(OUT, { recursive: true }); writeFileSync(join(OUT, 'rules.md'), md.join('\n')); writeFileSync(join(OUT, 'rules.json'), JSON.stringify(RS.map(r => ({ id: r.id, name: r.name, n: r.n, by: r.by, block: r.block, items: r.items })), null, 1));
console.log(`규칙 전수검사: ${RS.map(r => `${r.id} ${r.name} ${r.n}${kinds(r).length ? `(${kinds(r).map(([k, n]) => `${k} ${n}`).join(' · ')})` : ''}`).join(' · ')} → tools/out/rules.md`);
console.log(`모듈 판정(SOLID/DRY/KISS/YAGNI): ${['폐기', '통합', '해체', '재구축', '유지'].map(v => `${v} ${JM.filter(x => x.verdict === v).length}`).join(' · ')} / ${JM.length} → tools/out/rules.md 끝 절`);
writeFileSync(join(OUT, 'judge.json'), JSON.stringify({ def: JUDGE_DEF, modules: JM }, null, 1));
const F = findings(RS);
if (arg('--rebase')) { const sha = execSync(`git rev-parse --verify ${JSON.stringify(arg('--rebase') + '^{commit}')}`, { cwd: ROOT, encoding: 'utf8' }).trim(), dir = join(ROOT, 'tools/out/ref-tree', sha);
  if (!existsSync(join(dir, 'tools/play'))) { mkdirSync(dir, { recursive: true }); execSync(`git archive ${sha} src www/index.html build/test.mjs tools/play | tar -x -C ${JSON.stringify(dir)}`, { cwd: ROOT }); /* 시험 도구도(규칙 A1 — 페이지 안 코드) */ }
  const F0 = findings(await inspect(dir)), D = compare(F0, F); writeBaseline(ROOT, F0, 'rules');
  console.log(`규칙 기준선을 ${sha.slice(0, 7)}의 코드(지금 규칙으로 잼)로: ${F0.length}개 · 지금 코드는 그 대비 새로 생김 ${D.added.length} · 나빠짐 ${D.worse.length} · 해결 ${D.fixed.length} · 좋아짐 ${D.better.length} · 옮김 ${(D.moved || []).length}`); [...D.added, ...D.worse].forEach(f => console.log('  + ' + f.text)); }
else if (argv.includes('--strict') || argv.includes('--update-baseline')) { const B = readBaseline(ROOT, 'rules'), D = B ? compare(B, F) : null, errs = RS.filter(r => r.block.startsWith('오류') && r.n);
  if (argv.includes('--update-baseline')) { if (D && (D.added.length || D.worse.length)) { console.log('기준선을 올리는 갱신은 하지 않아요 — 코드를 고치세요(판정이 바뀌었으면 --rebase <직전 커밋>)'); process.exit(1); } writeBaseline(ROOT, F, 'rules'); console.log(`규칙 기준선: ${F.length}개`); }
  else { if (D) { console.log(`래칫 규칙 기준선 대비: 새로 생김 ${D.added.length} · 나빠짐 ${D.worse.length} · 해결 ${D.fixed.length} · 좋아짐 ${D.better.length} · 옮김 ${(D.moved || []).length}`); [...D.added, ...D.worse].forEach(f => console.log('  + ' + f.text)); } else console.log('규칙 기준선 없음 — node tools/rules.mjs --rebase <커밋>');
    if (errs.length) console.log('오류 규칙: ' + errs.map(r => `${r.id} ${r.n}`).join(', ')); if (errs.length || !D || D.added.length || D.worse.length) process.exit(1); } }
