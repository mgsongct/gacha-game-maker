// index.html 기능 표면: 산출물(www/index.html)이 사용자에게 보여 주고 수행하는 기능을 코드에서 뽑아 추상화하고(메뉴 → 화면 → 동작 + 배경 단계),
//   함수마다 어느 기능에서 닿는지 잼. 지금 모듈 구조(원안 index.html 한 파일을 고려 없이 나눈 것)는 기준으로 쓰지 않음 — 모듈은 이 분류에 대어 보는 대상.
//   메뉴   — 아래 탭(src/index.html의 .tab data-tab · <b> 이름)
//   화면   — 화면 경로표(render 안 { 경로: 화면 함수 } 표)와 경로 → 탭 표, 경로 화면 안의 하위 화면(설정의 [키, 이름 …] 목록 + { 키: 내용 } 표)
//   동작   — 화면 함수가 내보내는 data-act → 처리기(handle*Action의 case · 리스너의 a==='x') → 그 동작이 부르는 함수 … (닿는 데까지)
//   배경   — 사용자가 누르지 않아도 index.html이 하는 일: 새 게임 생성·실행 중 AI·불러오기(lib/lifecycle.mjs STAGES)·앱 시작(최상위 문장·load 리스너)
//   공용 기반(부르는 함수가 많은 허브 함수 — 여러 기능이 같이 씀)은 건너뜀: 거기서 모든 기능이 이어져 버림
import { walk } from './source.mjs';
import { STAGES } from './lifecycle.mjs';
import { constLiterals } from './wiring.mjs';
import { moduleOf } from './scope.mjs';

const FNT = /^(function_declaration|function_expression|arrow_function|method_definition|generator_function_declaration)$/;
const HUB = 25; // 이만큼 많은 함수가 부르면 공용 기반
const SLACK = 0; // 가장 가까운 기능보다 이만큼 더 먼 기능까지 함께 쓰는 것으로 봄
const str = n => n && (n.type === 'string' ? n.text.slice(1, -1) : n.type === 'template_string' && !/\$\{/.test(n.text) ? n.text.slice(1, -1) : null);
// 이름표: '문자열' · T('키') → 기본 용어(DEFAULT_META.terms) · 그 밖은 없음
let TERMS = {};
const label = n => str(n) ?? (n?.type === 'call_expression' && n.childForFieldName('function')?.text === 'T' ? (k => TERMS[k] || k)(str(n.childForFieldName('arguments')?.namedChild(0))) : null);
const ACT = /data-act=\\?["']([a-z0-9_-]+)\\?["']|data-act=\\?"\$\{([^}]{1,200})\}/gi;
function actsIn(text) { const out = new Set(); for (const m of String(text).matchAll(ACT)) { if (m[1]) out.add(m[1]); else for (const s of m[2].matchAll(/'([a-z0-9_-]+)'/gi)) out.add(s[1]); } return out; }

// 최상위 함수(main) 이름 → 키, 함수마다 참조하는 최상위 함수(호출 + 이름으로 넘김 — 경로표·콜백).
//   함수를 감싼 최상위 상수(const contractHTML = noSkin(contractHTML0))는 그 이름을 가리키면 감싼 함수를 가리키는 것으로 봄
function refsOf(units, fns) { const top = new Map([...fns.values()].filter(f => f.top && !f.table && f.unit === 'main').map(f => [f.name, f.key])), out = new Map();
  for (const u of units) { if (u.name !== 'main') continue; for (const st of u.tree.rootNode.namedChildren) { if (!/^(lexical|variable)_declaration$/.test(st.type)) continue;
    for (const d of st.namedChildren) { const nm = d.childForFieldName?.('name')?.text, v = d.childForFieldName?.('value'); if (!nm || !v || FNT.test(v.type) || top.has(nm) || v.type !== 'call_expression') continue; const ks = new Set(); walk(v.childForFieldName('arguments'), x => { if (FNT.test(x.type)) return false; if (x.type === 'identifier' && top.has(x.text)) ks.add(top.get(x.text)); }); if (ks.size === 1) top.set(nm, [...ks][0]); } } }
  for (const f of fns.values()) { if (!f.top || f.table) continue; const s = new Set(f.calls.keys()); walk(f.node, n => { if (n.type === 'identifier' && top.has(n.text) && top.get(n.text) !== f.key) s.add(top.get(n.text)); }); out.set(f.key, s); }
  return { top, out }; }
// 동작 처리: data-act 값 → 처리 코드가 부르는·가리키는 최상위 함수(handle*Action의 case 본문, 리스너의 if(a==='x') 본문)
function handlers(units, top) { const out = new Map(), add = (a, node) => { if (!out.has(a)) out.set(a, new Set()); const s = out.get(a); walk(node, n => { if (n.type === 'identifier' && top.has(n.text)) s.add(top.get(n.text)); }); };
  for (const u of units) walk(u.tree.rootNode, n => {
    if (n.type === 'switch_case') { const v = str(n.childForFieldName('value')); if (!v || !/^[a-z0-9_-]+$/i.test(v)) return; let sw = n.parent; while (sw && sw.type !== 'switch_statement') sw = sw.parent; const on = sw?.childForFieldName('value')?.text || ''; if (/\b(a|act)\b|dataset\.act/.test(on)) n.namedChildren.slice(1).forEach(c => add(v, c)); }
    else if (n.type === 'if_statement') { const c = n.childForFieldName('condition')?.text || ''; const m = /^\(\s*(?:a|act|\w+\.dataset\.act)\s*===?\s*['"]([a-z0-9_-]+)['"]\s*\)$/.exec(c); if (m) add(m[1], n.childForFieldName('consequence')); } });
  return out; }

// 표면 뽑기: html = src/index.html 글. 기능 = index.html이 보여 주는 단위
//   화면(탭 경로·설정 하위 화면) · 패널(설정 하위 화면 안의 <div class="panel"><h3>…</h3> 덩어리, xxxPanel() 함수) · 창(openModal을 여는 함수) · 배경 단계
//   기능 단위: 화면·패널·배경은 그 자체, 창은 여는 쪽이 한 단위뿐이면 그 단위 안(그 화면의 창), 여러 단위가 열면 공용 창
//   단계마다 함수 하나(C = 함께 쓰는 문맥: 최상위 함수 이름표·참조·처리기·기능 표)
export function surfaceOf(units, fns, html) { TERMS = (constLiterals(units, ['DEFAULT_META']).DEFAULT_META || {}).terms || {};
  const { top, out: refs } = refsOf(units, fns), feats = new Map(), C = { units, fns, top, refs, feats, H: handlers(units, top), hub: new Set([...fns.values()].filter(f => f.top && f.callers.size >= HUB).map(f => f.key)),
    tabs: [...String(html).matchAll(/<button class="tab[^"]*" data-tab="(\w+)">[\s\S]*?<b[^>]*>([^<]+)<\/b>/g)].map(m => ({ key: m[1], label: m[2] })),
    Fe: (key, o) => { if (!feats.has(key)) feats.set(key, { key, label: key, kind: 'screen', menu: null, parent: null, roots: new Set(), acts: new Set(), ...o }); return feats.get(key); },
    take: (f, node, skip = new Set()) => { walk(node, x => { if (x.type === 'identifier' && top.has(x.text) && !skip.has(top.get(x.text))) f.roots.add(top.get(x.text)); }); actsIn(node.text).forEach(a => f.acts.add(a)); } };
  screens(C); const isWin = windows(C); for (const s0 of [...feats.values()].filter(f => f.kind === 'screen')) subScreens(C, s0, isWin); background(C);
  const best = distances(C), { any, reach } = unitsOf(C, best); return { tabs: C.tabs, feats, reach, any, hub: C.hub }; }
// 화면: 경로표 { 경로: 화면 함수 }(키에 탭이 절반 이상) · 경로 → 탭 표 { 경로: '탭' } · 이름은 화면 함수의 pageHead('이름')
function screens(C) { const tabKeys = new Set(C.tabs.map(t => t.key));
  for (const u of C.units) walk(u.tree.rootNode, n => { if (n.type !== 'object') return; const pairs = n.namedChildren.filter(p => p.type === 'pair'); if (pairs.length < 4) return;
    const keys = pairs.map(p => p.childForFieldName('key')?.text.replace(/^['"]|['"]$/g, '')), vals = pairs.map(p => p.childForFieldName('value'));
    if (!keys.every(k => /^[A-Za-z_]\w*$/.test(k || ''))) return; /* 숫자 키 표(단축키 등)는 경로표가 아님 */
    if (keys.filter(k => tabKeys.has(k)).length * 2 >= tabKeys.size && vals.every(v => v.type === 'identifier' || FNT.test(v.type))) pairs.forEach((p, i) => C.take(C.Fe(keys[i]), vals[i]));
    else if (vals.every(v => tabKeys.has(str(v)))) pairs.forEach((p, i) => { C.Fe(keys[i]).menu = str(vals[i]); }); });
  for (const f of C.feats.values()) { if (!f.menu) f.menu = tabKeys.has(f.key) ? f.key : null;
    for (const r of f.roots) walk(C.fns.get(r).node, n => { if (f.label !== f.key || n.type !== 'call_expression' || n.childForFieldName('function')?.text !== 'pageHead') return; const l = label(n.childForFieldName('arguments')?.namedChild(0)); if (l) f.label = l; }); }
  for (const t of C.tabs) if (C.feats.has(t.key) && C.feats.get(t.key).label === t.key) C.feats.get(t.key).label = t.label; }
// 창: openModal을 바로 부르는 함수(화면 함수·액션 분배기는 빼고) — 이름은 head('이름')가 하나면 그것, 아니면 <h3> 또는 함수 이름
function windows(C) { const screenRoot = new Set([...C.feats.values()].flatMap(f => [...f.roots])), isWin = new Set();
  for (const f of C.fns.values()) { if (!f.top || f.table || f.unit !== 'main' || screenRoot.has(f.key) || /^handle\w+Action$/.test(f.name)) continue; let opens = false; const heads = new Set();
    walk(f.node, n => { if (n.type !== 'call_expression') return; const c = n.childForFieldName('function')?.text; if (c === 'openModal') opens = true; else if (c === 'head') { const l = label(n.childForFieldName('arguments')?.namedChild(0)); if (l) heads.add(l); } });
    if (!opens) continue; isWin.add(f.key); C.Fe('창:' + f.key, { kind: 'window', label: (heads.size === 1 ? [...heads][0] : null) || (/<h3[^>]*>([^<$]+)/.exec(f.node.text) || [])[1] || f.name }).roots.add(f.key); }
  return isWin; }
// 하위 화면: 화면 함수 안의 [[키, 이름, …], …] 목록과 { 키: 내용 } 표 → 경로.키, 그 안의 패널 → 경로.키.n
function subScreens(C, s0, isWin) { for (const r of s0.roots) { const node = C.fns.get(r).node, list = new Map(); let table = null;
  walk(node, n => { if (n.type === 'array' && n.namedChildren.length >= 3 && n.namedChildren.every(e => e.type === 'array' && str(e.namedChild(0)))) n.namedChildren.forEach(e => list.set(str(e.namedChild(0)), label(e.namedChild(1)) || str(e.namedChild(0)))); });
  if (list.size) walk(node, n => { if (n.type !== 'object' || table) return; const ks = n.namedChildren.filter(p => p.type === 'pair').map(p => p.childForFieldName('key')?.text); if (ks.length >= 3 && ks.filter(k => list.has(k)).length * 2 >= ks.length) table = n; });
  if (!table) continue; s0.subs = true; s0.roots = new Set([r]);
  for (const p of table.namedChildren.filter(p => p.type === 'pair')) { const k = p.childForFieldName('key').text; panels(C, C.Fe(`${s0.key}.${k}`, { label: list.get(k) || k, menu: s0.menu, parent: s0.key }), p.childForFieldName('value'), r, isWin); } } }
// 하위 화면 내용 → 패널: 패널 함수 호출(${xxxPanel()})과 글 속 <div class="panel"> 덩어리(둘 이상일 때) — 아니면 하위 화면 하나
function panels(C, sub, v, r, isWin) { const isPanelFn = k => !isWin.has(k) && /class="panel/.test(C.fns.get(k)?.node.text || ''), claimed = new Set([r]); let rest = v.text, n = 0;
  walk(v, x => { if (x.type !== 'template_substitution') return; const c = x.namedChildren[0], k2 = c?.type === 'call_expression' && c.childForFieldName('function')?.type === 'identifier' ? C.top.get(c.childForFieldName('function').text) : null;
    if (k2 && isPanelFn(k2)) { C.Fe(`${sub.key}.${++n}`, { kind: 'panel', label: (/<h3[^>]*>([^<$]+)/.exec(C.fns.get(k2).node.text) || [])[1]?.trim() || C.fns.get(k2).name, menu: sub.menu, parent: sub.key }).roots.add(k2); claimed.add(k2); rest = rest.replace(x.text, ''); } return false; });
  const chunks = rest.split(/<div class="panel[^"]*">/); if (chunks.length <= 2) { C.take(sub, v, claimed); return; }
  for (const ch of chunks.slice(1)) { const pn = C.Fe(`${sub.key}.${++n}`, { kind: 'panel', label: ((/<h3[^>]*>([^<]+)/.exec(ch) || [])[1] || '').replace(/\$\{.*$/, '').trim() || `패널 ${n}`, menu: sub.menu, parent: sub.key });
    for (const m of ch.matchAll(/\b([A-Za-z_$][\w$]*)\s*\(/g)) if (C.top.has(m[1])) pn.roots.add(C.top.get(m[1])); actsIn(ch).forEach(a => pn.acts.add(a)); } }
// 배경 단계: 사용자가 누르지 않아도 하는 일 — 새 게임 생성·실행 중 AI·불러오기(lifecycle STAGES) + 앱 시작(불러올 때 바로 도는 최상위 문장의 호출 — 함수 안 콜백·리스너는 그때 돌지 않으니 뺌)
function background(C) { const bg = { '새 게임 생성': STAGES.생성, '실행 중 AI': STAGES['실행 중 AI'], 불러오기: STAGES.불러오기 };
  for (const [k, names] of Object.entries(bg)) { const f = C.Fe('배경.' + k, { kind: 'background', label: k, menu: '배경' }); names.forEach(n => C.top.has(n) && f.roots.add(C.top.get(n))); }
  const f = C.Fe('배경.앱 시작', { kind: 'background', label: '앱 시작', menu: '배경' }); for (const u of C.units) { if (u.name !== 'main') continue;
    for (const st of u.tree.rootNode.namedChildren) walk(st, x => { if (FNT.test(x.type)) return false; const c = x.type === 'call_expression' ? x.childForFieldName('function') : null; if (c?.type === 'identifier' && C.top.has(c.text)) f.roots.add(C.top.get(c.text)); }); } }
// 닿기(거리): 기능 → 함수(참조) → 함수가 내보내는 동작 → 처리기가 가리키는 함수 … 다른 기능의 시작 함수(창·패널·화면)에 닿으면 거기서 멈추고 "연다"로 적음.
//   'go'(화면 이동)·닫기·설정 탭은 다른 화면으로 가는 길이라 따라가지 않음. 함수마다 가장 가까운 거리와 그 기능들(best)
function distances(C) { const actOf = new Map(), rootOf = new Map(), NAV = new Set(['go', 'close', 'sttab']), best = new Map();
  for (const f of C.fns.values()) if (f.top && !f.table && f.unit === 'main') actOf.set(f.key, actsIn(f.node.text));
  for (const f of C.feats.values()) if (f.kind !== 'screen' || !f.subs) for (const r of f.roots) { if (!rootOf.has(r)) rootOf.set(r, new Set()); rootOf.get(r).add(f.key); }
  for (const f of C.feats.values()) { const dist = new Map(), acts = new Set(), opens = new Set(); let layer = [...f.roots].filter(k => !C.hub.has(k)), d = 0;
    const viaActs = as => { const o = []; for (const a of as) if (!NAV.has(a) && !acts.has(a)) { acts.add(a); for (const k of C.H.get(a) || []) if (!C.hub.has(k)) o.push(k); } return o; };
    layer.push(...viaActs(f.acts));
    while (layer.length) { const next = []; for (const k of layer) { if (dist.has(k)) continue; const other = [...(rootOf.get(k) || [])].filter(x => x !== f.key && !f.roots.has(k)); if (other.length) { other.forEach(x => opens.add(x)); continue; }
      dist.set(k, d); for (const c of C.refs.get(k) || []) if (!C.hub.has(c) && !dist.has(c)) next.push(c); next.push(...viaActs(actOf.get(k) || [])); } layer = next; d++; }
    Object.assign(f, { dist, actsAll: acts, opens }); for (const [k, dk] of dist) { const b = best.get(k); if (!b || dk < b.d) best.set(k, { d: dk, set: new Set([f.key]) }); else if (dk === b.d) b.set.add(f.key); } }
  return best; }
// 기능 단위: 창은 여는 쪽 단위가 하나면 그 안, 여럿이면 공용 창(그 자체) · 함께 쓰는 단위(any): 가장 가까운 거리 + SLACK 안에서 닿는 단위 전부
//   (여러 기능이 같이 쓰는 엔진을 가장 가까운 한 기능 것으로 잘못 붙이지 않고, 멀리 돌아 닿는 우연한 연결로 공용이 되지도 않게)
function unitsOf(C, best) { const openers = new Map(), memo = new Map(); for (const f of C.feats.values()) for (const o of f.opens) { if (!openers.has(o)) openers.set(o, new Set()); openers.get(o).add(f.key); }
  const unitOf = (k, seen = new Set()) => { if (memo.has(k)) return memo.get(k); if (C.feats.get(k).kind !== 'window') return k; if (seen.has(k)) return null; seen.add(k);
    const us = new Set([...(openers.get(k) || [])].map(o => unitOf(o, seen)).filter(Boolean)), u = us.size === 1 ? [...us][0] : k; memo.set(k, u); return u; };
  for (const f of C.feats.values()) { f.unit = unitOf(f.key); if (f.kind !== 'window') continue; const ms = new Set([...(openers.get(f.key) || [])].map(o => C.feats.get(unitOf(o) || o)?.menu).filter(Boolean));
    f.menu = f.unit !== f.key ? C.feats.get(f.unit).menu : ms.size === 1 ? [...ms][0] : '공용'; f.openers = [...(openers.get(f.key) || [])]; }
  const reach = new Map(), any = new Map(); for (const [k, b] of best) reach.set(k, new Set([...b.set].map(x => C.feats.get(x).unit)));
  for (const f of C.feats.values()) for (const [k, dk] of f.dist) { if (dk > best.get(k).d + SLACK) continue; if (!any.has(k)) any.set(k, new Set()); any.get(k).add(f.unit); }
  return { reach, any }; }

// 함수 하나의 자리: 기능 단위 하나(그 단위에서만 닿음) · 한 메뉴의 여러 단위 · 여러 메뉴(엔진·공용 기능) · 공용 기반 · 닿지 않음
export function placeOf(sf, k) { const r = sf.any.get(k); if (!r || !r.size) return { kind: sf.hub.has(k) ? '공용 기반' : '닿지 않음' }; const menus = new Set([...r].map(x => sf.feats.get(x).menu)), near = [...(sf.reach.get(k) || [])];
  if (r.size === 1) return { kind: '단위', unit: [...r][0], menu: [...menus][0] }; if (menus.size === 1) return { kind: '메뉴', menu: [...menus][0], units: [...r], near }; return { kind: '여러 메뉴', menus: [...menus], units: [...r], near }; }

export function fullLabel(sf, k) { const f = sf.feats.get(k); if (!f) return k; const p = f.parent ? sf.feats.get(f.parent) : null; return (p ? fullLabel(sf, p.key) + ' › ' : f.kind === 'window' ? '창 ' : '') + f.label; }
// 함수 하나의 자리(모듈 판정용): 기능 단위 하나 · 메뉴 안 공용 · 공용(여러 메뉴 — 엔진) · 공용 기반 · 닿지 않음
export function unitPlace(sf, k) { const p = placeOf(sf, k); return p.kind === '단위' ? p.unit : p.kind === '메뉴' ? '메뉴:' + p.menu : p.kind === '여러 메뉴' ? '공용' : p.kind; }
// 맵에 넣을 요약(직렬화): 기능 단위(화면·패널·공용 창·배경)마다 메뉴·종류·그 단위에서만 닿는 함수 수·그 함수가 있는 모듈·안에 든 창 · 함수마다 자리
//   (모듈 판정은 계층·기능 축으로 lib/arch.mjs가 함 — 화면 단위만으로는 판정하지 않음)
export function surfaceMap(units, fns, sf) {
  const rows = [...fns.values()].filter(f => f.top && !f.table && f.unit === 'main').map(f => ({ mod: moduleOf(f.loc.split(':')[0]), fn: f.key, place: unitPlace(sf, f.key) })), byUnit = new Map();
  for (const r of rows) { if (sf.feats.has(r.place)) { if (!byUnit.has(r.place)) byUnit.set(r.place, new Map()); const m = byUnit.get(r.place); m.set(r.mod, (m.get(r.mod) || 0) + 1); } }
  const feats = {}; for (const f of sf.feats.values()) { if (f.unit !== f.key) continue; const m = byUnit.get(f.key) || new Map();
    feats[f.key] = { label: fullLabel(sf, f.key), kind: f.kind, menu: f.menu, n: [...m.values()].reduce((a, b) => a + b, 0), mods: [...m].sort((a, b) => b[1] - a[1]), windows: [...sf.feats.values()].filter(w => w.kind === 'window' && w.unit === f.key && w.key !== f.key).map(w => w.label) }; }
  return { tabs: sf.tabs, feats, place: Object.fromEntries(rows.map(r => [r.fn, r.place])) }; }
