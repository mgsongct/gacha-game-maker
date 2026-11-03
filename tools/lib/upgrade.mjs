// 구버전·미비 생성 게임 감지·보완 커버리지(정적): 생성기·실행기는 계속 바뀌므로, 예전 빌드로 만들었거나 빠진 데 있는 게임을 지금 앱이 알아채고 채울 수 있어야 함(사용자 지시).
//   포크 기능마다 생성기가 만드는 데이터 키(G.meta.x 등)·엔티티 필드(캐릭터 persona 등 — tools/wiring.mjs 결과)가 예전 게임에 없을 때 무엇이 감지·보완하나:
//   ① 불러오기 이전 fix()(와 부르는 함수)가 씀 ② 콘텐츠 점검 규칙(AUDIT_RULES — 규칙의 test·fix가 읽는 키·필드, 판 since)이 잡음
//   ③ 실행 중 AI(라이브)가 씀 ④ 없을 때 코드가 기본값을 씀(지연 기본값). 넷 다 아니면 "감지·보완 없음"(예전 게임에서 그 기능이 빈 채로 남음)
import { walk } from './source.mjs';
import { norm, cut, closure, generatorVocab } from './wiring.mjs';

const memberChain = n => { let t = n; while (t.parent && t.parent.type === 'member_expression' && t.parent.childForFieldName('object')?.id === t.id) t = t.parent; return t; };
// 점검 규칙: AUDIT_RULES 배열의 객체마다 id·scope·since와, test·fix가 읽는 G 키·엔티티 필드(규칙 매개변수의 속성, fix.fields, 부르는 함수가 매개변수로 읽는 필드·읽는 키 1단계)
export function auditRules(units, fns, sf) { let arr = null; for (const u of units) walk(u.tree.rootNode, n => { if (arr) return false; if (n.type === 'variable_declarator' && n.childForFieldName('name')?.text === 'AUDIT_RULES') arr = n.childForFieldName('value'); });
  if (!arr) return []; const keysRead = new Map(); for (const k of sf.list) for (const fk of k.r) { if (!keysRead.has(fk)) keysRead.set(fk, new Set()); keysRead.get(fk).add(k.key); }
  const paramFields = fk => { const f = fns.get(fk), out = new Set(); if (!f || !f.node) return out; const ps = f.node.childForFieldName('parameters')?.namedChildren || []; const p0 = ps[0]?.type === 'identifier' ? ps[0].text : null; if (!p0) return out;
    walk(f.node, n => { if (n.type === 'member_expression' && n.childForFieldName('object')?.text === p0) out.add(n.childForFieldName('property')?.text); }); return out; };
  return arr.namedChildren.filter(o => o.type === 'object').map(o => { const prop = k => o.namedChildren.find(p => p.type === 'pair' && p.childForFieldName('key')?.text === k)?.childForFieldName('value');
    const id = prop('id')?.text.replace(/^['"]|['"]$/g, ''), scope = prop('scope')?.text.replace(/^['"]|['"]$/g, ''), since = +prop('since')?.text || 0, fields = new Set(), keys = new Set();
    for (const part of [prop('test'), prop('fix')].filter(Boolean)) { const pm = part.type === 'arrow_function' ? (part.childForFieldName('parameter')?.text || part.childForFieldName('parameters')?.namedChildren[0]?.text) : null;
      walk(part, n => { if (n.type === 'arrow_function' && n.id !== part.id) { const q = n.childForFieldName('parameter')?.text || n.childForFieldName('parameters')?.namedChildren[0]?.text; if (q) walk(n, m => { if (m.type === 'member_expression' && m.childForFieldName('object')?.text === q && scope !== 'game') fields.add(m.childForFieldName('property')?.text); }); }
        if (n.type === 'member_expression' && pm && n.childForFieldName('object')?.text === pm) fields.add(n.childForFieldName('property')?.text);
        if (n.type === 'member_expression' && !/^member_expression$/.test(n.parent?.type || '')) { const c = cut(norm(memberChain(n).text)); if (c) keys.add(c); }
        if (n.type === 'pair' && n.childForFieldName('key')?.text === 'fields') walk(n.childForFieldName('value'), m => { if (m.type === 'string') fields.add(m.text.slice(1, -1)); });
        if (n.type === 'call_expression') { const nm = n.childForFieldName('function')?.text, f = [...fns.values()].find(x => x.top && x.name === nm); if (f) { (keysRead.get(f.key) || []).forEach(k => keys.add(k)); paramFields(f.key).forEach(x => fields.add(x)); } } }); }
    return { id, scope, since, fields: [...fields].filter(Boolean), keys: [...keys] }; }); }
// 불러오기 이전: fix()와 부르는 함수(3단계)가 쓰는 키·대입하는 필드
export function migrationWrites(fns, sf) { const fixFn = [...fns.values()].find(f => f.top && f.name === 'fix'); if (!fixFn) return { keys: new Set(), fields: new Set() };
  const cl = closure(fns, [fixFn.key], 3), keys = new Set(sf.list.filter(k => [...k.w].some(w => cl.has(w))).map(k => k.key)), fields = new Set();
  for (const k of cl.keys()) { const f = fns.get(k); if (f && f.node) walk(f.node, n => { if ((n.type === 'assignment_expression' || n.type === 'augmented_assignment_expression') && n.childForFieldName('left')?.type === 'member_expression') fields.add(n.childForFieldName('left').childForFieldName('property')?.text); }); }
  return { keys, fields }; }
// 포크 기능마다: 생성기가 만드는 키·필드가 예전 게임에 없을 때 감지·보완 경로. upGen: 원안 생성기가 쓰던 키(예전 게임에도 있어 뺌 — upstreamGenKeys)
//   상태: 보완(불러오기 이전·점검 규칙·실행 중 AI) · 기본값으로만(없으면 코드 기본값 — 동작은 하지만 그 게임에 맞춘 값으로 채우지 않음) · 없음
export function upgradeCoverage(W, rules, mig, upGen = new Set()) { const ruleFor = (pred) => rules.filter(pred).map(r => `${r.id}(판 ${r.since})`), st = via => via.some(v => v !== '없으면 기본값') ? '보완' : via.length ? '기본값으로만' : '없음';
  return W.features.map(f => { const rows = [];
    for (const r of f.rows.filter(x => !x.key.startsWith('P().') && !x.user && (x.gen || x.schema) && !x.def && !upGen.has(x.key))) { const via = [mig.keys.has(r.key) ? '불러오기 이전' : '', ...ruleFor(x => x.keys.includes(r.key)), r.live ? '실행 중 AI' : '', r.lazy ? '없으면 기본값' : ''].filter(Boolean); rows.push({ what: r.key, kind: '키', via, status: st(via) }); }
    for (const x of f.fields.filter(y => y.gen || y.schema)) { /* 필드는 이미 「원본에 없던 새 필드」(배선 도구) */ const via = [mig.fields.has(x.field) ? '불러오기 이전' : '', ...ruleFor(y => y.fields.includes(x.field)), x.live ? '실행 중 AI' : ''].filter(Boolean); rows.push({ what: `${x.on}.${x.field}`, kind: '필드', via, status: st(via) }); }
    return { id: f.id, title: f.title, rows }; }); }
// 원안 생성기가 쓰던 키: 원안 코드(src로 나누기만 한 커밋)에서 지금과 같은 방법(생성 단계 함수 묶음의 쓰기·생성 어휘)으로 — 그 키는 예전 게임에도 있음
export function upstreamGenKeys(fns, sf, stages, genRoots) { const genFiles = new Set(genRoots.filter(r => fns.has(r)).map(r => fns.get(r).loc.split(':')[0])), gv = generatorVocab(fns, stages['생성'].keys(), genFiles), out = new Set(gv.writes.keys());
  for (const k of sf.list) if ([...k.w].some(w => stages['생성'].has(w))) out.add(k.key); return out; }
