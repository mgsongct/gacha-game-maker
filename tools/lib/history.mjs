// 개발 내역 검증: 원본(포크 전)부터 지시해 개발한 내역이 지금 코드에 실제로 시행돼 있는지.
//   닿음(reach) — 부팅(최상위 문장·src/index.html)·생성·실행 중 AI·화면 조작(액션 분배기·리스너)·불러오기 진입점에서 호출이나 참조로 닿는 함수.
//                 안 닿는 함수는 만들어 놓고 연결하지 않은 것(시행 안 됨) 후보
//   주장(claims) — 커밋 설명·조사 노트에 적힌 코드 이름(`이름`, 낙타 표기 함수 이름, 대문자 상수, G.meta.x·P().x 키, src 파일 이름)
import { walk } from './source.mjs';
import { classTable, memberFn } from './graph.mjs';

// 진입점에서 닿는 최상위 함수: 최상위 문장(함수 선언 본문 제외)과 html이 가리키는 이름에서 출발해, 함수 본문에 나오는 최상위 함수 이름을 따라감
// (호출만이 아니라 값으로 넘기는 것 — 표·콜백·setTimeout 등 — 도 닿음으로 봄). 모듈 이름공간(GGM…)의 함수는 프로퍼티 이름으로 이음
// 액션: 분배기 case 본문은 그 액션을 보내는 글(data-act="x")이 닿는 함수나 html 안에 있을 때만 따라감(버튼이 안 닿는 화면에만 있으면 누를 수 없음).
//   글로 안 보이는(동적으로 만드는) 액션은 deadActs(보내는 쪽이 아예 없음)가 아니면 살아 있다고 봄
const ACT_RE = /data-act=\\?["']([\w-]+)\\?["']|dataset\.act\s*=\s*['"]([\w-]+)['"]/g;
export function reachable(units, fns, html = '', deadActs = new Set()) {
  const top = new Map([...fns.values()].filter(f => f.top && !f.table).map(f => [f.key, f])), seen = new Set(), queue = [], cases = new Map(), live = new Set(), literal = new Set();
  /* class로 옮긴 함수(Class.이름 — 부름·값으로 넘김): 물려받은 메서드는 상위에서 찾고(this.이름도), 쓰인 class가 상위 class 메서드를 덮어쓴 것(템플릿 메서드의 훅 — 상위가 this로 부름)은 닿음 */
  const classes = classTable(units), members = new Map(), byName = new Map(); for (const f of top.values()) { if (f.cls) { if (!members.has(f.cls)) members.set(f.cls, []); members.get(f.cls).push(f.key); } if (f.key !== f.name && !f.cls) { if (!byName.has(f.name)) byName.set(f.name, []); byName.get(f.name).push(f.key); } }
  const usedCls = new Set(), useClass = c => { if (usedCls.has(c)) return; usedCls.add(c); const anc = new Set(); for (let k = classes.get(c), i = 0; k && i < 20; k = classes.get(k), i++) (members.get(k) || []).forEach(x => anc.add(top.get(x).name)); anc.forEach(nm => { const t = memberFn(top, classes, c, nm); if (t) mark(t.key); }); }; /* 상위 메서드 이름마다 이 class에서 보이는 구현(덮어쓴 것·중간 상위의 것) */
  const clsAt = n => { for (let q = n; q; q = q.parent) if (q.type === 'method_definition') return q.parent?.type === 'class_body' ? q.parent.parent?.childForFieldName('name')?.text : null; return null; };
  const caseAt = new Map(); for (const u of units) walk(u.tree.rootNode, n => { if (n.type === 'switch_case') { const v = String(n.childForFieldName('value')?.text || '').replace(/^['"`]|['"`]$/g, ''); if (v) { if (!cases.has(v)) cases.set(v, []); cases.get(v).push(n); if (!caseAt.has(v)) caseAt.set(v, u.loc(n)); } } });
  for (const u of units) for (const m of u.text.matchAll(ACT_RE)) literal.add(m[1] || m[2]);
  /* case 이름표 밖의 글자 값(편성 화면에 {start:'raidstart'}로 넘겨 data-act를 변수로 만듦 — 동적으로 보낼 수 있음): 보내는 곳 없음(deadActs)으로 치지 않음 */
  const strs = new Set(); for (const u of units) walk(u.tree.rootNode, n => { if (n.type === 'string' && n.parent?.type !== 'switch_case') strs.add(n.text.slice(1, -1)); });
  const deadA = new Set([...deadActs].filter(a => !strs.has(a)));
  const mark = key => { if (top.has(key) && !seen.has(key)) { seen.add(key); queue.push(top.get(key)); } }, hit = name => { mark(name); (byName.get(name) || []).forEach(mark); }; /* 이름 → 맨 위 함수·모듈 블록 함수(unit#이름) */
  const acts = text => { for (const m of String(text).matchAll(ACT_RE)) { const a = m[1] || m[2]; if (!live.has(a)) { live.add(a); (cases.get(a) || []).forEach(c => queue.push({ node: c, isCase: true })); } } };
  const idsIn = node => { acts(node.text); walk(node, n => { if (n.type === 'switch_case' && cases.has(String(n.childForFieldName('value')?.text || '').replace(/^['"`]|['"`]$/g, ''))) { const v = String(n.childForFieldName('value').text).replace(/^['"`]|['"`]$/g, ''); if (!live.has(v) && (literal.has(v) || deadA.has(v))) return false; }
    if (n.type === 'identifier' || n.type === 'shorthand_property_identifier') hit(n.text); else if (n.type === 'property_identifier') { const o = n.parent?.childForFieldName('object')?.text || ''; const c = o === 'this' ? clsAt(n) : o; if (/^GGM\w+$/.test(o)) hit(n.text); else if (classes.has(c)) { const t = memberFn(top, classes, c, n.text); if (t) mark(t.key); useClass(c); } } }); }; // 다른 프로퍼티 이름(obj.name)은 함수가 아님
  for (const u of units) { const r = u.tree.rootNode; for (let i = 0; i < r.childCount; i++) { const c = r.child(i); if (c.type === 'function_declaration' || c.type === 'class_declaration') continue; /* 선언 본문은 불러올 때 돌지 않음 */
    if (c.type === 'lexical_declaration' || c.type === 'variable_declaration') { for (const d of c.namedChildren.filter(x => x.type === 'variable_declarator')) { const v = d.childForFieldName('value'); if (v && !/^(arrow_function|function_expression)$/.test(v.type)) idsIn(v); } continue; }
    idsIn(c); } }
  acts(html); for (const m of html.matchAll(/[A-Za-z_$][\w$]*/g)) hit(m[0]);
  while (queue.length) { const f = queue.shift(); if (f.node) idsIn(f.node); }
  for (const k of [...seen]) seen.add(top.get(k).name); /* 열쇠(Class.이름·unit#이름)와 이름 둘 다로 물을 수 있게 */
  /* 처리기 case는 있는데 닿는 곳(진입점에서 닿는 코드·html)에서 보내지 않는 동작 — 들어가는 길이 끊긴 기능(보내는 글이 닿지 않는 화면에만 있거나 아예 없음) */
  seen.unsent = [...cases.keys()].filter(a => !live.has(a) && (literal.has(a) || deadA.has(a))).map(a => ({ act: a, at: caseAt.get(a), emittedSomewhere: literal.has(a) })); /* 글자 그대로 안 보이는 동작(동적으로 만든 data-act)은 모름 — 셈하지 않음 */
  return seen;
}
// 글에서 코드 이름 뽑기: `…` 안 이름, 낙타 표기(소문자로 시작·대문자 섞임), 대문자 상수(_ 포함 4자 이상), 상태 키, src 파일 이름(0465-story-plan)
// 코드 이름이 아닌 것은 뺌: 링크 주소·맨 주소(외부 문서의 경로 조각), 경로(/가 든 것), 브라우저 전역 API(navigator.storage.persist 등 — 앱 코드가 아님)
const WEB_API = /^(navigator|document|window|console|Math|JSON|Object|Array|Promise|URL|crypto|location|history|indexedDB|caches)\./;
export function claimNames(text) { const out = new Set(), add = s => { s = s.replace(/\(\)$/, '').replace(/[.,:;]+$/, ''); if (s.length >= 4 && !WEB_API.test(s) && /^(?:[A-Za-z_$][\w$]*|P\(\))(?:\.[A-Za-z_$][\w$]*)*$|^0\d{3}-[a-z-]+$/.test(s)) out.add(s); };
  text = String(text).replace(/\]\([^)\s]*\)/g, ']').replace(/https?:\/\/\S+/g, ' ');
  for (const m of text.matchAll(/`([^`\n]{2,60})`/g)) for (const w of m[1].split(/[\s·,+]+/)) if (!w.includes('/') && /^[A-Za-z_$][\w$.()]*$/.test(w)) add(w);
  for (const m of text.matchAll(/\b([a-z][a-z0-9]*[A-Z][A-Za-z0-9]*)\b/g)) add(m[1]);
  for (const m of text.matchAll(/\b([A-Z][A-Z0-9]*_[A-Z0-9_]+)\b/g)) add(m[1]);
  for (const m of text.matchAll(/\b((?:G\.meta|G\.world|P\(\))\.\w+)/g)) add(m[1]);
  for (const m of text.matchAll(/\b(0\d{3}-[a-z][a-z-]+)\b/g)) add(m[1]);
  return [...out]; }
// 이름이 지금 코드에 있는지: 파일 이름은 src/main 파일, 상태 키는 그 속성 이름, 나머지는 단어로
export function nameExists(name, srcText, files) { if (/^0\d{3}-/.test(name)) return files.some(f => f.includes(name));
  const w = name.includes('.') ? name.split('.').pop() : name.replace(/\(\)$/, ''); return new RegExp(`(^|[^\\w$])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\w$]|$)`).test(srcText); }
