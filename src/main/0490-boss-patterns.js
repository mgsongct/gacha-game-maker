/* ===== 보스 패턴 ===== */
const BPATS={aoe:['광역 포격','7초마다 전원 공격',7],snipe:['집중 저격','7초마다 체력 비율이 낮은 대상 공격',7],charge:['강타','7초마다 전원 강타',7],drain:['흡혈','7초마다 피해의 30% 회복',7],barrier:['방벽','7초마다 보호막',7],curse:['저주','7초마다 적 전체 공격력 감소',7],shift:['방어 약화','7초마다 적 전체 방어력 감소',7]};
const BPAT_KEYS=Object.keys(BPATS);
function bossPats(e,raid){return GGMCombat.enemyPatterns(e);}
function bossPatText(e,raid){ return bossPats(e,raid).map(k=>BPATS[k][0]).join(' · ')+' · 체력 40% 이하 광폭화 (15초 / 재사용 30초)'; }
function bossShake(){ const bt=$('#ov > .bt'); if(bt){ bt.classList.remove('shake'); void bt.offsetWidth; bt.classList.add('shake'); } }
function bossNext(u){return B&&B.engine&&u.ready&&u.ready.active-B.engine.time<=1;}
function bUpdate(){
  if(!B||B.presentationBusy) return;
  B.enemies.forEach((u,i)=>{const e=$('#u_e'+i);if(!e)return;e.querySelector('.hpb i').style.width=(u.hp/u.maxhp*100)+'%';e.querySelector('.gg i').style.width=Math.min(100,u.g/10)+'%';e.classList.toggle('dead',u.hp<=0);e.classList.toggle('warn',!!u.boss&&u.hp>0&&bossNext(u));e.classList.toggle('focus',u.status.some(s=>s.id==='order'));});
  B.allies.forEach((u,i)=>{const e=$('#u_a'+i);if(!e)return;e.querySelector('.hpb i').style.width=(u.hp/u.maxhp*100)+'%';e.querySelector('.shb i').style.width=Math.min(100,u.sh/u.maxhp*100)+'%';e.classList.toggle('dead',u.hp<=0);
    const b=e.querySelector('.skill'),wait=Math.max(0,u.ready.ultimate-B.engine.time,(u.kit.ultimate.lockout||0)-(B.engine.time-u.lastCast.ultimate)),limited=!!u.kit.ultimate.limit&&u.casts.ultimate>=u.kit.ultimate.limit,blocked=u.status.some(s=>s.type==='stun')||GGMCombat.isSilenced(u,'ultimate'),r=wait<=0&&u.sp>=GGMCombat.SP.max&&u.hp>0&&!blocked&&!limited;b.classList.toggle('ready',r);b.disabled=!r;b.querySelector('small').textContent=u.hp<=0?'전투 불능':limited?'이번 전투 사용 완료':blocked?'행동 제한':r?'궁극기 사용':u.sp<100?'SP '+Math.floor(u.sp)+'/100':`${Math.ceil(wait)}초 후`;const sp=e.querySelector('.v2-sp');if(sp){sp.setAttribute('aria-valuenow',Math.floor(u.sp));sp.querySelector('i').style.width=u.sp+'%';}e.title=u.status.map(s=>GGMCombat.EFFECTS[s.type][0]).join(', ');const at=e.querySelector('.v2-active-time');if(at)at.textContent=u.hp>0?'액티브 · '+(u.kit.active.trigger==='interval'?Math.ceil(Math.max(0,u.ready.active-B.engine.time,(u.kit.active.lockout||0)-(B.engine.time-u.lastCast.active)))+'초 후':['after_basic','on_hit','attack_hit','critical'].includes(u.kit.active.trigger)?(u.counts[u.kit.active.trigger]||0)%Math.round(u.kit.active.triggerEvery)+'/'+Math.round(u.kit.active.triggerEvery)+'회':GGMCombat.TRIGGERS[u.kit.active.trigger]):'';});
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
function bEnd(win){
  if(B.ctx.kind==='practice'){v2StopPractice();return;}
  B.over=true; clearInterval(B.timer); try{ window.GGMVFX&&GGMVFX.clear(); }catch(e){} bUpdate(); bump('battle'); // 공격 중이던 카드·이펙트가 결과 화면 위에 남지 않게
  if(B.ctx.kind==='raid'||B.ctx.kind==='rogue'||B.ctx.kind==='tower'){ const html=B.ctx.kind==='raid'?raidEnd(win):B.ctx.kind==='tower'?towerEnd(win):rogueEnd(win); const d=document.createElement('div');d.className='result';d.innerHTML=html;$('#ov > .bt').appendChild(d); return; }
  const s=B.s, kind=B.ctx.kind; let html;
  if(win){
    sfx('승리'); const p=P(); let r={}, first=false, exp=60, note='';
    if(kind==='farm'){ const f=s.farm; r=farmReward(f.key,f.lv); p.farmClear[s.id]=true; exp=20+20*farmRec(f.lv); }
    else if(kind==='event'){ const ev=G.events.find(e=>e.id===B.ch.eventId); first=!p.cleared[s.id]; r={token:s.reward*(first?2:1),tokenName:ev?ev.token:'토큰'}; if(first) r.gems=100; giveReward(r,ev&&ev.id); r={...r}; p.cleared[s.id]=true; if(first) recruitCheck(B.ch,s); exp=80; }
    else { first=!p.cleared[s.id]; r=first?{gems:s.reward*2,gold:3000,exp:10}:{gold:1500,exp:3}; p.cleared[s.id]=true; if(first){ gateCheck(); recruitCheck(B.ch,s); } exp=120+Math.max(0,G.chapters.filter(c=>c.kind==='main').indexOf(B.ch))*40; }
    if(kind!=='event'){ Object.assign(r,rateR(r)); giveReward(r); }
    if(first&&kind!=='farm') newBonds(s);
    B.allies.forEach(u=>{const o=own(u.c.id);if(o)gainExp(o,expR(exp));});
    mark('prog');
    const noDeath=B.allies.every(u=>u.hp>0), fast=s.goal&&GOALS[s.goal.k]?GOALS[s.goal.k].ok(B,s.goal.a):B.ticks<=420, stars=1+(noDeath?1:0)+(fast?1:0);
    p.stars=p.stars||{}; const was=p.stars[s.id]||0; if(stars>was) p.stars[s.id]=stars; let bonus='';
    if(stars===3&&was<3&&kind!=='farm'){ p.gems+=50; bonus=` · 첫 ★3 보너스 ◆50`; }
    const mvp=[...B.allies].sort((a,b)=>(b.dmg||0)-(a.dmg||0))[0], tot=B.allies.reduce((a,u)=>a+(u.dmg||0),0)||1, ml=mvp&&rand((mvp.c.lvLines.length?mvp.c.lvLines:[]).concat(mvp.c.lines));
    html=`<div class="rs-stars">${[1,2,3].map(i=>`<span class="${i<=stars?'on':''}" style="animation-delay:${i*0.18}s">★</span>`).join('')}</div>
      <h2 class="disp" style="color:var(--rose);margin:0">${esc(T('ops'))} 성공</h2>
      <div class="rs-cond"><span class="on">✓ 승리</span><span class="${noDeath?'on':''}">${noDeath?'✓':'✗'} 전원 생존</span><span class="${fast?'on':''}">${fast?'✓':'✗'} ${esc(goalText(s.goal))}</span></div>
      ${mvp?`<div class="rs-mvp"><div class="rs-art">${art(mvp.c)}</div><div class="rs-mt"><i>MVP</i><b>${esc(mvp.name)}</b>${ml?`<span>“${esc(sub(ml))}”</span>`:''}</div></div>
      <div class="rs-dmg">${B.allies.map(u=>`<div><b>${esc(u.name)}</b><span class="bar"><i style="width:${Math.round((u.dmg||0)/tot*100)}%"></i></span><em>${nf(u.dmg||0)}</em></div>`).join('')}</div>`:''}
      <p style="margin:4px 0">${rewardText(r)}${first?' (첫 클리어 보상)':(kind==='farm'?'':`<br><small class="muted">${esc(T('currency'))}은(는) 첫 클리어 때만 받아요</small>`)}${bonus}<br>참가 ${T('crew')} 경험치 +${exp}</p><button class="btn" data-act="bdone" data-win="1" data-first="${first?1:0}">계속</button>`;
    if(mvp&&mvp.c.voiceId&&SND().voiceLobby&&ml) setTimeout(()=>speak(mvp.c,ml),700);
  } else { sfx('패배'); html=`<h2 class="disp" style="color:#ff5277">작전 실패</h2><p>${T('enhance')}로 레벨을 올리거나 편성과 속성을 바꿔 보세요.<br>${ELEMS.map((e,i)=>e+'은 '+ELEMS[(i+1)%3]+'에').join(', ')} 강해요.</p><div class="row"><button class="btn ghost" data-act="bdone">돌아가기</button><button class="btn" data-act="bretry">다시 도전</button></div>`; }
  const d=document.createElement('div');d.className='result';d.innerHTML=html;$('#ov > .bt').appendChild(d);
}
// 훈련: 10단계, 단계마다 권장 레벨이 있어요(그 레벨 대원의 능력치에 맞춰 적이 강해져요)
const FARM_LV=[1,5,10,15,20,30,40,50,60,70], FARM_N=FARM_LV.length;
const FARM_RW={exp:[10,20,35,55,80,110,150,200,260,330],gold:[4000,7000,11000,16000,22000,30000,40000,52000,66000,82000],wmat:[5,9,14,20,28,38,50,64,80,100],core:[1,1,2,2,3,4,5,6,7,8]};
function farmReward(key,lv){ const m=seasonIs('train')?2:1, i=Math.max(0,Math.min(FARM_N-1,lv-1)); return key==='exp'?{exp:FARM_RW.exp[i]*m}:key==='gold'?{gold:FARM_RW.gold[i]*m}:key==='wmat'?{wmat:FARM_RW.wmat[i]*m}:{core:FARM_RW.core[i]*m}; }
function farmRec(lv){ return FARM_LV[Math.max(0,Math.min(FARM_N-1,lv-1))]; }
function farmStage(key,lv){
  const f=G.meta.farms.find(x=>x.key===key)||{name:key}, rec=farmRec(lv), m=(1+0.06*(rec-1))*(1+0.04*lv);
  const e=(n,i,boss)=>({name:n,elem:ELEMS[(lv+i)%ELEMS.length],hp:Math.round(950*m*(boss?3:1)),atk:Math.round(82*m*(boss?1.2:1)),def:Math.round(32*m),spd:92+lv*2,boss:!!boss});
  const en=[e('훈련 표적',0),e('훈련 표적',1)]; if(lv>=3) en.push(e('강화 표적',2)); if(lv>=6) en.push(e('훈련 교관',0,true));
  // 권장 레벨 대원 4명의 전투력보다 조금 낮게 맞춰요(10레벨 낮으면 버거워요)
  const lm=1+0.06*(rec-1), up=c=>{ const r=RMUL[c.rarity]||1; return unitPower({hp:(+c.hp||1150)*r*lm,atk:(+c.atk||130)*r*lm,def:(+c.def||60)*r*lm,spd:+c.spd||100}); };
  const top=(G.chars.length?G.chars.map(up):[up({})]).sort((a,b)=>b-a).slice(0,4); while(top.length<4) top.push(top[top.length-1]);
  const ref=top.reduce((a,b)=>a+b,0)/1.12;
  for(let k=0;k<2;k++){ const f=ref/stagePower({enemies:en}); en.forEach(x=>{ x.hp=Math.round(x.hp*f); x.atk=Math.round(x.atk*f); x.def=Math.round(x.def*f); }); }
  return {id:`farm_${key}_${lv}`,title:`${f.name} ${lv}단계 (권장 Lv.${rec})`,enemies:en,reward:0,pre:'',post:'',farm:{key,lv}};
}

