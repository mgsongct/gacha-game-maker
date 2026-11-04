/* ===== 0110-challenge — Model(상태·규칙·저장·외부 서비스) ===== */
/* src/main/0110-challenge/0110-challenge-raid.js에서 옮김 */
function progK(){ const main=G.chapters.filter(ch=>ch.kind==='main'); let k=0; main.forEach((ch,i)=>{ if(ch.stages.some(s=>P().cleared[s.id])) k=i; }); return k; }
function hashN(s){ let h=0; for(const ch of String(s)) h=(h*31+ch.charCodeAt(0))|0; return Math.abs(h); }
/* 주간 레이드 새로 만들기(주가 바뀌면): 지난주 결과로 단계 오르내림(처치 +1, 절반 못 깎음 −1, 1~6) — 진행 칸 raid의 정의(0070 PROG_SLOTS)가 부름 */
function raidNew(r){ r=progObj(r)?r:null; const pr=r&&r.total?r.dmg/r.total:0; const lv=r?Math.max(1,Math.min(6,(r.lv||1)+(r.killed?1:pr<0.5?-1:0))):1; return {wk:weekKey(),lv,dmg:0,killed:false,got:[],tries:{},best:0}; }
/* 이번 주 레이드 보스(순수 — 진행 칸 r을 읽기만): 총 체력은 칸에 정해 둔 값, 없으면 보스 체력의 30배 */
function raidBossOf(r){ const pool=[], bgOf={}; G.chapters.filter(ch=>ch.kind==='main').forEach(ch=>ch.stages.forEach(s=>(s.enemies||[]).forEach(e=>{ if(e.boss&&!pool.some(x=>x.name===e.name)){ pool.push(e); bgOf[e.name]=stageBg(s); } })));
  const src=pool.length?pool[hashN(r.wk)%pool.length]:{name:'거대 잔광',elem:ELEMS[0]}; const b=fitEnemy({name:src.name,elem:ELEMS[hashN(r.wk+'e')%ELEMS.length],hp:3000,atk:110,def:50,spd:95,boss:true,bg:bgOf[src.name]||''},enemyTarget(progK()+(r.lv-1)*0.6,6,true)*1.3);
  const total=r.total||b.hp*30, k=total/30/b.hp; return {...b,hp:Math.round(total/30),atk:Math.round(b.atk*Math.min(1.5,Math.max(0.7,k))),total}; }
function raidBoss(){ return raidBossOf(progRead('raid')); } // 읽기 — 칸 맞춤은 raidFill
/* 레이드 칸 맞춤(PROG_SLOTS raid fill — progSlot·그리기 전 처리가 부름): 총 체력을 정해 두고, 총 체력보다 덜 깎았는데 처치로 남은 표시는 끔 */
function raidFill(r){ let ch=false; if(!r.total){ r.total=raidBossOf(r).total; ch=true; } if(r.killed&&r.dmg<r.total){ r.killed=false; ch=true; } if(ch) mark('prog'); }
function raidTriesLeft(){ const r=progRead('raid'); return Math.max(0,3-(r.tries[today()]||0)); }
/* 레이드 정산(Model): 이번 피해·누적 피해·달성 보상·참가 대원 경험치 */
function raidSettle(win){ const r=progSlot('raid'), b=B.enemies[0], dealt=Math.max(0,Math.round((B.ctx.hp0||0)-b.hp)); r.dmg=Math.min(B.ctx.total,r.dmg+dealt); r.best=Math.max(r.best||0,dealt);
  const ratio=r.dmg/B.ctx.total; if(ratio>=1) r.killed=true; let got={}; RAID_MS.forEach(([t,rw],i)=>{ if(ratio>=t&&!r.got.includes(i)){ r.got.push(i); giveReward(rw); Object.entries(rw).forEach(([k,v])=>got[k]=(got[k]||0)+v); } });
  B.allies.forEach(u=>{ const o=own(u.c.id); if(o) gainExp(o,expR(80)); }); mark('prog'); const nx=RAID_MS.find(([t],i)=>!r.got.includes(i)); return {killed:!!r.killed,dealt,ratio,got,next:nx?nx[0]:null}; }
/* src/main/0110-challenge/0120-abyss.js에서 옮김 */
function dgGen(floor){
  const W=DG_W,H=DG_H,N=W*H,start=(H-1)*W+Math.floor(W/2), inS=new Set([start]), links=new Set(), lk=(a,b)=>a<b?a+'-'+b:b+'-'+a;
  const nb=i=>{ const x=i%W,y=Math.floor(i/W),o=[]; if(x>0)o.push(i-1); if(x<W-1)o.push(i+1); if(y>0)o.push(i-W); if(y<H-1)o.push(i+W); return o; };
  const want=Math.min(N-3,11+floor); let guard=0;
  while(inS.size<want&&guard++<3000){ const a=[...inS][Math.floor(Math.random()*inS.size)], b=rand(nb(a)); if(inS.has(b)) continue; inS.add(b); links.add(lk(a,b)); }
  let extra=0; for(const a of inS){ for(const b of nb(a)){ if(extra<2&&inS.has(b)&&!links.has(lk(a,b))&&Math.random()<0.12){ links.add(lk(a,b)); extra++; } } }
  const dist={[start]:0}, q=[start]; while(q.length){ const a=q.shift(); nb(a).forEach(b=>{ if(links.has(lk(a,b))&&dist[b]==null){ dist[b]=dist[a]+1; q.push(b); } }); }
  const rooms=[...inS], far=rooms.reduce((m,i)=>dist[i]>dist[m]?i:m,start);
  const cells=Array.from({length:N},(_,i)=>inS.has(i)?{t:'empty',done:false,seen:false,vis:false}:null);
  cells[start]={t:'start',done:true,seen:true,vis:true}; cells[far].t=floor>=DG_FLOORS?'boss':'stairs';
  const rest=rooms.filter(i=>i!==start&&i!==far).sort(()=>Math.random()-.5);
  const bag=[]; if(floor>=2) bag.push('elite'); if(floor>=3) bag.push('elite'); bag.push('treasure','rest','event','event'); if(floor===1) bag.push('treasure');
  while(bag.length<rest.length) bag.push(Math.random()<0.62?'battle':'empty');
  const near=rest.filter(i=>dist[i]<=1); near.forEach(i=>{ cells[i].t='battle'; });
  let bi=0; rest.forEach(i=>{ if(dist[i]<=1) return; cells[i].t=bag[bi++]||'empty'; });
  if(!rest.some(i=>cells[i].t==='battle')&&rest.length) cells[rest[0]].t='battle';
  const map={w:W,h:H,cells,links:[...links],start,stairs:far}; dgReveal(map,start); return map; }
function dgLinked(map,a,b){ const k=a<b?a+'-'+b:b+'-'+a; return map.links.includes(k); }
function dgNb(map,i){ const W=map.w,x=i%W,y=Math.floor(i/W),o=[]; if(x>0)o.push(i-1); if(x<W-1)o.push(i+1); if(y>0)o.push(i-W); if(y<map.h-1)o.push(i+W); return o.filter(b=>map.cells[b]&&dgLinked(map,i,b)); }
function dgReveal(map,i){ const c=map.cells[i]; c.vis=true; c.seen=true; dgNb(map,i).forEach(b=>{ map.cells[b].seen=true; }); }
function dgPath(map,from,to){ const prev={[from]:-1}, q=[from]; while(q.length){ const a=q.shift(); if(a===to) break; dgNb(map,a).forEach(b=>{ if(prev[b]==null&&(map.cells[b].vis||b===to)){ prev[b]=a; q.push(b); } }); } if(prev[to]==null) return null; const p=[]; for(let x=to;x!==-1;x=prev[x]) p.unshift(x); return p; }
function rgEq(run,kind){ if(kind==='boss') return RG_FLOORS; return Math.min(RG_FLOORS,(run.floor-1)*3+1+Math.min(2,run.fw||0)); }
function rgScore(run){ return Math.min(RG_FLOORS,(run.floor-1)*3+Math.min(3,run.fw||0)); }
function pixSprite(c){ const src=charSrc(c); if(!src) return Promise.resolve(null); const key=c.id+'|'+src; if(PIX[key]) return PIX[key];
  PIX[key]=new Promise(res=>{ const im=new Image(); im.onload=()=>{ try{
      const sw=im.naturalWidth, sh=im.naturalHeight, W=22, H=Math.round(W*Math.min(2.2,sh/sw*0.92)); const cv=document.createElement('canvas'); cv.width=W; cv.height=H; const x=cv.getContext('2d',{willReadFrequently:true});
      x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; const cw=sw*0.86; x.drawImage(im,(sw-cw)/2,0,cw,sh*0.97,0,0,W,H);
      const d=x.getImageData(0,0,W,H), p=d.data, at=(i)=>[p[i],p[i+1],p[i+2],p[i+3]];
      const corner=[0,(W-1)*4,(H-1)*W*4,((H-1)*W+W-1)*4].map(at), whiteBg=corner.every(q=>q[3]>200&&q[0]>225&&q[1]>225&&q[2]>225);
      for(let i=0;i<p.length;i+=4){ const wh=p[i]>228&&p[i+1]>228&&p[i+2]>228; if(p[i+3]<110||(whiteBg&&wh)){ p[i+3]=0; continue; } p[i+3]=255; for(let k=0;k<3;k++) p[i+k]=Math.min(255,Math.round(p[i+k]/42)*42+8); }
      const solid=(X,Y)=>X>=0&&Y>=0&&X<W&&Y<H&&p[(Y*W+X)*4+3]>0, out=new Uint8ClampedArray(p);
      for(let Y=0;Y<H;Y++) for(let X=0;X<W;X++){ const i=(Y*W+X)*4; if(p[i+3]) continue; if(solid(X-1,Y)||solid(X+1,Y)||solid(X,Y-1)||solid(X,Y+1)){ out[i]=18;out[i+1]=14;out[i+2]=28;out[i+3]=255; } }
      const o=document.createElement('canvas'); o.width=W; o.height=H; o.getContext('2d').putImageData(new ImageData(out,W,H),0,0); res(o.toDataURL());
    }catch(e){ res(null); } }; im.onerror=()=>res(null); im.src=src; });
  return PIX[key]; }
function rgDeck(squad){ const d=[], L=squad[0], lc=charById(L); if(!lc) return d;
  for(let i=0;i<4;i++) d.push({k:'strike',o:L}); for(let i=0;i<4;i++) d.push({k:'guard',o:L});
  squad.slice(1).forEach(id=>{ const c=charById(id); if(!c) return; const pool=ROLE_CARDS[c.role]||ROLE_CARDS.atk, h=hashN(c.id), a=pool[h%pool.length], b=pool[(h+1+(h>>3)%(pool.length-1))%pool.length];
    d.push({k:a,o:id},{k:b===a?pool[(pool.indexOf(a)+1)%pool.length]:b,o:id},{k:'skill',o:id}); });
  return d; }
function cardName(cd){ const c=charById(cd.o), df=CARD_DEF[cd.k]||CARD_DEF.strike; return (cd.k==='skill'?(c?c.skill.name:'스킬'):df.n)+(cd.up?'+':''); }
function cardCost(cd){ const df=CARD_DEF[cd.k]||CARD_DEF.strike; let c=cd.up&&df.cu!=null?df.cu:df.c; if(CB&&!CB.over){ if(CB.disc1) c--; if(CB.firstFree&&!CB.played) c--; } return Math.max(0,c); }
function cardType(cd){ const df=CARD_DEF[cd.k]||CARD_DEF.strike; if(cd.k==='skill'){ const c=charById(cd.o), k=c&&c.skill.kind; return k==='dmg'||k==='aoe'?'atk':k==='shield'?'def':'sup'; } return df.t; }
function cardIllObj(cd){ const c=charById(cd.o); if(!c) return null; if(cd.k==='skill'&&c.scg&&imgSrc(c.scg)) return c.scg; return c.cards&&c.cards[cd.k]&&imgSrc(c.cards[cd.k])?c.cards[cd.k]:null; }
function cardOffer(run){ const pool=CARD_REWARD.slice(), out=[]; const sup=run.squad.slice(1).map(charById).filter(Boolean), all=run.squad.map(charById).filter(Boolean);
  while(out.length<3&&pool.length){ const k=pool.splice(Math.floor(Math.random()*pool.length),1)[0];
    const pref=['wall','taunt','bulwark','counter','entrench','shieldbash','rage'].includes(k)?'def':['aid','focus','rally','revive','surge','expose','weaken','plan','echo','charge','sacrifice','hemorrhage','spread','overdrive'].includes(k)?'sup':'atk', base=sup.length?sup:all, pc=base.filter(c=>c.role===pref);
    out.push({k,o:(rand(pc.length?pc:base)||{}).id,up:Math.random()<0.12+0.06*run.floor}); }
  return out; }
function cbAtkVal(u,m,e){ if(!e&&CB){ const es=CB.enemies.filter(en=>en.hp>0); e=CB.enemies[CB.tgt]&&CB.enemies[CB.tgt].hp>0?CB.enemies[CB.tgt]:es[0]; } let v=u.atk*(CB?CB.str:1)*m; if(e){ v*=BEATS[u.elem]===e.elem?1.5:BEATS[e.elem]===u.elem?0.75:1; if(e.vul>0) v*=1.5; } return Math.max(1,Math.round(v)); }
function cbBlk(u,m){ return Math.round(u.maxhp*0.09*m); }
function cbSkillVal(u,sk,pw){ const k=sk.kind; if(k==='dmg') return cbAtkVal(u,pw*1.3); if(k==='aoe') return cbAtkVal(u,pw*0.9); if(k==='heal') return Math.round(u.maxhp*0.14*pw); if(k==='shield') return Math.round(u.maxhp*0.12*pw); return Math.min(0.6,0.2*pw); }
function cbEnemyDmg(e,m,a){ let v=e.dmg*e.str*m; if(e.weak>0) v*=0.7; v*=BEATS[e.elem]===a.elem?1.5:BEATS[a.elem]===e.elem?0.75:1; const dr=Math.min(1.35,Math.max(0.65,Math.pow((CB?CB.defA:a.def)/Math.max(1,a.def),0.35))); return Math.max(1,Math.round(v*dr)); }
function cbShuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function rgUnits(run,ids){ const m=id=>rgCount(id), fb=factionBonus(ids);
  return ids.map(charById).filter(Boolean).map((c,i)=>{ const st=stats(c), fr=run.hp[c.id]; const u={i,c,name:c.name,elem:c.elem,role:c.role,str:1};
    u.maxhp=Math.round(st.hp*(1+0.2*m('hp')+0.08*m('res'))); u.atk=Math.round(st.atk*(1+(fb[c.faction]||0)/100)*(1+0.15*m('atk')+0.08*m('res')+0.05*m('train'))); u.def=Math.round(st.def*(1+0.25*m('def'))); u.hp=Math.round(u.maxhp*(fr==null?1:fr)); return u; }); }
function cbLead(){ return CB.units[0]; }
function cbUnit(id){ return CB.units.find(u=>u.c.id===id)||CB.units[0]; }
function cbAliveE(){ return CB.enemies.filter(en=>en.hp>0); }
function cbDraw(n){ for(let k=0;k<n;k++){ if(CB.hand.length>=10) break; if(!CB.draw.length){ if(!CB.disc.length) break; CB.draw=cbShuffle(CB.disc); CB.disc=[]; } CB.hand.push(CB.draw.pop()); } }
function cbIntents(){ CB.enemies.forEach(en=>{ if(en.hp<=0) return; const r=Math.random(); let it;
    if(en.boss){ it=r<0.25?{k:'aoe',m:0.75}:r<0.42?{k:'heavy',m:2.0}:r<0.75?{k:'atk',m:1.15}:r<0.88?{k:'multi',m:0.6,n:2}:{k:'def'}; if(CB.turn===0&&it.k==='heavy') it={k:'atk',m:1.15}; }
    else it=r<0.58?{k:'atk',m:1.0}:r<0.73?{k:'multi',m:0.55,n:2}:r<0.88?{k:'def'}:{k:'buff'};
    if(it.k==='aoe') it={k:'atk',m:1.3};
    en.intent=it; }); }
function cbFanStyle(i,n,sel,si){ const o=i-(n-1)/2, sp=Math.min(54,250/Math.max(1,n-1)), r=o*Math.min(7,48/Math.max(1,n)), y=Math.abs(o)*Math.abs(o)*2.2;
  // 고른 카드는 그 자리에서 위로 올라오고, 양옆 카드는 살짝 비켜나요(화면 밖으로 나가지 않게)
  const half=(Math.min(innerWidth,620)/2)-62; let tx=o*sp; if(si!=null&&si>=0&&!sel) tx+=i<si?-16:16; if(sel) tx=Math.max(-half,Math.min(half,tx));
  return sel?`--tx:${tx}px;--ty:-58px;--r:0deg;z-index:30`:`--tx:${tx}px;--ty:${y}px;--r:${r}deg;z-index:${10+i}`; }
function cbHealLead(v,pops){ const L=cbLead(); L.hp=Math.min(L.maxhp,L.hp+v); pops.push(['cbLead','+'+nf(v),'heal']); }
/* 던전 칸으로 이동(Controller): 이동 시작(Model) → 걸어가는 연출(View) → 도착(Model) → 그 칸의 일 */
function dgMove(to){ const run=progSlot('rogue').run; if(!run||run.busy) return; const path=dgPath(run.map,run.pos,to); if(!path) return; dgWalkStart(run); dgHeroWalk(path,run.map.w,()=>{ dgArrive(run,to); dgEnter(run); }); }
/* 이동 시작·도착(Model) */
function dgWalkStart(run){ run.busy=true; }
function dgArrive(run,to){ run.busy=false; run.pos=to; dgReveal(run.map,to); }
function dgDescend(run){ run.floor++; run.fw=0; run.map=dgGen(run.floor); run.pos=run.map.start; run.msg=`제${run.floor}구역에 진입했어요.${run.floor>=DG_FLOORS?' 이 구역 어딘가에 보스가 있어요.':''}`; run.squad.forEach(id=>{ if(run.hp[id]>0) run.hp[id]=Math.min(1,run.hp[id]+0.1); }); mark('prog'); render(); }
// Translate only legacy system messages for display; never rewrite a saved run.
function rgMessage(run){
 const msg=String(run.msg||'');
 const legacy={'심연의 기운이 바뀌어 1층으로 돌아왔어요. 같은 탐사대로 처음부터 다시 내려가요.':'탐사 경로가 바뀌어 제1구역으로 돌아왔어요. 같은 탐사대로 처음부터 다시 시작해요.','낡은 지도를 주웠어요. 이 층의 구조가 모두 드러났어요.':'낡은 지도를 주웠어요. 이 구역의 구조가 모두 드러났어요.','야영지에서 쉬다가 다시 내려왔어요.':'야영지에서 쉬다가 탐사를 이어가요.'};
 if(Object.prototype.hasOwnProperty.call(legacy,msg))return legacy[msg];
 const m=msg.match(/^지하 (\d+)층에 내려왔어요\.( 이 층 어딘가에 보스가 있어요\.)?$/);
 return m?`제${m[1]}구역에 진입했어요.${m[2]?' 이 구역 어딘가에 보스가 있어요.':''}`:msg;
}
function rfIds(){ return RF.s[0]?RF.s.filter(Boolean):[]; }
function rfAuto(){ const busy=busyIds(), pool=G.chars.filter(c=>own(c.id)&&!busy.has(c.id)).sort((a,b)=>charPower(b)-charPower(a)); const out=[]; const L=pool.find(c=>c.role==='atk')||pool[0]; if(L) out.push(L.id);
  ['sup','def','atk'].forEach(r=>{ const c=pool.find(x=>x.role===r&&!out.includes(x.id)); if(c&&out.length<4) out.push(c.id); }); pool.forEach(c=>{ if(out.length<4&&!out.includes(c.id)) out.push(c.id); });
  return [0,1,2,3].map(i=>out[i]||null); }
/* 심연·도전 화면에 들어가기 전 처리(Controller — render가 그리기 전에 부름): 저장 없이 나간 탐사는 끝내고, 심연 화면은 탐사가 없으면 도전 화면으로·주가 바뀌면 같은 탐사대로 처음부터·저장 표시 지움, 예전 형식 탐사는 고를 유물이 비면 다시 뽑음 */
function rogueTick(){ if(tab!=='abyss'&&tab!=='challenge') return; const g=progSlot('rogue'), run=g.run;
  if(run&&run.v===2&&(run.left||(!RG_LIVE&&!run.saved))){ rgAbandon('야영지에서 저장하지 않고 나가서 탐사가 끝났어요. 저장은 야영지의 \'저장하고 나가기\'로만 할 수 있어요.'); if(tab==='abyss') tab='challenge'; return; }
  if(tab==='challenge'){ if(run&&run.v!==2&&run.pick&&!run.pick.filter(k=>RELICS[k]).length){ run.pick=rgPick3(run); mark('prog'); } return; }
  if(!run||run.v!==2){ tab='challenge'; return; }
  RG_LIVE=true; if(!run.wk){ run.wk=weekKey(); mark('prog'); }
  if(run.wk!==weekKey()){ const sq=run.squad.slice(), html=rgFinish(false); rgRunNew(sq,'card'); progSlot('rogue').run.msg='탐사 경로가 바뀌어 제1구역으로 돌아왔어요. 같은 탐사대로 처음부터 다시 시작해요.'; mark('prog'); setTimeout(()=>openRgResult(html,'탐사 경로가 바뀌었어요','지난주 탐사는 여기까지예요. 제1구역부터 다시 시작해요.'),0); }
  if(run.saved){ delete run.saved; mark('prog'); } }
function rgCount(id){ const run=progRead('rogue').run; return run?run.relics.filter(x=>x===id).length:0; }
function rgOpts(run){ if(run.floor>=RG_FLOORS) return ['boss']; const w=[['battle',45],['elite',15],['rest',15],['treasure',10],['event',15]]; const out=[]; let guard=0;
  while(out.length<3&&guard++<40){ let x=Math.random()*100; const k=w.find(([_,p])=>(x-=p)<0)[0]; if(!out.includes(k)) out.push(k); } if(!out.includes('battle')&&!out.includes('elite')) out[0]='battle'; return out; }
function rgPick3(run){ const take=(arr,n)=>{ const a=[...arr], o=[]; while(o.length<n&&a.length) o.push(a.splice(Math.floor(Math.random()*a.length),1)[0]); return o; };
  if(run.c3){ const fresh=CRELICS.filter(k=>!run.relics.includes(k)||['atk','hp','loot'].includes(k)); return take(fresh.length>=3?fresh:CRELICS,3); }
  let out=take(Object.keys(RELICS).filter(k=>k!=='train'&&!run.relics.includes(k)),3);
  if(out.length<3) out.push('train');
  if(out.length<3) out=out.concat(take(Object.keys(RELICS).filter(k=>k!=='train'&&!out.includes(k)),3-out.length));
  return out; }
function rgEnemies(run,kind){ const pool=[]; G.chapters.filter(ch=>ch.kind==='main').forEach(ch=>ch.stages.forEach(s=>(s.enemies||[]).forEach(e=>{ if(!pool.some(x=>x.name===e.name)) pool.push(e); })));
  const pick=boss=>{ const c=pool.filter(e=>!!e.boss===boss); const src=(c.length?c:pool)[Math.floor(Math.random()*(c.length||pool.length||1))]||{name:'미확인 적',elem:ELEMS[0]}; return {name:src.name,elem:src.elem||ELEMS[0],hp:900,atk:85,def:35,spd:92,boss}; };
  const k=run.k+run.floor*0.12, i=run.floor*0.5; let en;
  if(kind==='boss') en=[fitEnemy(pick(true),enemyTarget(k,i,true)*1.4),fitEnemy(pick(false),enemyTarget(k,i,false))];
  else if(kind==='elite') en=[fitEnemy(pick(true),enemyTarget(k,i,true)*0.9),fitEnemy(pick(false),enemyTarget(k,i,false)*0.9)];
  else en=Array.from({length:2+(Math.random()<0.5?1:0)},()=>fitEnemy(pick(false),enemyTarget(k,i,false)*0.85));
  return en; }
/* 탐사 새로 만들기(Model) */
function rgRunNew(ids,mode){ const g=progSlot('rogue'); mode=mode||'card'; const map=dgGen(1); RG_LIVE=true; g.run={v:2,c3:1,wk:weekKey(),mode:'card',floor:1,fw:0,squad:ids,hp:Object.fromEntries(ids.map(id=>[id,1])),relics:[],deck:mode==='card'?rgDeck(ids):[],map,pos:map.start,pick:null,cpick:null,k:progK(),at:Date.now(),msg:mode==='card'?'카드 전투 탐사를 시작해요. 매 턴 에너지 3으로 카드를 써요. 적 머리 위의 표시가 다음 행동이에요.':'탐사를 시작해요.'}; mark('prog'); }
/* 탐사 시작(Controller): 새로 만들고 심연 화면으로 */
function rgStart(ids,mode){ rgRunNew(ids,mode); tab='abyss'; render(); }
function rgBattle(kind){ const run=progSlot('rogue').run; const en=rgEnemies(run.v===2?{k:run.k,floor:rgEq(run,kind)}:run,kind); const s={id:'rg_'+run.floor,title:`${T('abyss')} · ${run.floor}구역 · ${RG_NODE[kind][1]}`,enemies:en,pre:'',post:''};
  const m=id=>rgCount(id);
  startStage(s,{kind:'rogue',node:kind,squad:run.squad,burst0:m('burst')?40:0,prep:(al)=>{ al.forEach(u=>{ const fr=run.hp[u.c.id]; const hpM=1+0.2*m('hp')+0.08*m('res');
      u.maxhp=Math.round(u.maxhp*hpM); u.atk=Math.round(u.atk*(1+0.15*m('atk')+0.08*m('res')+0.05*m('train'))); u.def=Math.round(u.def*(1+0.25*m('def'))); u.spd=Math.round(u.spd*(1+0.1*m('spd'))); u.hp=Math.round(u.maxhp*(fr==null?1:fr)); }); }}); }
/* 탐사 전투 정산(Model): 체력 이어 가기(응급 키트 회복)·경험치, 이긴 칸 표시·유물/카드 고르기, 예전 형식은 다음 구역 */
function rogueSettle(win){ const g=progSlot('rogue'), run=g.run; if(!run) return null;
  const heal=0.15*rgCount('heal'); B.allies.forEach(u=>{ run.hp[u.c.id]=u.hp>0?Math.min(1,u.hp/u.maxhp+heal):0; const o=own(u.c.id); if(o&&win) gainExp(o,expR(40)); });
  const node=B.ctx.node; if(!win||node==='boss') return {finish:true,done:win&&node==='boss'};
  if(run.v===2){ const cell=run.map.cells[run.pos]; if(cell) cell.done=true; run.fw=(run.fw||0)+(node==='elite'?2:1); if(node==='elite') run.pick=rgPick3(run); if(run.mode==='card') run.cpick=cardOffer(run); run.msg=''; mark('prog'); return {v:2,node,card:run.mode==='card',heal}; }
  run.floor++; run.opts=rgOpts(run); if(node==='elite') run.pick=rgPick3(run); mark('prog'); return {v:1,node,floor:run.floor,heal}; }
function rgReward(f,done,prev,won){ prev=prev||0; const nf2=Math.max(0,f-prev); let r={gold:1200*f,exp:3*f,wmat:2*f,core:Math.floor(f/3)+(done?5:0),gift:Math.floor(f/4)+(done?2:0)}; const m=(1+0.3*rgCount('loot'))*(progRead('rogue').n>=2?0.25:1); Object.keys(r).forEach(k=>r[k]=Math.round(r[k]*m)); const gm=40*nf2+(done&&!won?500:0); if(gm) r.gems=gm; return r; }
/* 탐사 끝 정산(Model): 진척에 따른 보상(오늘 3번째부터 25%·최고 기록 갱신 때만 재화), 기록, 탐사 비움 */
function rgFinishSettle(done){ const g=progSlot('rogue'), run=g.run, f=done?RG_FLOORS:run.v===2?rgScore(run):run.floor-1; if(g.day!==today()){ g.day=today(); g.n=0; } const r=rgReward(f,done,g.best||0,!!g.won); giveReward(r); g.n++; g.best=Math.max(g.best||0,f); if(done) g.won=true; g.run=null; mark('prog'); return {done,v:run.v,floor:run.floor,f,n:g.n,r}; }
/* src/main/0110-challenge/0125-tower.js에서 옮김 */
function towerList(){ const L=[{id:'all',name:'시련의 탑',desc:'누구나 출전',allow:null}];
  ruleFacs().forEach(f=>L.push({id:'f:'+f,name:`${f}의 탑`,desc:`${f} 소속만 출전`,allow:c=>c.faction===f}));
  ELEMS.forEach(elem=>L.push({id:'e:'+elem,name:`${elem}의 탑`,desc:`${elem} 속성만 출전`,allow:c=>c.elem===elem}));
  return L; }
function towerById(id){ return towerList().find(t=>t.id===id); }
function towerPool(boss){ const out=[]; G.chapters.forEach(ch=>(ch.stages||[]).forEach(s=>(s.enemies||[]).forEach(e=>{ if(!!e.boss===!!boss&&!out.some(x=>x.name===e.name)) out.push(e); }))); return out; }
function towerStage(tid,floor){ const t=towerById(tid)||towerById('all'), h=hashN(tid+'#'+floor), boss=floor%5===0, k=(floor-1)*.4;
  const pool=towerPool(false), bp=towerPool(true), foeElem=tid.startsWith('e:')?(ELEMS.find(elem=>BEATS[tid.slice(2)]===elem)||ELEMS[0]):null;
  const mk=(src,i,b)=>{ const e={name:(src&&src.name)||(b?'탑의 수호자':'탑의 파수꾼'),look:src&&src.look,elem:foeElem&&i%2===0?foeElem:ELEMS[(h+i)%ELEMS.length],hp:900,atk:90,def:40,spd:92+Math.min(40,floor),boss:!!b}; return fitEnemy(e,enemyTarget(k,i,!!b)); };
  const n=boss?2:Math.min(4,2+Math.floor(floor/10)), en=[]; for(let i=0;i<n;i++) en.push(mk(pool[(h+i*7)%Math.max(1,pool.length)],i,false)); if(boss) en.push(mk(bp[h%Math.max(1,bp.length)],n,true));
  const s={id:`tower_${tid}_${floor}`,title:`${t.name} ${floor}층`,enemies:en,reward:0,pre:'',post:''};
  stageAutoRules(s,floor%3===1?0:1,boss?2:9); return s; }
function towerReward(floor){ return floor%5===0?{gems:80,gold:3000+floor*300,core:2}:{gems:20,gold:1500+floor*150}; }
/* 탑 정산(Model): 첫 돌파 기록·보상, 참가 대원 경험치 */
function towerSettle(win){ const c=B.ctx, T0=progSlot('tower'), rec=T0[c.tid]||(T0[c.tid]={best:0}); let r=null;
  if(win&&c.floor>rec.best){ rec.best=c.floor; r=rateR(towerReward(c.floor)); giveReward(r); } B.allies.forEach(u=>{ const o=own(u.c.id); if(o) gainExp(o,expR(40+c.floor*4)); }); mark('prog'); return {win,floor:c.floor,r}; }
/* src/main/0110-challenge/0488-stage-modes.js에서 옮김 */
function modesCfg(){ const m=(G.meta.story||{}).modes||{}; return {debate:m.debate!==false,contest:m.contest!==false}; }
function charmOf(c){ const p=c.persona||{}, txt=[...(p.traits||[]),p.gap,p.hobby,...(p.likes||[]),p.motif,c.profile].join(' '), o=own(c.id)||{lv:1,aff:0}, out={};
  Object.keys(CHARM).forEach(k=>{ let v=20+(CHARM_KW[k].test(txt)?25:0)+((p.traits||[]).filter(t=>CHARM_KW[k].test(t)).length*10); out[k]=v; });
  out[c.role==='sup'?'smart':'tough']+=c.role==='def'?15:10; if(c.role==='atk') out.cool+=8;
  const m=(1+(c.rarity||1)*.1)*(1+affLv(o)*.04)*(1+Math.min(120,o.lv||1)/200); Object.keys(out).forEach(k=>out[k]=Math.round(out[k]*m)); return out; }
function modeClean(s){ const mode=String(s&&s.mode||'').trim(), cfg=modesCfg();
  if(mode==='debate'&&cfg.debate&&s.debate){ const d=s.debate, ev=(Array.isArray(d.evidence)?d.evidence:[]).slice(0,8).map((e,i)=>({id:S_(e.id,12).replace(/[^\w-]/g,'')||'e'+(i+1),name:S_(e.name,30),desc:S_(e.desc,160)})).filter(e=>e.name);
    const ids=new Set(ev.map(e=>e.id)), rounds=(Array.isArray(d.rounds)?d.rounds:[]).slice(0,4).map(r=>({claim:S_(r.claim,120),lines:(Array.isArray(r.lines)?r.lines:[]).slice(0,6).map(l=>({text:S_(l.text,200),press:S_(l.press,200),weak:ids.has(S_(l.weak,12))?S_(l.weak,12):'',persuade:l.persuade&&S_(l.persuade.who,20)?{who:S_(l.persuade.who,20),text:S_(l.persuade.text,200)}:null})).filter(l=>l.text)})).filter(r=>r.lines.length&&r.lines.some(l=>l.weak||l.persuade));
    if(ev.length&&rounds.length) return {mode:'debate',debate:{opponent:S_(d.opponent,20)||'상대',goal:S_(d.goal,120),evidence:ev,rounds,hp:Math.max(3,Math.min(7,+d.hp||5)),win:S_(d.win,200),lose:S_(d.lose,200)}}; }
  if(mode==='contest'&&cfg.contest&&s.contest){ const c=s.contest, judges=(Array.isArray(c.judges)?c.judges:[]).slice(0,3).map(j=>({name:S_(j.name,20)||'심사위원',likes:CHARM[j.likes]?j.likes:Object.keys(CHARM).find(k=>CHARM[k]===j.likes)||'cool'}));
    if(judges.length) return {mode:'contest',contest:{title:S_(c.title,40)||'콘테스트',judges,rounds:Math.max(2,Math.min(5,+c.rounds||3)),rivals:(Array.isArray(c.rivals)?c.rivals:[]).slice(0,3).map(r=>({name:S_(r.name,20)||'경쟁자',power:Math.max(.6,Math.min(1.6,+r.power||1))})).filter(r=>r.name)}}; }
  return null; }
function modeIcon(s){ return s&&s.mode==='debate'?'⚖':s&&s.mode==='contest'?'✦':''; }
function contestPref(r){ const J=MD.s.contest.judges; return J[r%J.length]; }
