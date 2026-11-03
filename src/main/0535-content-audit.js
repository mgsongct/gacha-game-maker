/* ===== 콘텐츠 점검·업그레이드 (생성 기능이 좋아졌거나 기존 생성물에 빠진 게 있을 때) ===== */
/* 규칙(AUDIT_RULES)마다 "감지 → 고치기"를 정의해요. 종류: missing(빠짐·잘못됨) · upgrade(구버전 생성물, 새 기능으로 바꿀 수 있음)
   고치는 방법: auto(규칙 변환, AI 없이) · ai(빠진 항목만 AI로 채움) · image(그림 생성) · open(기존 편집 화면 열기)
   생성 버전: 새로 만드는 캐릭터에 genVer가 찍혀요(cleanChar0). genVer가 없거나 낮으면 구버전 생성물이에요.
   지정 변환: 고른 캐릭터·항목을 지시문대로 AI가 바꿔요. 마지막 일괄 작업은 되돌릴 수 있어요. 문서: docs/research/content-audit.md */
function auditGenVer(){ return 8; } // 8: 세력 깊이·몬스터 도감·첫 등장 // 7: 사거리(근접·원거리·지원)·출격 경로 // 6: 연출(감정 아이콘·동작·화면 효과) // 5: 전장 규칙·별 조건·일정 장면 // 4: 개성 시트·인연 톡·메모리얼 // 생성 규칙이 바뀌면 올려요(2: 상징 컬러·아이템, 3: 바리에이션·상속 시대)
const AUDIT_FIELDS={profile:['프로필','"profile":"성격·배경·비밀을 담은 3~5문장"'],intro:['첫 대사','"intro":"첫 만남 대사 1줄"'],lines:['평소 대사','"lines":["로비·평소 대사 5개"]'],
  touch:['터치 반응','"touch":{"head":["머리 쓰다듬기 반응 3개"],"body":["몸 터치 반응 3개"],"pet":["쓰다듬기 반응 3개"]}'],affLines:['호감도 대사','"affLines":{"3":["대사 1~2개"],"5":["대사 1~2개"],"8":["대사 1~2개"]}'],
  lvLines:['레벨업 대사','"lvLines":["2개"]'],dupLines:['돌파 대사','"dupLines":["2개"]'],naiPrompt:['외모 태그','"naiPrompt":"NovelAI 영어 태그"']};
const auditStrs=v=>(Array.isArray(v)?v:[]).map(x=>String(x||'').trim()).filter(Boolean);
const auditImgCats=['char','upper','illust','weapon'];
const AUDIT_RULES=[
 {id:'c_profile',scope:'char',kind:'missing',since:1,label:'프로필이 비었거나 너무 짧아요',test:c=>String(c.profile||'').trim().length<40,fix:{mode:'ai',fields:['profile']}},
 {id:'c_lines',scope:'char',kind:'missing',since:1,label:'평소 대사가 3개 미만이에요',test:c=>auditStrs(c.lines).length<3,fix:{mode:'ai',fields:['lines']}},
 {id:'c_touch',scope:'char',kind:'missing',since:1,label:'터치 반응 대사가 없어요',test:c=>!auditStrs(c.touch?.head).length||!auditStrs(c.touch?.body).length,fix:{mode:'ai',fields:['touch']}},
 {id:'c_aff',scope:'char',kind:'missing',since:1,label:'호감도 대사가 없어요',test:c=>!Object.values(c.affLines||{}).some(v=>auditStrs(v).length),fix:{mode:'ai',fields:['affLines']}},
 {id:'c_intro',scope:'char',kind:'missing',since:1,label:'첫 대사가 없어요',test:c=>!String(c.intro||'').trim(),fix:{mode:'ai',fields:['intro']}},
 {id:'c_look',scope:'char',kind:'missing',since:1,label:'외모 태그(그림 프롬프트)가 없어요',test:c=>!String(c.naiPrompt||'').trim(),fix:{mode:'ai',fields:['naiPrompt']}},
 {id:'c_age',scope:'char',kind:'missing',since:1,label:'외모 태그에 나이 태그가 남아 있어요(예전 생성물)',test:c=>tagList(c.naiPrompt).some(t=>AGE_TAGS.test(tagKey(t))),fix:{mode:'auto',run:c=>{ c.naiPrompt=stripAge(c.naiPrompt); }}},
 {id:'c_minor',scope:'char',kind:'missing',since:1,label:'외모 태그에 허용되지 않는 태그가 있어요',test:c=>tagList(c.naiPrompt).some(t=>MINOR_TAGS.test(tagKey(t))),fix:{mode:'auto',run:c=>{ c.naiPrompt=tagList(c.naiPrompt).filter(t=>!MINOR_TAGS.test(tagKey(t))).join(', '); }}},
 {id:'c_weapon',scope:'char',kind:'missing',since:1,label:`${T('weapon')} 그림 프롬프트가 잘못됐거나 없어요`,test:c=>!!c.weapon&&!!c.weapon.name&&(!c.weapon.prompt||wpBad(c.weapon.prompt)),fix:{mode:'weapon'}},
 {id:'c_skills',scope:'char',kind:'upgrade',since:2,label:'스킬이 지금 전투 규칙(밸런스 검사)과 맞지 않아요',test:c=>!c.skills||c.skills.version!==2||!c.skillBalance||c.skillBalance.ruleset!==GGMCombat.RULESET,fix:{mode:'skills'}},
 {id:'c_symbol',scope:'char',kind:'upgrade',since:2,label:'상징 컬러·아이템이 정해지지 않았어요(바리에이션 디자인에 쓰여요)',test:c=>!c.alt&&(!c.symColor||!c.symItem)&&!!(GGMConstruct.symbolColor(c)||GGMConstruct.symbolItem(c)),fix:{mode:'auto',run:c=>{ c.symColor=c.symColor||GGMConstruct.symbolColor(c)||''; c.symItem=c.symItem||GGMConstruct.symbolItem(c)||''; }}},
 {id:'c_old',scope:'char',kind:'upgrade',since:3,label:'구버전 생성기로 만든 캐릭터예요(새 규칙으로 일부 다시 만들 수 있어요)',test:c=>!c.alt&&(+c.genVer||0)<auditGenVer()&&!DEFAULT_CHARS.some(d=>d.id===c.id),fix:{mode:'open',stamp:true}},
 {id:'c_img',scope:'char',kind:'missing',since:1,label:'그림(스탠딩·상반신·일러스트·무기)이 아직 없어요',test:c=>drawTodo(auditImgCats).some(it=>it.c===c),fix:{mode:'image'}},
 {id:'s_script',scope:'stage',kind:'missing',since:1,label:'스테이지 대본(전투 전 장면)이 비었어요',test:s=>!String(s.pre||'').trim(),fix:{mode:'ai-stage'}},
 {id:'c_pos',scope:'char',kind:'upgrade',since:3,label:'포지션이 정해지지 않았어요(전투 기본형에 맞는 포지션으로 배정)',test:c=>!c.alt&&!posById(c.pos),fix:{mode:'auto',run:c=>{ posAssign(c,c.pos); }}},
 {id:'c_statband',scope:'char',kind:'upgrade',since:3,label:'능력치가 희귀도·기본형 기준에서 많이 벗어났어요(AI 생성 편차)',test:c=>!c.alt&&balInfo(c).statOut,fix:{mode:'auto',run:c=>{ balNormalize(c,'edge'); }}},
 {id:'c_genlag',scope:'char',kind:'upgrade',since:3,label:'출시 세대가 현재보다 많이 뒤처졌어요(구캐릭터 AS)',test:c=>!c.alt&&balInfo(c).genLag,fix:{mode:'skills-remaster'}},
 {id:'c_persona',scope:'char',kind:'missing',since:4,label:'개성 시트(성격·말투·반전 매력)가 없거나 비었어요',test:c=>!c.alt&&!((c.persona||{}).traits||[]).length,fix:{mode:'ai-persona',k:'fill'}},
 {id:'c_persona_weak',scope:'char',kind:'upgrade',since:4,label:'개성 검수 점수가 낮아요(매력·차별성 부족)',test:c=>!c.alt&&((c.persona||{}).traits||[]).length>0&&personaReview(c).score<55,fix:{mode:'ai-persona',k:'improve'}},
 {id:'c_afftalk',scope:'char',kind:'missing',since:4,label:'호감도에 따라 열리는 인연 톡이 없어요',test:c=>!c.alt&&!affThreads(c).length,fix:{mode:'ai-afftalk'}},
 {id:'c_memorial',scope:'char',kind:'missing',since:4,label:'메모리얼(높은 호감도 특별 장면·로비 대사)이 없어요',test:c=>!c.alt&&!(c.memorial&&c.memorial.script),fix:{mode:'ai-memo'}},
 {id:'g_rules',scope:'game',kind:'upgrade',since:3,label:'속성·역할 설명이 없어요(게임 규칙·도감에 표시돼요)',test:()=>rulesMissingDesc(),fix:{mode:'ai-rules'}},
 {id:'g_codex',scope:'game',kind:'upgrade',since:3,label:'도감에 게임 규칙(상성·역할)이 기록되지 않았어요',test:()=>rulesNotInCodex(),fix:{mode:'auto',run:()=>{ rulesCodex(); }}},
 {id:'w_faction',scope:'game',kind:'upgrade',since:8,label:'세력·몬스터 설정이 얕아요(종류·목적·관계·정체가 비어 있음)',test:()=>factionReview().score<70,fix:{mode:'ai-run',run:()=>factionAI()}},
 {id:'c_monster',scope:'char',kind:'missing',since:1,label:'몬스터로 보이는 캐릭터예요(톡·일정·인연 대상이 되면 안 돼요 → 적으로 전환)',test:c=>!c.monster&&!c.alt&&isMonsterLike(c),fix:{mode:'auto',run:c=>charToMonster(c)}},
 {id:'c_debut',scope:'char',kind:'upgrade',since:8,label:'스토리 중간에 처음 나오는데 처음부터 뽑을 수 있는 캐릭터예요(첫 등장 스테이지 전엔 잠그기)',test:c=>!c.debut&&!own(c.id)&&!c.alt&&!c.monster&&!!firstSpeak(c)&&firstSpeak(c).k>0,fix:{mode:'auto',run:c=>{ const f=firstSpeak(c); if(f){ c.debut=f.s.id; delete c.debutLater; } }}},
 {id:'c_range',scope:'char',kind:'upgrade',since:7,label:'사거리(근접·원거리·지원)가 정해지지 않았어요(무기·포지션으로 추정해 정해요)',test:c=>!c.npc&&!RANGE[c.range],fix:{mode:'auto',run:c=>{ c.range=charRange(c); }}},
 {id:'s_direct',scope:'stage',kind:'upgrade',since:6,label:'대본에 연출(감정 아이콘·동작·화면 효과)이 없어요(AI로 대사는 그대로 두고 연출만 더해요)',test:s=>!s.dirV&&String((s.pre||'')+(s.post||'')).split('\n').length>=6&&dirCount((s.pre||'')+'\n'+(s.post||''))===0,fix:{mode:'ai-run',run:s=>directStage(s)}},
 {id:'s_rules',scope:'stage',kind:'upgrade',since:5,label:'전장 규칙·별 조건이 없는 스테이지예요(예전 생성물)',test:s=>!s.story&&!s.farm&&(s.enemies||[]).length>0&&!s.rulesV,fix:{mode:'auto',run:s=>{ const ch=G.chapters.find(c=>(c.stages||[]).includes(s)), L=ch?ch.stages:[s]; stageAutoRules(s,L.indexOf(s),L.length); }}},
 {id:'g_spots',scope:'game',kind:'upgrade',since:5,label:'일정(장소 방문) 장소가 없어요',test:()=>!spots().length,fix:{mode:'auto',ai:()=>spotsAI(),run:()=>{ spotsAuto(); }}},
 {id:'c_spot',scope:'char',kind:'upgrade',since:5,label:'일정 장소에서 만날 때의 장면이 없어요(기본 장면으로 나와요)',test:c=>!c.alt&&!c.npc&&spots().length>0&&spots().some(s=>!(c.spotTalk||{})[s.id]),fix:{mode:'ai-run',run:c=>spotTalkAI(c)}},
 {id:'l_imgperson',scope:'lib',kind:'missing',since:1,label:'배경·소품 그림 프롬프트에 사람 태그가 섞여 있어요(사람 그림이 돼요)',test:l=>!!IMG_NOHUMAN[l.kind]&&!!l.prompt&&imgGuard(l.kind,l.prompt).removed.length>0,fix:{mode:'auto',run:l=>{ plHit('img-person-'+l.kind,l.prompt); l.prompt=imgGuard(l.kind,l.prompt).out; }}},
 {id:'l_img',scope:'lib',kind:'missing',since:1,label:'배경·소품·CG·적 그림이 아직 없어요',test:l=>drawTodo(['bg','prop','cg','enemy']).some(it=>it.o===l),fix:{mode:'image'}}];
function auditVer(){ return Math.max(...AUDIT_RULES.map(r=>r.since)); }
function auditTargets(scope){ if(scope==='char') return G.chars; if(scope==='lib') return G.lib; if(scope==='game') return [G.meta]; if(scope==='stage') return G.chapters.filter(ch=>ch.kind==='main'||ch.kind==='event').flatMap(ch=>ch.stages||[]); return []; }
function auditName(r,o){ if(r.scope==='game') return G.meta.title||'게임'; if(r.scope==='stage'){ const ch=G.chapters.find(c=>(c.stages||[]).includes(o)); return `${ch?ch.title+' · ':''}${o.title||o.id}`; } return o.name||o.id; }
function auditScan(only){ const out=[]; for(const r of AUDIT_RULES){ const items=auditTargets(r.scope).filter(o=>(!only||only(o,r))&&(()=>{ try{ return r.test(o); }catch(e){ return false; } })()); if(items.length) out.push({rule:r,items}); } return out; }

/* 되돌리기: 마지막 일괄 작업 직전 상태 */
let AUDIT_UNDO=null, AUDIT_JOB=null;
function auditSnap(objs,label){ AUDIT_UNDO={label,at:Date.now(),items:objs.map(o=>({o,before:JSON.parse(JSON.stringify(o))}))}; }
function auditUndo(){ const U=AUDIT_UNDO; if(!U) return; for(const {o,before} of U.items){ for(const k of Object.keys(o)) if(!(k in before)) delete o[k]; Object.assign(o,before); if(G.chars.includes(o)) mark('c:'+o.id); } mark('prog'); AUDIT_UNDO=null; toast(`되돌렸어요: ${U.label}`); }
function auditMarkObj(o){ if(o===G.meta){ mark('meta','world'); return; } if(G.chars.includes(o)) mark('c:'+o.id); else if(G.lib.includes(o)) mark('l:'+o.id); else { const ch=G.chapters.find(c=>(c.stages||[]).includes(o)); if(ch) mark('ch:'+ch.id); } }

async function auditAIFill(c,fields,instruction){ // 빠진 항목 채우기(instruction 없음) 또는 지정 변환(instruction 있음)
  const schema='{'+fields.map(f=>AUDIT_FIELDS[f][1]).join(',')+'}', cur=fields.map(f=>`${AUDIT_FIELDS[f][0]}: ${JSON.stringify(c[f]??'')}`).join('\n');
  const r=await aiJSON(`${RULES}\n${ctx()}\n\n${T('crew')} 「${c.name}」(${ROLE[c.role]||''}, ${c.faction||'무소속'}). 프로필: ${String(c.profile||'').slice(0,400)}\n지금 값:\n${cur}\n\n${instruction?pf('AUDIT_CONVERT',{instruction}):pf('AUDIT_FILL')}${fields.includes('naiPrompt')?' '+NAI_CHAR:''}\nJSON만 출력: ${schema}`,null,'default');
  if(!r) return false;
  for(const f of fields){ const v=r[f]; if(v==null) continue;
    if(f==='touch'&&typeof v==='object') c.touch={head:auditStrs(v.head).slice(0,8),body:auditStrs(v.body).slice(0,8),pet:auditStrs(v.pet).slice(0,8)};
    else if(f==='affLines'&&typeof v==='object'){ const o={}; Object.entries(v).forEach(([k,x])=>{ const n=parseInt(k,10); if(n>=1&&n<=10) o[n]=auditStrs(x).slice(0,4); }); c.affLines=o; }
    else if(['lines','lvLines','dupLines'].includes(f)) c[f]=auditStrs(v).slice(0,12);
    else if(f==='naiPrompt') c.naiPrompt=stripAge(tagList(String(v)).filter(t=>!MINOR_TAGS.test(tagKey(t))).join(', '));
    else c[f]=String(v).trim(); }
  mark('c:'+c.id); return true; }
async function auditAIStage(s){ const ch=G.chapters.find(c=>(c.stages||[]).includes(s)); const r=await aiJSON(`${pf('AUDIT_STAGE',{RULES,ctx:ctx(),SCRIPT_FMT,title:ch?ch.title:'',title2:s.title||''})}\nJSON만 출력: {"pre":"대본"}`,null,'default'); if(!r||!r.pre) return false; s.pre=String(r.pre); auditMarkObj(s); return true; }

// 한 항목 고치기 — 점검 화면의 일괄 고치기(auditFix)와 실행 중 자동 채움(liveFill, 0537)이 같이 씀. 고쳤으면 true
// 규칙 고치기 중 글 AI로 더 잘 채울 수 있는 것(fix.ai — 일정 장소는 AI가 좋아하는 것 태그까지 붙여 "좋아하는 장소 ♥"가 맞음)은 AI가 있으면 AI로, 없거나 실패하면 규칙으로
async function auditAutoRun(rule,o){ if(SAMPLE&&rule.fix.ai){ try{ if(await rule.fix.ai(o)) return; }catch(e){ quietErr(e,'auditAutoRun'); } } rule.fix.run(o); }
async function auditFixOne(rule,o){ const m=rule.fix.mode;
  if(m==='auto'){ await auditAutoRun(rule,o); auditMarkObj(o); return true; }
  if(m==='ai') return !!(await auditAIFill(o,rule.fix.fields));
  if(m==='ai-stage') return !!(await auditAIStage(o));
  if(m==='ai-rules') return !!(await rulesAIFill());
  if(m==='ai-persona') return !!(await personaAI(o,rule.fix.k,{lines:rule.fix.k==='improve'}));
  if(m==='ai-afftalk') return !!(await talkAffGen(o));
  if(m==='ai-memo') return !!(await memorialGen(o));
  if(m==='ai-run') return !!(await rule.fix.run(o));
  if(m==='weapon'){ await fixWeaponPrompts([o]); auditMarkObj(o); return true; }
  if(m==='skills'){ v2Ensure(o); await v2ReadyChars([o]); auditMarkObj(o); return true; }
  if(m==='skills-remaster'&&balRemaster(o)){ await v2ReadyChars([o]); auditMarkObj(o); return true; }
  return false; }
async function auditFix(rule,items){
  if(AUDIT_JOB){ toast('점검 작업이 진행 중이에요'); return; } const m=rule.fix.mode;
  if(m==='open'){ const c=items[0]; if(rule.fix.stamp) items.forEach(x=>{ x.genVer=auditGenVer(); auditMarkObj(x); }); closeModal(); if(c&&typeof openRegen==='function') openRegen(c.id); if(items.length>1) toast(`${items.length}명을 지금 버전으로 표시했어요. 다시 만들 부분은 캐릭터마다 「다시 만들기」에서 골라요`); return; }
  if(m==='image'){ if(!imgReady()){ toast('그림 AI(NovelAI 또는 ComfyUI)를 먼저 설정해 주세요'); return; } const set=new Set(items); closeModal(); runPrep(rule.scope==='lib'?['bg','prop','cg','enemy']:auditImgCats,it=>set.has(it.c)||set.has(it.o)); return; }
  if((m==='ai'||m==='ai-stage'||m==='weapon'||m==='ai-rules'||m==='ai-persona'||m==='ai-afftalk'||m==='ai-memo'||m==='ai-run')&&!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; }
  auditSnap(items,rule.label); const job=AUDIT_JOB={stop:false,done:0,total:items.length}; let ok=0;
  try{ for(const o of items){ if(job.stop) break; syBar(`점검: ${rule.label} ${job.done+1}/${job.total}`);
      try{ if(await auditFixOne(rule,o)) ok++; }catch(e){ console.warn('audit',rule.id,e); }
      job.done++; } }
  finally{ AUDIT_JOB=null; syBar(''); }
  mark('prog'); toast(`${rule.label}: ${ok}/${items.length}개 고쳤어요${AUDIT_UNDO?' (되돌리기 가능)':''}`); if(!$('#modal').hidden) openAudit(AUDIT_FOCUS); else render(); }
async function auditConvert(chars,fields,instruction){
  if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; } if(!chars.length||!fields.length||!instruction.trim()){ toast('대상·항목·지시를 모두 정해 주세요'); return; } if(AUDIT_JOB) return;
  auditSnap(chars,'지정 변환: '+instruction.slice(0,20)); const job=AUDIT_JOB={stop:false}; let ok=0;
  try{ for(const [i,c] of chars.entries()){ if(job.stop) break; syBar(`지정 변환 ${i+1}/${chars.length}: ${c.name}`); try{ if(await auditAIFill(c,fields,instruction)) ok++; }catch(e){ quietErr(e,'0535-content-audit.js:94'); } } }
  finally{ AUDIT_JOB=null; syBar(''); } toast(`지정 변환: ${ok}/${chars.length}명 바꿨어요 (되돌리기 가능)`); openAudit(AUDIT_FOCUS); }

/* 화면 */
let AUDIT_FOCUS=null; // 캐릭터 하나만 볼 때 id
function openAudit(focus){ AUDIT_FOCUS=focus||null; if(!focus){ G.meta.auditSeen=auditVer(); mark('meta'); }
  const only=focus?(o=>o.id===focus):null, res=auditScan(only), old=G.chars.filter(c=>!c.alt&&(+c.genVer||0)<auditGenVer()&&!DEFAULT_CHARS.some(d=>d.id===c.id)).length, kinds={missing:'빠짐',upgrade:'구버전·업그레이드'}, how={auto:'자동 변환',ai:'AI로 채우기','ai-stage':'AI로 쓰기','ai-rules':'AI로 설명 채우기','ai-persona':'AI로 개성 채우기·다듬기','ai-afftalk':'AI로 인연 톡 만들기','ai-memo':'AI로 메모리얼 만들기','skills-remaster':'세대 맞추기(AS)',weapon:'AI로 고치기',skills:'다시 맞추기',image:'그림 그리기',open:'다시 만들기 열기'};
  const chars=focus?G.chars.filter(c=>c.id===focus):G.chars;
  openModal(`${head(focus?`${charById(focus)?.name||''} 점검`:'콘텐츠 점검·업그레이드',`<span class="muted">생성 규칙 v${auditGenVer()} · ${focus?'':`구버전 생성물 ${old}명`}</span>`)}
    <p class="muted" style="font-size:.82rem;margin:0 0 8px">생성 기능이 좋아졌거나 예전에 만든 콘텐츠에 빠진 게 있으면 여기에서 찾아 고쳐요. 고치기 전 상태는 마지막 작업 한 번까지 되돌릴 수 있어요.</p>
    ${AUDIT_UNDO?`<div class="panel" style="padding:8px 10px"><span class="muted">마지막 작업: ${esc(AUDIT_UNDO.label)} (${AUDIT_UNDO.items.length}개)</span> <button class="btn sm ghost" data-act="audundo">되돌리기</button></div>`:''}
    ${res.length?res.map(({rule:r,items},gi)=>`<details class="panel" style="margin:6px 0" ${gi<3?'open':''}><summary><span class="badge">${kinds[r.kind]}</span> <b>${esc(r.label)}</b> <span class="muted">${items.length}개</span></summary>
      <div style="max-height:160px;overflow:auto;margin:6px 0;font-size:.85rem">${items.map((o,i)=>`<label style="display:flex;gap:6px"><input type="checkbox" data-aud="${r.id}" data-i="${i}" checked>${esc(auditName(r,o))}${r.scope==='char'&&(+o.genVer||0)<auditGenVer()?' <span class="muted">(구버전)</span>':''}</label>`).join('')}</div>
      <button class="btn sm" data-act="audfix" data-rule="${r.id}">선택 항목 ${how[r.fix.mode]}</button></details>`).join(''):'<p>👍 찾은 문제가 없어요.</p>'}
    <details class="panel" style="margin-top:10px" ${focus?'open':''}><summary><b>지정 변환 (AI)</b> <span class="muted">고른 ${esc(T('crew'))}의 항목을 지시대로 바꿔요</span></summary>
      <label class="f">대상</label><div style="max-height:120px;overflow:auto;font-size:.85rem">${chars.map(c=>`<label style="display:inline-flex;gap:4px;margin:2px 8px 2px 0"><input type="checkbox" data-audc="${c.id}" ${focus?'checked':''}>${esc(c.name)}</label>`).join('')}</div>
      <label class="f">항목</label><div class="row" style="flex-wrap:wrap">${Object.entries(AUDIT_FIELDS).map(([k,[l]])=>`<label style="display:inline-flex;gap:4px"><input type="checkbox" data-audf="${k}">${esc(l)}</label>`).join('')}</div>
      <label class="f" for="aud_ins">지시</label><textarea class="in" id="aud_ins" rows="2" placeholder="예: 대사를 모두 반말로 / 프로필에 출신지와 좋아하는 음식 추가 / 외모 태그를 겨울 분위기로"></textarea>
      <div class="row" style="margin-top:6px"><button class="btn sm" data-act="audconv">지정 변환 시작</button></div></details>
    <div class="row" style="margin-top:12px">${AUDIT_JOB?'<button class="btn ghost" data-act="audstop">작업 멈추기</button>':''}<button class="btn ghost" data-act="close">닫기</button></div>`); }
function auditPanel(){ const n=auditScan().reduce((a,x)=>a+x.items.length,0), fresh=(+G.meta.auditSeen||0)<auditVer();
  return `<div class="panel pm-hide"><h3>콘텐츠 점검·업그레이드 ${fresh?'<span class="badge">생성 기능 향상</span>':''}</h3><p class="muted" style="margin:0 0 10px">${n?`고칠 수 있는 항목 ${n}개. `:''}빠진 대사·그림·태그, 구버전 생성물을 찾아 자동·AI로 고치거나, 고른 캐릭터를 지시대로 바꿔요.</p><button class="btn sm" data-act="audopen">점검 열기</button></div>`; }
function auditNotice(){ try{ if((+G.meta.auditSeen||0)>=auditVer()||!P().seenOpening) return; const n=auditScan().reduce((a,x)=>a+x.items.length,0); if(n) toast(`생성 기능이 좋아졌어요. 설정 → 게임 → 콘텐츠 점검에서 ${n}개를 업그레이드할 수 있어요`); }catch(e){} }
setTimeout(auditNotice,6000);

document.addEventListener('click',e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act;
  if(a==='audopen') openAudit(el.dataset.id||null);
  else if(a==='audundo'){ auditUndo(); openAudit(AUDIT_FOCUS); }
  else if(a==='audstop'){ if(AUDIT_JOB) AUDIT_JOB.stop=true; }
  else if(a==='audfix'){ const r=AUDIT_RULES.find(x=>x.id===el.dataset.rule), g=r&&auditScan(AUDIT_FOCUS?(o=>o.id===AUDIT_FOCUS):null).find(x=>x.rule===r); if(!g) return;
    const pick=[...document.querySelectorAll(`[data-aud="${r.id}"]`)].filter(x=>x.checked).map(x=>g.items[+x.dataset.i]).filter(Boolean); if(!pick.length){ toast('고칠 항목을 골라 주세요'); return; } auditFix(r,pick); }
  else if(a==='audconv'){ const cs=[...document.querySelectorAll('[data-audc]:checked')].map(x=>charById(x.dataset.audc)).filter(Boolean), fs=[...document.querySelectorAll('[data-audf]:checked')].map(x=>x.dataset.audf); auditConvert(cs,fs,($('#aud_ins')||{}).value||''); } });
