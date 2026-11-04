#!/usr/bin/env node
// 선언 옮기기(모듈 정리): 최상위 선언(function·const·let — 바로 위 설명 주석째: // 줄·/* */, 파일 머리말과 옮김 표식은 남김)을 이름으로 찾아 다른 src 파일로 원문 그대로 옮김.
//   과잉 분할·기능 섞임·기능 분산(tools/modules.mjs 자연 경계)을 고칠 때 — 한 기능을 한 모듈로 모으기. 옮긴 뒤 불러올 때 아직 없는 이름(TDZ)이 생기면 되돌리고 알림
//   node tools/move.mjs --to <src 파일> [--head "파일 제목"] 이름,이름,… [--dry]
//   옮긴 뒤: node build/build.mjs · node build/test.mjs · node tools/check.mjs --strict · node tools/modules.mjs
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadUnits } from './lib/source.mjs';
import { tdzRefs, leadComments } from './lib/extra.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..'), argv = process.argv.slice(2), arg = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const to = arg('--to'), head = arg('--head'), dry = argv.includes('--dry'), names = argv.filter((a, i) => !a.startsWith('--') && !['--to', '--head'].includes(argv[i - 1])).flatMap(a => a.split(',')).map(s => s.trim()).filter(Boolean);
if (!to || !names.length) { console.log('사용법: node tools/move.mjs --to <src 파일> [--head "제목"] 이름,이름,… [--dry]'); process.exit(2); }
const declName = c => c.type === 'function_declaration' ? c.childForFieldName('name')?.text : (c.type === 'lexical_declaration' || c.type === 'variable_declaration') ? c.namedChildren.find(x => x.type === 'variable_declarator')?.childForFieldName('name')?.text : null;
const units = await loadUnits(ROOT), files = new Map(), read = f => { if (!files.has(f)) files.set(f, readFileSync(join(ROOT, f), 'utf8')); return files.get(f); }, cuts = new Map(), moved = [], missing = new Set(names);
for (const u of units) { const r = u.tree.rootNode; for (let i = 0; i < r.childCount; i++) { const c = r.child(i), nm = declName(c); if (!nm || !missing.has(nm)) continue;
  const [file, line] = u.loc(c).split(':'); if (file === to) { missing.delete(nm); continue; } const src = read(file), t = c.text; let at = -1, bd = Infinity;
  for (let k = src.indexOf(t); k >= 0; k = src.indexOf(t, k + 1)) { const d = Math.abs(src.slice(0, k).split('\n').length - +line); if (d < bd) { bd = d; at = k; } } // 같은 원문이 여럿이면 그 줄의 것
  if (at < 0) continue; const tail = (/^[ \t]*(?:\/\/[^\n]*|\/\*[^\n]*?\*\/[ \t]*)(?=\n|$)/.exec(src.slice(at + t.length)) || [''])[0], a0 = leadComments(src, at), end = at + t.length + tail.length, len = end - a0 + (src[end] === '\n' ? 1 : 0); /* 같은 줄 뒤 주석도 같이 */
  if (!cuts.has(file)) cuts.set(file, []); cuts.get(file).push({ a0, len }); moved.push({ nm, file, text: src.slice(a0, end) }); missing.delete(nm); } }
if (missing.size) console.log(`못 찾음(최상위 선언이 아님): ${[...missing].join(', ')}`);
const before = existsSync(join(ROOT, to)) ? readFileSync(join(ROOT, to), 'utf8') : `/* ===== ${head || to} ===== */\n`, groups = new Map(); moved.forEach(x => { if (!groups.has(x.file)) groups.set(x.file, []); groups.get(x.file).push(x); });
const out = new Map(); for (const [f, cs] of cuts) { let t = read(f); cs.sort((a, b) => b.a0 - a.a0).forEach(c => { t = t.slice(0, c.a0) + t.slice(c.a0 + c.len); }); out.set(f, t); }
out.set(to, before.replace(/\n*$/, '\n') + [...groups].map(([f, xs]) => `/* ${f}에서 옮김 */\n${xs.map(x => x.text).join('\n')}`).join('\n') + '\n');
console.log(`${dry ? '(미리보기) ' : ''}${moved.length}개 → ${to}: ${moved.map(x => `${x.nm}(${x.file.replace(/^src\/main\//, '')})`).join(', ')}`);
if (dry) process.exit(0);
const orig = new Map([...out.keys()].map(f => [f, existsSync(join(ROOT, f)) ? readFileSync(join(ROOT, f), 'utf8') : null])); for (const [f, t] of out) writeFileSync(join(ROOT, f), t);
const tdz = tdzRefs(await loadUnits(ROOT)); if (tdz.length) { for (const [f, t] of orig) if (t !== null) writeFileSync(join(ROOT, f), t); else unlinkSync(join(ROOT, f)); console.log(`되돌림 — 불러올 때 아직 없는 이름: ${tdz.map(x => `${x.name} ${x.loc}`).join(', ')}`); process.exit(1); }
console.log('불러올 때 아직 없는 이름 없음 — 빌드·테스트로 확인하세요');
