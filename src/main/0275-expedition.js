/* ===== 원정 모드 (전투형 원정 · 방송 출연 · 스트리머 · 경영) ===== */
/* 엔진: modules/app/030-expedition.js (GGMExpedition). 설정: G.meta.expedition(바꾼 값만) · 진행: P().exped
   combat 모드는 기존 파견(dispHTML·dispOffer) 그대로. 나머지 모드는 이 파일의 화면을 써요. 문서: docs/research/expedition.md */
const EX_MODE_LABEL={combat:['전투형 원정','지역에 보내 자원을 가져와요 (칸코레·소녀전선류)'],idol:['방송 출연','방송국·스폰서 일정에 나가 보수와 인지도를 얻어요 (아이돌 육성류)'],streamer:['콘텐츠 방송','플랫폼을 골라 영상·라이브·숏폼을 올려 수익과 구독자를 모아요 (스트리머·버튜버류)'],business:['경영','파트에 배치해 일하게 하고, 전체 실적과 평판으로 수익이 나와요 (상점·기업 경영류)']};
function exMeta(){ if(!G.meta.expedition||typeof G.meta.expedition!=='object') G.meta.expedition={mode:'combat'}; return G.meta.expedition; }
function EXC(){ return GGMExpedition.config(exMeta()); }
function exMode(){ return (G.meta.expedition&&G.meta.expedition.mode)||'combat'; }
function EXS(){ const p=P(); let s=p.exped; if(!s||typeof s!=='object') s=p.exped={}; for(const [k,v] of [['fame',{}],['cond',{}],['jobs',{}],['offers',{}],['streak',{}],['lib',[]]]) if(!s[k]||typeof s[k]!=='object') s[k]=v; if(!s.biz||typeof s.biz!=='object') s.biz={assign:{},at:0,rep:0}; if(!s.libAt) s.libAt=Date.now(); return s; }
function exBizOf(id){ const a=EXS().biz.assign; return Object.keys(a).find(k=>(a[k]||[]).includes(id))||null; }
function exCond(id){ const s=EXS(), now=Date.now(), st=s.cond[id]; if(exMode()==='business'&&exBizOf(id)&&st){ const h=Math.max(0,(now-st.at)/3600e3); return Math.max(0,Math.round(st.v-h*EXC().cond.drain)); } return Math.round(GGMExpedition.condNow(st,now,EXC())); }
function exSetCond(id,v,at,rest){ EXS().cond[id]=Object.assign({v:Math.max(0,Math.min(100,v)),at:at||Date.now()},rest?{rest}:{}); }
function exJobOf(id){ const J=EXS().jobs; return Object.keys(J).find(k=>J[k].chars.includes(id))||null; }
function exResting(id){ const st=EXS().cond[id]; return !!(st&&st.rest&&st.rest>Date.now()); }
// 전투에 못 나가는 캐릭터(일하는 중·쉬는 중·경영 배치). busyIds(0090)가 함께 써요
function exBusyIds(){ if(exMode()==='combat'||!P().exped) return []; const s=EXS(); return [...Object.values(s.jobs).flatMap(j=>j.chars),...Object.values(s.biz.assign).flat(),...Object.keys(s.cond).filter(exResting)]; }
function exGive(gold,label){ if(seasonIs('train')) gold*=1.5; /* 훈련 시즌 보너스 — 전투형 파견(dispClaim)과 같게 */ const r={gold:Math.max(0,Math.round(gold))}; if(conOn()){ const ks=[...CON_RES].sort(()=>Math.random()-.5).slice(0,2); ks.forEach(k=>{ r[k]=Math.max(10,Math.round(gold/20/10)*10); }); } giveReward(r); return r; }
function exFameName(){ const m=exMode(); return m==='streamer'?EXC().streamer.fameName:EXC().idol.fameName; }

/* 방송 출연(idol): 하루 단위로 캐릭터마다 일정이 들어와요. 등급이 낮으면 배정된 1건뿐이고, 높으면 골라서·거절도 자유 */
function exOffers(id){ const s=EXS(), day=today(); let o=s.offers[id]; if(!o||o.day!==day){ o=s.offers[id]={day,...GGMExpedition.idolOffers(s.fame[id]||0,EXC())}; } return o; }
function exStart(id,job){ const c=charById(id), cur=exCond(id), k=EXC().cond; if(!c||exJobOf(id)||exResting(id)||exBizOf(id)) return;
  if(cur<k.min){ toast(`${c.name}의 컨디션이 너무 낮아요. 쉬게 해 주세요`); return; }
  const end=Date.now()+job.hours*3600e3, jid='x'+uid(); EXS().jobs[jid]={chars:[id],start:Date.now(),hours:job.hours,job,mode:exMode()};
  exSetCond(id,cur-job.cond,end); bump('dispatch'); mark('prog'); render(); } // 일일 미션 "파견"은 원정 방식과 상관없이 셈
function exRest(id,hours){ const cur=exCond(id), now=Date.now(); exSetCond(id,cur,now,now+hours*3600e3); EXS().streak[id]=0; mark('prog'); render(); }
function exClaim(jid){ const s=EXS(), j=s.jobs[jid]; if(!j||Date.now()<j.start+j.hours*3600e3) return null; const id=j.chars[0], c=charById(id), cfg=EXC(), condV=(s.cond[id]||{}).v??100; let res, msg;
  if(j.mode==='streamer'){ res=GGMExpedition.streamResult(j.job,s.fame[id]||0,condV+j.job.cond,cfg); if(res.lib) s.lib.push({at:Date.now(),base:res.lib,id}); msg=res.viral?'🔥 영상이 터졌어요! ':''; }
  else { res=GGMExpedition.idolResult(j.job,condV+j.job.cond,s.streak[id]||0,cfg); if((s.streak[id]||0)>=cfg.burnout) exSetCond(id,exCond(id)-j.job.cond*0.5,Date.now()); }
  s.fame[id]=(s.fame[id]||0)+res.fame; s.streak[id]=(s.streak[id]||0)+1; const before=GGMExpedition.tierOf((s.fame[id]||0)-res.fame,cfg).i, t=GGMExpedition.tierOf(s.fame[id],cfg);
  const r=exGive(res.gold); if(c) addAff(c,5); delete s.jobs[jid]; if(j.mode==='idol') delete s.offers[id];
  mark('prog'); toast(`${msg||''}${c?c.name:''} ${j.job.name}: ${rewardText(r)} · ${exFameName()} +${res.fame}${t.i>before?` · 「${t.name}」 등급!`:''}`); return r; }
/* 스트리머: 영상 라이브러리 수익 정산 */
function exLibSettle(){ const s=EXS(), now=Date.now(), g=GGMExpedition.libIncome(s.lib,s.libAt,now,EXC()); s.libAt=now; s.lib=s.lib.filter(v=>now-v.at<90*864e5); if(g>0){ const r=exGive(g); toast(`영상 수익 정산: ${rewardText(r)}`); } else toast('정산할 영상 수익이 아직 없어요'); mark('prog'); render(); }
/* 경영: 배치 바꾸기·정산. 배치를 바꾸기 전에 지금까지의 영업을 먼저 정산해요 */
function exBizState(){ const s=EXS(), chars={}, conds={}; Object.values(s.biz.assign).flat().forEach(id=>{ const c=charById(id); if(c){ chars[id]=c; conds[id]=exCond(id); } }); return GGMExpedition.bizPerformance(s.biz.assign,chars,conds,EXC()); }
function exBizSettle(quiet){ const s=EXS(), now=Date.now(), b=s.biz; if(!b.at){ b.at=now; return null; } const h=(now-b.at)/3600e3, p=exBizState(), r0=GGMExpedition.bizSettle(p.perf,b.rep,h,EXC());
  Object.values(b.assign).flat().forEach(id=>exSetCond(id,exCond(id),now)); b.rep=r0.rep; b.at=now; const r=r0.gold>0?exGive(r0.gold):null; if(!quiet) toast(r?`정산: ${rewardText(r)} · ${EXC().business.repName} ${Math.round(b.rep)}`:'정산할 수익이 아직 없어요'); mark('prog'); return r; }
function exAssign(part,slot,id){ const b=EXS().biz; exBizSettle(true); Object.keys(b.assign).forEach(k=>{ b.assign[k]=(b.assign[k]||[]).filter(x=>x&&x!==id); }); const a=b.assign[part]=b.assign[part]||[]; if(id){ a[slot]=id; b.assign[part]=a.filter(Boolean); exSetCond(id,exCond(id),Date.now()); bump('dispatch'); } else { a.splice(slot,1); } if(!b.at) b.at=Date.now(); mark('prog'); render(); }

const exIco=k=>`<span style="display:inline-flex;width:1em;height:1em;vertical-align:-.15em">${rIco(k)}</span>`; // 아이콘 그림을 글자 크기로
const exBar=v=>`<span style="display:inline-block;width:60px;height:6px;background:var(--line);border-radius:3px;vertical-align:middle;overflow:hidden"><i style="display:block;height:100%;width:${v}%;background:${v>=60?'#4fd18b':v>=30?'#ffd35a':'#ff5a5a'}"></i></span> ${v}`;
function exStatus(id){ const j=exJobOf(id), s=EXS(); if(j){ const J=s.jobs[j], end=J.start+J.hours*3600e3, left=Math.max(0,Math.ceil((end-Date.now())/60000)); return left?`${esc(J.job.name)} · ${Math.floor(left/60)}시간 ${left%60}분`:`${esc(J.job.name)} 완료`; } if(exResting(id)){ const m=Math.ceil((s.cond[id].rest-Date.now())/60000); return `휴식 중 · ${Math.floor(m/60)}시간 ${m%60}분`; } const b=exBizOf(id); if(b) return '배치: '+esc((EXC().business.parts.find(p=>p.id===b)||{}).name||b); return '대기'; }
function exCharRow(c,actions){ const s=EXS(), f=s.fame[c.id]||0, t=GGMExpedition.tierOf(f,EXC()), m=exMode();
  return `<div class="ep disp"><span class="t"><b>${esc(c.name)}</b><span class="muted">컨디션 ${exBar(exCond(c.id))}${m!=='business'?` · ${esc(exFameName())} ${nf(f)} 「${esc(t.name)}」${t.next?` <span style="font-size:.75rem">(다음 ${nf(t.next.fame)})</span>`:''}`:''} · ${exStatus(c.id)}</span>${actions||''}</span></div>`; }
function exHTML(){ const m=exMode(), cfg=EXC(), s=EXS(), owned=G.chars.filter(c=>own(c.id)), [title,desc]=EX_MODE_LABEL[m], now=Date.now();
  const done=Object.entries(s.jobs).filter(([,j])=>now>=j.start+j.hours*3600e3);
  let body='';
  if(m==='idol'){ body=owned.map(c=>{ const busy=exJobOf(c.id)||exResting(c.id); if(busy) return exCharRow(c); const o=exOffers(c.id), low=exCond(c.id)<cfg.cond.min;
      return exCharRow(c,`<span class="muted" style="font-size:.78rem">${o.choice?'들어온 일정 중에서 골라요':'배정된 일정이에요 (등급이 오르면 고를 수 있어요)'}</span><div class="row" style="flex-wrap:wrap;gap:4px;margin-top:4px">${o.offers.map(x=>`<button class="btn sm${o.choice?' ghost':''}" data-act="exjob" data-id="${c.id}" data-job="${x.id}" ${low?'disabled':''}>${esc(x.kind)} · ${esc(x.name)} ${x.hours}h · ${exIco('gold')}${nf(x.pay)} · +${x.fame}</button>`).join('')}<button class="btn sm ghost" data-act="exrest" data-id="${c.id}">휴식 4h</button></div>`); }).join(''); }
  else if(m==='streamer'){ const pend=GGMExpedition.libIncome(s.lib,s.libAt,now,cfg);
    body=`<div class="panel"><b>영상 라이브러리</b> <span class="muted">${s.lib.length}개 · 쌓인 수익 ${exIco('gold')}${nf(pend)}</span> <button class="btn sm" data-act="exlib" ${pend>0?'':'disabled'}>수익 정산</button></div>`+owned.map(c=>{ const busy=exJobOf(c.id)||exResting(c.id); if(busy) return exCharRow(c); const low=exCond(c.id)<cfg.cond.min;
      return exCharRow(c,`<div class="row" style="flex-wrap:wrap;gap:4px;margin-top:4px">${cfg.streamer.platforms.map(p=>`<button class="btn sm ghost" data-act="exstream" data-id="${c.id}" data-pf="${p.id}" ${low?'disabled':''}>${esc(p.name)} ${p.hours}h</button>`).join('')}<button class="btn sm ghost" data-act="exrest" data-id="${c.id}">휴식 4h</button></div>`); }).join(''); }
  else if(m==='business'){ const B=cfg.business, st=exBizState(), h=s.biz.at?Math.min(B.cap,(now-s.biz.at)/3600e3):0, est=GGMExpedition.bizSettle(st.perf,s.biz.rep,h,cfg), free=owned.filter(c=>!exJobOf(c.id)&&!exResting(c.id));
    body=`<div class="panel"><p style="margin:0 0 4px">실적 <b>${Math.round(st.perf*100)}%</b> · ${esc(B.repName)} <b>${Math.round(s.biz.rep)}</b>/${B.repMax} · 쌓인 수익 ${exIco('gold')}<b>${nf(est.gold)}</b> <span class="muted">(${h.toFixed(1)}시간, 최대 ${B.cap}시간)</span></p><p class="muted" style="margin:0 0 6px;font-size:.8rem">수익은 파트별이 아니라 전체 실적과 ${esc(B.repName)}으로 한 번에 나와요. 실적이 ${Math.round(B.target*100)}%를 넘으면 ${esc(B.repName)}이 오르고, 낮으면 내려가요. 배치된 ${esc(T('crew'))}은(는) 컨디션이 줄어요.</p><button class="btn sm" data-act="exsettle" ${est.gold>0?'':'disabled'}>정산</button></div>`+
      B.parts.map(p=>{ const ps=st.parts.find(x=>x.id===p.id), ids=s.biz.assign[p.id]||[]; return `<div class="panel"><b>${esc(p.name)}</b> <span class="muted">담당 능력: ${esc(({hp:'체력',atk:'공격',def:'방어',spd:'속도'})[p.stat]||p.stat)} · 적합도 ${Math.round(ps.fit*100)}% · ${ids.length}/${p.slots}명</span><div class="row" style="flex-wrap:wrap;gap:6px;margin-top:6px">${Array.from({length:p.slots},(_,i)=>`<select class="in" data-exassign="${p.id}" data-slot="${i}" style="max-width:180px"><option value="">비어 있음</option>${free.filter(c=>!exBizOf(c.id)||ids[i]===c.id).map(c=>`<option value="${c.id}" ${ids[i]===c.id?'selected':''}>${esc(c.name)} (컨디션 ${exCond(c.id)})</option>`).join('')}</select>`).join('')}</div></div>`; }).join('')+`<h3 class="sec" style="margin-top:10px">${esc(T('crew'))} 상태</h3>`+owned.map(c=>exCharRow(c,exBizOf(c.id)?'':`<div class="row" style="margin-top:4px"><button class="btn sm ghost" data-act="exrest" data-id="${c.id}" ${exResting(c.id)?'disabled':''}>휴식 4h</button></div>`)).join(''); }
  return `${pageHead(T('dispatch'),({combat:'EXPEDITION',idol:'SCHEDULE',streamer:'CONTENT',business:'MANAGEMENT'})[m],'lobby')}<p style="margin:0 0 4px"><b>${esc(title)}</b></p><p class="muted">${esc(desc)}. 컨디션이 ${cfg.cond.low} 아래면 성과가 떨어지고 ${cfg.cond.min} 아래면 일을 못 해요. 쉬면 빨리 회복돼요. 일하는 중·쉬는 중·배치된 ${esc(T('crew'))}은(는) 전투에 나갈 수 없어요.</p>
  ${done.length?`<div class="row" style="margin:6px 0 10px"><button class="btn sm" data-act="exclaimall">완료된 일정 모두 받기 (${done.length})</button></div>`:''}
  ${done.map(([jid,j])=>{ const c=charById(j.chars[0]); return `<div class="ep disp"><span class="t"><b>${esc(c?c.name:'')}</b><span class="muted">${esc(j.job.name)} 완료</span></span><button class="btn sm" data-act="exclaim" data-id="${jid}">받기</button></div>`; }).join('')}
  ${owned.length?body:`<p class="muted">보유한 ${esc(T('crew'))}이(가) 없어요.</p>`}`; }
function dispPageHTML(){ return exMode()==='combat'?dispHTML():exHTML(); }

/* 설정 패널 (설정 → 게임) */
function exSettingsPanel(){ const m=exMode(); return `<div class="panel pm-hide"><h3>${esc(T('dispatch'))} 방식 <span class="badge">${esc(EX_MODE_LABEL[m][0])}</span></h3><p class="muted" style="margin:0 0 10px">게임 장르에 맞는 ${esc(T('dispatch'))} 방식을 골라요. ${esc(EX_MODE_LABEL[m][1])}.</p><div class="row"><button class="btn sm ghost" data-act="exset">방식 바꾸기 · 상세 설정</button></div></div>`; }
function openExSet(){ const cfg=EXC(), m=exMode(), adv={cond:cfg.cond,tiers:cfg.tiers,burnout:cfg.burnout,idol:cfg.idol,streamer:cfg.streamer,business:cfg.business};
  openModal(`${head(T('dispatch')+' 방식')}${GGMExpedition.MODES.map(k=>`<label style="display:flex;gap:8px;margin:6px 0"><input type="radio" name="ex_mode" value="${k}" ${k===m?'checked':''}><span><b>${esc(EX_MODE_LABEL[k][0])}</b><br><span class="muted" style="font-size:.8rem">${esc(EX_MODE_LABEL[k][1])}</span></span></label>`).join('')}
    <p class="muted" style="font-size:.8rem">메뉴 이름은 게임 정의 편집 → 용어 → 파견에서 바꿔요(예: 원정·스케줄·방송·영업).</p>
    <details style="margin-top:8px"><summary>상세 설정 JSON (방송국·플랫폼·파트·등급·컨디션)</summary><textarea class="in" id="ex_adv" rows="12" style="font-family:monospace;font-size:.75rem">${esc(JSON.stringify(adv,null,1))}</textarea></details>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="exsave">저장</button><button class="btn ghost" data-act="close">취소</button></div>`); }
async function exSave(){ let adv; try{ adv=JSON.parse($('#ex_adv').value); }catch(e){ toast('설정 JSON을 확인해 주세요: '+e.message); return; }
  const mode=(document.querySelector('[name=ex_mode]:checked')||{}).value||'combat', s=P().exped, busy=Object.keys(P().disp||{}).length||s&&(Object.keys(s.jobs||{}).length||Object.values((s.biz||{}).assign||{}).flat().length); // 전투형 파견도 진행 중이면 확인
  if(mode!==exMode()&&busy&&!(await appConfirm('진행 중인 일정·배치가 있어요. 방식을 바꾸면 진행 중인 일정은 보상 없이 끝나고 배치가 풀려요. 바꿀까요?'))) return;
  if(mode!==exMode()){ if(s){ s.jobs={}; s.biz.assign={}; s.biz.at=0; s.offers={}; } dispEndAll(); } // 바꾸면 전투형 파견도 끝냄(남으면 대원이 계속 바쁨)
  Object.assign(exMeta(),adv,{mode}); mark('meta','prog'); closeModal(); render(); }

document.addEventListener('click',e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act, id=el.dataset.id;
  if(a==='exjob'){ const o=exOffers(id), job=o.offers.find(x=>x.id===el.dataset.job); if(job) exStart(id,job); }
  else if(a==='exstream'){ const pf=EXC().streamer.platforms.find(p=>p.id===el.dataset.pf); if(pf) exStart(id,pf); }
  else if(a==='exrest') exRest(id,4);
  else if(a==='exclaim'){ exClaim(id); render(); }
  else if(a==='exclaimall'){ Object.keys(EXS().jobs).forEach(exClaim); render(); }
  else if(a==='exlib') exLibSettle();
  else if(a==='exsettle'){ exBizSettle(); render(); }
  else if(a==='exset') openExSet();
  else if(a==='exsave') exSave(); });
document.addEventListener('change',e=>{ const el=e.target; if(!el.dataset||el.dataset.exassign==null) return; exAssign(el.dataset.exassign,+el.dataset.slot,el.value||null); });
