/* ===== 0110-challenge — 불러올 때(상수·상태·리스너): 계층 파일 밖에 남은 옛 조각을 이름 순(불러오는 순서)으로 이음 ===== */

/* ── 0110-challenge-raid.js에서 ── */
/* ===== 도전: 레이드(주간 보스) — 심연 탐사는 0120 ===== */
const RAID_TICKS=700;
const RAID_MS=[[0.05,{gems:100,gold:5000}],[0.15,{gems:150,wmat:10,gift:2}],[0.3,{gems:200,core:3}],[0.5,{gems:300,exp:40}],[0.75,{gems:400,core:5}],[1,{gems:800,core:10,wmat:20}]];

/* ── 0120-abyss.js에서 ── */
/* ===== 심연 탐사 v2: 던전 탐험 + 카드 전투 ===== */
const DG_FLOORS=4, DG_W=5, DG_H=5;
const DG_ROOM={start:['◇','입구'],battle:['⚔','전투'],elite:['☠','정예'],treasure:['✦','보물'],rest:['⛺','야영지'],event:['?','사건'],stairs:['▼','다음 구역'],boss:['♛','보스'],empty:['','빈 방']};

/* --- 도트 스프라이트: 스탠딩을 줄여서 도트로 --- */
const PIX={};

/* --- 카드 --- */
// 리더 1명이 전장에 서고, 함께 고른 대원들은 카드가 되어 능력을 빌려줘요.
// 키워드: 연계(직전 카드도 공격이면 강해짐) · 낙인(쌓아 두면 처형으로 터뜨림) · 출혈(적 턴마다 피해) · 약화(적 공격 -30%)
//         보존(보호막 절반이 다음 턴으로) · 반격(이번 턴 맞으면 되받아침) · 소멸(한 번 쓰면 이번 전투에서 사라짐)
const CARD_DEF={
  strike:{n:'공격',c:1,t:'atk',tg:1,m:1.0,mu:1.4,d:v=>`적 1명에게 ${v} 피해`},
  guard:{n:'방어',c:1,t:'def',m:1,mu:1.45,d:v=>`보호막 ${v}`},
  skill:{n:'',c:2,cu:1,t:'sk',m:1,mu:1.3,d:v=>v},
  twin:{n:'연격',c:1,t:'atk',tg:1,m:0.6,mu:0.8,d:v=>`적 1명에게 ${v} 피해 ×2`},
  taunt:{n:'도발',c:1,t:'def',m:1.1,mu:1.6,d:v=>`보호막 ${v}`},
  tactic:{n:'전술 지원',c:0,t:'sup',m:2,mu:3,d:v=>`카드 ${v}장 뽑기`},
  heavy:{n:'강타',c:2,t:'atk',tg:1,m:2.2,mu:3.0,d:v=>`적 1명에게 ${v} 피해`},
  sweep:{n:'휩쓸기',c:1,t:'atk',m:0.7,mu:1.0,d:v=>`모든 적에게 ${v} 피해`},
  wall:{n:'철벽',c:2,t:'def',m:2.2,mu:3.0,d:v=>`보호막 ${v}`},
  aid:{n:'응급 처치',c:1,t:'sup',m:1.5,mu:2.2,d:v=>`리더 체력 ${v} 회복`},
  focus:{n:'집중',c:0,t:'sup',m:2,mu:3,x:1,d:v=>`카드 ${v}장 뽑기 · <b>소멸</b>`},
  expose:{n:'약점 포착',c:1,cu:0,t:'sup',tg:1,m:2,mu:3,d:v=>`적 1명이 ${v}턴 동안 받는 피해 +50%`},
  rally:{n:'사기 진작',c:1,t:'sup',m:0.15,mu:0.25,d:v=>`이번 전투 공격 +${Math.round(v*100)}%`},
  combo:{n:'협공',c:1,t:'atk',tg:1,m:0.35,mu:0.5,d:v=>`적 1명에게 ${v} 피해 × 이번 턴에 쓴 카드 수`},
  revive:{n:'재정비',c:2,t:'sup',m:0.3,mu:0.5,x:1,d:v=>`리더 체력 ${Math.round(v*100)}% 회복 · <b>소멸</b>`},
  surge:{n:'과부하',c:0,t:'sup',m:2,mu:3,x:1,d:v=>`에너지 +${v} · <b>소멸</b>`},
  // 기믹 카드
  slash:{n:'연속 베기',c:1,t:'atk',tg:1,m:0.8,mu:1.1,d:v=>`적 1명에게 ${v} 피해 · <b>연계</b>: 직전 카드가 공격이면 ×1.6`},
  brand:{n:'낙인',c:1,t:'atk',tg:1,m:0.45,mu:0.6,mk:2,mku:3,d:(v,cd)=>`적 1명에게 ${v} 피해 · <b>낙인</b> ${cd&&cd.up?3:2} 부여`},
  finisher:{n:'처형',c:2,cu:1,t:'atk',tg:1,m:0.6,mu:0.8,d:v=>`적 1명에게 ${v} 피해 + 그 적의 <b>낙인</b> 1개마다 같은 피해를 더해요 (낙인 소모)`},
  bleed:{n:'핏빛 자상',c:1,t:'atk',tg:1,m:0.4,mu:0.55,bl:3,blu:5,d:(v,cd)=>`적 1명에게 ${v} 피해 · <b>출혈</b> ${cd&&cd.up?5:3}`},
  bulwark:{n:'수호',c:1,t:'def',m:1.2,mu:1.7,d:v=>`보호막 ${v} · <b>보존</b>: 다음 턴까지 보호막 절반 유지`},
  counter:{n:'반격 태세',c:1,t:'def',m:0.9,mu:1.3,d:v=>`보호막 ${v} · <b>반격</b>: 이번 적 턴에 맞을 때마다 되받아쳐요`},
  weaken:{n:'무력화',c:1,cu:0,t:'sup',tg:1,m:2,mu:3,d:v=>`적 1명 <b>약화</b> ${v}턴 (적 공격 -30%)`},
  plan:{n:'작전 지시',c:0,t:'sup',m:1,mu:2,d:v=>`카드 ${v}장 뽑기 · 다음 카드 비용 -1`},
  echo:{n:'잔향',c:1,t:'sup',x:1,m:1,mu:1,d:()=>`이번 턴에 쓴 직전 카드를 손으로 한 장 복사해요 · <b>소멸</b>`},
  // 빌드 카드: 충전·소멸·보호막·출혈·0비용·낙인·필살
  charge:{n:'기 모으기',c:1,cu:0,t:'sup',m:2,mu:3,d:v=>`<b>충전</b> ${v} · 보호막 조금`},
  release:{n:'해방',c:2,t:'atk',m:0.5,mu:0.7,d:v=>`모든 적에게 ${v} 피해 × (1 + <b>충전</b>) · 충전을 모두 써요`},
  sacrifice:{n:'결의',c:0,t:'sup',m:2,mu:3,d:v=>`손의 맨 오른쪽 카드 1장을 <b>소멸</b>시키고 카드 ${v}장 뽑기`},
  burnout:{n:'연소',c:1,t:'atk',tg:1,m:2.0,mu:2.7,x:1,d:v=>`적 1명에게 ${v} 피해 · <b>소멸</b>`},
  shieldbash:{n:'방패 치기',c:1,t:'atk',tg:1,m:0.8,mu:1.2,d:v=>`지금 보호막의 ${Math.round(v*100)}%만큼 적 1명에게 피해 (보호막은 그대로)`},
  entrench:{n:'참호',c:2,cu:1,t:'def',m:1,mu:1,x:1,d:()=>`보호막을 2배로 · <b>소멸</b>`},
  hemorrhage:{n:'혈류 폭주',c:1,cu:0,t:'sup',tg:1,m:2,mu:2,d:()=>`적 1명의 <b>출혈</b>을 2배로`},
  flurry:{n:'난무',c:0,t:'atk',tg:1,m:0.4,mu:0.6,d:v=>`적 1명에게 ${v} 피해 · <b>연계</b>면 카드 1장 뽑기`},
  spread:{n:'낙인 전이',c:1,cu:0,t:'sup',tg:1,m:1,mu:1,d:()=>`대상의 <b>낙인</b>만큼 다른 모든 적에게도 낙인을 걸어요`},
  overdrive:{n:'과열',c:1,cu:0,t:'sup',m:2,mu:3,d:v=>`필살 게이지 +${v}`},
  rage:{n:'투지',c:1,cu:0,t:'sup',m:0.3,mu:0.45,x:1,d:v=>`이번 전투 동안 공격 카드를 쓸 때마다 보호막 ${v} · <b>소멸</b>`}
};
const KW={연계:'직전에 쓴 카드도 공격이면 더 강해져요.',낙인:'적에게 쌓여요. 처형 카드가 낙인 수만큼 피해를 더하고 낙인을 없애요.',출혈:'적의 턴이 올 때마다 출혈 수치만큼(×리더 공격 일부) 피해를 받고 1씩 줄어요.',약화:'약화된 적은 공격이 30% 약해져요.',보존:'다음 턴이 와도 보호막의 절반이 남아요.',반격:'이번 적 턴에 공격을 받을 때마다 공격한 적에게 피해를 돌려줘요.',소멸:'한 번 쓰면 이번 전투에서는 다시 나오지 않아요.',충전:'쌓아 두었다가 해방 카드로 한 번에 터뜨려요. 전투가 끝나면 사라져요.'};
const CARD_REWARD=['heavy','sweep','wall','aid','focus','expose','rally','combo','revive','surge','twin','slash','brand','finisher','bleed','bulwark','counter','weaken','plan','echo','charge','release','sacrifice','burnout','shieldbash','entrench','hemorrhage','flurry','spread','overdrive','rage'];
const ROLE_CARDS={atk:['slash','brand','finisher','bleed'],def:['bulwark','counter','wall','taunt'],sup:['plan','weaken','aid','expose']};
const SK_TXT={dmg:'적 1명에게 큰 피해',aoe:'모든 적에게 피해',heal:'리더 체력 회복',shield:'큰 보호막',buff:'이번 전투 공격 증가'};
const LEAD_AB={atk:['맹공','공격 카드를 3장 쓸 때마다 리더가 추가로 한 번 더 공격해요.'],def:['불굴','턴을 시작할 때 리더 최대 체력의 6%만큼 보호막을 얻어요.'],sup:['통찰','턴마다 카드를 1장 더 뽑아요.']};
const ULT_MAX=6;
const CARD_ILL={strike:'attacking, weapon swing, motion lines',guard:'defensive stance, guarding, barrier',twin:'double strike, afterimage, fast movement',taunt:'provoking, smirk, beckoning',tactic:'pointing forward, commanding',heavy:'powerful strike, overhead swing, impact',sweep:'spinning attack, wide slash, shockwave',wall:'shield wall, glowing barrier, braced stance',aid:'healing light, gentle smile, hands glowing',focus:'closed eyes, concentrating, aura',expose:'aiming, focused gaze, crosshair',rally:'raising fist, cheering, light rays',combo:'teamwork attack, leaping',revive:'kneeling, recovering, light',surge:'overload, crackling energy, aura burst',slash:'slashing, consecutive slashes, afterimage',brand:'glowing sigil, magic mark, pointing at viewer',finisher:'finishing blow, dramatic angle, impact frame',bleed:'red slash trail, swift cut',bulwark:'standing guard, protective barrier',counter:'counterattack stance, parry, sparks',weaken:'casting debuff, dark aura, hand raised',plan:'holographic map, commanding, pointing',echo:'mirror image, afterimage, glowing',charge:'charging energy, glowing aura, clenched fist',release:'energy explosion, shockwave, dramatic',sacrifice:'burning card, determined expression',burnout:'flaming strike, fire trail',shieldbash:'shield bash, charging forward, impact',entrench:'kneeling behind shield, fortified',hemorrhage:'red mist, blood magic, crimson aura',flurry:'rapid strikes, multiple afterimages',spread:'glowing sigils spreading, chain of marks',overdrive:'overheating, steam, glowing eyes',rage:'battle cry, fiery aura'};

/* --- 카드 전투 엔진 --- */
let CB=null;


// 심연 탐사 전용 편성: 리더 1명이 앞에, 카드가 될 3명이 뒤에 붙는 ㅗ 모양
let RF=null;

/* 심연 탐사 런: 층·유물·노드 고르기·적·시작·전투·끝·보상(도전 레이드 파일에서 모음) */
const RG_FLOORS=12;

const RELICS={chain4:['연쇄 반응','한 턴에 카드를 4장째 쓰면 에너지 +1'],brandplus:['피의 낙인','낙인을 걸 때 1개 더'],phoenix:['불사의 깃털','전투마다 한 번, 쓰러질 때 체력 30%로 버텨요'],thorns:['가시 갑옷','보호막으로 막은 피해의 30%를 공격한 적에게 돌려줘요'],opener:['선제 낙인','전투 시작 때 모든 적에게 낙인 2'],lastcard:['마지막 한 장','손에 남은 마지막 카드는 위력 2배'],ultcharge:['필살 충전기','필살 게이지를 2칸 채운 채 전투 시작'],vamp:['흡혈 송곳니','적을 쓰러뜨릴 때마다 리더 체력 8% 회복'],ashes:['잿불','카드가 소멸할 때마다 모든 적에게 피해'],deepcut:['깊은 상처','출혈 피해 +50%'],tempo:['리듬','한 턴에 카드를 6장째 쓰면 카드 2장 뽑기'],markburst:['각인 전염','낙인이 남은 적이 쓰러지면 그 낙인이 다른 적 모두에게 옮겨 붙어요'],ultecho:['잔영','필살을 쓰면 에너지 +1, 카드 2장 뽑기'],capacitor:['축전기','전투 시작 때 충전 3'],firstfree:['첫 수','매 턴 첫 카드 비용 -1'],atk:['날카로운 칼날','공격 +15%'],def:['강화 장갑','방어 +25%'],hp:['생명의 결정','최대 체력 +20%'],spd:['가속 장치','속도 +10%'],burst:['오버드라이브','전투 시작 BURST +40%'],heal:['응급 키트','전투가 끝날 때마다 체력 15% 회복'],loot:['전리품 자석','탐사 보상 +30%'],res:['공명 코어','공격 +8% · 체력 +8%'],train:['실전 훈련','공격 +5% (겹쳐요)']};
const RG_NODE={battle:['⚔','전투','일반 적'],elite:['☠','정예','강한 적 · 이기면 유물'],rest:['⛺','휴식','체력 35% 회복, 쓰러진 대원 부활'],treasure:['✦','보물','유물 1개 고르기'],event:['?','사건','무슨 일이 생길지 몰라요'],boss:['♛','보스','마지막 전투']};
const CRELICS=['chain4','brandplus','phoenix','thorns','opener','lastcard','ultcharge','vamp','firstfree','ashes','deepcut','tempo','markburst','ultecho','capacitor','atk','hp','loot'];
let RGMODE='card';

/* ── 0125-tower.js에서 ── */
/* ===== 시련의 탑 ===== */
/* 층마다 강해지는 무한 전투. 통합 탑(누구나) + 제한 탑(소속별·속성별: 그 소속/속성 캐릭터만 출전) → 여러 캐릭터를 모으고 키울 이유.
   적은 이 게임 스토리에 나온 적 이름·외형을 다시 쓰고(생성 연계), 층마다 전장 규칙이 바뀌어요(0485). 5층마다 보스·큰 보상.
   P().tower={[탑 id]:{best}} · 문서: docs/research/combat-content.md */

document.addEventListener('click',e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act;
  if(a==='towergo') towerGo(el.dataset.v);
  else if(a==='towerstart'){ const c=FORM&&FORM.ctx; if(!c||c.kind!=='tower') return; P().squad=[...squadSel]; mark('prog'); closeModal(); startStage(FORM.stage,{kind:'tower',tid:c.tid,floor:c.floor,allow:c.allow}); } });

/* ── 0488-stage-modes.js에서 ── */
/* ===== 스테이지 양식: 전투 말고도 회담(설득·증거)·콘테스트(매력) ===== */
/* s.mode = 'battle'(기본) | 'story'(s.story) | 'debate' | 'contest'
   - 회담 s.debate={opponent,goal,evidence:[{id,name,desc}],rounds:[{claim,lines:[{text,press,weak,persuade:{who,text}}]}],hp,win,lose}
     상대의 주장(줄)마다 추궁(press: 더 듣기)·증거 제시(weak와 같은 증거면 돌파)·동료 설득(persuade.who가 편성에 있으면 돌파).
     라운드마다 돌파 1번이 필요. 틀린 증거는 신뢰도 −1, 0이 되면 실패(다시 도전).
   - 콘테스트 s.contest={title,judges:[{name,likes}],rounds,rivals:[{name,power}]}
     출전 3명 → 라운드마다 출전자와 어필 종류를 고름. 점수 = 매력(개성 시트·역할·희귀도·호감도·레벨) × (심사위원 취향이면 1.6) × 분위기.
     같은 사람을 연달아 쓰면 분위기가 깨지고, 취향을 맞추거나 다른 사람으로 이어 가면 분위기가 오름. 1위면 통과.
   - 생성 연계: 조각 STAGE_MODES(프롬프트 스튜디오)를 장·이벤트·새 게임 1장 프롬프트에 넣고, stageSchema의 mode·debate·contest를
     buildStages가 검증(modeClean). 잘못되면 전투로. 설정에서 양식별로 끔. 문서: docs/research/stage-modes.md */
 // 새 게임 세계관 단계 스키마
const FINALE_END={battle:'보스전과',contest:'결승 무대와',debate:'결정적인 회담과'};
const finaleOf=f=>['contest','debate'].includes(f)?f:'battle';
const finaleEnd=()=>FINALE_END[storyCfg().finale]; // finaleRule(프롬프트 글)은 프롬프트 스튜디오(0015) 조립 함수
// 스테이지 집필(writeStages)의 스테이지 종류 표시 — 회담·콘테스트면 프롬프트 스튜디오의 STAGE_WRITE_RULE(대본은 그 전·후만)을 붙임
const STAGE_KIND={debate:'회담 스테이지',contest:'콘테스트 스테이지'};
const CHARM={cool:'멋',cute:'귀여움',beauty:'아름다움',smart:'지성',tough:'강인함'};
const CHARM_KW={cool:/쿨|냉정|과묵|카리스마|멋|차분|무뚝뚝/,cute:/귀여|밝|천진|장난|애교|활발|명랑/,beauty:/우아|아름|기품|섬세|예술|고상|신비/,smart:/똑똑|지적|분석|침착|박식|천재|논리|책/,tough:/강인|용감|열혈|근성|힘|투지|단단|호쾌/};
const S_=(v,n)=>String(v||'').trim().slice(0,n||200);

/* 공통: 시작·클리어 */
let MD=null;


document.addEventListener('click',e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act;
  if(a==='mdgo'){ const ch=G.chapters.find(x=>x.id===el.dataset.ch), s=ch&&ch.stages.find(x=>x.id===el.dataset.st); if(!s) return; const sel=[...document.querySelectorAll('#modal [data-mdsel]')].filter(x=>x.checked).map(x=>x.dataset.mdsel); if(sel.length){ P().squad=sel.slice(0,s.mode==='contest'?3:4); mark('prog'); } closeModal(); const go=()=>s.mode==='debate'?debateStart(ch,s):contestStart(ch,s); if(!P().cleared[s.id]&&s.pre) playStory(s.title,s.pre,go); else go(); }
  else if(!MD) return;
  else if(a==='dbnav'){ const R=MD.s.debate.rounds[MD.r]; MD.i=Math.max(0,Math.min(R.lines.length-1,MD.i+(+el.dataset.v))); debateDraw(); }
  else if(a==='dbpress'){ const L=MD.s.debate.rounds[MD.r].lines[MD.i]; MD.pressed[MD.i]=1; debateDraw(L.press?`${MD.s.debate.opponent}: ${L.press}`:'더 이상 나오는 말이 없어요'); }
  else if(a==='dbshow'){ const L=MD.s.debate.rounds[MD.r].lines[MD.i], ev=MD.s.debate.evidence.find(x=>x.id===el.dataset.v); if(L.weak&&L.weak===el.dataset.v) debateHit(`「${ev.name}」을(를) 제시 — "${L.text}"의 모순을 밝혀냈다!`); else debateMiss(`「${ev?ev.name:''}」은(는) 이 말과 맞지 않아요. 신뢰도 −1`); }
  else if(a==='dbpers'){ const L=MD.s.debate.rounds[MD.r].lines[MD.i], c=charById(el.dataset.v); if(L.persuade&&c&&(c.name===L.persuade.who||ROLE[c.role]===L.persuade.who||c.faction===L.persuade.who)) debateHit(`${c.name}: ${L.persuade.text||'제 말을 들어 주세요.'}`); else debateMiss(`${c?c.name:''}의 말은 이 대목에서 통하지 않았어요. 신뢰도 −1`); }
  else if(a==='ctap') contestAppeal(el.dataset.c,el.dataset.k);
  else if(a==='dbquit'){ MD=null; closeModal(); } });

document.addEventListener('change',e=>{ const id=e.target.dataset&&e.target.dataset.mdsel; if(id) e.target.closest('label').classList.toggle('on',e.target.checked); });
