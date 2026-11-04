/* ===== world — 기능 class(Model · View · Ctl) — docs/redesign.md 2·3절, tools/reshape.mjs가 매핑대로 옮김 ===== */
class World {
    /* src/main/0030-character-regen.js */
static regenRunPrompt({context,last,c,sel}){ return `${RULES}\n${NAI_CHAR}\n다음 참고 데이터의 선택한 항목만 다시 작성하세요. 선택하지 않은 항목, 스탯, 스킬, 장비 고유 효과는 출력하지 마세요. 세계관: ${G.world.summary}. 참고 ${JSON.stringify(context)}. ${last?'이전 실패: '+last:''} JSON만 출력: ${JSON.stringify(World.regenSchema(c,sel))}`; }

  static requestUltimateScenePrompt({context,instructions}){ return `${RULES}\n현재 캐릭터의 궁극기 컷인 장면을 NovelAI 영어 태그 10~16개로 작성하세요. 궁극기의 실제 효과와 캐릭터 컨셉을 표현하고 설정에 있는 무기만 사용하세요. 치유·보호 궁극기에 공격 동작을 강요하지 마세요. 외모·화풍·노출 태그는 쓰지 마세요. 세계관: ${G.world.summary}. 참고 자료 ${JSON.stringify(context)}. 사용자의 장면 요청(실제 궁극기 효과를 우선): ${instructions}. JSON만 출력: {"tags":"장면 태그"}`; }

  static illustrationScenePreparationPrompt({c,purpose,cfg}){ return `${Core.pf('ILLUST_SCENE',{RULES,world:G.world.summary,name:c.name,faction:c.faction||'',role:ROLE[c.role],profile:c.profile,naiPrompt:c.naiPrompt,purpose,prompt:cfg.prompt})}JSON만 출력: {"tags":"태그, 태그"}`; }

    /* src/main/0300-codex.js */
static cxDiscoverPrompt({have,st}){ return `${Core.pf('CODEX_DISCOVER',{RULES,ctx:World.ctx(),have:have.join(', '),code:st.map(s=>s.code+' '+s.title).join(', ')||'없음',cxProgressText:World.cxProgressText()})}JSON만 출력: {"entries":[{"cat":"place|term|history|person|faction|item","title":"짧은 제목","body":"내용","after":"start 또는 1-3 같은 스테이지 코드"}]}`; }

  static cxDeepenPrompt({e}){ return `${Core.pf('CODEX_DEEPEN',{RULES,ctx:World.ctx(),title:e.title,cat:CX_LABEL[e.cat]||'',body:String(e.body||'').slice(0,800),notes:e.notes.map(n=>n.text).join(' / ').slice(0,800)||'없음',cxProgressText:World.cxProgressText()})}JSON만 출력: {"text":"덧붙일 내용"}`; }

    /* src/main/0330-casting.js */
static autoNpcsPrompt({names,lines}){ return `${Core.pf('AUTO_NPCS',{castRule:NewGame.castRule(),world:String(G.world.summary||'').slice(0,300),names:names.map(n=>`- ${n}: ${lines(n).slice(0,200)}`).join('\n'),NAI_CHAR})}\nJSON만 출력: {"npcs":[{"name":"","role":"한 줄","look":"한국어 외모","naiPrompt":""}]}`; }

    /* src/main/0445-factions.js */
static stanceAIPrompt({F,main}){ return `${RULES}\n${World.ctx()}\n\n메인 장:\n${main.map((ch,i)=>`${i+1}장 「${ch.title}」: ${String(ch.memory?.brief||ch.summary||ch.logline||'').slice(0,300)||'(요약 없음)'}`).join('\n')||'(아직 없음)'}\n\n세력: ${JSON.stringify(F.map(f=>({name:f.name,kind:f.kind,desc:String(f.desc||'').slice(0,200),rel:f.rel||{}}))).slice(0,3000)}\n\n${Core.pf('STANCE_AI',{last:main.length})}\nJSON만 출력: {"stance":[{"faction":"세력 이름","ch":1,"s":"ally|neutral|hostile","why":"한 줄 이유"}]}`; }

  static factionAIPrompt({F,instruction,M}){ return `${RULES}\n${World.ctx()}\n\n${Core.pf(F.length?'FACTION_AI_IMPROVE':'FACTION_AI_NEW',{rule:FACTION_RULE,now:World.mainNow()})}${instruction?'\n추가 지시: '+instruction:''}
  적(몬스터) 목록: ${M.map(l=>l.name).join(', ')||'없음'} — ${BESTIARY_AI_RULE}
  기존 세력: ${JSON.stringify(F.map(f=>({name:f.name,kind:f.kind,desc:f.desc}))).slice(0,3000)}
  JSON만 출력: {"factions":[{"name":"","kind":"playable|hostile|neutral|monster","desc":"","goal":"","leader":"","base":"","ideology":"","secret":"","origin":"","nature":"","weakness":"","rel":{"다른 세력 이름":"관계"},"stance":[]}],"bestiary":[{"name":"적 이름 그대로","faction":"","desc":"","nature":"","weak":""}]}`; }

  static ailibPrompt({nm,ds,ids}){ return `${Core.pf('CG_ART',{summary:G.world.summary,nm,ds:ds?' ('+ds+')':'',name:ids.map(c=>c.name).join(', ')||'없음'})}\nJSON만 출력: {"prompt":"...","acts":["1번 인물 행동 태그","2번 ..."]}`; }

  static ailibPrompt2({nm,ds}){ return `${Core.pf('BGM_PROMPT',{summary:G.world.summary,nm,ds:ds?' ('+ds+')':''})}\nJSON만 출력: {"prompt":"..."}`; }

  static ailibPrompt3({nm,ds}){ return `${Core.pf('ENEMY_ART',{summary:G.world.summary,lore:G.world.lore,nm,ds:ds?' ('+ds+')':''})}\nJSON만 출력: {"prompt":"..."}`; }

  static ailibPrompt4({k,nm,ds}){ return `${Core.pf('LIB_ITEM_ART',{summary:G.world.summary,kind:k==='bg'?'배경':'소품',nm,ds:ds?' ('+ds+')':'',pf:k==='bg'?Core.pf('LIB_ITEM_BG'):Core.pf('LIB_ITEM_PROP')})}\nJSON만 출력: {"prompt":"..."}`; }

  static aiskinPrompt({c,base,idea}){ return `${Core.pf('OUTFIT_ART',{summary:G.world.summary,name:c.name,profile:c.profile,appearance:base.appearance,outfit:base.outfit,idea})}\nJSON만 출력: {"outfit":"","other":""}`; }

    /* src/main/0510-actions/090-characters.js */
static ainaiPrompt({fName,fFac,fElem,fPos,fProf}){ return `${Core.pf('STANDING_ART',{RULES,name:G.world.name,summary:G.world.summary,value:fName,value4:fFac&&fFac.value.trim()?' (소속: '+fFac.value.trim()+')':'',value2:fElem,value5:(Rules.posById(fPos)||{}).name||'',value3:fProf,NAI_CHAR})}\nJSON만 출력: {"naiPrompt":"..."}`; }

  static ailooksallPrompt({list}){ return `${Core.pf('ENEMY_ART_REDO',{name:G.world.name,summary:G.world.summary,world:String(G.world.lore||'').slice(0,2500),name2:list.map(l=>l.name).join(', ')})}\nJSON만 출력: {"looks":{"적 이름":"태그"}}`; }

  static ailooksPrompt({list}){ return `${Core.pf('ENEMY_ART_FILL',{summary:G.world.summary,lore:G.world.lore,name:list.map(l=>l.name).join(', ')})}\nJSON만 출력: {"looks":{"적 이름":"태그"}}`; }

    /* src/main/0510-actions/100-images-and-assets.js */
static npctagsPrompt({n}){ return `${Core.pf('NPC_ART',{name:G.world.name,world:String(G.world.summary||'').slice(0,400),name2:n.name,role:n.role?' / '+n.role:'',look:n.look||'',profile:n.profile?'\n설정: '+String(n.profile).slice(0,200):'',NAI_CHAR})}\nJSON만 출력: {"naiPrompt":""}`; }

    /* src/main/0030-character-regen.js */
static regenSchema(c,sel){const schema={};if(sel.name){schema.name='캐릭터 이름';schema.faction='소속';}if(sel.profile){schema.profile='프로필';schema.intro='첫 인사';schema.files=[{dup:1,text:'비밀 기록'}];}if(sel.look)schema.naiPrompt='NovelAI 영어 외형 태그';if(sel.weapon)schema.weapon={name:'무기 이름',desc:'무기 설명',prompt:'no humans, object focus, weapon, simple background, white background'};if(sel.lines){schema.lines=['로비 대사'];schema.affLines={'4':['호감도 대사']};schema.lvLines=['강화 대사'];schema.dupLines=['돌파 대사'];schema.touch={head:['머리 터치'],body:['몸 터치'],pet:['쓰다듬기']};}return schema;}

    /* src/main/0440-ai-context.js */
static ctx(side,focus){ // side: 외전·이벤트용. 메인 플롯·비밀·진행 상황을 빼요(이벤트가 메인 떡밥을 끌어오지 않게)
    const w=G.world, sd=[], wS=NewGame.dedupText(w.summary,sd).text, wL=NewGame.dedupText(w.lore,sd).text, wP=side?'':NewGame.dedupText(w.plot||'',sd).text, bib=G.meta.bible?NewGame.dedupText(side?String(G.meta.bible).split('\n').filter(l=>!/^\s*비밀/.test(l)).join('\n'):String(G.meta.bible),sd).text:''; // 세계관 요약·상세·플롯·작가 설정에 겹치는 문장은 한 번만 보내요
    const prog=G.chapters.filter(ch=>ch.kind==='main').map(ch=>ch.title+': '+ch.stages.map(s=>s.title+(P().cleared[s.id]?'(완료)':'')).join(', ')).join(' / ');
    return `게임 "${G.meta.title}". ${w.source?Core.pf('CTX_SOURCE',{source:w.source}):''}세계관 "${w.name}": ${wS}\n${wL?'상세 설정: '+wL+'\n':''}${side?'':`메인 플롯(작가용 비밀 설정 포함): ${wP||w.plot||'미정'}\n${Battle.storyCfg().plot?Core.pf('CTX_PLAYER_PLOT',{plot:Battle.storyCfg().plot}):''}`}${bib?(side?'작가 설정(세계관 참고용):\n'+bib.slice(0,8000):Core.pf('CTX_BIBLE',{bible:bib.slice(0,12000)}))+'\n':''}${Characters.factionCtx()}${side?'':`메인 스토리 진행: ${prog}\n`}${System.T('crew')}: ${G.chars.filter(c=>!(c.alt&&!c.altCanon)&&!c.monster).map(c=>`${c.name}(${c.alt&&charById(c.alt)?Core.pf('CTX_ALT_CANON',{name:charById(c.alt).name}):''}${RL[c.rarity]}, ${c.faction||'무소속'}, ${c.elem}속성 ${ROLE[c.role]}, ${Misc.smProfile(c,focus)}${Characters.personaBrief(c)?' 개성: '+Characters.personaBrief(c)+'.':''} 말투 예: "${Misc.smVoice(c,focus)}"${c.faces.length?' 표정: '+c.faces.map(f=>f.name).join('/'):''})`).join('; ')}${G.chars.some(c=>c.alt&&!c.altCanon)?Core.pf('CTX_ALT_SIDE',{list:G.chars.filter(c=>c.alt&&!c.altCanon).map(c=>c.name+'='+((charById(c.alt)||{}).name||'')+'의 외전 모습').join(', ')}):''}${(G.npcs||[]).length?Core.pf('CTX_NPCS',{crew:System.T('crew')})+G.npcs.map(npc=>`${npc.name}(${npc.role||'조연'}, ${String(npc.profile||'').slice(0,focus&&Misc.smFocused(npc,focus)?1000:200)}${npc.speech?' 말투: '+String(npc.speech).slice(0,60):''})`).join('; '):''}\n배경 목록: ${G.lib.filter(l=>l.kind==='bg').map(l=>l.name).join(', ')||'(아직 없음)'}${(()=>{ const L=Art.shList().filter(x=>x.kind==='bg'&&!G.lib.some(l=>l.kind==='bg'&&l.name===x.name)).slice(0,20).map(x=>x.name); return L.length?'\n공유 보관함 배경(이 이름을 쓰면 그림을 바로 재사용): '+L.join(', '):''; })()}\n소품 목록: ${G.lib.filter(l=>l.kind==='prop').map(l=>l.name).join(', ')}\n음악 목록: ${G.lib.filter(l=>l.kind==='bgm').map(l=>l.name).join(', ')}\n효과음 목록: ${G.lib.filter(l=>l.kind==='sfx').map(l=>l.name).join(', ')}\nCG 목록: ${G.lib.filter(l=>l.kind==='cg').map(l=>l.name).join(', ')||'없음'}`+Story.smNotes(side)+World.smCodex(focus,side);
  }

    /* src/main/0530-story-memory.js */
static smCodex(text,side){if(!text)return '';const query=String(text),words=[...new Set(query.match(/[가-힣A-Za-z0-9_]{2,}/g)||[])];const notes=G.world.codexNotes||{};
   const list=(G.world.codex||[]).filter(x=>!side||World.cxUnlocked(x.unlock)).map(x=>({x,score:(query.includes(x.title)?100:0)+words.reduce((n,w)=>n+(String(x.title+' '+x.body).includes(w)?1:0),0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);let used=0,out=[];
   for(const {x}of list.slice(0,20)){const body=String(x.body||'')+(notes['x:'+x.id]||[]).map(n=>'\n추가 기록: '+n.text).join('');const row='['+x.title+']\n'+body;if(used+row.length>SM_LIMITS.codex)continue;used+=row.length;out.push(row);}return out.length?'\n이번 장과 관련된 도감 기록(출처: 도감, 작가 확정 규칙과 충돌하면 규칙 우선):\n'+out.join('\n\n')+'\n':'';}

    /* src/main/0300-codex.js */
static cxProgressText(){ const st=World.mainStages(), done=st.filter(s=>P().cleared[s.id]); return done.length?`플레이어가 지금까지 깬 스테이지: ${done.map(s=>s.code+' '+s.title).join(', ')}`:'플레이어는 아직 스토리를 시작하지 않았다'; }

  static async requestUltimateScene(c,instructions='',signal){
   if(!SAMPLE)throw new Error('기술 컷인 장면을 구성하려면 설정 → 글 AI를 먼저 등록해 주세요.');
   const s=v2Kit(c).ultimate,context={name:c.name,profile:c.profile,appearance:c.naiPrompt,weapon:{name:c.weapon?.name,description:c.weapon?.desc,prompt:c.weapon?.prompt},ultimate:{name:s.name,description:v2SkillText(s,'ultimate'),effects:s.effects,fx:s.fx}};
   const response=await v2SkillRequest(SAMPLE,World.requestUltimateScenePrompt({context,instructions}),signal);
   if(typeof response?.tags!=='string'||!response.tags.trim())throw new Error('AI가 기술 컷인 장면을 비워서 반환했어요. 다시 뽑기를 눌러 주세요.');
   return response.tags.trim().slice(0,2000);
  }

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

    /* /CHARACTER_REGEN_MODULE */
static designFacs(){ const n=f=>G.chars.filter(c=>c.faction===f&&!c.collab).length; return [...new Set([...((G.world&&G.world.factions)||[]).map(f=>f.name),...G.chars.map(c=>c.faction)].filter(Boolean))].sort((a,b)=>n(b)-n(a)); }

    // ElevenLabs 작곡 한 곡: 프롬프트가 없으면 곡 이름으로 기본 프롬프트를 만들어요
static bgmPrompt(l){ return String(l.prompt||'').trim()||`${l.name}, ${(G.world&&G.world.name)||''} game background music, instrumental, seamless loop`; }

  static rulesNotInCodex(){ return !(G.world.codex||[]).some(x=>x.title==='[규칙] 속성 상성'); }

  static stageById(id){ for(const ch of G.chapters){ const s=(ch.stages||[]).find(x=>x.id===id); if(s) return s; } return null; }

  static debutOk(c){ return !c.debut||!!P().cleared[c.debut]||!World.stageById(c.debut); }

  static cxStore(){ return Core.gameRead('world.codex'); }

    /* 도감 기록 바꾸기(Model — 도감 칸 G.world.codex는 이 모듈만 씀): 넣기 · 조건에 맞는 것만 남기기 · 제목으로 고치거나 넣기 */
static cxPut(x){ Core.gameSlot('world.codex').push(x); return x; }

  static cxKeep(keep){ G.world.codex=World.cxStore().filter(keep); }

  static cxUpsert(title,body,cat){ const x=Core.gameSlot('world.codex').find(e=>e.title===title); if(x){ x.body=body; return x; } return World.cxPut({cat:cat||'term',title,body}); }

  static cxNotes(){ return Core.gameRead('world.codexNotes'); } // 읽기 — 바꿀 때는 cxNoteAdd

  static cxNoteAdd(key,text,at){ const N=Core.gameSlot('world.codexNotes'); (N[key]=N[key]||[]).push({text,at}); Core.mark('world'); }

  static libSrc(kind,name){ const l=G.lib.find(x=>x.kind===kind&&x.name===name); return l?Characters.imgSrc(l):null; }

  static mainStages(){ const a=[]; G.chapters.filter(ch=>ch.kind==='main').forEach((ch,ci)=>ch.stages.forEach((s,si)=>a.push({id:s.id,code:(ci+1)+'-'+(si+1),title:s.title,ch}))); return a; }

  static escRe(s){return String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}

  static cxMention(seen,name){ name=String(name||'').trim(); if(!name) return false; if(new RegExp('\\[(배경|소품)\\s*[:：]\\s*'+World.escRe(name)+'\\s*\\]').test(seen)) return true; if(name===P().lobbyBg||name===P().titleBg) return true; return name.length>=3&&seen.includes(name); }

  static cxSeenText(){ const p=P(); let t=(G.opening&&G.opening.lines||[]).join('\n')+'\n'+(p.lobbyBg||'')+'\n'+(p.titleBg||'');
    G.chapters.forEach(ch=>ch.stages.forEach(s=>{ if(p.cleared[s.id]) t+='\n'+(s.pre||'')+'\n'+(s.post||''); })); return t; }

  static cxUnlocked(u){ if(!u||u.type==='start') return true; if(u.type==='clear') return !!P().cleared[u.value]||!G.chapters.some(ch=>ch.stages.some(s=>s.id===u.value)); if(u.type==='own') return !!Characters.own(u.value); if(u.type==='seen') return !!u.ok; return true; }

  static cxLockText(u){ if(!u) return ''; if(u.type==='clear') return Story.stageCode(u.value)+' 클리어 시 공개'; if(u.type==='own') return '합류하면 공개'; if(u.type==='seen') return '스토리에 등장하면 공개'; return ''; }

  static cxEntries(){
    const out=[], w=G.world, seen=World.cxSeenText();
    out.push({key:'w:main',cat:'world',title:w.name||G.meta.title,sub:'세계관',body:[w.summary,w.lore].filter(Boolean).join('\n\n'),unlock:{type:'start'},img:World.libSrc('bg',P().titleBg)});
    (w.factions||[]).forEach(f=>{ const mem=G.chars.filter(c=>c.faction===f.name); out.push({key:'f:'+f.name,cat:'faction',title:f.name,sub:'세력',body:(f.desc||'')+(mem.length?'\n\n알려진 소속: '+mem.map(c=>Characters.own(c.id)?c.name:'???').join(', '):''),unlock:{type:'start'}}); });
    G.chars.forEach(c=>{ const o=Characters.own(c.id), files=(c.files||[]).filter(x=>o&&o.dup>=(x.dup||0));
      out.push({key:'c:'+c.id,cat:'person',title:c.name,sub:[c.faction,RL[c.rarity],ROLE[c.role]].filter(Boolean).join(' · '),body:[c.profile,...files.map(x=>'【'+System.T('files')+' '+(x.dup||'')+'】 '+(x.text||''))].filter(Boolean).join('\n\n')+((c.files||[]).length>files.length?`\n\n(${System.T('limit')}하면 ${System.T('files')}가 더 공개돼요)`:''),unlock:{type:'own',value:c.id},char:c}); });
    G.lib.filter(l=>l.kind==='bg').forEach(l=>out.push({key:'p:'+l.name,cat:'place',title:l.name,sub:'장소',body:'',unlock:{type:'seen',ok:World.cxMention(seen,l.name)},img:Characters.imgSrc(l)}));
    G.lib.filter(l=>l.kind==='prop').forEach(l=>out.push({key:'i:'+l.name,cat:'item',title:l.name,sub:'물건',body:'',unlock:{type:'seen',ok:World.cxMention(seen,l.name)},img:Characters.imgSrc(l),contain:true}));
    const ens={}; G.chapters.filter(ch=>ch.kind==='main').forEach(ch=>ch.stages.forEach(s=>(s.enemies||[]).forEach(e=>{ const x=ens[e.name]||(ens[e.name]={e,codes:[],first:s.id,clear:false}); x.codes.push(Story.stageCode(s.id)); if(P().cleared[s.id]) x.clear=true; })));
    Object.values(ens).forEach(x=>{ const e=x.e; out.push({key:'e:'+e.name,cat:'enemy',title:e.name,sub:`${e.elem} 속성${e.boss?' · 보스':''}`,body:`출현: ${[...new Set(x.codes)].join(', ')}`,unlock:x.clear?{type:'start'}:{type:'clear',value:x.first},img:(Art.enemyLib(e.name)&&Characters.imgSrc(Art.enemyLib(e.name)))||null,contain:true}); });
    G.chapters.filter(ch=>ch.kind==='main').forEach((ch,ci)=>{ const done=ch.stages.filter(s=>P().cleared[s.id]);
      out.push({key:'h:'+ch.id,cat:'history',title:ch.title,sub:`CHAPTER ${ci+1} · ${done.length}/${ch.stages.length}`,body:ch.stages.map((s,si)=>(P().cleared[s.id]?'✓ ':'· ')+`${ci+1}-${si+1} `+(P().cleared[s.id]?s.title:'???')).join('\n'),unlock:ch.stages[0]?{type:'clear',value:ch.stages[0].id}:{type:'start'}}); });
    World.cxStore().forEach(x=>out.push({key:'x:'+x.id,cat:CX_LABEL[x.cat]&&x.cat!=='all'?x.cat:'term',title:x.title,sub:(CX_LABEL[x.cat]||'기록')+(x.src==='ai'?' · AI 기록':''),body:x.body,unlock:x.unlock||{type:'start'},stored:x,img:World.libSrc('bg',x.title)||World.libSrc('prop',x.title)}));
    const N=World.cxNotes(); out.forEach(e=>{ e.notes=(N[e.key]||[]); e.open=World.cxUnlocked(e.unlock); });
    return out;
  }

    /* 도감 본 기록 칸 처음 만들기: 그때 열려 있는 기록(직접 적은 것 빼고)은 본 것으로 — 진행 칸 cxSeen의 정의(0070 PROG_SLOTS) */
static cxSeenNew(){ const s={}; World.cxEntries().forEach(e=>{ if(e.open&&!e.stored) s[e.key]=1; }); return s; }

    /* 도감 새 기록 표시(Model — 도감 화면에 들어가기 전): 새로 열린 기록에 표시 */
static cxBadgeSync(){ const p=P(), s=Core.progSlot('cxSeen'); p.cxBadge=p.cxBadge||{}; let ch=false; World.cxEntries().forEach(e=>{ if(e.open&&!s[e.key]&&!p.cxBadge[e.key]){ p.cxBadge[e.key]=1; ch=true; } }); if(ch){ CXMEMO=null; Core.mark('prog'); } }

    /* 도감 기록을 봄(Model) */
static cxMarkSeen(key){ Core.progSlot('cxSeen')[key]=1; CXMEMO=null; Core.mark('prog'); }

  static codeToStage(code){ code=String(code||'').trim(); if(!code||/^start|처음/i.test(code)) return null; const m=World.mainStages().find(s=>s.code===code); return m?m.id:null; }

  static cxDiscover(t){ return CodexDiscoverGen.run({rep:t}); }

  static cxDeepen(key,t){ return CodexDeepenGen.run({key,rep:t}); }

  static castCfg(){ const c=G.meta.cast||{}; return {pickupGate:c.pickupGate!==false,hostileGate:c.hostileGate!==false}; }

    /* 세력 목록 G.world.factions: 캐릭터 소속인데 목록에 없는 세력(플레이어블로) · 종류·장별 태도·관계 칸 보정 — 정의는 이 셋 */
static factionMissing(g,list){ const out=[]; g.chars.forEach(c=>{ if(c.faction&&!c.monster&&!c.collab&&!list.some(f=>f.name===c.faction)&&!out.some(f=>f.name===c.faction)) out.push({name:c.faction,desc:'',kind:'playable',rel:{},stance:[]}); }); return out; }

  static factionOk(f){ return !!FKIND[f.kind]&&Array.isArray(f.stance)&&!!f.rel&&typeof f.rel==='object'; }

  static factionFixed(f,g){ return {kind:FKIND[f.kind]?f.kind:g.chars.some(c=>c.faction===f.name&&!c.monster)?'playable':g.lib.some(l=>l.kind==='enemy'&&!l.charId&&l.name.includes(f.name))?'monster':'neutral',stance:Array.isArray(f.stance)?f.stance:[],rel:f.rel&&typeof f.rel==='object'?f.rel:{}}; }

    /* 쓰기(Model): 목록을 맞춰 저장하고 돌려줌 — 세력을 고치는 처리가 부름(읽기는 맞춘 모양을 보여 주므로 불러오기에서 따로 맞추지 않음 — FKIND는 불러올 때 아직 없음) */
static factionSync(g=G){ const w=Core.gameSlot('world.factions',g); w.push(...World.factionMissing(g,w)); w.forEach(f=>Object.assign(f,World.factionFixed(f,g))); return w; }

    /* 읽기: 맞춰져 있으면 저장된 목록 그대로, 아니면 맞춘 모양을 새로 만들어 보여 주기만(상태는 그대로 — 고칠 때는 factionSync) */
static factions(){ const w=Core.gameRead('world.factions'), miss=World.factionMissing(G,w); return miss.length||!w.every(World.factionOk)?[...w.map(f=>World.factionOk(f)?f:Object.assign({},f,World.factionFixed(f,G))),...miss]:w; }

  static facByName(n){ return World.factions().find(f=>f.name===n); } // 읽기 — 고칠 때는 facSlot

  static facSlot(n){ return World.factionSync().find(f=>f.name===n); }

  static mainNow(){ const main=G.chapters.filter(ch=>ch.kind==='main'), i=main.findIndex(ch=>(ch.stages||[]).some(s=>!P().cleared[s.id])); return i<0?main.length+1:i+1; } // 지금 진행 중인 장(1부터) = 다 깨지 않은 첫 메인 장(예전엔 스테이지 하나만 깨도 다음 장으로 셈)

  static stanceAt(f,ch){ if(!f) return 'neutral'; const L=(f.stance||[]).filter(x=>+x.ch<=ch).sort((a,b)=>a.ch-b.ch); return L.length?L.at(-1).s:f.kind==='playable'?'ally':f.kind==='neutral'?'neutral':'hostile'; }

  static monsterNames(){ const nm=new Set([...G.chars.map(c=>c.name),...(G.npcs||[]).map(n=>n.name)]); return G.lib.filter(l=>l.kind==='enemy'&&!l.charId&&!l.alias&&!nm.has(l.name)&&!SYS_ENEMY.test(l.name)); }

  static enemyFaction(l){ return l.faction||((World.factions().find(f=>f.kind!=='playable'&&l.name.includes(f.name))||{}).name)||''; }

    // 등장·영입
static metInStory(c){ if(c.debut&&P().cleared[c.debut]) return true; if(typeof Core.relPair==='function'&&Core.relPair(REL_ME,c.id)) return true;
    return G.chapters.some(ch=>(ch.stages||[]).some(s=>P().cleared[s.id]&&new RegExp('(^|\\n)'+String(c.name).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(\\s*\\[[^\\]]*\\])?\\s*[:：]').test((s.pre||'')+'\n'+(s.post||'')))); }

  static castLock(c){ if(c.monster) return '몬스터는 영입할 수 없어요'; if(c.debutLater&&!Characters.own(c.id)) return '스토리에서 아직 만나지 않았어요(나중 장에서 첫 등장)'; if(!World.debutOk(c)){ const s=World.stageById(c.debut); return `스토리 「${s?s.title:'?'}」을(를) 깨면 열려요`; }
    if(World.castCfg().hostileGate&&!Characters.own(c.id)){ const f=World.facByName(c.faction); if(f&&World.stanceAt(f,World.mainNow())==='hostile') return `${f.name}이(가) 지금 적대 중이라 영입할 수 없어요`; } return ''; }

    // 깊이 점검
static factionReview(){ const out=[], F=World.factions(); if(F.length<2) out.push({w:15,msg:'세력이 2개 미만이에요'}); if(!F.some(f=>f.kind==='hostile'||f.kind==='monster')) out.push({w:8,msg:'적대 세력·몬스터 무리가 없어요'});
    F.forEach(f=>{ const miss=F_FIELDS.slice(0,5).filter(([k])=>!(f.kind==='monster'&&['leader','ideology'].includes(k))&&!String(f[k]||'').trim()).map(x=>x[1]); if(String(f.desc||'').length<20) out.push({w:6,msg:`「${f.name}」 개요가 너무 짧아요`}); if(miss.length) out.push({w:Math.min(8,miss.length*2),msg:`「${f.name}」에 ${miss.join('·')}이(가) 없어요`});
      if(f.kind==='monster'){ const mm=M_FIELDS.filter(([k])=>!String(f[k]||'').trim()).map(x=>x[1]); if(mm.length) out.push({w:mm.length*3,msg:`몬스터 「${f.name}」의 ${mm.join('·')}이(가) 없어요`}); }
      if(F.length>1&&!Object.keys(f.rel).length) out.push({w:3,msg:`「${f.name}」과 다른 세력의 관계가 없어요`}); });
    const M=World.monsterNames(), nod=M.filter(l=>!l.desc); if(nod.length) out.push({w:Math.min(20,nod.length*2),msg:`정체가 정해지지 않은 적 ${nod.length}종: ${nod.slice(0,6).map(l=>l.name).join(', ')}${nod.length>6?' …':''}`});
    const bad=[...G.chars.filter(c=>!c.monster&&Art.isMonsterLike(c)),...(G.npcs||[]).filter(n=>!n.monster&&Art.isMonsterLike(n))]; if(bad.length) out.push({w:10,msg:`몬스터로 보이는 캐릭터·NPC: ${bad.map(x=>x.name).join(', ')}`});
    const score=Math.max(0,100-out.reduce((a,x)=>a+x.w,0)); return {score,issues:out}; }

    /* 세력 장별 태도 보완(점검 w_stance·실행 중 자동 채움): 장을 만들 때만 생기는 태도가 예전 게임엔 비어 종류 기본값으로만 돌아요 —
     이미 쓴 메인 장 이야기로 세력마다 1장의 처음 관계와 바뀐 장을 정해 넣어요. 답에 없는 세력은 종류 기본값을 1장 태도로 적어 둬요(다시 비었다고 잡히지 않게) */
  static stanceAI(){ return StanceGen.run(); }

  static factionAI(rep,instruction){ return FactionGen.run({rep,instruction}); }

    // 장 생성이 돌려준 관계 변화 반영: [{faction,s,why}] → 그 장부터
static stanceApply(arr,ch){ (Array.isArray(arr)?arr:[]).forEach(x=>{ const f=World.facSlot(String(x&&x.faction||'').trim()); if(f&&FSTANCE[x.s]&&World.stanceAt(f,ch)!==x.s){ f.stance=f.stance.filter(y=>+y.ch!==ch); f.stance.push({ch,s:x.s,why:String(x.why||'').slice(0,80)}); Core.mark('world'); } }); }

    // 몬스터를 캐릭터에서 빼기(뽑기·톡·일정·인연에서 제외, 적으로 등록)
static charToMonster(c){ c.monster=true; c.limited=true; if(!G.lib.some(l=>l.kind==='enemy'&&l.name===c.name)) G.lib.push({id:'l'+uid(),kind:'enemy',name:c.name,prompt:String(c.naiPrompt||''),img:null,desc:String(c.profile||'').slice(0,200)}); Core.mark('c:'+c.id); }

    // 생성 결과의 적 도감 → 자료실 적에 반영(g: 새 게임 생성 중이면 그 게임)
static bestiaryApply(arr,g){ g=g||G; let n=0; g.meta.bestiary=g.meta.bestiary||{}; (Array.isArray(arr)?arr:[]).forEach(x=>{ const name=String(x&&x.name||'').trim(); if(!name||(g.chars||[]).some(c=>c.name===name)) return; const info={}; ['desc','nature','weak'].forEach(k=>{ const v=String(x[k]||'').trim().slice(0,200); if(v) info[k]=v; }); const fn=String(x.faction||'').trim(); if(fn&&(g.world.factions||[]).some(f=>f.name===fn)) info.faction=fn; if(!Object.keys(info).length) return; g.meta.bestiary[name]=info; n++;
    const l=(g.lib||[]).find(y=>y.kind==='enemy'&&y.name===name&&!y.charId); if(l){ Object.keys(info).forEach(k=>{ if(!l[k]) l[k]=info[k]; }); if(g===G) Core.mark('l:'+l.id); } }); if(n&&g===G) Core.mark('meta'); return n; } // 적이 아직 자료실에 없으면 syncEnemies(0070)가 만들 때 채워요

  static RELS(){ return Core.gameRead('rels'); }

    /* 관계 기록 바꾸기(Model — 관계 칸 G.rels는 이 모듈만 씀): 넣기 · 조건에 맞는 것만 남기기 */
static relPut(r){ Core.gameSlot('rels').push(r); return r; }

  static relKeep(keep){ G.rels=World.RELS().filter(keep); }

    /* 스토리 삭제 때 관계 정리(storyPurge가 부름 — L: storyLinks, pick: 지울 갈래): 그 스토리에서 생긴 관계와 남은 관계의 그 스토리 기록, 지운 인물의 관계를 빼고 청소(relGC) */
static relPurgeStory(L,pick){ if(pick.rels){ const gone=new Set(L.rels.filter(L.born).map(r=>r.id)); World.relKeep(r=>!gone.has(r.id)); World.RELS().forEach(r=>{ if(r.hist) r.hist=r.hist.filter(h=>!L.src.includes(h.src)); }); Core.mark('meta'); }
    if(pick.chars){ const cs=new Set(L.chars.map(c=>c.id)); World.relKeep(r=>!cs.has(r.a)&&!cs.has(r.b)); Core.mark('meta'); } World.relGC(); }

  static memCatchUp(){ World.relGC(); if(!G.meta.relProf){ NewGame.relFromProfiles(); G.meta.relProf=1; Core.mark('meta'); } G.chapters.forEach(ch=>Story.relFromScripts(ch,ch.kind==='event'?'외전 「'+ch.title+'」':ch.title)); }

    // 관계 청소: 없어진 인물·스테이지에서 생긴 자동 기록, 내용이 다 지워진 빈 기록을 지워요
static relGC(){ const ok=x=>x===REL_ME||x.startsWith('x:')||!!Characters.relObj(x); let fixd=0;
    World.RELS().forEach(r=>{ [['a','an'],['b','bn']].forEach(([k,n])=>{ if(ok(r[k])||!r[n]) return; const c=Characters.findSpeaker(r[n])||Characters.npcBy(r[n]); if(c){ r[k]=baseChar(c).id||c.id; fixd++; } }); if(!r.an||!r.bn) Core.relNames(r); });
    if(fixd){ const seen=new Map(); World.relKeep(r=>{ if(r.a===r.b) return false; const k=[r.a,r.b].sort().join('|'); if(seen.has(k)){ const o=seen.get(k); o.hist=[...(o.hist||[]),...(r.hist||[])].slice(-12); return false; } seen.set(k,r); return true; }); Core.mark('meta'); }
    const n0=World.RELS().length;
    World.relKeep(r=>ok(r.a)&&ok(r.b)&&!(r.stage&&!World.stageById(r.stage))&&!(!r.sys&&!r.note&&!(r.hist||[]).length&&r.src)); if(World.RELS().length!==n0) Core.mark('meta'); return n0-World.RELS().length; }
}

class WorldView {
  static openWorld(){
    const w=G.world;
    CoreView.openModal(`${head('세계관')}
      <label class="f" for="w_name">이름</label><input class="in" id="w_name" value="${esc(w.name)}">
      <label class="f" for="w_sum">요약</label><textarea class="in" id="w_sum">${esc(w.summary)}</textarea>
      <label class="f" for="w_lore">상세 설정</label><textarea class="in tall" id="w_lore">${esc(w.lore)}</textarea>
      <label class="f" for="w_plot">메인 플롯 (비밀 설정, 복선, 장기 전개. AI가 다음 장을 쓸 때 참고해요)</label><textarea class="in tall" id="w_plot">${esc(w.plot||'')}</textarea>
      <label class="f" for="w_fac">세력 (한 줄에 하나: 이름: 설명)</label><textarea class="in" id="w_fac">${esc(w.factions.map(f=>f.name+': '+f.desc).join('\n'))}</textarea>
      <label class="f" for="w_kw">AI로 새로 짜기: 키워드</label><input class="in" id="w_kw" placeholder="예: 사이버펑크 해상도시, 기업 전쟁, 인공 천사">
      <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="aiworld">AI로 세계관 쓰기</button></div>
      <p class="muted">AI 결과는 입력칸에만 채워져요. 저장을 눌러야 반영돼요.</p>
      <div class="optbox" id="w_terms" hidden><label class="f"><input type="checkbox" id="w_tchk" checked> 용어도 세계관에 맞게 바꾸기</label><span class="muted" style="font-size:.8rem"></span></div>
      <p class="muted" style="margin:8px 0 0">지금 용어: ${esc(System.T('player'))} · ${esc(System.T('crew'))} · ${esc(System.T('talk'))} · ${esc(System.T('currency'))} · ${esc(System.T('gacha'))} · ${esc(System.T('abyss'))} <button class="linkb" data-act="meta-open">용어 직접 바꾸기</button></p>
      <div class="row" style="margin-top:12px"><button class="btn" data-act="saveworld">저장</button></div>`);
  }

    /* 도감 기록 보기(Controller): 잠겼으면 알림, 열렸으면 본 것으로 하고 카드의 새 표시를 지운 뒤 창 */
static openCx(key){
    const e=World.cxEntries().find(x=>x.key===key); if(!e) return;
    if(!e.open){ CoreView.toast(World.cxLockText(e.unlock)||'아직 잠겨 있어요'); return; }
    World.cxMarkSeen(key); WorldView.cxCardSeenShow(key); CoreView.openModal(WorldView.cxViewHTML(e,key));
  }

  static cxCard(e){ const isNew=e.open&&!Core.progRead('cxSeen')[e.key];
    const pic=e.open?(e.char?CoreView.art(e.char,'cx-ch'):e.img?`<img src="${esc(e.img)}" alt="" class="${e.contain?'ct':''}" loading="lazy">`:`<span class="cx-glyph">${esc((e.title||'?').slice(0,1))}</span>`):'<span class="cx-glyph">?</span>';
    const snip=e.open?String(e.body||(e.notes[0]&&e.notes[0].text)||'아직 기록이 없어요').replace(/\n+/g,' ').slice(0,70):World.cxLockText(e.unlock);
    return `<button class="cx-card ${e.open?'':'lock'} c-${esc(e.cat)}" data-act="cxview" data-k="${esc(e.key)}"><span class="cx-pic">${pic}</span><span class="cx-tx"><i>${esc(CX_LABEL[e.cat]||'')}</i><b>${e.open?esc(e.title):'???'}</b><span>${esc(snip)}</span></span>${isNew?'<em>NEW</em>':''}</button>`; }

  static codexHTML(){
    const all=World.cxEntries(), cat=CXCAT, list=all.filter(e=>cat==='all'||e.cat===cat), un=all.filter(e=>e.open).length;
    const cnt=k=>k==='all'?all.length:all.filter(e=>e.cat===k).length;
    return `${pageHead('도감','LORE BOOK','lobby')}
    <div class="cx-head"><div class="cx-meter"><b>${un}</b><span>/ ${all.length} 기록 해금</span></div><div class="cx-bar"><i style="width:${all.length?un/all.length*100:0}%"></i></div>
      <div class="cx-acts">${SAMPLE?`<button class="btn sm" data-act="cxdisc">✦ AI로 로어북 채우기</button>`:''}<button class="btn sm ghost" data-act="cxadd">＋ 직접 쓰기</button><button class="btn sm ghost" data-act="relopen" data-r="me">🕸 인물 관계도</button>${all.some(e=>e.open&&!Core.progRead('cxSeen')[e.key])?'<button class="btn sm ghost" data-act="cxreadall">NEW 모두 지우기</button>':''}</div></div>
    <div class="cx-cats">${CX_CATS.filter(([k])=>cnt(k)).map(([k,l])=>`<button class="${k===cat?'on':''}" data-act="cxcat" data-v="${k}">${l}<em>${cnt(k)}</em></button>`).join('')}</div>
    ${!World.cxStore().length&&SAMPLE?`<div class="panel cx-hint"><b>세계를 더 깊게</b><p class="muted" style="margin:4px 0 0">AI가 세계관과 메인 플롯을 바탕으로 장소, 용어, 역사, 숨은 인물 같은 기록을 써요. 비밀이 담긴 기록은 해당 스테이지를 깨야 열려요.</p></div>`:''}
    <div class="cx-list">${list.map(WorldView.cxCard).join('')||'<p class="muted">항목이 없어요</p>'}</div>`;
  }

    /* 도감 카드의 새 표시 지우기 · 기록 보기 창 내용(View) */
static cxCardSeenShow(key){ document.querySelectorAll('.cx-card[data-k]').forEach(el=>{ if(el.dataset.k===key){ const em=el.querySelector('em'); if(em) em.remove(); } }); }

  static cxViewHTML(e,key){ const para=t=>String(t||'').split(/\n{2,}/).map(x=>`<p>${esc(x).replace(/\n/g,'<br>')}</p>`).join('');
    return `<div class="cx-view c-${esc(e.cat)}">
      ${e.img||e.char?`<div class="cx-hero">${e.char?CoreView.art(e.char,'cx-ch'):`<img src="${esc(e.img)}" alt="" class="${e.contain?'ct':''}">`}</div>`:''}
      <div class="cx-vh"><i>${esc(CX_LABEL[e.cat]||'')}</i><h2>${esc(e.title)}</h2><span class="muted">${esc(e.sub||'')}</span></div>
      <div class="cx-body">${e.body?para(e.body):'<p class="muted">아직 기록이 없어요. 아래 \'더 알아보기\'를 누르면 AI가 지금까지 밝혀진 범위 안에서 써 줘요.</p>'}
        ${e.notes.map(n=>`<div class="cx-note"><small>${esc(n.at||'')}</small>${para(n.text)}</div>`).join('')}</div>
      ${SAMPLE?`<button class="btn block" data-act="cxdeep" data-k="${esc(key)}" style="margin-top:14px">✦ 더 알아보기</button>`:''}
      <div class="cx-sub">${e.char&&Characters.own(e.char.id)?`<button class="btn sm ghost" data-act="char" data-id="${esc(e.char.id)}">${esc(System.T('crew'))} 정보</button>`:''}${e.stored?`<button class="btn sm ghost" data-act="cxedit" data-id="${esc(e.stored.id)}">편집</button>`:''}<button class="btn sm ghost" data-act="cxnote" data-k="${esc(key)}">메모 추가</button><button class="btn sm ghost" data-act="close">닫기</button></div>
    </div>`; }

  static openCxEdit(id){
    const x=id?World.cxStore().find(q=>q.id===id):{id:'',cat:'term',title:'',body:'',unlock:{type:'start'}}; if(!x) return;
    const st=World.mainStages();
    CoreView.openModal(`${head(id?'기록 편집':'기록 쓰기')}
      <div class="g2"><div><label class="f" for="cx_cat">분류</label><select class="in" id="cx_cat">${CoreView.opt(CX_CATS.filter(c=>c[0]!=='all'&&c[0]!=='enemy'),x.cat)}</select></div>
      <div><label class="f" for="cx_un">공개 시점</label><select class="in" id="cx_un">${CoreView.opt([['start','처음부터'],...st.map(s=>[s.id,s.code+' 클리어 후'])],x.unlock&&x.unlock.type==='clear'?x.unlock.value:'start')}</select></div></div>
      <label class="f" for="cx_t">제목</label><input class="in" id="cx_t" value="${esc(x.title)}">
      <label class="f" for="cx_b">내용</label><textarea class="in" id="cx_b" style="min-height:180px">${esc(x.body)}</textarea>
      <div class="row" style="margin-top:14px"><button class="btn" data-act="cxsave" data-id="${esc(x.id)}">저장</button>${id?`<button class="btn ghost" data-act="cxdel" data-id="${esc(x.id)}">삭제</button>`:''}</div>`);
  }

  static factionPanel(){ const r=World.factionReview(); return `<div class="panel pm-hide"><h3>세력·몬스터·등장 관리 <span class="badge">${r.score}점</span></h3><p class="muted" style="margin:0 0 6px">세력 ${World.factions().length}개 · 몬스터 ${World.monsterNames().length}종 · 점검 ${r.issues.length}건. 세력의 종류·목적·관계와 장마다 바뀌는 적대/우호, 몬스터의 정체, ${System.T('crew')}의 첫 등장·${System.T('gacha')} 잠금을 관리해요.</p><button class="btn sm" data-act="fwopen">세력·몬스터·등장 관리</button></div>`; }

  static openWorldDesign(tab){ if(tab) FW_TAB=tab; const F=World.factions(), now=World.mainNow(), rv=World.factionReview(), t=(k,v,ph)=>`<input class="in" data-fw="${k}" value="${esc(v??'')}" placeholder="${esc(ph||'')}">`, ta=(k,v,ph)=>`<textarea class="in" rows="2" data-fw="${k}" placeholder="${esc(ph||'')}">${esc(v||'')}</textarea>`;
    const tabs=[['fac','세력'],['mon','적·몬스터 도감'],['cast','등장·영입']]; let body='';
    if(FW_TAB==='fac') body=F.map((f,i)=>`<details class="panel" style="padding:8px;margin:6px 0"><summary><b>${esc(f.name)}</b> <span class="muted">${FKIND[f.kind]} · 지금 ${FSTANCE[World.stanceAt(f,now)]}</span></summary>
      <div class="g2"><div><label class="f">종류</label><select class="in" data-fw="f.${i}.kind">${CoreView.opt(Object.entries(FKIND),f.kind)}</select></div><div><label class="f">이름</label>${t(`f.${i}.name`,f.name)}</div></div>
      ${F_FIELDS.map(([k,l])=>`<label class="f">${l}</label>${k==='desc'||k==='secret'?ta(`f.${i}.${k}`,f[k]):t(`f.${i}.${k}`,f[k])}`).join('')}
      ${f.kind==='monster'?M_FIELDS.map(([k,l])=>`<label class="f">${l}</label>${t(`f.${i}.${k}`,f[k])}`).join(''):''}
      <label class="f">다른 세력과의 관계 (세력 | 관계, 줄마다)</label>${ta(`f.${i}.rel`,Object.entries(f.rel).map(([k,v])=>k+' | '+v).join('\n'))}
      <label class="f">플레이어와의 관계 변화 (장 | ally·neutral·hostile | 이유, 줄마다 · 비우면 종류대로)</label>${ta(`f.${i}.stance`,f.stance.map(s=>`${s.ch} | ${s.s} | ${s.why||''}`).join('\n'),'예: 1 | hostile | 처음엔 적\n4 | ally | 진실을 알고 손잡음')}
      <div class="muted" style="font-size:.78rem">소속: ${esc(G.chars.filter(c=>c.faction===f.name).map(c=>c.name).join(', ')||'없음')}${World.monsterNames().filter(l=>World.enemyFaction(l)===f.name).length?' · 몬스터: '+esc(World.monsterNames().filter(l=>World.enemyFaction(l)===f.name).map(l=>l.name).join(', ')):''}</div></details>`).join('')+`<button class="btn sm ghost" data-act="fwadd">+ 세력</button>`;
    else if(FW_TAB==='mon'){ const M=World.monsterNames(); body=`<p class="muted" style="font-size:.82rem">캐릭터가 아닌 적(몬스터·적 병력)이에요. 정체·습성·약점을 정하면 스토리·도감에 쓰이고, AI가 몬스터를 동료·NPC·메신저 상대로 만들지 않아요.</p>${M.map((l,i)=>`<div class="panel" style="padding:8px;margin:6px 0"><b>${esc(l.name)}</b> <select class="in" data-fw="m.${l.id}.faction" style="max-width:150px;display:inline-block"><option value="">무리 없음</option>${F.map(f=>`<option ${World.enemyFaction(l)===f.name?'selected':''}>${esc(f.name)}</option>`).join('')}</select>${t(`m.${l.id}.desc`,l.desc,'정체 (무엇인가)')}${t(`m.${l.id}.nature`,l.nature,'습성·행동')}${t(`m.${l.id}.weak`,l.weak,'약점')}</div>`).join('')||'<p class="muted">적이 없어요</p>'}`; }
    else { const L=G.chars.filter(c=>!c.alt&&!c.npc), stg=G.chapters.flatMap(ch=>(ch.stages||[]).map(s=>[s.id,`${ch.kind==='main'?Story.stageCode(s.id):ch.title} ${s.title}`]));
      body=`<label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-fw="cast.pickupGate" ${World.castCfg().pickupGate?'checked':''}>픽업 배너도 첫 등장 스테이지를 깨기 전엔 잠금</label><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-fw="cast.hostileGate" ${World.castCfg().hostileGate?'checked':''}>소속 세력이 지금 적대면 ${System.T('gacha')}·건조에서 잠금</label>
      <p class="muted" style="font-size:.8rem">첫 등장을 정하면 그 스테이지를 깨기 전까지 ${System.T('gacha')}에 안 나오고, 스토리에서 처음 만나는 장면이 돼요. "처음부터"인 ${System.T('crew')}는 뽑아서 합류하면 AI가 이미 함께 작전 중인 동료로 다뤄요.</p>
      ${L.map(c=>{ const lk=World.castLock(c); return `<div class="ep"><span class="t"><b>${esc(c.name)}${c.monster?' (몬스터)':''}</b><span class="muted">${esc(c.faction||'무소속')} · ${Characters.own(c.id)?'보유':'미보유'} · ${World.metInStory(c)?'스토리에서 만남':'아직 안 만남'}${lk?' · 🔒 '+esc(lk):''}</span></span><select class="in" data-fw="c.${c.id}.debut" style="max-width:170px"><option value="">처음부터</option>${stg.map(([id,l])=>`<option value="${id}" ${c.debut===id?'selected':''}>${esc(l)}</option>`).join('')}</select>${!c.monster&&Art.isMonsterLike(c)?`<button class="btn sm ghost" data-act="fwmon" data-id="${c.id}">몬스터로 전환</button>`:''}</div>`; }).join('')}`; }
    CoreView.openModal(`${head('세력·몬스터·등장 관리',`<span class="muted">점수 ${rv.score}</span>`)}${rv.issues.length?`<div class="panel" style="border-color:var(--gold)"><b>점검</b><ul style="margin:4px 0;padding-left:18px;font-size:.8rem">${rv.issues.map(x=>`<li>${esc(x.msg)}</li>`).join('')}</ul></div>`:''}
    <div class="row" style="gap:4px;margin:6px 0">${tabs.map(([k,l])=>`<button class="btn sm ${FW_TAB===k?'':'ghost'}" data-act="fwtab" data-k="${k}">${l}</button>`).join('')}</div>${body}
    <label class="f" style="margin-top:8px">AI 추가 지시 (선택)</label><input class="in" id="fw_ins" placeholder="예: 헬릭스는 3장 이후 내분으로 일부가 우리 편이 된다">
    <div class="row" style="margin-top:10px;gap:6px;flex-wrap:wrap"><button class="btn" data-act="fwsave">저장</button><button class="btn ghost" data-act="fwai">AI로 깊이 채우기</button><button class="btn ghost" data-act="close">닫기</button></div>`); }
}

/* ===== World의 AI 생성 흐름(Generator 하위 — docs/redesign.md 3절) ===== */
/* 도감 항목 찾기: 본편 스테이지를 읽고 아직 없는 항목을 더함(해금 = 그 스테이지 클리어) */
class CodexDiscoverGen extends Generator {
  static fail = 0;
  static context(o){ const st=World.mainStages(), have=World.cxEntries().map(e=>e.title); return {...o,st,have}; }
  static prompt({have,st}){ return World.cxDiscoverPrompt({have,st}); }
  static parse(r){ return Array.isArray(r.entries)?r:null; }
  static apply(r){
    let n=0; r.entries.slice(0,8).forEach(x=>{ if(!x||!x.title||!x.body) return; const cat=CX_LABEL[x.cat]&&x.cat!=='all'?x.cat:'term'; const sid=World.codeToStage(x.after);
      World.cxPut({id:'cx'+uid(),cat,title:String(x.title).slice(0,40),body:String(x.body),unlock:sid?{type:'clear',value:sid}:{type:'start'},src:'ai',at:Date.now()}); n++; });
    Core.mark('world'); return n;
  }
}
/* 도감 항목 깊이 더하기: 지금까지 깬 곳까지의 기록 */
class CodexDeepenGen extends Generator {
  static context(o){ return {...o,e:World.cxEntries().find(x=>x.key===o.key)}; }
  static ready({e}){ return !!e; }
  static prompt({e}){ return World.cxDeepenPrompt({e}); }
  static parse(r){ return r.text?r:null; }
  static apply(r,{key}){
    World.cxNoteAdd(key,String(r.text),World.mainStages().filter(s=>P().cleared[s.id]).map(s=>s.code).pop()||'시작 전'); return true;
  }
}
/* 세력의 장별 태도(몬스터가 아닌 세력 × 본편 장) */
class StanceGen extends Generator {
  static context(o){ const F=World.factions().filter(f=>f.kind!=='monster'), main=G.chapters.filter(ch=>ch.kind==='main'); return {...o,F,main}; }
  static ready({F,main}){ return F.length>0&&main.length>0; }
  static prompt({F,main}){ return World.stanceAIPrompt({F,main}); }
  static apply(r,{F,main}){
    (Array.isArray(r.stance)?r.stance:[]).forEach(x=>{ const f=World.facSlot(String(x&&x.faction||'').trim()), ch=Math.max(1,Math.min(main.length,Math.round(+(x&&x.ch)||1))); if(!f||f.kind==='monster'||!FSTANCE[x.s]) return; f.stance=(f.stance||[]).filter(y=>+y.ch!==ch); f.stance.push({ch,s:x.s,why:String(x.why||'').slice(0,80)}); });
    F.forEach(f=>{ if(!Array.isArray(f.stance)) f.stance=[]; if(!f.stance.length) f.stance.push({ch:1,s:World.stanceAt(f,1),why:''}); f.stance.sort((a,b)=>a.ch-b.ch); });
    Core.mark('world'); return true;
  }
}
/* 세력·몬스터 도감 채우기(추가 지시가 있으면 덮음) */
class FactionGen extends Generator {
  static tier = 'complex';
  static context(o){ return {...o,F:World.factions(),M:World.monsterNames()}; }
  static prompt({F,instruction,M}){ return World.factionAIPrompt({F,instruction,M}); }
  static apply(r,{F,M,instruction}){ const S=(v,n)=>String(v||'').trim().slice(0,n||300);
    (Array.isArray(r.factions)?r.factions:[]).slice(0,8).forEach(x=>{ const name=S(x.name,30); if(!name) return; let f=World.facSlot(name); if(!f){ f={name,desc:''}; F.push(f); }
      if(FKIND[x.kind]) f.kind=x.kind; [...F_FIELDS,...M_FIELDS].forEach(([k])=>{ const v=S(x[k]); if(v&&(!f[k]||String(f[k]).length<v.length||instruction)) f[k]=v; });
      if(x.rel&&typeof x.rel==='object') Object.entries(x.rel).forEach(([k,v])=>{ if(k!==name&&World.facByName(k)) f.rel[k]=S(v,40); });
      if(Array.isArray(x.stance)) x.stance.forEach(s=>{ const ch=Math.max(1,Math.round(+s.ch||0)); if(ch&&FSTANCE[s.s]&&!f.stance.some(y=>+y.ch===ch)) f.stance.push({ch,s:s.s,why:S(s.why,80)}); }); });
    (Array.isArray(r.bestiary)?r.bestiary:[]).forEach(x=>{ const l=M.find(y=>y.name===S(x.name,40)); if(!l) return; ['desc','nature','weak'].forEach(k=>{ const v=S(x[k],200); if(v&&!l[k]) l[k]=v; }); const fn=S(x.faction,30); if(fn&&World.facByName(fn)) l.faction=fn; Core.mark('l:'+l.id); });
    Core.mark('world'); return true;
  }
}
/* 인물 관계 씨앗: 관계 정리 */
class RelSeedGen extends Generator {
  static fail = 0;
  static prompt(){ return Core.relSeedAIPrompt(); }
  static apply(r){ return NewGame.relApply(r.relations,'정리'); }
}
