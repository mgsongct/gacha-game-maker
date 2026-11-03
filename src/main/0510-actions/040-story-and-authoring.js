async function handleStoryAndAuthoringAction(a,t,id,p,el){
  switch(a){
case 'cxcat': CXCAT=t.dataset.v; render(); break;
case 'cxview': openCx(t.dataset.k); break;
case 'cxadd': openCxEdit(''); break;
case 'relopen': case 'relgo': openRel(t.dataset.r||REL_ME); break;
case 'relseed': { const n=await relSeedAI(t); if(n){ toast(`관계 ${n}개를 정리했어요`); openRel(); } break; }
case 'reladd': { const bn=$('#rl_b').value, k=$('#rl_k').value.trim(), nt=$('#rl_n').value.trim(); if(!bn||bn===RELC) break; if(!k&&!nt){ toast('관계나 설명을 적어 주세요'); break; }
      let r=relPair(RELC,bn); if(r){ if(k) r.kind=k; if(nt) r.note=nt; } else { r={id:'r'+uid(),a:RELC,b: bn,kind:k||'아는 사이',note:nt,hist:[]}; RELS().push(r); } r.at=Date.now(); mark('meta'); openRel(); break; }
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
case 'evspoke': { const c=charById(id); if(!c) break; const o=own(c.id), lv=o?affLv(o):1, r=t.getBoundingClientRect(), y=el.clientY||r.top+r.height/2, zone=(y-r.top)/r.height<0.3?'head':'body';
      ripple(el.clientX||r.left+r.width/2,y,lv>=7); charReact(t.querySelector('.art'),lv,zone); faceSwap(c,t.querySelector('.art'),touchFace(c,zone,lv));
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
        const kb=G.banners.find(bn=>bn.id===ev.bannerId), nb=G.banners.find(bn=>bn.id===ne.bannerId), keepPU=ev.pickupFor&&charById(ev.pickupFor)?[ev.pickupFor]:[];
        if(kb&&nb) kb.pickup=[...new Set([...keepPU,...(nb.pickup||[])])].filter(x=>charById(x)).slice(0,3); else if(kb) kb.pickup=(kb.pickup||[]).filter(x=>charById(x)&&x!==oldGift);
        ev.gift=ne.gift||''; if(kb&&ne.desc&&!ev.pickupFor) kb.desc=String(ne.desc);
        // 새 장을 이 이벤트에 옮기고, 새로 생긴 이벤트·배너는 지워요(배너·교환소·토큰은 그대로)
        nch.ord=oldCh.ord; nch.eventId=ev.id; G.chapters=G.chapters.filter(c=>c!==oldCh); G.threads=G.threads.filter(t=>!(t.trigger&&oldCh.stages.some(s0=>s0.id===t.trigger.value)));
        oldCh.stages.forEach(s0=>{ delete P().cleared[s0.id]; }); ev.chapterId=nch.id; ev.title=ne.title; ev.desc=ne.desc; ev.gen={dir,n,len,lore:loreOf(ev)};
        G.events=G.events.filter(x=>x!==ne); G.banners=G.banners.filter(bn=>bn.id!==ne.bannerId); markAll(); mark('prog');
        return {title:`이벤트 스토리 「${ev.title}」로 다시 썼어요`,body:`${T('event')} 화면에서 처음부터 플레이할 수 있어요.`}; }); break; }
case 'stamopen': openStam(0); break;
case 'stamfill': { if(P().gems<STAM_FILL[0]) break; pay({gems:STAM_FILL[0]}); const s=stam(); s.v+=STAM_FILL[1]; mark('prog'); closeModal(); render(); toast(`⚡ ${STAM_FILL[1]} 회복 (${s.v}/${STAM_MAX})`); break; }
case 'stamtog': { const st=P().settings; st.stamina=!t.checked?false:true; mark('prog'); updStam(); toast(st.stamina?'행동력을 켰어요':'행동력을 껐어요(전투 무제한)'); break; }
case 'scimg': { const ta=$('#'+t.dataset.ta); if(!ta) break; uploadFor={kind:'scimg',ta:ta.id,pos:ta.selectionStart}; $('#file').click(); break; }
case 'charedit': openCharEdit(id); break;
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
      if(sh.length) ev.shop=sh; const bn=G.banners.find(x=>x.id===ev.bannerId); if(bn) bn.active=ev.active; mark('prog'); closeModal(); render(); break; }
case 'evdel': { const ev=G.events.find(e=>e.id===id); if(!ev) break; const ch0=G.chapters.find(c=>c.id===ev.chapterId);
      openStoryDel({title:'이벤트 「'+ev.title+'」',ids:ch0?ch0.stages.map(s=>s.id):[],ch:ch0,ev,back:()=>openEvEdit(id),after:()=>{ tab='event'; },run:()=>{ G.events=G.events.filter(e=>e.id!==id); G.chapters=G.chapters.filter(c=>c.id!==ev.chapterId); mark('ch:'+ev.chapterId); G.banners=G.banners.filter(b=>b.id!==ev.bannerId); }}); break; }
case 'dreroll': { const bn=DBOARD(); if(bn.rr){ if(P().gold<2000){ toast('크레딧이 부족해요'); break; } P().gold-=2000; } bn.rr=(bn.rr||0)+1; bn.list=bn.list.map(o=>P().disp[o.id]?o:null); bn.list=bn.list.map(o=>o||dispOffer(bn.list.filter(Boolean).map(x=>x.name))); mark('prog'); render(); toast('새 의뢰가 올라왔어요'); break; }
case 'meta-open': openMeta(); break;
case 'metasave': { if($('#ng_story')&&$('#ng_story').value.trim().length>100000){toast('스토리는 최대 100,000자입니다. 초과 내용은 자르지 않았습니다.');break;}const m=G.meta, old=m.elems.map(e=>e.n); if($('#mt_logo')) m.logoStyle=$('#mt_logo').value; if($('#ng_story')) m.story=readStoryForm(); if($('#mt_cast')) m.castSex=$('#mt_cast').value; if($('#mt_tone')) m.tone=$('#mt_tone').value.trim(); if($('#mt_art')){ m.artTags=$('#mt_art').value.trim(); m.artNeg=$('#mt_artn').value.trim(); }
      m.title=$('#mt_title').value.trim()||m.title; m.sub=$('#mt_sub').value.trim(); m.theme=$('#mt_theme').value; m.accent=$('#mt_acc').value;
      Object.keys(DEFAULT_META.terms).forEach(k=>{const v=$('#mt_t_'+k).value.trim(); if(k==='abyss')m.terms[k]=explorationName(v);else if(v)m.terms[k]=v;});
      m.elems=m.elems.map((e0,i)=>({n:($('#mt_e'+i)?.value||'').trim()||old[i],c:$('#mt_c'+i)?.value||e0.c,d:e0.d||''})); // 속성 개수·설명은 게임 규칙 화면에서 // 설명(d)은 게임 규칙 화면에서 편집
      const map={}; old.forEach((o,i)=>{map[o]=m.elems[i].n;}); rulesRename(map);
      G.chars.forEach(c=>{if(map[c.elem])c.elem=map[c.elem];}); G.chapters.forEach(ch=>ch.stages.forEach(st=>st.enemies.forEach(en=>{if(map[en.elem])en.elem=map[en.elem];})));
      ['atk','def','sup'].forEach(k=>{m.roles[k]=$('#mt_r_'+k).value.trim()||m.roles[k];}); m.farms.forEach((f,i)=>{f.name=$('#mt_f'+i).value.trim()||f.name;});
      const pj=PJ(); const me=pj.list.find(x=>x.id===pj.active); if(me){me.title=m.title;appStorage.setItem(PJKEY,JSON.stringify(pj));}
      markAll(); applyMeta(); closeModal(); render(); toast('게임 정의를 저장했어요'); break; }
case 'draft-open': openDraft(); break;
case 'drlib': { drRead(); const ex=$('#drLib'); if(ex){ ex.remove(); break; } const top=document.querySelector('#drPage .dr-top'); if(top) top.insertAdjacentHTML('afterend',drLibHTML()); break; }
case 'drlibsave': { drRead(); const nm=prompt('초안 이름',drName(DR2)); if(nm===null) break; const a=drLib(), name=nm.trim()||drName(DR2), old=a.find(x=>x.name===name);
      if(old&&!(await appConfirm(`「${name}」 초안을 덮어쓸까요?`))) break; const rec={id:old?old.id:'d'+uid(),name,at:Date.now(),d:drClean(DR2)}; const bn=a.filter(x=>x!==old); bn.unshift(rec); if(drLibSave(bn)){ toast('초안을 저장했어요'); const ex=$('#drLib'); if(ex) ex.outerHTML=drLibHTML(); } break; }
case 'drlibload': { const x=drLib().find(y=>y.id===id); if(!x) break; drRead(); if(drText(DR2).trim()&&!(await appConfirm('지금 쓰던 초안 대신 불러올까요? (지금 초안은 먼저 보관함에 저장해 두세요)'))) break; drLoadFrom(x.d,x.name); break; }
case 'drreuseoff': drRead(); delete DR2.reuse; drSave(); openDraft(); toast('그림을 새로 그리는 초안으로 바꿨어요'); break;
case 'drxcur': drRead(); openDraftExport(drName(DR2),DR2,()=>{ openDraft(); }); break;
case 'drxlib': { const x=drLib().find(y=>y.id===id); if(x){ drRead(); openDraftExport(x.name,x.d,()=>openDraft()); } break; }
case 'drxcopy': { const tx=$('#drx_code').value; try{ await navigator.clipboard.writeText(tx); toast('초안 코드를 복사했어요'); }catch(e){ const ta=$('#drx_code'); uiSelectText(ta); try{ document.execCommand('copy'); toast('초안 코드를 복사했어요'); }catch(_){ toast('길게 눌러 직접 복사해 주세요'); } } break; }
case 'drxfile': { if(!DRX) break; await saveTextFile(JSON.stringify({v:1,name:DRX.name,d:drClean(DRX.d)},null,1),'초안_'+String(DRX.name).replace(/[^\w가-힣-]+/g,'_').slice(0,30)+'.json'); break; }
case 'drxback': { const bn=DRX&&DRX.back; DRX=null; if(bn) bn(); else if($('#dri_code')) openDraft(); else closeModal(); break; }
case 'drimport': drRead(); openDraftImport(); break;
case 'drigo': draftImportDone(draftFrom($('#dri_code').value),$('#dri_load').checked); break;
case 'drifile': $('#drfile').click(); break;
case 'drlibdel': { const a=drLib(), x=a.find(y=>y.id===id); if(!x||!(await appConfirm(`「${x.name}」 초안을 지울까요?`))) break; drLibSave(a.filter(y=>y!==x)); const ex=$('#drLib'); if(ex) ex.outerHTML=drLibHTML(); break; }
case 'drtab': drRead(); DRTAB=t.dataset.k; document.querySelectorAll('#drPage [data-dr]').forEach(s=>s.hidden=s.dataset.dr!==DRTAB); document.querySelectorAll('#drPage [data-act=drtab]').forEach(b=>b.classList.toggle('on',b.dataset.k===DRTAB)); break;
case 'drcadd': drRead(); DR2.chars.push({name:'',role:'',profile:'',speech:'',look:'',tags:''}); drSave(); drRerender(); break;
case 'drcdel': drRead(); DR2.chars.splice(+t.dataset.i,1); drSave(); drRerender(); break;
case 'drmode': drRead(); DR2.mode=t.dataset.v||''; drSave(); openDraft(); break;
case 'drpreset': { drRead(); const v=t.dataset.v||''; DR2.preset=v; drSave(); if(v){ const sp=allPresets().find(x=>x.id===v); if(presetToCfg(v)) toast(`「${sp.name}」 그림체를 적용했어요`); } document.querySelectorAll('.dr-pre').forEach(b=>b.classList.toggle('on',(b.dataset.v||'')===v)); break; }
case 'drautoex': { const el=$('#dr_auto'); if(el){ el.value=t.dataset.v; drRead(); } break; }
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
  }
}

