#!/usr/bin/env node
// 생성 회귀(동적 분석): 게임 폴더에 기록된 글 AI 응답(데이터)을 git 기준의 앱 빌드와 지금 앱 빌드에 똑같이 넣어 새 게임 생성을 재생하고,
// 두 결과의 QA 발견을 비교해 "해결 · 남음 · 새로 생김"을 남겨요. 앱을 고친 뒤 생성 결과가 좋아졌는지(또는 망가졌는지) 확인하는 용도.
//   node tools/play/regress.mjs [--ref <git 기준, 기본 HEAD>] [게임 폴더…]   (기본: tools/play/games/*)
//   → <게임 폴더>/regress/{runs.json, prompts/, qa.md, qa.json} · tools/play/reports/regress.md
// 재생은 시험용 PC 서버 폴더(tools/out/regress/<기준|now>/ — 실제 설치와 같은 배치, git에서 뺌)에 저장되고 비교 뒤 남겨 둠.
// 새 게임 단계(new)만 재생해요. 앱이 보낸 프롬프트가 바뀌면 기본 단계(world·chars·opening·chapter1)는 kind가 그대로라 예전 답으로 이어지고,
// 그 밖의 요청은 답이 없어 대기로 남아요(새 답이 필요하다는 뜻 — regress/prompts에 저장됨).
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join, resolve, basename, dirname } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runGenerate } from './lib/generate.mjs';
import { runQA, md, folderQA } from './lib/qa.mjs';
import { readGame } from './lib/data.mjs';
import { ROOT } from './lib/page.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), argv = process.argv.slice(2), ri = argv.indexOf('--ref'), ref = ri >= 0 ? argv.splice(ri, 2)[1] : 'HEAD';
const dirs = (argv.length ? argv : readdirSync(join(HERE, 'games')).map(d => join(HERE, 'games', d))).map(d => resolve(d)).filter(d => existsSync(join(d, 'input.json')) && existsSync(join(d, 'responses')));
const OUT = join(ROOT, 'tools/out/regress');
// git 기준의 앱 빌드: 그 커밋의 src/를 풀어 그 커밋의 build.mjs로 빌드(www/의 부속 파일은 지금 것을 씀)
const sha = execSync(`git rev-parse --verify ${JSON.stringify(ref + '^{commit}')}`, { cwd: ROOT, encoding: 'utf8' }).trim(), refDir = join(OUT, 'build-' + sha.slice(0, 12));
if (!existsSync(join(refDir, 'www/index.html'))) { mkdirSync(refDir, { recursive: true }); execSync(`git archive ${sha} src build | tar -x -C ${JSON.stringify(refDir)}`, { cwd: ROOT }); execSync(`cp -r ${JSON.stringify(join(ROOT, 'www'))} ${JSON.stringify(join(refDir, 'www'))}`);
  execSync(`node ${JSON.stringify(join(refDir, 'build/build.mjs'))} --src ${JSON.stringify(join(refDir, 'src'))} --out ${JSON.stringify(join(refDir, 'www/index.html'))} --no-version`, { cwd: refDir, stdio: 'ignore' }); }
const key = f => `${f.area}|${f.msg.replace(/\d+(\.\d+)?/g, '#').replace(/「[^」]*」/g, '「…」').slice(0, 60)}`;
const report = [];
async function replay(dir, side, www, input, responses, onPrompt) { const home = join(OUT, basename(dir), side); rmSync(home, { recursive: true, force: true });
  const { out: g, errors } = await runGenerate({ phase: 'new', input, responses, onPrompt, tag: `regress-${side}-${basename(dir)}`, pcHome: home, www });
  return { g, errors, game: g.saved && g.saved.ok ? readGame(home, g.saved.gid).game : g.game }; }
for (const dir of dirs) {
  const name = basename(dir), input = JSON.parse(readFileSync(join(dir, 'input.json'), 'utf8')), responses = {};
  for (const f of readdirSync(join(dir, 'responses'))) if (f.endsWith('.txt')) responses[f.slice(0, -4)] = readFileSync(join(dir, 'responses', f), 'utf8');
  const out = join(dir, 'regress'); rmSync(join(out, 'prompts'), { recursive: true, force: true }); mkdirSync(join(out, 'prompts'), { recursive: true });
  const B = await replay(dir, 'ref', join(refDir, 'www'), input, responses, null), A = await replay(dir, 'now', join(ROOT, 'www'), input, responses, (k, t) => writeFileSync(join(out, 'prompts', k + '.txt'), t));
  writeFileSync(join(out, 'runs.json'), JSON.stringify([{ phase: 'new', ref, sha, at: new Date().toISOString(), pending: A.g.pending, commitAtCall: A.g.commitAtCall, log: A.g.log, toasts: A.g.toasts, pageErrors: A.errors }], null, 1));
  if (!A.game || !B.game) { report.push({ name, error: `재생으로 게임이 만들어지지 않음(${!B.game ? '기준' : '지금'})`, pending: A.g.pending }); console.log(`${name}: 재생 실패`); continue; }
  const before = await runQA(JSON.stringify(B.game), input), after = folderQA(out, await runQA(JSON.stringify(A.game), input));
  writeFileSync(join(out, 'qa.json'), JSON.stringify(after, null, 1)); writeFileSync(join(out, 'qa.md'), md(after, 'regress'));
  const BM = new Map(before.findings.map(f => [key(f), f])), AM = new Map(after.findings.filter(f => f.area !== '생성 프롬프트' || !/폴더/.test(f.msg)).map(f => [key(f), f]));
  const resolved = [...BM].filter(([k]) => !AM.has(k)).map(([, f]) => f), added = [...AM].filter(([k]) => !BM.has(k)).map(([, f]) => f), kept = [...AM].filter(([k]) => BM.has(k)).map(([, f]) => f);
  report.push({ name, title: A.game.meta.title, calls: A.g.log.length, pending: A.g.pending, steps: A.g.log.filter(x => !/^skill-/.test(x.kind)).map(x => `${x.kind}:${x.len}`), resolved, added, kept, before: before.findings.length, after: after.findings.length });
  console.log(`${name}: 발견 ${before.findings.length}(${ref}) → ${after.findings.length}(지금) (해결 ${resolved.length} · 남음 ${kept.length} · 새로 ${added.length})`);
}
const t = (h, rs) => [`| ${h.join(' | ')} |`, `|${h.map(() => '---').join('|')}|`, ...rs.map(r => `| ${r.map(x => String(x ?? '').replace(/\|/g, '/')).join(' | ')} |`)].join('\n');
const lines = [`# 생성 회귀 시험`, '', `생성: \`node tools/play/regress.mjs --ref ${ref}\` · ${new Date().toISOString().slice(0, 16)} · 같은 글 AI 응답을 \`${ref}\`(${sha.slice(0, 7)}) 빌드와 지금 빌드에 넣어 새 게임을 다시 만든 결과의 QA 발견 비교`, ''];
for (const r of report) {
  if (r.error) { lines.push(`## ${r.name}`, '', `- ${r.error} · 대기 ${(r.pending || []).join(', ')}`, ''); continue; }
  lines.push(`## ${r.name} — ${r.title}`, '', `- 재생 호출 ${r.calls}회 · 기본 단계 요청(자) ${r.steps.join(' · ')}${r.pending.length ? ` · 답이 없어 대기: ${r.pending.join(', ')}` : ''}`, `- 발견 ${r.before} → ${r.after} · **해결 ${r.resolved.length}** · 남음 ${r.kept.length} · 새로 생김 ${r.added.length}`, '',
    '### 해결', '', r.resolved.length ? t(['등급', '영역', '내용(전)'], r.resolved.map(f => [f.sev, f.area, f.msg])) : '없음', '',
    '### 새로 생김', '', r.added.length ? t(['등급', '영역', '내용'], r.added.map(f => [f.sev, f.area, f.msg])) : '없음', '',
    '### 남음', '', r.kept.length ? t(['등급', '영역', '내용'], r.kept.map(f => [f.sev, f.area, f.msg])) : '없음', '');
}
mkdirSync(join(HERE, 'reports'), { recursive: true }); writeFileSync(join(HERE, 'reports/regress.md'), lines.join('\n')); console.log('→ tools/play/reports/regress.md');
