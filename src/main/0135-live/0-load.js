/* ===== 0135-live — 불러올 때(상수·상태·리스너): 계층 파일 밖에 남은 옛 조각을 이름 순(불러오는 순서)으로 이음 ===== */

/* ── 0135-schedule.js에서 ── */
/* ===== 일정 (장소 방문) ===== */
/* 전투 말고 캐릭터를 쓰는 곳: 하루 3번, 장소에 나와 있는 캐릭터를 만나 짧은 장면을 보고 호감도·보상을 받아요.
   좋아하는 것(개성 시트 likes·hobby)이 장소 태그와 맞으면 "좋아하는 장소" → 호감도 1.5배.
   - 장소 G.meta.spots=[{id,name,desc,bg,tags}] : 자료실 배경에서 자동으로 만들거나(spotsAuto) AI로(spotsAI)
   - 장면 c.spotTalk={[spot id]:대본} : AI로(spotTalkAI) 만들고, 없으면 개성 시트로 짧은 기본 장면(spotTemplate)
   - 생성 연계: 점검 규칙 g_spots(장소 없음 → 글 AI가 있으면 AI, 없으면 자료실 배경), c_spot(장면 없음 → AI) · 문서 docs/research/combat-content.md */
const SCHED_N=3;

document.addEventListener('click',async e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act;
  if(a==='scvisit') schedVisit(el.dataset.s,el.dataset.c);
  else if(a==='scauto'){ spotsAuto(); render(); }
  else if(a==='scai'){ if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; } if(await spotsAI(uiProg(el))){ toast('장소를 정했어요'); render(); } }
  else if(a==='sctalkall'){ if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; } const L=G.chars.filter(c=>own(c.id)&&!c.alt&&spots().some(s=>!(c.spotTalk||{})[s.id])); let n=0; for(const c of L){ syBar(`일정 장면 ${n+1}/${L.length}`); if(await spotTalkAI(c)) n++; } syBar(''); toast(`${n}명의 일정 장면을 만들었어요`); render(); } });

/* ── 0280-live-ops.js에서 ── */
/* ===== 라이브 운영 ===== */
/* 뒤에서 만들기: 다음 장·이벤트·픽업은 화면을 막지 않고 만들어요(그동안 전투·뽑기 가능). 다 되면 우편이 와요 */
const BGJOBS=[];
setInterval(()=>{ if(BGJOBS.length) bgJobsDraw(); },1000);

/* ── 0290-season-rotation.js에서 ── */
/* ===== 시즌 로테이션 (2주마다 운영 테마가 바뀌어요) ===== */
const SEASONS=[['story','스토리 시즌','메인 스토리 새 장이 열려요','📖'],['event','이벤트 시즌','기간 한정 이벤트와 한정 '+'캐릭터','🎪'],['char','캐릭터 시즌','신규 픽업 캐릭터와 그 캐릭터가 주인공인 픽업 스토리','✨'],['rerun','복각 시즌','지난 이벤트와 픽업이 돌아와요','🔁'],['train','육성 시즌','훈련 보상 2배 · 파견 보상 1.5배','💪']];
// 라이브 운영 주기(일): 설정 → 시즌 운영에서 바꿔요
const LIVE_CYC={season:[7,[[7,'1주'],[14,'2주'],[21,'3주'],[30,'한 달']]],event:[7,[[3,'3일'],[7,'1주'],[14,'2주'],[30,'한 달']]],chapter:[30,[[7,'1주'],[14,'2주'],[30,'한 달'],[60,'두 달']]],talk:[1,[[1,'매일'],[2,'2일'],[3,'3일'],[7,'1주']]],rotate:[14,[[7,'1주'],[14,'2주'],[30,'한 달']]]};
const baseChar=c=>c&&c.alt?charById(c.alt)||c:c;
const altsOf=c=>G.chars.filter(x=>x.alt===c.id);
let LIVE_RUN=false;
const PREP_CATS=()=>[['char','스탠딩',true],['upper','상반신',true],['pose','로비 레이어 (캐릭터별 배경 + 투명 포즈)',false],['illust','일러스트 (로비·픽업)',true],['enemy','적',true],['bg','배경',true],['icon','재화 아이콘',true],['map','작전 지도',true],['prop','소품',true],['weapon',T('weapon'),true],['cg','이벤트 CG',false],['scg','기술 컷인',false]];
let PREPJOB=null;

/* ── 0535-content-audit.js에서 ── */
/* ===== 콘텐츠 점검·업그레이드 (생성 기능이 좋아졌거나 기존 생성물에 빠진 게 있을 때) ===== */
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
 {id:'c_pfields',scope:'char',kind:'missing',since:9,label:'프로필 항목(생일·신장 등 게임의 프로필 틀)이 비었어요',test:c=>!c.alt&&((c.persona||{}).traits||[]).length>0&&!Object.keys(c.pfields||{}).length,fix:{mode:'ai-persona',k:'fill'}},
 {id:'c_persona_weak',scope:'char',kind:'upgrade',since:4,label:'개성 검수 점수가 낮아요(매력·차별성 부족)',test:c=>!c.alt&&((c.persona||{}).traits||[]).length>0&&personaReview(c).score<55,fix:{mode:'ai-persona',k:'improve'}},
 {id:'c_afftalk',scope:'char',kind:'missing',since:4,label:'호감도에 따라 열리는 인연 톡이 없어요',test:c=>!c.alt&&!affThreads(c).length,fix:{mode:'ai-afftalk'}},
 {id:'c_memorial',scope:'char',kind:'missing',since:4,label:'메모리얼(높은 호감도 특별 장면·로비 대사)이 없어요',test:c=>!c.alt&&!(c.memorial&&c.memorial.script),fix:{mode:'ai-memo'}},
 {id:'g_rules',scope:'game',kind:'upgrade',since:3,label:'속성·역할 설명이 없어요(게임 규칙·도감에 표시돼요)',test:()=>rulesMissingDesc(),fix:{mode:'ai-rules'}},
 {id:'g_pos',scope:'game',kind:'upgrade',since:9,label:'세계관에 맞춘 포지션이 없어요(기본 공격·방어·지원으로 돌아가요 — AI로 설계해 캐릭터에 배정)',test:()=>!(Array.isArray(G.meta.positions)&&G.meta.positions.length),fix:{mode:'ai-run',run:()=>posAI()}},
 {id:'g_codex',scope:'game',kind:'upgrade',since:3,label:'도감에 게임 규칙(상성·역할)이 기록되지 않았어요',test:()=>rulesNotInCodex(),fix:{mode:'auto',run:()=>{ rulesCodex(); }}},
 {id:'w_stance',scope:'game',kind:'upgrade',since:10,label:'세력과 플레이어의 관계 변화(장별 태도)가 없어요(세력 종류 기본값으로만 돌아요 — 이미 쓴 장 이야기로 채워요)',test:()=>G.chapters.some(ch=>ch.kind==='main')&&factions().some(f=>f.kind!=='monster')&&factions().filter(f=>f.kind!=='monster').every(f=>!(f.stance||[]).length),fix:{mode:'ai-run',run:()=>stanceAI()}},
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

/* 되돌리기: 마지막 일괄 작업 직전 상태 */
let AUDIT_UNDO=null, AUDIT_JOB=null;



/* 화면 */
let AUDIT_FOCUS=null; // 캐릭터 하나만 볼 때 id
setTimeout(auditNotice,6000);

document.addEventListener('click',e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act;
  if(a==='audopen') openAudit(el.dataset.id||null);
  else if(a==='audundo'){ auditUndo(); openAudit(AUDIT_FOCUS); }
  else if(a==='audstop'){ if(AUDIT_JOB) AUDIT_JOB.stop=true; }
  else if(a==='audfix'){ const r=AUDIT_RULES.find(x=>x.id===el.dataset.rule), g=r&&auditScan(AUDIT_FOCUS?(o=>o.id===AUDIT_FOCUS):null).find(x=>x.rule===r); if(!g) return;
    const pick=[...document.querySelectorAll(`[data-aud="${r.id}"]`)].filter(x=>x.checked).map(x=>g.items[+x.dataset.i]).filter(Boolean); if(!pick.length){ toast('고칠 항목을 골라 주세요'); return; } auditFix(r,pick); }
  else if(a==='audconv'){ const cs=[...document.querySelectorAll('[data-audc]:checked')].map(x=>charById(x.dataset.audc)).filter(Boolean), fs=[...document.querySelectorAll('[data-audf]:checked')].map(x=>x.dataset.audf); auditConvert(cs,fs,($('#aud_ins')||{}).value||''); } });

/* ── 0537-live-fill.js에서 ── */
/* ===== 포크 기능 내용 자동 채움(실행 중 AI) =====
   원안의 liveTick이 게임이 구동되는 동안 장·이벤트·톡을 AI로 만들듯, 포크 기능의 내용이 비어 있으면 구동 중에 자동으로 채워요.
   채우는 방법은 콘텐츠 점검(0535) 규칙의 고치기를 그대로 써요(auditFixOne). 자동이 기본이고, 사용자는 콘텐츠 점검·각 화면에서
   직접 고치거나 AI에 추가 지시할 수 있어요. 설정 → 라이브 운영의 "빈 콘텐츠 자동 채움"으로 끌 수 있어요(live.on.fill) */
const LIVE_FILL_AUTO=['g_spots','g_codex','c_symbol','c_pos','c_range','s_rules']; // 규칙으로 채움(일정 장소만 글 AI가 있으면 AI로 — auditAutoRun) — 빈 것은 매번
const LIVE_FILL_AI=['g_pos','w_stance','c_persona','c_pfields','c_afftalk','c_memorial','c_spot','s_direct']; // AI로 채움 — 한 번에 LIVE_FILL_MAX개까지
const LIVE_FILL_OWNED=new Set(['c_afftalk','c_memorial','c_spot']);              // 만날 수 있는(보유한) 대원부터
const LIVE_FILL_NAME={g_spots:'일정 장소',g_codex:'도감 규칙',c_symbol:'상징 컬러·아이템',c_pos:'포지션',c_range:'사거리',s_rules:'전장 규칙',g_pos:'포지션 설계',w_stance:'세력 관계 변화',c_persona:'개성 시트',c_pfields:'프로필 항목',c_afftalk:'인연 톡',c_memorial:'메모리얼',c_spot:'일정 장면',s_direct:'대본 연출'};
const LIVE_FILL_MAX=4;
