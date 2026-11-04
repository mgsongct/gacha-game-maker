/* ===== acquire — 기능 class(Model · View · Ctl) — docs/redesign.md 2·3절, tools/reshape.mjs가 매핑대로 옮김 ===== */
class Acquire {
    /* src/main/0510-actions/020-navigation-and-tools.js */
static aiopeningPrompt({hint}){ return `${Core.pf('OPENING_REWRITE',{RULES,ctx:World.ctx(),SCRIPT_FMT,hint:hint?'요청: '+hint:''})}\nJSON만 출력: {"lines":[],"prologue":"대본"}`; }

  static naiSaved(){let sv={};try{sv=JSON.parse(appStorage.getItem(NKEY))||{};}catch(e){}return sv;}

  static setMyStyle(tags,neg){const sv=Acquire.naiSaved();sv.styles=[{id:'my_style',name:'내 그림체',tags:String(tags||'').trim(),neg:String(neg||'').trim()}];sv.styleId='my_style';appStorage.setItem(NKEY,JSON.stringify(sv));}

  static artRun(keys){ const go=()=>{ if(PREPJOB) return setTimeout(go,5000); CoreCtl.runPrep(null,x=>keys.has(Misc.artKey(x)),{order:ART_ORDER}); }; go(); }

    // 끊긴 참조 고치기: 없는 캐릭터를 가리키는 톡은 대본에 나온 이름으로 주인을 다시 찾고, 픽업 배너에서는 없는 캐릭터를 빼요
static repairRefs(g){ const ids=new Set((g.chars||[]).map(c=>c.id)), byName=n=>(g.chars||[]).find(c=>c.name===String(n||'').trim());
    const tids=new Set([...ids,...(g.npcs||[]).map(n=>n.id),'__player']); (g.threads||[]).forEach(t=>{ if(!t||!t.charId||tids.has(t.charId)) return; let c=null; String(t.script||'').split('\n').some(l=>{ const m=l.match(/^\s*([^:\[\]\n{}]{1,24})\s*:/); return m&&(c=byName(m[1])); }); if(c) t.charId=c.id; });
    (g.banners||[]).forEach(b=>{ if(!b) return; const keep=(b.pickup||[]).filter(x=>ids.has(x)); if(keep.length!==(b.pickup||[]).length){ b.pickup=keep; if(!keep.length&&b.type==='pickup'){ const s=(g.chars||[]).find(c=>c.rarity===3&&!c.alt); if(s) b.pickup=[s.id]; } } if(b.pool&&Array.isArray(b.pool.ids)) b.pool.ids=b.pool.ids.filter(x=>ids.has(x)); }); }

  static bannerStep(d){ const bs=G.banners.filter(Acquire.bnOpen); if(bs.length<2) return; const bn=Acquire.curBanner(), i=Math.max(0,bs.findIndex(x=>bn&&x.id===bn.id));
    P().curBanner=bs[(i+d+bs.length)%bs.length].id; Core.mark('prog'); window.__BSLIDE=d>0?'sl-r':'sl-l'; Challenge.render(); window.__BSLIDE=''; Art.sfx('버튼'); }

  static rotatePickups(){
    const pus=G.banners.filter(bn=>bn.type==='pickup'&&bn.active!==false&&!bn.newAt&&!bn.eventId&&!bn.until&&!bn.pin), L=P().live, ssr=G.chars.filter(c=>c.rarity===3&&!c.limited);
    if(!pus.length||ssr.length<2) return '';
    const names=[], bgs=G.lib.filter(l=>l.kind==='bg');
    pus.forEach(b=>{ let cand=ssr.filter(c=>!L.recentPU.includes(c.id)&&!b.pickup.includes(c.id)); if(!cand.length) cand=ssr.filter(c=>!b.pickup.includes(c.id)); if(!cand.length) return;
      const c=rand(cand); b.pickup=[c.id]; b.name=`${c.name} 확률 업`; b.desc=`SSR ${c.name} 확률 상승`; if(bgs.length) b.bg=rand(bgs).name;
      L.recentPU.unshift(c.id); L.recentPU=L.recentPU.slice(0,Math.max(1,ssr.length-1)); names.push(c.name); });
    return names.length?`확률 업 교체: ${names.join(', ')}`:'';
  }

  static async aiPickupStory(c,lim,link){
    const b=Acquire.addPickupFor(c,lim); if(!SAMPLE) return null;
    const res=await CoreCtl.aiEventGen(`신규 ${System.T('crew')} 「${c.name}」의 픽업 기념 이벤트 스토리. ${c.name}이(가) 주인공으로 처음 등장해 성격·매력·사연을 보여 주고 ${playerName()}와(과) 인연을 맺는다. 프로필: ${String(c.profile||'').slice(0,300)}. 기존 ${System.T('crew')} 1~2명이 조연으로 나온다. 픽업 배너와 이어지는 이야기라서 마지막 장면은 ${c.name}이(가) 동료가 되고 싶어 하는 여운으로 끝낸다.`,3,false,[c.name]);
    if(!res) return null; const ev=res.ev, eb=G.banners.find(bn=>bn.id===ev.bannerId);
    if(eb&&eb!==b){ G.banners=G.banners.filter(bn=>bn!==eb); if(P().curBanner===eb.id) P().curBanner=b.id; }
    ev.bannerId=b.id; ev.pickupFor=c.id; if(!link) ev.keepBanner=true; b.eventId=ev.id; b.desc=c.collab?`「${c.collab}」 콜라보! ${c.name} 등장 · 콜라보 스토리 「${ev.title}」`:`신규 ${RL[c.rarity]} ${c.name} 등장! 픽업 스토리 「${ev.title}」`; if(ev.bg&&!b.bg) b.bg=ev.bg;
    Core.mark('prog'); return res; }

  static async seasonStart(type,notes){
    const L=P().live, meta=LiveOps.seasonMeta(type), now=Date.now(), d0=new Date(); d0.setHours(5,0,0,0); if(d0.getTime()>now) d0.setDate(d0.getDate()-1); const until=d0.getTime()+LiveOps.seasonDays()*864e5;
    const act=G.events.filter(e=>e.active!==false&&Acquire.gateOpen(e)), past=G.events.filter(e=>e.active===false);
    const closeEv=()=>{ act.forEach(e=>{ e.active=false; const bn=G.banners.find(x=>x.id===e.bannerId); if(bn&&!e.keepBanner){ bn.active=false; LiveOps.sparkSettle(bn); } }); if(act.length) notes.push(`이벤트 종료: ${act.map(e=>e.title).join(', ')}`); };
    { const closed=[]; G.banners.forEach(bn=>{ if(Acquire.bnOpen(bn)&&bn.id!=='std'&&(bn.newAt||bn.eventId||bn.seasonal)&&(!bn.until||bn.until<=now||bn.until===((L.season&&L.season.until)||-1))){ bn.active=false; LiveOps.sparkSettle(bn); closed.push(bn.name); } });
      if(closed.length){ notes.push(`지난 시즌 픽업 종료: ${closed.join(', ')}`); const cb=G.banners.find(bn=>bn.id===P().curBanner); if(!cb||cb.active===false) P().curBanner=''; } }
    L.season={type,key:LiveOps.seasonKey(),start:now,until}; notes.push(`${meta[3]} ${meta[1]} 시작! ${meta[2]} (${new Date(until-1).toLocaleDateString('ko-KR')}까지)`);
    if(type==='story'){ closeEv();
      if(!SAMPLE) notes.push('글 AI가 없어서 새 장은 쓰지 못했어요');
      else if(!Story.nextStage()){ LiveOpsView.liveBar('스토리 시즌: 메인 스토리 다음 장을 쓰는 중…'); const res=await StoryCtl.aiChapterGen('메인 플롯을 따라 자연스럽게 이어서. 시즌의 핵심 스토리답게 큰 전개를 넣는다',Core.storyN(5),[]); if(res){ notes.push(`메인 스토리 「${res.ch.title}」 공개`); LiveOps.bondNote(res.newc,notes); } }
      else notes.push('아직 진행 중인 메인 장이 있어요. 이번 시즌에 마저 즐겨 보세요'); }
    else if(type==='event'){
      if(SAMPLE){ LiveOpsView.liveBar('이벤트 시즌: 새 이벤트를 만드는 중… 몇 분 걸려요. 그동안 플레이해도 돼요.'); const res=await CoreCtl.aiEventGen('',4,true,[]);
        if(res){ const nb=G.banners.find(bn=>bn.id===res.ev.bannerId); if(nb){ nb.until=until; nb.seasonal=true; } act.forEach(e=>{ if(e!==res.ev){ e.active=false; const bn=G.banners.find(x=>x.id===e.bannerId); if(bn&&!e.keepBanner) bn.active=false; } }); if(act.length) notes.push(`이벤트 종료: ${act.map(e=>e.title).join(', ')}`); notes.push(`새 이벤트 「${res.ev.title}」 개최${res.nc?`, 한정 ${System.T('crew')} ${res.nc.name} 등장`:''}`); LiveOps.bondNote((res.ncs||[]).slice(1),notes); } }
      else if(past.length){ closeEv(); const ev=rand(past); ev.active=true; P().shopBuy[ev.id]={}; const bn=G.banners.find(x=>x.id===ev.bannerId); if(bn){ bn.active=true; bn.until=until; } notes.push(`글 AI가 없어서 복각 이벤트 「${ev.title}」로 열었어요`); } }
    else if(type==='char'){ closeEv();
      if(SAMPLE){ LiveOpsView.liveBar('캐릭터 시즌: 신규 캐릭터를 구상하는 중…'); const c=await Characters.aiNewPickupChar('','ai',null);
        if(c){ LiveOpsView.liveBar(`캐릭터 시즌: ${c.name}의 픽업 스토리를 쓰는 중… 몇 분 걸려요.`); const res=await Acquire.aiPickupStory(c,false,true); notes.push(`신규 ${RL[c.rarity]} ${c.name} 픽업 개시`); if(res) notes.push(`${c.name} 픽업 스토리 「${res.ev.title}」 공개`); setTimeout(()=>CoreView.artAfterAI(x=>x.o===c||x.c===c,'신규 '+System.T('crew')+' '+c.name),2500); }
        if(L.on.talk){ LiveOpsView.liveBar('캐릭터 시즌: 톡을 쓰는 중…'); const n=await Messenger.dailyTalks(); if(n) notes.push(`${System.T('talk')} 새 대화 ${n}개`); } }
      else { const r=Acquire.rotatePickups(); if(r) notes.push(r); } }
    else if(type==='rerun'){
      if(past.length){ closeEv(); const ev=rand(past); ev.active=true; P().shopBuy[ev.id]={}; const bn=G.banners.find(x=>x.id===ev.bannerId); if(bn){ bn.active=true; bn.until=until; } notes.push(`복각 이벤트 「${ev.title}」가 다시 열렸어요`); }
      const lim=G.banners.filter(b=>b.active===false&&(b.pickup||[]).length&&b.type!=='event'); if(lim.length){ const bn=rand(lim); bn.active=true; bn.until=until; notes.push(`복각 픽업: ${bn.name}`); }
      const r=Acquire.rotatePickups(); if(r) notes.push(r); }
    else if(type==='train'){ closeEv(); notes.push('훈련(경험·크레딧·재료) 보상 2배, 파견 보상 1.5배'); }
    Core.mark('prog'); }

  static puxGo(){ CoreView.puxRead(); const cs=PUX.ids.map(charById).filter(Boolean); if(!cs.length) return null; const c=cs[0], sn=LiveOps.seasonNow(), now=Date.now();
    const until=PUX.days==='season'&&sn?sn.until:+PUX.days>0?now+(+PUX.days)*864e5:0;
    const same=x=>x.type==='pickup'&&!x.eventId&&(x.pickup||[]).length===cs.length&&(x.pickup||[])[0]===c.id&&cs.every(y=>x.pickup.includes(y.id));
    let bn=G.banners.find(x=>same(x)&&Acquire.bnOpen(x)), rerun=false;
    if(!bn){ bn=G.banners.find(x=>same(x)&&!Acquire.bnOpen(x)); rerun=!!bn; }
    if(!bn){ bn={id:'b'+uid(),type:'pickup',pool:{mode:'all',factions:[],ids:[]},pickup:cs.map(x=>x.id),bg:''}; G.banners.push(bn); }
    Object.assign(bn,{name:String(PUX.name||'').trim()||(rerun?'복각: ':'')+Core.puxNames(),desc:`${cs.map(x=>`${RL[x.rarity]} ${x.name}`).join(' · ')} 확률 업`,rate:+PUX.rate||50,active:true,pin:true,until,seasonal:PUX.days==='season'&&!!sn});
    delete bn.newAt; delete bn.storyFail; delete bn.gate;
    if(!bn.bg){ const bgs=G.lib.filter(l=>l.kind==='bg'); if(bgs.length) bn.bg=rand(bgs).name; }
    P().curBanner=bn.id; Core.mark('prog'); return {b: bn,c,rerun,story:!!(PUX.story&&SAMPLE&&!bn.eventId)}; }

  static addPickupFor(c,lim){
    if(lim){ c.limited=true; Core.mark('c:'+c.id); }
    const bb=c.alt&&charById(c.alt), sn=LiveOps.seasonNow(), b={id:'b'+uid(),name:c.collab?`콜라보: ${c.name}`:bb?`이격: ${c.name}`:`${c.name} 픽업`,type:'pickup',alt:!!bb,desc:c.collab?`「${c.collab}」 콜라보! ${RL[c.rarity]} ${c.name} 한정 등장`:bb?`이격! ${bb.name}의 새로운 모습, ${RL[c.rarity]} ${c.name} 등장`:`신규 ${RL[c.rarity]} ${c.name} 등장!`,collab:c.collab||'',pool:{mode:'all',factions:[],ids:[]},pickup:[c.id],rate:lim?70:50,active:true,bg:'',newAt:Date.now(),until:sn?sn.until:0,gate:Story.mainCleared()};
    G.banners.push(b); P().curBanner=b.id; Core.mark('prog'); return b;
  }

  static gateOpen(x){ return !G.meta.gated||!x||!(x.gate>0)||Story.mainCleared()>=x.gate; }

  static bnOpen(b){ if(b.active===false||!Acquire.gateOpen(b)) return false; if(b.pin&&b.until&&b.until<=Date.now()) return false; const ev=b.eventId&&G.events.find(e=>e.id===b.eventId); return !ev||Acquire.gateOpen(ev); }

  static curBanner(){const bs=G.banners.filter(Acquire.bnOpen);return bs.find(b=>b.id===P().curBanner)||bs[0]||null;}

    /* 천장·픽업 확정은 픽업 배너끼리 이어져요(시즌이 바뀌어 배너가 닫혀도 다음 픽업 배너로). 상시는 따로, 픽업 없는 배너(소속 모집 등)는 배너별.
     예전 저장(배너별 값)은 처음 읽을 때 픽업 배너들 중 가장 큰 천장·남은 확정을 이어받아요 */
static pityKey(b){ return !b||b.id==='std'?'std':(b.pickup||[]).length?'pickup':b.id; }

  static pityGet(b){ const p=P(),k=Acquire.pityKey(b); if(k==='std') return p.pity||0; p.pities=p.pities||{};
    if(k==='pickup'&&p.pities.pickup==null){ const old=G.banners.filter(bn=>bn.id!=='std'&&(bn.pickup||[]).length); p.pities.pickup=Math.max(0,...old.map(x=>p.pities[x.id]||0)); p.guar=p.guar||{}; if(p.guar.pickup==null) p.guar.pickup=old.some(x=>p.guar[x.id]); }
    return p.pities[k]||0; }

  static pitySet(b,v){ const p=P(),k=Acquire.pityKey(b); if(k==='std') p.pity=v; else p.pities[k]=v; }

  static guarGet(b){ Acquire.pityGet(b); return !!(P().guar||{})[Acquire.pityKey(b)]; }

  static softRate(s,pity){ const start=Math.floor(s.pity*0.75); return pity>start?Math.min(100,s.ssr+(pity-start)*Math.max(2,(100-s.ssr)/Math.max(1,s.pity-start))*0.5):s.ssr; }

  static rollOne(guarSR,forceSSR,b){
    b=b||Acquire.curBanner()||G.banners[0]; const p=P(),s=p.settings, gk=Acquire.pityKey(b);
    p.guar=p.guar||{}; p.spark=p.spark||{}; p.hist2=p.hist2||[];
    const pity=Acquire.pityGet(b)+1; p.total++;
    const ssrRate=Acquire.softRate(s,pity);
    let r=(forceSSR||pity>=s.pity)?3:(()=>{const x=Math.random()*100;return x<ssrRate?3:x<ssrRate+s.sr?2:1;})();
    if(r<2&&guarSR) r=2;
    const pool=Characters.bannerPool(b); let cand=pool.filter(c=>c.rarity===r);
    /* 그 등급이 풀에 없으면 가장 가까운 등급으로 바꿔요(예전엔 아무나 나와서 R 자리에 SSR이 섞였어요). 위로 올릴 땐 SSR 확률을 넘지 않게 SR까지만 */
    if(!cand.length){ const order=r===1?[2,3]:r===2?[1,3]:[2,1]; for(const q of order){ if(q===3&&r<3&&pool.some(c=>c.rarity<3)) continue; const x=pool.filter(c=>c.rarity===q); if(x.length){ cand=x; r=q; break; } } if(!cand.length) cand=pool; }
    const ups=cand.filter(c=>(b.pickup||[]).includes(c.id));
    /* 픽업에 실패하면 픽업이 아닌 같은 등급에서 골라요 — 표시한 확률(rate%)이 실제 확률이 되게(예전엔 실패해도 후보에 픽업이 남아 50% 표기가 실제 75%였어요) */
    const rest=cand.filter(c=>!ups.includes(c));
    let c;
    if(ups.length&&r===3&&p.guar[gk]){ c=rand(ups); p.guar[gk]=false; }
    else { c=ups.length&&(!rest.length||Math.random()*100<(b.rate||50))?rand(ups):rand(rest.length?rest:cand); if(r===3&&ups.length) p.guar[gk]=!(b.pickup||[]).includes(c.id); }
    Acquire.pitySet(b,c.rarity===3?0:pity);
    p.spark[b.id]=(p.spark[b.id]||0)+1;
    return Acquire.grantOwned(c,b.name);
  }

    // 뽑기·건조가 같이 써요: 처음이면 보유 등록, 이미 있으면 돌파(최대 5) + 환급, 기록 남기기
static grantOwned(c,source){
    const p=P(); p.hist2=p.hist2||[]; let isNew=false,refund=0;
    if(p.owned[c.id]){const o=p.owned[c.id];if(o.dup<5){o.dup++;if(o.dup>=5)o.cgNew=true;}refund=REFUND[c.rarity];Economy.giveReward({gems:refund});p.mat.core+=c.rarity;}
    else{p.owned[c.id]={levelCapVersion:1,transc:0,growthCostVersion:1,lv:1,exp:0,dup:0,aff:0,seen:[],wlv:0,skin:''};isNew=true;if(!p.sec)p.sec=c.id;if(p.squad.length<4)p.squad.push(c.id);}
    p.history.unshift(c.id); p.history=p.history.slice(0,80);
    p.hist2.unshift({id:c.id,b:source,at:Date.now(),n:isNew}); p.hist2=p.hist2.slice(0,200);
    return {c,isNew,refund};
  }

  static flipAll(){
    if(GC.auto) return; GC.auto=true; const n=GC.res.length;
    const next=i=>{ if(!GC) return; if(i>=n){GC.auto=false;return;} if(GC.open.has(i)) return next(i+1); revealCard(i,()=>GC&&GC.timers.push(setTimeout(()=>next(i+1),110))); };
    next(0);
  }

    /* 건조 설정 읽기(없으면 꺼짐·기본 레시피 — 상태는 그대로, 바꿀 때는 conSave·contoggle이 G.meta.construct에 씀) */
static conMeta(){ const c=G.meta.construct, m=c&&typeof c==='object'?c:{on:false}; return Array.isArray(m.recipes)?m:Object.assign({},m,{recipes:clone(CON_RECIPES)}); }

  static CON(){ const c=GGMConstruct.config(Acquire.conMeta()); c.groups=c.groups.map(g=>{ const d=GGMConstruct.DEFAULTS.groups.find(x=>x.id===g.id); return d&&g.name===d.name&&g.match&&ROLE[g.match.role]?Object.assign({},g,{name:ROLE[g.match.role]}):g; }); return c; }

    /* 새 게임을 건조/영입이 켜진 채로 시작: 시작 자원 지급(설정에서 켤 때와 같은 양) */
static conStartNew(ng){ ng.meta.construct=Object.assign({},ng.meta.construct||{},{on:true}); const s=GGMConstruct.config(ng.meta.construct).start; ng.prog.cres=Object.fromEntries(CON_RES.map(k=>[k,s])); ng.prog.cbuild={n:0,found:{},log:[],input:null,started:Date.now()}; }

  static conOn(){ return !!(G.meta.construct&&G.meta.construct.on); }

    /* 바리에이션 후보: 레시피가 맞고, 조건에 맞는 보유 캐릭터 중 아직 그 바리에이션이 없는 캐릭터 */
static conVariantOf(b,tpl){ return G.chars.find(c=>c.alt===b.id&&c.cvar===tpl.id); }

  static conPool(){ return G.chars.filter(c=>!c.limited&&!c.cvar&&!c.alt&&Acquire.castOk(c)).map(c=>({id:c.id,rarity:c.rarity,role:c.role,faction:c.faction,elem:c.elem})); }

    /* 처음(아직 건조한 적 없음) 투입: 최소 투입으로 나올 대원이 없으면(열린 분류에 지금 나오는 희귀도의 대원이 없음) 나올 수 있는 가장 적은 투입 — 첫 건조가 빈손이 되지 않게 */
static conDefaultInput(){ const cfg=Acquire.CON(), v=[cfg.min,cfg.min,cfg.min,cfg.min], s=GGMConstruct.suggest(v,cfg,Acquire.conPool()); return s?s.input:v; }

    /* 나올 대원이 없는 까닭(엔진 suggest의 why) — 화면·확인 창 글 */
static conEmptyWhy(why){ if(!why) return ''; const rr=a=>a.map(k=>RL[k]).join('·'); return why.open.length?`열린 분류 ${why.open.map(g=>`「${g.name}」(${g.rarity.length?rr(g.rarity):'대원 없음'})`).join(', ')}에 지금 투입으로 나오는 희귀도(${rr(why.allowed)})의 ${System.T('crew')}이(가) 없어요`:'이 투입으로 열리는 분류가 없어요'; }

  static conNeedText(n){ const out=[]; (n.min||[]).forEach((v,i)=>{ if(v>GGMConstruct.DEFAULTS.min&&v>Acquire.CON().min) out.push(`${System.T(CON_RES[i])} ${nf(v)}↑`); }); (n.max||[]).forEach((v,i)=>{ if(v!=null) out.push(`${System.T(CON_RES[i])} ${nf(v)}↓`); }); if(n.total) out.push(`총 ${nf(n.total)}↑`); Object.entries(n.share||{}).forEach(([i,[lo,hi]])=>out.push(`${System.T(CON_RES[i])} 비율 ${Math.round((lo||0)*100)}~${Math.round((hi==null?1:hi)*100)}%`)); return out.join(' · ')||'조건 없음'; }

  static async puStoryBg(c,lim,bn){ // 배너는 이미 열렸고, 스토리는 뒤에서 써요
    const b=bn||G.banners.find(x=>x.type==='pickup'&&(x.pickup||[])[0]===c.id&&!x.eventId), ex=!!(b&&b.pin), mates=ex?(b.pickup||[]).slice(1).map(charById).filter(Boolean):[]; if(b&&PUBUSY.has(b.id)) return; if(b){ PUBUSY.add(b.id); b.storyFail=false; } LiveOpsView.liveBar(`${c.name}의 픽업 스토리를 쓰는 중… 몇 분 걸려요. 그동안 플레이해도 돼요.`);
    const ab=c.alt&&charById(c.alt);
    try{ let res=null; for(let k=0;k<3&&!res;k++){ if(k){ LiveOpsView.liveBar(`${c.name}의 픽업 스토리 다시 시도 중… (${k}/2)`); await wait(2000); } res=await CoreCtl.aiEventGen(ab?`이격 ${System.T('crew')} 「${c.name}」의 픽업 기념 이벤트 스토리. ${c.altCanon?'정사 이야기: 이 사건으로 '+ab.name+'이(가) 지금의 모습이 되고, 이 변화는 이후 메인 스토리에 이어진다.':'외전 이야기: 메인 스토리와 무관한 단발성 소동이고, 이야기가 끝나면 원래대로 돌아간다. 메인 플롯을 바꾸지 않는다.'} 익숙한 ${ab.name}이(가) 지금까지와 다른 모습(${c.name.replace(ab.name,'').replace(/[()]/g,'')||'새 모습'})으로 ${playerName()} 앞에 나타나는 이야기. 성격과 말투는 ${ab.name} 그대로지만, 이 모습이라서 생기는 설렘·웃음·사건을 보여 준다. 이 모습일 때의 대사 이름은 반드시 「${c.name}」로 쓴다. 프로필: ${String(c.profile||'').slice(0,300)}. 기존 ${System.T('crew')} 1~2명이 조연으로 나온다.`:c.collab?`「${c.collab}」 콜라보 이벤트. 다른 세계에서 온 「${c.name}」이(가) 이 세계에 떨어져 ${playerName()}와(과) 만나는 이야기. 서로의 세계 차이에서 오는 웃음과 긴장, 함께 싸우며 믿음을 쌓는 과정, 마지막은 돌아가기 전까지 동료로 함께하기로 하는 여운. 원작 설정과 말투를 지키고, 원작의 미성년자·학생 캐릭터는 등장시키지 않는다. 학교 배경은 쓰지 않는다. 프로필: ${String(c.profile||'').slice(0,300)}.`:ex?`${System.T('crew')} 「${c.name}」의 픽업 기념 이벤트 스토리. 이미 ${playerName()}와(과) 함께하는 ${c.name}이(가) 주인공이다. 지금까지의 관계와 스토리를 이어 가면서, 아직 보여 주지 않았던 면모나 사연이 드러나는 사건을 그린다. 처음 만나는 이야기로 쓰지 않는다. 프로필: ${String(c.profile||'').slice(0,300)}.${mates.length?` 함께 픽업된 ${mates.map(x=>x.name).join(', ')}도 비중 있게 나온다.`:` 기존 ${System.T('crew')} 1~2명이 조연으로 나온다.`} 마지막 장면은 ${c.name}와(과) ${playerName()}의 사이가 한층 가까워지는 여운으로 끝낸다.`:`신규 ${System.T('crew')} 「${c.name}」의 픽업 기념 이벤트 스토리. ${c.name}이(가) 주인공으로 처음 등장해 성격·매력·사연을 보여 주고 ${playerName()}와(과) 인연을 맺는다. 프로필: ${String(c.profile||'').slice(0,300)}. 기존 ${System.T('crew')} 1~2명이 조연으로 나온다. 마지막 장면은 ${c.name}이(가) 동료가 되고 싶어 하는 여운으로 끝낸다.`,3,false,[c.name,...mates.map(x=>x.name)],'',ab&&!c.altCanon?c.id:''); }
      if(res&&b){ const ev=res.ev, eb=G.banners.find(x=>x.id===ev.bannerId); if(eb&&eb!==b) G.banners=G.banners.filter(x=>x!==eb); ev.bannerId=b.id; ev.pickupFor=c.id; ev.keepBanner=true; b.eventId=ev.id; b.desc=ex?`${b.name} · 픽업 스토리 「${ev.title}」`:c.collab?`「${c.collab}」 콜라보! ${c.name} 등장 · 콜라보 스토리 「${ev.title}」`:ab?`이격! ${c.name} 등장 · 이격 스토리 「${ev.title}」`:`신규 ${RL[c.rarity]} ${c.name} 등장! 픽업 스토리 「${ev.title}」`; P().curBanner=b.id; Core.mark('prog'); Challenge.render(); CoreView.toast(`${c.name} 픽업 스토리 「${ev.title}」가 이벤트에 열렸어요`); }
      else if(!res){ if(b) b.storyFail=true; Core.mark('prog'); Challenge.render(); CoreView.toast('픽업 스토리를 만들지 못했어요. 배너 화면의 \'이어서 만들기\'로 다시 시도할 수 있어요'); } }
    finally{ if(b) PUBUSY.delete(b.id); LiveOpsView.liveBar(null); } }

  static gateCheck(){ if(!G.meta.gated) return; const p=P(); p.gateSeen=p.gateSeen||[]; const n=[];
    G.events.forEach(ev=>{ if(ev.gate>0&&Acquire.gateOpen(ev)&&!p.gateSeen.includes(ev.id)){ p.gateSeen.push(ev.id); n.push(ev.title); Economy.sendMail({from:'운영팀',title:`새 ${System.T('event')} 「${ev.title}」가 열렸어요`,body:`메인 스토리를 진행해서 새 ${System.T('event')}이(가) 열렸어요. ${System.T('event')} 화면에서 확인해 보세요.`,days:30}); } });
    G.banners.forEach(bn=>{ if(bn.gate>0&&!bn.eventId&&Acquire.bnOpen(bn)&&!p.gateSeen.includes(bn.id)){ p.gateSeen.push(bn.id); n.push(bn.name); bn.newAt=Date.now(); Economy.sendMail({from:'운영팀',title:`「${bn.name}」 배너가 열렸어요`,body:`${bn.desc||''}\n${System.T('gacha')} 화면에서 확인해 보세요.`,days:30}); } });
    if(n.length){ Core.mark('prog'); setTimeout(()=>CoreView.toast('📮 새로 열렸어요: '+n.join(', ')),1600); } }

  static async pull(n){
    if(appStorage.failed||document.getElementById('save-warning')){SystemView.storageWarning('저장을 먼저 복구해 주세요.');return;}
    if(!G.chars.length){CoreView.toast(System.T('gacha')+'할 '+System.T('crew')+'이(가) 없어요.');return;}
    const bn=Acquire.curBanner(); if(!bn){CoreView.toast('열린 배너가 없어요');return;} const cost=n*COST; if(P().gems<cost){CoreView.toast(`${System.T('currency')}이(가) ${nf(cost-P().gems)}개 모자라요.`);return;}
    Economy.pay({gems:cost}); Economy.bump('pull',n); const res=[]; const ft=n===10&&P().firstTen; if(ft) P().firstTen=false;
    for(let i=0;i<n;i++) res.push(Acquire.rollOne(n===10&&i===9&&!res.some(x=>x.c.rarity>=2),ft&&i===9&&!res.some(x=>x.c.rarity===3),bn));
    Core.mark('prog'); try{await Core.flush();}catch(e){Challenge.render();return;} Challenge.render(); playGacha(res);
  }

  static async conBuy(k){ const cfg=Acquire.CON(), p=P(); if(p.gems<cfg.buy.gems&&!(await AcquireCtl.cashTopUp({gems:cfg.buy.gems-p.gems},'자원 보급에 '))) return; Economy.pay({gems:cfg.buy.gems}); Core.progSlot('cres')[k]+=cfg.buy.amt; Core.mark('prog'); Challenge.render(); }

  static async conSave(){ let adv; try{ adv=JSON.parse($('#con_adv').value); }catch(e){ CoreView.toast('고급 설정 JSON을 확인해 주세요: '+e.message); return; }
    const m=G.meta.construct=Acquire.conMeta(), wasOn=m.on; Object.assign(m,adv,{on:$('#con_on').checked,buy:{gems:Math.max(1,+$('#con_bg').value||60),amt:Math.max(1,+$('#con_ba').value||300)}});
    G.meta.variants=AcquireView.conReadVariants();
    if(m.on&&!wasOn&&!Core.progRead('cbuild').started){ Core.progSlot('cbuild').started=Date.now(); const r=Core.progSlot('cres'), s=Acquire.CON().start; CON_RES.forEach(k=>{ r[k]+=s; }); CoreView.toast(`${System.T('construct')}을(를) 켰어요. 시작 자원 ${nf(s)}씩 드려요`); }
    Core.mark('meta','prog'); CoreView.closeModal(); Challenge.render(); }

  static evHost(ev){ const bn=G.banners.find(x=>x.id===ev.bannerId); const ids=[...((bn&&bn.pickup)||[]),...(ev.shop||[]).filter(i=>i.type==='char').map(i=>i.ref)]; return ids.map(charById).find(Boolean)||null; }

    /* 이름 바꾸기: 대본·톡·에피소드·대사·프로필 속 옛 이름을 새 이름으로(그림 프롬프트와 id는 그대로) */
static renameEverywhere(old,nu){ let n=0; const skip=new Set(['id','charId','img','prompt','naiPrompt','naiPose','asset','seed','bannerId','eventId','kind','type','name']);
    // 옛 이름을 품은 다른 이름(예: 세라 → 세라핀)은 건드리지 않게 잠깐 감춰 둬요
    const others=[...new Set([...G.chars,...(G.npcs||[])].map(x=>x.name).filter(x=>x&&x!==old&&x!==nu&&x.includes(old)))];
    const fix=v=>{ if(!v.includes(old)) return v; let t=v; others.forEach((o,i)=>{ t=t.split(o).join('\u0000'+i+'\u0000'); }); if(!t.includes(old)) return v; t=t.split(old).join(nu); others.forEach((o,i)=>{ t=t.split('\u0000'+i+'\u0000').join(o); }); n++; return t; };
    const walk=x=>{ if(Array.isArray(x)){ x.forEach((v,i)=>{ if(typeof v==='string') x[i]=fix(v); else if(v&&typeof v==='object') walk(v); }); return; }
      if(!x||typeof x!=='object') return; Object.keys(x).forEach(k=>{ if(skip.has(k)) return; const v=x[k]; if(typeof v==='string') x[k]=fix(v); else if(v&&typeof v==='object') walk(v); }); };
    [G.chapters,G.threads,G.events,G.chars,G.npcs,G.opening,G.world,G.banners,World.RELS()].forEach(walk); World.RELS().forEach(r=>Core.relNames(r)); // 관계 설명·있었던 일 속 이름도, 관계에 적어 둔 두 사람 이름도
    (G.banners||[]).forEach(b=>{ if(typeof b.name==='string'){ const x=fix(b.name); if(x!==b.name){ b.name=x; } } }); if(n){ System.markAll(); Core.mark('prog'); } return n; }

  static async handleNavigationAndToolsAction(a,t,id,p,e){
    switch(a){
  case 'prepopen': CharactersView.openPrep(false); break;
  case 'rebal': await v2RebalanceAll(t); break;
  case 'a2hs': AcquireView.openA2HS(); break;
  case 'cdart': { const run=Core.progSlot('rogue').run; if(run) Characters.drawCardArts(run.deck,CoreView.uiProg(t)); else if(RF&&Challenge.rfIds().length) Characters.drawCardArts(Challenge.rgDeck(Challenge.rfIds()),CoreView.uiProg(t)).then(()=>{ if(RF&&document.querySelector('.rf-tee')) ChallengeView.openRgForm(); }); break; }
  case 'bswipe': Acquire.bannerStep(+t.dataset.d); break;
  case 'lktake': SystemView.lkTake(t); break;
  case 'artgo': { const k=ART_ASK; ART_ASK=null; CoreView.closeModal(); if(k) Acquire.artRun(k); break; }
  case 'artalways': { const sv=Acquire.naiSaved(); sv.autoArt='auto'; appStorage.setItem(NKEY,JSON.stringify(sv)); const k=ART_ASK; ART_ASK=null; CoreView.closeModal(); if(k) Acquire.artRun(k); CoreView.toast('앞으로는 자동으로 그려요. 설정 → 그림 AI에서 바꿀 수 있어요'); break; }
  case 'bpgo': { const cats=LiveOps.bpRead(); if(!cats.length){ CoreView.toast('하나 이상 골라 주세요'); P().bootPrep=0; break; } ArtView.bootPrepRun(cats); break; }
  case 'bpbg': { const cats=LiveOps.bpRead(); StoryView.showTitle(); if(cats.length) CoreCtl.runPrep(cats,null,{order:bootCats().map(x=>x[0])}); break; }
  case 'bpskip': P().bootPrep=1; P().prepAsked=today(); Core.mark('prog'); StoryView.showTitle(); break;
  case 'bpleave': if(PREPJOB){ PREPJOB.fg=false; AcquireView.prepChip(); } StoryView.showTitle(); CoreView.toast('남은 그림은 위쪽 진행 표시에서 확인할 수 있어요'); break;
  case 'prepgo': { const cats=[...document.querySelectorAll('[data-pc]')].filter(x=>x.checked).map(x=>x.dataset.pc); if(!cats.length){CoreView.toast('하나 이상 골라 주세요');break;} CoreView.closeModal(); CoreCtl.runPrep(cats); break; }
  case 'prepstop': if(PREPJOB){ PREPJOB.stop=true; AcquireView.prepChip(); CoreView.toast('지금 그리는 것까지만 하고 멈출게요'); } break;
  case 'prepnever': P().prepNever=true; Core.mark('prog'); CoreView.closeModal(); CoreView.toast('설정 → 그림 AI에서 언제든 열 수 있어요'); break;
  case 'opnext': StoryView.opNext(); break;
  case 'pfdraw': Player.playerDraw(CoreView.uiProg(t)); break;
  case 'pfsave': Player.readPlayerForm(); PlayerView.refreshPlayerForm(); CoreView.toast('저장했어요'); break;
  case 'go': tab=t.dataset.to; CoreView.closeModal(); if(!$('#phone').hidden) CoreView.closePhone(); Challenge.render(); StoryView.viewTop(); break;
  case 'close': window.navBack(); break;
  case 'goback': window.navBack(); break;
  case 'lbhide': CharactersView.lobbyMenu(false); CoreView.toast('화면을 누르면 메뉴가 돌아와요'); break;
  case 'lbshow': CharactersView.lobbyMenu(true); break;
  case 'poke': { if(CharactersView.lobbyMenuHidden()){ CharactersView.lobbyMenu(true); break; } const c=charById(p.sec); if(!c||!Characters.own(c.id)) break;
        const r=t.getBoundingClientRect(), fy=e.clientY?(e.clientY-r.top)/r.height:0.2, zone=fy<0.3?'head':fy<0.72?'body':'base';
        let pool=Characters.spoilFree(c,zone==='head'?c.touch?.head:zone==='body'?c.touch?.body:Characters.affLinePool(c)); if(!pool.length) pool=Characters.affLinePool(c);
        const face=Characters.touchFace(c,zone,Core.affLv(Characters.own(c.id)));
        CoreCtl.addAff(c,zone==='body'?1:2); Economy.bump('touch'); Core.mark('prog');
        const l=Core.pickTouchLine(pool,CharactersView.lobbyBubbleText()); CharactersView.lobbyPokeShow(t,e,c,l,zone,face); if(c.voiceId&&Core.SND().voiceLobby) CoreView.speak(c,l); break; }
  case 'lbbgdel': { if(System.playMode())break;const c=charById(id); if(!c?.lbbg||!(await appConfirm('로비 레이어의 배경만 지울까요?'))) break; await Characters.imgClear(c.lbbg); Core.mark('c:'+c.id); CharactersCtl.openChar(c.id); Challenge.render(); break; }
  case 'altnew': { if(!SAMPLE){ CoreView.toast('이격을 만들려면 설정 → 글 AI를 먼저 등록해 주세요'); break; } CoreView.closeModal(); CharactersView.openNewPickup({kind:'alt',base:id}); break; }
  case 'scggen': { const c=charById(id); if(!c) break; if(!String(c.naiPrompt||'').trim()){CoreView.toast('먼저 설정 편집에서 NAI 스탠딩 프롬프트를 채워 주세요');break;} if(!Core.imgReady()){CoreView.toast(Core.imgNeed());break;} if(!SAMPLE){CoreView.toast('기술 컷인 장면을 구성하려면 설정 → 글 AI를 먼저 등록해 주세요.');break;} const o=Characters.scgSlot(c), done=CoreView.busy(t,'그리는 중…');
        try{ const el=await CoreCtl.generateUltimateCutin(c); await Art.storeImage(o,el,''); o.prompt=el.__candidateConfig?.prompt||o.prompt; Core.mark('c:'+c.id); CoreView.toast('기술 컷인을 그렸어요'); CharactersCtl.openChar(c.id); }catch(err){ CoreView.toast(Core.naiErr(err,'기술 컷인 실패')); done(); } break; }
  case 'scgdel': { const c=charById(id); if(!c||!c.scg) break; if(!(await appConfirm('기술 컷인을 지울까요?'))) break; const o=c.scg;await Characters.imgClear(o); Core.mark('c:'+c.id); CharactersCtl.openChar(id); break; }
  case 'scgtest': { const c=charById(id); if(c) SystemView.skillCut(c,c.skill.name,true,document.body); break; }
  case 'ilgen': { const c=charById(id); if(!c) break; const k=t.dataset.k==='lbcg'?'lbcg':'illust'; if(!SAMPLE){CoreView.toast('설정 → 글 AI를 먼저 등록해 주세요.');break;} const sc=$(k==='lbcg'?'#lb_scene':'#il_scene'); if(sc){ c[k].prompt=sc.value.trim();CoreView.naiBlocksSave(c[k],'prompt',sc); Core.mark('c:'+c.id); } if(!String(c.naiPrompt||'').trim()){CoreView.toast('먼저 설정 편집에서 NAI 스탠딩 프롬프트를 채워 주세요');break;} CoreView.openNaiPrep(k,c.id); break; }
  case 'vncgview': { const im=$('#vnCG img'); if(im) CoreView.imgViewer(im.src); break; }
  case 'cguse': { const o=Characters.own(id); if(!o) break; o.useCg=t.checked; Core.mark('prog'); CoreView.toast(o.useCg?'로비에 '+System.T('limit')+' CG를 써요':'로비에 기본 일러스트를 써요'); break; }
  case 'ildel': { const c=charById(id), k=t.dataset.k==='lbcg'?'lbcg':'illust'; if(!c||!(await appConfirm(k==='lbcg'?System.T('limit')+' CG를 지울까요?':'일러스트를 지울까요?'))) break; const o=c[k];await Characters.imgClear(o); Core.mark('c:'+c.id); Challenge.render(); CharactersCtl.openChar(id); break; }
  case 'ailog': CoreView.openModal(SystemView.aiLogHTML(!!(t.closest('#drPage')||t.dataset.v))); break;
  case 'ailogcopy': { const tx=System.aiLogText()||'기록 없음'; try{ await navigator.clipboard.writeText(tx); CoreView.toast('AI 기록을 복사했어요'); }catch(e){ prompt('복사해 주세요',tx); } break; }
  case 'ailogclear': AILOG.length=0; try{ appStorage.removeItem('ggm-ailog'); }catch(e){} CoreView.openModal(SystemView.aiLogHTML(!!$('#modal [data-act="draft-open"]'))); break;
  case 'artcopy': { const c=Core.naiCfg(), el=c.styles.find(x=>x.id===c.styleId)||c.styles[0]||{tags:'',neg:''}; if(!String(el.tags||'').trim()&&!String(el.neg||'').trim()){ CoreView.toast('설정의 그림 AI에 그림체가 비어 있어요'); break; } $('#mt_art').value=el.tags||''; $('#mt_artn').value=el.neg||''; CoreView.toast(`「${el.name||'기본 그림체'}」 태그·네거티브를 넣었어요. 저장하면 이 게임에 고정돼요`); break; }
  case 'artclear': $('#mt_art').value=''; $('#mt_artn').value=''; CoreView.toast('비웠어요. 저장하면 설정의 기본 그림체를 따라가요'); break;
  case 'pthumbset': uploadFor={kind:'pthumb',id:t.dataset.v}; $('#file').click(); break;
  case 'avdel': { const av=Core.progSlot('avatar'); if(!av||!av.img||!(await appConfirm('프로필 그림을 지울까요?'))) break; await Characters.imgClear(av); Core.mark('prog'); PlayerView.refreshPlayerForm(); CoreView.toast('프로필 그림을 지웠어요'); break; }
  case 'pthumbdel': { const pid=t.dataset.v, up=Core.userPacks(), mine=up.find(x=>x.id===pid); if(mine){ delete mine.thumb; Core.saveUserPacks(up); } const m=Art.pthumbs(); delete m[pid]; try{ appStorage.setItem(PTHUMB,JSON.stringify(m)); }catch(e){} if($('#modal [data-act="packuse"]')) CoreView.openModal(ArtView.packHTML()); else if($('#modal [data-act="naipreset"]')) ArtView.openNaiSet(); CoreView.toast('썸네일을 지웠어요'); break; }
  case 'addchar-open': CharactersView.openAddChar(); break;
  case 'addchar-hand': { NEWPU=false; window.__ADDOWN=$('#ac_how').value==='own'; CoreView.closeModal(); CharactersView.openCharEdit(null); break; }
  case 'addchar-ai': { const con=$('#ac_c').value.trim(), rr=$('#ac_r').value, how=$('#ac_how').value; if(!con){ CoreView.toast('어떤 '+System.T('crew')+'인지 적어 주세요'); break; } CoreView.closeModal();
        CoreCtl.bgJob('addchar',System.T('crew')+' 만드는 중',async()=>{ const c=await Characters.aiNewPickupChar(con,rr,null); if(!c) return null; c.limited=false; Core.mark('c:'+c.id); if(how==='own') CharactersCtl.joinChar(c,'새로'); CoreView.artAfterAI(x=>x.o===c||x.c===c,'새 '+System.T('crew')+' '+c.name);
          return {title:`${RL[c.rarity]} ${c.name}을(를) 추가했어요`,body:how==='own'?`바로 ${System.T('crew')}로 합류했어요.`:`상시 ${System.T('gacha')}에서 만날 수 있어요.`}; }); break; }
  case 'copy': try{await navigator.clipboard.writeText(t.dataset.text||'');CoreView.toast('복사했어요');}catch(err){CoreView.toast('복사하지 못했어요. 길게 눌러 직접 복사해 주세요.');} break;
  case 'copyfield': { const f=$('#'+t.dataset.f); try{await navigator.clipboard.writeText(f.value);CoreView.toast('복사했어요');}catch(err){CoreView.uiSelectText(f);CoreView.toast('선택한 텍스트를 직접 복사해 주세요');} break; }
  case 'playep': { const c=charById(id),ep=c.episodes.find(x=>x.id===t.dataset.ep); if(Story.epLock(c,ep,Characters.own(id))){CoreView.toast(Story.epLock(c,ep,Characters.own(id))+' 필요');break;} CoreView.closeModal();
        SystemView.playStory(`${c.name} · ${ep.title}`,ep.script,()=>{const o=Characters.own(id);if(o){o.seen=o.seen||[];if(!o.seen.includes(ep.id)){o.seen.push(ep.id);Core.mark('prog');}}CharactersCtl.openChar(id);}); break; }
  case 'mapedit': { const ch=G.chapters.find(x=>x.id===t.dataset.ch); if(!ch) break; const l=Story.ensureChMap(ch); CharactersView.openLibItem(l.id); break; }
  case 'locked': CoreView.toast('이전 작전을 먼저 클리어하세요'); break;
  case 'ghist': AcquireView.openHistory(); break;
  case 'vnnext': CoreView.vnStep(); break;
  case 'vnpick': { e.stopPropagation(); if(!S||!S.choice) break; const n=+t.dataset.n,o=S.choice.opts[n-1]; S.pick=n; S.lastPick=o; S.choice=null; if(S.branch){ LiveOps.storyFlag(S.branch,n,o); S.branch=null; } AcquireView.vnChoiceClear(); CharactersView.vnShow({type:'say',who:System.T('player'),text:o}); break; }
  case 'vnauto': e.stopPropagation(); S.auto=!S.auto; CoreView.chipOn(t,S.auto); if(S.auto&&!S.typing&&!S.choice) S.autoT=setTimeout(CoreView.vnStep,700); else clearTimeout(S.autoT); break;
  case 'vnskip': e.stopPropagation(); CoreView.vnSkip(); break;
  case 'vnlog': e.stopPropagation(); CoreView.openVnLog(); break;
  case 'bquit': if(B?.ctx.kind==='practice'){v2StopPractice();break;}if(B&&(B.ctx.kind==='raid'||B.ctx.kind==='rogue')){ if((await appConfirm(B.ctx.kind==='raid'?'여기서 끝낼까요? 지금까지 준 피해는 기록돼요.':'후퇴하면 이번 탐사가 끝나요. 지금까지의 보상은 받아요.'))){ if(!B.over) CoreCtl.bEnd(false); } break; }
        if((await Core.quitConfirm())){clearInterval(B.timer);B=null;CoreView.closeOv();Challenge.render();} break;
  case 'skill': { const u=B&&B.allies[+t.dataset.i]; if(u&&u.hp>0&&!B.over){ SCUT_MAN=true; Acquire.useSkill(u); SCUT_MAN=false; } SystemView.bUpdate(); break; }
  case 'bretry': { const st=B.s,cx=B.ctx; B=null; SystemView.startStage(st,cx); break; }
  case 'flip': revealCard(+t.dataset.i); break;
  case 'flipall': Acquire.flipAll(); break;
  case 'gcskip': { GC.timers.forEach(clearTimeout); GC.skip=true; AcquireView.gachaSkipShow(t); break; }
  case 'closepull': { if(GC.open.size<GC.res.length){Acquire.flipAll();break;}
        const best=GC.res.filter(x=>x.isNew).sort((a,b)=>b.c.rarity-a.c.rarity)[0]; GC.timers.forEach(clearTimeout); GC=null; CoreView.closeOv(); Challenge.render();
        if(best) CoreView.toast(`${best.c.name}와(과) 계약했어요`); setTimeout(()=>MessengerCtl.checkTriggers(),800); break; }
  case 'sdelno': { const o=SDEL&&SDEL.o; SDEL=null; if(o&&o.back) o.back(); else CoreView.closeModal(); break; }
  case 'sdelgo': { if(!SDEL) break; const {o,L}=SDEL, pick={}; document.querySelectorAll('[data-sd]').forEach(i=>{ pick[i.dataset.sd]=i.checked; }); SDEL=null;
        Acquire.storyPurge(L,pick); o.run(); o.ids.forEach(id=>{ delete P().cleared[id]; if(P().stars) delete P().stars[id]; }); Core.mark('prog'); CoreView.closeModal(); if(o.after) o.after(); Challenge.render();
        const n=['threads','codex','libs','rels','chars'].filter(k=>pick[k]).reduce((a,k)=>a+L[k].length,0); CoreView.toast(`「${o.title}」을(를) 지웠어요${n?` · 연결된 것 ${n}개도 함께`:''}`); break; }
  case 'saveopening': G.opening.lines=lines($('#op_lines').value); G.opening.prologue=$('#op_pro').value; Core.mark('opening'); CoreView.closeModal(); CoreView.toast('오프닝을 저장했어요'); break;
  case 'aiopening': { const hint=$('#op_hint').value.trim();
        const r=await Core.aiJSON(Acquire.aiopeningPrompt({hint}),CoreView.uiProg(t),'complex');
        if(r&&$('#op_lines')){ $('#op_lines').value=strs(r.lines).join('\n'); $('#op_pro').value=nl(r.prologue); CoreView.toast('입력칸을 채웠어요. 확인 후 저장하세요.'); } break; }
  case 'savelib': { const name=$('#li_name').value.trim(); if(!name){CoreView.toast('이름을 입력해 주세요');break;}
        let l=id?libById(id):null; if(!l){l={id:'l'+uid(),kind:t.dataset.k,name,prompt:'',img:null};G.lib.push(l);}
        l.name=name; l.prompt=$('#li_prompt').value.trim(); if(l.kind!=='bgm')CoreView.naiBlocksSave(l,'prompt','li_prompt'); if(l.kind==='cg') l.cast=[0,1,2,3].map(i=>({id:$('#cg_c'+i).value,pos:$('#cg_p'+i).value,act:$('#cg_a'+i).value.trim()})).filter(x=>x.id); Core.mark('l:'+l.id); Challenge.render(); CharactersView.openLibItem(l.id); CoreView.toast('저장했어요'); break; }
  case 'dellib': { const l=libById(id); if((await appConfirm('삭제할까요?'))){G.lib=G.lib.filter(x=>x.id!==id);Core.mark('l:'+id);ArtView.openLib(l.kind);Challenge.render();} break; }
  case 'ailib': { const k=t.dataset.k,nm=$('#li_name').value.trim(),ds=$('#li_desc').value.trim();
        if(k==='cg'){ const ids=[0,1,2,3].map(i=>$('#cg_c'+i).value).filter(Boolean).map(charById).filter(Boolean);
          const r=await Core.aiJSON(World.ailibPrompt({nm,ds,ids}),CoreView.uiProg(t),'quick');
          if(r&&$('#li_prompt')){ if(r.prompt)$('#li_prompt').value=String(r.prompt); strs(r.acts).forEach((a2,i)=>{const e2=$('#cg_a'+i); if(e2&&!e2.value.trim()) e2.value=a2;}); } break; }
        if(k==='bgm'){ const r=await Core.aiJSON(World.ailibPrompt2({nm,ds}),CoreView.uiProg(t),'quick'); if(r&&r.prompt&&$('#li_prompt')) $('#li_prompt').value=String(r.prompt); break; }
        if(k==='enemy'){ const r=await Core.aiJSON(World.ailibPrompt3({nm,ds}),CoreView.uiProg(t),'quick'); if(r&&r.prompt&&$('#li_prompt')) $('#li_prompt').value=String(r.prompt); break; }
        const r=await Core.aiJSON(World.ailibPrompt4({k,nm,ds}),CoreView.uiProg(t),'quick');
        if(r&&r.prompt&&$('#li_prompt')) $('#li_prompt').value=String(r.prompt); break; }
  case 'newpu': CharactersView.openNewPickup(); break;
  case 'newpu-hand': { NEWPU=$('#pu_lim').value==='limited'?'limited':'pickup'; window.__PUSTORY=!!($('#pu_story')&&$('#pu_story').checked); CoreView.closeModal(); CharactersView.openCharEdit(null); break; }
  case 'newpu-ai': { const con=$('#pu_c').value.trim(), kind=$('#pu_kind')?$('#pu_kind').value:'orig', col=kind==='collab'?{src:$('#pu_src').value.trim(),who:$('#pu_who').value.trim()}:null, altB=kind==='alt'?charById($('#pu_base').value):null;
        if(kind==='alt'&&!altB){ CoreView.toast('누구의 이격인지 골라 주세요'); break; }
        if(col&&!col.src){ CoreView.toast('콜라보할 작품 이름을 적어 주세요'); break; } if(!con&&!col&&!altB){CoreView.toast('어떤 '+System.T('crew')+'인지 적어 주세요');break;} if(!SAMPLE){ CoreView.toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); break; }
        const rr=$('#pu_r').value, lim=col?true:$('#pu_lim').value==='limited';
        const story=!!($('#pu_story')&&$('#pu_story').checked); const canon=!!(altB&&$('#pu_canon')&&$('#pu_canon').value==='canon');
        // 창을 닫기 전에 칸을 모두 읽어 둬요
        const nEx=+($('#pu_ex')?$('#pu_ex').value:0), split=$('#pu_split')&&$('#pu_split').value==='split', exs=[]; for(let i=1;i<=nEx;i++) exs.push({r:$('#pu_exr'+i).value,c:$('#pu_exc'+i).value.trim()});
        CoreView.closeModal();
        CoreCtl.bgJob('pickup','픽업 만드는 중',async j=>{ j.total=1+nEx; j.sub='주인공'; CoreView.bgJobsDraw();
          const c=await Characters.aiNewPickupChar(con,rr,null,col,altB?Object.assign(Object.create(altB),{__canon:canon}):null); if(!c) return null; j.step=1;
          const ex=[]; for(let i=0;i<exs.length;i++){ const er=exs[i].r, ec=exs[i].c; j.sub=`함께 픽업 ${i+1}/${nEx}`; CoreView.bgJobsDraw();
            const c2=await Characters.aiNewPickupChar(ec||`이번 픽업의 주인공 「${c.name}」(${c.faction||''}, ${String(c.profile||'').slice(0,160)})와(과) 함께 등장하는 ${RL[er]||'SR'} ${System.T('crew')}. 둘의 관계(동료·라이벌·자매·주종 등)와 테마가 이어지게. 외모와 역할은 겹치지 않게`,er,null,null,null); j.step=i+2; if(c2){ if(lim&&!split){ c2.limited=true; Core.mark('c:'+c2.id); } ex.push(c2); } }
          const b=Acquire.addPickupFor(c,lim);
          if(ex.length&&!split){ ex.forEach(x=>b.pickup.push(x.id)); b.name=`${c.name} 외 ${ex.length}명 픽업`; b.desc=`${RL[c.rarity]} ${c.name}${ex.map(x=>` · ${RL[x.rarity]} ${x.name}`).join('')} 확률 업`; }
          ex.forEach((x,i)=>{ if(split){ const b2=Acquire.addPickupFor(x,lim); b2.name=`${i+2}차 픽업: ${x.name}`; } });
          if(split) P().curBanner=b.id; Core.mark('prog');
          if(story) Acquire.puStoryBg(c,lim); const all=[c,...ex]; CoreView.artAfterAI(y=>all.includes(y.o)||all.includes(y.c),'신규 '+System.T('crew')+' '+all.map(x=>x.name).join(', '));
          return {title:(c.alt?`이격 ${RL[c.rarity]} ${c.name}`:`신규 ${RL[c.rarity]} ${c.name}`)+(ex.length?` 외 ${ex.length}명`:'')+' 픽업이 열렸어요',body:`${System.T('gacha')} 화면에서 바로 뽑을 수 있어요.${story?'\n픽업 스토리는 이어서 뒤에서 쓰고 있어요. 다 되면 이벤트에 열려요.':''}`}; }); break; }
  case 'nextneedai': CoreView.toast('설정 → 글 AI에서 AI를 먼저 등록해 주세요'); break;
  case 'cplogin': CoreView.readAp(); CoreView.copilotLogin(t); break;
  case 'saload': { const inp=document.createElement('input'); inp.type='file'; inp.accept='.json,application/json'; inp.onchange=async()=>{ const f=inp.files[0]; if(!f) return; const tx=await f.text(); if($('#ap_sa')) $('#ap_sa').value=tx; try{ const j=JSON.parse(tx); if($('#ap_project')&&!$('#ap_project').value) $('#ap_project').value=j.project_id||''; CoreView.toast('서비스 계정 키를 불러왔어요'); }catch(e){ CoreView.toast('JSON 파일이 아니에요'); } }; inp.click(); break; }
  case 'seasoninfo': LiveOpsView.openSeasonInfo(); break;
  case 'seasontog': { const L=P().live; const k=t.dataset.k; const en=SEASONS.filter(x=>L.seasons[x[0]]!==false).length; if(L.seasons[k]!==false&&en<=1){ CoreView.toast('하나는 남겨 두세요'); break; } L.seasons[k]=L.seasons[k]===false; Core.mark('prog'); LiveOpsView.openSeasonInfo(); break; }
  case 'seasonskip': { if(LIVE_RUN){ CoreView.toast('이미 업데이트 중이에요'); break; } if(!(await appConfirm('지금 다음 시즌으로 넘길까요? 진행 중인 이벤트는 끝나요.'))) break; CoreView.closeModal(); Story.liveTick('season'); break; }
  case 'livetog': { const L=P().live; L.on[t.dataset.k]=!L.on[t.dataset.k]; Core.mark('prog'); Challenge.render(); break; }
  case 'liverun': if(LIVE_RUN){CoreView.toast('이미 업데이트 중이에요');break;} if(!SAMPLE&&(P().live.on.event||P().live.on.talk||P().live.on.chapter)) CoreView.toast('글 AI가 없어서 AI가 필요한 항목은 건너뛰어요'); Story.liveTick(true); break;
  case 'enh': case 'enhmax': case 'lb': case 'wup': { const c=charById(id); if(c&&Characters.own(id)) CoreView.openUpConfirm(c,a==='lb'&&Characters.own(id).lv>=70?'transc':a); break; }
  case 'skvclear': { const c=charById(id), k=c&&(c.skins||[]).find(x=>x.id===t.dataset.s); if(!k) break; k.voiceId=''; k.voiceName=''; Core.mark('c:'+c.id); CharactersCtl.skinRefresh(id); break; }
  case 'aiskin': { const c=charById(id),idea=$('#sk_idea').value.trim(),field=$('#sk_prompt'),project=Core.PJ().active,old=field.value,original=c.naiPrompt;
        if(!idea){CoreView.toast('의상 아이디어를 적어 주세요');break;}
        const base=await Core.naiSkinBase(c,CoreView.uiProg(t));
        const r=await Core.aiJSON(World.aiskinPrompt({c,base,idea}),CoreView.uiProg(t),'quick');
        if(r&&field.isConnected&&Core.PJ().active===project&&charById(id)===c&&c.naiPrompt===original&&field.value===old){CoreView.naiBlocksSeed(field,Core.naiSkinParts(base,r));if(!$('#sk_name').value.trim())$('#sk_name').value=idea.slice(0,16);}break; }
  case 'skpredo': AcquireView.skinPropRead(); CoreCtl.skinPropDraw(CoreView.uiProg(t)); break;
  case 'skpcancel': if(SKPROP){ if(SKPROP.url) URL.revokeObjectURL(SKPROP.url); const cid=SKPROP.cid; SKPROP=null; CharactersView.openSkin(cid); } else CoreView.closeModal(); break;
  case 'skpok': { AcquireView.skinPropRead(); const P0=SKPROP, c=P0&&charById(P0.cid); if(!c||!P0.blob) break; CoreView.busy(t);
        const k={id:'k'+uid(),name:P0.name,prompt:P0.prompt,naiBlocks:clone(P0.naiBlocks||{}),idea:P0.idea,scene:P0.scene||'',img:null,faces:[]}; c.skins.push(k); await Art.storeImage(k,P0.blob,''); Core.mark('c:'+c.id);
        const sel=Object.assign({},P0.sel); URL.revokeObjectURL(P0.url); SKPROP=null; CoreView.toast(`${System.T('skin')} 「${k.name}」을(를) 만들었어요 · ${System.T('crew')} 화면의 외형에서 입힐 수 있어요`); CharactersCtl.openChar(c.id);
        CoreCtl.skinMakeRest(c,k,sel); break; }
  case 'bnfac': { Acquire.readBanner(); const v=t.dataset.v,a=BD.pool.factions; a.includes(v)?a.splice(a.indexOf(v),1):a.push(v); AcquireView.openBannerFrom(BD); break; }
  case 'bnid': { Acquire.readBanner(); const v=t.dataset.v,a=BD.pool.ids; a.includes(v)?a.splice(a.indexOf(v),1):a.push(v); AcquireView.openBannerFrom(BD); break; }
  case 'bnup': { Acquire.readBanner(); const v=t.dataset.v,a=BD.pickup; a.includes(v)?a.splice(a.indexOf(v),1):a.push(v); AcquireView.openBannerFrom(BD); break; }
  case 'bnsave': { const el=Acquire.readBanner(); if(!el.id){el.id='b'+uid();G.banners.push(el);} else {const i=G.banners.findIndex(bn=>bn.id===el.id);G.banners[i]=el;} P().curBanner=el.id; Core.mark('prog'); CoreView.closeModal(); Challenge.render(); CoreView.toast('배너를 저장했어요'); break; }
  case 'bndel': if((await appConfirm('이 배너를 삭제할까요?'))){G.banners=G.banners.filter(bn=>bn.id!==BD.id);P().curBanner='';CoreView.closeModal();Challenge.render();} break;
  case 'dsauto': { const d0=Expedition.dispList().find(x=>x.id===DSEL.id), busy=busyIds(); if(!d0) break; DSEL.ids=G.chars.filter(c=>Characters.own(c.id)&&!busy.has(c.id)).sort((a,b)=>Characters.own(a.id).lv-Characters.own(b.id).lv||charPower(a)-charPower(b)).slice(0,d0.need).map(c=>c.id); ExpeditionView.openDispSel(DSEL.id); break; }
  case 'dsclr': DSEL.ids=[]; ExpeditionView.openDispSel(DSEL.id); break;
  case 'pgetall': { const lv=passLv(), tot={}; let n=0; for(let l=1;l<=lv;l++){ if(P().pass.got.includes(l)) continue; P().pass.got.push(l); const r=Economy.passReward(l); Economy.giveReward(r); Object.entries(r).forEach(([k,v])=>{ if(typeof v==='number') tot[k]=(tot[k]||0)+v; }); n++; } const d=Core.progSlot('dm'); MISSIONS.forEach(m=>{ if(!d.got[m.k]&&(d.cnt[m.k]||0)>=m.goal){ d.got[m.k]=true; P().pass.xp+=m.xp; Economy.giveReward({gems:50}); tot.gems=(tot.gems||0)+50; n++; } }); if(!n){ CoreView.toast('받을 보상이 없어요'); break; } Core.mark('prog'); Art.sfx('확인'); CoreView.toast('모두 받았어요: '+Core.rewardText(tot)); Challenge.render(); break; }
  case 'dsel': { const a=DSEL.ids, d0=Expedition.dispList().find(x=>x.id===DSEL.id); if(a.includes(id)) a.splice(a.indexOf(id),1); else { if(d0&&a.length>=d0.need){ CoreView.toast(`${d0.need}명까지만 보낼 수 있어요`); break; } a.push(id); } ExpeditionView.openDispSel(DSEL.id); break; }
  case 'mget': { const m=MISSIONS.find(x=>x.k===t.dataset.k), d=Core.progSlot('dm'); if(d.got[m.k]||(d.cnt[m.k]||0)<m.goal) break; d.got[m.k]=true; P().pass.xp+=m.xp; Economy.giveReward({gems:50}); Art.sfx('확인'); Challenge.render(); break; }
  case 'pget': { const l=+t.dataset.lv; if(l>passLv()||P().pass.got.includes(l)) break; P().pass.got.push(l); const r=Economy.passReward(l); Economy.giveReward(r); Art.sfx('확인'); CoreView.toast(`패스 ${l}단계: ${Core.rewardText(r)}`); Challenge.render(); break; }
  case 'logoprev': CoreView.logoPreview($('#mt_logo').value); break;
  case 'logoprevclose': AcquireView.logoPreviewClose(); break;
  case 'aievent-open': StoryView.openAiEvent(); break;
  case 'aievent': await Story.aiEvent(t); break;
  case 'sfxplay': { const l=libById(id); if(l) Art.sfx(l.name); break; }
  case 'sfxgen': { const l=libById(id), done=CoreView.busy(t); try{ await Core.elSfx(l); Art.sfx(l.name); ArtView.openLib('sfx'); }catch(err){ CoreView.toast((AIERR[err&&err.code]||'효과음 생성 실패')+' '+((err&&err.message)||'')); done(); } break; }
  case 'sfxall': { const items=G.lib.filter(l=>l.kind==='sfx'&&!l.audio); if(!items.length){CoreView.toast('모두 등록돼 있어요');break;} CoreView.busy(t); let n=0;
        for(const l of items){ CoreView.say(t,`만드는 중 ${n}/${items.length}`); try{ await Core.elSfx(l); n++; }catch(err){ CoreView.toast((AIERR[err&&err.code]||'중단')+' '+((err&&err.message)||'')); break; } }
        CoreView.toast(`효과음 ${n}개를 만들었어요`); ArtView.openLib('sfx'); break; }
  case 'vtest': { const c=charById(id); await CoreView.speak(c,c.intro||c.lines[0]||c.name); break; }
  case 'dsopen': CharactersView.openDesign(); break;
  case 'dssave': { G.meta.design=CoreView.designRead(); Core.mark('meta'); CoreView.closeModal(); Challenge.render(); CoreView.toast('캐릭터 디자인 태그를 저장했어요. 새로 그리는 그림부터 적용돼요'); break; }
  case 'dsai': Core.designAI(CoreView.uiProg(t)); break;
  case 'shareopen': ArtView.openShare(); break;
  case 'sharego': { const img=$('#sh_img').checked, audio=$('#sh_aud').checked, gate=$('#sh_gate')?$('#sh_gate').checked:true; CoreView.closeModal(); SystemView.exportFile({share:true,img,audio,gate}); break; }
  case 'fbopen': AcquireView.openFeedback(); break;
  case 'fbissue': { const txt=CharactersView.feedbackText(); const url=`https://github.com/${Core.updRepo(Core.LV())}/issues/new?title=${encodeURIComponent('[피드백] '+(($('#fb_bad')&&$('#fb_bad').value.trim())||($('#fb_good')&&$('#fb_good').value.trim())||'의견').slice(0,40))}&body=${encodeURIComponent(txt)}`; CoreView.openUrl(url); break; }
  case 'fbpost': { try{ await navigator.clipboard.writeText(CharactersView.feedbackText()); CoreView.toast('피드백을 복사했어요. 게시글 댓글에 붙여 넣어 주세요'); }catch(err){ Core.quietErr(err,'0510-actions/020-navigation-and-tools.js:170'); } CoreView.openUrl(Core.LV().feedback); break; }
  case 'fbstar': FB_STAR=+t.dataset.n; AcquireView.fbStarsShow(); break;
  case 'fbsend': { const txt=CharactersView.feedbackText(); await AcquireView.shareText(G.meta.title+' 피드백',txt); break; }
  case 'guidecopy': AcquireView.shareText(G.meta.title+' 테스트 안내',System.guideText()); break;
  case 'skbdraw': { const f=Characters.skinShopList().find(x=>x.k.id===id); if(!f) break; if(!Core.imgReady()){ CoreView.toast(Core.imgNeed()); break; } if(document.querySelector('[data-skp]')) SKBUYSEL=EconomyView.skinSelRead(); CoreView.busy(t,'그리는 중…');
        try{ const target=Economy.skinPrimaryPart(f.c,f.k),el=await CoreCtl.skinPartDraw(f.c,f.k,target===f.k?'stand':'upper','manual');await Art.storeImage(target,el,''); Core.mark('c:'+f.c.id); }catch(err){ CoreView.toast(Core.naiErr(err)); } EconomyView.openSkinBuy(id); break; }
  case 'skbbuy': { const f=Characters.skinShopList().find(x=>x.k.id===id); if(!f) break; const p=P(), pr=f.k.price||SKIN_PRICE, sel=EconomyView.skinSelRead(); SKBUYSEL=sel; p.skinOwn=p.skinOwn||{}; if(p.skinOwn[id]) break;if(!Core.skinDisplayReady(f.c,f.k)){CoreView.toast('현재 표시 방식에 맞는 스킨 그림을 먼저 생성해 주세요');break;}if(p.gems<pr){ CoreView.toast(`${System.T('currency')}이 모자라요`); break; }
        Economy.pay({gems:pr}); p.skinOwn[id]=true; f.k.faces=f.k.faces||[]; Core.mark('prog'); CoreView.closeModal(); Challenge.render(); CoreView.buyFx(f.k.name,`${f.c.name}의 ${System.T('skin')}`+(Characters.own(f.c.id)?' · 외형에서 입힐 수 있어요':' · '+System.T('crew')+'를 얻으면 입힐 수 있어요')); CoreCtl.skinMakeRest(f.c,f.k,Object.assign({},sel)); break; }
  case 'reroll0': { if(!(await appConfirm(`리세마라: 보유 ${System.T('crew')}·재화·클리어 기록만 지우고 처음부터 다시 해요.\n세계관·${System.T('crew')}·스토리·그림·설정은 그대로예요. 진행할까요?`))) break;
        const o=P(), keep={}; ['player','genderTxt','gender','look','bio','hideEyes','avatar','nameAsked','settings','scene','lobbyMode','csFull','lobbyBg','titleBg','titleChar','gachaBg','skillCut','battleMotion'].forEach(k=>{ if(o[k]!==undefined) keep[k]=o[k]; });
        G.prog=Object.assign(clone(DEFAULT_PROG),keep,{seenOpening:false,castDone:1,bootPrep:1}); System.markAll(); await Core.flush(); SystemView.reloadGame(); break; }
  case 'cachewipe': { if(!(await appConfirm('캐시 삭제: 이 기기의 모든 게임·그림·설정·API 키를 지우고 앱을 처음 받은 상태로 되돌려요. 되돌릴 수 없어요.'))) break; if(!(await appConfirm('정말 지울까요? 필요하면 먼저 전체 백업을 저장해 두세요.'))) break;
        const previous=window.__NOFLUSH;window.__NOFLUSH=1;try{await appStorage.clear();sessionStorage.clear();if(window.caches)for(const k of await caches.keys())await caches.delete(k);await SystemView.reloadGame();}catch(e){window.__NOFLUSH=previous;SystemView.storageWarning('초기화를 완료하지 못했습니다. '+(e.message||e));}break; }
    }
  }

  static storyPurge(L,pick){ const P0=P();
    if(pick.threads){ const tid=new Set(L.threads.map(t=>t.id)); G.threads=G.threads.filter(t=>!tid.has(t.id)); tid.forEach(id=>{ delete P0.inbox[id]; Core.mark('t:'+id); }); }
    if(pick.codex){ const xs=new Set(L.codex); World.cxKeep(x=>!xs.has(x)); Core.mark('world'); }
    if(pick.libs){ const ls=new Set(L.libs); G.lib=G.lib.filter(l=>!ls.has(l)); L.libs.forEach(l=>Core.mark('l:'+l.id)); }
    if(pick.chars){ const cs=new Set(L.chars.map(c=>c.id)); G.chars=G.chars.filter(c=>!cs.has(c.id)); G.banners.forEach(bn=>{ bn.pickup=(bn.pickup||[]).filter(x=>!cs.has(x)); if(bn.pool&&bn.pool.ids) bn.pool.ids=bn.pool.ids.filter(x=>!cs.has(x)); }); G.chapters.forEach(ch=>{ if(ch.recruits) ch.recruits=ch.recruits.filter(x=>!cs.has(x)); }); G.threads=G.threads.filter(t=>!cs.has(t.charId)); cs.forEach(id=>Core.mark('c:'+id)); Core.mark('meta'); }
    World.relPurgeStory(L,pick); Core.mark('prog'); }

  static readBanner(){const b=BD;b.name=$('#bn_name').value.trim()||b.name;b.desc=$('#bn_desc').value.trim();b.type=$('#bn_type').value;b.bg=$('#bn_bg').value;b.pool.mode=$('#bn_mode').value;b.rate=num($('#bn_rate').value,0,100,50);b.active=$('#bn_act').value==='1';return b;}

  static castOk(c){ return !World.castLock(c); }

  static useSkill(u){
    if(!B||B.over||!B.engine||B.paused||B.presentationBusy||B.ending)return;
    B.engine.events=[];
    if(GGMCombat.cast(B.engine,u,'ultimate')){v2BattleEvents(B.engine.events);Core.bCheck();}
  }
}

class AcquireView {
  static skinPropRead(){ const P0=SKPROP; if(!P0) return; P0.sel={}; document.querySelectorAll('[data-skp]').forEach(i=>{ P0.sel[i.dataset.skp]=i.checked?1:0; }); const sc=$('#skp_scene'); if(sc){P0.scene=sc.value.trim();CoreView.naiBlocksSave(P0,'scene',sc);} }

  static prepChip(){
    let el=$('#prepChip'); const j=PREPJOB;
    if(!j||j.fg){ if(el) el.remove(); return; }
    if(!el){ el=document.createElement('div'); el.id='prepChip'; el.className='prepchip'; document.body.appendChild(el); }
    el.innerHTML=`<span class="pg"><i style="width:${j.total?j.done/j.total*100:0}%"></i></span><b>그림 준비 ${j.done}/${j.total}</b><span class="lb">${esc(j.label||'')}</span><button data-act="prepstop" aria-label="멈추기">${j.stop?'멈추는 중':'■'}</button>`;
  }

  static async conBuild(){
    if(CONJOB||NEW_GAME_SOURCE||!Acquire.conOn()) return; if(appStorage.failed||document.getElementById('save-warning')){ SystemView.storageWarning('저장을 먼저 복구해 주세요.'); return; }
    const cfg=Acquire.CON(), r=Core.progSlot('cres'); let input=GGMConstruct.normalize(AcquireView.conReadInput(),cfg);
    /* 나올 대원이 없는 투입이면 멈추지 않고 나올 수 있게 맞춘 투입을 권해요(PL1 — 예: 최소 투입은 R만인데 열린 분류에 SR만 있음) */
    const sg=GGMConstruct.suggest(input,cfg,Acquire.conPool()); if(!sg){ CoreView.toast(`${System.T('construct')}로 나올 ${System.T('crew')}이(가) 없어요(건조 대상 대원이 없음)`); return; }
    if(sg.changed){ if(!(await appConfirm(`${Acquire.conEmptyWhy(sg.why)}.\n투입을 ${sg.input.join(' / ')}(으)로 올려 ${System.T('construct')}할까요?`))) return; input=sg.input; }
    /* 자원이 모자라도 멈추지 않고 캐시 상점에서 ₩0으로 보충해요(나만의 게임이라 무료) */
    const lack=CON_RES.filter((k,i)=>r[k]<input[i]); if(lack.length&&!(await AcquireCtl.cashTopUp(Object.fromEntries(lack.map(k=>[k,input[CON_RES.indexOf(k)]-r[k]])),`${System.T('construct')}에 `))) return;
    const variants=AcquireView.conVariantChoices(input), res=GGMConstruct.roll(input,cfg,Acquire.conPool(),variants);
    if(res.kind==='none'){ CoreView.toast(`${System.T('construct')}로 나올 ${System.T('crew')}이(가) 없어요`); return; }
    CONJOB=true;
    try{
      CON_RES.forEach((k,i)=>{ r[k]-=input[i]; }); const B=Core.progSlot('cbuild'); B.n++; B.input=input;
      res.info.recipes.forEach(x=>{ if(!B.found[x.id]) { B.found[x.id]=Date.now(); CoreView.toast(`새 레시피 발견: ${x.name}`); } });
      res.info.groups.filter(g=>g.open&&!B.found['g:'+g.id]).forEach(g=>{ B.found['g:'+g.id]=Date.now(); });
      let c;
      if(res.kind==='variant'){ const key='v:'+res.tpl.id; if(!B.found[key]) B.found[key]=Date.now();
        c=Acquire.conVariantOf(res.base,res.tpl);
        if(!c){ CoreView.openModal(AcquireView.conDecodeHTML(res),true);
          try{ c=await Characters.conMakeVariant(res.base,res.tpl); }finally{ CoreView.closeModal(); } } }
      else c=charById(res.id);
      const got=Acquire.grantOwned(c,System.T('construct')); B.log.unshift({id:c.id,at:Date.now(),input,v:res.kind==='variant'?res.tpl.id:''}); B.log=B.log.slice(0,30);
      Economy.bump('pull',1); Core.mark('prog'); try{ await Core.flush(); }catch(e){ Challenge.render(); return; }
      Challenge.render(); playGacha([got]);
      if(res.kind==='variant'&&Core.imgReady()&&!Characters.imgSrc(c)) setTimeout(()=>CoreCtl.runPrep(['char'],it=>it.c&&it.c.id===c.id),1500);
    } finally{ CONJOB=false; }
  }

  static contractHTML0(){
    const s=P().settings, bs=G.banners.filter(Acquire.bnOpen), bn=Acquire.curBanner();
    if(!bn) return pageHead(System.T('gacha'),'RECRUIT')+`<div class="panel"><p>열린 배너가 없어요.</p><button class="btn" data-act="bnew">배너 만들기</button></div>`;
    const pity=Acquire.pityGet(bn), left=s.pity-pity, pool=Characters.bannerPool(bn);
    const ups=(bn.pickup||[]).map(charById).filter(Boolean), show=(ups.length?ups:pool.filter(c=>c.rarity===3)).slice(0,4);
    const hero=show[0], hill=hero&&P().lobbyMode!=='stand'&&Characters.charIllust(hero);
    const rOf=r=>r===3?s.ssr:r===2?s.sr:Math.max(0,100-s.ssr-s.sr);
    const BIG={std:'STAN<br>DARD',pickup:'PICK<span>✦</span>UP',pool:'SQUAD<br>UP',event:'EVENT<br>LIMITED'};
    const KR={std:'상시 모집',pickup:'신규 '+System.T('crew')+' 등장!',pool:'소속 모집',event:'기간 한정!'};
    const rows=[3,2,1].map(r=>{const n=pool.filter(c=>c.rarity===r).length;return `<tr><td><span class="badge r${r}c">${RL[r]}</span> ${n}명</td><td style="text-align:right">${rOf(r)}%</td></tr>`;}).join('');
    return `<div class="bsel" style="margin-top:6px">${bs.map(x=>`<button class="${x.id===bn.id?'on':''}" data-act="bsel" data-id="${x.id}">${esc(x.name)}${x.until&&x.until>Date.now()?` <small class="b-dd">D-${Math.max(0,Math.ceil((x.until-Date.now())/864e5))}</small>`:''}</button>`).join('')}<button data-act="newpu" title="신규 픽업 만들기">✦ 신규</button><button data-act="puexist" title="기존 ${esc(System.T('crew'))} 픽업">★ 픽업</button><button data-act="bnew" title="배너 직접 만들기">＋</button></div>
  ${(bn.storyFail||(bn.type==='pickup'&&(bn.newAt||bn.pin)))&&!bn.eventId&&!PUBUSY.has(bn.id)&&(bn.pickup||[])[0]&&SAMPLE?`<div class="panel" style="margin:6px 0;display:flex;gap:8px;align-items:center;justify-content:space-between"><span class="muted" style="font-size:.85rem">${bn.storyFail?'이 배너의 픽업 스토리를 만들다 멈췄어요.':'이 배너에는 아직 픽업 스토리가 없어요.'}</span><button class="btn sm" data-act="pustoryretry" data-id="${esc(bn.pickup[0])}" data-b="${esc(bn.id)}">${bn.storyFail?'이어서 만들기':'픽업 스토리 만들기'}</button></div>`:''}
  <section class="pk-hero ${esc(bn.type||'')} ${window.__BSLIDE||''}" data-swipe="banner">${bs.length>1?`<button class="pk-nav l" data-act="bswipe" data-d="-1" aria-label="이전 배너">‹</button><button class="pk-nav r" data-act="bswipe" data-d="1" aria-label="다음 배너">›</button><div class="pk-dots">${bs.map(x=>`<i class="${x.id===bn.id?'on':''}"></i>`).join('')}</div>`:''}
    <div class="pk-bg" style="${bn.bg?ArtView.bgStyle(bn.bg):ArtView.bgStyle(P().gachaBg||'낙성 분화구')}"></div>
    ${hero&&(hill||Characters.imgSrc(hero))?`<div class="pk-ghost">${hill?`<img src="${esc(hill)}" alt="">`:CoreView.art(hero)}</div>`:''}
    <div class="pk-diag"></div>
    <div class="pk-art ${hill?'ill':''}">${hill?`<img src="${esc(hill)}" alt="${esc(hero.name)}" draggable="false">`:hero?CoreView.art(hero):''}</div>
    ${show.length>1?`<div class="pk-subs">${show.slice(1).map(c=>`<button class="s" data-act="char" data-id="${c.id}" aria-label="${esc(c.name)}">${CoreView.art(c)}</button>`).join('')}</div>`:''}
    <div class="pk-title">
      <div class="pk-logo">${esc(G.meta.title)}<small>${esc(G.meta.sub)}</small></div>
      <h1 class="pk-big">${BIG[bn.type]||'PICK<span>✦</span>UP'}</h1>
      <div class="pk-rec">RECRUITMENT</div>
      <div class="pk-kr">${esc(bn.name||KR[bn.type]||'')}</div>
      ${bn.desc?`<p>${esc(bn.desc)}</p>`:''}
    </div>
    ${hero?`<button class="pk-name" data-act="char" data-id="${hero.id}"><span class="cs-rar r${hero.rarity}">${RL[hero.rarity]}</span><b>${esc(hero.name)}</b><i>${esc((hero.faction||ROLE_EN[hero.role]||'').toUpperCase())}</i></button>`:''}
  </section>
  <div class="panel pk-pity"><div style="display:flex;justify-content:space-between"><span>SSR 확정까지</span><b>${left}회</b></div><div class="bar" style="margin-top:6px"><i style="width:${pity/s.pity*100}%"></i></div>
    ${pity>=Math.floor(s.pity*0.75)?`<p class="soft">🔥 확률 상승 중 · 지금 SSR ${Acquire.softRate(s,pity+1).toFixed(1)}%</p>`:`<p class="muted" style="margin:6px 0 0;font-size:.75rem">${Math.floor(s.pity*0.75)}회부터 SSR 확률이 점점 올라가요</p>`}
    ${ups.length&&Acquire.guarGet(bn)?`<p class="soft gold">★ 다음 SSR은 확률 업 ${esc(System.T('crew'))} 확정</p>`:''}${Acquire.pityKey(bn)==='pickup'?`<p class="muted" style="margin:4px 0 0;font-size:.72rem">천장·확정은 다음 픽업 배너로 이어져요</p>`:''}
    <div class="sparkrow"><span>모집 포인트</span><div class="bar"><i style="width:${Math.min(100,((P().spark||{})[bn.id]||0)/SPARK*100)}%"></i></div><b>${(P().spark||{})[bn.id]||0}/${SPARK}</b><button class="btn sm ${((P().spark||{})[bn.id]||0)>=SPARK?'':'ghost'}" data-act="sparkopen" data-id="${bn.id}">교환</button></div>${P().firstTen?'<p class="muted" style="margin:8px 0 0">첫 10회는 SSR 1명 확정</p>':''}${ups.length?`<p class="muted" style="margin:8px 0 0">확률 업: ${ups.map(c=>esc(c.name)).join(', ')} · 같은 등급이 나오면 ${bn.rate}% 확률</p>`:''}</div>
  <div class="pullrow"><button class="btn ghost" data-act="pull" data-n="1">1회<small>◆ ${COST}</small></button><button class="btn" data-act="pull" data-n="10">10회<small>◆ ${nf(COST*10)}${pool.some(c=>c.rarity>=2)?' · SR 이상 1명 보장':''}</small></button></div>
  <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="go" data-to="cash">◆ ${esc(System.T('currency'))} 충전</button></div>

  <div class="panel"><h3>확률 정보</h3><table style="width:100%;font-size:.9rem">${rows}</table>
    <p class="muted" style="margin:8px 0 0;font-size:.78rem">· ${Math.floor(s.pity*0.75)}회부터 SSR 확률이 조금씩 올라가고 ${s.pity}회째에 확정이에요.${ups.length?`<br>· SSR이 확률 업 ${esc(System.T('crew'))}이(가) 아니었으면 다음 SSR은 확률 업 확정이에요.`:''}<br>· 1회마다 모집 포인트 1, ${SPARK}포인트로 원하는 ${esc(System.T('crew'))} 교환.</p>
    <div class="row" style="margin-top:10px"><button class="btn sm ghost" data-act="bedit" data-id="${bn.id}">배너 편집</button><button class="btn sm ghost" data-act="ghist">${esc(System.T('gacha'))} 기록</button></div></div>`;
  }

  static openSpark(bid){
    const b=G.banners.find(bn=>bn.id===bid)||Acquire.curBanner(); if(!b) return; const p=P(), pts=(p.spark||{})[b.id]||0;
    const ups=(b.pickup||[]).map(charById).filter(c=>c&&Acquire.castOk(c)), list=ups.length?ups:Characters.bannerPool(b).filter(c=>c.rarity===3&&Acquire.castOk(c)); // 모집 포인트 교환도 잠긴 캐릭터는 빼요
    CoreView.openModal(`${head('모집 포인트 교환',`<span class="muted">${esc(b.name)} · ${pts}/${SPARK}</span>`)}
    <p class="muted" style="margin:0 0 10px">이 배너에서 1회 뽑을 때마다 1포인트가 쌓여요. ${SPARK}포인트로 원하는 ${esc(System.T('crew'))}을(를) 바로 데려올 수 있어요. 이미 있으면 ${esc(System.T('limit'))} +1이 돼요.</p>
    <div class="spk">${list.map(c=>`<button class="spk-c r${c.rarity}" data-act="sparkgo" data-id="${c.id}" data-b="${b.id}" ${pts>=SPARK?'':'disabled'}><div class="sa">${CoreView.art(c)}</div><b>${esc(c.name)}</b><span>${Characters.own(c.id)?System.T('limit')+' '+Characters.own(c.id).dup+'/5':'미보유'}</span></button>`).join('')||'<p class="muted">교환할 수 있는 '+esc(System.T('crew'))+'이(가) 없어요.</p>'}</div>`);
  }

  static openHistory(){
    const h=(P().hist2||[]); const cnt=[3,2,1].map(r=>h.filter(x=>(charById(x.id)||{}).rarity===r).length);
    CoreView.openModal(`${head(System.T('gacha')+' 기록',`<span class="muted">최근 ${h.length}회 · SSR ${cnt[0]} · SR ${cnt[1]} · R ${cnt[2]}</span>`)}
    <div class="ghist">${h.map(x=>{const c=charById(x.id); if(!c) return ''; const d=new Date(x.at); return `<div class="gh r${c.rarity}"><span class="badge r${c.rarity}c">${RL[c.rarity]}</span><b>${esc(c.name)}${x.n?'<em>NEW</em>':''}</b><span class="muted">${esc(x.b||'')}</span><small>${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}</small></div>`;}).join('')||'<p class="muted">아직 기록이 없어요.</p>'}</div>`);
  }

    /* 가챠 연출 건너뛰기(View): 봉인·줄기 연출을 끝내고 카드를 모두 엶 */
static gachaSkipShow(t){ $('#gcSeal').classList.add('go'); $('#gcStreak').style.opacity=0; $('#gcStage').hidden=false; t.hidden=true; document.querySelectorAll('.pc').forEach((c,i)=>{c.classList.add('open');GC.open.add(i);}); }

  static conResBar(){ const r=Core.progRead('cres'); return `<div class="row" style="gap:6px;flex-wrap:wrap">${CON_RES.map(k=>`<span class="chip">${conResIcon(k)} ${esc(System.T(k))} <b>${nf(r[k])}</b></span>`).join('')}<span class="chip">${conGem()} <b>${nf(P().gems)}</b></span></div>`; }

  static conVariantChoices(input){ return Characters.VARIANTS().filter(t=>t.on!==false&&GGMConstruct.matches(t.recipe,input)).map(tpl=>({tpl,bases:Characters.conTargets(tpl).filter(b=>{ const v=Acquire.conVariantOf(b,tpl); return !(v&&Characters.own(v.id)); })})); }

  static conReadInput(){ const B=Core.progRead('cbuild'), d=B.input||Acquire.conDefaultInput(); return CON_RES.map((k,i)=>{ const el=$('#con_'+i); return el?+el.value:d[i]; }); }

    /* 바리에이션 설계 중 창 내용(View) */
static conDecodeHTML(res){ return `<div class="decode"><div class="dc-ring"></div><div class="dc-ring b"></div><b>${esc(res.base.name)}의 「${esc(res.tpl.name)}」 설계 중…</b><span>새로운 모습을 디자인하고 있어요</span></div>`; }

  static conInfoHTML(input){
    const cfg=Acquire.CON(), t=GGMConstruct.table(input,cfg,Acquire.conPool()), i=t.info, B=Core.progRead('cbuild'), vs=AcquireView.conVariantChoices(i.input).filter(v=>v.bases.length), pct=v=>(Math.round(v*10)/10)+'%', sg=t.rows.length?null:GGMConstruct.suggest(input,cfg,Acquire.conPool());
    return `<p style="margin:0 0 6px">총 <b>${nf(i.total)}</b> · 희귀도 캡: SR ${i.open[2]?`<b>개방 ${pct(i.rarity[2])}</b>`:`잠김 <span class="muted">(총 ${nf(cfg.sr.open)}↑)</span>`} · SSR ${i.open[3]?`<b>개방 ${pct(i.rarity[3])}</b>`:`잠김 <span class="muted">(총 ${nf(cfg.ssr.open)}↑)</span>`}</p>
    <div style="font-size:.85rem;margin:0 0 6px">${i.groups.map(g=>`<div style="display:flex;justify-content:space-between;gap:8px;${g.open?'':'opacity:.55'}"><span>${g.open?'🔓':'🔒'} <b>${esc(g.name)}</b> <span class="muted">${esc(Acquire.conNeedText(g.need))}</span></span><b>${g.open?pct(g.p):'—'}</b></div>`).join('')}</div>
    ${sg&&sg.changed?`<p style="margin:4px 0 6px;color:#ffb347">⚠ ${esc(Acquire.conEmptyWhy(sg.why))}. <button class="btn sm" data-act="conpreset" data-v="${esc(sg.input.join(','))}">나올 수 있게 맞추기 (${esc(sg.input.join(' / '))})</button></p>`:''}
    ${t.rows.length?`<details><summary class="muted" style="font-size:.82rem">이번 투입의 확률 테이블 (${t.rows.length}명)</summary><div style="font-size:.8rem;columns:2;margin-top:4px">${t.rows.map(r=>{ const c=charById(r.id); return c?`<div>${RL[c.rarity]} ${esc(c.name)} <b>${pct(r.p)}</b></div>`:''; }).join('')}</div></details>`:`<p class="muted" style="margin:0">열린 분류에 나올 ${esc(System.T('crew'))}이(가) 없어요. 다른 분류를 열어 보세요.</p>`}
    ${i.recipes.length?`<p style="margin:6px 0 0">특수 레시피: ${i.recipes.map(x=>B.found[x.id]?`<b>${esc(x.name)}</b>`:'<b>??? (미발견)</b>').join(', ')}</p>`:''}
    ${vs.length?`<p style="margin:4px 0 0">✦ 바리에이션 기회: ${vs.map(v=>`${esc(v.tpl.name)} ${pct(+v.tpl.chance||0)} (${v.bases.length}명)`).join(', ')}</p>`:''}`; }

  static conEntryHTML(){ if(!Acquire.conOn()) return ''; return `<div class="panel" style="margin-bottom:10px;display:flex;gap:10px;align-items:center;justify-content:space-between"><div><b>${esc(System.T('construct'))}</b><div class="muted" style="font-size:.8rem">${CON_RES.map(k=>esc(System.T(k))).join('·')}을(를) 넣어 ${esc(System.T('crew'))}·바리에이션 영입</div></div><button class="btn sm" data-act="go" data-to="construct">열기</button></div>`; }

  static constructHTML(){
    if(!Acquire.conOn()) return pageHead(System.T('construct'),'CONSTRUCT','contract')+`<div class="panel"><p>설정 → 게임에서 ${esc(System.T('construct'))}을(를) 켜 주세요.</p></div>`;
    const cfg=Acquire.CON(), B=Core.progRead('cbuild'), input=GGMConstruct.normalize(B.input||Acquire.conDefaultInput(),cfg), found=(cfg.recipes||[]).filter(x=>B.found[x.id]), vfound=Characters.VARIANTS().filter(t=>B.found['v:'+t.id]);
    const presets=[['최소',[cfg.min,cfg.min,cfg.min,cfg.min]],['균형',[300,300,300,300]],['고급',[999,999,999,999]],...cfg.groups.filter(g=>B.found['g:'+g.id]).map(g=>[g.name+' 개방',(g.min||[]).map((v,i)=>Math.max(v,cfg.min))]),...found.map(x=>[x.name,x.min]),...vfound.map(t=>['✦'+t.name,t.recipe.min])];
    return `${pageHead(System.T('construct'),'CONSTRUCT','contract')}${AcquireView.conResBar()}
  <div class="panel" style="margin-top:10px"><h3>자원 투입 <span class="muted" style="font-size:.8rem">(${cfg.min}~${cfg.max})</span></h3>
    ${CON_RES.map((k,i)=>`<label class="f" for="con_${i}">${conResIcon(k)} ${esc(System.T(k))}</label><div class="row" style="gap:8px;align-items:center"><input type="range" id="con_r${i}" data-con="${i}" min="${cfg.min}" max="${cfg.max}" step="${cfg.step}" value="${input[i]}" style="flex:1"><input class="in" type="number" id="con_${i}" data-con="${i}" min="${cfg.min}" max="${cfg.max}" value="${input[i]}" style="width:90px"></div>`).join('')}
    <div class="row" style="margin-top:8px;flex-wrap:wrap">${presets.map(([n,v])=>`<button class="btn sm ghost" data-act="conpreset" data-v="${esc(v.join(','))}">${esc(n)}</button>`).join('')}</div>
    <div id="conInfo" class="panel" style="margin-top:10px">${AcquireView.conInfoHTML(input)}</div>
    <div class="row" style="margin-top:10px"><button class="btn" data-act="conbuild">${esc(System.T('construct'))} 시작</button></div></div>
  <div class="panel"><h3>자원 보급 <span class="muted" style="font-size:.8rem">${conGem()}${nf(cfg.buy.gems)} → +${nf(cfg.buy.amt)}</span></h3><div class="row" style="flex-wrap:wrap">${CON_RES.map(k=>`<button class="btn sm ghost" data-act="conbuy" data-k="${k}">${conResIcon(k)} ${esc(System.T(k))} +${nf(cfg.buy.amt)}</button>`).join('')}</div><p class="muted" style="margin:8px 0 0;font-size:.8rem">${esc(System.T('dispatch'))}을(를) 보내면 건조 자원을 모아 와요.</p></div>
  <div class="panel"><h3>레시피 노트</h3>${found.length||vfound.length?`<ul style="margin:0;padding-left:18px">${found.map(x=>`<li><b>${esc(x.name)}</b> — ${x.min.join(' / ')} 이상</li>`).join('')}${vfound.map(t=>`<li>✦ <b>${esc(t.name)}</b> — ${t.recipe.min.join(' / ')} 이상 · ${esc(t.prompt)}</li>`).join('')}</ul>`:`<p class="muted" style="margin:0">아직 발견한 레시피가 없어요. 자원 비율을 바꿔 보세요.${(cfg.recipes||[]).length?' 힌트: '+cfg.recipes.map(x=>esc(x.hint||'')).filter(Boolean).join(' / '):''}</p>`}</div>
  <div class="panel"><h3>최근 기록</h3>${B.log.length?B.log.slice(0,10).map(l=>{ const c=charById(l.id); return c?`<div class="muted" style="font-size:.85rem">${esc(new Date(l.at).toLocaleString())} · ${l.input.join('/')} → <b>${esc(c.name)}</b> ${RL[c.rarity]}${l.v?' ✦':''}</div>`:''; }).join(''):'<p class="muted" style="margin:0">아직 없어요.</p>'}</div>`; }

    /* 설정: 게임 탭의 패널 + 상세 설정 창 */
static conSettingsPanel(){ const on=Acquire.conOn(), V=Characters.VARIANTS();
    return `<div class="panel pm-hide"><h3>${esc(System.T('construct'))} (자원 투입식) ${on?'<span class="badge">켜짐</span>':''}</h3><p class="muted" style="margin:0 0 10px">${CON_RES.map(k=>esc(System.T(k))).join('·')} 4종을 넣어 ${esc(System.T('crew'))}을(를) 영입해요. 투입량으로 등급이 열리고, 비율로 역할 확률이 기울고, 레시피로 ${esc(System.T('gacha'))}에서 얻은 ${esc(System.T('crew'))}의 바리에이션(${V.filter(t=>t.on!==false).map(t=>esc(t.name)).join('·')||'없음'})이 열려요. 자원은 ${esc(System.T('currency'))}으로 사거나 ${esc(System.T('dispatch'))}으로 모아요.</p>
    <div class="row"><button class="btn sm" data-act="contoggle">${on?'끄기':'켜기'}</button><button class="btn sm ghost" data-act="conset">상세 설정 · 바리에이션</button>${on?'<button class="btn sm ghost" data-act="go" data-to="construct">열기</button>':''}</div></div>`; }

  static conVariantRow(t,i){ const c=t.cond||{}, st=(c.stats||[])[0]||{}, n=Characters.conTargets(t);
    return `<details class="panel" data-vi="${i}" style="margin:8px 0"><summary><b>${esc(t.name)}</b> <span class="muted">· ${t.on===false?'꺼짐':'켜짐'} · ${+t.chance||0}% · 적용 ${n.length}명</span></summary>
  <label style="display:flex;gap:8px;margin:8px 0"><input type="checkbox" data-vf="on" ${t.on!==false?'checked':''}> 사용</label>
  <div class="g2"><div><label class="f">이름(기본형)</label><input class="in" data-vf="name" value="${esc(t.name)}"></div><div><label class="f">확률 % (레시피가 맞고 대상이 있을 때)</label><input class="in" type="number" data-vf="chance" min="0" max="100" value="${+t.chance||0}"></div></div>
  <label class="f">의상 기본형 태그 (NovelAI 영어 태그)</label><input class="in" data-vf="prompt" value="${esc(t.prompt||'')}">
  <label class="f">디자인 추가 지시 (AI용, 선택)</label><input class="in" data-vf="brief" value="${esc(t.brief||'')}">
  <label class="f">레시피: 최소 투입 (${CON_RES.map(k=>esc(System.T(k))).join(' / ')})</label><input class="in" data-vf="recipe" value="${esc((t.recipe&&t.recipe.min||[]).join(','))}">
  <label class="f">등급</label><select class="in" data-vf="rarity">${[['same','원래 캐릭터와 같게'],['1','R'],['2','SR'],['3','SSR']].map(([v,l])=>`<option value="${v}" ${String(t.rarity||'same')===v?'selected':''}>${l}</option>`).join('')}</select>
  <h4 style="margin:10px 0 4px">적용 조건 <span class="muted" style="font-size:.8rem">(비우면 조건 없음 · 보유한 ${esc(System.T('crew'))} 중 맞는 캐릭터에 자동 적용)</span></h4>
  <div class="g2"><div><label class="f">소속(쉼표)</label><input class="in" data-vf="factions" value="${esc((c.factions||[]).join(','))}" placeholder="${esc(World.factions().map(f=>f.name).join(','))}"></div>
  <div><label class="f">역할</label><div class="row">${Object.keys(ROLE).map(r=>`<label style="display:flex;gap:4px"><input type="checkbox" data-vrole="${r}" ${(c.roles||[]).includes(r)?'checked':''}>${esc(ROLE[r])}</label>`).join('')}</div></div>
  <div><label class="f">속성(쉼표)</label><input class="in" data-vf="elems" value="${esc((c.elems||[]).join(','))}" placeholder="${esc(ELEMS.join(','))}"></div>
  <div><label class="f">능력치</label><div class="row"><select class="in" data-vf="stk"><option value="">없음</option>${CON_STATS.map(([k,l])=>`<option value="${k}" ${st.k===k?'selected':''}>${l}</option>`).join('')}</select><select class="in" data-vf="stop">${['>=','<=','>','<'].map(o=>`<option ${st.op===o?'selected':''}>${o}</option>`).join('')}</select><input class="in" type="number" data-vf="stv" value="${st.v!=null?+st.v:''}" style="width:80px"></div></div>
  <div><label class="f">최소 레벨 · ${esc(System.T('limit'))} · 호감도</label><div class="row"><input class="in" type="number" data-vf="lv" value="${c.lv||''}" placeholder="Lv"><input class="in" type="number" data-vf="dup" value="${c.dup||''}" placeholder="${esc(System.T('limit'))}"><input class="in" type="number" data-vf="aff" value="${c.aff||''}" placeholder="호감도"></div></div>
  <div><label class="f">업적: 클리어한 스테이지 id(쉼표)</label><input class="in" data-vf="cleared" value="${esc((c.cleared||[]).join(','))}" placeholder="s11,s12"></div></div>
  <p class="muted" style="margin:8px 0 0;font-size:.8rem">지금 적용 대상: ${n.map(b=>esc(b.name)).join(', ')||'없음'}${n[0]?`<br>예시 이미지 프롬프트(${esc(n[0].name)}): <code style="overflow-wrap:anywhere">${esc(GGMConstruct.variantPrompt(n[0],t))}</code>`:''}</p>
  <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="convdel" data-i="${i}">이 바리에이션 삭제</button></div></details>`; }

  static openConSet(){ CONV=clone(Characters.VARIANTS()); const m=Acquire.conMeta(), cfg=Acquire.CON(), adv={min:cfg.min,max:cfg.max,step:cfg.step,start:cfg.start,sr:cfg.sr,ssr:cfg.ssr,groups:cfg.groups,recipes:cfg.recipes};
    CoreView.openModal(`${head(System.T('construct')+' 설정')}
    <label style="display:flex;gap:8px"><input type="checkbox" id="con_on" ${m.on?'checked':''}> <b>${esc(System.T('construct'))} 사용</b></label>
    <p class="muted" style="font-size:.8rem;margin:4px 0 10px">자원 이름과 메뉴 이름은 게임 정의 편집 → 용어에서 바꿔요. 켜면 ${esc(System.T('gacha'))}에서 바리에이션이 빠지고 ${esc(System.T('construct'))}으로만 열려요.</p>
    <div class="g2"><div><label class="f" for="con_bg">구매 가격 (${esc(System.T('currency'))})</label><input class="in" type="number" id="con_bg" min="1" value="${cfg.buy.gems}"></div><div><label class="f" for="con_ba">구매량</label><input class="in" type="number" id="con_ba" min="1" value="${cfg.buy.amt}"></div></div>
    <h3 class="sec" style="margin-top:14px">바리에이션 (공통 설정)</h3><p class="muted" style="font-size:.8rem;margin:0">기본형을 정하고 적용 조건을 걸면, 조건에 맞는 캐릭터마다 그 캐릭터의 특징·상징 컬러·상징 아이템(무기)을 반영해 디자인돼요.</p>
    <div id="con_vars">${CONV.map(AcquireView.conVariantRow).join('')}</div><button class="btn sm ghost" data-act="convadd">+ 바리에이션 추가</button>
    <details style="margin-top:12px"><summary>고급 설정 (확률 테이블 JSON)</summary><p class="muted" style="font-size:.8rem">sr/ssr.open: 희귀도 캡이 열리는 총 투입량 · base/grow: 확률(%) · groups: 분류 [{id,name,match:{role|faction|elem},min:[4],max:[4],total,share:{자원번호:[최소비율,최대비율]},weight:{base,res:[4]},maxRarity}] · recipes: 특수 레시피 [{id,name,min:[4],effect:{type:role|faction|char,value,up}}]</p><textarea class="in" id="con_adv" rows="10" style="font-family:monospace;font-size:.78rem">${esc(JSON.stringify(adv,null,1))}</textarea></details>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="consave">저장</button><button class="btn ghost" data-act="close">취소</button></div>`); }

  static conReadVariants(){ return [...document.querySelectorAll('#con_vars [data-vi]')].map(d=>{ const f=k=>d.querySelector(`[data-vf="${k}"]`), v=k=>String(f(k)?.value||'').trim(), list=k=>v(k).split(',').map(s=>s.trim()).filter(Boolean), old=(CONV||[])[+d.dataset.vi]||{};
    const nums=v('recipe').split(',').map(x=>Math.max(0,+x||0)); while(nums.length<4) nums.push(0);
    const cond={factions:list('factions'),roles:[...d.querySelectorAll('[data-vrole]:checked')].map(x=>x.dataset.vrole),elems:list('elems'),stats:v('stk')?[{k:v('stk'),op:v('stop')||'>=',v:+v('stv')||0}]:[],lv:+v('lv')||0,dup:+v('dup')||0,aff:+v('aff')||0,cleared:list('cleared')};
    return {id:old.id||'v_'+uid(),name:v('name')||'바리에이션',prompt:v('prompt'),brief:v('brief'),chance:Math.min(100,Math.max(0,+v('chance')||0)),recipe:{min:nums.slice(0,4)},rarity:v('rarity')||'same',on:!!f('on')?.checked,cond}; }); }

  static openA2HS(first){ if(first) appStorage.setItem('ggm-a2hs','1');
    CoreView.openModal(CoreView.a2hsHTML()); }

  static async shareText(title,text){
    try{ if(CAP&&CAP.Share){ await CAP.Share.share({title,text,dialogTitle:title}); return; } if(navigator.share){ await navigator.share({title,text}); return; } }catch(e){ if(e&&e.name==='AbortError') return; }
    try{ await navigator.clipboard.writeText(text); CoreView.toast('복사했어요. 카톡 등에 붙여 넣으세요'); }catch(e){ CoreView.openModal(`${head(title)}<textarea class="in" style="min-height:240px">${esc(text)}</textarea><p class="muted">길게 눌러 복사하세요.</p>`); }
  }

  static fbStarsShow(){ document.querySelectorAll('#fbStars .chip').forEach(b=>CoreView.chipOn(b,+b.dataset.n===FB_STAR)); }

  static openFeedback(){
    FB_STAR=0;
    CoreView.openModal(`${head('피드백 보내기')}
    <p class="muted" style="margin:0 0 8px">써서 보내기를 누르면 카톡 같은 앱으로 보낼 수 있어요. 버전과 기기 정보가 자동으로 붙어요(키나 개인 정보는 안 붙어요).</p>
    <label class="f">전체 점수</label><div class="chips" id="fbStars">${[1,2,3,4,5].map(n=>`<button class="chip" data-act="fbstar" data-n="${n}">${'★'.repeat(n)}</button>`).join('')}</div>
    <label class="f" for="fb_name">이름 (선택)</label><input class="in" id="fb_name" maxlength="20">
    <label class="f" for="fb_good">재미있던 점</label><textarea class="in" id="fb_good"></textarea>
    <label class="f" for="fb_bad">불편했던 점, 버그 (어느 화면에서 무엇을 했을 때)</label><textarea class="in" id="fb_bad"></textarea>
    <label class="f" for="fb_want">있었으면 하는 것</label><textarea class="in" id="fb_want"></textarea>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="fbsend">복사·공유하기</button><button class="btn ghost" data-act="fbissue">GitHub 이슈로</button>${Core.LV().feedback?'<button class="btn ghost" data-act="fbpost">게시글 열기</button>':''}</div>
    <p class="muted" style="margin:6px 0 0">복사해서 배포 게시글 댓글에 붙여 넣거나, GitHub 계정이 있으면 이슈로 남길 수 있어요.</p>`);
  }

  static openBanner(id){
    const b=BD=id?clone(G.banners.find(bn=>bn.id===id)):{id:'',name:'새 배너',type:'pickup',desc:'',pool:{mode:'all',factions:[],ids:[]},pickup:[],rate:50,active:true,bg:''};
    const facs=[...new Set(G.chars.map(c=>c.faction).filter(Boolean))];
    CoreView.openModal(`${head(id?'배너 편집':'배너 만들기')}
    <label class="f" for="bn_name">이름</label><input class="in" id="bn_name" value="${esc(b.name)}">
    <label class="f" for="bn_desc">설명</label><input class="in" id="bn_desc" value="${esc(b.desc)}">
    <div class="g2"><div><label class="f" for="bn_type">종류</label><select class="in" id="bn_type">${CoreView.opt([['std','상시'],['pickup','확률 업'],['pool','소속 한정'],['event','이벤트']],b.type)}</select></div>
    <div><label class="f" for="bn_bg">배경</label><select class="in" id="bn_bg">${StoryView.bgOptions(b.bg,'기본')}</select></div></div>
    <div class="g2"><div><label class="f" for="bn_mode">등장 대상</label><select class="in" id="bn_mode">${CoreView.opt([['all','전체'],['faction','소속으로 고르기'],['list','직접 고르기']],b.pool.mode)}</select></div>
    <div><label class="f" for="bn_rate">확률 업 비중 (%)</label><input class="in" id="bn_rate" type="number" value="${b.rate}"></div></div>
    ${b.pool.mode==='faction'?`<label class="f">소속</label><div class="chips">${facs.map(f=>`<button class="chip ${b.pool.factions.includes(f)?'on':''}" data-act="bnfac" data-v="${esc(f)}">${esc(f)}</button>`).join('')||'<span class="muted">소속이 정해진 '+System.T('crew')+'이(가) 없어요</span>'}</div>`:''}
    ${b.pool.mode==='list'?`<label class="f">등장 ${System.T('crew')}</label><div class="chips">${G.chars.map(c=>`<button class="chip ${b.pool.ids.includes(c.id)?'on':''}" data-act="bnid" data-v="${c.id}">${esc(c.name)}</button>`).join('')}</div>`:''}
    <label class="f">확률 업 ${System.T('crew')}</label><div class="chips">${G.chars.map(c=>`<button class="chip ${b.pickup.includes(c.id)?'on':''}" data-act="bnup" data-v="${c.id}">${RL[c.rarity]} ${esc(c.name)}</button>`).join('')}</div>
    <label class="f" for="bn_act">상태</label><select class="in" id="bn_act">${CoreView.opt([['1','열림'],['0','닫힘']],b.active!==false?'1':'0')}</select>
    <div class="row" style="margin-top:16px"><button class="btn" data-act="bnsave">저장</button>${id&&id!=='std'?'<button class="btn ghost" data-act="bndel">삭제</button>':''}</div>`);
  }

  static openBannerFrom(b){ const real=G.banners; const bak=BD; BD=b; const orig=G.banners.find(bn=>bn.id===b.id); const saved=JSON.stringify(b);
    // render from draft
    const facs=[...new Set(G.chars.map(c=>c.faction).filter(Boolean))];
    CoreView.openModal(`${head(b.id?'배너 편집':'배너 만들기')}
    <label class="f" for="bn_name">이름</label><input class="in" id="bn_name" value="${esc(b.name)}">
    <label class="f" for="bn_desc">설명</label><input class="in" id="bn_desc" value="${esc(b.desc)}">
    <div class="g2"><div><label class="f" for="bn_type">종류</label><select class="in" id="bn_type">${CoreView.opt([['std','상시'],['pickup','확률 업'],['pool','소속 한정'],['event','이벤트']],b.type)}</select></div>
    <div><label class="f" for="bn_bg">배경</label><select class="in" id="bn_bg">${StoryView.bgOptions(b.bg,'기본')}</select></div></div>
    <div class="g2"><div><label class="f" for="bn_mode">등장 대상</label><select class="in" id="bn_mode">${CoreView.opt([['all','전체'],['faction','소속으로 고르기'],['list','직접 고르기']],b.pool.mode)}</select></div>
    <div><label class="f" for="bn_rate">확률 업 비중 (%)</label><input class="in" id="bn_rate" type="number" value="${b.rate}"></div></div>
    ${b.pool.mode==='faction'?`<label class="f">소속</label><div class="chips">${facs.map(f=>`<button class="chip ${b.pool.factions.includes(f)?'on':''}" data-act="bnfac" data-v="${esc(f)}">${esc(f)}</button>`).join('')}</div>`:''}
    ${b.pool.mode==='list'?`<label class="f">등장 ${System.T('crew')}</label><div class="chips">${G.chars.map(c=>`<button class="chip ${b.pool.ids.includes(c.id)?'on':''}" data-act="bnid" data-v="${c.id}">${esc(c.name)}</button>`).join('')}</div>`:''}
    <label class="f">확률 업 ${System.T('crew')}</label><div class="chips">${G.chars.map(c=>`<button class="chip ${b.pickup.includes(c.id)?'on':''}" data-act="bnup" data-v="${c.id}">${RL[c.rarity]} ${esc(c.name)}</button>`).join('')}</div>
    <label class="f" for="bn_act">상태</label><select class="in" id="bn_act">${CoreView.opt([['1','열림'],['0','닫힘']],b.active!==false?'1':'0')}</select>
    <div class="row" style="margin-top:16px"><button class="btn" data-act="bnsave">저장</button>${b.id&&b.id!=='std'?'<button class="btn ghost" data-act="bndel">삭제</button>':''}</div>`);
  }

    /* 대본 선택지 지우기 · 대화 기록 창(View) */
static vnChoiceClear(){ $('#vnCh').innerHTML=''; }

  static logoPreviewClose(){ CoreView.closeOv(); if($('#modal').innerHTML) $('#modal').hidden=false; }
}

class AcquireCtl {
    /* 모자란 재화·자원을 캐시 상점에서 ₩0으로 보충 — 모자라다고 멈추지 않게(건조·자원 보급). need={키:모자란 양}, why=무엇에 쓰는지. 보충했으면 true(묻는 창에서 취소하면 false) */
static async cashTopUp(need,why){ const give=Object.fromEntries(Object.entries(need||{}).filter(([,v])=>v>0).map(([k,v])=>[k,Math.ceil(v)])); if(!Object.keys(give).length) return true;
    if(!(await appConfirm(`${why||''}${Core.rewardText(give)}이(가) 모자라요. 캐시 상점에서 ₩0으로 보충할까요?`))) return false;
    Economy.giveReward(give); CoreView.buyFx('₩0 보충',Core.rewardText(give)); return true; }
}
