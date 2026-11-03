#!/usr/bin/env node
// 모듈 경계 보고서: 모듈 지도 · 영역 침범(다른 모듈 일을 하는 함수, 남의 상태 쓰기) · 파편화(여러 모듈이 쓰는 상태, 스튜디오 밖 프롬프트 — LLM·이미지)
//   node tools/modules.mjs   → tools/out/modules.md · modules.json   (분석 방법: tools/lib/modules.mjs, tools/lib/prompts.mjs)
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadUnits } from './lib/source.mjs';
import { buildGraph } from './lib/graph.mjs';
import { stateFlow } from './lib/flow.mjs';
import { moduleMap, areaMap, naturalBoundaries } from './lib/modules.mjs';
import { moduleOf } from './lib/scope.mjs';
import { readFileSync } from 'node:fs';
import { inlinePrompts, promptSites, fragmentFiles, promptText, IMAGE_SINKS, tagText, sharedHelpers } from './lib/prompts.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..'), OUT = join(ROOT, 'tools/out');
const units = await loadUnits(ROOT), { fns } = buildGraph(units), sf = stateFlow(units, fns), M = moduleMap(units, fns, sf, { modOf: moduleOf, layer: fragmentFiles(units).home }), home = fragmentFiles(units).home;
const shared = sharedHelpers(ROOT), llmIns = inlinePrompts(units, { shared }), llmAll = inlinePrompts(units, { pred: promptText, home, shared }), img = inlinePrompts(units, { sinks: IMAGE_SINKS, pred: tagText, home, tables: true, shared });
const NB = naturalBoundaries(fns, sf, M, moduleOf, fragmentFiles(units).home), short = m => String(m).replace(/^src\/(main|modules)\//, '');
const areas = areaMap(readFileSync(join(ROOT, 'docs/modules.md'), 'utf8'), units, fns, M);
const byFile = rows => { const m = new Map(); rows.forEach(r => { const f = r.loc.split(':')[0]; const x = m.get(f) || { n: 0, chars: 0 }; x.n++; x.chars += r.chars; m.set(f, x); }); return [...m].sort((a, b) => b[1].chars - a[1].chars); };
const sum = rows => `${rows.length}개 ${rows.reduce((a, r) => a + r.chars, 0)}자`;
const t = (h, rs) => [`| ${h.join(' | ')} |`, `|${h.map(() => '---').join('|')}|`, ...rs.map(r => `| ${r.map(x => String(x ?? '').replace(/\|/g, '/')).join(' | ')} |`)].join('\n');
const top3 = m => [...m].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([f, n]) => `${f.replace(/^src\/(main|modules)\//, '')}(${n})`).join(', ');
const foreignBy = new Map(); M.foreign.forEach(x => { const k = x.file; foreignBy.set(k, (foreignBy.get(k) || 0) + 1); });
const md = [`# 모듈 경계 보고서`, '', `생성: \`node tools/modules.mjs\` · 모듈 ${M.mods.length}개 · 공용 기반은 영역 판단에서 뺌: 허브 함수(25개 이상 함수가 부름)와 공용 기반 모듈(모듈 절반 이상이 부름: ${M.infra.map(f => f.replace(/^src\/main\//, '')).join(', ')})`, '',
  `## 요약`, '', `- 영역 침범 후보(참조의 절반 이상이 다른 한 모듈 — 그 모듈의 일을 하는 함수): ${M.envy.length}`, `- 남의 상태 쓰기(상태 키를 주인 모듈이 아닌 모듈이 씀): ${M.foreign.length}곳`, `- 파편화(3개 이상 모듈이 쓰는 상태 키): ${M.scattered.length}`,
  `- 프롬프트 파편화(스튜디오 \`${home}\` 밖): LLM 지시문 ${sum(llmIns)} · LLM 프롬프트 글 전체(답 형식 견본·머리말 포함) ${sum(llmAll)} · 이미지 프롬프트 조각 ${sum(img)}`, '',
  `## 자연 경계와 파일 경계 (정밀 — 함수 그래프 모듈성 최대화)`, '', `함수 ${NB.nodes}개(호출 + 같은 상태 키를 읽고 쓰는 사이, 공용 기반·액션 분배기 뺌)가 ${NB.clusters}개 묶음으로 뭉침. 모듈성 Q: 파일 경계 ${NB.Qfile} · 찾은 경계 ${NB.Qnat} (차이가 클수록 파일 경계가 실제 뭉침과 어긋남)`, '',
  `### 과잉 분할 (${NB.overSplit.length})`, '', '서로 강하게 묶임 = 두 모듈 사이 연결 무게가 둘 중 작은 쪽의 안 무게 이상이고 서로가 서로의 가장 강한 바깥 연결(한 기능을 두 파일로 쪼갬) · 위성 모듈 = 함수 4개 이하이고 바깥 연결 70%↑가 한 모듈', '', t(['종류', '모듈', '사이 무게', '안 무게', '함수 수', '상대 쪽으로 기운 함수(옮길 후보 — 상대 쪽 무게/제 쪽)'], NB.overSplit.map(x => [x.kind, x.mods.map(short).join(' ↔ '), x.inter, x.intra.join(' / '), x.fns.join(' / '), (x.lean || []).slice(0, 8).map(l => `${l.fn}→${short(l.to)} ${l.w}/${l.own}`).join(', ')])), '',
  `### 기능 섞임 — 한 모듈의 함수가 여러 묶음으로 갈림 (${NB.mixed.length})`, '', '묶음 이름 = 그 묶음에 함수가 많은 모듈 둘(함수 수)', '', t(['모듈', '함수', '묶음별 함수(예)'], NB.mixed.map(x => [short(x.mod), x.fns, x.parts.map(p => `${p.n}: ${short(p.cluster).replace(/src\/(main|modules)\//g, '')} — ${p.sample.join(', ')}`).join(' · ')])), '',
  `### 기능 분산 — 다른 한 모듈의 일을 하는 함수 (${NB.displaced.length})`, '', '함수의 연결 무게(호출 + 같은 상태 키)가 다른 한 모듈로 60%↑이고 자기 모듈 쪽의 2배↑', '', t(['함수', '있는 모듈', '연결이 몰린 모듈', '비율', '연결 무게'], NB.displaced.map(x => [x.fn, short(x.mod), short(x.to), x.share + '%', x.weight])), '',
  `## 기능 영역 (docs/modules.md 절마다 적은 파일·함수)`, '', '흩어진 함수 = 절에 적혔는데 그 절의 파일 밖에 있음 · 영역 상태 밖에서 씀 = 영역 파일이 주인인 키를 다른 파일이 씀 · 영역 일을 하는 밖 함수 / 남의 일을 하는 영역 함수 = 영역 침범 후보 중 그 영역에 걸친 것', '',
  t(['영역', '파일', '함수', '흩어진 함수', '영역 상태를 밖에서 씀', '영역 일을 하는 밖 함수', '남의 일을 하는 영역 함수', '부르는 영역', '불리는 영역'], areas.map(a => [a.title, a.files.map(f => f.replace(/^src\/(main|modules)\//, '')).join(' '), a.fns, a.misplaced.join(', '), a.foreignW.join(', '), a.envyIn.join(', '), a.envyOut.join(', '), a.calls, a.calledBy])), '',
  `## 모듈 지도`, '', t(['모듈', '제목', '줄', '함수', '주인인 상태 키', '주로 부르는 모듈', '주로 불리는 모듈', '남의 상태 쓰기'], M.mods.map(m => [m.file.replace(/^src\//, ''), m.title, m.lines, m.fns, m.owns, top3(m.out), top3(m.in), foreignBy.get(m.file) || ''])), '',
  `## 영역 침범 후보 — 다른 모듈의 일을 하는 함수 (${M.envy.length})`, '', t(['함수', '있는 모듈', '참조가 몰린 모듈', '몰린 비율', '참조 수'], M.envy.map(e => [e.fn, e.file.replace(/^src\//, ''), e.to.replace(/^src\//, ''), e.share + '%', e.refs])), '',
  `## 파편화 — 3개 이상 모듈이 쓰는 상태 키 (${M.scattered.length})`, '', t(['상태 키', '주인(가장 많이 씀)', '쓰는 모듈 수', '쓰는 모듈'], M.scattered.map(x => [x.key, x.owner.replace(/^src\//, ''), x.files.length, x.files.map(f => f.replace(/^src\/(main|modules)\//, '')).join(', ')])), '',
  `## 프롬프트 파편화 — 스튜디오 밖 (파일별)`, '', `### LLM 프롬프트 글(답 형식 견본·머리말 포함) ${sum(llmAll)}`, '', t(['파일', '글', '글자'], byFile(llmAll).map(([f, x]) => [f, x.n, x.chars])), '',
  `### 이미지 프롬프트 조각 ${sum(img)}`, '', t(['파일', '글', '글자'], byFile(img).map(([f, x]) => [f, x.n, x.chars])), ''].join('\n');
mkdirSync(OUT, { recursive: true }); writeFileSync(join(OUT, 'modules.md'), md); writeFileSync(join(OUT, 'modules.json'), JSON.stringify({ natural: NB, areas, mods: M.mods.map(m => ({ ...m, out: Object.fromEntries(m.out), in: Object.fromEntries(m.in) })), envy: M.envy, foreign: M.foreign, scattered: M.scattered, prompts: { llmInstructions: llmIns.length, llmText: llmAll.map(({ key, chars, loc }) => ({ key, chars, loc })), image: img.map(({ key, chars, loc }) => ({ key, chars, loc })) } }, null, 1));
console.log(`자연 경계: 묶음 ${NB.clusters} · Q 파일 ${NB.Qfile}/찾음 ${NB.Qnat} · 과잉 분할 ${NB.overSplit.length} · 기능 섞임 ${NB.mixed.length} · 기능 분산 ${NB.displaced.length}`);
console.log(`기능 영역 ${areas.length}(흩어진 함수 ${areas.reduce((a, x) => a + x.misplaced.length, 0)} · 영역 상태를 밖에서 씀 ${areas.reduce((a, x) => a + x.foreignW.length, 0)}) · 모듈 ${M.mods.length} · 영역 침범 후보 ${M.envy.length} · 남의 상태 쓰기 ${M.foreign.length} · 파편화 상태 키 ${M.scattered.length} · 스튜디오 밖 LLM 지시문 ${sum(llmIns)} · LLM 프롬프트 글 ${sum(llmAll)} · 이미지 프롬프트 ${sum(img)}`);
console.log('→ tools/out/modules.md');
