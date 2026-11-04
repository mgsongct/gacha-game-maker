/* ===== 0480-battle — Controller(동작을 받아 Model을 바꾸고 다시 그리게 함 · 섞인 함수는 나눌 것) ===== */
/* src/main/0480-battle/0480-battle.js에서 옮김 */
function playStoryStage(ch,s){ playStory(s.title,[s.pre,s.post].filter(Boolean).join('\n')||'…',()=>{ const p=P(), first=!p.cleared[s.id];
    if(first){ p.cleared[s.id]=true; if(ch.kind==='event'){ const ev=G.events.find(e=>e.id===ch.eventId); giveReward({token:s.reward*2},ev&&ev.id); toast(`클리어! ${(ev&&ev.token)||'토큰'} +${s.reward*2}`); } else { giveReward({gems:s.reward,gold:1000}); toast(`클리어! ◆${s.reward} · ${T('gold')} 1,000`); } newBonds(s); mark('prog'); }
    render(); checkTriggers(); }); }
function startBattle(chId,stId){
  const ch=G.chapters.find(x=>x.id===chId), s=ch&&ch.stages.find(x=>x.id===stId); if(!s) return;
  if(s.mode==='debate'||s.mode==='contest') return openModeStage(ch,s); // 회담·콘테스트(0488)
  if(sortieOn()&&!s.story&&(s.enemies||[]).length&&['main','event'].includes(ch.kind||'main')) return sortieBegin(ch,s); // 출격 경로(0487)
  startStage(s,{kind:ch.kind||'main',ch});
}
function bTick(){
  if(!B||B.over||B.paused||B.presentationBusy||B.ending) return;
  v2BattleEvents(GGMCombat.step(B.engine,B.auto)); B.ticks=B.engine.ticks;
  if(B.presentationBusy)return;
  bCheck();
  if(!B)return;
  if(!B.over&&B.engine.winner==='timeout')bEnd(B.ctx.kind==='raid');
  bUpdate();if(B?.ctx.kind==='practice')v2UpdatePractice();
}
/* 전투 끝(Controller): 전투를 멈추고 정산 → 효과음 → 결과 창(출격 경로·레이드·탐사·탑은 각 기능의 끝 처리) */
function bEnd(win){
  if(B.ctx.kind==='practice'){v2StopPractice();return;}
  B.over=true; clearInterval(B.timer); try{ window.GGMVFX&&GGMVFX.clear(); }catch(e){} bUpdate(); bump('battle'); // 공격 중이던 카드·이펙트가 결과 화면 위에 남지 않게
  const so=sortieResult(win); if(so!==null){ bResultShow(so); return; } // 출격 경로(0487)
  if(B.ctx.kind==='raid'||B.ctx.kind==='rogue'||B.ctx.kind==='tower'){ bResultShow(B.ctx.kind==='raid'?raidEnd(win):B.ctx.kind==='tower'?towerEnd(win):rogueEnd(win)); return; }
  const R=stageSettle(win); sfx(win?'승리':'패배'); bResultShow(stageResultHTML(R));
  if(R.mvp&&R.mvp.c.voiceId&&SND().voiceLobby&&R.ml) setTimeout(()=>speak(R.mvp.c,R.ml),700);
}
/* src/main/0480-battle/0487-formation-sortie.js에서 옮김 */
async function sortieBegin(ch,s){ const ctx={kind:ch.kind||'main',ch}; try{ await v2PrepareStage(s,ctx); }catch(e){ toast(e.message||'전투 준비에 실패했어요'); return; }
  const busy=busyIds(), squad=P().squad.filter(id=>own(id)&&!busy.has(id)).slice(0,4); if(!squad.length){ toast('편성할 수 있는 '+T('crew')+'이(가) 없어요'); return; }
  if(!stamUse(stamCost(ctx.kind))) return;
  P().sortie={ch:ch.id,st:s.id,node:routeOf(s).start,hp:{},gained:{gold:0,exp:0},path:[],squad,at:Date.now()}; mark('prog'); sortieMap(); }
function sortieFight(){ const x=sortieParts(); if(!x) return; const {run,ch,s,R}=x, n=nodeById(R,run.node);
  if(n.kind==='supply'){ run.squad.forEach(id=>{ const h=run.hp[id]??1; if(h>0) run.hp[id]=Math.min(1,h+.3); }); run.path.push(n.id); mark('prog'); sortieMap('보급을 받았어요. 체력 30% 회복'); return; }
  closeModal(); const st=nodeStage(s,n,R); startStage(st,{kind:ch.kind||'main',ch,sortie:true,boss:n.kind==='boss',noStam:true,squad:run.squad,prep:al=>al.forEach(u=>{ const h=run.hp[u.c.id]??1; u.hp=Math.max(0,Math.round(u.maxhp*h)); })}); }
// 지점 전투가 끝나면(보스 아님) — bEnd가 부름
/* 출격 지점 전투 끝(Controller): 정산 → 효과음 → 결과 */
function sortieNodeEnd(win){ const R=sortieNodeSettle(win); if(!R) return ''; sfx(win?'승리':'패배'); return sortieNodeResultHTML(R); }
