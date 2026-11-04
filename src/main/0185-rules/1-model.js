/* ===== 0185-rules — Model(상태·규칙·저장·외부 서비스) ===== */
/* src/main/0185-rules/0185-game-rules.js에서 옮김 */
/* G.meta.elems = [{n,c,d}] 2~8개 · G.meta.positions = [{id,name,base,desc,t:{…}}] · G.meta.rules = 나머지(비우면 기본값)
   rules: beats{속성:이기는 속성} · elemAdv/elemDis(기본 배율) · grid{A:{B:배율}}(상성표 덮어쓰기) · reactions[{a,b,name,type,value,dur,both}] · aura(초)
          roleDesc · roleBase · rarityMul · synergy{n,atk,def} · rel[{by:faction|role|elem|pos,a,b,mul}]
   applyMeta() → rulesApply()로 BEATS·GGMCombat 표에 반영, v2Options() → rulesOptions()로 전투·밸런스 검사(워커 포함)에 넘겨요.
   포지션: 전투 엔진의 기본형(base: atk·def·sup)을 하나 고르고, 그 위에 기능(t)을 얹어요. 캐릭터는 c.pos(포지션 id)와 c.role(=base)
   문서: docs/research/game-rules.md */
function RULESM(){ return gameRead('meta.rules'); } // 읽기 — 바꿀 때는 gameSlot('meta.rules')
// 생성된 반응 정리: 값의 뜻은 종류마다 다름(REACT_TYPES — amp 배율·burst 공격력×값·stun 초·vuln 받는 피해 +%). vuln 값이 배율처럼 보이면(5 미만, 예 1.3) 백분율로(30)
function reactClean(x){ const type=['amp','burst','stun','vuln'].includes(x.type)?x.type:'amp'; let value=+x.value||''; if(type==='vuln'&&value&&value<5) value=Math.round((value>1?value-1:value)*100);
  return {a:x.a,b:x.b,name:String(x.name||'반응').slice(0,12),type,value}; }
function posDefaults(){ return Object.keys(ROLE).map(k=>({id:'p_'+k,name:ROLE[k],base:k,desc:'',t:{}})); }
function POSITIONS(){ const L=G.meta.positions; return Array.isArray(L)&&L.length?L:posDefaults(); }
function posById(id){ return POSITIONS().find(p=>p.id===id); }
// 캐릭터 포지션 정하기: 이름이나 id가 맞으면 그 포지션(역할=기본형), 아니면 역할과 기본형이 같은 첫 포지션
function posAssign(c,want){ const P=POSITIONS(), p=P.find(x=>x.id===want||x.name===want)||P.find(x=>x.base===c.role)||P[0]; if(p){ c.pos=p.id; c.role=p.base; } return c; }
function posOf(c){ return posById(c&&c.pos)||POSITIONS().find(p=>p.base===(c&&c.role))||POSITIONS()[0]; }
function rulesBeats(){ const r=RULESM(), E=G.meta.elems.map(e=>e.n);
  if(r.beats&&typeof r.beats==='object'){ const o={}; E.forEach(n=>{ if(E.includes(r.beats[n])&&r.beats[n]!==n) o[n]=r.beats[n]; }); return o; }
  if(Array.isArray(r.beatIdx)&&r.beatIdx.length===E.length){ const o={}; E.forEach((n,i)=>{ const j=+r.beatIdx[i]; if(j>=0&&j<E.length&&j!==i) o[n]=E[j]; }); return o; } // 예전 저장(이번 버전 전)
  const o={}; E.forEach((n,i)=>{ o[n]=E[(i+1)%E.length]; }); return o; }
// 속성 이름이 바뀌면(게임 정의 편집 등) 이름으로 저장된 상성·상성표·반응·관계도 같이 바꿔요
function rulesRename(map){ const r=gameSlot('meta.rules'), f=n=>map[n]||n; if(r.beats){ const o={}; Object.entries(r.beats).forEach(([a,b])=>{ o[f(a)]=f(b); }); r.beats=o; }
  if(r.grid){ const g={}; Object.entries(r.grid).forEach(([a,row])=>{ g[f(a)]={}; Object.entries(row||{}).forEach(([b,v])=>{ g[f(a)][f(b)]=v; }); }); r.grid=g; }
  (r.reactions||[]).forEach(x=>{ x.a=f(x.a); x.b=f(x.b); }); (r.rel||[]).forEach(x=>{ if(x.by==='elem'){ x.a=f(x.a); x.b=f(x.b); } }); }
function rulesApply(){ const b=rulesBeats(); Object.keys(BEATS).forEach(k=>delete BEATS[k]); Object.assign(BEATS,b); GGMCombat.applyRules(RULESM()); }
function rulesElemMat(){ const r=RULESM(), E=G.meta.elems.map(e=>e.n), b=rulesBeats(), adv=+r.elemAdv||1.5, dis=+r.elemDis||.75, g=r.grid||{}, m={};
  E.forEach(a=>{ m[a]={}; E.forEach(t=>{ const o=g[a]&&g[a][t]; m[a][t]=+o>0?+o:b[a]===t?adv:b[t]===a?dis:1; }); }); return m; }
function rulesOptions(){ const r=G.meta.rules||{}, P={}, seen=new Set();
  POSITIONS().forEach(p=>{ const t=p.t||{}; if(Object.values(t).some(v=>+v)) P[p.id]=t; if(!seen.has(p.base)){ seen.add(p.base); if(P[p.id]) P['role:'+p.base]=t; } });
  return {formation:r.formation!==false,elemAdv:+r.elemAdv||1.5,elemDis:+r.elemDis||.75,elemMat:rulesElemMat(),reactions:Array.isArray(r.reactions)?r.reactions.filter(x=>x&&x.a&&x.b):[],aura:+r.aura||4,positions:P,synergy:r.synergy||null,rel:Array.isArray(r.rel)?r.rel:[],...(typeof balanceOptions==='function'?balanceOptions():{})}; } // 밸런스 AS 전투 보정(0187)
function posTraitText(t){ return POS_TRAITS.filter(([k])=>+(t||{})[k]).map(([k,l])=>`${l.replace(/ %p?$/,'')} ${+t[k]>0?'+':''}${+t[k]}${k==='sp'?'':l.endsWith('%p')?'%p':'%'}`).join(' · '); }
function rulesDraft(){ const r=RULESM(), D=GGMCombat.RULE_DEFAULTS, b=rulesBeats(), grid=r.grid||{};
  return {elems:G.meta.elems.map(e=>({n:e.n,c:e.c,d:e.d||'',orig:e.n,beat:b[e.n]||''})),grid:JSON.parse(JSON.stringify(grid)),adv:r.elemAdv??'',dis:r.elemDis??'',aura:r.aura??'',
   reactions:JSON.parse(JSON.stringify(r.reactions||[])),positions:JSON.parse(JSON.stringify(POSITIONS())),roleDesc:{...(r.roleDesc||{})},roleBase:JSON.parse(JSON.stringify(r.roleBase||{})),rarityMul:JSON.parse(JSON.stringify(r.rarityMul||{})),
   synergy:{n:'',atk:'',def:'',...(r.synergy||{})},rel:JSON.parse(JSON.stringify(r.rel||[])),D}; }
async function rulesAIData(rep){ const m=G.meta; return aiJSON(rulesAIDataPrompt({m}),rep,'quick'); }
async function rulesAIFill(){ const res=await rulesAIData(null); if(!res) return false; const r=gameSlot('meta.rules'); r.roleDesc=r.roleDesc||{};
  (res.elems||[]).forEach((d,i)=>{ if(d&&G.meta.elems[i]&&!G.meta.elems[i].d) G.meta.elems[i].d=String(d).slice(0,80); }); Object.entries(res.roles||{}).forEach(([k,d])=>{ if(d&&ROLE[k]&&!r.roleDesc[k]) r.roleDesc[k]=String(d).slice(0,80); }); mark('meta'); return true; }
function rulesMissingDesc(){ return G.meta.elems.some(e=>!e.d)||Object.keys(ROLE).some(k=>!((G.meta.rules||{}).roleDesc||{})[k]); }
function rulesNotInCodex(){ return !(G.world.codex||[]).some(x=>x.title==='[규칙] 속성 상성'); }
function posClean(list){ return (Array.isArray(list)?list:[]).slice(0,10).map(p=>({id:'p_'+uid(),name:String(p.name||'포지션').slice(0,10),base:ROLE[p.base]?p.base:'atk',desc:String(p.desc||'').slice(0,80),range:RANGE[p.range]?p.range:'',t:Object.fromEntries(POS_TRAITS.map(([k])=>[k,Math.max(-80,Math.min(150,Math.round(+((p.t||{})[k])||0)))]).filter(([,v])=>v))})).filter(p=>p.name); }
/* 쓸 만한 포지션 목록: 2개 이상이고 기본형(공격·방어·지원)이 다 있음 — 새 게임 생성(0250)과 포지션 자동 설계가 같이 씀 */
function posValid(L){ return L.length>=2&&['atk','def','sup'].every(k=>L.some(p=>p.base===k)); }
/* 포지션 자동 설계(점검 g_pos·실행 중 자동 채움): 포지션 없이 기본 3개로 돌던 예전 게임에 세계관에 맞춘 포지션을 만들어 저장하고 캐릭터를 고루 배정 */
async function posAI(){ const r=await aiJSON(rulesPosAIPrompt(),null,'default'), L=posClean(r&&r.positions); if(!posValid(L)) return false; G.meta.positions=L; posSpread(L); mark('meta'); return true; }
/* 기본형이 같은 포지션 중에서 고루 배정(포지션이 목록에 없는 캐릭터만) — 규칙 화면의 배정 버튼과 포지션 자동 설계(posAI)가 같이 씀. 배정한 수 */
function posSpread(P){ let n=0; G.chars.forEach(c=>{ if(P.some(p=>p.id===c.pos)) return; const cand=P.filter(p=>p.base===c.role); if(!cand.length) return; c.pos=cand[hashN(c.id)%cand.length].id; mark('c:'+c.id); n++; }); return n; }
/* src/main/0185-rules/0187-balance.js에서 옮김 */
/* 문제: ① 새 캐릭터는 지금 "출시 세대"로 만들어져 세대가 오를수록 스킬 예산이 커져요(1세대 ×1 → 5세대 ×2.1) → 오래된 캐릭터가 구식이 됨
         ② AI가 쓴 능력치는 범위만 맞춰서(체력 600~2000 등) 같은 희귀도끼리도 들쭉날쭉
   G.meta.balance: creep(manual|fixed|auto) baseGen per maxGen released · catchUp(off|boost|remaster) pct max lag · tol(허용 편차 %) autoNorm(생성 시 보정)
   문서: docs/research/balance.md */
function BAL(){ const d={creep:'manual',baseGen:1,per:5,maxGen:5,released:0,catchUp:'off',pct:8,max:30,lag:1,tol:15,autoNorm:true}; return Object.assign({},d,gameRead('meta.balance')); } // 읽기(기본값 위에 바꾼 값) — 바꿀 때는 gameSlot('meta.balance')
function balanceGeneration(){ const b=BAL(); if(b.creep==='fixed') return Math.max(1,Math.min(5,+b.baseGen||1)); if(b.creep==='auto') return Math.max(1,Math.min(+b.maxGen||5,(+b.baseGen||1)+Math.floor((+b.released||0)/Math.max(1,+b.per||5)))); return null; }
function balanceOptions(){ const b=BAL(); return b.catchUp==='boost'?{genBoost:{cur:v2CurrentGeneration(),pct:+b.pct||0,max:+b.max||0}}:{}; }
function balExpected(c){ return balPower(GGMCombat.generateBaseStats(c,()=>.5)); } // 희귀도·기본형 기준값(무작위 흔들림 없이)
function balDev(c){ const e=balExpected(c); return e?balPower(c)/e-1:0; }
function balInfo(c){ const b=BAL(), cur=v2CurrentGeneration(), gen=GGMCombat.generation(c), dev=balDev(c), skill=!c.skillBalance||c.skillBalance.ruleset!==GGMCombat.RULESET;
  return {c,dev,gen,cur,statOut:Math.abs(dev)*100>+b.tol,genLag:cur-gen>+b.lag,skill}; }
function balReport(){ return G.chars.filter(c=>!c.alt).map(balInfo); }
// 보수: 속도는 두고 체력·공격·방어를 같은 비율로 맞춰서 원래 성향(체력형·공격형)은 살려요. mode edge=허용 범위 끝까지만, center=기준값으로
function balNormalize(c,mode='edge'){ const e=balExpected(c), b=BAL(), tol=+b.tol/100*.97, /* 반올림 여유 */ now=balPower(c), target=mode==='center'?e:Math.min(e*(1+tol),Math.max(e*(1-tol),now)); const base=c.hp/5+c.atk*3+c.def*2; if(!base||Math.abs(target-now)<1) return false;
  const k=Math.max(.2,(target-c.spd)/base); c.hp=Math.max(10,Math.round(c.hp*k/10)*10); c.atk=Math.max(1,Math.round(c.atk*k)); c.def=Math.max(0,Math.round(c.def*k)); c.skillBalance=null; return true; }
// AS 리마스터: 세대를 현재 세대 - 허용 차이까지 올리고, 스킬 밸런스를 다시 검사하게 해요(전투 전에 자동으로 다시 맞춰짐)
function balRemaster(c){ const b=BAL(), cur=v2CurrentGeneration(), want=Math.max(GGMCombat.generation(c),cur-Math.max(0,+b.lag)); if(want===GGMCombat.generation(c)) return false; c.generation=want; c.skillBalance=null; return true; }
/* 구캐릭터 AS 리마스터(세대 맞추기·점검 c_genlag): 세대만 올리면 스킬 검사는 너무 강한 것만 약화해 예전 스킬이 새 세대에서도 그대로라,
   글 AI가 있으면 저장된 설계 의도(c.skillPlan)와 지금 스킬의 이름·효과를 지키며 새 세대 예산으로 스킬을 다시 설계해요(이름은 그대로).
   글 AI가 없거나 실패하면 세대 표시·스킬 재검사만. 세대를 올렸으면 true */
async function balRemasterAI(c,onProgress){ const from=GGMCombat.generation(c), old=clone(v2Ensure(c)); if(!balRemaster(c)) return false; const to=GGMCombat.generation(c);
  if(SAMPLE){ try{ const kit=await v2GenerateSkills(c,c.skillConcept||'',onProgress||(()=>{}),{remaster:{from,to,kit:old,plan:c.skillPlan}}); Object.keys(GGMCombat.SLOTS).forEach(s=>{ if(old[s]&&old[s].name&&kit[s]) kit[s].name=old[s].name; });
      c.skills=kit; delete c.skillTuning; c.skillBalance=null; (c.skillDesignLog||=[]).push({kind:'success',text:`구캐릭터 리마스터: ${from}세대 → ${to}세대 예산으로 스킬을 다시 설계(이름·설계 의도 유지)`}); }
    catch(e){ quietErr(e,'balRemasterAI'); (c.skillDesignLog||=[]).push({kind:'failure',text:'리마스터 스킬 재설계를 못 해 세대만 올리고 다시 검사했어요: '+String(e&&e.message||e).slice(0,80)}); } }
  mark('c:'+c.id); await v2ReadyChars([c]); return true; }
function balanceOnCreate(c){ const m=G.meta; if(!m.balance) m.balance={}; if(BAL().creep==='auto') m.balance.released=(+m.balance.released||0)+1; if(BAL().autoNorm) balNormalize(c,'edge'); }
/* src/main/0185-rules/0240-growth-curve.js에서 옮김 */
// 10장까지는 직선, 그 뒤로는 레벨 상한이 오르는 만큼만 (조금 덜) 강해져요
function enemyTarget(k,i,boss){ const CK=9; let base; if(k<=CK) base=645*(1+0.55*k); else { const L=70+5*(k-CK); base=645*(1+0.55*CK)*((1+0.06*(L-1))/(1+0.06*69))*Math.pow(0.99,k-CK); } return base*(1+0.08*i)*(boss?1.8:1); }
function capExtra(){ try{ return 5*Math.max(0,Math.floor(progK())-9); }catch(e){ return 0; } }
/* 적 스탯을 목표 전투력에 맞춘 새 객체(순수 — 받은 적은 그대로, 수동 지정 적은 그 자체를 돌려줌) */
function fitEnemy(e,target){ if(!e||e.manual) return e; const hp=+e.hp||800, atk=+e.atk||70, def=+e.def||0, spd=+e.spd||90, p=hp/5+atk*3+def*2, f=Math.max(50,target-spd)/p;
  return p<=0?{...e,hp,atk,def,spd}:{...e,hp:Math.max(100,Math.round(hp*f)),atk:Math.max(10,Math.round(atk*f)),def:Math.max(0,Math.round(def*f)),spd}; }
function rebalanceChapter(ch,k){ (ch.stages||[]).forEach((s,i)=>{ const last=i===ch.stages.length-1; if(s.enemies) s.enemies=s.enemies.map(e=>fitEnemy(e,enemyTarget(k,i,e.boss||(last&&s.enemies.length===1)))); }); }
function effPower(ids,enemies){ const fb=factionBonus(ids), n=Math.max(1,enemies.length);
  return ids.map(charById).filter(Boolean).reduce((a,c)=>{ const m=matchup(c,enemies); return a+Math.round(charPower(c)*(1+(fb[c.faction]||0)/100)*(1+0.25*(m.good-m.bad)/n)); },0); }
function matchup(c,enemies){let good=0,bad=0;enemies.forEach(en=>{if(BEATS[c.elem]===en.elem)good++;else if(BEATS[en.elem]===c.elem)bad++;});return {good,bad};}
function autoSquad(stage){
  const busy=busyIds(), en=stage.enemies, pool=G.chars.filter(c=>own(c.id)&&!busy.has(c.id)&&(!(FORM&&FORM.ctx&&FORM.ctx.allow)||FORM.ctx.allow(c)));
  const score=c=>{const m=matchup(c,en);return charPower(c)*(1+0.25*m.good-0.2*m.bad);};
  pool.sort((a,b)=>score(b)-score(a));
  const pick=[]; const need=['def','sup'];
  need.forEach(r=>{const c=pool.find(x=>x.role===r&&!pick.includes(x.id)); if(c&&score(c)>=score(pool[Math.min(pool.length-1,5)])*0.7) pick.push(c.id);});
  pool.forEach(c=>{if(pick.length<4&&!pick.includes(c.id))pick.push(c.id);});
  const order={def:0,atk:1,sup:2}; return pick.slice(0,4).sort((a,b)=>order[charById(a).role]-order[charById(b).role]);
}
function parseEnemies(t){
  return lines(t).map(l=>{const p=l.split(/[,，]/).map(x=>x.trim());
    return {name:p[0]||'적',elem:ELEMS.includes(p[1])?p[1]:'홍',hp:num(p[2],1,999999,800),atk:num(p[3],1,9999,70),def:num(p[4],0,9999,30),spd:num(p[5],30,300,90),boss:/보스|boss/i.test(p[6]||'')};}).slice(0,6);
}
