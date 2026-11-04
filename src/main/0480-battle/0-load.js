/* ===== 0480-battle — 불러올 때(상수·상태·리스너): 계층 파일 밖에 남은 옛 조각을 이름 순(불러오는 순서)으로 이음 ===== */

/* ── 0480-battle.js에서 ── */
/* =========================================================
   전투
   ========================================================= */
let B=null;
const alive=a=>a.filter(u=>u.hp>0);
let SCUT_MAN=false;
// 컷인 표정: 결의·화남 같은 힘 있는 표정을 먼저, 없으면 아무 표정이나
const CUT_FACES=['결의','화남','의기양양','진지','기합','분노','미소','웃음'];

/* ── 0485-battle-rules.js에서 ── */
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
document.addEventListener('click',e=>{ const el=e.target.closest('[data-act="bfocus"]'); if(!el) return; e.stopPropagation(); bFocus(+el.dataset.i); });

/* ── 0487-formation-sortie.js에서 ── */
/* ===== 대열(근접·원거리·지원)과 출격 경로(진격·퇴각·갈림길) ===== */
/* 1) 대열: 캐릭터마다 사거리 c.range('melee' 근접 | 'ranged' 원거리 | 'support' 지원). 없으면 포지션(range) → 역할·무기로 추정.
      편성 슬롯 1·2는 전열, 3·4는 후열. 엔진(GGMCombat, options.formation)이 근접 공격은 전열을 먼저 치고, 후열을 노린 공격은
      전열 방어형이 엄호하고, 자리에 안 맞는 배치(후열 근접·전열 원거리)는 불리하게 계산해요.
   2) 출격 경로: 전투 스테이지 하나가 여러 지점(전초전 → 갈림길(정면 돌파 / 우회 보급) → 보스)으로 이어져요.
      지점마다 체력이 이어지고, 이긴 뒤 "진격" 또는 "퇴각"을 고르고, 갈림길에서는 길을 골라요(우회로는 지원형이 있어야 열림).
      보스를 이겨야 스테이지 클리어(첫 클리어 보상·별·다음 대본). 퇴각하면 그때까지 얻은 골드·경험치만 받아요.
      경로는 s.route(AI가 장 생성 때 이름을 붙임)나 자동(routeAuto). P().sortie에 진행 상황 저장(다시 켜도 이어 감).
   문서: docs/research/formation-sortie.md */
const RANGE={melee:'근접',ranged:'원거리',support:'지원'}, RANGE_ICO={melee:'⚔',ranged:'➶',support:'✚'};
const POS_RANGE={선봉:'melee',근접:'melee',방벽:'melee',사수:'ranged',술사:'ranged',의무:'support',보조:'support',특수:'melee',구축:'melee',경순:'ranged',중순:'ranged',전함:'melee',항모:'support',잠수:'melee',공격:'',방어:'melee',지원:'support'};

document.addEventListener('click',e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act;
  if(a==='bsys'){ G.meta.rules=G.meta.rules||{}; G.meta.rules[el.dataset.k]=el.checked; mark('meta'); }
  else if(a==='bsmode'){ G.meta.story=G.meta.story||{}; G.meta.story.modes=Object.assign({},G.meta.story.modes,{[el.dataset.k]:el.checked}); mark('meta'); }
  else if(a==='sogo') sortieFight();
  else if(a==='sonext'){ const x=sortieParts(); if(!x) return; x.run.node=el.dataset.v; mark('prog'); sortieMap(); }
  else if(a==='somap'){ B=null; closeOv(); render(); sortieMap(); }
  else if(a==='soretreat'){ const x=sortieParts(); const g=x?x.run.gained:{}; sortieEnd(); closeModal(); render(); toast(`퇴각했어요${g.gold?` · 얻은 골드 ${nf(g.gold)}`:''}`); } });

/* ── 0490-boss-patterns.js에서 ── */
/* ===== 보스 패턴 ===== */
const BPATS={aoe:['광역 포격','7초마다 전원 공격',7],snipe:['집중 저격','7초마다 체력 비율이 낮은 대상 공격',7],charge:['강타','7초마다 전원 강타',7],drain:['흡혈','7초마다 피해의 30% 회복',7],barrier:['방벽','7초마다 보호막',7],curse:['저주','7초마다 적 전체 공격력 감소',7],shift:['방어 약화','7초마다 적 전체 방어력 감소',7]};
// 훈련: 10단계, 단계마다 권장 레벨이 있어요(그 레벨 대원의 능력치에 맞춰 적이 강해져요)
const FARM_LV=[1,5,10,15,20,30,40,50,60,70], FARM_N=FARM_LV.length;
const FARM_RW={exp:[10,20,35,55,80,110,150,200,260,330],gold:[4000,7000,11000,16000,22000,30000,40000,52000,66000,82000],wmat:[5,9,14,20,28,38,50,64,80,100],core:[1,1,2,2,3,4,5,6,7,8]};
