// 아키텍처 계층(MVC — CLAUDE.md §0-2) 판정 원칙 LAYER_DEF: 이 한곳의 정의를 모든 함수(SPA 전체 — main·modules·boot)에 같게 씀(규칙표 lib/rules.mjs가 이 정의를 보여 줌)
export const LAYER_DEF = {
  effects: '직접 효과만 봄 — 화면 바꿈(V: HTML 마크업 글·보이는 DOM 바꿈 — 내려받기 링크·캔버스 같은 임시 요소는 뺌) · 화면 읽기(I: DOM 찾기·값 읽기) · 상태 바꿈(S: 게임 상태 쓰기·브라우저 저장소 쓰기·네트워크 직접 호출). 앱 함수를 부르는 것은 효과가 아니라 호출 간선 — 단 외부와의 경계인 입출력 어댑터(ADAPTERS: 저장·AI·그림)는 그 자체가 S',
  layer: 'V∧S → 섞임 · V → View · 어댑터 → Model · S∧(액션 처리기 ∨ 다시 그리게 함(갱신 통로 render·renderView·toast·openModal·closeModal 호출) ∨ I) → Controller(동작·입력을 받아 Model을 바꾸고 다시 그리게 함) · S → Model · 액션 처리기 → Controller · 효과 없음 → 호출로(고정점): 바꾸는 함수와 화면 함수를 함께 → Controller · 화면 함수만이나 I만 → View · 그 밖 → Model',
  changes: '바꾸는 함수 = S가 있거나 바꾸는 함수를 부르는 View 아닌 함수(호출 그래프로 이어서)',
  direction: 'L2 View가 바꾸는 함수를 부름(화면 갱신 요청 render·renderView만 뺌) · L3 Model이 화면 함수(View·섞임 — 갱신 통로 포함)를 부름',
};
import { walk } from './source.mjs';
import { constLiterals } from './wiring.mjs';
import { fullLabel } from './surface.mjs';
import { mutations } from './flow.mjs';
import { FRESH, freshFactories } from './extra.mjs';

const MARKUP = /<\/?[a-zA-Z][\w-]*(\s|>|\/>)/;
const DOM_WRITE = /^(innerHTML|outerHTML|textContent|innerText|className|hidden|scrollTop|scrollLeft|disabled|checked|selectedIndex|value|src|href|placeholder)$/, DOM_CALL = /^(appendChild|insertAdjacentHTML|insertBefore|replaceChildren|replaceWith|removeChild|remove|setAttribute|removeAttribute|toggleAttribute|scrollIntoView|focus|blur|showModal|animate|setProperty)$/;
const DOM_READ = /^(querySelector|querySelectorAll|getElementById|getElementsByClassName|closest|matches|getBoundingClientRect|getAttribute|contains)$/;
const NONUI_EL = /^['"`](canvas|img|audio|video|a|input|script|link|source)['"`]$/; // 화면이 아닌 임시 요소(그림 처리·소리·내려받기 링크·파일 고르기)
const STYLE = /^(classList|style|dataset)$/;
const CHANNEL = new Set(['render', 'renderView', 'toast', 'openModal', 'closeModal']); // 화면 갱신 통로(다시 그리게 함)
const REFRESH = new Set(['render', 'renderView']); // 화면 갱신 요청 — View가 불러도 L2 아님
const ADAPTERS = new Set(['idbPut', 'idbDel', 'storeImage', 'storeAudio', 'mark', 'markAll', 'flush', 'downloadBlob', 'aiOne', 'aiCall', 'aiJSON', 'naiDraw', 'naiGenerate']); // 입출력 어댑터(외부와의 경계 — Model)
const STORE = /^(appStorage|localStorage|sessionStorage|indexedDB)$/, STORE_W = /^(setItem|removeItem|clear|mediaWrite|saveLive|deleteDatabase)$/, NET = new Set(['fetch']);
const AMBIG = /^(hidden|disabled|checked|selectedIndex|value|src|href|placeholder)$/, DOM_Q = /\$\(|querySelector|getElementById|createElement|closest\(|\.target\b|children|firstElementChild|parentNode|parentElement/;
const propOf = m => m?.type === 'member_expression' ? m.childForFieldName('property')?.text || '' : '';
const rootName = x => (x?.text || '').split(/[.[(]/)[0];
// hidden·value·src 같은 이름은 데이터 칸에도 쓰여서 — 대상이 함수 안에서 DOM이 아닌 값으로 만든 이름이면 뺌
function notElement(obj, f) { const root = rootName(obj); let init = null; walk(f.node, n => { if (init === null && n.type === 'variable_declarator' && n.childForFieldName('name')?.text === root) init = n.childForFieldName('value')?.text || ''; }); return init !== null && !DOM_Q.test(init); }
// 함수 안에서 임시 요소로 만든 이름(createElement('a') 등)
function tempEls(f) { const out = new Set(); walk(f.node, n => { if (n.type !== 'variable_declarator') return; const v = n.childForFieldName('value'); if (v?.type === 'call_expression' && propOf(v.childForFieldName('function')) === 'createElement' && NONUI_EL.test(v.childForFieldName('arguments')?.namedChildren[0]?.text || '')) out.add(n.childForFieldName('name')?.text); }); return out; }
function assignSig(n, s, f, tmp) { const l = n.childForFieldName('left'); if (l?.type !== 'member_expression') return; const p = propOf(l), o = l.childForFieldName('object'); if (tmp.has(rootName(o))) return;
  if ((DOM_WRITE.test(p) && !(AMBIG.test(p) && notElement(o, f))) || (STYLE.test(propOf(o)) && !tmp.has(rootName(o)))) { s.dom = true; s.atV.push(n); } }
function callSig(n, s, tmp) { const c = n.childForFieldName('function'), args = n.childForFieldName('arguments')?.namedChildren || [];
  if (c?.type === 'identifier') { if (CHANNEL.has(c.text)) s.channel = true; if (NET.has(c.text)) { s.service = true; s.atM.push(c); } if (c.text === '$') s.read = true; return; }
  if (c?.type !== 'member_expression') return; const p = propOf(c), o = c.childForFieldName('object');
  if (STORE.test(o?.text || '')) { if (STORE_W.test(p)) { s.store = true; s.atM.push(n); } return; }
  if (/^(Object|Array|JSON|Math|Promise|URL|Set|Map|String|Number|Date|navigator|console|crypto)$/.test(o?.text || '')) return;
  if (DOM_READ.test(p) || (STYLE.test(propOf(o)) && /^(contains|item|getPropertyValue)$/.test(p))) { s.read = true; return; }
  if (tmp.has(rootName(o)) || args.some(a => tmp.has(a.text))) return; /* 임시 요소 다루기 */
  if (p === 'createElement' ? !NONUI_EL.test(args[0]?.text || '') : (DOM_CALL.test(p) || STYLE.test(propOf(o)))) { s.dom = true; s.atV.push(n); } }
/* atV·atM: 화면 바꿈·상태 바꿈이 난 자리(노드) — 섞인 함수를 나눌 때(archMap mix) */
// 없으면 만들어 쓰는 게터(get-or-create — 읽기처럼 쓰이는데 상태를 씀): 어떤 대입의 왼쪽 사슬을 그대로 돌려줌(return x.y / return m.k) — 또는 그 대입 왼쪽의 앞부분 이름을 돌려줌
function lazyGetter(f) { const lhs = new Set(); let hit = false; walk(f.node, n => { if (n !== f.node && /function|arrow/.test(n.type)) return false; if (n.type === 'assignment_expression') { const l = n.childForFieldName('left'); if (l?.type === 'member_expression' || l?.type === 'subscript_expression') { lhs.add(l.text); let o = l.childForFieldName('object'); while (o) { lhs.add(o.text); o = o.childForFieldName?.('object'); } } } });
  walk(f.node, n => { if (n !== f.node && /function|arrow/.test(n.type)) return false; if (n.type === 'return_statement') { const v = n.namedChildren[0]; if (v && lhs.has(v.text.replace(/^\((.*)\)$/, '$1'))) hit = true; } }); return hit; }
/* 새로 만든 지역 값만 채움(쓰는 대상의 뿌리가 모두 이 함수에서 새 값 — 글자 {…}·[…]·clone·만들기 함수 — 으로 만든 지역 이름): 상태를 바꾸지 않는 조립(cleanChar·응답 해석) */
function freshOnly(f, fac) { const init = new Map(); walk(f.node, n => { if (n.type === 'variable_declarator' && n.childForFieldName('name')?.type === 'identifier') init.set(n.childForFieldName('name').text, n.childForFieldName('value')); });
  const fresh = v => !!v && (FRESH.test(v.text) || (v.type === 'call_expression' && fac.has(v.childForFieldName('function')?.text))); let n0 = 0, ok = true;
  walk(f.node, n => { let t = null; if (n.type === 'assignment_expression' || n.type === 'augmented_assignment_expression') t = n.childForFieldName('left'); else if (n.type === 'update_expression') t = n.childForFieldName('argument'); else if (n.type === 'unary_expression' && n.child(0)?.type === 'delete') t = n.childForFieldName('argument'); else if (n.type === 'call_expression') { const g = n.childForFieldName('function'); if (g?.type === 'member_expression' && /^(push|splice|unshift|pop|shift|sort|reverse)$/.test(g.childForFieldName('property')?.text || '')) t = g.childForFieldName('object'); }
    if (!t || t.type === 'identifier') return; n0++; let r = t; while (r && (r.type === 'member_expression' || r.type === 'subscript_expression')) r = r.childForFieldName('object'); if (r?.type !== 'identifier' || !fresh(init.get(r.text))) ok = false; });
  return n0 > 0 && ok; }
function signals(f, writers, fac = new Set()) { const s = { markup: false, dom: false, read: false, channel: false, write: writers.has(f.key) && !freshOnly(f, fac), store: false, service: false, adapter: ADAPTERS.has(f.name), handler: /^handle\w+Action$/.test(f.name), atV: [], atM: [] }, tmp = tempEls(f);
  walk(f.node, n => { const t = n.type;
    if (t === 'string' || t === 'template_string' || t === 'string_fragment') { if (MARKUP.test(n.text)) { s.markup = true; s.atV.push(n); } }
    else if (t === 'assignment_expression' || t === 'augmented_assignment_expression') assignSig(n, s, f, tmp);
    else if (t === 'call_expression') callSig(n, s, tmp);
    else if (t === 'new_expression' && /^XMLHttpRequest$/.test(n.childForFieldName('constructor')?.text || '')) s.service = true; });
  s.trigger = s.channel; s.lazy = s.write && lazyGetter(f); return s; }
const V = s => s.markup || s.dom, S = s => s.write || s.store || s.service || s.adapter;
// 직접 효과로 정하는 계층(효과 없으면 null — 호출로 정함)
function layerOf(s) { if (V(s) && S(s) && !s.adapter) return '섞임'; if (V(s) && !s.adapter) return 'View'; if (s.adapter) return 'Model';
  if (S(s)) return s.handler || s.channel || s.read ? 'Controller' : 'Model'; if (s.handler) return 'Controller'; return null; }

// fns: buildGraph 함수 표 · writers: 게임 상태를 직접 쓰는 함수 키(연관 맵 data 쓰기) — LAYER_DEF대로
export function layers(fns, writers) { const top = [...fns.values()].filter(f => f.top && !f.table), out = new Map(), fac = freshFactories(fns, writers) /* 상태를 쓰는 함수는 만들기가 아님 */;
  for (const f of top) { const s = signals(f, writers, fac); out.set(f.key, { ...s, layer: layerOf(s), quiet: layerOf(s) === null }); }
  const calls = f => [...f.calls.keys()].map(k => out.get(k)).filter(Boolean), isView = o => o.layer === 'View' || o.layer === '섞임';
  /* 바꾸는 함수(전이) */ const ch = new Set(top.filter(f => S(out.get(f.key))).map(f => f.key));
  for (let more = true; more;) { more = false; for (const f of top) { if (ch.has(f.key) || out.get(f.key).layer === 'View') continue; if ([...f.calls.keys()].some(k => ch.has(k))) { ch.add(f.key); more = true; } } }
  /* 효과 없는 함수: 호출로 — 화면 함수만이나 화면 읽기만 → View, 바꾸는 함수와 화면 함수를 함께 → Controller, 그 밖 → Model(더 바뀌지 않을 때까지) */
  for (let more = true; more;) { more = false; for (const f of top) { const me = out.get(f.key); if (!me.quiet) continue; const cs = calls(f), view = cs.some(isView) || me.read, change = [...f.calls.keys()].some(k => ch.has(k));
    const L = view && change ? 'Controller' : view ? 'View' : 'Model'; if (me.layer !== L) { me.layer = L; more = true; if (L === 'View') ch.delete(f.key); } } }
  for (const [k, o] of out) o.changes = ch.has(k);
  /* 바꾸는 까닭: 바꾸는 함수에서 직접 상태를 바꾸는 끝 함수까지 가장 짧은 호출 길(거꾸로 넓이 우선) — 같은 끝 함수로 묶어 원인 단위로 고치게 */
  const via = new Map(); { const q = [...ch].filter(k => S(out.get(k))); q.forEach(k => via.set(k, null)); const callers = new Map(); for (const f of top) for (const k of f.calls.keys()) { if (!callers.has(k)) callers.set(k, []); callers.get(k).push(f.key); }
    while (q.length) { const k = q.shift(); for (const c of callers.get(k) || []) if (ch.has(c) && !via.has(c)) { via.set(c, k); q.push(c); } } }
  const endOf = k => { const path = []; for (let x = k, i = 0; x && i < 30; x = via.get(x), i++) path.push(x); return path; };
  for (const [k, o] of out) if (o.changes) o.changePath = endOf(k);
  /* 방향(LAYER_DEF.direction): L2 View → 바꾸는 함수(갱신 요청 render·renderView 뺌) · L3 Model → 화면 함수 */
  /* 그 호출이 함수 안에 붙인 콜백(이벤트 처리·타이머) 안에서만 일어나나 */
  const innerOnly = (f, nm) => { let top = 0, inner = 0; walk(f.node, n => { if (n.type !== 'call_expression' || n.childForFieldName('function')?.text !== nm) return; let p = n.parent, nested = false; while (p && p.id !== f.node.id) { if (/function|arrow/.test(p.type)) { nested = true; break; } p = p.parent; } nested ? inner++ : top++; }); return inner > 0 && top === 0; };
  const bad = []; for (const f of top) { const me = out.get(f.key); for (const k of f.calls.keys()) { const o = out.get(k); if (!o) continue; const nm = fns.get(k)?.name;
    if (me.layer === 'View' && o.changes && o.layer !== 'View' && !REFRESH.has(nm)) bad.push({ fn: f.key, to: k, kind: 'View가 상태를 바꾸는 함수를 부름(L2)', path: o.changePath, inner: innerOnly(f, nm) });
    else if (me.layer === 'Model' && isView(o)) bad.push({ fn: f.key, to: k, kind: 'Model이 화면 함수를 부름(L3)' }); } }
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
// 섞인 꼴(나누는 방법이 꼴마다 다름 — map.mjs --split): 결과 HTML을 돌려주며 정산 · 그리면서 상태 씀(…HTML·…Panel) · 창을 열며 처리 · 작업(저장·네트워크·AI)하며 진행 표시 · 그 밖의 화면 조작+상태
const NESTED = new Set(['function_declaration', 'function_expression', 'arrow_function', 'method_definition']);
function retMarkup(f) { let hit = false; const go = n => { if (hit || (n !== f.node && NESTED.has(n.type))) return; if (n.type === 'return_statement' && MARKUP.test(n.text)) hit = true; for (const c of n.namedChildren) go(c); }; go(f.node); return hit; }
function mixKind(f, x) { const ret = retMarkup(f), modal = [...f.calls.keys()].some(k => /(^|:)openModal$/.test(k));
  if (/(HTML|Panel)$/.test(f.name)) return '그리면서 상태 씀'; if (ret && (x.write || x.store)) return '정산+결과'; if (ret) return '그리면서 상태 씀';
  if (modal) return '창+처리'; if (x.service || x.store) return '작업+진행 표시'; return '화면 조작+상태'; }
// 섞인 함수를 나눌 자리: View 신호 줄(마크업·DOM 바꿈)과 Model 신호 줄(상태 쓰기·저장·서비스) — 액션 처리기는 case마다(처리기는 Controller라 상태 쓰기는 괜찮고, 창 HTML·DOM이 든 case가 섞임)
function mixAt(f, x, u, muts) { const line = n => +u.loc(n).split(':').pop(), uniq = a => [...new Set(a)].sort((p, q) => p - q), caseOf = n => { for (let p = n; p && p !== f.node; p = p.parent) if (p.type === 'switch_case') return p; return null; };
  const v = uniq(x.atV.map(line)), m = uniq([...x.atM.map(line), ...muts.map(w => +w.loc.split(':').pop())]);
  if (!x.handler) return { view: v, model: m, kind: mixKind(f, x) };
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
  return { feats, verdicts, fnLayer, homes: Object.fromEntries(home), bad: L.bad.filter(b => fns.get(b.fn)?.unit === 'main').map(b => ({ fn: fns.get(b.fn).name, to: fns.get(b.to)?.name, kind: b.kind, mod: mod(fns.get(b.fn)) })), store: storePolicy(units, fns, consts) }; }

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
// 요소 매개변수(진행 표시 꼴의 뿌리): 함수 매개변수가 DOM 요소로 쓰이거나(글자·잠금·연결 여부·클래스 …) 그런 매개변수 자리로 넘어가면 요소 매개변수 — 호출 그래프에서 더 바뀌지 않을 때까지.
//   Model 함수가 요소를 받아 직접 만지면(단추를 잠그고 글자를 바꿈) 계층 섞임·방향 위반의 뿌리 → 처리기가 화면에서 만든 진행 알림 함수(uiProg)를 넘기고 작업은 그 함수만 부르게(map.mjs --split)
const ELEM_PROP = /^(textContent|innerText|innerHTML|disabled|isConnected|classList|dataset|querySelector|querySelectorAll|closest|getBoundingClientRect|scrollIntoView|appendChild|insertAdjacentHTML)$/; /* 데이터 객체에도 흔한 이름(style·hidden·remove)은 뺌 */
const paramNames = f => { const ps = f.node.childForFieldName('parameters')?.namedChildren || (f.node.childForFieldName('parameter') ? [f.node.childForFieldName('parameter')] : []); return ps.map(p => p.type === 'identifier' ? p.text : p.type === 'assignment_pattern' ? p.childForFieldName('left')?.text : null); };
export function elementParams(fns) { const top = [...fns.values()].filter(f => f.top && !f.table), P = new Map(top.map(f => [f.key, paramNames(f)])), dom = new Map(), passes = [];
  for (const f of top) { const ps = P.get(f.key), set = new Set(); walk(f.node, n => {
    if (n.type === 'member_expression' && ps.includes(n.childForFieldName('object')?.text) && ELEM_PROP.test(n.childForFieldName('property')?.text || '')) set.add(n.childForFieldName('object').text);
    if (n.type === 'call_expression') { const g = n.childForFieldName('function'); if (g?.type !== 'identifier' || !fns.has(g.text)) return; (n.childForFieldName('arguments')?.namedChildren || []).forEach((a, i) => { const t = a.text.replace(/\|\|null$/, ''); if (ps.includes(t)) passes.push({ f: f.key, p: t, g: g.text, i }); }); } });
    dom.set(f.key, set); }
  const el = new Map(top.map(f => [f.key, new Set(dom.get(f.key))])), via = new Map();
  for (let more = true; more;) { more = false; for (const x of passes) { const gp = P.get(x.g)?.[x.i]; if (gp && el.get(x.g)?.has(gp) && !el.get(x.f).has(x.p)) { el.get(x.f).add(x.p); via.set(`${x.f}|${x.p}`, x.g); more = true; } } }
  const out = []; for (const f of top) for (const p of el.get(f.key)) out.push({ fn: f.key, param: p, direct: dom.get(f.key).has(p), via: via.get(`${f.key}|${p}`) || null }); return out; }
