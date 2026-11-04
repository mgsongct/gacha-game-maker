/* ===== 0274-expedition — Model(상태·규칙·저장·외부 서비스) ===== */
/* src/main/0274-expedition/0274-dispatch.js에서 옮김 */
function dispOffer(taken){ const pool=(G.dispatches&&G.dispatches.length?G.dispatches:[{name:'주변 정찰',desc:'근처 구역을 둘러보고 쓸 만한 물자를 모아 와요.'},{name:'물자 호송',desc:'보급품을 안전하게 옮겨요.'}]);
  const free=pool.filter(t=>!(taken||[]).includes(t.name)), tpl=rand(free.length?free:pool), hours=rand([1,2,4,8,12]), need=hours<=2?rand([1,2]):hours<=4?rand([2,3]):rand([3,4]);
  let focus=rand(['gold','gold','exp','exp','wmat','core']); if(focus==='core'&&hours<4) focus='exp';
  const pts=Math.pow(hours,0.85)*(1+0.35*(need-1)), r={}; r[focus]=Math.max(1,Math.round(DISP_FOCUS[focus][1]*pts*(focus==='gold'?1:1)));
  if(focus!=='gold') r.gold=Math.round(600*pts/100)*100; if(focus==='gold') r.gold=Math.round(r.gold/100)*100;
  if(conOn()) Object.assign(r,conDispReward(hours,need)); // 건조/영입이 켜져 있으면 원정으로 건조 자원도 모아 와요
  return {id:'o'+uid(),name:String(tpl.name||'파견'),desc:String(tpl.desc||''),hours,need,reward:r}; }
/* 파견 게시판 맞춤(날이 바뀌면 의뢰 새로·예전 방식 파견 잇기·5개까지 채우기) — 진행 칸 dboard의 정의(0070 PROG_SLOTS)가 부름 */
function dispBoardFill(b,p){
  // 예전 방식으로 보낸 파견은 그대로 이어서 보여 줘요
  Object.keys(p.disp||{}).forEach(id=>{ if(!b.list.some(o=>o.id===id)){ const t=(G.dispatches||[]).find(x=>x.id===id)||{}, a=p.disp[id]; b.list.push({id,name:String(t.name||'파견'),desc:String(t.desc||''),hours:a.hours||t.hours||2,need:(a.chars||[]).length||t.need||2,reward:t.reward||{gold:2000}}); } });
  if(b.day!==today()){ b.day=today(); b.rr=0; b.list=b.list.filter(o=>p.disp[o.id]); }
  while(b.list.length<5) b.list.push(dispOffer(b.list.map(o=>o.name)));
  return b; }
function dispList(){ return progRead('dboard').list; } /* 읽기 — 게시판은 그리기 전 처리(progTick)가 날마다 채움 */
/* 전투형 파견을 모두 보상 없이 끝내고 의뢰판을 비움 — 파견 칸(disp·dboard)은 이 모듈이 맡음. 원정 방식을 바꿀 때(0275)가 부름 */
function dispEndAll(){ const p=P(); p.disp={}; if(p.dboard) p.dboard.list=[]; }
function dispClaim(d){ const id=d.id; const dr=Object.assign({},d.reward,{gift:d.hours>=4?2:1}); if(dr.gems){ dr.gold=(dr.gold||0)+dr.gems*100; delete dr.gems; } if(seasonIs('train')) Object.keys(dr).forEach(k=>{ if(typeof dr[k]==='number'&&k!=='gift') dr[k]=Math.round(dr[k]*1.5); }); Object.assign(dr,rateR(dr)); giveReward(dr); (P().disp[id].chars||[]).forEach(cid=>{const c=charById(cid);if(c)addAff(c,10);}); delete P().disp[id]; const b=progSlot('dboard'), i=b.list.findIndex(o=>o.id===id); if(i>=0) b.list.splice(i,1,dispOffer(b.list.map(o=>o.name))); return dr; }
/* src/main/0274-expedition/0275-expedition.js에서 옮김 */
function exMeta(){ return gameRead('meta.expedition'); } // 읽기 — 바꿀 때는 gameSlot('meta.expedition')
function EXC(){ return GGMExpedition.config(exMeta()); }
function exMode(){ return (G.meta.expedition&&G.meta.expedition.mode)||'combat'; }
/* 원정 칸 형식 맞춤(빠진 하위 칸: 인지도·컨디션·일정·제안·연속·기록·경영, 기록 시작 시각) + 방송 출연 모드면 오늘의 출연 제안(보유 캐릭터마다 하루 한 번, 무작위라 만들어 저장) — 진행 칸 exped의 정의(0070 PROG_SLOTS)가 그리기 전에 부름 */
function expedFill(s){ for(const [k,v] of [['fame',{}],['cond',{}],['jobs',{}],['offers',{}],['streak',{}],['lib',[]]]) if(!s[k]||typeof s[k]!=='object') s[k]=v; if(!s.biz||typeof s.biz!=='object') s.biz={assign:{},at:0,rep:0}; if(!s.libAt) s.libAt=Date.now();
  if(exMode()==='idol'){ const day=today(); for(const c of G.chars) if(own(c.id)){ const o=s.offers[c.id]; if(!o||o.day!==day) s.offers[c.id]={day,...GGMExpedition.idolOffers(s.fame[c.id]||0,EXC())}; } } return s; }
/* 원정 칸을 늘 둘 때: 전투형이 아닌 원정 모드(방송 출연·스트리머·경영) */
function expedOn(){ return exMode()!=='combat'; }
function exBizOf(id){ const a=progRead('exped').biz.assign; return Object.keys(a).find(k=>(a[k]||[]).includes(id))||null; }
function exCond(id){ const s=progRead('exped'), now=Date.now(), st=s.cond[id]; if(exMode()==='business'&&exBizOf(id)&&st){ const h=Math.max(0,(now-st.at)/3600e3); return Math.max(0,Math.round(st.v-h*EXC().cond.drain)); } return Math.round(GGMExpedition.condNow(st,now,EXC())); }
function exSetCond(id,v,at,rest){ progSlot('exped').cond[id]=Object.assign({v:Math.max(0,Math.min(100,v)),at:at||Date.now()},rest?{rest}:{}); }
function exJobOf(id){ const J=progRead('exped').jobs; return Object.keys(J).find(k=>J[k].chars.includes(id))||null; }
function exResting(id){ const st=progRead('exped').cond[id]; return !!(st&&st.rest&&st.rest>Date.now()); }
// 전투에 못 나가는 캐릭터(일하는 중·쉬는 중·경영 배치). busyIds(0090)가 함께 써요
function exBusyIds(){ if(exMode()==='combat'||!P().exped) return []; const s=progRead('exped'); return [...Object.values(s.jobs).flatMap(j=>j.chars),...Object.values(s.biz.assign).flat(),...Object.keys(s.cond).filter(exResting)]; }
function exGive(gold,label){ if(seasonIs('train')) gold*=1.5; /* 훈련 시즌 보너스 — 전투형 파견(dispClaim)과 같게 */ const r={gold:Math.max(0,Math.round(gold))}; if(conOn()){ const ks=[...CON_RES].sort(()=>Math.random()-.5).slice(0,2); ks.forEach(k=>{ r[k]=Math.max(10,Math.round(gold/20/10)*10); }); } giveReward(r); return r; }
function exFameName(){ const m=exMode(); return m==='streamer'?EXC().streamer.fameName:EXC().idol.fameName; }
/* 방송 출연(idol): 하루 단위로 캐릭터마다 일정이 들어와요. 등급이 낮으면 배정된 1건뿐이고, 높으면 골라서·거절도 자유 */
function exOffers(id){ const s=progSlot('exped'), day=today(); let o=s.offers[id]; if(!o||o.day!==day){ o=s.offers[id]={day,...GGMExpedition.idolOffers(s.fame[id]||0,EXC())}; } return o; }
/* 경영: 배치 바꾸기·정산. 배치를 바꾸기 전에 지금까지의 영업을 먼저 정산해요 */
function exBizState(){ const s=progRead('exped'), chars={}, conds={}; Object.values(s.biz.assign).flat().forEach(id=>{ const c=charById(id); if(c){ chars[id]=c; conds[id]=exCond(id); } }); return GGMExpedition.bizPerformance(s.biz.assign,chars,conds,EXC()); }
function exStatus(id){ const j=exJobOf(id), s=progRead('exped'); if(j){ const J=s.jobs[j], end=J.start+J.hours*3600e3, left=Math.max(0,Math.ceil((end-Date.now())/60000)); return left?`${esc(J.job.name)} · ${Math.floor(left/60)}시간 ${left%60}분`:`${esc(J.job.name)} 완료`; } if(exResting(id)){ const m=Math.ceil((s.cond[id].rest-Date.now())/60000); return `휴식 중 · ${Math.floor(m/60)}시간 ${m%60}분`; } const b=exBizOf(id); if(b) return '배치: '+esc((EXC().business.parts.find(p=>p.id===b)||{}).name||b); return '대기'; }
