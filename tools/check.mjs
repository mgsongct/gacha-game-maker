#!/usr/bin/env node
// 자기점검·정적분석: node tools/check.mjs [--json] [--strict] [--out 폴더]
//   tree-sitter로 함수·호출·분기를 그래프로 만들고(콜스택·병목·순환·깊이·복잡도), ast-grep 패턴으로 품질 규칙을 찾고,
//   화면 액션(data-act)·상태(G·P())·저장 표시(mark) 흐름을 맞춰 봐요. 결과: 터미널 요약 + out/report.md · out/flow.mmd · out/report.json
//   --strict: '오류'가 있으면 exit 1 (CI용)
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadUnits } from './lib/source.mjs';
import { buildGraph, unused, unusedVars, cycles, deepest, hubs } from './lib/graph.mjs';
import { actions, mutations, stateFlow, mermaid } from './lib/flow.mjs';
import { parseErrors, dupBodies, repeatedStrings, sgRules, complexFns } from './lib/quality.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = resolve(HERE, '..'), arg = k => process.argv.includes(k), OUT = (() => { const i = process.argv.indexOf('--out'); return i > 0 ? resolve(process.argv[i + 1]) : join(HERE, 'out'); })();
const t0 = Date.now(), units = await loadUnits(ROOT), allText = units.map(u => u.text).join('\n') + readFileSync(join(ROOT, 'src/index.html'), 'utf8');
const { fns, issues, tops } = buildGraph(units), act = actions(units), mu = mutations(units, fns), sf = stateFlow(units, fns), sg = sgRules(units);
const R = { parse: parseErrors(units), issues, unused: unused(fns, allText), unusedVars: unusedVars(tops, fns, allText), cycles: cycles(fns), deep: deepest(fns), hubs: hubs(fns, mu.mut), complex: complexFns(fns), dup: dupBodies(fns), strings: repeatedStrings(units), act, unsaved: mu.unsaved, sf, sg };
const errors = [...R.parse.map(p => ({ kind: '파싱 오류', msg: `${p.loc} ${p.text}` })), ...issues.filter(i => i.sev === 'error'), ...act.missing.map(m => ({ kind: '처리기 없는 액션', msg: `data-act="${m.act}" (${m.at.join(', ')})` }))];
const warns = [...act.multi.map(m => ({ kind: '여러 곳에서 처리하는 액션', msg: `${m.act}: ${m.locs.slice(0, 3).join(', ')}` })), ...R.unsaved.map(x => ({ kind: '저장 표시 없는 상태 변경', msg: `${x.fn.name} (${x.fn.loc}) — ${x.ex.what} 외 ${x.n - 1}곳, 자신·호출자 모두 mark() 없음` })), ...R.dup.map(d => ({ kind: '같은 본문 함수', msg: d.fns.join(' = ') }))];
const pct = (a, b) => b ? Math.round(a / b * 100) : 0, fnsN = [...fns.values()].filter(f => f.top).length;
const md = [`# 자기점검 보고서`, ``, `생성: \`node tools/check.mjs\` · ${new Date().toISOString().slice(0, 16)} · ${((Date.now() - t0) / 1000).toFixed(1)}초`, ``,
  `| 항목 | 값 |`, `|---|---|`, `| 분석 단위 | main(한 스크립트 ${units[0].files.length}파일 ${units[0].text.split('\n').length}줄) + 모듈·부트 ${units.length - 1}개 |`, `| 함수(최상위) | ${fnsN} · 호출 간선 ${[...fns.values()].reduce((a, f) => a + f.calls.size, 0)} |`, `| 오류 | ${errors.length} |`, `| 경고 | ${warns.length} |`,
  `| 화면 액션 | 발신 ${act.emitted} · 처리 ${act.handled} · 처리기 없음 ${act.missing.length} · 발신 없는 처리기 ${act.deadH.length} · 중복 처리 ${act.multi.length} |`, `| 상태 변경 함수 | ${mu.mut.size} (저장 표시 없음 ${R.unsaved.length}) |`, ``,
  `## 오류 (${errors.length})`, ...errors.map(e => `- **${e.kind}** ${e.msg}`), ``, `## 경고 (${warns.length})`, ...warns.slice(0, 80).map(e => `- **${e.kind}** ${e.msg}`), ``,
  `## 병목·경합 후보 (팬인 × 복잡도)`, `| 함수 | 위치 | 부르는 함수 | 호출 수 | 부르는 함수 수(팬아웃) | 복잡도 | 상태 변경 |`, `|---|---|---|---|---|---|---|`, ...R.hubs.map(h => `| ${h.f.name} | ${h.f.loc} | ${h.fanIn} | ${h.sites} | ${h.fanOut} | ${h.f.cc} | ${h.mut ? '예(경합 주의)' : ''} |`), ``,
  `## 꼬인 흐름: 서로 부르는 순환 (${R.cycles.length})`, ...R.cycles.slice(0, 15).map(c => `- ${c.length}개: ${c.slice(0, 8).join(' ↔ ')}${c.length > 8 ? ' …' : ''}`), ``,
  `## 가장 깊은 호출 사슬 (콜스택)`, ...R.deep.map(p => `- 깊이 ${p.length}: ${p.join(' → ')}`), ``,
  `## 복잡한 함수 (분기 ≥40 · 120줄 이상 · 중첩 ≥7) — ${R.complex.length}`, `| 함수 | 위치 | 복잡도 | 줄 | 중첩 |`, `|---|---|---|---|---|`, ...R.complex.slice(0, 30).map(f => `| ${f.name} | ${f.loc} | ${f.cc} | ${f.lines} | ${f.depth} |`), ``,
  `## 데이터 ↔ 화면 흐름`, `- 여러 함수가 쓰는 상태(8곳 이상 — 소유자가 흩어짐): ${R.sf.scattered.slice(0, 15).map(x => `\`${x.key}\`(${x.writers})`).join(', ') || '없음'}`, `- 쓰기만 하고 아무도 안 읽는 키: ${R.sf.writeOnly.slice(0, 25).map(x => `\`${x.key}\``).join(', ') || '없음'}`, `- 화면 함수가 안 읽는 G.meta 키(설정이 화면에 안 보일 수 있음): ${R.sf.noScreen.slice(0, 25).map(x => `\`${x.key}\``).join(', ') || '없음'}`, `- 그래프: [flow.mmd](flow.mmd) (쓰는 함수 → 상태 → 화면 함수)`, ``,
  `## 화면 액션`, `- 발신 없는 처리기(확인 필요 — 동적으로 만들면 정상): ${act.deadH.slice(0, 40).map(x => `\`${x.act}\``).join(', ') || '없음'}`, ``,
  `## 파편화·다중화`, `- 문서 전역 클릭 리스너 ${R.sg.listeners.length}개: ${[...new Set(R.sg.listeners.map(l => l.split(':')[0]))].join(', ')}`, `- 3번 이상 되풀이되는 긴 문자열 ${R.strings.length}개`, ...R.strings.slice(0, 12).map(s => `  - ×${s.n} "${s.text}…" (${s.at.join(', ')})`), `- 빈 catch ${R.sg.emptyCatch.length}개 (오류를 삼킴): ${R.sg.emptyCatch.slice(0, 8).join(', ')}${R.sg.emptyCatch.length > 8 ? ' …' : ''}`, `- esc() 없이 innerHTML에 넣는 이름·글 ${R.sg.rawHTML.length}곳: ${R.sg.rawHTML.slice(0, 8).map(x => `${x.loc} ${x.subs.join(' ')}`).join(', ')}`,
  `- 안 쓰는 함수 ${R.unused.length}개: ${R.unused.slice(0, 40).map(f => `\`${f.name}\``).join(', ')}`, `- 안 쓰는 최상위 변수·상수 ${R.unusedVars.length}개: ${R.unusedVars.slice(0, 40).map(v => `\`${v.name}\` (${v.loc})`).join(', ')}`, ``].join('\n');
mkdirSync(OUT, { recursive: true }); writeFileSync(join(OUT, 'report.md'), md); writeFileSync(join(OUT, 'flow.mmd'), mermaid(R.sf));
const J = { errors, warns, hubs: R.hubs.map(h => ({ name: h.f.name, loc: h.f.loc, fanIn: h.fanIn, cc: h.f.cc, mut: h.mut })), cycles: R.cycles, deep: R.deep, complex: R.complex.map(f => ({ name: f.name, loc: f.loc, cc: f.cc, lines: f.lines, depth: f.depth })), unused: R.unused.map(f => f.name), unusedVars: R.unusedVars, actions: { missing: act.missing, deadHandlers: act.deadH, multi: act.multi }, state: { writeOnly: R.sf.writeOnly.map(x => x.key), scattered: R.sf.scattered.map(x => [x.key, x.writers]) }, strings: R.strings, emptyCatch: R.sg.emptyCatch, rawHTML: R.sg.rawHTML };
writeFileSync(join(OUT, 'report.json'), JSON.stringify(J, null, 1));
if (arg('--json')) console.log(JSON.stringify(J)); else {
  console.log(`자기점검: 함수 ${fnsN} · 오류 ${errors.length} · 경고 ${warns.length} · 병목 후보 ${R.hubs.length} · 순환 ${R.cycles.length} · 복잡 ${R.complex.length} · 안 쓰는 함수 ${R.unused.length} · ${((Date.now() - t0) / 1000).toFixed(1)}초`);
  errors.slice(0, 20).forEach(e => console.log(`  ✗ ${e.kind}: ${e.msg}`)); warns.slice(0, 10).forEach(e => console.log(`  △ ${e.kind}: ${e.msg}`)); console.log(`보고서: ${join(OUT, 'report.md')}`); }
if (arg('--strict') && errors.length) process.exit(1);
