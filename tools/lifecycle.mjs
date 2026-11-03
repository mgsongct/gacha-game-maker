#!/usr/bin/env node
// 데이터 생애주기 보고서: node tools/lifecycle.mjs [--ref <원안 git 기준, 기본 fork-features.json의 upstreamSrc>]
//   원안(포크 전) 트리와 지금 트리에서 게임 데이터 키마다 생성 / 실행 중 AI / 사용자 / 불러오기 중 어디서 쓰는지(lib/lifecycle.mjs)를 뽑아
//   ① 원안이 무엇을 언제 만들었는지 ② 포크가 더한 키가 그 경계의 어디에 붙었는지(아무도 안 씀 · 사용자 조작으로만 · 실행 중 AI 경로 밖)를 보여 줌
//   결과: tools/out/lifecycle.md · lifecycle.json
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadUnits } from './lib/source.mjs';
import { buildGraph } from './lib/graph.mjs';
import { stateFlow } from './lib/flow.mjs';
import { lifecycle } from './lib/lifecycle.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = resolve(HERE, '..'), OUT = join(HERE, 'out'), REG = JSON.parse(readFileSync(join(HERE, 'fork-features.json'), 'utf8'));
const ri = process.argv.indexOf('--ref'), ref = ri > 0 ? process.argv[ri + 1] : (REG.upstreamSrc || REG.upstream);
const sha = execSync(`git rev-parse --verify ${JSON.stringify(ref + '^{commit}')}`, { cwd: ROOT, encoding: 'utf8' }).trim(), refDir = join(OUT, 'ref-src', sha);
if (!existsSync(join(refDir, 'src'))) { mkdirSync(refDir, { recursive: true }); execSync(`git archive ${sha} src | tar -x -C ${JSON.stringify(refDir)}`, { cwd: ROOT }); }
async function run(root) { const units = await loadUnits(root), { fns } = buildGraph(units); return lifecycle(units, fns, stateFlow(units, fns)); }
const O = await run(refDir), N = await run(ROOT), origKeys = new Set(O.rows.map(r => r.key)), ST = ['생성', '실행 중 AI', '사용자', '불러오기'];
const cell = (r, s) => r.stages[s] ? r.stages[s].slice(0, 2).join(', ') + (r.stages[s].length > 2 ? ` 외 ${r.stages[s].length - 2}` : '') : '';
const t = (h, rs) => [`| ${h.join(' | ')} |`, `|${h.map(() => '---').join('|')}|`, ...rs.map(r => `| ${r.map(x => String(x ?? '').replace(/\|/g, '/')).join(' | ')} |`)].join('\n');
const fork = N.rows.filter(r => !origKeys.has(r.key)), where = r => ST.filter(s => r.stages[s]);
const nobody = fork.filter(r => !where(r).length), userOnly = fork.filter(r => where(r).length === 1 && r.stages.사용자), noLive = fork.filter(r => !r.stages['실행 중 AI'] && !r.stages.생성 && r.stages.사용자);
const md = [`# 데이터 생애주기 (원안 ↔ 지금)`, '', `생성: \`node tools/lifecycle.mjs\` · ${new Date().toISOString().slice(0, 16)} · 원안 \`${ref}\`(${sha.slice(0, 7)} — 원본 index.html을 src/로 나눈 커밋) · 단계별 함수 수(원안/지금): ${ST.map(s => `${s} ${O.sizes[s]}/${N.sizes[s]}`).join(' · ')}`, '',
  '단계: **생성**(새 게임 초안이 만드는 것) · **실행 중 AI**(게임이 구동되는 동안 liveTick이 시즌·장·이벤트·픽업·의상·톡을 만드는 경로) · **사용자**(화면 조작 처리기) · **불러오기**(fix·defaults·applyMeta).', '',
  `## 포크가 더한 키 (${fork.length}) — 원안의 생성·실행 경계에서 어디에 붙었나`, '',
  `- 아무 단계도 쓰지 않음 ${nobody.length}: ${nobody.map(r => '`' + r.key + '`').join(', ') || '없음'}`,
  `- 사용자 조작으로만 씀 ${userOnly.length}: ${userOnly.map(r => '`' + r.key + '`').join(', ') || '없음'}`,
  `- 생성·실행 중 AI 경로 밖(사용자 조작에는 있음) ${noLive.length}: ${noLive.map(r => '`' + r.key + '`').join(', ') || '없음'}`, '',
  t(['키', '읽는 함수', ...ST], fork.map(r => [r.key, r.readers, ...ST.map(s => cell(r, s))])), '',
  `## 원안의 키 (${O.rows.length}) — 원안이 무엇을 언제 만들었나`, '', t(['키', '읽는 함수', ...ST], O.rows.map(r => [r.key, r.readers, ...ST.map(s => cell(r, s))])), ''].join('\n');
mkdirSync(OUT, { recursive: true }); writeFileSync(join(OUT, 'lifecycle.md'), md); writeFileSync(join(OUT, 'lifecycle.json'), JSON.stringify({ ref, sha, orig: O, now: N }, null, 1));
console.log(`생애주기: 원안 키 ${O.rows.length} · 지금 키 ${N.rows.length} · 포크가 더한 키 ${fork.length} (아무도 안 씀 ${nobody.length} · 사용자 조작으로만 ${userOnly.length} · 생성·실행 중 AI 밖 ${noLive.length})`); console.log('보고서: ' + join(OUT, 'lifecycle.md'));
