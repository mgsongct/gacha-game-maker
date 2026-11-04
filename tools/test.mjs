#!/usr/bin/env node
// 점검 도구 자체 검사: 일부러 문제를 심은 작은 src/로 각 분석이 잡아내는지 확인 (node tools/test.mjs)
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadUnits, walk } from './lib/source.mjs';
import { buildGraph, unused, unusedVars, cycles, deepest } from './lib/graph.mjs';
import { actions, mutations, stateFlow } from './lib/flow.mjs';
import { parseErrors, dupBodies, repeatedStrings, sgRules, commentedCode } from './lib/quality.mjs';
import { domIds, htmlInject, saveKeys, listenerLeaks, cssCheck, sideFiles, relayHosts, spaCheck } from './lib/extra.mjs';
import { analyze } from './lib/analyze.mjs';
import { findings, compare } from './lib/ratchet.mjs';
import { wiringReport, schemaKeys } from './lib/wiring.mjs';
import { stageClosures } from './lib/lifecycle.mjs';
import { bindings, violations, renameEdits } from './lib/names.mjs';
import { inlinePrompts, pureModules, imperative, fragmentFiles } from './lib/prompts.mjs';
import { moveLiteral, slotName } from './prompts-move.mjs';
import { moduleMap, louvain } from './lib/modules.mjs';
import { reachable, claimNames } from './lib/history.mjs';
import { surfaceOf, placeOf, surfaceMap } from './lib/surface.mjs';
import { archMap } from './lib/arch.mjs';
import { moduleOf } from './lib/scope.mjs';

const root = mkdtempSync(join(tmpdir(), 'ggm-tools-')), w = (p, s) => { mkdirSync(join(root, p, '..'), { recursive: true }); writeFileSync(join(root, p), s); };
w('src/index.html', '<script>\n<!--@ main/ -->\n</script>\n');
w('src/main/010-a.js', `const LIMIT=3; const UNUSED_K=7;
let G={meta:{}}; function P(){ return G.prog; }
function mark(k){ return k; }
function saveGood(){ G.meta.title='x'; mark('meta'); }
function saveBad(){ G.meta.secret=1; }
function helperMut(){ P().gold=1; }
function caller(){ helperMut(); mark('prog'); }
function ping(n){ return n>0?pong(n-1):0; }
function pong(n){ return ping(n); }
function deep1(){ deep2(); } function deep2(){ deep3(); } function deep3(){ setTimeout(()=>deep4(),0); } function deep4(){ return 1; }
function same1(x){ const a=x*2+1; const b=a*a; if(b>10&&a<5) return b-a; return [a,b,a+b,a*b,'긴 본문이 같은 함수는 다중화로 잡혀야 한다', a-b, b-a, a%3, b%7, Math.max(a,b), Math.min(a,b)].join(','); }
function same2(x){ const a=x*2+1; const b=a*a; if(b>10&&a<5) return b-a; return [a,b,a+b,a*b,'긴 본문이 같은 함수는 다중화로 잡혀야 한다', a-b, b-a, a%3, b%7, Math.max(a,b), Math.min(a,b)].join(','); }
function neverCalled(){ return 1; }
function viewHTML(){ return \`<button data-act="go">가기</button><button data-act="ghost">처리 없음</button><b>\${G.meta.title}</b>\`; }
`);
w('src/main/020-b.js', `function LIMIT(){ return 1; }
document.addEventListener('click',e=>{ const b=e.target.closest('[data-act]'); if(!b) return; const a=b.dataset.act; if(a==='go') saveGood(); if(a==='dead') saveBad(); });
document.addEventListener('click',e=>{ const act=e.target.dataset.act; if(act==='go') caller(); });
function msg1(){ return '같은 긴 안내 문구가 여러 파일에 흩어져 있으면 파편화로 잡혀야 합니다(세 번 이상 나오는 60자 넘는 문구는 한곳에 모아 관리해야 해요)'; }
function msg2(){ return '같은 긴 안내 문구가 여러 파일에 흩어져 있으면 파편화로 잡혀야 합니다(세 번 이상 나오는 60자 넘는 문구는 한곳에 모아 관리해야 해요)'; }
function msg3(){ try{ return '같은 긴 안내 문구가 여러 파일에 흩어져 있으면 파편화로 잡혀야 합니다(세 번 이상 나오는 60자 넘는 문구는 한곳에 모아 관리해야 해요)'; }catch(e){} }
`);
w('src/modules/x/010-m.js', 'function broken( { return 1; }\n');
w('src/main/030-c.js', `function ico(act,label){ return \`<button data-act="\${act}">\${label}</button>\`; }
function lobbyHTML(){ return ico('daily','보급')+ico('mailopen','우편')+\`<i>\${G.prog.scene}</i>\`; }
function setScene(){ P().scene=1; mark('prog'); }
async function handleMiscAction(a,t){ switch(a){
case 'daily': mark('d'); break;
case 'mailopen': { if(t){ if(t.x){ if(t.y){ if(t.z){ if(t.w){ mark('deep'); } } } } } break; }
case 'orphan': mark('o'); break;
} }
const APP_ACTION_HANDLERS=Object.freeze({${Array.from({length:22},(_,i)=>`"x${i}":handleMiscAction`).join(',')},"daily":handleMiscAction,"mailopen":handleMiscAction,"lost":handleMiscAction});
async function loadIt(){ try{ await fetch('x'); }catch(e){} try{ JSON.parse('1'); }catch(e){} try{ await fetch('y'); }catch(e){ /* 의도 */ } }
`);
// 새 대상·항목: DOM id·HTML 주입·저장 키·리스너 누수·CSS·부속 파일·중계 서버
w('src/main/040-d.js', `function T(k){ return (G.meta.terms||{})[k]||k; }
function esc(s){ return String(s); }
function onoff(id,v){ return \`<select id="\${id}"><option>\${v}</option></select>\`; }
function rowHTML(c,i){ return \`<li id="row_\${i}" class="used r\${i}"><b>\${c.name}</b><i>\${esc(c.name)}</i><u>\${T('crew')}</u>\${onoff('sd_x',1)}<p id="p\${i}"></p><s class="ls-\${i}"></s></li>\`; }
const MISSIONS=[{name:'a'}]; function missionHTML(){ return MISSIONS.map(m=>\`<b>\${m.name}</b>\`).join('')+\`<i class="q\${1}"></i>\`; }
const KINDS={a:{desc:'설명'}}; function kindHTML(k){ const v=KINDS[k]; return \`<p>\${v.desc}</p>\`; }
function readIt(){ return [$('#row_3'), $('#sd_x'), $('#nowhere'), $('#phX'), $('#gone,.setup'), document.getElementById('row_9')]; }
function writeKey(k){ if(k==='prog') return 1; if(k.startsWith('c:')) return 2; }
function saveIt(id){ mark('progs'); mark('c:'+id); mark('prog'); }
function openThing(){ document.addEventListener('keydown', e=>e); }
function useOpen(){ openThing(); }
function onK(){ return 1; }
function openOk(){ document.addEventListener('keydown', onK); window.addEventListener('blur', ()=>1, {once:true}); }
function closeOk(){ document.removeEventListener('keydown', onK); }
function useOk(){ openOk(); closeOk(); }
(function(){ document.addEventListener('keyup', ()=>1); })();
function callApi(){ return [http('https://api.a.com/v1/x'), http('https://api.c.com/v1/y')]; }
`);
w('src/style/010-a.css', '.used{color:red}\n.deadcls{x:1}\n.r1{}\n.ls-a{}\n.qdead{}\n.broken{color:red;\n');
w('src/style/020-b.css', '.x{color:red}}\n');
w('www/sw.js', "self.addEventListener('fetch', e => { e.respondWith( ; });\n");
w('proxy/worker.js', "const ALLOW_HOSTS = ['api.a.com', 'api.b.com'];\n");
w('proxy/vercel/api/proxy.js', "const ALLOW_HOSTS = ['api.a.com'];\n");
w('pc/bad.py', 'def f(:\n    pass\n');
const units = await loadUnits(root), text = units.map(u => u.text).join('\n'), { fns, issues, tops } = buildGraph(units);
assert.ok(issues.some(i => i.kind === '이름 충돌' && i.msg.includes('LIMIT')), '최상위 이름 충돌(const vs function)');
assert.ok(parseErrors(units).some(p => p.loc.includes('010-m.js')), '파싱 오류 위치');
{ const U = unused(fns, text).map(f => f.name); assert.ok(['neverCalled', 'deep1', 'viewHTML'].every(n => U.includes(n)) && !['saveGood', 'ping', 'caller', 'helperMut'].some(n => U.includes(n)), '안 쓰는 함수: ' + U); }
assert.ok(unusedVars(tops, fns, text).some(v => v.name === 'UNUSED_K'), '안 쓰는 최상위 상수');
assert.ok(cycles(fns).some(c => c.includes('ping') && c.includes('pong')), '순환');
assert.ok(deepest(fns).some(p => p.join('>') === 'deep1>deep2>deep3'), '콜스택: setTimeout 안은 비동기라 깊이에서 빠짐');
const act = actions(units); assert.deepEqual(act.missing.map(x => x.act), ['ghost'], '처리기 없는 액션'); assert.ok(act.deadH.some(x => x.act === 'dead'), '발신 없는 처리기'); assert.deepEqual(act.multi.map(x => x.act), ['go'], '전역 리스너 두 곳에서 처리');
const mu = mutations(units, fns); assert.deepEqual(mu.unsaved.map(x => x.fn.name), ['saveBad'], '저장 표시 없는 상태 변경(호출자가 mark하면 통과)');
const sf = stateFlow(units, fns); assert.ok(sf.writeOnly.some(x => x.key === 'G.meta.secret'), '쓰기만 하는 키'); assert.ok(sf.list.find(x => x.key === 'G.meta.title').screens >= 1, '화면 함수가 읽는 키');
assert.ok(dupBodies(fns, 100).some(d => d.fns.some(f => f.startsWith('same1')) && d.fns.some(f => f.startsWith('same2'))), '같은 본문 함수');
assert.ok(repeatedStrings(units).some(s => s.n === 3), '되풀이되는 긴 문자열');
const sg = sgRules(units); assert.equal(sg.listeners.length, 2, '전역 클릭 리스너 수(ast-grep)'); assert.equal(sg.emptyCatch.filter(x => x.loc.includes('020-b')).length, 1, '빈 catch(ast-grep)');
{ const A = actions(units, '<b data-act="go"></b>'); assert.ok(!A.missing.some(x => x.act === 'daily' || x.act === 'mailopen'), '도우미 인자로 만든 data-act는 발신으로 셈');
  assert.ok(A.regMissing.some(x => x.act === 'lost') && A.regMissing.some(x => x.act === 'x0'), '분배 표에 있지만 case 없음'); assert.ok(A.regOrphan.some(x => x.act === 'orphan'), '분배 표에 없는 case'); }
{ const f = fns.get('handleMiscAction'); assert.ok(f.cases && f.cases.find(c => c.act === 'mailopen').depth >= 5, '분배기 case별 복잡도·중첩'); }
assert.ok(!stateFlow(units, fns).writeOnly.some(x => x.key === 'P().scene'), 'G.prog는 P()와 같은 객체(별칭)');
{ const cats = sgRules(units).emptyCatch.map(x => x.cat); assert.ok(cats.includes('비동기 작업') && cats.includes('파싱 대체') && cats.includes('의도 표시'), '빈 catch 분류: ' + cats); }
{ const html = '<div id="app"></div>', D = domIds(units, html), miss = D.missing.map(m => m.id);
  assert.deepEqual(miss.sort(), ['nowhere', 'phX'], 'DOM id: 없는 id만(도우미 인자·접두사 row_·선택자 목록은 통과, 한 글자 접두사 p는 phX를 덮지 않음): ' + miss); }
{ const H = htmlInject(units, fns), at = H.out.map(x => x.what);
  assert.ok(at.includes('c.name') && at.some(x => x.startsWith("T('crew')")) && !at.includes('m.name') && !at.includes('v.desc'), 'HTML 주입: esc 없는 이름·HTML 안전하지 않은 T()는 잡고 상수 표(MISSIONS.map·const v=KINDS[k])는 통과: ' + at); }
{ const K = saveKeys(units); assert.ok(K.bad.some(x => x.key === 'progs') && !K.bad.some(x => x.key === 'prog' || x.key === 'c:…'), '저장 키: writeKey가 모르는 키: ' + K.bad.map(x => x.key)); }
{ const L = listenerLeaks(units, fns); assert.deepEqual(L.map(x => x.ev + '@' + x.loc.split(':')[0]), ['keydown@src/main/040-d.js'], '리스너 누수: 부를 때마다 붙고 안 떼는 것만(떼는 것·once·즉시 실행은 통과)'); }
{ const C = cssCheck(root, units.map(u => u.text).join('\n')), dead = C.dead.map(x => x.cls);
  assert.ok(C.errors.some(e => e.loc.startsWith('src/style/010-a.css') && /닫히지 않은/.test(e.text)) && C.errors.some(e => e.loc.startsWith('src/style/020-b.css')), 'CSS: 닫히지 않은 {·여는 { 없는 }: ' + JSON.stringify(C.errors));
  assert.ok(dead.includes('deadcls') && dead.includes('qdead') && !['used', 'r1', 'ls-a'].some(c => dead.includes(c)), 'CSS: 안 쓰는 클래스(동적 접두사 r${…}·ls-${…}는 씀, 한 글자 접두사 q${…}는 뒤가 숫자일 때만): ' + dead); }
{ const S = await sideFiles(root), P = S.parse.map(p => p.loc.split(':')[0]);
  assert.ok(P.includes('www/sw.js'), '부속 파일 파싱 오류(서비스 워커): ' + P); if (S.python !== 'skip') assert.ok(P.includes('pc/bad.py'), '파이썬 구문 오류: ' + P);
  const RH = relayHosts(units, S.hosts); assert.deepEqual(RH.diff, [{ host: 'api.b.com', missingIn: 'proxy/vercel/api/proxy.js' }], '중계 서버 두 벌의 허용 주소 차이');
  assert.deepEqual(RH.notAllowed.map(x => x.host), ['api.c.com'], '앱이 부르는 API 주소가 중계 허용 목록에 없음'); }
{ const r2 = mkdtempSync(join(tmpdir(), 'ggm-tools-')); mkdirSync(join(r2, 'src/main'), { recursive: true });
  writeFileSync(join(r2, 'src/main/010-a.js'), "function T(k){ return String(k).replace(/[<>]/g,''); }\nfunction vHTML(){ return `<b>${T('x')}</b>`; }\n");
  const u2 = await loadUnits(r2), H2 = htmlInject(u2, buildGraph(u2).fns); assert.ok(!H2.out.length && !H2.taint.length, 'HTML 안전한 T()는 통과'); rmSync(r2, { recursive: true, force: true }); }
// 이름 규칙: 컬렉션 콜백·찾기 결과로 종류를 알아내고, 다른 종류에도 쓰이는 이름을 규칙 이름으로 안전하게 바꿈(한글 앞 글자·단축 속성·안쪽 재선언·충돌 건너뜀)
{ const r4 = mkdtempSync(join(tmpdir(), 'ggm-tools-')); mkdirSync(join(r4, 'src/main'), { recursive: true });
  const src = "let G={};\nfunction fa(){ const 이름='가나다'; return G.chapters.map(c => ({ c, t: c.title, n: (() => { const c = 1; return c; })() })).concat(G.chars.map(c => c.name)); }\nfunction fb(){ return G.chapters.map(c => { const ch = 1; return c.x + ch; }); }\nfunction fc(){ const c = G.chars.find(x => x.id === 1), k = $('#a').value; return [c, k, G.lib.map(x => x.kind)]; }\nasync function fd(){ try { await f1(); } catch (e) { try { await f2(); } catch (e2) { throw e2; } } }\nfunction fe(){ return G.chars.map(e2 => e2.id); }\n";
  writeFileSync(join(r4, 'src/main/010-n.js'), src); const u4 = await loadUnits(r4), B4 = bindings(u4), V4 = violations(B4, { 캐릭터: 'c', 장: 'ch' });
  assert.ok(!B4.some(b => b.name === 'k'), "$('#a').value는 DOM 요소가 아님(호출 결과의 멤버)");
  const V4x = violations(B4, { 캐릭터: 'c', 장: 'ch', 요소: 'el', 자료: 'l' }).filter(v => v.name === 'x' && v.kind === '캐릭터'); assert.ok(V4x.length === 1 && /가림/.test(renameEdits(V4x[0]).why || ''), '바깥 const c를 가리는 바꾸기는 건너뜀');
  const V4e = violations(B4, { 오류: 'e', 캐릭터: 'c' }).filter(v => v.name === 'e2' && v.kind === '오류'); assert.ok(V4e.length === 1 && /가림/.test(renameEdits(V4e[0]).why || ''), '바깥 catch(e)를 가리는 catch(e2)→e 바꾸기는 건너뜀');
  assert.equal(V4.length, 4, '장에 쓴 c 두 곳 + 캐릭터·자료에 쓴 x + 캐릭터·오류에 쓴 e2: ' + JSON.stringify(V4.map(v => v.loc)));
  const R4 = V4.map(renameEdits); assert.ok(R4[0].ok && !R4[1].ok && /이미 있음/.test(R4[1].why), '두 번째는 범위 안 ch와 충돌해 건너뜀');
  let t4 = u4[0].text; R4[0].edits.sort((a, b) => b.start - a.start).forEach(e => { t4 = t4.slice(0, e.start) + e.text + t4.slice(e.end); });
  assert.ok(t4.includes("G.chapters.map(ch => ({ c: ch, t: ch.title, n: (() => { const c = 1; return c; })() })).concat(G.chars.map(c => c.name))"), '바꾼 결과: ' + t4.split('\n')[1]);
  rmSync(r4, { recursive: true, force: true }); }
// 함수를 담은 표: 속성을 멤버로 호출하면 표 안 함수가 부르는 함수까지 이어지고, 표를 참조만 하면 잇지 않음(안 쓰는 함수로도 안 잡음)
{ const r5 = mkdtempSync(join(tmpdir(), 'ggm-tools-')); mkdirSync(join(r5, 'src/main'), { recursive: true });
  writeFileSync(join(r5, 'src/main/010-t.js'), "const RULE_T=[{id:'a',since:2,fix:{run:o=>doFix(o)}}];\nfunction doFix(o){ return o; }\nfunction fixOne(rule,o){ return rule.fix.run(o); }\nfunction ver(){ return Math.max(...RULE_T.map(r=>r.since)); }\n");
  const g5 = buildGraph(await loadUnits(r5)).fns;
  assert.ok(g5.get('fixOne').calls.has('RULE_T.run') && g5.get('RULE_T.run').calls.has('doFix'), '멤버 호출(rule.fix.run) → 표 안 함수 → doFix');
  assert.ok(!g5.get('ver').calls.has('RULE_T.run'), '표를 참조만(map·since) 하면 잇지 않음'); assert.ok(!unused(g5, "RULE_T fixOne ver doFix doFix").some(f => f.table), '표 의사 함수는 안 쓰는 함수가 아님');
  rmSync(r5, { recursive: true, force: true }); }
// 주석 속 코드: 한 줄 코드 중간 // 주석으로 뒤 문장이 빠진 경우(내가 실제로 두 번 낸 실수)는 잡고, 평범한 주석은 통과
{ const r6 = mkdtempSync(join(tmpdir(), 'ggm-tools-')); mkdirSync(join(r6, 'src/main'), { recursive: true });
  writeFileSync(join(r6, 'src/main/010-c.js'), "function f(o){ o.a = 1; // 미션 확인 o.b = 2; const j = g(o); h(j);\n  return o; } // 이 함수는 o를 돌려줘요 — 예: \"f(o);\"처럼 따옴표 안 코드 예시는 통과\nfunction g(x){ return x; } function h(x){ return x; }\n");
  const C = commentedCode(await loadUnits(r6)); assert.equal(C.length, 1, '주석 속 코드 1건(평범한 주석은 통과): ' + JSON.stringify(C)); rmSync(r6, { recursive: true, force: true }); }
// SPA 단일 파일 전제: 빌드 결과가 로컬 스크립트·스타일시트를 따로 불러오면 오류(외부 글꼴·manifest·아이콘은 통과)
{ w('www/index.html', '<link rel="manifest" href="manifest.webmanifest"><link href="https://fonts.googleapis.com/css2" rel="stylesheet"><script>1</script><script src="app.js"></script><link rel="stylesheet" href="style.css">');
  const S = spaCheck(root).errors.map(e => e.text); assert.ok(S.length === 2 && /app\.js/.test(S[0]) && /style\.css/.test(S[1]), 'SPA 단일 파일: ' + JSON.stringify(S)); w('www/index.html', '<script>1</script>'); }
// 분석한 코드 = 빌드된 SPA에 들어간 코드(build.mjs가 src를 합친 결과): SPA에 그대로 있으면 통과, 없으면(빌드가 오래됨·분석 단위 어긋남) 오류
{ const inSpa = spaCheck(root, [{ name: 'main', text: '1', files: [{ path: 'src/main/a.js' }] }]).errors, stale = spaCheck(root, [{ name: 'main', text: 'let x = 2;', files: [{ path: 'src/main/a.js' }] }]).errors.map(e => e.text);
  assert.ok(!inSpa.length && stale.length === 1 && /빌드된 www\/index\.html에 그대로 없음/.test(stale[0]), '분석 코드 ↔ SPA: ' + JSON.stringify(stale)); }
// 프롬프트 스튜디오 밖 프롬프트 글·순수 모듈 경계: 글 AI 호출 프롬프트와 그 조립 함수 속 지시문(해라체)만 셈 — pfDef 조각 기본값·화면 글(해요체·프롬프트로 안 감)은 뺌, 감싸기 함수를 따라감
{ const r7 = mkdtempSync(join(tmpdir(), 'ggm-tools-')); mkdirSync(join(r7, 'src/main'), { recursive: true }); mkdirSync(join(r7, 'src/modules/app'), { recursive: true });
  writeFileSync(join(r7, 'src/main/010-p.js'), "const A_BASE='조각 기본값은 세지 않는다.';\npfDef('A','조각',()=>A_BASE);\nfunction build(c){ return `${A}\\n${part(c)}\\n이름을 짓는다. JSON만 출력: {}`; }\nfunction part(c){ return '소속은 고르게 나눈다.'; }\nfunction ui(){ return '<p>저장했어요. 다시 만든다.</p>'; }\nasync function gen(c){ return aiJSON(build(c)); }\nconst req=async(prompt)=>SAMPLE.json(prompt);\nasync function g2(){ const prompt='요약을 쓴다.'; return req(prompt); }\n");
  writeFileSync(join(r7, 'src/modules/app/020-eng.js'), "/* 엔진 — 순수 함수(DOM·G 없음) */\n(function(root){ const f=(G)=>G+1; function h(){ return document.title + P().x; } root.E={f,h}; })(globalThis);\n");
  const U = await loadUnits(r7), IP = [...new Set(inlinePrompts(U).map(p => p.site.split(' ')[1]))].sort(), PM = pureModules(U).map(x => x.name);
  assert.deepEqual(IP, ['build', 'g2', 'part'], '프롬프트 흐름 속 지시문만: ' + IP); assert.deepEqual(PM, ['document', 'P'], '순수 모듈의 DOM·앱 상태 참조(매개변수 G는 지역): ' + PM);
  assert.ok(imperative('처음 만난다)') && imperative('보스전이다.') && !imperative('저장했어요.') && imperative('BURST 생성 금지.') && !imperative('JSON만 출력: {}'), '해라체 판별(…금지도 지시, JSON만 출력은 표식)');
  writeFileSync(join(r7, 'src/main/020-q.js'), "pfDef('B','다른 곳',()=>'흩어진 조각은 안 된다.');\n"); const FF = fragmentFiles(await loadUnits(r7));
  assert.ok(FF.home === 'src/main/010-p.js' && FF.stray.length === 1 && FF.stray[0].file === 'src/main/020-q.js', '조각이 두 파일에 흩어지면 잡음: ' + JSON.stringify(FF)); rmSync(r7, { recursive: true, force: true }); }
// 프롬프트 흐름 보강: 글로 쓰는 지역 변수(const FAN=…)·연결 층 덧붙임(받은 프롬프트에 붙이는 글)·넘겨받은 글 AI(s.json(p) — 안쪽 콜백)·돌려주는 식만(부수 글 뺌)·출력 자리만(비교값 뺌)
{ const r8 = mkdtempSync(join(tmpdir(), 'ggm-tools-')); mkdirSync(join(r8, 'src/main'), { recursive: true });
  writeFileSync(join(r8, 'src/main/010-a.js'), [
    "async function aiCall(prompt){ const P2=prompt+'\\n\\n다른 설명 없이 JSON만 출력한다.'; return http(P2); }",
    "async function aiJSON(p){ return aiCall(p); }",
    "async function gen(src){ const FAN=src?`원작 「${src}」을 따른다.`:''; return aiJSON(`${FAN}\\n${helper()}${isMe('나')?'':''}\\nJSON만 출력: {\"a\":1}`); }",
    "function helper(){ toast('저장하지 못했다.'); return '이름을 짓는다.'; }",
    "function isMe(n){ return n==='나는 아니다'; }",
    "async function req(s,prompt){ return Promise.resolve().then(()=>s.json(prompt,{})); }",
    "async function skill(){ return req(SAMPLE,'세 스킬을 설계한다.'); }",
    "async function res(){ const r=await fetch('x'); return r.json(); }"].join('\n'));
  const U8 = await loadUnits(r8), got = inlinePrompts(U8).map(p => `${p.site.split(' ')[1]}:${p.head}`).sort();
  assert.deepEqual(got, ['aiCall:\\n\\n다른 설명 없이 JSON만 출력한다.', 'gen:원작 「」을 따른다.', 'helper:이름을 짓는다.', 'skill:세 스킬을 설계한다.'], '프롬프트 흐름 보강: ' + JSON.stringify(got)); rmSync(r8, { recursive: true, force: true }); }
// 자연 경계(모듈성 최대화): 두 덩어리가 다리 하나로 이어지면 두 묶음 — 찾은 경계의 Q가 한 덩어리로 볼 때보다 큼 · 이름 범위: 지역 이름만 넘기고 콜백 인자는 안 셈, 바깥 이름에 쓰기·await 잡음
{ const { louvain, modularity } = await import('./lib/modules.mjs'), adj = new Map(), e = (a, b) => { for (const [x, y] of [[a, b], [b, a]]) { if (!adj.has(x)) adj.set(x, new Map()); adj.get(x).set(y, 1); } };
  ['a', 'b', 'c', 'd'].forEach((x, i, A) => A.slice(i + 1).forEach(y => e(x, y))); ['p', 'q', 'r', 's'].forEach((x, i, A) => A.slice(i + 1).forEach(y => e(x, y))); e('d', 'p');
  for (const sd of [1, 2, 3]) { const c2 = louvain(adj, sd); assert.ok(new Set(c2.values()).size === 2 && c2.get('a') === c2.get('d') && c2.get('a') !== c2.get('p'), '묶기: 노드 순서를 바꿔도 같은 경계(seed)'); }
  const c = louvain(adj), parts = new Set(c.values()); assert.ok(parts.size === 2 && c.get('a') === c.get('d') && c.get('p') === c.get('s') && c.get('a') !== c.get('p') && modularity(adj, c) > modularity(adj, new Map([...adj.keys()].map(k => [k, 0]))), '모듈성 묶기: ' + JSON.stringify([...c]));
  const { freeNames } = await import('./lib/scope.mjs'), r9 = mkdtempSync(join(tmpdir(), 'ggm-tools-')); mkdirSync(join(r9, 'src/main'), { recursive: true });
  writeFileSync(join(r9, 'src/main/010-a.js'), "function top(){}\nasync function f(a,c){ const d=1; let n=0; const X=`${a}${c.map(y=>y+d)}${top()}${G.x}`; const W=`${n++}`; const A=`${await top()}`; }\n");
  const U9 = await loadUnits(r9), decl = nm => { let hit = null; walk(U9[0].tree.rootNode, n => { if (n.type === 'variable_declarator' && n.childForFieldName('name')?.text === nm) hit = n.childForFieldName('value'); }); return hit; };
  const X = freeNames(decl('X')), W = freeNames(decl('W')), A = freeNames(decl('A'));
  assert.ok(X.locals.sort().join() === 'a,c,d' && X.globals.sort().join() === 'G,top' && !X.writes.length && W.writes.join() === 'n' && A.hasAwait, '이름 범위: ' + JSON.stringify({ X, W: W.writes, A: A.hasAwait })); rmSync(r9, { recursive: true, force: true }); }
// 정의 안 된 이름(부르면 ReferenceError): 처리기 매개변수 이름을 잘못 쓴 것은 잡고, 지역(매개변수·let·for…of·catch·안쪽 함수 이름)·다른 스크립트 맨 위·window.X=·defineProperty·전역을 만드는 함수에 넘긴 이름·typeof로 보는 이름·브라우저 전역은 안 잡음
{ const { undefinedNames } = await import('./lib/extra.mjs'), r16 = mkdtempSync(join(tmpdir(), 'ggm-tools-')); mkdirSync(join(r16, 'src/main'), { recursive: true }); mkdirSync(join(r16, 'src/modules/app'), { recursive: true });
  writeFileSync(join(r16, 'src/main/010-a.js'), "function defG(id,v){ Object.defineProperty(window,id,{get:()=>v}); }\ndefG('PFX',1); Object.defineProperty(window,'RULESX',{get:()=>2}); window.SHELLX=3;\nasync function handleXAction(a,t,id,p,el){ switch(a){ case 'x': { const y=e.clientY; return y; } case 'y': { for(const q of [1]) document.title=String(q+PFX+RULESX+SHELLX+FROMMOD); try{ nope(); }catch(err){ return err; } } } }\nfunction inner(){ const f=function g(n){ return n?g(n-1):0; }; return f(1)+(typeof module!=='undefined'&&module.exports?1:0); }\nclass K { m(){ return K; } }\n");
  writeFileSync(join(r16, 'src/modules/app/010-m.js'), "const FROMMOD=1;\n");
  const U = undefinedNames(await loadUnits(r16), { window: ['document', 'window', 'Object', 'String'] }).map(x => x.name).sort(); assert.deepEqual(U, ['e', 'nope'], '정의 안 된 이름: ' + JSON.stringify(U)); rmSync(r16, { recursive: true, force: true }); }
// 읽기 결과에 쓰기(lib/extra.mjs freshReaderWrites): 없으면 새 값을 돌려주는 읽기 함수·progRead의 결과에 쓰면 잡고, 상태에 다시 넣는 꼴은 안 잡음
{ const { freshReaderWrites } = await import('./lib/extra.mjs'), r19 = mkdtempSync(join(tmpdir(), 'ggm-tools-')); mkdirSync(join(r19, 'src/main'), { recursive: true });
  writeFileSync(join(r19, 'src/main/010-r.js'), "let G={meta:{}};\nfunction rd(){ const c=G.meta.x; return c?c:{on:false}; }\nfunction bad(){ rd().on=true; progRead('mail').push(1); }\nfunction ok(){ G.meta.x=Object.assign(rd(),{on:true}); return rd().on; }\n");
  const u = await loadUnits(r19), g = buildGraph(u), W = freshReaderWrites(u, g.fns, mutations(u, g.fns).mut).map(x => x.fn).sort(); assert.deepEqual(W, ['progRead', 'rd'], '읽기 결과에 쓰기: ' + JSON.stringify(W)); rmSync(r19, { recursive: true, force: true }); }
// 요소 매개변수(lib/arch.mjs elementParams): 매개변수를 DOM 요소로 만지면 직접, 그런 자리로 넘기면 거쳐 감(호출 그래프 고정점), 그 밖은 아님
{ const { elementParams } = await import('./lib/arch.mjs'), r18 = mkdtempSync(join(tmpdir(), 'ggm-tools-')); mkdirSync(join(r18, 'src/main'), { recursive: true });
  writeFileSync(join(r18, 'src/main/010-e.js'), "function work(p,btn){ btn.disabled=true; return p; }\nfunction pass(x,b){ return work(x,b||null); }\nfunction top2(q,c){ return pass(q,c); }\nfunction free(n,m){ return work(n,null)+m; }\n");
  const EP = elementParams(buildGraph(await loadUnits(r18)).fns).map(x => `${x.fn}(${x.param})${x.direct ? '*' : '→' + x.via}`).sort(); assert.deepEqual(EP, ['pass(b)→work', 'top2(c)→pass', 'work(btn)*'], '요소 매개변수: ' + JSON.stringify(EP)); rmSync(r18, { recursive: true, force: true }); }
// 규칙 전수검사(lib/rules.mjs): 규칙표가 계층 정의(LAYER_DEF) 하나로 SPA 전체(main·modules)를 판정하고, 그리다가 바꿈(L2)을 끝 함수의 성질로 원인별로 나눔
{ const { runRules } = await import('./lib/rules.mjs'), { analyze } = await import('./lib/analyze.mjs'), { buildMap } = await import('./lib/map.mjs'), r20 = mkdtempSync(join(tmpdir(), 'ggm-tools-')), w20 = (p, x) => { mkdirSync(join(r20, p, '..'), { recursive: true }); writeFileSync(join(r20, p), x); };
  w20('src/index.html', '<div id="app"></div>'); w20('www/index.html', '<html></html>');
  w20('src/main/010-s.js', "let G={meta:{},prog:{}};\nfunction P(){ return G.prog; }\nfunction mark(k){ return k; }\nfunction progSlot(k){ const v=P()[k]||(P()[k]={}); mark('prog'); return v; }\nfunction readList(){ return progSlot('mail').list; }\nfunction cfg(){ if(!G.meta.cfg) G.meta.cfg={on:1}; return G.meta.cfg; }\nfunction saveIt(){ mark('meta'); }\nfunction listHTML(){ return '<p>'+readList()+cfg().on+'</p>'; }\nfunction badHTML(){ saveIt(); return '<b>x</b>'; }\nfunction act(){ G.meta.x=1; return listHTML(); }\n");
  w20('src/modules/app/010-m.js', "function modMix(el){ el.innerHTML='<i>m</i>'; localStorage.setItem('k','v'); }\n");
  const A = await analyze(r20), M = buildMap(A.units, A.fns, stateFlow(A.units, A.fns), ''), RS = runRules({ A, M }), R = id => RS.find(r => r.id === id);
  const l2 = Object.fromEntries(R('L2').items.map(x => [x.what.split(' → ')[0] + '>' + x.end, x.cause]));
  assert.ok(R('L1').items.some(x => x.what === 'modMix' && x.scope === 'modules'), '전수검사: 모듈 쪽 섞임도 잼 ' + JSON.stringify(R('L1').items));
  assert.ok(l2['listHTML>progSlot'] === '읽기가 progSlot' || l2['listHTML>readList'] === '읽기가 progSlot' || Object.values(l2).includes('읽기가 progSlot'), 'L2 원인: 읽기가 progSlot ' + JSON.stringify(l2));
  assert.ok(Object.values(l2).includes('없으면 만들어 씀') && Object.values(l2).includes('처리 호출'), 'L2 원인: 없으면 만들어 씀(cfg)·처리 호출(mark) ' + JSON.stringify(l2));
  assert.ok(R('L3').items.some(x => x.what.startsWith('act →')), 'L3: Model이 화면 함수를 부름 ' + JSON.stringify(R('L3').items));
  rmSync(r20, { recursive: true, force: true }); }
// 식을 함수로 떼기(tools/extract.mjs): 지역 이름만 인자로, await·바깥 이름 쓰기가 든 식은 거부, 원래 함수 앞에 새 함수
{ const { findTarget, extractPlan, applyExtract } = await import('./extract.mjs'), r17 = mkdtempSync(join(tmpdir(), 'ggm-tools-')); mkdirSync(join(r17, 'src/main'), { recursive: true });
  const src = "const TOP=1;\nfunction openX(id){ const c=find(id), n=2;\n  openModal(`<p>${c.name}${n}${TOP}</p>`);\n  openModal(`<b>${await0()}</b>`); }\nasync function bad(){ let k=0;\n  openModal(`${await one()}${k++}`); }\n";
  writeFileSync(join(r17, 'src/main/010-x.js'), src); const u = await loadUnits(r17), T = findTarget(u, 'src/main/010-x.js:3', 'openModal', 0), P = extractPlan(T.node), B = findTarget(u, 'src/main/010-x.js:6', 'openModal', 0);
  const R = applyExtract(src, { exprText: T.node.text, topText: T.top.text, name: 'xHTML', params: P.params, doc: 'x 창(View)', sameFile: true });
  assert.ok(P.ok && P.params.join() === 'c,n' && !extractPlan(B.node).ok && R.src.includes('openModal(xHTML(c,n));') && R.src.indexOf('function xHTML(c,n){ return `<p>${c.name}${n}${TOP}</p>`; }') < R.src.indexOf('function openX'), '식 떼기: ' + JSON.stringify(P) + R.src);
  rmSync(r17, { recursive: true, force: true }); }
// 불러올 때 아직 없는 이름(TDZ): 함수 밖에서 뒤에 선언될 const를 읽으면 잡고, 함수 안(나중에 돎)·앞에 선언된 이름은 안 잡음
{ const { leadComments } = await import('./lib/extra.mjs'), at = s => s.indexOf('function f'); /* 옮기기 도구: 선언 위 설명 주석까지(머리말·옮김 표식·같은 줄 코드 뒤 주석은 남김) */
  const s1 = '/* ===== 머리말 ===== */\n/* 설명 하나 */\n// 설명 둘\nfunction f(){}', s2 = '/* ===== 머리말 ===== */\nfunction f(){}', s3 = 'x();\n/* 여러\n   줄 */\nfunction f(){}', s4 = 'g(); /* 끝 */\nfunction f(){}', s5 = '/* a.js에서 옮김 */\nfunction f(){}';
  assert.ok(s1.slice(leadComments(s1, at(s1))).startsWith('/* 설명 하나') && leadComments(s2, at(s2)) === at(s2) && s3.slice(leadComments(s3, at(s3))).startsWith('/* 여러') && leadComments(s4, at(s4)) === at(s4) && leadComments(s5, at(s5)) === at(s5), '옮기기: 설명 주석 같이'); }
{ const { tdzRefs } = await import('./lib/extra.mjs'), r10 = mkdtempSync(join(tmpdir(), 'ggm-tools-')); mkdirSync(join(r10, 'src/main'), { recursive: true });
  writeFileSync(join(r10, 'src/main/010-a.js'), "const A = { tags: B, ok: OK };\nconst OK = 1;\nfunction later(){ return B; }\nconst C = () => B;\n"); writeFileSync(join(r10, 'src/main/020-b.js'), "const B = 'x';\nconst D = A.ok + OK;\n");
  const T = tdzRefs(await loadUnits(r10)).map(x => x.name).sort(); assert.deepEqual(T, ['B', 'OK'], 'TDZ: ' + JSON.stringify(T)); rmSync(r10, { recursive: true, force: true }); }
// 프롬프트 조립 함수(조각을 고르고 잇는 함수)가 스튜디오 밖이면 잡음 · 조각을 데이터와 바로 보내는 요청 지점은 안 잡음 · 불러올 때 조각 읽기 잡음
{ const { promptBuilders, fragmentFiles: FF2 } = await import('./lib/prompts.mjs'), r11 = mkdtempSync(join(tmpdir(), 'ggm-tools-')); mkdirSync(join(r11, 'src/main/0015-s'), { recursive: true });
  writeFileSync(join(r11, 'src/main/0015-s/010-a.js'), "pfDef('A','a',()=>'가');\npfDef('B','b',()=>'나');\nfunction inStudio(){ return pf('A'); }\n");
  writeFileSync(join(r11, 'src/main/020-f.js'), "function rule(k){ return k?pf('A'):pf('B'); }\nasync function go(k){ await aiJSON(`${rule(k)}${inStudio()}`); await aiJSON(pf('B',{x:1})); }\nconst EARLY=pf('A');\n");
  const U11 = await loadUnits(r11), PB = promptBuilders(U11, { home: FF2(U11).home }); assert.ok(PB.builders.map(x => x.fn).join() === 'rule' && PB.loadTime.length === 1 && /EARLY|pf\('A'\)/.test(PB.loadTime[0].text), '조립 함수: ' + JSON.stringify(PB)); rmSync(r11, { recursive: true, force: true }); }
// 프롬프트 글 검사(조합 도구): 깨짐 · 과잉 · 과소
{ const C = await import('./lib/combos.mjs'), codes = (t, o) => C.checkPrompt(t, o).map(f => f.kind + ':' + f.code).sort();
  assert.deepEqual(codes('세계관: {name}\n이름 undefined\n배경 목록:\n\nJSON만 출력: {"a":1}', { sink: 'aiJSON' }), ['깨짐:값 없음', '깨짐:빈 머리말', '깨짐:안 채운 자리'], '깨짐');
  assert.deepEqual(codes('이 줄은 서른 글자가 넘는 같은 지시문입니다 반복됩니다.\n이 줄은 서른 글자가 넘는 같은 지시문입니다 반복됩니다.\n쓴다', { sink: 'aiJSON' }), ['과소:형식 지시 없음', '과잉:같은 줄 되풀이'], '과잉·과소');
  assert.deepEqual(codes('JSON만 출력: {"a":1}\nJSON만 출력: {"a":1,"b":2}\n\n다른 설명 없이 JSON만 출력한다.', { sink: 'aiJSON', used: ['a'], got: ['a', 'b'], strip: ['\n\n다른 설명 없이 JSON만 출력한다.'] }), ['과잉:읽지 않는 키 요구', '깨짐:표식 여러 개'], '표식(쌍점)만 셈 · 받고 버린 키 · 연결 층 덧붙임은 뺌');
  const sc = C.schemaOf('규칙\nJSON만 출력: {"hp":800~3000(방어형),"r":1~3 정수,"x":[{"n":""}],"y":[...]} 끝\n\nJSON만 출력한다.');
  assert.ok(sc.keys.join() === 'hp,r,x,y' && sc.tail.startsWith('끝') && JSON.stringify(C.lenientJSON(sc.body)) === '{"hp":800,"r":1,"x":[{"n":""}],"y":[]}', '형식 견본 읽기: ' + JSON.stringify(sc));
  { const f = C.fakeAnswer(C.lenientJSON('{"positions":[{"name":"이름","base":"atk|def|sup"}],"pf":{"생일":""},"t":["",""]}')), g = new Function('return ' + C.fakeAnswer.toString())(); /* 브라우저로 넘겨도 같게 */
    assert.ok(f.positions.map(p => p.base).join() === 'atk,def,sup' && new Set(f.positions.map(p => p.name)).size === 3 && f.pf['생일'] && f.t.length === 2 && f.t[0] !== f.t[1] && JSON.stringify(g({ a: [{ b: 'x|y' }] })) === '{"a":[{"b":"x"},{"b":"y"}]}' && g({ r: 'focus' }).r === 'focus', '가짜 AI 답: 고르기 견본은 하나씩, 객체 하나짜리 목록은 가짓수만큼, 빈 글은 채우고 서로 다르게'); }
  const cm = C.composition('앞 공통 규칙은 이렇게 길게 적는다 정말로. 이름 세라 끝', { A: '공통 규칙은 이렇게 길게 적는다 정말로. 이름 {n} 끝', B: '없는 조각의 기본 글은 여기에 있다 길게' }); assert.deepEqual(cm.used, ['A'], '조각 구성(자리로 나눈 덩어리)'); }
// 지시문 옮기기(prompts-move): 템플릿은 원문 그대로 조각으로 — ${식}은 이름 붙은 자리(T('x')→x, a.b→b, 겹치면 번호), "JSON만 출력" 표식·스키마는 호출 지점에 남김, 문자열은 통째로
{ const a = moveLiteral("`세계관: ${w.name}\\n이 장면을 써라. ${T('crew')}와 ${c.name}가 나온다.\\nJSON만 출력: {\"a\":1}`", 'X'), b = moveLiteral("'채워라. 이미 있는 값은 살린다'", 'Y'), u = new Map();
  assert.ok(a.frag === '세계관: {name}\\n이 장면을 써라. {crew}와 {name2}가 나온다.' && a.call === "pf('X',{name:w.name,crew:T('crew'),name2:c.name})" && a.keep === '\\nJSON만 출력: {"a":1}', '템플릿 옮기기: ' + JSON.stringify(a));
  assert.ok(b.frag === '채워라. 이미 있는 값은 살린다' && b.call === "pf('Y')" && b.keep === null, '문자열 옮기기: ' + JSON.stringify(b));
  assert.ok(slotName("T('player')", u) === 'player' && slotName("String(c.profile||'').slice(0,500)", u) === 'profile' && slotName("m.elems.map(e=>e.n).join(', ')", u) === 'elems' && slotName("Object.keys(ROLE).join(', ')", u) === 'role' && slotName('a?b:c', u) === 'v', '자리 이름(뜻 있는 속성 이름)'); }
// 모듈 경계: 다른 모듈 일을 하는 함수(참조가 다른 한 모듈에 몰림), 남의 상태 쓰기(주인 = 가장 많이 쓰는 모듈), 3개 이상 모듈이 쓰는 상태(파편화)
{ const r8 = mkdtempSync(join(tmpdir(), 'ggm-tools-')); mkdirSync(join(r8, 'src/main'), { recursive: true });
  writeFileSync(join(r8, 'src/main/010-a.js'), "/* ===== 가 ===== */\nfunction aOwn(){ G.meta.box = 1; G.meta.box = 2; G.meta.box = 3; }\nfunction misplaced(){ b1(); b2(); b3(); b1(); b2(); b3(); }\n");
  writeFileSync(join(r8, 'src/main/020-b.js'), "/* ===== 나 ===== */\nfunction b1(){ G.meta.box = 4; } function b2(){ return 1; } function b3(){ return 2; }\n");
  writeFileSync(join(r8, 'src/main/030-c.js'), "/* ===== 다 ===== */\nfunction cUse(){ G.meta.box = 5; }\n");
  const U = await loadUnits(r8), g8 = buildGraph(U).fns, MM = moduleMap(U, g8, stateFlow(U, g8));
  assert.ok(MM.envy.some(e => e.fn === 'misplaced' && e.to === 'src/main/020-b.js') && !MM.envy.some(e => e.fn === 'aOwn'), '다른 모듈 일을 하는 함수: ' + JSON.stringify(MM.envy));
  assert.ok(MM.scattered.some(x => x.key === 'G.meta.box' && x.owner === 'src/main/010-a.js' && x.files.length === 3) && MM.foreign.filter(x => x.key === 'G.meta.box').length === 2, '파편화·남의 상태 쓰기: ' + JSON.stringify(MM.scattered));
  assert.ok(MM.mods.find(m => m.file === 'src/main/010-a.js').title === '가', '모듈 제목'); rmSync(r8, { recursive: true, force: true }); }
// 점검 규칙 읽기(구버전 감지·보완 커버리지): 규칙 test·fix가 읽는 엔티티 필드 — 게임 단위 규칙의 목록 콜백 안 필드(factions().every(f=>f.stance))도
{ const r12 = mkdtempSync(join(tmpdir(), 'ggm-tools-')); mkdirSync(join(r12, 'src/main'), { recursive: true }); const { auditRules } = await import('./lib/upgrade.mjs');
  writeFileSync(join(r12, 'src/main/010-a.js'), "function factions(){ return G.world.factions; }\nfunction stanceAI(){ return 1; }\nconst AUDIT_RULES=[\n {id:'w_stance',scope:'game',since:10,test:()=>factions().every(f=>!(f.stance||[]).length),fix:{mode:'ai-run',run:()=>stanceAI()}},\n {id:'c_pf',scope:'char',since:9,test:c=>!c.alt&&!Object.keys(c.pfields||{}).length,fix:{mode:'ai-persona'}}];\n");
  const U = await loadUnits(r12), g = buildGraph(U).fns, R = auditRules(U, g, stateFlow(U, g)), by = id => R.find(x => x.id === id) || {};
  assert.ok(by('w_stance').fields.includes('stance') && by('w_stance').since === 10 && by('c_pf').fields.includes('pfields') && by('c_pf').scope === 'char', '점검 규칙 읽기: ' + JSON.stringify(R)); rmSync(r12, { recursive: true, force: true }); }
// 빌드 구문 검사: 스크립트 블록을 실제 JS로 컴파일 — async 아닌 함수 속 await(tree-sitter는 이름으로 읽어 놓침)를 잡고, json 같은 데이터 블록은 건너뜀
{ const { syntaxErrors } = await import('../build/build.mjs'), bad = syntaxErrors('<script type="text/ggm-main" id="ggm-main">\nfunction a(){ const r = await b(); }\n</script><script type="application/json">{x</script><script>let ok = 1;</script>');
  assert.ok(bad.length === 1 && bad[0].id === 'ggm-main' && bad[0].line === 2 && /await/.test(bad[0].msg), '빌드 구문 검사: ' + JSON.stringify(bad)); }
// 연관 맵: data 경로마다 만드는 함수와 역할(생성기·실행기·편집기) — 컬렉션에 넣는 생성 함수가 돌려주는 객체의 키, 컬렉션을 담은 변수를 도는 반복,
//   찾기 함수 결과, 매개변수의 구조 판정(캐릭터에만 있는 필드를 둘 넘게 씀), 진행 파일은 실행기·콘텐츠는 편집기, 맵 차이와 게임 값 찾기
{ const r13 = mkdtempSync(join(tmpdir(), 'ggm-tools-')); mkdirSync(join(r13, 'src/main'), { recursive: true }); const { buildMap, mapDiff, valuesAt } = await import('./lib/map.mjs');
  writeFileSync(join(r13, 'src/main/005-d.js'), "const DATA_TYPES=['meta','world','chars','prog'];\n");
  writeFileSync(join(r13, 'src/main/010-a.js'), "function charById(id){ return G.chars.find(c=>c.id===id); }\nfunction cleanChar(o){ const c={name:o.name,skills:[]}; return c; }\nfunction newGame(){ G.chars.push(cleanChar({name:'a'})); G.meta.construct={on:true}; }\nfunction liveTick(){ const L=G.chars.filter(c=>!c.alt); for(const c of L){ c.persona={}; } }\nfunction remaster(c){ c.generation=2; c.skills.push(1); if(c.rarity>2) c.persona=null; }\nfunction audit(rule,o){ remaster(o); }\nfunction handleEditAction(a,t,id){ const c=charById(id); c.rarity=3; audit(null,{}); }\nfunction handlePlayAction(a,t,id){ P().cres=1; buildIt(id); }\nfunction RES(){ const p=P(); if(!p.res) p.res={}; return p.res; }\nfunction buildIt(id){ const r=RES(); r.a-=1; const c=charById(id); c.won=1; }\n");
  const U = await loadUnits(r13), g = buildGraph(U).fns, M = buildMap(U, g, stateFlow(U, g)), W = (k, r) => (M.data[k]?.writers[r] || []);
  assert.ok(W('chars.json › [].skills', '생성기').includes('cleanChar') && W('chars.json › [].persona', '실행기').includes('liveTick') && W('meta.json › construct', '생성기').includes('newGame') && W('prog.json › cres', '실행기').includes('handlePlayAction') && W('chars.json › [].rarity', '편집기').includes('handleEditAction') && W('prog.json › res', '실행기').includes('buildIt') && W('chars.json › [].won', '실행기').includes('buildIt') && !W('chars.json › [].won', '편집기').length && W('chars.json › [].generation', '편집기').includes('remaster'), '연관 맵: ' + JSON.stringify(Object.fromEntries(Object.entries(M.data).map(([k, d]) => [k, d.writers]))));
  const M2 = { ...M, fns: { ...M.fns, probe: { name: 'probe', file: 'x' } }, data: { ...M.data, 'chars.json › [].x': { writers: { 편집기: ['probe'] } } } }, df = mapDiff(M, M2);
  assert.ok(df.fns.added.join() === 'probe' && df.data.some(d => d.path === 'chars.json › [].x' && d.added.join() === '편집기:probe') && valuesAt({ chars: [{ skills: [1] }, { skills: [] }], meta: { construct: { on: true } } }, 'chars.json', '[].skills').length === 1 && valuesAt({ meta: {} }, 'meta.json', 'construct').length === 0, '맵 차이·게임 값 찾기');
  rmSync(r13, { recursive: true, force: true }); }
// 공용 기반 모듈은 파일 단위로 셈: 두 파일을 폴더 모듈 하나로 묶어도 판정이 그대로(모듈 단위로 세면 "부르는 모듈 수"가 줄어 공용에서 빠졌음)
{ const r11 = mkdtempSync(join(tmpdir(), 'ggm-tools-')); mkdirSync(join(r11, 'src/main'), { recursive: true });
  writeFileSync(join(r11, 'src/main/005-u.js'), 'function u(){ return 1; }\n'); writeFileSync(join(r11, 'src/main/010-x.js'), 'function x(){ return u(); }\n'); writeFileSync(join(r11, 'src/main/020-y.js'), 'function y(){ return u(); }\n'); writeFileSync(join(r11, 'src/main/030-z.js'), 'function z(){ return 3; }\n');
  const U = await loadUnits(r11), g = buildGraph(U).fns, sf = stateFlow(U, g), M1 = moduleMap(U, g, sf), M2 = moduleMap(U, g, sf, { modOf: f => /0[12]0-/.test(f) ? 'src/main/xy/' : f });
  assert.ok(M1.infra.includes('src/main/005-u.js') && M2.infra.includes('src/main/005-u.js'), '공용 기반: 폴더로 묶어도 같음 ' + JSON.stringify([M1.infra, M2.infra])); rmSync(r11, { recursive: true, force: true }); }
// 개발 내역 검증: 진입점에서 닿는 함수(최상위 문장·값으로 넘김 포함), 보내는 쪽 없는 액션의 case는 따라가지 않음, 글 속 코드 이름 뽑기
{ const r9 = mkdtempSync(join(tmpdir(), 'ggm-tools-')); mkdirSync(join(r9, 'src/main'), { recursive: true });
  writeFileSync(join(r9, 'src/main/010-h.js'), "function used(){ return 1; } function viaTable(){ return 2; } function dead(){ return 3; } function onlyDeadAct(){ return 4; }\nfunction handleXAction(a){ switch(a){ case 'live': used(); break; case 'gone': onlyDeadAct(); break; } }\nconst TBL={k:viaTable};\ndocument.addEventListener('click',e=>handleXAction(e.target.dataset.act));\n");
  const U = await loadUnits(r9), g9 = buildGraph(U).fns, R = reachable(U, g9, '<button data-act=\"live\">', new Set(['gone']));
  assert.ok(R.has('used') && R.has('viaTable') && R.has('handleXAction') && !R.has('dead') && !R.has('onlyDeadAct'), '닿는 함수: ' + [...R]);
  assert.deepEqual(claimNames('`liveFill`·`G.meta.story` 정리, castLockCtx 추가, FINALE_RULE, 0465-story-plan').sort(), ['0465-story-plan', 'FINALE_RULE', 'G.meta.story', 'castLockCtx', 'liveFill'], '글 속 코드 이름');
  rmSync(r9, { recursive: true, force: true }); }
// 위반 래칫: 줄만 밀린 것은 같은 항목, 새 빈 catch·복잡도 증가는 잡음
{ const f0 = findings((await analyze(root)).J), src = join(root, 'src/main/010-a.js'), { readFileSync } = await import('node:fs'), t0 = readFileSync(src, 'utf8');
  writeFileSync(src, '\n\n\n' + t0); const d0 = compare(f0, findings((await analyze(root)).J)); assert.ok(!d0.added.length && !d0.worse.length && !d0.fixed.length, '래칫: 줄만 밀리면 그대로 ' + JSON.stringify(d0.added.concat(d0.worse, d0.fixed).map(f => f.key)));
  w('src/main/070-r.js', 'function quiet(x){ try{ x(); }catch(e){} return 1; }\n'); const d1 = compare(f0, findings((await analyze(root)).J));
  assert.ok(d1.added.some(f => f.cat === '빈 catch' && f.key.includes('070-r.js')), '래칫: 새 빈 catch는 새로 생김 ' + JSON.stringify(d1.added.map(f => f.key)));
  { /* 파일 이동: 위치만 나타내는 범주는 경로를 뺀 정체로 짝 — 합계가 늘지 않으면 옮김, 늘면 새로 생김. 모듈이 정체인 범주(과잉 분할)는 짝짓지 않음 */
    const e = (key, n) => ({ key, num: n == null ? {} : { 개수: n }, text: key }), m1 = compare([e('빈 catch|src/main/0250-a.js 파싱 대체', 2), e('빈 catch|src/main/0450-b.js 파싱 대체', 1)], [e('빈 catch|src/main/0260-x/020-b.js 파싱 대체', 3)]);
    const m2 = compare([e('빈 catch|src/main/a.js 파싱 대체', 2)], [e('빈 catch|src/main/b.js 파싱 대체', 3)]), m3 = compare([e('영역 침범 후보|src/main/a.js f')], [e('영역 침범 후보|src/main/0360-sync/ f')]), m4 = compare([e('과잉 분할|src/main/a.js ↔ src/main/b.js')], [e('과잉 분할|src/main/c.js ↔ src/main/d.js')]);
    assert.ok(!m1.added.length && !m1.fixed.length && m1.moved.length === 1 && m2.added.length === 1 && m2.fixed.length === 1 && !m3.added.length && m3.moved.length === 1 && m4.added.length === 1 && m4.fixed.length === 1, '래칫: 파일 이동은 옮김 ' + JSON.stringify([m1, m2, m4].map(d => [d.added.length, d.fixed.length, d.moved.length]))); }
  { const e = (m, n) => ({ key: `계층 섞임|src/main/${m}`, num: { 함수: n }, text: m }), mv = compare([e('a.js', 3)], [e('a.js', 1), e('b.js', 2)]), up = compare([e('a.js', 3)], [e('a.js', 1), e('b.js', 3)]);
    assert.ok(!mv.added.length && mv.moved.length === 1 && up.added.length === 1, '래칫: 섞인 함수를 다른 모듈로 옮기면(합계 그대로) 옮김, 합계가 늘면 새로 생김: ' + JSON.stringify([mv, up].map(d => [d.added.length, d.moved.length]))); }
  { const cf = (n, f, c) => ({ key: `복잡한 함수|${n}`, num: { 복잡도: c, 줄: 9, 중첩: 2 }, text: `${n} (${f}:3) 복잡도 ${c}` }), rn = compare([cf('openA', 'src/main/a.js', 40)], [cf('showA', 'src/main/a.js', 40)]), other = compare([cf('openA', 'src/main/a.js', 40)], [cf('showA', 'src/main/b.js', 40)]), less = compare([cf('openA', 'src/main/a.js', 40)], [cf('showA', 'src/main/a.js', 38)]), more = compare([cf('openA', 'src/main/a.js', 40)], [cf('showA', 'src/main/a.js', 41)]);
    assert.ok(!rn.added.length && rn.moved.length === 1 && other.added.length === 1 && !less.added.length && more.added.length === 1, '래칫: 같은 파일·같은 복잡도의 해결+새로 생김은 이름 바꿈(옮김), 다른 파일이면 새로 생김'); }
  const g = { num: { 복잡도: 40 }, key: 'x|f', cat: '복잡한 함수', text: 'f' }, d2 = compare([g], [{ ...g, num: { 복잡도: 44 } }]); assert.ok(d2.worse.length === 1 && d2.worse[0].up.includes('복잡도'), '래칫: 같은 함수의 복잡도 증가는 나빠짐');
  rmSync(join(root, 'src/main/070-r.js')); writeFileSync(src, t0); }
// 배선 점검: 생성기가 쓰는 키·스키마 world/키·지연 기본값(빈 값/쓸 만한 값)·엔티티 필드(컬렉션 콜백에 묶인 변수)를 생성물과 맞춤
{ const r3 = mkdtempSync(join(tmpdir(), 'ggm-tools-')); mkdirSync(join(r3, 'src/main'), { recursive: true });
  writeFileSync(join(r3, 'src/main/010-w.js'), `let G={meta:{},world:{}};
function buildNewGameDraft(){ const ng={meta:{},world:{}}; ng.meta.made=1; ng.world=Object.assign({},a.world); const p='JSON만 출력: {"world":{"lore":"","story":""}}'; return p; }
function featA(){ return [G.meta.made, G.meta.never, G.world.lore, G.world.plot2, (G.meta.list||[]).length, Object.assign({on:true},G.meta.cfg).on, (Array.isArray(G.meta.vlist)?G.meta.vlist:[{id:'v1'}]).length, G.chars.map(c=>c.zzNew), G.chars.map(c=>c.zzMade)]; }
`);
  const u3 = await loadUnits(r3), g3 = buildGraph(u3), W = wiringReport({ fns: g3.fns, sf: stateFlow(u3, g3.fns), features: [{ id: 'a', title: 'a', fns: new Set(['featA']) }], stages: stageClosures(u3, g3.fns), genRoots: ['buildNewGameDraft'], defaults: {}, upstreamProps: new Set(),
    games: [{ name: 'g', game: { meta: { made: 1 }, world: { lore: '설정' }, chars: [{ zzMade: 'x' }] } }] }), F = W.features[0], fl = Object.fromEntries(F.flags.map(x => [x.key, x.sev]));
  assert.ok(schemaKeys('{"world":{"lore":""}}').has('world/lore'), '스키마 키: 부모/키');
  assert.equal(fl['G.meta.made'], undefined, '생성기가 쓰고 생성물에 있음 → 문제 아님'); assert.equal(fl['G.world.lore'], undefined, 'world 스키마 키 → 생성기가 만듦');
  assert.equal(fl['G.meta.never'], 'P0', '아무도 안 만들고 기본값도 없음 → P0'); assert.equal(fl['G.meta.list'], 'P0', '빈 지연 기본값(||[]) → P0'); assert.equal(fl['G.meta.cfg'], 'P1', '쓸 만한 지연 기본값(Object.assign({on:true},…)) → P1'); assert.equal(fl['G.meta.vlist'], 'P1', '읽을 때 기본값(Array.isArray(x)?x:기본값) → 쓸 만한 기본값 P1');
  assert.equal(fl.zzNew, 'P1', '캐릭터 콜백에서 읽는 새 필드가 어디에도 없음 → P1'); assert.equal(fl.zzMade, undefined, '생성물에 있는 필드는 통과: ' + JSON.stringify(fl));
  rmSync(r3, { recursive: true, force: true }); }
// index.html 기능 표면(lib/surface.mjs): 탭·경로표·설정 하위 화면의 패널·창·동작 처리기에서 기능 단위를 뽑고, 함수 자리·모듈 판정(조각·슈퍼)
{ const r14 = mkdtempSync(join(tmpdir(), 'ggm-tools-')), w14 = (p, x) => { mkdirSync(join(r14, p, '..'), { recursive: true }); writeFileSync(join(r14, p), x); };
  const html = '<nav class="tabs"><button class="tab" data-tab="home"><b>로비</b></button><button class="tab" data-tab="shop"><b>상점</b></button><button class="tab" data-tab="studio"><b>설정</b></button></nav>';
  w14('src/index.html', html);
  w14('src/main/010-core.js', "let tab='home', STTAB='game';\nfunction render(){ const nav={gacha:'home',home:'home',shop:'shop',studio:'studio'}[tab]||tab; const F={home:homeHTML,shop:shopHTML,studio:studioHTML,gacha:gachaHTML}; return nav+(F[tab]||homeHTML)(); }\nfunction openModal(h){ return h; }\nconst head=t=>`<h2>${t}</h2>`;\nfunction pageHead(ko){ return ko; }\n");
  w14('src/main/020-home.js', "function homeHTML(){ return pageHead('로비')+'<button data-act=\"go\" data-to=\"gacha\">g</button>'; }\n");
  w14('src/main/030-shop.js', "function shopHTML(){ return pageHead('상점')+'<button data-act=\"buy\">b</button>'+shopBanner(); }\nfunction buyItem(){ const p=shopPrice()+shopTax(); openReceipt(p); return p+bothUse(); }\nfunction shopPrice(){ return 1; }\nfunction shopList(){ return [shopPrice()]; }\nfunction shopRow(){ return shopList().length; }\nfunction openReceipt(p){ openModal(head('영수증')+p+receiptLine()); }\nfunction receiptLine(){ return shopRow(); }\n");
  w14('src/main/040-gacha.js', "function gachaHTML(){ return pageHead('뽑기')+'<button data-act=\"pull\">p</button>'+gachaBanner(); }\nfunction pullOne(){ return rollRate()+gachaPity()+bothUse(); }\nfunction rollRate(){ return gachaRate2(); }\nfunction gachaOdds(){ return rollRate(); }\nfunction gachaLog(){ return gachaOdds(); }\n");
  w14('src/main/050-fragment.js', "function shopTax(){ return 0.1; }\n");
  w14('src/main/060-mixed.js', "function shopBanner(){ return shopSale()+shopSign(); }\nfunction shopSale(){ return 2; }\nfunction shopSign(){ return 3; }\nfunction gachaBanner(){ return gachaPity()+gachaSign(); }\nfunction gachaPity(){ return 4; }\nfunction gachaRate2(){ return 5; }\nfunction gachaSign(){ return 6; }\nfunction bothUse(){ return 7; }\n");
  w14('src/main/070-studio.js', "function studioHTML(){ const ST=[['game','게임','g'],['img','그림','i'],['data','데이터','d']]; const SEC={game:`<div class=\"panel\"><h3>규칙</h3><button data-act=\"rules\">r</button></div><div class=\"panel\"><h3>밸런스</h3><button data-act=\"bal\">b</button></div>`, img:`${imgPanel()}`, data:`<p>${dataInfo()}</p>`}; return ST.length+(SEC[STTAB]||''); }\nfunction imgPanel(){ return '<div class=\"panel\"><h3>그림 설정</h3></div>'; }\nfunction dataInfo(){ return 'd'; }\nfunction editRules(){ return 1; }\nfunction editBal(){ return 2; }\n");
  w14('src/main/080-actions.js', "function handleAction(a){ switch(a){ case 'buy': buyItem(); break; case 'pull': pullOne(); break; case 'rules': editRules(); break; case 'bal': editBal(); break; } }\ndocument.addEventListener('click',e=>handleAction(e.target.dataset.act));\n");
  const u14 = await loadUnits(r14), g14 = buildGraph(u14), S = surfaceOf(u14, g14.fns, html), F = S.feats;
  assert.deepEqual(S.tabs.map(t => t.label), ['로비', '상점', '설정'], '기능 표면: 아래 탭 이름');
  assert.ok(F.get('gacha')?.menu === 'home' && F.get('gacha').label === '뽑기' && F.get('shop').label === '상점', '경로표·경로 → 탭 표·pageHead 이름: ' + JSON.stringify([...F.values()].map(f => [f.key, f.menu, f.label])));
  assert.ok(['studio.game.1', 'studio.game.2'].every(k => F.get(k)?.kind === 'panel') && F.get('studio.game.1').label === '규칙' && F.get('studio.img.1')?.label === '그림 설정' && F.get('studio.data')?.kind === 'screen', '설정 하위 화면: 글 속 패널 덩어리·패널 함수·하위 화면 하나: ' + [...F.keys()].join(','));
  assert.equal(F.get('창:openReceipt')?.unit, 'shop', '한 화면만 여는 창은 그 화면 단위');
  const pl = k => placeOf(S, k); assert.ok(pl('buyItem').unit === 'shop' && pl('pullOne').unit === 'gacha' && pl('editRules').unit === 'studio.game.1' && pl('receiptLine').unit === 'shop', '함수 자리 = 가장 가까운 기능 단위(동작 처리기·창 안 포함): ' + ['buyItem', 'pullOne', 'editRules', 'receiptLine'].map(k => JSON.stringify(pl(k))).join(' '));
  assert.equal(pl('bothUse').kind, '여러 메뉴', '두 메뉴가 같은 거리로 쓰는 함수 = 공용');
  const SM = surfaceMap(u14, g14.fns, S); assert.ok(SM.feats.shop?.n >= 3 && SM.feats.shop.mods[0][0] === 'src/main/030-shop.js', '화면 단위 요약: 그 단위에서만 닿는 함수가 있는 모듈: ' + JSON.stringify(SM.feats.shop));
  rmSync(r14, { recursive: true, force: true }); }
// 아키텍처(lib/arch.mjs — CLAUDE.md §0-2): 함수마다 계층(View·Controller·Model·섞임)·방향 위반, Model·Controller를 같은 데이터·호출로 묶은 기능, 모듈 판정(슈퍼·조각·고유), 저장 정책(갈래 없는 키·세션·낡은 표)
{ const r15 = mkdtempSync(join(tmpdir(), 'ggm-tools-')), w15 = (p, x) => { mkdirSync(join(r15, p, '..'), { recursive: true }); writeFileSync(join(r15, p), x); };
  w15('src/index.html', '<div id="app"></div>');
  w15('src/main/010-core.js', "let G={shop:{},rates:{},misc:{}};\nfunction render(){ document.body.innerHTML=''; }\nfunction openModal(h){ document.body.insertAdjacentHTML('beforeend',h); }\n");
  w15('src/main/020-shop.js', "function shopHTML(){ return '<div>'+shopPrice()+'</div>'; }\nfunction buyItem(){ G.shop.sold=1; shopStock(); render(); }\nfunction shopPrice(){ return G.shop.price||1; }\nfunction shopStock(){ G.shop.stock=shopPrice()-1; }\nfunction shopLog(){ G.shop.log=[shopPrice()]; }\n");
  w15('src/main/030-gacha.js', "function gachaHTML(){ return '<p>'+rollRate()+'</p>'; }\nfunction pullOne(){ G.rates.n=1; pityAdd(); render(); }\nfunction rollRate(){ return G.rates.ssr||3; }\nfunction pityAdd(){ G.rates.pity=rollRate()+1; }\nfunction gachaLog(){ G.rates.log=[rollRate()]; }\n");
  w15('src/main/040-mixed.js', "function shopTax(){ G.shop.tax=shopPrice(); return 1; }\nfunction shopFee(){ G.shop.fee=shopTax(); }\nfunction shopCut(){ G.shop.cut=shopTax()+shopPrice(); }\nfunction gachaBonus(){ G.rates.bonus=rollRate(); return 1; }\nfunction gachaBoost(){ G.rates.boost=gachaBonus(); }\nfunction gachaLuck(){ G.rates.luck=gachaBonus()+rollRate(); }\n");
  w15('src/main/050-frag.js', "function shopDiscount(){ G.shop.disc=shopPrice()*0.9; }\n");
  w15('src/main/060-bad.js', "function mixedFn(){ G.misc.bad=1; return '<b>'+shopPrice()+'</b>'; }\nfunction viewWrite(){ pityAdd(); return '<i>x</i>'; }\nfunction modelCallsView(){ G.misc.cv=1; return shopHTML(); }\nfunction chipsShow(){ return [1,2].map(()=>shopHTML()).join(''); }\nfunction notView(){ pityAdd(); G.misc.nv=1; return shopHTML(); }\nfunction settleShow(){ pityAdd(); return shopHTML(); }\nfunction lvCheck(){ const o=lvOf(); o.checked=1; o.hidden=true; G.misc.lv=1; }\nfunction lvOf(){ return {}; }\nfunction downloadBlob(b,n){ const a=document.createElement('a'); document.body.appendChild(a); a.click(); }\nasync function handleBadAction(a){ switch(a){ case 'x': G.misc.h=1; break; case 'y': document.body.innerHTML='<p>y</p>'; break; } }\n");
  w15('src/main/070-store.js', "const STORE_POLICY={sync:['k-sync'],secret:{'k-sec':['key']},keep:{},device:['k-dev'],cache:[],legacy:[]};\nfunction st(){ appStorage.setItem('k-sync','1'); appStorage.setItem('k-dev','1'); appStorage.setItem('k-what','1'); sessionStorage.setItem('k-ses','1'); }\n");
  const u15 = await loadUnits(r15), g15 = buildGraph(u15), sf15 = stateFlow(u15, g15.fns), writers = new Set(mutations(u15, g15.fns).mut.keys()), keyUse = new Map();
  for (const k of sf15.list) { for (const f of k.w) { if (!keyUse.has(f)) keyUse.set(f, new Map()); keyUse.get(f).set(k.key, 'w'); } for (const f of k.r) { if (!keyUse.has(f)) keyUse.set(f, new Map()); if (!keyUse.get(f).has(k.key)) keyUse.get(f).set(k.key, 'r'); } }
  const A = archMap(u15, g15.fns, { writers, keyUse, sf: surfaceOf(u15, g15.fns, ''), louvain, layer: null, modOf: moduleOf }), ly = n => A.fnLayer[n]?.layer, vd = m => A.verdicts.find(v => v.mod === 'src/main/' + m);
  assert.deepEqual(['shopHTML', 'buyItem', 'shopStock', 'shopPrice', 'mixedFn'].map(ly), ['View', 'Controller', 'Model', 'Model', '섞임'], '계층: 마크업 = View · 상태를 바꾸고 다시 그림 = Controller · 상태 씀·계산 = Model · 마크업 + 상태 씀 = 섞임');
  assert.deepEqual(['chipsShow', 'settleShow', 'notView'].map(ly), ['View', 'Controller', 'Model'], '직접 신호 없이 View 함수만 엮으면 View · 상태를 바꾸는 함수와 View 함수를 함께 부르면 Controller · 스스로 상태를 쓰며 화면 함수를 부르면 Model(방향 위반)');
  assert.deepEqual(['lvCheck', 'downloadBlob'].map(ly), ['Model', 'Model'], '데이터 칸 이름(checked·hidden)이 DOM이 아닌 값이면 화면 바꿈 아님 · 파일 내려받기 같은 입출력 함수는 Model(어댑터)');
  const mx = A.fnLayer.mixedFn.mix, hx = A.fnLayer.handleBadAction; assert.equal(mx?.kind, '정산+결과', '섞인 꼴: 결과 HTML을 돌려주며 상태를 씀 = 정산+결과'); assert.ok(mx && mx.view.length && mx.model.length && hx.layer === '섞임' && hx.mix.cases.map(c => c.act).join() === 'y', '섞인 함수 나눌 자리: View 줄·Model 줄, 처리기는 화면을 만지는 case만: ' + JSON.stringify([mx, hx.mix]));
  const bad = A.bad.map(b => `${b.fn}→${b.to}`); assert.ok(bad.includes('viewWrite→pityAdd') && bad.includes('modelCallsView→shopHTML'), '방향 위반: View가 상태를 바꾸는 함수를 부름 · Model이 화면 함수를 부름: ' + bad);
  assert.ok(A.fnLayer.buyItem.feat && A.fnLayer.buyItem.feat === A.fnLayer.shopLog.feat && A.fnLayer.pullOne.feat === A.fnLayer.gachaLog.feat && A.fnLayer.buyItem.feat !== A.fnLayer.pullOne.feat, '기능 = 같은 데이터·호출로 묶은 Model·Controller(상점·뽑기 둘): ' + JSON.stringify(A.fnLayer));
  assert.ok(vd('040-mixed.js').kind === '슈퍼' && vd('040-mixed.js').split.length === 2, '관계없는 두 기능을 담은 모듈 = 슈퍼(발산적 변경): ' + JSON.stringify(vd('040-mixed.js')));
  assert.ok(vd('050-frag.js').kind === '조각' && vd('050-frag.js').to === 'src/main/020-shop.js', '조각 → 그 기능 함수가 많은 모듈로(게으른 모듈): ' + JSON.stringify(vd('050-frag.js')));
  assert.equal(vd('020-shop.js').kind, '고유', '한 기능 중심 모듈 = 고유'); assert.ok(vd('060-bad.js').mixed.includes('mixedFn') && vd('060-bad.js').bad >= 2, '모듈마다 섞인 함수·방향 위반 수');
  const K = Object.fromEntries(A.store.keys.map(k => [k.key, k.kind])); assert.deepEqual([K['k-sync'], K['k-dev'], K['k-what'], K['k-ses']], ['sync', 'device', null, 'session'], '저장 정책: 표의 갈래 · 갈래 없는 키(null) · sessionStorage = 세션'); assert.deepEqual(A.store.stale, ['k-sec'], '표에만 있고 코드가 안 쓰는 키');
  rmSync(r15, { recursive: true, force: true }); }
rmSync(root, { recursive: true, force: true });
console.log('ok tools: 아키텍처(계층 View·Controller·Model·섞임·방향 위반 · 같은 데이터로 묶은 기능 · 슈퍼·조각·고유 · 저장 정책 갈래) · index.html 기능 표면(탭·경로표·하위 화면 패널·창·동작 → 화면 단위·함수 자리) · 연관 맵(data 경로·역할·생성 함수·목록 변수·구조 판정·차이·게임 값) · 스튜디오 밖 조립 함수·불러올 때 조각 읽기 · 불러올 때 아직 없는 이름(TDZ) · 자연 경계(모듈성 묶기)·이름 범위(지역 이름·쓰기·await) · 프롬프트 흐름 보강(지역 변수·연결 층·넘겨받은 글 AI·돌려주는 식·출력 자리) · 프롬프트 글 검사(깨짐·과잉·과소·견본 읽기·조각 구성) · 개발 내역 검증(닿는 함수·보내는 쪽 없는 액션·글 속 코드 이름) · 모듈 경계(영역 침범·남의 상태 쓰기·파편화) · 지시문 옮기기(원문 그대로·자리 이름·표식 남김) · 프롬프트 조각 한곳(흩어짐 오류) · 프롬프트 스튜디오 밖 프롬프트 글(글 AI 호출 흐름·해라체) · 순수 모듈 경계 · 분석 코드 = 빌드된 SPA · 주석 속 코드 · 함수를 담은 표(멤버 호출 연결) · 이름 규칙(종류 자동 판별·안전한 치환) · SPA 단일 파일 전제 · 배선 점검(생성기 키·스키마·지연 기본값·엔티티 필드 ↔ 생성물) · 위반 래칫(줄 이동 무시·새 빈 catch·복잡도 증가) · DOM id 참조·HTML 주입(T() 안전성)·저장 키·전역 리스너 누수·CSS 괄호/파싱·안 쓰는 클래스·부속 파일(서비스 워커·파이썬) 파싱·중계 허용 주소·분배 표↔case·도우미 인자 발신·분배기 case 복잡도·별칭·빈 catch 분류·이름 충돌·파싱 오류·안 쓰는 함수·순환·비동기 콜스택·액션 누락/죽은 처리기/중복 처리·저장 누락·쓰기 전용 키·화면 흐름·다중화·파편화·ast-grep 규칙');
