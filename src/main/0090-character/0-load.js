/* ===== 0090-character — 불러올 때(상수·상태·리스너): 계층 파일 밖에 남은 옛 조각을 이름 순(불러오는 순서)으로 이음 ===== */

/* ── 0065-inherit.js에서 ── */
/* ===== 캐릭터 상속 (이격·바리에이션 = 원본 + 수정치) ===== */
let INHERIT_SYNC=false;
document.addEventListener('click',e=>{ const el=e.target.closest('[data-act="inhreset"]'); if(!el) return; const c=charById(el.dataset.id); if(!c) return; inheritReset(c,el.dataset.k); toast(el.dataset.k==='*'?'모든 항목이 원본을 따라요':`${inheritLabel(el.dataset.k)}: 원본 값으로 되돌렸어요`); if(typeof render==='function') render(); if(typeof closeModal==='function'&&!$('#modal').hidden){ const id=c.id; closeModal(); if(typeof openChar==='function') openChar(id); } });

/* ── 0090-growth.js에서 ── */
/* =========================================================
   성장
   ========================================================= */
const levelCap=o=>Math.min(120,Math.max(Math.min(70,20+10*(o?.dup||0))+capExtra(),o?.legacyLevelCap||0)+(o?.transc||0)*10);
const expR=x=>Math.round(x*((P().settings.expRate||100)/100));
/* 행동력: 메인·이벤트 전투 10, 재료 던전 8. 5분마다 1씩 차서 최대 240. ◆로 채울 수 있어요. 설정 → 게임에서 끌 수 있어요 */
const STAM_MAX=240, STAM_MS=5*60e3, STAM_FILL=[60,60];
setInterval(()=>{ try{ if(typeof G!=='undefined'&&G){ progTick(); updStam(); } }catch(e){} },30000); /* 주기 타이머(Controller): 날이 바뀐 칸 새로 만들기·행동력 표시 */
const MISSIONS=[{k:'login',name:'출석하기',goal:1,xp:100},{k:'battle',name:'전투 3회',goal:3,xp:150},{k:'pull',name:'뽑기 1회',goal:1,xp:100},{k:'dispatch',name:'파견 보내기',goal:1,xp:100},{k:'touch',name:'로비 터치 5회',goal:5,xp:60},{k:'enhance',name:'강화 1회',goal:1,xp:100}];
const PASS_MAX=30, PASS_PER=500;
const passLv=()=>Math.min(PASS_MAX,Math.floor(P().pass.xp/PASS_PER));
const dispDone=()=>[...Object.values(P().disp),...Object.values((P().exped||{}).jobs||{})].filter(d=>Date.now()>=d.start+d.hours*3600e3).length; // 로비 배지: 전투형 파견 + 다른 원정 방식의 끝난 일정
const busyIds=()=>new Set([...Object.values(P().disp).flatMap(d=>d.chars),...exBusyIds()]); // 원정 모드(방송·스트리머·경영)에서 일하는·쉬는·배치된 캐릭터 포함
/* 스포일러 막기: 아직 만나지 않은 인물(보유하지 않았고, 본 스토리에도 안 나온)의 이름이 든 대사는 로비·터치에서 빼요 */
let SEEN_K='', SEEN_T='';
const AFF_MAX=GGMCombat.AFFINITY.max; const RMUL={1:1,2:1.15,3:1.3};

/* ── 0130-gift.js에서 ── */
/* ===== 선물 ===== */
const GIFTS=[['g_cake','달콤한 케이크','🍰',20],['g_tea','고급 찻잎','🍵',20],['g_flower','꽃다발','💐',25],['g_book','두꺼운 책','📖',25],['g_tool','공구 세트','🔧',25],['g_doll','봉제 인형','🧸',30],['g_perfume','향수','🧴',35],['g_music','음반','💿',30],['g_brooch','보석 브로치','💎',50],['g_letter','손편지','✉️',60]];
const giftById=id=>GIFTS.find(g=>g[0]===id);

(()=>{ let sx=0,sy=0,st=0,el=null;
  const down=(x,y,t)=>{ el=t&&t.closest&&t.closest('[data-swipe]'); sx=x; sy=y; st=Date.now(); };
  const up=(x,y)=>{ if(!el) return; const dx=x-sx, dy=y-sy; const e2=el; el=null; if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.4&&Date.now()-st<900){ window.__SWIPED=Date.now(); if(e2.dataset.swipe==='banner') bannerStep(dx<0?1:-1); } };
  document.addEventListener('touchstart',e=>{ const p=e.touches[0]; down(p.clientX,p.clientY,e.target); },{passive:true});
  document.addEventListener('touchend',e=>{ const p=e.changedTouches[0]; up(p.clientX,p.clientY); },{passive:true});
  document.addEventListener('mousedown',e=>{ if(e.button===0) down(e.clientX,e.clientY,e.target); });
  document.addEventListener('mouseup',e=>{ up(e.clientX,e.clientY); });
})();

(()=>{ let tx=0,ty=0,cx=0,cy=0,raf=0; const step=()=>{ cx+=(tx-cx)*0.08; cy+=(ty-cy)*0.08; const el=document.querySelector('.lobby.layer'); if(el){ el.style.setProperty('--px',cx.toFixed(3)); el.style.setProperty('--py',cy.toFixed(3)); } raf=(Math.abs(tx-cx)+Math.abs(ty-cy)>0.002)?requestAnimationFrame(step):0; };
  const set=(x,y)=>{ tx=Math.max(-1,Math.min(1,x)); ty=Math.max(-1,Math.min(1,y)); if(!raf) raf=requestAnimationFrame(step); };
  document.addEventListener('pointermove',e=>{ if(e.pointerType==='mouse'&&document.querySelector('.lobby.layer')) set(e.clientX/innerWidth*2-1,e.clientY/innerHeight*2-1); },{passive:true});
  addEventListener('deviceorientation',e=>{ if(e.gamma==null||!document.querySelector('.lobby.layer')) return; set(e.gamma/30,(e.beta-45)/30); },{passive:true});
})();
(()=>{ let d=null;
  document.addEventListener('mousedown',e=>{ const el=e.target.closest&&e.target.closest('.bsel,.cx-cats'); if(!el||e.button!==0) return; d={el,x:e.clientX,s:el.scrollLeft,moved:false}; });
  document.addEventListener('mousemove',e=>{ if(!d) return; const dx=e.clientX-d.x; if(Math.abs(dx)>5){ d.moved=true; d.el.scrollLeft=d.s-dx; } });
  document.addEventListener('mouseup',()=>{ if(d&&d.moved) window.__SWIPED=Date.now(); d=null; });
  document.addEventListener('wheel',e=>{ const el=e.target.closest&&e.target.closest('.bsel,.cx-cats'); if(!el||Math.abs(e.deltaY)<=Math.abs(e.deltaX)) return; if(el.scrollWidth<=el.clientWidth) return; el.scrollLeft+=e.deltaY; e.preventDefault(); },{passive:false});
  document.addEventListener('click',e=>{ const a=e.target.closest&&e.target.closest('[data-hs]'); if(!a) return; e.stopPropagation(); const el=a.parentElement.firstElementChild; el.scrollBy({left:(+a.dataset.hs)*el.clientWidth*0.7,behavior:'smooth'}); },true);
})();
addEventListener('resize',()=>{ clearTimeout(window.__fitT); window.__fitT=setTimeout(fitLobby,120); });

/* ── 0200-skin-shop.js에서 ── */
/* ===== 자동 스킨 상점: 2주마다 캐릭터 한 명의 새 의상을 만들어 캐시 상점 패키지로 팔아요(재화는 게임 안 유료 재화) ===== */
const SKIN_PRICE=1280;
const skinHave=k=>!k||!k.shop||!!(P().skinOwn||{})[k.id];

/* ── 0270-skin-proposal.js에서 ── */
/* ===== 스킨 제안: 스탠딩을 먼저 보여 주고, 수락하면 나머지를 한꺼번에 만들어요 ===== */
let SKPROP=null;
// 스킨 상점: 사기 전에 스탠딩을 크게 보여 주고(제안), 사면 고른 그림·대사를 한꺼번에 만들어요
let SKBUYSEL=null;
let SKJOB=null;

/* ── 0455-persona.js에서 ── */
/* ===== 캐릭터 개성·매력: 개성 시트 · 프로필 템플릿 · 개성 검수 · AI 생성/다듬기 · 인연 톡 · 메모리얼 ===== */
/* c.persona = {traits[],self,call,ending,quirk,catch,gap,flaw,want,fear,likes[],dislikes[],hobby,motif}  (말투·성격·매력 포인트)
   c.pfields = {라벨:값}  (게임마다 고르는 프로필 템플릿: 생일·신장·출신 …)
   c.memorial = {lv,title,script,lines[]}  (호감도 lv에서 열리는 메모리얼 장면 + 메모리얼 로비 대사)
   인연 톡 = G.threads의 trigger {type:'aff',value:n} (기존 메신저 그대로)
   설정: G.meta.persona = {tpl:[라벨…], affLv:[2,4,6,8], memoLv:8}. 문서: docs/research/character.md */
const PERSONA_FIELDS=[['traits','핵심 성격 (3개)','list'],['self','1인칭','text'],['call','플레이어를 부르는 말','text'],['ending','말끝·어미 (예: ~거든, ~해요)','text'],['quirk','말버릇','text'],['catch','대표 대사','text'],
  ['gap','반전 매력','text'],['flaw','결점·약점','text'],['want','원하는 것','text'],['fear','두려워하는 것','text'],['likes','좋아하는 것','list'],['dislikes','싫어하는 것','list'],['hobby','취미','text'],['motif','상징 (모티프)','text']];
const PROFILE_TPLS={basic:['생일','신장','출신','특기'],org:['소속','직책','생일','신장','출신','특기'],operator:['코드네임','출신','생일','신장','전투 경력','특기','임상 소견'],fantasy:['종족','출신','생일','신장','계약','특기'],idol:['소속사','데뷔','생일','신장','담당','팬덤 이름'],streamer:['활동명','플랫폼','데뷔','구독자 애칭','방송 장르','생일']};
const PERSONA_GENERIC=/^(친절|상냥|착함|착한|밝음|밝은|명랑|쿨|쿨함|차가움|차가운|귀여움|귀여운|활발|활발함|성실|성실함|다정|다정함|조용|조용함|무뚝뚝|츤데레|냉정|냉정함|따뜻함|강함|용감|용감함|똑똑함|진지함)$/;
const pStrs=v=>(Array.isArray(v)?v:String(v||'').split(/[,，·/]/)).map(x=>String(x||'').trim()).filter(Boolean).slice(0,8);
const affThreads=c=>G.threads.filter(t=>t.charId===c.id&&t.trigger&&t.trigger.type==='aff');




let PS_JOB=null;
const psReopen=c=>{ if(!$('#modal').hidden&&typeof openChar==='function'){ closeModal(); openChar(c.id); } else render(); };
document.addEventListener('change',e=>{ if(e.target.id==='ps_tpl'&&PROFILE_TPLS[e.target.value]) $('#ps_tplf').value=PROFILE_TPLS[e.target.value].join(', '); });
document.addEventListener('click',async e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act, c=el.dataset.id&&charById(el.dataset.id);
  if(a==='psedit'&&c) openPersona(c.id);
  else if(a==='pssave'&&c){ personaSave(c); closeModal(); toast('개성을 저장했어요'); if(typeof openChar==='function') openChar(c.id); }
  else if(a==='psai'&&c){ if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; } auditSnap([c],'개성 '+(el.dataset.k==='improve'?'다듬기':'채우기')); if(await personaAI(c,el.dataset.k,{lines:el.dataset.k==='improve',btn:el})){ toast('개성을 반영했어요 (점검 화면에서 되돌리기 가능)'); psReopen(c); } }
  else if(a==='psreview'&&c){ if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; } if(await personaAIReview(c,uiProg(el))) psReopen(c); }
  else if(a==='pstalk'&&c){ if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; } const n=await talkAffGen(c,uiProg(el)); if(n){ toast(`인연 톡 ${n}개를 만들었어요`); psReopen(c); } }
  else if(a==='psmemo'&&c){ if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; } if(await memorialGen(c,uiProg(el))){ toast('메모리얼을 만들었어요'); psReopen(c); } }
  else if(a==='psmemoplay'&&c&&c.memorial){ closeModal(); playStory(c.memorial.title,c.memorial.script); }
  else if(a==='psmemolobby'&&c){ const p=P(); p.memoOn=p.memoOn||{}; p.memoOn[c.id]=!p.memoOn[c.id]; mark('prog'); toast(p.memoOn[c.id]?'메모리얼 로비를 켰어요. 로비에서 메모리얼 대사가 나와요':'메모리얼 로비를 껐어요'); psReopen(c); }
  else if(a==='psopen') openPersonaAll();
  else if(a==='pscfg'){ personaCfgSave(); toast('개성 설정을 저장했어요'); openPersonaAll(); }
  else if(a==='psbatch') personaBatch(el.dataset.k);
  else if(a==='psstop'){ if(PS_JOB) PS_JOB.stop=true; }
  else if(a==='psundo'){ auditUndo(); openPersonaAll(); } });
