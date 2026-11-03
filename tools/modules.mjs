#!/usr/bin/env node
// 모듈 경계 보고서: 모듈 지도 · 영역 침범(다른 모듈 일을 하는 함수, 남의 상태 쓰기) · 파편화(여러 모듈이 쓰는 상태, 스튜디오 밖 프롬프트 — LLM·이미지)
//   node tools/modules.mjs   → tools/out/modules.md · modules.json   (분석 방법: tools/lib/modules.mjs, tools/lib/prompts.mjs)
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadUnits } from './lib/source.mjs';
import { buildGraph } from './lib/graph.mjs';
import { stateFlow } from './lib/flow.mjs';
import { moduleMap } from './lib/modules.mjs';
import { inlinePrompts, promptSites, fragmentFiles, promptText, IMAGE_SINKS, tagText } from './lib/prompts.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..'), OUT = join(ROOT, 'tools/out');
const units = await loadUnits(ROOT), { fns } = buildGraph(units), sf = stateFlow(units, fns), M = moduleMap(units, fns, sf), home = fragmentFiles(units).home;
const llmIns = inlinePrompts(units), llmAll = inlinePrompts(units, { pred: promptText, home }), img = inlinePrompts(units, { sinks: IMAGE_SINKS, pred: tagText, home, tables: true });
const byFile = rows => { const m = new Map(); rows.forEach(r => { const f = r.loc.split(':')[0]; const x = m.get(f) || { n: 0, chars: 0 }; x.n++; x.chars += r.chars; m.set(f, x); }); return [...m].sort((a, b) => b[1].chars - a[1].chars); };
const sum = rows => `${rows.length}개 ${rows.reduce((a, r) => a + r.chars, 0)}자`;
const t = (h, rs) => [`| ${h.join(' | ')} |`, `|${h.map(() => '---').join('|')}|`, ...rs.map(r => `| ${r.map(x => String(x ?? '').replace(/\|/g, '/')).join(' | ')} |`)].join('\n');
const top3 = m => [...m].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([f, n]) => `${f.replace(/^src\/(main|modules)\//, '')}(${n})`).join(', ');
const foreignBy = new Map(); M.foreign.forEach(x => { const k = x.file; foreignBy.set(k, (foreignBy.get(k) || 0) + 1); });
const md = [`# 모듈 경계 보고서`, '', `생성: \`node tools/modules.mjs\` · 모듈 ${M.mods.length}개 · 공용 기반은 영역 판단에서 뺌: 허브 함수(25개 이상 함수가 부름)와 공용 기반 모듈(모듈 절반 이상이 부름: ${M.infra.map(f => f.replace(/^src\/main\//, '')).join(', ')})`, '',
  `## 요약`, '', `- 영역 침범 후보(참조의 절반 이상이 다른 한 모듈 — 그 모듈의 일을 하는 함수): ${M.envy.length}`, `- 남의 상태 쓰기(상태 키를 주인 모듈이 아닌 모듈이 씀): ${M.foreign.length}곳`, `- 파편화(3개 이상 모듈이 쓰는 상태 키): ${M.scattered.length}`,
  `- 프롬프트 파편화(스튜디오 \`${home}\` 밖): LLM 지시문 ${sum(llmIns)} · LLM 프롬프트 글 전체(답 형식 견본·머리말 포함) ${sum(llmAll)} · 이미지 프롬프트 조각 ${sum(img)}`, '',
  `## 모듈 지도`, '', t(['모듈', '제목', '줄', '함수', '주인인 상태 키', '주로 부르는 모듈', '주로 불리는 모듈', '남의 상태 쓰기'], M.mods.map(m => [m.file.replace(/^src\//, ''), m.title, m.lines, m.fns, m.owns, top3(m.out), top3(m.in), foreignBy.get(m.file) || ''])), '',
  `## 영역 침범 후보 — 다른 모듈의 일을 하는 함수 (${M.envy.length})`, '', t(['함수', '있는 모듈', '참조가 몰린 모듈', '몰린 비율', '참조 수'], M.envy.map(e => [e.fn, e.file.replace(/^src\//, ''), e.to.replace(/^src\//, ''), e.share + '%', e.refs])), '',
  `## 파편화 — 3개 이상 모듈이 쓰는 상태 키 (${M.scattered.length})`, '', t(['상태 키', '주인(가장 많이 씀)', '쓰는 모듈 수', '쓰는 모듈'], M.scattered.map(x => [x.key, x.owner.replace(/^src\//, ''), x.files.length, x.files.map(f => f.replace(/^src\/(main|modules)\//, '')).join(', ')])), '',
  `## 프롬프트 파편화 — 스튜디오 밖 (파일별)`, '', `### LLM 프롬프트 글(답 형식 견본·머리말 포함) ${sum(llmAll)}`, '', t(['파일', '글', '글자'], byFile(llmAll).map(([f, x]) => [f, x.n, x.chars])), '',
  `### 이미지 프롬프트 조각 ${sum(img)}`, '', t(['파일', '글', '글자'], byFile(img).map(([f, x]) => [f, x.n, x.chars])), ''].join('\n');
mkdirSync(OUT, { recursive: true }); writeFileSync(join(OUT, 'modules.md'), md); writeFileSync(join(OUT, 'modules.json'), JSON.stringify({ mods: M.mods.map(m => ({ ...m, out: Object.fromEntries(m.out), in: Object.fromEntries(m.in) })), envy: M.envy, foreign: M.foreign, scattered: M.scattered, prompts: { llmInstructions: llmIns.length, llmText: llmAll.map(({ key, chars, loc }) => ({ key, chars, loc })), image: img.map(({ key, chars, loc }) => ({ key, chars, loc })) } }, null, 1));
console.log(`모듈 ${M.mods.length} · 영역 침범 후보 ${M.envy.length} · 남의 상태 쓰기 ${M.foreign.length} · 파편화 상태 키 ${M.scattered.length} · 스튜디오 밖 LLM 지시문 ${sum(llmIns)} · LLM 프롬프트 글 ${sum(llmAll)} · 이미지 프롬프트 ${sum(img)}`);
console.log('→ tools/out/modules.md');
