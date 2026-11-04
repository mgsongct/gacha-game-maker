/* ===== 0260-new-game — Model(상태·규칙·저장·외부 서비스) ===== */
/* src/main/0260-new-game/010-draft.js에서 옮김 */
function drLoad(){ let d=null; try{ d=JSON.parse(appStorage.getItem(DR2KEY)||'null'); }catch(e){} d=d&&typeof d==='object'?d:{};
  return Object.assign({mode:'',auto:'',kw:'',tone:'',theme:'auto',n:8,style:'',fan:false,src:'',story:'',stages:0,len:'normal',world:'',setting:'',chars:[],hero:{name:'',gender:'',look:'',hide:false}},d,{hero:Object.assign({name:'',call:'',gender:'',look:'',bio:'',hide:false},d.hero||{}),chars:Array.isArray(d.chars)?d.chars:[]}); }
function drLib(){ try{ const a=JSON.parse(appStorage.getItem(DRLIB)||'[]'); return Array.isArray(a)?a:[]; }catch(e){ return []; } }
function drClean(d){ const x=JSON.parse(JSON.stringify(d||{})); delete x.undo; return x; }
function draftFrom(t){ t=String(t||'').trim(); let o=null; const m=t.match(/GGMDRAFT:([A-Za-z0-9+/=\s]+)/);
  try{ if(m) o=JSON.parse(decodeURIComponent(escape(atob(m[1].replace(/\s+/g,''))))); else if(/^[\[{]/.test(t)) o=JSON.parse(t); }catch(e){ return null; }
  if(o&&o.d&&typeof o.d==='object') return {name:String(o.name||drName(o.d)).slice(0,40),d:o.d};
  if(o&&typeof o==='object'&&!Array.isArray(o)&&('chars' in o||'world' in o||'kw' in o||'auto' in o||'gtitle' in o)) return {name:drName(o),d:o}; // 초안 그대로 붙여 넣은 경우
  return null; }
function drSave(){ try{ appStorage.setItem(DR2KEY,JSON.stringify(DR2)); }catch(e){} }
function drLen(d){ d=d||DR2; return [d.auto,d.kw,d.tone,d.story,d.world,d.setting,d.hero.name,d.hero.gender,d.hero.look,d.hero.bio,...d.chars.flatMap(c=>[c.name,c.role,c.profile,c.look,c.speech])].reduce((n,s)=>n+String(s||'').length,0); }
function dedupText(text,seen,min){ min=min||8; let cut=0; const out=String(text||'').split('\n').map(line=>{ const m=line.match(/^(\s*(?:[-*•]|\d+[.)])?\s*(?:비밀\s*:)?\s*)/), pre=m?m[1]:''; const parts=line.slice(pre.length).split(/(?<=[.!?。…])\s+/);
    const keep=parts.filter(sn=>{ const k=sentKey(sn); if(k.length<min) return true; if(seen.some(x=>x===k||x.includes(k))){ cut++; return false; } seen.push(k); return true; });
    if(!keep.length&&parts.some(x=>x.trim())) return null; return pre+keep.join(' '); }).filter(l=>l!==null).join('\n').replace(/\n{3,}/g,'\n\n').trim(); return {text:out,cut}; }
function drDedup(d){ d=d||DR2; const seen=[]; let n=0; const run=(o,k)=>{ if(!o||!String(o[k]||'').trim()) return; const r=dedupText(o[k],seen); if(r.cut){ o[k]=r.text; n+=r.cut; } };
  if(dupTxt(d.kw,d.tone)){ d.tone=''; n++; } run(d,'kw'); run(d,'tone'); run(d,'world'); run(d,'setting'); run(d,'story'); run(d.hero,'bio'); (d.chars||[]).forEach(c=>{ run(c,'role'); run(c,'profile'); });
  return n; }
function drSnap(label){ const d=DR2; d.undo={label,kw:d.kw,tone:d.tone,world:d.world,setting:d.setting,story:d.story,chars:JSON.parse(JSON.stringify(d.chars)),hero:JSON.parse(JSON.stringify(Object.assign({},d.hero,{av:undefined})))}; }
/* src/main/0260-new-game/020-build.js에서 옮김 */
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
