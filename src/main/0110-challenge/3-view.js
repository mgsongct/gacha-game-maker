/* ===== 0110-challenge — View(HTML·DOM을 만듦) ===== */
/* src/main/0110-challenge/0110-challenge-raid.js에서 옮김 */
/* 레이드 결과(View) */
function raidResultHTML(R){ return `<h2 class="disp" style="color:var(--rose);margin:0">${R.killed?'토벌 완료!':'레이드 종료'}</h2><div class="rd-big">${nf(R.dealt)}<small>이번 피해</small></div>
    <div class="rd-bar"><i style="width:${Math.min(100,R.ratio*100)}%"></i><span>${Math.min(100,Math.floor(R.ratio*1000)/10)}%</span></div>
    <p style="margin:6px 0">${Object.keys(R.got).length?'달성 보상: '+rewardText(R.got):'다음 보상까지 '+(R.next!=null?Math.ceil((R.next-R.ratio)*100)+'%':'—')}<br>참가 ${T('crew')} 경험치 +80</p>
    <button class="btn" data-act="bdone">계속</button>`; }
/* src/main/0110-challenge/0120-abyss.js에서 옮김 */
function pixFill(){ document.querySelectorAll('img[data-pix]:not([src])').forEach(el=>{ const c=charById(el.dataset.pix); if(!c) return; pixSprite(c).then(u=>{ if(u){ el.src=u; el.parentNode&&el.parentNode.classList.add('has'); } }); }); }
function cardTxt(cd,u){ const df=CARD_DEF[cd.k]||CARD_DEF.strike, m=cd.up?df.mu:df.m, c=charById(cd.o);
  if(cd.k==='skill'){ const k=c.skill.kind, pw=c.skill.power*(cd.up?df.mu:1); if(!u) return SK_TXT[k]+` (×${(Math.round(pw*10)/10)})`; const v=cbSkillVal(u,c.skill,pw); return k==='dmg'?`적 1명에게 ${nf(v)} 피해`:k==='aoe'?`모든 적에게 ${nf(v)} 피해`:k==='heal'?`리더 체력 ${nf(v)} 회복`:k==='shield'?`보호막 ${nf(v)}`:`이번 전투 공격 +${Math.round(v*100)}%`; }
  if(!u){ const fx={rage:`최대 체력 ${Math.round(9*m)}%`,release:`공격력 ×${m}`,burnout:`공격력 ×${m}`,flurry:`공격력 ×${m}`,strike:`공격력 ×${m}`,guard:`최대 체력 ${Math.round(9*m)}%`,twin:`공격력 ×${m}`,taunt:`최대 체력 ${Math.round(9*m)}%`,heavy:`공격력 ×${m}`,sweep:`공격력 ×${m}`,wall:`최대 체력 ${Math.round(9*m)}%`,aid:`최대 체력 ${Math.round(12*m)}%`,combo:`공격력 ×${m}`,slash:`공격력 ×${m}`,brand:`공격력 ×${m}`,finisher:`공격력 ×${m}`,bleed:`공격력 ×${m}`,bulwark:`최대 체력 ${Math.round(9*m)}%`,counter:`최대 체력 ${Math.round(9*m)}%`}; return df.d(fx[cd.k]!=null?fx[cd.k]:m,cd); }
  if(cd.k==='shieldbash') return CB?`지금 보호막의 ${Math.round(m*100)}% → 적 1명에게 ${nf(Math.round(CB.block*m))} 피해`:df.d(m,cd);
  if(cd.k==='rage') return df.d(nf(cbBlk(CB?cbLead():u,m)),cd);
  if(cd.k==='release') return df.d(nf(cbAtkVal(u,m)),cd)+(CB&&CB.charge?` <b>(지금 ×${1+CB.charge})</b>`:'');
  if(df.t==='atk') return df.d(nf(cbAtkVal(u,m)),cd);
  if(['guard','taunt','wall','bulwark','counter'].includes(cd.k)) return df.d(nf(cbBlk(u,m)),cd);
  if(cd.k==='aid') return df.d(nf(Math.round(u.maxhp*0.12*m)),cd);
  return df.d(m,cd); }
// 카드 그림: 카드 일러스트 → 상반신 → 전신(위쪽) → 없으면 그림 없이
function cardArtHTML(cd){ const c=charById(cd.o), o=cardIllObj(cd); if(o) return `<img class="art ill" src="${esc(imgSrc(o))}" alt="" draggable="false">`; if(!c) return '';
  const k=skinOf(c), up=(k&&k.upper&&imgSrc(k.upper))||(c.upper&&imgSrc(c.upper)); if(up) return `<img class="art up" src="${esc(up)}" alt="" draggable="false">`;
  const st=charSrc(c); return st?`<img class="art st" src="${esc(st)}" alt="" draggable="false">`:''; }
function cardHTML(cd,opt){ opt=opt||{}; const c=charById(cd.o), u=opt.u, ty=cardType(cd), df=CARD_DEF[cd.k]||CARD_DEF.strike;
  return `<button class="cd t-${ty} ${cd.up?'up':''} ${opt.cls||''}" ${opt.act?`data-act="${opt.act}" data-i="${opt.i}"`:''} ${opt.dis?'disabled':''} style="--ec:${c?ECOL[c.elem]:'var(--rose)'};${opt.sty||''}"><em class="cost">${cardCost(cd)}</em><div class="cd-art">${cardArtHTML(cd)}</div><div class="cd-tx"><b>${esc(cardName(cd))}</b><span>${cardTxt(cd,u)}</span><small>${esc(c?c.name:'')}${df.x?' · 소멸':''}</small></div></button>`; }
function cbStart(kind){ const run=progRead('rogue').run; const en=rgEnemies({k:run.k,floor:rgEq(run,kind)},kind);
  const units=rgUnits(run,run.squad), L=units[0]; L.maxhp=Math.round(L.maxhp*2.2); const fr=run.hp[L.c.id]; L.hp=Math.round(L.maxhp*(fr==null?1:fr));
  const bs=run.squad.map(charById).filter(Boolean).map(stats), avg=k=>bs.reduce((s,x)=>s+x[k],0)/Math.max(1,bs.length);
  // 적의 세기는 리더를 기준으로 정해요(체력 = 리더 공격 몇 번, 공격 = 리더 최대 체력 몇 %). 층이 깊을수록 강해지고, 탐사대가 강하면 조금만 약해져요.
  const R=Math.min(2,Math.max(0.5,teamPower(run.squad)/Math.max(1,stagePower({enemies:en})))), q=Math.pow(R,-0.3), A=L.atk, HL=L.maxhp, tt=Math.max(0,Math.min(1,(rgEq(run,kind)-1)/(RG_FLOORS-1)));
  const many=en.length>=3?0.8:1;
  const HK={battle:[(5.5+4.5*tt)*many,(5.5+4.5*tt)*many],elite:[16+10*tt,5+2.5*tt],boss:[44,8]}[kind], PK={battle:[0.07+0.04*tt,0.07+0.04*tt],elite:[0.11+0.05*tt,0.06+0.03*tt],boss:[0.14,0.075]}[kind];
  const enemies=en.map((e,i)=>{ const main=i===0&&kind!=='battle'; return {i,name:e.name,elem:e.elem,boss:!!e.boss,maxhp:Math.round(A*(main?HK[0]:HK[1])*q*(0.92+Math.random()*0.16)),dmg:HL*(main?PK[0]:PK[1])*q,def:e.def,str:1,blk:0,vul:0,mark:0,bleed:0,weak:0,enr:false}; });
  enemies.forEach(e=>e.hp=e.maxhp); if(rgCount('opener')) enemies.forEach(e=>e.mark+=2*rgCount('opener'));
  CB={kind,run,units,allies:[L],enemies,defA:avg('def'),R,str:1,draw:cbShuffle(run.deck.map(x=>Object.assign({},x))),hand:[],disc:[],exh:[],energy:0,block:0,turn:0,tgt:0,taunt:-1,busy:false,over:false,log:[],ult:Math.min(ULT_MAX,2*rgCount('ultcharge')),sel:-1,atkN:0,phoenix:rgCount('phoenix')>0,last:null,charge:3*rgCount('capacitor'),rage:0};
  const title=`B${run.floor} · ${DG_ROOM[kind][1]}`, ab=LEAD_AB[L.role]||LEAD_AB.atk;
  $('#ov').innerHTML=`<div class="cb v3"><div class="bt-bg" style="${bgStyle(P().dgBg||'폐선로')}"></div><div class="cb-dim"></div>
    <div class="bt-top"><span class="ttl"><i>DUNGEON · CARD BATTLE</i>${esc(title)}</span><button data-act="cbdeck">덱</button><button data-act="cbquit">후퇴</button></div>
    <div class="cb-en" id="cbEn"></div><div class="cb-log" id="cbLog"></div>
    <div class="cb-lead" id="cbLead"><div class="cl-art">${art(L.c)}</div><div class="cl-info"><b>${esc(L.name)} <small>리더</small></b><span class="hpb"><i id="clHp"></i></span><span class="cl-n" id="clN"></span><span class="cl-ab" title="${esc(ab[1])}">◆ ${esc(ab[0])} · ${esc(ab[1])}</span><span class="cl-st" id="clSt"></span></div>
      <button class="cl-ult" id="cbUlt" data-act="cbult"><i id="cbUltG"></i><b>필살</b><small>${esc(L.c.skill.name)}</small></button></div>
    <div class="cb-bar"><div class="cb-orb" id="cbOrb"></div><div class="cb-blk" id="cbBlk"></div><span class="cb-pile" id="cbPile"></span><button class="btn sm" data-act="cbend" id="cbEndB">턴 종료</button></div>
    <div class="cb-detail" id="cbDet" hidden></div>
    <div class="cb-hand fan" id="cbHand"></div></div>`;
  $('#ov').hidden=false; sceneBgm(); cbIntents(); cbTurn(true); }
function cbLog(t){ CB.log.push(t); CB.log=CB.log.slice(-3); const el=$('#cbLog'); if(el) el.innerHTML=CB.log.map(x=>`<p>${esc(x)}</p>`).join(''); }
function cbTurn(first){ if(!CB||CB.over) return; const L=cbLead(); CB.turn++; CB.block=CB.retain?Math.floor(CB.block*0.5):0; CB.retain=false; CB.counter=0; CB.taunt=-1; CB.played=0; CB.disc1=false; CB.chainOK=false; CB.firstFree=rgCount('firstfree')>0; CB.last=null; CB.sel=-1;
  CB.energy=3+(first&&rgCount('burst')?1:0);
  if(L.role==='def'){ const b=Math.round(L.maxhp*0.06); CB.block+=b; }
  cbDraw(5+(L.role==='sup'?1:0)+(first?rgCount('spd'):0)); CB.busy=false; cbRender(); }
function cbIntentHTML(e){ const it=e.intent; if(!it) return ''; const L=cbLead(), dm=cbEnemyDmg(e,it.m||1,L);
  if(it.k==='atk'||it.k==='heavy') return `<span class="it it-atk ${it.k==='heavy'?'heavy':''}">⚔ ${nf(dm)}</span>`;
  if(it.k==='multi') return `<span class="it it-atk">⚔ ${nf(dm)}×${it.n}</span>`;
  if(it.k==='def') return `<span class="it it-def">🛡 방어</span>`;
  return `<span class="it it-buf">▲ 강화</span>`; }
function cbRender(){ if(!CB) return; const es=cbAliveE(); if(!es.includes(CB.enemies[CB.tgt])) CB.tgt=(es[0]||{i:0}).i; const L=cbLead();
  $('#cbEn').innerHTML=CB.enemies.map(en=>`<button class="ce ${en.hp<=0?'dead':''} ${en.boss?'boss':''} ${CB.tgt===en.i&&en.hp>0?'tg':''}" id="ce${en.i}" data-act="cbtgt" data-i="${en.i}" style="--ec:${ECOL[en.elem]}">${en.hp>0?cbIntentHTML(en):''}<div class="ce-art">${enemyArt(en)}</div><b>${esc(en.name)}</b><span class="hpb"><i style="width:${Math.max(0,en.hp/en.maxhp*100)}%"></i></span><span class="ce-n">${nf(Math.max(0,en.hp))}${en.blk?` <em class="eb">🛡${nf(en.blk)}</em>`:''}${en.mark?` <em class="em">낙인 ${en.mark}</em>`:''}${en.bleed?` <em class="ebl">출혈 ${en.bleed}</em>`:''}${en.weak?` <em class="ew">약화 ${en.weak}</em>`:''}${en.vul?` <em class="ev">취약 ${en.vul}</em>`:''}${en.str>1?` <em class="es">공↑</em>`:''}</span></button>`).join('');
  $('#clHp').style.width=Math.max(0,L.hp/L.maxhp*100)+'%'; $('#clN').textContent=`${nf(Math.max(0,L.hp))} / ${nf(L.maxhp)}`; $('#cbLead').classList.toggle('down',L.hp<=0);
  $('#clSt').innerHTML=[CB.charge?`충전 ${CB.charge}`:'',CB.rage?'투지':'',CB.str>1?`공격 +${Math.round((CB.str-1)*100)}%`:'',CB.retain?'보존':'',CB.counter?'반격':'',CB.disc1?'다음 카드 -1':'',L.role==='atk'?`맹공 ${CB.atkN%3}/3`:''].filter(Boolean).map(x=>`<em>${x}</em>`).join('');
  const ub=$('#cbUlt'); ub.disabled=CB.busy||CB.ult<ULT_MAX; ub.classList.toggle('ready',CB.ult>=ULT_MAX); $('#cbUltG').style.height=(CB.ult/ULT_MAX*100)+'%';
  $('#cbOrb').innerHTML=`<b>${CB.energy}</b><small>/3</small>`; $('#cbBlk').innerHTML=`🛡 <b>${nf(CB.block)}</b>`; $('#cbBlk').classList.toggle('on',CB.block>0);
  $('#cbPile').textContent=`덱 ${CB.draw.length} · 버림 ${CB.disc.length}`;
  const n=CB.hand.length; if(CB.sel>=n) CB.sel=-1;
  $('#cbHand').innerHTML=CB.hand.map((cd,i)=>{ const u=cbUnit(cd.o), dis=CB.busy||cardCost(cd)>CB.energy||(cd.k==='echo'&&!CB.last); return cardHTML(cd,{u,act:'cbsel',i,dis:CB.busy,cls:(dis?'na ':'')+(CB.sel===i?'sel':''),sty:cbFanStyle(i,n,CB.sel===i,CB.sel)}); }).join('');
  const det=$('#cbDet'); if(CB.sel>=0&&CB.hand[CB.sel]){ const cd=CB.hand[CB.sel], u=cbUnit(cd.o), can=!CB.busy&&cardCost(cd)<=CB.energy&&!(cd.k==='echo'&&!CB.last), tx=cardTxt(cd,u), kws=Object.keys(KW).filter(k=>tx.includes(k)||((CARD_DEF[cd.k]||{}).x&&k==='소멸'));
    det.hidden=false; det.innerHTML=`<div class="cdd-h"><b>${esc(cardName(cd))}</b><span>비용 ${cardCost(cd)} · ${esc(u.c.name)}</span></div><p>${tx}</p>${kws.map(k=>`<p class="kw"><b>${k}</b> ${KW[k]}</p>`).join('')}<div class="row"><button class="btn sm" data-act="cbplay" data-i="${CB.sel}" ${can?'':'disabled'}>${can?'사용':cardCost(cd)>CB.energy?'에너지 부족':'쓸 수 없어요'}</button><button class="btn sm ghost" data-act="cbsel" data-i="-1">닫기</button></div>`; }
  else { det.hidden=true; det.innerHTML=''; }
  $('#cbEndB').disabled=CB.busy; }
function cbFx(id,txt,cls){ const el=document.getElementById(id); if(!el) return; const d=document.createElement('span'); d.className='dmg '+(cls||''); d.textContent=txt; el.appendChild(d); el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); setTimeout(()=>d.remove(),800); }
function cbHitE(u,e,m,pops){ if(e.hp<=0) return 0; let d=cbAtkVal(u,m,e); const weak=BEATS[u.elem]===e.elem; if(e.blk){ const ab=Math.min(e.blk,d); e.blk-=ab; d-=ab; } e.hp=Math.max(0,e.hp-d); pops.push(['ce'+e.i,d?nf(d)+(weak?' 약점':''):'막음',weak?'weak':'']);
  if(e.hp<=0){ cbLog(`${e.name} 쓰러짐`); if(e.mark&&rgCount('markburst')){ const o=cbAliveE(); o.forEach(x=>{ x.mark+=e.mark; pops.push(['ce'+x.i,'낙인 +'+e.mark,'weak']); }); e.mark=0; } if(rgCount('vamp')){ const L=cbLead(), h=Math.round(L.maxhp*0.08*rgCount('vamp')); L.hp=Math.min(L.maxhp,L.hp+h); pops.push(['cbLead','+'+nf(h),'heal']); } }
  if(e.boss&&!e.enr&&e.hp>0&&e.hp<e.maxhp/2){ e.enr=true; e.str+=0.3; cbLog(`${e.name}이(가) 격노했어요! 공격 증가`); } return d; }
function cbOnExhaust(pops){ const n=rgCount('ashes'); if(!n||!CB) return; const L=cbLead(); cbAliveE().forEach(e=>cbHitE(L,e,0.35*n,pops)); cbLog('잿불이 튀어요'); }
function cbSkill(u,sk,pw,tg,es,pops){
  if(sk.kind==='dmg'&&tg) cbHitE(u,tg,pw*1.3,pops);
  if(sk.kind==='aoe') es.forEach(e=>cbHitE(u,e,pw*0.9,pops));
  if(sk.kind==='heal') cbHealLead(cbSkillVal(u,sk,pw),pops);
  if(sk.kind==='shield'){ const b=cbSkillVal(u,sk,pw); CB.block+=b; pops.push(['cbLead','🛡+'+nf(b),'heal']); }
  if(sk.kind==='buff'){ CB.str+=cbSkillVal(u,sk,pw); pops.push(['cbLead','공격↑','heal']); } }
function cbUlt(){ if(!CB||CB.busy||CB.over||CB.ult<ULT_MAX) return; const L=cbLead(), sk=L.c.skill, es=cbAliveE(), tg=CB.enemies[CB.tgt]&&CB.enemies[CB.tgt].hp>0?CB.enemies[CB.tgt]:es[0], pops=[];
  CB.ult=0; skillCut(L.c,sk.name,true,$('.cb')); sfx('스킬'); cbLog(`필살! ${L.name}: ${sk.name}`); if(rgCount('ultecho')){ CB.energy+=rgCount('ultecho'); cbDraw(2); }
  if(sk.kind==='dmg'||sk.kind==='aoe'){ es.forEach(e=>cbHitE(L,e,sk.power*(sk.kind==='dmg'&&e===tg?2.4:1.4),pops)); } else { cbSkill(L,sk,sk.power*2.2,tg,es,pops); if(tg) cbHitE(L,tg,1.2,pops); }
  const r=$('.cb'); if(r){ r.classList.remove('shake'); void r.offsetWidth; r.classList.add('shake'); }
  cbRender(); pops.forEach(p=>cbFx(...p)); if(!cbAliveE().length) setTimeout(()=>cbEnd(true),500); }
function cbEndTurn(){ if(!CB||CB.busy||CB.over) return; CB.busy=true; CB.sel=-1; CB.disc.push(...CB.hand); CB.hand=[]; cbRender();
  const acts=CB.enemies.filter(en=>en.hp>0); let k=0; const L=cbLead();
  const step=()=>{ if(!CB||CB.over) return; if(k>=acts.length){ CB.enemies.forEach(en=>{ if(en.vul>0) en.vul--; if(en.weak>0) en.weak--; }); if(L.hp<=0){ cbEnd(false); return; } cbIntents(); cbTurn(false); return; }
    const e=acts[k++]; if(e.hp<=0){ step(); return; } const pops=[];
    if(e.bleed>0){ const d=Math.max(1,Math.round(L.atk*0.12*e.bleed*(1+0.5*rgCount('deepcut')))); e.hp=Math.max(0,e.hp-d); pops.push(['ce'+e.i,nf(d)+' 출혈','weak']); e.bleed--; if(e.hp<=0){ cbLog(`${e.name}이(가) 출혈로 쓰러졌어요`); cbRender(); pops.forEach(p=>cbFx(...p)); if(!cbAliveE().length){ setTimeout(()=>cbEnd(true),500); return; } setTimeout(step,420); return; } }
    e.blk=0; const it=e.intent||{k:'atk',m:1};
    const hit=m=>{ if(L.hp<=0) return; let d=cbEnemyDmg(e,m,L), ab=0; if(CB.block){ ab=Math.min(CB.block,d); CB.block-=ab; d-=ab; } L.hp=Math.max(0,L.hp-d); pops.push(['cbLead',d?nf(d):'막음',d?'':'heal']);
      if(ab&&rgCount('thorns')){ const r=Math.round(ab*0.3*rgCount('thorns')); e.hp=Math.max(0,e.hp-r); pops.push(['ce'+e.i,nf(r)+' 가시','weak']); }
      if(CB.counter&&e.hp>0){ e.hp=Math.max(0,e.hp-CB.counter); pops.push(['ce'+e.i,nf(CB.counter)+' 반격','weak']); }
      if(L.hp<=0&&CB.phoenix){ CB.phoenix=false; L.hp=Math.round(L.maxhp*0.3); cbLog('불사의 깃털이 타올라 다시 일어났어요!'); } };
    if(it.k==='atk'||it.k==='heavy') hit(it.m);
    else if(it.k==='multi') for(let n=0;n<(it.n||2);n++) hit(it.m);
    else if(it.k==='def'){ e.blk=Math.round(e.maxhp*0.14); pops.push(['ce'+e.i,'🛡+'+nf(e.blk),'heal']); }
    else { e.str+=0.2; pops.push(['ce'+e.i,'공격↑','']); }
    if(it.k==='heavy'){ const r=$('.cb'); if(r){ r.classList.remove('shake'); void r.offsetWidth; r.classList.add('shake'); } }
    sfx('타격'); cbRender(); const ee=document.getElementById('ce'+e.i); if(ee){ ee.classList.remove('act'); void ee.offsetWidth; ee.classList.add('act'); } pops.forEach(p=>cbFx(...p));
    if(!cbAliveE().length){ setTimeout(()=>cbEnd(true),500); return; }
    if(L.hp<=0){ setTimeout(()=>cbEnd(false),500); return; } setTimeout(step,520); };
  setTimeout(step,250); }
/* --- 던전 화면 --- */
function dgHTML(run){ const map=run.map, here=run.pos, W=map.w;
  const reach=new Set(); map.cells.forEach((c,i)=>{ if(c&&c.seen&&i!==here&&dgPath(map,here,i)) reach.add(i); });
  const cells=map.cells.map((c,i)=>{ if(!c) return `<div class="dg-c wall"></div>`; if(!c.seen) return `<div class="dg-c fog"></div>`;
    const r=i%W<W-1&&map.cells[i+1]&&dgLinked(map,i,i+1)&&(c.vis||map.cells[i+1].vis), b=map.cells[i+W]&&dgLinked(map,i,i+W)&&(c.vis||map.cells[i+W].vis);
    const t=c.done&&!['stairs','boss'].includes(c.t)?(c.t==='start'?'start':'empty'):c.t, ic=DG_ROOM[t][0];
    return `<button class="dg-c room ${c.vis?'vis':'scout'} r-${t} ${r?'dr':''} ${b?'db':''} ${i===here?'here':''} ${reach.has(i)?'go':''}" data-act="dgmove" data-v="${i}" ${reach.has(i)?'':'disabled'} title="${esc(DG_ROOM[t][1])}"><i>${ic}</i></button>`; }).join('');
  const lead=charById(run.squad.find(id=>run.hp[id]>0)||run.squad[0]);
  const hx=here%W, hy=Math.floor(here/W);
  return `<div class="dg-wrap"><div class="dg" id="dgMap" style="--w:${W};--h:${map.h}">${cells}<div class="dg-hero" id="dgHero" style="--x:${hx};--y:${hy}">${lead?`<img data-pix="${lead.id}" alt=""><span class="dg-fb">${esc(lead.name.slice(0,1))}</span>`:''}</div></div>
    <div class="dg-leg">${['battle','elite','treasure','rest','event',run.floor>=DG_FLOORS?'boss':'stairs'].map(k=>`<span><i class="r-${k}">${DG_ROOM[k][0]}</i>${DG_ROOM[k][1]}</span>`).join('')}</div></div>`; }
/* 주인공이 경로를 따라 걷는 연출(View) — 끝나면 done */
function dgHeroWalk(path,W,done){ const hero=$('#dgHero'); let k=1; const go=()=>{ if(k<path.length){ const i=path[k++]; if(hero){ hero.style.setProperty('--x',i%W); hero.style.setProperty('--y',Math.floor(i/W)); } sfx('확인'); setTimeout(go,170); return; } done(); }; go(); }
function rgRunHTML2(run){ const g=progRead('rogue'); const c=run.map.cells[run.pos];
  let body;
  let ov='';
  if(run.pick){ ov=`<div class="rg-ov"><div class="rg-ban">유물을 선택하십시오</div><div class="rg-picks rg-ovp">`+run.pick.filter(k=>RELICS[k]).map((k,j)=>{ const n=rgCount(k); return `<button class="rg-relic" style="animation-delay:${j*0.09}s" data-act="rgrelic" data-v="${k}"><b>${esc(RELICS[k][0])}${n?` <small>×${n+1}</small>`:''}</b><span>${esc(RELICS[k][1])}</span></button>`; }).join('')+`</div><button class="btn rg-skipb" data-act="rgskip">넘기기 <small>(체력 10% 회복)</small></button></div>`; }
  else if(run.cpick){ ov=`<div class="rg-ov"><div class="rg-ban">카드를 선택하십시오</div><div class="cd-row rg-ovc">${run.cpick.map((cd,i)=>cardHTML(cd,{act:'rgcard',i,sty:`animation-delay:${i*0.09}s`})).join('')}</div><button class="btn rg-skipb" data-act="rgcard" data-i="-1">넘기기</button></div>`; }
  if(run.upg){ const list=run.deck.map((cd,i)=>({cd,i})).filter(x=>!x.cd.up); body=`<h4 class="ch-sub">강화할 카드를 고르세요</h4><div class="cd-row wrap">${list.map(x=>cardHTML(x.cd,{act:'rgupg',i:x.i})).join('')}</div><div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="rgupg" data-i="-1">취소</button></div>`; }
  else if(run.rm){ body=`<h4 class="ch-sub">덱에서 뺄 카드를 고르세요</h4><div class="cd-row wrap">${run.deck.map((cd,i)=>cardHTML(cd,{act:'rgrm',i})).join('')}</div><div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="rgrm" data-i="-1">취소</button></div>`; }
  else if(run.rest){ body=`<h4 class="ch-sub">야영지</h4><div class="rg-nodes"><button class="rg-node n-rest" data-act="rgrest" data-v="heal"><em>⛺</em><b>휴식</b><span>체력 35% 회복 · 쓰러진 대원 부활</span></button>${run.mode==='card'?`<button class="rg-node n-treasure" data-act="rgrest" data-v="upg"><em>⚒</em><b>카드 강화</b><span>카드 1장을 + 로 강화</span></button><button class="rg-node n-event" data-act="rgrest" data-v="rm"><em>✂</em><b>정리</b><span>덱에서 카드 1장 빼기</span></button><button class="rg-node n-rest" data-act="rgsave"><em>💾</em><b>저장하고 나가기</b><span>여기서 멈추고 나중에 이어서 해요. 탐사 경로는 매주 월요일에 바뀌어서, 그 전에 돌아와야 해요</span></button>`:`<button class="rg-node n-treasure" data-act="rgrest" data-v="train"><em>⚒</em><b>훈련</b><span>공격 +5%</span></button>`}</div>`; }
  else { body=dgHTML(run)+((c.t==='stairs')?`<div class="row" style="margin-top:8px"><button class="btn" data-act="dgdown">▼ 제${run.floor+1}구역으로 이동</button></div>`:`<p class="muted dg-hint">밝은 방을 누르면 그곳으로 이동해요. 옆방은 미리 보여요.</p>`); }
  return `${ov}<section class="ch-card rog dgcard"><div class="ch-h"><i>EXPEDITION · ${run.floor}/${DG_FLOORS}</i><h3>${esc(T('abyss'))}</h3>${run.msg?`<span class="rg-msg">${esc(rgMessage(run))}</span>`:''}</div>
    <div class="rg-sq">${run.squad.map((id,i)=>{ const c=charById(id), h=run.hp[id]==null?1:run.hp[id]; if(!c) return ''; if(run.mode!=='auto'&&i>0) return `<div class="rg-u card"><div class="rg-a">${art(c)}</div><b>${esc(c.name)}</b><span class="muted" style="font-size:.62rem">카드</span></div>`; return `<div class="rg-u ${h<=0?'down':''} ${run.mode!=='auto'?'lead':''}"><div class="rg-a">${art(c)}</div><b>${esc(c.name)}${run.mode!=='auto'?' · 리더':''}</b><span class="hpb"><i style="width:${Math.round(h*100)}%"></i></span></div>`; }).join('')}</div>
    ${run.mode!=='auto'&&charById(run.squad[0])?`<p class="muted" style="font-size:.75rem;margin:4px 0">◆ 리더 능력 「${esc((LEAD_AB[charById(run.squad[0]).role]||LEAD_AB.atk)[0])}」 ${esc((LEAD_AB[charById(run.squad[0]).role]||LEAD_AB.atk)[1])} · 필살: ${esc(charById(run.squad[0]).skill.name)}</p>`:''}
    ${run.relics.length?`<div class="rg-rel">${[...new Set(run.relics)].map(k=>`<span title="${esc(RELICS[k][1])}">${esc(RELICS[k][0])}${rgCount(k)>1?' ×'+rgCount(k):''}</span>`).join('')}</div>`:''}
    ${body}<div class="row" style="margin-top:10px">${run.mode==='card'?`<button class="btn sm ghost" data-act="rgdeck">덱 ${run.deck.length}장 보기</button>`:''}<button class="btn sm ghost" data-act="rgquit">탐사 끝내기</button></div></section>`; }
function rgDeckModal(deck){ const miss=new Set(deck.filter(cd=>!cardIllObj(cd)).map(cd=>cd.o+'|'+cd.k)).size;
  openModal(`${head('덱',`<span class="muted">${deck.length}장 · 매 턴 5장을 뽑고 에너지 3으로 써요</span>`)}${miss&&imgReady()?`<div class="row" style="margin:0 0 8px"><button class="btn sm" data-act="cdart">카드 일러스트 그리기 (${miss}장)</button><span class="muted" style="font-size:.75rem">대원·카드마다 한 장씩, 그림 AI 사용량이 들어요</span></div>`:''}<div class="cd-row wrap">${deck.map(cd=>cardHTML(cd,{})).join('')}</div>`); }
function openRgForm(){ const busy=busyIds();
  if(!RF){ const prev=(progRead('rogue').lastSquad||P().squad||[]).filter(id=>own(id)&&charById(id)&&!busy.has(id)).slice(0,4); RF={s:prev.length?[0,1,2,3].map(i=>prev[i]||null):rfAuto(),sel:0,filter:'all'}; }
  const L=charById(RF.s[0]), ids=rfIds(), deck=ids.length?rgDeck(ids):[];
  const chip=cd=>`<span class="rf-cd t-${cardType(cd)}">${esc(cardName(cd))}</span>`;
  const lead=L?`<button class="rf-lead ${RF.sel===0?'sel':''}" data-act="rfslot" data-i="0" style="--ec:${ECOL[L.elem]}"><div class="rf-la">${art(L)}</div><div class="rf-lt"><i>LEADER · 직접 싸워요</i><b>${esc(L.name)}</b><span class="el" style="--ec:${ECOL[L.elem]}">${esc(L.elem)}</span> <small>${esc(ROLE[L.role])} · Lv.${own(L.id).lv}</small>
      <p><b>리더 능력 · ${esc((LEAD_AB[L.role]||LEAD_AB.atk)[0])}</b> ${esc((LEAD_AB[L.role]||LEAD_AB.atk)[1])}</p><p><b>필살기 · ${esc(L.skill.name)}</b> 게이지 ${ULT_MAX}칸이 차면 써요.</p><div class="rf-cds">${chip({k:'strike',o:L.id})}<em>×4</em>${chip({k:'guard',o:L.id})}<em>×4</em></div></div></button>`
    :`<button class="rf-lead empty ${RF.sel===0?'sel':''}" data-act="rfslot" data-i="0"><span>+</span><b>리더를 골라 주세요</b><small>아래 목록에서 ${esc(T('crew'))}을(를) 누르면 이 자리에 들어가요</small></button>`;
  const sup=i=>{ const c=charById(RF.s[i]); if(!c) return `<button class="rf-sup empty ${RF.sel===i?'sel':''}" data-act="rfslot" data-i="${i}"><span>+</span><small>카드 ${i}</small></button>`;
    const cds=L?rgDeck([L.id,c.id]).slice(8):[]; return `<button class="rf-sup ${RF.sel===i?'sel':''}" data-act="rfslot" data-i="${i}" style="--ec:${ECOL[c.elem]}"><div class="rf-sa">${art(c)}</div><b>${esc(c.name)}</b><small>${esc(ROLE[c.role])}</small><div class="rf-cds">${cds.map(chip).join('')}</div></button>`; };
  const list=G.chars.filter(c=>own(c.id)&&(RF.filter==='all'||c.role===RF.filter)).sort((a,b)=>charPower(b)-charPower(a));
  openModal(`${head(esc(T('abyss'))+' 편성','<span class="muted">리더 1명이 직접 싸우고, 뒤의 3명은 카드가 되어 덱에 들어가요</span>')}
    <div class="rf-tee">${lead}<div class="rf-stem"></div><div class="rf-sups">${[1,2,3].map(sup).join('')}</div></div>
    <p class="muted" style="margin:6px 0 0;font-size:.75rem">자리를 누른 뒤 아래에서 ${esc(T('crew'))}을(를) 고르세요. 이미 편성된 ${esc(T('crew'))}을(를) 고르면 자리가 바뀌어요.</p>
    <div class="row" style="margin-top:8px"><button class="btn sm" data-act="rfauto">자동 편성</button><button class="btn sm ghost" data-act="rfclr">비우기</button>${deck.length&&imgReady()&&deck.some(cd=>!cardIllObj(cd))?'<button class="btn sm ghost" data-act="cdart">카드 일러스트 그리기</button>':''}</div>
    <div class="ftools" style="margin-top:10px"><div class="chips">${[['all','전체'],...Object.entries(ROLE)].map(([v,l])=>`<button class="chip ${RF.filter===v?'on':''}" data-act="rffil" data-v="${v}">${esc(l)}</button>`).join('')}</div></div>
    <div class="froster">${list.map(c=>{ const k=RF.s.indexOf(c.id), b=busy.has(c.id); return `<button class="fr r${c.rarity} ${k>=0?'on':''} ${b?'busy':''}" data-act="rfpick" data-id="${c.id}" ${b?'disabled':''} style="--ec:${ECOL[c.elem]}"><div class="fr-art">${art(c)}</div><span class="el" style="--ec:${ECOL[c.elem]}">${esc(c.elem)}</span>${b?'<em class="busy">파견</em>':k>=0?`<em class="num">${k?'카드':'리더'}</em>`:''}<b>${esc(c.name)}</b><span>${esc(ROLE[c.role])} · ${nf(charPower(c))}</span></button>`; }).join('')||'<p class="muted">보유한 '+T('crew')+'이(가) 없어요.</p>'}</div>
    ${deck.length?`<details class="rf-deck"><summary>시작 덱 ${deck.length}장 전체 보기</summary><div class="cd-row wrap">${deck.map(cd=>cardHTML(cd,{})).join('')}</div></details>`:''}
    <div class="row" style="margin-top:14px"><button class="btn block" data-act="rfgo" ${L?'':'disabled'}>${L?`탐사 시작 (리더 ${esc(L.name)} · 카드 ${ids.length-1}명)`:'리더를 먼저 골라 주세요'}</button></div>`); }
function abyssHTML(){ const run=progRead('rogue').run; if(!run||run.v!==2) return challengeHTML();
  setTimeout(pixFill,30);
  return `<div class="phead"><button class="back" data-act="rgleave" aria-label="나가기">‹</button><div><i>EXPEDITION</i><h2>${esc(T('abyss'))}</h2></div></div>${rgRunHTML2(run)}`; }
function challengeHTML(){
  const r=progRead('raid'), b=raidBoss(), ratio=r.dmg/b.total, left=raidTriesLeft(), g=progRead('rogue'), run=g.run;
  const raid=`<section class="ch-card raid"><div class="ch-h"><i>WEEKLY RAID · Lv.${r.lv}</i><h3>${esc(b.name)}</h3><span>이번 주 함께 깎는 보스예요. 한 번에 ${Math.ceil(RAID_TICKS*GGMCombat.DT)}초 동안 싸우고, 준 피해가 쌓여요.</span></div>
    <div class="rd-hero ${r.killed?'dead':''}" style="--ec:${ECOL[b.elem]}"><div class="rd-bg" style="${b.bg?bgStyle(b.bg):bgStyle(P().lobbyBg||'')}"></div><div class="rd-glow"></div>
      <div class="rd-boss">${enemyArt(b,'rd-img')}</div><div class="rd-shade"></div>
      <div class="rd-tag"><span class="el" style="--ec:${ECOL[b.elem]}">${esc(b.elem)}</span><i>WEEKLY RAID BOSS</i></div>
      <div class="rd-name"><b>${esc(b.name)}</b><span>Lv.${r.lv} · 남은 체력 ${Math.max(0,100-Math.min(100,Math.floor(ratio*1000)/10))}%</span></div>
      <div class="rd-pats">${bossPats(b,true).map(k=>`<span title="${esc(BPATS[k][1])}">${esc(BPATS[k][0])}</span>`).join('')}<span title="체력 50% 이하에서 공격·속도 증가">광폭화</span></div>
      <div class="rd-hp"><i style="width:${Math.max(0,100-Math.min(100,ratio*100))}%"></i><span>${nf(Math.max(0,b.total-r.dmg))} / ${nf(b.total)}</span></div>
      ${r.killed?'<div class="rd-stamp">토벌 완료</div>':''}</div>
    <div class="rd-ms">${RAID_MS.map(([t,rw],i)=>`<span class="${r.got.includes(i)?'on':''}" title="${esc(rewardText(rw))}">${Math.round(t*100)}%</span>`).join('')}</div>
    <div class="row" style="margin-top:10px"><button class="btn" data-act="raidgo" ${left&&!r.killed?'':'disabled'}>${r.killed?'이번 주 토벌 완료':'도전 (오늘 '+left+'/3)'}</button></div>
    <p class="muted" style="margin:6px 0 0;font-size:.78rem">최고 피해 ${nf(r.best||0)} · 토벌하면 다음 주에 더 강한 보스가 나와요.</p></section>`;
  let rog;
  if(!run){ rog=`<section class="ch-card rog"><div class="ch-h"><i>EXPEDITION · ${DG_FLOORS} AREAS</i><h3>${esc(T('abyss'))}</h3><span>한 번 고른 4명으로 ${DG_FLOORS}개 구역을 탐사해요. 미지의 경로에서 전투·보물·야영지·사건을 만나고 다음 구역으로 이동해요. 마지막 구역에는 보스가 기다려요. 체력은 이어져요.</span></div>
      <p class="muted" style="margin:8px 0">최고 진척 ${g.best||0}/${RG_FLOORS} · 오늘 ${g.day===today()?g.n:0}번 (3번째부터 보상 25%)</p><div class="rg-mode one"><button class="rg-node n-treasure" data-act="rgnew" data-v="card"><em>🂠</em><b>탐사 시작</b><span>첫 번째로 고른 ${esc(T('crew'))}이(가) 리더로 싸우고, 나머지는 카드가 되어 능력을 빌려줘요.</span></button></div></section>`; }
  else if(run.v===2){ const L=charById(run.squad[0]), c=run.map.cells[run.pos]; rog=`<section class="ch-card rog dgcard"><div class="ch-h"><i>EXPEDITION · ${run.floor}/${DG_FLOORS}</i><h3>${esc(T('abyss'))} 진행 중</h3><span>${L?`리더 ${esc(L.name)} · `:''}제${run.floor}구역${run.rest?' 야영지':''}${run.saved?' · 저장됨':''}${run.wk&&run.wk!==weekKey()?' · 탐사 경로가 바뀌었어요(제1구역부터 다시)':''}</span></div><div class="rg-mode one"><button class="rg-node n-treasure" data-act="go" data-to="abyss"><em>▶</em><b>이어서 탐사하기</b><span>화면 전체로 던전을 탐색해요</span></button></div></section>`; }
  else {
    const nodes=run.pick?`<h4 class="ch-sub">유물을 하나 고르세요</h4><div class="rg-picks">${run.pick.filter(k=>RELICS[k]).map(k=>{ const n=run.relics.filter(x=>x===k).length; return `<button class="rg-relic" data-act="rgrelic" data-v="${k}"><b>${esc(RELICS[k][0])}${n?` <small>×${n+1}</small>`:''}</b><span>${esc(RELICS[k][1])}${n?' · 겹쳐서 더 강해져요':''}</span></button>`; }).join('')}</div><div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="rgskip">고르지 않고 지나가기 (체력 10% 회복)</button></div>`
      :`<h4 class="ch-sub">${run.floor}구역 · 어디로 갈까요?</h4><div class="rg-nodes">${(run.opts||[]).map(k=>`<button class="rg-node n-${k}" data-act="rgnode" data-v="${k}"><em>${RG_NODE[k][0]}</em><b>${RG_NODE[k][1]}</b><span>${RG_NODE[k][2]}</span></button>`).join('')}</div>`;
    rog=`<section class="ch-card rog"><div class="ch-h"><i>EXPEDITION · ${run.floor}/${RG_FLOORS}구역</i><h3>${esc(T('abyss'))}</h3>${run.msg?`<span class="rg-msg">${esc(rgMessage(run))}</span>`:''}</div>
      <div class="rg-sq">${run.squad.map(id=>{ const c=charById(id), h=run.hp[id]||0; return c?`<div class="rg-u ${h<=0?'down':''}"><div class="rg-a">${art(c)}</div><b>${esc(c.name)}</b><span class="hpb"><i style="width:${Math.round(h*100)}%"></i></span></div>`:''; }).join('')}</div>
      ${run.relics.length?`<div class="rg-rel">${[...new Set(run.relics)].map(k=>`<span title="${esc(RELICS[k][1])}">${esc(RELICS[k][0])}${rgCount(k)>1?' ×'+rgCount(k):''}</span>`).join('')}</div>`:''}
      ${nodes}<div class="row" style="margin-top:10px"><button class="btn sm ghost" data-act="rgquit">탐사 끝내기</button></div></section>`; }
  return `${pageHead('도전','CHALLENGE','lobby')}${raid}${towerHTML()}${rog}`;
}
/* 탐사 전투 결과(View) */
function rogueResultHTML(R){ if(!R) return '<button class="btn" data-act="bdone">계속</button>';
  if(R.v===2) return `<h2 class="disp" style="color:var(--rose);margin:0">전투 승리</h2><p>${R.node==='elite'?'정예를 쓰러뜨렸어요. 유물을 고를 수 있어요.<br>':''}${R.card?'새 카드를 하나 고를 수 있어요.':'계속 탐사해요.'}${R.heal?'<br>응급 키트로 체력을 회복했어요.':''}</p><button class="btn" data-act="bdone">계속</button>`;
  return `<h2 class="disp" style="color:var(--rose);margin:0">${R.floor-1}구역 돌파</h2><p>${R.node==='elite'?'정예를 쓰러뜨렸어요. 유물을 하나 고를 수 있어요.':'다음 구역으로 가요.'}${R.heal?'<br>응급 키트로 체력을 회복했어요.':''}</p><button class="btn" data-act="bdone">계속</button>`; }
/* 탐사 끝 결과(View) */
function rgFinishHTML(R){ return `<h2 class="disp" style="color:${R.done?'var(--rose)':'#ff5277'};margin:0">${esc(T('abyss'))} · ${R.done?'탐사 완료!':'탐사 종료'}</h2><p>${R.v===2?`제${R.floor}구역까지 탐사했어요 (진척 ${R.f}/${RG_FLOORS})`:R.f+'구역까지 갔어요'}.${R.n>2?' (오늘 3번째부터는 보상 25%)':''}<br>${rewardText(R.r)}${R.r.gems?'':`<br><small class="muted">${esc(T('currency'))}은(는) 최고 진척 기록을 갱신할 때만 받아요</small>`}</p><button class="btn" data-act="bdone">계속</button>`; }
/* 심연 탐사 화면 보조(View): 탐사 카드로 스크롤 · 탐사 결과 창 */
function abyssCardFocus(){ setTimeout(()=>{ const el=document.querySelector('.ch-card.rog'); if(el) el.scrollIntoView({block:'start',behavior:'smooth'}); },60); }
function openRgResult(html,title,note){ openModal(`<div class="result" style="position:static">${title?`<p style="margin:0 0 6px"><b>${esc(title)}</b><br><span class="muted">${esc(note||'')}</span></p>`:''}${html.replace('data-act="bdone"','data-act="close"')}</div>`); }
/* src/main/0110-challenge/0125-tower.js에서 옮김 */
/* 탑 결과(View) */
function towerResultHTML(R){ return `<h2 class="disp" style="color:${R.win?'var(--rose)':'#ff5277'};margin:0">${R.win?`${R.floor}층 돌파!`:`${R.floor}층 실패`}</h2><p>${R.r?'첫 돌파 보상: '+rewardText(R.r):R.win?'':'편성·속성을 바꾸거나 더 키워서 다시 도전하세요. 전장 규칙을 확인해 보세요.'}</p><button class="btn" data-act="bdone">계속</button>`; }
function towerHTML(){ const T0=progRead('tower'); return `<section class="ch-card"><div class="ch-h"><i>TRIAL TOWER</i><h3>시련의 탑</h3><span>층마다 강해지는 적과 바뀌는 전장 규칙. 제한 탑은 그 소속·속성 ${T('crew')}만 출전해요. 5층마다 보스와 큰 보상.</span></div>
  <div class="tw-list">${towerList().map(t=>{ const b=(T0[t.id]||{}).best||0, n=t.allow?G.chars.filter(c=>own(c.id)&&t.allow(c)).length:G.chars.filter(c=>own(c.id)).length;
    return `<button class="tw-card" data-act="towergo" data-v="${esc(t.id)}" ${n?'':'disabled'}><b>${esc(t.name)}</b><span>${esc(t.desc)} · 보유 ${n}명</span><br><span>최고 ${b}층 → 다음 ${b+1}층</span></button>`; }).join('')}</div></section>`; }
/* src/main/0110-challenge/0488-stage-modes.js에서 옮김 */
function openModeStage(ch,s){ const cl=!!P().cleared[s.id], first=!cl, code=ch.kind==='event'?'EV'+(ch.stages.indexOf(s)+1):stageCode(s.id), d=s.debate, c=s.contest;
  openModal(`${head(esc(code+' '+s.title),`<span class="muted">${s.mode==='debate'?'회담 · 주장 속 모순을 증거·설득으로 돌파':'콘테스트 · '+T('crew')+'의 매력으로 심사위원을 사로잡기'}</span>`)}
  ${s.mode==='debate'?`<p><b>상대</b> ${esc(d.opponent)} · <b>목표</b> ${esc(d.goal||'설득')}</p><p class="muted">증거 ${d.evidence.length}개 · 라운드 ${d.rounds.length} · 신뢰도 ${d.hp}</p>`:`<p><b>${esc(c.title)}</b> · 심사위원 ${c.judges.map(j=>`${esc(j.name)}(${CHARM[j.likes]})`).join(', ')}</p><p class="muted">라운드 ${c.rounds} · 경쟁자 ${c.rivals.map(r=>esc(r.name)).join(', ')||'없음'}</p>`}
  <h3 class="sec">${s.mode==='contest'?'출전 (최대 3명)':'함께 갈 동료 (설득에 나설 수 있어요, 최대 4명)'}</h3><div class="row" style="gap:4px;flex-wrap:wrap">${G.chars.filter(x=>own(x.id)&&!x.monster).map(x=>`<label class="chip ${P().squad.includes(x.id)?'on':''}" style="cursor:pointer"><input type="checkbox" data-mdsel="${x.id}" ${P().squad.includes(x.id)?'checked':''} hidden>${esc(x.name)}</label>`).join('')}</div>
  <p class="muted" style="font-size:.8rem">${first?'첫 클리어 보상: ◆'+s.reward:'다시 도전할 수 있어요'}</p>
  <div class="row"><button class="btn" data-act="mdgo" data-ch="${ch.id}" data-st="${s.id}">${s.pre&&first?'이야기 보고 시작':'시작'}</button>${cl&&s.post?`<button class="btn ghost" data-act="story" data-ch="${ch.id}" data-st="${s.id}" data-k="post">끝난 뒤 이야기</button>`:''}<button class="btn ghost" data-act="chedit" data-ch="${ch.id}">스토리 편집</button></div>`); }
/* 회담 */
function debateStart(ch,s){ MD={kind:'debate',ch,s,r:0,i:0,hp:s.debate.hp,log:[],pressed:{}}; debateDraw(); }
function debateDraw(msg){ const {s,r,i,hp}=MD, d=s.debate, R=d.rounds[r], L=R.lines[i], opp=findSpeaker(d.opponent)||npcBy(d.opponent), sq=P().squad.map(charById).filter(Boolean);
  openModal(`${head(`회담 · ${esc(d.opponent)}`,`<span class="muted">라운드 ${r+1}/${d.rounds.length} · 신뢰도 ${'◆'.repeat(hp)}${'◇'.repeat(Math.max(0,d.hp-hp))}</span>`)}
  <div class="db-stage">${opp&&imgSrc(opp)?`<div class="db-opp">${art(opp,'',{upper:true})}</div>`:''}<div class="db-claim"><i>${esc(R.claim||'주장')}</i><p class="db-line">“${esc(L.text)}”</p><span class="muted">${i+1}/${R.lines.length}</span></div></div>
  ${msg?`<p class="db-msg">${esc(msg)}</p>`:''}
  <div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn sm ghost" data-act="dbnav" data-v="-1" ${i?'':'disabled'}>◀</button><button class="btn sm ghost" data-act="dbnav" data-v="1" ${i<R.lines.length-1?'':'disabled'}>▶</button><button class="btn sm" data-act="dbpress">추궁</button></div>
  <h3 class="sec">증거 제시</h3><div class="db-ev">${d.evidence.map(e=>`<button class="btn sm ghost" data-act="dbshow" data-v="${e.id}" title="${esc(e.desc)}"><b>${esc(e.name)}</b><small>${esc(e.desc)}</small></button>`).join('')}</div>
  <h3 class="sec">동료 설득</h3><div class="row" style="gap:6px;flex-wrap:wrap">${sq.map(c=>`<button class="btn sm ghost" data-act="dbpers" data-v="${c.id}">${esc(c.name)}</button>`).join('')||'<span class="muted">편성한 '+T('crew')+'이(가) 없어요</span>'}</div>
  <div class="row" style="margin-top:10px"><button class="btn ghost" data-act="dbquit">그만두기</button></div>`); }
/* 콘테스트 */
function contestStart(ch,s){ const ent=P().squad.map(charById).filter(c=>c&&own(c.id)).slice(0,3); if(!ent.length){ toast(`출전할 ${T('crew')}을(를) 편성해 주세요`); return; }
  MD={kind:'contest',ch,s,round:0,ent,score:0,hype:0,last:null,rivals:s.contest.rivals.map(r=>({...r,score:0})),log:[]}; contestDraw(); }
function contestDraw(msg){ const {s,round,ent,score,hype}=MD, c=s.contest, j=contestPref(round);
  openModal(`${head(esc(c.title),`<span class="muted">라운드 ${round+1}/${c.rounds} · 분위기 ${'♪'.repeat(hype)||'—'}</span>`)}
  <p>심사위원 <b>${esc(j.name)}</b>은(는) <b>${CHARM[j.likes]}</b>을(를) 좋아해요.</p>${msg?`<p class="db-msg">${esc(msg)}</p>`:''}
  <div class="ct-board"><div><b>우리</b> ${nf(score)}</div>${MD.rivals.map(r=>`<div>${esc(r.name)} ${nf(r.score)}</div>`).join('')}</div>
  ${ent.map(e=>{ const ch=charmOf(e); return `<div class="panel" style="padding:8px;margin:6px 0"><b>${esc(e.name)}</b>${MD.last===e.id?' <span class="muted">(방금 어필 — 연달아 쓰면 분위기가 식어요)</span>':''}<div class="row" style="gap:4px;flex-wrap:wrap;margin-top:4px">${Object.keys(CHARM).map(k=>`<button class="btn sm ${k===j.likes?'':'ghost'}" data-act="ctap" data-c="${e.id}" data-k="${k}">${CHARM[k]} ${ch[k]}</button>`).join('')}</div></div>`; }).join('')}
  <div class="row" style="margin-top:8px"><button class="btn ghost" data-act="dbquit">그만두기</button></div>`); }
