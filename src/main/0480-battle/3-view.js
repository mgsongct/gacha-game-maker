/* ===== 0480-battle — View(HTML·DOM을 만듦) ===== */
/* src/main/0480-battle/0180-ui-scroll.js에서 옮김 */
function farmHTML(){
  const p=P(), top4=G.chars.filter(c=>own(c.id)).map(c=>own(c.id).lv||1).sort((a,b)=>b-a).slice(0,4), topLv=top4.length?Math.round(top4.reduce((a,b)=>a+b,0)/top4.length):1;
  return `${pageHead(T('farm'),'TRAINING','lobby')}<p class="muted">반복해서 재료를 모으는 곳이에요. 단계마다 권장 레벨이 있고, 높은 단계일수록 보상이 커요. 한 번 깬 단계는 소탕으로 바로 보상을 받을 수 있어요. 보유: ${rewardText({exp:p.mat.exp,wmat:p.mat.wmat,core:p.mat.core,gold:p.gold})}</p>
  ${G.meta.farms.map(f=>`<h3 class="sec">${esc(f.name)}</h3>${Array.from({length:FARM_N},(_,k)=>k+1).map(lv=>{const id=`farm_${f.key}_${lv}`, rec=farmRec(lv), low=topLv<rec,cl=!!p.farmClear[id],open=lv===1||!!p.farmClear[`farm_${f.key}_${lv-1}`];
    return `<div class="stage ${cl?'clear':''} ${open?'':'lock'}"><span class="code">${lv}</span><span class="t"><b>${lv}단계 <small class="${low?'farm-low':'muted'}">권장 Lv.${rec}</small></b><span class="st">${rewardText(farmReward(f.key,lv))}</span></span>${open?`<button class="btn sm ghost" data-act="farmgo" data-k="${f.key}" data-lv="${lv}">출격</button>`:''}${cl?`<button class="btn sm" data-act="sweep" data-k="${f.key}" data-lv="${lv}">소탕</button><button class="btn sm ghost" data-act="sweep" data-k="${f.key}" data-lv="${lv}" data-n="5">×5</button>`:''}</div>`;}).join('')}`).join('')}`;
}
/* src/main/0480-battle/0480-battle.js에서 옮김 */
// 전투 없는 이야기 스테이지: 대본만 보고 클리어해요
function openStoryStage(ch,s){ const cl=!!P().cleared[s.id], code=ch.kind==='event'?'EV'+(ch.stages.indexOf(s)+1):stageCode(s.id);
  openModal(`${head(esc(code+' '+s.title),'<span class="muted">STORY · 전투 없는 이야기</span>')}
    <div class="ststory" style="${bgStyle(stageBg(s)||ch.title)}"><span>📖</span></div>
    <p class="muted" style="margin:8px 0">${cl?'다시 볼 수 있어요.':'이야기를 끝까지 보면 클리어돼요. 첫 클리어 보상: '+(ch.kind==='event'?esc(((G.events.find(ev=>ev.id===ch.eventId)||{}).token)||'토큰')+' '+s.reward*2:'◆'+s.reward)}</p>
    <div class="row"><button class="btn" data-act="ststory" data-ch="${ch.id}" data-st="${s.id}">${cl?'다시 보기':'이야기 보기'}</button><button class="btn ghost" data-act="chedit" data-ch="${ch.id}">스토리 편집</button></div>`); }
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
function uel(u){return document.getElementById('u_'+(u.side==='a'?'a'+B.allies.indexOf(u):'e'+B.enemies.indexOf(u)));}
function skillCut(c,name,force,host,onComplete){
 const mode=P().skillCut||'auto',wk=skinOf(c),sc=wk?.scg&&imgSrc(wk.scg)||c?.scg&&imgSrc(c.scg);if(mode==='off'&&!force)return false;
 const big=force||mode==='big'||mode==='auto'&&(SCUT_MAN||!!sc),small=!big;
 host=host||$('#ov > .bt')||document.body;const d=document.createElement('div');d.className='scut'+(small?' v4-small-cut':'')+(host===document.body?' fixed':'');d.style.setProperty('--ec',v2Ensure(c).ultimate.color||'#edf6ff');
 d.innerHTML=`<div class="scut-bg"></div><div class="scut-lines"></div><div class="scut-band">${sc?`<img class="scut-img" src="${esc(sc)}" alt="">`:`<div class="scut-st">${art(c,'',{face:cutFace(c),upper:true})}</div>`}</div><div class="scut-t"><small>${esc(c.name)}</small><b>${esc(name)}</b></div>`;
 host.appendChild(d);GGMVFX.cutIn(d,onComplete);return true;
}
/* 전투 진행: 화면 갱신·끝났는지 판정·끝내기 */
function bUpdate(){
  if(!B||B.presentationBusy) return;
  B.enemies.forEach((en,i)=>{const el=$('#u_e'+i);if(!el)return;el.querySelector('.hpb i').style.width=(en.hp/en.maxhp*100)+'%';el.querySelector('.gg i').style.width=Math.min(100,en.g/10)+'%';el.classList.toggle('dead',en.hp<=0);el.classList.toggle('warn',!!en.boss&&en.hp>0&&bossNext(en));el.classList.toggle('focus',en.status.some(s=>s.id==='order'));});
  B.allies.forEach((u,i)=>{const el=$('#u_a'+i);if(!el)return;el.querySelector('.hpb i').style.width=(u.hp/u.maxhp*100)+'%';el.querySelector('.shb i').style.width=Math.min(100,u.sh/u.maxhp*100)+'%';el.classList.toggle('dead',u.hp<=0);
    const b=el.querySelector('.skill'),wait=Math.max(0,u.ready.ultimate-B.engine.time,(u.kit.ultimate.lockout||0)-(B.engine.time-u.lastCast.ultimate)),limited=!!u.kit.ultimate.limit&&u.casts.ultimate>=u.kit.ultimate.limit,blocked=u.status.some(s=>s.type==='stun')||GGMCombat.isSilenced(u,'ultimate'),r=wait<=0&&u.sp>=GGMCombat.SP.max&&u.hp>0&&!blocked&&!limited;b.classList.toggle('ready',r);b.disabled=!r;b.querySelector('small').textContent=u.hp<=0?'전투 불능':limited?'이번 전투 사용 완료':blocked?'행동 제한':r?'궁극기 사용':u.sp<100?'SP '+Math.floor(u.sp)+'/100':`${Math.ceil(wait)}초 후`;const sp=el.querySelector('.v2-sp');if(sp){sp.setAttribute('aria-valuenow',Math.floor(u.sp));sp.querySelector('i').style.width=u.sp+'%';}el.title=u.status.map(s=>GGMCombat.EFFECTS[s.type][0]).join(', ');const at=el.querySelector('.v2-active-time');if(at)at.textContent=u.hp>0?'액티브 · '+(u.kit.active.trigger==='interval'?Math.ceil(Math.max(0,u.ready.active-B.engine.time,(u.kit.active.lockout||0)-(B.engine.time-u.lastCast.active)))+'초 후':['after_basic','on_hit','attack_hit','critical'].includes(u.kit.active.trigger)?(u.counts[u.kit.active.trigger]||0)%Math.round(u.kit.active.triggerEvery)+'/'+Math.round(u.kit.active.triggerEvery)+'회':GGMCombat.TRIGGERS[u.kit.active.trigger]):'';});
  GGMVFX.sync();
}
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
/* src/main/0480-battle/0485-battle-rules.js에서 옮김 */
function rulesHTML(s){ const f=fieldText(s.field); return `<div class="panel" style="padding:8px;margin:6px 0;font-size:.82rem">${f?`<div><b>전장 규칙</b> ${esc(f)}</div>`:''}<div><b>별 조건</b> 승리 · 전원 생존 · ${esc(goalText(s.goal))}</div></div>`; }
// 집중 지시
function bFocus(i){ if(!B||B.over||!B.engine) return; const u=B.enemies[i], t=B.engine.time; if(!u||u.hp<=0) return; if(t<(B.focusReady||0)){ toast(`집중 지시는 ${Math.ceil(B.focusReady-t)}초 뒤에 다시 쓸 수 있어요`); return; }
  B.enemies.forEach(en=>{ en.status=en.status.filter(s=>s.id!=='order'); }); u.status.push({id:'order',type:'focus',value:1,until:t+8,next:Infinity,source:null,slot:'order',remaining:1,hpRemain:1});
  B.focusReady=t+12; blog(`집중 공격 지시: ${u.name}`); bUpdate(); }
/* src/main/0480-battle/0487-formation-sortie.js에서 옮김 */
function sortieMap(msg){ const x=sortieParts(); if(!x) return; const {run,s,R}=x, cur=nodeById(R,run.node), done=new Set(run.path), sq=run.squad.map(charById).filter(Boolean);
  const nodeBtn=n=>{ const here=n.id===run.node, past=done.has(n.id); return `<div class="so-node k-${n.kind} ${here?'here':''} ${past?'past':''}"><b>${{battle:'⚔',elite:'☠',supply:'⛺',boss:'♛'}[n.kind]||'●'} ${esc(n.name)}</b>${n.hint?`<span>${esc(n.hint)}</span>`:''}</div>`; };
  const cols=[[nodeById(R,'n1')],[nodeById(R,'n2a'),nodeById(R,'n2b')],[nodeById(R,'n3')]];
  openModal(`${head(esc(s.title),'<span class="muted">출격 경로 · 체력이 이어져요</span>')}${msg?`<p class="so-msg">${esc(msg)}</p>`:''}
  <div class="so-map">${cols.map(c=>`<div class="so-col">${c.map(nodeBtn).join('')}</div>`).join('<i class="so-arrow">›</i>')}</div>
  <div class="so-sq">${sq.map(c=>{ const h=run.hp[c.id]??1; return `<div class="so-u ${h<=0?'down':h<.25?'crit':''}"><b>${esc(c.name)}</b><span class="hpb"><i style="width:${Math.round(Math.max(0,h)*100)}%"></i></span><small>${RANGE_ICO[charRange(c)]} ${h<=0?'전투 불능':h<.25?'대파':Math.round(h*100)+'%'}</small></div>`; }).join('')}</div>
  ${sortieChoices(x)}`); }
function sortieChoices(x){ const {run,R}=x, cur=nodeById(R,run.node), sq=run.squad.map(charById).filter(Boolean), crit=sq.filter(c=>(run.hp[c.id]??1)>0&&(run.hp[c.id]??1)<.25).length;
  if(!run.path.includes(cur.id)) return `<div class="row" style="margin-top:10px;gap:6px"><button class="btn" data-act="sogo">${cur.kind==='supply'?'보급 받기':cur.kind==='boss'?'보스전 시작':'전투 시작'}</button><button class="btn ghost" data-act="soretreat">퇴각</button></div>`;
  const next=(cur.next||[]).map(id=>nodeById(R,id)); const ok=n=>!n.need||sq.some(c=>c.role===n.need.role&&(run.hp[c.id]??1)>0);
  return `${next.length>1?`<p class="muted" style="margin:8px 0 4px">${esc(R.fork)} — 어느 길로 갈까요?</p>`:''}<div class="row" style="margin-top:6px;gap:6px;flex-wrap:wrap">${next.map(n=>`<button class="btn ${n.kind==='boss'?'':'ghost'}" data-act="sonext" data-v="${n.id}" ${ok(n)?'':'disabled'}>진격 → ${esc(n.name)}</button>`).join('')}<button class="btn ghost" data-act="soretreat">퇴각</button></div>${crit?`<p class="so-warn">대파(체력 25% 미만) ${crit}명 — 진격하면 위험해요</p>`:''}`; }
/* 출격 지점 결과(View) */
function sortieNodeResultHTML(R){ return R.win?`<h2 class="disp" style="color:var(--rose);margin:0">${esc(R.name)} 돌파</h2><p>${rewardText(R.g)} · 경험치 +${R.xp}</p><button class="btn" data-act="somap">경로로</button>`
  :`<h2 class="disp" style="color:#ff5277">작전 실패</h2><p>${esc(R.name)}에서 밀려났어요. 편성·대열을 바꿔 다시 출격하세요.</p><button class="btn" data-act="bdone">계속</button>`; }
function battleSysPanel(){ const r=G.meta.rules||{}; return `<div class="panel pm-hide"><h3>전투 체계</h3><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-act="bsys" data-k="formation" ${formOn()?'checked':''}>대열 (근접·원거리·지원, 전열이 후열을 지킴)</label><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-act="bsys" data-k="sortie" ${sortieOn()?'checked':''}>출격 경로 (지점마다 진격·퇴각, 갈림길, 체력 유지)</label><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-act="bsmode" data-k="debate" ${modesCfg().debate?'checked':''}>회담 스테이지 (주장·증거·설득) — 새 스토리 생성에 섞기</label><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-act="bsmode" data-k="contest" ${modesCfg().contest?'checked':''}>콘테스트 스테이지 (매력 어필) — 새 스토리 생성에 섞기</label></div>`; }
