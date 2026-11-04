/* ===== 0300-world — Model(상태·규칙·저장·외부 서비스) ===== */
/* src/main/0300-world/0300-codex.js에서 옮김 */
function cxStore(){ return gameRead('world.codex'); } // 읽기 — 바꿀 때는 아래 기록 함수(cxPut·cxKeep·cxUpsert)
/* 도감 기록 바꾸기(Model — 도감 칸 G.world.codex는 이 모듈만 씀): 넣기 · 조건에 맞는 것만 남기기 · 제목으로 고치거나 넣기 */
function cxPut(x){ gameSlot('world.codex').push(x); return x; }
function cxKeep(keep){ G.world.codex=cxStore().filter(keep); }
function cxUpsert(title,body,cat){ const x=gameSlot('world.codex').find(e=>e.title===title); if(x){ x.body=body; return x; } return cxPut({cat:cat||'term',title,body}); }
function cxNotes(){ return gameRead('world.codexNotes'); } // 읽기 — 바꿀 때는 cxNoteAdd
function cxNoteAdd(key,text,at){ const N=gameSlot('world.codexNotes'); (N[key]=N[key]||[]).push({text,at}); mark('world'); }
function libSrc(kind,name){ const l=G.lib.find(x=>x.kind===kind&&x.name===name); return l?imgSrc(l):null; }
function mainStages(){ const a=[]; G.chapters.filter(ch=>ch.kind==='main').forEach((ch,ci)=>ch.stages.forEach((s,si)=>a.push({id:s.id,code:(ci+1)+'-'+(si+1),title:s.title,ch}))); return a; }
function escRe(s){return String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function cxMention(seen,name){ name=String(name||'').trim(); if(!name) return false; if(new RegExp('\\[(배경|소품)\\s*[:：]\\s*'+escRe(name)+'\\s*\\]').test(seen)) return true; if(name===P().lobbyBg||name===P().titleBg) return true; return name.length>=3&&seen.includes(name); }
function cxSeenText(){ const p=P(); let t=(G.opening&&G.opening.lines||[]).join('\n')+'\n'+(p.lobbyBg||'')+'\n'+(p.titleBg||'');
  G.chapters.forEach(ch=>ch.stages.forEach(s=>{ if(p.cleared[s.id]) t+='\n'+(s.pre||'')+'\n'+(s.post||''); })); return t; }
function cxUnlocked(u){ if(!u||u.type==='start') return true; if(u.type==='clear') return !!P().cleared[u.value]||!G.chapters.some(ch=>ch.stages.some(s=>s.id===u.value)); if(u.type==='own') return !!own(u.value); if(u.type==='seen') return !!u.ok; return true; }
function cxLockText(u){ if(!u) return ''; if(u.type==='clear') return stageCode(u.value)+' 클리어 시 공개'; if(u.type==='own') return '합류하면 공개'; if(u.type==='seen') return '스토리에 등장하면 공개'; return ''; }
function cxEntries(){
  const out=[], w=G.world, seen=cxSeenText();
  out.push({key:'w:main',cat:'world',title:w.name||G.meta.title,sub:'세계관',body:[w.summary,w.lore].filter(Boolean).join('\n\n'),unlock:{type:'start'},img:libSrc('bg',P().titleBg)});
  (w.factions||[]).forEach(f=>{ const mem=G.chars.filter(c=>c.faction===f.name); out.push({key:'f:'+f.name,cat:'faction',title:f.name,sub:'세력',body:(f.desc||'')+(mem.length?'\n\n알려진 소속: '+mem.map(c=>own(c.id)?c.name:'???').join(', '):''),unlock:{type:'start'}}); });
  G.chars.forEach(c=>{ const o=own(c.id), files=(c.files||[]).filter(x=>o&&o.dup>=(x.dup||0));
    out.push({key:'c:'+c.id,cat:'person',title:c.name,sub:[c.faction,RL[c.rarity],ROLE[c.role]].filter(Boolean).join(' · '),body:[c.profile,...files.map(x=>'【'+T('files')+' '+(x.dup||'')+'】 '+(x.text||''))].filter(Boolean).join('\n\n')+((c.files||[]).length>files.length?`\n\n(${T('limit')}하면 ${T('files')}가 더 공개돼요)`:''),unlock:{type:'own',value:c.id},char:c}); });
  G.lib.filter(l=>l.kind==='bg').forEach(l=>out.push({key:'p:'+l.name,cat:'place',title:l.name,sub:'장소',body:'',unlock:{type:'seen',ok:cxMention(seen,l.name)},img:imgSrc(l)}));
  G.lib.filter(l=>l.kind==='prop').forEach(l=>out.push({key:'i:'+l.name,cat:'item',title:l.name,sub:'물건',body:'',unlock:{type:'seen',ok:cxMention(seen,l.name)},img:imgSrc(l),contain:true}));
  const ens={}; G.chapters.filter(ch=>ch.kind==='main').forEach(ch=>ch.stages.forEach(s=>(s.enemies||[]).forEach(e=>{ const x=ens[e.name]||(ens[e.name]={e,codes:[],first:s.id,clear:false}); x.codes.push(stageCode(s.id)); if(P().cleared[s.id]) x.clear=true; })));
  Object.values(ens).forEach(x=>{ const e=x.e; out.push({key:'e:'+e.name,cat:'enemy',title:e.name,sub:`${e.elem} 속성${e.boss?' · 보스':''}`,body:`출현: ${[...new Set(x.codes)].join(', ')}`,unlock:x.clear?{type:'start'}:{type:'clear',value:x.first},img:(enemyLib(e.name)&&imgSrc(enemyLib(e.name)))||null,contain:true}); });
  G.chapters.filter(ch=>ch.kind==='main').forEach((ch,ci)=>{ const done=ch.stages.filter(s=>P().cleared[s.id]);
    out.push({key:'h:'+ch.id,cat:'history',title:ch.title,sub:`CHAPTER ${ci+1} · ${done.length}/${ch.stages.length}`,body:ch.stages.map((s,si)=>(P().cleared[s.id]?'✓ ':'· ')+`${ci+1}-${si+1} `+(P().cleared[s.id]?s.title:'???')).join('\n'),unlock:ch.stages[0]?{type:'clear',value:ch.stages[0].id}:{type:'start'}}); });
  cxStore().forEach(x=>out.push({key:'x:'+x.id,cat:CX_LABEL[x.cat]&&x.cat!=='all'?x.cat:'term',title:x.title,sub:(CX_LABEL[x.cat]||'기록')+(x.src==='ai'?' · AI 기록':''),body:x.body,unlock:x.unlock||{type:'start'},stored:x,img:libSrc('bg',x.title)||libSrc('prop',x.title)}));
  const N=cxNotes(); out.forEach(e=>{ e.notes=(N[e.key]||[]); e.open=cxUnlocked(e.unlock); });
  return out;
}
function cxNewFast(){ const p=P(), sig=[Object.keys(p.cleared).length,Object.keys(p.owned).length,cxStore().length,G.lib.length,G.chapters.length,Object.keys(progRead('cxSeen')).length,Object.keys(p.cxBadge||{}).length].join('|'); if(CXMEMO&&CXMEMO.sig===sig) return CXMEMO.n; const s=progRead('cxSeen'), bd=p.cxBadge||{}; const n=cxEntries().filter(e=>e.open&&!s[e.key]&&!bd[e.key]).length; CXMEMO={sig,n}; return n; }
/* 도감 본 기록 칸 처음 만들기: 그때 열려 있는 기록(직접 적은 것 빼고)은 본 것으로 — 진행 칸 cxSeen의 정의(0070 PROG_SLOTS) */
function cxSeenNew(){ const s={}; cxEntries().forEach(e=>{ if(e.open&&!e.stored) s[e.key]=1; }); return s; }
/* 도감 새 기록 표시(Model — 도감 화면에 들어가기 전): 새로 열린 기록에 표시 */
function cxBadgeSync(){ const p=P(), s=progSlot('cxSeen'); p.cxBadge=p.cxBadge||{}; let ch=false; cxEntries().forEach(e=>{ if(e.open&&!s[e.key]&&!p.cxBadge[e.key]){ p.cxBadge[e.key]=1; ch=true; } }); if(ch){ CXMEMO=null; mark('prog'); } }
/* 도감 기록을 봄(Model) */
function cxMarkSeen(key){ progSlot('cxSeen')[key]=1; CXMEMO=null; mark('prog'); }
function codeToStage(code){ code=String(code||'').trim(); if(!code||/^start|처음/i.test(code)) return null; const m=mainStages().find(s=>s.code===code); return m?m.id:null; }
async function cxDiscover(t){
  const st=mainStages(), have=cxEntries().map(e=>e.title);
  const r=await aiJSON(cxDiscoverPrompt({have,st}),t);
  if(!r||!Array.isArray(r.entries)) return 0;
  let n=0; r.entries.slice(0,8).forEach(x=>{ if(!x||!x.title||!x.body) return; const cat=CX_LABEL[x.cat]&&x.cat!=='all'?x.cat:'term'; const sid=codeToStage(x.after);
    cxPut({id:'cx'+uid(),cat,title:String(x.title).slice(0,40),body:String(x.body),unlock:sid?{type:'clear',value:sid}:{type:'start'},src:'ai',at:Date.now()}); n++; });
  mark('world'); return n;
}
async function cxDeepen(key,t){
  const e=cxEntries().find(x=>x.key===key); if(!e) return false;
  const r=await aiJSON(cxDeepenPrompt({e}),t);
  if(!r||!r.text) return false;
  cxNoteAdd(key,String(r.text),mainStages().filter(s=>P().cleared[s.id]).map(s=>s.code).pop()||'시작 전'); return true;
}
function cxFromChapter(r,ch){ if(!r||!Array.isArray(r.codex)) return; const last=ch.stages[ch.stages.length-1];
  r.codex.slice(0,3).forEach(x=>{ if(!x||!x.title||!x.body) return; cxPut({id:'cx'+uid(),cat:CX_LABEL[x.cat]&&x.cat!=='all'?x.cat:'term',title:String(x.title).slice(0,40),body:String(x.body),unlock:last?{type:'clear',value:last.id}:{type:'start'},src:'ai',at:Date.now()}); }); mark('world'); }
/* src/main/0300-world/0445-factions.js에서 옮김 */
function castCfg(){ const c=G.meta.cast||{}; return {pickupGate:c.pickupGate!==false,hostileGate:c.hostileGate!==false}; }
/* 세력 목록 G.world.factions: 캐릭터 소속인데 목록에 없는 세력(플레이어블로) · 종류·장별 태도·관계 칸 보정 — 정의는 이 셋 */
function factionMissing(g,list){ const out=[]; g.chars.forEach(c=>{ if(c.faction&&!c.monster&&!c.collab&&!list.some(f=>f.name===c.faction)&&!out.some(f=>f.name===c.faction)) out.push({name:c.faction,desc:'',kind:'playable',rel:{},stance:[]}); }); return out; }
function factionOk(f){ return !!FKIND[f.kind]&&Array.isArray(f.stance)&&!!f.rel&&typeof f.rel==='object'; }
function factionFixed(f,g){ return {kind:FKIND[f.kind]?f.kind:g.chars.some(c=>c.faction===f.name&&!c.monster)?'playable':g.lib.some(l=>l.kind==='enemy'&&!l.charId&&l.name.includes(f.name))?'monster':'neutral',stance:Array.isArray(f.stance)?f.stance:[],rel:f.rel&&typeof f.rel==='object'?f.rel:{}}; } // 맞춘 칸(종류·장별 태도·관계)만 새로 — 바꾸지 않음
/* 쓰기(Model): 목록을 맞춰 저장하고 돌려줌 — 세력을 고치는 처리가 부름(읽기는 맞춘 모양을 보여 주므로 불러오기에서 따로 맞추지 않음 — FKIND는 불러올 때 아직 없음) */
function factionSync(g=G){ const w=gameSlot('world.factions',g); w.push(...factionMissing(g,w)); w.forEach(f=>Object.assign(f,factionFixed(f,g))); return w; }
/* 읽기: 맞춰져 있으면 저장된 목록 그대로, 아니면 맞춘 모양을 새로 만들어 보여 주기만(상태는 그대로 — 고칠 때는 factionSync) */
function factions(){ const w=gameRead('world.factions'), miss=factionMissing(G,w); return miss.length||!w.every(factionOk)?[...w.map(f=>factionOk(f)?f:Object.assign({},f,factionFixed(f,G))),...miss]:w; }
function facByName(n){ return factions().find(f=>f.name===n); } // 읽기 — 고칠 때는 facSlot
function facSlot(n){ return factionSync().find(f=>f.name===n); }
function mainNow(){ const main=G.chapters.filter(ch=>ch.kind==='main'), i=main.findIndex(ch=>(ch.stages||[]).some(s=>!P().cleared[s.id])); return i<0?main.length+1:i+1; } // 지금 진행 중인 장(1부터) = 다 깨지 않은 첫 메인 장(예전엔 스테이지 하나만 깨도 다음 장으로 셈)
function stanceAt(f,ch){ if(!f) return 'neutral'; const L=(f.stance||[]).filter(x=>+x.ch<=ch).sort((a,b)=>a.ch-b.ch); return L.length?L.at(-1).s:f.kind==='playable'?'ally':f.kind==='neutral'?'neutral':'hostile'; }
function monsterNames(){ const nm=new Set([...G.chars.map(c=>c.name),...(G.npcs||[]).map(n=>n.name)]); return G.lib.filter(l=>l.kind==='enemy'&&!l.charId&&!l.alias&&!nm.has(l.name)&&!SYS_ENEMY.test(l.name)); }
function enemyFaction(l){ return l.faction||((factions().find(f=>f.kind!=='playable'&&l.name.includes(f.name))||{}).name)||''; }
function isMonsterLike(x){ if(!x) return false; const name=String(x.name||'').trim(), t=String(x.role||''), np=String(x.naiPrompt||x.look||'').trim();
  return G.lib.some(l=>l.kind==='enemy'&&!l.charId&&l.name===name&&(/^no humans/i.test(l.prompt||'')||(facByName(enemyFaction(l))||{}).kind==='monster'))||/^no humans/i.test(np)||/(^|[\s(])(몬스터|괴물|마물|마수|짐승|야수|괴수|언데드|슬라임|기계 병기)/.test(t)||(facByName(x.faction)||{}).kind==='monster'; }
// 등장·영입
function metInStory(c){ if(c.debut&&P().cleared[c.debut]) return true; if(typeof relPair==='function'&&relPair(REL_ME,c.id)) return true;
  return G.chapters.some(ch=>(ch.stages||[]).some(s=>P().cleared[s.id]&&new RegExp('(^|\\n)'+String(c.name).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(\\s*\\[[^\\]]*\\])?\\s*[:：]').test((s.pre||'')+'\n'+(s.post||'')))); }
function castLock(c){ if(c.monster) return '몬스터는 영입할 수 없어요'; if(c.debutLater&&!own(c.id)) return '스토리에서 아직 만나지 않았어요(나중 장에서 첫 등장)'; if(!debutOk(c)){ const s=stageById(c.debut); return `스토리 「${s?s.title:'?'}」을(를) 깨면 열려요`; }
  if(castCfg().hostileGate&&!own(c.id)){ const f=facByName(c.faction); if(f&&stanceAt(f,mainNow())==='hostile') return `${f.name}이(가) 지금 적대 중이라 영입할 수 없어요`; } return ''; }
function castOk(c){ return !castLock(c); }
// 깊이 점검
function factionReview(){ const out=[], F=factions(); if(F.length<2) out.push({w:15,msg:'세력이 2개 미만이에요'}); if(!F.some(f=>f.kind==='hostile'||f.kind==='monster')) out.push({w:8,msg:'적대 세력·몬스터 무리가 없어요'});
  F.forEach(f=>{ const miss=F_FIELDS.slice(0,5).filter(([k])=>!(f.kind==='monster'&&['leader','ideology'].includes(k))&&!String(f[k]||'').trim()).map(x=>x[1]); if(String(f.desc||'').length<20) out.push({w:6,msg:`「${f.name}」 개요가 너무 짧아요`}); if(miss.length) out.push({w:Math.min(8,miss.length*2),msg:`「${f.name}」에 ${miss.join('·')}이(가) 없어요`});
    if(f.kind==='monster'){ const mm=M_FIELDS.filter(([k])=>!String(f[k]||'').trim()).map(x=>x[1]); if(mm.length) out.push({w:mm.length*3,msg:`몬스터 「${f.name}」의 ${mm.join('·')}이(가) 없어요`}); }
    if(F.length>1&&!Object.keys(f.rel).length) out.push({w:3,msg:`「${f.name}」과 다른 세력의 관계가 없어요`}); });
  const M=monsterNames(), nod=M.filter(l=>!l.desc); if(nod.length) out.push({w:Math.min(20,nod.length*2),msg:`정체가 정해지지 않은 적 ${nod.length}종: ${nod.slice(0,6).map(l=>l.name).join(', ')}${nod.length>6?' …':''}`});
  const bad=[...G.chars.filter(c=>!c.monster&&isMonsterLike(c)),...(G.npcs||[]).filter(n=>!n.monster&&isMonsterLike(n))]; if(bad.length) out.push({w:10,msg:`몬스터로 보이는 캐릭터·NPC: ${bad.map(x=>x.name).join(', ')}`});
  const score=Math.max(0,100-out.reduce((a,x)=>a+x.w,0)); return {score,issues:out}; }
/* 세력 장별 태도 보완(점검 w_stance·실행 중 자동 채움): 장을 만들 때만 생기는 태도가 예전 게임엔 비어 종류 기본값으로만 돌아요 —
   이미 쓴 메인 장 이야기로 세력마다 1장의 처음 관계와 바뀐 장을 정해 넣어요. 답에 없는 세력은 종류 기본값을 1장 태도로 적어 둬요(다시 비었다고 잡히지 않게) */
async function stanceAI(){ const F=factions().filter(f=>f.kind!=='monster'), main=G.chapters.filter(ch=>ch.kind==='main'); if(!F.length||!main.length) return false;
  const r=await aiJSON(stanceAIPrompt({F,main}),null,'default'); if(!r) return false;
  (Array.isArray(r.stance)?r.stance:[]).forEach(x=>{ const f=facSlot(String(x&&x.faction||'').trim()), ch=Math.max(1,Math.min(main.length,Math.round(+(x&&x.ch)||1))); if(!f||f.kind==='monster'||!FSTANCE[x.s]) return; f.stance=(f.stance||[]).filter(y=>+y.ch!==ch); f.stance.push({ch,s:x.s,why:String(x.why||'').slice(0,80)}); });
  F.forEach(f=>{ if(!Array.isArray(f.stance)) f.stance=[]; if(!f.stance.length) f.stance.push({ch:1,s:stanceAt(f,1),why:''}); f.stance.sort((a,b)=>a.ch-b.ch); });
  mark('world'); return true; }
async function factionAI(rep,instruction){ const F=factions(), M=monsterNames();
  const r=await aiJSON(factionAIPrompt({F,instruction,M}),rep,'complex');
  if(!r) return false; const S=(v,n)=>String(v||'').trim().slice(0,n||300);
  (Array.isArray(r.factions)?r.factions:[]).slice(0,8).forEach(x=>{ const name=S(x.name,30); if(!name) return; let f=facSlot(name); if(!f){ f={name,desc:''}; F.push(f); }
    if(FKIND[x.kind]) f.kind=x.kind; [...F_FIELDS,...M_FIELDS].forEach(([k])=>{ const v=S(x[k]); if(v&&(!f[k]||String(f[k]).length<v.length||instruction)) f[k]=v; });
    if(x.rel&&typeof x.rel==='object') Object.entries(x.rel).forEach(([k,v])=>{ if(k!==name&&facByName(k)) f.rel[k]=S(v,40); });
    if(Array.isArray(x.stance)) x.stance.forEach(s=>{ const ch=Math.max(1,Math.round(+s.ch||0)); if(ch&&FSTANCE[s.s]&&!f.stance.some(y=>+y.ch===ch)) f.stance.push({ch,s:s.s,why:S(s.why,80)}); }); });
  (Array.isArray(r.bestiary)?r.bestiary:[]).forEach(x=>{ const l=M.find(y=>y.name===S(x.name,40)); if(!l) return; ['desc','nature','weak'].forEach(k=>{ const v=S(x[k],200); if(v&&!l[k]) l[k]=v; }); const fn=S(x.faction,30); if(fn&&facByName(fn)) l.faction=fn; mark('l:'+l.id); });
  mark('world'); return true; }
// 장 생성이 돌려준 관계 변화 반영: [{faction,s,why}] → 그 장부터
function stanceApply(arr,ch){ (Array.isArray(arr)?arr:[]).forEach(x=>{ const f=facSlot(String(x&&x.faction||'').trim()); if(f&&FSTANCE[x.s]&&stanceAt(f,ch)!==x.s){ f.stance=f.stance.filter(y=>+y.ch!==ch); f.stance.push({ch,s:x.s,why:String(x.why||'').slice(0,80)}); mark('world'); } }); }
// 몬스터를 캐릭터에서 빼기(뽑기·톡·일정·인연에서 제외, 적으로 등록)
function charToMonster(c){ c.monster=true; c.limited=true; if(!G.lib.some(l=>l.kind==='enemy'&&l.name===c.name)) G.lib.push({id:'l'+uid(),kind:'enemy',name:c.name,prompt:String(c.naiPrompt||''),img:null,desc:String(c.profile||'').slice(0,200)}); mark('c:'+c.id); }
function monsterFromGen(x){ const name=String(x.name||'').trim(); if(!name||G.lib.some(l=>l.kind==='enemy'&&l.name===name)) return; G.lib.push({id:'l'+uid(),kind:'enemy',name,prompt:String(x.naiPrompt||x.look||''),img:null,desc:String(x.profile||x.desc||'').slice(0,200),faction:String(x.faction||'')}); }
// 메인 스토리에서 처음 말하는 스테이지 {k: 장 순서(0부터), s}
function firstSpeak(c){ const re=new RegExp('(^|\\n)'+String(c.name).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(\\s*\\[[^\\]]*\\])?\\s*[:：]'), M=G.chapters.filter(ch=>ch.kind==='main'); for(let k=0;k<M.length;k++) for(const s of M[k].stages||[]) if(re.test((s.pre||'')+'\n'+(s.post||''))) return {k,s}; return null; }
/* 생성기 연계(새 게임·장·이벤트 생성) */
// 생성된 대원의 소속 이름이 세계관 세력 이름과 조금 다르면(띄어쓰기·줄임) 그 세력 이름으로 — 없는 세력이면 그대로(factions()가 플레이어블로 추가)
function factionMatch(F,name){ const k=x=>String(x||'').replace(/\s+/g,''), n=k(name); if(!n) return name; const hit=(F||[]).find(f=>k(f.name)===n)||(F||[]).find(f=>n.length>=2&&(k(f.name).includes(n)||n.includes(k(f.name)))); return hit?hit.name:name; }
function factionClean(list){ const S=(v,n)=>String(v||'').trim().slice(0,n||300); return (Array.isArray(list)?list:[]).slice(0,8).map(x=>({name:S(x&&x.name,30),kind:FKIND[x&&x.kind]?x.kind:'neutral',desc:S(x&&x.desc,400),goal:S(x&&x.goal),leader:S(x&&x.leader,80),base:S(x&&x.base,80),ideology:S(x&&x.ideology),secret:S(x&&x.secret),origin:S(x&&x.origin),nature:S(x&&x.nature),weakness:S(x&&x.weakness),
  rel:Object.fromEntries(Object.entries((x&&x.rel&&typeof x.rel==='object')?x.rel:{}).slice(0,8).map(([k,v])=>[S(k,30),S(v,60)])),stance:(Array.isArray(x&&x.stance)?x.stance:[]).filter(s=>s&&FSTANCE[s.s]).map(s=>({ch:Math.max(1,Math.round(+s.ch||1)),s:s.s,why:S(s.why,80)}))})).filter(f=>f.name); }
// 생성 결과의 적 도감 → 자료실 적에 반영(g: 새 게임 생성 중이면 그 게임)
function bestiaryApply(arr,g){ g=g||G; let n=0; g.meta.bestiary=g.meta.bestiary||{}; (Array.isArray(arr)?arr:[]).forEach(x=>{ const name=String(x&&x.name||'').trim(); if(!name||(g.chars||[]).some(c=>c.name===name)) return; const info={}; ['desc','nature','weak'].forEach(k=>{ const v=String(x[k]||'').trim().slice(0,200); if(v) info[k]=v; }); const fn=String(x.faction||'').trim(); if(fn&&(g.world.factions||[]).some(f=>f.name===fn)) info.faction=fn; if(!Object.keys(info).length) return; g.meta.bestiary[name]=info; n++;
  const l=(g.lib||[]).find(y=>y.kind==='enemy'&&y.name===name&&!y.charId); if(l){ Object.keys(info).forEach(k=>{ if(!l[k]) l[k]=info[k]; }); if(g===G) mark('l:'+l.id); } }); if(n&&g===G) mark('meta'); return n; } // 적이 아직 자료실에 없으면 syncEnemies(0070)가 만들 때 채워요
// 2장 이후 첫 등장(debutLater) 캐릭터가 새 장 대본에서 처음 말하면 그 스테이지를 첫 등장으로
function debutResolve(ch){ let n=0; G.chars.filter(c=>c.debutLater).forEach(c=>{ const re=new RegExp('(^|\\n)'+String(c.name).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(\\s*\\[[^\\]]*\\])?\\s*[:：]'); const s=(ch.stages||[]).find(s=>re.test((s.pre||'')+'\n'+(s.post||''))); if(s){ c.debut=s.id; delete c.debutLater; mark('c:'+c.id); n++; } }); return n; }
/* src/main/0300-world/0450-relations-memory.js에서 옮김 */
function RELS(){ return gameRead('rels'); } // 읽기 — 바꿀 때는 아래 관계 함수(relPut·relKeep)
/* 관계 기록 바꾸기(Model — 관계 칸 G.rels는 이 모듈만 씀): 넣기 · 조건에 맞는 것만 남기기 */
function relPut(r){ gameSlot('rels').push(r); return r; }
function relKeep(keep){ G.rels=RELS().filter(keep); }
/* 스토리 삭제 때 관계 정리(storyPurge가 부름 — L: storyLinks, pick: 지울 갈래): 그 스토리에서 생긴 관계와 남은 관계의 그 스토리 기록, 지운 인물의 관계를 빼고 청소(relGC) */
function relPurgeStory(L,pick){ if(pick.rels){ const gone=new Set(L.rels.filter(L.born).map(r=>r.id)); relKeep(r=>!gone.has(r.id)); RELS().forEach(r=>{ if(r.hist) r.hist=r.hist.filter(h=>!L.src.includes(h.src)); }); mark('meta'); }
  if(pick.chars){ const cs=new Set(L.chars.map(c=>c.id)); relKeep(r=>!cs.has(r.a)&&!cs.has(r.b)); mark('meta'); } relGC(); }
function relRef(name){ let n=String(name||'').trim().replace(/^\{|\}$/g,'').replace(/\s*\(.*?플레이어.*?\)$/,''); if(!n) return '';
  const pn=String(P().player||'').trim(); if(n===T('player')||n==='플레이어'||n==='주인공'||n==='나'||(pn&&n===pn&&!G.chars.some(c=>c.name===n))) return REL_ME;
  const c=findSpeaker(n); if(c) return baseChar(c).id; const m=npcBy(n); if(m) return m.id;
  const loose=G.chars.find(c=>n.length>=2&&(c.name.startsWith(n)||n.startsWith(c.name)))||(G.npcs||[]).find(c=>n.length>=2&&(c.name.startsWith(n)||n.startsWith(c.name))); if(loose) return baseChar(loose).id;
  return 'x:'+n.slice(0,20); }
function relObj(ref){ if(!ref||ref===REL_ME||ref.startsWith('x:')) return null; return charById(ref)||(G.npcs||[]).find(n=>n.id===ref)||null; }
function relName(ref,ui){ if(ref===REL_ME) return ui?'나 ('+T('player')+')':T('player')+'(플레이어)'; if(ref.startsWith('x:')) return ref.slice(2); const o=relObj(ref); return o?o.name:'(지워진 인물)'; }
function relKeys(){ const out=[]; const add=(ref,o)=>{ const k=[o.name]; const f=String(o.name).split(/[\s(]/)[0]; if(f&&f.length>=2&&f!==o.name) k.push(f); out.push([ref,k]); };
  G.chars.forEach(c=>add(baseChar(c).id,c)); (G.npcs||[]).forEach(n=>add(n.id,n)); RELS().forEach(r=>[r.a,r.b].forEach(x=>{ if(x.startsWith('x:')&&!out.some(o=>o[0]===x)) out.push([x,[x.slice(2)]]); })); return out; }
function relPair(a,b){ return RELS().find(r=>(r.a===a&&r.b===b)||(r.a===b&&r.b===a)); }
function relOf(ref){ return RELS().filter(r=>r.a===ref||r.b===ref); }
function relOther(r,ref){ return r.a===ref?r.b:r.a; }
// AI가 돌려준 관계 변화를 합쳐요: [{a,b,kind,note,event}]
// IF·외전 로어 범위: ''(정사·로어북에 반영) | 'if'(로어북에 반영 안 함) | 이격 id(그 이격의 기록에만 남겨요)
function loreOf(x){ const l=x&&x.lore; return l==='if'?'if':(l&&charById(l)?l:''); }
function loreMap(a,b,lore){ if(!lore) return [a,b]; if(lore==='if') return null; const al=charById(lore), base=al?baseChar(al).id:''; if(a===base) a=lore; if(b===base) b=lore; return (a===lore||b===lore)&&a!==b?[a,b]:null; }
function loreLabel(l){ return l==='if'?'IF 스토리':(l&&charById(l)?'이격 「'+charById(l).name+'」 전용':''); }
function loreOpts(cur){ return [['','정사 — 관계·기억(로어북)에 반영'],['if','IF 스토리 — 로어북에 반영 안 함'],...G.chars.filter(c=>c.alt&&charById(c.alt)).map(c=>[c.id,'이격 「'+c.name+'」의 기록에만 반영'])]; }
function relApply(arr,src,quiet,lore){ let n=0; if(lore==='if') return 0; (Array.isArray(arr)?arr:[]).slice(0,40).forEach(x=>{ if(!x) return; let a=relRef(x.a), b=relRef(x.b); if(!a||!b||a===b) return; const m=loreMap(a,b,lore); if(!m) return; [a,b]=m;
    let r=relPair(a,b); const kind=String(x.kind||'').trim().slice(0,16), note=String(x.note||'').trim().slice(0,800), ev=String(x.event||'').trim().slice(0,400);
    if(!r){ r={id:'r'+uid(),a,b,kind:kind||'아는 사이',note,hist:[],src:String(src||'')}; relPut(r); } else { if(kind) r.kind=kind; if(note) r.note=note; if(kind||note) r.sys=false; } relNames(r);
    if(ev) { r.hist=(r.hist||[]).concat([{src:String(src||''),text:ev,at:Date.now()}]).slice(-30); } r.at=Date.now(); n++; });
  if(n&&!quiet) mark('meta'); return n; }
function relLine(r){ const last=(r.hist||[]).slice(-4).map(h=>(h.src?h.src+': ':'')+h.text).join(' / '); return `- ${relName(r.a)} ↔ ${relName(r.b)}: [${r.kind||'아는 사이'}] ${r.note||''}${last?' (최근: '+last+')':''}`; }
// 장별 요약(스토리 기억)
/* 시스템이 맡는 기록: 대본·설정을 읽어 관계와 요약을 채워요(AI 호출 없이) */
function stageCast(s,withMe){ const set=new Set(); parseScript((s.pre||'')+'\n'+(s.post||'')).forEach(L=>{ if(L.type!=='say'||isMe(L.who)) return; const r=relRef(L.who); if(r&&!r.startsWith('x:')) set.add(r); }); if(withMe&&set.size) set.add(REL_ME); return set; }
function relNew(a,b,kind,note,src,quiet,stage){ if(!a||!b||a===b||relPair(a,b)) return 0; relPut(relNames({id:'r'+uid(),a,b,kind,note:(src&&note?src+': ':'')+note,hist:[],sys:true,at:Date.now(),stage:stage||''})); if(!quiet) mark('meta'); return 1; }
// 관계에 두 사람 이름도 적어 둬요: 나중에 id가 바뀌어도(리롤·가져오기) 이름으로 다시 이어 붙일 수 있게
function relNames(r){ [['a','an'],['b','bn']].forEach(([k,n])=>{ const o=relObj(r[k]); if(o) r[n]=o.name; }); return r; }
// 같은 스테이지에 함께 나온 두 사람은 '아는 사이'(플레이어와는 '함께한 사이')로 처음 한 번 기록해요
function relFromScripts(ch,src,quiet){ if(!ch||ch.relScan) return 0; let n=0; src=src||ch.title; const lore=loreOf(ch);
  if(lore!=='if') (ch.stages||[]).forEach(s=>{ const cast=[...stageCast(s,true)]; for(let i=0;i<cast.length;i++) for(let j=i+1;j<cast.length;j++){ const me=cast[i]===REL_ME||cast[j]===REL_ME, m=loreMap(cast[i],cast[j],lore); if(!m) continue; n+=relNew(m[0],m[1],me?'함께한 사이':'아는 사이',`「${s.title}」에서 함께 있었다`,src,true,s.id); } });
  ch.relScan=true; if(!quiet){ if(n) mark('meta'); mark('ch:'+ch.id); } return n; }
// 인물 설정(프로필·과거)에 다른 인물의 이름이 나오면 그 문장을 관계로 기록해요
function relFromProfiles(quiet){ let n=0; const who=[...G.chars.filter(c=>!c.alt),...(G.npcs||[])];
  who.forEach(a=>{ const txt=String(a.profile||''); if(!txt) return; who.forEach(b=>{ if(a===b||String(b.name).length<2||!txt.includes(b.name)) return; const sen=(txt.split(/(?<=[.!?。])\s*/).find(x=>x.includes(b.name))||'').slice(0,160); n+=relNew(baseChar(a).id||a.id,baseChar(b).id||b.id,'아는 사이',sen,'설정',true); }); });
  if(n&&!quiet) mark('meta'); return n; }
function memCatchUp(){ relGC(); if(!G.meta.relProf){ relFromProfiles(); G.meta.relProf=1; mark('meta'); } G.chapters.forEach(ch=>relFromScripts(ch,ch.kind==='event'?'외전 「'+ch.title+'」':ch.title)); }
// 관계 청소: 없어진 인물·스테이지에서 생긴 자동 기록, 내용이 다 지워진 빈 기록을 지워요
function relGC(){ const ok=x=>x===REL_ME||x.startsWith('x:')||!!relObj(x); let fixd=0;
  RELS().forEach(r=>{ [['a','an'],['b','bn']].forEach(([k,n])=>{ if(ok(r[k])||!r[n]) return; const c=findSpeaker(r[n])||npcBy(r[n]); if(c){ r[k]=baseChar(c).id||c.id; fixd++; } }); if(!r.an||!r.bn) relNames(r); });
  if(fixd){ const seen=new Map(); relKeep(r=>{ if(r.a===r.b) return false; const k=[r.a,r.b].sort().join('|'); if(seen.has(k)){ const o=seen.get(k); o.hist=[...(o.hist||[]),...(r.hist||[])].slice(-12); return false; } seen.set(k,r); return true; }); mark('meta'); }
  const n0=RELS().length;
  relKeep(r=>ok(r.a)&&ok(r.b)&&!(r.stage&&!stageById(r.stage))&&!(!r.sys&&!r.note&&!(r.hist||[]).length&&r.src)); if(RELS().length!==n0) mark('meta'); return n0-RELS().length; }
