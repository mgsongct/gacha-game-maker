/* ===== 캐스팅: 새 게임 오프닝 전에 캐릭터마다 전신·상반신을 그려 보여 주고, 마음에 들 때까지 다시 뽑고 확정해요 ===== */
let CAST=null;
function castNeeded(){ const p=P(); return !playMode()&&!p.seenOpening&&!p.castDone&&imgReady()&&G.chars.some(c=>c.naiPrompt); }
/* NPC 관리: 이름·외모·그림 프롬프트를 고치고 스탠딩·상반신을 다시 그려요 */
const NPCBUSY=new Set();
function npcNew(name){ const id='npc_'+uid(); return {id,npc:true,name,role:'',profile:'',speech:'',look:'',naiPrompt:'',img:null,faces:[],skins:[],lines:[],touch:{head:[],body:[]},affLines:{},upper:{id:'up_'+id,kind:'upper',name:name+' 상반신',prompt:'',img:null}}; }
function npcCardHTML(n){ const st=imgSrc(n), up=n.upper&&imgSrc(n.upper), busy=NPCBUSY.has(n.id);
  return `<div class="npc-card" id="npc_${n.id}"><div class="npc-imgs"><div>${st?`<img src="${esc(st)}" alt="">`:'<span>스탠딩 없음</span>'}<i>스탠딩</i></div><div>${up?`<img src="${esc(up)}" alt="">`:'<span>상반신 없음</span>'}<i>상반신</i></div></div>
    <div class="npc-f"><div class="g2"><div><label class="f">이름</label><input class="in" data-nf="name" value="${esc(n.name)}" maxlength="20"></div><div><label class="f">역할</label><input class="in" data-nf="role" value="${esc(n.role||'')}" placeholder="예: 정보상"></div></div>
    <label class="f">설정 <span class="muted" style="font-size:.76rem">(성격·과거·누구와 어떤 사이인지, 짧게 · 스토리를 쓸 때 AI가 참고해요)</span></label><textarea class="in" data-nf="profile" style="min-height:56px" maxlength="600" placeholder="예: 항구 뒷골목의 정보상. 돈만 밝히는 척하지만 카야에게는 빚이 있어서 공짜로 정보를 준다.">${esc(n.profile||'')}</textarea>
    <label class="f">말투</label><input class="in" data-nf="speech" value="${esc(n.speech||'')}" maxlength="80" placeholder="예: 느긋한 반말, '~라구'를 붙임">
    <label class="f">외모 (한국어 메모)</label><input class="in" data-nf="look" value="${esc(n.look||'')}" placeholder="예: 은발 단발, 검은 정장, 안경">
    <label class="f">외형 프롬프트 (그림 AI 영어 태그)</label><textarea class="in" data-nf="naiPrompt" style="min-height:70px" placeholder="1girl, solo, short silver hair, glasses, black suit">${esc(n.naiPrompt||'')}</textarea>
    <div class="row" style="margin-top:6px"><button class="btn sm" data-act="npcsave" data-id="${n.id}">저장</button>${SAMPLE?`<button class="btn sm ghost" data-act="npctags" data-id="${n.id}">✦ 외모로 태그 쓰기</button>`:''}</div>
    <div class="row" style="margin-top:6px">${imgReady()?`<button class="btn sm" data-act="npcdraw" data-k="char" data-id="${n.id}" ${busy?'disabled':''}>${busy?'그리는 중…':st?'스탠딩 다시 그리기':'스탠딩 그리기'}</button><button class="btn sm ghost" data-act="npcdraw" data-k="upper" data-id="${n.id}" ${busy?'disabled':''}>${up?'상반신 다시 그리기':'상반신 그리기'}</button>`:''}<button class="btn sm ghost" data-act="upload" data-k="npc" data-id="${n.id}">스탠딩 올리기</button><button class="btn sm ghost" data-act="upload" data-k="npcup" data-id="${n.id}">상반신 올리기</button>${n.img?XBTN('npc',n.id,'','스탠딩 지우기'):''}${n.upper&&n.upper.img?XBTN('npcup',n.id,'','상반신 지우기'):''}<button class="btn sm ghost" data-act="npcdel" data-id="${n.id}">삭제</button></div></div></div>`; }
function openNpcs(){ const L=G.npcs||[]; openModal(`${head('NPC',`<span class="muted">${L.length}명 · 스토리 조연</span>`)}
    <p class="muted" style="margin:0 0 10px;font-size:.82rem">외형 프롬프트를 고치고 '저장'한 뒤 다시 그리면 새 모습으로 바뀌어요. 스토리 대본에 같은 이름으로 나오면 그 그림이 떠요.</p>
    ${L.map(npcCardHTML).join('')||'<p class="muted">아직 NPC가 없어요.</p>'}
    <div class="row" style="margin-top:10px"><input class="in" id="npc_new" placeholder="새 NPC 이름" maxlength="20" style="flex:1"><button class="btn sm" data-act="npcadd">추가</button></div>
    ${SAMPLE?`<button class="btn sm ghost block" style="margin-top:8px" data-act="npcscan">✦ 스토리에 자주 나온 인물을 NPC로 추가 (그림 프롬프트까지)</button>`:''}`); }
function npcRefresh(id){ const n=(G.npcs||[]).find(x=>x.id===id), el=document.getElementById('npc_'+id); if(n&&el){ const t=document.createElement('div'); t.innerHTML=npcCardHTML(n); el.replaceWith(t.firstElementChild); } }
function npcRead(n){ const el=document.getElementById('npc_'+n.id); if(!el) return; const old=n.name; el.querySelectorAll('[data-nf]').forEach(f=>{ n[f.dataset.nf]=f.value.trim(); }); naiBlocksSave(n,'naiPrompt',el.querySelector('[data-nf=naiPrompt]')); n.name=n.name||old; if(n.upper) n.upper.name=n.name+' 상반신'; n.naiPrompt=stripMinor(stripAge(n.naiPrompt||'')); mark('meta'); return old; }
async function npcDraw(n,k){ if(!imgReady()){ toast(imgNeed()); return; } if(!String(n.naiPrompt||'').trim()){ toast('외형 프롬프트를 먼저 적어 주세요'); return; }
  NPCBUSY.add(n.id); npcRefresh(n.id);
  try{ const it=k==='upper'?{k:'upper',o:n.upper,c:n}:{k:'char',o:n,c:n}; const b=await naiDrawItem({...it,generationMode:'manual'}); await storeImage(it.o,b,k==='upper'?'':'c:'); mark('meta'); toast(`${n.name} ${k==='upper'?'상반신':'스탠딩'}을(를) 그렸어요`); }
  catch(e){ toast(naiErr(e)); } finally{ NPCBUSY.delete(n.id); npcRefresh(n.id); } }
/* 중요한 NPC 자동 추가: 대본에 대사가 3줄 이상인데 ${'캐릭터'}·NPC가 아닌 인물을 NPC로 만들고 그림 프롬프트를 써요(그림 목록에 들어가요) */
async function autoNpcs(chs,btn){ if(!SAMPLE) return 0; const cnt={}; const skip=n=>!n||isMe(n)||findSpeaker(n)||npcBy(n)||enemyLib(n)||/^(나레이션|내레이션|해설|모두|일동|\?\?\?|목소리|소리|방송|안내)$/.test(n);
  (chs||[]).forEach(ch=>(ch.stages||[]).forEach(st=>[st.pre,st.post].forEach(t=>parseScript(t||'').forEach(L=>{ if(L.type==='say'&&!skip(L.who)) cnt[L.who]=(cnt[L.who]||0)+1; }))));
  const names=Object.entries(cnt).filter(([,n])=>n>=3).sort((a,b)=>b[1]-a[1]).map(x=>x[0]).slice(0,6); if(!names.length) return 0;
  const lines=n=>{ const out=[]; (chs||[]).forEach(ch=>(ch.stages||[]).forEach(st=>[st.pre,st.post].forEach(t=>parseScript(t||'').forEach(L=>{ if(L.type==='say'&&L.who===n&&out.length<4) out.push(L.text); })))); return out.join(' / '); };
  const r=await aiJSON(`${castRule()}다음은 스토리에 여러 번 나온 조연들이다. 대사와 세계관에 맞게 각 인물의 역할·외모와 NovelAI 그림 프롬프트를 써라. 등장인물은 모두 성인이다.\n세계관: ${String(G.world.summary||'').slice(0,300)}\n${names.map(n=>`- ${n}: ${lines(n).slice(0,200)}`).join('\n')}\n${NAI_CHAR}\nJSON만 출력: {"npcs":[{"name":"","role":"한 줄","look":"한국어 외모","naiPrompt":""}]}`,btn||null,'quick');
  let n=0; (r&&Array.isArray(r.npcs)?r.npcs:[]).forEach(x=>{ const nm=String((x&&x.name)||'').trim(); if(!names.includes(nm)||npcBy(nm)) return; const o=npcNew(nm); Object.assign(o,{role:String(x.role||''),look:String(x.look||''),naiPrompt:stripMinor(stripAge(String(x.naiPrompt||'')))}); G.npcs=G.npcs||[]; G.npcs.push(o); n++; }); if(n) mark('meta'); return n; }
function castChars(){ return [...G.chars.filter(c=>c.naiPrompt&&!(c.alt)),...(G.npcs||[]).filter(n=>n.naiPrompt)]; }
const castById=id=>charById(id)||(G.npcs||[]).find(n=>n.id===id);
function castCardHTML(c){ const q=CAST&&CAST.busy, bz=k=>q&&q.c===c.id&&q.k===k, wq=k=>CAST&&CAST.q.some(x=>x.c===c.id&&x.k===k), fs=imgSrc(c), us=c.upper&&imgSrc(c.upper), nf=(c.faces||[]).filter(f=>imgSrc(f)).length;
  const box=(k,src,lbl)=>`<div class="cast-im ${k}">${src?`<img src="${esc(src)}" alt="${esc(c.name)} ${lbl}">`:''}${bz(k)?'<span class="cast-st">그리는 중…</span>':wq(k)?'<span class="cast-st">순서 기다리는 중</span>':src?'':'<span class="cast-st">아직 없음</span>'}<b>${lbl}</b></div>`;
  return `<div class="cast-card" data-cid="${c.id}"><div class="cast-hd">${c.npc?'<span class="cast-npc">NPC</span>':`<span class="cs-rar r${c.rarity}">${RL[c.rarity]}</span>`}<b>${esc(c.name)}</b><i>${esc(c.faction||'')}</i></div>
    <div class="cast-ims">${box('full',fs,'전신')}${box('up',us,'상반신')}</div>
    ${nf?`<div class="cast-fc">${(c.faces||[]).filter(f=>imgSrc(f)).map(f=>`<span title="${esc(f.name)}"><img src="${esc((f.up&&imgSrc(f.up))||imgSrc(f))}" data-full="${esc(imgSrc(f))}" alt="${esc(f.name)}"><i>${esc(f.name)}</i></span>`).join('')}</div>`:''}
    <div class="cast-btns"><button class="btn sm ghost" data-act="castre" data-id="${c.id}" data-k="full">⟳ 전신</button><button class="btn sm ghost" data-act="castre" data-id="${c.id}" data-k="up">⟳ 상반신</button><button class="btn sm ghost" data-act="castface" data-id="${c.id}" ${fs&&!c.npc?'':'disabled'}>😊 표정${nf?' '+nf:''}</button></div></div>`; }
function showCast(){ if(!CAST) CAST={q:[],busy:null};
  const cs=castChars(); cs.forEach(c=>{ if(!imgSrc(c)&&!CAST.q.some(x=>x.c===c.id&&x.k==='full')&&!(CAST.busy&&CAST.busy.c===c.id&&CAST.busy.k==='full')) CAST.q.push({c:c.id,k:'full'}); if(c.upper&&!imgSrc(c.upper)&&!CAST.q.some(x=>x.c===c.id&&x.k==='up')&&!(CAST.busy&&CAST.busy.c===c.id&&CAST.busy.k==='up')) CAST.q.push({c:c.id,k:'up'}); });
  $('#ov').innerHTML=`<div class="setup cast-wrap"><div class="sw-bg" style="${bgStyle(P().titleBg||'')}"></div><div class="sw-card cast-sheet">
    <div class="sw-logo"><i>CASTING</i><b>${esc(G.meta.title)}</b></div>
    <p class="muted" style="margin:0 0 6px;font-size:.85rem">⟳ 다시 뽑기 · 😊 표정 · 그림을 누르면 크게</p>
    <div class="row" style="margin:0 0 6px"><button class="btn sm" data-act="castfaces">😊 표정 한꺼번에 만들기 (인페인팅)</button></div>
    <p class="muted" id="castStat" style="margin:0 0 10px;font-size:.8rem"></p>
    <div class="cast-grid" id="castGrid">${cs.map(castCardHTML).join('')}</div>
    <div class="sw-btns" style="margin-top:12px"><button class="btn" data-act="castok">이 모습으로 시작</button><button class="btn ghost" data-act="castskip">나중에 정하기</button></div>
  </div></div>`; $('#ov').hidden=false; castStat(); castRun(); }
function castFaceOpt(){ const cm=naiCfg().model||NAI_DEF.model; return {m:'inpaint',model:/^nai-diffusion-5/.test(cm)?cm:'nai-diffusion-5-full',ref:false,lv:1}; }
/* 표정 한꺼번에: 고른 캐릭터마다 얼굴 범위를 차례로 칠하고(이미 칠했으면 건너뜀), 고른 표정을 모두 인페인팅으로 줄 세워 그려요 */
let CFSEL=null;
function openCastFaces(){ const cs=castChars().filter(c=>!c.npc&&imgSrc(c)); if(!cs.length){ toast('먼저 전신을 그려 주세요'); return; } if(!CFSEL) CFSEL={faces:new Set(FACE_BASIC.filter(x=>x!=='평온')),chars:new Set(cs.map(c=>c.id)),body:'both'};
  const names=[...new Set([...FACE_BASIC,...FACE_PRESETS.map(p=>p[0])])];
  openModal(`${head('표정 한꺼번에 만들기','<span class="muted">얼굴만 다시 그리기(인페인팅)</span>')}
    <p class="muted" style="margin:0 0 8px">캐릭터마다 얼굴 범위를 한 번씩 칠하면(이미 칠했으면 건너뜀), 고른 표정을 모두 차례로 그려요. 얼굴 범위는 한 번 칠하면 모든 표정에 같이 써요.</p>
    <label class="f">표정</label><div class="chips">${names.map(n=>`<button class="chip ${CFSEL.faces.has(n)?'on':''}" data-act="cfsel" data-k="f" data-v="${esc(n)}">${esc(n)}</button>`).join('')}</div>
    <label class="f">캐릭터</label><div class="chips">${cs.map(c=>{ const nf=(c.faces||[]).filter(f=>imgSrc(f)).length; return `<button class="chip ${CFSEL.chars.has(c.id)?'on':''}" data-act="cfsel" data-k="c" data-v="${c.id}">${esc(c.name)}${nf?' · '+nf:''}</button>`; }).join('')}</div>
    <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-act="cfall" data-k="c" data-v="1">캐릭터 모두 고르기</button><button class="btn sm ghost" data-act="cfall" data-k="c" data-v="0">모두 빼기</button></div>
    <label class="f" style="margin-top:8px"><input type="checkbox" id="cf_skip" ${CFSEL.skip!==false?'checked':''}> 이미 그린 표정은 건너뛰기</label>
    <label class="f" for="cf_body">그릴 그림</label><select class="in" id="cf_body">${opt([['both','전신 + 상반신'],['full','전신만'],['up','상반신만']],CFSEL.body)}</select>
    <div class="row" style="margin-top:14px"><button class="btn" data-act="cfgo">얼굴 범위 칠하고 시작</button></div>`); }
function castFacesGo(){ CFSEL.body=$('#cf_body')?$('#cf_body').value:'both'; CFSEL.skip=$('#cf_skip')?$('#cf_skip').checked:true; if(!CAST) CAST={q:[],busy:null}; /* 게임 중(유닛 탭)에도 같은 줄로 그려요 */ const faces=[...CFSEL.faces], cs=castChars().filter(c=>CFSEL.chars.has(c.id)&&!c.npc&&imgSrc(c));
  if(!faces.length||!cs.length){ toast('표정과 캐릭터를 하나 이상 골라 주세요'); return; } closeModal();
  const jobs=[]; cs.forEach(c=>{ (CFSEL.body==='both'?['full','up']:[CFSEL.body]).forEach(b=>{ const o=b==='up'?c.upper:c; if(o&&imgSrc(o)) jobs.push({c,b,o}); }); });
  let i=0; const next=()=>{ while(i<jobs.length&&(jobs[i].c.faceMask||{})[jobs[i].b]) i++;
    if(i>=jobs.length){ let n=0; jobs.forEach(j=>{ if(!(j.c.faceMask||{})[j.b]) return; faces.forEach(name=>{ const have=(j.c.faces||[]).find(q=>q.name===name), done=have&&(j.b==='up'?have.up&&imgSrc(have.up):imgSrc(have)); if(CFSEL.skip&&done) return; if(!CAST.q.some(x=>x.c===j.c.id&&x.k==='face'&&x.name===name&&x.b===j.b)){ CAST.q.push({c:j.c.id,k:'face',name,b:j.b}); n++; } }); }); castRefresh(); toast(n?`표정 ${n}장을 차례로 그려요`:'그릴 표정이 없어요'); castRun(); return; }
    const j=jobs[i], tot=jobs.filter(x=>!(x.c.faceMask||{})[x.b]).length;
    openMaskPainter(imgSrc(j.o),null,url=>{ j.c.faceMask=Object.assign({},j.c.faceMask||{},{[j.b]:url}); mark('c:'+j.c.id); i++; next(); },{title:`${j.c.name} · ${j.b==='up'?'상반신':'전신'} 얼굴 범위 (남은 ${tot})`,onCancel:()=>{ for(let k=jobs.length-1;k>=i;k--) if(jobs[k].c===j.c) jobs.splice(k,1); next(); }}); };
  next(); }
function castStat(){ const el=$('#castStat'); if(!CAST) return; if(!el){ const n=CAST.q.length+(CAST.busy?1:0); if(n) liveBar(`😊 표정 그리는 중… 남은 ${n}장${CAST.busy&&CAST.busy.k==='face'?' · '+((castById(CAST.busy.c)||{}).name||'')+' '+CAST.busy.name:''} · 그동안 플레이해도 돼요`); else if(CAST.wasIngame){ liveBar(null); CAST.wasIngame=false; toast('표정을 모두 그렸어요'); } if(n) CAST.wasIngame=true; return; } const n=CAST.q.length+(CAST.busy?1:0); el.textContent=n?`그릴 그림 ${n}장 남음${CAST.busy&&CAST.busy.k==='face'?' · '+(castById(CAST.busy.c)||{}).name+' 표정 '+CAST.busy.name:''} · 한 장에 10~30초`:'모두 그렸어요. 마음에 들면 「이 모습으로 시작」'; }
function castRefresh(id){ const g=$('#castGrid'); if(!g){ castStat(); return; } const one=c=>{ const el=g.querySelector(`[data-cid="${c.id}"]`); if(el) el.outerHTML=castCardHTML(c); }; if(id){ const c=castById(id); if(c) one(c); } else castChars().forEach(one); castStat(); }
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
document.addEventListener('click',e=>{ const im=e.target.closest&&e.target.closest('.cast-im img,.cast-fc img,.fc-it img,.fc-two img,.sk-slot img,.sk-face img,.skp-img img,.skinpkg .wthumb img'); if(im) imgViewer(im.src); });
setInterval(()=>{ if(CAST&&$('#castGrid')&&$('#modal').hidden&&!CAST.busy) castRefresh(); },4000);



