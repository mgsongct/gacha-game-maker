/* =========================================================
   저장
   ========================================================= */
const PJKEY='starfall-projects';
function PJ(){let d=null;try{d=JSON.parse(appStorage.getItem(PJKEY));}catch(e){} if(!d||!Array.isArray(d.list)){d={active:'main',list:[{id:'main',title:'낙성계약'}]};} return d;}
function pjKey(id){return id==='main'?'starfall-contract-v1':'starfall-contract-v1-'+id;}
const LKEY=pjKey(PJ().active);
function enemyNames(g){const set=new Set(['훈련 표적','강화 표적','훈련 교관']);(g.chapters||[]).forEach(ch=>(ch.stages||[]).forEach(s=>(s.enemies||[]).forEach(e=>{if(e&&e.name)set.add(String(e.name));})));return [...set];}
/* 적 그림 재탕: 보스가 아닌 새 적은 기존 적 그림을 같이 써요(이름만 달라요). 적 종류가 ENEMY_KEEP개를 넘으면 외형이 와도 재탕해요 */
const ENEMY_KEEP=10;
function syncEnemies(g,looks){ g=g||G; let n=0; const lk=looks||{}, rz=lk.__reuse||{}, EL=(g.meta&&g.meta.title)===DEFAULT_META.title&&!(g.meta&&g.meta.draft)?ENEMY_LOOKS:{}; // 샘플 적 외형은 샘플 게임에서만(다른 세계관에 섞이지 않게)
  const boss=new Set(); (g.chapters||[]).forEach(ch=>(ch.stages||[]).forEach(st=>(st.enemies||[]).forEach(e=>{ if(e&&e.boss) boss.add(e.name); })));
  enemyNames(g).forEach(nm=>{ let l=g.lib.find(x=>x.kind==='enemy'&&x.name===nm);
    if(!l){ let alias='';
      if(!boss.has(nm)&&!(g.chars||[]).some(c=>c.name===nm)&&!EL[nm]){ const pool=g.lib.filter(x=>x.kind==='enemy'&&!x.alias&&!x.charId&&(x.prompt||x.img)&&!boss.has(x.name));
        const want=rz[nm]&&pool.find(x=>x.name===rz[nm]); if(want) alias=want.id; else if(pool.length&&(!lk[nm]||pool.length>=ENEMY_KEEP)) alias=pool[hashN(nm)%pool.length].id; }
      l={id:'n'+Math.random().toString(36).slice(2,10),kind:'enemy',name:nm,prompt:alias?'':String(lk[nm]||EL[nm]||''),img:null}; if(alias) l.alias=alias; g.lib.push(l); n++; if(typeof mark==='function'&&g===G) mark('l:'+l.id); }
    else if(!l.prompt&&(lk[nm]||EL[nm])){ l.prompt=String(lk[nm]||EL[nm]); if(typeof mark==='function'&&g===G) mark('l:'+l.id); }
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
const HEXC=/^#[0-9a-f]{3,8}$/i;
// 끊긴 참조 고치기: 없는 캐릭터를 가리키는 톡은 대본에 나온 이름으로 주인을 다시 찾고, 픽업 배너에서는 없는 캐릭터를 빼요
function repairRefs(g){ const ids=new Set((g.chars||[]).map(c=>c.id)), byName=n=>(g.chars||[]).find(c=>c.name===String(n||'').trim());
  const tids=new Set([...ids,...(g.npcs||[]).map(n=>n.id),'__player']); (g.threads||[]).forEach(t=>{ if(!t||!t.charId||tids.has(t.charId)) return; let c=null; String(t.script||'').split('\n').some(l=>{ const m=l.match(/^\s*([^:\[\]\n{}]{1,24})\s*:/); return m&&(c=byName(m[1])); }); if(c) t.charId=c.id; });
  (g.banners||[]).forEach(b=>{ if(!b) return; const keep=(b.pickup||[]).filter(x=>ids.has(x)); if(keep.length!==(b.pickup||[]).length){ b.pickup=keep; if(!keep.length&&b.type==='pickup'){ const s=(g.chars||[]).find(c=>c.rarity===3&&!c.alt); if(s) b.pickup=[s.id]; } } if(b.pool&&Array.isArray(b.pool.ids)) b.pool.ids=b.pool.ids.filter(x=>ids.has(x)); }); }
function fix(g){
  const d=defaults(); g=safeIds(g||{});
  const old=(g.ver||1)<VER;
  g.world=Object.assign(d.world,g.world||{}); if(!Array.isArray(g.world.factions)) g.world.factions=[];
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
  if(old){ const c1=g.chapters.find(c=>c.id==='c1'); if(c1){ const dc=d.chapters[0]; c1.stages.forEach(s=>{const ds=dc.stages.find(x=>x.id===s.id); if(ds){s.pre=ds.pre;s.post=ds.post;}}); } }
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
  if(!Array.isArray(g.events)){ g.events=[]; if(isDefaultGame){ g.events=clone(DEFAULT_EVENTS); if(!g.chapters.some(c=>c.id==='evc1')) g.chapters.push(clone(DEFAULT_EVENT_CHAPTER)); } }
  g.events.forEach(ev=>{ if(!ev.shop||!ev.shop.length) ev.shop=defaultShop(ev,g); });
  if(!Array.isArray(g.dispatches)) g.dispatches=clone(DEFAULT_DISP);
  if(!g.lib.some(l=>l.kind==='sfx')) g.lib.push(...clone(DEFAULT_SFX));
  syncEnemies(g);
  [['gems','currency','blue crystal gem, faceted crystal, glowing, sparkle'],['gold','gold','gold coin, embossed star emblem, shiny metal'],['exp','expMat','glowing data chip, holographic record, blue light'],['wmat','wMat','mechanical parts, gears and bolts, metal'],['core','core','hexagonal energy core, pink glow, crystal inside'],['gearMat','gearMat','polished alloy ingot, metallic shine, gear emblem'],['transcMat','transcMat','radiant transcendence crystal, violet and gold glow']].forEach(([k,t,pr])=>{ if(!g.lib.some(l=>l.kind==='icon'&&l.key===k)) g.lib.push({id:'ic_'+k,kind:'icon',key:k,name:((g.meta.terms||{})[t]||t)+' 아이콘',prompt:pr,img:null}); });
  const pd=clone(DEFAULT_PROG); ['mat','dm','pass'].forEach(k=>{g.prog[k]=Object.assign(clone(pd[k]),g.prog[k]||{});});
  { const dl=clone(DEFAULT_PROG.live), l0=g.prog.live||{}; g.prog.live=Object.assign(dl,l0); g.prog.live.on=Object.assign(clone(DEFAULT_PROG.live.on),l0.on||{}); g.prog.live.seasons=Object.assign(clone(DEFAULT_PROG.live.seasons),l0.seasons||{}); g.prog.live.last=l0.last||{}; g.prog.live.notices=Array.isArray(l0.notices)?l0.notices:[]; g.prog.live.recentPU=Array.isArray(l0.recentPU)?l0.recentPU:[]; }
  ['pities','tokens','disp','farmClear','shopBuy'].forEach(k=>{if(!g.prog[k]||typeof g.prog[k]!=='object')g.prog[k]={};});
  g.prog.shop=Object.assign({day:'',buy:{}},g.prog.shop||{}); g.prog.cash=Object.assign({first:{},month:{until:0,last:''},total:0},g.prog.cash||{}); g.prog.cash.first=g.prog.cash.first||{}; g.prog.cash.month=Object.assign({until:0,last:''},g.prog.cash.month||{});
  g.meta.shop=Object.assign(clone(DEFAULT_META.shop),g.meta.shop||{});
  if(g.prog.gold==null) g.prog.gold=20000;
  let legacyExtra=0;g.chapters.filter(ch=>ch.kind==='main').forEach((ch,i)=>{if(ch.stages.some(st=>g.prog.cleared?.[st.id]))legacyExtra=Math.max(legacyExtra,5*Math.max(0,i-9));});
  Object.values(g.prog.owned).forEach(o=>{if(o.levelCapVersion!==1){o.legacyLevelCap=Math.min(120,Math.max(Number(o.lv)||1,Math.min(70,20+10*(o.dup||0))+legacyExtra));o.transc=Math.min(5,Math.max(0,Math.floor(Number(o.transc)||0)));o.levelCapVersion=1;g.__curveNew=true;}if(o.lv>120){o.lv=120;o.exp=0;g.__curveNew=true;}if(GGMCombat.migrateGrowthProgress(o))g.__curveNew=true;o.wlv=o.wlv||0;o.skillTraining=GGMCombat.trainingState(o.skillTraining);o.skin=o.skin||'';if(o.dup==null)o.dup=0;});
  g.chars.forEach(c=>{ c.rarity=[1,2,3].includes(+c.rarity)?+c.rarity:1; if(!['atk','def','sup'].includes(c.role)) c.role='atk'; c.elem=String(c.elem||'').replace(/[<>"'&`]/g,''); });
  if(Array.isArray(g.world.codex)) g.world.codex=g.world.codex.filter(x=>x&&typeof x==='object').map(x=>Object.assign(x,{cat:['world','faction','person','place','item','term','history'].includes(x.cat)?x.cat:'term',title:String(x.title||''),body:String(x.body||'')}));
  if(!(g.meta.ageTags>=1)){ g.chars.forEach(c=>{ if(c.naiPrompt) c.naiPrompt=stripAge(c.naiPrompt); }); g.meta.ageTags=1; g.__curveNew=true; }
  if(!(g.meta.curve>=3)){ g.chapters.filter(c=>c.kind==='main').forEach((ch,k)=>rebalanceChapter(ch,k)); g.meta.curve=3; g.__curveNew=true; }
  for(const c of g.chars)if(GGMCombat.migrateBaseStats(c))g.__curveNew=true;
  if(g.chars.some(c=>c.roleSpeedVersion!==1))g.__curveNew=true;g.chars.forEach(c=>v2Ensure(c)); g.meta.combatVersion=2;
  g.ver=VER;
  try{ repairRefs(g); }catch(e){}
  if(naiBlocksGame(g))g.__curveNew=true;
  return g;
}
let G; {const r=appStorage.getItem(LKEY);G=fix(r?JSON.parse(r):defaults());}
let DB=null,BASE=null,SAMPLE=null,ASSETS=null;
// Draft builders temporarily use G; persistence must keep the real game.
let NEW_GAME_SOURCE=null;
const dirty=new Set(); let flushT=null,saveRevision=0,saveTail=Promise.resolve();
function mark(...k){if(NEW_GAME_SOURCE&&G!==NEW_GAME_SOURCE)return;naiBlocksGame(G);for(const x of k)if(typeof x==='string'&&x.startsWith('c:'))inheritOnMark(x.slice(2));k.forEach(x=>dirty.add(x));saveRevision++;clearTimeout(flushT);flushT=setTimeout(()=>flush().catch(()=>{}),100);}
function flushNow(){if(dirty.size){clearTimeout(flushT);flush().catch(()=>{});}}
addEventListener('pagehide',flushNow);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flushNow();},true);
function markAll(){mark('meta','world','prog','opening',...G.chars.map(c=>'c:'+c.id),...G.chapters.map(c=>'ch:'+c.id),...G.lib.map(l=>'l:'+l.id),...G.threads.map(t=>'t:'+t.id));}
function flush(){
 if(window.__NOFLUSH)return appStorage.drain();
 const run=async()=>{if(!dirty.size)return appStorage.drain();const game=NEW_GAME_SOURCE||G,revision=saveRevision,keys=[...dirty],oldAt=game.prog.savedAt;const at=Date.now();
 try{const bases=new Set((game.chars||[]).filter(x=>!x.alt).map(x=>x.id)),snapshot=JSON.stringify({...game,chars:(game.chars||[]).map(c=>inheritStore(c,bases)),prog:{...game.prog,savedAt:at}});appStorage.setItem(LKEY,snapshot);await appStorage.drain();game.prog.savedAt=at;
 if(DB)for(const k of keys)await writeKey(k,game);
 if(revision===saveRevision)dirty.clear();const b=document.getElementById('save-warning');if(b)b.remove();
 }catch(e){game.prog.savedAt=oldAt;storageWarning(e.message||'기기에 저장하지 못했습니다');throw e;}};
 saveTail=saveTail.catch(()=>{}).then(run);return saveTail;
}
