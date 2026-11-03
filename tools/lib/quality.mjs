// 코드 품질(ast-grep 패턴 + tree-sitter): 파싱 오류, 같은 본문 함수(불필요한 다중화), 되풀이되는 긴 문자열(파편화된 프롬프트·문구),
// 문서 전역 클릭 리스너(파편화된 처리기), 빈 catch, 복잡한 함수 (esc() 없이 HTML에 넣는 값은 extra.mjs의 htmlInject — 모든 HTML 템플릿)
import { walk } from './source.mjs';
import { createHash } from 'node:crypto';

export function parseErrors(units) { const out = []; for (const u of units) walk(u.tree.rootNode, n => { if (n.type === 'ERROR' || n.isMissing) { out.push({ loc: u.loc(n), text: n.text.slice(0, 60) }); return false; } }); return out; }
const norm = s => s.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, '');
export function dupBodies(fns, min = 160) { const g = new Map(); for (const f of fns.values()) { const b = f.node.childForFieldName('body'); if (!b) continue; const s = norm(b.text); if (s.length < min) continue; const h = createHash('md5').update(s).digest('hex'); if (!g.has(h)) g.set(h, []); g.get(h).push(f); } return [...g.values()].filter(x => x.length > 1).map(x => ({ n: norm(x[0].node.childForFieldName('body').text).length, fns: x.map(f => `${f.name} (${f.loc})`) })).sort((a, b) => b.n - a.n); }
export function repeatedStrings(units, min = 60, times = 3) { const g = new Map(); for (const u of units) walk(u.tree.rootNode, n => { if (n.type !== 'string' && n.type !== 'string_fragment') return; if (n.type === 'string_fragment' && n.parent?.type === 'string') return; const s = n.text.replace(/^['"]|['"]$/g, '').trim(); if (s.length < min) return; if (!g.has(s)) g.set(s, []); g.get(s).push(u.loc(n)); }); return [...g.entries()].filter(([, v]) => v.length >= times).map(([s, v]) => ({ text: s.slice(0, 70), n: v.length, at: v.slice(0, 4) })).sort((a, b) => b.n - a.n); }
export function sgRules(units) { const R = { listeners: [], emptyCatch: [] };
  for (const u of units) { const sg = u.sg, at = n => { const p = u.at(n.range().start.line); return `${p.file}:${p.line}`; };
    for (const n of sg.findAll("document.addEventListener('click', $$$)")) R.listeners.push(at(n));
    for (const n of [...sg.findAll('try { $$$ } catch ($E) {}'), ...sg.findAll('try { $$$ } catch {}')]) { const t = n.text().replace(/catch[\s\S]*$/, ''), cb = n.text().slice(n.text().lastIndexOf('catch')); R.emptyCatch.push({ loc: at(n), cat: /\/\*|\/\//.test(cb) ? '의도 표시' : /JSON\.parse/.test(t) ? '파싱 대체' : /appStorage|localStorage|sessionStorage|idb|indexedDB/.test(t) ? '저장소 대체' : /\bawait\b|fetch\(|aiJSON|http\(/.test(t) ? '비동기 작업' : '동기 대체' }); } }
  return R; }
export function complexFns(fns, cc = 40, lines = 120) { return [...fns.values()].filter(f => !f.cases && (f.cc >= cc || f.lines >= lines || f.depth >= 7)).sort((a, b) => b.cc - a.cc); }
// 분배기의 case 중 복잡한 것(case 하나가 함수 하나만큼 커지면 따로 빼는 게 좋음)
export function complexCases(fns, cc = 20) { return [...fns.values()].filter(f => f.cases).flatMap(f => f.cases.map(c => ({ ...c, fn: f.name }))).filter(c => c.cc >= cc || c.depth >= 5).sort((a, b) => b.cc - a.cc); }
