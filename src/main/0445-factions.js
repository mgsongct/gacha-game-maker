/* ===== 세력 설계 · 몬스터 도감 · 등장/영입(캐스팅) 관리 ===== */
/* 1) 세력 G.world.factions[]: {name,desc,kind,goal,leader,base,ideology,secret,origin,nature,weakness,rel:{세력:관계},stance:[{ch,s,why}]}
      kind: playable(플레이어블 소속) | hostile(적대 세력) | neutral(중립) | monster(괴물·마물 무리)
      stance: 플레이어와의 관계가 장마다 바뀜(ally·neutral·hostile). 예: 1~3장 적대 → 4장부터 동맹. 장 생성 때 AI가 바꿀 수 있음
   2) 몬스터 도감: 자료실 적(kind 'enemy', 캐릭터가 아닌 것)마다 faction·desc(정체)·nature(습성)·weak(약점)
      몬스터는 메신저·일정·인연 같은 커뮤 대상이 아님 → 새 캐릭터·NPC로 만들어지지 않게 막고(isMonsterLike), 예전 데이터는 점검
   3) 등장·영입: c.debut(첫 등장 스테이지)를 깨기 전에는 상시·픽업 뽑기·건조에 안 나옴, 소속 세력이 지금 적대면 잠금(설정).
      AI에는 "보유했지만 스토리에서 아직 안 만남 → 이미 계약해 함께 작전 중인 동료"를 알려 첫 만남처럼 쓰지 않게 함
   문서: docs/research/factions-cast.md */
const FKIND={playable:'플레이어블 소속',hostile:'적대 세력',neutral:'중립',monster:'괴물·마물'}, FSTANCE={ally:'우호',neutral:'중립',hostile:'적대'};
const F_FIELDS=[['desc','개요'],['goal','목적'],['leader','지도자·핵심 인물'],['base','거점·영역'],['ideology','이념·규칙'],['secret','숨겨진 사실(작가용)']], M_FIELDS=[['origin','정체·기원'],['nature','습성·행동'],['weakness','약점']];
function castCfg(){ const c=G.meta.cast||{}; return {pickupGate:c.pickupGate!==false,hostileGate:c.hostileGate!==false}; }
function factions(){ const w=G.world; if(!Array.isArray(w.factions)) w.factions=[]; G.chars.forEach(c=>{ if(c.faction&&!c.monster&&!c.collab&&!w.factions.some(f=>f.name===c.faction)) w.factions.push({name:c.faction,desc:'',kind:'playable',rel:{},stance:[]}); }); /* 캐릭터 소속인데 목록에 없는 세력 */ w.factions.forEach(f=>{ if(!FKIND[f.kind]) f.kind=G.chars.some(c=>c.faction===f.name&&!c.monster)?'playable':G.lib.some(l=>l.kind==='enemy'&&!l.charId&&l.name.includes(f.name))?'monster':'neutral'; if(!Array.isArray(f.stance)) f.stance=[]; if(!f.rel||typeof f.rel!=='object') f.rel={}; }); return w.factions; }
function facByName(n){ return factions().find(f=>f.name===n); }
function mainNow(){ const main=G.chapters.filter(ch=>ch.kind==='main'), i=main.findIndex(ch=>(ch.stages||[]).some(s=>!P().cleared[s.id])); return i<0?main.length+1:i+1; } // 지금 진행 중인 장(1부터) = 다 깨지 않은 첫 메인 장(예전엔 스테이지 하나만 깨도 다음 장으로 셈)
function stanceAt(f,ch){ if(!f) return 'neutral'; const L=(f.stance||[]).filter(x=>+x.ch<=ch).sort((a,b)=>a.ch-b.ch); return L.length?L.at(-1).s:f.kind==='playable'?'ally':f.kind==='neutral'?'neutral':'hostile'; }
// 몬스터: 자료실 적 중 캐릭터·NPC가 아닌 것
const SYS_ENEMY=/^(훈련 |강화 표적|탑의 )/; // 훈련·탑의 표적은 시스템 적
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
  (Array.isArray(r.stance)?r.stance:[]).forEach(x=>{ const f=facByName(String(x&&x.faction||'').trim()), ch=Math.max(1,Math.min(main.length,Math.round(+(x&&x.ch)||1))); if(!f||f.kind==='monster'||!FSTANCE[x.s]) return; f.stance=(f.stance||[]).filter(y=>+y.ch!==ch); f.stance.push({ch,s:x.s,why:String(x.why||'').slice(0,80)}); });
  F.forEach(f=>{ if(!Array.isArray(f.stance)) f.stance=[]; if(!f.stance.length) f.stance.push({ch:1,s:stanceAt(f,1),why:''}); f.stance.sort((a,b)=>a.ch-b.ch); });
  mark('world'); return true; }
async function factionAI(rep,instruction){ const F=factions(), M=monsterNames();
  const r=await aiJSON(factionAIPrompt({F,instruction,M}),rep,'complex');
  if(!r) return false; const S=(v,n)=>String(v||'').trim().slice(0,n||300);
  (Array.isArray(r.factions)?r.factions:[]).slice(0,8).forEach(x=>{ const name=S(x.name,30); if(!name) return; let f=facByName(name); if(!f){ f={name,desc:''}; F.push(f); }
    if(FKIND[x.kind]) f.kind=x.kind; [...F_FIELDS,...M_FIELDS].forEach(([k])=>{ const v=S(x[k]); if(v&&(!f[k]||String(f[k]).length<v.length||instruction)) f[k]=v; });
    if(x.rel&&typeof x.rel==='object') Object.entries(x.rel).forEach(([k,v])=>{ if(k!==name&&facByName(k)) f.rel[k]=S(v,40); });
    if(Array.isArray(x.stance)) x.stance.forEach(s=>{ const ch=Math.max(1,Math.round(+s.ch||0)); if(ch&&FSTANCE[s.s]&&!f.stance.some(y=>+y.ch===ch)) f.stance.push({ch,s:s.s,why:S(s.why,80)}); }); });
  (Array.isArray(r.bestiary)?r.bestiary:[]).forEach(x=>{ const l=M.find(y=>y.name===S(x.name,40)); if(!l) return; ['desc','nature','weak'].forEach(k=>{ const v=S(x[k],200); if(v&&!l[k]) l[k]=v; }); const fn=S(x.faction,30); if(fn&&facByName(fn)) l.faction=fn; mark('l:'+l.id); });
  mark('world'); return true; }
// 장 생성이 돌려준 관계 변화 반영: [{faction,s,why}] → 그 장부터
function stanceApply(arr,ch){ (Array.isArray(arr)?arr:[]).forEach(x=>{ const f=facByName(String(x&&x.faction||'').trim()); if(f&&FSTANCE[x.s]&&stanceAt(f,ch)!==x.s){ f.stance=f.stance.filter(y=>+y.ch!==ch); f.stance.push({ch,s:x.s,why:String(x.why||'').slice(0,80)}); mark('world'); } }); }
// 몬스터를 캐릭터에서 빼기(뽑기·톡·일정·인연에서 제외, 적으로 등록)
function charToMonster(c){ c.monster=true; c.limited=true; if(!G.lib.some(l=>l.kind==='enemy'&&l.name===c.name)) G.lib.push({id:'l'+uid(),kind:'enemy',name:c.name,prompt:String(c.naiPrompt||''),img:null,desc:String(c.profile||'').slice(0,200)}); mark('c:'+c.id); }

/* 화면 */
let FW_TAB='fac';
function factionPanel(){ const r=factionReview(); return `<div class="panel pm-hide"><h3>세력·몬스터·등장 관리 <span class="badge">${r.score}점</span></h3><p class="muted" style="margin:0 0 6px">세력 ${factions().length}개 · 몬스터 ${monsterNames().length}종 · 점검 ${r.issues.length}건. 세력의 종류·목적·관계와 장마다 바뀌는 적대/우호, 몬스터의 정체, ${T('crew')}의 첫 등장·${T('gacha')} 잠금을 관리해요.</p><button class="btn sm" data-act="fwopen">세력·몬스터·등장 관리</button></div>`; }
function openWorldDesign(tab){ if(tab) FW_TAB=tab; const F=factions(), now=mainNow(), rv=factionReview(), t=(k,v,ph)=>`<input class="in" data-fw="${k}" value="${esc(v??'')}" placeholder="${esc(ph||'')}">`, ta=(k,v,ph)=>`<textarea class="in" rows="2" data-fw="${k}" placeholder="${esc(ph||'')}">${esc(v||'')}</textarea>`;
  const tabs=[['fac','세력'],['mon','적·몬스터 도감'],['cast','등장·영입']]; let body='';
  if(FW_TAB==='fac') body=F.map((f,i)=>`<details class="panel" style="padding:8px;margin:6px 0"><summary><b>${esc(f.name)}</b> <span class="muted">${FKIND[f.kind]} · 지금 ${FSTANCE[stanceAt(f,now)]}</span></summary>
    <div class="g2"><div><label class="f">종류</label><select class="in" data-fw="f.${i}.kind">${opt(Object.entries(FKIND),f.kind)}</select></div><div><label class="f">이름</label>${t(`f.${i}.name`,f.name)}</div></div>
    ${F_FIELDS.map(([k,l])=>`<label class="f">${l}</label>${k==='desc'||k==='secret'?ta(`f.${i}.${k}`,f[k]):t(`f.${i}.${k}`,f[k])}`).join('')}
    ${f.kind==='monster'?M_FIELDS.map(([k,l])=>`<label class="f">${l}</label>${t(`f.${i}.${k}`,f[k])}`).join(''):''}
    <label class="f">다른 세력과의 관계 (세력 | 관계, 줄마다)</label>${ta(`f.${i}.rel`,Object.entries(f.rel).map(([k,v])=>k+' | '+v).join('\n'))}
    <label class="f">플레이어와의 관계 변화 (장 | ally·neutral·hostile | 이유, 줄마다 · 비우면 종류대로)</label>${ta(`f.${i}.stance`,f.stance.map(s=>`${s.ch} | ${s.s} | ${s.why||''}`).join('\n'),'예: 1 | hostile | 처음엔 적\n4 | ally | 진실을 알고 손잡음')}
    <div class="muted" style="font-size:.78rem">소속: ${esc(G.chars.filter(c=>c.faction===f.name).map(c=>c.name).join(', ')||'없음')}${monsterNames().filter(l=>enemyFaction(l)===f.name).length?' · 몬스터: '+esc(monsterNames().filter(l=>enemyFaction(l)===f.name).map(l=>l.name).join(', ')):''}</div></details>`).join('')+`<button class="btn sm ghost" data-act="fwadd">+ 세력</button>`;
  else if(FW_TAB==='mon'){ const M=monsterNames(); body=`<p class="muted" style="font-size:.82rem">캐릭터가 아닌 적(몬스터·적 병력)이에요. 정체·습성·약점을 정하면 스토리·도감에 쓰이고, AI가 몬스터를 동료·NPC·메신저 상대로 만들지 않아요.</p>${M.map((l,i)=>`<div class="panel" style="padding:8px;margin:6px 0"><b>${esc(l.name)}</b> <select class="in" data-fw="m.${l.id}.faction" style="max-width:150px;display:inline-block"><option value="">무리 없음</option>${F.map(f=>`<option ${enemyFaction(l)===f.name?'selected':''}>${esc(f.name)}</option>`).join('')}</select>${t(`m.${l.id}.desc`,l.desc,'정체 (무엇인가)')}${t(`m.${l.id}.nature`,l.nature,'습성·행동')}${t(`m.${l.id}.weak`,l.weak,'약점')}</div>`).join('')||'<p class="muted">적이 없어요</p>'}`; }
  else { const L=G.chars.filter(c=>!c.alt&&!c.npc), stg=G.chapters.flatMap(ch=>(ch.stages||[]).map(s=>[s.id,`${ch.kind==='main'?stageCode(s.id):ch.title} ${s.title}`]));
    body=`<label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-fw="cast.pickupGate" ${castCfg().pickupGate?'checked':''}>픽업 배너도 첫 등장 스테이지를 깨기 전엔 잠금</label><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-fw="cast.hostileGate" ${castCfg().hostileGate?'checked':''}>소속 세력이 지금 적대면 ${T('gacha')}·건조에서 잠금</label>
    <p class="muted" style="font-size:.8rem">첫 등장을 정하면 그 스테이지를 깨기 전까지 ${T('gacha')}에 안 나오고, 스토리에서 처음 만나는 장면이 돼요. "처음부터"인 ${T('crew')}는 뽑아서 합류하면 AI가 이미 함께 작전 중인 동료로 다뤄요.</p>
    ${L.map(c=>{ const lk=castLock(c); return `<div class="ep"><span class="t"><b>${esc(c.name)}${c.monster?' (몬스터)':''}</b><span class="muted">${esc(c.faction||'무소속')} · ${own(c.id)?'보유':'미보유'} · ${metInStory(c)?'스토리에서 만남':'아직 안 만남'}${lk?' · 🔒 '+esc(lk):''}</span></span><select class="in" data-fw="c.${c.id}.debut" style="max-width:170px"><option value="">처음부터</option>${stg.map(([id,l])=>`<option value="${id}" ${c.debut===id?'selected':''}>${esc(l)}</option>`).join('')}</select>${!c.monster&&isMonsterLike(c)?`<button class="btn sm ghost" data-act="fwmon" data-id="${c.id}">몬스터로 전환</button>`:''}</div>`; }).join('')}`; }
  openModal(`${head('세력·몬스터·등장 관리',`<span class="muted">점수 ${rv.score}</span>`)}${rv.issues.length?`<div class="panel" style="border-color:var(--gold)"><b>점검</b><ul style="margin:4px 0;padding-left:18px;font-size:.8rem">${rv.issues.map(x=>`<li>${esc(x.msg)}</li>`).join('')}</ul></div>`:''}
  <div class="row" style="gap:4px;margin:6px 0">${tabs.map(([k,l])=>`<button class="btn sm ${FW_TAB===k?'':'ghost'}" data-act="fwtab" data-k="${k}">${l}</button>`).join('')}</div>${body}
  <label class="f" style="margin-top:8px">AI 추가 지시 (선택)</label><input class="in" id="fw_ins" placeholder="예: 헬릭스는 3장 이후 내분으로 일부가 우리 편이 된다">
  <div class="row" style="margin-top:10px;gap:6px;flex-wrap:wrap"><button class="btn" data-act="fwsave">저장</button><button class="btn ghost" data-act="fwai">AI로 깊이 채우기</button><button class="btn ghost" data-act="close">닫기</button></div>`); }
function fwRead(){ const F=factions(), lines=v=>String(v||'').split('\n').map(l=>l.split('|').map(s=>s.trim())).filter(x=>x[0]);
  document.querySelectorAll('#modal [data-fw]').forEach(el=>{ const k=el.dataset.fw.split('.'), v=el.type==='checkbox'?el.checked:el.value;
    if(k[0]==='cast'){ G.meta.cast=Object.assign({},G.meta.cast,{[k[1]]:v}); return; }
    if(k[0]==='m'){ const l=G.lib.find(x=>x.id===k[1]); if(l){ l[k[2]]=String(v).trim(); mark('l:'+l.id); } return; }
    if(k[0]==='c'){ const c=charById(k[1]); if(c&&(c.debut||'')!==v){ if(v) c.debut=v; else delete c.debut; mark('c:'+c.id); } return; }
    const f=F[+k[1]]; if(!f) return;
    if(k[2]==='rel'){ f.rel={}; lines(v).forEach(([a,b])=>{ if(a&&a!==f.name) f.rel[a]=b||''; }); }
    else if(k[2]==='stance'){ f.stance=lines(v).map(([ch,s,why])=>({ch:Math.max(1,+ch||1),s:FSTANCE[s]?s:'neutral',why:why||''})); }
    else if(k[2]==='name'){ const n=String(v).trim(); if(n&&n!==f.name){ const old=f.name; G.chars.forEach(c=>{ if(c.faction===old){ c.faction=n; mark('c:'+c.id); } }); F.forEach(o=>{ if(o.rel[old]!=null){ o.rel[n]=o.rel[old]; delete o.rel[old]; } }); f.name=n; } }
    else f[k[2]]=String(v).trim(); }); mark('world','meta'); }
document.addEventListener('click',async e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act;
  if(a==='fwopen') openWorldDesign();
  else if(a==='fwtab'){ fwRead(); openWorldDesign(el.dataset.k); }
  else if(a==='fwsave'){ fwRead(); toast('세력·등장 설정을 저장했어요'); openWorldDesign(); }
  else if(a==='fwadd'){ fwRead(); factions().push({name:'새 세력 '+(factions().length+1),desc:'',kind:'neutral',rel:{},stance:[]}); openWorldDesign('fac'); }
  else if(a==='fwmon'){ const c=charById(el.dataset.id); if(c&&(await appConfirm(`「${c.name}」을(를) 몬스터(적)로 바꿀까요? ${T('gacha')}·톡·일정·인연에서 빠져요.`))){ charToMonster(c); toast('몬스터로 바꿨어요'); openWorldDesign('cast'); } }
  else if(a==='fwai'){ if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; } fwRead(); if(await factionAI(uiProg(el),($('#fw_ins')||{}).value||'')){ toast('세력·몬스터 설정을 채웠어요'); openWorldDesign(); } } });
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
