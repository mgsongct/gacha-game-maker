/* ===== newgame — 기능 class(Model · View · Ctl) — docs/redesign.md 2·3절, tools/reshape.mjs가 매핑대로 옮김 ===== */
class NewGame {
    /* src/main/0160-player-profile.js */
static heroTagsPrompt({hr}){ return `${Core.pf('HERO_TAGS',{gender:hr.gender||'정하지 않음',look:hr.look,hide:hr.hide?'':'눈, '})}\nJSON만 출력: {"tags":"..."}`; }

  static buildNewGameDraftPrompt({base,FAN,STY,DRA,auto,heroBlank,hero,draft,DT,kw,tone,userTitle,th}){ return `${base}${FAN}${STY}${DRA}\n${EXPLORATION_NAME_RULE}\n${FACTION_RULE}\n${Core.pf('NG_WORLD',{pos:POS_RULE,autoHint:auto?Core.pf('NG_AUTO_HINT'):'',heroAsk:heroBlank?Core.pf('NG_HERO_ASK'):'',playerTerm:hero.call?Core.pf('NG_PLAYER_TERM',{call:hero.call}):'',crewTerm:String(draft.crewTerm||'').trim()?Core.pf('NG_CREW_TERM',{crew:String(draft.crewTerm).trim()}):Core.pf('NG_TERMS_NEW'),heroLine:!DT&&(hero.name||hero.gender||hero.look||hero.bio)?`\n주인공(플레이어): 이름 ${hero.name||'(세계관 호칭)'}, 성별·성 정체성 ${hero.gender||'정하지 않음'}${hero.look?', 외모 '+hero.look:''}${hero.bio?', 설정 '+hero.bio:''}.`:'',kw,tone:tone&&!dupTxt(kw,tone)?tone:'자유',title:userTitle?Core.pf('NG_TITLE_FIXED',{title:userTitle}):TITLE_RULE+Core.pf('NG_TITLE_KEYWORD'),theme:th==='auto'?'tactical, fantasy, neon, pastel, noir 중 어울리는 것':th})}\nJSON만 출력: {"title":"게임 이름","sub":"영문 부제","theme":"tactical|fantasy|neon|pastel|noir","accent":"#rrggbb","terms":{"player":"플레이어 호칭","currency":"유료 재화","gold":"일반 재화","expMat":"경험치 재료","wMat":"스킬 강화 재료","core":"세계관에 맞는 Lv1~70 승급 재료 고유 이름","gearMat":"세계관에 맞는 장비 강화 재료 고유 이름","transcMat":"세계관에 맞는 Lv71~120 초월승급 재료 고유 이름","gacha":"뽑기 이름(2~3자)","ops":"전투 메뉴 이름(2~3자)","crew":"아군 호칭(2~3자)","talk":"메신저 앱 이름","dispatch":"파견 이름","farm":"재료 던전 이름","pass":"패스 이름","event":"이벤트","weapon":"전용 무기 호칭","files":"캐릭터 비밀 기록 호칭","skin":"의상 호칭","enhance":"강화","limit":"돌파 호칭","abyss":"세계관에 어울리는 반복 탐사 콘텐츠 이름(2~12자)",${CON_TERMS_SCHEMA}},"elems":[{"n":"속성(1~2자)","c":"#색","d":"상징하는 것과 이기는 이유(한 줄)","beats":"이 속성이 이기는 속성 이름"}],${REACT_SCHEMA},${POS_SCHEMA},"roleDesc":{"atk":"공격 역할 한 줄 설명","def":"방어 역할 한 줄","sup":"지원 역할 한 줄"},"roles":{"atk":"","def":"","sup":""},"farms":[{"key":"exp","name":""},{"key":"gold","name":""},{"key":"wmat","name":""},{"key":"core","name":""}],${EXPEDITION_SCHEMA},${NewGame.profileTplSchema()},${FINALE_SCHEMA},${VARIANT_SCHEMA},"world":{"name":"","summary":"2~3문장, 플레이어 입장 포함","lore":"6~10문장","plot":"숨겨진 진실, 복선, 1부 전체 전개 6~10문장","factions":${FACTION_SCHEMA}},"dispatches":[{"name":"","desc":""}]}  ${EXPEDITION_RULE} ${FINALE_RULE} ${PROFILE_TPL_RULE} ${VARIANT_RULE}`; }

  static buildNewGameDraftBaseText({draft}){ return Core.pf('NG_BASE_RULE',{castSex:NewGame.castRule(draft.castSex||'')}); }

  static buildNewGameDraftFANText({src}){ return src?Core.pf('NG_FANFIC',{src}):''; }

  static buildNewGameDraftSTYText({SC}){ return SC.plot?Core.pf('NG_PLAYER_PLOT',{plot:SC.plot}):''; }

  static buildNewGameDraftDRAText({DT,draft,plot}){ const t=DT&&plot?Core.drText(Object.assign({},draft,{story:''})).slice(0,100000):DT; return t?Core.pf('NG_AUTHOR_BIBLE',{DT:t}):''; } // 플롯을 적었으면 작가 설정에서 스토리 개요를 뺌 — 「플레이어가 직접 짠 스토리」에 이미 있음

  static buildNewGameDraftPrompt2({FAN,STY,DCH,DNPC,DRA,ng,n,N1,src}){ return `${RULES}${FAN}${STY?STY+Core.pf('NG_STORY_CAST',{crew:System.T('crew')}):''}${DCH.length?Core.pf('NG_AUTHOR_CAST',{crew:System.T('crew'),list:DCH.map(c=>`- ${c.name}${c.rank?' / 등급 '+RL[c.rank]+' (rarity '+c.rank+')':''}${c.role?' / '+c.role:''}${c.profile?' / 성격·과거·관계: '+c.profile:''}${c.speech?' / 말투: '+c.speech:''}${c.look?' / 외모: '+c.look:''}`).join('\n')}):''}${DNPC.length?Core.pf('NG_NPC_NOT_CREW',{crew:System.T('crew'),names:DNPC.map(c=>c.name).join(', ')}):''}${DRA}\n세계관: ${ng.world.summary}\n${ng.world.lore}\n플롯: ${ng.world.plot}\n세력: ${ng.world.factions.map(f=>f.name+'('+f.desc+')').join(', ')}\n\n${Core.pf('NG_CAST',{crew:System.T('crew'),n:Math.max(n,DCH.length),ssrMin:Math.max(1,Math.round(n/5)),third:Math.max(1,Math.round(n/3)),rarity:CAST_RARITY_RULE})}\n${CAST_DEBUT_RULE}\n세력: ${ng.world.factions.map(f=>`${f.name}(${FKIND[f.kind]})`).join(', ')}\nJSON만 출력: {"chars":[${NewGame.charSchema().replace(/^\{/,'{"debut":"start|1~'+N1+'|later",')}, ...]} ${NAI_CHAR}${src?Core.pf('NG_SOURCE_TAGS'):''}`; }

  static buildNewGameDraftPrompt3({ng,miss}){ return `${RULES}\n세계관: ${ng.world.summary}\n세력: ${ng.world.factions.map(f=>f.name).join(', ')}\n다른 ${System.T('crew')}: ${ng.chars.map(c=>c.name).join(', ')}\n${Core.pf('NG_FILL_MISSING',{crew:System.T('crew')})}\n${miss.map(c=>`- ${c.name}${c.rank?' / rarity '+c.rank:''}${c.role?' / '+c.role:''}${c.profile?' / '+c.profile:''}${c.speech?' / 말투: '+c.speech:''}${c.look?' / 외모: '+c.look:''}`).join('\n')}\nJSON만 출력: {"chars":[${NewGame.charSchema()}, ...]} ${NAI_CHAR}`; }

  static buildNewGameDraftPrompt4({ng,DNPC}){ return `세계관: ${ng.world.name} — ${String(ng.world.summary||'').slice(0,400)}\n${Core.pf('NG_NPC_ART')}\n${DNPC.map(c=>`- ${c.name}${c.role?' / '+c.role:''}${c.look?' / 외모: '+c.look:''}${c.profile?' / '+String(c.profile).slice(0,200):''}`).join('\n')}\n${NAI_CHAR}\nJSON만 출력: {"npcs":[{"name":"","naiPrompt":""}]}`; }

  static buildNewGameDraftPrompt5({CX0,LS,ng}){ return `${CX0}\n${SCRIPT_FMT}\n\n${Core.pf('NG_OPENING',{pro:LS.pro,castPlan:NewGame.castPlanData(ng.chars)})}\nJSON만 출력: {"opening":{"lines":[],"prologue":""},"backgrounds":[{"name":"","prompt":""}],"props":[{"name":"","prompt":""}],"music":[{"name":"","prompt":""}],"banners":{"std":"","pickup":{"name":"","char":""},"faction":{"name":"","faction":""}}}`; }

  static buildNewGameDraftKEEPHINTText({KEEP}){ return KEEP.length?Core.pf('NG_KEEP_ART',{kind:KEEP.filter(l=>l.kind==='bg').map(l=>l.name).join(', '),kind2:KEEP.filter(l=>l.kind==='prop').map(l=>l.name).join(', ')||'없음'}):''; }

  static buildNewGameDraftPrompt6({CX0,bgNames,prNames,N1,LS,ng}){ return `${CX0}\n${SCRIPT_FMT}\n${THREAD_FMT}\n\n${Core.pf('NG_CHAPTER1',{bgs:bgNames.join(', '),props:prNames.join(', '),n:N1,pre:LS.pre,post:LS.post,finale:NewGame.finaleRule(),talkOnly:NewGame.talkOnlyRule(N1),modes:STAGE_MODES,detail:DETAIL_RULE,npc:NewGame.npcRule(true),dup:THREAD_DUP_RULE,castPlan:NewGame.castPlanData(ng.chars),bestiary:BESTIARY_RULE})}\nJSON만 출력: {"summary":"",${REL_SCHEMA()},"chapter":{"title":"1장 제목","logline":"이 장의 한 줄 줄거리(40자 안팎, 스포일러 없이 궁금하게)","stages":[{"title":"","battle":true,"pre":"","post":"",${NewGame.modeSchema()},${ROUTE_SCHEMA},"enemies":[{"name":"","elem":"${ELEMS.join('|')}","hp":0,"atk":0,"def":0,"spd":0,"boss":false,"look":"보스나 새로운 종류일 때만 NovelAI 영어 외형 태그(괴물은 no humans로 시작)","reuse":"그림을 같이 쓸 기존 적 이름(일반 적)","faction":""}]}]},${BESTIARY_SCHEMA},"threads":[{"char":"","title":"","trigger":"start|clear","afterStage":1,"script":""}]}`; }

  static composeCG(l,opt){
    opt=opt||{}; const c=Core.naiCfg(), st=Core.naiStyle(c,opt.styleId||l.naiStyle), cast=Core.cgCast(l), n=cast.length;
    // 인원 태그는 각 인물 프롬프트의 1girl/1boy를 세어 만들어요(남성·혼성 게임에서 1girl로 고정되던 문제)
    const sx=cast.map(x=>{ const k=Core.tagList(x.c.naiPrompt).map(Core.tagKey); return k.includes('1boy')?'b':k.includes('1other')?'o':'g'; }), ng=sx.filter(x=>x==='g').length, nb=sx.filter(x=>x==='b').length, no=sx.filter(x=>x==='o').length;
    const count=n?[ng?(ng===1?'1girl':ng+'girls'):'',nb?(nb===1?'1boy':nb+'boys'):'',no?(no===1?'1other':no+'others'):'',n===1?'solo':''].filter(Boolean).join(', '):'no humans';
    return {input:Core.joinTags(st.tags,c.prefix,count,l.prompt,c.parts.cg.suffix),neg:Core.joinTags(c.neg,st.neg,c.parts.cg.neg,n?'child, loli':''),
      chars:cast.map(x=>({name:x.c.name,id:x.c.id,prompt:Characters.charCaption(x.c,x.act),uc:'',pos:x.pos}))};
  }

    // 오프닝·1장의 등장 계획 명단(지시문은 프롬프트 스튜디오의 CAST_PLAN_RULE — 프롤로그 = 처음부터 동료와의 첫 만남, 원안의 "첫 동료들과의 강렬한 만남")
static castPlanData(L){ const N=X=>X.map(c=>c.name).join(', '), st=L.filter(c=>!c.__deb&&!c.debutLater), d=L.filter(c=>c.__deb), lt=L.filter(c=>c.debutLater);
    return `등장 계획 — 처음부터 함께하는 동료: ${N(st)||'없음'}${d.length?' / 1장에서 처음 만나는 인물: '+d.map(c=>`${c.name}(${c.__deb}번째 스테이지)`).join(', '):''}${lt.length?' / 나중 등장: '+N(lt):''}\n${CAST_PLAN_RULE}`; }

  static charSchema(slim){return `{"skills":${JSON.stringify(GGMCombat.promptExample({role:"atk"}))},"name":"짧은 이름","faction":"소속 세력","rarity":1~3 정수(3=SSR),"pos":"${Rules.POSITIONS().map(p=>p.name).join('|')}","range":"melee(근접)|ranged(원거리)|support(지원) — 무기·전투 방식에 맞게","persona":{"traits":["서로 다른 축의 성격 3개"],"self":"1인칭","call":"플레이어를 부르는 말","ending":"말끝·어미","quirk":"말버릇","catch":"이 캐릭터만 할 대표 대사","gap":"겉과 다른 반전 매력","flaw":"결점","want":"원하는 것","fear":"두려워하는 것","likes":[""],"dislikes":[""],"hobby":"","motif":"상징"},"pfields":{${Characters.PERSONA_CFG().tpl.map(k=>`"${k}":""`).join(',')}},"role":"atk|def|sup(포지션의 기본형)","elem":"${ELEMS.join('|')}",${slim?'':'"hp":800~3000(방어형은2280~2820),"atk":80~180,"def":35~160(방어형은122~151),"spd":80~125,'}"skill":{"name":"","kind":"dmg|aoe|heal|shield|buff",${slim?'':'"power":0.8~3.0,"cd":2~4,'}"desc":"한 줄"},"profile":"2~3문장","intro":"${System.T('gacha')} 연출 첫마디","lines":["로비 인사 대사 8개${CHAR_LINES_RULE}"],"affLines":{"4":["호감도 4부터 나오는 대사"],"7":["호감도 7부터"]},"lvLines":["${System.T('enhance')} 시 대사 2개"],"dupLines":["${System.T('limit')} 시 대사 1개"],"touch":{"head":["머리 터치 반응 4개"],"body":["몸 터치 시 당황하거나 놀리는 반응 4개"],"pet":["머리를 쓰다듬어 줄 때 반응 4개"]},"files":[{"dup":1,"text":"${System.T('limit')} 1단계에 공개되는 비밀 설정"},{"dup":3,"text":"3단계 비밀 설정, 메인 플롯과 연결"}],"weapon":{"name":"${System.T('weapon')} 이름","desc":"한 줄","prompt":"NovelAI 영어 태그, no humans, object focus로 시작해 simple background, white background로 끝"},"naiPrompt":"..."}`;}

    /* 불러올 때 계산하던 견본(기능 데이터 CHARM·PROFILE_TPLS를 씀)은 쓸 때 만드는 함수로 — 스튜디오가 기능 파일보다 먼저 돌아서 */
  /* src/main/0488-stage-modes.js */
static modeSchema(){ return `"mode":"battle|debate|contest","debate":{"opponent":"상대 이름","goal":"이 회담의 목표","evidence":[{"id":"e1","name":"","desc":""}],"rounds":[{"claim":"상대 주장 요약","lines":[{"text":"상대의 말","press":"추궁하면 나오는 대답","weak":"모순을 밝히는 증거 id 또는 빈칸","persuade":{"who":"","text":""}}]}],"win":"","lose":""},"contest":{"title":"","judges":[{"name":"","likes":"${Object.keys(CHARM).join('|')}"}],"rounds":3,"rivals":[{"name":"","power":1}]}`; }

  static finaleRule(){ return `이 게임의 finale: ${Battle.storyCfg().finale}. ${FINALE_RULE}`; }

    /* src/main/0455-persona.js */
static profileTplSchema(){ return '"profileTemplate":"'+Object.keys(PROFILE_TPLS).join('|')+'"'; }

  static castRule(k){ k=k==null?((typeof G!=='undefined'&&G&&G.meta&&G.meta.castSex)||''):k; return k==='f'?Core.pf('CAST_SEX_F'):k==='m'?Core.pf('CAST_SEX_M'):k==='mix'?Core.pf('CAST_SEX_MIX'):''; }

  static npcRule(noNew){ const ns=G.npcs||[]; return `${ns.length?Core.pf('NPC_RULE',{npcs:ns.map(n=>n.name).join(', ')}):''}`+(noNew?'':Core.pf('NPC_NEW_RULE',{crew:System.T('crew')})); }

  static talkOnlyRule(n){ const k=Battle.storyCfg().talkOnly; if(!k||n<3) return Core.pf('TALK_ALL_BATTLE'); const m=k>=3?Math.floor(n/2):Math.min(k,n-2); return Core.pf('TALK_ONLY_RULE',{m,finale:''}).trim(); }

    // All presets transport quality inside their positive style; qtags is legacy input only.
static presetQualityParts(p){return {tags:Core.joinTags(p.tags,p.qtags),qtags:'',quality:false};}

  static naiDraw(kind,base,opt){
    opt=opt||{};
    if(kind==='cg'){ const p=NewGame.composeCG(opt.item||{},opt); return Core.naiGenerate(p.input,'cg',Object.assign({},opt,{neg:p.neg,chars:p.chars})); }
    const k=kind==='weapon'?'prop':kind, p=PromptStudio.composeNai(k,base,opt); return Core.naiGenerate(p.input,k,Object.assign({},opt,{neg:p.neg}));
  }

  static async idbPut(k,v){await appStorage.mediaWrite(k,v,LKEY);try{const ix=JSON.parse(appStorage.getItem('ggm-sync-idx')||'{}');if(ix[k]){delete ix[k];appStorage.setItem('ggm-sync-idx',JSON.stringify(ix));}}catch(e){}}

    /* 대화 사진 저장(Model): 그림 저장소에 넣고 열쇠를 돌려줌 */
static async chatImgStore(b){ const k='chat_'+uid(); await NewGame.idbPut(IMGNS+k,b); chatImgCache[k]=URL.createObjectURL(b); return k; }

    /* 갠톡 기록(Model): 말 하나 더하기(대화방을 안 보고 있으면 안 읽음) · 답장 뒤 정리(기록 400개까지, 하루 호감도 20까지) · 스레드를 자유 대화로 넘김(끝으로 하고 인연 +10 — 넘겼으면 true) */
static fcLogAdd(f,m,unread){ f.log.push(m); f.at=m.at; if(unread) f.unread=(f.unread||0)+1; Core.mark('prog'); }

  static heroTags(hr){ return HeroTagsGen.run({hr}); }

  static modeClean(s){ const mode=String(s&&s.mode||'').trim(), cfg=Battle.modesCfg();
    if(mode==='debate'&&cfg.debate&&s.debate){ const d=s.debate, ev=(Array.isArray(d.evidence)?d.evidence:[]).slice(0,8).map((e,i)=>({id:S_(e.id,12).replace(/[^\w-]/g,'')||'e'+(i+1),name:S_(e.name,30),desc:S_(e.desc,160)})).filter(e=>e.name);
      const ids=new Set(ev.map(e=>e.id)), rounds=(Array.isArray(d.rounds)?d.rounds:[]).slice(0,4).map(r=>({claim:S_(r.claim,120),lines:(Array.isArray(r.lines)?r.lines:[]).slice(0,6).map(l=>({text:S_(l.text,200),press:S_(l.press,200),weak:ids.has(S_(l.weak,12))?S_(l.weak,12):'',persuade:l.persuade&&S_(l.persuade.who,20)?{who:S_(l.persuade.who,20),text:S_(l.persuade.text,200)}:null})).filter(l=>l.text)})).filter(r=>r.lines.length&&r.lines.some(l=>l.weak||l.persuade));
      if(ev.length&&rounds.length) return {mode:'debate',debate:{opponent:S_(d.opponent,20)||'상대',goal:S_(d.goal,120),evidence:ev,rounds,hp:Math.max(3,Math.min(7,+d.hp||5)),win:S_(d.win,200),lose:S_(d.lose,200)}}; }
    if(mode==='contest'&&cfg.contest&&s.contest){ const c=s.contest, judges=(Array.isArray(c.judges)?c.judges:[]).slice(0,3).map(j=>({name:S_(j.name,20)||'심사위원',likes:CHARM[j.likes]?j.likes:Object.keys(CHARM).find(k=>CHARM[k]===j.likes)||'cool'}));
      if(judges.length) return {mode:'contest',contest:{title:S_(c.title,40)||'콘테스트',judges,rounds:Math.max(2,Math.min(5,+c.rounds||3)),rivals:(Array.isArray(c.rivals)?c.rivals:[]).slice(0,3).map(r=>({name:S_(r.name,20)||'경쟁자',power:Math.max(.6,Math.min(1.6,+r.power||1))})).filter(r=>r.name)}}; }
    return null; }

  static lookMap(stages){const m={__reuse:{}};(Array.isArray(stages)?stages:[]).forEach(s2=>(Array.isArray(s2&&s2.enemies)?s2.enemies:[]).forEach(e=>{if(e&&e.name&&e.look)m[String(e.name)]=String(e.look);if(e&&e.name&&e.reuse)m.__reuse[String(e.name)]=String(e.reuse);}));return m;}

  static variantsFromAI(list,ng){ return GGMConstruct.variantsFrom(list,{factions:((ng.world||{}).factions||[]).map(f=>f.name),elems:(ng.meta.elems||DEFAULT_META.elems).map(e=>e.n)}).map(v=>Object.assign({id:'v_'+uid()},v)); }

    // 생성된 반응 정리: 값의 뜻은 종류마다 다름(REACT_TYPES — amp 배율·burst 공격력×값·stun 초·vuln 받는 피해 +%). vuln 값이 배율처럼 보이면(5 미만, 예 1.3) 백분율로(30)
static reactClean(x){ const type=['amp','burst','stun','vuln'].includes(x.type)?x.type:'amp'; let value=+x.value||''; if(type==='vuln'&&value&&value<5) value=Math.round((value>1?value-1:value)*100);
    return {a:x.a,b:x.b,name:String(x.name||'반응').slice(0,12),type,value}; }

  static posClean(list){ return (Array.isArray(list)?list:[]).slice(0,10).map(p=>({id:'p_'+uid(),name:String(p.name||'포지션').slice(0,10),base:ROLE[p.base]?p.base:'atk',desc:String(p.desc||'').slice(0,80),range:RANGE[p.range]?p.range:'',t:Object.fromEntries(POS_TRAITS.map(([k])=>[k,Math.max(-80,Math.min(150,Math.round(+((p.t||{})[k])||0)))]).filter(([,v])=>v))})).filter(p=>p.name); }

    /* 쓸 만한 포지션 목록: 2개 이상이고 기본형(공격·방어·지원)이 다 있음 — 새 게임 생성(0250)과 포지션 자동 설계가 같이 씀 */
static posValid(L){ return L.length>=2&&['atk','def','sup'].every(k=>L.some(p=>p.base===k)); }

  static normTalk(t){ return String(t||'').replace(/[\s.,!?~…ㅋㅎㅠㅜ"'“”‘’\-—()]/g,'').toLowerCase(); }

  static storySayNorms(ch){ const set=new Set(); (ch.stages||[]).forEach(s=>System.parseScript((s.pre||'')+'\n'+(s.post||'')).forEach(L=>{ if(L.type==='say'){ const x=NewGame.normTalk(L.text); if(x.length>=4) set.add(x); } })); return set; }

    // 톡이 본편 [톡] 장면을 그대로 되풀이하면(말풍선 30% 이상 같으면) 버려요
static threadDup(script,set){ const ls=System.parseScript(script).filter(L=>L.type==='say').map(L=>NewGame.normTalk(L.text)).filter(x=>x.length>=4); if(!ls.length||!set.size) return false; const arr=[...set]; let d=0;
    ls.forEach(x=>{ if(set.has(x)||arr.some(y=>(y.length>=8&&x.includes(y))||(x.length>=8&&y.includes(x)))) d++; }); return d/ls.length>=0.3; }

  static dedupText(text,seen,min){ min=min||8; let cut=0; const out=String(text||'').split('\n').map(line=>{ const m=line.match(/^(\s*(?:[-*•]|\d+[.)])?\s*(?:비밀\s*:)?\s*)/), pre=m?m[1]:''; const parts=line.slice(pre.length).split(/(?<=[.!?。…])\s+/);
      const keep=parts.filter(sn=>{ const k=sentKey(sn); if(k.length<min) return true; if(seen.some(x=>x===k||x.includes(k))){ cut++; return false; } seen.push(k); return true; });
      if(!keep.length&&parts.some(x=>x.trim())) return null; return pre+keep.join(' '); }).filter(l=>l!==null).join('\n').replace(/\n{3,}/g,'\n\n').trim(); return {text:out,cut}; }

    // 새 게임의 빈 세계관: 원본 샘플(DEFAULT_WORLD)의 칸 구조만 쓰고 내용은 비워요(빠진 칸에 다른 세계의 플롯·세력이 남지 않게)
static blankWorld(){ return Object.fromEntries(Object.entries(clone(DEFAULT_WORLD)).map(([k,v])=>[k,Array.isArray(v)?[]:typeof v==='string'?'':v&&typeof v==='object'?{}:v])); }

    /* 원본 샘플의 상점 NPC(「보급관」) 대신 중립 이름 */
static neutralShop(){ return Object.assign(clone(DEFAULT_META.shop),{name:'상점'}); }

    /* 대원 단계 뒤: 희귀도 분포 보정(작가가 정한 등급은 그대로), 조건에 맞는 대원이 하나도 없는 바리에이션은 조건을 비움 */
static ngCharsPost(ng,DCH){ NewGame.rarityFix(ng.chars,new Set(DCH.filter(d=>d.rank).map(d=>d.name)));
    (ng.meta.variants||[]).forEach(t=>{ if(t.cond&&Object.keys(t.cond).length&&!ng.chars.some(c=>!c.monster&&GGMConstruct.condMatch(t.cond,c,{}))) t.cond={}; }); }

    /* 희귀도 분포: SSR은 ⌈n/3⌉명 이하, R은 ⌊n/3⌋명 이상, SR·SSR 1명 이상(3명 이상일 때). 뒤쪽(나중에 나온) 캐릭터부터 한 단계씩 조정하고 능력치를 그 등급 범위로 맞춰요.
     생성 게임 둘 다 6명 중 R 1명이라 첫 10연에서 R 자리가 모두 같은 캐릭터였어요 */
static rarityFix(L,fixed){ const n=L.length; if(n<3) return 0; let k=0; const free=()=>[...L].reverse().filter(c=>!fixed.has(c.name)), cnt=r=>L.filter(c=>c.rarity===r).length, set=(c,r)=>{ c.rarity=r; k++; Characters.balNormalize(c,'edge'); };
    for(const c of free()){ if(cnt(3)<=Math.ceil(n/3)) break; if(c.rarity===3) set(c,2); }
    for(const c of free()){ if(cnt(1)>=Math.floor(n/3)) break; if(c.rarity===2&&cnt(2)>1) set(c,1); }
    for(const c of free()){ if(cnt(1)>=Math.floor(n/3)) break; if(c.rarity===3&&cnt(3)>1) set(c,2); }
    if(!cnt(3)){ const c=free().reverse().find(c=>c.rarity===2)||free().reverse().find(c=>c.rarity===1&&cnt(1)>Math.floor(n/3)); if(c) set(c,3); }
    if(!cnt(2)){ const c=free().find(c=>c.rarity===1&&cnt(1)>Math.floor(n/3))||free().find(c=>c.rarity===3&&cnt(3)>1); if(c) set(c,2); }
    return k; }

    /* 그림 유지 리롤: 원래 게임의 캐릭터·NPC·배경 그림을 이름으로 짝지어 새 게임에 그대로 옮겨요(새로 그리지 않아도 돼요) */
static reuseSrc(draft){ const r=draft&&draft.reuse; if(!r||!r.pj) return null; if(r.pj===Core.PJ().active) return {g:G,ns:IMGNS}; let g=null; try{ g=JSON.parse(appStorage.getItem(System.pjKey(r.pj))||'null'); }catch(e){} return g?{g,ns:r.pj==='main'?'':r.pj+'::'}:null; }

    // 새 게임 안의 id 참조(관계·톡·배너·진행·스토리 등)를 한꺼번에 바꿔요. 값과 객체 키 모두요
static remapIds(root,map){ if(!map.size) return; const seen=new Set(); const walk=o=>{ if(!o||typeof o!=='object'||seen.has(o)) return; seen.add(o);
      if(Array.isArray(o)){ for(let i=0;i<o.length;i++){ const v=o[i]; if(typeof v==='string'&&map.has(v)) o[i]=map.get(v); else walk(v); } return; }
      for(const k of Object.keys(o)){ let v=o[k]; if(typeof v==='string'&&map.has(v)) o[k]=v=map.get(v); else walk(v); if(map.has(k)&&!(map.get(k) in o)){ o[map.get(k)]=o[k]; delete o[k]; } } };
    walk(root); }

  static async artReuseCopy(R,id2){ if(!R) return 0; let n=0; for(const id of R.ids){ try{ let b=await Core.idbGet(R.ns+id); if(!b&&R.ns) b=await Core.idbGet(id); if(b){ await NewGame.idbPut(id2+'::'+id,b); n++; } }catch(e){} } return n; }

  static async newGame(rep,draft){return NewGameCtl.runNewGameBuild(rep,draft,NewGame.buildNewGameDraft);}

  static async newGameManual(rep,draft){return NewGameCtl.runNewGameBuild(rep,draft,NewGame.buildManualGameDraft);}

    /* 생성기 연계(새 게임·장·이벤트 생성) */
  // 생성된 대원의 소속 이름이 세계관 세력 이름과 조금 다르면(띄어쓰기·줄임) 그 세력 이름으로 — 없는 세력이면 그대로(factions()가 플레이어블로 추가)
static factionMatch(F,name){ const k=x=>String(x||'').replace(/\s+/g,''), n=k(name); if(!n) return name; const hit=(F||[]).find(f=>k(f.name)===n)||(F||[]).find(f=>n.length>=2&&(k(f.name).includes(n)||n.includes(k(f.name)))); return hit?hit.name:name; }

  static factionClean(list){ const S=(v,n)=>String(v||'').trim().slice(0,n||300); return (Array.isArray(list)?list:[]).slice(0,8).map(x=>({name:S(x&&x.name,30),kind:FKIND[x&&x.kind]?x.kind:'neutral',desc:S(x&&x.desc,400),goal:S(x&&x.goal),leader:S(x&&x.leader,80),base:S(x&&x.base,80),ideology:S(x&&x.ideology),secret:S(x&&x.secret),origin:S(x&&x.origin),nature:S(x&&x.nature),weakness:S(x&&x.weakness),
    rel:Object.fromEntries(Object.entries((x&&x.rel&&typeof x.rel==='object')?x.rel:{}).slice(0,8).map(([k,v])=>[S(k,30),S(v,60)])),stance:(Array.isArray(x&&x.stance)?x.stance:[]).filter(s=>s&&FSTANCE[s.s]).map(s=>({ch:Math.max(1,Math.round(+s.ch||1)),s:s.s,why:S(s.why,80)}))})).filter(f=>f.name); }

  static relRef(name){ let n=String(name||'').trim().replace(/^\{|\}$/g,'').replace(/\s*\(.*?플레이어.*?\)$/,''); if(!n) return '';
    const pn=String(P().player||'').trim(); if(n===System.T('player')||n==='플레이어'||n==='주인공'||n==='나'||(pn&&n===pn&&!G.chars.some(c=>c.name===n))) return REL_ME;
    const c=Characters.findSpeaker(n); if(c) return baseChar(c).id; const m=Characters.npcBy(n); if(m) return m.id;
    const loose=G.chars.find(c=>n.length>=2&&(c.name.startsWith(n)||n.startsWith(c.name)))||(G.npcs||[]).find(c=>n.length>=2&&(c.name.startsWith(n)||n.startsWith(c.name))); if(loose) return baseChar(loose).id;
    return 'x:'+n.slice(0,20); }

  static relApply(arr,src,quiet,lore){ let n=0; if(lore==='if') return 0; (Array.isArray(arr)?arr:[]).slice(0,40).forEach(x=>{ if(!x) return; let a=NewGame.relRef(x.a), b=NewGame.relRef(x.b); if(!a||!b||a===b) return; const m=Core.loreMap(a,b,lore); if(!m) return; [a,b]=m;
      let r=Core.relPair(a,b); const kind=String(x.kind||'').trim().slice(0,16), note=String(x.note||'').trim().slice(0,800), ev=String(x.event||'').trim().slice(0,400);
      if(!r){ r={id:'r'+uid(),a,b,kind:kind||'아는 사이',note,hist:[],src:String(src||'')}; World.relPut(r); } else { if(kind) r.kind=kind; if(note) r.note=note; if(kind||note) r.sys=false; } Core.relNames(r);
      if(ev) { r.hist=(r.hist||[]).concat([{src:String(src||''),text:ev,at:Date.now()}]).slice(-30); } r.at=Date.now(); n++; });
    if(n&&!quiet) Core.mark('meta'); return n; }

    // 인물 설정(프로필·과거)에 다른 인물의 이름이 나오면 그 문장을 관계로 기록해요
static relFromProfiles(quiet){ let n=0; const who=[...G.chars.filter(c=>!c.alt),...(G.npcs||[])];
    who.forEach(a=>{ const txt=String(a.profile||''); if(!txt) return; who.forEach(b=>{ if(a===b||String(b.name).length<2||!txt.includes(b.name)) return; const sen=(txt.split(/(?<=[.!?。])\s*/).find(x=>x.includes(b.name))||'').slice(0,160); n+=Core.relNew(baseChar(a).id||a.id,baseChar(b).id||b.id,'아는 사이',sen,'설정',true); }); });
    if(n&&!quiet) Core.mark('meta'); return n; }

  static ruleFacs(){ const n={}; G.chars.forEach(c=>{ if(c.faction&&!c.npc) n[c.faction]=(n[c.faction]||0)+1; }); return Object.keys(n).filter(f=>n[f]>=2); }

  static ruleArg(kind,seed){ const pick=a=>a.length?a[seed%a.length]:''; return kind==='elem'?pick(ELEMS):kind==='role'?pick(Object.keys(ROLE)):kind==='faction'?pick(NewGame.ruleFacs()):kind==='sec'?[60,75,90][seed%3]:kind==='pct'?[40,50,60][seed%3]:kind==='n'?3:''; }

  static ruleOk(cat,r){ const d=r&&cat[r.k]; if(!d) return false; if(!d.arg) return true; const a=r.a; return d.arg==='elem'?ELEMS.includes(a):d.arg==='role'?!!ROLE[a]:d.arg==='faction'?NewGame.ruleFacs().includes(a):+a>0; }


  static routeClean(x){ if(!x||typeof x!=='object') return null; const r={}; ['n1','fork','a','b','boss'].forEach(k=>{ const v=String(x[k]||'').trim(); if(v) r[k]=v.slice(0,k==='fork'?60:20); }); return Object.keys(r).length?r:null; }

  static illustrationScenePreparation(c,kind,custom){
   const project=Core.PJ().active,target=c[kind],snapshot=JSON.stringify([c.profile,c.naiPrompt,c.faction,target,G.world.summary]);
   const check=()=>{if(Core.PJ().active!==project||charById(c.id)!==c||JSON.stringify([c.profile,c.naiPrompt,c.faction,c[kind],G.world.summary])!==snapshot)throw new Error('캐릭터나 이미지 설정이 바뀌었어요. 창을 다시 열어 생성해 주세요.');};
   const prepare=async(cfg,progress,signal)=>{
    check();if(cfg.sceneReady)return;if(!SAMPLE)throw new Error('설정 → 글 AI를 먼저 등록해 주세요.');
    progress(kind==='lbcg'?'캐릭터·세계관을 바탕으로 최대 돌파 CG 장면 구성 중':'캐릭터·세계관을 바탕으로 일러스트 장면 구성 중');
    const purpose=Misc.illustrationScenePreparationPurposeText({kind});
    const response=await v2SkillRequest(SAMPLE,World.illustrationScenePreparationPrompt({c,purpose,cfg}),signal);
    check();if(typeof response?.tags!=='string'||!response.tags.trim())throw new Error('AI가 장면을 비워서 반환했어요. 다시 뽑기를 눌러 주세요.');
    cfg.sceneTags=response.tags.trim().slice(0,2000);
    cfg.prompt=PromptStudio.composeNai(kind,Core.joinTags(c.naiPrompt,Characters.designTags(c),cfg.sceneTags),{pose:custom.scenePose??'',frame:custom.sceneFrame||target.naiFrame,styleId:custom.sceneStyle||target.naiStyle||c.naiStyle}).input;
    cfg.sceneReady=true;
   };
   prepare.check=check;return prepare;
  }

  static async buildNewGameDraft(rep,draft,sourceProject){if(String(draft?.story||'').length>100000)throw Error('스토리는 최대 100,000자입니다. 초과 내용은 자르지 않았습니다.'); const RSRC=NewGame.reuseSrc(draft); // 원래 게임은 G를 새 게임으로 바꾸기 전에 잡아 둬요(지금 하던 게임을 리롤할 때)
    draft=draft||Core.drLoad(); const auto=draft.mode==='auto';
    const userTitle=String(draft.gtitle||'').trim().slice(0,30);
    const kw=(auto?String(draft.auto||''):String(draft.kw||'')).trim()||String(draft.world||'').slice(0,120).trim(); if(!kw){CoreView.toast('만들고 싶은 게임을 적어 주세요');return;}
    const tone=auto?'':String(draft.tone||'').trim(), th=auto?'auto':(draft.theme||'auto'), n=+draft.n||8, stat=m=>{if(rep)rep(m);};
    const ngSty=GameBuilder.style(draft,auto);
    const src=!auto&&draft.fan?String(draft.src||'').trim():'';
    const hero=Object.assign({name:'',call:'',gender:'',look:'',bio:'',hide:false},draft.hero||{}), gen=genderCode(hero.gender), heroBlank=!String(hero.gender||'').trim()&&!String(hero.look||'').trim();
    const SC=auto?{plot:'',stages:0,len:'normal'}:{plot:String(draft.story||''),stages:+draft.stages||0,len:STORY_LEN[draft.len]?draft.len:'normal'}, LS=STORY_LEN[SC.len][1], N1=SC.stages||4;
    const DT=auto?'':Core.drText(draft).slice(0,100000), DRA=NewGame.buildNewGameDraftDRAText({DT,draft,plot:SC.plot});
    const DALL=auto?[]:(draft.chars||[]).filter(c=>String(c.name||'').trim()), DCH=DALL.filter(c=>c.kind!=='npc'), DNPC=DALL.filter(c=>c.kind==='npc');
    const STY=NewGame.buildNewGameDraftSTYText({SC});
    const FAN=NewGame.buildNewGameDraftFANText({src});
    const DK=JSON.stringify({kw,tone,th,n,ngSty,src,SC,DT,ct:String(draft.crewTerm||''),cs:String(draft.castSex||'')}); let DR=null; try{ DR=JSON.parse(appStorage.getItem('ggm-ng-draft')||'null'); }catch(e){} if(!DR||DR.key!==DK) DR={key:DK,r:{}};
    const saveDR=()=>{ try{ appStorage.setItem('ggm-ng-draft',JSON.stringify(DR)); }catch(e){} };
    const ngStep=async(k,label,fn,ok)=>{ if(DR.r[k]&&ok(DR.r[k])){ stat(label+' (이전에 만든 것 이어 쓰기)'); return DR.r[k]; }
      for(let i=0;i<3;i++){ stat(label+(i?` · 다시 시도 ${i}/2${AI_QUIET_LAST?' — '+AI_QUIET_LAST:''}`:'')); AISTAGE='새 게임 '+label.replace(/…$/,''); AI_QUIET=i<2; let r; try{ r=await fn(); }finally{ AI_QUIET=false; } if(r&&ok(r)){ DR.r[k]=r; saveDR(); AISTAGE=''; return r; }
        if(r) Core.aiLog({ok:false,stage:AISTAGE,err:'응답은 왔지만 필요한 항목이 빠졌어요(길이 제한으로 잘렸거나 형식이 달라요). 받은 항목: '+Object.keys(r).join(', ').slice(0,200)}); await wait(1500); } AISTAGE=''; AI_QUIET_LAST=''; return null; };
    if(Object.keys(DR.r).length) CoreView.toast('지난번에 만들던 단계부터 이어서 만들어요');
    rep.lock(); const base=NewGame.buildNewGameDraftBaseText({draft});
    const a=await ngStep('a','1/4 세계관과 게임 정의를 만드는 중…',()=>Core.aiJSON(NewGame.buildNewGameDraftPrompt({base,FAN,STY,DRA,auto,heroBlank,hero,draft,DT,kw,tone,userTitle,th}),null,'complex'),r=>r&&r.title&&r.world&&String(r.world.plot||r.world.summary||'').trim()); /* 플롯·요약이 없으면 다시 묻기(빈 세계관에 원본 샘플이 남던 문제) */
    if(!a){rep.end();stat('세계관 생성에 실패했어요. 같은 내용으로 다시 누르면 이어서 만들어요.');return;}
    const ng=Core.defaults(); ng.lib=ng.lib.filter(l=>!['bg','prop','cg','map'].includes(l.kind)); ng.world=NewGame.blankWorld(); /* 원본 샘플 게임의 배경·소품·세계관은 새 게임에 남기지 않아요 — 남으면 생성 프롬프트의 "기존 목록"으로 들어가 다른 세계의 장소가 대본에 섞여요 */ if(heroBlank&&a.hero&&typeof a.hero==='object'){ hero.gender=String(a.hero.gender||'').slice(0,40); hero.look=String(a.hero.look||'').slice(0,400); } if(hero) GameBuilder.hero(ng.prog,hero);
    /* 새 게임 meta는 조립 창구가 씀(NewGame GameBuilder) — 장의 마지막 스테이지 형식(finale)은 장르에 따라 */
    GameBuilder.meta(ng,draft,hero,{title:userTitle||String(a.title||'새 게임'),sub:String(a.sub||''),theme:['tactical','fantasy','neon','pastel','noir'].includes(a.theme)?a.theme:'tactical',accent:/^#[0-9a-f]{6}$/i.test(a.accent||'')?a.accent:'#ffb400'},{sty:ngSty,tone,bible:DT,story:{plot:SC.plot,stages:SC.stages,len:SC.len,depth:draft.depth==='fast'?'fast':'deep',newc:draft.newc==null?2:+draft.newc,talkOnly:draft.talkOnly==null?1:+draft.talkOnly,finale:finaleOf(a.finale)},terms:{...(a.terms||{}),abyss:Story.explorationName(a.terms?.abyss)}});
    if(Array.isArray(a.elems)&&a.elems.length>=2){ const L=a.elems.slice(0,8).map((e,i)=>({d:String(e.d||'').slice(0,80),n:elemName(e.n||(DEFAULT_META.elems[i]||{}).n||'속성'+(i+1)),c:/^#[0-9a-f]{6}$/i.test(e.c||'')?e.c:(DEFAULT_META.elems[i]||{c:'#999999'}).c,beats:elemName(e.beats)})); if(new Set(L.map(e=>e.n)).size===L.length){ ng.meta.elems=L.map(({beats,...e})=>e); const N=L.map(e=>e.n), beats={}; L.forEach(e=>{ if(N.includes(e.beats)&&e.beats!==e.n) beats[e.n]=e.beats; }); ng.meta.rules=Object.assign(ng.meta.rules||{},Object.keys(beats).length?{beats}:{},{reactions:(Array.isArray(a.reactions)?a.reactions:[]).slice(0,6).map(x=>Object.assign({},x,{a:elemName(x&&x.a),b:elemName(x&&x.b)})).filter(x=>N.includes(x.a)&&N.includes(x.b)&&x.a!==x.b).map(NewGame.reactClean)}); } }
    if(a.roleDesc&&typeof a.roleDesc==='object'){ ng.meta.rules=Object.assign(ng.meta.rules||{},{roleDesc:Object.fromEntries(['atk','def','sup'].map(k=>[k,String(a.roleDesc[k]||'').slice(0,80)]))}); }
    { const L=NewGame.posClean(a.positions); if(NewGame.posValid(L)) ng.meta.positions=L; }
    ng.meta.roles=Object.assign(clone(DEFAULT_META.roles),a.roles||{});
    ng.world=Object.assign(NewGame.blankWorld(),a.world||{}); ng.world.factions=NewGame.factionClean(ng.world.factions); /* 세력 설계(0445) */ { const sd=[]; ng.world.summary=NewGame.dedupText(ng.world.summary,sd).text; ng.world.lore=NewGame.dedupText(ng.world.lore,sd).text; }
    Expedition.ngWorldExtras(ng,a);
    const oldG=G; G=ng; SystemView.applyMeta();
    const b=await ngStep('b',`2/4 ${System.T('crew')} ${n}명을 만드는 중…`,()=>Core.aiJSON(NewGame.buildNewGameDraftPrompt2({FAN,STY,DCH,DNPC,DRA,ng,n,N1,src}),null,'complex'),r=>r&&Array.isArray(r.chars)&&r.chars.length>=Math.max(1,Math.ceil(n*0.8))&&new Set(r.chars.map(c=>String(c&&c.name||'').trim())).size===r.chars.length); /* 요청 인원의 80% 이상·이름 중복 없음이어야 통과(아니면 다시 묻기) */
    if(!b){G=oldG;SystemView.applyMeta();rep.end();stat('캐릭터 생성에 실패했어요. 같은 내용으로 다시 누르면 1단계는 건너뛰고 이어서 만들어요.');return;}
    ng.chars=[]; b.chars.slice(0,Math.max(12,DCH.length)).forEach(x=>{ if(Art.isMonsterLike(x)) return; const c=Characters.cleanChar(x); c.faction=NewGame.factionMatch(ng.world.factions,c.faction); /* 넣기 전에 세력 이름 맞춤 — 반복 중 factions()가 넣은 대원의 소속을 세력으로 추가하므로 늦으면 비슷한 이름이 따로 생김 */ if(!c.name||DNPC.some(d=>d.name===c.name))return; c.ord=ng.chars.length; const db=String(x.debut||'start').trim(); if(db==='later') c.debutLater=true; else if(+db>=1) c.__deb=Math.min(N1,Math.round(+db)); ng.chars.push(c);});
    { const st=ng.chars.filter(c=>!c.__deb&&!c.debutLater); ng.chars.filter(c=>c.__deb||c.debutLater).slice(0,Math.max(0,3-st.length)).forEach(c=>{ delete c.__deb; delete c.debutLater; }); } // 등장 계획: 처음부터 동료 3명 이상, 소속 세력은 목록에
    // 초안에 적은 대원은 반드시 대원으로: 이름이 바뀌었으면 되돌리고, 빠졌으면 따로 만들어 넣어요
    { const findD=d=>ng.chars.find(c=>c.name===d.name)||ng.chars.find(c=>c.name.includes(d.name)||d.name.includes(c.name));
      let miss=DCH.filter(d=>!findD(d));
      if(miss.length){ stat(`2/4 초안의 ${System.T('crew')} ${miss.length}명을 마저 만드는 중…`); for(let k=0;k<2&&miss.length;k++){ const r2=await Core.aiJSON(NewGame.buildNewGameDraftPrompt3({ng,miss}),null,'complex');
          (r2&&Array.isArray(r2.chars)?r2.chars:[]).forEach(x=>{ const c=Characters.cleanChar(x); if(!c.name) return; const d=miss.find(m=>m.name===c.name||c.name.includes(m.name)); if(d) c.name=d.name; c.ord=ng.chars.length; ng.chars.push(c); }); miss=DCH.filter(d=>!findD(d)); } }
      DCH.forEach(d=>{ const c=findD(d); if(!c) return; c.name=d.name; if(d.rank) c.rarity=+d.rank; const tg=String(d.tags||'').trim(); if(tg) c.naiPrompt=Core.stripAge(tg); }); }
    NewGame.ngCharsPost(ng,DCH);
    if(SAMPLE&&ng.chars.some(c=>c.weapon&&Characters.wpBad(c.weapon.prompt))){ stat(`2/4 ${System.T('weapon')} 그림 프롬프트를 정리하는 중…`); await Characters.fixWeaponPrompts(ng.chars,ng.world); }
    // NPC: 대원은 아니지만 스토리에 나오고 그림(전신·상반신)을 가져요. 나중에 대원으로 쓸 수도 있어요
    ng.npcs=[]; if(DNPC.length){ stat('2/4 NPC 모습을 정하는 중…'); const r3=await Core.aiJSON(NewGame.buildNewGameDraftPrompt4({ng,DNPC}),null,'default');
      DNPC.forEach(d=>{ const x=(r3&&Array.isArray(r3.npcs)?r3.npcs:[]).find(y=>y&&y.name===d.name)||{}; const id='npc_'+uid(); ng.npcs.push({id,npc:true,name:d.name,role:d.role||'',profile:d.profile||'',speech:d.speech||'',look:d.look||'',naiPrompt:String(d.tags||'').trim()?Core.stripAge(String(d.tags).trim()):String(x.naiPrompt||''),img:null,faces:[],skins:[],lines:[],touch:{head:[],body:[]},affLines:{},upper:{id:'up_'+id,kind:'upper',name:d.name+' 상반신',prompt:'',img:null}}); }); }
  
    ng.world.source=src;
    // 그림 유지 리롤이면 원래 게임의 그림 있는 배경·소품을 먼저 넣어 두고 AI가 그 이름을 우선 쓰게 해요
    const RS0=RSRC, KEEP=RS0?(RS0.g.lib||[]).filter(l=>['bg','prop'].includes(l.kind)&&l.img).map(l=>JSON.parse(JSON.stringify(l))):[];
    if(KEEP.length) ng.lib=[...KEEP,...ng.lib.filter(l=>!['bg','prop'].includes(l.kind))];
    const KEEPHINT=NewGame.buildNewGameDraftKEEPHINTText({KEEP});
    const CX0=`${RULES}${FAN}\n${World.ctx().replace(/메인 스토리 진행:.*\n/,'')}${KEEPHINT}`;
    const c3a=await ngStep('c3a','3/4 오프닝, 배경·소품·음악 목록, 배너를 만드는 중…',()=>Core.aiJSON(NewGame.buildNewGameDraftPrompt5({CX0,LS,ng}),null,'complex'),r=>r&&r.opening&&Array.isArray(r.backgrounds));
    if(!c3a){G=oldG;SystemView.applyMeta();rep.end();stat('오프닝 생성에 실패했어요. 같은 내용으로 다시 누르면 앞 단계는 건너뛰고 이어서 만들어요.');return;}
    const bgNames=[...new Set([...(c3a.backgrounds||[]).map(x=>x&&x.name).filter(Boolean),...KEEP.filter(l=>l.kind==='bg').map(l=>l.name)])], prNames=[...new Set([...(c3a.props||[]).map(x=>x&&x.name).filter(Boolean),...KEEP.filter(l=>l.kind==='prop').map(l=>l.name)])];
    const c3b=await ngStep('c3b','4/4 1장 스토리와 메신저를 만드는 중…',()=>Core.aiJSON(NewGame.buildNewGameDraftPrompt6({CX0,bgNames,prNames,N1,LS,ng}),null,'complex'),r=>r&&r.chapter&&Array.isArray(r.chapter.stages)&&r.chapter.stages.length);
    const c3=c3b?Object.assign({},c3a,c3b):null;
    if(!c3||!c3.chapter){G=oldG;SystemView.applyMeta();rep.end();stat('1장 스토리 생성에 실패했어요. 같은 내용으로 다시 누르면 앞 단계(세계관·캐릭터·오프닝)는 건너뛰고 1장만 다시 만들어요. 그림은 아직 그리지 않았어요.');return;}
    ng.opening={lines:strs(c3.opening&&c3.opening.lines),prologue:nl(c3.opening&&c3.opening.prologue)};
    const ch=c3.chapter; ng.chapters=[{id:'c1',ord:0,kind:'main',title:String(ch.title||'1장'),logline:String(ch.logline||'').slice(0,120),stages:(ch.stages||[]).slice(0,12).map((s2,i)=>({id:'s1'+(i+1),title:String(s2.title||'작전'),reward:300+100*i,pre:nl(s2.pre),post:nl(s2.post),
      enemies:(Array.isArray(s2.enemies)?s2.enemies:[]).slice(0,5).map(e2=>({name:String(e2.name||'적'),elem:ELEMS.includes(e2.elem)?e2.elem:ELEMS[0],hp:num(e2.hp,100,99999,900),atk:num(e2.atk,10,999,80),def:num(e2.def,0,500,35),spd:num(e2.spd,50,160,95),boss:!!e2.boss}))}))}];
    ng.__looks=NewGame.lookMap((c3.chapter||{}).stages);
    ng.chars.forEach(c=>{ if(c.__deb){ const s2=ng.chapters[0].stages[c.__deb-1]; if(s2) c.debut=s2.id; delete c.__deb; } }); // 등장 계획 → 첫 등장 스테이지(0445)
    Story.shapeFirstStages(ng.chapters[0].stages,ch.stages); /* 1장 스테이지 다듬기는 장 data 창구(Story) */
    ng.chapters[0].summary=String(c3.summary||'').slice(0,6000); ng.rels=[]; try{ NewGame.relApply(c3.relations,'프롤로그·1장',true); NewGame.relFromProfiles(true); Story.relFromScripts(ng.chapters[0],'1장',true); ng.meta.relProf=1; }catch(e){}
    const L=(kind,arr)=>(Array.isArray(arr)?arr:[]).filter(x=>x&&x.name).map(x=>({id:'l'+uid(),kind,name:String(x.name),prompt:String(x.prompt||''),img:null}));
    { const fresh=[...L('bg',c3.backgrounds),...L('prop',c3.props)].filter(l=>!KEEP.some(k=>k.kind===l.kind&&k.name===l.name)); ng.lib=[...KEEP,...fresh,...L('bgm',c3.music),...clone(DEFAULT_SFX)]; } Story.syncEnemies(ng,ng.__looks); delete ng.__looks; World.bestiaryApply(c3.bestiary,ng); { const sts=ng.chapters[0].stages; sts.forEach((s2,i)=>{ if(!s2.story) Story.stageAutoRules(s2,i,sts.length); }); } /* 적 도감·전장 규칙(0445·0485) */
    const mus=ng.lib.filter(l=>l.kind==='bgm').map(l=>l.name), pickM=(re,i)=>mus.find(m=>re.test(m))||mus[i]||'';
    const bn=c3.banners||{}, ssr=ng.chars.filter(c=>c.rarity===3), pu=ng.chars.find(c=>c.name===(bn.pickup&&bn.pickup.char)&&!c.debut&&!c.debutLater)||ssr.find(c=>!c.debut&&!c.debutLater)||ssr[0], fac=(()=>{ const hasSSR=f=>ng.chars.some(c=>c.faction===f&&c.rarity===3), want=(bn.faction&&bn.faction.faction)||''; return hasSSR(want)?want:((ng.chars.find(c=>c.rarity===3&&c.faction)||ng.chars[0]||{}).faction||''); })();
    ng.banners=[{id:'std',name:String(bn.std||'상시 '+System.T('gacha')),type:'std',desc:'',pool:{mode:'all',factions:[],ids:[]},pickup:[],rate:50,active:true,bg:''}];
    if(pu) ng.banners.push({id:'b_pu',name:String((bn.pickup&&bn.pickup.name)||pu.name+' 확률 업'),type:'pickup',desc:`SSR ${pu.name} 확률 상승`,pool:{mode:'all',factions:[],ids:[]},pickup:[pu.id],rate:50,active:true,bg:''});
    if(fac) ng.banners.push({id:'b_fac',name:String((bn.faction&&bn.faction.name)||fac+' 모집'),type:'pool',desc:`${fac} 소속만 등장`,pool:{mode:'faction',factions:[fac],ids:[]},pickup:[],rate:50,active:true,bg:''});
    const say1=NewGame.storySayNorms(ng.chapters[0]); ng.threads=(Array.isArray(c3.threads)?c3.threads:[]).map(x=>{const c=ng.chars.find(q=>q.name===String(x.char||'').trim());if(!c||!x.script||NewGame.threadDup(nl(x.script),say1))return null;const st=ng.chapters[0].stages[Math.min(ng.chapters[0].stages.length,Math.max(1,+x.afterStage||1))-1];return {id:uid(),charId:c.id,title:String(x.title||'메시지'),trigger:x.trigger==='start'?{type:'start'}:{type:'clear',value:st.id},needOwn:x.trigger==='start',script:nl(x.script)};}).filter(Boolean);
    ng.events=[]; { ng.prog=clone(DEFAULT_PROG); ng.prog.gender=gen; if(hero) GameBuilder.hero(ng.prog,hero); /* 주인공 칸은 조립 창구가 다시 씀(위에서 고친 hero 그대로) */ }
    const bgs=ng.lib.filter(l=>l.kind==='bg').map(l=>l.name);
    ng.prog.lobbyBg=bgs[0]||''; ng.prog.titleBg=bgs[bgs.length-1]||'';
    const snd=Core.SND(); snd.scene={title:pickM(/타이틀|title/i,0),lobby:pickM(/로비|lobby/i,1),battle:pickM(/전투|battle/i,4),boss:pickM(/보스|boss/i,5),gacha:pickM(/뽑기|소환|계약|gacha|summon/i,6)};
    ng.prog.scene=clone(snd.scene); ng.ver=VER; const id2='g'+uid(); const RU=Characters.artReuse(ng,RSRC); if(RU){ stat(`원래 게임의 그림을 옮기는 중… (${System.T('crew')} ${RU.nc}명 · NPC ${RU.nn}명 · 배경 등 ${RU.nl}개)`); await NewGame.artReuseCopy(RU,id2); ng.prog.castDone=RU.nc>=ng.chars.filter(c=>c.naiPrompt).length; }
    { let b=null, tags=hero.av||''; try{ if(hero.av) b=await Core.idbGet('draft_avatar'); if(!b&&!(RU&&ng.prog.avatar)&&String(hero.look||'').trim()&&Core.imgReady()){ stat('주인공 프로필 그림을 그리는 중…'); tags=await NewGame.heroTags(hero); if(tags) b=await NewGame.naiDraw('char',tags,{frame:'cowboy shot',pose:'looking at viewer'}); }
        if(b){ const av={id:'pav_'+uid(),kind:'char',name:'플레이어',prompt:tags,img:{idb:true}}; await NewGame.idbPut(id2+'::'+av.id,b); ng.prog.avatar=av; } }catch(e){ CoreView.toast('프로필 그림은 나중에 설정 → 플레이어에서 그려 주세요'); } }
    if(RU&&RU.ids.some(x=>ng.prog.avatar&&x===ng.prog.avatar.id)){ /* 원래 프로필 그림을 그대로 썼어요 */ }
    G=oldG;
    if(sourceProject&&Core.PJ().active!==sourceProject)throw Error('게임이 바뀌어 새 게임 적용을 중단했습니다');await Core.flush();
    await GameBuilder.save(ng,draft,id2);
    try{ appStorage.removeItem('ggm-ng-draft'); }catch(e){}
    stat('완성! 새 게임으로 전환해요.'); setTimeout(()=>SystemView.reloadGame(),900);
  }

    // 글 AI 없이 초안만으로 게임을 만들어요. 비어 있는 곳은 기본값으로 두고, 나중에 글 AI를 등록하면 편집 도구로 다듬어요
static async buildManualGameDraft(rep,draft,sourceProject){if(String(draft?.story||'').length>100000)throw Error('스토리는 최대 100,000자입니다. 초과 내용은 자르지 않았습니다.'); const RSRC=NewGame.reuseSrc(draft);
    draft=draft||Core.drLoad(); const stat=m=>{if(rep)rep(m);};
    const DALL=(draft.chars||[]).filter(c=>String(c.name||'').trim()), DCH=DALL.filter(c=>c.kind!=='npc'), DNPC=DALL.filter(c=>c.kind==='npc');
    if(!DCH.length){ CoreView.toast(`인물 탭에 ${draft.crewTerm||'동료'}을 1명 이상 적어 주세요`); return; }
    const ng=Core.defaults(), hero=Object.assign({name:'',call:'',gender:'',look:'',bio:'',hide:false},draft.hero||{}), th=draft.theme||'auto';
    const kw=String(draft.kw||'').trim(), title=String(draft.gtitle||'').trim().slice(0,30)||kw.split(/[.\n,]/)[0].slice(0,16)||'새 게임';
    const ngSty=GameBuilder.style(draft,false);
    const DT=Core.drText(draft); /* 새 게임 meta는 조립 창구가 씀(NewGame GameBuilder) */
    GameBuilder.meta(ng,draft,hero,{title,sub:'',theme:th==='auto'?'tactical':th,accent:'#ffb400'},{sty:ngSty,tone:String(draft.tone||''),bible:DT?DT.slice(0,100000):'',story:{plot:String(draft.story||''),stages:+draft.stages||0,len:STORY_LEN[draft.len]?draft.len:'normal'},shop:NewGame.neutralShop()}); ng.meta.manual=true;
    const world=String(draft.world||'').trim(), sents=s=>String(s||'').split(/(?<=[.!?。])\s+|\n+/).map(x=>x.trim()).filter(Boolean);
    ng.world=Object.assign(NewGame.blankWorld(),{name:title,summary:sents(world).slice(0,3).join(' ')||kw||title,lore:world||kw,plot:String(draft.story||'').trim(),factions:[],source:draft.fan?String(draft.src||''):''});
    String(draft.setting||'').split('\n').map(x=>x.trim()).filter(x=>/^[-•*]?\s*[^:：]{1,20}[:：]/.test(x)).slice(0,6).forEach(x=>{ const m=x.replace(/^[-•*]\s*/,'').match(/^([^:：]{1,20})[:：]\s*(.*)$/); if(m) ng.world.factions.push({name:m[1].trim(),desc:m[2].trim()}); });
    ng.dispatches=clone(DEFAULT_DISP);
    const oldG=G; G=ng; SystemView.applyMeta();
    try{
      ng.chars=[]; ng.lib=clone(DEFAULT_SFX); const roles=['atk','def','sup'];
      DCH.forEach((d,i)=>{ const r=+d.rank||(i<1?3:i<3?2:1); const c=Characters.cleanChar({name:d.name,rarity:r,role:roles[i%3],elem:ELEMS[i%ELEMS.length],faction:'',hp:900+r*150,atk:95+r*15,def:40+r*8,spd:95+(i%3)*5,
        profile:[d.role,d.profile,d.speech?'말투: '+d.speech:'',d.look?'외모: '+d.look:''].filter(x=>String(x||'').trim()).join('\n'),intro:String(d.role||''),
        skill:{name:{atk:'강타',def:'수호',sup:'응원'}[roles[i%3]],kind:{atk:'dmg',def:'shield',sup:'heal'}[roles[i%3]],power:1.6,cd:3,desc:''},naiPrompt:String(d.tags||'').trim()?Core.stripAge(String(d.tags).trim()):''});
        c.ord=ng.chars.length; ng.chars.push(c); });
      ng.npcs=DNPC.map(d=>{ const id='npc_'+uid(); return {id,npc:true,name:d.name,role:d.role||'',profile:d.profile||'',speech:d.speech||'',look:d.look||'',naiPrompt:String(d.tags||'').trim()?Core.stripAge(String(d.tags).trim()):'',img:null,faces:[],skins:[],lines:[],touch:{head:[],body:[]},affLines:{},upper:{id:'up_'+id,kind:'upper',name:d.name+' 상반신',prompt:'',img:null}}; });
      // 스토리 개요를 스테이지마다 나눠 내레이션으로 넣어요. 대사는 나중에 직접 쓰거나 글 AI로 채워요
      const N=Math.max(1,Math.min(12,+draft.stages||4)), st=sents(draft.story), per=Math.ceil(st.length/N)||0, en=(i,boss)=>[{name:boss?'보스':'적',elem:ELEMS[i%ELEMS.length],hp:boss?3600:800+i*100,atk:70+i*5,def:30+i*4,spd:95,boss}];
      ng.chapters=[{id:'c1',ord:0,kind:'main',title:'1장',logline:sents(draft.story)[0]?sents(draft.story)[0].slice(0,120):'',stages:Array.from({length:N},(_,i)=>({id:'s1'+(i+1),title:`${i+1}화`,reward:300+100*i,pre:st.slice(i*per,(i+1)*per).join('\n'),post:'',enemies:en(i,i===N-1)}))}];
      ng.opening={lines:[...sents(world).slice(0,4),title],prologue:''};
      ng.banners=[{id:'std',name:'상시 '+System.T('gacha'),type:'std',desc:'',pool:{mode:'all',factions:[],ids:[]},pickup:[],rate:50,active:true,bg:''}];
      ng.threads=[]; ng.events=[]; Story.syncEnemies(ng);
      ng.prog=clone(DEFAULT_PROG); GameBuilder.hero(ng.prog,hero);
      ng.ver=VER;
    } finally { G=oldG; SystemView.applyMeta(); }
    const id2='g'+uid(); if(RSRC){ (RSRC.g.lib||[]).filter(l=>['bg','prop'].includes(l.kind)&&l.img&&!ng.lib.some(x=>x.kind===l.kind&&nameEq(x.name,l.name))).forEach(l=>ng.lib.push(clone(l))); if(!ng.prog.lobbyBg){ const b0=ng.lib.find(l=>l.kind==='bg'); if(b0) ng.prog.lobbyBg=b0.name; } } const RU=Characters.artReuse(ng,RSRC); if(RU){ await NewGame.artReuseCopy(RU,id2); ng.prog.castDone=true; }
    try{ if(hero.av){ const b=await Core.idbGet('draft_avatar'); if(b){ const av={id:'pav_'+uid(),kind:'char',name:'플레이어',prompt:hero.av,img:{idb:true}}; await NewGame.idbPut(id2+'::'+av.id,b); ng.prog.avatar=av; } } }catch(e){}
    if(sourceProject&&Core.PJ().active!==sourceProject)throw Error('게임이 바뀌어 새 게임 적용을 중단했습니다');await Core.flush();
    await GameBuilder.save(ng,draft,id2);
    stat('완성! 새 게임으로 전환해요. 글 AI를 등록하면 편집 화면의 ✦ 버튼으로 대사·스킬·설정을 다듬을 수 있어요.'); setTimeout(()=>SystemView.reloadGame(),1200);
  }
}

class NewGameCtl {
    /* 갠톡 사진 고르기(Controller): 줄여 저장(Model) → 보낼 사진 표시(View) */
static async chatPhotoPick(f){ if(!f||!PH||!PH.fc) return; try{ PH.pendImg=await NewGame.chatImgStore(await Core.shrink(f,1280)); CoreView.phPendRender(); NewGameView.fcInputPhotoHint(); }catch(e){ CoreView.toast('사진을 불러오지 못했어요'); } }

    /* 캐릭터가 사진을 보냄(Controller): 입력 중 표시 → 그림(서비스)·저장(Model) → 말풍선 */
static async fcNpcPhoto(c,f,tags,alive){
    const off=alive()?NewGameView.phTyping(c):()=>{};
    try{ const k=await NewGame.chatImgStore(await NewGame.naiDraw('illust',Core.joinTags(c.naiPrompt,tags),{styleId:c.naiStyle,frame:'cowboy shot',pose:''}));
      const m={w:'p',t:'',img:k,at:Date.now()}; off(); NewGame.fcLogAdd(f,m,!alive()); if(alive()) CoreView.phBubble(m,c);
    }catch(e){ Core.quietErr(e,'0100-messenger.js:175'); }finally{ off(); } }

  static async drAvatarDraw(rep){ CoreView.drRead(); const hr=DR2.hero; if(!String(hr.look||'').trim()){ CoreView.toast('외모를 먼저 적어 주세요'); return; } if(!Core.imgReady()){ CoreView.toast(Core.imgNeed()); return; }
    if(rep) rep('그리는 중…');
    try{ const tags=await NewGame.heroTags(hr); if(!tags){ CoreView.toast('태그를 만들지 못했어요. 다시 눌러 주세요'); return; } const b=await NewGame.naiDraw('char',tags,{candidateEligible:true,originalSrc:DRAVU||'',frame:'cowboy shot',pose:'looking at viewer'}); await NewGame.idbPut('draft_avatar',b); if(DRAVU) URL.revokeObjectURL(DRAVU); DRAVU=URL.createObjectURL(b); CoreView.drRead(); DR2.hero.av=tags; Core.drSave(); CoreView.drRerender(); CoreView.toast('프로필 그림을 만들었어요'); }
    catch(e){ CoreView.toast(Core.naiErr(e)); } finally{ if(rep) rep.end(); } }

  static async runNewGameBuild(rep,draft,builder){
   if(NEW_GAME_SOURCE){CoreView.toast('이미 게임을 만드는 중입니다');return;}
   if(BGJOBS.length||PREPJOB||LIVE_RUN||PCJOB||SYJOB||BACKUP_BUSY){CoreView.toast('진행 중인 이야기·그림 생성이 끝난 뒤 새 게임을 만들어 주세요');return;}
   const source=G,project=Core.PJ().active;NEW_GAME_SOURCE=source;
   try{await Core.flush();return await builder(rep,draft,project);}
   finally{G=source;NEW_GAME_SOURCE=null;SystemView.applyMeta();if(rep)rep.end();}
  }
}

class NewGameView {
  static phTyping(c){ const ty=document.createElement('div'); ty.className='msg'; ty.innerHTML=`<div class="av sm">${CoreView.art(c)}</div><div class="bub typing"><i></i><i></i><i></i></div>`; const ch=$('#phChat'); if(ch){ ch.appendChild(ty); CoreView.phScroll(); } return ()=>ty.remove(); }

  static fcInputPhotoHint(on=true){ const i=$('#fcIn'); if(!i) return; i.placeholder=on?'사진과 함께 보낼 말 (비워도 돼요)':'메시지 보내기'; if(on) i.focus({preventScroll:true}); }
}

/* ===== NewGame의 AI 생성 흐름(Generator 하위 — docs/redesign.md 3절) ===== */
/* 주인공 외모 태그(눈 가림이면 앞머리 태그) */
class HeroTagsGen extends Generator {
  static tier = 'quick';
  static fail = '';
  static prompt({hr}){ return NewGame.heroTagsPrompt({hr}); }
  static parse(r){ const tags=String(r.tags||'').trim(); return tags||null; }
  static apply(tags,{hr}){ if(hr.hide) tags=Core.joinTags(Core.tagList(tags).filter(t=>!EYE_TAG.test(Core.tagKey(t))).join(', '),'hair over eyes, bangs covering eyes, long bangs'); return tags; }
}
/* 새 게임 초안(DR2) 다듬기 무리: 답을 받으면 초안을 다시 읽고(drRead) → 되돌리기 지점(snap) → 고침(edit — 알림 글을 돌려줌) → 겹치는 문장 정리 → 저장·다시 그림·알림 */
class DraftGen extends Generator {
  static fail = undefined;
  static dedupNote = false; // 알림에 겹침 정리 수를 붙이나
  static parse(r){ return typeof r==='object'?r:null; }
  static snap(v,ctx){ return ''; }
  static edit(v,ctx){ return ''; }
  static apply(v,ctx){ CoreView.drRead(); Core.drSnap(this.snap(v,ctx)); const said=this.edit(v,ctx), dn=Characters.drDedup(ctx.d); Core.drSave(); CoreView.drRerender();
    CoreView.toast(said+(this.dedupNote&&dn?` (겹치는 문장 ${dn}개 정리)`:'')+'. 마음에 안 들면 「되돌리기」'); }
}
/* 항목 하나(세계관·설정·스토리 …)를 다른 항목에 맞춰 다듬기 */
class DraftPolishGen extends DraftGen {
  static dedupNote = true;
  static context(o){ return {...o,cur:String(DR2[o.k]||'').trim(),what:Misc.drPolishWhatText({k:o.k})}; }
  static ready({cur}){ if(cur) return true; CoreView.toast('먼저 내용을 조금 적어 주세요'); return false; }
  static prompt({what,k,cur}){ return Characters.drPolishPrompt({what,k,cur}); }
  static parse(r){ return r.text?r:null; }
  static snap(r,{what}){ return what; }
  static edit(r,{k}){ DR2[k]=String(r.text); return '다른 항목에 맞춰 다듬었어요'; }
}
/* 주인공 다듬기 */
class DraftHeroGen extends DraftGen {
  static context(o){ return {...o,h:DR2.hero}; }
  static prompt({h}){ return Characters.drPolishHeroPrompt({h}); }
  static snap(){ return '주인공'; }
  static edit(r){ const S=v=>typeof v==='string'?v.trim():''; const H=DR2.hero;
    if(S(r.call)) H.call=S(r.call).slice(0,12); if(S(r.name)&&!String(H.name||'').trim()) H.name=S(r.name).slice(0,12); if(S(r.look)) H.look=S(r.look).slice(0,400); if(S(r.bio)) H.bio=S(r.bio).slice(0,1500);
    return '주인공을 다듬었어요'; }
}
/* 전체 맞추기: 세계관·설정·스토리·인물·주인공을 한꺼번에 보고 어긋난 곳을 고침 */
class DraftHarmonyGen extends DraftGen {
  static tier = 'complex';
  static dedupNote = true;
  static context(o){ CoreView.drRead(); return {...o,d:DR2}; }
  static ready({d}){ if(Core.drText(d).trim()) return true; CoreView.toast('먼저 세계관이나 인물을 조금 적어 주세요'); return false; }
  static prompt({d}){ return Characters.drHarmonyPrompt({d}); }
  static snap(){ return '전체 맞추기'; }
  static edit(r,{d}){
    const S=v=>typeof v==='string'?v.trim():'';
    ['world','setting','story'].forEach(k=>{ if(String(d[k]||'').trim()&&S(r[k])) d[k]=S(r[k]); });
    if(String(d.kw||'').trim()&&S(r.kw)) d.kw=S(r.kw).slice(0,400); if(String(d.tone||'').trim()&&S(r.tone)) d.tone=S(r.tone).slice(0,200);
    const rc=Array.isArray(r.chars)?r.chars:[]; d.chars.forEach((c,i)=>{ const o=rc[i]||rc.find(x=>x&&x.name&&x.name===c.name); if(!o) return; ['role','profile','speech','look'].forEach(k=>{ if(S(o[k])) c[k]=S(o[k]); }); if(!String(c.name||'').trim()&&S(o.name)) c.name=S(o.name); });
    if(String(d.hero.bio||'').trim()&&S(r.heroBio)) d.hero.bio=S(r.heroBio);
    return '서로 맞춰 다듬었어요'; }
}
/* 인물 하나 다듬기 */
class DraftCharGen extends DraftGen {
  static context(o){ return {...o,c:DR2.chars[o.i]}; }
  static ready({c}){ return !!c; }
  static prompt({i,c}){ return Characters.drFillCharPrompt({i,c}); }
  static parse(r){ let o=Array.isArray(r)?r[0]:r; if(o&&!o.profile&&!o.role){ const v=Object.values(o).find(x=>x&&typeof x==='object'&&!Array.isArray(x)); if(v) o=v; } if(!o||typeof o!=='object'){ CoreView.toast('AI 응답을 읽지 못했어요. 다시 눌러 주세요'); return null; } return o; }
  static snap(o,{i,c}){ return ((DR2.chars[i]||c).name||'인물')+' 다듬기'; }
  static edit(o,{i,c}){ const c2=DR2.chars[i]||c; const S=v=>Array.isArray(v)?v.join(' ').trim():typeof v==='string'?v.trim():'';
    const RK=/\s*[\[(【]\s*(SSR|SR|R)\s*[\])】]\s*/gi; let rk=''; ['role','profile','speech','look'].forEach(k=>{ let v=S(o[k]); if(!v) return; v=v.replace(RK,(m,g)=>{ rk=rk||g.toUpperCase(); return ' '; }).replace(/\s{2,}/g,' ').trim(); if(v) c2[k]=v; }); if(rk&&!c2.rank&&c2.kind!=='npc') c2.rank=({SSR:3,SR:2,R:1})[rk]; if(!String(c2.name||'').trim()&&S(o.name)) c2.name=S(o.name).replace(RK,' ').trim();
    return `${c2.name||'인물'}을(를) 다듬었어요`; }
}

/* ===== 새 게임 조립(NewGame의 data 창구 — docs/redesign.md 3절 GameBuilder) =====
   직접 만들기(NewGame.buildManualGameDraft)·AI로 만들기(NewGame.buildNewGameDraft)가 같이 씀: 새 게임 ng의 meta(제목·테마·그림 태그·톤·성별 구성·세계 성경·스토리·용어·초안)·
   주인공(prog)·끝맺음(목록에 넣고 data에 씀)을 한곳에서 — 만드는 길마다 따로 쓰지 않음(규칙 D3 · 사용자 지시: 생성·수정·제거를 한 창구에서). 두 길은 다른 점(제목·테마·스토리 칸·AI 용어)만 넘김 */
class GameBuilder {
  /* 그림 태그: 초안의 화풍 글, 없으면 고른 프리셋의 품질 태그(auto면 화풍 글을 안 씀) */
  static style(draft,auto){ return String((auto?'':draft.style)||'').trim()||(NewGame.presetQualityParts(Core.allPresets().find(x=>x.id===draft.preset)||{}).tags); }
  /* meta: head(title·sub·theme·accent) 위에 그림 태그(프리셋 태그 그대로면 그 제외 태그도)·톤·성별 구성·세계 성경·스토리·상점·용어(o.terms 위에 초안의 동료 호칭·주인공 호칭이 이김)·초안 */
  static meta(ng,draft,hero,head,o){ ng.meta=Object.assign(clone(DEFAULT_META),head);
    ng.meta.artTags=o.sty; { const sp=Core.allPresets().find(x=>x.id===draft.preset); if(sp&&o.sty===NewGame.presetQualityParts(sp).tags) ng.meta.artNeg=sp.neg; } ng.meta.tone=o.tone; ng.meta.castSex=CAST_SEX[draft.castSex]?draft.castSex:''; if(o.bible) ng.meta.bible=o.bible; ng.meta.story=o.story; if(o.shop) ng.meta.shop=o.shop;
    ng.meta.terms=Object.assign(clone(DEFAULT_META.terms),o.terms||{}); if(String(draft.crewTerm||'').trim()) ng.meta.terms.crew=String(draft.crewTerm).trim().slice(0,8); if(String(hero.call||'').trim()) ng.meta.terms.player=String(hero.call).trim().slice(0,12); try{ ng.meta.draft=Story.drClean(draft); }catch(e){} }
  /* 주인공(플레이어) 칸 */
  static hero(prog,hero){ prog.player=String(hero.name||'').slice(0,12); prog.genderTxt=String(hero.gender||''); prog.gender=genderCode(hero.gender); prog.look=String(hero.look||''); prog.bio=String(hero.bio||''); prog.hideEyes=!!hero.hide; prog.nameAsked=true; }
  /* 끝맺음: 마무리(LiveOps.ngFinish) → 게임 목록에 넣고 → data에 씀 */
  static async save(ng,draft,id2){ LiveOps.ngFinish(ng,draft); const pj=Core.PJ();pj.list.push({id:id2,title:ng.meta.title});pj.active=id2; await appStorage.commitRecords({[System.pjKey(id2)]:JSON.stringify(ng),[PJKEY]:JSON.stringify(pj)}); }
}
