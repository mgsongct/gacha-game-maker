#!/usr/bin/env node
// 포크 기능 배선 점검: node tools/wiring.mjs [--strict]
//   tree-sitter로 ① 포크 기능의 범위(커밋이 새로 들여온 함수 = 그 커밋 트리 − 부모 트리), 그 함수들이 읽는 데이터 키와 원본에 없던 새 필드,
//   ② 생성기(tools/fork-features.json의 generators에서 부르는 함수들)가 쓰는 키·필드·프롬프트 스키마 키를 뽑고,
//   ③ 생성된 게임(tools/play/games/*/game.json)에서 그 키·필드가 실제로 채워졌는지(없음·빔·기본값·값) 맞춰 봐요.
//   결과: tools/out/wiring.md · wiring.json. --strict: P0·P1 판정이 기준선(tools/baseline.json의 wiring)보다 새로 생기면 exit 1 · --update-baseline: 줄었을 때 기준선 낮춤
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadUnits } from './lib/source.mjs';
import { buildGraph } from './lib/graph.mjs';
import { stateFlow } from './lib/flow.mjs';
import { constLiterals, allProps, wiringReport } from './lib/wiring.mjs';
import { compare, readBaseline, writeBaseline, diffMd } from './lib/ratchet.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = resolve(HERE, '..'), OUT = join(HERE, 'out'), REG = JSON.parse(readFileSync(join(HERE, 'fork-features.json'), 'utf8'));
const git = cmd => execSync(`git ${cmd}`, { cwd: ROOT, encoding: 'utf8' }).trim();
// git 기준의 src/만 풀어 두고(캐시) 최상위 함수 키·프로퍼티 이름을 뽑음
async function srcAt(ref) { const sha = git(`rev-parse --verify ${JSON.stringify(ref + '^{commit}')}`), dir = join(OUT, 'ref-src', sha), cache = join(dir, 'names.json');
  if (existsSync(cache)) return { sha, ...JSON.parse(readFileSync(cache, 'utf8')) };
  mkdirSync(dir, { recursive: true }); execSync(`git archive ${sha} src | tar -x -C ${JSON.stringify(dir)}`, { cwd: ROOT });
  const units = await loadUnits(dir), { fns } = buildGraph(units), r = { fns: [...fns.values()].filter(f => f.top).map(f => f.key), props: [...allProps(units)] };
  writeFileSync(cache, JSON.stringify(r)); return { sha, ...r }; }

const units = await loadUnits(ROOT), { fns } = buildGraph(units), sf = stateFlow(units, fns), defaults = constLiterals(units, ['DEFAULT_META', 'DEFAULT_WORLD', 'DEFAULT_PROG']);
const upstream = await srcAt(REG.upstreamSrc || REG.upstream), features = [];
for (const f of REG.features) { const added = new Set();
  for (const c of f.commits) { const [now, before] = [await srcAt(c), await srcAt(c + '^')], b = new Set(before.fns); now.fns.filter(k => !b.has(k)).forEach(k => added.add(k)); }
  features.push({ id: f.id, title: f.title, doc: f.doc, fns: new Set([...added].filter(k => fns.has(k))) }); }
// 생성 게임: 커밋된 결과(game.json)와, 지금 코드로 같은 응답을 다시 생성한 결과(regress/game.json — tools/play/regress.mjs)
const GD = join(HERE, 'play/games'), games = (existsSync(GD) ? readdirSync(GD) : []).flatMap(d => [['game.json', d], ['regress/game.json', d + '(재생)']].filter(([f]) => existsSync(join(GD, d, f))).map(([f, name]) => ({ name, game: JSON.parse(readFileSync(join(GD, d, f), 'utf8')) })));
const W = wiringReport({ fns, sf, features, roots: REG.generators, defaults, games, upstreamProps: new Set(upstream.props), userKeys: REG.userKeys || {}, defaultOk: REG.defaultOk || {}, runtimeFields: REG.runtimeFields || {} });

const t = (h, rs) => [`| ${h.join(' | ')} |`, `|${h.map(() => '---').join('|')}|`, ...rs.map(r => `| ${r.map(x => String(x ?? '').replace(/\|/g, '/')).join(' | ')} |`)].join('\n');
const P0 = W.features.flatMap(f => f.flags.filter(x => x.sev === 'P0').map(x => ({ ...x, f: f.id }))), P1 = W.features.flatMap(f => f.flags.filter(x => x.sev === 'P1').map(x => ({ ...x, f: f.id })));
const md = [`# 포크 기능 배선 점검 (생성기 ↔ 기능 ↔ 생성물)`, '', `생성: \`node tools/wiring.mjs\` · ${new Date().toISOString().slice(0, 16)} · 생성 루트 ${W.roots.join('·')} → 부르는 함수 ${W.closure}개 · 프롬프트 스키마 키 ${W.schemaKeys}개 · 생성 게임 ${W.games.join(', ') || '없음'}`, '',
  '판정: **P0** 생성기가 만들지 않고 생성 게임에도 없음(기능이 빈 상태·샘플 기본값으로 시작) · **P1** 생성 게임이 기본값 그대로이거나, 생성기가 만드는 키인데 생성물에 없음.', '',
  `## 요약 — P0 ${P0.length} · P1 ${P1.length}`, '', t(['등급', '기능', '키', '내용'], [...P0, ...P1].map(x => [x.sev, x.f, x.key, x.msg])), '',
  ...W.features.flatMap(f => [`## ${f.id} — ${f.title}`, '', `- 기능 함수 ${f.fns}개(커밋이 새로 들여온 최상위 함수)`, '', '### 데이터 키(기능이 읽음)', '', f.rows.length ? t(['키', '생성기가 씀', '스키마(world/키)', '샘플 기본값', '기능 지연 기본값', '사용자 설정', ...W.games], f.rows.map(r => [r.key, r.gen, r.schema ? '예' : '', r.def ? '예' : '', r.lazy === 'empty' ? '빈 값' : r.lazy ? '예' : '', r.user ? '예' : '', ...r.games])) : '없음', '',
    '### 원본에 없던 새 필드(기능이 읽음) — 생성기 어휘·생성물에 있는 것', '', f.fields.length ? t(['필드', '엔티티', '생성기 어휘', '스키마', ...W.games], f.fields.map(x => [x.field, x.on, x.gen ? '예' : '', x.schema ? '예' : '', ...x.games])) : '없음', ''])].join('\n');
mkdirSync(OUT, { recursive: true }); writeFileSync(join(OUT, 'wiring.md'), md); writeFileSync(join(OUT, 'wiring.json'), JSON.stringify(W, (k, v) => v instanceof Set ? [...v] : v, 1));
// 래칫: 판정 목록을 기준선과 비교(새로 생긴 P0·P1이 있으면 --strict 실패)
const WF = [...P0, ...P1].map(x => ({ key: `배선 ${x.sev}|${x.f} ${x.key}`, num: {}, text: `${x.sev} ${x.f} ${x.key}: ${x.msg}` })), WB = readBaseline(ROOT, 'wiring'), WD = WB ? compare(WB, WF) : null, arg = k => process.argv.includes(k);
if (WD) writeFileSync(join(OUT, 'wiring-baseline-diff.md'), '# 배선 점검 기준선 대비\n\n' + diffMd(WD, '배선 판정'));
if (arg('--update-baseline')) { if (WD && WD.added.length && !arg('--force')) { console.log(`기준선을 올리는 갱신은 하지 않아요: 새 판정 ${WD.added.length} — 고치세요(out/wiring-baseline-diff.md)`); process.exit(1); } writeBaseline(ROOT, WF, 'wiring'); console.log(`배선 기준선 갱신: ${WF.length}개`); }
console.log(`배선 점검: 기능 ${W.features.length} · 생성기 함수 ${W.closure} · 게임 ${W.games.length} · P0 ${P0.length} · P1 ${P1.length}`); P0.slice(0, 30).forEach(x => console.log(`  P0 ${x.f} ${x.key}: ${x.msg}`)); console.log('보고서: ' + join(OUT, 'wiring.md'));
if (WD) { console.log(`기준선 대비: 새로 생김 ${WD.added.length} · 해결 ${WD.fixed.length}`); WD.added.forEach(f => console.log('  + ' + f.text)); } else console.log('배선 기준선 없음: node tools/wiring.mjs --update-baseline');
if (arg('--strict') && WD && WD.added.length && !arg('--update-baseline')) process.exit(1);
