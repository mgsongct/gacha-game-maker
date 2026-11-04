/* ===== 0140-acquire — Model(상태·규칙·저장·외부 서비스) ===== */
/* src/main/0140-acquire/0150-pickup-existing.js에서 옮김 */
function puxNames(){ const cs=(PUX?PUX.ids:[]).map(charById).filter(Boolean); return !cs.length?'':cs.length===1?`${cs[0].name} 픽업`:`${cs[0].name} 외 ${cs.length-1}명 픽업`; }
function puxGo(){ puxRead(); const cs=PUX.ids.map(charById).filter(Boolean); if(!cs.length) return null; const c=cs[0], sn=seasonNow(), now=Date.now();
  const until=PUX.days==='season'&&sn?sn.until:+PUX.days>0?now+(+PUX.days)*864e5:0;
  const same=x=>x.type==='pickup'&&!x.eventId&&(x.pickup||[]).length===cs.length&&(x.pickup||[])[0]===c.id&&cs.every(y=>x.pickup.includes(y.id));
  let bn=G.banners.find(x=>same(x)&&bnOpen(x)), rerun=false;
  if(!bn){ bn=G.banners.find(x=>same(x)&&!bnOpen(x)); rerun=!!bn; }
  if(!bn){ bn={id:'b'+uid(),type:'pickup',pool:{mode:'all',factions:[],ids:[]},pickup:cs.map(x=>x.id),bg:''}; G.banners.push(bn); }
  Object.assign(bn,{name:String(PUX.name||'').trim()||(rerun?'복각: ':'')+puxNames(),desc:`${cs.map(x=>`${RL[x.rarity]} ${x.name}`).join(' · ')} 확률 업`,rate:+PUX.rate||50,active:true,pin:true,until,seasonal:PUX.days==='season'&&!!sn});
  delete bn.newAt; delete bn.storyFail; delete bn.gate;
  if(!bn.bg){ const bgs=G.lib.filter(l=>l.kind==='bg'); if(bgs.length) bn.bg=rand(bgs).name; }
  P().curBanner=bn.id; mark('prog'); return {b: bn,c,rerun,story:!!(PUX.story&&SAMPLE&&!bn.eventId)}; }
/* 장·이벤트를 끝까지 깨면 그 이야기에서 만난 인물이 인연으로 합류해요 */
function recruitCheck(ch,s){ if(!ch||!s||ch.stages[ch.stages.length-1]!==s) return; (ch.recruits||[]).map(charById).filter(Boolean).forEach(c=>joinChar(c,`「${ch.title}」에서 만난 인연으로`)); const ev=ch.eventId&&G.events.find(e=>e.id===ch.eventId), gc=ev&&ev.gift&&charById(ev.gift); if(gc) joinChar(gc,`이벤트 「${ev.title}」 배포로`); }
function addPickupFor(c,lim){
  if(lim){ c.limited=true; mark('c:'+c.id); }
  const bb=c.alt&&charById(c.alt), sn=seasonNow(), b={id:'b'+uid(),name:c.collab?`콜라보: ${c.name}`:bb?`이격: ${c.name}`:`${c.name} 픽업`,type:'pickup',alt:!!bb,desc:c.collab?`「${c.collab}」 콜라보! ${RL[c.rarity]} ${c.name} 한정 등장`:bb?`이격! ${bb.name}의 새로운 모습, ${RL[c.rarity]} ${c.name} 등장`:`신규 ${RL[c.rarity]} ${c.name} 등장!`,collab:c.collab||'',pool:{mode:'all',factions:[],ids:[]},pickup:[c.id],rate:lim?70:50,active:true,bg:'',newAt:Date.now(),until:sn?sn.until:0,gate:mainCleared()};
  G.banners.push(b); P().curBanner=b.id; mark('prog'); return b;
}
/* src/main/0140-acquire/0500-gacha.js에서 옮김 */
/* 공유 팩 해금: 받은 게임(meta.gated)에서는 픽업·이벤트가 메인 스토리 진행(깬 스테이지 수 gate)에 맞춰 차례로 열려요 */
function mainCleared(){ const p=P(); return G.chapters.filter(ch=>ch.kind==='main').reduce((n,ch)=>n+ch.stages.filter(s=>p.cleared[s.id]).length,0); }
function gateOpen(x){ return !G.meta.gated||!x||!(x.gate>0)||mainCleared()>=x.gate; }
function bnOpen(b){ if(b.active===false||!gateOpen(b)) return false; if(b.pin&&b.until&&b.until<=Date.now()) return false; const ev=b.eventId&&G.events.find(e=>e.id===b.eventId); return !ev||gateOpen(ev); }
function curBanner(){const bs=G.banners.filter(bnOpen);return bs.find(b=>b.id===P().curBanner)||bs[0]||null;}
function bannerPool(b){
  // 건조 전용 바리에이션(c.cvar)은 건조/영입이 켜져 있으면 뽑기에 안 나와요(픽업으로 직접 넣은 건 예외)
  let pool=G.chars.filter(c=>(!c.limited||(b.pickup||[]).includes(c.id))&&(castOk(c)||(!castCfg().pickupGate&&!c.monster&&(b.pickup||[]).includes(c.id)))&&!(c.cvar&&conOn()&&!(b.pickup||[]).includes(c.id)));
  if(b.pool.mode==='faction') pool=pool.filter(c=>(b.pool.factions||[]).includes(c.faction));
  if(b.pool.mode==='list') pool=pool.filter(c=>(b.pool.ids||[]).includes(c.id));
  (b.pickup||[]).map(charById).filter(c=>c&&(castOk(c)||(!castCfg().pickupGate&&!c.monster))).forEach(c=>{if(!pool.includes(c))pool.push(c);}); // 첫 등장 전·적대 중·몬스터는 픽업도 잠금(0445)
  // SSR이 하나도 없는 배너(소속 한정 등)에는 상시 SSR을 넣어 SSR이 항상 나올 수 있게
  if(pool.length&&!pool.some(c=>c.rarity===3)) G.chars.filter(c=>c.rarity===3&&!c.limited&&castOk(c)).forEach(c=>pool.push(c));
  // R·SR이 없는 배너(픽업 캐릭터만 있는 배너, 소속 한정 등)도 상시 R·SR을 넣어 낮은 등급 자리에 SSR이 끼지 않게
  if(pool.length) [1,2].forEach(r=>{ if(!pool.some(c=>c.rarity===r)) G.chars.filter(c=>c.rarity===r&&!c.limited&&castOk(c)).forEach(c=>pool.push(c)); });
  if(pool.length) return pool; const open=G.chars.filter(c=>!c.limited&&castOk(c)); return open.length?open:G.chars; // 비면 열린(첫 등장·적대·몬스터 잠금 아닌) 캐릭터로 — 예전엔 모든 캐릭터라 잠긴 캐릭터가 나왔음
}
/* 천장·픽업 확정은 픽업 배너끼리 이어져요(시즌이 바뀌어 배너가 닫혀도 다음 픽업 배너로). 상시는 따로, 픽업 없는 배너(소속 모집 등)는 배너별.
   예전 저장(배너별 값)은 처음 읽을 때 픽업 배너들 중 가장 큰 천장·남은 확정을 이어받아요 */
function pityKey(b){ return !b||b.id==='std'?'std':(b.pickup||[]).length?'pickup':b.id; }
function pityGet(b){ const p=P(),k=pityKey(b); if(k==='std') return p.pity||0; p.pities=p.pities||{};
  if(k==='pickup'&&p.pities.pickup==null){ const old=G.banners.filter(bn=>bn.id!=='std'&&(bn.pickup||[]).length); p.pities.pickup=Math.max(0,...old.map(x=>p.pities[x.id]||0)); p.guar=p.guar||{}; if(p.guar.pickup==null) p.guar.pickup=old.some(x=>p.guar[x.id]); }
  return p.pities[k]||0; }
function pitySet(b,v){ const p=P(),k=pityKey(b); if(k==='std') p.pity=v; else p.pities[k]=v; }
function guarGet(b){ pityGet(b); return !!(P().guar||{})[pityKey(b)]; }
/* 배너가 닫힐 때 남은 모집 포인트는 1포인트당 ◆ COST/10으로 바꿔 우편으로 보내요(포인트가 말없이 사라지지 않게) */
function sparkSettle(b){ const p=P(), n=(p.spark||{})[b.id]||0; if(!n) return 0; const gems=n*Math.round(COST/10); p.spark[b.id]=0;
  sendMail({from:'운영팀',title:`「${b.name}」 모집 포인트 정산`,body:`배너가 끝나 남은 모집 포인트 ${n}점을 ${T('currency')} ${nf(gems)}개로 바꿔 드려요.`,reward:{gems}}); return gems; }
function softRate(s,pity){ const start=Math.floor(s.pity*0.75); return pity>start?Math.min(100,s.ssr+(pity-start)*Math.max(2,(100-s.ssr)/Math.max(1,s.pity-start))*0.5):s.ssr; }
function rollOne(guarSR,forceSSR,b){
  b=b||curBanner()||G.banners[0]; const p=P(),s=p.settings, gk=pityKey(b);
  p.guar=p.guar||{}; p.spark=p.spark||{}; p.hist2=p.hist2||[];
  const pity=pityGet(b)+1; p.total++;
  const ssrRate=softRate(s,pity);
  let r=(forceSSR||pity>=s.pity)?3:(()=>{const x=Math.random()*100;return x<ssrRate?3:x<ssrRate+s.sr?2:1;})();
  if(r<2&&guarSR) r=2;
  const pool=bannerPool(b); let cand=pool.filter(c=>c.rarity===r);
  /* 그 등급이 풀에 없으면 가장 가까운 등급으로 바꿔요(예전엔 아무나 나와서 R 자리에 SSR이 섞였어요). 위로 올릴 땐 SSR 확률을 넘지 않게 SR까지만 */
  if(!cand.length){ const order=r===1?[2,3]:r===2?[1,3]:[2,1]; for(const q of order){ if(q===3&&r<3&&pool.some(c=>c.rarity<3)) continue; const x=pool.filter(c=>c.rarity===q); if(x.length){ cand=x; r=q; break; } } if(!cand.length) cand=pool; }
  const ups=cand.filter(c=>(b.pickup||[]).includes(c.id));
  /* 픽업에 실패하면 픽업이 아닌 같은 등급에서 골라요 — 표시한 확률(rate%)이 실제 확률이 되게(예전엔 실패해도 후보에 픽업이 남아 50% 표기가 실제 75%였어요) */
  const rest=cand.filter(c=>!ups.includes(c));
  let c;
  if(ups.length&&r===3&&p.guar[gk]){ c=rand(ups); p.guar[gk]=false; }
  else { c=ups.length&&(!rest.length||Math.random()*100<(b.rate||50))?rand(ups):rand(rest.length?rest:cand); if(r===3&&ups.length) p.guar[gk]=!(b.pickup||[]).includes(c.id); }
  pitySet(b,c.rarity===3?0:pity);
  p.spark[b.id]=(p.spark[b.id]||0)+1;
  return grantOwned(c,b.name);
}
// 뽑기·건조가 같이 써요: 처음이면 보유 등록, 이미 있으면 돌파(최대 5) + 환급, 기록 남기기
function grantOwned(c,source){
  const p=P(); p.hist2=p.hist2||[]; let isNew=false,refund=0;
  if(p.owned[c.id]){const o=p.owned[c.id];if(o.dup<5){o.dup++;if(o.dup>=5)o.cgNew=true;}refund=REFUND[c.rarity];giveReward({gems:refund});p.mat.core+=c.rarity;}
  else{p.owned[c.id]={levelCapVersion:1,transc:0,growthCostVersion:1,lv:1,exp:0,dup:0,aff:0,seen:[],wlv:0,skin:''};isNew=true;if(!p.sec)p.sec=c.id;if(p.squad.length<4)p.squad.push(c.id);}
  p.history.unshift(c.id); p.history=p.history.slice(0,80);
  p.hist2.unshift({id:c.id,b:source,at:Date.now(),n:isNew}); p.hist2=p.hist2.slice(0,200);
  return {c,isNew,refund};
}
function flipAll(){
  if(GC.auto) return; GC.auto=true; const n=GC.res.length;
  const next=i=>{ if(!GC) return; if(i>=n){GC.auto=false;return;} if(GC.open.has(i)) return next(i+1); revealCard(i,()=>GC&&GC.timers.push(setTimeout(()=>next(i+1),110))); };
  next(0);
}
/* src/main/0140-acquire/0505-construct.js에서 옮김 */
function variantsFromAI(list,ng){ return GGMConstruct.variantsFrom(list,{factions:((ng.world||{}).factions||[]).map(f=>f.name),elems:(ng.meta.elems||DEFAULT_META.elems).map(e=>e.n)}).map(v=>Object.assign({id:'v_'+uid()},v)); }
/* 건조 설정 읽기(없으면 꺼짐·기본 레시피 — 상태는 그대로, 바꿀 때는 conSave·contoggle이 G.meta.construct에 씀) */
function conMeta(){ const c=G.meta.construct, m=c&&typeof c==='object'?c:{on:false}; return Array.isArray(m.recipes)?m:Object.assign({},m,{recipes:clone(CON_RECIPES)}); }
function CON(){ const c=GGMConstruct.config(conMeta()); c.groups=c.groups.map(g=>{ const d=GGMConstruct.DEFAULTS.groups.find(x=>x.id===g.id); return d&&g.name===d.name&&g.match&&ROLE[g.match.role]?Object.assign({},g,{name:ROLE[g.match.role]}):g; }); return c; } // 저장된 분류는 그대로 두고 보여 줄 때만 /* 기본 분류 이름(지원·공격·방어)은 이 게임의 역할 이름으로 보여요 */
/* 새 게임을 건조/영입이 켜진 채로 시작: 시작 자원 지급(설정에서 켤 때와 같은 양) */
function conStartNew(ng){ ng.meta.construct=Object.assign({},ng.meta.construct||{},{on:true}); const s=GGMConstruct.config(ng.meta.construct).start; ng.prog.cres=Object.fromEntries(CON_RES.map(k=>[k,s])); ng.prog.cbuild={n:0,found:{},log:[],input:null,started:Date.now()}; }
function conOn(){ return !!(G.meta.construct&&G.meta.construct.on); }
/* 바리에이션 공통 설정 읽기(없으면 엔진 기본형 — id 고정이라 발견 기록과 맞음, 바꿀 때는 conSave가 G.meta.variants에 씀) */
function VARIANTS(){ return Array.isArray(G.meta.variants)?G.meta.variants:clone(GGMConstruct.VARIANT_DEFAULTS); }
/* 건조/영입 자원 칸 형식 맞춤(자원 4종 — 없거나 음수면 0) — 진행 칸 cres의 정의(0070 PROG_SLOTS)가 부름 */
function cresFill(c){ CON_RES.forEach(k=>{ if(!(c[k]>=0)) c[k]=0; }); return c; }
/* 원정(파견) 보상: 시간·인원에 비례해서 건조 자원 2종 */
function conDispReward(hours,need){ const pts=Math.pow(hours,0.85)*(1+0.35*(need-1)), ks=[...CON_RES].sort(()=>Math.random()-.5).slice(0,2), r={}; ks.forEach(k=>{ r[k]=Math.max(10,Math.round(pts*60/10)*10); }); return r; }
/* 바리에이션 후보: 레시피가 맞고, 조건에 맞는 보유 캐릭터 중 아직 그 바리에이션이 없는 캐릭터 */
function conVariantOf(b,tpl){ return G.chars.find(c=>c.alt===b.id&&c.cvar===tpl.id); }
function conTargets(tpl){ return G.chars.filter(c=>!c.alt&&!c.cvar&&own(c.id)&&GGMConstruct.condMatch(tpl.cond,c,{own:own(c.id),affLv:affLv(own(c.id)),cleared:P().cleared})); }
function conPool(){ return G.chars.filter(c=>!c.limited&&!c.cvar&&!c.alt&&castOk(c)).map(c=>({id:c.id,rarity:c.rarity,role:c.role,faction:c.faction,elem:c.elem})); }
async function conMakeVariant(b,tpl){
  const rr=tpl.rarity==='same'||!tpl.rarity?String(b.rarity):String(tpl.rarity); let c=null;
  const brief=`${tpl.name}. ${GGMConstruct.designBrief(b,tpl)}`;
  if(SAMPLE){ try{ c=await aiAltChar(b,brief,rr,null); }catch(e){ c=null; } }
  if(c&&c.name===`${b.name}(${brief.replace(/[()]/g,'').slice(0,6)})`) c.name=`${b.name}(${tpl.name})`; // AI가 이름을 못 지으면 aiAltChar가 디자인 지시 앞 글자로 지어 깨짐 → 기본형 이름으로
  if(!c){ // AI가 없거나 실패: 원래 캐릭터를 바탕으로 규칙대로 만들어요(이름·외모 태그 + 기본형 의상 태그 + 상징 컬러·아이템)
    const o=clone(b); delete o.id; o.name=`${b.name}(${tpl.name})`; o.naiPrompt=GGMConstruct.variantPrompt(b,tpl); o.rarity=+rr;
    c=cleanChar(o); G.chars.push(c); } // 프로필 등은 기본 캐릭터를 그대로 물려받음(바꾸면 수정치로 굳어 기본 캐릭터를 고쳐도 반영 안 됨) — 이 모습의 차이는 이름·외모 태그
  c.alt=b.id; c.cvar=tpl.id; c.altCanon=false; c.rarity=+rr||b.rarity; c.faction=b.faction||c.faction; if(b.age) c.age=b.age; if(b.voiceId) c.voiceId=b.voiceId; if(b.naiStyle) c.naiStyle=b.naiStyle;
  const want=String(tpl.prompt||'').split(',')[0].trim(); if(want&&!String(c.naiPrompt||'').includes(want)) c.naiPrompt=GGMConstruct.variantPrompt(Object.assign({},b,{naiPrompt:c.naiPrompt||b.naiPrompt}),tpl);
  mark('c:'+c.id); return c; }
/* 처음(아직 건조한 적 없음) 투입: 최소 투입으로 나올 대원이 없으면(열린 분류에 지금 나오는 희귀도의 대원이 없음) 나올 수 있는 가장 적은 투입 — 첫 건조가 빈손이 되지 않게 */
function conDefaultInput(){ const cfg=CON(), v=[cfg.min,cfg.min,cfg.min,cfg.min], s=GGMConstruct.suggest(v,cfg,conPool()); return s?s.input:v; }
/* 나올 대원이 없는 까닭(엔진 suggest의 why) — 화면·확인 창 글 */
function conEmptyWhy(why){ if(!why) return ''; const rr=a=>a.map(k=>RL[k]).join('·'); return why.open.length?`열린 분류 ${why.open.map(g=>`「${g.name}」(${g.rarity.length?rr(g.rarity):'대원 없음'})`).join(', ')}에 지금 투입으로 나오는 희귀도(${rr(why.allowed)})의 ${T('crew')}이(가) 없어요`:'이 투입으로 열리는 분류가 없어요'; }
function conNeedText(n){ const out=[]; (n.min||[]).forEach((v,i)=>{ if(v>GGMConstruct.DEFAULTS.min&&v>CON().min) out.push(`${T(CON_RES[i])} ${nf(v)}↑`); }); (n.max||[]).forEach((v,i)=>{ if(v!=null) out.push(`${T(CON_RES[i])} ${nf(v)}↓`); }); if(n.total) out.push(`총 ${nf(n.total)}↑`); Object.entries(n.share||{}).forEach(([i,[lo,hi]])=>out.push(`${T(CON_RES[i])} 비율 ${Math.round((lo||0)*100)}~${Math.round((hi==null?1:hi)*100)}%`)); return out.join(' · ')||'조건 없음'; }
