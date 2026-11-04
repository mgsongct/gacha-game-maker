#!/usr/bin/env node
// 재구조화(모듈 통합) 적용: node tools/restructure.mjs [--apply]
//   계획은 docs/restructure.md 2절 표 한곳(목표 모듈 · 모으는 지금 파일). 기본은 미리 보기, --apply면 git mv로 옮김.
//   파일이 하나인 목표는 src/main/<목표>.js로, 여럿이면 src/main/<목표>/ 폴더에 원래 파일 이름으로(같은 모듈 안 순서 유지).
//   깨진 연관은 고치지 않고(사용자 지시 U16) 세어서 docs/restructure.md 4절 이슈에 기록 — 옛 경로를 가리키는 문서·도구 설정, 나머지는 빌드·점검 도구가 잡음
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..'), MAIN = join(ROOT, 'src/main'), PLAN = join(ROOT, 'docs/restructure.md'), APPLY = process.argv.includes('--apply');
// 계획 표 읽기: | `목표` | 책임 | data | `파일` `폴더/*` … |
export function readPlan(md) { const rows = []; for (const line of String(md).split('\n')) { const c = line.split('|').map(s => s.trim()); if (c.length < 6 || !/^`\d{4}-[\w-]+`$/.test(c[1])) continue;
    rows.push({ target: c[1].slice(1, -1), files: [...c[4].matchAll(/`([^`]+)`/g)].map(m => m[1]) }); } return rows; }
// 계획 → 옮김 목록(원래 경로 → 새 경로, src/main 기준)
export function moves(plan, exists = p => existsSync(join(MAIN, p)), list = d => readdirSync(join(MAIN, d)).sort()) { const out = [];
  for (const { target, files } of plan) { const srcs = files.flatMap(f => f.endsWith('/*') ? list(f.slice(0, -2)).map(x => `${f.slice(0, -2)}/${x}`) : [f]).filter(exists);
    if (!srcs.length) continue; const one = srcs.length === 1 && !files.some(f => f.endsWith('/*'));
    for (const s of srcs) { const to = one ? `${target}.js` : `${target}/${basename(s)}`; if (to !== s) out.push({ from: s, to, target }); } }
  return out; }
// 옛 경로를 가리키는 곳(문서·도구 설정·시험) — 고치지 않고 셈
function staleRefs(mv) { const files = [], walkDir = d => { for (const x of readdirSync(d)) { const p = join(d, x); if (/node_modules|\/out$|ref-src|ref-tree|\.git$/.test(p)) continue; const s = statSync(p); if (s.isDirectory()) walkDir(p); else if (/\.(md|json|mjs)$/.test(x)) files.push(p); } };
  ['docs', 'tools', 'build'].forEach(d => walkDir(join(ROOT, d))); files.push(join(ROOT, 'CLAUDE.md'));
  const hits = new Map(); for (const f of files) { const t = readFileSync(f, 'utf8'); for (const m of mv) { const old = `src/main/${m.from}`; if (t.includes(old)) hits.set(f.replace(ROOT + '/', ''), (hits.get(f.replace(ROOT + '/', '')) || 0) + 1); } }
  return hits; }

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const plan = readPlan(readFileSync(PLAN, 'utf8')), mv = moves(plan), targets = new Set(plan.map(p => p.target));
  mv.forEach(m => console.log(`  ${m.from} → ${m.to}`));
  const before = readdirSync(MAIN).length; console.log(`${APPLY ? '' : '(미리 보기) '}옮김 ${mv.length} · 목표 모듈 ${targets.size} (src/main 항목 ${before} → ${APPLY ? '' : '약 '}${targets.size})`);
  if (APPLY) { for (const m of mv) { const to = join(MAIN, m.to); mkdirSync(dirname(to), { recursive: true }); execFileSync('git', ['mv', join(MAIN, m.from), to], { cwd: ROOT }); }
    for (const d of new Set(mv.map(m => dirname(m.from)).filter(d => d !== '.'))) { try { if (!readdirSync(join(MAIN, d)).length) execFileSync('rmdir', [join(MAIN, d)]); } catch { /* 이미 없음 */ } }
    const refs = staleRefs(mv), n = [...refs.values()].reduce((a, b) => a + b, 0), md = readFileSync(PLAN, 'utf8'), at = new Date().toISOString().slice(0, 10);
    const row = `| R${(md.match(/^\| R\d+ /gm) || []).length + 1} | 1 모으기(${at}) | 옛 src/main 경로를 가리키는 곳 ${n}(파일 ${refs.size}: ${[...refs.keys()].slice(0, 8).join(' · ')}${refs.size > 8 ? ' …' : ''}) · 불러올 때 순서가 바뀌어 생길 수 있는 TDZ·정의 안 된 이름 | 경로: 옛 → 새 경로 바꾸기(이 도구의 옮김 목록) · TDZ·이름: \`node tools/check.mjs\` |`;
    writeFileSync(PLAN, md.replace(/\n*$/, '\n') + row + '\n'); console.log(`이슈 기록: 옛 경로 참조 ${n}곳(파일 ${refs.size}) → docs/restructure.md 4절`); } }
