/* =========================================================
   전투
   ========================================================= */
let B=null;
function stageBg(s){const L=parseScript(s.pre).find(l=>(l.type==='cmd'&&l.cmd==='배경')||l.type==='place');return L?(L.arg||L.text):'';}
// 전투 없는 이야기 스테이지: 대본만 보고 클리어해요
function openStoryStage(ch,s){ const cl=!!P().cleared[s.id], code=ch.kind==='event'?'EV'+(ch.stages.indexOf(s)+1):stageCode(s.id);
  openModal(`${head(esc(code+' '+s.title),'<span class="muted">STORY · 전투 없는 이야기</span>')}
    <div class="ststory" style="${bgStyle(stageBg(s)||ch.title)}"><span>📖</span></div>
    <p class="muted" style="margin:8px 0">${cl?'다시 볼 수 있어요.':'이야기를 끝까지 보면 클리어돼요. 첫 클리어 보상: '+(ch.kind==='event'?esc(((G.events.find(ev=>ev.id===ch.eventId)||{}).token)||'토큰')+' '+s.reward*2:'◆'+s.reward)}</p>
    <div class="row"><button class="btn" data-act="ststory" data-ch="${ch.id}" data-st="${s.id}">${cl?'다시 보기':'이야기 보기'}</button><button class="btn ghost" data-act="chedit" data-ch="${ch.id}">스토리 편집</button></div>`); }
function playStoryStage(ch,s){ playStory(s.title,[s.pre,s.post].filter(Boolean).join('\n')||'…',()=>{ const p=P(), first=!p.cleared[s.id];
    if(first){ p.cleared[s.id]=true; if(ch.kind==='event'){ const ev=G.events.find(e=>e.id===ch.eventId); giveReward({token:s.reward*2},ev&&ev.id); toast(`클리어! ${(ev&&ev.token)||'토큰'} +${s.reward*2}`); } else { giveReward({gems:s.reward,gold:1000}); toast(`클리어! ◆${s.reward} · ${T('gold')} 1,000`); } newBonds(s); mark('prog'); }
    render(); checkTriggers(); }); }
function startBattle(chId,stId){
  const ch=G.chapters.find(x=>x.id===chId), s=ch&&ch.stages.find(x=>x.id===stId); if(!s) return;
  if(s.mode==='debate'||s.mode==='contest') return openModeStage(ch,s); // 회담·콘테스트(0488)
  if(sortieOn()&&!s.story&&(s.enemies||[]).length&&['main','event'].includes(ch.kind||'main')) return sortieBegin(ch,s); // 출격 경로(0487)
  startStage(s,{kind:ch.kind||'main',ch});
}
async function startStage(s,ctx){
  const busy=busyIds();
  const squad=(ctx.squad||P().squad).map(charById).filter(c=>c&&(!ctx.allow||ctx.allow(c))&&(ctx.kind==='practice'||own(c.id))&&(ctx.kind==='practice'||ctx.squad||!busy.has(c.id))).slice(0,4);
  if(!squad.length){toast('편성할 수 있는 '+T('crew')+'이(가) 없어요. 파견 중인지 확인해 주세요.');return;}
  if(window.__v2Starting) return; window.__v2Starting=true;
  try{ if(ctx.kind==='practice')squad.forEach(v2Ensure);else await v2ReadyChars(squad);
    await v2PrepareStage(s,ctx);
  }catch(e){toast(e.message||'전투 준비에 실패했어요');return;}finally{window.__v2Starting=false;}
  if(ctx.kind!=='practice'&&!ctx.noStam&&!stamUse(stamCost(ctx.kind||'main'))) return;
  const fbon=factionBonus(squad.map(c=>c.id));
  const allies=squad.map(c=>{const st=stats(c),o=own(c.id)||{wlv:0};v2EnsureEquipment(c);return {side:'a',slot:squad.indexOf(c),c,name:c.name,range:charRange(c),elem:c.elem,role:c.role,maxhp:st.hp,hp:st.hp,atk:Math.round(st.atk*(1+(fbon[c.faction]||0)/100)),def:st.def,spd:st.spd,g:Math.random()*600,sh:0,mul:1,skillTraining:GGMCombat.trainingState(o.skillTraining),wlv:o.wlv||0};});
  const enemies=s.enemies.map(en=>({side:'e',name:en.name,elem:en.elem,role:en.role,boss:en.boss,maxhp:en.hp,hp:en.hp,baseHp:en.hp,atk:en.atk,def:en.def,spd:en.spd,g:Math.random()*400,turns:0,sh:0,mul:1,pattern:en.pattern,skills:en.skills}));
  if(ctx.prep) ctx.prep(allies,enemies);
  fieldApply(s,allies,enemies); // 전장 규칙(0485)
  B={ch:ctx.ch||null,ctx,s,allies,enemies,auto:true,speed:[1,2,3].includes(P().settings.bspeed)?P().settings.bspeed:1,timer:null,over:false,log:[],ticks:0};
  B.engine=GGMCombat.create(allies,enemies,{...v2Options(),timedImpacts:true,externalImpacts:true,seed:ctx.kind==='practice'?77:Math.floor(Math.random()*0xffffffff),maxTime:fieldTime(s)||119,practice:ctx.kind==='practice'});
  if(Object.keys(fbon).length) setTimeout(()=>B&&blog(Object.entries(fbon).map(([f,v])=>`${f} 소속 보너스 공격 +${v}%`).join(', ')),300);
  $('#ov').innerHTML=`<div class="bt"><div class="bt-bg" style="${bgStyle(stageBg(s)||'폐선로')}"></div>
    <div class="bt-top"><span class="ttl"><i>${ctx.kind==='practice'?'PRACTICE':ctx.kind==='farm'?'TRAINING':ctx.kind==='event'?'EVENT':ctx.kind==='raid'?'RAID · '+Math.ceil(RAID_TICKS*GGMCombat.DT)+'s':ctx.kind==='rogue'?'EXPEDITION':'OPERATION'}</i>${esc(s.title)}</span><button data-act="bauto" class="on">필살 자동</button><button data-act="bspeed" class="${(P().settings.bspeed||1)>1?'on':''}">${[1,2,3].includes(P().settings.bspeed)?P().settings.bspeed:1}x</button><button data-act="bquit">${ctx.kind==='practice'?'연습 종료':'후퇴'}</button></div>
    <div class="bt-en">${enemies.map((en,i)=>`<div data-act="bfocus" data-i="${i}" class="eu row-${en.row||'front'} ${en.boss?'boss':''} ${enemyLib(en.name)&&imgSrc(enemyLib(en.name))?'hasimg':''}" id="u_e${i}" style="--ec:${ECOL[en.elem]}">${enemyArt(en)}<b>${esc(en.name)}</b><div class="hpb"><i></i></div><div class="gg"><i></i></div></div>`).join('')}</div>
    <div class="bt-log" id="bLog"></div>
    <div class="bt-al">${allies.map((u,i)=>`<div class="au row-${u.row||'front'}" id="u_a${i}" style="--ec:${ECOL[u.elem]}"><div class="au-art">${battleCharacterArt(u.c)}</div>${B.engine.formation?`<em class="rg" title="${RANGE[u.range]||''} · ${u.row==='back'?'후열':'전열'}">${RANGE_ICO[u.range]||''}</em>`:''}<div class="meta"><div class="hpb"><i></i></div><div class="shb"><i></i></div></div><button class="skill" data-act="skill" data-i="${i}">${esc(u.kit.ultimate.name)}<small></small><span class="v2-sp" role="progressbar" aria-label="궁극기 SP" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" ><i></i></span></button><small class="v2-active-time" style="display:block;text-align:center;font-size:10px"></small></div>`).join('')}</div>
    <div class="cutin" id="cutin"></div></div>`;
  $('#ov').hidden=false;if(ctx.kind==='practice')v2MountPractice(); v2BattleEvents(B.engine.events); bUpdate(); bRun(); sceneBgm();
}
function bRun(){clearInterval(B.timer);B.timer=setInterval(bTick,230/(B.speed||1));}
/* 공격 연출: 근접(공격형·방어형, 보스, 일부 적)은 카드가 대상 쪽으로 몸통박치기, 원거리(지원형, 나머지 적)는 빛줄기가 날아가요. 연출이 닿을 때 피해 숫자가 떠요 */
function attackFx(a,t){return GGMVFX.basic(a,t);}
const alive=a=>a.filter(u=>u.hp>0);
function bTick(){
  if(!B||B.over||B.paused||B.presentationBusy||B.ending) return;
  v2BattleEvents(GGMCombat.step(B.engine,B.auto)); B.ticks=B.engine.ticks;
  if(B.presentationBusy)return;
  bCheck();
  if(!B)return;
  if(!B.over&&B.engine.winner==='timeout')bEnd(B.ctx.kind==='raid');
  bUpdate();if(B?.ctx.kind==='practice')v2UpdatePractice();
}
function uel(u){return document.getElementById('u_'+(u.side==='a'?'a'+B.allies.indexOf(u):'e'+B.enemies.indexOf(u)));}
let SCUT_MAN=false;
// 컷인 표정: 결의·화남 같은 힘 있는 표정을 먼저, 없으면 아무 표정이나
const CUT_FACES=['결의','화남','의기양양','진지','기합','분노','미소','웃음'];
function cutFace(c){ const fs=facePool(c); if(!fs.length) return ''; const f=CUT_FACES.map(n=>fs.find(x=>x.name===n)).find(Boolean)||fs[0]; return f.name; }
function skillCut(c,name,force,host,onComplete){
 const mode=P().skillCut||'auto',wk=skinOf(c),sc=wk?.scg&&imgSrc(wk.scg)||c?.scg&&imgSrc(c.scg);if(mode==='off'&&!force)return false;
 const big=force||mode==='big'||mode==='auto'&&(SCUT_MAN||!!sc),small=!big;
 host=host||$('#ov > .bt')||document.body;const d=document.createElement('div');d.className='scut'+(small?' v4-small-cut':'')+(host===document.body?' fixed':'');d.style.setProperty('--ec',v2Ensure(c).ultimate.color||'#edf6ff');
 d.innerHTML=`<div class="scut-bg"></div><div class="scut-lines"></div><div class="scut-band">${sc?`<img class="scut-img" src="${esc(sc)}" alt="">`:`<div class="scut-st">${art(c,'',{face:cutFace(c),upper:true})}</div>`}</div><div class="scut-t"><small>${esc(c.name)}</small><b>${esc(name)}</b></div>`;
 host.appendChild(d);GGMVFX.cutIn(d,onComplete);return true;
}

function useSkill(u){
  if(!B||B.over||!B.engine||B.paused||B.presentationBusy||B.ending)return;
  B.engine.events=[];
  if(GGMCombat.cast(B.engine,u,'ultimate')){v2BattleEvents(B.engine.events);bCheck();}
}
/* 전투 진행: 화면 갱신·끝났는지 판정·끝내기 */
function bUpdate(){
  if(!B||B.presentationBusy) return;
  B.enemies.forEach((en,i)=>{const el=$('#u_e'+i);if(!el)return;el.querySelector('.hpb i').style.width=(en.hp/en.maxhp*100)+'%';el.querySelector('.gg i').style.width=Math.min(100,en.g/10)+'%';el.classList.toggle('dead',en.hp<=0);el.classList.toggle('warn',!!en.boss&&en.hp>0&&bossNext(en));el.classList.toggle('focus',en.status.some(s=>s.id==='order'));});
  B.allies.forEach((u,i)=>{const el=$('#u_a'+i);if(!el)return;el.querySelector('.hpb i').style.width=(u.hp/u.maxhp*100)+'%';el.querySelector('.shb i').style.width=Math.min(100,u.sh/u.maxhp*100)+'%';el.classList.toggle('dead',u.hp<=0);
    const b=el.querySelector('.skill'),wait=Math.max(0,u.ready.ultimate-B.engine.time,(u.kit.ultimate.lockout||0)-(B.engine.time-u.lastCast.ultimate)),limited=!!u.kit.ultimate.limit&&u.casts.ultimate>=u.kit.ultimate.limit,blocked=u.status.some(s=>s.type==='stun')||GGMCombat.isSilenced(u,'ultimate'),r=wait<=0&&u.sp>=GGMCombat.SP.max&&u.hp>0&&!blocked&&!limited;b.classList.toggle('ready',r);b.disabled=!r;b.querySelector('small').textContent=u.hp<=0?'전투 불능':limited?'이번 전투 사용 완료':blocked?'행동 제한':r?'궁극기 사용':u.sp<100?'SP '+Math.floor(u.sp)+'/100':`${Math.ceil(wait)}초 후`;const sp=el.querySelector('.v2-sp');if(sp){sp.setAttribute('aria-valuenow',Math.floor(u.sp));sp.querySelector('i').style.width=u.sp+'%';}el.title=u.status.map(s=>GGMCombat.EFFECTS[s.type][0]).join(', ');const at=el.querySelector('.v2-active-time');if(at)at.textContent=u.hp>0?'액티브 · '+(u.kit.active.trigger==='interval'?Math.ceil(Math.max(0,u.ready.active-B.engine.time,(u.kit.active.lockout||0)-(B.engine.time-u.lastCast.active)))+'초 후':['after_basic','on_hit','attack_hit','critical'].includes(u.kit.active.trigger)?(u.counts[u.kit.active.trigger]||0)%Math.round(u.kit.active.triggerEvery)+'/'+Math.round(u.kit.active.triggerEvery)+'회':GGMCombat.TRIGGERS[u.kit.active.trigger]):'';});
  GGMVFX.sync();
}
function bCheck(){
 if(!B||B.over||B.presentationBusy||B.ending)return;
 if(B.engine?.impactJobs.length&&!B.engine.winner)return;
 const win=!alive(B.enemies).length,lose=!alive(B.allies).length;if(!win&&!lose)return;
 const battle=B,delay=Math.max(0,(battle.impactUntil||0)-Date.now());
 if(delay){battle.ending=true;battle.finishTimer=setTimeout(()=>{if(B!==battle||battle.over)return;battle.ending=false;bEnd(win);},delay);}
 else bEnd(win);
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
/* 스테이지 정산(Model): 보상(첫 클리어·재료 던전·이벤트 토큰)·클리어 기록·영입·인연·경험치·별(전원 생존·목표)·첫 ★3 보너스, MVP와 한마디 */
function stageSettle(win){ const s=B.s, kind=B.ctx.kind; if(!win) return {win:false};
  const p=P(); let r={}, first=false, exp=60;
  if(kind==='farm'){ const f=s.farm; r=farmReward(f.key,f.lv); p.farmClear[s.id]=true; exp=20+20*farmRec(f.lv); }
  else if(kind==='event'){ const ev=G.events.find(e=>e.id===B.ch.eventId); first=!p.cleared[s.id]; r={token:s.reward*(first?2:1),tokenName:ev?ev.token:'토큰'}; if(first) r.gems=100; giveReward(r,ev&&ev.id); r={...r}; p.cleared[s.id]=true; if(first) recruitCheck(B.ch,s); exp=80; }
  else { first=!p.cleared[s.id]; r=first?{gems:s.reward*2,gold:3000,exp:10}:{gold:1500,exp:3}; p.cleared[s.id]=true; if(first){ gateCheck(); recruitCheck(B.ch,s); } exp=120+Math.max(0,G.chapters.filter(ch=>ch.kind==='main').indexOf(B.ch))*40; }
  if(kind!=='event'){ Object.assign(r,rateR(r)); giveReward(r); }
  if(first&&kind!=='farm') newBonds(s);
  B.allies.forEach(u=>{const o=own(u.c.id);if(o)gainExp(o,expR(exp));});
  mark('prog');
  const noDeath=B.allies.every(u=>u.hp>0), fast=s.goal&&GOALS[s.goal.k]?GOALS[s.goal.k].ok(B,s.goal.a):B.ticks<=420, stars=1+(noDeath?1:0)+(fast?1:0);
  p.stars=p.stars||{}; const was=p.stars[s.id]||0; if(stars>was) p.stars[s.id]=stars; let bonus='';
  if(stars===3&&was<3&&kind!=='farm'){ giveReward({gems:50}); bonus=` · 첫 ★3 보너스 ◆50`; }
  const mvp=[...B.allies].sort((a,b)=>(b.dmg||0)-(a.dmg||0))[0], tot=B.allies.reduce((a,u)=>a+(u.dmg||0),0)||1, ml=mvp&&rand((mvp.c.lvLines.length?mvp.c.lvLines:[]).concat(mvp.c.lines));
  return {win:true,s,kind,r,first,exp,noDeath,fast,stars,bonus,mvp,tot,ml}; }
/* 스테이지 결과(View): 별·조건·MVP·피해 막대·보상, 실패면 다시 도전 */
function stageResultHTML(R){ if(!R.win) return `<h2 class="disp" style="color:#ff5277">작전 실패</h2><p>${T('enhance')}로 레벨을 올리거나 편성과 속성을 바꿔 보세요.<br>${esc(elemLine())}.</p><div class="row"><button class="btn ghost" data-act="bdone">돌아가기</button><button class="btn" data-act="bretry">다시 도전</button></div>`;
  const {s,kind,r,first,exp,noDeath,fast,stars,bonus,mvp,tot,ml}=R;
  return `<div class="rs-stars">${[1,2,3].map(i=>`<span class="${i<=stars?'on':''}" style="animation-delay:${i*0.18}s">★</span>`).join('')}</div>
      <h2 class="disp" style="color:var(--rose);margin:0">${esc(T('ops'))} 성공</h2>
      <div class="rs-cond"><span class="on">✓ 승리</span><span class="${noDeath?'on':''}">${noDeath?'✓':'✗'} 전원 생존</span><span class="${fast?'on':''}">${fast?'✓':'✗'} ${esc(goalText(s.goal))}</span></div>
      ${mvp?`<div class="rs-mvp"><div class="rs-art">${art(mvp.c)}</div><div class="rs-mt"><i>MVP</i><b>${esc(mvp.name)}</b>${ml?`<span>“${esc(sub(ml))}”</span>`:''}</div></div>
      <div class="rs-dmg">${B.allies.map(u=>`<div><b>${esc(u.name)}</b><span class="bar"><i style="width:${Math.round((u.dmg||0)/tot*100)}%"></i></span><em>${nf(u.dmg||0)}</em></div>`).join('')}</div>`:''}
      <p style="margin:4px 0">${rewardText(r)}${first?' (첫 클리어 보상)':(kind==='farm'?'':`<br><small class="muted">${esc(T('currency'))}은(는) 첫 클리어 때만 받아요</small>`)}${bonus}<br>참가 ${T('crew')} 경험치 +${exp}</p><button class="btn" data-act="bdone" data-win="1" data-first="${first?1:0}">계속</button>`; }
/* 전투 결과 창 붙이기(View) — 전투 화면(기본) 또는 카드 전투 화면 */
function bResultShow(html,host='#ov > .bt'){ const d=document.createElement('div'); d.className='result'; d.innerHTML=html; $(host).appendChild(d); }
/* 전투 배속 단추 표시(View) */
function bSpeedShow(t){ t.textContent=B.speed+'x'; chipOn(t,B.speed>1); }
