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

