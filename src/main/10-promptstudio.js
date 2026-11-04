/* ===== promptstudio — 기능 class(Model · View · Ctl) — docs/redesign.md 2·3절, tools/reshape.mjs가 매핑대로 옮김 ===== */
class PromptStudio {
  static promptOv(){ try{ return (G&&G.meta&&G.meta.prompts)||{}; }catch(e){ return {}; } } // G는 0070에서 생겨요(그 전 호출은 기본값)

  static imgGuard(kind,s){ const k=kind==='weapon'?'prop':kind, pre=IMG_NOHUMAN[k]; if(!pre) return {out:String(s||''),removed:[]};
    const removed=[], keep=Core.tagList(s).filter(t=>{ const x=Core.tagKey(t); if(PERSON_TAG.test(x)&&!(k==='prop'&&/(dress|skirt|shirt|uniform|jacket|coat|gloves|boots|ribbon|hair ornament)$/.test(x))){ removed.push(t); return false; } return true; });
    return {out:Core.joinTags(pre,keep.join(', ')),removed}; }

  static plList(){ try{ const a=JSON.parse(appStorage.getItem(PL_KEY)||'[]'); return Array.isArray(a)?a:[]; }catch(e){ return []; } }

  static plSave(a){ try{ appStorage.setItem(PL_KEY,JSON.stringify(a.slice(0,60))); }catch(e){} }

  static plHit(id,ex){ const a=PromptStudio.plList(); let x=a.find(l=>l.id===id); if(!x){ const s=PL_SEED[id]; if(!s) return; x={id,scope:s.scope,rule:s.rule,on:true,hits:0,at:Date.now(),auto:true}; a.unshift(x); } x.hits=(x.hits||0)+1; x.last=Date.now(); if(ex) x.ex=String(ex).slice(0,160); PromptStudio.plSave(a); }

  static plAdd(rule,scope){ const a=PromptStudio.plList(); a.unshift({id:'u'+uid().slice(0,6),scope:scope==='all'?'all':'img',rule:String(rule).trim().slice(0,400),on:true,hits:0,at:Date.now()}); PromptStudio.plSave(a); }

    /* 그림 프롬프트 점검: 자료실(배경·소품)과 무기 프롬프트에서 사람 태그 찾기 */
static imgAuditScan(){ const out=[]; G.lib.forEach(l=>{ if(IMG_NOHUMAN[l.kind]&&l.prompt){ const g=PromptStudio.imgGuard(l.kind,l.prompt); if(g.removed.length) out.push({o:l,kind:l.kind,name:l.name,cur:l.prompt,fix:g.out,removed:g.removed}); } });
    G.chars.forEach(c=>{ if(c.weapon&&c.weapon.prompt){ const g=PromptStudio.imgGuard('prop',c.weapon.prompt); if(g.removed.length||Characters.wpBad(c.weapon.prompt)) out.push({o:c,kind:'weapon',name:c.name+' · '+(c.weapon.name||System.T('weapon')),cur:c.weapon.prompt,fix:g.out,removed:g.removed}); } }); return out; }

  static imgAuditFix(list){ Core.auditSnap(list.map(x=>x.o),'그림 프롬프트 정리'); list.forEach(x=>{ if(x.kind==='weapon'){ x.o.weapon.prompt=x.fix; Core.mark('c:'+x.o.id); } else { x.o.prompt=x.fix; Core.mark('l:'+x.o.id); } PromptStudio.plHit('img-person-'+(x.kind==='weapon'?'prop':x.kind),x.cur); }); return list.length; }

    /* AI 기록 분석: 실패가 잦은 단계와 오류 */
static aiLogStats(){ const by={}; AILOG.forEach(e=>{ const k=e.stage||'기타', o=by[k]||(by[k]={stage:k,n:0,fail:0,errs:{}}); o.n++; if(!e.ok){ o.fail++; const m=String(e.err||'오류').slice(0,60); o.errs[m]=(o.errs[m]||0)+1; } }); return Object.values(by).sort((a,b)=>b.fail-a.fail||b.n-a.n); }

  static pfSet(id,o){ const m=G.meta; m.prompts=m.prompts||{}; if(o&&(o.text||o.add)) m.prompts[id]={text:o.text||'',add:o.add||''}; else delete m.prompts[id]; Core.mark('meta'); }

    // 조각 AI 다듬기: 지금 조각 글과 교훈·최근 실패를 보내 덮어쓰기 칸에 제안을 넣음(저장은 사용자가)
static async pstPolish(b,id){ if(!SAMPLE){ CoreView.toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; }
    if(!String(System.promptFrag(id)||'').trim()){ CoreView.toast('비어 있는 조각은 다듬을 수 없어요 — 덮어쓰기 칸에 먼저 적어 주세요'); return; } const f=window.__PF[id], fails=PromptStudio.aiLogStats().filter(s=>s.fail).slice(0,3).map(s=>s.stage+': '+Object.keys(s.errs).join('/')).join('; '), less=PromptStudio.plList().filter(l=>l.on).map(l=>l.rule).join(' / ');
      const r=await Core.aiJSON(`${Core.pf('PF_POLISH',{label:f.label,lessons:less?' 지금까지 쌓인 교훈: '+less+'.':'',fails:fails?' 최근 실패: '+fails+'.':''})}\n\n<원문>\n${System.promptFrag(id)}\n</원문>\n\nJSON만 출력: {"text":"다듬은 조각 전체","why":"무엇을 왜 바꿨는지 한두 문장"}`,b,'complex');
      if(r&&r.text){ const el=document.querySelector(`#modal [data-pf="${id}"][data-k="text"]`); if(el){ el.value=String(r.text); el.closest('details').open=true; } CoreView.toast('제안을 덮어쓰기 칸에 넣었어요. 확인 후 저장하세요'+(r.why?' — '+String(r.why).slice(0,80):'')); }
  }

  static faceDrawOnePzText({candidate,basePr,emph,x,c}){ return PromptStudio.composeNai('char',candidate.prompt||Core.joinTags(basePr,emph,x),{styleId:c.naiStyle,frame:'portrait, face focus',pose:''}); }

  static composeNai(kind,base,opt){
    opt=opt||{}; const c=Core.naiCfg(), part=c.parts[kind]||c.parts.prop, st=Core.naiStyle(c,opt.styleId);
    if(IMG_NOHUMAN[kind]){ const g=PromptStudio.imgGuard(kind,base); if(g.removed.length){ base=g.out; PromptStudio.plHit('img-person-'+kind,g.removed.join(', ')); } } // 그림 가드(0025): 배경·소품에 사람 태그가 섞이면 빼요
    let body=Core.tagList(base), suffix=part.suffix, frame='';
    if(kind==='char'||ILK(kind)){ body=body.filter(t=>!COMPO_TAGS.test(Core.tagKey(t))); frame=opt.frame||(ILK(kind)?'cowboy shot':'full body'); suffix=Core.tagList(suffix).filter(t=>!FRAME_TAGS.test(Core.tagKey(t))).join(', '); }
    const pose=kind==='char'?(opt.pose!=null?opt.pose:NAI_FRONT):ILK(kind)?(opt.pose!=null?opt.pose:'looking at viewer'):kind==='enemy'?'straight-on':'';
    let fneg='';
    if(kind==='char'&&/^full body$/i.test(String(frame).trim())){ frame='1.3::full body::, standing'; fneg='feet out of frame, cowboy shot, upper body, portrait, close-up, cropped legs'; }
    // 스탠딩은 눈높이 정면으로: 하이앵글·로우앵글·원근 왜곡을 막아요
    if(kind==='char'){ frame=Core.joinTags(frame,'eye level, straight-on'); fneg=Core.joinTags(fneg,'from above, from below, high angle, low angle, dutch angle, fisheye, foreshortening, perspective, wide angle'); }
    const human=kind==='char'||ILK(kind);
    // 사람인데 엘프 귀가 나오지 않게: 프롬프트에 뾰족한 귀 종족 태그가 없으면 뾰족한 귀를 막아요
    const pointy=/\b(elf|elves|elven|half-elf|pointy ears|elf ears|fairy|pixie|demon|devil|succubus|vampire|monster girl|goblin|orc)\b/i.test(String(base||''));
    if((human||kind==='cg')&&!pointy) fneg=Core.joinTags(fneg,'pointy ears, elf');
    return {input:Core.joinTags(st.tags,c.prefix,body.join(', '),pose,frame,suffix), neg:Core.joinTags(c.neg,st.neg,part.neg,fneg,human?'child, loli':'')};
  }
}

class PromptStudioView {
  static promptPanel(){ const ov=Object.keys(PromptStudio.promptOv()).length, pl=PromptStudio.plList().filter(l=>l.on).length, bad=PromptStudio.imgAuditScan().length;
    return `<div class="panel pm-hide"><h3>프롬프트 스튜디오 ${bad?`<span class="badge">그림 ${bad}</span>`:''}</h3><p class="muted" style="margin:0 0 6px">AI에 보내는 프롬프트 조각 ${Object.keys(window.__PF||{}).length}개${ov?` · 고친 조각 ${ov}`:''} · 교훈 ${pl}개. 조각을 고치고 다듬거나, 그림 프롬프트(배경·소품에 사람이 나오는 문제 등)를 점검·정정하고, 고친 내용을 교훈으로 쌓아 반복을 막아요.</p><button class="btn sm" data-act="pstopen">프롬프트 스튜디오</button></div>`; }

  static openStudio(tab){ if(tab) PS_TAB=tab; const tabs=[['frag','조각'],['img','그림 점검'],['lesson','교훈'],['log','AI 기록']], ov=PromptStudio.promptOv();
    let body='';
    if(PS_TAB==='frag') body=Object.values(window.__PF||{}).map(f=>{ const o=ov[f.id]||{}; return `<details class="panel" style="padding:8px;margin:6px 0"><summary><b>${esc(f.label)}</b> <span class="muted">${esc(f.id)}${f.where?' · '+esc(f.where):''}${o.text?' · 덮어씀':''}${o.add?' · 덧붙임':''}</span></summary>
      <div style="font-size:.78rem;margin:6px 0 2px">기본</div><pre style="white-space:pre-wrap;font-size:.75rem;max-height:140px;overflow:auto;margin:0">${esc(f.get())}</pre>
      <label class="f">덮어쓰기 (비우면 기본)</label><textarea class="in" rows="3" data-pf="${f.id}" data-k="text">${esc(o.text||'')}</textarea>
      <label class="f">덧붙이기 (기본 뒤에 추가)</label><textarea class="in" rows="2" data-pf="${f.id}" data-k="add">${esc(o.add||'')}</textarea>
      <div class="row" style="gap:6px;margin-top:6px"><button class="btn sm" data-act="pstsave" data-id="${f.id}">저장</button><button class="btn sm ghost" data-act="pstai" data-id="${f.id}">AI로 다듬기 제안</button>${o.text||o.add?`<button class="btn sm ghost" data-act="pstreset" data-id="${f.id}">기본으로</button>`:''}</div></details>`; }).join('');
    else if(PS_TAB==='img'){ const L=PromptStudio.imgAuditScan(); body=`<p class="muted" style="font-size:.82rem">배경·소품·지도·아이콘·${System.T('weapon')} 그림에는 사람이 나오면 안 돼요. 성능이 낮은 AI가 이런 프롬프트에 인물 태그(1girl, 머리·눈·의상)를 섞으면 모두 사람 그림이 돼요. 그릴 때는 앱이 항상 걸러 내지만(그림 가드), 저장된 프롬프트도 정리해 두면 좋아요. 정리하면 교훈으로 기록돼 다음 생성부터 AI에 주의를 줘요.</p>
      ${L.length?L.map(x=>`<div class="panel" style="padding:8px;margin:6px 0;font-size:.8rem"><b>${esc(x.name)}</b> <span class="muted">${esc(x.kind)}</span><div class="muted">지금: ${esc(x.cur)}</div><div>정리: ${esc(x.fix)}</div>${x.removed.length?`<div style="color:var(--bad,#c55)">뺄 태그: ${esc(x.removed.join(', '))}</div>`:''}</div>`).join('')+`<button class="btn" data-act="pstimgfix">모두 정리 (${L.length})</button>`:'<p>문제 있는 그림 프롬프트가 없어요 ✓</p>'}${AUDIT_UNDO?`<button class="btn ghost" data-act="pstundo">되돌리기: ${esc(AUDIT_UNDO.label)}</button>`:''}`; }
    else if(PS_TAB==='lesson'){ const L=PromptStudio.plList(); body=`<p class="muted" style="font-size:.82rem">고친 실수를 규칙으로 쌓아 두는 곳이에요. 켜진 교훈은 AI 요청에 자동으로 들어가요(그림: 그림 태그를 쓰는 요청에만, 전체: 모든 요청). 그림 가드가 태그를 걸러 낼 때마다 해당 교훈의 횟수가 올라가요.</p>
      ${L.map(l=>`<div class="ep"><label style="display:flex;gap:8px;align-items:center;flex:1;min-width:0"><input type="checkbox" data-act="pstltog" data-id="${l.id}" ${l.on?'checked':''}><span class="t"><b>${l.scope==='all'?'전체':'그림'}${l.hits?` · ${l.hits}번 고침`:''}</b><span class="muted">${esc(l.rule)}</span></span></label><button class="btn sm ghost" data-act="pstldel" data-id="${l.id}">✕</button></div>`).join('')||'<p class="muted">아직 교훈이 없어요</p>'}
      <label class="f" style="margin-top:8px">교훈 추가 (AI가 자꾸 하는 실수와 바른 방법)</label><textarea class="in" id="pl_new" rows="2" placeholder="예: 적 이름에 실제 게임 캐릭터 이름을 쓰지 않는다"></textarea><div class="row" style="gap:6px;margin-top:6px"><select class="in" id="pl_scope" style="max-width:140px"><option value="img">그림 요청</option><option value="all">모든 요청</option></select><button class="btn sm" data-act="pstladd">추가</button></div>`; }
    else { const S=PromptStudio.aiLogStats(); body=`<p class="muted" style="font-size:.82rem">최근 AI 요청 ${AILOG.length}건. 실패가 잦은 단계는 조각을 고치거나 교훈을 더하거나, 글 AI 단계별 모델을 바꿔 보세요.</p>${S.length?`<table style="width:100%;font-size:.8rem"><tr><th align="left">단계</th><th>요청</th><th>실패</th><th align="left">주요 오류</th></tr>${S.map(s=>`<tr><td>${esc(s.stage)}</td><td align="center">${s.n}</td><td align="center">${s.fail}</td><td>${esc(Object.entries(s.errs).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([m,n])=>m+(n>1?' ×'+n:'')).join(' / '))}</td></tr>`).join('')}</table>`:'<p class="muted">기록이 없어요</p>'}<div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="ailog">AI 기록 자세히</button></div><h3 class="sec">조용히 넘어간 오류 (${QUIET.length})</h3>${QUIET.length?`<div style="font-size:.78rem;max-height:200px;overflow:auto">${QUIET.map(q=>`<div><span class="muted">${esc(new Date(q.at).toLocaleTimeString())} ${esc(q.where)}</span> ${esc(q.msg)}</div>`).join('')}</div>`:'<p class="muted" style="font-size:.8rem">없어요</p>'}`; }
    CoreView.openModal(`${head('프롬프트 스튜디오','<button class="linkb" type="button" data-act="llmopen">글 AI 지침(상단·중단·하단·그림 태그)</button>')}<div class="row" style="gap:4px;margin-bottom:8px">${tabs.map(([k,l])=>`<button class="btn sm ${PS_TAB===k?'':'ghost'}" data-act="psttab" data-k="${k}">${l}</button>`).join('')}</div>${body}<div class="row" style="margin-top:12px"><button class="btn ghost" data-act="close">닫기</button></div>`); }
}
