/* ===== 0010-base — 불러올 때(상수·상태·리스너): 계층 파일 밖에 남은 옛 조각을 이름 순(불러오는 순서)으로 이음 ===== */

/* ── 0010-rules.js에서 ── */
/* =========================================================
   규칙과 형식
   ========================================================= */
/* 등장인물 성별 구성: f=여성만, m=남성만, mix=혼성, ''=AI가 정함. 아군·NPC를 만드는 모든 요청에 들어가요 */
const CAST_SEX={f:'여성만',m:'남성만',mix:'여성 + 남성 혼성'};
Object.defineProperty(window,'RULES',{get:rulesText});
const ROLE = {atk:'공격',def:'방어',sup:'지원'};
const ROLE_EN={atk:'ASSAULT',def:'GUARD',sup:'SUPPORT'};
const KIND = {dmg:'단일 공격',aoe:'전체 공격',heal:'전체 회복',shield:'전체 보호막',buff:'전체 공격력 강화'};
let ELEMS = ['홍','녹','청'];
const ECOL = {'홍':'var(--e1)','녹':'var(--e2)','청':'var(--e3)'};
const BEATS = {'홍':'녹','녹':'청','청':'홍'};
const RL = {3:'SSR',2:'SR',1:'R'};
const RCOL = {1:'#6fb7ff',2:'#b48cff',3:'#ffd35a'};
const REFUND = {3:300,2:80,1:30};
const COST = 120;
const VER = 3;
const DEFAULT_META={materialTermNamesVersion:1,title:'낙성계약',sub:'STARFALL CONTRACT',theme:'tactical',accent:'#ffb400',
  terms:{player:'관리관',currency:'성석',gold:'크레딧',expMat:'전투 기록',wMat:'스킬 교본',core:'승급(Lv1~70) 재료',gearMat:'장비 강화 재료',transcMat:'초월승급(Lv71~120) 재료',gacha:'계약',ops:'작전',crew:'대원',talk:'등대톡',dispatch:'파견',farm:'훈련',pass:'시즌 패스',event:'이벤트',weapon:'전용 무기',files:'기밀 파일',skin:'스킨',enhance:'강화',limit:'돌파',abyss:'미지 탐사',construct:'영입',res1:'연료',res2:'탄약',res3:'합금',res4:'부품'},
  elems:[{n:'홍',c:'#ff5a5a'},{n:'녹',c:'#4fd18b'},{n:'청',c:'#4fa3ff'}],
  roles:{atk:'공격',def:'방어',sup:'지원'},
  farms:[{key:'exp',name:'전투 기록 회수'},{key:'gold',name:'크레딧 수급'},{key:'wmat',name:'스킬 교본 회수'},{key:'core',name:'성핵 코어 정제'}],
  shop:{name:'보급관',charId:'',hello:['어서 와요, {관리관}. 오늘은 뭐가 필요해요?','재고 넉넉해요. 천천히 골라요.','오늘 들어온 물건, 꽤 괜찮아요.'],buy:['좋은 선택이에요!','고마워요. 다음에 또 와요.','포장해 둘게요. 잘 쓰세요.'],poor:['음… 그건 조금 모자라요.','작전 한 번 다녀오면 살 수 있을 거예요.']}};
const TERM_LABEL={player:'플레이어 호칭',currency:'유료 재화',gold:'일반 재화',expMat:'경험치 재료',wMat:'스킬 강화 재료',core:'승급(Lv1~70) 재료',gearMat:'장비 강화 재료',transcMat:'초월승급(Lv71~120) 재료',gacha:'뽑기 이름',ops:'전투 메뉴',crew:'아군 호칭',talk:'메신저 앱',dispatch:'파견',farm:'재료 던전',pass:'패스',event:'이벤트',weapon:'전용 무기',files:'캐릭터 기록',skin:'스킨',enhance:'강화',limit:'돌파',abyss:'로그라이크 탐험',construct:'건조/영입 메뉴',res1:'건조 자원 1',res2:'건조 자원 2',res3:'건조 자원 3',res4:'건조 자원 4 (바리에이션)'};

/* ── 0060-util.js에서 ── */
/* =========================================================
   유틸
   ========================================================= */
const $=s=>document.querySelector(s);
const clone=o=>JSON.parse(JSON.stringify(o));
const uid=()=>Math.random().toString(36).slice(2,10);
const rand=a=>a[Math.floor(Math.random()*a.length)];
const nf=n=>Math.round(n).toLocaleString('ko-KR');
const num=(v,a,b,d)=>{v=Number(v);if(!isFinite(v))v=d;return Math.min(b,Math.max(a,v));};
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const today=()=>new Date().toDateString();
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const charById=id=>G.chars.find(c=>c.id===id);
const libById=id=>G.lib.find(l=>l.id===id);
const playerName=()=>P().player||T('player');
const sub=t=>{ const n=playerName(); let s=String(t??''); if(s.indexOf('{')<0) return s; new Set(['관리관','플레이어','주인공','이름','player',T('player'),DEFAULT_META.terms.player]).forEach(k=>{ if(k) s=s.split('{'+k+'}').join(n); }); return s; };
const isMe=w=>w==='나'||w==='관리관'||w===T('player')||(!!P().player&&w===P().player&&!G.chars.some(c=>c.name===w));
// 조용히 넘어가는 오류 기록: 비동기 작업(AI·그림·스킬 생성 등)이 실패해도 흐름은 이어 가되, 원인을 잃지 않게 남겨요(프롬프트 스튜디오 → AI 기록)
const QUIET=[];
const TEXT_FACE=[[/(\?!|!\?|헉|깜짝|에엣|뭐라고|말도 안 돼|설마)/,['놀람','당황']],[/(짜증|용서 못|그만해|닥쳐|이 녀석|흥[!.]|화났|건방)/,['화남','짜증']],[/(ㅠ|흑|흐윽|미안해|슬퍼|눈물|그리워|보고 싶)/,['울먹','슬픔']],[/(([가-힣]), \2|그게 아니라|부, 부끄|어, 어떡)/,['당황','부끄럼']],[/(후후|하하|헤헤|에헤|고마워|다행|기뻐|좋아!)/,['웃음','미소']],[/(…|\.\.\.)$/,['생각','평온']]];
/* 꾹 눌러(0.35초) 좌우로 문지르면 쓰다듬기 — 로비·캐릭터 화면·이벤트 상점 */
const PET={on:0,swallow:0};
document.addEventListener('pointerdown',e=>{ if(e.button>0) return; const el=e.target.closest&&e.target.closest('[data-act=poke],[data-act=cspoke],[data-act=evspoke]'); if(!el) return;
  const kind=el.dataset.act, c=charById(kind==='poke'?P().sec:el.dataset.id); if(!c) return;
  const S0={kind,el,c,x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY,dir:0,last:e.clientX,turns:0,n:0,id:e.pointerId,hand:null,ring:null};
  const end=()=>{ clearTimeout(tm); removeEventListener('pointermove',mv); removeEventListener('pointerup',up); removeEventListener('pointercancel',up); if(S0.hand){ S0.hand.remove(); S0.ring&&S0.ring.remove(); PET.on=0; PET.swallow=Date.now(); } };
  const tm=setTimeout(()=>{ PET.on=1; try{ el.setPointerCapture&&el.setPointerCapture(e.pointerId); }catch(_){} S0.hand=document.createElement('div'); S0.hand.className='pet-hand'; S0.hand.textContent='🖐'; S0.hand.style.left=S0.x+'px'; S0.hand.style.top=S0.y+'px'; S0.ring=document.createElement('div'); S0.ring.className='pet-ring'; S0.ring.style.left=S0.x+'px'; S0.ring.style.top=S0.y+'px'; document.body.append(S0.ring,S0.hand); if(navigator.vibrate) try{ navigator.vibrate(12); }catch(_){} },350);
  const mv=ev=>{ if(ev.pointerId!==S0.id) return; S0.x=ev.clientX; S0.y=ev.clientY;
    if(!S0.hand){ if(Math.hypot(ev.clientX-S0.x0,ev.clientY-S0.y0)>12) end(); return; }
    ev.preventDefault(); S0.hand.style.left=S0.x+'px'; S0.hand.style.top=S0.y+'px'; S0.ring&&(S0.ring.style.left=S0.x+'px',S0.ring.style.top=S0.y+'px');
    const dx=ev.clientX-S0.last; if(Math.abs(dx)<14) return; const d=dx>0?1:-1; S0.last=ev.clientX;
    if(d!==S0.dir){ if(S0.dir) S0.turns++; S0.dir=d; S0.hand.style.transform=`translate(-50%,-70%) rotate(${d*14}deg)`; if(S0.turns&&S0.turns%2===0){ S0.n++; petTick(S0); if(S0.n===1) petAffect(S0.c); } } };
  const up=ev=>{ if(ev.pointerId===S0.id) end(); };
  addEventListener('pointermove',mv,{passive:false}); addEventListener('pointerup',up); addEventListener('pointercancel',up); },true);
document.addEventListener('click',e=>{ if(PET.swallow&&Date.now()-PET.swallow<400){ PET.swallow=0; e.stopPropagation(); e.preventDefault(); } },true);
document.addEventListener('contextmenu',e=>{ if(PET.on||(e.target.closest&&e.target.closest('[data-act=poke],[data-act=cspoke],[data-act=evspoke]'))) e.preventDefault(); },true);
/* 글 도우미: AI 답의 대본 줄 정리(nl·unComma)·문자열 목록(strs) */
const nl=s=>unComma(Array.isArray(s)?s.map(x=>typeof x==='string'?x:x&&typeof x==='object'?(x.name||x.speaker?`${x.name||x.speaker}: ${x.text||x.line||''}`:String(x.text||x.line||'')):String(x)).join('\n'):String(s||'').replace(/\\n/g,'\n'));
const strs=a=>(Array.isArray(a)?a:[]).map(String).filter(Boolean);
