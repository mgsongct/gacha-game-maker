/* ===== rules — 기능 class(Model · View · Ctl) — docs/redesign.md 2·3절, tools/reshape.mjs가 매핑대로 옮김 ===== */
class Rules {
    // 속성 상성 문장: 실제 상성표(rulesElemMat, 없으면 BEATS)에서 만들어요(예전엔 속성 3개를 가정해 4개 이상인 게임에 틀린 상성을 알렸음)
static elemLine(){ const m=G&&G.meta&&Array.isArray(G.meta.elems)&&G.meta.elems.length?Rules.rulesElemMat():null; return ELEMS.map(elem=>{ const s=m&&m[elem]?Object.keys(m[elem]).filter(t=>t!==elem&&m[elem][t]>1):(BEATS[elem]?[BEATS[elem]]:[]); return s.length?Rules.jo(elem,'은','는')+' '+s.join('·')+'에 강함':''; }).filter(Boolean).join(', '); }

    // 받침에 맞는 조사: jo('열정','은','는') → '열정은', jo('캐스팅','으로','로') → '캐스팅으로'(ㄹ 받침이면 '로'). 한글이 아닌 끝 글자는 '을(를)'처럼 둘 다
static jo(w,a,b){ w=String(w??''); const c=w.charCodeAt(w.length-1)-0xAC00, j=c>=0&&c<=11171?c%28:-1; if(j<0) return w+(a==='으로'?'(으)로':a+'('+b+')'); return w+((j>0&&!(a==='으로'&&j===8))?a:b); }

    /* src/main/0185-game-rules.js */
static rulesAIDataPrompt({m}){ return `${Core.pf('RULES_AI_DESC',{RULES,ctx:World.ctx(),elems:m.elems.length,elems2:m.elems.map(e=>e.n).join(', '),role:Object.keys(ROLE).map(k=>`${k}=${ROLE[k]}`).join(', '),rulesBeats:Object.entries(Rules.rulesBeats()).map(([a,b])=>`${a}→${b}`).join(', ')})}\nJSON만 출력: {"elems":[${m.elems.map(e=>`"${e.n} 설명"`).join(',')}],"roles":{"atk":"설명","def":"설명","sup":"설명"}}`; }

  static rulesPosAIPrompt(){ return `${Core.pf('POS_AI',{RULES,ctx:World.ctx(),crew:System.T('crew'),POS_RULE})}\nJSON만 출력: {${POS_SCHEMA}}`; }

    /* G.meta.elems = [{n,c,d}] 2~8개 · G.meta.positions = [{id,name,base,desc,t:{…}}] · G.meta.rules = 나머지(비우면 기본값)
     rules: beats{속성:이기는 속성} · elemAdv/elemDis(기본 배율) · grid{A:{B:배율}}(상성표 덮어쓰기) · reactions[{a,b,name,type,value,dur,both}] · aura(초)
            roleDesc · roleBase · rarityMul · synergy{n,atk,def} · rel[{by:faction|role|elem|pos,a,b,mul}]
     applyMeta() → rulesApply()로 BEATS·GGMCombat 표에 반영, v2Options() → rulesOptions()로 전투·밸런스 검사(워커 포함)에 넘겨요.
     포지션: 전투 엔진의 기본형(base: atk·def·sup)을 하나 고르고, 그 위에 기능(t)을 얹어요. 캐릭터는 c.pos(포지션 id)와 c.role(=base)
     문서: docs/research/game-rules.md */
static RULESM(){ return Core.gameRead('meta.rules'); } // 읽기 — 바꿀 때는 gameSlot('meta.rules')

  static posDefaults(){ return Object.keys(ROLE).map(k=>({id:'p_'+k,name:ROLE[k],base:k,desc:'',t:{}})); }

  static POSITIONS(){ const L=G.meta.positions; return Array.isArray(L)&&L.length?L:Rules.posDefaults(); }

  static posById(id){ return Rules.POSITIONS().find(p=>p.id===id); }

  static rulesBeats(){ const r=Rules.RULESM(), E=G.meta.elems.map(e=>e.n);
    if(r.beats&&typeof r.beats==='object'){ const o={}; E.forEach(n=>{ if(E.includes(r.beats[n])&&r.beats[n]!==n) o[n]=r.beats[n]; }); return o; }
    if(Array.isArray(r.beatIdx)&&r.beatIdx.length===E.length){ const o={}; E.forEach((n,i)=>{ const j=+r.beatIdx[i]; if(j>=0&&j<E.length&&j!==i) o[n]=E[j]; }); return o; } // 예전 저장(이번 버전 전)
    const o={}; E.forEach((n,i)=>{ o[n]=E[(i+1)%E.length]; }); return o; }

    // 속성 이름이 바뀌면(게임 정의 편집 등) 이름으로 저장된 상성·상성표·반응·관계도 같이 바꿔요
static rulesRename(map){ const r=Core.gameSlot('meta.rules'), f=n=>map[n]||n; if(r.beats){ const o={}; Object.entries(r.beats).forEach(([a,b])=>{ o[f(a)]=f(b); }); r.beats=o; }
    if(r.grid){ const g={}; Object.entries(r.grid).forEach(([a,row])=>{ g[f(a)]={}; Object.entries(row||{}).forEach(([b,v])=>{ g[f(a)][f(b)]=v; }); }); r.grid=g; }
    (r.reactions||[]).forEach(x=>{ x.a=f(x.a); x.b=f(x.b); }); (r.rel||[]).forEach(x=>{ if(x.by==='elem'){ x.a=f(x.a); x.b=f(x.b); } }); }

  static rulesApply(){ const b=Rules.rulesBeats(); Object.keys(BEATS).forEach(k=>delete BEATS[k]); Object.assign(BEATS,b); GGMCombat.applyRules(Rules.RULESM()); }

  static rulesElemMat(){ const r=Rules.RULESM(), E=G.meta.elems.map(e=>e.n), b=Rules.rulesBeats(), adv=+r.elemAdv||1.5, dis=+r.elemDis||.75, g=r.grid||{}, m={};
    E.forEach(a=>{ m[a]={}; E.forEach(t=>{ const o=g[a]&&g[a][t]; m[a][t]=+o>0?+o:b[a]===t?adv:b[t]===a?dis:1; }); }); return m; }

  static rulesOptions(){ const r=G.meta.rules||{}, P={}, seen=new Set();
    Rules.POSITIONS().forEach(p=>{ const t=p.t||{}; if(Object.values(t).some(v=>+v)) P[p.id]=t; if(!seen.has(p.base)){ seen.add(p.base); if(P[p.id]) P['role:'+p.base]=t; } });
    return {formation:r.formation!==false,elemAdv:+r.elemAdv||1.5,elemDis:+r.elemDis||.75,elemMat:Rules.rulesElemMat(),reactions:Array.isArray(r.reactions)?r.reactions.filter(x=>x&&x.a&&x.b):[],aura:+r.aura||4,positions:P,synergy:r.synergy||null,rel:Array.isArray(r.rel)?r.rel:[],...(typeof Rules.balanceOptions==='function'?Rules.balanceOptions():{})}; } // 밸런스 AS 전투 보정(0187)

  static posTraitText(t){ return POS_TRAITS.filter(([k])=>+(t||{})[k]).map(([k,l])=>`${l.replace(/ %p?$/,'')} ${+t[k]>0?'+':''}${+t[k]}${k==='sp'?'':l.endsWith('%p')?'%p':'%'}`).join(' · '); }

  static rulesDraft(){ const r=Rules.RULESM(), D=GGMCombat.RULE_DEFAULTS, b=Rules.rulesBeats(), grid=r.grid||{};
    return {elems:G.meta.elems.map(e=>({n:e.n,c:e.c,d:e.d||'',orig:e.n,beat:b[e.n]||''})),grid:JSON.parse(JSON.stringify(grid)),adv:r.elemAdv??'',dis:r.elemDis??'',aura:r.aura??'',
     reactions:JSON.parse(JSON.stringify(r.reactions||[])),positions:JSON.parse(JSON.stringify(Rules.POSITIONS())),roleDesc:{...(r.roleDesc||{})},roleBase:JSON.parse(JSON.stringify(r.roleBase||{})),rarityMul:JSON.parse(JSON.stringify(r.rarityMul||{})),
     synergy:{n:'',atk:'',def:'',...(r.synergy||{})},rel:JSON.parse(JSON.stringify(r.rel||[])),D}; }

  static async rulesAIData(rep){ const m=G.meta; return Core.aiJSON(Rules.rulesAIDataPrompt({m}),rep,'quick'); }

  static async rulesAIFill(){ const res=await Rules.rulesAIData(null); if(!res) return false; const r=Core.gameSlot('meta.rules'); r.roleDesc=r.roleDesc||{};
    (res.elems||[]).forEach((d,i)=>{ if(d&&G.meta.elems[i]&&!G.meta.elems[i].d) G.meta.elems[i].d=String(d).slice(0,80); }); Object.entries(res.roles||{}).forEach(([k,d])=>{ if(d&&ROLE[k]&&!r.roleDesc[k]) r.roleDesc[k]=String(d).slice(0,80); }); Core.mark('meta'); return true; }

  static rulesMissingDesc(){ return G.meta.elems.some(e=>!e.d)||Object.keys(ROLE).some(k=>!((G.meta.rules||{}).roleDesc||{})[k]); }

    /* 포지션 자동 설계(점검 g_pos·실행 중 자동 채움): 포지션 없이 기본 3개로 돌던 예전 게임에 세계관에 맞춘 포지션을 만들어 저장하고 캐릭터를 고루 배정 */
  static posAI(){ return PositionsGen.run(); }

    /* 문제: ① 새 캐릭터는 지금 "출시 세대"로 만들어져 세대가 오를수록 스킬 예산이 커져요(1세대 ×1 → 5세대 ×2.1) → 오래된 캐릭터가 구식이 됨
           ② AI가 쓴 능력치는 범위만 맞춰서(체력 600~2000 등) 같은 희귀도끼리도 들쭉날쭉
     G.meta.balance: creep(manual|fixed|auto) baseGen per maxGen released · catchUp(off|boost|remaster) pct max lag · tol(허용 편차 %) autoNorm(생성 시 보정)
     문서: docs/research/balance.md */
static BAL(){ const d={creep:'manual',baseGen:1,per:5,maxGen:5,released:0,catchUp:'off',pct:8,max:30,lag:1,tol:15,autoNorm:true}; return Object.assign({},d,Core.gameRead('meta.balance')); } // 읽기(기본값 위에 바꾼 값) — 바꿀 때는 gameSlot('meta.balance')

  static balanceGeneration(){ const b=Rules.BAL(); if(b.creep==='fixed') return Math.max(1,Math.min(5,+b.baseGen||1)); if(b.creep==='auto') return Math.max(1,Math.min(+b.maxGen||5,(+b.baseGen||1)+Math.floor((+b.released||0)/Math.max(1,+b.per||5)))); return null; }

  static balanceOptions(){ const b=Rules.BAL(); return b.catchUp==='boost'?{genBoost:{cur:v2CurrentGeneration(),pct:+b.pct||0,max:+b.max||0}}:{}; }

  static balExpected(c){ return balPower(GGMCombat.generateBaseStats(c,()=>.5)); } // 희귀도·기본형 기준값(무작위 흔들림 없이)

  static balDev(c){ const e=Rules.balExpected(c); return e?balPower(c)/e-1:0; }

  static balInfo(c){ const b=Rules.BAL(), cur=v2CurrentGeneration(), gen=GGMCombat.generation(c), dev=Rules.balDev(c), skill=!c.skillBalance||c.skillBalance.ruleset!==GGMCombat.RULESET;
    return {c,dev,gen,cur,statOut:Math.abs(dev)*100>+b.tol,genLag:cur-gen>+b.lag,skill}; }

  static balReport(){ return G.chars.filter(c=>!c.alt).map(Rules.balInfo); }

  static balanceOnCreate(c){ const m=G.meta; if(!m.balance) m.balance={}; if(Rules.BAL().creep==='auto') m.balance.released=(+m.balance.released||0)+1; if(Rules.BAL().autoNorm) Characters.balNormalize(c,'edge'); }

  static rulesSave(){ RulesView.rulesRead(); const R=RD, m=G.meta, r=Core.gameSlot('meta.rules');
    const names=R.elems.map(e=>String(e.n||'').trim().replace(/[<>"'&`.]/g,'').slice(0,4)); if(names.some(n=>!n)||new Set(names).size!==names.length){ CoreView.toast('속성 이름이 비었거나 겹쳐요'); return false; }
    if(R.elems.length<2){ CoreView.toast('속성은 2개 이상이어야 해요'); return false; }
    // 이름 바뀜·삭제 반영: 캐릭터·NPC·스테이지 적의 속성, 상성표·반응·관계
    const ren={}; R.elems.forEach((e,i)=>{ if(e.orig&&e.orig!==names[i]) ren[e.orig]=names[i]; }); const removed=m.elems.map(e=>e.n).filter(n=>!R.elems.some(e=>e.orig===n)), fall=names[0], mapE=n=>ren[n]||(removed.includes(n)?fall:n);
    if(Object.keys(ren).length||removed.length){ [...G.chars,...(G.npcs||[])].forEach(c=>{ const n=mapE(c.elem); if(n!==c.elem){ c.elem=n; if(G.chars.includes(c)) Core.mark('c:'+c.id); } }); G.chapters.forEach(ch=>{ let ch2=false; (ch.stages||[]).forEach(st=>(st.enemies||[]).forEach(e=>{ const n=mapE(e.elem); if(n!==e.elem){ e.elem=n; ch2=true; } })); if(ch2) Core.mark('ch:'+ch.id); }); }
    const keep=n=>names.includes(n); m.elems=R.elems.map((e,i)=>({n:names[i],c:HEXC.test(e.c)?e.c:'#999999',d:String(e.d||'').slice(0,80)}));
    r.beats={}; R.elems.forEach((e,i)=>{ const b=ren[e.beat]||e.beat; if(keep(b)&&b!==names[i]) r.beats[names[i]]=b; }); delete r.beatIdx;
    const g={}; Object.entries(R.grid).forEach(([a,row])=>{ const A=ren[a]||a; if(!keep(A)) return; Object.entries(row||{}).forEach(([t,v])=>{ const B=ren[t]||t; if(keep(B)&&+v>0){ g[A]=g[A]||{}; g[A][B]=+v; } }); }); r.grid=g;
    r.reactions=R.reactions.map(x=>({...x,a:ren[x.a]||x.a,b:ren[x.b]||x.b})).filter(x=>keep(x.a)&&keep(x.b)&&x.a!==x.b).map(x=>({a:x.a,b:x.b,name:String(x.name||'반응').slice(0,12),type:REACT_TYPES.some(([k])=>k===x.type)?x.type:'amp',value:+x.value||'',dur:+x.dur||'',both:!!x.both}));
    r.elemAdv=+R.adv||undefined; r.elemDis=+R.dis||undefined; r.aura=+R.aura||undefined;
    const ids=new Set(); m.positions=R.positions.map(p=>{ let id=p.id||'p_'+uid(); while(ids.has(id)) id='p_'+uid(); ids.add(id); return {id,name:String(p.name||'포지션').slice(0,10),base:ROLE[p.base]?p.base:'atk',desc:String(p.desc||'').slice(0,80),range:RANGE[p.range]?p.range:'',t:Object.fromEntries(Object.entries(p.t||{}).filter(([k,v])=>POS_TRAITS.some(([x])=>x===k)&&+v).map(([k,v])=>[k,Math.max(-90,Math.min(500,+v))]))}; }) /* 사거리(근접·원거리·지원)도 저장 */;
    G.chars.forEach(c=>{ const p=Rules.posById(c.pos)||Rules.POSITIONS().find(x=>x.base===c.role); if(p&&(c.pos!==p.id||c.role!==p.base)){ c.pos=p.id; c.role=p.base; Core.mark('c:'+c.id); } });
    r.roleDesc={...R.roleDesc}; r.roleBase=R.roleBase; r.rarityMul={}; Object.entries(R.rarityMul).forEach(([f,a])=>{ if(a.some(x=>+x>0)) r.rarityMul[f]=a.map((x,i)=>+x>0?+x:GGMCombat.RULE_DEFAULTS.rarityMul[f][i]); });
    r.synergy={n:+R.synergy.n||0,atk:+R.synergy.atk||0,def:+R.synergy.def||0};
    const posId=n=>(m.positions.find(p=>p.name===n||p.id===n)||{}).id||n; r.rel=R.rel.map(x=>({by:x.by||'faction',a:x.by==='pos'?posId(x.a):x.by==='elem'?ren[x.a]||x.a:x.a,b:x.by==='pos'?posId(x.b):x.by==='elem'?ren[x.b]||x.b:x.b,mul:Math.max(0,+x.mul||1)})).filter(x=>x.a&&x.b);
    SystemView.applyMeta(); Core.mark('meta'); RD=null; return true; }

  static async rulesPosAI(rep){ RulesView.rulesRead(); const r=await Core.aiJSON(Rules.rulesPosAIPrompt(),rep,'default'); const L=NewGame.posClean(r&&r.positions); if(!L.length) return; RD.positions=L; RulesView.openRules(true); CoreView.toast(`포지션 ${L.length}개를 설계했어요. 저장을 눌러 주세요`); }

  static balSave(){ const v=id=>+(($('#'+id)||{}).value), m=G.meta; m.balance=Object.assign(m.balance||{},{creep:$('#bal_creep').value,baseGen:Math.max(1,Math.min(5,v('bal_base')||1)),per:Math.max(1,v('bal_per')||5),maxGen:Math.max(1,Math.min(5,v('bal_max')||5)),released:Math.max(0,v('bal_rel')||0),catchUp:$('#bal_as').value,pct:Math.max(0,v('bal_pct')||0),max:Math.max(0,v('bal_cap')||0),lag:Math.max(0,Math.min(4,v('bal_lag')||0)),tol:Math.max(1,v('bal_tol')||15),autoNorm:$('#bal_auto').checked}); Core.mark('meta'); }

  static formOn(){ return (G.meta.rules||{}).formation!==false; }

    // 편성 칸 경고: 자리에 안 맞는 배치
static rowWarn(c,i,n){ if(!Rules.formOn()||!c) return ''; const r=Core.charRange(c), back=n>2&&i>=2; return back&&r==='melee'?'후열 근접: 일반 공격 −30%':!back&&r!=='melee'&&n>2?`전열 ${RANGE[r]}: 받는 피해 +25%`:''; }
}

class RulesCtl {
  static rulesCodex(){ const o=Rules.rulesOptions(), m=G.meta, r=Rules.RULESM(), b=Rules.rulesBeats(), up=(title,body)=>World.cxUpsert(title,body);
    up('[규칙] 속성 상성',`속성 ${m.elems.length}개. ${m.elems.map(e=>`${e.n}${e.d?`(${e.d})`:''}${b[e.n]?`은(는) ${b[e.n]}에 강하다`:''}`).join('. ')}. 유리하면 피해 ${rulesPct(o.elemAdv)}, 불리하면 ${rulesPct(o.elemDis)}.`);
    if(o.reactions.length) up('[규칙] 속성 반응',o.reactions.map(x=>`${x.a}+${x.b} 「${x.name}」: ${(REACT_TYPES.find(([k])=>k===x.type)||['',''])[1]} ${x.value||''}`).join('. '));
    up('[규칙] 포지션',Rules.POSITIONS().map(p=>`${p.name}(${ROLE[p.base]}형)${p.desc?': '+p.desc:''}${Rules.posTraitText(p.t)?' — '+Rules.posTraitText(p.t):''}`).join(' / '));
    if(r.synergy&&+r.synergy.n>1) up('[규칙] 진영 시너지',`같은 진영 ${r.synergy.n}명 이상이 함께 싸우면 공격 +${r.synergy.atk||0}%, 방어 +${r.synergy.def||0}%.`);
    if((r.rel||[]).length) up('[규칙] 관계',r.rel.map(x=>`${x.by==='pos'?(Rules.posById(x.a)||{}).name||x.a:x.a} → ${x.by==='pos'?(Rules.posById(x.b)||{}).name||x.b:x.b} ${rulesPct(+x.mul||1)}`).join(', '));
    Core.mark('world'); CoreView.toast('도감에 규칙을 기록했어요'); }

  static async rulesAI(rep){ RulesView.rulesRead(); const res=await Rules.rulesAIData(rep); if(!res||!RD) return; (res.elems||[]).forEach((d,i)=>{ if(d&&RD.elems[i]) RD.elems[i].d=String(d).slice(0,80); }); Object.entries(res.roles||{}).forEach(([k,d])=>{ if(d&&ROLE[k]) RD.roleDesc[k]=String(d).slice(0,80); }); RulesView.openRules(true); CoreView.toast('설명을 채웠어요. 저장을 눌러 주세요'); }

  static rulesPosAssign(){ RulesView.rulesRead(); const n=Characters.posSpread(RD.positions); CoreView.toast(`${n}명에게 포지션을 배정했어요(기본형이 같은 포지션 중에서). 캐릭터 편집에서 바꿀 수 있어요`); }
}

class RulesView {
  static rulesElemLine(e){ const m=Rules.rulesElemMat()[e]||{}, strong=Object.keys(m).filter(t=>m[t]>1), weak=Object.keys(m).filter(t=>(Rules.rulesElemMat()[t]||{})[e]>1);
    return [strong.length?`${strong.map(t=>`<b>${esc(t)}</b>`).join('·')}에 강함(${strong.map(t=>rulesPct(m[t])).join('·')})`:'',weak.length?`${weak.map(t=>`<b>${esc(t)}</b>`).join('·')}에 약함`:''].filter(Boolean).join(' · ')||'상성 없음'; }

  static rulesCharHTML(c){ if(!c||c.npc) return ''; const r=Rules.RULESM(), syn=r.synergy, p=Core.posOf(c), rd=(r.roleDesc||{})[c.role], ed=(G.meta.elems.find(e=>e.n===c.elem)||{}).d, rx=(r.reactions||[]).filter(x=>x.a===c.elem||x.b===c.elem),
      rel=(r.rel||[]).filter(x=>(x.by==='faction'&&x.a===c.faction)||(x.by==='role'&&x.a===c.role)||(x.by==='elem'&&x.a===c.elem)||(x.by==='pos'&&x.a===p.id));
    return `<div class="panel" style="margin:6px 0;padding:8px 10px;font-size:.82rem"><div>속성 <b style="color:${ECOL[c.elem]||'inherit'}">${esc(c.elem)}</b> — ${RulesView.rulesElemLine(c.elem)}${ed?` <span class="muted">· ${esc(ed)}</span>`:''}</div>
    ${rx.length?`<div class="muted">반응: ${rx.map(x=>`${esc(x.a)}+${esc(x.b)} 「${esc(x.name||'반응')}」`).join(' · ')}</div>`:''}
    <div>포지션 <b>${esc(p.name)}</b> <span class="muted">(${esc(ROLE[p.base]||p.base)}형)</span>${p.desc||rd?` — <span class="muted">${esc(p.desc||rd)}</span>`:''}${Rules.posTraitText(p.t)?`<div class="muted">${esc(Rules.posTraitText(p.t))}</div>`:''}</div>
    ${c.faction?`<div>진영 <b>${esc(c.faction)}</b>${syn&&+syn.n>1&&(+syn.atk||+syn.def)?` — 같은 진영 ${+syn.n}명 이상 편성 시 공격 +${+syn.atk||0}% · 방어 +${+syn.def||0}%`:''}</div>`:''}
    ${rel.length?`<div class="muted">관계: ${rel.map(x=>`${esc(x.by==='pos'?(Rules.posById(x.b)||{}).name||x.b:x.b)} 상대로 ${rulesPct(+x.mul||1)}`).join(' · ')}</div>`:''}</div>`; }

  static rulesPanel(){ const o=Rules.rulesOptions(), b=Rules.rulesBeats(), m=G.meta, P=Rules.POSITIONS();
    return `<div class="panel pm-hide"><h3>게임 규칙 (속성·포지션·능력치)</h3><p class="muted" style="margin:0 0 6px">속성 ${m.elems.length}개: ${m.elems.map(e=>b[e.n]?`${esc(e.n)}→${esc(b[e.n])}`:esc(e.n)).join(' · ')} (유리 ${rulesPct(o.elemAdv)}, 불리 ${rulesPct(o.elemDis)})${o.reactions.length?` · 반응 ${o.reactions.length}개`:''}. 포지션 ${P.length}개: ${P.map(p=>esc(p.name)).join('·')}. 속성 추가·제거, 상성표, 반응, 포지션 기능, 역할 능력치, 희귀도, 진영 시너지, 관계를 보고 고쳐요.</p><button class="btn sm" data-act="rulesopen">규칙 보기·편집</button></div>`; }

  static openRules(keep){ if(!keep||!RD) RD=Rules.rulesDraft(); const R=RD, D=R.D, E=R.elems.map(e=>e.n), num=(k,v,ph,step,w)=>`<input class="in" type="number" data-rk="${k}" value="${v??''}" placeholder="${ph??''}" ${step?`step="${step}"`:''} style="min-width:0;${w?`max-width:${w}px`:''}">`,
      sel=(k,v,opts,w)=>`<select class="in" data-rk="${k}" style="max-width:${w||110}px">${opts.map(([a,l])=>`<option value="${esc(a)}" ${String(v)===String(a)?'selected':''}>${esc(l)}</option>`).join('')}</select>`, txt=(k,v,ph,st)=>`<input class="in" data-rk="${k}" value="${esc(v||'')}" placeholder="${esc(ph||'')}" style="${st||''}">`;
    const adv=+R.adv||1.5, dis=+R.dis||.75, def=(a,t)=>{ const A=R.elems.find(e=>e.n===a), T=R.elems.find(e=>e.n===t); return A&&A.beat===t?adv:T&&T.beat===a?dis:1; };
    CoreView.openModal(`${head('게임 규칙',`<span class="muted">비운 칸은 기본값 · 저장해야 반영</span>`)}
  <h3 class="sec">속성 <span class="muted" style="font-size:.8rem">(${R.elems.length}개, 2~8개)</span></h3>
  ${R.elems.map((e,i)=>`<div class="row" style="gap:6px;align-items:center;margin:4px 0;flex-wrap:wrap">${txt(`e.${i}.n`,e.n,'이름','max-width:70px')}<input type="color" data-rk="e.${i}.c" value="${esc(e.c)}"><span class="muted" style="font-size:.8rem">이김→</span>${sel(`e.${i}.beat`,e.beat,[['','없음'],...E.filter(x=>x!==e.n).map(x=>[x,x])],90)}${txt(`e.${i}.d`,e.d,'설명 (도감·캐릭터 화면)','flex:1;min-width:120px')}${R.elems.length>2?`<button class="btn sm ghost" data-act="rulesedel" data-i="${i}">삭제</button>`:''}</div>`).join('')}
  ${R.elems.length<8?`<button class="btn sm ghost" data-act="rulesadd" data-k="elem">+ 속성 추가</button>`:''}
  <div class="g4" style="margin-top:6px"><div><label class="f">유리 배율</label>${num('adv',R.adv,'1.5','0.05')}</div><div><label class="f">불리 배율</label>${num('dis',R.dis,'0.75','0.05')}</div><div><label class="f">반응 흔적(초)</label>${num('aura',R.aura,'4','0.5')}</div></div>
  <details style="margin-top:8px"><summary><b>상성표</b> <span class="muted">공격 속성(행) → 맞는 속성(열) 피해 배율. 비우면 위 "이김"과 배율로 계산</span></summary><div style="overflow:auto"><table style="border-collapse:collapse;font-size:.8rem;margin-top:6px"><tr><th></th>${E.map(t=>`<th style="padding:2px 4px">${esc(t)}</th>`).join('')}</tr>${E.map(a=>`<tr><th style="padding:2px 4px">${esc(a)}</th>${E.map(t=>`<td style="padding:1px"><input class="in" type="number" step="0.05" data-rk="g.${esc(a)}.${esc(t)}" value="${(R.grid[a]||{})[t]??''}" placeholder="${def(a,t)}" style="width:62px;min-width:0"></td>`).join('')}</tr>`).join('')}</table></div></details>
  <h3 class="sec" style="margin-top:14px">속성 반응</h3><p class="muted" style="font-size:.8rem;margin:0 0 6px">A 속성으로 맞은 적을 흔적 시간 안에 B 속성으로 맞히면 반응이 터져요(예: 홍+청 「증기 폭발」 폭발 1.2).</p>
  ${R.reactions.map((x,i)=>`<div class="row" style="gap:4px;margin:4px 0;flex-wrap:wrap;align-items:center">${sel(`r.${i}.a`,x.a,E.map(n=>[n,n]),70)}<span>+</span>${sel(`r.${i}.b`,x.b,E.map(n=>[n,n]),70)}${txt(`r.${i}.name`,x.name,'반응 이름','max-width:110px')}${sel(`r.${i}.type`,x.type||'amp',REACT_TYPES,170)}${num(`r.${i}.value`,x.value,x.type==='vuln'?'20':x.type==='stun'?'1.5':'1.5','0.1',70)}${x.type==='vuln'?num(`r.${i}.dur`,x.dur,'5','0.5',60):''}<label style="display:inline-flex;gap:3px;font-size:.8rem"><input type="checkbox" data-rk="r.${i}.both" ${x.both?'checked':''}>순서 무관</label><button class="btn sm ghost" data-act="rulesrdel" data-k="reactions" data-i="${i}">삭제</button></div>`).join('')}
  <button class="btn sm ghost" data-act="rulesadd" data-k="reaction">+ 반응 추가</button>
  <h3 class="sec" style="margin-top:14px">포지션 <span class="muted" style="font-size:.8rem">(직군·함종 등)</span></h3><p class="muted" style="font-size:.8rem;margin:0 0 6px">포지션마다 전투 기본형(공격·방어·지원 — 스킬 생성과 AI 행동)을 고르고 기능을 얹어요. 위협도가 높으면 적이 더 노리고, 낮으면 덜 노려요.</p>
  <div class="row" style="flex-wrap:wrap;gap:4px;margin-bottom:6px"><button class="btn sm ghost" data-act="rulespreset" data-k="basic">기본 3</button><button class="btn sm ghost" data-act="rulespreset" data-k="squad8">직군형 8 (선봉·근접·방벽·사수·술사·의무·보조·특수)</button><button class="btn sm ghost" data-act="rulespreset" data-k="ship6">함종형 6 (구축·경순·중순·전함·항모·잠수)</button><button class="btn sm ghost" data-act="rulesposai">AI로 세계관에 맞게 설계</button></div>
  ${R.positions.map((p,i)=>`<div class="panel" style="padding:8px;margin:6px 0"><div class="row" style="gap:6px;flex-wrap:wrap;align-items:center">${txt(`p.${i}.name`,p.name,'이름','max-width:90px')}${sel(`p.${i}.base`,p.base,Object.keys(ROLE).map(k=>[k,ROLE[k]+'형']),90)}${sel(`p.${i}.range`,p.range||'',[['','사거리 자동'],...Object.entries(RANGE)],100)}${txt(`p.${i}.desc`,p.desc,'기능 설명','flex:1;min-width:120px')}${R.positions.length>1?`<button class="btn sm ghost" data-act="rulesrdel" data-k="positions" data-i="${i}">삭제</button>`:''}</div>
    <div class="g4" style="margin-top:4px">${POS_TRAITS.map(([k,l])=>`<div><label class="f" style="font-size:.72rem">${l}</label>${num(`p.${i}.t.${k}`,(p.t||{})[k],'0')}</div>`).join('')}</div></div>`).join('')}
  <div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn sm ghost" data-act="rulesadd" data-k="pos">+ 포지션 추가</button><button class="btn sm ghost" data-act="rulesposassign">${esc(System.T('crew'))} 포지션 자동 배정</button></div>
  <h3 class="sec" style="margin-top:14px">전투 기본형 능력치</h3><p class="muted" style="font-size:.8rem;margin:0 0 6px">새로 만드는 ${esc(System.T('crew'))}의 R 기준 기본 능력치·속도(포지션 기능 % 적용 전).</p>
  ${Object.keys(ROLE).map(k=>`<div class="panel" style="padding:8px;margin:6px 0"><div class="row" style="gap:6px;flex-wrap:wrap"><b style="min-width:50px">${esc(ROLE[k])}형</b>${txt(`rd.${k}`,R.roleDesc[k],'설명','flex:1;min-width:140px')}</div><div class="g4" style="margin-top:4px">${RULE_STATS.map(([f,l])=>`<div><label class="f">${l}</label>${num(`rb.${k}.${f}`,(R.roleBase[k]||{})[f],f==='spd'?D.roleSpeed[k]:D.roleBase[k][f])}</div>`).join('')}</div></div>`).join('')}
  <label class="f">희귀도 배율 (R / SR / SSR)</label>${RULE_STATS.slice(0,3).map(([f,l])=>`<div class="g4" style="align-items:center;margin:2px 0"><span>${l}</span>${[0,1,2].map(i=>`<div>${num(`rm.${f}.${i}`,(R.rarityMul[f]||[])[i],D.rarityMul[f][i],'0.01')}</div>`).join('')}</div>`).join('')}
  <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-act="rulesrecalc">기존 ${esc(System.T('crew'))} 능력치 다시 계산</button></div>
  <h3 class="sec" style="margin-top:14px">진영 시너지</h3><p class="muted" style="font-size:.8rem;margin:0 0 6px">${World.factions().length?`진영: ${World.factions().map(f=>esc(f.name)).join(', ')}. `:''}같은 진영 n명 이상 편성 시 공격·방어 +% (0이면 끔).</p>
  <div class="g4"><div><label class="f">필요 인원</label>${num('syn.n',R.synergy.n,'0')}</div><div><label class="f">공격 +%</label>${num('syn.atk',R.synergy.atk,'0')}</div><div><label class="f">방어 +%</label>${num('syn.def',R.synergy.def,'0')}</div></div>
  <h3 class="sec" style="margin-top:14px">관계 배율</h3><p class="muted" style="font-size:.8rem;margin:0 0 6px">진영·역할·속성·포지션 A가 B를 공격할 때 피해 배율. 포지션은 이름으로 써요.</p>
  ${R.rel.map((x,i)=>`<div class="row" style="gap:4px;margin:4px 0;flex-wrap:wrap">${sel(`l.${i}.by`,x.by||'faction',[['faction','진영'],['role','기본형'],['elem','속성'],['pos','포지션']],90)}${txt(`l.${i}.a`,x.by==='pos'?(R.positions.find(p=>p.id===x.a)||{}).name||x.a:x.a,'공격하는 쪽','max-width:110px')}<span>→</span>${txt(`l.${i}.b`,x.by==='pos'?(R.positions.find(p=>p.id===x.b)||{}).name||x.b:x.b,'맞는 쪽','max-width:110px')}${num(`l.${i}.mul`,x.mul??1.2,'1.2','0.05',80)}<button class="btn sm ghost" data-act="rulesrdel" data-k="rel" data-i="${i}">삭제</button></div>`).join('')}
  <button class="btn sm ghost" data-act="rulesadd" data-k="rel">+ 관계 추가</button>
  <div class="row" style="margin-top:14px;flex-wrap:wrap"><button class="btn" data-act="rulessave">저장</button><button class="btn ghost" data-act="rulescodex">도감에 규칙 기록</button><button class="btn ghost" data-act="rulesai">AI로 설명 채우기</button><button class="btn ghost" data-act="close">닫기</button></div>`); }

  static rulesRead(){ const R=RD; if(!R) return; document.querySelectorAll('#modal [data-rk]').forEach(el=>{ const p=el.dataset.rk.split('.'), v=el.type==='checkbox'?el.checked:el.value;
    if(p[0]==='e'){ R.elems[+p[1]][p[2]]=v; } else if(p[0]==='g'){ const a=p[1],t=p[2]; R.grid[a]=R.grid[a]||{}; if(v==='') delete R.grid[a][t]; else R.grid[a][t]=+v; }
    else if(p[0]==='r'){ const x=R.reactions[+p[1]]; x[p[2]]=['value','dur'].includes(p[2])?(v===''?'':+v):v; } else if(p[0]==='p'){ const x=R.positions[+p[1]]; if(p[2]==='t'){ x.t=x.t||{}; if(v===''||+v===0) delete x.t[p[3]]; else x.t[p[3]]=+v; } else x[p[2]]=v; }
    else if(p[0]==='rd') R.roleDesc[p[1]]=v; else if(p[0]==='rb'){ R.roleBase[p[1]]=R.roleBase[p[1]]||{}; if(v==='') delete R.roleBase[p[1]][p[2]]; else R.roleBase[p[1]][p[2]]=+v; }
    else if(p[0]==='rm'){ R.rarityMul[p[1]]=R.rarityMul[p[1]]||['','','']; R.rarityMul[p[1]][+p[2]]=v===''?'':+v; } else if(p[0]==='syn') R.synergy[p[1]]=v===''?'':+v;
    else if(p[0]==='l'){ const x=R.rel[+p[1]]; x[p[2]]=p[2]==='mul'?+v||1:v; } else R[p[0]]=v===''?'':+v; }); }

  static balancePanel(){ const b=Rules.BAL(), R=Rules.balReport(), out=R.filter(x=>x.statOut).length, lag=R.filter(x=>x.genLag).length;
    const creepL={manual:'수동(시즌 설정)',fixed:`고정 ${b.baseGen}세대`,auto:`자동 상승(${b.per}명마다, 최대 ${b.maxGen})`}[b.creep], asL={off:'끔',boost:`전투 보정 세대당 +${b.pct}%`,remaster:'리마스터'}[b.catchUp];
    return `<div class="panel pm-hide"><h3>밸런스 관리 ${out||lag?`<span class="badge">점검 ${out+lag}</span>`:''}</h3><p class="muted" style="margin:0 0 6px">현재 출시 세대 ${v2CurrentGeneration()} · 세대 정책 ${esc(creepL)} · 구캐릭터 AS ${esc(asL)} · 능력치 허용 ±${b.tol}%${out?` · 범위 밖 ${out}명`:''}${lag?` · 세대 뒤처짐 ${lag}명`:''}</p><button class="btn sm" data-act="balopen">밸런스 점검·설정</button></div>`; }

  static openBalance(){ const b=Rules.BAL(), R=Rules.balReport(), num=(id,v,min,max,step)=>`<input class="in" type="number" id="${id}" value="${v}" min="${min}" max="${max}" ${step?`step="${step}"`:''}>`, cur=v2CurrentGeneration();
    const byR=[3,2,1].map(r=>{ const L=R.filter(x=>x.c.rarity===r); if(!L.length) return ''; const d=L.map(x=>x.dev*100); return `<tr><td>${RL[r]}</td><td>${L.length}</td><td>${Math.round(Math.min(...d))}% ~ ${Math.round(Math.max(...d))}%</td><td>${Math.min(...L.map(x=>x.gen))} ~ ${Math.max(...L.map(x=>x.gen))}</td></tr>`; }).join('');
    CoreView.openModal(`${head('밸런스 점검·설정',`<span class="muted">현재 출시 세대 ${cur}</span>`)}
  <h3 class="sec">세대(파워 인플레) 정책</h3><p class="muted" style="font-size:.8rem;margin:0 0 6px">세대가 높을수록 스킬 예산이 커져요(1세대 ×1 → 5세대 ×2.1). 새 캐릭터는 그때의 세대로 만들어지고 계속 그 세대로 남아요.</p>
  <select class="in" id="bal_creep">${[['manual','수동 — 시즌 운영의 출시 세대 설정을 따름(기존 방식)'],['fixed','고정 — 모든 새 캐릭터를 같은 세대로(인플레 없음)'],['auto','자동 상승 — 새 캐릭터 N명마다 1세대씩, 최대 세대까지']].map(([k,l])=>`<option value="${k}" ${b.creep===k?'selected':''}>${l}</option>`).join('')}</select>
  <div class="g4" style="margin-top:6px"><div><label class="f">기준 세대</label>${num('bal_base',b.baseGen,1,5)}</div><div><label class="f">N명마다</label>${num('bal_per',b.per,1,99)}</div><div><label class="f">최대 세대</label>${num('bal_max',b.maxGen,1,5)}</div><div><label class="f">출시 수</label>${num('bal_rel',b.released,0,9999)}</div></div>
  <h3 class="sec" style="margin-top:12px">구캐릭터 AS</h3><select class="in" id="bal_as">${[['off','끔'],['boost','전투 보정 — 세대 차이당 체력·공격·방어 +x% (저장된 능력치는 그대로)'],['remaster','리마스터 — 뒤처진 캐릭터의 세대를 올리고 스킬 밸런스 재검사']].map(([k,l])=>`<option value="${k}" ${b.catchUp===k?'selected':''}>${l}</option>`).join('')}</select>
  <div class="g4" style="margin-top:6px"><div><label class="f">세대당 +%</label>${num('bal_pct',b.pct,0,100)}</div><div><label class="f">최대 +%</label>${num('bal_cap',b.max,0,300)}</div><div><label class="f">허용 세대 차이</label>${num('bal_lag',b.lag,0,4)}</div></div>
  <h3 class="sec" style="margin-top:12px">능력치 균질화</h3><p class="muted" style="font-size:.8rem;margin:0 0 6px">희귀도·전투 기본형의 기준값(게임 규칙의 기본 능력치·희귀도 배율)과 비교해요. 보수는 속도는 두고 체력·공격·방어를 같은 비율로 맞춰서 캐릭터 성향은 살려요.</p>
  <div class="g4"><div><label class="f">허용 편차 ±%</label>${num('bal_tol',b.tol,1,100)}</div></div><label style="display:flex;gap:6px;margin:6px 0"><input type="checkbox" id="bal_auto" ${b.autoNorm?'checked':''}> AI가 새로 만든 ${esc(System.T('crew'))}의 능력치가 범위를 벗어나면 자동으로 범위 안으로</label>
  <div class="row" style="margin:8px 0"><button class="btn sm" data-act="balsave">설정 저장</button></div>
  <h3 class="sec">점검 결과</h3><table style="font-size:.8rem;border-collapse:collapse;margin-bottom:6px"><tr><th style="text-align:left;padding:2px 6px">희귀도</th><th style="padding:2px 6px">수</th><th style="padding:2px 6px">기준 대비</th><th style="padding:2px 6px">세대</th></tr>${byR}</table>
  <div style="max-height:260px;overflow:auto;font-size:.82rem">${R.sort((a,b2)=>Math.abs(b2.dev)-Math.abs(a.dev)).map((x,i)=>`<label style="display:flex;gap:6px;align-items:center;padding:2px 0;border-bottom:1px solid var(--line)"><input type="checkbox" data-bal="${x.c.id}" ${x.statOut||x.genLag?'checked':''}><b style="min-width:80px">${esc(x.c.name)}</b><span>${RL[x.c.rarity]} · ${esc(Core.posOf(x.c).name)}</span><span style="color:${x.statOut?'#ff5a5a':'inherit'}">${x.dev>=0?'+':''}${Math.round(x.dev*100)}%</span><span style="color:${x.genLag?'#ffd35a':'inherit'}">${x.gen}세대</span>${x.skill?'<span class="muted">스킬 검사 필요</span>':''}</label>`).join('')}</div>
  <div class="row" style="margin-top:8px;flex-wrap:wrap;gap:6px"><button class="btn sm" data-act="balfix" data-k="edge">선택: 능력치 범위 안으로</button><button class="btn sm ghost" data-act="balfix" data-k="center">선택: 기준값으로</button><button class="btn sm ghost" data-act="balfix" data-k="remaster">선택: 세대 맞추기(AS)</button><button class="btn sm ghost" data-act="balfix" data-k="skill">선택: 스킬 밸런스 다시 검사</button>${typeof AUDIT_UNDO!=='undefined'&&AUDIT_UNDO?`<button class="btn sm ghost" data-act="balundo">되돌리기: ${esc(AUDIT_UNDO.label)}</button>`:''}</div>
  <div class="row" style="margin-top:12px"><button class="btn ghost" data-act="close">닫기</button></div>`); }

    /* 스테이지 결과(View): 별·조건·MVP·피해 막대·보상, 실패면 다시 도전 */
static stageResultHTML(R){ if(!R.win) return `<h2 class="disp" style="color:#ff5277">작전 실패</h2><p>${System.T('enhance')}로 레벨을 올리거나 편성과 속성을 바꿔 보세요.<br>${esc(Rules.elemLine())}.</p><div class="row"><button class="btn ghost" data-act="bdone">돌아가기</button><button class="btn" data-act="bretry">다시 도전</button></div>`;
    const {s,kind,r,first,exp,noDeath,fast,stars,bonus,mvp,tot,ml}=R;
    return `<div class="rs-stars">${[1,2,3].map(i=>`<span class="${i<=stars?'on':''}" style="animation-delay:${i*0.18}s">★</span>`).join('')}</div>
      <h2 class="disp" style="color:var(--rose);margin:0">${esc(System.T('ops'))} 성공</h2>
      <div class="rs-cond"><span class="on">✓ 승리</span><span class="${noDeath?'on':''}">${noDeath?'✓':'✗'} 전원 생존</span><span class="${fast?'on':''}">${fast?'✓':'✗'} ${esc(Core.goalText(s.goal))}</span></div>
      ${mvp?`<div class="rs-mvp"><div class="rs-art">${CoreView.art(mvp.c)}</div><div class="rs-mt"><i>MVP</i><b>${esc(mvp.name)}</b>${ml?`<span>“${esc(sub(ml))}”</span>`:''}</div></div>
      <div class="rs-dmg">${B.allies.map(u=>`<div><b>${esc(u.name)}</b><span class="bar"><i style="width:${Math.round((u.dmg||0)/tot*100)}%"></i></span><em>${nf(u.dmg||0)}</em></div>`).join('')}</div>`:''}
      <p style="margin:4px 0">${Core.rewardText(r)}${first?' (첫 클리어 보상)':(kind==='farm'?'':`<br><small class="muted">${esc(System.T('currency'))}은(는) 첫 클리어 때만 받아요</small>`)}${bonus}<br>참가 ${System.T('crew')} 경험치 +${exp}</p><button class="btn" data-act="bdone" data-win="1" data-first="${first?1:0}">계속</button>`; }
}

/* ===== Rules의 AI 생성 흐름(Generator 하위 — docs/redesign.md 3절) ===== */
/* 포지션 설계(검사를 통과해야 반영) */
class PositionsGen extends Generator {
  static prompt(){ return Rules.rulesPosAIPrompt(); }
  static parse(r){ const L=NewGame.posClean(r.positions); return NewGame.posValid(L)?L:null; }
  static apply(L){ G.meta.positions=L; Characters.posSpread(L); Core.mark('meta'); return true; }
}
