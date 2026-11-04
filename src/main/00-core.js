/* ===== core — 상위 class와 공용(Shared — 여러 기능이 같이 쓰는 함수). 재설계 docs/redesign.md 3절의 상위 class(Repository·Generator·View·Dialog·Service)로 옮겨 갈 자리 ===== */
/* AI 생성 흐름 하나(템플릿 메서드 — docs/redesign.md 3절 Generator): context(입력·지금 data를 모음) → ready(할 수 있나) → prompt(프롬프트 스튜디오 조립)
   → 글 AI(Core.aiJSON, 등급 tier) → parse(AI 출력은 믿지 않는 입력 — 검사·정리, 못 쓰면 null) → apply(data 창구로 반영하고 결과를 돌려줌).
   하위 class는 다른 점(프롬프트·검사·반영)만 가짐. 못 했을 때: 할 수 없으면 fail, AI 답이 없거나 못 쓰면 none(ctx)(기본 fail) */
class Generator {
  static tier = 'default';
  static fail = false;
  static context(opt) { return opt; }
  static ready(ctx) { return true; }
  static prompt(ctx) { throw Error(`${this.name}.prompt가 없음`); }
  static parse(r, ctx) { return r; }
  static apply(v, ctx) { return v; }
  static none(ctx) { return this.fail; }
  static async run(opt = {}) { const ctx = this.context(opt); if (!this.ready(ctx)) return this.fail;
    const r = await Core.aiJSON(this.prompt(ctx), ctx.rep || null, this.tier), v = r ? this.parse(r, ctx) : null;
    return v == null ? this.none(ctx) : this.apply(v, ctx); }
}

class Core {
  static quietErr(e,where){ QUIET.unshift({at:Date.now(),where:String(where||''),msg:String(e&&e.message||e||'오류').slice(0,200)}); if(QUIET.length>60) QUIET.length=60; try{ console.debug('[quiet]',where,e); }catch(_){ /* 콘솔이 없어도 괜찮음 */ } }

    // 자리 채우기: 조각 글의 {이름} 자리를 호출 지점이 준 값으로(덮어쓴 글도 같은 자리를 쓰면 채워짐). 쓸 수 있는 자리는 pfDef의 where에 적고 화면에 보여요
static pf(id,vars){ const t=System.promptFrag(id); return vars?t.replace(/\{([A-Za-z]\w*)\}/g,(m,k)=>k in vars?String(vars[k]??''):m):t; }

  static aiEventGen0Prompt({rel,deep,dir,cast,loreHint,n,LS,ncN}){ return `${RULES}\n${World.ctx(true)}${rel}\n${SCRIPT_FMT}\n${deep?'':THREAD_FMT}\n\n${Core.pf('EV_REQUEST',{how:deep?Core.pf('EV_HOW_DEEP'):Core.pf('EV_HOW_FAST'),dir,castLine:cast.length?'주연: '+cast.join(', ')+'.':'',lore:loreHint,past:Story.evPastHint(),battleFlow:BATTLE_FLOW,npc:NewGame.npcRule(),n,lines:deep?'':Core.pf('EV_LINES',{pre:LS.pre,post:LS.post,detail:DETAIL_RULE}),talkOnly:NewGame.talkOnlyRule(n)+' '+NewGame.finaleRule(),modes:STAGE_MODES,cgMark:deep?Core.pf('CG_MARK_BEATS'):Core.pf('EV_CG_MARK_SCRIPT'),newc:Core.newcRule(ncN,true),giftFirst:ncN?Core.pf('EV_GIFT_FIRST',{crew:System.T('crew')}):'',reuse:Art.enemyReuseHint(),threads:deep?'':Core.pf('EV_THREADS',{talk:System.T('talk'),dup:THREAD_DUP_RULE,rel:REL_RULE})})}\nJSON만 출력: {"title":"","desc":"한두 문장","token":"이벤트 재화 이름","bannerName":"","pickup":["확률 업 ${System.T('crew')} 이름 1~2명"],"bg":"대표 배경 이름","bgm":"대표 음악 이름","newCharacters":[],${BESTIARY_SCHEMA},${NPC_SCHEMA},"stages":${Core.stageSchema(deep)},"backgrounds":[{"name":"","prompt":""}],"props":[{"name":"","prompt":""}],"music":[{"name":"","prompt":""}],"cgs":[{"name":"","prompt":"","cast":["등장 인물 이름"]}]${deep?'':`,"threads":[{"char":"","title":"","afterStage":1,"script":""}],"summary":"",${REL_SCHEMA()}`}}`; }

    /* src/main/0290-season-rotation.js */
static aiNewPickupCharPrompt({COL,con,rr}){ return Core.pf('PICKUP_NEW_CHAR',{RULES,ctx:World.ctx(),COL,crew:System.T('crew'),con:con||(COL?'원작 설정 그대로':'지금 세계관과 이야기 흐름에 어울리는 새 얼굴. 기존 인물과 다른 매력'),rr:rr&&rr!=='ai'?` 희귀도는 ${rr}.`:'',files:System.T('files'),charSchema:NewGame.charSchema(),CHAR_STAT_RULE}); }

  static aiAltCharPrompt({b,canon,con,rr}){ return Core.pf('ALT_CHAR',{RULES,ctx:World.ctx(),crew:System.T('crew'),name:b.name,canon:canon?Core.pf('ALT_CANON'):Core.pf('ALT_SIDE'),con:con||Core.pf('ALT_THEME_AUTO'),files:System.T('files'),naiPrompt:b.naiPrompt||'',profile:String(b.profile||'').slice(0,400),lines:(b.lines||[]).slice(0,3).join(' / '),rr:rr&&rr!=='ai'?`\n희귀도는 ${rr}.`:'',charSchema:NewGame.charSchema(),CHAR_STAT_RULE}); }

    /* src/main/0450-relations-memory.js */
static relSeedAIPrompt(){ return `${RULES}\n${World.ctx()}${Story.storyMemo()}\n\n이미 있는 관계 기록:\n${World.RELS().map(Misc.relLine).join('\n')||'없음'}\n\n${Core.pf('REL_SEED')}\nJSON만 출력: {${REL_SCHEMA()}}`; }

    /* src/main/0510-actions/120-messenger.js */
static phaddaiPrompt({c,hint}){ return `${Core.pf('THREAD_REPLY',{RULES,ctx:World.ctx(),THREAD_FMT,crew:System.T('crew'),name:c.name,profile:c.profile||'',lines:(c.lines||[]).join(' / '),own:Characters.own(c.id)?Core.affLv(Characters.own(c.id)):1,fcProgress:Story.fcProgress(),hint:hint?'요청: '+hint:'요청: 지금 이 캐릭터가 보낼 법한 일상적인 메신저 대화',roomLog:Messenger.roomLog(c.id).slice(-10).map(l=>l.w==='me'?playerName()+': '+l.t:l.w==='c'?c.name+': '+l.t:'').filter(Boolean).join('\n')||'(아직 대화 없음)',player:System.T('player')})}\nJSON만 출력: {"title":"대화방 미리보기 제목","script":"대화"}`; }

  static storyWrapUpPrompt({nt,memory,ch}){ return `${Core.pf('SM_WRAPUP',{RULES,THREAD_FMT,nt,REL_RULE,THREAD_DUP_RULE,text:memory.text,storyTalkLines:System.storyTalkLines(ch).slice(0,80).join('\n').slice(0,8000)})}\nJSON만 출력: {${REL_SCHEMA()},"threads":[{"char":"인물 이름","title":"제목","afterStage":1,"script":"대본"}]}`; }

    /* src/modules/combat/060-generation.js */
static v2ResolvePalettePrompt({context,compiled}){ return `${Core.pf('SKILL_PALETTE_FIX',{v2PalettePrompt:Characters.v2PalettePrompt(),context:JSON.stringify(context),paletteDecision:compiled.paletteDecision.issues.join(' ')})}JSON만 출력: {"paletteDesign":{"theme":"시각 테마","primary":{},"secondary":{},"accent":{}}}`; }

    /* src/main/0450-relations-memory.js */
  // 로어북: text에 이름이 나온 인물(+extra)의 관계를 골라요. 바로 닿은 관계 먼저, 남으면 한 다리 건너(마인드맵처럼)
static relCtx(text,extra,max){ const altOut=x=>{ const c=charById(x); return !!(c&&c.alt)&&!(extra||[]).includes(x); }, R=World.RELS().filter(r=>!altOut(r.a)&&!altOut(r.b)); max=Math.min(max||40,60); text=String(text||''); // 이격 전용 기록은 그 이격이 나올 때만 넣어요
    const hit=new Set((extra||[]).filter(Boolean)); Characters.relKeys().forEach(([ref,ks])=>{ if(ks.some(k=>k&&text.includes(k))) hit.add(ref); });
    if(!R.length){ return hit.size?Core.pf('REL_NONE'):''; }
    const core=R.filter(r=>(hit.has(r.a)||r.a===REL_ME)&&(hit.has(r.b)||r.b===REL_ME)&&(hit.has(r.a)||hit.has(r.b)));
    const ring=R.filter(r=>!core.includes(r)&&(hit.has(r.a)||hit.has(r.b)));
    const pri=r=>r.sys?1:0, rows=[...core.sort((x,y)=>pri(x)-pri(y)),...ring.sort((x,y)=>pri(x)-pri(y))].slice(0,max); if(!rows.length&&!hit.size) return '';
    const meKnown=new Set(Core.relOf(REL_ME).map(r=>Core.relOther(r,REL_ME))), stranger=[...hit].filter(x=>x!==REL_ME&&Characters.relObj(x)&&!meKnown.has(x)&&!Core.relOf(x).length);
    return Core.pf('REL_CTX',{rows:Misc.smRelationRows(rows)||'(이번 인물들의 기록 없음)'})+(stranger.length?Core.pf('REL_STRANGER',{names:stranger.map(x=>Core.relName(x)).join(', ')}):''); }

    /* src/main/0250-story-factory.js */
static newcRule(n,ev){ return n?Core.pf('NEWC_RULE',{crew:System.T('crew'),n:n,cast:''/* 출연 성별 규칙은 RULES(rulesText)에 이미 — 두 번 넣지 않음 */,rarity:ev?Core.pf('NEWC_RARITY_EVENT',{crew:System.T('crew')}):Core.pf('NEWC_RARITY_MAIN'),player:System.T('player'),schema:NewGame.charSchema(true),nai:NAI_CHAR}):'newCharacters는 빈 배열.'; }

  static stageSchema(deep){ return `[{"title":"","battle":true,${deep?'"beats":["장면 5~9개. 장면마다 장소, 나오는 인물, 일어나는 일, 감정·관계 변화, 드러나는 정보를 한 문장으로"]':'"pre":"","post":""'},"enemies":[{"name":"","elem":"${ELEMS.join('|')}","boss":false,"look":"새 적이면 NovelAI 영어 외형 태그(괴물은 no humans로 시작)"}],"field":{"k":"이야기에 맞는 전장 규칙(선택): ${Object.keys(FIELDS).join('|')}","a":"resonance·suppress는 속성, role은 ${Object.keys(ROLE).join('|')}, home은 소속 이름, timed는 초"},${NewGame.modeSchema()},${ROUTE_SCHEMA}}]`; }

    /* src/main/0260-new-game-draft.js */
static drText(d){ d=d||DR2; const L=[];
    if(d.world.trim()) L.push('[세계관]\n'+d.world.trim());
    if(d.setting.trim()) L.push('[설정: 세력·용어·규칙·비밀]\n'+d.setting.trim());
    if(d.story.trim()) L.push('[스토리 개요]\n'+d.story.trim());
    const cs=d.chars.filter(c=>String(c.name||'').trim()||String(c.profile||'').trim());
    if(cs.length) L.push('[인물]\n'+cs.map((c,i)=>`${i+1}. ${c.name||'(이름 미정)'}${c.role?' — '+c.role:''} (구분: ${c.kind==='npc'?'NPC':(d.crewTerm||'동료')+(c.rank?', 등급 '+RL[c.rank]:'')})\n   성격·과거·관계: ${c.profile||'(비어 있음)'}\n   말투: ${c.speech||'(비어 있음)'}\n   외모: ${c.look||'(비어 있음)'}`).join('\n'));
    const hr=d.hero; if(hr.name||hr.call||hr.gender||hr.look||hr.bio) L.push(`[주인공]\n호칭: ${hr.call||'(AI가 정함)'}\n이름: ${hr.name||'(호칭으로만 부름)'}\n성별·성 정체성: ${hr.gender||'정하지 않음'}\n외모: ${hr.look||'(비어 있음)'}\n설정: ${hr.bio||'(비어 있음)'}`);
    return L.join('\n\n'); }

  static storyN(def){ return Battle.storyCfg().stages||def; }

  static lenSpec(){ return STORY_LEN[Battle.storyCfg().len][1]; }

  static apValid(p){
    if(p.type==='anthropic'||p.type==='gemini') return !!p.key;
    if(p.type==='openai') return !!(p.base&&p.key&&(p.model||'').trim());
    if(p.type==='copilot') return !!p.gh;
    if(p.type==='vertex') return !!((p.sa||p.vkey)&&(p.model||DEFM[System.defKey(p)][0]));
    return false;
  }

  static async copilotTok(p){ const c=CPTOK[p.gh]; if(c&&c.exp*1000>Date.now()+60000) return c;
    const r=await System.http('https://api.github.com/copilot_internal/v2/token',{headers:Object.assign({Authorization:'token '+p.gh,Accept:'application/json'},COPILOT_H),timeout:30000});
    if(r.status===401) throw {code:'bad_key',message:'GitHub 로그인이 만료됐어요. AI 편집에서 다시 로그인해 주세요'};
    if(r.status===403||r.status===404) throw {code:'bad_key',message:'이 GitHub 계정에 Copilot 구독이 없어요'};
    const j=Characters.okJSON(r); if(!j.token) throw {code:'upstream_error',message:'Copilot 토큰을 받지 못했어요'};
    return CPTOK[p.gh]={token:j.token,exp:+j.expires_at||Math.floor(Date.now()/1000)+600,api:String((j.endpoints&&j.endpoints.api)||'https://api.githubcopilot.com').replace(/\/+$/,'')}; }

  static errOf(r){
    let m=''; try{const j=JSON.parse(r.text||'');m=(j.error&&(j.error.message||j.error.status||j.error))||j.message||j.detail||'';if(typeof m!=='string')m=JSON.stringify(m);}catch(e){m=(r.text||'').slice(0,200);}
    const s=r.status;
    if(s===401||s===403) return {code:'bad_key',message:m};
    if(s===402||/credit|balance|anlas/i.test(m)) return {code:'low_credit',message:m};
    if(s===404) return {code:'model_not_found',message:m};
    if(s===429||s===529||s===503) return {code:'rate_limited',message:m};
    return {code:'upstream_error',message:`(${s}) ${m}`};
  }

  static aiLog(e){ e.at=Date.now(); if(AISTAGE&&!e.stage) e.stage=AISTAGE; AILOG.unshift(e); if(AILOG.length>40) AILOG.length=40; try{ appStorage.setItem('ggm-ailog',JSON.stringify(AILOG.slice(0,25))); }catch(_){} }

  static async aiOne(p,prompt,tier,imgs,options={}){
    v2CheckCancelled(options.signal);
    imgs=(imgs||[]).filter(x=>x&&x.data);
    const dm=DEFM[System.defKey(p)]||['',''];
    const model=((tier==='quick'?(p.quick||p.model):p.model)||(tier==='quick'?dm[1]||dm[0]:dm[0])||'').trim();
    if(!model) throw {code:'model_not_found',message:'모델 이름이 비어 있어요'};
    const max={quick:2000,default:8000,complex:16000}[tier];
    const cmax={quick:4000,default:16000,complex:32000}[tier];
    const P2=Misc.aiOneP2Text({prompt});
    System.aiNotify('start',P2,{tier});
    const CC=imgs.length?[...imgs.map(i=>({type:'image',source:{type:'base64',media_type:i.mime,data:i.data}})),{type:'text',text:P2}]:P2;
    const OC=imgs.length?[...imgs.map(i=>({type:'image_url',image_url:{url:`data:${i.mime};base64,${i.data}`}})),{type:'text',text:P2}]:P2;
    if(p.type==='anthropic') return Characters.claudeMsg('https://api.anthropic.com/v1/messages',{'x-api-key':p.key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},{model,max_tokens:cmax,messages:[{role:'user',content:CC}]},tier,options);
    if(p.type==='openai'||p.type==='copilot'){
      const cp=p.type==='copilot'?await Core.copilotTok(p):null, base=cp?cp.api:Misc.normBase(p.base), auth=cp?Object.assign({Authorization:'Bearer '+cp.token},COPILOT_H,imgs.length?{'Copilot-Vision-Request':'true'}:{}):{Authorization:'Bearer '+p.key};
      let text='', fin='';
      for(let i=0;i<3;i++){
        const msgs=[{role:'user',content:OC}]; if(i) msgs.push({role:'assistant',content:text},{role:'user',content:'앞 응답이 길이 제한으로 끊겼다. 끊긴 바로 다음 글자부터 이어서 출력한다. 앞부분을 반복하지 말고, 설명이나 코드 블록 없이 이어지는 내용만 쓴다.'});
        const r=await System.http(base+'/chat/completions',{method:'POST',headers:Object.assign({'Content-Type':'application/json'},auth),body:{model,max_tokens:max,messages:msgs},timeout:TMO[tier],signal:options.signal});
        const j=Characters.okJSON(r), ch=(j.choices||[])[0]; if(!ch) throw {code:'upstream_error',message:JSON.stringify(j).slice(0,160)};
        if(ch.finish_reason==='content_filter') throw {code:'refused'};
        text+=(ch.message&&ch.message.content)||''; fin=ch.finish_reason;
        if(fin!=='length'||options.managedRetry) break;
      }
      try{ return Characters.parseLoose(text); }catch(e){ throw {code:'invalid_json',message:fin==='length'?'응답이 길이 제한에 걸렸어요':''}; }
    }
    if(p.type==='gemini') return Characters.geminiCall(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{'x-goog-api-key':p.key},P2,tier,imgs,options);
    if(p.type==='vertex'){
      const region=(p.region||'global').trim(), host=region==='global'?'aiplatform.googleapis.com':`${region}-aiplatform.googleapis.com`;
      if(!p.sa&&p.vkey) return Characters.geminiCall(`https://aiplatform.googleapis.com/v1/publishers/google/models/${model}:generateContent?key=${encodeURIComponent(p.vkey)}`,{},P2,tier,imgs,options);
      const tok=await System.vertexToken(p,options); let proj=(p.project||'').trim(); if(!proj){try{proj=JSON.parse(p.sa).project_id;}catch(e){}}
      const base=`https://${host}/v1/projects/${proj}/locations/${region}/publishers/${p.pub==='anthropic'?'anthropic':'google'}/models/${model}`;
      if(p.pub==='anthropic') return Characters.claudeMsg(base+':rawPredict',{Authorization:'Bearer '+tok},{anthropic_version:'vertex-2023-10-16',max_tokens:cmax,messages:[{role:'user',content:CC}]},tier,options);
      return Characters.geminiCall(base+':generateContent',{Authorization:'Bearer '+tok},P2,tier,imgs,options);
    }
    throw {code:'no_ai'};
  }

  static userPacks(){ try{ const a=JSON.parse(appStorage.getItem(PACKKEY)||'[]'); return Array.isArray(a)?a:[]; }catch(e){ return []; } }

  static allPresets(){ return [...STYLE_PRESETS,...Core.userPacks().filter(p=>p.tags!=null||p.neg!=null)]; }

  static llmSlots(){ let o={}; try{ o=JSON.parse(appStorage.getItem(LLMKEY)||'{}')||{}; }catch(e){} const L=Object.assign({top:'',mid:'',bot:'',tag:''},o); L.presets=Array.isArray(o.presets)?o.presets:[]; return L; }

  static naiCfg(){let o={};try{o=JSON.parse(appStorage.getItem(NKEY))||{};}catch(e){}const r=Object.assign({},NAI_DEF,o);
    r.endpoint=String(r.endpoint||NAI_ENDPOINT).trim().replace(/^https?:\/\/api\.novelai\.net/i,'https://image.novelai.net')||NAI_ENDPOINT;
    r.parts={}; ['char','bg','prop','cg','enemy','illust','lbcg','map','icon'].forEach(k=>{r.parts[k]=Object.assign({},NAI_DEF.parts[k],(o.parts||{})[k]||{});});
    r.sizes=Object.assign({},NAI_DEF.sizes,o.sizes||{}); r.ref=Object.assign({},NAI_DEF.ref,o.ref||{});
    { const L=Array.isArray(o.styles)?o.styles:[]; let my=L.find(x=>x&&x.id==='my_style');
      if(!my){ const cur=L.find(x=>x&&x.id===o.styleId), keep=cur&&!(cur.id==='s0'||cur.id==='am_v5'||/^sp_/.test(cur.id)||/^예시:/.test(cur.name||'')); my={tags:keep?cur.tags:'',neg:keep?cur.neg:''}; }
      r.styles=[{id:'my_style',name:'내 그림체',tags:String(my.tags||''),neg:String(my.neg||'')}]; r.styleId='my_style'; }
    if(!Array.isArray(r.poses)||!r.poses.length) r.poses=NAI_DEF.poses;
    r.poses=r.poses.map(x=>x.t==='standing, looking at viewer, arms at sides'?{n:x.n,t:NAI_FRONT}:x);
    r.cut=Object.assign({},CUT_DEF,o.cut||{}); const legacy=o.quality===true?Misc.naiQuality(r,r.model):String(o.legacyQualityTags||''); if(o.quality===true)r.styles[0].tags=Core.joinTags(r.styles[0].tags,legacy); r.legacyQualityTags=legacy;r.quality=false;r.qtags='';return r;}

  static tagList(s){const t=String(s||''),out=[];let inW=false,st=0;for(let i=0;i<t.length;i++){if(t[i]===':'&&t[i+1]===':'){inW=!inW;i++;continue;}if(t[i]===','&&!inW){const x=t.slice(st,i).trim();if(x)out.push(x);st=i+1;}}const x=t.slice(st).trim();if(x)out.push(x);return out;}

  static tagKey(t){return String(t).replace(/^[-+]?\d+(?:\.\d+)?::\s*(.*?)\s*::$/,'$1').replace(/\s+/g,' ').trim().toLowerCase();}

  static joinTags(...parts){const seen=new Set(),out=[];parts.forEach(p=>Core.tagList(p).forEach(t=>{const k=Core.tagKey(t);if(k&&!seen.has(k)){seen.add(k);out.push(t);}}));return out.join(', ');}

  static naiStyle(c,id){const b=c.styles.find(x=>x.id===id)||c.styles.find(x=>x.id===c.styleId)||c.styles[0]||{id:'my_style',tags:'',neg:''};const m=(typeof G!=='undefined'&&G&&G.meta)?G.meta:null;if(m&&String(m.artTags||'').trim())return {id:b.id,name:'이 게임 그림체',tags:Core.joinTags(String(m.artTags),c.legacyQualityTags),neg:String(m.artNeg||'')};return b;}

  static stripAge(s){ return Core.tagList(s).filter(t=>!AGE_TAGS.test(Core.tagKey(t))).join(', '); }

    /* CG에 플레이어가 나오면 플레이어 외모 태그(프로필 그림을 그린 태그)를 써요 */
static cgCast(l){return (l&&l.cast||[]).map(x=>({c:x.id==='__player'?Player.playerCast():charById(x.id),pos:x.pos||'auto',act:x.act||''})).filter(x=>x.c);}

  static naiBlocksUpgrade(parts){
   const p=Object.fromEntries(NAI_BLOCK_KEYS.map(k=>[k,String(parts?.[k]||'')]));
   if(typeof parts?.style==='string')return p;
   const other=[],style=[],known=Characters.naiBlocksKnownStyle();
   for(const tag of Characters.naiBlocksTokens(p.other))(Characters.naiBlocksTagSlot(tag,known)==='style'?style:other).push(tag);
   if(style.length){p.other=other.join(', ');p.style=style.join(', ');}
   return p;
  }

  static async naiSkinBase(c,rep){
   const saved=c.naiBlocks?.naiPrompt;
   if(saved?.combined===c.naiPrompt&&saved.method!=='rules')return Characters.naiBlocksOf(c);
   // A legacy mixed prompt needs semantic separation before replacing its outfit.
   return LiveOps.naiBlocksSeparate(c.naiPrompt,rep);
  }

  static naiSkinParts(base,response){
   if(!String(base?.appearance||'').trim())throw Error('캐릭터 외형 블록이 비어 있어요. 외형 태그를 분류하거나 입력한 뒤 다시 생성해 주세요.');
   const outfit=typeof response?.outfit==='string'?response.outfit.trim():'';
   if(Characters.naiBlocksSplit(outfit).appearance||Characters.naiBlocksSplit(response?.other||'').appearance)throw Error('새 의상에 캐릭터 외형을 바꾸는 태그가 들어 있어 적용하지 않았어요. 다시 생성해 주세요.');
   if(!outfit)throw Error('AI가 새 의상 정보를 비워서 반환했어요. 기존 스킨은 변경하지 않았어요.');
   return Core.naiBlocksUpgrade({appearance:base.appearance,outfit,other:typeof response.other==='string'?response.other.trim():''});
  }

  static async aiJSON(prompt,rep,tier,images){
    if(!SAMPLE){CoreView.toast('설정의 글 AI에서 AI를 먼저 등록해 주세요');return null;}
    let loadingTimer;if(rep){rep('AI가 쓰는 중…');if(String(prompt).includes('skills')){let dots=0;loadingTimer=setInterval(()=>rep('캐릭터와 스킬 생성중'+'.'.repeat(dots++%3+1)),400);}} /* 진행 알림 rep — 처리기가 uiProg(단추)로 만들어 넘김 */
    try{ const skillPrompt=Misc.aiJSONSkillPromptText({prompt}); const r=await SAMPLE.json(skillPrompt,{modelTier:tier||'default',cache:false,images});
      // AI가 {"chars":[…]} 대신 배열 […]만 돌려주는 경우(Gemini 등): 요청한 형식의 첫 키로 감싸요
      if(Array.isArray(r)){ const m=String(prompt).match(/JSON만 출력[^{\[]*\{\s*"([A-Za-z_]+)"\s*:\s*\[/); if(m) return {[m[1]]:r}; }
      return r; }
    catch(e){ if(!AI_QUIET) CoreView.toast(Art.aiErrText(e)); else AI_QUIET_LAST=Art.aiErrText(e); return null; }
    finally{clearInterval(loadingTimer); if(rep) rep.end(); }
  }

  static saveUserPacks(a){ try{ appStorage.setItem(PACKKEY,JSON.stringify(a.slice(0,50))); return true; }catch(e){ CoreView.toast('저장 공간이 부족해요'); return false; } }

  static regenCancel(){if(REGEN?.committing)return false;Misc.regenCancelJob();REGEN?.controller?.abort();REGEN=null;return true;}

  static async naiDrawItem(it){
    const candidateEligible=Characters.imageCandidateEligible(it.k,it.o,it.c,it.generationMode||'automatic'),originalSrc=Art.imgSrcRaw(it.o)||'';
    if(Art.autoRefOn(it.k)){ const cs=it.k==='cg'?Core.cgCast(it.o).map(x=>x.c):[it.c], refs=await Characters.standRefs(cs); if(refs.length) return Core.naiDrawItem0(it,{refs,candidateEligible,originalSrc}); }
    return Core.naiDrawItem0(it,{candidateEligible,originalSrc});
  }

  static naiDrawItem0(it,X){
    const draw=(kind,base,opt={})=>NewGame.naiDraw(kind,base,{...opt,candidateEligible:X.candidateEligible,originalSrc:X.originalSrc});
    if((it.k==='prop'||it.k==='bg'||(it.k==='enemy'&&!it.o.alias))&&!it.o.prompt) return Art.ensureLibPrompts().then(()=>draw(it.k,it.o.prompt));
    if(it.k==='upper'){ const c=it.c; return draw('char',Core.joinTags(c.naiPrompt,Characters.designTags(c),it.o.prompt),Object.assign({frame:'cowboy shot',pose:'looking at viewer, smile',styleId:c.naiStyle},X)); }
    if(it.k==='lbbg'){ const c=it.c; return draw('bg',it.o.prompt||(c.illust&&c.illust.prompt)||'cozy room interior, window, soft light',{}); }
    if(it.k==='pose'){ const c=it.c; return draw('char',Core.joinTags(c.naiPrompt,Characters.designTags(c),it.o.prompt),{frame:'cowboy shot',pose:it.o.prompt?'':'dynamic pose, looking at viewer, smile, hand up, white background, simple background',styleId:c.naiStyle}); }
    if(it.k==='scg'){ const c=it.c; return draw('illust',Core.joinTags(c.naiPrompt,Characters.designTags(c),it.o.prompt),Object.assign({pose:it.o.prompt?'special effects, motion lines':Messenger.ultimateSceneTags(c)+', special effects',styleId:c.naiStyle,frame:'upper body'},X)); }
    if(it.k==='illust'||it.k==='lbcg'){ const c=it.c; return draw(it.k,Core.joinTags(c.naiPrompt,Characters.designTags(c),it.o.prompt),Object.assign({pose:it.o.naiPose!=null?it.o.naiPose:undefined,styleId:c.naiStyle,frame:it.o.naiFrame},X)); }
    if(it.k==='cg') return draw('cg',null,Object.assign({item:it.o,styleId:it.o.naiStyle},X));
    if(it.k==='char') return draw('char',Core.joinTags(it.o.naiPrompt,Characters.designTags(it.o)),{pose:it.o.naiPose||undefined,styleId:it.o.naiStyle,frame:it.o.naiFrame});
    return draw(it.k==='weapon'?'weapon':it.k,it.o.prompt);
  }

  static naiErr(e,label){
    if(e&&/update to the image URL|refresh NovelAI/i.test(e.message||'')) return 'NovelAI 옛 서버 주소로 요청했어요. 설정의 그림 AI에서 생성 주소를 '+NAI_ENDPOINT+' 로 바꿔 주세요.';
    if(!IS_NATIVE&&e&&e.code==='network'&&e.message) return (label?label+'. ':'')+e.message;
    if(Art.imgProvider()==='comfy'&&e&&e.code==='network') return 'ComfyUI 서버에 연결하지 못했어요. PC에서 --listen 옵션으로 켰는지, 같은 와이파이인지, 주소(http://PC주소:8188)를 확인해 주세요.';
    const m={comfy_nourl:'설정의 그림 AI에서 ComfyUI 주소를 넣어 주세요.',comfy_wf:'ComfyUI 워크플로 문제: '+((e&&e.message)||''),comfy_err:'ComfyUI 오류: '+((e&&e.message)||''),comfy_timeout:'ComfyUI가 시간 안에 그림을 끝내지 못했어요. 설정에서 대기 시간을 늘려 보세요.',nai_locked:'NovelAI에서 다른 생성이 진행 중이에요. 잠시 뒤 다시 시도해 주세요.',nai_empty:'NovelAI 응답에 이미지가 없어요.',bad_key:'NovelAI 토큰이 올바르지 않아요. 설정의 그림 AI에서 확인해 주세요.',low_credit:'Anlas가 부족하거나 구독이 필요해요.',rate_limited:'NovelAI가 바빠요. 다른 생성이 끝난 뒤 다시 시도해 주세요.',network:'인터넷 연결을 확인해 주세요. 웹 버전에서는 그림 AI가 안 될 수 있어요.',nai_zip:'NovelAI 응답을 풀지 못했어요.',nai_nokey:'설정의 그림 AI에 NovelAI 토큰을 넣어 주세요.'};
    return m[e&&e.code]||((label||'그림 생성 실패')+'. '+((e&&e.message)||''));
  }

  static async imgB64(src,W,H,bg){
    const im=await Characters.loadImg(src), cv=document.createElement('canvas'); cv.width=W; cv.height=H; const x=cv.getContext('2d');
    x.fillStyle=bg; x.fillRect(0,0,W,H); const s=Math.min(W/im.width,H/im.height), w=im.width*s, h=im.height*s;
    x.drawImage(im,(W-w)/2,(H-h)/2,w,h); return cv.toDataURL('image/png').split(',')[1];
  }

  static async naiBgRemove(src){
    const c=Core.naiCfg(); if(!c.key) throw {code:'nai_nokey'};
    const im=await Characters.loadImg(src), iw=im.naturalWidth||im.width, ih=im.naturalHeight||im.height, r=iw&&ih?iw/ih:2/3;
    let W,H; if(iw%64===0&&ih%64===0&&iw*ih<=1024*1536){W=iw;H=ih;} else [W,H]=[[832,1216],[1216,832],[1024,1024],[896,1152],[1152,896]].sort((a,b)=>Math.abs(r-a[0]/a[1])-Math.abs(r-b[0]/b[1]))[0];
    const image=await Core.imgB64(src,W,H,'#ffffff');
    const res=await System.http(Art.naiBase(c)+'/ai/augment-image',{method:'POST',headers:NAI_HDR(c.key),body:{req_type:'bg-removal',width:W,height:H,image},binary:true,timeout:180000});
    if(res.status>=400||!res.bytes) throw Core.errOf(res);
    const files=await Art.unzipAll(res.bytes); let best=null,bs=-1;
    for(const f of files){ const b=new Blob([f],{type:Art.imgType(f)||'image/png'}); const s=await Misc.alphaBorder(b); if(s>bs){bs=s;best=b;} }
    if(!best||bs<0.3) throw {code:'nai_empty',message:'투명 배경 결과를 찾지 못했어요'};
    return best;
  }

  static async cutoutWhite(blob,o){
    try{
      o=Object.assign(Characters.cutCfg(),o||{});
      const bmp=await createImageBitmap(blob), W=bmp.width, H=bmp.height, N=W*H;
      const cv=document.createElement('canvas'); cv.width=W; cv.height=H; const x=cv.getContext('2d',{willReadFrequently:true}); x.drawImage(bmp,0,0);
      const id=x.getImageData(0,0,W,H), d=id.data;
      // 1. background colour = median of the border ring (works for white, off-white and light grey)
      const ring=[]; const R=Math.max(2,Math.round(Math.min(W,H)*0.01));
      for(let y=0;y<H;y+=2) for(let k=0;k<R;k++){ring.push((y*W+k)*4,(y*W+W-1-k)*4);}
      for(let xx=0;xx<W;xx+=2) for(let k=0;k<R;k++){ring.push((k*W+xx)*4,((H-1-k)*W+xx)*4);}
      const med=ch=>{const a=ring.map(i=>d[i+ch]).sort((p,q)=>p-q);return a[a.length>>1];};
      const br=med(0),bgc=med(1),bb=med(2);
      // distance from background colour (perceptual-ish)
      const dist=new Uint8Array(N);
      for(let p=0,i=0;p<N;p++,i+=4){const dr=d[i]-br,dg=d[i+1]-bgc,db=d[i+2]-bb;dist[p]=Math.min(255,Math.round(Math.sqrt(dr*dr+dg*dg+db*db)));}
      const T=o.tol, S=Math.max(1,o.soft);
      // 2. flood fill background reachable from the border (4-neighbour)
      const bgm=new Uint8Array(N), q=new Int32Array(N); let qh=0,qt=0;
      const push=p=>{if(!bgm[p]&&dist[p]<=T){bgm[p]=1;q[qt++]=p;}};
      for(let i=0;i<W;i++){push(i);push((H-1)*W+i);} for(let j=0;j<H;j++){push(j*W);push(j*W+W-1);}
      while(qh<qt){const p=q[qh++],px=p%W;if(px>0)push(p-1);if(px<W-1)push(p+1);if(p>=W)push(p-W);if(p<N-W)push(p+W);}
      if(qt<N*0.08) return blob;
      // 2b. soft grey shadows on the floor that touch the background (low chroma, slightly darker than bg)
      if(o.shadow){
        const bl=br*0.3+bgc*0.59+bb*0.11; qh=0; let qt2=0;
        const y0=Math.floor(H*0.7)*W;
        const sh=p=>{if(p<y0)return false;const i=p*4,mx=Math.max(d[i],d[i+1],d[i+2]),mn=Math.min(d[i],d[i+1],d[i+2]),l=d[i]*0.3+d[i+1]*0.59+d[i+2]*0.11;return mx-mn<=24&&l<=bl+4&&l>=bl-95;};
        for(let p=0;p<N;p++) if(bgm[p]){const px=p%W;const nb=[px>0?p-1:-1,px<W-1?p+1:-1,p>=W?p-W:-1,p<N-W?p+W:-1];for(const n of nb){if(n>=0&&!bgm[n]&&sh(n)){bgm[n]=1;q[qt2++]=n;}}}
        while(qh<qt2){const p=q[qh++],px=p%W;const nb=[px>0?p-1:-1,px<W-1?p+1:-1,p>=W?p-W:-1,p<N-W?p+W:-1];for(const n of nb){if(n>=0&&!bgm[n]&&sh(n)){bgm[n]=1;q[qt2++]=n;}}}
      }
      // 3. enclosed holes (between arms, under hair) that match the background closely
      if(o.holes){
        const lab=new Uint8Array(N), minHole=Math.max(60,N*0.0006), Th=Math.max(6,Math.round(T*0.55));
        for(let s0=0;s0<N;s0++){ if(bgm[s0]||lab[s0]||dist[s0]>Th) continue;
          qh=0;qt=0;q[qt++]=s0;lab[s0]=1;
          while(qh<qt){const p=q[qh++],px=p%W;const nb=[px>0?p-1:-1,px<W-1?p+1:-1,p>=W?p-W:-1,p<N-W?p+W:-1];for(const n of nb){if(n>=0&&!lab[n]&&!bgm[n]&&dist[n]<=Th){lab[n]=1;q[qt++]=n;}}}
          if(qt>=minHole){ let m=0,m2=0; for(let k=0;k<qt;k++){const i=q[k]*4,l=d[i]*0.3+d[i+1]*0.59+d[i+2]*0.11;m+=l;m2+=l*l;} m/=qt; const sd=Math.sqrt(Math.max(0,m2/qt-m*m)); if(sd<=2.2) for(let k=0;k<qt;k++) bgm[q[k]]=1; }
        }
      }
      // 4. remove small floating specks of foreground
      if(o.despeck){
        const lab=new Uint8Array(N), minObj=Math.max(40,N*0.0015);
        for(let s0=0;s0<N;s0++){ if(bgm[s0]||lab[s0]) continue;
          qh=0;qt=0;q[qt++]=s0;lab[s0]=1;
          while(qh<qt){const p=q[qh++],px=p%W;const nb=[px>0?p-1:-1,px<W-1?p+1:-1,p>=W?p-W:-1,p<N-W?p+W:-1];for(const n of nb){if(n>=0&&!lab[n]&&!bgm[n]){lab[n]=1;q[qt++]=n;}}}
          if(qt<minObj) for(let k=0;k<qt;k++) bgm[q[k]]=1;
        }
      }
      // 5. alpha: background transparent, soft matte on the boundary band, colour decontamination
      const near=new Uint8Array(N); // distance (in px, up to 3) from the background region
      for(let p=0;p<N;p++) if(bgm[p]) near[p]=1;
      for(let pass=2;pass<=3;pass++){ for(let p=0;p<N;p++){ if(near[p]) continue; const px=p%W;
        if((px>0&&near[p-1]===pass-1)||(px<W-1&&near[p+1]===pass-1)||(p>=W&&near[p-W]===pass-1)||(p<N-W&&near[p+W]===pass-1)) near[p]=pass; } }
      for(let p=0,i=0;p<N;p++,i+=4){
        if(bgm[p]){d[i+3]=0;continue;}
        if(near[p]>=2&&near[p]<=3){
          let a=(dist[p]-T)/S; a=a<=0?0.08:a>=1?1:a; if(near[p]===2) a=Math.min(a,0.92);
          d[i+3]=Math.round(255*a);
          if(a<1){const k=1/a; d[i]=Math.max(0,Math.min(255,Math.round((d[i]-(1-a)*br)*k))); d[i+1]=Math.max(0,Math.min(255,Math.round((d[i+1]-(1-a)*bgc)*k))); d[i+2]=Math.max(0,Math.min(255,Math.round((d[i+2]-(1-a)*bb)*k)));}
        }
      }
      x.putImageData(id,0,0);
      return await new Promise(r=>cv.toBlob(b=>r(b||blob),'image/png'));
    }catch(e){ return blob; }
  }

  static imgReady(){return Art.imgProvider()==='comfy'?!!(Art.comfyCfg().url&&Art.comfyCfg().wf):!!Core.naiCfg().key;}

  static imgNeed(){return Art.imgProvider()==='comfy'?'설정의 그림 AI에서 ComfyUI 주소와 워크플로를 넣어 주세요':'설정의 그림 AI에 NovelAI 토큰을 넣어 주세요';}

  static async comfyGenerate(prompt,kind,opts){
    opts=opts||{}; const cc=Art.comfyCfg(), c=Core.naiCfg(); if(!cc.url) throw {code:'comfy_nourl'};
    let wf; try{ wf=JSON.parse(cc.wf); }catch(e){ throw {code:'comfy_wf',message:'워크플로 JSON을 읽지 못했어요'}; }
    if(!wf||Array.isArray(wf.nodes)) throw {code:'comfy_wf',message:'ComfyUI에서 "Export (API)"로 저장한 워크플로를 넣어 주세요'};
    const [w,h]=opts.size||System.naiSize(kind,c);
    const seed=opts.seed!=null&&String(opts.seed).trim()!==''?(Math.floor(+opts.seed)>>>0):Math.floor(Math.random()*4294967295); opts.usedSeed=seed; opts.usedModel='ComfyUI';
    const pos=Misc.sdTags(Core.joinTags(prompt,cc.qtags)), neg=Misc.sdTags(Core.joinTags(opts.neg!=null?opts.neg:c.neg,cc.neg));
    const outNode=Misc.comfyBind(wf,{pos,neg,w,h,seed}), base=cc.url.trim().replace(/\/+$/,'');
    const r=await System.http(base+'/prompt',{method:'POST',headers:{'Content-Type':'application/json'},body:{prompt:wf,client_id:'ggm'+uid()},timeout:30000});
    let j; try{ j=JSON.parse(r.text||(r.bytes?new TextDecoder().decode(r.bytes):'')); }catch(e){ j={}; }
    if(r.status>=400||!j.prompt_id) throw {code:'comfy_err',message:String((j.error&&(j.error.message||j.error))||JSON.stringify(j.node_errors||j)).slice(0,240)};
    const pid=j.prompt_id, t0=Date.now(); let out=null, n=0;
    while(Date.now()-t0<num(cc.timeoutSec,30,1200,300)*1000){
      await wait(1500); n++; if(opts.onRetry&&n%4===0) opts.onRetry(Math.round((Date.now()-t0)/1000),0,'ComfyUI 생성 중');
      let hj; try{ hj=Characters.okJSON(await System.http(base+'/history/'+pid,{timeout:20000})); }catch(e){ continue; }
      const it=hj&&hj[pid]; if(!it) continue;
      if(it.status&&it.status.status_str==='error') throw {code:'comfy_err',message:'워크플로 실행 중 오류가 났어요'};
      const imgs=[]; Object.entries(it.outputs||{}).forEach(([nid,o])=>(o.images||[]).forEach(im=>imgs.push(Object.assign({nid},im))));
      out=imgs.find(x=>outNode&&x.nid===outNode)||imgs.find(x=>x.type==='output')||imgs[0]; if(out) break;
    }
    if(!out) throw {code:'comfy_timeout'};
    const vr=await System.http(`${base}/view?filename=${encodeURIComponent(out.filename)}&subfolder=${encodeURIComponent(out.subfolder||'')}&type=${encodeURIComponent(out.type||'output')}`,{binary:true,timeout:90000});
    if(vr.status>=400||!vr.bytes) throw {code:'comfy_err',message:'결과 이미지를 받지 못했어요'};
    let blob=new Blob([vr.bytes],{type:Art.imgType(vr.bytes)||'image/png'});
    if(['char','enemy','icon'].includes(kind)&&c.cutout&&!opts.noCut){ const ai=await System.alphaInfo(blob); if(ai.border<0.5) blob=await Core.cutoutWhite(blob); }
    return blob;
  }

  static async naiGenerate(prompt,kind,opts){
    opts=opts||{}; prompt=stripMinor(prompt); if(Array.isArray(opts.chars)) opts.chars=opts.chars.map(c=>c&&typeof c.prompt==='string'?Object.assign({},c,{prompt:stripMinor(c.prompt)}):c); if(Art.imgProvider()==='comfy') return Core.comfyGenerate(prompt,kind,opts);
    try{ const b=await System.naiGenerate0(prompt,kind,opts); if(opts.usedTp&&opts.emptyAlpha) throw {code:'nai_empty',message:'투명 결과가 비어 있어요'}; try{ b.__seed=opts.usedSeed; }catch(_){} return b; }
    catch(e){
      if(!opts.usedTp||opts.noTp||(e&&['nai_nokey','bad_key','low_credit','nai_locked','rate_limited','network'].includes(e.code))) throw e;
      const why=Core.naiErr(e,'투명 생성 실패');
      opts.onRetry&&opts.onRetry(1,2,'투명 배경 실패, 흰 배경으로');
      opts.noTp=true; opts.emptyAlpha=false; const b2=await System.naiGenerate0(prompt,kind,opts);
      NAI_TP_OFF=true; try{appStorage.setItem('starfall-nai-tperr',why+' @'+new Date().toLocaleString());}catch(_){}
      CoreView.toast('투명 배경 생성이 안 돼서 흰 배경으로 그렸어요. 앱을 다시 켜기 전까지는 흰 배경으로 그려요'); return b2;
    }
  }

  static naiTarget(kind,id){if(ILK(kind)){const c=charById(id);return c&&c[kind];}if(kind==='weapon'){const c=charById(id);return c&&c.weapon;}return kind==='char'?charById(id):libById(id);}

    // 인페인팅 결과에서 칠한 얼굴 부분만 원본에 부드럽게 붙여요(원본의 투명 배경·흰 옷은 그대로)
  /* 표정 한 장 그리기 (b: 'full'|'up') — 표정 창과 새 게임 자동 표정이 같이 써요 */
static async faceDrawOne(c,F,f,ko,b,O,x,generationMode='automatic'){const game=G,project=Core.PJ().active;x=x||''; const en=(FACE_PRESETS.find(p=>p[0]===ko)||[])[1]||'happy', ft=FACE_TAGS[en]||en, ew=[1.7,1.5,1.35,1.2][O.lv]||1.5, i2s=[0.72,0.64,0.56,0.48][O.lv]||0.6, emph=Misc.faceDrawOneEmphText({ew,ft});
    const basePr=F===c?c.naiPrompt:(F.prompt||c.naiPrompt), upO=Characters.faceUpperObj(c,F), srcO=b==='up'?upO:F, src=Art.imgSrcRaw(srcO), frame=b==='up'?'cowboy shot':c.naiFrame, candidateEligible=Characters.imageCandidateEligible('face',b==='up'?f.up:f,c,generationMode),originalSrc=Art.imgSrcRaw(b==='up'?f.up:f)||''; let blob;
    const refs=O.ref?[{image:await Characters.refImage(Art.imgSrcRaw(F)||upO&&Art.imgSrcRaw(upO)),type:'character',strength:1,fidelity:1}]:undefined;
    if(O.m==='inpaint') blob=await Characters.focusedInpaint(src,F.faceMask[b],(img,msk,tw,th,candidate)=>{ const pz=PromptStudio.faceDrawOnePzText({candidate,basePr,emph,x,c}); return Core.naiGenerate(pz.input,'char',{candidateBypass:true,seed:candidate.seed,neg:Core.joinTags(pz.neg,'blurry, deformed face'),model:O.model,refs,size:[tw,th],noCut:true,noTp:true,inpaint:{image:img,mask:msk,strength:1,addOrig:false}}); },{candidateEligible,originalSrc,prompt:Core.joinTags(basePr,emph,x)});
    else if(O.m==='raw') blob=await NewGame.naiDraw('char',Core.joinTags(basePr,emph,x),{candidateEligible,originalSrc,frame,pose:c.naiPose||undefined,styleId:c.naiStyle,model:O.model,seed:srcO.seed!=null?srcO.seed:undefined});
    else if(O.m==='emo') blob=await Art.naiEmotion(src,en,x,O.lv,candidateEligible,originalSrc);
    else { const im=await Characters.loadImg(src), [w,h]=Characters.fitDims(im.naturalWidth||im.width,im.naturalHeight||im.height); blob=await NewGame.naiDraw('char',Core.joinTags(basePr,emph,x),{candidateEligible,originalSrc,frame,pose:c.naiPose||undefined,styleId:c.naiStyle,model:O.model,refs,size:[w,h],seed:srcO.seed!=null?srcO.seed:undefined,img2img:{image:await Core.imgB64(src,w,h,'#ffffff'),strength:i2s,noise:0.05}}); }
    if(G!==game||Core.PJ().active!==project)throw Error('게임이 바뀌어 표정 생성을 중단했습니다');
    if(b==='up'){ f.up=f.up||{id:'fu'+f.id,name:ko+' 상반신',img:null}; await Art.storeImage(f.up,blob,''); } else await Art.storeImage(f,blob,'');
    Core.mark('c:'+c.id); }

  static artSnap(){try{return new Set(Art.drawTodo().map(Misc.artKey));}catch(e){return new Set();}}

  static async designAI(rep){ const facs=World.designFacs(), w=G.world||{};
    const r=await Core.aiJSON(Characters.designAIPrompt({w,facs}),rep,'quick');
    if(!r||typeof r!=='object') return; if(r.all&&$('#ds_all')) $('#ds_all').value=stripMinor(String(r.all));
    (Array.isArray(r.factions)?r.factions:[]).forEach(x=>{ const el=[...document.querySelectorAll('#modal [data-fac]')].find(e=>e.dataset.fac===String(x&&x.name||'').trim()); if(el&&x.tags) el.value=stripMinor(String(x.tags)); });
    CoreView.toast('제안을 채웠어요. 고친 뒤 저장을 눌러 주세요'); }

  static SND(){let o={};try{o=JSON.parse(appStorage.getItem(SKEY))||{};}catch(e){}const r=Object.assign({},SND_DEF,o);r.scene=Object.assign({},SND_DEF.scene,o.scene||{});return r;}

  static bgmFade(v,cb){ clearInterval(BGM.fadeT); const el=BGM.el; if(el.paused&&v===0){cb&&cb();return;} BGM.fadeT=setInterval(()=>{const d=v-el.volume; if(Math.abs(d)<=0.05){el.volume=v;clearInterval(BGM.fadeT);cb&&cb();return;} el.volume=Math.max(0,Math.min(1,el.volume+Math.sign(d)*0.05));},40); }

  static async elSfx(l){
    const s=Core.SND(); if(!s.elKey) throw {code:'el_nokey'};
    const r=await System.http(Art.elUrl('/v1/sound-generation?output_format=mp3_44100_128'),{method:'POST',headers:{'xi-api-key':s.elKey,'Content-Type':'application/json'},
      body:{text:l.prompt,duration_seconds:Math.min(22,Math.max(0.5,+l.dur||1.5)),prompt_influence:0.4},binary:true,timeout:120000});
    if(r.status>=400||!r.bytes) throw Core.errOf(r);
    await Art.storeAudio(l,new Blob([r.bytes],{type:'audio/mpeg'}));
  }

  static prefetchTTS(c,text){ if(Core.SND().fishKey&&c&&Economy.voiceOf(c)) System.ttsBlob(c,text).catch(()=>{}); }

  static progSlot(k){ const s=PROG_SLOTS[k], p=G.prog; let v=p[k]; if(!(s.ok||progObj)(v)||(s.stale&&s.stale(v))){ v=p[k]=s.make(v); Core.mark('prog'); } if(s.fill) s.fill(v,p); if(s.now) s.now(v); return v; }

  static progRead(k){ const s=PROG_SLOTS[k], v=G.prog[k]; if((s.ok||progObj)(v)&&!(s.stale&&s.stale(v))) return s.now?s.now(clone(v)):v;
    const n=s.make(v); if(s.fill) s.fill(n,Object.assign({},G.prog)); return s.now?s.now(n):n; }

  static gameSlot(path,g=G){ const s=GAME_SLOTS[path], [o,k]=gameAt(path,g), v=o[k]; if(!(s.ok||progObj)(v)) o[k]=path==='world.plan'&&progObj(v)?Object.assign(s.make(),v,Object.fromEntries(['acts','twists','branches','arcs'].map(x=>[x,Array.isArray(v[x])?v[x]:[]]))):s.make(); return o[k]; }

  static gameRead(path){ const s=GAME_SLOTS[path], [o,k]=gameAt(path,G), v=o[k]; return (s.ok||progObj)(v)?v:s.make(); }

  static PJ(){let d=null;try{d=JSON.parse(appStorage.getItem(PJKEY));}catch(e){} if(!d||!Array.isArray(d.list)){d={active:'main',list:[{id:'main',title:'낙성계약'}]};} return d;}

  static defaultShop(ev,g){
    const gg=g||G, b=(gg.banners||[]).find(x=>x.id===ev.bannerId), it=[
     {id:'s1',type:'gems',amt:300,price:100,limit:5},{id:'s2',type:'gold',amt:10000,price:40,limit:10},
     {id:'s3',type:'exp',amt:30,price:60,limit:10},{id:'s4',type:'wmat',amt:15,price:70,limit:10},{id:'s5',type:'core',amt:5,price:150,limit:4}];
    if(b) (b.pickup||[]).forEach((cid,i)=>it.push({id:'sc'+i,type:'char',ref:cid,amt:1,price:1200,limit:2}));
    return it;
  }

  static defaults(){return {ver:VER,meta:clone(DEFAULT_META),world:clone(DEFAULT_WORLD),chars:clone(DEFAULT_CHARS),chapters:clone([...DEFAULT_CHAPTERS,DEFAULT_EVENT_CHAPTER]),lib:clone([...DEFAULT_LIB,...DEFAULT_SFX]),threads:clone(DEFAULT_THREADS),opening:clone(DEFAULT_OPENING),banners:clone(DEFAULT_BANNERS),events:clone(DEFAULT_EVENTS),dispatches:clone(DEFAULT_DISP),prog:clone(DEFAULT_PROG)};}

  static mark(...k){if(NEW_GAME_SOURCE&&G!==NEW_GAME_SOURCE)return;Characters.naiBlocksGame(G);for(const x of k)if(typeof x==='string'&&x.startsWith('c:'))Characters.inheritOnMark(x.slice(2));k.forEach(x=>dirty.add(x));saveRevision++;clearTimeout(flushT);flushT=setTimeout(()=>Core.flush().catch(()=>{}),100);}

  static flush(){
   if(window.__NOFLUSH)return appStorage.drain();
   const run=async()=>{if(!dirty.size)return appStorage.drain();const game=NEW_GAME_SOURCE||G,revision=saveRevision,keys=[...dirty],oldAt=game.prog.savedAt;const at=Date.now();
   try{const bases=new Set((game.chars||[]).filter(x=>!x.alt).map(x=>x.id)),snapshot=JSON.stringify({...game,chars:(game.chars||[]).map(c=>Characters.inheritStore(c,bases)),prog:{...game.prog,savedAt:at}});appStorage.setItem(LKEY,snapshot);await appStorage.drain();game.prog.savedAt=at;
   if(DB)for(const k of keys)await Misc.writeKey(k,game);
   if(revision===saveRevision)dirty.clear();dispatchEvent(new CustomEvent('ggm-saved'));
   }catch(e){game.prog.savedAt=oldAt;System.saveFailed(e.message||'기기에 저장하지 못했습니다');throw e;}};
   saveTail=saveTail.catch(()=>{}).then(run);return saveTail;
  }

  static async idbDel(k){return appStorage.mediaWrite(k,null,LKEY);}

  static async idbGet(k){const d=await System.idbOpen();return new Promise((res,rej)=>{const t=d.transaction('img');const q=t.objectStore('img').get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});}

    // 표정의 상반신판(f.up)·스킨 표정·NPC까지 모두 넣어야 다시 켰을 때·백업·연동에서 빠지지 않아요
static imgObjsOf(g){const a=[...(g.chars||[]),...(g.lib||[])];if(g.meta&&g.meta.shop&&g.meta.shop.self)a.push(g.meta.shop.self);const fz=fs=>(fs||[]).forEach(f=>{if(!f)return;a.push(f);if(f.up)a.push(f.up);});if(g.prog&&g.prog.avatar&&g.prog.avatar.id)a.push(g.prog.avatar);(g.npcs||[]).forEach(n=>{a.push(n);if(n.upper)a.push(n.upper);fz(n.faces);});(g.chars||[]).forEach(c=>{fz(c.faces);a.push(...(c.skins||[]));(c.skins||[]).forEach(k=>{if(!k)return;fz(k.faces);['upper','illust','lbcg'].forEach(x=>{if(k[x])a.push(k[x]);});});Object.values(c.skillIcons||{}).forEach(o=>{if(o&&o.id)a.push(o);});if(c.weapon)a.push(c.weapon);if(c.illust)a.push(c.illust);if(c.upper)a.push(c.upper);if(c.pose)a.push(c.pose);if(c.lbbg)a.push(c.lbbg);if(c.lbcg)a.push(c.lbcg);if(c.scg)a.push(c.scg);Object.values(c.cards||{}).forEach(o=>{if(o&&o.id)a.push(o);});});return a.filter(o=>o&&o.id);}

  static allImgObjs(){return Core.imgObjsOf(G);}

    // A skin preview can only use images owned by that skin; never borrow the base outfit.
static skinPreviewSrc(c,k){if(!k)return null;const stand=Art.imgSrcRaw(k),upper=k.upper&&Art.imgSrcRaw(k.upper);return c.useStanding===false?upper||stand:stand||upper;}

  static skinDisplayReady(c,k){return !!(k&&(c.useStanding===false?k.upper&&Art.imgSrcRaw(k.upper):Core.skinPreviewSrc(c,k)));}

  static async shrink(file,max){
    try{
      const bmp=await createImageBitmap(file); const s=Math.min(1,max/Math.max(bmp.width,bmp.height));
      const cv=document.createElement('canvas'); cv.width=Math.round(bmp.width*s); cv.height=Math.round(bmp.height*s);
      cv.getContext('2d').drawImage(bmp,0,0,cv.width,cv.height);
      const b=await new Promise(r=>cv.toBlob(r,'image/webp',0.92)); return b||file;
    }catch(e){return file;}
  }

  static async addFaceFile(c,name,file,b){ const F=Characters.faceTgt(c); let fc=F.faces.find(q=>q.name===name); if(!fc){ fc={id:'f'+uid(),name,img:null}; F.faces.push(fc); } const bl=await Core.shrink(file,1800); if(b==='up'){ fc.up=fc.up||{id:'fu'+fc.id,name:name+' 상반신',img:null}; await Art.storeImage(fc.up,bl,''); } else await Art.storeImage(fc,bl,''); Core.mark('c:'+c.id); }

  static rewardText(r){const p=[];if(r.gems)p.push(`◆${nf(r.gems)} ${System.T('currency')}`);if(r.gold)p.push(`${System.T('gold')} ${nf(r.gold)}`);if(r.exp)p.push(`${System.T('expMat')} ${nf(r.exp)}`);if(r.wmat)p.push(`${System.T('wMat')} ${nf(r.wmat)}`);if(r.core)p.push(`${System.T('core')} ${nf(r.core)}`);if(r.gearMat)p.push(`${System.T('gearMat')} ${nf(r.gearMat)}`);if(r.transcMat)p.push(`${System.T('transcMat')} ${nf(r.transcMat)}`);['res1','res2','res3','res4'].forEach(k=>{if(r[k])p.push(`${System.T(k)} ${nf(r[k])}`);});if(r.token)p.push(`${r.tokenName||'토큰'} ${nf(r.token)}`);if(r.gift)p.push(`선물 ${r.gift}개`);return p.join(', ');}

  static pickTouchLine(pool,current=''){
    const lines=(Array.isArray(pool)?pool:[]).filter(l=>typeof l==='string'&&sub(l).trim());
    const different=lines.filter(l=>sub(l)!==String(current??''));
    // All generated/skin lines can resolve to the same text. Never retry until
    // different: use a bounded selection, keeping original lines for speech.
    return rand(different.length?different:lines)||'…';
  }

  static affLv(o){return Math.min(10,Math.floor((o?.aff||0)/GGMCombat.AFFINITY.step)+1);}

  static stats(c){v2ApplyRoleSpeed(c);const o=Characters.own(c.id)||{lv:1,dup:0,wlv:0};const m=(1+0.06*(o.lv-1))*(1+0.08*o.dup)*(RMUL[c.rarity]||1);return {hp:Math.round(c.hp*m*(1+0.03*(o.wlv||0))),atk:Math.round(c.atk*m*(1+0.06*(o.wlv||0))),def:Math.round(c.def*m),spd:c.spd};}

  static gainExp(o,x){o.exp+=x;while(o.lv<levelCap(o)&&o.exp>=GGMCombat.levelExperience(o.lv)){o.exp-=GGMCombat.levelExperience(o.lv);o.lv++;}if(o.lv>=levelCap(o))o.exp=Math.min(o.exp,GGMCombat.levelExperience(o.lv)-1);}

  static memoOpen(c){ const o=Characters.own(c.id); return !!(c.memorial&&c.memorial.script&&o&&Core.affLv(o)>=(+c.memorial.lv||8)); }

  static fcSummarize(cid){ return ChatSummaryGen.run({cid}).catch(e=>Core.quietErr(e,'0100-messenger.js:151')); }

  static async fcSend(opt){
    opt=opt||{}; if(FCBUSY||!PH||!PH.fc) return; const cid=PH.fc, c=charById(cid), inp=$('#fcIn'); if(!c||!inp) return; if(!opt.img&&PH.pendImg) opt.img=PH.pendImg; const text=inp.value.trim(); if(!text&&!opt.img) return; if(!opt.img&&PH.lastSend&&PH.lastSend.t===text&&Date.now()-PH.lastSend.at<2500){ inp.value=''; return; } PH.lastSend={t:text,at:Date.now()}; if(opt.img){ PH.pendImg=null; CoreView.phPendRender(); NewGameView.fcInputPhotoHint(false); }
    if(!SAMPLE){ CoreView.toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; }
    const f=Messenger.fcOf(cid), token=PH.token, alive=()=>PH&&PH.token===token&&MiscView.phOpen(); MiscView.fcInputClear(inp,text);
    if(PH.tid){ if(Messenger.threadFree(c,PH.tid)) MessengerView.updateBadge(); PH.tid=null; MessengerView.phFreeShow(); }
    const me={w:'me',t:text,at:Date.now()}; if(opt.img) me.img=opt.img; NewGame.fcLogAdd(f,me); if(alive()){ MessengerView.phEmptyClear(cid); CoreView.phBubble(me,c); }
    FCBUSY=true; let tyOff=alive()?NewGameView.phTyping(c):()=>{};
    try{
      const o=Characters.own(c.id), lv=Core.affLv(o), files=(c.files||[]).filter(x=>o&&o.dup>=(x.dup||0)).map(x=>x.text).filter(Boolean);
      const pool=typeof Characters.affLinePool==='function'?Characters.affLinePool(c).slice(0,8):(c.lines||[]).slice(0,6);
      const recent=Player.fcSendRecentText({cid,c});
      const r=await Core.aiJSON(Story.fcSendPrompt({c,pool,lv,files,recent,text,f,opt}),null,'default',opt.img?await System.chatImgB64(opt.img):undefined);
      tyOff(); const pn=playerName(), reps=(r&&Array.isArray(r.replies)?r.replies:r&&r.reply?[r.reply]:[]).map(x=>String(x||'').trim()).map(x=>x.replace(new RegExp('^'+c.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*[:：]\\s*'),'')).filter(x=>x&&!new RegExp('^(나|'+pn.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'|'+System.T('player')+')\\s*[:：]').test(x)).slice(0,4);
      if(!reps.length){ if(r) CoreView.toast('답장을 받지 못했어요. 다시 보내 주세요'); return; }
      for(let i=0;i<reps.length;i++){
        if(i){ const off2=alive()?NewGameView.phTyping(c):()=>{}; await wait(Math.min(1600,400+reps[i].length*30)); off2(); }
        const m={w:'c',t:reps[i],at:Date.now()}; NewGame.fcLogAdd(f,m,!alive()); if(alive()) CoreView.phBubble(m,c);
      }
      const ptags=Messenger.fcPhotoOn()&&r&&typeof r.photo==='string'?r.photo.trim():''; if(ptags) NewGameCtl.fcNpcPhoto(c,f,ptags,alive);
      Messenger.fcAfterReply(c,o,f,r); if(f.log.length-(f.sumTo||0)>70) Core.fcSummarize(cid);
    }finally{ FCBUSY=false; tyOff(); }
  }

  static hashN(s){ let h=0; for(const ch of String(s)) h=(h*31+ch.charCodeAt(0))|0; return Math.abs(h); }

  static cardCost(cd){ const df=CARD_DEF[cd.k]||CARD_DEF.strike; let c=cd.up&&df.cu!=null?df.cu:df.c; if(CB&&!CB.over){ if(CB.disc1) c--; if(CB.firstFree&&!CB.played) c--; } return Math.max(0,c); }

  static cardIllObj(cd){ const c=charById(cd.o); if(!c) return null; if(cd.k==='skill'&&c.scg&&Characters.imgSrc(c.scg)) return c.scg; return c.cards&&c.cards[cd.k]&&Characters.imgSrc(c.cards[cd.k])?c.cards[cd.k]:null; }

  static cbAliveE(){ return CB.enemies.filter(en=>en.hp>0); }

  static cbHealLead(v,pops){ const L=Challenge.cbLead(); L.hp=Math.min(L.maxhp,L.hp+v); pops.push(['cbLead','+'+nf(v),'heal']); }

  static towerReward(floor){ return floor%5===0?{gems:80,gold:3000+floor*300,core:2}:{gems:20,gold:1500+floor*150}; }

    /* 그릴 할 일의 저장 칸(Model — 쓰기): 목록(drawTodo)은 읽기라 아직 없는 칸(기술 컷인·장 지도)은 여기서 맞춰 넣음 */
static prepTarget(it){ return it.k==='scg'?Characters.scgSlot(it.c):it.k==='map'&&it.ch?Story.ensureChMap(it.ch):it.o; }

  static auditSnap(objs,label){ AUDIT_UNDO={label,at:Date.now(),items:objs.map(o=>({o,before:JSON.parse(JSON.stringify(o))}))}; }

  static async auditFixOne(rule,o){ const m=rule.fix.mode;
    if(m==='auto'){ await Misc.auditAutoRun(rule,o); LiveOps.auditMarkObj(o); return true; }
    if(m==='ai') return !!(await LiveOps.auditAIFill(o,rule.fix.fields));
    if(m==='ai-stage') return !!(await Story.auditAIStage(o));
    if(m==='ai-rules') return !!(await Rules.rulesAIFill());
    if(m==='ai-persona') return !!(await Characters.personaAI(o,rule.fix.k,{lines:rule.fix.k==='improve'}));
    if(m==='ai-afftalk') return !!(await Characters.talkAffGen(o));
    if(m==='ai-memo') return !!(await Characters.memorialGen(o));
    if(m==='ai-run') return !!(await rule.fix.run(o));
    if(m==='weapon'){ await Characters.fixWeaponPrompts([o]); LiveOps.auditMarkObj(o); return true; }
    if(m==='skills'){ v2Ensure(o); await v2ReadyChars([o]); LiveOps.auditMarkObj(o); return true; }
    if(m==='skills-remaster'&&await Characters.balRemasterAI(o)){ LiveOps.auditMarkObj(o); return true; }
    return false; }

  static puxNames(){ const cs=(PUX?PUX.ids:[]).map(charById).filter(Boolean); return !cs.length?'':cs.length===1?`${cs[0].name} 픽업`:`${cs[0].name} 외 ${cs.length-1}명 픽업`; }

  static scgOf(c){ if(!c) return null; return c.scg&&typeof c.scg==='object'?c.scg:Characters.scgNew(c); } // 읽기 — 고칠 때는 scgSlot

  static swStyleId(){ Acquire.setMyStyle(SW.cst.tags,SW.cst.neg); return 'my_style'; }

  static swAddAI(){ const p=Art.swProfile(); if(!Core.apValid(p)) return false; const A=System.AIP(); if(A.list.some(x=>(x.key&&x.key===p.key)||(x.sa&&x.sa===p.sa&&x.model===p.model))) return true; A.list.push(p); if(!A.list.some(x=>x.id===A.active)) A.active=p.id; System.saveAIP(A); SW.hasAI=true; return true; }

  static swSave(){
    Core.swAddAI();
    { let sv={}; try{sv=JSON.parse(appStorage.getItem(NKEY))||{};}catch(e){} sv.provider=SW.img; sv.comfy=Object.assign({},Art.comfyCfg(),SW.cf); appStorage.setItem(NKEY,JSON.stringify(sv)); }
    if(SW.nai){ let sv={}; try{sv=JSON.parse(appStorage.getItem(NKEY))||{};}catch(e){} sv.key=SW.nai; appStorage.setItem(NKEY,JSON.stringify(sv)); }
    if(SW.cst) Core.swStyleId(); if(SW.autoArt){ const sv=Acquire.naiSaved(); sv.autoArt=SW.autoArt; appStorage.setItem(NKEY,JSON.stringify(sv)); }
    if(SW.fish||SW.el){ const o=Core.SND(); if(SW.fish) o.fishKey=SW.fish; if(SW.el) o.elKey=SW.el; appStorage.setItem(SKEY,JSON.stringify(o)); }
  }

  static trigDesc(t){const g=t.trigger||{type:'start'};return g.type==='start'?'계약 직후':g.type==='aff'?`호감도 Lv.${g.value}`:`${Story.stageCode(g.value)} 클리어 후`;}

  static factionBonus(ids){const cnt={};ids.map(charById).filter(Boolean).forEach(c=>{if(c.faction)cnt[c.faction]=(cnt[c.faction]||0)+1;});const out={};Object.entries(cnt).forEach(([f,n])=>{if(n>=2)out[f]=n>=4?15:n>=3?10:5;});return out;}

  static teamPower(ids){const fb=Core.factionBonus(ids);return ids.map(charById).filter(Boolean).reduce((a,c)=>a+Math.round(charPower(c)*(1+(fb[c.faction]||0)/100)),0);}

  static charImgList(c){return Characters.charImgItems(c).filter(x=>x.o?.id&&Art.imgSrcRaw(x.o)).map(x=>[x.o,x.label,x.group]);}

  static async saveImgUrl(u,base){ try{ const b=await (await fetch(u)).blob(); await SystemCtl.saveImgBlob(b,base); }catch(e){ CoreView.toast('그림을 저장하지 못했어요'); } }

  static posOf(c){ return Rules.posById(c&&c.pos)||Rules.POSITIONS().find(p=>p.base===(c&&c.role))||Rules.POSITIONS()[0]; }

  static buildStages(arr,o){ const list=(Array.isArray(arr)?arr:[]).slice(0,o.max), n=list.length;
    return list.map((s,i)=>{ s=s||{}; const md=i<n-1||Battle.storyCfg().finale!=='battle'?NewGame.modeClean(s):null; /* 전투 중심이면 마지막(보스) 스테이지는 전투 */ const story=!md&&s.battle===false&&i<n-1;
      const st={id:uid(),title:String(s.title||(story?'이야기':o.title||'작전')),reward:o.reward(i),pre:nl(s.pre),post:story?'':nl(s.post),beats:strs(s.beats).slice(0,14).map(x=>x.slice(0,300)),
        enemies:story?[]:(Array.isArray(s.enemies)?s.enemies:[]).slice(0,5).map(e=>({name:String(e.name||'적'),elem:ELEMS.includes(e.elem)?e.elem:o.elem,hp:num(e.hp,100,99999,o.hp),atk:num(e.atk,10,999,o.atk),def:num(e.def,0,500,o.def),spd:num(e.spd,50,160,95),boss:!!e.boss}))};
      if(md){ Object.assign(st,md); st.enemies=[]; if(!st.beats.length) delete st.beats; return st; } // 회담·콘테스트(0488)
      if(story){ st.story=true; if(s.post) st.pre=[st.pre,nl(s.post)].filter(Boolean).join('\n'); }
      else if(!st.enemies.length) st.enemies=[{name:o.foe||'적',elem:o.elem,hp:o.hp,atk:o.atk,def:o.def,spd:95,boss:false}];
      if(!st.beats.length) delete st.beats; if(!story){ const f=NewGame.ruleClean(FIELDS,s.field); Story.stageAutoRules(st,i,n); if(f) st.field=f; const rt=NewGame.routeClean(s.route); if(rt) st.route=rt; } return st; }); } // 전장 규칙: AI가 고른 것 우선, 없으면 자동(0485)

  static planActOf(n){ return Story.PLAN().acts.find(a=>n<=(+a.upto||999))||Story.PLAN().acts.at(-1)||null; }

  static drLoad(){ let d=null; try{ d=JSON.parse(appStorage.getItem(DR2KEY)||'null'); }catch(e){} d=d&&typeof d==='object'?d:{};
    return Object.assign({mode:'',auto:'',kw:'',tone:'',theme:'auto',n:8,style:'',fan:false,src:'',story:'',stages:0,len:'normal',world:'',setting:'',chars:[],hero:{name:'',gender:'',look:'',hide:false}},d,{hero:Object.assign({name:'',call:'',gender:'',look:'',bio:'',hide:false},d.hero||{}),chars:Array.isArray(d.chars)?d.chars:[]}); }

  static drSave(){ try{ appStorage.setItem(DR2KEY,JSON.stringify(DR2)); }catch(e){} }

  static drSnap(label){ const d=DR2; d.undo={label,kw:d.kw,tone:d.tone,world:d.world,setting:d.setting,story:d.story,chars:JSON.parse(JSON.stringify(d.chars)),hero:JSON.parse(JSON.stringify(Object.assign({},d.hero,{av:undefined})))}; }

  static drPolish(k,rep){ CoreView.drRead(); if(k==='hero') return Characters.drPolishHero(rep); return DraftPolishGen.run({k,rep}); }

  static drFillChar(i,rep){ CoreView.drRead(); return DraftCharGen.run({i,rep}); }

  static cxFromChapter(r,ch){ if(!r||!Array.isArray(r.codex)) return; const last=ch.stages[ch.stages.length-1];
    r.codex.slice(0,3).forEach(x=>{ if(!x||!x.title||!x.body) return; World.cxPut({id:'cx'+uid(),cat:CX_LABEL[x.cat]&&x.cat!=='all'?x.cat:'term',title:String(x.title).slice(0,40),body:String(x.body),unlock:last?{type:'clear',value:last.id}:{type:'start'},src:'ai',at:Date.now()}); }); Core.mark('world'); }

  static relName(ref,ui){ if(ref===REL_ME) return ui?'나 ('+System.T('player')+')':System.T('player')+'(플레이어)'; if(ref.startsWith('x:')) return ref.slice(2); const o=Characters.relObj(ref); return o?o.name:'(지워진 인물)'; }

  static relPair(a,b){ return World.RELS().find(r=>(r.a===a&&r.b===b)||(r.a===b&&r.b===a)); }

  static relOf(ref){ return World.RELS().filter(r=>r.a===ref||r.b===ref); }

  static relOther(r,ref){ return r.a===ref?r.b:r.a; }

  static loreMap(a,b,lore){ if(!lore) return [a,b]; if(lore==='if') return null; const al=charById(lore), base=al?baseChar(al).id:''; if(a===base) a=lore; if(b===base) b=lore; return (a===lore||b===lore)&&a!==b?[a,b]:null; }

    // 장별 요약(스토리 기억)
  /* 시스템이 맡는 기록: 대본·설정을 읽어 관계와 요약을 채워요(AI 호출 없이) */
static stageCast(s,withMe){ const set=new Set(); System.parseScript((s.pre||'')+'\n'+(s.post||'')).forEach(L=>{ if(L.type!=='say'||isMe(L.who)) return; const r=NewGame.relRef(L.who); if(r&&!r.startsWith('x:')) set.add(r); }); if(withMe&&set.size) set.add(REL_ME); return set; }

  static relNew(a,b,kind,note,src,quiet,stage){ if(!a||!b||a===b||Core.relPair(a,b)) return 0; World.relPut(Core.relNames({id:'r'+uid(),a,b,kind,note:(src&&note?src+': ':'')+note,hist:[],sys:true,at:Date.now(),stage:stage||''})); if(!quiet) Core.mark('meta'); return 1; }

    // 관계에 두 사람 이름도 적어 둬요: 나중에 id가 바뀌어도(리롤·가져오기) 이름으로 다시 이어 붙일 수 있게
static relNames(r){ [['a','an'],['b','bn']].forEach(([k,n])=>{ const o=Characters.relObj(r[k]); if(o) r[n]=o.name; }); return r; }

  static relSeedAI(rep){ return RelSeedGen.run({rep}); }

    // 그림 받기: 내용 해시가 같은 그림은 다시 받지 않아요
static async subPullImages(base,game,ns,had,st,prefix){
   const imap=game.images||{},objs=Core.imgObjsOf(game);let n=0,lastHash=null,lastBytes=null;const tot=objs.filter(x=>imap[x.id]).length;
   for(const x of objs){const h=imap[x.id];if(!h){x.img=null;continue;}n++;if(had?.[x.id]===h&&await Core.idbGet(ns+x.id)){x.img={idb:true};continue;}
    st&&st(`그림 받는 중 ${n}/${tot}`);const bytes=lastHash===h?lastBytes:await System.subGet(base,'b/'+h,true);if(!bytes?.length)throw Error('그림 자료가 비어 있습니다: '+x.id);lastHash=h;lastBytes=bytes;
    const blob=new Blob([bytes],{type:bytes[0]===0x89?'image/png':bytes[0]===0xFF?'image/jpeg':'image/webp'});
    if(prefix)await appStorage.stage(prefix+x.id,{key:x.id,blob});else await NewGame.idbPut(ns+x.id,blob);x.img={idb:true};
   }return imap;
  }

  static verCmp(a,b){a=String(a||'').split(/\D+/).map(Number);b=String(b||'').split(/\D+/).map(Number);for(let i=0;i<Math.max(a.length,b.length);i++){const x=a[i]||0,y=b[i]||0;if(x!==y)return x<y?-1:1;}return 0;}

  static updRepo(o){return String((o&&o.repo)||RELEASE_REPO).trim();}

  static LV(){try{return JSON.parse(appStorage.getItem(LVKEY))||{};}catch(e){return {};}}

  static async directStage(s){ let ok=false; for(const k of ['pre','post']){ if(!s[k]) continue; const o=await System.directScript(s[k]); if(o){ s[k]=o; ok=true; } } if(ok){ s.dirV=1; LiveOps.auditMarkObj(s); } return ok; }

  static stageBg(s){const L=System.parseScript(s.pre).find(l=>(l.type==='cmd'&&l.cmd==='배경')||l.type==='place');return L?(L.arg||L.text):'';}

  static cutFace(c){ const fs=Characters.facePool(c); if(!fs.length) return ''; const f=CUT_FACES.map(n=>fs.find(x=>x.name===n)).find(Boolean)||fs[0]; return f.name; }

  static bCheck(){
   if(!B||B.over||B.presentationBusy||B.ending)return;
   if(B.engine?.impactJobs.length&&!B.engine.winner)return;
   const win=!alive(B.enemies).length,lose=!alive(B.allies).length;if(!win&&!lose)return;
   const battle=B,delay=Math.max(0,(battle.impactUntil||0)-Date.now());
   if(delay){battle.ending=true;battle.finishTimer=setTimeout(()=>{if(B!==battle||battle.over)return;battle.ending=false;CoreCtl.bEnd(win);},delay);}
   else CoreCtl.bEnd(win);
  }

  static goalText(r){ const d=r&&GOALS[r.k]; return d?d.d(r.a):'71초 안에 승리'; }

  static charRange(c){ if(!c) return 'melee'; if(RANGE[c.range]) return c.range; const p=Rules.POSITIONS().find(x=>x.id===c.pos); if(p&&RANGE[p.range]) return p.range; return GGMCombat.rangeOf({role:c.role,c,name:c.name}); }

  static formHelp(){ return Rules.formOn()?'전열(1·2)은 근접 공격을 막아 후열(3·4)을 지켜요. 근접은 전열, 원거리·지원은 후열이 좋아요. 후열을 노린 공격은 전열 방어형이 30% 확률로 엄호해요. 후열 지원형은 회복 +20%.':''; }

    // 전투 중 "후퇴": 출격 지점 전투면 출격 퇴각(지금까지 얻은 골드·경험치는 이미 받음). 예전엔 전투만 닫혀 출격이 남아 같은 지점을 행동력 없이 다시 도전할 수 있었음
static async quitConfirm(){ const so=!!B.ctx.sortie; if(!(await appConfirm(so?'퇴각하면 이번 출격이 끝나요. 지금까지 얻은 골드·경험치는 받아요.':'후퇴할까요? 보상은 받을 수 없어요.'))) return false; if(so) Battle.sortieEnd(); return true; }

  static bossPatText(e,raid){ return Challenge.bossPats(e,raid).map(k=>BPATS[k][0]).join(' · ')+' · 체력 40% 이하 광폭화 (15초 / 재사용 30초)'; }

  static farmReward(key,lv){ const m=Expedition.seasonIs('train')?2:1, i=Math.max(0,Math.min(FARM_N-1,lv-1)); return key==='exp'?{exp:FARM_RW.exp[i]*m}:key==='gold'?{gold:FARM_RW.gold[i]*m}:key==='wmat'?{wmat:FARM_RW.wmat[i]*m}:{core:FARM_RW.core[i]*m}; }
}

class CoreView {
  static toast(m){document.querySelectorAll('.toast').forEach(t=>t.remove());const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2600);}

    /* 버튼 처리 중 표시(View): 잠그고 글자를 주면 바꿈 — 돌려준 함수로 되돌림(버튼이 화면에 남아 있을 때만). 액션 처리기(Controller)가 처리 앞뒤로 부름 */
static busy(t,label){ const lb=t.textContent; t.disabled=true; if(label!=null) t.textContent=label; return ()=>{ if(t.isConnected){ t.disabled=false; if(label!=null) t.textContent=lb; } }; }

    /* 고르기 칩 켜짐 표시(View) · 켜짐/꺼짐 스위치 뒤집기(aria-checked — 새 값을 돌려줌) */
static chipOn(el,on){ el.classList.toggle('on',!!on); }

    /* 진행 알림(View가 만들어 작업(Model)에 넘김 — 작업은 단추·칸 요소를 직접 만지지 않음, CLAUDE.md §0-2): 만들 때 단추를 잠그고, rep(글)로 진행 글(to 칸, 없으면 단추 글자),
     rep.lock()으로 다시 잠금, rep.end()로 단추를 되돌림(단추 글자를 바꿨으면 원래 글자로). 단추가 없으면 null — 작업은 rep&&rep(…) */
static uiProg(el,to){ if(!el) return null; const lb=el.textContent, rep=m=>{ CoreView.say(to||el,m); }; rep.lock=()=>{ el.disabled=true; }; rep.end=()=>{ if(el.isConnected){ el.disabled=false; if(!to) el.textContent=lb; } }; rep.lock(); return rep; }

    /* 화면 한 칸에 글 표시(View — 선택자나 요소, 있을 때만) */
static say(el,msg){ const x=typeof el==='string'?$(el):el; if(x) x.textContent=msg; return x; }

  static ripple(x,y,big){const r=document.createElement('div');r.className='ripple'+(big?' big':'');r.style.left=x+'px';r.style.top=y+'px';r.innerHTML='<i></i><i></i><i></i>';document.body.appendChild(r);setTimeout(()=>r.remove(),1000);}

  static faceSwap(c,el,name,ms){ const im=el&&(el.tagName==='IMG'?el:el.querySelector('img.art')); if(!im||!name) return; const f=Characters.facePool(c).find(x=>x.name===name); if(!f) return; const up=im.classList.contains('upimg'), src=up?(f.up&&Characters.imgSrc(f.up)):Characters.imgSrc(f); if(!src) return; /* 상반신 그림에는 상반신판 표정만 */ if(!im._orig) im._orig=im.src; im.src=src; clearTimeout(im._ft); im._ft=setTimeout(()=>{ if(im.isConnected){ im.src=im._orig; im._orig=null; } },ms||2600); }

  static charReact(el,lv,zone){ if(!el) return; const k=zone==='body'?(lv>=6?'shy':'flinch'):lv>=7?'hop':lv>=4?'nod':'flinch'; ['r-hop','r-nod','r-flinch','r-shy'].forEach(c=>el.classList.remove(c)); void el.offsetWidth; el.classList.add('r-'+k); clearTimeout(el._rt); el._rt=setTimeout(()=>el.classList.remove('r-'+k),950); }

  static async copilotLogin(btn){ const box=$('#cpBox'); if(!box) return; btn.disabled=true;
    try{ const r=await System.http('https://github.com/login/device/code',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:{client_id:COPILOT_CID,scope:'read:user'},timeout:30000}); const j=Characters.okJSON(r);
      if(!j.device_code) throw {message:'로그인 코드를 받지 못했어요'};
      box.innerHTML=`<p style="margin:6px 0">아래 코드를 복사하고 GitHub 페이지에서 입력해 주세요. 입력하면 여기서 자동으로 이어져요.</p><div class="row"><b style="font-size:1.4rem;letter-spacing:.12em">${esc(j.user_code)}</b><button class="btn sm ghost" data-act="copy" data-text="${esc(j.user_code)}">복사</button><button class="btn sm" data-act="sylink" data-url="${esc(j.verification_uri||'https://github.com/login/device')}">GitHub 열기</button></div><p class="muted" id="cpWait" style="margin:6px 0 0;font-size:.8rem">기다리는 중…</p>`;
      let iv=Math.max(5,+j.interval||5); const until=Date.now()+(+j.expires_in||900)*1000;
      while(Date.now()<until&&$('#cpBox')){ await wait(iv*1000);
        const r2=await System.http('https://github.com/login/oauth/access_token',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:{client_id:COPILOT_CID,device_code:j.device_code,grant_type:'urn:ietf:params:oauth:grant-type:device_code'},timeout:30000});
        let k={}; try{ k=JSON.parse(r2.text||'{}'); }catch(e){}
        if(k.access_token){ APD.gh=k.access_token; try{ await Core.copilotTok(APD); }catch(e){ box.innerHTML=`<p style="color:var(--rose)">${esc(e.message||'Copilot을 쓸 수 없는 계정이에요')}</p>`; return; } box.innerHTML='<p style="margin:6px 0">✓ GitHub에 로그인했어요. 모델을 고르고 저장해 주세요.</p>'; const w=$('#cpState'); if(w) w.textContent='로그인됨'; return; }
        if(k.error==='slow_down') iv+=5; else if(k.error&&k.error!=='authorization_pending'){ box.innerHTML=`<p style="color:var(--rose)">로그인에 실패했어요 (${esc(k.error)}). 다시 눌러 주세요.</p>`; return; } }
    }catch(e){ box.innerHTML=`<p style="color:var(--rose)">${esc(e.message||'GitHub에 연결하지 못했어요')}${IS_NATIVE?'':' · 웹 버전에서는 중계 서버가 필요해요'}</p>`; }
    finally{ if(btn.isConnected) btn.disabled=false; } }

  static naiBlocksSave(o,key,field){const p=CharactersView.naiBlocksFieldParts(field);if(!p)return;const e=typeof field==='string'?document.getElementById(field):field,original=o.naiBlocks?.[key]?.original??e?.dataset.naiOriginal??String(o[key]||'');
   o[key]=p.combined;o.naiBlocks={...o.naiBlocks,[key]:{...p,original}};
  }

  static naiBlocksSeed(field,parts){const e=typeof field==='string'?document.getElementById(field):field;if(!e)return;
   const p={...parts,...Core.naiBlocksUpgrade(parts),combined:parts.combined??LiveOps.naiBlocksJoin(parts)};e.dataset.naiBlocks=JSON.stringify(p);e.value=p.combined;
  }

  static naiBlocksMount(e){
   if(e._naiBlocksUI||!MiscView.naiBlocksEditable(e))return;
   if(e.dataset.candidateField==='prompt'&&typeof IMAGE_CANDIDATES!=='undefined'&&IMAGE_CANDIDATES?.config?.promptParts){e.dataset.naiBlocks=JSON.stringify(IMAGE_CANDIDATES.config.promptParts);} /* 후보 그림 프롬프트 칸은 후보 설정의 블록으로 시작 */
   const key=e.id||'nai-block-'+(++CoreView.naiBlocksMount.serial),origin=e.value,owner=CharactersView.naiBlocksOwner(e);
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
   const paint=()=>{raw.textContent=e.value;const p=CharactersView.naiBlocksFieldParts(e);for(const k of NAI_BLOCK_KEYS)fields[k].value=p[k]||'';};
   Object.defineProperty(e,'value',{configurable:true,get(){return native.get.call(this);},set(v){native.set.call(this,v);paint();}});
   wrap.addEventListener('input',event=>{if(!event.target.dataset.naiPart)return;const p=Object.fromEntries(NAI_BLOCK_KEYS.map(k=>[k,fields[k].value]));p.combined=LiveOps.naiBlocksJoin(p);e.dataset.naiBlocks=JSON.stringify(p);native.set.call(e,p.combined);raw.textContent=p.combined;});
   e._naiBlocksUI=wrap;paint();
  }

  static apForm(d){
    const dm=DEFM[System.defKey(d)]||['',''], sg=MODEL_SUGG[System.defKey(d)]||[];
    const f=(id,label,val,ph,type='text',list)=>`<label class="f" for="${id}">${label}</label><input class="in" id="${id}" type="${type}" autocomplete="off" value="${esc(val||'')}" placeholder="${esc(ph||'')}" ${list?`list="${list}"`:''}>`;
    let fields='',help='';
    if(d.type==='anthropic'){ fields=f('ap_key','API 키',d.key,'sk-ant-...','password'); help='console.anthropic.com → API Keys에서 만들어요.'; }
    if(d.type==='gemini'){ fields=f('ap_key','API 키',d.key,'AIza...','password'); help='aistudio.google.com → Get API key에서 만들어요. 무료 사용량이 있어요.'; }
    if(d.type==='openai'){ fields=`<div class="chips ap-pre">${OAI_PRESETS.map((x,i)=>`<button class="chip" data-act="appre" data-i="${i}">${esc(x[0])}</button>`).join('')}</div>`+f('ap_base','API 주소',d.base,'https://openrouter.ai/api/v1')+f('ap_key','API 키',d.key,'','password'); help=(OAI_PRESETS.find(x=>Misc.normBase(x[1])===Misc.normBase(d.base))||[])[3]||'OpenRouter, DeepSeek, Ollama, LM Studio 등 OpenAI 방식 API예요. 위 버튼으로 주소를 채울 수 있어요. 주소는 /chat/completions 앞부분까지, 모델 이름은 그 서비스에 나온 이름을 그대로 써요.'; }
    if(d.type==='copilot'){ fields=`<div class="optbox" style="margin-top:8px"><div class="row"><b style="flex:1">GitHub 계정 · <span id="cpState">${d.gh?'로그인됨':'로그인 안 됨'}</span></b><button class="btn sm" data-act="cplogin">${d.gh?'다시 로그인':'GitHub로 로그인'}</button></div><div id="cpBox"></div></div>`; help='GitHub Copilot 구독(무료 플랜 포함)이 있는 계정으로 로그인하면 Copilot에 들어 있는 모델(GPT·Claude·Gemini)을 써요. 공식 API가 아닌 비공식 연결 방식이라 GitHub 정책에 따라 막히거나 계정에 제한이 생길 수 있어요. 무료 플랜은 사용량이 적어요. 웹 버전에서는 중계 서버가 필요해요.'; }
    if(d.type==='vertex'){
      fields=`<label class="f" for="ap_pub">모델 종류</label><select class="in" id="ap_pub">${CoreView.opt([['google','Gemini'],['anthropic','Claude (Model Garden)']],d.pub||'google')}</select>
        <label class="f" for="ap_sa">서비스 계정 키 (JSON 파일 내용 전체)</label><textarea class="in" id="ap_sa" placeholder='{"type": "service_account", "project_id": ...}'>${esc(d.sa||'')}</textarea>
        <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-act="saload">JSON 파일 불러오기</button></div>
        <div class="g2"><div>${f('ap_region','리전',d.region,'global')}</div><div>${f('ap_project','프로젝트 ID (비우면 JSON에서)',d.project,'')}</div></div>
        ${(d.pub||'google')==='google'?f('ap_vkey','또는 익스프레스 API 키 (Gemini 전용, 서비스 계정 대신)',d.vkey,'','password'):''}`;
      help=(d.pub==='anthropic')?'Google Cloud 콘솔 → IAM 및 관리자 → 서비스 계정 → 키 추가 → JSON. 계정에 Vertex AI 사용자 역할이 필요해요. Model Garden에서 Claude 모델을 먼저 사용 설정하고, 모델 이름은 Model Garden에 나온 ID를 그대로 써요.'
        :'Google Cloud 콘솔 → IAM 및 관리자 → 서비스 계정 → 키 추가 → JSON. 계정에 Vertex AI 사용자 역할이 필요해요. 익스프레스 모드 API 키가 있으면 서비스 계정 없이 그것만 넣어도 돼요.';
    }
    return `<label class="f" for="ap_type">종류</label><select class="in" id="ap_type">${CoreView.opt(Object.entries(AITYPE),d.type)}</select>
      ${f('ap_name','이름 (구분용)',d.name,'예: 버텍스 제미니')}
      ${fields}
      <datalist id="ap_ml">${sg.map(m=>`<option value="${esc(m)}">`).join('')}</datalist>
      <div class="g2"><div>${f('ap_model','기본 모델 (직접 입력 가능)',d.model,dm[0]||'모델 ID','text','ap_ml')}</div><div>${f('ap_quick','빠른 모델 (짧은 작업용)',d.quick,dm[1]||'비우면 기본 모델','text','ap_ml')}</div></div>
      <p class="muted" style="margin-top:8px">${help} 모델 칸을 누르면 추천 목록이 나오고, 다른 모델 ID도 직접 쓸 수 있어요. 비우면 흐린 글씨의 기본값을 써요.</p>`;
  }

  static readAp(){
    const v=id=>{const el=$('#'+id);return el?el.value.trim():undefined;};
    const d=APD;
    [['name','ap_name'],['key','ap_key'],['base','ap_base'],['pub','ap_pub'],['sa','ap_sa'],['region','ap_region'],['project','ap_project'],['vkey','ap_vkey'],['model','ap_model'],['quick','ap_quick']].forEach(([k,id])=>{const x=v(id);if(x!==undefined)d[k]=x;});
    if(d.base) d.base=Misc.normBase(d.base);
    if(!d.name) d.name=AITYPE[d.type];
    return d;
  }

  static async openNaiGen(kind,id,custom){
    const o=Core.naiTarget(kind,id); if(!o) return;
    const c=Core.naiCfg(), k=kind==='char'?'char':kind==='weapon'?'prop':o.kind, job={kind,id,custom,originalSrc:Art.imgSrcRaw(o)||''}; NAIJOB=job;
    CoreView.openModal(MiscView.naiDrawingHTML(o,k));
    try{
      const op={originalSrc:job.originalSrc,promptParts:custom.promptParts,candidateEligible:custom.candidateEligible===true||Characters.imageCandidateEligible(kind==='lib'?o.kind:kind,o,charById(id)),neg:custom.neg,seed:custom.seed,model:custom.model,size:custom.size,chars:custom.chars,onRetry:(a,n,why)=>{if(NAIJOB===job)CoreView.say('#nai_stat',`${why} · 다시 시도 ${a}/${n-1}…`);}};
      if(custom.ref){
        const rf={type:custom.ref.type,strength:custom.ref.strength,fidelity:custom.ref.fidelity};
        if(k==='char'&&Characters.imgSrc(o)) op.refs=[Object.assign({image:await Characters.refImage(Characters.imgSrc(o))},rf)];
        if(ILK(k)){ const ow=charById(id); if(ow&&Characters.imgSrc(ow)) op.refs=[Object.assign({image:await Characters.refImage(Characters.imgSrc(ow))},rf)]; }
        if(k==='cg'){ op.refs=[]; for(const x of Core.cgCast(o)) if(Characters.imgSrc(x.c)) op.refs.push(Object.assign({image:await Characters.refImage(Characters.imgSrc(x.c))},rf)); }
      }
      if(custom.i2i&&Characters.imgSrc(o)){ const [w,h]=custom.size||System.naiSize(k,c); op.img2img={image:await Core.imgB64(Characters.imgSrc(o),w,h,'#ffffff'),strength:custom.i2i.strength,noise:custom.i2i.noise}; op.noCut=false; }
      const scenePrep=['illust','lbcg'].includes(kind)&&!custom.sceneReady?World.illustrationScenePreparation(charById(id),kind,custom):null;
      if(scenePrep)op.prepareCandidates=scenePrep;
      const blob=await Core.naiGenerate(custom.input,k,op);
      scenePrep?.check();
      if(blob.__candidateConfig){custom.promptParts=blob.__candidateConfig.promptParts;custom.input=blob.__candidateConfig.prompt;custom.neg=blob.__candidateConfig.neg??custom.neg;custom.sceneTags=blob.__candidateConfig.sceneTags;custom.sceneReady=!!blob.__candidateConfig.sceneReady;}
      if(NAIJOB!==job) return;
      job.blob=blob; job.seed=op.usedSeed; NLASTSEED[id]=''; if(blob.__candidateRegistered){await CoreCtl.registerNaiJob();return;} const url=URL.createObjectURL(blob);
      CoreView.openModal(MiscView.naiResultHTML(o,op,k,url,job));
      NAIJOB=job;
    }catch(e){ if(NAIJOB!==job) return; if(e?.code==='image_cancelled'){window.navBack();return;} NAIJOB=null; CoreView.closeModal(); CoreView.toast(Core.naiErr(e)); }
  }

  static async regenRun(c,sel,reqs={},global='',slot='active'){
   if(System.playMode()||!c||charById(c.id)!==c)return;sel=Object.fromEntries(LiveOps.regenFields().map(([k])=>[k,!!sel[k]]));if(!Object.values(sel).some(Boolean)){CoreView.toast('바꿀 항목을 하나 이상 골라 주세요');return;}if(!SAMPLE){CoreView.toast('글 AI를 먼저 등록해 주세요');return;}
   Core.regenCancel();v2CancelEditorGeneration();v2CloseGearEditor();v2EnsureEquipment(c);slot=LiveOps.regenSlot(slot);
   const state={cid:c.id,target:c,project:Core.PJ().active,snapshot:Characters.regenSourceSnapshot(c),sel,reqs:clone(reqs||{}),global:String(global||''),slot,nc:clone(c),history:[],fallback:false};
   const job={...state,controller:new AbortController(),status:'선택한 항목과 캐릭터 설정 확인',history:[]};REGEN_JOB=job;
   CoreView.openModal(head('다시 만드는 중')+'<p id="regen-job-status" role="status" aria-live="polite"></p><details id="regen-job-log" hidden></details><button class="btn ghost" data-act="regencancel">작업 중단</button>',true);
   let dots=0;const tick=()=>{const el=document.getElementById('regen-job-status');if(REGEN_JOB===job&&el)el.textContent=job.status+'.'.repeat(dots++%3+1);};tick();job.timer=setInterval(tick,400);
   try{
    const nonSkill=Object.keys(sel).some(k=>k!=='skill'&&sel[k]);
    if(nonSkill){let last;for(let attempt=1;attempt<=3;attempt++){v2CheckCancelled(job.controller.signal);MiscView.regenProgress(job,{kind:'phase',text:`캐릭터 설정 응답 대기 · ${attempt}/3`});try{
      const context={character:{name:c.name,faction:c.faction,profile:c.profile,appearance:c.naiPrompt,weapon:{name:c.weapon?.name,description:c.weapon?.desc},lines:c.lines},selected:Object.keys(sel).filter(k=>k!=='skill'&&sel[k]),requests:reqs,concept:global};
      const response=await v2SkillRequest(SAMPLE,World.regenRunPrompt({context,last,c,sel}),job.controller.signal);
      state.nc=Art.regenParseCharacter(c,response,sel);last=null;break;
     }catch(e){v2CheckCancelled(job.controller.signal);last=v2FailureText(e);MiscView.regenProgress(job,{kind:'failure',text:`설정 생성 ${attempt}회 실패: ${last}`});if(['bad_key','no_ai','quota','low_credit','not_granted','payment_required','refused','insufficient_quota','model_not_found','sa_bad'].includes(e?.code)||attempt===3)throw e;}}
    }
    Characters.regenAssertCurrent(state);
    if(sel.skill){const concept=[global,reqs.skill].filter(Boolean).join('\n'),nc=state.nc;nc.skillConcept=concept||c.skillConcept||'';nc.generation=GGMCombat.generation(c);const base=clone(v2Ensure(c));
     const result=await v2GenerateSelected(nc,slot,concept,base,{signal:job.controller.signal,onEvent:e=>MiscView.regenProgress(job,e)});v2CheckCancelled(job.controller.signal);
     nc.skills={...base,[slot]:clone(result.kit[slot])};nc.skillPlan={...(c.skillPlan||{}),[slot]:v2SkillPlanText(result.plan)};state.report=clone(result.report);state.fallback=!!result.fallback;
    }
    v2CheckCancelled(job.controller.signal);Characters.regenAssertCurrent(state);if(REGEN_JOB!==job)return;state.history=clone(job.history);clearInterval(job.timer);REGEN_JOB=null;CoreView.closeModal();REGEN=state;CoreView.regenPreview();
   }catch(e){if(REGEN_JOB===job){job.status=e.name==='AbortError'?'작업을 중단했어요. 기존 캐릭터는 유지돼요.':v2FailureText(e);job.history.push({kind:'failure',text:job.status});const el=document.getElementById('regen-job-status');if(el)el.textContent=job.status;MiscView.regenProgress(job,{kind:'phase',text:job.status});const b=document.querySelector('[data-act=regencancel]');if(b)b.textContent='닫기';}}
   finally{clearInterval(job.timer);}
  }

  static regenPreview(){const R=REGEN,c=R&&charById(R.cid);if(!R||!c)return;const nc=R.nc,F=LiveOps.regenFields(R.slot),chg=F.filter(([k])=>R.sel[k]);
   const fld=(lab,inner)=>'<label class="f">'+esc(lab)+'</label>'+inner;
   if(R.edit){CoreView.openModal(head('결과 고치기')+
    (R.sel.name?fld('이름',`<input class="in" id="rg_e_name" value="${esc(nc.name)}">`)+fld('소속',`<input class="in" id="rg_e_faction" value="${esc(nc.faction||'')}">`):'')+
    (R.sel.profile?fld('프로필',`<textarea class="in" id="rg_e_profile">${esc(nc.profile)}</textarea>`):'')+
    (R.sel.look?fld('외모 태그',`<textarea class="in" id="rg_e_look">${esc(nc.naiPrompt)}</textarea>`):'')+
    (R.sel.skill?fld(GGMCombat.SLOTS[R.slot]+' 이름',`<input class="in" id="rg_e_skill" value="${esc(nc.skills[R.slot].name)}">`):'')+
    (R.sel.weapon?fld(System.T('weapon')+' 이름',`<input class="in" id="rg_e_wname" value="${esc(nc.weapon.name)}">`)+fld(System.T('weapon')+' 프롬프트',`<textarea class="in" id="rg_e_wprompt">${esc(nc.weapon.prompt)}</textarea>`):'')+
    '<div class="row"><button class="btn" data-act="regenapply">고친 대로 적용</button><button class="btn ghost" data-act="regenedit">결과로 돌아가기</button><button class="btn ghost" data-act="regencancel">취소</button></div>');return;}
   CoreView.openModal(head('다시 만든 결과','<span class="muted">적용 전까지 기존 캐릭터 유지</span>')+chg.map(([key,label,cur])=>`<div class="rg-cmp"><div class="rg-lab">${esc(label)}</div><div class="rg-a"><small>지금</small><div>${esc(String(cur(c)||'—').slice(0,1500))}</div></div><div class="rg-b"><small>새로</small><div>${esc(String(cur(nc)||'—').slice(0,1500))}</div></div></div>`).join('')+
    (R.sel.skill?`<p class="muted">${esc(GGMCombat.SLOTS[R.slot])} 하나만 바뀝니다. 다른 두 스킬과 강화·전문화 단계는 유지돼요.${R.fallback?' AI 응답 대신 검사한 복구 초안이에요. 내용을 확인해 주세요.':''}</p>`:'')+
    (R.sel.look?'<p class="muted">외모가 바뀌면 기본 캐릭터 그림과 표정은 다시 그려야 해요. 스킨과 스킬 아이콘은 보관됩니다. 관련 스토리 CG는 그림 준비실에 다시 그릴 그림으로 표시해요.</p>':'')+
    (R.sel.weapon?'<p class="muted">무기 그림은 다시 그려야 해요. 장비 강화와 고유 효과는 보존하며, 연계 스킬도 바뀌었다면 고유 효과를 다시 구성해야 해요.</p>':'')+
    (R.sel.profile||R.sel.lines?'<p class="muted">이미 작성한 이야기·관계는 유지하며 새 설정은 이후 생성에 반영해요.</p>':'')+
    (R.history.length?'<details>'+v2GenerationHistoryHTML(R.history)+'</details>':'')+
    '<p id="regen-apply-status" role="status" aria-live="polite"></p><div class="row"><button class="btn" data-act="regenapply">이대로 적용</button><button class="btn ghost" data-act="regenedit">✎ 고치기</button><button class="btn ghost" data-act="regenretry">다시 만들기</button><button class="btn ghost" data-act="regencancel">취소</button></div>');
  }

  static designRead(){ const fac={}; document.querySelectorAll('#modal [data-fac]').forEach(e=>{ const v=stripMinor(Core.stripAge(e.value.trim())); if(v) fac[e.dataset.fac]=v; }); return {all:stripMinor(Core.stripAge(($('#ds_all')||{}).value?$('#ds_all').value.trim():'')),fac}; }

  static openNaiPrep(kind,id){
    const o=Core.naiTarget(kind,id); if(!o) return;
    const c=Core.naiCfg(), k=kind==='char'?'char':kind==='weapon'?'prop':o.kind;
    if(!Core.imgReady()){CoreView.toast(Core.imgNeed());return;}
    const owner=ILK(k)?charById(id):null;
    const base=(k==='char'?Core.joinTags(o.naiPrompt,Characters.designTags(o)):ILK(k)?Core.joinTags(owner.naiPrompt,Characters.designTags(owner),o.prompt):o.prompt)||'';
    if(k==='cg'){ if(!String(o.prompt||'').trim()&&!Core.cgCast(o).length){CoreView.toast('장면 프롬프트나 등장 '+System.T('crew')+'을(를) 채워 주세요');return;} }
    else if(!String(base).trim()){CoreView.toast('먼저 NAI 프롬프트를 채워 주세요');return;}
    const styleId=Core.naiStyle(c,o.naiStyle).id;
    const pose=k==='char'?(o.naiPose||NAI_FRONT):ILK(k)?(o.naiPose!=null?o.naiPose:'looking at viewer'):'', frame=k==='char'?(o.naiFrame||'full body'):ILK(k)?(o.naiFrame||'cowboy shot'):'';
    const p=k==='cg'?NewGame.composeCG(o,{styleId}):PromptStudio.composeNai(k,base,{pose,styleId,frame});
    const [w,h]=System.naiSize(k,c), sz=w+'x'+h, hasImg=!!Characters.imgSrc(o);
    const canRef=(k==='char'&&hasImg)||(ILK(k)&&!!Characters.imgSrc(owner))||(k==='cg'&&Core.cgCast(o).some(x=>Characters.imgSrc(x.c)));
    NPREP={kind,id,k,base};
    const sizes=[...NAI_SIZES.map(x=>[x[0]+'x'+x[1],x[2]])]; if(!sizes.some(x=>x[0]===sz)) sizes.unshift([sz,sz]);
    CoreView.openModal(`${head('그리기 전 확인',`<span class="muted">${esc(o.name)}</span>`)}
      <input type="hidden" id="np_style" value="${esc(styleId)}"><div class="g2"><div><label class="f">그림체</label><p class="muted" style="margin:6px 0 0;font-size:.78rem;word-break:break-all">${esc(String(Core.naiStyle(c).tags||'').slice(0,80)||'태그 없음 (모델 기본)')}</p></div>
      <div><label class="f" for="np_model">모델</label><select class="in" id="np_model">${CoreView.opt([...NAI_MODELS,...(NAI_MODELS.some(m=>m[0]===c.model)?[]:[[c.model,c.model]])],c.model)}</select></div></div>
      <div class="g2"><div><label class="f" for="np_size">크기</label><select class="in" id="np_size">${CoreView.opt(sizes,sz)}</select></div>
      ${k==='char'||ILK(k)?`<div><label class="f" for="np_frame">구도</label><select class="in" id="np_frame">${CoreView.opt(NAI_FRAMES,frame)}</select></div>`:'<div></div>'}</div>
      ${k==='char'||ILK(k)?`<div class="g2"><div><label class="f" for="np_posesel">자세</label><select class="in" id="np_posesel">${c.poses.map(x=>`<option value="${esc(x.t)}" ${x.t===pose?'selected':''}>${esc(x.n)}</option>`).join('')}<option value="__custom" ${c.poses.some(x=>x.t===pose)?'':'selected'}>직접 입력</option></select></div><div><label class="f" for="np_pose">자세 태그</label><input class="in" id="np_pose" value="${esc(pose)}"></div></div>`:''}
      ${Art.imgProvider()==='comfy'?'<p class="muted" style="margin:8px 0 0">ComfyUI로 그려요. 모델·샘플러는 워크플로를 따르고, 레퍼런스와 img2img는 NovelAI 전용이라 쓰지 않아요.</p>':''}
      <label class="f" for="np_in">${k==='cg'?'장면 프롬프트 (전체)':'최종 프롬프트'} (직접 고쳐도 돼요)</label><textarea class="in" id="np_in" style="min-height:120px">${esc(p.input)}</textarea>
      ${k==='cg'&&p.chars.length?`<h3 class="sec">캐릭터별 프롬프트</h3>${p.chars.map((x,i)=>`<div class="cgrow"><div class="g2"><div><label class="f">${esc(x.name)}</label><select class="in" id="np_cp${i}">${CoreView.opt(CG_POS_LABEL,x.pos)}</select></div><div></div></div><textarea class="in" id="np_cc${i}" data-cid="${x.id}">${esc(x.prompt)}</textarea></div>`).join('')}<p class="muted" style="margin:4px 0 0">위치는 2명 이상일 때 적용돼요. 하나라도 자동이 아니면 좌표를 써요.</p>`:''}
      <label class="f" for="np_neg">네거티브</label><textarea class="in" id="np_neg">${esc(p.neg)}</textarea>
      ${canRef?`<div class="optbox"><label class="f"><input type="checkbox" id="np_ref" ${k!=='char'&&Art.autoRefOn(k)?'checked':''}> ${k==='cg'?'등장 '+System.T('crew')+' 스탠딩을 캐릭터 레퍼런스로':'지금 스탠딩을 캐릭터 레퍼런스로 (얼굴과 머리 유지)'}</label>
        <div class="g4"><div><label class="f" for="np_rtype">종류</label><select class="in" id="np_rtype">${CoreView.opt([['character','캐릭터'],['character&style','캐릭터+화풍'],['style','화풍만']],c.ref.type)}</select></div><div><label class="f" for="np_rstr">강도</label><select class="in" id="np_rstr">${CoreView.opt([[1,'1.0'],[0.8,'0.8'],[0.6,'0.6'],[0.4,'0.4']],c.ref.strength)}</select></div><div><label class="f" for="np_rfid">충실도</label><select class="in" id="np_rfid">${CoreView.opt([[1,'1.0'],[0.8,'0.8'],[0.6,'0.6'],[0.4,'0.4']],c.ref.fidelity)}</select></div><div></div></div>
        <p class="muted" style="margin:4px 0 0">캐릭터 레퍼런스는 V4.5에서만 돼서 이번 생성은 ${esc(isV45(c.refModel)?c.refModel:'nai-diffusion-4-5-full')}로 그려요. Anlas가 더 들 수 있어요.</p></div>`:''}
      ${hasImg?`<div class="optbox"><label class="f"><input type="checkbox" id="np_i2i"> 지금 이미지를 바탕으로 다시 그리기 (img2img)</label>
        <div class="g2"><div><label class="f" for="np_istr">변화량</label><select class="in" id="np_istr">${CoreView.opt([[0.4,'0.4 조금'],[0.55,'0.55'],[0.7,'0.7'],[0.85,'0.85'],[1,'1.0 많이']],0.55)}</select></div><div><label class="f" for="np_inoise">노이즈</label><select class="in" id="np_inoise">${CoreView.opt([[0,'0'],[0.1,'0.1'],[0.2,'0.2']],0)}</select></div></div></div>`:''}
      <div class="g2"><div><label class="f" for="np_seed">시드 (비우면 랜덤)</label><input class="in" id="np_seed" type="number" value="${esc(NLASTSEED[id]||'')}" placeholder="랜덤"></div><div></div></div>
      ${k==='char'||k==='cg'||ILK(k)?`<label class="f"><input type="checkbox" id="np_keep" checked> 다음에 이 이미지를 그릴 때도 화풍${k==='cg'?'·위치':'·자세·구도'} 유지</label>`:''}
      <p class="muted" style="margin:6px 0 0">가중치는 <code>1.3::태그::</code>(강하게), <code>0.7::태그::</code>(약하게), 작가 태그는 <code>artist:이름</code>으로 써요.</p>
      <div class="row" style="margin-top:12px"><button class="btn" data-act="naigo">그리기</button></div>`);
  }

  static reNaiPrep(){
    if(!NPREP) return; const o=Core.naiTarget(NPREP.kind,NPREP.id); if(!o) return;
    const st=$('#np_style').value;
    if(NPREP.k==='cg'){ const p=NewGame.composeCG(o,{styleId:st}); $('#np_in').value=p.input; $('#np_neg').value=p.neg; return; }
    const p=PromptStudio.composeNai(NPREP.k,NPREP.base,{pose:$('#np_pose')?$('#np_pose').value:'',styleId:st,frame:$('#np_frame')?$('#np_frame').value:''}); $('#np_in').value=p.input; $('#np_neg').value=p.neg;
  }

  static skinCard(c,k){
    const slot=(x,l,o)=>`<div class="sk-slot ${x==='illust'||x==='lbcg'?'wide':''}">${o&&Art.imgSrcRaw(o)?`<img src="${esc(Art.imgSrcRaw(o))}" alt="">`:'<span>없음</span>'}<b>${l}</b><div class="sk-acts"><button class="btn sm" data-act="skpartgen" data-id="${c.id}" data-s="${k.id}" data-x="${x}">그리기</button><button class="btn sm ghost" data-act="skpartup" data-id="${c.id}" data-s="${k.id}" data-x="${x}">올리기</button>${o&&o.img?XBTN('skinpart',c.id,` data-s="${k.id}" data-x="${x}"`,'✕'):''}</div></div>`;
    return `<div class="sk-card"><div class="sk-h"><b>${esc(k.name)}</b><span><button class="btn sm" data-act="skpartall" data-id="${c.id}" data-s="${k.id}">빈 칸 모두 그리기</button> <button class="btn sm ghost" data-act="skindel" data-id="${c.id}" data-s="${k.id}">삭제</button></span></div>
      <details><summary>의상 프롬프트 편집</summary><textarea class="in" id="skin_prompt_${k.id}" data-skin-prompt="${k.id}" data-owner="${c.id}">${esc(k.prompt||'')}</textarea><button class="btn sm" data-act="skinpromptsave" data-id="${c.id}" data-s="${k.id}">프롬프트 저장</button><p class="muted">저장한 내용은 이후 새로 그리는 그림에 적용돼요. 기존 그림은 유지돼요.</p></details><div class="sk-grid">${slot('stand','스탠딩',k)}${slot('upper','상반신',k.upper)}${slot('illust','일러스트',k.illust)}${slot('lbcg',System.T('limit')+' CG',k.lbcg)}</div>
      <label class="f" for="skscene_${k.id}">일러스트·${System.T('limit')} CG 장면 태그 (선택)</label><input class="in" id="skscene_${k.id}" value="${esc(k.scene||'')}" placeholder="예: beach, sunset, waves, smile">
      <div class="sk-extra"><b>표정</b> ${(k.faces||[]).filter(f=>Characters.imgSrc(f)).map(f=>`<span class="sk-face"><img src="${esc(Characters.imgSrc(f))}" alt=""><i>${esc(f.name)}</i></span>`).join('')||'<span class="muted">없음 · 없으면 이 '+esc(System.T('skin'))+' 스탠딩을 써요</span>'}<button class="btn sm ghost" data-act="faces-open" data-id="${c.id}" data-s="${k.id}">표정 만들기</button></div>
      <div class="sk-extra"><b>대사</b> <span class="muted">${(k.lines||[]).length?esc((k.lines||[]).slice(0,2).join(' / '))+((k.lines||[]).length>2?' …':''):'없음 · 없으면 기본 대사를 써요'}</span><button class="btn sm ghost" data-act="skinlines" data-id="${c.id}" data-s="${k.id}">${(k.lines||[]).length?'대사 다시 쓰기':'AI로 대사 쓰기'}</button></div>
      <div class="sk-extra"><b>목소리</b> <span class="muted">${k.voiceId?esc(k.voiceName||'지정됨'):'기본 목소리'}</span><button class="btn sm ghost" data-act="voice" data-id="${c.id}" data-s="${k.id}">${k.voiceId?'바꾸기':'이 '+esc(System.T('skin'))+' 목소리 고르기'}</button>${k.voiceId?`<button class="btn sm ghost" data-act="skvclear" data-id="${c.id}" data-s="${k.id}">기본으로</button>`:''}</div></div>`; }

  static artAfterAI(snap,label){
    if(!Core.imgReady()) return;
    const mode=Core.naiCfg().autoArt||'ask'; if(mode==='off') return;
    const fresh=Art.drawTodo().filter(x=>typeof snap==='function'?snap(x):!snap.has(Misc.artKey(x))); if(!fresh.length) return;
    const keys=new Set(fresh.map(Misc.artKey));
    if(mode==='auto'){ Acquire.artRun(keys); CoreView.toast(`새 그림 ${fresh.length}장을 뒤에서 그려요`); return; }
    let tries=0; const show=()=>{ if((!$('#modal').hidden||!$('#ov').hidden)&&tries++<200) return setTimeout(show,3000); if(!$('#modal').hidden) return;
      ART_ASK=keys; const cnt={}; fresh.forEach(x=>{const n=({upper:'상반신',char:'스탠딩',illust:'일러스트',bg:'배경',enemy:'적',icon:'아이콘',map:'지도',cg:'CG',prop:'소품',weapon:System.T('weapon')})[x.cat]||x.cat; cnt[n]=(cnt[n]||0)+1;});
      CoreView.openModal(`${head('새 그림을 그릴까요?',`<span class="muted">${esc(label||'AI가 새로 만든 것')}</span>`)}
        <p style="margin:0 0 8px">새로 생긴 그림 <b>${fresh.length}장</b> · ${Object.entries(cnt).map(([k,v])=>esc(k)+' '+v).join(', ')}</p>
        <p class="muted" style="margin:0 0 12px">게임을 하는 동안 뒤에서 한 장씩 그려요. 위쪽 진행 표시에서 언제든 멈출 수 있어요.</p>
        <div class="row"><button class="btn" data-act="artgo">그리기</button><button class="btn ghost" data-act="close">나중에</button></div>
        <button class="linkb" data-act="artalways" style="margin-top:10px">앞으로는 묻지 않고 자동으로 그리기</button>`); };
    setTimeout(show,600);
  }

  static castStat(){ const el=$('#castStat'); if(!CAST) return; if(!el){ const n=CAST.q.length+(CAST.busy?1:0); if(n) LiveOpsView.liveBar(`😊 표정 그리는 중… 남은 ${n}장${CAST.busy&&CAST.busy.k==='face'?' · '+((castById(CAST.busy.c)||{}).name||'')+' '+CAST.busy.name:''} · 그동안 플레이해도 돼요`); else if(CAST.wasIngame){ LiveOpsView.liveBar(null); CAST.wasIngame=false; CoreView.toast('표정을 모두 그렸어요'); } if(n) CAST.wasIngame=true; return; } const n=CAST.q.length+(CAST.busy?1:0); el.textContent=n?`그릴 그림 ${n}장 남음${CAST.busy&&CAST.busy.k==='face'?' · '+(castById(CAST.busy.c)||{}).name+' 표정 '+CAST.busy.name:''} · 한 장에 10~30초`:'모두 그렸어요. 마음에 들면 「이 모습으로 시작」'; }

  static async speak(c,text){
    Characters.stopVoice(); const tok=voiceTok;
    try{ const b=await System.ttsBlob(c,text); if(!b||tok!==voiceTok) return false;
      if(VOICE._u) URL.revokeObjectURL(VOICE._u); VOICE._u=URL.createObjectURL(b); VOICE.src=VOICE._u; VOICE.volume=Core.SND().voiceVol; await VOICE.play(); return true; }
    catch(e){ if(!voiceErr){voiceErr=true;setTimeout(()=>{voiceErr=false;},20000);CoreView.toast('음성 생성 실패. '+(AIERR[e&&e.code]||'')+' '+((e&&e.message)||''));} return false; }
  }

    /* 배경음 한꺼번에 만들기 창: 고르기 칩 모두/없는 것만(View) */
static bgmPickShow(v){ document.querySelectorAll('#modal [data-act="bgmpick"]').forEach(b=>{ const l=libById(b.dataset.id); CoreView.chipOn(b,v==='all'||(v==='miss'&&l&&!l.audio)); }); }

  static art(c,cls='',opt){
    if(c.useStanding===false){const src=Art.charSrc(c,opt?.face);return src?`<img class="art upimg ${cls}" src="${esc(src)}" alt="${esc(c.name)}" loading="lazy" draggable="false">`:`<div class="art ph ${cls}"><small>상반신 미등록</small></div>`;}
    if(opt&&opt.upper&&opt.face){ const fo=Characters.skinFaces(c).find(x=>x.name===opt.face), fu=fo&&fo.up&&Characters.imgSrc(fo.up); if(fu) return `<img class="art upimg ${cls}" src="${esc(fu)}" alt="${esc(c.name)}" loading="lazy" draggable="false">`; }
    if(opt&&opt.upper){ const sk=Characters.skinOf(c), hasFace=false, us=c.upper&&Characters.imgSrc(c.upper); // 상반신판 표정이 없으면 기본 상반신 그대로
      const sku=sk&&sk.upper&&Characters.imgSrc(sk.upper); if(sku&&!hasFace) return `<img class="art upimg ${cls}" src="${esc(sku)}" alt="${esc(c.name)}" loading="lazy" draggable="false">`;
      if(us&&!hasFace&&!(sk&&Characters.imgSrc(sk))) return `<img class="art upimg ${cls}" src="${esc(us)}" alt="${esc(c.name)}" loading="lazy" draggable="false">`; }
    const s=Art.charSrc(c,opt&&opt.face);
    if(s) return `<img class="art ${cls}" src="${esc(s)}" alt="${esc(c.name)}" loading="lazy" draggable="false">`;
    return `<div class="art ph ${cls}" style="--ec:${ECOL[c.elem]||'var(--rose)'}"><span>${esc((c.name||'?').slice(0,1))}</span><small>스탠딩 미등록</small></div>`;
  }

  static async stageBackup(file,prefix){
   const first=await file.slice(0,100).text();let header=null,count=0;
   if(/"format"\s*:\s*"(?:ggm-backup|ggm-share)"/.test(first)){
   let active=null,parts=[],size=0,ended=false;const found=new Set();for await(const r of Misc.backupLines(file)){if(ended)throw Error('완료 표시 뒤에 추가 데이터가 있습니다');if(!header){if(r.version!==2||!(r.format==='ggm-backup'&&BACKUP_TYPES[r.kind]||r.format==='ggm-share'&&r.kind==='share'))throw Error('지원하지 않는 파일 버전입니다');if(r.kind==='share'&&(!r.game||!Array.isArray(r.game.chars)||!Array.isArray(r.media?.images)||!Array.isArray(r.media?.audios)))throw Error('공유팩의 게임·자료 목록이 올바르지 않습니다');header=r;continue;}
   if(r.record==='media'){if(active||r.global&&!String(r.key).startsWith('v_')||typeof r.key!=='string')throw Error('자료 정보가 잘못되었습니다');if(found.has((r.global?'global:':'')+r.key))throw Error('중복된 자료 항목입니다');found.add((r.global?'global:':'')+r.key);if(r.global)header.hasGlobalMedia=true;active=r;parts=[];size=0;}
   else if(r.record==='chunk'){if(!active||typeof r.data!=='string'||r.data.length>400000)throw Error('자료 조각이 올바르지 않습니다');const data=System.b64ToBytes(r.data);parts.push(data);size+=data.length;}
   else if(r.record==='media-end'){if(!active||size!==active.size)throw Error('자료 파일 크기가 맞지 않습니다');const status=document.querySelector('#backup-busy-lock b');if(status)status.textContent=`자료 확인 ${count+1}개…`;await appStorage.stage(prefix+count++,{key:active.key,global:active.global,blob:new Blob(parts,{type:active.type})});active=null;parts=[];}
   else if(r.record==='end'){if(active||r.count!==count)throw Error('완료되지 않은 백업입니다');ended=true;}
   else throw Error('알 수 없는 백업 항목입니다');}
   if(!ended||!header)throw Error('백업이 끝까지 저장되지 않았습니다');if(header.kind!=='progress'){for(const x of header.media?.images||[])if(!found.has(x.id))throw Error('누락된 이미지가 있습니다');for(const x of header.media?.audios||[])if(!found.has('a_'+x.id))throw Error('누락된 음성이 있습니다');for(const k of header.media?.chat||[])if(!found.has(k))throw Error('누락된 대화 사진이 있습니다');}
   }else{
   const fields=Object.create(null),media={images:[],audios:[]},mediaKeys=new Set();let isShare=false,hasGlobalMedia=false;for await(const entry of Misc.legacyBackupEntries(file)){if(entry.group==='root'){fields[entry.key]=entry.value;if(entry.key==='kind'&&entry.value==='share')isShare=true;}else{if(typeof entry.value!=='string'||!entry.value.startsWith('data:'))throw Error('백업 자료 형식이 잘못되었습니다');if(entry.group==='voices')hasGlobalMedia=true;const blob=await System.legacyMediaBlob(entry.value),key=entry.group==='images'?entry.key:entry.group==='audios'?'a_'+entry.key:entry.key;const stored=(entry.group==='voices'?'global:':'')+key;if(mediaKeys.has(stored))throw Error('중복된 자료 저장 경로입니다');mediaKeys.add(stored);await appStorage.stage(prefix+count++,{key,global:entry.group==='voices',blob});if(entry.group==='images')media.images.push({id:entry.key,img:{idb:true}});if(entry.group==='audios')media.audios.push({id:entry.key,audio:{idb:true}});}}
   const game=fields.game||fields;header={kind:isShare?'share':fields.kind==='progress'?'progress':'full',game,identity:Art.backupIdentity(game),media,hasGlobalMedia};
   }
   return header;
  }

  static backupTransferStatus(message){const el=document.querySelector('#backup-busy-lock b');if(el)el.textContent=message;SystemView.syBar(message);}

  static openUpConfirm(c,k){ const u=Economy.upPlan(c,k); if(!u) return;
    const ok=u.ok&&u.cost.every(x=>x[2]>=x[1]);
    CoreView.openModal(`${head(esc(c.name)+' · '+esc(u.title))}
      <div class="upc"><div class="upc-ft"><span>${esc(u.from)}</span><b>→</b><span>${esc(u.to)}</span></div>
      ${u.cost.length?`<div class="upc-cost">${u.cost.map(([n,need,have])=>`<div class="${have<need?'lack':''}"><span>${esc(n)}</span><b>${nf(need)}</b><i>보유 ${nf(have)}${have<need?' · '+nf(need-have)+' 부족':''}</i></div>`).join('')}</div>`:''}
      ${u.note?`<p class="muted" style="margin:8px 0 0;font-size:.82rem">${esc(u.note)}</p>`:''}</div>
      <div class="row" style="margin-top:14px"><button class="btn" data-act="upgo" data-k="${k}" data-id="${c.id}" ${ok?'':'disabled'}>${ok?'확인':'재료가 부족해요'}</button><button class="btn ghost" data-act="char" data-id="${c.id}">취소</button></div>`); }

  static skinSelHTML(sel,c,k){const required=c?.useStanding===false&&(!k||!Art.imgSrcRaw(k.upper)); return `<div class="prepcats">${[['upper','상반신'],['illust','일러스트 (로비)'],['lbcg',System.T('limit')+' CG (개화)'],['faces','표정 기본 6종 (얼굴 범위를 칠해요)'],['lines','이 '+System.T('skin')+' 전용 대사 (글 AI)']].map(([k,l])=>`<label class="pc"><input type="checkbox" data-skp="${k}" ${sel[k]||k==='upper'&&required?'checked':''} ${k==='lines'&&!SAMPLE||k==='upper'&&required?'disabled':''}><b>${esc(l)}${k==='upper'&&required?' (현재 표시 방식에 필수)':''}</b></label>`).join('')}</div>`; }

  static notify(t,more){
    const c=threadChar(t); const first=System.parseScript(t.script).find(l=>l.type==='say'&&!isMe(l.who));
    const el=$('#notif');
    el.innerHTML=`<button class="nt" data-act="openthread" data-id="${t.id}"><div class="av">${CoreView.art(c)}</div><div class="nt-t"><small>${esc(System.T('talk'))}${more>0?`, 외 ${more}건`:''}</small><b>${esc(c.name)}</b><span>${esc(sub(first?first.text:t.title))}</span></div></button>`;
    Art.sfx('알림'); try{navigator.vibrate&&navigator.vibrate([60,40,60]);}catch(e){}
    clearTimeout(el._t); el._t=setTimeout(()=>{const b=el.querySelector('.nt'); if(b){b.classList.add('out');setTimeout(()=>{el.innerHTML='';},300);}},5000);
  }

  static closePhone(){ PH=null; $('#phone').hidden=true; $('#phone').innerHTML=''; Challenge.render(); }

  static chatImgHTML(k){ const u=chatImgCache[k]; return u?`<img class="art" src="${esc(u)}" alt="사진" data-act="chatimg" data-k="${esc(k)}" draggable="false">`:`<div class="art ph" data-chatimg="${esc(k)}"><small>사진 불러오는 중</small></div>`; }

  static phPendRender(){ const w=$('#phPend'); if(!w) return; const k=PH&&PH.pendImg; w.hidden=!k; w.innerHTML=k?`<img src="${esc(chatImgCache[k]||'')}" alt="보낼 사진"><span>이 사진을 보낼게요</span><button class="btn sm ghost" data-act="phpendx" aria-label="사진 빼기">✕</button>`:''; }

    /* 대화방 화면(View) */
static roomShow(c,it){ $('#phone').innerHTML=`<div class="phone"><div class="ph-top"><button data-act="${PH.sel?'phselend':'phback'}" aria-label="뒤로">‹</button><b>${PH.sel?'지울 메시지를 누르세요':esc(c.name)}</b>${PH.sel?`<button class="ph-done" data-act="phselend">완료</button>`:`<button data-act="phmenu" data-id="${esc(c.id)}" aria-label="메뉴">⋯</button>`}</div>
      <div class="ph-chat ${PH.sel?'selmode':''}" id="phChat">${it.length?it.map((x,i)=>PH.sel?`<div class="phsel" data-act="phdel" data-i="${i}">${ArtView.bubbleHTML(x.l,c)}</div>`:ArtView.bubbleHTML(x.l,c)).join(''):`<div class="sys empty">${esc(c.name)}와(과)의 대화방이에요. 오른쪽 위 ⋯ → 대화 추가로 새 대화를 받거나, 아래에서 바로 말을 걸어 보세요.</div>`}</div>
      <div class="ph-in" id="phIn" hidden></div>
      <div class="ph-pend" id="phPend" hidden></div><div class="ph-in fcin" id="phFree" ${PH.sel?'hidden':''}><button class="btn sm ghost ph-sw" data-act="phmode" data-v="pick" hidden aria-label="선택지 보기">선택지</button><button class="btn sm ghost ph-cam" data-act="fcphoto" aria-label="사진 보내기" ${SAMPLE?'':'disabled'}>📷</button><textarea id="fcIn" rows="1" maxlength="400" placeholder="${SAMPLE?'메시지 보내기':'글 AI를 등록하면 직접 말을 걸 수 있어요'}" ${SAMPLE?'':'disabled'}></textarea><button class="btn sm" data-act="fcsend" ${SAMPLE?'':'disabled'}>전송</button></div></div>`;
  }

  static phBubble(m,c){ const ch=$('#phChat'); if(!ch) return; ch.insertAdjacentHTML('beforeend',ArtView.bubbleHTML(m,c)); CoreView.phScroll(); }

  static phSentShow(en,c){ $('#phIn').innerHTML=''; MessengerView.phMode('free'); $('#phChat').insertAdjacentHTML('beforeend',ArtView.bubbleHTML(en,c)); CoreView.phScroll(); }

  static phScroll(){const el=$('#phChat'); if(el){ el.scrollTop=el.scrollHeight; if(el.querySelector('[data-chatimg]')) SystemView.hydrateChatImgs(); }}

    // 카드 그림: 카드 일러스트 → 상반신 → 전신(위쪽) → 없으면 그림 없이
static cardArtHTML(cd){ const c=charById(cd.o), o=Core.cardIllObj(cd); if(o) return `<img class="art ill" src="${esc(Characters.imgSrc(o))}" alt="" draggable="false">`; if(!c) return '';
    const k=Characters.skinOf(c), up=(k&&k.upper&&Characters.imgSrc(k.upper))||(c.upper&&Characters.imgSrc(c.upper)); if(up) return `<img class="art up" src="${esc(up)}" alt="" draggable="false">`;
    const st=Art.charSrc(c); return st?`<img class="art st" src="${esc(st)}" alt="" draggable="false">`:''; }

  static cbLog(t){ CB.log.push(t); CB.log=CB.log.slice(-3); const el=$('#cbLog'); if(el) el.innerHTML=CB.log.map(x=>`<p>${esc(x)}</p>`).join(''); }

  static cbFx(id,txt,cls){ const el=document.getElementById(id); if(!el) return; const d=document.createElement('span'); d.className='dmg '+(cls||''); d.textContent=txt; el.appendChild(d); el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); setTimeout(()=>d.remove(),800); }

  static cbSkill(u,sk,pw,tg,es,pops){
    if(sk.kind==='dmg'&&tg) ChallengeView.cbHitE(u,tg,pw*1.3,pops);
    if(sk.kind==='aoe') es.forEach(e=>ChallengeView.cbHitE(u,e,pw*0.9,pops));
    if(sk.kind==='heal') Core.cbHealLead(System.cbSkillVal(u,sk,pw),pops);
    if(sk.kind==='shield'){ const b=System.cbSkillVal(u,sk,pw); CB.block+=b; pops.push(['cbLead','🛡+'+nf(b),'heal']); }
    if(sk.kind==='buff'){ CB.str+=System.cbSkillVal(u,sk,pw); pops.push(['cbLead','공격↑','heal']); } }

  static bgJobsDraw(){ let el=document.getElementById('bgjobs'); if(!BGJOBS.length){ if(el) el.remove(); return; } if(!el){ el=document.createElement('div'); el.id='bgjobs'; document.body.appendChild(el); }
    const now=Date.now(); el.innerHTML=BGJOBS.map(j=>{ const s=Math.floor((now-j.at)/1000), pct=j.total?Math.round(100*j.step/j.total):0; return `<div class="bgj"><span>${esc(j.label)}${j.sub?' · '+esc(j.sub):''}</span><em>${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}</em><i class="${j.total?'':'ind'}" style="--w:${Math.max(8,pct)}%"></i></div>`; }).join(''); }

  static puxRead(){ if(!PUX||!$('#pux_days')) return; PUX.name=$('#pux_name').value; PUX.days=$('#pux_days').value; PUX.rate=$('#pux_rate').value; PUX.story=!!($('#pux_story')&&$('#pux_story').checked); }

  static uiSelectText(field){if(!field)return;const root=field.closest('.sheet')||document.getElementById('view'),state=PlayerView.uiScrollCapture(root);field.focus({preventScroll:true});try{field.setSelectionRange(0,field.value.length);}catch(e){field.select();}PlayerView.uiScrollRestore(root,state);}

  static swRead(){ const v=id=>{const el=$('#'+id);return el?el.value.trim():null;};
    if($('#ap_type')){ CoreView.readAp(); SW.ai.type=APD.type; SW.ai.key=APD.key||APD.sa||APD.vkey||''; }
    if(v('sw_img')!=null) SW.img=v('sw_img'); if(v('sw_cfurl')!=null) SW.cf.url=v('sw_cfurl'); if($('#sw_cfwf')) SW.cf.wf=$('#sw_cfwf').value.trim();
    if(v('sw_nai')!=null) SW.nai=v('sw_nai'); if(v('sw_fish')!=null) SW.fish=v('sw_fish'); if(v('sw_el')!=null) SW.el=v('sw_el');
    if($('#sw_auto')) SW.autoArt=$('#sw_auto').value; if($('#sw_stags')) SW.cst.tags=$('#sw_stags').value.trim(); if(v('sw_sneg')!=null) SW.cst.neg=v('sw_sneg'); }

  static openModal(html,lock,cls){const m=$('#modal');m.innerHTML=`<div class="sheet ${cls||''}" role="dialog">${html}</div>`;m.hidden=false;m.dataset.lock=lock?'1':'';m.querySelector('.sheet').scrollTop=0;}

  static closeModal(){if(typeof Core.regenCancel==='function'&&!Core.regenCancel())return;v2CancelEditorGeneration();if(typeof v2CloseGearEditor==='function')v2CloseGearEditor();const m=$('#modal');m.hidden=true;m.innerHTML='';m.dataset.lock='';NAIJOB=null;}

  static opt(list,cur){return list.map(([v,l])=>`<option value="${esc(v)}" ${String(v)===String(cur)?'selected':''}>${esc(l)}</option>`).join('');}

  static imgViewer(src){ if(!src) return; const d=document.createElement('div'); d.className='lbrev view'; d.innerHTML=`<img src="${esc(src)}" alt="">`; CharactersView.wideFit(d); d.addEventListener('click',e=>{ if(e.target.closest('.lb-rot')) return; d.remove(); }); document.body.appendChild(d); }

    /* 창을 다시 그려도 스크롤 자리 유지(View) */
static modalKeep(open){ const sh=$('#modal .sheet'), y=sh?sh.scrollTop:0; open(); const sh2=$('#modal .sheet'); if(sh2) sh2.scrollTop=y; }

    // Detail is an original-art viewer, independent of the gameplay standing preference.
static characterDetailArt(c,upper=false){
   const sk=Characters.skinOf(c),pick=o=>o&&(upper?Art.imgSrcRaw(o.upper)||Art.imgSrcRaw(o):Art.imgSrcRaw(o)||Art.imgSrcRaw(o.upper));
   const src=pick(sk)||pick(c),up=!!src&&(src===Art.imgSrcRaw(sk?.upper)||src===Art.imgSrcRaw(c.upper));
   return src?`<img class="art ${up?'upimg':''}" src="${esc(src)}" alt="${esc(c.name)}" loading="lazy" draggable="false">`:`<div class="art ph"><small>이미지 미등록</small></div>`;
  }

    /* 홈 화면에 추가 안내 창 내용(View) */
static a2hsHTML(){ return `${head('홈 화면에 추가해 주세요',`<span class="muted">아이폰은 앱처럼 쓰려면 이 단계가 필요해요</span>`)}
      <ol class="a2hs"><li>Safari 아래쪽(또는 위쪽)의 <b>공유 버튼</b> <span class="kbd">⬆︎</span>을 눌러요.</li><li>목록을 내려서 <b>홈 화면에 추가</b>를 눌러요.</li><li>오른쪽 위 <b>추가</b>를 누르면 홈 화면에 '가챠 메이커' 아이콘이 생겨요.</li><li>앞으로는 그 아이콘으로 열어요. 전체 화면으로 열리고, 저장한 게임도 안전하게 남아요.</li></ol>
      <p class="muted">Safari 탭에서 그냥 쓰면 오래 안 열었을 때 아이폰이 저장 데이터를 지울 수 있어요. 가끔 설정 → 백업으로 내보내 두면 더 안전해요.</p>
      ${System.pcOrigin()?'<p class="muted"><b>PC 서버로 접속 중이에요.</b> 게임은 PC에 저장되니 홈 화면에 추가하지 않아도 돼요. 바깥 주소(trycloudflare)는 PC 서버를 켤 때마다 바뀌어서, 홈 화면 아이콘은 다음에 안 열릴 수 있어요. 그럴 땐 PC의 QR을 다시 찍으면 PC에 저장된 게임이 그대로 이어져요.</p>':''}
      <div class="row" style="margin-top:12px"><button class="btn" data-act="close">알겠어요</button></div>`; }

  static openProxySet(){
    CoreView.openModal(`${head('중계 서버 (아이폰·웹)')}
      <p class="muted">브라우저는 보안 규칙(CORS) 때문에 일부 AI 서비스에 직접 연결하지 못해요. 그럴 때만 중계 서버를 거쳐요. 직접 연결이 되는 서비스는 그대로 직접 연결해요.</p>
      <label class="f" for="px_url">중계 서버 주소</label><input class="in" id="px_url" value="${esc(System.webProxy())}" placeholder="https://내-이름.workers.dev">
      <p class="muted" style="margin:6px 0 0">Cloudflare Workers나 Vercel에 무료로 직접 만들 수 있어요. 만드는 법은 배포 페이지 README의 '아이폰' 항목과 proxy 폴더에 있어요(Vercel은 proxy/vercel). 중계 서버를 거치는 요청에는 API 키가 함께 지나가니, 내가 만든 서버나 믿을 수 있는 서버만 넣어 주세요.</p>
      <div class="row" style="margin-top:14px"><button class="btn" data-act="pxsave">저장</button><button class="btn ghost" data-act="pxtest">연결 확인</button></div>`); }

  static refreshForm(){ if(FORM) CharactersView.openFormation(FORM.stage,FORM.ctx,FORM.startAct); }

  static buyFx(big,sub2){
    const d=document.createElement('div'); d.className='buyfx';
    let sp=''; for(let i=0;i<18;i++){const a=i/18*Math.PI*2,r=120+Math.random()*120; sp+=`<i class="sp" style="--dx:${Math.round(Math.cos(a)*r)}px;--dy:${Math.round(Math.sin(a)*r)}px;animation-delay:${(Math.random()*.15).toFixed(2)}s"></i>`;}
    d.innerHTML=`<div class="rays"></div><div class="ring"></div>${sp}<div class="core">${RICON.gems}<b>${big}</b><span>${sub2||''}</span></div>`;
    d.addEventListener('click',()=>d.remove()); document.body.appendChild(d); Art.sfx('확인'); setTimeout(()=>d.remove(),1800);
  }

  static openProjects(){
    const pj=Core.PJ();
    CoreView.openModal(`${head('게임 목록')}
      ${pj.list.map(x=>`<div class="ep"><span class="t"><b>${esc(x.title)}</b><span class="muted">${x.id===pj.active?'지금 플레이 중':''}${x.sub?' · 🔗 구독':''}</span></span><button class="btn sm ghost" data-act="swpjdraft" data-id="${x.id}">초안으로 새로</button><button class="btn sm ghost" data-act="pjdraftx" data-id="${x.id}">초안 내보내기</button><button class="btn sm ghost" data-act="pjreroll" data-id="${x.id}">🎲 그림 유지 리롤</button>${x.id===pj.active?'':`<button class="btn sm" data-act="pjswitch" data-id="${x.id}">전환</button><button class="btn sm ghost" data-act="pjdel" data-id="${x.id}">삭제</button>`}</div>`).join('')}
      <div class="row" style="margin-top:12px"><button class="btn" data-act="draft-open">AI로 새 게임 만들기 (초안)</button><button class="btn ghost" data-act="pjblank">기본 게임 복사본 만들기</button></div>
      <label class="f" for="pj_start">앱을 켤 때</label><select class="in" id="pj_start" onchange="try{appStorage.setItem('ggm-start',this.value)}catch(e){}">${CoreView.opt([['last','마지막으로 한 게임 바로 시작'],['pick','게임 목록에서 골라서 시작']],Art.startMode())}</select>
      <p class="muted">게임마다 진행 상황, ${System.T('crew')}, 스토리가 따로 저장돼요. 이미지와 소리는 기기 안에 같이 보관돼요.</p>`);
  }

  static drRead(){ if(!DR2||!$('#drPage')) return; const v=id=>{const el=$('#'+id);return el?(el.type==='checkbox'?el.checked:el.value):undefined;}, set=(k,id,f)=>{const x=v(id); if(x!==undefined) DR2[k]=f?f(x):x;};
    set('auto','dr_auto'); set('gtitle','dr_gtitle'); set('crewTerm','dr_crew',x=>String(x||'').trim().slice(0,8)); set('castSex','dr_cast'); set('kw','ng_kw'); set('tone','ng_tone'); set('theme','ng_theme'); set('n','ng_n',Number); set('style','ng_style'); set('fan','ng_fan'); set('src','ng_src'); set('story','ng_story'); set('stages','ng_stages',Number); set('len','ng_len'); set('depth','ng_depth'); set('newc','ng_newc',Number); set('talkOnly','ng_talkonly',Number); set('con','ng_con'); set('world','dr_world'); set('setting','dr_setting');
    document.querySelectorAll('#drPage [data-dc]').forEach(e=>{ const c=DR2.chars[+e.dataset.i]; if(c){c[e.dataset.dc]=e.value;if(e.dataset.dc==='tags')CoreView.naiBlocksSave(c,'tags',e);} });
    ['name','call','gender','look','bio'].forEach(k=>{ const x=v('dr_h_'+k); if(x!==undefined) DR2.hero[k]=x; }); const hd=v('dr_h_hide'); if(hd!==undefined) DR2.hero.hide=hd;
    Core.drSave(); const el=$('#drCount'); if(el) el.textContent=nf(Story.drLen()); }

  static drTabHTML(k){ const d=DR2, sec=(id,h)=>`<section data-dr="${id}" ${DRTAB===id?'':'hidden'}>${h}</section>`;
    if(k==='theme') return sec('theme',`<h3 class="sec">테마</h3><p class="muted dr-help">장르, 분위기, 화면 테마, 규모를 정해요. 비워도 되는 칸은 AI가 채워요.</p>
      <label class="f" for="dr_gtitle">게임 이름 (선택 · 비우면 AI가 지어요)</label><input class="in" id="dr_gtitle" maxlength="30" value="${esc(d.gtitle||'')}" placeholder="예: 심연잔향, 어비스 에코">
      <label class="f" for="dr_crew">아군 호칭 <span class="muted" style="font-size:.75rem">(유닛 이름 · 비우면 AI가 새로 지어요)</span></label><input class="in" id="dr_crew" maxlength="8" value="${esc(d.crewTerm||'')}" placeholder="예: 대원, 요원, 사도">
      <label class="f" for="dr_cast">등장인물 성별</label><select class="in" id="dr_cast">${CoreView.opt([['','AI가 정하기 (키워드에 맞게)'],['f','여성만'],['m','남성만'],['mix','여성 + 남성 혼성']],d.castSex||'')}</select>
      <label class="f" for="ng_kw">장르와 키워드</label><textarea class="in" id="ng_kw" placeholder="예: 정통 판타지. 몰락한 왕국을 되찾는 용병단.">${esc(d.kw)}</textarea>
      <label class="f" for="ng_tone">분위기</label><input class="in" id="ng_tone" value="${esc(d.tone)}" placeholder="예: 진지하고 비장하게">
      <div class="g2"><div><label class="f" for="ng_theme">화면 테마</label><select class="in" id="ng_theme">${CoreView.opt([['auto','AI가 고르기'],['tactical','택티컬'],['fantasy','판타지'],['neon','네온 사이버'],['pastel','파스텔'],['noir','모노 누아르']],d.theme)}</select></div>
      <div><label class="f" for="ng_n">${esc(d.crewTerm||'동료')} 수 (인물 탭에 적은 인물 포함)</label><select class="in" id="ng_n">${CoreView.opt([[6,'6명'],[8,'8명'],[10,'10명'],[12,'12명']],d.n)}</select></div></div>
      <label style="display:flex;gap:8px;align-items:center;margin-top:10px"><input type="checkbox" id="ng_fan" ${d.fan?'checked':''} onchange="document.getElementById('ng_srcw').hidden=!this.checked"><span><b>2차 창작</b> <span class="muted" style="font-size:.8rem">(원작 세계관·캐릭터로 만들기)</span></span></label>
      <div id="ng_srcw" ${d.fan?'':'hidden'}><label class="f" for="ng_src">원작 이름</label><input class="in" id="ng_src" value="${esc(d.src)}" placeholder="예: 작품 이름"><p class="muted" style="margin:4px 0 0;font-size:.78rem">원작에서 미성년자·학생인 캐릭터는 넣지 않고 성인 캐릭터만 써요. 개인 감상용으로만 써 주세요.</p></div>
      ${ArtView.drPresetHTML()}
      <label class="f" for="ng_style">이 게임 그림체 태그 (선택 · 프리셋보다 우선)</label><input class="in" id="ng_style" value="${esc(d.style)}" placeholder="예: dark fantasy, muted colors">
      <label style="display:flex;gap:8px;align-items:center;margin-top:10px"><input type="checkbox" id="ng_con" ${d.con?'checked':''}><span><b>건조/영입 사용</b> <span class="muted" style="font-size:.8rem">(자원 4종을 넣어 영입 · 기본 ${esc(d.crewTerm||'동료')}은(는) 뽑기, 특별 의상 바리에이션은 건조로 · 나중에 설정에서 켜고 끌 수 있어요)</span></span></label>
      ${SystemView.storyFormHTML({plot:d.story,stages:d.stages,len:d.len,depth:d.depth,newc:d.newc,talkOnly:d.talkOnly})}
      <button class="btn sm ghost" data-act="drpolish" data-k="story">✦ 스토리 개요 AI로 다듬기</button>`);
    if(k==='world') return sec('world',`<div class="dr-h"><h3 class="sec">세계관</h3><span class="muted">${nf(d.world.length)}자 / 권장 8,000</span></div><p class="muted dr-help">역사, 사회 구조, 기술이나 마법의 규칙, 지금 벌어지는 갈등, 사람들이 일상에서 겪는 불편까지. 고유명사와 구체적인 디테일이 많을수록 AI가 지어낼 틈이 줄어요. 플레이어에게 숨길 반전은 여기 말고 <b>설정</b> 탭에 '비밀'로 따로 적어 두세요.</p>
      <textarea class="in dr-big" id="dr_world" placeholder="예) 대붕괴 이후 300년. 도시는 운하로 나뉜 일곱 구역으로 이루어져 있고…">${esc(d.world)}</textarea>
      <button class="btn sm ghost" data-act="drpolish" data-k="world">✦ AI로 다듬기</button>`);
    if(k==='setting') return sec('setting',`<div class="dr-h"><h3 class="sec">설정</h3><span class="muted">${nf(d.setting.length)}자</span></div><p class="muted dr-help">세력과 조직, 고유 용어, 전투·능력의 규칙, 그리고 '비밀:'로 시작하는 줄에 숨겨진 진실과 반전을 적어요. 비밀은 AI가 이야기 속에서 천천히 드러내고, 개인 채팅 같은 곳에서는 새지 않게 해요.</p>
      <textarea class="in dr-big" id="dr_setting" placeholder="세력: 운하 길드 — 물길을 쥔 상인 연합…&#10;용어: 잔광 — 대붕괴 때 남은 빛의 파편…&#10;비밀: 길드장은 사실 대붕괴를 일으킨 장본인이다.">${esc(d.setting)}</textarea>
      <button class="btn sm ghost" data-act="drpolish" data-k="setting">✦ AI로 다듬기</button>`);
    if(k==='chars') return sec('chars',`<div class="dr-h"><h3 class="sec">인물</h3><span class="muted">${d.chars.length}명</span></div><p class="muted dr-help">꼭 넣고 싶은 동료을(를) 적어요. 적은 이름과 설정은 그대로 쓰고, 빈 칸과 모자란 인원은 AI가 채워요.</p>
      ${d.chars.map((c,i)=>`<div class="dr-card"><div class="g2" style="margin-bottom:4px"><div><label class="f">구분</label><select class="in" data-dc="kind" data-i="${i}">${CoreView.opt([['crew',(d.crewTerm||'동료')+' (뽑기·편성 가능)'],['npc','NPC (스토리 조연, 그림만)']],c.kind||'crew')}</select></div><div><label class="f">등급</label><select class="in" data-dc="rank" data-i="${i}" ${c.kind==='npc'?'disabled':''}>${CoreView.opt([['','AI가 정하기'],['3','SSR'],['2','SR'],['1','R']],c.rank||'')}</select></div></div><div class="g2"><div><label class="f">이름</label><input class="in" data-dc="name" data-i="${i}" value="${esc(c.name||'')}"></div><div><label class="f">역할·한 줄 소개</label><input class="in" data-dc="role" data-i="${i}" value="${esc(c.role||'')}" placeholder="예: 무뚝뚝한 저격수"></div></div>
        <label class="f">성격·과거·관계</label><textarea class="in" data-dc="profile" data-i="${i}">${esc(c.profile||'')}</textarea>
        <div class="g2"><div><label class="f">말투</label><input class="in" data-dc="speech" data-i="${i}" value="${esc(c.speech||'')}" placeholder="예: 짧게 끊는 반말"></div><div><label class="f">외모</label><input class="in" data-dc="look" data-i="${i}" value="${esc(c.look||'')}" placeholder="예: 은발 포니테일, 검은 코트"></div></div>
        <label class="f">외형 프롬프트 <span class="muted" style="font-size:.75rem">(선택 · 그림 AI 영어 태그. 적으면 AI가 바꾸지 않고 그대로 그려요)</span></label><textarea class="in" data-dc="tags" data-i="${i}" style="min-height:52px" placeholder="예: 1girl, solo, silver hair, ponytail, red eyes, black long coat, gloves">${esc(c.tags||'')}</textarea>
        <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-act="drcfill" data-i="${i}">✦ AI로 다듬기</button><button class="btn sm ghost" data-act="drcdel" data-i="${i}">삭제</button></div></div>`).join('')}
      <button class="btn sm" data-act="drcadd">＋ 인물 추가</button>`);
    if(k==='hero') return sec('hero',`<h3 class="sec">주인공</h3>${ArtView.drHeroHTML()}`);
    return ''; }

    // 다시 그리기 전에 부르는 쪽에서 drRead()를 먼저 해요(여기서 읽으면 방금 바꾼 값이 옛 입력칸 값으로 덮여요)
static drRerender(){ CoreView.modalKeep(StoryView.openDraft); }

  static openRelEdit(id){ const r=World.RELS().find(x=>x.id===id); if(!r) return;
    CoreView.openModal(`${head('관계 고치기',`<span class="muted">${esc(Core.relName(r.a,true))} ↔ ${esc(Core.relName(r.b,true))}</span>`)}
      <label class="f" for="rle_k">관계</label><input class="in" id="rle_k" maxlength="16" value="${esc(r.kind||'')}">
      <label class="f" for="rle_n">설명</label><textarea class="in" id="rle_n" maxlength="240">${esc(r.note||'')}</textarea>
      <label class="f" for="rle_h">있었던 일 (한 줄에 하나, 최근이 아래)</label><textarea class="in" id="rle_h">${esc((r.hist||[]).map(h=>(h.src?h.src+' · ':'')+h.text).join('\n'))}</textarea>
      <div class="row" style="margin-top:12px"><button class="btn" data-act="relsave" data-id="${r.id}">저장</button><button class="btn ghost" data-act="reldel" data-id="${r.id}">이 관계 지우기</button><button class="btn ghost" data-act="relgo" data-r="${esc(RELC)}">돌아가기</button></div>`); }

  static async updateDownloadHTML(base,path,man){
   let response;try{response=await System.http(base+path+'?t='+Date.now(),{timeout:60000,binary:true});}catch(e){throw Error('업데이트 실행 파일을 확인하지 못했어요. 다시 확인해 주세요.');}
   if(response.status>=400)throw Error('업데이트 실행 파일을 받지 못했어요. 배포 경로를 확인해 주세요.');
   const raw=response.bytes,html=raw?new TextDecoder().decode(raw):String(response.text||'');
   if(!/APP_BUILD/.test(html)||!/<\/html>/i.test(html))throw Error('받은 파일이 게임 파일이 아니에요.');
   const build=(html.match(/var BUILT='([^']+)'/)||[])[1];if(!build||build!==String(man.build))throw Error('배포 정보와 실행 파일의 버전이 달라요. 잠시 뒤 다시 확인해 주세요.');
   if(man.sha256){const digest=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');let ok;
   try{ok=raw?(await digest(raw))===String(man.sha256).toLowerCase():(await Promise.all([html,html+'\n'].map(Misc.sha256hex))).includes(String(man.sha256).toLowerCase());}catch(e){throw Error('업데이트 파일의 무결성을 확인하지 못했어요.');}
   if(!ok)throw Error('받은 파일이 손상됐거나 배포 정보와 달라요. 다시 확인해 주세요.');}
   return html;
  }

  static async checkUpdatePrivate(manual){
    UPD=null;const o=Core.LV(); if(!o.repo){ if(manual) CoreView.toast('업데이트 설정에서 GitHub 저장소를 먼저 넣어 주세요'); return; }
    const base=`https://api.github.com/repos/${o.repo.trim()}/contents/${(o.path||'www/index.html').trim()}?ref=${encodeURIComponent((o.branch||'main').trim())}`;
    const h={Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}; if(o.token) h.Authorization='Bearer '+o.token.trim();
    let j; try{ j=Characters.okJSON(await System.http(base,{headers:h,timeout:30000})); }
    catch(e){ if(manual) CoreView.toast('업데이트 확인 실패. '+(e.code==='bad_key'?'토큰 권한을 확인해 주세요.':e.code==='model_not_found'?'저장소 이름, 브랜치, 경로를 확인해 주세요.':(e.message||''))); return; }
    o.checked=Date.now(); LiveOps.saveLV(o);
    let html='';
    try{ if(j.content&&j.encoding==='base64') html=new TextDecoder().decode(System.b64ToBytes(j.content.replace(/\s/g,'')));
      else { const r=await System.http(base,{headers:Object.assign({},h,{Accept:'application/vnd.github.raw+json'}),timeout:60000}); html=r.text||''; } }catch(e){ Core.quietErr(e,'0420-app-update.js:99'); }
    if(!/APP_BUILD/.test(html)||!/<\/html>/i.test(html)){ if(manual) CoreView.toast('받은 파일이 게임 파일이 아니에요. 경로를 확인해 주세요.'); return; }
    const build=(html.match(/var BUILT='([^']+)'/)||[])[1]||'';
    const man={build,apk:{url:'https://github.com/'+RELEASE_REPO+'/releases/latest/download/gacha-game-maker.apk'}};
    if(LiveOpsView.updateAPKRequired(man,html,o.repo,o.branch||'main'))return;
    if(build&&Core.verCmp(build,APP_BUILD)<=0){o.sha=j.sha;LiveOps.saveLV(o);LiveOps.updateCheckRecord(man,o.repo,o.branch||'main','최신 또는 배포본보다 새 버전',html);if(manual)CoreView.toast(LiveOps.updateCurrentMessage(build));return;}
    LiveOps.updateCheckRecord(man,o.repo,o.branch||'main','웹 패치 가능',html);
    if(build&&o.badBuild===build&&!manual) return;
    try{ await appStorage.saveLive(html); }
    catch(e){ CoreView.toast('업데이트 저장 실패: '+(e.message||'저장 공간을 확인해 주세요')); return; }
    Object.assign(o,{on:true,sha:j.sha,prevBuild:o.build||'',build,boots:0,failed:false,at:Date.now()}); LiveOps.saveLV(o);
    CoreView.openModal(`${head('새 버전을 받았어요')}<p>버전 <b>${esc(build||'알 수 없음')}</b>. 앱을 다시 시작하면 적용돼요.</p><div class="row" style="margin-top:12px"><button class="btn" data-act="reload">지금 다시 시작</button><button class="btn ghost" data-act="close">나중에</button></div>`);
  }

    // 바깥 링크: 새 창이 막혀도(팝업 차단·인앱 브라우저) 앱 페이지를 떠나지 않게, 누를 수 있는 링크와 복사 버튼을 보여 줘요(뒤에서 만들던 작업이 끊기지 않게)
static openUrl(url){ try{ if(CAP&&CAP.Browser){ CAP.Browser.open({url}); return; } }catch(e){} let w=null; try{ w=window.open(url,'_blank'); }catch(e){} if(w){ try{ w.opener=null; }catch(e){} return; }
    CoreView.openModal(`${head('링크 열기')}<p class="muted" style="margin:0 0 8px">새 창을 열지 못했어요. 아래 링크를 눌러 열거나 복사해서 브라우저에 붙여 넣어 주세요.</p><a class="btn block" href="${esc(url)}" target="_blank" rel="noopener">열기</a><div class="code-box" style="margin:10px 0;padding:8px;word-break:break-all;user-select:all">${esc(url)}</div><div class="row"><button class="btn ghost" data-act="copy" data-text="${esc(url)}">주소 복사</button></div>`); }

  static vnStep(){
    if(!S) return;
    if(S.typing){CharactersView.vnFinish();return;}
    if(S.choice) return;
    clearTimeout(S.autoT);
    while(S.i<S.lines.length){
      const L=S.lines[S.i++];
      if(L.cond&&L.cond!==S.pick) continue;
      // 고른 선택지를 대본이 플레이어 대사로 한 번 더 말하면 건너뛰어요('재미있겠는데' → '재미있겠는데.' 두 번 나오던 문제)
      if(L.type==='say'&&S.lastPick&&isMe(L.who)){ const nz=x=>sub(String(x||'')).replace(/[\s.,!?~…'"「」]/g,''), a=nz(L.text), b=nz(S.lastPick); S.lastPick=''; if(a===b||(a.length>3&&b.length>3&&(a.includes(b)||b.includes(a)))) continue; }
      else if(L.type==='say'||L.type==='nar') S.lastPick='';
      if(L.type==='cmd'){ArtView.vnCmd(L);continue;}
      if(L.type==='place'){SystemView.setVnBg(L.text);$('#vnPlace').textContent=L.text;S.log.push(L);continue;}
      if(L.type==='choice'){S.choice=L;$('#vnCh').innerHTML=L.opts.map((o,k)=>`<button data-act="vnpick" data-n="${k+1}">${esc(sub(o))}</button>`).join('');$('#vnNext').hidden=true;return;}
      CharactersView.vnShow(L); return;
    }
    CharactersView.vnEnd();
  }

    // 넘기기: 대본을 끝내되, 앞에 시나리오 분기([분기: id] 다음 선택지)가 있으면 그 선택지에서 멈춤 — 분기 기록이 빠지지 않게(0465). 분기 선택지가 떠 있으면 고를 때까지 기다림
static vnSkip(){ if(!S) return; if(S.choice&&S.branch) return; const k=S.lines.findIndex((L,i)=>i>=S.i&&L.type==='cmd'&&L.cmd==='분기'); if(S.choice||k<0){ CharactersView.vnEnd(); return; } if(S.typing) CharactersView.vnFinish(); S.i=k; CoreView.vnStep(); }

  static closeOv(){$('#ov').hidden=true;$('#ov').innerHTML='';SystemView.sceneBgm();}

  static openVnLog(){ CoreView.openModal(`${head('대화 기록')}${S.log.map(L=>`<p style="margin:6px 0">${L.type==='say'?`<b>${esc(isMe(L.who)?playerName():L.who)}</b> ${esc(sub(L.text))}`:L.type==='place'?`<span class="muted">[${esc(L.text)}]</span>`:`<i class="muted">${esc(sub(L.text))}</i>`}</p>`).join('')}`); }

  static slotOf(name){ const c=Characters.vnSpeaker(name); return c?SystemView.vnStage(c,(S.stage||[]).find(x=>x.c===c)?.face||''):null; }

  static vnEmote(slot,emo){ if(!slot||!emo||Characters.dirMode()==='off') return; slot.querySelectorAll('.emo').forEach(x=>x.remove()); slot.insertAdjacentHTML('beforeend',ArtView.emoteHTML(emo)); const i=slot.lastElementChild; setTimeout(()=>i&&i.remove(),1800); if(EMOTES[emo]&&/하트|놀람|화남/.test(emo)) try{ Art.sfx(emo==='하트'?'확인':'타격'); }catch(e){} }

    /* 로고 미리 보기(View): 설정 창 위에 고른 로고로 타이틀을 띄우고, 누르면 설정으로 돌아감 */
static logoPreview(style){ StoryView.showTitle(style); const t=$('.title'); if(t){ t.dataset.act='logoprevclose'; const tt=t.querySelector('.t-touch'); if(tt) tt.textContent='눌러서 설정으로 돌아가기'; } $('#modal').hidden=true; }
}

class CoreCtl {
    // One scene per candidate round; no character data is saved before image registration.
static generateUltimateCutin(c){
   const o=Core.scgOf(c),project=Core.PJ().active,snapshot=Misc.ultimateSceneSnapshot(c),input=document.getElementById('sc_scene'),draft=input?.value;
   const valid=()=>Core.PJ().active===project&&charById(c.id)===c&&Misc.ultimateSceneSnapshot(c)===snapshot&&(!input||(input.isConnected&&input.value===draft));
   const check=()=>{if(!valid())throw new Error('캐릭터나 궁극기 설정이 바뀌었어요. 창을 다시 열어 생성해 주세요.');};
   return CharactersView.imageCandidates(async(cfg,index,signal)=>{
    check();v2CheckCancelled(signal);let refs=[];if(Art.autoRefOn('scg'))refs=await Characters.standRefs([c]);check();v2CheckCancelled(signal);
    return Core.naiDrawItem0({k:'scg',o:{...o,prompt:cfg.prompt},c},{candidateEligible:false,refs,seed:cfg.seed});
   },{promptBlocks:true,prompt:draft??o.prompt??'',originalSrc:Art.imgSrcRaw(o)||'',prepare:async(cfg,progress,signal)=>{
    check();if(cfg.sceneReady)return;progress('궁극기·캐릭터 컨셉을 바탕으로 컷인 장면 구성 중');
    cfg.sceneTags=await World.requestUltimateScene(c,cfg.prompt,signal);check();cfg.prompt=cfg.sceneTags;cfg.sceneReady=true;
   }}).then(blob=>{check();return blob;});
  }

  static async registerNaiJob(){ const j=NAIJOB; if(!j||!j.blob) return; NAIJOB=null; const o=Core.naiTarget(j.kind,j.id); if(!o) return;
        if(j.kind==='weapon'){ await Art.storeImage(o,j.blob,''); Core.mark('c:'+j.id); Challenge.render(); CharactersCtl.openChar(j.id); CoreView.toast(System.T('weapon')+' 이미지를 등록했어요'); return; }
        if(ILK(j.kind)){ await Art.storeImage(o,j.blob,''); if(j.custom.sceneTags)o.prompt=j.custom.sceneTags; Core.mark('c:'+j.id); Challenge.render(); CharactersCtl.openChar(j.id); CoreView.toast(j.kind==='lbcg'?System.T('limit')+' CG를 등록했어요':'일러스트를 등록했어요'); return; }
        await Art.storeImage(o,j.blob,j.kind==='char'?'c:':'l:'); Challenge.render(); if(j.kind==='char') CharactersCtl.openChar(o.id); else CharactersView.openLibItem(o.id); CoreView.toast(`${o.name} 이미지를 등록했어요`);
        if(j.kind==='char'&&o.upper&&!Characters.imgSrc(o.upper)&&o.naiPrompt&&Core.imgReady()){ Acquire.artRun(new Set([Misc.artKey({k:'upper',o:o.upper,c:o})])); setTimeout(()=>CoreView.toast(`${o.name} 상반신도 이어서 그려요`),1200); } return;
  }

  static skinPartDraw(c,k,x,generationMode='automatic'){ const inp=$('#skscene_'+k.id); if(inp){k.scene=inp.value.trim();CoreView.naiBlocksSave(k,'scene',inp);} const scene=k.scene||'',candidateEligible=Characters.imageCandidateEligible('char',x==='stand'?k:Characters.skinPart(k,x),c,generationMode),originalSrc=Art.imgSrcRaw(x==='stand'?k:Characters.skinPart(k,x))||'';
    if(x==='stand') return NewGame.naiDraw('char',k.prompt,{candidateEligible,originalSrc,styleId:c.naiStyle,frame:c.naiFrame});
    if(x==='upper') return NewGame.naiDraw('char',k.prompt,{candidateEligible,originalSrc,frame:'cowboy shot',pose:'looking at viewer, smile',styleId:c.naiStyle});
    return NewGame.naiDraw(x,Core.joinTags(k.prompt,scene||(x==='lbcg'?(c.lbcg&&c.lbcg.prompt)||'dramatic lighting, sparkles, smile, wind':(c.illust&&c.illust.prompt)||'')),{candidateEligible,originalSrc,styleId:c.naiStyle}); }

  static npcRead(n){ const el=document.getElementById('npc_'+n.id); if(!el) return; const old=n.name; el.querySelectorAll('[data-nf]').forEach(f=>{ n[f.dataset.nf]=f.value.trim(); }); CoreView.naiBlocksSave(n,'naiPrompt',el.querySelector('[data-nf=naiPrompt]')); n.name=n.name||old; if(n.upper) n.upper.name=n.name+' 상반신'; n.naiPrompt=stripMinor(Core.stripAge(n.naiPrompt||'')); Core.mark('meta'); return old; }

  static async castRun(){ if(!CAST||CAST.busy) return; if(PREPJOB){ setTimeout(CoreCtl.castRun,4000); return; }
    while(CAST&&CAST.q.length){ while(CAST&&(document.querySelector('.mpaint')||($('#castGrid')&&!$('#modal').hidden))) await wait(1500); if(!CAST||!CAST.q.length) break; const it=CAST.q.shift(), c=castById(it.c); if(!c) continue; CAST.busy=it; CharactersView.castRefresh(c.id);
      try{ if(it.k==='face'){ if(!(c.faceMask||{})[it.b]||!Characters.imgSrc(it.b==='up'?c.upper:c)) throw Object.assign(new Error('얼굴 범위가 없어요'),{code:'skip'}); let f=c.faces.find(q=>q.name===it.name); if(!f){ f={id:'f'+uid(),name:it.name,img:null}; c.faces.push(f); } await Core.faceDrawOne(c,c,f,it.name,it.b,Misc.castFaceOpt(),''); }
        else if(it.k==='full'){ const b=await Core.naiDrawItem({k:'char',o:c,c}); await Art.storeImage(c,b,'c:'); (c.faces||[]).forEach(f=>{ f.img=null; if(f.up) f.up.img=null; }); if(c.faceMask) delete c.faceMask.full; }
        else { const b=await Core.naiDrawItem({k:'upper',o:c.upper,c}); await Art.storeImage(c.upper,b,''); (c.faces||[]).forEach(f=>{ if(f.up) f.up.img=null; }); if(c.faceMask) delete c.faceMask.up; }
        Core.mark('c:'+c.id); if(c.npc) Core.mark('meta'); }
      catch(e){ if(e&&['nai_locked','rate_limited'].includes(e.code)&&(it.tries||0)<4){ it.tries=(it.tries||0)+1; CAST.q.unshift(it); CAST.busy=null; await wait(8000); continue; } // 다른 그림과 겹치면 잠시 뒤 다시
        CoreView.toast(Core.naiErr(e,c.name+' 그림 실패')); if(e&&['image_cancelled','image_busy','nai_nokey','bad_key','low_credit','network','nai_locked','comfy_nourl','comfy_nowf'].includes(e.code)){ CAST.q=[]; } }
      if(!CAST) return; CAST.busy=null; CharactersView.castRefresh(c.id); if(!$('#castGrid')){ if($('#modal').hidden) Challenge.render(); else if($('#modal [data-act="castface"],#modal .fc-grid')&&FACET.cid===c.id) try{ CharactersView.openFaces(c.id); }catch(e){} } await wait(600); }
    CoreView.castStat(); }

  static addAff(c,n){
    const o=Characters.own(c.id); if(!o) return; const b=Core.affLv(o); o.aff=Math.min(AFF_MAX,o.aff+n); const a=Core.affLv(o);
    if(a>b){ const ep=c.episodes.find(e=>e.lv>b&&e.lv<=a); CoreView.toast(ep?`${c.name} 호감도 Lv.${a}! 에피소드 「${ep.title}」가 열렸어요`:`${c.name} 호감도 Lv.${a}`); MessengerCtl.checkTriggers(); MiscView.memoCheck(c,b,a); }
  }

  static async skinPropDraw(rep){ const P0=SKPROP, c=P0&&charById(P0.cid); if(!c) return; if(!Core.imgReady()){ CoreView.toast(Core.imgNeed()); return; }
    if(rep) rep('그리는 중…');
    try{ const src=Characters.imgSrc(c), ref=src&&P0.ref.on?await Characters.refImage(src):null;
      const b=await NewGame.naiDraw('char',P0.prompt,Object.assign({candidateEligible:true,pose:P0.pose||undefined,styleId:c.naiStyle,frame:c.naiFrame},ref?{refs:[{image:ref,type:P0.ref.style?'character&style':'character',strength:P0.ref.str,fidelity:P0.ref.fid}]}:{}));
      const cfg=b.__candidateConfig;if(cfg?.promptParts&&cfg.promptParts.combined===cfg.prompt){P0.prompt=cfg.prompt;P0.naiBlocks={...P0.naiBlocks,prompt:cfg.promptParts};}
      if(P0.url) URL.revokeObjectURL(P0.url); P0.blob=b; P0.url=URL.createObjectURL(b); MiscView.openSkinProp(); }
    catch(err){ CoreView.toast(Core.naiErr(err)); if(rep){ rep.end(); rep(P0.url?'다시 그리기':'그리기'); } } }

  static skinMakeRest(c,k,sel){ if(['upper','illust','lbcg','faces'].some(x=>sel[x])&&!Core.imgReady()){ CoreView.toast(Core.imgNeed()); ['upper','illust','lbcg','faces'].forEach(x=>sel[x]=0); }
    if(c.useStanding===false&&!Core.skinDisplayReady(c,k)&&Core.imgReady())sel.upper=1;const go=()=>CoreCtl.skinAcceptRun(c,k,sel);
    const faceBody=Art.imgSrcRaw(k)?'full':'up',faceSrc=Art.imgSrcRaw(k)||k.upper&&Art.imgSrcRaw(k.upper);if(sel.faces&&faceSrc)CharactersView.openMaskPainter(faceSrc,null,url=>{k.faceMask=Object.assign({},k.faceMask||{},{[faceBody]:url}); Core.mark('c:'+c.id); go(); },{title:`「${k.name}」 얼굴 범위 (표정용 · 취소하면 표정 없이 만들어요)`,onCancel:()=>{ sel.faces=0; go(); }});
    else if(['upper','illust','lbcg','lines'].some(x=>sel[x])) go(); }

  static async skinAcceptRun(c,k,sel){ if(SKJOB){ CoreView.toast('다른 '+System.T('skin')+'을 만드는 중이에요'); return; } const game=G,project=Core.PJ().active,current=()=>G===game&&Core.PJ().active===project&&charById(c.id)===c&&c.skins.includes(k);SKJOB={stop:false,skinId:k.id};let done=[],failed=false;
    try{ k.faces=k.faces||[];
      const parts=['upper','illust','lbcg'].filter(x=>sel[x]&&!Art.imgSrcRaw(k[x]));
      for(const x of parts){ LiveOpsView.liveBar(`${System.T('skin')} 「${k.name}」 ${({upper:'상반신',illust:'일러스트',lbcg:System.T('limit')+' CG'})[x]} 그리는 중…`);
        try{ const b=await CoreCtl.skinPartDraw(c,k,x);if(!current())return;await Art.storeImage(Characters.skinPart(k,x),b,''); Core.mark('c:'+c.id); done.push(({upper:'상반신',illust:'일러스트',lbcg:System.T('limit')+' CG'})[x]);}catch(e){failed=true;CoreView.toast(Core.naiErr(e));break;} await wait(600); }
      if(sel.lines&&SAMPLE){ LiveOpsView.liveBar(`${System.T('skin')} 「${k.name}」 대사 쓰는 중…`); if(await Misc.skinLinesAI(c,k,null)) done.push('대사'); }
      if(sel.faces&&k.faceMask?.up&&k.upper&&Art.imgSrcRaw(k.upper)){const n=await LiveOpsCtl.skinFacesRun(c,k,'up');if(n)done.push(`상반신 표정 ${n}장`);}
      if(sel.faces&&k.faceMask&&k.faceMask.full){ const n=await LiveOpsCtl.skinFacesRun(c,k,'full'); if(n) done.push(`전신 표정 ${n}장`); }
    } finally { LiveOpsView.liveBar(null); SKJOB=null; }
    if(!current())return;CoreView.toast(`「${k.name}」 ${failed?'일부 생성 실패':'완성'}${done.length?' · '+done.join(', '):''}`); CharactersCtl.skinRefresh(c.id); Challenge.render();
    // 상반신 표정은 상반신이 생긴 뒤 얼굴 범위를 한 번 더 칠해야 해요
    if(sel.faces&&k.upper&&Characters.imgSrc(k.upper)&&!k.faceMask?.up)CharactersView.openMaskPainter(Characters.imgSrc(k.upper),null,async url=>{ k.faceMask=Object.assign({},k.faceMask||{},{up:url}); Core.mark('c:'+c.id); SKJOB={stop:false}; let n=0; try{ n=await LiveOpsCtl.skinFacesRun(c,k,'up'); } finally{ LiveOpsView.liveBar(null); SKJOB=null; } CoreView.toast(`「${k.name}」 상반신 표정 ${n}장 완성`); CharactersCtl.skinRefresh(c.id); },{title:`「${k.name}」 상반신 얼굴 범위 (상반신 표정용)`}); }

  static async phPlay(t,c,s,token){
    const lines=System.parseScript(t.script);
    const alive=()=>PH&&PH.token===token&&$('#phChat');
    while(s.pos<lines.length){
      if(!alive()) return;
      const L=lines[s.pos];
      if(L.cond&&L.cond!==s.pick){s.pos++;continue;}
      if(L.type==='choice'){ MessengerView.phChoicesShow(t,L.opts); return; }
      let entry=null;
      if(L.type==='say'){
        if(isMe(L.who)&&s.lastPick){ const nz=x=>sub(String(x||'')).replace(/[\s.,!?~…'"「」]/g,''), a=nz(L.text), b=nz(s.lastPick); if(a===b||(a.length>3&&b.length>3&&(a.includes(b)||b.includes(a)))){ s.pos++; s.lastPick=''; continue; } } // 고른 선택지를 대본이 한 번 더 말하면 건너뛰기
        if(isMe(L.who)){ MessengerView.phSayShow(t,L.text); return; }
        else{
          const off=NewGameView.phTyping(c); await wait(Math.min(1800,500+L.text.length*35)); off(); if(!alive()) return;
          entry={w:'c',t:sub(L.text)};
        }
      } else if(L.type==='cmd'&&L.cmd==='스티커'&&Art.emoKey(L.arg)){ await wait(600); if(!alive()) return; entry={w:'k',t:Art.emoKey(L.arg)}; } // 스티커(0462)
      else if(L.type==='cmd'&&['사진','소품','배경'].includes(L.cmd)){ await wait(800); if(!alive()) return; entry={w:'p',t:L.arg}; }
      else if(L.type==='nar'||L.type==='place'){ entry={w:'s',t:sub(L.text)}; }
      if(!alive()) return;
      s.pos++; if(entry) s.lastPick='';
      if(entry){ Misc.thrLogAdd(s,entry); CoreView.phBubble(entry,c); }
    }
    if(!s.done){
      Misc.thrDone(c,s); MessengerView.updateBadge(); MessengerCtl.checkTriggers();
      if(alive()){ MessengerView.phInClear(); const nx=Messenger.roomThreads(c.id).find(x=>!x.s.done&&x.t); if(nx){ PH.tid=nx.t.id; nx.s.t0=nx.s.t0||Date.now(); MessengerView.phMode('free'); CoreCtl.phPlay(nx.t,c,nx.s,token); } else { PH.tid=null; MessengerView.phMode('free'); } }
    }
  }

  static debateMiss(msg){ MD.hp--; Art.sfx('타격'); if(MD.hp<=0){ const d=MD.s.debate; MD=null; CoreView.closeModal(); CoreView.toast('회담 실패 — 증거와 주장을 다시 살펴보세요'); if(d.lose) SystemView.playStory('회담 실패',`${d.opponent}: ${d.lose}`,()=>Challenge.render()); return; } BattleView.debateDraw(msg); }

  static bgJob(key,label,fn){ if(BGJOBS.some(j=>j.key===key)){ CoreView.toast('이미 뒤에서 만드는 중이에요. 끝나면 우편이 와요'); return false; }
    const game=G,project=Core.PJ().active,j={key,label,at:Date.now(),step:0,total:0,sub:''}; BGJOBS.push(j); CoreView.bgJobsDraw();
    CoreView.toast(label+' · 뒤에서 만들어요. 그동안 플레이해도 돼요. 다 되면 우편으로 알려 드려요');
    (async()=>{ let out=null; try{ out=await fn(j); }catch(e){ console.warn(e); }
      finally{ const i=BGJOBS.indexOf(j); if(i>=0) BGJOBS.splice(i,1); CoreView.bgJobsDraw(); }
      if(G!==game||Core.PJ().active!==project)return;
      if(out&&out.title){ Economy.sendMail({from:'운영팀',title:out.title,body:out.body||'',days:30}); CoreView.toast('📮 '+out.title); }
      else { Economy.sendMail({from:'운영팀',title:label.replace(/ 만드는 중$/,'')+' 실패',body:'만들지 못했어요. 글 AI 연결과 남은 사용량을 확인하고 다시 시도해 주세요.',days:7}); CoreView.toast(label.replace(/ 만드는 중$/,'')+'에 실패했어요. 우편함을 확인해 주세요'); }
      Core.mark('prog'); if($('#modal').hidden&&(!B||B.over)) Challenge.render(); })();
    return true; }

  static async runPrep(cats,filter,opt){
    opt=opt||{};
    if(PREPJOB){ CoreView.toast('이미 준비 중이에요'); if(opt.done) opt.done(null); return; }
    const list=Art.drawTodo(cats).filter(filter||(()=>true)); if(!list.length){ CoreView.toast('그릴 그림이 없어요'); if(opt.done) opt.done(null); return; }
    if(opt.order) list.sort((a,b)=>opt.order.indexOf(a.cat)-opt.order.indexOf(b.cat));
    const j={total:list.length,done:0,stop:false,label:'',fg:!!opt.fg}; PREPJOB=j; AcquireView.prepChip();
    for(const it of list){
      if(j.stop) break; j.label=it.label; AcquireView.prepChip(); if(opt.step) opt.step(it,j,'start');
      while(CAST&&CAST.busy) await wait(800);
      try{
        let b; try{ b=await Core.naiDrawItem(it); }catch(e1){ if(e1&&(e1.code==='rate_limited'||/429|concurrent/i.test(String(e1.message||'')))){ await wait(6000); b=await Core.naiDrawItem(it); } else throw e1; }
        const o=Core.prepTarget(it); if(it.k==='char'&&o.npc){ await Art.storeImage(o,b,'c:'); Core.mark('meta'); } else if(it.k==='char'){ await Art.storeImage(o,b,'c:'); } else if(['illust','weapon','upper','pose','lbbg','scg'].includes(it.k)){ await Art.storeImage(o,b,''); Core.mark('c:'+it.c.id); } else await Art.storeImage(o,b,'l:');
        j.done++; AcquireView.prepChip(); if(opt.step) opt.step(it,j,'done'); if(!$('#modal').hidden||tab==='crew'||tab==='lobby'||tab==='ops'||tab==='shop') { if($('#modal').hidden) Challenge.render(); }
        await wait(700);
      }catch(e){ CoreView.toast(Core.naiErr(e,it.label+' 실패')); if(e&&['image_cancelled','image_busy','nai_nokey','bad_key','low_credit','network','nai_locked','comfy_nourl','comfy_nowf'].includes(e.code)){ CoreView.toast('그림 준비를 멈췄어요. 연결을 확인한 뒤 그림 준비실에서 이어서 그려 주세요'); break; } await wait(1500); }
    }
    PREPJOB=null; AcquireView.prepChip(); Challenge.render(); CoreView.toast(`그림 ${j.done}장을 준비했어요`); if(opt.done) opt.done(j);
  }

  static async aiEventGen(dir,n,mk,cast,len,lore){ const snap=Core.artSnap(); const r=await Story.aiEventGen0(dir,n,mk,cast,len,lore); if(r) CoreView.artAfterAI(snap,'새 이벤트 「'+((r.ev&&r.ev.title)||'')+'」'); return r; }

  static async saveTextFile(text,name){ const b=new Blob([text],{type:'application/json'});
    if(IS_NATIVE&&CAP&&CAP.Filesystem){ const FS=CAP.Filesystem, path='가챠게임메이커/초안/'+name;
      try{ try{ if(FS.requestPermissions) await FS.requestPermissions(); }catch(e){ Core.quietErr(e,'0260-new-game/010-draft.js:22'); } await FS.writeFile({path,data:text,directory:'DOCUMENTS',encoding:'utf8',recursive:true}); CoreView.toast('Documents/'+path+' 에 저장했어요'); return; }
      catch(e){ try{ await FS.writeFile({path:name,data:text,directory:'CACHE',encoding:'utf8'}); const u=await FS.getUri({path:name,directory:'CACHE'}); if(CAP.Share){ await CAP.Share.share({title:name,files:[u.uri]}); return; } }catch(e2){ Core.quietErr(e2,'0260-new-game-draft.js:23'); } CoreView.toast('파일을 저장하지 못했어요. 코드 복사를 써 주세요'); return; } }
    const file=new File([b],name,{type:'application/json'});
    if(/iPhone|iPad|Android/i.test(navigator.userAgent)&&navigator.canShare&&navigator.canShare({files:[file]})){ try{ await navigator.share({files:[file],title:name}); return; }catch(e){ if(e&&e.name==='AbortError') return; } }
    System.downloadBlob(file,name); CoreView.toast('다운로드 폴더에 저장했어요 · '+name); }

    /* 전투 끝(Controller): 전투를 멈추고 정산 → 효과음 → 결과 창(출격 경로·레이드·탐사·탑은 각 기능의 끝 처리) */
static bEnd(win){
    if(B.ctx.kind==='practice'){v2StopPractice();return;}
    B.over=true; clearInterval(B.timer); try{ window.GGMVFX&&GGMVFX.clear(); }catch(e){} SystemView.bUpdate(); Economy.bump('battle'); // 공격 중이던 카드·이펙트가 결과 화면 위에 남지 않게
    const so=Battle.sortieResult(win); if(so!==null){ ChallengeView.bResultShow(so); return; } // 출격 경로(0487)
    if(B.ctx.kind==='raid'||B.ctx.kind==='rogue'||B.ctx.kind==='tower'){ ChallengeView.bResultShow(B.ctx.kind==='raid'?ChallengeCtl.raidEnd(win):B.ctx.kind==='tower'?ChallengeCtl.towerEnd(win):ChallengeCtl.rogueEnd(win)); return; }
    const R=Battle.stageSettle(win); Art.sfx(win?'승리':'패배'); ChallengeView.bResultShow(RulesView.stageResultHTML(R));
    if(R.mvp&&R.mvp.c.voiceId&&Core.SND().voiceLobby&&R.ml) setTimeout(()=>CoreView.speak(R.mvp.c,R.ml),700);
  }
}
