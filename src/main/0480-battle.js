/* =========================================================
   전투
   ========================================================= */
let B=null;
function stageBg(s){const L=parseScript(s.pre).find(l=>(l.type==='cmd'&&l.cmd==='배경')||l.type==='place');return L?(L.arg||L.text):'';}
// 전투 없는 이야기 스테이지: 대본만 보고 클리어해요
function openStoryStage(ch,s){ const cl=!!P().cleared[s.id], code=ch.kind==='event'?'EV'+(ch.stages.indexOf(s)+1):stageCode(s.id);
  openModal(`${head(esc(code+' '+s.title),'<span class="muted">STORY · 전투 없는 이야기</span>')}
    <div class="ststory" style="${bgStyle(stageBg(s)||ch.title)}"><span>📖</span></div>
    <p class="muted" style="margin:8px 0">${cl?'다시 볼 수 있어요.':'이야기를 끝까지 보면 클리어돼요. 첫 클리어 보상: '+(ch.kind==='event'?esc(((G.events.find(e=>e.id===ch.eventId)||{}).token)||'토큰')+' '+s.reward*2:'◆'+s.reward)}</p>
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
  const enemies=s.enemies.map(e=>({side:'e',name:e.name,elem:e.elem,role:e.role,boss:e.boss,maxhp:e.hp,hp:e.hp,baseHp:e.hp,atk:e.atk,def:e.def,spd:e.spd,g:Math.random()*400,turns:0,sh:0,mul:1,pattern:e.pattern,skills:e.skills}));
  if(ctx.prep) ctx.prep(allies,enemies);
  fieldApply(s,allies,enemies); // 전장 규칙(0485)
  B={ch:ctx.ch||null,ctx,s,allies,enemies,auto:true,speed:[1,2,3].includes(P().settings.bspeed)?P().settings.bspeed:1,timer:null,over:false,log:[],ticks:0};
  B.engine=GGMCombat.create(allies,enemies,{...v2Options(),timedImpacts:true,externalImpacts:true,seed:ctx.kind==='practice'?77:Math.floor(Math.random()*0xffffffff),maxTime:fieldTime(s)||119,practice:ctx.kind==='practice'});
  if(Object.keys(fbon).length) setTimeout(()=>B&&blog(Object.entries(fbon).map(([f,v])=>`${f} 소속 보너스 공격 +${v}%`).join(', ')),300);
  $('#ov').innerHTML=`<div class="bt"><div class="bt-bg" style="${bgStyle(stageBg(s)||'폐선로')}"></div>
    <div class="bt-top"><span class="ttl"><i>${ctx.kind==='practice'?'PRACTICE':ctx.kind==='farm'?'TRAINING':ctx.kind==='event'?'EVENT':ctx.kind==='raid'?'RAID · '+Math.ceil(RAID_TICKS*GGMCombat.DT)+'s':ctx.kind==='rogue'?'EXPEDITION':'OPERATION'}</i>${esc(s.title)}</span><button data-act="bauto" class="on">필살 자동</button><button data-act="bspeed" class="${(P().settings.bspeed||1)>1?'on':''}">${[1,2,3].includes(P().settings.bspeed)?P().settings.bspeed:1}x</button><button data-act="bquit">${ctx.kind==='practice'?'연습 종료':'후퇴'}</button></div>
    <div class="bt-en">${enemies.map((u,i)=>`<div data-act="bfocus" data-i="${i}" class="eu row-${u.row||'front'} ${u.boss?'boss':''} ${enemyLib(u.name)&&imgSrc(enemyLib(u.name))?'hasimg':''}" id="u_e${i}" style="--ec:${ECOL[u.elem]}">${enemyArt(u)}<b>${esc(u.name)}</b><div class="hpb"><i></i></div><div class="gg"><i></i></div></div>`).join('')}</div>
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
function pop(u,t,cls=''){const e=uel(u);if(!e)return;const d=document.createElement('span');d.className='dmg '+cls;d.textContent=t;e.appendChild(d);setTimeout(()=>d.remove(),700);}
function blog(t){B.log.push(t);if(B.log.length>6)B.log.shift();const l=$('#bLog');if(l)l.innerHTML=B.log.map(x=>`<div>${esc(x)}</div>`).join('');}
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
