/* ===== 0274-expedition — Controller(동작을 받아 Model을 바꾸고 다시 그리게 함 · 섞인 함수는 나눌 것) ===== */
/* src/main/0274-expedition/0275-expedition.js에서 옮김 */
function exStart(id,job){ const c=charById(id), cur=exCond(id), k=EXC().cond; if(!c||exJobOf(id)||exResting(id)||exBizOf(id)) return;
  if(cur<k.min){ toast(`${c.name}의 컨디션이 너무 낮아요. 쉬게 해 주세요`); return; }
  const end=Date.now()+job.hours*3600e3, jid='x'+uid(); progSlot('exped').jobs[jid]={chars:[id],start:Date.now(),hours:job.hours,job,mode:exMode()};
  exSetCond(id,cur-job.cond,end); bump('dispatch'); mark('prog'); render(); } // 일일 미션 "파견"은 원정 방식과 상관없이 셈
function exRest(id,hours){ const cur=exCond(id), now=Date.now(); exSetCond(id,cur,now,now+hours*3600e3); progSlot('exped').streak[id]=0; mark('prog'); render(); }
function exClaim(jid){ const s=progSlot('exped'), j=s.jobs[jid]; if(!j||Date.now()<j.start+j.hours*3600e3) return null; const id=j.chars[0], c=charById(id), cfg=EXC(), condV=(s.cond[id]||{}).v??100; let res, msg;
  if(j.mode==='streamer'){ res=GGMExpedition.streamResult(j.job,s.fame[id]||0,condV+j.job.cond,cfg); if(res.lib) s.lib.push({at:Date.now(),base:res.lib,id}); msg=res.viral?'🔥 영상이 터졌어요! ':''; }
  else { res=GGMExpedition.idolResult(j.job,condV+j.job.cond,s.streak[id]||0,cfg); if((s.streak[id]||0)>=cfg.burnout) exSetCond(id,exCond(id)-j.job.cond*0.5,Date.now()); }
  s.fame[id]=(s.fame[id]||0)+res.fame; s.streak[id]=(s.streak[id]||0)+1; const before=GGMExpedition.tierOf((s.fame[id]||0)-res.fame,cfg).i, t=GGMExpedition.tierOf(s.fame[id],cfg);
  const r=exGive(res.gold); if(c) addAff(c,5); delete s.jobs[jid]; if(j.mode==='idol') delete s.offers[id];
  mark('prog'); toast(`${msg||''}${c?c.name:''} ${j.job.name}: ${rewardText(r)} · ${exFameName()} +${res.fame}${t.i>before?` · 「${t.name}」 등급!`:''}`); return r; }
/* 스트리머: 영상 라이브러리 수익 정산 */
function exLibSettle(){ const s=progSlot('exped'), now=Date.now(), g=GGMExpedition.libIncome(s.lib,s.libAt,now,EXC()); s.libAt=now; s.lib=s.lib.filter(v=>now-v.at<90*864e5); if(g>0){ const r=exGive(g); toast(`영상 수익 정산: ${rewardText(r)}`); } else toast('정산할 영상 수익이 아직 없어요'); mark('prog'); render(); }
function exBizSettle(quiet){ const s=progSlot('exped'), now=Date.now(), b=s.biz; if(!b.at){ b.at=now; return null; } const h=(now-b.at)/3600e3, p=exBizState(), r0=GGMExpedition.bizSettle(p.perf,b.rep,h,EXC());
  Object.values(b.assign).flat().forEach(id=>exSetCond(id,exCond(id),now)); b.rep=r0.rep; b.at=now; const r=r0.gold>0?exGive(r0.gold):null; if(!quiet) toast(r?`정산: ${rewardText(r)} · ${EXC().business.repName} ${Math.round(b.rep)}`:'정산할 수익이 아직 없어요'); mark('prog'); return r; }
function exAssign(part,slot,id){ const b=progSlot('exped').biz; exBizSettle(true); Object.keys(b.assign).forEach(k=>{ b.assign[k]=(b.assign[k]||[]).filter(x=>x&&x!==id); }); const a=b.assign[part]=b.assign[part]||[]; if(id){ a[slot]=id; b.assign[part]=a.filter(Boolean); exSetCond(id,exCond(id),Date.now()); bump('dispatch'); } else { a.splice(slot,1); } if(!b.at) b.at=Date.now(); mark('prog'); render(); }
async function exSave(){ let adv; try{ adv=JSON.parse($('#ex_adv').value); }catch(e){ toast('설정 JSON을 확인해 주세요: '+e.message); return; }
  const mode=(document.querySelector('[name=ex_mode]:checked')||{}).value||'combat', s=P().exped, busy=Object.keys(P().disp||{}).length||s&&(Object.keys(s.jobs||{}).length||Object.values((s.biz||{}).assign||{}).flat().length); // 전투형 파견도 진행 중이면 확인
  if(mode!==exMode()&&busy&&!(await appConfirm('진행 중인 일정·배치가 있어요. 방식을 바꾸면 진행 중인 일정은 보상 없이 끝나고 배치가 풀려요. 바꿀까요?'))) return;
  if(mode!==exMode()){ if(s){ s.jobs={}; s.biz.assign={}; s.biz.at=0; s.offers={}; } dispEndAll(); } // 바꾸면 전투형 파견도 끝냄(남으면 대원이 계속 바쁨)
  Object.assign(exMeta(),adv,{mode}); mark('meta','prog'); closeModal(); render(); }
