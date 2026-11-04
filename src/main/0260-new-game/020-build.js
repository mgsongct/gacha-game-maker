/* ===== 새 게임 만들기: 초안(작가 설정) → 단계별 생성(세계·대원·1장) → 마무리(시작 자원·희귀도·재료 던전·상점) · 그림 유지 리롤 ===== */
// 새 게임의 빈 세계관: 원본 샘플(DEFAULT_WORLD)의 칸 구조만 쓰고 내용은 비워요(빠진 칸에 다른 세계의 플롯·세력이 남지 않게)
function blankWorld(){ return Object.fromEntries(Object.entries(clone(DEFAULT_WORLD)).map(([k,v])=>[k,Array.isArray(v)?[]:typeof v==='string'?'':v&&typeof v==='object'?{}:v])); }
/* 새 게임 공통 마무리: 건조/영입을 켰으면 시작 자원 지급, 지금 점검 규칙 판으로 표시(새 게임은 구버전 생성물이 아님) */
function ngFinish(ng,draft){ if(draft&&draft.con) conStartNew(ng); ng.meta.auditSeen=auditVer(); }
/* 원본 샘플의 상점 NPC(「보급관」) 대신 중립 이름 */
function neutralShop(){ return Object.assign(clone(DEFAULT_META.shop),{name:'상점'}); }
/* 세계 단계 결과 → 재료 던전 이름(키로 맞춤)·원정 방식·상점·바리에이션 기본형·파견 견본(이름·설명) */
function ngWorldExtras(ng,a){ const FA=Array.isArray(a.farms)?a.farms:[], TT=ng.meta.terms, FN={exp:TT.expMat,gold:TT.gold,wmat:TT.wMat,core:TT.core};
  ng.meta.farms=DEFAULT_META.farms.map((d,i)=>{ const f=FA.find(x=>x&&x.key===d.key)||(FA.length===4?FA[i]:null), nm=String((f&&f.name)||'').trim(); return {key:d.key,name:nm||`${FN[d.key]||d.key} 수급`}; });
  const ex=GGMExpedition.fromWorld(a); if(ex) ng.meta.expedition=ex; /* 원정 방식과 그 이름(원정 엔진) */
  if(PROFILE_TPLS[a.profileTemplate]) ng.meta.persona=Object.assign({},ng.meta.persona||{},{tpl:PROFILE_TPLS[a.profileTemplate].slice()}); /* 캐릭터 프로필 항목 틀 — 다음 단계(대원)가 이 틀로 프로필을 만듦 */
  ng.meta.shop=neutralShop();
  const V=variantsFromAI(a.variants,ng); if(V.length>=2) ng.meta.variants=V;
  ng.dispatches=(Array.isArray(a.dispatches)?a.dispatches:[]).slice(0,6).map((d,i)=>({id:'d'+(i+1),name:String(d.name||'파견'),desc:String(d.desc||'')})); /* 파견 목록은 이름·설명 견본 — 의뢰(시간·인원·보상)는 dispOffer가 매일 뽑음(원안 설계) */
  if(!ng.dispatches.length) ng.dispatches=clone(DEFAULT_DISP); }
/* 대원 단계 뒤: 희귀도 분포 보정(작가가 정한 등급은 그대로), 조건에 맞는 대원이 하나도 없는 바리에이션은 조건을 비움 */
function ngCharsPost(ng,DCH){ rarityFix(ng.chars,new Set(DCH.filter(d=>d.rank).map(d=>d.name)));
  (ng.meta.variants||[]).forEach(t=>{ if(t.cond&&Object.keys(t.cond).length&&!ng.chars.some(c=>!c.monster&&GGMConstruct.condMatch(t.cond,c,{}))) t.cond={}; }); }
/* 희귀도 분포: SSR은 ⌈n/3⌉명 이하, R은 ⌊n/3⌋명 이상, SR·SSR 1명 이상(3명 이상일 때). 뒤쪽(나중에 나온) 캐릭터부터 한 단계씩 조정하고 능력치를 그 등급 범위로 맞춰요.
   생성 게임 둘 다 6명 중 R 1명이라 첫 10연에서 R 자리가 모두 같은 캐릭터였어요 */
function rarityFix(L,fixed){ const n=L.length; if(n<3) return 0; let k=0; const free=()=>[...L].reverse().filter(c=>!fixed.has(c.name)), cnt=r=>L.filter(c=>c.rarity===r).length, set=(c,r)=>{ c.rarity=r; k++; balNormalize(c,'edge'); };
  for(const c of free()){ if(cnt(3)<=Math.ceil(n/3)) break; if(c.rarity===3) set(c,2); }
  for(const c of free()){ if(cnt(1)>=Math.floor(n/3)) break; if(c.rarity===2&&cnt(2)>1) set(c,1); }
  for(const c of free()){ if(cnt(1)>=Math.floor(n/3)) break; if(c.rarity===3&&cnt(3)>1) set(c,2); }
  if(!cnt(3)){ const c=free().reverse().find(c=>c.rarity===2)||free().reverse().find(c=>c.rarity===1&&cnt(1)>Math.floor(n/3)); if(c) set(c,3); }
  if(!cnt(2)){ const c=free().find(c=>c.rarity===1&&cnt(1)>Math.floor(n/3))||free().find(c=>c.rarity===3&&cnt(3)>1); if(c) set(c,2); }
  return k; }
/* 그림 유지 리롤: 원래 게임의 캐릭터·NPC·배경 그림을 이름으로 짝지어 새 게임에 그대로 옮겨요(새로 그리지 않아도 돼요) */
function reuseSrc(draft){ const r=draft&&draft.reuse; if(!r||!r.pj) return null; if(r.pj===PJ().active) return {g:G,ns:IMGNS}; let g=null; try{ g=JSON.parse(appStorage.getItem(pjKey(r.pj))||'null'); }catch(e){} return g?{g,ns:r.pj==='main'?'':r.pj+'::'}:null; }
// 이름 짝짓기: 띄어쓰기·괄호 설명을 빼고 비교해요("아린 (검사)" = "아린")
const nameKey=x=>String(x||'').replace(/\s*[(（\[][^)）\]]*[)）\]]\s*/g,'').replace(/\s+/g,'').toLowerCase();
const nameEq=(a,b)=>!!nameKey(a)&&nameKey(a)===nameKey(b);
// 새 게임 안의 id 참조(관계·톡·배너·진행·스토리 등)를 한꺼번에 바꿔요. 값과 객체 키 모두요
function remapIds(root,map){ if(!map.size) return; const seen=new Set(); const walk=o=>{ if(!o||typeof o!=='object'||seen.has(o)) return; seen.add(o);
    if(Array.isArray(o)){ for(let i=0;i<o.length;i++){ const v=o[i]; if(typeof v==='string'&&map.has(v)) o[i]=map.get(v); else walk(v); } return; }
    for(const k of Object.keys(o)){ let v=o[k]; if(typeof v==='string'&&map.has(v)) o[k]=v=map.get(v); else walk(v); if(map.has(k)&&!(map.get(k) in o)){ o[map.get(k)]=o[k]; delete o[k]; } } };
  walk(root); }
function artReuse(ng,src){ if(!src) return null; const og=src.g, ids=new Set(), nm=x=>nameKey(x), add=o=>{ if(o&&o.id&&o.img) ids.add(o.id); }, idMap=new Map(), setId=(o,nid)=>{ if(o.id!==nid){ idMap.set(o.id,nid); o.id=nid; } };
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
  remapIds(ng,idMap); // 관계·톡·배너가 바뀐 id를 가리키게(안 그러면 관계가 '없는 인물'로 보여 지워져요)
  return {ids:[...ids],ns:src.ns,nc,nn,nl}; }
async function artReuseCopy(R,id2){ if(!R) return 0; let n=0; for(const id of R.ids){ try{ let b=await idbGet(R.ns+id); if(!b&&R.ns) b=await idbGet(id); if(b){ await idbPut(id2+'::'+id,b); n++; } }catch(e){} } return n; }
async function newGame(rep,draft){return runNewGameBuild(rep,draft,buildNewGameDraft);}
async function newGameManual(rep,draft){return runNewGameBuild(rep,draft,buildManualGameDraft);}
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
