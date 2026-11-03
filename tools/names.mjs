#!/usr/bin/env node
// 이름 규칙 모으기·점검·치환: node tools/names.mjs [--derive] [--apply] [--kind 종류]
//   지역 이름이 무엇에 묶였는지(캐릭터·스테이지·적·세력·DOM 요소·오류 …)를 코드에서 자동으로 알아내 이름 × 종류로 모으고(lib/names.mjs),
//   규칙(tools/naming.json: 종류 → 이름)에 맞지 않고 **다른 종류의 규칙 이름을 쓴 곳(모호한 이름)**을 찾아요.
//   --derive: 지금 코드에서 규칙을 다시 뽑아 naming.json에 씀(없으면 처음 실행 때 자동). 사람이 고친 naming.json은 그대로 씀
//   --apply: 모호한 이름을 규칙 이름으로 바꿈(src/ 전체 — 범위 안에 새 이름이 이미 있거나 바깥 이름을 가리면 건너뜀). 바꾼 뒤 node build/build.mjs와 테스트를 돌리세요
//   --strict: 모호한 이름이 기준선(tools/baseline.json의 names)보다 늘면 exit 1 · --update-baseline
//   결과: tools/out/names.md · names.json
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadUnits } from './lib/source.mjs';
import { bindings, inventory, deriveConvention, violations, renameEdits } from './lib/names.mjs';
import { compare, readBaseline, writeBaseline } from './lib/ratchet.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = resolve(HERE, '..'), OUT = join(HERE, 'out'), CONV = join(HERE, 'naming.json'), arg = k => process.argv.includes(k);
const only = (() => { const i = process.argv.indexOf('--kind'); return i > 0 ? process.argv[i + 1] : ''; })();
async function scan() { const units = await loadUnits(ROOT), B = bindings(units), inv = inventory(B); return { units, B, inv }; }
let { units, B, inv } = await scan();
const NJ = JSON.parse(readFileSync(CONV, 'utf8')), conv = NJ.convention, share = NJ.share || [], proposal = deriveConvention(inv); // 규칙은 naming.json(원칙과 함께 사람이 정함), 자동 제안은 보고서에만


let applied = 0, skipped = [];
if (arg('--apply')) for (let pass = 0; pass < 4; pass++) { // 바꾼 뒤 범위가 달라지므로 다시 읽어 되풀이
  const V = violations(B, conv, share).filter(v => !only || v.kind === only), byFile = new Map(), taken = []; let n = 0;
  for (const v of V) { const r = renameEdits(v); if (!r.ok) { if (pass === 0) skipped.push(`${v.loc} ${v.name}→${v.want}: ${r.why}`); continue; }
    if (r.edits.some(e => taken.some(t => t.u === v.unit && e.start < t.end && t.start < e.end))) continue; // 다른 바꾸기와 겹치면 다음 회차에
    r.edits.forEach(e => taken.push({ u: v.unit, start: v.scope.startIndex, end: v.scope.endIndex }));
    let off = 0; const files = v.unit.files.map(f => { const text = readFileSync(join(ROOT, f.path), 'utf8'), x = { path: f.path, start: off, text }; off += text.length; return x; });
    for (const e of r.edits) { const f = files.findLast(x => x.start <= e.start); if (!byFile.has(f.path)) byFile.set(f.path, []); byFile.get(f.path).push({ a: e.start - f.start, b: e.end - f.start, text: e.text }); } n++; }
  for (const [p, es] of byFile) { let t = readFileSync(join(ROOT, p), 'utf8'); es.sort((x, y) => y.a - x.a).forEach(e => { t = t.slice(0, e.a) + e.text + t.slice(e.b); }); writeFileSync(join(ROOT, p), t); }
  applied += n; if (!n) break; ({ units, B, inv } = await scan()); }

const V = violations(B, conv, share), amb = [...inv.byName].filter(([, m]) => m.size > 1).map(([n, m]) => [n, [...m].sort((a, b) => b[1] - a[1])]).sort((a, b) => b[1].reduce((x, y) => x + y[1], 0) - a[1].reduce((x, y) => x + y[1], 0));
const t = (h, rs) => [`| ${h.join(' | ')} |`, `|${h.map(() => '---').join('|')}|`, ...rs.map(r => `| ${r.map(x => String(x ?? '').replace(/\|/g, '/')).join(' | ')} |`)].join('\n');
const perFile = V.reduce((m, v) => { const f = v.loc.split(':')[0]; m[f] = (m[f] || 0) + 1; return m; }, {});
const md = [`# 이름 규칙 (지역 이름 ↔ 묶인 종류)`, '', `생성: \`node tools/names.mjs\` · ${new Date().toISOString().slice(0, 16)} · 종류를 아는 바인딩 ${B.length}개 · 규칙 \`tools/naming.json\``, '',
  '종류는 코드에서 자동으로 알아냄: 게임 컬렉션 콜백(`G.chars.map(c => …)`)·찾기 함수 결과(`const c = charById(…)`)·DOM 찾기·이벤트 리스너 매개변수·catch 매개변수.', '',
  `## 규칙과 실제 사용 (규칙: naming.json · 자동 제안은 참고)`, '', t(['종류', '규칙 이름', '자동 제안', '바인딩 수', '쓰는 이름(횟수)'], [...inv.byKind].sort((a, b) => [...b[1].values()].reduce((x, y) => x + y, 0) - [...a[1].values()].reduce((x, y) => x + y, 0)).map(([k, m]) => [k, conv[k] || '', proposal[k] || '', [...m.values()].reduce((x, y) => x + y, 0), [...m].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([n, c]) => `${n}(${c})`).join(' ')])), '',
  `## 여러 종류에 쓰이는 이름 (${amb.length})`, '', t(['이름', '종류(횟수)'], amb.slice(0, 40).map(([n, ks]) => [n, ks.map(([k, c]) => `${k}(${c})`).join(' ')])), '',
  `## 모호한 이름 — 규칙 이름이 아니고 다른 종류에도 쓰이는 이름 (${V.length})`, '', t(['파일', '개수'], Object.entries(perFile).sort((a, b) => b[1] - a[1])), '', ...V.slice(0, 200).map(v => `- ${v.loc} \`${v.name}\` = ${v.kind} → \`${v.want}\` (\`${v.name}\`은 ${v.clash}에도 쓰임)`), '',
  arg('--apply') ? `## 바꾸기\n\n- 바꾼 바인딩 ${applied}개 · 건너뜀 ${skipped.length}개\n${skipped.slice(0, 60).map(s => '  - ' + s).join('\n')}\n` : ''].join('\n');
mkdirSync(OUT, { recursive: true }); writeFileSync(join(OUT, 'names.md'), md); writeFileSync(join(OUT, 'names.json'), JSON.stringify({ convention: conv, violations: V.map(v => ({ loc: v.loc, name: v.name, kind: v.kind, want: v.want })), ambiguous: amb }, null, 1));
// 래칫: 모호한 이름 개수(파일·범위별)가 기준선보다 늘면 --strict 실패
const NF = Object.entries(perFile).map(([k, n]) => ({ key: `이름 모호|${k}`, num: { 개수: n }, text: `${k} ${n}개` })), NB = readBaseline(ROOT, 'names'), ND = NB ? compare(NB, NF) : null;
if (arg('--update-baseline')) { if (ND && (ND.added.length || ND.worse.length) && !arg('--force')) { console.log('기준선을 올리는 갱신은 하지 않아요 — 이름을 고치세요'); process.exit(1); } writeBaseline(ROOT, NF, 'names'); }
console.log(`이름 규칙: 바인딩 ${B.length} · 여러 종류에 쓰이는 이름 ${amb.length} · 모호한 이름 ${V.length}${arg('--apply') ? ` · 바꿈 ${applied} · 건너뜀 ${skipped.length}` : ''}`); console.log('보고서: ' + join(OUT, 'names.md'));
if (ND) { console.log(`기준선 대비: 새로 생김 ${ND.added.length} · 나빠짐 ${ND.worse.length} · 해결 ${ND.fixed.length} · 좋아짐 ${ND.better.length}`); [...ND.added, ...ND.worse].forEach(f => console.log('  + ' + f.text)); }
if (arg('--strict') && ND && (ND.added.length || ND.worse.length) && !arg('--update-baseline')) process.exit(1);
