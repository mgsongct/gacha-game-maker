#!/usr/bin/env node
// 생성 회귀 시험: 커밋된 게임(응답 파일)을 지금 앱 코드로 다시 생성(재생)하고, 원래 결과와 QA 발견을 비교해
// "해결 · 남음 · 새로 생김"을 남겨요. 앱을 고친 뒤 생성 결과가 좋아졌는지(또는 망가졌는지) 확인하는 용도.
//   node tools/play/regress.mjs [게임 폴더…]   (기본: tools/play/games/*)
//   → <게임 폴더>/regress/{game.json, runs.json, prompts/, qa.md, qa.json} · tools/play/reports/regress.md
// 비교 기준(전): 커밋된 game-after-new.json(없으면 game.json) + 커밋된 prompts/. 후: 재생한 새 게임 + 재생 때 앱이 보낸 prompts.
// 새 게임 단계(new)만 재생해요. 앱이 보낸 프롬프트가 바뀌면 기본 단계(world·chars·opening·chapter1)는 kind가 그대로라 예전 답으로 이어지고,
// 그 밖의 요청은 답이 없어 대기로 남아요(새 답이 필요하다는 뜻 — regress/prompts에 저장됨).
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join, resolve, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runGenerate } from './lib/generate.mjs';
import { runQA, md, folderQA } from './lib/qa.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const dirs = (process.argv.slice(2).length ? process.argv.slice(2) : readdirSync(join(HERE, 'games')).map(d => join(HERE, 'games', d))).map(d => resolve(d)).filter(d => existsSync(join(d, 'input.json')) && existsSync(join(d, 'responses')));
const key = f => `${f.area}|${f.msg.replace(/\d+(\.\d+)?/g, '#').replace(/「[^」]*」/g, '「…」').slice(0, 60)}`;
const report = [];
for (const dir of dirs) {
  const name = basename(dir), input = JSON.parse(readFileSync(join(dir, 'input.json'), 'utf8')), responses = {};
  for (const f of readdirSync(join(dir, 'responses'))) if (f.endsWith('.txt')) responses[f.slice(0, -4)] = readFileSync(join(dir, 'responses', f), 'utf8');
  const out = join(dir, 'regress'); rmSync(join(out, 'prompts'), { recursive: true, force: true }); mkdirSync(join(out, 'prompts'), { recursive: true });
  const { out: g, errors } = await runGenerate({ phase: 'new', input, responses, onPrompt: (k, t) => writeFileSync(join(out, 'prompts', k + '.txt'), t), tag: 'regress-' + name });
  // 재생 때 답이 있던 요청의 프롬프트도 남김(프롬프트 점검용) — runGenerate는 답이 없는 것만 onPrompt로 넘기므로 log의 kind로 다시 받지 않고 이 실행에서 받은 프롬프트만 저장됨
  writeFileSync(join(out, 'runs.json'), JSON.stringify([{ phase: 'new', at: new Date().toISOString(), pending: g.pending, commitAtCall: g.commitAtCall, log: g.log, toasts: g.toasts, pageErrors: errors }], null, 1));
  if (!g.game) { report.push({ name, error: '재생으로 게임이 만들어지지 않음', pending: g.pending, toasts: g.toasts }); console.log(`${name}: 재생 실패 · 대기 ${g.pending.join(', ')}`); continue; }
  writeFileSync(join(out, 'game.json'), JSON.stringify(g.game));
  const baseFile = existsSync(join(dir, 'game-after-new.json')) ? 'game-after-new.json' : 'game.json';
  const before = folderQA(dir, await runQA(readFileSync(join(dir, baseFile), 'utf8'), input));
  const after = await runQA(JSON.stringify(g.game), input); after.findings = after.findings.filter(f => true);
  // 후: 재생 폴더 기준 폴더 검사(재생 때 받은 프롬프트 + 기본 단계는 이 실행의 프롬프트를 다시 받아야 하므로 log 길이만)
  const promptsNow = {}; for (const x of g.log) promptsNow[x.kind] = x.len;
  folderQA(out, after);
  writeFileSync(join(out, 'qa.json'), JSON.stringify(after, null, 1)); writeFileSync(join(out, 'qa.md'), md(after, 'regress'));
  const B = new Map(before.findings.map(f => [key(f), f])), A = new Map(after.findings.map(f => [key(f), f]));
  const resolved = [...B].filter(([k]) => !A.has(k)).map(([, f]) => f), added = [...A].filter(([k]) => !B.has(k)).map(([, f]) => f), kept = [...A].filter(([k]) => B.has(k)).map(([, f]) => f);
  report.push({ name, title: g.game.meta.title, baseFile, calls: g.log.length, pending: g.pending, steps: g.log.filter(x => !/^skill-/.test(x.kind)).map(x => `${x.kind}:${x.len}`), resolved, added, kept, before: before.findings.length, after: after.findings.length });
  console.log(`${name}: 발견 ${before.findings.length} → ${after.findings.length} (해결 ${resolved.length} · 남음 ${kept.length} · 새로 ${added.length})`);
}
const t = (h, rs) => [`| ${h.join(' | ')} |`, `|${h.map(() => '---').join('|')}|`, ...rs.map(r => `| ${r.map(x => String(x ?? '').replace(/\|/g, '/')).join(' | ')} |`)].join('\n');
const lines = [`# 생성 회귀 시험`, '', `생성: \`node tools/play/regress.mjs\` · ${new Date().toISOString().slice(0, 16)} · 같은 글 AI 응답으로 지금 앱 코드가 새 게임을 다시 만든 결과와, 커밋된 원래 결과의 QA 발견 비교`, ''];
for (const r of report) {
  if (r.error) { lines.push(`## ${r.name}`, '', `- ${r.error} · 대기 ${(r.pending || []).join(', ')}`, ''); continue; }
  lines.push(`## ${r.name} — ${r.title}`, '', `- 기준(전): \`${r.baseFile}\` · 재생 호출 ${r.calls}회 · 기본 단계 요청(자) ${r.steps.join(' · ')}${r.pending.length ? ` · 답이 없어 대기: ${r.pending.join(', ')}` : ''}`, `- 발견 ${r.before} → ${r.after} · **해결 ${r.resolved.length}** · 남음 ${r.kept.length} · 새로 생김 ${r.added.length}`, '',
    '### 해결', '', r.resolved.length ? t(['등급', '영역', '내용(전)'], r.resolved.map(f => [f.sev, f.area, f.msg])) : '없음', '',
    '### 새로 생김', '', r.added.length ? t(['등급', '영역', '내용'], r.added.map(f => [f.sev, f.area, f.msg])) : '없음', '',
    '### 남음', '', r.kept.length ? t(['등급', '영역', '내용'], r.kept.map(f => [f.sev, f.area, f.msg])) : '없음', '');
}
mkdirSync(join(HERE, 'reports'), { recursive: true }); writeFileSync(join(HERE, 'reports/regress.md'), lines.join('\n')); console.log('→ tools/play/reports/regress.md');
