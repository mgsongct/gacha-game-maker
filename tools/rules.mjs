// 규칙 전수검사: node tools/rules.mjs [--strict] [--update-baseline] [--rebase <커밋>] → tools/out/rules.md · rules.json
//   규칙표(lib/rules.mjs — 원칙 · 판정 · 고치는 법 · 막는 정도)를 SPA에 들어가는 코드 전체(src/main · src/modules · src/boot)에 한 번에 돌림.
//   하나씩 고치지 않고 규칙 단위로 — 규칙마다 고치는 법 하나를 그 규칙의 모든 건에.
//   --strict: 「오류」 규칙에 건이 있거나, 「래칫」 규칙(파일별 건수 — tools/baseline.json의 rules)이 기준선보다 새로 생기거나 늘면 exit 1(CI)
//   --update-baseline: 줄었을 때만 기준선 낮춤 · --rebase <커밋>: 판정이 바뀌었을 때 그 커밋 코드를 지금 규칙으로 재서 기준선으로(지금 코드로 올리지 않음)
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { analyze } from './lib/analyze.mjs';
import { stateFlow } from './lib/flow.mjs';
import { buildMap } from './lib/map.mjs';
import { runRules, LAYER_DEF, L2_CAUSES } from './lib/rules.mjs';
import { compare, readBaseline, writeBaseline } from './lib/ratchet.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..'), OUT = join(ROOT, 'tools/out'), argv = process.argv.slice(2), arg = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; }, t0 = Date.now();
async function inspect(dir) { const A = await analyze(dir), html = existsSync(join(dir, 'www/index.html')) ? readFileSync(join(dir, 'www/index.html'), 'utf8') : ''; return runRules({ A, M: buildMap(A.units, A.fns, stateFlow(A.units, A.fns), html) }); }
// 래칫 항목: 「래칫」 규칙의 파일별 건수(파일은 위치일 뿐 — 옮겨도 합계가 그대로면 옮김, lib/ratchet.mjs)
const findings = RS => RS.filter(r => r.block.startsWith('래칫')).flatMap(r => { const by = new Map(); r.items.forEach(x => { const f = String(x.at).replace(/:\d+$/, ''); by.set(f, (by.get(f) || 0) + 1); }); return [...by].map(([f, n]) => ({ key: `규칙 ${r.id}|${f}`, num: { 건: n }, text: `${r.id} ${r.name} ${f.replace(/^src\//, '')} ${n}` })); });
const RS = await inspect(ROOT), esc = x => String(x ?? '').replace(/\|/g, '/');
const md = [`# 규칙 전수검사`, '', `생성: \`node tools/rules.mjs\` · ${new Date().toISOString().slice(0, 16)} · ${((Date.now() - t0) / 1000).toFixed(1)}초 · 대상: SPA에 들어가는 코드 전체(src/main · src/modules · src/boot)`, '',
  '원칙은 CLAUDE.md §0-2(개발자 역할)·§0-1(구조 원칙). 규칙표는 `tools/lib/rules.mjs` 한곳 — 규칙마다 판정·고치는 법 하나·막는 정도. 하나씩 고치지 않고 규칙 단위로 처리', '',
  '계층 정의(LAYER_DEF — 모든 계층 규칙이 이 정의 하나로 판정, lib/arch.mjs):', '', `- 효과: ${LAYER_DEF.effects}`, `- 계층: ${LAYER_DEF.layer}`, `- 바꾸는 함수: ${LAYER_DEF.changes}`, `- 방향: ${LAYER_DEF.direction}`, '',
  '| 규칙 | 무리 | 이름 | 건(main · modules · boot) | 막는 정도 | 고치는 법 |', '|---|---|---|---|---|---|',
  ...RS.map(r => `| ${r.id} | ${r.group} | ${r.name} | **${r.n}** (${r.by.main} · ${r.by.modules} · ${r.by.boot}) | ${r.block} | ${esc(r.fix)} |`), ''];
for (const r of RS) { md.push(`## ${r.id} ${r.name} — ${r.n}건`, '', `- 원칙: ${r.why}`, `- 판정: ${r.judge}`, `- 고치는 법: ${r.fix}`, `- 막는 정도: ${r.block}`, '');
  if (r.items.some(x => x.cause)) { md.push('| 원인 | 건 | 판정 | 고치는 법 | 끝 함수(건) |', '|---|---|---|---|---|'); for (const [k, d] of Object.entries(L2_CAUSES)) { const xs = r.items.filter(x => x.cause === k), g = new Map(); xs.forEach(x => g.set(x.end, (g.get(x.end) || 0) + 1));
    md.push(`| ${k} | **${xs.length}** | ${esc(d.judge)} | ${esc(d.fix)} | ${[...g].sort((a, b) => b[1] - a[1]).map(([e, n]) => `${e} ${n}`).join(' · ')} |`); } md.push(''); }
  if (r.items.length) md.push(`| 자리 | 건 |${r.items.some(x => x.cause) ? ' 원인 |' : ''} 단위 |`, `|---|---|${r.items.some(x => x.cause) ? '---|' : ''}---|`, ...r.items.map(x => `| ${esc(String(x.at).replace(/^src\//, ''))} | ${esc(x.what)} |${x.cause ? ` ${x.cause} |` : ''} ${x.scope} |`), ''); }
mkdirSync(OUT, { recursive: true }); writeFileSync(join(OUT, 'rules.md'), md.join('\n')); writeFileSync(join(OUT, 'rules.json'), JSON.stringify(RS.map(r => ({ id: r.id, name: r.name, n: r.n, by: r.by, block: r.block, items: r.items })), null, 1));
console.log(`규칙 전수검사: ${RS.map(r => `${r.id} ${r.name} ${r.n}`).join(' · ')} → tools/out/rules.md`);
const F = findings(RS);
if (arg('--rebase')) { const sha = execSync(`git rev-parse --verify ${JSON.stringify(arg('--rebase') + '^{commit}')}`, { cwd: ROOT, encoding: 'utf8' }).trim(), dir = join(ROOT, 'tools/out/ref-tree', sha);
  if (!existsSync(join(dir, 'src'))) { mkdirSync(dir, { recursive: true }); execSync(`git archive ${sha} src www/index.html | tar -x -C ${JSON.stringify(dir)}`, { cwd: ROOT }); }
  const F0 = findings(await inspect(dir)), D = compare(F0, F); writeBaseline(ROOT, F0, 'rules');
  console.log(`규칙 기준선을 ${sha.slice(0, 7)}의 코드(지금 규칙으로 잼)로: ${F0.length}개 · 지금 코드는 그 대비 새로 생김 ${D.added.length} · 나빠짐 ${D.worse.length} · 해결 ${D.fixed.length} · 좋아짐 ${D.better.length} · 옮김 ${(D.moved || []).length}`); [...D.added, ...D.worse].forEach(f => console.log('  + ' + f.text)); }
else if (argv.includes('--strict') || argv.includes('--update-baseline')) { const B = readBaseline(ROOT, 'rules'), D = B ? compare(B, F) : null, errs = RS.filter(r => r.block.startsWith('오류') && r.n);
  if (argv.includes('--update-baseline')) { if (D && (D.added.length || D.worse.length)) { console.log('기준선을 올리는 갱신은 하지 않아요 — 코드를 고치세요(판정이 바뀌었으면 --rebase <직전 커밋>)'); process.exit(1); } writeBaseline(ROOT, F, 'rules'); console.log(`규칙 기준선: ${F.length}개`); }
  else { if (D) { console.log(`래칫 규칙 기준선 대비: 새로 생김 ${D.added.length} · 나빠짐 ${D.worse.length} · 해결 ${D.fixed.length} · 좋아짐 ${D.better.length} · 옮김 ${(D.moved || []).length}`); [...D.added, ...D.worse].forEach(f => console.log('  + ' + f.text)); } else console.log('규칙 기준선 없음 — node tools/rules.mjs --rebase <커밋>');
    if (errs.length) console.log('오류 규칙: ' + errs.map(r => `${r.id} ${r.n}`).join(', ')); if (errs.length || !D || D.added.length || D.worse.length) process.exit(1); } }
