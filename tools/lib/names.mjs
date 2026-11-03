// 이름 규칙: 지역 이름(콜백 매개변수·지역 변수·catch 매개변수)이 무엇에 묶였는지(종류)를 코드에서 자동으로 알아내 모으고,
// 종류마다 주로 쓰는 이름으로 규칙을 정한 뒤(tools/naming.json), 다른 종류의 규칙 이름을 쓰는 곳(모호한 이름)을 찾고 안전하게 바꿔요.
// 종류를 아는 경우만 셈: 게임 컬렉션을 도는 콜백(G.chars.map(c => …)), 찾기 함수 결과(const c = charById(…)), DOM 찾기, 이벤트 리스너 매개변수, catch 매개변수.
import { walk } from './source.mjs';

// 컬렉션(배열 식) → 종류
export const COLL = [['캐릭터', /(^|\.)chars(\(\))?$|^ownedChars\(\)$|^G\.chars$/], ['스테이지', /(^|\.)stages$/], ['적', /(^|\.)enemies$/], ['장', /(^|\.)chapters$/], ['자료', /^G\.lib$/],
  ['세력', /^factions\(\)$|(^|\.)factions$/], ['메신저', /^G\.threads$/], ['이벤트', /^G\.events$/], ['배너', /^G\.banners$/], ['NPC', /^G\.npcs$/], ['속성', /^ELEMS$/], ['자원키', /^CON_RES$/]];
// 값이 "그 함수의 호출 자체"일 때만 → 종류 (호출 결과의 멤버 $('#x').value 같은 것은 아님 — 예전엔 앞부분만 보고 문자열을 DOM 요소로 잘못 봤음)
export const LOOKUP = [['캐릭터', /^(charById|charOf|G\.chars\.find)$/], ['스테이지', /^stageById$/], ['세력', /^facByName$/], ['배너', /^(curBanner|G\.banners\.find)$/], ['진행', /^P$/],
  ['요소', /^(\$|document\.querySelector|document\.getElementById)$|\.closest$/], ['요소 목록', /^(\$\$|document\.querySelectorAll)$/]];
const ITER = /^(filter|map|forEach|find|some|every|flatMap|findIndex|findLast|sort)$/, FNT = new Set(['arrow_function', 'function_expression', 'function_declaration', 'method_definition']);
const scopeOf = n => { let s = n.parent; while (s && !FNT.has(s.type) && s.type !== 'program') s = s.parent; return s; };

// 바인딩 모으기: {name, kind, scope(노드), decl(노드), unit, loc}
export function bindings(units) { const out = [];
  for (const u of units) { if (!/^(main|module:)/.test(u.name)) continue;
    walk(u.tree.rootNode, n => {
      if (n.type === 'call_expression') { const f = n.childForFieldName('function'), args = n.childForFieldName('arguments'); if (f?.type !== 'member_expression' || !args) return; const m = f.childForFieldName('property')?.text || '';
        const cb = args.namedChildren.find(a => FNT.has(a.type)); if (!cb) return; const p0 = cb.childForFieldName('parameter') || cb.childForFieldName('parameters')?.namedChildren[0]; if (p0?.type !== 'identifier') return;
        if (ITER.test(m)) { const obj = f.childForFieldName('object')?.text || '', k = COLL.find(([, re]) => re.test(obj)); if (k) out.push({ name: p0.text, kind: k[0], scope: cb, decl: p0, unit: u, loc: u.loc(p0) }); }
        else if (m === 'addEventListener') out.push({ name: p0.text, kind: '이벤트 객체', scope: cb, decl: p0, unit: u, loc: u.loc(p0) }); }
      else if (n.type === 'variable_declarator') { const nm = n.childForFieldName('name'), v = n.childForFieldName('value'); if (nm?.type !== 'identifier' || v?.type !== 'call_expression') return; const fn = v.childForFieldName('function')?.text || '', k = LOOKUP.find(([, re]) => re.test(fn)); if (k) out.push({ name: nm.text, kind: k[0], scope: scopeOf(n), decl: nm, unit: u, loc: u.loc(nm) }); }
      else if (n.type === 'catch_clause') { const p = n.childForFieldName('parameter'); if (p?.type === 'identifier') out.push({ name: p.text, kind: '오류', scope: n, decl: p, unit: u, loc: u.loc(p) }); } }); }
  return out; }

// 모음: 이름 × 종류 횟수
export function inventory(B) { const byKind = new Map(), byName = new Map();
  for (const b of B) { if (!byKind.has(b.kind)) byKind.set(b.kind, new Map()); const m = byKind.get(b.kind); m.set(b.name, (m.get(b.name) || 0) + 1);
    if (!byName.has(b.name)) byName.set(b.name, new Map()); const k = byName.get(b.name); k.set(b.kind, (k.get(b.kind) || 0) + 1); }
  return { byKind, byName }; }
// 규칙 정하기: 바인딩이 많은 종류부터, 그 종류에서 가장 많이 쓴 이름 중 아직 다른 종류가 가져가지 않은 것
export function deriveConvention(inv) { const taken = new Set(), conv = {};
  const kinds = [...inv.byKind].sort((a, b) => [...b[1].values()].reduce((x, y) => x + y, 0) - [...a[1].values()].reduce((x, y) => x + y, 0));
  for (const [kind, m] of kinds) { const pick = [...m].sort((a, b) => b[1] - a[1]).find(([n]) => !taken.has(n)); if (pick) { conv[kind] = pick[0]; taken.add(pick[0]); } }
  return conv; }
// 모호한 이름: 규칙 이름이 아니면서, 그 이름이 다른 종류(같이 써도 되는 묶음 share 제외)에도 쓰이거나 다른 종류의 규칙 이름인 바인딩 — 분석·읽는 사람이 헷갈리는 곳
export function violations(B, conv, share = [], inv = inventory(B)) { const grp = k => (share.find(g => g.includes(k)) || [k]), owner = new Map();
  for (const [k, n] of Object.entries(conv)) { if (!owner.has(n)) owner.set(n, new Set()); owner.get(n).add(k); }
  return B.filter(b => conv[b.kind] && b.name !== conv[b.kind]).map(b => { const same = new Set(grp(b.kind)), others = [...(inv.byName.get(b.name) || new Map()).keys(), ...(owner.get(b.name) || [])].filter(k => !same.has(k));
    return others.length ? { ...b, want: conv[b.kind], clash: [...new Set(others)].join('·') } : null; }).filter(Boolean); }
// 안전한 이름 바꾸기 편집 목록: 범위 안에서 새 이름이 이미 쓰이면(선언·참조·단축 속성) 건너뜀, 안쪽 함수가 같은 이름을 다시 선언하면 그 안은 건드리지 않음
const declares = (fn, name) => { let d = false; const ps = fn.childForFieldName('parameter') ? [fn.childForFieldName('parameter')] : fn.childForFieldName('parameters')?.namedChildren || [];
  if (ps.some(p => p.text === name || (p.type !== 'identifier' && new RegExp(`\\b${name}\\b`).test(p.text)))) return true;
  walk(fn.childForFieldName('body') || fn, n => { if (d) return false; if (n !== fn && FNT.has(n.type)) return false; if (n.type === 'variable_declarator' && n.childForFieldName('name')?.text === name) d = true; }); return d; };
export function renameEdits(v) { const { scope, decl, name, want } = v, edits = []; let clash = false;
  walk(scope, n => { if (clash) return false; if ((n.type === 'identifier' || n.type === 'shorthand_property_identifier' || n.type === 'shorthand_property_identifier_pattern') && n.text === want) { clash = true; return false; } });
  if (clash) return { ok: false, why: `범위 안에 「${want}」가 이미 있음` };
  // 바깥 범위에 같은 이름이 있으면 가림 — 바깥 함수의 매개변수·선언, 바깥 catch 매개변수(catch(e){ … catch(e2) … }), 바깥 블록의 let/const
  const blockDeclares = (blk, name) => blk.namedChildren.some(st => (st.type === 'lexical_declaration' || st.type === 'variable_declaration') && st.namedChildren.some(d => d.type === 'variable_declarator' && d.childForFieldName('name')?.text === name));
  for (let a = scope.parent; a; a = a.parent) {
    if ((FNT.has(a.type) && declares(a, want)) || (a.type === 'catch_clause' && a.childForFieldName('parameter')?.text === want) || ((a.type === 'statement_block' || a.type === 'program') && blockDeclares(a, want)))
      return { ok: false, why: `바깥 범위의 「${want}」를 가림` }; }
  let bad = '';
  walk(scope, n => { if (bad) return false;
    if (n !== scope && FNT.has(n.type) && declares(n, name)) return false; // 안쪽에서 같은 이름을 다시 선언 → 다른 변수
    if (n.type === 'shorthand_property_identifier' && n.text === name) { edits.push({ start: n.startIndex, end: n.endIndex, text: `${name}: ${want}` }); return; }
    if (n.type === 'shorthand_property_identifier_pattern' && n.text === name) { bad = '구조 분해 단축 속성'; return false; }
    if (n.type === 'identifier' && n.text === name) edits.push({ start: n.startIndex, end: n.endIndex, text: want }); });
  if (bad) return { ok: false, why: bad };
  if (!edits.some(e => e.start === decl.startIndex)) return { ok: false, why: '선언을 찾지 못함' };
  return { ok: true, edits }; }
