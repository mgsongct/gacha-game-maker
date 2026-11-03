/* ===== 시즌 로테이션 (2주마다 운영 테마가 바뀌어요) ===== */
const SEASONS=[['story','스토리 시즌','메인 스토리 새 장이 열려요','📖'],['event','이벤트 시즌','기간 한정 이벤트와 한정 '+'캐릭터','🎪'],['char','캐릭터 시즌','신규 픽업 캐릭터와 그 캐릭터가 주인공인 픽업 스토리','✨'],['rerun','복각 시즌','지난 이벤트와 픽업이 돌아와요','🔁'],['train','육성 시즌','훈련 보상 2배 · 파견 보상 1.5배','💪']];
// 라이브 운영 주기(일): 설정 → 시즌 운영에서 바꿔요
const LIVE_CYC={season:[7,[[7,'1주'],[14,'2주'],[21,'3주'],[30,'한 달']]],event:[7,[[3,'3일'],[7,'1주'],[14,'2주'],[30,'한 달']]],chapter:[30,[[7,'1주'],[14,'2주'],[30,'한 달'],[60,'두 달']]],talk:[1,[[1,'매일'],[2,'2일'],[3,'3일'],[7,'1주']]],rotate:[14,[[7,'1주'],[14,'2주'],[30,'한 달']]]};
function cycDays(k){ const c=(P().live&&P().live.cyc)||{}, v=+c[k]; return LIVE_CYC[k][1].some(x=>x[0]===v)?v:LIVE_CYC[k][0]; }
function cycLabel(k){ return (LIVE_CYC[k][1].find(x=>x[0]===cycDays(k))||[0,''])[1]; }
function cycKey(k){ const d=cycDays(k); if(d===1) return dayKey(); const day=Math.floor((Date.now()-new Date().getTimezoneOffset()*6e4)/864e5); return k+':'+d+':'+Math.floor(day/d); }
function seasonDays(){ return cycDays('season'); }
function seasonKey(){ return String(Math.floor(Date.now()/(seasonDays()*864e5))); }
function seasonNow(){ const L=P().live, s=L.season; return L.on.season&&s&&Date.now()<(s.until||0)?s:null; }
function seasonIs(t){ const s=seasonNow(); return !!s&&s.type===t; }
function seasonMeta(t){ return SEASONS.find(x=>x[0]===t)||SEASONS[0]; }
function seasonNext(){ const L=P().live, en=SEASONS.filter(x=>L.seasons[x[0]]!==false).map(x=>x[0]); if(!en.length) return null; const cur=L.season&&L.season.type, i=en.indexOf(cur); return en[(i+1)%en.length]; }
async function aiNewPickupChar(con,rr,btn,col,alt){
  if(alt) return aiAltChar(alt,con,rr,btn);
  const COL=col&&col.src?`\n콜라보 ${T('crew')}: 다른 작품 「${col.src}」${col.who?'의 「'+col.who+'」':'의 인상적인 성인 캐릭터 1명'}이(가) 이 세계에 찾아온 콜라보 게스트로 만든다. 이름·외모·성격·말투·능력은 원작에 충실하게 쓰고, 원작에서 미성년자이거나 학생인 캐릭터라면 만들지 말고 대신 그 작품의 성인 캐릭터를 고른다. 학교 배경은 쓰지 않는다. profile에 이 세계에 오게 된 계기(차원 이동·초대·사고 등)를 쓰고, faction은 "콜라보"로 한다. naiPrompt에는 원작 외모 특징을 영어 태그로 자세히 쓴다(성인 체형, mature 등 나이 태그는 넣지 않는다).`:'';
  const r=await aiJSON(`${RULES}\n${ctx()}${COL}\n\n새 픽업 배너의 주인공이 될 신규 ${T('crew')} 1명을 만들어라. 요청: "${con||(COL?'원작 설정 그대로':'지금 세계관과 이야기 흐름에 어울리는 새 얼굴. 기존 인물과 다른 매력')}"${rr&&rr!=='ai'?` 희귀도는 ${rr}.`:''} 기존 ${T('crew')}과 이름·외모·역할이 겹치지 않게 하고, 메인 플롯이나 세력과 연결되는 비밀을 ${T('files')}에 넣는다. 첫 등장(intro) 대사는 픽업 연출에 어울리게 인상적으로.\nJSON 객체만 출력: ${charSchema()}\n${CHAR_STAT_RULE}`,btn);
  if(!r) return null; const c=cleanChar(r); if(rr&&rr!=='ai') c.rarity=+rr; if(!c.name) c.name='이름 없음'; if(col&&col.src){ c.collab=col.src; if(!c.faction) c.faction='콜라보'; } G.chars.push(c); mark('c:'+c.id); return c; }
async function aiAltChar(b,con,rr,btn){ const canon=!!b.__canon; b=charById(b.id)||b;
  const r=await aiJSON(`${RULES}\n${ctx()}\n\n이격(異格) ${T('crew')} 1명을 만들어라. 기존 ${T('crew')} 「${b.name}」의 다른 모습이다. 같은 사람이라서 기억·관계·성격·말투는 그대로다.\n${canon?'이 모습은 정사다: 메인 스토리 속 성장·각성·결단으로 생긴 변화이고, 이후 메인 스토리에서는 이 모습이 이어진다. profile에 어떤 사건으로 이렇게 바뀌었는지 쓴다.':'이 모습은 외전이다: 메인 스토리와 상관없는 단발성 사건(황당한 소동, 휴가, 꿈 같은 일)이고, 이야기가 끝나면 원래대로 돌아간다. 메인 플롯을 바꾸지 않는다.'}\n이번 테마: "${con||'AI가 어울리는 테마(계절 의상, 정장, 각성, 과거의 모습 등)를 하나 고른다'}"\nname은 정확히 "${b.name}(테마를 나타내는 2~5글자)" 형식으로 쓴다. profile에는 이 모습이 된 사연과 이 모습일 때만 보이는 매력을 쓴다. 외모 묘사, 무기, 속성, 역할, 스킬은 테마에 맞게 새로 정해서 원래 모습과 다르게 플레이되도록 한다. ${T('files')}에는 이 모습과 관련된 새 비밀을 넣는다. 첫 등장(intro) 대사는 원래 말투로, 새 모습을 보여 주는 설렘이 느껴지게.\nnaiPrompt는 원래 외모 태그 "${b.naiPrompt||''}"에서 머리색·눈색·머리 모양·체형 같은 신체 특징은 그대로 두고 의상과 소품만 테마에 맞게 바꾼다.\n원래 프로필: ${String(b.profile||'').slice(0,400)}\n원래 말투: ${(b.lines||[]).slice(0,3).join(' / ')}${rr&&rr!=='ai'?`\n희귀도는 ${rr}.`:''}\nJSON 객체만 출력: ${charSchema()}\n${CHAR_STAT_RULE}`,btn);
  if(!r) return null; const c=cleanChar(r); if(rr&&rr!=='ai') c.rarity=+rr;
  if(!c.name||c.name.indexOf(b.name)!==0) c.name=`${b.name}(${String(con||'이격').replace(/[()]/g,'').slice(0,6)})`;
  c.alt=b.id; c.altCanon=canon; c.faction=b.faction||c.faction; if(b.voiceId) c.voiceId=b.voiceId; if(b.naiStyle) c.naiStyle=b.naiStyle; if(b.age&&!c.age) c.age=b.age; if(!c.lines||!c.lines.length) c.lines=(b.lines||[]).slice(0,3);
  G.chars.push(c); mark('c:'+c.id); return c; }
const baseChar=c=>c&&c.alt?charById(c.alt)||c:c;
const altsOf=c=>G.chars.filter(x=>x.alt===c.id);
async function aiPickupStory(c,lim,link){
  const b=addPickupFor(c,lim); if(!SAMPLE) return null;
  const res=await aiEventGen(`신규 ${T('crew')} 「${c.name}」의 픽업 기념 이벤트 스토리. ${c.name}이(가) 주인공으로 처음 등장해 성격·매력·사연을 보여 주고 ${playerName()}와(과) 인연을 맺는다. 프로필: ${String(c.profile||'').slice(0,300)}. 기존 ${T('crew')} 1~2명이 조연으로 나온다. 픽업 배너와 이어지는 이야기라서 마지막 장면은 ${c.name}이(가) 동료가 되고 싶어 하는 여운으로 끝낸다.`,3,false,[c.name],null);
  if(!res) return null; const ev=res.ev, eb=G.banners.find(bn=>bn.id===ev.bannerId);
  if(eb&&eb!==b){ G.banners=G.banners.filter(bn=>bn!==eb); if(P().curBanner===eb.id) P().curBanner=b.id; }
  ev.bannerId=b.id; ev.pickupFor=c.id; if(!link) ev.keepBanner=true; b.eventId=ev.id; b.desc=c.collab?`「${c.collab}」 콜라보! ${c.name} 등장 · 콜라보 스토리 「${ev.title}」`:`신규 ${RL[c.rarity]} ${c.name} 등장! 픽업 스토리 「${ev.title}」`; if(ev.bg&&!b.bg) b.bg=ev.bg;
  mark('prog'); return res; }
async function seasonStart(type,notes){
  const L=P().live, meta=seasonMeta(type), now=Date.now(), d0=new Date(); d0.setHours(5,0,0,0); if(d0.getTime()>now) d0.setDate(d0.getDate()-1); const until=d0.getTime()+seasonDays()*864e5;
  const act=G.events.filter(e=>e.active!==false&&gateOpen(e)), past=G.events.filter(e=>e.active===false);
  const closeEv=()=>{ act.forEach(e=>{ e.active=false; const bn=G.banners.find(x=>x.id===e.bannerId); if(bn&&!e.keepBanner){ bn.active=false; sparkSettle(bn); } }); if(act.length) notes.push(`이벤트 종료: ${act.map(e=>e.title).join(', ')}`); };
  { const closed=[]; G.banners.forEach(bn=>{ if(bnOpen(bn)&&bn.id!=='std'&&(bn.newAt||bn.eventId||bn.seasonal)&&(!bn.until||bn.until<=now||bn.until===((L.season&&L.season.until)||-1))){ bn.active=false; sparkSettle(bn); closed.push(bn.name); } });
    if(closed.length){ notes.push(`지난 시즌 픽업 종료: ${closed.join(', ')}`); const cb=G.banners.find(bn=>bn.id===P().curBanner); if(!cb||cb.active===false) P().curBanner=''; } }
  L.season={type,key:seasonKey(),start:now,until}; notes.push(`${meta[3]} ${meta[1]} 시작! ${meta[2]} (${new Date(until-1).toLocaleDateString('ko-KR')}까지)`);
  if(type==='story'){ closeEv();
    if(!SAMPLE) notes.push('글 AI가 없어서 새 장은 쓰지 못했어요');
    else if(!nextStage()){ liveBar('스토리 시즌: 메인 스토리 다음 장을 쓰는 중…'); const res=await aiChapterGen('메인 플롯을 따라 자연스럽게 이어서. 시즌의 핵심 스토리답게 큰 전개를 넣는다',storyN(5),[],null); if(res){ notes.push(`메인 스토리 「${res.ch.title}」 공개`); bondNote(res.newc,notes); } }
    else notes.push('아직 진행 중인 메인 장이 있어요. 이번 시즌에 마저 즐겨 보세요'); }
  else if(type==='event'){
    if(SAMPLE){ liveBar('이벤트 시즌: 새 이벤트를 만드는 중… 몇 분 걸려요. 그동안 플레이해도 돼요.'); const res=await aiEventGen('',4,true,[],null);
      if(res){ const nb=G.banners.find(bn=>bn.id===res.ev.bannerId); if(nb){ nb.until=until; nb.seasonal=true; } act.forEach(e=>{ if(e!==res.ev){ e.active=false; const bn=G.banners.find(x=>x.id===e.bannerId); if(bn&&!e.keepBanner) bn.active=false; } }); if(act.length) notes.push(`이벤트 종료: ${act.map(e=>e.title).join(', ')}`); notes.push(`새 이벤트 「${res.ev.title}」 개최${res.nc?`, 한정 ${T('crew')} ${res.nc.name} 등장`:''}`); bondNote((res.ncs||[]).slice(1),notes); } }
    else if(past.length){ closeEv(); const ev=rand(past); ev.active=true; P().shopBuy[ev.id]={}; const bn=G.banners.find(x=>x.id===ev.bannerId); if(bn){ bn.active=true; bn.until=until; } notes.push(`글 AI가 없어서 복각 이벤트 「${ev.title}」로 열었어요`); } }
  else if(type==='char'){ closeEv();
    if(SAMPLE){ liveBar('캐릭터 시즌: 신규 캐릭터를 구상하는 중…'); const c=await aiNewPickupChar('','ai',null);
      if(c){ liveBar(`캐릭터 시즌: ${c.name}의 픽업 스토리를 쓰는 중… 몇 분 걸려요.`); const res=await aiPickupStory(c,false,true); notes.push(`신규 ${RL[c.rarity]} ${c.name} 픽업 개시`); if(res) notes.push(`${c.name} 픽업 스토리 「${res.ev.title}」 공개`); setTimeout(()=>artAfterAI(x=>x.o===c||x.c===c,'신규 '+T('crew')+' '+c.name),2500); }
      if(L.on.talk){ liveBar('캐릭터 시즌: 톡을 쓰는 중…'); const n=await dailyTalks(); if(n) notes.push(`${T('talk')} 새 대화 ${n}개`); } }
    else { const r=rotatePickups(); if(r) notes.push(r); } }
  else if(type==='rerun'){
    if(past.length){ closeEv(); const ev=rand(past); ev.active=true; P().shopBuy[ev.id]={}; const bn=G.banners.find(x=>x.id===ev.bannerId); if(bn){ bn.active=true; bn.until=until; } notes.push(`복각 이벤트 「${ev.title}」가 다시 열렸어요`); }
    const lim=G.banners.filter(b=>b.active===false&&(b.pickup||[]).length&&b.type!=='event'); if(lim.length){ const bn=rand(lim); bn.active=true; bn.until=until; notes.push(`복각 픽업: ${bn.name}`); }
    const r=rotatePickups(); if(r) notes.push(r); }
  else if(type==='train'){ closeEv(); notes.push('훈련(경험·크레딧·재료) 보상 2배, 파견 보상 1.5배'); }
  mark('prog'); }
function seasonChip(){ const s=seasonNow(); if(!s) return ''; const m=seasonMeta(s.type), d=Math.max(0,Math.ceil((s.until-Date.now())/864e5)); return `<button class="lb-season s-${esc(s.type)}" data-act="seasoninfo"><i>${m[3]}</i><b>${esc(m[1])}</b><span>D-${d}</span></button>`; }
function openSeasonInfo(){ const L=P().live, s=seasonNow(), nx=seasonNext();
  openModal(`${head('시즌',`<span class="muted">${seasonDays()}일마다 운영 테마가 바뀌어요</span>`)}
    ${s?`<div class="season-now s-${esc(s.type)}"><em>${seasonMeta(s.type)[3]}</em><div><b>지금: ${esc(seasonMeta(s.type)[1])}</b><span>${esc(seasonMeta(s.type)[2])} · ${new Date(s.until-1).toLocaleDateString('ko-KR')}까지</span></div></div>`:'<p class="muted">아직 시즌이 시작되지 않았어요.</p>'}
    ${nx?`<p class="muted" style="margin:10px 0 4px">다음 시즌: <b>${esc(seasonMeta(nx)[1])}</b></p>`:''}
    <h3 class="sec">로테이션에 넣을 시즌</h3><div class="chips">${SEASONS.map(x=>`<button class="chip ${L.seasons[x[0]]!==false?'on':''}" data-act="seasontog" data-k="${x[0]}">${x[3]} ${esc(x[1])}</button>`).join('')}</div>
    <p class="muted" style="font-size:.8rem;margin-top:8px">스토리·이벤트·캐릭터 시즌은 글 AI로 새 콘텐츠를 만들어요. 육성·복각 시즌은 AI 없이도 돌아가요.</p>
    <div class="row" style="margin-top:12px"><button class="btn sm ghost" data-act="seasonskip">지금 다음 시즌으로 넘기기</button><button class="btn sm" data-act="close">닫기</button></div>`); }
let LIVE_RUN=false;
async function liveTick(force){
  if(typeof BACKUP_BUSY!=='undefined'&&BACKUP_BUSY)return;
  if(LIVE_RUN||!P().seenOpening) return;
  const L=P().live, on=subLocked()?{pass:L.on.pass}:L.on, now=new Date(); // 구독 게임: 시즌·확률 업·새 이벤트·의상·장·톡을 스스로 만들지 않아요(패스 월 초기화만)
  const keys={day:cycKey('talk'),week:cycKey('event'),rot:cycKey('rotate'),chap:cycKey('chapter'),month:now.getFullYear()+'-'+(now.getMonth()+1)};
  if(!force&&!L.last.day){ L.last=Object.assign({},keys); mark('prog'); await liveFillRun(on); return; } // 첫 실행: 주기는 지금부터 세고, 빈 콘텐츠 채우기만(0537)
  // 주기를 바꾸거나 새로 생긴 항목은 바로 만들지 않고 지금부터 세요
  Object.keys(keys).forEach(k=>{ if(L.last[k]==null||(k!=='month'&&String(L.last[k]).split(':').slice(0,2).join(':')!==String(keys[k]).split(':').slice(0,2).join(':')&&String(keys[k]).includes(':'))) L.last[k]=keys[k]; });
  if(L.last.skin!=null&&!/^(season|rotate):/.test(String(L.last.skin))) L.last.skin=skinPeriodKey(); // 예전 형식이면 지금부터 세요
  const due=k=>force||L.last[k]!==keys[k], notes=[], fillNotes=[];
  LIVE_RUN=true; liveBar('업데이트 확인 중…');
  try{
    if(on.season&&(force==='season'||!L.season||Date.now()>=(L.season.until||0))){ const nx=seasonNext(); if(nx){ await seasonStart(nx,notes); L.last.rot=keys.rot; L.last.week=keys.week; } }
    if(on.rotate&&due('rot')&&!on.season){ const r=rotatePickups(); if(r) notes.push(r); L.last.rot=keys.rot; }
    // 새 의상은 시즌(시즌을 끄면 확률 업 교체 주기)이 바뀔 때 한 번만. 처음 켤 때는 만들지 않고 지금부터 세요
    if(on.skin&&SAMPLE){ const sk=skinPeriodKey(); if(L.last.skin==null&&force!=='skin') L.last.skin=sk;
      else if(force==='skin'||L.last.skin!==sk){ if(!skinShopList().some(x=>x.k.period===sk)){ liveBar('새 '+T('skin')+'을 만드는 중…'); await skinAuto(notes,sk); } L.last.skin=sk; } }
    if(due('month')&&on.pass&&!force){ P().pass={xp:0,got:[]}; notes.push(`${T('pass')} 새 시즌이 시작됐어요`); }
    if(!on.season&&due('week')&&(on.event||on.rerun)){
      const act=G.events.filter(e=>e.active!==false&&gateOpen(e)), past=G.events.filter(e=>e.active===false);
      const close=()=>act.forEach(e=>{e.active=false;const bn=G.banners.find(x=>x.id===e.bannerId); if(bn&&!e.keepBanner) bn.active=false;});
      let opened=null;
      if(on.rerun&&past.length&&(!on.event||!SAMPLE||Math.random()<0.25)){ const ev=rand(past); close(); ev.active=true; P().shopBuy[ev.id]={}; const bn=G.banners.find(x=>x.id===ev.bannerId); if(bn)bn.active=true; opened=`복각 이벤트 「${ev.title}」가 다시 열렸어요`; }
      else if(on.event&&SAMPLE){ liveBar('새 이벤트를 만드는 중… 몇 분 걸려요. 그동안 플레이해도 돼요.'); const res=await aiEventGen('',3,true,[],null);
        if(res){ act.forEach(e=>{if(e!==res.ev){e.active=false;const b=G.banners.find(x=>x.id===e.bannerId); if(b&&!e.keepBanner) b.active=false;}}); opened=`새 이벤트 「${res.ev.title}」 개최${res.nc?`, 한정 ${T('crew')} ${res.nc.name} 등장`:''}`; bondNote((res.ncs||[]).slice(1),notes); } }
      if(opened){ if(act.length) notes.push(`이벤트 종료: ${act.map(e=>e.title).join(', ')}`); notes.push(opened); }
      L.last.week=keys.week;
    }
    if(!on.season&&due('chap')&&on.chapter&&SAMPLE){
      if(!nextStage()){ liveBar('메인 스토리 다음 장을 쓰는 중…'); const res=await aiChapterGen('메인 플롯을 따라 자연스럽게 이어서',storyN(4),[],null); if(res){ notes.push(`메인 스토리 「${res.ch.title}」 공개`); bondNote(res.newc,notes); } }
      else notes.push('아직 진행 중인 메인 장이 있어서 새 장은 다음 주기로 미뤘어요');
    }
    if(due('chap')) L.last.chap=keys.chap;
    if(due('month')) L.last.month=keys.month;
    if(due('day')){ if(on.talk&&SAMPLE){ liveBar('새 메시지를 쓰는 중…'); const n=await dailyTalks(); if(n) notes.push(`${T('talk')} 새 대화 ${n}개`); } L.last.day=keys.day; } await liveFillStep(on,fillNotes); /* 빈 포크 기능 내용 자동 채움(0537) */
  }catch(e){ console.log(e); }
  finally{ LIVE_RUN=false; liveBar(null); }
  mark('prog'); liveFillNotes(notes,fillNotes);
  const todo=drawTodo().length;
  if(notes.length){ if(todo) notes.push(`NAI로 그릴 이미지가 ${todo}개 쌓였어요. 공지 화면에서 한 번에 그릴 수 있어요`);
    L.notices.unshift({at:Date.now(),title:`${dayKey()} 업데이트`,lines:notes}); sendMail({from:'운영팀',title:`${dayKey()} 업데이트 기념 보급`,body:'새 소식\n· '+notes.join('\n· '),reward:{gems:200,gold:5000},days:14}); L.notices=L.notices.slice(0,30); render(); openNotice(0); checkTriggers(); }
  else if(force) toast('새로 생긴 업데이트가 없어요'); if(tab==='lobby') render();
}
function openNotice(i){
  const n=P().live.notices[i]; if(!n) return;
  openModal(`${head(esc(n.title),'<span class="muted">UPDATE NOTICE</span>')}<ul class="notice">${n.lines.map(l=>`<li>${esc(l)}</li>`).join('')}</ul>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="go" data-to="notice">공지 전체 보기</button></div>`);
}
function lookMap(stages){const m={__reuse:{}};(Array.isArray(stages)?stages:[]).forEach(s2=>(Array.isArray(s2&&s2.enemies)?s2.enemies:[]).forEach(e=>{if(e&&e.name&&e.look)m[String(e.name)]=String(e.look);if(e&&e.name&&e.reuse)m.__reuse[String(e.name)]=String(e.reuse);}));return m;}
function enemyReuseHint(){ const L=[...new Set(G.lib.filter(l=>l.kind==='enemy'&&!l.alias&&!l.charId&&(l.prompt||l.img)).map(l=>l.name))].slice(-40); return L.length?`\n일반 적(보스 아님)은 그림을 아끼려고 재사용한다: 기존 적(${L.join(', ')}) 중에서 그대로 쓰거나, 새 이름을 붙이면 reuse에 모습이 비슷한 기존 적 이름을 넣는다(그림은 같고 이름만 달라진다). look은 보스이거나 정말 새로운 종류일 때만 쓴다.`:''; }
function addCGs(arr){ let n=0; (Array.isArray(arr)?arr:[]).forEach(x=>{ if(!x||!x.name||G.lib.some(l=>l.name===String(x.name))) return;
    const cast=strs(x.cast).map(nm=>isMe(nm.trim())?{id:'__player'}:findSpeaker(nm.trim())).filter(Boolean).slice(0,4), pos=cast.length===1?['center']:cast.length===2?['left','right']:['left','center','right','auto'];
    const l={id:'l'+uid(),kind:'cg',name:String(x.name),prompt:String(x.prompt||''),cast:cast.map((c,i)=>({id:c.id,pos:pos[i]||'auto',act:''})),img:null}; G.lib.push(l); mark('l:'+l.id); n++; }); return n; }
function drawTodo(cats){
  const a=[], on=k=>!cats||cats.includes(k);
  G.chars.forEach(c=>{ if(!c.naiPrompt) return;
    if(on('char')&&c.useStanding!==false&&!c.img) a.push({k:'char',cat:'char',o:c,c,label:c.name+' 스탠딩'});
    if(on('upper')&&c.upper&&!c.upper.img) a.push({k:'upper',cat:'upper',o:c.upper,c,label:c.name+' 상반신'});
    if(cats&&on('pose')&&c.pose&&!c.pose.img) a.push({k:'pose',cat:'pose',o:c.pose,c,label:c.name+' 로비 포즈'});
    if(cats&&on('scg')&&!scgOf(c).img) a.push({k:'scg',cat:'scg',o:c.scg,c,label:c.name+' 기술 컷인'});
    if(cats&&on('pose')&&c.lbbg&&!c.lbbg.img) a.push({k:'lbbg',cat:'pose',o:c.lbbg,c,label:c.name+' 로비 배경'});
    if(on('illust')&&c.illust&&!c.illust.img) a.push({k:'illust',cat:'illust',o:c.illust,c,label:c.name+' 일러스트'});
    if(on('weapon')&&c.weapon&&!c.weapon.img&&c.weapon.prompt) a.push({k:'weapon',cat:'weapon',o:c.weapon,c,label:c.name+' '+T('weapon')}); });
  (G.npcs||[]).forEach(n=>{ if(!n.naiPrompt) return; if(on('char')&&!n.img) a.push({k:'char',cat:'char',o:n,c:n,label:n.name+' (NPC) 스탠딩'}); if(on('upper')&&n.upper&&!n.upper.img) a.push({k:'upper',cat:'upper',o:n.upper,c:n,label:n.name+' (NPC) 상반신'}); });
  if(on('map')) G.chapters.filter(ch=>ch.kind==='main').forEach(ch=>{ if(!chMapLib(ch)) ensureChMap(ch); });
  G.lib.forEach(l=>{ if(['bg','prop','cg','enemy','icon','map'].includes(l.kind)&&on(l.kind)&&(!l.img||l.redraw)&&(l.prompt||(l.kind==='cg'&&cgCast(l).length)||l.kind==='prop'||(l.kind==='bg'&&l.auto)||(l.kind==='enemy'&&!l.alias&&!l.charId))) a.push({k:l.kind,cat:l.kind,o:l,label:({bg:'배경 ',prop:'소품 ',cg:'CG ',enemy:'적 ',icon:'',map:''})[l.kind]+l.name}); });
  return a;
}
const PREP_CATS=()=>[['char','스탠딩',true],['upper','상반신',true],['pose','로비 레이어 (캐릭터별 배경 + 투명 포즈)',false],['illust','일러스트 (로비·픽업)',true],['enemy','적',true],['bg','배경',true],['icon','재화 아이콘',true],['map','작전 지도',true],['prop','소품',true],['weapon',T('weapon'),true],['cg','이벤트 CG',false],['scg','기술 컷인',false]];
let PREPJOB=null;
function prepAsk(){ if(playMode()) return; try{ scanScriptAssets(); }catch(e){} const p=P(); if(p.prepNever||p.prepAsked===today()||PREPJOB||!imgReady()||!$('#modal').hidden||!$('#ov').hidden) return; if(!drawTodo().length) return; p.prepAsked=today(); mark('prog'); openPrep(true); }
function openPrep(ask){
  try{ scanScriptAssets(); }catch(e){} const all=drawTodo(), cnt=k=>all.filter(x=>x.cat===k).length;
  if(!all.length){ if(!ask) toast('미리 그릴 그림이 없어요. 다 준비돼 있어요'); return; }
  const c=naiCfg();
  openModal(`${head(ask?'그림을 미리 준비할까요?':'그림 준비실','<span class="muted">NovelAI로 비어 있는 그림을 차례로 그려요</span>')}
    ${imgReady()?'':`<p style="color:var(--rose)">${imgNeed()}</p>`}
    <p class="muted" style="margin:0 0 8px">게임을 하는 동안 뒤에서 한 장씩 그려서 바로 적용해요. 위쪽 진행 표시에서 언제든 멈출 수 있어요. Opus 구독이면 기본 크기 생성은 Anlas가 들지 않아요.</p>
    <div class="prepcats">${PREP_CATS().map(([k,l,d])=>cnt(k)?`<label class="pc"><input type="checkbox" data-pc="${k}" ${d?'checked':''}><b>${esc(l)}</b><span>${cnt(k)}장</span></label>`:'').join('')}</div>
    <div class="row" style="margin-top:14px"> ${SAMPLE&&G.chars.some(c=>c.weapon&&wpBad(c.weapon.prompt))?`<button class="btn ghost" data-act="wfixall">${T('weapon')} 프롬프트 정리 (${G.chars.filter(c=>c.weapon&&wpBad(c.weapon.prompt)).length})</button>`:''}<button class="btn" data-act="prepgo" ${imgReady()?'':'disabled'}>준비 시작</button><button class="btn ghost" data-act="close">${ask?'나중에':'닫기'}</button>${ask?'<button class="btn ghost" data-act="prepnever">다시 묻지 않기</button>':''}</div>`);
}
function prepChip(){
  let el=$('#prepChip'); const j=PREPJOB;
  if(!j||j.fg){ if(el) el.remove(); return; }
  if(!el){ el=document.createElement('div'); el.id='prepChip'; el.className='prepchip'; document.body.appendChild(el); }
  el.innerHTML=`<span class="pg"><i style="width:${j.total?j.done/j.total*100:0}%"></i></span><b>그림 준비 ${j.done}/${j.total}</b><span class="lb">${esc(j.label||'')}</span><button data-act="prepstop" aria-label="멈추기">${j.stop?'멈추는 중':'■'}</button>`;
}
async function runPrep(cats,filter,opt){
  opt=opt||{};
  if(PREPJOB){ toast('이미 준비 중이에요'); if(opt.done) opt.done(null); return; }
  const list=drawTodo(cats).filter(filter||(()=>true)); if(!list.length){ toast('그릴 그림이 없어요'); if(opt.done) opt.done(null); return; }
  if(opt.order) list.sort((a,b)=>opt.order.indexOf(a.cat)-opt.order.indexOf(b.cat));
  const j={total:list.length,done:0,stop:false,label:'',fg:!!opt.fg}; PREPJOB=j; prepChip();
  for(const it of list){
    if(j.stop) break; j.label=it.label; prepChip(); if(opt.step) opt.step(it,j,'start');
    while(CAST&&CAST.busy) await wait(800);
    try{
      let b; try{ b=await naiDrawItem(it); }catch(e1){ if(e1&&(e1.code==='rate_limited'||/429|concurrent/i.test(String(e1.message||'')))){ await wait(6000); b=await naiDrawItem(it); } else throw e1; }
      if(it.k==='char'&&it.o.npc){ await storeImage(it.o,b,'c:'); mark('meta'); } else if(it.k==='char'){ await storeImage(it.o,b,'c:'); } else if(it.k==='illust'||it.k==='weapon'||it.k==='upper'||it.k==='pose'||it.k==='lbbg'||it.k==='scg'){ await storeImage(it.o,b,''); mark('c:'+it.c.id); } else await storeImage(it.o,b,'l:');
      j.done++; prepChip(); if(opt.step) opt.step(it,j,'done'); if(!$('#modal').hidden||tab==='crew'||tab==='lobby'||tab==='ops'||tab==='shop') { if($('#modal').hidden) render(); }
      await wait(700);
    }catch(e){ toast(naiErr(e,it.label+' 실패')); if(e&&['image_cancelled','image_busy','nai_nokey','bad_key','low_credit','network','nai_locked','comfy_nourl','comfy_nowf'].includes(e.code)){ toast('그림 준비를 멈췄어요. 연결을 확인한 뒤 그림 준비실에서 이어서 그려 주세요'); break; } await wait(1500); }
  }
  PREPJOB=null; prepChip(); render(); toast(`그림 ${j.done}장을 준비했어요`); if(opt.done) opt.done(j);
}
function noticeHTML(){
  const L=P().live; L.seen=Date.now(); mark('prog'); const todo=drawTodo();
  return `${pageHead('공지','NOTICE','lobby')}
  ${L.notices.length?L.notices.map((n,i)=>`<div class="panel"><h3>${esc(n.title)}</h3><ul class="notice">${n.lines.map(l=>`<li>${esc(l)}</li>`).join('')}</ul></div>`).join(''):'<div class="panel"><p class="muted">아직 공지가 없어요. 설정의 라이브 운영을 켜 두면 날짜에 맞춰 새 콘텐츠가 생겨요.</p></div>'}
  <div class="panel"><h3>NAI로 그릴 것 ${todo.length}개</h3><p class="muted" style="margin:0 0 10px">${todo.slice(0,12).map(x=>esc(x.label)).join(', ')}${todo.length>12?' 외':''}</p>${todo.length?'<button class="btn" data-act="prepopen">그림 준비실 열기</button>':''}</div>`;
}



