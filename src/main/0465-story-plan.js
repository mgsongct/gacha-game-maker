/* ===== 시나리오 설계 (사전 설계 → 장마다 빌드) ===== */
/* 그때그때 즉흥으로 쓰지 않고, 큰 틀(로그라인·주제·결말·막 구성)·숨겨진 반전(진실·공개 장·복선)·분기(선택 → 이후 장에 반영)·캐릭터 아크를
   먼저 설계해 두고, 장을 쓸 때 그 장에 필요한 것만(막 목표·심을 복선·지금 밝힐 반전·아직 숨길 것·분기 결과) AI에 넘겨요.
   G.world.plan = {logline,theme,ending,acts[{name,upto,goal}],twists[{id,truth,reveal,clues[{ch,hint}],who}],branches[{id,at,question,options[{label,result}]}],arcs[{name,start,change,end}],notes}
   분기: 대본에 "[분기: id]" 다음 줄의 선택지를 고르면 P().flags[id]=번호(1부터) → 다음 장을 쓸 때 반영. 문서: docs/research/story-design.md */
function PLAN(){ const w=G.world; if(!w.plan||typeof w.plan!=='object') w.plan={}; const p=w.plan; for(const k of ['acts','twists','branches','arcs']) if(!Array.isArray(p[k])) p[k]=[]; return p; }
function planHas(){ const p=G.world.plan; return !!(p&&(p.logline||(p.acts||[]).length||(p.twists||[]).length)); }
function planActOf(n){ return PLAN().acts.find(a=>n<=(+a.upto||999))||PLAN().acts.at(-1)||null; }
function storyFlag(id,n,label){ const p=P(); p.flags=p.flags||{}; p.flags[id]={n,label:String(label||'').slice(0,40),at:Date.now()}; mark('prog'); toast(`선택이 기록됐어요 — 이후 이야기에 반영돼요`); }
// 장 n(1부터)을 쓸 때 넘기는 설계 정보. 아직 밝히지 않을 반전은 "작가 전용"으로만 알려 줘요
function planCtx(n){ if(!planHas()) return ''; const p=PLAN(), act=planActOf(n), F=P().flags||{}, L=[];
  L.push(`\n【시나리오 설계 — 작가 전용, 대사로 그대로 말하지 않는다】${p.logline?' 로그라인: '+p.logline+'.':''}${p.theme?' 주제: '+p.theme+'.':''}${p.ending?' 목표 결말: '+p.ending+'.':''}`);
  if(act) L.push(`지금은 「${act.name}」(~${act.upto}장): ${act.goal}`);
  const now=p.twists.filter(t=>+t.reveal===n), later=p.twists.filter(t=>+t.reveal>n), clues=p.twists.flatMap(t=>(t.clues||[]).filter(c=>+c.ch===n).map(c=>({t,c})));
  if(clues.length) L.push(pf('PLAN_CLUES',{list:clues.map(({c})=>c.hint).join(' / ')}));
  if(now.length) L.push(pf('PLAN_REVEAL',{list:now.map(t=>`${t.truth}${t.who?' (관련: '+t.who+')':''}`).join(' / ')}));
  if(later.length) L.push('아직 밝히지 말 진실(이번 장에서는 숨기고 어긋나지 않게만): '+later.map(t=>t.truth).join(' / '));
  const done=p.branches.filter(b=>F[b.id]&&+b.at<n); if(done.length) L.push('플레이어가 고른 분기(이후 이야기에 반영): '+done.map(b=>{ const o=(b.options||[])[F[b.id].n-1]||{}; return `${b.question} → 「${o.label||F[b.id].label}」${o.result?': '+o.result:''}`; }).join(' / '));
  const here=p.branches.filter(b=>+b.at===n); if(here.length) L.push(pf('PLAN_BRANCH_HERE')+here.map(b=>`id=${b.id} 질문 「${b.question}」 보기 ${(b.options||[]).map(o=>o.label).join(' | ')}`).join(' / '));
  const arcs=p.arcs.filter(a=>a.name); if(arcs.length) L.push('캐릭터 아크(이번 장에서 조금씩 진행): '+arcs.map(a=>`${a.name}: ${a.start} → ${a.change} → ${a.end}`).join(' / '));
  if(p.notes) L.push('설계 메모: '+p.notes);
  return L.join('\n')+'\n'; }
// 점검: 복선 없이 밝히는 반전, 공개 장 뒤에 있는 복선, 공개 장이 지났는데 대본에 없는 반전, 분기가 대본에 없음
function planCheck(){ const p=PLAN(), main=G.chapters.filter(ch=>ch.kind==='main'), n=main.length, txt=i=>{ const ch=main[i-1]; return ch?(ch.stages||[]).map(s=>(s.pre||'')+'\n'+(s.post||'')).join('\n'):''; }, out=[];
  if(!p.logline) out.push('로그라인이 없어요'); if(!p.acts.length) out.push('막 구성이 없어요');
  p.twists.forEach(t=>{ const cl=(t.clues||[]).filter(c=>c.hint); if(!cl.length) out.push(`반전 「${t.truth.slice(0,20)}」에 복선이 없어요`); else if(cl.every(c=>+c.ch>=+t.reveal)) out.push(`반전 「${t.truth.slice(0,20)}」의 복선이 모두 공개 장(${t.reveal}장) 이후예요`);
    if(+t.reveal&&+t.reveal<=n&&!t.done) out.push(`${t.reveal}장이 이미 있는데 반전 「${t.truth.slice(0,20)}」 공개를 확인하지 않았어요(대본 확인 후 '공개됨' 표시)`); });
  p.branches.forEach(b=>{ if(+b.at<=n&&!txt(+b.at).includes('[분기: '+b.id+']')&&!txt(+b.at).includes('[분기:'+b.id+']')) out.push(`${b.at}장 대본에 분기 「${b.question.slice(0,20)}」([분기: ${b.id}])가 없어요`); if((b.options||[]).length<2) out.push(`분기 「${b.question.slice(0,20)}」의 보기가 2개 미만이에요`); });
  const last=p.acts.length?+p.acts.at(-1).upto:0; if(last&&n>last) out.push(`지금 ${n}장으로 설계한 막(~${last}장)을 넘었어요 — 다음 막을 설계해 주세요`);
  return out; }
async function planAI(mode,btn,instruction){ const p=PLAN(), n=G.chapters.filter(ch=>ch.kind==='main').length;
  const r=await aiJSON(`${RULES}\n${ctx()}\n\n${pf('PLAN_AI',{how:pf(mode==='extend'?'PLAN_AI_EXTEND':mode==='improve'?'PLAN_AI_IMPROVE':'PLAN_AI_NEW',{plan:JSON.stringify(p).slice(0,3000)}),n,extra:instruction?'추가 지시: '+instruction+'\n':'',crew:T('crew')})}
JSON만 출력: {"logline":"","theme":"","ending":"","acts":[{"name":"1막 이름","upto":4,"goal":""}],"twists":[{"id":"t1","truth":"","reveal":5,"who":"관련 인물","clues":[{"ch":2,"hint":""}]}],"branches":[{"id":"b1","at":3,"question":"","options":[{"label":"","result":""}]}],"arcs":[{"name":"캐릭터 이름","start":"","change":"","end":""}]}`,btn,'complex');
  if(!r) return false; const old=PLAN(), clean=planClean(r);
  if(mode==='extend'){ old.acts.push(...clean.acts.filter(a=>+a.upto>(+(old.acts.at(-1)||{}).upto||0))); old.twists.push(...clean.twists.filter(t=>!old.twists.some(x=>x.id===t.id))); old.branches.push(...clean.branches.filter(b=>!old.branches.some(x=>x.id===b.id))); clean.arcs.forEach(a=>{ if(!old.arcs.some(x=>x.name===a.name)) old.arcs.push(a); }); }
  else G.world.plan=Object.assign(old,clean,{notes:old.notes||''});
  mark('world'); return true; }
function planClean(r){ const S=(v,n)=>String(v||'').trim().slice(0,n||200), N=v=>Math.max(1,Math.min(99,Math.round(+v||1)));
  return {logline:S(r.logline,160),theme:S(r.theme,80),ending:S(r.ending,200),acts:(r.acts||[]).slice(0,8).map(a=>({name:S(a.name,30),upto:N(a.upto),goal:S(a.goal)})).filter(a=>a.name),
   twists:(r.twists||[]).slice(0,8).map((t,i)=>({id:S(t.id,12).replace(/[^\w-]/g,'')||'t'+(i+1),truth:S(t.truth),reveal:N(t.reveal),who:S(t.who,40),clues:(t.clues||[]).slice(0,5).map(c=>({ch:N(c.ch),hint:S(c.hint,120)})).filter(c=>c.hint)})).filter(t=>t.truth),
   branches:(r.branches||[]).slice(0,6).map((b,i)=>({id:S(b.id,12).replace(/[^\w-]/g,'')||'b'+(i+1),at:N(b.at),question:S(b.question,120),options:(b.options||[]).slice(0,4).map(o=>({label:S(o.label,30),result:S(o.result,160)})).filter(o=>o.label)})).filter(b=>b.question),
   arcs:(r.arcs||[]).slice(0,8).map(a=>({name:S(a.name,20),start:S(a.start,80),change:S(a.change,80),end:S(a.end,80)})).filter(a=>a.name)}; }

/* 화면 */
function planPanel(){ const p=G.world.plan||{}, iss=planHas()?planCheck():[]; return `<div class="panel pm-hide"><h3>시나리오 설계 ${iss.length?`<span class="badge">점검 ${iss.length}</span>`:''}</h3><p class="muted" style="margin:0 0 6px">${planHas()?`${esc(p.logline||'')} · 막 ${(p.acts||[]).length} · 반전 ${(p.twists||[]).length} · 분기 ${(p.branches||[]).length}`:'큰 틀·플롯·반전·분기를 먼저 설계하면, 새 장을 쓸 때 AI가 그 설계를 따라요(복선은 미리, 반전은 정한 장에서).'}</p><button class="btn sm" data-act="planopen">시나리오 설계</button></div>`; }
function openPlan(){ const p=PLAN(), n=G.chapters.filter(ch=>ch.kind==='main').length, F=P().flags||{}, iss=planCheck(), t=(k,v,ph,rows)=>rows?`<textarea class="in" data-pl="${k}" rows="${rows}" placeholder="${esc(ph||'')}">${esc(v||'')}</textarea>`:`<input class="in" data-pl="${k}" value="${esc(v??'')}" placeholder="${esc(ph||'')}">`, num=(k,v)=>`<input class="in" type="number" min="1" data-pl="${k}" value="${v??''}" style="max-width:70px">`;
  openModal(`${head('시나리오 설계',`<span class="muted">지금 메인 ${n}장</span>`)}
  ${iss.length?`<div class="panel" style="border-color:var(--gold)"><b>점검</b><ul style="margin:4px 0;padding-left:18px;font-size:.82rem">${iss.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}
  <label class="f">로그라인 (한 줄 요약)</label>${t('logline',p.logline)}<div class="g2"><div><label class="f">주제</label>${t('theme',p.theme)}</div><div><label class="f">목표 결말</label>${t('ending',p.ending)}</div></div>
  <h3 class="sec">막 구성</h3>${p.acts.map((a,i)=>`<div class="row" style="gap:4px;margin:3px 0;flex-wrap:wrap">${t(`a.${i}.name`,a.name,'막 이름')}<span class="muted">~</span>${num(`a.${i}.upto`,a.upto)}<span class="muted">장</span>${t(`a.${i}.goal`,a.goal,'이 막의 목표')}<button class="btn sm ghost" data-act="plandel" data-k="acts" data-i="${i}">삭제</button></div>`).join('')}<button class="btn sm ghost" data-act="planadd" data-k="acts">+ 막</button>
  <h3 class="sec">숨겨진 반전</h3>${p.twists.map((x,i)=>`<div class="panel" style="padding:8px;margin:6px 0"><div class="row" style="gap:4px;flex-wrap:wrap">${t(`t.${i}.truth`,x.truth,'숨겨진 진실')}<span class="muted">공개</span>${num(`t.${i}.reveal`,x.reveal)}<span class="muted">장</span>${t(`t.${i}.who`,x.who,'관련 인물')}<label style="display:inline-flex;gap:3px;font-size:.8rem"><input type="checkbox" data-pl="t.${i}.done" ${x.done?'checked':''}>공개됨</label><button class="btn sm ghost" data-act="plandel" data-k="twists" data-i="${i}">삭제</button></div>
    <div style="font-size:.82rem;margin-top:4px">복선 (장 번호 | 힌트, 줄마다)</div><textarea class="in" rows="2" data-pl="t.${i}.clues">${esc((x.clues||[]).map(c=>`${c.ch} | ${c.hint}`).join('\n'))}</textarea></div>`).join('')}<button class="btn sm ghost" data-act="planadd" data-k="twists">+ 반전</button>
  <h3 class="sec">분기</h3>${p.branches.map((b,i)=>`<div class="panel" style="padding:8px;margin:6px 0"><div class="row" style="gap:4px;flex-wrap:wrap"><span class="muted">${esc(b.id)}</span>${num(`b.${i}.at`,b.at)}<span class="muted">장</span>${t(`b.${i}.question`,b.question,'플레이어가 고를 질문')}${F[b.id]?`<span class="badge">고름: ${esc((b.options[F[b.id].n-1]||{}).label||F[b.id].label)}</span>`:''}<button class="btn sm ghost" data-act="plandel" data-k="branches" data-i="${i}">삭제</button></div>
    <div style="font-size:.82rem;margin-top:4px">보기 (보기 | 이후에 바뀌는 것, 줄마다)</div><textarea class="in" rows="2" data-pl="b.${i}.options">${esc((b.options||[]).map(o=>`${o.label} | ${o.result}`).join('\n'))}</textarea></div>`).join('')}<button class="btn sm ghost" data-act="planadd" data-k="branches">+ 분기</button>
  <h3 class="sec">캐릭터 아크</h3>${p.arcs.map((a,i)=>`<div class="row" style="gap:4px;margin:3px 0;flex-wrap:wrap">${t(`r.${i}.name`,a.name,'이름')}${t(`r.${i}.start`,a.start,'시작')}${t(`r.${i}.change`,a.change,'변화')}${t(`r.${i}.end`,a.end,'끝')}<button class="btn sm ghost" data-act="plandel" data-k="arcs" data-i="${i}">삭제</button></div>`).join('')}<button class="btn sm ghost" data-act="planadd" data-k="arcs">+ 아크</button>
  <label class="f" style="margin-top:8px">설계 메모 (AI에 함께 전달)</label>${t('notes',p.notes,'금기·일관성 규칙 등',2)}
  <label class="f" style="margin-top:8px">AI 추가 지시 (선택)</label><input class="in" id="pl_ins" placeholder="예: 3막에서 동료 한 명의 배신을 넣어 줘">
  <div class="row" style="margin-top:12px;flex-wrap:wrap;gap:6px"><button class="btn" data-act="plansave">저장</button><button class="btn ghost" data-act="planai" data-k="${planHas()?'improve':'new'}">${planHas()?'AI로 다듬기':'AI로 설계'}</button>${planHas()?'<button class="btn ghost" data-act="planai" data-k="extend">AI로 다음 막 잇기</button>':''}<button class="btn ghost" data-act="close">닫기</button></div>
  <p class="muted" style="font-size:.78rem;margin-top:8px">새 장(메인 스토리)을 만들 때 이 설계에서 그 장에 필요한 것만 AI에 넘겨요. 분기는 대본의 [분기: id] 다음 선택지로 기록되고, 이후 장에 반영돼요.</p>`); }
function planRead(){ const p=PLAN(), lines=v=>String(v||'').split('\n').map(l=>l.split('|').map(s=>s.trim())).filter(x=>x[0]); document.querySelectorAll('#modal [data-pl]').forEach(el=>{ const k=el.dataset.pl.split('.'), v=el.type==='checkbox'?el.checked:el.value;
  if(k.length===1){ p[k[0]]=String(v).trim(); return; } const arr={a:'acts',t:'twists',b:'branches',r:'arcs'}[k[0]], o=p[arr][+k[1]]; if(!o) return;
  if(k[2]==='clues') o.clues=lines(v).map(([ch,hint])=>({ch:Math.max(1,+ch||1),hint:hint||''})).filter(c=>c.hint); else if(k[2]==='options') o.options=lines(v).map(([label,result])=>({label,result:result||''}));
  else if(['upto','reveal','at'].includes(k[2])) o[k[2]]=Math.max(1,+v||1); else o[k[2]]=typeof v==='boolean'?v:String(v).trim(); }); }
document.addEventListener('click',async e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act;
  if(a==='planopen') openPlan();
  else if(a==='plansave'){ planRead(); mark('world'); toast('시나리오 설계를 저장했어요'); openPlan(); }
  else if(a==='planadd'){ planRead(); const p=PLAN(), k=el.dataset.k, n=G.chapters.filter(ch=>ch.kind==='main').length; p[k].push(k==='acts'?{name:'',upto:n+4,goal:''}:k==='twists'?{id:'t'+uid().slice(0,4),truth:'',reveal:n+3,who:'',clues:[]}:k==='branches'?{id:'b'+uid().slice(0,4),at:n+1,question:'',options:[]}:{name:'',start:'',change:'',end:''}); openPlan(); }
  else if(a==='plandel'){ planRead(); PLAN()[el.dataset.k].splice(+el.dataset.i,1); mark('world'); openPlan(); }
  else if(a==='planai'){ if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; } planRead(); if(await planAI(el.dataset.k,el,($('#pl_ins')||{}).value||'')){ toast('시나리오를 설계했어요'); openPlan(); } } });
/* 시나리오는 게임이 구동될 때 AI가 처리(자동이 기본): 장을 쓰기 전에 설계가 없으면 처음부터, 설계된 막이 이번 장 앞에서 끝났으면 다음 막을 이어서 설계.
   사용자는 설정 → 시나리오 설계에서 직접 고치거나 AI에 추가 지시할 수 있어요. 구독 게임·글 AI 없음이면 하지 않음 */
async function planEnsure(n){ if(!SAMPLE||subLocked()) return false; const last=+((PLAN().acts.at(-1)||{}).upto||0);
  if(!planHas()) return planAI('new',null);
  if(last&&last<n) return planAI('extend',null);
  return false; }
