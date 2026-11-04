// 도구가 보지 않던 대상·항목
//   ① DOM id 참조: $('#x')·getElementById('x')·querySelector('#x …')가 찾는 id를 어디서도 만들지 않음(지운 화면의 흔적 — 늘 null)
//   ② HTML 주입: HTML 템플릿의 ${…}에 esc() 없이 들어가는 글(이름·제목·설명…·용어 T()) — innerHTML뿐 아니라 모든 HTML 템플릿
//   ③ 저장 키: mark('x')의 키를 writeKey가 모름(전체 스냅샷엔 들어가도 PC·클라우드 문서 저장에서 빠짐)
//   ④ 전역 리스너 누수: 여러 번 도는 함수·이벤트 콜백 안에서 document/window에 붙이고 떼지 않음(once·signal 없음)
//   ⑤ CSS(src/style): 파싱 오류·괄호 짝(뒤 규칙이 통째로 무시됨), 어디서도 안 쓰는 클래스 선택자
//   ⑥ 부속 파일: 서비스 워커·중계 서버·빌드·도구 스크립트 파싱 오류, PC 서버(파이썬) 구문 오류,
//      중계 서버 두 벌(Cloudflare·Vercel)의 허용 주소 차이와 앱이 부르는 API 주소가 허용 목록에 있는지
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { parse as sgParse, Lang } from '@ast-grep/napi';
import { unboundRefs } from './scope.mjs';
import { walk, tsInit } from './source.mjs';

const FN = /^(function_declaration|function_expression|arrow_function|method_definition|generator_function_declaration)$/;
const strVal = n => n && n.type === 'string' ? n.text.slice(1, -1) : null;
const fnOf = n => { for (let p = n.parent; p; p = p.parent) if (FN.test(p.type)) return p; return null; };
const fnNameOf = f => f.type === 'function_declaration' ? f.childForFieldName('name')?.text : f.parent?.type === 'variable_declarator' ? f.parent.childForFieldName('name')?.text : null;
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
const files = d => existsSync(d) ? readdirSync(d).filter(f => !f.startsWith('.')).sort().flatMap(f => statSync(join(d, f)).isDirectory() ? files(join(d, f)) : [join(d, f)]) : [];

// ① DOM id
export function domIds(units, html = '') {
  const defs = new Set(), pre = [], helper = [], refs = [];
  for (const t of [...units.map(u => u.text), html]) {
    for (const m of t.matchAll(/(?<![\w-])id\s*=\s*\\?["'`]([A-Za-z_][\w-]*)(\$\{|\\?["'`]\s*\+)?/g)) (m[2] ? pre.push(m[1]) : defs.add(m[1])); // id="x" · id="x_${k}"(접두사)
    for (const m of t.matchAll(/\.id\s*=\s*['"`]([A-Za-z_][\w-]*)(\$\{|['"`]\s*\+)?/g)) (m[2] ? pre.push(m[1]) : defs.add(m[1]));
    for (const m of t.matchAll(/setAttribute\(\s*['"]id['"]\s*,\s*['"`]([A-Za-z_][\w-]*)/g)) defs.add(m[1]);
  }
  for (const u of units) {
    // 도우미가 인자로 id를 만드는 경우: onoff('sd_bon',v) → function onoff(id,v){ …id="${id}"… }
    walk(u.tree.rootNode, n => { if (!FN.test(n.type)) return; const nm = fnNameOf(n); if (!nm) return; const one = n.childForFieldName('parameter'), ps = one ? [one] : n.childForFieldName('parameters')?.namedChildren || [], body = n.childForFieldName('body')?.text || '';
      ps.forEach((p, i) => { const pn = p.type === 'assignment_pattern' ? p.childForFieldName('left')?.text : p.type === 'identifier' ? p.text : null; if (pn && new RegExp(`id=\\\\?["'\`]\\$\\{${reEsc(pn)}\\}|\\.id\\s*=\\s*${reEsc(pn)}\\b`).test(body)) helper.push([nm, i]); }); });
    walk(u.tree.rootNode, n => { if (n.type !== 'call_expression') return; const f = n.childForFieldName('function'), a0 = n.childForFieldName('arguments')?.namedChild(0), s = strVal(a0); if (!f) return;
      for (const [nm, i] of helper) if (f.text === nm) { const v = strVal(n.childForFieldName('arguments')?.namedChild(i)); if (v) defs.add(v); }
      if (s == null) return; const prop = f.type === 'member_expression' ? f.childForFieldName('property')?.text : f.text, ids = [];
      if (prop === 'getElementById') ids.push([s]); else if (/^(\$|\$\$|querySelector|querySelectorAll|closest)$/.test(prop)) ids.push(...s.split(',').map(alt => [...alt.matchAll(/(?<![\w\\-])#([A-Za-z_][\w-]*)/g)].map(m => m[1])));
      refs.push({ alts: ids, loc: u.loc(n) }); });
  }
  // 접두사(id="p${i}")는 짧으면 아무 id나 덮으니: 3자 이상이거나 _·-로 끝나거나, 뒤가 숫자일 때만
  const has = id => defs.has(id) || pre.some(p => id.startsWith(p) && (p.length >= 3 || /[_-]$/.test(p) || /^\d/.test(id.slice(p.length))));
  const miss = new Map(); for (const r of refs) { if (!r.alts.length || r.alts.some(a => a.every(has))) continue; /* 선택자 목록('#a,.b')은 하나라도 맞으면 통과 */ for (const id of r.alts.flat().filter(id => !has(id))) { if (!miss.has(id)) miss.set(id, []); miss.get(id).push(r.loc); } }
  return { defs: defs.size, refs: new Set(refs.flatMap(r => r.alts.flat())).size, missing: [...miss].map(([id, at]) => ({ id, at: [...new Set(at)].slice(0, 3) })) };
}

// ② HTML 주입
const TEXTY = /\.(name|title|desc|text|msg|line|bio|look|label|summary|story|note|memo|reason|quote|nick|call|prompt|caption|place|tag|hint)$/;
const CONST = /^[A-Z][A-Z0-9_]*$/;
const rootId = x => { while (x && /^(member_expression|subscript_expression|call_expression)$/.test(x.type)) x = x.type === 'call_expression' ? x.childForFieldName('function') : x.childForFieldName('object'); return x?.type === 'identifier' ? x : null; };
// 상수 표에서 온 값: UPPER.x, UPPER.map(v=>…v.name), Object.entries(UPPER).map(([k,v])=>…), const v=UPPER[k]
function constBound(id) {
  if (CONST.test(id.text)) return true; const nameRe = new RegExp(`(?<![\\w$])${reEsc(id.text)}(?![\\w$])`);
  for (let f = fnOf(id); f; f = fnOf(f)) {
    const ps = f.childForFieldName('parameters') || f.childForFieldName('parameter');
    if (ps && nameRe.test(ps.text)) { const call = f.parent?.type === 'arguments' ? f.parent.parent : null, cf = call?.childForFieldName('function'), obj = cf?.type === 'member_expression' ? cf.childForFieldName('object') : null; if (!obj) return false;
      const src = obj.type === 'call_expression' && /^Object\.(entries|values|keys)$/.test(obj.childForFieldName('function')?.text || '') ? obj.childForFieldName('arguments')?.namedChild(0) : obj, r = rootId(src); return !!r && CONST.test(r.text); }
    let hit = null; const body = f.childForFieldName('body');
    if (body) walk(body, d => { if (hit !== null || (d !== body && FN.test(d.type))) return false; if (d.type === 'variable_declarator' && d.childForFieldName('name')?.text === id.text) { const r = rootId(d.childForFieldName('value')); hit = !!r && CONST.test(r.text); return false; } });
    if (hit !== null) return hit;
  }
  return false;
}
export function htmlInject(units, fns) {
  // 용어 T()·치환 sub()는 사용자·AI·가져온 게임이 정한 글을 돌려줌 — 함수 안에서 <를 걸러 내면(HTML 안전) 통과
  const safe = nm => /\besc\(|replace\(\s*\/\[[^\]]*</.test(fns.get(nm)?.node.text || ''), taint = ['T', 'sub'].filter(n => fns.has(n) && !safe(n)), out = [];
  for (const u of units) walk(u.tree.rootNode, n => { if (n.type !== 'template_string' || !/<\/?[a-z][\w-]*[\s>/]/i.test(n.text)) return;
    for (const s of n.namedChildren) { if (s.type !== 'template_substitution') continue; const bad = [];
      const chk = x => { if (!x) return; if (x.type === 'parenthesized_expression') return chk(x.namedChild(0));
        if (x.type === 'binary_expression' && /^(\|\||\?\?)$/.test(x.childForFieldName('operator')?.type)) { chk(x.childForFieldName('left')); chk(x.childForFieldName('right')); return; }
        if (x.type === 'ternary_expression') { chk(x.childForFieldName('consequence')); chk(x.childForFieldName('alternative')); return; }
        if (x.type === 'member_expression' && TEXTY.test(x.text)) { const r = rootId(x); if (r && !constBound(r)) bad.push(x.text); return; }
        if (x.type === 'call_expression' && taint.includes(x.childForFieldName('function')?.text)) bad.push(x.text.slice(0, 40)); };
      chk(s.namedChild(0)); if (bad.length) out.push({ loc: u.loc(s), what: bad[0] }); } });
  return { out, taint };
}

// ③ 저장 키: mark('x')·mark('c:'+id) ↔ writeKey의 k==='x'·k.startsWith('x')
export function saveKeys(units, writer = 'writeKey') {
  let wk = null; for (const u of units) walk(u.tree.rootNode, n => { if (wk) return false; if (n.type === 'function_declaration' && n.childForFieldName('name')?.text === writer) { wk = n; return false; } });
  if (!wk) return null; const p = reEsc(wk.childForFieldName('parameters')?.namedChild(0)?.text || 'k'), exact = new Set(), pre = [], bad = [];
  for (const m of wk.text.matchAll(new RegExp(`\\b${p}\\s*===?\\s*['"]([^'"]+)['"]`, 'g'))) exact.add(m[1]);
  for (const m of wk.text.matchAll(new RegExp(`\\b${p}\\.startsWith\\(\\s*['"]([^'"]+)['"]`, 'g'))) pre.push(m[1]);
  for (const u of units) walk(u.tree.rootNode, n => { if (n.type !== 'call_expression' || n.childForFieldName('function')?.text !== 'mark') return;
    for (const a of n.childForFieldName('arguments').namedChildren) { let k = strVal(a), part = false; if (k == null && a.type === 'binary_expression' && a.childForFieldName('operator')?.type === '+') { k = strVal(a.childForFieldName('left')); part = true; } if (k == null) continue;
      if (!(part ? pre.some(x => k.startsWith(x)) : exact.has(k) || pre.some(x => k.startsWith(x)))) bad.push({ key: k + (part ? '…' : ''), loc: u.loc(n) }); } });
  return { exact: [...exact], pre, bad };
}

// ④ 전역 리스너 누수
export function listenerLeaks(units, fns) {
  const out = [], GLOBAL = /^(document|window|self|globalThis|document\.body|document\.documentElement)$/;
  const callee = (c, x) => c?.type === 'call_expression' && c.childForFieldName('function')?.startIndex === x.startIndex && c.childForFieldName('function')?.endIndex === x.endIndex; // tree-sitter 노드는 매번 새 객체라 위치로 비교
  const isIIFE = f => callee(f.parent, f) || f.parent?.type === 'parenthesized_expression' && callee(f.parent.parent, f.parent);
  const evCallback = f => { const call = f.parent?.type === 'arguments' ? f.parent.parent : null, cf = call?.childForFieldName('function'); return !!cf && /(^|\.)(addEventListener|on)$/.test(cf.text); };
  // 여러 번 도는 곳인지: 이름 있는 함수는 다른 함수가 부르면(그래프의 호출자), 익명은 이벤트 콜백이면. 즉시 실행·최상위는 한 번
  const owner = (u, n) => { for (let f = fnOf(n); f; f = fnOf(f)) { if (isIIFE(f)) return null; if (evCallback(f)) return { f, why: '이벤트마다' }; const nm = fnNameOf(f); if (nm) { const rec = [...fns.values()].find(r => r.unit === u.name && r.node.startIndex === f.startIndex); return rec && rec.callers.size ? { f, why: `${nm}() 부를 때마다` } : null; } } return null; };
  for (const u of units) walk(u.tree.rootNode, n => { if (n.type !== 'call_expression') return; const f = n.childForFieldName('function');
    if (!(f?.type === 'identifier' ? f.text === 'addEventListener' : f?.type === 'member_expression' && f.childForFieldName('property')?.text === 'addEventListener' && GLOBAL.test(f.childForFieldName('object')?.text || ''))) return;
    const args = n.childForFieldName('arguments'), ev = strVal(args?.namedChild(0)), h = args?.namedChild(1); if (!ev || /once\s*:\s*(true|!0)|signal\s*:/.test(args.namedChild(2)?.text || '')) return;
    const o = owner(u, n); if (!o) return;
    if (h?.type === 'identifier' && new RegExp(`removeEventListener\\(\\s*['"]${reEsc(ev)}['"]\\s*,\\s*${reEsc(h.text)}\\b`).test(u.text)) return;
    out.push({ ev, loc: u.loc(n), why: o.why }); });
  return out;
}

// ⑤ CSS
function braces(css) { // 주석·문자열을 뺀 { } 짝: 어긋난 줄
  const s = css.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' ')).replace(/"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/g, m => ' '.repeat(m.length)); let d = 0, line = 1, open = [];
  for (const ch of s) { if (ch === '\n') line++; else if (ch === '{') { d++; open.push(line); } else if (ch === '}') { d--; open.pop(); if (d < 0) return { line, msg: '여는 { 없이 닫힘' }; } }
  return d ? { line: open.at(-1), msg: `닫히지 않은 { ${d}개(이 줄부터 뒤 규칙이 안쪽으로 들어감)` } : null; }
export function cssCheck(root, codeText) {
  const errors = [], classes = new Map(); let n = 0;
  for (const f of files(join(root, 'src/style')).filter(f => f.endsWith('.css'))) { n++; const path = relative(root, f), text = readFileSync(f, 'utf8'), r = sgParse(Lang.Css, text).root();
    const b = braces(text); if (b) errors.push({ loc: `${path}:${b.line}`, text: b.msg });
    for (const e of r.findAll({ rule: { kind: 'ERROR' } })) errors.push({ loc: `${path}:${e.range().start.line + 1}`, text: e.text().slice(0, 60).replace(/\s+/g, ' ') });
    for (const c of r.findAll({ rule: { kind: 'class_name', inside: { kind: 'class_selector' } } })) if (!classes.has(c.text())) classes.set(c.text(), `${path}:${c.range().start.line + 1}`); }
  // 코드에 이름이 그대로 있거나, 앞부분이 동적으로 붙는 접두사(ls-${…}·'r-'+k)로 나오면 쓰는 것
  const used = c => { if (new RegExp(`(?<![\\w-])${reEsc(c)}(?![\\w-])`).test(codeText)) return true;
    for (let i = c.length - 1; i >= 1; i--) { const p = c.slice(0, i); if (i < 2 && !/^\d/.test(c.slice(i))) continue; /* 한 글자 접두사는 뒤가 숫자일 때만(r${rarity} → r1) */ if (new RegExp(`(?<![\\w\\\\-])${reEsc(p)}(\\$\\{|['"\`]\\s*\\+)`).test(codeText)) return true; } return false; };
  return { files: n, classes: classes.size, errors, dead: [...classes].filter(([c]) => !used(c)).map(([c, loc]) => ({ cls: c, loc })) };
}

// ⑥ 부속 파일
const SIDE = ['www/sw.js', 'proxy/worker.js', 'proxy/vercel/api/proxy.js', 'build', 'tools'];
export async function sideFiles(root) {
  const { parser } = await tsInit(), list = SIDE.flatMap(p => { const a = join(root, p); return !existsSync(a) ? [] : statSync(a).isDirectory() ? files(a).filter(f => /\.m?js$/.test(f) && !/node_modules|[\\/]out[\\/]/.test(f)) : [a]; });
  const parse = [], hosts = {};
  for (const f of list) { const path = relative(root, f), t = parser.parse(readFileSync(f, 'utf8'));
    walk(t.rootNode, n => { if (n.type === 'ERROR' || n.isMissing) { parse.push({ loc: `${path}:${n.startPosition.row + 1}`, text: n.text.slice(0, 60) }); return false; }
      if (n.type === 'variable_declarator' && n.childForFieldName('name')?.text === 'ALLOW_HOSTS' && n.childForFieldName('value')?.type === 'array') { hosts[path] = n.childForFieldName('value').namedChildren.map(strVal).filter(Boolean); return false; } }); }
  const py = files(join(root, 'pc')).filter(f => f.endsWith('.py')); let python = 'skip';
  if (py.length) { const r = spawnSync('python3', ['-c', 'import ast,sys\nfor f in sys.argv[1:]:\n  try: ast.parse(open(f,encoding="utf-8").read(),f)\n  except SyntaxError as e: print(f"{f}:{e.lineno} {e.msg}")', ...py], { encoding: 'utf8' });
    if (!r.error && r.status === 0) { python = py.length; for (const l of r.stdout.split('\n').filter(Boolean)) { const m = /^(.*?):(\d+) (.*)$/.exec(l); parse.push({ loc: `${relative(root, m[1])}:${m[2]}`, text: m[3] }); } } }
  return { files: list.length + (python === 'skip' ? 0 : py.length), python, parse, hosts };
}
// 중계 서버 허용 주소: 두 벌이 같은지 + 앱이 부르는 API 주소(호출 인자·base/url/endpoint 값의 https 주소, API 모양만)가 들어 있는지
export function relayHosts(units, hosts) {
  const lists = Object.entries(hosts); if (!lists.length) return null; const all = new Set(lists.flatMap(([, v]) => v)), diff = [];
  for (const [p, v] of lists) for (const h of all) if (!v.includes(h)) diff.push({ host: h, missingIn: p });
  const api = new Map(), API = /^\/(v\d|api\b|ai\/|token|repos\b|user\b|models|chat|login\/oauth|copilot_internal)|^\/?$/;
  for (const u of units) walk(u.tree.rootNode, n => { if (n.type !== 'string' && n.type !== 'template_string') return; const m = /^[`'"]https:\/\/([a-z0-9.-]+)(?::\d+)?(\/[^`'"$]*)?/i.exec(n.text); if (!m) return;
    const p = n.parent, inCall = p?.type === 'arguments' && p.namedChild(0)?.startIndex === n.startIndex || p?.type === 'binary_expression' && p.parent?.type === 'arguments', inCfg = p?.type === 'pair' && /base|url|endpoint|api/i.test(p.childForFieldName('key')?.text || '') || p?.type === 'variable_declarator' && /DEF|ENDPOINT|BASE|URL/.test(p.childForFieldName('name')?.text || '');
    if (!(inCall || inCfg) || !API.test(m[2] || '/') && !/^(api|image)\./.test(m[1])) return; if (!api.has(m[1])) api.set(m[1], u.loc(n)); });
  const firstList = lists[0][1], ok = h => firstList.includes(h) || /-aiplatform\.googleapis\.com$/.test(h);
  return { diff, api: api.size, notAllowed: [...api].filter(([h]) => !ok(h)).map(([host, loc]) => ({ host, loc })) };
}
// SPA 단일 파일 전제: 앱은 src/를 빌드한 www/index.html 한 파일. 빌드 결과가 로컬 스크립트·스타일시트 파일을 따로 불러오면(<script src="x.js">, <link rel="stylesheet" href="x.css">) 전제가 깨짐.
// 허용: 외부 https 주소(글꼴 등), PWA 부속(manifest·아이콘 링크), 서비스 워커 등록(navigator.serviceWorker.register)
// units를 주면 분석한 코드가 빌드된 SPA에 그대로 들어 있는지도 봄(build.mjs가 src를 템플릿대로 합친 결과 = 제품. 다르면 빌드가 오래됐거나 분석 단위가 빌드 구조와 어긋남)
export function spaCheck(ROOT, units = []) { const out = [], f = join(ROOT, 'www/index.html'); if (!existsSync(f)) return { errors: [{ loc: 'www/index.html', text: '빌드 결과가 없음 — node build/build.mjs' }], scripts: 0 };
  const html = readFileSync(f, 'utf8'), local = u => !/^(https?:)?\/\//.test(u) && !/^data:/.test(u);
  for (const m of html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)) if (local(m[1])) out.push({ loc: 'www/index.html', text: `로컬 스크립트 파일을 따로 불러옴: ${m[1]} — src/에 넣어 빌드로 합치세요` });
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) { const t = m[0], h = (t.match(/href\s*=\s*["']([^"']+)["']/i) || [])[1]; if (h && /rel\s*=\s*["']?stylesheet/i.test(t) && local(h)) out.push({ loc: 'www/index.html', text: `로컬 스타일시트 파일을 따로 불러옴: ${h} — src/style에 넣어 빌드로 합치세요` }); }
  for (const m of html.matchAll(/\bimport\s*\(\s*["'](\.{0,2}\/[^"']+)["']\s*\)/g)) out.push({ loc: 'www/index.html', text: `로컬 모듈을 동적으로 불러옴: ${m[1]}` });
  for (const u of units) if (!html.includes(u.text)) out.push({ loc: u.files[0]?.path || u.name, text: `분석한 코드(${u.name})가 빌드된 www/index.html에 그대로 없음 — node build/build.mjs로 다시 빌드하거나 분석 단위를 빌드 구조에 맞추세요` });
  return { errors: out, scripts: (html.match(/<script\b/gi) || []).length }; }
// 불러올 때 아직 없는 이름(TDZ): 앱 코드는 모듈 블록(src/modules — 차례로) 다음 main(이름순으로 이은 한 스크립트)이 돎. 함수 밖(불러올 때 바로 계산되는 곳)에서
//   뒤에 선언된 const·let·class를 읽으면 "Cannot access … before initialization"으로 앱이 뜨지 않음(코드를 다른 파일로 옮길 때 생기기 쉬움). 함수 본문은 나중에 돌므로 셈하지 않음
export function tdzRefs(units) { const order = [...units.filter(u => u.name.startsWith('module:')), ...units.filter(u => u.name === 'main')], decl = new Map(), out = [];
  order.forEach((u, ui) => { const r = u.tree.rootNode; for (let i = 0; i < r.childCount; i++) { const c = r.child(i); if (c.type === 'lexical_declaration' || c.type === 'class_declaration') (c.type === 'class_declaration' ? [c.childForFieldName('name')] : c.namedChildren.filter(d => d.type === 'variable_declarator').map(d => d.childForFieldName('name'))).forEach(n => { if (n?.type === 'identifier' && !decl.has(n.text)) decl.set(n.text, { ui, at: c.startIndex, loc: u.loc(c) }); }); } });
  const FN = /^(arrow_function|function_expression|function_declaration|generator_function_declaration|method_definition|class_body)$/;
  /* 불러올 때 부르는 함수도 그때 돎: 맨 위 문장이 부른 함수 본문(그 안에서 바로 도는 콜백 — forEach·map 같은 — 포함, 타이머·리스너·프로미스 콜백 빼고)을 따라가며, 그 맨 위 문장 자리보다 뒤에 선언된 이름을 읽으면 TDZ */
  const fnDecl = new Map(); order.forEach(u => { const r = u.tree.rootNode; for (let i = 0; i < r.childCount; i++) { const c = r.child(i); if (c.type === 'function_declaration' && c.childForFieldName('name')) fnDecl.set(c.childForFieldName('name').text, { u, c }); } });
  const LATER = /^(setTimeout|setInterval|requestAnimationFrame|requestIdleCallback|queueMicrotask|addEventListener|then|catch|finally|on\w*)$/, seenOut = new Set();
  const later = n => { const call = n.parent?.type === 'arguments' ? n.parent.parent : null, f = call?.childForFieldName('function'); return !!f && LATER.test(f.type === 'member_expression' ? f.childForFieldName('property')?.text || '' : f.text); };
  order.forEach((u, ui) => { const r = u.tree.rootNode; for (let i = 0; i < r.childCount; i++) { const c = r.child(i); if (c.type === 'function_declaration') continue; const at = c.startIndex, called = new Set();
    const hit = (n, uu, via) => { const d = decl.get(n.text); if (d && (d.ui > ui || (d.ui === ui && d.at > (via ? at : n.startIndex)))) { const k = uu.loc(n) + n.text; if (!seenOut.has(k)) { seenOut.add(k); out.push({ loc: uu.loc(n), name: n.text, decl: d.loc, ...(via ? { via: u.loc(c) + ' → ' + via } : {}) }); } } };
    /* 부른 함수 안에서는 늘 도는 자리만(갈래 if·삼항·&&·||·??의 뒤쪽·switch case·catch는 조건에 따라 돎 — 조건식 자체는 봄) */
    const always = n => n.type === 'if_statement' ? [n.childForFieldName('condition')] : n.type === 'ternary_expression' ? [n.childForFieldName('condition')] : n.type === 'binary_expression' && /^(&&|\|\||\?\?)$/.test(n.child(1)?.text || '') ? [n.childForFieldName('left')] : n.type === 'switch_statement' ? [n.childForFieldName('value')] : n.type === 'try_statement' ? [n.childForFieldName('body')] : n.type === 'catch_clause' ? [] : null;
    const visit = (n, uu, via, inFn) => { if (!n || (FN.test(n.type) && (!inFn || n.parent?.type !== 'arguments' || later(n)))) return; /* 안쪽 함수는 바로 넘긴 콜백(forEach·map …)만 — 객체 칸·대입한 함수는 그때 안 돎 */
      if (n.type === 'identifier' && !(n.parent?.type === 'variable_declarator' && n.parent.childForFieldName('name')?.id === n.id)) hit(n, uu, via);
      if (n.type === 'call_expression' && n.childForFieldName('function')?.type === 'identifier') { const nm = n.childForFieldName('function').text, fd = fnDecl.get(nm); if (fd && !called.has(nm)) { called.add(nm); visit(fd.c.childForFieldName('body'), fd.u, via ? via + ' → ' + nm : nm, true); } }
      const ks = via ? always(n) : null; if (ks) { ks.forEach(k => visit(k, uu, via, inFn)); return; } for (let j = 0; j < n.childCount; j++) visit(n.child(j), uu, via, inFn); };
    visit(c, u, '', false); } });
  return out; }
// 선언 바로 위의 설명 주석(// 줄·한 줄 /* */·여러 줄 /* */)까지 같이 — 파일 머리말(/* =====)과 옮김 표식(…에서 옮김 */)은 남김
export function leadComments(src, at) { let a = at; for (;;) { const before = src.slice(0, a); if (!before.endsWith('\n')) return a; const ls = before.lastIndexOf('\n', before.length - 2) + 1, line = before.slice(ls, -1);
    if (/^\s*\/\//.test(line)) { a = ls; continue; }
    if (/\*\/\s*$/.test(line)) { const st = before.lastIndexOf('/*', before.length - 1); if (st < 0 || (st > 0 && src[st - 1] !== '\n')) return a; const c = src.slice(st, before.length - 1); if (/^\/\* =====|에서 옮김 \*\/$/.test(c.trim()) || /\*\/[\s\S]*\S/.test(c.replace(/\*\/\s*$/, ''))) return a; a = st; continue; }
    return a; } }
// 정의 안 된 이름(부르면 ReferenceError — 처리기를 나누거나 이름을 바꾸다 생기는 회귀): 스크립트마다 범위 사슬로 풀리지 않는 참조 중
//   여러 스크립트의 맨 위 선언·전역에 붙인 이름(window·globalThis·self·root.X = …, Object.defineProperty(window, 매개변수 …)로 전역을 만드는 함수에 넘긴 글자 이름)·
//   브라우저 전역(tools/browser-globals.json — node tools/globals.mjs가 크로미움에서 읽음)·typeof로 있는지 보는 이름(require·module) 어디에도 없는 것
export function undefinedNames(units, globals) { const known = new Set([...(globals.window || []), ...(globals.worker || [])]), R = units.map(u => [u, unboundRefs(u.tree.rootNode)]), guarded = new Set(), definers = new Map();
  for (const [u, r] of R) { r.top.forEach(x => known.add(x)); walk(u.tree.rootNode, n => {
    if (n.type === 'assignment_expression') { const l = n.childForFieldName('left'); if (l?.type === 'member_expression' && /^(window|globalThis|self|root)$/.test(l.childForFieldName('object')?.text || '')) known.add(l.childForFieldName('property')?.text); }
    if (n.type === 'call_expression' && n.childForFieldName('function')?.text === 'Object.defineProperty') { const [o, k] = n.childForFieldName('arguments')?.namedChildren || []; if (/^(window|globalThis|self)$/.test(o?.text || '') && k?.type === 'string') known.add(k.text.slice(1, -1)); }
    if (n.type === 'unary_expression' && n.child(0)?.type === 'typeof' && n.childForFieldName('argument')?.type === 'identifier') guarded.add(n.childForFieldName('argument').text);
    if (n.type === 'function_declaration') { const ps = n.childForFieldName('parameters')?.namedChildren.map(p => p.text) || [], def = n.childForFieldName('body')?.text.match(/Object\.defineProperty\((?:window|globalThis),\s*([A-Za-z_$][\w$]*)/); if (def && ps.includes(def[1])) definers.set(n.childForFieldName('name').text, ps.indexOf(def[1])); } }); }
  for (const [u] of R) walk(u.tree.rootNode, n => { if (n.type !== 'call_expression' || !definers.has(n.childForFieldName('function')?.text)) return; const a = n.childForFieldName('arguments')?.namedChildren[definers.get(n.childForFieldName('function').text)]; if (a?.type === 'string') known.add(a.text.slice(1, -1)); });
  const out = new Map(); for (const [u, r] of R) for (const n of r.refs) { const x = n.text; if (x === 'await' || known.has(x) || guarded.has(x)) continue; const k = x + ' ' + u.loc(n); if (!out.has(k)) out.set(k, { name: x, loc: u.loc(n) }); }
  return [...out.values()]; }
// 읽기 결과에 쓰기(쓴 것이 사라짐): 「있으면 저장된 상태, 없으면 새 기본값」을 돌려주는 읽기 함수(progRead·gameRead·conMeta 꼴 — 어떤 길에서는 상태(G·P()·그 지역 이름)를,
//   다른 길에서는 새 값(객체·배열 글자·clone·Object.assign({}…)·만들기 호출)을 돌려줌, 그런 함수를 그대로 돌려주는 함수도)의 결과에 바로·그 결과를 받은 지역 이름으로 대입·push·delete — 없을 때 쓴 것이 사라짐.
//   새 객체를 만들어 돌려주는 생성 함수·읽고 고쳐 저장하는 함수(늘 새 값)는 아님. 바꿀 때는 progSlot·gameSlot·G.meta.x = … 처럼 상태에 씀
const FRESH = /^(\{|\[|clone\(|structuredClone\(|Object\.assign\(\{\}|\[\.\.\.|s\.make\(|[a-z]\w*\.make\(|GGM(Combat|Construct|Expedition)\.\w+\()/ /* 규칙 엔진(순수 모듈) 호출은 늘 새 값 */, STATE_ROOT = /^(G|P\(\)|G\.prog)\b/;
export function returnsOf(f) { const out = []; walk(f.node, n => { if (n !== f.node && /function|arrow/.test(n.type)) return false; if (n.type === 'return_statement' && n.namedChildren[0]) { const v = n.namedChildren[0]; if (v.type === 'ternary_expression') out.push(v.childForFieldName('consequence'), v.childForFieldName('alternative')); else out.push(v); } }); return out.filter(Boolean); }
// 함수 안 지역 이름의 처음 값(상태에서 왔나 판정용)
function stateLocals(f, ps = new Set()) { const st = new Set(); walk(f.node, n => { if (n.type !== 'variable_declarator') return; const vn = n.childForFieldName('value'), v = vn?.text || '', nm = n.childForFieldName('name')?.text; if (nm && (STATE_ROOT.test(v) || (vn?.type === 'member_expression' && ps.has(v.split(/[.[(]/)[0])) /* 매개변수 엔티티의 칸 */ || /^(progRead|gameRead)\(/.test(v) /* 칸 읽기 결과 = 상태 */ || /^\w+\s*\?\s*\w+\s*:/.test(v) && STATE_ROOT.test(v.split('?')[0]))) st.add(nm); }); return st; }
/* 새 값의 원소도 새로 만듦(펼쳐 다시 담기·map·clone) — 이런 읽기의 결과는 원소에 써도 사라짐. 칸 읽기(progRead·gameRead)의 새 값은 빈 기본값이라 원소가 없음 */
export { FRESH };
const DEEP = /^\[\.\.\.|\.map\(|^clone\(|^structuredClone\(/;
/* 늘 새 값을 만드는 함수(모든 return이 새 값 — scgNew·cleanChar0 같은 만들기, 상태를 쓰지 않음): 이 함수를 부른 값도 새 값 */
export function freshFactories(fns, mut) { return new Set([...fns.values()].filter(f => f.top && !mut.has(f.key)).filter(f => { const rs = returnsOf(f); return rs.length && rs.every(x => FRESH.test(x.text)); }).map(f => f.name)); }
export function freshReaderWrites(units, fns, mut, opt = {}) { const readers = new Set(['progRead', 'gameRead', ...(opt.readers || [])]) /* opt.readers: 읽기로 바꿔 보려는 쓰기 접근(fix.mjs --rule L2-read가 progSlot을 넣어 그 결과에 쓰는 자리를 찾음) */, deep = new Set(), elemOf = new Set() /* 읽기 결과의 원소를 돌려주는 읽기(relPair = RELS().find …) */;
  const fac = freshFactories(fns, mut), isFresh = x => FRESH.test(x.text) || (x.type === 'call_expression' && fac.has(x.childForFieldName('function')?.text));
  for (const f of fns.values()) { if (!f.top || mut.has(f.key)) continue; const root = x => x.text.split(/[.[(]/)[0], ps = new Set(); walk(f.node.childForFieldName('parameters') || f.node.childForFieldName('parameter') || { type: 'none' }, n => { if (n.type === 'identifier' && n.parent?.type !== 'member_expression') ps.add(n.text); }); const rs = returnsOf(f), sl = stateLocals(f, ps);
    /* 상태 = G·P()·그 지역 이름, 또는 매개변수로 받은 엔티티의 칸(c.scg — 캐릭터는 상태) */
    const state = rs.some(x => STATE_ROOT.test(x.text) || sl.has(root(x)) || (x.type === 'member_expression' && ps.has(root(x)))), fresh = rs.filter(isFresh); if (state && fresh.length) { readers.add(f.name); if (fresh.some(x => DEEP.test(x.text))) deep.add(f.name); } }
  /* 블록마다 선언한 이름 → 처음 값 노드(가림 포함) — 쓰는 자리에서 가장 가까운 블록의 선언으로 풂 */
  const decl = new Map(); for (const u of units) { walk(u.tree.rootNode, n => { if (n.type !== 'variable_declarator') return; const nm = n.childForFieldName('name'); if (nm?.type !== 'identifier') return; let b = n.parent; while (b && !/statement_block|program|switch_case|for_statement|for_in_statement/.test(b.type)) b = b.parent; if (!b) return; if (!decl.has(b.id)) decl.set(b.id, new Map()); decl.get(b.id).set(nm.text, n.childForFieldName('value') || null); }); }
  const declAt = (n, name) => { for (let b = n.parent; b; b = b.parent) { const m = decl.get(b.id); if (m && m.has(name)) return m.get(name); if (/function|arrow|method/.test(b.type)) { const ps = (b.childForFieldName('parameters')?.text || b.childForFieldName('parameter')?.text || ''); if (new RegExp(`\\b${name}\\b`).test(ps)) return null; } } return null; };
  /* 값의 출처 → 그 값을 낸 읽기 호출 노드: 멤버·첨자·원소를 고르는 메서드(find·filter·at …)를 거슬러 올라가 읽기 호출, 또는 받은 지역 이름의 처음 값으로(원소에 써도 읽기 결과에 쓴 것) */
  const PICK = /^(find|filter|at|slice|concat|findLast|sort|reverse|flat)$/;
  const origin = (t, seen = new Set(), elem = false) => { let x = t; for (;;) { if (x?.type === 'member_expression') x = x.childForFieldName('object'); else if (x?.type === 'subscript_expression') { x = x.childForFieldName('object'); elem = true; } else if (x?.type === 'parenthesized_expression') x = x.namedChildren[0]; else if (x?.type === 'call_expression' && x.childForFieldName('function')?.type === 'member_expression' && PICK.test(x.childForFieldName('function').childForFieldName('property')?.text || '')) { x = x.childForFieldName('function').childForFieldName('object'); elem = true; } else break; }
    if (x?.type === 'identifier') { if (seen.has(x.text)) return null; seen.add(x.text); const v = declAt(x, x.text); return v ? origin(v, seen, elem) : null; } return x?.type === 'call_expression' && readers.has(x.childForFieldName('function')?.text) ? { call: x, elem } : null; };
  /* 쓰는 대상(a.b = · a[k] = · a.push)의 그릇 a부터 출처를 찾음 — 그릇이 읽기 결과 자체면 늘 잡고, 원소(첨자·find …)를 거쳤으면 원소까지 새로 만드는 읽기만 */
  const rootCall = t => { const c = t.type === 'call_expression' ? origin(t) : origin(t.childForFieldName('object') || t); const fn = c?.call.childForFieldName('function').text; return c && (!(c.elem || elemOf.has(fn)) || deep.has(fn)) ? c.call : null; };
  /* 그런 읽기 함수의 결과(또는 그 원소 — return 읽기(…).find(…))를 돌려주는 함수도 읽기 — 더 바뀌지 않을 때까지 */
  for (let more = true; more;) { more = false; for (const f of fns.values()) { if (!f.top || mut.has(f.key) || readers.has(f.name)) continue; const o = returnsOf(f).map(v => origin(v)).find(Boolean); if (o) { const g = o.call.childForFieldName('function').text; readers.add(f.name); if (deep.has(g)) deep.add(f.name); if (o.elem || elemOf.has(g)) elemOf.add(f.name); more = true; } } }

  const out = []; for (const u of units) { walk(u.tree.rootNode, n => { let t = null;
    /* 읽기 함수를 부르고 결과를 버림(예전 게터처럼 「만들어 두기」로 부른 것 — 읽기는 효과가 없어 그 뒤 쓰기가 사라지거나 없는 칸을 씀) */
    const ex = n.type === 'expression_statement' ? n.namedChildren[0] : null; if (ex?.type === 'call_expression' && readers.has(ex.childForFieldName('function')?.text)) { out.push({ fn: ex.childForFieldName('function').text, loc: u.loc(n), text: n.text.slice(0, 80) + ' (결과를 버림)', call: { unit: u.name, start: ex.startIndex, end: ex.endIndex, text: ex.text, at: u.loc(ex) } }); return; }
    if (n.type === 'assignment_expression' || n.type === 'augmented_assignment_expression') t = n.childForFieldName('left'); else if (n.type === 'update_expression') t = n.childForFieldName('argument'); else if (n.type === 'unary_expression' && n.child(0)?.type === 'delete') t = n.childForFieldName('argument');
    else if (n.type === 'call_expression') { const g = n.childForFieldName('function'); if (g?.type === 'member_expression' && /^(push|splice|unshift|pop|shift)$/.test(g.childForFieldName('property')?.text || '')) t = g.childForFieldName('object'); }
    if (!t || (t.type !== 'member_expression' && t.type !== 'subscript_expression' && t.type !== 'call_expression')) return; const c = rootCall(t); if (c) out.push({ fn: c.childForFieldName('function').text, loc: u.loc(n), text: n.text.slice(0, 80), call: { unit: u.name, start: c.startIndex, end: c.endIndex, text: c.text, at: u.loc(c) } }); }); }
  return out; }
