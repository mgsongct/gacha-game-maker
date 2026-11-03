#!/usr/bin/env node
// 안 쓰는 코드 정리: node tools/fix.mjs [--apply]
//   기본은 미리 보기. --apply면 지우고, 지운 뒤 새로 안 쓰이게 된 것까지 더 이상 없을 때까지 되풀이해요.
//   지우는 것: ① 이름이 선언 말고 어디에도(코드·문자열·HTML·테스트) 없는 main 최상위 함수·const/let
//             ② 분배기(handle…Action)의 case 중 어디서도 보내지 않는 액션(앞 case가 흘러 들어오는 본문은 남김) + 분배 표(APP_ACTION_HANDLERS) 항목
//   줄 전체를 차지하는 선언만 지워요(한 줄에 여러 선언이 섞이면 건너뛰고 알려 줌). 끝나면 node build/build.mjs와 테스트를 돌리세요.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadUnits, walk } from './lib/source.mjs';
import { buildGraph, unused, unusedVars } from './lib/graph.mjs';
import { actions } from './lib/flow.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..'), APPLY = process.argv.includes('--apply');
const extra = () => ['src/index.html', 'build/test.mjs'].map(f => readFileSync(join(ROOT, f), 'utf8')).join('\n');
async function pass() {
  const units = await loadUnits(ROOT), main = units[0], allText = units.map(u => u.text).join('\n') + extra(), { fns, tops } = buildGraph(units);
  let off = 0; const files = main.files.map(f => { const text = readFileSync(join(ROOT, f.path), 'utf8'), r = { path: f.path, start: off, text }; off += text.length; return r; });
  const cuts = [], skip = [], lineCut = (node, what) => { const s = node.startIndex, e = node.endIndex, f = files.findLast(x => x.start <= s), a = s - f.start, b = e - f.start, ls = f.text.lastIndexOf('\n', a - 1) + 1, le = f.text.indexOf('\n', b);
    if (f.text.slice(ls, a).trim() || f.text.slice(b, le < 0 ? undefined : le).replace(/^;/, '').trim()) { skip.push(`${what} (${f.path} — 한 줄에 다른 코드가 함께 있음)`); return; } cuts.push({ f, a: ls, b: le < 0 ? f.text.length : le + 1, what }); };
  for (const fn of unused(fns, allText)) { let n = fn.node; if (n.parent?.type === 'variable_declarator') n = n.parent.parent; if (n.parent?.type !== 'program') continue; lineCut(n, '함수 ' + fn.name); }
  for (const v of unusedVars(tops, fns, allText)) walk(main.tree.rootNode, n => { if ((n.type === 'lexical_declaration' || n.type === 'variable_declaration') && n.parent?.type === 'program') { const ds = n.namedChildren.filter(c => c.type === 'variable_declarator'); if (ds.length === 1 && ds[0].childForFieldName('name')?.text === v.name) lineCut(n, '변수 ' + v.name); return false; } });
  const act = actions(units, extra()), dead = new Set(act.deadH.map(x => x.act)), sv = n => n?.type === 'string' ? n.text.slice(1, -1) : null;
  walk(main.tree.rootNode, n => { if (n.type !== 'switch_case' || !dead.has(sv(n.childForFieldName('value')))) return; let fn = n.parent; while (fn && fn.type !== 'function_declaration') fn = fn.parent; if (!/^handle\w+Action$/.test(fn?.childForFieldName('name')?.text || '')) return;
    const v = n.childForFieldName('value'), body = n.namedChildren.filter(c => c.type !== 'comment' && c.startIndex !== v.startIndex), prev = n.previousNamedSibling;
    if (body.length && prev?.type === 'switch_case' && prev.namedChildren.filter(c => c.type !== 'comment').length === 1 && !dead.has(sv(prev.childForFieldName('value')))) { skip.push(`case ${v.text} (앞 case가 흘러 들어옴)`); return; }
    const s = n.startIndex; let e = n.endIndex; while (main.text[e] === ' ') e++; const f = files.findLast(x => x.start <= s); let a = s - f.start, b = e - f.start; if (f.text[b] === '\n' && (a === 0 || f.text[a - 1] === '\n')) b++; cuts.push({ f, a, b, what: `case ${v.text}`, act: sv(v) }); });
  return { cuts, skip, files };
}
let total = 0;
for (let round = 1; round <= 8; round++) {
  const { cuts, skip, files } = await pass(); if (round === 1 && skip.length) skip.forEach(s => console.log('  건너뜀:', s));
  if (!cuts.length) break; console.log(`${round}회차: ${cuts.length}개`); cuts.forEach(c => console.log('  -', c.what, '·', c.f.path)); total += cuts.length; if (!APPLY) break;
  const byFile = new Map(); cuts.forEach(c => { if (!byFile.has(c.f)) byFile.set(c.f, []); byFile.get(c.f).push(c); });
  for (const [f, cs] of byFile) { let t = f.text; cs.sort((x, y) => y.a - x.a).forEach(c => { t = t.slice(0, c.a) + t.slice(c.b); }); writeFileSync(join(ROOT, f.path), t); }
  const acts = cuts.filter(c => c.act).map(c => c.act); if (acts.length) { const dp = join(ROOT, 'src/main/0510-actions/130-dispatch.js'); let d = readFileSync(dp, 'utf8'); acts.forEach(a => { d = d.replace(new RegExp(`"${a}":handle\\w+Action,?`), ''); }); writeFileSync(dp, d.replace(/,\}\);/, '});')); }
}
console.log(APPLY ? `지웠어요: ${total}개. node build/build.mjs 후 테스트를 돌리세요.` : `미리 보기(${total}개). 지우려면 --apply`);
