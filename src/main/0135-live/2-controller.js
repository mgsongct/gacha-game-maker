/* ===== 0135-live — Controller(동작을 받아 Model을 바꾸고 다시 그리게 함 · 섞인 함수는 나눌 것) ===== */
/* src/main/0135-live/0135-schedule.js에서 옮김 */
function schedVisit(sid,cid){ const sc=progRead('sched'), s=spots().find(x=>x.id===sid), c=charById(cid); if(!s||!c||!own(c.id)) return; if(sc.left<=0){ toast('오늘 일정을 다 썼어요. 내일 다시 와요'); return; } if(sc.done.includes(sid)){ toast('오늘 이미 다녀온 장소예요'); return; }
  const fav=spotFav(c,s); playStory(`${s.name} · ${c.name}`,(c.spotTalk&&c.spotTalk[s.id])||spotTemplate(c,s),()=>{ const k=progSlot('sched'); k.left--; k.done.push(sid); addAff(c,fav?30:20); const r=rateR({gold:800}); giveReward(r); mark('prog'); toast(`${c.name} 호감도 +${fav?30:20}${fav?' (좋아하는 장소)':''} · ${rewardText(r)}`); render(); }); }
/* src/main/0135-live/0280-live-ops.js에서 옮김 */
function bgJob(key,label,fn){ if(BGJOBS.some(j=>j.key===key)){ toast('이미 뒤에서 만드는 중이에요. 끝나면 우편이 와요'); return false; }
  const game=G,project=PJ().active,j={key,label,at:Date.now(),step:0,total:0,sub:''}; BGJOBS.push(j); bgJobsDraw();
  toast(label+' · 뒤에서 만들어요. 그동안 플레이해도 돼요. 다 되면 우편으로 알려 드려요');
  (async()=>{ let out=null; try{ out=await fn(j); }catch(e){ console.warn(e); }
    finally{ const i=BGJOBS.indexOf(j); if(i>=0) BGJOBS.splice(i,1); bgJobsDraw(); }
    if(G!==game||PJ().active!==project)return;
    if(out&&out.title){ sendMail({from:'운영팀',title:out.title,body:out.body||'',days:30}); toast('📮 '+out.title); }
    else { sendMail({from:'운영팀',title:label.replace(/ 만드는 중$/,'')+' 실패',body:'만들지 못했어요. 글 AI 연결과 남은 사용량을 확인하고 다시 시도해 주세요.',days:7}); toast(label.replace(/ 만드는 중$/,'')+'에 실패했어요. 우편함을 확인해 주세요'); }
    mark('prog'); if($('#modal').hidden&&(!B||B.over)) render(); })();
  return true; }
/* src/main/0135-live/0290-season-rotation.js에서 옮김 */
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
      else if(on.event&&SAMPLE){ liveBar('새 이벤트를 만드는 중… 몇 분 걸려요. 그동안 플레이해도 돼요.'); const res=await aiEventGen('',3,true,[]);
        if(res){ act.forEach(e=>{if(e!==res.ev){e.active=false;const b=G.banners.find(x=>x.id===e.bannerId); if(b&&!e.keepBanner) b.active=false;}}); opened=`새 이벤트 「${res.ev.title}」 개최${res.nc?`, 한정 ${T('crew')} ${res.nc.name} 등장`:''}`; bondNote((res.ncs||[]).slice(1),notes); } }
      if(opened){ if(act.length) notes.push(`이벤트 종료: ${act.map(e=>e.title).join(', ')}`); notes.push(opened); }
      L.last.week=keys.week;
    }
    if(!on.season&&due('chap')&&on.chapter&&SAMPLE){
      if(!nextStage()){ liveBar('메인 스토리 다음 장을 쓰는 중…'); const res=await aiChapterGen('메인 플롯을 따라 자연스럽게 이어서',storyN(4),[]); if(res){ notes.push(`메인 스토리 「${res.ch.title}」 공개`); bondNote(res.newc,notes); } }
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
function prepAsk(){ if(playMode()) return; try{ scanScriptAssets(); }catch(e){} const p=P(); if(p.prepNever||p.prepAsked===today()||PREPJOB||!imgReady()||!$('#modal').hidden||!$('#ov').hidden) return; if(!drawTodo().length) return; p.prepAsked=today(); mark('prog'); openPrep(true); }
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
      const o=prepTarget(it); if(it.k==='char'&&o.npc){ await storeImage(o,b,'c:'); mark('meta'); } else if(it.k==='char'){ await storeImage(o,b,'c:'); } else if(['illust','weapon','upper','pose','lbbg','scg'].includes(it.k)){ await storeImage(o,b,''); mark('c:'+it.c.id); } else await storeImage(o,b,'l:');
      j.done++; prepChip(); if(opt.step) opt.step(it,j,'done'); if(!$('#modal').hidden||tab==='crew'||tab==='lobby'||tab==='ops'||tab==='shop') { if($('#modal').hidden) render(); }
      await wait(700);
    }catch(e){ toast(naiErr(e,it.label+' 실패')); if(e&&['image_cancelled','image_busy','nai_nokey','bad_key','low_credit','network','nai_locked','comfy_nourl','comfy_nowf'].includes(e.code)){ toast('그림 준비를 멈췄어요. 연결을 확인한 뒤 그림 준비실에서 이어서 그려 주세요'); break; } await wait(1500); }
  }
  PREPJOB=null; prepChip(); render(); toast(`그림 ${j.done}장을 준비했어요`); if(opt.done) opt.done(j);
}
/* src/main/0135-live/0535-content-audit.js에서 옮김 */
function auditUndo(){ const U=AUDIT_UNDO; if(!U) return; for(const {o,before} of U.items){ for(const k of Object.keys(o)) if(!(k in before)) delete o[k]; Object.assign(o,before); if(G.chars.includes(o)) mark('c:'+o.id); } mark('prog'); AUDIT_UNDO=null; toast(`되돌렸어요: ${U.label}`); }
async function auditFix(rule,items){
  if(AUDIT_JOB){ toast('점검 작업이 진행 중이에요'); return; } const m=rule.fix.mode;
  if(m==='open'){ const c=items[0]; if(rule.fix.stamp) items.forEach(x=>{ x.genVer=auditGenVer(); auditMarkObj(x); }); closeModal(); if(c&&typeof openRegen==='function') openRegen(c.id); if(items.length>1) toast(`${items.length}명을 지금 버전으로 표시했어요. 다시 만들 부분은 캐릭터마다 「다시 만들기」에서 골라요`); return; }
  if(m==='image'){ if(!imgReady()){ toast('그림 AI(NovelAI 또는 ComfyUI)를 먼저 설정해 주세요'); return; } const set=new Set(items); closeModal(); runPrep(rule.scope==='lib'?['bg','prop','cg','enemy']:auditImgCats,it=>set.has(it.c)||set.has(it.o)); return; }
  if((m==='ai'||m==='ai-stage'||m==='weapon'||m==='ai-rules'||m==='ai-persona'||m==='ai-afftalk'||m==='ai-memo'||m==='ai-run')&&!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; }
  auditSnap(items,rule.label); const job=AUDIT_JOB={stop:false,done:0,total:items.length}; let ok=0;
  try{ for(const o of items){ if(job.stop) break; syBar(`점검: ${rule.label} ${job.done+1}/${job.total}`);
      try{ if(await auditFixOne(rule,o)) ok++; }catch(e){ console.warn('audit',rule.id,e); }
      job.done++; } }
  finally{ AUDIT_JOB=null; syBar(''); }
  mark('prog'); toast(`${rule.label}: ${ok}/${items.length}개 고쳤어요${AUDIT_UNDO?' (되돌리기 가능)':''}`); if(!$('#modal').hidden) openAudit(AUDIT_FOCUS); else render(); }
async function auditConvert(chars,fields,instruction){
  if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; } if(!chars.length||!fields.length||!instruction.trim()){ toast('대상·항목·지시를 모두 정해 주세요'); return; } if(AUDIT_JOB) return;
  auditSnap(chars,'지정 변환: '+instruction.slice(0,20)); const job=AUDIT_JOB={stop:false}; let ok=0;
  try{ for(const [i,c] of chars.entries()){ if(job.stop) break; syBar(`지정 변환 ${i+1}/${chars.length}: ${c.name}`); try{ if(await auditAIFill(c,fields,instruction)) ok++; }catch(e){ quietErr(e,'0535-content-audit.js:94'); } } }
  finally{ AUDIT_JOB=null; syBar(''); } toast(`지정 변환: ${ok}/${chars.length}명 바꿨어요 (되돌리기 가능)`); openAudit(AUDIT_FOCUS); }
function openAudit(focus){ AUDIT_FOCUS=focus||null; if(!focus){ G.meta.auditSeen=auditVer(); mark('meta'); }
  const only=focus?(o=>o.id===focus):null, res=auditScan(only), old=G.chars.filter(c=>!c.alt&&(+c.genVer||0)<auditGenVer()&&!DEFAULT_CHARS.some(d=>d.id===c.id)).length, kinds={missing:'빠짐',upgrade:'구버전·업그레이드'}, how={auto:'자동 변환',ai:'AI로 채우기','ai-stage':'AI로 쓰기','ai-rules':'AI로 설명 채우기','ai-persona':'AI로 개성 채우기·다듬기','ai-afftalk':'AI로 인연 톡 만들기','ai-memo':'AI로 메모리얼 만들기','skills-remaster':'세대 맞추기(AS)',weapon:'AI로 고치기',skills:'다시 맞추기',image:'그림 그리기',open:'다시 만들기 열기'};
  const chars=focus?G.chars.filter(c=>c.id===focus):G.chars;
  openModal(auditHTML(focus,old,res,kinds,how,chars)); }
/* src/main/0135-live/0537-live-fill.js에서 옮김 */
async function liveFill(notes){ if(subLocked()) return 0; const done={}, add=id=>{ done[id]=(done[id]||0)+1; }, group=id=>auditScan().find(g=>g.rule.id===id);
  for(const id of LIVE_FILL_AUTO){ const g=group(id); if(!g) continue; for(const o of g.items) if(await auditFixOne(g.rule,o)) add(id); }
  let n=0; if(SAMPLE) for(const id of LIVE_FILL_AI){ if(n>=LIVE_FILL_MAX) break; const g=group(id); if(!g) continue;
    for(const o of LIVE_FILL_OWNED.has(id)?g.items.filter(c=>own(c.id)):g.items){ if(n>=LIVE_FILL_MAX) break; liveBar(`${LIVE_FILL_NAME[id]}을(를) 채우는 중…`); n++; if(await auditFixOne(g.rule,o)) add(id); } }
  const ids=Object.keys(done); if(ids.length){ mark('prog'); notes.push('비어 있던 콘텐츠를 채웠어요: '+ids.map(id=>`${LIVE_FILL_NAME[id]} ${done[id]}`).join(', ')+' (콘텐츠 점검·각 화면에서 고칠 수 있어요)'); }
  return ids.length; }
// liveTick에서 부르는 세 곳: 정기 실행의 채우기 단계, 첫 실행(주기 기준만 잡고 돌아갈 때 — 채우기는 주기와 상관없어서 이때도), 알림 합치기
async function liveFillStep(on,notes){ if(!on.fill) return; liveBar('비어 있는 콘텐츠를 채우는 중…'); await liveFill(notes); }
async function liveFillRun(on){ if(!on.fill||LIVE_RUN) return; LIVE_RUN=true; liveBar('비어 있는 콘텐츠를 채우는 중…'); const notes=[];
  try{ await liveFill(notes); }catch(e){ quietErr(e,'liveFillRun'); } finally{ LIVE_RUN=false; liveBar(null); } if(notes.length) toast(notes[0]); }
