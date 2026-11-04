#!/usr/bin/env node
// 자기점검·정적분석: node tools/check.mjs [--json] [--strict] [--out 폴더] [--diff <git 기준>] [--update-baseline] [--rebase <git 기준>]
//   tree-sitter로 함수·호출·분기를 그래프로 만들고(콜스택·병목·순환·깊이·복잡도), ast-grep 패턴으로 품질 규칙을 찾고,
//   화면 액션(data-act)·상태(G·P())·저장 표시(mark) 흐름을 맞춰 봐요. DOM id 참조·HTML 주입·저장 키·리스너 누수, CSS(src/style)와
//   부속 파일(서비스 워커·중계 서버·빌드·도구·PC 서버 파이썬)도 봐요. 결과: 터미널 요약 + out/report.md · out/flow.mmd · out/report.json
//   --strict: '오류'가 있거나 기준선(tools/baseline.json)보다 새로 생기거나 나빠진 항목이 있으면 exit 1 (CI용)
//   --diff <기준>: 그 git 커밋의 트리에 같은 분석을 돌려 이번 변경으로 새로 생김·나빠짐·해결을 보여 줌(out/diff.md)
//   --update-baseline: 지금 결과로 기준선을 다시 씀(줄었을 때만 — 늘었으면 코드를 고침)
//   --rebase <기준>: 분석 도구가 바뀌었을 때 바뀐 도구로 그 커밋 트리를 재서 기준선으로(지금 코드로 올리지 않음) — 그 대비 새로 생김·나빠짐이 있으면 실패
import { promptSites } from './lib/prompts.mjs';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cycleGuard } from './lib/graph.mjs';
import { mermaid } from './lib/flow.mjs';
import { analyze } from './lib/analyze.mjs';
import { findings, compare, readBaseline, writeBaseline, refTree, diffMd, BASELINE } from './lib/ratchet.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = resolve(HERE, '..'), arg = k => process.argv.includes(k), OUT = (() => { const i = process.argv.indexOf('--out'); return i > 0 ? resolve(process.argv[i + 1]) : join(HERE, 'out'); })();
const t0 = Date.now(), { units, fns, act, mu, R, errors, warns, J, fnsN } = await analyze(ROOT);
const md = [`# 자기점검 보고서`, ``, `생성: \`node tools/check.mjs\` · ${new Date().toISOString().slice(0, 16)} · ${((Date.now() - t0) / 1000).toFixed(1)}초`, ``,
  `| 항목 | 값 |`, `|---|---|`, `| 분석 단위 | main(한 스크립트 ${units[0].files.length}파일 ${units[0].text.split('\n').length}줄) + 모듈·부트 ${units.length - 1}개 + CSS ${R.css.files}개 + 부속 파일 ${R.side.files}개(파이썬 ${R.side.python === 'skip' ? '건너뜀' : R.side.python}) |`, `| 함수(최상위) | ${fnsN} · 호출 간선 ${[...fns.values()].reduce((a, f) => a + f.calls.size, 0)} |`, `| 오류 | ${errors.length} |`, `| 경고 | ${warns.length} |`,
  `| 화면 액션 | 분배 표 ${act.registry} · 발신 ${act.emitted} · 처리 ${act.handled} · 처리기 없음 ${act.missing.length} · 발신 없는 처리기 ${act.deadH.length} · 중복 처리 ${act.multi.length} |`, `| 상태 변경 함수 | ${mu.mut.size} (저장 표시 없음 ${R.unsaved.length}) |`, `| DOM id | 만드는 id ${R.dom.defs} · 찾는 id ${R.dom.refs} · 없는 id ${R.dom.missing.length} |`, `| HTML 주입 | esc() 없는 글 ${R.inj.out.length}${R.inj.taint.length ? ` (HTML 안전하지 않은 함수: ${R.inj.taint.join('·')})` : ''} |`, `| CSS | 클래스 ${R.css.classes} · 오류 ${R.css.errors.length} · 안 쓰는 클래스 ${R.css.dead.length} |`, ``,
  `## 오류 (${errors.length})`, ...errors.map(e => `- **${e.kind}** ${e.msg}`), ``, `## 경고 (${warns.length})`, ...warns.slice(0, 80).map(e => `- **${e.kind}** ${e.msg}`), ``,
  `## 병목·경합 후보 (팬인 × 복잡도)`, `| 함수 | 위치 | 부르는 함수 | 호출 수 | 부르는 함수 수(팬아웃) | 복잡도 | 상태 변경 |`, `|---|---|---|---|---|---|---|`, ...R.hubs.map(h => `| ${h.f.name} | ${h.f.loc} | ${h.fanIn} | ${h.sites} | ${h.fanOut} | ${h.f.cc} | ${h.mut ? '예(경합 주의)' : ''} |`), ``,
  `## 꼬인 흐름: 동기 호출로 서로 부르는 순환 (${R.cycles.length}) — 멈춤 조건(깊이 제한 등)이 있는지 확인`, ...R.cycles.slice(0, 15).map(c => { const gd = cycleGuard(fns, c); return `- ${c.length}개: ${c.slice(0, 8).map(k => k.replace(/^module:modules\//, '')).join(' ↔ ')}${c.length > 8 ? ' …' : ''} — ${gd ? '멈춤 조건 있음(' + gd + ')' : '**멈춤 조건을 찾지 못함 — 확인**'}`; }), `- 비동기(타이머·이벤트)를 거치는 순환 ${R.acycles.length}개: ${R.acycles.slice(0, 5).map(c => c.slice(0, 6).join('→')).join(' / ') || '없음'}`, ``,
  `## 가장 깊은 호출 사슬 (콜스택)`, ...R.deep.map(p => `- 깊이 ${p.length}: ${p.join(' → ')}`), ``,
  `## 복잡한 함수 (분기 ≥40 · 120줄 이상 · 중첩 ≥7) — ${R.complex.length}`, `| 함수 | 위치 | 복잡도 | 줄 | 중첩 |`, `|---|---|---|---|---|`, ...R.complex.slice(0, 30).map(f => `| ${f.name} | ${f.loc} | ${f.cc} | ${f.lines} | ${f.depth} |`), ``,
  `## 복잡한 익명 콜백 (인자로 넘긴 함수 — 분기 ≥40 · 120줄 이상 · 중첩 ≥7) — ${R.anon.length}`, ...R.anon.slice(0, 20).map(f => `- ${f.name} (${f.loc}) 복잡도 ${f.cc} · ${f.lines}줄 · 중첩 ${f.depth}`), ``,
  `## 분배기 안의 복잡한 case (분기 ≥20 · 중첩 ≥5) — ${R.ccases.length}`, ...R.ccases.slice(0, 20).map(c => `- ${c.fn} · \`${c.act}\` (${c.loc}) 복잡도 ${c.cc} · ${c.lines}줄 · 중첩 ${c.depth}`), ``,
  `## 데이터 ↔ 화면 흐름`, `- 여러 함수가 쓰는 상태(8곳 이상 — 소유자가 흩어짐): ${R.sf.scattered.slice(0, 15).map(x => `\`${x.key}\`(${x.writers})`).join(', ') || '없음'}`, `- 쓰기만 하고 아무도 안 읽는 키: ${R.sf.writeOnly.slice(0, 25).map(x => `\`${x.key}\``).join(', ') || '없음'}`, `- 화면 함수가 안 읽는 G.meta 키(설정이 화면에 안 보일 수 있음): ${R.sf.noScreen.slice(0, 25).map(x => `\`${x.key}\``).join(', ') || '없음'}`, `- 그래프: [flow.mmd](flow.mmd) (쓰는 함수 → 상태 → 화면 함수)`, ``,
  `## 화면 액션`, `- 발신 없는 처리기(확인 필요 — 동적으로 만들면 정상): ${act.deadH.slice(0, 40).map(x => `\`${x.act}\``).join(', ') || '없음'}`, ``,
  `## 파편화·다중화`, `- 문서 전역 클릭 리스너 ${R.sg.listeners.length}개: ${[...new Set(R.sg.listeners.map(l => l.split(':')[0]))].join(', ')}`, `- 3번 이상 되풀이되는 긴 문자열 ${R.strings.length}개`, ...R.strings.slice(0, 12).map(s => `  - ×${s.n} "${s.text}…" (${s.at.join(', ')})`), `- 빈 catch ${R.sg.emptyCatch.length}개: ${Object.entries(R.sg.emptyCatch.reduce((m, x) => (m[x.cat] = (m[x.cat] || 0) + 1, m), {})).map(([k, v]) => `${k} ${v}`).join(' · ')} — 비동기 작업은 quietErr()로 기록하세요(경고)`, `- esc() 없이 HTML 템플릿에 넣는 이름·글·용어 ${R.inj.out.length}곳: ${R.inj.out.slice(0, 8).map(x => `${x.loc} \${${x.what}}`).join(', ')}`,
  `- 안 쓰는 함수 ${R.unused.length}개: ${R.unused.slice(0, 40).map(f => `\`${f.name}\``).join(', ')}`, `- 안 쓰는 최상위 변수·상수 ${R.unusedVars.length}개: ${R.unusedVars.slice(0, 40).map(v => `\`${v.name}\` (${v.loc})`).join(', ')}`, ``,
  `## 저장·리스너·중계`, `- 저장 키(writeKey): ${R.keys ? `${R.keys.exact.join('·')} · 접두사 ${R.keys.pre.join('·')} — 모르는 키 ${R.keys.bad.length}` : 'writeKey 없음(건너뜀)'}`, `- 떼지 않는 전역 리스너 ${R.leaks.length}개`, `- 중계 서버 허용 주소: ${Object.entries(R.side.hosts).map(([p, v]) => `${p} ${v.length}개`).join(' · ') || '없음'} — 차이 ${R.relay?.diff.length ?? 0} · 앱 API 주소 ${R.relay?.api ?? 0}개 중 허용 안 됨 ${R.relay?.notAllowed.length ?? 0}`, ``,
  `## 프롬프트 스튜디오 밖 프롬프트 글 (글 AI 호출의 프롬프트·조립 함수 속 지시문, pfDef 조각이 아님) — 지시문 ${R.prompts.length}개 ${R.prompts.reduce((a, p) => a + p.chars, 0)}자`, '| 위치(최상위 선언) | 지시문 글 | 글자 |', '|---|---|---|', ...promptSites(R.prompts).slice(0, 40).map(p => `| ${p.site} | ${p.n} | ${p.chars} |`), ``,
  `## CSS (src/style)`, `- 파싱 오류·괄호 짝 ${R.css.errors.length}개${R.css.errors.length ? ': ' + R.css.errors.slice(0, 10).map(e => `${e.loc} ${e.text}`).join(', ') : ''}`, `- 코드·HTML 어디에도 없는 클래스 선택자 ${R.css.dead.length}개(지운 화면의 흔적 — 동적 접두사 \`ls-\${…}\`는 씀으로 봄): ${R.css.dead.slice(0, 60).map(x => `\`.${x.cls}\` (${x.loc})`).join(', ')}`, ``].join('\n');
const TL = R.tools, toolMd = [`## 도구 자체 (메타 점검 — tools/**·build/*.mjs ${TL.files}개 파일)`, `- 파싱 오류 ${TL.parse.length} · 복잡한 함수 ${TL.complex.length} · 같은 본문 ${TL.dup.length} · 되풀이 문자열 ${TL.strings.length} · 빈 catch ${TL.emptyCatch.length} · 안 쓰는 함수 ${TL.unused.length}`,
  ...TL.emptyCatch.map(x => `  - 빈 catch ${x.loc} (${x.cat})`), ...TL.complex.slice(0, 15).map(f => `  - 복잡 ${f.name} (${f.loc}) 복잡도 ${f.cc} · ${f.lines}줄 · 중첩 ${f.depth}`), ...TL.unused.map(f => `  - 안 쓰는 함수 ${f.name} (${f.loc})`), ...TL.dup.map(d => `  - 같은 본문 ${d.fns.join(' = ')}`), ''].join('\n');
mkdirSync(OUT, { recursive: true }); writeFileSync(join(OUT, 'report.md'), md + '\n' + toolMd); writeFileSync(join(OUT, 'flow.mmd'), mermaid(R.sf));
writeFileSync(join(OUT, 'report.json'), JSON.stringify(J, null, 1));
// 위반 래칫: 기준선보다 새로 생기거나 나빠진 항목(줄 번호와 무관한 키로 비교)
const F = findings(J), base = readBaseline(ROOT), vsBase = base ? compare(base, F) : null, refArg = (() => { const i = process.argv.indexOf('--diff'); return i > 0 ? process.argv[i + 1] : ''; })();
let vsRef = null; if (refArg) { const { sha, dir } = refTree(ROOT, refArg, OUT), ref = await analyze(dir); vsRef = compare(findings(ref.J), F); writeFileSync(join(OUT, 'diff.md'), `# 변경 비교: ${refArg} (${sha.slice(0, 7)}) → 작업 트리\n\n` + diffMd(vsRef, '자기점검 발견')); }
if (vsBase) writeFileSync(join(OUT, 'baseline-diff.md'), `# 기준선(${BASELINE}) 대비\n\n` + diffMd(vsBase, '자기점검 발견'));
/* --rebase <기준>: 분석 도구(판정 규칙)가 바뀌었을 때 — 바뀐 도구로 그 커밋의 트리를 재서 기준선으로 씀(지금 코드로 기준선을 올려 퇴보를 숨기지 않게). 그 대비 지금 코드가 새로 생김·나빠짐이면 exit 1 */
if (process.argv.includes('--rebase')) { const ref = process.argv[process.argv.indexOf('--rebase') + 1], { sha, dir } = refTree(ROOT, ref, OUT), F0 = findings((await analyze(dir)).J), d = compare(F0, F);
  writeBaseline(ROOT, F0); console.log(`기준선을 ${sha.slice(0, 7)}의 트리(지금 도구로 잼)로: ${F0.length}개 · 지금 코드는 그 대비 새로 생김 ${d.added.length} · 나빠짐 ${d.worse.length} · 해결 ${d.fixed.length} · 좋아짐 ${d.better.length}`); [...d.added, ...d.worse].forEach(f => console.log('  + ' + f.text)); process.exit(d.added.length || d.worse.length ? 1 : 0); }
if (arg('--update-baseline')) { if (vsBase && (vsBase.added.length || vsBase.worse.length) && !arg('--force')) { console.log(`기준선을 올리는 갱신은 하지 않아요: 새로 생김 ${vsBase.added.length} · 나빠짐 ${vsBase.worse.length} — 코드를 고치세요(out/baseline-diff.md). 정말 받아들일 때만 --force`); process.exit(1); } writeBaseline(ROOT, F); console.log(`기준선 갱신: ${BASELINE} (${F.length}개)`); }
if (arg('--json')) console.log(JSON.stringify(J)); else {
  console.log(`메타 점검(도구 ${R.tools.files}개 파일): 빈 catch ${R.tools.emptyCatch.length} · 복잡 ${R.tools.complex.length} · 같은 본문 ${R.tools.dup.length} · 되풀이 문자열 ${R.tools.strings.length} · 안 쓰는 함수 ${R.tools.unused.length}`);
  console.log(`자기점검: 함수 ${fnsN} · 오류 ${errors.length} · 경고 ${warns.length} · 병목 후보 ${R.hubs.length} · 동기 순환 ${R.cycles.length} · 복잡 ${R.complex.length}(분배기 case ${R.ccases.length} · 익명 콜백 ${R.anon.length}) · 안 쓰는 함수 ${R.unused.length} · ${((Date.now() - t0) / 1000).toFixed(1)}초`);
  errors.slice(0, 20).forEach(e => console.log(`  ✗ ${e.kind}: ${e.msg}`)); warns.slice(0, 10).forEach(e => console.log(`  △ ${e.kind}: ${e.msg}`)); console.log(`보고서: ${join(OUT, 'report.md')}`); }
const show = (d, label) => { if (!d) return; console.log(`${label}: 새로 생김 ${d.added.length} · 나빠짐 ${d.worse.length} · 해결 ${d.fixed.length} · 좋아짐 ${d.better.length}${(d.moved || []).length ? ` · 옮김 ${d.moved.length}(합계 그대로 — out/baseline-diff.md)` : ''}`); [...d.added.map(f => '  + ' + f.text), ...d.worse.map(f => `  ↑ ${f.text} (전: ${Object.entries(f.was).map(([k, v]) => k + ' ' + v).join(' · ')})`)].slice(0, 25).forEach(l => console.log(l)); };
if (!arg('--json')) { show(vsRef, `--diff ${refArg}`); show(vsBase, '기준선 대비'); if (!base) console.log(`기준선 없음: node tools/check.mjs --update-baseline 으로 만드세요`); }
if (arg('--strict') && (errors.length || (vsBase && !arg('--update-baseline') && (vsBase.added.length || vsBase.worse.length)))) process.exit(1);
