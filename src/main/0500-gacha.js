/* =========================================================
   계약 연출
   ========================================================= */
function sealSVG(){
  let ticks=''; for(let i=0;i<36;i++){const a=i*10*Math.PI/180;ticks+=`<line x1="${(Math.cos(a)*86).toFixed(1)}" y1="${(Math.sin(a)*86).toFixed(1)}" x2="${(Math.cos(a)*(i%3?90:94)).toFixed(1)}" y2="${(Math.sin(a)*(i%3?90:94)).toFixed(1)}"/>`;}
  return `<svg viewBox="-100 -100 200 200" aria-hidden="true"><g fill="none" stroke="#e9b949" stroke-opacity=".85"><circle r="95" stroke-width="1.4"/><circle r="82" stroke-width=".7" stroke-dasharray="2 4"/>${ticks}<circle r="58" stroke-width="1.2"/><path d="M0,-80 L18,-25 L76,-25 L29,9 L47,64 L0,30 L-47,64 L-29,9 L-76,-25 L-18,-25Z" stroke-width="1"/><circle r="24" stroke-width="2"/><circle r="12" stroke-width=".8"/></g></svg>`;
}
let GC=null;
/* 공유 팩 해금: 받은 게임(meta.gated)에서는 픽업·이벤트가 메인 스토리 진행(깬 스테이지 수 gate)에 맞춰 차례로 열려요 */
function mainCleared(){ const p=P(); return G.chapters.filter(c=>c.kind==='main').reduce((n,ch)=>n+ch.stages.filter(s=>p.cleared[s.id]).length,0); }
function gateOpen(x){ return !G.meta.gated||!x||!(x.gate>0)||mainCleared()>=x.gate; }
function bnOpen(b){ if(b.active===false||!gateOpen(b)) return false; if(b.pin&&b.until&&b.until<=Date.now()) return false; const ev=b.eventId&&G.events.find(e=>e.id===b.eventId); return !ev||gateOpen(ev); }
function gateCheck(){ if(!G.meta.gated) return; const p=P(); p.gateSeen=p.gateSeen||[]; const n=[];
  G.events.forEach(e=>{ if(e.gate>0&&gateOpen(e)&&!p.gateSeen.includes(e.id)){ p.gateSeen.push(e.id); n.push(e.title); sendMail({from:'운영팀',title:`새 ${T('event')} 「${e.title}」가 열렸어요`,body:`메인 스토리를 진행해서 새 ${T('event')}이(가) 열렸어요. ${T('event')} 화면에서 확인해 보세요.`,days:30}); } });
  G.banners.forEach(b=>{ if(b.gate>0&&!b.eventId&&bnOpen(b)&&!p.gateSeen.includes(b.id)){ p.gateSeen.push(b.id); n.push(b.name); b.newAt=Date.now(); sendMail({from:'운영팀',title:`「${b.name}」 배너가 열렸어요`,body:`${b.desc||''}\n${T('gacha')} 화면에서 확인해 보세요.`,days:30}); } });
  if(n.length){ mark('prog'); setTimeout(()=>toast('📮 새로 열렸어요: '+n.join(', ')),1600); } }
function curBanner(){const bs=G.banners.filter(bnOpen);return bs.find(b=>b.id===P().curBanner)||bs[0]||null;}
function bannerPool(b){
  // 건조 전용 바리에이션(c.cvar)은 건조/영입이 켜져 있으면 뽑기에 안 나와요(픽업으로 직접 넣은 건 예외)
  let pool=G.chars.filter(c=>(!c.limited||(b.pickup||[]).includes(c.id))&&(debutOk(c)||(b.pickup||[]).includes(c.id))&&!(c.cvar&&conOn()&&!(b.pickup||[]).includes(c.id)));
  if(b.pool.mode==='faction') pool=pool.filter(c=>(b.pool.factions||[]).includes(c.faction));
  if(b.pool.mode==='list') pool=pool.filter(c=>(b.pool.ids||[]).includes(c.id));
  (b.pickup||[]).map(charById).filter(Boolean).forEach(c=>{if(!pool.includes(c))pool.push(c);});
  // SSR이 하나도 없는 배너(소속 한정 등)에는 상시 SSR을 넣어 SSR이 항상 나올 수 있게
  if(pool.length&&!pool.some(c=>c.rarity===3)) G.chars.filter(c=>c.rarity===3&&!c.limited&&debutOk(c)).forEach(c=>pool.push(c));
  // R·SR이 없는 배너(픽업 캐릭터만 있는 배너, 소속 한정 등)도 상시 R·SR을 넣어 낮은 등급 자리에 SSR이 끼지 않게
  if(pool.length) [1,2].forEach(r=>{ if(!pool.some(c=>c.rarity===r)) G.chars.filter(c=>c.rarity===r&&!c.limited&&debutOk(c)).forEach(c=>pool.push(c)); });
  return pool.length?pool:G.chars;
}
const SPARK=200;
function softRate(s,pity){ const start=Math.floor(s.pity*0.75); return pity>start?Math.min(100,s.ssr+(pity-start)*Math.max(2,(100-s.ssr)/Math.max(1,s.pity-start))*0.5):s.ssr; }
function rollOne(guarSR,forceSSR,b){
  b=b||curBanner()||G.banners[0]; const p=P(),s=p.settings; const pk=b.id==='std'?'pity':null;
  p.guar=p.guar||{}; p.spark=p.spark||{}; p.hist2=p.hist2||[];
  const pity=(pk?p.pity:(p.pities[b.id]||0))+1; p.total++;
  const ssrRate=softRate(s,pity);
  let r=(forceSSR||pity>=s.pity)?3:(()=>{const x=Math.random()*100;return x<ssrRate?3:x<ssrRate+s.sr?2:1;})();
  if(r<2&&guarSR) r=2;
  const pool=bannerPool(b); let cand=pool.filter(c=>c.rarity===r);
  /* 그 등급이 풀에 없으면 가장 가까운 등급으로 바꿔요(예전엔 아무나 나와서 R 자리에 SSR이 섞였어요). 위로 올릴 땐 SSR 확률을 넘지 않게 SR까지만 */
  if(!cand.length){ const order=r===1?[2,3]:r===2?[1,3]:[2,1]; for(const q of order){ if(q===3&&r<3&&pool.some(c=>c.rarity<3)) continue; const x=pool.filter(c=>c.rarity===q); if(x.length){ cand=x; r=q; break; } } if(!cand.length) cand=pool; }
  const ups=cand.filter(c=>(b.pickup||[]).includes(c.id));
  let c;
  if(ups.length&&r===3&&p.guar[b.id]){ c=rand(ups); p.guar[b.id]=false; }
  else { c=ups.length&&Math.random()*100<(b.rate||50)?rand(ups):rand(cand); if(r===3&&ups.length) p.guar[b.id]=!(b.pickup||[]).includes(c.id); }
  const np=c.rarity===3?0:pity; if(pk) p.pity=np; else p.pities[b.id]=np;
  p.spark[b.id]=(p.spark[b.id]||0)+1;
  return grantOwned(c,b.name);
}
// 뽑기·건조가 같이 써요: 처음이면 보유 등록, 이미 있으면 돌파(최대 5) + 환급, 기록 남기기
function grantOwned(c,source){
  const p=P(); p.hist2=p.hist2||[]; let isNew=false,refund=0;
  if(p.owned[c.id]){const o=p.owned[c.id];if(o.dup<5){o.dup++;if(o.dup>=5)o.cgNew=true;}refund=REFUND[c.rarity];p.gems+=refund;p.mat.core+=c.rarity;}
  else{p.owned[c.id]={levelCapVersion:1,transc:0,growthCostVersion:1,lv:1,exp:0,dup:0,aff:0,seen:[],wlv:0,skin:''};isNew=true;if(!p.sec)p.sec=c.id;if(p.squad.length<4)p.squad.push(c.id);}
  p.history.unshift(c.id); p.history=p.history.slice(0,80);
  p.hist2.unshift({id:c.id,b:source,at:Date.now(),n:isNew}); p.hist2=p.hist2.slice(0,200);
  return {c,isNew,refund};
}
function openSpark(bid){
  const b=G.banners.find(x=>x.id===bid)||curBanner(); if(!b) return; const p=P(), pts=(p.spark||{})[b.id]||0;
  const ups=(b.pickup||[]).map(charById).filter(Boolean), list=ups.length?ups:bannerPool(b).filter(c=>c.rarity===3);
  openModal(`${head('모집 포인트 교환',`<span class="muted">${esc(b.name)} · ${pts}/${SPARK}</span>`)}
    <p class="muted" style="margin:0 0 10px">이 배너에서 1회 뽑을 때마다 1포인트가 쌓여요. ${SPARK}포인트로 원하는 ${esc(T('crew'))}을(를) 바로 데려올 수 있어요. 이미 있으면 ${esc(T('limit'))} +1이 돼요.</p>
    <div class="spk">${list.map(c=>`<button class="spk-c r${c.rarity}" data-act="sparkgo" data-id="${c.id}" data-b="${b.id}" ${pts>=SPARK?'':'disabled'}><div class="sa">${art(c)}</div><b>${esc(c.name)}</b><span>${own(c.id)?T('limit')+' '+own(c.id).dup+'/5':'미보유'}</span></button>`).join('')||'<p class="muted">교환할 수 있는 '+esc(T('crew'))+'이(가) 없어요.</p>'}</div>`);
}
function openHistory(){
  const h=(P().hist2||[]); const cnt=[3,2,1].map(r=>h.filter(x=>(charById(x.id)||{}).rarity===r).length);
  openModal(`${head(T('gacha')+' 기록',`<span class="muted">최근 ${h.length}회 · SSR ${cnt[0]} · SR ${cnt[1]} · R ${cnt[2]}</span>`)}
    <div class="ghist">${h.map(x=>{const c=charById(x.id); if(!c) return ''; const d=new Date(x.at); return `<div class="gh r${c.rarity}"><span class="badge r${c.rarity}c">${RL[c.rarity]}</span><b>${esc(c.name)}${x.n?'<em>NEW</em>':''}</b><span class="muted">${esc(x.b||'')}</span><small>${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}</small></div>`;}).join('')||'<p class="muted">아직 기록이 없어요.</p>'}</div>`);
}
const DISC_SEEDS=['몰락한 귀족','현상금 사냥꾼','기억을 잃은 실험체','전직 경찰','떠돌이 음유시인','암시장 정비공','전설의 은둔 고수','라이벌 조직의 이탈자','수상한 상인','도서관 사서','군 출신 저격수','길거리 요리사','점성술사','해커','무녀','기사단 낙오자','쌍둥이 중 한 명','하늘을 나는 배달부','유령을 보는 탐정','폐허의 수집가'];
async function discover(btn){
  const p=P(), s=p.settings, cost=COST*10;
  if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; }
  if(p.gems<cost){ toast(`${T('currency')}이(가) ${nf(cost-p.gems)}개 모자라요`); return; }
  const x=Math.random()*100, ssr=Math.min(60,s.ssr*3), r=x<ssr?3:x<ssr+s.sr?2:1;
  const seed=rand(DISC_SEEDS), role=rand(['atk','def','sup']), elem=rand(ELEMS), fac=(G.world.factions||[]).length?rand(G.world.factions).name:'';
  openModal(`<div class="decode"><div class="dc-ring"></div><div class="dc-ring b"></div><b>신호 해독 중…</b><span>새로운 ${esc(T('crew'))}의 기록을 불러오고 있어요</span></div>`,true);
  const res=await aiJSON(`${RULES}\n${ctx()}\n\n아직 등장하지 않은 새 ${T('crew')} 1명을 만들어라. 기존 ${T('crew')}과 이름, 외모, 성격이 겹치지 않게 한다.\n조건: 희귀도 ${r} (${RL[r]}), 역할 ${role}, 속성 ${elem}${fac?', 소속 후보 '+fac:''}, 콘셉트 힌트 "${seed}"(그대로 쓰지 말고 세계관에 맞게 비틀어라).\n메인 플롯이나 세력과 연결되는 비밀을 ${T('files')}에 넣는다.\nJSON 객체만 출력: ${charSchema()}\n희귀도가 높을수록 능력치 합이 높다. 지원형은 heal/shield/buff, 방어형은 체력과 방어가 높다. ${NAI_CHAR}`,null,'complex');
  if(!res){ closeModal(); return; }
  const c=cleanChar(Object.assign(res,{rarity:r,role,elem})); if(!c.name) c.name='이름 없는 '+T('crew');
  G.chars.push(c); mark('c:'+c.id); p.gems-=cost; bump('pull',10); artAfterAI(x=>x.o===c||x.c===c,'새 '+T('crew')+' '+c.name);
  p.owned[c.id]={levelCapVersion:1,transc:0,growthCostVersion:1,lv:1,exp:0,dup:0,aff:0,seen:[],wlv:0,skin:''}; if(p.squad.length<4) p.squad.push(c.id); p.history.unshift(c.id);
  mark('prog'); closeModal(); render();
  playGacha([{c,isNew:true,refund:0}]);
  if(imgReady()) setTimeout(()=>runPrep(['char'],it=>it.c&&it.c.id===c.id),1500);
}
async function pull(n){
  if(appStorage.failed||document.getElementById('save-warning')){storageWarning('저장을 먼저 복구해 주세요.');return;}
  if(!G.chars.length){toast(T('gacha')+'할 '+T('crew')+'이(가) 없어요.');return;}
  const b=curBanner(); if(!b){toast('열린 배너가 없어요');return;} const cost=n*COST; if(P().gems<cost){toast(`${T('currency')}이(가) ${nf(cost-P().gems)}개 모자라요.`);return;}
  P().gems-=cost; bump('pull',n); const res=[]; const ft=n===10&&P().firstTen; if(ft) P().firstTen=false;
  for(let i=0;i<n;i++) res.push(rollOne(n===10&&i===9&&!res.some(x=>x.c.rarity>=2),ft&&i===9&&!res.some(x=>x.c.rarity===3),b));
  mark('prog'); try{await flush();}catch(e){render();return;} render(); playGacha(res);
}
const playGacha=noSkin(playGacha0);
function playGacha0(res){
  const top=Math.max(...res.map(x=>x.c.rarity)), fake=top===3&&Math.random()<0.5;
  GC={res,timers:[],open:new Set(),skip:false,cutCb:null,auto:false};
  const cb=curBanner(), bgn=(cb&&cb.bg)||P().gachaBg;
  const bg=bgn?bgStyle(bgn):'background:radial-gradient(circle at 50% 40%,#3a1d3f,#05030b 70%)';
  $('#ov').innerHTML=`<div class="gc" id="gc"><div class="gc-sky" style="${bg}"></div>${shootHTML(6)}
    <div class="gc-seal" id="gcSeal">${sealSVG()}</div>
    <div class="gc-streak" id="gcStreak" style="--sc:${fake?RCOL[2]:RCOL[top]}"><i class="tail"></i><i class="core"></i></div>
    <div class="gc-flash" id="gcFlash"></div>
    <button class="skipb" data-act="gcskip">건너뛰기</button>
    <div class="gc-stage" id="gcStage" hidden><div class="pgrid n${res.length}">${res.map((x,i)=>`<button class="pc r${x.c.rarity}" data-act="flip" data-i="${i}" style="--d:${i*60}ms" aria-label="카드 열기"><div class="pin"><div class="pb">◆</div><div class="pf">${x.isNew?'<span class="tag">NEW</span>':`<span class="tag d">+${x.refund}</span>`}${art(x.c)}<div class="lbl"><span class="badge r${x.c.rarity}c" style="background:rgba(0,0,0,.45)">${RL[x.c.rarity]}</span><br>${esc(x.c.name)}</div></div></div></button>`).join('')}</div>
    <div class="row" style="width:100%;max-width:400px"><button class="btn ghost" data-act="flipall">모두 열기</button><button class="btn" data-act="closepull">확인</button></div></div></div>`;
  $('#ov').hidden=false; bgm(sceneOf().gacha);
  const T=(ms,f)=>GC.timers.push(setTimeout(f,ms));
  sfx('계약진'); T(700,()=>{$('#gcStreak').classList.add('fall');sfx('낙하');});
  if(fake) T(1350,()=>{$('#gcStreak').style.setProperty('--sc',RCOL[3]);$('#gcSeal').classList.add('gold');try{navigator.vibrate&&navigator.vibrate(120);}catch(e){}});
  T(1720,()=>{sfx('섬광');const f=$('#gcFlash');f.style.setProperty('--fc',top===3?'#fff3c4':RCOL[top]);f.classList.add('on');$('#gcSeal').classList.add('go');$('#gcStreak').style.opacity=0;});
  T(1950,()=>{$('#gcStage').hidden=false;$('.gc .skipb').hidden=true;if(res.length===1)T(600,()=>revealCard(0));});
}
const revealCard=noSkin(revealCard0);
function revealCard0(i,cb){
  const el=document.querySelectorAll('.pc')[i]; if(!el||GC.open.has(i)){cb&&cb();return;}
  el.classList.add('open'); GC.open.add(i); sfx('카드');
  const x=GC.res[i];
  if(x.c.rarity===3&&!GC.skip) GC.timers.push(setTimeout(()=>showCut(x.c,cb),500)); else cb&&cb();
}
const showCut=noSkin(showCut0);
function showCut0(c,cb){
  GC.cutCb=cb; const d=document.createElement('div'); d.className='cut'; d.dataset.act='cutclose'; d.style.setProperty('--rc',RCOL[c.rarity]);
  d.innerHTML=`<div class="cut-burst"></div><div class="cut-band"></div><div class="cut-art">${art(c)}</div><div class="cut-txt"><div class="cut-r">★★★ ${RL[c.rarity]}</div><div class="cut-name">${esc(c.name)}</div><div class="cut-sub">${c.elem}속성 ${ROLE[c.role]} · ${esc(c.skill.name)}</div>${c.intro?`<div class="cut-line">「${esc(sub(c.intro))}」</div>`:''}</div>`;
  $('#gc').appendChild(d); sfx('SSR'); if(c.voiceId&&c.intro) speak(c,c.intro); try{navigator.vibrate&&navigator.vibrate([80,60,160]);}catch(e){}
}
function flipAll(){
  if(GC.auto) return; GC.auto=true; const n=GC.res.length;
  const next=i=>{ if(!GC) return; if(i>=n){GC.auto=false;return;} if(GC.open.has(i)) return next(i+1); revealCard(i,()=>GC&&GC.timers.push(setTimeout(()=>next(i+1),110))); };
  next(0);
}

