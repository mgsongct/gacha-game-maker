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
rmSync(root, { recursive: true, force: true });
console.log('ok tools: 분배 표↔case·도우미 인자 발신·분배기 case 복잡도·별칭·빈 catch 분류·이름 충돌·파싱 오류·안 쓰는 함수·순환·비동기 콜스택·액션 누락/죽은 처리기/중복 처리·저장 누락·쓰기 전용 키·화면 흐름·다중화·파편화·ast-grep 규칙');
