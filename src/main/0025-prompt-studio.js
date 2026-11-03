/* ===== 프롬프트 스튜디오 ===== */
/* 흩어진 프롬프트 조각을 한곳에서 보고(조각 목록), 게임마다 고쳐 쓰고(덮어쓰기·덧붙이기), AI로 다듬고,
   그림 프롬프트를 점검·정정하고, 정정한 내용을 "교훈"으로 쌓아 다음 요청부터 같은 실수를 막아요.
   - 조각: pfDef(id,label,get)로 등록 → window[id] 게터가 promptFrag(id)를 돌려줌. 덮어쓰기는 G.meta.prompts[id]={text,add}
   - 그림 가드: imgGuard(kind,tags) — 배경·소품·지도·아이콘에서 사람 태그를 빼고 "no humans" 머리말을 붙임(composeNai에서 항상 실행)
   - 교훈: appStorage 'ggm-plessons' (모델 버릇은 게임이 아니라 AI에 딸리므로 전체 공통). 가드가 고칠 때마다 hits가 오르고,
     켜진 교훈은 그림 태그 요청(TAG_REQ)이나 모든 요청(scope:'all')에 llmWrap이 끼워 넣음
   문서: docs/research/prompts.md */
function pfDef(id,label,get,where){ const R=window.__PF||(window.__PF={}); R[id]={id,label,get,where:where||''}; Object.defineProperty(window,id,{get:()=>promptFrag(id),configurable:true}); }
function promptOv(){ try{ return (G&&G.meta&&G.meta.prompts)||{}; }catch(e){ return {}; } } // G는 0070에서 생겨요(그 전 호출은 기본값)
function promptFrag(id){ const f=(window.__PF||{})[id]; if(!f) return ''; const base=f.get(), o=promptOv()[id]; if(!o) return base; const t=o.text&&o.text.trim()?o.text:base; return o.add&&o.add.trim()?t+'\n'+o.add.trim():t; }

/* 그림 프롬프트 가드: 사람이 나오면 안 되는 그림에서 사람 태그를 빼요 */
const IMG_NOHUMAN={bg:'no humans, scenery',map:'no humans, scenery',prop:'no humans, object focus',icon:'no humans, object focus'};
const PERSON_TAG=/^(\d+\+?(girls?|boys?|others?)|solo|solo focus|multiple (girls|boys|others)|couple|crowd|people|person|human|character|girl|boy|woman|man|female|male|child|loli|shota|.* (hair|eyes|pupils|ears|bangs|sidelocks|ahoge)|(long|short|medium|very long) hair|ponytail|twintails|braids?|hair (ornament|ribbon|bun|between eyes)|bangs|smile|smiling|blush|open mouth|closed mouth|closed eyes|expressionless|.*(face|lips|teeth|tongue)|looking at viewer|looking (back|away|up|down)|standing|sitting|kneeling|lying|walking|running|arms? (up|crossed|behind back|at sides)|hands? (up|on hips)|holding.*|(full|upper|lower) body|cowboy shot|portrait|close-up|from (behind|side)|breasts|.*(breasts|thighs|legs|arms|navel|cleavage)|thighhighs|pantyhose|bare (shoulders|legs|arms)|.* (dress|skirt|shirt|uniform|jacket|coat|gloves|boots|stockings))$/i;
function imgGuard(kind,s){ const k=kind==='weapon'?'prop':kind, pre=IMG_NOHUMAN[k]; if(!pre) return {out:String(s||''),removed:[]};
  const removed=[], keep=tagList(s).filter(t=>{ const x=tagKey(t); if(PERSON_TAG.test(x)&&!(k==='prop'&&/(dress|skirt|shirt|uniform|jacket|coat|gloves|boots|ribbon|hair ornament)$/.test(x))){ removed.push(t); return false; } return true; });
  return {out:joinTags(pre,keep.join(', ')),removed}; }

/* 교훈(정정 기록 → 다음부터 지침으로) */
const PL_KEY='ggm-plessons';
const PL_SEED={
 'img-person-bg':{scope:'img',rule:'배경(backgrounds·배경 프롬프트)은 사람이 없는 풍경이다. "no humans, scenery"로 시작하고 장소·시간·날씨·조명·사물 태그만 쓴다. 1girl, solo, 머리·눈·의상·표정·자세 태그를 쓰지 않는다.'},
 'img-person-prop':{scope:'img',rule:'소품·아이템·무기 프롬프트는 물건 하나만 그린다. "no humans, object focus"로 시작하고 재질·모양·색·장식 태그만 쓴다. 들고 있는 사람(holding, 1girl, hands)이나 인물 태그를 쓰지 않는다.'},
 'img-person-map':{scope:'img',rule:'지도 그림은 사람 없는 지도·조감도다. "no humans, scenery"로 시작한다.'},
 'img-person-icon':{scope:'img',rule:'아이콘은 사람 없는 물건 하나다. "no humans, object focus"로 시작한다.'}};
function plList(){ try{ const a=JSON.parse(appStorage.getItem(PL_KEY)||'[]'); return Array.isArray(a)?a:[]; }catch(e){ return []; } }
function plSave(a){ try{ appStorage.setItem(PL_KEY,JSON.stringify(a.slice(0,60))); }catch(e){} }
function plHit(id,ex){ const a=plList(); let x=a.find(l=>l.id===id); if(!x){ const s=PL_SEED[id]; if(!s) return; x={id,scope:s.scope,rule:s.rule,on:true,hits:0,at:Date.now(),auto:true}; a.unshift(x); } x.hits=(x.hits||0)+1; x.last=Date.now(); if(ex) x.ex=String(ex).slice(0,160); plSave(a); }
function plAdd(rule,scope){ const a=plList(); a.unshift({id:'u'+uid().slice(0,6),scope:scope==='all'?'all':'img',rule:String(rule).trim().slice(0,400),on:true,hits:0,at:Date.now()}); plSave(a); }
// llmWrap에서 씀: 그림 태그 요청이면 그림 가이드 + 그림 교훈, 모든 요청에 scope:'all' 교훈
function plInject(isTag){ const on=plList().filter(l=>l.on&&(l.scope==='all'||isTag)); const g=isTag?IMG_GUIDE:''; if(!on.length&&!g) return ''; return `[프롬프트 교훈] 이전에 고친 실수를 되풀이하지 않는다:\n${g?g+'\n':''}${on.map(l=>'- '+l.rule).join('\n')}\n`; }
pfDef('IMG_GUIDE','그림 태그 공통 가이드(그림 태그를 쓰는 모든 요청에 자동으로 들어감)',()=>'- 그림 종류마다 태그 대상이 다르다. 캐릭터(naiPrompt)=외모만. CG=장소·구도·행동·분위기(외모 제외). 배경=사람 없는 풍경("no humans, scenery"로 시작). 소품·아이템·무기·아이콘=물건 하나("no humans, object focus"로 시작, 사람·손·holding 금지).\n- 태그는 쉼표로 나눈 영어 Danbooru 태그. 문장·한국어·설명을 쓰지 않는다.','llmWrap');

/* 그림 프롬프트 점검: 자료실(배경·소품)과 무기 프롬프트에서 사람 태그 찾기 */
function imgAuditScan(){ const out=[]; G.lib.forEach(l=>{ if(IMG_NOHUMAN[l.kind]&&l.prompt){ const g=imgGuard(l.kind,l.prompt); if(g.removed.length) out.push({o:l,kind:l.kind,name:l.name,cur:l.prompt,fix:g.out,removed:g.removed}); } });
  G.chars.forEach(c=>{ if(c.weapon&&c.weapon.prompt){ const g=imgGuard('prop',c.weapon.prompt); if(g.removed.length||wpBad(c.weapon.prompt)) out.push({o:c,kind:'weapon',name:c.name+' · '+(c.weapon.name||T('weapon')),cur:c.weapon.prompt,fix:g.out,removed:g.removed}); } }); return out; }
function imgAuditFix(list){ auditSnap(list.map(x=>x.o),'그림 프롬프트 정리'); list.forEach(x=>{ if(x.kind==='weapon'){ x.o.weapon.prompt=x.fix; mark('c:'+x.o.id); } else { x.o.prompt=x.fix; mark('l:'+x.o.id); } plHit('img-person-'+(x.kind==='weapon'?'prop':x.kind),x.cur); }); return list.length; }

/* AI 기록 분석: 실패가 잦은 단계와 오류 */
function aiLogStats(){ const by={}; AILOG.forEach(e=>{ const k=e.stage||'기타', o=by[k]||(by[k]={stage:k,n:0,fail:0,errs:{}}); o.n++; if(!e.ok){ o.fail++; const m=String(e.err||'오류').slice(0,60); o.errs[m]=(o.errs[m]||0)+1; } }); return Object.values(by).sort((a,b)=>b.fail-a.fail||b.n-a.n); }

/* 화면 */
let PS_TAB='frag';
function promptPanel(){ const ov=Object.keys(promptOv()).length, pl=plList().filter(l=>l.on).length, bad=imgAuditScan().length;
  return `<div class="panel pm-hide"><h3>프롬프트 스튜디오 ${bad?`<span class="badge">그림 ${bad}</span>`:''}</h3><p class="muted" style="margin:0 0 6px">AI에 보내는 프롬프트 조각 ${Object.keys(window.__PF||{}).length}개${ov?` · 고친 조각 ${ov}`:''} · 교훈 ${pl}개. 조각을 고치고 다듬거나, 그림 프롬프트(배경·소품에 사람이 나오는 문제 등)를 점검·정정하고, 고친 내용을 교훈으로 쌓아 반복을 막아요.</p><button class="btn sm" data-act="pstopen">프롬프트 스튜디오</button></div>`; }
function openStudio(tab){ if(tab) PS_TAB=tab; const tabs=[['frag','조각'],['img','그림 점검'],['lesson','교훈'],['log','AI 기록']], ov=promptOv();
  let body='';
  if(PS_TAB==='frag') body=Object.values(window.__PF||{}).map(f=>{ const o=ov[f.id]||{}; return `<details class="panel" style="padding:8px;margin:6px 0"><summary><b>${esc(f.label)}</b> <span class="muted">${esc(f.id)}${o.text?' · 덮어씀':''}${o.add?' · 덧붙임':''}</span></summary>
    <div style="font-size:.78rem;margin:6px 0 2px">기본</div><pre style="white-space:pre-wrap;font-size:.75rem;max-height:140px;overflow:auto;margin:0">${esc(f.get())}</pre>
    <label class="f">덮어쓰기 (비우면 기본)</label><textarea class="in" rows="3" data-pf="${f.id}" data-k="text">${esc(o.text||'')}</textarea>
    <label class="f">덧붙이기 (기본 뒤에 추가)</label><textarea class="in" rows="2" data-pf="${f.id}" data-k="add">${esc(o.add||'')}</textarea>
    <div class="row" style="gap:6px;margin-top:6px"><button class="btn sm" data-act="pstsave" data-id="${f.id}">저장</button><button class="btn sm ghost" data-act="pstai" data-id="${f.id}">AI로 다듬기 제안</button>${o.text||o.add?`<button class="btn sm ghost" data-act="pstreset" data-id="${f.id}">기본으로</button>`:''}</div></details>`; }).join('');
  else if(PS_TAB==='img'){ const L=imgAuditScan(); body=`<p class="muted" style="font-size:.82rem">배경·소품·지도·아이콘·${T('weapon')} 그림에는 사람이 나오면 안 돼요. 성능이 낮은 AI가 이런 프롬프트에 인물 태그(1girl, 머리·눈·의상)를 섞으면 모두 사람 그림이 돼요. 그릴 때는 앱이 항상 걸러 내지만(그림 가드), 저장된 프롬프트도 정리해 두면 좋아요. 정리하면 교훈으로 기록돼 다음 생성부터 AI에 주의를 줘요.</p>
    ${L.length?L.map(x=>`<div class="panel" style="padding:8px;margin:6px 0;font-size:.8rem"><b>${esc(x.name)}</b> <span class="muted">${esc(x.kind)}</span><div class="muted">지금: ${esc(x.cur)}</div><div>정리: ${esc(x.fix)}</div>${x.removed.length?`<div style="color:var(--bad,#c55)">뺄 태그: ${esc(x.removed.join(', '))}</div>`:''}</div>`).join('')+`<button class="btn" data-act="pstimgfix">모두 정리 (${L.length})</button>`:'<p>문제 있는 그림 프롬프트가 없어요 ✓</p>'}${AUDIT_UNDO?`<button class="btn ghost" data-act="pstundo">되돌리기: ${esc(AUDIT_UNDO.label)}</button>`:''}`; }
  else if(PS_TAB==='lesson'){ const L=plList(); body=`<p class="muted" style="font-size:.82rem">고친 실수를 규칙으로 쌓아 두는 곳이에요. 켜진 교훈은 AI 요청에 자동으로 들어가요(그림: 그림 태그를 쓰는 요청에만, 전체: 모든 요청). 그림 가드가 태그를 걸러 낼 때마다 해당 교훈의 횟수가 올라가요.</p>
    ${L.map(l=>`<div class="ep"><label style="display:flex;gap:8px;align-items:center;flex:1;min-width:0"><input type="checkbox" data-act="pstltog" data-id="${l.id}" ${l.on?'checked':''}><span class="t"><b>${l.scope==='all'?'전체':'그림'}${l.hits?` · ${l.hits}번 고침`:''}</b><span class="muted">${esc(l.rule)}</span></span></label><button class="btn sm ghost" data-act="pstldel" data-id="${l.id}">✕</button></div>`).join('')||'<p class="muted">아직 교훈이 없어요</p>'}
    <label class="f" style="margin-top:8px">교훈 추가 (AI가 자꾸 하는 실수와 바른 방법)</label><textarea class="in" id="pl_new" rows="2" placeholder="예: 적 이름에 실제 게임 캐릭터 이름을 쓰지 않는다"></textarea><div class="row" style="gap:6px;margin-top:6px"><select class="in" id="pl_scope" style="max-width:140px"><option value="img">그림 요청</option><option value="all">모든 요청</option></select><button class="btn sm" data-act="pstladd">추가</button></div>`; }
  else { const S=aiLogStats(); body=`<p class="muted" style="font-size:.82rem">최근 AI 요청 ${AILOG.length}건. 실패가 잦은 단계는 조각을 고치거나 교훈을 더하거나, 글 AI 단계별 모델을 바꿔 보세요.</p>${S.length?`<table style="width:100%;font-size:.8rem"><tr><th align="left">단계</th><th>요청</th><th>실패</th><th align="left">주요 오류</th></tr>${S.map(s=>`<tr><td>${esc(s.stage)}</td><td align="center">${s.n}</td><td align="center">${s.fail}</td><td>${esc(Object.entries(s.errs).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([m,n])=>m+(n>1?' ×'+n:'')).join(' / '))}</td></tr>`).join('')}</table>`:'<p class="muted">기록이 없어요</p>'}<div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="ailog">AI 기록 자세히</button></div><h3 class="sec">조용히 넘어간 오류 (${QUIET.length})</h3>${QUIET.length?`<div style="font-size:.78rem;max-height:200px;overflow:auto">${QUIET.map(q=>`<div><span class="muted">${esc(new Date(q.at).toLocaleTimeString())} ${esc(q.where)}</span> ${esc(q.msg)}</div>`).join('')}</div>`:'<p class="muted" style="font-size:.8rem">없어요</p>'}`; }
  openModal(`${head('프롬프트 스튜디오','<button class="linkb" type="button" data-act="llmopen">글 AI 지침(상단·중단·하단·그림 태그)</button>')}<div class="row" style="gap:4px;margin-bottom:8px">${tabs.map(([k,l])=>`<button class="btn sm ${PS_TAB===k?'':'ghost'}" data-act="psttab" data-k="${k}">${l}</button>`).join('')}</div>${body}<div class="row" style="margin-top:12px"><button class="btn ghost" data-act="close">닫기</button></div>`); }
function pfSet(id,o){ const m=G.meta; m.prompts=m.prompts||{}; if(o&&(o.text||o.add)) m.prompts[id]={text:o.text||'',add:o.add||''}; else delete m.prompts[id]; mark('meta'); }
document.addEventListener('click',async e=>{ const b=e.target.closest('[data-act]'); if(!b) return; const a=b.dataset.act, id=b.dataset.id, v=k=>(document.querySelector(`#modal [data-pf="${id}"][data-k="${k}"]`)||{}).value||'';
  if(a==='pstopen') openStudio();
  else if(a==='psttab') openStudio(b.dataset.k);
  else if(a==='pstsave'){ pfSet(id,{text:v('text').trim(),add:v('add').trim()}); toast('조각을 저장했어요'); openStudio(); }
  else if(a==='pstreset'){ pfSet(id,null); toast('기본으로 되돌렸어요'); openStudio(); }
  else if(a==='pstai'){ if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; } const f=window.__PF[id], fails=aiLogStats().filter(s=>s.fail).slice(0,3).map(s=>s.stage+': '+Object.keys(s.errs).join('/')).join('; '), less=plList().filter(l=>l.on).map(l=>l.rule).join(' / ');
    const r=await aiJSON(`다음은 가챠 게임 제작 앱이 AI에 보내는 프롬프트 조각 「${f.label}」이다. 성능이 낮은 AI도 오해 없이 따르도록 다듬어라: 모호한 말을 구체적으로, 금지와 허용을 분명히, 예시는 짧게, 같은 말 반복은 줄이고, 원래 의도와 규칙은 모두 지킨다.${less?' 지금까지 쌓인 교훈: '+less+'.':''}${fails?' 최근 실패: '+fails+'.':''}\n\n원문:\n${promptFrag(id)}\n\nJSON만 출력: {"text":"다듬은 조각 전체","why":"무엇을 왜 바꿨는지 한두 문장"}`,b,'complex');
    if(r&&r.text){ const el=document.querySelector(`#modal [data-pf="${id}"][data-k="text"]`); if(el){ el.value=String(r.text); el.closest('details').open=true; } toast('제안을 덮어쓰기 칸에 넣었어요. 확인 후 저장하세요'+(r.why?' — '+String(r.why).slice(0,80):'')); } }
  else if(a==='pstimgfix'){ const n=imgAuditFix(imgAuditScan()); toast(`그림 프롬프트 ${n}개를 정리하고 교훈으로 기록했어요`); openStudio(); }
  else if(a==='pstundo'){ auditUndo(); G.lib.forEach(l=>mark('l:'+l.id)); openStudio(); }
  else if(a==='pstltog'){ const L=plList(), x=L.find(l=>l.id===id); if(x){ x.on=b.checked; plSave(L); } }
  else if(a==='pstldel'){ plSave(plList().filter(l=>l.id!==id)); openStudio(); }
  else if(a==='pstladd'){ const t=($('#pl_new')||{}).value||''; if(!t.trim()){ toast('교훈 내용을 써 주세요'); return; } plAdd(t,($('#pl_scope')||{}).value); toast('교훈을 추가했어요'); openStudio(); } });
