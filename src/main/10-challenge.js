/* ===== challenge — 기능 class(Model · View · Ctl) — docs/redesign.md 2·3절, tools/reshape.mjs가 매핑대로 옮김 ===== */
class Challenge {
    /* 주간 레이드 새로 만들기(주가 바뀌면): 지난주 결과로 단계 오르내림(처치 +1, 절반 못 깎음 −1, 1~6) — 진행 칸 raid의 정의(0070 PROG_SLOTS)가 부름 */
static raidNew(r){ r=progObj(r)?r:null; const pr=r&&r.total?r.dmg/r.total:0; const lv=r?Math.max(1,Math.min(6,(r.lv||1)+(r.killed?1:pr<0.5?-1:0))):1; return {wk:Challenge.weekKey(),lv,dmg:0,killed:false,got:[],tries:{},best:0}; }

    /* 이번 주 레이드 보스(순수 — 진행 칸 r을 읽기만): 총 체력은 칸에 정해 둔 값, 없으면 보스 체력의 30배 */
static raidBossOf(r){ const pool=[], bgOf={}; G.chapters.filter(ch=>ch.kind==='main').forEach(ch=>ch.stages.forEach(s=>(s.enemies||[]).forEach(e=>{ if(e.boss&&!pool.some(x=>x.name===e.name)){ pool.push(e); bgOf[e.name]=Core.stageBg(s); } })));
    const src=pool.length?pool[Core.hashN(r.wk)%pool.length]:{name:'거대 잔광',elem:ELEMS[0]}; const b=Challenge.fitEnemy({name:src.name,elem:ELEMS[Core.hashN(r.wk+'e')%ELEMS.length],hp:3000,atk:110,def:50,spd:95,boss:true,bg:bgOf[src.name]||''},Challenge.enemyTarget(Story.progK()+(r.lv-1)*0.6,6,true)*1.3);
    const total=r.total||b.hp*30, k=total/30/b.hp; return {...b,hp:Math.round(total/30),atk:Math.round(b.atk*Math.min(1.5,Math.max(0.7,k))),total}; }

  static raidBoss(){ return Challenge.raidBossOf(Core.progRead('raid')); }

    /* 레이드 칸 맞춤(PROG_SLOTS raid fill — progSlot·그리기 전 처리가 부름): 총 체력을 정해 두고, 총 체력보다 덜 깎았는데 처치로 남은 표시는 끔 */
static raidFill(r){ let ch=false; if(!r.total){ r.total=Challenge.raidBossOf(r).total; ch=true; } if(r.killed&&r.dmg<r.total){ r.killed=false; ch=true; } if(ch) Core.mark('prog'); }

  static raidTriesLeft(){ const r=Core.progRead('raid'); return Math.max(0,3-(r.tries[today()]||0)); }

    /* 레이드 정산(Model): 이번 피해·누적 피해·달성 보상·참가 대원 경험치 */
static raidSettle(win){ const r=Core.progSlot('raid'), b=B.enemies[0], dealt=Math.max(0,Math.round((B.ctx.hp0||0)-b.hp)); r.dmg=Math.min(B.ctx.total,r.dmg+dealt); r.best=Math.max(r.best||0,dealt);
    const ratio=r.dmg/B.ctx.total; if(ratio>=1) r.killed=true; let got={}; RAID_MS.forEach(([t,rw],i)=>{ if(ratio>=t&&!r.got.includes(i)){ r.got.push(i); Economy.giveReward(rw); Object.entries(rw).forEach(([k,v])=>got[k]=(got[k]||0)+v); } });
    B.allies.forEach(u=>{ const o=Characters.own(u.c.id); if(o) Core.gainExp(o,expR(80)); }); Core.mark('prog'); const nx=RAID_MS.find(([t],i)=>!r.got.includes(i)); return {killed:!!r.killed,dealt,ratio,got,next:nx?nx[0]:null}; }

  static dgGen(floor){
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
    const map={w:W,h:H,cells,links:[...links],start,stairs:far}; Challenge.dgReveal(map,start); return map; }

  static dgLinked(map,a,b){ const k=a<b?a+'-'+b:b+'-'+a; return map.links.includes(k); }

  static dgNb(map,i){ const W=map.w,x=i%W,y=Math.floor(i/W),o=[]; if(x>0)o.push(i-1); if(x<W-1)o.push(i+1); if(y>0)o.push(i-W); if(y<map.h-1)o.push(i+W); return o.filter(b=>map.cells[b]&&Challenge.dgLinked(map,i,b)); }

  static dgReveal(map,i){ const c=map.cells[i]; c.vis=true; c.seen=true; Challenge.dgNb(map,i).forEach(b=>{ map.cells[b].seen=true; }); }

  static dgPath(map,from,to){ const prev={[from]:-1}, q=[from]; while(q.length){ const a=q.shift(); if(a===to) break; Challenge.dgNb(map,a).forEach(b=>{ if(prev[b]==null&&(map.cells[b].vis||b===to)){ prev[b]=a; q.push(b); } }); } if(prev[to]==null) return null; const p=[]; for(let x=to;x!==-1;x=prev[x]) p.unshift(x); return p; }

  static rgEq(run,kind){ if(kind==='boss') return RG_FLOORS; return Math.min(RG_FLOORS,(run.floor-1)*3+1+Math.min(2,run.fw||0)); }

  static rgScore(run){ return Math.min(RG_FLOORS,(run.floor-1)*3+Math.min(3,run.fw||0)); }

  static pixSprite(c){ const src=Art.charSrc(c); if(!src) return Promise.resolve(null); const key=c.id+'|'+src; if(PIX[key]) return PIX[key];
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

  static rgDeck(squad){ const d=[], L=squad[0], lc=charById(L); if(!lc) return d;
    for(let i=0;i<4;i++) d.push({k:'strike',o:L}); for(let i=0;i<4;i++) d.push({k:'guard',o:L});
    squad.slice(1).forEach(id=>{ const c=charById(id); if(!c) return; const pool=ROLE_CARDS[c.role]||ROLE_CARDS.atk, h=Core.hashN(c.id), a=pool[h%pool.length], b=pool[(h+1+(h>>3)%(pool.length-1))%pool.length];
      d.push({k:a,o:id},{k:b===a?pool[(pool.indexOf(a)+1)%pool.length]:b,o:id},{k:'skill',o:id}); });
    return d; }

  static cardName(cd){ const c=charById(cd.o), df=CARD_DEF[cd.k]||CARD_DEF.strike; return (cd.k==='skill'?(c?c.skill.name:'스킬'):df.n)+(cd.up?'+':''); }

  static cardType(cd){ const df=CARD_DEF[cd.k]||CARD_DEF.strike; if(cd.k==='skill'){ const c=charById(cd.o), k=c&&c.skill.kind; return k==='dmg'||k==='aoe'?'atk':k==='shield'?'def':'sup'; } return df.t; }

  static cardOffer(run){ const pool=CARD_REWARD.slice(), out=[]; const sup=run.squad.slice(1).map(charById).filter(Boolean), all=run.squad.map(charById).filter(Boolean);
    while(out.length<3&&pool.length){ const k=pool.splice(Math.floor(Math.random()*pool.length),1)[0];
      const pref=['wall','taunt','bulwark','counter','entrench','shieldbash','rage'].includes(k)?'def':['aid','focus','rally','revive','surge','expose','weaken','plan','echo','charge','sacrifice','hemorrhage','spread','overdrive'].includes(k)?'sup':'atk', base=sup.length?sup:all, pc=base.filter(c=>c.role===pref);
      out.push({k,o:(rand(pc.length?pc:base)||{}).id,up:Math.random()<0.12+0.06*run.floor}); }
    return out; }

  static cbEnemyDmg(e,m,a){ let v=e.dmg*e.str*m; if(e.weak>0) v*=0.7; v*=BEATS[e.elem]===a.elem?1.5:BEATS[a.elem]===e.elem?0.75:1; const dr=Math.min(1.35,Math.max(0.65,Math.pow((CB?CB.defA:a.def)/Math.max(1,a.def),0.35))); return Math.max(1,Math.round(v*dr)); }

  static cbShuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

  static rgUnits(run,ids){ const m=id=>Challenge.rgCount(id), fb=Core.factionBonus(ids);
    return ids.map(charById).filter(Boolean).map((c,i)=>{ const st=Core.stats(c), fr=run.hp[c.id]; const u={i,c,name:c.name,elem:c.elem,role:c.role,str:1};
      u.maxhp=Math.round(st.hp*(1+0.2*m('hp')+0.08*m('res'))); u.atk=Math.round(st.atk*(1+(fb[c.faction]||0)/100)*(1+0.15*m('atk')+0.08*m('res')+0.05*m('train'))); u.def=Math.round(st.def*(1+0.25*m('def'))); u.hp=Math.round(u.maxhp*(fr==null?1:fr)); return u; }); }

  static cbLead(){ return CB.units[0]; }

  static cbDraw(n){ for(let k=0;k<n;k++){ if(CB.hand.length>=10) break; if(!CB.draw.length){ if(!CB.disc.length) break; CB.draw=Challenge.cbShuffle(CB.disc); CB.disc=[]; } CB.hand.push(CB.draw.pop()); } }

  static cbIntents(){ CB.enemies.forEach(en=>{ if(en.hp<=0) return; const r=Math.random(); let it;
      if(en.boss){ it=r<0.25?{k:'aoe',m:0.75}:r<0.42?{k:'heavy',m:2.0}:r<0.75?{k:'atk',m:1.15}:r<0.88?{k:'multi',m:0.6,n:2}:{k:'def'}; if(CB.turn===0&&it.k==='heavy') it={k:'atk',m:1.15}; }
      else it=r<0.58?{k:'atk',m:1.0}:r<0.73?{k:'multi',m:0.55,n:2}:r<0.88?{k:'def'}:{k:'buff'};
      if(it.k==='aoe') it={k:'atk',m:1.3};
      en.intent=it; }); }

  static cbFanStyle(i,n,sel,si){ const o=i-(n-1)/2, sp=Math.min(54,250/Math.max(1,n-1)), r=o*Math.min(7,48/Math.max(1,n)), y=Math.abs(o)*Math.abs(o)*2.2;
    // 고른 카드는 그 자리에서 위로 올라오고, 양옆 카드는 살짝 비켜나요(화면 밖으로 나가지 않게)
    const half=(Math.min(innerWidth,620)/2)-62; let tx=o*sp; if(si!=null&&si>=0&&!sel) tx+=i<si?-16:16; if(sel) tx=Math.max(-half,Math.min(half,tx));
    return sel?`--tx:${tx}px;--ty:-58px;--r:0deg;z-index:30`:`--tx:${tx}px;--ty:${y}px;--r:${r}deg;z-index:${10+i}`; }

    /* 던전 칸으로 이동(Controller): 이동 시작(Model) → 걸어가는 연출(View) → 도착(Model) → 그 칸의 일 */
static dgMove(to){ const run=Core.progSlot('rogue').run; if(!run||run.busy) return; const path=Challenge.dgPath(run.map,run.pos,to); if(!path) return; Challenge.dgWalkStart(run); ChallengeView.dgHeroWalk(path,run.map.w,()=>{ Challenge.dgArrive(run,to); ChallengeCtl.dgEnter(run); }); }

    /* 이동 시작·도착(Model) */
static dgWalkStart(run){ run.busy=true; }

  static dgArrive(run,to){ run.busy=false; run.pos=to; Challenge.dgReveal(run.map,to); }

  static dgDescend(run){ run.floor++; run.fw=0; run.map=Challenge.dgGen(run.floor); run.pos=run.map.start; run.msg=`제${run.floor}구역에 진입했어요.${run.floor>=DG_FLOORS?' 이 구역 어딘가에 보스가 있어요.':''}`; run.squad.forEach(id=>{ if(run.hp[id]>0) run.hp[id]=Math.min(1,run.hp[id]+0.1); }); Core.mark('prog'); Challenge.render(); }

    // Translate only legacy system messages for display; never rewrite a saved run.
static rgMessage(run){
   const msg=String(run.msg||'');
   const legacy={'심연의 기운이 바뀌어 1층으로 돌아왔어요. 같은 탐사대로 처음부터 다시 내려가요.':'탐사 경로가 바뀌어 제1구역으로 돌아왔어요. 같은 탐사대로 처음부터 다시 시작해요.','낡은 지도를 주웠어요. 이 층의 구조가 모두 드러났어요.':'낡은 지도를 주웠어요. 이 구역의 구조가 모두 드러났어요.','야영지에서 쉬다가 다시 내려왔어요.':'야영지에서 쉬다가 탐사를 이어가요.'};
   if(Object.prototype.hasOwnProperty.call(legacy,msg))return legacy[msg];
   const m=msg.match(/^지하 (\d+)층에 내려왔어요\.( 이 층 어딘가에 보스가 있어요\.)?$/);
   return m?`제${m[1]}구역에 진입했어요.${m[2]?' 이 구역 어딘가에 보스가 있어요.':''}`:msg;
  }

  static rfIds(){ return RF.s[0]?RF.s.filter(Boolean):[]; }

  static rfAuto(){ const busy=busyIds(), pool=G.chars.filter(c=>Characters.own(c.id)&&!busy.has(c.id)).sort((a,b)=>charPower(b)-charPower(a)); const out=[]; const L=pool.find(c=>c.role==='atk')||pool[0]; if(L) out.push(L.id);
    ['sup','def','atk'].forEach(r=>{ const c=pool.find(x=>x.role===r&&!out.includes(x.id)); if(c&&out.length<4) out.push(c.id); }); pool.forEach(c=>{ if(out.length<4&&!out.includes(c.id)) out.push(c.id); });
    return [0,1,2,3].map(i=>out[i]||null); }

    /* 심연·도전 화면에 들어가기 전 처리(Controller — render가 그리기 전에 부름): 저장 없이 나간 탐사는 끝내고, 심연 화면은 탐사가 없으면 도전 화면으로·주가 바뀌면 같은 탐사대로 처음부터·저장 표시 지움, 예전 형식 탐사는 고를 유물이 비면 다시 뽑음 */
static rogueTick(){ if(tab!=='abyss'&&tab!=='challenge') return; const g=Core.progSlot('rogue'), run=g.run;
    if(run&&run.v===2&&(run.left||(!RG_LIVE&&!run.saved))){ ChallengeCtl.rgAbandon('야영지에서 저장하지 않고 나가서 탐사가 끝났어요. 저장은 야영지의 \'저장하고 나가기\'로만 할 수 있어요.'); if(tab==='abyss') tab='challenge'; return; }
    if(tab==='challenge'){ if(run&&run.v!==2&&run.pick&&!run.pick.filter(k=>RELICS[k]).length){ run.pick=Challenge.rgPick3(run); Core.mark('prog'); } return; }
    if(!run||run.v!==2){ tab='challenge'; return; }
    RG_LIVE=true; if(!run.wk){ run.wk=Challenge.weekKey(); Core.mark('prog'); }
    if(run.wk!==Challenge.weekKey()){ const sq=run.squad.slice(), html=ChallengeCtl.rgFinish(false); Challenge.rgRunNew(sq,'card'); Core.progSlot('rogue').run.msg='탐사 경로가 바뀌어 제1구역으로 돌아왔어요. 같은 탐사대로 처음부터 다시 시작해요.'; Core.mark('prog'); setTimeout(()=>ChallengeView.openRgResult(html,'탐사 경로가 바뀌었어요','지난주 탐사는 여기까지예요. 제1구역부터 다시 시작해요.'),0); }
    if(run.saved){ delete run.saved; Core.mark('prog'); } }

  static rgCount(id){ const run=Core.progRead('rogue').run; return run?run.relics.filter(x=>x===id).length:0; }

  static rgOpts(run){ if(run.floor>=RG_FLOORS) return ['boss']; const w=[['battle',45],['elite',15],['rest',15],['treasure',10],['event',15]]; const out=[]; let guard=0;
    while(out.length<3&&guard++<40){ let x=Math.random()*100; const k=w.find(([_,p])=>(x-=p)<0)[0]; if(!out.includes(k)) out.push(k); } if(!out.includes('battle')&&!out.includes('elite')) out[0]='battle'; return out; }

  static rgPick3(run){ const take=(arr,n)=>{ const a=[...arr], o=[]; while(o.length<n&&a.length) o.push(a.splice(Math.floor(Math.random()*a.length),1)[0]); return o; };
    if(run.c3){ const fresh=CRELICS.filter(k=>!run.relics.includes(k)||['atk','hp','loot'].includes(k)); return take(fresh.length>=3?fresh:CRELICS,3); }
    let out=take(Object.keys(RELICS).filter(k=>k!=='train'&&!run.relics.includes(k)),3);
    if(out.length<3) out.push('train');
    if(out.length<3) out=out.concat(take(Object.keys(RELICS).filter(k=>k!=='train'&&!out.includes(k)),3-out.length));
    return out; }

  static rgEnemies(run,kind){ const pool=[]; G.chapters.filter(ch=>ch.kind==='main').forEach(ch=>ch.stages.forEach(s=>(s.enemies||[]).forEach(e=>{ if(!pool.some(x=>x.name===e.name)) pool.push(e); })));
    const pick=boss=>{ const c=pool.filter(e=>!!e.boss===boss); const src=(c.length?c:pool)[Math.floor(Math.random()*(c.length||pool.length||1))]||{name:'미확인 적',elem:ELEMS[0]}; return {name:src.name,elem:src.elem||ELEMS[0],hp:900,atk:85,def:35,spd:92,boss}; };
    const k=run.k+run.floor*0.12, i=run.floor*0.5; let en;
    if(kind==='boss') en=[Challenge.fitEnemy(pick(true),Challenge.enemyTarget(k,i,true)*1.4),Challenge.fitEnemy(pick(false),Challenge.enemyTarget(k,i,false))];
    else if(kind==='elite') en=[Challenge.fitEnemy(pick(true),Challenge.enemyTarget(k,i,true)*0.9),Challenge.fitEnemy(pick(false),Challenge.enemyTarget(k,i,false)*0.9)];
    else en=Array.from({length:2+(Math.random()<0.5?1:0)},()=>Challenge.fitEnemy(pick(false),Challenge.enemyTarget(k,i,false)*0.85));
    return en; }

    /* 탐사 새로 만들기(Model) */
static rgRunNew(ids,mode){ const g=Core.progSlot('rogue'); mode=mode||'card'; const map=Challenge.dgGen(1); RG_LIVE=true; g.run={v:2,c3:1,wk:Challenge.weekKey(),mode:'card',floor:1,fw:0,squad:ids,hp:Object.fromEntries(ids.map(id=>[id,1])),relics:[],deck:mode==='card'?Challenge.rgDeck(ids):[],map,pos:map.start,pick:null,cpick:null,k:Story.progK(),at:Date.now(),msg:mode==='card'?'카드 전투 탐사를 시작해요. 매 턴 에너지 3으로 카드를 써요. 적 머리 위의 표시가 다음 행동이에요.':'탐사를 시작해요.'}; Core.mark('prog'); }

    /* 탐사 시작(Controller): 새로 만들고 심연 화면으로 */
static rgStart(ids,mode){ Challenge.rgRunNew(ids,mode); tab='abyss'; Challenge.render(); }

  static rgBattle(kind){ const run=Core.progSlot('rogue').run; const en=Challenge.rgEnemies(run.v===2?{k:run.k,floor:Challenge.rgEq(run,kind)}:run,kind); const s={id:'rg_'+run.floor,title:`${System.T('abyss')} · ${run.floor}구역 · ${RG_NODE[kind][1]}`,enemies:en,pre:'',post:''};
    const m=id=>Challenge.rgCount(id);
    SystemView.startStage(s,{kind:'rogue',node:kind,squad:run.squad,burst0:m('burst')?40:0,prep:(al)=>{ al.forEach(u=>{ const fr=run.hp[u.c.id]; const hpM=1+0.2*m('hp')+0.08*m('res');
        u.maxhp=Math.round(u.maxhp*hpM); u.atk=Math.round(u.atk*(1+0.15*m('atk')+0.08*m('res')+0.05*m('train'))); u.def=Math.round(u.def*(1+0.25*m('def'))); u.spd=Math.round(u.spd*(1+0.1*m('spd'))); u.hp=Math.round(u.maxhp*(fr==null?1:fr)); }); }}); }

    /* 탐사 전투 정산(Model): 체력 이어 가기(응급 키트 회복)·경험치, 이긴 칸 표시·유물/카드 고르기, 예전 형식은 다음 구역 */
static rogueSettle(win){ const g=Core.progSlot('rogue'), run=g.run; if(!run) return null;
    const heal=0.15*Challenge.rgCount('heal'); B.allies.forEach(u=>{ run.hp[u.c.id]=u.hp>0?Math.min(1,u.hp/u.maxhp+heal):0; const o=Characters.own(u.c.id); if(o&&win) Core.gainExp(o,expR(40)); });
    const node=B.ctx.node; if(!win||node==='boss') return {finish:true,done:win&&node==='boss'};
    if(run.v===2){ const cell=run.map.cells[run.pos]; if(cell) cell.done=true; run.fw=(run.fw||0)+(node==='elite'?2:1); if(node==='elite') run.pick=Challenge.rgPick3(run); if(run.mode==='card') run.cpick=Challenge.cardOffer(run); run.msg=''; Core.mark('prog'); return {v:2,node,card:run.mode==='card',heal}; }
    run.floor++; run.opts=Challenge.rgOpts(run); if(node==='elite') run.pick=Challenge.rgPick3(run); Core.mark('prog'); return {v:1,node,floor:run.floor,heal}; }

  static rgReward(f,done,prev,won){ prev=prev||0; const nf2=Math.max(0,f-prev); let r={gold:1200*f,exp:3*f,wmat:2*f,core:Math.floor(f/3)+(done?5:0),gift:Math.floor(f/4)+(done?2:0)}; const m=(1+0.3*Challenge.rgCount('loot'))*(Core.progRead('rogue').n>=2?0.25:1); Object.keys(r).forEach(k=>r[k]=Math.round(r[k]*m)); const gm=40*nf2+(done&&!won?500:0); if(gm) r.gems=gm; return r; }

    /* 탐사 끝 정산(Model): 진척에 따른 보상(오늘 3번째부터 25%·최고 기록 갱신 때만 재화), 기록, 탐사 비움 */
static rgFinishSettle(done){ const g=Core.progSlot('rogue'), run=g.run, f=done?RG_FLOORS:run.v===2?Challenge.rgScore(run):run.floor-1; if(g.day!==today()){ g.day=today(); g.n=0; } const r=Challenge.rgReward(f,done,g.best||0,!!g.won); Economy.giveReward(r); g.n++; g.best=Math.max(g.best||0,f); if(done) g.won=true; g.run=null; Core.mark('prog'); return {done,v:run.v,floor:run.floor,f,n:g.n,r}; }

  static towerList(){ const L=[{id:'all',name:'시련의 탑',desc:'누구나 출전',allow:null}];
    NewGame.ruleFacs().forEach(f=>L.push({id:'f:'+f,name:`${f}의 탑`,desc:`${f} 소속만 출전`,allow:c=>c.faction===f}));
    ELEMS.forEach(elem=>L.push({id:'e:'+elem,name:`${elem}의 탑`,desc:`${elem} 속성만 출전`,allow:c=>c.elem===elem}));
    return L; }

  static towerById(id){ return Challenge.towerList().find(t=>t.id===id); }

  static towerPool(boss){ const out=[]; G.chapters.forEach(ch=>(ch.stages||[]).forEach(s=>(s.enemies||[]).forEach(e=>{ if(!!e.boss===!!boss&&!out.some(x=>x.name===e.name)) out.push(e); }))); return out; }

  static towerStage(tid,floor){ const t=Challenge.towerById(tid)||Challenge.towerById('all'), h=Core.hashN(tid+'#'+floor), boss=floor%5===0, k=(floor-1)*.4;
    const pool=Challenge.towerPool(false), bp=Challenge.towerPool(true), foeElem=tid.startsWith('e:')?(ELEMS.find(elem=>BEATS[tid.slice(2)]===elem)||ELEMS[0]):null;
    const mk=(src,i,b)=>{ const e={name:(src&&src.name)||(b?'탑의 수호자':'탑의 파수꾼'),look:src&&src.look,elem:foeElem&&i%2===0?foeElem:ELEMS[(h+i)%ELEMS.length],hp:900,atk:90,def:40,spd:92+Math.min(40,floor),boss:!!b}; return Challenge.fitEnemy(e,Challenge.enemyTarget(k,i,!!b)); };
    const n=boss?2:Math.min(4,2+Math.floor(floor/10)), en=[]; for(let i=0;i<n;i++) en.push(mk(pool[(h+i*7)%Math.max(1,pool.length)],i,false)); if(boss) en.push(mk(bp[h%Math.max(1,bp.length)],n,true));
    const s={id:`tower_${tid}_${floor}`,title:`${t.name} ${floor}층`,enemies:en,reward:0,pre:'',post:''};
    Story.stageAutoRules(s,floor%3===1?0:1,boss?2:9); return s; }

    /* 탑 정산(Model): 첫 돌파 기록·보상, 참가 대원 경험치 */
static towerSettle(win){ const c=B.ctx, T0=Core.progSlot('tower'), rec=T0[c.tid]||(T0[c.tid]={best:0}); let r=null;
    if(win&&c.floor>rec.best){ rec.best=c.floor; r=Characters.rateR(Core.towerReward(c.floor)); Economy.giveReward(r); } B.allies.forEach(u=>{ const o=Characters.own(u.c.id); if(o) Core.gainExp(o,expR(40+c.floor*4)); }); Core.mark('prog'); return {win,floor:c.floor,r}; }

  static rgNode(kind){ const g=Core.progSlot('rogue'), run=g.run; if(!run) return;
    if(kind==='battle'||kind==='elite'||kind==='boss'){ Challenge.rgBattle(kind); return; }
    let msg='';
    if(kind==='rest'){ run.squad.forEach(id=>{ run.hp[id]=Math.min(1,(run.hp[id]>0?run.hp[id]+0.35:0.25)); }); msg='모두 숨을 돌렸어요. 체력을 회복하고 쓰러진 대원이 일어났어요.'; }
    if(kind==='treasure'){ run.pick=Challenge.rgPick3(run); msg='유물 상자를 찾았어요!'; }
    if(kind==='event'){ const x=Math.random();
      if(x<0.34){ run.squad.forEach(id=>{ if(run.hp[id]>0) run.hp[id]=Math.min(1,run.hp[id]+0.5); }); msg='맑은 샘을 찾았어요. 체력이 크게 회복됐어요.'; }
      else if(x<0.67){ if(Math.random()<0.5){ run.pick=Challenge.rgPick3(run); msg='수상한 상자에서 유물이 나왔어요!'; } else { run.squad.forEach(id=>{ if(run.hp[id]>0) run.hp[id]=Math.max(0.05,run.hp[id]-0.2); }); msg='수상한 상자가 폭발했어요. 모두 체력 -20%.'; } }
      else { run.relics.push('train'); msg='잠깐의 실전 훈련. 공격 +5%.'; } }
    run.floor++; run.opts=Challenge.rgOpts(run); run.msg=msg; Core.mark('prog'); Challenge.render(); }

  static async handleCombatAndFormationAction(a,t,id,p,e){
    switch(a){
  case 'raidgo': { if(!Challenge.raidTriesLeft()){ CoreView.toast('오늘 도전 횟수를 다 썼어요'); break; } const b=Challenge.raidBoss(); squadSel=null; FORM=null; CharactersView.openFormation({id:'raid',title:'레이드 · '+b.name,enemies:[b],reward:0,pre:'',post:''},{kind:'raid'},'raidstart'); break; }
  case 'raidstart': { P().squad=[...squadSel]; const r=Core.progSlot('raid'); r.tries[today()]=(r.tries[today()]||0)+1; Core.mark('prog'); CoreView.closeModal(); const b=Challenge.raidBoss(), hp0=Math.max(1,b.total-r.dmg);
        SystemView.startStage({id:'raid',title:'레이드 · '+b.name,enemies:[b],reward:0,pre:'',post:''},{kind:'raid',total:b.total,hp0,prep:(al,en)=>{ en[0].maxhp=b.total; en[0].hp=hp0; }}); break; }
  case 'rgnew': { RGMODE='card'; RF=null; ChallengeView.openRgForm(); break; }
  case 'rfslot': RF.sel=+t.dataset.i; ChallengeView.openRgForm(); break;
  case 'rffil': RF.filter=t.dataset.v; ChallengeView.openRgForm(); break;
  case 'rfauto': RF.s=Challenge.rfAuto(); RF.sel=0; ChallengeView.openRgForm(); break;
  case 'rfclr': RF.s=[null,null,null,null]; RF.sel=0; ChallengeView.openRgForm(); break;
  case 'rfpick': { const k=RF.s.indexOf(id), i=RF.sel; if(k===i) RF.s[i]=null; else { if(k>=0) RF.s[k]=RF.s[i]; RF.s[i]=id; } if(!RF.s[0]) RF.sel=0; else { const e=RF.s.indexOf(null); RF.sel=e>=0?e:RF.sel; } ChallengeView.openRgForm(); break; }
  case 'rfgo': { const ids=Challenge.rfIds(); if(!ids.length) break; Core.progSlot('rogue').lastSquad=ids; P().squad=[...ids]; CoreView.closeModal(); try{ Challenge.rgStart(ids,'card'); }catch(err){ console.error(err); Core.progSlot('rogue').run=null; Core.mark('prog'); CoreView.toast('탐사를 시작하지 못했어요: '+(err&&err.message||err)); Challenge.render(); } RF=null; ChallengeView.abyssCardFocus(); break; }
  case 'rgnode': { const run=Core.progSlot('rogue').run; if(!run) break; run.msg=''; Challenge.rgNode(t.dataset.v); break; }
  case 'rgskip': { const run=Core.progSlot('rogue').run; if(!run) break; run.pick=null; run.squad.forEach(id=>{ if(run.hp[id]>0) run.hp[id]=Math.min(1,run.hp[id]+0.1); }); run.msg='유물 대신 숨을 돌렸어요. 체력 10% 회복'; Core.mark('prog'); Challenge.render(); break; }
  case 'rgrelic': { const run=Core.progSlot('rogue').run; if(!run) break; run.relics.push(t.dataset.v); run.pick=null; run.msg=RELICS[t.dataset.v][0]+'을(를) 얻었어요'; Core.mark('prog'); Challenge.render(); break; }
  case 'dgmove': Challenge.dgMove(+t.dataset.v); break;
  case 'dgdown': { const run=Core.progSlot('rogue').run; if(run&&run.v===2&&run.map.cells[run.pos].t==='stairs') Challenge.dgDescend(run); break; }
  case 'rgcard': { const run=Core.progSlot('rogue').run; if(!run||!run.cpick) break; const i=+t.dataset.i; if(i>=0&&run.cpick[i]){ run.deck.push(run.cpick[i]); run.msg=`「${Challenge.cardName(run.cpick[i])}」 카드를 덱에 넣었어요`; } run.cpick=null; Core.mark('prog'); Challenge.render(); break; }
  case 'rgrest': { const run=Core.progSlot('rogue').run; if(!run) break; const v=t.dataset.v; run.rest=false;
        if(v==='heal'){ run.squad.forEach(id=>{ run.hp[id]=Math.min(1,(run.hp[id]>0?run.hp[id]+0.35:0.25)); }); run.msg='모닥불 곁에서 푹 쉬었어요. 쓰러진 대원도 일어났어요.'; }
        else if(v==='upg') run.upg=true; else if(v==='rm') run.rm=true; else { run.relics.push('train'); run.msg='훈련으로 공격 +5%'; }
        Core.mark('prog'); Challenge.render(); break; }
  case 'rgupg': { const run=Core.progSlot('rogue').run; if(!run) break; const i=+t.dataset.i; run.upg=false; if(i<0) run.rest=true; else if(run.deck[i]){ run.deck[i].up=true; run.msg=`「${Challenge.cardName(run.deck[i])}」(으)로 강화했어요`; } Core.mark('prog'); Challenge.render(); break; }
  case 'rgrm': { const run=Core.progSlot('rogue').run; if(!run) break; const i=+t.dataset.i; if(i>=0&&run.deck.length<=8){ CoreView.toast('덱은 8장보다 적게 줄일 수 없어요'); break; } run.rm=false; if(i<0) run.rest=true; else if(run.deck[i]){ const cd=run.deck.splice(i,1)[0]; run.msg=`「${Challenge.cardName(cd)}」 카드를 뺐어요`; } Core.mark('prog'); Challenge.render(); break; }
  case 'rgdeck': { const run=Core.progSlot('rogue').run; if(run&&run.deck) ChallengeView.rgDeckModal(run.deck); break; }
  case 'cbplay': SystemCtl.cbPlay(+t.dataset.i); break;
  case 'cbsel': if(CB&&!CB.busy&&!CB.over){ const i=+t.dataset.i; if(i>=0&&CB.sel===i){ const cd=CB.hand[i]; if(cd&&Core.cardCost(cd)<=CB.energy&&!(cd.k==='echo'&&!CB.last)) SystemCtl.cbPlay(i); } else { CB.sel=i; ChallengeView.cbRender(); } } break;
  case 'cbult': ChallengeView.cbUlt(); break;
  case 'cbend': ChallengeView.cbEndTurn(); break;
  case 'cbtgt': if(CB&&!CB.busy){ const e=CB.enemies[+t.dataset.i]; if(e&&e.hp>0){ CB.tgt=e.i; ChallengeView.cbRender(); } } break;
  case 'cbdeck': if(CB) ChallengeView.rgDeckModal(CB.run.deck); break;
  case 'cbquit': if(CB&&!CB.over&&(await appConfirm('후퇴하면 이번 탐사가 끝나요. 지금까지의 보상은 받아요.'))) ChallengeCtl.cbEnd(false); break;
  case 'rgsave': { const run=Core.progSlot('rogue').run; if(!run||!run.rest) break; run.saved=Date.now(); delete run.left; run.wk=run.wk||Challenge.weekKey(); run.msg='야영지에서 쉬다가 탐사를 이어가요.'; Core.mark('prog'); tab='challenge'; Challenge.render(); CoreView.toast(`탐사를 저장했어요. 도전 → ${System.T('abyss')}에서 이어서 할 수 있어요`); break; }
  case 'rgleave': { const run=Core.progSlot('rogue').run; if(!run){ tab='challenge'; Challenge.render(); break; } if(!(await appConfirm('지금 나가면 이번 탐사가 끝나요(지금까지 간 만큼 보상은 받아요).\n저장은 야영지의 \'저장하고 나가기\'로만 할 수 있어요. 나갈까요?'))) break; const html=ChallengeCtl.rgFinish(false); tab='challenge'; Challenge.render(); ChallengeView.openRgResult(html); break; }
  case 'rgquit': { if(!(await appConfirm('탐사를 끝낼까요? 지금까지의 진척에 따라 보상을 받아요.'))) break; const html=ChallengeCtl.rgFinish(false); ChallengeView.openRgResult(html); Challenge.render(); break; }
  case 'opskip': e.stopPropagation(); PlayerView.opEnd(); break;
  case 'stage': { const ch0=G.chapters.find(x=>x.id===t.dataset.ch), s0=ch0&&ch0.stages.find(x=>x.id===t.dataset.st); if(s0&&s0.story){ StoryView.openStoryStage(ch0,s0); break; } if(s0&&(s0.mode==='debate'||s0.mode==='contest')){ CharactersView.openModeStage(ch0,s0); break; } if(s0&&Battle.SORTIE()&&Battle.SORTIE().st===s0.id){ BattleView.sortieMap('진행 중인 출격을 이어 가요'); break; } squadSel=null; FORM=null; StoryView.openStage(t.dataset.ch,t.dataset.st); break; }
  case 'sortie': { p.squad=[...squadSel]; Core.mark('prog'); const ch=G.chapters.find(x=>x.id===t.dataset.ch),s=ch.stages.find(x=>x.id===t.dataset.st); CoreView.closeModal();
        if(!p.cleared[s.id]&&s.pre) SystemView.playStory(s.title,s.pre,()=>StoryCtl.startBattle(ch.id,s.id)); else StoryCtl.startBattle(ch.id,s.id); break; }
  case 'bauto': B.auto=!B.auto; CoreView.chipOn(t,B.auto); break;
  case 'bspeed': if(B?.ctx.kind==='practice'){B.speed=B.speed>=3?1:B.speed+1;ChallengeView.bSpeedShow(t);System.bRun();break;}B.speed=B.speed>=3?1:B.speed+1; P().settings.bspeed=B.speed; Core.mark('prog'); ChallengeView.bSpeedShow(t); System.bRun(); break;
  case 'bdone': { if(B&&(B.ctx.kind==='raid'||B.ctx.kind==='rogue')){ const rg=B.ctx.kind==='rogue'; B=null; CoreView.closeOv(); tab=rg&&Core.progRead('rogue').run?'abyss':'challenge'; Challenge.render(); break; }
        const win=t.dataset.win==='1',first=t.dataset.first==='1',s=B.s; B=null; CoreView.closeOv(); Challenge.render();
        if(win&&first&&s.post) SystemView.playStory(s.title,s.post,()=>{Challenge.render();MessengerCtl.checkTriggers();}); else MessengerCtl.checkTriggers(); break; }
  case 'opsch': OPS_CH=t.dataset.ch; Challenge.render(); StoryView.viewTop(); break;
  case 'opsback': OPS_CH=null; Challenge.render(); break;
  case 'fpick': { const i=squadSel.indexOf(id), added=i<0; const x=e.clientX||innerWidth/2, y=e.clientY||innerHeight/2;
        if(i>=0) squadSel.splice(i,1); else if(squadSel.length<4) squadSel.push(id); else {CoreView.toast('최대 4명까지 편성할 수 있어요');break;}
        CoreView.modalKeep(CoreView.refreshForm); CoreView.ripple(x,y,false);
        if(added){ const c=charById(id), l=ChallengeView.formJoinShow(c); if(l&&c.voiceId&&Core.SND().voiceLobby) CoreView.speak(c,l); }
        break; }
  case 'fsl': CoreView.refreshForm(); break;
  case 'fauto': squadSel=Characters.autoSquad(FORM.stage); CoreView.refreshForm(); break;
  case 'ffil': FORM.filter=t.dataset.v; CoreView.refreshForm(); break;
  case 'fsave': { const i=+(prompt('몇 번에 저장할까요? (1~3)','1')||0)-1; if(!(i>=0&&i<3)) break; P().presets=P().presets||[]; P().presets[i]=[...squadSel]; Core.mark('prog'); CoreView.toast(`편성 ${i+1}에 저장했어요`); CoreView.refreshForm(); break; }
  case 'fpre': { const pr=(P().presets||[])[+t.dataset.i]; if(!pr||!pr.length){CoreView.toast('저장된 편성이 없어요');break;} const busy=busyIds(); squadSel=pr.filter(x=>Characters.own(x)&&charById(x)&&!busy.has(x)).slice(0,4); CoreView.refreshForm(); break; }
  case 'farmgo': { const st=Characters.farmStage(t.dataset.k,+t.dataset.lv); squadSel=null; FORM=null; CharactersView.openFarmSquad(st); break; }
  case 'farmstart': { P().squad=[...squadSel]; Core.mark('prog'); CoreView.closeModal(); SystemView.startStage(Characters.farmStage(t.dataset.k,+t.dataset.lv),{kind:'farm'}); break; }
    }
  }

  static weekKey(d){d=d||new Date();const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));const w=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-w);const y=t.getUTCFullYear();return y+'-W'+Math.ceil(((t-Date.UTC(y,0,1))/864e5+1)/7);}

    /* /UI_SCROLL_MODULE */
  /* 그리기 전 처리(Controller — CLAUDE.md §0-2 화면은 상태를 바꾸지 않음): 진행 칸의 하루/주 새로 만들기·형식 맞춤(progTick), 탐사를 야영지 저장 없이 떠나면 끝냄 표시, 로비에서 우편·캐시 처리 → 그리기(renderView) */
static render(){ System.progTick();
    // 심연 탐사는 야영지에서 저장해야만 나갔다 올 수 있어요. 다른 길로 나가면 탐사가 끝나요.
    if(PREVTAB==='abyss'&&tab!=='abyss'){ const r=Core.progSlot('rogue').run; if(r&&!r.saved) r.left=true; }
    (SCREEN_ENTER[tab]||[]).forEach(f=>f()); PREVTAB=tab;
    EconomyView.renderView(); }

    // 10장까지는 직선, 그 뒤로는 레벨 상한이 오르는 만큼만 (조금 덜) 강해져요
static enemyTarget(k,i,boss){ const CK=9; let base; if(k<=CK) base=645*(1+0.55*k); else { const L=70+5*(k-CK); base=645*(1+0.55*CK)*((1+0.06*(L-1))/(1+0.06*69))*Math.pow(0.99,k-CK); } return base*(1+0.08*i)*(boss?1.8:1); }

    /* 적 스탯을 목표 전투력에 맞춘 새 객체(순수 — 받은 적은 그대로, 수동 지정 적은 그 자체를 돌려줌) */
static fitEnemy(e,target){ if(!e||e.manual) return e; const hp=+e.hp||800, atk=+e.atk||70, def=+e.def||0, spd=+e.spd||90, p=hp/5+atk*3+def*2, f=Math.max(50,target-spd)/p;
    return p<=0?{...e,hp,atk,def,spd}:{...e,hp:Math.max(100,Math.round(hp*f)),atk:Math.max(10,Math.round(atk*f)),def:Math.max(0,Math.round(def*f)),spd}; }

  static bossPats(e,raid){return GGMCombat.enemyPatterns(e);}
}

class ChallengeCtl {
    /* 레이드 끝(Controller): 정산 → 효과음 → 결과 */
static raidEnd(win){ const R=Challenge.raidSettle(win); Art.sfx(R.killed?'승리':'확인'); return ChallengeView.raidResultHTML(R); }

  static cbEnd(win){ if(!CB||CB.over) return; CB.over=true; CB.busy=true; ChallengeView.cbRender(); const L=Challenge.cbLead();
    B={ctx:{kind:'rogue',node:CB.kind},allies:[{c:L.c,hp:L.hp,maxhp:L.maxhp}],enemies:[],over:true,s:{}};
    Economy.bump('battle'); ChallengeView.bResultShow(ChallengeCtl.rogueEnd(win),'.cb'); CB=null; }

  static dgEnter(run){ const c=run.map.cells[run.pos]; run.msg=''; if(c.done&&c.t!=='stairs'&&c.t!=='boss'){ Core.mark('prog'); Challenge.render(); return; }
    const t=c.t;
    if(t==='battle'||t==='elite'||t==='boss'){ Core.mark('prog'); if(run.mode!=='auto') ChallengeView.cbStart(t); else Challenge.rgBattle(t); return; }
    if(t==='stairs'){ run.msg='아래로 이어지는 계단이에요.'; Core.mark('prog'); Challenge.render(); return; }
    c.done=true;
    if(t==='treasure'){ run.pick=Challenge.rgPick3(run); run.msg='유물 상자를 찾았어요!'; }
    if(t==='rest'){ run.rest=true; run.msg='조용한 야영지예요. 무엇을 할까요?'; }
    if(t==='event'){ const x=Math.random();
      if(x<0.25){ run.squad.forEach(id=>{ if(run.hp[id]>0) run.hp[id]=Math.min(1,run.hp[id]+0.4); }); run.msg='맑은 샘을 찾았어요. 체력이 크게 회복됐어요.'; }
      else if(x<0.5&&run.mode==='card'){ run.cpick=Challenge.cardOffer(run); run.msg='쓰러진 탐사대의 전술 기록을 찾았어요. 카드 1장을 고를 수 있어요.'; }
      else if(x<0.7){ if(Math.random()<0.5){ run.pick=Challenge.rgPick3(run); run.msg='수상한 상자에서 유물이 나왔어요!'; } else { run.squad.forEach(id=>{ if(run.hp[id]>0) run.hp[id]=Math.max(0.05,run.hp[id]-0.2); }); run.msg='함정이었어요! 모두 체력 -20%.'; } }
      else if(x<0.85){ const m=run.map; m.cells.forEach((cc,i)=>{ if(cc) cc.seen=true; }); run.msg='낡은 지도를 주웠어요. 이 구역의 구조가 모두 드러났어요.'; }
      else { run.relics.push('train'); run.msg='잠깐의 실전 훈련. 공격 +5%.'; } }
    Core.mark('prog'); Challenge.render(); }

    // 심연 탐사 전용 화면(진행 중일 때 화면 전체를 써요)
  /* 탐사 끝내기(Controller): 정산 뒤 결과 창 */
static rgAbandon(why){ const html=ChallengeCtl.rgFinish(false); setTimeout(()=>ChallengeView.openRgResult(html,'탐사가 끝났어요',why),0); }

    /* 탐사 전투 끝(Controller): 정산 → 보스 승리·패배면 탐사 끝, 아니면 효과음 → 결과 */
static rogueEnd(win){ const R=Challenge.rogueSettle(win); if(R&&R.finish) return ChallengeCtl.rgFinish(R.done); if(R) Art.sfx('승리'); return ChallengeView.rogueResultHTML(R); }

    /* 탐사 끝(Controller): 정산 → 효과음 → 결과 */
static rgFinish(done){ const R=Challenge.rgFinishSettle(done); Art.sfx(done?'SSR':'확인'); return ChallengeView.rgFinishHTML(R); }

  static towerGo(tid){ const t=Challenge.towerById(tid); if(!t) return; const fl=((Core.progRead('tower')[tid]||{}).best||0)+1, st=Challenge.towerStage(tid,fl);
    if(t.allow&&!G.chars.some(c=>Characters.own(c.id)&&t.allow(c))){ CoreView.toast(`${t.desc} — 출전할 수 있는 ${System.T('crew')}이(가) 없어요`); return; }
    squadSel=null; FORM=null; CharactersView.openFormation(st,{kind:'tower',tid,floor:fl,allow:t.allow,code:'',extra:`data-v="${esc(tid)}"`},'towerstart'); }

    /* 탑 끝(Controller): 정산 → 효과음 → 결과 */
static towerEnd(win){ const R=Challenge.towerSettle(win); Art.sfx(win?'승리':'패배'); return ChallengeView.towerResultHTML(R); }
}

class ChallengeView {
    /* 레이드 결과(View) */
static raidResultHTML(R){ return `<h2 class="disp" style="color:var(--rose);margin:0">${R.killed?'토벌 완료!':'레이드 종료'}</h2><div class="rd-big">${nf(R.dealt)}<small>이번 피해</small></div>
    <div class="rd-bar"><i style="width:${Math.min(100,R.ratio*100)}%"></i><span>${Math.min(100,Math.floor(R.ratio*1000)/10)}%</span></div>
    <p style="margin:6px 0">${Object.keys(R.got).length?'달성 보상: '+Core.rewardText(R.got):'다음 보상까지 '+(R.next!=null?Math.ceil((R.next-R.ratio)*100)+'%':'—')}<br>참가 ${System.T('crew')} 경험치 +80</p>
    <button class="btn" data-act="bdone">계속</button>`; }

  static pixFill(){ document.querySelectorAll('img[data-pix]:not([src])').forEach(el=>{ const c=charById(el.dataset.pix); if(!c) return; Challenge.pixSprite(c).then(u=>{ if(u){ el.src=u; el.parentNode&&el.parentNode.classList.add('has'); } }); }); }

  static cardHTML(cd,opt){ opt=opt||{}; const c=charById(cd.o), u=opt.u, ty=Challenge.cardType(cd), df=CARD_DEF[cd.k]||CARD_DEF.strike;
    return `<button class="cd t-${ty} ${cd.up?'up':''} ${opt.cls||''}" ${opt.act?`data-act="${opt.act}" data-i="${opt.i}"`:''} ${opt.dis?'disabled':''} style="--ec:${c?ECOL[c.elem]:'var(--rose)'};${opt.sty||''}"><em class="cost">${Core.cardCost(cd)}</em><div class="cd-art">${CoreView.cardArtHTML(cd)}</div><div class="cd-tx"><b>${esc(Challenge.cardName(cd))}</b><span>${SystemView.cardTxt(cd,u)}</span><small>${esc(c?c.name:'')}${df.x?' · 소멸':''}</small></div></button>`; }

  static cbStart(kind){ const run=Core.progRead('rogue').run; const en=Challenge.rgEnemies({k:run.k,floor:Challenge.rgEq(run,kind)},kind);
    const units=Challenge.rgUnits(run,run.squad), L=units[0]; L.maxhp=Math.round(L.maxhp*2.2); const fr=run.hp[L.c.id]; L.hp=Math.round(L.maxhp*(fr==null?1:fr));
    const bs=run.squad.map(charById).filter(Boolean).map(Core.stats), avg=k=>bs.reduce((s,x)=>s+x[k],0)/Math.max(1,bs.length);
    // 적의 세기는 리더를 기준으로 정해요(체력 = 리더 공격 몇 번, 공격 = 리더 최대 체력 몇 %). 층이 깊을수록 강해지고, 탐사대가 강하면 조금만 약해져요.
    const R=Math.min(2,Math.max(0.5,Core.teamPower(run.squad)/Math.max(1,Characters.stagePower({enemies:en})))), q=Math.pow(R,-0.3), A=L.atk, HL=L.maxhp, tt=Math.max(0,Math.min(1,(Challenge.rgEq(run,kind)-1)/(RG_FLOORS-1)));
    const many=en.length>=3?0.8:1;
    const HK={battle:[(5.5+4.5*tt)*many,(5.5+4.5*tt)*many],elite:[16+10*tt,5+2.5*tt],boss:[44,8]}[kind], PK={battle:[0.07+0.04*tt,0.07+0.04*tt],elite:[0.11+0.05*tt,0.06+0.03*tt],boss:[0.14,0.075]}[kind];
    const enemies=en.map((e,i)=>{ const main=i===0&&kind!=='battle'; return {i,name:e.name,elem:e.elem,boss:!!e.boss,maxhp:Math.round(A*(main?HK[0]:HK[1])*q*(0.92+Math.random()*0.16)),dmg:HL*(main?PK[0]:PK[1])*q,def:e.def,str:1,blk:0,vul:0,mark:0,bleed:0,weak:0,enr:false}; });
    enemies.forEach(e=>e.hp=e.maxhp); if(Challenge.rgCount('opener')) enemies.forEach(e=>e.mark+=2*Challenge.rgCount('opener'));
    CB={kind,run,units,allies:[L],enemies,defA:avg('def'),R,str:1,draw:Challenge.cbShuffle(run.deck.map(x=>Object.assign({},x))),hand:[],disc:[],exh:[],energy:0,block:0,turn:0,tgt:0,taunt:-1,busy:false,over:false,log:[],ult:Math.min(ULT_MAX,2*Challenge.rgCount('ultcharge')),sel:-1,atkN:0,phoenix:Challenge.rgCount('phoenix')>0,last:null,charge:3*Challenge.rgCount('capacitor'),rage:0};
    const title=`B${run.floor} · ${DG_ROOM[kind][1]}`, ab=LEAD_AB[L.role]||LEAD_AB.atk;
    $('#ov').innerHTML=`<div class="cb v3"><div class="bt-bg" style="${ArtView.bgStyle(P().dgBg||'폐선로')}"></div><div class="cb-dim"></div>
    <div class="bt-top"><span class="ttl"><i>DUNGEON · CARD BATTLE</i>${esc(title)}</span><button data-act="cbdeck">덱</button><button data-act="cbquit">후퇴</button></div>
    <div class="cb-en" id="cbEn"></div><div class="cb-log" id="cbLog"></div>
    <div class="cb-lead" id="cbLead"><div class="cl-art">${CoreView.art(L.c)}</div><div class="cl-info"><b>${esc(L.name)} <small>리더</small></b><span class="hpb"><i id="clHp"></i></span><span class="cl-n" id="clN"></span><span class="cl-ab" title="${esc(ab[1])}">◆ ${esc(ab[0])} · ${esc(ab[1])}</span><span class="cl-st" id="clSt"></span></div>
      <button class="cl-ult" id="cbUlt" data-act="cbult"><i id="cbUltG"></i><b>필살</b><small>${esc(L.c.skill.name)}</small></button></div>
    <div class="cb-bar"><div class="cb-orb" id="cbOrb"></div><div class="cb-blk" id="cbBlk"></div><span class="cb-pile" id="cbPile"></span><button class="btn sm" data-act="cbend" id="cbEndB">턴 종료</button></div>
    <div class="cb-detail" id="cbDet" hidden></div>
    <div class="cb-hand fan" id="cbHand"></div></div>`;
    $('#ov').hidden=false; SystemView.sceneBgm(); Challenge.cbIntents(); ChallengeView.cbTurn(true); }

  static cbTurn(first){ if(!CB||CB.over) return; const L=Challenge.cbLead(); CB.turn++; CB.block=CB.retain?Math.floor(CB.block*0.5):0; CB.retain=false; CB.counter=0; CB.taunt=-1; CB.played=0; CB.disc1=false; CB.chainOK=false; CB.firstFree=Challenge.rgCount('firstfree')>0; CB.last=null; CB.sel=-1;
    CB.energy=3+(first&&Challenge.rgCount('burst')?1:0);
    if(L.role==='def'){ const b=Math.round(L.maxhp*0.06); CB.block+=b; }
    Challenge.cbDraw(5+(L.role==='sup'?1:0)+(first?Challenge.rgCount('spd'):0)); CB.busy=false; ChallengeView.cbRender(); }

  static cbIntentHTML(e){ const it=e.intent; if(!it) return ''; const L=Challenge.cbLead(), dm=Challenge.cbEnemyDmg(e,it.m||1,L);
    if(it.k==='atk'||it.k==='heavy') return `<span class="it it-atk ${it.k==='heavy'?'heavy':''}">⚔ ${nf(dm)}</span>`;
    if(it.k==='multi') return `<span class="it it-atk">⚔ ${nf(dm)}×${it.n}</span>`;
    if(it.k==='def') return `<span class="it it-def">🛡 방어</span>`;
    return `<span class="it it-buf">▲ 강화</span>`; }

  static cbRender(){ if(!CB) return; const es=Core.cbAliveE(); if(!es.includes(CB.enemies[CB.tgt])) CB.tgt=(es[0]||{i:0}).i; const L=Challenge.cbLead();
    $('#cbEn').innerHTML=CB.enemies.map(en=>`<button class="ce ${en.hp<=0?'dead':''} ${en.boss?'boss':''} ${CB.tgt===en.i&&en.hp>0?'tg':''}" id="ce${en.i}" data-act="cbtgt" data-i="${en.i}" style="--ec:${ECOL[en.elem]}">${en.hp>0?ChallengeView.cbIntentHTML(en):''}<div class="ce-art">${CharactersView.enemyArt(en)}</div><b>${esc(en.name)}</b><span class="hpb"><i style="width:${Math.max(0,en.hp/en.maxhp*100)}%"></i></span><span class="ce-n">${nf(Math.max(0,en.hp))}${en.blk?` <em class="eb">🛡${nf(en.blk)}</em>`:''}${en.mark?` <em class="em">낙인 ${en.mark}</em>`:''}${en.bleed?` <em class="ebl">출혈 ${en.bleed}</em>`:''}${en.weak?` <em class="ew">약화 ${en.weak}</em>`:''}${en.vul?` <em class="ev">취약 ${en.vul}</em>`:''}${en.str>1?` <em class="es">공↑</em>`:''}</span></button>`).join('');
    $('#clHp').style.width=Math.max(0,L.hp/L.maxhp*100)+'%'; $('#clN').textContent=`${nf(Math.max(0,L.hp))} / ${nf(L.maxhp)}`; $('#cbLead').classList.toggle('down',L.hp<=0);
    $('#clSt').innerHTML=[CB.charge?`충전 ${CB.charge}`:'',CB.rage?'투지':'',CB.str>1?`공격 +${Math.round((CB.str-1)*100)}%`:'',CB.retain?'보존':'',CB.counter?'반격':'',CB.disc1?'다음 카드 -1':'',L.role==='atk'?`맹공 ${CB.atkN%3}/3`:''].filter(Boolean).map(x=>`<em>${x}</em>`).join('');
    const ub=$('#cbUlt'); ub.disabled=CB.busy||CB.ult<ULT_MAX; ub.classList.toggle('ready',CB.ult>=ULT_MAX); $('#cbUltG').style.height=(CB.ult/ULT_MAX*100)+'%';
    $('#cbOrb').innerHTML=`<b>${CB.energy}</b><small>/3</small>`; $('#cbBlk').innerHTML=`🛡 <b>${nf(CB.block)}</b>`; $('#cbBlk').classList.toggle('on',CB.block>0);
    $('#cbPile').textContent=`덱 ${CB.draw.length} · 버림 ${CB.disc.length}`;
    const n=CB.hand.length; if(CB.sel>=n) CB.sel=-1;
    $('#cbHand').innerHTML=CB.hand.map((cd,i)=>{ const u=System.cbUnit(cd.o), dis=CB.busy||Core.cardCost(cd)>CB.energy||(cd.k==='echo'&&!CB.last); return ChallengeView.cardHTML(cd,{u,act:'cbsel',i,dis:CB.busy,cls:(dis?'na ':'')+(CB.sel===i?'sel':''),sty:Challenge.cbFanStyle(i,n,CB.sel===i,CB.sel)}); }).join('');
    const det=$('#cbDet'); if(CB.sel>=0&&CB.hand[CB.sel]){ const cd=CB.hand[CB.sel], u=System.cbUnit(cd.o), can=!CB.busy&&Core.cardCost(cd)<=CB.energy&&!(cd.k==='echo'&&!CB.last), tx=SystemView.cardTxt(cd,u), kws=Object.keys(KW).filter(k=>tx.includes(k)||((CARD_DEF[cd.k]||{}).x&&k==='소멸'));
      det.hidden=false; det.innerHTML=`<div class="cdd-h"><b>${esc(Challenge.cardName(cd))}</b><span>비용 ${Core.cardCost(cd)} · ${esc(u.c.name)}</span></div><p>${tx}</p>${kws.map(k=>`<p class="kw"><b>${k}</b> ${KW[k]}</p>`).join('')}<div class="row"><button class="btn sm" data-act="cbplay" data-i="${CB.sel}" ${can?'':'disabled'}>${can?'사용':Core.cardCost(cd)>CB.energy?'에너지 부족':'쓸 수 없어요'}</button><button class="btn sm ghost" data-act="cbsel" data-i="-1">닫기</button></div>`; }
    else { det.hidden=true; det.innerHTML=''; }
    $('#cbEndB').disabled=CB.busy; }

  static cbHitE(u,e,m,pops){ if(e.hp<=0) return 0; let d=System.cbAtkVal(u,m,e); const weak=BEATS[u.elem]===e.elem; if(e.blk){ const ab=Math.min(e.blk,d); e.blk-=ab; d-=ab; } e.hp=Math.max(0,e.hp-d); pops.push(['ce'+e.i,d?nf(d)+(weak?' 약점':''):'막음',weak?'weak':'']);
    if(e.hp<=0){ CoreView.cbLog(`${e.name} 쓰러짐`); if(e.mark&&Challenge.rgCount('markburst')){ const o=Core.cbAliveE(); o.forEach(x=>{ x.mark+=e.mark; pops.push(['ce'+x.i,'낙인 +'+e.mark,'weak']); }); e.mark=0; } if(Challenge.rgCount('vamp')){ const L=Challenge.cbLead(), h=Math.round(L.maxhp*0.08*Challenge.rgCount('vamp')); L.hp=Math.min(L.maxhp,L.hp+h); pops.push(['cbLead','+'+nf(h),'heal']); } }
    if(e.boss&&!e.enr&&e.hp>0&&e.hp<e.maxhp/2){ e.enr=true; e.str+=0.3; CoreView.cbLog(`${e.name}이(가) 격노했어요! 공격 증가`); } return d; }

  static cbOnExhaust(pops){ const n=Challenge.rgCount('ashes'); if(!n||!CB) return; const L=Challenge.cbLead(); Core.cbAliveE().forEach(e=>ChallengeView.cbHitE(L,e,0.35*n,pops)); CoreView.cbLog('잿불이 튀어요'); }

  static cbUlt(){ if(!CB||CB.busy||CB.over||CB.ult<ULT_MAX) return; const L=Challenge.cbLead(), sk=L.c.skill, es=Core.cbAliveE(), tg=CB.enemies[CB.tgt]&&CB.enemies[CB.tgt].hp>0?CB.enemies[CB.tgt]:es[0], pops=[];
    CB.ult=0; SystemView.skillCut(L.c,sk.name,true,$('.cb')); Art.sfx('스킬'); CoreView.cbLog(`필살! ${L.name}: ${sk.name}`); if(Challenge.rgCount('ultecho')){ CB.energy+=Challenge.rgCount('ultecho'); Challenge.cbDraw(2); }
    if(sk.kind==='dmg'||sk.kind==='aoe'){ es.forEach(e=>ChallengeView.cbHitE(L,e,sk.power*(sk.kind==='dmg'&&e===tg?2.4:1.4),pops)); } else { CoreView.cbSkill(L,sk,sk.power*2.2,tg,es,pops); if(tg) ChallengeView.cbHitE(L,tg,1.2,pops); }
    const r=$('.cb'); if(r){ r.classList.remove('shake'); void r.offsetWidth; r.classList.add('shake'); }
    ChallengeView.cbRender(); pops.forEach(p=>CoreView.cbFx(...p)); if(!Core.cbAliveE().length) setTimeout(()=>ChallengeCtl.cbEnd(true),500); }

  static cbEndTurn(){ if(!CB||CB.busy||CB.over) return; CB.busy=true; CB.sel=-1; CB.disc.push(...CB.hand); CB.hand=[]; ChallengeView.cbRender();
    const acts=CB.enemies.filter(en=>en.hp>0); let k=0; const L=Challenge.cbLead();
    const step=()=>{ if(!CB||CB.over) return; if(k>=acts.length){ CB.enemies.forEach(en=>{ if(en.vul>0) en.vul--; if(en.weak>0) en.weak--; }); if(L.hp<=0){ ChallengeCtl.cbEnd(false); return; } Challenge.cbIntents(); ChallengeView.cbTurn(false); return; }
      const e=acts[k++]; if(e.hp<=0){ step(); return; } const pops=[];
      if(e.bleed>0){ const d=Math.max(1,Math.round(L.atk*0.12*e.bleed*(1+0.5*Challenge.rgCount('deepcut')))); e.hp=Math.max(0,e.hp-d); pops.push(['ce'+e.i,nf(d)+' 출혈','weak']); e.bleed--; if(e.hp<=0){ CoreView.cbLog(`${e.name}이(가) 출혈로 쓰러졌어요`); ChallengeView.cbRender(); pops.forEach(p=>CoreView.cbFx(...p)); if(!Core.cbAliveE().length){ setTimeout(()=>ChallengeCtl.cbEnd(true),500); return; } setTimeout(step,420); return; } }
      e.blk=0; const it=e.intent||{k:'atk',m:1};
      const hit=m=>{ if(L.hp<=0) return; let d=Challenge.cbEnemyDmg(e,m,L), ab=0; if(CB.block){ ab=Math.min(CB.block,d); CB.block-=ab; d-=ab; } L.hp=Math.max(0,L.hp-d); pops.push(['cbLead',d?nf(d):'막음',d?'':'heal']);
        if(ab&&Challenge.rgCount('thorns')){ const r=Math.round(ab*0.3*Challenge.rgCount('thorns')); e.hp=Math.max(0,e.hp-r); pops.push(['ce'+e.i,nf(r)+' 가시','weak']); }
        if(CB.counter&&e.hp>0){ e.hp=Math.max(0,e.hp-CB.counter); pops.push(['ce'+e.i,nf(CB.counter)+' 반격','weak']); }
        if(L.hp<=0&&CB.phoenix){ CB.phoenix=false; L.hp=Math.round(L.maxhp*0.3); CoreView.cbLog('불사의 깃털이 타올라 다시 일어났어요!'); } };
      if(it.k==='atk'||it.k==='heavy') hit(it.m);
      else if(it.k==='multi') for(let n=0;n<(it.n||2);n++) hit(it.m);
      else if(it.k==='def'){ e.blk=Math.round(e.maxhp*0.14); pops.push(['ce'+e.i,'🛡+'+nf(e.blk),'heal']); }
      else { e.str+=0.2; pops.push(['ce'+e.i,'공격↑','']); }
      if(it.k==='heavy'){ const r=$('.cb'); if(r){ r.classList.remove('shake'); void r.offsetWidth; r.classList.add('shake'); } }
      Art.sfx('타격'); ChallengeView.cbRender(); const ee=document.getElementById('ce'+e.i); if(ee){ ee.classList.remove('act'); void ee.offsetWidth; ee.classList.add('act'); } pops.forEach(p=>CoreView.cbFx(...p));
      if(!Core.cbAliveE().length){ setTimeout(()=>ChallengeCtl.cbEnd(true),500); return; }
      if(L.hp<=0){ setTimeout(()=>ChallengeCtl.cbEnd(false),500); return; } setTimeout(step,520); };
    setTimeout(step,250); }

    /* --- 던전 화면 --- */
static dgHTML(run){ const map=run.map, here=run.pos, W=map.w;
    const reach=new Set(); map.cells.forEach((c,i)=>{ if(c&&c.seen&&i!==here&&Challenge.dgPath(map,here,i)) reach.add(i); });
    const cells=map.cells.map((c,i)=>{ if(!c) return `<div class="dg-c wall"></div>`; if(!c.seen) return `<div class="dg-c fog"></div>`;
      const r=i%W<W-1&&map.cells[i+1]&&Challenge.dgLinked(map,i,i+1)&&(c.vis||map.cells[i+1].vis), b=map.cells[i+W]&&Challenge.dgLinked(map,i,i+W)&&(c.vis||map.cells[i+W].vis);
      const t=c.done&&!['stairs','boss'].includes(c.t)?(c.t==='start'?'start':'empty'):c.t, ic=DG_ROOM[t][0];
      return `<button class="dg-c room ${c.vis?'vis':'scout'} r-${t} ${r?'dr':''} ${b?'db':''} ${i===here?'here':''} ${reach.has(i)?'go':''}" data-act="dgmove" data-v="${i}" ${reach.has(i)?'':'disabled'} title="${esc(DG_ROOM[t][1])}"><i>${ic}</i></button>`; }).join('');
    const lead=charById(run.squad.find(id=>run.hp[id]>0)||run.squad[0]);
    const hx=here%W, hy=Math.floor(here/W);
    return `<div class="dg-wrap"><div class="dg" id="dgMap" style="--w:${W};--h:${map.h}">${cells}<div class="dg-hero" id="dgHero" style="--x:${hx};--y:${hy}">${lead?`<img data-pix="${lead.id}" alt=""><span class="dg-fb">${esc(lead.name.slice(0,1))}</span>`:''}</div></div>
    <div class="dg-leg">${['battle','elite','treasure','rest','event',run.floor>=DG_FLOORS?'boss':'stairs'].map(k=>`<span><i class="r-${k}">${DG_ROOM[k][0]}</i>${DG_ROOM[k][1]}</span>`).join('')}</div></div>`; }

    /* 주인공이 경로를 따라 걷는 연출(View) — 끝나면 done */
static dgHeroWalk(path,W,done){ const hero=$('#dgHero'); let k=1; const go=()=>{ if(k<path.length){ const i=path[k++]; if(hero){ hero.style.setProperty('--x',i%W); hero.style.setProperty('--y',Math.floor(i/W)); } Art.sfx('확인'); setTimeout(go,170); return; } done(); }; go(); }

  static rgRunHTML2(run){ const g=Core.progRead('rogue'); const c=run.map.cells[run.pos];
    let body;
    let ov='';
    if(run.pick){ ov=`<div class="rg-ov"><div class="rg-ban">유물을 선택하십시오</div><div class="rg-picks rg-ovp">`+run.pick.filter(k=>RELICS[k]).map((k,j)=>{ const n=Challenge.rgCount(k); return `<button class="rg-relic" style="animation-delay:${j*0.09}s" data-act="rgrelic" data-v="${k}"><b>${esc(RELICS[k][0])}${n?` <small>×${n+1}</small>`:''}</b><span>${esc(RELICS[k][1])}</span></button>`; }).join('')+`</div><button class="btn rg-skipb" data-act="rgskip">넘기기 <small>(체력 10% 회복)</small></button></div>`; }
    else if(run.cpick){ ov=`<div class="rg-ov"><div class="rg-ban">카드를 선택하십시오</div><div class="cd-row rg-ovc">${run.cpick.map((cd,i)=>ChallengeView.cardHTML(cd,{act:'rgcard',i,sty:`animation-delay:${i*0.09}s`})).join('')}</div><button class="btn rg-skipb" data-act="rgcard" data-i="-1">넘기기</button></div>`; }
    if(run.upg){ const list=run.deck.map((cd,i)=>({cd,i})).filter(x=>!x.cd.up); body=`<h4 class="ch-sub">강화할 카드를 고르세요</h4><div class="cd-row wrap">${list.map(x=>ChallengeView.cardHTML(x.cd,{act:'rgupg',i:x.i})).join('')}</div><div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="rgupg" data-i="-1">취소</button></div>`; }
    else if(run.rm){ body=`<h4 class="ch-sub">덱에서 뺄 카드를 고르세요</h4><div class="cd-row wrap">${run.deck.map((cd,i)=>ChallengeView.cardHTML(cd,{act:'rgrm',i})).join('')}</div><div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="rgrm" data-i="-1">취소</button></div>`; }
    else if(run.rest){ body=`<h4 class="ch-sub">야영지</h4><div class="rg-nodes"><button class="rg-node n-rest" data-act="rgrest" data-v="heal"><em>⛺</em><b>휴식</b><span>체력 35% 회복 · 쓰러진 대원 부활</span></button>${run.mode==='card'?`<button class="rg-node n-treasure" data-act="rgrest" data-v="upg"><em>⚒</em><b>카드 강화</b><span>카드 1장을 + 로 강화</span></button><button class="rg-node n-event" data-act="rgrest" data-v="rm"><em>✂</em><b>정리</b><span>덱에서 카드 1장 빼기</span></button><button class="rg-node n-rest" data-act="rgsave"><em>💾</em><b>저장하고 나가기</b><span>여기서 멈추고 나중에 이어서 해요. 탐사 경로는 매주 월요일에 바뀌어서, 그 전에 돌아와야 해요</span></button>`:`<button class="rg-node n-treasure" data-act="rgrest" data-v="train"><em>⚒</em><b>훈련</b><span>공격 +5%</span></button>`}</div>`; }
    else { body=ChallengeView.dgHTML(run)+((c.t==='stairs')?`<div class="row" style="margin-top:8px"><button class="btn" data-act="dgdown">▼ 제${run.floor+1}구역으로 이동</button></div>`:`<p class="muted dg-hint">밝은 방을 누르면 그곳으로 이동해요. 옆방은 미리 보여요.</p>`); }
    return `${ov}<section class="ch-card rog dgcard"><div class="ch-h"><i>EXPEDITION · ${run.floor}/${DG_FLOORS}</i><h3>${esc(System.T('abyss'))}</h3>${run.msg?`<span class="rg-msg">${esc(Challenge.rgMessage(run))}</span>`:''}</div>
    <div class="rg-sq">${run.squad.map((id,i)=>{ const c=charById(id), h=run.hp[id]==null?1:run.hp[id]; if(!c) return ''; if(run.mode!=='auto'&&i>0) return `<div class="rg-u card"><div class="rg-a">${CoreView.art(c)}</div><b>${esc(c.name)}</b><span class="muted" style="font-size:.62rem">카드</span></div>`; return `<div class="rg-u ${h<=0?'down':''} ${run.mode!=='auto'?'lead':''}"><div class="rg-a">${CoreView.art(c)}</div><b>${esc(c.name)}${run.mode!=='auto'?' · 리더':''}</b><span class="hpb"><i style="width:${Math.round(h*100)}%"></i></span></div>`; }).join('')}</div>
    ${run.mode!=='auto'&&charById(run.squad[0])?`<p class="muted" style="font-size:.75rem;margin:4px 0">◆ 리더 능력 「${esc((LEAD_AB[charById(run.squad[0]).role]||LEAD_AB.atk)[0])}」 ${esc((LEAD_AB[charById(run.squad[0]).role]||LEAD_AB.atk)[1])} · 필살: ${esc(charById(run.squad[0]).skill.name)}</p>`:''}
    ${run.relics.length?`<div class="rg-rel">${[...new Set(run.relics)].map(k=>`<span title="${esc(RELICS[k][1])}">${esc(RELICS[k][0])}${Challenge.rgCount(k)>1?' ×'+Challenge.rgCount(k):''}</span>`).join('')}</div>`:''}
    ${body}<div class="row" style="margin-top:10px">${run.mode==='card'?`<button class="btn sm ghost" data-act="rgdeck">덱 ${run.deck.length}장 보기</button>`:''}<button class="btn sm ghost" data-act="rgquit">탐사 끝내기</button></div></section>`; }

  static rgDeckModal(deck){ const miss=new Set(deck.filter(cd=>!Core.cardIllObj(cd)).map(cd=>cd.o+'|'+cd.k)).size;
    CoreView.openModal(`${head('덱',`<span class="muted">${deck.length}장 · 매 턴 5장을 뽑고 에너지 3으로 써요</span>`)}${miss&&Core.imgReady()?`<div class="row" style="margin:0 0 8px"><button class="btn sm" data-act="cdart">카드 일러스트 그리기 (${miss}장)</button><span class="muted" style="font-size:.75rem">대원·카드마다 한 장씩, 그림 AI 사용량이 들어요</span></div>`:''}<div class="cd-row wrap">${deck.map(cd=>ChallengeView.cardHTML(cd,{})).join('')}</div>`); }

  static openRgForm(){ const busy=busyIds();
    if(!RF){ const prev=(Core.progRead('rogue').lastSquad||P().squad||[]).filter(id=>Characters.own(id)&&charById(id)&&!busy.has(id)).slice(0,4); RF={s:prev.length?[0,1,2,3].map(i=>prev[i]||null):Challenge.rfAuto(),sel:0,filter:'all'}; }
    const L=charById(RF.s[0]), ids=Challenge.rfIds(), deck=ids.length?Challenge.rgDeck(ids):[];
    const chip=cd=>`<span class="rf-cd t-${Challenge.cardType(cd)}">${esc(Challenge.cardName(cd))}</span>`;
    const lead=L?`<button class="rf-lead ${RF.sel===0?'sel':''}" data-act="rfslot" data-i="0" style="--ec:${ECOL[L.elem]}"><div class="rf-la">${CoreView.art(L)}</div><div class="rf-lt"><i>LEADER · 직접 싸워요</i><b>${esc(L.name)}</b><span class="el" style="--ec:${ECOL[L.elem]}">${esc(L.elem)}</span> <small>${esc(ROLE[L.role])} · Lv.${Characters.own(L.id).lv}</small>
      <p><b>리더 능력 · ${esc((LEAD_AB[L.role]||LEAD_AB.atk)[0])}</b> ${esc((LEAD_AB[L.role]||LEAD_AB.atk)[1])}</p><p><b>필살기 · ${esc(L.skill.name)}</b> 게이지 ${ULT_MAX}칸이 차면 써요.</p><div class="rf-cds">${chip({k:'strike',o:L.id})}<em>×4</em>${chip({k:'guard',o:L.id})}<em>×4</em></div></div></button>`
      :`<button class="rf-lead empty ${RF.sel===0?'sel':''}" data-act="rfslot" data-i="0"><span>+</span><b>리더를 골라 주세요</b><small>아래 목록에서 ${esc(System.T('crew'))}을(를) 누르면 이 자리에 들어가요</small></button>`;
    const sup=i=>{ const c=charById(RF.s[i]); if(!c) return `<button class="rf-sup empty ${RF.sel===i?'sel':''}" data-act="rfslot" data-i="${i}"><span>+</span><small>카드 ${i}</small></button>`;
      const cds=L?Challenge.rgDeck([L.id,c.id]).slice(8):[]; return `<button class="rf-sup ${RF.sel===i?'sel':''}" data-act="rfslot" data-i="${i}" style="--ec:${ECOL[c.elem]}"><div class="rf-sa">${CoreView.art(c)}</div><b>${esc(c.name)}</b><small>${esc(ROLE[c.role])}</small><div class="rf-cds">${cds.map(chip).join('')}</div></button>`; };
    const list=G.chars.filter(c=>Characters.own(c.id)&&(RF.filter==='all'||c.role===RF.filter)).sort((a,b)=>charPower(b)-charPower(a));
    CoreView.openModal(`${head(esc(System.T('abyss'))+' 편성','<span class="muted">리더 1명이 직접 싸우고, 뒤의 3명은 카드가 되어 덱에 들어가요</span>')}
    <div class="rf-tee">${lead}<div class="rf-stem"></div><div class="rf-sups">${[1,2,3].map(sup).join('')}</div></div>
    <p class="muted" style="margin:6px 0 0;font-size:.75rem">자리를 누른 뒤 아래에서 ${esc(System.T('crew'))}을(를) 고르세요. 이미 편성된 ${esc(System.T('crew'))}을(를) 고르면 자리가 바뀌어요.</p>
    <div class="row" style="margin-top:8px"><button class="btn sm" data-act="rfauto">자동 편성</button><button class="btn sm ghost" data-act="rfclr">비우기</button>${deck.length&&Core.imgReady()&&deck.some(cd=>!Core.cardIllObj(cd))?'<button class="btn sm ghost" data-act="cdart">카드 일러스트 그리기</button>':''}</div>
    <div class="ftools" style="margin-top:10px"><div class="chips">${[['all','전체'],...Object.entries(ROLE)].map(([v,l])=>`<button class="chip ${RF.filter===v?'on':''}" data-act="rffil" data-v="${v}">${esc(l)}</button>`).join('')}</div></div>
    <div class="froster">${list.map(c=>{ const k=RF.s.indexOf(c.id), b=busy.has(c.id); return `<button class="fr r${c.rarity} ${k>=0?'on':''} ${b?'busy':''}" data-act="rfpick" data-id="${c.id}" ${b?'disabled':''} style="--ec:${ECOL[c.elem]}"><div class="fr-art">${CoreView.art(c)}</div><span class="el" style="--ec:${ECOL[c.elem]}">${esc(c.elem)}</span>${b?'<em class="busy">파견</em>':k>=0?`<em class="num">${k?'카드':'리더'}</em>`:''}<b>${esc(c.name)}</b><span>${esc(ROLE[c.role])} · ${nf(charPower(c))}</span></button>`; }).join('')||'<p class="muted">보유한 '+System.T('crew')+'이(가) 없어요.</p>'}</div>
    ${deck.length?`<details class="rf-deck"><summary>시작 덱 ${deck.length}장 전체 보기</summary><div class="cd-row wrap">${deck.map(cd=>ChallengeView.cardHTML(cd,{})).join('')}</div></details>`:''}
    <div class="row" style="margin-top:14px"><button class="btn block" data-act="rfgo" ${L?'':'disabled'}>${L?`탐사 시작 (리더 ${esc(L.name)} · 카드 ${ids.length-1}명)`:'리더를 먼저 골라 주세요'}</button></div>`); }

  static abyssHTML(){ const run=Core.progRead('rogue').run; if(!run||run.v!==2) return ChallengeView.challengeHTML();
    setTimeout(ChallengeView.pixFill,30);
    return `<div class="phead"><button class="back" data-act="rgleave" aria-label="나가기">‹</button><div><i>EXPEDITION</i><h2>${esc(System.T('abyss'))}</h2></div></div>${ChallengeView.rgRunHTML2(run)}`; }

  static challengeHTML(){
    const r=Core.progRead('raid'), b=Challenge.raidBoss(), ratio=r.dmg/b.total, left=Challenge.raidTriesLeft(), g=Core.progRead('rogue'), run=g.run;
    const raid=`<section class="ch-card raid"><div class="ch-h"><i>WEEKLY RAID · Lv.${r.lv}</i><h3>${esc(b.name)}</h3><span>이번 주 함께 깎는 보스예요. 한 번에 ${Math.ceil(RAID_TICKS*GGMCombat.DT)}초 동안 싸우고, 준 피해가 쌓여요.</span></div>
    <div class="rd-hero ${r.killed?'dead':''}" style="--ec:${ECOL[b.elem]}"><div class="rd-bg" style="${b.bg?ArtView.bgStyle(b.bg):ArtView.bgStyle(P().lobbyBg||'')}"></div><div class="rd-glow"></div>
      <div class="rd-boss">${CharactersView.enemyArt(b,'rd-img')}</div><div class="rd-shade"></div>
      <div class="rd-tag"><span class="el" style="--ec:${ECOL[b.elem]}">${esc(b.elem)}</span><i>WEEKLY RAID BOSS</i></div>
      <div class="rd-name"><b>${esc(b.name)}</b><span>Lv.${r.lv} · 남은 체력 ${Math.max(0,100-Math.min(100,Math.floor(ratio*1000)/10))}%</span></div>
      <div class="rd-pats">${Challenge.bossPats(b,true).map(k=>`<span title="${esc(BPATS[k][1])}">${esc(BPATS[k][0])}</span>`).join('')}<span title="체력 50% 이하에서 공격·속도 증가">광폭화</span></div>
      <div class="rd-hp"><i style="width:${Math.max(0,100-Math.min(100,ratio*100))}%"></i><span>${nf(Math.max(0,b.total-r.dmg))} / ${nf(b.total)}</span></div>
      ${r.killed?'<div class="rd-stamp">토벌 완료</div>':''}</div>
    <div class="rd-ms">${RAID_MS.map(([t,rw],i)=>`<span class="${r.got.includes(i)?'on':''}" title="${esc(Core.rewardText(rw))}">${Math.round(t*100)}%</span>`).join('')}</div>
    <div class="row" style="margin-top:10px"><button class="btn" data-act="raidgo" ${left&&!r.killed?'':'disabled'}>${r.killed?'이번 주 토벌 완료':'도전 (오늘 '+left+'/3)'}</button></div>
    <p class="muted" style="margin:6px 0 0;font-size:.78rem">최고 피해 ${nf(r.best||0)} · 토벌하면 다음 주에 더 강한 보스가 나와요.</p></section>`;
    let rog;
    if(!run){ rog=`<section class="ch-card rog"><div class="ch-h"><i>EXPEDITION · ${DG_FLOORS} AREAS</i><h3>${esc(System.T('abyss'))}</h3><span>한 번 고른 4명으로 ${DG_FLOORS}개 구역을 탐사해요. 미지의 경로에서 전투·보물·야영지·사건을 만나고 다음 구역으로 이동해요. 마지막 구역에는 보스가 기다려요. 체력은 이어져요.</span></div>
      <p class="muted" style="margin:8px 0">최고 진척 ${g.best||0}/${RG_FLOORS} · 오늘 ${g.day===today()?g.n:0}번 (3번째부터 보상 25%)</p><div class="rg-mode one"><button class="rg-node n-treasure" data-act="rgnew" data-v="card"><em>🂠</em><b>탐사 시작</b><span>첫 번째로 고른 ${esc(System.T('crew'))}이(가) 리더로 싸우고, 나머지는 카드가 되어 능력을 빌려줘요.</span></button></div></section>`; }
    else if(run.v===2){ const L=charById(run.squad[0]), c=run.map.cells[run.pos]; rog=`<section class="ch-card rog dgcard"><div class="ch-h"><i>EXPEDITION · ${run.floor}/${DG_FLOORS}</i><h3>${esc(System.T('abyss'))} 진행 중</h3><span>${L?`리더 ${esc(L.name)} · `:''}제${run.floor}구역${run.rest?' 야영지':''}${run.saved?' · 저장됨':''}${run.wk&&run.wk!==Challenge.weekKey()?' · 탐사 경로가 바뀌었어요(제1구역부터 다시)':''}</span></div><div class="rg-mode one"><button class="rg-node n-treasure" data-act="go" data-to="abyss"><em>▶</em><b>이어서 탐사하기</b><span>화면 전체로 던전을 탐색해요</span></button></div></section>`; }
    else {
      const nodes=run.pick?`<h4 class="ch-sub">유물을 하나 고르세요</h4><div class="rg-picks">${run.pick.filter(k=>RELICS[k]).map(k=>{ const n=run.relics.filter(x=>x===k).length; return `<button class="rg-relic" data-act="rgrelic" data-v="${k}"><b>${esc(RELICS[k][0])}${n?` <small>×${n+1}</small>`:''}</b><span>${esc(RELICS[k][1])}${n?' · 겹쳐서 더 강해져요':''}</span></button>`; }).join('')}</div><div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="rgskip">고르지 않고 지나가기 (체력 10% 회복)</button></div>`
        :`<h4 class="ch-sub">${run.floor}구역 · 어디로 갈까요?</h4><div class="rg-nodes">${(run.opts||[]).map(k=>`<button class="rg-node n-${k}" data-act="rgnode" data-v="${k}"><em>${RG_NODE[k][0]}</em><b>${RG_NODE[k][1]}</b><span>${RG_NODE[k][2]}</span></button>`).join('')}</div>`;
      rog=`<section class="ch-card rog"><div class="ch-h"><i>EXPEDITION · ${run.floor}/${RG_FLOORS}구역</i><h3>${esc(System.T('abyss'))}</h3>${run.msg?`<span class="rg-msg">${esc(Challenge.rgMessage(run))}</span>`:''}</div>
      <div class="rg-sq">${run.squad.map(id=>{ const c=charById(id), h=run.hp[id]||0; return c?`<div class="rg-u ${h<=0?'down':''}"><div class="rg-a">${CoreView.art(c)}</div><b>${esc(c.name)}</b><span class="hpb"><i style="width:${Math.round(h*100)}%"></i></span></div>`:''; }).join('')}</div>
      ${run.relics.length?`<div class="rg-rel">${[...new Set(run.relics)].map(k=>`<span title="${esc(RELICS[k][1])}">${esc(RELICS[k][0])}${Challenge.rgCount(k)>1?' ×'+Challenge.rgCount(k):''}</span>`).join('')}</div>`:''}
      ${nodes}<div class="row" style="margin-top:10px"><button class="btn sm ghost" data-act="rgquit">탐사 끝내기</button></div></section>`; }
    return `${pageHead('도전','CHALLENGE','lobby')}${raid}${ChallengeView.towerHTML()}${rog}`;
  }

    /* 탐사 전투 결과(View) */
static rogueResultHTML(R){ if(!R) return '<button class="btn" data-act="bdone">계속</button>';
    if(R.v===2) return `<h2 class="disp" style="color:var(--rose);margin:0">전투 승리</h2><p>${R.node==='elite'?'정예를 쓰러뜨렸어요. 유물을 고를 수 있어요.<br>':''}${R.card?'새 카드를 하나 고를 수 있어요.':'계속 탐사해요.'}${R.heal?'<br>응급 키트로 체력을 회복했어요.':''}</p><button class="btn" data-act="bdone">계속</button>`;
    return `<h2 class="disp" style="color:var(--rose);margin:0">${R.floor-1}구역 돌파</h2><p>${R.node==='elite'?'정예를 쓰러뜨렸어요. 유물을 하나 고를 수 있어요.':'다음 구역으로 가요.'}${R.heal?'<br>응급 키트로 체력을 회복했어요.':''}</p><button class="btn" data-act="bdone">계속</button>`; }

    /* 탐사 끝 결과(View) */
static rgFinishHTML(R){ return `<h2 class="disp" style="color:${R.done?'var(--rose)':'#ff5277'};margin:0">${esc(System.T('abyss'))} · ${R.done?'탐사 완료!':'탐사 종료'}</h2><p>${R.v===2?`제${R.floor}구역까지 탐사했어요 (진척 ${R.f}/${RG_FLOORS})`:R.f+'구역까지 갔어요'}.${R.n>2?' (오늘 3번째부터는 보상 25%)':''}<br>${Core.rewardText(R.r)}${R.r.gems?'':`<br><small class="muted">${esc(System.T('currency'))}은(는) 최고 진척 기록을 갱신할 때만 받아요</small>`}</p><button class="btn" data-act="bdone">계속</button>`; }

    /* 심연 탐사 화면 보조(View): 탐사 카드로 스크롤 · 탐사 결과 창 */
static abyssCardFocus(){ setTimeout(()=>{ const el=document.querySelector('.ch-card.rog'); if(el) el.scrollIntoView({block:'start',behavior:'smooth'}); },60); }

  static openRgResult(html,title,note){ CoreView.openModal(`<div class="result" style="position:static">${title?`<p style="margin:0 0 6px"><b>${esc(title)}</b><br><span class="muted">${esc(note||'')}</span></p>`:''}${html.replace('data-act="bdone"','data-act="close"')}</div>`); }

    /* 탑 결과(View) */
static towerResultHTML(R){ return `<h2 class="disp" style="color:${R.win?'var(--rose)':'#ff5277'};margin:0">${R.win?`${R.floor}층 돌파!`:`${R.floor}층 실패`}</h2><p>${R.r?'첫 돌파 보상: '+Core.rewardText(R.r):R.win?'':'편성·속성을 바꾸거나 더 키워서 다시 도전하세요. 전장 규칙을 확인해 보세요.'}</p><button class="btn" data-act="bdone">계속</button>`; }

  static towerHTML(){ const T0=Core.progRead('tower'); return `<section class="ch-card"><div class="ch-h"><i>TRIAL TOWER</i><h3>시련의 탑</h3><span>층마다 강해지는 적과 바뀌는 전장 규칙. 제한 탑은 그 소속·속성 ${System.T('crew')}만 출전해요. 5층마다 보스와 큰 보상.</span></div>
  <div class="tw-list">${Challenge.towerList().map(t=>{ const b=(T0[t.id]||{}).best||0, n=t.allow?G.chars.filter(c=>Characters.own(c.id)&&t.allow(c)).length:G.chars.filter(c=>Characters.own(c.id)).length;
      return `<button class="tw-card" data-act="towergo" data-v="${esc(t.id)}" ${n?'':'disabled'}><b>${esc(t.name)}</b><span>${esc(t.desc)} · 보유 ${n}명</span><br><span>최고 ${b}층 → 다음 ${b+1}층</span></button>`; }).join('')}</div></section>`; }

    /* 대열에 넣은 대원 반응(View): 몸짓 · 한마디 말풍선 — 고른 한마디를 돌려줌(목소리는 처리기가) */
static formJoinShow(c){ const slot=document.querySelector(`.fslot[data-id="${c.id}"]`); if(!slot) return ''; CoreView.charReact(slot.querySelector('.fs-art'),7,'head'); const pool=(c.dupLines.length?c.dupLines:[]).concat(c.lines); const l=rand(pool); if(l){ const b=document.createElement('div'); b.className='fsay'; b.textContent=sub(l); slot.appendChild(b); setTimeout(()=>b.remove(),2600); } return l; }

    /* 전투 결과 창 붙이기(View) — 전투 화면(기본) 또는 카드 전투 화면 */
static bResultShow(html,host='#ov > .bt'){ const d=document.createElement('div'); d.className='result'; d.innerHTML=html; $(host).appendChild(d); }

    /* 전투 배속 단추 표시(View) */
static bSpeedShow(t){ t.textContent=B.speed+'x'; CoreView.chipOn(t,B.speed>1); }
}
