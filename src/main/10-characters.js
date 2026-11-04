/* ===== characters — 기능 class(Model · View · Ctl) — docs/redesign.md 2·3절, tools/reshape.mjs가 매핑대로 옮김 ===== */
class Characters {
    // 만든 표정을 쓰는 곳: 터치 반응, 스토리 대사(표정 지정이 없을 때 대사로 짐작)
  // 스킨을 입었고 스킨 스탠딩이 있으면 그 스킨의 표정만 써요(없으면 표정 없이 스킨 모습 그대로)
static skinFaces(c){ const k=Characters.skinOf(c); return ((k&&(Characters.imgSrc(k)||(c.useStanding===false&&k.upper&&Characters.imgSrc(k.upper))))?k.faces:c.faces)||[]; }

  static facePool(c){ return Characters.skinFaces(c).filter(f=>Characters.imgSrc(f)||(f.up&&Characters.imgSrc(f.up))); }

  static pickFace(c,names){ const fs=Characters.facePool(c), hit=names.map(n=>fs.find(f=>f.name===n)).filter(Boolean); return hit.length?rand(hit).name:''; }

  static touchFace(c,zone,lv){ return zone==='head'?Characters.pickFace(c,lv>=5?['미소','웃음','수줍음','부끄럼']:['당황','놀람','평온']):zone==='body'?Characters.pickFace(c,lv>=6?['부끄럼','당황','수줍음']:['화남','놀람','당황','짜증']):Characters.pickFace(c,['미소','평온','웃음']); }

  static textFace(c,text){ const t=String(text||''); if(!Characters.facePool(c).length) return ''; for(const [re,names] of TEXT_FACE) if(re.test(t)){ const f=Characters.pickFace(c,names); if(f) return f; } return ''; }

  static petLine(c,o){ const lv=o?Core.affLv(o):1, pool=Characters.spoilFree(c,o?[...((c.touch&&c.touch.pet)||[]),...(lv>=4?((c.touch&&c.touch.head)||[]):[]),...(lv>=5?Characters.affLinePool(c):[])]:c.lines); return rand(pool.length?pool:Characters.spoilFree(c,((c.touch&&c.touch.head)||[]).concat(c.lines||[])))||''; }

  static designAIPrompt({w,facs}){ return `${Core.pf('DESIGN_TAGS',{summary:String(w.summary||'').slice(0,600),factions:(w.factions||[]).map(f=>f.name+'('+String(f.desc||'').slice(0,80)+')').join(', ')||'없음',chars:facs.map(f=>'- '+f+': '+G.chars.filter(c=>c.faction===f).slice(0,3).map(c=>String(c.naiPrompt||'').slice(0,120)).join(' / ')).join('\n')})}JSON만 출력: {"all":"","factions":[{"name":"세력 이름 그대로","tags":""}]}`; }

  static weaponPromptAIPrompt({w,v}){ return `${Core.pf('WEAPON_ART',{name:w.name,summary:String(w.summary||'').slice(0,500),weapon:System.T('weapon'),list:v})}\nJSON만 출력: {"weapons":[{"name":"캐릭터 이름","prompt":"no humans, object focus, ..."}]}`; }

  static weaponPromptAIVText({list}){ return list.map(x=>`- ${System.T('crew')} "${x.c.name}"(${x.c.faction||'무소속'})의 ${System.T('weapon')} "${x.name||'?'}"${x.desc?' — '+x.desc:''}${x.cur?'\n  지금 프롬프트: '+String(x.cur).slice(0,220):''}`).join('\n'); }

  static aiChapterGen0Prompt({dir,cast,memo,rel,k,deep,lastPost,SC,n,LS}){ return `【스토리 참조: 메인 장 구성】\n${RULES}\n${World.ctx(false,dir+' '+cast.join(' '))}${memo}${rel}${LiveOps.planCtx(k+1)}\n${SCRIPT_FMT}\n${deep?'':THREAD_FMT}\n\n직전 장면: ${lastPost.slice(-6000)}\n\n${Core.pf('CH_REQUEST',{chapter:k+1,how:deep?Core.pf('CH_HOW_DEEP'):Core.pf('CH_HOW_FAST'),crew:System.T('crew'),owned:G.chars.filter(c=>Characters.own(c.id)).map(c=>c.name).join(', ')||'없음',files:System.T('files'),dir,castLine:cast.length?'주요 등장 '+System.T('crew')+': '+cast.join(', ')+'.':'',npc:NewGame.npcRule(),newc:Core.newcRule(SC.newc),talkOnly:NewGame.talkOnlyRule(n)+' '+NewGame.finaleRule(),modes:STAGE_MODES,lines:deep?'':`각 스테이지 pre는 ${LS.pre}줄, post는 ${LS.post}줄. 스테이지마다 선택지 1개 이상. ${DETAIL_RULE}`,finale:finaleEnd(),n,reuse:Art.enemyReuseHint(),battleFlow:BATTLE_FLOW,cgMark:deep?Core.pf('CG_MARK_BEATS'):Core.pf('CG_MARK_SCRIPT'),player:System.T('player'),threads:deep?'':Core.pf('CH_THREADS',{talk:System.T('talk'),dup:THREAD_DUP_RULE,rel:REL_RULE})})}\nJSON만 출력: {"title":"${k+1}장 제목","logline":"이 장의 한 줄 줄거리(40자 안팎, 스포일러 없이 궁금하게)","stages":${Core.stageSchema(deep)},"backgrounds":[{"name":"","prompt":""}],"props":[{"name":"","prompt":""}],"music":[{"name":"","prompt":""}],"cgs":[{"name":"","prompt":"","cast":["등장 인물 이름"]}],"codex":[],"newCharacters":[],${BESTIARY_SCHEMA},"stance":[{"faction":"이 장에서 플레이어와의 관계가 바뀌는 세력(없으면 빈 배열)","s":"ally|neutral|hostile","why":""}],${NPC_SCHEMA}${deep?'':`,"threads":[{"char":"${System.T('crew')} 이름","title":"","afterStage":1,"script":""}],"summary":"",${REL_SCHEMA()}`}}`; }

    /* src/main/0260-new-game-draft.js */
static drPolishPrompt({what,k,cur}){ return `${Core.pf('DR_POLISH',{what,pf:k==='setting'?Core.pf('DR_POLISH_SECRET'):'',drCtx:Characters.drCtx(k),cur})}JSON만 출력: {"text":"다듬은 전체 글"}`; }

  static drPolishHeroPrompt({h}){ return `${Core.pf('DR_POLISH_HERO',{drCtx:Characters.drCtx('hero'),call:JSON.stringify({call:h.call||'',name:h.name||'',gender:h.gender||'',look:h.look||'',bio:h.bio||''})})}JSON만 출력: {"call":"호칭(2~4자)","name":"이름(비어 있었으면 빈 문자열)","look":"외모","bio":"설정 3~5문장"}`; }

  static drHarmonyPrompt({d}){ return `${Core.pf('DR_HARMONY',{DR_NODUP,kw:d.kw||'(비어 있음)',tone:!d.tone?'(비어 있음)':dupTxt(d.kw,d.tone)?Core.pf('DR_HARMONY_TONE'):d.tone,drTheme:Characters.drTheme(d).filter(x=>!/^장르|^분위기/.test(x)).join('\n'),drText:Core.drText(d).slice(0,20000)})}JSON만 출력: {"kw":"장르와 키워드","tone":"분위기","world":"세계관 전체 글","setting":"설정 전체 글","story":"스토리 개요 전체 글","chars":[{"name":"","role":"","profile":"","speech":"","look":""}],"heroBio":"주인공 설정"} — chars는 위 인물 순서 그대로, 같은 수로.`; }

  static drFillCharPrompt({i,c}){ return `${Core.pf('DR_FILL_CHAR',{drCtx:Characters.drCtx('c:'+i),name:JSON.stringify({name:c.name||'',role:c.role||'',profile:c.profile||'',speech:c.speech||'',look:c.look||''})})}JSON만 출력: {"name":"","role":"한 줄 소개","profile":"성격·과거·관계 3~5문장","speech":"말투 설명과 예시 한 마디","look":"외모"}`; }

  static aiNewPickupCharCOLText({col}){ return col&&col.src?Core.pf('PICKUP_COLLAB',{crew:System.T('crew'),src:col.src,who:col.who?'의 「'+col.who+'」':'의 인상적인 성인 캐릭터 1명'}):''; }

    /* src/main/0455-persona.js */
static personaAIPrompt({c,mode,others,opt,cfg}){ return `${RULES}\n${World.ctx()}\n\n${System.T('crew')} 「${c.name}」(${RL[c.rarity]}, ${c.faction||'무소속'}, ${c.elem}, ${(Core.posOf(c)||{}).name||ROLE[c.role]})의 개성 시트를 ${mode==='improve'?Core.pf('PERSONA_IMPROVE'):Core.pf('PERSONA_FILL')}.
  프로필: ${String(c.profile||'').slice(0,500)}
  지금 개성: ${JSON.stringify(c.persona||{})}
  지금 대사: ${(c.lines||[]).slice(0,6).join(' / ')}
  다른 ${System.T('crew')}(말투·성격이 겹치지 않게): ${others||'없음'}
  ${opt.instruction?'추가 지시: '+opt.instruction+'\n':''}규칙: 핵심 성격 3개는 서로 다른 축(겉모습·속마음·행동 습관). 반전 매력은 겉과 반대되는 의외의 면(약점이 드러나는 순간). 1인칭·어미·말버릇은 짧고 다른 캐릭터와 겹치지 않게. 대표 대사는 그 캐릭터만 할 법한 한 줄.
  ${opt.lines?'lines는 이 말투로 다시 쓴 평소 대사 5개. affLines는 호감도 3·5·8에서 나올 대사.':''}
  JSON만 출력: {"persona":{"traits":["","",""],"self":"","call":"","ending":"","quirk":"","catch":"","gap":"","flaw":"","want":"","fear":"","likes":[""],"dislikes":[""],"hobby":"","motif":""},"pfields":{${cfg.tpl.map(k=>`"${k}":""`).join(',')}}${opt.lines?',"lines":["5개"],"affLines":{"3":[""],"5":[""],"8":[""]}':''}}`; }

  static talkAffGenPrompt({c,levels}){ return `${Core.pf('AFF_TALK',{RULES,ctx:World.ctx(),crew:System.T('crew'),name:c.name,talk:System.T('talk'),levels:levels.join(', '),personaBrief:Characters.personaBrief(c),profile:String(c.profile||'').slice(0,300),THREAD_FMT})}JSON만 출력: {"threads":[{"lv":${levels[0]},"title":"알림에 뜰 짧은 제목","script":"대화"}]}`; }

  static memorialGenPrompt({c,cfg}){ return `${Core.pf('MEMORIAL',{RULES,ctx:World.ctx(),crew:System.T('crew'),name:c.name,memoLv:cfg.memoLv,personaBrief:Characters.personaBrief(c),profile:String(c.profile||'').slice(0,300),SCRIPT_FMT})}JSON만 출력: {"title":"메모리얼 제목","script":"대본","lines":["4개"]}`; }

    /* src/main/0510-actions/050-settings-and-audio.js */
static vsaiPrompt({c}){ return `${Core.pf('VOICE_SEARCH',{name:c.name,profile:c.profile,naiPrompt:c.naiPrompt||'',lines:c.lines.slice(0,3).join(' / ')})}\nJSON만 출력: {"queries":["..."]}`; }

  static vsaiPrompt2({c,cands}){ return `${Core.pf('VOICE_PICK',{name:c.name,profile:c.profile,naiPrompt:c.naiPrompt||'',lines:c.lines.slice(0,3).join(' / '),cands:JSON.stringify(cands)})}\nJSON만 출력: {"picks":[{"id":"후보 id","reason":"한 줄 이유"}]}`; }

  static ailinesPrompt({fName,fFac,fProf}){ return `${Core.pf('CHAR_LINES',{RULES,ctx:World.ctx(),value:fName,value2:fFac,value3:fProf})}\nJSON만 출력: {"lines":["로비 인사 대사 8개(상황을 다양하게)"],"affLines":{"4":["호감도 4부터"],"7":["호감도 7부터"],"10":["호감도 10"]},"lvLines":["${System.T('enhance')} 시 2개"],"dupLines":["${System.T('limit')} 시 1개"],"head":["머리 터치 5개"],"body":["몸 터치 시 당황하거나 놀리는 반응 5개"],"intro":"${System.T('gacha')} 첫마디"}`; }

  static ailinesmorePrompt({L0,H0,B0,fName,fFac,fProf}){ return `${Core.pf('CHAR_LINES_MORE',{RULES,value:fName,value2:fFac,value3:fProf,l0:L0.join(' / '),h0:H0.join(' / '),b0:B0.join(' / ')})}\nJSON만 출력: {"lines":["새 로비 인사 대사 ${Math.max(2,8-L0.length)}~${Math.max(4,10-L0.length)}개"],"head":["새 머리 터치 반응 ${Math.max(2,5-H0.length)}개"],"body":["새 몸 터치 반응 ${Math.max(2,5-B0.length)}개"]}`; }

  static skinlinesPrompt({c,k}){ return `${Core.pf('SKIN_LINES_EDIT',{RULES,ctx:World.ctx(),crew:System.T('crew'),name:c.name,name2:k.name,skin:System.T('skin'),idea:String(k.idea||k.prompt||'').slice(0,200),lines:(c.lines||[]).slice(0,3).map(x=>'"'+x+'"').join(' / ')})}\nJSON만 출력: {"lines":["대사 6개"],"intro":"이 ${System.T('skin')}을 처음 입었을 때 한마디"}`; }

    /* src/modules/combat/050-bridge.js */
static v2GenerateSkillsPromptText({menus,designC,concept,base,feedback,remaster}){ return `${Core.pf('SKILL_KIT_DESIGN',{v2PalettePrompt:Characters.v2PalettePrompt(),menus:JSON.stringify(menus),v2DesignContext:JSON.stringify(Characters.v2DesignContext(designC,concept,base)),feedback:feedback?'직전 실패를 수정하세요: '+feedback:''})}${remaster?Core.pf('SKILL_REMASTER',{from:remaster.from,to:remaster.to,plan:Object.values(remaster.plan||{}).filter(Boolean).join(' / ')||'없음',old:JSON.stringify(Object.fromEntries(Object.keys(GGMCombat.SLOTS).map(s=>[s,{name:remaster.kit?.[s]?.name||'',effects:(remaster.kit?.[s]?.effects||[]).map(e=>e.type)}])))}):''}JSON만 출력: {"designPlan":"주역할과 짧은 연계","skills":{"passive":{"name":"이름","recipe":"${Object.keys(menus.passive)[0]}","extras":[],"power":100},"active":{"name":"이름","recipe":"${Object.keys(menus.active)[0]}","extras":[],"power":100},"ultimate":{"name":"이름","recipe":"${Object.keys(menus.ultimate)[0]}","extras":[],"power":100}}}`; }

  static v2ConceptPromptPrompt({c,p,s,fallback}){ return `${Core.pf('SKILL_ICON_ART',{name:JSON.stringify({name:c.name,profile:c.profile,appearance:c.naiPrompt,element:c.elem,weapon:c.weapon?.desc,slot:p.slot,skill:s}),fallback})}JSON만 출력: {"prompt":"영어 태그"}`; }

    /* src/modules/combat/070-equipment.js */
static v2GearGeneratePrompt({c,state,choices,feedback}){ return `${Core.pf('GEAR_PASSIVE_DESIGN',{name:JSON.stringify({character:{name:c.name,profile:c.profile,concept:state.concept||c.skillConcept,weapon:{name:c.weapon?.name,description:c.weapon?.desc}},skills:{passive:c.skills.passive,active:c.skills.active},choices:choices.map(x=>({choiceId:v2GearChoiceKey(x),label:x.label,min:x.min,max:x.max,unit:x.unit})),feedback})})}JSON만 출력: {"choiceId":"${v2GearChoiceKey(choices[0])}","name":"고유 효과 이름","value":${choices[0].value}}`; }

    /* src/main/0445-factions.js */
  // AI 컨텍스트
static factionCtx(){ const F=World.factions(), now=World.mainNow(), L=[];
    F.forEach(f=>{ const st=World.stanceAt(f,now), nxt=(f.stance||[]).filter(x=>+x.ch>now).sort((a,b)=>a.ch-b.ch)[0], mem=G.chars.filter(c=>c.faction===f.name&&!c.monster).map(c=>c.name);
      L.push(`- ${f.name} [${FKIND[f.kind]} · 지금 플레이어와 ${FSTANCE[st]}${nxt?` · ${nxt.ch}장부터 ${FSTANCE[nxt.s]} 예정(${nxt.why||''}, 아직 드러내지 않음)`:''}]: ${f.desc||''}${f.goal?' 목적: '+f.goal+'.':''}${f.leader?' 지도자: '+f.leader+'.':''}${f.base?' 거점: '+f.base+'.':''}${f.ideology?' 이념: '+f.ideology+'.':''}${f.kind==='monster'?`${f.origin?' 정체: '+f.origin+'.':''}${f.nature?' 습성: '+f.nature+'.':''}${f.weakness?' 약점: '+f.weakness+'.':''}`:''}${Object.keys(f.rel).length?' 다른 세력과: '+Object.entries(f.rel).map(([k,v])=>k+' '+v).join(', ')+'.':''}${mem.length?' 소속 '+System.T('crew')+': '+mem.join(', ')+(st==='hostile'?' (지금은 적으로 나올 수 있음)':''):''}`); });
    const M=World.monsterNames().filter(l=>l.desc||World.enemyFaction(l)); const crew=G.chars.filter(c=>!c.monster&&!c.npc&&!c.alt), unmet=crew.filter(c=>Characters.own(c.id)&&!World.metInStory(c)), lock=crew.filter(c=>!Characters.own(c.id)&&((c.debut&&!World.debutOk(c))||c.debutLater));
    return `\n세력(설정을 지키고, 관계 변화는 정해진 장에서만):\n${L.join('\n')||'없음'}\n${M.length?Core.pf('CTX_BESTIARY')+M.map(l=>`${l.name}${World.enemyFaction(l)?'('+World.enemyFaction(l)+')':''}: ${[l.desc,l.nature,l.weak&&'약점 '+l.weak].filter(Boolean).join(' / ')}`).join('; ')+'\n':''}${unmet.length?Core.pf('CTX_UNMET',{crew:System.T('crew'),names:unmet.map(c=>c.name).join(', ')}):''}${Characters.castLockCtx(lock)}`; }

    // 아직 등장하지 않은 대원(실행 중 장·이벤트·톡의 AI 컨텍스트): 명단은 여기서, 지시문은 프롬프트 스튜디오의 CAST_LOCK_RULE
  // "나중 등장" 대원은 정해진 장면이 없어 새 장을 쓸 때 흐름에 맞으면 첫 등장(debutResolve가 첫 등장 스테이지를 정해 잠금이 풀림)
static castLockCtx(lock){ if(!lock.length) return ''; const N=L=>L.map(c=>c.name).join(', '), fixed=lock.filter(c=>c.debut), later=lock.filter(c=>!c.debut);
    return `아직 만나지 않은 ${System.T('crew')} — ${fixed.length?`첫 등장 장면이 정해짐: ${N(fixed)}`:''}${fixed.length&&later.length?' / ':''}${later.length?`정해진 장면 없음: ${N(later)}`:''}\n${CAST_LOCK_RULE}\n`; }

    /* src/main/0455-persona.js */
static personaBrief(c){ const p=c&&c.persona; if(!p) return ''; const a=[p.traits&&p.traits.length?'성격 '+p.traits.join('·'):'',p.self?'1인칭 '+p.self:'',p.call?'플레이어를 "'+p.call+'"(이)라 부름':'',p.ending?'어미 '+p.ending:'',p.quirk?'말버릇 '+p.quirk:'',p.gap?'반전 매력: '+p.gap:'',p.flaw?'약점: '+p.flaw:'']; return a.filter(Boolean).join(', '); }

    // 초안의 다른 칸을 함께 보여 줘서 서로 맞춰 다듬어요(skip: 'world'|'setting'|'story'|'c:번호')
static drCtx(skip){ const d=DR2, L=[];
    const th=Characters.drTheme(d).map(x=>x.startsWith('2차 창작')?x+Core.pf('DR_SOURCE'):x);
    if(th.length) L.push('[테마]\n'+th.join('\n'));
    if(skip!=='world'&&d.world.trim()) L.push('[세계관]\n'+d.world.trim().slice(0,6000));
    if(skip!=='setting'&&d.setting.trim()) L.push('[설정: 세력·용어·규칙·비밀]\n'+d.setting.trim().slice(0,4000));
    if(skip!=='story'&&d.story.trim()) L.push('[스토리 개요]\n'+d.story.trim().slice(0,3000));
    const cs=d.chars.map((c,i)=>[c,i]).filter(([c,i])=>skip!=='c:'+i&&(String(c.name||'').trim()||String(c.profile||'').trim()));
    if(cs.length) L.push('[다른 인물]\n'+cs.map(([c])=>`- ${c.name||'(이름 미정)'}${c.role?' — '+c.role:''}: ${String(c.profile||'').slice(0,300)}${c.speech?' / 말투: '+c.speech:''}${c.look?' / 외모: '+c.look:''}`).join('\n'));
    const hr=d.hero; if(skip!=='hero'&&(hr.name||hr.call||hr.gender||hr.look||hr.bio)) L.push(`[주인공(플레이어)]\n호칭: ${hr.call||'(미정)'} / 이름: ${hr.name||'(미정)'} / 성별: ${hr.gender||'정하지 않음'}${hr.look?' / 외모: '+hr.look:''}${hr.bio?'\n설정: '+hr.bio:''}`);
    return L.length?Core.pf('DR_OTHER')+L.join('\n\n')+'\n':''; }

  static drTheme(d){ return [d.gtitle&&'게임 이름: '+d.gtitle,d.kw&&'장르·키워드: '+d.kw,d.tone&&!dupTxt(d.kw,d.tone)&&'분위기: '+d.tone,d.fan&&d.src&&'2차 창작 원작: '+d.src].filter(Boolean); }

    /* src/modules/combat/060-generation.js */
static v2PalettePrompt(){
   return Core.pf('SKILL_PALETTE',{v2ElemNames:v2ElemNames(),fxColors:JSON.stringify(GGMCombat.FX_COLORS)});
  }

  static v2DesignContext(c,concept,base){
   const C=GGMCombat;
   return {character:{name:c.name,role:C.aiRole(c),profile:c.profile,appearance:c.naiPrompt,appearanceTags:c.naiPrompt||'',appearanceDescription:c.appearance||'',intro:c.intro||'',weapon:c.weapon?{name:c.weapon.name,description:c.weapon.desc}:null,specialty:C.isHealer(c)?'치유·보호를 담당하는 힐러':'현재 역할',concept:concept.trim()||'현재 캐릭터 설정에 맞게 결정'},generation:C.generation(c),effectLimits:C.aiLimits(c),powerBudgets:C.GENERATIONS[C.generation(c)],savedSkills:Object.fromEntries(Object.entries(C.SLOTS).map(([slot])=>[slot,{name:base[slot].name,effects:base[slot].effects.map(e=>e.type)}]))};
  }

  static v2SlotPrompt(c,slot,concept,base,feedback){
   const C=GGMCombat,menu=v2DesignMenu(c,slot),recipe=Object.keys(menu)[0];
   return `${Core.pf('SKILL_SLOT_DESIGN',{slots:C.SLOTS[slot],fxTypes:JSON.stringify(C.FX_TYPES),v2ElemNames:v2ElemNames(),v2PalettePrompt:Characters.v2PalettePrompt(),menu:JSON.stringify(menu),v2DesignContext:JSON.stringify(Characters.v2DesignContext(c,concept,base)),feedback:feedback?'직전 실패를 수정하세요: '+feedback:''})}JSON만 출력: {"plan":{"theme":"컨셉","role":"주역할","nameReason":"이름과 능력이 캐릭터 모티프에 맞는 이유"},"skill":{"name":"컨셉에 맞는 이름","recipe":"${recipe}","extras":[],"fx":"컨셉에 맞는 지원 이펙트 이름","paletteDesign":{"theme":"시각 테마","primary":{},"secondary":{},"accent":{}},"power":100,"trigger":"${c.role==='def'?'on_hit':'after_basic'}","triggerEvery":4,"target":"${slot==='ultimate'&&c.role==='sup'&&C.generation(c)>=2?'allies':'enemy'}"}}`;
  }

  static okJSON(r){ if(r.status>=400) throw Core.errOf(r); try{return JSON.parse(r.text||(r.bytes?new TextDecoder().decode(r.bytes):''));}catch(e){throw {code:'upstream_error',message:'응답을 읽지 못했어요'};} }

  static parseLoose(text){ AILAST=String(text||'');
    const all=String(text||'').replace(/^\uFEFF/,'').replace(/```(?:json|JSON)?/g,'').trim();
    // JSON이 시작할 수 있는 곳만 후보로: '{' 다음엔 " 나 }, '[' 다음엔 값. 설명글 속 [SR]·[배경] 같은 대괄호는 건너뛰어요
    const starts=[]; for(let i=0;i<all.length&&starts.length<40;i++){ const ch=all[i]; if(ch!=='{'&&ch!=='[') continue; let k=i+1; while(k<all.length&&/\s/.test(all[k])) k++; const nx=all[k]||'';
      if(ch==='{'?/["}]/.test(nx):(/["{\[\]\-0-9]/.test(nx)||/^(true|false|null)/.test(all.slice(k,k+5)))) starts.push(i); }
    if(!starts.length) throw {code:'invalid_json'};
    for(const a of starts){ const t=all.slice(a);
      try{ return JSON.parse(t); }catch(e){}
      try{ const v=JSON.parse(Characters.jsonRepair(t)); if(v&&typeof v==='object'&&(Array.isArray(v)?v.length:Object.keys(v).length)) return v; }catch(e){} }
    throw {code:'invalid_json'};
  }

    // 문자열 안의 따옴표가 진짜 끝인지: 뒤에 } ] 가 오거나, 쉼표·콜론 다음에 새 값("…", {, [, 숫자, true/false/null)이 오면 끝이에요. '"괜찮아요", 라고' 같은 대사 속 따옴표는 끝이 아니에요
static jsonStrEnd(t,i){ const nx=k=>{ while(k<t.length&&/\s/.test(t[k])) k++; return k; }; let j=nx(i+1); if(j>=t.length) return true; const c=t[j];
    if(c==='}'||c===']') return true; if(c===','||c===':'){ const k=nx(j+1); if(k>=t.length) return true; return /["{\[\-0-9tfn\]}]/.test(t[k])&&!(/[tfn]/.test(t[k])&&!/^(true|false|null)/.test(t.slice(k,k+5))); } return false; }

    // 깨진 JSON 고치기: 문자열 안의 줄바꿈·탭, 끝의 쉼표, 길이 제한으로 끊긴 끝(닫는 따옴표·괄호), 뒤에 붙은 설명글
static jsonRepair(t){ let out='', inS=false, esc=false; const st=[];
    for(let i=0;i<t.length;i++){ const ch=t[i];
      if(inS){ if(esc){ esc=false; out+=ch; continue; } if(ch==='\\'){ esc=true; out+=ch; continue; }
        if(ch==='"'){ // 문자열 안의 따옴표를 이스케이프하지 않은 경우: 뒤가 , } ] : 가 아니면 문자로 봐요
          if(!Characters.jsonStrEnd(t,i)){ out+='\\"'; continue; } inS=false; out+=ch; continue; }
        if(ch==='\n'){ out+='\\n'; continue; } if(ch==='\r') continue; if(ch==='\t'){ out+='\\t'; continue; } if(ch<' ') continue; out+=ch; continue; }
      if(ch==='"'){ inS=true; out+=ch; continue; }
      if(ch==='{'||ch==='['){ st.push(ch==='{'?'}':']'); out+=ch; continue; }
      if(ch==='}'||ch===']'){ if(!st.length) continue; out=out.replace(/[\s,]+$/,''); out+=st.pop(); if(!st.length) return out; continue; }
      out+=ch; }
    if(esc) out=out.slice(0,-1); if(inS) out+='"';
    out=out.replace(/[\s,:]+$/,'').replace(/,\s*"[^"]*"$/,'').replace(/([{\[])\s*"[^"]*"$/,'$1');
    while(st.length){ out=out.replace(/[\s,]+$/,''); out+=st.pop(); }
    return out; }

  static async claudeMsg(url,hdr,body,tier,options={}){
    // 길이 제한(max_tokens)에 걸리면 끊긴 곳부터 이어 쓰게 해서 최대 2번 더 받아 붙여요.
    let text='', stop='';
    for(let i=0;i<3;i++){
      const msgs=i?[...body.messages,{role:'assistant',content:text},{role:'user',content:'앞 응답이 길이 제한으로 끊겼다. 끊긴 바로 다음 글자부터 이어서 출력한다. 앞부분을 반복하지 말고, 설명이나 코드 블록 없이 이어지는 내용만 쓴다.'}]:body.messages;
      const r=await System.http(url,{method:'POST',headers:{'Content-Type':'application/json',...hdr},body:{...body,messages:msgs},timeout:TMO[tier],signal:options.signal});
      const j=Characters.okJSON(r); if(j.stop_reason==='refusal') throw {code:'refused'};
      text+=(j.content||[]).filter(b=>b.type==='text').map(b=>b.text).join(''); stop=j.stop_reason;
      if(stop!=='max_tokens'||options.managedRetry) break;
    }
    try{ return Characters.parseLoose(text); }catch(e){ throw {code:'invalid_json',message:stop==='max_tokens'?'응답이 길이 제한에 걸렸어요':''}; }
  }

  static async geminiCall(url,hdr,prompt,tier,imgs,options={}){
    const max={quick:4000,default:16000,complex:32000}[tier];
    const body={contents:[{role:'user',parts:[...(imgs||[]).map(i=>({inline_data:{mime_type:i.mime,data:i.data}})),{text:prompt}]}],generationConfig:{maxOutputTokens:max,temperature:1,responseMimeType:'application/json'},
      safetySettings:['HARM_CATEGORY_HARASSMENT','HARM_CATEGORY_HATE_SPEECH','HARM_CATEGORY_SEXUALLY_EXPLICIT','HARM_CATEGORY_DANGEROUS_CONTENT'].map(c=>({category:c,threshold:'BLOCK_ONLY_HIGH'}))};
    const r=await System.http(url,{method:'POST',headers:{'Content-Type':'application/json',...hdr},body,timeout:TMO[tier],signal:options.signal});
    const j=Characters.okJSON(r);
    if(j.promptFeedback&&j.promptFeedback.blockReason) throw {code:'refused'};
    const cand=(j.candidates||[])[0]; if(!cand) throw {code:'refused'};
    if(['SAFETY','PROHIBITED_CONTENT','BLOCKLIST','SPII','RECITATION'].includes(cand.finishReason)) throw {code:'refused'};
    const text=((cand.content&&cand.content.parts)||[]).filter(x=>!x.thought).map(x=>x.text||'').join('');
    try{ return Characters.parseLoose(text); }catch(e){ throw {code:'invalid_json',message:cand.finishReason==='MAX_TOKENS'?'응답이 길이 제한에 걸렸어요':''}; }
  }

  static llmFromCode(t){ const m=String(t||'').trim().match(/GGMLLM:([A-Za-z0-9+/=]+)/); if(!m) return null; try{ const o=JSON.parse(decodeURIComponent(escape(atob(m[1])))); return o&&o.text?o:null; }catch(e){ return null; } }

  static packFromCode(t){ const m=String(t||'').trim().match(/GGMPACK:([A-Za-z0-9+/=]+)/); if(!m) return null; try{ const o=JSON.parse(decodeURIComponent(escape(atob(m[1])))); return o&&typeof o==='object'?o:null; }catch(e){ return null; } }

    // 캐릭터 디자인 통일: 이 게임의 가챠 캐릭터 그림에 공통 태그 + 세력별 태그를 붙여요(NPC·콜라보 게스트·스킨에는 안 붙고, 캐릭터마다 끌 수 있어요)
static designTags(c){ if(!c||c.npc||c.noDesign||c.collab||typeof G==='undefined'||!G||!(G.chars||[]).includes(c)) return ''; const d=(G.meta&&G.meta.design)||{}; return Core.joinTags(String(d.all||''),String(((d.fac||{})[c.faction])||'')); }

  static naiBlocksTokens(text){
   const s=String(text||''),out=[];let start=0,weighted=false;const stack=[];
   for(let i=0;i<s.length;i++){
    const c=s[i];if(c===':'&&s[i+1]===':'){weighted=!weighted;i++;continue;}
    if('{[('.includes(c))stack.push(c);
    else if('}])'.includes(c)){const match={'}':'{',']':'[',')':'('}[c];if(stack.at(-1)===match)stack.pop();}
    if(c===','&&!weighted&&!stack.length){const t=s.slice(start,i).trim();if(t)out.push(t);start=i+1;}
   }
   const tail=s.slice(start).trim();if(tail)out.push(tail);return out;
  }

  static naiBlocksTagKey(tag){
   let k=Core.tagKey(tag).replace(/_/g,' ').replace(/[\u2010-\u2015-]/g,' ').replace(/\s+/g,' ').trim();
   while(k.length>1&&((k[0]==='{'&&k.at(-1)==='}')||(k[0]==='['&&k.at(-1)===']')))k=k.slice(1,-1).trim();
   return k;
  }

  static naiBlocksIsStyle(tag){
   const k=Characters.naiBlocksTagKey(tag);
   // Keep weighted groups intact. Move a group only if every member is style/quality.
   if(k.includes(',')){const members=Characters.naiBlocksTokens(k);return members.length>1&&members.every(Characters.naiBlocksIsStyle);}
   return /^artist:/.test(k)||/^(?:artist collaboration|year \d{4}|newest|masterpiece|very aesthetic|amazing quality|best quality|great quality|good quality|normal quality|bad quality|worst quality|high quality|low quality|highres|absurdres|lowres|ultra detailed|high detail|highly detailed|fine details|detailed shading|expert shading|ultra complexity|high complexity|thick lineart|thin lineart|bold lineart|clean lineart|no lineart|flat colou?r|monochrome|greyscale|grayscale|3d|2d|anime style|anime colouring|anime coloring|cel shading|cell shading|soft shading|painterly|watercolou?r(?: \(medium\))?|oil painting(?: \(medium\))?|sketch|pixel art|digital art|digital painting|photorealistic|realistic|semi realistic|official style|official art|simple illustration|no text)$/.test(k);
  }

  static naiBlocksKnownStyle(){
   // Custom artist names need not have an artist: prefix. Match the configured
   // positive style as whole tokens; never classify by fragments of a name.
   try{if(typeof Core.naiCfg==='function'&&typeof Core.naiStyle==='function')return new Set(Characters.naiBlocksTokens(Core.naiStyle(Core.naiCfg()).tags).map(Characters.naiBlocksTagKey));}catch(_){}
   return new Set();
  }

  static naiBlocksTagSlot(tag,knownStyle){
   const k=Characters.naiBlocksTagKey(tag);if(Characters.naiBlocksIsStyle(tag)||knownStyle?.has(k))return 'style';if(k.includes(','))return 'other';
   // Camera, framing, composition and style apply to an image rather than anatomy.
   if(/\b(?:eye level|bird'?s? eye|worm'?s? eye|fish eye|fisheye|dutch angle|camera angle|camera view|bust shot|bust portrait|bust up|close up|cowboy shot|upper body|lower body|full body|head shot|headshot|from above|from below|from behind|from side)\b/.test(k)||/\b(?:focus|perspective|shot|view|background|lighting)\s*$/.test(k)||/\b(?:bust chart|character chart|reference sheet|multiple views)\b/.test(k))return 'other';
   // Gaze, expressions and interactions must not become permanent physical traits.
   if(/\b(?:eye contact|eye twitch|eye roll|rolling eyes|eyes rolling|squinting|winking|furrowed eyebrows|raised eyebrows|blushing skin|tears in eyes|tears in eye|hair flip|hair blowing|wind blown hair|wind swept hair|wet hair|wet skin|sweaty skin|blood on skin|ears down|ears back|tail between legs|spread wings|spreading wings|wings spread|flapping wings|tail wagging|wagging tail)\b/.test(k)||/^(?:half closed|closed|shut|narrowed|wide open|watery|tearful|teary|crying)\b.*\beyes?$/.test(k)||/^(?:one |both )?eyes? (?:closed|open|shut)\b/.test(k)||/^(?:looking|gazing|staring|holding|carrying|adjusting|lifting|pulling|tugging|grabbing|touching|covering|raising|opening|removing|petting)\b/.test(k)||/\b(?:skirt|shirt|dress|hair|ear|ears|breast|breasts|tail) (?:lift|grab|pull|hold|tug|touch|wag)\b/.test(k))return 'other';
   if(/^(?:one |both )?hands? (?:in|on|over|behind)\b/.test(k)||/\b(?:ears? blush|ear twitch|skirt lifted|hair grabbed)\b/.test(k))return 'other';
   // Bags under the eyes are a facial feature; unlike a carried/worn bag.
   if(/\bshaped (?:pupils?|hair)\b/.test(k))return 'appearance';
   if(/^(?:eye bags?|bags? under (?:the )?eyes|under eye bags?)$/.test(k))return 'appearance';
   // Artificial features and materials on clothing are accessories, not species traits.
   if(/\b(?:tank top|holsters|ear piercing|nose piercing|lip piercing|horn ornament|ear ornament|tail ornament|hair bows?|hair flower|hairpin|hair stick|hair scrunchie|eye patch|eyepatch|eye mask|face mask|headphones|fur trim|fur collar|fur cuffs|wing collar|fake (?:animal )?ears|fake horns|fake tail|skin tight|tailcoat|sleeves|collar|bowtie|neck bow)\b/.test(k))return 'outfit';
   if(/\b(robe|tunic|gown|costume|sundress|haori|hakama|tabard|surcoat|dress|shirt|t-shirt|turtleneck|blouse|coat|jacket|cloak|cape|uniform|bodysuit|swimsuit|bikini|yukata|kimono|suit|sweater|hoodie|vest|armor|armour|breastplate|gauntlets?|gloves?|skirt|shorts|pants|trousers|jeans|leggings|stockings|socks|boots?|shoes?|sandals?|heels|hat|cap|beret|helmet|ribbon|hairband|headband|hair ornament|hairclip|earrings?|necklace|choker|brooch|bracelet|belt|tie|necktie|scarf|apron|glasses|goggles|headset|holster|bag|backpack|jumpsuit|leotard|corset|lingerie|pantyhose|panties|bra)\b/i.test(k))return 'outfit';
   if(/^(\d+(girl|boy|other)s?|solo|no humans|faceless)$/.test(k)||/\b(hair|ponytail|twintails|braid|bangs|eyes?|pupils?|eyebrows?|eyelashes|sclera|heterochromia|skin|complexion|freckles|scar|tattoo|ears?|horns?|tail|wings?|breasts?|bust|muscular|slender|athletic|tall|short stature|petite|elf|demon|robot|dragon|fur|scales|tentacles)\b/i.test(k))return 'appearance';
   return 'other';
  }

  static naiBlocksSplit(text,mode='person'){
   const lists={appearance:[],outfit:[],other:[],style:[]},known=Characters.naiBlocksKnownStyle();for(const tag of Characters.naiBlocksTokens(text))lists[Characters.naiBlocksTagSlot(tag,known)].push(tag);
   return Object.fromEntries(NAI_BLOCK_KEYS.map(key=>[key,lists[key].join(', ')]));
  }

    // Classify all actor prompts without changing their legacy text, tag order or images.
static naiBlocksRemember(o,key='naiPrompt'){
   if(!o||typeof o[key]!=='string'||!o[key].trim())return false;
   const text=o[key],saved=o.naiBlocks?.[key];if(saved?.combined===text&&(saved.method!=='rules'||saved.ruleVersion===NAI_BLOCK_RULE_VERSION)){
    if(typeof saved.style!=='string'){const p=Core.naiBlocksUpgrade(saved);if(p.style){o.naiBlocks={...o.naiBlocks,[key]:{...saved,...p}};return true;}}
    return false;
   }
   o.naiBlocks={...o.naiBlocks,[key]:{...Characters.naiBlocksSplit(text),combined:text,original:saved?.original??text,method:'rules',ruleVersion:NAI_BLOCK_RULE_VERSION}};return true;
  }

  static naiBlocksGame(g){
   if(!g)return false;let changed=false;const remember=(o,k)=>{if(Characters.naiBlocksRemember(o,k))changed=true;};
   for(const c of g.chars||[]){remember(c,'naiPrompt');for(const skin of c.skins||[])remember(skin,'prompt');}
   for(const n of g.npcs||[])remember(n,'naiPrompt');
   for(const l of g.lib||[])if(l.kind==='enemy')remember(l,'prompt');
   remember(g.prog?.avatar,'prompt');remember(g.meta?.shop?.self,'naiPrompt');return changed;
  }

  static naiBlocksOf(o,key='naiPrompt'){
   const text=String(o?.[key]||''),saved=o?.naiBlocks?.[key];
   return saved&&saved.combined===text?Core.naiBlocksUpgrade(saved):Characters.naiBlocksSplit(text);
  }

  static saveLlm(L){ try{ appStorage.setItem(LLMKEY,JSON.stringify(L)); return true; }catch(e){ CoreView.toast('저장 공간이 부족해요'); return false; } }

  static weaponRenameOk(o,n){o=String(o||'').trim();n=String(n||'').trim();return o.length>=3&&n&&o!==n&&!G.chars.some(c=>c.name===o)&&!(G.npcs||[]).some(x=>x.name===o);}

  static regenSourceSnapshot(c){return JSON.stringify(['name','faction','profile','intro','files','naiPrompt','naiBlocks','skill','skills','skillConcept','generation','skillTuning','skillRevisions','weapon','img','upper','illust','lbcg','pose','lbbg','scg','faces','lines','affLines','lvLines','dupLines','touch'].map(k=>[k,c[k]]));}

  static regenSourceCurrent(state){return Core.PJ().active===state.project&&charById(state.cid)===state.target&&Characters.regenSourceSnapshot(state.target)===state.snapshot;}

  static regenAssertCurrent(state){if(!Characters.regenSourceCurrent(state))throw new Error('작업 중 캐릭터나 게임이 바뀌었어요. 이전 결과를 덮어쓰지 않았어요. 다시 생성해 주세요.');}

    /* 다시 만들기로 바꾼 스킬의 설계 의도(슬롯 재설계 plan)를 캐릭터에 */
static regenKeepPlan(c,nc){ if(nc.skillPlan) c.skillPlan=clone(nc.skillPlan); }

    // One inventory feeds both the gallery and image download list, including skin faces and skill icons.
static charImgItems(c){if(!c)return [];const L=[],add=(k,label,o,group='기본')=>{if(o)L.push({k,label,o,group});};
   for(const [k,label,o] of [['stand','스탠딩',c],['upper','상반신',c.upper],['illust','일러스트',c.illust],['lbcg',System.T('limit')+' CG',c.lbcg],['scg','기술 컷인',c.scg],['pose','로비 포즈',c.pose],['lbbg','로비 배경',c.lbbg],['weapon',System.T('weapon'),c.weapon]])add(k,label,o);
   for(const [slot,label] of Object.entries(GGMCombat.SLOTS))add('skill:'+slot,label+' 아이콘',c.skillIcons?.[slot],'스킬 아이콘');
   for(const f of c.faces||[]){add('face:'+f.id,'표정 '+f.name,f,'표정');add('faceup:'+f.id,'표정 '+f.name+' (상반신)',f.up,'표정');}
   for(const k of c.skins||[]){const group=System.T('skin')+' · '+k.name;add('skin:'+k.id,k.name+' 스탠딩',k,group);for(const part of ['upper','illust','lbcg'])add('skin'+part+':'+k.id,k.name+' '+(SKP[part]||part),k[part],group);for(const f of k.faces||[]){add('skinface:'+f.id,k.name+' · '+f.name,f,group);add('skinfaceup:'+f.id,k.name+' · '+f.name+' (상반신)',f.up,group);}}
   for(const o of Object.values(c.cards||{}))add('card:'+o.id,o.name||'카드',o,'카드');return L;
  }

    // 무기 프롬프트 검사: 사람 태그가 섞였거나 '물건 사진'으로 시작하지 않으면 정리가 필요해요 (PR #3 LTXY12님 아이디어)
static wpBad(p){ const s=String(p||'').trim(); if(!s) return false; return /\b(1girl|1boy|1other|2girls|2boys|solo|holding)\b/i.test(s)||!/^(no humans|object focus)/i.test(s); }

  static async weaponPromptAI(list,rep,world){ const w=world||G.world; const v=Characters.weaponPromptAIVText({list});
    const r=await Core.aiJSON(Characters.weaponPromptAIPrompt({w,v}),rep||null,'quick');
    const out=list.map(()=>''); (r&&Array.isArray(r.weapons)?r.weapons:[]).forEach(x=>{ const i=list.findIndex(y=>y.c.name===String(x&&x.name||'').trim()), p=String((x&&x.prompt)||'').trim(); const k=i>=0?i:(list.length===1?0:-1); if(k>=0&&p&&!Characters.wpBad(p)) out[k]=p; }); return out; }

  static async fixWeaponPrompts(chars,world){ try{ const bad=(chars||[]).filter(c=>c&&c.weapon&&Characters.wpBad(c.weapon.prompt)); if(!bad.length) return 0; const out=await Characters.weaponPromptAI(bad.map(c=>({c,name:c.weapon.name,desc:c.weapon.desc,cur:c.weapon.prompt})),null,world); let n=0; bad.forEach((c,i)=>{ if(out[i]){ c.weapon.prompt=out[i]; try{ Core.mark('c:'+c.id); }catch(e){} n++; } }); return n; }catch(e){ return 0; } }

  static allyTags(s){ const L=Core.tagList(s), en=L.some(t=>/^faceless$/i.test(Core.tagKey(t))); return en?L.filter(t=>!/^(faceless|1other|no humans)$/i.test(Core.tagKey(t))).join(', '):String(s||''); }

  static charCaption(c,act){return Core.joinTags(Core.tagList(c.naiPrompt).filter(t=>{const k=Core.tagKey(t);return !COMPO_TAGS.test(k)&&!FRAME_TAGS.test(k)&&!/^(1girl|1boy|solo|\d+girls|\d+boys|mature female|adult woman)$/.test(k);}).join(', '),Characters.designTags(c),act);}

  static async standRefs(cs){ const rf=Core.naiCfg().ref||NAI_DEF.ref, out=[]; for(const c of cs){ const src=c&&Characters.imgSrc(c); if(!src) continue; try{ out.push({image:await Characters.refImage(src),type:rf.type||'character',strength:rf.strength!=null?rf.strength:1,fidelity:rf.fidelity!=null?rf.fidelity:1}); }catch(e){ Core.quietErr(e,'0030-image/010-engine.js:181'); } if(out.length>=4) break; } return out; }

  static loadImg(src){return new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=rej;im.src=src;});}

  static async refImage(src){
    const im=await Characters.loadImg(src), w=im.naturalWidth||im.width, h=im.naturalHeight||im.height, r=w&&h?w/h:2/3;
    const [W,H]=[[1024,1536],[1536,1024],[1472,1472]].sort((a,b)=>Math.abs(r-a[0]/a[1])-Math.abs(r-b[0]/b[1]))[0];
    return Core.imgB64(src,W,H,'#000000');
  }

    /* eyedropper on raw pixels: remove the colour under (px,py). mode 'wand' = connected area only, 'all' = that colour everywhere */
static eraseColorData(id,W,H,px,py,o){
    o=Object.assign({tol:24,soft:14,mode:'wand'},o||{}); const d=id.data, N=W*H;
    px=Math.max(0,Math.min(W-1,Math.round(px))); py=Math.max(0,Math.min(H-1,Math.round(py)));
    let r=0,g=0,b=0,n=0; for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){const X=px+dx,Y=py+dy; if(X<0||Y<0||X>=W||Y>=H) continue; const i=(Y*W+X)*4; if(d[i+3]<40) continue; r+=d[i];g+=d[i+1];b+=d[i+2];n++;}
    if(!n) return {removed:0,color:null};
    r/=n; g/=n; b/=n;
    const T=o.tol, S=Math.max(1,o.soft), lim=T+S;
    const dist=p=>{const i=p*4; if(d[i+3]<8) return 999; const a=d[i]-r,c=d[i+1]-g,e=d[i+2]-b; return Math.sqrt(a*a+c*c+e*e);};
    const kill=new Uint8Array(N); let removed=0;
    if(o.mode==='all'){ for(let p=0;p<N;p++) if(dist(p)<=T){kill[p]=1;removed++;} }
    else{ const q=new Int32Array(N); let qh=0,qt=0; const s0=py*W+px;
      if(dist(s0)<=T){ kill[s0]=1; q[qt++]=s0; removed++; }
      while(qh<qt){const p=q[qh++],X=p%W; const nb=[X>0?p-1:-1,X<W-1?p+1:-1,p>=W?p-W:-1,p<N-W?p+W:-1];
        for(const m of nb){ if(m>=0&&!kill[m]&&dist(m)<=T){kill[m]=1;removed++;q[qt++]=m;} } } }
    if(!removed) return {removed:0,color:[r,g,b]};
    const band=new Uint8Array(N);
    for(let pass=1;pass<=2;pass++) for(let p=0;p<N;p++){ if(kill[p]||band[p]) continue; const X=p%W, prev=pass===1?(m=>kill[m]):(m=>band[m]===1);
      if((X>0&&prev(p-1))||(X<W-1&&prev(p+1))||(p>=W&&prev(p-W))||(p<N-W&&prev(p+W))) band[p]=pass; }
    for(let p=0,i=0;p<N;p++,i+=4){
      if(kill[p]){d[i+3]=0;continue;}
      if(band[p]){ const dd=dist(p); if(dd>=lim) continue; let a=(dd-T)/S; a=Math.max(0.1,Math.min(1,a)); const k=1/a;
        d[i]=Math.max(0,Math.min(255,Math.round((d[i]-(1-a)*r)*k))); d[i+1]=Math.max(0,Math.min(255,Math.round((d[i+1]-(1-a)*g)*k))); d[i+2]=Math.max(0,Math.min(255,Math.round((d[i+2]-(1-a)*b)*k)));
        d[i+3]=Math.round(d[i+3]*a); }
    }
    return {removed,color:[r,g,b]};
  }

  static cutCtx(){const j=CUTJOB;return j&&j.cv?j.cv.getContext('2d',{willReadFrequently:true}):null;}

  static cutBlob(){const j=CUTJOB;return new Promise(r=>j.cv.toBlob(b=>r(b),'image/png'));}

  static cutCfg(){const c=Core.naiCfg();return Object.assign({},CUT_DEF,c.cut||{});}

    // 얼굴 범위 칠하기: 그림 위에 칠한 곳만 다시 그려요(인페인팅). 흰색=다시 그릴 곳
static fitDims(iw,ih){ const A=832*1216, r=iw/ih; let w=Math.sqrt(A*r), h=w/r; w=Math.max(512,Math.round(w/64)*64); h=Math.max(512,Math.round(h/64)*64); return [w,h]; }

    // 얼굴 집중 인페인팅: 칠한 곳 주변만 잘라 크게 키워 다시 그리고, 줄여서 원본에 부드럽게 섞어요(원본의 투명 배경·흰 옷은 그대로)
static async focusedInpaint(src,maskUrl,draw){ const o=await Characters.loadImg(src), W=o.naturalWidth||o.width, H=o.naturalHeight||o.height, cv=(w,h)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; };
    const M=cv(W,H), mx=M.getContext('2d'); mx.fillStyle='#000'; mx.fillRect(0,0,W,H); mx.drawImage(await Characters.loadImg(maskUrl),0,0,W,H);
    const md=mx.getImageData(0,0,W,H).data; let bx0=W,by0=H,bx1=0,by1=0; for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(md[(y*W+x)*4]>127){ if(x<bx0)bx0=x; if(x>bx1)bx1=x; if(y<by0)by0=y; if(y>by1)by1=y; }
    if(bx1<bx0) throw {code:'mask_empty',message:'얼굴 범위가 비어 있어요'};
    const pad=Math.max(48,Math.round(0.45*Math.max(bx1-bx0,by1-by0))), x0=Math.max(0,Math.floor((bx0-pad)/8)*8), y0=Math.max(0,Math.floor((by0-pad)/8)*8), x1=Math.min(W,Math.ceil((bx1+pad)/8)*8), y1=Math.min(H,Math.ceil((by1+pad)/8)*8), cw=x1-x0, ch=y1-y0;
    const sc=Math.min(4,Math.sqrt(1048576/(cw*ch))), tw=Math.max(256,Math.floor(cw*sc/64)*64), th=Math.max(256,Math.floor(ch*sc/64)*64);
    const I=cv(tw,th), ix=I.getContext('2d'); ix.fillStyle='#fff'; ix.fillRect(0,0,tw,th); ix.drawImage(o,x0,y0,cw,ch,0,0,tw,th);
    const K=cv(tw,th), kx=K.getContext('2d'); kx.imageSmoothingEnabled=false; kx.drawImage(M,x0,y0,cw,ch,0,0,tw,th);
    const kd=kx.getImageData(0,0,tw,th), BW=Math.ceil(tw/8), on=new Uint8Array(BW*Math.ceil(th/8)); for(let y=0;y<th;y++) for(let x=0;x<tw;x++) if(kd.data[(y*tw+x)*4]>127) on[(y>>3)*BW+(x>>3)]=1;
    for(let y=0;y<th;y++) for(let x=0;x<tw;x++){ const i=(y*tw+x)*4, v=on[(y>>3)*BW+(x>>3)]?255:0; kd.data[i]=kd.data[i+1]=kd.data[i+2]=v; kd.data[i+3]=255; } kx.putImageData(kd,0,0);
    const res=await draw(I.toDataURL('image/png').split(',')[1],K.toDataURL('image/png').split(',')[1],tw,th), ru=URL.createObjectURL(res);
    try{ const r=await Characters.loadImg(ru), f=cw/tw;
      // 칠한 곳을 조금 넓히고(팽창) 가장자리를 흐려서 이음매가 안 보이게
      const D=cv(W,H), dx=D.getContext('2d'); dx.filter=`blur(${Math.max(2,Math.round(16*f))}px)`; dx.drawImage(M,0,0); dx.filter='none'; const dd=dx.getImageData(0,0,W,H); for(let i=0;i<dd.data.length;i+=4){ const v=dd.data[i]>8?255:0; dd.data[i]=dd.data[i+1]=dd.data[i+2]=v; dd.data[i+3]=255; } dx.putImageData(dd,0,0);
      const Fm=cv(W,H), fx=Fm.getContext('2d'); fx.fillStyle='#000'; fx.fillRect(0,0,W,H); fx.save(); fx.beginPath(); fx.rect(x0,y0,cw,ch); fx.clip(); fx.filter=`blur(${Math.max(2,Math.round(10*f))}px)`; fx.drawImage(D,0,0); fx.restore();
      const A=cv(W,H), ax=A.getContext('2d'); ax.drawImage(o,0,0,W,H); const B=cv(W,H), bx=B.getContext('2d'); bx.drawImage(r,0,0,tw,th,x0,y0,cw,ch);
      const ad=ax.getImageData(0,0,W,H), bd=bx.getImageData(0,0,W,H).data, fd=fx.getImageData(0,0,W,H).data;
      for(let i=0;i<ad.data.length;i+=4){ const k=fd[i]/255; if(k<=0.002) continue; ad.data[i]=ad.data[i]*(1-k)+bd[i]*k; ad.data[i+1]=ad.data[i+1]*(1-k)+bd[i+1]*k; ad.data[i+2]=ad.data[i+2]*(1-k)+bd[i+2]*k; }
      ax.putImageData(ad,0,0); return await new Promise(res2=>A.toBlob(res2,'image/png')); }
    finally{ URL.revokeObjectURL(ru); } }

  static faceUpperObj(c,F){ return F===c?(c.upper&&Characters.imgSrc(c.upper)?c.upper:null):(F.upper&&Characters.imgSrc(F.upper)?F.upper:null); }

  static imageCandidateAbort(){return Object.assign(new Error('이미지 생성을 취소했어요.'),{code:'image_cancelled',name:'AbortError'});}

    // Only explicitly requested manual generation offers candidates; automatic/batch work stays single.
static imageCandidateEligible(kind,target,owner,mode='manual'){
   if(mode!=='manual')return false;
   if(kind==='enemy')return true;
   if(typeof G==='undefined'||!G)return false;
   const c=owner||(kind==='char'?target:null);
   const character=(G.chars||[]).includes(c),npc=(G.npcs||[]).includes(c);
   return character&&['char','upper','illust','lbcg','scg','pose','lbbg','weapon','face'].includes(kind)||npc&&['char','upper','face'].includes(kind);
  }

  static npcNew(name){ const id='npc_'+uid(); return {id,npc:true,name,role:'',profile:'',speech:'',look:'',naiPrompt:'',img:null,faces:[],skins:[],lines:[],touch:{head:[],body:[]},affLines:{},upper:{id:'up_'+id,kind:'upper',name:name+' 상반신',prompt:'',img:null}}; }

    /* 중요한 NPC 자동 추가: 대본에 대사가 3줄 이상인데 ${'캐릭터'}·NPC가 아닌 인물을 NPC로 만들고 그림 프롬프트를 써요(그림 목록에 들어가요) */
static async autoNpcs(chs,rep){ if(!SAMPLE) return 0; const cnt={}; const skip=n=>!n||isMe(n)||Characters.findSpeaker(n)||Characters.npcBy(n)||Art.enemyLib(n)||/^(나레이션|내레이션|해설|모두|일동|\?\?\?|목소리|소리|방송|안내)$/.test(n);
    (chs||[]).forEach(ch=>(ch.stages||[]).forEach(st=>[st.pre,st.post].forEach(t=>System.parseScript(t||'').forEach(L=>{ if(L.type==='say'&&!skip(L.who)) cnt[L.who]=(cnt[L.who]||0)+1; }))));
    const names=Object.entries(cnt).filter(([,n])=>n>=3).sort((a,b)=>b[1]-a[1]).map(x=>x[0]).slice(0,6); if(!names.length) return 0;
    const lines=n=>{ const out=[]; (chs||[]).forEach(ch=>(ch.stages||[]).forEach(st=>[st.pre,st.post].forEach(t=>System.parseScript(t||'').forEach(L=>{ if(L.type==='say'&&L.who===n&&out.length<4) out.push(L.text); })))); return out.join(' / '); };
    const r=await Core.aiJSON(World.autoNpcsPrompt({names,lines}),rep||null,'quick');
    let n=0; (r&&Array.isArray(r.npcs)?r.npcs:[]).forEach(x=>{ const nm=String((x&&x.name)||'').trim(); if(!names.includes(nm)||Characters.npcBy(nm)) return; const o=Characters.npcNew(nm); Object.assign(o,{role:String(x.role||''),look:String(x.look||''),naiPrompt:stripMinor(Core.stripAge(String(x.naiPrompt||'')))}); G.npcs=G.npcs||[]; G.npcs.push(o); n++; }); if(n) Core.mark('meta'); return n; }

  static castChars(){ return [...G.chars.filter(c=>c.naiPrompt&&!(c.alt)),...(G.npcs||[]).filter(n=>n.naiPrompt)]; }

  static async regenApply(){const R=REGEN;if(!R||R.busy)return;const c=charById(R.cid);if(!c)return;try{Characters.regenAssertCurrent(R);CharactersView.regenReadPreview(R);}catch(e){CoreView.toast(e.message);return;}R.busy=true;R.controller=new AbortController();
   const status=t=>CoreView.say('#regen-apply-status',t);CharactersView.regenButtonsLock(true);
   try{const nc=R.nc,S=R.sel;let report=R.report;
    if(S.skill){status('선택한 스킬의 최종 유효성과 성능을 확인하는 중…');const errors=GGMCombat.validate(nc.skills);if(errors.length)throw new Error(errors.join(' '));const result=await v2Job('inspectSkill',[v2CharacterInput(nc),{...v2Options(),referenceSlot:R.slot}],{signal:R.controller.signal});v2CheckCancelled(R.controller.signal);if(REGEN!==R)return;if(result.report.status==='strong')throw new Error('세대 기준보다 강해졌어요. 다시 생성하거나 스킬 편집기에서 조정해 주세요.');report=result.report;}
    Characters.regenAssertCurrent(R);if(REGEN!==R)return;R.committing=true;const old=c.name,oldWeapon=c.weapon,base=clone(v2Ensure(c)),cleanup=[];
    if(S.name){c.name=nc.name;if(c.name!==old)Acquire.renameEverywhere(old,c.name);c.faction=nc.faction;const F=G.world.factions=G.world.factions||[];if(c.faction&&!F.some(x=>x.name===c.faction)){F.push({name:c.faction,desc:c.name+'의 소속'});Core.mark('world');}}
    if(S.profile)for(const k of ['profile','intro','files'])if(nc[k]!==undefined)c[k]=clone(nc[k]);
    if(S.look&&nc.naiPrompt!==c.naiPrompt){c.naiPrompt=stripMinor(Core.stripAge(nc.naiPrompt));if(nc.naiBlocks?.naiPrompt)c.naiBlocks={...c.naiBlocks,naiPrompt:clone(nc.naiBlocks.naiPrompt)};for(const o of [c,c.upper,c.illust,c.lbcg,c.pose,c.lbbg,c.scg,...(c.faces||[]),...(c.faces||[]).map(f=>f.up)])if(o&&o.img)cleanup.push(Characters.imgClear(o));delete c.faceMask;Art.charCGs(c).forEach(l=>{if(l.img){l.redraw=true;Core.mark('l:'+l.id);}});}
    if(S.weapon){if(oldWeapon?.img)cleanup.push(Characters.imgClear(oldWeapon));c.weapon={...oldWeapon,name:nc.weapon.name,desc:nc.weapon.desc,prompt:nc.weapon.prompt,id:'w_'+c.id,img:null};delete c.weapon.seed;const ow=oldWeapon?.name||'',nw=nc.weapon.name;if(Characters.weaponRenameOk(ow,nw))Acquire.renameEverywhere(ow,nw);}
    if(S.skill){c.skills={...base,[R.slot]:clone(nc.skills[R.slot])};c.skillConcept=nc.skillConcept||c.skillConcept||'';Characters.regenKeepPlan(c,nc);c.skillTuning='manual';v2EquipmentSkillSaved(c,R.slot,base[R.slot],c.skills[R.slot],true);c.skillDesignLog=clone(R.history);if(R.fallback)c.skillGenerationWarning='검사한 복구 초안을 사용 중입니다.';else delete c.skillGenerationWarning;delete c.skillGenerationNotice;c.skillBalance={...report,fingerprint:v2Fingerprint(c)};}
    if(S.lines)for(const k of ['lines','affLines','lvLines','dupLines','touch'])if(nc[k]!==undefined)c[k]=clone(nc[k]);
    v2SyncEquipment(c);Core.mark('c:'+c.id);await Promise.allSettled(cleanup);if(REGEN!==R||Core.PJ().active!==R.project)return;REGEN=null;CoreView.closeModal();Challenge.render();CharactersCtl.openChar(c.id);CoreView.toast('선택한 항목을 적용했어요. 강화 단계는 유지돼요.');
   }catch(e){if(REGEN===R){status(e.name==='AbortError'?'적용을 중단했어요.':e.message);CoreView.toast(e.message);}}
   finally{R.busy=false;R.committing=false;if(REGEN===R)CharactersView.regenButtonsLock(false);}
  }

  static async handleImagesAndAssetsAction(a,t,id,p,e){
    switch(a){
  case 'castre': { if(!CAST) break; const k=t.dataset.k; if(!CAST.q.some(x=>x.c===id&&x.k===k)&&!(CAST.busy&&CAST.busy.c===id&&CAST.busy.k===k)) CAST.q.push({c:id,k}); CharactersView.castRefresh(id); CoreCtl.castRun(); break; }
  case 'castfaces': CharactersView.openCastFaces(); break;
  case 'cfsel': { const set=t.dataset.k==='f'?CFSEL.faces:CFSEL.chars, v=t.dataset.v; set.has(v)?set.delete(v):set.add(v); CoreView.chipOn(t,set.has(v)); break; }
  case 'cfgo': CharactersView.castFacesGo(); break;
  case 'cfall': { const on=t.dataset.v==='1'; Characters.castChars().filter(c=>!c.npc&&Characters.imgSrc(c)).forEach(c=>on?CFSEL.chars.add(c.id):CFSEL.chars.delete(c.id)); CharactersView.castCharChipsShow(on); break; }
  case 'castface': { if(CAST&&CAST.busy){ CoreView.toast('그리는 중이 끝나면 열 수 있어요'); break; } FACET={cid:id,sid:''}; CharactersView.openFaces(id); break; }
  case 'castok': case 'castskip': { if(a==='castok'&&CAST&&(CAST.busy||CAST.q.length)&&!(await appConfirm('아직 그리는 그림이 있어요. 나머지는 게임하면서 그릴까요?'))) break; P().castDone=1; Core.mark('prog'); if(CAST) CAST.q=[];
        const go=()=>{ if(CAST&&CAST.busy){ CoreView.say('#castStat','지금 그리는 한 장만 마치고 넘어가요…'); return setTimeout(go,500); } CAST=null; ArtView.showStart(); }; go(); break; }
  case 'imgsave': { const c=charById(id), it=c&&Core.charImgList(c).find(([o])=>o.id===t.dataset.o); if(it) Core.saveImgUrl(Art.imgSrcRaw(it[0]),c.name+'_'+it[1]); break; }
  case 'posegen': { const c=charById(id); if(!c||!c.pose||!c.lbbg) break; if(!Core.imgReady()){ CoreView.toast(Core.imgNeed()); break; } const w=t.dataset.w||'both'; if(w!=='bg'&&!c.naiPrompt){ CoreView.toast('먼저 NAI 프롬프트를 채워 주세요'); break; }
        const sc=$('#lbbg_scene'); if(sc){ c.lbbg.prompt=sc.value.trim();CoreView.naiBlocksSave(c.lbbg,'prompt',sc); Core.mark('c:'+c.id); } const done=CoreView.busy(t,'그리는 중…');
        try{ if(w!=='pose'){ CoreView.toast('배경을 그리는 중이에요'); const b=await Core.naiDrawItem({k:'lbbg',o:c.lbbg,c,generationMode:'manual'}); await Art.storeImage(c.lbbg,b,''); }
          if(w!=='bg'){ CoreView.toast('투명 포즈를 그리는 중이에요'); const b=await Core.naiDrawItem({k:'pose',o:c.pose,c,generationMode:'manual'}); await Art.storeImage(c.pose,b,''); }
          Core.mark('c:'+c.id); if(P().lobbyMode==='stand'){ P().lobbyMode='auto'; Core.mark('prog'); CoreView.toast('로비 표시를 \'자동\'으로 바꿨어요(레이어가 먼저 나와요)'); } else CoreView.toast('로비 레이어를 그렸어요'); CharactersCtl.openChar(c.id); Challenge.render(); }
        catch(err){ CoreView.toast(Core.naiErr(err,'그리기 실패')); done(); } break; }
  case 'posedel': { if(System.playMode())break;const c=charById(id); if(!c||!c.pose) break; if(!(await appConfirm('포즈 그림을 지우고 상반신으로 표시할까요? 배경은 유지돼요.'))) break; await Characters.imgClear(c.pose); Core.mark('c:'+c.id); CharactersCtl.openChar(c.id); Challenge.render(); break; }
  case 'upload': uploadFor={kind:t.dataset.k,id}; $('#file').click(); break;
  case 'imgx': { const k=t.dataset.k, {o,what,after}=CharactersView.imgTarget(k,id,t);
        if(!o||!o.img) break; if(!(await appConfirm(`${what||'그림'}을(를) 지울까요? (항목은 남아요)`))) break;
        await Characters.imgClear(o); if(k==='char'){ (o.faces||[]).forEach(f=>{ if(f.img&&f.auto) Characters.imgClear(f); }); delete o.faceMask; Core.mark('c:'+id); } else if(k==='lib') Core.mark('l:'+id); else if(k==='skinpart'||k==='weapon') Core.mark('c:'+id); else Core.mark('meta');
        after(); CoreView.toast('그림을 지웠어요'); break; }
  case 'npcscan': { const snap=Core.artSnap(); const n=await Characters.autoNpcs(G.chapters,CoreView.uiProg(t)); if(n){ CharactersView.openNpcs(); CoreView.toast(`NPC ${n}명을 추가했어요`); CoreView.artAfterAI(snap,'NPC '+n+'명'); } else CoreView.toast('새로 추가할 인물이 없어요(대사 3줄 이상인 조연만 찾아요)'); break; }
  case 'npcopen': CharactersView.openNpcs(); break;
  case 'npcsave': { const n=(G.npcs||[]).find(x=>x.id===id); if(!n) break; const old=CoreCtl.npcRead(n); if(old&&old!==n.name&&old.length>=2&&(await appConfirm(`이름이 「${old}」에서 「${n.name}」(으)로 바뀌어요. 스토리·${System.T('talk')}에 나온 「${old}」도 모두 바꿀까요?`))){ const c=Acquire.renameEverywhere(old,n.name); CoreView.toast(`이름을 ${c}곳에서 바꿨어요`); } else CoreView.toast('저장했어요'); CharactersView.npcRefresh(id); break; }
  case 'npcdraw': { const n=(G.npcs||[]).find(x=>x.id===id); if(!n||NPCBUSY.has(id)) break; CoreCtl.npcRead(n); CharactersCtl.npcDraw(n,t.dataset.k==='upper'?'upper':'char'); break; }
  case 'npctags': { const n=(G.npcs||[]).find(x=>x.id===id); if(!n) break; CoreCtl.npcRead(n); if(!String(n.look||n.profile||'').trim()){ CoreView.toast('외모를 먼저 적어 주세요'); break; }
        const r=await Core.aiJSON(World.npctagsPrompt({n}),CoreView.uiProg(t),'quick');
        if(r&&r.naiPrompt){ n.naiPrompt=Characters.allyTags(stripMinor(Core.stripAge(String(r.naiPrompt)))); Core.mark('meta'); CharactersView.npcRefresh(id); CoreView.toast('태그를 썼어요. 확인하고 다시 그려 보세요'); } break; }
  case 'npcdel': { const n=(G.npcs||[]).find(x=>x.id===id); if(!n||!(await appConfirm(`NPC 「${n.name}」을(를) 지울까요? 스토리에는 이름만 나와요.`))) break; G.npcs=G.npcs.filter(npc=>npc!==n); Core.mark('meta'); CharactersView.openNpcs(); break; }
  case 'npcadd': { const nm=($('#npc_new').value||'').trim(); if(!nm){ CoreView.toast('이름을 적어 주세요'); break; } if(Characters.npcBy(nm)||Characters.findSpeaker(nm)){ CoreView.toast('이미 있는 이름이에요'); break; } G.npcs=G.npcs||[]; G.npcs.push(Characters.npcNew(nm)); Core.mark('meta'); CharactersView.openNpcs(); break; }
  case 'cutclose': { Characters.stopVoice(); CharactersView.gachaCutHide(t); const f=GC&&GC.cutCb; if(GC) GC.cutCb=null; f&&f(); break; }
  case 'lib': ArtView.openLib(t.dataset.k); break;
  case 'libitem': CharactersView.openLibItem(id); break;
  case 'libnew': CharactersView.openLibItem(null,t.dataset.k); break;
  case 'castt': CoreView.chipOn(t,!CharactersView.chipIsOn(t)); break;
  case 'naiopen': ArtView.openNaiSet(); break;
  case 'naivariety': ArtView.switchFlip(t); break;
  case 'naipreset': ArtView.applyStylePreset(t.dataset.v); break;
  case 'packopen': CoreView.openModal(ArtView.packHTML()); break;
  case 'packuse': { const p=Core.allPresets().concat(Core.userPacks()).find(x=>x.id===t.dataset.v); if(!p) break; Art.packApply(p); CoreView.toast(`「${p.name}」 그림체를 적용했어요`); CoreView.openModal(ArtView.packHTML()); break; }
  case 'packdel': { const a=Core.userPacks(), p=a.find(x=>x.id===t.dataset.v); if(!p||!(await appConfirm(`「${p.name}」 프리셋을 지울까요?`))) break; Core.saveUserPacks(a.filter(x=>x!==p)); CoreView.openModal(ArtView.packHTML()); break; }
  case 'packcopy': { const p=Core.userPacks().find(x=>x.id===t.dataset.v); if(!p) break; const code=packCode(Object.assign({},p,{id:undefined})); try{ await navigator.clipboard.writeText(code); CoreView.toast('프리셋 코드를 복사했어요. 붙여 넣어 공유하세요'); }catch(e){ if(t.isConnected)CharactersView.openPresetCode('pack',code); } break; }
  case 'packimport': CharactersView.openPresetCode('pack'); break;
  case 'packsave': { const nm=prompt('프리셋 이름'); if(!nm) break; const by=prompt('만든 사람 (선택, 공유할 때 표시돼요)')||''; const c=Core.naiCfg(), el=(c.styles||[]).find(x=>x.id===c.styleId)||(c.styles||[])[0]||{}, L=Core.llmSlots();
        const p={id:'u'+uid(),name:nm.trim().slice(0,30),by:by.trim().slice(0,20),desc:'내가 만든 팩',tags:Core.joinTags(el.tags,c.quality?c.qtags:''),neg:el.neg||'',qtags:'',steps:c.steps,scale:c.scale,cfgRescale:c.cfgRescale,sampler:c.sampler};
        const a=Core.userPacks(); a.unshift(p); if(Core.saveUserPacks(a)) CoreView.toast('프리셋으로 저장했어요. 내보내기로 코드를 공유할 수 있어요'); CoreView.openModal(ArtView.packHTML()); break; }
  case 'naisave': appStorage.setItem(NKEY,JSON.stringify(ArtView.readNai())); CoreView.closeModal(); Challenge.render(); CoreView.toast('그림 AI 설정을 저장했어요'); break;
  case 'cfload': { const inp=document.createElement('input'); inp.type='file'; inp.accept='.json,application/json'; inp.onchange=async()=>{ const f=inp.files[0]; if(!f) return; const tx=await f.text(); const box=$('#cf_wf')||$('#sw_cfwf'); if(box) box.value=tx; try{ const j=JSON.parse(tx); CoreView.toast(Array.isArray(j.nodes)?'UI 형식이에요. Export (API)로 저장한 파일을 넣어 주세요':'워크플로를 불러왔어요 (노드 '+Object.keys(j).length+'개)'); }catch(e){ CoreView.toast('JSON 파일이 아니에요'); } }; inp.click(); break; }
  case 'cftest': { const u=(($('#cf_url')||$('#sw_cfurl'))||{}).value; if(!u){CoreView.toast('주소를 넣어 주세요');break;} const done=CoreView.busy(t);
        try{ const r=await System.http(u.trim().replace(/\/+$/,'')+'/system_stats',{timeout:10000}); const j=Characters.okJSON(r); const d=(j.devices||[])[0]; CoreView.toast('ComfyUI 연결 성공'+(d?' · '+String(d.name||'').slice(0,40):'')); CoreView.say('#sw_res','✓ 연결됨'); }
        catch(e){ CoreView.toast('연결 실패. PC에서 --listen으로 켰는지, 주소와 와이파이를 확인해 주세요'); CoreView.say('#sw_res','✗ 연결 실패'); } finally{ done(); } break; }
  case 'naitest': { const c=ArtView.readNai(); if(!c.key){CoreView.toast('토큰을 넣어 주세요');break;} const done=CoreView.busy(t);
        try{ const r=await System.http(Art.naiBase(c)+'/user/subscription',{headers:NAI_HDR(c.key),timeout:20000}); const j=Characters.okJSON(r); const sl=j.trainingStepsLeft||{}; const an=(sl.fixedTrainingStepsLeft||0)+(sl.purchasedTrainingSteps||0);
          CoreView.toast(`연결 성공. ${['Paper','Tablet','Scroll','Opus'][j.tier]||'구독'} · Anlas ${an}`); }catch(e){ CoreView.toast(Core.naiErr(e,'연결 확인 실패')); } finally{ done(); } break; }
  case 'skinuse': {const c=charById(id),o=Characters.own(id);if(!c||!o)break;const sk=t.dataset.s;if(sk){const k=(c.skins||[]).find(x=>x.id===sk);if(!k)break;if(!skinHave(k)){CoreView.toast(`캐시 상점의 ${System.T('skin')} 패키지에서 살 수 있어요`);break;}
   if(!Core.skinDisplayReady(c,k)){if(SKJOB?.skinId===k.id){CoreView.toast('이 스킨의 그림을 준비 중이에요. 완료 후 입혀 주세요');break;}if(c.useStanding!==false||!k.prompt||!Core.imgReady()){CoreView.toast(c.useStanding===false?'이 스킨의 상반신 그림이 필요해요. 스킨 편집에서 상반신을 넣거나 그림 AI를 연결해 주세요.':'아직 그려지지 않은 스킨이에요');break;}
   if(!(await appConfirm('이 스킨은 상반신 그림이 없어 기본 모습으로 표시되고 있어요. 그림 AI로 스킨 상반신을 생성한 뒤 입힐까요? 이미지 생성 비용이 발생할 수 있어요.')))break;
   const game=G,project=Core.PJ().active,done=CoreView.busy(t);try{const blob=await CoreCtl.skinPartDraw(c,k,'upper','manual');if(G!==game||Core.PJ().active!==project||charById(id)!==c||!c.skins.includes(k))throw Error('대상이 바뀌어 스킨 적용을 중단했습니다');await Art.storeImage(Characters.skinPart(k,'upper'),blob,'');Core.mark('c:'+id);}catch(err){CoreView.toast(Core.naiErr(err));break;}finally{done();}
   }}o.skin=sk;Core.mark('prog');CharactersCtl.openChar(id);Challenge.render();break;}
  
  case 'faceview': { const c=charById(id), f=c.faces.find(x=>x.id===t.dataset.f); CharactersView.openFaceView(c,f); break; }
  case 'faces-open': FACESEL=new Set(); CharactersView.openFaces(id,t.dataset.s||''); break;
  case 'facesel': { const v=t.dataset.v; FACESEL.has(v)?FACESEL.delete(v):FACESEL.add(v); CoreView.chipOn(t,FACESEL.has(v)); break; }
  case 'faceup': uploadFor={kind:'face',id,name:t.dataset.v,b:t.dataset.b||''}; $('#file').click(); break;
  case 'faceupnew': { const nm=($('#fc_new').value||'').trim().slice(0,12); if(!nm){CoreView.toast('표정 이름을 적어 주세요');break;} uploadFor={kind:'face',id,name:nm}; $('#file').click(); break; }
  case 'faceupmany': uploadFor={kind:'faces',id}; $('#filesm').click(); break;
  case 'facedel': { const c=charById(id); if(!c) break; if(t.dataset.f){ c.faces=c.faces.filter(x=>x.id!==t.dataset.f); Core.mark('c:'+id); CharactersCtl.openChar(id); break; } const F=Characters.faceTgt(c); F.faces=F.faces.filter(f=>f.name!==t.dataset.v); Core.mark('c:'+c.id); CharactersView.openFaces(id); break; }
  case 'facetgt': CharactersView.openFaces(id,t.dataset.s||''); break;
  case 'facebasic': FACE_BASIC.forEach(v=>FACESEL.add(v)); CharactersView.faceChipsShow(); break;
  case 'facemask': { const c=charById(id); if(!c) break; const F=Characters.faceTgt(c), b=t.dataset.b, o=b==='up'?Characters.faceUpperObj(c,F):F; if(!o||!Art.imgSrcRaw(o))break;CharactersView.faceOptRead();
        CharactersView.openMaskPainter(Art.imgSrcRaw(o),(F.faceMask||{})[b],url=>{ F.faceMask=Object.assign({},F.faceMask||{},{[b]:url}); Core.mark('c:'+c.id); CoreView.toast('얼굴 범위를 저장했어요'); CharactersView.openFaces(id); }); break; }
  case 'facego': { const c=charById(id), list=[...FACESEL]; if(!c) break; const F=Characters.faceTgt(c); if(!Art.imgSrcRaw(F)&&!Characters.faceUpperObj(c,F)){CoreView.toast('먼저 전신이나 상반신 그림이 있어야 해요');break;} if(!list.length){CoreView.toast('표정을 골라 주세요');break;} if(!Core.naiCfg().key){CoreView.toast('설정의 그림 AI에 NovelAI 토큰을 넣어 주세요');break;}
        CharactersView.faceOptRead(); const O=FACEOPT, x=$('#fc_x').value.trim(), basePr=F===c?c.naiPrompt:(F.prompt||c.naiPrompt), upO=Characters.faceUpperObj(c,F);
        const bodies=(O.body==='both'?['full','up']:[O.body]).filter(b=>b==='full'?Art.imgSrcRaw(F):upO);
        if(!bodies.length){ CoreView.toast('상반신 그림이 없어요. 대원 화면 → 외형에서 상반신을 먼저 그리거나 올려 주세요'); break; }
        if(O.body==='both'&&!Art.imgSrcRaw(F))CoreView.toast('전신 그림이 없어 상반신 표정만 그려요');
        if(O.body==='both'&&!upO)CoreView.toast('상반신 그림이 없어서 전신 표정만 그려요. 상반신 표정은 외형에서 상반신을 먼저 만든 뒤 그려요');
        if(O.m==='inpaint'){ const miss=bodies.filter(b=>!(F.faceMask||{})[b]); if(miss.length){ CoreView.toast(`먼저 ${miss.map(b=>b==='up'?'상반신':'전신').join('·')}에 얼굴 범위를 칠해 주세요`); break; } }
        if(O.m==='raw'&&!/^nai-diffusion-5/.test(O.model)){ CoreView.toast('감정을 넣어 새로 그리기는 V5 모델만 돼요'); break; }
        const done=CoreView.busy(t); let n=0; const tot=list.length*bodies.length;
        for(const ko of list){
          let f=F.faces.find(q=>q.name===ko); if(!f){ f={id:'f'+uid(),name:ko,img:null}; F.faces.push(f); }
          for(const b of bodies){ CoreView.say('#fc_stat',`${n}/${tot} · ${ko} (${b==='up'?'상반신':'전신'}) 그리는 중…`);
            try{ await Core.faceDrawOne(c,F,f,ko,b,O,x,tot===1?'manual':'batch'); n++; }
            catch(err){ CoreView.toast(Core.naiErr(err)); done(); CharactersView.openFaces(id); return; } } }
        CoreView.toast(`표정 그림 ${n}장을 만들었어요`); CharactersView.openFaces(id); break; }
  case 'skinpromptsave': {const c=charById(id),k=c?.skins?.find(k=>k.id===t.dataset.s);if(k){CoreView.naiBlocksSave(k,'prompt','skin_prompt_'+k.id);Core.mark('c:'+c.id);CoreView.toast('프롬프트를 저장했어요. 이후 생성부터 적용돼요.');}break;}
  case 'skin-open': CharactersView.openSkin(id); break;
  case 'skinlines': { const c=charById(id), k=c&&(c.skins||[]).find(x=>x.id===t.dataset.s); if(!k) break; if(!SAMPLE){ CoreView.toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); break; }
        const r=await Core.aiJSON(Characters.skinlinesPrompt({c,k}),CoreView.uiProg(t),'quick');
        if(r&&Array.isArray(r.lines)){ k.lines=r.lines.map(x=>String(x||'').trim()).filter(Boolean).slice(0,8); if(r.intro) k.intro=String(r.intro).slice(0,120); Core.mark('c:'+c.id); CoreView.toast(`「${k.name}」 대사 ${k.lines.length}개를 썼어요`); CharactersCtl.skinRefresh(id); } break; }
  case 'skpartgen': { const c=charById(id), k=c&&(c.skins||[]).find(x=>x.id===t.dataset.s); if(k) CharactersCtl.skinPartGen(c,k,[t.dataset.x],CoreView.uiProg(t)); break; }
  case 'skpartall': { const c=charById(id), k=c&&(c.skins||[]).find(x=>x.id===t.dataset.s); if(!k) break; const xs=['stand','upper','illust','lbcg'].filter(x=>!Art.imgSrcRaw(x==='stand'?k:k[x])); if(!xs.length){ CoreView.toast('네 칸 모두 그림이 있어요'); break; } CharactersCtl.skinPartGen(c,k,xs,CoreView.uiProg(t),'batch'); break; }
  case 'skpartup': uploadFor={kind:'skinpart',id,s:t.dataset.s,x:t.dataset.x}; $('#file').click(); break;
  case 'skingo': { const c=charById(id), pr=$('#sk_prompt').value.trim(), nm=$('#sk_name').value.trim()||'새 '+System.T('skin'); if(!pr){CoreView.toast('프롬프트를 채워 주세요');break;} if(!Core.imgReady()){CoreView.toast(Core.imgNeed());break;}
        if(SKPROP&&SKPROP.url) URL.revokeObjectURL(SKPROP.url);
        SKPROP={cid:id,name:nm,prompt:pr,naiBlocks:{prompt:CharactersView.naiBlocksFieldParts('sk_prompt')},idea:$('#sk_idea').value.trim(),pose:$('#sk_pose')?$('#sk_pose').value:'',ref:{on:!!(Characters.imgSrc(c)&&$('#sk_ref')&&$('#sk_ref').checked),style:$('#sk_style').value==='1',str:+$('#sk_str').value,fid:+$('#sk_fid').value},blob:null,url:null};
        CoreCtl.skinPropDraw(CoreView.uiProg(t)); break; }
  case 'skindel': { const c=charById(id); c.skins=c.skins.filter(k=>k.id!==t.dataset.s); Object.values(P().owned).forEach(o=>{if(o.skin===t.dataset.s)o.skin='';}); Core.mark('c:'+id,'prog'); CharactersCtl.skinRefresh(id); break; }
  case 'wnai': { const c=charById(id); if(!c) break; const pr=($('#f_wp')?$('#f_wp').value:'').trim(); if(pr&&pr!==String(c.weapon.prompt||'')){ c.weapon.prompt=pr; Core.mark('c:'+id); } if(!String(c.weapon.prompt||'').trim()){CoreView.toast(System.T('weapon')+' 프롬프트를 채워 주세요');break;} CoreView.openNaiPrep('weapon',id); break; }
  case 'imglib': CharactersView.openImgLib(id); break;
  case 'ilbtap': { if(!IMGLIB) break; const i=+t.dataset.i, its=Characters.charImgItems(charById(IMGLIB.cid)), it=its[i]; if(!it) break; const k=IMGLIB.sel.indexOf(i); if(k>=0) IMGLIB.sel.splice(k,1); else { IMGLIB.sel.push(i); if(IMGLIB.sel.length>2) IMGLIB.sel.shift(); }
        if(IMGLIB.sel.length===1&&k<0&&Art.imgSrcRaw(it.o))CoreView.imgViewer(Art.imgSrcRaw(it.o)); CharactersView.openImgLib(IMGLIB.cid); break; }
  case 'ilbclear': if(IMGLIB){ IMGLIB.sel=[]; CharactersView.openImgLib(IMGLIB.cid); } break;
  case 'ilbdel': { if(!IMGLIB) break; const c=charById(IMGLIB.cid), it=Characters.charImgItems(c).find(x=>x.o.id===t.dataset.imageId); if(!it||!it.o.img||!(await appConfirm(`${it.label} 그림을 지울까요? (항목은 남아요)`))) break; await Characters.imgClear(it.o); if(it.k==='stand') delete c.faceMask; IMGLIB.sel=[]; Core.mark('c:'+c.id); Challenge.render(); CharactersView.openImgLib(c.id); CoreView.toast('그림을 지웠어요'); break; }
  case 'bgmall': ArtView.openBgmAll(); break;
  case 'bgmpick': CoreView.chipOn(t,!CharactersView.chipIsOn(t)); break;
  case 'bgmpickall': CoreView.bgmPickShow(t.dataset.v); break;
  case 'bgmallgo': ArtCtl.bgmAllGo([...document.querySelectorAll('#modal [data-act="bgmpick"].on')].map(b=>b.dataset.id)); break;
  case 'bgmplay': { const l=libById(id); if(l) ArtView.bgm(l.name,true); break; }
  case 'bgmstop': Core.bgmFade(0,()=>{BGM.el.pause();BGM.name=null;}); break;
  case 'aupload': uploadAudioFor=id; $('#afile').click(); break;
  case 'naigen': CoreView.openNaiPrep(t.dataset.k,id); break;
  case 'cutopen': CharactersView.openCut(t.dataset.k,id); break;
  case 'cutrun': { const j=CUTJOB; if(!j||!j.orig) break; const done=CoreView.busy(t), o={tol:+$('#ct_tol').value,soft:+$('#ct_soft').value,holes:$('#ct_holes').checked,despeck:$('#ct_spk').checked,shadow:$('#ct_shadow').checked};
        try{ const src=await new Promise(r=>j.orig.toBlob(r,'image/png')); const b2=await Core.cutoutWhite(src,o); await CharactersView.cutLoadBlob(b2); j.opt=o; CoreView.toast('자동으로 지웠어요. 남은 곳은 스포이드나 브러시로 마무리하세요'); }
        catch(e){ CoreView.toast('배경을 지우지 못했어요'); } done(); break; }
  case 'cutnai': { const j=CUTJOB; if(!j) break; if(!(await appConfirm('NovelAI 배경 제거는 Anlas를 써요 (생성 한 장의 약 3배). 진행할까요?'))) break;
        const done=CoreView.busy(t,'NovelAI가 배경을 지우는 중…');
        try{ const b2=await Core.naiBgRemove(j.src); await CharactersView.cutLoadBlob(b2); j.opt=null; }
        catch(e){ CoreView.toast(Core.naiErr(e,'배경 제거 실패')); } done(); break; }
  case 'cutzoom': { const j=CUTJOB; if(!j||!j.cv) break; j.zoom=CUT_ZOOMS[(CUT_ZOOMS.indexOf(j.zoom)+1)%CUT_ZOOMS.length]; CharactersView.cutZoomShow(t,j); break; }
  case 'cutundo': { const j=CUTJOB; if(!j||!j.undo.length) break; Characters.cutCtx().putImageData(j.undo.pop(),0,0); CharactersView.cutUndoShow(j); break; }
  case 'cutnudge': { const j=CUTJOB; if(!j||!j.cv) break; if(j.cx<0){ j.cx=j.W/2; j.cy=j.H/2; } j.cx=Math.max(0,Math.min(j.W-1,Math.round(j.cx)+(+t.dataset.dx))); j.cy=Math.max(0,Math.min(j.H-1,Math.round(j.cy)+(+t.dataset.dy))); CharactersView.cutPlaceCursor(); CharactersView.cutDrawLoupe(); break; }
  case 'cuthere': CharactersView.cutEraseHere(); break;
  case 'cutsave': { const j=CUTJOB; if(!j||!j.cv||!j.changed) break; const o=Core.naiTarget(j.kind,j.id); const blob=await Characters.cutBlob();
        if(j.opt&&$('#ct_def')&&$('#ct_def').checked){ let sv={}; try{sv=JSON.parse(appStorage.getItem(NKEY))||{};}catch(e){} sv.cut=j.opt; appStorage.setItem(NKEY,JSON.stringify(sv)); }
        if(ILK(j.kind)){ await Art.storeImage(o,blob,''); Core.mark('c:'+j.id); CUTJOB=null; Challenge.render(); CharactersCtl.openChar(j.id); CoreView.toast('저장했어요'); break; }
        await Art.storeImage(o,blob,j.kind==='char'?'c:':'l:'); CUTJOB=null; Challenge.render(); if(j.kind==='char') CharactersCtl.openChar(o.id); else CharactersView.openLibItem(o.id); CoreView.toast('배경을 지웠어요'); break; }
  case 'naigo': { if(!NPREP) break; const o=Core.naiTarget(NPREP.kind,NPREP.id); if(!o) break;
        const sz=($('#np_size').value.match(/(\d+)x(\d+)/)||[]).slice(1).map(Number);
        const custom={sceneReady:!!NPREP.sceneReady,sceneTags:NPREP.sceneTags,sceneStyle:$('#np_style').value,scenePose:$('#np_pose')?.value||'',sceneFrame:$('#np_frame')?.value||'',candidateEligible:!!NPREP.candidateEligible,promptParts:CharactersView.naiBlocksFieldParts('np_in'),input:$('#np_in').value.trim(),neg:$('#np_neg').value.trim(),seed:$('#np_seed').value.trim(),model:$('#np_model').value,size:sz.length===2?sz:undefined};
        if(NPREP.k==='cg'){ custom.chars=Core.cgCast(o).map((x,i)=>({id:x.c.id,name:x.c.name,prompt:$('#np_cc'+i)?$('#np_cc'+i).value.trim():Characters.charCaption(x.c,x.act),uc:'',pos:$('#np_cp'+i)?$('#np_cp'+i).value:x.pos})); }
        if($('#np_ref')&&$('#np_ref').checked) custom.ref={type:$('#np_rtype').value,strength:+$('#np_rstr').value,fidelity:+$('#np_rfid').value};
        if($('#np_i2i')&&$('#np_i2i').checked) custom.i2i={strength:+$('#np_istr').value,noise:+$('#np_inoise').value};
        if($('#np_keep')&&$('#np_keep').checked){
          o.naiStyle=$('#np_style').value;
          if(NPREP.k==='char'||ILK(NPREP.k)){ o.naiPose=$('#np_pose').value.trim(); o.naiFrame=$('#np_frame').value; Core.mark('c:'+NPREP.id); }
          else { (o.cast||[]).forEach(x=>{const ch=(custom.chars||[]).find(q=>q.id===x.id); if(ch) x.pos=ch.pos;}); Core.mark(NPREP.kind==='weapon'?'c:'+NPREP.id:'l:'+o.id); }
        }
        NPREP.custom=custom; CoreView.openNaiGen(NPREP.kind,NPREP.id,custom); break; }
  case 'naiagain': { const j=NAIJOB; if(!j) break; CoreView.openNaiGen(j.kind,j.id,Object.assign({},j.custom,{seed:'',candidateEligible:Characters.imageCandidateEligible(j.kind==='lib'?Core.naiTarget(j.kind,j.id)?.kind:j.kind,{img:{idb:true}},charById(j.id))})); break; }
  case 'naiedit': { const j=NAIJOB; if(!j) break; NLASTSEED[j.id]=j.seed; CoreView.openNaiPrep(j.kind,j.id); if(NPREP){NPREP.sceneReady=!!j.custom.sceneReady;NPREP.sceneTags=j.custom.sceneTags;if(j.custom.sceneTags){const owner=charById(j.id);NPREP.base=Core.joinTags(owner?.naiPrompt,Characters.designTags(owner),j.custom.sceneTags);}} if(NPREP)NPREP.candidateEligible=Characters.imageCandidateEligible(j.kind==='lib'?Core.naiTarget(j.kind,j.id)?.kind:j.kind,{img:{idb:true}},charById(j.id)); setTimeout(()=>{ if($('#np_in')){ CoreView.naiBlocksSeed('np_in',j.custom.promptParts?.combined===j.custom.input?j.custom.promptParts:{...Characters.naiBlocksSplit(j.custom.input),combined:j.custom.input}); $('#np_neg').value=j.custom.neg; if(j.custom.model&&$('#np_model')) $('#np_model').value=j.custom.model; (j.custom.chars||[]).forEach((x,i)=>{ if($('#np_cc'+i)) $('#np_cc'+i).value=x.prompt; if($('#np_cp'+i)) $('#np_cp'+i).value=x.pos; }); } },0); break; }
  case 'naiuse': { await CoreCtl.registerNaiJob(); break; }
  case 'naibatch': ArtView.naiBatch(t.dataset.k); break;
  case 'naistop': if(NAIBATCH){NAIBATCH.stop=true;CoreView.toast('지금 그리는 것까지만 하고 멈출게요');} break;
  case 'skinbuy': EconomyView.openSkinBuy(id); break;
  case 'skinpkgdel': { const f=Characters.skinShopList().find(x=>x.k.id===id); if(!f) break; if((P().skinOwn||{})[id]){ CoreView.toast('이미 산 '+System.T('skin')+'은 대원 화면에서 지워 주세요'); break; }
        if(!(await appConfirm(`${f.c.name} 「${f.k.name}」 패키지를 지울까요? 대원 화면의 🔒 ${System.T('skin')}도 함께 사라져요`))) break;
        f.c.skins=f.c.skins.filter(k=>k.id!==id); Object.values(P().owned).forEach(o=>{ if(o.skin===id) o.skin=''; }); const L=P().live; if(Array.isArray(L.skinRecent)&&!f.c.skins.some(k=>k.shop)) L.skinRecent=L.skinRecent.filter(x=>x!==f.c.id);
        Core.mark('c:'+f.c.id,'prog'); if(!$('#modal').hidden) CoreView.closeModal(); Challenge.render(); CoreView.toast(`「${f.k.name}」 패키지를 지웠어요`); break; }
  case 'skinnew': { if(!SAMPLE){ CoreView.toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); break; } CoreView.busy(t); const n=[]; let made=null; try{ made=await LiveOps.skinAuto(n); }finally{ LiveOpsView.liveBar(null); } CoreView.toast(n[0]||'만들지 못했어요. AI 기록을 확인해 주세요'); Challenge.render(); if(made&&made.k) EconomyView.openSkinBuy(made.k.id); break; }
    }
  }

  static stopVoice(){ voiceTok++; VOICE.onended=null; try{VOICE.pause();}catch(e){} }

  static async fishSearch(q,lang,n){
    const s=Core.SND(); if(!s.fishKey) throw {code:'fish_nokey'};
    const u=new URL('https://api.fish.audio/model'); u.searchParams.set('page_size',String(n||20)); u.searchParams.set('sort_by','score');
    if(q) u.searchParams.set('title',q); if(lang) u.searchParams.set('language',lang);
    const j=Characters.okJSON(await System.http(u.toString(),{headers:{Authorization:'Bearer '+s.fishKey},timeout:30000}));
    return (j.items||[]).filter(m=>!m.state||m.state==='trained');
  }

  static gameSlotsFix(g){ for(const k in GAME_SLOTS) Core.gameSlot(k,g); }

  static safeIds(g){
    const bad=new Map(), ok=v=>/^[\w-]{1,64}$/.test(v);
    const walk=o=>{ if(Array.isArray(o)) o.forEach(walk); else if(o&&typeof o==='object') for(const k of Object.keys(o)){ const v=o[k]; if(/^(id|charId|ch|value|eventId)$/.test(k)&&typeof v==='string'&&v&&!ok(v)&&!bad.has(v)) bad.set(v,'x'+Math.random().toString(36).slice(2,10)); walk(v); } };
    walk(g); if(!bad.size) return g;
    let s=JSON.stringify(g); bad.forEach((nv,ov)=>{ s=s.split(JSON.stringify(ov)).join(JSON.stringify(nv)); }); return JSON.parse(s);
  }

  static fix(g){
    const d=Core.defaults(); g=Characters.safeIds(g||{});
    const old=(g.ver||1)<VER;
    g.world=Object.assign(d.world,g.world||{});
    g.chars=Array.isArray(g.chars)?g.chars:d.chars;
    if(Characters.inheritAll(g)) g.__curveNew=true; // 이격 = 원본 + 수정치 (0065-inherit.js)
    g.chars.forEach(c=>{
      const dc=DEFAULT_CHARS.find(x=>x.id===c.id);
      c.episodes=Array.isArray(c.episodes)?c.episodes:[];
      if(old&&dc){ c.touch=c.touch||clone(dc.touch); c.intro=c.intro||dc.intro; c.episodes.forEach(e=>{const de=dc.episodes.find(x=>x.id===e.id); if(de) e.script=de.script;}); }
      c.episodes=Array.isArray(c.episodes)?c.episodes:[]; c.lines=Array.isArray(c.lines)?c.lines:[];
      c.touch=c.touch||{head:[],body:[]}; c.touch.head=c.touch.head||[]; c.touch.body=c.touch.body||[]; c.intro=c.intro||'';
      c.skill=c.skill||{name:'공격',kind:'dmg',power:1.5,cd:3,desc:''}; c.age=Math.max(20,c.age|0);
    });
    g.chapters=Array.isArray(g.chapters)?g.chapters:d.chapters;
    if(old){ const c1=g.chapters.find(ch=>ch.id==='c1'); if(c1){ const dc=d.chapters[0]; c1.stages.forEach(s=>{const ds=dc.stages.find(x=>x.id===s.id); if(ds){s.pre=ds.pre;s.post=ds.post;}}); } }
    g.lib=Array.isArray(g.lib)?g.lib:d.lib;
    if(!g.lib.some(l=>l.kind==='bgm')) g.lib.push(...clone(DEFAULT_BGM));
    g.threads=Array.isArray(g.threads)?g.threads:d.threads;
    g.npcs=(Array.isArray(g.npcs)?g.npcs:[]).filter(n=>n&&n.id&&n.name); g.npcs.forEach(n=>{ n.npc=true; n.faces=Array.isArray(n.faces)?n.faces:[]; n.skins=[]; n.lines=Array.isArray(n.lines)?n.lines:[]; n.touch=n.touch||{head:[],body:[]}; n.affLines=n.affLines||{}; if(!n.upper||typeof n.upper!=='object') n.upper={id:'up_'+n.id,kind:'upper',name:n.name+' 상반신',prompt:'',img:null}; });
    g.rels=(Array.isArray(g.rels)?g.rels:[]).filter(r=>r&&typeof r.a==='string'&&typeof r.b==='string'&&r.a!==r.b).map(r=>Object.assign(r,{id:r.id||'r'+Math.random().toString(36).slice(2,10),kind:String(r.kind||''),note:String(r.note||''),hist:Array.isArray(r.hist)?r.hist:[]}));
    g.opening=Object.assign(d.opening,g.opening||{});
    g.prog=Object.assign(d.prog,g.prog||{}); { const o=g.prog.settings||{}; if(!o.rv&&+o.pity===70) o.pity=150; } /* 예전 기본값(천장 70)을 새 기본값(천장 150)으로 바꿔요. 직접 바꾼 값은 그대로 둬요(rv는 기본값에서 채워져요) */ g.prog.settings=Object.assign(clone(DEFAULT_PROG.settings),g.prog.settings||{});
    if(!g.prog.inbox||typeof g.prog.inbox!=='object') g.prog.inbox={};
    if(old&&Object.keys(g.prog.owned).length) g.prog.seenOpening=g.prog.seenOpening||false;
    const m0=g.meta||{}; g.meta=Object.assign(clone(DEFAULT_META),m0); g.meta.terms=Object.assign(clone(DEFAULT_META.terms),m0.terms||{}); g.meta.terms.abyss=Story.explorationName(g.meta.terms.abyss);
    // Inspect the original metadata: merged defaults already carry the new-game marker.
    if(m0.materialTermNamesVersion!==1){for(const key of ['core','gearMat','transcMat']){g.meta.terms[key]=DEFAULT_META.terms[key];for(const icon of g.lib||[])if(icon.kind==='icon'&&icon.key===key)icon.name=g.meta.terms[key]+' 아이콘';}g.meta.materialTermNamesVersion=1;g.__curveNew=true;}
    if(!g.meta.skillTrainingMaterialsVersion){g.meta.terms.wMat='스킬 교본';for(const f of g.meta.farms||[])if(f.key==='wmat')f.name='스킬 교본 회수';for(const l of g.lib||[])if(l.kind==='icon'&&l.key==='wmat')l.name='스킬 교본 아이콘';g.meta.skillTrainingMaterialsVersion=1;}
    if(!Array.isArray(g.meta.elems)||g.meta.elems.length<2||g.meta.elems.length>8) g.meta.elems=clone(DEFAULT_META.elems); // 속성 2~8개 (게임 규칙에서 추가·제거)
    g.meta.elems=g.meta.elems.map((e,i)=>({n:String((e&&e.n)||(DEFAULT_META.elems[i]||{n:'속성'+(i+1)}).n).replace(/[<>"'&`]/g,'').slice(0,4)||'속성'+(i+1),c:HEXC.test((e&&e.c)||'')?e.c:(DEFAULT_META.elems[i]||{c:'#999999'}).c,d:String((e&&e.d)||'').slice(0,80)}));
    if(!HEXC.test(g.meta.accent||'')) g.meta.accent=DEFAULT_META.accent;
    g.meta.roles=Object.assign(clone(DEFAULT_META.roles),m0.roles||{}); if(!Array.isArray(g.meta.farms)||!g.meta.farms.length) g.meta.farms=clone(DEFAULT_META.farms);
    const isDefaultGame=g.chars.some(c=>c.id==='sera');
    g.chars.forEach(c=>{
      const x=EXTRA2[c.id];
      if(x&&!c.weapon){ ['faction','lvLines','dupLines','affLines','files'].forEach(k=>{if(c[k]==null&&x[k]!=null)c[k]=clone(x[k]);}); if(!c.weapon&&x.weapon) c.weapon=Object.assign({id:'w_'+c.id,img:null},clone(x.weapon)); }
      c.faction=c.faction||''; c.lvLines=c.lvLines||[]; c.dupLines=c.dupLines||[]; c.affLines=c.affLines||{}; c.files=c.files||[];
      c.faces=c.faces||[]; c.skins=c.skins||[]; c.limited=!!c.limited; if(c.naiPose==='standing, looking at viewer, arms at sides') c.naiPose=NAI_FRONT;
      if(!c.weapon) c.weapon={id:'w_'+c.id,name:'',desc:'',prompt:'',img:null}; if(!c.weapon.id) c.weapon.id='w_'+c.id;
      c.episodes.forEach(e=>{e.dup=e.dup||0;e.after=e.after||'';});
      if(!c.illust||typeof c.illust!=='object') c.illust={id:'il_'+c.id,kind:'illust',name:c.name+' 일러스트',prompt:'',img:null}; c.illust.kind='illust'; c.illust.id=c.illust.id||'il_'+c.id; c.illust.name=c.name+' 일러스트';
      if(!c.upper||typeof c.upper!=='object') c.upper={id:'up_'+c.id,kind:'upper',name:c.name+' 상반신',prompt:'',img:null}; c.upper.id=c.upper.id||'up_'+c.id;
      if(!c.pose||typeof c.pose!=='object') c.pose={id:'po_'+c.id,kind:'pose',name:c.name+' 로비 포즈',prompt:'',img:null}; c.pose.id=c.pose.id||'po_'+c.id;
      if(!c.lbbg||typeof c.lbbg!=='object') c.lbbg={id:'lg_'+c.id,kind:'lbbg',name:c.name+' 로비 배경',prompt:'',img:null}; c.lbbg.id=c.lbbg.id||'lg_'+c.id;
      if(!c.lbcg||typeof c.lbcg!=='object') c.lbcg={id:'lb_'+c.id,kind:'lbcg',name:'',prompt:'',img:null}; c.lbcg.kind='lbcg'; c.lbcg.id=c.lbcg.id||'lb_'+c.id; c.lbcg.name=c.name+' '+((g.meta&&g.meta.terms&&g.meta.terms.limit)||'돌파')+' CG';
    });
    g.chapters.forEach(ch=>{ch.kind=ch.kind||'main';});
    if(!Array.isArray(g.banners)) g.banners=isDefaultGame?clone(DEFAULT_BANNERS):[{id:'std',name:'상시 '+(g.meta.terms.gacha||'뽑기'),type:'std',desc:'',pool:{mode:'all',factions:[],ids:[]},pickup:[],rate:50,active:true,bg:''}];
    g.banners.forEach(b=>{b.pool=Object.assign({mode:'all',factions:[],ids:[]},b.pool||{});b.pickup=b.pickup||[];if(b.rate==null)b.rate=50;});
    if(!Array.isArray(g.events)){ g.events=[]; if(isDefaultGame){ g.events=clone(DEFAULT_EVENTS); if(!g.chapters.some(ch=>ch.id==='evc1')) g.chapters.push(clone(DEFAULT_EVENT_CHAPTER)); } }
    g.events.forEach(ev=>{ if(!ev.shop||!ev.shop.length) ev.shop=Core.defaultShop(ev,g); });
    if(!Array.isArray(g.dispatches)) g.dispatches=clone(DEFAULT_DISP);
    if(!g.lib.some(l=>l.kind==='sfx')) g.lib.push(...clone(DEFAULT_SFX));
    Story.syncEnemies(g);
    [['gems','currency','blue crystal gem, faceted crystal, glowing, sparkle'],['gold','gold','gold coin, embossed star emblem, shiny metal'],['exp','expMat','glowing data chip, holographic record, blue light'],['wmat','wMat','mechanical parts, gears and bolts, metal'],['core','core','hexagonal energy core, pink glow, crystal inside'],['gearMat','gearMat','polished alloy ingot, metallic shine, gear emblem'],['transcMat','transcMat','radiant transcendence crystal, violet and gold glow']].forEach(([k,t,pr])=>{ if(!g.lib.some(l=>l.kind==='icon'&&l.key===k)) g.lib.push({id:'ic_'+k,kind:'icon',key:k,name:((g.meta.terms||{})[t]||t)+' 아이콘',prompt:pr,img:null}); });
    const pd=clone(DEFAULT_PROG); ['mat','dm','pass'].forEach(k=>{g.prog[k]=Object.assign(clone(pd[k]),g.prog[k]||{});});
    { const dl=clone(DEFAULT_PROG.live), l0=g.prog.live||{}; g.prog.live=Object.assign(dl,l0); g.prog.live.on=Object.assign(clone(DEFAULT_PROG.live.on),l0.on||{}); g.prog.live.seasons=Object.assign(clone(DEFAULT_PROG.live.seasons),l0.seasons||{}); g.prog.live.last=l0.last||{}; g.prog.live.notices=Array.isArray(l0.notices)?l0.notices:[]; g.prog.live.recentPU=Array.isArray(l0.recentPU)?l0.recentPU:[]; }
    ['pities','tokens','disp','farmClear','shopBuy'].forEach(k=>{if(!g.prog[k]||typeof g.prog[k]!=='object')g.prog[k]={};}); Characters.farmClearV2(g.prog);
    g.prog.shop=Object.assign({day:'',buy:{}},g.prog.shop||{}); g.prog.cash=Object.assign({first:{},month:{until:0,last:''},total:0},g.prog.cash||{}); g.prog.cash.first=g.prog.cash.first||{}; g.prog.cash.month=Object.assign({until:0,last:''},g.prog.cash.month||{});
    g.meta.shop=Object.assign(clone(DEFAULT_META.shop),g.meta.shop||{});
    if(g.prog.gold==null) g.prog.gold=20000;
    let legacyExtra=0;g.chapters.filter(ch=>ch.kind==='main').forEach((ch,i)=>{if(ch.stages.some(s=>g.prog.cleared?.[s.id]))legacyExtra=Math.max(legacyExtra,5*Math.max(0,i-9));});
    Object.values(g.prog.owned).forEach(o=>{if(o.levelCapVersion!==1){o.legacyLevelCap=Math.min(120,Math.max(Number(o.lv)||1,Math.min(70,20+10*(o.dup||0))+legacyExtra));o.transc=Math.min(5,Math.max(0,Math.floor(Number(o.transc)||0)));o.levelCapVersion=1;g.__curveNew=true;}if(o.lv>120){o.lv=120;o.exp=0;g.__curveNew=true;}if(GGMCombat.migrateGrowthProgress(o))g.__curveNew=true;o.wlv=o.wlv||0;o.skillTraining=GGMCombat.trainingState(o.skillTraining);o.skin=o.skin||'';if(o.dup==null)o.dup=0;});
    g.chars.forEach(c=>{ if(!c.skillPending&&/응답 대기|내부 검사하는 중|설계하는 중|새 게임을 연 뒤/.test(String(c.skillGenerationWarning||''))) c.skillPending=true; /* 생성 중 끊긴 스킬 설계 → 이어서(skillResume) */ c.rarity=[1,2,3].includes(+c.rarity)?+c.rarity:1; if(!['atk','def','sup'].includes(c.role)) c.role='atk'; c.elem=String(c.elem||'').replace(/[<>"'&`]/g,''); });
    if(Array.isArray(g.world.codex)) g.world.codex=g.world.codex.filter(x=>x&&typeof x==='object').map(x=>Object.assign(x,{cat:['world','faction','person','place','item','term','history'].includes(x.cat)?x.cat:'term',title:String(x.title||''),body:String(x.body||'')}));
    if(!(g.meta.ageTags>=1)){ g.chars.forEach(c=>{ if(c.naiPrompt) c.naiPrompt=Core.stripAge(c.naiPrompt); }); g.meta.ageTags=1; g.__curveNew=true; }
    if(!(g.meta.curve>=3)){ g.chapters.filter(ch=>ch.kind==='main').forEach((ch,k)=>Story.rebalanceChapter(ch,k)); g.meta.curve=3; g.__curveNew=true; }
    for(const c of g.chars)if(GGMCombat.migrateBaseStats(c))g.__curveNew=true;
    if(g.chars.some(c=>c.roleSpeedVersion!==1))g.__curveNew=true;g.chars.forEach(c=>v2Ensure(c)); g.meta.combatVersion=2;
    Characters.gameSlotsFix(g); Characters.scgFixAll(g); g.ver=VER;
    try{ Acquire.repairRefs(g); }catch(e){}
    if(Characters.naiBlocksGame(g))g.__curveNew=true;
    return g;
  }

  static replaceAll(ng){
    const olds=[...G.chars.map(c=>'c:'+c.id),...G.chapters.map(ch=>'ch:'+ch.id),...G.lib.map(l=>'l:'+l.id),...G.threads.map(t=>'t:'+t.id)];
    G=Characters.fix(ng); delete G.__curveNew; Core.mark(...olds); System.markAll(); SystemCtl.loadIdbImages(); Challenge.render();
  }

  static imgSrc(o){
   if(o&&typeof G!=='undefined'&&G){const owner=(G.chars||[]).find(c=>c===o||(c.skins||[]).includes(o));if(owner){if(o!==owner)return Core.skinPreviewSrc(owner,o);if(owner.useStanding===false)return owner.upper&&Art.imgSrcRaw(owner.upper)||null;}}
   return Art.imgSrcRaw(o);
  }

  static skinOf(c){ if(NOSKIN) return null; const o=c&&P().owned[c.id]; return o&&o.skin?(c.skins||[]).find(x=>x.id===o.skin)||null:null; }

  static skinPart(k,x){ if(!k[x]||typeof k[x]!=='object') k[x]={id:'k'+x.slice(0,2)+'_'+k.id,kind:x==='upper'?'upper':x,name:k.name+' '+SKP[x],prompt:'',img:null}; return k[x]; }

  static skinPartSrc(c,x){ const k=Characters.skinOf(c); return k&&k[x]?Characters.imgSrc(k[x]):null; }

  static lbcgSrc(c){return Characters.skinOf(c)?Characters.skinPartSrc(c,'lbcg'):c&&c.lbcg?Characters.imgSrc(c.lbcg):null;}

    // 그림만 지워요(항목은 남겨요): 기기 저장소의 그림과 화면용 주소까지 정리해요
static async imgClear(o){ if(!o) return;if(appStorage.durable||window.indexedDB||o.img?.idb)await Core.idbDel(IMGNS+o.id);o.img=null; delete o.seed; if(imgCache[o.id]){ try{ URL.revokeObjectURL(imgCache[o.id]); }catch(e){} delete imgCache[o.id]; } }

  static faceTgt(c){ const k=FACET.cid===c.id&&FACET.sid&&(c.skins||[]).find(x=>x.id===FACET.sid); if(k){ k.faces=k.faces||[]; return k; } return c; }

  static charIllust(c){ if(!c) return null; const k=Characters.skinOf(c); if(k&&Characters.imgSrc(k)) return Characters.skinPartSrc(c,'illust'); return c.illust?Characters.imgSrc(c.illust):null; }

    /* /BACKUP_STORAGE_MODULE */
  /* ---- 공유 팩: 내보내기·가져오기(백업과 같은 단계식 미디어 처리, 진행은 담지 않음) ---- */
  /* Share archives use the same staged, chunked media pipeline as backups.
     Legacy JSON remains an import format; sharing never carries player progress. */
static shareDefinition(options){
   const game=JSON.parse(JSON.stringify(G));delete game.prog;
   const stages=game.chapters.filter(ch=>ch.kind==='main').reduce((n,ch)=>n+ch.stages.length,0);
   const spread=arr=>arr.forEach((x,k)=>{x.gate=options.gate===false?0:Math.min(stages,x.gate>0?x.gate:Math.max(1,Math.round((k+1)*stages/(arr.length+1))));});
   spread(game.events||[]);spread((game.banners||[]).filter(b=>b.id!=='std'&&!b.eventId));game.meta.gated=options.gate!==false&&stages>0;
   for(const b of game.banners||[]){delete b.until;if(b.id!=='std'&&game.meta.gated){b.active=true;delete b.newAt;}}
   for(const e of game.events||[]){delete e.until;if(game.meta.gated)e.active=true;}
   if(!String(game.meta.artTags||'').trim()){const config=Core.naiCfg(),style=config.styles.find(x=>x.id===config.styleId)||config.styles[0];if(style&&String(style.tags||'').trim()){game.meta.artTags=style.tags;game.meta.artNeg=style.neg||'';}}
   for(const c of game.chars){delete c.voiceId;delete c.voiceName;}
   for(const o of Core.imgObjsOf(game))if(!options.img||!o.img?.idb)o.img=null;
   for(const l of game.lib||[])if(!options.audio)l.audio=null;
   return game;
  }

  static clearImportedMediaCache(){for(const cache of [imgCache,audioCache,chatImgCache])for(const k of Object.keys(cache)){URL.revokeObjectURL(cache[k]);delete cache[k];}}

  static async applySharedArchive(header,prefix){
   if(!header.game||!Array.isArray(header.game.chars))throw Error('공유팩 게임 정보가 올바르지 않습니다');
   if(header.hasGlobalMedia)throw Error('공유팩에 허용되지 않는 음성 캐시가 포함되어 있습니다');
   const project=Core.PJ().active,original=G;SystemView.backupBusyOverlay(false);
   const toNew=await appConfirm(`공유 팩 「${header.game.meta?.title||'게임'}」이에요. 새 게임으로 추가할까요?\n확인: 새 게임으로 추가\n취소: 현재 게임을 덮어쓸지 다시 물어봅니다.`);
   if(!toNew&&!await appConfirm('현재 게임을 이 공유팩으로 덮어쓸까요? 진행 상황은 처음부터 시작합니다.'))return false;
   if(Core.PJ().active!==project||G!==original)throw Error('게임이 바뀌었습니다. 파일을 다시 선택해 주세요.');
   SystemView.backupBusyOverlay(true);CoreView.backupTransferStatus('공유팩 검사 완료 · 안전하게 저장 중…');await Core.flush();
   const raw=header.game;delete raw.prog;const game=Characters.fix(raw),present=new Set((header.media?.images||[]).map(x=>x.id)),audio=new Set((header.media?.audios||[]).map(x=>x.id));
   for(const o of Core.imgObjsOf(game))o.img=present.has(o.id)?{idb:true}:null;
   for(const l of game.lib||[])l.audio=audio.has(l.id)?{idb:true}:null;
   for(const c of game.chars){delete c.voiceId;delete c.voiceName;}
   const registry=Core.PJ(),id=toNew?'g'+uid():project,namespace=id==='main'?'':id+'::';
   if(toNew){registry.list.push({id,title:game.meta.title||'공유 게임'});registry.active=id;}else{const entry=registry.list.find(x=>x.id===id);if(entry){entry.title=game.meta.title;delete entry.sub;}}
   const previousPause=window.__NOFLUSH;window.__NOFLUSH=1;
   try{
    await appStorage.commitImport(prefix,System.pjKey(id),JSON.stringify(game),namespace,{[PJKEY]:JSON.stringify(registry)});
    dirty.clear();clearTimeout(flushT);
    if(toNew){CoreView.toast('공유팩을 새 게임으로 추가했어요. 다시 시작합니다.');await SystemView.reloadGame();return 'reload';}
    G=game;Characters.clearImportedMediaCache();try{await SystemCtl.loadIdbImages();await System.loadAudio();SystemView.applyMeta();Challenge.render();CoreView.closeModal();CoreView.toast('공유팩을 불러왔어요. 새 진행으로 시작합니다.');}catch(e){CoreView.toast('공유팩은 저장되었지만 화면을 갱신하지 못했습니다. 앱을 다시 실행해 주세요.');}return true;
   }finally{window.__NOFLUSH=previousPause;}
  }

    /* 이격(c.alt = 원본 id)은 원본과 다른 항목만 c.over에 저장해요(git 패치처럼). 원본을 고치면 이격에서 안 바꾼 항목은 같이 바뀌어요.
     - 상속 항목: inheritKeys(). 이름·그림·외모 프롬프트·에피소드·전용 무기는 이격 자기 것(상속 안 함)
     - 능력치(hp/atk/def/spd)는 절대값이 아니라 원본 대비 가중치(over.statMul)로 저장 → 원본 능력치가 오르면 같이 올라요
     - 저장할 때는 상속 항목을 빼고(inheritStore), 불러올 때·원본을 고칠 때 다시 채워요(inheritApply)
     이 파일은 0070-save.js의 fix()가 불러올 때 쓰므로, 최상위 const 없이 함수 선언만 둬요(호이스팅) */
static inheritKeys(){ return ['faction','elem','role','pos','persona','pfields','rarity','skill','skills','skillPlan','profile','intro','lines','touch','affLines','lvLines','dupLines','files','age','voiceId','voiceName','naiStyle']; }

  static inheritStats(){ return ['hp','atk','def','spd']; }

  static inheritSame(a,b){ return JSON.stringify(a)===JSON.stringify(b); }

  static inheritDiff(c,b){ // 이격 c와 원본 b를 비교해서 다른 것만
    const o={}; for(const k of Characters.inheritKeys()) if(k in c&&!Characters.inheritSame(c[k],b[k])) o[k]=JSON.parse(JSON.stringify(c[k]??null));
    const m={}; for(const k of Characters.inheritStats()){ const x=+c[k], y=+b[k]; if(x&&y&&x!==y) m[k]=Math.round(x/y*10000)/10000; } if(Object.keys(m).length) o.statMul=m;
    return o; }

  static inheritApply(c,b){ // 원본 + 수정치 → 이격 전체
    const o=c.over||{};
    for(const k of Characters.inheritKeys()) c[k]=JSON.parse(JSON.stringify(k in o?o[k]:(b[k]??null))); for(const k of Characters.inheritKeys()) if(c[k]===null&&!(k in o)&&!(k in b)) delete c[k];
    for(const k of Characters.inheritStats()) if(b[k]!=null) c[k]=Math.round(+b[k]*((o.statMul||{})[k]||1));
    if(!('skills' in o)&&b.skillBalance) c.skillBalance=JSON.parse(JSON.stringify(b.skillBalance)); // 스킬을 물려받으면 밸런스 검사 결과도 같이
    return c; }

  static inheritAll(g){ // 불러올 때: 예전 이격(전체 복사본)은 지금 값 그대로 수정치를 만들어서 바뀌는 것이 없게
    const by=new Map((g.chars||[]).map(c=>[c.id,c])); let changed=false;
    for(const c of g.chars||[]){ const b=c.alt&&by.get(c.alt); if(!b||b.alt) continue;
      if(!c.over||typeof c.over!=='object'){ c.over=Characters.inheritDiff(c,b); changed=true; }
      Characters.inheritApply(c,b); }
    return changed; }

  static inheritStore(c,ids){ // 저장용: 상속 항목은 빼고 수정치만. 원본이 게임에 없으면(지웠으면) 전체를 그대로 저장해요(물려받을 곳이 없으니까)
    if(!c||!c.alt||!c.over||(ids&&!ids.has(c.alt))) return c; const s={...c}; for(const k of [...Characters.inheritKeys(),...Characters.inheritStats(),'skillBalance']) if(!(k in c.over)||k==='skillBalance') delete s[k]; if(c.over.skills) s.skillBalance=c.skillBalance; return s; }

  static inheritOnMark(id){ // mark('c:'+id) 때: 이격을 고쳤으면 수정치 다시 계산, 원본을 고쳤으면 이격들에 반영
    if(INHERIT_SYNC||typeof G==='undefined'||!G) return; const c=G.chars.find(x=>x.id===id); if(!c) return;
    if(c.alt){ const b=G.chars.find(x=>x.id===c.alt); if(b&&!b.alt) c.over=Characters.inheritDiff(c,b); return; }
    const alts=G.chars.filter(x=>x.alt===c.id); if(!alts.length) return;
    INHERIT_SYNC=true; try{ for(const a of alts){ if(!a.over) a.over=Characters.inheritDiff(a,c); Characters.inheritApply(a,c); dirty.add('c:'+a.id); } } finally{ INHERIT_SYNC=false; } }

  static inheritReset(c,k){ // 수정치 하나(또는 전부)를 버리고 원본을 따르게
    const b=c&&c.alt&&G.chars.find(x=>x.id===c.alt); if(!b) return; if(k==='*') c.over={}; else if(k&&c.over){ if(Characters.inheritStats().includes(k)&&c.over.statMul){ delete c.over.statMul[k]; if(!Object.keys(c.over.statMul).length) delete c.over.statMul; } else delete c.over[k]; }
    Characters.inheritApply(c,b); INHERIT_SYNC=true; try{ Core.mark('c:'+c.id); } finally{ INHERIT_SYNC=false; } }

  static inheritLabel(k){ return ({faction:'소속',elem:'속성',role:'역할',pos:'포지션',persona:'개성',pfields:'프로필 항목',rarity:'희귀도',skill:'스킬(구형)',skills:'스킬',skillPlan:'스킬 설계 의도',profile:'프로필',intro:'첫 대사',lines:'대사',touch:'터치 대사',affLines:'호감도 대사',lvLines:'레벨 대사',dupLines:'돌파 대사',files:'기밀 파일',age:'나이',voiceId:'목소리',voiceName:'목소리 이름',naiStyle:'그림체',hp:'체력',atk:'공격',def:'방어',spd:'속도'})[k]||k; }

  static own(id){return P().owned[id];}

    /* 획득량 배율(설정 → 게임): 전투·소탕·파견·일일 보급으로 '버는' 보상에만 곱해요(상점 구매는 그대로) */
static rateR(r){ const s=P().settings, o=Object.assign({},r), m=(k,x)=>{ if(typeof o[k]==='number') o[k]=Math.max(0,Math.round(o[k]*x/100)); };
    m('gold',s.goldRate||100); m('gems',s.gemRate||100); ['exp','wmat','core','gearMat','transcMat'].forEach(k=>m(k,s.expRate||100)); return o; }

  static stamCost(kind){ return kind==='main'||kind==='event'?10:kind==='farm'?8:0; }

  static passClaimable(){const n=passLv();let k=0;for(let l=1;l<=n;l++)if(!P().pass.got.includes(l))k++;return k+MISSIONS.filter(m=>(Core.progRead('dm').cnt[m.k]||0)>=m.goal&&!Core.progRead('dm').got[m.k]).length;}

  static spoilFree(c,arr){ arr=arr||[]; if(!arr.length) return arr; const seen=Story.seenText(), self=c&&c.name;
    const unseen=[...G.chars,...(G.npcs||[])].map(x=>x.name).filter(n=>n&&n.length>=2&&n!==self&&!seen.includes(n)); if(!unseen.length) return arr;
    return arr.filter(l=>!unseen.some(n=>String(l).includes(n))); }

  static affLinePool(c){ return Characters.spoilFree(c,Characters.affLinePool0(c)); }

  static affLinePool0(c){const o=Characters.own(c.id),lv=Core.affLv(o),k=Characters.skinOf(c);let pool=k&&(k.lines||[]).length?[...k.lines,...k.lines,...c.lines]:[...c.lines];Object.entries(c.affLines||{}).forEach(([k,v])=>{if(lv>=+k)pool.push(...(v||[]));});if(typeof System.memoOn==='function'&&System.memoOn(c))pool.push(...c.memorial.lines,...c.memorial.lines);return pool;} // 메모리얼 로비를 켜면 메모리얼 대사가 자주 나와요

  static affFull(o){return !!o&&(o.aff||0)>=AFF_MAX;}

  static addGifts(n){ const inv=Core.progSlot('gifts'), got=[]; for(let i=0;i<n;i++){ const w=GIFTS.map(g=>g[3]>=50?1:g[3]>=30?3:5), tot=w.reduce((a,b)=>a+b,0); let x=Math.random()*tot, k=0; while((x-=w[k])>0) k++; const id=GIFTS[k][0]; inv[id]=(inv[id]||0)+1; got.push(id); } Core.mark('prog'); return got; }

  static giftLikes(c){ const h=Core.hashN(c.id+'likes'); const a=h%GIFTS.length, b=(Math.floor(h/7)+3)%GIFTS.length; return new Set([GIFTS[a][0],GIFTS[b===a?(b+1)%GIFTS.length:b][0]]); }

  static skinShopList(){ return G.chars.flatMap(c=>(c.skins||[]).filter(k=>k.shop).map(k=>({c,k}))).sort((a,b)=>(b.k.at||0)-(a.k.at||0)); }

  static PERSONA_CFG(){ const d={tpl:PROFILE_TPLS.basic,affLv:[2,4,6,8],memoLv:8}; return Object.assign(d,G.meta.persona||{}); }

  static personaClean(p){ p=p&&typeof p==='object'?p:{}; const o={}; for(const [k,,t] of PERSONA_FIELDS){ const v=t==='list'?pStrs(p[k]):String(p[k]||'').trim().slice(0,80); if(t==='list'?v.length:v) o[k]=v; } return o; }

  static pfieldsClean(f){ const o={}; Object.entries(f&&typeof f==='object'?f:{}).slice(0,16).forEach(([k,v])=>{ k=String(k).trim().slice(0,16); v=String(v||'').trim().slice(0,80); if(k&&v) o[k]=v; }); return o; }

    /* 개성 검수: 점수(0~100)와 고칠 점. 빠진 항목·흔한 성격·다른 캐릭터와 겹침·대사에 말투가 안 드러남·호감도 콘텐츠 */
static personaReview(c){ const p=c.persona||{}, issues=[], add=(w,k,msg)=>issues.push({w,k,msg});
    const core=[['traits',12],['ending',10],['gap',10],['flaw',8],['want',6],['catch',6],['self',5],['quirk',5],['likes',4],['fear',4],['dislikes',2],['hobby',2],['motif',2],['call',2]];
    core.forEach(([k,w])=>{ const v=p[k]; if(!(Array.isArray(v)?v.length:v)) add(w,k,`${(PERSONA_FIELDS.find(f=>f[0]===k)||[])[1]} 없음`); });
    if((p.traits||[]).length&&p.traits.every(t=>PERSONA_GENERIC.test(t.replace(/\s/g,'')))) add(8,'traits','성격 키워드가 흔해요(예: 밝음·친절). 구체적인 습관이나 반전 매력과 짝지으세요');
    const others=G.chars.filter(x=>x!==c&&!x.alt&&x.persona);
    others.forEach(x=>{ const q=x.persona; if(p.ending&&q.ending&&p.ending===q.ending&&(p.self||'')===(q.self||'')) add(8,'ending',`말투(1인칭·어미)가 ${x.name}와(과) 같아요`);
      const A=new Set(p.traits||[]), B=new Set(q.traits||[]); if(A.size&&B.size){ const inter=[...A].filter(t=>B.has(t)).length; if(inter/Math.min(A.size,B.size)>=.67) add(6,'traits',`성격이 ${x.name}와(과) 많이 겹쳐요`); }
      if(p.catch&&q.catch&&p.catch===q.catch) add(5,'catch',`대표 대사가 ${x.name}와(과) 같아요`); });
    const toks=[...String(p.ending||'').split(/[,/·]/),p.quirk,p.catch].map(s=>String(s||'').replace(/[~…."'「」]/g,'').trim()).filter(s=>s.length>=1), lines=(c.lines||[]).concat(Object.values(c.affLines||{}).flat());
    if(toks.length&&lines.length>=3&&!lines.some(l=>toks.some(t=>String(l).includes(t)))) add(8,'lines','대사에 말투(어미·말버릇·대표 대사)가 드러나지 않아요');
    if((c.lines||[]).length<4) add(4,'lines','평소 대사가 적어요(4개 이상 권장)');
    if(!affThreads(c).length) add(6,'afftalk','호감도에 따라 열리는 인연 톡이 없어요');
    if(!c.memorial||!c.memorial.script) add(4,'memorial','메모리얼이 없어요');
    if(!(c.episodes||[]).length) add(3,'episode','인연 스토리(에피소드)가 없어요');
    const score=Math.max(0,Math.round(100-issues.reduce((a,x)=>a+x.w,0)));
    return {score,issues,grade:score>=85?'S':score>=70?'A':score>=55?'B':score>=40?'C':'D'}; }

    /* AI: 개성 채우기·다듬기(mode fill|improve), 대사도 말투에 맞게 다시 쓰기(lines) */
static async personaAI(c,mode='fill',opt={}){
    const cfg=Characters.PERSONA_CFG(), others=G.chars.filter(x=>x!==c&&!x.alt&&x.persona).slice(0,12).map(x=>`${x.name}: ${Characters.personaBrief(x)}`).join(' / ');
    const r=await Core.aiJSON(Characters.personaAIPrompt({c,mode,others,opt,cfg}),CoreView.uiProg(opt.btn),'default');
    if(!r||!r.persona) return false;
    c.persona=Object.assign({},mode==='fill'?Characters.personaClean(r.persona):{},mode==='fill'?Characters.personaClean(c.persona):{},mode==='improve'?Characters.personaClean(r.persona):{});
    c.pfields=Object.assign({},Characters.pfieldsClean(r.pfields),mode==='fill'?Characters.pfieldsClean(c.pfields):{});
    if(opt.lines){ const L=strs(r.lines); if(L.length>=3) c.lines=L.slice(0,12); if(r.affLines&&typeof r.affLines==='object'){ const a={...(c.affLines||{})}; Object.entries(r.affLines).forEach(([k,v])=>{ const n=parseInt(k,10); if(n>=1&&n<=10&&strs(v).length) a[n]=strs(v).slice(0,4); }); c.affLines=a; } }
    Core.mark('c:'+c.id); return true; }

    /* 메모리얼: 호감도 memoLv에서 열리는 특별 장면 + 메모리얼 로비 대사 */
static async memorialGen(c,rep){ const cfg=Characters.PERSONA_CFG(); const r=await Core.aiJSON(Characters.memorialGenPrompt({c,cfg}),rep,'default'); if(!r||!r.script) return false;
    c.memorial={lv:+cfg.memoLv||8,title:String(r.title||'메모리얼').slice(0,30),script:String(r.script),lines:strs(r.lines).slice(0,6)}; Core.mark('c:'+c.id); return true; }

    /* 인연 톡: 호감도 단계마다 메신저 대화(모모톡처럼 관계가 깊어지는 흐름) */
static async talkAffGen(c,rep){ const cfg=Characters.PERSONA_CFG(), have=new Set(affThreads(c).map(t=>+t.trigger.value)), levels=cfg.affLv.filter(l=>!have.has(+l)); if(!levels.length){ CoreView.toast('이미 모든 단계의 인연 톡이 있어요'); return 0; }
    const r=await Core.aiJSON(Characters.talkAffGenPrompt({c,levels}),rep,'default');
    const L=(r&&Array.isArray(r.threads)?r.threads:[]).filter(x=>x&&x.script&&levels.includes(+x.lv)); let n=0;
    for(const x of L){ const th={id:uid(),charId:c.id,title:String(x.title||'메시지').slice(0,30),trigger:{type:'aff',value:+x.lv},needOwn:true,script:String(x.script)}; G.threads.push(th); Core.mark('t:'+th.id); n++; }
    if(n) MessengerCtl.checkTriggers(true); return n; }

  static personaSave(c){ const p={}; document.querySelectorAll('#modal [data-ps]').forEach(el=>{ p[el.dataset.ps]=el.value; }); c.persona=Characters.personaClean(p); const f={}; document.querySelectorAll('#modal [data-pf]').forEach(el=>{ f[el.dataset.pf]=el.value; });
    String(($('#ps_extra')||{}).value||'').split('\n').forEach(l=>{ const i=l.indexOf('='); if(i>0) f[l.slice(0,i).trim()]=l.slice(i+1).trim(); }); c.pfields=Characters.pfieldsClean(f); Core.mark('c:'+c.id); }

  static personaCfgSave(){ const m=G.meta, k=$('#ps_tpl').value, f=k==='custom'||$('#ps_tplf').value.trim()!==(PROFILE_TPLS[k]||[]).join(', ')?pStrs($('#ps_tplf').value):PROFILE_TPLS[k]; m.persona=Object.assign(m.persona||{},{tpl:f.length?f:PROFILE_TPLS.basic,affLv:[...new Set(String($('#ps_aff').value).split(/[,\s]+/).map(Number).filter(n=>n>=1&&n<=10))].sort((a,b)=>a-b),memoLv:Math.max(1,Math.min(10,+$('#ps_memo').value||8))}); Core.mark('meta'); }

  static async handleCharactersAction(a,t,id,p,e){
    switch(a){
  case 'csframe': { const p2=P(); p2.csFull=!p2.csFull; Core.mark('prog'); CharactersView.csFrameShow(t,p2.csFull); break; }
  case 'cspoke': { const c=charById(id); if(!c) break; const o=Characters.own(c.id), lv=o?Core.affLv(o):1, x=e.clientX||innerWidth/2, y=e.clientY||innerHeight/2, r=t.getBoundingClientRect(), zone=(y-r.top)/r.height<0.3?'head':'body';
        const pool=Characters.spoilFree(c,o?(zone==='head'&&c.touch?.head?.length?c.touch.head:zone==='body'&&c.touch?.body?.length?c.touch.body:Characters.affLinePool(c)):c.lines), l=Core.pickTouchLine(pool,CharactersView.csSayText());
        if(CharactersView.csPokeShow(t,c,l,!!o,lv,zone,x,y)&&c.voiceId&&Core.SND().voiceLobby) CoreView.speak(c,l);
        if(o){ CoreCtl.addAff(c,1); Core.mark('prog'); } break; }
  case 'cstab': CS_TAB=t.dataset.k; CharactersView.csTabShow(); break;
  case 'upgen': { const c=charById(id); if(!c) break; if(!String(c.naiPrompt||'').trim()){CoreView.toast('먼저 설정 편집에서 NAI 스탠딩 프롬프트를 채워 주세요');break;} if(!Core.imgReady()){CoreView.toast(Core.imgNeed());break;} const done=CoreView.busy(t,'그리는 중…');
        try{ const b=await Core.naiDrawItem({k:'upper',o:c.upper,c,generationMode:'manual'}); await Art.storeImage(c.upper,b,''); Core.mark('c:'+c.id); CoreView.toast('상반신을 그렸어요'); CharactersCtl.openChar(c.id); }catch(err){ CoreView.toast(Core.naiErr(err,'상반신 실패')); done(); } break; }
  case 'gift': CharactersView.openGift(id); break;
  case 'giftgive': { const c=charById(id), g=giftById(t.dataset.v), inv=Core.progSlot('gifts'); if(!c||!g||!(inv[g[0]]>0)) break; if(Characters.affFull(Characters.own(c.id))){ CoreView.toast(`${c.name}의 호감도가 이미 가득 찼어요. 선물은 아껴 두세요`); break; } inv[g[0]]--; const like=Characters.giftLikes(c).has(g[0]), val=g[3]*(like?2:1);
        p.giftSeen=p.giftSeen||{}; (p.giftSeen[c.id]=p.giftSeen[c.id]||{})[g[0]]=like?2:1; CoreCtl.addAff(c,val); Core.mark('prog'); Art.sfx(like?'SSR':'확인');
        const line=like?rand((c.affLines&&Object.values(c.affLines).flat().length?Object.values(c.affLines).flat():c.lines)):rand(c.lines); if(line) CharactersView.linePop(c,line,like?'웃음':'');
        if(like) CharactersView.hearts(innerWidth/2,innerHeight/2,4); CoreView.toast(`${g[1]} → ${c.name} 호감도 +${val}${like?' (정말 좋아해요!)':''}`); CharactersView.openGift(id); break; }
  case 'ainai': { const r=await Core.aiJSON(World.ainaiPrompt({fName:$('#f_name').value,fFac:$('#f_fac'),fElem:$('#f_elem').value,fPos:$('#f_pos').value,fProf:$('#f_prof').value}),CoreView.uiProg(t),'quick');
        if(r&&r.naiPrompt&&$('#f_nai')) $('#f_nai').value=Characters.allyTags(String(r.naiPrompt)); break; }
  case 'ailines': { const r=await Core.aiJSON(Characters.ailinesPrompt({fName:$('#f_name').value,fFac:$('#f_fac').value,fProf:$('#f_prof').value}),CoreView.uiProg(t));
        if(r&&$('#f_lines')){ $('#f_lines').value=strs(r.lines).join('\n'); $('#f_aff').value=Object.entries(r.affLines||{}).flatMap(([k,v])=>strs(v).map(x=>k+': '+x)).join('\n'); $('#f_lv').value=strs(r.lvLines).join('\n'); $('#f_dup').value=strs(r.dupLines).join('\n'); $('#f_head').value=strs(r.head).join('\n'); $('#f_body').value=strs(r.body).join('\n'); if(r.intro)$('#f_intro').value=String(r.intro); CoreView.toast('대사를 채웠어요. 확인 후 저장하세요.'); } break; }
  case 'ailinesmore': { const cur=k=>lines($('#'+k).value), L0=cur('f_lines'), H0=cur('f_head'), B0=cur('f_body');
        const r=await Core.aiJSON(Characters.ailinesmorePrompt({L0,H0,B0,fName:$('#f_name').value,fFac:$('#f_fac').value,fProf:$('#f_prof').value}),CoreView.uiProg(t),'quick');
        if(r&&$('#f_lines')){ const add=(k,a,old)=>{ const nw=strs(a).filter(x=>!old.includes(x)); $('#'+k).value=[...old,...nw].join('\n'); return nw.length; }; const n=add('f_lines',r.lines,L0)+add('f_head',r.head,H0)+add('f_body',r.body,B0); CoreView.toast(`대사 ${n}개를 더했어요. 확인 후 저장하세요.`); } break; }
  case 'upsave': { const o=Core.LV(), md=$('#up_mode').value; Object.assign(o,{repo:$('#up_repo').value.trim().replace(/^https?:\/\/github\.com\//,'').replace(/\.git$/,'').replace(/\/$/,''),branch:$('#up_br').value.trim()||'main',path:$('#up_path').value.trim()||'www/index.html',token:$('#up_tok').value.trim(),auto:md!=='off',mode:md==='off'?'ask':md}); LiveOps.saveLV(o); CoreView.closeModal(); if(o.auto) LiveOpsView.checkUpdate(true); else CoreView.toast('업데이트 확인을 껐어요'); break; }
  case 'upgo': {if(appStorage.failed||document.getElementById('save-warning'))break; const c=charById(id), k=t.dataset.k; if(!c) break; if(k==='enh') Economy.enhance(c); else if(k==='enhmax') Economy.enhance(c,true); else if(k==='lb') CharactersCtl.limitBreak(c); else if(k==='wup') Economy.weaponUp(c); else if(k==='transc') CharactersCtl.transcendUp(c); try{await Core.flush();}catch(e){break;} CharactersCtl.openChar(id); Challenge.render(); break; }
  case 'wai': { const c=charById(id); if(!c) break; const ed=a==='wai';
        const nm=(ed&&$('#f_wn')&&$('#f_wn').value.trim())||String(c.weapon.name||''), ds=(ed&&$('#f_wd')&&$('#f_wd').value.trim())||String(c.weapon.desc||''), cur=(ed&&$('#f_wp')&&$('#f_wp').value.trim())||String(c.weapon.prompt||'');
        const p2=await Characters.weaponPromptAI([{c,name:nm,desc:ds,cur}],CoreView.uiProg(t)); if(!p2[0]){ CoreView.toast('쓰지 못했어요. AI 기록을 확인해 주세요'); break; }
        if(ed){ if($('#f_wp')) $('#f_wp').value=p2[0]; CoreView.toast(System.T('weapon')+' 프롬프트를 썼어요. 저장을 눌러 주세요'); } else { c.weapon.prompt=p2[0]; Core.mark('c:'+c.id); CoreView.toast(System.T('weapon')+' 프롬프트를 썼어요'); } break; }
  case 'wfixall': { const wb=G.chars.filter(c=>c.weapon&&Characters.wpBad(c.weapon.prompt)); if(!wb.length){ CoreView.toast('정리할 '+System.T('weapon')+' 프롬프트가 없어요'); break; } const done=CoreView.busy(t,'AI로 정리하는 중…');
        try{ const n=await Characters.fixWeaponPrompts(G.chars); CoreView.toast(n>0?`${System.T('weapon')} 프롬프트 ${n}개를 ${System.T('weapon')}만 나오게 정리했어요`:'정리하지 못했어요. AI 기록을 확인해 주세요'); }finally{ done(); } CharactersView.openPrep(false); break; }
  case 'regengo': { const c=charById(id); if(!c) break; const sel={}, reqs={}; document.querySelectorAll('#modal [data-rgsel]').forEach(ch=>{ if(ch.checked) sel[ch.dataset.rgsel]=true; }); document.querySelectorAll('#modal [data-rgreqi]').forEach(i=>{ const v=i.value.trim(); if(v) reqs[i.dataset.rgreqi]=v; });
        if(!Object.keys(sel).length){ CoreView.toast('바꿀 항목을 하나 이상 켜 주세요'); break; } await CoreView.regenRun(c,sel,reqs,($('#rg_all')&&$('#rg_all').value.trim())||'',$('#rg_skill_slot')?.value||'active'); break; }
  case 'regenapply': await Characters.regenApply(); break;
  case 'regenretry': { const R=REGEN; if(!R) break; REGEN=null; const c=charById(R.cid); if(c) await CoreView.regenRun(c,R.sel,R.reqs,R.global,R.slot); break; }
  case 'regenedit': if(REGEN&&!REGEN.busy){try{CharactersView.regenReadPreview(REGEN);REGEN.edit=!REGEN.edit;CoreView.regenPreview();}catch(e){CoreView.toast(e.message);}} break;
  case 'regencancel': { const cid=REGEN?.cid||REGEN_JOB?.cid||id;if(!Core.regenCancel())break;CoreView.closeModal();if(cid&&charById(cid))CharactersCtl.openChar(cid);break; }
  case 'ailooksall': { const list=G.lib.filter(l=>l.kind==='enemy'&&!l.alias&&!l.charId); if(!list.length){CoreView.toast('적이 없어요');break;} if(!SAMPLE){ CoreView.toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); break; }
        if(!(await appConfirm(`적 ${list.length}종의 외형 프롬프트를 지금 세계관에 맞게 전부 다시 쓸까요? 지금 프롬프트는 덮어써요(그림은 그대로라 다시 그려야 바뀌어요).`))) break;
        const r=await Core.aiJSON(World.ailooksallPrompt({list}),CoreView.uiProg(t));
        let n=0; if(r&&r.looks) list.forEach(l=>{const v=r.looks[l.name]; if(v){l.prompt=String(v); Core.mark('l:'+l.id); n++;}}); CoreView.toast(`적 ${n}종의 외형을 세계관에 맞게 다시 썼어요. 다시 그리면 바뀌어요`); ArtView.openLib('enemy'); break; }
  case 'ailooks': { const list=G.lib.filter(l=>l.kind==='enemy'&&!l.prompt); if(!list.length){CoreView.toast('외형이 빈 적이 없어요');break;}
        const r=await Core.aiJSON(World.ailooksPrompt({list}),CoreView.uiProg(t));
        let n=0; if(r&&r.looks) list.forEach(l=>{const v=r.looks[l.name]; if(v){l.prompt=String(v); Core.mark('l:'+l.id); n++;}}); CoreView.toast(`적 ${n}종의 외형을 채웠어요`); ArtView.openLib('enemy'); break; }
    }
  }

  static unread(){return Object.entries(P().inbox).filter(([id,s])=>!s.done&&threadChar(threadById(id))).length;}

    // 카드 일러스트: 대원마다, 카드 종류마다 한 장 (스킬 카드는 기술 컷인을 써요)
static async drawCardArts(deck,rep){ if(!Core.imgReady()){ CoreView.toast(Core.imgNeed()); return; }
    const todo=[]; const seen=new Set(); deck.forEach(cd=>{ const c=charById(cd.o), key=cd.o+'|'+cd.k; if(!c||seen.has(key)||Core.cardIllObj(cd)) return; seen.add(key); todo.push(cd); });
    if(!todo.length){ CoreView.toast('모든 카드에 일러스트가 있어요'); return; }
    let n=0;
    for(const cd of todo){ const c=charById(cd.o); if(rep) rep(`그리는 중 ${n+1}/${todo.length}`);
      try{ const tags=cd.k==='skill'?(SKILL_TAGS[c.skill&&c.skill.kind]||'attacking')+', special effects, glowing':CARD_ILL[cd.k]||'dynamic pose';
        const b=await NewGame.naiDraw('illust',Core.joinTags(c.naiPrompt,tags),{styleId:c.naiStyle,frame:cd.k==='skill'?'upper body':'cowboy shot',pose:'dynamic pose, '+tags});
        if(cd.k==='skill'){ Characters.scgSlot(c); await Art.storeImage(c.scg,b,''); } else { c.cards=c.cards||{}; const o=c.cards[cd.k]||(c.cards[cd.k]={id:'cd_'+c.id+'_'+cd.k,kind:'illust',name:c.name+' '+Challenge.cardName({k:cd.k,o:c.id}),prompt:tags,img:null}); await Art.storeImage(o,b,''); }
        Core.mark('c:'+c.id); n++; }
      catch(e){ CoreView.toast(Core.naiErr(e)); break; } }
    if(rep) rep.end(); if(n) CoreView.toast(`카드 일러스트 ${n}장을 그렸어요`); const run=Core.progSlot('rogue').run; if($('#modal .cd-row')&&run) ChallengeView.rgDeckModal(run.deck); if(CB) ChallengeView.cbRender(); }

  static async aiNewPickupChar(con,rr,rep,col,alt){
    if(alt) return Characters.aiAltChar(alt,con,rr,rep);
    const COL=Characters.aiNewPickupCharCOLText({col});
    const r=await Core.aiJSON(Core.aiNewPickupCharPrompt({COL,con,rr}),rep);
    if(!r) return null; const c=Characters.cleanChar(r); if(rr&&rr!=='ai') c.rarity=+rr; if(!c.name) c.name='이름 없음'; if(col&&col.src){ c.collab=col.src; if(!c.faction) c.faction='콜라보'; } G.chars.push(c); Core.mark('c:'+c.id); return c; }

  static async aiAltChar(b,con,rr,rep){ const canon=!!b.__canon; b=charById(b.id)||b;
    const r=await Core.aiJSON(Core.aiAltCharPrompt({b,canon,con,rr}),rep);
    if(!r) return null; const c=Characters.cleanChar(r); if(rr&&rr!=='ai') c.rarity=+rr;
    if(!c.name||c.name.indexOf(b.name)!==0) c.name=`${b.name}(${String(con||'이격').replace(/[()]/g,'').slice(0,6)})`;
    c.alt=b.id; c.altCanon=canon; c.faction=b.faction||c.faction; if(b.voiceId) c.voiceId=b.voiceId; if(b.naiStyle) c.naiStyle=b.naiStyle; if(b.age&&!c.age) c.age=b.age; if(!c.lines||!c.lines.length) c.lines=(b.lines||[]).slice(0,3);
    G.chars.push(c); Core.mark('c:'+c.id); return c; }

  static bannerPool(b){
    // 건조 전용 바리에이션(c.cvar)은 건조/영입이 켜져 있으면 뽑기에 안 나와요(픽업으로 직접 넣은 건 예외)
    let pool=G.chars.filter(c=>(!c.limited||(b.pickup||[]).includes(c.id))&&(Acquire.castOk(c)||(!World.castCfg().pickupGate&&!c.monster&&(b.pickup||[]).includes(c.id)))&&!(c.cvar&&Acquire.conOn()&&!(b.pickup||[]).includes(c.id)));
    if(b.pool.mode==='faction') pool=pool.filter(c=>(b.pool.factions||[]).includes(c.faction));
    if(b.pool.mode==='list') pool=pool.filter(c=>(b.pool.ids||[]).includes(c.id));
    (b.pickup||[]).map(charById).filter(c=>c&&(Acquire.castOk(c)||(!World.castCfg().pickupGate&&!c.monster))).forEach(c=>{if(!pool.includes(c))pool.push(c);}); // 첫 등장 전·적대 중·몬스터는 픽업도 잠금(0445)
    // SSR이 하나도 없는 배너(소속 한정 등)에는 상시 SSR을 넣어 SSR이 항상 나올 수 있게
    if(pool.length&&!pool.some(c=>c.rarity===3)) G.chars.filter(c=>c.rarity===3&&!c.limited&&Acquire.castOk(c)).forEach(c=>pool.push(c));
    // R·SR이 없는 배너(픽업 캐릭터만 있는 배너, 소속 한정 등)도 상시 R·SR을 넣어 낮은 등급 자리에 SSR이 끼지 않게
    if(pool.length) [1,2].forEach(r=>{ if(!pool.some(c=>c.rarity===r)) G.chars.filter(c=>c.rarity===r&&!c.limited&&Acquire.castOk(c)).forEach(c=>pool.push(c)); });
    if(pool.length) return pool; const open=G.chars.filter(c=>!c.limited&&Acquire.castOk(c)); return open.length?open:G.chars; // 비면 열린(첫 등장·적대·몬스터 잠금 아닌) 캐릭터로 — 예전엔 모든 캐릭터라 잠긴 캐릭터가 나왔음
  }

    /* 바리에이션 공통 설정 읽기(없으면 엔진 기본형 — id 고정이라 발견 기록과 맞음, 바꿀 때는 conSave가 G.meta.variants에 씀) */
static VARIANTS(){ return Array.isArray(G.meta.variants)?G.meta.variants:clone(GGMConstruct.VARIANT_DEFAULTS); }

  static conTargets(tpl){ return G.chars.filter(c=>!c.alt&&!c.cvar&&Characters.own(c.id)&&GGMConstruct.condMatch(tpl.cond,c,{own:Characters.own(c.id),affLv:Core.affLv(Characters.own(c.id)),cleared:P().cleared})); }

  static async conMakeVariant(b,tpl){
    const rr=tpl.rarity==='same'||!tpl.rarity?String(b.rarity):String(tpl.rarity); let c=null;
    const brief=`${tpl.name}. ${GGMConstruct.designBrief(b,tpl)}`;
    if(SAMPLE){ try{ c=await Characters.aiAltChar(b,brief,rr,null); }catch(e){ c=null; } }
    if(c&&c.name===`${b.name}(${brief.replace(/[()]/g,'').slice(0,6)})`) c.name=`${b.name}(${tpl.name})`; // AI가 이름을 못 지으면 aiAltChar가 디자인 지시 앞 글자로 지어 깨짐 → 기본형 이름으로
    if(!c){ // AI가 없거나 실패: 원래 캐릭터를 바탕으로 규칙대로 만들어요(이름·외모 태그 + 기본형 의상 태그 + 상징 컬러·아이템)
      const o=clone(b); delete o.id; o.name=`${b.name}(${tpl.name})`; o.naiPrompt=GGMConstruct.variantPrompt(b,tpl); o.rarity=+rr;
      c=Characters.cleanChar(o); G.chars.push(c); } // 프로필 등은 기본 캐릭터를 그대로 물려받음(바꾸면 수정치로 굳어 기본 캐릭터를 고쳐도 반영 안 됨) — 이 모습의 차이는 이름·외모 태그
    c.alt=b.id; c.cvar=tpl.id; c.altCanon=false; c.rarity=+rr||b.rarity; c.faction=b.faction||c.faction; if(b.age) c.age=b.age; if(b.voiceId) c.voiceId=b.voiceId; if(b.naiStyle) c.naiStyle=b.naiStyle;
    const want=String(tpl.prompt||'').split(',')[0].trim(); if(want&&!String(c.naiPrompt||'').includes(want)) c.naiPrompt=GGMConstruct.variantPrompt(Object.assign({},b,{naiPrompt:c.naiPrompt||b.naiPrompt}),tpl);
    Core.mark('c:'+c.id); return c; }

    /* 캐릭터의 기술 컷인 그림 칸 c.scg: 새 값 · 쓰기(맞춰 저장하고 돌려줌 — 그릴 때·올릴 때·불러오기) · 읽기(없으면 새 값을 보여 주기만) */
static scgNew(c){ return {id:'sc_'+c.id,kind:'scg',name:c.name+' 기술 컷인',prompt:'',img:null}; }

  static scgSlot(c){ if(!c) return null; if(!c.scg||typeof c.scg!=='object') c.scg=Characters.scgNew(c); c.scg.id=c.scg.id||'sc_'+c.id; c.scg.kind='scg'; return c.scg; }

  static scgFixAll(g){ (g.chars||[]).forEach(c=>{ if(c.scg) Characters.scgSlot(c); }); } // 불러오기(fix): 있는 칸의 id·종류만 맞춤

  static crewOrder(){return [...G.chars].sort((a,b)=>(Characters.own(b.id)?1:0)-(Characters.own(a.id)?1:0)||b.rarity-a.rarity||(a.ord||0)-(b.ord||0));}

  static stagePower(s){return Math.round(s.enemies.reduce((a,e)=>a+enemyPower(e),0)*1.15);}

  static readCharForm(c){
    const name=$('#f_name').value.trim(); if(!name){CoreView.toast('이름을 입력해 주세요');return false;}
    const aff={}; lines($('#f_aff').value).forEach(l=>{const m=l.match(/^(\d+)\s*[:：]\s*(.+)$/); if(m)(aff[m[1]]=aff[m[1]]||[]).push(m[2]);});
    const files=lines($('#f_files').value).map(l=>{const m=l.match(/^(\d)\s*[:：]\s*(.+)$/);return m?{dup:+m[1],text:m[2]}:{dup:1,text:l};});
    Object.assign(c,{baseStatsVersion:1,name,faction:$('#f_fac').value.trim(),rarity:+$('#f_rar').value,role:(Rules.posById($('#f_pos').value)||Core.posOf(c)).base,pos:(Rules.posById($('#f_pos').value)||Core.posOf(c)).id,elem:$('#f_elem').value,limited:$('#f_lim').value==='1',
      hp:num($('#f_hp').value,100,1e10,1000),atk:num($('#f_atk').value,10,9999,100),def:num($('#f_def').value,0,1e8,50),spd:num($('#f_spd').value,30,300,100),
      profile:$('#f_prof').value.trim(),intro:$('#f_intro').value.trim(),lines:lines($('#f_lines').value),affLines:aff,files,
      lvLines:lines($('#f_lv').value),dupLines:lines($('#f_dup').value),
      touch:{head:lines($('#f_head').value),body:lines($('#f_body').value),pet:(c.touch&&c.touch.pet)||[]},naiPrompt:$('#f_nai').value.trim(),noDesign:$('#f_nodesign')?$('#f_nodesign').checked:!!c.noDesign});
    c.weapon=Object.assign(c.weapon||{id:'w_'+c.id,img:null},{name:$('#f_wn').value.trim(),desc:$('#f_wd').value.trim(),prompt:$('#f_wp').value.trim()});
    CoreView.naiBlocksSave(c,'naiPrompt','f_nai');CoreView.naiBlocksSave(c.weapon,'prompt','f_wp');
    if(!c.weapon.id||c.weapon.id==='w_') c.weapon.id='w_'+c.id;
    c.skill={name:$('#f_sk').value.trim()||'스킬',kind:$('#f_kind').value,power:num($('#f_pow').value,0.1,10,1.5),cd:num(Math.round($('#f_cd').value),1,9,3),desc:$('#f_skd').value.trim()};
    return true;
  }

  static async handleSettingsAndAudioAction(a,t,id,p,e){
    switch(a){
  case 'pxopen': CoreView.openProxySet(); break;
  case 'pxsave': { const v=$('#px_url').value.trim(); if(v&&!/^https:\/\//.test(v)){ CoreView.toast('https:// 로 시작하는 주소를 넣어 주세요'); break; } appStorage.setItem('ggm-proxy',v); PXHOSTS.clear(); CoreView.closeModal(); Challenge.render(); CoreView.toast(v?'중계 서버를 저장했어요':'중계 서버를 껐어요'); break; }
  case 'pxtest': { const v=$('#px_url').value.trim(); if(!v){CoreView.toast('주소를 넣어 주세요');break;} const done=CoreView.busy(t); try{ const r=await fetch(v.replace(/\/+$/,'')+'/?u='+encodeURIComponent('https://raw.githubusercontent.com/'+RELEASE_REPO+'/main/version.json')); CoreView.toast(r.ok?'중계 서버가 잘 동작해요':'중계 서버 응답: '+r.status); }catch(e){ CoreView.toast('중계 서버에 연결하지 못했어요'); } done(); break; }
  case 'appre': { CoreView.readAp(); const x=OAI_PRESETS[+t.dataset.i]; if(!x) break; APD.base=x[1]; if(x[2]&&!APD.model) APD.model=x[2]; if(!APD.name||APD.name===AITYPE.openai||OAI_PRESETS.some(y=>y[0]===APD.name)) APD.name=x[0]; if($('.sw-card')) ArtView.renderSetup(); else CharactersView.openAp(); break; }
  case 'setupopen': CoreView.closeModal(); ArtView.showSetup(); break;
  case 'setname': p.player=($('#nm_in').value.trim()||'').slice(0,12); { const cv=$('#nm_call')&&$('#nm_call').value.trim().slice(0,12); if(cv&&cv!==System.T('player')){ G.meta.terms.player=cv; Core.mark('meta'); } } Core.mark('prog'); CoreView.closeModal(); SystemView.playStory('프롤로그',G.opening.prologue,Story.afterPrologue); break;
  case 'playmode': { if(System.subLocked()){ CoreView.toast('구독한 게임은 플레이 전용이에요. 고치려면 설정 → 게임에서 구독 끊기를 하세요'); break; } const on=!System.playMode(); try{ appStorage.setItem('ggm-play',on?'1':'0'); }catch(e){} Challenge.render(); CoreView.toast(on?'플레이 모드를 켰어요. 만들기·편집 메뉴가 숨겨져요':'플레이 모드를 껐어요'); break; }
  case 'sttab': CharactersView.settingsNavigate(t.dataset.k||''); break;
  case 'setsec': p.sec=id; Core.mark('prog'); CoreView.closeModal(); tab='lobby'; Challenge.render(); break;
  case 'apnew': APD={id:'',type:'vertex',pub:'google',name:'',region:'global'}; CharactersView.openAp(); break;
  case 'apedit': { const p=System.AIP().list.find(x=>x.id===id); if(!p) break; APD=JSON.parse(JSON.stringify(p)); CharactersView.openAp(); break; }
  case 'apsave': { const d=CoreView.readAp(); if(!Core.apValid(d)){CoreView.toast('키와 모델 정보를 확인해 주세요');break;} const A=System.AIP(); if(!d.id){d.id='p'+uid();A.list.push(d);if(!A.list.some(x=>x.id===A.active))A.active=d.id;} else {const i=A.list.findIndex(x=>x.id===d.id);A.list[i]=d;} System.saveAIP(A); CoreView.closeModal(); Challenge.render(); CoreView.toast('저장했어요'); break; }
  case 'apdel': { if(!(await appConfirm('이 AI를 삭제할까요?'))) break; const A=System.AIP(); A.list=A.list.filter(x=>x.id!==APD.id); if(A.active===APD.id) A.active=(A.list[0]||{}).id||''; System.saveAIP(A); CoreView.closeModal(); Challenge.render(); break; }
  case 'apuse': { const A=System.AIP(); A.active=id; System.saveAIP(A); Challenge.render(); CoreView.toast('이 AI를 쓸게요'); break; }
  case 'apfb': { const A=System.AIP(); A.fallback=!A.fallback; System.saveAIP(A); Challenge.render(); break; }
  case 'aptest': { const d=CoreView.readAp(); if(!Core.apValid(d)){CoreView.toast('키와 모델 정보를 확인해 주세요');break;} const done=CoreView.busy(t,'확인 중…');
        try{ const r=await Core.aiOne(Object.assign({},d,{id:d.id||'tmp'}),'연결 테스트다. {"ok":true}를 그대로 출력하라.','quick'); CoreView.toast(r&&r.ok?'연결 성공':'응답은 왔지만 형식이 달라요'); }
        catch(e){ CoreView.toast(AIERR[e&&e.code]?AIERR[e.code]+(e.message?' '+e.message:''):('연결 실패. '+((e&&e.message)||''))); }
        finally{ done(); } break; }
  case 'llmopen': CoreView.openModal(SystemView.llmHTML()); break;
  case 'llmsave': { const L=Core.llmSlots(); Object.assign(L,{top:$('#llm_top').value,mid:$('#llm_mid').value,bot:$('#llm_bot').value,tag:$('#llm_tag')?$('#llm_tag').value:(L.tag||'')}); Characters.saveLlm(L); CoreView.toast('글 AI 지침을 저장했어요'); CoreView.closeModal(); Challenge.render(); break; }
  case 'llmtog': { const L=Core.llmSlots(), x=L.presets.find(q=>q.id===id); if(!x) break; x.on=!!t.checked; Characters.saveLlm(L); CoreView.toast(`「${x.name}」 ${x.on?'켜짐':'꺼짐'}`); break; }
  case 'llmpadd': { const L=Core.llmSlots(), keep={top:$('#llm_top').value,mid:$('#llm_mid').value,bot:$('#llm_bot').value,tag:$('#llm_tag')?$('#llm_tag').value:''}, text=$('#llp_text').value.trim(); if(!text){ CoreView.toast('지침 내용을 적어 주세요'); break; }
        const pid=$('#llp_id').value, nm=$('#llp_name').value.trim()||'지침 '+(L.presets.length+1), pos=$('#llp_pos').value; const x=pid&&L.presets.find(q=>q.id===pid);
        if(x) Object.assign(x,{name:nm,pos,text}); else L.presets.push({id:'lp'+uid(),name:nm,pos,text,on:true}); Object.assign(L,keep); Characters.saveLlm(L); CoreView.openModal(SystemView.llmHTML()); CoreView.toast(x?'프리셋을 고쳤어요':'프리셋을 저장했어요(켜짐)'); break; }
  case 'llmpedit': { const x=Core.llmSlots().presets.find(q=>q.id===id); if(x) SystemView.llmPresetFormFill(x); break; }
  case 'llmpdel': { const L=Core.llmSlots(), x=L.presets.find(q=>q.id===id); if(!x||!(await appConfirm(`「${x.name}」 프리셋을 지울까요?`))) break; L.presets=L.presets.filter(q=>q!==x); Object.assign(L,{top:$('#llm_top').value,mid:$('#llm_mid').value,bot:$('#llm_bot').value,tag:$('#llm_tag')?$('#llm_tag').value:''}); Characters.saveLlm(L); CoreView.openModal(SystemView.llmHTML()); break; }
  case 'llmpcopy': { const x=Core.llmSlots().presets.find(q=>q.id===id); if(!x) break; try{ await navigator.clipboard.writeText(llmCode(x)); CoreView.toast('코드를 복사했어요. 붙여 넣으면 다른 사람이 가져갈 수 있어요'); }catch(e){ if(t.isConnected)CharactersView.openPresetCode('llm',llmCode(x)); } break; }
  case 'llmpimport': CharactersView.openPresetCode('llm'); break;
  case 'sndopen': SystemView.openSound(); break;
  case 'vclearall': { if(!(await appConfirm('저장된 음성을 모두 지울까요? 다시 들으면 새로 만들어져서 요금이 들어요.'))) break; let n=0; try{ for(const k of await System.idbKeys()) if(String(k).startsWith('v_')){ await Core.idbDel(k); n++; } }catch(e){} CoreView.toast(`음성 ${n}개를 지웠어요`); SystemView.openSound(); break; }
  case 'vprebuild': { if(!Core.SND().fishKey){CoreView.toast('Fish Audio 키를 먼저 넣어 주세요');break;}
        const jobs=[]; const add=(c,txt)=>{ if(c&&c.voiceId&&cleanTTS(sub(txt))) jobs.push([c,txt]); };
        const scan=sc=>System.parseScript(sc).forEach(L=>{ if(L.type==='say'&&!isMe(L.who)) add(Characters.findSpeaker(L.who),L.text); });
        scan(G.opening.prologue); G.chapters.forEach(ch=>ch.stages.forEach(st=>{scan(st.pre);scan(st.post);}));
        G.chars.forEach(c=>{ if(!c.voiceId) return; c.episodes.forEach(e=>scan(e.script)); [...c.lines,...c.touch.head,...c.touch.body,c.intro].forEach(x=>add(c,x)); });
        const uniq=[...new Map(jobs.map(j=>[j[0].voiceId+'|'+cleanTTS(sub(j[1])),j])).values()];
        let need=[]; for(const [c,txt] of uniq){ const key='v_'+System.hash(c.voiceId+'|'+Core.SND().fishModel+'|'+cleanTTS(sub(txt))).toString(36)+'_'+cleanTTS(sub(txt)).length; let has=null; try{has=await Core.idbGet(key);}catch(e){} if(!has) need.push([c,txt]); }
        if(!need.length){CoreView.toast('모든 대사 음성이 이미 저장돼 있어요');break;}
        const chars=need.reduce((a,[c,x])=>a+cleanTTS(sub(x)).length,0);
        if(!(await appConfirm(`목소리가 정해진 대원의 대사 중 아직 없는 ${need.length}개(약 ${nf(chars)}자)를 만들어요. 이 만큼 Fish Audio 요금이 들어요. 진행할까요?`))) break;
        CoreView.busy(t); let done=0;
        for(const [c,txt] of need){ try{ await System.ttsBlob(c,txt); done++; CoreView.say(t,`만드는 중 ${done}/${need.length}`); }catch(e){ CoreView.toast('중단: '+(AIERR[e&&e.code]||'')+' '+((e&&e.message)||'')); break; } }
        CoreView.toast(`음성 ${done}개를 저장했어요`); if($('#vstat')) SystemView.openSound(); break; }
  case 'sndsave': { const o=Core.SND(); Object.assign(o,{sfxVol:+$('#sd_xv').value/100,bgmVol:+$('#sd_bv').value/100,voiceVol:+$('#sd_vv').value/100,bgmOn:$('#sd_bon').value==='1',voiceStory:$('#sd_vs').value==='1',voiceLobby:$('#sd_vl').value==='1',voiceLang:$('#sd_lang')?$('#sd_lang').value:'ko',
        fishKey:$('#sd_fk').value.trim(),fishModel:$('#sd_fm').value,elKey:$('#sd_ek').value.trim(),elBase:$('#sd_eb')?$('#sd_eb').value.trim():(o.elBase||''),elModel:$('#sd_em').value,elLen:num($('#sd_el').value,10,300,90),
        scene:{title:$('#sd_title').value,lobby:$('#sd_lobby').value,battle:$('#sd_battle').value,boss:$('#sd_boss').value,gacha:$('#sd_gacha').value}});
        appStorage.setItem(SKEY,JSON.stringify(o)); P().scene=clone(o.scene); Core.mark('prog'); CoreView.closeModal(); Challenge.render(); BGM.name=null; SystemView.sceneBgm(); CoreView.toast('소리 설정을 저장했어요'); break; }
  case 'fishtest': { const k=$('#sd_fk').value.trim(); if(!k){CoreView.toast('Fish Audio 키를 넣어 주세요');break;} const o=Core.SND(); o.fishKey=k; appStorage.setItem(SKEY,JSON.stringify(o));
        try{ await Characters.fishSearch('','',1); CoreView.toast('Fish Audio 연결 성공'); }catch(e){ CoreView.toast('연결 실패. '+(AIERR[e&&e.code]||'')+' '+((e&&e.message)||'')); } break; }
  case 'voice': if($('#modal .sheet.cs-sheet')||$('#modal .sk-card')) MBACK=()=>CharactersCtl.openChar(id); VS={cid:id,sid:t.dataset.s||'',results:[],picks:{},lang:VS.lang||'ko',q:''}; if(!Core.SND().fishKey) CoreView.toast('설정의 소리에서 Fish Audio 키를 먼저 넣어 주세요'); CharactersView.renderVoice(); break;
  case 'vclear': { const c=charById(id); c.voiceId='';c.voiceName=''; Core.mark('c:'+id); CharactersCtl.openChar(id); break; }
  case 'vsearch': { VS.q=$('#vs_q').value.trim(); VS.lang=$('#vs_lang').value; const done=CoreView.busy(t);
        try{ VS.results=await Characters.fishSearch(VS.q,VS.lang,30); VS.picks={}; CharactersView.renderVoice(VS.results.length?'':'검색 결과가 없어요. 다른 단어나 언어 전체로 다시 찾아보세요.'); }catch(e){ CoreView.toast(AIERR[e&&e.code]||('검색 실패. '+((e&&e.message)||''))); done(); } break; }
  case 'vsai': { const c=charById(VS.cid); VS.lang=$('#vs_lang').value;
        if(!Core.SND().fishKey){CoreView.toast('설정의 소리에서 Fish Audio 키를 먼저 넣어 주세요');break;}
        const q=await Core.aiJSON(Characters.vsaiPrompt({c}),CoreView.uiProg(t),'quick');
        if(!q) break; CharactersView.renderVoice('목소리를 찾는 중이에요…');
        const seen=new Map();
        try{ for(const w of strs(q.queries).slice(0,6)){ for(const m of await Characters.fishSearch(w,VS.lang,10)) if(!seen.has(m._id)) seen.set(m._id,m); } }catch(e){ CoreView.toast(AIERR[e&&e.code]||('검색 실패. '+((e&&e.message)||''))); }
        const list=[...seen.values()];
        if(!list.length){ VS.results=[]; CharactersView.renderVoice('검색 결과가 없어요. 언어를 전체로 바꾸거나 직접 검색해 보세요.'); break; }
        const cands=list.slice(0,30).map(m=>({id:m._id,title:m.title,desc:String(m.description||'').slice(0,100),tags:(m.tags||[]).slice(0,6),lang:m.languages}));
        const rk=await Core.aiJSON(Characters.vsaiPrompt2({c,cands}),null,'quick');
        VS.picks={}; const order=[]; if(rk) for(const p of (rk.picks||[])){ const m=seen.get(p.id); if(m&&VS.picks[p.id]===undefined){VS.picks[p.id]=String(p.reason||'');order.push(m);} }
        VS.results=[...order,...list.filter(m=>VS.picks[m._id]===undefined)];
        CharactersView.renderVoice(order.length?'AI가 고른 후보가 위에 있어요. ▶로 샘플을, 대사로 이 캐릭터 대사를 들어 보세요.':''); break; }
  case 'vsplay': Characters.stopVoice(); VOICE.src=t.dataset.u; VOICE.volume=Core.SND().voiceVol; VOICE.play().catch(()=>CoreView.toast('샘플을 재생하지 못했어요')); break;
  case 'vstry': { const c=charById(VS.cid), done=CoreView.busy(t); await CoreView.speak(Object.assign({},c,{voiceId:id}),c.intro||c.lines[0]||c.name); done(); break; }
  case 'vspick': { const c=charById(VS.cid), m=VS.results.find(x=>x._id===id), tg=(VS.sid&&(c.skins||[]).find(x=>x.id===VS.sid))||c; tg.voiceId=id; tg.voiceName=m?m.title:id; Core.mark('c:'+c.id); CoreView.toast(tg===c?`${c.name}의 목소리를 정했어요`:`${System.T('skin')} 「${tg.name}」의 목소리를 정했어요`); CharactersCtl.openChar(c.id); break; }
  case 'vsetid': { const v=$('#vs_id').value.trim(), m=v.match(/[0-9a-f]{32}/i); if(!m){CoreView.toast('보이스 ID를 찾지 못했어요');break;} const c0=charById(VS.cid), c=(VS.sid&&(c0.skins||[]).find(x=>x.id===VS.sid))||c0; c.voiceId=m[0].toLowerCase(); c.voiceName='';
        try{ const j=Characters.okJSON(await System.http('https://api.fish.audio/model/'+c.voiceId,{headers:{Authorization:'Bearer '+Core.SND().fishKey},timeout:20000})); c.voiceName=j.title||''; }catch(e){ Core.quietErr(e,'0510-actions/050-settings-and-audio.js:74'); }
        Core.mark('c:'+c.id); CoreView.toast('목소리를 연결했어요'); CharactersCtl.openChar(c.id); break; }
  case 'elcompose': { const l=libById(id), s=Core.SND(); if(!s.elKey){CoreView.toast('설정의 소리에서 ElevenLabs 키를 넣어 주세요');break;}
        const pr=(($('#li_prompt')&&$('#li_prompt').value.trim())||l.prompt||'').trim(); if(!pr){CoreView.toast('음악 프롬프트를 먼저 채워 주세요');break;}
        l.prompt=pr; Core.mark('l:'+l.id); const done=CoreView.busy(t,'작곡 중… 1~3분');
        try{ await Art.elCompose(l); CoreView.toast(`「${l.name}」 작곡 완료`); ArtView.bgm(l.name,true); if($('#li_name')) CharactersView.openLibItem(l.id); }
        catch(e){ CoreView.toast('작곡 실패. '+(AIERR[e&&e.code]||'')+' '+((e&&e.message)||'')); done(); } break; }
    }
  }

    // 캐릭터 포지션 정하기: 이름이나 id가 맞으면 그 포지션(역할=기본형), 아니면 역할과 기본형이 같은 첫 포지션
static posAssign(c,want){ const P=Rules.POSITIONS(), p=P.find(x=>x.id===want||x.name===want)||P.find(x=>x.base===c.role)||P[0]; if(p){ c.pos=p.id; c.role=p.base; } return c; }

    /* 기본형이 같은 포지션 중에서 고루 배정(포지션이 목록에 없는 캐릭터만) — 규칙 화면의 배정 버튼과 포지션 자동 설계(posAI)가 같이 씀. 배정한 수 */
static posSpread(P){ let n=0; G.chars.forEach(c=>{ if(P.some(p=>p.id===c.pos)) return; const cand=P.filter(p=>p.base===c.role); if(!cand.length) return; c.pos=cand[Core.hashN(c.id)%cand.length].id; Core.mark('c:'+c.id); n++; }); return n; }

    // 보수: 속도는 두고 체력·공격·방어를 같은 비율로 맞춰서 원래 성향(체력형·공격형)은 살려요. mode edge=허용 범위 끝까지만, center=기준값으로
static balNormalize(c,mode='edge'){ const e=Rules.balExpected(c), b=Rules.BAL(), tol=+b.tol/100*.97, /* 반올림 여유 */ now=balPower(c), target=mode==='center'?e:Math.min(e*(1+tol),Math.max(e*(1-tol),now)); const base=c.hp/5+c.atk*3+c.def*2; if(!base||Math.abs(target-now)<1) return false;
    const k=Math.max(.2,(target-c.spd)/base); c.hp=Math.max(10,Math.round(c.hp*k/10)*10); c.atk=Math.max(1,Math.round(c.atk*k)); c.def=Math.max(0,Math.round(c.def*k)); c.skillBalance=null; return true; }

    // AS 리마스터: 세대를 현재 세대 - 허용 차이까지 올리고, 스킬 밸런스를 다시 검사하게 해요(전투 전에 자동으로 다시 맞춰짐)
static balRemaster(c){ const b=Rules.BAL(), cur=v2CurrentGeneration(), want=Math.max(GGMCombat.generation(c),cur-Math.max(0,+b.lag)); if(want===GGMCombat.generation(c)) return false; c.generation=want; c.skillBalance=null; return true; }

    /* 구캐릭터 AS 리마스터(세대 맞추기·점검 c_genlag): 세대만 올리면 스킬 검사는 너무 강한 것만 약화해 예전 스킬이 새 세대에서도 그대로라,
     글 AI가 있으면 저장된 설계 의도(c.skillPlan)와 지금 스킬의 이름·효과를 지키며 새 세대 예산으로 스킬을 다시 설계해요(이름은 그대로).
     글 AI가 없거나 실패하면 세대 표시·스킬 재검사만. 세대를 올렸으면 true */
static async balRemasterAI(c,onProgress){ const from=GGMCombat.generation(c), old=clone(v2Ensure(c)); if(!Characters.balRemaster(c)) return false; const to=GGMCombat.generation(c);
    if(SAMPLE){ try{ const kit=await v2GenerateSkills(c,c.skillConcept||'',onProgress||(()=>{}),{remaster:{from,to,kit:old,plan:c.skillPlan}}); Object.keys(GGMCombat.SLOTS).forEach(s=>{ if(old[s]&&old[s].name&&kit[s]) kit[s].name=old[s].name; });
        c.skills=kit; delete c.skillTuning; c.skillBalance=null; (c.skillDesignLog||=[]).push({kind:'success',text:`구캐릭터 리마스터: ${from}세대 → ${to}세대 예산으로 스킬을 다시 설계(이름·설계 의도 유지)`}); }
      catch(e){ Core.quietErr(e,'balRemasterAI'); (c.skillDesignLog||=[]).push({kind:'failure',text:'리마스터 스킬 재설계를 못 해 세대만 올리고 다시 검사했어요: '+String(e&&e.message||e).slice(0,80)}); } }
    Core.mark('c:'+c.id); await v2ReadyChars([c]); return true; }

  static effPower(ids,enemies){ const fb=Core.factionBonus(ids), n=Math.max(1,enemies.length);
    return ids.map(charById).filter(Boolean).reduce((a,c)=>{ const m=Characters.matchup(c,enemies); return a+Math.round(charPower(c)*(1+(fb[c.faction]||0)/100)*(1+0.25*(m.good-m.bad)/n)); },0); }

  static matchup(c,enemies){let good=0,bad=0;enemies.forEach(en=>{if(BEATS[c.elem]===en.elem)good++;else if(BEATS[en.elem]===c.elem)bad++;});return {good,bad};}

  static autoSquad(stage){
    const busy=busyIds(), en=stage.enemies, pool=G.chars.filter(c=>Characters.own(c.id)&&!busy.has(c.id)&&(!(FORM&&FORM.ctx&&FORM.ctx.allow)||FORM.ctx.allow(c)));
    const score=c=>{const m=Characters.matchup(c,en);return charPower(c)*(1+0.25*m.good-0.2*m.bad);};
    pool.sort((a,b)=>score(b)-score(a));
    const pick=[]; const need=['def','sup'];
    need.forEach(r=>{const c=pool.find(x=>x.role===r&&!pick.includes(x.id)); if(c&&score(c)>=score(pool[Math.min(pool.length-1,5)])*0.7) pick.push(c.id);});
    pool.forEach(c=>{if(pick.length<4&&!pick.includes(c.id))pick.push(c.id);});
    const order={def:0,atk:1,sup:2}; return pick.slice(0,4).sort((a,b)=>order[charById(a).role]-order[charById(b).role]);
  }

  static async rulesRecalc(){ if(!(await appConfirm(`기본형·희귀도 기준으로 모든 ${System.T('crew')}의 체력·공격·방어·속도를 다시 계산할까요? 직접 고친 능력치도 바뀌어요(이격은 원본 비율을 따라가요).`))) return; if(!Rules.rulesSave()) return;
    let n=0; for(const c of G.chars){ if(c.alt) continue; const s=GGMCombat.generateBaseStats(c); Object.assign(c,{hp:s.hp,atk:s.atk,def:s.def,spd:s.spd}); Core.mark('c:'+c.id); n++; } CoreView.toast(`${n}명의 능력치를 다시 계산했어요`); RulesView.openRules(); }

  static async balFix(kind){ const ids=[...document.querySelectorAll('[data-bal]:checked')].map(x=>x.dataset.bal), cs=ids.map(charById).filter(Boolean); if(!cs.length){ CoreView.toast('캐릭터를 골라 주세요'); return; }
    const label={edge:'능력치 범위 안으로',center:'능력치 기준값으로',remaster:'세대 맞추기',skill:'스킬 밸런스 재검사'}[kind]; Core.auditSnap(cs,label); let n=0;
    for(const c of cs){ let ok=false; if(kind==='edge'||kind==='center') ok=Characters.balNormalize(c,kind); else if(kind==='remaster'){ SystemView.syBar(`${c.name} 리마스터 중…`); ok=await Characters.balRemasterAI(c,m=>SystemView.syBar(`${c.name}: ${m}`)); SystemView.syBar(''); } else if(kind==='skill'){ c.skillBalance=null; ok=true; } if(ok){ Core.mark('c:'+c.id); n++; } }
    if(kind==='skill'||kind==='remaster'){ SystemView.syBar('스킬 밸런스 검사 중…'); try{ await v2ReadyChars(cs.filter(c=>!c.skillBalance)); }catch(e){ Core.quietErr(e,'0187-balance.js:44'); } SystemView.syBar(''); }
    CoreView.toast(`${label}: ${n}명 (되돌리기 가능)`); RulesView.openBalance(); }

  static nameTaken(n){ n=String(n||'').trim(); return G.chars.some(c=>c.name===n)||(G.npcs||[]).some(c=>c.name===n); }

  static mkNpc(d){ const o=Characters.npcNew(String(d.name||'').trim().slice(0,20)); return Object.assign(o,{role:String(d.role||'').slice(0,40),profile:String(d.profile||'').slice(0,600),speech:String(d.speech||'').slice(0,120),look:String(d.look||''),naiPrompt:Core.stripAge(String(d.naiPrompt||''))}); }

  static addNpcs(arr){ const out=[]; (Array.isArray(arr)?arr:[]).slice(0,3).forEach(d=>{ if(!d||!String(d.name||'').trim()||Characters.nameTaken(d.name)) return; if(Art.isMonsterLike(d)){ Art.monsterFromGen(d); return; } const n=Characters.mkNpc(d); G.npcs=G.npcs||[]; G.npcs.push(n); out.push(n); }); if(out.length) Core.mark('meta'); return out; }

    // 새 대원: 그 장에서 처음 만나는 '인연'. 데뷔 스테이지를 깨면 상시 계약에 합류해요
static addNewChars(arr,max,stages,opt){ opt=opt||{}; const out=[]; let list=Array.isArray(arr)?arr:(arr&&typeof arr==='object'?[arr]:[]);
    list.slice(0,max).forEach((x,i)=>{ if(!x||!String(x.name||'').trim()||Characters.nameTaken(x.name)) return; if(Art.isMonsterLike(x)){ Art.monsterFromGen(x); return; } /* 몬스터는 캐릭터로 만들지 않고 적으로(0445) */ const c=Characters.sysStats(Characters.cleanChar(x)); if(!c.name) return; c.ord=G.chars.length;
      const st=stages[Math.min(stages.length,Math.max(1,+x.debutStage||1))-1]; if(st) c.debut=st.id; c.bond=String(opt.src||''); c.limited=false;
      if(opt.giftFirst&&!out.length){ c.rarity=Math.min(2,c.rarity||1); Characters.sysStats(c); } // 이벤트 배포: 끝까지 깨면 무료 합류(R·SR)
      else if(opt.ch&&c.rarity<3) (opt.ch.recruits=opt.ch.recruits||[]).push(c.id); // R·SR 인연은 장을 끝까지 깨면 무료 합류
      G.chars.push(c); Core.mark('c:'+c.id); out.push(c); }); return out; }

  static sysStats(c){ const r=[1,2,3].includes(+c.rarity)?+c.rarity:1,i=r-1,B=SYS_BASE[c.role]||SYS_BASE.atk;
    Object.assign(c,GGMCombat.generateBaseStats(c),{baseStatsVersion:1});
    const k=B.sk.includes(c.skill.kind)?c.skill.kind:B.sk[0]; c.skill.kind=k; c.skill.power=SYS_SK[k][i]; c.skill.cd=k==='dmg'?(r===1?2:3):k==='buff'&&r>1?4:3; return c; }

  static async skillResume(){ if(SKILL_RESUME||!SAMPLE) return; const L=G.chars.filter(c=>c.skillPending); if(!L.length) return; SKILL_RESUME=true; const g0=G;
    try{ for(const c of L){ if(G!==g0) break; try{ c.skillGenerationWarning='스킬을 설계하는 중…'; const kit=await v2GenerateSkills(c,'',m=>{c.skillGenerationWarning=m;}); if(G!==g0) break; c.skills=kit; delete c.skillPending; delete c.skillGenerationWarning; await v2QueueCharacter(c); Core.mark('c:'+c.id); }
      catch(e){ if(G!==g0) break; c.skillGenerationWarning='스킬 설계를 마치지 못했어요: '+String(e&&(e.message||e.code)||e).slice(0,80)+' — 스킬 편집기에서 다시 만들 수 있어요'; Core.mark('c:'+c.id); } } }finally{ SKILL_RESUME=false; } }

  static cleanChar0(o){
    o=o||{}; const sk=o.skill||{}, tc=o.touch||{}, w=o.weapon||{}, id=uid(), aff={},tank=o.role==='def'?GGMCombat.generateBaseStats(o):null;
    Object.entries(o.affLines||{}).forEach(([k,v])=>{const n=parseInt(k,10);if(n>=1&&n<=10)aff[n]=strs(v);});
    return {id,genVer:LiveOps.auditGenVer(),ord:G.chars.length,name:String(o.name||'').slice(0,20),age:24,faction:String(o.faction||''),limited:!!o.limited,
      useStanding:o.useStanding===true,rarity:[1,2,3].includes(+o.rarity)?+o.rarity:1,role:ROLE[o.role]?o.role:'atk',elem:ELEMS.includes(o.elem)?o.elem:ELEMS[0],
      baseStatsVersion:1,hp:tank?tank.hp:num(o.hp,600,2000,1000),atk:num(o.atk,60,200,110),def:tank?tank.def:num(o.def,20,120,50),spd:num(o.spd,70,130,100),
      skill:{name:String(sk.name||'스킬').slice(0,20),kind:KIND[sk.kind]?sk.kind:'dmg',power:num(sk.power,0.5,3.2,1.6),cd:num(Math.round(sk.cd),2,5,3),desc:String(sk.desc||'')},
      profile:String(o.profile||''),intro:String(o.intro||''),lines:strs(o.lines).slice(0,12),affLines:aff,lvLines:strs(o.lvLines).slice(0,4),dupLines:strs(o.dupLines).slice(0,3),
      touch:{head:strs(tc.head).slice(0,8),body:strs(tc.body).slice(0,8),pet:strs(tc.pet).slice(0,8)},
      files:(Array.isArray(o.files)?o.files:[]).map(f=>({dup:num(parseInt(f.dup,10),1,5,1),text:String(f.text||'')})).filter(f=>f.text).slice(0,5),
      weapon:{id:'w_'+id,name:String(w.name||''),desc:String(w.desc||''),prompt:String(w.prompt||''),img:null},
      naiPrompt:Characters.allyTags(String(o.naiPrompt||'')),img:null,episodes:[],faces:[],skins:[],illust:{id:'il_'+id,kind:'illust',name:String(o.name||'')+' 일러스트',prompt:'',img:null},upper:{id:'up_'+id,kind:'upper',name:String(o.name||'')+' 상반신',prompt:'',img:null},pose:{id:'po_'+id,kind:'pose',name:String(o.name||'')+' 로비 포즈',prompt:'',img:null},lbbg:{id:'lg_'+id,kind:'lbbg',name:String(o.name||'')+' 로비 배경',prompt:'',img:null},lbcg:{id:'lb_'+id,kind:'lbcg',name:String(o.name||'')+' 돌파 CG',prompt:'',img:null}};
  }

  static cleanChar(o){ const c=Characters.cleanChar0(o);Characters.posAssign(c,o&&o.pos);c.persona=Characters.personaClean(o&&o.persona);c.range=RANGE[o&&o.range]?o.range:'';c.pfields=Characters.pfieldsClean(o&&o.pfields);v2ApplyRoleSpeed(c);c.generation=v2CurrentGeneration();Rules.balanceOnCreate(c); let provided=null;try{if(o?.skills)provided=v2PrepareGenerated(o.skills,c);}catch(e){}c.skills=provided||GGMCombat.generationDefaults(c); if(o?.skills&&!provided)c.skillGenerationWarning='AI 스킬이 규칙에 맞지 않아 기본 스킬로 대체했어요. 스킬 편집기에서 다시 생성할 수 있어요.'; setTimeout(async()=>{try{if(!provided){if(typeof NEW_GAME_SOURCE!=='undefined'&&NEW_GAME_SOURCE&&G!==NEW_GAME_SOURCE){ c.skillPending=true; c.skillGenerationWarning='새 게임을 연 뒤 스킬을 설계해요'; return; } /* 새 게임 생성 중: 저장·새로고침에 끊기지 않게 게임을 연 뒤 skillResume()이 이어서 */ if(SAMPLE){c.skillGenerationWarning='스킬을 구성하고 내부 검사하는 중…';const kit=await v2GenerateSkills(c,'',msg=>{c.skillGenerationWarning=msg;});c.skills=kit;delete c.skillGenerationWarning;}}await v2QueueCharacter(c);}catch(e){c.skillGenerationWarning=String(e.message||e);}if(G.chars.includes(c)){Core.mark('c:'+c.id);if(document.querySelector('.cs-sheet')?.dataset.cid===c.id)CharactersCtl.openChar(c.id);}},0); try{ const en=(G.lib||[]).find(l=>l.kind==='enemy'&&l.name===c.name); if(en&&/^\s*(1girl|1boy|1other)/i.test(en.prompt||'')){ c.naiPrompt=en.prompt; c.fromEnemy=en.id; } }catch(e){} Characters.naiBlocksRemember(c);return c; }

  static drDedup(d){ d=d||DR2; const seen=[]; let n=0; const run=(o,k)=>{ if(!o||!String(o[k]||'').trim()) return; const r=NewGame.dedupText(o[k],seen); if(r.cut){ o[k]=r.text; n+=r.cut; } };
    if(dupTxt(d.kw,d.tone)){ d.tone=''; n++; } run(d,'kw'); run(d,'tone'); run(d,'world'); run(d,'setting'); run(d,'story'); run(d.hero,'bio'); (d.chars||[]).forEach(c=>{ run(c,'role'); run(c,'profile'); });
    return n; }

  static artReuse(ng,src){ if(!src) return null; const og=src.g, ids=new Set(), nm=x=>nameKey(x), add=o=>{ if(o&&o.id&&o.img) ids.add(o.id); }, idMap=new Map(), setId=(o,nid)=>{ if(o.id!==nid){ idMap.set(o.id,nid); o.id=nid; } };
    const faces=fs=>(fs||[]).forEach(f=>{ add(f); if(f&&f.up) add(f.up); });
    let nc=0; (ng.chars||[]).forEach(c=>{ const o=(og.chars||[]).find(x=>nm(x.name)===nm(c.name)); if(!o||!o.img) return;
      if(!(ng.chars||[]).some(x=>x!==c&&x.id===o.id)) setId(c,o.id); ['naiPrompt','naiStyle','naiPose','naiFrame','voiceId','voiceName'].forEach(k=>{ if(o[k]!=null&&o[k]!=='') c[k]=o[k]; }); c.img=o.img; add(o);
      ['upper','illust','lbcg','pose','lbbg','scg'].forEach(k=>{ if(o[k]&&o[k].img){ c[k]=JSON.parse(JSON.stringify(o[k])); add(o[k]); } }); if(o.weapon&&o.weapon.img&&nm(o.weapon.name)===nm(c.weapon&&c.weapon.name)){ c.weapon=JSON.parse(JSON.stringify(o.weapon)); add(o.weapon); }
      if((o.faces||[]).length){ c.faces=JSON.parse(JSON.stringify(o.faces)); faces(o.faces); } if(o.faceMask) c.faceMask=o.faceMask;
      const sk=(o.skins||[]).filter(k=>k&&k.img&&!k.shop); if(sk.length){ c.skins=JSON.parse(JSON.stringify(sk)); sk.forEach(k=>{ add(k); faces(k.faces); ['upper','illust','lbcg'].forEach(x=>add(k[x])); }); } nc++; });
    let nn=0; (ng.npcs||[]).forEach(n=>{ const o=(og.npcs||[]).find(x=>nm(x.name)===nm(n.name)); if(!o||!o.img) return; setId(n,o.id); n.naiPrompt=o.naiPrompt||n.naiPrompt; n.img=o.img; add(o); if(o.upper&&o.upper.img){ n.upper=JSON.parse(JSON.stringify(o.upper)); add(o.upper); } if((o.faces||[]).length){ n.faces=JSON.parse(JSON.stringify(o.faces)); faces(o.faces); } nn++; });
    let nl=0; (ng.lib||[]).forEach(l=>{ if(!['bg','prop','enemy','icon'].includes(l.kind)) return; const o=(og.lib||[]).find(x=>x.kind===l.kind&&nm(x.name)===nm(l.name)&&x.img); if(!o) return; setId(l,o.id); l.img=o.img; l.prompt=o.prompt||l.prompt; add(o); nl++; });
    if(og.prog&&og.prog.avatar&&og.prog.avatar.img&&!(ng.prog&&ng.prog.avatar)){ ng.prog.avatar=JSON.parse(JSON.stringify(og.prog.avatar)); add(og.prog.avatar); }
    if(og.meta){ if(!ng.meta.artTags&&og.meta.artTags) ng.meta.artTags=og.meta.artTags; if(!ng.meta.artNeg&&og.meta.artNeg) ng.meta.artNeg=og.meta.artNeg; }
    NewGame.remapIds(ng,idMap); // 관계·톡·배너가 바뀐 id를 가리키게(안 그러면 관계가 '없는 인물'로 보여 지워져요)
    return {ids:[...ids],ns:src.ns,nc,nn,nl}; }

  static async drPolishHero(rep){ const h=DR2.hero;
    const r=await Core.aiJSON(Characters.drPolishHeroPrompt({h}),rep,'default');
    if(!r||typeof r!=='object') return; CoreView.drRead(); Core.drSnap('주인공'); const S=v=>typeof v==='string'?v.trim():''; const H=DR2.hero;
    if(S(r.call)) H.call=S(r.call).slice(0,12); if(S(r.name)&&!String(H.name||'').trim()) H.name=S(r.name).slice(0,12); if(S(r.look)) H.look=S(r.look).slice(0,400); if(S(r.bio)) H.bio=S(r.bio).slice(0,1500);
    Characters.drDedup(); Core.drSave(); CoreView.drRerender(); CoreView.toast('주인공을 다듬었어요. 마음에 안 들면 「되돌리기」'); }

    /* 전체 맞추기: 세계관·설정·스토리·인물·주인공 설정을 한꺼번에 보고, 서로 어긋난 곳을 고치고 관계를 엮어요. 적힌 내용은 살리고, 한 번 되돌릴 수 있어요 */
static async drHarmony(rep){ CoreView.drRead(); const d=DR2; if(!Core.drText(d).trim()){ CoreView.toast('먼저 세계관이나 인물을 조금 적어 주세요'); return; }
    const r=await Core.aiJSON(Characters.drHarmonyPrompt({d}),rep,'complex');
    if(!r||typeof r!=='object'){ return; } CoreView.drRead();
    Core.drSnap('전체 맞추기');
    const S=v=>typeof v==='string'?v.trim():'';
    ['world','setting','story'].forEach(k=>{ if(String(d[k]||'').trim()&&S(r[k])) d[k]=S(r[k]); });
    if(String(d.kw||'').trim()&&S(r.kw)) d.kw=S(r.kw).slice(0,400); if(String(d.tone||'').trim()&&S(r.tone)) d.tone=S(r.tone).slice(0,200);
    const rc=Array.isArray(r.chars)?r.chars:[]; d.chars.forEach((c,i)=>{ const o=rc[i]||rc.find(x=>x&&x.name&&x.name===c.name); if(!o) return; ['role','profile','speech','look'].forEach(k=>{ if(S(o[k])) c[k]=S(o[k]); }); if(!String(c.name||'').trim()&&S(o.name)) c.name=S(o.name); });
    if(String(d.hero.bio||'').trim()&&S(r.heroBio)) d.hero.bio=S(r.heroBio);
    const dn=Characters.drDedup(d); Core.drSave(); CoreView.drRerender(); CoreView.toast('서로 맞춰 다듬었어요'+(dn?` (겹치는 문장 ${dn}개 정리)`:'')+'. 마음에 안 들면 「되돌리기」'); }

    /* 원정 칸 형식 맞춤(빠진 하위 칸: 인지도·컨디션·일정·제안·연속·기록·경영, 기록 시작 시각) + 방송 출연 모드면 오늘의 출연 제안(보유 캐릭터마다 하루 한 번, 무작위라 만들어 저장) — 진행 칸 exped의 정의(0070 PROG_SLOTS)가 그리기 전에 부름 */
static expedFill(s){ for(const [k,v] of [['fame',{}],['cond',{}],['jobs',{}],['offers',{}],['streak',{}],['lib',[]]]) if(!s[k]||typeof s[k]!=='object') s[k]=v; if(!s.biz||typeof s.biz!=='object') s.biz={assign:{},at:0,rep:0}; if(!s.libAt) s.libAt=Date.now();
    if(Expedition.exMode()==='idol'){ const day=today(); for(const c of G.chars) if(Characters.own(c.id)){ const o=s.offers[c.id]; if(!o||o.day!==day) s.offers[c.id]={day,...GGMExpedition.idolOffers(s.fame[c.id]||0,Expedition.EXC())}; } } return s; }

  static cxNewFast(){ const p=P(), sig=[Object.keys(p.cleared).length,Object.keys(p.owned).length,World.cxStore().length,G.lib.length,G.chapters.length,Object.keys(Core.progRead('cxSeen')).length,Object.keys(p.cxBadge||{}).length].join('|'); if(CXMEMO&&CXMEMO.sig===sig) return CXMEMO.n; const s=Core.progRead('cxSeen'), bd=p.cxBadge||{}; const n=World.cxEntries().filter(e=>e.open&&!s[e.key]&&!bd[e.key]).length; CXMEMO={sig,n}; return n; }

    // 2장 이후 첫 등장(debutLater) 캐릭터가 새 장 대본에서 처음 말하면 그 스테이지를 첫 등장으로
static debutResolve(ch){ let n=0; G.chars.filter(c=>c.debutLater).forEach(c=>{ const re=new RegExp('(^|\\n)'+String(c.name).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(\\s*\\[[^\\]]*\\])?\\s*[:：]'); const s=(ch.stages||[]).find(s=>re.test((s.pre||'')+'\n'+(s.post||''))); if(s){ c.debut=s.id; delete c.debutLater; Core.mark('c:'+c.id); n++; } }); return n; }

  static relObj(ref){ if(!ref||ref===REL_ME||ref.startsWith('x:')) return null; return charById(ref)||(G.npcs||[]).find(n=>n.id===ref)||null; }

  static relKeys(){ const out=[]; const add=(ref,o)=>{ const k=[o.name]; const f=String(o.name).split(/[\s(]/)[0]; if(f&&f.length>=2&&f!==o.name) k.push(f); out.push([ref,k]); };
    G.chars.forEach(c=>add(baseChar(c).id,c)); (G.npcs||[]).forEach(n=>add(n.id,n)); World.RELS().forEach(r=>[r.a,r.b].forEach(x=>{ if(x.startsWith('x:')&&!out.some(o=>o[0]===x)) out.push([x,[x.slice(2)]]); })); return out; }

  static loreOpts(cur){ return [['','정사 — 관계·기억(로어북)에 반영'],['if','IF 스토리 — 로어북에 반영 안 함'],...G.chars.filter(c=>c.alt&&charById(c.alt)).map(c=>[c.id,'이격 「'+c.name+'」의 기록에만 반영'])]; }

  static fwRead(){ const F=World.factionSync(), lines=v=>String(v||'').split('\n').map(l=>l.split('|').map(s=>s.trim())).filter(x=>x[0]);
    document.querySelectorAll('#modal [data-fw]').forEach(el=>{ const k=el.dataset.fw.split('.'), v=el.type==='checkbox'?el.checked:el.value;
      if(k[0]==='cast'){ G.meta.cast=Object.assign({},G.meta.cast,{[k[1]]:v}); return; }
      if(k[0]==='m'){ const l=G.lib.find(x=>x.id===k[1]); if(l){ l[k[2]]=String(v).trim(); Core.mark('l:'+l.id); } return; }
      if(k[0]==='c'){ const c=charById(k[1]); if(c&&(c.debut||'')!==v){ if(v) c.debut=v; else delete c.debut; Core.mark('c:'+c.id); } return; }
      const f=F[+k[1]]; if(!f) return;
      if(k[2]==='rel'){ f.rel={}; lines(v).forEach(([a,b])=>{ if(a&&a!==f.name) f.rel[a]=b||''; }); }
      else if(k[2]==='stance'){ f.stance=lines(v).map(([ch,s,why])=>({ch:Math.max(1,+ch||1),s:FSTANCE[s]?s:'neutral',why:why||''})); }
      else if(k[2]==='name'){ const n=String(v).trim(); if(n&&n!==f.name){ const old=f.name; G.chars.forEach(c=>{ if(c.faction===old){ c.faction=n; Core.mark('c:'+c.id); } }); F.forEach(o=>{ if(o.rel[old]!=null){ o.rel[n]=o.rel[old]; delete o.rel[old]; } }); f.name=n; } }
      else f[k[2]]=String(v).trim(); }); Core.mark('world','meta'); }

    // 게시할 콘텐츠: 공유 팩과 같은 기준(진행·키·음성·소리 파일 없음). 픽업·이벤트는 메인 진행에 맞춰 열려요
static pubContent(){ const game=JSON.parse(JSON.stringify(G)); delete game.prog; delete game.rels; (game.chars||[]).forEach(c=>{ delete c.voiceId; delete c.voiceName; }); (game.lib||[]).forEach(l=>{ if(l.audio) l.audio=null; });
    game.rels=JSON.parse(JSON.stringify(World.RELS()));
    const S=game.chapters.filter(ch=>ch.kind==='main').reduce((n,ch)=>n+ch.stages.length,0), spread=arr=>arr.forEach((x,k)=>{ x.gate=Math.min(S,x.gate>0?x.gate:Math.max(1,Math.round((k+1)*S/(arr.length+1)))); });
    spread(game.events||[]); spread((game.banners||[]).filter(b=>b.id!=='std'&&!b.eventId)); game.meta.gated=S>0;
    (game.banners||[]).forEach(b=>{ delete b.until; if(b.id!=='std'){ b.active=true; delete b.newAt; } }); (game.events||[]).forEach(e=>{ delete e.until; e.active=true; });
    if(!String(game.meta.artTags||'').trim()){ try{ const c=Core.naiCfg(), b=c.styles.find(x=>x.id===c.styleId)||c.styles[0]; if(b&&String(b.tags||'').trim()){ game.meta.artTags=b.tags; game.meta.artNeg=b.neg||''; } }catch(e){} }
    delete game.meta.subscr; if(game.meta.pub) game.meta.pub={slug:game.meta.pub.slug,ver:game.meta.pub.ver};
    return game; }

  static async handleUpdatesAction(a,t,id,p,e){
    switch(a){
  case 'webupdcheck': System.checkWebUpdate(true); break;
  case 'webupdgo': System.applyWebUpdate(CoreView.uiProg(t)); break;
  case 'webupdskip': { const o=Core.LV(); if(WEBUPD) o.webSkip=WEBUPD.build; LiveOps.saveLV(o); CoreView.closeModal(); CoreView.toast('다음 버전이 나오면 다시 알려 드릴게요'); break; }
  case 'updel': { const c=charById(id); if(!c||!c.upper) break; c.upper.img=null; Core.mark('c:'+c.id); CharactersCtl.openChar(c.id); break; }
  case 'upd-open': SystemView.openUpdSet(); break;
  case 'updcheck': LiveOpsView.checkUpdate(true); break;
  case 'updget': { const done=CoreView.busy(t,'받는 중…'); await LiveOpsView.applyUpdate(false); done(); break; }
  case 'updskip': { const o=Core.LV(); if(UPD) o.skip=UPD.man.build; LiveOps.saveLV(o); CoreView.closeModal(); CoreView.toast('이 버전은 다시 묻지 않아요. 설정에서 직접 확인할 수 있어요'); break; }
  case 'apkget': CoreView.openUrl(t.dataset.url); break;
  case 'relnotes': CoreView.openUrl('https://github.com/'+Core.updRepo(Core.LV())+'/releases/latest'); break;
  case 'uprollback': { const prev=await appStorage.readLive('starfall-live-prev'); if(!prev) break; const o=Core.LV(); const b=(prev.match(/var BUILT='([^']+)'/)||[])[1]||'';
        if(o.on&&o.build) o.badBuild=o.build;
        if(!b||Core.verCmp(b,window.__SHELL__||APP_BUILD)<=0){ o.on=false; LiveOps.saveLV(o); CoreView.toast('이전 버전이 설치 버전보다 오래돼서 설치 버전으로 돌아가요'); setTimeout(()=>{SystemView.reloadGame(location.pathname+'?builtin=1');},900); break; }
        const cur=await appStorage.readLive('starfall-live-html'); await appStorage.writeLive('starfall-live-html',prev); if(cur) await appStorage.writeLive('starfall-live-prev',cur);
        Object.assign(o,{on:true,prevBuild:o.build,build:b,boots:0,sha:''}); LiveOps.saveLV(o); SystemView.reloadGame(); break; }
  case 'upbuiltin': { const o=Core.LV(); if(o.on&&o.build) o.badBuild=o.build; o.on=false; LiveOps.saveLV(o); SystemView.reloadGame(location.pathname+'?builtin=1'); break; }
    }
  }

  static findSpeaker(n){return G.chars.find(c=>c.name===n||c.name.split(' ')[0]===n);}

  static npcBy(n){return (G.npcs||[]).find(c=>c.name===n||c.name.split(' ')[0]===n);}

  static vnSpeaker(n){ const c=Characters.findSpeaker(n); if(c) return c; const m=Characters.npcBy(n); return m&&Characters.imgSrc(m)?m:null; } // 그림 없는 NPC는 이름만(빈 스탠딩 안 띄움)

  static vnPrefetch(){ if(!Core.SND().voiceStory) return; let n=0; for(let k=S.i;k<S.lines.length&&n<2;k++){const L=S.lines[k]; if(L.type==='say'&&!isMe(L.who)){const c=Characters.findSpeaker(L.who); if(c&&c.voiceId){Core.prefetchTTS(c,L.text);n++;}}} }

  static vnAutoNext(){if(!S||!S.auto||S.typing||S.choice)return;clearTimeout(S.autoT);const go=()=>{if(S&&S.auto&&!S.typing&&!S.choice)S.autoT=setTimeout(CoreView.vnStep,600);};if(!VOICE.paused&&!VOICE.ended){VOICE.onended=go;}else S.autoT=setTimeout(CoreView.vnStep,1000+S.full.length*40);}

  static autoEmote(text){ const t=String(text||'').trim(); for(const [k,d] of Object.entries(EMOTES)) if(d.k&&d.k.test(t)) return k; return ''; }

  static dirMode(){ const m=P().vnDirect; return m==='script'||m==='off'?m:'auto'; }

  static fieldText(r){ const d=r&&FIELDS[r.k]; return d?`${d.n}: ${d.d(r.a)}`:''; }

    /* 훈련 기록 형식 이전(불러오기 fix가 부름): 단계가 바뀌어서(5→10단계, 권장 레벨) 예전 3단계 이상 기록은 다시 깨야 소탕 */
static farmClearV2(pr){ if(pr.farmV===2) return; Object.keys(pr.farmClear).forEach(k=>{ const m=k.match(/^farm_.+_(\d+)$/); if(m&&+m[1]>=3) delete pr.farmClear[k]; }); pr.farmV=2; }

  static farmRec(lv){ return FARM_LV[Math.max(0,Math.min(FARM_N-1,lv-1))]; }

  static farmStage(key,lv){
    const f=G.meta.farms.find(x=>x.key===key)||{name:key}, rec=Characters.farmRec(lv), m=(1+0.06*(rec-1))*(1+0.04*lv);
    const e=(n,i,boss)=>({name:n,elem:ELEMS[(lv+i)%ELEMS.length],hp:Math.round(950*m*(boss?3:1)),atk:Math.round(82*m*(boss?1.2:1)),def:Math.round(32*m),spd:92+lv*2,boss:!!boss});
    const en=[e('훈련 표적',0),e('훈련 표적',1)]; if(lv>=3) en.push(e('강화 표적',2)); if(lv>=6) en.push(e('훈련 교관',0,true));
    // 권장 레벨 대원 4명의 전투력보다 조금 낮게 맞춰요(10레벨 낮으면 버거워요)
    const lm=1+0.06*(rec-1), up=c=>{ const r=RMUL[c.rarity]||1; return unitPower({hp:(+c.hp||1150)*r*lm,atk:(+c.atk||130)*r*lm,def:(+c.def||60)*r*lm,spd:+c.spd||100}); };
    const top=(G.chars.length?G.chars.map(up):[up({})]).sort((a,b)=>b-a).slice(0,4); while(top.length<4) top.push(top[top.length-1]);
    const ref=top.reduce((a,b)=>a+b,0)/1.12;
    for(let k=0;k<2;k++){ const f=ref/Characters.stagePower({enemies:en}); en.forEach(x=>{ x.hp=Math.round(x.hp*f); x.atk=Math.round(x.atk*f); x.def=Math.round(x.def*f); }); }
    return {id:`farm_${key}_${lv}`,title:`${f.name} ${lv}단계 (권장 Lv.${rec})`,enemies:en,reward:0,pre:'',post:'',farm:{key,lv}};
  }
}

class CharactersView {
  static chipIsOn(el){ return el.classList.contains('on'); }

  static hearts(x,y,n){for(let i=0;i<n;i++){const h=document.createElement('div');h.className='hrt';h.textContent='♥';h.style.left=(x-8)+'px';h.style.top=(y-10)+'px';h.style.setProperty('--dx',(Math.random()*70-35).toFixed(0)+'px');h.style.animationDelay=(i*0.08)+'s';document.body.appendChild(h);setTimeout(()=>h.remove(),1300);}}

  static petTick(P0){ const {kind,el,c,x,y}=P0, o=Characters.own(c.id), lv=o?Core.affLv(o):1, im=kind==='poke'?document.querySelector('.lobby .lobby-art,.lobby .lobby-ill'):el.querySelector('.art');
    if(im){ im.classList.remove('r-pet'); void im.offsetWidth; im.classList.add('r-pet'); }
    CharactersView.hearts(x,y,lv>=5?3:1+(P0.n%2));
    if(P0.n===1){ const f=im&&(im.classList.contains('lobby-ill')||im.classList.contains('lobby-pose'))?'':Characters.pickFace(c,lv>=4?['미소','수줍음','부끄럼','웃음','평온']:['당황','수줍음','부끄럼','놀람','평온']); if(f&&im&&im.tagName==='IMG') CoreView.faceSwap(c,im,f,3200);
      const l=Characters.petLine(c,o), box=kind==='poke'?$('#bubble'):kind==='cspoke'?$('#csSay'):$('#evsLine');
      if(l&&box){ box.textContent=sub(l); box.hidden=false; box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop'); if(kind==='cspoke'){ clearTimeout(window._csT); window._csT=setTimeout(()=>{if(box.isConnected)box.hidden=true;},3200); } if(kind==='evspoke') EVS_LINE=l; if(Economy.voiceOf(c)&&Core.SND().voiceLobby) CoreView.speak(c,l); }
    }
  }

    /* 로비 캐릭터를 눌렀을 때 반응(View): 말풍선 · 감정 연출 · 표정 그림 잠깐 바꾸기 · 물결·하트 · 몸짓 — 호감도·미션 반영은 처리기(Controller)가 먼저 */
static lobbyPokeShow(t,e,c,l,zone,face){
    const el=$('#bubble'); if(el){ el.textContent=sub(l); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); } CharactersView.lobbyEmote(t,l,zone);
    const st=t.querySelector('.lb-stage')||t; const old=st.querySelector('.lobby-art:not(.lobby-pose)'); if(old){ /* 레이어 그림(포즈)은 표정 그림이 없어서 그대로 둬요. 바꾸면 스탠딩으로 고정돼 버렸어요 */ const tmp=document.createElement('div'); tmp.innerHTML=P().lobbyMode==='stand'?CoreView.art(c,'lobby-art react',{face}):CharactersView.lobbyCharacterArt(c,'lobby-art react',face); old.replaceWith(tmp.firstElementChild); clearTimeout(window._faceT); window._faceT=setTimeout(()=>{const cur=document.querySelector('.lobby-art'); if(cur&&tab==='lobby'){const t2=document.createElement('div');t2.innerHTML=P().lobbyMode==='stand'?CoreView.art(c,'lobby-art'):CharactersView.lobbyCharacterArt(c);cur.replaceWith(t2.firstElementChild);}},3500); }
    const x=e.clientX||innerWidth/2, y=e.clientY||innerHeight/2, lv=Core.affLv(Characters.own(c.id)); CoreView.ripple(x,y,lv>=7); if(lv>=5&&zone!=='body') CharactersView.hearts(x,y,Math.min(5,lv-3)); setTimeout(()=>CoreView.charReact(document.querySelector('.lobby .lobby-art,.lobby .lobby-ill'),lv,zone),10); }

    // Native Android prompt can expand past the keyboard when a long code is pasted.
  // Keep long text in its field and the action footer outside the scrolling body.
static openPresetCode(kind,code){
   const exporting=typeof code==='string',llm=kind==='llm',title=(llm?'지침':'그림체')+' 프리셋 '+(exporting?'코드 내보내기':'코드 가져오기'),parent=$('#modal .sheet');
   const draft=[...(parent?.querySelectorAll('input[id],textarea[id],select[id]')||[])].map(el=>({id:el.id,value:el.value,checked:el.checked})),scroll=parent?.scrollTop||0,project=Core.PJ().active;
   CoreView.openModal(`${head(title)}<div class="preset-code-body"><p class="muted preset-code-help">${exporting?'코드를 길게 눌러 복사하거나 전체 선택을 눌러 주세요.':(llm?'GGMLLM:':'GGMPACK:')+'로 시작하는 코드 전체를 붙여 넣어 주세요.'}</p><label class="preset-code-label" for="preset-code-input">프리셋 코드</label><textarea class="in" id="preset-code-input" wrap="soft" spellcheck="false" autocapitalize="off" autocomplete="off" ${exporting?'readonly':''}></textarea><p id="preset-code-error" role="alert" hidden></p></div><div class="preset-code-actions"><button type="button" class="btn ghost" data-preset-code-action="cancel">${exporting?'닫기':'취소'}</button><button type="button" class="btn" data-preset-code-action="accept" ${exporting?'':'disabled'}>${exporting?'전체 선택':'가져오기'}</button></div>`,false,'preset-code-sheet');
   const modal=$('#modal'),sheet=modal.querySelector('.preset-code-sheet'),input=sheet.querySelector('textarea'),accept=sheet.querySelector('[data-preset-code-action=accept]'),error=sheet.querySelector('[role=alert]'),previousStyle=modal.style.cssText,vv=window.visualViewport;
   input.value=exporting?code:'';
   const current=()=>sheet.isConnected&&!modal.hidden&&Core.PJ().active===project;
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
    if(exporting){input.focus({preventScroll:true});CoreView.uiSelectText(input);return;}
    if(!input.value.trim())return;
    if(llm){
     const item=Characters.llmFromCode(input.value);if(!item){showError('코드를 읽지 못했어요. GGMLLM:으로 시작하는 코드 전체를 확인해 주세요.');return;}
     const L=Core.llmSlots();L.presets.push({id:'lp'+uid(),name:String(item.name||'가져온 지침').slice(0,30),pos:['top','mid','bot','tag'].includes(item.pos)?item.pos:'top',text:String(item.text),on:false});
     for(const key of ['top','mid','bot','tag']){const field=draft.find(x=>x.id==='llm_'+key);if(field)L[key]=field.value;}
     if(!Characters.saveLlm(L)){showError('저장 공간이 부족해요. 입력한 코드는 유지했어요.');return;}
    }else{
     const item=Characters.packFromCode(input.value);if(!item){showError('코드를 읽지 못했어요. GGMPACK:으로 시작하는 코드 전체를 확인해 주세요.');return;}
     item.id='u'+uid();delete item.llm;item.name=String(item.name||'받은 프리셋').slice(0,30);const items=Core.userPacks();items.unshift(item);
     if(!Core.saveUserPacks(items)){showError('저장 공간이 부족해요. 입력한 코드는 유지했어요.');return;}
    }
    committed=true;cleanup();window.navBack();CoreView.openModal(llm?SystemView.llmHTML():ArtView.packHTML());
    const restored=$('#modal .sheet');for(const value of draft){const el=restored.querySelector('#'+value.id);if(el){el.value=value.value;if(el.type==='checkbox'||el.type==='radio')el.checked=value.checked;}}restored.scrollTop=scroll;
    CoreView.toast(llm?'가져왔어요. 내용을 확인하고 켜 주세요':'그림체 프리셋을 추가했어요. 적용을 눌러 쓰세요');
   });
   if(!exporting)input.focus({preventScroll:true});
  }

  static naiBlocksFieldParts(field){
   const e=typeof field==='string'?document.getElementById(field):field;if(!e)return null;
   try{const p=JSON.parse(e.dataset.naiBlocks||'null');if(p?.combined===e.value)return {...p,...Core.naiBlocksUpgrade(p)};}catch(_){}
   return {...Characters.naiBlocksSplit(e.value),combined:e.value};
  }

    // Lookup only runs while an editor exists. It does not migrate or save a game on load.
static naiBlocksOwner(e){
   const id=e.id;
   if(id==='f_nai'||id==='f_wp'){const cid=document.querySelector('[data-act=savechar]')?.dataset.id||document.querySelector('[data-act=savec]')?.dataset.id||e.dataset.owner;const c=charById(cid);return {o:id==='f_wp'?c?.weapon:c,key:id==='f_wp'?'prompt':'naiPrompt'};}
   if(e.dataset.nf==='naiPrompt'){const n=(G.npcs||[]).find(n=>e.closest('[id]')?.id==='npc_'+n.id||e.closest('#npc_'+n.id));return {o:n,key:'naiPrompt'};}
   if(e.dataset.dc==='tags')return {o:DR2.chars[+e.dataset.i],key:'tags'};
   if(id==='ds_all')return {o:G.meta.design,key:'all'};
   if(id.startsWith('ds_f'))return {o:{value:(G.meta.design?.fac||{})[e.dataset.fac]||'',naiBlocks:{value:G.meta.design?.facBlocks?.[e.dataset.fac]}},key:'value'};
   if(id==='nai_prefix')return {o:Core.naiCfg(),key:'prefix'};
   if(id.startsWith('nai_p_'))return {o:Core.naiCfg().parts[id.slice(6)],key:'suffix'};
   if(['wp_scene','il_scene','lb_scene','sc_scene','lbbg_scene'].includes(id)){const c=charById(e.closest('.cs-sheet')?.dataset.cid);return {o:id==='wp_scene'?c?.weapon:c?.[({il_scene:'illust',lb_scene:'lbcg',sc_scene:'scg',lbbg_scene:'lbbg'})[id]],key:'prompt'};}
   if(id==='v2-icon-prompt'&&typeof V2ICONS!=='undefined'){const p=V2ICONS?.preview;return {o:p&&{prompt:p.prompt,naiBlocks:{prompt:p.promptParts}},key:'prompt'};}
   if(id==='pf_nai')return {o:Core.progRead('avatar'),key:'prompt'}; /* 플레이어 외형 칸: 진행 칸 avatar(그리기 전 처리가 늘 만들어 둠 — 0070 PROG_SLOTS tick) */
   if(id==='sk_prompt'&&document.getElementById('sk_char'))return {o:G.meta.shop?.self,key:'naiPrompt'};
   if(id==='rg_e_look')return {o:REGEN?.nc,key:'naiPrompt'};
   if(id==='li_prompt')return {o:libById(document.querySelector('[data-act=savelib]')?.dataset.id),key:'prompt'};
   if(e.dataset.skinPrompt){const c=charById(e.dataset.owner);return {o:c?.skins?.find(k=>k.id===e.dataset.skinPrompt),key:'prompt'};}
   return null;
  }

  static openAp(){
    const d=APD;
    CoreView.openModal(`${head(d.id?'AI 편집':'AI 추가')}
      ${CoreView.apForm(d)}
      <div class="row" style="margin-top:14px"><button class="btn" data-act="apsave">저장</button><button class="btn ghost" data-act="aptest">연결 테스트</button>${d.id?`<button class="btn ghost" data-act="apdel">삭제</button>`:''}</div>`);
  }

  static regenReadPreview(R){const read=id=>document.getElementById(id)?.value.trim();if(!R.edit)return;const nc=R.nc;
   if(R.sel.name){const name=read('rg_e_name');if(!name)throw new Error('이름을 입력해 주세요.');nc.name=name.slice(0,20);nc.faction=(read('rg_e_faction')||'').slice(0,100);}
   if(R.sel.profile){const value=read('rg_e_profile');if(!value)throw new Error('프로필을 입력해 주세요.');nc.profile=value.slice(0,6000);}
   if(R.sel.look){const value=read('rg_e_look');if(!value)throw new Error('외모 태그를 입력해 주세요.');nc.naiPrompt=Characters.allyTags(value);CoreView.naiBlocksSave(nc,'naiPrompt','rg_e_look');}
   if(R.sel.skill){const name=read('rg_e_skill');if(!name)throw new Error('스킬 이름을 입력해 주세요.');nc.skills[R.slot].name=name.slice(0,40);}
   if(R.sel.weapon){const name=read('rg_e_wname'),prompt=read('rg_e_wprompt');if(!name||!prompt)throw new Error('무기 이름과 프롬프트를 입력해 주세요.');nc.weapon={...nc.weapon,name:name.slice(0,100),prompt:Art.regenWeaponPrompt(prompt.slice(0,4000))};R.weaponEdited=true;}
  }

    /* 다시 만들기 창의 적용·다시 시도·고치기 단추 잠금(View) */
static regenButtonsLock(on){ document.querySelectorAll('[data-act=regenapply],[data-act=regenretry],[data-act=regenedit]').forEach(b=>b.disabled=on); }

  static openImgLib(cid){const c=charById(cid);if(!c)return;if(!IMGLIB||IMGLIB.cid!==cid)IMGLIB={cid,sel:[]};const items=Characters.charImgItems(c),has=items.filter(x=>Art.imgSrcRaw(x.o)),cmp=IMGLIB.sel.length===2?IMGLIB.sel.map(i=>items[i]).filter(x=>x&&Art.imgSrcRaw(x.o)):[];
   CoreView.openModal(`${head(`${esc(c.name)} · 그림 모아 보기`,`<span class="muted">${has.length}/${items.length}장</span>`)}<p class="muted">누르면 크게 보고, 두 장을 고르면 나란히 비교해요.</p>${cmp.length===2?`<div class="imglib-cmp">${cmp.map(x=>`<div><img src="${esc(Art.imgSrcRaw(x.o))}" alt=""><small>${esc(x.label)}</small></div>`).join('')}</div>`:''}<div class="row">${IMGLIB.sel.length?'<button class="btn sm ghost" data-act="ilbclear">선택 풀기</button>':''}</div><div class="imglib-grid">${items.map((x,i)=>{const src=Art.imgSrcRaw(x.o);return `<div class="imglib-it ${src?'':'empty'} ${IMGLIB.sel.includes(i)?'on':''}" ${src?`data-act="ilbtap" data-i="${i}"`:''}>${src?`<img src="${esc(src)}" alt="">`:'<span>없음</span>'}<b>${esc(x.label)}</b>${src?`<button class="del pm-hide" data-act="ilbdel" data-i="${i}" data-image-id="${esc(x.o.id)}" aria-label="지우기">✕</button>`:''}</div>`;}).join('')}</div>`);
  }

  static openDesign(){ const d=G.meta.design||{}, facs=World.designFacs();
    CoreView.openModal(`${head('캐릭터 디자인 통일','<span class="muted">이 게임의 가챠 캐릭터 그림에 붙는 태그</span>')}
      <p class="muted" style="margin:0 0 8px">스탠딩·상반신·일러스트·돌파 CG·스토리 CG·기술 컷인을 그릴 때 캐릭터 외형 프롬프트 뒤에 붙여요. 제복·상징 색·소재·문장(엠블럼)처럼 다 같이 공유할 디자인을 영어 태그로 적어요. 머리·눈·체형은 캐릭터마다 다르니 넣지 않는 게 좋아요. 바꾼 뒤 새로 그리는 그림부터 적용돼요.</p>
      <label class="f" for="ds_all">공통 (모든 가챠 캐릭터)</label><textarea class="in" id="ds_all" style="min-height:60px" placeholder="예: academy uniform, white and navy color scheme, gold trim, school crest">${esc(d.all||'')}</textarea>
      ${facs.length?`<h3 class="sec">세력별</h3>${facs.map((f,i)=>`<label class="f" for="ds_f${i}">${esc(f)} <span class="muted">· ${G.chars.filter(c=>c.faction===f&&!c.collab).length}명</span></label><textarea class="in" id="ds_f${i}" data-fac="${esc(f)}" style="min-height:50px" placeholder="예: crimson cape, silver rose emblem">${esc(((d.fac||{})[f])||'')}</textarea>`).join('')}`:'<p class="muted">세력이 정해진 캐릭터가 없어서 공통 태그만 쓸 수 있어요.</p>'}
      <p class="muted" style="margin:8px 0 0;font-size:.78rem">스킨(의상)·NPC·다른 세계에서 온 콜라보 캐릭터에는 붙지 않아요. 캐릭터 한 명만 빼려면 그 캐릭터 편집에서 '공통 디자인 태그 쓰지 않기'를 켜요.</p>
      <div class="row" style="margin-top:12px"><button class="btn" data-act="dssave">저장</button>${SAMPLE?'<button class="btn ghost" data-act="dsai">✦ AI로 제안 받기</button>':''}</div>`); }

  static cutPush(){const j=CUTJOB,x=Characters.cutCtx(); if(!x) return; j.undo.push(x.getImageData(0,0,j.W,j.H)); if(j.undo.length>10) j.undo.shift(); const el=$('#ct_undo'); if(el) el.disabled=false; j.changed=true; const sv=$('#ct_save'); if(sv) sv.disabled=false;}

  static async cutLoadBlob(b,push){
    const j=CUTJOB, x=Characters.cutCtx(); if(!x) return; if(push!==false) CharactersView.cutPush();
    const bmp=await createImageBitmap(b); x.clearRect(0,0,j.W,j.H); x.drawImage(bmp,0,0,j.W,j.H); CharactersView.cutDrawLoupe(); j.changed=true; const sv=$('#ct_save'); if(sv) sv.disabled=false;
  }

  static cutMap(){const j=CUTJOB, R=j.cv.getBoundingClientRect(), s=Math.min(R.width/j.W,R.height/j.H); return {s,ox:R.left+(R.width-j.W*s)/2,oy:R.top+(R.height-j.H*s)/2};}

  static cutMode(){const m=$('#ct_pmode');return m?m.value:'wand';}

  static cutBrush(){const el=$('#ct_brush');return el?+el.value:10;}

    /* 배경 지우기 편집기(View): 확대 단계 표시(커서 자리를 화면 가운데로) · 되돌리기 단추 */
static cutZoomShow(t,j){ const view=$('#cutPrev'), z=j.zoom, fx=j.cx>=0?j.cx/j.W:.5, fy=j.cy>=0?j.cy/j.H:.5; view.classList.toggle('zoom',z>1); j.cv.style.width=z>1?(z*100)+'%':''; t.textContent='확대 ×'+z; CoreView.chipOn(t,z>1);
    requestAnimationFrame(()=>{ if(z>1){ view.scrollLeft=j.cv.offsetWidth*fx-view.clientWidth/2; view.scrollTop=j.cv.offsetHeight*fy-view.clientHeight/2; } CharactersView.cutPlaceCursor(); CharactersView.cutDrawLoupe(); }); }

  static cutUndoShow(j){ $('#ct_undo').disabled=!j.undo.length; CharactersView.cutDrawLoupe(); }

  static cutPlaceCursor(){
    const j=CUTJOB, el=$('#cutCur'), view=$('#cutPrev'); if(!j||!el||!view||j.cx<0) return;
    const m=CharactersView.cutMap(), V=view.getBoundingClientRect(), X=m.ox+j.cx*m.s, Y=m.oy+j.cy*m.s;
    const brush=['brush','restore'].includes(CharactersView.cutMode()), size=brush?Math.max(10,CharactersView.cutBrush()*2*m.s):26;
    el.hidden=false; el.classList.toggle('brush',brush); el.classList.toggle('restore',CharactersView.cutMode()==='restore');
    el.style.width=el.style.height=size+'px'; el.style.left=(X-V.left+view.scrollLeft-size/2)+'px'; el.style.top=(Y-V.top+view.scrollTop-size/2)+'px';
  }

  static cutDrawLoupe(){
    const j=CUTJOB, el=$('#cutLoupe'); if(!j||!el||j.cx<0) return; el.hidden=false;
    const g=el.getContext('2d'), Z=el.width, span=Math.max(9,Math.round(Z/(j.zoom>=5?3:6)));
    g.imageSmoothingEnabled=false; for(let y=0;y<Z;y+=10) for(let x=0;x<Z;x+=10){ g.fillStyle=((x+y)/10)%2?'#3a3550':'#2c2541'; g.fillRect(x,y,10,10); }
    g.drawImage(j.cv,j.cx-span/2,j.cy-span/2,span,span,0,0,Z,Z);
    const k=Z/span; g.strokeStyle='rgba(255,255,255,.95)'; g.lineWidth=1; g.beginPath(); g.moveTo(Z/2,0); g.lineTo(Z/2,Z/2-k); g.moveTo(Z/2,Z/2+k); g.lineTo(Z/2,Z); g.moveTo(0,Z/2); g.lineTo(Z/2-k,Z/2); g.moveTo(Z/2+k,Z/2); g.lineTo(Z,Z/2); g.stroke();
    g.strokeStyle='#ff3d7f'; g.strokeRect(Z/2-k/2,Z/2-k/2,k,k);
    if(['brush','restore'].includes(CharactersView.cutMode())){ g.strokeStyle='rgba(255,211,90,.9)'; g.beginPath(); g.arc(Z/2,Z/2,CharactersView.cutBrush()*k,0,Math.PI*2); g.stroke(); }
    const view=$('#cutPrev'); if(view){ const V=view.getBoundingClientRect(), m=CharactersView.cutMap(), X=m.ox+j.cx*m.s-V.left, Y=m.oy+j.cy*m.s-V.top; el.classList.toggle('right',X<V.width/2&&Y<Z+20); }
    const px=Characters.cutCtx().getImageData(Math.max(0,Math.min(j.W-1,Math.round(j.cx))),Math.max(0,Math.min(j.H-1,Math.round(j.cy))),1,1).data; const sw=$('#ct_sw'); if(sw) sw.style.background=px[3]<10?'transparent':`rgb(${px[0]},${px[1]},${px[2]})`;
  }

  static cutAimAt(clientX,clientY){
    const j=CUTJOB, m=CharactersView.cutMap(); j.cx=Math.max(0,Math.min(j.W-1,(clientX-m.ox)/m.s)); j.cy=Math.max(0,Math.min(j.H-1,(clientY-m.oy)/m.s));
    CharactersView.cutPlaceCursor(); CharactersView.cutDrawLoupe();
    if(j.zoom>1){ const view=$('#cutPrev'), V=view.getBoundingClientRect(), X=m.ox+j.cx*m.s, Y=m.oy+j.cy*m.s, e=40, st=14;
      if(X<V.left+e) view.scrollLeft-=st; else if(X>V.right-e) view.scrollLeft+=st; if(Y<V.top+e) view.scrollTop-=st; else if(Y>V.bottom-e) view.scrollTop+=st; }
  }

  static cutStamp(x0,y0,x1,y1){
    const j=CUTJOB, g=Characters.cutCtx(), r=CharactersView.cutBrush(), mode=CharactersView.cutMode(), dist=Math.hypot(x1-x0,y1-y0), n=Math.max(1,Math.ceil(dist/Math.max(1,r/3)));
    for(let i=0;i<=n;i++){ const x=x0+(x1-x0)*i/n, y=y0+(y1-y0)*i/n;
      if(mode==='brush'){ g.save(); g.globalCompositeOperation='destination-out'; const gr=g.createRadialGradient(x,y,r*0.55,x,y,r); gr.addColorStop(0,'rgba(0,0,0,1)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fill(); g.restore(); }
      else { g.save(); g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.clip(); g.clearRect(x-r-1,y-r-1,2*r+2,2*r+2); g.drawImage(j.orig,0,0,j.W,j.H); g.restore(); }
    }
  }

  static cutEraseHere(){
    const j=CUTJOB; if(!j||j.cx<0){CoreView.toast('먼저 그림을 눌러 커서를 놓으세요');return;}
    const mode=CharactersView.cutMode(); if(['brush','restore'].includes(mode)){ CharactersView.cutPush(); CharactersView.cutStamp(j.cx,j.cy,j.cx,j.cy); CharactersView.cutDrawLoupe(); return; }
    const g=Characters.cutCtx(), id=g.getImageData(0,0,j.W,j.H), before=g.getImageData(0,0,j.W,j.H);
    const r=Characters.eraseColorData(id,j.W,j.H,j.cx,j.cy,{tol:+$('#ct_ptol').value,soft:Math.round(+$('#ct_soft').value*0.6),mode});
    const hint=$('#ct_hint');
    if(!r.color){ if(hint) hint.textContent='이미 투명한 곳이에요'; return; }
    if(hint) hint.innerHTML=`<span class="cutsw" style="background:rgb(${r.color.map(Math.round).join(',')})"></span>${r.removed?`${r.removed.toLocaleString()}픽셀 지웠어요`:'이 색과 닮은 픽셀이 없어요. 범위를 높여 보세요'}`;
    if(r.removed){ j.undo.push(before); if(j.undo.length>10) j.undo.shift(); g.putImageData(id,0,0); j.changed=true; $('#ct_undo').disabled=false; $('#ct_save').disabled=false; CharactersView.cutDrawLoupe(); }
  }

  static cutBind(){
    const j=CUTJOB, cv=j.cv;
    cv.addEventListener('pointerdown',e=>{ e.preventDefault(); try{cv.setPointerCapture(e.pointerId);}catch(_){}
      const touch=e.pointerType!=='mouse'; j.drag={touch,off:touch?64:0,sx:e.clientX,sy:e.clientY,moved:false};
      CharactersView.cutAimAt(e.clientX,e.clientY-j.drag.off);
      if(['brush','restore'].includes(CharactersView.cutMode())){ CharactersView.cutPush(); j.drag.lx=j.cx; j.drag.ly=j.cy; j.drag.paint=true; if(!touch){ CharactersView.cutStamp(j.cx,j.cy,j.cx,j.cy); CharactersView.cutDrawLoupe(); } } });
    cv.addEventListener('pointermove',e=>{ const d=j.drag; if(!d) return; if(Math.hypot(e.clientX-d.sx,e.clientY-d.sy)>4) d.moved=true;
      CharactersView.cutAimAt(e.clientX,e.clientY-d.off);
      if(d.paint&&(d.moved||!d.touch)){ CharactersView.cutStamp(d.lx,d.ly,j.cx,j.cy); d.lx=j.cx; d.ly=j.cy; CharactersView.cutDrawLoupe(); } });
    const up=()=>{ const d=j.drag; if(!d) return; j.drag=null;
      if(d.paint){ if(!d.moved&&d.touch){ CharactersView.cutStamp(j.cx,j.cy,j.cx,j.cy); } CharactersView.cutDrawLoupe(); return; }
      if($('#ct_quick')&&$('#ct_quick').checked) CharactersView.cutEraseHere(); };
    cv.addEventListener('pointerup',up); cv.addEventListener('pointercancel',()=>{j.drag=null;});
  }

  static openCut(kind,id){
    const o=Core.naiTarget(kind,id); const src=o&&Characters.imgSrc(o); if(!src){CoreView.toast('먼저 이미지를 등록해 주세요');return;}
    const c=Characters.cutCfg(); CUTJOB={kind,id,src,undo:[],zoom:1,cx:-1,cy:-1,opt:null,changed:false};
    CoreView.openModal(`${head('배경 지우기',`<span class="muted">${esc(o.name)}</span>`)}
      <div class="cutbox"><div class="cutview" id="cutPrev"><canvas id="cutCv"></canvas><div class="cut-cur" id="cutCur" hidden></div></div><canvas class="cut-loupe" id="cutLoupe" width="150" height="150" hidden></canvas></div>
      <div class="cuttools">
        <select class="in" id="ct_pmode"><option value="wand">스포이드: 이어진 영역</option><option value="all">스포이드: 같은 색 전부</option><option value="brush">지우개 브러시</option><option value="restore">복원 브러시</option></select>
        <button class="btn ghost" data-act="cutzoom" id="ct_zoom">확대 ×1</button><button class="btn ghost" data-act="cutundo" id="ct_undo" disabled>되돌리기</button>
      </div>
      <div class="cutpad">
        <div class="pad"><button class="btn ghost" data-act="cutnudge" data-dx="0" data-dy="-1" aria-label="위">▲</button><button class="btn ghost" data-act="cutnudge" data-dx="-1" data-dy="0" aria-label="왼쪽">◀</button><button class="btn ghost" data-act="cutnudge" data-dx="1" data-dy="0" aria-label="오른쪽">▶</button><button class="btn ghost" data-act="cutnudge" data-dx="0" data-dy="1" aria-label="아래">▼</button></div>
        <button class="btn cutgo" data-act="cuthere"><span class="cutsw" id="ct_sw"></span>커서 위치 지우기</button>
      </div>
      <div class="slider" id="ct_pt"><label for="ct_ptol"><span>스포이드 범위</span><b id="ct_ptolv">24</b></label><input id="ct_ptol" type="range" min="2" max="80" value="24"></div>
      <div class="slider" id="ct_bs" hidden><label for="ct_brush"><span>브러시 크기</span><b id="ct_brushv">10</b></label><input id="ct_brush" type="range" min="2" max="60" value="10"></div>
      <label class="f"><input type="checkbox" id="ct_quick"> 손을 떼면 바로 지우기 (스포이드)</label>
      <p class="muted cutpick-hint" id="ct_hint">그림을 누른 채 움직이면 손가락 위쪽에 커서가 생겨요. 왼쪽 위 돋보기로 확인하고 화살표로 한 칸씩 맞춘 뒤 '커서 위치 지우기'를 누르세요. 브러시는 문지르는 대로 지우고, 복원 브러시는 원본으로 되돌려요.</p>
      <details class="cutauto"><summary>자동으로 흰 배경 한 번에 지우기</summary>
        <div class="slider"><label for="ct_tol"><span>배경 허용 범위</span><b id="ct_tolv">${c.tol}</b></label><input id="ct_tol" type="range" min="6" max="90" value="${c.tol}"></div>
        <div class="slider"><label for="ct_soft"><span>가장자리 부드럽게</span><b id="ct_softv">${c.soft}</b></label><input id="ct_soft" type="range" min="4" max="70" value="${c.soft}"></div>
        <div class="row"><label class="f"><input type="checkbox" id="ct_shadow" ${c.shadow?'checked':''}> 발밑 그림자 지우기</label></div>
        <div class="row"><label class="f"><input type="checkbox" id="ct_holes" ${c.holes?'checked':''}> 막힌 배경도 지우기 (흰 옷이 지워지면 끄세요)</label></div>
        <div class="row"><label class="f"><input type="checkbox" id="ct_spk" ${c.despeck?'checked':''}> 떠 있는 작은 점 지우기</label></div>
        <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-act="cutrun">자동 지우기 (원본 기준)</button></div>
        <label class="f"><input type="checkbox" id="ct_def" checked> 이 설정을 자동 배경 제거 기본값으로</label>
      </details>
      <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="cutnai">NovelAI로 배경 제거 (Anlas 소모)</button></div>
      <div class="cutsave"><button class="btn block" data-act="cutsave" disabled id="ct_save">이걸로 저장</button></div>`);
    (async()=>{ try{ const im=await Characters.loadImg(src), j=CUTJOB; if(!j||!$('#cutCv')) return; j.W=im.naturalWidth||im.width; j.H=im.naturalHeight||im.height;
        j.cv=$('#cutCv'); j.cv.width=j.W; j.cv.height=j.H; j.cv.getContext('2d',{willReadFrequently:true}).drawImage(im,0,0);
        j.orig=document.createElement('canvas'); j.orig.width=j.W; j.orig.height=j.H; j.orig.getContext('2d').drawImage(im,0,0); CharactersView.cutBind(); }catch(e){ CoreView.toast('이미지를 불러오지 못했어요'); } })();
  }

  static async openMaskPainter(src,prev,cb,po){ po=po||{}; const im=await Characters.loadImg(src), [W,H]=Characters.fitDims(im.naturalWidth||im.width,im.naturalHeight||im.height);
    const mk=document.createElement('canvas'); mk.width=W; mk.height=H; const mx=mk.getContext('2d'); mx.fillStyle='#000'; mx.fillRect(0,0,W,H);
    if(prev){ try{ const pm=await Characters.loadImg(prev); mx.drawImage(pm,0,0,W,H); }catch(e){ Core.quietErr(e,'0030-image/010-engine.js:774'); } }
    const d=document.createElement('div'); d.className='mpaint';
    d.innerHTML=`<div class="mp-bar"><b>${esc(po.title||'얼굴 범위 칠하기')}</b><button type="button" data-m="brush" class="on">✎ 칠하기</button><button type="button" data-m="erase">⌫ 지우개</button><label>크기 <input type="range" min="8" max="120" value="40"></label><button type="button" data-m="auto">얼굴 자동</button><button type="button" data-m="clear">비우기</button><span class="mp-sp"></span><button type="button" data-m="cancel">취소</button><button type="button" data-m="save" class="ok">저장</button></div>
      <div class="mp-stage"><canvas></canvas></div><p class="mp-tip">바꾸고 싶은 얼굴 부분(눈·눈썹·입)을 빨갛게 칠해 주세요. 머리카락·옷은 칠하지 않는 게 좋아요. 한 번 저장하면 모든 표정에 같이 써요.</p>`;
    document.body.appendChild(d);
    const cv=d.querySelector('canvas'), x=cv.getContext('2d'), stage=d.querySelector('.mp-stage');
    const fit=()=>{ const sw=stage.clientWidth-16, sh=stage.clientHeight-16, s=Math.min(sw/W,sh/H); cv.width=Math.round(W*s); cv.height=Math.round(H*s); draw(); };
    const tint=document.createElement('canvas'); tint.width=W; tint.height=H; const tx=tint.getContext('2d');
    const draw=()=>{ x.clearRect(0,0,cv.width,cv.height); x.fillStyle='#ddd'; x.fillRect(0,0,cv.width,cv.height); x.drawImage(im,0,0,cv.width,cv.height);
      tx.clearRect(0,0,W,H); tx.drawImage(mk,0,0); tx.globalCompositeOperation='source-in'; tx.fillStyle='rgba(255,40,80,1)'; tx.fillRect(0,0,W,H); tx.globalCompositeOperation='source-over';
      const id=mx.getImageData(0,0,W,H).data, t=tx.getImageData(0,0,W,H); for(let i=0;i<id.length;i+=4){ t.data[i+3]=id[i]>127?140:0; } tx.putImageData(t,0,0); x.drawImage(tint,0,0,cv.width,cv.height); };
    let mode='brush', size=40, down=false, last=null;
    const pt=e=>{ const r=cv.getBoundingClientRect(); return [(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H]; };
    const stroke=(a,b)=>{ mx.strokeStyle=mode==='erase'?'#000':'#fff'; mx.lineWidth=size*W/cv.width; mx.lineCap='round'; mx.beginPath(); mx.moveTo(a[0],a[1]); mx.lineTo(b[0],b[1]); mx.stroke(); };
    cv.addEventListener('pointerdown',e=>{ down=true; cv.setPointerCapture(e.pointerId); last=pt(e); stroke(last,last); draw(); });
    cv.addEventListener('pointermove',e=>{ if(!down) return; const p=pt(e); stroke(last,p); last=p; draw(); });
    cv.addEventListener('pointerup',()=>{ down=false; }); cv.addEventListener('pointercancel',()=>{ down=false; });
    d.querySelector('input[type=range]').addEventListener('input',e=>{ size=+e.target.value; });
    d.querySelector('.mp-bar').addEventListener('click',e=>{ const el=e.target.closest('button'); if(!el) return; const m=el.dataset.m;
      if(m==='brush'||m==='erase'){ mode=m; d.querySelectorAll('[data-m=brush],[data-m=erase]').forEach(q=>q.classList.toggle('on',q===el)); }
      else if(m==='clear'){ mx.fillStyle='#000'; mx.fillRect(0,0,W,H); draw(); }
      else if(m==='auto'){ const tall=H/W>1.25; mx.fillStyle='#fff'; mx.beginPath(); mx.ellipse(W*0.5,H*(tall?0.12:0.24),W*(tall?0.1:0.16),H*(tall?0.055:0.11),0,0,Math.PI*2); mx.fill(); draw(); CoreView.toast('얼굴 위치를 대충 칠했어요. 맞지 않으면 고쳐 주세요'); }
      else if(m==='cancel'){ d.remove(); if(po.onCancel) po.onCancel(); }
      else if(m==='save'){ const id=mx.getImageData(0,0,W,H).data; let n=0; for(let i=0;i<id.length;i+=4) if(id[i]>127) n++; if(!n){ CoreView.toast('얼굴 부분을 먼저 칠해 주세요'); return; } d.remove(); cb(mk.toDataURL('image/png')); } });
    addEventListener('resize',fit,{once:false}); setTimeout(fit,30); }

    /* 표정 하나 크게 보기 창 · 표정 칩 다시 표시(View) */
static openFaceView(c,f){ CoreView.openModal(`${head(esc(c.name)+' · '+esc(f.name))}<div class="naiprev char done">${Characters.imgSrc(f)?`<img src="${esc(Characters.imgSrc(f))}" alt="">`:''}</div><div class="row" style="margin-top:12px"><button class="btn ghost" data-act="facedel" data-id="${c.id}" data-f="${f.id}">삭제</button><button class="btn" data-act="char" data-id="${c.id}">돌아가기</button></div>`); }

  static faceChipsShow(){ document.querySelectorAll('[data-act=facesel]').forEach(b=>CoreView.chipOn(b,FACESEL.has(b.dataset.v))); }

  static openFaces(id,sid){
    const c=charById(id); if(!c) return; if($('#ov').hidden) MBACK=()=>CharactersCtl.openChar(id); if(sid!==undefined) FACET={cid:id,sid:sid||''}; else if(FACET.cid!==id) FACET={cid:id,sid:''};
    const F=Characters.faceTgt(c), names=[...new Set([...FACE_BASIC,...F.faces.map(f=>f.name)])], up=Characters.faceUpperObj(c,F), mk=F.faceMask||{}, cm=Core.naiCfg().model||NAI_DEF.model;
    FACEOPT=FACEOPT||{m:'inpaint',body:'both',model:/^nai-diffusion-5/.test(cm)?cm:'nai-diffusion-5-full',ref:false,lv:1};
    const thumb=(o,l)=>`<span>${o&&Art.imgSrcRaw(o)?`<img src="${esc(Art.imgSrcRaw(o))}" alt="">`:'<i class="fc-empty">없음</i>'}${l}</span>`;
    CoreView.openModal(`${head(`${esc(c.name)} 표정`,`<span class="muted">${F===c?'기본 모습':esc(System.T('skin'))+' 「'+esc(F.name)+'」'}</span>`)}
      ${(c.skins||[]).length?`<div class="chips" style="margin:0 0 8px"><button class="chip ${F===c?'on':''}" data-act="facetgt" data-id="${esc(id)}" data-s="">기본</button>${c.skins.map(k=>`<button class="chip ${F===k?'on':''}" data-act="facetgt" data-id="${esc(id)}" data-s="${k.id}">${esc(System.T('skin'))}: ${esc(k.name)}</button>`).join('')}</div>`:''}
      <div class="fc-grid">${names.map(nm=>{ const f=F.faces.find(x=>x.name===nm); return `<div class="fc-it"><div class="fc-two">${thumb(f,'전신')}${thumb(f&&f.up,'상반신')}</div><b>${esc(nm)}</b><div class="row"><button class="btn sm ghost" data-act="faceup" data-id="${esc(id)}" data-v="${esc(nm)}">전신 ${f&&Characters.imgSrc(f)?'바꾸기':'넣기'}</button><button class="btn sm ghost" data-act="faceup" data-id="${esc(id)}" data-v="${esc(nm)}" data-b="up">상반신 ${f&&f.up&&Characters.imgSrc(f.up)?'바꾸기':'넣기'}</button>${f?`<button class="btn sm ghost" data-act="facedel" data-id="${esc(id)}" data-v="${esc(nm)}">✕</button>`:''}</div></div>`; }).join('')}</div>
      <div class="row" style="margin-top:8px"><input class="in" id="fc_new" placeholder="새 표정 이름 (예: 삐짐)" style="flex:1"><button class="btn sm" data-act="faceupnew" data-id="${esc(id)}">이 이름으로 넣기</button><button class="btn sm ghost" data-act="faceupmany" data-id="${esc(id)}">여러 장 넣기</button></div>
      <h4 class="sec">NovelAI로 만들기</h4>
      ${Art.imgSrcRaw(F)?'':`<p class="muted">먼저 ${F===c?'기본':'이 '+esc(System.T('skin'))+'의'} 스탠딩이 있어야 해요.</p>`}
      <div class="row" style="margin:0 0 6px"><button class="btn sm ghost" data-act="facebasic">기본 6종 고르기 (${FACE_BASIC.join('·')})</button></div>
      <div class="chips">${FACE_PRESETS.map(([ko])=>`<button class="chip ${FACESEL.has(ko)?'on':''}" data-act="facesel" data-v="${ko}" data-id="${id}">${ko}${F.faces.some(f=>f.name===ko&&Characters.imgSrc(f))?' ✓':''}</button>`).join('')}</div>
      <div class="g2"><div><label class="f" for="fc_m">만드는 방법</label><select class="in" id="fc_m">${CoreView.opt([['inpaint','얼굴만 다시 그리기 (인페인팅 · 추천)'],['raw','감정을 넣어 새로 그리기 (V5 전용, 같은 시드)'],['i2i','스탠딩을 바탕으로 다시 그리기 (img2img)'],['emo','NAI 표정 변환 (변화가 약할 수 있음)']],FACEOPT.m)}</select></div>
        <div><label class="f" for="fc_body">그릴 그림</label><select class="in" id="fc_body">${CoreView.opt([['both','전신 + 상반신'],['full','전신만'],['up','상반신만']],FACEOPT.body)}</select></div></div>
      <div class="g2"><div><label class="f" for="fc_model">그림 모델</label><select class="in" id="fc_model">${CoreView.opt(NAI_MODELS.filter(m=>/^nai-diffusion-(5|4-5)/.test(m[0])),FACEOPT.model)}</select></div>
        <div><label class="f" for="fc_lv">변화 강도</label><select class="in" id="fc_lv">${CoreView.opt([[0,'강하게'],[1,'조금 강하게'],[2,'보통'],[3,'약하게']],FACEOPT.lv)}</select></div></div>
      <label class="f" style="margin-top:6px"><input type="checkbox" id="fc_ref" ${FACEOPT.ref?'checked':''}> 캐릭터 레퍼런스도 함께 (얼굴을 더 똑같이 · V4.5로 그려져요)</label>
      <div class="optbox" style="margin-top:6px"><b style="font-size:.85rem">얼굴 범위 (인페인팅용)</b> <span class="muted" style="font-size:.76rem">한 번 칠해 두면 모든 표정에 같이 써요</span>
        <div class="row" style="margin-top:6px"><button class="btn sm ${mk.full?'':'ghost'}" data-act="facemask" data-id="${esc(id)}" data-b="full" ${Art.imgSrcRaw(F)?'':'disabled'}>${mk.full?'✓ ':''}전신에 칠하기</button><button class="btn sm ${mk.up?'':'ghost'}" data-act="facemask" data-id="${esc(id)}" data-b="up" ${up?'':'disabled'}>${mk.up?'✓ ':''}상반신에 칠하기</button>${up?'':'<span class="muted" style="font-size:.74rem">상반신 그림이 없어요</span>'}</div></div>
      <label class="f" for="fc_x">추가 프롬프트 (선택)</label><input class="in" id="fc_x" placeholder="예: blush, teary eyes">
      <p class="muted" id="fc_stat"></p>
      <div class="row" style="margin-top:12px"><button class="btn" data-act="facego" data-id="${id}">선택한 표정 만들기</button></div>`);
  }

  static faceOptRead(){ if(!$('#fc_m')) return; FACEOPT={m:$('#fc_m').value,body:$('#fc_body').value,model:$('#fc_model').value,ref:$('#fc_ref').checked,lv:+$('#fc_lv').value}; }

  static openSkin(id){
    const c=charById(id); MBACK=()=>CharactersCtl.openChar(id);
    CoreView.openModal(`${head(`${esc(c.name)} ${System.T('skin')} 만들기`)}
      <p class="muted">기본은 설정의 모델(V5 Full 권장)로 투명 배경 스탠딩을 그려요. 얼굴을 원본과 더 똑같이 맞추고 싶으면 아래에서 캐릭터 레퍼런스를 켜세요(V4.5로 그려지고 흰 배경을 지워요).</p>
      <label class="f" for="sk_name">${System.T('skin')} 이름</label><input class="in" id="sk_name" placeholder="예: 축제 유카타">
      <label class="f" for="sk_idea">의상 아이디어</label><input class="in" id="sk_idea" placeholder="예: 남색 유카타, 머리에 꽃장식, 손에 종이 등불">
      <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="aiskin" data-id="${id}">AI로 프롬프트 쓰기</button></div>
      <label class="f" for="sk_prompt">NAI 프롬프트</label><textarea class="in" id="sk_prompt" placeholder="1girl, solo, ..." data-nai-blocks="${esc(JSON.stringify({...Characters.naiBlocksOf(c),outfit:'',combined:LiveOps.naiBlocksJoin({...Characters.naiBlocksOf(c),outfit:''})}))}">${esc(LiveOps.naiBlocksJoin({...Characters.naiBlocksOf(c),outfit:''}))}</textarea>
      <label class="f" for="sk_pose">자세</label><select class="in" id="sk_pose">${Core.naiCfg().poses.map(p=>`<option value="${esc(p.t)}" ${p.t===(c.naiPose||NAI_FRONT)?'selected':''}>${esc(p.n)}</option>`).join('')}</select>
      <div class="optbox"><label class="f"><input type="checkbox" id="sk_ref" ${Characters.imgSrc(c)?'':'disabled'}> 지금 스탠딩을 캐릭터 레퍼런스로 (선택)</label>
      <div class="g2"><div><label class="f" for="sk_fid">충실도</label><select class="in" id="sk_fid">${CoreView.opt([[1,'1.0 (원본에 가깝게)'],[0.8,'0.8'],[0.6,'0.6']],1)}</select></div><div></div></div>
      <div class="g2"><div><label class="f" for="sk_str">레퍼런스 강도</label><select class="in" id="sk_str">${CoreView.opt([[1,'강하게 (얼굴 유지)'],[0.8,'보통'],[0.6,'약하게']],1)}</select></div><div><label class="f" for="sk_style">그림체도 따라가기</label><select class="in" id="sk_style">${CoreView.opt([['1','예'],['0','아니요']],'1')}</select></div></div></div>
      <div class="row" style="margin-top:14px"><button class="btn" data-act="skingo" data-id="${id}">그리기</button></div>
      ${(c.skins||[]).length?`<h3 class="sec">만든 ${System.T('skin')}</h3><p class="muted" style="margin:0 0 6px;font-size:.8rem">${System.T('skin')}마다 스탠딩·상반신·일러스트·돌파 CG를 따로 둘 수 있어요. ${System.T('skin')}을 입히면 있는 그림은 ${System.T('skin')} 것을, 로비 일러스트·돌파 CG가 없으면 스킨의 상반신이나 스탠딩을 써요. 스탠딩 사용이 꺼져 있으면 이 스킨의 상반신이 필요해요.</p>${c.skins.map(k=>CoreView.skinCard(c,k)).join('')}`:''}`);
  }

  static imageCandidates(generate,initial={}){
   if(IMAGE_CANDIDATES)return Promise.reject(Object.assign(new Error('열려 있는 이미지 선택창을 먼저 마쳐 주세요.'),{code:'image_busy'}));
   return new Promise((resolve,reject)=>{
    const project=typeof Core.PJ==='function'?Core.PJ().active:null,root=document.createElement('div');root.id='image-candidate-dialog';
    root.style.cssText='position:fixed;inset:0;z-index:25000;background:#000b;display:flex;align-items:center;justify-content:center;padding:12px;overflow:auto';
    const d={root,phase:'count',count:1,selected:-1,items:[],busy:false,stopped:false,closed:false,round:0,config:{...initial},positions:{},error:''};IMAGE_CANDIDATES=d;
    let pulse=0;const controller=()=>new AbortController();
    function paintStatus(){const el=root.querySelector('#image-candidate-status');if(!el)return;el.textContent=d.busy?(d.stopped?'중단 중 · 현재 요청이 끝나면 중단합니다':(d.progress||`${d.items.length+1}/${d.count}장 이미지 생성 중`)+'.'.repeat(pulse%3+1)):`${d.items.length}/${d.count}장 생성 완료${d.stopped?' · 중단됨':''}`;}
    const timer=setInterval(()=>{if(!valid()){d.cancel();return;}pulse++;paintStatus();},450);
    const valid=()=>!d.closed&&IMAGE_CANDIDATES===d&&(typeof Core.PJ!=='function'||Core.PJ().active===project);
    const release=()=>{MiscView.imagePreviewClose();for(const x of d.items)URL.revokeObjectURL(x.url);d.items=[];d.selected=-1;};
    const finish=(blob)=>{if(!valid()){d.cancel();return;}d.closed=true;d.round++;clearInterval(timer);d.controller?.abort();release();root.remove();IMAGE_CANDIDATES=null;if(blob)resolve(blob);else reject(Characters.imageCandidateAbort());};
    d.cancel=()=>{if(d.closed)return;d.closed=true;d.round++;clearInterval(timer);d.controller?.abort();release();root.remove();if(IMAGE_CANDIDATES===d)IMAGE_CANDIDATES=null;reject(Characters.imageCandidateAbort());};
    d.back=()=>{if(d.phase==='settings'){d.phase='results';render();return;}d.cancel();};
    function render(){
     if(!valid()){d.cancel();return;}
     const previous=root.querySelector('.sheet'),outerScroll=root.scrollTop;if(previous)d.positions[previous.dataset.phase]=previous.scrollTop;const selected=d.items[d.selected],disabled=d.busy||!selected;
     root.innerHTML=`<section class="sheet" data-phase="${d.phase}" role="dialog" aria-modal="true" aria-labelledby="image-candidate-title" style="width:100%;max-width:1000px;max-height:92dvh;overflow:auto"><div class="row" style="justify-content:space-between"><h2 id="image-candidate-title">${d.phase==='count'?'몇 장을 그릴까요?':d.phase==='settings'?'생성 설정 고치기':'생성 결과 선택'}</h2><button class="btn ghost sm" data-candidate="close" aria-label="${d.phase==='settings'?'결과로 돌아가기':'이미지 생성 취소'}" style="flex:0 0 32px;width:32px;height:32px;min-width:32px;min-height:32px;padding:0;font-size:22px;line-height:1;align-self:flex-start">×</button></div>${d.phase==='count'?`<p class="muted">2장·4장은 한 장씩 순서대로 생성한 뒤 하나를 골라 등록합니다.</p><div class="row">${[1,2,4].map(n=>`<button class="btn" data-candidate="count" data-count="${n}" style="flex:1">${n}장</button>`).join('')}</div>`:d.phase==='settings'?`${initial.prompt!==undefined?`<label class="f">프롬프트<textarea class="in" data-candidate-field="prompt" style="min-height:120px">${esc(d.config.prompt||'')}</textarea></label>`:''}${initial.neg!==undefined?`<label class="f">네거티브<textarea class="in" data-candidate-field="neg">${esc(d.config.neg||'')}</textarea></label>`:''}<label class="f">생성 장수<select class="in" data-candidate-field="count">${[1,2,4].map(n=>`<option value="${n}" ${d.count===n?'selected':''}>${n}장</option>`).join('')}</select></label><p class="muted">기존 그림 AI·크기·레퍼런스 설정은 유지합니다. 다시 생성하면 이전 후보는 폐기됩니다.</p><div class="row"><button class="btn" data-candidate="apply-settings">이 설정으로 다시 뽑기</button><button class="btn ghost" data-candidate="results">결과로 돌아가기</button></div>`:`<p role="status" aria-live="polite" id="image-candidate-status">${d.busy?`${d.items.length+1}/${d.count}장 생성 중${d.stopped?' · 현재 요청이 끝나면 중단합니다':'<span class="image-candidate-dots">…</span>'}`:`${d.items.length}/${d.count}장 생성 완료${d.stopped?' · 중단됨':''}`}</p>${d.error?`<p role="alert" style="color:#ffb4b4">${esc(d.error)}</p>`:''}<div class="image-candidate-grid" style="display:grid;grid-template-columns:repeat(${Math.min(d.count,2)},minmax(0,1fr));gap:10px;align-items:start">${Array.from({length:d.count},(_,i)=>{const x=d.items[i],on=d.selected===i;return `<div style="min-width:0;padding:4px;border:2px solid ${on?'#fff':'transparent'};border-radius:12px;${on?'background:color-mix(in srgb,var(--accent,#7b6bff) 22%,transparent)':''}"><div class="image-candidate-frame" style="background:#0003;border-radius:8px;overflow:hidden">${x?`<img src="${esc(x.url)}" alt="후보 ${i+1}" role="button" tabindex="0" aria-label="후보 ${i+1} 크게 보기" style="display:block;width:100%;height:auto;object-fit:contain;cursor:zoom-in">`:`<span class="muted" style="display:block;padding:32px 8px;text-align:center">${i+1}번</span>`}</div><button class="btn ${on?'':'ghost'}" data-candidate="select" data-index="${i}" aria-pressed="${on}" ${!x||d.busy?'disabled':''} style="width:100%;margin-top:8px;white-space:normal;${on?'outline:2px solid white;outline-offset:1px':''}">${on?'✓ 선택됨':'선택'}</button></div>`;}).join('')}</div><div class="image-candidate-actions"><button class="btn" data-candidate="register" ${disabled?'disabled':''} style="${disabled?'opacity:.35;cursor:default':''}">이걸로 등록</button><button class="btn ghost" data-candidate="again" ${d.busy?'disabled':''}>다시 뽑기</button><button class="btn ghost" data-candidate="settings" ${d.busy?'disabled':''}>설정 고치기</button>${d.busy?`<button class="btn ghost" data-candidate="stop" ${d.stopped?'disabled':''}>생성 중단</button>`:'<button class="btn ghost" data-candidate="discard">폐기후 닫기</button>'}</div><p class="muted">${d.count>1?'이미지 아래의 선택 버튼을 누른 뒤 등록해 주세요. ':''}등록 전에는 기존 이미지가 바뀌지 않습니다.</p>`}</section>`;
     paintStatus();const sheet=root.querySelector('.sheet');sheet.style.overflowAnchor='none';sheet.scrollTop=d.positions[d.phase]||0;root.scrollTop=outerScroll;
    }
    async function run(){
     release();d.error='';d.progress='';d.stopped=false;d.busy=true;d.phase='results';d.controller=controller();const round=++d.round;render();
     const prepared={...d.config};
     if(initial.prepare){try{await initial.prepare(prepared,message=>{if(valid()&&round===d.round){d.progress=message;paintStatus();}},d.controller.signal);}catch(e){if(!valid()||round!==d.round)return;if(!d.stopped)d.error='장면 구성 실패: '+Core.naiErr(e);d.busy=false;render();return;}if(!valid()||round!==d.round)return;if(d.stopped){d.busy=false;render();return;}}
     Object.assign(d.config,prepared);d.progress='';paintStatus();
     for(let i=0;i<d.count;i++){
      if(!valid()||round!==d.round||d.stopped)break;
      const config={...prepared};if(i>0||round>1)config.seed='';
      try{paintStatus();const blob=await generate(config,i,d.controller.signal);if(!valid()||round!==d.round)return;if(d.stopped)break;d.items.push({blob,url:URL.createObjectURL(blob),config:{...config}});}
      catch(e){if(!valid()||round!==d.round)return;d.error=`${i+1}번째 이미지 생성 실패: ${Core.naiErr(e)}${d.items.length?' · 완료된 후보는 선택해 등록할 수 있어요.':''}`;break;}
      if(i+1<d.count)render();
     }
     if(!valid()||round!==d.round)return;d.busy=false;if(d.count===1&&d.items.length){d.selected=0;if(initial.prepare){d.items[0].blob.__candidateConfig=d.items[0].config;finish(d.items[0].blob);return;}}render();
    }
    root.addEventListener('click',e=>{const b=e.target.closest('[data-candidate]');if(!b||b.disabled||!valid())return;const a=b.dataset.candidate;
     if(a==='close'){d.back();return;}
     if(a==='count'){d.count=Number(b.dataset.count);if(d.count===1&&!initial.prepare){d.closed=true;clearInterval(timer);root.remove();IMAGE_CANDIDATES=null;Promise.resolve().then(()=>generate({...d.config},0)).then(resolve,reject);}else run();return;}
     if(a==='stop'){d.stopped=true;d.controller?.abort();render();return;}
     if(d.busy)return;
     if(a==='discard'){d.cancel();return;}
     if(a==='select'){const i=Number(b.dataset.index);if(d.items[i]){d.selected=i;for(const [j,card]of [...root.querySelector('.image-candidate-grid').children].entries()){const on=j===i,b=card.querySelector('[data-candidate=select]');card.style.borderColor=on?'#fff':'transparent';card.style.background=on?'color-mix(in srgb,var(--accent,#7b6bff) 22%,transparent)':'';b.className='btn'+(on?'':' ghost');b.textContent=on?'✓ 선택됨':'선택';b.setAttribute('aria-pressed',String(on));b.style.outline=on?'2px solid white':'';b.style.outlineOffset=on?'1px':'';}const register=root.querySelector('[data-candidate=register]');register.disabled=false;register.style.opacity='';register.style.cursor='';}return;}
     if(a==='register'){const x=d.items[d.selected];if(!x)return;try{x.blob.__candidateRegistered=true;x.blob.__candidateConfig=x.config;}catch(_){}finish(x.blob);return;}
     if(a==='again'){run();return;}
     if(a==='settings'){d.phase='settings';render();return;}
     if(a==='results'){d.phase='results';render();return;}
     if(a==='apply-settings'){for(const el of root.querySelectorAll('[data-candidate-field]')){const k=el.dataset.candidateField;if(k==='count')d.count=Number(el.value);else d.config[k]=el.value;}d.config.promptParts=CharactersView.naiBlocksFieldParts(root.querySelector('[data-candidate-field=prompt]'));run();}
    });
    const style=document.getElementById('image-candidate-style');if(!style){const s=document.createElement('style');s.id='image-candidate-style';s.textContent='@keyframes imageCandidateDots{0%,100%{opacity:.3}50%{opacity:1}}.image-candidate-dots{display:inline-block;animation:imageCandidateDots .9s infinite}#image-candidate-dialog button:disabled{pointer-events:none}.image-candidate-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:16px}.image-candidate-actions>.btn.ghost:not(:disabled){background:#443952;color:#fff;border:1px solid #a293b5;opacity:1;box-shadow:inset 0 1px 0 #ffffff18}.image-candidate-actions>.btn.ghost:not(:disabled):hover{background:#574969;border-color:#d9cbea}.image-candidate-actions>.btn.ghost:not(:disabled):active{background:#65547a}.image-candidate-actions>.btn:disabled{opacity:.35}.image-candidate-actions>.btn{width:100%;min-width:0;padding-inline:10px;min-height:44px;white-space:normal;word-break:keep-all;overflow-wrap:normal}@media(min-width:640px){.image-candidate-actions{grid-template-columns:repeat(4,minmax(0,1fr))}}';document.head.append(s);}
    document.body.append(root);render();
   });
  }

  static npcCardHTML(n){ const st=Characters.imgSrc(n), up=n.upper&&Characters.imgSrc(n.upper), busy=NPCBUSY.has(n.id);
    return `<div class="npc-card" id="npc_${n.id}"><div class="npc-imgs"><div>${st?`<img src="${esc(st)}" alt="">`:'<span>스탠딩 없음</span>'}<i>스탠딩</i></div><div>${up?`<img src="${esc(up)}" alt="">`:'<span>상반신 없음</span>'}<i>상반신</i></div></div>
      <div class="npc-f"><div class="g2"><div><label class="f">이름</label><input class="in" data-nf="name" value="${esc(n.name)}" maxlength="20"></div><div><label class="f">역할</label><input class="in" data-nf="role" value="${esc(n.role||'')}" placeholder="예: 정보상"></div></div>
      <label class="f">설정 <span class="muted" style="font-size:.76rem">(성격·과거·누구와 어떤 사이인지, 짧게 · 스토리를 쓸 때 AI가 참고해요)</span></label><textarea class="in" data-nf="profile" style="min-height:56px" maxlength="600" placeholder="예: 항구 뒷골목의 정보상. 돈만 밝히는 척하지만 카야에게는 빚이 있어서 공짜로 정보를 준다.">${esc(n.profile||'')}</textarea>
      <label class="f">말투</label><input class="in" data-nf="speech" value="${esc(n.speech||'')}" maxlength="80" placeholder="예: 느긋한 반말, '~라구'를 붙임">
      <label class="f">외모 (한국어 메모)</label><input class="in" data-nf="look" value="${esc(n.look||'')}" placeholder="예: 은발 단발, 검은 정장, 안경">
      <label class="f">외형 프롬프트 (그림 AI 영어 태그)</label><textarea class="in" data-nf="naiPrompt" style="min-height:70px" placeholder="1girl, solo, short silver hair, glasses, black suit">${esc(n.naiPrompt||'')}</textarea>
      <div class="row" style="margin-top:6px"><button class="btn sm" data-act="npcsave" data-id="${n.id}">저장</button>${SAMPLE?`<button class="btn sm ghost" data-act="npctags" data-id="${n.id}">✦ 외모로 태그 쓰기</button>`:''}</div>
      <div class="row" style="margin-top:6px">${Core.imgReady()?`<button class="btn sm" data-act="npcdraw" data-k="char" data-id="${n.id}" ${busy?'disabled':''}>${busy?'그리는 중…':st?'스탠딩 다시 그리기':'스탠딩 그리기'}</button><button class="btn sm ghost" data-act="npcdraw" data-k="upper" data-id="${n.id}" ${busy?'disabled':''}>${up?'상반신 다시 그리기':'상반신 그리기'}</button>`:''}<button class="btn sm ghost" data-act="upload" data-k="npc" data-id="${n.id}">스탠딩 올리기</button><button class="btn sm ghost" data-act="upload" data-k="npcup" data-id="${n.id}">상반신 올리기</button>${n.img?XBTN('npc',n.id,'','스탠딩 지우기'):''}${n.upper&&n.upper.img?XBTN('npcup',n.id,'','상반신 지우기'):''}<button class="btn sm ghost" data-act="npcdel" data-id="${n.id}">삭제</button></div></div></div>`; }

  static openNpcs(){ const L=G.npcs||[]; CoreView.openModal(`${head('NPC',`<span class="muted">${L.length}명 · 스토리 조연</span>`)}
      <p class="muted" style="margin:0 0 10px;font-size:.82rem">외형 프롬프트를 고치고 '저장'한 뒤 다시 그리면 새 모습으로 바뀌어요. 스토리 대본에 같은 이름으로 나오면 그 그림이 떠요.</p>
      ${L.map(CharactersView.npcCardHTML).join('')||'<p class="muted">아직 NPC가 없어요.</p>'}
      <div class="row" style="margin-top:10px"><input class="in" id="npc_new" placeholder="새 NPC 이름" maxlength="20" style="flex:1"><button class="btn sm" data-act="npcadd">추가</button></div>
      ${SAMPLE?`<button class="btn sm ghost block" style="margin-top:8px" data-act="npcscan">✦ 스토리에 자주 나온 인물을 NPC로 추가 (그림 프롬프트까지)</button>`:''}`); }

  static npcRefresh(id){ const n=(G.npcs||[]).find(x=>x.id===id), el=document.getElementById('npc_'+id); if(n&&el){ const t=document.createElement('div'); t.innerHTML=CharactersView.npcCardHTML(n); el.replaceWith(t.firstElementChild); } }

  static openCastFaces(){ const cs=Characters.castChars().filter(c=>!c.npc&&Characters.imgSrc(c)); if(!cs.length){ CoreView.toast('먼저 전신을 그려 주세요'); return; } if(!CFSEL) CFSEL={faces:new Set(FACE_BASIC.filter(x=>x!=='평온')),chars:new Set(cs.map(c=>c.id)),body:'both'};
    const names=[...new Set([...FACE_BASIC,...FACE_PRESETS.map(p=>p[0])])];
    CoreView.openModal(`${head('표정 한꺼번에 만들기','<span class="muted">얼굴만 다시 그리기(인페인팅)</span>')}
      <p class="muted" style="margin:0 0 8px">캐릭터마다 얼굴 범위를 한 번씩 칠하면(이미 칠했으면 건너뜀), 고른 표정을 모두 차례로 그려요. 얼굴 범위는 한 번 칠하면 모든 표정에 같이 써요.</p>
      <label class="f">표정</label><div class="chips">${names.map(n=>`<button class="chip ${CFSEL.faces.has(n)?'on':''}" data-act="cfsel" data-k="f" data-v="${esc(n)}">${esc(n)}</button>`).join('')}</div>
      <label class="f">캐릭터</label><div class="chips">${cs.map(c=>{ const nf=(c.faces||[]).filter(f=>Characters.imgSrc(f)).length; return `<button class="chip ${CFSEL.chars.has(c.id)?'on':''}" data-act="cfsel" data-k="c" data-v="${c.id}">${esc(c.name)}${nf?' · '+nf:''}</button>`; }).join('')}</div>
      <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-act="cfall" data-k="c" data-v="1">캐릭터 모두 고르기</button><button class="btn sm ghost" data-act="cfall" data-k="c" data-v="0">모두 빼기</button></div>
      <label class="f" style="margin-top:8px"><input type="checkbox" id="cf_skip" ${CFSEL.skip!==false?'checked':''}> 이미 그린 표정은 건너뛰기</label>
      <label class="f" for="cf_body">그릴 그림</label><select class="in" id="cf_body">${CoreView.opt([['both','전신 + 상반신'],['full','전신만'],['up','상반신만']],CFSEL.body)}</select>
      <div class="row" style="margin-top:14px"><button class="btn" data-act="cfgo">얼굴 범위 칠하고 시작</button></div>`); }

  static castFacesGo(){ CFSEL.body=$('#cf_body')?$('#cf_body').value:'both'; CFSEL.skip=$('#cf_skip')?$('#cf_skip').checked:true; if(!CAST) CAST={q:[],busy:null}; /* 게임 중(유닛 탭)에도 같은 줄로 그려요 */ const faces=[...CFSEL.faces], cs=Characters.castChars().filter(c=>CFSEL.chars.has(c.id)&&!c.npc&&Characters.imgSrc(c));
    if(!faces.length||!cs.length){ CoreView.toast('표정과 캐릭터를 하나 이상 골라 주세요'); return; } CoreView.closeModal();
    const jobs=[]; cs.forEach(c=>{ (CFSEL.body==='both'?['full','up']:[CFSEL.body]).forEach(b=>{ const o=b==='up'?c.upper:c; if(o&&Characters.imgSrc(o)) jobs.push({c,b,o}); }); });
    let i=0; const next=()=>{ while(i<jobs.length&&(jobs[i].c.faceMask||{})[jobs[i].b]) i++;
      if(i>=jobs.length){ let n=0; jobs.forEach(j=>{ if(!(j.c.faceMask||{})[j.b]) return; faces.forEach(name=>{ const have=(j.c.faces||[]).find(q=>q.name===name), done=have&&(j.b==='up'?have.up&&Characters.imgSrc(have.up):Characters.imgSrc(have)); if(CFSEL.skip&&done) return; if(!CAST.q.some(x=>x.c===j.c.id&&x.k==='face'&&x.name===name&&x.b===j.b)){ CAST.q.push({c:j.c.id,k:'face',name,b:j.b}); n++; } }); }); CharactersView.castRefresh(); CoreView.toast(n?`표정 ${n}장을 차례로 그려요`:'그릴 표정이 없어요'); CoreCtl.castRun(); return; }
      const j=jobs[i], tot=jobs.filter(x=>!(x.c.faceMask||{})[x.b]).length;
      CharactersView.openMaskPainter(Characters.imgSrc(j.o),null,url=>{ j.c.faceMask=Object.assign({},j.c.faceMask||{},{[j.b]:url}); Core.mark('c:'+j.c.id); i++; next(); },{title:`${j.c.name} · ${j.b==='up'?'상반신':'전신'} 얼굴 범위 (남은 ${tot})`,onCancel:()=>{ for(let k=jobs.length-1;k>=i;k--) if(jobs[k].c===j.c) jobs.splice(k,1); next(); }}); };
    next(); }

  static castRefresh(id){ const g=$('#castGrid'); if(!g){ CoreView.castStat(); return; } const one=c=>{ const el=g.querySelector(`[data-cid="${c.id}"]`); if(el) el.outerHTML=MiscView.castCardHTML(c); }; if(id){ const c=castById(id); if(c) one(c); } else Characters.castChars().forEach(one); CoreView.castStat(); }

    /* 캐스팅 창 캐릭터 칩 모두 켜기/끄기(View) */
static castCharChipsShow(on){ document.querySelectorAll('#modal [data-act="cfsel"][data-k="c"]').forEach(b=>CoreView.chipOn(b,on)); }

    // 그림 지우기(imgx) 대상: 종류(k)별로 지울 그림 객체·이름·지운 뒤 다시 그릴 화면
static imgTarget(k,id,t){ const re=f=>()=>{ Challenge.render(); f&&f(); };
    if(k==='char'){ const o=charById(id); return {o,what:o&&o.name+' 스탠딩',after:re(()=>CharactersCtl.openChar(id))}; }
    if(k==='weapon'){ const c=charById(id); return {o:c&&c.weapon,what:c&&(c.weapon.name||System.T('weapon'))+' 그림',after:re(()=>CharactersCtl.openChar(id))}; }
    if(k==='lib'){ const o=libById(id); return {o,what:o&&'「'+o.name+'」 그림',after:re(()=>CharactersView.openLibItem(id))}; }
    if(k==='npc'||k==='npcup'){ const n=(G.npcs||[]).find(x=>x.id===id); return {o:n&&(k==='npc'?n:n.upper),what:n&&n.name+(k==='npc'?' 스탠딩':' 상반신'),after:()=>CharactersView.npcRefresh(id)}; }
    if(k==='shk') return {o:G.meta.shop&&G.meta.shop.self,what:'상점 주인 그림',after:()=>{ SHOP_LINE=''; const pv=document.querySelector('.sk-prev'); if(pv) pv.innerHTML='<span>그림 없음</span>'; Challenge.render(); }};
    if(k==='skinpart'){ const c=charById(id), sk=c&&(c.skins||[]).find(x=>x.id===t.dataset.s), x=t.dataset.x; return {o:sk&&(x==='stand'?sk:Characters.skinPart(sk,x)),what:sk&&sk.name+' '+(x==='stand'?'스탠딩':(SKP[x]||'')),after:re(()=>CharactersCtl.skinRefresh(id))}; }
    return {o:null,what:'그림',after:()=>Challenge.render()}; }

  static enemyArt(e,cls){const l=Art.enemyLib(e.name), ch=G.chars.find(c=>c.name===e.name), s=(ch&&Characters.imgSrc(ch))||(l&&Characters.imgSrc(l)); return s?`<img class="en-img ${cls||''}" src="${esc(s)}" alt="${esc(e.name)}" draggable="false">`:`<div class="shape"><i></i></div>`;}

  static lobbyCharacterArt(c,cls='lobby-art',face=''){
   const sk=Characters.skinOf(c),faces=sk?.upper&&Characters.imgSrc(sk.upper)?sk.faces:c.faces,f=(faces||[]).find(x=>x.name===face),src=f?.up&&Characters.imgSrc(f.up)||sk?.upper&&Characters.imgSrc(sk.upper)||c.upper&&Characters.imgSrc(c.upper);
   if(sk&&c.useStanding!==false&&!Art.imgSrcRaw(sk.upper)&&Core.skinPreviewSrc(c,sk))return CoreView.art(c,cls,{upper:true,face});
   return src?`<img class="art upimg ${cls}" src="${esc(src)}" alt="${esc(c.name)}" draggable="false">`:CoreView.art(c,cls,{upper:true,face});
  }

  static inheritHTML(c){ // 캐릭터 화면의 상속 정보
    const b=c&&c.alt&&G.chars.find(x=>x.id===c.alt); if(!b||!c.over) return ''; const o=c.over, keys=Object.keys(o).filter(k=>k!=='statMul'), sm=o.statMul||{};
    const items=[...keys.map(k=>[k,Characters.inheritLabel(k)]),...Object.entries(sm).map(([k,v])=>[k,`${Characters.inheritLabel(k)} ×${v}`])];
    return `<div class="panel" style="margin:6px 0;padding:8px 10px"><p class="muted" style="margin:0 0 4px;font-size:.82rem">원본 「${esc(b.name)}」을(를) 물려받아요. 원본을 고치면 아래에 없는 항목은 같이 바뀌어요.</p>${items.length?`<div class="row" style="flex-wrap:wrap;gap:4px">${items.map(([k,l])=>`<button class="chip" data-act="inhreset" data-id="${c.id}" data-k="${k}" title="원본 값으로 되돌리기">${esc(l)} ✕</button>`).join('')}<button class="btn sm ghost" data-act="inhreset" data-id="${c.id}" data-k="*">모두 원본 따르기</button></div>`:'<p class="muted" style="margin:0;font-size:.82rem">바꾼 항목 없음 (모두 원본과 같아요)</p>'}</div>`; }

  static linePop(c,text,face){
    if(!c||!text) return; document.querySelectorAll('.linepop').forEach(x=>x.remove());
    const d=document.createElement('div'); d.className='linepop'; d.innerHTML=`<div class="lp-art">${CoreView.art(c,'',{face})}</div><div class="lp-t"><b>${esc(c.name)}</b><span>${esc(sub(text))}</span></div>`;
    document.body.appendChild(d); setTimeout(()=>d.remove(),4200); if(c.voiceId) CoreView.speak(c,text);
  }

  static openGift(cid){
    const c=charById(cid), inv=Core.progRead('gifts'), likes=Characters.giftLikes(c), seen=(P().giftSeen||{})[cid]||{};
    const items=GIFTS.filter(g=>inv[g[0]]>0);
    const full=Characters.affFull(Characters.own(c.id));
    CoreView.openModal(`${head(`${esc(c.name)}에게 선물하기`,`<span class="muted">호감도 Lv.${Core.affLv(Characters.own(c.id))}${full?' · <b style="color:var(--rose)">MAX</b>':''} · 좋아하는 선물은 효과가 2배예요</span>`)}
      ${full?`<p class="gf-full">♥ 호감도가 가득 찼어요. 선물을 더 줘도 오르지 않으니 다른 ${esc(System.T('crew'))}에게 주세요.</p>`:''}
      ${items.length?`<div class="gf-grid">${items.map(g=>`<button class="gf-it" data-act="giftgive" data-id="${esc(cid)}" data-v="${g[0]}" ${full?'disabled':''}><em>${g[2]}</em><b>${esc(g[1])}</b><span>×${inv[g[0]]} · +${g[3]}${seen[g[0]]===2?' <i class="gf-like">♥ 좋아해요</i>':seen[g[0]]===1?' <i class="gf-meh">무난</i>':''}</span></button>`).join('')}</div>`
        :`<p class="muted">가진 선물이 없어요. 상점의 '선물 꾸러미', 일일 보급, 파견, 도전 보상에서 얻을 수 있어요.</p><div class="row"><button class="btn sm" data-act="go" data-to="shop">상점 가기</button></div>`}`);
  }

  static lobbyHTML(){
    const p=P(), c=charById(p.sec), has=c&&Characters.own(c.id), nx=Story.nextStage(), evs=G.events.filter(ev=>ev.active!==false&&Acquire.gateOpen(ev));
    // 자동 로비는 레이어 유지: 포즈 → 상반신 → 스탠딩. 일러스트는 별도 표시 모드에서 사용합니다.
    const oo=has?Characters.own(c.id):null, lm=p.lobbyMode||'auto', poseSrc=has&&!(Characters.skinOf(c)&&Characters.imgSrc(Characters.skinOf(c)))&&c.pose&&Characters.imgSrc(c.pose), layer=lm==='layer'||(lm==='auto'&&!!has), ill=has&&lm!=='stand'&&!layer&&((oo.useCg&&oo.dup>=5&&Characters.lbcgSrc(c))||Characters.charIllust(c)), pose=layer&&poseSrc;
    const bn=Acquire.curBanner(), bup=bn&&((bn.pickup||[]).map(charById).filter(Boolean)[0]||Characters.bannerPool(bn).filter(x=>x.rarity===3)[0]);
    const TYPE={std:'STANDARD',pickup:'PICK UP',pool:'FACTION',event:'EVENT LIMITED'};
    const ico=(act,to,ic,label,badge,hot)=>`<button class="lb-ico ${hot?'hot':''}" data-act="${act}" ${to?`data-to="${to}"`:''}><span class="ic">${ICO[ic]}</span><b>${esc(label)}</b>${badge?`<em>${badge}</em>`:''}</button>`;
    const newN=p.live.notices.filter(n=>n.at>p.live.seen).length;
    return `<div class="lobby ${ill?'ill':''} ${layer?'layer':''} lbsz-${esc(p.lbSize||'fit')}">${layer?`<div class="lb-far" style="${has&&c.lbbg&&Characters.imgSrc(c.lbbg)?`background-image:url('${esc(Characters.imgSrc(c.lbbg))}')`:ArtView.bgStyle(p.lobbyBg||'새벽등대 사무소')}"></div>`:''}
      <div class="lb-stage" ${has?'data-act="poke" role="button" tabindex="0"':'data-act="lbshow"'} style="${ill?'background:#000':layer?'background:transparent':ArtView.bgStyle(p.lobbyBg||'새벽등대 사무소')}">
        ${ill?`<img class="lobby-ill" src="${esc(ill)}" alt="${esc(c.name)}" draggable="false">`:pose?`<img class="art lobby-art lobby-pose" src="${esc(pose)}" alt="${esc(c.name)}" draggable="false">`:has?(layer?CharactersView.lobbyCharacterArt(c):CoreView.art(c,'lobby-art')):''}<div class="lb-shade"></div>
      </div>
      <div class="lb-ui">
        ${bn?`<button class="lb-banner" data-act="go" data-to="contract" data-swipe="banner"><span class="bgl" style="${bn.bg?ArtView.bgStyle(bn.bg):ArtView.bgStyle(p.gachaBg||'낙성 분화구')}"></span><span class="bt"><i>${TYPE[bn.type]||'RECRUIT'}</i><b>${esc(bn.name)}</b><span>${bup?esc(bup.name)+' 확률 업':esc(System.T('gacha'))}</span></span><span class="bf">${bup?noSkin(()=>CoreView.art(bup))():''}</span></button>`:''}
        <div class="lb-tr"><button class="lb-pass" data-act="go" data-to="pass"><i>SEASON PASS</i><b>Lv.${passLv()}</b>${Characters.passClaimable()?'<em></em>':''}</button>${CharactersView.seasonChip()}</div>
        <div class="lb-left">
          ${ico('phone','','talk',System.T('talk'),Characters.unread()||'')}
          ${evs.length?ico('go','event','event',System.T('event'),evs.length):''}
          ${ico('go','notice','notice','공지',newN||'')}
          ${ico('go','codex','book','도감',Characters.cxNewFast()||'')}
          ${p.daily!==today()?ico('daily','','gift','일일 보급','!',true):''}
        </div>
        <div class="lb-right">
          ${ico('mailopen','','mail','우편함',Economy.mailCount()||'',Economy.mailCount()>0)}
          ${ico('go','disp','disp',System.T('dispatch'),dispDone()||'')}
          ${ico('go','sched','talk','일정',G.chars.some(c=>Characters.own(c.id))&&Core.progRead('sched').left?Core.progRead('sched').left:'')}
          ${ico('go','farm','farm',System.T('farm'),'')}
          ${ico('go','challenge','raid','도전',Core.progRead('rogue').run?'!':(Challenge.raidTriesLeft()&&!Core.progRead('raid').killed?Challenge.raidTriesLeft():''))}
          ${ill||has?ico('lbhide','','eye','숨기기',''):''}
        </div>
        <div class="lb-foot">
        ${has?`<div class="bubble" id="bubble">${esc(sub(rand(Characters.affLinePool(c))||'…'))}</div>`:''}
        <div class="lb-id">${has?`<i>${esc(G.meta.sub)}</i><b>${esc(c.name)}</b><span>${esc(c.faction||ROLE[c.role])} · 호감도 Lv.${Core.affLv(Characters.own(c.id))}</span>`:`<i>${esc(G.meta.sub)}</i><b>${esc(G.meta.title)}</b><span>첫 ${System.T('gacha')}로 ${System.T('crew')}을(를) 만나세요</span>`}</div>
        <div class="lb-bottom">
          <div class="lb-shops">
            <button class="lb-shop cash" data-act="go" data-to="cash">${ICO.gem}<span><i>CASH SHOP</i><b>캐시 상점</b></span></button>
            <button class="lb-shop" data-act="go" data-to="shop">${ICO.shop}<span><i>SUPPLY SHOP</i><b>상점</b></span></button>
          </div>
          <button class="lb-sortie" data-act="go" data-to="ops"><i>COMBAT</i><b>${esc(System.T('ops'))} 출격</b><span>${nx?esc(nx.code+' '+nx.s.title):'모든 '+esc(System.T('ops'))+' 완료'}</span></button>
        </div></div>
      </div>
    </div>`;
  }

  static openPersona(cid){ const c=charById(cid); if(!c) return; const p=c.persona||{}, cfg=Characters.PERSONA_CFG(), f=c.pfields||{}, keys=[...new Set([...cfg.tpl,...Object.keys(f)])];
    CoreView.openModal(`${head(`${c.name} 개성 편집`)}<p class="muted" style="font-size:.8rem;margin:0 0 6px">목록 항목은 쉼표로 나눠요. 비운 칸은 지워져요.</p>
    ${PERSONA_FIELDS.map(([k,l,t])=>`<label class="f">${esc(l)}</label><input class="in" data-ps="${k}" value="${esc(t==='list'?(p[k]||[]).join(', '):p[k]||'')}">`).join('')}
    <h3 class="sec" style="margin-top:12px">프로필</h3><div class="g2">${keys.map(k=>`<div><label class="f">${esc(k)}</label><input class="in" data-pf="${esc(k)}" value="${esc(f[k]||'')}"></div>`).join('')}</div>
    <label class="f" style="margin-top:8px">추가 항목 (이름=값, 줄마다)</label><textarea class="in" id="ps_extra" rows="2" placeholder="별명=○○"></textarea>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="pssave" data-id="${c.id}">저장</button><button class="btn ghost" data-act="close">취소</button></div>`); }

  static personaPanel(){ const L=G.chars.filter(c=>!c.alt).map(c=>({c,r:Characters.personaReview(c)})), avg=L.length?Math.round(L.reduce((a,x)=>a+x.r.score,0)/L.length):0, low=L.filter(x=>x.r.score<55).length;
    return `<div class="panel pm-hide"><h3>캐릭터 개성·매력 ${low?`<span class="badge">약함 ${low}</span>`:''}</h3><p class="muted" style="margin:0 0 6px">개성 평균 ${avg}점. 개성 시트(성격·말투·반전 매력·결점…), 프로필 템플릿, 검수, 인연 톡·메모리얼을 관리해요.</p><button class="btn sm" data-act="psopen">개성 검수·설정</button></div>`; }

  static openPersonaAll(){ const cfg=Characters.PERSONA_CFG(), L=G.chars.filter(c=>!c.alt).map(c=>({c,r:Characters.personaReview(c)})).sort((a,b)=>a.r.score-b.r.score), cur=Object.entries(PROFILE_TPLS).find(([,v])=>v.join()===cfg.tpl.join());
    CoreView.openModal(`${head('캐릭터 개성 검수·설정')}
    <h3 class="sec">프로필 템플릿</h3><select class="in" id="ps_tpl">${[['basic','기본 (생일·신장·출신·특기)'],['org','소속 조직 (소속·직책 …)'],['operator','작전 요원 (코드네임·전투 경력·임상 소견 …)'],['fantasy','판타지 (종족·계약 …)'],['idol','아이돌 (소속사·데뷔·담당·팬덤 …)'],['streamer','스트리머 (활동명·플랫폼·구독자 애칭 …)'],['custom','직접 입력']].map(([k,l])=>`<option value="${k}" ${(cur?cur[0]:'custom')===k?'selected':''}>${l}</option>`).join('')}</select>
    <label class="f">항목 (쉼표)</label><input class="in" id="ps_tplf" value="${esc(cfg.tpl.join(', '))}">
    <div class="g2"><div><label class="f">인연 톡 호감도 단계 (쉼표)</label><input class="in" id="ps_aff" value="${esc(cfg.affLv.join(', '))}"></div><div><label class="f">메모리얼 호감도</label><input class="in" type="number" id="ps_memo" min="1" max="10" value="${cfg.memoLv}"></div></div>
    <div class="row" style="margin:8px 0"><button class="btn sm" data-act="pscfg">설정 저장</button></div>
    <h3 class="sec">검수 결과 <span class="muted" style="font-size:.8rem">(낮은 순)</span></h3>
    <div style="max-height:280px;overflow:auto;font-size:.82rem">${L.map(({c,r})=>`<label style="display:flex;gap:6px;align-items:flex-start;padding:3px 0;border-bottom:1px solid var(--line)"><input type="checkbox" data-psc="${c.id}" ${r.score<55?'checked':''}><b style="min-width:70px">${esc(c.name)}</b><span class="badge">${r.grade} ${r.score}</span><span class="muted">${esc(r.issues.slice(0,3).map(x=>x.msg).join(' · '))}${r.issues.length>3?' …':''}</span></label>`).join('')}</div>
    <div class="row" style="margin-top:8px;flex-wrap:wrap;gap:6px"><button class="btn sm" data-act="psbatch" data-k="fill">선택: AI로 개성 채우기</button><button class="btn sm ghost" data-act="psbatch" data-k="improve">선택: AI로 다듬기(+대사)</button><button class="btn sm ghost" data-act="psbatch" data-k="talk">선택: 인연 톡 만들기</button><button class="btn sm ghost" data-act="psbatch" data-k="memo">선택: 메모리얼 만들기</button>${PS_JOB?'<button class="btn sm ghost" data-act="psstop">멈추기</button>':''}${typeof AUDIT_UNDO!=='undefined'&&AUDIT_UNDO?`<button class="btn sm ghost" data-act="psundo">되돌리기: ${esc(AUDIT_UNDO.label)}</button>`:''}</div>
    <div class="row" style="margin-top:12px"><button class="btn ghost" data-act="close">닫기</button></div>`); }

  static phNewList(){ PH=null; const list=[...new Set(G.chars.map(c=>baseChar(c)))].sort((a,b)=>(Characters.own(b.id)?1:0)-(Characters.own(a.id)?1:0)); // 새로 추가한(아직 안 뽑은) 인물도 보여요
    $('#phone').innerHTML=`<div class="phone"><div class="ph-top"><button data-act="phback" aria-label="뒤로">‹</button><b>대화 추가</b><span style="width:30px"></span></div><div class="ph-list">${
      list.length?`<p class="muted" style="margin:10px 14px;font-size:.82rem">누구에게서 새 대화를 받을까요? AI가 선택지가 있는 대화를 써 주거나, 직접 쓸 수 있어요.</p>${list.map(c=>`<button class="ph-row" data-act="phadd" data-id="${esc(c.id)}"><div class="av">${CoreView.art(c)}</div><div class="t"><b>${esc(c.name)}</b><span>${esc(c.faction||'')} · ${Characters.own(c.id)?'호감도 Lv.'+Core.affLv(Characters.own(c.id)):'아직 만나지 않음'}</span></div><span class="fc-go">추가</span></button>`).join('')}`
      :`<p class="muted" style="text-align:center;padding:40px 16px">아직 ${esc(System.T('crew'))}이(가) 없어요.</p>`}</div></div>`; }

  static openModeStage(ch,s){ const cl=!!P().cleared[s.id], first=!cl, code=ch.kind==='event'?'EV'+(ch.stages.indexOf(s)+1):Story.stageCode(s.id), d=s.debate, c=s.contest;
    CoreView.openModal(`${head(esc(code+' '+s.title),`<span class="muted">${s.mode==='debate'?'회담 · 주장 속 모순을 증거·설득으로 돌파':'콘테스트 · '+System.T('crew')+'의 매력으로 심사위원을 사로잡기'}</span>`)}
    ${s.mode==='debate'?`<p><b>상대</b> ${esc(d.opponent)} · <b>목표</b> ${esc(d.goal||'설득')}</p><p class="muted">증거 ${d.evidence.length}개 · 라운드 ${d.rounds.length} · 신뢰도 ${d.hp}</p>`:`<p><b>${esc(c.title)}</b> · 심사위원 ${c.judges.map(j=>`${esc(j.name)}(${CHARM[j.likes]})`).join(', ')}</p><p class="muted">라운드 ${c.rounds} · 경쟁자 ${c.rivals.map(r=>esc(r.name)).join(', ')||'없음'}</p>`}
    <h3 class="sec">${s.mode==='contest'?'출전 (최대 3명)':'함께 갈 동료 (설득에 나설 수 있어요, 최대 4명)'}</h3><div class="row" style="gap:4px;flex-wrap:wrap">${G.chars.filter(x=>Characters.own(x.id)&&!x.monster).map(x=>`<label class="chip ${P().squad.includes(x.id)?'on':''}" style="cursor:pointer"><input type="checkbox" data-mdsel="${x.id}" ${P().squad.includes(x.id)?'checked':''} hidden>${esc(x.name)}</label>`).join('')}</div>
    <p class="muted" style="font-size:.8rem">${first?'첫 클리어 보상: ◆'+s.reward:'다시 도전할 수 있어요'}</p>
    <div class="row"><button class="btn" data-act="mdgo" data-ch="${ch.id}" data-st="${s.id}">${s.pre&&first?'이야기 보고 시작':'시작'}</button>${cl&&s.post?`<button class="btn ghost" data-act="story" data-ch="${ch.id}" data-st="${s.id}" data-k="post">끝난 뒤 이야기</button>`:''}<button class="btn ghost" data-act="chedit" data-ch="${ch.id}">스토리 편집</button></div>`); }

  static seasonChip(){ const s=LiveOps.seasonNow(); if(!s) return ''; const m=LiveOps.seasonMeta(s.type), d=Math.max(0,Math.ceil((s.until-Date.now())/864e5)); return `<button class="lb-season s-${esc(s.type)}" data-act="seasoninfo"><i>${m[3]}</i><b>${esc(m[1])}</b><span>D-${d}</span></button>`; }

  static openPrep(ask){
    try{ Story.scanScriptAssets(); }catch(e){} const all=Art.drawTodo(), cnt=k=>all.filter(x=>x.cat===k).length;
    if(!all.length){ if(!ask) CoreView.toast('미리 그릴 그림이 없어요. 다 준비돼 있어요'); return; }
    const c=Core.naiCfg();
    CoreView.openModal(`${head(ask?'그림을 미리 준비할까요?':'그림 준비실','<span class="muted">NovelAI로 비어 있는 그림을 차례로 그려요</span>')}
      ${Core.imgReady()?'':`<p style="color:var(--rose)">${Core.imgNeed()}</p>`}
      <p class="muted" style="margin:0 0 8px">게임을 하는 동안 뒤에서 한 장씩 그려서 바로 적용해요. 위쪽 진행 표시에서 언제든 멈출 수 있어요. Opus 구독이면 기본 크기 생성은 Anlas가 들지 않아요.</p>
      <div class="prepcats">${PREP_CATS().map(([k,l,d])=>cnt(k)?`<label class="pc"><input type="checkbox" data-pc="${k}" ${d?'checked':''}><b>${esc(l)}</b><span>${cnt(k)}장</span></label>`:'').join('')}</div>
      <div class="row" style="margin-top:14px"> ${SAMPLE&&G.chars.some(c=>c.weapon&&Characters.wpBad(c.weapon.prompt))?`<button class="btn ghost" data-act="wfixall">${System.T('weapon')} 프롬프트 정리 (${G.chars.filter(c=>c.weapon&&Characters.wpBad(c.weapon.prompt)).length})</button>`:''}<button class="btn" data-act="prepgo" ${Core.imgReady()?'':'disabled'}>준비 시작</button><button class="btn ghost" data-act="close">${ask?'나중에':'닫기'}</button>${ask?'<button class="btn ghost" data-act="prepnever">다시 묻지 않기</button>':''}</div>`);
  }

  static openNewPickup(pre){ pre=pre||{};
    CoreView.openModal(`${head('신규 픽업 만들기',`<span class="muted">새 ${esc(System.T('crew'))}을(를) 구상하면 픽업 배너로 올라와요. ${esc(System.T('gacha'))}으로 데려와요.</span>`)}
      <div class="panel" style="display:flex;gap:8px;align-items:center;justify-content:space-between;margin-bottom:8px"><span class="muted" style="font-size:.85rem">이미 있는 ${esc(System.T('crew'))}의 확률을 올리고 싶다면</span><button class="btn sm" data-act="puexist">기존 ${esc(System.T('crew'))} 픽업</button></div>
      <label class="f" for="pu_kind">종류</label><select class="in" id="pu_kind" onchange="document.getElementById('pu_colw').hidden=this.value!=='collab';document.getElementById('pu_altw').hidden=this.value!=='alt'">${CoreView.opt([['orig','오리지널 신규 '+System.T('crew')],['alt','이격 (기존 '+System.T('crew')+'의 다른 모습)'],['collab','콜라보 (다른 작품 캐릭터가 이 세계에 등장)']],pre.kind||'orig')}</select>
      <div id="pu_altw" ${pre.kind==='alt'?'':'hidden'}><label class="f" for="pu_base">누구의 이격인가요?</label><select class="in" id="pu_base">${G.chars.filter(c=>!c.alt).map(c=>`<option value="${c.id}" ${pre.base===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select>
        <label class="f" for="pu_canon">스토리 속 위치</label><select class="in" id="pu_canon">${CoreView.opt([['side','외전 (메인 스토리에 영향 없음 · 예: 갑자기 몸이 바뀐 황당한 소동, 수영복 휴가)'],['canon','정사 (메인 스토리로 이어짐 · 예: 과거를 극복하고 각성한 모습)']],pre.canon?'canon':'side')}</select>
        <p class="muted" style="margin:4px 0 0;font-size:.78rem">외전 이격은 이벤트 스토리에만 나오고, 메인 스토리에서는 원래 모습으로 나와요. 정사 이격은 그 뒤 메인 스토리에서 이 모습으로 나와요. 같은 사람의 다른 모습(수영복, 정장, 각성, 과거 등)이에요. 별도의 ${esc(System.T('crew'))}로 뽑을 수 있고, 속성·역할·스킬이 달라요. 아래 칸에 테마를 적어 주세요.</p></div>
      <div id="pu_colw" hidden><div class="g2"><div><label class="f" for="pu_src">작품 이름</label><input class="in" id="pu_src" placeholder="예: 작품 이름"></div><div><label class="f" for="pu_who">캐릭터 이름 (비우면 AI가 고르기)</label><input class="in" id="pu_who" placeholder="예: 캐릭터 이름"></div></div>
        <p class="muted" style="margin:4px 0 0;font-size:.78rem">원작의 성인 캐릭터만 나와요. 원작에서 미성년자·학생인 캐릭터는 만들지 않아요. 개인 감상용으로만 써 주세요.</p></div>
      <label class="f" for="pu_c">어떤 ${esc(System.T('crew'))}인가요? (설정, 성격, 외모, 무기 등 자유롭게) <span class="muted" style="font-size:.78rem">콜라보는 비워도 돼요</span></label><textarea class="in" id="pu_c" style="min-height:110px" placeholder="예: 몰락한 기사단의 마지막 단장. 말수가 적고 단 것을 좋아한다. 은발, 검은 갑옷, 대검."></textarea>
      <div class="g2"><div><label class="f" for="pu_r">희귀도</label><select class="in" id="pu_r">${CoreView.opt([['3','SSR'],['2','SR'],['1','R'],['ai','AI가 정하기']],'3')}</select></div><div><label class="f" for="pu_lim">배너</label><select class="in" id="pu_lim">${CoreView.opt([['pickup','픽업 (상시 풀에도 들어감)'],['limited','한정 (이 배너에서만)']],'pickup')}</select></div></div>
      <div class="g2"><div><label class="f" for="pu_ex">함께 픽업</label><select class="in" id="pu_ex" onchange="const n=+this.value;document.querySelectorAll('.pu-exr').forEach((r,i)=>r.hidden=i>=n);document.getElementById('pu_splitw').hidden=!n">${CoreView.opt([['0','없음 (1명)'],['1','+1명 (2명 픽업)'],['2','+2명 (3명 픽업)']],'0')}</select></div>
        <div id="pu_splitw" hidden><label class="f" for="pu_split">배너 나누기</label><select class="in" id="pu_split">${CoreView.opt([['same','한 배너에 함께 (예: SSR + SR 2명)'],['split','각자 배너 (예: SSR 1차 · SSR 2차 픽업)']],'same')}</select></div></div>
      ${[1,2].map(i=>`<div class="pu-exr g2" hidden><div><label class="f" for="pu_exr${i}">함께 ${i} 희귀도</label><select class="in" id="pu_exr${i}">${CoreView.opt([['2','SR'],['3','SSR'],['1','R']],'2')}</select></div><div><label class="f" for="pu_exc${i}">함께 ${i} 설정 (비우면 AI가 어울리게)</label><input class="in" id="pu_exc${i}" placeholder="예: 주인공의 부관, 쌍검을 쓰는 쾌활한 사람"></div></div>`).join('')}
      ${SAMPLE?`<label style="display:flex;gap:8px;margin-top:10px"><input type="checkbox" id="pu_story" checked><span>픽업 스토리도 같이 만들기 <span class="muted" style="font-size:.8rem">(이 ${esc(System.T('crew'))}이(가) 주인공인 짧은 이벤트 3화 · 몇 분 걸려요)</span></span></label>`:''}
      <div class="row" style="margin-top:12px"><button class="btn" data-act="newpu-ai" ${SAMPLE?'':'disabled'}>AI로 구상해서 올리기</button><button class="btn ghost" data-act="newpu-hand">직접 설정 입력</button></div>
      ${SAMPLE?'':'<p class="muted">AI로 구상하려면 설정 → 글 AI를 먼저 등록해 주세요.</p>'}`);
  }

  static openPickExisting(pre){ if(pre||!PUX) PUX={ids:pre&&charById(pre)?[pre]:[],name:'',story:false}; const sn=LiveOps.seasonNow(), ids=PUX.ids, cs=G.chars.slice().sort((a,b)=>b.rarity-a.rarity);
    CoreView.openModal(`${head(System.T('crew')+' 픽업',`<span class="muted">이미 있는 ${esc(System.T('crew'))}의 확률을 올린 배너를 열어요</span>`)}
      <label class="f">픽업할 ${esc(System.T('crew'))} <span class="muted" style="font-size:.78rem">(최대 3명 · 처음 고른 ${esc(System.T('crew'))}가 주인공)</span></label>
      <div class="chips">${cs.map(c=>{ const i=ids.indexOf(c.id); return `<button class="chip ${i>=0?'on':''}" data-act="puxpick" data-id="${c.id}">${i>=0?(i+1)+'. ':''}${RL[c.rarity]} ${esc(c.name)}${c.limited?' · 한정':''}</button>`; }).join('')}</div>
      <label class="f" for="pux_name">배너 이름 <span class="muted" style="font-size:.78rem">(비우면 자동)</span></label><input class="in" id="pux_name" value="${esc(PUX.name||'')}" placeholder="${esc(Core.puxNames()||'예: 세라 픽업')}">
      <div class="g2"><div><label class="f" for="pux_days">기간</label><select class="in" id="pux_days">${CoreView.opt([...(sn?[['season','이번 시즌 끝까지']]:[]),['7','7일'],['14','14일'],['0','계속 (직접 닫을 때까지)']],PUX.days||(sn?'season':'14'))}</select></div>
        <div><label class="f" for="pux_rate">픽업 확률</label><select class="in" id="pux_rate">${CoreView.opt([['50','50% (기본)'],['70','70%'],['100','100% (그 등급이 나오면 무조건)']],PUX.rate||'50')}</select></div></div>
      ${SAMPLE?`<label style="display:flex;gap:8px;margin-top:10px"><input type="checkbox" id="pux_story" ${PUX.story?'checked':''}><span>픽업 스토리도 같이 만들기 <span class="muted" style="font-size:.8rem">(주인공 ${esc(System.T('crew'))}의 짧은 이벤트 3화 · 몇 분 걸려요)</span></span></label>`:''}
      <p class="muted" style="font-size:.8rem;margin:8px 0 0">같은 ${esc(System.T('crew'))}의 지난 픽업 배너가 있으면 그 배너를 다시 열어요(복각). 한정 ${esc(System.T('crew'))}도 이 배너에서는 나와요. 기간이 끝나면 배너가 닫혀요.</p>
      <div class="row" style="margin-top:12px"><button class="btn" data-act="puxgo" ${ids.length?'':'disabled'}>픽업 열기</button><button class="btn ghost" data-act="close">취소</button></div>`); }

    /* 캐릭터만 추가(픽업 배너 없이): 상시 뽑기에 넣거나 바로 내 ${'캐릭터'}로 */
static openAddChar(){ CoreView.openModal(`${head(System.T('crew')+' 추가',`<span class="muted">픽업 배너 없이 캐릭터만 만들어요</span>`)}
      <label class="f" for="ac_c">어떤 ${esc(System.T('crew'))}인가요?</label><textarea class="in" id="ac_c" placeholder="예: 과묵한 정비공, 은발 단발, 렌치를 무기로 씀"></textarea>
      <div class="g2"><div><label class="f" for="ac_r">등급</label><select class="in" id="ac_r">${CoreView.opt([['1','R'],['2','SR'],['3','SSR'],['ai','AI가 정하기']],'2')}</select></div>
      <div><label class="f" for="ac_how">얻는 방법</label><select class="in" id="ac_how">${CoreView.opt([['std','상시 뽑기에 추가'],['own','바로 내 '+System.T('crew')+'로']],'std')}</select></div></div>
      <div class="row" style="margin-top:12px">${SAMPLE?`<button class="btn" data-act="addchar-ai">AI로 만들기</button>`:''}<button class="btn ghost" data-act="addchar-hand">직접 만들기</button></div>`); }

    /* 가챠 컷인 닫기(View) */
static gachaCutHide(el){ el.remove(); }

  static crewHTML(){
    const busy=busyIds(), list=[...G.chars].sort((a,b)=>(Characters.own(b.id)?1:0)-(Characters.own(a.id)?1:0)||b.rarity-a.rarity||(a.ord||0)-(b.ord||0));
    return `${pageHead(System.T('crew'),'UNITS')}<div class="chap"><span class="muted">${G.chars.filter(c=>Characters.own(c.id)).length} / ${G.chars.length}</span><div class="row"><button class="btn sm ghost" data-act="addchar-open">＋ ${esc(System.T('crew'))} 추가</button><button class="btn sm" data-act="newpu">✦ 신규 픽업 만들기</button><button class="btn sm ghost" data-act="castfaces">😊 표정 한꺼번에 만들기</button></div></div>
    <div class="grid">${list.map(c=>{const o=Characters.own(c.id);return `<button class="cc r${c.rarity} ${o?'':'off'}" data-act="char" data-id="${c.id}">${CoreView.art(c)}<span class="el" style="--ec:${ECOL[c.elem]}">${esc(c.elem)}</span>${o&&o.dup?`<span class="dup">${'★'.repeat(o.dup)}</span>`:''}${busy.has(c.id)?'<span class="busy">파견 중</span>':''}<span class="lbl"><i>${RL[c.rarity]} · ${ROLE_EN[c.role]}</i><b>${esc(c.name)}</b>${o?`Lv.${o.lv}`:'미보유'}</span></button>`;}).join('')}</div>`;
  }

  static renderVoice(msg){
    const c=charById(VS.cid);
    CoreView.openModal(`${head(`${esc(c.name)} 목소리`,`<span class="muted">현재: ${c.voiceId?esc(c.voiceName||c.voiceId):'없음'}</span>`)}
      <label class="f" for="vs_q">검색어 (음성 제목)</label><input class="in" id="vs_q" value="${esc(VS.q)}" placeholder="예: 누나, お姉さん, calm female">
      <div class="g2"><div><label class="f" for="vs_lang">언어</label><select class="in" id="vs_lang">${CoreView.opt([['ko','한국어'],['ja','일본어'],['en','영어'],['','전체']],VS.lang)}</select></div>
      <div style="display:flex;align-items:flex-end;gap:6px"><button class="btn sm" data-act="vsearch">검색</button><button class="btn sm ghost" data-act="vsai">AI 추천</button></div></div>
      <label class="f" for="vs_id">또는 보이스 ID나 fish.audio 주소를 직접 입력</label><div class="row"><input class="in" id="vs_id" style="flex:3" placeholder="https://fish.audio/m/..."><button class="btn sm ghost" data-act="vsetid">적용</button></div>
      ${msg?`<p class="muted">${esc(msg)}</p>`:''}
      <div style="margin-top:8px">${VS.results.map(MiscView.voiceRow).join('')}</div>
      ${c.voiceId?`<div class="row" style="margin-top:12px"><button class="btn sm ghost" data-act="vclear" data-id="${c.id}">목소리 해제</button></div>`:''}`);
  }

  static settingsNavigate(next){if(next&&!STTAB)STROOTSCROLL=$('#view').scrollTop;STTAB=next||'';Challenge.render();$('#view').scrollTop=STTAB?0:STROOTSCROLL;}

  static settingsBack(){if(tab!=='studio'||!STTAB)return false;CharactersView.settingsNavigate('');return true;}

    /* 로비 메뉴 숨기기/보이기(View — 화면 감상) */
static lobbyMenuHidden(){ return document.body.classList.contains('lb-hidden'); }

  static lobbyMenu(show){ document.body.classList.toggle('lb-hidden',!show); }

  static lobbyBubbleText(){ const el=$('#bubble'); return el?el.textContent:undefined; }

    // 가로로 긴 그림은 세로 화면에서 돌려서 크게 보여 줘요(버튼으로 되돌리기)
static wideFit(d){ const im=d.querySelector('img'); if(!im) return; const go=()=>{ const wide=im.naturalWidth>im.naturalHeight*1.15; if(!wide) return; const b=document.createElement('button'); b.className='lb-rot'; b.type='button'; b.textContent='⟳ 가로로 보기'; b.addEventListener('click',e=>{ e.stopPropagation(); d.classList.toggle('rot'); b.textContent=d.classList.contains('rot')?'⟲ 세로로 보기':'⟳ 가로로 보기'; }); d.appendChild(b);
        // 휴대폰을 돌리면 그에 맞춰요: 세로로 들고 있을 때만 가로 그림을 눕혀 크게, 가로로 돌리면 바로 원래대로. 직접 누르면 그 선택을 따라요
        let manual=false; b.addEventListener('click',()=>{ manual=true; },true); const fit=()=>{ if(!d.isConnected){ removeEventListener('resize',fit); return; } if(manual) return; const port=innerHeight>innerWidth*1.1&&System.orientPref()!=='landscape'; d.classList.toggle('rot',port); b.textContent=port?'⟲ 세로로 보기':'⟳ 가로로 보기'; }; addEventListener('resize',fit); fit(); }; if(im.complete&&im.naturalWidth) go(); else im.addEventListener('load',go,{once:true}); }

  static lbReveal(c,view){
    const s=view?Characters.imgSrc(c[view]):Characters.imgSrc(c.lbcg); if(!s) return;
    const d=document.createElement('div'); d.className='lbrev'+(view?' view':'');
    d.innerHTML=view?`<img src="${esc(s)}" alt="">`:`<div class="rays"></div><img src="${esc(s)}" alt=""><div class="flash"></div><div class="lbt"><i>MAX ${esc(System.T('limit'))}</i><b>${esc(c.name)}</b><span>특별 일러스트가 공개됐어요 · 화면을 누르면 닫혀요</span></div>`;
    CharactersView.wideFit(d); d.addEventListener('click',e=>{ if(e.target.closest('.lb-rot')) return; d.remove(); }); document.body.appendChild(d); if(!view){ Art.sfx('SSR'); if(c.voiceId&&Core.SND().voiceLobby){ const l=rand(c.dupLines.length?c.dupLines:c.lines); if(l) CoreView.speak(c,l); } }
  }

  static feedbackText(){
    const v=id=>($('#'+id)&&$('#'+id).value.trim())||'-', p=P();
    const ua=(navigator.userAgent.match(/Android [\d.]+|iPhone OS [\d_]+|Windows NT [\d.]+|Mac OS X [\d_]+/)||['알 수 없음'])[0];
    return `[${G.meta.title} 피드백]\n점수: ${FB_STAR?'★'.repeat(FB_STAR)+'☆'.repeat(5-FB_STAR):'-'}\n보낸 사람: ${v('fb_name')}\n\n■ 재미있던 점\n${v('fb_good')}\n\n■ 불편했던 점, 버그\n${v('fb_bad')}\n\n■ 있었으면 하는 것\n${v('fb_want')}\n\n— 버전 ${window.__LIVE__||APP_BUILD} · ${ua} · 화면 ${innerWidth}×${innerHeight} · ${System.T('crew')} ${Object.keys(p.owned).length}/${G.chars.length} · 클리어 ${Object.keys(p.cleared||{}).length}`;
  }

    /* 캐릭터 창 부분 갱신(View): 탭 · 전신/상반신 · 누르기 반응(물결·하트·몸짓·표정·말풍선 — 보였으면 true) */
static csTabShow(){ document.querySelectorAll('.cs-tabs button').forEach(b=>CoreView.chipOn(b,b.dataset.k===CS_TAB)); document.querySelectorAll('[data-cs]').forEach(s=>s.hidden=s.dataset.cs!==CS_TAB); }

  static csFrameShow(t,full){ const a2=$('.cs-art'); if(a2){ a2.classList.toggle('up',!full); const cc=charById(a2.dataset.id); if(cc) a2.innerHTML=CoreView.characterDetailArt(cc,!full); } t.textContent=full?'상반신':'전신'; }

  static csSayText(){ const sy=$('#csSay'); return sy?sy.textContent:undefined; }

  static csPokeShow(t,c,l,owned,lv,zone,x,y){ CoreView.ripple(x,y,lv>=7); if(owned&&lv>=5&&zone==='head') CharactersView.hearts(x,y,Math.min(5,lv-3)); CoreView.charReact(t.querySelector('.art'),lv,zone); CoreView.faceSwap(c,t.querySelector('.art'),Characters.touchFace(c,zone,lv));
    const sy=$('#csSay'); if(!l||!sy) return false; sy.textContent=sub(l); sy.hidden=false; sy.classList.remove('pop'); void sy.offsetWidth; sy.classList.add('pop'); clearTimeout(window._csT); window._csT=setTimeout(()=>{if(sy.isConnected)sy.hidden=true;},3200); return true; }

  static openCharEdit(id){
    const c=id?charById(id):Characters.cleanChar({name:''});
    const kv=o=>Object.entries(o||{}).flatMap(([k,v])=>(v||[]).map(x=>`${k}: ${x}`)).join('\n');
    CoreView.openModal(`${head(id?'설정 편집':'새 '+System.T('crew'))}
      <div class="g2"><div><label class="f" for="f_name">이름</label><input class="in" id="f_name" value="${esc(c.name)}" maxlength="20"></div>
      <div><label class="f" for="f_fac">소속</label><input class="in" id="f_fac" value="${esc(c.faction)}" list="faclist"><datalist id="faclist">${[...new Set(G.chars.map(x=>x.faction).filter(Boolean))].map(f=>`<option value="${esc(f)}">`).join('')}</datalist></div></div>
      <div class="g2"><div><label class="f" for="f_rar">등급</label><select class="in" id="f_rar">${CoreView.opt([[3,'SSR'],[2,'SR'],[1,'R']],c.rarity)}</select></div>
      <div><label class="f" for="f_pos">포지션 <span class="muted" style="font-size:.75rem">(전투 기본형)</span></label><select class="in" id="f_pos">${CoreView.opt(Rules.POSITIONS().map(p=>[p.id,`${p.name} (${ROLE[p.base]}형)`]),Core.posOf(c).id)}</select></div></div>
      <div class="g2"><div><label class="f" for="f_elem">속성</label><select class="in" id="f_elem">${CoreView.opt(ELEMS.map(elem=>[elem,elem]),c.elem)}</select></div>
      <div><label class="f" for="f_lim">한정 여부</label><select class="in" id="f_lim">${CoreView.opt([['0','상시'],['1','한정 (이벤트 배너에서만)']],c.limited?'1':'0')}</select></div></div>
      <div class="g4"><div><label class="f" for="f_hp">기본 체력</label><input class="in" id="f_hp" type="number" value="${c.hp}"></div><div><label class="f" for="f_atk">공격</label><input class="in" id="f_atk" type="number" value="${c.atk}"></div><div><label class="f" for="f_def">기본 방어력</label><input class="in" id="f_def" type="number" value="${c.def}"></div><div><label class="f" for="f_spd">속도</label><input class="in" id="f_spd" type="number" value="${c.spd}"></div></div>
      <p class="muted">아래는 심연탐사 호환용 스킬입니다. 일반 전투 스킬은 캐릭터 상세의 「일반 전투 스킬 편집 · AI 생성」에서 설정하세요.</p>
      <div class="g2"><div><label class="f" for="f_sk">심연탐사 스킬 이름</label><input class="in" id="f_sk" value="${esc(c.skill.name)}"></div><div><label class="f" for="f_kind">스킬 효과</label><select class="in" id="f_kind">${CoreView.opt(Object.entries(KIND),c.skill.kind)}</select></div></div>
      <div class="g2"><div><label class="f" for="f_pow">위력 배율</label><input class="in" id="f_pow" type="number" step="0.1" value="${c.skill.power}"></div><div><label class="f" for="f_cd">쿨타임(턴)</label><input class="in" id="f_cd" type="number" value="${c.skill.cd}"></div></div>
      <label class="f" for="f_skd">스킬 설명</label><input class="in" id="f_skd" value="${esc(c.skill.desc)}">
      <label class="f" for="f_prof">프로필</label><textarea class="in" id="f_prof">${esc(c.profile)}</textarea>
      <label class="f" for="f_files">${System.T('files')} (한 줄에 하나, "${System.T('limit')}단계: 내용")</label><textarea class="in" id="f_files">${esc(c.files.map(f=>f.dup+': '+f.text).join('\n'))}</textarea>
      <label class="f" for="f_intro">${System.T('gacha')} 연출 대사</label><input class="in" id="f_intro" value="${esc(c.intro)}">
      <label class="f" for="f_lines">로비 대사 (한 줄에 하나)</label><textarea class="in" id="f_lines">${esc(c.lines.join('\n'))}</textarea>
      <label class="f" for="f_aff">호감도별 대사 ("레벨: 대사", 그 레벨부터 로비에 섞여 나와요)</label><textarea class="in" id="f_aff">${esc(kv(c.affLines))}</textarea>
      <div class="g2"><div><label class="f" for="f_lv">${System.T('enhance')} 대사</label><textarea class="in" id="f_lv">${esc(c.lvLines.join('\n'))}</textarea></div><div><label class="f" for="f_dup">${System.T('limit')} 대사</label><textarea class="in" id="f_dup">${esc(c.dupLines.join('\n'))}</textarea></div></div>
      <div class="g2"><div><label class="f" for="f_head">머리 터치 반응</label><textarea class="in" id="f_head">${esc(c.touch.head.join('\n'))}</textarea></div><div><label class="f" for="f_body">몸 터치 반응</label><textarea class="in" id="f_body">${esc(c.touch.body.join('\n'))}</textarea></div></div>
      <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-act="ailines">AI로 대사 채우기</button><button class="btn sm ghost" data-act="ailinesmore">AI로 대사 늘리기 (지금 대사에 더해요)</button></div>
      <div class="g2"><div><label class="f" for="f_wn">${System.T('weapon')} 이름</label><input class="in" id="f_wn" value="${esc(c.weapon.name)}"></div><div><label class="f" for="f_wd">${System.T('weapon')} 설명</label><input class="in" id="f_wd" value="${esc(c.weapon.desc)}"></div></div>
      <label class="f" for="f_wp">${System.T('weapon')} NAI 프롬프트</label><textarea class="in" id="f_wp" data-owner="${c.id}">${esc(c.weapon.prompt)}</textarea>
      ${id?`<div class="row" style="margin-top:6px">${SAMPLE?`<button class="btn sm ghost" data-act="wai" data-id="${c.id}">AI로 ${System.T('weapon')} 프롬프트 쓰기</button>`:''}<button class="btn sm ghost" data-act="wnai" data-id="${c.id}">NAI로 ${System.T('weapon')} 그리기</button></div>`:''}
      <label class="f" for="f_nai">NAI 스탠딩 프롬프트</label><textarea class="in" id="f_nai" data-owner="${c.id}">${esc(c.naiPrompt)}</textarea>
      <label class="f" style="margin-top:6px"><input type="checkbox" id="f_nodesign" ${c.noDesign?'checked':''}> 공통 디자인 태그 쓰지 않기 <span class="muted" style="font-size:.78rem">(설정 → 그림 AI → 캐릭터 디자인 통일)</span></label>
      <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-act="ainai">AI로 NAI 프롬프트 쓰기</button></div>
      <div class="row" style="margin-top:16px"><button class="btn" data-act="savechar" data-id="${id||''}">저장</button>${id?`<button class="btn ghost" data-act="delchar" data-id="${c.id}">삭제</button>`:''}</div>`);
  }

  static async openFormation(stage,ctx,startAct){
    try{await v2PrepareStage(stage,ctx);}catch(e){CoreView.toast(e.message);return;}
    FORM=FORM&&FORM.key===(stage.id||stage.title)?FORM:{key:stage.id||stage.title,stage,ctx,startAct,filter:'all',sort:'power'};
    FORM.stage=stage; FORM.ctx=ctx; FORM.startAct=startAct;
    const busy=busyIds(), owned=G.chars.filter(c=>Characters.own(c.id)&&(!ctx.allow||ctx.allow(c)));
    if(!squadSel) squadSel=P().squad.filter(id=>Characters.own(id)&&charById(id)&&!busy.has(id)&&(!ctx.allow||ctx.allow(charById(id)))).slice(0,4);
    const en=stage.enemies, need=Characters.stagePower(stage), tp0=Core.teamPower(squadSel), tp=Characters.effPower(squadSel,en), ratio=need?tp/need:1, fb=Core.factionBonus(squadSel);
    const elemCount={}; en.forEach(e=>{elemCount[e.elem]=(elemCount[e.elem]||0)+1;});
    let list=owned.filter(c=>FORM.filter==='all'||c.elem===FORM.filter||c.role===FORM.filter);
    list.sort((a,b)=>FORM.sort==='lv'?Characters.own(b.id).lv-Characters.own(a.id).lv:FORM.sort==='match'?(Characters.matchup(b,en).good-Characters.matchup(b,en).bad)-(Characters.matchup(a,en).good-Characters.matchup(a,en).bad)||charPower(b)-charPower(a):charPower(b)-charPower(a));
    const slot=i=>{const c=charById(squadSel[i]); if(!c) return `<button class="fslot empty" data-act="fsl" data-i="${i}"><span>+</span><i>${i<2?'전열':'후열'}</i></button>`;
      const m=Characters.matchup(c,en), o=Characters.own(c.id), rw=Rules.rowWarn(c,i,squadSel.length);
      return `<button class="fslot r${c.rarity} ${rw?'rowbad':''}" title="${esc(rw)}" data-act="fpick" data-id="${c.id}" style="--ec:${ECOL[c.elem]}"><div class="fs-art">${CoreView.art(c)}</div><span class="el" style="--ec:${ECOL[c.elem]}">${esc(c.elem)}</span>${Rules.formOn()?`<em class="rgi" title="${RANGE[Core.charRange(c)]}">${RANGE_ICO[Core.charRange(c)]}</em>`:''}${rw?`<em class="rww">${esc(rw)}</em>`:''}${m.good>m.bad?'<em class="adv">유리</em>':m.bad>m.good?'<em class="dis">불리</em>':''}<div class="fs-t"><b>${esc(c.name)}</b><span>Lv.${o.lv} · ${esc(ROLE[c.role])}</span><span class="pw">${nf(charPower(c))}</span></div></button>`;};
    const head2=FORM.ctx.kind==='tower'?`<span class="muted">첫 돌파 보상: ${Core.rewardText(Core.towerReward(FORM.ctx.floor))}</span>`:FORM.ctx.kind==='raid'?`<span class="muted">이번 주 누적 피해로 보상을 받아요 · 오늘 ${Challenge.raidTriesLeft()}/3</span>`:FORM.ctx.kind==='rogue'?`<span class="muted">이 4명으로 끝까지 가요. 체력은 이어져요.</span>`:FORM.ctx.kind==='farm'?`<span class="muted">보상: ${Core.rewardText(Core.farmReward(stage.farm.key,stage.farm.lv))}</span>`:FORM.ctx.kind==='event'?`<span class="muted">이벤트 스테이지</span>`:`<span class="muted">보상 ◆${nf(stage.reward)}${P().cleared[stage.id]?'':' (첫 클리어 2배)'}</span>`;
    CoreView.openModal(`${head(esc(FORM.ctx.code?FORM.ctx.code+' ':'')+esc(stage.title),head2)}
      <div class="fenemy">${en.map(e=>`<div class="fe ${e.boss?'boss':''}" style="--ec:${ECOL[e.elem]}"><div class="fe-art">${CharactersView.enemyArt(e)}</div><span class="el" style="--ec:${ECOL[e.elem]}">${esc(e.elem)}</span><b>${esc(e.name)}</b><span>${e.boss?'BOSS · ':''}${nf(e.hp)}</span></div>`).join('')}</div>
      ${stage.enemies.length&&!stage.story?CharactersView.rulesHTML(stage):''}
      ${en.filter(e=>e.boss).map(e=>`<p class="boss-pat"><b>보스 패턴</b> ${esc(e.name)}: ${esc(Core.bossPatText(e,FORM.ctx.kind==='raid'))}</p>`).join('')}
      <p class="muted" style="margin:6px 0 0">적 속성: ${Object.entries(elemCount).map(([k,v])=>`${esc(k)}×${v}`).join(' ')} → ${Object.keys(elemCount).map(k=>{const w=ELEMS.find(elem=>BEATS[elem]===k);return w?`<b style="color:${ECOL[w]}">${esc(w)}</b> 유리`:'';}).filter(Boolean).join(', ')}</p>
      <div class="fpower"><div><i>편성 능력치 <small style="opacity:.7">상성 반영</small></i><b class="${ratio>=1?'ok':ratio>=0.8?'warn':'bad'}">${nf(tp)}</b>${tp!==tp0?`<small class="muted" style="display:block;font-size:.7rem">기본 ${nf(tp0)}</small>`:''}</div><div><i>적 능력치 (참고)</i><b>${nf(need)}</b></div><div class="fbar"><span style="width:${Math.min(100,ratio*100)}%" class="${ratio>=1?'ok':ratio>=0.8?'warn':'bad'}"></span></div></div>
      <div class="frow"><i>전열</i><i>후열</i></div><div class="fslots">${[0,1,2,3].map(slot).join('')}</div>
      <p class="muted" style="margin:4px 0 0">${Rules.formOn()?esc(Core.formHelp()):'전열은 적의 공격을 두 배로 더 받아요. 방어형은 어디에 있든 공격을 끌어요.'}</p>
      ${Object.keys(fb).length?`<p class="fbonus">${Object.entries(fb).map(([f,v])=>`${esc(f)} 소속 보너스 공격 +${v}%`).join(' · ')}</p>`:`<p class="muted" style="margin:6px 0 0">같은 소속 2명 이상이면 공격 보너스 (2명 5%, 3명 10%, 4명 15%)</p>`}
      <div class="row" style="margin-top:8px"><button class="btn sm" data-act="fauto">자동 편성</button><button class="btn sm ghost" data-act="fclear">비우기</button>${[0,1,2].map(i=>{const pr=(P().presets||[])[i];return `<button class="btn sm ghost" data-act="fpre" data-i="${i}">${pr&&pr.length?'편성 '+(i+1):'빈 '+(i+1)}</button>`;}).join('')}<button class="btn sm ghost" data-act="fsave">현재 편성 저장</button></div>
      <div class="ftools"><div class="chips">${[['all','전체'],...ELEMS.map(elem=>[elem,elem]),...Object.entries(ROLE)].map(([v,l])=>`<button class="chip ${FORM.filter===v?'on':''}" data-act="ffil" data-v="${esc(v)}">${esc(l)}</button>`).join('')}</div>
        <select class="in" id="fsort" style="max-width:120px">${CoreView.opt([['power','전투력순'],['lv','레벨순'],['match','상성순']],FORM.sort)}</select></div>
      <div class="froster">${list.map(c=>{const on=squadSel.includes(c.id),b=busy.has(c.id),m=Characters.matchup(c,en);return `<button class="fr r${c.rarity} ${on?'on':''} ${b?'busy':''}" data-act="fpick" data-id="${c.id}" ${b?'disabled':''} style="--ec:${ECOL[c.elem]}"><div class="fr-art">${CoreView.art(c)}</div><span class="el" style="--ec:${ECOL[c.elem]}">${esc(c.elem)}</span>${b?'<em class="busy">파견</em>':m.good>m.bad?'<em class="adv">유리</em>':m.bad>m.good?'<em class="dis">불리</em>':''}${on?`<em class="num">${squadSel.indexOf(c.id)+1}</em>`:''}<b>${esc(c.name)}</b><span>Lv.${Characters.own(c.id).lv} · ${nf(charPower(c))}</span></button>`;}).join('')||'<p class="muted">보유한 '+System.T('crew')+'이(가) 없어요.</p>'}</div>
      <div class="row" style="margin-top:14px"><button class="btn block" data-act="${startAct}" ${FORM.ctx.extra||''} ${squadSel.length?'':'disabled'}>출격 (${squadSel.length}/4)</button></div>
      ${FORM.ctx.storyBtns||''}`,false,'','formation:'+FORM.key+':'+FORM.ctx.kind);
  }

  static openLibItem(id,kind){
    if((id&&libById(id)&&libById(id).kind==='cg')||(!id&&kind==='cg')){
      const l=id?libById(id):{id:'',kind:'cg',name:'',prompt:'',cast:[]}; const cast=l.cast||[];
      CoreView.openModal(`${head(id?esc(l.name):'새 CG',`<span class="muted">이벤트 CG · 대본에서 [CG: 이름]</span>`)}
        ${id?`<div style="aspect-ratio:16/10;margin:10px 0;position:relative;overflow:hidden;background:var(--panel2)">${Characters.imgSrc(l)?`<img style="width:100%;height:100%;object-fit:cover" src="${esc(Characters.imgSrc(l))}" alt="">`:'<div class="art ph" style="--ec:var(--brass);height:100%"><small>이미지 미등록</small></div>'}</div>`:''}
        <label class="f" for="li_name">이름</label><input class="in" id="li_name" value="${esc(l.name)}">
        <label class="f" for="li_prompt">장면 프롬프트 (영어, 인물 외모 제외: 장소, 구도, 행동, 분위기)</label><textarea class="in" id="li_prompt" placeholder="rooftop, night, rain, two women sharing an umbrella, from side, cinematic">${esc(l.prompt)}</textarea>
        <h3 class="sec">등장 ${System.T('crew')} (최대 4명)</h3>
        ${[0,1,2,3].map(i=>{const x=cast[i]||{};return `<div class="g4 cgslot"><div style="grid-column:span 2"><label class="f">${i+1}번</label><select class="in" id="cg_c${i}"><option value="">없음</option>${G.chars.map(c=>`<option value="${c.id}" ${x.id===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div><div><label class="f">위치</label><select class="in" id="cg_p${i}">${CoreView.opt(CG_POS_LABEL,x.pos||'auto')}</select></div><div><label class="f">행동 태그</label><input class="in" id="cg_a${i}" value="${esc(x.act||'')}" placeholder="smile, waving"></div></div>`;}).join('')}
        <p class="muted">각 ${System.T('crew')}의 외모는 그 ${System.T('crew')}의 NAI 프롬프트에서 가져와서 캐릭터별 프롬프트로 따로 넣어요(V4 이상).</p>
        <label class="f" for="li_desc">AI에게 설명 (선택)</label><input class="in" id="li_desc" placeholder="예: 축제 마지막 밤, 불꽃놀이를 올려다보는 미호와 루나">
        <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="ailib" data-k="cg">AI로 장면 프롬프트 쓰기</button></div>
        <div class="row" style="margin-top:16px"><button class="btn" data-act="savelib" data-id="${l.id}" data-k="cg">저장</button>${id?`<button class="btn ghost" data-act="naigen" data-k="lib" data-id="${l.id}">NAI로 그리기</button><button class="btn ghost" data-act="upload" data-k="lib" data-id="${l.id}">이미지 올리기</button>${(kind==='enemy'||kind==='prop'||kind==='icon')&&Characters.imgSrc(l)?`<button class="btn ghost" data-act="cutopen" data-k="lib" data-id="${l.id}">배경 지우기</button>`:''}${l.img?XBTN('lib',l.id):''}<button class="btn ghost" data-act="dellib" data-id="${l.id}">삭제</button>`:''}</div>`);
      return;
    }
    if((id&&libById(id)&&libById(id).kind==='bgm')||(!id&&kind==='bgm')){
      const l=id?libById(id):{id:'',kind:'bgm',name:'',prompt:''};
      CoreView.openModal(`${head(id?esc(l.name):'새 배경음',`<span class="muted">배경음 · ${l.audio?'등록됨':'미등록'}</span>`)}
        <label class="f" for="li_name">이름 (대본에서 [음악: 이름]으로 불러요)</label><input class="in" id="li_name" value="${esc(l.name)}">
        <label class="f" for="li_prompt">음악 프롬프트 (영어)</label><textarea class="in" id="li_prompt">${esc(l.prompt)}</textarea>
        <label class="f" for="li_desc">AI에게 설명 (선택)</label><input class="in" id="li_desc" placeholder="예: 비 오는 밤 둘만 남은 사무소, 쓸쓸하지만 따뜻하게">
        <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="ailib" data-k="bgm">AI로 프롬프트 쓰기</button></div>
        <div class="row" style="margin-top:16px"><button class="btn" data-act="savelib" data-id="${l.id}" data-k="bgm">저장</button>${id?`<button class="btn ghost" data-act="elcompose" data-id="${l.id}">AI로 작곡</button><button class="btn ghost" data-act="aupload" data-id="${l.id}">파일 올리기</button>${l.audio?`<button class="btn ghost" data-act="bgmplay" data-id="${l.id}">재생</button>`:''}<button class="btn ghost" data-act="dellib" data-id="${l.id}">삭제</button>`:''}</div>`);
      return;
    }
    const l=id?libById(id):{id:'',kind,name:'',prompt:''}; kind=l.kind;
    const KN=({bg:'배경',prop:'소품',enemy:'적',icon:'재화 아이콘',map:'작전 지도'})[kind]||kind;
    CoreView.openModal(`${head(id?esc(l.name):'새 '+KN,`<span class="muted">${KN}${kind==='enemy'?' · 스테이지의 적 이름과 같으면 전투에 나와요':''}</span>`)}${l.alias&&!l.img?`<p class="muted" style="margin:0 0 8px;font-size:.8rem">지금은 「${esc((G.lib.find(x=>x.id===l.alias)||{}).name||'')}」의 그림을 같이 써요. 프롬프트를 적고 저장하면 이 적만 따로 그려요.</p>`:''}
      ${id?`<div style="border-radius:12px;overflow:hidden;aspect-ratio:${kind==='bg'?'16/10':'1'};margin:10px 0;position:relative">${Characters.imgSrc(l)?`<img class="art" style="width:100%;height:100%;object-fit:cover" src="${esc(Characters.imgSrc(l))}" alt="">`:(kind==='bg'?`<div style="${ArtView.bgStyle(l.name)};position:absolute;inset:0"></div>`:`<div class="art ph" style="--ec:var(--brass);height:100%"><small>이미지 미등록</small></div>`)}</div>`:''}
      <label class="f" for="li_name">이름 (대본에서 이 이름으로 불러요)</label><input class="in" id="li_name" value="${esc(l.name)}">
      <label class="f" for="li_prompt">NAI 프롬프트</label><textarea class="in" id="li_prompt">${esc(l.prompt)}</textarea>
      <label class="f" for="li_desc">AI에게 설명 (선택)</label><input class="in" id="li_desc" placeholder="예: 비 오는 밤 네온이 비치는 편의점 앞">
      <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="ailib" data-k="${kind}">AI로 프롬프트 쓰기</button><button class="btn sm ghost" data-act="copyfield" data-f="li_prompt">복사</button></div>
      <div class="row" style="margin-top:16px"><button class="btn" data-act="savelib" data-id="${l.id}" data-k="${kind}">저장</button>${id?`<button class="btn ghost" data-act="naigen" data-k="lib" data-id="${l.id}">NAI로 그리기</button><button class="btn ghost" data-act="upload" data-k="lib" data-id="${l.id}">이미지 올리기</button>${(kind==='enemy'||kind==='prop'||kind==='icon')&&Characters.imgSrc(l)?`<button class="btn ghost" data-act="cutopen" data-k="lib" data-id="${l.id}">배경 지우기</button>`:''}${l.img?XBTN('lib',l.id):''}<button class="btn ghost" data-act="dellib" data-id="${l.id}">삭제</button>`:''}</div>`);
  }

  static openFarmSquad(st){ CharactersView.openFormation(st,{kind:'farm',extra:`data-k="${st.farm.key}" data-lv="${st.farm.lv}"`},'farmstart'); }

  static relNodeHTML(ref,x,y,big){ const o=Characters.relObj(ref), s=o&&Characters.imgSrc(o.upper&&Characters.imgSrc(o.upper)?o.upper:o), nm=Core.relName(ref,true);
    return `<button class="rl-node ${big?'big':''} ${ref===REL_ME?'me':''} ${o&&o.npc?'npc':''}" style="left:${x}%;top:${y}%" data-act="relgo" data-r="${esc(ref)}"><span class="rl-av">${s?`<img src="${esc(s)}" alt="">`:`<i>${esc(ref===REL_ME?'나':nm.slice(0,1))}</i>`}</span><b>${esc(ref===REL_ME?System.T('player'):nm)}</b></button>`; }

  static openRel(ref){ if(ref) RELC=ref; const c=RELC, rs=Core.relOf(c), nb=rs.map(r=>Core.relOther(r,c));
    const N=nb.length, pos=nb.map((x,i)=>{ const a=-Math.PI/2+i*2*Math.PI/Math.max(1,N), rr=N>8?40:36; return [50+rr*Math.cos(a),50+rr*Math.sin(a)*0.92]; });
    const lines=pos.map(([x,y],i)=>`<line x1="50" y1="50" x2="${x}" y2="${y}"/><text x="${(50+x)/2}" y="${(50+y)/2}">${esc(rs[i].kind||'')}</text>`).join('');
    const people=[[REL_ME,Core.relName(REL_ME,true)],...G.chars.filter(x=>!x.alt).map(x=>[x.id,x.name]),...(G.npcs||[]).map(x=>[x.id,x.name+' (NPC)'])].filter(([id])=>id!==c);
    CoreView.openModal(`${head('인물 관계도',`<span class="muted">사람을 누르면 그 사람을 가운데에 두고 넓혀 봐요</span>`)}
      <div class="rl-map"><svg viewBox="0 0 100 100" preserveAspectRatio="none">${lines}</svg>${CharactersView.relNodeHTML(c,50,50,true)}${nb.map((x,i)=>CharactersView.relNodeHTML(x,pos[i][0],pos[i][1])).join('')}${N?'':'<p class="rl-empty muted">아직 이 사람의 관계 기록이 없어요</p>'}</div>
      <div class="row" style="margin:6px 0">${c!==REL_ME?`<button class="btn sm ghost" data-act="relgo" data-r="${REL_ME}">나를 가운데로</button>`:''}<button class="btn sm ghost" data-act="relrebuild" title="AI 없이 대본·인물 설정을 다시 읽어 빠진 기본 관계를 채워요">🔄 빠진 관계 다시 채우기</button>${SAMPLE?'<button class="btn sm ghost" data-act="relseed">✦ AI로 관계 넓히기</button>':''}${RELUNDO?'<button class="btn sm ghost" data-act="relundo">↩ 되돌리기</button>':''}<span class="muted" style="font-size:.76rem;align-self:center">기록 ${World.RELS().length}개 · 스토리를 만들 때마다 자동으로 늘어나요</span></div>
      <h3 class="sec">${esc(Core.relName(c,true))}의 관계</h3>
      ${rs.map(r=>{ const o=Core.relOther(r,c); return `<div class="rl-row"><div class="t"><b>${esc(Core.relName(o,true))}</b> <em>${esc(r.kind||'')}</em><p>${esc(r.note||'')}</p>${(r.hist||[]).length?`<small>${(r.hist||[]).slice(-3).map(h=>esc((h.src?h.src+' · ':'')+h.text)).join('<br>')}</small>`:''}</div><div class="rl-acts"><button class="btn sm ghost" data-act="relgo" data-r="${esc(o)}">보기</button><button class="btn sm ghost" data-act="reledit" data-id="${r.id}">고치기</button></div></div>`; }).join('')||'<p class="muted">관계가 없어요. 아래에서 직접 추가하거나 AI로 넓혀 보세요.</p>'}
      <h3 class="sec">관계 추가</h3>
      <div class="g2"><div><label class="f" for="rl_b">상대</label><select class="in" id="rl_b">${people.map(([id,n])=>`<option value="${esc(id)}">${esc(n)}</option>`).join('')}</select></div><div><label class="f" for="rl_k">관계</label><input class="in" id="rl_k" maxlength="16" placeholder="예: 소꿉친구"></div></div>
      <label class="f" for="rl_n">설명</label><input class="in" id="rl_n" maxlength="240" placeholder="예: 어릴 적 같은 마을에서 자랐지만 5년 전 사건 뒤로 연락이 끊겼다">
      <div class="row" style="margin-top:8px"><button class="btn sm" data-act="reladd">추가</button></div>`);
  }

  static openAiChapter(){
    CoreView.openModal(`${head(`AI로 ${G.chapters.length+1}장 만들기`)}
      <label class="f" for="ai_d">이야기 방향</label><textarea class="in" id="ai_d" placeholder="예: 헬릭스의 비밀 연구소에 잠입한다. 세라의 과거 동료가 적으로 나온다. 중간에 미호와 단둘이 변장하고 파티장에 숨어드는 장면."></textarea>
      <label class="f" for="ai_n">스테이지 수</label><select class="in" id="ai_n">${CoreView.opt([[3,'3개'],[4,'4개'],[5,'5개'],[6,'6개'],[8,'8개'],[10,'10개']],Core.storyN(4))}</select>
      <label class="f">주요 등장 ${esc(System.T('crew'))}</label><div class="chips">${G.chars.map(c=>`<button class="chip" data-act="castt" data-id="${c.id}">${esc(c.name)}</button>`).join('')}</div>
      <div class="row" style="margin-top:14px"><button class="btn" data-act="aichapter">만들기</button></div>
      <p class="muted">새로 필요한 배경은 자료실에 NAI 프롬프트와 함께 추가되고, ${System.T('talk')}도 1~2개 함께 만들어져요. 시간이 조금 걸려요.</p>`);
  }

  static vnShow(L){
    S.log.push(L); const el=$('#vnChar');
    if(S.phone&&L.type==='say'){
      const me=isMe(L.who), c=me?null:Characters.vnSpeaker(L.who), body=$('#vnPhBody');
      body.insertAdjacentHTML('beforeend',`<div class="msg ${me?'me':''}">${me?'':`<div class="av sm">${c?CoreView.art(c):''}</div>`}<div class="bub">${esc(sub(L.text))}</div></div>`); body.scrollTop=body.scrollHeight;
      if(c&&c.voiceId&&Core.SND().voiceStory) CoreView.speak(c,L.text); else Characters.stopVoice(); Art.sfx('알림');
      $('#vnName').textContent=''; $('#vnText').textContent=''; S.full=L.text; S.typing=false; $('#vnNext').hidden=false; Characters.vnPrefetch(); Characters.vnAutoNext(); return;
    }
    if(L.type==='say'){
      const me=isMe(L.who), c=me?null:Characters.vnSpeaker(L.who), fz=c?(L.face||Characters.textFace(c,L.text)):'', key=c?c.id+'|'+fz:'';
      if(c){ const fresh=!(S.stage||[]).some(x=>x.c===c); CharactersView.vnDirectSay(L,c,fz); if(fresh){ const sl=el.querySelector('.vn-slot.speak'); if(sl){ sl.classList.remove('enter'); void sl.offsetWidth; sl.classList.add('enter'); } } } // 무대·연출(0462)
      el.classList.toggle('dim',!c);
      $('#vnName').textContent=me?playerName():L.who; $('#vnText').classList.remove('nar');
      if(c&&c.voiceId&&Core.SND().voiceStory) CoreView.speak(c,L.text); else Characters.stopVoice();
    } else { Characters.stopVoice(); el.classList.add('dim'); $('#vnName').textContent=''; $('#vnText').classList.add('nar'); }
    Characters.vnPrefetch();
    CharactersView.vnType(sub(L.text));
  }

  static vnType(t){S.full=t;S.typing=true;let k=0;const el=$('#vnText');el.textContent='';$('#vnNext').hidden=true;clearInterval(S.timer);const tid=S.timer=setInterval(()=>{if(!el.isConnected||!S||S.timer!==tid){clearInterval(tid);return;}k+=2;el.textContent=t.slice(0,k);if(k>=t.length)CharactersView.vnFinish();},28);}

  static vnFinish(){if(!S)return;clearInterval(S.timer);S.typing=false;const tx=$('#vnText'),nx=$('#vnNext');if(tx)tx.textContent=S.full;if(nx)nx.hidden=false;Characters.vnAutoNext();}

  static vnEnd(){if(!S)return;clearInterval(S.timer);clearTimeout(S.autoT);Characters.stopVoice();const d=S.done;S=null;CoreView.closeOv();d&&d();}

  static vnMotion(slot,m){ if(!slot||!m||Characters.dirMode()==='off') return; const cls=MOTIONS[m]; if(!cls) return; Object.values(MOTIONS).forEach(x=>slot.classList.remove(x)); void slot.offsetWidth; slot.classList.add(cls); if(cls!=='m-exit'&&cls!=='m-near'&&cls!=='m-far') setTimeout(()=>slot.classList.remove(cls),900);
    if(cls==='m-exit') setTimeout(()=>{ S&&S.stage&&(S.stage=S.stage.filter(x=>x.c.id!==slot.dataset.cid)); slot.remove(); },600); }

    // 대본 엔진(0460)이 부르는 곳
static vnDirectSay(L,c,fz){ const d=L.dir||{}, slot=SystemView.vnStage(c,fz); if(Characters.dirMode()==='off') return; CharactersView.vnMotion(slot,d.motion); CoreView.vnEmote(slot,d.emo||(Characters.dirMode()==='auto'&&!d.face&&!d.motion?Characters.autoEmote(L.text):'')); }

    // 로비 터치 반응
static lobbyEmote(el,line,zone){ if(Characters.dirMode()==='off'||!el) return; const k=Characters.autoEmote(line)||(zone==='head'?'하트':''); if(!k) return; const r=el.getBoundingClientRect(), d=document.createElement('div'); d.className='lb-emo'; d.style.cssText=`left:${r.left+r.width*.6}px;top:${r.top+r.height*.12}px`; d.innerHTML=ArtView.emoteHTML(k); document.body.appendChild(d); setTimeout(()=>d.remove(),1600); }

  static farmHTML(){
    const p=P(), top4=G.chars.filter(c=>Characters.own(c.id)).map(c=>Characters.own(c.id).lv||1).sort((a,b)=>b-a).slice(0,4), topLv=top4.length?Math.round(top4.reduce((a,b)=>a+b,0)/top4.length):1;
    return `${pageHead(System.T('farm'),'TRAINING','lobby')}<p class="muted">반복해서 재료를 모으는 곳이에요. 단계마다 권장 레벨이 있고, 높은 단계일수록 보상이 커요. 한 번 깬 단계는 소탕으로 바로 보상을 받을 수 있어요. 보유: ${Core.rewardText({exp:p.mat.exp,wmat:p.mat.wmat,core:p.mat.core,gold:p.gold})}</p>
    ${G.meta.farms.map(f=>`<h3 class="sec">${esc(f.name)}</h3>${Array.from({length:FARM_N},(_,k)=>k+1).map(lv=>{const id=`farm_${f.key}_${lv}`, rec=Characters.farmRec(lv), low=topLv<rec,cl=!!p.farmClear[id],open=lv===1||!!p.farmClear[`farm_${f.key}_${lv-1}`];
      return `<div class="stage ${cl?'clear':''} ${open?'':'lock'}"><span class="code">${lv}</span><span class="t"><b>${lv}단계 <small class="${low?'farm-low':'muted'}">권장 Lv.${rec}</small></b><span class="st">${Core.rewardText(Core.farmReward(f.key,lv))}</span></span>${open?`<button class="btn sm ghost" data-act="farmgo" data-k="${f.key}" data-lv="${lv}">출격</button>`:''}${cl?`<button class="btn sm" data-act="sweep" data-k="${f.key}" data-lv="${lv}">소탕</button><button class="btn sm ghost" data-act="sweep" data-k="${f.key}" data-lv="${lv}" data-n="5">×5</button>`:''}</div>`;}).join('')}`).join('')}`;
  }

  static rulesHTML(s){ const f=Characters.fieldText(s.field); return `<div class="panel" style="padding:8px;margin:6px 0;font-size:.82rem">${f?`<div><b>전장 규칙</b> ${esc(f)}</div>`:''}<div><b>별 조건</b> 승리 · 전원 생존 · ${esc(Core.goalText(s.goal))}</div></div>`; }
}

class CharactersCtl {
  static skinRefresh(id){ if($('#modal .sheet.cs-sheet')) CharactersCtl.openChar(id); else if($('#sk_name')) CharactersView.openSkin(id); else Challenge.render(); }

  static async skinPartGen(c,k,xs,rep,generationMode='manual'){ if(!Core.imgReady()){ CoreView.toast(Core.imgNeed()); return; } if(!k.prompt){ CoreView.toast('이 '+System.T('skin')+'은 프롬프트가 없어서 그릴 수 없어요. 올리기를 써 주세요'); return; }
    const game=G,project=Core.PJ().active;if(rep)rep('그리는 중…');let n=0;
    for(const x of xs){ try{ const b=await CoreCtl.skinPartDraw(c,k,x,generationMode);if(G!==game||Core.PJ().active!==project||charById(c.id)!==c||!c.skins.includes(k))throw Error('대상이 바뀌어 스킨 생성을 중단했습니다');await Art.storeImage(x==='stand'?k:Characters.skinPart(k,x),b,''); n++; Core.mark('c:'+c.id); }catch(e){ CoreView.toast(Core.naiErr(e)); break; } }
    if(rep)rep.end();if(n)CoreView.toast(`${k.name}: ${n}장 완성`);CharactersCtl.skinRefresh(c.id);Challenge.render(); }

  static async npcDraw(n,k){ if(!Core.imgReady()){ CoreView.toast(Core.imgNeed()); return; } if(!String(n.naiPrompt||'').trim()){ CoreView.toast('외형 프롬프트를 먼저 적어 주세요'); return; }
    NPCBUSY.add(n.id); CharactersView.npcRefresh(n.id);
    try{ const it=k==='upper'?{k:'upper',o:n.upper,c:n}:{k:'char',o:n,c:n}; const b=await Core.naiDrawItem({...it,generationMode:'manual'}); await Art.storeImage(it.o,b,k==='upper'?'':'c:'); Core.mark('meta'); CoreView.toast(`${n.name} ${k==='upper'?'상반신':'스탠딩'}을(를) 그렸어요`); }
    catch(e){ CoreView.toast(Core.naiErr(e)); } finally{ NPCBUSY.delete(n.id); CharactersView.npcRefresh(n.id); } }

  static limitBreak(c){
    const o=Characters.own(c.id), p=P(), cost=GGMCombat.limitBreakCost(o.dup);
    if(o.dup>=5){CoreView.toast('최대 '+System.T('limit')+'예요');return;}
    if(p.mat.core<cost){CoreView.toast(`${System.T('core')}가 ${cost}개 필요해요`);return;}
    p.mat.core-=cost; o.dup++; Core.mark('prog'); Art.sfx('SSR');
    const f=(c.files||[]).find(x=>x.dup===o.dup); CharactersView.linePop(c,rand(c.dupLines.length?c.dupLines:c.lines),'결의');
    CoreView.toast(`${System.T('limit')} ${o.dup}단계! 레벨 상한 ${levelCap(o)}${f?' · '+System.T('files')+' 공개':''}`);
    if(o.dup>=5){ o.cgNew=true; Core.mark('prog'); if(!Characters.imgSrc(c.lbcg)) setTimeout(()=>CoreView.toast(`최대 ${System.T('limit')}! 외형 탭에서 ${System.T('limit')} CG를 만들면 바로 공개돼요`),2700); }
  }

  static transcendUp(c){const o=Characters.own(c.id),u=Economy.upPlan(c,'transc');if(!u?.ok){CoreView.toast(o.lv>=70&&levelCap(o)<120?System.T('transcMat')+' '+u.cost[0][1]+'개가 필요해요':u?.note||'초월승급할 수 없어요');return;}P().mat.transcMat-=u.cost[0][1];o.transc=(o.transc||0)+1;Core.mark('prog');Art.sfx('강화');CoreView.toast('초월승급! 레벨 상한 '+levelCap(o));}

  static async personaBatch(kind){ if(!SAMPLE){ CoreView.toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; } const cs=[...document.querySelectorAll('[data-psc]:checked')].map(x=>charById(x.dataset.psc)).filter(Boolean); if(!cs.length){ CoreView.toast('캐릭터를 골라 주세요'); return; }
    const label={fill:'개성 채우기',improve:'개성 다듬기',talk:'인연 톡',memo:'메모리얼'}[kind]; if(kind==='fill'||kind==='improve'||kind==='memo') Core.auditSnap(cs,label); PS_JOB={stop:false}; let n=0;
    try{ for(const [i,c] of cs.entries()){ if(PS_JOB.stop) break; SystemView.syBar(`${label} ${i+1}/${cs.length}: ${c.name}`); try{ const ok=kind==='talk'?await Characters.talkAffGen(c):kind==='memo'?await Characters.memorialGen(c):await Characters.personaAI(c,kind,{lines:kind==='improve'}); if(ok) n++; }catch(e){ Core.quietErr(e,'0455-persona.js:114'); } } }
    finally{ PS_JOB=null; SystemView.syBar(''); } CoreView.toast(`${label}: ${n}/${cs.length}명`); CharactersView.openPersonaAll(); }

  static auditUndo(){ const U=AUDIT_UNDO; if(!U) return; for(const {o,before} of U.items){ for(const k of Object.keys(o)) if(!(k in before)) delete o[k]; Object.assign(o,before); if(G.chars.includes(o)) Core.mark('c:'+o.id); } Core.mark('prog'); AUDIT_UNDO=null; CoreView.toast(`되돌렸어요: ${U.label}`); }

  static joinChar(c,why){ const p=P(); if(!c||p.owned[c.id]) return false; p.owned[c.id]={levelCapVersion:1,transc:0,growthCostVersion:1,lv:1,exp:0,dup:0,aff:0,seen:[],wlv:0,skin:''}; if(p.squad.length<4) p.squad.push(c.id); Core.mark('prog');
    Economy.sendMail({from:'운영팀',title:`${RL[c.rarity]} ${c.name} 합류`,body:`${why||'인연이 닿아'} ${c.name}이(가) 함께하게 됐어요. ${System.T('crew')} 화면에서 확인해 보세요.`,days:30}); setTimeout(()=>CoreView.toast(`🤝 ${c.name}이(가) 합류했어요!`),1200); return true; }

    /* 캐릭터 창 열기(Controller): 창을 그리고, 5돌파 CG를 처음 보면 본 것으로 하고 펼침 연출 */
static openChar(id){ const c=charById(id); if(!c) return; MessengerView.charSheetShow(id); if(Art.cgFirstSeen(c)) setTimeout(()=>CharactersView.lbReveal(c),500); }

  static newBonds(s){ const cs=G.chars.filter(c=>c.debut===s.id); if(!cs.length) return; cs.forEach(c=>{ if(!Core.relPair(REL_ME,c.id)) NewGame.relApply([{a:System.T('player'),b:c.name,kind:'첫 만남',note:`「${s.title}」에서 처음 만났다.`}],''); });
    setTimeout(()=>CoreView.toast(`새 인연: ${cs.map(c=>`${c.name}(${RL[c.rarity]})`).join(', ')} · 이제 상시 ${System.T('gacha')}에서 만날 수 있어요`),600); }
}
