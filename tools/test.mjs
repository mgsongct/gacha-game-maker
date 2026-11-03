#!/usr/bin/env node
// 점검 도구 자체 검사: 일부러 문제를 심은 작은 src/로 각 분석이 잡아내는지 확인 (node tools/test.mjs)
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadUnits } from './lib/source.mjs';
import { buildGraph, unused, unusedVars, cycles, deepest } from './lib/graph.mjs';
import { actions, mutations, stateFlow } from './lib/flow.mjs';
import { parseErrors, dupBodies, repeatedStrings, sgRules } from './lib/quality.mjs';
import { domIds, htmlInject, saveKeys, listenerLeaks, cssCheck, sideFiles, relayHosts } from './lib/extra.mjs';
import { analyze } from './lib/analyze.mjs';
import { findings, compare } from './lib/ratchet.mjs';
import { wiringReport, schemaKeys } from './lib/wiring.mjs';

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
// 위반 래칫: 줄만 밀린 것은 같은 항목, 새 빈 catch·복잡도 증가는 잡음
{ const f0 = findings((await analyze(root)).J), src = join(root, 'src/main/010-a.js'), { readFileSync } = await import('node:fs'), t0 = readFileSync(src, 'utf8');
  writeFileSync(src, '\n\n\n' + t0); const d0 = compare(f0, findings((await analyze(root)).J)); assert.ok(!d0.added.length && !d0.worse.length && !d0.fixed.length, '래칫: 줄만 밀리면 그대로 ' + JSON.stringify(d0.added.concat(d0.worse, d0.fixed).map(f => f.key)));
  w('src/main/070-r.js', 'function quiet(x){ try{ x(); }catch(e){} return 1; }\n'); const d1 = compare(f0, findings((await analyze(root)).J));
  assert.ok(d1.added.some(f => f.cat === '빈 catch' && f.key.includes('070-r.js')), '래칫: 새 빈 catch는 새로 생김 ' + JSON.stringify(d1.added.map(f => f.key)));
  const g = { num: { 복잡도: 40 }, key: 'x|f', cat: '복잡한 함수', text: 'f' }, d2 = compare([g], [{ ...g, num: { 복잡도: 44 } }]); assert.ok(d2.worse.length === 1 && d2.worse[0].up.includes('복잡도'), '래칫: 같은 함수의 복잡도 증가는 나빠짐');
  rmSync(join(root, 'src/main/070-r.js')); writeFileSync(src, t0); }
// 배선 점검: 생성기가 쓰는 키·스키마 world/키·지연 기본값(빈 값/쓸 만한 값)·엔티티 필드(컬렉션 콜백에 묶인 변수)를 생성물과 맞춤
{ const r3 = mkdtempSync(join(tmpdir(), 'ggm-tools-')); mkdirSync(join(r3, 'src/main'), { recursive: true });
  writeFileSync(join(r3, 'src/main/010-w.js'), `let G={meta:{},world:{}};
function buildNewGameDraft(){ const ng={meta:{},world:{}}; ng.meta.made=1; ng.world=Object.assign({},a.world); const p='JSON만 출력: {"world":{"lore":"","story":""}}'; return p; }
function featA(){ return [G.meta.made, G.meta.never, G.world.lore, G.world.plot2, (G.meta.list||[]).length, Object.assign({on:true},G.meta.cfg).on, G.chars.map(c=>c.zzNew), G.chars.map(c=>c.zzMade)]; }
`);
  const u3 = await loadUnits(r3), g3 = buildGraph(u3), W = wiringReport({ fns: g3.fns, sf: stateFlow(u3, g3.fns), features: [{ id: 'a', title: 'a', fns: new Set(['featA']) }], roots: ['buildNewGameDraft'], defaults: {}, upstreamProps: new Set(),
    games: [{ name: 'g', game: { meta: { made: 1 }, world: { lore: '설정' }, chars: [{ zzMade: 'x' }] } }] }), F = W.features[0], fl = Object.fromEntries(F.flags.map(x => [x.key, x.sev]));
  assert.ok(schemaKeys('{"world":{"lore":""}}').has('world/lore'), '스키마 키: 부모/키');
  assert.equal(fl['G.meta.made'], undefined, '생성기가 쓰고 생성물에 있음 → 문제 아님'); assert.equal(fl['G.world.lore'], undefined, 'world 스키마 키 → 생성기가 만듦');
  assert.equal(fl['G.meta.never'], 'P0', '아무도 안 만들고 기본값도 없음 → P0'); assert.equal(fl['G.meta.list'], 'P0', '빈 지연 기본값(||[]) → P0'); assert.equal(fl['G.meta.cfg'], 'P1', '쓸 만한 지연 기본값(Object.assign({on:true},…)) → P1');
  assert.equal(fl.zzNew, 'P1', '캐릭터 콜백에서 읽는 새 필드가 어디에도 없음 → P1'); assert.equal(fl.zzMade, undefined, '생성물에 있는 필드는 통과: ' + JSON.stringify(fl));
  rmSync(r3, { recursive: true, force: true }); }
rmSync(root, { recursive: true, force: true });
console.log('ok tools: 배선 점검(생성기 키·스키마·지연 기본값·엔티티 필드 ↔ 생성물) · 위반 래칫(줄 이동 무시·새 빈 catch·복잡도 증가) · DOM id 참조·HTML 주입(T() 안전성)·저장 키·전역 리스너 누수·CSS 괄호/파싱·안 쓰는 클래스·부속 파일(서비스 워커·파이썬) 파싱·중계 허용 주소·분배 표↔case·도우미 인자 발신·분배기 case 복잡도·별칭·빈 catch 분류·이름 충돌·파싱 오류·안 쓰는 함수·순환·비동기 콜스택·액션 누락/죽은 처리기/중복 처리·저장 누락·쓰기 전용 키·화면 흐름·다중화·파편화·ast-grep 규칙');
