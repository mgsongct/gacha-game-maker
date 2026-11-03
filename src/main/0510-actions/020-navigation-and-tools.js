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
      if(b){ b.textContent=sub(l); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); } lobbyEmote(t,l,zone); if(c.voiceId&&SND().voiceLobby) speak(c,l);
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
case 'vnpick': { e.stopPropagation(); if(!S||!S.choice) break; const n=+t.dataset.n,o=S.choice.opts[n-1]; S.pick=n; S.lastPick=o; S.choice=null; if(S.branch){ storyFlag(S.branch,n,o); S.branch=null; } $('#vnCh').innerHTML=''; vnShow({type:'say',who:T('player'),text:o}); break; }
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

