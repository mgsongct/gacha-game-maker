/* ===== expedition — 기능 class(Model · View · Ctl) — docs/redesign.md 2·3절, tools/reshape.mjs가 매핑대로 옮김 ===== */
class Expedition {
  static seasonIs(t){ const s=LiveOps.seasonNow(); return !!s&&s.type===t; }

    /* 원정(파견) 보상: 시간·인원에 비례해서 건조 자원 2종 */
static conDispReward(hours,need){ const pts=Math.pow(hours,0.85)*(1+0.35*(need-1)), ks=[...CON_RES].sort(()=>Math.random()-.5).slice(0,2), r={}; ks.forEach(k=>{ r[k]=Math.max(10,Math.round(pts*60/10)*10); }); return r; }

    /* 세계 단계 결과 → 재료 던전 이름(키로 맞춤)·원정 방식·상점·바리에이션 기본형·파견 견본(이름·설명) */
static ngWorldExtras(ng,a){ const FA=Array.isArray(a.farms)?a.farms:[], TT=ng.meta.terms, FN={exp:TT.expMat,gold:TT.gold,wmat:TT.wMat,core:TT.core};
    ng.meta.farms=DEFAULT_META.farms.map((d,i)=>{ const f=FA.find(x=>x&&x.key===d.key)||(FA.length===4?FA[i]:null), nm=String((f&&f.name)||'').trim(); return {key:d.key,name:nm||`${FN[d.key]||d.key} 수급`}; });
    const ex=GGMExpedition.fromWorld(a); if(ex) ng.meta.expedition=ex; /* 원정 방식과 그 이름(원정 엔진) */
    if(PROFILE_TPLS[a.profileTemplate]) ng.meta.persona=Object.assign({},ng.meta.persona||{},{tpl:PROFILE_TPLS[a.profileTemplate].slice()}); /* 캐릭터 프로필 항목 틀 — 다음 단계(대원)가 이 틀로 프로필을 만듦 */
    ng.meta.shop=NewGame.neutralShop();
    const V=NewGame.variantsFromAI(a.variants,ng); if(V.length>=2) ng.meta.variants=V;
    ng.dispatches=(Array.isArray(a.dispatches)?a.dispatches:[]).slice(0,6).map((d,i)=>({id:'d'+(i+1),name:String(d.name||'파견'),desc:String(d.desc||'')})); /* 파견 목록은 이름·설명 견본 — 의뢰(시간·인원·보상)는 dispOffer가 매일 뽑음(원안 설계) */
    if(!ng.dispatches.length) ng.dispatches=clone(DEFAULT_DISP); }

  static dispOffer(taken){ const pool=(G.dispatches&&G.dispatches.length?G.dispatches:[{name:'주변 정찰',desc:'근처 구역을 둘러보고 쓸 만한 물자를 모아 와요.'},{name:'물자 호송',desc:'보급품을 안전하게 옮겨요.'}]);
    const free=pool.filter(t=>!(taken||[]).includes(t.name)), tpl=rand(free.length?free:pool), hours=rand([1,2,4,8,12]), need=hours<=2?rand([1,2]):hours<=4?rand([2,3]):rand([3,4]);
    let focus=rand(['gold','gold','exp','exp','wmat','core']); if(focus==='core'&&hours<4) focus='exp';
    const pts=Math.pow(hours,0.85)*(1+0.35*(need-1)), r={}; r[focus]=Math.max(1,Math.round(DISP_FOCUS[focus][1]*pts*(focus==='gold'?1:1)));
    if(focus!=='gold') r.gold=Math.round(600*pts/100)*100; if(focus==='gold') r.gold=Math.round(r.gold/100)*100;
    if(Acquire.conOn()) Object.assign(r,Expedition.conDispReward(hours,need)); // 건조/영입이 켜져 있으면 원정으로 건조 자원도 모아 와요
    return {id:'o'+uid(),name:String(tpl.name||'파견'),desc:String(tpl.desc||''),hours,need,reward:r}; }

    /* 파견 게시판 맞춤(날이 바뀌면 의뢰 새로·예전 방식 파견 잇기·5개까지 채우기) — 진행 칸 dboard의 정의(0070 PROG_SLOTS)가 부름 */
static dispBoardFill(b,p){
    // 예전 방식으로 보낸 파견은 그대로 이어서 보여 줘요
    Object.keys(p.disp||{}).forEach(id=>{ if(!b.list.some(o=>o.id===id)){ const t=(G.dispatches||[]).find(x=>x.id===id)||{}, a=p.disp[id]; b.list.push({id,name:String(t.name||'파견'),desc:String(t.desc||''),hours:a.hours||t.hours||2,need:(a.chars||[]).length||t.need||2,reward:t.reward||{gold:2000}}); } });
    if(b.day!==today()){ b.day=today(); b.rr=0; b.list=b.list.filter(o=>p.disp[o.id]); }
    while(b.list.length<5) b.list.push(Expedition.dispOffer(b.list.map(o=>o.name)));
    return b; }

  static dispList(){ return Core.progRead('dboard').list; }

    /* 전투형 파견을 모두 보상 없이 끝내고 의뢰판을 비움 — 파견 칸(disp·dboard)은 이 모듈이 맡음. 원정 방식을 바꿀 때(0275)가 부름 */
static dispEndAll(){ const p=P(); p.disp={}; if(p.dboard) p.dboard.list=[]; }

  static dispClaim(d){ const id=d.id; const dr=Object.assign({},d.reward,{gift:d.hours>=4?2:1}); if(dr.gems){ dr.gold=(dr.gold||0)+dr.gems*100; delete dr.gems; } if(Expedition.seasonIs('train')) Object.keys(dr).forEach(k=>{ if(typeof dr[k]==='number'&&k!=='gift') dr[k]=Math.round(dr[k]*1.5); }); Object.assign(dr,Characters.rateR(dr)); Economy.giveReward(dr); (P().disp[id].chars||[]).forEach(cid=>{const c=charById(cid);if(c)CoreCtl.addAff(c,10);}); delete P().disp[id]; const b=Core.progSlot('dboard'), i=b.list.findIndex(o=>o.id===id); if(i>=0) b.list.splice(i,1,Expedition.dispOffer(b.list.map(o=>o.name))); return dr; }

  static exMeta(){ return Core.gameRead('meta.expedition'); } // 읽기 — 바꿀 때는 gameSlot('meta.expedition')

  static EXC(){ return GGMExpedition.config(Expedition.exMeta()); }

  static exMode(){ return (G.meta.expedition&&G.meta.expedition.mode)||'combat'; }

    /* 원정 칸을 늘 둘 때: 전투형이 아닌 원정 모드(방송 출연·스트리머·경영) */
static expedOn(){ return Expedition.exMode()!=='combat'; }

  static exBizOf(id){ const a=Core.progRead('exped').biz.assign; return Object.keys(a).find(k=>(a[k]||[]).includes(id))||null; }

  static exCond(id){ const s=Core.progRead('exped'), now=Date.now(), st=s.cond[id]; if(Expedition.exMode()==='business'&&Expedition.exBizOf(id)&&st){ const h=Math.max(0,(now-st.at)/3600e3); return Math.max(0,Math.round(st.v-h*Expedition.EXC().cond.drain)); } return Math.round(GGMExpedition.condNow(st,now,Expedition.EXC())); }

  static exSetCond(id,v,at,rest){ Core.progSlot('exped').cond[id]=Object.assign({v:Math.max(0,Math.min(100,v)),at:at||Date.now()},rest?{rest}:{}); }

  static exJobOf(id){ const J=Core.progRead('exped').jobs; return Object.keys(J).find(k=>J[k].chars.includes(id))||null; }

  static exResting(id){ const st=Core.progRead('exped').cond[id]; return !!(st&&st.rest&&st.rest>Date.now()); }

    // 전투에 못 나가는 캐릭터(일하는 중·쉬는 중·경영 배치). busyIds(0090)가 함께 써요
static exBusyIds(){ if(Expedition.exMode()==='combat'||!P().exped) return []; const s=Core.progRead('exped'); return [...Object.values(s.jobs).flatMap(j=>j.chars),...Object.values(s.biz.assign).flat(),...Object.keys(s.cond).filter(Expedition.exResting)]; }

  static exGive(gold,label){ if(Expedition.seasonIs('train')) gold*=1.5; /* 훈련 시즌 보너스 — 전투형 파견(dispClaim)과 같게 */ const r={gold:Math.max(0,Math.round(gold))}; if(Acquire.conOn()){ const ks=[...CON_RES].sort(()=>Math.random()-.5).slice(0,2); ks.forEach(k=>{ r[k]=Math.max(10,Math.round(gold/20/10)*10); }); } Economy.giveReward(r); return r; }

  static exFameName(){ const m=Expedition.exMode(); return m==='streamer'?Expedition.EXC().streamer.fameName:Expedition.EXC().idol.fameName; }

    /* 방송 출연(idol): 하루 단위로 캐릭터마다 일정이 들어와요. 등급이 낮으면 배정된 1건뿐이고, 높으면 골라서·거절도 자유 */
static exOffers(id){ const s=Core.progSlot('exped'), day=today(); let o=s.offers[id]; if(!o||o.day!==day){ o=s.offers[id]={day,...GGMExpedition.idolOffers(s.fame[id]||0,Expedition.EXC())}; } return o; }

    /* 경영: 배치 바꾸기·정산. 배치를 바꾸기 전에 지금까지의 영업을 먼저 정산해요 */
static exBizState(){ const s=Core.progRead('exped'), chars={}, conds={}; Object.values(s.biz.assign).flat().forEach(id=>{ const c=charById(id); if(c){ chars[id]=c; conds[id]=Expedition.exCond(id); } }); return GGMExpedition.bizPerformance(s.biz.assign,chars,conds,Expedition.EXC()); }

  static exStatus(id){ const j=Expedition.exJobOf(id), s=Core.progRead('exped'); if(j){ const J=s.jobs[j], end=J.start+J.hours*3600e3, left=Math.max(0,Math.ceil((end-Date.now())/60000)); return left?`${esc(J.job.name)} · ${Math.floor(left/60)}시간 ${left%60}분`:`${esc(J.job.name)} 완료`; } if(Expedition.exResting(id)){ const m=Math.ceil((s.cond[id].rest-Date.now())/60000); return `휴식 중 · ${Math.floor(m/60)}시간 ${m%60}분`; } const b=Expedition.exBizOf(id); if(b) return '배치: '+esc((Expedition.EXC().business.parts.find(p=>p.id===b)||{}).name||b); return '대기'; }

  static exStart(id,job){ const c=charById(id), cur=Expedition.exCond(id), k=Expedition.EXC().cond; if(!c||Expedition.exJobOf(id)||Expedition.exResting(id)||Expedition.exBizOf(id)) return;
    if(cur<k.min){ CoreView.toast(`${c.name}의 컨디션이 너무 낮아요. 쉬게 해 주세요`); return; }
    const end=Date.now()+job.hours*3600e3, jid='x'+uid(); Core.progSlot('exped').jobs[jid]={chars:[id],start:Date.now(),hours:job.hours,job,mode:Expedition.exMode()};
    Expedition.exSetCond(id,cur-job.cond,end); Economy.bump('dispatch'); Core.mark('prog'); Challenge.render(); } // 일일 미션 "파견"은 원정 방식과 상관없이 셈

  static exRest(id,hours){ const cur=Expedition.exCond(id), now=Date.now(); Expedition.exSetCond(id,cur,now,now+hours*3600e3); Core.progSlot('exped').streak[id]=0; Core.mark('prog'); Challenge.render(); }

  static exClaim(jid){ const s=Core.progSlot('exped'), j=s.jobs[jid]; if(!j||Date.now()<j.start+j.hours*3600e3) return null; const id=j.chars[0], c=charById(id), cfg=Expedition.EXC(), condV=(s.cond[id]||{}).v??100; let res, msg;
    if(j.mode==='streamer'){ res=GGMExpedition.streamResult(j.job,s.fame[id]||0,condV+j.job.cond,cfg); if(res.lib) s.lib.push({at:Date.now(),base:res.lib,id}); msg=res.viral?'🔥 영상이 터졌어요! ':''; }
    else { res=GGMExpedition.idolResult(j.job,condV+j.job.cond,s.streak[id]||0,cfg); if((s.streak[id]||0)>=cfg.burnout) Expedition.exSetCond(id,Expedition.exCond(id)-j.job.cond*0.5,Date.now()); }
    s.fame[id]=(s.fame[id]||0)+res.fame; s.streak[id]=(s.streak[id]||0)+1; const before=GGMExpedition.tierOf((s.fame[id]||0)-res.fame,cfg).i, t=GGMExpedition.tierOf(s.fame[id],cfg);
    const r=Expedition.exGive(res.gold); if(c) CoreCtl.addAff(c,5); delete s.jobs[jid]; if(j.mode==='idol') delete s.offers[id];
    Core.mark('prog'); CoreView.toast(`${msg||''}${c?c.name:''} ${j.job.name}: ${Core.rewardText(r)} · ${Expedition.exFameName()} +${res.fame}${t.i>before?` · 「${t.name}」 등급!`:''}`); return r; }

    /* 스트리머: 영상 라이브러리 수익 정산 */
static exLibSettle(){ const s=Core.progSlot('exped'), now=Date.now(), g=GGMExpedition.libIncome(s.lib,s.libAt,now,Expedition.EXC()); s.libAt=now; s.lib=s.lib.filter(v=>now-v.at<90*864e5); if(g>0){ const r=Expedition.exGive(g); CoreView.toast(`영상 수익 정산: ${Core.rewardText(r)}`); } else CoreView.toast('정산할 영상 수익이 아직 없어요'); Core.mark('prog'); Challenge.render(); }

  static exBizSettle(quiet){ const s=Core.progSlot('exped'), now=Date.now(), b=s.biz; if(!b.at){ b.at=now; return null; } const h=(now-b.at)/3600e3, p=Expedition.exBizState(), r0=GGMExpedition.bizSettle(p.perf,b.rep,h,Expedition.EXC());
    Object.values(b.assign).flat().forEach(id=>Expedition.exSetCond(id,Expedition.exCond(id),now)); b.rep=r0.rep; b.at=now; const r=r0.gold>0?Expedition.exGive(r0.gold):null; if(!quiet) CoreView.toast(r?`정산: ${Core.rewardText(r)} · ${Expedition.EXC().business.repName} ${Math.round(b.rep)}`:'정산할 수익이 아직 없어요'); Core.mark('prog'); return r; }

  static exAssign(part,slot,id){ const b=Core.progSlot('exped').biz; Expedition.exBizSettle(true); Object.keys(b.assign).forEach(k=>{ b.assign[k]=(b.assign[k]||[]).filter(x=>x&&x!==id); }); const a=b.assign[part]=b.assign[part]||[]; if(id){ a[slot]=id; b.assign[part]=a.filter(Boolean); Expedition.exSetCond(id,Expedition.exCond(id),Date.now()); Economy.bump('dispatch'); } else { a.splice(slot,1); } if(!b.at) b.at=Date.now(); Core.mark('prog'); Challenge.render(); }
}

class ExpeditionCtl {
  static async exSave(){ let adv; try{ adv=JSON.parse($('#ex_adv').value); }catch(e){ CoreView.toast('설정 JSON을 확인해 주세요: '+e.message); return; }
    const mode=(document.querySelector('[name=ex_mode]:checked')||{}).value||'combat', s=P().exped, busy=Object.keys(P().disp||{}).length||s&&(Object.keys(s.jobs||{}).length||Object.values((s.biz||{}).assign||{}).flat().length); // 전투형 파견도 진행 중이면 확인
    if(mode!==Expedition.exMode()&&busy&&!(await appConfirm('진행 중인 일정·배치가 있어요. 방식을 바꾸면 진행 중인 일정은 보상 없이 끝나고 배치가 풀려요. 바꿀까요?'))) return;
    if(mode!==Expedition.exMode()){ if(s){ s.jobs={}; s.biz.assign={}; s.biz.at=0; s.offers={}; } Expedition.dispEndAll(); } // 바꾸면 전투형 파견도 끝냄(남으면 대원이 계속 바쁨)
    Object.assign(Expedition.exMeta(),adv,{mode}); Core.mark('meta','prog'); CoreView.closeModal(); Challenge.render(); }
}

class ExpeditionView {
  static dispHTML(){
    const p=P(), now=Date.now();
    const nDone=Expedition.dispList().filter(d=>{ const a=p.disp[d.id]; return a&&now>=a.start+a.hours*3600e3; }).length, nFree=Expedition.dispList().filter(d=>!p.disp[d.id]).length;
    return `${pageHead(System.T('dispatch'),'LOGISTICS','lobby')}<p class="muted">${System.T('crew')}을(를) 보내 두면 시간이 지나 보상을 가져와요. 파견 중인 ${System.T('crew')}은(는) 전투에 나갈 수 없어요.</p>
  <div class="row" style="margin:6px 0 10px"><button class="btn sm" data-act="dispall" ${nDone?'':'disabled'}>완료된 파견 모두 받기${nDone?` (${nDone})`:''}</button><button class="btn sm ghost" data-act="dispredo" ${nFree?'':'disabled'}>빈 곳 모두 자동 파견</button><button class="btn sm ghost" data-act="dreroll" ${nFree?'':'disabled'}>의뢰 새로고침 ${Core.progRead('dboard').rr?`(${EconomyView.rIco('gold')}2,000)`:'(오늘 1번 무료)'}</button></div>
  <p class="muted" style="margin:-4px 0 8px;font-size:.75rem">의뢰는 매일 바뀌고, 하나를 받으면 그 자리에 새 의뢰가 올라와요. 보상은 시간과 인원에 비례해요.</p>
  ${Expedition.dispList().map(d=>{const a=p.disp[d.id], end=a?a.start+a.hours*3600e3:0, done=a&&now>=end;
      const left=a&&!done?Math.ceil((end-now)/60000):0;
      return `<div class="ep disp"><span class="t"><b>${esc(d.name)}</b><span class="muted">${esc(d.desc)} · ${d.hours}시간 · ${d.need}명</span><span class="muted">${Core.rewardText(d.reward)}</span>${a?`<span class="dp-av">${a.chars.map(id=>{ const c=charById(id); return c?`<i title="${esc(c.name)}">${CoreView.art(c)}</i>`:''; }).join('')}</span><span class="muted">${a.chars.map(id=>esc((charById(id)||{}).name||'')).join(', ')} · ${done?'완료':`${Math.floor(left/60)}시간 ${left%60}분 남음`}</span>`:''}</span>
      ${!a?`<button class="btn sm" data-act="dispset" data-id="${d.id}">보내기</button>`:done?`<button class="btn sm" data-act="dispget" data-id="${d.id}">받기</button>`:`<button class="btn sm ghost" data-act="dispcancel" data-id="${d.id}">취소</button>`}</div>`;}).join('')}`;
  }

  static openDispSel(did){
    const d=Expedition.dispList().find(x=>x.id===did), busy=busyIds(), owned=G.chars.filter(c=>Characters.own(c.id)&&!busy.has(c.id));
    DSEL=DSEL&&DSEL.id===did?DSEL:{id:did,ids:[]};
    CoreView.openModal(`${head(esc(d.name),`<span class="muted">${d.hours}시간 · ${d.need}명 필요 · ${Core.rewardText(d.reward)}</span>`)}
    <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="dsauto">자동 선택 <small>(레벨 낮은 순)</small></button>${DSEL.ids.length?'<button class="btn sm ghost" data-act="dsclr">비우기</button>':''}</div>
    <div class="froster">${owned.map(c=>{ const k=DSEL.ids.indexOf(c.id); return `<button class="fr r${c.rarity} ${k>=0?'on':''}" data-act="dsel" data-id="${c.id}" style="--ec:${ECOL[c.elem]}"><div class="fr-art">${CoreView.art(c)}</div><span class="el" style="--ec:${ECOL[c.elem]}">${esc(c.elem)}</span>${k>=0?`<em class="num">${k+1}</em>`:''}<b>${esc(c.name)}</b><span>Lv.${Characters.own(c.id).lv} · ${esc(ROLE[c.role]||'')}</span></button>`; }).join('')||'<p class="muted">보낼 수 있는 '+System.T('crew')+'이(가) 없어요</p>'}</div>
    <div class="row" style="margin-top:14px"><button class="btn block" data-act="dispgo" ${DSEL.ids.length===d.need?'':'disabled'}>${DSEL.ids.length}/${d.need} 보내기</button></div>`);
  }

  static exCharRow(c,actions){ const s=Core.progRead('exped'), f=s.fame[c.id]||0, t=GGMExpedition.tierOf(f,Expedition.EXC()), m=Expedition.exMode();
    return `<div class="ep disp"><span class="t"><b>${esc(c.name)}</b><span class="muted">컨디션 ${exBar(Expedition.exCond(c.id))}${m!=='business'?` · ${esc(Expedition.exFameName())} ${nf(f)} 「${esc(t.name)}」${t.next?` <span style="font-size:.75rem">(다음 ${nf(t.next.fame)})</span>`:''}`:''} · ${Expedition.exStatus(c.id)}</span>${actions||''}</span></div>`; }

  static exHTML(){ const m=Expedition.exMode(), cfg=Expedition.EXC(), s=Core.progRead('exped'), owned=G.chars.filter(c=>Characters.own(c.id)), [title,desc]=EX_MODE_LABEL[m], now=Date.now();
    const done=Object.entries(s.jobs).filter(([,j])=>now>=j.start+j.hours*3600e3);
    let body='';
    if(m==='idol'){ body=owned.map(c=>{ const busy=Expedition.exJobOf(c.id)||Expedition.exResting(c.id); if(busy) return ExpeditionView.exCharRow(c); const o=Core.progRead('exped').offers[c.id]||{offers:[]}, low=Expedition.exCond(c.id)<cfg.cond.min;
        return ExpeditionView.exCharRow(c,`<span class="muted" style="font-size:.78rem">${o.choice?'들어온 일정 중에서 골라요':'배정된 일정이에요 (등급이 오르면 고를 수 있어요)'}</span><div class="row" style="flex-wrap:wrap;gap:4px;margin-top:4px">${o.offers.map(x=>`<button class="btn sm${o.choice?' ghost':''}" data-act="exjob" data-id="${c.id}" data-job="${x.id}" ${low?'disabled':''}>${esc(x.kind)} · ${esc(x.name)} ${x.hours}h · ${exIco('gold')}${nf(x.pay)} · +${x.fame}</button>`).join('')}<button class="btn sm ghost" data-act="exrest" data-id="${c.id}">휴식 4h</button></div>`); }).join(''); }
    else if(m==='streamer'){ const pend=GGMExpedition.libIncome(s.lib,s.libAt,now,cfg);
      body=`<div class="panel"><b>영상 라이브러리</b> <span class="muted">${s.lib.length}개 · 쌓인 수익 ${exIco('gold')}${nf(pend)}</span> <button class="btn sm" data-act="exlib" ${pend>0?'':'disabled'}>수익 정산</button></div>`+owned.map(c=>{ const busy=Expedition.exJobOf(c.id)||Expedition.exResting(c.id); if(busy) return ExpeditionView.exCharRow(c); const low=Expedition.exCond(c.id)<cfg.cond.min;
        return ExpeditionView.exCharRow(c,`<div class="row" style="flex-wrap:wrap;gap:4px;margin-top:4px">${cfg.streamer.platforms.map(p=>`<button class="btn sm ghost" data-act="exstream" data-id="${c.id}" data-pf="${p.id}" ${low?'disabled':''}>${esc(p.name)} ${p.hours}h</button>`).join('')}<button class="btn sm ghost" data-act="exrest" data-id="${c.id}">휴식 4h</button></div>`); }).join(''); }
    else if(m==='business'){ const B=cfg.business, st=Expedition.exBizState(), h=s.biz.at?Math.min(B.cap,(now-s.biz.at)/3600e3):0, est=GGMExpedition.bizSettle(st.perf,s.biz.rep,h,cfg), free=owned.filter(c=>!Expedition.exJobOf(c.id)&&!Expedition.exResting(c.id));
      body=`<div class="panel"><p style="margin:0 0 4px">실적 <b>${Math.round(st.perf*100)}%</b> · ${esc(B.repName)} <b>${Math.round(s.biz.rep)}</b>/${B.repMax} · 쌓인 수익 ${exIco('gold')}<b>${nf(est.gold)}</b> <span class="muted">(${h.toFixed(1)}시간, 최대 ${B.cap}시간)</span></p><p class="muted" style="margin:0 0 6px;font-size:.8rem">수익은 파트별이 아니라 전체 실적과 ${esc(B.repName)}으로 한 번에 나와요. 실적이 ${Math.round(B.target*100)}%를 넘으면 ${esc(B.repName)}이 오르고, 낮으면 내려가요. 배치된 ${esc(System.T('crew'))}은(는) 컨디션이 줄어요.</p><button class="btn sm" data-act="exsettle" ${est.gold>0?'':'disabled'}>정산</button></div>`+
        B.parts.map(p=>{ const ps=st.parts.find(x=>x.id===p.id), ids=s.biz.assign[p.id]||[]; return `<div class="panel"><b>${esc(p.name)}</b> <span class="muted">담당 능력: ${esc(({hp:'체력',atk:'공격',def:'방어',spd:'속도'})[p.stat]||p.stat)} · 적합도 ${Math.round(ps.fit*100)}% · ${ids.length}/${p.slots}명</span><div class="row" style="flex-wrap:wrap;gap:6px;margin-top:6px">${Array.from({length:p.slots},(_,i)=>`<select class="in" data-exassign="${p.id}" data-slot="${i}" style="max-width:180px"><option value="">비어 있음</option>${free.filter(c=>!Expedition.exBizOf(c.id)||ids[i]===c.id).map(c=>`<option value="${c.id}" ${ids[i]===c.id?'selected':''}>${esc(c.name)} (컨디션 ${Expedition.exCond(c.id)})</option>`).join('')}</select>`).join('')}</div></div>`; }).join('')+`<h3 class="sec" style="margin-top:10px">${esc(System.T('crew'))} 상태</h3>`+owned.map(c=>ExpeditionView.exCharRow(c,Expedition.exBizOf(c.id)?'':`<div class="row" style="margin-top:4px"><button class="btn sm ghost" data-act="exrest" data-id="${c.id}" ${Expedition.exResting(c.id)?'disabled':''}>휴식 4h</button></div>`)).join(''); }
    return `${pageHead(System.T('dispatch'),({combat:'EXPEDITION',idol:'SCHEDULE',streamer:'CONTENT',business:'MANAGEMENT'})[m],'lobby')}<p style="margin:0 0 4px"><b>${esc(title)}</b></p><p class="muted">${esc(desc)}. 컨디션이 ${cfg.cond.low} 아래면 성과가 떨어지고 ${cfg.cond.min} 아래면 일을 못 해요. 쉬면 빨리 회복돼요. 일하는 중·쉬는 중·배치된 ${esc(System.T('crew'))}은(는) 전투에 나갈 수 없어요.</p>
  ${done.length?`<div class="row" style="margin:6px 0 10px"><button class="btn sm" data-act="exclaimall">완료된 일정 모두 받기 (${done.length})</button></div>`:''}
  ${done.map(([jid,j])=>{ const c=charById(j.chars[0]); return `<div class="ep disp"><span class="t"><b>${esc(c?c.name:'')}</b><span class="muted">${esc(j.job.name)} 완료</span></span><button class="btn sm" data-act="exclaim" data-id="${jid}">받기</button></div>`; }).join('')}
  ${owned.length?body:`<p class="muted">보유한 ${esc(System.T('crew'))}이(가) 없어요.</p>`}`; }

  static dispPageHTML(){ return Expedition.exMode()==='combat'?ExpeditionView.dispHTML():ExpeditionView.exHTML(); }

    /* 설정 패널 (설정 → 게임) */
static exSettingsPanel(){ const m=Expedition.exMode(); return `<div class="panel pm-hide"><h3>${esc(System.T('dispatch'))} 방식 <span class="badge">${esc(EX_MODE_LABEL[m][0])}</span></h3><p class="muted" style="margin:0 0 10px">게임 장르에 맞는 ${esc(System.T('dispatch'))} 방식을 골라요. ${esc(EX_MODE_LABEL[m][1])}.</p><div class="row"><button class="btn sm ghost" data-act="exset">방식 바꾸기 · 상세 설정</button></div></div>`; }

  static openExSet(){ const cfg=Expedition.EXC(), m=Expedition.exMode(), adv={cond:cfg.cond,tiers:cfg.tiers,burnout:cfg.burnout,idol:cfg.idol,streamer:cfg.streamer,business:cfg.business};
    CoreView.openModal(`${head(System.T('dispatch')+' 방식')}${GGMExpedition.MODES.map(k=>`<label style="display:flex;gap:8px;margin:6px 0"><input type="radio" name="ex_mode" value="${k}" ${k===m?'checked':''}><span><b>${esc(EX_MODE_LABEL[k][0])}</b><br><span class="muted" style="font-size:.8rem">${esc(EX_MODE_LABEL[k][1])}</span></span></label>`).join('')}
    <p class="muted" style="font-size:.8rem">메뉴 이름은 게임 정의 편집 → 용어 → 파견에서 바꿔요(예: 원정·스케줄·방송·영업).</p>
    <details style="margin-top:8px"><summary>상세 설정 JSON (방송국·플랫폼·파트·등급·컨디션)</summary><textarea class="in" id="ex_adv" rows="12" style="font-family:monospace;font-size:.75rem">${esc(JSON.stringify(adv,null,1))}</textarea></details>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="exsave">저장</button><button class="btn ghost" data-act="close">취소</button></div>`); }
}
