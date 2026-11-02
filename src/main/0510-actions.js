/* =========================================================
   이벤트
   ========================================================= */
async function handleSetupAction(a,t,id,p,e){
  switch(a){
case 'gateyes': $('.gate')?.remove(); showTitle(); break;
case 'gateno': $('.gate').innerHTML='<div class="mark">19</div><p>만 19세 이상만 이용할 수 있어요.</p>'; break;
case 'titletap': if(!p.seenOpening&&!p.nameAsked){ p.nameAsked=true; mark('prog'); }
    if(!p.seenOpening) playOpening(); else {closeOv(); render(); checkTriggers(); setTimeout(()=>liveTick(false),1200); setTimeout(prepAsk,2600);} break;
case 'swnext': swRead(); if(SW.step===1) swAddAI(); SW.step=Math.min(5,SW.step+1); renderSetup(); break;
case 'swaddai': swRead(); if(!swAddAI()){toast('키와 모델 정보를 확인해 주세요');break;} APD={id:'',type:APD.type,pub:APD.pub||'google',name:'',region:'global',base:APD.base||'https://openrouter.ai/api/v1'}; SW.ok.ai=false; renderSetup(); toast('추가했어요. 하나 더 넣거나 다음으로 가세요'); break;
case 'swprev': swRead(); SW.step=Math.max(0,SW.step-1); renderSetup(); break;
case 'swlink': openUrl(t.dataset.url); break;
case 'swskipall': appStorage.setItem(SETUP_KEY,'1'); if(PJ().active!=='main'){ await flush(); const pj=PJ(); if(!pj.list.some(x=>x.id==='main')) pj.list.unshift({id:'main',title:DEFAULT_META.title}); pj.active='main'; appStorage.setItem(PJKEY,JSON.stringify(pj)); reloadGame(); break; } SW=null; showStart(); break;
case 'swgenre': { const k=$('#ng_kw'); if(k){ k.value=t.dataset.v+(k.value.trim()?'. '+k.value.trim():'. '); k.focus({preventScroll:true}); } break; }
case 'swgo1': swRead(); SW.step=1; renderSetup(); break;
case 'swpjgo': case 'swpjnew': { swRead(); swSave(); appStorage.setItem(SETUP_KEY,'1'); const pj=PJ(), pid=id;
      if(a==='swpjnew'){ if(!(await appConfirm('이 게임의 진행(보유 '+T('crew')+'·재화·클리어 기록)을 지우고 처음부터 시작할까요? 만들어 둔 세계관·'+T('crew')+'·스토리·그림은 그대로예요.'))) break;
        await flush(); window.__NOFLUSH=1; let g=null; try{ g=JSON.parse(appStorage.getItem(pjKey(pid))||'null'); }catch(e){} if(!g){ window.__NOFLUSH=0; toast('게임을 읽지 못했어요'); break; }
        const o=g.prog||{}, keep={}; ['player','genderTxt','gender','look','bio','hideEyes','avatar','nameAsked','settings','scene','lobbyMode','csFull'].forEach(k=>{ if(o[k]!==undefined) keep[k]=o[k]; });
        g.prog=Object.assign(clone(DEFAULT_PROG),keep,{seenOpening:false,castDone:0,bootPrep:0}); appStorage.setItem(pjKey(pid),JSON.stringify(g)); }
      else await flush();
      try{ sessionStorage.setItem('ggm-picked','1'); }catch(e){} pj.active=pid; appStorage.setItem(PJKEY,JSON.stringify(pj)); reloadGame(); break; }
case 'swsub': { const a=($('#sw_sub')||{}).value; if(!String(a||'').trim()){ toast('구독 주소를 붙여 넣어 주세요'); break; } swRead(); swSave(); appStorage.setItem(SETUP_KEY,'1'); try{ sessionStorage.setItem('ggm-picked','1'); }catch(e){} await subscribe(String(a).trim(),t); break; }
case 'swdone': swRead(); swSave(); if(PJ().active!=='main'){ appStorage.setItem(SETUP_KEY,'1'); await flush(); try{ sessionStorage.setItem('ggm-picked','1'); }catch(e){} const pj=PJ(); if(!pj.list.some(x=>x.id==='main')) pj.list.unshift({id:'main',title:DEFAULT_META.title}); pj.active='main'; appStorage.setItem(PJKEY,JSON.stringify(pj)); reloadGame(); break; } { const hr=readHero(); if(hr){ const pp=P(); pp.player=hr.name; if(hr.call&&hr.call!==T('player')){ G.meta.terms.player=hr.call; mark('meta'); } pp.genderTxt=hr.gender; pp.gender=genderCode(hr.gender); pp.look=hr.look; pp.hideEyes=hr.hide; pp.nameAsked=true; mark('prog'); } } { const v=$('#ng_style')?$('#ng_style').value.trim():''; if(v){ G.meta.artTags=v; mark('meta'); } } appStorage.setItem(SETUP_KEY,'1'); SW=null; render(); showStart(); toast('설정을 저장했어요'); break;
case 'swstytest': { swRead(); swSave(); if(!imgReady()){ toast(imgNeed()); break; } const r0=$('#sw_sres'); t.disabled=true; if(r0) r0.textContent='그리는 중… 20초쯤 걸려요';
      try{ const b=await naiDraw('char','1girl, solo, long hair, smile, jacket, hand on hip',{styleId:swStyleId()}); if(SW.stPrev) URL.revokeObjectURL(SW.stPrev); SW.stPrev=URL.createObjectURL(b); renderSetup(); }
      catch(err){ toast(naiErr(err,'시험 그리기 실패')); if(r0) r0.textContent=''; t.disabled=false; } break; }
case 'swtestai': { swRead(); const pr=swProfile(), r0=$('#sw_res'); if(!apValid(pr)){toast('키를 넣어 주세요');break;} t.disabled=true; if(r0) r0.textContent='확인 중…';
      try{ const r=await aiOne(Object.assign(pr,{id:'tmp'}),'연결 테스트다. {"ok":true}를 그대로 출력하라.','quick'); SW.ok.ai=!!(r&&r.ok); if(r0) r0.textContent=SW.ok.ai?'✓ 연결됨':'응답은 왔지만 형식이 달라요'; }
      catch(err){ if(r0) r0.textContent='✗ '+aiErrText(err); } finally{ t.disabled=false; } break; }
case 'swtestnai': { swRead(); const r0=$('#sw_res'); if(!SW.nai){toast('토큰을 넣어 주세요');break;} t.disabled=true; if(r0) r0.textContent='확인 중…';
      try{ const r=await http(naiBase(naiCfg())+'/user/subscription',{headers:NAI_HDR(SW.nai),timeout:20000}); const j=okJSON(r); SW.ok.nai=true; if(r0) r0.textContent=`✓ 연결됨 · ${['Paper','Tablet','Scroll','Opus'][j.tier]||'구독'}`; }
      catch(err){ if(r0) r0.textContent='✗ '+naiErr(err,'연결 실패'); } finally{ t.disabled=false; } break; }
case 'title': showTitle(); break;
case 'swpreset': { swRead(); const p=allPresets().find(x=>x.id===t.dataset.v); if(!p) break; SW.preset=p.id; presetToCfg(p.id); SW.cst=Object.assign(SW.cst||{},{tags:presetQualityParts(p).tags,neg:p.neg||''}); renderSetup(); toast(`「${p.name}」 그림체를 골랐어요`); break; }
case 'sweep': { if(!stamUse(stamCost('farm')*(+t.dataset.n||1))) break; const n=+t.dataset.n||1, r0=rateR(farmReward(t.dataset.k,+t.dataset.lv)), r={}; for(let i=0;i<n;i++){ giveReward(r0); bump('battle'); } Object.entries(r0).forEach(([k,v])=>r[k]=v*n); sfx('확인'); toast(`소탕 ${n>1?n+'회 ':''}완료: `+rewardText(r)); render(); break; }
case 'swdraft': swRead(); swSave(); appStorage.setItem(SETUP_KEY,'1'); openDraft(); break;
case 'swpjdraft': { let g=null; try{ g=JSON.parse(appStorage.getItem(pjKey(id))||'null'); }catch(e){} const d=g&&g.meta&&g.meta.draft; if(!d){ toast('이 게임에는 저장된 초안이 없어요'); break; } swRead(); swSave(); appStorage.setItem(SETUP_KEY,'1'); drLoadFrom(d,(g.meta.title||'')+' 초안'); break; }
case 'titlesnd': { const s=SND(); s.bgmOn=!s.bgmOn; try{ appStorage.setItem(SKEY,JSON.stringify(s)); }catch(err){} if(s.bgmOn){ BGM.name=null; bgm(sceneOf().title); } else bgm(null); const b=$('#tsnd'); if(b){ b.textContent=s.bgmOn?'🔊':'🔇'; b.setAttribute('aria-label',s.bgmOn?'배경음 끄기':'배경음 켜기'); } toast(s.bgmOn?'배경음을 켰어요':'배경음을 껐어요'); break; }
  }
}

async function handleNavigationAndToolsAction(a,t,id,p,e){
  switch(a){
case 'prepopen': openPrep(false); break;
case 'rebal': await v2RebalanceAll(t); break;
case 'a2hs': openA2HS(); break;
case 'cdart': { const run=RG().run; if(run) drawCardArts(run.deck,t); else if(RF&&rfIds().length) drawCardArts(rgDeck(rfIds()),t).then(()=>{ if(RF&&document.querySelector('.rf-tee')) openRgForm(); }); break; }
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
case 'pfdraw': playerDraw(t); break;
case 'pfsave': readPlayerForm(); refreshPlayerForm(); toast('저장했어요'); break;
case 'go': tab=t.dataset.to; closeModal(); if(!$('#phone').hidden) closePhone(); render(); $('#view').scrollTop=0; break;
case 'close': window.navBack(); break;
case 'goback': window.navBack(); break;
case 'lbhide': document.body.classList.add('lb-hidden'); toast('화면을 누르면 메뉴가 돌아와요'); break;
case 'lbshow': document.body.classList.remove('lb-hidden'); break;
case 'poke': { if(document.body.classList.contains('lb-hidden')){ document.body.classList.remove('lb-hidden'); break; } const c=charById(p.sec); if(!c||!own(c.id)) break;
      const r=t.getBoundingClientRect(), fy=e.clientY?(e.clientY-r.top)/r.height:0.2, zone=fy<0.3?'head':fy<0.72?'body':'base';
      let pool=spoilFree(c,zone==='head'?c.touch?.head:zone==='body'?c.touch?.body:affLinePool(c)); if(!pool.length) pool=affLinePool(c);
      const face=touchFace(c,zone,affLv(own(c.id)));
      addAff(c,zone==='body'?1:2); bump('touch'); mark('prog');
      const b=$('#bubble'), l=pickTouchLine(pool,b?.textContent);
      if(b){ b.textContent=sub(l); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); } if(c.voiceId&&SND().voiceLobby) speak(c,l);
      const st=t.querySelector('.lb-stage')||t; const old=st.querySelector('.lobby-art:not(.lobby-pose)'); if(old){ /* 레이어 그림(포즈)은 표정 그림이 없어서 그대로 둬요. 바꾸면 스탠딩으로 고정돼 버렸어요 */ const tmp=document.createElement('div'); tmp.innerHTML=P().lobbyMode==='stand'?art(c,'lobby-art react',{face}):lobbyCharacterArt(c,'lobby-art react',face); old.replaceWith(tmp.firstElementChild); clearTimeout(window._faceT); window._faceT=setTimeout(()=>{const cur=document.querySelector('.lobby-art'); if(cur&&tab==='lobby'){const t2=document.createElement('div');t2.innerHTML=P().lobbyMode==='stand'?art(c,'lobby-art'):lobbyCharacterArt(c);cur.replaceWith(t2.firstElementChild);}},3500); }
      { const x=e.clientX||innerWidth/2, y=e.clientY||innerHeight/2, lv=affLv(own(c.id)); ripple(x,y,lv>=7); if(lv>=5&&zone!=='body') hearts(x,y,Math.min(5,lv-3)); setTimeout(()=>charReact(document.querySelector('.lobby .lobby-art,.lobby .lobby-ill'),lv,zone),10); } break; }
case 'lbbgdel': { if(playMode())break;const c=charById(id); if(!c?.lbbg||!(await appConfirm('로비 레이어의 배경만 지울까요?'))) break; await imgClear(c.lbbg); mark('c:'+c.id); openChar(c.id); render(); break; }
case 'altnew': { if(!SAMPLE){ toast('이격을 만들려면 설정 → 글 AI를 먼저 등록해 주세요'); break; } closeModal(); openNewPickup({kind:'alt',base:id}); break; }
case 'scggen': { const c=charById(id); if(!c) break; if(!String(c.naiPrompt||'').trim()){toast('먼저 설정 편집에서 NAI 스탠딩 프롬프트를 채워 주세요');break;} if(!imgReady()){toast(imgNeed());break;} if(!SAMPLE){toast('기술 컷인 장면을 구성하려면 설정 → 글 AI를 먼저 등록해 주세요.');break;} const o=scgOf(c); t.disabled=true; t.textContent='그리는 중…';
      try{ const b=await generateUltimateCutin(c); await storeImage(o,b,''); o.prompt=b.__candidateConfig?.prompt||o.prompt; mark('c:'+c.id); toast('기술 컷인을 그렸어요'); openChar(c.id); }catch(err){ toast(naiErr(err,'기술 컷인 실패')); t.disabled=false; t.textContent='NAI로 기술 컷인'; } break; }
case 'scgdel': { const c=charById(id); if(!c||!c.scg) break; if(!(await appConfirm('기술 컷인을 지울까요?'))) break; const o=c.scg;await imgClear(o); mark('c:'+c.id); openChar(id); break; }
case 'scgtest': { const c=charById(id); if(c) skillCut(c,c.skill.name,true,document.body); break; }
case 'ilgen': { const c=charById(id); if(!c) break; const k=t.dataset.k==='lbcg'?'lbcg':'illust'; if(!SAMPLE){toast('설정 → 글 AI를 먼저 등록해 주세요.');break;} const sc=$(k==='lbcg'?'#lb_scene':'#il_scene'); if(sc){ c[k].prompt=sc.value.trim();naiBlocksSave(c[k],'prompt',sc); mark('c:'+c.id); } if(!String(c.naiPrompt||'').trim()){toast('먼저 설정 편집에서 NAI 스탠딩 프롬프트를 채워 주세요');break;} openNaiPrep(k,c.id); break; }
case 'vncgview': { const im=$('#vnCG img'); if(im) imgViewer(im.src); break; }
case 'cgview': { const c=charById(id); if(c) lbReveal(c,t.dataset.k==='lbcg'?'lbcg':'illust'); break; }
case 'cguse': { const o=own(id); if(!o) break; o.useCg=t.checked; mark('prog'); toast(o.useCg?'로비에 '+T('limit')+' CG를 써요':'로비에 기본 일러스트를 써요'); break; }
case 'ildel': { const c=charById(id), k=t.dataset.k==='lbcg'?'lbcg':'illust'; if(!c||!(await appConfirm(k==='lbcg'?T('limit')+' CG를 지울까요?':'일러스트를 지울까요?'))) break; const o=c[k];await imgClear(o); mark('c:'+c.id); render(); openChar(id); break; }
case 'ailog': openModal(aiLogHTML(!!(t.closest('#drPage')||t.dataset.v))); break;
case 'ailogcopy': { const tx=aiLogText()||'기록 없음'; try{ await navigator.clipboard.writeText(tx); toast('AI 기록을 복사했어요'); }catch(e){ prompt('복사해 주세요',tx); } break; }
case 'ailogclear': AILOG.length=0; try{ appStorage.removeItem('ggm-ailog'); }catch(e){} openModal(aiLogHTML(!!$('#modal [data-act="draft-open"]'))); break;
case 'artcopy': { const c=naiCfg(), b=c.styles.find(x=>x.id===c.styleId)||c.styles[0]||{tags:'',neg:''}; if(!String(b.tags||'').trim()&&!String(b.neg||'').trim()){ toast('설정의 그림 AI에 그림체가 비어 있어요'); break; } $('#mt_art').value=b.tags||''; $('#mt_artn').value=b.neg||''; toast(`「${b.name||'기본 그림체'}」 태그·네거티브를 넣었어요. 저장하면 이 게임에 고정돼요`); break; }
case 'artclear': $('#mt_art').value=''; $('#mt_artn').value=''; toast('비웠어요. 저장하면 설정의 기본 그림체를 따라가요'); break;
case 'pthumbset': uploadFor={kind:'pthumb',id:t.dataset.v}; $('#file').click(); break;
case 'avdel': { const av=avatarObj(); if(!av||!av.img||!(await appConfirm('프로필 그림을 지울까요?'))) break; await imgClear(av); mark('prog'); refreshPlayerForm(); toast('프로필 그림을 지웠어요'); break; }
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
case 'sq': refreshForm(); break;
case 'discover': discover(t); break;
case 'ghist': openHistory(); break;
case 'vnnext': vnStep(); break;
case 'vnpick': { e.stopPropagation(); if(!S||!S.choice) break; const n=+t.dataset.n,o=S.choice.opts[n-1]; S.pick=n; S.lastPick=o; S.choice=null; $('#vnCh').innerHTML=''; vnShow({type:'say',who:T('player'),text:o}); break; }
case 'vnauto': e.stopPropagation(); S.auto=!S.auto; t.classList.toggle('on',S.auto); if(S.auto&&!S.typing&&!S.choice) S.autoT=setTimeout(vnStep,700); else clearTimeout(S.autoT); break;
case 'vnskip': e.stopPropagation(); vnEnd(); break;
case 'vnlog': e.stopPropagation(); openModal(`${head('대화 기록')}${S.log.map(L=>`<p style="margin:6px 0">${L.type==='say'?`<b>${esc(isMe(L.who)?playerName():L.who)}</b> ${esc(sub(L.text))}`:L.type==='place'?`<span class="muted">[${esc(L.text)}]</span>`:`<i class="muted">${esc(sub(L.text))}</i>`}</p>`).join('')}`); break;
case 'bquit': if(B?.ctx.kind==='practice'){v2StopPractice();break;}if(B&&(B.ctx.kind==='raid'||B.ctx.kind==='rogue')){ if((await appConfirm(B.ctx.kind==='raid'?'여기서 끝낼까요? 지금까지 준 피해는 기록돼요.':'후퇴하면 이번 탐사가 끝나요. 지금까지의 보상은 받아요.'))){ if(!B.over) bEnd(false); } break; }
      if((await appConfirm('후퇴할까요? 보상은 받을 수 없어요.'))){clearInterval(B.timer);B=null;closeOv();render();} break;
case 'skill': { const u=B&&B.allies[+t.dataset.i]; if(u&&u.hp>0&&!B.over){ SCUT_MAN=true; useSkill(u); SCUT_MAN=false; } bUpdate(); break; }
case 'bretry': { const st=B.s,cx=B.ctx; B=null; startStage(st,cx); break; }
case 'flip': revealCard(+t.dataset.i); break;
case 'flipall': flipAll(); break;
case 'gcskip': { GC.timers.forEach(clearTimeout); GC.skip=true; $('#gcSeal').classList.add('go'); $('#gcStreak').style.opacity=0; $('#gcStage').hidden=false; t.hidden=true; document.querySelectorAll('.pc').forEach((c,i)=>{c.classList.add('open');GC.open.add(i);}); break; }
case 'closepull': { if(GC.open.size<GC.res.length){flipAll();break;}
      const best=GC.res.filter(x=>x.isNew).sort((a,b)=>b.c.rarity-a.c.rarity)[0]; GC.timers.forEach(clearTimeout); GC=null; closeOv(); render();
      if(best) toast(`${best.c.name}와(과) 계약했어요`); setTimeout(()=>checkTriggers(),800); break; }
case 'sdelno': { const o=SDEL&&SDEL.o; SDEL=null; if(o&&o.back) o.back(); else closeModal(); break; }
case 'sdelgo': { if(!SDEL) break; const {o,L}=SDEL, pick={}; document.querySelectorAll('[data-sd]').forEach(i=>{ pick[i.dataset.sd]=i.checked; }); SDEL=null;
      storyPurge(L,pick); o.run(); o.ids.forEach(id=>{ delete P().cleared[id]; if(P().stars) delete P().stars[id]; }); mark('prog'); closeModal(); if(o.after) o.after(); render();
      const n=['threads','codex','libs','rels','chars'].filter(k=>pick[k]).reduce((a,k)=>a+L[k].length,0); toast(`「${o.title}」을(를) 지웠어요${n?` · 연결된 것 ${n}개도 함께`:''}`); break; }
case 'saveopening': G.opening.lines=lines($('#op_lines').value); G.opening.prologue=$('#op_pro').value; mark('opening'); closeModal(); toast('오프닝을 저장했어요'); break;
case 'aiopening': { const hint=$('#op_hint').value.trim();
      const r=await aiJSON(`${RULES}\n${ctx()}\n${SCRIPT_FMT}\n\n이 게임의 오프닝을 써라. lines는 검은 화면에 한 줄씩 떠오르는 오프닝 영상 문구 5~7개로, 마지막 줄은 게임 제목. prologue는 플레이어가 처음 보는 프롤로그 대본 30~45줄로, 세계관을 소개하고 첫 대원들과의 강렬한 만남, 플레이어가 특별한 존재라는 복선, 선택지 1개를 넣는다. 배경 전환과 효과를 적극적으로 쓴다.\n${hint?'요청: '+hint:''}\nJSON만 출력: {"lines":[],"prologue":"대본"}`,t,'complex');
      if(r&&$('#op_lines')){ $('#op_lines').value=strs(r.lines).join('\n'); $('#op_pro').value=nl(r.prologue); toast('입력칸을 채웠어요. 확인 후 저장하세요.'); } break; }
case 'savelib': { const name=$('#li_name').value.trim(); if(!name){toast('이름을 입력해 주세요');break;}
      let l=id?libById(id):null; if(!l){l={id:'l'+uid(),kind:t.dataset.k,name,prompt:'',img:null};G.lib.push(l);}
      l.name=name; l.prompt=$('#li_prompt').value.trim(); if(l.kind!=='bgm')naiBlocksSave(l,'prompt','li_prompt'); if(l.kind==='cg') l.cast=[0,1,2,3].map(i=>({id:$('#cg_c'+i).value,pos:$('#cg_p'+i).value,act:$('#cg_a'+i).value.trim()})).filter(x=>x.id); mark('l:'+l.id); render(); openLibItem(l.id); toast('저장했어요'); break; }
case 'dellib': { const l=libById(id); if((await appConfirm('삭제할까요?'))){G.lib=G.lib.filter(x=>x.id!==id);mark('l:'+id);openLib(l.kind);render();} break; }
case 'ailib': { const k=t.dataset.k,nm=$('#li_name').value.trim(),ds=$('#li_desc').value.trim();
      if(k==='cg'){ const ids=[0,1,2,3].map(i=>$('#cg_c'+i).value).filter(Boolean).map(charById).filter(Boolean);
        const r=await aiJSON(`세계관: ${G.world.summary}\nCG "${nm}"${ds?' ('+ds+')':''}. 등장: ${ids.map(c=>c.name).join(', ')||'없음'}.\n이 장면의 NovelAI 영어 태그를 써라. 인물의 외모(머리, 눈, 옷)는 쓰지 말고 장소, 시간대, 구도(from side, from above 등), 인물들의 행동과 상호작용, 조명, 분위기만 쓴다. 인원수 태그(2girls 등)도 쓰지 않는다. 각 인물에게 어울리는 행동 태그도 따로 준다.\nJSON만 출력: {"prompt":"...","acts":["1번 인물 행동 태그","2번 ..."]}`,t,'quick');
        if(r&&$('#li_prompt')){ if(r.prompt)$('#li_prompt').value=String(r.prompt); strs(r.acts).forEach((a2,i)=>{const e2=$('#cg_a'+i); if(e2&&!e2.value.trim()) e2.value=a2;}); } break; }
      if(k==='bgm'){ const r=await aiJSON(`세계관: ${G.world.summary}\n게임 배경음 "${nm}"${ds?' ('+ds+')':''}를 만들 음악 생성 AI용 영어 프롬프트를 써라. 장르, 주요 악기, 템포(bpm), 분위기를 넣고, 보컬 없는 instrumental이며 자연스럽게 반복되는 seamless loop라고 명시한다. 2~3문장.\nJSON만 출력: {"prompt":"..."}`,t,'quick'); if(r&&r.prompt&&$('#li_prompt')) $('#li_prompt').value=String(r.prompt); break; }
      if(k==='enemy'){ const r=await aiJSON(`세계관: ${G.world.summary}\n${G.world.lore}\n적 "${nm}"${ds?' ('+ds+')':''}의 NovelAI 외형 프롬프트를 영어 태그로 써라. 괴물이나 기계면 "no humans"로, 사람형 적이면 "1other, faceless"나 성별 태그로 시작한다. 생김새, 재질, 색, 빛, 무기, 위압감을 넣고 자세·배경·화풍 태그는 쓰지 않는다.\nJSON만 출력: {"prompt":"..."}`,t,'quick'); if(r&&r.prompt&&$('#li_prompt')) $('#li_prompt').value=String(r.prompt); break; }
      const r=await aiJSON(`세계관: ${G.world.summary}\n${k==='bg'?'배경':'소품'} "${nm}"${ds?' ('+ds+')':''}의 NovelAI 이미지 프롬프트를 영어 태그로 써라. ${k==='bg'?'"no humans, scenery"로 시작하고 장소, 시간대, 날씨, 조명, 분위기 태그를 넣고 "anime background, highly detailed"로 끝낸다.':'"no humans, object focus"로 시작하고 물건의 모양, 재질, 디테일 태그를 넣고 "simple background, white background"로 끝낸다.'}\nJSON만 출력: {"prompt":"..."}`,t,'quick');
      if(r&&r.prompt&&$('#li_prompt')) $('#li_prompt').value=String(r.prompt); break; }
case 'aichar-open': openNewPickup(); break;
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
case 'aichar': { const con=$('#ai_c').value.trim(); if(!con){toast('어떤 '+T('crew')+'인지 적어 주세요');break;}
      const r=await aiJSON(`${RULES}\n${ctx()}\n\n새 ${T('crew')} 1명을 만들어라. 요청: "${con}"\n메인 플롯이나 세력과 연결되는 비밀을 ${T('files')}에 넣는다.\nJSON 객체만 출력: ${charSchema()}\n희귀도가 높을수록 능력치 합이 높다. 지원형은 heal/shield/buff, 방어형은 체력과 방어가 높다. ${NAI_CHAR}`,t);
      if(r){ const c=cleanChar(r); if(!c.name)c.name='이름 없음'; G.chars.push(c); mark('c:'+c.id); closeModal(); render(); openChar(c.id); artAfterAI(x=>x.o===c||x.c===c,'새 '+T('crew')+' '+c.name); toast(`${c.name}이(가) 추가됐어요`);} break; }
case 'nextneedai': toast('설정 → 글 AI에서 AI를 먼저 등록해 주세요'); break;
case 'testai': { const r=await aiJSON('연결 테스트다. {"ok":true}를 그대로 출력하라.',t,'quick'); if(r&&r.ok) toast('AI 연결 성공'); break; }
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
      const base=await naiSkinBase(c,t);
      const r=await aiJSON(`세계관: ${G.world.summary}\n캐릭터: ${c.name} / ${c.profile}\n고정 외형(재작성 금지): ${base.appearance}\n기본 의상(복사 금지): ${base.outfit}\n새 의상 요청: ${idea}\noutfit에는 의상·신발·착용 장식, other에는 표정·동작·소품만 NovelAI 영어 태그로 작성하세요. 머리·눈·체형은 넣지 마세요.\nJSON만 출력: {"outfit":"","other":""}`,t,'quick');
      if(r&&field.isConnected&&PJ().active===project&&charById(id)===c&&c.naiPrompt===original&&field.value===old){naiBlocksSeed(field,naiSkinParts(base,r));if(!$('#sk_name').value.trim())$('#sk_name').value=idea.slice(0,16);}break; }
case 'skpredo': skinPropRead(); skinPropDraw(t); break;
case 'skpcancel': if(SKPROP){ if(SKPROP.url) URL.revokeObjectURL(SKPROP.url); const cid=SKPROP.cid; SKPROP=null; openSkin(cid); } else closeModal(); break;
case 'skpok': { skinPropRead(); const P0=SKPROP, c=P0&&charById(P0.cid); if(!c||!P0.blob) break; t.disabled=true;
      const k={id:'k'+uid(),name:P0.name,prompt:P0.prompt,naiBlocks:clone(P0.naiBlocks||{}),idea:P0.idea,scene:P0.scene||'',img:null,faces:[]}; c.skins.push(k); await storeImage(k,P0.blob,''); mark('c:'+c.id);
      const sel=Object.assign({},P0.sel); URL.revokeObjectURL(P0.url); SKPROP=null; toast(`${T('skin')} 「${k.name}」을(를) 만들었어요 · ${T('crew')} 화면의 외형에서 입힐 수 있어요`); openChar(c.id);
      skinMakeRest(c,k,sel); break; }
case 'bnfac': { readBanner(); const v=t.dataset.v,a=BD.pool.factions; a.includes(v)?a.splice(a.indexOf(v),1):a.push(v); openBannerFrom(BD); break; }
case 'bnid': { readBanner(); const v=t.dataset.v,a=BD.pool.ids; a.includes(v)?a.splice(a.indexOf(v),1):a.push(v); openBannerFrom(BD); break; }
case 'bnup': { readBanner(); const v=t.dataset.v,a=BD.pickup; a.includes(v)?a.splice(a.indexOf(v),1):a.push(v); openBannerFrom(BD); break; }
case 'bnsave': { const b=readBanner(); if(!b.id){b.id='b'+uid();G.banners.push(b);} else {const i=G.banners.findIndex(x=>x.id===b.id);G.banners[i]=b;} P().curBanner=b.id; mark('prog'); closeModal(); render(); toast('배너를 저장했어요'); break; }
case 'bndel': if((await appConfirm('이 배너를 삭제할까요?'))){G.banners=G.banners.filter(x=>x.id!==BD.id);P().curBanner='';closeModal();render();} break;
case 'dsauto': { const d0=dispList().find(x=>x.id===DSEL.id), busy=busyIds(); if(!d0) break; DSEL.ids=G.chars.filter(c=>own(c.id)&&!busy.has(c.id)).sort((a,b)=>own(a.id).lv-own(b.id).lv||charPower(a)-charPower(b)).slice(0,d0.need).map(c=>c.id); openDispSel(DSEL.id); break; }
case 'dsclr': DSEL.ids=[]; openDispSel(DSEL.id); break;
case 'pgetall': { const lv=passLv(), tot={}; let n=0; for(let l=1;l<=lv;l++){ if(P().pass.got.includes(l)) continue; P().pass.got.push(l); const r=passReward(l); giveReward(r); Object.entries(r).forEach(([k,v])=>{ if(typeof v==='number') tot[k]=(tot[k]||0)+v; }); n++; } const d=dm(); MISSIONS.forEach(m=>{ if(!d.got[m.k]&&(d.cnt[m.k]||0)>=m.goal){ d.got[m.k]=true; P().pass.xp+=m.xp; giveReward({gems:50}); tot.gems=(tot.gems||0)+50; n++; } }); if(!n){ toast('받을 보상이 없어요'); break; } mark('prog'); sfx('확인'); toast('모두 받았어요: '+rewardText(tot)); render(); break; }
case 'dsel': { const a=DSEL.ids, d0=dispList().find(x=>x.id===DSEL.id); if(a.includes(id)) a.splice(a.indexOf(id),1); else { if(d0&&a.length>=d0.need){ toast(`${d0.need}명까지만 보낼 수 있어요`); break; } a.push(id); } openDispSel(DSEL.id); break; }
case 'mget': { const m=MISSIONS.find(x=>x.k===t.dataset.k), d=dm(); if(d.got[m.k]||(d.cnt[m.k]||0)<m.goal) break; d.got[m.k]=true; P().pass.xp+=m.xp; giveReward({gems:50}); sfx('확인'); render(); break; }
case 'pget': { const l=+t.dataset.lv; if(l>passLv()||P().pass.got.includes(l)) break; P().pass.got.push(l); const r=passReward(l); giveReward(r); sfx('확인'); toast(`패스 ${l}단계: ${rewardText(r)}`); render(); break; }
case 'logoprev': { const keep=G.meta.logoStyle; G.meta.logoStyle=$('#mt_logo').value; showTitle(); G.meta.logoStyle=keep; const t=$('.title'); if(t){ t.dataset.act='logoprevclose'; const tt=t.querySelector('.t-touch'); if(tt) tt.textContent='눌러서 설정으로 돌아가기'; }
      $('#modal').hidden=true; break; }
case 'logoprevclose': $('#ov').hidden=true; $('#ov').innerHTML=''; if($('#modal').innerHTML) $('#modal').hidden=false; sceneBgm(); break;
case 'newgame-open': openDraft(); break;
case 'aievent-open': openAiEvent(); break;
case 'aievent': await aiEvent(t); break;
case 'sfxplay': { const l=libById(id); if(l) sfx(l.name); break; }
case 'sfxgen': { const l=libById(id); t.disabled=true; try{ await elSfx(l); sfx(l.name); openLib('sfx'); }catch(err){ toast((AIERR[err&&err.code]||'효과음 생성 실패')+' '+((err&&err.message)||'')); if(t.isConnected) t.disabled=false; } break; }
case 'sfxall': { const items=G.lib.filter(l=>l.kind==='sfx'&&!l.audio); if(!items.length){toast('모두 등록돼 있어요');break;} t.disabled=true; let n=0;
      for(const l of items){ t.textContent=`만드는 중 ${n}/${items.length}`; try{ await elSfx(l); n++; }catch(err){ toast((AIERR[err&&err.code]||'중단')+' '+((err&&err.message)||'')); break; } }
      toast(`효과음 ${n}개를 만들었어요`); openLib('sfx'); break; }
case 'vtest': { const c=charById(id); await speak(c,c.intro||c.lines[0]||c.name); break; }
case 'dsopen': openDesign(); break;
case 'dssave': { G.meta.design=designRead(); mark('meta'); closeModal(); render(); toast('캐릭터 디자인 태그를 저장했어요. 새로 그리는 그림부터 적용돼요'); break; }
case 'dsai': designAI(t); break;
case 'shareopen': openShare(); break;
case 'sharego': { const img=$('#sh_img').checked, audio=$('#sh_aud').checked, gate=$('#sh_gate')?$('#sh_gate').checked:true; closeModal(); exportFile({share:true,img,audio,gate}); break; }
case 'fbopen': openFeedback(); break;
case 'fbissue': { const txt=feedbackText(); const url=`https://github.com/${updRepo(LV())}/issues/new?title=${encodeURIComponent('[피드백] '+(($('#fb_bad')&&$('#fb_bad').value.trim())||($('#fb_good')&&$('#fb_good').value.trim())||'의견').slice(0,40))}&body=${encodeURIComponent(txt)}`; openUrl(url); break; }
case 'fbpost': { try{ await navigator.clipboard.writeText(feedbackText()); toast('피드백을 복사했어요. 게시글 댓글에 붙여 넣어 주세요'); }catch(err){} openUrl(LV().feedback); break; }
case 'fbstar': FB_STAR=+t.dataset.n; document.querySelectorAll('#fbStars .chip').forEach(b=>b.classList.toggle('on',+b.dataset.n===FB_STAR)); break;
case 'fbsend': { const txt=feedbackText(); await shareText(G.meta.title+' 피드백',txt); break; }
case 'guidecopy': shareText(G.meta.title+' 테스트 안내',guideText()); break;
case 'skbdraw': { const f=skinShopList().find(x=>x.k.id===id); if(!f) break; if(!imgReady()){ toast(imgNeed()); break; } if(document.querySelector('[data-skp]')) SKBUYSEL=skinSelRead(); t.disabled=true; t.textContent='그리는 중…';
      try{ const target=skinPrimaryPart(f.c,f.k),b=await skinPartDraw(f.c,f.k,target===f.k?'stand':'upper','manual');await storeImage(target,b,''); mark('c:'+f.c.id); }catch(err){ toast(naiErr(err)); } openSkinBuy(id); break; }
case 'skbbuy': { const f=skinShopList().find(x=>x.k.id===id); if(!f) break; const p=P(), pr=f.k.price||SKIN_PRICE, sel=skinSelRead(); SKBUYSEL=sel; p.skinOwn=p.skinOwn||{}; if(p.skinOwn[id]) break;if(!skinDisplayReady(f.c,f.k)){toast('현재 표시 방식에 맞는 스킨 그림을 먼저 생성해 주세요');break;}if(p.gems<pr){ toast(`${T('currency')}이 모자라요`); break; }
      p.gems-=pr; p.skinOwn[id]=true; f.k.faces=f.k.faces||[]; mark('prog'); closeModal(); render(); buyFx(f.k.name,`${f.c.name}의 ${T('skin')}`+(own(f.c.id)?' · 외형에서 입힐 수 있어요':' · '+T('crew')+'를 얻으면 입힐 수 있어요')); skinMakeRest(f.c,f.k,Object.assign({},sel)); break; }
case 'reroll0': { if(!(await appConfirm(`리세마라: 보유 ${T('crew')}·재화·클리어 기록만 지우고 처음부터 다시 해요.\n세계관·${T('crew')}·스토리·그림·설정은 그대로예요. 진행할까요?`))) break;
      const o=P(), keep={}; ['player','genderTxt','gender','look','bio','hideEyes','avatar','nameAsked','settings','scene','lobbyMode','csFull','lobbyBg','titleBg','titleChar','gachaBg','skillCut','battleMotion'].forEach(k=>{ if(o[k]!==undefined) keep[k]=o[k]; });
      G.prog=Object.assign(clone(DEFAULT_PROG),keep,{seenOpening:false,castDone:1,bootPrep:1}); markAll(); await flush(); reloadGame(); break; }
case 'cachewipe': { if(!(await appConfirm('캐시 삭제: 이 기기의 모든 게임·그림·설정·API 키를 지우고 앱을 처음 받은 상태로 되돌려요. 되돌릴 수 없어요.'))) break; if(!(await appConfirm('정말 지울까요? 필요하면 먼저 전체 백업을 저장해 두세요.'))) break;
      const previous=window.__NOFLUSH;window.__NOFLUSH=1;try{await appStorage.clear();sessionStorage.clear();if(window.caches)for(const k of await caches.keys())await caches.delete(k);await reloadGame();}catch(e){window.__NOFLUSH=previous;storageWarning('초기화를 완료하지 못했습니다. '+(e.message||e));}break; }
  }
}

async function handleMailAction(a,t,id,p,e){
  switch(a){
case 'mailopen': openMail(); break;
case 'mailview': { if(e.target.closest('[data-act=mailget]')) break; const x=mailBox().find(q=>q.id===id); if(!x) break; x.read=true; mark('prog'); const has=Object.keys(x.reward||{}).length;
      openModal(`${head(esc(x.title),`<span class="muted">${esc(x.from)} · ${new Date(x.at).toLocaleDateString()}</span>`)}<div class="mbody">${esc(x.body).replace(/\n/g,'<br>')}</div>${has?`<div class="mreward">${rIcon(x.reward)}<b>${rewardText(x.reward)}</b></div>`:''}
        <div class="row" style="margin-top:12px">${has&&mailLive(x)?`<button class="btn" data-act="mailget" data-id="${x.id}" data-back="1">받기</button>`:`<button class="btn ghost" data-act="maildel" data-id="${x.id}">지우기</button>`}<button class="btn ghost" data-act="mailopen">목록</button></div>`); break; }
case 'mailget': { const x=mailBox().find(q=>q.id===id); const r=claimMail(x); if(!r){toast('받을 수 없는 우편이에요');break;} sfx('확인'); render(); openMail(); buyFx(rewardText(r)||'수령 완료',x.title); break; }
case 'mailall': { let tot={}; mailBox().forEach(x=>{ if(mailLive(x)&&Object.keys(x.reward||{}).length){ const r=claimMail(x); Object.entries(r).forEach(([k,v])=>tot[k]=(tot[k]||0)+v); } }); if(!Object.keys(tot).length){toast('받을 우편이 없어요');break;} render(); openMail(); buyFx('모두 받기',rewardText(tot)); break; }
case 'mailclean': { const p2=P(), n0=mailBox().length; p2.mail=mailBox().filter(x=>!mailDone(x)); mark('prog'); openMail(); render(); toast(`우편 ${n0-p2.mail.length}개를 지웠어요`); break; }
case 'maildel': { const x=mailBox().find(q=>q.id===id); if(!x) break; if(mailHas(x)&&mailLive(x)&&!(await appConfirm('아직 받지 않은 보상이 있어요. 그래도 지울까요?'))) break; P().mail=mailBox().filter(q=>q!==x); mark('prog'); openMail(); render(); break; }
  }
}

async function handleStoryAndAuthoringAction(a,t,id,p,e){
  switch(a){
case 'cxcat': CXCAT=t.dataset.v; render(); break;
case 'cxview': openCx(t.dataset.k); break;
case 'cxadd': openCxEdit(''); break;
case 'relopen': case 'relgo': openRel(t.dataset.r||REL_ME); break;
case 'relseed': { const n=await relSeedAI(t); if(n){ toast(`관계 ${n}개를 정리했어요`); openRel(); } break; }
case 'reladd': { const b=$('#rl_b').value, k=$('#rl_k').value.trim(), nt=$('#rl_n').value.trim(); if(!b||b===RELC) break; if(!k&&!nt){ toast('관계나 설명을 적어 주세요'); break; }
      let r=relPair(RELC,b); if(r){ if(k) r.kind=k; if(nt) r.note=nt; } else { r={id:'r'+uid(),a:RELC,b,kind:k||'아는 사이',note:nt,hist:[]}; RELS().push(r); } r.at=Date.now(); mark('meta'); openRel(); break; }
case 'reledit': openRelEdit(id); break;
case 'relsave': { const r=RELS().find(x=>x.id===id); if(!r) break; r.kind=$('#rle_k').value.trim().slice(0,16)||r.kind; r.note=$('#rle_n').value.trim().slice(0,240);
      r.hist=lines($('#rle_h').value).slice(-12).map(l=>{ const m=l.match(/^(.{1,12}?) · (.+)$/); return m?{src:m[1],text:m[2]}:{src:'',text:l}; }); mark('meta'); openRel(); break; }
case 'reldel': { const r=RELS().find(x=>x.id===id); if(!r||!(await appConfirm(`${relName(r.a,true)} ↔ ${relName(r.b,true)} 관계를 지울까요?`))) break; G.rels=RELS().filter(x=>x.id!==id); RELUNDO=r; mark('meta'); openRel(); toast('관계를 지웠어요 · 관계도 위쪽 「되돌리기」로 되살릴 수 있어요'); break; }
case 'relundo': { if(RELUNDO&&!RELS().some(x=>x.id===RELUNDO.id)){ RELS().push(RELUNDO); mark('meta'); toast('관계를 되살렸어요'); } RELUNDO=null; openRel(); break; }
case 'relrebuild': { const n0=RELS().length; G.chapters.forEach(ch=>{ delete ch.relScan; }); G.meta.relProf=0; memCatchUp(); const n=RELS().length-n0; mark('meta'); openRel(); toast(n>0?`빠진 관계 ${n}개를 다시 채웠어요`:'빠진 기본 관계가 없어요'+(SAMPLE?' · 자세한 관계는 「AI로 관계 넓히기」로 채울 수 있어요':'')); break; }
case 'cxedit': openCxEdit(t.dataset.id); break;
case 'cxsave': { const id2=t.dataset.id, title=$('#cx_t').value.trim(), body=$('#cx_b').value.trim(); if(!title||!body){toast('제목과 내용을 적어 주세요');break;}
      const un=$('#cx_un').value, u=un==='start'?{type:'start'}:{type:'clear',value:un}; let x=id2&&cxStore().find(q=>q.id===id2);
      if(x){ Object.assign(x,{cat:$('#cx_cat').value,title,body,unlock:u}); } else { x={id:'cx'+uid(),cat:$('#cx_cat').value,title,body,unlock:u,src:'user',at:Date.now()}; cxStore().push(x); }
      mark('world'); closeModal(); render(); toast('기록을 저장했어요'); pcSoon(); break; }
case 'cxdel': { if(!(await appConfirm('이 기록을 지울까요?'))) break; G.world.codex=cxStore().filter(q=>q.id!==t.dataset.id); mark('world'); closeModal(); render(); pcSoon(); break; }
case 'cxnote': { const k=t.dataset.k, v=prompt('메모로 덧붙일 내용'); if(!v||!v.trim()) break; const N=cxNotes(); (N[k]=N[k]||[]).push({text:v.trim(),at:'메모'}); mark('world'); openCx(k); pcSoon(); break; }
case 'cxdisc': { if(!SAMPLE){toast('설정의 글 AI에서 AI를 먼저 등록해 주세요');break;} t.disabled=true; const o0=t.textContent; t.textContent='쓰는 중… 1분쯤 걸려요'; const n=await cxDiscover(t); t.disabled=false; t.textContent=o0; if(n){ render(); toast(`새 기록 ${n}개를 실었어요`); } break; }
case 'cxdeep': { const k=t.dataset.k; t.disabled=true; t.textContent='기록을 찾는 중…'; const ok=await cxDeepen(k,t); if(ok){ openCx(k); toast('새 기록을 덧붙였어요'); } else { t.disabled=false; t.textContent='✦ 더 알아보기'; } break; }
case 'cxreadall': { const s=cxSeenSet(); cxEntries().forEach(e=>{ if(e.open) s[e.key]=1; }); CXMEMO=null; mark('prog'); render(); break; }
case 'opening-play': closeModal(); playOpening(); break;
case 'char': openChar(id); break;
case 'evspoke': { const c=charById(id); if(!c) break; const o=own(c.id), lv=o?affLv(o):1, r=t.getBoundingClientRect(), y=e.clientY||r.top+r.height/2, zone=(y-r.top)/r.height<0.3?'head':'body';
      ripple(e.clientX||r.left+r.width/2,y,lv>=7); charReact(t.querySelector('.art'),lv,zone); faceSwap(c,t.querySelector('.art'),touchFace(c,zone,lv));
      let pool=spoilFree(c,(zone==='head'?c.touch?.head:c.touch?.body)||[]); if(!pool.length) pool=affLinePool(c); const l=pickTouchLine(pool,sub(EVS_LINE)); EVS_LINE=l;
      const pe=$('#evsLine'); if(pe){ pe.textContent=sub(l); pe.classList.remove('pop'); void pe.offsetWidth; pe.classList.add('pop'); } if(voiceOf(c)&&SND().voiceLobby) speak(c,l); break; }
case 'evreroll': { const ev=G.events.find(x=>x.id===id); if(!ev) break; const oldCh=G.chapters.find(c=>c.id===ev.chapterId); if(!oldCh) break;
      const pu=ev.pickupFor&&charById(ev.pickupFor), base=(ev.gen&&ev.gen.dir)||(pu?`${T('crew')} 「${pu.name}」이(가) 주인공으로 나오는 픽업 기념 이벤트 스토리. ${String(pu.profile||'').slice(0,200)}`:`이벤트 「${ev.title}」. ${ev.desc||''}`);
      const want=prompt('스토리 전체를 새로 써요. 원하는 줄거리나 방향이 있으면 적어 주세요(비우면 같은 설정으로 새 이야기).\n지금까지 깬 이 이벤트 스테이지 기록은 초기화돼요.','');
      if(want===null) break; const dir=String(want||'').trim()?`${base}\n작가가 원하는 이번 줄거리(이 흐름을 그대로 따른다): ${String(want).trim()}`:`${base}\n지난 버전 「${ev.title}」과 다른 새 이야기로 쓴다.`;
      bgJob('evr-'+ev.id,'이벤트 스토리 다시 쓰는 중',async()=>{ const n=(ev.gen&&ev.gen.n)||oldCh.stages.length||4, len=(ev.gen&&ev.gen.len)||'';
        const res=await aiEventGen(dir,n,!!ev.gift,pu?[pu.name]:[],null,len,loreOf(ev)); if(!res) return null; const ne=res.ev, nch=G.chapters.find(c=>c.id===ne.chapterId); if(!nch) return null;
        // 예전 스토리에서 생긴 것(톡·도감·CG·관계·아직 보유하지 않은 인물·배포 캐릭터)은 정리해요. 새 스토리에도 나오는 CG는 남아요
        const oldGift=ev.gift; storyPurge(storyLinks(oldCh.stages.map(s0=>s0.id),oldCh,ev),{threads:1,codex:1,libs:1,rels:1,chars:1});
        const kb=G.banners.find(b=>b.id===ev.bannerId), nb=G.banners.find(b=>b.id===ne.bannerId), keepPU=ev.pickupFor&&charById(ev.pickupFor)?[ev.pickupFor]:[];
        if(kb&&nb) kb.pickup=[...new Set([...keepPU,...(nb.pickup||[])])].filter(x=>charById(x)).slice(0,3); else if(kb) kb.pickup=(kb.pickup||[]).filter(x=>charById(x)&&x!==oldGift);
        ev.gift=ne.gift||''; if(kb&&ne.desc&&!ev.pickupFor) kb.desc=String(ne.desc);
        // 새 장을 이 이벤트에 옮기고, 새로 생긴 이벤트·배너는 지워요(배너·교환소·토큰은 그대로)
        nch.ord=oldCh.ord; nch.eventId=ev.id; G.chapters=G.chapters.filter(c=>c!==oldCh); G.threads=G.threads.filter(t=>!(t.trigger&&oldCh.stages.some(s0=>s0.id===t.trigger.value)));
        oldCh.stages.forEach(s0=>{ delete P().cleared[s0.id]; }); ev.chapterId=nch.id; ev.title=ne.title; ev.desc=ne.desc; ev.gen={dir,n,len,lore:loreOf(ev)};
        G.events=G.events.filter(x=>x!==ne); G.banners=G.banners.filter(b=>b.id!==ne.bannerId); markAll(); mark('prog');
        return {title:`이벤트 스토리 「${ev.title}」로 다시 썼어요`,body:`${T('event')} 화면에서 처음부터 플레이할 수 있어요.`}; }); break; }
case 'stamopen': openStam(0); break;
case 'stamfill': { if(P().gems<STAM_FILL[0]) break; P().gems-=STAM_FILL[0]; const s=stam(); s.v+=STAM_FILL[1]; mark('prog'); closeModal(); render(); toast(`⚡ ${STAM_FILL[1]} 회복 (${s.v}/${STAM_MAX})`); break; }
case 'stamtog': { const st=P().settings; st.stamina=!t.checked?false:true; mark('prog'); updStam(); toast(st.stamina?'행동력을 켰어요':'행동력을 껐어요(전투 무제한)'); break; }
case 'scimg': { const ta=$('#'+t.dataset.ta); if(!ta) break; uploadFor={kind:'scimg',ta:ta.id,pos:ta.selectionStart}; $('#file').click(); break; }
case 'charedit': openCharEdit(id); break;
case 'charnew': openCharEdit(null); break;
case 'savechar': { if(id){const c=charById(id), old=c.name;if(!readCharForm(c))break; if(old&&old!==c.name&&old.length>=2&&(await appConfirm(`이름이 「${old}」에서 「${c.name}」(으)로 바뀌어요. 스토리·${T('talk')}·다른 캐릭터 대사에 나온 「${old}」도 모두 바꿀까요?`))){ const n=renameEverywhere(old,c.name); toast(`이름을 ${n}곳에서 바꿨어요`); } mark('c:'+id);closeModal();render();openChar(id);}
      else{const c=cleanChar({});if(!readCharForm(c))break;G.chars.push(c);mark('c:'+c.id);closeModal(); if(window.__ADDOWN){ window.__ADDOWN=false; joinChar(c,'새로'); } setTimeout(()=>artAfterAI(x=>x.o===c||x.c===c,'새 '+T('crew')+' '+c.name),300); if(NEWPU){ const lim=NEWPU==='limited'; NEWPU=false; addPickupFor(c,lim); if(window.__PUSTORY&&SAMPLE){ window.__PUSTORY=false; puStoryBg(c,lim); } tab='contract'; render(); toast(`${c.name} 픽업이 열렸어요`); artAfterAI(x=>x.o===c||x.c===c,'신규 '+T('crew')+' '+c.name); } else { render(); openChar(c.id); } } break; }
case 'delchar': if((await appConfirm('이 '+T('crew')+'을(를) 삭제할까요? 에피소드와 성장 기록도 함께 사라져요.'))){G.chars=G.chars.filter(c=>c.id!==id);delete p.owned[id];p.squad=p.squad.filter(x=>x!==id);if(p.sec===id)p.sec=null;mark('c:'+id,'prog');closeModal();render();} break;
case 'epedit': openEpEdit(id,t.dataset.ep||null); break;
case 'saveep': { const c=charById(id),d={lv:+$('#ep_lv').value,dup:+$('#ep_dup').value,after:$('#ep_after').value,title:$('#ep_title').value.trim()||'제목 없음',script:$('#ep_script').value};
      if(t.dataset.ep) Object.assign(c.episodes.find(x=>x.id===t.dataset.ep),d); else c.episodes.push(Object.assign({id:uid()},d));
      mark('c:'+id); openChar(id); break; }
case 'delep': { const c=charById(id); if((await appConfirm('이 에피소드를 삭제할까요?'))){c.episodes=c.episodes.filter(x=>x.id!==t.dataset.ep);mark('c:'+id);openChar(id);} break; }
case 'aiep': { const c=charById(id),lv=+$('#ep_lv').value,dup=+$('#ep_dup').value,after=$('#ep_after').value,hint=$('#ep_hint').value.trim();
      const stg={1:'첫인상',2:'호기심과 첫 사적인 대화',3:'일상 속 해프닝',4:'신뢰, 과거의 일부를 털어놓음',5:'질투나 오해',6:'설렘, 서로를 의식함',7:'단둘이 위기를 넘김',8:'연인 직전의 긴장감',9:'과거의 상처와 마주함',10:'고백과 그 이후'}[lv];
      const af=after?G.chapters.flatMap(ch=>ch.stages).find(x=>x.id===after):null;
      const r=await aiJSON(`${RULES}\n${ctx()}\n${SCRIPT_FMT}\n\n주인공: ${c.name}. 프로필: ${c.profile}\n말투 예시: ${c.lines.join(' / ')}\n공개된 ${T('files')}: ${c.files.filter(f=>f.dup<=dup).map(f=>f.text).join(' / ')||'없음'}\n${af?`이 이야기는 메인 스토리 "${af.title}" 직후의 일이다. 그 장면 요약: ${String(af.post||'').slice(0,400)}`:''}\n호감도 Lv.${lv}/10 개인 스토리를 써라. 이 단계의 관계: ${stg}.${dup?` ${T('limit')} ${dup}단계에서 열리는 이야기라 ${T('files')}의 비밀을 건드린다.`:''}\n기존 이야기: ${c.episodes.map(x=>`Lv.${x.lv} ${x.title}`).join(', ')||'없음'}\n${hint?'요청: '+hint:''}\n분량 20~35줄. ${T('player')}과(와) ${c.name}의 장면 중심. 배경 전환 1~2회, 음악 지시 1회, 선택지 1개(분기 포함), 표정 지시를 3번 이상 쓴다.\nJSON만 출력: {"title":"제목","script":"대본"}`,t);
      if(r&&$('#ep_script')){ if(r.title)$('#ep_title').value=String(r.title); if(r.script)$('#ep_script').value=nl(r.script); toast('대본을 채웠어요. 확인 후 저장하세요.'); } break; }
case 'thedit': openThEdit(id,t.dataset.th||null); break;
case 'saveth': { const v=$('#th_trig').value, trig=v==='start'?{type:'start'}:{type:v.split(':')[0],value:v.split(':')[0]==='aff'?+v.split(':')[1]:v.split(':')[1]};
      const d={title:$('#th_title').value.trim()||'메시지',trigger:trig,needOwn:$('#th_own').value==='1',script:$('#th_script').value};
      let th; if(t.dataset.th){th=threadById(t.dataset.th);Object.assign(th,d);} else {th=Object.assign({id:uid(),charId:id},d);G.threads.push(th);}
      mark('t:'+th.id); checkTriggers(); openChar(id); break; }
case 'delth': if((await appConfirm('이 '+T('talk')+'을(를) 삭제할까요?'))){G.threads=G.threads.filter(x=>x.id!==t.dataset.th);delete p.inbox[t.dataset.th];mark('t:'+t.dataset.th,'prog');openChar(id);} break;
case 'aithread': { const c=charById(id),hint=$('#th_hint').value.trim(),tv=$('#th_trig').selectedOptions[0].textContent;
      const r=await aiJSON(`${RULES}\n${ctx()}\n${THREAD_FMT}\n\n보내는 대원: ${c.name}. 프로필: ${c.profile}\n말투 예시: ${c.lines.join(' / ')}\n도착 시점: ${tv}. 현재 호감도: ${own(c.id)?affLv(own(c.id)):1}\n${hint?'요청: '+hint:''}\n${c.name}이(가) ${T('player')}에게 보내는 메신저 대화를 써라. 12~25줄, 선택지 1~2개와 분기 반응 포함. 마지막은 여운이 남게. 사진을 보낸다면 소품 목록이나 배경 목록의 이름을 쓴다.\nJSON만 출력: {"title":"대화방 미리보기 제목","script":"대화"}`,t);
      if(r&&$('#th_script')){ if(r.title)$('#th_title').value=String(r.title); if(r.script)$('#th_script').value=nl(r.script); toast('대화를 채웠어요. 확인 후 저장하세요.'); } break; }
case 'ststory': { const ch0=G.chapters.find(x=>x.id===t.dataset.ch), s0=ch0&&ch0.stages.find(x=>x.id===t.dataset.st); if(!s0) break; closeModal(); playStoryStage(ch0,s0); break; }
case 'story': { const ch=G.chapters.find(x=>x.id===t.dataset.ch),s=ch.stages.find(x=>x.id===t.dataset.st); closeModal(); playStory(s.title,s[t.dataset.k],()=>openStage(ch.id,s.id)); break; }
case 'chedit': chDraft=clone(G.chapters.find(x=>x.id===t.dataset.ch)); openChEdit(); break;
case 'addstage': readChForm(); chDraft.stages.push({id:uid(),title:'새 작전',reward:400,enemies:[{name:'잔광',elem:'홍',hp:900,atk:80,def:35,spd:95,boss:false}],pre:'',post:''}); openChEdit(); break;
case 'delstage': { readChForm(); if(chDraft.stages.length<=1){ toast('스테이지는 1개 이상 있어야 해요'); break; } const st=chDraft.stages[+t.dataset.j], live=G.chapters.find(x=>x.id===chDraft.id);
      const L=st&&live&&live.stages.some(x=>x.id===st.id)?storyLinks([st.id],live,live.eventId&&G.events.find(e=>e.id===live.eventId)):null, n=L?L.threads.length+L.codex.length+L.libs.length+L.rels.length:0;
      if(n&&(await appConfirm(`이 스테이지에 연결된 ${T('talk')} ${L.threads.length}개, 도감 ${L.codex.length}개, CG·소품 ${L.libs.length}개, 관계 기록 ${L.rels.length}개도 지울까요?
(저장을 눌러야 반영돼요. 취소하면 스테이지만 지워요)`))) (chDraft.__purge=chDraft.__purge||[]).push(st.id);
      chDraft.stages.splice(+t.dataset.j,1); openChEdit(); break; }
case 'savech': { readChForm(); const pg=chDraft.__purge; delete chDraft.__purge; const old=G.chapters.find(x=>x.id===chDraft.id);
      if(pg&&pg.length&&old){ storyPurge(storyLinks(pg,old,old.eventId&&G.events.find(e=>e.id===old.eventId)),{threads:1,codex:1,libs:1,rels:1}); pg.forEach(id=>{ delete P().cleared[id]; }); }
      const i=G.chapters.findIndex(x=>x.id===chDraft.id); delete chDraft.relScan; G.chapters[i]=chDraft; mark('ch:'+chDraft.id); syncEnemies(); scanScriptAssets(); relFromScripts(chDraft); closeModal(); render(); break; }
case 'stdetail': { readChForm(); const j=+t.dataset.j, s0=chDraft.stages[j], ch0=chDraft; if(!s0) break; if(!(s0.pre||s0.post)){ toast('먼저 대본이 있어야 해요'); break; }
      const nb=[ch0.stages[j-1],ch0.stages[j+1]].map((x,k)=>x?`${k?'다음':'이전'} 스테이지 「${x.title}」 ${k?'시작':'끝'}: ${String(k?x.pre:(x.post||x.pre)||'').split('\n').slice(k?0:-8,k?8:undefined).join(' / ')}`:'').filter(Boolean).join('\n');
      const r=await aiJSON(`${RULES}\n${ctx()}${storyMemo()}${relCtx((s0.pre||'')+'\n'+(s0.post||''),[],40)}\n${SCRIPT_FMT}\n\n아래는 「${ch0.title}」 스테이지 ${j+1} 「${s0.title}」의 대본이다. 사건 순서·선택지·지시(배경·음악·CG·소품·톡·효과)·결말은 그대로 두고 디테일을 보강해 다시 써라. ${DETAIL_RULE} 분량은 지금의 1.5~2배. 앞뒤 스테이지와 자연스럽게 이어지게 한다.\n${nb}\n${s0.story?'전투 없는 스테이지라서 pre 하나에 모두 담고 post는 빈 문자열로 둔다.':'pre는 전투 직전에서 끝나고, post는 전투 직후부터 시작한다.'}\n[pre]\n${s0.pre||''}\n[post]\n${s0.post||''}\nJSON만 출력: {"pre":"","post":""}`,t,'complex');
      if(r&&(r.pre||r.post)){ s0.pre=nl(r.pre)||s0.pre; if(!s0.story) s0.post=nl(r.post)||s0.post; const sh=$('#modal .sheet'), sc=sh?sh.scrollTop:0; openChEdit(); const sh2=$('#modal .sheet'); if(sh2) sh2.scrollTop=sc; toast('디테일을 보강했어요. 마음에 들면 저장을 눌러 주세요'); } break; }
case 'delch': { const ch0=G.chapters.find(x=>x.id===chDraft.id)||chDraft, back=chDraft, ev0=ch0.eventId&&G.events.find(e=>e.id===ch0.eventId);
      openStoryDel({title:ch0.title,ids:ch0.stages.map(s=>s.id),ch:ch0,ev:ev0,back:()=>{ chDraft=back; openChEdit(); },run:()=>{ G.chapters=G.chapters.filter(x=>x.id!==ch0.id); mark('ch:'+ch0.id); }}); break; }
case 'world-open': openWorld(); break;
case 'saveworld': { const w=G.world; w.name=$('#w_name').value.trim()||w.name; w.summary=$('#w_sum').value.trim(); w.lore=$('#w_lore').value.trim(); w.plot=$('#w_plot').value.trim();
      w.factions=lines($('#w_fac').value).map(l=>{const i=l.search(/[:：]/);return i>0?{name:l.slice(0,i).trim(),desc:l.slice(i+1).trim()}:{name:l,desc:''};});
      if(WTERMS&&$('#w_tchk')&&$('#w_tchk').checked){ Object.entries(WTERMS).forEach(([k,v])=>{ if(v&&TERM_LABEL[k]) G.meta.terms[k]=String(v).slice(0,12); }); mark('meta'); applyMeta(); } WTERMS=null;
      mark('world'); closeModal(); render(); toast('세계관을 저장했어요'); pcSoon(); break; }
case 'aiworld': { const kw=$('#w_kw').value.trim(); if(!kw){toast('키워드를 입력해 주세요');break;}
      const r=await aiJSON(`${RULES}\n서브컬처 수집형 RPG의 세계관을 만들어라. 플레이어는 특별한 힘을 가진 동료들을 이끄는 지휘자다. 키워드: "${kw}"\nterms에는 이 세계관에 어울리는 게임 용어를 짧게 정한다(player=플레이어 호칭, crew=동료 호칭, talk=메신저 앱 이름, currency=유료 재화, gold=일반 재화, gacha=뽑기 이름, ops=전투 메뉴 이름, abyss=반복 탐사 콘텐츠 이름). ${EXPLORATION_NAME_RULE}\nplot에는 플레이어에게 아직 숨겨진 진실, 복선, 1부 전체의 굵은 전개, 플레이어가 특별한 이유를 쓴다.\nJSON만 출력: {"name":"","summary":"2~3문장","lore":"6~10문장","plot":"6~10문장","factions":[{"name":"","desc":"한 문장"}],"terms":{"player":"","crew":"","talk":"","currency":"","gold":"","gacha":"","ops":"","abyss":""}} 세력은 3~5개.`,t);
      if(r&&$('#w_name')){ $('#w_name').value=r.name||''; $('#w_sum').value=r.summary||''; $('#w_lore').value=r.lore||''; $('#w_plot').value=r.plot||''; $('#w_fac').value=(r.factions||[]).map(f=>f.name+': '+f.desc).join('\n'); WTERMS=r.terms&&typeof r.terms==='object'?r.terms:null; const tb=$('#w_terms'); if(tb&&WTERMS){ tb.hidden=false; tb.querySelector('span').textContent=Object.entries(WTERMS).filter(([k,v])=>v&&TERM_LABEL[k]).map(([k,v])=>TERM_LABEL[k]+': '+v).join(' · '); } toast('입력칸을 채웠어요. 확인 후 저장하세요.'); } break; }
case 'opening-edit': openOpeningEdit(); break;
case 'aichapter-open': openAiChapter(); break;
case 'aichapter': { const dir=$('#ai_d').value.trim()||'메인 플롯을 따라 자연스럽게 이어서', n=+$('#ai_n').value, cast=[...document.querySelectorAll('.chip.on')].map(b=>charById(b.dataset.id)?.name).filter(Boolean);
      if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); break; } closeModal();
      bgJob('chapter','다음 장 만드는 중',async()=>{ const res=await aiChapterGen(dir,n,cast,null); return res?{title:`새 이야기 「${res.ch.title}」가 열렸어요`,body:`${T('ops')}에서 바로 플레이할 수 있어요.\n새 배경·음악 ${res.nb}개, ${T('talk')} ${res.nt}개가 함께 추가됐어요.${res.nc&&res.nc.length?`\n새 인연: ${res.nc.map(c=>RL[c.rarity]+' '+c.name).join(', ')} — 이야기에서 만나면 상시 ${T('gacha')}에 들어가요.${res.nc.some(c=>c.rarity<3)?' R·SR 인연은 이 장을 끝까지 깨면 무료로 합류해요.':''}`:''}${res.npcs&&res.npcs.length?`\n새 NPC: ${res.npcs.map(c=>c.name).join(', ')}`:''}`}:null; }); break; }
case 'reload': reloadGame(); break;
case 'evopen': P().curEvent=id; tab='evd'; render(); $('#view').scrollTop=0; if(G.events.find(e=>e.id===id)?.bgm) bgm(G.events.find(e=>e.id===id).bgm); break;
case 'evbuy': { const ev=G.events.find(e=>e.id===P().curEvent), it=ev.shop.find(x=>x.id===id), buy=(P().shopBuy[ev.id]=P().shopBuy[ev.id]||{});
      if((buy[it.id]||0)>=it.limit||(P().tokens[ev.id]||0)<it.price) break;
      P().tokens[ev.id]-=it.price; buy[it.id]=(buy[it.id]||0)+1;
      if(it.type==='char'){ const c=charById(it.ref); if(c){ const o=own(c.id); if(o){ if(o.dup<5)o.dup++; toast(`${c.name} ${T('limit')} +1`);} else { P().owned[c.id]={levelCapVersion:1,transc:0,growthCostVersion:1,lv:1,exp:0,dup:0,aff:0,seen:[],wlv:0,skin:''}; toast(`${c.name} 획득!`); checkTriggers(); } } }
      else { giveReward({[it.type]:it.amt}); toast(rewardText({[it.type]:it.amt})+' 획득'); }
      sfx('확인'); mark('prog'); render(); break; }
case 'evedit': openEvEdit(id); break;
case 'evsave': { const ev=G.events.find(e=>e.id===id); ev.title=$('#ev_t').value.trim()||ev.title; ev.desc=$('#ev_d').value.trim(); ev.token=$('#ev_tok').value.trim()||ev.token; ev.bg=$('#ev_bg').value; ev.active=$('#ev_act').value==='1';
      if($('#ev_lore')){ const nl=$('#ev_lore').value; if(nl!==loreOf(ev)) evLoreSet(ev,nl); }
      const sh=lines($('#ev_shop').value).map((l,i)=>{const p2=l.split(/[,，]/).map(x=>x.trim());const ty=p2[0]||'gold';return {id:'s'+i,type:ty.startsWith('char:')?'char':ty,ref:ty.startsWith('char:')?ty.slice(5):undefined,amt:num(p2[1],1,999999,1),price:num(p2[2],1,999999,100),limit:num(p2[3],1,999,1)};});
      if(sh.length) ev.shop=sh; const b=G.banners.find(x=>x.id===ev.bannerId); if(b) b.active=ev.active; mark('prog'); closeModal(); render(); break; }
case 'evdel': { const ev=G.events.find(e=>e.id===id); if(!ev) break; const ch0=G.chapters.find(c=>c.id===ev.chapterId);
      openStoryDel({title:'이벤트 「'+ev.title+'」',ids:ch0?ch0.stages.map(s=>s.id):[],ch:ch0,ev,back:()=>openEvEdit(id),after:()=>{ tab='event'; },run:()=>{ G.events=G.events.filter(e=>e.id!==id); G.chapters=G.chapters.filter(c=>c.id!==ev.chapterId); mark('ch:'+ev.chapterId); G.banners=G.banners.filter(b=>b.id!==ev.bannerId); }}); break; }
case 'dreroll': { const b=DBOARD(); if(b.rr){ if(P().gold<2000){ toast('크레딧이 부족해요'); break; } P().gold-=2000; } b.rr=(b.rr||0)+1; b.list=b.list.map(o=>P().disp[o.id]?o:null); b.list=b.list.map(o=>o||dispOffer(b.list.filter(Boolean).map(x=>x.name))); mark('prog'); render(); toast('새 의뢰가 올라왔어요'); break; }
case 'meta-open': openMeta(); break;
case 'metasave': { if($('#ng_story')&&$('#ng_story').value.trim().length>100000){toast('스토리는 최대 100,000자입니다. 초과 내용은 자르지 않았습니다.');break;}const m=G.meta, old=m.elems.map(e=>e.n); if($('#mt_logo')) m.logoStyle=$('#mt_logo').value; if($('#ng_story')) m.story=readStoryForm(); if($('#mt_cast')) m.castSex=$('#mt_cast').value; if($('#mt_tone')) m.tone=$('#mt_tone').value.trim(); if($('#mt_art')){ m.artTags=$('#mt_art').value.trim(); m.artNeg=$('#mt_artn').value.trim(); }
      m.title=$('#mt_title').value.trim()||m.title; m.sub=$('#mt_sub').value.trim(); m.theme=$('#mt_theme').value; m.accent=$('#mt_acc').value;
      Object.keys(DEFAULT_META.terms).forEach(k=>{const v=$('#mt_t_'+k).value.trim(); if(k==='abyss')m.terms[k]=explorationName(v);else if(v)m.terms[k]=v;});
      m.elems=[0,1,2].map(i=>({n:$('#mt_e'+i).value.trim()||old[i],c:$('#mt_c'+i).value}));
      const map={}; old.forEach((o,i)=>{map[o]=m.elems[i].n;});
      G.chars.forEach(c=>{if(map[c.elem])c.elem=map[c.elem];}); G.chapters.forEach(ch=>ch.stages.forEach(st=>st.enemies.forEach(e2=>{if(map[e2.elem])e2.elem=map[e2.elem];})));
      ['atk','def','sup'].forEach(k=>{m.roles[k]=$('#mt_r_'+k).value.trim()||m.roles[k];}); m.farms.forEach((f,i)=>{f.name=$('#mt_f'+i).value.trim()||f.name;});
      const pj=PJ(); const me=pj.list.find(x=>x.id===pj.active); if(me){me.title=m.title;appStorage.setItem(PJKEY,JSON.stringify(pj));}
      markAll(); applyMeta(); closeModal(); render(); toast('게임 정의를 저장했어요'); break; }
case 'draft-open': openDraft(); break;
case 'drlib': { drRead(); const ex=$('#drLib'); if(ex){ ex.remove(); break; } const top=document.querySelector('#drPage .dr-top'); if(top) top.insertAdjacentHTML('afterend',drLibHTML()); break; }
case 'drlibsave': { drRead(); const nm=prompt('초안 이름',drName(DR2)); if(nm===null) break; const a=drLib(), name=nm.trim()||drName(DR2), old=a.find(x=>x.name===name);
      if(old&&!(await appConfirm(`「${name}」 초안을 덮어쓸까요?`))) break; const rec={id:old?old.id:'d'+uid(),name,at:Date.now(),d:drClean(DR2)}; const b=a.filter(x=>x!==old); b.unshift(rec); if(drLibSave(b)){ toast('초안을 저장했어요'); const ex=$('#drLib'); if(ex) ex.outerHTML=drLibHTML(); } break; }
case 'drlibload': { const x=drLib().find(y=>y.id===id); if(!x) break; drRead(); if(drText(DR2).trim()&&!(await appConfirm('지금 쓰던 초안 대신 불러올까요? (지금 초안은 먼저 보관함에 저장해 두세요)'))) break; drLoadFrom(x.d,x.name); break; }
case 'drreuseoff': drRead(); delete DR2.reuse; drSave(); openDraft(); toast('그림을 새로 그리는 초안으로 바꿨어요'); break;
case 'drxcur': drRead(); openDraftExport(drName(DR2),DR2,()=>{ openDraft(); }); break;
case 'drxlib': { const x=drLib().find(y=>y.id===id); if(x){ drRead(); openDraftExport(x.name,x.d,()=>openDraft()); } break; }
case 'drxcopy': { const tx=$('#drx_code').value; try{ await navigator.clipboard.writeText(tx); toast('초안 코드를 복사했어요'); }catch(e){ const ta=$('#drx_code'); uiSelectText(ta); try{ document.execCommand('copy'); toast('초안 코드를 복사했어요'); }catch(_){ toast('길게 눌러 직접 복사해 주세요'); } } break; }
case 'drxfile': { if(!DRX) break; await saveTextFile(JSON.stringify({v:1,name:DRX.name,d:drClean(DRX.d)},null,1),'초안_'+String(DRX.name).replace(/[^\w가-힣-]+/g,'_').slice(0,30)+'.json'); break; }
case 'drxback': { const b=DRX&&DRX.back; DRX=null; if(b) b(); else if($('#dri_code')) openDraft(); else closeModal(); break; }
case 'drimport': drRead(); openDraftImport(); break;
case 'drigo': draftImportDone(draftFrom($('#dri_code').value),$('#dri_load').checked); break;
case 'drifile': $('#drfile').click(); break;
case 'drlibdel': { const a=drLib(), x=a.find(y=>y.id===id); if(!x||!(await appConfirm(`「${x.name}」 초안을 지울까요?`))) break; drLibSave(a.filter(y=>y!==x)); const ex=$('#drLib'); if(ex) ex.outerHTML=drLibHTML(); break; }
case 'drtab': drRead(); DRTAB=t.dataset.k; document.querySelectorAll('#drPage [data-dr]').forEach(s=>s.hidden=s.dataset.dr!==DRTAB); document.querySelectorAll('#drPage [data-act=drtab]').forEach(b=>b.classList.toggle('on',b.dataset.k===DRTAB)); break;
case 'drcadd': drRead(); DR2.chars.push({name:'',role:'',profile:'',speech:'',look:'',tags:''}); drSave(); drRerender(); break;
case 'drcdel': drRead(); DR2.chars.splice(+t.dataset.i,1); drSave(); drRerender(); break;
case 'drmode': drRead(); DR2.mode=t.dataset.v||''; drSave(); openDraft(); break;
case 'drpreset': { drRead(); const v=t.dataset.v||''; DR2.preset=v; drSave(); if(v){ const sp=allPresets().find(x=>x.id===v); if(presetToCfg(v)) toast(`「${sp.name}」 그림체를 적용했어요`); } document.querySelectorAll('.dr-pre').forEach(b=>b.classList.toggle('on',(b.dataset.v||'')===v)); break; }
case 'drautoex': { const e=$('#dr_auto'); if(e){ e.value=t.dataset.v; drRead(); } break; }
case 'drpfdraw': drAvatarDraw(t); break;
case 'drcfill': drFillChar(+t.dataset.i,t); break;
case 'drpolish': drPolish(t.dataset.k,t); break;
case 'drharmony': drHarmony(t); break;
case 'drdedup': { drRead(); const n=drDedup(JSON.parse(JSON.stringify(DR2))); if(!n){ toast('겹치는 문장이 없어요'); break; } drSnap('겹치는 문장 정리'); drDedup(); drSave(); drRerender(); toast(`겹치는 문장 ${n}개를 정리했어요. 마음에 안 들면 「되돌리기」`); break; }
case 'drundo': { if(!DR2.undo) break; drRead(); const u=DR2.undo; if(u.kw!=null) DR2.kw=u.kw; if(u.tone!=null) DR2.tone=u.tone; DR2.world=u.world; DR2.setting=u.setting; DR2.story=u.story; DR2.chars=u.chars; if(u.hero){ const av=DR2.hero.av; DR2.hero=Object.assign({},u.hero,{av}); } else if(u.bio!=null) DR2.hero.bio=u.bio; delete DR2.undo; drSave(); drRerender(); toast('다듬기 전으로 되돌렸어요'); break; }
case 'drpreview': { drRead(); const tx=drText(); const pg=$('#drPage'); const old=$('#drPrev'); if(old){ old.remove(); break; } pg.querySelector('.dr-intro').insertAdjacentHTML('beforeend',`<pre id="drPrev" class="code-box" style="white-space:pre-wrap;max-height:50vh;overflow:auto;margin-top:8px">${esc(tx||'아직 적은 설정이 없어요. 테마 탭의 장르와 키워드만으로 만들어요.')}</pre>`); break; }
case 'drclear': if(!(await appConfirm('초안을 모두 지울까요?'))) break; try{ appStorage.removeItem(DR2KEY); idbDel('draft_avatar').catch(()=>{}); }catch(e){} if(DRAVU){ URL.revokeObjectURL(DRAVU); DRAVU=null; } DRTAB='theme'; openDraft(); break;
case 'drmanual': { drRead(); if(!(await appConfirm('적은 내용 그대로 새 게임을 만들까요?\n비어 있는 대사·스킬·적은 기본값으로 채워요. 나중에 글 AI를 등록하면 편집 화면에서 다듬을 수 있어요.'))) break; t.disabled=true; try{ await newGameManual(t,DR2); }catch(err){ toast('만들기 실패: '+((err&&err.message)||err)); } if(t.isConnected) t.disabled=false; break; }
case 'drmake': { drRead(); if(DR2.mode==='auto'?!String(DR2.auto||'').trim():(!String(DR2.kw||'').trim()&&!String(DR2.world||'').trim())){ toast(DR2.mode==='auto'?'만들고 싶은 게임을 적어 주세요':'테마의 장르와 키워드나 세계관 중 하나는 적어 주세요'); break; }
      document.querySelectorAll('#drPage button').forEach(b=>{ if(b!==t&&b.dataset.act!=='ailog') b.disabled=true; }); t.textContent='만드는 중… 화면을 끄지 마세요'; try{ await newGame(t,DR2); }catch(err){ aiLog({ok:false,stage:'새 게임 만들기',err:'앱 오류: '+String((err&&(err.stack||err.message))||err).slice(0,600)}); const st=$('#ng_stat'); if(st) st.textContent='만드는 중 오류가 났어요. 아래 \'AI 기록\'에서 내용을 확인해 주세요.'; } AISTAGE=''; document.querySelectorAll('#drPage button').forEach(b=>b.disabled=false); if(t.isConnected) t.textContent='다시 시도'; break; }
case 'charregen': openRegen(id); break;
case 'cheat2': giveReward({gold:50000,exp:200,wmat:100,core:50}); render(); toast('재료 한 묶음을 넣었어요'); break;
case 'cheat': p.gems+=10000; mark('prog'); render(); toast(`${T('currency')} 10,000개를 넣었어요`); break;
  }
}

async function handleSettingsAndAudioAction(a,t,id,p,e){
  switch(a){
case 'pxopen': openProxySet(); break;
case 'pxsave': { const v=$('#px_url').value.trim(); if(v&&!/^https:\/\//.test(v)){ toast('https:// 로 시작하는 주소를 넣어 주세요'); break; } appStorage.setItem('ggm-proxy',v); PXHOSTS.clear(); closeModal(); render(); toast(v?'중계 서버를 저장했어요':'중계 서버를 껐어요'); break; }
case 'pxtest': { const v=$('#px_url').value.trim(); if(!v){toast('주소를 넣어 주세요');break;} t.disabled=true; try{ const r=await fetch(v.replace(/\/+$/,'')+'/?u='+encodeURIComponent('https://raw.githubusercontent.com/'+RELEASE_REPO+'/main/version.json')); toast(r.ok?'중계 서버가 잘 동작해요':'중계 서버 응답: '+r.status); }catch(e){ toast('중계 서버에 연결하지 못했어요'); } t.disabled=false; break; }
case 'appre': { readAp(); const x=OAI_PRESETS[+t.dataset.i]; if(!x) break; APD.base=x[1]; if(x[2]&&!APD.model) APD.model=x[2]; if(!APD.name||APD.name===AITYPE.openai||OAI_PRESETS.some(y=>y[0]===APD.name)) APD.name=x[0]; if($('.sw-card')) renderSetup(); else openAp(); break; }
case 'setupopen': closeModal(); showSetup(); break;
case 'setname0': readPlayerForm(); p.nameAsked=true; mark('prog'); closeModal(); playOpening(); break;
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
case 'aptest': { const d=readAp(); if(!apValid(d)){toast('키와 모델 정보를 확인해 주세요');break;} const lb=t.textContent; t.disabled=true; t.textContent='확인 중…';
      try{ const r=await aiOne(Object.assign({},d,{id:d.id||'tmp'}),'연결 테스트다. {"ok":true}를 그대로 출력하라.','quick'); toast(r&&r.ok?'연결 성공':'응답은 왔지만 형식이 달라요'); }
      catch(e){ toast(AIERR[e&&e.code]?AIERR[e.code]+(e.message?' '+e.message:''):('연결 실패. '+((e&&e.message)||''))); }
      finally{ if(t.isConnected){t.disabled=false;t.textContent=lb;} } break; }
case 'llmopen': openModal(llmHTML()); break;
case 'llmsave': { const L=llmSlots(); Object.assign(L,{top:$('#llm_top').value,mid:$('#llm_mid').value,bot:$('#llm_bot').value,tag:$('#llm_tag')?$('#llm_tag').value:(L.tag||'')}); saveLlm(L); toast('글 AI 지침을 저장했어요'); closeModal(); render(); break; }
case 'llmtog': { const L=llmSlots(), x=L.presets.find(q=>q.id===id); if(!x) break; x.on=!!t.checked; saveLlm(L); toast(`「${x.name}」 ${x.on?'켜짐':'꺼짐'}`); break; }
case 'llmpadd': { const L=llmSlots(), keep={top:$('#llm_top').value,mid:$('#llm_mid').value,bot:$('#llm_bot').value,tag:$('#llm_tag')?$('#llm_tag').value:''}, text=$('#llp_text').value.trim(); if(!text){ toast('지침 내용을 적어 주세요'); break; }
      const pid=$('#llp_id').value, nm=$('#llp_name').value.trim()||'지침 '+(L.presets.length+1), pos=$('#llp_pos').value; const x=pid&&L.presets.find(q=>q.id===pid);
      if(x) Object.assign(x,{name:nm,pos,text}); else L.presets.push({id:'lp'+uid(),name:nm,pos,text,on:true}); Object.assign(L,keep); saveLlm(L); openModal(llmHTML()); toast(x?'프리셋을 고쳤어요':'프리셋을 저장했어요(켜짐)'); break; }
case 'llmpedit': { const x=llmSlots().presets.find(q=>q.id===id); if(!x) break; $('#llp_name').value=x.name||''; $('#llp_pos').value=x.pos||'top'; $('#llp_text').value=x.text||''; $('#llp_id').value=x.id; $('#llp_text').focus({preventScroll:true}); break; }
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
      t.disabled=true; let done=0;
      for(const [c,txt] of need){ try{ await ttsBlob(c,txt); done++; if(t.isConnected) t.textContent=`만드는 중 ${done}/${need.length}`; }catch(e){ toast('중단: '+(AIERR[e&&e.code]||'')+' '+((e&&e.message)||'')); break; } }
      toast(`음성 ${done}개를 저장했어요`); if($('#vstat')) openSound(); break; }
case 'sndsave': { const o=SND(); Object.assign(o,{sfxVol:+$('#sd_xv').value/100,bgmVol:+$('#sd_bv').value/100,voiceVol:+$('#sd_vv').value/100,bgmOn:$('#sd_bon').value==='1',voiceStory:$('#sd_vs').value==='1',voiceLobby:$('#sd_vl').value==='1',voiceLang:$('#sd_lang')?$('#sd_lang').value:'ko',
      fishKey:$('#sd_fk').value.trim(),fishModel:$('#sd_fm').value,elKey:$('#sd_ek').value.trim(),elBase:$('#sd_eb')?$('#sd_eb').value.trim():(o.elBase||''),elModel:$('#sd_em').value,elLen:num($('#sd_el').value,10,300,90),
      scene:{title:$('#sd_title').value,lobby:$('#sd_lobby').value,battle:$('#sd_battle').value,boss:$('#sd_boss').value,gacha:$('#sd_gacha').value}});
      appStorage.setItem(SKEY,JSON.stringify(o)); P().scene=clone(o.scene); mark('prog'); closeModal(); render(); BGM.name=null; sceneBgm(); toast('소리 설정을 저장했어요'); break; }
case 'fishtest': { const k=$('#sd_fk').value.trim(); if(!k){toast('Fish Audio 키를 넣어 주세요');break;} const o=SND(); o.fishKey=k; appStorage.setItem(SKEY,JSON.stringify(o));
      try{ await fishSearch('','',1); toast('Fish Audio 연결 성공'); }catch(e){ toast('연결 실패. '+(AIERR[e&&e.code]||'')+' '+((e&&e.message)||'')); } break; }
case 'voice': if($('#modal .sheet.cs-sheet')||$('#modal .sk-card')) MBACK=()=>openChar(id); VS={cid:id,sid:t.dataset.s||'',results:[],picks:{},lang:VS.lang||'ko',q:''}; if(!SND().fishKey) toast('설정의 소리에서 Fish Audio 키를 먼저 넣어 주세요'); renderVoice(); break;
case 'vclear': { const c=charById(id); c.voiceId='';c.voiceName=''; mark('c:'+id); openChar(id); break; }
case 'vsearch': { VS.q=$('#vs_q').value.trim(); VS.lang=$('#vs_lang').value; t.disabled=true;
      try{ VS.results=await fishSearch(VS.q,VS.lang,30); VS.picks={}; renderVoice(VS.results.length?'':'검색 결과가 없어요. 다른 단어나 언어 전체로 다시 찾아보세요.'); }catch(e){ toast(AIERR[e&&e.code]||('검색 실패. '+((e&&e.message)||''))); if(t.isConnected) t.disabled=false; } break; }
case 'vsai': { const c=charById(VS.cid); VS.lang=$('#vs_lang').value;
      if(!SND().fishKey){toast('설정의 소리에서 Fish Audio 키를 먼저 넣어 주세요');break;}
      const q=await aiJSON(`캐릭터에 맞는 목소리를 Fish Audio 음성 라이브러리 제목 검색으로 찾으려 한다.\n캐릭터: ${c.name}. 프로필: ${c.profile}\n외모 태그: ${c.naiPrompt||''} (성별은 프로필과 외모 태그로 판단한다)\n말투: ${c.lines.slice(0,3).join(' / ')}\n음성 제목 검색에 쓸 짧은 검색어 6개를 만들어라. 목소리 톤, 나이대 느낌, 성격을 나타내는 1~2단어로, 한국어 2개, 일본어 2개, 영어 2개. 예: "차분한 여성", "누나", "お姉さん", "クール", "calm female", "seductive".\nJSON만 출력: {"queries":["..."]}`,t,'quick');
      if(!q) break; renderVoice('목소리를 찾는 중이에요…');
      const seen=new Map();
      try{ for(const w of strs(q.queries).slice(0,6)){ for(const m of await fishSearch(w,VS.lang,10)) if(!seen.has(m._id)) seen.set(m._id,m); } }catch(e){ toast(AIERR[e&&e.code]||('검색 실패. '+((e&&e.message)||''))); }
      const list=[...seen.values()];
      if(!list.length){ VS.results=[]; renderVoice('검색 결과가 없어요. 언어를 전체로 바꾸거나 직접 검색해 보세요.'); break; }
      const cands=list.slice(0,30).map(m=>({id:m._id,title:m.title,desc:String(m.description||'').slice(0,100),tags:(m.tags||[]).slice(0,6),lang:m.languages}));
      const rk=await aiJSON(`캐릭터: ${c.name}. ${c.profile}\n외모 태그: ${c.naiPrompt||''} (성별은 프로필과 외모 태그로 판단한다)\n말투: ${c.lines.slice(0,3).join(' / ')}\n아래 음성 후보 중 이 캐릭터에 어울리는 것을 최대 6개 골라 잘 어울리는 순서로 나열하라. 남성 음성, 아동 음성, 내레이터용 음성은 제외한다.\n후보: ${JSON.stringify(cands)}\nJSON만 출력: {"picks":[{"id":"후보 id","reason":"한 줄 이유"}]}`,null,'quick');
      VS.picks={}; const order=[]; if(rk) for(const p of (rk.picks||[])){ const m=seen.get(p.id); if(m&&VS.picks[p.id]===undefined){VS.picks[p.id]=String(p.reason||'');order.push(m);} }
      VS.results=[...order,...list.filter(m=>VS.picks[m._id]===undefined)];
      renderVoice(order.length?'AI가 고른 후보가 위에 있어요. ▶로 샘플을, 대사로 이 캐릭터 대사를 들어 보세요.':''); break; }
case 'vsplay': stopVoice(); VOICE.src=t.dataset.u; VOICE.volume=SND().voiceVol; VOICE.play().catch(()=>toast('샘플을 재생하지 못했어요')); break;
case 'vstry': { const c=charById(VS.cid); t.disabled=true; await speak(Object.assign({},c,{voiceId:id}),c.intro||c.lines[0]||c.name); if(t.isConnected) t.disabled=false; break; }
case 'vspick': { const c=charById(VS.cid), m=VS.results.find(x=>x._id===id), tg=(VS.sid&&(c.skins||[]).find(x=>x.id===VS.sid))||c; tg.voiceId=id; tg.voiceName=m?m.title:id; mark('c:'+c.id); toast(tg===c?`${c.name}의 목소리를 정했어요`:`${T('skin')} 「${tg.name}」의 목소리를 정했어요`); openChar(c.id); break; }
case 'vsetid': { const v=$('#vs_id').value.trim(), m=v.match(/[0-9a-f]{32}/i); if(!m){toast('보이스 ID를 찾지 못했어요');break;} const c0=charById(VS.cid), c=(VS.sid&&(c0.skins||[]).find(x=>x.id===VS.sid))||c0; c.voiceId=m[0].toLowerCase(); c.voiceName='';
      try{ const j=okJSON(await http('https://api.fish.audio/model/'+c.voiceId,{headers:{Authorization:'Bearer '+SND().fishKey},timeout:20000})); c.voiceName=j.title||''; }catch(e){}
      mark('c:'+c.id); toast('목소리를 연결했어요'); openChar(c.id); break; }
case 'elcompose': { const l=libById(id), s=SND(); if(!s.elKey){toast('설정의 소리에서 ElevenLabs 키를 넣어 주세요');break;}
      const pr=(($('#li_prompt')&&$('#li_prompt').value.trim())||l.prompt||'').trim(); if(!pr){toast('음악 프롬프트를 먼저 채워 주세요');break;}
      l.prompt=pr; mark('l:'+l.id); const lb=t.textContent; t.disabled=true; t.textContent='작곡 중… 1~3분';
      try{ await elCompose(l); toast(`「${l.name}」 작곡 완료`); bgm(l.name,true); if($('#li_name')) openLibItem(l.id); }
      catch(e){ toast('작곡 실패. '+(AIERR[e&&e.code]||'')+' '+((e&&e.message)||'')); if(t.isConnected){t.disabled=false;t.textContent=lb;} } break; }
  }
}

async function handleStorageAndSharingAction(a,t,id,p,e){
  switch(a){
case 'syopen': openSync(); break;
case 'sylink': openUrl(t.dataset.url); break;
case 'sypush': closeModal(); syPush(false); break;
case 'sypushf': closeModal(); syPush(true); break;
case 'sypull': { const o=SY(); if(o.last&&(G.prog.savedAt||0)>(o.localAt||0)+5000&&!(await appConfirm('이 기기에 아직 올리지 않은 진행이 있어요. 받으면 이 기기의 진행은 덮어써져요. 받을까요?'))) break; closeModal(); syPull(); break; }
case 'sysave': { const repo=$('#sy_repo').value.trim().replace(/^https?:\/\/github\.com\//,'').replace(/\.git$/,'').replace(/\/+$/,''), token=$('#sy_tok').value.trim();
      if(!/^[\w.-]+\/[\w.-]+$/.test(repo)||!token){ toast('저장소(아이디/이름)와 토큰을 넣어 주세요'); break; }
      const o=Object.assign(SY(),{repo,token,device:$('#sy_dev').value.trim()||syDevice(),auto:$('#sy_auto').checked,autoUp:$('#sy_up').checked,keys:$('#sy_keys').checked,lock:$('#sy_lock').checked}); saveSY(o);
      t.disabled=true; t.textContent='확인 중…';
      try{ const info=await gh(o,''); if(!info.private){ toast('이 저장소는 공개예요. 비공개(Private)로 바꾼 뒤 다시 저장해 주세요'); o.token=''; saveSY(o); t.disabled=false; t.textContent='저장하고 연결 확인'; break; }
        if(info.permissions&&info.permissions.push===false){ toast('이 토큰은 저장소에 쓸 권한이 없어요 (Contents: Read and write)'); t.disabled=false; t.textContent='저장하고 연결 확인'; break; }
        const R=await syRemote(o); closeModal(); render(); if(LKMODE()==='gh') setTimeout(()=>{ lkOp('claim').then(()=>{ LK.claimed=true; lkLoop(); }).catch(()=>{}); },500);
        if(R.state&&R.state.device!==o.device){ openModal(`${head('연결됐어요')}<p>클라우드에 <b>${esc(R.state.device)}</b>에서 ${esc(new Date(R.state.at).toLocaleString())}에 올린 데이터가 있어요.</p><div class="row" style="margin-top:12px"><button class="btn" data-act="sypull">그 데이터 받기</button><button class="btn ghost" data-act="sypushf">이 기기 데이터 올리기</button></div>`); }
        else { openModal(`${head('연결됐어요')}<p>이 기기의 게임을 클라우드에 올려 둘까요? 그다음 다른 기기에서 같은 저장소로 연결하고 '받기'를 누르면 돼요.</p><div class="row" style="margin-top:12px"><button class="btn" data-act="sypush">지금 올리기</button><button class="btn ghost" data-act="close">나중에</button></div>`); }
      }catch(err){ toast('연결 실패. '+syErr(err)); t.disabled=false; t.textContent='저장하고 연결 확인'; } break; }
case 'bkgo': { const o={share:t.dataset.share==='1',img:t.dataset.img==='1',audio:t.dataset.aud==='1',gate:t.dataset.gate!=='0',dest:$('#bk_dest').value,voice:$('#bk_voice')?$('#bk_voice').checked:false}; closeModal(); exportGo(o); break; }
case 'bkshare': { try{ await CAP.Share.share({title:APP_NAME+' 백업',files:[t.dataset.uri]}); }catch(e){} break; }
case 'pickgame': { if($('#pk_last')&&$('#pk_last').checked) try{ appStorage.setItem('ggm-start','last'); }catch(e){} try{ sessionStorage.setItem('ggm-picked','1'); }catch(e){} const pj=PJ(); if(id===pj.active){ showStart(); break; } await switchProject(id); break; }
case 'pcopen': openPcSet(); break;
case 'syoff': { if(!(await appConfirm('PC·폰 연동을 해제할까요?\n이 기기의 게임은 그대로 남고, GitHub 저장소의 데이터도 지워지지 않아요. 이 기기에 저장된 토큰만 지워요.'))) break; try{ if(LKMODE()==='gh'&&LK.claimed) await lkSave(true), await lkOp('free'); }catch(e){} clearInterval(LK.t); LK.claimed=false; lkUnlock(); try{ appStorage.removeItem(SYKEY); }catch(e){} closeModal(); render(); toast('연동을 해제했어요'); break; }
case 'pcsave': { if($('#pc_pxoff')){ try{ appStorage.setItem('ggm-proxy-off',$('#pc_pxoff').checked?'1':'0'); }catch(e){} } const o=parsePcLink($('#pc_link').value); if(!o){ toast('주소에 ?pc=키가 들어 있어야 해요'); break; } o.auto=$('#pc_auto').checked; o.lock=$('#pc_lock').checked; t.disabled=true;
      try{ const r=await http(o.base+'/api/hello',{headers:{'X-GGM-Key':o.key},timeout:15000}); const j=JSON.parse(r.text||'{}'); if(!j.app) throw 0; if(!j.auth){ toast('키가 맞지 않아요. QR 주소를 다시 붙여 넣어 주세요'); t.disabled=false; break; }
        const old=PCS(); setPCS(Object.assign({},old&&old.key===o.key?old:{},o)); closeModal(); render(); toast(`PC 서버(${j.host||'PC'})에 연결했어요`); window.__PC_NEW=1; pcStart(); if(LKMODE()==='pc') setTimeout(lkActivate,1500); }
      catch(err){ toast('PC 서버에 연결하지 못했어요. PC에서 서버 창이 켜져 있는지 확인해 주세요'); t.disabled=false; } break; }
case 'pcoff': { if(!(await appConfirm('PC 서버 연결을 해제할까요?\n이 기기의 게임은 그대로 남고, PC에 저장된 데이터도 지워지지 않아요.'))) break; try{ if(LKMODE()==='pc'&&LK.claimed) await lkSave(true), await lkOp('free'); }catch(e){} clearInterval(LK.t); LK.claimed=false; lkUnlock(); setPCS(null); closeModal(); render(); toast('PC 서버 연결을 해제했어요'); break; }
case 'pcpush': closeModal(); pcPush(false); break;
case 'pcpushf': closeModal(); pcPush(false,true); break;
case 'pcpullgo': closeModal(); pcPull(); break;
case 'pchist': openPcHist(); break;
case 'pchistgo': { if(!(await appConfirm('이 백업으로 되돌릴까요?\n이 기기의 게임이 그 시점으로 바뀌고, PC에도 다시 저장돼요. (지금 PC에 있는 저장도 백업 목록에 남아요)'))) break; t.disabled=true;
    try{ const h=await pcApi('/api/store/history/'+encodeURIComponent(id)), cur=await pcApi('/api/store/state',{ok404:true}); if(!h||!h.ls) throw {message:'백업을 읽지 못했어요'}; closeModal(); await pcPull({state:h,restore:true,cur:cur&&cur.at}); }catch(e){ toast('백업을 받지 못했어요. '+syErr(e)); t.disabled=false; } break; }
case 'pcpull': { const pc=PCS(); if(pc&&pc.last&&(G.prog.savedAt||0)>(pc.localAt||0)+5000&&!(await appConfirm('이 기기에 아직 PC에 저장하지 않은 진행이 있어요. 받으면 덮어써져요. 받을까요?'))) break; closeModal(); pcPull(); break; }
case 'resetth': delete p.inbox[t.dataset.th]; mark('prog'); checkTriggers(); toast('조건을 만족하면 다시 도착해요'); break;
case 'exportfile': openBackupChoice('full'); break;
case 'importfile': $('#bkfile').click(); break;
case 'pj-open': openProjects(); break;
case 'pjswitch': await switchProject(id); break;
case 'pjdel': { if(!(await appConfirm('이 게임을 삭제할까요? 되돌릴 수 없어요.'))) break; const pj=PJ(); if(id===pj.active){toast('현재 플레이 중인 게임은 삭제할 수 없어요');break;} await flush();await appStorage.assertCurrent(PJKEY);pj.list=pj.list.filter(x=>x.id!==id); appStorage.setItem(PJKEY,JSON.stringify(pj)); appStorage.removeItem(pjKey(id));await appStorage.drain(); openProjects(); break; }
case 'pjblank': { await flush(); const id2='g'+uid(), d=defaults(); d.meta.title=G.meta.title+' (사본)'; appStorage.setItem(pjKey(id2),JSON.stringify(d)); const pj=PJ(); pj.list.push({id:id2,title:d.meta.title}); pj.active=id2; appStorage.setItem(PJKEY,JSON.stringify(pj)); reloadGame(); break; }
case 'pubopen': openPub(); break;
case 'pubgo': { const P0=PUB(); P0.repo=$('#pb_repo').value.trim().replace(/^https?:\/\/github\.com\//,'').replace(/\.git$/,'').replace(/\/$/,''); P0.branch=$('#pb_branch').value.trim()||'main'; P0.token=$('#pb_tok').value.trim(); savePUB(P0); await pubUpload($('#pb_notes').value.trim(),t); break; }
case 'pubcopy': case 'pubcopy2': { const v=t.dataset.v||($('#pub_addr')&&$('#pub_addr').value)||''; try{ await navigator.clipboard.writeText(v); toast('주소를 복사했어요'); }catch(e){ prompt('복사해 주세요',v); } break; }
case 'subadd': openSubAdd(); break;
case 'subgo': await subscribe($('#sb_addr').value,t); break;
case 'subcheck': await subCheck(true); break;
case 'subapply': await subApply(t); break;
case 'subskip': { if(G.meta.subscr){ G.meta.subscr.skip=+t.dataset.v||0; mark('meta'); } closeModal(); toast('설정 → 게임 → 업데이트 확인에서 언제든 받을 수 있어요'); break; }
case 'subcopy': { const b=G.meta.subscr&&G.meta.subscr.base, m=b&&b.match(/raw\.githubusercontent\.com\/([\w.-]+\/[\w.-]+)\/([\w.-]+)\/(.+?)\/$/), v=m?subAddr(m[1],m[2],m[3]):b; try{ await navigator.clipboard.writeText(v); toast('구독 주소를 복사했어요'); }catch(e){ prompt('복사해 주세요',v); } break; }
case 'subleave': { if(!(await appConfirm('구독을 끊을까요? 지금 게임은 그대로 남고, 앞으로 업데이트를 받지 않아요. 이 게임을 내 게임처럼 직접 고치고 만들 수 있어요.'))) break; delete G.meta.subscr; mark('meta'); const pj=PJ(), row=pj.list.find(x=>x.id===pj.active); if(row){ delete row.sub; appStorage.setItem(PJKEY,JSON.stringify(pj)); } render(); toast('구독을 끊었어요'); break; }
case 'pjreroll': { let g=null; if(id===PJ().active) g=G; else try{ g=JSON.parse(appStorage.getItem(pjKey(id))||'null'); }catch(e){} if(!g){ toast('게임을 읽지 못했어요'); break; }
      let d=g.meta&&g.meta.draft?clone(g.meta.draft):null; const title=(g.meta&&g.meta.title)||'게임';
      if(!d){ // 초안이 없는 게임(샘플 등)은 지금 세계관·캐릭터로 초안을 만들어요
        d={mode:'detail',gtitle:title,kw:String((g.world&&g.world.name)||title),tone:(g.meta&&g.meta.tone)||'',world:[(g.world||{}).summary,(g.world||{}).lore].filter(Boolean).join('\n\n'),setting:((g.world||{}).factions||[]).map(f=>f.name+': '+(f.desc||'')).join('\n'),story:'',stages:4,len:'normal',
          hero:{name:(g.prog&&g.prog.player)||'',call:(g.meta&&g.meta.terms&&g.meta.terms.player)||'',gender:(g.prog&&g.prog.genderTxt)||'',look:(g.prog&&g.prog.look)||'',bio:(g.prog&&g.prog.bio)||'',hide:!!(g.prog&&g.prog.hideEyes)},
          chars:[...(g.chars||[]).filter(c=>!c.alt).map(c=>({name:c.name,kind:'crew',rank:c.rarity,role:(c.faction||'')+(c.faction?' · ':'')+(ROLE[c.role]||''),profile:c.profile||'',speech:(c.lines||[]).slice(0,2).join(' / '),look:'',tags:c.naiPrompt||''})),...(g.npcs||[]).map(n=>({name:n.name,kind:'npc',role:n.role||'',profile:n.profile||'',speech:n.speech||'',look:n.look||'',tags:n.naiPrompt||''}))]}; }
      { // 인물은 실제 게임의 캐릭터 이름 그대로 넣어요(초안에 이름을 비워 뒀거나 나중에 바꿨어도 그림이 짝지어지게). 초안에 적어 둔 외모·말투는 이어받아요
        const old=Array.isArray(d.chars)?d.chars:[], pick=n=>old.find(x=>x&&nameEq(x.name,n))||{};
        d.chars=[...(g.chars||[]).filter(c=>!c.alt).map(c=>{ const o=pick(c.name); return {name:c.name,kind:'crew',rank:c.rarity,role:o.role||((c.faction||'')+(c.faction?' · ':'')+(ROLE[c.role]||'')),profile:c.profile||o.profile||'',speech:o.speech||(c.lines||[]).slice(0,2).join(' / '),look:o.look||'',tags:c.naiPrompt||o.tags||''}; }),
          ...(g.npcs||[]).map(n=>{ const o=pick(n.name); return {name:n.name,kind:'npc',role:n.role||o.role||'',profile:n.profile||o.profile||'',speech:n.speech||o.speech||'',look:n.look||o.look||'',tags:n.naiPrompt||o.tags||''}; })]; }
      d.mode='detail'; d.reuse={pj:id,title}; try{ if(typeof SW!=='undefined'&&SW&&$('#sw_card,.setup')){ swRead(); swSave(); } }catch(e){} appStorage.setItem(SETUP_KEY,'1'); drLoadFrom(d,title+' 리롤');
      toast(`「${title}」의 캐릭터·NPC·배경 그림을 이름이 같은 인물에 그대로 써요. 세계관·인물 설정을 고친 뒤 만들기를 누르세요`); break; }
case 'pjdraftx': { let g=null; try{ g=JSON.parse(appStorage.getItem(pjKey(id))||'null'); }catch(e){} const d=g&&g.meta&&g.meta.draft; if(!d){ toast('이 게임에는 저장된 초안이 없어요'); break; } openDraftExport((g.meta.title||'게임')+' 초안',d,null); break; }
case 'backup': openBackup(); break;
case 'importbk': try{const g=JSON.parse($('#bk_in').value);if(!g||!Array.isArray(g.chars))throw 0;replaceAll(g);closeModal();toast('데이터를 가져왔어요');}catch(err){toast('올바른 백업 데이터가 아니에요');} break;
case 'reset': if((await appConfirm('이 게임을 처음부터 다시 시작할까요? 직접 만든 '+T('crew')+'와 스토리도 기본값으로 돌아가요.'))){const d=defaults();replaceAll(d);applyMeta();tab='lobby';render();showTitle();} break;
  }
}

async function handleCombatAndFormationAction(a,t,id,p,e){
  switch(a){
case 'raidgo': { if(!raidTriesLeft()){ toast('오늘 도전 횟수를 다 썼어요'); break; } const b=raidBoss(); squadSel=null; FORM=null; openFormation({id:'raid',title:'레이드 · '+b.name,enemies:[b],reward:0,pre:'',post:''},{kind:'raid'},'raidstart'); break; }
case 'raidstart': { P().squad=[...squadSel]; const r=RAID(); r.tries[today()]=(r.tries[today()]||0)+1; mark('prog'); closeModal(); const b=raidBoss(), hp0=Math.max(1,b.total-r.dmg);
      startStage({id:'raid',title:'레이드 · '+b.name,enemies:[b],reward:0,pre:'',post:''},{kind:'raid',total:b.total,hp0,prep:(al,en)=>{ en[0].maxhp=b.total; en[0].hp=hp0; }}); break; }
case 'rgnew': { RGMODE='card'; RF=null; openRgForm(); break; }
case 'rfslot': RF.sel=+t.dataset.i; openRgForm(); break;
case 'rffil': RF.filter=t.dataset.v; openRgForm(); break;
case 'rfauto': RF.s=rfAuto(); RF.sel=0; openRgForm(); break;
case 'rfclr': RF.s=[null,null,null,null]; RF.sel=0; openRgForm(); break;
case 'rfpick': { const k=RF.s.indexOf(id), i=RF.sel; if(k===i) RF.s[i]=null; else { if(k>=0) RF.s[k]=RF.s[i]; RF.s[i]=id; } if(!RF.s[0]) RF.sel=0; else { const e=RF.s.indexOf(null); RF.sel=e>=0?e:RF.sel; } openRgForm(); break; }
case 'rfgo': { const ids=rfIds(); if(!ids.length) break; RG().lastSquad=ids; P().squad=[...ids]; closeModal(); try{ rgStart(ids,'card'); }catch(err){ console.error(err); RG().run=null; mark('prog'); toast('탐사를 시작하지 못했어요: '+(err&&err.message||err)); render(); } RF=null; setTimeout(()=>{ const e=document.querySelector('.ch-card.rog'); if(e) e.scrollIntoView({block:'start',behavior:'smooth'}); },60); break; }
case 'rgnode': { const run=RG().run; if(!run) break; run.msg=''; rgNode(t.dataset.v); break; }
case 'rgskip': { const run=RG().run; if(!run) break; run.pick=null; run.squad.forEach(id=>{ if(run.hp[id]>0) run.hp[id]=Math.min(1,run.hp[id]+0.1); }); run.msg='유물 대신 숨을 돌렸어요. 체력 10% 회복'; mark('prog'); render(); break; }
case 'rgrelic': { const run=RG().run; if(!run) break; run.relics.push(t.dataset.v); run.pick=null; run.msg=RELICS[t.dataset.v][0]+'을(를) 얻었어요'; mark('prog'); render(); break; }
case 'dgmove': dgMove(+t.dataset.v); break;
case 'dgdown': { const run=RG().run; if(run&&run.v===2&&run.map.cells[run.pos].t==='stairs') dgDescend(run); break; }
case 'rgcard': { const run=RG().run; if(!run||!run.cpick) break; const i=+t.dataset.i; if(i>=0&&run.cpick[i]){ run.deck.push(run.cpick[i]); run.msg=`「${cardName(run.cpick[i])}」 카드를 덱에 넣었어요`; } run.cpick=null; mark('prog'); render(); break; }
case 'rgrest': { const run=RG().run; if(!run) break; const v=t.dataset.v; run.rest=false;
      if(v==='heal'){ run.squad.forEach(id=>{ run.hp[id]=Math.min(1,(run.hp[id]>0?run.hp[id]+0.35:0.25)); }); run.msg='모닥불 곁에서 푹 쉬었어요. 쓰러진 대원도 일어났어요.'; }
      else if(v==='upg') run.upg=true; else if(v==='rm') run.rm=true; else { run.relics.push('train'); run.msg='훈련으로 공격 +5%'; }
      mark('prog'); render(); break; }
case 'rgupg': { const run=RG().run; if(!run) break; const i=+t.dataset.i; run.upg=false; if(i<0) run.rest=true; else if(run.deck[i]){ run.deck[i].up=true; run.msg=`「${cardName(run.deck[i])}」(으)로 강화했어요`; } mark('prog'); render(); break; }
case 'rgrm': { const run=RG().run; if(!run) break; const i=+t.dataset.i; if(i>=0&&run.deck.length<=8){ toast('덱은 8장보다 적게 줄일 수 없어요'); break; } run.rm=false; if(i<0) run.rest=true; else if(run.deck[i]){ const cd=run.deck.splice(i,1)[0]; run.msg=`「${cardName(cd)}」 카드를 뺐어요`; } mark('prog'); render(); break; }
case 'rgdeck': { const run=RG().run; if(run&&run.deck) rgDeckModal(run.deck); break; }
case 'cbplay': cbPlay(+t.dataset.i); break;
case 'cbsel': if(CB&&!CB.busy&&!CB.over){ const i=+t.dataset.i; if(i>=0&&CB.sel===i){ const cd=CB.hand[i]; if(cd&&cardCost(cd)<=CB.energy&&!(cd.k==='echo'&&!CB.last)) cbPlay(i); } else { CB.sel=i; cbRender(); } } break;
case 'cbult': cbUlt(); break;
case 'cbend': cbEndTurn(); break;
case 'cbtgt': if(CB&&!CB.busy){ const e=CB.enemies[+t.dataset.i]; if(e&&e.hp>0){ CB.tgt=e.i; cbRender(); } } break;
case 'cbdeck': if(CB) rgDeckModal(CB.run.deck); break;
case 'cbquit': if(CB&&!CB.over&&(await appConfirm('후퇴하면 이번 탐사가 끝나요. 지금까지의 보상은 받아요.'))) cbEnd(false); break;
case 'rgsave': { const run=RG().run; if(!run||!run.rest) break; run.saved=Date.now(); delete run.left; run.wk=run.wk||weekKey(); run.msg='야영지에서 쉬다가 탐사를 이어가요.'; mark('prog'); tab='challenge'; render(); toast(`탐사를 저장했어요. 도전 → ${T('abyss')}에서 이어서 할 수 있어요`); break; }
case 'rgleave': { const run=RG().run; if(!run){ tab='challenge'; render(); break; } if(!(await appConfirm('지금 나가면 이번 탐사가 끝나요(지금까지 간 만큼 보상은 받아요).\n저장은 야영지의 \'저장하고 나가기\'로만 할 수 있어요. 나갈까요?'))) break; const html=rgFinish(false); tab='challenge'; render(); openModal(`<div class="result" style="position:static">${html.replace('data-act="bdone"','data-act="close"')}</div>`); break; }
case 'rgquit': { if(!(await appConfirm('탐사를 끝낼까요? 지금까지의 진척에 따라 보상을 받아요.'))) break; const html=rgFinish(false); openModal(`<div class="result" style="position:static">${html.replace('data-act="bdone"','data-act="close"')}</div>`); render(); break; }
case 'opskip': e.stopPropagation(); opEnd(); break;
case 'stage': { const ch0=G.chapters.find(x=>x.id===t.dataset.ch), s0=ch0&&ch0.stages.find(x=>x.id===t.dataset.st); if(s0&&s0.story){ openStoryStage(ch0,s0); break; } squadSel=null; FORM=null; openStage(t.dataset.ch,t.dataset.st); break; }
case 'sortie': { p.squad=[...squadSel]; mark('prog'); const ch=G.chapters.find(x=>x.id===t.dataset.ch),s=ch.stages.find(x=>x.id===t.dataset.st); closeModal();
      if(!p.cleared[s.id]&&s.pre) playStory(s.title,s.pre,()=>startBattle(ch.id,s.id)); else startBattle(ch.id,s.id); break; }
case 'bauto': B.auto=!B.auto; t.classList.toggle('on',B.auto); break;
case 'bspeed': if(B?.ctx.kind==='practice'){B.speed=B.speed>=3?1:B.speed+1;t.textContent=B.speed+'x';t.classList.toggle('on',B.speed>1);bRun();break;}B.speed=B.speed>=3?1:B.speed+1; P().settings.bspeed=B.speed; mark('prog'); t.textContent=B.speed+'x'; t.classList.toggle('on',B.speed>1); bRun(); break;
case 'bdone': { if(B&&(B.ctx.kind==='raid'||B.ctx.kind==='rogue')){ const rg=B.ctx.kind==='rogue'; B=null; closeOv(); tab=rg&&RG().run?'abyss':'challenge'; render(); break; }
      const win=t.dataset.win==='1',first=t.dataset.first==='1',s=B.s; B=null; closeOv(); render();
      if(win&&first&&s.post) playStory(s.title,s.post,()=>{render();checkTriggers();}); else checkTriggers(); break; }
case 'opsch': OPS_CH=t.dataset.ch; render(); $('#view').scrollTop=0; break;
case 'opsback': OPS_CH=null; render(); break;
case 'fsq': refreshForm(); break;
case 'fpick': { const i=squadSel.indexOf(id), added=i<0; const x=e.clientX||innerWidth/2, y=e.clientY||innerHeight/2;
      if(i>=0) squadSel.splice(i,1); else if(squadSel.length<4) squadSel.push(id); else {toast('최대 4명까지 편성할 수 있어요');break;}
      const sh=$('#modal .sheet'), st=sh?sh.scrollTop:0; refreshForm(); const sh2=$('#modal .sheet'); if(sh2) sh2.scrollTop=st; ripple(x,y,false);
      if(added){ const c=charById(id), slot=document.querySelector(`.fslot[data-id="${id}"]`); if(slot){ charReact(slot.querySelector('.fs-art'),7,'head'); const pool=(c.dupLines.length?c.dupLines:[]).concat(c.lines); const l=rand(pool); if(l){ const b=document.createElement('div'); b.className='fsay'; b.textContent=sub(l); slot.appendChild(b); setTimeout(()=>b.remove(),2600); if(c.voiceId&&SND().voiceLobby) speak(c,l); } } }
      break; }
case 'fsl': refreshForm(); break;
case 'fauto': squadSel=autoSquad(FORM.stage); refreshForm(); break;
case 'ffil': FORM.filter=t.dataset.v; refreshForm(); break;
case 'fsave': { const i=+(prompt('몇 번에 저장할까요? (1~3)','1')||0)-1; if(!(i>=0&&i<3)) break; P().presets=P().presets||[]; P().presets[i]=[...squadSel]; mark('prog'); toast(`편성 ${i+1}에 저장했어요`); refreshForm(); break; }
case 'fpre': { const pr=(P().presets||[])[+t.dataset.i]; if(!pr||!pr.length){toast('저장된 편성이 없어요');break;} const busy=busyIds(); squadSel=pr.filter(x=>own(x)&&charById(x)&&!busy.has(x)).slice(0,4); refreshForm(); break; }
case 'farmgo': { const st=farmStage(t.dataset.k,+t.dataset.lv); squadSel=null; FORM=null; openFarmSquad(st); break; }
case 'farmstart': { P().squad=[...squadSel]; mark('prog'); closeModal(); startStage(farmStage(t.dataset.k,+t.dataset.lv),{kind:'farm'}); break; }
  }
}

async function handleUpdatesAction(a,t,id,p,e){
  switch(a){
case 'webupdcheck': checkWebUpdate(true); break;
case 'webupdgo': applyWebUpdate(t); break;
case 'webupdskip': { const o=LV(); if(WEBUPD) o.webSkip=WEBUPD.build; saveLV(o); closeModal(); toast('다음 버전이 나오면 다시 알려 드릴게요'); break; }
case 'updel': { const c=charById(id); if(!c||!c.upper) break; c.upper.img=null; mark('c:'+c.id); openChar(c.id); break; }
case 'upd-open': openUpdSet(); break;
case 'updcheck': checkUpdate(true); break;
case 'updget': { const lb=t.textContent; t.disabled=true; t.textContent='받는 중…'; await applyUpdate(false); if(t.isConnected){t.disabled=false;t.textContent=lb;} break; }
case 'updskip': { const o=LV(); if(UPD) o.skip=UPD.man.build; saveLV(o); closeModal(); toast('이 버전은 다시 묻지 않아요. 설정에서 직접 확인할 수 있어요'); break; }
case 'apkget': openUrl(t.dataset.url); break;
case 'relnotes': openUrl('https://github.com/'+updRepo(LV())+'/releases/latest'); break;
case 'uprollback': { const prev=await appStorage.readLive('starfall-live-prev'); if(!prev) break; const o=LV(); const b=(prev.match(/var BUILT='([^']+)'/)||[])[1]||'';
      if(o.on&&o.build) o.badBuild=o.build;
      if(!b||verCmp(b,window.__SHELL__||APP_BUILD)<=0){ o.on=false; saveLV(o); toast('이전 버전이 설치 버전보다 오래돼서 설치 버전으로 돌아가요'); setTimeout(()=>{reloadGame(location.pathname+'?builtin=1');},900); break; }
      const cur=await appStorage.readLive('starfall-live-html'); await appStorage.writeLive('starfall-live-html',prev); if(cur) await appStorage.writeLive('starfall-live-prev',cur);
      Object.assign(o,{on:true,prevBuild:o.build,build:b,boots:0,sha:''}); saveLV(o); reloadGame(); break; }
case 'upbuiltin': { const o=LV(); if(o.on&&o.build) o.badBuild=o.build; o.on=false; saveLV(o); reloadGame(location.pathname+'?builtin=1'); break; }
  }
}

async function handleCharactersAction(a,t,id,p,e){
  switch(a){
case 'csframe': { const p2=P(); p2.csFull=!p2.csFull; mark('prog'); const a2=$('.cs-art'); if(a2){ a2.classList.toggle('up',!p2.csFull); const cc=charById(a2.dataset.id); if(cc) a2.innerHTML=characterDetailArt(cc,!p2.csFull); } t.textContent=p2.csFull?'상반신':'전신'; break; }
case 'cspoke': { const c=charById(id); if(!c) break; const o=own(c.id), lv=o?affLv(o):1, x=e.clientX||innerWidth/2, y=e.clientY||innerHeight/2, r=t.getBoundingClientRect(), zone=(y-r.top)/r.height<0.3?'head':'body';
      ripple(x,y,lv>=7); if(o&&lv>=5&&zone==='head') hearts(x,y,Math.min(5,lv-3)); charReact(t.querySelector('.art'),lv,zone); faceSwap(c,t.querySelector('.art'),touchFace(c,zone,lv));
      const pool=spoilFree(c,o?(zone==='head'&&c.touch?.head?.length?c.touch.head:zone==='body'&&c.touch?.body?.length?c.touch.body:affLinePool(c)):c.lines); const sy=$('#csSay'), l=pickTouchLine(pool,sy?.textContent);
      if(l&&sy){ sy.textContent=sub(l); sy.hidden=false; sy.classList.remove('pop'); void sy.offsetWidth; sy.classList.add('pop'); clearTimeout(window._csT); window._csT=setTimeout(()=>{if(sy.isConnected)sy.hidden=true;},3200); if(c.voiceId&&SND().voiceLobby) speak(c,l); }
      if(o){ addAff(c,1); mark('prog'); } break; }
case 'cstab': { CS_TAB=t.dataset.k; document.querySelectorAll('.cs-tabs button').forEach(b=>b.classList.toggle('on',b.dataset.k===CS_TAB)); document.querySelectorAll('[data-cs]').forEach(s=>s.hidden=s.dataset.cs!==CS_TAB); break; }
case 'upgen': { const c=charById(id); if(!c) break; if(!String(c.naiPrompt||'').trim()){toast('먼저 설정 편집에서 NAI 스탠딩 프롬프트를 채워 주세요');break;} if(!imgReady()){toast(imgNeed());break;} t.disabled=true; t.textContent='그리는 중…';
      try{ const b=await naiDrawItem({k:'upper',o:c.upper,c,generationMode:'manual'}); await storeImage(c.upper,b,''); mark('c:'+c.id); toast('상반신을 그렸어요'); openChar(c.id); }catch(err){ toast(naiErr(err,'상반신 실패')); t.disabled=false; t.textContent='NAI로 상반신'; } break; }
case 'gift': openGift(id); break;
case 'giftgive': { const c=charById(id), g=giftById(t.dataset.v), inv=GI(); if(!c||!g||!(inv[g[0]]>0)) break; if(affFull(own(c.id))){ toast(`${c.name}의 호감도가 이미 가득 찼어요. 선물은 아껴 두세요`); break; } inv[g[0]]--; const like=giftLikes(c).has(g[0]), val=g[3]*(like?2:1);
      p.giftSeen=p.giftSeen||{}; (p.giftSeen[c.id]=p.giftSeen[c.id]||{})[g[0]]=like?2:1; addAff(c,val); mark('prog'); sfx(like?'SSR':'확인');
      const line=like?rand((c.affLines&&Object.values(c.affLines).flat().length?Object.values(c.affLines).flat():c.lines)):rand(c.lines); if(line) linePop(c,line,like?'웃음':'');
      if(like) hearts(innerWidth/2,innerHeight/2,4); toast(`${g[1]} → ${c.name} 호감도 +${val}${like?' (정말 좋아해요!)':''}`); openGift(id); break; }
case 'ainai': { const r=await aiJSON(`${RULES}\n세계관: ${G.world.name} — ${G.world.summary}\n캐릭터: ${$('#f_name').value}${$('#f_fac')&&$('#f_fac').value.trim()?' (소속: '+$('#f_fac').value.trim()+')':''}, ${$('#f_elem').value}속성 ${ROLE[$('#f_role').value]}. ${$('#f_prof').value}\n이 캐릭터의 스탠딩 일러스트용 프롬프트를 써라. ${NAI_CHAR}\nJSON만 출력: {"naiPrompt":"..."}`,t,'quick');
      if(r&&r.naiPrompt&&$('#f_nai')) $('#f_nai').value=allyTags(String(r.naiPrompt)); break; }
case 'ailines': { const r=await aiJSON(`${RULES}\n${ctx()}\n\n캐릭터: ${$('#f_name').value}. 소속: ${$('#f_fac').value}. 프로필: ${$('#f_prof').value}\n이 캐릭터의 게임 대사를 써라. 각 대사는 한두 문장, 말투를 일관되게. 로비·터치·호감도 대사에는 다른 인물의 이름이나 메인 스토리의 반전·적대 관계를 쓰지 않는다(아직 만나지 않았을 수 있다).\nJSON만 출력: {"lines":["로비 인사 대사 8개(상황을 다양하게)"],"affLines":{"4":["호감도 4부터"],"7":["호감도 7부터"],"10":["호감도 10"]},"lvLines":["${T('enhance')} 시 2개"],"dupLines":["${T('limit')} 시 1개"],"head":["머리 터치 5개"],"body":["몸 터치 시 당황하거나 놀리는 반응 5개"],"intro":"${T('gacha')} 첫마디"}`,t);
      if(r&&$('#f_lines')){ $('#f_lines').value=strs(r.lines).join('\n'); $('#f_aff').value=Object.entries(r.affLines||{}).flatMap(([k,v])=>strs(v).map(x=>k+': '+x)).join('\n'); $('#f_lv').value=strs(r.lvLines).join('\n'); $('#f_dup').value=strs(r.dupLines).join('\n'); $('#f_head').value=strs(r.head).join('\n'); $('#f_body').value=strs(r.body).join('\n'); if(r.intro)$('#f_intro').value=String(r.intro); toast('대사를 채웠어요. 확인 후 저장하세요.'); } break; }
case 'ailinesmore': { const cur=k=>lines($('#'+k).value), L0=cur('f_lines'), H0=cur('f_head'), B0=cur('f_body');
      const r=await aiJSON(`${RULES}\n캐릭터: ${$('#f_name').value}. 소속: ${$('#f_fac').value}. 프로필: ${$('#f_prof').value}\n지금 있는 대사(말투를 그대로 따르고, 내용이 겹치지 않게 새 상황으로 쓴다):\n로비: ${L0.join(' / ')}\n머리 터치: ${H0.join(' / ')}\n몸 터치: ${B0.join(' / ')}\n대사를 더 써라. 각 대사는 한두 문장. 다른 인물의 이름이나 메인 스토리의 반전·적대 관계는 쓰지 않는다.\nJSON만 출력: {"lines":["새 로비 인사 대사 ${Math.max(2,8-L0.length)}~${Math.max(4,10-L0.length)}개"],"head":["새 머리 터치 반응 ${Math.max(2,5-H0.length)}개"],"body":["새 몸 터치 반응 ${Math.max(2,5-B0.length)}개"]}`,t,'quick');
      if(r&&$('#f_lines')){ const add=(k,a,old)=>{ const nw=strs(a).filter(x=>!old.includes(x)); $('#'+k).value=[...old,...nw].join('\n'); return nw.length; }; const n=add('f_lines',r.lines,L0)+add('f_head',r.head,H0)+add('f_body',r.body,B0); toast(`대사 ${n}개를 더했어요. 확인 후 저장하세요.`); } break; }
case 'upsave': { const o=LV(), md=$('#up_mode').value; Object.assign(o,{repo:$('#up_repo').value.trim().replace(/^https?:\/\/github\.com\//,'').replace(/\.git$/,'').replace(/\/$/,''),branch:$('#up_br').value.trim()||'main',path:$('#up_path').value.trim()||'www/index.html',token:$('#up_tok').value.trim(),auto:md!=='off',mode:md==='off'?'ask':md}); saveLV(o); closeModal(); if(o.auto) checkUpdate(true); else toast('업데이트 확인을 껐어요'); break; }
case 'upgo': {if(appStorage.failed||document.getElementById('save-warning'))break; const c=charById(id), k=t.dataset.k; if(!c) break; if(k==='enh') enhance(c); else if(k==='enhmax') enhance(c,true); else if(k==='lb') limitBreak(c); else if(k==='wup') weaponUp(c); else if(k==='transc') transcendUp(c); try{await flush();}catch(e){break;} openChar(id); render(); break; }
case 'wpai': case 'wai': { const c=charById(id); if(!c) break; const ed=a==='wai';
      const nm=(ed&&$('#f_wn')&&$('#f_wn').value.trim())||String(c.weapon.name||''), ds=(ed&&$('#f_wd')&&$('#f_wd').value.trim())||String(c.weapon.desc||''), cur=(ed?($('#f_wp')&&$('#f_wp').value.trim()):($('#wp_scene')&&$('#wp_scene').value.trim()))||String(c.weapon.prompt||'');
      const p2=await weaponPromptAI([{c,name:nm,desc:ds,cur}],t); if(!p2[0]){ toast('쓰지 못했어요. AI 기록을 확인해 주세요'); break; }
      if(ed){ if($('#f_wp')) $('#f_wp').value=p2[0]; toast(T('weapon')+' 프롬프트를 썼어요. 저장을 눌러 주세요'); } else { c.weapon.prompt=p2[0]; mark('c:'+c.id); const inp=$('#wp_scene'); if(inp) inp.value=p2[0]; toast(T('weapon')+' 프롬프트를 썼어요'); } break; }
case 'wfixall': { const wb=G.chars.filter(c=>c.weapon&&wpBad(c.weapon.prompt)); if(!wb.length){ toast('정리할 '+T('weapon')+' 프롬프트가 없어요'); break; } const lb=t.textContent; t.disabled=true; t.textContent='AI로 정리하는 중…';
      try{ const n=await fixWeaponPrompts(G.chars); toast(n>0?`${T('weapon')} 프롬프트 ${n}개를 ${T('weapon')}만 나오게 정리했어요`:'정리하지 못했어요. AI 기록을 확인해 주세요'); }finally{ if(t.isConnected){ t.disabled=false; t.textContent=lb; } } openPrep(false); break; }
case 'regengo': { const c=charById(id); if(!c) break; const sel={}, reqs={}; document.querySelectorAll('#modal [data-rgsel]').forEach(ch=>{ if(ch.checked) sel[ch.dataset.rgsel]=true; }); document.querySelectorAll('#modal [data-rgreqi]').forEach(i=>{ const v=i.value.trim(); if(v) reqs[i.dataset.rgreqi]=v; });
      if(!Object.keys(sel).length){ toast('바꿀 항목을 하나 이상 켜 주세요'); break; } await regenRun(c,sel,reqs,($('#rg_all')&&$('#rg_all').value.trim())||'',$('#rg_skill_slot')?.value||'active'); break; }
case 'regenapply': await regenApply(); break;
case 'regenretry': { const R=REGEN; if(!R) break; REGEN=null; const c=charById(R.cid); if(c) await regenRun(c,R.sel,R.reqs,R.global,R.slot); break; }
case 'regenedit': if(REGEN&&!REGEN.busy){try{regenReadPreview(REGEN);REGEN.edit=!REGEN.edit;regenPreview();}catch(e){toast(e.message);}} break;
case 'regencancel': { const cid=REGEN?.cid||REGEN_JOB?.cid||id;if(!regenCancel())break;closeModal();if(cid&&charById(cid))openChar(cid);break; }
case 'ailooksall': { const list=G.lib.filter(l=>l.kind==='enemy'&&!l.alias&&!l.charId); if(!list.length){toast('적이 없어요');break;} if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); break; }
      if(!(await appConfirm(`적 ${list.length}종의 외형 프롬프트를 지금 세계관에 맞게 전부 다시 쓸까요? 지금 프롬프트는 덮어써요(그림은 그대로라 다시 그려야 바뀌어요).`))) break;
      const r=await aiJSON(`세계관: ${G.world.name} — ${G.world.summary}\n${String(G.world.lore||'').slice(0,2500)}\n아래 적들의 NovelAI 외형 프롬프트를 영어 태그로 새로 써라. 괴물이나 기계면 "no humans"로, 사람형 적이면 "1other, faceless"로 시작한다. 생김새, 재질, 색, 빛, 무기, 위압감만 쓰고 자세·배경·화풍은 쓰지 않는다. 이 세계관에 어울리지 않는 디자인은 쓰지 않고, 같은 계열 적은 디자인을 통일한다.\n적: ${list.map(l=>l.name).join(', ')}\nJSON만 출력: {"looks":{"적 이름":"태그"}}`,t);
      let n=0; if(r&&r.looks) list.forEach(l=>{const v=r.looks[l.name]; if(v){l.prompt=String(v); mark('l:'+l.id); n++;}}); toast(`적 ${n}종의 외형을 세계관에 맞게 다시 썼어요. 다시 그리면 바뀌어요`); openLib('enemy'); break; }
case 'ailooks': { const list=G.lib.filter(l=>l.kind==='enemy'&&!l.prompt); if(!list.length){toast('외형이 빈 적이 없어요');break;}
      const r=await aiJSON(`세계관: ${G.world.summary}\n${G.world.lore}\n아래 적들의 NovelAI 외형 프롬프트를 영어 태그로 써라. 괴물이나 기계면 "no humans"로, 사람형 적이면 "1other, faceless"로 시작한다. 생김새, 재질, 색, 빛, 무기, 위압감만 쓰고 자세·배경·화풍은 쓰지 않는다. 같은 계열 적은 디자인을 통일한다.\n적: ${list.map(l=>l.name).join(', ')}\nJSON만 출력: {"looks":{"적 이름":"태그"}}`,t);
      let n=0; if(r&&r.looks) list.forEach(l=>{const v=r.looks[l.name]; if(v){l.prompt=String(v); mark('l:'+l.id); n++;}}); toast(`적 ${n}종의 외형을 채웠어요`); openLib('enemy'); break; }
  }
}

async function handleImagesAndAssetsAction(a,t,id,p,e){
  switch(a){
case 'castre': { if(!CAST) break; const k=t.dataset.k; if(!CAST.q.some(x=>x.c===id&&x.k===k)&&!(CAST.busy&&CAST.busy.c===id&&CAST.busy.k===k)) CAST.q.push({c:id,k}); castRefresh(id); castRun(); break; }
case 'castfaces': openCastFaces(); break;
case 'cfsel': { const set=t.dataset.k==='f'?CFSEL.faces:CFSEL.chars, v=t.dataset.v; set.has(v)?set.delete(v):set.add(v); t.classList.toggle('on',set.has(v)); break; }
case 'cfgo': castFacesGo(); break;
case 'cfall': { const on=t.dataset.v==='1'; castChars().filter(c=>!c.npc&&imgSrc(c)).forEach(c=>on?CFSEL.chars.add(c.id):CFSEL.chars.delete(c.id)); document.querySelectorAll('#modal [data-act="cfsel"][data-k="c"]').forEach(b=>b.classList.toggle('on',on)); break; }
case 'castface': { if(CAST&&CAST.busy){ toast('그리는 중이 끝나면 열 수 있어요'); break; } FACET={cid:id,sid:''}; openFaces(id); break; }
case 'castok': case 'castskip': { if(a==='castok'&&CAST&&(CAST.busy||CAST.q.length)&&!(await appConfirm('아직 그리는 그림이 있어요. 나머지는 게임하면서 그릴까요?'))) break; P().castDone=1; mark('prog'); if(CAST) CAST.q=[];
      const go=()=>{ if(CAST&&CAST.busy){ const st=$('#castStat'); if(st) st.textContent='지금 그리는 한 장만 마치고 넘어가요…'; return setTimeout(go,500); } CAST=null; showStart(); }; go(); break; }
case 'imgsave': { const c=charById(id), it=c&&charImgList(c).find(([o])=>o.id===t.dataset.o); if(it) saveImgUrl(imgSrcRaw(it[0]),c.name+'_'+it[1]); break; }
case 'posegen': { const c=charById(id); if(!c||!c.pose||!c.lbbg) break; if(!imgReady()){ toast(imgNeed()); break; } const w=t.dataset.w||'both'; if(w!=='bg'&&!c.naiPrompt){ toast('먼저 NAI 프롬프트를 채워 주세요'); break; }
      const sc=$('#lbbg_scene'); if(sc){ c.lbbg.prompt=sc.value.trim();naiBlocksSave(c.lbbg,'prompt',sc); mark('c:'+c.id); } const label=t.textContent; t.disabled=true; t.textContent='그리는 중…';
      try{ if(w!=='pose'){ toast('배경을 그리는 중이에요'); const b=await naiDrawItem({k:'lbbg',o:c.lbbg,c,generationMode:'manual'}); await storeImage(c.lbbg,b,''); }
        if(w!=='bg'){ toast('투명 포즈를 그리는 중이에요'); const b=await naiDrawItem({k:'pose',o:c.pose,c,generationMode:'manual'}); await storeImage(c.pose,b,''); }
        mark('c:'+c.id); if(P().lobbyMode==='stand'){ P().lobbyMode='auto'; mark('prog'); toast('로비 표시를 \'자동\'으로 바꿨어요(레이어가 먼저 나와요)'); } else toast('로비 레이어를 그렸어요'); openChar(c.id); render(); }
      catch(err){ toast(naiErr(err,'그리기 실패')); t.disabled=false; t.textContent=label; } break; }
case 'posedel': { if(playMode())break;const c=charById(id); if(!c||!c.pose) break; if(!(await appConfirm('포즈 그림을 지우고 상반신으로 표시할까요? 배경은 유지돼요.'))) break; await imgClear(c.pose); mark('c:'+c.id); openChar(c.id); render(); break; }
case 'upload': uploadFor={kind:t.dataset.k,id}; $('#file').click(); break;
case 'imgx': { const k=t.dataset.k; let o=null, after=()=>render(), what='그림';
      if(k==='char'){ o=charById(id); what=o&&o.name+' 스탠딩'; after=()=>{ render(); openChar(id); }; }
      else if(k==='weapon'){ const c=charById(id); o=c&&c.weapon; what=c&&(c.weapon.name||T('weapon'))+' 그림'; after=()=>{ render(); openChar(id); }; }
      else if(k==='lib'){ o=libById(id); what=o&&'「'+o.name+'」 그림'; after=()=>{ render(); openLibItem(id); }; }
      else if(k==='npc'||k==='npcup'){ const n=(G.npcs||[]).find(x=>x.id===id); o=n&&(k==='npc'?n:n.upper); what=n&&n.name+(k==='npc'?' 스탠딩':' 상반신'); after=()=>npcRefresh(id); }
      else if(k==='shk'){ o=G.meta.shop&&G.meta.shop.self; what='상점 주인 그림'; after=()=>{ SHOP_LINE=''; const pv=document.querySelector('.sk-prev'); if(pv) pv.innerHTML='<span>그림 없음</span>'; render(); }; }
      else if(k==='skinpart'){ const c=charById(id), sk=c&&(c.skins||[]).find(x=>x.id===t.dataset.s), x=t.dataset.x; o=sk&&(x==='stand'?sk:skinPart(sk,x)); what=sk&&sk.name+' '+(x==='stand'?'스탠딩':(SKP[x]||'')); after=()=>{ render(); skinRefresh(id); }; }
      if(!o||!o.img) break; if(!(await appConfirm(`${what||'그림'}을(를) 지울까요? (항목은 남아요)`))) break;
      await imgClear(o); if(k==='char'){ (o.faces||[]).forEach(f=>{ if(f.img&&f.auto) imgClear(f); }); delete o.faceMask; mark('c:'+id); } else if(k==='lib') mark('l:'+id); else if(k==='skinpart'||k==='weapon') mark('c:'+id); else mark('meta');
      after(); toast('그림을 지웠어요'); break; }
case 'npcscan': { const snap=artSnap(); const n=await autoNpcs(G.chapters,t); if(n){ openNpcs(); toast(`NPC ${n}명을 추가했어요`); artAfterAI(snap,'NPC '+n+'명'); } else toast('새로 추가할 인물이 없어요(대사 3줄 이상인 조연만 찾아요)'); break; }
case 'npcopen': openNpcs(); break;
case 'npcsave': { const n=(G.npcs||[]).find(x=>x.id===id); if(!n) break; const old=npcRead(n); if(old&&old!==n.name&&old.length>=2&&(await appConfirm(`이름이 「${old}」에서 「${n.name}」(으)로 바뀌어요. 스토리·${T('talk')}에 나온 「${old}」도 모두 바꿀까요?`))){ const c=renameEverywhere(old,n.name); toast(`이름을 ${c}곳에서 바꿨어요`); } else toast('저장했어요'); npcRefresh(id); break; }
case 'npcdraw': { const n=(G.npcs||[]).find(x=>x.id===id); if(!n||NPCBUSY.has(id)) break; npcRead(n); npcDraw(n,t.dataset.k==='upper'?'upper':'char'); break; }
case 'npctags': { const n=(G.npcs||[]).find(x=>x.id===id); if(!n) break; npcRead(n); if(!String(n.look||n.profile||'').trim()){ toast('외모를 먼저 적어 주세요'); break; }
      const r=await aiJSON(`세계관: ${G.world.name} — ${String(G.world.summary||'').slice(0,400)}\n다음 NPC의 NovelAI 그림 프롬프트를 써라. 적힌 외모를 그대로 살리고, 의상은 세계관에 맞춘다. 등장인물은 모두 성인이다.\n이름: ${n.name}${n.role?' / '+n.role:''}\n외모: ${n.look||''}${n.profile?'\n설정: '+String(n.profile).slice(0,200):''}\n${NAI_CHAR}\nJSON만 출력: {"naiPrompt":""}`,t,'quick');
      if(r&&r.naiPrompt){ n.naiPrompt=allyTags(stripMinor(stripAge(String(r.naiPrompt)))); mark('meta'); npcRefresh(id); toast('태그를 썼어요. 확인하고 다시 그려 보세요'); } break; }
case 'npcdel': { const n=(G.npcs||[]).find(x=>x.id===id); if(!n||!(await appConfirm(`NPC 「${n.name}」을(를) 지울까요? 스토리에는 이름만 나와요.`))) break; G.npcs=G.npcs.filter(x=>x!==n); mark('meta'); openNpcs(); break; }
case 'npcadd': { const nm=($('#npc_new').value||'').trim(); if(!nm){ toast('이름을 적어 주세요'); break; } if(npcBy(nm)||findSpeaker(nm)){ toast('이미 있는 이름이에요'); break; } G.npcs=G.npcs||[]; G.npcs.push(npcNew(nm)); mark('meta'); openNpcs(); break; }
case 'cutclose': { stopVoice(); t.remove(); const f=GC&&GC.cutCb; if(GC) GC.cutCb=null; f&&f(); break; }
case 'lib': openLib(t.dataset.k); break;
case 'libitem': openLibItem(id); break;
case 'libnew': openLibItem(null,t.dataset.k); break;
case 'castt': t.classList.toggle('on'); break;
case 'naiopen': openNaiSet(); break;
case 'naivariety': { const on=t.getAttribute('aria-checked')!=='true';t.setAttribute('aria-checked',String(on));break; }
case 'naipreset': applyStylePreset(t.dataset.v); break;
case 'packopen': openModal(packHTML()); break;
case 'packuse': { const p=allPresets().concat(userPacks()).find(x=>x.id===t.dataset.v); if(!p) break; packApply(p); toast(`「${p.name}」 그림체를 적용했어요`); openModal(packHTML()); break; }
case 'packdel': { const a=userPacks(), p=a.find(x=>x.id===t.dataset.v); if(!p||!(await appConfirm(`「${p.name}」 프리셋을 지울까요?`))) break; saveUserPacks(a.filter(x=>x!==p)); openModal(packHTML()); break; }
case 'packcopy': { const p=userPacks().find(x=>x.id===t.dataset.v); if(!p) break; const code=packCode(Object.assign({},p,{id:undefined})); try{ await navigator.clipboard.writeText(code); toast('프리셋 코드를 복사했어요. 붙여 넣어 공유하세요'); }catch(e){ if(t.isConnected)openPresetCode('pack',code); } break; }
case 'packimport': openPresetCode('pack'); break;
case 'packsave': { const nm=prompt('프리셋 이름'); if(!nm) break; const by=prompt('만든 사람 (선택, 공유할 때 표시돼요)')||''; const c=naiCfg(), st=(c.styles||[]).find(x=>x.id===c.styleId)||(c.styles||[])[0]||{}, L=llmSlots();
      const p={id:'u'+uid(),name:nm.trim().slice(0,30),by:by.trim().slice(0,20),desc:'내가 만든 팩',tags:joinTags(st.tags,c.quality?c.qtags:''),neg:st.neg||'',qtags:'',steps:c.steps,scale:c.scale,cfgRescale:c.cfgRescale,sampler:c.sampler};
      const a=userPacks(); a.unshift(p); if(saveUserPacks(a)) toast('프리셋으로 저장했어요. 내보내기로 코드를 공유할 수 있어요'); openModal(packHTML()); break; }
case 'naisave': appStorage.setItem(NKEY,JSON.stringify(readNai())); closeModal(); render(); toast('그림 AI 설정을 저장했어요'); break;
case 'cfload': { const inp=document.createElement('input'); inp.type='file'; inp.accept='.json,application/json'; inp.onchange=async()=>{ const f=inp.files[0]; if(!f) return; const tx=await f.text(); const box=$('#cf_wf')||$('#sw_cfwf'); if(box) box.value=tx; try{ const j=JSON.parse(tx); toast(Array.isArray(j.nodes)?'UI 형식이에요. Export (API)로 저장한 파일을 넣어 주세요':'워크플로를 불러왔어요 (노드 '+Object.keys(j).length+'개)'); }catch(e){ toast('JSON 파일이 아니에요'); } }; inp.click(); break; }
case 'cftest': { const u=(($('#cf_url')||$('#sw_cfurl'))||{}).value; if(!u){toast('주소를 넣어 주세요');break;} t.disabled=true;
      try{ const r=await http(u.trim().replace(/\/+$/,'')+'/system_stats',{timeout:10000}); const j=okJSON(r); const d=(j.devices||[])[0]; toast('ComfyUI 연결 성공'+(d?' · '+String(d.name||'').slice(0,40):'')); const rs=$('#sw_res'); if(rs) rs.textContent='✓ 연결됨'; }
      catch(e){ toast('연결 실패. PC에서 --listen으로 켰는지, 주소와 와이파이를 확인해 주세요'); const rs=$('#sw_res'); if(rs) rs.textContent='✗ 연결 실패'; } finally{ t.disabled=false; } break; }
case 'naitest': { const c=readNai(); if(!c.key){toast('토큰을 넣어 주세요');break;} t.disabled=true;
      try{ const r=await http(naiBase(c)+'/user/subscription',{headers:NAI_HDR(c.key),timeout:20000}); const j=okJSON(r); const sl=j.trainingStepsLeft||{}; const an=(sl.fixedTrainingStepsLeft||0)+(sl.purchasedTrainingSteps||0);
        toast(`연결 성공. ${['Paper','Tablet','Scroll','Opus'][j.tier]||'구독'} · Anlas ${an}`); }catch(e){ toast(naiErr(e,'연결 확인 실패')); } finally{ t.disabled=false; } break; }
case 'naiall': await naiAll(t); break;
case 'skinuse': {const c=charById(id),o=own(id);if(!c||!o)break;const sk=t.dataset.s;if(sk){const k=(c.skins||[]).find(x=>x.id===sk);if(!k)break;if(!skinHave(k)){toast(`캐시 상점의 ${T('skin')} 패키지에서 살 수 있어요`);break;}
 if(!skinDisplayReady(c,k)){if(SKJOB?.skinId===k.id){toast('이 스킨의 그림을 준비 중이에요. 완료 후 입혀 주세요');break;}if(c.useStanding!==false||!k.prompt||!imgReady()){toast(c.useStanding===false?'이 스킨의 상반신 그림이 필요해요. 스킨 편집에서 상반신을 넣거나 그림 AI를 연결해 주세요.':'아직 그려지지 않은 스킨이에요');break;}
 if(!(await appConfirm('이 스킨은 상반신 그림이 없어 기본 모습으로 표시되고 있어요. 그림 AI로 스킨 상반신을 생성한 뒤 입힐까요? 이미지 생성 비용이 발생할 수 있어요.')))break;
 const game=G,project=PJ().active;t.disabled=true;try{const blob=await skinPartDraw(c,k,'upper','manual');if(G!==game||PJ().active!==project||charById(id)!==c||!c.skins.includes(k))throw Error('대상이 바뀌어 스킨 적용을 중단했습니다');await storeImage(skinPart(k,'upper'),blob,'');mark('c:'+id);}catch(err){toast(naiErr(err));break;}finally{if(t.isConnected)t.disabled=false;}
 }}o.skin=sk;mark('prog');openChar(id);render();break;}

case 'faceview': { const c=charById(id), f=c.faces.find(x=>x.id===t.dataset.f); openModal(`${head(esc(c.name)+' · '+esc(f.name))}<div class="naiprev char done">${imgSrc(f)?`<img src="${esc(imgSrc(f))}" alt="">`:''}</div><div class="row" style="margin-top:12px"><button class="btn ghost" data-act="facedel" data-id="${id}" data-f="${f.id}">삭제</button><button class="btn" data-act="char" data-id="${id}">돌아가기</button></div>`); break; }
case 'faces-open': FACESEL=new Set(); openFaces(id,t.dataset.s||''); break;
case 'facesel': { const v=t.dataset.v; FACESEL.has(v)?FACESEL.delete(v):FACESEL.add(v); t.classList.toggle('on'); break; }
case 'faceup': uploadFor={kind:'face',id,name:t.dataset.v,b:t.dataset.b||''}; $('#file').click(); break;
case 'faceupnew': { const nm=($('#fc_new').value||'').trim().slice(0,12); if(!nm){toast('표정 이름을 적어 주세요');break;} uploadFor={kind:'face',id,name:nm}; $('#file').click(); break; }
case 'faceupmany': uploadFor={kind:'faces',id}; $('#filesm').click(); break;
case 'facedel': { const c=charById(id); if(!c) break; if(t.dataset.f){ c.faces=c.faces.filter(x=>x.id!==t.dataset.f); mark('c:'+id); openChar(id); break; } const F=faceTgt(c); F.faces=F.faces.filter(f=>f.name!==t.dataset.v); mark('c:'+c.id); openFaces(id); break; }
case 'facetgt': openFaces(id,t.dataset.s||''); break;
case 'facebasic': FACE_BASIC.forEach(v=>FACESEL.add(v)); document.querySelectorAll('[data-act=facesel]').forEach(b=>b.classList.toggle('on',FACESEL.has(b.dataset.v))); break;
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
      t.disabled=true; let n=0; const tot=list.length*bodies.length;
      for(const ko of list){
        let f=F.faces.find(q=>q.name===ko); if(!f){ f={id:'f'+uid(),name:ko,img:null}; F.faces.push(f); }
        for(const b of bodies){ const st=$('#fc_stat'); if(st) st.textContent=`${n}/${tot} · ${ko} (${b==='up'?'상반신':'전신'}) 그리는 중…`;
          try{ await faceDrawOne(c,F,f,ko,b,O,x,tot===1?'manual':'batch'); n++; }
          catch(err){ toast(naiErr(err)); t.disabled=false; openFaces(id); return; } } }
      toast(`표정 그림 ${n}장을 만들었어요`); openFaces(id); break; }
case 'skinpromptsave': {const c=charById(id),k=c?.skins?.find(k=>k.id===t.dataset.s);if(k){naiBlocksSave(k,'prompt','skin_prompt_'+k.id);mark('c:'+c.id);toast('프롬프트를 저장했어요. 이후 생성부터 적용돼요.');}break;}
case 'skin-open': openSkin(id); break;
case 'skinlines': { const c=charById(id), k=c&&(c.skins||[]).find(x=>x.id===t.dataset.s); if(!k) break; if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); break; }
      const r=await aiJSON(`${RULES}\n${ctx()}\n\n${T('crew')} 「${c.name}」이(가) 「${k.name}」 ${T('skin')}(의상: ${String(k.idea||k.prompt||'').slice(0,200)})을(를) 입었을 때 로비에서 하는 대사를 써라. 성격·말투는 그대로(말투 예: ${(c.lines||[]).slice(0,3).map(x=>'"'+x+'"').join(' / ')}), 이 옷을 입은 상황과 기분이 드러나게. 한 줄 40자 이내.\nJSON만 출력: {"lines":["대사 6개"],"intro":"이 ${T('skin')}을 처음 입었을 때 한마디"}`,t,'quick');
      if(r&&Array.isArray(r.lines)){ k.lines=r.lines.map(x=>String(x||'').trim()).filter(Boolean).slice(0,8); if(r.intro) k.intro=String(r.intro).slice(0,120); mark('c:'+c.id); toast(`「${k.name}」 대사 ${k.lines.length}개를 썼어요`); skinRefresh(id); } break; }
case 'skpartgen': { const c=charById(id), k=c&&(c.skins||[]).find(x=>x.id===t.dataset.s); if(k) skinPartGen(c,k,[t.dataset.x],t); break; }
case 'skpartall': { const c=charById(id), k=c&&(c.skins||[]).find(x=>x.id===t.dataset.s); if(!k) break; const xs=['stand','upper','illust','lbcg'].filter(x=>!imgSrcRaw(x==='stand'?k:k[x])); if(!xs.length){ toast('네 칸 모두 그림이 있어요'); break; } skinPartGen(c,k,xs,t,'batch'); break; }
case 'skpartup': uploadFor={kind:'skinpart',id,s:t.dataset.s,x:t.dataset.x}; $('#file').click(); break;
case 'skingo': { const c=charById(id), pr=$('#sk_prompt').value.trim(), nm=$('#sk_name').value.trim()||'새 '+T('skin'); if(!pr){toast('프롬프트를 채워 주세요');break;} if(!imgReady()){toast(imgNeed());break;}
      if(SKPROP&&SKPROP.url) URL.revokeObjectURL(SKPROP.url);
      SKPROP={cid:id,name:nm,prompt:pr,naiBlocks:{prompt:naiBlocksFieldParts('sk_prompt')},idea:$('#sk_idea').value.trim(),pose:$('#sk_pose')?$('#sk_pose').value:'',ref:{on:!!(imgSrc(c)&&$('#sk_ref')&&$('#sk_ref').checked),style:$('#sk_style').value==='1',str:+$('#sk_str').value,fid:+$('#sk_fid').value},blob:null,url:null};
      skinPropDraw(t); break; }
case 'skindel': { const c=charById(id); c.skins=c.skins.filter(k=>k.id!==t.dataset.s); Object.values(P().owned).forEach(o=>{if(o.skin===t.dataset.s)o.skin='';}); mark('c:'+id,'prog'); skinRefresh(id); break; }
case 'wnai': { const c=charById(id); if(!c) break; const pr=($('#f_wp')?$('#f_wp').value:'').trim(); if(pr&&pr!==String(c.weapon.prompt||'')){ c.weapon.prompt=pr; mark('c:'+id); } if(!String(c.weapon.prompt||'').trim()){toast(T('weapon')+' 프롬프트를 채워 주세요');break;} openNaiPrep('weapon',id); break; }
case 'wgen': { const c=charById(id); if(!c) break; const sc=$('#wp_scene'); if(sc&&sc.value.trim()!==String(c.weapon.prompt||'')){ c.weapon.prompt=sc.value.trim();naiBlocksSave(c.weapon,'prompt',sc); mark('c:'+c.id); } if(!String(c.weapon.prompt||'').trim()){toast(T('weapon')+' 프롬프트를 채워 주세요');break;} openNaiPrep('weapon',id); break; }
case 'imglib': openImgLib(id); break;
case 'ilbtap': { if(!IMGLIB) break; const i=+t.dataset.i, its=charImgItems(charById(IMGLIB.cid)), it=its[i]; if(!it) break; const k=IMGLIB.sel.indexOf(i); if(k>=0) IMGLIB.sel.splice(k,1); else { IMGLIB.sel.push(i); if(IMGLIB.sel.length>2) IMGLIB.sel.shift(); }
      if(IMGLIB.sel.length===1&&k<0&&imgSrcRaw(it.o))imgViewer(imgSrcRaw(it.o)); openImgLib(IMGLIB.cid); break; }
case 'ilbclear': if(IMGLIB){ IMGLIB.sel=[]; openImgLib(IMGLIB.cid); } break;
case 'ilbdel': { if(!IMGLIB) break; const c=charById(IMGLIB.cid), it=charImgItems(c).find(x=>x.o.id===t.dataset.imageId); if(!it||!it.o.img||!(await appConfirm(`${it.label} 그림을 지울까요? (항목은 남아요)`))) break; await imgClear(it.o); if(it.k==='stand') delete c.faceMask; IMGLIB.sel=[]; mark('c:'+c.id); render(); openImgLib(c.id); toast('그림을 지웠어요'); break; }
case 'bgmall': openBgmAll(); break;
case 'bgmpick': t.classList.toggle('on'); break;
case 'bgmpickall': { const v=t.dataset.v; document.querySelectorAll('#modal [data-act="bgmpick"]').forEach(b=>{ const l=libById(b.dataset.id); b.classList.toggle('on',v==='all'||(v==='miss'&&l&&!l.audio)); }); break; }
case 'bgmallgo': bgmAllGo([...document.querySelectorAll('#modal [data-act="bgmpick"].on')].map(b=>b.dataset.id)); break;
case 'bgmplay': { const l=libById(id); if(l) bgm(l.name,true); break; }
case 'bgmstop': bgmFade(0,()=>{BGM.el.pause();BGM.name=null;}); break;
case 'aupload': uploadAudioFor=id; $('#afile').click(); break;
case 'naigen': openNaiPrep(t.dataset.k,id); break;
case 'cutopen': openCut(t.dataset.k,id); break;
case 'cutrun': { const j=CUTJOB; if(!j||!j.orig) break; t.disabled=true; const o={tol:+$('#ct_tol').value,soft:+$('#ct_soft').value,holes:$('#ct_holes').checked,despeck:$('#ct_spk').checked,shadow:$('#ct_shadow').checked};
      try{ const src=await new Promise(r=>j.orig.toBlob(r,'image/png')); const b2=await cutoutWhite(src,o); await cutLoadBlob(b2); j.opt=o; toast('자동으로 지웠어요. 남은 곳은 스포이드나 브러시로 마무리하세요'); }
      catch(e){ toast('배경을 지우지 못했어요'); } if(t.isConnected) t.disabled=false; break; }
case 'cutnai': { const j=CUTJOB; if(!j) break; if(!(await appConfirm('NovelAI 배경 제거는 Anlas를 써요 (생성 한 장의 약 3배). 진행할까요?'))) break;
      const lb=t.textContent; t.disabled=true; t.textContent='NovelAI가 배경을 지우는 중…';
      try{ const b2=await naiBgRemove(j.src); await cutLoadBlob(b2); j.opt=null; }
      catch(e){ toast(naiErr(e,'배경 제거 실패')); } if(t.isConnected){t.disabled=false;t.textContent=lb;} break; }
case 'cutzoom': { const j=CUTJOB; if(!j||!j.cv) break; const view=$('#cutPrev'), i=(CUT_ZOOMS.indexOf(j.zoom)+1)%CUT_ZOOMS.length, z=CUT_ZOOMS[i];
      const fx=j.cx>=0?j.cx/j.W:.5, fy=j.cy>=0?j.cy/j.H:.5; j.zoom=z; view.classList.toggle('zoom',z>1); j.cv.style.width=z>1?(z*100)+'%':''; t.textContent='확대 ×'+z; t.classList.toggle('on',z>1);
      requestAnimationFrame(()=>{ if(z>1){ view.scrollLeft=j.cv.offsetWidth*fx-view.clientWidth/2; view.scrollTop=j.cv.offsetHeight*fy-view.clientHeight/2; } cutPlaceCursor(); cutDrawLoupe(); }); break; }
case 'cutundo': { const j=CUTJOB; if(!j||!j.undo.length) break; cutCtx().putImageData(j.undo.pop(),0,0); $('#ct_undo').disabled=!j.undo.length; cutDrawLoupe(); break; }
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
case 'styopen': { const back=t.dataset.back||'';
      if(back==='prep'&&NPREP&&$('#np_in')) NPREP.draft=Object.fromEntries(['np_in','np_neg','np_seed','np_model','np_size','np_frame','np_pose','np_posesel'].filter(k=>$('#'+k)).map(k=>[k,$('#'+k).value]));
      else if($('#nai_key')){ appStorage.setItem(NKEY,JSON.stringify(readNai())); toast('지금까지 바꾼 그림 AI 설정을 저장했어요'); }
      openStyles(back); break; }
case 'styadd': { const x={id:'s'+uid(),name:'새 화풍',tags:'',neg:''}; $('#styList').insertAdjacentHTML('beforeend',styRow(x)); $('#sty_def').insertAdjacentHTML('beforeend',`<option value="${x.id}">새 화풍</option>`); const rows=document.querySelectorAll('#styList .styrow'); toast('새 화풍 항목을 목록 아래에 추가했어요'); break; }
case 'stydel': { const r=t.closest('.styrow'); if(!r) break; if(document.querySelectorAll('#styList .styrow').length<=1){toast('프리셋은 하나 이상 있어야 해요');break;} const o2=$('#sty_def').querySelector(`option[value="${r.dataset.sid}"]`); if(o2) o2.remove(); r.remove(); break; }
case 'stysave': { const st=readStyles(); let sv={}; try{sv=JSON.parse(appStorage.getItem(NKEY))||{};}catch(err){} sv.styles=st; const d=$('#sty_def').value; sv.styleId=st.some(x=>x.id===d)?d:st[0].id; sv.seeded=['am_v5']; appStorage.setItem(NKEY,JSON.stringify(sv)); toast('화풍 프리셋을 저장했어요');
      if(STYBACK==='prep'&&NPREP){ const dr=NPREP.draft; openNaiPrep(NPREP.kind,NPREP.id); if(dr) Object.entries(dr).forEach(([k,v])=>{ const el=$('#'+k); if(el) el.value=v; }); } else openNaiSet(); break; }
case 'skinbuy': openSkinBuy(id); break;
case 'skinpkgdel': { const f=skinShopList().find(x=>x.k.id===id); if(!f) break; if((P().skinOwn||{})[id]){ toast('이미 산 '+T('skin')+'은 대원 화면에서 지워 주세요'); break; }
      if(!(await appConfirm(`${f.c.name} 「${f.k.name}」 패키지를 지울까요? 대원 화면의 🔒 ${T('skin')}도 함께 사라져요`))) break;
      f.c.skins=f.c.skins.filter(k=>k.id!==id); Object.values(P().owned).forEach(o=>{ if(o.skin===id) o.skin=''; }); const L=P().live; if(Array.isArray(L.skinRecent)&&!f.c.skins.some(k=>k.shop)) L.skinRecent=L.skinRecent.filter(x=>x!==f.c.id);
      mark('c:'+f.c.id,'prog'); if(!$('#modal').hidden) closeModal(); render(); toast(`「${f.k.name}」 패키지를 지웠어요`); break; }
case 'skinnew': { if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); break; } t.disabled=true; const n=[]; let made=null; try{ made=await skinAuto(n); }finally{ liveBar(null); } toast(n[0]||'만들지 못했어요. AI 기록을 확인해 주세요'); render(); if(made&&made.k) openSkinBuy(made.k.id); break; }
  }
}

async function handleEconomyAction(a,t,id,p,e){
  switch(a){
case 'daily': if(p.daily!==today()){p.daily=today(); const dr=rateR({gems:120,gold:5000,exp:10,gift:2}); giveReward(dr);render();sfx('확인');toast(`일일 보급: ${rewardText(dr)}`);} break;
case 'shkdraw': { const m=G.meta.shop, o=shkSelf(); o.naiPrompt=stripMinor(stripAge($('#sk_prompt').value.trim())); naiBlocksSave(o,'naiPrompt','sk_prompt');o.name=$('#sk_name').value.trim()||m.name; if(!o.naiPrompt){ toast('외형 프롬프트를 먼저 적어 주세요'); break; } if(!imgReady()){ toast(imgNeed()); break; }
      const lab=t.textContent; t.disabled=true; t.textContent='그리는 중…'; try{ const b=await naiDrawItem({k:'char',o,c:o}); await storeImage(o,b,''); m.charId='__self'; mark('meta'); SHOP_LINE=''; const pv=document.querySelector('.sk-prev'); if(pv) pv.innerHTML=`<img src="${esc(imgSrc(o))}" alt="">`; $('#sk_char').value='__self'; render(); toast('상점 주인 그림을 그렸어요'); }catch(e){ toast(naiErr(e)); } finally{ if(t.isConnected){ t.disabled=false; t.textContent='다시 그리기'; } } break; }
case 'sparkopen': openSpark(id); break;
case 'sparkgo': { const b=G.banners.find(x=>x.id===t.dataset.b), c=charById(id); if(!b||!c) break; p.spark=p.spark||{}; if((p.spark[b.id]||0)<SPARK){toast('포인트가 모자라요');break;}
      if(!(await appConfirm(`${c.name}을(를) ${SPARK}포인트로 데려올까요?`))) break; p.spark[b.id]-=SPARK; let isNew=false;
      if(p.owned[c.id]){ const o=p.owned[c.id]; if(o.dup<5){o.dup++; if(o.dup>=5)o.cgNew=true;} else { p.mat.core+=10; } } else { p.owned[c.id]={levelCapVersion:1,transc:0,growthCostVersion:1,lv:1,exp:0,dup:0,aff:0,seen:[],wlv:0,skin:''}; isNew=true; if(p.squad.length<4)p.squad.push(c.id); }
      mark('prog'); closeModal(); render(); playGacha([{c,isNew,refund:0}]); break; }
case 'pull': pull(+t.dataset.n); break;
case 'puexist': if(playMode()) break; openPickExisting(id||''); break;
case 'puxpick': { puxRead(); const a=PUX.ids, i=a.indexOf(id); if(i>=0) a.splice(i,1); else if(a.length<3) a.push(id); else toast('최대 3명까지 고를 수 있어요'); openPickExisting(); break; }
case 'puxgo': { if(playMode()) break; const r=puxGo(); if(!r) break; closeModal(); PUX=null; tab='contract'; render(); toast(`${r.rerun?'복각 픽업':'픽업'} 「${r.b.name}」을(를) 열었어요`); if(r.story) puStoryBg(r.c,false,r.b); break; }
case 'pustoryretry': { const c=charById(id); if(c){ toast('픽업 스토리를 다시 만들어요'); puStoryBg(c,false,G.banners.find(x=>x.id===t.dataset.b)); } break; }
case 'bsel': P().curBanner=id; mark('prog'); if(t.dataset.go) tab='contract'; render(); break;
case 'bnew': openBanner(null); break;
case 'bedit': openBanner(id); break;
case 'dispset': DSEL={id,ids:[]}; openDispSel(id); break;
case 'dispall': { const now=Date.now(), done=dispList().filter(d=>{ const a=P().disp[d.id]; return a&&now>=a.start+a.hours*3600e3; }); if(!done.length){ toast('완료된 파견이 없어요'); break; } const tot={}; done.forEach(d=>{ const r=dispClaim(d); Object.entries(r).forEach(([k,v])=>{ if(typeof v==='number') tot[k]=(tot[k]||0)+v; }); }); mark('prog'); sfx('확인'); toast(`파견 ${done.length}곳 완료: ${rewardText(tot)}`); render(); break; }
case 'dispredo': { const busy=busyIds(); let n=0; dispList().forEach(d=>{ if(P().disp[d.id]) return; const pick=G.chars.filter(c=>own(c.id)&&!busy.has(c.id)).sort((a,b)=>own(a.id).lv-own(b.id).lv||charPower(a)-charPower(b)).slice(0,d.need); if(pick.length<d.need) return; pick.forEach(c=>busy.add(c.id)); P().disp[d.id]={chars:pick.map(c=>c.id),start:Date.now(),hours:d.hours}; bump('dispatch'); n++; }); mark('prog'); render(); toast(n?`${n}곳에 파견을 보냈어요`:'보낼 곳이나 '+T('crew')+'이(가) 없어요'); break; }
case 'dispgo': { const d=dispList().find(x=>x.id===DSEL.id); if(!d||DSEL.ids.length!==d.need){ toast(`${d?d.need:''}명을 골라 주세요`); break; } P().disp[d.id]={chars:[...DSEL.ids],start:Date.now(),hours:d.hours}; bump('dispatch'); mark('prog'); closeModal(); render(); toast(`${d.name} 출발`); break; }
case 'dispget': { const d=dispList().find(x=>x.id===id); if(!d||!P().disp[id]) break; const dr=dispClaim(d); mark('prog'); sfx('확인'); toast(`${d.name} 완료: ${rewardText(dr)}`); render(); break; }
case 'dispcancel': if((await appConfirm('파견을 취소할까요? 보상은 받지 못해요.'))){ delete P().disp[id]; mark('prog'); render(); } break;
case 'passreset': if((await appConfirm('새 시즌을 시작할까요? 패스 단계가 처음으로 돌아가요.'))){ P().pass={xp:0,got:[]}; mark('prog'); render(); } break;
case 'shopbuy': { const it=SHOP_ITEMS().find(x=>x.id===id), sd=shopDay(), m=G.meta.shop; if(!it) break;
      if((sd.buy[it.id]||0)>=it.limit){toast('오늘은 매진이에요');break;}
      if(!canPay(it.cost)){ SHOP_LINE=rand(m.poor)||'조금 모자라요.'; render(); break; }
      pay(it.cost); sd.buy[it.id]=(sd.buy[it.id]||0)+1; giveReward(it.give); SHOP_LINE=rand(m.buy)||'고마워요!'; sfx('확인'); render(); toast(rewardText(it.give)+' 획득'); break; }
case 'shopswap': { const x=SHOP_SWAP().find(q=>q.id===id); if(!x) break; const n=+(t.dataset.n||1), cost=Object.fromEntries(Object.entries(x.cost).map(([k,v])=>[k,v*n])), give=Object.fromEntries(Object.entries(x.give).map(([k,v])=>[k,v*n]));
      if(!canPay(cost)){ SHOP_LINE=rand(G.meta.shop.poor)||'조금 모자라요.'; render(); break; } pay(cost); giveReward(give); SHOP_LINE=rand(G.meta.shop.buy)||'교환 완료!'; render(); toast(rewardText(give)+' 획득'); break; }
case 'shkedit': openShk(); break;
case 'shksave': { const m=G.meta.shop; m.name=$('#sk_name').value.trim()||'상점 주인'; m.charId=$('#sk_char').value; if($('#sk_prompt'))naiBlocksSave(shkSelf(),'naiPrompt','sk_prompt'); ['hello','buy','poor'].forEach(k=>{const v=lines($('#sk_'+k).value); if(v.length) m[k]=v;}); mark('meta'); SHOP_LINE=''; closeModal(); render(); toast('상점 주인을 저장했어요'); break; }
case 'shkai': { const c=$('#sk_char').value?charById($('#sk_char').value):null, nm=$('#sk_name').value.trim()||'상점 주인';
      const r=await aiJSON(`${RULES}
세계관: ${G.world.summary}
상점 주인 "${nm}"의 대사를 써라.${c?` 이 인물은 ${c.name}이고 프로필은 다음과 같다: ${c.profile}`:''} 플레이어(${T('player')})에게 재료를 파는 가게 주인이다. 짧고 개성 있게, 세계관 용어를 섞는다.
JSON만 출력: {"hello":["인사 5개"],"buy":["구매 감사 5개"],"poor":["돈이 모자랄 때 3개"]}`,t);
      if(r){ ['hello','buy','poor'].forEach(k=>{ if(Array.isArray(r[k])&&r[k].length) $('#sk_'+k).value=r[k].map(String).join('\n'); }); toast('대사를 채웠어요. 저장을 눌러 주세요'); } break; }
case 'cashbuy': { const k=CASH_PACKS.find(x=>x.id===id); if(!k) break; const first=!p.cash.first[k.id], n=k.gems+(first?k.gems:k.bonus); p.cash.first[k.id]=true; p.cash.total+=n; p.gems+=n; mark('prog'); render(); buyFx('+'+nf(n),`◆ ${T('currency')}${first?' · 첫 구매 2배':''}`); break; }
case 'cashmonth': { const mo=p.cash.month, base=Math.max(Date.now(),mo.until||0); mo.until=base+30*864e5; p.gems+=300; mark('prog'); render(); buyFx('+300','월간 보급 카드 · 30일'); cashTick(); render(); break; }
case 'cashpkg': { const k=CASH_PKGS().find(x=>x.id===id); if(!k) break; giveReward(k.give); render(); buyFx(k.name,rewardText(k.give)); break; }
  }
}

async function handleMessengerAction(a,t,id,p,e){
  switch(a){
case 'phone': e.stopPropagation(); openPhone(); break;
case 'openthread': { const n=$('#notif'); n.innerHTML=''; openPhone(id); break; }
case 'phclose': closePhone(); break;
case 'phback': phoneList(); break;
case 'phtab': phoneList(); break;
case 'openfc': openFree(id); break;
case 'fcsend': fcSend(); break;
case 'fcphoto': if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); break; } if(FCBUSY){ toast('답장을 기다리는 중이에요'); break; } $('#chatfile').click(); break;
case 'fcphototog': { const p=P(); p.fcPhoto=p.fcPhoto===false; mark('prog'); const m=$('.ph-menu'); if(m) m.remove(); toast(p.fcPhoto?'캐릭터가 가끔 사진을 보내요 (그림 AI 사용)':'캐릭터가 사진을 보내지 않아요'); break; }
case 'chatimg': chatImgView(t.dataset.k); break;
case 'phpendx': if(PH){ PH.pendImg=null; phPendRender(); const i=$('#fcIn'); if(i) i.placeholder='메시지 보내기'; } break;
case 'chatimgsave': { e.stopPropagation(); const u=chatImgCache[t.dataset.k]; if(u) saveImgUrl(u,'chat-photo'); break; }
case 'fcmenu': phMenu(id); break;
case 'phpick': { if(!PH) break; const tid=t.dataset.tid||PH.tid, th=threadById(tid), s=th&&p.inbox[tid]; if(!th||!s){ if(PH.fc) openRoom(PH.fc); break; }
      const c=threadChar(th), lines=parseScript(th.script); let L=lines[s.pos];
      if(!L||L.type!=='choice'){ let j=s.pos; while(j>0&&!(lines[j]&&lines[j].type==='choice')) j--; if(lines[j]&&lines[j].type==='choice'&&!s.log.some(x=>x.w==='me'&&x.pi===j)){ s.pos=j; L=lines[j]; } else { openRoom(c.id); break; } }
      const n=+t.dataset.n; s.pick=n; s.lastPick=L.opts[n-1]||''; const en={w:'me',t:sub(L.opts[n-1]||''),at:Date.now(),pi:s.pos}; s.pos++; s.log.push(en); s.at=en.at; PH.tid=tid;
      $('#phIn').innerHTML=''; phMode('free'); $('#phChat').insertAdjacentHTML('beforeend',bubbleHTML(en,c)); phScroll(); mark('prog'); phPlay(th,c,s,PH.token); break; }
case 'phmenu': phMenu(id); break;
case 'phmenuclose': { if(t.classList.contains('ph-menu')&&e.target!==t) break; $('.ph-menu')?.remove(); break; }
case 'phadd': phAddView(id,PH&&PH.fc?'room':'list'); break;
case 'phaddback': { const a=PH&&PH.add, fr=PH&&PH.from; if(a&&fr==='room') openRoom(a); else phNewList(); break; }
case 'phaddai': { const c=charById(id); if(!c) break; const hint=$('#pa_hint').value.trim();
      const r=await aiJSON(`${RULES}\n${ctx()}\n${THREAD_FMT}\n\n보내는 ${T('crew')}: ${c.name}. 프로필: ${c.profile||''}\n말투 예시: ${(c.lines||[]).join(' / ')}\n현재 호감도: ${own(c.id)?affLv(own(c.id)):1}\n지금까지의 이야기: ${fcProgress()}\n${hint?'요청: '+hint:'요청: 지금 이 캐릭터가 보낼 법한 일상적인 메신저 대화'}\n최근 대화 일부:\n${roomLog(c.id).slice(-10).map(l=>l.w==='me'?playerName()+': '+l.t:l.w==='c'?c.name+': '+l.t:'').filter(Boolean).join('\n')}\n${c.name}이(가) ${T('player')}에게 먼저 보내는 새 메신저 대화를 써라. 10~22줄, 선택지 1~2개와 '1) ' '2) '로 시작하는 분기 반응 포함. 최근 대화와 이어지되 같은 말을 반복하지 않는다. 사진을 보낸다면 소품 목록이나 배경 목록의 이름을 쓴다.\nJSON만 출력: {"title":"대화방 미리보기 제목","script":"대화"}`,t);
      if(r&&$('#pa_script')){ if(r.title) $('#pa_title').value=String(r.title); if(r.script) $('#pa_script').value=nl(r.script); toast('대화를 채웠어요. 고칠 곳이 있으면 고치고 받기를 누르세요'); } break; }
case 'phaddsend': { const c=charById(id); if(!c) break; const sc=$('#pa_script').value.trim(); if(!sc){ toast(SAMPLE?'대화를 쓰거나 AI로 대화 쓰기를 눌러 주세요':'대화를 써 주세요'); break; }
      const now=Date.now(), th={id:uid(),charId:c.id,title:$('#pa_title').value.trim()||'메시지',trigger:{type:'start'},needOwn:!!own(c.id),script:sc,added:true};
      G.threads.push(th); mark('t:'+th.id); p.inbox[th.id]={at:now,t0:now,pos:0,pick:0,done:false,log:[]}; mark('prog'); updateBadge(); openRoom(c.id); break; }
case 'phsel': openRoom(id,{sel:true}); break;
case 'phselend': { const cid=PH&&PH.fc; if(cid) openRoom(cid); else phoneList(); break; }
case 'phdel': { const cid=PH&&PH.fc; if(!cid) break; const x=roomItems(cid)[+t.dataset.i]; if(!x) break; roomDel(cid,[x]); const st=$('#phChat').scrollTop; openRoom(cid,{sel:true}); $('#phChat').scrollTop=st; toast('메시지를 지웠어요'); break; }
case 'phdelblock': { const b=roomLastBlock(id); if(!b.length) break; if(!(await appConfirm(`최근 대화 ${b.length}개 메시지를 지울까요?\n(호감도는 그대로예요)`))) break; roomDel(id,b); openRoom(id); toast('이번 대화를 지웠어요'); break; }
case 'phdelall': { const c=charById(id); if(!c) break; if(!(await appConfirm(`${c.name}와(과)의 대화방을 모두 지울까요?\n(이야기로 받은 대화도 기록만 지워지고, 호감도는 그대로예요)`))) break;
      roomThreads(id).forEach(({s})=>{ s.log.length=0; }); delete FC()[id]; mark('prog'); openRoom(id); toast('대화방을 비웠어요'); break; }
case 'phmode': phMode(t.dataset.v); break;
case 'phsay': { if(!PH) break; const tid=t.dataset.tid||PH.tid, th=threadById(tid), s=th&&p.inbox[tid]; if(!th||!s) break; const c=threadChar(th), L=parseScript(th.script)[s.pos]; if(!L||L.type!=='say'||!isMe(L.who)) { openRoom(c.id); break; }
      const en={w:'me',t:sub(L.text),at:Date.now()}; s.pos++; s.log.push(en); s.at=en.at; PH.tid=tid; $('#phIn').innerHTML=''; phMode('free'); $('#phChat').insertAdjacentHTML('beforeend',bubbleHTML(en,c)); phScroll(); mark('prog'); phPlay(th,c,s,PH.token); break; }
case 'phnew': phNewList(); break;
case 'fclear': squadSel=[]; refreshForm(); break;
  }
}


const APP_ACTION_HANDLERS=Object.freeze({"gateyes":handleSetupAction,"gateno":handleSetupAction,"titletap":handleSetupAction,"swnext":handleSetupAction,"swaddai":handleSetupAction,"swprev":handleSetupAction,"swlink":handleSetupAction,"swskipall":handleSetupAction,"swgenre":handleSetupAction,"swgo1":handleSetupAction,"swpjgo":handleSetupAction,"swpjnew":handleSetupAction,"swsub":handleSetupAction,"swdone":handleSetupAction,"swstytest":handleSetupAction,"swtestai":handleSetupAction,"swtestnai":handleSetupAction,"title":handleSetupAction,"swpreset":handleSetupAction,"sweep":handleSetupAction,"swdraft":handleSetupAction,"swpjdraft":handleSetupAction,"titlesnd":handleSetupAction,"prepopen":handleNavigationAndToolsAction,"rebal":handleNavigationAndToolsAction,"a2hs":handleNavigationAndToolsAction,"cdart":handleNavigationAndToolsAction,"bswipe":handleNavigationAndToolsAction,"lktake":handleNavigationAndToolsAction,"artgo":handleNavigationAndToolsAction,"artalways":handleNavigationAndToolsAction,"bpgo":handleNavigationAndToolsAction,"bpbg":handleNavigationAndToolsAction,"bpskip":handleNavigationAndToolsAction,"bpleave":handleNavigationAndToolsAction,"prepgo":handleNavigationAndToolsAction,"prepstop":handleNavigationAndToolsAction,"prepnever":handleNavigationAndToolsAction,"opnext":handleNavigationAndToolsAction,"pfdraw":handleNavigationAndToolsAction,"pfsave":handleNavigationAndToolsAction,"go":handleNavigationAndToolsAction,"close":handleNavigationAndToolsAction,"goback":handleNavigationAndToolsAction,"lbhide":handleNavigationAndToolsAction,"lbshow":handleNavigationAndToolsAction,"poke":handleNavigationAndToolsAction,"lbbgdel":handleNavigationAndToolsAction,"altnew":handleNavigationAndToolsAction,"scggen":handleNavigationAndToolsAction,"scgdel":handleNavigationAndToolsAction,"scgtest":handleNavigationAndToolsAction,"ilgen":handleNavigationAndToolsAction,"vncgview":handleNavigationAndToolsAction,"cgview":handleNavigationAndToolsAction,"cguse":handleNavigationAndToolsAction,"ildel":handleNavigationAndToolsAction,"ailog":handleNavigationAndToolsAction,"ailogcopy":handleNavigationAndToolsAction,"ailogclear":handleNavigationAndToolsAction,"artcopy":handleNavigationAndToolsAction,"artclear":handleNavigationAndToolsAction,"pthumbset":handleNavigationAndToolsAction,"avdel":handleNavigationAndToolsAction,"pthumbdel":handleNavigationAndToolsAction,"addchar-open":handleNavigationAndToolsAction,"addchar-hand":handleNavigationAndToolsAction,"addchar-ai":handleNavigationAndToolsAction,"copy":handleNavigationAndToolsAction,"copyfield":handleNavigationAndToolsAction,"playep":handleNavigationAndToolsAction,"mapedit":handleNavigationAndToolsAction,"locked":handleNavigationAndToolsAction,"sq":handleNavigationAndToolsAction,"discover":handleNavigationAndToolsAction,"ghist":handleNavigationAndToolsAction,"vnnext":handleNavigationAndToolsAction,"vnpick":handleNavigationAndToolsAction,"vnauto":handleNavigationAndToolsAction,"vnskip":handleNavigationAndToolsAction,"vnlog":handleNavigationAndToolsAction,"bquit":handleNavigationAndToolsAction,"skill":handleNavigationAndToolsAction,"bretry":handleNavigationAndToolsAction,"flip":handleNavigationAndToolsAction,"flipall":handleNavigationAndToolsAction,"gcskip":handleNavigationAndToolsAction,"closepull":handleNavigationAndToolsAction,"sdelno":handleNavigationAndToolsAction,"sdelgo":handleNavigationAndToolsAction,"saveopening":handleNavigationAndToolsAction,"aiopening":handleNavigationAndToolsAction,"savelib":handleNavigationAndToolsAction,"dellib":handleNavigationAndToolsAction,"ailib":handleNavigationAndToolsAction,"aichar-open":handleNavigationAndToolsAction,"newpu":handleNavigationAndToolsAction,"newpu-hand":handleNavigationAndToolsAction,"newpu-ai":handleNavigationAndToolsAction,"aichar":handleNavigationAndToolsAction,"nextneedai":handleNavigationAndToolsAction,"testai":handleNavigationAndToolsAction,"cplogin":handleNavigationAndToolsAction,"saload":handleNavigationAndToolsAction,"seasoninfo":handleNavigationAndToolsAction,"seasontog":handleNavigationAndToolsAction,"seasonskip":handleNavigationAndToolsAction,"livetog":handleNavigationAndToolsAction,"liverun":handleNavigationAndToolsAction,"enh":handleNavigationAndToolsAction,"enhmax":handleNavigationAndToolsAction,"lb":handleNavigationAndToolsAction,"wup":handleNavigationAndToolsAction,"skvclear":handleNavigationAndToolsAction,"aiskin":handleNavigationAndToolsAction,"skpredo":handleNavigationAndToolsAction,"skpcancel":handleNavigationAndToolsAction,"skpok":handleNavigationAndToolsAction,"bnfac":handleNavigationAndToolsAction,"bnid":handleNavigationAndToolsAction,"bnup":handleNavigationAndToolsAction,"bnsave":handleNavigationAndToolsAction,"bndel":handleNavigationAndToolsAction,"dsauto":handleNavigationAndToolsAction,"dsclr":handleNavigationAndToolsAction,"pgetall":handleNavigationAndToolsAction,"dsel":handleNavigationAndToolsAction,"mget":handleNavigationAndToolsAction,"pget":handleNavigationAndToolsAction,"logoprev":handleNavigationAndToolsAction,"logoprevclose":handleNavigationAndToolsAction,"newgame-open":handleNavigationAndToolsAction,"aievent-open":handleNavigationAndToolsAction,"aievent":handleNavigationAndToolsAction,"sfxplay":handleNavigationAndToolsAction,"sfxgen":handleNavigationAndToolsAction,"sfxall":handleNavigationAndToolsAction,"vtest":handleNavigationAndToolsAction,"dsopen":handleNavigationAndToolsAction,"dssave":handleNavigationAndToolsAction,"dsai":handleNavigationAndToolsAction,"shareopen":handleNavigationAndToolsAction,"sharego":handleNavigationAndToolsAction,"fbopen":handleNavigationAndToolsAction,"fbissue":handleNavigationAndToolsAction,"fbpost":handleNavigationAndToolsAction,"fbstar":handleNavigationAndToolsAction,"fbsend":handleNavigationAndToolsAction,"guidecopy":handleNavigationAndToolsAction,"skbdraw":handleNavigationAndToolsAction,"skbbuy":handleNavigationAndToolsAction,"reroll0":handleNavigationAndToolsAction,"cachewipe":handleNavigationAndToolsAction,"mailopen":handleMailAction,"mailview":handleMailAction,"mailget":handleMailAction,"mailall":handleMailAction,"mailclean":handleMailAction,"maildel":handleMailAction,"cxcat":handleStoryAndAuthoringAction,"cxview":handleStoryAndAuthoringAction,"cxadd":handleStoryAndAuthoringAction,"relopen":handleStoryAndAuthoringAction,"relgo":handleStoryAndAuthoringAction,"relseed":handleStoryAndAuthoringAction,"reladd":handleStoryAndAuthoringAction,"reledit":handleStoryAndAuthoringAction,"relsave":handleStoryAndAuthoringAction,"reldel":handleStoryAndAuthoringAction,"relundo":handleStoryAndAuthoringAction,"relrebuild":handleStoryAndAuthoringAction,"cxedit":handleStoryAndAuthoringAction,"cxsave":handleStoryAndAuthoringAction,"cxdel":handleStoryAndAuthoringAction,"cxnote":handleStoryAndAuthoringAction,"cxdisc":handleStoryAndAuthoringAction,"cxdeep":handleStoryAndAuthoringAction,"cxreadall":handleStoryAndAuthoringAction,"opening-play":handleStoryAndAuthoringAction,"char":handleStoryAndAuthoringAction,"evspoke":handleStoryAndAuthoringAction,"evreroll":handleStoryAndAuthoringAction,"stamopen":handleStoryAndAuthoringAction,"stamfill":handleStoryAndAuthoringAction,"stamtog":handleStoryAndAuthoringAction,"scimg":handleStoryAndAuthoringAction,"charedit":handleStoryAndAuthoringAction,"charnew":handleStoryAndAuthoringAction,"savechar":handleStoryAndAuthoringAction,"delchar":handleStoryAndAuthoringAction,"epedit":handleStoryAndAuthoringAction,"saveep":handleStoryAndAuthoringAction,"delep":handleStoryAndAuthoringAction,"aiep":handleStoryAndAuthoringAction,"thedit":handleStoryAndAuthoringAction,"saveth":handleStoryAndAuthoringAction,"delth":handleStoryAndAuthoringAction,"aithread":handleStoryAndAuthoringAction,"ststory":handleStoryAndAuthoringAction,"story":handleStoryAndAuthoringAction,"chedit":handleStoryAndAuthoringAction,"addstage":handleStoryAndAuthoringAction,"delstage":handleStoryAndAuthoringAction,"savech":handleStoryAndAuthoringAction,"stdetail":handleStoryAndAuthoringAction,"delch":handleStoryAndAuthoringAction,"world-open":handleStoryAndAuthoringAction,"saveworld":handleStoryAndAuthoringAction,"aiworld":handleStoryAndAuthoringAction,"opening-edit":handleStoryAndAuthoringAction,"aichapter-open":handleStoryAndAuthoringAction,"aichapter":handleStoryAndAuthoringAction,"reload":handleStoryAndAuthoringAction,"evopen":handleStoryAndAuthoringAction,"evbuy":handleStoryAndAuthoringAction,"evedit":handleStoryAndAuthoringAction,"evsave":handleStoryAndAuthoringAction,"evdel":handleStoryAndAuthoringAction,"dreroll":handleStoryAndAuthoringAction,"meta-open":handleStoryAndAuthoringAction,"metasave":handleStoryAndAuthoringAction,"draft-open":handleStoryAndAuthoringAction,"drlib":handleStoryAndAuthoringAction,"drlibsave":handleStoryAndAuthoringAction,"drlibload":handleStoryAndAuthoringAction,"drreuseoff":handleStoryAndAuthoringAction,"drxcur":handleStoryAndAuthoringAction,"drxlib":handleStoryAndAuthoringAction,"drxcopy":handleStoryAndAuthoringAction,"drxfile":handleStoryAndAuthoringAction,"drxback":handleStoryAndAuthoringAction,"drimport":handleStoryAndAuthoringAction,"drigo":handleStoryAndAuthoringAction,"drifile":handleStoryAndAuthoringAction,"drlibdel":handleStoryAndAuthoringAction,"drtab":handleStoryAndAuthoringAction,"drcadd":handleStoryAndAuthoringAction,"drcdel":handleStoryAndAuthoringAction,"drmode":handleStoryAndAuthoringAction,"drpreset":handleStoryAndAuthoringAction,"drautoex":handleStoryAndAuthoringAction,"drpfdraw":handleStoryAndAuthoringAction,"drcfill":handleStoryAndAuthoringAction,"drpolish":handleStoryAndAuthoringAction,"drharmony":handleStoryAndAuthoringAction,"drdedup":handleStoryAndAuthoringAction,"drundo":handleStoryAndAuthoringAction,"drpreview":handleStoryAndAuthoringAction,"drclear":handleStoryAndAuthoringAction,"drmanual":handleStoryAndAuthoringAction,"drmake":handleStoryAndAuthoringAction,"charregen":handleStoryAndAuthoringAction,"cheat2":handleStoryAndAuthoringAction,"cheat":handleStoryAndAuthoringAction,"pxopen":handleSettingsAndAudioAction,"pxsave":handleSettingsAndAudioAction,"pxtest":handleSettingsAndAudioAction,"appre":handleSettingsAndAudioAction,"setupopen":handleSettingsAndAudioAction,"setname0":handleSettingsAndAudioAction,"setname":handleSettingsAndAudioAction,"playmode":handleSettingsAndAudioAction,"sttab":handleSettingsAndAudioAction,"setsec":handleSettingsAndAudioAction,"apnew":handleSettingsAndAudioAction,"apedit":handleSettingsAndAudioAction,"apsave":handleSettingsAndAudioAction,"apdel":handleSettingsAndAudioAction,"apuse":handleSettingsAndAudioAction,"apfb":handleSettingsAndAudioAction,"aptest":handleSettingsAndAudioAction,"llmopen":handleSettingsAndAudioAction,"llmsave":handleSettingsAndAudioAction,"llmtog":handleSettingsAndAudioAction,"llmpadd":handleSettingsAndAudioAction,"llmpedit":handleSettingsAndAudioAction,"llmpdel":handleSettingsAndAudioAction,"llmpcopy":handleSettingsAndAudioAction,"llmpimport":handleSettingsAndAudioAction,"sndopen":handleSettingsAndAudioAction,"vclearall":handleSettingsAndAudioAction,"vprebuild":handleSettingsAndAudioAction,"sndsave":handleSettingsAndAudioAction,"fishtest":handleSettingsAndAudioAction,"voice":handleSettingsAndAudioAction,"vclear":handleSettingsAndAudioAction,"vsearch":handleSettingsAndAudioAction,"vsai":handleSettingsAndAudioAction,"vsplay":handleSettingsAndAudioAction,"vstry":handleSettingsAndAudioAction,"vspick":handleSettingsAndAudioAction,"vsetid":handleSettingsAndAudioAction,"elcompose":handleSettingsAndAudioAction,"syopen":handleStorageAndSharingAction,"sylink":handleStorageAndSharingAction,"sypush":handleStorageAndSharingAction,"sypushf":handleStorageAndSharingAction,"sypull":handleStorageAndSharingAction,"sysave":handleStorageAndSharingAction,"bkgo":handleStorageAndSharingAction,"bkshare":handleStorageAndSharingAction,"pickgame":handleStorageAndSharingAction,"pcopen":handleStorageAndSharingAction,"syoff":handleStorageAndSharingAction,"pcsave":handleStorageAndSharingAction,"pcoff":handleStorageAndSharingAction,"pcpush":handleStorageAndSharingAction,"pcpushf":handleStorageAndSharingAction,"pcpullgo":handleStorageAndSharingAction,"pchist":handleStorageAndSharingAction,"pchistgo":handleStorageAndSharingAction,"pcpull":handleStorageAndSharingAction,"resetth":handleStorageAndSharingAction,"exportfile":handleStorageAndSharingAction,"importfile":handleStorageAndSharingAction,"pj-open":handleStorageAndSharingAction,"pjswitch":handleStorageAndSharingAction,"pjdel":handleStorageAndSharingAction,"pjblank":handleStorageAndSharingAction,"pubopen":handleStorageAndSharingAction,"pubgo":handleStorageAndSharingAction,"pubcopy":handleStorageAndSharingAction,"pubcopy2":handleStorageAndSharingAction,"subadd":handleStorageAndSharingAction,"subgo":handleStorageAndSharingAction,"subcheck":handleStorageAndSharingAction,"subapply":handleStorageAndSharingAction,"subskip":handleStorageAndSharingAction,"subcopy":handleStorageAndSharingAction,"subleave":handleStorageAndSharingAction,"pjreroll":handleStorageAndSharingAction,"pjdraftx":handleStorageAndSharingAction,"backup":handleStorageAndSharingAction,"importbk":handleStorageAndSharingAction,"reset":handleStorageAndSharingAction,"raidgo":handleCombatAndFormationAction,"raidstart":handleCombatAndFormationAction,"rgnew":handleCombatAndFormationAction,"rfslot":handleCombatAndFormationAction,"rffil":handleCombatAndFormationAction,"rfauto":handleCombatAndFormationAction,"rfclr":handleCombatAndFormationAction,"rfpick":handleCombatAndFormationAction,"rfgo":handleCombatAndFormationAction,"rgnode":handleCombatAndFormationAction,"rgskip":handleCombatAndFormationAction,"rgrelic":handleCombatAndFormationAction,"dgmove":handleCombatAndFormationAction,"dgdown":handleCombatAndFormationAction,"rgcard":handleCombatAndFormationAction,"rgrest":handleCombatAndFormationAction,"rgupg":handleCombatAndFormationAction,"rgrm":handleCombatAndFormationAction,"rgdeck":handleCombatAndFormationAction,"cbplay":handleCombatAndFormationAction,"cbsel":handleCombatAndFormationAction,"cbult":handleCombatAndFormationAction,"cbend":handleCombatAndFormationAction,"cbtgt":handleCombatAndFormationAction,"cbdeck":handleCombatAndFormationAction,"cbquit":handleCombatAndFormationAction,"rgsave":handleCombatAndFormationAction,"rgleave":handleCombatAndFormationAction,"rgquit":handleCombatAndFormationAction,"opskip":handleCombatAndFormationAction,"stage":handleCombatAndFormationAction,"sortie":handleCombatAndFormationAction,"bauto":handleCombatAndFormationAction,"bspeed":handleCombatAndFormationAction,"bdone":handleCombatAndFormationAction,"opsch":handleCombatAndFormationAction,"opsback":handleCombatAndFormationAction,"fsq":handleCombatAndFormationAction,"fpick":handleCombatAndFormationAction,"fsl":handleCombatAndFormationAction,"fauto":handleCombatAndFormationAction,"ffil":handleCombatAndFormationAction,"fsave":handleCombatAndFormationAction,"fpre":handleCombatAndFormationAction,"farmgo":handleCombatAndFormationAction,"farmstart":handleCombatAndFormationAction,"webupdcheck":handleUpdatesAction,"webupdgo":handleUpdatesAction,"webupdskip":handleUpdatesAction,"updel":handleUpdatesAction,"upd-open":handleUpdatesAction,"updcheck":handleUpdatesAction,"updget":handleUpdatesAction,"updskip":handleUpdatesAction,"apkget":handleUpdatesAction,"relnotes":handleUpdatesAction,"uprollback":handleUpdatesAction,"upbuiltin":handleUpdatesAction,"csframe":handleCharactersAction,"cspoke":handleCharactersAction,"cstab":handleCharactersAction,"upgen":handleCharactersAction,"gift":handleCharactersAction,"giftgive":handleCharactersAction,"ainai":handleCharactersAction,"ailines":handleCharactersAction,"ailinesmore":handleCharactersAction,"upsave":handleCharactersAction,"upgo":handleCharactersAction,"wpai":handleCharactersAction,"wai":handleCharactersAction,"wfixall":handleCharactersAction,"regengo":handleCharactersAction,"regenapply":handleCharactersAction,"regenretry":handleCharactersAction,"regenedit":handleCharactersAction,"regencancel":handleCharactersAction,"ailooksall":handleCharactersAction,"ailooks":handleCharactersAction,"castre":handleImagesAndAssetsAction,"castfaces":handleImagesAndAssetsAction,"cfsel":handleImagesAndAssetsAction,"cfgo":handleImagesAndAssetsAction,"cfall":handleImagesAndAssetsAction,"castface":handleImagesAndAssetsAction,"castok":handleImagesAndAssetsAction,"castskip":handleImagesAndAssetsAction,"imgsave":handleImagesAndAssetsAction,"posegen":handleImagesAndAssetsAction,"posedel":handleImagesAndAssetsAction,"upload":handleImagesAndAssetsAction,"imgx":handleImagesAndAssetsAction,"npcscan":handleImagesAndAssetsAction,"npcopen":handleImagesAndAssetsAction,"npcsave":handleImagesAndAssetsAction,"npcdraw":handleImagesAndAssetsAction,"npctags":handleImagesAndAssetsAction,"npcdel":handleImagesAndAssetsAction,"npcadd":handleImagesAndAssetsAction,"cutclose":handleImagesAndAssetsAction,"lib":handleImagesAndAssetsAction,"libitem":handleImagesAndAssetsAction,"libnew":handleImagesAndAssetsAction,"castt":handleImagesAndAssetsAction,"naiopen":handleImagesAndAssetsAction,"naivariety":handleImagesAndAssetsAction,"naipreset":handleImagesAndAssetsAction,"packopen":handleImagesAndAssetsAction,"packuse":handleImagesAndAssetsAction,"packdel":handleImagesAndAssetsAction,"packcopy":handleImagesAndAssetsAction,"packimport":handleImagesAndAssetsAction,"packsave":handleImagesAndAssetsAction,"naisave":handleImagesAndAssetsAction,"cfload":handleImagesAndAssetsAction,"cftest":handleImagesAndAssetsAction,"naitest":handleImagesAndAssetsAction,"naiall":handleImagesAndAssetsAction,"skinuse":handleImagesAndAssetsAction,"faceview":handleImagesAndAssetsAction,"faces-open":handleImagesAndAssetsAction,"facesel":handleImagesAndAssetsAction,"faceup":handleImagesAndAssetsAction,"faceupnew":handleImagesAndAssetsAction,"faceupmany":handleImagesAndAssetsAction,"facedel":handleImagesAndAssetsAction,"facetgt":handleImagesAndAssetsAction,"facebasic":handleImagesAndAssetsAction,"facemask":handleImagesAndAssetsAction,"facego":handleImagesAndAssetsAction,"skin-open":handleImagesAndAssetsAction,"skinlines":handleImagesAndAssetsAction,"skpartgen":handleImagesAndAssetsAction,"skpartall":handleImagesAndAssetsAction,"skpartup":handleImagesAndAssetsAction,"skingo":handleImagesAndAssetsAction,"skindel":handleImagesAndAssetsAction,"wnai":handleImagesAndAssetsAction,"wgen":handleImagesAndAssetsAction,"imglib":handleImagesAndAssetsAction,"ilbtap":handleImagesAndAssetsAction,"ilbclear":handleImagesAndAssetsAction,"ilbdel":handleImagesAndAssetsAction,"bgmall":handleImagesAndAssetsAction,"bgmpick":handleImagesAndAssetsAction,"bgmpickall":handleImagesAndAssetsAction,"bgmallgo":handleImagesAndAssetsAction,"bgmplay":handleImagesAndAssetsAction,"bgmstop":handleImagesAndAssetsAction,"aupload":handleImagesAndAssetsAction,"naigen":handleImagesAndAssetsAction,"cutopen":handleImagesAndAssetsAction,"cutrun":handleImagesAndAssetsAction,"cutnai":handleImagesAndAssetsAction,"cutzoom":handleImagesAndAssetsAction,"cutundo":handleImagesAndAssetsAction,"cutnudge":handleImagesAndAssetsAction,"cuthere":handleImagesAndAssetsAction,"cutsave":handleImagesAndAssetsAction,"naigo":handleImagesAndAssetsAction,"naiagain":handleImagesAndAssetsAction,"naiedit":handleImagesAndAssetsAction,"naiuse":handleImagesAndAssetsAction,"naibatch":handleImagesAndAssetsAction,"naistop":handleImagesAndAssetsAction,"styopen":handleImagesAndAssetsAction,"styadd":handleImagesAndAssetsAction,"stydel":handleImagesAndAssetsAction,"stysave":handleImagesAndAssetsAction,"skinbuy":handleImagesAndAssetsAction,"skinpkgdel":handleImagesAndAssetsAction,"skinnew":handleImagesAndAssetsAction,"skinpromptsave":handleImagesAndAssetsAction,"daily":handleEconomyAction,"shkdraw":handleEconomyAction,"sparkopen":handleEconomyAction,"sparkgo":handleEconomyAction,"pull":handleEconomyAction,"puexist":handleEconomyAction,"puxpick":handleEconomyAction,"puxgo":handleEconomyAction,"pustoryretry":handleEconomyAction,"bsel":handleEconomyAction,"bnew":handleEconomyAction,"bedit":handleEconomyAction,"dispset":handleEconomyAction,"dispall":handleEconomyAction,"dispredo":handleEconomyAction,"dispgo":handleEconomyAction,"dispget":handleEconomyAction,"dispcancel":handleEconomyAction,"passreset":handleEconomyAction,"shopbuy":handleEconomyAction,"shopswap":handleEconomyAction,"shkedit":handleEconomyAction,"shksave":handleEconomyAction,"shkai":handleEconomyAction,"cashbuy":handleEconomyAction,"cashmonth":handleEconomyAction,"cashpkg":handleEconomyAction,"phone":handleMessengerAction,"openthread":handleMessengerAction,"phclose":handleMessengerAction,"phback":handleMessengerAction,"phtab":handleMessengerAction,"openfc":handleMessengerAction,"fcsend":handleMessengerAction,"fcphoto":handleMessengerAction,"fcphototog":handleMessengerAction,"chatimg":handleMessengerAction,"phpendx":handleMessengerAction,"chatimgsave":handleMessengerAction,"fcmenu":handleMessengerAction,"phpick":handleMessengerAction,"phmenu":handleMessengerAction,"phmenuclose":handleMessengerAction,"phadd":handleMessengerAction,"phaddback":handleMessengerAction,"phaddai":handleMessengerAction,"phaddsend":handleMessengerAction,"phsel":handleMessengerAction,"phselend":handleMessengerAction,"phdel":handleMessengerAction,"phdelblock":handleMessengerAction,"phdelall":handleMessengerAction,"phmode":handleMessengerAction,"phsay":handleMessengerAction,"phnew":handleMessengerAction,"fclear":handleMessengerAction});
document.addEventListener('click',async e=>{
  if(window.__SWIPED&&Date.now()-window.__SWIPED<450){ window.__SWIPED=0; return; }
  const t=e.target.closest('[data-tab],[data-act]'); if(!t) return;
  if(t.dataset.tab){if(NEW_GAME_SOURCE){toast('게임 생성이 끝날 때까지 기다려 주세요');return;} if(t.dataset.tab==='studio') STTAB=''; tab=t.dataset.tab;render();$('#view').scrollTop=0;return;}
  const a=t.dataset.act,id=t.dataset.id,p=P();
  if(NEW_GAME_SOURCE&&!['ailog','ailogcopy'].includes(a)){toast('게임 생성이 끝날 때까지 기다려 주세요');return;}
  try{
  const handler=APP_ACTION_HANDLERS[a];if(handler)return await handler(a,t,id,p,e);
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

/* Share archives use the same staged, chunked media pipeline as backups.
   Legacy JSON remains an import format; sharing never carries player progress. */
function shareDefinition(options){
 const game=JSON.parse(JSON.stringify(G));delete game.prog;
 const stages=game.chapters.filter(c=>c.kind==='main').reduce((n,ch)=>n+ch.stages.length,0);
 const spread=arr=>arr.forEach((x,k)=>{x.gate=options.gate===false?0:Math.min(stages,x.gate>0?x.gate:Math.max(1,Math.round((k+1)*stages/(arr.length+1))));});
 spread(game.events||[]);spread((game.banners||[]).filter(b=>b.id!=='std'&&!b.eventId));game.meta.gated=options.gate!==false&&stages>0;
 for(const b of game.banners||[]){delete b.until;if(b.id!=='std'&&game.meta.gated){b.active=true;delete b.newAt;}}
 for(const e of game.events||[]){delete e.until;if(game.meta.gated)e.active=true;}
 if(!String(game.meta.artTags||'').trim()){const config=naiCfg(),style=config.styles.find(x=>x.id===config.styleId)||config.styles[0];if(style&&String(style.tags||'').trim()){game.meta.artTags=style.tags;game.meta.artNeg=style.neg||'';}}
 for(const c of game.chars){delete c.voiceId;delete c.voiceName;}
 for(const o of imgObjsOf(game))if(!options.img||!o.img?.idb)o.img=null;
 for(const l of game.lib||[])if(!options.audio)l.audio=null;
 return game;
}
async function shareExport(options){
 if(BACKUP_BUSY)return;BACKUP_BUSY=true;backupBusyOverlay(true);let writer,destinationFailed=false,retryAsShare=false;
 try{
  await flush();await appStorage.drain();appStorage.setItem('ggm-bkdest',options.dest);
  const game=shareDefinition(options),media=backupMedia(game),stamp=new Date(),safe=String(game.meta.title||'game').replace(/[^\w가-힣-]+/g,'_').slice(0,20),name='gacha-share-'+safe+'-'+stamp.toISOString().replace(/[:.]/g,'-')+'.ggmpack';
  try{writer=await bkWriter(options.dest,name);}catch(e){destinationFailed=true;throw e;}const write=async record=>{try{await writer.write(JSON.stringify(record)+'\n');}catch(e){destinationFailed=true;throw e;}};
  await write({format:'ggm-share',version:2,kind:'share',app:'gacha-game-maker',build:APP_BUILD,at:stamp.toISOString(),game,media});
  const entries=[...media.images.map(x=>({key:x.id})),...media.audios.map(x=>({key:'a_'+x.id}))];let count=0;
  for(const item of entries){backupTransferStatus(`공유팩 자료 저장 ${++count}/${entries.length}…`);const blob=await idbGetNS(item.key);if(!blob)throw Error('자료 파일을 찾지 못했습니다: '+item.key);await write({record:'media',key:item.key,type:blob.type,size:blob.size});for(let p=0;p<blob.size;p+=262144){await write({record:'chunk',data:await backupBytes(blob.slice(p,p+262144))});backupTransferStatus(`공유팩 자료 저장 ${count}/${entries.length} · ${(Math.min(p+262144,blob.size)/1048576).toFixed(1)} / ${(blob.size/1048576).toFixed(1)} MiB`);}await write({record:'media-end'});}
  await write({record:'end',count});backupTransferStatus('공유팩 파일 저장 중…');let result;try{result=await writer.close();}catch(e){destinationFailed=true;throw e;}
  if(result.uri&&options.dest==='share'){if(!CAP?.Share)throw Error('공유 기능을 사용할 수 없습니다');await CAP.Share.share({title:game.meta.title+' 공유팩',files:[result.uri]});}
  else if(result.blob){const file=new File([result.blob],name,{type:'application/octet-stream'});if(options.dest==='share'&&navigator.canShare?.({files:[file]}))await navigator.share({title:game.meta.title+' 공유팩',files:[file]});else{const a=document.createElement('a');a.href=URL.createObjectURL(file);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},4000);}}
  openModal(`${head('공유 팩 저장 완료')}<p style="overflow-wrap:anywhere">${esc(result.where||name)}</p><p>받는 사람은 패치된 메이커의 설정 → 데이터 → 공유 팩 불러오기에서 새 게임으로 추가할 수 있어요. 기존 JSON 공유팩도 같은 곳에서 불러올 수 있어요.</p><button class="btn" data-act="close">확인</button>`);
 }catch(e){if(e?.name!=='AbortError'){if(destinationFailed&&IS_NATIVE&&options.dest!=='share'){retryAsShare=true;toast('이 폴더에 저장할 수 없어 공유하기로 다시 저장합니다.');}else toast('공유팩 저장 실패: '+(e.message||e)+'. 완료되지 않은 파일은 사용하지 마세요. 저장 위치도 확인해 주세요.');}}
 finally{BACKUP_BUSY=false;backupBusyOverlay(false);syBar('');}
 if(retryAsShare)return shareExport({...options,dest:'share'});
}
function backupTransferStatus(message){const b=document.querySelector('#backup-busy-lock b');if(b)b.textContent=message;syBar(message);}
function clearImportedMediaCache(){for(const cache of [imgCache,audioCache,chatImgCache])for(const k of Object.keys(cache)){URL.revokeObjectURL(cache[k]);delete cache[k];}}
async function applySharedArchive(header,prefix){
 if(!header.game||!Array.isArray(header.game.chars))throw Error('공유팩 게임 정보가 올바르지 않습니다');
 if(header.hasGlobalMedia)throw Error('공유팩에 허용되지 않는 음성 캐시가 포함되어 있습니다');
 const project=PJ().active,original=G;backupBusyOverlay(false);
 const toNew=await appConfirm(`공유 팩 「${header.game.meta?.title||'게임'}」이에요. 새 게임으로 추가할까요?\n확인: 새 게임으로 추가\n취소: 현재 게임을 덮어쓸지 다시 물어봅니다.`);
 if(!toNew&&!await appConfirm('현재 게임을 이 공유팩으로 덮어쓸까요? 진행 상황은 처음부터 시작합니다.'))return false;
 if(PJ().active!==project||G!==original)throw Error('게임이 바뀌었습니다. 파일을 다시 선택해 주세요.');
 backupBusyOverlay(true);backupTransferStatus('공유팩 검사 완료 · 안전하게 저장 중…');await flush();
 const raw=header.game;delete raw.prog;const game=fix(raw),present=new Set((header.media?.images||[]).map(x=>x.id)),audio=new Set((header.media?.audios||[]).map(x=>x.id));
 for(const o of imgObjsOf(game))o.img=present.has(o.id)?{idb:true}:null;
 for(const l of game.lib||[])l.audio=audio.has(l.id)?{idb:true}:null;
 for(const c of game.chars){delete c.voiceId;delete c.voiceName;}
 const registry=PJ(),id=toNew?'g'+uid():project,namespace=id==='main'?'':id+'::';
 if(toNew){registry.list.push({id,title:game.meta.title||'공유 게임'});registry.active=id;}else{const entry=registry.list.find(x=>x.id===id);if(entry){entry.title=game.meta.title;delete entry.sub;}}
 const previousPause=window.__NOFLUSH;window.__NOFLUSH=1;
 try{
  await appStorage.commitImport(prefix,pjKey(id),JSON.stringify(game),namespace,{[PJKEY]:JSON.stringify(registry)});
  dirty.clear();clearTimeout(flushT);
  if(toNew){toast('공유팩을 새 게임으로 추가했어요. 다시 시작합니다.');await reloadGame();return 'reload';}
  G=game;clearImportedMediaCache();try{await loadIdbImages();await loadAudio();applyMeta();render();closeModal();toast('공유팩을 불러왔어요. 새 진행으로 시작합니다.');}catch(e){toast('공유팩은 저장되었지만 화면을 갱신하지 못했습니다. 앱을 다시 실행해 주세요.');}return true;
 }finally{window.__NOFLUSH=previousPause;}
}

// Decode a legacy image in small base64 blocks rather than passing a huge URL to fetch.
async function legacyMediaBlob(value){
 const comma=value.indexOf(',');if(comma<5)throw Error('자료 파일의 데이터 주소가 올바르지 않습니다');const meta=value.slice(5,comma);
 if(!/;base64$/i.test(meta))return (await fetch(value)).blob();
 const type=meta.split(';')[0]||'application/octet-stream',parts=[];let data=value.slice(comma+1);if(/\s/.test(data))data=data.replace(/\s/g,'');
 for(let p=0;p<data.length;p+=349524){parts.push(b64ToBytes(data.slice(p,p+349524)));if(p&&p%1398096===0)await new Promise(resolve=>setTimeout(resolve,0));}
 return new Blob(parts,{type});
}
