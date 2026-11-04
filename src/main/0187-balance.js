/* ===== 밸런스 관리: 파워 인플레(세대) 제어 · 능력치 균질화 · 구캐릭터 AS ===== */
/* 문제: ① 새 캐릭터는 지금 "출시 세대"로 만들어져 세대가 오를수록 스킬 예산이 커져요(1세대 ×1 → 5세대 ×2.1) → 오래된 캐릭터가 구식이 됨
         ② AI가 쓴 능력치는 범위만 맞춰서(체력 600~2000 등) 같은 희귀도끼리도 들쭉날쭉
   G.meta.balance: creep(manual|fixed|auto) baseGen per maxGen released · catchUp(off|boost|remaster) pct max lag · tol(허용 편차 %) autoNorm(생성 시 보정)
   문서: docs/research/balance.md */
function BAL(){ const d={creep:'manual',baseGen:1,per:5,maxGen:5,released:0,catchUp:'off',pct:8,max:30,lag:1,tol:15,autoNorm:true}; return Object.assign({},d,gameRead('meta.balance')); } // 읽기(기본값 위에 바꾼 값) — 바꿀 때는 gameSlot('meta.balance')
function balanceGeneration(){ const b=BAL(); if(b.creep==='fixed') return Math.max(1,Math.min(5,+b.baseGen||1)); if(b.creep==='auto') return Math.max(1,Math.min(+b.maxGen||5,(+b.baseGen||1)+Math.floor((+b.released||0)/Math.max(1,+b.per||5)))); return null; }
function balanceOptions(){ const b=BAL(); return b.catchUp==='boost'?{genBoost:{cur:v2CurrentGeneration(),pct:+b.pct||0,max:+b.max||0}}:{}; }
const balPower=s=>Math.round(s.hp/5+s.atk*3+s.def*2+s.spd); // 캐릭터 화면 전투력과 같은 식(성장 전 기본값)
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

function balancePanel(){ const b=BAL(), R=balReport(), out=R.filter(x=>x.statOut).length, lag=R.filter(x=>x.genLag).length;
  const creepL={manual:'수동(시즌 설정)',fixed:`고정 ${b.baseGen}세대`,auto:`자동 상승(${b.per}명마다, 최대 ${b.maxGen})`}[b.creep], asL={off:'끔',boost:`전투 보정 세대당 +${b.pct}%`,remaster:'리마스터'}[b.catchUp];
  return `<div class="panel pm-hide"><h3>밸런스 관리 ${out||lag?`<span class="badge">점검 ${out+lag}</span>`:''}</h3><p class="muted" style="margin:0 0 6px">현재 출시 세대 ${v2CurrentGeneration()} · 세대 정책 ${esc(creepL)} · 구캐릭터 AS ${esc(asL)} · 능력치 허용 ±${b.tol}%${out?` · 범위 밖 ${out}명`:''}${lag?` · 세대 뒤처짐 ${lag}명`:''}</p><button class="btn sm" data-act="balopen">밸런스 점검·설정</button></div>`; }
function openBalance(){ const b=BAL(), R=balReport(), num=(id,v,min,max,step)=>`<input class="in" type="number" id="${id}" value="${v}" min="${min}" max="${max}" ${step?`step="${step}"`:''}>`, cur=v2CurrentGeneration();
  const byR=[3,2,1].map(r=>{ const L=R.filter(x=>x.c.rarity===r); if(!L.length) return ''; const d=L.map(x=>x.dev*100); return `<tr><td>${RL[r]}</td><td>${L.length}</td><td>${Math.round(Math.min(...d))}% ~ ${Math.round(Math.max(...d))}%</td><td>${Math.min(...L.map(x=>x.gen))} ~ ${Math.max(...L.map(x=>x.gen))}</td></tr>`; }).join('');
  openModal(`${head('밸런스 점검·설정',`<span class="muted">현재 출시 세대 ${cur}</span>`)}
  <h3 class="sec">세대(파워 인플레) 정책</h3><p class="muted" style="font-size:.8rem;margin:0 0 6px">세대가 높을수록 스킬 예산이 커져요(1세대 ×1 → 5세대 ×2.1). 새 캐릭터는 그때의 세대로 만들어지고 계속 그 세대로 남아요.</p>
  <select class="in" id="bal_creep">${[['manual','수동 — 시즌 운영의 출시 세대 설정을 따름(기존 방식)'],['fixed','고정 — 모든 새 캐릭터를 같은 세대로(인플레 없음)'],['auto','자동 상승 — 새 캐릭터 N명마다 1세대씩, 최대 세대까지']].map(([k,l])=>`<option value="${k}" ${b.creep===k?'selected':''}>${l}</option>`).join('')}</select>
  <div class="g4" style="margin-top:6px"><div><label class="f">기준 세대</label>${num('bal_base',b.baseGen,1,5)}</div><div><label class="f">N명마다</label>${num('bal_per',b.per,1,99)}</div><div><label class="f">최대 세대</label>${num('bal_max',b.maxGen,1,5)}</div><div><label class="f">출시 수</label>${num('bal_rel',b.released,0,9999)}</div></div>
  <h3 class="sec" style="margin-top:12px">구캐릭터 AS</h3><select class="in" id="bal_as">${[['off','끔'],['boost','전투 보정 — 세대 차이당 체력·공격·방어 +x% (저장된 능력치는 그대로)'],['remaster','리마스터 — 뒤처진 캐릭터의 세대를 올리고 스킬 밸런스 재검사']].map(([k,l])=>`<option value="${k}" ${b.catchUp===k?'selected':''}>${l}</option>`).join('')}</select>
  <div class="g4" style="margin-top:6px"><div><label class="f">세대당 +%</label>${num('bal_pct',b.pct,0,100)}</div><div><label class="f">최대 +%</label>${num('bal_cap',b.max,0,300)}</div><div><label class="f">허용 세대 차이</label>${num('bal_lag',b.lag,0,4)}</div></div>
  <h3 class="sec" style="margin-top:12px">능력치 균질화</h3><p class="muted" style="font-size:.8rem;margin:0 0 6px">희귀도·전투 기본형의 기준값(게임 규칙의 기본 능력치·희귀도 배율)과 비교해요. 보수는 속도는 두고 체력·공격·방어를 같은 비율로 맞춰서 캐릭터 성향은 살려요.</p>
  <div class="g4"><div><label class="f">허용 편차 ±%</label>${num('bal_tol',b.tol,1,100)}</div></div><label style="display:flex;gap:6px;margin:6px 0"><input type="checkbox" id="bal_auto" ${b.autoNorm?'checked':''}> AI가 새로 만든 ${esc(T('crew'))}의 능력치가 범위를 벗어나면 자동으로 범위 안으로</label>
  <div class="row" style="margin:8px 0"><button class="btn sm" data-act="balsave">설정 저장</button></div>
  <h3 class="sec">점검 결과</h3><table style="font-size:.8rem;border-collapse:collapse;margin-bottom:6px"><tr><th style="text-align:left;padding:2px 6px">희귀도</th><th style="padding:2px 6px">수</th><th style="padding:2px 6px">기준 대비</th><th style="padding:2px 6px">세대</th></tr>${byR}</table>
  <div style="max-height:260px;overflow:auto;font-size:.82rem">${R.sort((a,b2)=>Math.abs(b2.dev)-Math.abs(a.dev)).map((x,i)=>`<label style="display:flex;gap:6px;align-items:center;padding:2px 0;border-bottom:1px solid var(--line)"><input type="checkbox" data-bal="${x.c.id}" ${x.statOut||x.genLag?'checked':''}><b style="min-width:80px">${esc(x.c.name)}</b><span>${RL[x.c.rarity]} · ${esc(posOf(x.c).name)}</span><span style="color:${x.statOut?'#ff5a5a':'inherit'}">${x.dev>=0?'+':''}${Math.round(x.dev*100)}%</span><span style="color:${x.genLag?'#ffd35a':'inherit'}">${x.gen}세대</span>${x.skill?'<span class="muted">스킬 검사 필요</span>':''}</label>`).join('')}</div>
  <div class="row" style="margin-top:8px;flex-wrap:wrap;gap:6px"><button class="btn sm" data-act="balfix" data-k="edge">선택: 능력치 범위 안으로</button><button class="btn sm ghost" data-act="balfix" data-k="center">선택: 기준값으로</button><button class="btn sm ghost" data-act="balfix" data-k="remaster">선택: 세대 맞추기(AS)</button><button class="btn sm ghost" data-act="balfix" data-k="skill">선택: 스킬 밸런스 다시 검사</button>${typeof AUDIT_UNDO!=='undefined'&&AUDIT_UNDO?`<button class="btn sm ghost" data-act="balundo">되돌리기: ${esc(AUDIT_UNDO.label)}</button>`:''}</div>
  <div class="row" style="margin-top:12px"><button class="btn ghost" data-act="close">닫기</button></div>`); }
function balSave(){ const v=id=>+(($('#'+id)||{}).value), m=G.meta; m.balance=Object.assign(m.balance||{},{creep:$('#bal_creep').value,baseGen:Math.max(1,Math.min(5,v('bal_base')||1)),per:Math.max(1,v('bal_per')||5),maxGen:Math.max(1,Math.min(5,v('bal_max')||5)),released:Math.max(0,v('bal_rel')||0),catchUp:$('#bal_as').value,pct:Math.max(0,v('bal_pct')||0),max:Math.max(0,v('bal_cap')||0),lag:Math.max(0,Math.min(4,v('bal_lag')||0)),tol:Math.max(1,v('bal_tol')||15),autoNorm:$('#bal_auto').checked}); mark('meta'); }
async function balFix(kind){ const ids=[...document.querySelectorAll('[data-bal]:checked')].map(x=>x.dataset.bal), cs=ids.map(charById).filter(Boolean); if(!cs.length){ toast('캐릭터를 골라 주세요'); return; }
  const label={edge:'능력치 범위 안으로',center:'능력치 기준값으로',remaster:'세대 맞추기',skill:'스킬 밸런스 재검사'}[kind]; auditSnap(cs,label); let n=0;
  for(const c of cs){ let ok=false; if(kind==='edge'||kind==='center') ok=balNormalize(c,kind); else if(kind==='remaster'){ syBar(`${c.name} 리마스터 중…`); ok=await balRemasterAI(c,m=>syBar(`${c.name}: ${m}`)); syBar(''); } else if(kind==='skill'){ c.skillBalance=null; ok=true; } if(ok){ mark('c:'+c.id); n++; } }
  if(kind==='skill'||kind==='remaster'){ syBar('스킬 밸런스 검사 중…'); try{ await v2ReadyChars(cs.filter(c=>!c.skillBalance)); }catch(e){ quietErr(e,'0187-balance.js:44'); } syBar(''); }
  toast(`${label}: ${n}명 (되돌리기 가능)`); openBalance(); }
document.addEventListener('click',e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act;
  if(a==='balopen') openBalance();
  else if(a==='balsave'){ balSave(); toast('밸런스 설정을 저장했어요'); openBalance(); }
  else if(a==='balfix') balFix(el.dataset.k);
  else if(a==='balundo'){ auditUndo(); openBalance(); } });
