/* ===== 0260-new-game — Controller(동작을 받아 Model을 바꾸고 다시 그리게 함 · 섞인 함수는 나눌 것) ===== */
/* src/main/0260-new-game/010-draft.js에서 옮김 */
function drLibSave(a){ try{ appStorage.setItem(DRLIB,JSON.stringify(a.slice(0,30))); return true; }catch(e){ toast('저장 공간이 부족해요'); return false; } }
async function saveTextFile(text,name){ const b=new Blob([text],{type:'application/json'});
  if(IS_NATIVE&&CAP&&CAP.Filesystem){ const FS=CAP.Filesystem, path='가챠게임메이커/초안/'+name;
    try{ try{ if(FS.requestPermissions) await FS.requestPermissions(); }catch(e){ quietErr(e,'0260-new-game/010-draft.js:22'); } await FS.writeFile({path,data:text,directory:'DOCUMENTS',encoding:'utf8',recursive:true}); toast('Documents/'+path+' 에 저장했어요'); return; }
    catch(e){ try{ await FS.writeFile({path:name,data:text,directory:'CACHE',encoding:'utf8'}); const u=await FS.getUri({path:name,directory:'CACHE'}); if(CAP.Share){ await CAP.Share.share({title:name,files:[u.uri]}); return; } }catch(e2){ quietErr(e2,'0260-new-game-draft.js:23'); } toast('파일을 저장하지 못했어요. 코드 복사를 써 주세요'); return; } }
  const file=new File([b],name,{type:'application/json'});
  if(/iPhone|iPad|Android/i.test(navigator.userAgent)&&navigator.canShare&&navigator.canShare({files:[file]})){ try{ await navigator.share({files:[file],title:name}); return; }catch(e){ if(e&&e.name==='AbortError') return; } }
  downloadBlob(file,name); toast('다운로드 폴더에 저장했어요 · '+name); }
function draftImportDone(x,load){ if(!x){ toast('초안을 읽지 못했어요. 코드를 끝까지 복사했는지 확인해 주세요'); return; }
  const a=drLib(); let name=x.name, i=2; while(a.some(y=>y.name===name)) name=x.name+' ('+(i++)+')'; a.unshift({id:'d'+uid(),name,at:Date.now(),d:drClean(x.d)}); if(!drLibSave(a)) return;
  if(load){ drLoadFrom(x.d,name); } else { openDraft(); toast(`「${name}」 초안을 보관함에 넣었어요`); } }
function drLoadFrom(d,label){ try{ appStorage.setItem(DR2KEY,JSON.stringify(drClean(d))); }catch(e){} DRTAB='theme'; openDraft(); toast(`「${label||drName(d)}」 초안을 불러왔어요. 고친 뒤 만들기를 누르면 새 게임으로 만들어져요`); }
async function drAvatarDraw(rep){ drRead(); const hr=DR2.hero; if(!String(hr.look||'').trim()){ toast('외모를 먼저 적어 주세요'); return; } if(!imgReady()){ toast(imgNeed()); return; }
  if(rep) rep('그리는 중…');
  try{ const tags=await heroTags(hr); if(!tags){ toast('태그를 만들지 못했어요. 다시 눌러 주세요'); return; } const b=await naiDraw('char',tags,{candidateEligible:true,originalSrc:DRAVU||'',frame:'cowboy shot',pose:'looking at viewer'}); await idbPut('draft_avatar',b); if(DRAVU) URL.revokeObjectURL(DRAVU); DRAVU=URL.createObjectURL(b); drRead(); DR2.hero.av=tags; drSave(); drRerender(); toast('프로필 그림을 만들었어요'); }
  catch(e){ toast(naiErr(e)); } finally{ if(rep) rep.end(); } }
async function drPolish(k,rep){ drRead(); if(k==='hero') return drPolishHero(rep); const cur=String(DR2[k]||'').trim(); if(!cur){ toast('먼저 내용을 조금 적어 주세요'); return; }
  const what=drPolishWhatText({k});
  const r=await aiJSON(drPolishPrompt({what,k,cur}),rep,'default');
  if(r&&r.text){ drRead(); drSnap(what); DR2[k]=String(r.text); const dn=drDedup(); drSave(); drRerender(); toast('다른 항목에 맞춰 다듬었어요'+(dn?` (겹치는 문장 ${dn}개 정리)`:'')+'. 마음에 안 들면 「되돌리기」'); } }
async function drPolishHero(rep){ const h=DR2.hero;
  const r=await aiJSON(drPolishHeroPrompt({h}),rep,'default');
  if(!r||typeof r!=='object') return; drRead(); drSnap('주인공'); const S=v=>typeof v==='string'?v.trim():''; const H=DR2.hero;
  if(S(r.call)) H.call=S(r.call).slice(0,12); if(S(r.name)&&!String(H.name||'').trim()) H.name=S(r.name).slice(0,12); if(S(r.look)) H.look=S(r.look).slice(0,400); if(S(r.bio)) H.bio=S(r.bio).slice(0,1500);
  drDedup(); drSave(); drRerender(); toast('주인공을 다듬었어요. 마음에 안 들면 「되돌리기」'); }
/* 전체 맞추기: 세계관·설정·스토리·인물·주인공 설정을 한꺼번에 보고, 서로 어긋난 곳을 고치고 관계를 엮어요. 적힌 내용은 살리고, 한 번 되돌릴 수 있어요 */
async function drHarmony(rep){ drRead(); const d=DR2; if(!drText(d).trim()){ toast('먼저 세계관이나 인물을 조금 적어 주세요'); return; }
  const r=await aiJSON(drHarmonyPrompt({d}),rep,'complex');
  if(!r||typeof r!=='object'){ return; } drRead();
  drSnap('전체 맞추기');
  const S=v=>typeof v==='string'?v.trim():'';
  ['world','setting','story'].forEach(k=>{ if(String(d[k]||'').trim()&&S(r[k])) d[k]=S(r[k]); });
  if(String(d.kw||'').trim()&&S(r.kw)) d.kw=S(r.kw).slice(0,400); if(String(d.tone||'').trim()&&S(r.tone)) d.tone=S(r.tone).slice(0,200);
  const rc=Array.isArray(r.chars)?r.chars:[]; d.chars.forEach((c,i)=>{ const o=rc[i]||rc.find(x=>x&&x.name&&x.name===c.name); if(!o) return; ['role','profile','speech','look'].forEach(k=>{ if(S(o[k])) c[k]=S(o[k]); }); if(!String(c.name||'').trim()&&S(o.name)) c.name=S(o.name); });
  if(String(d.hero.bio||'').trim()&&S(r.heroBio)) d.hero.bio=S(r.heroBio);
  const dn=drDedup(d); drSave(); drRerender(); toast('서로 맞춰 다듬었어요'+(dn?` (겹치는 문장 ${dn}개 정리)`:'')+'. 마음에 안 들면 「되돌리기」'); }
async function drFillChar(i,rep){ drRead(); const c=DR2.chars[i]; if(!c) return;
  const r=await aiJSON(drFillCharPrompt({i,c}),rep,'default');
  if(!r) return; let o=Array.isArray(r)?r[0]:r; if(o&&!o.profile&&!o.role){ const v=Object.values(o).find(x=>x&&typeof x==='object'&&!Array.isArray(x)); if(v) o=v; } if(!o||typeof o!=='object'){ toast('AI 응답을 읽지 못했어요. 다시 눌러 주세요'); return; }
  drRead(); const c2=DR2.chars[i]||c; drSnap((c2.name||'인물')+' 다듬기'); const S=v=>Array.isArray(v)?v.join(' ').trim():typeof v==='string'?v.trim():'';
  const RK=/\s*[\[(【]\s*(SSR|SR|R)\s*[\])】]\s*/gi; let rk=''; ['role','profile','speech','look'].forEach(k=>{ let v=S(o[k]); if(!v) return; v=v.replace(RK,(m,g)=>{ rk=rk||g.toUpperCase(); return ' '; }).replace(/\s{2,}/g,' ').trim(); if(v) c2[k]=v; }); if(rk&&!c2.rank&&c2.kind!=='npc') c2.rank=({SSR:3,SR:2,R:1})[rk]; if(!String(c2.name||'').trim()&&S(o.name)) c2.name=S(o.name).replace(RK,' ').trim();
  drDedup(); drSave(); drRerender(); toast(`${c2.name||'인물'}을(를) 다듬었어요. 마음에 안 들면 「되돌리기」`); }
/* src/main/0260-new-game/020-build.js에서 옮김 */
async function runNewGameBuild(rep,draft,builder){
 if(NEW_GAME_SOURCE){toast('이미 게임을 만드는 중입니다');return;}
 if(BGJOBS.length||PREPJOB||LIVE_RUN||PCJOB||SYJOB||BACKUP_BUSY){toast('진행 중인 이야기·그림 생성이 끝난 뒤 새 게임을 만들어 주세요');return;}
 const source=G,project=PJ().active;NEW_GAME_SOURCE=source;
 try{await flush();return await builder(rep,draft,project);}
 finally{G=source;NEW_GAME_SOURCE=null;applyMeta();if(rep)rep.end();}
}
async function buildNewGameDraft(rep,draft,sourceProject){if(String(draft?.story||'').length>100000)throw Error('스토리는 최대 100,000자입니다. 초과 내용은 자르지 않았습니다.'); const RSRC=reuseSrc(draft); // 원래 게임은 G를 새 게임으로 바꾸기 전에 잡아 둬요(지금 하던 게임을 리롤할 때)
  draft=draft||drLoad(); const auto=draft.mode==='auto';
  const userTitle=String(draft.gtitle||'').trim().slice(0,30);
  const kw=(auto?String(draft.auto||''):String(draft.kw||'')).trim()||String(draft.world||'').slice(0,120).trim(); if(!kw){toast('만들고 싶은 게임을 적어 주세요');return;}
  const tone=auto?'':String(draft.tone||'').trim(), th=auto?'auto':(draft.theme||'auto'), n=+draft.n||8, stat=m=>{if(rep)rep(m);};
  const ngSty=String((auto?'':draft.style)||'').trim()||(presetQualityParts(allPresets().find(x=>x.id===draft.preset)||{}).tags);
  const src=!auto&&draft.fan?String(draft.src||'').trim():'';
  const hero=Object.assign({name:'',call:'',gender:'',look:'',bio:'',hide:false},draft.hero||{}), gen=genderCode(hero.gender), heroBlank=!String(hero.gender||'').trim()&&!String(hero.look||'').trim();
  const SC=auto?{plot:'',stages:0,len:'normal'}:{plot:String(draft.story||''),stages:+draft.stages||0,len:STORY_LEN[draft.len]?draft.len:'normal'}, LS=STORY_LEN[SC.len][1], N1=SC.stages||4;
  const DT=auto?'':drText(draft).slice(0,100000), DRA=buildNewGameDraftDRAText({DT,draft,plot:SC.plot});
  const DALL=auto?[]:(draft.chars||[]).filter(c=>String(c.name||'').trim()), DCH=DALL.filter(c=>c.kind!=='npc'), DNPC=DALL.filter(c=>c.kind==='npc');
  const STY=buildNewGameDraftSTYText({SC});
  const FAN=buildNewGameDraftFANText({src});
  const DK=JSON.stringify({kw,tone,th,n,ngSty,src,SC,DT,ct:String(draft.crewTerm||''),cs:String(draft.castSex||'')}); let DR=null; try{ DR=JSON.parse(appStorage.getItem('ggm-ng-draft')||'null'); }catch(e){} if(!DR||DR.key!==DK) DR={key:DK,r:{}};
  const saveDR=()=>{ try{ appStorage.setItem('ggm-ng-draft',JSON.stringify(DR)); }catch(e){} };
  const ngStep=async(k,label,fn,ok)=>{ if(DR.r[k]&&ok(DR.r[k])){ stat(label+' (이전에 만든 것 이어 쓰기)'); return DR.r[k]; }
    for(let i=0;i<3;i++){ stat(label+(i?` · 다시 시도 ${i}/2${AI_QUIET_LAST?' — '+AI_QUIET_LAST:''}`:'')); AISTAGE='새 게임 '+label.replace(/…$/,''); AI_QUIET=i<2; let r; try{ r=await fn(); }finally{ AI_QUIET=false; } if(r&&ok(r)){ DR.r[k]=r; saveDR(); AISTAGE=''; return r; }
      if(r) aiLog({ok:false,stage:AISTAGE,err:'응답은 왔지만 필요한 항목이 빠졌어요(길이 제한으로 잘렸거나 형식이 달라요). 받은 항목: '+Object.keys(r).join(', ').slice(0,200)}); await wait(1500); } AISTAGE=''; AI_QUIET_LAST=''; return null; };
  if(Object.keys(DR.r).length) toast('지난번에 만들던 단계부터 이어서 만들어요');
  rep.lock(); const base=buildNewGameDraftBaseText({draft});
  const a=await ngStep('a','1/4 세계관과 게임 정의를 만드는 중…',()=>aiJSON(buildNewGameDraftPrompt({base,FAN,STY,DRA,auto,heroBlank,hero,draft,DT,kw,tone,userTitle,th}),null,'complex'),r=>r&&r.title&&r.world&&String(r.world.plot||r.world.summary||'').trim()); /* 플롯·요약이 없으면 다시 묻기(빈 세계관에 원본 샘플이 남던 문제) */
  if(!a){rep.end();stat('세계관 생성에 실패했어요. 같은 내용으로 다시 누르면 이어서 만들어요.');return;}
  const ng=defaults(); ng.lib=ng.lib.filter(l=>!['bg','prop','cg','map'].includes(l.kind)); ng.world=blankWorld(); /* 원본 샘플 게임의 배경·소품·세계관은 새 게임에 남기지 않아요 — 남으면 생성 프롬프트의 "기존 목록"으로 들어가 다른 세계의 장소가 대본에 섞여요 */ if(heroBlank&&a.hero&&typeof a.hero==='object'){ hero.gender=String(a.hero.gender||'').slice(0,40); hero.look=String(a.hero.look||'').slice(0,400); } if(hero){ ng.prog.player=String(hero.name||'').slice(0,12); ng.prog.genderTxt=String(hero.gender||''); ng.prog.gender=genderCode(hero.gender); ng.prog.look=String(hero.look||''); ng.prog.bio=String(hero.bio||''); ng.prog.hideEyes=!!hero.hide; ng.prog.nameAsked=true; }
  ng.meta=Object.assign(clone(DEFAULT_META),{title:userTitle||String(a.title||'새 게임'),sub:String(a.sub||''),theme:['tactical','fantasy','neon','pastel','noir'].includes(a.theme)?a.theme:'tactical',accent:/^#[0-9a-f]{6}$/i.test(a.accent||'')?a.accent:'#ffb400'});
  ng.meta.artTags=ngSty; { const sp=allPresets().find(x=>x.id===draft.preset); if(sp&&ngSty===presetQualityParts(sp).tags) ng.meta.artNeg=sp.neg; } ng.meta.tone=tone; ng.meta.castSex=CAST_SEX[draft.castSex]?draft.castSex:''; if(DT) ng.meta.bible=DT; ng.meta.story={plot:SC.plot,stages:SC.stages,len:SC.len,depth:draft.depth==='fast'?'fast':'deep',newc:draft.newc==null?2:+draft.newc,talkOnly:draft.talkOnly==null?1:+draft.talkOnly,finale:finaleOf(a.finale)}; /* 장의 마지막 스테이지 형식(장르에 따라) */
  ng.meta.terms=Object.assign(clone(DEFAULT_META.terms),a.terms||{}); ng.meta.terms.abyss=explorationName(a.terms?.abyss); if(String(draft.crewTerm||'').trim()) ng.meta.terms.crew=String(draft.crewTerm).trim().slice(0,8); if(String(hero.call||'').trim()) ng.meta.terms.player=String(hero.call).trim().slice(0,12); try{ ng.meta.draft=drClean(draft); }catch(e){} if(Array.isArray(a.elems)&&a.elems.length>=2){ const L=a.elems.slice(0,8).map((e,i)=>({d:String(e.d||'').slice(0,80),n:elemName(e.n||(DEFAULT_META.elems[i]||{}).n||'속성'+(i+1)),c:/^#[0-9a-f]{6}$/i.test(e.c||'')?e.c:(DEFAULT_META.elems[i]||{c:'#999999'}).c,beats:elemName(e.beats)})); if(new Set(L.map(e=>e.n)).size===L.length){ ng.meta.elems=L.map(({beats,...e})=>e); const N=L.map(e=>e.n), beats={}; L.forEach(e=>{ if(N.includes(e.beats)&&e.beats!==e.n) beats[e.n]=e.beats; }); ng.meta.rules=Object.assign(ng.meta.rules||{},Object.keys(beats).length?{beats}:{},{reactions:(Array.isArray(a.reactions)?a.reactions:[]).slice(0,6).map(x=>Object.assign({},x,{a:elemName(x&&x.a),b:elemName(x&&x.b)})).filter(x=>N.includes(x.a)&&N.includes(x.b)&&x.a!==x.b).map(reactClean)}); } }
  if(a.roleDesc&&typeof a.roleDesc==='object'){ ng.meta.rules=Object.assign(ng.meta.rules||{},{roleDesc:Object.fromEntries(['atk','def','sup'].map(k=>[k,String(a.roleDesc[k]||'').slice(0,80)]))}); }
  { const L=posClean(a.positions); if(posValid(L)) ng.meta.positions=L; }
  ng.meta.roles=Object.assign(clone(DEFAULT_META.roles),a.roles||{});
  ng.world=Object.assign(blankWorld(),a.world||{}); ng.world.factions=factionClean(ng.world.factions); /* 세력 설계(0445) */ { const sd=[]; ng.world.summary=dedupText(ng.world.summary,sd).text; ng.world.lore=dedupText(ng.world.lore,sd).text; }
  ngWorldExtras(ng,a);
  const oldG=G; G=ng; applyMeta();
  const b=await ngStep('b',`2/4 ${T('crew')} ${n}명을 만드는 중…`,()=>aiJSON(buildNewGameDraftPrompt2({FAN,STY,DCH,DNPC,DRA,ng,n,N1,src}),null,'complex'),r=>r&&Array.isArray(r.chars)&&r.chars.length>=Math.max(1,Math.ceil(n*0.8))&&new Set(r.chars.map(c=>String(c&&c.name||'').trim())).size===r.chars.length); /* 요청 인원의 80% 이상·이름 중복 없음이어야 통과(아니면 다시 묻기) */
  if(!b){G=oldG;applyMeta();rep.end();stat('캐릭터 생성에 실패했어요. 같은 내용으로 다시 누르면 1단계는 건너뛰고 이어서 만들어요.');return;}
  ng.chars=[]; b.chars.slice(0,Math.max(12,DCH.length)).forEach(x=>{ if(isMonsterLike(x)) return; const c=cleanChar(x); c.faction=factionMatch(ng.world.factions,c.faction); /* 넣기 전에 세력 이름 맞춤 — 반복 중 factions()가 넣은 대원의 소속을 세력으로 추가하므로 늦으면 비슷한 이름이 따로 생김 */ if(!c.name||DNPC.some(d=>d.name===c.name))return; c.ord=ng.chars.length; const db=String(x.debut||'start').trim(); if(db==='later') c.debutLater=true; else if(+db>=1) c.__deb=Math.min(N1,Math.round(+db)); ng.chars.push(c);});
  { const st=ng.chars.filter(c=>!c.__deb&&!c.debutLater); ng.chars.filter(c=>c.__deb||c.debutLater).slice(0,Math.max(0,3-st.length)).forEach(c=>{ delete c.__deb; delete c.debutLater; }); } // 등장 계획: 처음부터 동료 3명 이상, 소속 세력은 목록에
  // 초안에 적은 대원은 반드시 대원으로: 이름이 바뀌었으면 되돌리고, 빠졌으면 따로 만들어 넣어요
  { const findD=d=>ng.chars.find(c=>c.name===d.name)||ng.chars.find(c=>c.name.includes(d.name)||d.name.includes(c.name));
    let miss=DCH.filter(d=>!findD(d));
    if(miss.length){ stat(`2/4 초안의 ${T('crew')} ${miss.length}명을 마저 만드는 중…`); for(let k=0;k<2&&miss.length;k++){ const r2=await aiJSON(buildNewGameDraftPrompt3({ng,miss}),null,'complex');
        (r2&&Array.isArray(r2.chars)?r2.chars:[]).forEach(x=>{ const c=cleanChar(x); if(!c.name) return; const d=miss.find(m=>m.name===c.name||c.name.includes(m.name)); if(d) c.name=d.name; c.ord=ng.chars.length; ng.chars.push(c); }); miss=DCH.filter(d=>!findD(d)); } }
    DCH.forEach(d=>{ const c=findD(d); if(!c) return; c.name=d.name; if(d.rank) c.rarity=+d.rank; const tg=String(d.tags||'').trim(); if(tg) c.naiPrompt=stripAge(tg); }); }
  ngCharsPost(ng,DCH);
  if(SAMPLE&&ng.chars.some(c=>c.weapon&&wpBad(c.weapon.prompt))){ stat(`2/4 ${T('weapon')} 그림 프롬프트를 정리하는 중…`); await fixWeaponPrompts(ng.chars,ng.world); }
  // NPC: 대원은 아니지만 스토리에 나오고 그림(전신·상반신)을 가져요. 나중에 대원으로 쓸 수도 있어요
  ng.npcs=[]; if(DNPC.length){ stat('2/4 NPC 모습을 정하는 중…'); const r3=await aiJSON(buildNewGameDraftPrompt4({ng,DNPC}),null,'default');
    DNPC.forEach(d=>{ const x=(r3&&Array.isArray(r3.npcs)?r3.npcs:[]).find(y=>y&&y.name===d.name)||{}; const id='npc_'+uid(); ng.npcs.push({id,npc:true,name:d.name,role:d.role||'',profile:d.profile||'',speech:d.speech||'',look:d.look||'',naiPrompt:String(d.tags||'').trim()?stripAge(String(d.tags).trim()):String(x.naiPrompt||''),img:null,faces:[],skins:[],lines:[],touch:{head:[],body:[]},affLines:{},upper:{id:'up_'+id,kind:'upper',name:d.name+' 상반신',prompt:'',img:null}}); }); }

  ng.world.source=src;
  // 그림 유지 리롤이면 원래 게임의 그림 있는 배경·소품을 먼저 넣어 두고 AI가 그 이름을 우선 쓰게 해요
  const RS0=RSRC, KEEP=RS0?(RS0.g.lib||[]).filter(l=>['bg','prop'].includes(l.kind)&&l.img).map(l=>JSON.parse(JSON.stringify(l))):[];
  if(KEEP.length) ng.lib=[...KEEP,...ng.lib.filter(l=>!['bg','prop'].includes(l.kind))];
  const KEEPHINT=buildNewGameDraftKEEPHINTText({KEEP});
  const CX0=`${RULES}${FAN}\n${ctx().replace(/메인 스토리 진행:.*\n/,'')}${KEEPHINT}`;
  const c3a=await ngStep('c3a','3/4 오프닝, 배경·소품·음악 목록, 배너를 만드는 중…',()=>aiJSON(buildNewGameDraftPrompt5({CX0,LS,ng}),null,'complex'),r=>r&&r.opening&&Array.isArray(r.backgrounds));
  if(!c3a){G=oldG;applyMeta();rep.end();stat('오프닝 생성에 실패했어요. 같은 내용으로 다시 누르면 앞 단계는 건너뛰고 이어서 만들어요.');return;}
  const bgNames=[...new Set([...(c3a.backgrounds||[]).map(x=>x&&x.name).filter(Boolean),...KEEP.filter(l=>l.kind==='bg').map(l=>l.name)])], prNames=[...new Set([...(c3a.props||[]).map(x=>x&&x.name).filter(Boolean),...KEEP.filter(l=>l.kind==='prop').map(l=>l.name)])];
  const c3b=await ngStep('c3b','4/4 1장 스토리와 메신저를 만드는 중…',()=>aiJSON(buildNewGameDraftPrompt6({CX0,bgNames,prNames,N1,LS,ng}),null,'complex'),r=>r&&r.chapter&&Array.isArray(r.chapter.stages)&&r.chapter.stages.length);
  const c3=c3b?Object.assign({},c3a,c3b):null;
  if(!c3||!c3.chapter){G=oldG;applyMeta();rep.end();stat('1장 스토리 생성에 실패했어요. 같은 내용으로 다시 누르면 앞 단계(세계관·캐릭터·오프닝)는 건너뛰고 1장만 다시 만들어요. 그림은 아직 그리지 않았어요.');return;}
  ng.opening={lines:strs(c3.opening&&c3.opening.lines),prologue:nl(c3.opening&&c3.opening.prologue)};
  const ch=c3.chapter; ng.chapters=[{id:'c1',ord:0,kind:'main',title:String(ch.title||'1장'),logline:String(ch.logline||'').slice(0,120),stages:(ch.stages||[]).slice(0,12).map((s2,i)=>({id:'s1'+(i+1),title:String(s2.title||'작전'),reward:300+100*i,pre:nl(s2.pre),post:nl(s2.post),
    enemies:(Array.isArray(s2.enemies)?s2.enemies:[]).slice(0,5).map(e2=>({name:String(e2.name||'적'),elem:ELEMS.includes(e2.elem)?e2.elem:ELEMS[0],hp:num(e2.hp,100,99999,900),atk:num(e2.atk,10,999,80),def:num(e2.def,0,500,35),spd:num(e2.spd,50,160,95),boss:!!e2.boss}))}))}];
  ng.__looks=lookMap((c3.chapter||{}).stages);
  ng.chars.forEach(c=>{ if(c.__deb){ const s2=ng.chapters[0].stages[c.__deb-1]; if(s2) c.debut=s2.id; delete c.__deb; } }); // 등장 계획 → 첫 등장 스테이지(0445)
  ng.chapters[0].stages.forEach((s,i,a)=>{ const src=(ch.stages||[])[i]||{}, md=i<a.length-1||storyCfg().finale!=='battle'?modeClean(src):null; if(md){ Object.assign(s,md); s.enemies=[]; return; } if(src.battle===false&&i<a.length-1){ s.story=true; s.enemies=[]; if(s.post){ s.pre=[s.pre,s.post].filter(Boolean).join('\n'); s.post=''; } return; } if(!s.enemies.length)s.enemies=[{name:'적',elem:ELEMS[0],hp:900,atk:80,def:35,spd:95,boss:false}]; const rt=routeClean(src.route); if(rt) s.route=rt; }); /* 출격 경로 지점 이름(2장 이후와 같게) */
  ng.chapters[0].summary=String(c3.summary||'').slice(0,6000); ng.rels=[]; try{ relApply(c3.relations,'프롤로그·1장',true); relFromProfiles(true); relFromScripts(ng.chapters[0],'1장',true); ng.meta.relProf=1; }catch(e){}
  const L=(kind,arr)=>(Array.isArray(arr)?arr:[]).filter(x=>x&&x.name).map(x=>({id:'l'+uid(),kind,name:String(x.name),prompt:String(x.prompt||''),img:null}));
  { const fresh=[...L('bg',c3.backgrounds),...L('prop',c3.props)].filter(l=>!KEEP.some(k=>k.kind===l.kind&&k.name===l.name)); ng.lib=[...KEEP,...fresh,...L('bgm',c3.music),...clone(DEFAULT_SFX)]; } syncEnemies(ng,ng.__looks); delete ng.__looks; bestiaryApply(c3.bestiary,ng); { const sts=ng.chapters[0].stages; sts.forEach((s2,i)=>{ if(!s2.story) stageAutoRules(s2,i,sts.length); }); } /* 적 도감·전장 규칙(0445·0485) */
  const mus=ng.lib.filter(l=>l.kind==='bgm').map(l=>l.name), pickM=(re,i)=>mus.find(m=>re.test(m))||mus[i]||'';
  const bn=c3.banners||{}, ssr=ng.chars.filter(c=>c.rarity===3), pu=ng.chars.find(c=>c.name===(bn.pickup&&bn.pickup.char)&&!c.debut&&!c.debutLater)||ssr.find(c=>!c.debut&&!c.debutLater)||ssr[0], fac=(()=>{ const hasSSR=f=>ng.chars.some(c=>c.faction===f&&c.rarity===3), want=(bn.faction&&bn.faction.faction)||''; return hasSSR(want)?want:((ng.chars.find(c=>c.rarity===3&&c.faction)||ng.chars[0]||{}).faction||''); })();
  ng.banners=[{id:'std',name:String(bn.std||'상시 '+T('gacha')),type:'std',desc:'',pool:{mode:'all',factions:[],ids:[]},pickup:[],rate:50,active:true,bg:''}];
  if(pu) ng.banners.push({id:'b_pu',name:String((bn.pickup&&bn.pickup.name)||pu.name+' 확률 업'),type:'pickup',desc:`SSR ${pu.name} 확률 상승`,pool:{mode:'all',factions:[],ids:[]},pickup:[pu.id],rate:50,active:true,bg:''});
  if(fac) ng.banners.push({id:'b_fac',name:String((bn.faction&&bn.faction.name)||fac+' 모집'),type:'pool',desc:`${fac} 소속만 등장`,pool:{mode:'faction',factions:[fac],ids:[]},pickup:[],rate:50,active:true,bg:''});
  const say1=storySayNorms(ng.chapters[0]); ng.threads=(Array.isArray(c3.threads)?c3.threads:[]).map(x=>{const c=ng.chars.find(q=>q.name===String(x.char||'').trim());if(!c||!x.script||threadDup(nl(x.script),say1))return null;const st=ng.chapters[0].stages[Math.min(ng.chapters[0].stages.length,Math.max(1,+x.afterStage||1))-1];return {id:uid(),charId:c.id,title:String(x.title||'메시지'),trigger:x.trigger==='start'?{type:'start'}:{type:'clear',value:st.id},needOwn:x.trigger==='start',script:nl(x.script)};}).filter(Boolean);
  ng.events=[]; { const keep=hero?{player:ng.prog.player,genderTxt:ng.prog.genderTxt,gender:ng.prog.gender,look:ng.prog.look,bio:ng.prog.bio,hideEyes:ng.prog.hideEyes,nameAsked:true}:null; ng.prog=clone(DEFAULT_PROG); ng.prog.gender=gen; if(keep) Object.assign(ng.prog,keep); }
  const bgs=ng.lib.filter(l=>l.kind==='bg').map(l=>l.name);
  ng.prog.lobbyBg=bgs[0]||''; ng.prog.titleBg=bgs[bgs.length-1]||'';
  const snd=SND(); snd.scene={title:pickM(/타이틀|title/i,0),lobby:pickM(/로비|lobby/i,1),battle:pickM(/전투|battle/i,4),boss:pickM(/보스|boss/i,5),gacha:pickM(/뽑기|소환|계약|gacha|summon/i,6)};
  ng.prog.scene=clone(snd.scene); ng.ver=VER; const id2='g'+uid(); const RU=artReuse(ng,RSRC); if(RU){ stat(`원래 게임의 그림을 옮기는 중… (${T('crew')} ${RU.nc}명 · NPC ${RU.nn}명 · 배경 등 ${RU.nl}개)`); await artReuseCopy(RU,id2); ng.prog.castDone=RU.nc>=ng.chars.filter(c=>c.naiPrompt).length; }
  { let b=null, tags=hero.av||''; try{ if(hero.av) b=await idbGet('draft_avatar'); if(!b&&!(RU&&ng.prog.avatar)&&String(hero.look||'').trim()&&imgReady()){ stat('주인공 프로필 그림을 그리는 중…'); tags=await heroTags(hero); if(tags) b=await naiDraw('char',tags,{frame:'cowboy shot',pose:'looking at viewer'}); }
      if(b){ const av={id:'pav_'+uid(),kind:'char',name:'플레이어',prompt:tags,img:{idb:true}}; await idbPut(id2+'::'+av.id,b); ng.prog.avatar=av; } }catch(e){ toast('프로필 그림은 나중에 설정 → 플레이어에서 그려 주세요'); } }
  if(RU&&RU.ids.some(x=>ng.prog.avatar&&x===ng.prog.avatar.id)){ /* 원래 프로필 그림을 그대로 썼어요 */ }
  G=oldG;
  if(sourceProject&&PJ().active!==sourceProject)throw Error('게임이 바뀌어 새 게임 적용을 중단했습니다');await flush();
  ngFinish(ng,draft); const pj=PJ();pj.list.push({id:id2,title:ng.meta.title});pj.active=id2; await appStorage.commitRecords({[pjKey(id2)]:JSON.stringify(ng),[PJKEY]:JSON.stringify(pj)});
  try{ appStorage.removeItem('ggm-ng-draft'); }catch(e){}
  stat('완성! 새 게임으로 전환해요.'); setTimeout(()=>reloadGame(),900);
}
// 글 AI 없이 초안만으로 게임을 만들어요. 비어 있는 곳은 기본값으로 두고, 나중에 글 AI를 등록하면 편집 도구로 다듬어요
async function buildManualGameDraft(rep,draft,sourceProject){if(String(draft?.story||'').length>100000)throw Error('스토리는 최대 100,000자입니다. 초과 내용은 자르지 않았습니다.'); const RSRC=reuseSrc(draft);
  draft=draft||drLoad(); const stat=m=>{if(rep)rep(m);};
  const DALL=(draft.chars||[]).filter(c=>String(c.name||'').trim()), DCH=DALL.filter(c=>c.kind!=='npc'), DNPC=DALL.filter(c=>c.kind==='npc');
  if(!DCH.length){ toast(`인물 탭에 ${draft.crewTerm||'동료'}을 1명 이상 적어 주세요`); return; }
  const ng=defaults(), hero=Object.assign({name:'',call:'',gender:'',look:'',bio:'',hide:false},draft.hero||{}), th=draft.theme||'auto';
  const kw=String(draft.kw||'').trim(), title=String(draft.gtitle||'').trim().slice(0,30)||kw.split(/[.\n,]/)[0].slice(0,16)||'새 게임';
  const ngSty=String(draft.style||'').trim()||(presetQualityParts(allPresets().find(x=>x.id===draft.preset)||{}).tags);
  ng.meta=Object.assign(clone(DEFAULT_META),{title,sub:'',theme:th==='auto'?'tactical':th,accent:'#ffb400'}); ng.meta.shop=neutralShop();
  ng.meta.artTags=ngSty; { const sp=allPresets().find(x=>x.id===draft.preset); if(sp&&ngSty===presetQualityParts(sp).tags) ng.meta.artNeg=sp.neg; }
  ng.meta.tone=String(draft.tone||''); ng.meta.castSex=CAST_SEX[draft.castSex]?draft.castSex:''; const DT=drText(draft); if(DT) ng.meta.bible=DT.slice(0,100000);
  ng.meta.story={plot:String(draft.story||''),stages:+draft.stages||0,len:STORY_LEN[draft.len]?draft.len:'normal'}; ng.meta.manual=true;
  ng.meta.terms=clone(DEFAULT_META.terms); if(String(draft.crewTerm||'').trim()) ng.meta.terms.crew=String(draft.crewTerm).trim().slice(0,8); if(String(hero.call||'').trim()) ng.meta.terms.player=String(hero.call).trim().slice(0,12);
  try{ ng.meta.draft=drClean(draft); }catch(e){}
  const world=String(draft.world||'').trim(), sents=s=>String(s||'').split(/(?<=[.!?。])\s+|\n+/).map(x=>x.trim()).filter(Boolean);
  ng.world=Object.assign(blankWorld(),{name:title,summary:sents(world).slice(0,3).join(' ')||kw||title,lore:world||kw,plot:String(draft.story||'').trim(),factions:[],source:draft.fan?String(draft.src||''):''});
  String(draft.setting||'').split('\n').map(x=>x.trim()).filter(x=>/^[-•*]?\s*[^:：]{1,20}[:：]/.test(x)).slice(0,6).forEach(x=>{ const m=x.replace(/^[-•*]\s*/,'').match(/^([^:：]{1,20})[:：]\s*(.*)$/); if(m) ng.world.factions.push({name:m[1].trim(),desc:m[2].trim()}); });
  ng.dispatches=clone(DEFAULT_DISP);
  const oldG=G; G=ng; applyMeta();
  try{
    ng.chars=[]; ng.lib=clone(DEFAULT_SFX); const roles=['atk','def','sup'];
    DCH.forEach((d,i)=>{ const r=+d.rank||(i<1?3:i<3?2:1); const c=cleanChar({name:d.name,rarity:r,role:roles[i%3],elem:ELEMS[i%ELEMS.length],faction:'',hp:900+r*150,atk:95+r*15,def:40+r*8,spd:95+(i%3)*5,
      profile:[d.role,d.profile,d.speech?'말투: '+d.speech:'',d.look?'외모: '+d.look:''].filter(x=>String(x||'').trim()).join('\n'),intro:String(d.role||''),
      skill:{name:{atk:'강타',def:'수호',sup:'응원'}[roles[i%3]],kind:{atk:'dmg',def:'shield',sup:'heal'}[roles[i%3]],power:1.6,cd:3,desc:''},naiPrompt:String(d.tags||'').trim()?stripAge(String(d.tags).trim()):''});
      c.ord=ng.chars.length; ng.chars.push(c); });
    ng.npcs=DNPC.map(d=>{ const id='npc_'+uid(); return {id,npc:true,name:d.name,role:d.role||'',profile:d.profile||'',speech:d.speech||'',look:d.look||'',naiPrompt:String(d.tags||'').trim()?stripAge(String(d.tags).trim()):'',img:null,faces:[],skins:[],lines:[],touch:{head:[],body:[]},affLines:{},upper:{id:'up_'+id,kind:'upper',name:d.name+' 상반신',prompt:'',img:null}}; });
    // 스토리 개요를 스테이지마다 나눠 내레이션으로 넣어요. 대사는 나중에 직접 쓰거나 글 AI로 채워요
    const N=Math.max(1,Math.min(12,+draft.stages||4)), st=sents(draft.story), per=Math.ceil(st.length/N)||0, en=(i,boss)=>[{name:boss?'보스':'적',elem:ELEMS[i%ELEMS.length],hp:boss?3600:800+i*100,atk:70+i*5,def:30+i*4,spd:95,boss}];
    ng.chapters=[{id:'c1',ord:0,kind:'main',title:'1장',logline:sents(draft.story)[0]?sents(draft.story)[0].slice(0,120):'',stages:Array.from({length:N},(_,i)=>({id:'s1'+(i+1),title:`${i+1}화`,reward:300+100*i,pre:st.slice(i*per,(i+1)*per).join('\n'),post:'',enemies:en(i,i===N-1)}))}];
    ng.opening={lines:[...sents(world).slice(0,4),title],prologue:''};
    ng.banners=[{id:'std',name:'상시 '+T('gacha'),type:'std',desc:'',pool:{mode:'all',factions:[],ids:[]},pickup:[],rate:50,active:true,bg:''}];
    ng.threads=[]; ng.events=[]; syncEnemies(ng);
    ng.prog=clone(DEFAULT_PROG); ng.prog.player=String(hero.name||'').slice(0,12); ng.prog.genderTxt=String(hero.gender||''); ng.prog.gender=genderCode(hero.gender); ng.prog.look=String(hero.look||''); ng.prog.bio=String(hero.bio||''); ng.prog.hideEyes=!!hero.hide; ng.prog.nameAsked=true;
    ng.ver=VER;
  } finally { G=oldG; applyMeta(); }
  const id2='g'+uid(); if(RSRC){ (RSRC.g.lib||[]).filter(l=>['bg','prop'].includes(l.kind)&&l.img&&!ng.lib.some(x=>x.kind===l.kind&&nameEq(x.name,l.name))).forEach(l=>ng.lib.push(clone(l))); if(!ng.prog.lobbyBg){ const b0=ng.lib.find(l=>l.kind==='bg'); if(b0) ng.prog.lobbyBg=b0.name; } } const RU=artReuse(ng,RSRC); if(RU){ await artReuseCopy(RU,id2); ng.prog.castDone=true; }
  try{ if(hero.av){ const b=await idbGet('draft_avatar'); if(b){ const av={id:'pav_'+uid(),kind:'char',name:'플레이어',prompt:hero.av,img:{idb:true}}; await idbPut(id2+'::'+av.id,b); ng.prog.avatar=av; } } }catch(e){}
  if(sourceProject&&PJ().active!==sourceProject)throw Error('게임이 바뀌어 새 게임 적용을 중단했습니다');await flush();
  ngFinish(ng,draft); const pj=PJ();pj.list.push({id:id2,title:ng.meta.title});pj.active=id2; await appStorage.commitRecords({[pjKey(id2)]:JSON.stringify(ng),[PJKEY]:JSON.stringify(pj)});
  stat('완성! 새 게임으로 전환해요. 글 AI를 등록하면 편집 화면의 ✦ 버튼으로 대사·스킬·설정을 다듬을 수 있어요.'); setTimeout(()=>reloadGame(),1200);
}
/* src/main/0260-new-game/040-story-and-authoring.js에서 옮김 */
async function handleStoryAndAuthoringAction(a,t,id,p,e){
  switch(a){
case 'cxcat': CXCAT=t.dataset.v; render(); break;
case 'cxview': openCx(t.dataset.k); break;
case 'cxadd': openCxEdit(''); break;
case 'relopen': case 'relgo': openRel(t.dataset.r||REL_ME); break;
case 'relseed': { const n=await relSeedAI(uiProg(t)); if(n){ toast(`관계 ${n}개를 정리했어요`); openRel(); } break; }
case 'reladd': { const bn=$('#rl_b').value, k=$('#rl_k').value.trim(), nt=$('#rl_n').value.trim(); if(!bn||bn===RELC) break; if(!k&&!nt){ toast('관계나 설명을 적어 주세요'); break; }
      let r=relPair(RELC,bn); if(r){ if(k) r.kind=k; if(nt) r.note=nt; } else { r={id:'r'+uid(),a:RELC,b: bn,kind:k||'아는 사이',note:nt,hist:[]}; relPut(r); } r.at=Date.now(); mark('meta'); openRel(); break; }
case 'reledit': openRelEdit(id); break;
case 'relsave': { const r=gameSlot('rels').find(x=>x.id===id); if(!r) break; r.kind=$('#rle_k').value.trim().slice(0,16)||r.kind; r.note=$('#rle_n').value.trim().slice(0,240);
      r.hist=lines($('#rle_h').value).slice(-12).map(l=>{ const m=l.match(/^(.{1,12}?) · (.+)$/); return m?{src:m[1],text:m[2]}:{src:'',text:l}; }); mark('meta'); openRel(); break; }
case 'reldel': { const r=RELS().find(x=>x.id===id); if(!r||!(await appConfirm(`${relName(r.a,true)} ↔ ${relName(r.b,true)} 관계를 지울까요?`))) break; relKeep(x=>x.id!==id); RELUNDO=r; mark('meta'); openRel(); toast('관계를 지웠어요 · 관계도 위쪽 「되돌리기」로 되살릴 수 있어요'); break; }
case 'relundo': { if(RELUNDO&&!RELS().some(x=>x.id===RELUNDO.id)){ relPut(RELUNDO); mark('meta'); toast('관계를 되살렸어요'); } RELUNDO=null; openRel(); break; }
case 'relrebuild': { const n0=RELS().length; G.chapters.forEach(ch=>{ delete ch.relScan; }); G.meta.relProf=0; memCatchUp(); const n=RELS().length-n0; mark('meta'); openRel(); toast(n>0?`빠진 관계 ${n}개를 다시 채웠어요`:'빠진 기본 관계가 없어요'+(SAMPLE?' · 자세한 관계는 「AI로 관계 넓히기」로 채울 수 있어요':'')); break; }
case 'cxedit': openCxEdit(t.dataset.id); break;
case 'cxsave': { const id2=t.dataset.id, title=$('#cx_t').value.trim(), body=$('#cx_b').value.trim(); if(!title||!body){toast('제목과 내용을 적어 주세요');break;}
      const un=$('#cx_un').value, u=un==='start'?{type:'start'}:{type:'clear',value:un}; let x=id2&&cxStore().find(q=>q.id===id2);
      if(x){ Object.assign(x,{cat:$('#cx_cat').value,title,body,unlock:u}); } else { x={id:'cx'+uid(),cat:$('#cx_cat').value,title,body,unlock:u,src:'user',at:Date.now()}; cxPut(x); }
      mark('world'); closeModal(); render(); toast('기록을 저장했어요'); pcSoon(); break; }
case 'cxdel': { if(!(await appConfirm('이 기록을 지울까요?'))) break; cxKeep(q=>q.id!==t.dataset.id); mark('world'); closeModal(); render(); pcSoon(); break; }
case 'cxnote': { const k=t.dataset.k, v=prompt('메모로 덧붙일 내용'); if(!v||!v.trim()) break; cxNoteAdd(k,v.trim(),'메모'); openCx(k); pcSoon(); break; }
case 'cxdisc': { if(!SAMPLE){toast('설정의 글 AI에서 AI를 먼저 등록해 주세요');break;} const done=busy(t,'쓰는 중… 1분쯤 걸려요'); const n=await cxDiscover(uiProg(t)); done(); if(n){ render(); toast(`새 기록 ${n}개를 실었어요`); } break; }
case 'cxdeep': { const k=t.dataset.k, done=busy(t,'기록을 찾는 중…'); const ok=await cxDeepen(k,uiProg(t)); if(ok){ openCx(k); toast('새 기록을 덧붙였어요'); } else done(); break; }
case 'cxreadall': { const s=progSlot('cxSeen'); cxEntries().forEach(e=>{ if(e.open) s[e.key]=1; }); CXMEMO=null; mark('prog'); render(); break; }
case 'opening-play': closeModal(); playOpening(); break;
case 'char': openChar(id); break;
case 'evspoke': { const c=charById(id); if(!c) break; const o=own(c.id), lv=o?affLv(o):1, r=t.getBoundingClientRect(), y=e.clientY||r.top+r.height/2, zone=(y-r.top)/r.height<0.3?'head':'body';
      let pool=spoilFree(c,(zone==='head'?c.touch?.head:c.touch?.body)||[]); if(!pool.length) pool=affLinePool(c); const l=pickTouchLine(pool,sub(EVS_LINE)); EVS_LINE=l;
      evsPokeShow(t,c,l,zone,lv,e.clientX||r.left+r.width/2,y); if(voiceOf(c)&&SND().voiceLobby) speak(c,l); break; }
case 'evreroll': { const ev=G.events.find(x=>x.id===id); if(!ev) break; const oldCh=G.chapters.find(c=>c.id===ev.chapterId); if(!oldCh) break;
      const pu=ev.pickupFor&&charById(ev.pickupFor), base=(ev.gen&&ev.gen.dir)||(pu?`${T('crew')} 「${pu.name}」이(가) 주인공으로 나오는 픽업 기념 이벤트 스토리. ${String(pu.profile||'').slice(0,200)}`:`이벤트 「${ev.title}」. ${ev.desc||''}`);
      const want=prompt('스토리 전체를 새로 써요. 원하는 줄거리나 방향이 있으면 적어 주세요(비우면 같은 설정으로 새 이야기).\n지금까지 깬 이 이벤트 스테이지 기록은 초기화돼요.','');
      if(want===null) break; const dir=String(want||'').trim()?`${base}\n작가가 원하는 이번 줄거리(이 흐름을 그대로 따른다): ${String(want).trim()}`:`${base}\n지난 버전 「${ev.title}」과 다른 새 이야기로 쓴다.`;
      bgJob('evr-'+ev.id,'이벤트 스토리 다시 쓰는 중',async()=>{ const n=(ev.gen&&ev.gen.n)||oldCh.stages.length||4, len=(ev.gen&&ev.gen.len)||'';
        const res=await aiEventGen(dir,n,!!ev.gift,pu?[pu.name]:[],len,loreOf(ev)); if(!res) return null; const ne=res.ev, nch=G.chapters.find(c=>c.id===ne.chapterId); if(!nch) return null;
        // 예전 스토리에서 생긴 것(톡·도감·CG·관계·아직 보유하지 않은 인물·배포 캐릭터)은 정리해요. 새 스토리에도 나오는 CG는 남아요
        const oldGift=ev.gift; storyPurge(storyLinks(oldCh.stages.map(s0=>s0.id),oldCh,ev),{threads:1,codex:1,libs:1,rels:1,chars:1});
        const kb=G.banners.find(bn=>bn.id===ev.bannerId), nb=G.banners.find(bn=>bn.id===ne.bannerId), keepPU=ev.pickupFor&&charById(ev.pickupFor)?[ev.pickupFor]:[];
        if(kb&&nb) kb.pickup=[...new Set([...keepPU,...(nb.pickup||[])])].filter(x=>charById(x)).slice(0,3); else if(kb) kb.pickup=(kb.pickup||[]).filter(x=>charById(x)&&x!==oldGift);
        ev.gift=ne.gift||''; if(kb&&ne.desc&&!ev.pickupFor) kb.desc=String(ne.desc);
        // 새 장을 이 이벤트에 옮기고, 새로 생긴 이벤트·배너는 지워요(배너·교환소·토큰은 그대로)
        nch.ord=oldCh.ord; nch.eventId=ev.id; G.chapters=G.chapters.filter(c=>c!==oldCh); G.threads=G.threads.filter(t=>!(t.trigger&&oldCh.stages.some(s0=>s0.id===t.trigger.value)));
        oldCh.stages.forEach(s0=>{ delete P().cleared[s0.id]; }); ev.chapterId=nch.id; ev.title=ne.title; ev.desc=ne.desc; ev.gen={dir,n,len,lore:loreOf(ev)};
        G.events=G.events.filter(x=>x!==ne); G.banners=G.banners.filter(bn=>bn.id!==ne.bannerId); markAll(); mark('prog');
        return {title:`이벤트 스토리 「${ev.title}」로 다시 썼어요`,body:`${T('event')} 화면에서 처음부터 플레이할 수 있어요.`}; }); break; }
case 'stamopen': openStam(0); break;
case 'stamfill': { if(P().gems<STAM_FILL[0]) break; pay({gems:STAM_FILL[0]}); const s=progSlot('stam'); s.v+=STAM_FILL[1]; mark('prog'); closeModal(); render(); toast(`⚡ ${STAM_FILL[1]} 회복 (${s.v}/${STAM_MAX})`); break; }
case 'stamtog': { const st=P().settings; st.stamina=!t.checked?false:true; mark('prog'); updStam(); toast(st.stamina?'행동력을 켰어요':'행동력을 껐어요(전투 무제한)'); break; }
case 'scimg': { const ta=$('#'+t.dataset.ta); if(!ta) break; uploadFor={kind:'scimg',ta:ta.id,pos:ta.selectionStart}; $('#file').click(); break; }
case 'charedit': openCharEdit(id); break;
case 'savechar': { if(id){const c=charById(id), old=c.name;if(!readCharForm(c))break; if(old&&old!==c.name&&old.length>=2&&(await appConfirm(`이름이 「${old}」에서 「${c.name}」(으)로 바뀌어요. 스토리·${T('talk')}·다른 캐릭터 대사에 나온 「${old}」도 모두 바꿀까요?`))){ const n=renameEverywhere(old,c.name); toast(`이름을 ${n}곳에서 바꿨어요`); } mark('c:'+id);closeModal();render();openChar(id);}
      else{const c=cleanChar({});if(!readCharForm(c))break;G.chars.push(c);mark('c:'+c.id);closeModal(); if(window.__ADDOWN){ window.__ADDOWN=false; joinChar(c,'새로'); } setTimeout(()=>artAfterAI(x=>x.o===c||x.c===c,'새 '+T('crew')+' '+c.name),300); if(NEWPU){ const lim=NEWPU==='limited'; NEWPU=false; addPickupFor(c,lim); if(window.__PUSTORY&&SAMPLE){ window.__PUSTORY=false; puStoryBg(c,lim); } tab='contract'; render(); toast(`${c.name} 픽업이 열렸어요`); artAfterAI(x=>x.o===c||x.c===c,'신규 '+T('crew')+' '+c.name); } else { render(); openChar(c.id); } } break; }
case 'delchar': if((await appConfirm('이 '+T('crew')+'을(를) 삭제할까요? 에피소드와 성장 기록도 함께 사라져요.'))){G.chars=G.chars.filter(c=>c.id!==id);delete p.owned[id];p.squad=p.squad.filter(x=>x!==id);if(p.sec===id)p.sec=null;mark('c:'+id,'prog');closeModal();render();} break;
case 'epedit': openEpEdit(id,t.dataset.ep||null); break;
case 'saveep': { const c=charById(id),d={lv:+$('#ep_lv').value,dup:+$('#ep_dup').value,after:$('#ep_after').value,title:$('#ep_title').value.trim()||'제목 없음',script:$('#ep_script').value};
      if(t.dataset.ep) Object.assign(c.episodes.find(x=>x.id===t.dataset.ep),d); else c.episodes.push(Object.assign({id:uid()},d));
      mark('c:'+id); openChar(id); break; }
case 'delep': { const c=charById(id); if((await appConfirm('이 에피소드를 삭제할까요?'))){c.episodes=c.episodes.filter(x=>x.id!==t.dataset.ep);mark('c:'+id);openChar(id);} break; }
case 'aiep': { const c=charById(id),lv=+$('#ep_lv').value,dup=+$('#ep_dup').value,after=$('#ep_after').value,hint=$('#ep_hint').value.trim();
      const stg=aiepStgText({lv});
      const af=after?G.chapters.flatMap(ch=>ch.stages).find(x=>x.id===after):null;
      const r=await aiJSON(aiepPrompt({c,dup,af,lv,stg,hint}),uiProg(t));
      if(r&&$('#ep_script')){ if(r.title)$('#ep_title').value=String(r.title); if(r.script)$('#ep_script').value=nl(r.script); toast('대본을 채웠어요. 확인 후 저장하세요.'); } break; }
case 'thedit': openThEdit(id,t.dataset.th||null); break;
case 'saveth': { const v=$('#th_trig').value, trig=v==='start'?{type:'start'}:{type:v.split(':')[0],value:v.split(':')[0]==='aff'?+v.split(':')[1]:v.split(':')[1]};
      const d={title:$('#th_title').value.trim()||'메시지',trigger:trig,needOwn:$('#th_own').value==='1',script:$('#th_script').value};
      let th; if(t.dataset.th){th=threadById(t.dataset.th);Object.assign(th,d);} else {th=Object.assign({id:uid(),charId:id},d);G.threads.push(th);}
      mark('t:'+th.id); checkTriggers(); openChar(id); break; }
case 'delth': if((await appConfirm('이 '+T('talk')+'을(를) 삭제할까요?'))){G.threads=G.threads.filter(x=>x.id!==t.dataset.th);delete p.inbox[t.dataset.th];mark('t:'+t.dataset.th,'prog');openChar(id);} break;
case 'aithread': { const c=charById(id),hint=$('#th_hint').value.trim(),tv=$('#th_trig').selectedOptions[0].textContent;
      const r=await aiJSON(aithreadPrompt({c,tv,hint}),uiProg(t));
      if(r&&$('#th_script')){ if(r.title)$('#th_title').value=String(r.title); if(r.script)$('#th_script').value=nl(r.script); toast('대화를 채웠어요. 확인 후 저장하세요.'); } break; }
case 'ststory': { const ch0=G.chapters.find(x=>x.id===t.dataset.ch), s0=ch0&&ch0.stages.find(x=>x.id===t.dataset.st); if(!s0) break; closeModal(); playStoryStage(ch0,s0); break; }
case 'story': { const ch=G.chapters.find(x=>x.id===t.dataset.ch),s=ch.stages.find(x=>x.id===t.dataset.st); closeModal(); playStory(s.title,s[t.dataset.k],()=>openStage(ch.id,s.id)); break; }
case 'chedit': chDraft=clone(G.chapters.find(x=>x.id===t.dataset.ch)); openChEdit(); break;
case 'addstage': readChForm(); chDraft.stages.push({id:uid(),title:'새 작전',reward:400,enemies:[{name:'적',elem:ELEMS[0],hp:900,atk:80,def:35,spd:95,boss:false}],pre:'',post:''}); openChEdit(); break;
case 'delstage': { readChForm(); if(chDraft.stages.length<=1){ toast('스테이지는 1개 이상 있어야 해요'); break; } const st=chDraft.stages[+t.dataset.j], live=G.chapters.find(x=>x.id===chDraft.id);
      const L=st&&live&&live.stages.some(x=>x.id===st.id)?storyLinks([st.id],live,live.eventId&&G.events.find(e=>e.id===live.eventId)):null, n=L?L.threads.length+L.codex.length+L.libs.length+L.rels.length:0;
      if(n&&(await appConfirm(`이 스테이지에 연결된 ${T('talk')} ${L.threads.length}개, 도감 ${L.codex.length}개, CG·소품 ${L.libs.length}개, 관계 기록 ${L.rels.length}개도 지울까요?
(저장을 눌러야 반영돼요. 취소하면 스테이지만 지워요)`))) (chDraft.__purge=chDraft.__purge||[]).push(st.id);
      chDraft.stages.splice(+t.dataset.j,1); openChEdit(); break; }
case 'savech': { readChForm(); const pg=chDraft.__purge; delete chDraft.__purge; const old=G.chapters.find(x=>x.id===chDraft.id);
      if(pg&&pg.length&&old){ storyPurge(storyLinks(pg,old,old.eventId&&G.events.find(e=>e.id===old.eventId)),{threads:1,codex:1,libs:1,rels:1}); pg.forEach(id=>{ delete P().cleared[id]; }); }
      const i=G.chapters.findIndex(x=>x.id===chDraft.id); delete chDraft.relScan; G.chapters[i]=chDraft; mark('ch:'+chDraft.id); syncEnemies(); scanScriptAssets(); relFromScripts(chDraft); closeModal(); render(); break; }
case 'stdetail': { readChForm(); const j=+t.dataset.j, s0=chDraft.stages[j], ch0=chDraft; if(!s0) break; if(!(s0.pre||s0.post)){ toast('먼저 대본이 있어야 해요'); break; }
      const nb=stdetailNbText({ch0,j});
      const r=await aiJSON(stdetailPrompt({s0,ch0,j,nb}),uiProg(t),'complex');
      if(r&&(r.pre||r.post)){ s0.pre=nl(r.pre)||s0.pre; if(!s0.story) s0.post=nl(r.post)||s0.post; modalKeep(openChEdit); toast('디테일을 보강했어요. 마음에 들면 저장을 눌러 주세요'); } break; }
case 'delch': { const ch0=G.chapters.find(x=>x.id===chDraft.id)||chDraft, back=chDraft, ev0=ch0.eventId&&G.events.find(e=>e.id===ch0.eventId);
      openStoryDel({title:ch0.title,ids:ch0.stages.map(s=>s.id),ch:ch0,ev:ev0,back:()=>{ chDraft=back; openChEdit(); },run:()=>{ G.chapters=G.chapters.filter(x=>x.id!==ch0.id); mark('ch:'+ch0.id); }}); break; }
case 'world-open': openWorld(); break;
case 'saveworld': { const w=G.world; w.name=$('#w_name').value.trim()||w.name; w.summary=$('#w_sum').value.trim(); w.lore=$('#w_lore').value.trim(); w.plot=$('#w_plot').value.trim();
      w.factions=lines($('#w_fac').value).map(l=>{const i=l.search(/[:：]/);return i>0?{name:l.slice(0,i).trim(),desc:l.slice(i+1).trim()}:{name:l,desc:''};});
      if(WTERMS&&$('#w_tchk')&&$('#w_tchk').checked){ Object.entries(WTERMS).forEach(([k,v])=>{ if(v&&TERM_LABEL[k]) G.meta.terms[k]=String(v).slice(0,12); }); mark('meta'); applyMeta(); } WTERMS=null;
      mark('world'); closeModal(); render(); toast('세계관을 저장했어요'); pcSoon(); break; }
case 'aiworld': { const kw=$('#w_kw').value.trim(); if(!kw){toast('키워드를 입력해 주세요');break;}
      const r=await aiJSON(aiworldPrompt({kw}),uiProg(t));
      if(r&&$('#w_name')){ WTERMS=r.terms&&typeof r.terms==='object'?r.terms:null; worldFormFill(r); toast('입력칸을 채웠어요. 확인 후 저장하세요.'); } break; }
case 'opening-edit': openOpeningEdit(); break;
case 'aichapter-open': openAiChapter(); break;
case 'aichapter': { const dir=$('#ai_d').value.trim()||'메인 플롯을 따라 자연스럽게 이어서', n=+$('#ai_n').value, cast=[...document.querySelectorAll('.chip.on')].map(b=>charById(b.dataset.id)?.name).filter(Boolean);
      if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); break; } closeModal();
      bgJob('chapter','다음 장 만드는 중',async()=>{ const res=await aiChapterGen(dir,n,cast); return res?{title:`새 이야기 「${res.ch.title}」가 열렸어요`,body:`${T('ops')}에서 바로 플레이할 수 있어요.\n새 배경·음악 ${res.nb}개, ${T('talk')} ${res.nt}개가 함께 추가됐어요.${res.nc&&res.nc.length?`\n새 인연: ${res.nc.map(c=>RL[c.rarity]+' '+c.name).join(', ')} — 이야기에서 만나면 상시 ${T('gacha')}에 들어가요.${res.nc.some(c=>c.rarity<3)?' R·SR 인연은 이 장을 끝까지 깨면 무료로 합류해요.':''}`:''}${res.npcs&&res.npcs.length?`\n새 NPC: ${res.npcs.map(c=>c.name).join(', ')}`:''}`}:null; }); break; }
case 'reload': reloadGame(); break;
case 'evopen': P().curEvent=id; tab='evd'; render(); viewTop(); if(G.events.find(e=>e.id===id)?.bgm) bgm(G.events.find(e=>e.id===id).bgm); break;
case 'evbuy': { const ev=G.events.find(e=>e.id===P().curEvent), it=ev.shop.find(x=>x.id===id), buy=(P().shopBuy[ev.id]=P().shopBuy[ev.id]||{});
      if((buy[it.id]||0)>=it.limit||(P().tokens[ev.id]||0)<it.price) break;
      P().tokens[ev.id]-=it.price; buy[it.id]=(buy[it.id]||0)+1;
      if(it.type==='char'){ const c=charById(it.ref); if(c){ const o=own(c.id); if(o){ if(o.dup<5)o.dup++; toast(`${c.name} ${T('limit')} +1`);} else { P().owned[c.id]={levelCapVersion:1,transc:0,growthCostVersion:1,lv:1,exp:0,dup:0,aff:0,seen:[],wlv:0,skin:''}; toast(`${c.name} 획득!`); checkTriggers(); } } }
      else { giveReward({[it.type]:it.amt}); toast(rewardText({[it.type]:it.amt})+' 획득'); }
      sfx('확인'); mark('prog'); render(); break; }
case 'evedit': openEvEdit(id); break;
case 'evsave': { const ev=G.events.find(e=>e.id===id); ev.title=$('#ev_t').value.trim()||ev.title; ev.desc=$('#ev_d').value.trim(); ev.token=$('#ev_tok').value.trim()||ev.token; ev.bg=$('#ev_bg').value; ev.active=$('#ev_act').value==='1';
      if($('#ev_lore')){ const nl=$('#ev_lore').value; if(nl!==loreOf(ev)) evLoreSet(ev,nl); }
      const sh=lines($('#ev_shop').value).map((l,i)=>{const p2=l.split(/[,，]/).map(x=>x.trim());const ty=p2[0]||'gold';return {id:'s'+i,type:ty.startsWith('char:')?'char':ty,ref:ty.startsWith('char:')?ty.slice(5):undefined,amt:num(p2[1],1,999999,1),price:num(p2[2],1,999999,100),limit:num(p2[3],1,999,1)};});
      if(sh.length) ev.shop=sh; const bn=G.banners.find(x=>x.id===ev.bannerId); if(bn) bn.active=ev.active; mark('prog'); closeModal(); render(); break; }
case 'evdel': { const ev=G.events.find(e=>e.id===id); if(!ev) break; const ch0=G.chapters.find(c=>c.id===ev.chapterId);
      openStoryDel({title:'이벤트 「'+ev.title+'」',ids:ch0?ch0.stages.map(s=>s.id):[],ch:ch0,ev,back:()=>openEvEdit(id),after:()=>{ tab='event'; },run:()=>{ G.events=G.events.filter(e=>e.id!==id); G.chapters=G.chapters.filter(c=>c.id!==ev.chapterId); mark('ch:'+ev.chapterId); G.banners=G.banners.filter(b=>b.id!==ev.bannerId); }}); break; }
case 'dreroll': { const bn=progSlot('dboard'); if(bn.rr){ if(P().gold<2000){ toast('크레딧이 부족해요'); break; } P().gold-=2000; } bn.rr=(bn.rr||0)+1; bn.list=bn.list.map(o=>P().disp[o.id]?o:null); bn.list=bn.list.map(o=>o||dispOffer(bn.list.filter(Boolean).map(x=>x.name))); mark('prog'); render(); toast('새 의뢰가 올라왔어요'); break; }
case 'meta-open': openMeta(); break;
case 'metasave': { if($('#ng_story')&&$('#ng_story').value.trim().length>100000){toast('스토리는 최대 100,000자입니다. 초과 내용은 자르지 않았습니다.');break;}const m=G.meta, old=m.elems.map(e=>e.n); if($('#mt_logo')) m.logoStyle=$('#mt_logo').value; if($('#ng_story')) m.story=readStoryForm(); if($('#mt_cast')) m.castSex=$('#mt_cast').value; if($('#mt_tone')) m.tone=$('#mt_tone').value.trim(); if($('#mt_art')){ m.artTags=$('#mt_art').value.trim(); m.artNeg=$('#mt_artn').value.trim(); }
      m.title=$('#mt_title').value.trim()||m.title; m.sub=$('#mt_sub').value.trim(); m.theme=$('#mt_theme').value; m.accent=$('#mt_acc').value;
      Object.keys(DEFAULT_META.terms).forEach(k=>{const v=$('#mt_t_'+k).value.trim(); if(k==='abyss')m.terms[k]=explorationName(v);else if(v)m.terms[k]=v;});
      m.elems=m.elems.map((e0,i)=>({n:($('#mt_e'+i)?.value||'').trim()||old[i],c:$('#mt_c'+i)?.value||e0.c,d:e0.d||''})); // 속성 개수·설명은 게임 규칙 화면에서 // 설명(d)은 게임 규칙 화면에서 편집
      const map={}; old.forEach((o,i)=>{map[o]=m.elems[i].n;}); rulesRename(map);
      G.chars.forEach(c=>{if(map[c.elem])c.elem=map[c.elem];}); G.chapters.forEach(ch=>ch.stages.forEach(st=>st.enemies.forEach(en=>{if(map[en.elem])en.elem=map[en.elem];})));
      ['atk','def','sup'].forEach(k=>{m.roles[k]=$('#mt_r_'+k).value.trim()||m.roles[k];}); m.farms.forEach((f,i)=>{f.name=$('#mt_f'+i).value.trim()||f.name;});
      const pj=PJ(); const me=pj.list.find(x=>x.id===pj.active); if(me){me.title=m.title;appStorage.setItem(PJKEY,JSON.stringify(pj));}
      markAll(); applyMeta(); closeModal(); render(); toast('게임 정의를 저장했어요'); break; }
case 'draft-open': openDraft(); break;
case 'drlib': drRead(); drLibToggle(); break;
case 'drlibsave': { drRead(); const nm=prompt('초안 이름',drName(DR2)); if(nm===null) break; const a=drLib(), name=nm.trim()||drName(DR2), old=a.find(x=>x.name===name);
      if(old&&!(await appConfirm(`「${name}」 초안을 덮어쓸까요?`))) break; const rec={id:old?old.id:'d'+uid(),name,at:Date.now(),d:drClean(DR2)}; const bn=a.filter(x=>x!==old); bn.unshift(rec); if(drLibSave(bn)){ toast('초안을 저장했어요'); drLibRefresh(); } break; }
case 'drlibload': { const x=drLib().find(y=>y.id===id); if(!x) break; drRead(); if(drText(DR2).trim()&&!(await appConfirm('지금 쓰던 초안 대신 불러올까요? (지금 초안은 먼저 보관함에 저장해 두세요)'))) break; drLoadFrom(x.d,x.name); break; }
case 'drreuseoff': drRead(); delete DR2.reuse; drSave(); openDraft(); toast('그림을 새로 그리는 초안으로 바꿨어요'); break;
case 'drxcur': drRead(); openDraftExport(drName(DR2),DR2,()=>{ openDraft(); }); break;
case 'drxlib': { const x=drLib().find(y=>y.id===id); if(x){ drRead(); openDraftExport(x.name,x.d,()=>openDraft()); } break; }
case 'drxcopy': { const tx=$('#drx_code').value; try{ await navigator.clipboard.writeText(tx); toast('초안 코드를 복사했어요'); }catch(e){ const ta=$('#drx_code'); uiSelectText(ta); try{ document.execCommand('copy'); toast('초안 코드를 복사했어요'); }catch(_){ toast('길게 눌러 직접 복사해 주세요'); } } break; }
case 'drxfile': { if(!DRX) break; await saveTextFile(JSON.stringify({v:1,name:DRX.name,d:drClean(DRX.d)},null,1),'초안_'+String(DRX.name).replace(/[^\w가-힣-]+/g,'_').slice(0,30)+'.json'); break; }
case 'drxback': { const bn=DRX&&DRX.back; DRX=null; if(bn) bn(); else if($('#dri_code')) openDraft(); else closeModal(); break; }
case 'drimport': drRead(); openDraftImport(); break;
case 'drigo': draftImportDone(draftFrom($('#dri_code').value),$('#dri_load').checked); break;
case 'drifile': $('#drfile').click(); break;
case 'drlibdel': { const a=drLib(), x=a.find(y=>y.id===id); if(!x||!(await appConfirm(`「${x.name}」 초안을 지울까요?`))) break; drLibSave(a.filter(y=>y!==x)); drLibRefresh(); break; }
case 'drtab': drRead(); DRTAB=t.dataset.k; drTabShow(); break;
case 'drcadd': drRead(); DR2.chars.push({name:'',role:'',profile:'',speech:'',look:'',tags:''}); drSave(); drRerender(); break;
case 'drcdel': drRead(); DR2.chars.splice(+t.dataset.i,1); drSave(); drRerender(); break;
case 'drmode': drRead(); DR2.mode=t.dataset.v||''; drSave(); openDraft(); break;
case 'drpreset': { drRead(); const v=t.dataset.v||''; DR2.preset=v; drSave(); if(v){ const sp=allPresets().find(x=>x.id===v); if(presetToCfg(v)) toast(`「${sp.name}」 그림체를 적용했어요`); } drPresetShow(v); break; }
case 'drautoex': { const el=$('#dr_auto'); if(el){ el.value=t.dataset.v; drRead(); } break; }
case 'drpfdraw': drAvatarDraw(uiProg(t)); break;
case 'drcfill': drFillChar(+t.dataset.i,uiProg(t)); break;
case 'drpolish': drPolish(t.dataset.k,uiProg(t)); break;
case 'drharmony': drHarmony(uiProg(t)); break;
case 'drdedup': { drRead(); const n=drDedup(JSON.parse(JSON.stringify(DR2))); if(!n){ toast('겹치는 문장이 없어요'); break; } drSnap('겹치는 문장 정리'); drDedup(); drSave(); drRerender(); toast(`겹치는 문장 ${n}개를 정리했어요. 마음에 안 들면 「되돌리기」`); break; }
case 'drundo': { if(!DR2.undo) break; drRead(); const u=DR2.undo; if(u.kw!=null) DR2.kw=u.kw; if(u.tone!=null) DR2.tone=u.tone; DR2.world=u.world; DR2.setting=u.setting; DR2.story=u.story; DR2.chars=u.chars; if(u.hero){ const av=DR2.hero.av; DR2.hero=Object.assign({},u.hero,{av}); } else if(u.bio!=null) DR2.hero.bio=u.bio; delete DR2.undo; drSave(); drRerender(); toast('다듬기 전으로 되돌렸어요'); break; }
case 'drpreview': drRead(); drPreviewToggle(drText()); break;
case 'drclear': if(!(await appConfirm('초안을 모두 지울까요?'))) break; try{ appStorage.removeItem(DR2KEY); idbDel('draft_avatar').catch(()=>{}); }catch(e){} if(DRAVU){ URL.revokeObjectURL(DRAVU); DRAVU=null; } DRTAB='theme'; openDraft(); break;
case 'drmanual': { drRead(); if(!(await appConfirm('적은 내용 그대로 새 게임을 만들까요?\n비어 있는 대사·스킬·적은 기본값으로 채워요. 나중에 글 AI를 등록하면 편집 화면에서 다듬을 수 있어요.'))) break; const done=busy(t); try{ await newGameManual(uiProg(t,'#ng_stat'),DR2); }catch(err){ toast('만들기 실패: '+((err&&err.message)||err)); } done(); break; }
case 'drmake': { drRead(); if(DR2.mode==='auto'?!String(DR2.auto||'').trim():(!String(DR2.kw||'').trim()&&!String(DR2.world||'').trim())){ toast(DR2.mode==='auto'?'만들고 싶은 게임을 적어 주세요':'테마의 장르와 키워드나 세계관 중 하나는 적어 주세요'); break; }
      const done=drBusy(t); try{ await newGame(uiProg(t,'#ng_stat'),DR2); }catch(err){ aiLog({ok:false,stage:'새 게임 만들기',err:'앱 오류: '+String((err&&(err.stack||err.message))||err).slice(0,600)}); say('#ng_stat','만드는 중 오류가 났어요. 아래 \'AI 기록\'에서 내용을 확인해 주세요.'); } AISTAGE=''; done(); break; }
case 'charregen': openRegen(id); break;
  }
}
