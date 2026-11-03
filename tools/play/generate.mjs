#!/usr/bin/env node
// 게임 생성 하네스: 앱의 실제 생성 경로(buildNewGameDraft · v2GenerateSkills · aiChapterGen)를 브라우저에서 돌리되,
// 글 AI 요청(Anthropic 형식, http → api.anthropic.com)만 가로채 "응답 파일"로 답해요. 응답 파일이 없으면 앱이 보낸 프롬프트를
// 파일로 내놓고 멈춰요 → 사람이나 다른 AI(에이전트)가 그 프롬프트에 답을 써 넣고 다시 실행 → 끝날 때까지 되풀이.
// 응답이 다 있으면 키 없이 같은 게임을 다시 만들 수 있어요(재생). 앱 코드를 고친 뒤 같은 응답으로 다시 생성해 결과를 비교하는 회귀 시험에도 씀.
//
//   node tools/play/generate.mjs <게임 폴더> new        input.json → 새 게임
//   node tools/play/generate.mjs <게임 폴더> skills     스킬이 임시(기본)인 대원의 스킬 설계
//   node tools/play/generate.mjs <게임 폴더> chapter [--stages 4] [--dir "지시"]   다음 메인 장
//   node tools/play/generate.mjs <게임 폴더> import <게임.json>   게임 파일을 앱의 데이터 폴더 가져오기로 새 게임에 추가
//
// 동적 분석 하네스: 앱(SPA)의 실제 생성 경로에 글 AI 응답(데이터)을 넣어 반응을 봄. 저장은 앱 흐름 그대로 — PC 서버(저장소 pc/, PC서버-시작.bat과 같은 경로)의
// data/<게임id>/<종류>.json, 브라우저 IndexedDB는 캐시(매 실행 빈 브라우저가 서버 data에서 받아 오고, 끝나면 앱의 pcPush로 다시 씀)
//
// 게임 폴더:
//   input.json            새 게임 입력({mode:'auto', auto:'한 줄 아이디어', n:6} — 초안 화면의 자율 모드와 같은 형식)
//   prompts/<kind>.txt    앱이 글 AI에 보낸 글(지침·교훈·"JSON만 출력"까지 붙은 최종본)
//   responses/<kind>.txt  그 요청에 대한 글 AI의 답(모델이 낸 글 그대로, JSON만)
//   (게임 데이터는 저장소 pc/data/<게임id>/ — 이 폴더의 runs.json에 마지막으로 저장한 게임 id). skills·chapter는 대기 중 요청이 없을 때만 저장
//   runs.json             실행 기록(호출 순서·길이·대기 중 요청·알림·AI 기록·저장한 게임 id)
// kind: world · chars · opening · chapter1 · skill-<대원 이름>-<그 대원의 n번째 요청> · <phase>-<요청 첫머리>-<해시>
//       뒤에 -cont1 이 붙으면 길이 초과로 끊긴 답을 이어 달라는 요청
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { runGenerate } from './lib/generate.mjs';
import { hasGame, gidOf } from './lib/data.mjs';
import { PC_DIR } from './lib/page.mjs';

const args = process.argv.slice(2), opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
if (args.length < 2 || !['new', 'skills', 'chapter', 'import'].includes(args[1])) { console.log('사용법: node tools/play/generate.mjs <게임 폴더> new|skills|chapter|import [--stages N] [--dir "지시"] [게임.json]'); process.exit(2); }
const dir = resolve(args[0]), phase = args[1], stages = +(opt('--stages') || 4), direction = opt('--dir') || '메인 플롯을 따라 자연스럽게 이어서', pcHome = PC_DIR, gid = gidOf(dir);
for (const d of ['responses', 'prompts']) mkdirSync(join(dir, d), { recursive: true });
const responses = {}; for (const f of readdirSync(join(dir, 'responses'))) if (f.endsWith('.txt')) responses[f.slice(0, -4)] = readFileSync(join(dir, 'responses', f), 'utf8');
const input = existsSync(join(dir, 'input.json')) ? JSON.parse(readFileSync(join(dir, 'input.json'), 'utf8')) : null;
if (phase === 'new' && !input) { console.log('input.json이 없어요'); process.exit(2); }
if ((phase === 'new' || phase === 'import') && gid && hasGame(pcHome, gid)) { console.log(`이 폴더의 게임이 이미 pc/data/${gid}에 있어요 — 다시 만들려면 앱에서 그 게임을 지우고 runs.json을 옮기세요`); process.exit(2); }
if ((phase === 'skills' || phase === 'chapter') && !(gid && hasGame(pcHome, gid))) { console.log('pc/data에 이 폴더의 게임이 없어요 — 먼저 new'); process.exit(2); }
const game = phase === 'import' ? readFileSync(resolve(args[2] || ''), 'utf8') : null;

const { out, errors } = await runGenerate({ phase, responses, input, game, stages, direction, pcHome, gid: phase === 'skills' || phase === 'chapter' ? gid : null, onPrompt: (kind, text) => { const p = join(dir, 'prompts', kind + '.txt'); if (!existsSync(p)) writeFileSync(p, text); } });

const runs = existsSync(join(dir, 'runs.json')) ? JSON.parse(readFileSync(join(dir, 'runs.json'), 'utf8')) : [];
runs.push({ phase, at: new Date().toISOString(), saved: out.saved || null, pending: out.pending, commitAtCall: out.commitAtCall, log: out.log, toasts: out.toasts, ailog: out.ailog, ms: out.ms, stat: out.stat, thrown: out.thrown, chapter: out.chapter, todo: out.todo, pageErrors: errors });
writeFileSync(join(dir, 'runs.json'), JSON.stringify(runs, null, 1));
console.log(JSON.stringify({ phase, done: !!out.game && !out.pending.length, saved: out.saved || null, pending: out.pending, calls: out.log.length, thrown: out.thrown || null, pageErrors: errors.length, toasts: out.toasts.slice(-3), chapter: out.chapter || null, todo: out.todo || null }, null, 1));
if (out.pending.length) console.log('답이 필요한 프롬프트:\n' + out.pending.map(k => join(dir, 'prompts', k + '.txt')).join('\n') + `\n→ 같은 이름으로 ${join(dir, 'responses')}/<kind>.txt 에 답을 쓰고 다시 실행`);
