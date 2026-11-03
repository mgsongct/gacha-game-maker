#!/usr/bin/env node
// 스튜디오 밖 지시문을 프롬프트 스튜디오 조각으로 옮기기(치환 도구). 원칙: 프롬프트는 스튜디오에 파편화되지 않게 한곳에 모아 두고 거기서 개선(CLAUDE.md §0-1).
//   node tools/prompts-move.mjs <목록.json> [--dry]
//   목록: {"group":"묶음 이름","items":[{"at":"src/main/x.js:줄","head":"지시문 글 머리(도구 보고서의 「…」)","id":"조각_ID","label":"스튜디오에 보일 이름"}]}
// 하는 일: 그 지시문 글(문자열·템플릿)을 원문 그대로 조각 기본값으로 옮기고, 템플릿의 ${식}은 이름 붙은 자리 {이름}으로 바꿔
//   호출 지점을 pf('조각_ID',{이름:식}) 으로 바꿈. 템플릿에 "JSON만 출력"(llmWrap·aiJSON이 찾는 표식)이 있으면 그 앞까지만 옮기고 표식·스키마는 둠.
//   조각은 pfDef가 있는 파일(스튜디오) 「조각 모음」 끝에 묶음으로 넣음. 옮긴 뒤 보낸 프롬프트는 바이트 단위로 같아야 함(회귀 재생으로 확인).
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadUnits } from './lib/source.mjs';
import { inlinePrompts, fragmentFiles } from './lib/prompts.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..'), END = '/* ===== 조각 모음 끝';

// 템플릿 원문(백틱 안) 훑기: 맨 위 ${식} 목록과 위치 — 문자열·중첩 템플릿·중괄호를 건너뜀
function exprEnd(s, i) { let d = 0;
  for (;;) { const c = s[i];
    if (c === "'" || c === '"') { const q = c; i++; while (s[i] !== q) { if (s[i] === '\\') i++; i++; } }
    else if (c === '`') i = tmplEnd(s, i + 1);
    else if (c === '{') d++;
    else if (c === '}') { if (!d) return i; d--; }
    i++; } }
function tmplEnd(s, i) { for (;;) { const c = s[i]; if (c === '\\') { i += 2; continue; } if (c === '`') return i; if (s.startsWith('${', i)) { i = exprEnd(s, i + 2) + 1; continue; } i++; } }
export function topSubs(body) { const out = []; for (let i = 0; i < body.length;) { if (body[i] === '\\') { i += 2; continue; } if (body.startsWith('${', i)) { const e = exprEnd(body, i + 2); out.push({ from: i, to: e + 1, expr: body.slice(i + 2, e) }); i = e + 1; continue; } i++; } return out; }
// 자리 이름: T('x') → x, 이름 → 그대로, a.b → b, f(…) → f, 나머지 v1…(겹치면 뒤에 번호)
export function slotName(expr, used) { const t = expr.trim(); let n = (t.match(/^T\('(\w+)'\)$/) || [])[1] || (/^[A-Za-z_$][\w$]*$/.test(t) ? t : '') || (t.match(/\.([A-Za-z_$][\w$]*)$/) || [])[1] || (t.match(/^([A-Za-z_$][\w$]*)\(/) || [])[1] || 'v';
  n = n.replace(/\$/g, '') || 'v'; if (!/^[A-Za-z]/.test(n)) n = 'v' + n; let k = n, i = 2; while (used.has(k) && used.get(k) !== t) k = n + i++; used.set(k, t); return k; }
// 지시문 글(원문 리터럴) → { frag: 조각 글, call: 호출 지점 식, keep: 리터럴에 남길 꼬리(표식·스키마) }
export function moveLiteral(lit, id) { const q = lit[0];
  if (q !== '`') { const body = lit.slice(1, -1).replace(q === "'" ? /\\'/g : /\\"/g, q); return { frag: body, call: `pf('${id}')`, keep: null }; }
  const body = lit.slice(1, -1), subs = topSubs(body), mk = (() => { let i = -1; for (let p = body.indexOf('JSON만 출력'); p >= 0; p = body.indexOf('JSON만 출력', p + 1)) if (!subs.some(x => p >= x.from && p < x.to)) i = p; return i; })();
  let cut = mk < 0 ? body.length : mk; while (cut > 0 && body.slice(cut - 2, cut) === '\\n') cut -= 2;
  const head = body.slice(0, cut), used = new Map(); let frag = '', last = 0; const vars = [];
  for (const x of subs.filter(x => x.to <= cut)) { const nm = slotName(x.expr, used); frag += head.slice(last, x.from) + '{' + nm + '}'; last = x.to; if (!vars.some(v => v[0] === nm)) vars.push([nm, x.expr.trim()]); }
  frag += head.slice(last);
  const call = `pf('${id}'${vars.length ? ',{' + vars.map(([n, e]) => n === e ? n : `${n}:${e}`).join(',') + '}' : ''})`;
  return { frag, call, keep: mk < 0 ? null : body.slice(cut), vars: vars.map(v => v[0]) }; }
const pfLine = (id, label, frag, vars) => `pfDef('${id}','${label.replace(/'/g, "\\'")}',()=>\`${frag}\`${vars && vars.length ? `,'자리: ${vars.map(v => '{' + v + '}').join(' ')}'` : ''});`;

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const spec = JSON.parse(readFileSync(resolve(process.argv[2]), 'utf8')), dry = process.argv.includes('--dry'), units = await loadUnits(ROOT), rows = inlinePrompts(units, { nodes: true }), home = fragmentFiles(units).home;
  const files = new Map(), read = f => { if (!files.has(f)) files.set(f, readFileSync(join(ROOT, f), 'utf8')); return files.get(f); }, lines = [];
  const found = spec.items.map(it => ({ it, r: rows.find(x => x.loc === it.at && x.head.startsWith(it.head)) })).sort((a, b) => (b.r?.text.length || 0) - (a.r?.text.length || 0)); // 바깥 글(긴 것)부터 — 안쪽 글은 바깥을 옮긴 뒤에도 호출 지점 식에 그대로 남음
  for (const { it, r } of found) { const [file] = it.at.split(':');
    if (!r) { console.log(`없음: ${it.at} 「${it.head}」 — 도구 보고서의 위치·머리를 확인하세요`); process.exitCode = 1; continue; }
    const src = read(file), at = src.indexOf(r.text); if (at < 0 || src.indexOf(r.text, at + 1) >= 0) { console.log(`원문을 하나로 찾지 못함: ${it.at} 「${it.head}」`); process.exitCode = 1; continue; }
    const m = moveLiteral(r.text, it.id), rep = m.keep != null ? '`${' + m.call + '}' + m.keep + '`' : m.call;
    files.set(file, src.slice(0, at) + rep + src.slice(at + r.text.length)); lines.push(pfLine(it.id, it.label, m.frag, m.vars));
    console.log(`${it.id} ← ${it.at} 「${it.head}」${m.vars && m.vars.length ? ' 자리 ' + m.vars.join(' ') : ''}`); }
  if (!lines.length) process.exit(process.exitCode || 1);
  const st = read(home).split('\n'), k = st.findIndex(l => l.startsWith(END)); if (k < 0) { console.log(`스튜디오(${home})에 조각 모음 끝 표식(${END}…)이 없어요`); process.exit(1); } // 여러 줄 조각이 있어 줄 머리로는 끝을 못 찾음 — 표식 앞에 넣음
  files.set(home, [...st.slice(0, k), `// ── ${spec.group}`, ...lines, ...st.slice(k)].join('\n'));
  if (dry) { console.log(`(미리보기) 조각 ${lines.length}개 → ${home}`); process.exit(0); }
  for (const [f, t] of files) writeFileSync(join(ROOT, f), t); console.log(`조각 ${lines.length}개를 ${home}의 「${spec.group}」 묶음으로 옮김 — 빌드·테스트·회귀 재생(보낸 프롬프트 동일)으로 확인하세요`);
}
