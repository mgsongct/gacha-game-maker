// 생성기 ↔ 포크 기능 ↔ 생성물 배선 점검(정적 분석 + 생성된 게임 JSON):
//   기능 쪽: 기능이 들여온 함수(fork 커밋에서 새로 생긴 최상위 함수)가 읽는 데이터 키(G.meta.*·G.world.*·G.*·P().*)와, 원본에 없던 새 필드 이름
//   생성기 쪽: 생성 루트(buildNewGameDraft 등)에서 부르는 함수들이 쓰는 키(ng.*·G.* 대입, Object.assign 리터럴), 객체 리터럴 키, 프롬프트 JSON 스키마 키
//   생성물 쪽: tools/play/games/*/game.json에 그 키·필드가 있는지, 비었는지, 기본값(DEFAULT_META 등 소스 리터럴)과 같은지
// 결과: 기능마다 키·필드 표와 판정(생성기 미배선 · 배선됐지만 생성물에 없음 · 기본값 그대로).
import { walk } from './source.mjs';

// 멤버 사슬 → 정규화(ng·g는 생성 중인 게임 = G, .prog는 P()) → 'G.meta.x' / 'G.world.x' / 'P().x' / 'G.x' 로 자름
export function norm(text) { const m = String(text).replace(/\?\./g, '.').match(/^(ng|G|g)((?:\.\w+)*)$/); if (!m) return null; const parts = m[2].split('.').filter(Boolean); return parts[0] === 'prog' ? ['P()', ...parts.slice(1)].join('.') : ['G', ...parts].join('.'); }
export function cut(p) { if (!p) return null; const a = p.split('.'); if (a[0] === 'P()') return a.length > 1 ? a.slice(0, 2).join('.') : null; if (a[1] === 'meta' || a[1] === 'world') return a.length > 2 ? a.slice(0, 3).join('.') : null; return a.length > 1 ? a.slice(0, 2).join('.') : null; }
// 소스 리터럴 → 값(객체·배열·문자열·숫자·불·null만, 나머지는 undefined)
export function literal(n) {
  if (!n) return undefined;
  switch (n.type) {
    case 'string': return n.text.slice(1, -1);
    case 'template_string': return n.namedChildren.some(c => c.type === 'template_substitution') ? undefined : n.text.slice(1, -1);
    case 'number': return Number(n.text);
    case 'true': return true; case 'false': return false; case 'null': return null;
    case 'array': return n.namedChildren.map(literal);
    case 'object': { const o = {}; for (const p of n.namedChildren) { if (p.type !== 'pair') continue; const k = p.childForFieldName('key'); o[k.type === 'string' ? k.text.slice(1, -1) : k.text] = literal(p.childForFieldName('value')); } return o; }
    case 'parenthesized_expression': return literal(n.namedChildren[0]);
    default: return undefined;
  }
}
// 최상위 const NAME = {…} 리터럴 찾기(DEFAULT_META 등)
export function constLiterals(units, names) { const out = {};
  for (const u of units) walk(u.tree.rootNode, n => { if (n.type !== 'variable_declarator') return; const nm = n.childForFieldName('name')?.text; if (names.includes(nm) && !(nm in out)) out[nm] = literal(n.childForFieldName('value')); });
  return out; }
// 엔티티 필드: 게임 컬렉션을 도는 콜백의 매개변수(G.chars.filter(c => …), ch.stages.map(s => …), factions().find(f => …))나
// 찾기 함수 결과(const c = charById(…))에 묶인 변수에서 읽는 프로퍼티만 셈 — 변수 이름으로 짐작하지 않음
const COLL = [['캐릭터', /(^|\.)chars(\(\))?$|^G\.chars|ownedChars\(\)/], ['스테이지', /(^|\.)stages$/], ['적', /(^|\.)enemies$/], ['자료', /^G\.lib$/], ['세력', /^factions\(\)$|(^|\.)factions$/], ['메신저', /^G\.threads$/], ['이벤트', /^G\.events$/], ['배너', /^G\.banners$/]];
const LOOKUP = [['캐릭터', /^(charById|charOf)\(|^G\.chars\.find\(/], ['스테이지', /^stageById\(/], ['세력', /^facByName\(/]];
const ITER = /^(filter|map|forEach|find|some|every|flatMap|reduce|sort|findIndex|findLast)$/;
const FNT = new Set(['arrow_function', 'function_expression', 'function_declaration']);
export function entityProps(node) { const bind = new Map(), key = (scope, name) => `${scope.startIndex}:${name}`, out = new Map();
  walk(node, n => {
    if (n.type === 'call_expression') { const f = n.childForFieldName('function'); if (f?.type !== 'member_expression' || !ITER.test(f.childForFieldName('property')?.text || '')) return;
      const obj = (f.childForFieldName('object')?.text || '').replace(/\.filter\([^)]*\)$/, ''), ty = COLL.find(([, re]) => re.test(obj)); if (!ty) return;
      const cb = n.childForFieldName('arguments')?.namedChildren.find(a => FNT.has(a.type)); if (!cb) return; const ps = cb.childForFieldName('parameter') || cb.childForFieldName('parameters')?.namedChildren[ty[0] && f.childForFieldName('property').text === 'reduce' ? 1 : 0];
      if (ps?.type === 'identifier') bind.set(key(cb, ps.text), ty[0]); }
    else if (n.type === 'variable_declarator') { const nm = n.childForFieldName('name'), v = n.childForFieldName('value')?.text || '', ty = LOOKUP.find(([, re]) => re.test(v)); if (nm?.type !== 'identifier' || !ty) return; let sc = n.parent; while (sc && !FNT.has(sc.type)) sc = sc.parent; bind.set(key(sc || node, nm.text), ty[0]); } });
  walk(node, n => { if (n.type !== 'member_expression') return; const o = n.childForFieldName('object'), p = n.childForFieldName('property'); if (o?.type !== 'identifier' || !p || !/^[A-Za-z_]\w*$/.test(p.text)) return;
    let ty = null; for (let sc = n.parent; sc && !ty; sc = sc.parent) if (FNT.has(sc.type)) ty = bind.get(key(sc, o.text)) || null; if (!ty && bind.has(key(node, o.text))) ty = bind.get(key(node, o.text));
    if (ty) { if (!out.has(p.text)) out.set(p.text, new Set()); out.get(p.text).add(ty); } });
  return out; }
export function allProps(units) { const s = new Set(); for (const u of units) walk(u.tree.rootNode, n => { if (n.type === 'member_expression') { const p = n.childForFieldName('property'); if (p) s.add(p.text); } else if (n.type === 'pair') { const k = n.childForFieldName('key'); if (k) s.add(k.text.replace(/^['"]|['"]$/g, '')); } }); return s; }

// 생성 루트에서 부르는 함수들(동기·비동기 호출, 깊이 제한, 화면·저장·AI 통신 같은 기반 함수는 뺌)
export const INFRA = /^(render|toast|mark|flush|stat|wait|aiJSON|aiCall|aiOne|aiLog|llmWrap|http|claudeMsg|esc|T|clone|uid|nf|num|openModal|closeModal|closeOv|applyMeta|fix|defaults|ctx|\$|\$\$|rand|pick|sub|jo|quietErr|appStorage|commitRecords|imgSrc|art|head|pageHead)$/;
export function closure(fns, roots, depth = 3) { const seen = new Map(); let q = roots.filter(r => fns.has(r)).map(r => [r, 0]);
  while (q.length) { const [k, d] = q.shift(); if (seen.has(k)) continue; seen.set(k, d); if (d >= depth) continue; for (const c of fns.get(k).calls.keys()) { const f = fns.get(c); if (f && f.top && !INFRA.test(f.name) && !seen.has(c)) q.push([c, d + 1]); } }
  return seen; }
// 생성기 어휘: 쓰는 키(경로), 대입하는 프로퍼티·객체 리터럴 키, 프롬프트 JSON 스키마 키
export function generatorVocab(fns, keys, genFiles = new Set()) { const writes = new Map(), props = new Set(), schema = new Set(), addW = (p, loc) => { if (!p) return; if (!writes.has(p)) writes.set(p, new Set()); writes.get(p).add(loc); };
  for (const k of keys) { const f = fns.get(k); if (!f) continue; const own = genFiles.has(f.loc.split(':')[0]); // 객체 리터럴 키는 생성기 파일 안의 것만(기능의 기본값 리터럴이 어휘에 섞이지 않게)
    walk(f.node, n => {
      if (n.type === 'assignment_expression') { const l = n.childForFieldName('left'), r = n.childForFieldName('right'); if (l?.type === 'member_expression') { props.add(l.childForFieldName('property')?.text); const base = norm(l.text); addW(cut(base), f.name);
          // ng.meta = Object.assign(clone(DEFAULT_META), {title, …}) · ng.meta.x = {…}: 리터럴 키도 그 아래에 쓴 것으로
          const lits = r?.type === 'object' ? [r] : r?.type === 'call_expression' && r.childForFieldName('function')?.text === 'Object.assign' ? r.childForFieldName('arguments').namedChildren.filter(a => a.type === 'object') : [];
          if (base) for (const o of lits) for (const pr of o.namedChildren) { const key = pr.type === 'pair' ? pr.childForFieldName('key').text.replace(/^['"]|['"]$/g, '') : pr.type === 'shorthand_property_identifier' ? pr.text : null; if (key) addW(cut(`${base}.${key}`), f.name); } } }
      else if (own && n.type === 'pair') { const k2 = n.childForFieldName('key'); if (k2) props.add(k2.text.replace(/^['"]|['"]$/g, '')); }
      else if (own && n.type === 'shorthand_property_identifier') props.add(n.text);
      else if ((n.type === 'string_fragment' || n.type === 'string') && /"\w+"\s*:/.test(n.text)) for (const k of schemaKeys(n.text)) schema.add(k);
    }); }
  return { writes, props, schema }; }

// 프롬프트 JSON 스키마 글에서 키를 "부모/키"와 "키"로 뽑음(중괄호 깊이로 부모를 앎 — "world":{"plan":…}이면 world/plan)
export function schemaKeys(text) { const out = new Set(), stack = []; let last = null;
  for (const m of String(text).matchAll(/"([A-Za-z_]\w*)"\s*:|[{}\[\]]/g)) { const t = m[0];
    if (m[1]) { last = m[1]; out.add(m[1]); out.add(`${stack.length ? stack[stack.length - 1] : ''}/${m[1]}`); }
    else if (t === '{' || t === '[') { stack.push(last || (stack.length ? stack[stack.length - 1] : '')); last = null; } else stack.pop(); }
  return out; }
// 기능이 그 키를 "없으면 기본값"으로 읽는가: 기능 함수가 그 키에 직접 대입(지연 초기화)하거나, 읽는 곳이 ||·??·Object.assign(기본값, 키) 안
// 돌려주는 값: false(기본값 없음) · 'empty'(기본값이 빈 값 — [] · {} · 빈 배열만 든 객체: 기능이 비어 있는 채로 시작) · 'value'(쓸 만한 공통 기본값)
const deepEmpty = v => v == null || v === '' || (Array.isArray(v) && !v.length) || (typeof v === 'object' && !Array.isArray(v) && Object.values(v).every(deepEmpty));
export function lazyDefault(fns, featureFns, key, sf) { const leaf = key.split('.').pop(); let kind = false; const see = v => { kind = v === undefined || !deepEmpty(v) ? 'value' : (kind || 'empty'); };
  // Object.assign(기본값…, 이 키) — 앞 인자 중 식(상수·호출)이나 비지 않은 리터럴이 있으면 쓸 만한 기본값
  const assignDefaults = (arg) => { const args = arg.parent; if (args?.type !== 'arguments' || !/^Object\.assign$/.test(args.parent?.childForFieldName('function')?.text || '')) return null; const before = args.namedChildren.filter(a => a.startIndex < arg.startIndex); if (!before.length) return null; return before.some(a => { const v = literal(a); return v === undefined || !deepEmpty(v); }) ? 'value' : 'empty'; };
  for (const fk of featureFns) { const f = fns.get(fk); if (!f) continue;
    walk(f.node, n => { if (n.type !== 'member_expression' || n.childForFieldName('property')?.text !== leaf) return; let top = n; while (top.parent && (top.parent.type === 'parenthesized_expression' || (top.parent.type === 'binary_expression' && /^(\|\||\?\?)$/.test(top.parent.childForFieldName('operator')?.type || '')))) top = top.parent;
      const ad = assignDefaults(top); if (ad) { see(ad === 'value' ? undefined : {}); return; }
      const par = n.parent;
      if (par?.type === 'binary_expression' && /^(\|\||\?\?)$/.test(par.childForFieldName('operator')?.type || '') && par.childForFieldName('left')?.startIndex === n.startIndex) see(literal(par.childForFieldName('right')));
      else if (par?.type === 'assignment_expression' && par.childForFieldName('left')?.startIndex === n.startIndex) { // if(!x.k) x.k = 기본값 꼴(없을 때 채우는 지연 초기화)만
        let ifs = par.parent; while (ifs && ifs.type !== 'if_statement' && !FNT.has(ifs.type)) ifs = ifs.parent; const cond = ifs?.type === 'if_statement' ? ifs.childForFieldName('condition')?.text || '' : '';
        if (new RegExp(`(!|typeof|isArray\\()[^&|]*\\b${leaf}\\b`).test(cond)) see(literal(par.childForFieldName('right'))); }
      else if (par?.type === 'ternary_expression' && par.childForFieldName('consequence')?.startIndex === n.startIndex) { // 있으면 그 키, 없으면 기본값 — Array.isArray(x.k)?x.k:기본값() 꼴(읽을 때 기본값, 상태는 그대로)
        const z = par.childForFieldName('alternative'); if (z && new RegExp(`\\b${leaf}\\b`).test(par.childForFieldName('condition')?.text || '')) see(literal(z)); }
      else if (par?.type === 'variable_declarator' && par.childForFieldName('value')?.startIndex === n.startIndex) { // const L=G.meta.x; … L&&L.length?L:기본값() 꼴 — 지역 이름으로 받은 뒤 없으면 기본값
        const L = par.childForFieldName('name')?.text; walk(f.node, m => { if (m.type !== 'ternary_expression' || !L) return; const c = m.childForFieldName('condition')?.text || '', y = m.childForFieldName('consequence')?.text, z = m.childForFieldName('alternative'); if (new RegExp(`\\b${L}\\b`).test(c) && y === L && z) see(literal(z)); }); } }); }
  return kind; }
// 생성된 게임 값 꺼내기
export function valueAt(game, path) { const [base, ...rest] = path.split('.'); let v = base === 'P()' ? game.prog : game; if (base === 'G' || base === 'P()') { for (const k of rest) { if (v == null) return undefined; v = v[k]; } return v; } return undefined; }
const empty = v => v == null || v === '' || (Array.isArray(v) && !v.length) || (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length);
export function statusOf(v, d) { if (v === undefined) return '없음'; if (empty(v)) return '빔'; if (d !== undefined && JSON.stringify(v) === JSON.stringify(d)) return '기본값'; return '값'; }
// 게임 속 엔티티 목록(새 필드가 실제로 채워졌는지 셀 곳)
export function entities(g) { const st = (g.chapters || []).flatMap(c => c.stages || []);
  return { 캐릭터: (g.chars || []).filter(c => !c.alt), 스테이지: st, 적: st.flatMap(s => s.enemies || []), 자료: g.lib || [], 메신저: g.threads || [], 배너: g.banners || [], 이벤트: g.events || [], 세력: (g.world || {}).factions || [] }; }

// features: [{id, title, fns:Set(현재 트리의 함수 키)}], defaults: {DEFAULT_META, DEFAULT_WORLD, DEFAULT_PROG}, games: [{name, game}], upstreamProps: Set
// stages: 단계별 함수 집합 {생성, '실행 중 AI', 사용자}(lib/lifecycle.mjs stageClosures), genRoots: 생성 시작점(객체 리터럴 키는 그 파일 안의 것만 어휘로)
// 판정은 원안의 생성 경계를 따름: 생성 단계가 만드는 키는 생성된 게임에 있어야 하고, 실행 중 AI가 만드는 키는 생성 직후엔 없어도 정상,
// 사용자 조작으로만 만들어지는 키는 "자동이 기본"에 어긋남(P1), 어느 단계도 만들지 않으면(기본값도 빈 값) 기능이 비어 있음(P0)
// 키 판정(원안의 생성 경계): 생성 단계 키는 생성 게임에 있어야 하고, 실행 중 AI 키는 생성 직후 없어도 정상, 사용자 조작으로만 → P1, 아무 단계도 없음 → P0
function keyFlag(r) { if (r.key.startsWith('P().') || r.user) return null;
  const coll = /^G\.\w+$/.test(r.key), miss = r.games.every(s => s === '없음' || (!coll && s === '빔')), dflt = r.games.every(s => s === '기본값'), gen = r.gen || r.schema, auto = gen || r.live;
  if (r.ok && (!gen || miss || dflt)) return null; // 공통 기본값으로 충분하다고 정한 키(fork-features.json defaultOk) — 생성이 빈 값을 써 두고 기능이 기본값을 주는 경우 포함
  if (!auto && !r.userW && miss && !r.def && r.lazy !== 'value') return { sev: 'P0', msg: `어느 단계(생성·실행 중 AI·사용자)도 만들지 않고 생성 게임에도 없음 — ${r.lazy === 'empty' ? '기능의 기본값이 빈 값이라' : '기능 쪽 기본값도 없어'} 기능이 비어 있음` };
  if (!auto && r.userW) return { sev: 'P1', msg: `자동으로 만들어지지 않음 — 사용자 조작(${r.userW})으로만. 자동(생성·실행 중 AI)이 기본` };
  if (!auto && miss) return { sev: 'P1', msg: `생성·실행 중 AI가 게임에 맞춰 정하지 않음 — ${r.def ? '원본 샘플 기본값' : '기능의 공통 기본값'}으로 시작` };
  if (!auto && dflt) return { sev: 'P1', msg: '생성·실행 중 AI가 정하지 않아 원본 샘플 기본값 그대로' };
  if (gen && miss) return { sev: 'P1', msg: `생성 단계가 만드는 키(${r.gen || '스키마'})인데 생성 게임에 없음 — 응답 누락·검증 없음 또는 그 전에 만든 생성물` };
  return null; }
const zeroOnly = g => !g || (/ 0\/\d+$/.test(g) && !/ [1-9]\d*\//.test(g));
// 원본에 없던 새 필드(기능 함수가 엔티티에서 읽는 프로퍼티) — 생성·실행 중 AI 어휘에 있는지, 생성물 엔티티에 실제로 있는지(한 단계 안 c.persona.traits까지)
const hasField = (x, p) => x && typeof x === 'object' && (!empty(x[p]) || Object.values(x).some(v => v && typeof v === 'object' && !Array.isArray(v) && !empty(v[p])));
function featureFields(ft, { fns, gv, lv, games, upstreamProps }) { const EP = new Map();
  for (const k of ft.fns) { const f = fns.get(k); if (!f) continue; for (const [p, ts] of entityProps(f.node)) { if (!EP.has(p)) EP.set(p, new Set()); ts.forEach(t => EP.get(p).add(t)); } }
  const cover = (g, p) => Object.entries(entities(g.game)).filter(([k]) => EP.get(p).has(k)).map(([k, L]) => `${k} ${L.filter(x => hasField(x, p)).length}/${L.length}`).join(' · ');
  return [...EP.keys()].filter(p => !upstreamProps.has(p) && p.length > 2).map(p => ({ field: p, on: [...EP.get(p)].join('·'), gen: gv.props.has(p) || gv.schema.has(p), live: lv.props.has(p) || lv.schema.has(p), schema: gv.schema.has(p), games: games.map(g => cover(g, p)) })); }
// stages: 단계별 함수 집합 {생성, '실행 중 AI', 사용자}(lib/lifecycle.mjs stageClosures), genRoots: 생성 시작점(객체 리터럴 키는 그 파일 안의 것만 어휘로)
export function wiringReport({ fns, sf, features, stages, genRoots, defaults, games, upstreamProps, userKeys = {}, defaultOk = {}, runtimeFields = {} }) {
  const genFiles = new Set(genRoots.filter(r => fns.has(r)).map(r => fns.get(r).loc.split(':')[0])), gv = generatorVocab(fns, stages['생성'].keys(), genFiles), lv = generatorVocab(fns, stages['실행 중 AI'].keys(), genFiles),
    D = (path) => { const [b, x, y] = path.split('.'); if (b === 'P()') return (defaults.DEFAULT_PROG || {})[x]; if (x === 'meta') return (defaults.DEFAULT_META || {})[y]; if (x === 'world') return (defaults.DEFAULT_WORLD || {})[y]; return undefined; },
    writers = (key, st) => { const x = sf.list.find(k => k.key === key); return x ? [...x.w].filter(f => stages[st].has(f)) : []; }, uniq = (...a) => [...new Set(a.flat())].slice(0, 3).join(', ');
  const row = (ft, key) => { const [, area, leaf] = key.split('.'); // G.world.X는 스키마의 world/X도 생성으로 봄(ng.world에 AI 응답을 통째로 넣음)
    return { key, gen: uniq(gv.writes.get(key) || [], writers(key, '생성')), live: uniq(lv.writes.get(key) || [], writers(key, '실행 중 AI')), userW: uniq(writers(key, '사용자')), schema: area === 'world' && gv.schema.has(`world/${leaf}`), def: D(key) !== undefined, lazy: lazyDefault(fns, ft.fns, key, sf), user: userKeys[key] || '', ok: defaultOk[key] || '', games: games.map(g => statusOf(valueAt(g.game, key), D(key))) }; };
  const out = features.map(ft => {
    const keys = sf.list.filter(k => /^(G\.meta\.|G\.world\.|P\(\)\.|G\.)\w+$/.test(k.key) && [...k.r].some(r => ft.fns.has(r))).map(k => k.key).filter(k => !/^G\.(meta|world|prog|chars|chapters)$/.test(k));
    const rows = keys.map(k => row(ft, k)), fields = featureFields(ft, { fns, gv, lv, games, upstreamProps });
    const flags = [...rows.map(r => { const f = keyFlag(r); return f && { ...f, key: r.key }; }).filter(Boolean),
      ...fields.filter(x => !runtimeFields[x.field] && !x.gen && !x.live && x.games.every(zeroOnly)).map(x => ({ sev: 'P1', key: x.field, msg: `기능이 ${x.on}에서 읽는 새 필드인데 생성·실행 중 AI가 만들지 않고 생성 게임에도 없음` }))];
    return { id: ft.id, title: ft.title, fns: ft.fns.size, rows, fields, flags }; });
  return { closure: Object.fromEntries(Object.entries(stages).map(([k, v]) => [k, v.size])), features: out, schemaKeys: gv.schema.size, games: games.map(g => g.name) };
}
