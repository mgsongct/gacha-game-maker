// 아키텍처 계층(MVC — 사용자 지시: UI 렌더 담당과 처리 담당이 나뉘는 계층) 판정: 함수마다 그 함수 자신이 하는 일(직접 신호)로
//   View       — 화면을 만듦: HTML 마크업 글을 만들거나 DOM을 바꿈(innerHTML·classList·style·createElement·appendChild …)
//   Controller — 동작·이벤트를 받아 처리 흐름을 이음: 액션 처리기(handle*Action), 또는 화면 갱신(render·toast·openModal·closeModal)을 부르며 상태를 바꾸거나 바꾸는 함수를 부름
//   Model      — 상태·규칙·저장·외부 서비스: 게임 상태를 씀, 저장소·네트워크·AI·그림 서비스를 직접 씀, 또는 화면과 관계없는 계산·조회
//   섞임       — 한 함수가 화면을 만들면서 상태를 쓰거나 저장·외부 서비스를 직접 씀(View와 Model이 한 함수에)
// 방향 위반: View가 상태를 쓰는 함수를 부름(그리다가 상태를 바꿈 — 지연 생성 포함) · Model이 화면을 만드는 함수를 부름
import { walk } from './source.mjs';
import { constLiterals } from './wiring.mjs';
import { fullLabel } from './surface.mjs';
import { mutations } from './flow.mjs';

const MARKUP = /<\/?[a-zA-Z][\w-]*(\s|>|\/>)/;
const DOM_WRITE = /^(innerHTML|outerHTML|textContent|innerText|className|hidden|scrollTop|scrollLeft|disabled|checked|selectedIndex)$/, DOM_CALL = /^(appendChild|insertAdjacentHTML|insertBefore|replaceChildren|removeChild|remove|setAttribute|removeAttribute|toggleAttribute|scrollIntoView|focus|blur|showModal|animate|createTextNode)$/;
// 화면이 아닌 DOM 객체(그림 처리 canvas·이미지·소리·내려받기 링크·파일 고르기) — 만들어도 View가 아님
const NONUI_EL = /^['"`](canvas|img|audio|video|a|input|script|link|source)['"`]$/;
const STYLE = /^(classList|style|dataset)$/;
const TRIGGER = new Set(['render', 'renderView', 'toast', 'openModal', 'closeModal']); // 화면 갱신(render = 그리기 전 처리 + renderView)
// 저장·외부 서비스(직접 쓰면 Model): 읽기(저장소·IndexedDB 읽기) · 쓰기(저장소 쓰기·IndexedDB 쓰기·저장 표시) · 서비스(네트워크·글 AI·그림 AI — 부작용·비용)
const IO_READ = new Set(['idbGet', 'idbKeys', 'idbGetNS']), IO_WRITE = new Set(['idbPut', 'idbDel', 'storeImage', 'storeAudio', 'mark', 'markAll', 'flush']), SERVICE = new Set(['fetch', 'aiOne', 'aiCall', 'aiJSON', 'naiDraw', 'naiGenerate']);
const STORE = /^(appStorage|localStorage|sessionStorage)$/, STORE_W = /^(setItem|removeItem|clear|mediaWrite)$/;

// 함수마다 직접 신호: markup · dom(바꿈) · trigger(화면 갱신 호출) · write(게임 상태 씀 — writers) · read(저장소 읽기) · store(저장소 쓰기·저장 표시) · service(네트워크·AI) · handler
const propOf = m => m?.type === 'member_expression' ? m.childForFieldName('property')?.text || '' : '';
// 대입: DOM 속성 바꾸기(innerHTML·hidden …) 또는 el.style.x = … · el.classList… 
function assignSig(n, s) { const l = n.childForFieldName('left'); if (l?.type !== 'member_expression') return; if (DOM_WRITE.test(propOf(l)) || STYLE.test(propOf(l.childForFieldName('object')))) { s.dom = true; s.atV.push(n); } }
// 이름 호출: 화면 갱신·저장소·서비스 기본 함수
function nameSig(c, s) { if (TRIGGER.has(c.text)) s.trigger = true; if (IO_READ.has(c.text)) s.read = true; if (IO_WRITE.has(c.text)) { s.store = true; s.atM.push(c); } if (SERVICE.has(c.text)) { s.service = true; s.atM.push(c); } }
// 멤버 호출: DOM 바꾸기(화면이 아닌 canvas·이미지 등 만들기는 뺌) · el.classList.add … · 저장소 읽기/쓰기
function memberSig(n, c, s) { const p = propOf(c), o = c.childForFieldName('object'), arg = n.childForFieldName('arguments')?.namedChildren[0];
  const dom0 = s.dom; s.dom = false; if (p === 'createElement') { if (!NONUI_EL.test(arg?.text || '')) s.dom = true; } else if (DOM_CALL.test(p) && !/^(appStorage|localStorage|sessionStorage|Object|Array|JSON|Math|Promise|URL|Set|Map)$/.test(o?.text || '')) s.dom = true;
  if (STYLE.test(propOf(o)) && !/^(contains|item|getPropertyValue)$/.test(p)) s.dom = true; /* classList.contains 같은 읽기는 바꿈이 아님 */ if (s.dom) s.atV.push(n); s.dom = s.dom || dom0; if (STORE.test(o?.text || '')) { if (STORE_W.test(p)) { s.store = true; s.atM.push(n); } else s.read = true; } }
/* atV·atM: View·Model 신호가 난 자리(노드) — 섞인 함수를 나눌 때 어느 줄이 화면이고 어느 줄이 처리인지(archMap mix) */
function signals(f, writers) { const s = { markup: false, dom: false, trigger: false, write: writers.has(f.key), read: false, store: false, service: false, handler: /^handle\w+Action$/.test(f.name), atV: [], atM: [] };
  walk(f.node, n => { const t = n.type;
    if (t === 'string' || t === 'template_string' || t === 'string_fragment') { if (MARKUP.test(n.text)) { s.markup = true; s.atV.push(n); } }
    else if (t === 'assignment_expression' || t === 'augmented_assignment_expression') assignSig(n, s);
    else if (t === 'call_expression') { const c = n.childForFieldName('function'); if (c?.type === 'identifier') nameSig(c, s); else if (c?.type === 'member_expression') memberSig(n, c, s); } });
  return s; }
// 계층: 직접 신호로 정함(부르는 함수의 계층은 방향 위반에서만 봄)
function layerOf(s) { const view = s.markup || s.dom, model = s.write || s.store || s.service; /* 저장소 읽기만 하는 화면 함수는 View(따로 셈) */
  if (view && model) return '섞임'; if (view) return 'View'; if (s.handler || s.trigger) return 'Controller'; return 'Model'; }

// fns: buildGraph 함수 표 · writers: 게임 상태를 직접 쓰는 함수 키(lib/flow.mjs mutations + 연관 맵 data 쓰기)
export function layers(fns, writers) { const top = [...fns.values()].filter(f => f.top && !f.table), sig = new Map(top.map(f => [f.key, signals(f, writers)])), out = new Map();
  for (const f of top) { const s = sig.get(f.key); out.set(f.key, { layer: layerOf(s), ...s }); }
  /* 직접 신호 없이 View 함수만 부르고 상태·저장·서비스를 바꾸는 함수는 부르지 않으면 View(화면 조각을 엮는 함수 — 예: 칩 여럿을 chipOn으로 켬) — 더 바뀌지 않을 때까지 */
  const quiet = s => !(s.markup || s.dom || s.write || s.store || s.service || s.handler || s.trigger), changes = o => o && (o.write || o.store || o.service || o.layer === '섞임' || o.layer === 'Controller');
  for (let more = true; more;) { more = false; for (const f of top) { const me = out.get(f.key); if (me.layer !== 'Model' || !quiet(me)) continue; const cs = [...f.calls.keys()].map(k => out.get(k)).filter(Boolean);
    if (cs.some(o => o.layer === 'View') && !cs.some(changes)) { me.layer = 'View'; more = true; } } }
  /* 직접 신호 없이 상태를 바꾸는 함수와 View 함수를 함께 부르면 Controller(정산한 뒤 결과를 그리게 하는 흐름 — 예: 전투 끝 bEnd) */
  for (const f of top) { const me = out.get(f.key); if (me.layer !== 'Model' || !quiet(me)) continue; const cs = [...f.calls.keys()].map(k => out.get(k)).filter(Boolean);
    if (cs.some(o => o.layer === 'View') && cs.some(o => o.write || o.store || o.service)) me.layer = 'Controller'; }
  /* 방향 위반: View → 상태를 쓰거나 저장하는 함수(그리다가 바꿈) · Model → 화면을 만드는 함수 */
  const bad = []; for (const f of top) { const me = out.get(f.key); for (const k of f.calls.keys()) { const o = out.get(k); if (!o) continue;
    if (me.layer === 'View' && (o.write || o.store || o.service) && o.layer !== 'View' && !TRIGGER.has(fns.get(k)?.name)) bad.push({ fn: f.key, to: k, kind: 'View가 상태를 바꾸거나 저장·외부 서비스를 부르는 함수를 부름' }); /* 화면 갱신 통로(render 등)를 부르는 것은 갱신 요청이지 상태 변경이 아님 */
    else if (me.layer === 'Model' && (o.layer === 'View' || o.layer === '섞임') && !me.handler) bad.push({ fn: f.key, to: k, kind: 'Model이 화면을 만드는 함수를 부름' }); } }
  return { layer: out, bad }; }

// 브라우저 저장소 키를 쓰는 함수: appStorage·localStorage·sessionStorage의 getItem·setItem·removeItem 첫 인자(문자열 또는 상수 이름) → 'store:키'
export function storeKeys(fns, consts = new Map()) { const out = new Map();
  for (const f of fns.values()) { if (!f.top || f.table) continue; walk(f.node, n => { if (n.type !== 'call_expression') return; const c = n.childForFieldName('function'); if (c?.type !== 'member_expression' || !STORE.test(c.childForFieldName('object')?.text || '') || !/^(getItem|setItem|removeItem)$/.test(c.childForFieldName('property')?.text || '')) return;
    const a = n.childForFieldName('arguments')?.namedChildren[0]; if (!a) return; const k = a.type === 'string' ? a.text.slice(1, -1) : a.type === 'identifier' ? consts.get(a.text) || a.text : null; if (!k) return; if (!out.has(f.key)) out.set(f.key, new Map()); out.get(f.key).set('store:' + k, STORE_W.test(c.childForFieldName('property').text) ? 'w' : 'r'); }); }
  return out; }

// 기능(Model·Controller 쪽): 화면이 아니라 같은 데이터와 처리로 묶음 — Model·Controller 함수만으로 그래프(호출 + 같은 상태 키·저장소 키를 쓰는 사이)를 만들어
//   모듈성 최대화(Louvain, 순서를 바꿔 SEEDS+1번 — 과반이 같은 묶음인 것만)로 묶음. 키는 가상 노드(아래). View 함수와 화면·창은 이 기능에 잇기만 함(viewLinks)
//   keyUse: 함수 → Map(상태 키 → 'r'|'w') · hub: 공용 기반(허브) 함수 키 · louvain: lib/modules.mjs
const SEEDS = 5, KEY_HUB = 25; // 이만큼 많은 함수가 쓰는 키는 공용 기반(묶는 근거가 아님)
export function features(fns, L, keyUse, hub, louvain) { const mc = [...fns.values()].filter(f => f.top && !f.table && f.unit === 'main' && !hub.has(f.key) && ['Model', 'Controller', '섞임'].includes(L.get(f.key)?.layer) && !L.get(f.key)?.handler), keys = new Set(mc.map(f => f.key)), adj = new Map(mc.map(f => [f.key, new Map()]));
  const add = (a, b, w) => { if (a === b || !keys.has(a) || !keys.has(b)) return; adj.get(a).set(b, (adj.get(a).get(b) || 0) + w); adj.get(b).set(a, (adj.get(b).get(a) || 0) + w); };
  for (const f of mc) for (const [ck, n] of f.calls) add(f.key, ck, Math.min(n, 3) / Math.log2(2 + (fns.get(ck)?.callers.size || 1)));
  /* 같은 데이터: 상태 키·data 경로·저장소 키마다 가상 노드 하나 — 그 키를 쓰는 함수가 "그 키를 부르는" 것처럼 잇고(무게는 호출과 같이 쓰는 함수가 많을수록 가볍게),
     공용 기반처럼 HUB개 이상이 쓰는 키는 뺌. 접근 함수(예전 CRES()·EXS())를 칸 이름 접근(progSlot('cres'))으로 바꿔도 같은 데이터로 묶임 */
  const byKey = new Map(); for (const [fk, m] of keyUse) { if (!keys.has(fk)) continue; for (const k of m.keys()) { if (!byKey.has(k)) byKey.set(k, []); byKey.get(k).push(fk); } }
  for (const [k, fs] of byKey) { if (fs.length < 2 || fs.length >= KEY_HUB) continue; const v = 'key:' + k, w = 1 / Math.log2(2 + fs.length); keys.add(v); adj.set(v, new Map()); for (const f of fs) add(f, v, w); }
  for (const [n, nb] of [...adj]) if (!nb.size) adj.delete(n);
  const runs = Array.from({ length: SEEDS + 1 }, (_, sd) => louvain(adj, sd)), base = new Map([...runs[0]].filter(([n]) => !n.startsWith('key:'))), comm = new Map();
  /* 흔들리지 않는 묶음: 기준 묶음에서 같은 묶음이던 함수와 다른 순서에서도 과반이 같이 묶인 함수만 그 묶음에 — 아니면 묶음 없음(경계) */
  for (const [n, c] of base) { const peers = [...base].filter(([m, d]) => d === c && m !== n).map(([m]) => m); if (!peers.length) { comm.set(n, c); continue; } const agree = runs.slice(1).filter(r => peers.filter(m => r.get(m) === r.get(n)).length * 2 >= peers.length).length; comm.set(n, agree * 2 >= SEEDS ? c : null); }
  return { comm, adj }; }

// 저장 정책 점검(사용자 지시 — 브라우저 저장소는 캐시, 원본은 PC 서버 파일): 코드가 쓰는 저장 키마다 앱의 저장 정책 표(STORE_POLICY)의 갈래
//   game(게임 저장 — 저장소가 따로 관리: starfall-projects·starfall-contract-v1…) · session(sessionStorage — 한 번 쓰고 버림) · sync·secret·device·cache(표)
//   표에 없는 키 = 갈래 없음(위반 — 동기화할지 정해야 함) · 표에만 있고 코드가 안 쓰는 키 = 낡은 표
const GAME_KEY = /^starfall-(projects|contract-v1)/;
function storePolicy(units, fns, str) { const P = constLiterals(units, ['STORE_POLICY']).STORE_POLICY || null, cls = new Map();
  if (P) { for (const k of P.sync || []) cls.set(k, 'sync'); for (const k of Object.keys(P.secret || {})) cls.set(k, 'secret'); for (const k of P.device || []) cls.set(k, 'device'); for (const k of P.cache || []) cls.set(k, 'cache'); for (const k of P.legacy || []) cls.set(k, 'legacy'); }
  /* 저장 키를 쓰는 곳: 함수 안이면 그 최상위 함수, 부팅 스크립트처럼 최상위 문장이면 단위 이름 */
  const owner = (u, n) => { let top = null; for (let p = n.parent; p; p = p.parent) if (/^(function_declaration|function_expression|arrow_function|method_definition)$/.test(p.type)) top = p; if (!top) return u.name; const nm = top.childForFieldName('name')?.text || (top.parent?.type === 'variable_declarator' ? top.parent.childForFieldName('name')?.text : null); return nm || u.name; };
  const used = new Map(); for (const u of units) { walk(u.tree.rootNode, n => { if (n.type !== 'call_expression') return; const f = { name: owner(u, n) }; const c = n.childForFieldName('function'), o = c?.type === 'member_expression' ? c.childForFieldName('object')?.text : ''; if (!STORE.test(o || '') || !/^(getItem|setItem|removeItem)$/.test(c.childForFieldName('property')?.text || '')) return;
    const a = n.childForFieldName('arguments')?.namedChildren[0], k = a?.type === 'string' ? a.text.slice(1, -1) : a?.type === 'identifier' ? str.get(a.text) || null : null; if (!k) return;
    const kind = o === 'sessionStorage' ? 'session' : GAME_KEY.test(k) ? 'game' : cls.get(k) || null; if (!used.has(k)) used.set(k, { kind, fns: new Set(), w: false }); const x = used.get(k); x.fns.add(f.name); if (STORE_W.test(c.childForFieldName('property').text)) x.w = true; if (!x.kind) x.kind = kind; }); }
  return { table: !!P, keys: [...used].map(([k, x]) => ({ key: k, kind: x.kind, write: x.w, fns: [...x.fns].sort() })).sort((a, b) => a.key.localeCompare(b.key)), stale: [...cls.keys()].filter(k => !used.has(k)).sort() }; }

// 아키텍처 요약(연관 맵이 부름): 계층(함수마다·모듈마다·방향 위반) · 기능(Model·Controller 묶음 ↔ 화면 단위) · 모듈 판정 · 저장 정책
//   writers: 게임 상태를 쓰는 함수 키 · keyUse: 함수 → Map(상태 키·data 경로 → r|w) · sf: lib/surface.mjs surfaceOf 결과 · layer: 설계상 층(프롬프트 스튜디오)
// 섞인 함수를 나눌 자리: View 신호 줄(마크업·DOM 바꿈)과 Model 신호 줄(상태 쓰기·저장·서비스) — 액션 처리기는 case마다(처리기는 Controller라 상태 쓰기는 괜찮고, 창 HTML·DOM이 든 case가 섞임)
function mixAt(f, x, u, muts) { const line = n => +u.loc(n).split(':').pop(), uniq = a => [...new Set(a)].sort((p, q) => p - q), caseOf = n => { for (let p = n; p && p !== f.node; p = p.parent) if (p.type === 'switch_case') return p; return null; };
  const v = uniq(x.atV.map(line)), m = uniq([...x.atM.map(line), ...muts.map(w => +w.loc.split(':').pop())]);
  if (!x.handler) return { view: v, model: m };
  const cs = new Map(); for (const n of x.atV) { const c = caseOf(n); if (!c) continue; const k = c.childForFieldName('value')?.text.slice(1, -1) || 'default'; if (!cs.has(k)) cs.set(k, { act: k, line: line(c), view: 0 }); cs.get(k).view++; }
  return { view: v, model: m, cases: [...cs.values()].sort((p, q) => p.line - q.line) }; }
export function archMap(units, fns, { writers, keyUse, sf, louvain, layer, modOf }) {
  const consts = new Map(); for (const u of units) walk(u.tree.rootNode, n => { if (n.type === 'variable_declarator' && n.childForFieldName('value')?.type === 'string') consts.set(n.childForFieldName('name')?.text, n.childForFieldName('value').text.slice(1, -1)); });
  const L = layers(fns, writers), hub = new Set([...fns.values()].filter(f => f.top && f.callers.size >= 25).map(f => f.key)), SK = storeKeys(fns, consts);
  for (const [fk, m] of SK) { if (!keyUse.has(fk)) keyUse.set(fk, new Map()); for (const [k, v] of m) keyUse.get(fk).set(k, v); }
  const { comm } = features(fns, L.layer, keyUse, hub, louvain), main = [...fns.values()].filter(f => f.top && !f.table && f.unit === 'main'), mod = f => modOf(f.loc.split(':')[0]);
  /* View 함수의 기능: 부르는 Model·Controller 함수의 기능 중 많은 것 → 없으면 부르는 쪽(Controller가 여는 화면) → 없으면 미정 */
  const featOf = new Map([...comm].filter(([, c]) => c != null));
  for (const f of main) { if (featOf.has(f.key) || hub.has(f.key)) continue; const vote = ks => { const v = new Map(); for (const k of ks) { const c = featOf.get(k); if (c != null) v.set(c, (v.get(c) || 0) + 1); } return [...v].sort((a, b) => b[1] - a[1])[0]?.[0]; };
    const c = vote(f.calls.keys()) ?? vote(f.callers); if (c != null) featOf.set(f.key, c); }
  /* 기능 이름·화면: 기능의 함수에 닿는 화면 단위(lib/surface.mjs) — 화면 > 패널 > 배경 > 창 순으로 많이 닿는 것이 이름 */
  const rank = { screen: 0, panel: 1, background: 2, window: 3 }, F = new Map();
  for (const [k, c] of featOf) { if (!F.has(c)) F.set(c, { fns: [], units: new Map(), mods: new Map() }); const x = F.get(c), f = fns.get(k); x.fns.push(k); x.mods.set(mod(f), (x.mods.get(mod(f)) || 0) + 1); for (const u of sf.any.get(k) || []) x.units.set(u, (x.units.get(u) || 0) + 1); }
  /* 이름 = 그 기능 함수들이 가장 많이 쓰는(바꾸는) 데이터 — 기능을 같은 데이터로 묶었으니. 여러 기능이 다 쓰는 데이터(쓰는 함수가 30개↑)는 빼고, 없으면 가장 많이 닿는 화면 */
  const wcount = new Map(); for (const [, m] of keyUse) for (const [k, rw] of m) if (rw === 'w') wcount.set(k, (wcount.get(k) || 0) + 1);
  const dataOf = x => { const c = new Map(); for (const k of x.fns) for (const [key, rw] of keyUse.get(k) || []) if (rw === 'w' && (wcount.get(key) || 0) < 30) c.set(key, (c.get(key) || 0) + 1); return [...c].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 3).map(([key]) => key.replace(/^store:/, '저장소 ')); };
  const feats = {}; let n = 0; for (const [, x] of [...F].sort((a, b) => b[1].fns.length - a[1].fns.length)) { const us = [...x.units].sort((a, b) => rank[sf.feats.get(a[0]).kind] - rank[sf.feats.get(b[0]).kind] || b[1] - a[1]);
    const id = 'F' + String(++n).padStart(2, '0'), lead = us[0]?.[0], data = dataOf(x); x.id = id; feats[id] = { label: data[0] || (lead ? fullLabel(sf, lead) : (fns.get(x.fns[0])?.name || id)), data, fns: x.fns.length, mods: [...x.mods].sort((a, b) => b[1] - a[1]), views: us.slice(0, 8).map(([u, c]) => [fullLabel(sf, u), c]), layers: x.fns.reduce((o, k) => { const l = L.layer.get(k)?.layer; o[l] = (o[l] || 0) + 1; return o; }, {}) }; }
  const idOf = new Map([...F].map(([c, x]) => [c, x.id]));
  /* 모듈 판정 — 기능 축(같은 데이터·처리) + 계층 축 */
  const byMod = new Map(); for (const f of main) { const m = mod(f); if (!byMod.has(m)) byMod.set(m, []); byMod.get(m).push(f); }
  /* 기능의 집(그 기능 함수가 가장 많은 모듈) — 설계상 층(프롬프트 스튜디오)과 액션 분배기 모듈은 집이 될 수 없음(여러 기능을 담는 것이 설계) */
  const notHome = new Set([layer, ...[...byMod].filter(([, fs]) => fs.filter(f => /^handle\w+Action$/.test(f.name)).length * 2 >= fs.length).map(([m]) => m)]);
  const home = new Map(); for (const [id, x] of Object.entries(feats)) home.set(id, (x.mods.find(([m2]) => !notHome.has(m2)) || x.mods[0])[0]);
  const bad = new Map(); for (const b of L.bad) { const m = mod(fns.get(b.fn)); if (!bad.has(m)) bad.set(m, []); bad.get(m).push(b); }
  const verdicts = [...byMod].map(([m, fs]) => moduleVerdict(m, fs, { L: L.layer, hub, featOf, idOf, home, feats, bad: bad.get(m) || [], layer })).sort((a, b) => a.mod.localeCompare(b.mod));
  const fnLayer = {}, mut = mutations(units, fns).mut, U = new Map(units.map(u => [u.name, u])); for (const f of main) { const x = L.layer.get(f.key); fnLayer[f.key] = { layer: x?.layer, feat: idOf.get(featOf.get(f.key)) || null }; if (x?.layer === '섞임') fnLayer[f.key].mix = mixAt(f, x, U.get(f.unit), mut.get(f.key) || []); }
  return { feats, verdicts, fnLayer, bad: L.bad.filter(b => fns.get(b.fn)?.unit === 'main').map(b => ({ fn: fns.get(b.fn).name, to: fns.get(b.to)?.name, kind: b.kind, mod: mod(fns.get(b.fn)) })), store: storePolicy(units, fns, consts) }; }

// 모듈 하나 판정: 분배(액션 분배기 층) · 층(프롬프트 스튜디오 — 사용자 지시로 모든 기능의 프롬프트를 취합) · 기반(허브 함수 중심)
//   기능 축 — 슈퍼(관계없는 기능 둘 이상이 각각 max(3, 20%)↑ — 발산적 변경) · 조각(중심 기능의 함수가 다른 모듈에 2배↑ — 게으른 모듈) · 흩어짐(어느 기능도 절반이 안 되고 셋 이상에 나뉨 — 함수마다 제 기능 모듈로) · 고유
//   계층 축 — 섞인 함수(View와 Model이 한 함수에) · 방향 위반(View가 상태를 바꿈·Model이 화면을 부름) 수
function moduleVerdict(m, fs, C) { const n = fs.length, lay = {}, by = new Map(); let nh = 0, nd = 0; const mixed = [];
  for (const f of fs) { const l = C.L.get(f.key)?.layer; lay[l] = (lay[l] || 0) + 1; if (l === '섞임') mixed.push(f.name); if (C.hub.has(f.key)) nh++; if (/^handle\w+Action$/.test(f.name)) nd++; const id = C.idOf.get(C.featOf.get(f.key)); if (id && !C.hub.has(f.key)) by.set(id, (by.get(id) || 0) + 1); }
  const feat = [...by].sort((a, b) => b[1] - a[1]), nf = feat.reduce((s, [, c]) => s + c, 0), v = { mod: m, n, layers: lay, mixed, bad: C.bad.length, badEx: C.bad.slice(0, 6).map(b => `${b.fn}→${b.to}`), feats: feat.slice(0, 6) };
  if (nd * 2 >= n) return { ...v, kind: '분배' }; if (m === C.layer) return { ...v, kind: '층' }; if (nh * 2 >= n) return { ...v, kind: '기반' };
  const big = feat.filter(([, c]) => c >= Math.max(3, nf * 0.2)); if (big.length >= 2) return { ...v, kind: '슈퍼', split: big.map(([id, c]) => ({ feat: id, n: c, to: C.home.get(id) !== m ? C.home.get(id) : null })) };
  if (feat.length >= 3 && feat[0][1] * 2 < nf) return { ...v, kind: '흩어짐', spread: feat.map(([id, c]) => ({ feat: id, n: c, to: C.home.get(id) !== m ? C.home.get(id) : null })) };
  const [id, c] = feat[0] || [], hm = id && C.home.get(id), other = hm && hm !== m ? (C.feats[id].mods.find(([x]) => x === hm) || [])[1] || 0 : 0;
  return id && hm !== m && c * 2 <= other ? { ...v, kind: '조각', feat: id, to: hm, n0: c, n1: other } : { ...v, kind: id ? '고유' : '기반', feat: id || null }; }
