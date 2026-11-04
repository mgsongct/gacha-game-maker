/* ===== 0185-rules — View(HTML·DOM을 만듦) ===== */
/* src/main/0185-rules/0185-game-rules.js에서 옮김 */
function rulesElemLine(e){ const m=rulesElemMat()[e]||{}, strong=Object.keys(m).filter(t=>m[t]>1), weak=Object.keys(m).filter(t=>(rulesElemMat()[t]||{})[e]>1);
  return [strong.length?`${strong.map(t=>`<b>${esc(t)}</b>`).join('·')}에 강함(${strong.map(t=>rulesPct(m[t])).join('·')})`:'',weak.length?`${weak.map(t=>`<b>${esc(t)}</b>`).join('·')}에 약함`:''].filter(Boolean).join(' · ')||'상성 없음'; }
function rulesCharHTML(c){ if(!c||c.npc) return ''; const r=RULESM(), syn=r.synergy, p=posOf(c), rd=(r.roleDesc||{})[c.role], ed=(G.meta.elems.find(e=>e.n===c.elem)||{}).d, rx=(r.reactions||[]).filter(x=>x.a===c.elem||x.b===c.elem),
    rel=(r.rel||[]).filter(x=>(x.by==='faction'&&x.a===c.faction)||(x.by==='role'&&x.a===c.role)||(x.by==='elem'&&x.a===c.elem)||(x.by==='pos'&&x.a===p.id));
  return `<div class="panel" style="margin:6px 0;padding:8px 10px;font-size:.82rem"><div>속성 <b style="color:${ECOL[c.elem]||'inherit'}">${esc(c.elem)}</b> — ${rulesElemLine(c.elem)}${ed?` <span class="muted">· ${esc(ed)}</span>`:''}</div>
    ${rx.length?`<div class="muted">반응: ${rx.map(x=>`${esc(x.a)}+${esc(x.b)} 「${esc(x.name||'반응')}」`).join(' · ')}</div>`:''}
    <div>포지션 <b>${esc(p.name)}</b> <span class="muted">(${esc(ROLE[p.base]||p.base)}형)</span>${p.desc||rd?` — <span class="muted">${esc(p.desc||rd)}</span>`:''}${posTraitText(p.t)?`<div class="muted">${esc(posTraitText(p.t))}</div>`:''}</div>
    ${c.faction?`<div>진영 <b>${esc(c.faction)}</b>${syn&&+syn.n>1&&(+syn.atk||+syn.def)?` — 같은 진영 ${+syn.n}명 이상 편성 시 공격 +${+syn.atk||0}% · 방어 +${+syn.def||0}%`:''}</div>`:''}
    ${rel.length?`<div class="muted">관계: ${rel.map(x=>`${esc(x.by==='pos'?(posById(x.b)||{}).name||x.b:x.b)} 상대로 ${rulesPct(+x.mul||1)}`).join(' · ')}</div>`:''}</div>`; }
function rulesPanel(){ const o=rulesOptions(), b=rulesBeats(), m=G.meta, P=POSITIONS();
  return `<div class="panel pm-hide"><h3>게임 규칙 (속성·포지션·능력치)</h3><p class="muted" style="margin:0 0 6px">속성 ${m.elems.length}개: ${m.elems.map(e=>b[e.n]?`${esc(e.n)}→${esc(b[e.n])}`:esc(e.n)).join(' · ')} (유리 ${rulesPct(o.elemAdv)}, 불리 ${rulesPct(o.elemDis)})${o.reactions.length?` · 반응 ${o.reactions.length}개`:''}. 포지션 ${P.length}개: ${P.map(p=>esc(p.name)).join('·')}. 속성 추가·제거, 상성표, 반응, 포지션 기능, 역할 능력치, 희귀도, 진영 시너지, 관계를 보고 고쳐요.</p><button class="btn sm" data-act="rulesopen">규칙 보기·편집</button></div>`; }
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
  <h3 class="sec" style="margin-top:14px">진영 시너지</h3><p class="muted" style="font-size:.8rem;margin:0 0 6px">${factions().length?`진영: ${factions().map(f=>esc(f.name)).join(', ')}. `:''}같은 진영 n명 이상 편성 시 공격·방어 +% (0이면 끔).</p>
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
/* src/main/0185-rules/0187-balance.js에서 옮김 */
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
/* src/main/0185-rules/0240-growth-curve.js에서 옮김 */
async function openFormation(stage,ctx,startAct){
  try{await v2PrepareStage(stage,ctx);}catch(e){toast(e.message);return;}
  FORM=FORM&&FORM.key===(stage.id||stage.title)?FORM:{key:stage.id||stage.title,stage,ctx,startAct,filter:'all',sort:'power'};
  FORM.stage=stage; FORM.ctx=ctx; FORM.startAct=startAct;
  const busy=busyIds(), owned=G.chars.filter(c=>own(c.id)&&(!ctx.allow||ctx.allow(c)));
  if(!squadSel) squadSel=P().squad.filter(id=>own(id)&&charById(id)&&!busy.has(id)&&(!ctx.allow||ctx.allow(charById(id)))).slice(0,4);
  const en=stage.enemies, need=stagePower(stage), tp0=teamPower(squadSel), tp=effPower(squadSel,en), ratio=need?tp/need:1, fb=factionBonus(squadSel);
  const elemCount={}; en.forEach(e=>{elemCount[e.elem]=(elemCount[e.elem]||0)+1;});
  let list=owned.filter(c=>FORM.filter==='all'||c.elem===FORM.filter||c.role===FORM.filter);
  list.sort((a,b)=>FORM.sort==='lv'?own(b.id).lv-own(a.id).lv:FORM.sort==='match'?(matchup(b,en).good-matchup(b,en).bad)-(matchup(a,en).good-matchup(a,en).bad)||charPower(b)-charPower(a):charPower(b)-charPower(a));
  const slot=i=>{const c=charById(squadSel[i]); if(!c) return `<button class="fslot empty" data-act="fsl" data-i="${i}"><span>+</span><i>${i<2?'전열':'후열'}</i></button>`;
    const m=matchup(c,en), o=own(c.id), rw=rowWarn(c,i,squadSel.length);
    return `<button class="fslot r${c.rarity} ${rw?'rowbad':''}" title="${esc(rw)}" data-act="fpick" data-id="${c.id}" style="--ec:${ECOL[c.elem]}"><div class="fs-art">${art(c)}</div><span class="el" style="--ec:${ECOL[c.elem]}">${esc(c.elem)}</span>${formOn()?`<em class="rgi" title="${RANGE[charRange(c)]}">${RANGE_ICO[charRange(c)]}</em>`:''}${rw?`<em class="rww">${esc(rw)}</em>`:''}${m.good>m.bad?'<em class="adv">유리</em>':m.bad>m.good?'<em class="dis">불리</em>':''}<div class="fs-t"><b>${esc(c.name)}</b><span>Lv.${o.lv} · ${esc(ROLE[c.role])}</span><span class="pw">${nf(charPower(c))}</span></div></button>`;};
  const head2=FORM.ctx.kind==='tower'?`<span class="muted">첫 돌파 보상: ${rewardText(towerReward(FORM.ctx.floor))}</span>`:FORM.ctx.kind==='raid'?`<span class="muted">이번 주 누적 피해로 보상을 받아요 · 오늘 ${raidTriesLeft()}/3</span>`:FORM.ctx.kind==='rogue'?`<span class="muted">이 4명으로 끝까지 가요. 체력은 이어져요.</span>`:FORM.ctx.kind==='farm'?`<span class="muted">보상: ${rewardText(farmReward(stage.farm.key,stage.farm.lv))}</span>`:FORM.ctx.kind==='event'?`<span class="muted">이벤트 스테이지</span>`:`<span class="muted">보상 ◆${nf(stage.reward)}${P().cleared[stage.id]?'':' (첫 클리어 2배)'}</span>`;
  openModal(`${head(esc(FORM.ctx.code?FORM.ctx.code+' ':'')+esc(stage.title),head2)}
    <div class="fenemy">${en.map(e=>`<div class="fe ${e.boss?'boss':''}" style="--ec:${ECOL[e.elem]}"><div class="fe-art">${enemyArt(e)}</div><span class="el" style="--ec:${ECOL[e.elem]}">${esc(e.elem)}</span><b>${esc(e.name)}</b><span>${e.boss?'BOSS · ':''}${nf(e.hp)}</span></div>`).join('')}</div>
    ${stage.enemies.length&&!stage.story?rulesHTML(stage):''}
    ${en.filter(e=>e.boss).map(e=>`<p class="boss-pat"><b>보스 패턴</b> ${esc(e.name)}: ${esc(bossPatText(e,FORM.ctx.kind==='raid'))}</p>`).join('')}
    <p class="muted" style="margin:6px 0 0">적 속성: ${Object.entries(elemCount).map(([k,v])=>`${esc(k)}×${v}`).join(' ')} → ${Object.keys(elemCount).map(k=>{const w=ELEMS.find(elem=>BEATS[elem]===k);return w?`<b style="color:${ECOL[w]}">${esc(w)}</b> 유리`:'';}).filter(Boolean).join(', ')}</p>
    <div class="fpower"><div><i>편성 능력치 <small style="opacity:.7">상성 반영</small></i><b class="${ratio>=1?'ok':ratio>=0.8?'warn':'bad'}">${nf(tp)}</b>${tp!==tp0?`<small class="muted" style="display:block;font-size:.7rem">기본 ${nf(tp0)}</small>`:''}</div><div><i>적 능력치 (참고)</i><b>${nf(need)}</b></div><div class="fbar"><span style="width:${Math.min(100,ratio*100)}%" class="${ratio>=1?'ok':ratio>=0.8?'warn':'bad'}"></span></div></div>
    <div class="frow"><i>전열</i><i>후열</i></div><div class="fslots">${[0,1,2,3].map(slot).join('')}</div>
    <p class="muted" style="margin:4px 0 0">${formOn()?esc(formHelp()):'전열은 적의 공격을 두 배로 더 받아요. 방어형은 어디에 있든 공격을 끌어요.'}</p>
    ${Object.keys(fb).length?`<p class="fbonus">${Object.entries(fb).map(([f,v])=>`${esc(f)} 소속 보너스 공격 +${v}%`).join(' · ')}</p>`:`<p class="muted" style="margin:6px 0 0">같은 소속 2명 이상이면 공격 보너스 (2명 5%, 3명 10%, 4명 15%)</p>`}
    <div class="row" style="margin-top:8px"><button class="btn sm" data-act="fauto">자동 편성</button><button class="btn sm ghost" data-act="fclear">비우기</button>${[0,1,2].map(i=>{const pr=(P().presets||[])[i];return `<button class="btn sm ghost" data-act="fpre" data-i="${i}">${pr&&pr.length?'편성 '+(i+1):'빈 '+(i+1)}</button>`;}).join('')}<button class="btn sm ghost" data-act="fsave">현재 편성 저장</button></div>
    <div class="ftools"><div class="chips">${[['all','전체'],...ELEMS.map(elem=>[elem,elem]),...Object.entries(ROLE)].map(([v,l])=>`<button class="chip ${FORM.filter===v?'on':''}" data-act="ffil" data-v="${esc(v)}">${esc(l)}</button>`).join('')}</div>
      <select class="in" id="fsort" style="max-width:120px">${opt([['power','전투력순'],['lv','레벨순'],['match','상성순']],FORM.sort)}</select></div>
    <div class="froster">${list.map(c=>{const on=squadSel.includes(c.id),b=busy.has(c.id),m=matchup(c,en);return `<button class="fr r${c.rarity} ${on?'on':''} ${b?'busy':''}" data-act="fpick" data-id="${c.id}" ${b?'disabled':''} style="--ec:${ECOL[c.elem]}"><div class="fr-art">${art(c)}</div><span class="el" style="--ec:${ECOL[c.elem]}">${esc(c.elem)}</span>${b?'<em class="busy">파견</em>':m.good>m.bad?'<em class="adv">유리</em>':m.bad>m.good?'<em class="dis">불리</em>':''}${on?`<em class="num">${squadSel.indexOf(c.id)+1}</em>`:''}<b>${esc(c.name)}</b><span>Lv.${own(c.id).lv} · ${nf(charPower(c))}</span></button>`;}).join('')||'<p class="muted">보유한 '+T('crew')+'이(가) 없어요.</p>'}</div>
    <div class="row" style="margin-top:14px"><button class="btn block" data-act="${startAct}" ${FORM.ctx.extra||''} ${squadSel.length?'':'disabled'}>출격 (${squadSel.length}/4)</button></div>
    ${FORM.ctx.storyBtns||''}`,false,'','formation:'+FORM.key+':'+FORM.ctx.kind);
}
function refreshForm(){ if(FORM) openFormation(FORM.stage,FORM.ctx,FORM.startAct); }
function openStage(chId,stId){
  const ch=G.chapters.find(x=>x.id===chId),s=ch.stages.find(x=>x.id===stId), cl=!!P().cleared[s.id];
  const code=ch.kind==='event'?'EV'+(ch.stages.indexOf(s)+1):stageCode(s.id);
  const storyBtns=`<div class="row" style="margin-top:8px">${s.pre?`<button class="btn sm ghost" data-act="story" data-ch="${chId}" data-st="${stId}" data-k="pre">전투 전 이야기</button>`:''}${cl&&s.post?`<button class="btn sm ghost" data-act="story" data-ch="${chId}" data-st="${stId}" data-k="post">전투 후 이야기</button>`:''}<button class="btn sm ghost" data-act="chedit" data-ch="${chId}">적·스토리 편집</button></div>`;
  openFormation(s,{kind:ch.kind||'main',ch,code,extra:`data-ch="${chId}" data-st="${stId}"`,storyBtns},'sortie');
}
function openChEdit(){
  const ch=chDraft;
  openModal(`${head('챕터 편집')}
    <label class="f" for="ch_title">챕터 제목</label><input class="in" id="ch_title" value="${esc(ch.title)}">
    ${ch.stages.map((s,j)=>`<div class="stage-edit">
      <div class="g2"><div><label class="f">스테이지 ${j+1} 제목</label><input class="in" id="st_t_${j}" value="${esc(s.title)}"></div><div><label class="f">보상 성석</label><input class="in" type="number" id="st_r_${j}" value="${s.reward}"></div></div>
      <label class="f" style="margin-top:6px"><input type="checkbox" id="st_s_${j}" ${s.story?'checked':''}> 전투 없음 (이야기만 보는 스테이지 · 전투 전 대본만 써요)</label>
      <label class="f">적 (한 줄에 하나: 이름, 속성, 체력, 공격, 방어, 속도, 보스면 끝에 보스)</label><textarea class="in" id="st_e_${j}">${esc(s.enemies.map(en=>[en.name,en.elem,en.hp,en.atk,en.def,en.spd].join(', ')+(en.boss?', 보스':'')).join('\n'))}</textarea>
      <label class="f">전투 전 대본</label><textarea class="in tall" id="st_pre_${j}">${esc(s.pre||'')}</textarea><button class="btn sm ghost scimg-b" data-act="scimg" data-ta="st_pre_${j}">🖼 이미지 넣기</button>
      <label class="f">전투 후 대본</label><textarea class="in" id="st_post_${j}" style="min-height:160px">${esc(s.post||'')}</textarea><button class="btn sm ghost scimg-b" data-act="scimg" data-ta="st_post_${j}">🖼 이미지 넣기</button>
      <div class="row" style="margin-top:8px">${SAMPLE?`<button class="btn sm ghost" data-act="stdetail" data-j="${j}">✦ AI로 디테일 보강</button>`:''}<button class="btn sm ghost" data-act="delstage" data-j="${j}">이 스테이지 삭제</button></div></div>`).join('')}
    <div class="row"><button class="btn sm ghost" data-act="addstage">스테이지 추가</button></div>
    <div class="row" style="margin-top:16px"><button class="btn" data-act="savech">저장</button><button class="btn ghost" data-act="delch">챕터 삭제</button></div>`);
}
function openWorld(){
  const w=G.world;
  openModal(`${head('세계관')}
    <label class="f" for="w_name">이름</label><input class="in" id="w_name" value="${esc(w.name)}">
    <label class="f" for="w_sum">요약</label><textarea class="in" id="w_sum">${esc(w.summary)}</textarea>
    <label class="f" for="w_lore">상세 설정</label><textarea class="in tall" id="w_lore">${esc(w.lore)}</textarea>
    <label class="f" for="w_plot">메인 플롯 (비밀 설정, 복선, 장기 전개. AI가 다음 장을 쓸 때 참고해요)</label><textarea class="in tall" id="w_plot">${esc(w.plot||'')}</textarea>
    <label class="f" for="w_fac">세력 (한 줄에 하나: 이름: 설명)</label><textarea class="in" id="w_fac">${esc(w.factions.map(f=>f.name+': '+f.desc).join('\n'))}</textarea>
    <label class="f" for="w_kw">AI로 새로 짜기: 키워드</label><input class="in" id="w_kw" placeholder="예: 사이버펑크 해상도시, 기업 전쟁, 인공 천사">
    <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="aiworld">AI로 세계관 쓰기</button></div>
    <p class="muted">AI 결과는 입력칸에만 채워져요. 저장을 눌러야 반영돼요.</p>
    <div class="optbox" id="w_terms" hidden><label class="f"><input type="checkbox" id="w_tchk" checked> 용어도 세계관에 맞게 바꾸기</label><span class="muted" style="font-size:.8rem"></span></div>
    <p class="muted" style="margin:8px 0 0">지금 용어: ${esc(T('player'))} · ${esc(T('crew'))} · ${esc(T('talk'))} · ${esc(T('currency'))} · ${esc(T('gacha'))} · ${esc(T('abyss'))} <button class="linkb" data-act="meta-open">용어 직접 바꾸기</button></p>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="saveworld">저장</button></div>`);
}
function openOpeningEdit(){
  openModal(`${head('오프닝')}
    <label class="f" for="op_lines">오프닝 영상 문구 (한 줄에 한 장면, 마지막 줄은 크게 표시)</label><textarea class="in" id="op_lines" style="min-height:160px">${esc(G.opening.lines.join('\n'))}</textarea>
    <label class="f" for="op_pro">프롤로그 대본</label><textarea class="in tall" id="op_pro">${esc(G.opening.prologue)}</textarea><button class="btn sm ghost scimg-b" data-act="scimg" data-ta="op_pro">🖼 이미지 넣기</button>
    <label class="f" for="op_hint">AI에게 바라는 방향 (선택)</label><input class="in" id="op_hint" placeholder="예: 더 어둡고 미스터리하게">
    <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="aiopening">AI로 오프닝 쓰기</button></div>
    <div class="row" style="margin-top:16px"><button class="btn" data-act="saveopening">저장</button></div>`);
}
function openLib(kind){
  if(kind==='sfx'){
    const items=G.lib.filter(l=>l.kind==='sfx');
    openModal(`${head('효과음',`<span class="muted">${items.filter(l=>l.audio).length}/${items.length}개 등록됨</span>`)}
      ${items.map(l=>`<div class="ep"><span class="t"><b>${esc(l.name)}</b><span class="muted">${l.audio?'등록됨':'미등록'} · ${esc(l.prompt).slice(0,60)}</span></span>${l.audio?`<button class="btn sm ghost" data-act="sfxplay" data-id="${l.id}">▶</button>`:''}<button class="btn sm ghost" data-act="sfxgen" data-id="${l.id}">AI 생성</button><button class="btn sm ghost" data-act="aupload" data-id="${l.id}">파일</button></div>`).join('')}
      <div class="row" style="margin-top:12px"><button class="btn" data-act="sfxall">미등록 전부 AI로 만들기</button></div>
      <p class="muted">ElevenLabs 효과음 생성으로 만들어요. 대본에서는 [효과음: 이름]으로 불러요.</p>`);
    return;
  }
  if(kind==='bgm'){
    const items=G.lib.filter(l=>l.kind==='bgm');
    openModal(`${head('배경음',`<span class="muted">${items.filter(l=>l.audio).length}/${items.length}곡 등록됨</span>`)}
      ${items.map(l=>`<div class="ep"><span class="t"><b>${esc(l.name)}</b><span class="muted">${l.audio?'등록됨':'미등록'}${BGM.name===l.name&&!BGM.el.paused?' · 재생 중':''}</span></span>${l.audio?`<button class="btn sm ghost" data-act="bgmplay" data-id="${l.id}" aria-label="재생">▶</button>`:''}<button class="btn sm ghost" data-act="libitem" data-id="${l.id}">편집</button></div>`).join('')}
      <div class="row" style="margin-top:12px"><button class="btn ghost" data-act="bgmstop">정지</button><button class="btn" data-act="libnew" data-k="bgm">곡 추가</button><button class="btn" data-act="bgmall">🎵 한꺼번에 작곡</button></div>
      <p class="muted">Suno, Udio 같은 곳에서 만든 곡도 편집 → 파일 올리기로 넣을 수 있어요.</p>`);
    return;
  }
  const items=G.lib.filter(l=>l.kind===kind);
  openModal(`${head(({bg:'배경',prop:'소품',cg:'CG',enemy:'적',icon:'재화 아이콘',map:'작전 지도'})[kind]||kind,`<span class="muted">${items.filter(l=>l.img).length}/${items.length}개 등록됨</span>`)}
    <div class="lgrid" style="margin-top:10px">${items.map(l=>`<button class="lt ${kind}" data-act="libitem" data-id="${l.id}">${imgSrc(l)?`<img class="art" src="${esc(imgSrc(l))}" alt="">`:(kind==='bg'?`<div class="bgfill" style="${bgStyle(l.name)}"></div>`:`<div class="art ph" style="--ec:var(--brass)"><small>미등록</small></div>`)}<span class="lbl">${esc(l.name)}${l.img?'':' · 미등록'}</span></button>`).join('')}</div>
    <div class="row" style="margin-top:12px">${kind==='enemy'?`<button class="btn ghost" data-act="ailooks">빈 외형 AI로 채우기</button><button class="btn ghost" data-act="ailooksall">외형 전부 세계관에 맞게 다시 쓰기</button>`:''}<button class="btn ghost" data-act="naibatch" data-k="${kind}">미등록 전부 NAI로 그리기</button><button class="btn" data-act="libnew" data-k="${kind}">${({bg:'배경',prop:'소품',cg:'CG',enemy:'적',icon:'재화 아이콘',map:'작전 지도'})[kind]} 추가</button></div>`);
}
function openLibItem(id,kind){
  if((id&&libById(id)&&libById(id).kind==='cg')||(!id&&kind==='cg')){
    const l=id?libById(id):{id:'',kind:'cg',name:'',prompt:'',cast:[]}; const cast=l.cast||[];
    openModal(`${head(id?esc(l.name):'새 CG',`<span class="muted">이벤트 CG · 대본에서 [CG: 이름]</span>`)}
      ${id?`<div style="aspect-ratio:16/10;margin:10px 0;position:relative;overflow:hidden;background:var(--panel2)">${imgSrc(l)?`<img style="width:100%;height:100%;object-fit:cover" src="${esc(imgSrc(l))}" alt="">`:'<div class="art ph" style="--ec:var(--brass);height:100%"><small>이미지 미등록</small></div>'}</div>`:''}
      <label class="f" for="li_name">이름</label><input class="in" id="li_name" value="${esc(l.name)}">
      <label class="f" for="li_prompt">장면 프롬프트 (영어, 인물 외모 제외: 장소, 구도, 행동, 분위기)</label><textarea class="in" id="li_prompt" placeholder="rooftop, night, rain, two women sharing an umbrella, from side, cinematic">${esc(l.prompt)}</textarea>
      <h3 class="sec">등장 ${T('crew')} (최대 4명)</h3>
      ${[0,1,2,3].map(i=>{const x=cast[i]||{};return `<div class="g4 cgslot"><div style="grid-column:span 2"><label class="f">${i+1}번</label><select class="in" id="cg_c${i}"><option value="">없음</option>${G.chars.map(c=>`<option value="${c.id}" ${x.id===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div><div><label class="f">위치</label><select class="in" id="cg_p${i}">${opt(CG_POS_LABEL,x.pos||'auto')}</select></div><div><label class="f">행동 태그</label><input class="in" id="cg_a${i}" value="${esc(x.act||'')}" placeholder="smile, waving"></div></div>`;}).join('')}
      <p class="muted">각 ${T('crew')}의 외모는 그 ${T('crew')}의 NAI 프롬프트에서 가져와서 캐릭터별 프롬프트로 따로 넣어요(V4 이상).</p>
      <label class="f" for="li_desc">AI에게 설명 (선택)</label><input class="in" id="li_desc" placeholder="예: 축제 마지막 밤, 불꽃놀이를 올려다보는 미호와 루나">
      <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="ailib" data-k="cg">AI로 장면 프롬프트 쓰기</button></div>
      <div class="row" style="margin-top:16px"><button class="btn" data-act="savelib" data-id="${l.id}" data-k="cg">저장</button>${id?`<button class="btn ghost" data-act="naigen" data-k="lib" data-id="${l.id}">NAI로 그리기</button><button class="btn ghost" data-act="upload" data-k="lib" data-id="${l.id}">이미지 올리기</button>${(kind==='enemy'||kind==='prop'||kind==='icon')&&imgSrc(l)?`<button class="btn ghost" data-act="cutopen" data-k="lib" data-id="${l.id}">배경 지우기</button>`:''}${l.img?XBTN('lib',l.id):''}<button class="btn ghost" data-act="dellib" data-id="${l.id}">삭제</button>`:''}</div>`);
    return;
  }
  if((id&&libById(id)&&libById(id).kind==='bgm')||(!id&&kind==='bgm')){
    const l=id?libById(id):{id:'',kind:'bgm',name:'',prompt:''};
    openModal(`${head(id?esc(l.name):'새 배경음',`<span class="muted">배경음 · ${l.audio?'등록됨':'미등록'}</span>`)}
      <label class="f" for="li_name">이름 (대본에서 [음악: 이름]으로 불러요)</label><input class="in" id="li_name" value="${esc(l.name)}">
      <label class="f" for="li_prompt">음악 프롬프트 (영어)</label><textarea class="in" id="li_prompt">${esc(l.prompt)}</textarea>
      <label class="f" for="li_desc">AI에게 설명 (선택)</label><input class="in" id="li_desc" placeholder="예: 비 오는 밤 둘만 남은 사무소, 쓸쓸하지만 따뜻하게">
      <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="ailib" data-k="bgm">AI로 프롬프트 쓰기</button></div>
      <div class="row" style="margin-top:16px"><button class="btn" data-act="savelib" data-id="${l.id}" data-k="bgm">저장</button>${id?`<button class="btn ghost" data-act="elcompose" data-id="${l.id}">AI로 작곡</button><button class="btn ghost" data-act="aupload" data-id="${l.id}">파일 올리기</button>${l.audio?`<button class="btn ghost" data-act="bgmplay" data-id="${l.id}">재생</button>`:''}<button class="btn ghost" data-act="dellib" data-id="${l.id}">삭제</button>`:''}</div>`);
    return;
  }
  const l=id?libById(id):{id:'',kind,name:'',prompt:''}; kind=l.kind;
  const KN=({bg:'배경',prop:'소품',enemy:'적',icon:'재화 아이콘',map:'작전 지도'})[kind]||kind;
  openModal(`${head(id?esc(l.name):'새 '+KN,`<span class="muted">${KN}${kind==='enemy'?' · 스테이지의 적 이름과 같으면 전투에 나와요':''}</span>`)}${l.alias&&!l.img?`<p class="muted" style="margin:0 0 8px;font-size:.8rem">지금은 「${esc((G.lib.find(x=>x.id===l.alias)||{}).name||'')}」의 그림을 같이 써요. 프롬프트를 적고 저장하면 이 적만 따로 그려요.</p>`:''}
    ${id?`<div style="border-radius:12px;overflow:hidden;aspect-ratio:${kind==='bg'?'16/10':'1'};margin:10px 0;position:relative">${imgSrc(l)?`<img class="art" style="width:100%;height:100%;object-fit:cover" src="${esc(imgSrc(l))}" alt="">`:(kind==='bg'?`<div style="${bgStyle(l.name)};position:absolute;inset:0"></div>`:`<div class="art ph" style="--ec:var(--brass);height:100%"><small>이미지 미등록</small></div>`)}</div>`:''}
    <label class="f" for="li_name">이름 (대본에서 이 이름으로 불러요)</label><input class="in" id="li_name" value="${esc(l.name)}">
    <label class="f" for="li_prompt">NAI 프롬프트</label><textarea class="in" id="li_prompt">${esc(l.prompt)}</textarea>
    <label class="f" for="li_desc">AI에게 설명 (선택)</label><input class="in" id="li_desc" placeholder="예: 비 오는 밤 네온이 비치는 편의점 앞">
    <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="ailib" data-k="${kind}">AI로 프롬프트 쓰기</button><button class="btn sm ghost" data-act="copyfield" data-f="li_prompt">복사</button></div>
    <div class="row" style="margin-top:16px"><button class="btn" data-act="savelib" data-id="${l.id}" data-k="${kind}">저장</button>${id?`<button class="btn ghost" data-act="naigen" data-k="lib" data-id="${l.id}">NAI로 그리기</button><button class="btn ghost" data-act="upload" data-k="lib" data-id="${l.id}">이미지 올리기</button>${(kind==='enemy'||kind==='prop'||kind==='icon')&&imgSrc(l)?`<button class="btn ghost" data-act="cutopen" data-k="lib" data-id="${l.id}">배경 지우기</button>`:''}${l.img?XBTN('lib',l.id):''}<button class="btn ghost" data-act="dellib" data-id="${l.id}">삭제</button>`:''}</div>`);
}
function openBanner(id){
  const b=BD=id?clone(G.banners.find(bn=>bn.id===id)):{id:'',name:'새 배너',type:'pickup',desc:'',pool:{mode:'all',factions:[],ids:[]},pickup:[],rate:50,active:true,bg:''};
  const facs=[...new Set(G.chars.map(c=>c.faction).filter(Boolean))];
  openModal(`${head(id?'배너 편집':'배너 만들기')}
    <label class="f" for="bn_name">이름</label><input class="in" id="bn_name" value="${esc(b.name)}">
    <label class="f" for="bn_desc">설명</label><input class="in" id="bn_desc" value="${esc(b.desc)}">
    <div class="g2"><div><label class="f" for="bn_type">종류</label><select class="in" id="bn_type">${opt([['std','상시'],['pickup','확률 업'],['pool','소속 한정'],['event','이벤트']],b.type)}</select></div>
    <div><label class="f" for="bn_bg">배경</label><select class="in" id="bn_bg">${bgOptions(b.bg,'기본')}</select></div></div>
    <div class="g2"><div><label class="f" for="bn_mode">등장 대상</label><select class="in" id="bn_mode">${opt([['all','전체'],['faction','소속으로 고르기'],['list','직접 고르기']],b.pool.mode)}</select></div>
    <div><label class="f" for="bn_rate">확률 업 비중 (%)</label><input class="in" id="bn_rate" type="number" value="${b.rate}"></div></div>
    ${b.pool.mode==='faction'?`<label class="f">소속</label><div class="chips">${facs.map(f=>`<button class="chip ${b.pool.factions.includes(f)?'on':''}" data-act="bnfac" data-v="${esc(f)}">${esc(f)}</button>`).join('')||'<span class="muted">소속이 정해진 '+T('crew')+'이(가) 없어요</span>'}</div>`:''}
    ${b.pool.mode==='list'?`<label class="f">등장 ${T('crew')}</label><div class="chips">${G.chars.map(c=>`<button class="chip ${b.pool.ids.includes(c.id)?'on':''}" data-act="bnid" data-v="${c.id}">${esc(c.name)}</button>`).join('')}</div>`:''}
    <label class="f">확률 업 ${T('crew')}</label><div class="chips">${G.chars.map(c=>`<button class="chip ${b.pickup.includes(c.id)?'on':''}" data-act="bnup" data-v="${c.id}">${RL[c.rarity]} ${esc(c.name)}</button>`).join('')}</div>
    <label class="f" for="bn_act">상태</label><select class="in" id="bn_act">${opt([['1','열림'],['0','닫힘']],b.active!==false?'1':'0')}</select>
    <div class="row" style="margin-top:16px"><button class="btn" data-act="bnsave">저장</button>${id&&id!=='std'?'<button class="btn ghost" data-act="bndel">삭제</button>':''}</div>`);
}
function openBannerFrom(b){ const real=G.banners; const bak=BD; BD=b; const orig=G.banners.find(bn=>bn.id===b.id); const saved=JSON.stringify(b);
  // render from draft
  const facs=[...new Set(G.chars.map(c=>c.faction).filter(Boolean))];
  openModal(`${head(b.id?'배너 편집':'배너 만들기')}
    <label class="f" for="bn_name">이름</label><input class="in" id="bn_name" value="${esc(b.name)}">
    <label class="f" for="bn_desc">설명</label><input class="in" id="bn_desc" value="${esc(b.desc)}">
    <div class="g2"><div><label class="f" for="bn_type">종류</label><select class="in" id="bn_type">${opt([['std','상시'],['pickup','확률 업'],['pool','소속 한정'],['event','이벤트']],b.type)}</select></div>
    <div><label class="f" for="bn_bg">배경</label><select class="in" id="bn_bg">${bgOptions(b.bg,'기본')}</select></div></div>
    <div class="g2"><div><label class="f" for="bn_mode">등장 대상</label><select class="in" id="bn_mode">${opt([['all','전체'],['faction','소속으로 고르기'],['list','직접 고르기']],b.pool.mode)}</select></div>
    <div><label class="f" for="bn_rate">확률 업 비중 (%)</label><input class="in" id="bn_rate" type="number" value="${b.rate}"></div></div>
    ${b.pool.mode==='faction'?`<label class="f">소속</label><div class="chips">${facs.map(f=>`<button class="chip ${b.pool.factions.includes(f)?'on':''}" data-act="bnfac" data-v="${esc(f)}">${esc(f)}</button>`).join('')}</div>`:''}
    ${b.pool.mode==='list'?`<label class="f">등장 ${T('crew')}</label><div class="chips">${G.chars.map(c=>`<button class="chip ${b.pool.ids.includes(c.id)?'on':''}" data-act="bnid" data-v="${c.id}">${esc(c.name)}</button>`).join('')}</div>`:''}
    <label class="f">확률 업 ${T('crew')}</label><div class="chips">${G.chars.map(c=>`<button class="chip ${b.pickup.includes(c.id)?'on':''}" data-act="bnup" data-v="${c.id}">${RL[c.rarity]} ${esc(c.name)}</button>`).join('')}</div>
    <label class="f" for="bn_act">상태</label><select class="in" id="bn_act">${opt([['1','열림'],['0','닫힘']],b.active!==false?'1':'0')}</select>
    <div class="row" style="margin-top:16px"><button class="btn" data-act="bnsave">저장</button>${b.id&&b.id!=='std'?'<button class="btn ghost" data-act="bndel">삭제</button>':''}</div>`);
}
function openFarmSquad(st){ openFormation(st,{kind:'farm',extra:`data-k="${st.farm.key}" data-lv="${st.farm.lv}"`},'farmstart'); }
/* 세계관 편집 창에 AI가 낸 값 채우기(View) — 용어 바꾸기 제안(WTERMS)은 처리기가 먼저 담음 */
function worldFormFill(r){ $('#w_name').value=r.name||''; $('#w_sum').value=r.summary||''; $('#w_lore').value=r.lore||''; $('#w_plot').value=r.plot||''; $('#w_fac').value=(r.factions||[]).map(f=>f.name+': '+f.desc).join('\n'); const tb=$('#w_terms'); if(tb&&WTERMS){ tb.hidden=false; tb.querySelector('span').textContent=Object.entries(WTERMS).filter(([k,v])=>v&&TERM_LABEL[k]).map(([k,v])=>TERM_LABEL[k]+': '+v).join(' · '); } }
/* 대열에 넣은 대원 반응(View): 몸짓 · 한마디 말풍선 — 고른 한마디를 돌려줌(목소리는 처리기가) */
function formJoinShow(c){ const slot=document.querySelector(`.fslot[data-id="${c.id}"]`); if(!slot) return ''; charReact(slot.querySelector('.fs-art'),7,'head'); const pool=(c.dupLines.length?c.dupLines:[]).concat(c.lines); const l=rand(pool); if(l){ const b=document.createElement('div'); b.className='fsay'; b.textContent=sub(l); slot.appendChild(b); setTimeout(()=>b.remove(),2600); } return l; }
