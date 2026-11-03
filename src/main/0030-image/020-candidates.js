/* IMAGE_CANDIDATES_MODULE */
/* Generated-image gallery. Images are borrowed; no draft or selection is changed here. */
function imagePreviewClose(){const view=document.getElementById('generated-image-preview');if(!view)return false;view._cleanup?.();const focus=view._returnFocus;view.remove();if(focus?.isConnected)focus.focus({preventScroll:true});return true;}
function imagePreviewOpen(src,alt,options={}){
 if(!src)return;const old=document.getElementById('generated-image-preview'),focus=old?old._returnFocus:document.activeElement;imagePreviewClose();
 const items=options.items?.length?options.items.map(x=>typeof x==='string'?{url:x}:x):[{url:src,alt}],original=options.originalSrc||'';
 let index=Math.max(0,Math.min(items.length-1,Number.isInteger(options.index)?options.index:items.findIndex(x=>x.url===src))),comparing=false,flashTimer;
 const view=document.createElement('div');view.id='generated-image-preview';view.tabIndex=-1;view.setAttribute('role','dialog');view.setAttribute('aria-modal','true');view.setAttribute('aria-label','생성 이미지 크게 보기');view._returnFocus=focus;
 view.style.cssText='position:fixed;inset:0;z-index:26000;background:#000;display:flex;flex-direction:column;padding:env(safe-area-inset-top,0px) 10px env(safe-area-inset-bottom,0px);touch-action:none;overscroll-behavior:contain;user-select:none';
 view.innerHTML=`<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:56px;flex:none"><span data-preview-counter role="status" aria-live="polite" style="color:white;padding:8px"></span><button type="button" class="btn sm ghost" data-preview-action="compare" ${original?'':'disabled'} title="${original?'누르는 동안 기존에 등록된 이미지를 표시합니다':'기존에 등록된 이미지가 없습니다'}" style="flex:none;touch-action:none;transform:translate(-12px,8px)">기존 이미지 보기</button></div><div data-preview-stage style="position:relative;flex:1;min-height:0;width:100%;overflow:hidden"><img data-preview-image draggable="false" style="display:block;width:100%;height:100%;object-fit:contain;pointer-events:none"><span data-preview-label hidden style="position:absolute;top:8px;left:50%;transform:translateX(-50%);background:#000b;color:white;padding:4px 12px;pointer-events:none">기존 이미지</span><button type="button" data-preview-action="previous" aria-label="이전 이미지" style="position:absolute;left:0;top:0;bottom:0;width:50%;background:transparent;border:0;padding:0"></button><button type="button" data-preview-action="next" aria-label="다음 이미지" style="position:absolute;right:0;top:0;bottom:0;width:50%;background:transparent;border:0;padding:0"></button></div><div style="display:flex;justify-content:flex-end;align-items:center;min-height:60px;flex:none"><button type="button" class="btn sm" data-preview-action="close" style="flex:none;transform:translate(-12px,-8px)">닫기</button></div>`;
 const img=view.querySelector('[data-preview-image]'),counter=view.querySelector('[data-preview-counter]'),label=view.querySelector('[data-preview-label]'),compare=view.querySelector('[data-preview-action=compare]'),stage=view.querySelector('[data-preview-stage]');
 function paint(){img.src=comparing?original:items[index].url;img.alt=comparing?'기존에 등록된 이미지':items[index].alt||alt||'생성된 이미지';counter.textContent=(index+1)+'/'+items.length;label.hidden=!comparing;view.dataset.index=String(index);view.dataset.comparing=String(comparing);compare.setAttribute('aria-pressed',String(comparing));}
 function hold(e){if(!original)return;e?.preventDefault();comparing=true;paint();if(e?.pointerId!=null)try{compare.setPointerCapture(e.pointerId);}catch(_){} }
 function release(){if(!comparing)return;comparing=false;paint();}
 function flash(side){stage.querySelector('[data-preview-edge]')?.remove();clearTimeout(flashTimer);const edge=document.createElement('div');edge.dataset.previewEdge=side;edge.style.cssText='position:absolute;top:0;bottom:0;width:33%;pointer-events:none;opacity:.3;'+side+':0;background:linear-gradient(to '+(side==='left'?'right':'left')+',rgba(255,255,255,1) 0%,rgba(255,255,255,.45) 45%,rgba(255,255,255,0) 100%)';stage.append(edge);if(edge.animate)edge.animate([{opacity:0},{opacity:.35,offset:.25},{opacity:0}],{duration:300,fill:'forwards'});flashTimer=setTimeout(()=>edge.remove(),320);}
 function move(delta){if(comparing)return;const next=index+delta;if(next<0||next>=items.length){flash(delta<0?'left':'right');return;}index=next;paint();}
 view._move=move;view._cleanup=()=>{clearTimeout(flashTimer);window.removeEventListener('blur',release);document.removeEventListener('visibilitychange',release);};
 for(const event of ['pointerdown','touchstart'])compare.addEventListener(event,hold,{passive:false});
 for(const event of ['pointerup','pointercancel','lostpointercapture','pointerleave','touchend','touchcancel'])compare.addEventListener(event,release);
 compare.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter')hold(e);});compare.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter')release();});compare.addEventListener('contextmenu',e=>e.preventDefault());compare.addEventListener('blur',release);window.addEventListener('blur',release);document.addEventListener('visibilitychange',release);
 view.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();const action=e.target.closest('[data-preview-action]')?.dataset.previewAction;if(action==='close')imagePreviewClose();else if(action==='previous')move(-1);else if(action==='next')move(1);});
 view.addEventListener('wheel',e=>e.preventDefault(),{passive:false});view.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});paint();document.body.append(view);view.focus({preventScroll:true});
}
function imagePreviewThumbnail(img){
 if(img.closest('#image-candidate-dialog')&&IMAGE_CANDIDATES){const d=IMAGE_CANDIDATES,index=[...document.querySelectorAll('.image-candidate-grid img')].indexOf(img);imagePreviewOpen(img.currentSrc||img.src,img.alt,{items:d.items.map((x,i)=>({url:x.url,alt:'후보 '+(i+1)})),index,originalSrc:d.config.originalSrc});return;}
 imagePreviewOpen(img.currentSrc||img.src,img.alt,{originalSrc:img.dataset.originalSrc||''});
}
let IMAGE_CANDIDATES=null;
function imageCandidateAbort(){return Object.assign(new Error('이미지 생성을 취소했어요.'),{code:'image_cancelled',name:'AbortError'});}
function imageCandidateBack(){if(imagePreviewClose())return true;if(!IMAGE_CANDIDATES)return false;IMAGE_CANDIDATES.back();return true;}
function imageCandidates(generate,initial={}){
 if(IMAGE_CANDIDATES)return Promise.reject(Object.assign(new Error('열려 있는 이미지 선택창을 먼저 마쳐 주세요.'),{code:'image_busy'}));
 return new Promise((resolve,reject)=>{
  const project=typeof PJ==='function'?PJ().active:null,root=document.createElement('div');root.id='image-candidate-dialog';
  root.style.cssText='position:fixed;inset:0;z-index:25000;background:#000b;display:flex;align-items:center;justify-content:center;padding:12px;overflow:auto';
  const d={root,phase:'count',count:1,selected:-1,items:[],busy:false,stopped:false,closed:false,round:0,config:{...initial},positions:{},error:''};IMAGE_CANDIDATES=d;
  let pulse=0;const controller=()=>new AbortController();
  function paintStatus(){const el=root.querySelector('#image-candidate-status');if(!el)return;el.textContent=d.busy?(d.stopped?'중단 중 · 현재 요청이 끝나면 중단합니다':(d.progress||`${d.items.length+1}/${d.count}장 이미지 생성 중`)+'.'.repeat(pulse%3+1)):`${d.items.length}/${d.count}장 생성 완료${d.stopped?' · 중단됨':''}`;}
  const timer=setInterval(()=>{if(!valid()){d.cancel();return;}pulse++;paintStatus();},450);
  const valid=()=>!d.closed&&IMAGE_CANDIDATES===d&&(typeof PJ!=='function'||PJ().active===project);
  const release=()=>{imagePreviewClose();for(const x of d.items)URL.revokeObjectURL(x.url);d.items=[];d.selected=-1;};
  const finish=(blob)=>{if(!valid()){d.cancel();return;}d.closed=true;d.round++;clearInterval(timer);d.controller?.abort();release();root.remove();IMAGE_CANDIDATES=null;if(blob)resolve(blob);else reject(imageCandidateAbort());};
  d.cancel=()=>{if(d.closed)return;d.closed=true;d.round++;clearInterval(timer);d.controller?.abort();release();root.remove();if(IMAGE_CANDIDATES===d)IMAGE_CANDIDATES=null;reject(imageCandidateAbort());};
  d.back=()=>{if(d.phase==='settings'){d.phase='results';render();return;}d.cancel();};
  function render(){
   if(!valid()){d.cancel();return;}
   const previous=root.querySelector('.sheet'),outerScroll=root.scrollTop;if(previous)d.positions[previous.dataset.phase]=previous.scrollTop;const selected=d.items[d.selected],disabled=d.busy||!selected;
   root.innerHTML=`<section class="sheet" data-phase="${d.phase}" role="dialog" aria-modal="true" aria-labelledby="image-candidate-title" style="width:100%;max-width:1000px;max-height:92dvh;overflow:auto"><div class="row" style="justify-content:space-between"><h2 id="image-candidate-title">${d.phase==='count'?'몇 장을 그릴까요?':d.phase==='settings'?'생성 설정 고치기':'생성 결과 선택'}</h2><button class="btn ghost sm" data-candidate="close" aria-label="${d.phase==='settings'?'결과로 돌아가기':'이미지 생성 취소'}" style="flex:0 0 32px;width:32px;height:32px;min-width:32px;min-height:32px;padding:0;font-size:22px;line-height:1;align-self:flex-start">×</button></div>${d.phase==='count'?`<p class="muted">2장·4장은 한 장씩 순서대로 생성한 뒤 하나를 골라 등록합니다.</p><div class="row">${[1,2,4].map(n=>`<button class="btn" data-candidate="count" data-count="${n}" style="flex:1">${n}장</button>`).join('')}</div>`:d.phase==='settings'?`${initial.prompt!==undefined?`<label class="f">프롬프트<textarea class="in" data-candidate-field="prompt" style="min-height:120px">${esc(d.config.prompt||'')}</textarea></label>`:''}${initial.neg!==undefined?`<label class="f">네거티브<textarea class="in" data-candidate-field="neg">${esc(d.config.neg||'')}</textarea></label>`:''}<label class="f">생성 장수<select class="in" data-candidate-field="count">${[1,2,4].map(n=>`<option value="${n}" ${d.count===n?'selected':''}>${n}장</option>`).join('')}</select></label><p class="muted">기존 그림 AI·크기·레퍼런스 설정은 유지합니다. 다시 생성하면 이전 후보는 폐기됩니다.</p><div class="row"><button class="btn" data-candidate="apply-settings">이 설정으로 다시 뽑기</button><button class="btn ghost" data-candidate="results">결과로 돌아가기</button></div>`:`<p role="status" aria-live="polite" id="image-candidate-status">${d.busy?`${d.items.length+1}/${d.count}장 생성 중${d.stopped?' · 현재 요청이 끝나면 중단합니다':'<span class="image-candidate-dots">…</span>'}`:`${d.items.length}/${d.count}장 생성 완료${d.stopped?' · 중단됨':''}`}</p>${d.error?`<p role="alert" style="color:#ffb4b4">${esc(d.error)}</p>`:''}<div class="image-candidate-grid" style="display:grid;grid-template-columns:repeat(${Math.min(d.count,2)},minmax(0,1fr));gap:10px;align-items:start">${Array.from({length:d.count},(_,i)=>{const x=d.items[i],on=d.selected===i;return `<div style="min-width:0;padding:4px;border:2px solid ${on?'#fff':'transparent'};border-radius:12px;${on?'background:color-mix(in srgb,var(--accent,#7b6bff) 22%,transparent)':''}"><div class="image-candidate-frame" style="background:#0003;border-radius:8px;overflow:hidden">${x?`<img src="${esc(x.url)}" alt="후보 ${i+1}" role="button" tabindex="0" aria-label="후보 ${i+1} 크게 보기" style="display:block;width:100%;height:auto;object-fit:contain;cursor:zoom-in">`:`<span class="muted" style="display:block;padding:32px 8px;text-align:center">${i+1}번</span>`}</div><button class="btn ${on?'':'ghost'}" data-candidate="select" data-index="${i}" aria-pressed="${on}" ${!x||d.busy?'disabled':''} style="width:100%;margin-top:8px;white-space:normal;${on?'outline:2px solid white;outline-offset:1px':''}">${on?'✓ 선택됨':'선택'}</button></div>`;}).join('')}</div><div class="image-candidate-actions"><button class="btn" data-candidate="register" ${disabled?'disabled':''} style="${disabled?'opacity:.35;cursor:default':''}">이걸로 등록</button><button class="btn ghost" data-candidate="again" ${d.busy?'disabled':''}>다시 뽑기</button><button class="btn ghost" data-candidate="settings" ${d.busy?'disabled':''}>설정 고치기</button>${d.busy?`<button class="btn ghost" data-candidate="stop" ${d.stopped?'disabled':''}>생성 중단</button>`:'<button class="btn ghost" data-candidate="discard">폐기후 닫기</button>'}</div><p class="muted">${d.count>1?'이미지 아래의 선택 버튼을 누른 뒤 등록해 주세요. ':''}등록 전에는 기존 이미지가 바뀌지 않습니다.</p>`}</section>`;
   paintStatus();const sheet=root.querySelector('.sheet');sheet.style.overflowAnchor='none';sheet.scrollTop=d.positions[d.phase]||0;root.scrollTop=outerScroll;
  }
  async function run(){
   release();d.error='';d.progress='';d.stopped=false;d.busy=true;d.phase='results';d.controller=controller();const round=++d.round;render();
   const prepared={...d.config};
   if(initial.prepare){try{await initial.prepare(prepared,message=>{if(valid()&&round===d.round){d.progress=message;paintStatus();}},d.controller.signal);}catch(e){if(!valid()||round!==d.round)return;if(!d.stopped)d.error='장면 구성 실패: '+naiErr(e);d.busy=false;render();return;}if(!valid()||round!==d.round)return;if(d.stopped){d.busy=false;render();return;}}
   Object.assign(d.config,prepared);d.progress='';paintStatus();
   for(let i=0;i<d.count;i++){
    if(!valid()||round!==d.round||d.stopped)break;
    const config={...prepared};if(i>0||round>1)config.seed='';
    try{paintStatus();const blob=await generate(config,i,d.controller.signal);if(!valid()||round!==d.round)return;if(d.stopped)break;d.items.push({blob,url:URL.createObjectURL(blob),config:{...config}});}
    catch(e){if(!valid()||round!==d.round)return;d.error=`${i+1}번째 이미지 생성 실패: ${naiErr(e)}${d.items.length?' · 완료된 후보는 선택해 등록할 수 있어요.':''}`;break;}
    if(i+1<d.count)render();
   }
   if(!valid()||round!==d.round)return;d.busy=false;if(d.count===1&&d.items.length){d.selected=0;if(initial.prepare){d.items[0].blob.__candidateConfig=d.items[0].config;finish(d.items[0].blob);return;}}render();
  }
  root.addEventListener('click',e=>{const b=e.target.closest('[data-candidate]');if(!b||b.disabled||!valid())return;const a=b.dataset.candidate;
   if(a==='close'){d.back();return;}
   if(a==='count'){d.count=Number(b.dataset.count);if(d.count===1&&!initial.prepare){d.closed=true;clearInterval(timer);root.remove();IMAGE_CANDIDATES=null;Promise.resolve().then(()=>generate({...d.config},0)).then(resolve,reject);}else run();return;}
   if(a==='stop'){d.stopped=true;d.controller?.abort();render();return;}
   if(d.busy)return;
   if(a==='discard'){d.cancel();return;}
   if(a==='select'){const i=Number(b.dataset.index);if(d.items[i]){d.selected=i;for(const [j,card]of [...root.querySelector('.image-candidate-grid').children].entries()){const on=j===i,b=card.querySelector('[data-candidate=select]');card.style.borderColor=on?'#fff':'transparent';card.style.background=on?'color-mix(in srgb,var(--accent,#7b6bff) 22%,transparent)':'';b.className='btn'+(on?'':' ghost');b.textContent=on?'✓ 선택됨':'선택';b.setAttribute('aria-pressed',String(on));b.style.outline=on?'2px solid white':'';b.style.outlineOffset=on?'1px':'';}const register=root.querySelector('[data-candidate=register]');register.disabled=false;register.style.opacity='';register.style.cursor='';}return;}
   if(a==='register'){const x=d.items[d.selected];if(!x)return;try{x.blob.__candidateRegistered=true;x.blob.__candidateConfig=x.config;}catch(_){}finish(x.blob);return;}
   if(a==='again'){run();return;}
   if(a==='settings'){d.phase='settings';render();return;}
   if(a==='results'){d.phase='results';render();return;}
   if(a==='apply-settings'){for(const el of root.querySelectorAll('[data-candidate-field]')){const k=el.dataset.candidateField;if(k==='count')d.count=Number(el.value);else d.config[k]=el.value;}d.config.promptParts=naiBlocksFieldParts(root.querySelector('[data-candidate-field=prompt]'));run();}
  });
  const style=document.getElementById('image-candidate-style');if(!style){const s=document.createElement('style');s.id='image-candidate-style';s.textContent='@keyframes imageCandidateDots{0%,100%{opacity:.3}50%{opacity:1}}.image-candidate-dots{display:inline-block;animation:imageCandidateDots .9s infinite}#image-candidate-dialog button:disabled{pointer-events:none}.image-candidate-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:16px}.image-candidate-actions>.btn.ghost:not(:disabled){background:#443952;color:#fff;border:1px solid #a293b5;opacity:1;box-shadow:inset 0 1px 0 #ffffff18}.image-candidate-actions>.btn.ghost:not(:disabled):hover{background:#574969;border-color:#d9cbea}.image-candidate-actions>.btn.ghost:not(:disabled):active{background:#65547a}.image-candidate-actions>.btn:disabled{opacity:.35}.image-candidate-actions>.btn{width:100%;min-width:0;padding-inline:10px;min-height:44px;white-space:normal;word-break:keep-all;overflow-wrap:normal}@media(min-width:640px){.image-candidate-actions{grid-template-columns:repeat(4,minmax(0,1fr))}}';document.head.append(s);}
  document.body.append(root);render();
 });
}
// Only explicitly requested manual generation offers candidates; automatic/batch work stays single.
function imageCandidateEligible(kind,target,owner,mode='manual'){
 if(mode!=='manual')return false;
 if(kind==='enemy')return true;
 if(typeof G==='undefined'||!G)return false;
 const c=owner||(kind==='char'?target:null);
 const character=(G.chars||[]).includes(c),npc=(G.npcs||[]).includes(c);
 return character&&['char','upper','illust','lbcg','scg','pose','lbbg','weapon','face'].includes(kind)||npc&&['char','upper','face'].includes(kind);
}
// Lock only the page/sheets below the top image dialog; keep its own scroll usable.
function imageScrollGuard(){
 const locks=new Map();let savedPage=null,touch=null;
 const top=()=>document.getElementById('app-confirm-dialog')||document.getElementById('generated-image-preview')||document.getElementById('image-candidate-dialog')||document.getElementById('v2-icon-dialog')||(()=>{const m=document.getElementById('modal');return m&&!m.hidden&&m.querySelector('.naiprev,#np_in,#cutCv,.skp-img,.preset-code-sheet')?m:null;})();
 function sync(){if(typeof document==='undefined'||!document?.body)return;const root=top(),targets=root?[document.documentElement,document.body,...document.querySelectorAll('#app main,#modal>.sheet,#v2-icon-dialog>.sheet,#image-candidate-dialog>.sheet')].filter(el=>!root.contains(el)):[];
  for(const [el,old]of locks)if(!targets.includes(el)){for(const [k,v,priority]of old.styles){if(v)el.style.setProperty(k,v,priority);else el.style.removeProperty(k);}el.scrollTop=old.y;el.scrollLeft=old.x;locks.delete(el);}
  if(root&&!savedPage){savedPage={x:window.scrollX,y:window.scrollY,styles:['position','top','left','width'].map(k=>[k,document.body.style.getPropertyValue(k),document.body.style.getPropertyPriority(k)])};document.body.style.position='fixed';document.body.style.top=-savedPage.y+'px';document.body.style.left=-savedPage.x+'px';document.body.style.width='100%';}
  for(const el of targets)if(!locks.has(el)){locks.set(el,{styles:['overflow','overscroll-behavior'].map(k=>[k,el.style.getPropertyValue(k),el.style.getPropertyPriority(k)]),x:el.scrollLeft,y:el.scrollTop});el.style.setProperty('overflow','hidden');el.style.setProperty('overscroll-behavior','none');}
  if(!root&&savedPage){const old=savedPage;savedPage=null;for(const [k,v,p]of old.styles){if(v)document.body.style.setProperty(k,v,p);else document.body.style.removeProperty(k);}window.scrollTo(old.x,old.y);}
 }
 function consumes(target,root,dy,dx){for(let el=target?.nodeType===1?target:target?.parentElement;el&&root.contains(el);el=el.parentElement){const css=getComputedStyle(el);if(/auto|scroll/.test(css.overflowY||css.overflow)&&el.scrollHeight>el.clientHeight+1&&(dy<0?el.scrollTop>0:dy>0&&el.scrollTop+el.clientHeight<el.scrollHeight-1))return true;if(!dy&&/auto|scroll/.test(css.overflowX||css.overflow)&&el.scrollWidth>el.clientWidth+1&&(dx<0?el.scrollLeft>0:dx>0&&el.scrollLeft+el.clientWidth<el.scrollWidth-1))return true;}return false;}
 document.addEventListener('wheel',e=>{const root=top();if(root&&(!root.contains(e.target)||!consumes(e.target,root,e.deltaY,e.deltaX)))e.preventDefault();},{capture:true,passive:false});
 document.addEventListener('touchstart',e=>{const t=e.touches[0];touch=t?{x:t.clientX,y:t.clientY}:null;},{capture:true,passive:true});
 document.addEventListener('touchmove',e=>{const root=top(),t=e.touches[0];if(!root||!t||!touch)return;const dx=touch.x-t.clientX,dy=touch.y-t.clientY;touch={x:t.clientX,y:t.clientY};if(!root.contains(e.target)||!consumes(e.target,root,dy,dx))e.preventDefault();},{capture:true,passive:false});
 new MutationObserver(sync).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});sync();
}
(function(){
 imageScrollGuard();
 const generate=naiGenerate,emotion=naiEmotion,inpaint=focusedInpaint;
 naiGenerate=function(prompt,kind,opts={}){if(!opts.candidateEligible||opts.candidateBypass)return generate(prompt,kind,opts);return imageCandidates(async cfg=>{const op={...opts,neg:cfg.neg,seed:cfg.seed};const blob=await generate(cfg.prompt,kind,op);Object.assign(opts,{usedSeed:op.usedSeed,usedModel:op.usedModel,usedTp:op.usedTp});return blob;},{prompt,promptBlocks:['char','illust','lbcg','enemy'].includes(kind),promptParts:opts.promptParts,neg:opts.neg,seed:opts.seed,originalSrc:opts.originalSrc,prepare:opts.prepareCandidates});};
 naiEmotion=function(src,emo,extra,level,eligible=false,originalSrc=''){if(!eligible)return emotion(src,emo,extra,level);return imageCandidates(cfg=>emotion(src,emo,cfg.prompt,level),{prompt:extra||'',originalSrc});};
 // Selection must compare the final full-size composition, never the cropped face.
 focusedInpaint=function(src,mask,draw,settings={}){if(!settings.candidateEligible)return inpaint(src,mask,(...args)=>draw(...args,settings));return imageCandidates(cfg=>inpaint(src,mask,(...args)=>draw(...args,cfg)),settings);};
 const thumbnails='#image-candidate-dialog img, .naiprev.done img, #v2-icon-dialog .ill-box img, .skp-img img, .cs-sheet [data-character-preview]';
 document.addEventListener('click',e=>{const img=e.target.closest?.(thumbnails);if(!img)return;e.preventDefault();e.stopImmediatePropagation();imagePreviewThumbnail(img);},true);
 document.addEventListener('keydown',e=>{if(document.getElementById('generated-image-preview')&&['Escape','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();if(e.key==='Escape')imagePreviewClose();else document.getElementById('generated-image-preview')._move(e.key==='ArrowLeft'?-1:1);return;}const img=e.target.closest?.(thumbnails);if(img&&['Enter',' '].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();imagePreviewThumbnail(img);return;}if(e.key==='Escape'&&IMAGE_CANDIDATES){e.preventDefault();e.stopImmediatePropagation();imageCandidateBack();}},true);
})();

/* /IMAGE_CANDIDATES_MODULE */
