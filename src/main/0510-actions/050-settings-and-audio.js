async function handleSettingsAndAudioAction(a,t,id,p,e){
  switch(a){
case 'pxopen': openProxySet(); break;
case 'pxsave': { const v=$('#px_url').value.trim(); if(v&&!/^https:\/\//.test(v)){ toast('https:// 로 시작하는 주소를 넣어 주세요'); break; } appStorage.setItem('ggm-proxy',v); PXHOSTS.clear(); closeModal(); render(); toast(v?'중계 서버를 저장했어요':'중계 서버를 껐어요'); break; }
case 'pxtest': { const v=$('#px_url').value.trim(); if(!v){toast('주소를 넣어 주세요');break;} t.disabled=true; try{ const r=await fetch(v.replace(/\/+$/,'')+'/?u='+encodeURIComponent('https://raw.githubusercontent.com/'+RELEASE_REPO+'/main/version.json')); toast(r.ok?'중계 서버가 잘 동작해요':'중계 서버 응답: '+r.status); }catch(e){ toast('중계 서버에 연결하지 못했어요'); } t.disabled=false; break; }
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
      const q=await aiJSON(`${pf('VOICE_SEARCH',{name:c.name,profile:c.profile,v:c.naiPrompt||'',v2:c.lines.slice(0,3).join(' / ')})}\nJSON만 출력: {"queries":["..."]}`,t,'quick');
      if(!q) break; renderVoice('목소리를 찾는 중이에요…');
      const seen=new Map();
      try{ for(const w of strs(q.queries).slice(0,6)){ for(const m of await fishSearch(w,VS.lang,10)) if(!seen.has(m._id)) seen.set(m._id,m); } }catch(e){ toast(AIERR[e&&e.code]||('검색 실패. '+((e&&e.message)||''))); }
      const list=[...seen.values()];
      if(!list.length){ VS.results=[]; renderVoice('검색 결과가 없어요. 언어를 전체로 바꾸거나 직접 검색해 보세요.'); break; }
      const cands=list.slice(0,30).map(m=>({id:m._id,title:m.title,desc:String(m.description||'').slice(0,100),tags:(m.tags||[]).slice(0,6),lang:m.languages}));
      const rk=await aiJSON(`${pf('VOICE_PICK',{name:c.name,profile:c.profile,v:c.naiPrompt||'',v2:c.lines.slice(0,3).join(' / '),v3:JSON.stringify(cands)})}\nJSON만 출력: {"picks":[{"id":"후보 id","reason":"한 줄 이유"}]}`,null,'quick');
      VS.picks={}; const order=[]; if(rk) for(const p of (rk.picks||[])){ const m=seen.get(p.id); if(m&&VS.picks[p.id]===undefined){VS.picks[p.id]=String(p.reason||'');order.push(m);} }
      VS.results=[...order,...list.filter(m=>VS.picks[m._id]===undefined)];
      renderVoice(order.length?'AI가 고른 후보가 위에 있어요. ▶로 샘플을, 대사로 이 캐릭터 대사를 들어 보세요.':''); break; }
case 'vsplay': stopVoice(); VOICE.src=t.dataset.u; VOICE.volume=SND().voiceVol; VOICE.play().catch(()=>toast('샘플을 재생하지 못했어요')); break;
case 'vstry': { const c=charById(VS.cid); t.disabled=true; await speak(Object.assign({},c,{voiceId:id}),c.intro||c.lines[0]||c.name); if(t.isConnected) t.disabled=false; break; }
case 'vspick': { const c=charById(VS.cid), m=VS.results.find(x=>x._id===id), tg=(VS.sid&&(c.skins||[]).find(x=>x.id===VS.sid))||c; tg.voiceId=id; tg.voiceName=m?m.title:id; mark('c:'+c.id); toast(tg===c?`${c.name}의 목소리를 정했어요`:`${T('skin')} 「${tg.name}」의 목소리를 정했어요`); openChar(c.id); break; }
case 'vsetid': { const v=$('#vs_id').value.trim(), m=v.match(/[0-9a-f]{32}/i); if(!m){toast('보이스 ID를 찾지 못했어요');break;} const c0=charById(VS.cid), c=(VS.sid&&(c0.skins||[]).find(x=>x.id===VS.sid))||c0; c.voiceId=m[0].toLowerCase(); c.voiceName='';
      try{ const j=okJSON(await http('https://api.fish.audio/model/'+c.voiceId,{headers:{Authorization:'Bearer '+SND().fishKey},timeout:20000})); c.voiceName=j.title||''; }catch(e){ quietErr(e,'0510-actions/050-settings-and-audio.js:74'); }
      mark('c:'+c.id); toast('목소리를 연결했어요'); openChar(c.id); break; }
case 'elcompose': { const l=libById(id), s=SND(); if(!s.elKey){toast('설정의 소리에서 ElevenLabs 키를 넣어 주세요');break;}
      const pr=(($('#li_prompt')&&$('#li_prompt').value.trim())||l.prompt||'').trim(); if(!pr){toast('음악 프롬프트를 먼저 채워 주세요');break;}
      l.prompt=pr; mark('l:'+l.id); const lb=t.textContent; t.disabled=true; t.textContent='작곡 중… 1~3분';
      try{ await elCompose(l); toast(`「${l.name}」 작곡 완료`); bgm(l.name,true); if($('#li_name')) openLibItem(l.id); }
      catch(e){ toast('작곡 실패. '+(AIERR[e&&e.code]||'')+' '+((e&&e.message)||'')); if(t.isConnected){t.disabled=false;t.textContent=lb;} } break; }
  }
}

