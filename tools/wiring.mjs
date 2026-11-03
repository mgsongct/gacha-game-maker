#!/usr/bin/env node
// 포크 기능 배선 점검: node tools/wiring.mjs [--strict]
//   tree-sitter로 ① 포크 기능의 범위(커밋이 새로 들여온 함수 = 그 커밋 트리 − 부모 트리), 그 함수들이 읽는 데이터 키와 원본에 없던 새 필드,
//   ② 원안의 생성 경계(lib/lifecycle.mjs: 생성 / 실행 중 AI / 사용자)별로 쓰는 키·필드·프롬프트 스키마 키를 뽑고,
//   ③ 생성된 게임(pc/data — PC 서버 data 폴더, 실제 저장 형식)에서 그 키·필드가 실제로 채워졌는지(없음·빔·기본값·값) 맞춰 봐요.
//   결과: tools/out/wiring.md · wiring.json. --strict: P0·P1 판정이 기준선(tools/baseline.json의 wiring)보다 새로 생기면 exit 1 · --update-baseline: 줄었을 때 기준선 낮춤
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadUnits } from './lib/source.mjs';
import { buildGraph } from './lib/graph.mjs';
import { stateFlow } from './lib/flow.mjs';
import { constLiterals, wiringReport } from './lib/wiring.mjs';
import { stageClosures, STAGES } from './lib/lifecycle.mjs';
import { srcAt } from './lib/gitsrc.mjs';
import { listGames, readGame } from './play/lib/data.mjs';
import { PC_DIR } from './play/lib/page.mjs';
import { compare, readBaseline, writeBaseline, diffMd } from './lib/ratchet.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = resolve(HERE, '..'), OUT = join(HERE, 'out'), REG = JSON.parse(readFileSync(join(HERE, 'fork-features.json'), 'utf8'));
const srcAtRef = ref => srcAt(ROOT, OUT, ref);

const units = await loadUnits(ROOT), { fns } = buildGraph(units), sf = stateFlow(units, fns), defaults = constLiterals(units, ['DEFAULT_META', 'DEFAULT_WORLD', 'DEFAULT_PROG']);
const upstream = await srcAtRef(REG.upstreamSrc || REG.upstream), features = [];
for (const f of REG.features) { const added = new Set();
  for (const c of f.commits) { const [now, before] = [await srcAtRef(c), await srcAtRef(c + '^')], b = new Set(before.fns); now.fns.filter(k => !b.has(k)).forEach(k => added.add(k)); }
  features.push({ id: f.id, title: f.title, doc: f.doc, fns: new Set([...added].filter(k => fns.has(k))) }); }
// 생성된 게임: PC 서버 폴더(pc/ — PC서버-시작.bat과 같은 경로)의 data/에 있는 게임(앱 기본 샘플 main 제외)
const games = listGames(PC_DIR).map(x => ({ name: x.title, game: readGame(PC_DIR, x.id).game }));
const W = wiringReport({ fns, sf, features, stages: stageClosures(units, fns), genRoots: STAGES['생성'], defaults, games, upstreamProps: new Set(upstream.props), userKeys: REG.userKeys || {}, defaultOk: REG.defaultOk || {}, runtimeFields: REG.runtimeFields || {} });

const t = (h, rs) => [`| ${h.join(' | ')} |`, `|${h.map(() => '---').join('|')}|`, ...rs.map(r => `| ${r.map(x => String(x ?? '').replace(/\|/g, '/')).join(' | ')} |`)].join('\n');
const P0 = W.features.flatMap(f => f.flags.filter(x => x.sev === 'P0').map(x => ({ ...x, f: f.id }))), P1 = W.features.flatMap(f => f.flags.filter(x => x.sev === 'P1').map(x => ({ ...x, f: f.id })));
const md = [`# 포크 기능 배선 점검 (생성기 ↔ 기능 ↔ 생성물)`, '', `생성: \`node tools/wiring.mjs\` · ${new Date().toISOString().slice(0, 16)} · 단계별 함수(lifecycle) ${Object.entries(W.closure).map(([k, v]) => `${k} ${v}`).join(' · ')} · 프롬프트 스키마 키 ${W.schemaKeys}개 · 생성 게임 ${W.games.join(', ') || '없음'}`, '',
  '판정(원안의 생성 경계 — 생성은 세계관·기본 원칙, 시나리오 등은 실행 중 AI): **P0** 어느 단계도 만들지 않아 기능이 비어 있음 · **P1** 사용자 조작으로만 만들어짐(자동이 기본) / 생성 단계 키인데 생성 게임에 없음 / 공통·샘플 기본값으로만 시작. 실행 중 AI가 만드는 키는 생성 직후 없어도 정상.', '',
  `## 요약 — P0 ${P0.length} · P1 ${P1.length}`, '', t(['등급', '기능', '키', '내용'], [...P0, ...P1].map(x => [x.sev, x.f, x.key, x.msg])), '',
  ...W.features.flatMap(f => [`## ${f.id} — ${f.title}`, '', `- 기능 함수 ${f.fns}개(커밋이 새로 들여온 최상위 함수)`, '', '### 데이터 키(기능이 읽음)', '', f.rows.length ? t(['키', '생성', '실행 중 AI', '사용자', '스키마(world/키)', '샘플 기본값', '기능 지연 기본값', '사용자 설정 키', ...W.games], f.rows.map(r => [r.key, r.gen, r.live, r.userW, r.schema ? '예' : '', r.def ? '예' : '', r.lazy === 'empty' ? '빈 값' : r.lazy ? '예' : '', r.user ? '예' : '', ...r.games])) : '없음', '',
    '### 원본에 없던 새 필드(기능이 읽음) — 생성기 어휘·생성물에 있는 것', '', f.fields.length ? t(['필드', '엔티티', '생성 어휘', '실행 중 AI 어휘', '스키마', ...W.games], f.fields.map(x => [x.field, x.on, x.gen ? '예' : '', x.live ? '예' : '', x.schema ? '예' : '', ...x.games])) : '없음', ''])].join('\n');
mkdirSync(OUT, { recursive: true }); writeFileSync(join(OUT, 'wiring.md'), md); writeFileSync(join(OUT, 'wiring.json'), JSON.stringify(W, (k, v) => v instanceof Set ? [...v] : v, 1));
// 래칫: 판정 목록을 기준선과 비교(새로 생긴 P0·P1이 있으면 --strict 실패)
const WF = [...P0, ...P1].map(x => ({ key: `배선 ${x.sev}|${x.f} ${x.key}`, num: {}, text: `${x.sev} ${x.f} ${x.key}: ${x.msg}` })), WB = readBaseline(ROOT, 'wiring'), WD = WB ? compare(WB, WF) : null, arg = k => process.argv.includes(k);
if (WD) writeFileSync(join(OUT, 'wiring-baseline-diff.md'), '# 배선 점검 기준선 대비\n\n' + diffMd(WD, '배선 판정'));
if (arg('--update-baseline')) { if (WD && WD.added.length && !arg('--force')) { console.log(`기준선을 올리는 갱신은 하지 않아요: 새 판정 ${WD.added.length} — 고치세요(out/wiring-baseline-diff.md)`); process.exit(1); } writeBaseline(ROOT, WF, 'wiring'); console.log(`배선 기준선 갱신: ${WF.length}개`); }
console.log(`배선 점검: 기능 ${W.features.length} · 단계별 함수 ${Object.values(W.closure).join('/')} · 게임 ${W.games.length} · P0 ${P0.length} · P1 ${P1.length}`); P0.slice(0, 30).forEach(x => console.log(`  P0 ${x.f} ${x.key}: ${x.msg}`)); console.log('보고서: ' + join(OUT, 'wiring.md'));
if (WD) { console.log(`기준선 대비: 새로 생김 ${WD.added.length} · 해결 ${WD.fixed.length}`); WD.added.forEach(f => console.log('  + ' + f.text)); } else console.log('배선 기준선 없음: node tools/wiring.mjs --update-baseline');
if (arg('--strict') && WD && WD.added.length && !arg('--update-baseline')) process.exit(1);
