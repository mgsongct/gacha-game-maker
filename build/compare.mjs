#!/usr/bin/env node
// 원본 index.html과 지금 src/를 모듈(파일) 단위로 비교: 무엇을 더했고·뺐고·고쳤는지
//   node build/compare.mjs                  원본 = git 13a3fe9 (원본 jjhk0803 2026.10.24.1과 같은 파일)
//   node build/compare.mjs <파일.html|git참조>  예: upstream/main, /tmp/upstream.html
import { readFileSync, readdirSync, statSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { split } from './split.mjs';
import { build } from './build.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..'), BASE = '13a3fe9';
export function original(ref = BASE) {
  return existsSync(ref) ? readFileSync(ref, 'utf8') : execFileSync('git', ['show', `${ref}:www/index.html`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20 });
}
const walk = d => readdirSync(d).flatMap(f => statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]);
// 번호를 빼고 비교해요(사이에 새 모듈을 넣어도 뒤 모듈이 "바뀜"으로 보이지 않게)
const key = p => p.replace(/(^|\/)\d+-/g, '$1');

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const ref = process.argv[2] || BASE, html = original(ref), tmp = mkdtempSync(join(tmpdir(), 'ggm-cmp-'));
  try {
    split(html, tmp);
    if (build(tmp) !== html) throw Error('원본을 나눴다 합쳤더니 달라요(split 규칙 확인 필요)');
    const read = d => new Map(walk(d).map(f => [key(relative(d, f)), { path: relative(d, f), text: readFileSync(f, 'utf8') }]));
    const a = read(tmp), b = read(join(ROOT, 'src')), lines = t => t.split('\n').length - 1;
    const sha = t => createHash('sha256').update(t).digest('hex').slice(0, 12);
    console.log(`원본: ${ref} (build ${(html.match(/var BUILT='([^']+)'/) || [])[1]}, sha256 ${sha(html)}…)  ↔  src/ (build ${(readFileSync(join(ROOT, 'src/boot/head.js'), 'utf8').match(/var BUILT='([^']+)'/) || [])[1]})`);
    let same = 0;
    for (const [k, x] of a) {
      const y = b.get(k);
      if (!y) console.log(`  - 없어짐  ${x.path}`);
      else if (x.text !== y.text) {
        const xl = x.text.split('\n'), yl = new Set(y.text.split('\n')), xs = new Set(xl);
        console.log(`  * 바뀜    ${y.path}  (-${xl.filter(l => !yl.has(l)).length} +${y.text.split('\n').filter(l => !xs.has(l)).length}줄)`);
      } else same++;
    }
    for (const [k, y] of b) if (!a.has(k)) console.log(`  + 추가    ${y.path}  (${lines(y.text)}줄)`);
    console.log(`  같음: ${same}개 파일`);
  } finally { rmSync(tmp, { recursive: true, force: true }); }
}
