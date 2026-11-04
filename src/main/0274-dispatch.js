/* ===== 파견 게시판: 매일 바뀌는 파견 의뢰(전투형 원정) — 의뢰 만들기·보낼 대원 고르기·완료 보상·화면. 전투가 아닌 원정 방식(아이돌·방송·경영)은 0275 ===== */
/* src/main/0180-ui-scroll.js에서 옮김 */
function dispHTML(){
  const p=P(), now=Date.now();
  const nDone=dispList().filter(d=>{ const a=p.disp[d.id]; return a&&now>=a.start+a.hours*3600e3; }).length, nFree=dispList().filter(d=>!p.disp[d.id]).length;
  return `${pageHead(T('dispatch'),'LOGISTICS','lobby')}<p class="muted">${T('crew')}을(를) 보내 두면 시간이 지나 보상을 가져와요. 파견 중인 ${T('crew')}은(는) 전투에 나갈 수 없어요.</p>
  <div class="row" style="margin:6px 0 10px"><button class="btn sm" data-act="dispall" ${nDone?'':'disabled'}>완료된 파견 모두 받기${nDone?` (${nDone})`:''}</button><button class="btn sm ghost" data-act="dispredo" ${nFree?'':'disabled'}>빈 곳 모두 자동 파견</button><button class="btn sm ghost" data-act="dreroll" ${nFree?'':'disabled'}>의뢰 새로고침 ${progRead('dboard').rr?`(${rIco('gold')}2,000)`:'(오늘 1번 무료)'}</button></div>
  <p class="muted" style="margin:-4px 0 8px;font-size:.75rem">의뢰는 매일 바뀌고, 하나를 받으면 그 자리에 새 의뢰가 올라와요. 보상은 시간과 인원에 비례해요.</p>
  ${dispList().map(d=>{const a=p.disp[d.id], end=a?a.start+a.hours*3600e3:0, done=a&&now>=end;
    const left=a&&!done?Math.ceil((end-now)/60000):0;
    return `<div class="ep disp"><span class="t"><b>${esc(d.name)}</b><span class="muted">${esc(d.desc)} · ${d.hours}시간 · ${d.need}명</span><span class="muted">${rewardText(d.reward)}</span>${a?`<span class="dp-av">${a.chars.map(id=>{ const c=charById(id); return c?`<i title="${esc(c.name)}">${art(c)}</i>`:''; }).join('')}</span><span class="muted">${a.chars.map(id=>esc((charById(id)||{}).name||'')).join(', ')} · ${done?'완료':`${Math.floor(left/60)}시간 ${left%60}분 남음`}</span>`:''}</span>
      ${!a?`<button class="btn sm" data-act="dispset" data-id="${d.id}">보내기</button>`:done?`<button class="btn sm" data-act="dispget" data-id="${d.id}">받기</button>`:`<button class="btn sm ghost" data-act="dispcancel" data-id="${d.id}">취소</button>`}</div>`;}).join('')}`;
}
/* src/main/0270-skin-proposal.js에서 옮김 */
// 파견 게시판: 게임의 파견 목록은 이름·설명 견본이고, 실제 의뢰는 매일·완료할 때마다 새로 뽑아요. 보상은 시간×인원에 맞춰요.
const DISP_FOCUS={gold:['크레딧',2500],exp:['경험',6],wmat:['교본',4],core:['코어',0.5]};
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
function openDispSel(did){
  const d=dispList().find(x=>x.id===did), busy=busyIds(), owned=G.chars.filter(c=>own(c.id)&&!busy.has(c.id));
  DSEL=DSEL&&DSEL.id===did?DSEL:{id:did,ids:[]};
  openModal(`${head(esc(d.name),`<span class="muted">${d.hours}시간 · ${d.need}명 필요 · ${rewardText(d.reward)}</span>`)}
    <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="dsauto">자동 선택 <small>(레벨 낮은 순)</small></button>${DSEL.ids.length?'<button class="btn sm ghost" data-act="dsclr">비우기</button>':''}</div>
    <div class="froster">${owned.map(c=>{ const k=DSEL.ids.indexOf(c.id); return `<button class="fr r${c.rarity} ${k>=0?'on':''}" data-act="dsel" data-id="${c.id}" style="--ec:${ECOL[c.elem]}"><div class="fr-art">${art(c)}</div><span class="el" style="--ec:${ECOL[c.elem]}">${esc(c.elem)}</span>${k>=0?`<em class="num">${k+1}</em>`:''}<b>${esc(c.name)}</b><span>Lv.${own(c.id).lv} · ${esc(ROLE[c.role]||'')}</span></button>`; }).join('')||'<p class="muted">보낼 수 있는 '+T('crew')+'이(가) 없어요</p>'}</div>
    <div class="row" style="margin-top:14px"><button class="btn block" data-act="dispgo" ${DSEL.ids.length===d.need?'':'disabled'}>${DSEL.ids.length}/${d.need} 보내기</button></div>`);
}
let DSEL=null;
