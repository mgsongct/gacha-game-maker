/* ===== 도전: 레이드(주간 보스) — 심연 탐사는 0120 ===== */
const RAID_TICKS=700;
const RAID_MS=[[0.05,{gems:100,gold:5000}],[0.15,{gems:150,wmat:10,gift:2}],[0.3,{gems:200,core:3}],[0.5,{gems:300,exp:40}],[0.75,{gems:400,core:5}],[1,{gems:800,core:10,wmat:20}]];
function progK(){ const main=G.chapters.filter(ch=>ch.kind==='main'); let k=0; main.forEach((ch,i)=>{ if(ch.stages.some(s=>P().cleared[s.id])) k=i; }); return k; }
function hashN(s){ let h=0; for(const ch of String(s)) h=(h*31+ch.charCodeAt(0))|0; return Math.abs(h); }
/* 주간 레이드 새로 만들기(주가 바뀌면): 지난주 결과로 단계 오르내림(처치 +1, 절반 못 깎음 −1, 1~6) — 진행 칸 raid의 정의(0070 PROG_SLOTS)가 부름 */
function raidNew(r){ r=progObj(r)?r:null; const pr=r&&r.total?r.dmg/r.total:0; const lv=r?Math.max(1,Math.min(6,(r.lv||1)+(r.killed?1:pr<0.5?-1:0))):1; return {wk:weekKey(),lv,dmg:0,killed:false,got:[],tries:{},best:0}; }
function raidBoss(){ const r=progSlot('raid'), pool=[], bgOf={}; G.chapters.filter(ch=>ch.kind==='main').forEach(ch=>ch.stages.forEach(s=>(s.enemies||[]).forEach(e=>{ if(e.boss&&!pool.some(x=>x.name===e.name)){ pool.push(e); bgOf[e.name]=stageBg(s); } })));
  const src=pool.length?pool[hashN(r.wk)%pool.length]:{name:'거대 잔광',elem:ELEMS[0]}; const b={name:src.name,elem:ELEMS[hashN(r.wk+'e')%ELEMS.length],hp:3000,atk:110,def:50,spd:95,boss:true};
  fitEnemy(b,enemyTarget(progK()+(r.lv-1)*0.6,6,true)*1.3); b.bg=bgOf[b.name]||'';
  if(r.total){ const k=r.total/30/b.hp; b.hp=Math.round(r.total/30); b.atk=Math.round(b.atk*Math.min(1.5,Math.max(0.7,k))); } else { r.total=b.hp*30; mark('prog'); }
  if(r.killed&&r.dmg<r.total) r.killed=false; return Object.assign(b,{total:r.total}); }
function raidTriesLeft(){ const r=progRead('raid'); return Math.max(0,3-(r.tries[today()]||0)); }
function raidEnd(win){ const r=progSlot('raid'), b=B.enemies[0], dealt=Math.max(0,Math.round((B.ctx.hp0||0)-b.hp)); r.dmg=Math.min(B.ctx.total,r.dmg+dealt); r.best=Math.max(r.best||0,dealt);
  const ratio=r.dmg/B.ctx.total; if(ratio>=1) r.killed=true; let got={}; RAID_MS.forEach(([t,rw],i)=>{ if(ratio>=t&&!r.got.includes(i)){ r.got.push(i); giveReward(rw); Object.entries(rw).forEach(([k,v])=>got[k]=(got[k]||0)+v); } });
  B.allies.forEach(u=>{ const o=own(u.c.id); if(o) gainExp(o,expR(80)); }); mark('prog'); sfx(r.killed?'승리':'확인');
  return `<h2 class="disp" style="color:var(--rose);margin:0">${r.killed?'토벌 완료!':'레이드 종료'}</h2><div class="rd-big">${nf(dealt)}<small>이번 피해</small></div>
    <div class="rd-bar"><i style="width:${Math.min(100,ratio*100)}%"></i><span>${Math.min(100,Math.floor(ratio*1000)/10)}%</span></div>
    <p style="margin:6px 0">${Object.keys(got).length?'달성 보상: '+rewardText(got):'다음 보상까지 '+(RAID_MS.find(([t],i)=>!r.got.includes(i))?Math.ceil((RAID_MS.find(([t],i)=>!r.got.includes(i))[0]-ratio)*100)+'%':'—')}<br>참가 ${T('crew')} 경험치 +80</p>
    <button class="btn" data-act="bdone">계속</button>`; }
