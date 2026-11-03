/* ===== 게임 규칙: 속성 상성 · 역할(포지션) 기본 능력치 · 희귀도 배율 · 진영 시너지 · 관계 배율 ===== */
/* 전에는 전투 엔진 안에 고정돼 있어서 볼 수도 고칠 수도 없었어요. 이제 G.meta.rules에 저장하고(비우면 기본값),
   applyMeta() → rulesApply()로 BEATS·GGMCombat 표에 반영, v2Options() → rulesOptions()로 전투·밸런스 검사에 넘겨요.
   문서: docs/research/game-rules.md */
function RULESM(){ if(!G.meta.rules||typeof G.meta.rules!=='object') G.meta.rules={}; return G.meta.rules; }
const RULE_STATS=[['hp','체력'],['atk','공격'],['def','방어'],['spd','속도']], RULE_RAR=['R','SR','SSR'];
function rulesBeatIdx(){ const b=RULESM().beatIdx; return Array.isArray(b)&&b.length===3&&b.every((x,i)=>Number.isInteger(+x)&&+x>=0&&+x<3&&+x!==i)?b.map(Number):[1,2,0]; }
function rulesApply(){ const m=G.meta, idx=rulesBeatIdx(); Object.keys(BEATS).forEach(k=>delete BEATS[k]); m.elems.forEach((e,i)=>{ BEATS[e.n]=m.elems[idx[i]].n; }); GGMCombat.applyRules(RULESM()); }
function rulesOptions(){ const r=G.meta.rules||{}; return {elemAdv:+r.elemAdv||1.5,elemDis:+r.elemDis||.75,synergy:r.synergy||null,rel:Array.isArray(r.rel)?r.rel:[]}; }
const rulesPct=x=>`×${Math.round(x*100)/100}`;
function rulesElemLine(e){ const o=rulesOptions(), win=BEATS[e], lose=Object.keys(BEATS).find(k=>BEATS[k]===e); return `${win?`<b>${esc(win)}</b>에 강함(${rulesPct(o.elemAdv)})`:''}${lose?` · <b>${esc(lose)}</b>에 약함(${rulesPct(o.elemDis)})`:''}`; }
function rulesCharHTML(c){ if(!c||c.npc) return ''; const r=RULESM(), syn=r.synergy, rd=(r.roleDesc||{})[c.role], ed=(G.meta.elems.find(e=>e.n===c.elem)||{}).d, rel=(r.rel||[]).filter(x=>(x.by==='faction'&&x.a===c.faction)||(x.by==='role'&&x.a===c.role)||(x.by==='elem'&&x.a===c.elem));
  return `<div class="panel" style="margin:6px 0;padding:8px 10px;font-size:.82rem"><div>속성 <b style="color:${ECOL[c.elem]||'inherit'}">${esc(c.elem)}</b> — ${rulesElemLine(c.elem)}${ed?` <span class="muted">· ${esc(ed)}</span>`:''}</div>
    <div>역할 <b>${esc(ROLE[c.role]||c.role)}</b>${rd?` — <span class="muted">${esc(rd)}</span>`:''}</div>
    ${c.faction?`<div>진영 <b>${esc(c.faction)}</b>${syn&&+syn.n>1&&(+syn.atk||+syn.def)?` — 같은 진영 ${+syn.n}명 이상 편성 시 공격 +${+syn.atk||0}% · 방어 +${+syn.def||0}%`:''}</div>`:''}
    ${rel.length?`<div class="muted">관계: ${rel.map(x=>`${esc(x.b)} 상대로 ${rulesPct(+x.mul||1)}`).join(' · ')}</div>`:''}</div>`; }
function rulesPanel(){ const o=rulesOptions(), idx=rulesBeatIdx(), m=G.meta;
  return `<div class="panel pm-hide"><h3>게임 규칙 (상성·능력치)</h3><p class="muted" style="margin:0 0 6px">속성 상성: ${m.elems.map((e,i)=>`${esc(e.n)} → ${esc(m.elems[idx[i]].n)}`).join(' · ')} (유리 ${rulesPct(o.elemAdv)}, 불리 ${rulesPct(o.elemDis)}). 역할 기본 능력치, 희귀도 배율, 진영 시너지, 진영·역할·속성 관계 배율을 보고 고쳐요.</p><button class="btn sm" data-act="rulesopen">규칙 보기·편집</button></div>`; }
function openRules(){ const r=RULESM(), m=G.meta, o=rulesOptions(), idx=rulesBeatIdx(), D=GGMCombat.RULE_DEFAULTS, syn=r.synergy||{}, facs=(G.world.factions||[]).map(f=>f.name).filter(Boolean);
  const num=(id,v,ph,step)=>`<input class="in" type="number" id="${id}" value="${v??''}" placeholder="${ph??''}" ${step?`step="${step}"`:''} style="min-width:0">`;
  RULES_REL=(r.rel||[]).map(x=>({...x}));
  openModal(`${head('게임 규칙',`<span class="muted">비운 칸은 기본값</span>`)}
  <h3 class="sec">속성 상성</h3><p class="muted" style="font-size:.8rem;margin:0 0 6px">공격하는 쪽 속성이 맞는 쪽 속성을 이기면 유리 배율, 지면 불리 배율로 피해가 바뀌어요. 이름·색은 여기서도 바꿀 수 있어요.</p>
  ${m.elems.map((e,i)=>`<div class="row" style="gap:6px;align-items:center;margin:4px 0;flex-wrap:wrap"><input class="in" id="ru_en${i}" value="${esc(e.n)}" maxlength="4" style="max-width:70px"><input type="color" id="ru_ec${i}" value="${esc(e.c)}"><span>이기는 속성</span><select class="in" id="ru_eb${i}" style="max-width:90px">${m.elems.map((x,j)=>j===i?'':`<option value="${j}" ${idx[i]===j?'selected':''}>${esc(x.n)}</option>`).join('')}</select><input class="in" id="ru_ed${i}" value="${esc(e.d||'')}" placeholder="설명 (도감·캐릭터 화면에 표시)" style="flex:1;min-width:140px"></div>`).join('')}
  <div class="g2"><div><label class="f">유리 배율</label>${num('ru_adv',r.elemAdv,'1.5','0.05')}</div><div><label class="f">불리 배율</label>${num('ru_dis',r.elemDis,'0.75','0.05')}</div></div>
  <h3 class="sec" style="margin-top:14px">역할(포지션)</h3><p class="muted" style="font-size:.8rem;margin:0 0 6px">새로 만드는 ${esc(T('crew'))}의 기본 능력치(R 기준)와 속도예요. 이미 있는 ${esc(T('crew'))}은(는) 아래 버튼으로 다시 계산할 수 있어요.</p>
  ${Object.keys(ROLE).map(k=>`<div class="panel" style="padding:8px;margin:6px 0"><div class="row" style="gap:6px;flex-wrap:wrap"><input class="in" id="ru_rn_${k}" value="${esc(ROLE[k])}" style="max-width:100px"><input class="in" id="ru_rd_${k}" value="${esc((r.roleDesc||{})[k]||'')}" placeholder="역할 설명" style="flex:1;min-width:140px"></div><div class="g4" style="margin-top:4px">${RULE_STATS.map(([f,l])=>`<div><label class="f">${l}</label>${num(`ru_rb_${k}_${f}`,((r.roleBase||{})[k]||{})[f],f==='spd'?D.roleSpeed[k]:D.roleBase[k][f])}</div>`).join('')}</div></div>`).join('')}
  <label class="f">희귀도 배율 (R / SR / SSR)</label>${RULE_STATS.slice(0,3).map(([f,l])=>`<div class="g4" style="align-items:center;margin:2px 0"><span>${l}</span>${[0,1,2].map(i=>`<div>${num(`ru_rm_${f}_${i}`,((r.rarityMul||{})[f]||[])[i],D.rarityMul[f][i],'0.01')}</div>`).join('')}</div>`).join('')}
  <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-act="rulesrecalc">기존 ${esc(T('crew'))} 능력치 다시 계산</button></div>
  <h3 class="sec" style="margin-top:14px">진영</h3><p class="muted" style="font-size:.8rem;margin:0 0 6px">${facs.length?`진영: ${facs.map(esc).join(', ')} (이름·설명은 세계관 편집과 도감에서).`:'세계관에 진영이 없어요.'} 같은 진영을 여러 명 편성하면 능력치가 올라요(0이면 끔).</p>
  <div class="g4"><div><label class="f">필요 인원</label>${num('ru_sn',syn.n,'0')}</div><div><label class="f">공격 +%</label>${num('ru_sa',syn.atk,'0')}</div><div><label class="f">방어 +%</label>${num('ru_sd',syn.def,'0')}</div></div>
  <h3 class="sec" style="margin-top:14px">관계 배율</h3><p class="muted" style="font-size:.8rem;margin:0 0 6px">진영·역할·속성 A가 B를 공격할 때 피해 배율(예: 진영 「새벽등대」 → 「헬릭스」 ×1.2, 역할 공격 → 지원 ×1.1). 속성 상성과 곱해져요.</p>
  <div id="ru_rel">${RULES_REL.map(rulesRelRow).join('')}</div><button class="btn sm ghost" data-act="rulesreladd">+ 관계 추가</button>
  <div class="row" style="margin-top:14px;flex-wrap:wrap"><button class="btn" data-act="rulessave">저장</button><button class="btn ghost" data-act="rulescodex">도감에 규칙 기록</button><button class="btn ghost" data-act="rulesai">AI로 설명 채우기</button><button class="btn ghost" data-act="close">닫기</button></div>`); }
let RULES_REL=[];
function rulesRelRow(x,i){ return `<div class="row" data-rel="${i}" style="gap:4px;margin:4px 0;flex-wrap:wrap"><select class="in" data-rf="by" style="max-width:90px">${[['faction','진영'],['role','역할'],['elem','속성']].map(([k,l])=>`<option value="${k}" ${x.by===k?'selected':''}>${l}</option>`).join('')}</select><input class="in" data-rf="a" value="${esc(x.a||'')}" placeholder="공격하는 쪽" style="max-width:120px"><span>→</span><input class="in" data-rf="b" value="${esc(x.b||'')}" placeholder="맞는 쪽" style="max-width:120px"><input class="in" type="number" step="0.05" data-rf="mul" value="${x.mul??1.2}" style="max-width:80px"><button class="btn sm ghost" data-act="rulesreldel" data-i="${i}">삭제</button></div>`; }
function rulesReadRel(){ return [...document.querySelectorAll('#ru_rel [data-rel]')].map(d=>{ const v=k=>String(d.querySelector(`[data-rf="${k}"]`)?.value||'').trim(); return {by:v('by')||'faction',a:v('a'),b:v('b'),mul:Math.max(0,+v('mul')||1)}; }); }
function rulesSave(){ const r=RULESM(), m=G.meta, v=id=>{ const el=$('#'+id); return el&&el.value!==''?+el.value:null; }, s=id=>String(($('#'+id)||{}).value||'').trim();
  const names=m.elems.map((e,i)=>s('ru_en'+i).replace(/[<>"'&`]/g,'').slice(0,4)||e.n); if(new Set(names).size<3){ toast('속성 이름이 겹쳐요'); return false; }
  m.elems=m.elems.map((e,i)=>({n:names[i],c:HEXC.test(s('ru_ec'+i))?s('ru_ec'+i):e.c,d:s('ru_ed'+i)}));
  r.beatIdx=[0,1,2].map(i=>+(($('#ru_eb'+i)||{}).value??[1,2,0][i])); if(new Set(r.beatIdx).size<3) toast('같은 속성을 두 속성이 이기도록 정했어요(괜찮지만 한 속성은 아무도 못 이겨요)');
  r.elemAdv=v('ru_adv')||undefined; r.elemDis=v('ru_dis')||undefined;
  r.roleDesc={}; r.roleBase={}; Object.keys(ROLE).forEach(k=>{ const n=s('ru_rn_'+k); if(n) m.roles[k]=n.slice(0,8); r.roleDesc[k]=s('ru_rd_'+k); r.roleBase[k]={}; RULE_STATS.forEach(([f])=>{ const x=v(`ru_rb_${k}_${f}`); if(x>0) r.roleBase[k][f]=x; }); });
  r.rarityMul={}; ['hp','atk','def'].forEach(f=>{ const a=[0,1,2].map(i=>v(`ru_rm_${f}_${i}`)); if(a.some(x=>x>0)) r.rarityMul[f]=a.map((x,i)=>x>0?x:GGMCombat.RULE_DEFAULTS.rarityMul[f][i]); });
  r.synergy={n:v('ru_sn')||0,atk:v('ru_sa')||0,def:v('ru_sd')||0}; r.rel=rulesReadRel().filter(x=>x.a&&x.b);
  applyMeta(); mark('meta'); return true; }
function rulesCodex(){ const w=G.world; if(!Array.isArray(w.codex)) w.codex=[]; const o=rulesOptions(), m=G.meta, r=RULESM();
  const up=(title,body)=>{ const x=w.codex.find(e=>e.title===title); if(x) x.body=body; else w.codex.push({cat:'term',title,body}); };
  up('[규칙] 속성 상성',`${m.elems.map(e=>`${e.n}${e.d?`(${e.d})`:''}은(는) ${BEATS[e.n]}에 강하다`).join('. ')}. 유리하면 피해 ${rulesPct(o.elemAdv)}, 불리하면 ${rulesPct(o.elemDis)}.`);
  up('[규칙] 역할',Object.keys(ROLE).map(k=>`${ROLE[k]}${(r.roleDesc||{})[k]?': '+r.roleDesc[k]:''}`).join(' / '));
  if(r.synergy&&+r.synergy.n>1) up('[규칙] 진영 시너지',`같은 진영 ${r.synergy.n}명 이상이 함께 싸우면 공격 +${r.synergy.atk||0}%, 방어 +${r.synergy.def||0}%.`);
  if((r.rel||[]).length) up('[규칙] 관계',r.rel.map(x=>`${x.a} → ${x.b} ${rulesPct(+x.mul||1)}`).join(', '));
  mark('world'); toast('도감에 규칙을 기록했어요'); }
async function rulesAIData(btn){ const m=G.meta; return aiJSON(`${RULES}\n${ctx()}\n\n이 게임의 속성 3개(${m.elems.map(e=>e.n).join(', ')})와 역할 3개(${Object.keys(ROLE).map(k=>`${k}=${ROLE[k]}`).join(', ')})에 세계관에 맞는 한 줄 설명을 붙여라. 속성은 무엇을 상징하고 왜 그 상성이 되는지(${m.elems.map(e=>`${e.n}→${BEATS[e.n]}`).join(', ')})를 담는다.\nJSON만 출력: {"elems":["${m.elems[0].n} 설명","${m.elems[1].n} 설명","${m.elems[2].n} 설명"],"roles":{"atk":"설명","def":"설명","sup":"설명"}}`,btn,'quick'); }
async function rulesAI(btn){ const res=await rulesAIData(btn);
  if(!res) return; (res.elems||[]).forEach((d,i)=>{ const el=$('#ru_ed'+i); if(el&&d) el.value=String(d).slice(0,80); }); Object.entries(res.roles||{}).forEach(([k,d])=>{ const el=$('#ru_rd_'+k); if(el&&d) el.value=String(d).slice(0,80); }); toast('설명을 채웠어요. 저장을 눌러 주세요'); }
async function rulesAIFill(){ const res=await rulesAIData(null); if(!res) return false; const r=RULESM(); r.roleDesc=r.roleDesc||{};
  (res.elems||[]).forEach((d,i)=>{ if(d&&G.meta.elems[i]&&!G.meta.elems[i].d) G.meta.elems[i].d=String(d).slice(0,80); }); Object.entries(res.roles||{}).forEach(([k,d])=>{ if(d&&ROLE[k]&&!r.roleDesc[k]) r.roleDesc[k]=String(d).slice(0,80); }); mark('meta'); return true; }
function rulesMissingDesc(){ return G.meta.elems.some(e=>!e.d)||Object.keys(ROLE).some(k=>!((G.meta.rules||{}).roleDesc||{})[k]); }
function rulesNotInCodex(){ return !(G.world.codex||[]).some(x=>x.title==='[규칙] 속성 상성'); }
async function rulesRecalc(){ if(!(await appConfirm(`역할·희귀도 기준으로 모든 ${T('crew')}의 체력·공격·방어·속도를 다시 계산할까요? 직접 고친 능력치도 바뀌어요(이격은 원본 비율을 따라가요).`))) return; if(!rulesSave()) return;
  let n=0; for(const c of G.chars){ if(c.alt) continue; const s=GGMCombat.generateBaseStats(c); Object.assign(c,{hp:s.hp,atk:s.atk,def:s.def,spd:s.spd}); mark('c:'+c.id); n++; } toast(`${n}명의 능력치를 다시 계산했어요`); openRules(); }
document.addEventListener('click',e=>{ const b=e.target.closest('[data-act]'); if(!b) return; const a=b.dataset.act;
  if(a==='rulesopen') openRules();
  else if(a==='rulessave'){ if(rulesSave()){ closeModal(); render(); toast('게임 규칙을 저장했어요'); } }
  else if(a==='rulescodex'){ if(rulesSave()) rulesCodex(); }
  else if(a==='rulesai') rulesAI(b);
  else if(a==='rulesrecalc') rulesRecalc();
  else if(a==='rulesreladd'){ RULES_REL=[...rulesReadRel(),{by:'faction',a:'',b:'',mul:1.2}]; $('#ru_rel').innerHTML=RULES_REL.map(rulesRelRow).join(''); }
  else if(a==='rulesreldel'){ RULES_REL=rulesReadRel(); RULES_REL.splice(+b.dataset.i,1); $('#ru_rel').innerHTML=RULES_REL.map(rulesRelRow).join(''); } });
