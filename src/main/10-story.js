/* ===== story — 기능 class(Model · View · Ctl) — docs/redesign.md 2·3절, tools/reshape.mjs가 매핑대로 옮김 ===== */
class Story {
    // Names are metadata only; saved runs and reward identifiers remain unchanged.
static explorationName(value){return typeof value==='string'&&value.trim()?value.replace(/\s+/g,' ').trim().slice(0,12):'미지 탐사';}

    /* src/main/0100-messenger.js — 갠톡 */
static fcSendPrompt({c,pool,lv,files,recent,text,f,opt}){ return `${Core.pf('FREE_CHAT',{RULES,ctx:World.ctx(),name:c.name,talk:System.T('talk'),playerName:playerName(),player:System.T('player'),faction:c.faction||'무소속',role:ROLE[c.role]||'',profile:c.profile||'',pool:pool.map(x=>'"'+x+'"').join(' / '),lv,files:files.length?'이 캐릭터가 이미 털어놓은 비밀: '+files.join(' / '):'',fcProgress:Story.fcProgress(),chapters:(()=>{ const m=G.chapters.filter(ch=>ch.kind==='main'&&ch.summary).slice(-2); return m.length?'최근 메인 스토리 요약: '+m.map(x=>x.title+' — '+x.summary).join(' / '):''; })(),relCtx:Core.relCtx(recent+'\n'+text,[baseChar(c).id,REL_ME],30),sum:f.sum?'예전 대화 요약: '+f.sum:'',recent,img:opt.img?Core.pf('FREE_CHAT_PHOTO_RECV',{playerName:playerName(),name:c.name}):'',fcPhotoOn:Messenger.fcPhotoOn()?Core.pf('FREE_CHAT_PHOTO'):''})}JSON만 출력: {"replies":["말풍선1","말풍선2"],"aff":0~2 정수(대화가 즐겁거나 의미 있었으면 1~2)${Messenger.fcPhotoOn()?',"photo":"사진을 보낼 때만, 장면 태그. 안 보내면 빈 문자열"':''}}`; }

    /* src/main/0250-story-factory.js */
static writeStagesPrompt({o,s,ch,outline,i,prevTail,n}){ return `【스토리 참조: 스테이지 집필】\n${RULES}\n${World.ctx(o.side,[o.castText,s.title,...(s.beats||[])].join(' '))}${o.memo||''}${o.plan?o.plan+'\n'+PLAN_WRITE_RULE:''}${Core.relCtx([s.title,...(s.beats||[]),o.castText||''].join(' '),o.castRefs,40)}\n${SCRIPT_FMT}\n\n${o.head}\n이야기 제목: ${ch.title}\n한 줄 줄거리: ${ch.logline||''}\n전체 구성:\n${outline}\n\n지금 쓸 부분: 스테이지 ${i+1} 「${s.title}」${Story.stageWhat(s)}\n이 스테이지의 장면 구성: ${(s.beats||[]).map((b,k)=>(k+1)+') '+b).join(' ')||'(자유롭게)'}\n${prevTail?Core.pf('PREV_TAIL')+'\n'+prevTail+'\n':''}\n${Core.pf('STAGE_WRITE_GUIDE',{detail:DETAIL_RULE,lines:s.story?Core.pf('STAGE_LINES_STORY',{pre:o.LS.pre,post:o.LS.post}):`pre는 ${o.LS.pre}줄, post는 ${o.LS.post}줄.${s.mode?'':BATTLE_FLOW}`,ending:i===n-1?Core.pf('STAGE_LAST_ENDING',{finale:finaleEnd()}):''})}\nJSON만 출력: {"pre":"대본","post":"대본"}`; }

  static writeStagesOutlineText({ch}){ return ch.stages.map((s,i)=>`${i+1}. ${s.title}${s.story?' (전투 없음)':''}: ${(s.beats||[]).join(' / ')}`).join('\n'); }

  static aiEventGen0LoreHintText({LORE,LALT}){ return LORE==='if'?Core.pf('EV_IF_STORY'):LALT?Core.pf('EV_ALT_STORY',{name:LALT.name}):''; }

    /* src/main/0465-story-plan.js */
static planAIPrompt({mode,p,n,instruction}){ return `${RULES}\n${World.ctx()}\n\n${Core.pf('PLAN_AI',{how:Core.pf(mode==='extend'?'PLAN_AI_EXTEND':mode==='improve'?'PLAN_AI_IMPROVE':'PLAN_AI_NEW',{plan:JSON.stringify(p).slice(0,3000)}),n,extra:instruction?'추가 지시: '+instruction+'\n':'',crew:System.T('crew')})}
  JSON만 출력: {"logline":"","theme":"","ending":"","acts":[{"name":"1막 이름","upto":4,"goal":""}],"twists":[{"id":"t1","truth":"","reveal":5,"who":"관련 인물","clues":[{"ch":2,"hint":""}]}],"branches":[{"id":"b1","at":3,"question":"","options":[{"label":"","result":""}]}],"arcs":[{"name":"캐릭터 이름","start":"","change":"","end":""}]}`; }

    /* src/main/0510-actions/040-story-and-authoring.js */
static aiepPrompt({c,dup,af,lv,stg,hint}){ return `${Core.pf('EPISODE',{RULES,ctx:World.ctx(),SCRIPT_FMT,name:c.name,profile:c.profile,lines:c.lines.join(' / '),files:System.T('files'),files2:c.files.filter(f=>f.dup<=dup).map(f=>f.text).join(' / ')||'없음',title:af?Core.pf('EPISODE_AFTER',{title:af.title,post:String(af.post||'').slice(0,400)}):'',lv,stg,dup:dup?Core.pf('EPISODE_SECRET',{limit:System.T('limit'),dup,files:System.T('files')}):'',episodes:c.episodes.map(x=>`Lv.${x.lv} ${x.title}`).join(', ')||'없음',hint:hint?'요청: '+hint:'',player:System.T('player')})}\nJSON만 출력: {"title":"제목","script":"대본"}`; }

  static aiepStgText({lv}){ return {1:'첫인상',2:'호기심과 첫 사적인 대화',3:'일상 속 해프닝',4:'신뢰, 과거의 일부를 털어놓음',5:'질투나 오해',6:'설렘, 서로를 의식함',7:'단둘이 위기를 넘김',8:'연인 직전의 긴장감',9:'과거의 상처와 마주함',10:'고백과 그 이후'}[lv]; }

  static aithreadPrompt({c,tv,hint}){ return `${Core.pf('THREAD_WRITE',{RULES,ctx:World.ctx(),THREAD_FMT,name:c.name,profile:c.profile,lines:c.lines.join(' / '),tv,own:Characters.own(c.id)?Core.affLv(Characters.own(c.id)):1,hint:hint?'요청: '+hint:'',player:System.T('player')})}\nJSON만 출력: {"title":"대화방 미리보기 제목","script":"대화"}`; }

  static stdetailPrompt({s0,ch0,j,nb}){ return `${Core.pf('STAGE_REWRITE',{RULES,ctx:World.ctx(),storyMemo:Story.storyMemo(),relCtx:Core.relCtx((s0.pre||'')+'\n'+(s0.post||''),[],40),SCRIPT_FMT,title:ch0.title,j:j+1,title2:s0.title,DETAIL_RULE,nb,story:s0.story?Core.pf('STAGE_REWRITE_STORY'):Core.pf('STAGE_REWRITE_BATTLE'),pre:s0.pre||'',post:s0.post||''})}\nJSON만 출력: {"pre":"","post":""}`; }

  static stdetailNbText({ch0,j}){ return [ch0.stages[j-1],ch0.stages[j+1]].map((x,k)=>x?`${k?'다음':'이전'} 스테이지 「${x.title}」 ${k?'시작':'끝'}: ${String(k?x.pre:(x.post||x.pre)||'').split('\n').slice(k?0:-8,k?8:undefined).join(' / ')}`:'').filter(Boolean).join('\n'); }

  static aiworldPrompt({kw}){ return `${Core.pf('WORLD_QUICK',{RULES,kw,EXPLORATION_NAME_RULE})}\nJSON만 출력: {"name":"","summary":"2~3문장","lore":"6~10문장","plot":"6~10문장","factions":[{"name":"","desc":"한 문장"}],"terms":{"player":"","crew":"","talk":"","currency":"","gold":"","gacha":"","ops":"","abyss":""}} 세력은 3~5개.`; }

    /* src/main/0530-story-memory.js */
static smExtractPrompt({i,parts}){ return `${Core.pf('SM_EXTRACT',{part:i+1,parts:parts.length})}JSON만 출력: {"text":"기록"}\n[대본]\n${parts[i]}`; }

  static smExtractPrompt2({ch,records}){ return `${Core.pf('SM_EXTRACT_FINAL',{title:ch.title})}JSON만 출력: {"text":"상세 기억","brief":"짧은 기억","unresolved":"미해결 사항"}\n${records.join('\n\n')}`; }

  static auditAIStagePrompt({ch,s}){ return `${Core.pf('AUDIT_STAGE',{RULES,ctx:World.ctx(),SCRIPT_FMT,title:ch?ch.title:'',title2:s.title||''})}\nJSON만 출력: {"pre":"대본"}`; }

  static storyMemo(){const all=G.chapters.filter(ch=>ch.kind==='main'),recent=all.slice(-SM_LIMITS.recent),older=all.slice(0,-SM_LIMITS.recent);let budget=0;const old=[];
   for(const ch of [...older].reverse()){const text=String(ch.memory?.brief||ch.summary||Story.sysDigest(ch)).slice(0,SM_LIMITS.older),row=ch.title+': '+text;if(budget+row.length>12000)continue;budget+=row.length;old.unshift(row);}
   const rows=[...old,...recent.map(ch=>ch.title+':\n'+String(ch.memory?.text||ch.summary||Story.sysDigest(ch)).slice(0,SM_LIMITS.summary))];
   const unresolved=older.filter(ch=>ch.memory?.unresolved).map(ch=>ch.title+': '+ch.memory.unresolved);let total=0;const carry=unresolved.filter(x=>{total+=x.length;return total<=8000;});
   const ev=G.chapters.filter(ch=>ch.kind==='event'&&ch.summary&&!Story.loreOf(ch)).slice(-3).map(c=>c.title+': '+String(c.summary).slice(0,1000));
   return rows.length||ev.length?Core.pf('SM_MEMO')+rows.join('\n\n')+(carry.length?'\n오래된 장의 미회수 사항:\n'+carry.join('\n'):'')+(ev.length?'\n최근 정사 외전:\n'+ev.join('\n'):'')+'\n':'';}

    /* src/main/0100-messenger.js — 갠톡 */
static fcProgress(){ const st=(typeof World.mainStages==='function'?World.mainStages():[]).filter(s=>P().cleared[s.id]); return st.length?st.map(s=>s.code+' '+s.title).join(', '):'아직 이야기를 시작하지 않았다'; }

    // 요약이 없는 장의 기본 기억: 등장 인물과 스테이지 흐름
static sysDigest(ch){ const cast=new Set(); (ch.stages||[]).forEach(s=>Core.stageCast(s,false).forEach(x=>cast.add(Core.relName(x)))); return `${Story.chLogline(ch)?Story.chLogline(ch)+' ':''}등장: ${[...cast].slice(0,10).join(', ')||'없음'}. 흐름: ${ch.stages.map(s=>s.title).join(' → ')}`; }

    /* src/main/0488-stage-modes.js */
static stageWhat(s){ return s.story?' — 전투 없는 이야기 스테이지':STAGE_KIND[s.mode]?` — ${STAGE_KIND[s.mode]}. ${STAGE_WRITE_RULE}`:' — 전투 전(pre)과 전투 후(post)'; }

  static rulesText(){const tone=String((G.meta&&G.meta.tone)||'').trim();return Player.genderText()+Player.callText()+NewGame.castRule()+Core.pf('COMMON_RULES',{tone:tone?Core.pf('TONE_RULE',{tone}):'',player:System.T('player'),currency:System.T('currency'),gacha:System.T('gacha'),ops:System.T('ops'),abyss:System.T('abyss'),crew:System.T('crew'),talk:System.T('talk'),elems:ELEMS.join(', ')+(Rules.elemLine()?` (${Rules.elemLine()})`:'')});}

    // 이미 만든 이벤트 소재를 알려 줘서 같은 얘기를 또 하지 않게 해요
static evPastHint(skip){ const L=(G.events||[]).filter(e=>e&&e.id!==skip).slice(-12).map(e=>`${e.title}${e.desc?'('+String(e.desc).slice(0,40)+')':''}`); return L.length?Core.pf('EV_PAST',{list:L.join(' / ')}):''; }

  static smNotes(side){if(side)return '';const notes=String(Story.smState().notes||'');return notes?Core.pf('SM_NOTES')+notes+'\n':'';}

  static sceneOf(){return Object.assign({},Core.SND().scene,(typeof G!=='undefined'&&G&&G.prog&&G.prog.scene)||{});}

  static enemyNames(g){const set=new Set(['훈련 표적','강화 표적','훈련 교관']);(g.chapters||[]).forEach(ch=>(ch.stages||[]).forEach(s=>(s.enemies||[]).forEach(e=>{if(e&&e.name)set.add(String(e.name));})));return [...set];}

  static syncEnemies(g,looks){ g=g||G; let n=0; const lk=looks||{}, rz=lk.__reuse||{}, EL=(g.meta&&g.meta.title)===DEFAULT_META.title&&!(g.meta&&g.meta.draft)?ENEMY_LOOKS:{}; // 샘플 적 외형은 샘플 게임에서만(다른 세계관에 섞이지 않게)
    const boss=new Set(); (g.chapters||[]).forEach(ch=>(ch.stages||[]).forEach(st=>(st.enemies||[]).forEach(e=>{ if(e&&e.boss) boss.add(e.name); })));
    Story.enemyNames(g).forEach(nm=>{ let l=g.lib.find(x=>x.kind==='enemy'&&x.name===nm);
      if(!l){ let alias='';
        if(!boss.has(nm)&&!(g.chars||[]).some(c=>c.name===nm)&&!EL[nm]){ const pool=g.lib.filter(x=>x.kind==='enemy'&&!x.alias&&!x.charId&&(x.prompt||x.img)&&!boss.has(x.name));
          const want=rz[nm]&&pool.find(x=>x.name===rz[nm]); if(want) alias=want.id; else if(pool.length&&(!lk[nm]||pool.length>=ENEMY_KEEP)) alias=pool[Core.hashN(nm)%pool.length].id; }
        l={id:'n'+Math.random().toString(36).slice(2,10),kind:'enemy',name:nm,prompt:alias?'':String(lk[nm]||EL[nm]||''),img:null}; if(alias) l.alias=alias; g.lib.push(l); n++; if(typeof Core.mark==='function'&&g===G) Core.mark('l:'+l.id); }
      else if(!l.prompt&&(lk[nm]||EL[nm])){ l.prompt=String(lk[nm]||EL[nm]); if(typeof Core.mark==='function'&&g===G) Core.mark('l:'+l.id); }
      { const BI=(g.meta&&g.meta.bestiary)||{}, info=BI[nm]||(EL===ENEMY_LOOKS&&ENEMY_INFO[nm]); if(info&&!l.desc&&!l.charId) Object.assign(l,info); } // 적 도감: 생성기가 만든 것(meta.bestiary) · 샘플
      const ch=(g.chars||[]).find(c=>c.name===nm); if(ch&&ch.naiPrompt&&l.prompt!==ch.naiPrompt&&!l.img){ l.prompt=ch.naiPrompt; l.charId=ch.id; if(typeof Core.mark==='function'&&g===G) Core.mark('l:'+l.id); } });
    return n; }

  static seenText(){ const p=P(), k=Object.keys(p.cleared||{}).length+'|'+Object.keys(p.owned||{}).length+'|'+(p.seenOpening?1:0); if(k===SEEN_K) return SEEN_T;
    const L=[p.seenOpening&&G.opening?String(G.opening.prologue||''):'']; G.chapters.forEach(ch=>ch.stages.forEach(s=>{ if(p.cleared[s.id]) L.push(s.pre||'',s.post||''); }));
    G.chars.forEach(c=>{ if(p.owned[c.id]) L.push(c.name); }); SEEN_K=k; SEEN_T=L.join('\n'); return SEEN_T; }

  static stageCode(id){const m=World.mainStages().find(s=>s.id===id);if(m)return m.code;let ei=0;for(const ch of G.chapters){if(ch.kind==='main')continue;ei++;const si=ch.stages.findIndex(s=>s.id===id);if(si>=0)return `EV${ei}-${si+1}`;}return '?';}

  static trigOk(t){
    const c=threadChar(t); if(!c||c.monster) return false;
    if(t.needOwn!==false&&!Characters.own(c.id)) return false;
    const g=t.trigger||{type:'start'};
    if(g.type==='start') return true;
    if(g.type==='aff') return !!Characters.own(c.id)&&Core.affLv(Characters.own(c.id))>=(+g.value||1);
    if(g.type==='clear') return !!P().cleared[g.value];
    return false;
  }

  static progK(){ const main=G.chapters.filter(ch=>ch.kind==='main'); let k=0; main.forEach((ch,i)=>{ if(ch.stages.some(s=>P().cleared[s.id])) k=i; }); return k; }

  static modeIcon(s){ return s&&s.mode==='debate'?'⚖':s&&s.mode==='contest'?'✦':''; }

  static async auditAIStage(s){ const ch=G.chapters.find(c=>(c.stages||[]).includes(s)); const r=await Core.aiJSON(Story.auditAIStagePrompt({ch,s}),null,'default'); if(!r||!r.pre) return false; s.pre=String(r.pre); LiveOps.auditMarkObj(s); return true; }

  static async liveTick(force){
    if(typeof BACKUP_BUSY!=='undefined'&&BACKUP_BUSY)return;
    if(LIVE_RUN||!P().seenOpening) return;
    const L=P().live, on=System.subLocked()?{pass:L.on.pass}:L.on, now=new Date(); // 구독 게임: 시즌·확률 업·새 이벤트·의상·장·톡을 스스로 만들지 않아요(패스 월 초기화만)
    const keys={day:LiveOps.cycKey('talk'),week:LiveOps.cycKey('event'),rot:LiveOps.cycKey('rotate'),chap:LiveOps.cycKey('chapter'),month:now.getFullYear()+'-'+(now.getMonth()+1)};
    if(!force&&!L.last.day){ L.last=Object.assign({},keys); Core.mark('prog'); await LiveOpsCtl.liveFillRun(on); return; } // 첫 실행: 주기는 지금부터 세고, 빈 콘텐츠 채우기만(0537)
    // 주기를 바꾸거나 새로 생긴 항목은 바로 만들지 않고 지금부터 세요
    Object.keys(keys).forEach(k=>{ if(L.last[k]==null||(k!=='month'&&String(L.last[k]).split(':').slice(0,2).join(':')!==String(keys[k]).split(':').slice(0,2).join(':')&&String(keys[k]).includes(':'))) L.last[k]=keys[k]; });
    if(L.last.skin!=null&&!/^(season|rotate):/.test(String(L.last.skin))) L.last.skin=LiveOps.skinPeriodKey(); // 예전 형식이면 지금부터 세요
    const due=k=>force||L.last[k]!==keys[k], notes=[], fillNotes=[];
    LIVE_RUN=true; LiveOpsView.liveBar('업데이트 확인 중…');
    try{
      if(on.season&&(force==='season'||!L.season||Date.now()>=(L.season.until||0))){ const nx=LiveOps.seasonNext(); if(nx){ await Acquire.seasonStart(nx,notes); L.last.rot=keys.rot; L.last.week=keys.week; } }
      if(on.rotate&&due('rot')&&!on.season){ const r=Acquire.rotatePickups(); if(r) notes.push(r); L.last.rot=keys.rot; }
      // 새 의상은 시즌(시즌을 끄면 확률 업 교체 주기)이 바뀔 때 한 번만. 처음 켤 때는 만들지 않고 지금부터 세요
      if(on.skin&&SAMPLE){ const sk=LiveOps.skinPeriodKey(); if(L.last.skin==null&&force!=='skin') L.last.skin=sk;
        else if(force==='skin'||L.last.skin!==sk){ if(!Characters.skinShopList().some(x=>x.k.period===sk)){ LiveOpsView.liveBar('새 '+System.T('skin')+'을 만드는 중…'); await LiveOps.skinAuto(notes,sk); } L.last.skin=sk; } }
      if(due('month')&&on.pass&&!force){ P().pass={xp:0,got:[]}; notes.push(`${System.T('pass')} 새 시즌이 시작됐어요`); }
      if(!on.season&&due('week')&&(on.event||on.rerun)){
        const act=G.events.filter(e=>e.active!==false&&Acquire.gateOpen(e)), past=G.events.filter(e=>e.active===false);
        const close=()=>act.forEach(e=>{e.active=false;const bn=G.banners.find(x=>x.id===e.bannerId); if(bn&&!e.keepBanner) bn.active=false;});
        let opened=null;
        if(on.rerun&&past.length&&(!on.event||!SAMPLE||Math.random()<0.25)){ const ev=rand(past); close(); ev.active=true; P().shopBuy[ev.id]={}; const bn=G.banners.find(x=>x.id===ev.bannerId); if(bn)bn.active=true; opened=`복각 이벤트 「${ev.title}」가 다시 열렸어요`; }
        else if(on.event&&SAMPLE){ LiveOpsView.liveBar('새 이벤트를 만드는 중… 몇 분 걸려요. 그동안 플레이해도 돼요.'); const res=await CoreCtl.aiEventGen('',3,true,[]);
          if(res){ act.forEach(e=>{if(e!==res.ev){e.active=false;const b=G.banners.find(x=>x.id===e.bannerId); if(b&&!e.keepBanner) b.active=false;}}); opened=`새 이벤트 「${res.ev.title}」 개최${res.nc?`, 한정 ${System.T('crew')} ${res.nc.name} 등장`:''}`; LiveOps.bondNote((res.ncs||[]).slice(1),notes); } }
        if(opened){ if(act.length) notes.push(`이벤트 종료: ${act.map(e=>e.title).join(', ')}`); notes.push(opened); }
        L.last.week=keys.week;
      }
      if(!on.season&&due('chap')&&on.chapter&&SAMPLE){
        if(!Story.nextStage()){ LiveOpsView.liveBar('메인 스토리 다음 장을 쓰는 중…'); const res=await StoryCtl.aiChapterGen('메인 플롯을 따라 자연스럽게 이어서',Core.storyN(4),[]); if(res){ notes.push(`메인 스토리 「${res.ch.title}」 공개`); LiveOps.bondNote(res.newc,notes); } }
        else notes.push('아직 진행 중인 메인 장이 있어서 새 장은 다음 주기로 미뤘어요');
      }
      if(due('chap')) L.last.chap=keys.chap;
      if(due('month')) L.last.month=keys.month;
      if(due('day')){ if(on.talk&&SAMPLE){ LiveOpsView.liveBar('새 메시지를 쓰는 중…'); const n=await Messenger.dailyTalks(); if(n) notes.push(`${System.T('talk')} 새 대화 ${n}개`); } L.last.day=keys.day; } await LiveOpsCtl.liveFillStep(on,fillNotes); /* 빈 포크 기능 내용 자동 채움(0537) */
    }catch(e){ console.log(e); }
    finally{ LIVE_RUN=false; LiveOpsView.liveBar(null); }
    Core.mark('prog'); LiveOpsView.liveFillNotes(notes,fillNotes);
    const todo=Art.drawTodo().length;
    if(notes.length){ if(todo) notes.push(`NAI로 그릴 이미지가 ${todo}개 쌓였어요. 공지 화면에서 한 번에 그릴 수 있어요`);
      L.notices.unshift({at:Date.now(),title:`${LiveOps.dayKey()} 업데이트`,lines:notes}); Economy.sendMail({from:'운영팀',title:`${LiveOps.dayKey()} 업데이트 기념 보급`,body:'새 소식\n· '+notes.join('\n· '),reward:{gems:200,gold:5000},days:14}); L.notices=L.notices.slice(0,30); Challenge.render(); LiveOpsView.openNotice(0); MessengerCtl.checkTriggers(); }
    else if(force) CoreView.toast('새로 생긴 업데이트가 없어요'); if(tab==='lobby') Challenge.render();
  }

    /* 장·이벤트를 끝까지 깨면 그 이야기에서 만난 인물이 인연으로 합류해요 */
static recruitCheck(ch,s){ if(!ch||!s||ch.stages[ch.stages.length-1]!==s) return; (ch.recruits||[]).map(charById).filter(Boolean).forEach(c=>CharactersCtl.joinChar(c,`「${ch.title}」에서 만난 인연으로`)); const ev=ch.eventId&&G.events.find(e=>e.id===ch.eventId), gc=ev&&ev.gift&&charById(ev.gift); if(gc) CharactersCtl.joinChar(gc,`이벤트 「${ev.title}」 배포로`); }

    /* 공유 팩 해금: 받은 게임(meta.gated)에서는 픽업·이벤트가 메인 스토리 진행(깬 스테이지 수 gate)에 맞춰 차례로 열려요 */
static mainCleared(){ const p=P(); return G.chapters.filter(ch=>ch.kind==='main').reduce((n,ch)=>n+ch.stages.filter(s=>p.cleared[s.id]).length,0); }

  static uiPageScrollKey(){return JSON.stringify([Core.PJ().active,tab,tab==='studio'?STTAB:'',tab==='evd'?P().curEvent:'',tab==='ops'?OPS_CH:'']);}

  static nextStage(){ const main=G.chapters.filter(ch=>ch.kind==='main'); for(const [ci,ch] of main.entries()) for(const [si,s] of ch.stages.entries()) if(!P().cleared[s.id]) return {ch,s,code:(ci+1)+'-'+(si+1)}; return null; }

  static ensureChMap(ch){let l=Art.chMapLib(ch); if(!l){ l=Art.chMapNew(ch); G.lib.push(l); Core.mark('l:'+l.id); } return l;}

  static epLock(c,e,o){
    if(!o) return '미보유';
    if(Core.affLv(o)<e.lv) return `호감도 Lv.${e.lv}`;
    if(e.dup&&o.dup<e.dup) return `${System.T('limit')} ${e.dup}단계`;
    if(e.after&&!P().cleared[e.after]) return `${Story.stageCode(e.after)} 클리어`;
    return '';
  }

  static capExtra(){ try{ return 5*Math.max(0,Math.floor(Story.progK())-9); }catch(e){ return 0; } }

  static rebalanceChapter(ch,k){ (ch.stages||[]).forEach((s,i)=>{ const last=i===ch.stages.length-1; if(s.enemies) s.enemies=s.enemies.map(e=>Challenge.fitEnemy(e,Challenge.enemyTarget(k,i,e.boss||(last&&s.enemies.length===1)))); }); }

  static parseEnemies(t){
    return lines(t).map(l=>{const p=l.split(/[,，]/).map(x=>x.trim());
      return {name:p[0]||'적',elem:ELEMS.includes(p[1])?p[1]:'홍',hp:num(p[2],1,999999,800),atk:num(p[3],1,9999,70),def:num(p[4],0,9999,30),spd:num(p[5],30,300,90),boss:/보스|boss/i.test(p[6]||'')};}).slice(0,6);
  }

  static readChForm(){
    chDraft.title=$('#ch_title').value.trim()||chDraft.title;
    chDraft.stages.forEach((s,j)=>{s.title=$('#st_t_'+j).value.trim()||s.title;s.reward=num($('#st_r_'+j).value,0,99999,300);
      const en=Story.parseEnemies($('#st_e_'+j).value), old=s.enemies||[]; en.forEach((e,i)=>{ const o=old[i]; e.manual=o&&o.name===e.name&&o.elem===e.elem&&o.hp===e.hp&&o.atk===e.atk&&o.def===e.def&&o.spd===e.spd?!!o.manual:true; if(o&&o.look&&!e.look) e.look=o.look;if(o&&o.pattern)e.pattern=o.pattern;if(o&&o.skills)e.skills=o.skills; }); if(JSON.stringify(en)!==JSON.stringify(old))delete s.combatBalance;s.enemies=en.length?en:s.enemies; s.pre=$('#st_pre_'+j).value; s.post=$('#st_post_'+j).value;
      const sto=$('#st_s_'+j); if(sto){ if(sto.checked){ s.story=true; } else { delete s.story; if(!s.enemies.length) s.enemies=[{name:'적',elem:ELEMS[0],hp:900,atk:80,def:35,spd:95,boss:false}]; } } });
  }

    // 스토리를 지우면 그 스토리에서 생긴 톡·도감·CG·관계 기록·인연 대원도 골라서 같이 지워요
static relSrcOf(ch){ if(!ch) return []; if(ch.kind==='event') return ['외전 「'+ch.title+'」',ch.title]; const k=G.chapters.filter(c=>c.kind==='main').indexOf(ch); return [(k+1)+'장',ch.title]; }

  static storyLinks(ids,ch,ev){ ids=new Set(ids); const stg=[]; G.chapters.forEach(c=>(c.stages||[]).forEach(st=>{ if(ids.has(st.id)) stg.push(st); }));
    const threads=G.threads.filter(t=>t.trigger&&t.trigger.type==='clear'&&ids.has(t.trigger.value));
    const codex=World.cxStore().filter(x=>x.unlock&&x.unlock.type==='clear'&&ids.has(x.unlock.value));
    const names=kind=>{ const n=new Set(); stg.forEach(st=>System.parseScript((st.pre||'')+'\n'+(st.post||'')).forEach(L=>{ if(L.type==='cmd'&&kind.includes(L.cmd)&&L.arg&&L.arg!=='끝') n.add(L.arg); })); return n; };
    let other=''; G.chapters.forEach(c=>(c.stages||[]).forEach(st=>{ if(!ids.has(st.id)) other+='\n'+(st.pre||'')+'\n'+(st.post||''); })); G.threads.forEach(t=>{ if(!threads.includes(t)) other+='\n'+(t.script||''); }); G.chars.forEach(c=>(c.episodes||[]).forEach(e=>other+='\n'+(e.script||''))); other+='\n'+((G.opening&&G.opening.prologue)||'');
    const usedElse=n=>other.includes(n);
    const cgN=names(['CG','cg']), prN=names(['소품','사진']);
    const libs=G.lib.filter(l=>(l.kind==='cg'&&cgN.has(l.name)&&!usedElse(l.name))||(l.kind==='prop'&&l.auto&&prN.has(l.name)&&!usedElse(l.name)));
    const recruit=new Set([...((ch&&ch.recruits)||[]),...(ev&&ev.gift?[ev.gift]:[])]);
    const chars=G.chars.filter(c=>!Characters.own(c.id)&&((c.debut&&ids.has(c.debut))||recruit.has(c.id)));
    const src=Story.relSrcOf(ch), titles=stg.map(st=>'「'+st.title+'」'), oldSys=r=>r.sys&&!r.stage&&(src.some(x=>String(r.note||'').startsWith(x+':'))||titles.some(x=>String(r.note||'').includes(x))),
      born=r=>((r.stage&&ids.has(r.stage))||(r.src&&src.includes(r.src))||oldSys(r)||((r.hist||[]).length&&(r.hist||[]).every(h=>src.includes(h.src))&&!r.src))&&!(r.hist||[]).some(h=>h.src&&!src.includes(h.src)), rels=World.RELS().filter(r=>born(r)||(r.hist||[]).some(h=>src.includes(h.src)));
    return {threads,codex,libs,chars,rels,src,ids:[...ids],born}; }

  static async aiJSONRetry(prompt,tier,tries){ for(let i=0;i<(tries||2);i++){ const r=await Core.aiJSON(prompt,null,tier); if(r) return r; await wait(1500); } return null; }

  static async writeStages(ch,o){ const n=ch.stages.length, outline=Story.writeStagesOutlineText({ch});
    for(let i=0;i<n;i++){ const s=ch.stages[i]; o.step(`집필 중 ${i+1}/${n} · ${s.title}`);
      const prev=i?ch.stages[i-1]:null, prevTail=prev?String(prev.post||prev.pre||'').split('\n').slice(-80).join('\n').slice(-6000):String(o.prevTail||'');
      const r=await Story.aiJSONRetry(Story.writeStagesPrompt({o,s,ch,outline,i,prevTail,n}),'complex');
      if(r&&(r.pre||r.post)){ const pre=nl(r.pre), post=nl(r.post); if(s.story){ s.pre=[pre,post].filter(Boolean).join('\n')||s.pre; s.post=''; } else { s.pre=pre||s.pre; s.post=post||s.post; } }
      if(!s.pre) s.pre=(s.beats||[]).join('\n'); }
    Core.mark('ch:'+ch.id); }

    // 대본에 나왔는데 자료실에 없는 소품·사진·배경은 자료실에 넣어서 그림 준비에 잡히게 해요
static scanScriptAssets(){ const want=new Map(); const scan=t=>{ if(!t) return; System.parseScript(t).forEach(L=>{ if(L.type!=='cmd') return; if((L.cmd==='소품'||L.cmd==='사진')&&L.arg&&L.arg!=='끝') want.set(L.arg,want.get(L.arg)||'prop'); else if(L.cmd==='배경'&&L.arg) want.set(L.arg,'bg'); }); };
    G.chapters.forEach(ch=>(ch.stages||[]).forEach(s=>{ scan(s.pre); scan(s.post); })); G.threads.forEach(t=>scan(t.script)); G.chars.forEach(c=>(c.episodes||[]).forEach(e=>scan(e.script))); scan(G.opening&&G.opening.prologue);
    let n=0; want.forEach((kind,name)=>{ if(G.lib.some(l=>l.name===name)) return; if(kind==='bg'&&G.lib.some(l=>l.kind==='bg'&&(l.name.includes(name)||name.includes(l.name)))) return; const l={id:'l'+uid(),kind,name:String(name).slice(0,40),prompt:'',img:null,auto:true}; G.lib.push(l); Core.mark('l:'+l.id); Art.shAdopt(l); n++; }); return n; }

    // 이벤트의 로어 범위를 바꿔요: 이 이벤트가 남긴 관계 기록을 지우고, 새 범위로 대본에서 다시 정리해요
static evLoreSet(ev,nl){ const ch=G.chapters.find(c=>c.id===ev.chapterId); nl=Story.loreOf({lore:nl});
    if(ch){ Acquire.storyPurge(Story.storyLinks(ch.stages.map(s=>s.id),ch,ev),{rels:1}); }
    ev.lore=nl||undefined; ev.gen=Object.assign({},ev.gen||{},{lore:nl});
    if(ch){ ch.lore=nl||undefined; delete ch.relScan; Story.relFromScripts(ch,'외전 「'+ch.title+'」'); Core.mark('ch:'+ch.id); } Core.mark('prog'); }

    // 적 기본 능력치를 만든 뒤 v2BalanceChapter에서 실제 전투 시뮬레이션으로 조정
static sysEventFoes(ch){ (ch.stages||[]).forEach((s,i)=>(s.enemies||[]).forEach(e=>{ if(e.manual) return; const m=(1+0.08*i)*(e.boss?4.5:1); e.hp=Math.round(1100*m*(0.92+Math.random()*0.16)); e.atk=Math.round(85*(e.boss?1.3:1)*(1+0.05*i)); e.def=Math.round(42*(1+0.05*i)); e.spd=e.spd||95; })); }

  static smPrevious(ch){const s=ch?.stages?.at(-1);return String(s?.post||s?.pre||'').slice(-SM_LIMITS.previous);}

    /* 그때그때 즉흥으로 쓰지 않고, 큰 틀(로그라인·주제·결말·막 구성)·숨겨진 반전(진실·공개 장·복선)·분기(선택 → 이후 장에 반영)·캐릭터 아크를
     먼저 설계해 두고, 장을 쓸 때 그 장에 필요한 것만(막 목표·심을 복선·지금 밝힐 반전·아직 숨길 것·분기 결과) AI에 넘겨요.
     G.world.plan = {logline,theme,ending,acts[{name,upto,goal}],twists[{id,truth,reveal,clues[{ch,hint}],who}],branches[{id,at,question,options[{label,result}]}],arcs[{name,start,change,end}],notes}
     분기: 대본에 "[분기: id]" 다음 줄의 선택지를 고르면 P().flags[id]=번호(1부터) → 다음 장을 쓸 때 반영. 문서: docs/research/story-design.md */
static PLAN(){ return Core.gameRead('world.plan'); } // 읽기 — 바꿀 때는 gameSlot('world.plan')

  static planHas(){ const p=G.world.plan; return !!(p&&(p.logline||(p.acts||[]).length||(p.twists||[]).length)); }

    // 점검: 복선 없이 밝히는 반전, 공개 장 뒤에 있는 복선, 공개 장이 지났는데 대본에 없는 반전, 분기가 대본에 없음
static planCheck(){ const p=Story.PLAN(), main=G.chapters.filter(ch=>ch.kind==='main'), n=main.length, txt=i=>{ const ch=main[i-1]; return ch?(ch.stages||[]).map(s=>(s.pre||'')+'\n'+(s.post||'')).join('\n'):''; }, out=[];
    if(!p.logline) out.push('로그라인이 없어요'); if(!p.acts.length) out.push('막 구성이 없어요');
    p.twists.forEach(t=>{ const cl=(t.clues||[]).filter(c=>c.hint); if(!cl.length) out.push(`반전 「${t.truth.slice(0,20)}」에 복선이 없어요`); else if(cl.every(c=>+c.ch>=+t.reveal)) out.push(`반전 「${t.truth.slice(0,20)}」의 복선이 모두 공개 장(${t.reveal}장) 이후예요`);
      if(+t.reveal&&+t.reveal<=n&&!t.done) out.push(`${t.reveal}장이 이미 있는데 반전 「${t.truth.slice(0,20)}」 공개를 확인하지 않았어요(대본 확인 후 '공개됨' 표시)`); });
    p.branches.forEach(b=>{ if(+b.at<=n&&!txt(+b.at).includes('[분기: '+b.id+']')&&!txt(+b.at).includes('[분기:'+b.id+']')) out.push(`${b.at}장 대본에 분기 「${b.question.slice(0,20)}」([분기: ${b.id}])가 없어요`); if((b.options||[]).length<2) out.push(`분기 「${b.question.slice(0,20)}」의 보기가 2개 미만이에요`); });
    const last=p.acts.length?+p.acts.at(-1).upto:0; if(last&&n>last) out.push(`지금 ${n}장으로 설계한 막(~${last}장)을 넘었어요 — 다음 막을 설계해 주세요`);
    return out; }

  static async planAI(mode,rep,instruction){ const p=Story.PLAN(), n=G.chapters.filter(ch=>ch.kind==='main').length;
    const r=await Core.aiJSON(Story.planAIPrompt({mode,p,n,instruction}),rep,'complex');
    if(!r) return false; const old=Core.gameSlot('world.plan'), clean=Story.planClean(r);
    if(mode==='extend'){ old.acts.push(...clean.acts.filter(a=>+a.upto>(+(old.acts.at(-1)||{}).upto||0))); old.twists.push(...clean.twists.filter(t=>!old.twists.some(x=>x.id===t.id))); old.branches.push(...clean.branches.filter(b=>!old.branches.some(x=>x.id===b.id))); clean.arcs.forEach(a=>{ if(!old.arcs.some(x=>x.name===a.name)) old.arcs.push(a); }); }
    else G.world.plan=Object.assign(old,clean,{notes:old.notes||''});
    Core.mark('world'); return true; }

  static planClean(r){ const S=(v,n)=>String(v||'').trim().slice(0,n||200), N=v=>Math.max(1,Math.min(99,Math.round(+v||1)));
    return {logline:S(r.logline,160),theme:S(r.theme,80),ending:S(r.ending,200),acts:(r.acts||[]).slice(0,8).map(a=>({name:S(a.name,30),upto:N(a.upto),goal:S(a.goal)})).filter(a=>a.name),
     twists:(r.twists||[]).slice(0,8).map((t,i)=>({id:S(t.id,12).replace(/[^\w-]/g,'')||'t'+(i+1),truth:S(t.truth),reveal:N(t.reveal),who:S(t.who,40),clues:(t.clues||[]).slice(0,5).map(c=>({ch:N(c.ch),hint:S(c.hint,120)})).filter(c=>c.hint)})).filter(t=>t.truth),
     branches:(r.branches||[]).slice(0,6).map((b,i)=>({id:S(b.id,12).replace(/[^\w-]/g,'')||'b'+(i+1),at:N(b.at),question:S(b.question,120),options:(b.options||[]).slice(0,4).map(o=>({label:S(o.label,30),result:S(o.result,160)})).filter(o=>o.label)})).filter(b=>b.question),
     arcs:(r.arcs||[]).slice(0,8).map(a=>({name:S(a.name,20),start:S(a.start,80),change:S(a.change,80),end:S(a.end,80)})).filter(a=>a.name)}; }

    /* 시나리오는 게임이 구동될 때 AI가 처리(자동이 기본): 장을 쓰기 전에 설계가 없으면 처음부터, 설계된 막이 이번 장 앞에서 끝났으면 다음 막을 이어서 설계.
     사용자는 설정 → 시나리오 설계에서 직접 고치거나 AI에 추가 지시할 수 있어요. 구독 게임·글 AI 없음이면 하지 않음 */
static async planEnsure(n){ if(!SAMPLE||System.subLocked()) return false; const last=+((Story.PLAN().acts.at(-1)||{}).upto||0);
    if(!Story.planHas()) return Story.planAI('new',null);
    if(last&&last<n) return Story.planAI('extend',null);
    return false; }

  static smState(){return Core.gameRead('meta.storyMemory');} // 읽기 — 바꿀 때는 gameSlot('meta.storyMemory')

  static smFingerprint(ch){return System.hash(JSON.stringify((ch.stages||[]).map(s=>[s.title,s.pre,s.post]))).toString(36);}

  static smChunks(ch){const chunks=[];for(const [i,s]of (ch.stages||[]).entries()){const body='[스테이지 '+(i+1)+' '+s.title+']\n'+(s.pre||'')+'\n'+(s.post||'');for(let p=0;p<body.length;p+=SM_LIMITS.chunk)chunks.push(body.slice(p,p+SM_LIMITS.chunk));}return chunks;}

  static async smExtract(ch,{signal,onProgress=()=>{}}={}){const origin=G,pid=Core.PJ().active,fp=Story.smFingerprint(ch),parts=Story.smChunks(ch);if(!parts.length)throw Error('정리할 대본이 없습니다.');const check=()=>{if(signal?.aborted)throw Error('중단했습니다. 기존 기억은 유지됩니다.');if(G!==origin||Core.PJ().active!==pid||!G.chapters.includes(ch)||Story.smFingerprint(ch)!==fp)throw Error('게임 또는 대본이 바뀌어 결과를 적용하지 않습니다.');};
   const request=async(prompt)=>{check();if(!SAMPLE)throw Error('글 AI를 먼저 연결해 주세요.');const result=await SAMPLE.json(prompt,{modelTier:'default',signal});check();if(!result||typeof result.text!=='string'||!result.text.trim()||result.text.length>6000)throw Error('기억 응답이 비었거나 6,000자를 초과했습니다. 다시 정리해 주세요.');return result;};
   let records=[];for(let i=0;i<parts.length;i++){onProgress('대본 읽는 중 '+(i+1)+'/'+parts.length);const r=await request(Story.smExtractPrompt({i,parts}));records.push(r.text);}
   while(records.join('\n').length>24000){const next=[];let group=[],size=0;const batches=[];for(const r of records){if(size+r.length>12000&&group.length){batches.push(group);group=[];size=0;}group.push(r);size+=r.length;}if(group.length)batches.push(group);onProgress('전체 대본 기록을 합치는 중');for(const batch of batches){const r=await request(Core.pf('SM_EXTRACT_MERGE')+batch.join('\n\n'));next.push(r.text);}if(next.join('\n').length>=records.join('\n').length)throw Error('중간 기록을 충분히 정리하지 못했습니다. 기존 기억은 유지됩니다.');records=next;}
   onProgress('사건·관계·인지·복선을 정리하는 중');const r=await request(Story.smExtractPrompt2({ch,records}));if(String(r.brief||'').length>600||String(r.unresolved||'').length>1200)throw Error('짧은 기억 또는 미회수 기록이 범위를 초과했습니다.');return {version:1,text:r.text,brief:String(r.brief||''),unresolved:String(r.unresolved||''),fingerprint:fp,at:Date.now(),source:'ai',locked:false};}

    /* 최근 스토리 요청 기록: AI 연결이 알리는 요청 단계(창 이벤트 ggm-ai — start·ok·fail)를 듣고 스토리 참조 요청만 기록(요청 준비 → 응답 수신·실패). AI 연결은 스토리 기억을 모름 */
static smRecord({detail:d}){const prompt=String(d.prompt);if(!prompt.includes('【스토리 참조:'))return;if(d.phase==='start'){const label=(prompt.match(/【스토리 참조:([^】]+)】/)||[])[1]||'스토리';Core.gameSlot('meta.storyMemory').latestRequest={at:Date.now(),label,tier:d.tier,characters:prompt.length,prompt,status:'요청 준비'};Core.mark('meta');return;}
   if(!Story.smState().latestRequest)return;Core.gameSlot('meta.storyMemory').latestRequest.status=d.phase==='ok'?'응답 수신':'실패: '+d.error;Core.mark('meta');}

    // 파견 보상은 시간·인원에 비례(예전엔 순서대로 고정 표에서 붙어 0.5시간·1명짜리가 가장 큰 보상을 받기도 했음)
static async aiChapterGen0(dir,n,cast){
    const k=G.chapters.filter(c=>c.kind==='main').length,hl=Math.round(800*(1+.6*k)),hh=Math.round(1400*(1+.6*k)),al=Math.round(75*(1+.25*k)),ah=Math.round(105*(1+.25*k)),dl=30+15*k,dh=60+15*k;
    const SC=Battle.storyCfg(), deep=SC.depth!=='fast', LS=Core.lenSpec(), main=G.chapters.filter(c=>c.kind==='main'), lastPost=Story.smPrevious(main.at(-1));
    const step=StoryView.genStep('chapter','메인 스토리 '+(k+1)+'장'); step('시나리오 설계를 확인하는 중…'); await Story.planEnsure(k+1); /* 시나리오 설계 자동(0465) */
    {
      World.memCatchUp();
      const castRefs=cast.map(NewGame.relRef).filter(Boolean), memo=Story.storyMemo(), rel=Core.relCtx([dir,cast.join(' '),lastPost.slice(-6000)].join('\n'),castRefs,50);
      step(deep?'장 구성을 짜는 중…':'대본을 쓰는 중…');
      const r=await Core.aiJSON(Characters.aiChapterGen0Prompt({dir,cast,memo,rel,k,deep,lastPost,SC,n,LS}),null,'complex');
      if(!(r&&Array.isArray(r.stages)&&r.stages.length)){ return null; }
      const ch={id:uid(),ord:k,kind:'main',title:String(r.title||`${k+1}장`),logline:String(r.logline||'').slice(0,120),stages:Core.buildStages(r.stages,{max:12,reward:i=>300+150*k+100*i,elem:ELEMS[0],hp:hl,atk:al,def:dl,foe:'적'})};
      await v2BalanceChapter(ch,k);
      // 새 인물·자료를 먼저 넣어야 집필할 때 AI가 알아요
      const newc=Characters.addNewChars(r.newCharacters,SC.newc,ch.stages,{src:ch.title,ch}), npcs=Characters.addNpcs(r.newNpcs); World.stanceApply(r.stance,k+1); World.bestiaryApply(r.bestiary); Characters.debutResolve(ch); // 세력 관계 변화·적 도감·나중 등장 캐릭터(0445)
      let nb=Art.addLib('bg',r.backgrounds)+Art.addLib('bgm',r.music)+Art.addLib('prop',r.props)+Art.addCGs(r.cgs), nt=0;
      G.chapters.push(ch); Core.mark('ch:'+ch.id); Story.syncEnemies(G,NewGame.lookMap(r.stages)); try{ Core.cxFromChapter(r,ch); }catch(e){}
      if(deep){ await Story.writeStages(ch,{head:`메인 스토리 ${k+1}장. 방향: "${dir}".${newc.length?' 이 장에서 처음 만나는 신규 '+System.T('crew')+': '+newc.map(c=>c.name+'('+String(c.profile).slice(0,60)+')').join(', ')+'.':''}`,LS,step,memo,castRefs,castText:dir+' '+cast.join(' ')+' '+newc.map(c=>c.name).join(' '),prevTail:lastPost.split('\n').slice(-80).join('\n').slice(-6000),plan:LiveOps.planCtx(k+1)}); Characters.debutResolve(ch);
        step('요약·관계·'+System.T('talk')+'를 정리하는 중…'); const w=await StoryCtl.storyWrapUp(ch,'1~2'); if(w){ ch.summary=String(w.summary||'').slice(0,6000); NewGame.relApply(w.relations,`${k+1}장`); nt=Messenger.addThreads(w.threads,ch,true); } }
      else { const memoryResult=await StoryCtl.storyWrapUp(ch,'1~2',{followups:false});ch.summary=String(memoryResult?.summary||r.summary||'').slice(0,6000); NewGame.relApply(r.relations,`${k+1}장`); nt=Messenger.addThreads(r.threads,ch,true); }
      Story.relFromScripts(ch,`${k+1}장`); Core.mark('ch:'+ch.id); nb+=Story.scanScriptAssets();
      try{ await Characters.autoNpcs([ch]); }catch(e){ Core.quietErr(e,'0250-story-factory.js:120'); }
      return {ch,nb,nt,newc,nc:newc,npcs};
    }
  }

  static async aiEvent(t){
    const dir=$('#ae_d').value.trim(); if(!dir){CoreView.toast('이벤트 내용을 적어 주세요');return;}
    const n=+$('#ae_n').value, mk=$('#ae_new').value==='1', cast=[...document.querySelectorAll('.chip.on')].map(b=>charById(b.dataset.id)?.name).filter(Boolean), len=$('#ae_len')?$('#ae_len').value:'', lore=$('#ae_lore')?$('#ae_lore').value:'';
    if(!SAMPLE){ CoreView.toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; } CoreView.closeModal();
    CoreCtl.bgJob('event','이벤트 만드는 중',async()=>{ const res=await CoreCtl.aiEventGen(dir,n,mk,cast,len,lore); if(!res) return null; P().curEvent=res.ev.id;
      return {title:`이벤트 「${res.ev.title}」가 열렸어요`,body:`${System.T('event')} 화면에서 바로 플레이할 수 있어요.${res.nc?`\n이벤트를 끝까지 깨면 ${RL[res.nc.rarity]} ${res.nc.name}이(가) 배포 ${System.T('crew')}로 무료 합류해요.`:''}${res.ncs&&res.ncs.length>1?`\n새 인연: ${res.ncs.slice(1).map(c=>RL[c.rarity]+' '+c.name).join(', ')} — 이야기에서 만나면 상시 ${System.T('gacha')}에 합류해요.`:''}\n새 자료 ${res.nb}개가 추가됐어요.`}; });
  }

  static async aiEventGen0(dir,n,mk,cast,len,lore){ len=STORY_LEN[len]?len:Battle.storyCfg().len; const LS=STORY_LEN[len][1]; const LORE=Story.loreOf({lore}), LALT=LORE&&LORE!=='if'?charById(LORE):null;
    const loreHint=Story.aiEventGen0LoreHintText({LORE,LALT});
    if(!dir){ const mon=new Date().getMonth()+1; dir=`${mon}월의 계절감과 기념일을 살린 기간 한정 이벤트를 자유롭게 기획한다. 지난 이벤트(${G.events.map(e=>e.title).join(', ')||'없음'})와 겹치지 않게.`; }
    const SC=Battle.storyCfg(), deep=SC.depth!=='fast', ncN=mk?Math.max(1,SC.newc):0;
    const step=StoryView.genStep('event','이벤트');
    {
    World.memCatchUp(); const castRefs=[...cast.map(NewGame.relRef).filter(Boolean),...(LALT?[LALT.id]:[])], memo='', rel=Core.relCtx([dir,cast.join(' ')].join('\n'),castRefs,40);
    step(deep?'이벤트 구성을 짜는 중…':'이벤트를 쓰는 중…');
    const r=await Core.aiJSON(Core.aiEventGen0Prompt({rel,deep,dir,cast,loreHint,n,LS,ncN}),null,'complex');
    if(!r||!Array.isArray(r.stages)||!r.stages.length){ return null; }
    const evId='ev'+uid(), chId='evc'+uid(), bId='b'+uid(), ttl=String(r.title||'이벤트');
    const ch={id:chId,kind:'event',eventId:evId,ord:200,title:ttl,lore:LORE||undefined,logline:String(r.desc||'').slice(0,120),stages:Core.buildStages(r.stages,{max:6,reward:i=>60+30*i,elem:ELEMS[0],hp:1000,atk:80,def:40,foe:'적',title:'스테이지'})};
    const ncs=Characters.addNewChars(r.newCharacters&&r.newCharacters.length?r.newCharacters:r.newCharacter,ncN,ch.stages,{src:'외전 「'+ttl+'」',giftFirst:true}), nc=ncs[0]||null, npcs=Characters.addNpcs(r.newNpcs); World.bestiaryApply(r.bestiary);
    Story.sysEventFoes(ch); await v2BalanceChapter(ch,Math.max(0,G.chapters.filter(c=>c.kind==='main').length-1)); G.chapters.push(ch); Core.mark('ch:'+chId); Story.syncEnemies(G,NewGame.lookMap(r.stages));
    const ups=[...strs(r.pickup).map(nm=>Characters.findSpeaker(nm)).filter(Boolean).map(c=>c.id)]; if(nc) ups.unshift(nc.id);
    G.banners.push({id:bId,name:String(r.bannerName||r.title||'이벤트 배너'),type:'event',desc:String(r.desc||''),pool:{mode:'all',factions:[],ids:[]},pickup:[...new Set(ups)].slice(0,3),rate:60,active:true,bg:String(r.bg||''),eventId:evId});
    const ev={id:evId,lore:LORE||undefined,gift:nc?nc.id:'',gate:Story.mainCleared(),gen:{dir:String(dir||'').slice(0,4000),n,len,lore:LORE},title:ttl,desc:String(r.desc||''),token:String(r.token||'이벤트 토큰'),active:true,chapterId:chId,bannerId:bId,bg:String(r.bg||''),bgm:String(r.bgm||''),shop:[]};
    ev.shop=Core.defaultShop(ev); G.events.push(ev);
    let nb=Art.addCGs(r.cgs)+Art.addLib('bg',r.backgrounds)+Art.addLib('bgm',r.music)+Art.addLib('prop',r.props);
    const src='외전 「'+ttl+'」';
    if(deep){ await Story.writeStages(ch,{head:`기간 한정 이벤트 「${ttl}」: ${String(r.desc||'')}. 기획: "${dir}".${ncs.length?' 이 이벤트에서 처음 만나는 신규 '+System.T('crew')+': '+ncs.map(c=>c.name+'('+RL[c.rarity]+', '+String(c.profile).slice(0,60)+')').join(', ')+'.':''}`,LS,step,memo,side:true,castRefs,castText:dir+' '+cast.join(' ')+' '+ncs.map(c=>c.name).join(' ')});
      step('요약·관계·'+System.T('talk')+'를 정리하는 중…'); const w=await StoryCtl.storyWrapUp(ch,'1~2'); if(w){ ch.summary=String(w.summary||'').slice(0,6000); NewGame.relApply(w.relations,src,false,LORE); Messenger.addThreads(w.threads,ch,false); } }
    else { const memoryResult=await StoryCtl.storyWrapUp(ch,'1~2',{followups:false});ch.summary=String(memoryResult?.summary||r.summary||'').slice(0,6000); NewGame.relApply(r.relations,src,false,LORE); Messenger.addThreads(r.threads,ch,false); }
    Story.relFromScripts(ch,src); Core.mark('ch:'+chId); nb+=Story.scanScriptAssets();
    try{ await Characters.autoNpcs([ch]); }catch(e){ Core.quietErr(e,'0250-story-factory.js:156'); }
    Core.mark('prog'); return {ev,nc,ncs,nb,npcs};
    }
  }

  static planRead(){ const p=Core.gameSlot('world.plan'), lines=v=>String(v||'').split('\n').map(l=>l.split('|').map(s=>s.trim())).filter(x=>x[0]); document.querySelectorAll('#modal [data-pl]').forEach(el=>{ const k=el.dataset.pl.split('.'), v=el.type==='checkbox'?el.checked:el.value;
    if(k.length===1){ p[k[0]]=String(v).trim(); return; } const arr={a:'acts',t:'twists',b:'branches',r:'arcs'}[k[0]], o=p[arr][+k[1]]; if(!o) return;
    if(k[2]==='clues') o.clues=lines(v).map(([ch,hint])=>({ch:Math.max(1,+ch||1),hint:hint||''})).filter(c=>c.hint); else if(k[2]==='options') o.options=lines(v).map(([label,result])=>({label,result:result||''}));
    else if(['upto','reveal','at'].includes(k[2])) o[k[2]]=Math.max(1,+v||1); else o[k[2]]=typeof v==='boolean'?v:String(v).trim(); }); }

  static drLib(){ try{ const a=JSON.parse(appStorage.getItem(DRLIB)||'[]'); return Array.isArray(a)?a:[]; }catch(e){ return []; } }

  static drClean(d){ const x=JSON.parse(JSON.stringify(d||{})); delete x.undo; return x; }

  static draftFrom(t){ t=String(t||'').trim(); let o=null; const m=t.match(/GGMDRAFT:([A-Za-z0-9+/=\s]+)/);
    try{ if(m) o=JSON.parse(decodeURIComponent(escape(atob(m[1].replace(/\s+/g,''))))); else if(/^[\[{]/.test(t)) o=JSON.parse(t); }catch(e){ return null; }
    if(o&&o.d&&typeof o.d==='object') return {name:String(o.name||drName(o.d)).slice(0,40),d:o.d};
    if(o&&typeof o==='object'&&!Array.isArray(o)&&('chars' in o||'world' in o||'kw' in o||'auto' in o||'gtitle' in o)) return {name:drName(o),d:o}; // 초안 그대로 붙여 넣은 경우
    return null; }

  static drLen(d){ d=d||DR2; return [d.auto,d.kw,d.tone,d.story,d.world,d.setting,d.hero.name,d.hero.gender,d.hero.look,d.hero.bio,...d.chars.flatMap(c=>[c.name,c.role,c.profile,c.look,c.speech])].reduce((n,s)=>n+String(s||'').length,0); }

  static drLibSave(a){ try{ appStorage.setItem(DRLIB,JSON.stringify(a.slice(0,30))); return true; }catch(e){ CoreView.toast('저장 공간이 부족해요'); return false; } }

  static drLoadFrom(d,label){ try{ appStorage.setItem(DR2KEY,JSON.stringify(Story.drClean(d))); }catch(e){} DRTAB='theme'; StoryView.openDraft(); CoreView.toast(`「${label||drName(d)}」 초안을 불러왔어요. 고친 뒤 만들기를 누르면 새 게임으로 만들어져요`); }

  static async buildNewGameDraft(rep,draft,sourceProject){if(String(draft?.story||'').length>100000)throw Error('스토리는 최대 100,000자입니다. 초과 내용은 자르지 않았습니다.'); const RSRC=NewGame.reuseSrc(draft); // 원래 게임은 G를 새 게임으로 바꾸기 전에 잡아 둬요(지금 하던 게임을 리롤할 때)
    draft=draft||Core.drLoad(); const auto=draft.mode==='auto';
    const userTitle=String(draft.gtitle||'').trim().slice(0,30);
    const kw=(auto?String(draft.auto||''):String(draft.kw||'')).trim()||String(draft.world||'').slice(0,120).trim(); if(!kw){CoreView.toast('만들고 싶은 게임을 적어 주세요');return;}
    const tone=auto?'':String(draft.tone||'').trim(), th=auto?'auto':(draft.theme||'auto'), n=+draft.n||8, stat=m=>{if(rep)rep(m);};
    const ngSty=String((auto?'':draft.style)||'').trim()||(NewGame.presetQualityParts(Core.allPresets().find(x=>x.id===draft.preset)||{}).tags);
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
    const ng=Core.defaults(); ng.lib=ng.lib.filter(l=>!['bg','prop','cg','map'].includes(l.kind)); ng.world=NewGame.blankWorld(); /* 원본 샘플 게임의 배경·소품·세계관은 새 게임에 남기지 않아요 — 남으면 생성 프롬프트의 "기존 목록"으로 들어가 다른 세계의 장소가 대본에 섞여요 */ if(heroBlank&&a.hero&&typeof a.hero==='object'){ hero.gender=String(a.hero.gender||'').slice(0,40); hero.look=String(a.hero.look||'').slice(0,400); } if(hero){ ng.prog.player=String(hero.name||'').slice(0,12); ng.prog.genderTxt=String(hero.gender||''); ng.prog.gender=genderCode(hero.gender); ng.prog.look=String(hero.look||''); ng.prog.bio=String(hero.bio||''); ng.prog.hideEyes=!!hero.hide; ng.prog.nameAsked=true; }
    ng.meta=Object.assign(clone(DEFAULT_META),{title:userTitle||String(a.title||'새 게임'),sub:String(a.sub||''),theme:['tactical','fantasy','neon','pastel','noir'].includes(a.theme)?a.theme:'tactical',accent:/^#[0-9a-f]{6}$/i.test(a.accent||'')?a.accent:'#ffb400'});
    ng.meta.artTags=ngSty; { const sp=Core.allPresets().find(x=>x.id===draft.preset); if(sp&&ngSty===NewGame.presetQualityParts(sp).tags) ng.meta.artNeg=sp.neg; } ng.meta.tone=tone; ng.meta.castSex=CAST_SEX[draft.castSex]?draft.castSex:''; if(DT) ng.meta.bible=DT; ng.meta.story={plot:SC.plot,stages:SC.stages,len:SC.len,depth:draft.depth==='fast'?'fast':'deep',newc:draft.newc==null?2:+draft.newc,talkOnly:draft.talkOnly==null?1:+draft.talkOnly,finale:finaleOf(a.finale)}; /* 장의 마지막 스테이지 형식(장르에 따라) */
    ng.meta.terms=Object.assign(clone(DEFAULT_META.terms),a.terms||{}); ng.meta.terms.abyss=Story.explorationName(a.terms?.abyss); if(String(draft.crewTerm||'').trim()) ng.meta.terms.crew=String(draft.crewTerm).trim().slice(0,8); if(String(hero.call||'').trim()) ng.meta.terms.player=String(hero.call).trim().slice(0,12); try{ ng.meta.draft=Story.drClean(draft); }catch(e){} if(Array.isArray(a.elems)&&a.elems.length>=2){ const L=a.elems.slice(0,8).map((e,i)=>({d:String(e.d||'').slice(0,80),n:elemName(e.n||(DEFAULT_META.elems[i]||{}).n||'속성'+(i+1)),c:/^#[0-9a-f]{6}$/i.test(e.c||'')?e.c:(DEFAULT_META.elems[i]||{c:'#999999'}).c,beats:elemName(e.beats)})); if(new Set(L.map(e=>e.n)).size===L.length){ ng.meta.elems=L.map(({beats,...e})=>e); const N=L.map(e=>e.n), beats={}; L.forEach(e=>{ if(N.includes(e.beats)&&e.beats!==e.n) beats[e.n]=e.beats; }); ng.meta.rules=Object.assign(ng.meta.rules||{},Object.keys(beats).length?{beats}:{},{reactions:(Array.isArray(a.reactions)?a.reactions:[]).slice(0,6).map(x=>Object.assign({},x,{a:elemName(x&&x.a),b:elemName(x&&x.b)})).filter(x=>N.includes(x.a)&&N.includes(x.b)&&x.a!==x.b).map(NewGame.reactClean)}); } }
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
    ng.chapters[0].stages.forEach((s,i,a)=>{ const src=(ch.stages||[])[i]||{}, md=i<a.length-1||Battle.storyCfg().finale!=='battle'?NewGame.modeClean(src):null; if(md){ Object.assign(s,md); s.enemies=[]; return; } if(src.battle===false&&i<a.length-1){ s.story=true; s.enemies=[]; if(s.post){ s.pre=[s.pre,s.post].filter(Boolean).join('\n'); s.post=''; } return; } if(!s.enemies.length)s.enemies=[{name:'적',elem:ELEMS[0],hp:900,atk:80,def:35,spd:95,boss:false}]; const rt=NewGame.routeClean(src.route); if(rt) s.route=rt; }); /* 출격 경로 지점 이름(2장 이후와 같게) */
    ng.chapters[0].summary=String(c3.summary||'').slice(0,6000); ng.rels=[]; try{ NewGame.relApply(c3.relations,'프롤로그·1장',true); NewGame.relFromProfiles(true); Story.relFromScripts(ng.chapters[0],'1장',true); ng.meta.relProf=1; }catch(e){}
    const L=(kind,arr)=>(Array.isArray(arr)?arr:[]).filter(x=>x&&x.name).map(x=>({id:'l'+uid(),kind,name:String(x.name),prompt:String(x.prompt||''),img:null}));
    { const fresh=[...L('bg',c3.backgrounds),...L('prop',c3.props)].filter(l=>!KEEP.some(k=>k.kind===l.kind&&k.name===l.name)); ng.lib=[...KEEP,...fresh,...L('bgm',c3.music),...clone(DEFAULT_SFX)]; } Story.syncEnemies(ng,ng.__looks); delete ng.__looks; World.bestiaryApply(c3.bestiary,ng); { const sts=ng.chapters[0].stages; sts.forEach((s2,i)=>{ if(!s2.story) Story.stageAutoRules(s2,i,sts.length); }); } /* 적 도감·전장 규칙(0445·0485) */
    const mus=ng.lib.filter(l=>l.kind==='bgm').map(l=>l.name), pickM=(re,i)=>mus.find(m=>re.test(m))||mus[i]||'';
    const bn=c3.banners||{}, ssr=ng.chars.filter(c=>c.rarity===3), pu=ng.chars.find(c=>c.name===(bn.pickup&&bn.pickup.char)&&!c.debut&&!c.debutLater)||ssr.find(c=>!c.debut&&!c.debutLater)||ssr[0], fac=(()=>{ const hasSSR=f=>ng.chars.some(c=>c.faction===f&&c.rarity===3), want=(bn.faction&&bn.faction.faction)||''; return hasSSR(want)?want:((ng.chars.find(c=>c.rarity===3&&c.faction)||ng.chars[0]||{}).faction||''); })();
    ng.banners=[{id:'std',name:String(bn.std||'상시 '+System.T('gacha')),type:'std',desc:'',pool:{mode:'all',factions:[],ids:[]},pickup:[],rate:50,active:true,bg:''}];
    if(pu) ng.banners.push({id:'b_pu',name:String((bn.pickup&&bn.pickup.name)||pu.name+' 확률 업'),type:'pickup',desc:`SSR ${pu.name} 확률 상승`,pool:{mode:'all',factions:[],ids:[]},pickup:[pu.id],rate:50,active:true,bg:''});
    if(fac) ng.banners.push({id:'b_fac',name:String((bn.faction&&bn.faction.name)||fac+' 모집'),type:'pool',desc:`${fac} 소속만 등장`,pool:{mode:'faction',factions:[fac],ids:[]},pickup:[],rate:50,active:true,bg:''});
    const say1=NewGame.storySayNorms(ng.chapters[0]); ng.threads=(Array.isArray(c3.threads)?c3.threads:[]).map(x=>{const c=ng.chars.find(q=>q.name===String(x.char||'').trim());if(!c||!x.script||NewGame.threadDup(nl(x.script),say1))return null;const st=ng.chapters[0].stages[Math.min(ng.chapters[0].stages.length,Math.max(1,+x.afterStage||1))-1];return {id:uid(),charId:c.id,title:String(x.title||'메시지'),trigger:x.trigger==='start'?{type:'start'}:{type:'clear',value:st.id},needOwn:x.trigger==='start',script:nl(x.script)};}).filter(Boolean);
    ng.events=[]; { const keep=hero?{player:ng.prog.player,genderTxt:ng.prog.genderTxt,gender:ng.prog.gender,look:ng.prog.look,bio:ng.prog.bio,hideEyes:ng.prog.hideEyes,nameAsked:true}:null; ng.prog=clone(DEFAULT_PROG); ng.prog.gender=gen; if(keep) Object.assign(ng.prog,keep); }
    const bgs=ng.lib.filter(l=>l.kind==='bg').map(l=>l.name);
    ng.prog.lobbyBg=bgs[0]||''; ng.prog.titleBg=bgs[bgs.length-1]||'';
    const snd=Core.SND(); snd.scene={title:pickM(/타이틀|title/i,0),lobby:pickM(/로비|lobby/i,1),battle:pickM(/전투|battle/i,4),boss:pickM(/보스|boss/i,5),gacha:pickM(/뽑기|소환|계약|gacha|summon/i,6)};
    ng.prog.scene=clone(snd.scene); ng.ver=VER; const id2='g'+uid(); const RU=Characters.artReuse(ng,RSRC); if(RU){ stat(`원래 게임의 그림을 옮기는 중… (${System.T('crew')} ${RU.nc}명 · NPC ${RU.nn}명 · 배경 등 ${RU.nl}개)`); await NewGame.artReuseCopy(RU,id2); ng.prog.castDone=RU.nc>=ng.chars.filter(c=>c.naiPrompt).length; }
    { let b=null, tags=hero.av||''; try{ if(hero.av) b=await Core.idbGet('draft_avatar'); if(!b&&!(RU&&ng.prog.avatar)&&String(hero.look||'').trim()&&Core.imgReady()){ stat('주인공 프로필 그림을 그리는 중…'); tags=await NewGame.heroTags(hero); if(tags) b=await NewGame.naiDraw('char',tags,{frame:'cowboy shot',pose:'looking at viewer'}); }
        if(b){ const av={id:'pav_'+uid(),kind:'char',name:'플레이어',prompt:tags,img:{idb:true}}; await NewGame.idbPut(id2+'::'+av.id,b); ng.prog.avatar=av; } }catch(e){ CoreView.toast('프로필 그림은 나중에 설정 → 플레이어에서 그려 주세요'); } }
    if(RU&&RU.ids.some(x=>ng.prog.avatar&&x===ng.prog.avatar.id)){ /* 원래 프로필 그림을 그대로 썼어요 */ }
    G=oldG;
    if(sourceProject&&Core.PJ().active!==sourceProject)throw Error('게임이 바뀌어 새 게임 적용을 중단했습니다');await Core.flush();
    LiveOps.ngFinish(ng,draft); const pj=Core.PJ();pj.list.push({id:id2,title:ng.meta.title});pj.active=id2; await appStorage.commitRecords({[System.pjKey(id2)]:JSON.stringify(ng),[PJKEY]:JSON.stringify(pj)});
    try{ appStorage.removeItem('ggm-ng-draft'); }catch(e){}
    stat('완성! 새 게임으로 전환해요.'); setTimeout(()=>SystemView.reloadGame(),900);
  }

  static async handleStoryAndAuthoringAction(a,t,id,p,e){
    switch(a){
  case 'cxcat': CXCAT=t.dataset.v; Challenge.render(); break;
  case 'cxview': WorldView.openCx(t.dataset.k); break;
  case 'cxadd': WorldView.openCxEdit(''); break;
  case 'relopen': case 'relgo': CharactersView.openRel(t.dataset.r||REL_ME); break;
  case 'relseed': { const n=await Core.relSeedAI(CoreView.uiProg(t)); if(n){ CoreView.toast(`관계 ${n}개를 정리했어요`); CharactersView.openRel(); } break; }
  case 'reladd': { const bn=$('#rl_b').value, k=$('#rl_k').value.trim(), nt=$('#rl_n').value.trim(); if(!bn||bn===RELC) break; if(!k&&!nt){ CoreView.toast('관계나 설명을 적어 주세요'); break; }
        let r=Core.relPair(RELC,bn); if(r){ if(k) r.kind=k; if(nt) r.note=nt; } else { r={id:'r'+uid(),a:RELC,b: bn,kind:k||'아는 사이',note:nt,hist:[]}; World.relPut(r); } r.at=Date.now(); Core.mark('meta'); CharactersView.openRel(); break; }
  case 'reledit': CoreView.openRelEdit(id); break;
  case 'relsave': { const r=Core.gameSlot('rels').find(x=>x.id===id); if(!r) break; r.kind=$('#rle_k').value.trim().slice(0,16)||r.kind; r.note=$('#rle_n').value.trim().slice(0,240);
        r.hist=lines($('#rle_h').value).slice(-12).map(l=>{ const m=l.match(/^(.{1,12}?) · (.+)$/); return m?{src:m[1],text:m[2]}:{src:'',text:l}; }); Core.mark('meta'); CharactersView.openRel(); break; }
  case 'reldel': { const r=World.RELS().find(x=>x.id===id); if(!r||!(await appConfirm(`${Core.relName(r.a,true)} ↔ ${Core.relName(r.b,true)} 관계를 지울까요?`))) break; World.relKeep(x=>x.id!==id); RELUNDO=r; Core.mark('meta'); CharactersView.openRel(); CoreView.toast('관계를 지웠어요 · 관계도 위쪽 「되돌리기」로 되살릴 수 있어요'); break; }
  case 'relundo': { if(RELUNDO&&!World.RELS().some(x=>x.id===RELUNDO.id)){ World.relPut(RELUNDO); Core.mark('meta'); CoreView.toast('관계를 되살렸어요'); } RELUNDO=null; CharactersView.openRel(); break; }
  case 'relrebuild': { const n0=World.RELS().length; G.chapters.forEach(ch=>{ delete ch.relScan; }); G.meta.relProf=0; World.memCatchUp(); const n=World.RELS().length-n0; Core.mark('meta'); CharactersView.openRel(); CoreView.toast(n>0?`빠진 관계 ${n}개를 다시 채웠어요`:'빠진 기본 관계가 없어요'+(SAMPLE?' · 자세한 관계는 「AI로 관계 넓히기」로 채울 수 있어요':'')); break; }
  case 'cxedit': WorldView.openCxEdit(t.dataset.id); break;
  case 'cxsave': { const id2=t.dataset.id, title=$('#cx_t').value.trim(), body=$('#cx_b').value.trim(); if(!title||!body){CoreView.toast('제목과 내용을 적어 주세요');break;}
        const un=$('#cx_un').value, u=un==='start'?{type:'start'}:{type:'clear',value:un}; let x=id2&&World.cxStore().find(q=>q.id===id2);
        if(x){ Object.assign(x,{cat:$('#cx_cat').value,title,body,unlock:u}); } else { x={id:'cx'+uid(),cat:$('#cx_cat').value,title,body,unlock:u,src:'user',at:Date.now()}; World.cxPut(x); }
        Core.mark('world'); CoreView.closeModal(); Challenge.render(); CoreView.toast('기록을 저장했어요'); System.pcSoon(); break; }
  case 'cxdel': { if(!(await appConfirm('이 기록을 지울까요?'))) break; World.cxKeep(q=>q.id!==t.dataset.id); Core.mark('world'); CoreView.closeModal(); Challenge.render(); System.pcSoon(); break; }
  case 'cxnote': { const k=t.dataset.k, v=prompt('메모로 덧붙일 내용'); if(!v||!v.trim()) break; World.cxNoteAdd(k,v.trim(),'메모'); WorldView.openCx(k); System.pcSoon(); break; }
  case 'cxdisc': { if(!SAMPLE){CoreView.toast('설정의 글 AI에서 AI를 먼저 등록해 주세요');break;} const done=CoreView.busy(t,'쓰는 중… 1분쯤 걸려요'); const n=await World.cxDiscover(CoreView.uiProg(t)); done(); if(n){ Challenge.render(); CoreView.toast(`새 기록 ${n}개를 실었어요`); } break; }
  case 'cxdeep': { const k=t.dataset.k, done=CoreView.busy(t,'기록을 찾는 중…'); const ok=await World.cxDeepen(k,CoreView.uiProg(t)); if(ok){ WorldView.openCx(k); CoreView.toast('새 기록을 덧붙였어요'); } else done(); break; }
  case 'cxreadall': { const s=Core.progSlot('cxSeen'); World.cxEntries().forEach(e=>{ if(e.open) s[e.key]=1; }); CXMEMO=null; Core.mark('prog'); Challenge.render(); break; }
  case 'opening-play': CoreView.closeModal(); StoryView.playOpening(); break;
  case 'char': CharactersCtl.openChar(id); break;
  case 'evspoke': { const c=charById(id); if(!c) break; const o=Characters.own(c.id), lv=o?Core.affLv(o):1, r=t.getBoundingClientRect(), y=e.clientY||r.top+r.height/2, zone=(y-r.top)/r.height<0.3?'head':'body';
        let pool=Characters.spoilFree(c,(zone==='head'?c.touch?.head:c.touch?.body)||[]); if(!pool.length) pool=Characters.affLinePool(c); const l=Core.pickTouchLine(pool,sub(EVS_LINE)); EVS_LINE=l;
        EconomyView.evsPokeShow(t,c,l,zone,lv,e.clientX||r.left+r.width/2,y); if(Economy.voiceOf(c)&&Core.SND().voiceLobby) CoreView.speak(c,l); break; }
  case 'evreroll': { const ev=G.events.find(x=>x.id===id); if(!ev) break; const oldCh=G.chapters.find(c=>c.id===ev.chapterId); if(!oldCh) break;
        const pu=ev.pickupFor&&charById(ev.pickupFor), base=(ev.gen&&ev.gen.dir)||(pu?`${System.T('crew')} 「${pu.name}」이(가) 주인공으로 나오는 픽업 기념 이벤트 스토리. ${String(pu.profile||'').slice(0,200)}`:`이벤트 「${ev.title}」. ${ev.desc||''}`);
        const want=prompt('스토리 전체를 새로 써요. 원하는 줄거리나 방향이 있으면 적어 주세요(비우면 같은 설정으로 새 이야기).\n지금까지 깬 이 이벤트 스테이지 기록은 초기화돼요.','');
        if(want===null) break; const dir=String(want||'').trim()?`${base}\n작가가 원하는 이번 줄거리(이 흐름을 그대로 따른다): ${String(want).trim()}`:`${base}\n지난 버전 「${ev.title}」과 다른 새 이야기로 쓴다.`;
        CoreCtl.bgJob('evr-'+ev.id,'이벤트 스토리 다시 쓰는 중',async()=>{ const n=(ev.gen&&ev.gen.n)||oldCh.stages.length||4, len=(ev.gen&&ev.gen.len)||'';
          const res=await CoreCtl.aiEventGen(dir,n,!!ev.gift,pu?[pu.name]:[],len,Story.loreOf(ev)); if(!res) return null; const ne=res.ev, nch=G.chapters.find(c=>c.id===ne.chapterId); if(!nch) return null;
          // 예전 스토리에서 생긴 것(톡·도감·CG·관계·아직 보유하지 않은 인물·배포 캐릭터)은 정리해요. 새 스토리에도 나오는 CG는 남아요
          const oldGift=ev.gift; Acquire.storyPurge(Story.storyLinks(oldCh.stages.map(s0=>s0.id),oldCh,ev),{threads:1,codex:1,libs:1,rels:1,chars:1});
          const kb=G.banners.find(bn=>bn.id===ev.bannerId), nb=G.banners.find(bn=>bn.id===ne.bannerId), keepPU=ev.pickupFor&&charById(ev.pickupFor)?[ev.pickupFor]:[];
          if(kb&&nb) kb.pickup=[...new Set([...keepPU,...(nb.pickup||[])])].filter(x=>charById(x)).slice(0,3); else if(kb) kb.pickup=(kb.pickup||[]).filter(x=>charById(x)&&x!==oldGift);
          ev.gift=ne.gift||''; if(kb&&ne.desc&&!ev.pickupFor) kb.desc=String(ne.desc);
          // 새 장을 이 이벤트에 옮기고, 새로 생긴 이벤트·배너는 지워요(배너·교환소·토큰은 그대로)
          nch.ord=oldCh.ord; nch.eventId=ev.id; G.chapters=G.chapters.filter(c=>c!==oldCh); G.threads=G.threads.filter(t=>!(t.trigger&&oldCh.stages.some(s0=>s0.id===t.trigger.value)));
          oldCh.stages.forEach(s0=>{ delete P().cleared[s0.id]; }); ev.chapterId=nch.id; ev.title=ne.title; ev.desc=ne.desc; ev.gen={dir,n,len,lore:Story.loreOf(ev)};
          G.events=G.events.filter(x=>x!==ne); G.banners=G.banners.filter(bn=>bn.id!==ne.bannerId); System.markAll(); Core.mark('prog');
          return {title:`이벤트 스토리 「${ev.title}」로 다시 썼어요`,body:`${System.T('event')} 화면에서 처음부터 플레이할 수 있어요.`}; }); break; }
  case 'stamopen': EconomyView.openStam(0); break;
  case 'stamfill': { if(P().gems<STAM_FILL[0]) break; Economy.pay({gems:STAM_FILL[0]}); const s=Core.progSlot('stam'); s.v+=STAM_FILL[1]; Core.mark('prog'); CoreView.closeModal(); Challenge.render(); CoreView.toast(`⚡ ${STAM_FILL[1]} 회복 (${s.v}/${STAM_MAX})`); break; }
  case 'stamtog': { const st=P().settings; st.stamina=!t.checked?false:true; Core.mark('prog'); EconomyView.updStam(); CoreView.toast(st.stamina?'행동력을 켰어요':'행동력을 껐어요(전투 무제한)'); break; }
  case 'scimg': { const ta=$('#'+t.dataset.ta); if(!ta) break; uploadFor={kind:'scimg',ta:ta.id,pos:ta.selectionStart}; $('#file').click(); break; }
  case 'charedit': CharactersView.openCharEdit(id); break;
  case 'savechar': { if(id){const c=charById(id), old=c.name;if(!Characters.readCharForm(c))break; if(old&&old!==c.name&&old.length>=2&&(await appConfirm(`이름이 「${old}」에서 「${c.name}」(으)로 바뀌어요. 스토리·${System.T('talk')}·다른 캐릭터 대사에 나온 「${old}」도 모두 바꿀까요?`))){ const n=Acquire.renameEverywhere(old,c.name); CoreView.toast(`이름을 ${n}곳에서 바꿨어요`); } Core.mark('c:'+id);CoreView.closeModal();Challenge.render();CharactersCtl.openChar(id);}
        else{const c=Characters.cleanChar({});if(!Characters.readCharForm(c))break;G.chars.push(c);Core.mark('c:'+c.id);CoreView.closeModal(); if(window.__ADDOWN){ window.__ADDOWN=false; CharactersCtl.joinChar(c,'새로'); } setTimeout(()=>CoreView.artAfterAI(x=>x.o===c||x.c===c,'새 '+System.T('crew')+' '+c.name),300); if(NEWPU){ const lim=NEWPU==='limited'; NEWPU=false; Acquire.addPickupFor(c,lim); if(window.__PUSTORY&&SAMPLE){ window.__PUSTORY=false; Acquire.puStoryBg(c,lim); } tab='contract'; Challenge.render(); CoreView.toast(`${c.name} 픽업이 열렸어요`); CoreView.artAfterAI(x=>x.o===c||x.c===c,'신규 '+System.T('crew')+' '+c.name); } else { Challenge.render(); CharactersCtl.openChar(c.id); } } break; }
  case 'delchar': if((await appConfirm('이 '+System.T('crew')+'을(를) 삭제할까요? 에피소드와 성장 기록도 함께 사라져요.'))){G.chars=G.chars.filter(c=>c.id!==id);delete p.owned[id];p.squad=p.squad.filter(x=>x!==id);if(p.sec===id)p.sec=null;Core.mark('c:'+id,'prog');CoreView.closeModal();Challenge.render();} break;
  case 'epedit': StoryView.openEpEdit(id,t.dataset.ep||null); break;
  case 'saveep': { const c=charById(id),d={lv:+$('#ep_lv').value,dup:+$('#ep_dup').value,after:$('#ep_after').value,title:$('#ep_title').value.trim()||'제목 없음',script:$('#ep_script').value};
        if(t.dataset.ep) Object.assign(c.episodes.find(x=>x.id===t.dataset.ep),d); else c.episodes.push(Object.assign({id:uid()},d));
        Core.mark('c:'+id); CharactersCtl.openChar(id); break; }
  case 'delep': { const c=charById(id); if((await appConfirm('이 에피소드를 삭제할까요?'))){c.episodes=c.episodes.filter(x=>x.id!==t.dataset.ep);Core.mark('c:'+id);CharactersCtl.openChar(id);} break; }
  case 'aiep': { const c=charById(id),lv=+$('#ep_lv').value,dup=+$('#ep_dup').value,after=$('#ep_after').value,hint=$('#ep_hint').value.trim();
        const stg=Story.aiepStgText({lv});
        const af=after?G.chapters.flatMap(ch=>ch.stages).find(x=>x.id===after):null;
        const r=await Core.aiJSON(Story.aiepPrompt({c,dup,af,lv,stg,hint}),CoreView.uiProg(t));
        if(r&&$('#ep_script')){ if(r.title)$('#ep_title').value=String(r.title); if(r.script)$('#ep_script').value=nl(r.script); CoreView.toast('대본을 채웠어요. 확인 후 저장하세요.'); } break; }
  case 'thedit': StoryView.openThEdit(id,t.dataset.th||null); break;
  case 'saveth': { const v=$('#th_trig').value, trig=v==='start'?{type:'start'}:{type:v.split(':')[0],value:v.split(':')[0]==='aff'?+v.split(':')[1]:v.split(':')[1]};
        const d={title:$('#th_title').value.trim()||'메시지',trigger:trig,needOwn:$('#th_own').value==='1',script:$('#th_script').value};
        let th; if(t.dataset.th){th=threadById(t.dataset.th);Object.assign(th,d);} else {th=Object.assign({id:uid(),charId:id},d);G.threads.push(th);}
        Core.mark('t:'+th.id); MessengerCtl.checkTriggers(); CharactersCtl.openChar(id); break; }
  case 'delth': if((await appConfirm('이 '+System.T('talk')+'을(를) 삭제할까요?'))){G.threads=G.threads.filter(x=>x.id!==t.dataset.th);delete p.inbox[t.dataset.th];Core.mark('t:'+t.dataset.th,'prog');CharactersCtl.openChar(id);} break;
  case 'aithread': { const c=charById(id),hint=$('#th_hint').value.trim(),tv=$('#th_trig').selectedOptions[0].textContent;
        const r=await Core.aiJSON(Story.aithreadPrompt({c,tv,hint}),CoreView.uiProg(t));
        if(r&&$('#th_script')){ if(r.title)$('#th_title').value=String(r.title); if(r.script)$('#th_script').value=nl(r.script); CoreView.toast('대화를 채웠어요. 확인 후 저장하세요.'); } break; }
  case 'ststory': { const ch0=G.chapters.find(x=>x.id===t.dataset.ch), s0=ch0&&ch0.stages.find(x=>x.id===t.dataset.st); if(!s0) break; CoreView.closeModal(); StoryCtl.playStoryStage(ch0,s0); break; }
  case 'story': { const ch=G.chapters.find(x=>x.id===t.dataset.ch),s=ch.stages.find(x=>x.id===t.dataset.st); CoreView.closeModal(); SystemView.playStory(s.title,s[t.dataset.k],()=>StoryView.openStage(ch.id,s.id)); break; }
  case 'chedit': chDraft=clone(G.chapters.find(x=>x.id===t.dataset.ch)); StoryView.openChEdit(); break;
  case 'addstage': Story.readChForm(); chDraft.stages.push({id:uid(),title:'새 작전',reward:400,enemies:[{name:'적',elem:ELEMS[0],hp:900,atk:80,def:35,spd:95,boss:false}],pre:'',post:''}); StoryView.openChEdit(); break;
  case 'delstage': { Story.readChForm(); if(chDraft.stages.length<=1){ CoreView.toast('스테이지는 1개 이상 있어야 해요'); break; } const st=chDraft.stages[+t.dataset.j], live=G.chapters.find(x=>x.id===chDraft.id);
        const L=st&&live&&live.stages.some(x=>x.id===st.id)?Story.storyLinks([st.id],live,live.eventId&&G.events.find(e=>e.id===live.eventId)):null, n=L?L.threads.length+L.codex.length+L.libs.length+L.rels.length:0;
        if(n&&(await appConfirm(`이 스테이지에 연결된 ${System.T('talk')} ${L.threads.length}개, 도감 ${L.codex.length}개, CG·소품 ${L.libs.length}개, 관계 기록 ${L.rels.length}개도 지울까요?
  (저장을 눌러야 반영돼요. 취소하면 스테이지만 지워요)`))) (chDraft.__purge=chDraft.__purge||[]).push(st.id);
        chDraft.stages.splice(+t.dataset.j,1); StoryView.openChEdit(); break; }
  case 'savech': { Story.readChForm(); const pg=chDraft.__purge; delete chDraft.__purge; const old=G.chapters.find(x=>x.id===chDraft.id);
        if(pg&&pg.length&&old){ Acquire.storyPurge(Story.storyLinks(pg,old,old.eventId&&G.events.find(e=>e.id===old.eventId)),{threads:1,codex:1,libs:1,rels:1}); pg.forEach(id=>{ delete P().cleared[id]; }); }
        const i=G.chapters.findIndex(x=>x.id===chDraft.id); delete chDraft.relScan; G.chapters[i]=chDraft; Core.mark('ch:'+chDraft.id); Story.syncEnemies(); Story.scanScriptAssets(); Story.relFromScripts(chDraft); CoreView.closeModal(); Challenge.render(); break; }
  case 'stdetail': { Story.readChForm(); const j=+t.dataset.j, s0=chDraft.stages[j], ch0=chDraft; if(!s0) break; if(!(s0.pre||s0.post)){ CoreView.toast('먼저 대본이 있어야 해요'); break; }
        const nb=Story.stdetailNbText({ch0,j});
        const r=await Core.aiJSON(Story.stdetailPrompt({s0,ch0,j,nb}),CoreView.uiProg(t),'complex');
        if(r&&(r.pre||r.post)){ s0.pre=nl(r.pre)||s0.pre; if(!s0.story) s0.post=nl(r.post)||s0.post; CoreView.modalKeep(StoryView.openChEdit); CoreView.toast('디테일을 보강했어요. 마음에 들면 저장을 눌러 주세요'); } break; }
  case 'delch': { const ch0=G.chapters.find(x=>x.id===chDraft.id)||chDraft, back=chDraft, ev0=ch0.eventId&&G.events.find(e=>e.id===ch0.eventId);
        StoryView.openStoryDel({title:ch0.title,ids:ch0.stages.map(s=>s.id),ch:ch0,ev:ev0,back:()=>{ chDraft=back; StoryView.openChEdit(); },run:()=>{ G.chapters=G.chapters.filter(x=>x.id!==ch0.id); Core.mark('ch:'+ch0.id); }}); break; }
  case 'world-open': WorldView.openWorld(); break;
  case 'saveworld': { const w=G.world; w.name=$('#w_name').value.trim()||w.name; w.summary=$('#w_sum').value.trim(); w.lore=$('#w_lore').value.trim(); w.plot=$('#w_plot').value.trim();
        w.factions=lines($('#w_fac').value).map(l=>{const i=l.search(/[:：]/);return i>0?{name:l.slice(0,i).trim(),desc:l.slice(i+1).trim()}:{name:l,desc:''};});
        if(WTERMS&&$('#w_tchk')&&$('#w_tchk').checked){ Object.entries(WTERMS).forEach(([k,v])=>{ if(v&&TERM_LABEL[k]) G.meta.terms[k]=String(v).slice(0,12); }); Core.mark('meta'); SystemView.applyMeta(); } WTERMS=null;
        Core.mark('world'); CoreView.closeModal(); Challenge.render(); CoreView.toast('세계관을 저장했어요'); System.pcSoon(); break; }
  case 'aiworld': { const kw=$('#w_kw').value.trim(); if(!kw){CoreView.toast('키워드를 입력해 주세요');break;}
        const r=await Core.aiJSON(Story.aiworldPrompt({kw}),CoreView.uiProg(t));
        if(r&&$('#w_name')){ WTERMS=r.terms&&typeof r.terms==='object'?r.terms:null; StoryView.worldFormFill(r); CoreView.toast('입력칸을 채웠어요. 확인 후 저장하세요.'); } break; }
  case 'opening-edit': StoryView.openOpeningEdit(); break;
  case 'aichapter-open': CharactersView.openAiChapter(); break;
  case 'aichapter': { const dir=$('#ai_d').value.trim()||'메인 플롯을 따라 자연스럽게 이어서', n=+$('#ai_n').value, cast=[...document.querySelectorAll('.chip.on')].map(b=>charById(b.dataset.id)?.name).filter(Boolean);
        if(!SAMPLE){ CoreView.toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); break; } CoreView.closeModal();
        CoreCtl.bgJob('chapter','다음 장 만드는 중',async()=>{ const res=await StoryCtl.aiChapterGen(dir,n,cast); return res?{title:`새 이야기 「${res.ch.title}」가 열렸어요`,body:`${System.T('ops')}에서 바로 플레이할 수 있어요.\n새 배경·음악 ${res.nb}개, ${System.T('talk')} ${res.nt}개가 함께 추가됐어요.${res.nc&&res.nc.length?`\n새 인연: ${res.nc.map(c=>RL[c.rarity]+' '+c.name).join(', ')} — 이야기에서 만나면 상시 ${System.T('gacha')}에 들어가요.${res.nc.some(c=>c.rarity<3)?' R·SR 인연은 이 장을 끝까지 깨면 무료로 합류해요.':''}`:''}${res.npcs&&res.npcs.length?`\n새 NPC: ${res.npcs.map(c=>c.name).join(', ')}`:''}`}:null; }); break; }
  case 'reload': SystemView.reloadGame(); break;
  case 'evopen': P().curEvent=id; tab='evd'; Challenge.render(); StoryView.viewTop(); if(G.events.find(e=>e.id===id)?.bgm) ArtView.bgm(G.events.find(e=>e.id===id).bgm); break;
  case 'evbuy': { const ev=G.events.find(e=>e.id===P().curEvent), it=ev.shop.find(x=>x.id===id), buy=(P().shopBuy[ev.id]=P().shopBuy[ev.id]||{});
        if((buy[it.id]||0)>=it.limit||(P().tokens[ev.id]||0)<it.price) break;
        P().tokens[ev.id]-=it.price; buy[it.id]=(buy[it.id]||0)+1;
        if(it.type==='char'){ const c=charById(it.ref); if(c){ const o=Characters.own(c.id); if(o){ if(o.dup<5)o.dup++; CoreView.toast(`${c.name} ${System.T('limit')} +1`);} else { P().owned[c.id]={levelCapVersion:1,transc:0,growthCostVersion:1,lv:1,exp:0,dup:0,aff:0,seen:[],wlv:0,skin:''}; CoreView.toast(`${c.name} 획득!`); MessengerCtl.checkTriggers(); } } }
        else { Economy.giveReward({[it.type]:it.amt}); CoreView.toast(Core.rewardText({[it.type]:it.amt})+' 획득'); }
        Art.sfx('확인'); Core.mark('prog'); Challenge.render(); break; }
  case 'evedit': StoryView.openEvEdit(id); break;
  case 'evsave': { const ev=G.events.find(e=>e.id===id); ev.title=$('#ev_t').value.trim()||ev.title; ev.desc=$('#ev_d').value.trim(); ev.token=$('#ev_tok').value.trim()||ev.token; ev.bg=$('#ev_bg').value; ev.active=$('#ev_act').value==='1';
        if($('#ev_lore')){ const nl=$('#ev_lore').value; if(nl!==Story.loreOf(ev)) Story.evLoreSet(ev,nl); }
        const sh=lines($('#ev_shop').value).map((l,i)=>{const p2=l.split(/[,，]/).map(x=>x.trim());const ty=p2[0]||'gold';return {id:'s'+i,type:ty.startsWith('char:')?'char':ty,ref:ty.startsWith('char:')?ty.slice(5):undefined,amt:num(p2[1],1,999999,1),price:num(p2[2],1,999999,100),limit:num(p2[3],1,999,1)};});
        if(sh.length) ev.shop=sh; const bn=G.banners.find(x=>x.id===ev.bannerId); if(bn) bn.active=ev.active; Core.mark('prog'); CoreView.closeModal(); Challenge.render(); break; }
  case 'evdel': { const ev=G.events.find(e=>e.id===id); if(!ev) break; const ch0=G.chapters.find(c=>c.id===ev.chapterId);
        StoryView.openStoryDel({title:'이벤트 「'+ev.title+'」',ids:ch0?ch0.stages.map(s=>s.id):[],ch:ch0,ev,back:()=>StoryView.openEvEdit(id),after:()=>{ tab='event'; },run:()=>{ G.events=G.events.filter(e=>e.id!==id); G.chapters=G.chapters.filter(c=>c.id!==ev.chapterId); Core.mark('ch:'+ev.chapterId); G.banners=G.banners.filter(b=>b.id!==ev.bannerId); }}); break; }
  case 'dreroll': { const bn=Core.progSlot('dboard'); if(bn.rr){ if(P().gold<2000){ CoreView.toast('크레딧이 부족해요'); break; } P().gold-=2000; } bn.rr=(bn.rr||0)+1; bn.list=bn.list.map(o=>P().disp[o.id]?o:null); bn.list=bn.list.map(o=>o||Expedition.dispOffer(bn.list.filter(Boolean).map(x=>x.name))); Core.mark('prog'); Challenge.render(); CoreView.toast('새 의뢰가 올라왔어요'); break; }
  case 'meta-open': SystemView.openMeta(); break;
  case 'metasave': { if($('#ng_story')&&$('#ng_story').value.trim().length>100000){CoreView.toast('스토리는 최대 100,000자입니다. 초과 내용은 자르지 않았습니다.');break;}const m=G.meta, old=m.elems.map(e=>e.n); if($('#mt_logo')) m.logoStyle=$('#mt_logo').value; if($('#ng_story')) m.story=StoryView.readStoryForm(); if($('#mt_cast')) m.castSex=$('#mt_cast').value; if($('#mt_tone')) m.tone=$('#mt_tone').value.trim(); if($('#mt_art')){ m.artTags=$('#mt_art').value.trim(); m.artNeg=$('#mt_artn').value.trim(); }
        m.title=$('#mt_title').value.trim()||m.title; m.sub=$('#mt_sub').value.trim(); m.theme=$('#mt_theme').value; m.accent=$('#mt_acc').value;
        Object.keys(DEFAULT_META.terms).forEach(k=>{const v=$('#mt_t_'+k).value.trim(); if(k==='abyss')m.terms[k]=Story.explorationName(v);else if(v)m.terms[k]=v;});
        m.elems=m.elems.map((e0,i)=>({n:($('#mt_e'+i)?.value||'').trim()||old[i],c:$('#mt_c'+i)?.value||e0.c,d:e0.d||''})); // 속성 개수·설명은 게임 규칙 화면에서 // 설명(d)은 게임 규칙 화면에서 편집
        const map={}; old.forEach((o,i)=>{map[o]=m.elems[i].n;}); Rules.rulesRename(map);
        G.chars.forEach(c=>{if(map[c.elem])c.elem=map[c.elem];}); G.chapters.forEach(ch=>ch.stages.forEach(st=>st.enemies.forEach(en=>{if(map[en.elem])en.elem=map[en.elem];})));
        ['atk','def','sup'].forEach(k=>{m.roles[k]=$('#mt_r_'+k).value.trim()||m.roles[k];}); m.farms.forEach((f,i)=>{f.name=$('#mt_f'+i).value.trim()||f.name;});
        const pj=Core.PJ(); const me=pj.list.find(x=>x.id===pj.active); if(me){me.title=m.title;appStorage.setItem(PJKEY,JSON.stringify(pj));}
        System.markAll(); SystemView.applyMeta(); CoreView.closeModal(); Challenge.render(); CoreView.toast('게임 정의를 저장했어요'); break; }
  case 'draft-open': StoryView.openDraft(); break;
  case 'drlib': CoreView.drRead(); StoryView.drLibToggle(); break;
  case 'drlibsave': { CoreView.drRead(); const nm=prompt('초안 이름',drName(DR2)); if(nm===null) break; const a=Story.drLib(), name=nm.trim()||drName(DR2), old=a.find(x=>x.name===name);
        if(old&&!(await appConfirm(`「${name}」 초안을 덮어쓸까요?`))) break; const rec={id:old?old.id:'d'+uid(),name,at:Date.now(),d:Story.drClean(DR2)}; const bn=a.filter(x=>x!==old); bn.unshift(rec); if(Story.drLibSave(bn)){ CoreView.toast('초안을 저장했어요'); StoryView.drLibRefresh(); } break; }
  case 'drlibload': { const x=Story.drLib().find(y=>y.id===id); if(!x) break; CoreView.drRead(); if(Core.drText(DR2).trim()&&!(await appConfirm('지금 쓰던 초안 대신 불러올까요? (지금 초안은 먼저 보관함에 저장해 두세요)'))) break; Story.drLoadFrom(x.d,x.name); break; }
  case 'drreuseoff': CoreView.drRead(); delete DR2.reuse; Core.drSave(); StoryView.openDraft(); CoreView.toast('그림을 새로 그리는 초안으로 바꿨어요'); break;
  case 'drxcur': CoreView.drRead(); StoryView.openDraftExport(drName(DR2),DR2,()=>{ StoryView.openDraft(); }); break;
  case 'drxlib': { const x=Story.drLib().find(y=>y.id===id); if(x){ CoreView.drRead(); StoryView.openDraftExport(x.name,x.d,()=>StoryView.openDraft()); } break; }
  case 'drxcopy': { const tx=$('#drx_code').value; try{ await navigator.clipboard.writeText(tx); CoreView.toast('초안 코드를 복사했어요'); }catch(e){ const ta=$('#drx_code'); CoreView.uiSelectText(ta); try{ document.execCommand('copy'); CoreView.toast('초안 코드를 복사했어요'); }catch(_){ CoreView.toast('길게 눌러 직접 복사해 주세요'); } } break; }
  case 'drxfile': { if(!DRX) break; await CoreCtl.saveTextFile(JSON.stringify({v:1,name:DRX.name,d:Story.drClean(DRX.d)},null,1),'초안_'+String(DRX.name).replace(/[^\w가-힣-]+/g,'_').slice(0,30)+'.json'); break; }
  case 'drxback': { const bn=DRX&&DRX.back; DRX=null; if(bn) bn(); else if($('#dri_code')) StoryView.openDraft(); else CoreView.closeModal(); break; }
  case 'drimport': CoreView.drRead(); StoryView.openDraftImport(); break;
  case 'drigo': StoryCtl.draftImportDone(Story.draftFrom($('#dri_code').value),$('#dri_load').checked); break;
  case 'drifile': $('#drfile').click(); break;
  case 'drlibdel': { const a=Story.drLib(), x=a.find(y=>y.id===id); if(!x||!(await appConfirm(`「${x.name}」 초안을 지울까요?`))) break; Story.drLibSave(a.filter(y=>y!==x)); StoryView.drLibRefresh(); break; }
  case 'drtab': CoreView.drRead(); DRTAB=t.dataset.k; StoryView.drTabShow(); break;
  case 'drcadd': CoreView.drRead(); DR2.chars.push({name:'',role:'',profile:'',speech:'',look:'',tags:''}); Core.drSave(); CoreView.drRerender(); break;
  case 'drcdel': CoreView.drRead(); DR2.chars.splice(+t.dataset.i,1); Core.drSave(); CoreView.drRerender(); break;
  case 'drmode': CoreView.drRead(); DR2.mode=t.dataset.v||''; Core.drSave(); StoryView.openDraft(); break;
  case 'drpreset': { CoreView.drRead(); const v=t.dataset.v||''; DR2.preset=v; Core.drSave(); if(v){ const sp=Core.allPresets().find(x=>x.id===v); if(Art.presetToCfg(v)) CoreView.toast(`「${sp.name}」 그림체를 적용했어요`); } StoryView.drPresetShow(v); break; }
  case 'drautoex': { const el=$('#dr_auto'); if(el){ el.value=t.dataset.v; CoreView.drRead(); } break; }
  case 'drpfdraw': NewGameCtl.drAvatarDraw(CoreView.uiProg(t)); break;
  case 'drcfill': Core.drFillChar(+t.dataset.i,CoreView.uiProg(t)); break;
  case 'drpolish': Core.drPolish(t.dataset.k,CoreView.uiProg(t)); break;
  case 'drharmony': Characters.drHarmony(CoreView.uiProg(t)); break;
  case 'drdedup': { CoreView.drRead(); const n=Characters.drDedup(JSON.parse(JSON.stringify(DR2))); if(!n){ CoreView.toast('겹치는 문장이 없어요'); break; } Core.drSnap('겹치는 문장 정리'); Characters.drDedup(); Core.drSave(); CoreView.drRerender(); CoreView.toast(`겹치는 문장 ${n}개를 정리했어요. 마음에 안 들면 「되돌리기」`); break; }
  case 'drundo': { if(!DR2.undo) break; CoreView.drRead(); const u=DR2.undo; if(u.kw!=null) DR2.kw=u.kw; if(u.tone!=null) DR2.tone=u.tone; DR2.world=u.world; DR2.setting=u.setting; DR2.story=u.story; DR2.chars=u.chars; if(u.hero){ const av=DR2.hero.av; DR2.hero=Object.assign({},u.hero,{av}); } else if(u.bio!=null) DR2.hero.bio=u.bio; delete DR2.undo; Core.drSave(); CoreView.drRerender(); CoreView.toast('다듬기 전으로 되돌렸어요'); break; }
  case 'drpreview': CoreView.drRead(); StoryView.drPreviewToggle(Core.drText()); break;
  case 'drclear': if(!(await appConfirm('초안을 모두 지울까요?'))) break; try{ appStorage.removeItem(DR2KEY); Core.idbDel('draft_avatar').catch(()=>{}); }catch(e){} if(DRAVU){ URL.revokeObjectURL(DRAVU); DRAVU=null; } DRTAB='theme'; StoryView.openDraft(); break;
  case 'drmanual': { CoreView.drRead(); if(!(await appConfirm('적은 내용 그대로 새 게임을 만들까요?\n비어 있는 대사·스킬·적은 기본값으로 채워요. 나중에 글 AI를 등록하면 편집 화면에서 다듬을 수 있어요.'))) break; const done=CoreView.busy(t); try{ await NewGame.newGameManual(CoreView.uiProg(t,'#ng_stat'),DR2); }catch(err){ CoreView.toast('만들기 실패: '+((err&&err.message)||err)); } done(); break; }
  case 'drmake': { CoreView.drRead(); if(DR2.mode==='auto'?!String(DR2.auto||'').trim():(!String(DR2.kw||'').trim()&&!String(DR2.world||'').trim())){ CoreView.toast(DR2.mode==='auto'?'만들고 싶은 게임을 적어 주세요':'테마의 장르와 키워드나 세계관 중 하나는 적어 주세요'); break; }
        const done=StoryView.drBusy(t); try{ await NewGame.newGame(CoreView.uiProg(t,'#ng_stat'),DR2); }catch(err){ Core.aiLog({ok:false,stage:'새 게임 만들기',err:'앱 오류: '+String((err&&(err.stack||err.message))||err).slice(0,600)}); CoreView.say('#ng_stat','만드는 중 오류가 났어요. 아래 \'AI 기록\'에서 내용을 확인해 주세요.'); } AISTAGE=''; done(); break; }
  case 'charregen': LiveOpsView.openRegen(id); break;
    }
  }

    // 메인 스토리에서 처음 말하는 스테이지 {k: 장 순서(0부터), s}
static firstSpeak(c){ const re=new RegExp('(^|\\n)'+String(c.name).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(\\s*\\[[^\\]]*\\])?\\s*[:：]'), M=G.chapters.filter(ch=>ch.kind==='main'); for(let k=0;k<M.length;k++) for(const s of M[k].stages||[]) if(re.test((s.pre||'')+'\n'+(s.post||''))) return {k,s}; return null; }

    // AI가 돌려준 관계 변화를 합쳐요: [{a,b,kind,note,event}]
  // IF·외전 로어 범위: ''(정사·로어북에 반영) | 'if'(로어북에 반영 안 함) | 이격 id(그 이격의 기록에만 남겨요)
static loreOf(x){ const l=x&&x.lore; return l==='if'?'if':(l&&charById(l)?l:''); }

  static loreLabel(l){ return l==='if'?'IF 스토리':(l&&charById(l)?'이격 「'+charById(l).name+'」 전용':''); }

    // 같은 스테이지에 함께 나온 두 사람은 '아는 사이'(플레이어와는 '함께한 사이')로 처음 한 번 기록해요
static relFromScripts(ch,src,quiet){ if(!ch||ch.relScan) return 0; let n=0; src=src||ch.title; const lore=Story.loreOf(ch);
    if(lore!=='if') (ch.stages||[]).forEach(s=>{ const cast=[...Core.stageCast(s,true)]; for(let i=0;i<cast.length;i++) for(let j=i+1;j<cast.length;j++){ const me=cast[i]===REL_ME||cast[j]===REL_ME, m=Core.loreMap(cast[i],cast[j],lore); if(!m) continue; n+=Core.relNew(m[0],m[1],me?'함께한 사이':'아는 사이',`「${s.title}」에서 함께 있었다`,src,true,s.id); } });
    ch.relScan=true; if(!quiet){ if(n) Core.mark('meta'); Core.mark('ch:'+ch.id); } return n; }

  static chLogline(ch){ if(ch.logline) return ch.logline; const L=System.parseScript((ch.stages[0]||{}).pre||'').find(l=>l.type==='nar'&&l.text&&l.text.length>8); return L?sub(L.text).slice(0,70)+(L.text.length>70?'…':''):''; }

  static titleLines(t){ const w=String(t||'').trim().split(/\s+/).filter(Boolean); if(w.length<2) return [w.join('')];
    let best=null; for(let k=1;k<w.length;k++){ const a=w.slice(0,k).join(' '), b=w.slice(k).join(' '), m=Math.max(tlLen(a),tlLen(b)); if(!best||m<best.m) best={m,l:[a,b]}; } return best.l; }

  static logoStyle(v0){ const v=v0||G.meta.logoStyle||'auto'; if(v!=='auto'&&LOGO_STYLES.some(x=>x[0]===v)) return v; return ({fantasy:'star',noir:'stroke',neon:'orbitline',pastel:'cute',tactical:'stencil'})[G.meta.theme]||'stencil'; }

    /* 타이틀 배경음 단추(View) — 켜짐/꺼짐 표시만 */
static titleSndLabel(on){ return on?'배경음 끄기':'배경음 켜기'; }

  static afterPrologue(){ setTimeout(()=>{ if(typeof LiveOps.prepAsk==='function') LiveOps.prepAsk(); },4000);
    const first=!P().seenOpening; P().seenOpening=true; Core.mark('prog'); tab=first?'contract':tab; Challenge.render();
    if(first){ CoreView.toast('첫 10회는 SSR 1명 확정이에요'); setTimeout(()=>MessengerCtl.checkTriggers(),1500); }
    setTimeout(()=>Story.liveTick(false),2500);
    if(G.meta.subscr) setTimeout(()=>{ if($('#modal').hidden&&$('#ov').hidden) SystemView.subCheck(false); },4500);
  }

    // 스테이지 i/n에 규칙을 정해요(첫 스테이지는 규칙 없음, 마지막(보스)은 시간·체력 목표). 같은 스테이지는 늘 같은 결과
static stageAutoRules(s,i,n){ if(!s||s.story||!(s.enemies||[]).length) return s; const h=Core.hashN(s.id||s.title||i);
    if(i>0){ const fk=['resonance','role','home','armor','fortress','swift','resonance','frenzy','suppress'].filter(k=>FIELDS[k].arg!=='faction'||NewGame.ruleFacs().length), k=fk[h%fk.length]; const f=NewGame.ruleClean(FIELDS,{k,a:NewGame.ruleArg(FIELDS[k].arg,h>>3)}); if(f) s.field=f; }
    const gk=i===n-1?['fast','hp']:['elem','role','noRole','few','hp','faction'].filter(k=>k!=='faction'||NewGame.ruleFacs().length), g=gk[(h>>5)%gk.length], goal=NewGame.ruleClean(GOALS,{k:g,a:NewGame.ruleArg(GOALS[g].arg,h>>7)}); if(goal) s.goal=goal;
    s.rulesV=1; return s; }
}

class StoryView {
  static shootHTML(n){let s='';for(let i=0;i<n;i++)s+=`<i class="shoot" style="top:${Math.round(Math.random()*45)}%;left:${50+Math.round(Math.random()*60)}%;animation-delay:${(i*0.9+Math.random()).toFixed(1)}s"></i>`;return s;}

  static readStoryForm(){ return {plot:($('#ng_story')?$('#ng_story').value.trim():''),stages:$('#ng_stages')?+$('#ng_stages').value||0:0,len:$('#ng_len')?$('#ng_len').value:'normal',depth:$('#ng_depth')?$('#ng_depth').value:'deep',newc:$('#ng_newc')?+$('#ng_newc').value:2,talkOnly:$('#ng_talkonly')?+$('#ng_talkonly').value:1}; }

  static openAiEvent(){
    CoreView.openModal(`${head('AI로 이벤트 만들기')}
      <label class="f" for="ae_d">이벤트 내용</label><textarea class="in" id="ae_d" placeholder="예: 여름 해변 축제. 바다에서 떠오른 잔광 해파리 소동. 수영복 차림의 카야와 이브가 주인공."></textarea>
      <label class="f">주연 ${System.T('crew')}</label><div class="chips">${G.chars.map(c=>`<button class="chip" data-act="castt" data-id="${c.id}">${esc(c.name)}</button>`).join('')}</div>
      <div class="g2"><div><label class="f" for="ae_n">스테이지 수</label><select class="in" id="ae_n">${CoreView.opt([[3,'3개'],[4,'4개'],[5,'5개']],3)}</select></div>
      <div><label class="f" for="ae_new">한정 ${System.T('crew')}</label><select class="in" id="ae_new">${CoreView.opt([['1','새로 만들기'],['0','만들지 않기']],'1')}</select></div></div>
      <label class="f" for="ae_len">스토리 분량</label><select class="in" id="ae_len">${CoreView.opt(Object.entries(STORY_LEN).map(([k,v])=>[k,v[0]+' (스테이지마다 대본 '+v[1].pre+'줄)']),Battle.storyCfg().len)}</select>
      <p class="muted" style="margin:4px 0 0;font-size:.78rem">길게 쓸수록 시간이 더 걸리고 글 AI 사용량이 늘어요.</p>
      <label class="f" for="ae_lore">이야기 종류 (로어북)</label><select class="in" id="ae_lore">${CoreView.opt(Characters.loreOpts(),'')}</select>
      <p class="muted" style="margin:4px 0 0;font-size:.78rem">IF 스토리는 관계도·스토리 기억에 남지 않아서, 본편과 다른 과감한 이야기도 마음껏 쓸 수 있어요. 이격 전용은 그 이격의 관계 기록에만 남아요.</p>
      <div class="row" style="margin-top:14px"><button class="btn" data-act="aievent">만들기</button></div>
      <p class="muted">이벤트 스토리, 한정 배너, 교환소, 필요한 배경과 음악, ${System.T('talk')}까지 만들어요.</p>`);
  }

  static auditNotice(){ try{ if((+G.meta.auditSeen||0)>=LiveOps.auditVer()||!P().seenOpening) return; const n=LiveOps.auditScan().reduce((a,x)=>a+x.items.length,0); if(n) CoreView.toast(`생성 기능이 좋아졌어요. 설정 → 게임 → 콘텐츠 점검에서 ${n}개를 업그레이드할 수 있어요`); }catch(e){} }

  static chCover(ch){ const ml=Art.chMapLib(ch), ms=ml&&Characters.imgSrc(ml); if(ms) return `background-image:url('${esc(ms)}');background-size:cover;background-position:center`;
    const pl=System.parseScript((ch.stages[0]||{}).pre||'').find(l=>l.type==='place'); return ArtView.bgStyle(pl?pl.text:ch.title); }

  static opsListHTML(){ const main=G.chapters.filter(ch=>ch.kind==='main'); let prevDone=true, curIdx=-1;
    const cards=main.map((ch,ci)=>{ const n=ch.stages.length, done=ch.stages.filter(s=>P().cleared[s.id]).length, open=prevDone, full=n&&done===n; prevDone=full; if(open&&!full&&curIdx<0) curIdx=ci;
      return `<button class="chc ${open?'':'lock'} ${full?'clear':''} ${open&&!full?'cur':''}" data-act="${open?'opsch':'locked'}" data-ch="${ch.id}"><div class="chc-art" style="${StoryView.chCover(ch)}"></div><div class="chc-no"><i>CHAPTER</i><b>${String(ci+1).padStart(2,'0')}</b></div>${full?'<em class="chc-st">CLEAR</em>':open?'<em class="chc-st now">진행 중</em>':'<em class="chc-st">🔒 잠김</em>'}
        <div class="chc-t"><b>${esc(ch.title)}</b><p>${open?esc(Story.chLogline(ch)||'이야기가 기다리고 있어요.'):'앞 장을 모두 끝내면 열려요.'}</p><div class="chc-bar"><i style="width:${n?done/n*100:0}%"></i></div><span>${done} / ${n}</span></div></button>`; }).join('');
    const nxt=`<button class="chc next" data-act="${SAMPLE?'aichapter-open':'nextneedai'}"><div class="chc-art"></div><div class="chc-no"><i>CHAPTER</i><b>${String(main.length+1).padStart(2,'0')}</b></div><em class="chc-st">다음 이야기</em><div class="chc-t"><b>＋ 다음 장 만들기</b><p>${SAMPLE?'AI가 지금까지의 이야기와 보유한 '+esc(System.T('crew'))+'을(를) 반영해 다음 장을 써요.':'글 AI를 등록하면 다음 장을 만들 수 있어요.'}</p></div></button>`;
    if(curIdx>=0) setTimeout(()=>{ const el=document.querySelectorAll('.chc')[curIdx]; if(el&&el.parentNode) el.parentNode.scrollLeft=Math.max(0,el.offsetLeft-24); },30);
    return `${pageHead(System.T('ops'),'MAIN STORY')}<div class="chc-row">${cards}${nxt}</div><p class="muted" style="margin:6px 2px;font-size:.75rem">← 옆으로 넘겨서 장을 고르세요 →</p><button class="linkb" data-act="rebal" style="margin-top:6px">적 스탯 자동조정 · 새 스킬 기준</button>`; }

  static opsHTML(){ if(!OPS_CH||!G.chapters.some(ch=>ch.id===OPS_CH)) return StoryView.opsListHTML();
    let prev=true,out=`<div class="phead"><button class="back" data-act="opsback" aria-label="장 목록">‹</button><div><i>MAIN STORY</i><h2>${esc(System.T('ops'))}</h2></div></div>`;
    const XS=[28,68,38,74,26,60,44,72];
    G.chapters.filter(ch=>ch.kind==='main').forEach((ch,ci)=>{ if(ch.id!==OPS_CH){ prev=ch.stages.every(s=>P().cleared[s.id]); return; }
      const ml=Art.chMapLib(ch), ms=ml&&Characters.imgSrc(ml), n=ch.stages.length, RH=104, Hh=n*RH+40;
      const pts=ch.stages.map((s,i)=>({x:XS[i%XS.length],y:56+i*RH}));
      let d=''; pts.forEach((p,i)=>{ if(!i){d+=`M${p.x} ${p.y}`;return;} const q=pts[i-1]; d+=` C${q.x} ${q.y+RH/2} ${p.x} ${p.y-RH/2} ${p.x} ${p.y}`; });
      const done=ch.stages.filter(s=>P().cleared[s.id]).length;
      let firstOpen=true;
      const nodes=ch.stages.map((s,si)=>{const cl=!!P().cleared[s.id],open=prev; prev=cl; const cur=open&&!cl&&firstOpen; if(cur) firstOpen=false;
        const boss=!s.story&&(s.enemies.some(en=>en.boss)||si===n-1), p=pts[si];
        return `<button class="onode ${cl?'clear':''} ${open?'':'lock'} ${cur?'cur':''} ${boss?'boss':''} ${s.story?'story':''} ${s.mode?'m-'+s.mode:''}" style="left:${p.x}%;top:${p.y}px" data-act="${open?'stage':'locked'}" data-ch="${ch.id}" data-st="${s.id}"><span class="dia"><span>${cl?'✓':open?(Story.modeIcon(s)||(boss?'★':s.story?'📖':'')):'🔒'}</span></span><span class="ont"><i>${ci+1}-${si+1}</i><b>${esc(s.title)}</b>${P().stars&&P().stars[s.id]?`<small class="ost">${'★'.repeat(P().stars[s.id])}${'☆'.repeat(3-P().stars[s.id])}</small>`:''}<em>${s.enemies.slice(0,4).map(e=>`<u style="--ec:${ECOL[e.elem]}"></u>`).join('')}</em></span></button>`;}).join('');
      out+=`<section class="omap">
        <div class="omap-h"><div><i>CHAPTER ${ci+1}</i><h3>${esc(ch.title)}</h3></div><span>${done}/${n}</span><button class="btn sm ghost" data-act="mapedit" data-ch="${ch.id}">지도</button><button class="btn sm ghost" data-act="chedit" data-ch="${ch.id}">편집</button></div>
        <div class="omap-b" style="height:${Hh}px;${ms?`background-image:url('${esc(ms)}');background-size:cover;background-position:center`:ArtView.bgStyle(ch.title)}">
          <div class="omap-grid"></div>
          <svg class="omap-path" viewBox="0 0 100 ${Hh}" preserveAspectRatio="none"><path d="${d}" class="bg"/><path d="${d}" class="fg" style="stroke-dasharray:${Math.max(0,done-0.5)*RH*1.3} 99999"/></svg>
          ${nodes}
        </div></section>`;
    });
    return out+`<div class="row" style="margin:10px 0"><button class="btn ghost block" data-act="opsback">‹ 장 목록으로</button></div><div class="panel" hidden><h3>다음 이야기</h3><p class="muted" style="margin:0 0 10px">AI가 메인 플롯과 지금까지의 진행, 보유한 ${System.T('crew')}을(를) 반영해서 다음 장을 써요. 필요한 배경, 음악, ${System.T('talk')}도 함께 만들어요.</p><button class="btn block" data-act="aichapter-open">AI로 다음 장 만들기</button><button class="linkb" data-act="rebal" style="margin-top:10px">적 스탯 자동조정 · 새 스킬 기준</button></div>`;
  }

  static bgOptions(cur,label='자동'){return `<option value="">${label}</option>`+G.lib.filter(l=>l.kind==='bg').map(l=>`<option ${l.name===cur?'selected':''}>${esc(l.name)}</option>`).join('');}

    /* 화면 맨 위로(View) — 탭·화면을 옮긴 뒤 */
static viewTop(){ $('#view').scrollTop=0; }

  static stageOptions(cur){const o=[['','조건 없음']];G.chapters.forEach((ch)=>ch.stages.forEach((s)=>o.push([s.id,`${ch.kind==='event'?'[이벤트] ':''}${Story.stageCode(s.id)} ${s.title}`])));return CoreView.opt(o,cur||'');}

  static openEpEdit(cid,eid){
    const c=charById(cid); const e=eid?c.episodes.find(x=>x.id===eid):{id:'',lv:[2,4,6,8,10].find(l=>!c.episodes.some(x=>x.lv===l))||10,dup:0,after:'',title:'',script:''};
    CoreView.openModal(`${head(`${esc(c.name)} 개인 스토리`)}
      <div class="g2"><div><label class="f" for="ep_lv">호감도 조건</label><select class="in" id="ep_lv">${CoreView.opt([1,2,3,4,5,6,7,8,9,10].map(n=>[n,'Lv.'+n]),e.lv)}</select></div>
      <div><label class="f" for="ep_dup">${System.T('limit')} 조건</label><select class="in" id="ep_dup">${CoreView.opt([0,1,2,3,4,5].map(n=>[n,n?n+'단계':'없음']),e.dup||0)}</select></div></div>
      <label class="f" for="ep_after">메인 스토리 조건 (이 스테이지를 깨야 열림)</label><select class="in" id="ep_after">${StoryView.stageOptions(e.after)}</select>
      <label class="f" for="ep_title">제목</label><input class="in" id="ep_title" value="${esc(e.title)}">
      <label class="f" for="ep_script">대본</label><textarea class="in tall" id="ep_script">${esc(e.script)}</textarea><button class="btn sm ghost scimg-b" data-act="scimg" data-ta="ep_script">🖼 이미지 넣기</button>
      <p class="muted" style="margin:4px 0 0">이름: 대사 / 이름[표정]: 대사 / [배경: 이름] / [소품: 이름] / [음악: 이름] / [효과음: 이름] / [톡: 이름] ~ [톡 끝] / 선택: A | B 와 1) 2) 분기</p>
      <label class="f" for="ep_hint">AI에게 바라는 내용 (선택)</label><input class="in" id="ep_hint" placeholder="예: 메인 2장 사건 직후, 둘만 남은 옥상">
      <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="aiep" data-id="${cid}">AI로 대본 쓰기</button></div>
      <div class="row" style="margin-top:16px"><button class="btn" data-act="saveep" data-id="${cid}" data-ep="${e.id}">저장</button>${eid?`<button class="btn ghost" data-act="delep" data-id="${cid}" data-ep="${e.id}">삭제</button>`:''}</div>`);
  }

  static trigOptions(cur){
    const v=cur?(cur.type==='start'?'start':cur.type+':'+cur.value):'start';
    const o=[['start','계약 직후']];
    for(let i=1;i<=10;i++) o.push(['aff:'+i,`호감도 Lv.${i} 달성`]);
    G.chapters.forEach((ch,ci)=>ch.stages.forEach((s,si)=>o.push(['clear:'+s.id,`${ci+1}-${si+1} ${s.title} 클리어`])));
    return CoreView.opt(o,v);
  }

  static openThEdit(cid,tid){
    const c=charById(cid); const t=tid?threadById(tid):{id:'',title:'',trigger:{type:'aff',value:3},needOwn:true,script:''};
    CoreView.openModal(`${head(`${esc(c.name)} ${esc(System.T('talk'))}`)}
      <label class="f" for="th_title">제목</label><input class="in" id="th_title" value="${esc(t.title)}">
      <label class="f" for="th_trig">도착 조건</label><select class="in" id="th_trig">${StoryView.trigOptions(t.trigger)}</select>
      <label class="f" for="th_own">계약 필요 여부</label><select class="in" id="th_own">${CoreView.opt([['1','계약한 경우에만'],['0','계약 전에도 도착']],t.needOwn===false?'0':'1')}</select>
      <label class="f" for="th_script">대화</label><textarea class="in tall" id="th_script" placeholder="${esc(c.name)}: 메시지&#10;선택: 답장1 | 답장2&#10;1) ${esc(c.name)}: 1번 답장에 대한 반응&#10;[사진: 소품이름]">${esc(t.script)}</textarea>
      <label class="f" for="th_hint">AI에게 바라는 내용 (선택)</label><input class="in" id="th_hint" placeholder="예: 새벽에 잠이 안 온다며 셀카를 보낼지 고민하는 대화">
      <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="aithread" data-id="${cid}">AI로 대화 쓰기</button></div>
      <div class="row" style="margin-top:16px"><button class="btn" data-act="saveth" data-id="${cid}" data-th="${t.id}">저장</button>${tid?`<button class="btn ghost" data-act="resetth" data-th="${t.id}">다시 받기</button><button class="btn ghost" data-act="delth" data-id="${cid}" data-th="${t.id}">삭제</button>`:''}</div>`);
  }

  static openStage(chId,stId){
    const ch=G.chapters.find(x=>x.id===chId),s=ch.stages.find(x=>x.id===stId), cl=!!P().cleared[s.id];
    const code=ch.kind==='event'?'EV'+(ch.stages.indexOf(s)+1):Story.stageCode(s.id);
    const storyBtns=`<div class="row" style="margin-top:8px">${s.pre?`<button class="btn sm ghost" data-act="story" data-ch="${chId}" data-st="${stId}" data-k="pre">전투 전 이야기</button>`:''}${cl&&s.post?`<button class="btn sm ghost" data-act="story" data-ch="${chId}" data-st="${stId}" data-k="post">전투 후 이야기</button>`:''}<button class="btn sm ghost" data-act="chedit" data-ch="${chId}">적·스토리 편집</button></div>`;
    CharactersView.openFormation(s,{kind:ch.kind||'main',ch,code,extra:`data-ch="${chId}" data-st="${stId}"`,storyBtns},'sortie');
  }

  static openChEdit(){
    const ch=chDraft;
    CoreView.openModal(`${head('챕터 편집')}
      <label class="f" for="ch_title">챕터 제목</label><input class="in" id="ch_title" value="${esc(ch.title)}">
      ${ch.stages.map((s,j)=>`<div class="stage-edit">
        <div class="g2"><div><label class="f">스테이지 ${j+1} 제목</label><input class="in" id="st_t_${j}" value="${esc(s.title)}"></div><div><label class="f">보상 성석</label><input class="in" type="number" id="st_r_${j}" value="${s.reward}"></div></div>
        <label class="f" style="margin-top:6px"><input type="checkbox" id="st_s_${j}" ${s.story?'checked':''}> 전투 없음 (이야기만 보는 스테이지 · 전투 전 대본만 써요)</label>
        <label class="f">적 (한 줄에 하나: 이름, 속성, 체력, 공격, 방어, 속도, 보스면 끝에 보스)</label><textarea class="in" id="st_e_${j}">${esc(s.enemies.map(en=>[en.name,en.elem,en.hp,en.atk,en.def,en.spd].join(', ')+(en.boss?', 보스':'')).join('\n'))}</textarea>
        <label class="f">전투 전 대본</label><textarea class="in tall" id="st_pre_${j}">${esc(s.pre||'')}</textarea><button class="btn sm ghost scimg-b" data-act="scimg" data-ta="st_pre_${j}">🖼 이미지 넣기</button>
        <label class="f">전투 후 대본</label><textarea class="in" id="st_post_${j}" style="min-height:160px">${esc(s.post||'')}</textarea><button class="btn sm ghost scimg-b" data-act="scimg" data-ta="st_post_${j}">🖼 이미지 넣기</button>
        <div class="row" style="margin-top:8px">${SAMPLE?`<button class="btn sm ghost" data-act="stdetail" data-j="${j}">✦ AI로 디테일 보강</button>`:''}<button class="btn sm ghost" data-act="delstage" data-j="${j}">이 스테이지 삭제</button></div></div>`).join('')}
      <div class="row"><button class="btn sm ghost" data-act="addstage">스테이지 추가</button></div>
      <div class="row" style="margin-top:16px"><button class="btn" data-act="savech">저장</button><button class="btn ghost" data-act="delch">챕터 삭제</button></div>`);
  }

  static openOpeningEdit(){
    CoreView.openModal(`${head('오프닝')}
      <label class="f" for="op_lines">오프닝 영상 문구 (한 줄에 한 장면, 마지막 줄은 크게 표시)</label><textarea class="in" id="op_lines" style="min-height:160px">${esc(G.opening.lines.join('\n'))}</textarea>
      <label class="f" for="op_pro">프롤로그 대본</label><textarea class="in tall" id="op_pro">${esc(G.opening.prologue)}</textarea><button class="btn sm ghost scimg-b" data-act="scimg" data-ta="op_pro">🖼 이미지 넣기</button>
      <label class="f" for="op_hint">AI에게 바라는 방향 (선택)</label><input class="in" id="op_hint" placeholder="예: 더 어둡고 미스터리하게">
      <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="aiopening">AI로 오프닝 쓰기</button></div>
      <div class="row" style="margin-top:16px"><button class="btn" data-act="saveopening">저장</button></div>`);
  }

    /* 세계관 편집 창에 AI가 낸 값 채우기(View) — 용어 바꾸기 제안(WTERMS)은 처리기가 먼저 담음 */
static worldFormFill(r){ $('#w_name').value=r.name||''; $('#w_sum').value=r.summary||''; $('#w_lore').value=r.lore||''; $('#w_plot').value=r.plot||''; $('#w_fac').value=(r.factions||[]).map(f=>f.name+': '+f.desc).join('\n'); const tb=$('#w_terms'); if(tb&&WTERMS){ tb.hidden=false; tb.querySelector('span').textContent=Object.entries(WTERMS).filter(([k,v])=>v&&TERM_LABEL[k]).map(([k,v])=>TERM_LABEL[k]+': '+v).join(' · '); } }

    // 진행 표시: 버튼이 있으면 버튼 글자, 뒤에서 만드는 중이면 그 작업 칩, 아니면 위쪽 막대
  /* 배경 생성 진행 알림: 그 배경 작업(BGJOBS)이 있으면 작업 표시줄에, 없으면 라이브 막대에 */
static genStep(key,label){ return m=>{ const j=typeof BGJOBS!=='undefined'&&BGJOBS.find(x=>x.key===key); if(j){ j.sub=m; CoreView.bgJobsDraw(); } else LiveOpsView.liveBar(label+' · '+m); }; }

  static openStoryDel(o){ // o: {title, ids, ch, ev, run:()=>void(실제 스토리 삭제)}
    const L=Story.storyLinks(o.ids,o.ch,o.ev); SDEL={o,L};
    const row=(k,label,n,on,hint)=>n?`<label class="pc"><input type="checkbox" data-sd="${k}" ${on?'checked':''}><b>${esc(label)}</b><span>${n}개</span>${hint?`<small class="muted" style="display:block;font-size:.72rem">${esc(hint)}</small>`:''}</label>`:'';
    const rows=row('threads',System.T('talk')+' (이 스토리를 깨면 오는 대화)',L.threads.length,1)+row('codex','도감 기록',L.codex.length,1)+row('libs','CG·소품 (이 스토리에만 나오는 것)',L.libs.length,1)+row('rels','관계 기록 (이 스토리에서 생긴 것)',L.rels.length,1)+row('chars','이 스토리에서 만난 인연 '+System.T('crew'),L.chars.length,0,'아직 보유하지 않은 '+System.T('crew')+'만 · '+L.chars.map(c=>c.name).join(', '));
    CoreView.openModal(`${head('스토리 삭제',`<span class="muted">${esc(o.title)}</span>`)}
      <p style="margin:0 0 8px">이 스토리를 지울까요?${rows?' 함께 지울 것을 골라 주세요.':''}</p>
      ${rows?`<div class="prepcats">${rows}</div>`:'<p class="muted">함께 지울 톡·도감·CG가 없어요.</p>'}
      <div class="row" style="margin-top:12px"><button class="btn" data-act="sdelgo" style="background:var(--rose)">삭제</button><button class="btn ghost" data-act="sdelno">취소</button></div>`); }

  static openEvEdit(id){
    const ev=G.events.find(e=>e.id===id);
    CoreView.openModal(`${head('이벤트 편집')}
      <label class="f" for="ev_t">제목</label><input class="in" id="ev_t" value="${esc(ev.title)}">
      <label class="f" for="ev_d">설명</label><textarea class="in" id="ev_d">${esc(ev.desc)}</textarea>
      <div class="g2"><div><label class="f" for="ev_tok">이벤트 재화 이름</label><input class="in" id="ev_tok" value="${esc(ev.token)}"></div><div><label class="f" for="ev_bg">배경</label><select class="in" id="ev_bg">${StoryView.bgOptions(ev.bg,'기본')}</select></div></div>
      <label class="f" for="ev_shop">교환소 (한 줄에 하나: 종류, 수량, 가격, 횟수 / 종류는 gems·gold·exp·wmat·core·char:대원ID)</label>
      <textarea class="in" id="ev_shop">${esc((ev.shop||[]).map(i=>[(i.type==='char'?'char:'+i.ref:i.type),i.amt,i.price,i.limit].join(', ')).join('\n'))}</textarea>
      <label class="f" for="ev_act">상태</label><select class="in" id="ev_act">${CoreView.opt([['1','진행 중'],['0','종료']],ev.active!==false?'1':'0')}</select>
      <label class="f" for="ev_lore">이야기 종류 (로어북)</label><select class="in" id="ev_lore">${CoreView.opt(Characters.loreOpts(),Story.loreOf(ev))}</select>
      <p class="muted" style="margin:4px 0 0;font-size:.78rem">바꾸면 이 이벤트가 남긴 관계 기록을 지우고 새 범위로 다시 정리해요. IF 스토리로 바꾸면 관계도·스토리 기억에서 빠져요.</p>
      <div class="row" style="margin-top:16px"><button class="btn" data-act="evsave" data-id="${ev.id}">저장</button><button class="btn ghost" data-act="evdel" data-id="${ev.id}">삭제</button></div>`);
  }

    /* 화면 */
static planPanel(){ const p=G.world.plan||{}, iss=Story.planHas()?Story.planCheck():[]; return `<div class="panel pm-hide"><h3>시나리오 설계 ${iss.length?`<span class="badge">점검 ${iss.length}</span>`:''}</h3><p class="muted" style="margin:0 0 6px">${Story.planHas()?`${esc(p.logline||'')} · 막 ${(p.acts||[]).length} · 반전 ${(p.twists||[]).length} · 분기 ${(p.branches||[]).length}`:'큰 틀·플롯·반전·분기를 먼저 설계하면, 새 장을 쓸 때 AI가 그 설계를 따라요(복선은 미리, 반전은 정한 장에서).'}</p><button class="btn sm" data-act="planopen">시나리오 설계</button></div>`; }

  static openPlan(){ const p=Story.PLAN(), n=G.chapters.filter(ch=>ch.kind==='main').length, F=P().flags||{}, iss=Story.planCheck(), t=(k,v,ph,rows)=>rows?`<textarea class="in" data-pl="${k}" rows="${rows}" placeholder="${esc(ph||'')}">${esc(v||'')}</textarea>`:`<input class="in" data-pl="${k}" value="${esc(v??'')}" placeholder="${esc(ph||'')}">`, num=(k,v)=>`<input class="in" type="number" min="1" data-pl="${k}" value="${v??''}" style="max-width:70px">`;
    CoreView.openModal(`${head('시나리오 설계',`<span class="muted">지금 메인 ${n}장</span>`)}
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
    <div class="row" style="margin-top:12px;flex-wrap:wrap;gap:6px"><button class="btn" data-act="plansave">저장</button><button class="btn ghost" data-act="planai" data-k="${Story.planHas()?'improve':'new'}">${Story.planHas()?'AI로 다듬기':'AI로 설계'}</button>${Story.planHas()?'<button class="btn ghost" data-act="planai" data-k="extend">AI로 다음 막 잇기</button>':''}<button class="btn ghost" data-act="close">닫기</button></div>
    <p class="muted" style="font-size:.78rem;margin-top:8px">새 장(메인 스토리)을 만들 때 이 설계에서 그 장에 필요한 것만 AI에 넘겨요. 분기는 대본의 [분기: id] 다음 선택지로 기록되고, 이후 장에 반영돼요.</p>`); }

  static openStoryMemory(){if(System.playMode()){CoreView.toast('플레이 모드를 끄면 작가용 기억을 확인할 수 있어요.');return;}const state=Story.smState();CoreView.openModal(`${head('스토리 기억 관리')}<p class="muted">AI가 다음 이야기에 참고하는 기록입니다. 여기서 수정해도 이미 만든 대본은 바뀌지 않고 이후 생성부터 반영됩니다. 도감과 달리 작가용 비밀이 포함될 수 있어 플레이 모드에서는 숨깁니다.</p><section class="panel"><h3>장별 이야기 기억</h3>${G.chapters.filter(ch=>ch.kind==='main'||(ch.kind==='event'&&!Story.loreOf(ch))).map(ch=>`<div class="ep"><span class="t"><b>${esc(ch.title)}</b><span class="muted">${ch.memory?.locked?'확정 · ':''}${ch.memory?'상세 기억 '+ch.memory.text.length+'자':ch.summary?'이전 요약 '+ch.summary.length+'자':'제목 기반 임시 기억'}${ch.memory&&ch.memory.fingerprint!==Story.smFingerprint(ch)?' · 대본 변경됨':''}</span></span><button class="btn sm ghost" data-sm="chapter" data-id="${esc(ch.id)}">확인·편집</button></div>`).join('')}</section><section class="panel"><h3>작가 확정 사실·공개 금지</h3><p class="muted">실제 사실 / 인물이 아는 사실 / 공개 시점을 구분해서 적어 주세요. 메인 스토리 생성에 함께 전달하며 AI가 자동으로 덮어쓰지 않습니다. 최대 8,000자.</p><textarea class="in tall" id="sm-notes">${esc(state.notes||'')}</textarea><button class="btn sm" data-sm="notes-save">확정 규칙 저장</button></section><section class="panel"><h3>현재 저장과 참조 확인</h3><div class="row"><button class="btn sm ghost" data-sm="inspect">저장된 관계·도감 확인</button><button class="btn sm ghost" data-sm="memo">이어쓰기 기억 미리보기</button><button class="btn sm" data-sm="request">최근 스토리 요청 확인</button></div><p class="muted">최근 요청은 현재 게임에 마지막 요청 1건만 보관합니다. 실제로 전달한 글을 보여주며 모델 내부의 기억이나 이해를 보장하는 화면은 아닙니다.</p></section>`);}

  static openStoryMemoryEditor(id,draft){const ch=G.chapters.find(x=>x.id===id);if(!ch)return;const m=draft||ch.memory||{text:ch.summary||'',brief:'',unresolved:'',locked:false};CoreView.openModal(`${head(esc(ch.title)+' · 이야기 기억')}<p class="muted">보관 장소: 이 게임의 장별 데이터. 상세 기억은 최근 2개 장에 우선 사용하고, 이전 장은 짧은 기억과 미회수 사항을 참고합니다. 기존 대본은 수정하지 않습니다.</p><label class="f">상세 기억 · 최대 6,000자<textarea class="in tall" id="sm-text">${esc(m.text||'')}</textarea></label><label class="f">오래된 장의 핵심 흐름 · 최대 600자<textarea class="in" id="sm-brief">${esc(m.brief||'')}</textarea></label><label class="f">미회수 복선·약속 · 최대 1,200자<textarea class="in" id="sm-unresolved">${esc(m.unresolved||'')}</textarea></label><label class="f"><input type="checkbox" id="sm-locked" ${m.locked?'checked':''}> 작가 확정 — 자동 정리로 덮어쓰지 않기</label><p class="muted">${draft?'AI가 다시 정리한 미적용 결과입니다. 확인 후 저장해야 반영됩니다.':'2,000~3,000자 내외를 권장하며 필요한 장만 길게 남기세요.'}</p><div class="row"><button class="btn" data-sm="save" data-id="${esc(id)}">기억 저장</button><button class="btn ghost" data-sm="rebuild" data-id="${esc(id)}">대본 전체에서 다시 정리</button><button class="btn ghost" data-sm="undo" data-id="${esc(id)}" ${ch.memoryPrevious?'':'disabled'}>이전 기억 복원</button></div>`);}

  static async smRebuild(id){const initialGame=G,initialProject=Core.PJ().active;const ch=G.chapters.find(x=>x.id===id);if(!ch)return;if(ch.memory?.locked){CoreView.toast('작가 확정된 기억입니다. 확정을 해제하고 저장한 뒤 다시 정리해 주세요.');return;}if(!SAMPLE){CoreView.toast('글 AI를 먼저 연결해 주세요.');return;}if(!await appConfirm('이 장의 대본을 끝까지 읽어 기억 초안을 만듭니다. AI 사용량이 발생하며, 결과를 확인하고 저장하기 전에는 기존 기억을 바꾸지 않습니다. 진행할까요?'))return;
   if(G!==initialGame||Core.PJ().active!==initialProject||!G.chapters.includes(ch))return;
   const origin=G,pid=Core.PJ().active,job={controller:new AbortController()};SM_JOB?.controller.abort();SM_JOB=job;CoreView.openModal(`${head('이야기 기억 다시 정리')}<div class="spin"></div><p id="sm-work" role="status">대본을 읽는 중…</p><button class="btn ghost" data-sm="stop">정리 중단</button>`);const node=document.getElementById('sm-work');const watcher=new MutationObserver(()=>{if(!node.isConnected)job.controller.abort();});watcher.observe(document.getElementById('modal'),{childList:true,subtree:true});let dots=0;const timer=setInterval(()=>{if(node.isConnected)node.textContent=(job.label||'대본을 읽는 중')+'.'.repeat(dots++%3+1);},450);
   try{const draft=await Story.smExtract(ch,{signal:job.controller.signal,onProgress:label=>{job.label=label;}});if(job.controller.signal.aborted||!node.isConnected||G!==origin||Core.PJ().active!==pid)return;StoryView.openStoryMemoryEditor(id,draft);}catch(e){if(node.isConnected){node.textContent=e.message||String(e);node.nextElementSibling.textContent='돌아가기';node.nextElementSibling.dataset.sm='stop';}}finally{clearInterval(timer);watcher.disconnect();if(SM_JOB===job)SM_JOB=null;}}

  static openDraftExport(name,d,back){ DRX={name,d,back}; const code=draftCode(d,name);
    CoreView.openModal(`${head('초안 내보내기',`<span class="muted">「${esc(name)}」</span>`)}
      <p class="muted" style="margin:0 0 6px;font-size:.82rem">코드를 복사해 다른 기기·다른 사람에게 보내거나 파일로 저장해요. 받는 쪽은 새 게임 초안 → 📂 초안 보관함 → 📥 가져오기에서 넣어요. 주인공 프로필 그림은 들어가지 않아요(외모 글은 들어가요).</p>
      <textarea class="in" id="drx_code" readonly style="min-height:110px;font-size:.72rem">${esc(code)}</textarea>
      <p class="muted" style="margin:4px 0 0;font-size:.74rem">${nf(code.length)}자</p>
      <div class="row" style="margin-top:10px"><button class="btn" data-act="drxcopy">코드 복사</button><button class="btn ghost" data-act="drxfile">파일로 저장</button><button class="btn ghost" data-act="drxback">돌아가기</button></div>`); }

  static openDraftImport(){ CoreView.openModal(`${head('초안 가져오기','<span class="muted">코드나 파일로 받은 초안을 보관함에 넣어요</span>')}
      <label class="f" for="dri_code">초안 코드 (GGMDRAFT:로 시작)</label><textarea class="in" id="dri_code" style="min-height:110px;font-size:.75rem" placeholder="GGMDRAFT:…"></textarea>
      <label class="f"><input type="checkbox" id="dri_load" checked> 가져온 뒤 바로 불러오기</label>
      <div class="row" style="margin-top:10px"><button class="btn" data-act="drigo">코드로 가져오기</button><button class="btn ghost" data-act="drifile">파일 고르기</button><button class="btn ghost" data-act="drxback">돌아가기</button></div>`); }

  static drLibHTML(){ const a=Story.drLib(); return `<div class="dr-lib" id="drLib"><div class="row" style="margin:0 0 6px"><b style="flex:1">저장한 초안 ${a.length}개</b><button class="btn sm" data-act="drlibsave">💾 지금 초안 저장</button></div>
    <div class="row" style="margin:0 0 6px"><button class="btn sm ghost" data-act="drxcur">📤 지금 초안 내보내기</button><button class="btn sm ghost" data-act="drimport">📥 가져오기 (코드·파일)</button></div>
    ${a.length?a.map(x=>`<div class="sw-pjr"><b>${esc(x.name)}</b><i>${new Date(x.at).toLocaleDateString()}</i><button class="btn sm" data-act="drlibload" data-id="${x.id}">불러오기</button><button class="btn sm ghost" data-act="drxlib" data-id="${x.id}">내보내기</button><button class="btn sm ghost" data-act="drlibdel" data-id="${x.id}">✕</button></div>`).join(''):'<p class="muted" style="margin:0;font-size:.8rem">아직 없어요. 지금 초안을 저장해 두면 언제든 이대로 다시 만들 수 있어요.</p>'}</div>`; }

  static drModeHTML(){ return `<div class="dr-modes"><button class="dr-mode" data-act="drmode" data-v="auto"><em>1</em><b>자율주행</b><span>한 줄만 적으면 AI가 세계관·인물·이야기를 모두 만들어요.<br><i>예: 미소녀들만 있는 이세계 판타지.</i></span></button>
      <button class="dr-mode" data-act="drmode" data-v="detail"><em>2</em><b>디테일</b><span>테마·세계관·설정·인물·주인공을 직접 자세히 적어요. 적은 건 그대로 살리고 빈 곳만 AI가 채워요.</span></button></div>`; }

  static openDraft(tab){ DR2=Core.drLoad(); if(tab) DRTAB=tab;
    if(DR2.hero.av&&!DRAVU){ Core.idbGet('draft_avatar').then(b=>{ if(b){ DRAVU=URL.createObjectURL(b); const el=$('#drAvBox'); if(el) el.innerHTML=`<img src="${esc(DRAVU)}" alt="프로필">`; } }).catch(()=>{}); }
    const top=`<div class="dr-top"><button class="x" data-act="close" aria-label="닫기">‹</button><div><i>NEW GAME</i><h2>새 게임 초안</h2></div><button class="btn sm ghost" data-act="drlib" style="margin-left:auto">📂 초안 보관함</button>${DR2.mode?`<button class="btn sm ghost" data-act="drmode" data-v="">${DR2.mode==='auto'?'1. 자율주행':'2. 디테일'} · 바꾸기</button>`:''}</div>${DR2.reuse?`<div class="optbox dr-reuse" style="margin:0 0 8px;font-size:.82rem">🎲 <b>그림 유지 리롤</b> · 「${esc(DR2.reuse.title||'')}」의 ${esc(System.T('crew'))}·NPC·배경 그림을 <b>이름이 같은 인물·배경</b>에 그대로 써요. 이름을 바꾸거나 새 인물을 넣으면 그 인물만 새로 그려요. 원래 게임은 그대로 남아요. <button class="linkb" type="button" data-act="drreuseoff">그림 새로 그리기로 바꾸기</button></div>`:''}`;
    if(!DR2.mode){ CoreView.openModal(`<div id="drPage" class="dr-page">${top}<p class="muted" style="margin:0 0 10px">어떻게 만들까요? 지금 게임은 그대로 남아요.</p>${StoryView.drModeHTML()}</div>`,false,'cs-sheet dr-sheet'); return; }
    if(DR2.mode==='auto'){ CoreView.openModal(`<div id="drPage" class="dr-page">${top}${ArtView.drAutoHTML()}</div>`,false,'cs-sheet dr-sheet'); return; }
    CoreView.openModal(`<div id="drPage" class="dr-page">${top}
      <div class="dr-intro"><p class="muted" style="margin:0">적은 내용은 그대로 살리고, 빈 곳만 AI가 채워요.</p>
        <p class="muted" style="margin:6px 0">전체 <b id="drCount">${nf(Story.drLen())}</b>자</p>
        <div class="row"><button class="btn" data-act="drmake" ${SAMPLE?'':'disabled'}>이 설정으로 새 게임 만들기</button><button class="btn sm ghost" data-act="drmanual" title="글 AI 없이 적은 내용 그대로 게임을 만들어요">✍ AI 없이 직접 시작</button><button class="btn sm ghost" data-act="drdedup" title="AI 없이, 여러 칸에 똑같이 들어 있는 문장을 한 번만 남겨요">🧹 겹치는 문장 정리</button><button class="btn sm ghost" data-act="drharmony" ${SAMPLE?'':'disabled'}>✦ 전체를 서로 맞춰 다듬기</button>${DR2.undo?`<button class="btn sm ghost" data-act="drundo">↶ 되돌리기 (${esc(DR2.undo.label||'')})</button>`:''}<button class="btn sm ghost" data-act="drpreview">AI에 들어가는 설정 보기</button><button class="btn sm ghost" data-act="drclear">초안 비우기</button></div>
        ${SAMPLE?'':'<p class="muted" style="font-size:.8rem;margin:6px 0 0">글 AI 없이도 「✍ AI 없이 직접 시작」으로 적은 내용 그대로 게임을 만들 수 있어요. 나중에 글 AI를 등록하면 써 둔 내용을 바탕으로 다듬어요.</p>'}<p class="muted" id="ng_stat" style="margin:6px 0 0"></p><button class="linkb" data-act="ailog" style="margin-top:4px;font-size:.8rem">🔍 AI 기록 보기 (안 만들어질 때 원인 확인)</button></div>
      <div class="chips dr-tabs">${DR_TABS.map(([k,l])=>`<button class="chip ${DRTAB===k?'on':''}" data-act="drtab" data-k="${k}">${l}</button>`).join('')}</div>
      ${DR_TABS.map(([k])=>CoreView.drTabHTML(k)).join('')}</div>`,false,'cs-sheet dr-sheet'); }

    /* 초안 화면 부분 갱신(View): 보관함 열고 닫기·다시 그리기 · 탭 · 그림체 칩 · 미리 보기 · 만드는 동안 단추 잠금 */
static drLibToggle(){ const ex=$('#drLib'); if(ex){ ex.remove(); return; } const top=document.querySelector('#drPage .dr-top'); if(top) top.insertAdjacentHTML('afterend',StoryView.drLibHTML()); }

  static drLibRefresh(){ const ex=$('#drLib'); if(ex) ex.outerHTML=StoryView.drLibHTML(); }

  static drTabShow(){ document.querySelectorAll('#drPage [data-dr]').forEach(s=>s.hidden=s.dataset.dr!==DRTAB); document.querySelectorAll('#drPage [data-act=drtab]').forEach(b=>CoreView.chipOn(b,b.dataset.k===DRTAB)); }

  static drPresetShow(v){ document.querySelectorAll('.dr-pre').forEach(b=>CoreView.chipOn(b,(b.dataset.v||'')===v)); }

  static drPreviewToggle(tx){ const old=$('#drPrev'); if(old){ old.remove(); return; } $('#drPage').querySelector('.dr-intro').insertAdjacentHTML('beforeend',`<pre id="drPrev" class="code-box" style="white-space:pre-wrap;max-height:50vh;overflow:auto;margin-top:8px">${esc(tx||'아직 적은 설정이 없어요. 테마 탭의 장르와 키워드만으로 만들어요.')}</pre>`); }

  static drBusy(t){ document.querySelectorAll('#drPage button').forEach(b=>{ if(b!==t&&b.dataset.act!=='ailog') b.disabled=true; }); t.textContent='만드는 중… 화면을 끄지 마세요'; return ()=>{ document.querySelectorAll('#drPage button').forEach(b=>b.disabled=false); if(t.isConnected) t.textContent='다시 시도'; }; }

  static eventsHTML(){
    const evs=G.events.filter(Acquire.gateOpen), locked=G.events.length-evs.length;
    return `${pageHead(System.T('event'),'EVENT','lobby')}
    ${evs.length?evs.map(ev=>`<button class="evcard ${ev.active===false?'off':''}" data-act="evopen" data-id="${ev.id}"><div class="bgl" style="${ArtView.bgStyle(ev.bg||'회색구 골목')}"></div><div class="ev-t"><i>${ev.active===false?'CLOSED':'NOW OPEN'}${Story.loreOf(ev)?' · '+esc(Story.loreLabel(Story.loreOf(ev))):''}</i><b>${esc(ev.title)}</b><span>${esc(ev.desc||'')}</span><em>${esc(ev.token)} ${nf(P().tokens[ev.id]||0)}</em></div></button>`).join(''):'<div class="panel"><p class="muted">아직 이벤트가 없어요.</p></div>'}
    ${locked?`<p class="muted" style="text-align:center;margin:8px 0">🔒 아직 열리지 않은 ${esc(System.T('event'))} ${locked}개 · 메인 스토리를 진행하면 차례로 열려요</p>`:''}
    <div class="panel pm-hide"><h3>새 이벤트</h3><p class="muted" style="margin:0 0 10px">AI가 이벤트 스토리, 이벤트 한정 배너, 교환소, 필요하면 한정 ${System.T('crew')}까지 한 번에 만들어요.</p><button class="btn block" data-act="aievent-open">AI로 이벤트 만들기</button></div>`;
  }

  static eventDetailHTML(){
    const ev=G.events.find(e=>e.id===P().curEvent); if(!ev){tab='event';return StoryView.eventsHTML();}
    const ch=G.chapters.find(c=>c.id===ev.chapterId), tok=P().tokens[ev.id]||0, buy=P().shopBuy[ev.id]||{}, bn=G.banners.find(x=>x.id===ev.bannerId);
    let prev=true, st='';
    if(ch) ch.stages.forEach((s,si)=>{const cl=!!P().cleared[s.id],open=prev;st+=`<button class="stage ${cl?'clear':''} ${open?'':'lock'}" data-act="${open?'stage':'locked'}" data-ch="${ch.id}" data-st="${s.id}"><span class="code">EV${si+1}</span><span class="t"><b>${s.story?'📖 ':''}${esc(s.title)}</b><span class="st">${s.story?'이야기 · ':''}${esc(ev.token)} +${s.story?s.reward*2:s.reward}${cl?(s.story?' · 다시 보기':' · 반복 가능'):''}</span></span></button>`;prev=cl;});
    const item=it=>{const left=it.limit-(buy[it.id]||0), c=it.type==='char'?charById(it.ref):null;
      const name=c?`${c.name} (${Characters.own(c.id)?System.T('limit')+' +1':'획득'})`:Core.rewardText({[it.type]:it.amt});
      return `<div class="ep"><span class="t"><b>${esc(name)}</b><span class="muted">${esc(ev.token)} ${it.price} · 남은 횟수 ${left}</span></span><button class="btn sm" data-act="evbuy" data-id="${it.id}" ${left<=0||tok<it.price?'disabled':''}>교환</button></div>`;};
    return `${pageHead(ev.title,'EVENT','event')}
    <section class="banner" style="min-height:180px"><div class="bgl" style="${ArtView.bgStyle(ev.bg||'회색구 골목')}"></div><div class="bn-t"><i>${ev.active===false?'CLOSED':'EVENT'}${Story.loreOf(ev)?' · '+esc(Story.loreLabel(Story.loreOf(ev))):''}</i><h1>${esc(ev.title)}</h1><p>${esc(ev.desc||'')}</p><p class="ups">${esc(ev.token)} <b>${nf(tok)}</b></p></div></section>
    <h3 class="sec">이벤트 스토리</h3>${st||'<p class="muted">스테이지가 없어요.</p>'}
    ${bn?`<button class="btn block" style="margin:10px 0" data-act="bsel" data-id="${bn.id}" data-go="1">이벤트 ${System.T('gacha')}: ${esc(bn.name)}</button>`:''}
    ${(()=>{ const host=Acquire.evHost(ev); return `<button class="evs-door" data-act="go" data-to="evshop"><div class="evs-bg" style="${ArtView.bgStyle(ev.bg||'회색구 골목')}"></div><div class="evs-av">${host?CoreView.art(host):''}</div><div class="evs-t"><i>EXCHANGE</i><b>이벤트 교환소</b><span>${host?esc(host.name)+'이(가) 기다리고 있어요 · ':''}${esc(ev.token)} ${nf(tok)} · 상품 ${(ev.shop||[]).length}개</span></div><em>입장 ›</em></button>`; })()}
    <div class="row" style="margin-top:12px"><button class="btn sm ghost" data-act="evedit" data-id="${ev.id}">이벤트 편집</button>${ch?`<button class="btn sm ghost" data-act="chedit" data-ch="${ch.id}">스토리 편집</button>`:''}${ch&&SAMPLE?`<button class="btn sm ghost" data-act="evreroll" data-id="${ev.id}">🎲 스토리 다시 쓰기</button>`:''}</div>`;
  }

  static async bootSync(){ const pc=System.PCS(), so=System.SY(); const mode=pc?'pc':(System.syReady()&&so.auto!==false?'gh':null); if(!mode) return false;
    window.__BOOTSYNC=true; let pulled=false, skip=false;
    const ov=document.createElement('div'); ov.id='bootsync'; ov.innerHTML=`<div class="bs-box"><div class="dl-spin"></div><b>${mode==='pc'?'PC':'클라우드'}에서 최신 게임을 확인하는 중…</b><button class="linkb" id="bsSkip">건너뛰고 이 기기 게임으로 시작</button></div>`; document.body.appendChild(ov);
    ov.querySelector('#bsSkip').onclick=()=>{ skip=true; };
    try{ const TO=Symbol('to'); const S=await Promise.race([mode==='pc'?System.pcApi('/api/store/state',{ok404:true,timeout:9000}):System.syRemote(so).then(R=>R.state), new Promise(r=>{ const iv=setInterval(()=>{ if(skip){ clearInterval(iv); r(TO); } },200); setTimeout(()=>{ clearInterval(iv); r(TO); },mode==='pc'?10000:15000); })]);
      if(S===TO) return false;
      const cfg=mode==='pc'?System.PCS():System.SY(), mine=!!(S&&S.devId&&S.devId===System.devId()), unpushed=(G.prog.savedAt||0)>(cfg.localAt||0)+5000&&!!cfg.last;
      if(S&&S.at>(cfg.last||0)&&!mine){
        if(unpushed) return false; // 이 기기에도 안 올린 진행이 있으면 물어봐요(아래 확인 창)
        if(!System.bootPullOk()){ setTimeout(()=>StoryView.openPullFail(mode,'loop'),800); return false; } // 받기→다시 시작이 되풀이되면 멈추고 알려요
        ov.querySelector('b').textContent=`${S.device||'다른 기기'}의 게임을 받아 오는 중…`;
        pulled=await (mode==='pc'?SystemCtl.pcPull():SystemCtl.syPull());
        if(pulled){ setTimeout(()=>{ const el=$('#bootsync'); if(el){ el.remove(); SystemView.reloadGame(); } },6000); return true; }
        setTimeout(()=>StoryView.openPullFail(mode),800); return false; }
      if(!S&&mode==='pc'&&P().seenOpening) setTimeout(()=>SystemView.pcPush(true),3000);
    }catch(e){ setTimeout(()=>CoreView.toast(mode==='pc'?'PC 서버에 연결하지 못해서 이 기기의 게임으로 시작해요':'클라우드를 확인하지 못해서 이 기기의 게임으로 시작해요'),1500); }
    finally{ if(!pulled){ ov.remove(); window.__BOOTSYNC=false; } }
    return false; }

  static openPullFail(mode,why){ const pc=mode==='pc';
    CoreView.openModal(`${head(pc?'PC의 게임을 받지 못했어요':'클라우드 게임을 받지 못했어요')}
      <p>${why==='loop'?'받아 온 게임으로 다시 시작했는데도 계속 다시 받으려고 해서 멈췄어요.':esc(PULLERR||'연결이 끊겼거나 시간이 오래 걸렸어요.')}</p>
      ${PULLERR_QUOTA||why==='loop'?'<p class="muted">이 기기(브라우저)의 저장 공간이 모자라면 받은 게임이 저장되지 않아요. 아이폰 Safari는 저장 공간이 작아요. 안 쓰는 게임을 PC에서 지우거나(설정 → 게임 목록), 사진·음성을 줄인 뒤 다시 받아 보세요.</p>':''}
      <p class="muted">${pc?'PC에 저장된 게임은 그대로 있어요. 이 기기에서 새로 시작한 게임은 PC에 자동으로 덮어쓰지 않아요.':'클라우드에 올린 데이터는 그대로 있어요.'}</p>
      <div class="row" style="margin-top:12px"><button class="btn" data-act="${pc?'pcpullgo':'sypull'}">다시 받기</button>${pc?'<button class="btn ghost" data-act="pchist">PC 백업</button>':''}<button class="btn ghost" data-act="close">이 기기로 계속</button></div>`); }

  static logoHTML(st){ const t=String(G.meta.title||''), w=t.split(/\s+/).filter(Boolean), sub=String(G.meta.sub||'');
    let kr=Story.titleLines(t).map(tlSpan).join('');
    if(st==='orbitline'&&w.length>1) kr=`<small>${esc(w[0])}</small>${tlSpan(w.slice(1).join(' '))}`;
    if(st==='stroke') kr=tlSpan(w.join(' '));
    const en=!sub?'':st==='star'?`<div class="t-en">${sub.split(/\s+/).map(esc).join('<br>')}</div>`:st==='stroke'?`<div class="t-en"><span>-&nbsp;&nbsp;${esc(sub)}&nbsp;&nbsp;-</span></div>`:`<div class="t-en"><span>${esc(sub)}</span></div>`;
    return `<div class="t-logo ls-${st}">${st==='star'?'<i class="t-spire"></i>':''}${st==='orbitline'?'<i class="t-planet"></i>':''}<div class="t-kr">${kr}${st==='orbitline'||st==='stroke'?'<i class="t-line"></i>':''}</div>${en}</div>`; }

  static showTitle(logo){
    const c=charById(P().titleChar)||charById(P().sec)||G.chars.find(x=>x.rarity===3&&(Characters.charIllust(x)||Characters.imgSrc(x)))||G.chars.find(x=>x.rarity===3)||G.chars[0];
    const oc=c&&Characters.own(c.id), ill=c&&P().lobbyMode!=='stand'&&((oc&&oc.useCg&&oc.dup>=5&&Characters.lbcgSrc(c))||Characters.charIllust(c));
    $('#ov').innerHTML=`<div class="title" data-act="titletap">${ill?`<div class="t-bg t-ill"><img src="${esc(ill)}" alt="" draggable="false"></div>`:`<div class="t-bg" style="${ArtView.bgStyle(P().titleBg||'낙성 분화구')}"></div>${c?`<div class="t-char">${CoreView.art(c)}</div>`:''}`}<div class="t-shade"></div>${StoryView.shootHTML(7)}
      ${StoryView.logoHTML(Story.logoStyle(logo))}
      <button class="t-snd" id="tsnd" data-act="titlesnd" aria-label="${Story.titleSndLabel(Core.SND().bgmOn)}">${Core.SND().bgmOn?'🔊':'🔇'}</button>
      <div class="t-touch">화면을 터치하세요</div><div class="t-ver">GACHA GAME MAKER · ${esc(APP_BUILD)}</div></div>`;
    $('#ov').hidden=false; ArtView.bgm(Story.sceneOf().title);
  }

  static playOpening(){
    OP={lines:(G.opening.lines||[]).filter(Boolean),i:-1,t:null};
    $('#ov').innerHTML=`<div class="op" data-act="opnext">${StoryView.shootHTML(4)}<div class="op-txt" id="opTxt"></div><button class="skipb" data-act="opskip">건너뛰기</button></div>`;
    $('#ov').hidden=false; StoryView.opNext();
  }

  static opNext(){
    if(!OP) return; clearTimeout(OP.t); OP.i++;
    if(OP.i>=OP.lines.length){PlayerView.opEnd();return;}
    const el=$('#opTxt'), last=OP.i===OP.lines.length-1, i=OP.i;
    el.classList.remove('show');
    setTimeout(()=>{ if(!OP||OP.i!==i) return; el.textContent=sub(OP.lines[i]); el.classList.toggle('big',last); el.classList.add('show'); OP.t=setTimeout(StoryView.opNext,last?3600:2800); },500);
  }

  static titleSndShow(on){ const el=$('#tsnd'); if(el){ el.textContent=on?'🔊':'🔇'; el.setAttribute('aria-label',Story.titleSndLabel(on)); } }

    // 전투 없는 이야기 스테이지: 대본만 보고 클리어해요
static openStoryStage(ch,s){ const cl=!!P().cleared[s.id], code=ch.kind==='event'?'EV'+(ch.stages.indexOf(s)+1):Story.stageCode(s.id);
    CoreView.openModal(`${head(esc(code+' '+s.title),'<span class="muted">STORY · 전투 없는 이야기</span>')}
      <div class="ststory" style="${ArtView.bgStyle(Core.stageBg(s)||ch.title)}"><span>📖</span></div>
      <p class="muted" style="margin:8px 0">${cl?'다시 볼 수 있어요.':'이야기를 끝까지 보면 클리어돼요. 첫 클리어 보상: '+(ch.kind==='event'?esc(((G.events.find(ev=>ev.id===ch.eventId)||{}).token)||'토큰')+' '+s.reward*2:'◆'+s.reward)}</p>
      <div class="row"><button class="btn" data-act="ststory" data-ch="${ch.id}" data-st="${s.id}">${cl?'다시 보기':'이야기 보기'}</button><button class="btn ghost" data-act="chedit" data-ch="${ch.id}">스토리 편집</button></div>`); }
}

class StoryCtl {
  static async aiChapterGen(dir,n,cast){ const snap=Core.artSnap(); const r=await Story.aiChapterGen0(dir,n,cast); if(r) CoreView.artAfterAI(snap,'새 이야기 「'+r.ch.title+'」'); return r; }

  static async storyWrapUp(ch,nt,{followups=true}={}){const origin=G,pid=Core.PJ().active;try{const memory=ch.memory?.locked?ch.memory:await Story.smExtract(ch);ch.memory=memory;Core.mark('ch:'+ch.id);if(!followups)return {summary:memory.text,relations:[],threads:[],memory};let extra=null;try{extra=await SAMPLE.json(Core.storyWrapUpPrompt({nt,memory,ch}),{modelTier:'default'});}catch(e){CoreView.toast('상세 기억은 저장했지만 관계·후속 대화 정리는 실패했어요.');}if(G!==origin||Core.PJ().active!==pid||!G.chapters.includes(ch))return null;return {summary:memory.text,relations:extra?.relations||[],threads:extra?.threads||[],memory};}catch(e){CoreView.toast('이야기 기억 정리 실패: '+(e.message||e)+'. 설정의 스토리 기억 관리에서 다시 정리할 수 있어요.');return null;}}

  static draftImportDone(x,load){ if(!x){ CoreView.toast('초안을 읽지 못했어요. 코드를 끝까지 복사했는지 확인해 주세요'); return; }
    const a=Story.drLib(); let name=x.name, i=2; while(a.some(y=>y.name===name)) name=x.name+' ('+(i++)+')'; a.unshift({id:'d'+uid(),name,at:Date.now(),d:Story.drClean(x.d)}); if(!Story.drLibSave(a)) return;
    if(load){ Story.drLoadFrom(x.d,name); } else { StoryView.openDraft(); CoreView.toast(`「${name}」 초안을 보관함에 넣었어요`); } }

  static playStoryStage(ch,s){ SystemView.playStory(s.title,[s.pre,s.post].filter(Boolean).join('\n')||'…',()=>{ const p=P(), first=!p.cleared[s.id];
      if(first){ p.cleared[s.id]=true; if(ch.kind==='event'){ const ev=G.events.find(e=>e.id===ch.eventId); Economy.giveReward({token:s.reward*2},ev&&ev.id); CoreView.toast(`클리어! ${(ev&&ev.token)||'토큰'} +${s.reward*2}`); } else { Economy.giveReward({gems:s.reward,gold:1000}); CoreView.toast(`클리어! ◆${s.reward} · ${System.T('gold')} 1,000`); } CharactersCtl.newBonds(s); Core.mark('prog'); }
      Challenge.render(); MessengerCtl.checkTriggers(); }); }

  static startBattle(chId,stId){
    const ch=G.chapters.find(x=>x.id===chId), s=ch&&ch.stages.find(x=>x.id===stId); if(!s) return;
    if(s.mode==='debate'||s.mode==='contest') return CharactersView.openModeStage(ch,s); // 회담·콘테스트(0488)
    if(Battle.sortieOn()&&!s.story&&(s.enemies||[]).length&&['main','event'].includes(ch.kind||'main')) return Battle.sortieBegin(ch,s); // 출격 경로(0487)
    SystemView.startStage(s,{kind:ch.kind||'main',ch});
  }
}
