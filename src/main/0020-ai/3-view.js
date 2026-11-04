/* ===== 0020-ai — View(HTML·DOM을 만듦) ===== */
/* src/main/0020-ai/0020-ai.js에서 옮김 */
async function copilotLogin(btn){ const box=$('#cpBox'); if(!box) return; btn.disabled=true;
  try{ const r=await http('https://github.com/login/device/code',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:{client_id:COPILOT_CID,scope:'read:user'},timeout:30000}); const j=okJSON(r);
    if(!j.device_code) throw {message:'로그인 코드를 받지 못했어요'};
    box.innerHTML=`<p style="margin:6px 0">아래 코드를 복사하고 GitHub 페이지에서 입력해 주세요. 입력하면 여기서 자동으로 이어져요.</p><div class="row"><b style="font-size:1.4rem;letter-spacing:.12em">${esc(j.user_code)}</b><button class="btn sm ghost" data-act="copy" data-text="${esc(j.user_code)}">복사</button><button class="btn sm" data-act="sylink" data-url="${esc(j.verification_uri||'https://github.com/login/device')}">GitHub 열기</button></div><p class="muted" id="cpWait" style="margin:6px 0 0;font-size:.8rem">기다리는 중…</p>`;
    let iv=Math.max(5,+j.interval||5); const until=Date.now()+(+j.expires_in||900)*1000;
    while(Date.now()<until&&$('#cpBox')){ await wait(iv*1000);
      const r2=await http('https://github.com/login/oauth/access_token',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:{client_id:COPILOT_CID,device_code:j.device_code,grant_type:'urn:ietf:params:oauth:grant-type:device_code'},timeout:30000});
      let k={}; try{ k=JSON.parse(r2.text||'{}'); }catch(e){}
      if(k.access_token){ APD.gh=k.access_token; try{ await copilotTok(APD); }catch(e){ box.innerHTML=`<p style="color:var(--rose)">${esc(e.message||'Copilot을 쓸 수 없는 계정이에요')}</p>`; return; } box.innerHTML='<p style="margin:6px 0">✓ GitHub에 로그인했어요. 모델을 고르고 저장해 주세요.</p>'; const w=$('#cpState'); if(w) w.textContent='로그인됨'; return; }
      if(k.error==='slow_down') iv+=5; else if(k.error&&k.error!=='authorization_pending'){ box.innerHTML=`<p style="color:var(--rose)">로그인에 실패했어요 (${esc(k.error)}). 다시 눌러 주세요.</p>`; return; } }
  }catch(e){ box.innerHTML=`<p style="color:var(--rose)">${esc(e.message||'GitHub에 연결하지 못했어요')}${IS_NATIVE?'':' · 웹 버전에서는 중계 서버가 필요해요'}</p>`; }
  finally{ if(btn.isConnected) btn.disabled=false; } }
function aiLogHTML(fromDraft){ const f=t=>{ const d=new Date(t); return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`; };
  return `${head('AI 기록',`<span class="muted">최근 ${AILOG.length}건 · 새 것이 위</span>`)}
  <p class="muted" style="margin:0 0 8px;font-size:.8rem">초안·스토리 생성이 안 될 때 어느 단계에서 왜 멈췄는지 볼 수 있어요. '복사'로 통째로 복사해서 제보에 붙여 주세요(API 키는 들어가지 않아요).</p>
  <div class="row" style="margin-bottom:8px">${fromDraft?'<button class="btn sm" data-act="draft-open">‹ 초안으로</button>':''}<button class="btn sm" data-act="ailogcopy">전체 복사</button><button class="btn sm ghost" data-act="ailogclear">지우기</button><button class="btn sm ghost" data-act="ailog" data-v="${fromDraft?1:''}">새로고침</button></div>
  ${AILOG.length?AILOG.map(e=>`<details class="ailog ${e.ok?'ok':'bad'}"><summary><b>${e.ok?'✓':'✗'}</b> <span>${esc(f(e.at))}</span> <i>${esc(e.stage||'')}</i> <span class="muted">${esc(e.who||'')}${e.model?' · '+esc(e.model):''}${e.tier?' · '+esc(e.tier):''}${e.ms!=null?' · '+(e.ms/1000).toFixed(1)+'초':''}</span>${e.err?`<em>${esc(e.err)}</em>`:''}</summary>
    ${e.req?`<div class="muted" style="font-size:.72rem;margin-top:4px">요청 앞부분 (${nf(e.reqLen||0)}자)</div><pre>${esc(e.req)}</pre>`:''}${e.res?`<div class="muted" style="font-size:.72rem">응답 앞·뒤부분 (${nf(e.resLen||0)}자)</div><pre>${esc(e.res)}</pre>`:''}</details>`).join(''):'<p class="muted">아직 기록이 없어요.</p>'}`; }
function pthumbHTML(id,cls){ const t=pthumb(id); return t?`<img class="pthumb ${cls||''}" src="${esc(t)}" alt="">`:''; }
// Native Android prompt can expand past the keyboard when a long code is pasted.
// Keep long text in its field and the action footer outside the scrolling body.
function openPresetCode(kind,code){
 const exporting=typeof code==='string',llm=kind==='llm',title=(llm?'지침':'그림체')+' 프리셋 '+(exporting?'코드 내보내기':'코드 가져오기'),parent=$('#modal .sheet');
 const draft=[...(parent?.querySelectorAll('input[id],textarea[id],select[id]')||[])].map(el=>({id:el.id,value:el.value,checked:el.checked})),scroll=parent?.scrollTop||0,project=PJ().active;
 openModal(`${head(title)}<div class="preset-code-body"><p class="muted preset-code-help">${exporting?'코드를 길게 눌러 복사하거나 전체 선택을 눌러 주세요.':(llm?'GGMLLM:':'GGMPACK:')+'로 시작하는 코드 전체를 붙여 넣어 주세요.'}</p><label class="preset-code-label" for="preset-code-input">프리셋 코드</label><textarea class="in" id="preset-code-input" wrap="soft" spellcheck="false" autocapitalize="off" autocomplete="off" ${exporting?'readonly':''}></textarea><p id="preset-code-error" role="alert" hidden></p></div><div class="preset-code-actions"><button type="button" class="btn ghost" data-preset-code-action="cancel">${exporting?'닫기':'취소'}</button><button type="button" class="btn" data-preset-code-action="accept" ${exporting?'':'disabled'}>${exporting?'전체 선택':'가져오기'}</button></div>`,false,'preset-code-sheet');
 const modal=$('#modal'),sheet=modal.querySelector('.preset-code-sheet'),input=sheet.querySelector('textarea'),accept=sheet.querySelector('[data-preset-code-action=accept]'),error=sheet.querySelector('[role=alert]'),previousStyle=modal.style.cssText,vv=window.visualViewport;
 input.value=exporting?code:'';
 const current=()=>sheet.isConnected&&!modal.hidden&&PJ().active===project;
 const showError=text=>{error.textContent=text;error.hidden=false;};
 const fit=()=>{if(!current())return;const height=Math.max(0,Number(vv?.height)||innerHeight);modal.style.top=(vv?.offsetTop||0)+'px';modal.style.height=height+'px';modal.style.bottom='auto';sheet.style.height=Math.min(620,Math.max(0,height-16))+'px';};
 function cleanup(){vv?.removeEventListener('resize',fit);vv?.removeEventListener('scroll',fit);removeEventListener('resize',fit);observer.disconnect();modal.style.cssText=previousStyle;}
 const observer=new MutationObserver(()=>{if(!sheet.isConnected||modal.hidden)cleanup();});observer.observe(modal,{childList:true,attributes:true,attributeFilter:['hidden'],subtree:true});
 vv?.addEventListener('resize',fit);vv?.addEventListener('scroll',fit);addEventListener('resize',fit);fit();
 input.addEventListener('input',()=>{accept.disabled=!input.value.trim();error.hidden=true;});
 let committed=false;
 sheet.addEventListener('click',event=>{
  const button=event.target.closest('[data-preset-code-action]');if(!button)return;event.stopPropagation();if(!current()||committed)return;
  if(button.dataset.presetCodeAction==='cancel'){window.navBack();return;}
  if(exporting){input.focus({preventScroll:true});uiSelectText(input);return;}
  if(!input.value.trim())return;
  if(llm){
   const item=llmFromCode(input.value);if(!item){showError('코드를 읽지 못했어요. GGMLLM:으로 시작하는 코드 전체를 확인해 주세요.');return;}
   const L=llmSlots();L.presets.push({id:'lp'+uid(),name:String(item.name||'가져온 지침').slice(0,30),pos:['top','mid','bot','tag'].includes(item.pos)?item.pos:'top',text:String(item.text),on:false});
   for(const key of ['top','mid','bot','tag']){const field=draft.find(x=>x.id==='llm_'+key);if(field)L[key]=field.value;}
   if(!saveLlm(L)){showError('저장 공간이 부족해요. 입력한 코드는 유지했어요.');return;}
  }else{
   const item=packFromCode(input.value);if(!item){showError('코드를 읽지 못했어요. GGMPACK:으로 시작하는 코드 전체를 확인해 주세요.');return;}
   item.id='u'+uid();delete item.llm;item.name=String(item.name||'받은 프리셋').slice(0,30);const items=userPacks();items.unshift(item);
   if(!saveUserPacks(items)){showError('저장 공간이 부족해요. 입력한 코드는 유지했어요.');return;}
  }
  committed=true;cleanup();window.navBack();openModal(llm?llmHTML():packHTML());
  const restored=$('#modal .sheet');for(const value of draft){const el=restored.querySelector('#'+value.id);if(el){el.value=value.value;if(el.type==='checkbox'||el.type==='radio')el.checked=value.checked;}}restored.scrollTop=scroll;
  toast(llm?'가져왔어요. 내용을 확인하고 켜 주세요':'그림체 프리셋을 추가했어요. 적용을 눌러 쓰세요');
 });
 if(!exporting)input.focus({preventScroll:true});
}
function packHTML(){ const up=userPacks();
  return `${head('그림체 프리셋','<span class="muted">적용하면 그림 AI 설정에 바로 들어가요</span>')}
  <h3 class="sec">기본 프리셋</h3>${STYLE_PRESETS.map(p=>`<div class="ep">${pthumbHTML(p.id)}<span class="t"><b>${esc(p.name)}</b><span class="muted">${esc(p.desc||'')}${p.by?' · '+esc(p.by):''}</span></span><button class="btn sm" data-act="packuse" data-v="${p.id}">적용</button><button class="btn sm ghost" data-act="pthumbset" data-v="${p.id}" title="썸네일">🖼</button>${pthumb(p.id)?`<button class="btn sm ghost" data-act="pthumbdel" data-v="${p.id}" title="썸네일 지우기">🗑</button>`:''}</div>`).join('')}
  <h3 class="sec">내 프리셋 ${up.length}</h3>${up.length?up.map(p=>`<div class="ep">${pthumbHTML(p.id)}<span class="t"><b>${esc(p.name)}</b><span class="muted">${esc(String(p.tags||'').slice(0,40))}${p.by?' · '+esc(p.by):''}</span></span><button class="btn sm" data-act="packuse" data-v="${p.id}">적용</button><button class="btn sm ghost" data-act="pthumbset" data-v="${p.id}" title="썸네일">🖼</button>${pthumb(p.id)?`<button class="btn sm ghost" data-act="pthumbdel" data-v="${p.id}" title="썸네일 지우기">🗑</button>`:''}<button class="btn sm ghost" data-act="packcopy" data-v="${p.id}">내보내기</button><button class="btn sm ghost" data-act="packdel" data-v="${p.id}">✕</button></div>`).join(''):'<p class="muted" style="margin:0">아직 없어요.</p>'}
  <div class="row" style="margin-top:12px"><button class="btn sm" data-act="packsave">지금 그림체를 프리셋으로 저장</button><button class="btn sm ghost" data-act="packimport">코드로 가져오기</button></div>`; }
/* 지침 프리셋 고치기: 입력칸에 그 프리셋을 채움(View) */
function llmPresetFormFill(x){ $('#llp_name').value=x.name||''; $('#llp_pos').value=x.pos||'top'; $('#llp_text').value=x.text||''; $('#llp_id').value=x.id; $('#llp_text').focus({preventScroll:true}); }
function llmHTML(){ const L=llmSlots(); return `${head('글 AI 지침','<span class="muted">모든 글 AI 요청에 들어가요</span>')}
  <label class="f" for="llm_top">상단 <span class="muted" style="font-size:.75rem">맨 앞 · 역할, 문체, 세계관 전반 규칙</span></label><textarea class="in" id="llm_top" style="min-height:80px" placeholder="예: 너는 서브컬처 가챠 게임 전문 시나리오 작가다. 문장은 짧고 리듬감 있게.">${esc(L.top)}</textarea>
  <label class="f" for="llm_mid">중단 <span class="muted" style="font-size:.75rem">출력 형식 바로 앞 · 내용에 대한 요구</span></label><textarea class="in" id="llm_mid" style="min-height:80px" placeholder="예: 대사마다 캐릭터의 말버릇을 한 번 이상 살린다. 장면 묘사는 2문장 이내.">${esc(L.mid)}</textarea>
  <label class="f" for="llm_bot">하단 <span class="muted" style="font-size:.75rem">맨 끝 · 마지막 확인·금지 사항</span></label><textarea class="in" id="llm_bot" style="min-height:80px" placeholder="예: 출력 전에 이름·호칭이 설정과 맞는지 다시 확인한다.">${esc(L.bot)}</textarea>
  <label class="f" for="llm_tag">그림 태그 지침 <span class="muted" style="font-size:.75rem">AI가 그림(NovelAI) 태그를 쓸 때만 · 캐릭터 외형·일러스트·CG·배경·소품·의상</span></label><textarea class="in" id="llm_tag" style="min-height:80px" placeholder="예: 의상은 색·재질·장식을 3가지 이상 구체적으로. 일러스트·CG 장면 태그에는 조명(rim light, backlighting 등)과 구도(dutch angle, from below 등)를 1개씩 넣는다. 노출이 많은 의상 태그는 쓰지 않는다.">${esc(L.tag||'')}</textarea>
  <p class="muted" style="margin:4px 0 0;font-size:.76rem">그림마다 항상 똑같이 붙일 태그는 설정 → 그림 AI의 '스탠딩 뒤·일러스트 뒤…' 칸에 적으세요(AI를 거치지 않고 그대로 붙어요).</p>
  <div class="row" style="margin-top:12px"><button class="btn" data-act="llmsave">저장</button></div>
  <h3 class="sec">지침 프리셋 <span class="muted" style="font-size:.75rem">켜 둔 것만 위 칸 뒤에 이어 붙어요</span></h3>
  ${L.presets.length?L.presets.map(x=>`<div class="ep"><label style="display:flex;gap:8px;align-items:center;flex:1;min-width:0"><input type="checkbox" data-act="llmtog" data-id="${x.id}" ${x.on?'checked':''}><span class="t"><b>${esc(x.name||'이름 없음')}</b><span class="muted">${({top:'상단',mid:'중단',bot:'하단',tag:'그림 태그'})[x.pos]||'상단'} · ${esc(String(x.text||'').slice(0,40))}</span></span></label><button class="btn sm ghost" data-act="llmpedit" data-id="${x.id}">수정</button><button class="btn sm ghost" data-act="llmpcopy" data-id="${x.id}">내보내기</button><button class="btn sm ghost" data-act="llmpdel" data-id="${x.id}">✕</button></div>`).join(''):'<p class="muted" style="margin:0 0 6px;font-size:.82rem">자주 쓰는 지침을 이름 붙여 저장해 두면 복붙 없이 켜고 끌 수 있어요.</p>'}
  <div class="optbox" style="margin-top:8px"><div class="g2"><div><label class="f" for="llp_name">이름</label><input class="in" id="llp_name" maxlength="30" placeholder="예: 문체 지침"></div><div><label class="f" for="llp_pos">자리</label><select class="in" id="llp_pos">${opt([['top','상단'],['mid','중단'],['bot','하단'],['tag','그림 태그 지침']],'top')}</select></div></div>
    <label class="f" for="llp_text">지침 내용</label><textarea class="in" id="llp_text" style="min-height:90px"></textarea><input type="hidden" id="llp_id" value="">
    <div class="row" style="margin-top:8px"><button class="btn sm" data-act="llmpadd">프리셋 저장</button><button class="btn sm ghost" data-act="llmpimport">코드로 가져오기</button></div></div>`; }
function drPresetHTML(){ const cur=DR2.preset||''; return `<label class="f">그림체 프리셋</label><div class="dr-pres">${[{id:'',name:'지금 설정 그대로',desc:'설정 → 그림 AI의 그림체를 써요'},...allPresets()].map(s=>`<button type="button" class="dr-pre ${cur===s.id?'on':''}" data-act="drpreset" data-v="${s.id}">${s.id?pthumbHTML(s.id,'big'):''}<b>${esc(s.name)}</b><span>${esc(s.desc)}${s.by?` · 프리셋 제공: ${esc(s.by)}`:''}</span></button>`).join('')}</div><p class="muted" style="margin:4px 0 0;font-size:.76rem">고르면 그림 AI 설정(그림체·품질 태그·스텝·가이던스·샘플러)에 바로 적용되고, 이 게임의 그림체로 저장돼요.</p>`; }
function applyStylePreset(id){ const s=allPresets().find(x=>x.id===id); if(!s) return; const set=(k,v)=>{ const el=$('#'+k); if(el) el.value=v; };
  const q=presetQualityParts(s); set('nai_stags',q.tags); if($('#nai_stags'))$('#nai_stags').dataset.presetApplied='true'; set('nai_sneg',s.neg); set('nai_steps',s.steps); set('nai_scale',s.scale); set('nai_cfgr',s.cfgRescale); set('nai_sampler',s.sampler);
  toast(`「${s.name}」 프리셋을 채웠어요. 아래 '저장'을 눌러야 적용돼요`);  }
function naiBlocksFieldParts(field){
 const e=typeof field==='string'?document.getElementById(field):field;if(!e)return null;
 try{const p=JSON.parse(e.dataset.naiBlocks||'null');if(p?.combined===e.value)return {...p,...naiBlocksUpgrade(p)};}catch(_){}
 return {...naiBlocksSplit(e.value),combined:e.value};
}
function naiBlocksSave(o,key,field){const p=naiBlocksFieldParts(field);if(!p)return;const e=typeof field==='string'?document.getElementById(field):field,original=o.naiBlocks?.[key]?.original??e?.dataset.naiOriginal??String(o[key]||'');
 o[key]=p.combined;o.naiBlocks={...o.naiBlocks,[key]:{...p,original}};
}
function naiBlocksSeed(field,parts){const e=typeof field==='string'?document.getElementById(field):field;if(!e)return;
 const p={...parts,...naiBlocksUpgrade(parts),combined:parts.combined??naiBlocksJoin(parts)};e.dataset.naiBlocks=JSON.stringify(p);e.value=p.combined;
}
// Lookup only runs while an editor exists. It does not migrate or save a game on load.
function naiBlocksOwner(e){
 const id=e.id;
 if(id==='f_nai'||id==='f_wp'){const cid=document.querySelector('[data-act=savechar]')?.dataset.id||document.querySelector('[data-act=savec]')?.dataset.id||e.dataset.owner;const c=charById(cid);return {o:id==='f_wp'?c?.weapon:c,key:id==='f_wp'?'prompt':'naiPrompt'};}
 if(e.dataset.nf==='naiPrompt'){const n=(G.npcs||[]).find(n=>e.closest('[id]')?.id==='npc_'+n.id||e.closest('#npc_'+n.id));return {o:n,key:'naiPrompt'};}
 if(e.dataset.dc==='tags')return {o:DR2.chars[+e.dataset.i],key:'tags'};
 if(id==='ds_all')return {o:G.meta.design,key:'all'};
 if(id.startsWith('ds_f'))return {o:{value:(G.meta.design?.fac||{})[e.dataset.fac]||'',naiBlocks:{value:G.meta.design?.facBlocks?.[e.dataset.fac]}},key:'value'};
 if(id==='nai_prefix')return {o:naiCfg(),key:'prefix'};
 if(id.startsWith('nai_p_'))return {o:naiCfg().parts[id.slice(6)],key:'suffix'};
 if(['wp_scene','il_scene','lb_scene','sc_scene','lbbg_scene'].includes(id)){const c=charById(e.closest('.cs-sheet')?.dataset.cid);return {o:id==='wp_scene'?c?.weapon:c?.[({il_scene:'illust',lb_scene:'lbcg',sc_scene:'scg',lbbg_scene:'lbbg'})[id]],key:'prompt'};}
 if(id==='v2-icon-prompt'&&typeof V2ICONS!=='undefined'){const p=V2ICONS?.preview;return {o:p&&{prompt:p.prompt,naiBlocks:{prompt:p.promptParts}},key:'prompt'};}
 if(id==='pf_nai')return {o:progRead('avatar'),key:'prompt'}; /* 플레이어 외형 칸: 진행 칸 avatar(그리기 전 처리가 늘 만들어 둠 — 0070 PROG_SLOTS tick) */
 if(id==='sk_prompt'&&document.getElementById('sk_char'))return {o:G.meta.shop?.self,key:'naiPrompt'};
 if(id==='rg_e_look')return {o:REGEN?.nc,key:'naiPrompt'};
 if(id==='li_prompt')return {o:libById(document.querySelector('[data-act=savelib]')?.dataset.id),key:'prompt'};
 if(e.dataset.skinPrompt){const c=charById(e.dataset.owner);return {o:c?.skins?.find(k=>k.id===e.dataset.skinPrompt),key:'prompt'};}
 return null;
}
function naiBlocksEditable(e){
 if(!e.matches('textarea,input')||e.type==='password'||e.type==='hidden'||e.dataset.naiPart)return false;
 if(e.dataset.naiCharacter==='true')return true;
 if(e.matches('#f_nai,#rg_e_look,#sk_prompt,[id^="np_cc"],#pf_nai,[data-nf="naiPrompt"],[data-dc="tags"],[data-skin-prompt]'))return true;
 if(e.id==='np_in')return !!NPREP&&['char','illust','lbcg'].includes(NPREP.k)||NPREP?.k==='enemy';
 if(e.dataset.candidateField==='prompt')return typeof IMAGE_CANDIDATES!=='undefined'&&IMAGE_CANDIDATES?.config?.promptBlocks===true;
 if(e.id==='li_prompt')return e.closest('.sheet')?.querySelector('[data-act=savelib]')?.dataset.k==='enemy';
 return false;
}
function naiBlocksMount(e){
 if(e._naiBlocksUI||!naiBlocksEditable(e))return;
 if(e.dataset.candidateField==='prompt'&&typeof IMAGE_CANDIDATES!=='undefined'&&IMAGE_CANDIDATES?.config?.promptParts){e.dataset.naiBlocks=JSON.stringify(IMAGE_CANDIDATES.config.promptParts);} /* 후보 그림 프롬프트 칸은 후보 설정의 블록으로 시작 */
 const key=e.id||'nai-block-'+(++naiBlocksMount.serial),origin=e.value,owner=naiBlocksOwner(e);
 if(!e.id)e.id=key;
 if(owner?.o&&!e.dataset.naiBlocks){const saved=owner.o.naiBlocks?.[owner.key];if(saved?.combined===origin)e.dataset.naiBlocks=JSON.stringify(saved);}
 e.dataset.naiOriginal=e.dataset.naiOriginal??owner?.o?.naiBlocks?.[owner.key]?.original??origin;
 const wrap=document.createElement('div');wrap.className='nai-block-editor';
 e.before(wrap);wrap.append(e);e.hidden=true;e.setAttribute('aria-hidden','true');
 const isObject=e.id==='li_prompt';
 const labels={appearance:isObject?'외형·형태':'캐릭터 외형',outfit:'의상·착용 장신구',other:'표정·자세·장면 / 미분류',style:'그림체·품질'};
 for(const k of NAI_BLOCK_KEYS){const label=document.createElement('label');label.className='f';label.htmlFor=key+'__'+k;label.textContent=labels[k];
  const input=document.createElement('textarea');input.className='in';input.id=label.htmlFor;input.dataset.naiPart=k;input.rows=2;input.spellcheck=false;
  input.placeholder=k==='appearance'?(isObject?'물건의 모양·재질·색, 몬스터의 생김새':'머리·눈·피부·체형·종족 등 변하지 않는 특징'):k==='outfit'?'옷·신발·모자·착용 장식 (해당 없으면 비워 두세요)':k==='style'?'작가·화풍·채색·선화·품질 태그':'표정·행동·구도·배경·효과·분류가 애매한 태그';wrap.append(label,input);
 }
 const help=document.createElement('p');help.className='muted nai-block-help';help.textContent='네 칸을 합쳐 그림 AI에 전달해요. 기존 태그와 가중치는 보존하며, 애매한 태그는 미분류 칸에서 확인해 주세요.';wrap.append(help);
 const details=document.createElement('details'),summary=document.createElement('summary'),raw=document.createElement('pre');summary.textContent='프롬프트 한 번에 보기';raw.textContent=origin;details.append(summary,raw);wrap.append(details);
 const native=Object.getOwnPropertyDescriptor(e instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value'),fields=Object.fromEntries(NAI_BLOCK_KEYS.map(k=>[k,wrap.querySelector('[data-nai-part="'+k+'"]')]));
 const paint=()=>{raw.textContent=e.value;const p=naiBlocksFieldParts(e);for(const k of NAI_BLOCK_KEYS)fields[k].value=p[k]||'';};
 Object.defineProperty(e,'value',{configurable:true,get(){return native.get.call(this);},set(v){native.set.call(this,v);paint();}});
 wrap.addEventListener('input',event=>{if(!event.target.dataset.naiPart)return;const p=Object.fromEntries(NAI_BLOCK_KEYS.map(k=>[k,fields[k].value]));p.combined=naiBlocksJoin(p);e.dataset.naiBlocks=JSON.stringify(p);native.set.call(e,p.combined);raw.textContent=p.combined;});
 e._naiBlocksUI=wrap;paint();
}
function naiBlocksScan(root=document){for(const e of root.querySelectorAll('textarea,input'))naiBlocksMount(e);}
function aiProfilesHTML(){
  const A=AIP(); if(!A.list.length) return '<p class="muted">아직 등록된 AI가 없어요.</p>';
  return A.list.map(p=>{const on=p.id===A.active||(!A.list.some(x=>x.id===A.active)&&p===A.list[0]);const dm=DEFM[defKey(p)]||[''];
    return `<div class="ep"><span class="t"><b>${esc(p.name||AITYPE[p.type])} ${on?'<span class="badge r3c">사용 중</span>':''}</b><span class="muted">${AITYPE[p.type]}${p.type==='vertex'?(p.pub==='anthropic'?' · Claude':' · Gemini'):''} · ${esc(p.model||dm[0]||'모델 미지정')}${apValid(p)?'':' · 설정 미완료'}</span></span>${on?'':`<button class="btn sm" data-act="apuse" data-id="${p.id}">사용</button>`}<button class="btn sm ghost" data-act="apedit" data-id="${p.id}">편집</button></div>`;}).join('');
}
function apForm(d){
  const dm=DEFM[defKey(d)]||['',''], sg=MODEL_SUGG[defKey(d)]||[];
  const f=(id,label,val,ph,type='text',list)=>`<label class="f" for="${id}">${label}</label><input class="in" id="${id}" type="${type}" autocomplete="off" value="${esc(val||'')}" placeholder="${esc(ph||'')}" ${list?`list="${list}"`:''}>`;
  let fields='',help='';
  if(d.type==='anthropic'){ fields=f('ap_key','API 키',d.key,'sk-ant-...','password'); help='console.anthropic.com → API Keys에서 만들어요.'; }
  if(d.type==='gemini'){ fields=f('ap_key','API 키',d.key,'AIza...','password'); help='aistudio.google.com → Get API key에서 만들어요. 무료 사용량이 있어요.'; }
  if(d.type==='openai'){ fields=`<div class="chips ap-pre">${OAI_PRESETS.map((x,i)=>`<button class="chip" data-act="appre" data-i="${i}">${esc(x[0])}</button>`).join('')}</div>`+f('ap_base','API 주소',d.base,'https://openrouter.ai/api/v1')+f('ap_key','API 키',d.key,'','password'); help=(OAI_PRESETS.find(x=>normBase(x[1])===normBase(d.base))||[])[3]||'OpenRouter, DeepSeek, Ollama, LM Studio 등 OpenAI 방식 API예요. 위 버튼으로 주소를 채울 수 있어요. 주소는 /chat/completions 앞부분까지, 모델 이름은 그 서비스에 나온 이름을 그대로 써요.'; }
  if(d.type==='copilot'){ fields=`<div class="optbox" style="margin-top:8px"><div class="row"><b style="flex:1">GitHub 계정 · <span id="cpState">${d.gh?'로그인됨':'로그인 안 됨'}</span></b><button class="btn sm" data-act="cplogin">${d.gh?'다시 로그인':'GitHub로 로그인'}</button></div><div id="cpBox"></div></div>`; help='GitHub Copilot 구독(무료 플랜 포함)이 있는 계정으로 로그인하면 Copilot에 들어 있는 모델(GPT·Claude·Gemini)을 써요. 공식 API가 아닌 비공식 연결 방식이라 GitHub 정책에 따라 막히거나 계정에 제한이 생길 수 있어요. 무료 플랜은 사용량이 적어요. 웹 버전에서는 중계 서버가 필요해요.'; }
  if(d.type==='vertex'){
    fields=`<label class="f" for="ap_pub">모델 종류</label><select class="in" id="ap_pub">${opt([['google','Gemini'],['anthropic','Claude (Model Garden)']],d.pub||'google')}</select>
      <label class="f" for="ap_sa">서비스 계정 키 (JSON 파일 내용 전체)</label><textarea class="in" id="ap_sa" placeholder='{"type": "service_account", "project_id": ...}'>${esc(d.sa||'')}</textarea>
      <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-act="saload">JSON 파일 불러오기</button></div>
      <div class="g2"><div>${f('ap_region','리전',d.region,'global')}</div><div>${f('ap_project','프로젝트 ID (비우면 JSON에서)',d.project,'')}</div></div>
      ${(d.pub||'google')==='google'?f('ap_vkey','또는 익스프레스 API 키 (Gemini 전용, 서비스 계정 대신)',d.vkey,'','password'):''}`;
    help=(d.pub==='anthropic')?'Google Cloud 콘솔 → IAM 및 관리자 → 서비스 계정 → 키 추가 → JSON. 계정에 Vertex AI 사용자 역할이 필요해요. Model Garden에서 Claude 모델을 먼저 사용 설정하고, 모델 이름은 Model Garden에 나온 ID를 그대로 써요.'
      :'Google Cloud 콘솔 → IAM 및 관리자 → 서비스 계정 → 키 추가 → JSON. 계정에 Vertex AI 사용자 역할이 필요해요. 익스프레스 모드 API 키가 있으면 서비스 계정 없이 그것만 넣어도 돼요.';
  }
  return `<label class="f" for="ap_type">종류</label><select class="in" id="ap_type">${opt(Object.entries(AITYPE),d.type)}</select>
    ${f('ap_name','이름 (구분용)',d.name,'예: 버텍스 제미니')}
    ${fields}
    <datalist id="ap_ml">${sg.map(m=>`<option value="${esc(m)}">`).join('')}</datalist>
    <div class="g2"><div>${f('ap_model','기본 모델 (직접 입력 가능)',d.model,dm[0]||'모델 ID','text','ap_ml')}</div><div>${f('ap_quick','빠른 모델 (짧은 작업용)',d.quick,dm[1]||'비우면 기본 모델','text','ap_ml')}</div></div>
    <p class="muted" style="margin-top:8px">${help} 모델 칸을 누르면 추천 목록이 나오고, 다른 모델 ID도 직접 쓸 수 있어요. 비우면 흐린 글씨의 기본값을 써요.</p>`;
}
function readAp(){
  const v=id=>{const el=$('#'+id);return el?el.value.trim():undefined;};
  const d=APD;
  [['name','ap_name'],['key','ap_key'],['base','ap_base'],['pub','ap_pub'],['sa','ap_sa'],['region','ap_region'],['project','ap_project'],['vkey','ap_vkey'],['model','ap_model'],['quick','ap_quick']].forEach(([k,id])=>{const x=v(id);if(x!==undefined)d[k]=x;});
  if(d.base) d.base=normBase(d.base);
  if(!d.name) d.name=AITYPE[d.type];
  return d;
}
function openAp(){
  const d=APD;
  openModal(`${head(d.id?'AI 편집':'AI 추가')}
    ${apForm(d)}
    <div class="row" style="margin-top:14px"><button class="btn" data-act="apsave">저장</button><button class="btn ghost" data-act="aptest">연결 테스트</button>${d.id?`<button class="btn ghost" data-act="apdel">삭제</button>`:''}</div>`);
}
