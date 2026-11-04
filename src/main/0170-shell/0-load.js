/* ===== 0170-shell — 불러올 때(상수·상태·리스너): 계층 파일 밖에 남은 옛 조각을 이름 순(불러오는 순서)으로 이음 ===== */

/* ── 0170-render.js에서 ── */
/* =========================================================
   렌더
   ========================================================= */
let tab='lobby', PREVTAB='lobby', RG_LIVE=false;
const PLAY_HIDE_ST=['lib','text','img','live','conn'];

/* ── 0180-ui-scroll.js에서 ── */
/* UI_SCROLL_MODULE */
/* Keep local actions at their current position; navigation owns intentional resets. */
var UI_PAGE_SCROLL_ROUTE=null,UI_PAGE_SCROLL_GAME=null;

/* 화면에 들어가기 전 처리(Controller — 그리기 전): 화면마다 그 기능이 상태를 맞춤 — 그리기(…HTML)는 상태를 바꾸지 않음 */
const SCREEN_ENTER={lobby:[mailTick,cashTick],abyss:[rogueTick],challenge:[rogueTick],notice:[noticeSeen],codex:[cxBadgeSync]};
const pageHead=(ko,en,back)=>`<div class="phead">${back?`<button class="back" data-act="go" data-to="${back}" aria-label="뒤로">‹</button>`:''}<div><i>${en}</i><h2>${esc(ko)}</h2></div></div>`;
const ICO={
  raid:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M14.5 3 21 9.5 11 19.5 4.5 13z"/><path d="M4.5 13 3 21l8-1.5M16 8l-6 6"/></svg>',
  book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z"/><path d="M20 4h-5a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h6z"/></svg>',
  talk:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8M8 13h5"/></svg>',
  event:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 21V4h11l-2 4 2 4H5"/></svg>',
  notice:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 10v4h4l6 4V6L7 10z"/><path d="M17 9a4 4 0 0 1 0 6"/></svg>',
  gift:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="4" y="9" width="16" height="11"/><path d="M3 9h18M12 9v11M12 9c-2-4-6-4-6-1s6 1 6 1 6 2 6-1-4-3-6 1"/></svg>',
  disp:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5 13 13l-4.5 2.5L11 11z"/></svg>',
  farm:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>',
  eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M4 20 20 4"/></svg>',
  shop:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 9 6 4h12l2 5M4 9v11h16V9M4 9h16M9 20v-6h6v6"/></svg>',
  mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14"/><path d="M3 6l9 7 9-7"/></svg>',
  gem:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M9 3l3 18 3-18"/></svg>'};
// 작전: 장 카드를 가로로 넘겨 고르고, 누르면 그 장의 지도로 들어가요
let OPS_CH=null;
const contractHTML=noSkin(contractHTML0);
// 이벤트 교환소: 픽업 캐릭터가 맞이하는 상점
let EVS_LINE='', EVS_FOR='';
const OAI_PRESETS=[
 ['GitHub Copilot','https://api.githubcopilot.com','gpt-4.1','키 칸에 GitHub Copilot 토큰을 넣어요. 모델은 gpt-4.1, gpt-4o, claude-sonnet-4 등 Copilot에 있는 이름을 써요. 비공식 방식이라 막힐 수 있어요. 웹 버전에서 안 되면 중계 서버를 최신 코드로 바꿔 주세요.'],
 ['LLM Gateway','https://api.llmgateway.io/v1','','llmgateway.io에서 API 키를 만들어요. 모델 이름은 llmgateway.io 모델 목록의 ID를 그대로 써요. 웹 버전에서 안 되면 중계 서버를 최신 코드로 바꿔 주세요(허용 목록에 들어 있어요).'],
 ['OpenRouter','https://openrouter.ai/api/v1','','openrouter.ai → Keys에서 키를 만들어요. 모델 이름은 openrouter.ai/models의 ID(예: deepseek/deepseek-chat-v3.1)를 그대로 써요.'],
 ['Ollama 클라우드','https://ollama.com/v1','gpt-oss:120b','ollama.com 로그인 → Settings → Keys에서 API 키를 만들어요. 모델은 ollama.com/search?c=cloud 에 있는 클라우드 모델 이름(예: gpt-oss:120b, qwen3-coder:480b)을 써요. 이름 끝의 -cloud는 빼요. 무료 플랜은 사용량 한도가 있어요.'],
 ['내 PC Ollama','http://192.168.0.10:11434/v1','','PC에서 OLLAMA_HOST=0.0.0.0 으로 Ollama를 켜고, PC의 IP로 주소를 바꿔요(폰과 같은 와이파이). 키는 아무 글자나 넣으면 돼요. 모델은 ollama list에 나온 이름 그대로.'],
 ['LM Studio','http://192.168.0.10:1234/v1','','LM Studio → Developer → Start Server, "Serve on Local Network"를 켜고 PC의 IP로 주소를 바꿔요. 키는 아무 글자나 넣으면 돼요.'],
 ['DeepSeek','https://api.deepseek.com/v1','deepseek-chat','platform.deepseek.com → API keys에서 만들어요.']];
const MODEL_SUGG={copilot:['gpt-4.1','gpt-4o','claude-sonnet-4','claude-3.7-sonnet','gemini-2.5-pro','o4-mini'],anthropic:['claude-opus-5-5','claude-sonnet-5-5','claude-haiku-4-5-20251001'],gemini:['gemini-2.5-pro','gemini-2.5-flash','gemini-2.5-flash-lite'],vertex_google:['gemini-2.5-pro','gemini-2.5-flash','gemini-2.5-flash-lite'],vertex_anthropic:[],openai:[]};

 const NLASTSEED={};
let VS={cid:null,results:[],picks:{},lang:'ko',q:''};
let STTAB='',STROOTSCROLL=0;

/* ── 0210-setup.js에서 ── */
/* =========================================================
   처음 실행 설정 (AI 키)
   ========================================================= */
const SETUP_KEY='starfall-setup-done';
let SW=null;
const SETUP_HELP={vertex:['Google Cloud 콘솔에서 서비스 계정 키나 익스프레스 키를 만들어요','https://console.cloud.google.com/vertex-ai'],gemini:['Google AI Studio에서 무료로 받을 수 있어요','https://aistudio.google.com/apikey'],anthropic:['Anthropic Console에서 받아요 (유료)','https://console.anthropic.com/settings/keys'],openai:['OpenRouter 등 OpenAI 호환 서비스의 키','https://openrouter.ai/keys']};

/* ── 0230-modal.js에서 ── */
/* =========================================================
   모달
   ========================================================= */
let MBACK=null; // 하위 창(스킨·표정·목소리)을 닫으면 돌아갈 화면
addEventListener('resize',()=>{ clearTimeout(window.__fbT); window.__fbT=setTimeout(fitBrand,150); });
const head=(t,sub2='')=>`<div class="sheet-head"><div><h2>${t}</h2>${sub2}</div><button class="x" data-act="close" aria-label="닫기">×</button></div>`;

let FB_STAR=0;
let CS_TAB='equip';
const lines=v=>v.split('\n').map(s=>s.trim()).filter(Boolean);
let squadSel=null;
const unitPower=st=>Math.round(st.hp/5+st.atk*3+st.def*2+st.spd);
const charPower=c=>unitPower(stats(c));
const enemyPower=e=>unitPower({hp:e.hp,atk:e.atk,def:e.def,spd:e.spd});

/* ── 0370-game-picker.js에서 ── */
/* ===== 시작할 때 게임 고르기 ===== */
/* 시작 준비(첫 실행 때 그림 미리 그리기): 그릴 종류·필요한지 */
const BOOT_CATS=[['char','스탠딩 (전신)',true],['upper','상반신 (스토리·프로필)',true],['illust','일러스트 (타이틀·로비·픽업)',true],['bg','배경',true],['icon','재화 아이콘',true],['prop','소품 (스토리에 나오는 물건)',true],['weapon','전용 무기',true],['enemy','적',false],['map','작전 지도',false],['cg','이벤트 CG',false],['scg','기술 컷인',false]];
let BP=null;
const bootCats=()=>BOOT_CATS;

/* ── 0410-desktop.js에서 ── */
/* ===== PC 화면 ===== */
window.addEventListener('resize',()=>{ clearTimeout(window.__dk); window.__dk=setTimeout(applyDesk,150); });
document.addEventListener('keydown',e=>{
  const tg=e.target, typing=tg&&(/^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName)||tg.isContentEditable); if(typing||e.ctrlKey||e.metaKey||e.altKey) return;
  const modalOpen=!$('#modal').hidden, phoneOpen=!$('#phone').hidden, ov=$('#ov');
  if(e.key==='Escape'){ if(modalOpen){ window.navBack(); e.preventDefault(); e.stopImmediatePropagation(); } else if(phoneOpen){ closePhone(); e.preventDefault(); } return; }
  if(modalOpen||phoneOpen) return;
  if(!ov.hidden){ const vn=$('#vn'), ti=ov.querySelector('.title,[data-act=opnext]');
    if(vn&&(e.key===' '||e.key==='Enter'||e.key==='ArrowRight')){ e.preventDefault(); const el=$('#vnCh'); if(el&&el.children.length) return; vn.click(); return; }
    if(vn&&(e.key==='a'||e.key==='A')){ const b=$('#vnAuto'); if(b) b.click(); return; }
    if(ti&&(e.key===' '||e.key==='Enter')){ e.preventDefault(); ti.click(); }
    return; }
  const map={'1':'crew','2':'ops','3':'lobby','4':'contract','5':'studio'}; if(map[e.key]){ const b=document.querySelector(`.tab[data-tab="${map[e.key]}"]`); if(b) b.click(); }
});

/* ── 0540-start.js에서 ── */
/* =========================================================
   시작
   ========================================================= */
render(); loadIdbImages(); if(orientPref()!=='auto') applyOrient();
if(G.__curveNew){ delete G.__curveNew; markAll(); }
applyMeta(); (async()=>{ if(PCS()||syReady()){ if(await bootSync()) return; } const lost=pcLostKey(); if(needSetup()&&!lost) showSetup(); else showStart(); if(lost) setTimeout(()=>openPcSet(true),700); })(); progTick();

/* ── 0550-standalone-app.js에서 ── */
/* =========================================================
   독립 앱 전용: AI 연결, 백업 파일, 안드로이드 뒤로가기
   ========================================================= */
setupAI(); render(); loadAudio().then(()=>sceneBgm()); setTimeout(()=>skillResume().catch(e=>quietErr(e,'스킬 설계 이어 하기')),4000); /* 생성 중 미룬 스킬 설계 이어서 */
(()=>{ const o=LV();
  if(window.__LIVE__){ o.boots=0; saveLV(o); }
  if(o.failed){ o.failed=false; if(o.build) o.badBuild=o.build; saveLV(o); setTimeout(()=>toast('새 버전이 실행되지 않아 설치 버전으로 돌아왔어요'),1500); }
  if(o.superseded){ delete o.superseded; saveLV(o); }
  if(IS_NATIVE&&o.auto!==false&&Date.now()-(o.checked||0)>3*3600e3) setTimeout(()=>checkUpdate(false),5000);
  if(!IS_NATIVE) setTimeout(()=>{ try{ checkNoticeWeb(); }catch(e){} try{ checkWebUpdate(false); }catch(e){} },5000);
  setTimeout(()=>{ try{ syCheckOnStart(); }catch(e){} },3500);
  if(LKMODE()) setTimeout(()=>{ try{ lkActivate(); }catch(e){} },1500);
  if(PCS()) setTimeout(()=>{ try{ pcStart(); }catch(e){} },2500);
  if(!IS_NATIVE){ try{ navigator.storage&&navigator.storage.persist&&navigator.storage.persist(); }catch(e){} if(IS_IOS&&!IS_STANDALONE&&!appStorage.getItem('ggm-a2hs')&&!pcOrigin()&&!pcLostKey()){ let n=0; const tryA=()=>{ if(appStorage.getItem('ggm-a2hs')) return; if($('#modal').hidden&&$('#ov').hidden) openA2HS(true); else if(n++<400) setTimeout(tryA,3000); }; setTimeout(tryA,2500); } }
})();
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible'&&!$('#ov').querySelector('.title')&&P().seenOpening) setTimeout(()=>liveTick(false),800); });
if('serviceWorker' in navigator && location.protocol==='https:' && !window.Capacitor) navigator.serviceWorker.register('sw.js').catch(()=>{});
const CAP=window.Capacitor&&window.Capacitor.Plugins;
if(CAP&&CAP.App) CAP.App.addListener('backButton',()=>{
  if(appConfirmBack())return;
  if(NEW_GAME_SOURCE){toast('게임 생성이 끝날 때까지 기다려 주세요');return;}
  if(BACKUP_BUSY){toast('백업 처리가 끝날 때까지 기다려 주세요.');return;}
  if(document.getElementById('generated-image-preview')||(typeof IMAGE_CANDIDATES!=='undefined'&&IMAGE_CANDIDATES)||(typeof V2ICONS!=='undefined'&&V2ICONS)||!$('#modal').hidden){window.navBack();return;}
  if(!$('#phone').hidden){ if($('.ph-menu')){ $('.ph-menu').remove(); return; } if(PH&&PH.sel){ openRoom(PH.fc); return; } if(PH&&PH.add){ PH.from==='room'?openRoom(PH.add):phNewList(); return; } if(PH) phoneList(); else closePhone(); return; }
  if(S){ vnEnd(); return; }
  if(B){ return; }
  if(GC){ return; }
  if(!$('#ov').hidden) return;
  if(settingsBack())return;
  if(tab!=='lobby'){tab='lobby';render();return;}
  CAP.App.minimizeApp&&CAP.App.minimizeApp();
});
const blobToData=b=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(r.error);r.readAsDataURL(b);});
$('#drfile').addEventListener('change',async e=>{ const f=e.target.files[0]; e.target.value=''; if(!f) return; const ld=$('#dri_load'); draftImportDone(draftFrom(await f.text()),ld?ld.checked:true); });
$('#bkfile').addEventListener('change',e=>{const f=e.target.files[0];e.target.value='';if(f)backupImport(f,'full');});

/* ── 0570-modal-nav.js에서 ── */
/* MODAL_NAV_MODULE */
/* One user dismissal returns one modal level. Programmatic closeModal still closes all. */
(function(){
 const NAV={stack:[],cur:null,next:null,restoring:false,closing:false,revision:0};
 const rawOpen=openModal,rawClose=closeModal,project=()=>PJ().active;
 const reset=()=>{NAV.stack=[];NAV.cur=null;NAV.next=null;NAV.closing=false;MBACK=null;};
 function snapshot(entry){const m=$('#modal');if(!entry||m.hidden)return;entry.nodes=[...m.childNodes];entry.scroll=m.querySelector('.sheet')?.scrollTop||0;entry.scrollState=uiScrollCapture(m.querySelector('.sheet'));entry.lock=m.dataset.lock||'';}
 function fallbackId(html){const template=document.createElement('template');template.innerHTML=html;if(template.content.querySelector('.naiprev')&&NAIJOB)return 'nairesult:'+NAIJOB.kind+':'+NAIJOB.id;return 'dialog:'+(template.content.querySelector('.sheet-head h2,h2,h3')?.textContent.trim()||template.content.firstElementChild?.className||'dialog');}
 function addBack(){const m=$('#modal'),hd=m.querySelector('.sheet-head');if(hd&&!m.dataset.lock&&(NAV.stack.length||NAV.cur?.mback)&&!hd.querySelector('[data-act="goback"]')){const b=document.createElement('button');b.type='button';b.className='x nav-back';b.dataset.act='goback';b.setAttribute('aria-label','뒤로가기');b.textContent='‹';hd.prepend(b);}}
 openModal=function(html,lock,cls,route){
  const next=route?{id:route}:NAV.next;NAV.next=null;const m=$('#modal');if(NAV.cur&&NAV.cur.project!==project())reset();
  const id=next?.id||fallbackId(html),same=NAV.cur?.id===id;
  if(!same&&NAV.cur?.state&&NAV.cur.id.startsWith('skill:')&&V2EDIT===NAV.cur.state)v2ReadEditor();
  if(!same&&NAV.cur?.state&&NAV.cur.id.startsWith('gear:')&&V2GEAR===NAV.cur.state)v2GearRead();
  snapshot(NAV.cur);let scrollFrom=same&&!NAV.closing?NAV.cur:null;
  if(!NAV.restoring&&!same){
   const ancestor=NAV.stack.findIndex(e=>e.id===id);
   if(ancestor>=0){scrollFrom=NAV.stack[ancestor];NAV.stack=NAV.stack.slice(0,ancestor);}
   else if(NAV.cur&&!NAV.cur.transient&&!NAV.closing&&!m.hidden){NAV.stack.push(NAV.cur);if(NAV.stack.length>32)NAV.stack.shift();}
  }
  const r=rawOpen.apply(this,arguments);if(scrollFrom)uiScrollRestore(m.querySelector('.sheet'),scrollFrom.scrollState);NAV.revision++;NAV.closing=false;
  NAV.cur={...(same?NAV.cur:{}),...(next||{}),id,project:project(),mback:MBACK,transient:!!lock||!!m.querySelector('.spin'),context:next?.getContext?.()};snapshot(NAV.cur);addBack();return r;
 };
 closeModal=function(){const r=rawClose.apply(this,arguments),m=$('#modal');if(!m.hidden)return r;NAV.closing=true;MBACK=null;const revision=++NAV.revision;setTimeout(()=>{if(m.hidden&&revision===NAV.revision)reset();},0);return r;};
 function restore(entry){
  if(entry.project!==project())return false;NAV.restoring=true;NAV.cur=null;MBACK=entry.mback||null;
  try{
   if(entry.id.startsWith('naprep:'))NPREP=entry.context;if(entry.id.startsWith('voice:'))VS=entry.context;if(entry.id.startsWith('skinprop:'))SKPROP=entry.context;
   if(!entry.dom&&entry.reopen)entry.reopen();
   if(!NAV.cur&&entry.nodes){const m=$('#modal');m.replaceChildren(...entry.nodes);m.hidden=false;m.dataset.lock=entry.lock;NAV.cur=entry;NAV.closing=false;NAV.revision++;addBack();}
   if(!NAV.cur)return false;const sheet=$('#modal .sheet');if(sheet){uiScrollRestore(sheet,entry.scrollState);sheet.scrollTop=entry.scroll||0;}return true;
  }finally{NAV.restoring=false;}
 }
 window.navBack=function(){
  if(appConfirmBack())return;
  if(NEW_GAME_SOURCE){toast('게임 생성이 끝날 때까지 기다려 주세요');return;}
  if(typeof imageCandidateBack==='function'&&imageCandidateBack())return;
  // Icons are a separate overlay: never close the character underneath them.
  if(typeof V2ICONS!=='undefined'&&V2ICONS){const button=document.querySelector('[data-icon-act="back"],[data-icon-act="close"]');if(button)v2IconClick({target:button});return;}
  if(document.getElementById('v2-standing-help')){v2CloseStandingHelp();return;}
  if(document.querySelector('.v2-equipment-bubble')){document.querySelectorAll('.v2-equipment-bubble').forEach(e=>e.remove());document.querySelectorAll('[data-act=\"v2gearalert\"]').forEach(e=>e.setAttribute('aria-expanded','false'));return;}
  const m=$('#modal');if(m.hidden||m.dataset.lock)return;
  if(typeof regenCancel==='function'&&!regenCancel())return;
  NAIJOB=null;if(NAV.cur?.id.startsWith('training:'))V2TRAIN_CONFIRM=null;
  v2CancelEditorGeneration();if(typeof v2CancelGearEditor==='function')v2CancelGearEditor();
  while(NAV.stack.length){if(restore(NAV.stack.pop()))return;}
  const back=NAV.cur?.mback||MBACK;
  if(back){NAV.cur=null;MBACK=null;NAV.restoring=true;try{back();}finally{NAV.restoring=false;}return;}
  rawClose();if(m.hidden)reset();
 };
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&((typeof IMAGE_CANDIDATES!=='undefined'&&IMAGE_CANDIDATES)||!$('#modal').hidden||document.getElementById('v2-standing-help')||document.querySelector('.v2-equipment-bubble'))){window.navBack();event.preventDefault();event.stopImmediatePropagation();}},true);
 // Stable identities distinguish a redraw from opening a child dialog.
 const pages=[['openMail',()=>'mail'],['openGift',a=>'gift:'+a[0]],['openChEdit',()=>'chapter-edit:'+chDraft?.id],['openEpEdit',a=>'episode-edit:'+a[0]+':'+(a[1]||'new')],['openThEdit',a=>'thread-edit:'+a[0]+':'+(a[1]||'new')],['openOpeningEdit',()=>'opening-edit'],['openBannerFrom',a=>'banner-edit:'+a[0]?.id],['openEvEdit',a=>'event-edit:'+(a[0]||'new')],['openDraft',()=>'draft'],['openDispSel',a=>'dispatch:'+a[0]],['openRelEdit',a=>'rel-edit:'+a[0]],['openCxEdit',a=>'codex-edit:'+(a[0]||'new')],['openStoryMemoryEditor',a=>'story-memory:'+a[0]],['openStoryMemory',()=>'story-memory'],['openRgForm',()=>'rogue-formation'],['openChar',a=>'char:'+a[0]],['openCharEdit',a=>'charedit:'+a[0]],['openLib',a=>'lib:'+a[0]],['openLibItem',a=>'libitem:'+(a[0]||'new:'+a[1])],['openNaiPrep',a=>'naprep:'+a[0]+':'+a[1]],['openSkinBuy',a=>'skinbuy:'+a[0]],['openFaces',()=> 'faces:'+FACET.cid+':'+FACET.sid],['openSkin',a=>'skin:'+a[0]],['openSkinProp',()=> 'skinprop:'+SKPROP?.cid],['openNpcs',()=>'npcs'],['openRel',a=>'rel:'+(a[0]||RELC)],['openDesign',()=>'design'],['openImgLib',a=>'imglib:'+a[0]],['openNaiSet',()=>'naiset'],['openSound',()=>'sound'],['openWorld',()=>'world'],['openMeta',()=>'meta'],['openProjects',()=>'projects'],['openCx',a=>'cx:'+(a[0]||'')],['openUpConfirm',a=>'upgrade:'+a[0]?.id+':'+a[1]],['openRegen',a=>'regen:'+a[0]],['regenPreview',()=> 'regenpreview:'+REGEN?.cid],['renderVoice',()=> 'voice:'+VS?.cid+':'+VS?.sid],['v2DrawEditor',()=> 'skill:'+V2EDIT?.id],['v2DrawGearEditor',()=> 'gear:'+V2GEAR?.id],['v2OpenTraining',a=>'training:'+a[0]+':'+(a[1]||'rank')],['v2OpenPractice',()=>'practice']];
 for(const [fn,idf]of pages){const original=window[fn];if(typeof original!=='function')continue;window[fn]=function(...args){
  const previous=NAV.next,state=fn==='v2DrawEditor'?V2EDIT:fn==='v2DrawGearEditor'?V2GEAR:null;
  const route={id:null,state,dom:['openNaiPrep','openCharEdit','openSkin','openSkinProp','renderVoice','openChEdit','openEpEdit','openThEdit','openOpeningEdit','openBannerFrom','openEvEdit','openDraft','openRelEdit','openCxEdit','openStoryMemoryEditor','openStoryMemory'].includes(fn),getContext:()=>fn==='openNaiPrep'?NPREP:fn==='renderVoice'?VS:fn==='openSkinProp'?SKPROP:null,reopen:()=>{if(fn==='v2DrawEditor')V2EDIT=state;if(fn==='v2DrawGearEditor')V2GEAR=state;window[fn](...args);}};
  // Some openers set their selection before openModal; calculate ID at render time.
  Object.defineProperty(route,'id',{get:()=>idf(args),enumerable:true});NAV.next=route;
  try{return original.apply(this,args);}finally{NAV.next=previous;}
 };}
})();

/* /MODAL_NAV_MODULE */

/* ── 130-dispatch.js에서 ── */
const APP_ACTION_HANDLERS=Object.freeze({"titletap":handleSetupAction,"swnext":handleSetupAction,"swaddai":handleSetupAction,"swprev":handleSetupAction,"swlink":handleSetupAction,"swskipall":handleSetupAction,"swgo1":handleSetupAction,"swsub":handleSetupAction,"swdone":handleSetupAction,"swstytest":handleSetupAction,"swtestai":handleSetupAction,"swtestnai":handleSetupAction,"title":handleSetupAction,"swpreset":handleSetupAction,"sweep":handleSetupAction,"swdraft":handleSetupAction,"swpjdraft":handleSetupAction,"titlesnd":handleSetupAction,"prepopen":handleNavigationAndToolsAction,"rebal":handleNavigationAndToolsAction,"a2hs":handleNavigationAndToolsAction,"cdart":handleNavigationAndToolsAction,"bswipe":handleNavigationAndToolsAction,"lktake":handleNavigationAndToolsAction,"artgo":handleNavigationAndToolsAction,"artalways":handleNavigationAndToolsAction,"bpgo":handleNavigationAndToolsAction,"bpbg":handleNavigationAndToolsAction,"bpskip":handleNavigationAndToolsAction,"bpleave":handleNavigationAndToolsAction,"prepgo":handleNavigationAndToolsAction,"prepstop":handleNavigationAndToolsAction,"prepnever":handleNavigationAndToolsAction,"opnext":handleNavigationAndToolsAction,"pfdraw":handleNavigationAndToolsAction,"pfsave":handleNavigationAndToolsAction,"go":handleNavigationAndToolsAction,"close":handleNavigationAndToolsAction,"goback":handleNavigationAndToolsAction,"lbhide":handleNavigationAndToolsAction,"lbshow":handleNavigationAndToolsAction,"poke":handleNavigationAndToolsAction,"lbbgdel":handleNavigationAndToolsAction,"altnew":handleNavigationAndToolsAction,"scggen":handleNavigationAndToolsAction,"scgdel":handleNavigationAndToolsAction,"scgtest":handleNavigationAndToolsAction,"ilgen":handleNavigationAndToolsAction,"vncgview":handleNavigationAndToolsAction,"cguse":handleNavigationAndToolsAction,"ildel":handleNavigationAndToolsAction,"ailog":handleNavigationAndToolsAction,"ailogcopy":handleNavigationAndToolsAction,"ailogclear":handleNavigationAndToolsAction,"artcopy":handleNavigationAndToolsAction,"artclear":handleNavigationAndToolsAction,"pthumbset":handleNavigationAndToolsAction,"avdel":handleNavigationAndToolsAction,"pthumbdel":handleNavigationAndToolsAction,"addchar-open":handleNavigationAndToolsAction,"addchar-hand":handleNavigationAndToolsAction,"addchar-ai":handleNavigationAndToolsAction,"copy":handleNavigationAndToolsAction,"copyfield":handleNavigationAndToolsAction,"playep":handleNavigationAndToolsAction,"mapedit":handleNavigationAndToolsAction,"locked":handleNavigationAndToolsAction,"ghist":handleNavigationAndToolsAction,"vnnext":handleNavigationAndToolsAction,"vnpick":handleNavigationAndToolsAction,"vnauto":handleNavigationAndToolsAction,"vnskip":handleNavigationAndToolsAction,"vnlog":handleNavigationAndToolsAction,"bquit":handleNavigationAndToolsAction,"skill":handleNavigationAndToolsAction,"bretry":handleNavigationAndToolsAction,"flip":handleNavigationAndToolsAction,"flipall":handleNavigationAndToolsAction,"gcskip":handleNavigationAndToolsAction,"closepull":handleNavigationAndToolsAction,"sdelno":handleNavigationAndToolsAction,"sdelgo":handleNavigationAndToolsAction,"saveopening":handleNavigationAndToolsAction,"aiopening":handleNavigationAndToolsAction,"savelib":handleNavigationAndToolsAction,"dellib":handleNavigationAndToolsAction,"ailib":handleNavigationAndToolsAction,"newpu":handleNavigationAndToolsAction,"newpu-hand":handleNavigationAndToolsAction,"newpu-ai":handleNavigationAndToolsAction,"nextneedai":handleNavigationAndToolsAction,"cplogin":handleNavigationAndToolsAction,"saload":handleNavigationAndToolsAction,"seasoninfo":handleNavigationAndToolsAction,"seasontog":handleNavigationAndToolsAction,"seasonskip":handleNavigationAndToolsAction,"livetog":handleNavigationAndToolsAction,"liverun":handleNavigationAndToolsAction,"enh":handleNavigationAndToolsAction,"enhmax":handleNavigationAndToolsAction,"lb":handleNavigationAndToolsAction,"wup":handleNavigationAndToolsAction,"skvclear":handleNavigationAndToolsAction,"aiskin":handleNavigationAndToolsAction,"skpredo":handleNavigationAndToolsAction,"skpcancel":handleNavigationAndToolsAction,"skpok":handleNavigationAndToolsAction,"bnfac":handleNavigationAndToolsAction,"bnid":handleNavigationAndToolsAction,"bnup":handleNavigationAndToolsAction,"bnsave":handleNavigationAndToolsAction,"bndel":handleNavigationAndToolsAction,"dsauto":handleNavigationAndToolsAction,"dsclr":handleNavigationAndToolsAction,"pgetall":handleNavigationAndToolsAction,"dsel":handleNavigationAndToolsAction,"mget":handleNavigationAndToolsAction,"pget":handleNavigationAndToolsAction,"logoprev":handleNavigationAndToolsAction,"logoprevclose":handleNavigationAndToolsAction,"aievent-open":handleNavigationAndToolsAction,"aievent":handleNavigationAndToolsAction,"sfxplay":handleNavigationAndToolsAction,"sfxgen":handleNavigationAndToolsAction,"sfxall":handleNavigationAndToolsAction,"vtest":handleNavigationAndToolsAction,"dsopen":handleNavigationAndToolsAction,"dssave":handleNavigationAndToolsAction,"dsai":handleNavigationAndToolsAction,"shareopen":handleNavigationAndToolsAction,"sharego":handleNavigationAndToolsAction,"fbopen":handleNavigationAndToolsAction,"fbissue":handleNavigationAndToolsAction,"fbpost":handleNavigationAndToolsAction,"fbstar":handleNavigationAndToolsAction,"fbsend":handleNavigationAndToolsAction,"guidecopy":handleNavigationAndToolsAction,"skbdraw":handleNavigationAndToolsAction,"skbbuy":handleNavigationAndToolsAction,"reroll0":handleNavigationAndToolsAction,"cachewipe":handleNavigationAndToolsAction,"mailopen":handleMailAction,"mailview":handleMailAction,"mailget":handleMailAction,"mailall":handleMailAction,"mailclean":handleMailAction,"maildel":handleMailAction,"cxcat":handleStoryAndAuthoringAction,"cxview":handleStoryAndAuthoringAction,"cxadd":handleStoryAndAuthoringAction,"relopen":handleStoryAndAuthoringAction,"relgo":handleStoryAndAuthoringAction,"relseed":handleStoryAndAuthoringAction,"reladd":handleStoryAndAuthoringAction,"reledit":handleStoryAndAuthoringAction,"relsave":handleStoryAndAuthoringAction,"reldel":handleStoryAndAuthoringAction,"relundo":handleStoryAndAuthoringAction,"relrebuild":handleStoryAndAuthoringAction,"cxedit":handleStoryAndAuthoringAction,"cxsave":handleStoryAndAuthoringAction,"cxdel":handleStoryAndAuthoringAction,"cxnote":handleStoryAndAuthoringAction,"cxdisc":handleStoryAndAuthoringAction,"cxdeep":handleStoryAndAuthoringAction,"cxreadall":handleStoryAndAuthoringAction,"opening-play":handleStoryAndAuthoringAction,"char":handleStoryAndAuthoringAction,"evspoke":handleStoryAndAuthoringAction,"evreroll":handleStoryAndAuthoringAction,"stamopen":handleStoryAndAuthoringAction,"stamfill":handleStoryAndAuthoringAction,"stamtog":handleStoryAndAuthoringAction,"scimg":handleStoryAndAuthoringAction,"charedit":handleStoryAndAuthoringAction,"savechar":handleStoryAndAuthoringAction,"delchar":handleStoryAndAuthoringAction,"epedit":handleStoryAndAuthoringAction,"saveep":handleStoryAndAuthoringAction,"delep":handleStoryAndAuthoringAction,"aiep":handleStoryAndAuthoringAction,"thedit":handleStoryAndAuthoringAction,"saveth":handleStoryAndAuthoringAction,"delth":handleStoryAndAuthoringAction,"aithread":handleStoryAndAuthoringAction,"ststory":handleStoryAndAuthoringAction,"story":handleStoryAndAuthoringAction,"chedit":handleStoryAndAuthoringAction,"addstage":handleStoryAndAuthoringAction,"delstage":handleStoryAndAuthoringAction,"savech":handleStoryAndAuthoringAction,"stdetail":handleStoryAndAuthoringAction,"delch":handleStoryAndAuthoringAction,"world-open":handleStoryAndAuthoringAction,"saveworld":handleStoryAndAuthoringAction,"aiworld":handleStoryAndAuthoringAction,"opening-edit":handleStoryAndAuthoringAction,"aichapter-open":handleStoryAndAuthoringAction,"aichapter":handleStoryAndAuthoringAction,"reload":handleStoryAndAuthoringAction,"evopen":handleStoryAndAuthoringAction,"evbuy":handleStoryAndAuthoringAction,"evedit":handleStoryAndAuthoringAction,"evsave":handleStoryAndAuthoringAction,"evdel":handleStoryAndAuthoringAction,"dreroll":handleStoryAndAuthoringAction,"meta-open":handleStoryAndAuthoringAction,"metasave":handleStoryAndAuthoringAction,"draft-open":handleStoryAndAuthoringAction,"drlib":handleStoryAndAuthoringAction,"drlibsave":handleStoryAndAuthoringAction,"drlibload":handleStoryAndAuthoringAction,"drreuseoff":handleStoryAndAuthoringAction,"drxcur":handleStoryAndAuthoringAction,"drxlib":handleStoryAndAuthoringAction,"drxcopy":handleStoryAndAuthoringAction,"drxfile":handleStoryAndAuthoringAction,"drxback":handleStoryAndAuthoringAction,"drimport":handleStoryAndAuthoringAction,"drigo":handleStoryAndAuthoringAction,"drifile":handleStoryAndAuthoringAction,"drlibdel":handleStoryAndAuthoringAction,"drtab":handleStoryAndAuthoringAction,"drcadd":handleStoryAndAuthoringAction,"drcdel":handleStoryAndAuthoringAction,"drmode":handleStoryAndAuthoringAction,"drpreset":handleStoryAndAuthoringAction,"drautoex":handleStoryAndAuthoringAction,"drpfdraw":handleStoryAndAuthoringAction,"drcfill":handleStoryAndAuthoringAction,"drpolish":handleStoryAndAuthoringAction,"drharmony":handleStoryAndAuthoringAction,"drdedup":handleStoryAndAuthoringAction,"drundo":handleStoryAndAuthoringAction,"drpreview":handleStoryAndAuthoringAction,"drclear":handleStoryAndAuthoringAction,"drmanual":handleStoryAndAuthoringAction,"drmake":handleStoryAndAuthoringAction,"charregen":handleStoryAndAuthoringAction,"pxopen":handleSettingsAndAudioAction,"pxsave":handleSettingsAndAudioAction,"pxtest":handleSettingsAndAudioAction,"appre":handleSettingsAndAudioAction,"setupopen":handleSettingsAndAudioAction,"setname":handleSettingsAndAudioAction,"playmode":handleSettingsAndAudioAction,"sttab":handleSettingsAndAudioAction,"setsec":handleSettingsAndAudioAction,"apnew":handleSettingsAndAudioAction,"apedit":handleSettingsAndAudioAction,"apsave":handleSettingsAndAudioAction,"apdel":handleSettingsAndAudioAction,"apuse":handleSettingsAndAudioAction,"apfb":handleSettingsAndAudioAction,"aptest":handleSettingsAndAudioAction,"llmopen":handleSettingsAndAudioAction,"llmsave":handleSettingsAndAudioAction,"llmtog":handleSettingsAndAudioAction,"llmpadd":handleSettingsAndAudioAction,"llmpedit":handleSettingsAndAudioAction,"llmpdel":handleSettingsAndAudioAction,"llmpcopy":handleSettingsAndAudioAction,"llmpimport":handleSettingsAndAudioAction,"sndopen":handleSettingsAndAudioAction,"vclearall":handleSettingsAndAudioAction,"vprebuild":handleSettingsAndAudioAction,"sndsave":handleSettingsAndAudioAction,"fishtest":handleSettingsAndAudioAction,"voice":handleSettingsAndAudioAction,"vclear":handleSettingsAndAudioAction,"vsearch":handleSettingsAndAudioAction,"vsai":handleSettingsAndAudioAction,"vsplay":handleSettingsAndAudioAction,"vstry":handleSettingsAndAudioAction,"vspick":handleSettingsAndAudioAction,"vsetid":handleSettingsAndAudioAction,"elcompose":handleSettingsAndAudioAction,"syopen":handleStorageAndSharingAction,"sylink":handleStorageAndSharingAction,"sypush":handleStorageAndSharingAction,"sypushf":handleStorageAndSharingAction,"sypull":handleStorageAndSharingAction,"sysave":handleStorageAndSharingAction,"bkgo":handleStorageAndSharingAction,"pickgame":handleStorageAndSharingAction,"saveretry":handleStorageAndSharingAction,"pcopen":handleStorageAndSharingAction,"syoff":handleStorageAndSharingAction,"pcsave":handleStorageAndSharingAction,"pcoff":handleStorageAndSharingAction,"pcpush":handleStorageAndSharingAction,"pcpushf":handleStorageAndSharingAction,"pcpullgo":handleStorageAndSharingAction,"pchist":handleStorageAndSharingAction,"pchistgo":handleStorageAndSharingAction,"pcpull":handleStorageAndSharingAction,"resetth":handleStorageAndSharingAction,"importfile":handleStorageAndSharingAction,"pj-open":handleStorageAndSharingAction,"pjswitch":handleStorageAndSharingAction,"pjdel":handleStorageAndSharingAction,"pjblank":handleStorageAndSharingAction,"pubopen":handleStorageAndSharingAction,"pubgo":handleStorageAndSharingAction,"pubcopy":handleStorageAndSharingAction,"pubcopy2":handleStorageAndSharingAction,"subadd":handleStorageAndSharingAction,"subgo":handleStorageAndSharingAction,"subcheck":handleStorageAndSharingAction,"subapply":handleStorageAndSharingAction,"subskip":handleStorageAndSharingAction,"subcopy":handleStorageAndSharingAction,"subleave":handleStorageAndSharingAction,"pjreroll":handleStorageAndSharingAction,"pjdraftx":handleStorageAndSharingAction,"backup":handleStorageAndSharingAction,"importbk":handleStorageAndSharingAction,"raidgo":handleCombatAndFormationAction,"raidstart":handleCombatAndFormationAction,"rgnew":handleCombatAndFormationAction,"rfslot":handleCombatAndFormationAction,"rffil":handleCombatAndFormationAction,"rfauto":handleCombatAndFormationAction,"rfclr":handleCombatAndFormationAction,"rfpick":handleCombatAndFormationAction,"rfgo":handleCombatAndFormationAction,"rgnode":handleCombatAndFormationAction,"rgskip":handleCombatAndFormationAction,"rgrelic":handleCombatAndFormationAction,"dgmove":handleCombatAndFormationAction,"dgdown":handleCombatAndFormationAction,"rgcard":handleCombatAndFormationAction,"rgrest":handleCombatAndFormationAction,"rgupg":handleCombatAndFormationAction,"rgrm":handleCombatAndFormationAction,"rgdeck":handleCombatAndFormationAction,"cbplay":handleCombatAndFormationAction,"cbsel":handleCombatAndFormationAction,"cbult":handleCombatAndFormationAction,"cbend":handleCombatAndFormationAction,"cbtgt":handleCombatAndFormationAction,"cbdeck":handleCombatAndFormationAction,"cbquit":handleCombatAndFormationAction,"rgsave":handleCombatAndFormationAction,"rgleave":handleCombatAndFormationAction,"rgquit":handleCombatAndFormationAction,"opskip":handleCombatAndFormationAction,"stage":handleCombatAndFormationAction,"sortie":handleCombatAndFormationAction,"bauto":handleCombatAndFormationAction,"bspeed":handleCombatAndFormationAction,"bdone":handleCombatAndFormationAction,"opsch":handleCombatAndFormationAction,"opsback":handleCombatAndFormationAction,"fpick":handleCombatAndFormationAction,"fsl":handleCombatAndFormationAction,"fauto":handleCombatAndFormationAction,"ffil":handleCombatAndFormationAction,"fsave":handleCombatAndFormationAction,"fpre":handleCombatAndFormationAction,"farmgo":handleCombatAndFormationAction,"farmstart":handleCombatAndFormationAction,"webupdcheck":handleUpdatesAction,"webupdgo":handleUpdatesAction,"webupdskip":handleUpdatesAction,"updel":handleUpdatesAction,"upd-open":handleUpdatesAction,"updcheck":handleUpdatesAction,"updget":handleUpdatesAction,"updskip":handleUpdatesAction,"apkget":handleUpdatesAction,"relnotes":handleUpdatesAction,"uprollback":handleUpdatesAction,"upbuiltin":handleUpdatesAction,"csframe":handleCharactersAction,"cspoke":handleCharactersAction,"cstab":handleCharactersAction,"upgen":handleCharactersAction,"gift":handleCharactersAction,"giftgive":handleCharactersAction,"ainai":handleCharactersAction,"ailines":handleCharactersAction,"ailinesmore":handleCharactersAction,"upsave":handleCharactersAction,"upgo":handleCharactersAction,"wai":handleCharactersAction,"wfixall":handleCharactersAction,"regengo":handleCharactersAction,"regenapply":handleCharactersAction,"regenretry":handleCharactersAction,"regenedit":handleCharactersAction,"regencancel":handleCharactersAction,"ailooksall":handleCharactersAction,"ailooks":handleCharactersAction,"castre":handleImagesAndAssetsAction,"castfaces":handleImagesAndAssetsAction,"cfsel":handleImagesAndAssetsAction,"cfgo":handleImagesAndAssetsAction,"cfall":handleImagesAndAssetsAction,"castface":handleImagesAndAssetsAction,"castok":handleImagesAndAssetsAction,"castskip":handleImagesAndAssetsAction,"imgsave":handleImagesAndAssetsAction,"posegen":handleImagesAndAssetsAction,"posedel":handleImagesAndAssetsAction,"upload":handleImagesAndAssetsAction,"imgx":handleImagesAndAssetsAction,"npcscan":handleImagesAndAssetsAction,"npcopen":handleImagesAndAssetsAction,"npcsave":handleImagesAndAssetsAction,"npcdraw":handleImagesAndAssetsAction,"npctags":handleImagesAndAssetsAction,"npcdel":handleImagesAndAssetsAction,"npcadd":handleImagesAndAssetsAction,"cutclose":handleImagesAndAssetsAction,"lib":handleImagesAndAssetsAction,"libitem":handleImagesAndAssetsAction,"libnew":handleImagesAndAssetsAction,"castt":handleImagesAndAssetsAction,"naiopen":handleImagesAndAssetsAction,"naivariety":handleImagesAndAssetsAction,"naipreset":handleImagesAndAssetsAction,"packopen":handleImagesAndAssetsAction,"packuse":handleImagesAndAssetsAction,"packdel":handleImagesAndAssetsAction,"packcopy":handleImagesAndAssetsAction,"packimport":handleImagesAndAssetsAction,"packsave":handleImagesAndAssetsAction,"naisave":handleImagesAndAssetsAction,"cfload":handleImagesAndAssetsAction,"cftest":handleImagesAndAssetsAction,"naitest":handleImagesAndAssetsAction,"skinuse":handleImagesAndAssetsAction,"faceview":handleImagesAndAssetsAction,"faces-open":handleImagesAndAssetsAction,"facesel":handleImagesAndAssetsAction,"faceup":handleImagesAndAssetsAction,"faceupnew":handleImagesAndAssetsAction,"faceupmany":handleImagesAndAssetsAction,"facedel":handleImagesAndAssetsAction,"facetgt":handleImagesAndAssetsAction,"facebasic":handleImagesAndAssetsAction,"facemask":handleImagesAndAssetsAction,"facego":handleImagesAndAssetsAction,"skin-open":handleImagesAndAssetsAction,"skinlines":handleImagesAndAssetsAction,"skpartgen":handleImagesAndAssetsAction,"skpartall":handleImagesAndAssetsAction,"skpartup":handleImagesAndAssetsAction,"skingo":handleImagesAndAssetsAction,"skindel":handleImagesAndAssetsAction,"wnai":handleImagesAndAssetsAction,"imglib":handleImagesAndAssetsAction,"ilbtap":handleImagesAndAssetsAction,"ilbclear":handleImagesAndAssetsAction,"ilbdel":handleImagesAndAssetsAction,"bgmall":handleImagesAndAssetsAction,"bgmpick":handleImagesAndAssetsAction,"bgmpickall":handleImagesAndAssetsAction,"bgmallgo":handleImagesAndAssetsAction,"bgmplay":handleImagesAndAssetsAction,"bgmstop":handleImagesAndAssetsAction,"aupload":handleImagesAndAssetsAction,"naigen":handleImagesAndAssetsAction,"cutopen":handleImagesAndAssetsAction,"cutrun":handleImagesAndAssetsAction,"cutnai":handleImagesAndAssetsAction,"cutzoom":handleImagesAndAssetsAction,"cutundo":handleImagesAndAssetsAction,"cutnudge":handleImagesAndAssetsAction,"cuthere":handleImagesAndAssetsAction,"cutsave":handleImagesAndAssetsAction,"naigo":handleImagesAndAssetsAction,"naiagain":handleImagesAndAssetsAction,"naiedit":handleImagesAndAssetsAction,"naiuse":handleImagesAndAssetsAction,"naibatch":handleImagesAndAssetsAction,"naistop":handleImagesAndAssetsAction,"skinbuy":handleImagesAndAssetsAction,"skinpkgdel":handleImagesAndAssetsAction,"skinnew":handleImagesAndAssetsAction,"skinpromptsave":handleImagesAndAssetsAction,"daily":handleEconomyAction,"shkdraw":handleEconomyAction,"sparkopen":handleEconomyAction,"sparkgo":handleEconomyAction,"pull":handleEconomyAction,"puexist":handleEconomyAction,"puxpick":handleEconomyAction,"puxgo":handleEconomyAction,"pustoryretry":handleEconomyAction,"bsel":handleEconomyAction,"bnew":handleEconomyAction,"bedit":handleEconomyAction,"dispset":handleEconomyAction,"dispall":handleEconomyAction,"dispredo":handleEconomyAction,"dispgo":handleEconomyAction,"dispget":handleEconomyAction,"dispcancel":handleEconomyAction,"passreset":handleEconomyAction,"shopbuy":handleEconomyAction,"shopswap":handleEconomyAction,"shkedit":handleEconomyAction,"shksave":handleEconomyAction,"shkai":handleEconomyAction,"cashbuy":handleEconomyAction,"cashmonth":handleEconomyAction,"cashpkg":handleEconomyAction,"phone":handleMessengerAction,"openthread":handleMessengerAction,"phclose":handleMessengerAction,"phback":handleMessengerAction,"openfc":handleMessengerAction,"fcsend":handleMessengerAction,"fcphoto":handleMessengerAction,"fcphototog":handleMessengerAction,"chatimg":handleMessengerAction,"phpendx":handleMessengerAction,"chatimgsave":handleMessengerAction,"phpick":handleMessengerAction,"phmenu":handleMessengerAction,"phmenuclose":handleMessengerAction,"phadd":handleMessengerAction,"phaddback":handleMessengerAction,"phaddai":handleMessengerAction,"phaddsend":handleMessengerAction,"phsel":handleMessengerAction,"phselend":handleMessengerAction,"phdel":handleMessengerAction,"phdelblock":handleMessengerAction,"phdelall":handleMessengerAction,"phmode":handleMessengerAction,"phsay":handleMessengerAction,"phnew":handleMessengerAction,"fclear":handleMessengerAction});
document.addEventListener('click',async e=>{
  if(window.__SWIPED&&Date.now()-window.__SWIPED<450){ window.__SWIPED=0; return; }
  const el=e.target.closest('[data-tab],[data-act]'); if(!el) return;
  if(el.dataset.tab){if(NEW_GAME_SOURCE){toast('게임 생성이 끝날 때까지 기다려 주세요');return;} if(el.dataset.tab==='studio') STTAB=''; tab=el.dataset.tab;render();$('#view').scrollTop=0;return;}
  const a=el.dataset.act,id=el.dataset.id,p=P();
  if(NEW_GAME_SOURCE&&!['ailog','ailogcopy','saveretry'].includes(a)){toast('게임 생성이 끝날 때까지 기다려 주세요');return;}
  try{
  const handler=APP_ACTION_HANDLERS[a];if(handler)return await handler(a,el,id,p,e);
  }catch(error){toast('작업을 완료하지 못했습니다. '+(typeof ghSafeMessage==='function'?ghSafeMessage(error?.message||String(error)):'다시 시도해 주세요'));}
});
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal'&&!e.currentTarget.dataset.lock)window.navBack();});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!$('#modal').hidden){window.navBack();e.preventDefault();e.stopImmediatePropagation();}
  if(e.key==='Enter'&&e.target.dataset&&e.target.dataset.act==='poke') e.target.click();
  if(e.key==='Enter'&&e.target.id==='nm_in') document.querySelector('[data-act="setname"]').click();
});
document.addEventListener('input',e=>{
  const k=e.target.dataset.set; if(!k) return; const s=P().settings; s[k]=+e.target.value;
  if(/Rate$/.test(k)){ const v=$('#v_'+k); if(v) v.textContent=s[k]+'%'; mark('prog'); return; }
  if(s.ssr+s.sr>100){if(k==='ssr')s.sr=100-s.ssr;else s.ssr=100-s.sr;}
  $('#r_ssr').value=s.ssr;$('#r_sr').value=s.sr;$('#v_ssr').textContent=s.ssr+'%';$('#v_sr').textContent=s.sr+'%';$('#v_pity').textContent=s.pity+'회';
  if(P().pity>=s.pity)P().pity=s.pity-1; mark('prog');
});
document.addEventListener('change',async e=>{ if(e.target.id==='orient_sel'){ try{ appStorage.setItem('ggm-orient',e.target.value); }catch(_){} const ok=await applyOrient(); applyDesk(); toast(ok?'화면 방향을 바꿨어요':'이 앱·브라우저는 화면 고정을 지원하지 않아요. 새 APK로 업데이트하면 돼요'); return; } })
document.addEventListener('change',e=>{ if(e.target.id==='fsort'&&FORM){ FORM.sort=e.target.value; refreshForm(); return; } if(e.target.id==='ct_tol'||e.target.id==='ct_soft'){ return; } if(e.target.id==='np_frame'){ reNaiPrep(); return; } if(e.target.id==='desk_mode'){ try{appStorage.setItem('ggm-desk',e.target.value);}catch(_){} applyDesk(); return; } if(e.target.id==='np_style'||e.target.id==='np_posesel'){ if(e.target.id==='np_posesel'&&e.target.value!=='__custom') $('#np_pose').value=e.target.value; reNaiPrep(); return; } });
document.addEventListener('input',e=>{ if(e.target.id==='np_pose') reNaiPrep(); if(e.target.id==='ct_tol') $('#ct_tolv').textContent=e.target.value; if(e.target.id==='ct_soft') $('#ct_softv').textContent=e.target.value; if(e.target.id==='ct_ptol') $('#ct_ptolv').textContent=e.target.value; if(e.target.id==='ct_brush'){ $('#ct_brushv').textContent=e.target.value; cutPlaceCursor(); cutDrawLoupe(); } if(e.target.id==='ct_pmode'){ const br=['brush','restore'].includes(e.target.value); $('#ct_bs').hidden=!br; $('#ct_pt').hidden=br; $('.cutgo').lastChild.textContent=br?'커서 위치에 한 번 찍기':'커서 위치 지우기'; cutPlaceCursor(); cutDrawLoupe(); } });
document.addEventListener('change',e=>{if(e.target.id==='nai_prov'){ const cf=e.target.value==='comfy'; $('#comfyBox').hidden=!cf; $('#naiBox').hidden=cf; return; } if(e.target.id==='sw_img'){ swRead(); renderSetup(); return; } if(e.target.id==='ap_type'||e.target.id==='ap_pub'){readAp();APD.type=$('#ap_type').value;if($('#ap_pub'))APD.pub=$('#ap_pub').value;if(e.target.id==='ap_type'){APD.model='';APD.quick='';if(Object.values(AITYPE).includes(APD.name))APD.name='';} if(SW&&$('#ov .setup')) renderSetup(); else openAp();return;}});
document.addEventListener('change',e=>{const k=e.target.dataset&&e.target.dataset.pset; if(!k) return; P()[k]=e.target.value.trim(); mark('prog'); if(k!=='player') render(); else toast('이름을 저장했어요');});
