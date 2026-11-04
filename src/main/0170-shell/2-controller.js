/* ===== 0170-shell — Controller(동작을 받아 Model을 바꾸고 다시 그리게 함 · 섞인 함수는 나눌 것) ===== */
/* src/main/0170-shell/010-setup.js에서 옮김 */
async function handleSetupAction(a,t,id,p,e){
  switch(a){
case 'titletap': if(!p.seenOpening&&!p.nameAsked){ p.nameAsked=true; mark('prog'); }
    if(!p.seenOpening) playOpening(); else {closeOv(); render(); checkTriggers(); setTimeout(()=>liveTick(false),1200); setTimeout(prepAsk,2600);} break;
case 'swnext': swRead(); if(SW.step===1) swAddAI(); SW.step=Math.min(5,SW.step+1); renderSetup(); break;
case 'swaddai': swRead(); if(!swAddAI()){toast('키와 모델 정보를 확인해 주세요');break;} APD={id:'',type:APD.type,pub:APD.pub||'google',name:'',region:'global',base:APD.base||'https://openrouter.ai/api/v1'}; SW.ok.ai=false; renderSetup(); toast('추가했어요. 하나 더 넣거나 다음으로 가세요'); break;
case 'swprev': swRead(); SW.step=Math.max(0,SW.step-1); renderSetup(); break;
case 'swlink': openUrl(t.dataset.url); break;
case 'swskipall': appStorage.setItem(SETUP_KEY,'1'); if(PJ().active!=='main'){ await flush(); const pj=PJ(); if(!pj.list.some(x=>x.id==='main')) pj.list.unshift({id:'main',title:DEFAULT_META.title}); pj.active='main'; appStorage.setItem(PJKEY,JSON.stringify(pj)); reloadGame(); break; } SW=null; showStart(); break;
case 'swgo1': swRead(); SW.step=1; renderSetup(); break;
case 'swsub': { const a=($('#sw_sub')||{}).value; if(!String(a||'').trim()){ toast('구독 주소를 붙여 넣어 주세요'); break; } swRead(); swSave(); appStorage.setItem(SETUP_KEY,'1'); try{ sessionStorage.setItem('ggm-picked','1'); }catch(e){} await subscribe(String(a).trim(),uiProg(t)); break; }
case 'swdone': swRead(); swSave(); if(PJ().active!=='main'){ appStorage.setItem(SETUP_KEY,'1'); await flush(); try{ sessionStorage.setItem('ggm-picked','1'); }catch(e){} const pj=PJ(); if(!pj.list.some(x=>x.id==='main')) pj.list.unshift({id:'main',title:DEFAULT_META.title}); pj.active='main'; appStorage.setItem(PJKEY,JSON.stringify(pj)); reloadGame(); break; } { const v=$('#ng_style')?$('#ng_style').value.trim():''; if(v){ G.meta.artTags=v; mark('meta'); } } appStorage.setItem(SETUP_KEY,'1'); SW=null; render(); showStart(); toast('설정을 저장했어요'); break;
case 'swstytest': { swRead(); swSave(); if(!imgReady()){ toast(imgNeed()); break; } const r0=$('#sw_sres'), done=busy(t); say(r0,'그리는 중… 20초쯤 걸려요');
      try{ const el=await naiDraw('char','1girl, solo, long hair, smile, jacket, hand on hip',{styleId:swStyleId()}); if(SW.stPrev) URL.revokeObjectURL(SW.stPrev); SW.stPrev=URL.createObjectURL(el); renderSetup(); }
      catch(err){ toast(naiErr(err,'시험 그리기 실패')); say(r0,''); done(); } break; }
case 'swtestai': { swRead(); const pr=swProfile(), r0=$('#sw_res'); if(!apValid(pr)){toast('키를 넣어 주세요');break;} const done=busy(t); say(r0,'확인 중…');
      try{ const r=await aiOne(Object.assign(pr,{id:'tmp'}),'연결 테스트다. {"ok":true}를 그대로 출력하라.','quick'); SW.ok.ai=!!(r&&r.ok); say(r0,SW.ok.ai?'✓ 연결됨':'응답은 왔지만 형식이 달라요'); }
      catch(err){ say(r0,'✗ '+aiErrText(err)); } finally{ done(); } break; }
case 'swtestnai': { swRead(); const r0=$('#sw_res'); if(!SW.nai){toast('토큰을 넣어 주세요');break;} const done=busy(t); say(r0,'확인 중…');
      try{ const r=await http(naiBase(naiCfg())+'/user/subscription',{headers:NAI_HDR(SW.nai),timeout:20000}); const j=okJSON(r); SW.ok.nai=true; say(r0,`✓ 연결됨 · ${['Paper','Tablet','Scroll','Opus'][j.tier]||'구독'}`); }
      catch(err){ say(r0,'✗ '+naiErr(err,'연결 실패')); } finally{ done(); } break; }
case 'title': showTitle(); break;
case 'swpreset': { swRead(); const p=allPresets().find(x=>x.id===t.dataset.v); if(!p) break; SW.preset=p.id; presetToCfg(p.id); SW.cst=Object.assign(SW.cst||{},{tags:presetQualityParts(p).tags,neg:p.neg||''}); renderSetup(); toast(`「${p.name}」 그림체를 골랐어요`); break; }
case 'sweep': { if(!stamUse(stamCost('farm')*(+t.dataset.n||1))) break; const n=+t.dataset.n||1, r0=rateR(farmReward(t.dataset.k,+t.dataset.lv)), r={}; for(let i=0;i<n;i++){ giveReward(r0); bump('battle'); } Object.entries(r0).forEach(([k,v])=>r[k]=v*n); sfx('확인'); toast(`소탕 ${n>1?n+'회 ':''}완료: `+rewardText(r)); render(); break; }
case 'swdraft': swRead(); swSave(); appStorage.setItem(SETUP_KEY,'1'); openDraft(); break;
case 'swpjdraft': { let g=null; try{ g=JSON.parse(appStorage.getItem(pjKey(id))||'null'); }catch(e){} const d=g&&g.meta&&g.meta.draft; if(!d){ toast('이 게임에는 저장된 초안이 없어요'); break; } swRead(); swSave(); appStorage.setItem(SETUP_KEY,'1'); drLoadFrom(d,(g.meta.title||'')+' 초안'); break; }
case 'titlesnd': { const s=SND(); s.bgmOn=!s.bgmOn; try{ appStorage.setItem(SKEY,JSON.stringify(s)); }catch(err){} if(s.bgmOn){ BGM.name=null; bgm(sceneOf().title); } else bgm(null); titleSndShow(s.bgmOn); toast(s.bgmOn?'배경음을 켰어요':'배경음을 껐어요'); break; }
  }
}
/* src/main/0170-shell/0180-ui-scroll.js에서 옮김 */
/* /UI_SCROLL_MODULE */
/* 그리기 전 처리(Controller — CLAUDE.md §0-2 화면은 상태를 바꾸지 않음): 진행 칸의 하루/주 새로 만들기·형식 맞춤(progTick), 탐사를 야영지 저장 없이 떠나면 끝냄 표시, 로비에서 우편·캐시 처리 → 그리기(renderView) */
function render(){ progTick();
  // 심연 탐사는 야영지에서 저장해야만 나갔다 올 수 있어요. 다른 길로 나가면 탐사가 끝나요.
  if(PREVTAB==='abyss'&&tab!=='abyss'){ const r=progSlot('rogue').run; if(r&&!r.saved) r.left=true; }
  (SCREEN_ENTER[tab]||[]).forEach(f=>f()); PREVTAB=tab;
  renderView(); }
/* src/main/0170-shell/020-navigation-and-tools.js에서 옮김 */
async function handleNavigationAndToolsAction(a,t,id,p,e){
  switch(a){
case 'prepopen': openPrep(false); break;
case 'rebal': await v2RebalanceAll(t); break;
case 'a2hs': openA2HS(); break;
case 'cdart': { const run=progSlot('rogue').run; if(run) drawCardArts(run.deck,uiProg(t)); else if(RF&&rfIds().length) drawCardArts(rgDeck(rfIds()),uiProg(t)).then(()=>{ if(RF&&document.querySelector('.rf-tee')) openRgForm(); }); break; }
case 'bswipe': bannerStep(+t.dataset.d); break;
case 'lktake': lkTake(t); break;
case 'artgo': { const k=ART_ASK; ART_ASK=null; closeModal(); if(k) artRun(k); break; }
case 'artalways': { const sv=naiSaved(); sv.autoArt='auto'; appStorage.setItem(NKEY,JSON.stringify(sv)); const k=ART_ASK; ART_ASK=null; closeModal(); if(k) artRun(k); toast('앞으로는 자동으로 그려요. 설정 → 그림 AI에서 바꿀 수 있어요'); break; }
case 'bpgo': { const cats=bpRead(); if(!cats.length){ toast('하나 이상 골라 주세요'); P().bootPrep=0; break; } bootPrepRun(cats); break; }
case 'bpbg': { const cats=bpRead(); showTitle(); if(cats.length) runPrep(cats,null,{order:bootCats().map(x=>x[0])}); break; }
case 'bpskip': P().bootPrep=1; P().prepAsked=today(); mark('prog'); showTitle(); break;
case 'bpleave': if(PREPJOB){ PREPJOB.fg=false; prepChip(); } showTitle(); toast('남은 그림은 위쪽 진행 표시에서 확인할 수 있어요'); break;
case 'prepgo': { const cats=[...document.querySelectorAll('[data-pc]')].filter(x=>x.checked).map(x=>x.dataset.pc); if(!cats.length){toast('하나 이상 골라 주세요');break;} closeModal(); runPrep(cats); break; }
case 'prepstop': if(PREPJOB){ PREPJOB.stop=true; prepChip(); toast('지금 그리는 것까지만 하고 멈출게요'); } break;
case 'prepnever': P().prepNever=true; mark('prog'); closeModal(); toast('설정 → 그림 AI에서 언제든 열 수 있어요'); break;
case 'opnext': opNext(); break;
case 'pfdraw': playerDraw(uiProg(t)); break;
case 'pfsave': readPlayerForm(); refreshPlayerForm(); toast('저장했어요'); break;
case 'go': tab=t.dataset.to; closeModal(); if(!$('#phone').hidden) closePhone(); render(); viewTop(); break;
case 'close': window.navBack(); break;
case 'goback': window.navBack(); break;
case 'lbhide': lobbyMenu(false); toast('화면을 누르면 메뉴가 돌아와요'); break;
case 'lbshow': lobbyMenu(true); break;
case 'poke': { if(lobbyMenuHidden()){ lobbyMenu(true); break; } const c=charById(p.sec); if(!c||!own(c.id)) break;
      const r=t.getBoundingClientRect(), fy=e.clientY?(e.clientY-r.top)/r.height:0.2, zone=fy<0.3?'head':fy<0.72?'body':'base';
      let pool=spoilFree(c,zone==='head'?c.touch?.head:zone==='body'?c.touch?.body:affLinePool(c)); if(!pool.length) pool=affLinePool(c);
      const face=touchFace(c,zone,affLv(own(c.id)));
      addAff(c,zone==='body'?1:2); bump('touch'); mark('prog');
      const l=pickTouchLine(pool,lobbyBubbleText()); lobbyPokeShow(t,e,c,l,zone,face); if(c.voiceId&&SND().voiceLobby) speak(c,l); break; }
case 'lbbgdel': { if(playMode())break;const c=charById(id); if(!c?.lbbg||!(await appConfirm('로비 레이어의 배경만 지울까요?'))) break; await imgClear(c.lbbg); mark('c:'+c.id); openChar(c.id); render(); break; }
case 'altnew': { if(!SAMPLE){ toast('이격을 만들려면 설정 → 글 AI를 먼저 등록해 주세요'); break; } closeModal(); openNewPickup({kind:'alt',base:id}); break; }
case 'scggen': { const c=charById(id); if(!c) break; if(!String(c.naiPrompt||'').trim()){toast('먼저 설정 편집에서 NAI 스탠딩 프롬프트를 채워 주세요');break;} if(!imgReady()){toast(imgNeed());break;} if(!SAMPLE){toast('기술 컷인 장면을 구성하려면 설정 → 글 AI를 먼저 등록해 주세요.');break;} const o=scgSlot(c), done=busy(t,'그리는 중…');
      try{ const el=await generateUltimateCutin(c); await storeImage(o,el,''); o.prompt=el.__candidateConfig?.prompt||o.prompt; mark('c:'+c.id); toast('기술 컷인을 그렸어요'); openChar(c.id); }catch(err){ toast(naiErr(err,'기술 컷인 실패')); done(); } break; }
case 'scgdel': { const c=charById(id); if(!c||!c.scg) break; if(!(await appConfirm('기술 컷인을 지울까요?'))) break; const o=c.scg;await imgClear(o); mark('c:'+c.id); openChar(id); break; }
case 'scgtest': { const c=charById(id); if(c) skillCut(c,c.skill.name,true,document.body); break; }
case 'ilgen': { const c=charById(id); if(!c) break; const k=t.dataset.k==='lbcg'?'lbcg':'illust'; if(!SAMPLE){toast('설정 → 글 AI를 먼저 등록해 주세요.');break;} const sc=$(k==='lbcg'?'#lb_scene':'#il_scene'); if(sc){ c[k].prompt=sc.value.trim();naiBlocksSave(c[k],'prompt',sc); mark('c:'+c.id); } if(!String(c.naiPrompt||'').trim()){toast('먼저 설정 편집에서 NAI 스탠딩 프롬프트를 채워 주세요');break;} openNaiPrep(k,c.id); break; }
case 'vncgview': { const im=$('#vnCG img'); if(im) imgViewer(im.src); break; }
case 'cguse': { const o=own(id); if(!o) break; o.useCg=t.checked; mark('prog'); toast(o.useCg?'로비에 '+T('limit')+' CG를 써요':'로비에 기본 일러스트를 써요'); break; }
case 'ildel': { const c=charById(id), k=t.dataset.k==='lbcg'?'lbcg':'illust'; if(!c||!(await appConfirm(k==='lbcg'?T('limit')+' CG를 지울까요?':'일러스트를 지울까요?'))) break; const o=c[k];await imgClear(o); mark('c:'+c.id); render(); openChar(id); break; }
case 'ailog': openModal(aiLogHTML(!!(t.closest('#drPage')||t.dataset.v))); break;
case 'ailogcopy': { const tx=aiLogText()||'기록 없음'; try{ await navigator.clipboard.writeText(tx); toast('AI 기록을 복사했어요'); }catch(e){ prompt('복사해 주세요',tx); } break; }
case 'ailogclear': AILOG.length=0; try{ appStorage.removeItem('ggm-ailog'); }catch(e){} openModal(aiLogHTML(!!$('#modal [data-act="draft-open"]'))); break;
case 'artcopy': { const c=naiCfg(), el=c.styles.find(x=>x.id===c.styleId)||c.styles[0]||{tags:'',neg:''}; if(!String(el.tags||'').trim()&&!String(el.neg||'').trim()){ toast('설정의 그림 AI에 그림체가 비어 있어요'); break; } $('#mt_art').value=el.tags||''; $('#mt_artn').value=el.neg||''; toast(`「${el.name||'기본 그림체'}」 태그·네거티브를 넣었어요. 저장하면 이 게임에 고정돼요`); break; }
case 'artclear': $('#mt_art').value=''; $('#mt_artn').value=''; toast('비웠어요. 저장하면 설정의 기본 그림체를 따라가요'); break;
case 'pthumbset': uploadFor={kind:'pthumb',id:t.dataset.v}; $('#file').click(); break;
case 'avdel': { const av=progSlot('avatar'); if(!av||!av.img||!(await appConfirm('프로필 그림을 지울까요?'))) break; await imgClear(av); mark('prog'); refreshPlayerForm(); toast('프로필 그림을 지웠어요'); break; }
case 'pthumbdel': { const pid=t.dataset.v, up=userPacks(), mine=up.find(x=>x.id===pid); if(mine){ delete mine.thumb; saveUserPacks(up); } const m=pthumbs(); delete m[pid]; try{ appStorage.setItem(PTHUMB,JSON.stringify(m)); }catch(e){} if($('#modal [data-act="packuse"]')) openModal(packHTML()); else if($('#modal [data-act="naipreset"]')) openNaiSet(); toast('썸네일을 지웠어요'); break; }
case 'addchar-open': openAddChar(); break;
case 'addchar-hand': { NEWPU=false; window.__ADDOWN=$('#ac_how').value==='own'; closeModal(); openCharEdit(null); break; }
case 'addchar-ai': { const con=$('#ac_c').value.trim(), rr=$('#ac_r').value, how=$('#ac_how').value; if(!con){ toast('어떤 '+T('crew')+'인지 적어 주세요'); break; } closeModal();
      bgJob('addchar',T('crew')+' 만드는 중',async()=>{ const c=await aiNewPickupChar(con,rr,null); if(!c) return null; c.limited=false; mark('c:'+c.id); if(how==='own') joinChar(c,'새로'); artAfterAI(x=>x.o===c||x.c===c,'새 '+T('crew')+' '+c.name);
        return {title:`${RL[c.rarity]} ${c.name}을(를) 추가했어요`,body:how==='own'?`바로 ${T('crew')}로 합류했어요.`:`상시 ${T('gacha')}에서 만날 수 있어요.`}; }); break; }
case 'copy': try{await navigator.clipboard.writeText(t.dataset.text||'');toast('복사했어요');}catch(err){toast('복사하지 못했어요. 길게 눌러 직접 복사해 주세요.');} break;
case 'copyfield': { const f=$('#'+t.dataset.f); try{await navigator.clipboard.writeText(f.value);toast('복사했어요');}catch(err){uiSelectText(f);toast('선택한 텍스트를 직접 복사해 주세요');} break; }
case 'playep': { const c=charById(id),ep=c.episodes.find(x=>x.id===t.dataset.ep); if(epLock(c,ep,own(id))){toast(epLock(c,ep,own(id))+' 필요');break;} closeModal();
      playStory(`${c.name} · ${ep.title}`,ep.script,()=>{const o=own(id);if(o){o.seen=o.seen||[];if(!o.seen.includes(ep.id)){o.seen.push(ep.id);mark('prog');}}openChar(id);}); break; }
case 'mapedit': { const ch=G.chapters.find(x=>x.id===t.dataset.ch); if(!ch) break; const l=ensureChMap(ch); openLibItem(l.id); break; }
case 'locked': toast('이전 작전을 먼저 클리어하세요'); break;
case 'ghist': openHistory(); break;
case 'vnnext': vnStep(); break;
case 'vnpick': { e.stopPropagation(); if(!S||!S.choice) break; const n=+t.dataset.n,o=S.choice.opts[n-1]; S.pick=n; S.lastPick=o; S.choice=null; if(S.branch){ storyFlag(S.branch,n,o); S.branch=null; } vnChoiceClear(); vnShow({type:'say',who:T('player'),text:o}); break; }
case 'vnauto': e.stopPropagation(); S.auto=!S.auto; chipOn(t,S.auto); if(S.auto&&!S.typing&&!S.choice) S.autoT=setTimeout(vnStep,700); else clearTimeout(S.autoT); break;
case 'vnskip': e.stopPropagation(); vnSkip(); break;
case 'vnlog': e.stopPropagation(); openVnLog(); break;
case 'bquit': if(B?.ctx.kind==='practice'){v2StopPractice();break;}if(B&&(B.ctx.kind==='raid'||B.ctx.kind==='rogue')){ if((await appConfirm(B.ctx.kind==='raid'?'여기서 끝낼까요? 지금까지 준 피해는 기록돼요.':'후퇴하면 이번 탐사가 끝나요. 지금까지의 보상은 받아요.'))){ if(!B.over) bEnd(false); } break; }
      if((await quitConfirm())){clearInterval(B.timer);B=null;closeOv();render();} break;
case 'skill': { const u=B&&B.allies[+t.dataset.i]; if(u&&u.hp>0&&!B.over){ SCUT_MAN=true; useSkill(u); SCUT_MAN=false; } bUpdate(); break; }
case 'bretry': { const st=B.s,cx=B.ctx; B=null; startStage(st,cx); break; }
case 'flip': revealCard(+t.dataset.i); break;
case 'flipall': flipAll(); break;
case 'gcskip': { GC.timers.forEach(clearTimeout); GC.skip=true; gachaSkipShow(t); break; }
case 'closepull': { if(GC.open.size<GC.res.length){flipAll();break;}
      const best=GC.res.filter(x=>x.isNew).sort((a,b)=>b.c.rarity-a.c.rarity)[0]; GC.timers.forEach(clearTimeout); GC=null; closeOv(); render();
      if(best) toast(`${best.c.name}와(과) 계약했어요`); setTimeout(()=>checkTriggers(),800); break; }
case 'sdelno': { const o=SDEL&&SDEL.o; SDEL=null; if(o&&o.back) o.back(); else closeModal(); break; }
case 'sdelgo': { if(!SDEL) break; const {o,L}=SDEL, pick={}; document.querySelectorAll('[data-sd]').forEach(i=>{ pick[i.dataset.sd]=i.checked; }); SDEL=null;
      storyPurge(L,pick); o.run(); o.ids.forEach(id=>{ delete P().cleared[id]; if(P().stars) delete P().stars[id]; }); mark('prog'); closeModal(); if(o.after) o.after(); render();
      const n=['threads','codex','libs','rels','chars'].filter(k=>pick[k]).reduce((a,k)=>a+L[k].length,0); toast(`「${o.title}」을(를) 지웠어요${n?` · 연결된 것 ${n}개도 함께`:''}`); break; }
case 'saveopening': G.opening.lines=lines($('#op_lines').value); G.opening.prologue=$('#op_pro').value; mark('opening'); closeModal(); toast('오프닝을 저장했어요'); break;
case 'aiopening': { const hint=$('#op_hint').value.trim();
      const r=await aiJSON(aiopeningPrompt({hint}),uiProg(t),'complex');
      if(r&&$('#op_lines')){ $('#op_lines').value=strs(r.lines).join('\n'); $('#op_pro').value=nl(r.prologue); toast('입력칸을 채웠어요. 확인 후 저장하세요.'); } break; }
case 'savelib': { const name=$('#li_name').value.trim(); if(!name){toast('이름을 입력해 주세요');break;}
      let l=id?libById(id):null; if(!l){l={id:'l'+uid(),kind:t.dataset.k,name,prompt:'',img:null};G.lib.push(l);}
      l.name=name; l.prompt=$('#li_prompt').value.trim(); if(l.kind!=='bgm')naiBlocksSave(l,'prompt','li_prompt'); if(l.kind==='cg') l.cast=[0,1,2,3].map(i=>({id:$('#cg_c'+i).value,pos:$('#cg_p'+i).value,act:$('#cg_a'+i).value.trim()})).filter(x=>x.id); mark('l:'+l.id); render(); openLibItem(l.id); toast('저장했어요'); break; }
case 'dellib': { const l=libById(id); if((await appConfirm('삭제할까요?'))){G.lib=G.lib.filter(x=>x.id!==id);mark('l:'+id);openLib(l.kind);render();} break; }
case 'ailib': { const k=t.dataset.k,nm=$('#li_name').value.trim(),ds=$('#li_desc').value.trim();
      if(k==='cg'){ const ids=[0,1,2,3].map(i=>$('#cg_c'+i).value).filter(Boolean).map(charById).filter(Boolean);
        const r=await aiJSON(ailibPrompt({nm,ds,ids}),uiProg(t),'quick');
        if(r&&$('#li_prompt')){ if(r.prompt)$('#li_prompt').value=String(r.prompt); strs(r.acts).forEach((a2,i)=>{const e2=$('#cg_a'+i); if(e2&&!e2.value.trim()) e2.value=a2;}); } break; }
      if(k==='bgm'){ const r=await aiJSON(ailibPrompt2({nm,ds}),uiProg(t),'quick'); if(r&&r.prompt&&$('#li_prompt')) $('#li_prompt').value=String(r.prompt); break; }
      if(k==='enemy'){ const r=await aiJSON(ailibPrompt3({nm,ds}),uiProg(t),'quick'); if(r&&r.prompt&&$('#li_prompt')) $('#li_prompt').value=String(r.prompt); break; }
      const r=await aiJSON(ailibPrompt4({k,nm,ds}),uiProg(t),'quick');
      if(r&&r.prompt&&$('#li_prompt')) $('#li_prompt').value=String(r.prompt); break; }
case 'newpu': openNewPickup(); break;
case 'newpu-hand': { NEWPU=$('#pu_lim').value==='limited'?'limited':'pickup'; window.__PUSTORY=!!($('#pu_story')&&$('#pu_story').checked); closeModal(); openCharEdit(null); break; }
case 'newpu-ai': { const con=$('#pu_c').value.trim(), kind=$('#pu_kind')?$('#pu_kind').value:'orig', col=kind==='collab'?{src:$('#pu_src').value.trim(),who:$('#pu_who').value.trim()}:null, altB=kind==='alt'?charById($('#pu_base').value):null;
      if(kind==='alt'&&!altB){ toast('누구의 이격인지 골라 주세요'); break; }
      if(col&&!col.src){ toast('콜라보할 작품 이름을 적어 주세요'); break; } if(!con&&!col&&!altB){toast('어떤 '+T('crew')+'인지 적어 주세요');break;} if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); break; }
      const rr=$('#pu_r').value, lim=col?true:$('#pu_lim').value==='limited';
      const story=!!($('#pu_story')&&$('#pu_story').checked); const canon=!!(altB&&$('#pu_canon')&&$('#pu_canon').value==='canon');
      // 창을 닫기 전에 칸을 모두 읽어 둬요
      const nEx=+($('#pu_ex')?$('#pu_ex').value:0), split=$('#pu_split')&&$('#pu_split').value==='split', exs=[]; for(let i=1;i<=nEx;i++) exs.push({r:$('#pu_exr'+i).value,c:$('#pu_exc'+i).value.trim()});
      closeModal();
      bgJob('pickup','픽업 만드는 중',async j=>{ j.total=1+nEx; j.sub='주인공'; bgJobsDraw();
        const c=await aiNewPickupChar(con,rr,null,col,altB?Object.assign(Object.create(altB),{__canon:canon}):null); if(!c) return null; j.step=1;
        const ex=[]; for(let i=0;i<exs.length;i++){ const er=exs[i].r, ec=exs[i].c; j.sub=`함께 픽업 ${i+1}/${nEx}`; bgJobsDraw();
          const c2=await aiNewPickupChar(ec||`이번 픽업의 주인공 「${c.name}」(${c.faction||''}, ${String(c.profile||'').slice(0,160)})와(과) 함께 등장하는 ${RL[er]||'SR'} ${T('crew')}. 둘의 관계(동료·라이벌·자매·주종 등)와 테마가 이어지게. 외모와 역할은 겹치지 않게`,er,null,null,null); j.step=i+2; if(c2){ if(lim&&!split){ c2.limited=true; mark('c:'+c2.id); } ex.push(c2); } }
        const b=addPickupFor(c,lim);
        if(ex.length&&!split){ ex.forEach(x=>b.pickup.push(x.id)); b.name=`${c.name} 외 ${ex.length}명 픽업`; b.desc=`${RL[c.rarity]} ${c.name}${ex.map(x=>` · ${RL[x.rarity]} ${x.name}`).join('')} 확률 업`; }
        ex.forEach((x,i)=>{ if(split){ const b2=addPickupFor(x,lim); b2.name=`${i+2}차 픽업: ${x.name}`; } });
        if(split) P().curBanner=b.id; mark('prog');
        if(story) puStoryBg(c,lim); const all=[c,...ex]; artAfterAI(y=>all.includes(y.o)||all.includes(y.c),'신규 '+T('crew')+' '+all.map(x=>x.name).join(', '));
        return {title:(c.alt?`이격 ${RL[c.rarity]} ${c.name}`:`신규 ${RL[c.rarity]} ${c.name}`)+(ex.length?` 외 ${ex.length}명`:'')+' 픽업이 열렸어요',body:`${T('gacha')} 화면에서 바로 뽑을 수 있어요.${story?'\n픽업 스토리는 이어서 뒤에서 쓰고 있어요. 다 되면 이벤트에 열려요.':''}`}; }); break; }
case 'nextneedai': toast('설정 → 글 AI에서 AI를 먼저 등록해 주세요'); break;
case 'cplogin': readAp(); copilotLogin(t); break;
case 'saload': { const inp=document.createElement('input'); inp.type='file'; inp.accept='.json,application/json'; inp.onchange=async()=>{ const f=inp.files[0]; if(!f) return; const tx=await f.text(); if($('#ap_sa')) $('#ap_sa').value=tx; try{ const j=JSON.parse(tx); if($('#ap_project')&&!$('#ap_project').value) $('#ap_project').value=j.project_id||''; toast('서비스 계정 키를 불러왔어요'); }catch(e){ toast('JSON 파일이 아니에요'); } }; inp.click(); break; }
case 'seasoninfo': openSeasonInfo(); break;
case 'seasontog': { const L=P().live; const k=t.dataset.k; const en=SEASONS.filter(x=>L.seasons[x[0]]!==false).length; if(L.seasons[k]!==false&&en<=1){ toast('하나는 남겨 두세요'); break; } L.seasons[k]=L.seasons[k]===false; mark('prog'); openSeasonInfo(); break; }
case 'seasonskip': { if(LIVE_RUN){ toast('이미 업데이트 중이에요'); break; } if(!(await appConfirm('지금 다음 시즌으로 넘길까요? 진행 중인 이벤트는 끝나요.'))) break; closeModal(); liveTick('season'); break; }
case 'livetog': { const L=P().live; L.on[t.dataset.k]=!L.on[t.dataset.k]; mark('prog'); render(); break; }
case 'liverun': if(LIVE_RUN){toast('이미 업데이트 중이에요');break;} if(!SAMPLE&&(P().live.on.event||P().live.on.talk||P().live.on.chapter)) toast('글 AI가 없어서 AI가 필요한 항목은 건너뛰어요'); liveTick(true); break;
case 'enh': case 'enhmax': case 'lb': case 'wup': { const c=charById(id); if(c&&own(id)) openUpConfirm(c,a==='lb'&&own(id).lv>=70?'transc':a); break; }
case 'skvclear': { const c=charById(id), k=c&&(c.skins||[]).find(x=>x.id===t.dataset.s); if(!k) break; k.voiceId=''; k.voiceName=''; mark('c:'+c.id); skinRefresh(id); break; }
case 'aiskin': { const c=charById(id),idea=$('#sk_idea').value.trim(),field=$('#sk_prompt'),project=PJ().active,old=field.value,original=c.naiPrompt;
      if(!idea){toast('의상 아이디어를 적어 주세요');break;}
      const base=await naiSkinBase(c,uiProg(t));
      const r=await aiJSON(aiskinPrompt({c,base,idea}),uiProg(t),'quick');
      if(r&&field.isConnected&&PJ().active===project&&charById(id)===c&&c.naiPrompt===original&&field.value===old){naiBlocksSeed(field,naiSkinParts(base,r));if(!$('#sk_name').value.trim())$('#sk_name').value=idea.slice(0,16);}break; }
case 'skpredo': skinPropRead(); skinPropDraw(uiProg(t)); break;
case 'skpcancel': if(SKPROP){ if(SKPROP.url) URL.revokeObjectURL(SKPROP.url); const cid=SKPROP.cid; SKPROP=null; openSkin(cid); } else closeModal(); break;
case 'skpok': { skinPropRead(); const P0=SKPROP, c=P0&&charById(P0.cid); if(!c||!P0.blob) break; busy(t);
      const k={id:'k'+uid(),name:P0.name,prompt:P0.prompt,naiBlocks:clone(P0.naiBlocks||{}),idea:P0.idea,scene:P0.scene||'',img:null,faces:[]}; c.skins.push(k); await storeImage(k,P0.blob,''); mark('c:'+c.id);
      const sel=Object.assign({},P0.sel); URL.revokeObjectURL(P0.url); SKPROP=null; toast(`${T('skin')} 「${k.name}」을(를) 만들었어요 · ${T('crew')} 화면의 외형에서 입힐 수 있어요`); openChar(c.id);
      skinMakeRest(c,k,sel); break; }
case 'bnfac': { readBanner(); const v=t.dataset.v,a=BD.pool.factions; a.includes(v)?a.splice(a.indexOf(v),1):a.push(v); openBannerFrom(BD); break; }
case 'bnid': { readBanner(); const v=t.dataset.v,a=BD.pool.ids; a.includes(v)?a.splice(a.indexOf(v),1):a.push(v); openBannerFrom(BD); break; }
case 'bnup': { readBanner(); const v=t.dataset.v,a=BD.pickup; a.includes(v)?a.splice(a.indexOf(v),1):a.push(v); openBannerFrom(BD); break; }
case 'bnsave': { const el=readBanner(); if(!el.id){el.id='b'+uid();G.banners.push(el);} else {const i=G.banners.findIndex(bn=>bn.id===el.id);G.banners[i]=el;} P().curBanner=el.id; mark('prog'); closeModal(); render(); toast('배너를 저장했어요'); break; }
case 'bndel': if((await appConfirm('이 배너를 삭제할까요?'))){G.banners=G.banners.filter(bn=>bn.id!==BD.id);P().curBanner='';closeModal();render();} break;
case 'dsauto': { const d0=dispList().find(x=>x.id===DSEL.id), busy=busyIds(); if(!d0) break; DSEL.ids=G.chars.filter(c=>own(c.id)&&!busy.has(c.id)).sort((a,b)=>own(a.id).lv-own(b.id).lv||charPower(a)-charPower(b)).slice(0,d0.need).map(c=>c.id); openDispSel(DSEL.id); break; }
case 'dsclr': DSEL.ids=[]; openDispSel(DSEL.id); break;
case 'pgetall': { const lv=passLv(), tot={}; let n=0; for(let l=1;l<=lv;l++){ if(P().pass.got.includes(l)) continue; P().pass.got.push(l); const r=passReward(l); giveReward(r); Object.entries(r).forEach(([k,v])=>{ if(typeof v==='number') tot[k]=(tot[k]||0)+v; }); n++; } const d=progSlot('dm'); MISSIONS.forEach(m=>{ if(!d.got[m.k]&&(d.cnt[m.k]||0)>=m.goal){ d.got[m.k]=true; P().pass.xp+=m.xp; giveReward({gems:50}); tot.gems=(tot.gems||0)+50; n++; } }); if(!n){ toast('받을 보상이 없어요'); break; } mark('prog'); sfx('확인'); toast('모두 받았어요: '+rewardText(tot)); render(); break; }
case 'dsel': { const a=DSEL.ids, d0=dispList().find(x=>x.id===DSEL.id); if(a.includes(id)) a.splice(a.indexOf(id),1); else { if(d0&&a.length>=d0.need){ toast(`${d0.need}명까지만 보낼 수 있어요`); break; } a.push(id); } openDispSel(DSEL.id); break; }
case 'mget': { const m=MISSIONS.find(x=>x.k===t.dataset.k), d=progSlot('dm'); if(d.got[m.k]||(d.cnt[m.k]||0)<m.goal) break; d.got[m.k]=true; P().pass.xp+=m.xp; giveReward({gems:50}); sfx('확인'); render(); break; }
case 'pget': { const l=+t.dataset.lv; if(l>passLv()||P().pass.got.includes(l)) break; P().pass.got.push(l); const r=passReward(l); giveReward(r); sfx('확인'); toast(`패스 ${l}단계: ${rewardText(r)}`); render(); break; }
case 'logoprev': logoPreview($('#mt_logo').value); break;
case 'logoprevclose': logoPreviewClose(); break;
case 'aievent-open': openAiEvent(); break;
case 'aievent': await aiEvent(t); break;
case 'sfxplay': { const l=libById(id); if(l) sfx(l.name); break; }
case 'sfxgen': { const l=libById(id), done=busy(t); try{ await elSfx(l); sfx(l.name); openLib('sfx'); }catch(err){ toast((AIERR[err&&err.code]||'효과음 생성 실패')+' '+((err&&err.message)||'')); done(); } break; }
case 'sfxall': { const items=G.lib.filter(l=>l.kind==='sfx'&&!l.audio); if(!items.length){toast('모두 등록돼 있어요');break;} busy(t); let n=0;
      for(const l of items){ say(t,`만드는 중 ${n}/${items.length}`); try{ await elSfx(l); n++; }catch(err){ toast((AIERR[err&&err.code]||'중단')+' '+((err&&err.message)||'')); break; } }
      toast(`효과음 ${n}개를 만들었어요`); openLib('sfx'); break; }
case 'vtest': { const c=charById(id); await speak(c,c.intro||c.lines[0]||c.name); break; }
case 'dsopen': openDesign(); break;
case 'dssave': { G.meta.design=designRead(); mark('meta'); closeModal(); render(); toast('캐릭터 디자인 태그를 저장했어요. 새로 그리는 그림부터 적용돼요'); break; }
case 'dsai': designAI(uiProg(t)); break;
case 'shareopen': openShare(); break;
case 'sharego': { const img=$('#sh_img').checked, audio=$('#sh_aud').checked, gate=$('#sh_gate')?$('#sh_gate').checked:true; closeModal(); exportFile({share:true,img,audio,gate}); break; }
case 'fbopen': openFeedback(); break;
case 'fbissue': { const txt=feedbackText(); const url=`https://github.com/${updRepo(LV())}/issues/new?title=${encodeURIComponent('[피드백] '+(($('#fb_bad')&&$('#fb_bad').value.trim())||($('#fb_good')&&$('#fb_good').value.trim())||'의견').slice(0,40))}&body=${encodeURIComponent(txt)}`; openUrl(url); break; }
case 'fbpost': { try{ await navigator.clipboard.writeText(feedbackText()); toast('피드백을 복사했어요. 게시글 댓글에 붙여 넣어 주세요'); }catch(err){ quietErr(err,'0510-actions/020-navigation-and-tools.js:170'); } openUrl(LV().feedback); break; }
case 'fbstar': FB_STAR=+t.dataset.n; fbStarsShow(); break;
case 'fbsend': { const txt=feedbackText(); await shareText(G.meta.title+' 피드백',txt); break; }
case 'guidecopy': shareText(G.meta.title+' 테스트 안내',guideText()); break;
case 'skbdraw': { const f=skinShopList().find(x=>x.k.id===id); if(!f) break; if(!imgReady()){ toast(imgNeed()); break; } if(document.querySelector('[data-skp]')) SKBUYSEL=skinSelRead(); busy(t,'그리는 중…');
      try{ const target=skinPrimaryPart(f.c,f.k),el=await skinPartDraw(f.c,f.k,target===f.k?'stand':'upper','manual');await storeImage(target,el,''); mark('c:'+f.c.id); }catch(err){ toast(naiErr(err)); } openSkinBuy(id); break; }
case 'skbbuy': { const f=skinShopList().find(x=>x.k.id===id); if(!f) break; const p=P(), pr=f.k.price||SKIN_PRICE, sel=skinSelRead(); SKBUYSEL=sel; p.skinOwn=p.skinOwn||{}; if(p.skinOwn[id]) break;if(!skinDisplayReady(f.c,f.k)){toast('현재 표시 방식에 맞는 스킨 그림을 먼저 생성해 주세요');break;}if(p.gems<pr){ toast(`${T('currency')}이 모자라요`); break; }
      pay({gems:pr}); p.skinOwn[id]=true; f.k.faces=f.k.faces||[]; mark('prog'); closeModal(); render(); buyFx(f.k.name,`${f.c.name}의 ${T('skin')}`+(own(f.c.id)?' · 외형에서 입힐 수 있어요':' · '+T('crew')+'를 얻으면 입힐 수 있어요')); skinMakeRest(f.c,f.k,Object.assign({},sel)); break; }
case 'reroll0': { if(!(await appConfirm(`리세마라: 보유 ${T('crew')}·재화·클리어 기록만 지우고 처음부터 다시 해요.\n세계관·${T('crew')}·스토리·그림·설정은 그대로예요. 진행할까요?`))) break;
      const o=P(), keep={}; ['player','genderTxt','gender','look','bio','hideEyes','avatar','nameAsked','settings','scene','lobbyMode','csFull','lobbyBg','titleBg','titleChar','gachaBg','skillCut','battleMotion'].forEach(k=>{ if(o[k]!==undefined) keep[k]=o[k]; });
      G.prog=Object.assign(clone(DEFAULT_PROG),keep,{seenOpening:false,castDone:1,bootPrep:1}); markAll(); await flush(); reloadGame(); break; }
case 'cachewipe': { if(!(await appConfirm('캐시 삭제: 이 기기의 모든 게임·그림·설정·API 키를 지우고 앱을 처음 받은 상태로 되돌려요. 되돌릴 수 없어요.'))) break; if(!(await appConfirm('정말 지울까요? 필요하면 먼저 전체 백업을 저장해 두세요.'))) break;
      const previous=window.__NOFLUSH;window.__NOFLUSH=1;try{await appStorage.clear();sessionStorage.clear();if(window.caches)for(const k of await caches.keys())await caches.delete(k);await reloadGame();}catch(e){window.__NOFLUSH=previous;storageWarning('초기화를 완료하지 못했습니다. '+(e.message||e));}break; }
  }
}
/* src/main/0170-shell/0230-modal.js에서 옮김 */
/* 캐릭터 창 열기(Controller): 창을 그리고, 5돌파 CG를 처음 보면 본 것으로 하고 펼침 연출 */
function openChar(id){ const c=charById(id); if(!c) return; charSheetShow(id); if(cgFirstSeen(c)) setTimeout(()=>lbReveal(c),500); }
function readCharForm(c){
  const name=$('#f_name').value.trim(); if(!name){toast('이름을 입력해 주세요');return false;}
  const aff={}; lines($('#f_aff').value).forEach(l=>{const m=l.match(/^(\d+)\s*[:：]\s*(.+)$/); if(m)(aff[m[1]]=aff[m[1]]||[]).push(m[2]);});
  const files=lines($('#f_files').value).map(l=>{const m=l.match(/^(\d)\s*[:：]\s*(.+)$/);return m?{dup:+m[1],text:m[2]}:{dup:1,text:l};});
  Object.assign(c,{baseStatsVersion:1,name,faction:$('#f_fac').value.trim(),rarity:+$('#f_rar').value,role:(posById($('#f_pos').value)||posOf(c)).base,pos:(posById($('#f_pos').value)||posOf(c)).id,elem:$('#f_elem').value,limited:$('#f_lim').value==='1',
    hp:num($('#f_hp').value,100,1e10,1000),atk:num($('#f_atk').value,10,9999,100),def:num($('#f_def').value,0,1e8,50),spd:num($('#f_spd').value,30,300,100),
    profile:$('#f_prof').value.trim(),intro:$('#f_intro').value.trim(),lines:lines($('#f_lines').value),affLines:aff,files,
    lvLines:lines($('#f_lv').value),dupLines:lines($('#f_dup').value),
    touch:{head:lines($('#f_head').value),body:lines($('#f_body').value),pet:(c.touch&&c.touch.pet)||[]},naiPrompt:$('#f_nai').value.trim(),noDesign:$('#f_nodesign')?$('#f_nodesign').checked:!!c.noDesign});
  c.weapon=Object.assign(c.weapon||{id:'w_'+c.id,img:null},{name:$('#f_wn').value.trim(),desc:$('#f_wd').value.trim(),prompt:$('#f_wp').value.trim()});
  naiBlocksSave(c,'naiPrompt','f_nai');naiBlocksSave(c.weapon,'prompt','f_wp');
  if(!c.weapon.id||c.weapon.id==='w_') c.weapon.id='w_'+c.id;
  c.skill={name:$('#f_sk').value.trim()||'스킬',kind:$('#f_kind').value,power:num($('#f_pow').value,0.1,10,1.5),cd:num(Math.round($('#f_cd').value),1,9,3),desc:$('#f_skd').value.trim()};
  return true;
}
/* src/main/0170-shell/0370-game-picker.js에서 옮김 */
function bpRead(){ P().prepAsked=today(); if($('#bp_tags')){ G.meta.artTags=$('#bp_tags').value.trim(); mark('meta'); }
  const cats=bootCats().map(x=>x[0]).filter(k=>{const el=document.querySelector(`[data-bpc="${k}"]`);return el&&el.checked;}); BP.cats=new Set(cats); P().bootPrep=1; mark('prog'); return cats; }
/* src/main/0170-shell/0410-desktop.js에서 옮김 */
function openA2HS(first){ if(first) appStorage.setItem('ggm-a2hs','1');
  openModal(a2hsHTML()); }
/* src/main/0170-shell/050-settings-and-audio.js에서 옮김 */
async function handleSettingsAndAudioAction(a,t,id,p,e){
  switch(a){
case 'pxopen': openProxySet(); break;
case 'pxsave': { const v=$('#px_url').value.trim(); if(v&&!/^https:\/\//.test(v)){ toast('https:// 로 시작하는 주소를 넣어 주세요'); break; } appStorage.setItem('ggm-proxy',v); PXHOSTS.clear(); closeModal(); render(); toast(v?'중계 서버를 저장했어요':'중계 서버를 껐어요'); break; }
case 'pxtest': { const v=$('#px_url').value.trim(); if(!v){toast('주소를 넣어 주세요');break;} const done=busy(t); try{ const r=await fetch(v.replace(/\/+$/,'')+'/?u='+encodeURIComponent('https://raw.githubusercontent.com/'+RELEASE_REPO+'/main/version.json')); toast(r.ok?'중계 서버가 잘 동작해요':'중계 서버 응답: '+r.status); }catch(e){ toast('중계 서버에 연결하지 못했어요'); } done(); break; }
case 'appre': { readAp(); const x=OAI_PRESETS[+t.dataset.i]; if(!x) break; APD.base=x[1]; if(x[2]&&!APD.model) APD.model=x[2]; if(!APD.name||APD.name===AITYPE.openai||OAI_PRESETS.some(y=>y[0]===APD.name)) APD.name=x[0]; if($('.sw-card')) renderSetup(); else openAp(); break; }
case 'setupopen': closeModal(); showSetup(); break;
case 'setname': p.player=($('#nm_in').value.trim()||'').slice(0,12); { const cv=$('#nm_call')&&$('#nm_call').value.trim().slice(0,12); if(cv&&cv!==T('player')){ G.meta.terms.player=cv; mark('meta'); } } mark('prog'); closeModal(); playStory('프롤로그',G.opening.prologue,afterPrologue); break;
case 'playmode': { if(subLocked()){ toast('구독한 게임은 플레이 전용이에요. 고치려면 설정 → 게임에서 구독 끊기를 하세요'); break; } const on=!playMode(); try{ appStorage.setItem('ggm-play',on?'1':'0'); }catch(e){} render(); toast(on?'플레이 모드를 켰어요. 만들기·편집 메뉴가 숨겨져요':'플레이 모드를 껐어요'); break; }
case 'sttab': settingsNavigate(t.dataset.k||''); break;
case 'setsec': p.sec=id; mark('prog'); closeModal(); tab='lobby'; render(); break;
case 'apnew': APD={id:'',type:'vertex',pub:'google',name:'',region:'global'}; openAp(); break;
case 'apedit': { const p=AIP().list.find(x=>x.id===id); if(!p) break; APD=JSON.parse(JSON.stringify(p)); openAp(); break; }
case 'apsave': { const d=readAp(); if(!apValid(d)){toast('키와 모델 정보를 확인해 주세요');break;} const A=AIP(); if(!d.id){d.id='p'+uid();A.list.push(d);if(!A.list.some(x=>x.id===A.active))A.active=d.id;} else {const i=A.list.findIndex(x=>x.id===d.id);A.list[i]=d;} saveAIP(A); closeModal(); render(); toast('저장했어요'); break; }
case 'apdel': { if(!(await appConfirm('이 AI를 삭제할까요?'))) break; const A=AIP(); A.list=A.list.filter(x=>x.id!==APD.id); if(A.active===APD.id) A.active=(A.list[0]||{}).id||''; saveAIP(A); closeModal(); render(); break; }
case 'apuse': { const A=AIP(); A.active=id; saveAIP(A); render(); toast('이 AI를 쓸게요'); break; }
case 'apfb': { const A=AIP(); A.fallback=!A.fallback; saveAIP(A); render(); break; }
case 'aptest': { const d=readAp(); if(!apValid(d)){toast('키와 모델 정보를 확인해 주세요');break;} const done=busy(t,'확인 중…');
      try{ const r=await aiOne(Object.assign({},d,{id:d.id||'tmp'}),'연결 테스트다. {"ok":true}를 그대로 출력하라.','quick'); toast(r&&r.ok?'연결 성공':'응답은 왔지만 형식이 달라요'); }
      catch(e){ toast(AIERR[e&&e.code]?AIERR[e.code]+(e.message?' '+e.message:''):('연결 실패. '+((e&&e.message)||''))); }
      finally{ done(); } break; }
case 'llmopen': openModal(llmHTML()); break;
case 'llmsave': { const L=llmSlots(); Object.assign(L,{top:$('#llm_top').value,mid:$('#llm_mid').value,bot:$('#llm_bot').value,tag:$('#llm_tag')?$('#llm_tag').value:(L.tag||'')}); saveLlm(L); toast('글 AI 지침을 저장했어요'); closeModal(); render(); break; }
case 'llmtog': { const L=llmSlots(), x=L.presets.find(q=>q.id===id); if(!x) break; x.on=!!t.checked; saveLlm(L); toast(`「${x.name}」 ${x.on?'켜짐':'꺼짐'}`); break; }
case 'llmpadd': { const L=llmSlots(), keep={top:$('#llm_top').value,mid:$('#llm_mid').value,bot:$('#llm_bot').value,tag:$('#llm_tag')?$('#llm_tag').value:''}, text=$('#llp_text').value.trim(); if(!text){ toast('지침 내용을 적어 주세요'); break; }
      const pid=$('#llp_id').value, nm=$('#llp_name').value.trim()||'지침 '+(L.presets.length+1), pos=$('#llp_pos').value; const x=pid&&L.presets.find(q=>q.id===pid);
      if(x) Object.assign(x,{name:nm,pos,text}); else L.presets.push({id:'lp'+uid(),name:nm,pos,text,on:true}); Object.assign(L,keep); saveLlm(L); openModal(llmHTML()); toast(x?'프리셋을 고쳤어요':'프리셋을 저장했어요(켜짐)'); break; }
case 'llmpedit': { const x=llmSlots().presets.find(q=>q.id===id); if(x) llmPresetFormFill(x); break; }
case 'llmpdel': { const L=llmSlots(), x=L.presets.find(q=>q.id===id); if(!x||!(await appConfirm(`「${x.name}」 프리셋을 지울까요?`))) break; L.presets=L.presets.filter(q=>q!==x); Object.assign(L,{top:$('#llm_top').value,mid:$('#llm_mid').value,bot:$('#llm_bot').value,tag:$('#llm_tag')?$('#llm_tag').value:''}); saveLlm(L); openModal(llmHTML()); break; }
case 'llmpcopy': { const x=llmSlots().presets.find(q=>q.id===id); if(!x) break; try{ await navigator.clipboard.writeText(llmCode(x)); toast('코드를 복사했어요. 붙여 넣으면 다른 사람이 가져갈 수 있어요'); }catch(e){ if(t.isConnected)openPresetCode('llm',llmCode(x)); } break; }
case 'llmpimport': openPresetCode('llm'); break;
case 'sndopen': openSound(); break;
case 'vclearall': { if(!(await appConfirm('저장된 음성을 모두 지울까요? 다시 들으면 새로 만들어져서 요금이 들어요.'))) break; let n=0; try{ for(const k of await idbKeys()) if(String(k).startsWith('v_')){ await idbDel(k); n++; } }catch(e){} toast(`음성 ${n}개를 지웠어요`); openSound(); break; }
case 'vprebuild': { if(!SND().fishKey){toast('Fish Audio 키를 먼저 넣어 주세요');break;}
      const jobs=[]; const add=(c,txt)=>{ if(c&&c.voiceId&&cleanTTS(sub(txt))) jobs.push([c,txt]); };
      const scan=sc=>parseScript(sc).forEach(L=>{ if(L.type==='say'&&!isMe(L.who)) add(findSpeaker(L.who),L.text); });
      scan(G.opening.prologue); G.chapters.forEach(ch=>ch.stages.forEach(st=>{scan(st.pre);scan(st.post);}));
      G.chars.forEach(c=>{ if(!c.voiceId) return; c.episodes.forEach(e=>scan(e.script)); [...c.lines,...c.touch.head,...c.touch.body,c.intro].forEach(x=>add(c,x)); });
      const uniq=[...new Map(jobs.map(j=>[j[0].voiceId+'|'+cleanTTS(sub(j[1])),j])).values()];
      let need=[]; for(const [c,txt] of uniq){ const key='v_'+hash(c.voiceId+'|'+SND().fishModel+'|'+cleanTTS(sub(txt))).toString(36)+'_'+cleanTTS(sub(txt)).length; let has=null; try{has=await idbGet(key);}catch(e){} if(!has) need.push([c,txt]); }
      if(!need.length){toast('모든 대사 음성이 이미 저장돼 있어요');break;}
      const chars=need.reduce((a,[c,x])=>a+cleanTTS(sub(x)).length,0);
      if(!(await appConfirm(`목소리가 정해진 대원의 대사 중 아직 없는 ${need.length}개(약 ${nf(chars)}자)를 만들어요. 이 만큼 Fish Audio 요금이 들어요. 진행할까요?`))) break;
      busy(t); let done=0;
      for(const [c,txt] of need){ try{ await ttsBlob(c,txt); done++; say(t,`만드는 중 ${done}/${need.length}`); }catch(e){ toast('중단: '+(AIERR[e&&e.code]||'')+' '+((e&&e.message)||'')); break; } }
      toast(`음성 ${done}개를 저장했어요`); if($('#vstat')) openSound(); break; }
case 'sndsave': { const o=SND(); Object.assign(o,{sfxVol:+$('#sd_xv').value/100,bgmVol:+$('#sd_bv').value/100,voiceVol:+$('#sd_vv').value/100,bgmOn:$('#sd_bon').value==='1',voiceStory:$('#sd_vs').value==='1',voiceLobby:$('#sd_vl').value==='1',voiceLang:$('#sd_lang')?$('#sd_lang').value:'ko',
      fishKey:$('#sd_fk').value.trim(),fishModel:$('#sd_fm').value,elKey:$('#sd_ek').value.trim(),elBase:$('#sd_eb')?$('#sd_eb').value.trim():(o.elBase||''),elModel:$('#sd_em').value,elLen:num($('#sd_el').value,10,300,90),
      scene:{title:$('#sd_title').value,lobby:$('#sd_lobby').value,battle:$('#sd_battle').value,boss:$('#sd_boss').value,gacha:$('#sd_gacha').value}});
      appStorage.setItem(SKEY,JSON.stringify(o)); P().scene=clone(o.scene); mark('prog'); closeModal(); render(); BGM.name=null; sceneBgm(); toast('소리 설정을 저장했어요'); break; }
case 'fishtest': { const k=$('#sd_fk').value.trim(); if(!k){toast('Fish Audio 키를 넣어 주세요');break;} const o=SND(); o.fishKey=k; appStorage.setItem(SKEY,JSON.stringify(o));
      try{ await fishSearch('','',1); toast('Fish Audio 연결 성공'); }catch(e){ toast('연결 실패. '+(AIERR[e&&e.code]||'')+' '+((e&&e.message)||'')); } break; }
case 'voice': if($('#modal .sheet.cs-sheet')||$('#modal .sk-card')) MBACK=()=>openChar(id); VS={cid:id,sid:t.dataset.s||'',results:[],picks:{},lang:VS.lang||'ko',q:''}; if(!SND().fishKey) toast('설정의 소리에서 Fish Audio 키를 먼저 넣어 주세요'); renderVoice(); break;
case 'vclear': { const c=charById(id); c.voiceId='';c.voiceName=''; mark('c:'+id); openChar(id); break; }
case 'vsearch': { VS.q=$('#vs_q').value.trim(); VS.lang=$('#vs_lang').value; const done=busy(t);
      try{ VS.results=await fishSearch(VS.q,VS.lang,30); VS.picks={}; renderVoice(VS.results.length?'':'검색 결과가 없어요. 다른 단어나 언어 전체로 다시 찾아보세요.'); }catch(e){ toast(AIERR[e&&e.code]||('검색 실패. '+((e&&e.message)||''))); done(); } break; }
case 'vsai': { const c=charById(VS.cid); VS.lang=$('#vs_lang').value;
      if(!SND().fishKey){toast('설정의 소리에서 Fish Audio 키를 먼저 넣어 주세요');break;}
      const q=await aiJSON(vsaiPrompt({c}),uiProg(t),'quick');
      if(!q) break; renderVoice('목소리를 찾는 중이에요…');
      const seen=new Map();
      try{ for(const w of strs(q.queries).slice(0,6)){ for(const m of await fishSearch(w,VS.lang,10)) if(!seen.has(m._id)) seen.set(m._id,m); } }catch(e){ toast(AIERR[e&&e.code]||('검색 실패. '+((e&&e.message)||''))); }
      const list=[...seen.values()];
      if(!list.length){ VS.results=[]; renderVoice('검색 결과가 없어요. 언어를 전체로 바꾸거나 직접 검색해 보세요.'); break; }
      const cands=list.slice(0,30).map(m=>({id:m._id,title:m.title,desc:String(m.description||'').slice(0,100),tags:(m.tags||[]).slice(0,6),lang:m.languages}));
      const rk=await aiJSON(vsaiPrompt2({c,cands}),null,'quick');
      VS.picks={}; const order=[]; if(rk) for(const p of (rk.picks||[])){ const m=seen.get(p.id); if(m&&VS.picks[p.id]===undefined){VS.picks[p.id]=String(p.reason||'');order.push(m);} }
      VS.results=[...order,...list.filter(m=>VS.picks[m._id]===undefined)];
      renderVoice(order.length?'AI가 고른 후보가 위에 있어요. ▶로 샘플을, 대사로 이 캐릭터 대사를 들어 보세요.':''); break; }
case 'vsplay': stopVoice(); VOICE.src=t.dataset.u; VOICE.volume=SND().voiceVol; VOICE.play().catch(()=>toast('샘플을 재생하지 못했어요')); break;
case 'vstry': { const c=charById(VS.cid), done=busy(t); await speak(Object.assign({},c,{voiceId:id}),c.intro||c.lines[0]||c.name); done(); break; }
case 'vspick': { const c=charById(VS.cid), m=VS.results.find(x=>x._id===id), tg=(VS.sid&&(c.skins||[]).find(x=>x.id===VS.sid))||c; tg.voiceId=id; tg.voiceName=m?m.title:id; mark('c:'+c.id); toast(tg===c?`${c.name}의 목소리를 정했어요`:`${T('skin')} 「${tg.name}」의 목소리를 정했어요`); openChar(c.id); break; }
case 'vsetid': { const v=$('#vs_id').value.trim(), m=v.match(/[0-9a-f]{32}/i); if(!m){toast('보이스 ID를 찾지 못했어요');break;} const c0=charById(VS.cid), c=(VS.sid&&(c0.skins||[]).find(x=>x.id===VS.sid))||c0; c.voiceId=m[0].toLowerCase(); c.voiceName='';
      try{ const j=okJSON(await http('https://api.fish.audio/model/'+c.voiceId,{headers:{Authorization:'Bearer '+SND().fishKey},timeout:20000})); c.voiceName=j.title||''; }catch(e){ quietErr(e,'0510-actions/050-settings-and-audio.js:74'); }
      mark('c:'+c.id); toast('목소리를 연결했어요'); openChar(c.id); break; }
case 'elcompose': { const l=libById(id), s=SND(); if(!s.elKey){toast('설정의 소리에서 ElevenLabs 키를 넣어 주세요');break;}
      const pr=(($('#li_prompt')&&$('#li_prompt').value.trim())||l.prompt||'').trim(); if(!pr){toast('음악 프롬프트를 먼저 채워 주세요');break;}
      l.prompt=pr; mark('l:'+l.id); const done=busy(t,'작곡 중… 1~3분');
      try{ await elCompose(l); toast(`「${l.name}」 작곡 완료`); bgm(l.name,true); if($('#li_name')) openLibItem(l.id); }
      catch(e){ toast('작곡 실패. '+(AIERR[e&&e.code]||'')+' '+((e&&e.message)||'')); done(); } break; }
  }
}
/* src/main/0170-shell/0550-standalone-app.js에서 옮김 */
// 그림 한 장을 기기에 저장해요. 앱: Documents/가챠게임메이커/그림 (안 되면 공유하기), 웹: 다운로드(휴대폰은 공유하기로 사진 앱에 저장).
async function saveImgBlob(b,base){
  const ext=/png/.test(b.type)?'png':/jpe?g/.test(b.type)?'jpg':'webp', name=String(base||'image').replace(/[^\w가-힣-]+/g,'_').slice(0,40)+'_'+Date.now().toString(36)+'.'+ext;
  if(IS_NATIVE&&CAP&&CAP.Filesystem){ const FS=CAP.Filesystem, data=String(await blobToData(b)).split(',')[1], path='가챠게임메이커/그림/'+name;
    try{ try{ if(FS.requestPermissions) await FS.requestPermissions(); }catch(e){ quietErr(e,'0550-standalone-app.js:38'); } await FS.writeFile({path,data,directory:'DOCUMENTS',recursive:true}); toast('Documents/'+path+' 에 저장했어요'); return; }
    catch(e){ try{ await FS.writeFile({path:name,data,directory:'CACHE'}); const u=await FS.getUri({path:name,directory:'CACHE'}); if(CAP.Share){ await CAP.Share.share({title:name,files:[u.uri]}); return; } }catch(e2){ quietErr(e2,'0550-standalone-app.js:39'); } toast('그림을 저장하지 못했어요'); return; } }
  const file=new File([b],name,{type:b.type||'image/webp'});
  if(/iPhone|iPad|Android/i.test(navigator.userAgent)&&navigator.canShare&&navigator.canShare({files:[file]})){ try{ await navigator.share({files:[file],title:name}); return; }catch(e){ if(e&&e.name==='AbortError') return; } }
  downloadBlob(file,name); toast('다운로드 폴더에 저장했어요 · '+name);
}
async function saveImgUrl(u,base){ try{ const b=await (await fetch(u)).blob(); await saveImgBlob(b,base); }catch(e){ toast('그림을 저장하지 못했어요'); } }
