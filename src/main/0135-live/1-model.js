/* ===== 0135-live — Model(상태·규칙·저장·외부 서비스) ===== */
/* src/main/0135-live/0135-schedule.js에서 옮김 */
function spots(){ return Array.isArray(G.meta.spots)?G.meta.spots:[]; }
function spotsAuto(){ const L=[]; G.lib.filter(l=>l.kind==='bg'&&l.name).slice(0,7).forEach(l=>L.push({id:uid(),name:l.name,desc:'',bg:l.name,tags:[]}));
  if(!L.length) ['광장','카페','훈련장','도서관'].forEach(n=>L.push({id:uid(),name:n,desc:'',bg:'',tags:[n]})); G.meta.spots=L; mark('meta'); return L.length; }
function spotFav(c,s){ const p=c.persona||{}, likes=[...(p.likes||[]),p.hobby||''].join(' '); return !!likes&&[s.name,...(s.tags||[])].some(t=>t&&(likes.includes(t)||t.split(/\s+/).some(w=>w.length>1&&likes.includes(w)))); }
function spotWho(s){ const owned=G.chars.filter(c=>own(c.id)&&!c.alt&&!c.monster), h=hashN(today()+s.id); if(!owned.length) return [];
  const fav=owned.filter(c=>spotFav(c,s)), rest=owned.filter(c=>!fav.includes(c)), out=[]; if(fav.length) out.push(fav[h%fav.length]);
  const pool=[...rest,...fav.filter(c=>!out.includes(c))]; for(let i=0;out.length<2&&pool.length;i++) out.push(pool.splice((h>>(i+2))%pool.length,1)[0]); return out; }
function spotTemplate(c,s){ const p=c.persona||{}, L=(c.lines||[]).filter(Boolean), r=i=>L.length?L[(hashN(s.id+c.id)+i)%L.length]:'…', n=c.name;
  return [`[배경: ${s.bg||s.name}]`,`${s.name}에서 ${n}을(를) 만났다.`,`${n}: ${p.catch||r(0)}`,'선택: 같이 둘러볼래? | 여기서 뭐 하고 있었어?',
    `1) ${n}: ${(p.likes||[])[0]?`좋아. ${p.likes[0]} 얘기라도 하면서 걸을까.`:r(1)}`,`2) ${n}: ${p.hobby?`${p.hobby}… 그런 거. 비밀이야.`:r(2)}`,`${n}: ${r(3)}`].join('\n'); }
async function spotsAI(rep){ const r=await aiJSON(spotsAIPrompt(),rep,'complex');
  const L=(r&&Array.isArray(r.spots)?r.spots:[]).slice(0,8).map(x=>({id:uid(),name:String(x.name||'').trim().slice(0,20),desc:String(x.desc||'').slice(0,120),bg:String(x.bg||'').trim(),tags:(Array.isArray(x.tags)?x.tags:[]).map(String).slice(0,4)})).filter(x=>x.name);
  if(!L.length) return false; const old=spots(); L.forEach(s=>{ const o=old.find(x=>x.name===s.name); if(o) s.id=o.id; }); G.meta.spots=L; mark('meta'); return true; }
async function spotTalkAI(c,rep){ const S=spots(); if(!S.length) return false;
  const r=await aiJSON(spotTalkAIPrompt({c,S}),rep,'complex');
  let n=0; (r&&Array.isArray(r.scenes)?r.scenes:[]).forEach(x=>{ const s=S.find(y=>y.name===String(x.spot||'').trim()), t=nl(x.script); if(s&&t){ c.spotTalk=c.spotTalk||{}; c.spotTalk[s.id]=t; n++; } }); if(n) mark('c:'+c.id); return n>0; }
/* src/main/0135-live/0280-live-ops.js에서 옮김 */
function dayKey(d){d=d||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function weekKey(d){d=d||new Date();const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));const w=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-w);const y=t.getUTCFullYear();return y+'-W'+Math.ceil(((t-Date.UTC(y,0,1))/864e5+1)/7);}
function rotatePickups(){
  const pus=G.banners.filter(bn=>bn.type==='pickup'&&bn.active!==false&&!bn.newAt&&!bn.eventId&&!bn.until&&!bn.pin), L=P().live, ssr=G.chars.filter(c=>c.rarity===3&&!c.limited);
  if(!pus.length||ssr.length<2) return '';
  const names=[], bgs=G.lib.filter(l=>l.kind==='bg');
  pus.forEach(b=>{ let cand=ssr.filter(c=>!L.recentPU.includes(c.id)&&!b.pickup.includes(c.id)); if(!cand.length) cand=ssr.filter(c=>!b.pickup.includes(c.id)); if(!cand.length) return;
    const c=rand(cand); b.pickup=[c.id]; b.name=`${c.name} 확률 업`; b.desc=`SSR ${c.name} 확률 상승`; if(bgs.length) b.bg=rand(bgs).name;
    L.recentPU.unshift(c.id); L.recentPU=L.recentPU.slice(0,Math.max(1,ssr.length-1)); names.push(c.name); });
  return names.length?`확률 업 교체: ${names.join(', ')}`:'';
}
async function dailyTalks(){
  const owned=[...new Set(G.chars.filter(c=>own(c.id)).map(c=>baseChar(c)))]; if(!owned.length) return 0;
  const picks=[...owned].sort(()=>Math.random()-.5).slice(0,Math.random()<0.5?1:2), evs=G.events.filter(ev=>ev.active!==false).map(e=>e.title).join(', ');
  const wd=['일','월','화','수','목','금','토'][new Date().getDay()];
  const r=await aiJSON(dailyTalksPrompt({picks,wd,evs}),null,'default');
  let n=0; (r&&Array.isArray(r.threads)?r.threads:[]).forEach(x=>{const c=findSpeaker(String(x.char||''));if(!c||!x.script)return;const th={id:uid(),charId:c.id,title:String(x.title||'메시지'),trigger:{type:'start'},needOwn:true,script:nl(x.script),daily:true};G.threads.push(th);mark('t:'+th.id);n++;});
  const old=G.threads.filter(t=>t.daily&&P().inbox[t.id]&&P().inbox[t.id].done); if(old.length>40){ old.slice(0,old.length-40).forEach(t=>{G.threads=G.threads.filter(x=>x!==t);mark('t:'+t.id);}); }
  return n;
}
/* src/main/0135-live/0290-season-rotation.js에서 옮김 */
function cycDays(k){ const c=(P().live&&P().live.cyc)||{}, v=+c[k]; return LIVE_CYC[k][1].some(x=>x[0]===v)?v:LIVE_CYC[k][0]; }
function cycLabel(k){ return (LIVE_CYC[k][1].find(x=>x[0]===cycDays(k))||[0,''])[1]; }
function cycKey(k){ const d=cycDays(k); if(d===1) return dayKey(); const day=Math.floor((Date.now()-new Date().getTimezoneOffset()*6e4)/864e5); return k+':'+d+':'+Math.floor(day/d); }
function seasonDays(){ return cycDays('season'); }
function seasonKey(){ return String(Math.floor(Date.now()/(seasonDays()*864e5))); }
function seasonNow(){ const L=P().live, s=L.season; return L.on.season&&s&&Date.now()<(s.until||0)?s:null; }
function seasonIs(t){ const s=seasonNow(); return !!s&&s.type===t; }
function seasonMeta(t){ return SEASONS.find(x=>x[0]===t)||SEASONS[0]; }
function seasonNext(){ const L=P().live, en=SEASONS.filter(x=>L.seasons[x[0]]!==false).map(x=>x[0]); if(!en.length) return null; const cur=L.season&&L.season.type, i=en.indexOf(cur); return en[(i+1)%en.length]; }
async function aiNewPickupChar(con,rr,rep,col,alt){
  if(alt) return aiAltChar(alt,con,rr,rep);
  const COL=aiNewPickupCharCOLText({col});
  const r=await aiJSON(aiNewPickupCharPrompt({COL,con,rr}),rep);
  if(!r) return null; const c=cleanChar(r); if(rr&&rr!=='ai') c.rarity=+rr; if(!c.name) c.name='이름 없음'; if(col&&col.src){ c.collab=col.src; if(!c.faction) c.faction='콜라보'; } G.chars.push(c); mark('c:'+c.id); return c; }
async function aiAltChar(b,con,rr,rep){ const canon=!!b.__canon; b=charById(b.id)||b;
  const r=await aiJSON(aiAltCharPrompt({b,canon,con,rr}),rep);
  if(!r) return null; const c=cleanChar(r); if(rr&&rr!=='ai') c.rarity=+rr;
  if(!c.name||c.name.indexOf(b.name)!==0) c.name=`${b.name}(${String(con||'이격').replace(/[()]/g,'').slice(0,6)})`;
  c.alt=b.id; c.altCanon=canon; c.faction=b.faction||c.faction; if(b.voiceId) c.voiceId=b.voiceId; if(b.naiStyle) c.naiStyle=b.naiStyle; if(b.age&&!c.age) c.age=b.age; if(!c.lines||!c.lines.length) c.lines=(b.lines||[]).slice(0,3);
  G.chars.push(c); mark('c:'+c.id); return c; }
async function aiPickupStory(c,lim,link){
  const b=addPickupFor(c,lim); if(!SAMPLE) return null;
  const res=await aiEventGen(`신규 ${T('crew')} 「${c.name}」의 픽업 기념 이벤트 스토리. ${c.name}이(가) 주인공으로 처음 등장해 성격·매력·사연을 보여 주고 ${playerName()}와(과) 인연을 맺는다. 프로필: ${String(c.profile||'').slice(0,300)}. 기존 ${T('crew')} 1~2명이 조연으로 나온다. 픽업 배너와 이어지는 이야기라서 마지막 장면은 ${c.name}이(가) 동료가 되고 싶어 하는 여운으로 끝낸다.`,3,false,[c.name]);
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
    else if(!nextStage()){ liveBar('스토리 시즌: 메인 스토리 다음 장을 쓰는 중…'); const res=await aiChapterGen('메인 플롯을 따라 자연스럽게 이어서. 시즌의 핵심 스토리답게 큰 전개를 넣는다',storyN(5),[]); if(res){ notes.push(`메인 스토리 「${res.ch.title}」 공개`); bondNote(res.newc,notes); } }
    else notes.push('아직 진행 중인 메인 장이 있어요. 이번 시즌에 마저 즐겨 보세요'); }
  else if(type==='event'){
    if(SAMPLE){ liveBar('이벤트 시즌: 새 이벤트를 만드는 중… 몇 분 걸려요. 그동안 플레이해도 돼요.'); const res=await aiEventGen('',4,true,[]);
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
function lookMap(stages){const m={__reuse:{}};(Array.isArray(stages)?stages:[]).forEach(s2=>(Array.isArray(s2&&s2.enemies)?s2.enemies:[]).forEach(e=>{if(e&&e.name&&e.look)m[String(e.name)]=String(e.look);if(e&&e.name&&e.reuse)m.__reuse[String(e.name)]=String(e.reuse);}));return m;}
function addCGs(arr){ let n=0; (Array.isArray(arr)?arr:[]).forEach(x=>{ if(!x||!x.name||G.lib.some(l=>l.name===String(x.name))) return;
    const cast=strs(x.cast).map(nm=>isMe(nm.trim())?{id:'__player'}:findSpeaker(nm.trim())).filter(Boolean).slice(0,4), pos=cast.length===1?['center']:cast.length===2?['left','right']:['left','center','right','auto'];
    const l={id:'l'+uid(),kind:'cg',name:String(x.name),prompt:String(x.prompt||''),cast:cast.map((c,i)=>({id:c.id,pos:pos[i]||'auto',act:''})),img:null}; G.lib.push(l); mark('l:'+l.id); n++; }); return n; }
function drawTodo(cats){
  const a=[], on=k=>!cats||cats.includes(k);
  G.chars.forEach(c=>{ if(!c.naiPrompt) return;
    if(on('char')&&c.useStanding!==false&&!c.img) a.push({k:'char',cat:'char',o:c,c,label:c.name+' 스탠딩'});
    if(on('upper')&&c.upper&&!c.upper.img) a.push({k:'upper',cat:'upper',o:c.upper,c,label:c.name+' 상반신'});
    if(cats&&on('pose')&&c.pose&&!c.pose.img) a.push({k:'pose',cat:'pose',o:c.pose,c,label:c.name+' 로비 포즈'});
    const sc=scgOf(c); if(cats&&on('scg')&&!sc.img) a.push({k:'scg',cat:'scg',o:sc,c,label:c.name+' 기술 컷인'}); /* 목록은 읽기 — 그릴 때 runPrep이 scgSlot으로 칸을 맞춤 */
    if(cats&&on('pose')&&c.lbbg&&!c.lbbg.img) a.push({k:'lbbg',cat:'pose',o:c.lbbg,c,label:c.name+' 로비 배경'});
    if(on('illust')&&c.illust&&!c.illust.img) a.push({k:'illust',cat:'illust',o:c.illust,c,label:c.name+' 일러스트'});
    if(on('weapon')&&c.weapon&&!c.weapon.img&&c.weapon.prompt) a.push({k:'weapon',cat:'weapon',o:c.weapon,c,label:c.name+' '+T('weapon')}); });
  (G.npcs||[]).forEach(n=>{ if(!n.naiPrompt) return; if(on('char')&&!n.img) a.push({k:'char',cat:'char',o:n,c:n,label:n.name+' (NPC) 스탠딩'}); if(on('upper')&&n.upper&&!n.upper.img) a.push({k:'upper',cat:'upper',o:n.upper,c:n,label:n.name+' (NPC) 상반신'}); });
  if(on('map')) G.chapters.filter(ch=>ch.kind==='main').forEach(ch=>{ if(!chMapLib(ch)){ const o=chMapNew(ch); a.push({k:'map',cat:'map',o,ch,label:o.name}); } }); /* 아직 없는 장 지도는 목록에만 — 그릴 때 runPrep이 ensureChMap으로 넣음 */
  G.lib.forEach(l=>{ if(['bg','prop','cg','enemy','icon','map'].includes(l.kind)&&on(l.kind)&&(!l.img||l.redraw)&&(l.prompt||(l.kind==='cg'&&cgCast(l).length)||l.kind==='prop'||(l.kind==='bg'&&l.auto)||(l.kind==='enemy'&&!l.alias&&!l.charId))) a.push({k:l.kind,cat:l.kind,o:l,label:({bg:'배경 ',prop:'소품 ',cg:'CG ',enemy:'적 ',icon:'',map:''})[l.kind]+l.name}); });
  return a;
}
/* 그릴 할 일의 저장 칸(Model — 쓰기): 목록(drawTodo)은 읽기라 아직 없는 칸(기술 컷인·장 지도)은 여기서 맞춰 넣음 */
function prepTarget(it){ return it.k==='scg'?scgSlot(it.c):it.k==='map'&&it.ch?ensureChMap(it.ch):it.o; }
/* 공지를 봄(Model — 화면에 들어가기 전) */
function noticeSeen(){ P().live.seen=Date.now(); mark('prog'); }
/* src/main/0135-live/0535-content-audit.js에서 옮김 */
/* 규칙(AUDIT_RULES)마다 "감지 → 고치기"를 정의해요. 종류: missing(빠짐·잘못됨) · upgrade(구버전 생성물, 새 기능으로 바꿀 수 있음)
   고치는 방법: auto(규칙 변환, AI 없이) · ai(빠진 항목만 AI로 채움) · image(그림 생성) · open(기존 편집 화면 열기)
   생성 버전: 새로 만드는 캐릭터에 genVer가 찍혀요(cleanChar0). genVer가 없거나 낮으면 구버전 생성물이에요.
   지정 변환: 고른 캐릭터·항목을 지시문대로 AI가 바꿔요. 마지막 일괄 작업은 되돌릴 수 있어요. 문서: docs/research/content-audit.md */
function auditGenVer(){ return 8; } // 8: 세력 깊이·몬스터 도감·첫 등장 // 7: 사거리(근접·원거리·지원)·출격 경로 // 6: 연출(감정 아이콘·동작·화면 효과) // 5: 전장 규칙·별 조건·일정 장면 // 4: 개성 시트·인연 톡·메모리얼 // 생성 규칙이 바뀌면 올려요(2: 상징 컬러·아이템, 3: 바리에이션·상속 시대)
function auditVer(){ return Math.max(...AUDIT_RULES.map(r=>r.since)); } // 점검 판: 9 = 프로필 항목·포지션 보완, 10 = 세력 장별 태도 보완(생성 규칙은 그대로라 auditGenVer는 8)
function auditTargets(scope){ if(scope==='char') return G.chars; if(scope==='lib') return G.lib; if(scope==='game') return [G.meta]; if(scope==='stage') return G.chapters.filter(ch=>ch.kind==='main'||ch.kind==='event').flatMap(ch=>ch.stages||[]); return []; }
function auditName(r,o){ if(r.scope==='game') return G.meta.title||'게임'; if(r.scope==='stage'){ const ch=G.chapters.find(c=>(c.stages||[]).includes(o)); return `${ch?ch.title+' · ':''}${o.title||o.id}`; } return o.name||o.id; }
function auditScan(only){ const out=[]; for(const r of AUDIT_RULES){ const items=auditTargets(r.scope).filter(o=>(!only||only(o,r))&&(()=>{ try{ return r.test(o); }catch(e){ return false; } })()); if(items.length) out.push({rule:r,items}); } return out; }
function auditSnap(objs,label){ AUDIT_UNDO={label,at:Date.now(),items:objs.map(o=>({o,before:JSON.parse(JSON.stringify(o))}))}; }
function auditMarkObj(o){ if(o===G.meta){ mark('meta','world'); return; } if(G.chars.includes(o)) mark('c:'+o.id); else if(G.lib.includes(o)) mark('l:'+o.id); else { const ch=G.chapters.find(c=>(c.stages||[]).includes(o)); if(ch) mark('ch:'+ch.id); } }
async function auditAIFill(c,fields,instruction){ // 빠진 항목 채우기(instruction 없음) 또는 지정 변환(instruction 있음)
  const schema='{'+fields.map(f=>AUDIT_FIELDS[f][1]).join(',')+'}', cur=fields.map(f=>`${AUDIT_FIELDS[f][0]}: ${JSON.stringify(c[f]??'')}`).join('\n');
  const r=await aiJSON(auditAIFillPrompt({c,cur,instruction,fields,schema}),null,'default');
  if(!r) return false;
  for(const f of fields){ const v=r[f]; if(v==null) continue;
    if(f==='touch'&&typeof v==='object') c.touch={head:auditStrs(v.head).slice(0,8),body:auditStrs(v.body).slice(0,8),pet:auditStrs(v.pet).slice(0,8)};
    else if(f==='affLines'&&typeof v==='object'){ const o={}; Object.entries(v).forEach(([k,x])=>{ const n=parseInt(k,10); if(n>=1&&n<=10) o[n]=auditStrs(x).slice(0,4); }); c.affLines=o; }
    else if(['lines','lvLines','dupLines'].includes(f)) c[f]=auditStrs(v).slice(0,12);
    else if(f==='naiPrompt') c.naiPrompt=stripAge(tagList(String(v)).filter(t=>!MINOR_TAGS.test(tagKey(t))).join(', '));
    else c[f]=String(v).trim(); }
  mark('c:'+c.id); return true; }
async function auditAIStage(s){ const ch=G.chapters.find(c=>(c.stages||[]).includes(s)); const r=await aiJSON(auditAIStagePrompt({ch,s}),null,'default'); if(!r||!r.pre) return false; s.pre=String(r.pre); auditMarkObj(s); return true; }
// 한 항목 고치기 — 점검 화면의 일괄 고치기(auditFix)와 실행 중 자동 채움(liveFill, 0537)이 같이 씀. 고쳤으면 true
// 규칙 고치기 중 글 AI로 더 잘 채울 수 있는 것(fix.ai — 일정 장소는 AI가 좋아하는 것 태그까지 붙여 "좋아하는 장소 ♥"가 맞음)은 AI가 있으면 AI로, 없거나 실패하면 규칙으로
async function auditAutoRun(rule,o){ if(SAMPLE&&rule.fix.ai){ try{ if(await rule.fix.ai(o)) return; }catch(e){ quietErr(e,'auditAutoRun'); } } rule.fix.run(o); }
async function auditFixOne(rule,o){ const m=rule.fix.mode;
  if(m==='auto'){ await auditAutoRun(rule,o); auditMarkObj(o); return true; }
  if(m==='ai') return !!(await auditAIFill(o,rule.fix.fields));
  if(m==='ai-stage') return !!(await auditAIStage(o));
  if(m==='ai-rules') return !!(await rulesAIFill());
  if(m==='ai-persona') return !!(await personaAI(o,rule.fix.k,{lines:rule.fix.k==='improve'}));
  if(m==='ai-afftalk') return !!(await talkAffGen(o));
  if(m==='ai-memo') return !!(await memorialGen(o));
  if(m==='ai-run') return !!(await rule.fix.run(o));
  if(m==='weapon'){ await fixWeaponPrompts([o]); auditMarkObj(o); return true; }
  if(m==='skills'){ v2Ensure(o); await v2ReadyChars([o]); auditMarkObj(o); return true; }
  if(m==='skills-remaster'&&await balRemasterAI(o)){ auditMarkObj(o); return true; }
  return false; }
