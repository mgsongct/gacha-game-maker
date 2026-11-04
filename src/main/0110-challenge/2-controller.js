/* ===== 0110-challenge — Controller(동작을 받아 Model을 바꾸고 다시 그리게 함 · 섞인 함수는 나눌 것) ===== */
/* src/main/0110-challenge/0110-challenge-raid.js에서 옮김 */
/* 레이드 끝(Controller): 정산 → 효과음 → 결과 */
function raidEnd(win){ const R=raidSettle(win); sfx(R.killed?'승리':'확인'); return raidResultHTML(R); }
/* src/main/0110-challenge/0120-abyss.js에서 옮김 */
// 카드 일러스트: 대원마다, 카드 종류마다 한 장 (스킬 카드는 기술 컷인을 써요)
async function drawCardArts(deck,rep){ if(!imgReady()){ toast(imgNeed()); return; }
  const todo=[]; const seen=new Set(); deck.forEach(cd=>{ const c=charById(cd.o), key=cd.o+'|'+cd.k; if(!c||seen.has(key)||cardIllObj(cd)) return; seen.add(key); todo.push(cd); });
  if(!todo.length){ toast('모든 카드에 일러스트가 있어요'); return; }
  let n=0;
  for(const cd of todo){ const c=charById(cd.o); if(rep) rep(`그리는 중 ${n+1}/${todo.length}`);
    try{ const tags=cd.k==='skill'?(SKILL_TAGS[c.skill&&c.skill.kind]||'attacking')+', special effects, glowing':CARD_ILL[cd.k]||'dynamic pose';
      const b=await naiDraw('illust',joinTags(c.naiPrompt,tags),{styleId:c.naiStyle,frame:cd.k==='skill'?'upper body':'cowboy shot',pose:'dynamic pose, '+tags});
      if(cd.k==='skill'){ scgSlot(c); await storeImage(c.scg,b,''); } else { c.cards=c.cards||{}; const o=c.cards[cd.k]||(c.cards[cd.k]={id:'cd_'+c.id+'_'+cd.k,kind:'illust',name:c.name+' '+cardName({k:cd.k,o:c.id}),prompt:tags,img:null}); await storeImage(o,b,''); }
      mark('c:'+c.id); n++; }
    catch(e){ toast(naiErr(e)); break; } }
  if(rep) rep.end(); if(n) toast(`카드 일러스트 ${n}장을 그렸어요`); const run=progSlot('rogue').run; if($('#modal .cd-row')&&run) rgDeckModal(run.deck); if(CB) cbRender(); }
function cbPlay(i){ if(!CB||CB.busy||CB.over) return; const cd=CB.hand[i]; if(!cd) return; const u=cbUnit(cd.o), L=cbLead(); const cost=cardCost(cd); if(cost>CB.energy) return; if(cd.k==='echo'&&!CB.last) return;
  const df=CARD_DEF[cd.k]||CARD_DEF.strike, last1=CB.hand.length===1&&rgCount('lastcard')?2:1, m=(cd.up?df.mu:df.m)*last1, es=cbAliveE(), tg=CB.enemies[CB.tgt]&&CB.enemies[CB.tgt].hp>0?CB.enemies[CB.tgt]:es[0], pops=[], ty=cardType(cd), chain=CB.last&&cardType(CB.last)==='atk';
  CB.energy-=cost; CB.hand.splice(i,1); CB.sel=-1; (df.x?CB.exh:CB.disc).push(cd); if(CB.disc1) CB.disc1=false; CB.played++; if(df.x) cbOnExhaust(pops);
  switch(cd.k){
    case 'strike': case 'heavy': if(tg) cbHitE(u,tg,m,pops); sfx('타격'); break;
    case 'slash': if(tg){ cbHitE(u,tg,m*(chain?1.6:1),pops); if(chain) cbLog('연계!'); } sfx('타격'); break;
    case 'twin': if(tg){ cbHitE(u,tg,m,pops); if(tg.hp>0) cbHitE(u,tg,m,pops); else { const t2=cbAliveE()[0]; if(t2) cbHitE(u,t2,m,pops); } } sfx('타격'); break;
    case 'combo': if(tg) cbHitE(u,tg,m*CB.played,pops); sfx('타격'); break;
    case 'sweep': es.forEach(e=>cbHitE(u,e,m,pops)); sfx('타격'); break;
    case 'brand': if(tg){ cbHitE(u,tg,m,pops); if(tg.hp>0){ const s=(cd.up?df.mku:df.mk)+rgCount('brandplus'); tg.mark+=s; pops.push(['ce'+tg.i,'낙인 +'+s,'weak']); } } sfx('타격'); break;
    case 'finisher': if(tg){ const st=tg.mark; tg.mark=0; cbHitE(u,tg,m*(1+st),pops); if(st) cbLog(`낙인 ${st}개를 터뜨렸어요!`); } sfx('타격'); break;
    case 'bleed': if(tg){ cbHitE(u,tg,m,pops); if(tg.hp>0){ const s=cd.up?df.blu:df.bl; tg.bleed+=s; pops.push(['ce'+tg.i,'출혈 +'+s,'weak']); } } sfx('타격'); break;
    case 'guard': case 'wall': case 'taunt': { const b=cbBlk(u,m); CB.block+=b; pops.push(['cbLead','🛡+'+nf(b),'heal']); sfx('확인'); break; }
    case 'bulwark': { const b=cbBlk(u,m); CB.block+=b; CB.retain=true; pops.push(['cbLead','🛡+'+nf(b)+' 보존','heal']); sfx('확인'); break; }
    case 'counter': { const b=cbBlk(u,m); CB.block+=b; CB.counter=Math.max(CB.counter,cbAtkVal(u,0.6)); pops.push(['cbLead','반격 태세','heal']); sfx('확인'); break; }
    case 'tactic': case 'focus': cbDraw(m); break;
    case 'plan': cbDraw(m); CB.disc1=true; break;
    case 'surge': CB.energy+=m; break;
    case 'aid': cbHealLead(Math.round(u.maxhp*0.12*m),pops); break;
    case 'revive': cbHealLead(Math.round(L.maxhp*m),pops); break;
    case 'expose': if(tg){ tg.vul+=m; pops.push(['ce'+tg.i,'취약','weak']); } break;
    case 'weaken': if(tg){ tg.weak+=m; pops.push(['ce'+tg.i,'약화','weak']); } break;
    case 'rally': CB.str+=m; pops.push(['cbLead','공격↑','heal']); break;
    case 'charge': { CB.charge=(CB.charge||0)+m; const b=cbBlk(u,0.5); CB.block+=b; pops.push(['cbLead','충전 '+CB.charge,'heal']); sfx('확인'); break; }
    case 'release': { const k=1+(CB.charge||0); es.forEach(e=>cbHitE(u,e,m*k,pops)); if(CB.charge) cbLog(`충전 ${CB.charge}을(를) 해방!`); CB.charge=0; sfx('타격'); break; }
    case 'sacrifice': { const j=CB.hand.length-1; if(j>=0){ const x=CB.hand.splice(j,1)[0]; CB.exh.push(x); cbLog(`「${cardName(x)}」 소멸`); cbOnExhaust(pops); } cbDraw(m); break; }
    case 'burnout': if(tg) cbHitE(u,tg,m,pops); sfx('타격'); break;
    case 'shieldbash': if(tg&&CB.block>0){ cbHitE(u,tg,CB.block*m/Math.max(1,u.atk*CB.str),pops); } else if(tg) pops.push(['ce'+tg.i,'보호막 없음','']); sfx('타격'); break;
    case 'entrench': { const b=CB.block; CB.block+=b; pops.push(['cbLead','🛡+'+nf(b),'heal']); sfx('확인'); break; }
    case 'hemorrhage': if(tg&&tg.bleed){ tg.bleed*=2; pops.push(['ce'+tg.i,'출혈 '+tg.bleed,'weak']); } break;
    case 'flurry': if(tg){ cbHitE(u,tg,m,pops); if(chain){ cbDraw(1); cbLog('연계! 카드 1장'); } } sfx('타격'); break;
    case 'spread': if(tg&&tg.mark){ es.forEach(e=>{ if(e!==tg){ e.mark+=tg.mark; pops.push(['ce'+e.i,'낙인 +'+tg.mark,'weak']); } }); } break;
    case 'overdrive': CB.ult=Math.min(ULT_MAX,CB.ult+m); pops.push(['cbLead','필살 +'+m,'heal']); break;
    case 'rage': CB.rage=(CB.rage||0)+cbBlk(L,m); pops.push(['cbLead','투지','heal']); break;
    case 'echo': if(CB.last){ CB.hand.push(Object.assign({},CB.last)); cbLog(`「${cardName(CB.last)}」을(를) 복사했어요`); } break;
    case 'skill': { const sk=u.c.skill, pw=sk.power*(cd.up?df.mu:1)*last1; skillCut(u.c,sk.name,!['off','small'].includes(P().skillCut||'auto'),$('.cb')); sfx('스킬'); cbLog(`${u.name}: ${sk.name}`); cbSkill(u,sk,pw,tg,es,pops); break; }
  }
  if(cd.k!=='echo') CB.last=cd;
  if((ty==='atk'||(cd.k==='skill'&&['dmg','aoe'].includes(u.c.skill.kind)))&&CB.rage){ CB.block+=CB.rage; pops.push(['cbLead','🛡+'+nf(CB.rage),'heal']); }
  if(ty==='atk'||(cd.k==='skill'&&['dmg','aoe'].includes(u.c.skill.kind))){ CB.atkN++; if(L.role==='atk'&&CB.atkN%3===0){ const t2=cbAliveE()[0]; if(t2){ cbHitE(L,t2,0.8,pops); cbLog(`${L.name}의 맹공!`); } } }
  CB.ult=Math.min(ULT_MAX,CB.ult+1);
  if(CB.played===4&&rgCount('chain4')){ CB.energy+=rgCount('chain4'); cbLog('연쇄 반응! 에너지 +1'); }
  if(CB.played===6&&rgCount('tempo')){ cbDraw(2*rgCount('tempo')); cbLog('리듬! 카드 2장'); }
  cbRender(); pops.forEach(p=>cbFx(...p)); if(!cbAliveE().length) setTimeout(()=>cbEnd(true),500); }
function cbEnd(win){ if(!CB||CB.over) return; CB.over=true; CB.busy=true; cbRender(); const L=cbLead();
  B={ctx:{kind:'rogue',node:CB.kind},allies:[{c:L.c,hp:L.hp,maxhp:L.maxhp}],enemies:[],over:true,s:{}};
  bump('battle'); bResultShow(rogueEnd(win),'.cb'); CB=null; }
function dgEnter(run){ const c=run.map.cells[run.pos]; run.msg=''; if(c.done&&c.t!=='stairs'&&c.t!=='boss'){ mark('prog'); render(); return; }
  const t=c.t;
  if(t==='battle'||t==='elite'||t==='boss'){ mark('prog'); if(run.mode!=='auto') cbStart(t); else rgBattle(t); return; }
  if(t==='stairs'){ run.msg='아래로 이어지는 계단이에요.'; mark('prog'); render(); return; }
  c.done=true;
  if(t==='treasure'){ run.pick=rgPick3(run); run.msg='유물 상자를 찾았어요!'; }
  if(t==='rest'){ run.rest=true; run.msg='조용한 야영지예요. 무엇을 할까요?'; }
  if(t==='event'){ const x=Math.random();
    if(x<0.25){ run.squad.forEach(id=>{ if(run.hp[id]>0) run.hp[id]=Math.min(1,run.hp[id]+0.4); }); run.msg='맑은 샘을 찾았어요. 체력이 크게 회복됐어요.'; }
    else if(x<0.5&&run.mode==='card'){ run.cpick=cardOffer(run); run.msg='쓰러진 탐사대의 전술 기록을 찾았어요. 카드 1장을 고를 수 있어요.'; }
    else if(x<0.7){ if(Math.random()<0.5){ run.pick=rgPick3(run); run.msg='수상한 상자에서 유물이 나왔어요!'; } else { run.squad.forEach(id=>{ if(run.hp[id]>0) run.hp[id]=Math.max(0.05,run.hp[id]-0.2); }); run.msg='함정이었어요! 모두 체력 -20%.'; } }
    else if(x<0.85){ const m=run.map; m.cells.forEach((cc,i)=>{ if(cc) cc.seen=true; }); run.msg='낡은 지도를 주웠어요. 이 구역의 구조가 모두 드러났어요.'; }
    else { run.relics.push('train'); run.msg='잠깐의 실전 훈련. 공격 +5%.'; } }
  mark('prog'); render(); }
// 심연 탐사 전용 화면(진행 중일 때 화면 전체를 써요)
/* 탐사 끝내기(Controller): 정산 뒤 결과 창 */
function rgAbandon(why){ const html=rgFinish(false); setTimeout(()=>openRgResult(html,'탐사가 끝났어요',why),0); }
/* 탐사 전투 끝(Controller): 정산 → 보스 승리·패배면 탐사 끝, 아니면 효과음 → 결과 */
function rogueEnd(win){ const R=rogueSettle(win); if(R&&R.finish) return rgFinish(R.done); if(R) sfx('승리'); return rogueResultHTML(R); }
/* 탐사 끝(Controller): 정산 → 효과음 → 결과 */
function rgFinish(done){ const R=rgFinishSettle(done); sfx(done?'SSR':'확인'); return rgFinishHTML(R); }
function rgNode(kind){ const g=progSlot('rogue'), run=g.run; if(!run) return;
  if(kind==='battle'||kind==='elite'||kind==='boss'){ rgBattle(kind); return; }
  let msg='';
  if(kind==='rest'){ run.squad.forEach(id=>{ run.hp[id]=Math.min(1,(run.hp[id]>0?run.hp[id]+0.35:0.25)); }); msg='모두 숨을 돌렸어요. 체력을 회복하고 쓰러진 대원이 일어났어요.'; }
  if(kind==='treasure'){ run.pick=rgPick3(run); msg='유물 상자를 찾았어요!'; }
  if(kind==='event'){ const x=Math.random();
    if(x<0.34){ run.squad.forEach(id=>{ if(run.hp[id]>0) run.hp[id]=Math.min(1,run.hp[id]+0.5); }); msg='맑은 샘을 찾았어요. 체력이 크게 회복됐어요.'; }
    else if(x<0.67){ if(Math.random()<0.5){ run.pick=rgPick3(run); msg='수상한 상자에서 유물이 나왔어요!'; } else { run.squad.forEach(id=>{ if(run.hp[id]>0) run.hp[id]=Math.max(0.05,run.hp[id]-0.2); }); msg='수상한 상자가 폭발했어요. 모두 체력 -20%.'; } }
    else { run.relics.push('train'); msg='잠깐의 실전 훈련. 공격 +5%.'; } }
  run.floor++; run.opts=rgOpts(run); run.msg=msg; mark('prog'); render(); }
/* src/main/0110-challenge/0125-tower.js에서 옮김 */
function towerGo(tid){ const t=towerById(tid); if(!t) return; const fl=((progRead('tower')[tid]||{}).best||0)+1, st=towerStage(tid,fl);
  if(t.allow&&!G.chars.some(c=>own(c.id)&&t.allow(c))){ toast(`${t.desc} — 출전할 수 있는 ${T('crew')}이(가) 없어요`); return; }
  squadSel=null; FORM=null; openFormation(st,{kind:'tower',tid,floor:fl,allow:t.allow,code:'',extra:`data-v="${esc(tid)}"`},'towerstart'); }
/* 탑 끝(Controller): 정산 → 효과음 → 결과 */
function towerEnd(win){ const R=towerSettle(win); sfx(win?'승리':'패배'); return towerResultHTML(R); }
/* src/main/0110-challenge/0488-stage-modes.js에서 옮김 */
function modeClear(ch,s,stars){ const p=P(), first=!p.cleared[s.id]; p.cleared[s.id]=true; p.stars=p.stars||{}; p.stars[s.id]=Math.max(p.stars[s.id]||0,stars);
  if(first){ if(ch.kind==='event'){ const ev=G.events.find(e=>e.id===ch.eventId); giveReward({token:s.reward*2},ev&&ev.id); } else { giveReward(rateR({gems:s.reward,gold:2000})); gateCheck(); recruitCheck(ch,s); } newBonds(s); }
  mark('prog'); closeModal(); const after=()=>{ render(); checkTriggers(); }; if(first&&s.post) playStory(s.title,s.post,after); else after(); toast(`${s.title} 클리어 ${'★'.repeat(stars)}`); }
function debateHit(text){ const d=MD.s.debate; MD.log.push(text); MD.r++; MD.i=0; MD.pressed={}; sfx('확인'); if(MD.r>=d.rounds.length){ const st=MD.hp===d.hp?3:MD.hp>=Math.ceil(d.hp/2)?2:1, {ch,s}=MD; MD=null; playStory('회담 성공',[`${T('player')}: ${text}`,d.win?`${d.opponent}: ${d.win}`:''].filter(Boolean).join('\n'),()=>modeClear(ch,s,st)); return; } debateDraw(`돌파! ${text}`); }
function debateMiss(msg){ MD.hp--; sfx('타격'); if(MD.hp<=0){ const d=MD.s.debate; MD=null; closeModal(); toast('회담 실패 — 증거와 주장을 다시 살펴보세요'); if(d.lose) playStory('회담 실패',`${d.opponent}: ${d.lose}`,()=>render()); return; } debateDraw(msg); }
function contestAppeal(cid,k){ const e=MD.ent.find(x=>x.id===cid); if(!e) return; const j=contestPref(MD.round), cm=charmOf(e), fit=k===j.likes, same=MD.last===cid;
  MD.hype=same?0:Math.min(4,MD.hype+(fit?1:0)+(MD.last&&!same?1:0)); const pts=Math.round(cm[k]*(fit?1.6:1)*(1+.12*MD.hype)*(.9+Math.random()*.2)); MD.score+=pts; MD.last=cid;
  const ref=Math.round(Object.values(charmOf(MD.ent[0])).reduce((a,b)=>a+b,0)/5*1.25); MD.rivals.forEach(r=>{ r.score+=Math.round(ref*r.power*(.85+Math.random()*.3)); });
  MD.round++; const msg=`${e.name}의 ${CHARM[k]} 어필 +${pts}${fit?' (취향 적중!)':''}${same?' · 분위기가 식었어요':''}`;
  if(MD.round<MD.s.contest.rounds){ sfx(fit?'확인':'알림'); contestDraw(msg); return; }
  const best=Math.max(0,...MD.rivals.map(r=>r.score)), mine=MD.score, win=mine>best, {ch,s}=MD, margin=best?mine/best:2; MD=null;
  if(!win){ closeModal(); toast(`콘테스트 결과: 우리 ${nf(mine)} · 1위 ${nf(best)} — 출전자와 어필을 바꿔 다시 도전해 보세요`); return; }
  modeClear(ch,s,margin>=1.3?3:margin>=1.1?2:1); }
/* src/main/0110-challenge/070-combat-and-formation.js에서 옮김 */
async function handleCombatAndFormationAction(a,t,id,p,e){
  switch(a){
case 'raidgo': { if(!raidTriesLeft()){ toast('오늘 도전 횟수를 다 썼어요'); break; } const b=raidBoss(); squadSel=null; FORM=null; openFormation({id:'raid',title:'레이드 · '+b.name,enemies:[b],reward:0,pre:'',post:''},{kind:'raid'},'raidstart'); break; }
case 'raidstart': { P().squad=[...squadSel]; const r=progSlot('raid'); r.tries[today()]=(r.tries[today()]||0)+1; mark('prog'); closeModal(); const b=raidBoss(), hp0=Math.max(1,b.total-r.dmg);
      startStage({id:'raid',title:'레이드 · '+b.name,enemies:[b],reward:0,pre:'',post:''},{kind:'raid',total:b.total,hp0,prep:(al,en)=>{ en[0].maxhp=b.total; en[0].hp=hp0; }}); break; }
case 'rgnew': { RGMODE='card'; RF=null; openRgForm(); break; }
case 'rfslot': RF.sel=+t.dataset.i; openRgForm(); break;
case 'rffil': RF.filter=t.dataset.v; openRgForm(); break;
case 'rfauto': RF.s=rfAuto(); RF.sel=0; openRgForm(); break;
case 'rfclr': RF.s=[null,null,null,null]; RF.sel=0; openRgForm(); break;
case 'rfpick': { const k=RF.s.indexOf(id), i=RF.sel; if(k===i) RF.s[i]=null; else { if(k>=0) RF.s[k]=RF.s[i]; RF.s[i]=id; } if(!RF.s[0]) RF.sel=0; else { const e=RF.s.indexOf(null); RF.sel=e>=0?e:RF.sel; } openRgForm(); break; }
case 'rfgo': { const ids=rfIds(); if(!ids.length) break; progSlot('rogue').lastSquad=ids; P().squad=[...ids]; closeModal(); try{ rgStart(ids,'card'); }catch(err){ console.error(err); progSlot('rogue').run=null; mark('prog'); toast('탐사를 시작하지 못했어요: '+(err&&err.message||err)); render(); } RF=null; abyssCardFocus(); break; }
case 'rgnode': { const run=progSlot('rogue').run; if(!run) break; run.msg=''; rgNode(t.dataset.v); break; }
case 'rgskip': { const run=progSlot('rogue').run; if(!run) break; run.pick=null; run.squad.forEach(id=>{ if(run.hp[id]>0) run.hp[id]=Math.min(1,run.hp[id]+0.1); }); run.msg='유물 대신 숨을 돌렸어요. 체력 10% 회복'; mark('prog'); render(); break; }
case 'rgrelic': { const run=progSlot('rogue').run; if(!run) break; run.relics.push(t.dataset.v); run.pick=null; run.msg=RELICS[t.dataset.v][0]+'을(를) 얻었어요'; mark('prog'); render(); break; }
case 'dgmove': dgMove(+t.dataset.v); break;
case 'dgdown': { const run=progSlot('rogue').run; if(run&&run.v===2&&run.map.cells[run.pos].t==='stairs') dgDescend(run); break; }
case 'rgcard': { const run=progSlot('rogue').run; if(!run||!run.cpick) break; const i=+t.dataset.i; if(i>=0&&run.cpick[i]){ run.deck.push(run.cpick[i]); run.msg=`「${cardName(run.cpick[i])}」 카드를 덱에 넣었어요`; } run.cpick=null; mark('prog'); render(); break; }
case 'rgrest': { const run=progSlot('rogue').run; if(!run) break; const v=t.dataset.v; run.rest=false;
      if(v==='heal'){ run.squad.forEach(id=>{ run.hp[id]=Math.min(1,(run.hp[id]>0?run.hp[id]+0.35:0.25)); }); run.msg='모닥불 곁에서 푹 쉬었어요. 쓰러진 대원도 일어났어요.'; }
      else if(v==='upg') run.upg=true; else if(v==='rm') run.rm=true; else { run.relics.push('train'); run.msg='훈련으로 공격 +5%'; }
      mark('prog'); render(); break; }
case 'rgupg': { const run=progSlot('rogue').run; if(!run) break; const i=+t.dataset.i; run.upg=false; if(i<0) run.rest=true; else if(run.deck[i]){ run.deck[i].up=true; run.msg=`「${cardName(run.deck[i])}」(으)로 강화했어요`; } mark('prog'); render(); break; }
case 'rgrm': { const run=progSlot('rogue').run; if(!run) break; const i=+t.dataset.i; if(i>=0&&run.deck.length<=8){ toast('덱은 8장보다 적게 줄일 수 없어요'); break; } run.rm=false; if(i<0) run.rest=true; else if(run.deck[i]){ const cd=run.deck.splice(i,1)[0]; run.msg=`「${cardName(cd)}」 카드를 뺐어요`; } mark('prog'); render(); break; }
case 'rgdeck': { const run=progSlot('rogue').run; if(run&&run.deck) rgDeckModal(run.deck); break; }
case 'cbplay': cbPlay(+t.dataset.i); break;
case 'cbsel': if(CB&&!CB.busy&&!CB.over){ const i=+t.dataset.i; if(i>=0&&CB.sel===i){ const cd=CB.hand[i]; if(cd&&cardCost(cd)<=CB.energy&&!(cd.k==='echo'&&!CB.last)) cbPlay(i); } else { CB.sel=i; cbRender(); } } break;
case 'cbult': cbUlt(); break;
case 'cbend': cbEndTurn(); break;
case 'cbtgt': if(CB&&!CB.busy){ const e=CB.enemies[+t.dataset.i]; if(e&&e.hp>0){ CB.tgt=e.i; cbRender(); } } break;
case 'cbdeck': if(CB) rgDeckModal(CB.run.deck); break;
case 'cbquit': if(CB&&!CB.over&&(await appConfirm('후퇴하면 이번 탐사가 끝나요. 지금까지의 보상은 받아요.'))) cbEnd(false); break;
case 'rgsave': { const run=progSlot('rogue').run; if(!run||!run.rest) break; run.saved=Date.now(); delete run.left; run.wk=run.wk||weekKey(); run.msg='야영지에서 쉬다가 탐사를 이어가요.'; mark('prog'); tab='challenge'; render(); toast(`탐사를 저장했어요. 도전 → ${T('abyss')}에서 이어서 할 수 있어요`); break; }
case 'rgleave': { const run=progSlot('rogue').run; if(!run){ tab='challenge'; render(); break; } if(!(await appConfirm('지금 나가면 이번 탐사가 끝나요(지금까지 간 만큼 보상은 받아요).\n저장은 야영지의 \'저장하고 나가기\'로만 할 수 있어요. 나갈까요?'))) break; const html=rgFinish(false); tab='challenge'; render(); openRgResult(html); break; }
case 'rgquit': { if(!(await appConfirm('탐사를 끝낼까요? 지금까지의 진척에 따라 보상을 받아요.'))) break; const html=rgFinish(false); openRgResult(html); render(); break; }
case 'opskip': e.stopPropagation(); opEnd(); break;
case 'stage': { const ch0=G.chapters.find(x=>x.id===t.dataset.ch), s0=ch0&&ch0.stages.find(x=>x.id===t.dataset.st); if(s0&&s0.story){ openStoryStage(ch0,s0); break; } if(s0&&(s0.mode==='debate'||s0.mode==='contest')){ openModeStage(ch0,s0); break; } if(s0&&SORTIE()&&SORTIE().st===s0.id){ sortieMap('진행 중인 출격을 이어 가요'); break; } squadSel=null; FORM=null; openStage(t.dataset.ch,t.dataset.st); break; }
case 'sortie': { p.squad=[...squadSel]; mark('prog'); const ch=G.chapters.find(x=>x.id===t.dataset.ch),s=ch.stages.find(x=>x.id===t.dataset.st); closeModal();
      if(!p.cleared[s.id]&&s.pre) playStory(s.title,s.pre,()=>startBattle(ch.id,s.id)); else startBattle(ch.id,s.id); break; }
case 'bauto': B.auto=!B.auto; chipOn(t,B.auto); break;
case 'bspeed': if(B?.ctx.kind==='practice'){B.speed=B.speed>=3?1:B.speed+1;bSpeedShow(t);bRun();break;}B.speed=B.speed>=3?1:B.speed+1; P().settings.bspeed=B.speed; mark('prog'); bSpeedShow(t); bRun(); break;
case 'bdone': { if(B&&(B.ctx.kind==='raid'||B.ctx.kind==='rogue')){ const rg=B.ctx.kind==='rogue'; B=null; closeOv(); tab=rg&&progRead('rogue').run?'abyss':'challenge'; render(); break; }
      const win=t.dataset.win==='1',first=t.dataset.first==='1',s=B.s; B=null; closeOv(); render();
      if(win&&first&&s.post) playStory(s.title,s.post,()=>{render();checkTriggers();}); else checkTriggers(); break; }
case 'opsch': OPS_CH=t.dataset.ch; render(); viewTop(); break;
case 'opsback': OPS_CH=null; render(); break;
case 'fpick': { const i=squadSel.indexOf(id), added=i<0; const x=e.clientX||innerWidth/2, y=e.clientY||innerHeight/2;
      if(i>=0) squadSel.splice(i,1); else if(squadSel.length<4) squadSel.push(id); else {toast('최대 4명까지 편성할 수 있어요');break;}
      modalKeep(refreshForm); ripple(x,y,false);
      if(added){ const c=charById(id), l=formJoinShow(c); if(l&&c.voiceId&&SND().voiceLobby) speak(c,l); }
      break; }
case 'fsl': refreshForm(); break;
case 'fauto': squadSel=autoSquad(FORM.stage); refreshForm(); break;
case 'ffil': FORM.filter=t.dataset.v; refreshForm(); break;
case 'fsave': { const i=+(prompt('몇 번에 저장할까요? (1~3)','1')||0)-1; if(!(i>=0&&i<3)) break; P().presets=P().presets||[]; P().presets[i]=[...squadSel]; mark('prog'); toast(`편성 ${i+1}에 저장했어요`); refreshForm(); break; }
case 'fpre': { const pr=(P().presets||[])[+t.dataset.i]; if(!pr||!pr.length){toast('저장된 편성이 없어요');break;} const busy=busyIds(); squadSel=pr.filter(x=>own(x)&&charById(x)&&!busy.has(x)).slice(0,4); refreshForm(); break; }
case 'farmgo': { const st=farmStage(t.dataset.k,+t.dataset.lv); squadSel=null; FORM=null; openFarmSquad(st); break; }
case 'farmstart': { P().squad=[...squadSel]; mark('prog'); closeModal(); startStage(farmStage(t.dataset.k,+t.dataset.lv),{kind:'farm'}); break; }
  }
}
