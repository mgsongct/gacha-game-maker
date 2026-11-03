// 코드 품질(ast-grep 패턴 + tree-sitter): 파싱 오류, 같은 본문 함수(불필요한 다중화), 되풀이되는 긴 문자열(파편화된 프롬프트·문구),
// 문서 전역 클릭 리스너(파편화된 처리기), 빈 catch, esc() 없이 innerHTML에 넣는 값, 복잡한 함수
import { walk } from './source.mjs';
import { createHash } from 'node:crypto';

export function parseErrors(units) { const out = []; for (const u of units) walk(u.tree.rootNode, n => { if (n.type === 'ERROR' || n.isMissing) { out.push({ loc: u.loc(n), text: n.text.slice(0, 60) }); return false; } }); return out; }
const norm = s => s.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, '');
export function dupBodies(fns, min = 160) { const g = new Map(); for (const f of fns.values()) { const b = f.node.childForFieldName('body'); if (!b) continue; const s = norm(b.text); if (s.length < min) continue; const h = createHash('md5').update(s).digest('hex'); if (!g.has(h)) g.set(h, []); g.get(h).push(f); } return [...g.values()].filter(x => x.length > 1).map(x => ({ n: norm(x[0].node.childForFieldName('body').text).length, fns: x.map(f => `${f.name} (${f.loc})`) })).sort((a, b) => b.n - a.n); }
export function repeatedStrings(units, min = 60, times = 3) { const g = new Map(); for (const u of units) walk(u.tree.rootNode, n => { if (n.type !== 'string' && n.type !== 'string_fragment') return; if (n.type === 'string_fragment' && n.parent?.type === 'string') return; const s = n.text.replace(/^['"]|['"]$/g, '').trim(); if (s.length < min) return; if (!g.has(s)) g.set(s, []); g.get(s).push(u.loc(n)); }); return [...g.entries()].filter(([, v]) => v.length >= times).map(([s, v]) => ({ text: s.slice(0, 70), n: v.length, at: v.slice(0, 4) })).sort((a, b) => b.n - a.n); }
export function sgRules(units) { const R = { listeners: [], emptyCatch: [], rawHTML: [] };
  for (const u of units) { const sg = u.sg, at = n => { const p = u.at(n.range().start.line); return `${p.file}:${p.line}`; };
    for (const n of sg.findAll("document.addEventListener('click', $$$)")) R.listeners.push(at(n));
    for (const n of sg.findAll('try { $$$ } catch ($E) {}')) R.emptyCatch.push(at(n));
    for (const n of sg.findAll('$EL.innerHTML = $V')) { const v = n.getMatch('V'); if (!v || v.kind() !== 'template_string') continue; const subs = v.findAll({ rule: { kind: 'template_substitution' } }).map(s => s.text()); const raw = subs.filter(s => /^\$\{\s*[A-Za-z_$][\w$.]*(\.(name|text|title|desc|msg))\s*\}$/.test(s)); if (raw.length) R.rawHTML.push({ loc: at(n), subs: raw.slice(0, 3) }); } }
  return R; }
export function complexFns(fns, cc = 40, lines = 120) { return [...fns.values()].filter(f => f.cc >= cc || f.lines >= lines || f.depth >= 7).sort((a, b) => b.cc - a.cc); }
