// 연관 맵(사용자 지시): 모듈 집합(src) → 빌드 → index.html(생성기·실행기·편집기 — CLAUDE.md §0) → 생성·실행·편집 → data 게임 파일(data/<게임id>/<종류>.json)
//   data 경로마다 만드는·고치는 함수를 역할별로, 그 함수의 src 모듈과 index.html 줄, 점검 규칙·프롬프트 조각, 읽는 모듈·연계 모듈을 이어 둠 —
//   게임에서 무엇이 이상하면(시나리오·캐릭터 밸런스·스킬·이격 …) data 경로에서 거꾸로 index.html → 모듈로 따라감
//   역할: 생성기 = 새 게임 생성 단계가 부르는 함수 · 실행기 = 실행 중 AI(liveTick)·불러오기(fix)·앱을 열 때(부팅·게임 열기)가 부르는 함수, 또는 사용자 조작이 진행(prog.json)을 씀(플레이)
//         플레이 조작(진행을 쓰는 사용자 함수 — P().x 또는 CRES()·CBUILD() 같은 접근 함수로 받은 객체에 씀)에서 닿는 콘텐츠 쓰기도 실행기(예: 건조 바리에이션)
//         편집기 = 사용자 조작이 플레이 조작을 거치지 않고 진행 아닌 data(콘텐츠)를 씀(편집 화면·점검·AI 추가 지시) · 기타 = 위 단계 시작점에서 닿지 않음(엔진 안쪽 등)
import { walk } from './source.mjs';
import { generatorVocab, constLiterals, INFRA } from './wiring.mjs';
import { stageRoots } from './lifecycle.mjs';
import { auditRules } from './upgrade.mjs';
import { moduleOf } from './scope.mjs';
import { surfaceOf, surfaceMap } from './surface.mjs';
import { archMap } from './arch.mjs';
import { louvain } from './modules.mjs';
import { fragmentFiles } from './prompts.mjs';

// 엔티티 → data 파일·경로(목록 안 원소). 컬렉션을 도는 콜백·찾기 함수·생성 함수 결과·매개변수(호출 지점에서 전파)로 묶인 변수의 프로퍼티를 필드로 셈 — 변수 이름으로 짐작하지 않음
export const ENT = { 캐릭터: ['chars', '[]'], NPC: ['npcs', '[]'], 장: ['chapters', '[]'], 스테이지: ['chapters', '[].stages[]'], 적: ['chapters', '[].stages[].enemies[]'], 자료: ['lib', '[]'], 세력: ['world', 'factions[]'], 메신저: ['threads', '[]'], 이벤트: ['events', '[]'], 배너: ['banners', '[]'], 파견: ['dispatches', '[]'] };
const COLL = [['캐릭터', /(^|\.)chars(\(\))?$|ownedChars\(\)$/], ['NPC', /(^|\.)npcs$/], ['장', /(^|\.)chapters$/], ['스테이지', /(^|\.)stages$/], ['적', /(^|\.)enemies$/], ['자료', /^(G|g|ng)\.lib$/], ['세력', /^factions\(\)$|(^|\.)factions$/], ['메신저', /^(G|g|ng)\.threads$/], ['이벤트', /^(G|g|ng)\.events$/], ['배너', /^(G|g|ng)\.banners$/], ['파견', /^(G|g|ng)\.dispatches$/]];
const LOOKUP = [['캐릭터', /^(charById|charOf)\(|(^|\.)chars\.find\(/], ['스테이지', /^stageById\(/], ['세력', /^facByName\(/], ['장', /(^|\.)chapters\.find\(/], ['NPC', /(^|\.)npcs\.find\(/]];
const ITER = /^(filter|map|forEach|find|some|every|flatMap|reduce|sort|findIndex|findLast)$/, MUT = /^(push|splice|unshift|pop|shift|sort|reverse|fill)$/;
const FNT = new Set(['arrow_function', 'function_expression', 'function_declaration', 'generator_function_declaration']);
const collOf = t => (COLL.find(([, re]) => re.test(String(t).replace(/\.filter\([^)]*\)$/, ''))) || [])[0] || null;
const lookupOf = t => (LOOKUP.find(([, re]) => re.test(String(t))) || [])[0] || null;
const same = (a, b) => !!a && !!b && a.startIndex === b.startIndex && a.endIndex === b.endIndex;
const scopeOf = (n, root) => { for (let p = n.parent; p; p = p.parent) { if (p.startIndex === root.startIndex && p.endIndex === root.endIndex) return root; if (FNT.has(p.type)) return p; } return root; };
const fileOf = loc => String(loc || '').split(':')[0];

// 이름에 묶인 것(가장 가까운 함수 범위부터 바깥으로): 엔티티 하나는 '종류', 엔티티 목록은 '[]종류'
function bindOf(id, ctx) { for (let sc = scopeOf(id, ctx.root); ; sc = scopeOf(sc, ctx.root)) { const t = ctx.B.get(`${sc.startIndex}:${id.text}`); if (t) return t; if (same(sc, ctx.root)) return null; } }
function typeOfId(id, ctx) { const b = bindOf(id, ctx); return b && !b.startsWith('[]') ? b : null; }
// 식이 엔티티 목록이면 그 종류: 컬렉션(G.chars …), 목록에 묶인 이름, 목록.filter/slice/sort(…), ids.map(charById)
function collType(v, ctx) { if (!v) return null; const t = collOf(v.text);
  if (t === '적') { const o = v.type === 'member_expression' ? v.childForFieldName('object') : null; return o && o.type === 'identifier' && typeOfId(o, ctx) === '스테이지' ? t : null; } /* 스테이지에 딸린 적만(전투 중 B.enemies 같은 상태는 data가 아님) */
  if (t) return t;
  if (v.type === 'identifier') { const b = bindOf(v, ctx); return b && b.startsWith('[]') ? b.slice(2) : null; }
  if (v.type === 'await_expression' || v.type === 'parenthesized_expression') return collType(v.namedChildren[0], ctx);
  if (v.type === 'binary_expression' && /\|\||\?\?/.test(v.childForFieldName('operator')?.text || '')) return collType(v.childForFieldName('left'), ctx); /* g.chars||[] */
  if (v.type !== 'call_expression' || v.childForFieldName('function')?.type !== 'member_expression') return null; const f = v.childForFieldName('function'), p = f.childForFieldName('property')?.text || '';
  if (/^(filter|slice|sort|concat|reverse|toSorted)$/.test(p)) return collType(f.childForFieldName('object'), ctx);
  if (p === 'map') { const a = v.childForFieldName('arguments')?.namedChildren[0]; return a ? lookupOf(FNT.has(a.type) ? (a.childForFieldName('body')?.text || '') : a.text + '(') : null; }
  return null; }
// 식의 엔티티 종류: 찾기 함수·생성 함수 호출, 컬렉션[i], 묶인 이름, await
function exprType(v, ctx) { if (!v) return null;
  if (v.type === 'call_expression') return lookupOf(v.text) || ctx.fac.get(v.childForFieldName('function')?.text) || null;
  if (v.type === 'subscript_expression') return collType(v.childForFieldName('object'), ctx);
  if (v.type === 'identifier') return typeOfId(v, ctx);
  if (v.type === 'await_expression' || v.type === 'parenthesized_expression') return exprType(v.namedChildren[0], ctx);
  return null; }
const paramsOf = fn => fn.childForFieldName('parameters')?.namedChildren || (fn.childForFieldName('parameter') ? [fn.childForFieldName('parameter')] : []);
const paramName = p => p.type === 'identifier' ? p.text : p.type === 'assignment_pattern' ? p.childForFieldName('left')?.text : null;
// 함수 하나 안의 묶음(범위 시작:이름 → 종류). pt: 매개변수 종류 [Set] — 종류가 하나일 때만 씀(여럿이면 어느 것인지 모름). self: 이 함수가 생성 함수면 그 종류
function bindingsOf(fn, pt, fac, self) { const ctx = { root: fn, B: new Map(), fac }, set = (sc, nm, t) => { if (nm && t) ctx.B.set(`${sc.startIndex}:${nm}`, t); };
  paramsOf(fn).forEach((p, i) => { const s = pt && pt[i]; if (s && s.size === 1) set(fn, paramName(p), [...s][0]); });
  walk(fn, n => {
    if (n.type === 'call_expression') { const f = n.childForFieldName('function'); if (f?.type !== 'member_expression' || !ITER.test(f.childForFieldName('property')?.text || '')) return; const ty = collType(f.childForFieldName('object'), ctx); if (!ty) return;
      const cb = n.childForFieldName('arguments')?.namedChildren.find(a => FNT.has(a.type)); if (!cb) return; const ps = paramsOf(cb)[f.childForFieldName('property').text === 'reduce' ? 1 : 0]; if (ps) set(cb, paramName(ps), ty); }
    else if (n.type === 'for_in_statement') { const l = n.childForFieldName('left'); if (l?.type === 'identifier') set(scopeOf(n, fn), l.text, collType(n.childForFieldName('right'), ctx)); }
    else if (n.type === 'variable_declarator' || (n.type === 'assignment_expression' && n.childForFieldName('left')?.type === 'identifier')) { const nm = n.childForFieldName(n.type === 'variable_declarator' ? 'name' : 'left'), v = n.childForFieldName(n.type === 'variable_declarator' ? 'value' : 'right'), ct = collType(v, ctx), ty = ct ? '[]' + ct : exprType(v, ctx); if (nm?.type === 'identifier' && ty) set(scopeOf(n, fn), nm.text, ty); } /* let c=null; … c=await aiAltChar(…) 도 */
    else if (self && n.type === 'return_statement') { const r = n.namedChildren[0]; if (r?.type === 'identifier') set(scopeOf(n, fn), r.text, self); } });
  return ctx; }
// 쓰기인가: c.f = … · c.f.x = … · c.f.push(…) · delete c.f · c.f++
function isWrite(n) { let m = n;
  for (let up = m.parent; up && up.type === 'member_expression' && same(up.childForFieldName('object'), m); up = up.parent) { if (up.parent?.type === 'call_expression' && same(up.parent.childForFieldName('function'), up) && MUT.test(up.childForFieldName('property')?.text || '')) return true; m = up; }
  const par = m.parent; if (!par) return false;
  if ((par.type === 'assignment_expression' || par.type === 'augmented_assignment_expression') && same(par.childForFieldName('left'), m)) return true;
  return par.type === 'update_expression' || (par.type === 'unary_expression' && /^delete\b/.test(par.text)); }
const litKeys = ob => ob.namedChildren.map(pr => pr.type === 'pair' ? pr.childForFieldName('key')?.text : pr.type === 'shorthand_property_identifier' ? pr.text : null).filter(Boolean).map(k => k.replace(/^['"]|['"]$/g, ''));
// 함수 안의 엔티티 필드 접근 → Map('종류.필드' → {r,w})
function fieldsOf(ctx) { const out = new Map(), add = (t, f, w) => { const k = `${t}.${f}`, o = out.get(k) || { r: false, w: false }; o[w ? 'w' : 'r'] = true; out.set(k, o); };
  walk(ctx.root, n => {
    if (n.type === 'member_expression') { const o = n.childForFieldName('object'), p = n.childForFieldName('property'); if (o?.type !== 'identifier' || !p || !/^[A-Za-z_$][\w$]*$/.test(p.text)) return; const t = typeOfId(o, ctx); if (t) add(t, p.text, isWrite(n)); }
    else if (n.type === 'variable_declarator' && n.childForFieldName('value')?.type === 'object' && n.childForFieldName('name')?.type === 'identifier') { const t = typeOfId(n.childForFieldName('name'), ctx); if (t) litKeys(n.childForFieldName('value')).forEach(k => add(t, k, true)); } /* 생성 함수의 const c={…} */
    else if (n.type === 'call_expression' && n.childForFieldName('function')?.text === 'Object.assign') { const [a, ...rest] = n.childForFieldName('arguments')?.namedChildren || []; const t = a?.type === 'identifier' ? typeOfId(a, ctx) : null; if (t) rest.filter(x => x.type === 'object').forEach(ob => litKeys(ob).forEach(k => add(t, k, true))); } });
  return out; }
// 생성 함수: 컬렉션.push(F(…)) · push(v)(v = F(…)) · push(...xs.map(F)) 의 F, 또 안에서 컬렉션.push(v) 하고 v를 돌려주는 함수 → 그 컬렉션의 종류
function factories(fns, nameMap) { const fac = new Map();
  for (const f of fns.values()) { if (!f.top) continue; const local = new Map(), pushed = new Map(), rets = new Set();
    walk(f.node, n => { if (n.type === 'return_statement' && n.namedChildren[0]?.type === 'identifier') rets.add(n.namedChildren[0].text); else if (n.type === 'call_expression' && n.childForFieldName('function')?.type === 'member_expression' && n.childForFieldName('function').childForFieldName('property')?.text === 'push') { const ty = collOf(n.childForFieldName('function').childForFieldName('object')?.text || ''), a = n.childForFieldName('arguments')?.namedChildren[0]; if (ty && a?.type === 'identifier') pushed.set(a.text, ty); } });
    for (const [v, ty] of pushed) if (rets.has(v) && !fac.has(f.name)) fac.set(f.name, ty);
    walk(f.node, n => { if (n.type === 'variable_declarator' && n.childForFieldName('value')?.type === 'call_expression') local.set(n.childForFieldName('name')?.text, n.childForFieldName('value').childForFieldName('function')?.text); });
    walk(f.node, n => { if (n.type !== 'call_expression') return; const fn = n.childForFieldName('function'); if (fn?.type !== 'member_expression' || fn.childForFieldName('property')?.text !== 'push') return; const ty = collOf(fn.childForFieldName('object')?.text || ''); if (!ty) return;
      for (const a of n.childForFieldName('arguments')?.namedChildren || []) { const inner = a.type === 'spread_element' ? a.namedChildren[0] : a, callee = inner?.type === 'call_expression' ? (inner.childForFieldName('function')?.type === 'member_expression' && /\.map$/.test(inner.childForFieldName('function').text) ? inner.childForFieldName('arguments')?.namedChildren[0]?.text : inner.childForFieldName('function')?.text) : inner?.type === 'identifier' ? local.get(inner.text) : null;
        if (callee && nameMap.has(callee) && !fac.has(callee)) fac.set(callee, ty); } }); }
  return fac; }
// 매개변수 종류: 호출 지점의 인자 종류를 받는 쪽 매개변수로(세 번 되풀이 — 여러 단계 넘김)
function paramTypes(fns, nameMap, fac, PT = new Map()) {
  for (let pass = 0; pass < 3; pass++) { let changed = false;
    for (const f of fns.values()) { if (!f.top) continue; const ctx = bindingsOf(f.node, PT.get(f.key), fac, fac.get(f.name));
      walk(f.node, n => { if (n.type !== 'call_expression' || n.childForFieldName('function')?.type !== 'identifier') return; const ck = nameMap.get(n.childForFieldName('function').text); if (!ck || ck === f.key) return;
        (n.childForFieldName('arguments')?.namedChildren || []).forEach((a, i) => { const t = exprType(a, ctx); if (!t) return; const arr = PT.get(ck) || []; arr[i] = arr[i] || new Set(); if (!arr[i].has(t)) { arr[i].add(t); changed = true; } PT.set(ck, arr); }); }); }
    if (!changed) break; }
  return PT; }

// 구조 판정: 종류를 모르는 매개변수가 읽고 쓰는 필드가 한 엔티티에만 있는 필드(다른 곳에서 종류가 확실한 접근으로 모은 것)로 2개 이상·75% 이상이면 그 종류 — 이름으로 짐작하지 않음
//   (예: 리마스터 balRemasterAI(c)는 auditFixOne(rule,o)처럼 종류가 섞인 곳에서도 불려 전파로는 모르지만, c.skills·c.skillPlan·c.generation …은 캐릭터에만 있음)
function duckParams(fns, PT, fieldTypes) { let n = 0;
  for (const f of fns.values()) { if (!f.top) continue; paramsOf(f.node).forEach((p, i) => { const nm = paramName(p), cur = PT.get(f.key)?.[i]; if (!nm || (cur && cur.size === 1)) return; const votes = new Map(); let all = 0, seen = new Set();
      walk(f.node, m => { if (m.type !== 'member_expression' || m.childForFieldName('object')?.text !== nm) return; const pr = m.childForFieldName('property')?.text; if (!pr || seen.has(pr)) return; seen.add(pr); const ts = fieldTypes.get(pr); if (ts && ts.size === 1) { const t = [...ts][0]; votes.set(t, (votes.get(t) || 0) + 1); all++; } });
      const [t, v] = [...votes].sort((a, b) => b[1] - a[1])[0] || []; if (t && v >= 2 && v / all >= 0.75) { const arr = PT.get(f.key) || []; arr[i] = new Set([t]); PT.set(f.key, arr); n++; } }); }
  return n; }
// 단계 시작점: 생성·실행 중 AI·불러오기·사용자(액션 처리기·main 리스너 — lib/lifecycle.mjs) + 모듈 안 클릭 리스너가 부르는 함수(전투 편집기 등)도 사용자
//   + 시작: 앱을 열 때 도는 최상위 문장(부팅·게임 열기 — setTimeout(()=>skillResume()) 등)과 load·저장소 준비 리스너가 부르는 함수 → 실행기
// 진행 접근 함수(칸 하나를 돌려주는 함수)는 상태 흐름의 일이라 lib/flow.mjs에 있음
export { progAccessors } from './flow.mjs';
import { progAccessors, PROG_BASE } from './flow.mjs';
// 쓰기인가(멤버·첨자 사슬): x.a = … · x[k] -= … · x.a.push(…) · x.n++ · delete x.a
function writtenAt(n) { let m = n;
  for (let up = m.parent; up && (up.type === 'member_expression' || up.type === 'subscript_expression') && same(up.childForFieldName('object'), m); up = up.parent) { if (up.type === 'member_expression' && up.parent?.type === 'call_expression' && same(up.parent.childForFieldName('function'), up) && MUT.test(up.childForFieldName('property')?.text || '')) return true; m = up; }
  const par = m.parent; if (!par || same(m, n)) return false; /* 받은 객체 자체를 바꿔 끼우는 것(r=…)은 진행 쓰기가 아님 */
  if ((par.type === 'assignment_expression' || par.type === 'augmented_assignment_expression') && same(par.childForFieldName('left'), m)) return true;
  return par.type === 'update_expression' || (par.type === 'unary_expression' && /^delete\b/.test(par.text)); }
// 함수마다 진행 접근 함수로 받은 객체에 쓰는 칸과 읽는 칸: 접근 함수 호출(CRES() …) · 칸 이름을 받는 진행 접근(progSlot('cres')·progRead('cres')) ·
//   그 결과의 하위 칸 사슬(RG().run · const run=RG().run)을 받아 둔 변수 — 그 변수의 칸을 바꾸거나 늘리면 쓰기 → 함수 키별 쓰기·읽기 칸 모음
export const PROG_BY_NAME = /^(progSlot|progRead)$/;
function accSlot(n, acc) { for (let x = n; x; x = x.childForFieldName('object')) { if (x.type === 'call_expression') { const fn = x.childForFieldName('function')?.text, as = x.childForFieldName('arguments')?.namedChildren || []; if (acc.has(fn) && !as.length) return acc.get(fn); if (PROG_BY_NAME.test(fn || '') && as[0]?.type === 'string') return as[0].text.slice(1, -1); return null; } if (x.type !== 'member_expression' && x.type !== 'subscript_expression') return null; } return null; }
export function accessorUse(fns, acc) { const out = new Map();
  for (const f of fns.values()) { if (!f.top || acc.has(f.name)) continue; const bound = new Map(), rec = { w: new Set(), r: new Set() };
    walk(f.node, n => { if (n.type !== 'variable_declarator') return; const v = n.childForFieldName('value'), k = v ? accSlot(v, acc) : null; if (k && n.childForFieldName('name')?.type === 'identifier') bound.set(n.childForFieldName('name').text, k); });
    walk(f.node, n => { const k = n.type === 'identifier' ? bound.get(n.text) : n.type === 'call_expression' ? accSlot(n, acc) : null; if (!k) return;
      if (n.type === 'identifier' && (n.parent?.type === 'variable_declarator' && same(n.parent.childForFieldName('name'), n))) return; rec[writtenAt(n) ? 'w' : 'r'].add(k); });
    if (rec.w.size || rec.r.size) out.set(f.key, rec); }
  return out; }
// 진행 상태 정의가 어디 있나(일원화 점검 — 원안은 한 파일이라 진행 칸의 기본값·만들기·리셋·형식 보정이 한 덩어리였음, 모듈 분할 뒤 갈렸는지):
//   칸마다 기본값 자리(DEFAULT_PROG · 불러오기 보정 fix·defaults · 진행 접근 함수의 없을 때 만들기)와 그 모듈, 접근 함수, 칸을 쓰는 모듈(직접 + 접근 함수로 — 칸 속을 바꾸는 깊은 쓰기 포함)
export function progSlots(units, fns, sf) { const acc = progAccessors(fns), use = accessorUse(fns, acc), DP = constLiterals(units, ['DEFAULT_PROG']).DEFAULT_PROG || {}, mod = k => moduleOf(fileOf(fns.get(k)?.loc)), slots = new Map(), S = k => { if (!slots.has(k)) slots.set(k, { defs: new Set(), acc: [], w: new Set(), r: new Set() }); return slots.get(k); };
  const dpFile = (() => { for (const u of units) for (const fl of u.files || []) if (fl.path && u.text.split('\n').slice(fl.start, fl.end).some(l => /\bDEFAULT_PROG\s*=/.test(l))) return moduleOf(fl.path); return 'DEFAULT_PROG'; })();
  Object.keys(DP).forEach(k => S(k).defs.add(dpFile));
  /* 진행 칸 정의 표(PROG_SLOTS — 없을 때 만들기·하루/주 새로 만들기·형식 맞춤)의 칸도 정의 자리 */ for (const u of units) walk(u.tree.rootNode, n => { if (n.type !== 'variable_declarator' || n.childForFieldName('name')?.text !== 'PROG_SLOTS' || n.childForFieldName('value')?.type !== 'object') return; const m = moduleOf(u.at(n.startPosition.row).file); for (const pr of n.childForFieldName('value').namedChildren) if (pr.type === 'pair') S(pr.childForFieldName('key').text).defs.add(m); return false; });
  for (const [n, k] of acc) { const f = [...fns.values()].find(x => x.top && x.name === n); S(k).acc.push(n); S(k).defs.add(mod(f.key)); }
  for (const f of fns.values()) { if (!f.top) continue; const alias = new Set(['P()', 'G.prog']), m = mod(f.key), loadFix = /^(fix|defaults)$/.test(f.name); walk(f.node, n => { if (n.type === 'variable_declarator' && PROG_BASE.test(n.childForFieldName('value')?.text || '')) alias.add(n.childForFieldName('name')?.text); else if (n.type === 'variable_declarator' && /^(g|game)\.prog$/.test(n.childForFieldName('value')?.text || '') && loadFix) alias.add(n.childForFieldName('name')?.text); });
    walk(f.node, n => { if (n.type !== 'member_expression') return; const o = n.childForFieldName('object')?.text, k = n.childForFieldName('property')?.text; if (!k || !(alias.has(o) || (loadFix && /^(g|game|d)\.prog$/.test(o)))) return; const w = writtenAt(n) || ((n.parent?.type === 'assignment_expression' || n.parent?.type === 'augmented_assignment_expression') && same(n.parent.childForFieldName('left'), n));
      if (loadFix && w) S(k).defs.add(m); else if (!acc.has(f.name)) S(k)[w ? 'w' : 'r'].add(m); }); }
  for (const [fk, u] of use) { u.w.forEach(k => S(k).w.add(mod(fk))); u.r.forEach(k => S(k).r.add(mod(fk))); }
  const rows = [...slots].map(([k, v]) => ({ slot: k, defs: [...v.defs].sort(), acc: v.acc, writers: [...v.w].sort(), readers: [...v.r].sort() })).sort((a, b) => a.slot.localeCompare(b.slot));
  const accMods = [...new Set(rows.flatMap(r => r.acc.map(n => mod([...fns.values()].find(x => x.top && x.name === n).key))))].sort(), defPlaces = [...new Set(rows.flatMap(r => r.defs))].sort();
  return { rows, accMods, defPlaces, multiDef: rows.filter(r => r.defs.length > 1).length, multiAcc: rows.filter(r => r.acc.length > 1).length }; }
const LOAD_EV = /^['"](load|DOMContentLoaded|ggm-storage-ok|pageshow)['"]$/;
function calleesIn(node, nameMap, out) { walk(node, m => { if (m.type === 'call_expression' && m.childForFieldName('function')?.type === 'identifier') { const k = nameMap.get(m.childForFieldName('function').text); if (k) out.add(k); } }); }
const declOnly = st => FNT.has(st.type) || ((st.type === 'lexical_declaration' || st.type === 'variable_declaration') && st.namedChildren.every(d => FNT.has(d.childForFieldName('value')?.type)));
function stagesOf(units, fns, nameMap, sf, progW = new Set()) { const R = stageRoots(units, fns), user = new Set(), start = new Set();
  for (const u of units) walk(u.tree.rootNode, n => { if (n.type !== 'call_expression' || !/addEventListener$/.test(n.childForFieldName('function')?.text || '')) return; const as = n.childForFieldName('arguments')?.namedChildren || [], cb = as.find(a => FNT.has(a.type)); if (cb) calleesIn(cb, nameMap, LOAD_EV.test(as[0]?.text || '') ? start : user); });
  for (const u of units) for (const st of u.tree.rootNode.namedChildren) { if (declOnly(st)) continue; const lis = st.type === 'expression_statement' && st.namedChildren[0]?.type === 'call_expression' && /addEventListener$/.test(st.namedChildren[0].childForFieldName('function')?.text || ''); if (!lis) calleesIn(st, nameMap, start); } /* 리스너 등록문은 위에서 갈랐음 */
  R.사용자 = [...new Set([...R.사용자, ...user])]; R.시작 = [...start];
  /* 닿는 함수: 호출 그래프 + 이름으로 부르는 모듈 함수(main → 전투 모듈 등 단위를 넘는 호출). 공용 도구(render·toast·mark …)는 건너뜀 — lib/wiring.mjs closure와 같은 깊이 */
  const calls = new Map(); for (const f of fns.values()) { if (!f.top) continue; const s = new Set(f.calls.keys()); calleesIn(f.node, nameMap, s); calls.set(f.key, s); }
  const reach = (roots, depth) => { const seen = new Map(); let q = roots.filter(r => fns.has(r)).map(r => [r, 0]); while (q.length) { const [k, d] = q.shift(); if (seen.has(k)) continue; seen.set(k, d); if (d >= depth) continue; for (const c of calls.get(k) || []) { const g = fns.get(c); if (g && g.top && !INFRA.test(g.name) && !seen.has(c)) q.push([c, d + 1]); } } return seen; };
  const S = Object.fromEntries(Object.entries(R).map(([k, roots]) => [k, reach(roots, k === '불러오기' ? 2 : k === '사용자' ? 4 : k === '시작' ? 3 : 5)]));
  /* 플레이 조작: 사용자 단계에서 진행(prog — 직접 P().x든 CRES()·CBUILD() 같은 접근 함수로 받은 객체든)을 쓰는 함수, 모든 기능으로 넘기는 액션 분배기는 뺌.
     실행기(플레이) = 플레이 조작에서 두 단계 안(예: 건조 conBuild → 바리에이션 conMakeVariant) · 편집기 = 사용자 시작점에서 플레이 조작을 거치지 않고 닿는 것 */
  const play = [...progW].filter(k => S.사용자.has(k) && !/^handle\w+Action$/.test(fns.get(k)?.name || '')), playSet = new Set(play);
  S.플레이 = reach(play, 2); const ed = new Map(); let q = R.사용자.filter(r => fns.has(r) && !playSet.has(r)).map(r => [r, 0]);
  while (q.length) { const [k, d] = q.shift(); if (ed.has(k)) continue; ed.set(k, d); if (d >= 4) continue; for (const c of calls.get(k) || []) { const g = fns.get(c); if (g && g.top && !INFRA.test(g.name) && !ed.has(c) && !playSet.has(c)) q.push([c, d + 1]); } }
  S.편집 = ed; return S; }
// 상태 키(G.chars · G.meta.x · G.world.x · P().x) → [data 파일, 경로]. 종류(DATA_TYPES — 앱 0525가 나누는 파일)에 없으면 game.json
export function keyPath(key, types) { const a = String(key).split('.');
  if (a[0] === 'P()') return ['prog.json', a.slice(1).join('.')]; if (a[0] !== 'G' || a.length < 2) return null;
  if (a[1] === 'meta' || a[1] === 'world') return [`${a[1]}.json`, a.slice(2).join('.')]; if (a[1] === 'prog') return ['prog.json', a.slice(2).join('.')];
  return types.includes(a[1]) ? [`${a[1]}.json`, a.slice(2).join('.')] : ['game.json', a.slice(1).join('.')]; }
export const entPath = (t, f) => [`${ENT[t][0]}.json`, `${ENT[t][1]}.${f}`];
export const pathKey = ([file, p]) => p ? `${file} › ${p}` : file;
function pfIds(node) { const s = new Set(); walk(node, n => { if (n.type !== 'call_expression' || !/^(pf|promptFrag)$/.test(n.childForFieldName('function')?.text || '')) return; const a = n.childForFieldName('arguments')?.namedChildren[0]; if (a?.type === 'string') s.add(a.text.slice(1, -1)); }); return s; }
// 역할: (함수, 쓰는 파일) → 생성기·실행기·편집기·기타
export function rolesOf(S, k, file) { const r = new Set(), gen = S.생성.has(k); if (gen) r.add('생성기'); if (S['실행 중 AI'].has(k) || S.불러오기.has(k) || S.시작?.has(k)) r.add('실행기'); if (S.사용자.has(k) && !gen) { const play = !!S.플레이?.has(k); if (file === 'prog.json' || play) r.add('실행기'); if (file !== 'prog.json' && (!play || S.편집?.has(k))) r.add('편집기'); } /* 콘텐츠: 플레이 조작에서 닿으면 실행기, 플레이를 거치지 않고도 닿으면 편집기도 */ if (!r.size) r.add('기타'); return [...r]; }

// 종류 추적 준비: 이름 → 함수 키, 단계(역할), 생성 함수, 매개변수 종류(호출 전파 + 구조 판정)
function typing(units, fns, sf) { const nameMap = new Map(), acc = progAccessors(fns), use = accessorUse(fns, acc);
  for (const f of fns.values()) if (f.top && (!nameMap.has(f.name) || f.unit === 'main')) nameMap.set(f.name, f.key);
  const progW = new Set([...sf.list.filter(x => x.key.startsWith('P().')).flatMap(x => [...x.w]), ...[...use].filter(([, u]) => u.w.size).map(([k]) => k)]);
  const S = stagesOf(units, fns, nameMap, sf, progW), fac = factories(fns, nameMap), PT = paramTypes(fns, nameMap, fac), fieldTypes = new Map(), ctxOf = f => bindingsOf(f.node, PT.get(f.key), fac, fac.get(f.name));
  for (const f of fns.values()) if (f.top) for (const tf of fieldsOf(ctxOf(f)).keys()) { const [t, fld] = tf.split('.'); if (!fieldTypes.has(fld)) fieldTypes.set(fld, new Set()); fieldTypes.get(fld).add(t); }
  if (duckParams(fns, PT, fieldTypes)) paramTypes(fns, nameMap, fac, PT); /* 구조로 정한 매개변수 종류도 호출 따라 넘김 */
  return { nameMap, S, ctxOf, use }; }
// data 경로마다 쓰는 함수(역할)·읽는 함수: 상태 키 · 생성 중인 게임(ng.*) · 엔티티 필드. entFields: 필드 이름 → 종류들
function collectData(fns, sf, T, types) { const data = new Map(), entFields = new Map(), D = kp => { const k = pathKey(kp); if (!data.has(k)) data.set(k, { file: kp[0], path: kp[1], w: new Map(), r: new Set(), audits: new Set() }); return data.get(k); };
  const W = (kp, fk) => { if (kp && fns.has(fk)) { const d = D(kp); if (!d.w.has(fk)) d.w.set(fk, rolesOf(T.S, fk, kp[0])); } }, R = (kp, fk) => { if (kp && fns.has(fk)) D(kp).r.add(fk); };
  for (const x of sf.list) { const kp = keyPath(x.key, types); x.w.forEach(w => W(kp, w)); x.r.forEach(r => R(kp, r)); }
  for (const [k, ws] of generatorVocab(fns, T.S.생성.keys(), new Set()).writes) [...ws].forEach(w => W(keyPath(k, types), w));
  for (const [fk, u] of T.use) { u.w.forEach(k => W(['prog.json', k], fk)); u.r.forEach(k => R(['prog.json', k], fk)); } /* 진행 접근 함수로 받은 객체(CRES() …) */
  for (const f of fns.values()) { if (!f.top) continue; for (const [tf, rw] of fieldsOf(T.ctxOf(f))) { const [t, fld] = tf.split('.'), kp = entPath(t, fld); if (rw.w) W(kp, f.key); if (rw.r) R(kp, f.key); if (!entFields.has(fld)) entFields.set(fld, new Set()); entFields.get(fld).add(t); } }
  return { data, entFields }; }
// 점검 규칙 → 그 규칙이 보는 필드·키의 경로. 여러 규칙이 거르기로만 같이 읽는 필드(예: 이격 제외 !c.alt — 규칙 6개 넘게)와 파일 전체(G.chars 등)는 빼서 잡음 없이
function attachAudits(data, rules, entFields, types) { const SC = { char: '캐릭터', stage: '스테이지', lib: '자료' }, byField = new Map(), add = (k, id) => { if (k && data.has(k)) data.get(k).audits.add(id); };
  rules.forEach(r => r.fields.forEach(f => byField.set(f, (byField.get(f) || 0) + 1)));
  for (const r of rules) { r.fields.filter(f => byField.get(f) <= 6).forEach(fld => (SC[r.scope] ? [SC[r.scope]] : [...(entFields.get(fld) || [])]).forEach(t => add(pathKey(entPath(t, fld)), r.id))); r.keys.forEach(key => { const kp = keyPath(key, types); add(kp && kp[1] && pathKey(kp), r.id); }); } }
// 프롬프트 조각: 함수 안 pf('ID') + 부르는 프롬프트 스튜디오 함수(두 단계)
function promptIndex(fns, nameMap) { const studio = moduleOf(fileOf(fns.get(nameMap.get('pfDef'))?.loc)), own = new Map([...fns.values()].filter(f => f.top).map(f => [f.key, pfIds(f.node)]));
  return k => { const out = new Set(own.get(k) || []), seen = new Set([k]); let q = [k];
    for (let d = 0; d < 2; d++) { const nx = []; for (const x of q) for (const c of fns.get(x)?.calls.keys() || []) { const g = fns.get(c); if (!g || seen.has(c) || moduleOf(fileOf(g.loc)) !== studio) continue; seen.add(c); (own.get(c) || []).forEach(id => out.add(id)); nx.push(c); } q = nx; }
    return out; }; }
// index.html 줄: 단위(main·모듈 블록) 글이 빌드 결과의 몇째 줄에서 시작하나
const wwwBase = (units, html) => new Map(units.map(u => { const i = html ? html.indexOf(u.text) : -1; return [u.name, i < 0 ? null : html.slice(0, i).split('\n').length]; }));
function fnIndex(fns, data, prompts, base) { const FN = {}, used = new Set([...data.values()].flatMap(d => [...d.w.keys(), ...d.r]));
  for (const f of fns.values()) { if (!f.top || !used.has(f.key)) continue; const b = base.get(f.unit); FN[f.key] = { name: f.name, file: fileOf(f.loc), module: moduleOf(fileOf(f.loc)), line: +String(f.loc).split(':')[1] || 0, www: b == null ? null : b + f.node.startPosition.row, prompts: [...prompts(f.key)].sort() }; }
  return FN; }
// 모듈: 파일(index.html 줄 범위)·함수 수·다른 모듈로 부르는 수
function moduleSummary(units, fns, base) { const mods = {}, M = m => mods[m] || (mods[m] = { files: [], fns: 0, roles: {}, writes: new Set(), reads: new Set(), calls: new Map() });
  for (const u of units) for (const fl of u.files || []) { const b = base.get(u.name); M(moduleOf(fl.path)).files.push({ file: fl.path, www: b == null ? null : [b + fl.start, b + fl.end - 1] }); }
  for (const f of fns.values()) { if (!f.top) continue; const m = moduleOf(fileOf(f.loc)); M(m).fns++; for (const c of f.calls.keys()) { const g = fns.get(c); if (!g?.top) continue; const cm = moduleOf(fileOf(g.loc)); if (cm !== m) M(m).calls.set(cm, (M(m).calls.get(cm) || 0) + 1); } }
  return { mods, M }; }
// data 경로 정리(역할별 쓰는 함수·읽는 모듈·점검 규칙·프롬프트 조각) + 모듈에 쓰는 data·역할 수
function dataSummary(data, FN, M) { const DATA = {};
  for (const [k, d] of [...data.entries()].sort((a, b) => a[0].localeCompare(b[0]))) { if (!d.w.size && !d.r.size) continue; const writers = {}, rmods = {};
    for (const [fk, roles] of d.w) { roles.forEach(r => (writers[r] ||= []).push(fk)); const m = FN[fk]?.module; if (m) { M(m).writes.add(k); roles.forEach(r => { M(m).roles[r] = (M(m).roles[r] || 0) + 1; }); } }
    d.r.forEach(fk => { const m = FN[fk]?.module; if (m) { rmods[m] = (rmods[m] || 0) + 1; M(m).reads.add(k); } });
    DATA[k] = { file: d.file, path: d.path, writers: Object.fromEntries(Object.entries(writers).map(([r, a]) => [r, a.sort()])), readers: Object.entries(rmods).sort((a, b) => b[1] - a[1]), audits: [...d.audits].sort(), prompts: [...new Set([...d.w.keys()].flatMap(fk => FN[fk]?.prompts || []))].sort() }; }
  return DATA; }
// 맵 만들기. html: 빌드된 www/index.html(함수·파일의 index.html 줄)
export function buildMap(units, fns, sf, html = '') { const types = constLiterals(units, ['DATA_TYPES']).DATA_TYPES || [], T = typing(units, fns, sf), { data, entFields } = collectData(fns, sf, T, types);
  attachAudits(data, auditRules(units, fns, sf), entFields, types);
  const base = wwwBase(units, html), FN = fnIndex(fns, data, promptIndex(fns, T.nameMap), base), { mods, M } = moduleSummary(units, fns, base), DATA = dataSummary(data, FN, M);
  const MODS = Object.fromEntries(Object.entries(mods).sort((a, b) => a[0].localeCompare(b[0])).map(([m, v]) => [m, { files: v.files, fns: v.fns, roles: v.roles, writes: [...v.writes].sort(), reads: v.reads.size, neighbors: [...v.calls].sort((a, b) => b[1] - a[1]).slice(0, 8) }]));
  /* index.html 기능 표면(메뉴 → 화면·패널·창 · 배경 — 화면 단위)과 아키텍처(계층 MVC · 같은 데이터·처리로 묶은 기능 · 모듈 판정 · 저장 정책) — 함수마다 자리·계층·기능을 함수 색인에 */
  const SO = surfaceOf(units, fns, html), S = surfaceMap(units, fns, SO), keyUse = new Map(), K = (fk, k, rw) => { if (!keyUse.has(fk)) keyUse.set(fk, new Map()); if (rw === 'w' || !keyUse.get(fk).has(k)) keyUse.get(fk).set(k, rw); };
  for (const [k, d] of data) { for (const fk of d.w.keys()) K(fk, k, 'w'); for (const fk of d.r) K(fk, k, 'r'); }
  const A = archMap(units, fns, { writers: new Set([...data.values()].flatMap(d => [...d.w.keys()])), keyUse, sf: SO, louvain, layer: fragmentFiles(units).home, modOf: moduleOf });
  for (const [k, p] of Object.entries(S.place)) if (FN[k]) FN[k].place = p; for (const [k, x] of Object.entries(A.fnLayer)) if (FN[k]) Object.assign(FN[k], x);
  return { types, data: DATA, fns: FN, modules: MODS, surface: { tabs: S.tabs, feats: S.feats }, arch: { feats: A.feats, verdicts: A.verdicts, bad: A.bad, store: A.store, mixed: Object.fromEntries(Object.entries(A.fnLayer).filter(([, x]) => x.mix).map(([k, x]) => { const f = fns.get(k), [file, line] = f.loc.split(':'); return [k, { name: f.name, file, line: +line, mix: x.mix }]; })) } }; }

// 두 맵의 차이(증분 갱신 기록): 함수 추가·삭제·옮김, data 경로의 만드는 곳 추가·삭제
export function mapDiff(a, b) { const out = { fns: { added: [], removed: [], moved: [] }, data: [] }; if (!a) return out;
  for (const k of Object.keys(b.fns)) { if (!a.fns[k]) out.fns.added.push(k); else if (a.fns[k].file !== b.fns[k].file) out.fns.moved.push(`${k}: ${a.fns[k].file} → ${b.fns[k].file}`); }
  for (const k of Object.keys(a.fns)) if (!b.fns[k]) out.fns.removed.push(k);
  const ws = d => new Set(Object.entries(d?.writers || {}).flatMap(([r, fs]) => fs.map(f => `${r}:${f}`)));
  for (const k of new Set([...Object.keys(a.data), ...Object.keys(b.data)])) { const x = ws(a.data[k]), y = ws(b.data[k]), add = [...y].filter(v => !x.has(v)), del = [...x].filter(v => !y.has(v)); if (add.length || del.length) out.data.push({ path: k, added: add, removed: del }); }
  return out; }

// 게임 data에 그 경로의 값이 있나(목록 원소 중 하나라도) — 게임 파일 하나(G 모양)에서
export function valuesAt(game, file, path) { const root = file === 'game.json' ? game : file === 'prog.json' ? game.prog : game[file.replace(/\.json$/, '')]; let vs = [root];
  for (const tok of String(path || '').split('.').filter(Boolean)) { const arr = tok.endsWith('[]'), k = arr ? tok.slice(0, -2) : tok; vs = vs.flatMap(v => { const x = k ? (v == null ? undefined : v[k]) : v; return arr ? (Array.isArray(x) ? x : []) : [x]; }); }
  return vs.filter(v => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && !v.length) && !(typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length)); }
