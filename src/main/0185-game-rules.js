/* ===== 게임 규칙: 속성(추가·제거·상성표·반응) · 포지션(기능) · 역할 기본 능력치 · 희귀도 · 진영 시너지 · 관계 ===== */
/* G.meta.elems = [{n,c,d}] 2~8개 · G.meta.positions = [{id,name,base,desc,t:{…}}] · G.meta.rules = 나머지(비우면 기본값)
   rules: beats{속성:이기는 속성} · elemAdv/elemDis(기본 배율) · grid{A:{B:배율}}(상성표 덮어쓰기) · reactions[{a,b,name,type,value,dur,both}] · aura(초)
          roleDesc · roleBase · rarityMul · synergy{n,atk,def} · rel[{by:faction|role|elem|pos,a,b,mul}]
   applyMeta() → rulesApply()로 BEATS·GGMCombat 표에 반영, v2Options() → rulesOptions()로 전투·밸런스 검사(워커 포함)에 넘겨요.
   포지션: 전투 엔진의 기본형(base: atk·def·sup)을 하나 고르고, 그 위에 기능(t)을 얹어요. 캐릭터는 c.pos(포지션 id)와 c.role(=base)
   문서: docs/research/game-rules.md */
function RULESM(){ if(!G.meta.rules||typeof G.meta.rules!=='object') G.meta.rules={}; return G.meta.rules; }
const RULE_STATS=[['hp','체력'],['atk','공격'],['def','방어'],['spd','속도']];
const POS_TRAITS=[['hp','체력 %'],['atk','공격 %'],['def','방어 %'],['spd','속도 %'],['dmg','주는 피해 %'],['taken','받는 피해 %'],['heal','회복량 %'],['crit','치명타 %p'],['sp','시작 SP'],['threat','위협도 %']];
const REACT_TYPES=[['amp','피해 증폭(배율)'],['burst','폭발(공격력×값 추가 피해)'],['stun','기절(초)'],['vuln','취약(받는 피해 +값%)']];
// 생성기가 쓰는 속성 이름 다듬기 — 속성 목록·상성(beats)·반응의 속성 이름에 같이 써야 서로 맞음
const elemName=v=>String(v||'').replace(/[<>"'&`.]/g,'').trim().slice(0,4);
// 생성된 반응 정리: 값의 뜻은 종류마다 다름(REACT_TYPES — amp 배율·burst 공격력×값·stun 초·vuln 받는 피해 +%). vuln 값이 배율처럼 보이면(5 미만, 예 1.3) 백분율로(30)
function reactClean(x){ const type=['amp','burst','stun','vuln'].includes(x.type)?x.type:'amp'; let value=+x.value||''; if(type==='vuln'&&value&&value<5) value=Math.round((value>1?value-1:value)*100);
  return {a:x.a,b:x.b,name:String(x.name||'반응').slice(0,12),type,value}; }
const POS_PRESETS={
 basic:[['공격','atk','적을 쓰러뜨리는 주력',{}],['방어','def','앞에서 버티며 동료를 지킴',{}],['지원','sup','회복과 강화로 돕기',{}]],
 squad8:[['선봉','atk','전투를 여는 돌격수. 시작부터 기술을 쓸 준비가 돼 있음',{sp:30,spd:10,hp:-10}],['근접','atk','근거리 주력 딜러',{atk:10,dmg:5}],['방벽','def','적의 공격을 끌어 아군을 지킴',{hp:15,def:15,threat:80,taken:-10}],['사수','atk','멀리서 약점을 노림',{crit:10,threat:-50,hp:-15}],['술사','atk','속성 공격 전문가',{dmg:15,def:-15}],['의무','sup','회복 전문',{heal:25,atk:-10}],['보조','sup','강화·약화로 판을 짬',{sp:20,threat:-30}],['특수','atk','변칙 전술',{spd:15,crit:5,hp:-10}]],
 ship6:[['구축','atk','빠르고 가벼운 선봉',{spd:20,hp:-15,crit:5}],['경순','atk','균형 잡힌 지휘함',{spd:5,dmg:5}],['중순','atk','강한 포격',{atk:15,spd:-5}],['전함','def','두꺼운 장갑과 주포',{hp:25,def:20,spd:-25,atk:10,threat:50}],['항모','sup','함재기로 지원과 공격',{heal:15,sp:20,threat:-20}],['잠수','atk','은밀한 일격',{crit:15,threat:-60,hp:-20}]]};
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
function rulesRename(map){ const r=RULESM(), f=n=>map[n]||n; if(r.beats){ const o={}; Object.entries(r.beats).forEach(([a,b])=>{ o[f(a)]=f(b); }); r.beats=o; }
  if(r.grid){ const g={}; Object.entries(r.grid).forEach(([a,row])=>{ g[f(a)]={}; Object.entries(row||{}).forEach(([b,v])=>{ g[f(a)][f(b)]=v; }); }); r.grid=g; }
  (r.reactions||[]).forEach(x=>{ x.a=f(x.a); x.b=f(x.b); }); (r.rel||[]).forEach(x=>{ if(x.by==='elem'){ x.a=f(x.a); x.b=f(x.b); } }); }
function rulesApply(){ const b=rulesBeats(); Object.keys(BEATS).forEach(k=>delete BEATS[k]); Object.assign(BEATS,b); GGMCombat.applyRules(RULESM()); }
function rulesElemMat(){ const r=RULESM(), E=G.meta.elems.map(e=>e.n), b=rulesBeats(), adv=+r.elemAdv||1.5, dis=+r.elemDis||.75, g=r.grid||{}, m={};
  E.forEach(a=>{ m[a]={}; E.forEach(t=>{ const o=g[a]&&g[a][t]; m[a][t]=+o>0?+o:b[a]===t?adv:b[t]===a?dis:1; }); }); return m; }
function rulesOptions(){ const r=G.meta.rules||{}, P={}, seen=new Set();
  POSITIONS().forEach(p=>{ const t=p.t||{}; if(Object.values(t).some(v=>+v)) P[p.id]=t; if(!seen.has(p.base)){ seen.add(p.base); if(P[p.id]) P['role:'+p.base]=t; } });
  return {formation:r.formation!==false,elemAdv:+r.elemAdv||1.5,elemDis:+r.elemDis||.75,elemMat:rulesElemMat(),reactions:Array.isArray(r.reactions)?r.reactions.filter(x=>x&&x.a&&x.b):[],aura:+r.aura||4,positions:P,synergy:r.synergy||null,rel:Array.isArray(r.rel)?r.rel:[],...(typeof balanceOptions==='function'?balanceOptions():{})}; } // 밸런스 AS 전투 보정(0187)
const rulesPct=x=>`×${Math.round(x*100)/100}`;
function rulesElemLine(e){ const m=rulesElemMat()[e]||{}, strong=Object.keys(m).filter(t=>m[t]>1), weak=Object.keys(m).filter(t=>(rulesElemMat()[t]||{})[e]>1);
  return [strong.length?`${strong.map(t=>`<b>${esc(t)}</b>`).join('·')}에 강함(${strong.map(t=>rulesPct(m[t])).join('·')})`:'',weak.length?`${weak.map(t=>`<b>${esc(t)}</b>`).join('·')}에 약함`:''].filter(Boolean).join(' · ')||'상성 없음'; }
function posTraitText(t){ return POS_TRAITS.filter(([k])=>+(t||{})[k]).map(([k,l])=>`${l.replace(/ %p?$/,'')} ${+t[k]>0?'+':''}${+t[k]}${k==='sp'?'':l.endsWith('%p')?'%p':'%'}`).join(' · '); }
function rulesCharHTML(c){ if(!c||c.npc) return ''; const r=RULESM(), syn=r.synergy, p=posOf(c), rd=(r.roleDesc||{})[c.role], ed=(G.meta.elems.find(e=>e.n===c.elem)||{}).d, rx=(r.reactions||[]).filter(x=>x.a===c.elem||x.b===c.elem),
    rel=(r.rel||[]).filter(x=>(x.by==='faction'&&x.a===c.faction)||(x.by==='role'&&x.a===c.role)||(x.by==='elem'&&x.a===c.elem)||(x.by==='pos'&&x.a===p.id));
  return `<div class="panel" style="margin:6px 0;padding:8px 10px;font-size:.82rem"><div>속성 <b style="color:${ECOL[c.elem]||'inherit'}">${esc(c.elem)}</b> — ${rulesElemLine(c.elem)}${ed?` <span class="muted">· ${esc(ed)}</span>`:''}</div>
    ${rx.length?`<div class="muted">반응: ${rx.map(x=>`${esc(x.a)}+${esc(x.b)} 「${esc(x.name||'반응')}」`).join(' · ')}</div>`:''}
    <div>포지션 <b>${esc(p.name)}</b> <span class="muted">(${esc(ROLE[p.base]||p.base)}형)</span>${p.desc||rd?` — <span class="muted">${esc(p.desc||rd)}</span>`:''}${posTraitText(p.t)?`<div class="muted">${esc(posTraitText(p.t))}</div>`:''}</div>
    ${c.faction?`<div>진영 <b>${esc(c.faction)}</b>${syn&&+syn.n>1&&(+syn.atk||+syn.def)?` — 같은 진영 ${+syn.n}명 이상 편성 시 공격 +${+syn.atk||0}% · 방어 +${+syn.def||0}%`:''}</div>`:''}
    ${rel.length?`<div class="muted">관계: ${rel.map(x=>`${esc(x.by==='pos'?(posById(x.b)||{}).name||x.b:x.b)} 상대로 ${rulesPct(+x.mul||1)}`).join(' · ')}</div>`:''}</div>`; }
function rulesPanel(){ const o=rulesOptions(), b=rulesBeats(), m=G.meta, P=POSITIONS();
  return `<div class="panel pm-hide"><h3>게임 규칙 (속성·포지션·능력치)</h3><p class="muted" style="margin:0 0 6px">속성 ${m.elems.length}개: ${m.elems.map(e=>b[e.n]?`${esc(e.n)}→${esc(b[e.n])}`:esc(e.n)).join(' · ')} (유리 ${rulesPct(o.elemAdv)}, 불리 ${rulesPct(o.elemDis)})${o.reactions.length?` · 반응 ${o.reactions.length}개`:''}. 포지션 ${P.length}개: ${P.map(p=>esc(p.name)).join('·')}. 속성 추가·제거, 상성표, 반응, 포지션 기능, 역할 능력치, 희귀도, 진영 시너지, 관계를 보고 고쳐요.</p><button class="btn sm" data-act="rulesopen">규칙 보기·편집</button></div>`; }

/* 편집 창: RD(초안)를 고치다가 저장할 때 게임에 반영 */
let RD=null;
function rulesDraft(){ const r=RULESM(), D=GGMCombat.RULE_DEFAULTS, b=rulesBeats(), grid=r.grid||{};
  return {elems:G.meta.elems.map(e=>({n:e.n,c:e.c,d:e.d||'',orig:e.n,beat:b[e.n]||''})),grid:JSON.parse(JSON.stringify(grid)),adv:r.elemAdv??'',dis:r.elemDis??'',aura:r.aura??'',
   reactions:JSON.parse(JSON.stringify(r.reactions||[])),positions:JSON.parse(JSON.stringify(POSITIONS())),roleDesc:{...(r.roleDesc||{})},roleBase:JSON.parse(JSON.stringify(r.roleBase||{})),rarityMul:JSON.parse(JSON.stringify(r.rarityMul||{})),
   synergy:{n:'',atk:'',def:'',...(r.synergy||{})},rel:JSON.parse(JSON.stringify(r.rel||[])),D}; }
function openRules(keep){ if(!keep||!RD) RD=rulesDraft(); const R=RD, D=R.D, E=R.elems.map(e=>e.n), num=(k,v,ph,step,w)=>`<input class="in" type="number" data-rk="${k}" value="${v??''}" placeholder="${ph??''}" ${step?`step="${step}"`:''} style="min-width:0;${w?`max-width:${w}px`:''}">`,
    sel=(k,v,opts,w)=>`<select class="in" data-rk="${k}" style="max-width:${w||110}px">${opts.map(([a,l])=>`<option value="${esc(a)}" ${String(v)===String(a)?'selected':''}>${esc(l)}</option>`).join('')}</select>`, txt=(k,v,ph,st)=>`<input class="in" data-rk="${k}" value="${esc(v||'')}" placeholder="${esc(ph||'')}" style="${st||''}">`;
  const adv=+R.adv||1.5, dis=+R.dis||.75, def=(a,t)=>{ const A=R.elems.find(e=>e.n===a), T=R.elems.find(e=>e.n===t); return A&&A.beat===t?adv:T&&T.beat===a?dis:1; };
  openModal(`${head('게임 규칙',`<span class="muted">비운 칸은 기본값 · 저장해야 반영</span>`)}
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
  <div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn sm ghost" data-act="rulesadd" data-k="pos">+ 포지션 추가</button><button class="btn sm ghost" data-act="rulesposassign">${esc(T('crew'))} 포지션 자동 배정</button></div>
  <h3 class="sec" style="margin-top:14px">전투 기본형 능력치</h3><p class="muted" style="font-size:.8rem;margin:0 0 6px">새로 만드는 ${esc(T('crew'))}의 R 기준 기본 능력치·속도(포지션 기능 % 적용 전).</p>
  ${Object.keys(ROLE).map(k=>`<div class="panel" style="padding:8px;margin:6px 0"><div class="row" style="gap:6px;flex-wrap:wrap"><b style="min-width:50px">${esc(ROLE[k])}형</b>${txt(`rd.${k}`,R.roleDesc[k],'설명','flex:1;min-width:140px')}</div><div class="g4" style="margin-top:4px">${RULE_STATS.map(([f,l])=>`<div><label class="f">${l}</label>${num(`rb.${k}.${f}`,(R.roleBase[k]||{})[f],f==='spd'?D.roleSpeed[k]:D.roleBase[k][f])}</div>`).join('')}</div></div>`).join('')}
  <label class="f">희귀도 배율 (R / SR / SSR)</label>${RULE_STATS.slice(0,3).map(([f,l])=>`<div class="g4" style="align-items:center;margin:2px 0"><span>${l}</span>${[0,1,2].map(i=>`<div>${num(`rm.${f}.${i}`,(R.rarityMul[f]||[])[i],D.rarityMul[f][i],'0.01')}</div>`).join('')}</div>`).join('')}
  <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-act="rulesrecalc">기존 ${esc(T('crew'))} 능력치 다시 계산</button></div>
  <h3 class="sec" style="margin-top:14px">진영 시너지</h3><p class="muted" style="font-size:.8rem;margin:0 0 6px">${(G.world.factions||[]).length?`진영: ${(G.world.factions||[]).map(f=>esc(f.name)).join(', ')}. `:''}같은 진영 n명 이상 편성 시 공격·방어 +% (0이면 끔).</p>
  <div class="g4"><div><label class="f">필요 인원</label>${num('syn.n',R.synergy.n,'0')}</div><div><label class="f">공격 +%</label>${num('syn.atk',R.synergy.atk,'0')}</div><div><label class="f">방어 +%</label>${num('syn.def',R.synergy.def,'0')}</div></div>
  <h3 class="sec" style="margin-top:14px">관계 배율</h3><p class="muted" style="font-size:.8rem;margin:0 0 6px">진영·역할·속성·포지션 A가 B를 공격할 때 피해 배율. 포지션은 이름으로 써요.</p>
  ${R.rel.map((x,i)=>`<div class="row" style="gap:4px;margin:4px 0;flex-wrap:wrap">${sel(`l.${i}.by`,x.by||'faction',[['faction','진영'],['role','기본형'],['elem','속성'],['pos','포지션']],90)}${txt(`l.${i}.a`,x.by==='pos'?(R.positions.find(p=>p.id===x.a)||{}).name||x.a:x.a,'공격하는 쪽','max-width:110px')}<span>→</span>${txt(`l.${i}.b`,x.by==='pos'?(R.positions.find(p=>p.id===x.b)||{}).name||x.b:x.b,'맞는 쪽','max-width:110px')}${num(`l.${i}.mul`,x.mul??1.2,'1.2','0.05',80)}<button class="btn sm ghost" data-act="rulesrdel" data-k="rel" data-i="${i}">삭제</button></div>`).join('')}
  <button class="btn sm ghost" data-act="rulesadd" data-k="rel">+ 관계 추가</button>
  <div class="row" style="margin-top:14px;flex-wrap:wrap"><button class="btn" data-act="rulessave">저장</button><button class="btn ghost" data-act="rulescodex">도감에 규칙 기록</button><button class="btn ghost" data-act="rulesai">AI로 설명 채우기</button><button class="btn ghost" data-act="close">닫기</button></div>`); }
function rulesRead(){ const R=RD; if(!R) return; document.querySelectorAll('#modal [data-rk]').forEach(el=>{ const p=el.dataset.rk.split('.'), v=el.type==='checkbox'?el.checked:el.value;
  if(p[0]==='e'){ R.elems[+p[1]][p[2]]=v; } else if(p[0]==='g'){ const a=p[1],t=p[2]; R.grid[a]=R.grid[a]||{}; if(v==='') delete R.grid[a][t]; else R.grid[a][t]=+v; }
  else if(p[0]==='r'){ const x=R.reactions[+p[1]]; x[p[2]]=['value','dur'].includes(p[2])?(v===''?'':+v):v; } else if(p[0]==='p'){ const x=R.positions[+p[1]]; if(p[2]==='t'){ x.t=x.t||{}; if(v===''||+v===0) delete x.t[p[3]]; else x.t[p[3]]=+v; } else x[p[2]]=v; }
  else if(p[0]==='rd') R.roleDesc[p[1]]=v; else if(p[0]==='rb'){ R.roleBase[p[1]]=R.roleBase[p[1]]||{}; if(v==='') delete R.roleBase[p[1]][p[2]]; else R.roleBase[p[1]][p[2]]=+v; }
  else if(p[0]==='rm'){ R.rarityMul[p[1]]=R.rarityMul[p[1]]||['','','']; R.rarityMul[p[1]][+p[2]]=v===''?'':+v; } else if(p[0]==='syn') R.synergy[p[1]]=v===''?'':+v;
  else if(p[0]==='l'){ const x=R.rel[+p[1]]; x[p[2]]=p[2]==='mul'?+v||1:v; } else R[p[0]]=v===''?'':+v; }); }
function rulesSave(){ rulesRead(); const R=RD, m=G.meta, r=RULESM();
  const names=R.elems.map(e=>String(e.n||'').trim().replace(/[<>"'&`.]/g,'').slice(0,4)); if(names.some(n=>!n)||new Set(names).size!==names.length){ toast('속성 이름이 비었거나 겹쳐요'); return false; }
  if(R.elems.length<2){ toast('속성은 2개 이상이어야 해요'); return false; }
  // 이름 바뀜·삭제 반영: 캐릭터·NPC·스테이지 적의 속성, 상성표·반응·관계
  const ren={}; R.elems.forEach((e,i)=>{ if(e.orig&&e.orig!==names[i]) ren[e.orig]=names[i]; }); const removed=m.elems.map(e=>e.n).filter(n=>!R.elems.some(e=>e.orig===n)), fall=names[0], mapE=n=>ren[n]||(removed.includes(n)?fall:n);
  if(Object.keys(ren).length||removed.length){ [...G.chars,...(G.npcs||[])].forEach(c=>{ const n=mapE(c.elem); if(n!==c.elem){ c.elem=n; if(G.chars.includes(c)) mark('c:'+c.id); } }); G.chapters.forEach(ch=>{ let ch2=false; (ch.stages||[]).forEach(st=>(st.enemies||[]).forEach(e=>{ const n=mapE(e.elem); if(n!==e.elem){ e.elem=n; ch2=true; } })); if(ch2) mark('ch:'+ch.id); }); }
  const keep=n=>names.includes(n); m.elems=R.elems.map((e,i)=>({n:names[i],c:HEXC.test(e.c)?e.c:'#999999',d:String(e.d||'').slice(0,80)}));
  r.beats={}; R.elems.forEach((e,i)=>{ const b=ren[e.beat]||e.beat; if(keep(b)&&b!==names[i]) r.beats[names[i]]=b; }); delete r.beatIdx;
  const g={}; Object.entries(R.grid).forEach(([a,row])=>{ const A=ren[a]||a; if(!keep(A)) return; Object.entries(row||{}).forEach(([t,v])=>{ const B=ren[t]||t; if(keep(B)&&+v>0){ g[A]=g[A]||{}; g[A][B]=+v; } }); }); r.grid=g;
  r.reactions=R.reactions.map(x=>({...x,a:ren[x.a]||x.a,b:ren[x.b]||x.b})).filter(x=>keep(x.a)&&keep(x.b)&&x.a!==x.b).map(x=>({a:x.a,b:x.b,name:String(x.name||'반응').slice(0,12),type:REACT_TYPES.some(([k])=>k===x.type)?x.type:'amp',value:+x.value||'',dur:+x.dur||'',both:!!x.both}));
  r.elemAdv=+R.adv||undefined; r.elemDis=+R.dis||undefined; r.aura=+R.aura||undefined;
  const ids=new Set(); m.positions=R.positions.map(p=>{ let id=p.id||'p_'+uid(); while(ids.has(id)) id='p_'+uid(); ids.add(id); return {id,name:String(p.name||'포지션').slice(0,10),base:ROLE[p.base]?p.base:'atk',desc:String(p.desc||'').slice(0,80),range:RANGE[p.range]?p.range:'',t:Object.fromEntries(Object.entries(p.t||{}).filter(([k,v])=>POS_TRAITS.some(([x])=>x===k)&&+v).map(([k,v])=>[k,Math.max(-90,Math.min(500,+v))]))}; }) /* 사거리(근접·원거리·지원)도 저장 */;
  G.chars.forEach(c=>{ const p=posById(c.pos)||POSITIONS().find(x=>x.base===c.role); if(p&&(c.pos!==p.id||c.role!==p.base)){ c.pos=p.id; c.role=p.base; mark('c:'+c.id); } });
  r.roleDesc={...R.roleDesc}; r.roleBase=R.roleBase; r.rarityMul={}; Object.entries(R.rarityMul).forEach(([f,a])=>{ if(a.some(x=>+x>0)) r.rarityMul[f]=a.map((x,i)=>+x>0?+x:GGMCombat.RULE_DEFAULTS.rarityMul[f][i]); });
  r.synergy={n:+R.synergy.n||0,atk:+R.synergy.atk||0,def:+R.synergy.def||0};
  const posId=n=>(m.positions.find(p=>p.name===n||p.id===n)||{}).id||n; r.rel=R.rel.map(x=>({by:x.by||'faction',a:x.by==='pos'?posId(x.a):x.by==='elem'?ren[x.a]||x.a:x.a,b:x.by==='pos'?posId(x.b):x.by==='elem'?ren[x.b]||x.b:x.b,mul:Math.max(0,+x.mul||1)})).filter(x=>x.a&&x.b);
  applyMeta(); mark('meta'); RD=null; return true; }
function rulesCodex(){ const w=G.world; if(!Array.isArray(w.codex)) w.codex=[]; const o=rulesOptions(), m=G.meta, r=RULESM(), b=rulesBeats();
  const up=(title,body)=>{ const x=w.codex.find(e=>e.title===title); if(x) x.body=body; else w.codex.push({cat:'term',title,body}); };
  up('[규칙] 속성 상성',`속성 ${m.elems.length}개. ${m.elems.map(e=>`${e.n}${e.d?`(${e.d})`:''}${b[e.n]?`은(는) ${b[e.n]}에 강하다`:''}`).join('. ')}. 유리하면 피해 ${rulesPct(o.elemAdv)}, 불리하면 ${rulesPct(o.elemDis)}.`);
  if(o.reactions.length) up('[규칙] 속성 반응',o.reactions.map(x=>`${x.a}+${x.b} 「${x.name}」: ${(REACT_TYPES.find(([k])=>k===x.type)||['',''])[1]} ${x.value||''}`).join('. '));
  up('[규칙] 포지션',POSITIONS().map(p=>`${p.name}(${ROLE[p.base]}형)${p.desc?': '+p.desc:''}${posTraitText(p.t)?' — '+posTraitText(p.t):''}`).join(' / '));
  if(r.synergy&&+r.synergy.n>1) up('[규칙] 진영 시너지',`같은 진영 ${r.synergy.n}명 이상이 함께 싸우면 공격 +${r.synergy.atk||0}%, 방어 +${r.synergy.def||0}%.`);
  if((r.rel||[]).length) up('[규칙] 관계',r.rel.map(x=>`${x.by==='pos'?(posById(x.a)||{}).name||x.a:x.a} → ${x.by==='pos'?(posById(x.b)||{}).name||x.b:x.b} ${rulesPct(+x.mul||1)}`).join(', '));
  mark('world'); toast('도감에 규칙을 기록했어요'); }
async function rulesAIData(btn){ const m=G.meta; return aiJSON(rulesAIDataPrompt({m}),btn,'quick'); }
async function rulesAI(btn){ rulesRead(); const res=await rulesAIData(btn); if(!res||!RD) return; (res.elems||[]).forEach((d,i)=>{ if(d&&RD.elems[i]) RD.elems[i].d=String(d).slice(0,80); }); Object.entries(res.roles||{}).forEach(([k,d])=>{ if(d&&ROLE[k]) RD.roleDesc[k]=String(d).slice(0,80); }); openRules(true); toast('설명을 채웠어요. 저장을 눌러 주세요'); }
async function rulesAIFill(){ const res=await rulesAIData(null); if(!res) return false; const r=RULESM(); r.roleDesc=r.roleDesc||{};
  (res.elems||[]).forEach((d,i)=>{ if(d&&G.meta.elems[i]&&!G.meta.elems[i].d) G.meta.elems[i].d=String(d).slice(0,80); }); Object.entries(res.roles||{}).forEach(([k,d])=>{ if(d&&ROLE[k]&&!r.roleDesc[k]) r.roleDesc[k]=String(d).slice(0,80); }); mark('meta'); return true; }
function rulesMissingDesc(){ return G.meta.elems.some(e=>!e.d)||Object.keys(ROLE).some(k=>!((G.meta.rules||{}).roleDesc||{})[k]); }
function rulesNotInCodex(){ return !(G.world.codex||[]).some(x=>x.title==='[규칙] 속성 상성'); }
function posClean(list){ return (Array.isArray(list)?list:[]).slice(0,10).map(p=>({id:'p_'+uid(),name:String(p.name||'포지션').slice(0,10),base:ROLE[p.base]?p.base:'atk',desc:String(p.desc||'').slice(0,80),range:RANGE[p.range]?p.range:'',t:Object.fromEntries(POS_TRAITS.map(([k])=>[k,Math.max(-80,Math.min(150,Math.round(+((p.t||{})[k])||0)))]).filter(([,v])=>v))})).filter(p=>p.name); }
async function rulesPosAI(btn){ rulesRead(); const r=await aiJSON(rulesPosAIPrompt(),btn,'default'); const L=posClean(r&&r.positions); if(!L.length) return; RD.positions=L; openRules(true); toast(`포지션 ${L.length}개를 설계했어요. 저장을 눌러 주세요`); }
async function rulesRecalc(){ if(!(await appConfirm(`기본형·희귀도 기준으로 모든 ${T('crew')}의 체력·공격·방어·속도를 다시 계산할까요? 직접 고친 능력치도 바뀌어요(이격은 원본 비율을 따라가요).`))) return; if(!rulesSave()) return;
  let n=0; for(const c of G.chars){ if(c.alt) continue; const s=GGMCombat.generateBaseStats(c); Object.assign(c,{hp:s.hp,atk:s.atk,def:s.def,spd:s.spd}); mark('c:'+c.id); n++; } toast(`${n}명의 능력치를 다시 계산했어요`); openRules(); }
function rulesPosAssign(){ rulesRead(); const P=RD.positions; let n=0; G.chars.forEach(c=>{ if(P.some(p=>p.id===c.pos)) return; const cand=P.filter(p=>p.base===c.role); if(!cand.length) return; c.pos=cand[hashN(c.id)%cand.length].id; mark('c:'+c.id); n++; }); toast(`${n}명에게 포지션을 배정했어요(기본형이 같은 포지션 중에서). 캐릭터 편집에서 바꿀 수 있어요`); }
document.addEventListener('click',e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act;
  if(a==='rulesopen') openRules();
  else if(a==='rulessave'){ if(rulesSave()){ closeModal(); render(); toast('게임 규칙을 저장했어요'); } }
  else if(a==='rulescodex'){ if(rulesSave()){ rulesCodex(); openRules(); } }
  else if(a==='rulesai') rulesAI(el);
  else if(a==='rulesposai') rulesPosAI(el);
  else if(a==='rulesrecalc') rulesRecalc();
  else if(a==='rulesposassign'){ rulesPosAssign(); }
  else if(a==='rulespreset'){ rulesRead(); RD.positions=POS_PRESETS[el.dataset.k].map(([name,base,desc,t])=>({id:'p_'+uid(),name:el.dataset.k==='basic'?ROLE[base]:name,base,desc,t:{...t},range:POS_RANGE[el.dataset.k==='basic'?ROLE[base]:name]||''})); openRules(true); }
  else if(a==='rulesadd'){ rulesRead(); const k=el.dataset.k, E=RD.elems.map(x=>x.n);
    if(k==='elem'&&RD.elems.length<8){ let n='속성'+(RD.elems.length+1); RD.elems.push({n,c:'#'+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0'),d:'',orig:'',beat:''}); }
    else if(k==='reaction') RD.reactions.push({a:E[0],b:E[1],name:'반응',type:'amp',value:1.5});
    else if(k==='pos') RD.positions.push({id:'p_'+uid(),name:'새 포지션',base:'atk',desc:'',t:{}});
    else if(k==='rel') RD.rel.push({by:'faction',a:'',b:'',mul:1.2}); openRules(true); }
  else if(a==='rulesedel'){ rulesRead(); const gone=RD.elems.splice(+el.dataset.i,1)[0]; RD.elems.forEach(x=>{ if(x.beat===gone.n) x.beat=''; }); openRules(true); }
  else if(a==='rulesrdel'){ rulesRead(); RD[el.dataset.k].splice(+el.dataset.i,1); openRules(true); } });
