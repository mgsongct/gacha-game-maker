#!/usr/bin/env node
// 안 쓰는 코드 정리: node tools/fix.mjs [--apply]
//   기본은 미리 보기. --apply면 지우고, 지운 뒤 새로 안 쓰이게 된 것까지 더 이상 없을 때까지 되풀이해요.
//   지우는 것: ① 이름이 선언 말고 어디에도(코드·문자열·HTML·테스트) 없는 main 최상위 함수·const/let
//             ② 분배기(handle…Action)의 case 중 어디서도 보내지 않는 액션(앞 case가 흘러 들어오는 본문은 남김) + 분배 표(APP_ACTION_HANDLERS) 항목
//   줄 전체를 차지하는 선언만 지워요(한 줄에 여러 선언이 섞이면 건너뛰고 알려 줌). 끝나면 node build/build.mjs와 테스트를 돌리세요.
// 규칙의 고치는 법 적용: node tools/fix.mjs --rule D1 [--apply] — 규칙표(lib/rules.mjs)의 「고치는 법」이 기계적으로 정해지는 규칙만
//   D1 읽기 결과에 쓰기: 쓰는 대상을 낸 읽기 호출(바로 부른 것·받은 지역 이름의 선언)을 같은 칸의 쓰기 접근으로 — progRead→progSlot, gameRead→gameSlot,
//      return gameRead('칸')·progRead('칸')만 하는 읽기 함수 → 그 칸의 쓰기 접근, 읽기 함수가 제 주석에 「바꿀 때는 X」·「고칠 때는 X」로 적은 쓰기 함수 → X(같은 인자).
//      둘 다 아닌 읽기 함수는 손으로(목록만)
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadUnits, walk } from './lib/source.mjs';
import { buildGraph, unused, unusedVars } from './lib/graph.mjs';
import { actions, mutations } from './lib/flow.mjs';
import { freshReaderWrites } from './lib/extra.mjs';

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
// D1: 읽기 → 같은 칸의 쓰기 접근(인자 그대로). 칸 하나를 읽기만 하는 함수는 그 칸으로
const SLOT_W = { progRead: 'progSlot', gameRead: 'gameSlot' };
/* 읽기 함수가 제 주석에 적은 쓰기 접근(「바꿀 때는 X」·「고칠 때는 X(…)」 — 함수 바로 앞 주석이나 같은 줄 뒤 주석): 소스가 짝을 정함 */
/* 같은 줄 뒤 주석은 tree-sitter가 본문 블록의 닫는 } 뒤 자식으로 붙임 */
const afterClose = b => { const close = (b?.children || []).find(c => c.type === '}'); return close ? b.children.filter(c => c.type === 'comment' && c.startIndex > close.startIndex).map(c => c.text) : []; };
function declaredWriter(f) { let root = f.node; while (root.parent) root = root.parent; const src = root.text, eol = src.indexOf('\n', f.node.endIndex), before = f.node.previousNamedSibling;
  const notes = [src.slice(f.node.endIndex, eol < 0 ? undefined : eol), before?.type === 'comment' && before.endPosition.row === f.node.startPosition.row - 1 ? before.text : '', ...afterClose(f.node.childForFieldName('body'))];
  for (const t of notes) { const m = /(?:바꿀|고칠) 때는 ([A-Za-z_$][\w$]*)(\([^)]*\))?/.exec(t); if (m) return a => m[2] && m[2] !== '()' ? m[1] + m[2] : m[1] + a; } return null; }
export function writerOf(fns, name) { if (SLOT_W[name]) return a => `${SLOT_W[name]}${a}`; const f = [...fns.values()].find(x => x.top && x.name === name); if (!f) return null; const dw = declaredWriter(f); if (dw) return dw;
  let r = null, n = 0; walk(f.node, x => { if (x !== f.node && /function|arrow/.test(x.type)) return false; if (x.type === 'return_statement') { n++; r = x.namedChildren[0]; } });
  const fn = r?.type === 'call_expression' ? r.childForFieldName('function')?.text : null, as = r?.childForFieldName('arguments'); if (n !== 1 || !SLOT_W[fn] || as?.namedChildren.length !== 1 || as.namedChildren[0].type !== 'string') return null;
  const w = `${SLOT_W[fn]}${as.text}`; return () => w; }
async function ruleD1() { const units = await loadUnits(ROOT), { fns } = buildGraph(units), W = freshReaderWrites(units, fns, mutations(units, fns).mut);
  /* 단위(main·모듈 블록)마다 파일 글의 시작 자리 — 단위 글 = 파일 글을 이은 것 */
  const byUnit = new Map(units.map(u => { let off = 0; return [u.name, u.files.map(f => { const text = readFileSync(join(ROOT, f.path), 'utf8'), r = { path: f.path, start: off, text, subs: new Map() }; off += text.length; return r; })]; })), files = [...byUnit.values()].flat(), hand = [];
  for (const w of W) { const c = w.call, mk = writerOf(fns, w.fn), f = (byUnit.get(c.unit) || []).findLast(x => x.start <= c.start); if (!mk || !f) { hand.push(w); continue; }
    const args = c.text.slice(w.fn.length); f.subs.set(c.start - f.start, { a: c.start - f.start, b: c.end - f.start, to: mk(args), from: c.text, at: c.at }); }
  const subs = files.flatMap(f => [...f.subs.values()].map(x => ({ ...x, f })));
  subs.forEach(x => console.log(`  ${x.at}  ${x.from} → ${x.to}`)); hand.forEach(w => console.log(`  손으로: ${w.loc} ${w.fn}() — ${w.text}`));
  if (APPLY) for (const f of files) { if (!f.subs.size) continue; let t = f.text; [...f.subs.values()].sort((x, y) => y.a - x.a).forEach(x => { t = t.slice(0, x.a) + x.to + t.slice(x.b); }); writeFileSync(join(ROOT, f.path), t); }
  console.log(APPLY ? `D1: ${subs.length}곳을 쓰기 접근으로 바꿨어요(손으로 ${hand.length}). node build/build.mjs 후 node tools/check.mjs --strict` : `D1 미리 보기: ${subs.length}곳 · 손으로 ${hand.length}. 바꾸려면 --apply`); }
const RULE = process.argv.includes('--rule') ? process.argv[process.argv.indexOf('--rule') + 1] : null, MAIN = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url) /* 시험이 불러올 때는 돌지 않음 */;
if (MAIN && RULE && RULE !== 'D1') { console.log(`기계적으로 고치는 규칙: D1 (받은 것: ${RULE})`); process.exit(1); }
if (MAIN && RULE) { await ruleD1(); process.exit(0); }
let total = 0;
for (let round = 1; MAIN && round <= 8; round++) {
  const { cuts, skip, files } = await pass(); if (round === 1 && skip.length) skip.forEach(s => console.log('  건너뜀:', s));
  if (!cuts.length) break; console.log(`${round}회차: ${cuts.length}개`); cuts.forEach(c => console.log('  -', c.what, '·', c.f.path)); total += cuts.length; if (!APPLY) break;
  const byFile = new Map(); cuts.forEach(c => { if (!byFile.has(c.f)) byFile.set(c.f, []); byFile.get(c.f).push(c); });
  for (const [f, cs] of byFile) { let t = f.text; cs.sort((x, y) => y.a - x.a).forEach(c => { t = t.slice(0, c.a) + t.slice(c.b); }); writeFileSync(join(ROOT, f.path), t); }
  const acts = cuts.filter(c => c.act).map(c => c.act); if (acts.length) { const dp = join(ROOT, 'src/main/0510-actions/130-dispatch.js'); let d = readFileSync(dp, 'utf8'); acts.forEach(a => { d = d.replace(new RegExp(`"${a}":handle\\w+Action,?`), ''); }); writeFileSync(dp, d.replace(/,\}\);/, '});')); }
}
if (MAIN) console.log(APPLY ? `지웠어요: ${total}개. node build/build.mjs 후 테스트를 돌리세요.` : `미리 보기(${total}개). 지우려면 --apply`);
