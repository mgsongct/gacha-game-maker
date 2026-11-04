/* ===== 0070-store — Model(상태·규칙·저장·외부 서비스) ===== */
/* src/main/0070-store/0070-save.js에서 옮김 */
function progSlot(k){ const s=PROG_SLOTS[k], p=G.prog; let v=p[k]; if(!(s.ok||progObj)(v)||(s.stale&&s.stale(v))){ v=p[k]=s.make(v); mark('prog'); } if(s.fill) s.fill(v,p); if(s.now) s.now(v); return v; }
function progRead(k){ const s=PROG_SLOTS[k], v=G.prog[k]; if((s.ok||progObj)(v)&&!(s.stale&&s.stale(v))) return s.now?s.now(clone(v)):v;
  const n=s.make(v); if(s.fill) s.fill(n,Object.assign({},G.prog)); return s.now?s.now(n):n; } /* 없거나 날이 바뀐 칸: 새로 만든 값에 형식 맞춤까지 — 저장하지 않음(진행 칸은 사본을 넘김) */
/* 그리기 전·주기 타이머(Controller): 하루/주 단위 칸은 늘 있게, 있는 칸은 날이 바뀌었으면 새로·형식 맞춤 */
function progTick(){ if(!G||!G.prog) return; for(const k in PROG_SLOTS){ const s=PROG_SLOTS[k], on=typeof s.tick==='function'?s.tick():s.tick; if(on||(G.prog[k]!==undefined&&(s.stale||s.fill))) progSlot(k); } } /* 맞춰 저장(progSlot) — 읽기(progRead)가 아님 */
function gameSlot(path,g=G){ const s=GAME_SLOTS[path], [o,k]=gameAt(path,g), v=o[k]; if(!(s.ok||progObj)(v)) o[k]=path==='world.plan'&&progObj(v)?Object.assign(s.make(),v,Object.fromEntries(['acts','twists','branches','arcs'].map(x=>[x,Array.isArray(v[x])?v[x]:[]]))):s.make(); return o[k]; }
function gameRead(path){ const s=GAME_SLOTS[path], [o,k]=gameAt(path,G), v=o[k]; return (s.ok||progObj)(v)?v:s.make(); }
function gameSlotsFix(g){ for(const k in GAME_SLOTS) gameSlot(k,g); }
function PJ(){let d=null;try{d=JSON.parse(appStorage.getItem(PJKEY));}catch(e){} if(!d||!Array.isArray(d.list)){d={active:'main',list:[{id:'main',title:'낙성계약'}]};} return d;}
function pjKey(id){return id==='main'?'starfall-contract-v1':'starfall-contract-v1-'+id;}
function enemyNames(g){const set=new Set(['훈련 표적','강화 표적','훈련 교관']);(g.chapters||[]).forEach(ch=>(ch.stages||[]).forEach(s=>(s.enemies||[]).forEach(e=>{if(e&&e.name)set.add(String(e.name));})));return [...set];}
function syncEnemies(g,looks){ g=g||G; let n=0; const lk=looks||{}, rz=lk.__reuse||{}, EL=(g.meta&&g.meta.title)===DEFAULT_META.title&&!(g.meta&&g.meta.draft)?ENEMY_LOOKS:{}; // 샘플 적 외형은 샘플 게임에서만(다른 세계관에 섞이지 않게)
  const boss=new Set(); (g.chapters||[]).forEach(ch=>(ch.stages||[]).forEach(st=>(st.enemies||[]).forEach(e=>{ if(e&&e.boss) boss.add(e.name); })));
  enemyNames(g).forEach(nm=>{ let l=g.lib.find(x=>x.kind==='enemy'&&x.name===nm);
    if(!l){ let alias='';
      if(!boss.has(nm)&&!(g.chars||[]).some(c=>c.name===nm)&&!EL[nm]){ const pool=g.lib.filter(x=>x.kind==='enemy'&&!x.alias&&!x.charId&&(x.prompt||x.img)&&!boss.has(x.name));
        const want=rz[nm]&&pool.find(x=>x.name===rz[nm]); if(want) alias=want.id; else if(pool.length&&(!lk[nm]||pool.length>=ENEMY_KEEP)) alias=pool[hashN(nm)%pool.length].id; }
      l={id:'n'+Math.random().toString(36).slice(2,10),kind:'enemy',name:nm,prompt:alias?'':String(lk[nm]||EL[nm]||''),img:null}; if(alias) l.alias=alias; g.lib.push(l); n++; if(typeof mark==='function'&&g===G) mark('l:'+l.id); }
    else if(!l.prompt&&(lk[nm]||EL[nm])){ l.prompt=String(lk[nm]||EL[nm]); if(typeof mark==='function'&&g===G) mark('l:'+l.id); }
    { const BI=(g.meta&&g.meta.bestiary)||{}, info=BI[nm]||(EL===ENEMY_LOOKS&&ENEMY_INFO[nm]); if(info&&!l.desc&&!l.charId) Object.assign(l,info); } // 적 도감: 생성기가 만든 것(meta.bestiary) · 샘플
    const ch=(g.chars||[]).find(c=>c.name===nm); if(ch&&ch.naiPrompt&&l.prompt!==ch.naiPrompt&&!l.img){ l.prompt=ch.naiPrompt; l.charId=ch.id; if(typeof mark==='function'&&g===G) mark('l:'+l.id); } });
  return n; }
function defaultShop(ev,g){
  const gg=g||G, b=(gg.banners||[]).find(x=>x.id===ev.bannerId), it=[
   {id:'s1',type:'gems',amt:300,price:100,limit:5},{id:'s2',type:'gold',amt:10000,price:40,limit:10},
   {id:'s3',type:'exp',amt:30,price:60,limit:10},{id:'s4',type:'wmat',amt:15,price:70,limit:10},{id:'s5',type:'core',amt:5,price:150,limit:4}];
  if(b) (b.pickup||[]).forEach((cid,i)=>it.push({id:'sc'+i,type:'char',ref:cid,amt:1,price:1200,limit:2}));
  return it;
}
function defaults(){return {ver:VER,meta:clone(DEFAULT_META),world:clone(DEFAULT_WORLD),chars:clone(DEFAULT_CHARS),chapters:clone([...DEFAULT_CHAPTERS,DEFAULT_EVENT_CHAPTER]),lib:clone([...DEFAULT_LIB,...DEFAULT_SFX]),threads:clone(DEFAULT_THREADS),opening:clone(DEFAULT_OPENING),banners:clone(DEFAULT_BANNERS),events:clone(DEFAULT_EVENTS),dispatches:clone(DEFAULT_DISP),prog:clone(DEFAULT_PROG)};}
function safeIds(g){
  const bad=new Map(), ok=v=>/^[\w-]{1,64}$/.test(v);
  const walk=o=>{ if(Array.isArray(o)) o.forEach(walk); else if(o&&typeof o==='object') for(const k of Object.keys(o)){ const v=o[k]; if(/^(id|charId|ch|value|eventId)$/.test(k)&&typeof v==='string'&&v&&!ok(v)&&!bad.has(v)) bad.set(v,'x'+Math.random().toString(36).slice(2,10)); walk(v); } };
  walk(g); if(!bad.size) return g;
  let s=JSON.stringify(g); bad.forEach((nv,ov)=>{ s=s.split(JSON.stringify(ov)).join(JSON.stringify(nv)); }); return JSON.parse(s);
}
// 끊긴 참조 고치기: 없는 캐릭터를 가리키는 톡은 대본에 나온 이름으로 주인을 다시 찾고, 픽업 배너에서는 없는 캐릭터를 빼요
function repairRefs(g){ const ids=new Set((g.chars||[]).map(c=>c.id)), byName=n=>(g.chars||[]).find(c=>c.name===String(n||'').trim());
  const tids=new Set([...ids,...(g.npcs||[]).map(n=>n.id),'__player']); (g.threads||[]).forEach(t=>{ if(!t||!t.charId||tids.has(t.charId)) return; let c=null; String(t.script||'').split('\n').some(l=>{ const m=l.match(/^\s*([^:\[\]\n{}]{1,24})\s*:/); return m&&(c=byName(m[1])); }); if(c) t.charId=c.id; });
  (g.banners||[]).forEach(b=>{ if(!b) return; const keep=(b.pickup||[]).filter(x=>ids.has(x)); if(keep.length!==(b.pickup||[]).length){ b.pickup=keep; if(!keep.length&&b.type==='pickup'){ const s=(g.chars||[]).find(c=>c.rarity===3&&!c.alt); if(s) b.pickup=[s.id]; } } if(b.pool&&Array.isArray(b.pool.ids)) b.pool.ids=b.pool.ids.filter(x=>ids.has(x)); }); }
function fix(g){
  const d=defaults(); g=safeIds(g||{});
  const old=(g.ver||1)<VER;
  g.world=Object.assign(d.world,g.world||{});
  g.chars=Array.isArray(g.chars)?g.chars:d.chars;
  if(inheritAll(g)) g.__curveNew=true; // 이격 = 원본 + 수정치 (0065-inherit.js)
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
  const m0=g.meta||{}; g.meta=Object.assign(clone(DEFAULT_META),m0); g.meta.terms=Object.assign(clone(DEFAULT_META.terms),m0.terms||{}); g.meta.terms.abyss=explorationName(g.meta.terms.abyss);
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
  g.events.forEach(ev=>{ if(!ev.shop||!ev.shop.length) ev.shop=defaultShop(ev,g); });
  if(!Array.isArray(g.dispatches)) g.dispatches=clone(DEFAULT_DISP);
  if(!g.lib.some(l=>l.kind==='sfx')) g.lib.push(...clone(DEFAULT_SFX));
  syncEnemies(g);
  [['gems','currency','blue crystal gem, faceted crystal, glowing, sparkle'],['gold','gold','gold coin, embossed star emblem, shiny metal'],['exp','expMat','glowing data chip, holographic record, blue light'],['wmat','wMat','mechanical parts, gears and bolts, metal'],['core','core','hexagonal energy core, pink glow, crystal inside'],['gearMat','gearMat','polished alloy ingot, metallic shine, gear emblem'],['transcMat','transcMat','radiant transcendence crystal, violet and gold glow']].forEach(([k,t,pr])=>{ if(!g.lib.some(l=>l.kind==='icon'&&l.key===k)) g.lib.push({id:'ic_'+k,kind:'icon',key:k,name:((g.meta.terms||{})[t]||t)+' 아이콘',prompt:pr,img:null}); });
  const pd=clone(DEFAULT_PROG); ['mat','dm','pass'].forEach(k=>{g.prog[k]=Object.assign(clone(pd[k]),g.prog[k]||{});});
  { const dl=clone(DEFAULT_PROG.live), l0=g.prog.live||{}; g.prog.live=Object.assign(dl,l0); g.prog.live.on=Object.assign(clone(DEFAULT_PROG.live.on),l0.on||{}); g.prog.live.seasons=Object.assign(clone(DEFAULT_PROG.live.seasons),l0.seasons||{}); g.prog.live.last=l0.last||{}; g.prog.live.notices=Array.isArray(l0.notices)?l0.notices:[]; g.prog.live.recentPU=Array.isArray(l0.recentPU)?l0.recentPU:[]; }
  ['pities','tokens','disp','farmClear','shopBuy'].forEach(k=>{if(!g.prog[k]||typeof g.prog[k]!=='object')g.prog[k]={};}); farmClearV2(g.prog);
  g.prog.shop=Object.assign({day:'',buy:{}},g.prog.shop||{}); g.prog.cash=Object.assign({first:{},month:{until:0,last:''},total:0},g.prog.cash||{}); g.prog.cash.first=g.prog.cash.first||{}; g.prog.cash.month=Object.assign({until:0,last:''},g.prog.cash.month||{});
  g.meta.shop=Object.assign(clone(DEFAULT_META.shop),g.meta.shop||{});
  if(g.prog.gold==null) g.prog.gold=20000;
  let legacyExtra=0;g.chapters.filter(ch=>ch.kind==='main').forEach((ch,i)=>{if(ch.stages.some(s=>g.prog.cleared?.[s.id]))legacyExtra=Math.max(legacyExtra,5*Math.max(0,i-9));});
  Object.values(g.prog.owned).forEach(o=>{if(o.levelCapVersion!==1){o.legacyLevelCap=Math.min(120,Math.max(Number(o.lv)||1,Math.min(70,20+10*(o.dup||0))+legacyExtra));o.transc=Math.min(5,Math.max(0,Math.floor(Number(o.transc)||0)));o.levelCapVersion=1;g.__curveNew=true;}if(o.lv>120){o.lv=120;o.exp=0;g.__curveNew=true;}if(GGMCombat.migrateGrowthProgress(o))g.__curveNew=true;o.wlv=o.wlv||0;o.skillTraining=GGMCombat.trainingState(o.skillTraining);o.skin=o.skin||'';if(o.dup==null)o.dup=0;});
  g.chars.forEach(c=>{ if(!c.skillPending&&/응답 대기|내부 검사하는 중|설계하는 중|새 게임을 연 뒤/.test(String(c.skillGenerationWarning||''))) c.skillPending=true; /* 생성 중 끊긴 스킬 설계 → 이어서(skillResume) */ c.rarity=[1,2,3].includes(+c.rarity)?+c.rarity:1; if(!['atk','def','sup'].includes(c.role)) c.role='atk'; c.elem=String(c.elem||'').replace(/[<>"'&`]/g,''); });
  if(Array.isArray(g.world.codex)) g.world.codex=g.world.codex.filter(x=>x&&typeof x==='object').map(x=>Object.assign(x,{cat:['world','faction','person','place','item','term','history'].includes(x.cat)?x.cat:'term',title:String(x.title||''),body:String(x.body||'')}));
  if(!(g.meta.ageTags>=1)){ g.chars.forEach(c=>{ if(c.naiPrompt) c.naiPrompt=stripAge(c.naiPrompt); }); g.meta.ageTags=1; g.__curveNew=true; }
  if(!(g.meta.curve>=3)){ g.chapters.filter(ch=>ch.kind==='main').forEach((ch,k)=>rebalanceChapter(ch,k)); g.meta.curve=3; g.__curveNew=true; }
  for(const c of g.chars)if(GGMCombat.migrateBaseStats(c))g.__curveNew=true;
  if(g.chars.some(c=>c.roleSpeedVersion!==1))g.__curveNew=true;g.chars.forEach(c=>v2Ensure(c)); g.meta.combatVersion=2;
  gameSlotsFix(g); scgFixAll(g); g.ver=VER;
  try{ repairRefs(g); }catch(e){}
  if(naiBlocksGame(g))g.__curveNew=true;
  return g;
}
function mark(...k){if(NEW_GAME_SOURCE&&G!==NEW_GAME_SOURCE)return;naiBlocksGame(G);for(const x of k)if(typeof x==='string'&&x.startsWith('c:'))inheritOnMark(x.slice(2));k.forEach(x=>dirty.add(x));saveRevision++;clearTimeout(flushT);flushT=setTimeout(()=>flush().catch(()=>{}),100);}
function flushNow(){if(dirty.size){clearTimeout(flushT);flush().catch(()=>{});}}
function markAll(){mark('meta','world','prog','opening',...G.chars.map(c=>'c:'+c.id),...G.chapters.map(ch=>'ch:'+ch.id),...G.lib.map(l=>'l:'+l.id),...G.threads.map(t=>'t:'+t.id));}
/* 저장 결과 알림(Model → 화면은 창 이벤트로 받음: ggm-saved · ggm-storage-error — 0080이 경고를 띄우고 지움) */
function saveFailed(message){ dispatchEvent(new CustomEvent('ggm-storage-error',{detail:{message}})); }
function flush(){
 if(window.__NOFLUSH)return appStorage.drain();
 const run=async()=>{if(!dirty.size)return appStorage.drain();const game=NEW_GAME_SOURCE||G,revision=saveRevision,keys=[...dirty],oldAt=game.prog.savedAt;const at=Date.now();
 try{const bases=new Set((game.chars||[]).filter(x=>!x.alt).map(x=>x.id)),snapshot=JSON.stringify({...game,chars:(game.chars||[]).map(c=>inheritStore(c,bases)),prog:{...game.prog,savedAt:at}});appStorage.setItem(LKEY,snapshot);await appStorage.drain();game.prog.savedAt=at;
 if(DB)for(const k of keys)await writeKey(k,game);
 if(revision===saveRevision)dirty.clear();dispatchEvent(new CustomEvent('ggm-saved'));
 }catch(e){game.prog.savedAt=oldAt;saveFailed(e.message||'기기에 저장하지 못했습니다');throw e;}};
 saveTail=saveTail.catch(()=>{}).then(run);return saveTail;
}
/* src/main/0070-store/0080-storage-integration.js에서 옮김 */
function writeKey(k,game=G){
  const ref=id=>DB.doc(BASE+'/'+id);
  const put=(pre,arr,id,doc)=>{const o=arr.find(x=>x.id===id);return o?ref(doc).set(clone(o)):ref(doc).delete();};
  if(k==='meta') return ref('meta').set({ver:VER});
  if(k==='world') return ref('world').set(clone(game.world));
  if(k==='opening') return ref('opening').set(clone(game.opening));
  if(k==='prog') return ref('progress').set(clone(game.prog));
  if(k.startsWith('c:')){const id=k.slice(2);return put('c',game.chars,id,'c_'+id);}
  if(k.startsWith('ch:')){const id=k.slice(3);return put('ch',game.chapters,id,'ch_'+id);}
  if(k.startsWith('l:')){const id=k.slice(2);return put('l',game.lib,id,'l_'+id);}
  if(k.startsWith('t:')){const id=k.slice(2);return put('t',game.threads,id,'t_'+id);}
}
function replaceAll(ng){
  const olds=[...G.chars.map(c=>'c:'+c.id),...G.chapters.map(ch=>'ch:'+ch.id),...G.lib.map(l=>'l:'+l.id),...G.threads.map(t=>'t:'+t.id)];
  G=fix(ng); delete G.__curveNew; mark(...olds); markAll(); loadIdbImages(); render();
}
async function idbGetNS(k){ let b=null; try{b=await idbGet(IMGNS+k);}catch(e){} if(!b&&IMGNS){ try{b=await idbGet(k);}catch(e){} } return b; }
function idbOpen(){return appStorage.open();}
async function idbPut(k,v){await appStorage.mediaWrite(k,v,LKEY);try{const ix=JSON.parse(appStorage.getItem('ggm-sync-idx')||'{}');if(ix[k]){delete ix[k];appStorage.setItem('ggm-sync-idx',JSON.stringify(ix));}}catch(e){}}
async function idbKeys(){const d=await idbOpen();return new Promise((res,rej)=>{const q=d.transaction('img').objectStore('img').getAllKeys();q.onsuccess=()=>res(q.result||[]);q.onerror=()=>rej(q.error);});}
async function idbDel(k){return appStorage.mediaWrite(k,null,LKEY);}
async function voiceStats(){let n=0,b=0;try{for(const k of await idbKeys()){if(String(k).startsWith('v_')){n++;const x=await idbGet(k);b+=x&&x.size||0;}}}catch(e){}return {n,mb:(b/1048576).toFixed(1)};}
async function idbGet(k){const d=await idbOpen();return new Promise((res,rej)=>{const t=d.transaction('img');const q=t.objectStore('img').get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});}
// 표정의 상반신판(f.up)·스킨 표정·NPC까지 모두 넣어야 다시 켰을 때·백업·연동에서 빠지지 않아요
function imgObjsOf(g){const a=[...(g.chars||[]),...(g.lib||[])];if(g.meta&&g.meta.shop&&g.meta.shop.self)a.push(g.meta.shop.self);const fz=fs=>(fs||[]).forEach(f=>{if(!f)return;a.push(f);if(f.up)a.push(f.up);});if(g.prog&&g.prog.avatar&&g.prog.avatar.id)a.push(g.prog.avatar);(g.npcs||[]).forEach(n=>{a.push(n);if(n.upper)a.push(n.upper);fz(n.faces);});(g.chars||[]).forEach(c=>{fz(c.faces);a.push(...(c.skins||[]));(c.skins||[]).forEach(k=>{if(!k)return;fz(k.faces);['upper','illust','lbcg'].forEach(x=>{if(k[x])a.push(k[x]);});});Object.values(c.skillIcons||{}).forEach(o=>{if(o&&o.id)a.push(o);});if(c.weapon)a.push(c.weapon);if(c.illust)a.push(c.illust);if(c.upper)a.push(c.upper);if(c.pose)a.push(c.pose);if(c.lbbg)a.push(c.lbbg);if(c.lbcg)a.push(c.lbcg);if(c.scg)a.push(c.scg);Object.values(c.cards||{}).forEach(o=>{if(o&&o.id)a.push(o);});});return a.filter(o=>o&&o.id);}
function allImgObjs(){return imgObjsOf(G);}
function imgSrc(o){
 if(o&&typeof G!=='undefined'&&G){const owner=(G.chars||[]).find(c=>c===o||(c.skins||[]).includes(o));if(owner){if(o!==owner)return skinPreviewSrc(owner,o);if(owner.useStanding===false)return owner.upper&&imgSrcRaw(owner.upper)||null;}}
 return imgSrcRaw(o);
}
function imgSrcRaw(o){ if(o&&!o.img&&o.alias&&typeof G!=='undefined'&&G&&G.lib){ const t=G.lib.find(l=>l.id===o.alias); return t&&t!==o&&!t.alias?imgSrc(t):null; } if(!o||!o.img) return null; if(o.img.asset) return null; if(o.img.idb) return imgCache[o.id]||null; return null; }
function skinOf(c){ if(NOSKIN) return null; const o=c&&P().owned[c.id]; return o&&o.skin?(c.skins||[]).find(x=>x.id===o.skin)||null:null; }
function skinPart(k,x){ if(!k[x]||typeof k[x]!=='object') k[x]={id:'k'+x.slice(0,2)+'_'+k.id,kind:x==='upper'?'upper':x,name:k.name+' '+SKP[x],prompt:'',img:null}; return k[x]; }
// A skin preview can only use images owned by that skin; never borrow the base outfit.
function skinPreviewSrc(c,k){if(!k)return null;const stand=imgSrcRaw(k),upper=k.upper&&imgSrcRaw(k.upper);return c.useStanding===false?upper||stand:stand||upper;}
function skinDisplayReady(c,k){return !!(k&&(c.useStanding===false?k.upper&&imgSrcRaw(k.upper):skinPreviewSrc(c,k)));}
function skinPrimaryPart(c,k){return c.useStanding===false?skinPart(k,'upper'):k;}
function skinPartSrc(c,x){ const k=skinOf(c); return k&&k[x]?imgSrc(k[x]):null; }
function lbcgSrc(c){return skinOf(c)?skinPartSrc(c,'lbcg'):c&&c.lbcg?imgSrc(c.lbcg):null;}
function charSrc(c,face){
  if(c.useStanding===false){const sk=skinOf(c);if(face){const f=((sk?.upper&&imgSrc(sk.upper)?sk.faces:c.faces)||[]).find(x=>x.name===face);if(f?.up&&imgSrc(f.up))return imgSrc(f.up);}return sk?.upper&&imgSrc(sk.upper)||c.upper&&imgSrc(c.upper)||null;}
  const sk=skinOf(c);
  if(sk&&skinPreviewSrc(c,sk)){ if(face){ const f=(sk.faces||[]).find(x=>x.name===face); if(f&&imgSrc(f)) return imgSrc(f); } return skinPreviewSrc(c,sk); }
  if(face){ const f=(c.faces||[]).find(x=>x.name===face); if(f&&imgSrc(f)) return imgSrc(f); }
  return imgSrc(c)||(()=>{ const en=G.lib.find(l=>l.kind==='enemy'&&l.name===c.name); return en?imgSrc(en):null; })();
}
function enemyLib(name){return G.lib.find(l=>l.kind==='enemy'&&l.name===name);}
function hash(s){let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
async function shrink(file,max){
  try{
    const bmp=await createImageBitmap(file); const s=Math.min(1,max/Math.max(bmp.width,bmp.height));
    const cv=document.createElement('canvas'); cv.width=Math.round(bmp.width*s); cv.height=Math.round(bmp.height*s);
    cv.getContext('2d').drawImage(bmp,0,0,cv.width,cv.height);
    const b=await new Promise(r=>cv.toBlob(r,'image/webp',0.92)); return b||file;
  }catch(e){return file;}
}
async function storeImage(o,blob,prefix){
  if(ASSETS){ const r=await ASSETS.upload(blob); o.img={asset:r.id}; }
  else { await idbPut(IMGNS+o.id,blob); if(imgCache[o.id]) URL.revokeObjectURL(imgCache[o.id]); imgCache[o.id]=URL.createObjectURL(blob); o.img={idb:true}; }
  if(o.redraw)delete o.redraw;if(blob&&blob.__seed!=null)o.seed=blob.__seed;else if(blob)delete o.seed;
  mark(prefix+o.id);
}
// 그림만 지워요(항목은 남겨요): 기기 저장소의 그림과 화면용 주소까지 정리해요
async function imgClear(o){ if(!o) return;if(appStorage.durable||window.indexedDB||o.img?.idb)await idbDel(IMGNS+o.id);o.img=null; delete o.seed; if(imgCache[o.id]){ try{ URL.revokeObjectURL(imgCache[o.id]); }catch(e){} delete imgCache[o.id]; } }
function faceTgt(c){ const k=FACET.cid===c.id&&FACET.sid&&(c.skins||[]).find(x=>x.id===FACET.sid); if(k){ k.faces=k.faces||[]; return k; } return c; }
async function addFaceFile(c,name,file,b){ const F=faceTgt(c); let fc=F.faces.find(q=>q.name===name); if(!fc){ fc={id:'f'+uid(),name,img:null}; F.faces.push(fc); } const bl=await shrink(file,1800); if(b==='up'){ fc.up=fc.up||{id:'fu'+fc.id,name:name+' 상반신',img:null}; await storeImage(fc.up,bl,''); } else await storeImage(fc,bl,''); mark('c:'+c.id); }
/* src/main/0070-store/0180-ui-scroll.js에서 옮김 */
function charIllust(c){ if(!c) return null; const k=skinOf(c); if(k&&imgSrc(k)) return skinPartSrc(c,'illust'); return c.illust?imgSrc(c.illust):null; } // 스킨을 입으면 기본 옷 일러스트로 돌아가지 않아요
/* src/main/0070-store/0520-backup-storage.js에서 옮김 */
function backupIdentity(g){return {title:String(g.meta?.title||''),ids:(g.chars||[]).map(x=>x.id).sort()};}
function backupMatches(a,g){const b=backupIdentity(g);return a&&a.title===b.title&&JSON.stringify(a.ids)===JSON.stringify(b.ids);}
function backupChatKeys(g){const keys=new Set();function visit(o){if(!o||typeof o!=='object')return;for(const[k,v]of Object.entries(o)){if(k==='img'&&typeof v==='string'&&v.startsWith('chat_'))keys.add(v);else if(v&&typeof v==='object')visit(v);}}visit(g);return [...keys];}
function backupMedia(g){return {chat:backupChatKeys(g),images:[...new Map(imgObjsOf(g).map(x=>[x.id,x])).values()].filter(x=>x.img?.idb).map(x=>({id:x.id,img:{idb:true},...(x.seed!=null?{seed:x.seed}:{})})),audios:(g.lib||[]).filter(x=>x.audio?.idb).map(x=>({id:x.id,audio:{idb:true}}))};}
async function backupBytes(blob){return String(await blobToData(blob)).split(',')[1];}
function attachBackupMedia(game,media){const map=new Map(imgObjsOf(game).map(x=>[x.id,x]));for(const item of media?.images||[]){const o=map.get(item.id);if(o){o.img={idb:true};if(item.seed!=null)o.seed=item.seed;}}for(const item of media?.audios||[]){const o=(game.lib||[]).find(x=>x.id===item.id);if(o)o.audio={idb:true};}}
/* /BACKUP_STORAGE_MODULE */
/* ---- 공유 팩: 내보내기·가져오기(백업과 같은 단계식 미디어 처리, 진행은 담지 않음) ---- */
/* Share archives use the same staged, chunked media pipeline as backups.
   Legacy JSON remains an import format; sharing never carries player progress. */
function shareDefinition(options){
 const game=JSON.parse(JSON.stringify(G));delete game.prog;
 const stages=game.chapters.filter(ch=>ch.kind==='main').reduce((n,ch)=>n+ch.stages.length,0);
 const spread=arr=>arr.forEach((x,k)=>{x.gate=options.gate===false?0:Math.min(stages,x.gate>0?x.gate:Math.max(1,Math.round((k+1)*stages/(arr.length+1))));});
 spread(game.events||[]);spread((game.banners||[]).filter(b=>b.id!=='std'&&!b.eventId));game.meta.gated=options.gate!==false&&stages>0;
 for(const b of game.banners||[]){delete b.until;if(b.id!=='std'&&game.meta.gated){b.active=true;delete b.newAt;}}
 for(const e of game.events||[]){delete e.until;if(game.meta.gated)e.active=true;}
 if(!String(game.meta.artTags||'').trim()){const config=naiCfg(),style=config.styles.find(x=>x.id===config.styleId)||config.styles[0];if(style&&String(style.tags||'').trim()){game.meta.artTags=style.tags;game.meta.artNeg=style.neg||'';}}
 for(const c of game.chars){delete c.voiceId;delete c.voiceName;}
 for(const o of imgObjsOf(game))if(!options.img||!o.img?.idb)o.img=null;
 for(const l of game.lib||[])if(!options.audio)l.audio=null;
 return game;
}
function clearImportedMediaCache(){for(const cache of [imgCache,audioCache,chatImgCache])for(const k of Object.keys(cache)){URL.revokeObjectURL(cache[k]);delete cache[k];}}
// Decode a legacy image in small base64 blocks rather than passing a huge URL to fetch.
async function legacyMediaBlob(value){
 const comma=value.indexOf(',');if(comma<5)throw Error('자료 파일의 데이터 주소가 올바르지 않습니다');const meta=value.slice(5,comma);
 if(!/;base64$/i.test(meta))return (await fetch(value)).blob();
 const type=meta.split(';')[0]||'application/octet-stream',parts=[];let data=value.slice(comma+1);if(/\s/.test(data))data=data.replace(/\s/g,'');
 for(let p=0;p<data.length;p+=349524){parts.push(b64ToBytes(data.slice(p,p+349524)));if(p&&p%1398096===0)await new Promise(resolve=>setTimeout(resolve,0));}
 return new Blob(parts,{type});
}
/* ---- 백업 파일 저장 위치·쓰기·내보내기(앱: 기기 폴더 / 웹: 내려받기) ---- */
function bkDests(){ return IS_NATIVE?[['docs','문서 폴더 (Documents/가챠게임메이커)'],['download','다운로드 폴더 (Download/가챠게임메이커)'],['share','공유하기 (구글 드라이브·카톡 등으로 보내기)']]
  :[...(window.showSaveFilePicker?[['pick','저장할 곳 직접 고르기']]:[]),['download','다운로드 폴더'],...(navigator.canShare?[['share','공유하기 (파일 앱·드라이브 등)']]:[])]; }
function bkDest(){ let v=''; try{ v=appStorage.getItem('ggm-bkdest')||''; }catch(e){} const L=bkDests(); return L.some(x=>x[0]===v)?v:L[0][0]; }
async function bkWriter(dest,name){
  if(IS_NATIVE&&CAP&&CAP.Filesystem){
    const FS=CAP.Filesystem, sub=dest==='docs'?'가챠게임메이커/':dest==='download'?'Download/가챠게임메이커/':'', dir=dest==='docs'?'DOCUMENTS':dest==='download'?'EXTERNAL_STORAGE':'CACHE', path=sub+name;
    if(dest!=='share'){ try{ if(FS.requestPermissions) await FS.requestPermissions(); }catch(e){ quietErr(e,'0520-backup-storage.js:171'); } }
    let first=true, buf='';
    const put=async()=>{ if(!buf&&!first) return; const data=buf; buf=''; if(first){ await FS.writeFile({path,data,directory:dir,encoding:'utf8',recursive:true}); first=false; } else await FS.appendFile({path,data,directory:dir,encoding:'utf8'}); };
    return {write:async s=>{ buf+=s; if(buf.length>1500000) await put(); }, close:async()=>{ await put(); const u=await FS.getUri({path,directory:dir}); return {uri:u.uri,where:dest==='share'?'':(dest==='docs'?'Documents/':'')+path}; }};
  }
  if(dest==='pick'&&window.showSaveFilePicker){ const h=await window.showSaveFilePicker({suggestedName:name,types:[{description:'메이커 백업 파일',accept:{'application/octet-stream':/\.(ggmbak|ggmpack)$/i.test(name)?[name.slice(name.lastIndexOf('.'))]:['.json']}}]}); const ws=await h.createWritable(); return {write:s=>ws.write(s),close:async()=>{ await ws.close(); return {where:h.name}; }}; }
  const parts=[]; return {write:async s=>{ parts.push(s); },close:async()=>({blob:new Blob(parts,{type:/\.(ggmbak|ggmpack)$/i.test(name)?'application/octet-stream':'application/json'})})};
}
async function exportGo(o){return o.share?shareExport(o):backupExport('full',o.dest,!!o.voice);}
/* 파일 내려받기(입출력 — 임시 링크를 눌러 브라우저 다운로드 폴더로): 백업·공유 팩·데이터 폴더·초안·그림 저장이 함께 씀 */
function downloadBlob(blob,name){ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},4000); }
/* src/main/0070-store/0525-data-folder.js에서 옮김 */
function dataSplit(g){const files={},rest={};for(const[k,v]of Object.entries(g))(DATA_TYPES.includes(k)?files:rest)[k]=v;files.game=rest;return files;}
function dataJoin(files){const g={...(files.game||{})};for(const k of DATA_TYPES)if(k in files)g[k]=files[k];return g;}
function crc32(u){let c=0xFFFFFFFF;for(let i=0;i<u.length;i++)c=CRC_T[(c^u[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
function zipMake(entries){const enc=new TextEncoder(),parts=[],central=[];let off=0;
 for(const e of entries){const n=enc.encode(e.name),d=e.data,crc=crc32(d),h=new DataView(new ArrayBuffer(30)),c=new DataView(new ArrayBuffer(46));
  h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(12,33,true);h.setUint32(14,crc,true);h.setUint32(18,d.length,true);h.setUint32(22,d.length,true);h.setUint16(26,n.length,true);
  c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(14,33,true);c.setUint32(16,crc,true);c.setUint32(20,d.length,true);c.setUint32(24,d.length,true);c.setUint16(28,n.length,true);c.setUint32(42,off,true);
  parts.push(h,n,d);central.push(c,n);off+=30+n.length+d.length;}
 const size=central.reduce((s,x)=>s+x.byteLength,0),end=new DataView(new ArrayBuffer(22));
 end.setUint32(0,0x06054b50,true);end.setUint16(8,entries.length,true);end.setUint16(10,entries.length,true);end.setUint32(12,size,true);end.setUint32(16,off,true);
 return new Blob([...parts,...central,end],{type:'application/zip'});}
async function zipRead(file){ // → Map(name → Blob). 파일 전체를 한 번에 읽지 않고 항목별로 잘라 읽어요
 const tail=new DataView(await file.slice(Math.max(0,file.size-65557)).arrayBuffer());let e=-1;
 for(let i=tail.byteLength-22;i>=0;i--)if(tail.getUint32(i,true)===0x06054b50){e=i;break;}
 if(e<0)throw Error('zip 파일이 아니에요');
 const count=tail.getUint16(e+10,true),cdSize=tail.getUint32(e+12,true),cdOff=tail.getUint32(e+16,true),cd=new DataView(await file.slice(cdOff,cdOff+cdSize).arrayBuffer()),dec=new TextDecoder(),out=new Map();
 for(let p=0,i=0;i<count;i++){if(cd.getUint32(p,true)!==0x02014b50)throw Error('zip 목록이 손상됐어요');
  const method=cd.getUint16(p+10,true),comp=cd.getUint32(p+20,true),nl=cd.getUint16(p+28,true),xl=cd.getUint16(p+30,true),cl=cd.getUint16(p+32,true),lo=cd.getUint32(p+42,true),name=dec.decode(new Uint8Array(cd.buffer,cd.byteOffset+p+46,nl));p+=46+nl+xl+cl;
  if(name.endsWith('/'))continue;
  const lh=new DataView(await file.slice(lo,lo+30).arrayBuffer()),start=lo+30+lh.getUint16(26,true)+lh.getUint16(28,true),raw=file.slice(start,start+comp);
  if(method===0)out.set(name,raw);
  else if(method===8&&window.DecompressionStream)out.set(name,await new Response(raw.stream().pipeThrough(new DecompressionStream('deflate-raw'))).blob());
  else throw Error('지원하지 않는 zip 압축 방식이에요: '+name);}
 return out;}
async function dataReadZip(file){ // zip → {game, media:[{key,blob}], title}
 const z0=await zipRead(file),ixName=[...z0.keys()].filter(n=>/(^|\/)index\.json$/.test(n)&&!/\/media\//.test(n)).sort((a,b)=>a.length-b.length)[0];
 if(!ixName)throw Error('index.json이 없어요. 데이터 폴더 zip이 맞는지 확인해 주세요');
 // 압축을 풀어 고친 뒤 다시 묶으면 맨 앞에 폴더가 붙거나 data/가 빠질 수 있어요: index.json이 있는 곳을 data/로 봐요
 const base=ixName.slice(0,-'index.json'.length),z=new Map([...z0].filter(([n])=>n.startsWith(base)).map(([n,b])=>['data/'+n.slice(base.length),b]));
 const readJSON=async(name,b)=>{try{return JSON.parse(await b.text());}catch(e){throw Error(name+' 을(를) 읽지 못했어요(JSON 문법 확인): '+e.message);}};
 const index=await readJSON('index.json',z.get('data/index.json')),gid=index?.games?.[0]?.id;if(index.format!=='ggm-data'||!gid||!/^[\w-]{1,64}$/.test(gid))throw Error('데이터 폴더 정보가 올바르지 않아요');
 const files={},re=new RegExp('^data/'+gid+'/([a-z]+)\\.json$');for(const[name,b]of z){const m=name.match(re);if(m&&m[1]!=='media')files[m[1]]=await readJSON(name,b);}
 const game=dataJoin(files);if(!Array.isArray(game.chars))throw Error('chars.json이 없거나 올바르지 않아요');
 const mj=z.get(`data/${gid}/media.json`),mm=mj?await readJSON('media.json',mj):{},media=[];
 for(const[k,v]of Object.entries(mm)){if(!/^[\w-]{1,80}$/.test(k))throw Error('자료 이름이 올바르지 않아요: '+k);const b=z.get(`data/${gid}/media/${k}`);if(!b)throw Error('자료 파일이 빠졌어요: '+k);media.push({key:k,blob:new Blob([b],{type:String(v?.type||'')})});}
 return {game,media,title:index.games[0].title||game.meta?.title||'가져온 게임'};}
async function dataSaveBlob(blob,name){
 if(IS_NATIVE&&CAP&&CAP.Filesystem){const FS=CAP.Filesystem,path='가챠게임메이커/'+name;try{if(FS.requestPermissions)await FS.requestPermissions();}catch(e){ quietErr(e,'0525-data-folder.js:58'); }
  await FS.writeFile({path,data:String(await blobToData(blob)).split(',')[1],directory:'DOCUMENTS',recursive:true});return 'Documents/'+path;}
 if(window.showSaveFilePicker){try{const h=await showSaveFilePicker({suggestedName:name,types:[{description:'데이터 폴더 zip',accept:{'application/zip':['.zip']}}]}),w=await h.createWritable();await w.write(blob);await w.close();return h.name;}catch(e){if(e?.name==='AbortError')return null;}}
 downloadBlob(blob,name);return name;}
