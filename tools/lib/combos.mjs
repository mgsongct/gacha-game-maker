// 프롬프트 조합(정적 분석 + 프롬프트 글 검사):
//   promptSitesStatic — 글 AI 요청 지점마다 프롬프트가 어떤 스튜디오 조각·코드 글로 조합되는지, 어떤 조건(갈래)에 따라 조각이 들고 나는지(가능한 조합 = 2^갈래),
//                       응답에서 코드가 읽는 키(답 받는 변수의 속성). 흐름은 tools/lib/prompts.mjs promptFlow와 같음
//   checkPrompt      — 실제로 보낸 프롬프트 글 하나 검사: 깨짐(안 채운 자리·undefined·빈 머리말·표식·형식 견본) · 과잉(같은 줄·같은 조각 되풀이, 충돌 지시, 읽지 않는 키 요구) · 과소(형식 지시 없음, 읽는데 요구하지 않은 키)
//   동적 실행(상황별로 실제 index.html에서 프롬프트를 받아 봄)은 tools/play/combos.mjs
import { walk } from './source.mjs';
import { promptFlow, outputPos, promptText, ownText } from './prompts.mjs';
import { promptConflicts } from '../play/lib/conflicts.mjs';

const FN = new Set(['function_declaration', 'function_expression', 'arrow_function', 'method_definition']);
const callee = n => n.childForFieldName('function')?.text;
const short = (t, n = 70) => String(t).replace(/\s+/g, ' ').trim().slice(0, n);
export function fragmentIds(units) { const ids = new Set(); for (const u of units) walk(u.tree.rootNode, n => { if (n.type === 'call_expression' && callee(n) === 'pfDef') { const a = n.childForFieldName('arguments')?.namedChildren[0]; if (a?.type === 'string') ids.add(a.text.slice(1, -1)); } }); return ids; }
// 조건 속 상황 변수: G.meta.x·storyCfg().x·draft.x 같은 멤버 사슬과 이름(키워드·짧은 지역 이름 뺌)
const KW = new Set('true false null undefined typeof instanceof new return length trim slice some every filter map find includes join String Number Array Object JSON Math Boolean'.split(' '));
export const condVars = c => [...new Set((String(c).match(/[A-Za-z_$][\w$]*(?:\(\))?(?:\??\.[A-Za-z_$][\w$]*(?:\(\))?)*/g) || []).map(x => x.replace(/\?\./g, '.').replace(/\.(length|trim\(\)|slice|some|filter|map|find|includes|join)(\(\))?$/, '')).filter(x => !KW.has(x) && (x.includes('.') || x.length > 2)))];
// 답 받는 변수: const r=await aiJSON(…) · ngStep(…,()=>aiJSON(…),r=>…) 같은 감싸기(화살표 인자) 넘어 · 그 변수(와 Object.assign 별칭)에서 읽는 첫 단계 키
function resultReads(call) { let n = call, p = call.parent; const preds = [];
  for (; p; n = p, p = p.parent) { if (p.type === 'await_expression' || p.type === 'parenthesized_expression') continue;
    if (p.type === 'arrow_function' && p.childForFieldName('body')?.id === n.id && p.parent?.type === 'arguments') { const outer = p.parent.parent; p.parent.namedChildren.filter(a => a.type === 'arrow_function' && a.id !== p.id && a.childForFieldName('parameter')).forEach(a => preds.push(a)); n = outer; p = outer; continue; }
    break; }
  const names = [], keys = new Set(), pat = p?.type === 'variable_declarator' ? p.childForFieldName('name') : p?.type === 'assignment_expression' ? p.childForFieldName('left') : null;
  if (pat?.type === 'identifier') names.push(pat.text); else if (pat?.type === 'object_pattern') pat.namedChildren.forEach(c => keys.add((c.childForFieldName?.('key') || c).text.split(/[:=]/)[0].trim()));
  let scope = null; for (let f = call.parent; f; f = f.parent) { if (f.type === 'switch_case') { scope = f; break; } if (f.type === 'function_declaration' || (FN.has(f.type) && f.parent?.type !== 'arguments')) { scope = f; break; } } // 분배기면 그 case만
  const read = (sc, nm) => walk(sc, m => { if (m.type === 'member_expression' && m.childForFieldName('object')?.type === 'identifier' && m.childForFieldName('object').text === nm) keys.add(m.childForFieldName('property')?.text); });
  if (scope && names.length) { for (let grew = true; grew;) { grew = false; walk(scope, m => { if (m.type === 'variable_declarator' && m.childForFieldName('name')?.type === 'identifier') { const nm = m.childForFieldName('name').text, v = m.childForFieldName('value'); if (v && !names.includes(nm) && /Object\.assign|\.\.\./.test(v.text) && names.some(x => new RegExp(`\\b${x}\\b`).test(v.text))) { names.push(nm); grew = true; } } }); } // Object.assign·펼침 별칭
    names.forEach(nm => read(scope, nm)); }
  preds.forEach(a => read(a, a.childForFieldName('parameter').text));
  return { found: !!(names.length || keys.size), keys: [...keys].filter(k => k && !/^(length|unshift|push|map|filter|forEach|slice|join|some|find|includes)$/.test(k)).sort() }; }
// 요청 지점 목록(정적). opts.sinks: 받는 호출(기본 글 AI)
export function promptSitesStatic(units, opts = {}) {
  const ids = fragmentIds(units), { sites, flow, calls } = promptFlow(units, opts), base = new Set(opts.sinks || ['aiJSON', 'aiJSONRetry', 'aiCall', 'SAMPLE.json']), per = new Map(), out = [];
  const wrappers = new Set([...calls.keys()].filter(c => !base.has(c)));
  const fragOf = n => { if (n.type === 'call_expression' && /^(pf|promptFrag)$/.test(callee(n) || '')) { const a = n.childForFieldName('arguments')?.namedChildren[0]; return a?.type === 'string' ? a.text.slice(1, -1) : null; }
    return (n.type === 'identifier' || n.type === 'shorthand_property_identifier') && ids.has(n.text) && n.parent?.type !== 'variable_declarator' ? n.text : null; };
  // 갈래 표지: 그 갈래에 든 조각 id와 코드 글 덩어리(자리 사이 8자 이상 — 실제 프롬프트에서 그 갈래가 쓰였는지 글로 알아봄)
  const brief = node => { const f = new Set(), lits = []; walk(node, n => { const id = fragOf(n); if (id) f.add(id); if (n.type === 'string_fragment' || n.type === 'string') { const t = n.type === 'string' ? n.text.slice(1, -1) : n.text; if (n.parent?.type !== 'string' && outputPos(n.type === 'string' ? n : n.parent) && promptText(t)) t.split(/\\n/).map(x => x.trim()).filter(x => x.length >= 8).forEach(x => lits.push(x.slice(0, 40))); } }); return [...f, ...lits.slice(0, 3).map(x => '「' + x + '」')]; };
  for (const s of sites) { const file = s.loc.split(':')[0], k = (per.get(file + s.owner) || 0) + 1; per.set(file + s.owner, k);
    const frags = new Set(), switches = [], sw = new Set(), heads = [];
    const addSw = (node, u, cond, yes, no) => { if (sw.has(node.id) || (!yes.length && !no.length)) return; sw.add(node.id); switches.push({ cond: short(cond), vars: condVars(cond), yes, no, loc: u.loc(node) }); };
    flow([{ u: s.u, node: s.root }], (n, u) => { const id = fragOf(n); if (id) frags.add(id);
      if (n.type === 'ternary_expression') addSw(n, u, n.childForFieldName('condition').text, brief(n.childForFieldName('consequence')), brief(n.childForFieldName('alternative')));
      if (n.type === 'binary_expression' && /^(&&|\|\|)$/.test(n.childForFieldName('operator')?.text || '')) { const op = n.childForFieldName('operator').text, r = brief(n.childForFieldName('right')); if (r.length) addSw(n, u, (op === '||' ? '없으면: ' : '') + n.childForFieldName('left').text, op === '&&' ? r : [], op === '||' ? r : []); }
      if ((n.type === 'string' || n.type === 'template_string') && outputPos(n) && u === s.u && n.startIndex >= s.root.startIndex && n.endIndex <= s.root.endIndex) { const t = ownText(n).trim(); if (t.length >= 6) heads.push(t.slice(0, 40)); } },
      (node, u) => { for (let p = node.parent; p && !FN.has(p.type); p = p.parent) if (p.type === 'if_statement') { addSw(p, u, p.childForFieldName('condition').text, brief(node), []); break; } }); // 지역 변수 값이 if 안에서 정해짐
    const { found, keys } = resultReads(s.call);
    out.push({ key: `${file.replace(/^src\/(main\/)?/, '')} ${s.owner}${k > 1 ? '#' + k : ''}`, owner: s.owner, sink: s.sink, loc: s.loc, wrapper: wrappers.has(s.owner), layer: !!s.layer, frags: [...frags].sort(), switches, combos: 2 ** Math.min(switches.length, 52), vars: [...new Set(switches.flatMap(w => w.vars))].slice(0, 30), heads: heads.slice(0, 12), reads: keys, readsFound: found }); }
  const unesc = t => t.replace(/\\(.)/g, (m, c) => ({ n: '\n', t: '\t', r: '\r' })[c] ?? c); // 글 원문의 이스케이프 풀기(\\n → 줄바꿈)
  const layerTexts = []; for (const s of sites.filter(x => x.layer)) walk(s.root, n => { if ((n.type === 'string' || n.type === 'template_string') && outputPos(n)) layerTexts.push(unesc(n.type === 'string' ? n.text.slice(1, -1) : ownText(n))); });
  return { sites: out, wrappers: [...wrappers], layerTexts };
}

// ── 프롬프트 글 검사 ──
// 형식 견본: 마지막 "JSON만 출력" 뒤 첫 { 또는 [ 부터 짝이 맞는 곳까지(문자열 건너뜀). 첫 단계 키는 깊이 1의 "키":
export function schemaOf(text) { const all = [...String(text).matchAll(/JSON만 출력\s*:/g)], i = all.length ? all.at(-1).index : -1; if (i < 0) return null; /* 형식 표식(쌍점) — 연결 층이 덧붙이는 "JSON만 출력한다" 문장과 구별 */ const s = text.slice(i), a = s.search(/[{[]/); if (a < 0) return { body: '', keys: [], tail: s.slice(s.indexOf(':') + 1).trim() };
  let d = 0, j = a, inStr = false; const keys = []; for (; j < s.length; j++) { const c = s[j]; if (inStr) { if (c === '\\') j++; else if (c === '"') inStr = false; continue; }
    if (c === '"') { inStr = true; if (d === 1 && s[a] === '{') { const m = /^"([^"\\]+)"\s*:/.exec(s.slice(j)); if (m) keys.push(m[1]); } continue; } if (c === '{' || c === '[') d++; else if (c === '}' || c === ']') { d--; if (!d) break; } }
  return { body: s.slice(a, j + 1), keys, tail: s.slice(j + 1).trim(), closed: d === 0 }; }
// 견본을 너그럽게 JSON으로: 800~3000 → 800, 따옴표 없는 말 → 문자열, 끝 쉼표·빈 값 정리. 못 읽으면 null
export function lenientJSON(body) { let t = String(body).replace(/:\s*(-?\d+(?:\.\d+)?)\s*~\s*-?\d+(?:\.\d+)?[^,}\]\n"]*/g, ':$1').replace(/"\s*:\s*([^"{[\],}\s][^,}\]\n]*?)\s*(?=[,}\]])/g, (m, v) => /^(-?\d+(\.\d+)?|true|false|null)$/.test(v.trim()) ? m : `":${JSON.stringify(v.trim())}`).replace(/,\s*([}\]])/g, '$1').replace(/\[\s*\.\.\.\s*\]/g, '[]').replace(/,\s*\.\.\.\s*(?=[\]}])/g, '').replace(/:\s*(?=[,}])/g, ':""');
  try { return JSON.parse(t); } catch { return null; } }
// 가짜 글 AI의 답: 형식 견본(lenientJSON 결과)을 그럴듯한 답으로 — 앱이 답을 검사해 버리지 않고 채우기까지 가게(동적 도구 tools/play/combos·upgrade가 같이 씀)
//   빈 글 → "값 n" · 고르기 견본(a|b|c) → 목록 안 차례대로 하나씩 · 영문 식별자(focus 같은 id) → 그대로 · 글 → 번호를 붙여 서로 다르게(같은 줄 되풀이가 가짜로 생기지 않게)
//   객체 하나짜리 목록 → 그 안 고르기 견본의 가짓수만큼(최대 4개) 늘림(예: 포지션은 기본형 공격·방어·지원이 다 있어야 받음). 브라우저에도 넘기므로 바깥 이름을 쓰지 않음
export function fakeAnswer(v, st = { n: 0 }, i = 0) { const isEnum = s => /^[^\s|]+(\|[^\s|]+)+$/.test(s), width = x => Array.isArray(x) ? Math.max(1, ...x.map(width)) : x && typeof x === 'object' ? Math.max(1, ...Object.values(x).map(width)) : typeof x === 'string' && isEnum(x) ? x.split('|').length : 1;
  if (Array.isArray(v)) { const L = v.length === 1 && v[0] && typeof v[0] === 'object' && !Array.isArray(v[0]) ? Array.from({ length: Math.min(4, width(v[0])) }, () => v[0]) : v; return L.map((x, k) => fakeAnswer(x, st, k)); }
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fakeAnswer(x, st, i)]));
  if (typeof v === 'string') { if (isEnum(v)) { const o = v.split('|'); return o[i % o.length]; } if (/^[a-z][a-z0-9_]*$/.test(v)) return v; /* 영문 식별자(레시피·모드 id)는 그대로 — 번호를 붙이면 앱이 모르는 값이 돼 그 뒤 흐름이 막힘 */ return `${v || '값'} ${++st.n}`; }
  return v; }
const JSON_SINK = /^(aiJSON|aiJSONRetry|SAMPLE\.json|request)$/;
// text: 보낸 프롬프트 · o.sink: 받는 호출 · o.frags: {조각 id: 지금 글} · o.reads: 코드가 읽는 응답 키(정적, 없으면 null)
export function checkPrompt(text, o = {}) { const F = [], add = (kind, code, msg) => F.push({ kind, code, msg: short(msg, 160) }), t = (o.strip || []).reduce((a, x) => x.trim() ? a.split(x.trim()).join('') : a, String(text)); // o.strip: 연결 층이 모든 요청에 덧붙이는 글(지점의 프롬프트가 아님)
  for (const m of new Set(t.match(/\{[A-Za-z_]\w*\}/g) || [])) add('깨짐', '안 채운 자리', `${m} 가 그대로 남음(pf 자리 이름이 넘긴 값에 없음)`);
  for (const m of new Set(t.match(/\bundefined\b|\bNaN\b|\[object Object\]/g) || [])) add('깨짐', '값 없음', `글에 ${m}`);
  const lines = t.split('\n'); lines.forEach((l, i) => { if (/^[^\n:{}"]{1,24}:\s*$/.test(l) && !/JSON만 출력/.test(l)) { const nx = lines[i + 1]; if (nx == null || !nx.trim() || /^[^\n:{}"-]{1,24}:\s*$/.test(nx) || /^JSON만 출력/.test(nx)) add('깨짐', '빈 머리말', `「${l.trim()}」 뒤에 내용이 없음`); } });
  const marks = (t.match(/JSON만 출력\s*:/g) || []).length;
  if (JSON_SINK.test(o.sink || '')) { if (!marks) add('과소', '형식 지시 없음', 'JSON으로 답을 받는데 "JSON만 출력" 표식·견본이 없음'); else if (marks > 1) add('깨짐', '표식 여러 개', `형식 표식 "JSON만 출력:"이 ${marks}번 — 앱(llmWrap)은 마지막 것 앞에 지침·교훈을 넣음`); }
  const sc = schemaOf(t);
  if (sc && sc.body) { if (!sc.closed) add('깨짐', '형식 견본 안 닫힘', '견본의 괄호가 끝까지 닫히지 않음'); else if (!lenientJSON(sc.body)) add('정보', '형식 견본 읽기', '견본을 JSON으로 읽을 수 없음(설명이 섞인 견본)'); if (sc.tail) add('정보', '형식 견본 뒤 글', `견본 뒤에 「${short(sc.tail, 50)}」`); }
  const long = new Map(); lines.map(l => l.trim()).filter(l => l.length >= 30).forEach(l => long.set(l, (long.get(l) || 0) + 1)); for (const [l, n] of long) if (n > 1) add('과잉', '같은 줄 되풀이', `${n}번: 「${short(l, 60)}」`);
  for (const [id, ft] of Object.entries(o.frags || {})) { const parts = String(ft).split(/\{[A-Za-z]\w*\}/).map(x => x.trim()).filter(x => x.length >= 20); if (!parts.length) continue; const k = parts.reduce((m, p) => Math.min(m, t.split(p).length - 1), Infinity); if (k > 1) add('과잉', '같은 조각 되풀이', `${id}가 ${k}번 들어감`); }
  promptConflicts(t).forEach(c => add('과잉', '충돌 지시', `${c.name}: ${c.desc}`));
  // 응답 키: o.used = 실행 중 코드가 실제로 읽은 첫 단계 키(동적 — 흐름이 오류 없이 끝났을 때만) · o.reads = 코드가 읽을 수 있는 키(정적 추정 — 모드별 갈래를 못 가려 정보로만)
  if (o.used && sc && sc.keys.length) { const r = new Set(o.used), got = new Set(o.got || sc.keys); sc.keys.filter(k => got.has(k) && !r.has(k)) /* 답에 그 키가 실제로 왔을 때만(기록된 옛 답에 없는 키는 읽기를 못 잼) */.forEach(k => add('과잉', '읽지 않는 키 요구', `견본의 "${k}"를 이 흐름에서 코드가 읽지 않음(답을 받고도 버림)`)); }
  if (o.reads && sc) o.reads.filter(k => !sc.keys.includes(k) && !t.includes(k)).forEach(k => add('정보', '요구하지 않은 키 읽을 수 있음', `코드가 응답의 "${k}"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음)`));
  return F; }
// 조각 구성: 지금 조각 글(자리로 나눈 20자 이상 덩어리가 모두 들어 있으면 든 것) — 남은 글자는 코드에 쓴 글
export function composition(text, frags) { const t = String(text), used = []; let covered = 0;
  for (const [id, ft] of Object.entries(frags)) { const parts = String(ft).split(/\{[A-Za-z]\w*\}/).map(x => x.trim()).filter(x => x.length >= 20); if (parts.length && parts.every(p => t.includes(p))) { used.push(id); covered += parts.reduce((a, p) => a + p.length, 0); } }
  return { used: used.sort(), covered: Math.min(covered, t.length), len: t.length }; }
