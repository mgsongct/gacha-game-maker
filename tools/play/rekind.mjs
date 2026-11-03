#!/usr/bin/env node
// kind 규칙(lib/kind.mjs)이 바뀌었을 때 게임 폴더의 prompts/·responses/ 파일 이름을 새 규칙으로 옮김.
// 프롬프트 파일 내용(앱이 보낸 글 그대로)으로 새 kind를 다시 계산하고, 같은 이름의 응답 파일도 함께 옮김.
//   node tools/play/rekind.mjs <게임 폴더> [--dry]
import { readdirSync, readFileSync, renameSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { kindOf } from './lib/kind.mjs';

const dir = resolve(process.argv[2] || ''), dry = process.argv.includes('--dry');
if (!process.argv[2] || !existsSync(join(dir, 'prompts'))) { console.log('사용법: node tools/play/rekind.mjs <게임 폴더> [--dry]'); process.exit(2); }
let n = 0;
for (const f of readdirSync(join(dir, 'prompts')).filter(f => f.endsWith('.txt'))) {
  const old = f.slice(0, -4); if (/^(world|chars|opening|chapter1|skill-.+)(-cont\d+)?$/.test(old)) continue;
  const cont = (old.match(/-cont\d+$/) || [''])[0], phase = old.split('-')[0], nk = kindOf(readFileSync(join(dir, 'prompts', f), 'utf8'), phase, {}) + cont;
  if (nk === old) continue; n++;
  const hasResp = existsSync(join(dir, 'responses', f));
  console.log(`${old} → ${nk}${hasResp ? ' (응답 포함)' : ''}`);
  if (dry) continue;
  if (existsSync(join(dir, 'prompts', nk + '.txt'))) { console.log('  건너뜀: 같은 새 이름이 이미 있음'); continue; }
  renameSync(join(dir, 'prompts', f), join(dir, 'prompts', nk + '.txt'));
  if (hasResp) renameSync(join(dir, 'responses', f), join(dir, 'responses', nk + '.txt'));
}
console.log(`${dry ? '미리 보기' : '옮김'}: ${n}개`);
