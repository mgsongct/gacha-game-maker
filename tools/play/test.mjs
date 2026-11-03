#!/usr/bin/env node
// tools/play 자체 검사: 고정 게임(fixtures/mini)을 응답 재생으로 생성 → QA → 심어 둔 문제를 잡는지, 플레이(첫 10연·전투)가 도는지
//   node tools/play/test.mjs   (playwright가 없으면 건너뜀)
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hasBrowser } from './lib/page.mjs';
import { runGenerate } from './lib/generate.mjs';
import { runQA, md } from './lib/qa.mjs';

if (!hasBrowser()) { console.log('skip tools/play: playwright 없음'); process.exit(0); }
const FIX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures/mini'), responses = {};
for (const f of readdirSync(join(FIX, 'responses'))) responses[f.slice(0, -4)] = readFileSync(join(FIX, 'responses', f), 'utf8');
const input = JSON.parse(readFileSync(join(FIX, 'input.json'), 'utf8')), prompts = {};

// 1) 재생 생성: 기본 4단계 요청이 모두 응답 파일로 처리되고 게임이 저장됨. 대원 단계 프롬프트가 기록됨
const { out: gen, errors } = await runGenerate({ phase: 'new', input, responses, onPrompt: (k, t) => { prompts[k] = t; }, tag: 'play-test' });
assert.deepEqual(errors, [], '페이지 오류');
assert.ok(gen.game && gen.game.meta.title === '시험등대', '고정 응답으로 새 게임이 저장됨');
assert.deepEqual(['world', 'chars', 'opening', 'chapter1'].filter(k => gen.log.some(x => x.kind === k && !x.pending)), ['world', 'chars', 'opening', 'chapter1'], '기본 4단계 요청을 kind로 구분해 응답');
assert.ok(Object.keys(prompts).every(k => /^skill-/.test(k)), '응답이 없는 요청(스킬 설계)만 프롬프트로 내놓음: ' + Object.keys(prompts));

// 2) QA: 심어 둔 문제 3가지를 잡음
const R = await runQA(JSON.stringify(gen.game), input), has = (area, re) => R.findings.some(f => f.area === area && re.test(f.msg));
assert.ok(has('대본', /등록되지 않은 화자 「유령」/), '등록 안 된 화자');
assert.ok(has('등장 계획', /네오/), '첫 등장 위반(네오가 1스테이지에서 말함)');
assert.ok(has('대본', /없는 배경 「없는곳」/), '없는 배경');
assert.ok(!R.findings.some(f => f.area === '기본값 섞임' && f.sev === '상'), '플롯·설정·세력을 다 채운 게임에는 상 등급 기본값 섞임이 없음');
assert.ok(R.findings.some(f => f.area === '기본값 섞임' && /재료 던전/.test(f.msg)), '재료 던전 이름을 안 준 고정 응답 → 기본 이름이 남은 것을 잡음');

// 3) 플레이: 첫 10연으로 대원을 얻고 편성, 1장 전투 시뮬레이션이 레벨별로 돈다
assert.ok(R.firstPull.owned.length >= 1 && R.firstPull.squad.length >= 1, '첫 10연 → 편성');
const st = R.battles[0]?.stages.filter(s => s.mode === 'battle') || [];
assert.ok(st.length === 4 && st.every(s => s.lv1.win !== null && s.lv20.win !== null && !s.lv1.err), '1장 전투 4개 시뮬레이션: ' + JSON.stringify(st.map(s => s.lv1)));
assert.ok(md(R, 'game').includes('## 플레이'), '보고서 생성');
console.log('ok tools/play: 응답 재생 생성(4단계·스킬 요청 기록) · QA(등록 안 된 화자·첫 등장 위반·없는 배경·재료 던전 기본값) · 플레이(첫 10연·편성·전투 레벨별 시뮬레이션) · 보고서');
