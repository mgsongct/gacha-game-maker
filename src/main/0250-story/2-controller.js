/* ===== 0250-story — Controller(동작을 받아 Model을 바꾸고 다시 그리게 함 · 섞인 함수는 나눌 것) ===== */
/* src/main/0250-story/0250-story-factory.js에서 옮김 */
function newBonds(s){ const cs=G.chars.filter(c=>c.debut===s.id); if(!cs.length) return; cs.forEach(c=>{ if(!relPair(REL_ME,c.id)) relApply([{a:T('player'),b:c.name,kind:'첫 만남',note:`「${s.title}」에서 처음 만났다.`}],''); });
  setTimeout(()=>toast(`새 인연: ${cs.map(c=>`${c.name}(${RL[c.rarity]})`).join(', ')} · 이제 상시 ${T('gacha')}에서 만날 수 있어요`),600); }
// 파견 보상은 시간·인원에 비례(예전엔 순서대로 고정 표에서 붙어 0.5시간·1명짜리가 가장 큰 보상을 받기도 했음)
async function aiChapterGen0(dir,n,cast){
  const k=G.chapters.filter(c=>c.kind==='main').length,hl=Math.round(800*(1+.6*k)),hh=Math.round(1400*(1+.6*k)),al=Math.round(75*(1+.25*k)),ah=Math.round(105*(1+.25*k)),dl=30+15*k,dh=60+15*k;
  const SC=storyCfg(), deep=SC.depth!=='fast', LS=lenSpec(), main=G.chapters.filter(c=>c.kind==='main'), lastPost=smPrevious(main.at(-1));
  const step=genStep('chapter','메인 스토리 '+(k+1)+'장'); step('시나리오 설계를 확인하는 중…'); await planEnsure(k+1); /* 시나리오 설계 자동(0465) */
  {
    memCatchUp();
    const castRefs=cast.map(relRef).filter(Boolean), memo=storyMemo(), rel=relCtx([dir,cast.join(' '),lastPost.slice(-6000)].join('\n'),castRefs,50);
    step(deep?'장 구성을 짜는 중…':'대본을 쓰는 중…');
    const r=await aiJSON(aiChapterGen0Prompt({dir,cast,memo,rel,k,deep,lastPost,SC,n,LS}),null,'complex');
    if(!(r&&Array.isArray(r.stages)&&r.stages.length)){ return null; }
    const ch={id:uid(),ord:k,kind:'main',title:String(r.title||`${k+1}장`),logline:String(r.logline||'').slice(0,120),stages:buildStages(r.stages,{max:12,reward:i=>300+150*k+100*i,elem:ELEMS[0],hp:hl,atk:al,def:dl,foe:'적'})};
    await v2BalanceChapter(ch,k);
    // 새 인물·자료를 먼저 넣어야 집필할 때 AI가 알아요
    const newc=addNewChars(r.newCharacters,SC.newc,ch.stages,{src:ch.title,ch}), npcs=addNpcs(r.newNpcs); stanceApply(r.stance,k+1); bestiaryApply(r.bestiary); debutResolve(ch); // 세력 관계 변화·적 도감·나중 등장 캐릭터(0445)
    let nb=addLib('bg',r.backgrounds)+addLib('bgm',r.music)+addLib('prop',r.props)+addCGs(r.cgs), nt=0;
    G.chapters.push(ch); mark('ch:'+ch.id); syncEnemies(G,lookMap(r.stages)); try{ cxFromChapter(r,ch); }catch(e){}
    if(deep){ await writeStages(ch,{head:`메인 스토리 ${k+1}장. 방향: "${dir}".${newc.length?' 이 장에서 처음 만나는 신규 '+T('crew')+': '+newc.map(c=>c.name+'('+String(c.profile).slice(0,60)+')').join(', ')+'.':''}`,LS,step,memo,castRefs,castText:dir+' '+cast.join(' ')+' '+newc.map(c=>c.name).join(' '),prevTail:lastPost.split('\n').slice(-80).join('\n').slice(-6000),plan:planCtx(k+1)}); debutResolve(ch);
      step('요약·관계·'+T('talk')+'를 정리하는 중…'); const w=await storyWrapUp(ch,'1~2'); if(w){ ch.summary=String(w.summary||'').slice(0,6000); relApply(w.relations,`${k+1}장`); nt=addThreads(w.threads,ch,true); } }
    else { const memoryResult=await storyWrapUp(ch,'1~2',{followups:false});ch.summary=String(memoryResult?.summary||r.summary||'').slice(0,6000); relApply(r.relations,`${k+1}장`); nt=addThreads(r.threads,ch,true); }
    relFromScripts(ch,`${k+1}장`); mark('ch:'+ch.id); nb+=scanScriptAssets();
    try{ await autoNpcs([ch]); }catch(e){ quietErr(e,'0250-story-factory.js:120'); }
    return {ch,nb,nt,newc,nc:newc,npcs};
  }
}
async function aiEvent(t){
  const dir=$('#ae_d').value.trim(); if(!dir){toast('이벤트 내용을 적어 주세요');return;}
  const n=+$('#ae_n').value, mk=$('#ae_new').value==='1', cast=[...document.querySelectorAll('.chip.on')].map(b=>charById(b.dataset.id)?.name).filter(Boolean), len=$('#ae_len')?$('#ae_len').value:'', lore=$('#ae_lore')?$('#ae_lore').value:'';
  if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; } closeModal();
  bgJob('event','이벤트 만드는 중',async()=>{ const res=await aiEventGen(dir,n,mk,cast,len,lore); if(!res) return null; P().curEvent=res.ev.id;
    return {title:`이벤트 「${res.ev.title}」가 열렸어요`,body:`${T('event')} 화면에서 바로 플레이할 수 있어요.${res.nc?`\n이벤트를 끝까지 깨면 ${RL[res.nc.rarity]} ${res.nc.name}이(가) 배포 ${T('crew')}로 무료 합류해요.`:''}${res.ncs&&res.ncs.length>1?`\n새 인연: ${res.ncs.slice(1).map(c=>RL[c.rarity]+' '+c.name).join(', ')} — 이야기에서 만나면 상시 ${T('gacha')}에 합류해요.`:''}\n새 자료 ${res.nb}개가 추가됐어요.`}; });
}
async function aiEventGen(dir,n,mk,cast,len,lore){ const snap=artSnap(); const r=await aiEventGen0(dir,n,mk,cast,len,lore); if(r) artAfterAI(snap,'새 이벤트 「'+((r.ev&&r.ev.title)||'')+'」'); return r; }
async function aiEventGen0(dir,n,mk,cast,len,lore){ len=STORY_LEN[len]?len:storyCfg().len; const LS=STORY_LEN[len][1]; const LORE=loreOf({lore}), LALT=LORE&&LORE!=='if'?charById(LORE):null;
  const loreHint=aiEventGen0LoreHintText({LORE,LALT});
  if(!dir){ const mon=new Date().getMonth()+1; dir=`${mon}월의 계절감과 기념일을 살린 기간 한정 이벤트를 자유롭게 기획한다. 지난 이벤트(${G.events.map(e=>e.title).join(', ')||'없음'})와 겹치지 않게.`; }
  const SC=storyCfg(), deep=SC.depth!=='fast', ncN=mk?Math.max(1,SC.newc):0;
  const step=genStep('event','이벤트');
  {
  memCatchUp(); const castRefs=[...cast.map(relRef).filter(Boolean),...(LALT?[LALT.id]:[])], memo='', rel=relCtx([dir,cast.join(' ')].join('\n'),castRefs,40);
  step(deep?'이벤트 구성을 짜는 중…':'이벤트를 쓰는 중…');
  const r=await aiJSON(aiEventGen0Prompt({rel,deep,dir,cast,loreHint,n,LS,ncN}),null,'complex');
  if(!r||!Array.isArray(r.stages)||!r.stages.length){ return null; }
  const evId='ev'+uid(), chId='evc'+uid(), bId='b'+uid(), ttl=String(r.title||'이벤트');
  const ch={id:chId,kind:'event',eventId:evId,ord:200,title:ttl,lore:LORE||undefined,logline:String(r.desc||'').slice(0,120),stages:buildStages(r.stages,{max:6,reward:i=>60+30*i,elem:ELEMS[0],hp:1000,atk:80,def:40,foe:'적',title:'스테이지'})};
  const ncs=addNewChars(r.newCharacters&&r.newCharacters.length?r.newCharacters:r.newCharacter,ncN,ch.stages,{src:'외전 「'+ttl+'」',giftFirst:true}), nc=ncs[0]||null, npcs=addNpcs(r.newNpcs); bestiaryApply(r.bestiary);
  sysEventFoes(ch); await v2BalanceChapter(ch,Math.max(0,G.chapters.filter(c=>c.kind==='main').length-1)); G.chapters.push(ch); mark('ch:'+chId); syncEnemies(G,lookMap(r.stages));
  const ups=[...strs(r.pickup).map(nm=>findSpeaker(nm)).filter(Boolean).map(c=>c.id)]; if(nc) ups.unshift(nc.id);
  G.banners.push({id:bId,name:String(r.bannerName||r.title||'이벤트 배너'),type:'event',desc:String(r.desc||''),pool:{mode:'all',factions:[],ids:[]},pickup:[...new Set(ups)].slice(0,3),rate:60,active:true,bg:String(r.bg||''),eventId:evId});
  const ev={id:evId,lore:LORE||undefined,gift:nc?nc.id:'',gate:mainCleared(),gen:{dir:String(dir||'').slice(0,4000),n,len,lore:LORE},title:ttl,desc:String(r.desc||''),token:String(r.token||'이벤트 토큰'),active:true,chapterId:chId,bannerId:bId,bg:String(r.bg||''),bgm:String(r.bgm||''),shop:[]};
  ev.shop=defaultShop(ev); G.events.push(ev);
  let nb=addCGs(r.cgs)+addLib('bg',r.backgrounds)+addLib('bgm',r.music)+addLib('prop',r.props);
  const src='외전 「'+ttl+'」';
  if(deep){ await writeStages(ch,{head:`기간 한정 이벤트 「${ttl}」: ${String(r.desc||'')}. 기획: "${dir}".${ncs.length?' 이 이벤트에서 처음 만나는 신규 '+T('crew')+': '+ncs.map(c=>c.name+'('+RL[c.rarity]+', '+String(c.profile).slice(0,60)+')').join(', ')+'.':''}`,LS,step,memo,side:true,castRefs,castText:dir+' '+cast.join(' ')+' '+ncs.map(c=>c.name).join(' ')});
    step('요약·관계·'+T('talk')+'를 정리하는 중…'); const w=await storyWrapUp(ch,'1~2'); if(w){ ch.summary=String(w.summary||'').slice(0,6000); relApply(w.relations,src,false,LORE); addThreads(w.threads,ch,false); } }
  else { const memoryResult=await storyWrapUp(ch,'1~2',{followups:false});ch.summary=String(memoryResult?.summary||r.summary||'').slice(0,6000); relApply(r.relations,src,false,LORE); addThreads(r.threads,ch,false); }
  relFromScripts(ch,src); mark('ch:'+chId); nb+=scanScriptAssets();
  try{ await autoNpcs([ch]); }catch(e){ quietErr(e,'0250-story-factory.js:156'); }
  mark('prog'); return {ev,nc,ncs,nb,npcs};
  }
}
function readBanner(){const b=BD;b.name=$('#bn_name').value.trim()||b.name;b.desc=$('#bn_desc').value.trim();b.type=$('#bn_type').value;b.bg=$('#bn_bg').value;b.pool.mode=$('#bn_mode').value;b.rate=num($('#bn_rate').value,0,100,50);b.active=$('#bn_act').value==='1';return b;}
function cleanChar(o){ const c=cleanChar0(o);posAssign(c,o&&o.pos);c.persona=personaClean(o&&o.persona);c.range=RANGE[o&&o.range]?o.range:'';c.pfields=pfieldsClean(o&&o.pfields);v2ApplyRoleSpeed(c);c.generation=v2CurrentGeneration();balanceOnCreate(c); let provided=null;try{if(o?.skills)provided=v2PrepareGenerated(o.skills,c);}catch(e){}c.skills=provided||GGMCombat.generationDefaults(c); if(o?.skills&&!provided)c.skillGenerationWarning='AI 스킬이 규칙에 맞지 않아 기본 스킬로 대체했어요. 스킬 편집기에서 다시 생성할 수 있어요.'; setTimeout(async()=>{try{if(!provided){if(typeof NEW_GAME_SOURCE!=='undefined'&&NEW_GAME_SOURCE&&G!==NEW_GAME_SOURCE){ c.skillPending=true; c.skillGenerationWarning='새 게임을 연 뒤 스킬을 설계해요'; return; } /* 새 게임 생성 중: 저장·새로고침에 끊기지 않게 게임을 연 뒤 skillResume()이 이어서 */ if(SAMPLE){c.skillGenerationWarning='스킬을 구성하고 내부 검사하는 중…';const kit=await v2GenerateSkills(c,'',msg=>{c.skillGenerationWarning=msg;});c.skills=kit;delete c.skillGenerationWarning;}}await v2QueueCharacter(c);}catch(e){c.skillGenerationWarning=String(e.message||e);}if(G.chars.includes(c)){mark('c:'+c.id);if(document.querySelector('.cs-sheet')?.dataset.cid===c.id)openChar(c.id);}},0); try{ const en=(G.lib||[]).find(l=>l.kind==='enemy'&&l.name===c.name); if(en&&/^\s*(1girl|1boy|1other)/i.test(en.prompt||'')){ c.naiPrompt=en.prompt; c.fromEnemy=en.id; } }catch(e){} naiBlocksRemember(c);return c; }
async function storyWrapUp(ch,nt,{followups=true}={}){const origin=G,pid=PJ().active;try{const memory=ch.memory?.locked?ch.memory:await smExtract(ch);ch.memory=memory;mark('ch:'+ch.id);if(!followups)return {summary:memory.text,relations:[],threads:[],memory};let extra=null;try{extra=await SAMPLE.json(storyWrapUpPrompt({nt,memory,ch}),{modelTier:'default'});}catch(e){toast('상세 기억은 저장했지만 관계·후속 대화 정리는 실패했어요.');}if(G!==origin||PJ().active!==pid||!G.chapters.includes(ch))return null;return {summary:memory.text,relations:extra?.relations||[],threads:extra?.threads||[],memory};}catch(e){toast('이야기 기억 정리 실패: '+(e.message||e)+'. 설정의 스토리 기억 관리에서 다시 정리할 수 있어요.');return null;}}
/* src/main/0250-story/0465-story-plan.js에서 옮김 */
function storyFlag(id,n,label){ const p=P(); p.flags=p.flags||{}; p.flags[id]={n,label:String(label||'').slice(0,40),at:Date.now()}; mark('prog'); toast(`선택이 기록됐어요 — 이후 이야기에 반영돼요`); }
function planRead(){ const p=gameSlot('world.plan'), lines=v=>String(v||'').split('\n').map(l=>l.split('|').map(s=>s.trim())).filter(x=>x[0]); document.querySelectorAll('#modal [data-pl]').forEach(el=>{ const k=el.dataset.pl.split('.'), v=el.type==='checkbox'?el.checked:el.value;
  if(k.length===1){ p[k[0]]=String(v).trim(); return; } const arr={a:'acts',t:'twists',b:'branches',r:'arcs'}[k[0]], o=p[arr][+k[1]]; if(!o) return;
  if(k[2]==='clues') o.clues=lines(v).map(([ch,hint])=>({ch:Math.max(1,+ch||1),hint:hint||''})).filter(c=>c.hint); else if(k[2]==='options') o.options=lines(v).map(([label,result])=>({label,result:result||''}));
  else if(['upto','reveal','at'].includes(k[2])) o[k[2]]=Math.max(1,+v||1); else o[k[2]]=typeof v==='boolean'?v:String(v).trim(); }); }
