/* =========================================================
   성장
   ========================================================= */
function own(id){return P().owned[id];}
const levelCap=o=>Math.min(120,Math.max(Math.min(70,20+10*(o?.dup||0))+capExtra(),o?.legacyLevelCap||0)+(o?.transc||0)*10);
function rewardText(r){const p=[];if(r.gems)p.push(`◆${nf(r.gems)} ${T('currency')}`);if(r.gold)p.push(`${T('gold')} ${nf(r.gold)}`);if(r.exp)p.push(`${T('expMat')} ${nf(r.exp)}`);if(r.wmat)p.push(`${T('wMat')} ${nf(r.wmat)}`);if(r.core)p.push(`${T('core')} ${nf(r.core)}`);if(r.gearMat)p.push(`${T('gearMat')} ${nf(r.gearMat)}`);if(r.transcMat)p.push(`${T('transcMat')} ${nf(r.transcMat)}`);['res1','res2','res3','res4'].forEach(k=>{if(r[k])p.push(`${T(k)} ${nf(r[k])}`);});if(r.token)p.push(`${r.tokenName||'토큰'} ${nf(r.token)}`);if(r.gift)p.push(`선물 ${r.gift}개`);return p.join(', ');}
/* 획득량 배율(설정 → 게임): 전투·소탕·파견·일일 보급으로 '버는' 보상에만 곱해요(상점 구매는 그대로) */
function rateR(r){ const s=P().settings, o=Object.assign({},r), m=(k,x)=>{ if(typeof o[k]==='number') o[k]=Math.max(0,Math.round(o[k]*x/100)); };
  m('gold',s.goldRate||100); m('gems',s.gemRate||100); ['exp','wmat','core','gearMat','transcMat'].forEach(k=>m(k,s.expRate||100)); return o; }
const expR=x=>Math.round(x*((P().settings.expRate||100)/100));
/* 행동력: 메인·이벤트 전투 10, 재료 던전 8. 5분마다 1씩 차서 최대 240. ◆로 채울 수 있어요. 설정 → 게임에서 끌 수 있어요 */
const STAM_MAX=240, STAM_MS=5*60e3, STAM_FILL=[60,60];
function stamOn(){ return P().settings.stamina!==false; }
function stam(){ const p=P();
  if(p.staminaCapVersion!==2){
    if(p.stam&&typeof p.stam==='object'){
      const previous=p.stam,now=Date.now(),n=Math.max(0,Math.floor((now-previous.at)/STAM_MS));
      if(previous.v>=120)previous.at=now;
      else if(n>0){previous.v=Math.min(120,previous.v+n);previous.at=previous.v>=120?now:previous.at+n*STAM_MS;}
    }
    p.staminaCapVersion=2;mark('prog');
  }
  if(!p.stam||typeof p.stam!=='object') p.stam={v:STAM_MAX,at:Date.now()}; const s=p.stam, now=Date.now();
  if(s.v>=STAM_MAX) s.at=now; else { const n=Math.floor((now-s.at)/STAM_MS); if(n>0){ s.v=Math.min(STAM_MAX,s.v+n); s.at=s.v>=STAM_MAX?now:s.at+n*STAM_MS; } } return s; }
function stamCost(kind){ return kind==='main'||kind==='event'?10:kind==='farm'?8:0; }
function updStam(){ const b=document.getElementById('stamBox'); if(!b) return; b.hidden=!stamOn(); if(!stamOn()) return; const s=stam(); const v=document.getElementById('stamV'); if(v) v.textContent=s.v+'/'+STAM_MAX; }
function stamUse(n){ if(!stamOn()||!n) return true; const s=stam(); if(s.v<n){ openStam(n); return false; } s.v-=n; mark('prog'); updStam(); return true; }
function openStam(need){ const s=stam(), left=s.v>=STAM_MAX?0:Math.ceil((STAM_MS-(Date.now()-s.at))/60000), full=s.v>=STAM_MAX?0:Math.ceil(((STAM_MAX-s.v-1)*STAM_MS+(STAM_MS-(Date.now()-s.at)))/60000);
  openModal(`${head('⚡ 행동력',`<span class="muted">${s.v} / ${STAM_MAX}</span>`)}${need?`<p style="margin:0 0 8px">행동력이 모자라요. 필요 <b>${need}</b> · 지금 <b>${s.v}</b></p>`:''}
    <p class="muted" style="margin:0 0 10px;font-size:.85rem">5분마다 1씩 차요.${s.v<STAM_MAX?` 다음 1 회복까지 ${left}분 · 가득 차기까지 약 ${full}분`:' 지금 가득 찼어요.'}<br>메인·이벤트 전투 10, 재료 던전 8을 써요.</p>
    <div class="row"><button class="btn" data-act="stamfill" ${P().gems>=STAM_FILL[0]?'':'disabled'}>${rIco('gems')} ${STAM_FILL[0]}로 ⚡${STAM_FILL[1]} 회복</button><button class="btn ghost" data-act="close">닫기</button></div>`); }
setInterval(()=>{ try{ if(typeof G!=='undefined'&&G) updStam(); }catch(e){} },30000);
function giveReward(r,evId){const p=P();if(r.gift)addGifts(r.gift);if(r.gems)p.gems+=r.gems;if(r.gold)p.gold+=r.gold;['exp','wmat','core','gearMat','transcMat'].forEach(k=>{if(r[k])p.mat[k]=(p.mat[k]||0)+r[k];});['res1','res2','res3','res4'].forEach(k=>{if(r[k]){const c=CRES();c[k]=(c[k]||0)+r[k];}});if(r.token&&evId)p.tokens[evId]=(p.tokens[evId]||0)+r.token;mark('prog');}
const MISSIONS=[{k:'login',name:'출석하기',goal:1,xp:100},{k:'battle',name:'전투 3회',goal:3,xp:150},{k:'pull',name:'뽑기 1회',goal:1,xp:100},{k:'dispatch',name:'파견 보내기',goal:1,xp:100},{k:'touch',name:'로비 터치 5회',goal:5,xp:60},{k:'enhance',name:'강화 1회',goal:1,xp:100}];
function dm(){const p=P();if(p.dm.date!==today())p.dm={date:today(),cnt:{login:1},got:{}};return p.dm;}
function bump(k,n){const d=dm();d.cnt[k]=(d.cnt[k]||0)+(n||1);mark('prog');}
const PASS_MAX=30, PASS_PER=500;
const passLv=()=>Math.min(PASS_MAX,Math.floor(P().pass.xp/PASS_PER));
function passReward(l){return l%10===0?{gems:1000}:l%5===0?{core:10}:l%3===0?{wmat:15}:l%2===0?{exp:30}:{gold:8000};}
function passClaimable(){const n=passLv();let k=0;for(let l=1;l<=n;l++)if(!P().pass.got.includes(l))k++;return k+MISSIONS.filter(m=>(dm().cnt[m.k]||0)>=m.goal&&!dm().got[m.k]).length;}
const dispDone=()=>Object.values(P().disp).filter(d=>Date.now()>=d.start+d.hours*3600e3).length;
const busyIds=()=>new Set([...Object.values(P().disp).flatMap(d=>d.chars),...exBusyIds()]); // 원정 모드(방송·스트리머·경영)에서 일하는·쉬는·배치된 캐릭터 포함
function linePop(c,text,face){
  if(!c||!text) return; document.querySelectorAll('.linepop').forEach(x=>x.remove());
  const d=document.createElement('div'); d.className='linepop'; d.innerHTML=`<div class="lp-art">${art(c,'',{face})}</div><div class="lp-t"><b>${esc(c.name)}</b><span>${esc(sub(text))}</span></div>`;
  document.body.appendChild(d); setTimeout(()=>d.remove(),4200); if(c.voiceId) speak(c,text);
}
function enhance(c,max){
  const o=own(c.id), p=P(); let n=0;
  while(o.lv<levelCap(o)){ const need=Math.ceil((GGMCombat.levelExperience(o.lv)-o.exp)/100), gold=need*100; if(p.mat.exp<need||p.gold<gold) break; p.mat.exp-=need; p.gold-=gold; gainExp(o,need*100); n++; if(!max) break; }
  if(!n){ toast(o.lv>=levelCap(o)?`레벨 상한이에요. 70까지 승급하거나, 초월승급으로 최대 120까지 올릴 수 있어요`:`${T('expMat')}이나 ${T('gold')}가 부족해요`); return; }
  bump('enhance'); mark('prog'); sfx('강화'); linePop(c,rand(c.lvLines.length?c.lvLines:c.lines),'웃음');
}
function limitBreak(c){
  const o=own(c.id), p=P(), cost=GGMCombat.limitBreakCost(o.dup);
  if(o.dup>=5){toast('최대 '+T('limit')+'예요');return;}
  if(p.mat.core<cost){toast(`${T('core')}가 ${cost}개 필요해요`);return;}
  p.mat.core-=cost; o.dup++; mark('prog'); sfx('SSR');
  const f=(c.files||[]).find(x=>x.dup===o.dup); linePop(c,rand(c.dupLines.length?c.dupLines:c.lines),'결의');
  toast(`${T('limit')} ${o.dup}단계! 레벨 상한 ${levelCap(o)}${f?' · '+T('files')+' 공개':''}`);
  if(o.dup>=5){ o.cgNew=true; mark('prog'); if(!imgSrc(c.lbcg)) setTimeout(()=>toast(`최대 ${T('limit')}! 외형 탭에서 ${T('limit')} CG를 만들면 바로 공개돼요`),2700); }
}
function transcendUp(c){const o=own(c.id),u=upPlan(c,'transc');if(!u?.ok){toast(o.lv>=70&&levelCap(o)<120?T('transcMat')+' '+u.cost[0][1]+'개가 필요해요':u?.note||'초월승급할 수 없어요');return;}P().mat.transcMat-=u.cost[0][1];o.transc=(o.transc||0)+1;mark('prog');sfx('강화');toast('초월승급! 레벨 상한 '+levelCap(o));}
function weaponUp(c){
  const o=own(c.id), p=P(); if(o.wlv>=5){toast('최대 단계예요');return;}
  const {materials:wm,gold}=GGMCombat.equipmentUpgradeCost(o.wlv);
  if(p.mat.wmat<wm||p.gold<gold){toast(`${T('wMat')} ${wm}개와 ${T('gold')} ${nf(gold)}가 필요해요`);return;}
  p.mat.wmat-=wm; p.gold-=gold; o.wlv++; mark('prog'); sfx('강화'); toast(`${c.weapon.name||T('weapon')} ${o.wlv}단계`);
}
/* 강화·돌파 전에 드는 재료와 결과를 보여 주고 확인받아요 */
function upPlan(c,k){ const o=own(c.id), p=P(); if(!o) return null;
  if(k==='enh'||k==='enhmax'){ const o2={...o}; let e=p.mat.exp,g=p.gold,ue=0,ug=0;
    while(o2.lv<levelCap(o)){ const need=Math.ceil((GGMCombat.levelExperience(o2.lv)-o2.exp)/100), gold=need*100; if(e<need||g<gold){ if(!ue){ ue=need; ug=gold; } break; } e-=need; g-=gold; ue+=need; ug+=gold; gainExp(o2,need*100); if(k==='enh') break; }
    const capped=o.lv>=levelCap(o);
    return {title:k==='enh'?T('enhance'):T('enhance')+' MAX',from:'Lv.'+o.lv,to:'Lv.'+o2.lv,ok:!capped&&o2.lv>o.lv,note:capped?`레벨 상한이에요. ${o.lv>=70?'초월 승급':'승급'}하면 상한이 올라가요`:'',
      cost:[[T('expMat'),ue,p.mat.exp],[T('gold'),ug,p.gold]]}; }
  if(k==='lb'){ const cost=GGMCombat.limitBreakCost(o.dup), cap0=levelCap(o), cap1=(()=>{ const x={...o,dup:o.dup+1}; return levelCap(x); })(), f=(c.files||[]).find(x=>x.dup===o.dup+1);
    return {title:'승급',from:o.dup+'단계',to:Math.min(5,o.dup+1)+'단계',ok:o.dup<5&&p.mat.core>=cost,note:o.dup>=5?'최대 '+T('limit')+'예요':`레벨 상한 ${cap0} → ${cap1}${f?' · '+T('files')+' 공개':''}${o.dup===4?' · '+T('limit')+' CG 공개':''}`,cost:o.dup>=5?[]:[[T('core'),cost,p.mat.core]]}; }
  if(k==='transc'){ const n=Math.min(5,Math.max(0,o.transc||0)),cap=levelCap(o),cost=GGMCombat.limitBreakCost(n);return {title:'초월 승급',from:'상한 '+cap,to:'상한 '+Math.min(120,cap+10),ok:o.lv>=70&&n<5&&cap<120&&(p.mat.transcMat||0)>=cost,note:o.lv<70?'먼저 캐릭터를 70레벨까지 강화해 주세요.':cap>=120?'최대 레벨은 120이에요.':'단계마다 상한이 10 올라가요. 레벨은 경험치로 별도 강화해요.',cost:cap>=120?[]:[[T('transcMat'),cost,p.mat.transcMat||0]]}; }
  if(k==='wup'){ const {materials:wm,gold}=GGMCombat.equipmentUpgradeCost(o.wlv);
    return {title:(c.weapon.name||T('weapon'))+' 강화',from:o.wlv?o.wlv+'단계':'잠김',to:Math.min(5,o.wlv+1)+'단계',ok:o.wlv<5&&p.mat.wmat>=wm&&p.gold>=gold,note:o.wlv>=5?'최대 단계예요':'',cost:o.wlv>=5?[]:[[T('wMat'),wm,p.mat.wmat],[T('gold'),gold,p.gold]]}; }
  return null; }
function openUpConfirm(c,k){ const u=upPlan(c,k); if(!u) return;
  const ok=u.ok&&u.cost.every(x=>x[2]>=x[1]);
  openModal(`${head(esc(c.name)+' · '+esc(u.title))}
    <div class="upc"><div class="upc-ft"><span>${esc(u.from)}</span><b>→</b><span>${esc(u.to)}</span></div>
    ${u.cost.length?`<div class="upc-cost">${u.cost.map(([n,need,have])=>`<div class="${have<need?'lack':''}"><span>${esc(n)}</span><b>${nf(need)}</b><i>보유 ${nf(have)}${have<need?' · '+nf(need-have)+' 부족':''}</i></div>`).join('')}</div>`:''}
    ${u.note?`<p class="muted" style="margin:8px 0 0;font-size:.82rem">${esc(u.note)}</p>`:''}</div>
    <div class="row" style="margin-top:14px"><button class="btn" data-act="upgo" data-k="${k}" data-id="${c.id}" ${ok?'':'disabled'}>${ok?'확인':'재료가 부족해요'}</button><button class="btn ghost" data-act="char" data-id="${c.id}">취소</button></div>`); }
/* 스포일러 막기: 아직 만나지 않은 인물(보유하지 않았고, 본 스토리에도 안 나온)의 이름이 든 대사는 로비·터치에서 빼요 */
let SEEN_K='', SEEN_T='';
function seenText(){ const p=P(), k=Object.keys(p.cleared||{}).length+'|'+Object.keys(p.owned||{}).length+'|'+(p.seenOpening?1:0); if(k===SEEN_K) return SEEN_T;
  const L=[p.seenOpening&&G.opening?String(G.opening.prologue||''):'']; G.chapters.forEach(ch=>ch.stages.forEach(st=>{ if(p.cleared[st.id]) L.push(st.pre||'',st.post||''); }));
  G.chars.forEach(c=>{ if(p.owned[c.id]) L.push(c.name); }); SEEN_K=k; SEEN_T=L.join('\n'); return SEEN_T; }
function spoilFree(c,arr){ arr=arr||[]; if(!arr.length) return arr; const seen=seenText(), self=c&&c.name;
  const unseen=[...G.chars,...(G.npcs||[])].map(x=>x.name).filter(n=>n&&n.length>=2&&n!==self&&!seen.includes(n)); if(!unseen.length) return arr;
  return arr.filter(l=>!unseen.some(n=>String(l).includes(n))); }
function affLinePool(c){ return spoilFree(c,affLinePool0(c)); }
function pickTouchLine(pool,current=''){
  const lines=(Array.isArray(pool)?pool:[]).filter(l=>typeof l==='string'&&sub(l).trim());
  const different=lines.filter(l=>sub(l)!==String(current??''));
  // All generated/skin lines can resolve to the same text. Never retry until
  // different: use a bounded selection, keeping original lines for speech.
  return rand(different.length?different:lines)||'…';
}
function affLinePool0(c){const o=own(c.id),lv=affLv(o),k=skinOf(c);let pool=k&&(k.lines||[]).length?[...k.lines,...k.lines,...c.lines]:[...c.lines];Object.entries(c.affLines||{}).forEach(([k,v])=>{if(lv>=+k)pool.push(...(v||[]));});return pool;}
function affLv(o){return Math.min(10,Math.floor((o?.aff||0)/GGMCombat.AFFINITY.step)+1);}
const AFF_MAX=GGMCombat.AFFINITY.max; function affFull(o){return !!o&&(o.aff||0)>=AFF_MAX;}
const RMUL={1:1,2:1.15,3:1.3};
function stats(c){v2ApplyRoleSpeed(c);const o=own(c.id)||{lv:1,dup:0,wlv:0};const m=(1+0.06*(o.lv-1))*(1+0.08*o.dup)*(RMUL[c.rarity]||1);return {hp:Math.round(c.hp*m*(1+0.03*(o.wlv||0))),atk:Math.round(c.atk*m*(1+0.06*(o.wlv||0))),def:Math.round(c.def*m),spd:c.spd};}
function gainExp(o,x){o.exp+=x;while(o.lv<levelCap(o)&&o.exp>=GGMCombat.levelExperience(o.lv)){o.exp-=GGMCombat.levelExperience(o.lv);o.lv++;}if(o.lv>=levelCap(o))o.exp=Math.min(o.exp,GGMCombat.levelExperience(o.lv)-1);}
function addAff(c,n){
  const o=own(c.id); if(!o) return; const b=affLv(o); o.aff=Math.min(AFF_MAX,o.aff+n); const a=affLv(o);
  if(a>b){ const ep=c.episodes.find(e=>e.lv>b&&e.lv<=a); toast(ep?`${c.name} 호감도 Lv.${a}! 에피소드 「${ep.title}」가 열렸어요`:`${c.name} 호감도 Lv.${a}`); checkTriggers(); }
}
function stageCode(id){const m=mainStages().find(s=>s.id===id);if(m)return m.code;let ei=0;for(const ch of G.chapters){if(ch.kind==='main')continue;ei++;const si=ch.stages.findIndex(s=>s.id===id);if(si>=0)return `EV${ei}-${si+1}`;}return '?';}

