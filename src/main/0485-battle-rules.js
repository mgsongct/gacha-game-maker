/* ===== 전장 규칙 · 스테이지 목표 · 집중 지시 ===== */
/* 모든 스테이지가 "다 쓰러뜨리기" 하나뿐이라 편성 고민이 없던 문제를 풀어요(docs/research/combat-content.md).
   - 전장 규칙 s.field={k,a}: 속성·역할·소속을 우대/억제하거나 적을 단단하게 → 캐릭터를 골고루 모을 이유가 생김
   - 스테이지 목표 s.goal={k,a}: 별 3번째 조건(없으면 기존 "빠른 클리어 71초")
   - 집중 지시: 전투 중 적을 누르면 8초 동안 아군 기본 공격이 그 적을 노림(재사용 12초) — 엔진의 focus 상태를 씀
   - 생성 연계: 새 장(buildStages)은 AI가 고른 규칙을 쓰고, 비우면 stageAutoRules가 정함. 예전 스테이지는 점검 규칙 s_rules */
const FIELDS={
 resonance:{n:'속성 공명',arg:'elem',d:a=>`${a} 속성 유닛 공격 +30%`,f:(A,E,a)=>[...A,...E].forEach(u=>{ if(u.elem===a) u.atk=Math.round(u.atk*1.3); })},
 suppress:{n:'속성 억제',arg:'elem',d:a=>`${a} 속성 유닛 공격 −25%`,f:(A,E,a)=>[...A,...E].forEach(u=>{ if(u.elem===a) u.atk=Math.round(u.atk*.75); })},
 role:{n:'역할 우대',arg:'role',d:a=>`${ROLE[a]||a}형 아군 공격·방어 +25%`,f:(A,E,a)=>A.forEach(u=>{ if(u.role===a){ u.atk=Math.round(u.atk*1.25); u.def=Math.round(u.def*1.25); } })},
 home:{n:'홈그라운드',arg:'faction',d:a=>`${a} 소속 아군 체력·공격 +25%`,f:(A,E,a)=>A.forEach(u=>{ if((u.c&&u.c.faction)===a){ u.maxhp=Math.round(u.maxhp*1.25); u.hp=u.maxhp; u.atk=Math.round(u.atk*1.25); } })},
 armor:{n:'철갑 전선',d:()=>'적 방어 +60% · 적 체력 −15%',f:(A,E)=>E.forEach(u=>{ u.def=Math.round(u.def*1.6); u.maxhp=Math.round(u.maxhp*.85); u.hp=Math.min(u.hp,u.maxhp); })},
 fortress:{n:'요새',d:()=>'적 체력 +40% · 적 공격 −15%',f:(A,E)=>E.forEach(u=>{ u.maxhp=Math.round(u.maxhp*1.4); u.hp=Math.round(u.hp*1.4); u.atk=Math.round(u.atk*.85); })},
 swift:{n:'질풍',d:()=>'모든 유닛 속도 +20%',f:(A,E)=>[...A,...E].forEach(u=>{ u.spd=Math.round(u.spd*1.2); })},
 frenzy:{n:'광란',d:()=>'모든 유닛 공격 +35% (짧고 위험한 전투)',f:(A,E)=>[...A,...E].forEach(u=>{ u.atk=Math.round(u.atk*1.35); })},
 timed:{n:'시간 제한',arg:'sec',d:a=>`${a}초 안에 이기지 못하면 실패`,f:()=>{}}};
const GOALS={
 fast:{arg:'sec',d:a=>`${a}초 안에 승리`,ok:(B,a)=>B.engine.time<=+a},
 hp:{arg:'pct',d:a=>`남은 체력 합계 ${a}% 이상`,ok:(B,a)=>B.allies.reduce((n,u)=>n+Math.max(0,u.hp),0)/Math.max(1,B.allies.reduce((n,u)=>n+u.maxhp,0))*100>=+a},
 elem:{arg:'elem',d:a=>`${a} 속성 2명 이상 편성`,ok:(B,a)=>B.allies.filter(u=>u.elem===a).length>=2},
 role:{arg:'role',d:a=>`${ROLE[a]||a}형 2명 이상 편성`,ok:(B,a)=>B.allies.filter(u=>u.role===a).length>=2},
 noRole:{arg:'role',d:a=>`${ROLE[a]||a}형 없이 승리`,ok:(B,a)=>!B.allies.some(u=>u.role===a)},
 faction:{arg:'faction',d:a=>`${a} 소속 2명 이상 편성`,ok:(B,a)=>B.allies.filter(u=>(u.c&&u.c.faction)===a).length>=2},
 few:{arg:'n',d:a=>`${a}명 이하로 승리`,ok:(B,a)=>B.allies.length<=+a}};
function ruleFacs(){ const n={}; G.chars.forEach(c=>{ if(c.faction&&!c.npc) n[c.faction]=(n[c.faction]||0)+1; }); return Object.keys(n).filter(f=>n[f]>=2); }
function ruleArg(kind,seed){ const pick=a=>a.length?a[seed%a.length]:''; return kind==='elem'?pick(ELEMS):kind==='role'?pick(Object.keys(ROLE)):kind==='faction'?pick(ruleFacs()):kind==='sec'?[60,75,90][seed%3]:kind==='pct'?[40,50,60][seed%3]:kind==='n'?3:''; }
function ruleOk(cat,r){ const d=r&&cat[r.k]; if(!d) return false; if(!d.arg) return true; const a=r.a; return d.arg==='elem'?ELEMS.includes(a):d.arg==='role'?!!ROLE[a]:d.arg==='faction'?ruleFacs().includes(a):+a>0; }
function ruleClean(cat,r){ if(!r||typeof r!=='object') return null; const o={k:String(r.k||'')}; if(cat[o.k]&&cat[o.k].arg) o.a=['sec','pct','n'].includes(cat[o.k].arg)?Math.round(+r.a||0):String(r.a||'').trim(); return ruleOk(cat,o)?o:null; }
function fieldText(r){ const d=r&&FIELDS[r.k]; return d?`${d.n}: ${d.d(r.a)}`:''; }
function goalText(r){ const d=r&&GOALS[r.k]; return d?d.d(r.a):'71초 안에 승리'; }
// 스테이지 i/n에 규칙을 정해요(첫 스테이지는 규칙 없음, 마지막(보스)은 시간·체력 목표). 같은 스테이지는 늘 같은 결과
function stageAutoRules(s,i,n){ if(!s||s.story||!(s.enemies||[]).length) return s; const h=hashN(s.id||s.title||i);
  if(i>0){ const fk=['resonance','role','home','armor','fortress','swift','resonance','frenzy','suppress'].filter(k=>FIELDS[k].arg!=='faction'||ruleFacs().length), k=fk[h%fk.length]; const f=ruleClean(FIELDS,{k,a:ruleArg(FIELDS[k].arg,h>>3)}); if(f) s.field=f; }
  const gk=i===n-1?['fast','hp']:['elem','role','noRole','few','hp','faction'].filter(k=>k!=='faction'||ruleFacs().length), g=gk[(h>>5)%gk.length], goal=ruleClean(GOALS,{k:g,a:ruleArg(GOALS[g].arg,h>>7)}); if(goal) s.goal=goal;
  s.rulesV=1; return s; }
function fieldApply(s,A,E){ const r=s&&s.field, d=r&&FIELDS[r.k]; if(d) d.f(A,E,r.a); }
function fieldTime(s){ const r=s&&s.field; return r&&r.k==='timed'?Math.max(20,Math.min(119,+r.a||90)):0; }
function rulesHTML(s){ const f=fieldText(s.field); return `<div class="panel" style="padding:8px;margin:6px 0;font-size:.82rem">${f?`<div><b>전장 규칙</b> ${esc(f)}</div>`:''}<div><b>별 조건</b> 승리 · 전원 생존 · ${esc(goalText(s.goal))}</div></div>`; }
// 집중 지시
function bFocus(i){ if(!B||B.over||!B.engine) return; const u=B.enemies[i], t=B.engine.time; if(!u||u.hp<=0) return; if(t<(B.focusReady||0)){ toast(`집중 지시는 ${Math.ceil(B.focusReady-t)}초 뒤에 다시 쓸 수 있어요`); return; }
  B.enemies.forEach(en=>{ en.status=en.status.filter(s=>s.id!=='order'); }); u.status.push({id:'order',type:'focus',value:1,until:t+8,next:Infinity,source:null,slot:'order',remaining:1,hpRemain:1});
  B.focusReady=t+12; blog(`집중 공격 지시: ${u.name}`); bUpdate(); }
document.addEventListener('click',e=>{ const b=e.target.closest('[data-act="bfocus"]'); if(!b) return; e.stopPropagation(); bFocus(+b.dataset.i); });
