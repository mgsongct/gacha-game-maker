/* ===== 0185-rules — Controller(동작을 받아 Model을 바꾸고 다시 그리게 함 · 섞인 함수는 나눌 것) ===== */
/* src/main/0185-rules/0185-game-rules.js에서 옮김 */
function rulesSave(){ rulesRead(); const R=RD, m=G.meta, r=gameSlot('meta.rules');
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
function rulesCodex(){ const o=rulesOptions(), m=G.meta, r=RULESM(), b=rulesBeats(), up=(title,body)=>cxUpsert(title,body);
  up('[규칙] 속성 상성',`속성 ${m.elems.length}개. ${m.elems.map(e=>`${e.n}${e.d?`(${e.d})`:''}${b[e.n]?`은(는) ${b[e.n]}에 강하다`:''}`).join('. ')}. 유리하면 피해 ${rulesPct(o.elemAdv)}, 불리하면 ${rulesPct(o.elemDis)}.`);
  if(o.reactions.length) up('[규칙] 속성 반응',o.reactions.map(x=>`${x.a}+${x.b} 「${x.name}」: ${(REACT_TYPES.find(([k])=>k===x.type)||['',''])[1]} ${x.value||''}`).join('. '));
  up('[규칙] 포지션',POSITIONS().map(p=>`${p.name}(${ROLE[p.base]}형)${p.desc?': '+p.desc:''}${posTraitText(p.t)?' — '+posTraitText(p.t):''}`).join(' / '));
  if(r.synergy&&+r.synergy.n>1) up('[규칙] 진영 시너지',`같은 진영 ${r.synergy.n}명 이상이 함께 싸우면 공격 +${r.synergy.atk||0}%, 방어 +${r.synergy.def||0}%.`);
  if((r.rel||[]).length) up('[규칙] 관계',r.rel.map(x=>`${x.by==='pos'?(posById(x.a)||{}).name||x.a:x.a} → ${x.by==='pos'?(posById(x.b)||{}).name||x.b:x.b} ${rulesPct(+x.mul||1)}`).join(', '));
  mark('world'); toast('도감에 규칙을 기록했어요'); }
async function rulesAI(rep){ rulesRead(); const res=await rulesAIData(rep); if(!res||!RD) return; (res.elems||[]).forEach((d,i)=>{ if(d&&RD.elems[i]) RD.elems[i].d=String(d).slice(0,80); }); Object.entries(res.roles||{}).forEach(([k,d])=>{ if(d&&ROLE[k]) RD.roleDesc[k]=String(d).slice(0,80); }); openRules(true); toast('설명을 채웠어요. 저장을 눌러 주세요'); }
async function rulesPosAI(rep){ rulesRead(); const r=await aiJSON(rulesPosAIPrompt(),rep,'default'); const L=posClean(r&&r.positions); if(!L.length) return; RD.positions=L; openRules(true); toast(`포지션 ${L.length}개를 설계했어요. 저장을 눌러 주세요`); }
async function rulesRecalc(){ if(!(await appConfirm(`기본형·희귀도 기준으로 모든 ${T('crew')}의 체력·공격·방어·속도를 다시 계산할까요? 직접 고친 능력치도 바뀌어요(이격은 원본 비율을 따라가요).`))) return; if(!rulesSave()) return;
  let n=0; for(const c of G.chars){ if(c.alt) continue; const s=GGMCombat.generateBaseStats(c); Object.assign(c,{hp:s.hp,atk:s.atk,def:s.def,spd:s.spd}); mark('c:'+c.id); n++; } toast(`${n}명의 능력치를 다시 계산했어요`); openRules(); }
function rulesPosAssign(){ rulesRead(); const n=posSpread(RD.positions); toast(`${n}명에게 포지션을 배정했어요(기본형이 같은 포지션 중에서). 캐릭터 편집에서 바꿀 수 있어요`); }
/* src/main/0185-rules/0187-balance.js에서 옮김 */
function balSave(){ const v=id=>+(($('#'+id)||{}).value), m=G.meta; m.balance=Object.assign(m.balance||{},{creep:$('#bal_creep').value,baseGen:Math.max(1,Math.min(5,v('bal_base')||1)),per:Math.max(1,v('bal_per')||5),maxGen:Math.max(1,Math.min(5,v('bal_max')||5)),released:Math.max(0,v('bal_rel')||0),catchUp:$('#bal_as').value,pct:Math.max(0,v('bal_pct')||0),max:Math.max(0,v('bal_cap')||0),lag:Math.max(0,Math.min(4,v('bal_lag')||0)),tol:Math.max(1,v('bal_tol')||15),autoNorm:$('#bal_auto').checked}); mark('meta'); }
async function balFix(kind){ const ids=[...document.querySelectorAll('[data-bal]:checked')].map(x=>x.dataset.bal), cs=ids.map(charById).filter(Boolean); if(!cs.length){ toast('캐릭터를 골라 주세요'); return; }
  const label={edge:'능력치 범위 안으로',center:'능력치 기준값으로',remaster:'세대 맞추기',skill:'스킬 밸런스 재검사'}[kind]; auditSnap(cs,label); let n=0;
  for(const c of cs){ let ok=false; if(kind==='edge'||kind==='center') ok=balNormalize(c,kind); else if(kind==='remaster'){ syBar(`${c.name} 리마스터 중…`); ok=await balRemasterAI(c,m=>syBar(`${c.name}: ${m}`)); syBar(''); } else if(kind==='skill'){ c.skillBalance=null; ok=true; } if(ok){ mark('c:'+c.id); n++; } }
  if(kind==='skill'||kind==='remaster'){ syBar('스킬 밸런스 검사 중…'); try{ await v2ReadyChars(cs.filter(c=>!c.skillBalance)); }catch(e){ quietErr(e,'0187-balance.js:44'); } syBar(''); }
  toast(`${label}: ${n}명 (되돌리기 가능)`); openBalance(); }
/* src/main/0185-rules/0240-growth-curve.js에서 옮김 */
function readChForm(){
  chDraft.title=$('#ch_title').value.trim()||chDraft.title;
  chDraft.stages.forEach((s,j)=>{s.title=$('#st_t_'+j).value.trim()||s.title;s.reward=num($('#st_r_'+j).value,0,99999,300);
    const en=parseEnemies($('#st_e_'+j).value), old=s.enemies||[]; en.forEach((e,i)=>{ const o=old[i]; e.manual=o&&o.name===e.name&&o.elem===e.elem&&o.hp===e.hp&&o.atk===e.atk&&o.def===e.def&&o.spd===e.spd?!!o.manual:true; if(o&&o.look&&!e.look) e.look=o.look;if(o&&o.pattern)e.pattern=o.pattern;if(o&&o.skills)e.skills=o.skills; }); if(JSON.stringify(en)!==JSON.stringify(old))delete s.combatBalance;s.enemies=en.length?en:s.enemies; s.pre=$('#st_pre_'+j).value; s.post=$('#st_post_'+j).value;
    const sto=$('#st_s_'+j); if(sto){ if(sto.checked){ s.story=true; } else { delete s.story; if(!s.enemies.length) s.enemies=[{name:'적',elem:ELEMS[0],hp:900,atk:80,def:35,spd:95,boss:false}]; } } });
}
async function aiChapterGen(dir,n,cast){ const snap=artSnap(); const r=await aiChapterGen0(dir,n,cast); if(r) artAfterAI(snap,'새 이야기 「'+r.ch.title+'」'); return r; }
