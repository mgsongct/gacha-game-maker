/* ===== 도전: 레이드 · 심연 탐사 ===== */
const RAID_TICKS=700, RG_FLOORS=12;
const RAID_MS=[[0.05,{gems:100,gold:5000}],[0.15,{gems:150,wmat:10,gift:2}],[0.3,{gems:200,core:3}],[0.5,{gems:300,exp:40}],[0.75,{gems:400,core:5}],[1,{gems:800,core:10,wmat:20}]];
function progK(){ const main=G.chapters.filter(c=>c.kind==='main'); let k=0; main.forEach((ch,i)=>{ if(ch.stages.some(s=>P().cleared[s.id])) k=i; }); return k; }
function hashN(s){ let h=0; for(const ch of String(s)) h=(h*31+ch.charCodeAt(0))|0; return Math.abs(h); }
function RAID(){ const p=P(), wk=weekKey(); let r=p.raid; if(!r||r.wk!==wk){ const pr=r&&r.total?r.dmg/r.total:0; const lv=r?Math.max(1,Math.min(6,(r.lv||1)+(r.killed?1:pr<0.5?-1:0))):1; r=p.raid={wk,lv,dmg:0,killed:false,got:[],tries:{},best:0}; mark('prog'); } return r; }
function raidBoss(){ const r=RAID(), pool=[], bgOf={}; G.chapters.filter(c=>c.kind==='main').forEach(ch=>ch.stages.forEach(s=>(s.enemies||[]).forEach(e=>{ if(e.boss&&!pool.some(x=>x.name===e.name)){ pool.push(e); bgOf[e.name]=stageBg(s); } })));
  const src=pool.length?pool[hashN(r.wk)%pool.length]:{name:'거대 잔광',elem:ELEMS[0]}; const b={name:src.name,elem:ELEMS[hashN(r.wk+'e')%3],hp:3000,atk:110,def:50,spd:95,boss:true};
  fitEnemy(b,enemyTarget(progK()+(r.lv-1)*0.6,6,true)*1.3); b.bg=bgOf[b.name]||'';
  if(r.total){ const k=r.total/30/b.hp; b.hp=Math.round(r.total/30); b.atk=Math.round(b.atk*Math.min(1.5,Math.max(0.7,k))); } else { r.total=b.hp*30; mark('prog'); }
  if(r.killed&&r.dmg<r.total) r.killed=false; return Object.assign(b,{total:r.total}); }
function raidTriesLeft(){ const r=RAID(); return Math.max(0,3-(r.tries[today()]||0)); }
function raidEnd(win){ const r=RAID(), b=B.enemies[0], dealt=Math.max(0,Math.round((B.ctx.hp0||0)-b.hp)); r.dmg=Math.min(B.ctx.total,r.dmg+dealt); r.best=Math.max(r.best||0,dealt);
  const ratio=r.dmg/B.ctx.total; if(ratio>=1) r.killed=true; let got={}; RAID_MS.forEach(([t,rw],i)=>{ if(ratio>=t&&!r.got.includes(i)){ r.got.push(i); giveReward(rw); Object.entries(rw).forEach(([k,v])=>got[k]=(got[k]||0)+v); } });
  B.allies.forEach(u=>{ const o=own(u.c.id); if(o) gainExp(o,expR(80)); }); mark('prog'); sfx(r.killed?'승리':'확인');
  return `<h2 class="disp" style="color:var(--rose);margin:0">${r.killed?'토벌 완료!':'레이드 종료'}</h2><div class="rd-big">${nf(dealt)}<small>이번 피해</small></div>
    <div class="rd-bar"><i style="width:${Math.min(100,ratio*100)}%"></i><span>${Math.min(100,Math.floor(ratio*1000)/10)}%</span></div>
    <p style="margin:6px 0">${Object.keys(got).length?'달성 보상: '+rewardText(got):'다음 보상까지 '+(RAID_MS.find(([t],i)=>!r.got.includes(i))?Math.ceil((RAID_MS.find(([t],i)=>!r.got.includes(i))[0]-ratio)*100)+'%':'—')}<br>참가 ${T('crew')} 경험치 +80</p>
    <button class="btn" data-act="bdone">계속</button>`; }
function RG(){ const p=P(); if(!p.rogue||typeof p.rogue!=='object') p.rogue={run:null,best:0,day:'',n:0}; const r=p.rogue.run; if(r&&r.v===3){ r.v=2; r.c3=1; } return p.rogue; }
const RELICS={chain4:['연쇄 반응','한 턴에 카드를 4장째 쓰면 에너지 +1'],brandplus:['피의 낙인','낙인을 걸 때 1개 더'],phoenix:['불사의 깃털','전투마다 한 번, 쓰러질 때 체력 30%로 버텨요'],thorns:['가시 갑옷','보호막으로 막은 피해의 30%를 공격한 적에게 돌려줘요'],opener:['선제 낙인','전투 시작 때 모든 적에게 낙인 2'],lastcard:['마지막 한 장','손에 남은 마지막 카드는 위력 2배'],ultcharge:['필살 충전기','필살 게이지를 2칸 채운 채 전투 시작'],vamp:['흡혈 송곳니','적을 쓰러뜨릴 때마다 리더 체력 8% 회복'],ashes:['잿불','카드가 소멸할 때마다 모든 적에게 피해'],deepcut:['깊은 상처','출혈 피해 +50%'],tempo:['리듬','한 턴에 카드를 6장째 쓰면 카드 2장 뽑기'],markburst:['각인 전염','낙인이 남은 적이 쓰러지면 그 낙인이 다른 적 모두에게 옮겨 붙어요'],ultecho:['잔영','필살을 쓰면 에너지 +1, 카드 2장 뽑기'],capacitor:['축전기','전투 시작 때 충전 3'],firstfree:['첫 수','매 턴 첫 카드 비용 -1'],atk:['날카로운 칼날','공격 +15%'],def:['강화 장갑','방어 +25%'],hp:['생명의 결정','최대 체력 +20%'],spd:['가속 장치','속도 +10%'],burst:['오버드라이브','전투 시작 BURST +40%'],heal:['응급 키트','전투가 끝날 때마다 체력 15% 회복'],loot:['전리품 자석','탐사 보상 +30%'],res:['공명 코어','공격 +8% · 체력 +8%'],train:['실전 훈련','공격 +5% (겹쳐요)']};
const RG_NODE={battle:['⚔','전투','일반 적'],elite:['☠','정예','강한 적 · 이기면 유물'],rest:['⛺','휴식','체력 35% 회복, 쓰러진 대원 부활'],treasure:['✦','보물','유물 1개 고르기'],event:['?','사건','무슨 일이 생길지 몰라요'],boss:['♛','보스','마지막 전투']};
function rgCount(id){ const run=RG().run; return run?run.relics.filter(x=>x===id).length:0; }
function rgOpts(run){ if(run.floor>=RG_FLOORS) return ['boss']; const w=[['battle',45],['elite',15],['rest',15],['treasure',10],['event',15]]; const out=[]; let guard=0;
  while(out.length<3&&guard++<40){ let x=Math.random()*100; const k=w.find(([_,p])=>(x-=p)<0)[0]; if(!out.includes(k)) out.push(k); } if(!out.includes('battle')&&!out.includes('elite')) out[0]='battle'; return out; }
const CRELICS=['chain4','brandplus','phoenix','thorns','opener','lastcard','ultcharge','vamp','firstfree','ashes','deepcut','tempo','markburst','ultecho','capacitor','atk','hp','loot'];
function rgPick3(run){ const take=(arr,n)=>{ const a=[...arr], o=[]; while(o.length<n&&a.length) o.push(a.splice(Math.floor(Math.random()*a.length),1)[0]); return o; };
  if(run.c3){ const fresh=CRELICS.filter(k=>!run.relics.includes(k)||['atk','hp','loot'].includes(k)); return take(fresh.length>=3?fresh:CRELICS,3); }
  let out=take(Object.keys(RELICS).filter(k=>k!=='train'&&!run.relics.includes(k)),3);
  if(out.length<3) out.push('train');
  if(out.length<3) out=out.concat(take(Object.keys(RELICS).filter(k=>k!=='train'&&!out.includes(k)),3-out.length));
  return out; }
function rgEnemies(run,kind){ const pool=[]; G.chapters.filter(c=>c.kind==='main').forEach(ch=>ch.stages.forEach(s=>(s.enemies||[]).forEach(e=>{ if(!pool.some(x=>x.name===e.name)) pool.push(e); })));
  const pick=boss=>{ const c=pool.filter(e=>!!e.boss===boss); const src=(c.length?c:pool)[Math.floor(Math.random()*(c.length||pool.length||1))]||{name:'미확인 적',elem:ELEMS[0]}; return {name:src.name,elem:src.elem||ELEMS[0],hp:900,atk:85,def:35,spd:92,boss}; };
  const k=run.k+run.floor*0.12, i=run.floor*0.5; let en;
  if(kind==='boss'){ en=[pick(true),pick(false)]; fitEnemy(en[0],enemyTarget(k,i,true)*1.4); fitEnemy(en[1],enemyTarget(k,i,false)); }
  else if(kind==='elite'){ en=[pick(true),pick(false)]; fitEnemy(en[0],enemyTarget(k,i,true)*0.9); fitEnemy(en[1],enemyTarget(k,i,false)*0.9); }
  else { en=Array.from({length:2+(Math.random()<0.5?1:0)},()=>pick(false)); en.forEach(e=>fitEnemy(e,enemyTarget(k,i,false)*0.85)); }
  return en; }
let RGMODE='card';
function rgStart(ids,mode){ const g=RG(); mode=mode||'card'; const map=dgGen(1); RG_LIVE=true; g.run={v:2,c3:1,wk:weekKey(),mode:'card',floor:1,fw:0,squad:ids,hp:Object.fromEntries(ids.map(id=>[id,1])),relics:[],deck:mode==='card'?rgDeck(ids):[],map,pos:map.start,pick:null,cpick:null,k:progK(),at:Date.now(),msg:mode==='card'?'카드 전투 탐사를 시작해요. 매 턴 에너지 3으로 카드를 써요. 적 머리 위의 표시가 다음 행동이에요.':'탐사를 시작해요.'}; mark('prog'); tab='abyss'; render(); }
function rgBattle(kind){ const run=RG().run; const en=rgEnemies(run.v===2?{k:run.k,floor:rgEq(run,kind)}:run,kind); const s={id:'rg_'+run.floor,title:`${T('abyss')} · ${run.floor}구역 · ${RG_NODE[kind][1]}`,enemies:en,pre:'',post:''};
  const m=id=>rgCount(id);
  startStage(s,{kind:'rogue',node:kind,squad:run.squad,burst0:m('burst')?40:0,prep:(al)=>{ al.forEach(u=>{ const fr=run.hp[u.c.id]; const hpM=1+0.2*m('hp')+0.08*m('res');
      u.maxhp=Math.round(u.maxhp*hpM); u.atk=Math.round(u.atk*(1+0.15*m('atk')+0.08*m('res')+0.05*m('train'))); u.def=Math.round(u.def*(1+0.25*m('def'))); u.spd=Math.round(u.spd*(1+0.1*m('spd'))); u.hp=Math.round(u.maxhp*(fr==null?1:fr)); }); }}); }
function rogueEnd(win){ const g=RG(), run=g.run; if(!run) return '<button class="btn" data-act="bdone">계속</button>';
  const heal=0.15*rgCount('heal'); B.allies.forEach(u=>{ run.hp[u.c.id]=u.hp>0?Math.min(1,u.hp/u.maxhp+heal):0; const o=own(u.c.id); if(o&&win) gainExp(o,expR(40)); });
  const node=B.ctx.node;
  if(win&&node==='boss'){ const html=rgFinish(true); return html; }
  if(!win){ return rgFinish(false); }
  if(run.v===2){ const cell=run.map.cells[run.pos]; if(cell) cell.done=true; run.fw=(run.fw||0)+(node==='elite'?2:1); if(node==='elite') run.pick=rgPick3(run); if(run.mode==='card') run.cpick=cardOffer(run); run.msg=''; mark('prog'); sfx('승리');
    return `<h2 class="disp" style="color:var(--rose);margin:0">전투 승리</h2><p>${node==='elite'?'정예를 쓰러뜨렸어요. 유물을 고를 수 있어요.<br>':''}${run.mode==='card'?'새 카드를 하나 고를 수 있어요.':'계속 탐사해요.'}${heal?'<br>응급 키트로 체력을 회복했어요.':''}</p><button class="btn" data-act="bdone">계속</button>`; }
  run.floor++; run.opts=rgOpts(run); if(node==='elite') run.pick=rgPick3(run); mark('prog'); sfx('승리');
  return `<h2 class="disp" style="color:var(--rose);margin:0">${run.floor-1}구역 돌파</h2><p>${node==='elite'?'정예를 쓰러뜨렸어요. 유물을 하나 고를 수 있어요.':'다음 구역으로 가요.'}${heal?'<br>응급 키트로 체력을 회복했어요.':''}</p><button class="btn" data-act="bdone">계속</button>`; }
function rgReward(f,done,prev,won){ prev=prev||0; const nf2=Math.max(0,f-prev); let r={gold:1200*f,exp:3*f,wmat:2*f,core:Math.floor(f/3)+(done?5:0),gift:Math.floor(f/4)+(done?2:0)}; const m=(1+0.3*rgCount('loot'))*(RG().n>=2?0.25:1); Object.keys(r).forEach(k=>r[k]=Math.round(r[k]*m)); const gm=40*nf2+(done&&!won?500:0); if(gm) r.gems=gm; return r; }
function rgFinish(done){ const g=RG(), run=g.run, f=done?RG_FLOORS:run.v===2?rgScore(run):run.floor-1; if(g.day!==today()){ g.day=today(); g.n=0; } const r=rgReward(f,done,g.best||0,!!g.won); giveReward(r); g.n++; g.best=Math.max(g.best||0,f); if(done) g.won=true; g.run=null; mark('prog'); sfx(done?'SSR':'확인');
  return `<h2 class="disp" style="color:${done?'var(--rose)':'#ff5277'};margin:0">${esc(T('abyss'))} · ${done?'탐사 완료!':'탐사 종료'}</h2><p>${run.v===2?`제${run.floor}구역까지 탐사했어요 (진척 ${f}/${RG_FLOORS})`:f+'구역까지 갔어요'}.${g.n>2?' (오늘 3번째부터는 보상 25%)':''}<br>${rewardText(r)}${r.gems?'':`<br><small class="muted">${esc(T('currency'))}은(는) 최고 진척 기록을 갱신할 때만 받아요</small>`}</p><button class="btn" data-act="bdone">계속</button>`; }
function rgNode(kind){ const g=RG(), run=g.run; if(!run) return;
  if(kind==='battle'||kind==='elite'||kind==='boss'){ rgBattle(kind); return; }
  let msg='';
  if(kind==='rest'){ run.squad.forEach(id=>{ run.hp[id]=Math.min(1,(run.hp[id]>0?run.hp[id]+0.35:0.25)); }); msg='모두 숨을 돌렸어요. 체력을 회복하고 쓰러진 대원이 일어났어요.'; }
  if(kind==='treasure'){ run.pick=rgPick3(run); msg='유물 상자를 찾았어요!'; }
  if(kind==='event'){ const x=Math.random();
    if(x<0.34){ run.squad.forEach(id=>{ if(run.hp[id]>0) run.hp[id]=Math.min(1,run.hp[id]+0.5); }); msg='맑은 샘을 찾았어요. 체력이 크게 회복됐어요.'; }
    else if(x<0.67){ if(Math.random()<0.5){ run.pick=rgPick3(run); msg='수상한 상자에서 유물이 나왔어요!'; } else { run.squad.forEach(id=>{ if(run.hp[id]>0) run.hp[id]=Math.max(0.05,run.hp[id]-0.2); }); msg='수상한 상자가 폭발했어요. 모두 체력 -20%.'; } }
    else { run.relics.push('train'); msg='잠깐의 실전 훈련. 공격 +5%.'; } }
  run.floor++; run.opts=rgOpts(run); run.msg=msg; mark('prog'); render(); }
