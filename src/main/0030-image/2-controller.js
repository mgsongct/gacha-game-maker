/* ===== 0030-image — Controller(동작을 받아 Model을 바꾸고 다시 그리게 함 · 섞인 함수는 나눌 것) ===== */
/* src/main/0030-image/010-engine.js에서 옮김 */
async function regenApply(){const R=REGEN;if(!R||R.busy)return;const c=charById(R.cid);if(!c)return;try{regenAssertCurrent(R);regenReadPreview(R);}catch(e){toast(e.message);return;}R.busy=true;R.controller=new AbortController();
 const status=t=>say('#regen-apply-status',t);regenButtonsLock(true);
 try{const nc=R.nc,S=R.sel;let report=R.report;
  if(S.skill){status('선택한 스킬의 최종 유효성과 성능을 확인하는 중…');const errors=GGMCombat.validate(nc.skills);if(errors.length)throw new Error(errors.join(' '));const result=await v2Job('inspectSkill',[v2CharacterInput(nc),{...v2Options(),referenceSlot:R.slot}],{signal:R.controller.signal});v2CheckCancelled(R.controller.signal);if(REGEN!==R)return;if(result.report.status==='strong')throw new Error('세대 기준보다 강해졌어요. 다시 생성하거나 스킬 편집기에서 조정해 주세요.');report=result.report;}
  regenAssertCurrent(R);if(REGEN!==R)return;R.committing=true;const old=c.name,oldWeapon=c.weapon,base=clone(v2Ensure(c)),cleanup=[];
  if(S.name){c.name=nc.name;if(c.name!==old)renameEverywhere(old,c.name);c.faction=nc.faction;const F=G.world.factions=G.world.factions||[];if(c.faction&&!F.some(x=>x.name===c.faction)){F.push({name:c.faction,desc:c.name+'의 소속'});mark('world');}}
  if(S.profile)for(const k of ['profile','intro','files'])if(nc[k]!==undefined)c[k]=clone(nc[k]);
  if(S.look&&nc.naiPrompt!==c.naiPrompt){c.naiPrompt=stripMinor(stripAge(nc.naiPrompt));if(nc.naiBlocks?.naiPrompt)c.naiBlocks={...c.naiBlocks,naiPrompt:clone(nc.naiBlocks.naiPrompt)};for(const o of [c,c.upper,c.illust,c.lbcg,c.pose,c.lbbg,c.scg,...(c.faces||[]),...(c.faces||[]).map(f=>f.up)])if(o&&o.img)cleanup.push(imgClear(o));delete c.faceMask;charCGs(c).forEach(l=>{if(l.img){l.redraw=true;mark('l:'+l.id);}});}
  if(S.weapon){if(oldWeapon?.img)cleanup.push(imgClear(oldWeapon));c.weapon={...oldWeapon,name:nc.weapon.name,desc:nc.weapon.desc,prompt:nc.weapon.prompt,id:'w_'+c.id,img:null};delete c.weapon.seed;const ow=oldWeapon?.name||'',nw=nc.weapon.name;if(weaponRenameOk(ow,nw))renameEverywhere(ow,nw);}
  if(S.skill){c.skills={...base,[R.slot]:clone(nc.skills[R.slot])};c.skillConcept=nc.skillConcept||c.skillConcept||'';regenKeepPlan(c,nc);c.skillTuning='manual';v2EquipmentSkillSaved(c,R.slot,base[R.slot],c.skills[R.slot],true);c.skillDesignLog=clone(R.history);if(R.fallback)c.skillGenerationWarning='검사한 복구 초안을 사용 중입니다.';else delete c.skillGenerationWarning;delete c.skillGenerationNotice;c.skillBalance={...report,fingerprint:v2Fingerprint(c)};}
  if(S.lines)for(const k of ['lines','affLines','lvLines','dupLines','touch'])if(nc[k]!==undefined)c[k]=clone(nc[k]);
  v2SyncEquipment(c);mark('c:'+c.id);await Promise.allSettled(cleanup);if(REGEN!==R||PJ().active!==R.project)return;REGEN=null;closeModal();render();openChar(c.id);toast('선택한 항목을 적용했어요. 강화 단계는 유지돼요.');
 }catch(e){if(REGEN===R){status(e.name==='AbortError'?'적용을 중단했어요.':e.message);toast(e.message);}}
 finally{R.busy=false;R.committing=false;if(REGEN===R)regenButtonsLock(false);}
}
// One scene per candidate round; no character data is saved before image registration.
function generateUltimateCutin(c){
 const o=scgOf(c),project=PJ().active,snapshot=ultimateSceneSnapshot(c),input=document.getElementById('sc_scene'),draft=input?.value;
 const valid=()=>PJ().active===project&&charById(c.id)===c&&ultimateSceneSnapshot(c)===snapshot&&(!input||(input.isConnected&&input.value===draft));
 const check=()=>{if(!valid())throw new Error('캐릭터나 궁극기 설정이 바뀌었어요. 창을 다시 열어 생성해 주세요.');};
 return imageCandidates(async(cfg,index,signal)=>{
  check();v2CheckCancelled(signal);let refs=[];if(autoRefOn('scg'))refs=await standRefs([c]);check();v2CheckCancelled(signal);
  return naiDrawItem0({k:'scg',o:{...o,prompt:cfg.prompt},c},{candidateEligible:false,refs,seed:cfg.seed});
 },{promptBlocks:true,prompt:draft??o.prompt??'',originalSrc:imgSrcRaw(o)||'',prepare:async(cfg,progress,signal)=>{
  check();if(cfg.sceneReady)return;progress('궁극기·캐릭터 컨셉을 바탕으로 컷인 장면 구성 중');
  cfg.sceneTags=await requestUltimateScene(c,cfg.prompt,signal);check();cfg.prompt=cfg.sceneTags;cfg.sceneReady=true;
 }}).then(blob=>{check();return blob;});
}
async function openNaiGen(kind,id,custom){
  const o=naiTarget(kind,id); if(!o) return;
  const c=naiCfg(), k=kind==='char'?'char':kind==='weapon'?'prop':o.kind, job={kind,id,custom,originalSrc:imgSrcRaw(o)||''}; NAIJOB=job;
  openModal(naiDrawingHTML(o,k));
  try{
    const op={originalSrc:job.originalSrc,promptParts:custom.promptParts,candidateEligible:custom.candidateEligible===true||imageCandidateEligible(kind==='lib'?o.kind:kind,o,charById(id)),neg:custom.neg,seed:custom.seed,model:custom.model,size:custom.size,chars:custom.chars,onRetry:(a,n,why)=>{if(NAIJOB===job)say('#nai_stat',`${why} · 다시 시도 ${a}/${n-1}…`);}};
    if(custom.ref){
      const rf={type:custom.ref.type,strength:custom.ref.strength,fidelity:custom.ref.fidelity};
      if(k==='char'&&imgSrc(o)) op.refs=[Object.assign({image:await refImage(imgSrc(o))},rf)];
      if(ILK(k)){ const ow=charById(id); if(ow&&imgSrc(ow)) op.refs=[Object.assign({image:await refImage(imgSrc(ow))},rf)]; }
      if(k==='cg'){ op.refs=[]; for(const x of cgCast(o)) if(imgSrc(x.c)) op.refs.push(Object.assign({image:await refImage(imgSrc(x.c))},rf)); }
    }
    if(custom.i2i&&imgSrc(o)){ const [w,h]=custom.size||naiSize(k,c); op.img2img={image:await imgB64(imgSrc(o),w,h,'#ffffff'),strength:custom.i2i.strength,noise:custom.i2i.noise}; op.noCut=false; }
    const scenePrep=['illust','lbcg'].includes(kind)&&!custom.sceneReady?illustrationScenePreparation(charById(id),kind,custom):null;
    if(scenePrep)op.prepareCandidates=scenePrep;
    const blob=await naiGenerate(custom.input,k,op);
    scenePrep?.check();
    if(blob.__candidateConfig){custom.promptParts=blob.__candidateConfig.promptParts;custom.input=blob.__candidateConfig.prompt;custom.neg=blob.__candidateConfig.neg??custom.neg;custom.sceneTags=blob.__candidateConfig.sceneTags;custom.sceneReady=!!blob.__candidateConfig.sceneReady;}
    if(NAIJOB!==job) return;
    job.blob=blob; job.seed=op.usedSeed; NLASTSEED[id]=''; if(blob.__candidateRegistered){await registerNaiJob();return;} const url=URL.createObjectURL(blob);
    openModal(naiResultHTML(o,op,k,url,job));
    NAIJOB=job;
  }catch(e){ if(NAIJOB!==job) return; if(e?.code==='image_cancelled'){window.navBack();return;} NAIJOB=null; closeModal(); toast(naiErr(e)); }
}
async function registerNaiJob(){ const j=NAIJOB; if(!j||!j.blob) return; NAIJOB=null; const o=naiTarget(j.kind,j.id); if(!o) return;
      if(j.kind==='weapon'){ await storeImage(o,j.blob,''); mark('c:'+j.id); render(); openChar(j.id); toast(T('weapon')+' 이미지를 등록했어요'); return; }
      if(ILK(j.kind)){ await storeImage(o,j.blob,''); if(j.custom.sceneTags)o.prompt=j.custom.sceneTags; mark('c:'+j.id); render(); openChar(j.id); toast(j.kind==='lbcg'?T('limit')+' CG를 등록했어요':'일러스트를 등록했어요'); return; }
      await storeImage(o,j.blob,j.kind==='char'?'c:':'l:'); render(); if(j.kind==='char') openChar(o.id); else openLibItem(o.id); toast(`${o.name} 이미지를 등록했어요`);
      if(j.kind==='char'&&o.upper&&!imgSrc(o.upper)&&o.naiPrompt&&imgReady()){ artRun(new Set([artKey({k:'upper',o:o.upper,c:o})])); setTimeout(()=>toast(`${o.name} 상반신도 이어서 그려요`),1200); } return;
}
async function naiBatch(kind){
  const items=G.lib.filter(l=>l.kind===kind&&!l.img&&((l.prompt||'').trim()||(kind==='cg'&&cgCast(l).length)));
  if(!items.length){toast('그릴 미등록 항목이 없어요');return;}
  if(!imgReady()){toast(imgNeed());return;}
  if(NAIBATCH){toast('이미 일괄 생성 중이에요');return;}
  const job={stop:false}; NAIBATCH=job; let done=0;
  openModal(naiBatchHTML(items));
  for(const l of items){
    if(job.stop) break; say('#nbStat',`${done} / ${items.length} · ${l.name} 그리는 중`);
    try{ const b=await naiDrawItem({k:kind,o:l}); await storeImage(l,b,'l:'); done++; await wait(600); }catch(e){ toast(naiErr(e)); break; }
  }
  NAIBATCH=null; render(); if($('#nbStat')) openLib(kind); toast(`${done}개를 그려서 등록했어요`);
}
function skinRefresh(id){ if($('#modal .sheet.cs-sheet')) openChar(id); else if($('#sk_name')) openSkin(id); else render(); }
function skinPartDraw(c,k,x,generationMode='automatic'){ const inp=$('#skscene_'+k.id); if(inp){k.scene=inp.value.trim();naiBlocksSave(k,'scene',inp);} const scene=k.scene||'',candidateEligible=imageCandidateEligible('char',x==='stand'?k:skinPart(k,x),c,generationMode),originalSrc=imgSrcRaw(x==='stand'?k:skinPart(k,x))||'';
  if(x==='stand') return naiDraw('char',k.prompt,{candidateEligible,originalSrc,styleId:c.naiStyle,frame:c.naiFrame});
  if(x==='upper') return naiDraw('char',k.prompt,{candidateEligible,originalSrc,frame:'cowboy shot',pose:'looking at viewer, smile',styleId:c.naiStyle});
  return naiDraw(x,joinTags(k.prompt,scene||(x==='lbcg'?(c.lbcg&&c.lbcg.prompt)||'dramatic lighting, sparkles, smile, wind':(c.illust&&c.illust.prompt)||'')),{candidateEligible,originalSrc,styleId:c.naiStyle}); }
async function skinPartGen(c,k,xs,rep,generationMode='manual'){ if(!imgReady()){ toast(imgNeed()); return; } if(!k.prompt){ toast('이 '+T('skin')+'은 프롬프트가 없어서 그릴 수 없어요. 올리기를 써 주세요'); return; }
  const game=G,project=PJ().active;if(rep)rep('그리는 중…');let n=0;
  for(const x of xs){ try{ const b=await skinPartDraw(c,k,x,generationMode);if(G!==game||PJ().active!==project||charById(c.id)!==c||!c.skins.includes(k))throw Error('대상이 바뀌어 스킨 생성을 중단했습니다');await storeImage(x==='stand'?k:skinPart(k,x),b,''); n++; mark('c:'+c.id); }catch(e){ toast(naiErr(e)); break; } }
  if(rep)rep.end();if(n)toast(`${k.name}: ${n}장 완성`);skinRefresh(c.id);render(); }
/* src/main/0030-image/0330-casting.js에서 옮김 */
function npcRead(n){ const el=document.getElementById('npc_'+n.id); if(!el) return; const old=n.name; el.querySelectorAll('[data-nf]').forEach(f=>{ n[f.dataset.nf]=f.value.trim(); }); naiBlocksSave(n,'naiPrompt',el.querySelector('[data-nf=naiPrompt]')); n.name=n.name||old; if(n.upper) n.upper.name=n.name+' 상반신'; n.naiPrompt=stripMinor(stripAge(n.naiPrompt||'')); mark('meta'); return old; }
async function npcDraw(n,k){ if(!imgReady()){ toast(imgNeed()); return; } if(!String(n.naiPrompt||'').trim()){ toast('외형 프롬프트를 먼저 적어 주세요'); return; }
  NPCBUSY.add(n.id); npcRefresh(n.id);
  try{ const it=k==='upper'?{k:'upper',o:n.upper,c:n}:{k:'char',o:n,c:n}; const b=await naiDrawItem({...it,generationMode:'manual'}); await storeImage(it.o,b,k==='upper'?'':'c:'); mark('meta'); toast(`${n.name} ${k==='upper'?'상반신':'스탠딩'}을(를) 그렸어요`); }
  catch(e){ toast(naiErr(e)); } finally{ NPCBUSY.delete(n.id); npcRefresh(n.id); } }
async function castRun(){ if(!CAST||CAST.busy) return; if(PREPJOB){ setTimeout(castRun,4000); return; }
  while(CAST&&CAST.q.length){ while(CAST&&(document.querySelector('.mpaint')||($('#castGrid')&&!$('#modal').hidden))) await wait(1500); if(!CAST||!CAST.q.length) break; const it=CAST.q.shift(), c=castById(it.c); if(!c) continue; CAST.busy=it; castRefresh(c.id);
    try{ if(it.k==='face'){ if(!(c.faceMask||{})[it.b]||!imgSrc(it.b==='up'?c.upper:c)) throw Object.assign(new Error('얼굴 범위가 없어요'),{code:'skip'}); let f=c.faces.find(q=>q.name===it.name); if(!f){ f={id:'f'+uid(),name:it.name,img:null}; c.faces.push(f); } await faceDrawOne(c,c,f,it.name,it.b,castFaceOpt(),''); }
      else if(it.k==='full'){ const b=await naiDrawItem({k:'char',o:c,c}); await storeImage(c,b,'c:'); (c.faces||[]).forEach(f=>{ f.img=null; if(f.up) f.up.img=null; }); if(c.faceMask) delete c.faceMask.full; }
      else { const b=await naiDrawItem({k:'upper',o:c.upper,c}); await storeImage(c.upper,b,''); (c.faces||[]).forEach(f=>{ if(f.up) f.up.img=null; }); if(c.faceMask) delete c.faceMask.up; }
      mark('c:'+c.id); if(c.npc) mark('meta'); }
    catch(e){ if(e&&['nai_locked','rate_limited'].includes(e.code)&&(it.tries||0)<4){ it.tries=(it.tries||0)+1; CAST.q.unshift(it); CAST.busy=null; await wait(8000); continue; } // 다른 그림과 겹치면 잠시 뒤 다시
      toast(naiErr(e,c.name+' 그림 실패')); if(e&&['image_cancelled','image_busy','nai_nokey','bad_key','low_credit','network','nai_locked','comfy_nourl','comfy_nowf'].includes(e.code)){ CAST.q=[]; } }
    if(!CAST) return; CAST.busy=null; castRefresh(c.id); if(!$('#castGrid')){ if($('#modal').hidden) render(); else if($('#modal [data-act="castface"],#modal .fc-grid')&&FACET.cid===c.id) try{ openFaces(c.id); }catch(e){} } await wait(600); }
  castStat(); }
/* src/main/0030-image/100-images-and-assets.js에서 옮김 */
async function handleImagesAndAssetsAction(a,t,id,p,e){
  switch(a){
case 'castre': { if(!CAST) break; const k=t.dataset.k; if(!CAST.q.some(x=>x.c===id&&x.k===k)&&!(CAST.busy&&CAST.busy.c===id&&CAST.busy.k===k)) CAST.q.push({c:id,k}); castRefresh(id); castRun(); break; }
case 'castfaces': openCastFaces(); break;
case 'cfsel': { const set=t.dataset.k==='f'?CFSEL.faces:CFSEL.chars, v=t.dataset.v; set.has(v)?set.delete(v):set.add(v); chipOn(t,set.has(v)); break; }
case 'cfgo': castFacesGo(); break;
case 'cfall': { const on=t.dataset.v==='1'; castChars().filter(c=>!c.npc&&imgSrc(c)).forEach(c=>on?CFSEL.chars.add(c.id):CFSEL.chars.delete(c.id)); castCharChipsShow(on); break; }
case 'castface': { if(CAST&&CAST.busy){ toast('그리는 중이 끝나면 열 수 있어요'); break; } FACET={cid:id,sid:''}; openFaces(id); break; }
case 'castok': case 'castskip': { if(a==='castok'&&CAST&&(CAST.busy||CAST.q.length)&&!(await appConfirm('아직 그리는 그림이 있어요. 나머지는 게임하면서 그릴까요?'))) break; P().castDone=1; mark('prog'); if(CAST) CAST.q=[];
      const go=()=>{ if(CAST&&CAST.busy){ say('#castStat','지금 그리는 한 장만 마치고 넘어가요…'); return setTimeout(go,500); } CAST=null; showStart(); }; go(); break; }
case 'imgsave': { const c=charById(id), it=c&&charImgList(c).find(([o])=>o.id===t.dataset.o); if(it) saveImgUrl(imgSrcRaw(it[0]),c.name+'_'+it[1]); break; }
case 'posegen': { const c=charById(id); if(!c||!c.pose||!c.lbbg) break; if(!imgReady()){ toast(imgNeed()); break; } const w=t.dataset.w||'both'; if(w!=='bg'&&!c.naiPrompt){ toast('먼저 NAI 프롬프트를 채워 주세요'); break; }
      const sc=$('#lbbg_scene'); if(sc){ c.lbbg.prompt=sc.value.trim();naiBlocksSave(c.lbbg,'prompt',sc); mark('c:'+c.id); } const done=busy(t,'그리는 중…');
      try{ if(w!=='pose'){ toast('배경을 그리는 중이에요'); const b=await naiDrawItem({k:'lbbg',o:c.lbbg,c,generationMode:'manual'}); await storeImage(c.lbbg,b,''); }
        if(w!=='bg'){ toast('투명 포즈를 그리는 중이에요'); const b=await naiDrawItem({k:'pose',o:c.pose,c,generationMode:'manual'}); await storeImage(c.pose,b,''); }
        mark('c:'+c.id); if(P().lobbyMode==='stand'){ P().lobbyMode='auto'; mark('prog'); toast('로비 표시를 \'자동\'으로 바꿨어요(레이어가 먼저 나와요)'); } else toast('로비 레이어를 그렸어요'); openChar(c.id); render(); }
      catch(err){ toast(naiErr(err,'그리기 실패')); done(); } break; }
case 'posedel': { if(playMode())break;const c=charById(id); if(!c||!c.pose) break; if(!(await appConfirm('포즈 그림을 지우고 상반신으로 표시할까요? 배경은 유지돼요.'))) break; await imgClear(c.pose); mark('c:'+c.id); openChar(c.id); render(); break; }
case 'upload': uploadFor={kind:t.dataset.k,id}; $('#file').click(); break;
case 'imgx': { const k=t.dataset.k, {o,what,after}=imgTarget(k,id,t);
      if(!o||!o.img) break; if(!(await appConfirm(`${what||'그림'}을(를) 지울까요? (항목은 남아요)`))) break;
      await imgClear(o); if(k==='char'){ (o.faces||[]).forEach(f=>{ if(f.img&&f.auto) imgClear(f); }); delete o.faceMask; mark('c:'+id); } else if(k==='lib') mark('l:'+id); else if(k==='skinpart'||k==='weapon') mark('c:'+id); else mark('meta');
      after(); toast('그림을 지웠어요'); break; }
case 'npcscan': { const snap=artSnap(); const n=await autoNpcs(G.chapters,uiProg(t)); if(n){ openNpcs(); toast(`NPC ${n}명을 추가했어요`); artAfterAI(snap,'NPC '+n+'명'); } else toast('새로 추가할 인물이 없어요(대사 3줄 이상인 조연만 찾아요)'); break; }
case 'npcopen': openNpcs(); break;
case 'npcsave': { const n=(G.npcs||[]).find(x=>x.id===id); if(!n) break; const old=npcRead(n); if(old&&old!==n.name&&old.length>=2&&(await appConfirm(`이름이 「${old}」에서 「${n.name}」(으)로 바뀌어요. 스토리·${T('talk')}에 나온 「${old}」도 모두 바꿀까요?`))){ const c=renameEverywhere(old,n.name); toast(`이름을 ${c}곳에서 바꿨어요`); } else toast('저장했어요'); npcRefresh(id); break; }
case 'npcdraw': { const n=(G.npcs||[]).find(x=>x.id===id); if(!n||NPCBUSY.has(id)) break; npcRead(n); npcDraw(n,t.dataset.k==='upper'?'upper':'char'); break; }
case 'npctags': { const n=(G.npcs||[]).find(x=>x.id===id); if(!n) break; npcRead(n); if(!String(n.look||n.profile||'').trim()){ toast('외모를 먼저 적어 주세요'); break; }
      const r=await aiJSON(npctagsPrompt({n}),uiProg(t),'quick');
      if(r&&r.naiPrompt){ n.naiPrompt=allyTags(stripMinor(stripAge(String(r.naiPrompt)))); mark('meta'); npcRefresh(id); toast('태그를 썼어요. 확인하고 다시 그려 보세요'); } break; }
case 'npcdel': { const n=(G.npcs||[]).find(x=>x.id===id); if(!n||!(await appConfirm(`NPC 「${n.name}」을(를) 지울까요? 스토리에는 이름만 나와요.`))) break; G.npcs=G.npcs.filter(npc=>npc!==n); mark('meta'); openNpcs(); break; }
case 'npcadd': { const nm=($('#npc_new').value||'').trim(); if(!nm){ toast('이름을 적어 주세요'); break; } if(npcBy(nm)||findSpeaker(nm)){ toast('이미 있는 이름이에요'); break; } G.npcs=G.npcs||[]; G.npcs.push(npcNew(nm)); mark('meta'); openNpcs(); break; }
case 'cutclose': { stopVoice(); gachaCutHide(t); const f=GC&&GC.cutCb; if(GC) GC.cutCb=null; f&&f(); break; }
case 'lib': openLib(t.dataset.k); break;
case 'libitem': openLibItem(id); break;
case 'libnew': openLibItem(null,t.dataset.k); break;
case 'castt': chipOn(t,!chipIsOn(t)); break;
case 'naiopen': openNaiSet(); break;
case 'naivariety': switchFlip(t); break;
case 'naipreset': applyStylePreset(t.dataset.v); break;
case 'packopen': openModal(packHTML()); break;
case 'packuse': { const p=allPresets().concat(userPacks()).find(x=>x.id===t.dataset.v); if(!p) break; packApply(p); toast(`「${p.name}」 그림체를 적용했어요`); openModal(packHTML()); break; }
case 'packdel': { const a=userPacks(), p=a.find(x=>x.id===t.dataset.v); if(!p||!(await appConfirm(`「${p.name}」 프리셋을 지울까요?`))) break; saveUserPacks(a.filter(x=>x!==p)); openModal(packHTML()); break; }
case 'packcopy': { const p=userPacks().find(x=>x.id===t.dataset.v); if(!p) break; const code=packCode(Object.assign({},p,{id:undefined})); try{ await navigator.clipboard.writeText(code); toast('프리셋 코드를 복사했어요. 붙여 넣어 공유하세요'); }catch(e){ if(t.isConnected)openPresetCode('pack',code); } break; }
case 'packimport': openPresetCode('pack'); break;
case 'packsave': { const nm=prompt('프리셋 이름'); if(!nm) break; const by=prompt('만든 사람 (선택, 공유할 때 표시돼요)')||''; const c=naiCfg(), el=(c.styles||[]).find(x=>x.id===c.styleId)||(c.styles||[])[0]||{}, L=llmSlots();
      const p={id:'u'+uid(),name:nm.trim().slice(0,30),by:by.trim().slice(0,20),desc:'내가 만든 팩',tags:joinTags(el.tags,c.quality?c.qtags:''),neg:el.neg||'',qtags:'',steps:c.steps,scale:c.scale,cfgRescale:c.cfgRescale,sampler:c.sampler};
      const a=userPacks(); a.unshift(p); if(saveUserPacks(a)) toast('프리셋으로 저장했어요. 내보내기로 코드를 공유할 수 있어요'); openModal(packHTML()); break; }
case 'naisave': appStorage.setItem(NKEY,JSON.stringify(readNai())); closeModal(); render(); toast('그림 AI 설정을 저장했어요'); break;
case 'cfload': { const inp=document.createElement('input'); inp.type='file'; inp.accept='.json,application/json'; inp.onchange=async()=>{ const f=inp.files[0]; if(!f) return; const tx=await f.text(); const box=$('#cf_wf')||$('#sw_cfwf'); if(box) box.value=tx; try{ const j=JSON.parse(tx); toast(Array.isArray(j.nodes)?'UI 형식이에요. Export (API)로 저장한 파일을 넣어 주세요':'워크플로를 불러왔어요 (노드 '+Object.keys(j).length+'개)'); }catch(e){ toast('JSON 파일이 아니에요'); } }; inp.click(); break; }
case 'cftest': { const u=(($('#cf_url')||$('#sw_cfurl'))||{}).value; if(!u){toast('주소를 넣어 주세요');break;} const done=busy(t);
      try{ const r=await http(u.trim().replace(/\/+$/,'')+'/system_stats',{timeout:10000}); const j=okJSON(r); const d=(j.devices||[])[0]; toast('ComfyUI 연결 성공'+(d?' · '+String(d.name||'').slice(0,40):'')); say('#sw_res','✓ 연결됨'); }
      catch(e){ toast('연결 실패. PC에서 --listen으로 켰는지, 주소와 와이파이를 확인해 주세요'); say('#sw_res','✗ 연결 실패'); } finally{ done(); } break; }
case 'naitest': { const c=readNai(); if(!c.key){toast('토큰을 넣어 주세요');break;} const done=busy(t);
      try{ const r=await http(naiBase(c)+'/user/subscription',{headers:NAI_HDR(c.key),timeout:20000}); const j=okJSON(r); const sl=j.trainingStepsLeft||{}; const an=(sl.fixedTrainingStepsLeft||0)+(sl.purchasedTrainingSteps||0);
        toast(`연결 성공. ${['Paper','Tablet','Scroll','Opus'][j.tier]||'구독'} · Anlas ${an}`); }catch(e){ toast(naiErr(e,'연결 확인 실패')); } finally{ done(); } break; }
case 'skinuse': {const c=charById(id),o=own(id);if(!c||!o)break;const sk=t.dataset.s;if(sk){const k=(c.skins||[]).find(x=>x.id===sk);if(!k)break;if(!skinHave(k)){toast(`캐시 상점의 ${T('skin')} 패키지에서 살 수 있어요`);break;}
 if(!skinDisplayReady(c,k)){if(SKJOB?.skinId===k.id){toast('이 스킨의 그림을 준비 중이에요. 완료 후 입혀 주세요');break;}if(c.useStanding!==false||!k.prompt||!imgReady()){toast(c.useStanding===false?'이 스킨의 상반신 그림이 필요해요. 스킨 편집에서 상반신을 넣거나 그림 AI를 연결해 주세요.':'아직 그려지지 않은 스킨이에요');break;}
 if(!(await appConfirm('이 스킨은 상반신 그림이 없어 기본 모습으로 표시되고 있어요. 그림 AI로 스킨 상반신을 생성한 뒤 입힐까요? 이미지 생성 비용이 발생할 수 있어요.')))break;
 const game=G,project=PJ().active,done=busy(t);try{const blob=await skinPartDraw(c,k,'upper','manual');if(G!==game||PJ().active!==project||charById(id)!==c||!c.skins.includes(k))throw Error('대상이 바뀌어 스킨 적용을 중단했습니다');await storeImage(skinPart(k,'upper'),blob,'');mark('c:'+id);}catch(err){toast(naiErr(err));break;}finally{done();}
 }}o.skin=sk;mark('prog');openChar(id);render();break;}

case 'faceview': { const c=charById(id), f=c.faces.find(x=>x.id===t.dataset.f); openFaceView(c,f); break; }
case 'faces-open': FACESEL=new Set(); openFaces(id,t.dataset.s||''); break;
case 'facesel': { const v=t.dataset.v; FACESEL.has(v)?FACESEL.delete(v):FACESEL.add(v); chipOn(t,FACESEL.has(v)); break; }
case 'faceup': uploadFor={kind:'face',id,name:t.dataset.v,b:t.dataset.b||''}; $('#file').click(); break;
case 'faceupnew': { const nm=($('#fc_new').value||'').trim().slice(0,12); if(!nm){toast('표정 이름을 적어 주세요');break;} uploadFor={kind:'face',id,name:nm}; $('#file').click(); break; }
case 'faceupmany': uploadFor={kind:'faces',id}; $('#filesm').click(); break;
case 'facedel': { const c=charById(id); if(!c) break; if(t.dataset.f){ c.faces=c.faces.filter(x=>x.id!==t.dataset.f); mark('c:'+id); openChar(id); break; } const F=faceTgt(c); F.faces=F.faces.filter(f=>f.name!==t.dataset.v); mark('c:'+c.id); openFaces(id); break; }
case 'facetgt': openFaces(id,t.dataset.s||''); break;
case 'facebasic': FACE_BASIC.forEach(v=>FACESEL.add(v)); faceChipsShow(); break;
case 'facemask': { const c=charById(id); if(!c) break; const F=faceTgt(c), b=t.dataset.b, o=b==='up'?faceUpperObj(c,F):F; if(!o||!imgSrcRaw(o))break;faceOptRead();
      openMaskPainter(imgSrcRaw(o),(F.faceMask||{})[b],url=>{ F.faceMask=Object.assign({},F.faceMask||{},{[b]:url}); mark('c:'+c.id); toast('얼굴 범위를 저장했어요'); openFaces(id); }); break; }
case 'facego': { const c=charById(id), list=[...FACESEL]; if(!c) break; const F=faceTgt(c); if(!imgSrcRaw(F)&&!faceUpperObj(c,F)){toast('먼저 전신이나 상반신 그림이 있어야 해요');break;} if(!list.length){toast('표정을 골라 주세요');break;} if(!naiCfg().key){toast('설정의 그림 AI에 NovelAI 토큰을 넣어 주세요');break;}
      faceOptRead(); const O=FACEOPT, x=$('#fc_x').value.trim(), basePr=F===c?c.naiPrompt:(F.prompt||c.naiPrompt), upO=faceUpperObj(c,F);
      const bodies=(O.body==='both'?['full','up']:[O.body]).filter(b=>b==='full'?imgSrcRaw(F):upO);
      if(!bodies.length){ toast('상반신 그림이 없어요. 대원 화면 → 외형에서 상반신을 먼저 그리거나 올려 주세요'); break; }
      if(O.body==='both'&&!imgSrcRaw(F))toast('전신 그림이 없어 상반신 표정만 그려요');
      if(O.body==='both'&&!upO)toast('상반신 그림이 없어서 전신 표정만 그려요. 상반신 표정은 외형에서 상반신을 먼저 만든 뒤 그려요');
      if(O.m==='inpaint'){ const miss=bodies.filter(b=>!(F.faceMask||{})[b]); if(miss.length){ toast(`먼저 ${miss.map(b=>b==='up'?'상반신':'전신').join('·')}에 얼굴 범위를 칠해 주세요`); break; } }
      if(O.m==='raw'&&!/^nai-diffusion-5/.test(O.model)){ toast('감정을 넣어 새로 그리기는 V5 모델만 돼요'); break; }
      const done=busy(t); let n=0; const tot=list.length*bodies.length;
      for(const ko of list){
        let f=F.faces.find(q=>q.name===ko); if(!f){ f={id:'f'+uid(),name:ko,img:null}; F.faces.push(f); }
        for(const b of bodies){ say('#fc_stat',`${n}/${tot} · ${ko} (${b==='up'?'상반신':'전신'}) 그리는 중…`);
          try{ await faceDrawOne(c,F,f,ko,b,O,x,tot===1?'manual':'batch'); n++; }
          catch(err){ toast(naiErr(err)); done(); openFaces(id); return; } } }
      toast(`표정 그림 ${n}장을 만들었어요`); openFaces(id); break; }
case 'skinpromptsave': {const c=charById(id),k=c?.skins?.find(k=>k.id===t.dataset.s);if(k){naiBlocksSave(k,'prompt','skin_prompt_'+k.id);mark('c:'+c.id);toast('프롬프트를 저장했어요. 이후 생성부터 적용돼요.');}break;}
case 'skin-open': openSkin(id); break;
case 'skinlines': { const c=charById(id), k=c&&(c.skins||[]).find(x=>x.id===t.dataset.s); if(!k) break; if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); break; }
      const r=await aiJSON(skinlinesPrompt({c,k}),uiProg(t),'quick');
      if(r&&Array.isArray(r.lines)){ k.lines=r.lines.map(x=>String(x||'').trim()).filter(Boolean).slice(0,8); if(r.intro) k.intro=String(r.intro).slice(0,120); mark('c:'+c.id); toast(`「${k.name}」 대사 ${k.lines.length}개를 썼어요`); skinRefresh(id); } break; }
case 'skpartgen': { const c=charById(id), k=c&&(c.skins||[]).find(x=>x.id===t.dataset.s); if(k) skinPartGen(c,k,[t.dataset.x],uiProg(t)); break; }
case 'skpartall': { const c=charById(id), k=c&&(c.skins||[]).find(x=>x.id===t.dataset.s); if(!k) break; const xs=['stand','upper','illust','lbcg'].filter(x=>!imgSrcRaw(x==='stand'?k:k[x])); if(!xs.length){ toast('네 칸 모두 그림이 있어요'); break; } skinPartGen(c,k,xs,uiProg(t),'batch'); break; }
case 'skpartup': uploadFor={kind:'skinpart',id,s:t.dataset.s,x:t.dataset.x}; $('#file').click(); break;
case 'skingo': { const c=charById(id), pr=$('#sk_prompt').value.trim(), nm=$('#sk_name').value.trim()||'새 '+T('skin'); if(!pr){toast('프롬프트를 채워 주세요');break;} if(!imgReady()){toast(imgNeed());break;}
      if(SKPROP&&SKPROP.url) URL.revokeObjectURL(SKPROP.url);
      SKPROP={cid:id,name:nm,prompt:pr,naiBlocks:{prompt:naiBlocksFieldParts('sk_prompt')},idea:$('#sk_idea').value.trim(),pose:$('#sk_pose')?$('#sk_pose').value:'',ref:{on:!!(imgSrc(c)&&$('#sk_ref')&&$('#sk_ref').checked),style:$('#sk_style').value==='1',str:+$('#sk_str').value,fid:+$('#sk_fid').value},blob:null,url:null};
      skinPropDraw(uiProg(t)); break; }
case 'skindel': { const c=charById(id); c.skins=c.skins.filter(k=>k.id!==t.dataset.s); Object.values(P().owned).forEach(o=>{if(o.skin===t.dataset.s)o.skin='';}); mark('c:'+id,'prog'); skinRefresh(id); break; }
case 'wnai': { const c=charById(id); if(!c) break; const pr=($('#f_wp')?$('#f_wp').value:'').trim(); if(pr&&pr!==String(c.weapon.prompt||'')){ c.weapon.prompt=pr; mark('c:'+id); } if(!String(c.weapon.prompt||'').trim()){toast(T('weapon')+' 프롬프트를 채워 주세요');break;} openNaiPrep('weapon',id); break; }
case 'imglib': openImgLib(id); break;
case 'ilbtap': { if(!IMGLIB) break; const i=+t.dataset.i, its=charImgItems(charById(IMGLIB.cid)), it=its[i]; if(!it) break; const k=IMGLIB.sel.indexOf(i); if(k>=0) IMGLIB.sel.splice(k,1); else { IMGLIB.sel.push(i); if(IMGLIB.sel.length>2) IMGLIB.sel.shift(); }
      if(IMGLIB.sel.length===1&&k<0&&imgSrcRaw(it.o))imgViewer(imgSrcRaw(it.o)); openImgLib(IMGLIB.cid); break; }
case 'ilbclear': if(IMGLIB){ IMGLIB.sel=[]; openImgLib(IMGLIB.cid); } break;
case 'ilbdel': { if(!IMGLIB) break; const c=charById(IMGLIB.cid), it=charImgItems(c).find(x=>x.o.id===t.dataset.imageId); if(!it||!it.o.img||!(await appConfirm(`${it.label} 그림을 지울까요? (항목은 남아요)`))) break; await imgClear(it.o); if(it.k==='stand') delete c.faceMask; IMGLIB.sel=[]; mark('c:'+c.id); render(); openImgLib(c.id); toast('그림을 지웠어요'); break; }
case 'bgmall': openBgmAll(); break;
case 'bgmpick': chipOn(t,!chipIsOn(t)); break;
case 'bgmpickall': bgmPickShow(t.dataset.v); break;
case 'bgmallgo': bgmAllGo([...document.querySelectorAll('#modal [data-act="bgmpick"].on')].map(b=>b.dataset.id)); break;
case 'bgmplay': { const l=libById(id); if(l) bgm(l.name,true); break; }
case 'bgmstop': bgmFade(0,()=>{BGM.el.pause();BGM.name=null;}); break;
case 'aupload': uploadAudioFor=id; $('#afile').click(); break;
case 'naigen': openNaiPrep(t.dataset.k,id); break;
case 'cutopen': openCut(t.dataset.k,id); break;
case 'cutrun': { const j=CUTJOB; if(!j||!j.orig) break; const done=busy(t), o={tol:+$('#ct_tol').value,soft:+$('#ct_soft').value,holes:$('#ct_holes').checked,despeck:$('#ct_spk').checked,shadow:$('#ct_shadow').checked};
      try{ const src=await new Promise(r=>j.orig.toBlob(r,'image/png')); const b2=await cutoutWhite(src,o); await cutLoadBlob(b2); j.opt=o; toast('자동으로 지웠어요. 남은 곳은 스포이드나 브러시로 마무리하세요'); }
      catch(e){ toast('배경을 지우지 못했어요'); } done(); break; }
case 'cutnai': { const j=CUTJOB; if(!j) break; if(!(await appConfirm('NovelAI 배경 제거는 Anlas를 써요 (생성 한 장의 약 3배). 진행할까요?'))) break;
      const done=busy(t,'NovelAI가 배경을 지우는 중…');
      try{ const b2=await naiBgRemove(j.src); await cutLoadBlob(b2); j.opt=null; }
      catch(e){ toast(naiErr(e,'배경 제거 실패')); } done(); break; }
case 'cutzoom': { const j=CUTJOB; if(!j||!j.cv) break; j.zoom=CUT_ZOOMS[(CUT_ZOOMS.indexOf(j.zoom)+1)%CUT_ZOOMS.length]; cutZoomShow(t,j); break; }
case 'cutundo': { const j=CUTJOB; if(!j||!j.undo.length) break; cutCtx().putImageData(j.undo.pop(),0,0); cutUndoShow(j); break; }
case 'cutnudge': { const j=CUTJOB; if(!j||!j.cv) break; if(j.cx<0){ j.cx=j.W/2; j.cy=j.H/2; } j.cx=Math.max(0,Math.min(j.W-1,Math.round(j.cx)+(+t.dataset.dx))); j.cy=Math.max(0,Math.min(j.H-1,Math.round(j.cy)+(+t.dataset.dy))); cutPlaceCursor(); cutDrawLoupe(); break; }
case 'cuthere': cutEraseHere(); break;
case 'cutsave': { const j=CUTJOB; if(!j||!j.cv||!j.changed) break; const o=naiTarget(j.kind,j.id); const blob=await cutBlob();
      if(j.opt&&$('#ct_def')&&$('#ct_def').checked){ let sv={}; try{sv=JSON.parse(appStorage.getItem(NKEY))||{};}catch(e){} sv.cut=j.opt; appStorage.setItem(NKEY,JSON.stringify(sv)); }
      if(ILK(j.kind)){ await storeImage(o,blob,''); mark('c:'+j.id); CUTJOB=null; render(); openChar(j.id); toast('저장했어요'); break; }
      await storeImage(o,blob,j.kind==='char'?'c:':'l:'); CUTJOB=null; render(); if(j.kind==='char') openChar(o.id); else openLibItem(o.id); toast('배경을 지웠어요'); break; }
case 'naigo': { if(!NPREP) break; const o=naiTarget(NPREP.kind,NPREP.id); if(!o) break;
      const sz=($('#np_size').value.match(/(\d+)x(\d+)/)||[]).slice(1).map(Number);
      const custom={sceneReady:!!NPREP.sceneReady,sceneTags:NPREP.sceneTags,sceneStyle:$('#np_style').value,scenePose:$('#np_pose')?.value||'',sceneFrame:$('#np_frame')?.value||'',candidateEligible:!!NPREP.candidateEligible,promptParts:naiBlocksFieldParts('np_in'),input:$('#np_in').value.trim(),neg:$('#np_neg').value.trim(),seed:$('#np_seed').value.trim(),model:$('#np_model').value,size:sz.length===2?sz:undefined};
      if(NPREP.k==='cg'){ custom.chars=cgCast(o).map((x,i)=>({id:x.c.id,name:x.c.name,prompt:$('#np_cc'+i)?$('#np_cc'+i).value.trim():charCaption(x.c,x.act),uc:'',pos:$('#np_cp'+i)?$('#np_cp'+i).value:x.pos})); }
      if($('#np_ref')&&$('#np_ref').checked) custom.ref={type:$('#np_rtype').value,strength:+$('#np_rstr').value,fidelity:+$('#np_rfid').value};
      if($('#np_i2i')&&$('#np_i2i').checked) custom.i2i={strength:+$('#np_istr').value,noise:+$('#np_inoise').value};
      if($('#np_keep')&&$('#np_keep').checked){
        o.naiStyle=$('#np_style').value;
        if(NPREP.k==='char'||ILK(NPREP.k)){ o.naiPose=$('#np_pose').value.trim(); o.naiFrame=$('#np_frame').value; mark('c:'+NPREP.id); }
        else { (o.cast||[]).forEach(x=>{const ch=(custom.chars||[]).find(q=>q.id===x.id); if(ch) x.pos=ch.pos;}); mark(NPREP.kind==='weapon'?'c:'+NPREP.id:'l:'+o.id); }
      }
      NPREP.custom=custom; openNaiGen(NPREP.kind,NPREP.id,custom); break; }
case 'naiagain': { const j=NAIJOB; if(!j) break; openNaiGen(j.kind,j.id,Object.assign({},j.custom,{seed:'',candidateEligible:imageCandidateEligible(j.kind==='lib'?naiTarget(j.kind,j.id)?.kind:j.kind,{img:{idb:true}},charById(j.id))})); break; }
case 'naiedit': { const j=NAIJOB; if(!j) break; NLASTSEED[j.id]=j.seed; openNaiPrep(j.kind,j.id); if(NPREP){NPREP.sceneReady=!!j.custom.sceneReady;NPREP.sceneTags=j.custom.sceneTags;if(j.custom.sceneTags){const owner=charById(j.id);NPREP.base=joinTags(owner?.naiPrompt,designTags(owner),j.custom.sceneTags);}} if(NPREP)NPREP.candidateEligible=imageCandidateEligible(j.kind==='lib'?naiTarget(j.kind,j.id)?.kind:j.kind,{img:{idb:true}},charById(j.id)); setTimeout(()=>{ if($('#np_in')){ naiBlocksSeed('np_in',j.custom.promptParts?.combined===j.custom.input?j.custom.promptParts:{...naiBlocksSplit(j.custom.input),combined:j.custom.input}); $('#np_neg').value=j.custom.neg; if(j.custom.model&&$('#np_model')) $('#np_model').value=j.custom.model; (j.custom.chars||[]).forEach((x,i)=>{ if($('#np_cc'+i)) $('#np_cc'+i).value=x.prompt; if($('#np_cp'+i)) $('#np_cp'+i).value=x.pos; }); } },0); break; }
case 'naiuse': { await registerNaiJob(); break; }
case 'naibatch': naiBatch(t.dataset.k); break;
case 'naistop': if(NAIBATCH){NAIBATCH.stop=true;toast('지금 그리는 것까지만 하고 멈출게요');} break;
case 'skinbuy': openSkinBuy(id); break;
case 'skinpkgdel': { const f=skinShopList().find(x=>x.k.id===id); if(!f) break; if((P().skinOwn||{})[id]){ toast('이미 산 '+T('skin')+'은 대원 화면에서 지워 주세요'); break; }
      if(!(await appConfirm(`${f.c.name} 「${f.k.name}」 패키지를 지울까요? 대원 화면의 🔒 ${T('skin')}도 함께 사라져요`))) break;
      f.c.skins=f.c.skins.filter(k=>k.id!==id); Object.values(P().owned).forEach(o=>{ if(o.skin===id) o.skin=''; }); const L=P().live; if(Array.isArray(L.skinRecent)&&!f.c.skins.some(k=>k.shop)) L.skinRecent=L.skinRecent.filter(x=>x!==f.c.id);
      mark('c:'+f.c.id,'prog'); if(!$('#modal').hidden) closeModal(); render(); toast(`「${f.k.name}」 패키지를 지웠어요`); break; }
case 'skinnew': { if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); break; } busy(t); const n=[]; let made=null; try{ made=await skinAuto(n); }finally{ liveBar(null); } toast(n[0]||'만들지 못했어요. AI 기록을 확인해 주세요'); render(); if(made&&made.k) openSkinBuy(made.k.id); break; }
  }
}
