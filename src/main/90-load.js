/* ===== 불러올 때 — 상수·상태·리스너(함수가 아닌 맨 위 문장, 원래 순서). class 선언 뒤에 둠(class는 끌어올려지지 않음) ===== */
/* ── 부작용 없는 선언(상수·상태 초기값 — tools/reshape.mjs --hoist가 실행 문장 앞으로 올림, 원래 순서) ── */
/* ── 부작용 없는 선언(상수·상태 초기값 — tools/reshape.mjs --hoist가 실행 문장 앞으로 올림, 원래 순서) ── */
/* ── 부작용 없는 선언(상수·상태 초기값 — tools/reshape.mjs --hoist가 실행 문장 앞으로 올림, 원래 순서) ── */
/* 등장인물 성별 구성: f=여성만, m=남성만, mix=혼성, ''=AI가 정함. 아군·NPC를 만드는 모든 요청에 들어가요 */
const CAST_SEX={f:'여성만',m:'남성만',mix:'여성 + 남성 혼성'};
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
const playerName=()=>P().player||System.T('player');
const sub=t=>{ const n=playerName(); let s=String(t??''); if(s.indexOf('{')<0) return s; new Set(['관리관','플레이어','주인공','이름','player',System.T('player'),DEFAULT_META.terms.player]).forEach(k=>{ if(k) s=s.split('{'+k+'}').join(n); }); return s; };
const isMe=w=>w==='나'||w==='관리관'||w===System.T('player')||(!!P().player&&w===P().player&&!G.chars.some(c=>c.name===w));
// 조용히 넘어가는 오류 기록: 비동기 작업(AI·그림·스킬 생성 등)이 실패해도 흐름은 이어 가되, 원인을 잃지 않게 남겨요(프롬프트 스튜디오 → AI 기록)
const QUIET=[];
const TEXT_FACE=[[/(\?!|!\?|헉|깜짝|에엣|뭐라고|말도 안 돼|설마)/,['놀람','당황']],[/(짜증|용서 못|그만해|닥쳐|이 녀석|흥[!.]|화났|건방)/,['화남','짜증']],[/(ㅠ|흑|흐윽|미안해|슬퍼|눈물|그리워|보고 싶)/,['울먹','슬픔']],[/(([가-힣]), \2|그게 아니라|부, 부끄|어, 어떡)/,['당황','부끄럼']],[/(후후|하하|헤헤|에헤|고마워|다행|기뻐|좋아!)/,['웃음','미소']],[/(…|\.\.\.)$/,['생각','평온']]];
/* 꾹 눌러(0.35초) 좌우로 문지르면 쓰다듬기 — 로비·캐릭터 화면·이벤트 상점 */
const PET={on:0,swallow:0};
/* 글 도우미: AI 답의 대본 줄 정리(nl·unComma)·문자열 목록(strs) */
const nl=s=>System.unComma(Array.isArray(s)?s.map(x=>typeof x==='string'?x:x&&typeof x==='object'?(x.name||x.speaker?`${x.name||x.speaker}: ${x.text||x.line||''}`:String(x.text||x.line||'')):String(x)).join('\n'):String(s||'').replace(/\\n/g,'\n'));
const strs=a=>(Array.isArray(a)?a:[]).map(String).filter(Boolean);
// ── 공통 형식
const BATTLE_FLOW_BASE='\n전투 흐름: 스테이지마다 전투가 있는 건 게임 구조일 뿐이다. 데이트·일상·대화 장면 한가운데에 갑작스러운 습격을 만들어 전투에 억지 개연성을 붙이지 않는다. pre는 장면이 자연스럽게 마무리되는 곳에서 끝내고, 전투는 훈련·의뢰·순찰 중 마주친 적 정도로 한 줄만 언급하거나 아예 언급하지 않아도 된다. post도 전투를 길게 되짚지 말고 이야기의 흐름을 이어 간다.';
const TITLE_RULE_BASE="게임 이름은 요즘 서브컬처 가챠 게임처럼 짧고 느낌 있게 짓는다(실제 게임 이름은 쓰지 않는다): 2~4글자 한자어·합성어(예: 심연잔향, 성흔, 월하), 또는 영어 두 단어를 한글로 읽은 이름(예: 어비스 에코, 노바 레퀴엠). '~의 ~'처럼 풀어 쓴 이름이나 설명 같은 이름은 피한다. sub는 영문 제목(예: Abyss Echo). ";
const NAI_CHAR_BASE='naiPrompt는 NovelAI용 영어 태그 문자열. "1girl, solo"(남자는 "1boy, solo")로 시작하고, 나이를 직접 나타내는 태그(mature female, adult woman 등)는 기본으로 넣지 않는다. 캐릭터 설정상 꼭 필요할 때만 스스로 판단해서 넣는다. V4 이상 모델 기준의 자연스러운 태그로 머리, 눈, 체형, 의상, 장신구, 들고 있는 무기 같은 외모 태그만 쓴다. 자세, 구도, 배경, 화풍 태그는 쓰지 않는다(앱이 따로 붙인다). 엘프처럼 귀가 뾰족한 종족이면 elf, pointy ears를 꼭 넣고, 사람이면 귀 모양 태그를 넣지 않는다(앱이 사람에게는 뾰족한 귀를 막는다). 의상·장신구·무기는 이 게임의 세계관·소속·직업·계급에 꼭 맞게 고르고, 세계관에 어울리지 않는 요소(현대 배경의 중세 갑옷, 판타지 배경의 교복·스마트폰 따위)는 쓰지 않는다. 무기를 든 모습을 넣을 때는 그 캐릭터의 전용 무기와 같은 무기만 쓴다. 아군·동료에게 적 전용 태그(faceless)는 쓰지 않는다.';
const EXPLORATION_NAME_RULE_BASE='탐사 콘텐츠 이름(terms.abyss)은 세계관에 어울리는 2~12자 이름으로 짓는다. 파티를 편성해 여러 구역에서 전투·발견·사건을 겪고 돌아오는 반복 탐사 콘텐츠다. 지하·심연을 전제하지 말고, 다른 메뉴 이름과 구분한다.';
const JSON_STRICT_BASE='\n\n[중요] 응답 전체가 올바른 JSON 하나여야 한다. 문자열 안의 줄바꿈은 \\n으로, 큰따옴표는 \\"로 쓴다. 마지막 항목 뒤에 쉼표를 두지 않는다. JSON 앞뒤에 설명을 붙이지 않는다.';
// ── 세계관·규칙
const POS_RULE_BASE='포지션은 4~8개, 세계관의 군 편제·직업·함종 같은 분류로 짓는다. base는 전투 기본형(atk 공격·def 방어·sup 지원). t는 기능 보정(%: hp atk def spd dmg 주는피해 taken 받는피해 heal 회복량 crit 치명타%p, sp 시작 SP 0~50, threat 위협도 -80~150). 보정은 -40~+40 안에서 장단점이 같이 있게.';
const EXPEDITION_RULE_BASE='파견은 6개 — 이름·설명만 쓴다(실제 의뢰의 시간·인원·보상은 게임의 파견 게시판이 매일 정한다). expedition은 파견(원정) 방식이다: 전투·모험 세계관은 combat(지역에 보내 자원을 가져옴), 아이돌·연예계는 idol(방송·행사 출연), 방송인·크리에이터는 streamer(콘텐츠 제작), 가게·회사 경영은 business(파트에 배치해 영업). 세계관에 가장 맞는 하나를 고르고, dispatches 이름도 그 방식에 맞게 짓는다. expeditionNames는 고른 방식의 이름을 세계관에 맞게 짓는다(combat이면 비워 둔다). fame은 인기 수치 이름(idol의 인지도, streamer의 구독자, business의 평판에 해당). jobs는 idol이면 7개(작은 일→큰 무대 순으로 지역 방송·팬 사인회·광고 촬영·음악 방송·예능 고정·드라마 출연·단독 콘서트에 해당하는 일), streamer면 3개(긴 영상·생방송·짧은 영상에 해당하는 매체), business면 4개(손님 응대·만들기·홍보·관리에 해당하는 파트 — 세계관의 가게·사업 종류에 맞게, 식당을 전제하지 않는다). 각 2~10자.';
const VARIANT_RULE_BASE='variants는 같은 캐릭터의 다른 모습(특별 의상) 기본형 4~6개다: 교복·수영복·갑옷·무대의상처럼 여러 캐릭터에게 공통으로 입힐 수 있는 틀을 이 세계관에 맞게 짓는다(계절·행사·직업·의식 등). cond에는 그 틀이 어울리는 역할(atk/def/sup)·소속·속성만 넣고, 모두에게 어울리면 비운다. 위에서 정한 세력·속성 이름을 그대로 쓴다.';
// ── 세력·등장
const CAST_LOCK_RULE_BASE='첫 등장 장면이 정해진 대원은 그 장면에서만 처음 만난다. 정해진 장면이 없는 대원은 메인 스토리의 새 장을 쓸 때 이야기 흐름에 맞으면 첫 만남 장면으로 처음 등장시킨다. 이벤트·외전·메신저에서는 아직 만나지 않은 사이다.';
const CAST_PLAN_RULE_BASE='등장 계획을 반드시 지킨다: 처음부터 함께하는 동료는 프롤로그에서 처음 만나고 1장부터는 이미 아는 사이다(1장에 첫 만남 장면으로 쓰지 않는다). 1장에서 처음 만나는 인물은 정해진 스테이지에서 처음 등장하고 그 전에는 나오지 않는다. 나중 등장 인물은 프롤로그와 1장에 내지 않는다.';
const BESTIARY_RULE_BASE='적은 세력 목록의 적대·괴물 세력에 속하게 하고(faction), bestiary에 새 적(사람·캐릭터가 아닌 적)마다 정체·습성·약점을 쓴다. 몬스터는 말하는 동료·NPC가 아니다.';
const CAST_RARITY_RULE_BASE='희귀도는 R이 가장 많게 한다 — 뽑기·영입의 대부분이 R이라 R이 1~2명뿐이면 같은 대원만 되풀이해 나온다.';
const PLAN_WRITE_RULE_BASE='이 장의 분기가 있다면 장 전체에서 한 번만, 전체 구성에서 그 선택이 일어나는 스테이지에서만 쓴다.';
const FINALE_RULE_BASE='finale(장의 마지막 스테이지 형식)은 장르에 맞게 정한다: 전투가 중심인 세계관이면 battle(마지막 스테이지는 반드시 보스전, battle:true), 무대·투표로 경쟁하면 contest(결승 콘테스트, mode "contest", enemies는 빈 배열), 논쟁·협상·재판이 중심이면 debate(결정적인 회담, mode "debate", enemies는 빈 배열).';
const STAGE_WRITE_RULE_BASE='회담·콘테스트 스테이지는 그 전(pre)과 후(post)만 대본으로 쓴다. 회담 자체(추궁·증거·설득)와 콘테스트의 무대 경연(매력 어필·심사)은 게임이 진행하므로 대본에 쓰지 않는다.';
/* 그림 프롬프트 가드: 사람이 나오면 안 되는 그림에서 사람 태그를 빼요 */
const IMG_NOHUMAN={bg:'no humans, scenery',map:'no humans, scenery',prop:'no humans, object focus',icon:'no humans, object focus'};
const PERSON_TAG=/^(\d+\+?(girls?|boys?|others?)|solo|solo focus|multiple (girls|boys|others)|couple|crowd|people|person|human|character|girl|boy|woman|man|female|male|child|loli|shota|.* (hair|eyes|pupils|ears|bangs|sidelocks|ahoge)|(long|short|medium|very long) hair|ponytail|twintails|braids?|hair (ornament|ribbon|bun|between eyes)|bangs|smile|smiling|blush|open mouth|closed mouth|closed eyes|expressionless|.*(face|lips|teeth|tongue)|looking at viewer|looking (back|away|up|down)|standing|sitting|kneeling|lying|walking|running|arms? (up|crossed|behind back|at sides)|hands? (up|on hips)|holding.*|(full|upper|lower) body|cowboy shot|portrait|close-up|from (behind|side)|breasts|.*(breasts|thighs|legs|arms|navel|cleavage)|thighhighs|pantyhose|bare (shoulders|legs|arms)|.* (dress|skirt|shirt|uniform|jacket|coat|gloves|boots|stockings))$/i;
/* 교훈(정정 기록 → 다음부터 지침으로) */
const PL_KEY='ggm-plessons';
const PL_SEED={
 'img-person-bg':{scope:'img',rule:'배경(backgrounds·배경 프롬프트)은 사람이 없는 풍경이다. "no humans, scenery"로 시작하고 장소·시간·날씨·조명·사물 태그만 쓴다. 1girl, solo, 머리·눈·의상·표정·자세 태그를 쓰지 않는다.'},
 'img-person-prop':{scope:'img',rule:'소품·아이템·무기 프롬프트는 물건 하나만 그린다. "no humans, object focus"로 시작하고 재질·모양·색·장식 태그만 쓴다. 들고 있는 사람(holding, 1girl, hands)이나 인물 태그를 쓰지 않는다.'},
 'img-person-map':{scope:'img',rule:'지도 그림은 사람 없는 지도·조감도다. "no humans, scenery"로 시작한다.'},
 'img-person-icon':{scope:'img',rule:'아이콘은 사람 없는 물건 하나다. "no humans, object focus"로 시작한다.'}};
/* 화면 */
let PS_TAB='frag';
const NAI_POSES=[['정면 서기','straight-on, standing, looking at viewer, arms at sides'],['손 허리','standing, hand on own hip, looking at viewer'],['팔짱','standing, crossed arms, looking at viewer'],['무기 들기','standing, holding weapon, looking at viewer'],['손 흔들기','standing, waving, smile, looking at viewer'],['브이','standing, v, looking at viewer'],['뒤돌아보기','standing, looking back, from behind'],['한쪽 무릎','kneeling, on one knee, looking at viewer'],['앉기','sitting, looking at viewer'],['역동적','dynamic pose, action pose, looking at viewer'],['수줍게','standing, hands together, looking away, blush']];
const NAI_FRONT='straight-on, standing, looking at viewer, arms at sides';
const BESTIARY_SCHEMA='"bestiary":[{"name":"이 이야기에 새로 나온 적 이름 그대로(사람·캐릭터인 적 제외)","faction":"속한 적대·괴물 세력 이름","desc":"정체 한 문장","nature":"습성","weak":"약점"}]';
const FACTION_SCHEMA='[{"name":"","kind":"playable|hostile|neutral|monster","desc":"","goal":"","leader":"","base":"","ideology":"","secret":"","origin":"","nature":"","weakness":"","rel":{},"stance":[]}]';
const REL_SCHEMA=()=>`"relations":[{"a":"인물 이름","b":"인물 이름(플레이어는 ${System.T('player')})","kind":"관계 2~8자(예: 첫 만남, 동료, 라이벌, 스승과 제자, 짝사랑, 적대, 은인)","note":"지금 두 사람의 관계 1~2문장","event":"이번에 둘 사이에 있었던 일 한 줄"}]`;
/* src/main/0185-game-rules.js */
const POS_SCHEMA='"positions":[{"name":"포지션 이름(2~4자)","base":"atk|def|sup","range":"melee|ranged|support","desc":"기능 한 줄","t":{"hp":0,"atk":0,"def":0,"spd":0,"dmg":0,"taken":0,"heal":0,"crit":0,"sp":0,"threat":0}}]';
// 새 게임 세계관 단계의 반응 스키마 — 값의 뜻은 종류마다 다름(REACT_TYPES)
const REACT_SCHEMA='"reactions":[{"a":"속성","b":"다른 속성","name":"반응 이름","type":"amp|burst|stun|vuln","value":"amp는 피해 배율 1.2~2, burst는 공격력×값 0.5~2, stun은 기절 초 0.5~2, vuln은 받는 피해 +% 10~40"}]';
// 장의 마지막(클라이맥스) 스테이지 형식 — 세계관 단계가 장르에 맞게 고름(G.meta.story.finale). 지시문은 프롬프트 스튜디오의 FINALE_RULE, 값은 여기서
const FINALE_SCHEMA='"finale":"battle|contest|debate"';
const NPC_SCHEMA='"newNpcs":[{"name":"","role":"한 단어","profile":"1~2문장","speech":"말투 한 줄","naiPrompt":"NovelAI 영어 외형 태그. 1girl, solo 또는 1boy, solo로 시작"}]';
/* src/main/0487-formation-sortie.js */
// 생성기가 쓰는 경로 지점 이름 스키마·정리(1장(새 게임)과 2장 이후가 같이 씀)
const ROUTE_SCHEMA='"route":{"n1":"첫 교전 지점 이름","fork":"갈림길 상황 한 줄","a":"정면 길(강한 적) 이름","b":"우회 길(보급) 이름","boss":"최종 지점 이름"}';
/* src/main/0505-construct.js */
// 새 게임 세계관 단계의 바리에이션 결과 정리(엔진 GGMConstruct.variantsFrom + id). 지시문은 프롬프트 스튜디오의 VARIANT_RULE
// 새 게임 세계관 단계 스키마: 건조 메뉴·자원 이름(terms), 바리에이션 기본형
const CON_TERMS_SCHEMA='"construct":"자원을 넣어 새 동료를 데려오는 메뉴 이름(2~4자)","res1":"그 메뉴에 넣는 자원 1(2~4자, 세계관 고유)","res2":"자원 2","res3":"자원 3","res4":"자원 4(귀한 것 — 특별 의상·바리에이션의 열쇠)"';
const VARIANT_SCHEMA='"variants":[{"name":"바리에이션 기본형 이름(2~6자)","prompt":"그 의상의 영어 이미지 태그(쉼표로)","brief":"디자인 지시 한 줄","cond":{"roles":["atk|def|sup 중 어울리는 역할만"],"factions":["어울리는 소속만"],"elems":["어울리는 속성만"]}}]';

/* src/main/0020-ai-connect.js · 0030-character-regen.js — 그림 설정 기본값 중 프롬프트 태그(설정 창에서 바꾸는 기본값: 종류별 덧붙임·제외 태그, 기본 제외 태그, ComfyUI 품질·제외 태그, 투명 배경 태그) */
const NAI_PARTS_DEF={char:{suffix:'simple background, white background',neg:'gradient background, cast shadow, drop shadow, floor'},enemy:{suffix:'full body, simple background, white background',neg:'text, gradient background, cast shadow, drop shadow, floor'},bg:{suffix:'no humans, scenery, detailed background',neg:'people, character, text'},prop:{suffix:'no humans, object focus, simple background, white background',neg:'people, character, text'},cg:{suffix:'detailed background, cinematic lighting',neg:'text, speech bubble, multiple views'},illust:{suffix:'detailed background, depth of field, cinematic lighting',neg:'simple background, white background, transparent background, multiple views, text'},lbcg:{suffix:'detailed background, cinematic lighting, dramatic angle, light particles, depth of field, masterpiece illustration',neg:'simple background, white background, transparent background, multiple views, text'},map:{suffix:'no humans, scenery, map, from above, top-down view, detailed, game map',neg:'people, character, text, watermark, frame'},icon:{suffix:'no humans, game item icon, single object, object focus, centered, simple background, white background',neg:'text, people, character, frame, border, multiple views'}};
const NAI_NEG_DEF='lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page';
const COMFY_TAGS_DEF={qtags:'masterpiece, best quality, amazing quality',neg:'lowres, bad anatomy, worst quality, low quality, watermark, text'};
const TP_BG_TAG='transparent background';
// 그림체 프리셋. 불러오면 설정 창의 칸이 채워지고, 저장을 눌러야 적용돼요.
// 숫자로 끝나는 태그(fungi542 등)는 ' ::'처럼 띄어 써야 NovelAI가 가중치로 착각하지 않아요.
const STYLE_PRESETS=[{id:'glossy',name:'닭장 그림체',by:'토스뱅킹',desc:'광택 있는 피부·의상, 진한 명암, 높은 밀도. V4.5·V5 권장',
  tags:'0.5::freng::, 0.3::artist:ramanda::, 0.3::modare::, 0.8::ie (raarami)::, 0.3::yoneyama mai::, 0.3::mochizuki kei::, 0.3::fungi542 ::, 0.2::re0n::, 0.5::blue gk::, 0.8::artist:mx2j::, artist:thirty 8ight, 0.4::fantongjun::, 0.2::aoi nagisa (metalder)::, 1.2::taesi::, year 2025, -1::multiple views::, -1::flat color::, -1::monochrome::, -3::simple illustration::, 1.2::best quality, amazing quality, very aesthetic, highres, absurdres, no text, masterpiece, ultra-detailed::, ultra complexity, high complexity',
  qtags:'',
  neg:'logo, cartoon, flat color, spot color, watermark, too many watermarks, blank page, text-only page, reference, username, signature, artist:xinzoruo, artist:milkpanda, artist collaboration, variant set, large variant set, 4koma, 2koma, toon (style), oekaki, chibi, turnaround, film grain, dithering, halftone, screentones, dated, old, 1990s (style), mutation, deformed, distorted, disfigured, artistic error, distorted anatomy, anatomical structure error, asymmetrical face, unnatural hair, bad eyes, cloudy eyes, blank eyes, bad proportions, bad limb, bad hands, extra hands, bad hand structure, extra digits, fewer digits, bad legs, extra legs, amputee, distorted composition, bad perspective, multiple views, negative space, animation error, chromatic aberration, disorganized colors, scan artifacts, jpeg artifacts, vertical lines, vertical banding, worst quality, bad quality, lowres, blurry, upscaled, fewer details, unfinished, incomplete, amateur, cheesy, unsatisfactory, inadequate, deficient, subpar, poor, displeasing, very displeasing, bad illustration, bad portrait, limited palette, bad anatomy, monochrome, official style',
  steps:23,scale:4.8,sampler:'k_euler_ancestral',cfgRescale:0.18},
  {id:'thickline',name:'쫀득 그림체',by:'톡마햄',desc:'굵은 선화, 점 코, 높은 밀도와 배경 묘사. V4.5·V5 권장',
  tags:'0.7::artist:rusellunt::, 0.55::artist:rehu_(astd5787)::, 0.55::artist:kakure_eria::, 0.55::artist:reagan_long::, 0.55::artist:hitobashira_(1746164306)::, 0.55::artist:ebora::, 0.6::artist:xipa::, 0.6::artist:sparrowl::, year 2025, year 2026, newest, -3::artist collaboration::, -2::simple illustration::, -2::monochrome, green theme, yellow theme::, -2::watercolor (medium), painterly, no lineart::, -2::official style, official art::, -2::flat color::, -1::dark areolae::, -1::breasts apart::, 1.5::high complexity::, masterpiece, best quality, very aesthetic, absurdres, expert shading, high detail, thick lineart, dot nose, detailed background',
  qtags:'',
  neg:'negative space, blank page, text, logo, watermark, too many watermarks, reference, signature, artist name, subtitles, captions, dated, chibi, artistic error, scan artifacts, jpeg artifacts, aliasing, film grain, heavy film grain, dithering, chromatic aberration, digital dissolve, halftone, screentone, artist:xinzoruo, artist:milkpanda, artist:kurukurumagical, artist collaboration, one-hour drawing challenge, 4koma, 2koma, mutated, mutation, deformed, distorted, disfigured, bad anatomy, unnatural hair, bad face, mob face, cloned face, distorted face, poorly drawn face, ugly, bad eyes, empty eyes, extra eyes, lazy eye, asymmetrical eyes, cross-eyed, bad proportions, wrong body proportions, unrealistic proportions, distorted body, long neck, wrong head size, bad limbs, missing limbs, extra limbs, amputee, bad arm, bad hands, malformed hands, poorly drawn hands, bad hand structure, extra digits, fewer digits, extra fingers, fused fingers, bad leg, extra leg, distorted composition, bad perspective, multiple views, disorganized colors, unrealistic colors, unfinished, incomplete, displeasing, very displeasing, unsatisfactory, inadequate, deficient, subpar, poor, blurry, lowres, duplicate, worst quality, bad quality, messy details, fewer details, bad portrait, bad illustration, awkward, bad posture, horse penis, ear blush, red ears, heart-shaped pupils',
  steps:28,scale:5,sampler:'k_euler_ancestral',cfgRescale:0.4}];
const STORY_LEN={short:['짧게',{pre:'8~12',post:'4~6',pro:'18~24'}],normal:['보통',{pre:'15~25',post:'8~15',pro:'30~40'}],long:['길게',{pre:'25~40',post:'12~20',pro:'45~60'}],xlong:['아주 길게',{pre:'40~60',post:'20~30',pro:'60~80'}]};
const AKEY='starfall-ai', PKEY='starfall-ai-profiles', NKEY='starfall-nai';
const AITYPE={anthropic:'Claude API',vertex:'Google Vertex AI',gemini:'Gemini API (AI Studio)',openai:'OpenAI 호환 (OpenRouter 등)',copilot:'GitHub Copilot (구독 필요)'};
const DEFM={anthropic:['claude-sonnet-5-5','claude-haiku-4-5-20251001'],gemini:['gemini-2.5-pro','gemini-2.5-flash'],vertex_google:['gemini-2.5-pro','gemini-2.5-flash'],vertex_anthropic:['',''],openai:['',''],copilot:['gpt-4.1','gpt-4.1']};
let NAIJOB=null, APD=null;
/* GitHub Copilot: GitHub 기기 로그인으로 받은 토큰을 이 기기에만 저장하고, 쓸 때마다 짧은 Copilot 토큰으로 바꿔요(비공식 방식) */
const COPILOT_CID='Iv1.b507a08c87ecfe98', COPILOT_H={'Editor-Version':'vscode/1.99.0','Editor-Plugin-Version':'copilot-chat/0.26.0','Copilot-Integration-Id':'vscode-chat','User-Agent':'GitHubCopilotChat/0.26.0'};
const CPTOK={};
const PXHOSTS=new Set();
const isLocalHost=h=>/^(localhost|127\.0\.0\.1|\[::1\]|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h);
let AILAST='', AISTAGE='';
const TMO={quick:60000,default:300000,complex:600000};
/* Vertex 서비스 계정 토큰 */
const TOKC={};
/* NovelAI */
const NAI_ENDPOINT='https://image.novelai.net/ai/generate-image';
const NAI_MODELS=[['nai-diffusion-5-full','V5 Full'],['nai-diffusion-5-curated','V5 Curated'],['nai-diffusion-4-5-full','V4.5 Full'],['nai-diffusion-4-5-curated','V4.5 Curated'],['nai-diffusion-4-full','V4 Full']];
const NAI_SIZES=[[832,1216,'세로 832×1216'],[1216,832,'가로 1216×832'],[896,1152,'세로 896×1152'],[1152,896,'가로 1152×896'],[1024,1024,'정사각 1024×1024']];
const NAI_FRAMES=[['full body','전신'],['cowboy shot','무릎 위'],['upper body','상반신'],['portrait','얼굴']];
const FRAME_TAGS=/^(full body|cowboy shot|upper body|portrait|lower body|feet out of frame)$/i;
const PACKKEY='ggm-packs', LLMKEY='ggm-llmslot';
/* 그림체 프리셋 썸네일: 프리셋 id별로 작은 그림(160px JPEG)을 이 기기에 저장해요. 내 프리셋을 코드로 내보내면 썸네일도 같이 가요 */
const PTHUMB='ggm-pthumb';
const llmCode=p=>'GGMLLM:'+btoa(unescape(encodeURIComponent(JSON.stringify({name:p.name,pos:p.pos,text:p.text}))));
// 모든 글 AI 요청에 지침을 끼워요: 상단=맨 앞, 중단=출력 형식(JSON만 출력…) 바로 앞, 하단=맨 끝
// 그림 태그 지침: AI가 NovelAI(그림) 태그를 쓰는 요청에만 출력 형식 바로 앞에 넣어요
const TAG_REQ=/NovelAI|naiPrompt|Danbooru|영어 태그|장면 태그/;
const packCode=p=>'GGMPACK:'+btoa(unescape(encodeURIComponent(JSON.stringify(p))));
const NAI_QUALITY={'nai-diffusion-5-full':'very aesthetic, masterpiece, best quality','nai-diffusion-5-curated':'very aesthetic, masterpiece, best quality','nai-diffusion-4-5-full':'very aesthetic, masterpiece, no text','nai-diffusion-4-5-curated':'location, masterpiece, no text','nai-diffusion-4-full':'no text, best quality, very aesthetic, absurdres'};
const ILK=k=>k==='illust'||k==='lbcg';
const isV4p=m=>/^nai-diffusion-(?:4|5)(?:-|$)/.test(String(m||'').trim());
const isV45=m=>/^nai-diffusion-4-5/.test(String(m||'').trim());
const COMPO_TAGS=/^(full body|standing|straight-on|simple background|white background|cowboy shot|upper body|portrait|looking at viewer|arms at sides|transparent background)$/i;
const AGE_TAGS=/^(mature female|mature male|mature woman|mature man|milf|mature|adult woman|adult man|adult|older woman|old woman|aged up)$/i;
const CG_POS={left:{x:.3,y:.5},center:{x:.5,y:.5},right:{x:.7,y:.5}};
const CG_POS_LABEL=[['auto','자동'],['left','왼쪽'],['center','가운데'],['right','오른쪽']];
/* Structured image prompts. Legacy strings remain the transport format and are never
   discarded. Unknown tags stay editable in other; no LLM is called on opening a UI. */
const NAI_BLOCK_KEYS=['appearance','outfit','other','style'];
// Rules version 3: separate style/quality without rewriting transport strings.
const NAI_BLOCK_RULE_VERSION=3;
const AIERR={origin_block:'이 서비스가 브라우저에서 온 요청(Origin 헤더)을 막았어요(403).',el_nokey:'설정의 소리에서 ElevenLabs 키를 넣어 주세요.',fish_nokey:'설정의 소리에서 Fish Audio 키를 넣어 주세요.',no_ai:'설정의 글 AI에서 AI를 먼저 등록해 주세요.',model_not_found:'모델 이름이나 리전을 확인해 주세요.',sa_bad:'서비스 계정 JSON을 확인해 주세요. 파일 내용 전체를 붙여넣어야 해요.',bad_key:'키가 올바르지 않거나 권한이 없어요. 설정의 글 AI에서 확인해 주세요.',network:'인터넷 연결을 확인해 주세요.',low_credit:'API 크레딧이 부족해요. Claude Console에서 충전해 주세요.',not_granted:'AI 사용 권한이 꺼져 있어요. 앱의 권한 메뉴에서 켤 수 있어요.',rate_limited:'요청이 많아요. 잠시 후 다시 시도해 주세요.',refused:'AI가 이 요청은 쓰지 않았어요. 수위나 내용을 바꿔 다시 시도해 주세요.',invalid_json:'AI 응답을 읽지 못했어요. 다시 시도해 주세요.',cancelled:'취소했어요.'};
let AI_QUIET=false,AI_QUIET_LAST='';
/* 그림체(직접 입력): NovelAI 저장 설정 읽기·내 그림체 */
const STYLE_EX='예: anime coloring, cel shading, vibrant colors  /  watercolor (medium), soft colors  /  1.2::artist:이름 ::';
/* ── 010-engine.js에서 ── */
/* CHARACTER_REGEN_MODULE */
// Partial regeneration stages a draft; only a confirmed, still-current draft can mutate saved data.
let REGEN=null,REGEN_JOB=null,IMGLIB=null;
const unFaceless=s=>String(s||'').replace(/(^|\s*,\s*)(1other\s*,\s*)?faceless\b/gi,(m,pre)=>pre||'').replace(/^[\s,]+/,'').trim();
const SKILL_TAGS={dmg:'attacking, slashing, weapon swing',aoe:'casting spell, magic circle, explosion, energy wave',heal:'casting spell, healing light, sparkles',shield:'magic barrier, shield, defensive stance',buff:'raising hand, aura, cheering, light rays'};
const NAI_HDR=tok=>({Authorization:'Bearer '+String(tok||'').trim(),'Content-Type':'application/json'});
/* ---- cut tool canvas helpers ---- */
const CUT_ZOOMS=[1,2,3,5,8];
const CUT_DEF={tol:30,soft:26,holes:false,despeck:true,shadow:true};
let NAI_TP_OFF=false;
/* 등장인물은 모두 성인이에요: 미성년으로 읽히는 태그는 그림 요청에서 빼요(직접 적은 태그·AI가 쓴 태그 모두) */
const MINOR_TAGS=/^(loli|lolicon|shota|shotacon|child|children|kid|kids|toddler|baby|infant|young child|young girl|young boy|little girl|little boy|preteen|pre-teen|underage|minor|teen|teens|teenage|teenager|aged down|elementary school student|middle school student|elementary schooler|middle schooler|kindergartener)$/i;
const stripMinor=s=>Core.tagList(s).filter(t=>!MINOR_TAGS.test(Core.tagKey(t))).join(', ');
/* 화풍 프리셋 편집 */
let CUTJOB=null;
let NPREP=null;
let NAIBATCH=null;
let FACESEL=new Set();
let FACEOPT=null;
/* ── 020-candidates.js에서 ── */
let IMAGE_CANDIDATES=null;
let ART_ASK=null;
const ART_ORDER=['char','upper','pose','lbbg','illust','scg','bg','enemy','icon','map','cg','prop','weapon'];
let CAST=null;
/* NPC 관리: 이름·외모·그림 프롬프트를 고치고 스탠딩·상반신을 다시 그려요 */
const NPCBUSY=new Set();
const castById=id=>charById(id)||(G.npcs||[]).find(n=>n.id===id);
/* 표정 한꺼번에: 고른 캐릭터마다 얼굴 범위를 차례로 칠하고(이미 칠했으면 건너뜀), 고른 표정을 모두 인페인팅으로 줄 세워 그려요 */
let CFSEL=null;
/* 게임마다 따로 있던 자료실(G.lib)을 게임끼리 재사용하게 해요.
   - 공유 보관함: 'ggm-shared-assets'(목록) + IDB 'shared::<id>'(그림·소리). 어느 게임에서 넣든 모든 게임에서 가져와요
   - 자동 재사용: 새 장 생성(addLib)·대본에서 찾은 자료(scanScriptAssets)가 그림 없이 생기면, 보관함에 같은 종류·이름이 있을 때 그대로 가져옴(shAdopt)
   - 사용처: 대본(스토리·톡·에피소드·메모리얼·일정)에서 이름을 세어 안 쓰는 자료를 보여 줌. 같은 프롬프트·이름 중복은 별칭(alias)으로 합침(그림 1장 공유)
   - 감정 아이콘(0462)의 그림을 직접 올려 바꿈(kind 'emote') · 문서 docs/research/direction.md */
const SH_KEY='ggm-shared-assets', SH_KINDS={bg:'배경',prop:'소품',cg:'CG',enemy:'적',icon:'아이콘',emote:'감정 아이콘',bgm:'음악',sfx:'효과음'};
const shAudio=k=>k==='bgm'||k==='sfx';
const shCache={};
let AM_TAB='shared';
const SKEY='starfall-sound';
// ElevenLabs 주소: 설정에 적으면 그 주소(중계 서버 등), 비우면 공식 주소
const EL_DEF='https://api.elevenlabs.io';
const SND_DEF={sfxOn:true,sfxVol:0.6,fishKey:'',fishModel:'s2.1-pro',elKey:'',elBase:'',elModel:'music_v1',elLen:90,bgmVol:0.5,voiceVol:1,bgmOn:true,voiceStory:true,voiceLobby:true,
  scene:{title:'타이틀',lobby:'로비',battle:'전투',boss:'보스전',gacha:'계약'}};
const audioCache={};
const sfxLast={};
 let voiceTok=0, voiceErr=false;
const cleanTTS=t=>String(t||'').replace(/\([^)]*\)/g,'').replace(/[「」『』]/g,'').trim();
/* 일본어 목소리: 대사를 글 AI로 일본어로 옮겨 읽어요. 옮긴 글은 저장해 두고 다시 써요 */
const JAKEY='ggm-voice-ja', JAWAIT={};
const jaKey=t=>System.hash(t).toString(36)+'_'+t.length;
const DEFAULT_WORLD = {
  name:'에덴포트',
  summary:'20년 전, 하늘에서 떨어진 별의 파편이 항구도시 에덴포트를 삼켰다. 파편을 몸에 받아들인 여성들, 성흔자는 괴물이 된 빛 \'잔광\'과 싸우며 도시를 지탱한다. 당신은 작은 계약사무소 \'새벽등대\'의 관리관이다.',
  lore:'낙성의 밤 이후 에덴포트는 둘로 갈라졌다. 기업이 지배하는 상층 구역과, 잔광이 출몰하는 회색구. 별의 파편인 성핵은 사람에게 힘을 주지만 오래 쓰면 정신을 갉아먹는다. 성흔자는 계약사무소에 소속되어 의뢰를 받고 싸우며, 관리관은 그들의 계약과 성흔 안정도를 관리한다. 거대 기업 헬릭스 컨소시엄은 성핵을 독점하려 하고, 회색구 시민회는 사무소들에 의지해 하루하루를 버틴다. 새벽등대는 그 사이에서 살아남은, 가난하지만 시끄러운 사무소다.',
  plot:'1부의 축: 헬릭스는 분화구 아래 잠든 "첫 번째 별"을 깨워 성핵을 무한히 생산하려 한다. 계획의 책임자는 세라의 옛 상관 바넷 소장. 관리관은 낙성의 밤의 유일한 생존자로, 기억은 없지만 성핵과 공명하는 체질이라 곁에 있는 성흔자의 폭주를 가라앉힌다. 헬릭스가 관리관을 노리는 이유이자, 대원들이 관리관에게 끌리는 이유. 이브는 이 사실을 처음부터 알고 있었다.',
  factions:[
    {name:'새벽등대',kind:'playable',desc:'회색구의 작은 계약사무소. 관리관과 대원들의 집. 성핵 사건을 맡는 몇 안 되는 독립 계약사로, 의뢰비보다 사람을 먼저 챙긴다는 평판 때문에 늘 적자다.',goal:'회색구 주민을 잔광에게서 지키고, 낙성의 진실을 밝힌다',leader:'관리관(플레이어)',base:'회색구 폐역 위 등대 건물',ideology:'계약은 지키되, 사람을 버리는 계약은 받지 않는다',secret:'창립자는 헬릭스의 전직 연구원이었다',rel:{'헬릭스 컨소시엄':'긴장 — 의뢰를 받지만 믿지 않는다','회색구 시민회':'동맹 — 주요 의뢰인','잔광':'적대'},stance:[]},
    {name:'헬릭스 컨소시엄',kind:'hostile',desc:'성핵 연구와 거래를 독점하려는 거대 기업. 겉으로는 도시 재건의 후원자지만, 잔광 발생 구역을 실험장으로 쓴다는 소문이 끊이지 않는다.',goal:'성핵 기술 독점과 낙성 지구 재개발',leader:'이사회(얼굴을 드러내지 않음)',base:'중앙구 헬릭스 타워',ideology:'효율과 계약, 손실은 숫자로만 센다',secret:'잔광 일부는 헬릭스 실험에서 새어 나왔다',rel:{'새벽등대':'이용 — 쓰고 버릴 하청','회색구 시민회':'적대 — 재개발 반대','잔광':'연구 대상'},stance:[{ch:1,s:'neutral',why:'표면상 의뢰인'}]},
    {name:'잔광',kind:'monster',desc:'성핵에 잠식되어 빛의 괴물이 된 존재들. 사람·동물·기계를 가리지 않고 빛에 먹히면 형체가 일그러진다.',origin:'낙성의 밤 쏟아진 성핵 파편이 생물에 스며들어 생긴 변이체',nature:'빛과 소리에 몰려들고, 밤이 깊을수록 무리 지어 움직인다. 잠식이 깊을수록 말을 잃는다',weakness:'성핵 핵(코어)을 부수면 흩어진다. 홍 속성 열에 약하다',goal:'없음(본능)',base:'폐선로·낙성 분화구',rel:{'새벽등대':'적대','헬릭스 컨소시엄':'포획 대상'},stance:[]},
    {name:'회색구 시민회',kind:'neutral',desc:'버려진 구역 주민들의 자치 조직이자 주요 의뢰인. 배급과 순찰을 스스로 꾸리며, 바깥 기업을 믿지 않는다.',goal:'회색구를 재개발에서 지키고 주민을 먹여 살린다',leader:'시민회 의장',base:'회색구 시장 골목',ideology:'우리 구역은 우리가 지킨다',rel:{'새벽등대':'동맹','헬릭스 컨소시엄':'적대','회색구 연합':'후원'},stance:[]},
    {name:'회색구 연합',kind:'playable',desc:'시민회가 꾸린 자경단 겸 구조대. 정식 계약사가 아니라 장비는 낡았지만 회색구 골목을 누구보다 잘 안다.',goal:'잔광 출몰 구역의 주민 구조와 순찰',leader:'연합 대장(시민회 의장의 조카)',base:'회색구 소방서 터',ideology:'먼저 달려가고, 나중에 따진다',rel:{'새벽등대':'협력 — 현장에서 손발을 맞춤','회색구 시민회':'소속','헬릭스 컨소시엄':'적대'},stance:[]}
  ]
};
const LI=(id,kind,name,prompt)=>({id,kind,name,prompt,img:null});
// 샘플 적 도감(정체·습성·약점) — 샘플 게임에서만(0070 syncEnemies)
const ENEMY_INFO={
 '잔광 하운드':{faction:'잔광',desc:'성핵 파편에 잠식된 들개 무리가 빛의 짐승이 된 것',nature:'소리를 쫓아 무리로 사냥한다',weak:'코어를 노린 집중 공격, 홍 속성'},
 '잔광 파수꾼':{faction:'잔광',desc:'무너진 건물 잔해가 성핵에 엉겨 붙어 생긴 거인',nature:'한 구역을 떠나지 않고 다가오는 것을 부순다',weak:'가슴의 코어, 느린 움직임'},
 '헬릭스 경비병':{faction:'헬릭스 컨소시엄',desc:'헬릭스가 고용한 무장 경비 인력(사람)',nature:'명령대로만 움직이고 퇴각이 빠르다',weak:'지휘관을 먼저 쓰러뜨리면 흩어진다'},
 '헬릭스 감시드론':{faction:'헬릭스 컨소시엄',desc:'헬릭스의 무인 감시 기체',nature:'발견한 대상을 표시해 경비병을 부른다',weak:'로터, 청 속성 전류'},
 '적색 잔광체':{faction:'잔광',desc:'낙성 분화구 깊은 곳에서 깨어난 거대 잔광',nature:'주변의 잔광을 끌어당겨 몸을 키운다',weak:'흩어진 코어를 하나씩 부숴야 한다'},
 '떠도는 등불':{faction:'잔광',desc:'축제 등불에 스며든 작은 잔광',nature:'사람의 그리움에 이끌려 떠돈다',weak:'빛을 가리면 약해진다'},
 '등불 잔광':{faction:'잔광',desc:'등불 잔광이 모여 불꽃 형체가 된 것',nature:'무리 지어 맴돌며 불씨를 퍼뜨린다',weak:'녹 속성 바람'},
 '거대 등불 잔광':{faction:'잔광',desc:'축제의 밤에 모인 등불 잔광이 하나로 뭉친 괴물',nature:'축제의 소원 등불을 삼켜 커진다',weak:'입 안의 코어'}};
const ENEMY_LOOKS={
 '잔광 하운드':'no humans, monster, wolf made of glowing green light, translucent crystalline body, sharp light shards on back, snarling, glowing eyes, creature focus',
 '잔광 파수꾼':'no humans, monster, tall humanoid golem of red light and rubble, glowing core in chest, cracked stone armor, menacing, creature focus',
 '헬릭스 경비병':'1other, faceless, armored corporate soldier, full-face helmet with blue visor, black tactical armor with helix emblem, holding rifle, menacing',
 '헬릭스 감시드론':'no humans, flying surveillance drone, mechanical, single red camera eye, rotors, sleek black and blue chassis, sci-fi',
 '적색 잔광체':'no humans, giant monster, colossal creature made of burning red light, many glowing eyes, star fragment in chest, crystalline spikes, apocalyptic, boss',
 '떠도는 등불':'no humans, floating paper lantern monster, glowing face on lantern, wisps of colored light, eerie, cute but creepy',
 '등불 잔광':'no humans, monster, lantern spirit, swirling colored light, ghostly flames, floating',
 '거대 등불 잔광':'no humans, giant lantern monster, huge glowing paper lantern with fanged mouth, flames and light tendrils, festival, boss',
 '훈련 표적':'no humans, training target dummy, mechanical, holographic target rings, sci-fi',
 '강화 표적':'no humans, armored training robot, holographic shield, sci-fi',
 '훈련 교관':'no humans, large combat training mech, holographic weapons, sci-fi, boss'
};
const C=(o)=>o;
const EXTRA2={
 sera:{faction:'새벽등대',weapon:{name:'적색 조준경 「레드 레인」',desc:'세라가 헬릭스 시절부터 써 온 저격총을 지아가 개조했다.',prompt:'no humans, object focus, long sniper rifle with red scope, black and crimson, sci-fi, simple background, white background'},
   lvLines:['조준이 한결 가벼워졌어.','…고마워. 말로 하니까 어색하네.'],dupLines:['헬릭스에서 배운 건 버릴게. 여기서 다시 배우지.'],affLines:{5:['오늘 커피는 내가 탔어. 진하게.'],8:['네 옆이면 숨을 쉬는 법이 생각나.']},
   files:[{dup:1,text:'헬릭스 특수부대 「적색 소대」 출신. 소대는 3년 전 작전 중 전원 실종 처리되었다.'},{dup:3,text:'실종 처리된 작전의 지휘관은 바넷 소장. 세라는 유일한 귀환자다.'}]},
 eve:{faction:'새벽등대',weapon:{name:'청람 주사기 「블루 노트」',desc:'성흔 안정제를 정밀 투여하는 의료용 장비.',prompt:'no humans, object focus, elegant sci-fi medical injector, glowing blue liquid, silver, simple background, white background'},
   lvLines:['어머, 실력 늘었네요? 나 말고 당신이.','보답은… 나중에 받을게요.'],dupLines:['당신 곁이면 성흔이 조용해요. 이제 이유를 알 것 같아.'],affLines:{5:['오늘은 진료 말고 그냥 얘기해요.'],8:['당신이 다치면, 나 의사 안 할 거예요.']},
   files:[{dup:1,text:'전직 군의관. 낙성의 밤 구조대의 일원이었다.'},{dup:3,text:'분화구 한가운데서 생존자를 처음 발견한 사람이 이브였다. 그 생존자의 이름은 기록에서 지워졌다.'}]},
 kaya:{faction:'새벽등대',weapon:{name:'항만 방패 「앵커」',desc:'부두의 닻을 녹여 만든 거대한 방패.',prompt:'no humans, object focus, huge heavy metal tower shield shaped like an anchor, scratched green paint, simple background, white background'},
   lvLines:['더 무거운 거 들어도 되겠는데?','헤헤, 근육이 기뻐하고 있어!'],dupLines:['앞은 내가 맡는다. 이번엔 끝까지.'],affLines:{5:['고기 먹으러 가자! 이번엔 진짜 내가 다 쏜다!']}},
 luna:{faction:'회색구 연합',weapon:{name:'쌍권총 「바이너리」',desc:'해킹 모듈이 내장된 쌍권총. 쏠 때마다 로그가 남는다.',prompt:'no humans, object focus, pair of futuristic pistols with blue circuit glow, simple background, white background'},
   lvLines:['업데이트 완료~ 패치노트는 생략!','오, 이 정도면 헬릭스 방화벽도 뚫겠다.'],dupLines:['이제 도망 안 쳐. 여기가 내 서버니까.'],affLines:{5:['관리관 폰 배경화면, 내 사진으로 바꿔 놨어. 농담… 반쯤.']}},
 miho:{faction:'회색구 연합',weapon:{name:'칩 슈터 「올인」',desc:'카지노 칩을 탄환처럼 쏘아내는 기묘한 장치.',prompt:'no humans, object focus, ornate red and black handheld launcher shooting casino chips, simple background, white background'},
   lvLines:['판돈이 올라가네요. 좋아요.','이 패라면 지지 않아요.'],dupLines:['당신한테 건 판돈, 아직 한 번도 안 잃었어요.'],affLines:{5:['오늘은 블러핑 안 할게요. 진짜로.']}},
 hanna:{faction:'새벽등대',weapon:{name:'돌격소총 「퍼스트 스텝」',desc:'첫 월급으로 산 소총. 아직 흠집 하나 없다.',prompt:'no humans, object focus, compact assault rifle, olive green, brand new, simple background, white background'},
   lvLines:['강해졌어요! 세라 선배한테 보여드려야지!','감사합니다, 관리관님!'],dupLines:['신입 딱지, 오늘부로 떼겠습니다!']},
 odelle:{faction:'새벽등대',weapon:{name:'진압 방패 「원칙」',desc:'경비대 시절 지급품. 규정에 따라 정비 상태가 완벽하다.',prompt:'no humans, object focus, transparent riot shield with navy frame and police emblem, simple background, white background'},
   lvLines:['규정상 강화는 승인합니다.','…나쁘지 않군요.'],dupLines:['예외 조항을 하나 더 추가하겠습니다. 당신입니다.']},
 jia:{faction:'새벽등대',weapon:{name:'수리 드론 「뭉치 Mk.2」',desc:'뭉치의 동생. 아직 이름에 불만이 많다.',prompt:'no humans, object focus, small round repair drone with two arms and one camera eye, simple background, white background'},
   lvLines:['…성능 12% 향상. 뭉치도 좋아해요.','고쳐 줘서 고마워요. 이번엔 내가.'],dupLines:['당신은 고장 나도 내가 고칠 거예요.']}
};
const DEFAULT_BANNERS=[
 {id:'std',name:'상시 계약',type:'std',desc:'모든 대원과 언제든 계약할 수 있어요.',pool:{mode:'all',factions:[],ids:[]},pickup:[],rate:50,active:true,bg:''},
 {id:'b_sera',name:'적색 일섬',type:'pickup',desc:'SSR 세라 확률 상승.',pool:{mode:'all',factions:[],ids:[]},pickup:['sera'],rate:50,active:true,bg:'낙성 분화구'},
 {id:'b_dawn',name:'새벽등대 정기 모집',type:'pool',desc:'새벽등대 소속 대원만 등장해요.',pool:{mode:'faction',factions:['새벽등대'],ids:[]},pickup:[],rate:50,active:true,bg:'새벽등대 사무소'},
 {id:'b_ev1',name:'잔광 축제의 밤',type:'event',desc:'이벤트 한정 계약. 미호, 루나 확률 상승.',pool:{mode:'all',factions:[],ids:[]},pickup:['miho','luna'],rate:60,active:true,bg:'카지노 뒷골목',eventId:'ev1'}
];
const DEFAULT_EVENTS=[{id:'ev1',title:'잔광 축제의 밤',desc:'회색구에 1년에 한 번 열리는 등불 축제. 그런데 등불 속에 잔광이 섞여 있다.',token:'축제 쿠폰',active:true,chapterId:'evc1',bannerId:'b_ev1',bg:'카지노 뒷골목',bgm:'일상',shop:[]}];
const DEFAULT_EVENT_CHAPTER={id:'evc1',kind:'event',eventId:'ev1',ord:100,title:'잔광 축제의 밤',stages:[
 {id:'e11',title:'등불 아래',reward:60,enemies:[{name:'떠도는 등불',elem:'홍',hp:900,atk:75,def:30,spd:95,boss:false},{name:'떠도는 등불',elem:'청',hp:900,atk:75,def:30,spd:95,boss:false}],
  pre:`[음악: 일상]
[카지노 뒷골목]
골목마다 종이 등불이 매달려 있다. 회색구 사람들이 1년 중 유일하게 웃는 날.
미호[웃음]: 관리관님, 축제는 처음이죠? 오늘은 제가 안내할게요.
루나: 나도! 나도 안내할래! 사격 게임 경품 다 털어 줄게!
미호: 루나, 그건 안내가 아니라 영업 방해예요.
그때, 등불 하나가 이상한 빛으로 떨린다.
[효과: 흔들림]
루나: …어? 저 등불, 잔광 반응인데?`,
  post:`미호: 등불에 성핵 조각이 섞여 있었어요. 누군가 일부러 넣은 거예요.
루나: 축제 망치려는 놈이 있다 이거지. 찾아내자.
[톡: 루나]
루나: 관리관 이거 봐
루나: 등불 납품 업체 목록 털었어
나: 털었다고?
루나: 열람했어 ㅋㅋ
[톡 끝]`},
 {id:'e12',title:'경품 사격장',reward:80,enemies:[{name:'등불 잔광',elem:'녹',hp:1100,atk:85,def:35,spd:100,boss:false},{name:'등불 잔광',elem:'홍',hp:1100,atk:85,def:35,spd:100,boss:false},{name:'등불 잔광',elem:'청',hp:1100,atk:85,def:35,spd:100,boss:false}],
  pre:`[카지노 뒷골목]
루나: 납품 업체가 이 사격장 주인이야. 근데 가게가 텅 비었어.
미호: 경품 선반 뒤에서 빛이 새어 나와요.
선택: 정면으로 들어간다 | 미호에게 맡긴다
1) 루나: 역시 관리관! 시원시원해!
2) 미호[의기양양]: 맡겨 주세요. 이런 가게 뒷문은 다 똑같거든요.
[효과: 플래시]
경품 인형들이 일제히 빛을 뿜으며 일어선다.`,
  post:`루나: 사격장 주인은 도망쳤고, 남은 건 이 장부.
미호: 수취인이… 헬릭스 하청이네요.
미호[걱정]: 축제를 이용해서 성핵을 회색구 전체에 뿌리려던 거예요.`},
 {id:'e13',title:'불꽃이 지기 전에',reward:120,enemies:[{name:'거대 등불 잔광',elem:'홍',hp:4800,atk:115,def:55,spd:90,boss:true},{name:'떠도는 등불',elem:'녹',hp:1000,atk:80,def:30,spd:95,boss:false}],
  pre:`[음악: 긴장]
[회색구 골목]
축제의 마지막 순서, 대형 등불이 하늘로 오르려는 순간.
[효과: 흔들림]
등불이 터지며 거대한 잔광이 모습을 드러낸다.
루나: 저거 터지면 회색구 전체에 성핵 가루가 비처럼 내려!
미호[결의]: 관리관님, 이번 판은 전부 걸게요.`,
  post:`[음악: 감성]
잔광이 흩어지고, 그 자리에 작은 불꽃놀이가 터진다.
루나[웃음]: …예쁘다. 원래 이렇게 끝나야 했는데.
미호: 끝났잖아요, 이렇게. 당신 덕분에.
미호[부끄럼]: …내년에도 같이 와요. 이건 내기 아니에요.`}]};
const DEFAULT_DISP=[
 {id:'d1',name:'회색구 순찰',desc:'시민회 요청으로 골목을 돈다.',hours:1,need:2,reward:{gold:3000,exp:5}},
 {id:'d2',name:'물자 호송',desc:'상층 구역에서 의약품을 받아 온다.',hours:2,need:2,reward:{gold:5000,wmat:4}},
 {id:'d3',name:'잔광 잔해 수거',desc:'전투가 끝난 구역의 성핵 조각을 회수한다.',hours:4,need:3,reward:{exp:20,core:2}},
 {id:'d4',name:'헬릭스 동향 정찰',desc:'상층 구역 물류 이동을 몰래 기록한다.',hours:8,need:3,reward:{gold:15000,wmat:10}},
 {id:'d5',name:'항만 야간 경비',desc:'밤새 옛 항구를 지킨다.',hours:12,need:4,reward:{gold:20000,exp:30,core:4}},
 {id:'d6',name:'카지노 정보 수집',desc:'딜러들 사이의 소문을 모은다.',hours:0.5,need:1,reward:{gold:1500}}
];
const FACE_BASIC=['평온','미소','슬픔','화남','놀람','당황'];
const FACE_PRESETS=[['평온','calm'],['미소','smile'],['울먹','teary'],['웃음','happy'],['폭소','laughing'],['윙크','playful'],['슬픔','sad'],['화남','angry'],['놀람','surprised'],['부끄럼','embarrassed'],['수줍음','shy'],['의기양양','smug'],['걱정','worried'],['결의','determined'],['생각','thinking'],['당황','nervous'],['짜증','irritated'],['피곤','tired'],['반함','love'],['무표정','neutral'],['아픔','hurt']];
const E=(name,elem,hp,atk,def,spd,boss)=>({name,elem,hp,atk,def,spd,boss:!!boss});
const TH=(id,charId,title,trigger,needOwn,script)=>({id,charId,title,trigger,needOwn,script});
const DEFAULT_OPENING = {
  lines:['별은 소원을 들어주지 않았다.','다만, 떨어졌을 뿐이다.','20년 후. 항구도시 에덴포트.','빛을 몸에 품은 여자들이 있다.','그녀들과 계약하는 자를, 사람들은 관리관이라 부른다.','낙성계약'],
  prologue:`[배경: 낙성 분화구]
[효과: 암전]
20년 전, 별이 떨어진 밤.
도시는 불타고, 하늘은 하얗게 찢어졌다.
그날 밤, 분화구 한가운데서 살아남은 사람은 단 한 명이었다.
[효과: 플래시]
[회색구 골목]
그리고 지금.
빗속을 걷는 {관리관}의 손에는 낡은 임명장 한 장이 들려 있다.
[소품: 임명장]
계약사무소 새벽등대 관리관으로 임명함.
[소품 끝]
[효과: 흔들림]
골목 끝에서 굉음이 울린다. 빛으로 된 짐승이 벽을 부수고 튀어나온다.
???: 엎드려!
[효과: 플래시]
붉은 섬광. 짐승의 머리가 꿰뚫린다.
세라: …민간인이 이 시간에 회색구를 걷다니. 죽고 싶어?
관리관: 새벽등대를 찾고 있어. 오늘부터 관리관이야.
세라: ……하. 그 사무소, 관리관이 또 바뀌는 거야?
선택: 잘 부탁해 | 구해줘서 고마워
1) 세라: 부탁은 살아남은 다음에 해.
2) 세라: 고마우면 커피나 사. 진하게.
[새벽등대 사무소]
이브: 어서 와요, 새 관리관님. 세라가 사람을 데려오다니, 별일이네.
이브: 몸 좀 봐요. 다친 데는… 없네. 아깝다, 진찰할 핑계였는데.
세라: 이브. 일 얘기.
이브: 네네~ 관리관님, 우리 사무소엔 지금 대원이 거의 없어요. 계약금도 바닥이고요.
이브: 그래서 첫 업무예요. 성흔자들과 계약을 맺어 주세요.
이브: 걱정 마요. 당신 곁에선… 이상하게 성흔이 조용해지거든요.
세라: …그 얘긴 나중에.
그날 밤, 새벽등대의 불이 다시 켜졌다.`
};
/* 진행(G.prog — data/<게임id>/prog.json) 정의 한곳(CLAUDE.md §0-2 상태 정의는 한곳): 새 게임의 처음 진행 · 칸마다 없을 때 만들기·형식 검사·하루/주 새로 만들기·형식 맞춤·지금 값 계산
   쓰는 쪽(Model·Controller)은 progSlot(칸) — 정의대로 맞춰 저장하고 돌려줌. 그리는 쪽(View)은 progRead(칸) — 저장하지 않음(없거나 날이 바뀌었으면 새로 만든 값을 저장하지 않고 돌려주고, 행동력은 지금 회복분까지 계산한 복사본)
   하루/주 새로 만들기·형식 맞춤을 저장하는 것은 Controller 지점(progTick — 그리기 전·주기 타이머). 기능 규칙(행동력 회복 stamRegen·레이드 단계 raidNew·파견 의뢰 채우기 dispBoardFill·원정 expedFill·건조 자원 cresFill)은 기능 모듈에 두고 여기서 부름
   make(옛 값) 처음 값 · ok 형식 검사(기본: 객체) · stale 참이면 새로 만듦 · fill 형식 맞춤(예전 형식 바꾸기·빠진 하위 칸·하루치 준비) · now 지금 값 계산 · tick 그리기 전에 늘 있게(하루/주 단위 기능 — 함수면 그 조건일 때) */
const DEFAULT_PROG = {gems:3600,pity:0,total:0,owned:{},cleared:{},squad:[],sec:null,daily:'',
  settings:{ssr:4,sr:18,pity:150,rv:2,expRate:100,goldRate:100,gemRate:100,stamina:true},firstTen:true,adult:true,show19:true,history:[],savedAt:0,
  gold:20000,mat:{exp:40,wmat:20,core:10,gearMat:0,transcMat:0},pities:{},tokens:{},disp:{},dm:{date:'',cnt:{},got:{}},pass:{xp:0,got:[]},farmClear:{},shopBuy:{},curBanner:'',curEvent:'',live:{on:{talk:true,event:true,rerun:true,rotate:true,pass:true,chapter:false,season:true,skin:true,fill:true},last:{},notices:[],seen:0,recentPU:[],seasons:{story:true,event:true,char:true,rerun:true,train:true},skillGeneration:1,season:null},
  player:'',gender:'',inbox:{},seenOpening:false,lobbyBg:'',titleBg:'',titleChar:'',gachaBg:''};
const P=()=>G.prog;
const progObj=v=>!!v&&typeof v==='object';
const PROG_SLOTS={
  stam:{make:()=>({v:STAM_MAX,at:Date.now()}), fill:(s,p)=>{ if(p.staminaCapVersion!==2){ Misc.stamRegen(s,120); p.staminaCapVersion=2; } }, now:s=>Misc.stamRegen(s,STAM_MAX)}, // 행동력 — 상한 120 시절 값은 그 상한으로 회복을 끝낸 뒤 새 상한으로
  dm:{make:()=>({date:today(),cnt:{login:1},got:{}}), stale:v=>v.date!==today(), tick:true}, // 일일 임무 — 날이 바뀌면 새로
  raid:{make:Challenge.raidNew, stale:r=>r.wk!==Challenge.weekKey(), fill:Challenge.raidFill, tick:true}, // 주간 레이드 — 주가 바뀌면 지난주 결과로 단계를 정해 새로
  rogue:{make:()=>({run:null,best:0,day:'',n:0}), fill:r=>{ const x=r.run; if(x&&x.v===3){ x.v=2; x.c3=1; } }}, // 탐사 — 예전 3판 형식은 2판으로
  tower:{make:()=>({})}, gifts:{make:()=>({})}, fchat:{make:()=>({})}, cxSeen:{make:World.cxSeenNew,tick:true}, // 탑 · 선물 보관함 · 자유 대화 · 도감에서 본 항목
  sched:{make:()=>({day:today(),left:SCHED_N,done:[]}), stale:v=>v.day!==today(), tick:true}, // 오늘의 일정 — 날이 바뀌면 새로
  avatar:{make:()=>({id:'pav_'+uid(),kind:'char',name:'플레이어',prompt:'',img:null}),tick:true}, // 프로필 그림
  shop:{make:()=>({day:today(),buy:{}}), stale:v=>v.day!==today(), tick:true}, // 상점 일일 구매 — 날이 바뀌면 새로
  mail:{make:()=>[], ok:Array.isArray}, // 우편함
  dboard:{make:()=>({day:'',list:[],rr:0}), ok:b=>progObj(b)&&Array.isArray(b.list), fill:Expedition.dispBoardFill, tick:true}, // 파견 게시판 — 날마다 의뢰 채우기
  exped:{make:()=>({}), fill:Characters.expedFill, tick:Expedition.expedOn}, // 원정 — 방송 출연 등 원정 모드면 늘 두고 오늘의 출연 제안을 그리기 전에 만듦
  cres:{make:()=>({}), fill:Misc.cresFill}, // 건조/영입 자원
  cbuild:{make:()=>({n:0,found:{},log:[],input:null})} // 건조/영입 기록
};
const GAME_SLOTS={
  'meta.expedition':{make:()=>({mode:'combat'})}, // 원정 모드(0275)
  'meta.rules':{make:()=>({})}, // 게임 규칙(0185)
  'meta.balance':{make:()=>({})}, // 밸런스 설정(0187 — 바꾼 값만)
  'meta.storyMemory':{make:()=>({version:1,notes:''})}, // 스토리 기억(0530)
  'rels':{make:()=>[],ok:Array.isArray}, // 인연(0450)
  'world.codex':{make:()=>[],ok:Array.isArray}, // 도감 기록(0300)
  'world.codexNotes':{make:()=>({})}, // 도감 항목별 메모(0300)
  'world.factions':{make:()=>[],ok:Array.isArray}, // 세력(0445 — 읽기 factions가 캐릭터 소속까지 맞춘 모양을 보여 주고, 고칠 때 factionSync가 저장)
  'world.plan':{make:()=>({acts:[],twists:[],branches:[],arcs:[]}),ok:p=>progObj(p)&&['acts','twists','branches','arcs'].every(k=>Array.isArray(p[k]))} // 시나리오 설계(0465)
};
const gameAt=(path,g)=>{ const ks=path.split('.'), last=ks.pop(); let o=g; for(const k of ks) o=o[k]; return [o,last]; };
const PJKEY='starfall-projects';
/* 적 그림 재탕: 보스가 아닌 새 적은 기존 적 그림을 같이 써요(이름만 달라요). 적 종류가 ENEMY_KEEP개를 넘으면 외형이 와도 재탕해요 */
const ENEMY_KEEP=10;
const HEXC=/^#[0-9a-f]{3,8}$/i;
let G;
let DB=null,BASE=null,SAMPLE=null,ASSETS=null;
// Draft builders temporarily use G; persistence must keep the real game.
let NEW_GAME_SOURCE=null;
const dirty=new Set();
// One project transition at a time; validate the target BEFORE changing the active registry.
let projectSwitchBusy=false;
/* 이미지 */
const imgCache={};
const SKP={upper:'상반신',illust:'일러스트',lbcg:'돌파 CG'};
let NOSKIN=0;
const noSkin=f=>function(){ NOSKIN++; try{ return f.apply(this,arguments); }finally{ NOSKIN--; } };
const procCache={};
const XBTN=(k,id,extra,label)=>`<button class="btn sm ghost" data-act="imgx" data-k="${k}" data-id="${esc(id||'')}"${extra||''}>${label||'그림 지우기'}</button>`;
let uploadFor=null, uploadAudioFor=null;
// 표정을 넣을 대상: 기본 모습이거나, 표정 창에서 고른 스킨
let FACET={cid:'',sid:''};
/* ── 0520-backup-storage.js에서 ── */
/* BACKUP_STORAGE_MODULE */
/* Three explicit backup scopes; new archives are streamed JSON records, not one giant JSON string. */
var BACKUP_TYPES={progress:{name:'진행 백업',desc:'보유 캐릭터·레벨·스킬·장비·재화·스토리 진행과 게임 설정을 저장합니다. 이미지·음성 파일과 API 키는 포함하지 않습니다. 같은 기기의 기존 자료와 함께 이어하기에 적합합니다.'},assets:{name:'자료 백업',desc:'현재 게임에 등록된 이미지·음성 파일만 저장합니다. 캐릭터 보유·성장·재화·스토리 진행은 포함하지 않습니다. 같은 게임에 자료를 복원할 때 사용하며 진행 상태는 바꾸지 않습니다.'},full:{name:'전체 백업',desc:'진행 백업과 자료 백업을 함께 저장합니다. 다른 기기로 게임을 옮기거나 모든 내용을 보관할 때 사용합니다. API 키와 앱 전체 설정은 포함하지 않습니다.'}};
var BACKUP_IMPORT_KIND='full',BACKUP_BUSY=false;
/* ── 0525-data-folder.js에서 ── */
/* DATA_FOLDER_MODULE
   게임 하나 = data/<게임id>/ 폴더, 종류별 JSON (meta.json, world.json, chars.json, chapters.json …).
   PC 서버(pc/ggm-server.py)가 영구 저장소로 쓰는 배치와 같아요. 여기서는 그 배치로 내보내기·가져오기(.zip)를 해요.
   zip 안: data/index.json · data/<id>/<종류>.json · data/<id>/media.json · data/<id>/media/<자료 키> */
const DATA_TYPES=['meta','world','chars','npcs','rels','chapters','lib','threads','opening','banners','events','dispatches','prog'];
const jsonBytes=o=>new TextEncoder().encode(JSON.stringify(o,null,1));
let INHERIT_SYNC=false;
const levelCap=o=>Math.min(120,Math.max(Math.min(70,20+10*(o?.dup||0))+Story.capExtra(),o?.legacyLevelCap||0)+(o?.transc||0)*10);
const expR=x=>Math.round(x*((P().settings.expRate||100)/100));
/* 행동력: 메인·이벤트 전투 10, 재료 던전 8. 5분마다 1씩 차서 최대 240. ◆로 채울 수 있어요. 설정 → 게임에서 끌 수 있어요 */
const STAM_MAX=240, STAM_MS=5*60e3, STAM_FILL=[60,60];
const MISSIONS=[{k:'login',name:'출석하기',goal:1,xp:100},{k:'battle',name:'전투 3회',goal:3,xp:150},{k:'pull',name:'뽑기 1회',goal:1,xp:100},{k:'dispatch',name:'파견 보내기',goal:1,xp:100},{k:'touch',name:'로비 터치 5회',goal:5,xp:60},{k:'enhance',name:'강화 1회',goal:1,xp:100}];
const PASS_MAX=30, PASS_PER=500;
const passLv=()=>Math.min(PASS_MAX,Math.floor(P().pass.xp/PASS_PER));
const dispDone=()=>[...Object.values(P().disp),...Object.values((P().exped||{}).jobs||{})].filter(d=>Date.now()>=d.start+d.hours*3600e3).length;
const busyIds=()=>new Set([...Object.values(P().disp).flatMap(d=>d.chars),...Expedition.exBusyIds()]);
/* 스포일러 막기: 아직 만나지 않은 인물(보유하지 않았고, 본 스토리에도 안 나온)의 이름이 든 대사는 로비·터치에서 빼요 */
let SEEN_K='', SEEN_T='';
const AFF_MAX=GGMCombat.AFFINITY.max;
 const RMUL={1:1,2:1.15,3:1.3};
const GIFTS=[['g_cake','달콤한 케이크','🍰',20],['g_tea','고급 찻잎','🍵',20],['g_flower','꽃다발','💐',25],['g_book','두꺼운 책','📖',25],['g_tool','공구 세트','🔧',25],['g_doll','봉제 인형','🧸',30],['g_perfume','향수','🧴',35],['g_music','음반','💿',30],['g_brooch','보석 브로치','💎',50],['g_letter','손편지','✉️',60]];
const giftById=id=>GIFTS.find(g=>g[0]===id);
const SKIN_PRICE=1280;
const skinHave=k=>!k||!k.shop||!!(P().skinOwn||{})[k.id];
let SKPROP=null;
// 스킨 상점: 사기 전에 스탠딩을 크게 보여 주고(제안), 사면 고른 그림·대사를 한꺼번에 만들어요
let SKBUYSEL=null;
let SKJOB=null;
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
const psReopen=c=>{ if(!$('#modal').hidden&&typeof CharactersCtl.openChar==='function'){ CoreView.closeModal(); CharactersCtl.openChar(c.id); } else Challenge.render(); };
const threadById=id=>G.threads.find(t=>t.id===id);
const threadChar=t=>t&&charById(t.charId);
let PH=null;
const chatImgCache={};
const PH_FREE_SW=`<button class="linkb ph-sw2" data-act="phmode" data-v="free">⌨ 직접 입력으로 전환</button>`;
let FCBUSY=false;
const EYE_TAG=/\b(eyes?|eyelash(es)?|pupils?|heterochromia|eyeliner|tsurime|tareme|sanpaku|jitome)\b/i;
const genderCode=g=>/^(남|남성|남자|male|man)$/i.test(g||'')?'m':/^(여|여성|여자|female|woman)$/i.test(g||'')?'f':'';
const RAID_TICKS=700;
const RAID_MS=[[0.05,{gems:100,gold:5000}],[0.15,{gems:150,wmat:10,gift:2}],[0.3,{gems:200,core:3}],[0.5,{gems:300,exp:40}],[0.75,{gems:400,core:5}],[1,{gems:800,core:10,wmat:20}]];
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
const finaleEnd=()=>FINALE_END[Battle.storyCfg().finale];
// 스테이지 집필(writeStages)의 스테이지 종류 표시 — 회담·콘테스트면 프롬프트 스튜디오의 STAGE_WRITE_RULE(대본은 그 전·후만)을 붙임
const STAGE_KIND={debate:'회담 스테이지',contest:'콘테스트 스테이지'};
const CHARM={cool:'멋',cute:'귀여움',beauty:'아름다움',smart:'지성',tough:'강인함'};
const CHARM_KW={cool:/쿨|냉정|과묵|카리스마|멋|차분|무뚝뚝/,cute:/귀여|밝|천진|장난|애교|활발|명랑/,beauty:/우아|아름|기품|섬세|예술|고상|신비/,smart:/똑똑|지적|분석|침착|박식|천재|논리|책/,tough:/강인|용감|열혈|근성|힘|투지|단단|호쾌/};
const S_=(v,n)=>String(v||'').trim().slice(0,n||200);
/* 공통: 시작·클리어 */
let MD=null;
/* 전투 말고 캐릭터를 쓰는 곳: 하루 3번, 장소에 나와 있는 캐릭터를 만나 짧은 장면을 보고 호감도·보상을 받아요.
   좋아하는 것(개성 시트 likes·hobby)이 장소 태그와 맞으면 "좋아하는 장소" → 호감도 1.5배.
   - 장소 G.meta.spots=[{id,name,desc,bg,tags}] : 자료실 배경에서 자동으로 만들거나(spotsAuto) AI로(spotsAI)
   - 장면 c.spotTalk={[spot id]:대본} : AI로(spotTalkAI) 만들고, 없으면 개성 시트로 짧은 기본 장면(spotTemplate)
   - 생성 연계: 점검 규칙 g_spots(장소 없음 → 글 AI가 있으면 AI, 없으면 자료실 배경), c_spot(장면 없음 → AI) · 문서 docs/research/combat-content.md */
const SCHED_N=3;
/* 뒤에서 만들기: 다음 장·이벤트·픽업은 화면을 막지 않고 만들어요(그동안 전투·뽑기 가능). 다 되면 우편이 와요 */
const BGJOBS=[];
const SEASONS=[['story','스토리 시즌','메인 스토리 새 장이 열려요','📖'],['event','이벤트 시즌','기간 한정 이벤트와 한정 '+'캐릭터','🎪'],['char','캐릭터 시즌','신규 픽업 캐릭터와 그 캐릭터가 주인공인 픽업 스토리','✨'],['rerun','복각 시즌','지난 이벤트와 픽업이 돌아와요','🔁'],['train','육성 시즌','훈련 보상 2배 · 파견 보상 1.5배','💪']];
// 라이브 운영 주기(일): 설정 → 시즌 운영에서 바꿔요
const LIVE_CYC={season:[7,[[7,'1주'],[14,'2주'],[21,'3주'],[30,'한 달']]],event:[7,[[3,'3일'],[7,'1주'],[14,'2주'],[30,'한 달']]],chapter:[30,[[7,'1주'],[14,'2주'],[30,'한 달'],[60,'두 달']]],talk:[1,[[1,'매일'],[2,'2일'],[3,'3일'],[7,'1주']]],rotate:[14,[[7,'1주'],[14,'2주'],[30,'한 달']]]};
const baseChar=c=>c&&c.alt?charById(c.alt)||c:c;
const altsOf=c=>G.chars.filter(x=>x.alt===c.id);
let LIVE_RUN=false;
const PREP_CATS=()=>[['char','스탠딩',true],['upper','상반신',true],['pose','로비 레이어 (캐릭터별 배경 + 투명 포즈)',false],['illust','일러스트 (로비·픽업)',true],['enemy','적',true],['bg','배경',true],['icon','재화 아이콘',true],['map','작전 지도',true],['prop','소품',true],['weapon',System.T('weapon'),true],['cg','이벤트 CG',false],['scg','기술 컷인',false]];
let PREPJOB=null;
const AUDIT_FIELDS={profile:['프로필','"profile":"성격·배경·비밀을 담은 3~5문장"'],intro:['첫 대사','"intro":"첫 만남 대사 1줄"'],lines:['평소 대사','"lines":["로비·평소 대사 5개"]'],
  touch:['터치 반응','"touch":{"head":["머리 쓰다듬기 반응 3개"],"body":["몸 터치 반응 3개"],"pet":["쓰다듬기 반응 3개"]}'],affLines:['호감도 대사','"affLines":{"3":["대사 1~2개"],"5":["대사 1~2개"],"8":["대사 1~2개"]}'],
  lvLines:['레벨업 대사','"lvLines":["2개"]'],dupLines:['돌파 대사','"dupLines":["2개"]'],naiPrompt:['외모 태그','"naiPrompt":"NovelAI 영어 태그"']};
const auditStrs=v=>(Array.isArray(v)?v:[]).map(x=>String(x||'').trim()).filter(Boolean);
const auditImgCats=['char','upper','illust','weapon'];
/* 되돌리기: 마지막 일괄 작업 직전 상태 */
let AUDIT_UNDO=null, AUDIT_JOB=null;
/* 화면 */
let AUDIT_FOCUS=null;
const LIVE_FILL_AUTO=['g_spots','g_codex','c_symbol','c_pos','c_range','s_rules'];
const LIVE_FILL_AI=['g_pos','w_stance','c_persona','c_pfields','c_afftalk','c_memorial','c_spot','s_direct'];
const LIVE_FILL_OWNED=new Set(['c_afftalk','c_memorial','c_spot']);
const LIVE_FILL_NAME={g_spots:'일정 장소',g_codex:'도감 규칙',c_symbol:'상징 컬러·아이템',c_pos:'포지션',c_range:'사거리',s_rules:'전장 규칙',g_pos:'포지션 설계',w_stance:'세력 관계 변화',c_persona:'개성 시트',c_pfields:'프로필 항목',c_afftalk:'인연 톡',c_memorial:'메모리얼',c_spot:'일정 장면',s_direct:'대본 연출'};
const LIVE_FILL_MAX=4;
let NEWPU=false;
let PUX=null;
const PUBUSY=new Set();
let GC=null;
const SPARK=200;
/* 엔진: modules/app/020-construct.js (GGMConstruct). 여기서는 게임 상태·화면·AI 연결만.
   설정: G.meta.construct(바꾼 값만 저장) · G.meta.variants(바리에이션 공통 설정) · 진행: P().cres(자원) · P().cbuild(기록·발견한 레시피) */
const CON_RES=GGMConstruct.RES;
// 특수 레시피(소속·특정 캐릭터 확률 업). 분류 확률은 groups가 정해서 기본은 비워 둬요. 예: {id:'rc_x',name:'새벽 설계',min:[400,400,400,600],effect:{type:'faction',value:'새벽등대',up:3},hint:'부품을 넉넉히'}
const CON_RECIPES=[];
const conGem=()=>`<span style="display:inline-flex;width:1em;height:1em;vertical-align:-.15em">${EconomyView.rIco('gems')}</span>`;
const conResIcon=k=>`<i class="ricon-t" style="font-style:normal">${['⛽','✴','⬢','⚙'][CON_RES.indexOf(k)]}</i>`;
let CONJOB=false;
const CON_STATS=[['hp','체력'],['atk','공격'],['def','방어'],['spd','속도']];
let CONV=null;
let tab='lobby', PREVTAB='lobby', RG_LIVE=false;
const PLAY_HIDE_ST=['lib','text','img','live','conn'];
/* ── 0180-ui-scroll.js에서 ── */
/* UI_SCROLL_MODULE */
/* Keep local actions at their current position; navigation owns intentional resets. */
var UI_PAGE_SCROLL_ROUTE=null,UI_PAGE_SCROLL_GAME=null;
/* 화면에 들어가기 전 처리(Controller — 그리기 전): 화면마다 그 기능이 상태를 맞춤 — 그리기(…HTML)는 상태를 바꾸지 않음 */
const SCREEN_ENTER={lobby:[Economy.mailTick,EconomyCtl.cashTick],abyss:[Challenge.rogueTick],challenge:[Challenge.rogueTick],notice:[LiveOps.noticeSeen],codex:[World.cxBadgeSync]};
const pageHead=(ko,en,back)=>`<div class="phead">${back?`<button class="back" data-act="go" data-to="${back}" aria-label="뒤로">‹</button>`:''}<div><i>${en}</i><h2>${esc(ko)}</h2></div></div>`;
const ICO={
  raid:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M14.5 3 21 9.5 11 19.5 4.5 13z"/><path d="M4.5 13 3 21l8-1.5M16 8l-6 6"/></svg>',
  book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z"/><path d="M20 4h-5a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h6z"/></svg>',
  talk:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8M8 13h5"/></svg>',
  event:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 21V4h11l-2 4 2 4H5"/></svg>',
  notice:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 10v4h4l6 4V6L7 10z"/><path d="M17 9a4 4 0 0 1 0 6"/></svg>',
  gift:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="4" y="9" width="16" height="11"/><path d="M3 9h18M12 9v11M12 9c-2-4-6-4-6-1s6 1 6 1 6 2 6-1-4-3-6 1"/></svg>',
  disp:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5 13 13l-4.5 2.5L11 11z"/></svg>',
  farm:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>',
  eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M4 20 20 4"/></svg>',
  shop:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 9 6 4h12l2 5M4 9v11h16V9M4 9h16M9 20v-6h6v6"/></svg>',
  mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14"/><path d="M3 6l9 7 9-7"/></svg>',
  gem:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M9 3l3 18 3-18"/></svg>'};
// 작전: 장 카드를 가로로 넘겨 고르고, 누르면 그 장의 지도로 들어가요
let OPS_CH=null;
// 이벤트 교환소: 픽업 캐릭터가 맞이하는 상점
let EVS_LINE='', EVS_FOR='';
const OAI_PRESETS=[
 ['GitHub Copilot','https://api.githubcopilot.com','gpt-4.1','키 칸에 GitHub Copilot 토큰을 넣어요. 모델은 gpt-4.1, gpt-4o, claude-sonnet-4 등 Copilot에 있는 이름을 써요. 비공식 방식이라 막힐 수 있어요. 웹 버전에서 안 되면 중계 서버를 최신 코드로 바꿔 주세요.'],
 ['LLM Gateway','https://api.llmgateway.io/v1','','llmgateway.io에서 API 키를 만들어요. 모델 이름은 llmgateway.io 모델 목록의 ID를 그대로 써요. 웹 버전에서 안 되면 중계 서버를 최신 코드로 바꿔 주세요(허용 목록에 들어 있어요).'],
 ['OpenRouter','https://openrouter.ai/api/v1','','openrouter.ai → Keys에서 키를 만들어요. 모델 이름은 openrouter.ai/models의 ID(예: deepseek/deepseek-chat-v3.1)를 그대로 써요.'],
 ['Ollama 클라우드','https://ollama.com/v1','gpt-oss:120b','ollama.com 로그인 → Settings → Keys에서 API 키를 만들어요. 모델은 ollama.com/search?c=cloud 에 있는 클라우드 모델 이름(예: gpt-oss:120b, qwen3-coder:480b)을 써요. 이름 끝의 -cloud는 빼요. 무료 플랜은 사용량 한도가 있어요.'],
 ['내 PC Ollama','http://192.168.0.10:11434/v1','','PC에서 OLLAMA_HOST=0.0.0.0 으로 Ollama를 켜고, PC의 IP로 주소를 바꿔요(폰과 같은 와이파이). 키는 아무 글자나 넣으면 돼요. 모델은 ollama list에 나온 이름 그대로.'],
 ['LM Studio','http://192.168.0.10:1234/v1','','LM Studio → Developer → Start Server, "Serve on Local Network"를 켜고 PC의 IP로 주소를 바꿔요. 키는 아무 글자나 넣으면 돼요.'],
 ['DeepSeek','https://api.deepseek.com/v1','deepseek-chat','platform.deepseek.com → API keys에서 만들어요.']];
const MODEL_SUGG={copilot:['gpt-4.1','gpt-4o','claude-sonnet-4','claude-3.7-sonnet','gemini-2.5-pro','o4-mini'],anthropic:['claude-opus-5-5','claude-sonnet-5-5','claude-haiku-4-5-20251001'],gemini:['gemini-2.5-pro','gemini-2.5-flash','gemini-2.5-flash-lite'],vertex_google:['gemini-2.5-pro','gemini-2.5-flash','gemini-2.5-flash-lite'],vertex_anthropic:[],openai:[]};
 const NLASTSEED={};
let VS={cid:null,results:[],picks:{},lang:'ko',q:''};
let STTAB='',STROOTSCROLL=0;
const SETUP_KEY='starfall-setup-done';
let SW=null;
const SETUP_HELP={vertex:['Google Cloud 콘솔에서 서비스 계정 키나 익스프레스 키를 만들어요','https://console.cloud.google.com/vertex-ai'],gemini:['Google AI Studio에서 무료로 받을 수 있어요','https://aistudio.google.com/apikey'],anthropic:['Anthropic Console에서 받아요 (유료)','https://console.anthropic.com/settings/keys'],openai:['OpenRouter 등 OpenAI 호환 서비스의 키','https://openrouter.ai/keys']};
let MBACK=null;
const head=(t,sub2='')=>`<div class="sheet-head"><div><h2>${t}</h2>${sub2}</div><button class="x" data-act="close" aria-label="닫기">×</button></div>`;
let FB_STAR=0;
let CS_TAB='equip';
const lines=v=>v.split('\n').map(s=>s.trim()).filter(Boolean);
let squadSel=null;
const unitPower=st=>Math.round(st.hp/5+st.atk*3+st.def*2+st.spd);
const charPower=c=>unitPower(Core.stats(c));
const enemyPower=e=>unitPower({hp:e.hp,atk:e.atk,def:e.def,spd:e.spd});
/* 시작 준비(첫 실행 때 그림 미리 그리기): 그릴 종류·필요한지 */
const BOOT_CATS=[['char','스탠딩 (전신)',true],['upper','상반신 (스토리·프로필)',true],['illust','일러스트 (타이틀·로비·픽업)',true],['bg','배경',true],['icon','재화 아이콘',true],['prop','소품 (스토리에 나오는 물건)',true],['weapon','전용 무기',true],['enemy','적',false],['map','작전 지도',false],['cg','이벤트 CG',false],['scg','기술 컷인',false]];
let BP=null;
const bootCats=()=>BOOT_CATS;
const RULE_STATS=[['hp','체력'],['atk','공격'],['def','방어'],['spd','속도']];
const POS_TRAITS=[['hp','체력 %'],['atk','공격 %'],['def','방어 %'],['spd','속도 %'],['dmg','주는 피해 %'],['taken','받는 피해 %'],['heal','회복량 %'],['crit','치명타 %p'],['sp','시작 SP'],['threat','위협도 %']];
const REACT_TYPES=[['amp','피해 증폭(배율)'],['burst','폭발(공격력×값 추가 피해)'],['stun','기절(초)'],['vuln','취약(받는 피해 +값%)']];
// 생성기가 쓰는 속성 이름 다듬기 — 속성 목록·상성(beats)·반응의 속성 이름에 같이 써야 서로 맞음
const elemName=v=>String(v||'').replace(/[<>"'&`.]/g,'').trim().slice(0,4);
const POS_PRESETS={
 basic:[['공격','atk','적을 쓰러뜨리는 주력',{}],['방어','def','앞에서 버티며 동료를 지킴',{}],['지원','sup','회복과 강화로 돕기',{}]],
 squad8:[['선봉','atk','전투를 여는 돌격수. 시작부터 기술을 쓸 준비가 돼 있음',{sp:30,spd:10,hp:-10}],['근접','atk','근거리 주력 딜러',{atk:10,dmg:5}],['방벽','def','적의 공격을 끌어 아군을 지킴',{hp:15,def:15,threat:80,taken:-10}],['사수','atk','멀리서 약점을 노림',{crit:10,threat:-50,hp:-15}],['술사','atk','속성 공격 전문가',{dmg:15,def:-15}],['의무','sup','회복 전문',{heal:25,atk:-10}],['보조','sup','강화·약화로 판을 짬',{sp:20,threat:-30}],['특수','atk','변칙 전술',{spd:15,crit:5,hp:-10}]],
 ship6:[['구축','atk','빠르고 가벼운 선봉',{spd:20,hp:-15,crit:5}],['경순','atk','균형 잡힌 지휘함',{spd:5,dmg:5}],['중순','atk','강한 포격',{atk:15,spd:-5}],['전함','def','두꺼운 장갑과 주포',{hp:25,def:20,spd:-25,atk:10,threat:50}],['항모','sup','함재기로 지원과 공격',{heal:15,sp:20,threat:-20}],['잠수','atk','은밀한 일격',{crit:15,threat:-60,hp:-20}]]};
const rulesPct=x=>`×${Math.round(x*100)/100}`;
/* 편집 창: RD(초안)를 고치다가 저장할 때 게임에 반영 */
let RD=null;
const balPower=s=>Math.round(s.hp/5+s.atk*3+s.def*2+s.spd);
let FORM=null;
let chDraft=null;
let WTERMS=null;
let BD=null;
const RICON={
  gearMat:'<svg viewBox="0 0 24 24" fill="none" stroke="#e4ad74" stroke-width="2"><path d="m3 16 4-9h10l4 9-4 4H7zM3 16h18M7 7l3 9M17 7l-3 9"/></svg>',
  transcMat:'<svg viewBox="0 0 24 24" fill="none" stroke="#c9a1ff" stroke-width="2"><path d="m12 2 8 10-8 10-8-10zM12 2v20M4 12h16"/></svg>',
  gold:'<svg viewBox="0 0 24 24" fill="none" stroke="#e9c46a" stroke-width="2"><circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.5 10.5h4a1.5 1.5 0 0 1 0 3h-3"/></svg>',
  exp:'<svg viewBox="0 0 24 24" fill="none" stroke="#7fd8ff" stroke-width="2" stroke-linejoin="round"><path d="M4 5h7a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4zM20 5h-7a2 2 0 0 0-2 2"/><path d="M20 5v12h-7"/></svg>',
  wmat:'<svg viewBox="0 0 24 24" fill="none" stroke="#9ad17f" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/></svg>',
  core:'<svg viewBox="0 0 24 24" fill="none" stroke="#ff8ad1" stroke-width="2" stroke-linejoin="round"><path d="M12 2 21 7v10l-9 5-9-5V7z"/><path d="M12 8l4 2.5v4L12 17l-4-2.5v-4z"/></svg>',
  gems:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M9 3l3 18 3-18"/></svg>'};
const SHOP_ITEMS=()=>[
  {id:'free',name:'오늘의 무료 보급',give:{gold:3000,exp:10},cost:{},limit:1,tag:'FREE'},
  {id:'exp',name:System.T('expMat')+' ×20',give:{exp:20},cost:{gold:4000},limit:10},
  {id:'wmat',name:System.T('wMat')+' ×10',give:{wmat:10},cost:{gold:6000},limit:5},
  {id:'core',name:System.T('core')+' ×5',give:{core:5},cost:{gold:15000},limit:3},
  {id:'gem',name:System.T('currency')+' ×60',give:{gems:60},cost:{gold:20000},limit:2,tag:'HOT'},
  {id:'exp2',name:System.T('expMat')+' ×5',give:{exp:5},cost:{gold:800},limit:30},
  {id:'gift1',name:'선물 꾸러미 (무작위 1개)',give:{gift:1},cost:{gold:3000},limit:5,tag:'NEW'},
  {id:'gift5',name:'선물 꾸러미 ×5',give:{gift:5},cost:{gold:13000},limit:1}];
const SHOP_SWAP=()=>[
  {id:'x1',give:{wmat:10},cost:{exp:30}},{id:'x2',give:{exp:20},cost:{wmat:10}},
  {id:'x3',give:{gold:3000},cost:{core:1}},{id:'x4',give:{gold:1500},cost:{exp:10}},{id:'x5',give:{core:1},cost:{wmat:25}}];
let SHOP_LINE='';
const CASH_PACKS=[{id:'g1',gems:60,bonus:0},{id:'g2',gems:300,bonus:30},{id:'g3',gems:980,bonus:110},{id:'g4',gems:1980,bonus:260},{id:'g5',gems:3280,bonus:600},{id:'g6',gems:6480,bonus:1600}];
/* 자원 보급(₩0): 건조 자원(건조를 켰을 때)과 성장 재료를 낱개로 — 유료 상점 기분만 내는 무료 상점이라 모자란 자원은 여기서 채워요 */
const CASH_RES=()=>[...(Acquire.conOn()?[...CON_RES.map(k=>({id:'cr_'+k,name:System.T(k)+' 보급',give:{[k]:1000},ico:conResIcon(k)})),{id:'cr_con',name:System.T('construct')+' 자원 꾸러미',give:Object.fromEntries(CON_RES.map(k=>[k,1000]))}]:[]),
 {id:'cr_gold',name:System.T('gold')+' 보급',give:{gold:100000}},{id:'cr_exp',name:System.T('expMat')+' 보급',give:{exp:300}},{id:'cr_wmat',name:System.T('wMat')+' 보급',give:{wmat:200}},{id:'cr_core',name:System.T('core')+' 보급',give:{core:50}},{id:'cr_gear',name:System.T('gearMat')+' 보급',give:{gearMat:100}},{id:'cr_transc',name:System.T('transcMat')+' 보급',give:{transcMat:30}}];
const CASH_PKGS=()=>[{id:'pk1',name:'성장 지원 패키지',give:{gold:50000,exp:200,wmat:100,core:50}},{id:'pk2',name:System.T('limit')+' 패키지',give:{core:40,gems:300}},{id:'pk3',name:'10연 '+System.T('gacha')+' 패키지',give:{gems:COST*10}}];
const mailHas=x=>Object.keys(x.reward||{}).length>0;
// 지워도 되는 우편: 받았거나, 기간이 지났거나, 보상이 없는 알림(업데이트 안내·완료 알림 등)
const mailDone=x=>x.got||!(!x.exp||Date.now()<x.exp)||!mailHas(x);
let SDEL=null;
// 프롬프트가 없는 자료(대본에서 찾은 소품 등)는 그리기 전에 AI로 한꺼번에 영어 프롬프트를 써요
let LIBP_JOB=null;
/* 새 대원 만들기: 능력치(희귀도·역할 — SYS_BASE)·이벤트 적 기본 능력치·AI 답 정리(cleanChar)·미뤄 둔 스킬 설계 이어 하기 */
// 새 대원 능력치는 희귀도·역할로 시스템이 정해요(밸런스가 들쭉날쭉하지 않게)
const SYS_BASE=GGMCombat.CHARACTER_BASE_STATS;
const SYS_SK={dmg:[1.9,2.3,2.8],aoe:[1.0,1.3,1.6],heal:[1.0,1.3,1.6],shield:[1.1,1.5,1.8],buff:[1.0,1.2,1.4]};
// 새 게임 생성 중에 미뤄 둔 스킬 설계를 게임을 연 뒤 이어서 해요(예전엔 생성 중 백그라운드 작업이 저장·새로고침에 끊겨 임시 스킬로 굳었음)
let SKILL_RESUME=false;
/* ── 0530-story-memory.js에서 ── */
/* STORY_MEMORY_MODULE */
/* Author-facing story memory. Original scripts are never replaced by memory edits. */
var SM_LIMITS={plot:100000,summary:6000,older:600,recent:2,previous:6000,scene:6000,relations:12000,codex:10000,chunk:10000};
var SM_JOB=null;
const DR2KEY='ggm-draft2';
let DR2=null, DRTAB='theme';
const DR_TABS=[['theme','테마'],['world','세계관'],['setting','설정'],['chars','인물'],['hero','주인공']];
/* 초안 보관함: 이름 붙여 여러 개 저장하고 다시 불러와요. 게임을 만들면 그 게임에도 초안이 같이 저장돼요 */
const DRLIB='ggm-drafts';
const drName=d=>String(d.gtitle||'').trim()||String(d.mode==='auto'?d.auto:d.kw||'').trim().slice(0,24)||'이름 없는 초안';
// 초안 내보내기·가져오기: 코드 한 줄(GGMDRAFT:…) 또는 파일(.json)로 다른 기기·다른 게임에 옮겨요
const draftCode=(d,name)=>{ const x=Story.drClean(d); delete x.reuse; return 'GGMDRAFT:'+btoa(unescape(encodeURIComponent(JSON.stringify({v:1,name:name||drName(d),d:x})))); };
let DRX=null;
let DRAVU=null;
// 장르·키워드와 분위기에 같은 글이 들어 있으면(한쪽이 다른 쪽을 품으면) 분위기는 한 번만 써요
const dupTxt=(a,b)=>{ const n=x=>String(x||'').replace(/[\s"'“”‘’.,!?~·…]/g,''); a=n(a); b=n(b); return !!(a&&b&&(a.includes(b)||b.includes(a))); };
/* 중복 문장 정리(시스템, AI 없이): 앞 칸에 이미 나온 문장과 같거나 그 문장 안에 통째로 들어 있는 문장은 뒤 칸에서 지워요.
   같은 칸 안에서 되풀이된 문장도 지워요. 더 긴 문장이 짧은 문장을 품으면 긴 문장은 남겨요(내용이 줄지 않게) */
const sentKey=x=>String(x||'').replace(/[\s"'“”‘’「」『』()\[\].,!?~·…:;\-–—]/g,'').toLowerCase();
// 이름 짝짓기: 띄어쓰기·괄호 설명을 빼고 비교해요("아린 (검사)" = "아린")
const nameKey=x=>String(x||'').replace(/\s*[(（\[][^)）\]]*[)）\]]\s*/g,'').replace(/\s+/g,'').toLowerCase();
const nameEq=(a,b)=>!!nameKey(a)&&nameKey(a)===nameKey(b);
// 파견 게시판: 게임의 파견 목록은 이름·설명 견본이고, 실제 의뢰는 매일·완료할 때마다 새로 뽑아요. 보상은 시간×인원에 맞춰요.
const DISP_FOCUS={gold:['크레딧',2500],exp:['경험',6],wmat:['교본',4],core:['코어',0.5]};
let DSEL=null;
/* 엔진: modules/app/030-expedition.js (GGMExpedition). 설정: G.meta.expedition(바꾼 값만) · 진행: P().exped
   combat 모드는 기존 파견(dispHTML·dispOffer) 그대로. 나머지 모드는 이 파일의 화면을 써요. 문서: docs/research/expedition.md */
const EX_MODE_LABEL={combat:['전투형 원정','지역에 보내 자원을 가져와요 (칸코레·소녀전선류)'],idol:['방송 출연','방송국·스폰서 일정에 나가 보수와 인지도를 얻어요 (아이돌 육성류)'],streamer:['콘텐츠 방송','플랫폼을 골라 영상·라이브·숏폼을 올려 수익과 구독자를 모아요 (스트리머·버튜버류)'],business:['경영','파트에 배치해 일하게 하고, 전체 실적과 평판으로 수익이 나와요 (상점·기업 경영류)']};
const exIco=k=>`<span style="display:inline-flex;width:1em;height:1em;vertical-align:-.15em">${EconomyView.rIco(k)}</span>`;
const exBar=v=>`<span style="display:inline-block;width:60px;height:6px;background:var(--line);border-radius:3px;vertical-align:middle;overflow:hidden"><i style="display:block;height:100%;width:${v}%;background:${v>=60?'#4fd18b':v>=30?'#ffd35a':'#ff5a5a'}"></i></span> ${v}`;
const CX_CATS=[['all','전체'],['world','세계'],['faction','세력'],['person','인물'],['place','장소'],['item','물건'],['term','용어'],['history','역사'],['enemy','적']];
let CXCAT='all';
let CXMEMO=null;
/* 1) 세력 G.world.factions[]: {name,desc,kind,goal,leader,base,ideology,secret,origin,nature,weakness,rel:{세력:관계},stance:[{ch,s,why}]}
      kind: playable(플레이어블 소속) | hostile(적대 세력) | neutral(중립) | monster(괴물·마물 무리)
      stance: 플레이어와의 관계가 장마다 바뀜(ally·neutral·hostile). 예: 1~3장 적대 → 4장부터 동맹. 장 생성 때 AI가 바꿀 수 있음
   2) 몬스터 도감: 자료실 적(kind 'enemy', 캐릭터가 아닌 것)마다 faction·desc(정체)·nature(습성)·weak(약점)
      몬스터는 메신저·일정·인연 같은 커뮤 대상이 아님 → 새 캐릭터·NPC로 만들어지지 않게 막고(isMonsterLike), 예전 데이터는 점검
   3) 등장·영입: c.debut(첫 등장 스테이지)를 깨기 전에는 상시·픽업 뽑기·건조에 안 나옴, 소속 세력이 지금 적대면 잠금(설정).
      AI에는 "보유했지만 스토리에서 아직 안 만남 → 이미 계약해 함께 작전 중인 동료"를 알려 첫 만남처럼 쓰지 않게 함
   문서: docs/research/factions-cast.md */
const FKIND={playable:'플레이어블 소속',hostile:'적대 세력',neutral:'중립',monster:'괴물·마물'}, FSTANCE={ally:'우호',neutral:'중립',hostile:'적대'};
const F_FIELDS=[['desc','개요'],['goal','목적'],['leader','지도자·핵심 인물'],['base','거점·영역'],['ideology','이념·규칙'],['secret','숨겨진 사실(작가용)']], M_FIELDS=[['origin','정체·기원'],['nature','습성·행동'],['weakness','약점']];
// 몬스터: 자료실 적 중 캐릭터·NPC가 아닌 것
const SYS_ENEMY=/^(훈련 |강화 표적|탑의 )/;
/* 화면 */
let FW_TAB='fac';
const REL_ME='me';
let RELC=REL_ME;
let RELUNDO=null;
const SYKEY='ggm-sync', SYIDX='ggm-sync-idx';
/* 저장 정책(사용자 지시 — 브라우저 저장소는 캐시, 원본은 PC 서버의 파일: 게임은 data/, 그 밖의 설정은 ggm-data/state.json — 자동 동기화).
   브라우저 저장소(appStorage·localStorage) 키마다 갈래를 한곳에서 정해요. 게임 저장(starfall-projects·starfall-contract-v1…)은 저장소가 따로 관리해요(GGMStorage.managed)
   sync   — 사용자가 만든 내용·게임에 필요한 설정: PC 서버·GitHub 둘 다
   secret — 비밀(API 키·토큰)이 든 설정: PC 서버에는 그대로, GitHub에는 [뺄 칸]을 빼고(null이면 보내지 않음). 받을 때 빠진 비밀은 이 기기 것을 지킴
   keep   — 받을 때 이 기기 값을 지키는 칸(연동 설정의 기기 이름)
   device — 이 기기에만 의미 있는 값 · cache — 다시 만들 수 있는 캐시·기록 · legacy — 예전 형식 키(읽어서 새 키로 옮기기만) (셋 다 동기화 안 함)
   새 저장 키는 여기에 갈래를 정해요(tools/map.mjs가 갈래 없는 키·목록과 다른 동기화를 막아요) */
const STORE_POLICY={
  sync:['starfall-setup-done','ggm-plessons','ggm-packs','ggm-llmslot','ggm-shared-assets','ggm-drafts','ggm-draft2'],
  secret:{'starfall-nai':['key'],'starfall-sound':['fishKey','elKey'],'starfall-ai-profiles':null,'ggm-sync':null,'ggm-pub':null},
  keep:{'ggm-sync':['device']},
  device:['ggm-devid','ggm-orient','ggm-desk','ggm-a2hs','ggm-pc','ggm-proxy','ggm-proxy-off','ggm-play','ggm-start','ggm-bkdest','ggm-ng-draft','ggm-sync-idx','ggm-sync-hold'],
  cache:['starfall-live','starfall-live-html','ggm-pthumb','ggm-voice-ja','ggm-ailog','ggm-upd-notes','starfall-nai-tperr'],
  legacy:['starfall-ai']
};
let SYJOB=null;
let PCJOB=false;
// IndexedDB는 캐시예요: 기기 저장이 끝날 때마다(5초 모아서) PC 서버의 data 폴더로 올려요
let PCSOON=null;
let PULLERR='';
let PULLERR_QUOTA=false;
let PCWARNED=false;
const PUBKEY='ggm-pub';
let PUBJOB=null;
let SUBCHK=null;
const LK={locked:false,t:null,busy:false,claimed:false};
const LVKEY='starfall-live';
/* ---- public release channel ---- */
// 이 포크의 업데이트 채널. 원본(jjhk0803)을 가리키면 앱이 원본 빌드를 받아 포크 수정본을 덮어써요. APK 설치 파일은 원본 Releases에만 있어요
const RELEASE_REPO='mgsongct/gacha-game-maker';
let UPD=null;
let WEBUPD=null;
// 한 줄에 붙어 나온 [소품 끝]·[배경: …] 같은 지시를 따로 떼어 내요(예: "문장. [소품 끝]")
const TAG_RE=/\[(?:(?:소품|음악|톡|CG|cg)\s*끝|(?:배경|소품|효과음|효과|사진|음악|톡|CG|cg|분기|연출|스티커)\s*[:：][^\]\n]+)\]/g;
let S=null;
/* 대본 문법(SCRIPT_FMT의 DIRECTION_GUIDE 조각):
     이름[표정|하트|점프]: 대사      — 대괄호 안을 | 로 나눠 표정·감정·동작을 함께(순서 상관없음)
     [연출: 이름 하트 점프]          — 대사 없이 감정·동작만
     [효과: 붉은섬광] [효과: 비] [효과: 비 끝] [효과: 회상] [효과: 회상 끝] …
     톡(메신저)·대본의 [스티커: 하트] — 감정 아이콘을 스티커로
   감정 아이콘은 기본 SVG를 쓰고, 자료실에 같은 이름의 '감정' 그림(kind 'emote')이 있으면 그걸 써요(공유 보관함으로 게임끼리 재사용).
   P().vnDirect: 'auto'(대본 + 대사로 자동 감정, 기본) | 'script'(대본에 쓴 것만) | 'off' · P().vnStage: 'duo'(최근 두 사람, 기본) | 'single'
   문서: docs/research/direction.md */
const EMO_SVG=(body,vb)=>`<svg viewBox="${vb||'0 0 40 40'}" aria-hidden="true">${body}</svg>`, EMO_ST='stroke="#1a1020" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';
const EMO_ALIAS={'♥':'하트','💦':'땀','💢':'화남','!':'놀람','?':'의문','…':'침묵','♪':'음표','💡':'번뜩','😢':'눈물','😳':'홍조','💤':'졸림','✨':'반짝','당황':'땀','분노':'화남','놀라움':'놀람','물음표':'의문','기쁨':'음표','슬픔':'눈물','부끄러움':'홍조'};
const MOTIONS={점프:'m-jump',뛰어오름:'m-jump',흔들:'m-shake',도리도리:'m-shake',떨림:'m-tremble',끄덕:'m-nod',갸웃:'m-tilt',다가옴:'m-near',물러남:'m-far',퇴장:'m-exit',등장:'m-enter',쓰러짐:'m-fall'};
const SCREEN_FX={흔들림:'shake',강한흔들림:'shake2',플래시:'w',섬광:'w',붉은섬광:'r',암전:'b',페이드:'f',집중선:'lines',비:'rain',눈:'snow',벚꽃:'petal',회상:'memory',비네트:'vignette'};
const FX_KEEP=['lines','rain','snow','petal','memory','vignette'];
// 타이틀 로고 모양: 게임 정의에서 고르고, 자동이면 화면 테마에 맞춰요
const LOGO_STYLES=[['auto','자동 (화면 테마에 맞춤)'],['stroke','가로획 명조 · 먹빛'],['star','별빛 그라데이션 · 첨탑'],['orbitline','궤도선 · 행성 외곽선'],['stencil','거친 스텐실 질감'],['regal','기품 · 명조 금빛'],['sharp','전술 · 각진 금속'],['orbit','SF · 네온'],['heavy','묵직한 장식체'],['cute','귀여운 · 파스텔']];
/* 타이틀 줄 나누기: 띄어쓰기에서만 나누고(글자 중간에서 끊지 않음), 두 줄 길이를 비슷하게. 긴 한 단어는 줄이지 않고 글자를 작게 */
const tlLen=x=>[...String(x)].reduce((n,ch)=>n+(/[가-힣ㄱ-ㅎ一-鿿]/.test(ch)?1:/\s/.test(ch)?0.35:0.62),0);
const tlSpan=x=>`<span class="tl" style="--tl:${Math.max(2.2,tlLen(x)*1.06).toFixed(2)}">${esc(x)}</span>`;
let OP=null;
let B=null;
const alive=a=>a.filter(u=>u.hp>0);
let SCUT_MAN=false;
// 컷인 표정: 결의·화남 같은 힘 있는 표정을 먼저, 없으면 아무 표정이나
const CUT_FACES=['결의','화남','의기양양','진지','기합','분노','미소','웃음'];
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
const BPATS={aoe:['광역 포격','7초마다 전원 공격',7],snipe:['집중 저격','7초마다 체력 비율이 낮은 대상 공격',7],charge:['강타','7초마다 전원 강타',7],drain:['흡혈','7초마다 피해의 30% 회복',7],barrier:['방벽','7초마다 보호막',7],curse:['저주','7초마다 적 전체 공격력 감소',7],shift:['방어 약화','7초마다 적 전체 방어력 감소',7]};
// 훈련: 10단계, 단계마다 권장 레벨이 있어요(그 레벨 대원의 능력치에 맞춰 적이 강해져요)
const FARM_LV=[1,5,10,15,20,30,40,50,60,70], FARM_N=FARM_LV.length;
const FARM_RW={exp:[10,20,35,55,80,110,150,200,260,330],gold:[4000,7000,11000,16000,22000,30000,40000,52000,66000,82000],wmat:[5,9,14,20,28,38,50,64,80,100],core:[1,1,2,2,3,4,5,6,7,8]};
/* src/main/0275-expedition.js */
// 새 게임 세계관 단계의 원정 스키마(지시문은 프롬프트 스튜디오의 EXPEDITION_RULE, 이름을 적용하는 계산은 원정 엔진 GGMExpedition.fromWorld — 수치는 기본값, 이름만)
const EXPEDITION_SCHEMA='"expedition":"'+GGMExpedition.MODES.join('|')+'","expeditionNames":{"fame":"","jobs":[""]}';
const DEFAULT_SFX=[
 ['sfx_btn','버튼','Short crisp futuristic UI click, clean digital tick',0.5],
 ['sfx_ok','확인','Positive UI confirm chime, two-tone digital blip',0.7],
 ['sfx_seal','계약진','Magical summoning circle activating, rising shimmering hum with crystalline resonance',2.5],
 ['sfx_fall','낙하','Shooting star whoosh falling from the sky with sparkling tail',1.5],
 ['sfx_flash','섬광','Bright magical flash impact with shimmering burst',1.2],
 ['sfx_ssr','SSR','Triumphant golden reveal sting, sparkling chimes and orchestral hit',3],
 ['sfx_card','카드','Quick card flip swish',0.5],
 ['sfx_hit','타격','Short punchy gunshot impact, anime battle hit',0.5],
 ['sfx_skill','스킬','Powerful energy skill release, charged blast with whoosh',1.5],
 ['sfx_win','승리','Short victory fanfare jingle, brass and strings, anime game',3.5],
 ['sfx_lose','패배','Short defeat jingle, low descending synth tones',2.5],
 ['sfx_up','강화','Power-up level up sound, rising sparkly arpeggio',1.5],
 ['sfx_noti','알림','Smartphone message notification ping, soft two-note chime',0.8]
].map(([id,name,prompt,dur])=>({id,kind:'sfx',name,prompt,dur,img:null}));
/* ── 130-dispatch.js에서 ── */
const APP_ACTION_HANDLERS=Object.freeze({"titletap":Art.handleSetupAction,"swnext":Art.handleSetupAction,"swaddai":Art.handleSetupAction,"swprev":Art.handleSetupAction,"swlink":Art.handleSetupAction,"swskipall":Art.handleSetupAction,"swgo1":Art.handleSetupAction,"swsub":Art.handleSetupAction,"swdone":Art.handleSetupAction,"swstytest":Art.handleSetupAction,"swtestai":Art.handleSetupAction,"swtestnai":Art.handleSetupAction,"title":Art.handleSetupAction,"swpreset":Art.handleSetupAction,"sweep":Art.handleSetupAction,"swdraft":Art.handleSetupAction,"swpjdraft":Art.handleSetupAction,"titlesnd":Art.handleSetupAction,"prepopen":Acquire.handleNavigationAndToolsAction,"rebal":Acquire.handleNavigationAndToolsAction,"a2hs":Acquire.handleNavigationAndToolsAction,"cdart":Acquire.handleNavigationAndToolsAction,"bswipe":Acquire.handleNavigationAndToolsAction,"lktake":Acquire.handleNavigationAndToolsAction,"artgo":Acquire.handleNavigationAndToolsAction,"artalways":Acquire.handleNavigationAndToolsAction,"bpgo":Acquire.handleNavigationAndToolsAction,"bpbg":Acquire.handleNavigationAndToolsAction,"bpskip":Acquire.handleNavigationAndToolsAction,"bpleave":Acquire.handleNavigationAndToolsAction,"prepgo":Acquire.handleNavigationAndToolsAction,"prepstop":Acquire.handleNavigationAndToolsAction,"prepnever":Acquire.handleNavigationAndToolsAction,"opnext":Acquire.handleNavigationAndToolsAction,"pfdraw":Acquire.handleNavigationAndToolsAction,"pfsave":Acquire.handleNavigationAndToolsAction,"go":Acquire.handleNavigationAndToolsAction,"close":Acquire.handleNavigationAndToolsAction,"goback":Acquire.handleNavigationAndToolsAction,"lbhide":Acquire.handleNavigationAndToolsAction,"lbshow":Acquire.handleNavigationAndToolsAction,"poke":Acquire.handleNavigationAndToolsAction,"lbbgdel":Acquire.handleNavigationAndToolsAction,"altnew":Acquire.handleNavigationAndToolsAction,"scggen":Acquire.handleNavigationAndToolsAction,"scgdel":Acquire.handleNavigationAndToolsAction,"scgtest":Acquire.handleNavigationAndToolsAction,"ilgen":Acquire.handleNavigationAndToolsAction,"vncgview":Acquire.handleNavigationAndToolsAction,"cguse":Acquire.handleNavigationAndToolsAction,"ildel":Acquire.handleNavigationAndToolsAction,"ailog":Acquire.handleNavigationAndToolsAction,"ailogcopy":Acquire.handleNavigationAndToolsAction,"ailogclear":Acquire.handleNavigationAndToolsAction,"artcopy":Acquire.handleNavigationAndToolsAction,"artclear":Acquire.handleNavigationAndToolsAction,"pthumbset":Acquire.handleNavigationAndToolsAction,"avdel":Acquire.handleNavigationAndToolsAction,"pthumbdel":Acquire.handleNavigationAndToolsAction,"addchar-open":Acquire.handleNavigationAndToolsAction,"addchar-hand":Acquire.handleNavigationAndToolsAction,"addchar-ai":Acquire.handleNavigationAndToolsAction,"copy":Acquire.handleNavigationAndToolsAction,"copyfield":Acquire.handleNavigationAndToolsAction,"playep":Acquire.handleNavigationAndToolsAction,"mapedit":Acquire.handleNavigationAndToolsAction,"locked":Acquire.handleNavigationAndToolsAction,"ghist":Acquire.handleNavigationAndToolsAction,"vnnext":Acquire.handleNavigationAndToolsAction,"vnpick":Acquire.handleNavigationAndToolsAction,"vnauto":Acquire.handleNavigationAndToolsAction,"vnskip":Acquire.handleNavigationAndToolsAction,"vnlog":Acquire.handleNavigationAndToolsAction,"bquit":Acquire.handleNavigationAndToolsAction,"skill":Acquire.handleNavigationAndToolsAction,"bretry":Acquire.handleNavigationAndToolsAction,"flip":Acquire.handleNavigationAndToolsAction,"flipall":Acquire.handleNavigationAndToolsAction,"gcskip":Acquire.handleNavigationAndToolsAction,"closepull":Acquire.handleNavigationAndToolsAction,"sdelno":Acquire.handleNavigationAndToolsAction,"sdelgo":Acquire.handleNavigationAndToolsAction,"saveopening":Acquire.handleNavigationAndToolsAction,"aiopening":Acquire.handleNavigationAndToolsAction,"savelib":Acquire.handleNavigationAndToolsAction,"dellib":Acquire.handleNavigationAndToolsAction,"ailib":Acquire.handleNavigationAndToolsAction,"newpu":Acquire.handleNavigationAndToolsAction,"newpu-hand":Acquire.handleNavigationAndToolsAction,"newpu-ai":Acquire.handleNavigationAndToolsAction,"nextneedai":Acquire.handleNavigationAndToolsAction,"cplogin":Acquire.handleNavigationAndToolsAction,"saload":Acquire.handleNavigationAndToolsAction,"seasoninfo":Acquire.handleNavigationAndToolsAction,"seasontog":Acquire.handleNavigationAndToolsAction,"seasonskip":Acquire.handleNavigationAndToolsAction,"livetog":Acquire.handleNavigationAndToolsAction,"liverun":Acquire.handleNavigationAndToolsAction,"enh":Acquire.handleNavigationAndToolsAction,"enhmax":Acquire.handleNavigationAndToolsAction,"lb":Acquire.handleNavigationAndToolsAction,"wup":Acquire.handleNavigationAndToolsAction,"skvclear":Acquire.handleNavigationAndToolsAction,"aiskin":Acquire.handleNavigationAndToolsAction,"skpredo":Acquire.handleNavigationAndToolsAction,"skpcancel":Acquire.handleNavigationAndToolsAction,"skpok":Acquire.handleNavigationAndToolsAction,"bnfac":Acquire.handleNavigationAndToolsAction,"bnid":Acquire.handleNavigationAndToolsAction,"bnup":Acquire.handleNavigationAndToolsAction,"bnsave":Acquire.handleNavigationAndToolsAction,"bndel":Acquire.handleNavigationAndToolsAction,"dsauto":Acquire.handleNavigationAndToolsAction,"dsclr":Acquire.handleNavigationAndToolsAction,"pgetall":Acquire.handleNavigationAndToolsAction,"dsel":Acquire.handleNavigationAndToolsAction,"mget":Acquire.handleNavigationAndToolsAction,"pget":Acquire.handleNavigationAndToolsAction,"logoprev":Acquire.handleNavigationAndToolsAction,"logoprevclose":Acquire.handleNavigationAndToolsAction,"aievent-open":Acquire.handleNavigationAndToolsAction,"aievent":Acquire.handleNavigationAndToolsAction,"sfxplay":Acquire.handleNavigationAndToolsAction,"sfxgen":Acquire.handleNavigationAndToolsAction,"sfxall":Acquire.handleNavigationAndToolsAction,"vtest":Acquire.handleNavigationAndToolsAction,"dsopen":Acquire.handleNavigationAndToolsAction,"dssave":Acquire.handleNavigationAndToolsAction,"dsai":Acquire.handleNavigationAndToolsAction,"shareopen":Acquire.handleNavigationAndToolsAction,"sharego":Acquire.handleNavigationAndToolsAction,"fbopen":Acquire.handleNavigationAndToolsAction,"fbissue":Acquire.handleNavigationAndToolsAction,"fbpost":Acquire.handleNavigationAndToolsAction,"fbstar":Acquire.handleNavigationAndToolsAction,"fbsend":Acquire.handleNavigationAndToolsAction,"guidecopy":Acquire.handleNavigationAndToolsAction,"skbdraw":Acquire.handleNavigationAndToolsAction,"skbbuy":Acquire.handleNavigationAndToolsAction,"reroll0":Acquire.handleNavigationAndToolsAction,"cachewipe":Acquire.handleNavigationAndToolsAction,"mailopen":EconomyCtl.handleMailAction,"mailview":EconomyCtl.handleMailAction,"mailget":EconomyCtl.handleMailAction,"mailall":EconomyCtl.handleMailAction,"mailclean":EconomyCtl.handleMailAction,"maildel":EconomyCtl.handleMailAction,"cxcat":Story.handleStoryAndAuthoringAction,"cxview":Story.handleStoryAndAuthoringAction,"cxadd":Story.handleStoryAndAuthoringAction,"relopen":Story.handleStoryAndAuthoringAction,"relgo":Story.handleStoryAndAuthoringAction,"relseed":Story.handleStoryAndAuthoringAction,"reladd":Story.handleStoryAndAuthoringAction,"reledit":Story.handleStoryAndAuthoringAction,"relsave":Story.handleStoryAndAuthoringAction,"reldel":Story.handleStoryAndAuthoringAction,"relundo":Story.handleStoryAndAuthoringAction,"relrebuild":Story.handleStoryAndAuthoringAction,"cxedit":Story.handleStoryAndAuthoringAction,"cxsave":Story.handleStoryAndAuthoringAction,"cxdel":Story.handleStoryAndAuthoringAction,"cxnote":Story.handleStoryAndAuthoringAction,"cxdisc":Story.handleStoryAndAuthoringAction,"cxdeep":Story.handleStoryAndAuthoringAction,"cxreadall":Story.handleStoryAndAuthoringAction,"opening-play":Story.handleStoryAndAuthoringAction,"char":Story.handleStoryAndAuthoringAction,"evspoke":Story.handleStoryAndAuthoringAction,"evreroll":Story.handleStoryAndAuthoringAction,"stamopen":Story.handleStoryAndAuthoringAction,"stamfill":Story.handleStoryAndAuthoringAction,"stamtog":Story.handleStoryAndAuthoringAction,"scimg":Story.handleStoryAndAuthoringAction,"charedit":Story.handleStoryAndAuthoringAction,"savechar":Story.handleStoryAndAuthoringAction,"delchar":Story.handleStoryAndAuthoringAction,"epedit":Story.handleStoryAndAuthoringAction,"saveep":Story.handleStoryAndAuthoringAction,"delep":Story.handleStoryAndAuthoringAction,"aiep":Story.handleStoryAndAuthoringAction,"thedit":Story.handleStoryAndAuthoringAction,"saveth":Story.handleStoryAndAuthoringAction,"delth":Story.handleStoryAndAuthoringAction,"aithread":Story.handleStoryAndAuthoringAction,"ststory":Story.handleStoryAndAuthoringAction,"story":Story.handleStoryAndAuthoringAction,"chedit":Story.handleStoryAndAuthoringAction,"addstage":Story.handleStoryAndAuthoringAction,"delstage":Story.handleStoryAndAuthoringAction,"savech":Story.handleStoryAndAuthoringAction,"stdetail":Story.handleStoryAndAuthoringAction,"delch":Story.handleStoryAndAuthoringAction,"world-open":Story.handleStoryAndAuthoringAction,"saveworld":Story.handleStoryAndAuthoringAction,"aiworld":Story.handleStoryAndAuthoringAction,"opening-edit":Story.handleStoryAndAuthoringAction,"aichapter-open":Story.handleStoryAndAuthoringAction,"aichapter":Story.handleStoryAndAuthoringAction,"reload":Story.handleStoryAndAuthoringAction,"evopen":Story.handleStoryAndAuthoringAction,"evbuy":Story.handleStoryAndAuthoringAction,"evedit":Story.handleStoryAndAuthoringAction,"evsave":Story.handleStoryAndAuthoringAction,"evdel":Story.handleStoryAndAuthoringAction,"dreroll":Story.handleStoryAndAuthoringAction,"meta-open":Story.handleStoryAndAuthoringAction,"metasave":Story.handleStoryAndAuthoringAction,"draft-open":Story.handleStoryAndAuthoringAction,"drlib":Story.handleStoryAndAuthoringAction,"drlibsave":Story.handleStoryAndAuthoringAction,"drlibload":Story.handleStoryAndAuthoringAction,"drreuseoff":Story.handleStoryAndAuthoringAction,"drxcur":Story.handleStoryAndAuthoringAction,"drxlib":Story.handleStoryAndAuthoringAction,"drxcopy":Story.handleStoryAndAuthoringAction,"drxfile":Story.handleStoryAndAuthoringAction,"drxback":Story.handleStoryAndAuthoringAction,"drimport":Story.handleStoryAndAuthoringAction,"drigo":Story.handleStoryAndAuthoringAction,"drifile":Story.handleStoryAndAuthoringAction,"drlibdel":Story.handleStoryAndAuthoringAction,"drtab":Story.handleStoryAndAuthoringAction,"drcadd":Story.handleStoryAndAuthoringAction,"drcdel":Story.handleStoryAndAuthoringAction,"drmode":Story.handleStoryAndAuthoringAction,"drpreset":Story.handleStoryAndAuthoringAction,"drautoex":Story.handleStoryAndAuthoringAction,"drpfdraw":Story.handleStoryAndAuthoringAction,"drcfill":Story.handleStoryAndAuthoringAction,"drpolish":Story.handleStoryAndAuthoringAction,"drharmony":Story.handleStoryAndAuthoringAction,"drdedup":Story.handleStoryAndAuthoringAction,"drundo":Story.handleStoryAndAuthoringAction,"drpreview":Story.handleStoryAndAuthoringAction,"drclear":Story.handleStoryAndAuthoringAction,"drmanual":Story.handleStoryAndAuthoringAction,"drmake":Story.handleStoryAndAuthoringAction,"charregen":Story.handleStoryAndAuthoringAction,"pxopen":Characters.handleSettingsAndAudioAction,"pxsave":Characters.handleSettingsAndAudioAction,"pxtest":Characters.handleSettingsAndAudioAction,"appre":Characters.handleSettingsAndAudioAction,"setupopen":Characters.handleSettingsAndAudioAction,"setname":Characters.handleSettingsAndAudioAction,"playmode":Characters.handleSettingsAndAudioAction,"sttab":Characters.handleSettingsAndAudioAction,"setsec":Characters.handleSettingsAndAudioAction,"apnew":Characters.handleSettingsAndAudioAction,"apedit":Characters.handleSettingsAndAudioAction,"apsave":Characters.handleSettingsAndAudioAction,"apdel":Characters.handleSettingsAndAudioAction,"apuse":Characters.handleSettingsAndAudioAction,"apfb":Characters.handleSettingsAndAudioAction,"aptest":Characters.handleSettingsAndAudioAction,"llmopen":Characters.handleSettingsAndAudioAction,"llmsave":Characters.handleSettingsAndAudioAction,"llmtog":Characters.handleSettingsAndAudioAction,"llmpadd":Characters.handleSettingsAndAudioAction,"llmpedit":Characters.handleSettingsAndAudioAction,"llmpdel":Characters.handleSettingsAndAudioAction,"llmpcopy":Characters.handleSettingsAndAudioAction,"llmpimport":Characters.handleSettingsAndAudioAction,"sndopen":Characters.handleSettingsAndAudioAction,"vclearall":Characters.handleSettingsAndAudioAction,"vprebuild":Characters.handleSettingsAndAudioAction,"sndsave":Characters.handleSettingsAndAudioAction,"fishtest":Characters.handleSettingsAndAudioAction,"voice":Characters.handleSettingsAndAudioAction,"vclear":Characters.handleSettingsAndAudioAction,"vsearch":Characters.handleSettingsAndAudioAction,"vsai":Characters.handleSettingsAndAudioAction,"vsplay":Characters.handleSettingsAndAudioAction,"vstry":Characters.handleSettingsAndAudioAction,"vspick":Characters.handleSettingsAndAudioAction,"vsetid":Characters.handleSettingsAndAudioAction,"elcompose":Characters.handleSettingsAndAudioAction,"syopen":System.handleStorageAndSharingAction,"sylink":System.handleStorageAndSharingAction,"sypush":System.handleStorageAndSharingAction,"sypushf":System.handleStorageAndSharingAction,"sypull":System.handleStorageAndSharingAction,"sysave":System.handleStorageAndSharingAction,"bkgo":System.handleStorageAndSharingAction,"pickgame":System.handleStorageAndSharingAction,"saveretry":System.handleStorageAndSharingAction,"pcopen":System.handleStorageAndSharingAction,"syoff":System.handleStorageAndSharingAction,"pcsave":System.handleStorageAndSharingAction,"pcoff":System.handleStorageAndSharingAction,"pcpush":System.handleStorageAndSharingAction,"pcpushf":System.handleStorageAndSharingAction,"pcpullgo":System.handleStorageAndSharingAction,"pchist":System.handleStorageAndSharingAction,"pchistgo":System.handleStorageAndSharingAction,"pcpull":System.handleStorageAndSharingAction,"resetth":System.handleStorageAndSharingAction,"importfile":System.handleStorageAndSharingAction,"pj-open":System.handleStorageAndSharingAction,"pjswitch":System.handleStorageAndSharingAction,"pjdel":System.handleStorageAndSharingAction,"pjblank":System.handleStorageAndSharingAction,"pubopen":System.handleStorageAndSharingAction,"pubgo":System.handleStorageAndSharingAction,"pubcopy":System.handleStorageAndSharingAction,"pubcopy2":System.handleStorageAndSharingAction,"subadd":System.handleStorageAndSharingAction,"subgo":System.handleStorageAndSharingAction,"subcheck":System.handleStorageAndSharingAction,"subapply":System.handleStorageAndSharingAction,"subskip":System.handleStorageAndSharingAction,"subcopy":System.handleStorageAndSharingAction,"subleave":System.handleStorageAndSharingAction,"pjreroll":System.handleStorageAndSharingAction,"pjdraftx":System.handleStorageAndSharingAction,"backup":System.handleStorageAndSharingAction,"importbk":System.handleStorageAndSharingAction,"raidgo":Challenge.handleCombatAndFormationAction,"raidstart":Challenge.handleCombatAndFormationAction,"rgnew":Challenge.handleCombatAndFormationAction,"rfslot":Challenge.handleCombatAndFormationAction,"rffil":Challenge.handleCombatAndFormationAction,"rfauto":Challenge.handleCombatAndFormationAction,"rfclr":Challenge.handleCombatAndFormationAction,"rfpick":Challenge.handleCombatAndFormationAction,"rfgo":Challenge.handleCombatAndFormationAction,"rgnode":Challenge.handleCombatAndFormationAction,"rgskip":Challenge.handleCombatAndFormationAction,"rgrelic":Challenge.handleCombatAndFormationAction,"dgmove":Challenge.handleCombatAndFormationAction,"dgdown":Challenge.handleCombatAndFormationAction,"rgcard":Challenge.handleCombatAndFormationAction,"rgrest":Challenge.handleCombatAndFormationAction,"rgupg":Challenge.handleCombatAndFormationAction,"rgrm":Challenge.handleCombatAndFormationAction,"rgdeck":Challenge.handleCombatAndFormationAction,"cbplay":Challenge.handleCombatAndFormationAction,"cbsel":Challenge.handleCombatAndFormationAction,"cbult":Challenge.handleCombatAndFormationAction,"cbend":Challenge.handleCombatAndFormationAction,"cbtgt":Challenge.handleCombatAndFormationAction,"cbdeck":Challenge.handleCombatAndFormationAction,"cbquit":Challenge.handleCombatAndFormationAction,"rgsave":Challenge.handleCombatAndFormationAction,"rgleave":Challenge.handleCombatAndFormationAction,"rgquit":Challenge.handleCombatAndFormationAction,"opskip":Challenge.handleCombatAndFormationAction,"stage":Challenge.handleCombatAndFormationAction,"sortie":Challenge.handleCombatAndFormationAction,"bauto":Challenge.handleCombatAndFormationAction,"bspeed":Challenge.handleCombatAndFormationAction,"bdone":Challenge.handleCombatAndFormationAction,"opsch":Challenge.handleCombatAndFormationAction,"opsback":Challenge.handleCombatAndFormationAction,"fpick":Challenge.handleCombatAndFormationAction,"fsl":Challenge.handleCombatAndFormationAction,"fauto":Challenge.handleCombatAndFormationAction,"ffil":Challenge.handleCombatAndFormationAction,"fsave":Challenge.handleCombatAndFormationAction,"fpre":Challenge.handleCombatAndFormationAction,"farmgo":Challenge.handleCombatAndFormationAction,"farmstart":Challenge.handleCombatAndFormationAction,"webupdcheck":Characters.handleUpdatesAction,"webupdgo":Characters.handleUpdatesAction,"webupdskip":Characters.handleUpdatesAction,"updel":Characters.handleUpdatesAction,"upd-open":Characters.handleUpdatesAction,"updcheck":Characters.handleUpdatesAction,"updget":Characters.handleUpdatesAction,"updskip":Characters.handleUpdatesAction,"apkget":Characters.handleUpdatesAction,"relnotes":Characters.handleUpdatesAction,"uprollback":Characters.handleUpdatesAction,"upbuiltin":Characters.handleUpdatesAction,"csframe":Characters.handleCharactersAction,"cspoke":Characters.handleCharactersAction,"cstab":Characters.handleCharactersAction,"upgen":Characters.handleCharactersAction,"gift":Characters.handleCharactersAction,"giftgive":Characters.handleCharactersAction,"ainai":Characters.handleCharactersAction,"ailines":Characters.handleCharactersAction,"ailinesmore":Characters.handleCharactersAction,"upsave":Characters.handleCharactersAction,"upgo":Characters.handleCharactersAction,"wai":Characters.handleCharactersAction,"wfixall":Characters.handleCharactersAction,"regengo":Characters.handleCharactersAction,"regenapply":Characters.handleCharactersAction,"regenretry":Characters.handleCharactersAction,"regenedit":Characters.handleCharactersAction,"regencancel":Characters.handleCharactersAction,"ailooksall":Characters.handleCharactersAction,"ailooks":Characters.handleCharactersAction,"castre":Characters.handleImagesAndAssetsAction,"castfaces":Characters.handleImagesAndAssetsAction,"cfsel":Characters.handleImagesAndAssetsAction,"cfgo":Characters.handleImagesAndAssetsAction,"cfall":Characters.handleImagesAndAssetsAction,"castface":Characters.handleImagesAndAssetsAction,"castok":Characters.handleImagesAndAssetsAction,"castskip":Characters.handleImagesAndAssetsAction,"imgsave":Characters.handleImagesAndAssetsAction,"posegen":Characters.handleImagesAndAssetsAction,"posedel":Characters.handleImagesAndAssetsAction,"upload":Characters.handleImagesAndAssetsAction,"imgx":Characters.handleImagesAndAssetsAction,"npcscan":Characters.handleImagesAndAssetsAction,"npcopen":Characters.handleImagesAndAssetsAction,"npcsave":Characters.handleImagesAndAssetsAction,"npcdraw":Characters.handleImagesAndAssetsAction,"npctags":Characters.handleImagesAndAssetsAction,"npcdel":Characters.handleImagesAndAssetsAction,"npcadd":Characters.handleImagesAndAssetsAction,"cutclose":Characters.handleImagesAndAssetsAction,"lib":Characters.handleImagesAndAssetsAction,"libitem":Characters.handleImagesAndAssetsAction,"libnew":Characters.handleImagesAndAssetsAction,"castt":Characters.handleImagesAndAssetsAction,"naiopen":Characters.handleImagesAndAssetsAction,"naivariety":Characters.handleImagesAndAssetsAction,"naipreset":Characters.handleImagesAndAssetsAction,"packopen":Characters.handleImagesAndAssetsAction,"packuse":Characters.handleImagesAndAssetsAction,"packdel":Characters.handleImagesAndAssetsAction,"packcopy":Characters.handleImagesAndAssetsAction,"packimport":Characters.handleImagesAndAssetsAction,"packsave":Characters.handleImagesAndAssetsAction,"naisave":Characters.handleImagesAndAssetsAction,"cfload":Characters.handleImagesAndAssetsAction,"cftest":Characters.handleImagesAndAssetsAction,"naitest":Characters.handleImagesAndAssetsAction,"skinuse":Characters.handleImagesAndAssetsAction,"faceview":Characters.handleImagesAndAssetsAction,"faces-open":Characters.handleImagesAndAssetsAction,"facesel":Characters.handleImagesAndAssetsAction,"faceup":Characters.handleImagesAndAssetsAction,"faceupnew":Characters.handleImagesAndAssetsAction,"faceupmany":Characters.handleImagesAndAssetsAction,"facedel":Characters.handleImagesAndAssetsAction,"facetgt":Characters.handleImagesAndAssetsAction,"facebasic":Characters.handleImagesAndAssetsAction,"facemask":Characters.handleImagesAndAssetsAction,"facego":Characters.handleImagesAndAssetsAction,"skin-open":Characters.handleImagesAndAssetsAction,"skinlines":Characters.handleImagesAndAssetsAction,"skpartgen":Characters.handleImagesAndAssetsAction,"skpartall":Characters.handleImagesAndAssetsAction,"skpartup":Characters.handleImagesAndAssetsAction,"skingo":Characters.handleImagesAndAssetsAction,"skindel":Characters.handleImagesAndAssetsAction,"wnai":Characters.handleImagesAndAssetsAction,"imglib":Characters.handleImagesAndAssetsAction,"ilbtap":Characters.handleImagesAndAssetsAction,"ilbclear":Characters.handleImagesAndAssetsAction,"ilbdel":Characters.handleImagesAndAssetsAction,"bgmall":Characters.handleImagesAndAssetsAction,"bgmpick":Characters.handleImagesAndAssetsAction,"bgmpickall":Characters.handleImagesAndAssetsAction,"bgmallgo":Characters.handleImagesAndAssetsAction,"bgmplay":Characters.handleImagesAndAssetsAction,"bgmstop":Characters.handleImagesAndAssetsAction,"aupload":Characters.handleImagesAndAssetsAction,"naigen":Characters.handleImagesAndAssetsAction,"cutopen":Characters.handleImagesAndAssetsAction,"cutrun":Characters.handleImagesAndAssetsAction,"cutnai":Characters.handleImagesAndAssetsAction,"cutzoom":Characters.handleImagesAndAssetsAction,"cutundo":Characters.handleImagesAndAssetsAction,"cutnudge":Characters.handleImagesAndAssetsAction,"cuthere":Characters.handleImagesAndAssetsAction,"cutsave":Characters.handleImagesAndAssetsAction,"naigo":Characters.handleImagesAndAssetsAction,"naiagain":Characters.handleImagesAndAssetsAction,"naiedit":Characters.handleImagesAndAssetsAction,"naiuse":Characters.handleImagesAndAssetsAction,"naibatch":Characters.handleImagesAndAssetsAction,"naistop":Characters.handleImagesAndAssetsAction,"skinbuy":Characters.handleImagesAndAssetsAction,"skinpkgdel":Characters.handleImagesAndAssetsAction,"skinnew":Characters.handleImagesAndAssetsAction,"skinpromptsave":Characters.handleImagesAndAssetsAction,"daily":Economy.handleEconomyAction,"shkdraw":Economy.handleEconomyAction,"sparkopen":Economy.handleEconomyAction,"sparkgo":Economy.handleEconomyAction,"pull":Economy.handleEconomyAction,"puexist":Economy.handleEconomyAction,"puxpick":Economy.handleEconomyAction,"puxgo":Economy.handleEconomyAction,"pustoryretry":Economy.handleEconomyAction,"bsel":Economy.handleEconomyAction,"bnew":Economy.handleEconomyAction,"bedit":Economy.handleEconomyAction,"dispset":Economy.handleEconomyAction,"dispall":Economy.handleEconomyAction,"dispredo":Economy.handleEconomyAction,"dispgo":Economy.handleEconomyAction,"dispget":Economy.handleEconomyAction,"dispcancel":Economy.handleEconomyAction,"passreset":Economy.handleEconomyAction,"shopbuy":Economy.handleEconomyAction,"shopswap":Economy.handleEconomyAction,"shkedit":Economy.handleEconomyAction,"shksave":Economy.handleEconomyAction,"shkai":Economy.handleEconomyAction,"cashbuy":Economy.handleEconomyAction,"cashmonth":Economy.handleEconomyAction,"cashpkg":Economy.handleEconomyAction,"phone":Messenger.handleMessengerAction,"openthread":Messenger.handleMessengerAction,"phclose":Messenger.handleMessengerAction,"phback":Messenger.handleMessengerAction,"openfc":Messenger.handleMessengerAction,"fcsend":Messenger.handleMessengerAction,"fcphoto":Messenger.handleMessengerAction,"fcphototog":Messenger.handleMessengerAction,"chatimg":Messenger.handleMessengerAction,"phpendx":Messenger.handleMessengerAction,"chatimgsave":Messenger.handleMessengerAction,"phpick":Messenger.handleMessengerAction,"phmenu":Messenger.handleMessengerAction,"phmenuclose":Messenger.handleMessengerAction,"phadd":Messenger.handleMessengerAction,"phaddback":Messenger.handleMessengerAction,"phaddai":Messenger.handleMessengerAction,"phaddsend":Messenger.handleMessengerAction,"phsel":Messenger.handleMessengerAction,"phselend":Messenger.handleMessengerAction,"phdel":Messenger.handleMessengerAction,"phdelblock":Messenger.handleMessengerAction,"phdelall":Messenger.handleMessengerAction,"phmode":Messenger.handleMessengerAction,"phsay":Messenger.handleMessengerAction,"phnew":Messenger.handleMessengerAction,"fclear":Messenger.handleMessengerAction});
const CX_LABEL=Object.fromEntries(CX_CATS);
const NAI_DEF={key:'',endpoint:NAI_ENDPOINT,model:'nai-diffusion-5-full',refModel:'nai-diffusion-4-5-full',steps:28,scale:6,cfgRescale:0.5,sampler:'k_euler_ancestral',noise:'karras',retries:3,timeoutSec:120,
  cutout:true,transparent:true,varietyBoostV45:true,quality:false,qtags:'',prefix:'',styleId:'my_style',autoArt:'ask',
  sizes:{char:'832x1216',bg:'1216x832',prop:'1024x1024',cg:'1216x832',enemy:'1024x1024',illust:'832x1216',lbcg:'832x1216',map:'832x1216',icon:'1024x1024'},
  ref:{type:'character',strength:1,fidelity:1},autoRef:'off',
  styles:[{id:'my_style',name:'내 그림체',tags:'',neg:''}],
  poses:NAI_POSES.map(([n,t])=>({n,t})),
  parts:NAI_PARTS_DEF, // 종류별 덧붙임·제외 태그 기본값은 프롬프트 스튜디오(0015)
  neg:NAI_NEG_DEF};
 let flushT=null,saveRevision=0,saveTail=Promise.resolve();
/* ── 불러올 때 도는 문장(원래 순서) ── */
/* ── 불러올 때 도는 문장(원래 순서) ── */
/* ── 불러올 때 도는 문장(원래 순서) ── */
Object.defineProperty(window,'RULES',{get:Story.rulesText});
document.addEventListener('pointerdown',e=>{ if(e.button>0) return; const el=e.target.closest&&e.target.closest('[data-act=poke],[data-act=cspoke],[data-act=evspoke]'); if(!el) return;
  const kind=el.dataset.act, c=charById(kind==='poke'?P().sec:el.dataset.id); if(!c) return;
  const S0={kind,el,c,x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY,dir:0,last:e.clientX,turns:0,n:0,id:e.pointerId,hand:null,ring:null};
  const end=()=>{ clearTimeout(tm); removeEventListener('pointermove',mv); removeEventListener('pointerup',up); removeEventListener('pointercancel',up); if(S0.hand){ S0.hand.remove(); S0.ring&&S0.ring.remove(); PET.on=0; PET.swallow=Date.now(); } };
  const tm=setTimeout(()=>{ PET.on=1; try{ el.setPointerCapture&&el.setPointerCapture(e.pointerId); }catch(_){} S0.hand=document.createElement('div'); S0.hand.className='pet-hand'; S0.hand.textContent='🖐'; S0.hand.style.left=S0.x+'px'; S0.hand.style.top=S0.y+'px'; S0.ring=document.createElement('div'); S0.ring.className='pet-ring'; S0.ring.style.left=S0.x+'px'; S0.ring.style.top=S0.y+'px'; document.body.append(S0.ring,S0.hand); if(navigator.vibrate) try{ navigator.vibrate(12); }catch(_){} },350);
  const mv=ev=>{ if(ev.pointerId!==S0.id) return; S0.x=ev.clientX; S0.y=ev.clientY;
    if(!S0.hand){ if(Math.hypot(ev.clientX-S0.x0,ev.clientY-S0.y0)>12) end(); return; }
    ev.preventDefault(); S0.hand.style.left=S0.x+'px'; S0.hand.style.top=S0.y+'px'; S0.ring&&(S0.ring.style.left=S0.x+'px',S0.ring.style.top=S0.y+'px');
    const dx=ev.clientX-S0.last; if(Math.abs(dx)<14) return; const d=dx>0?1:-1; S0.last=ev.clientX;
    if(d!==S0.dir){ if(S0.dir) S0.turns++; S0.dir=d; S0.hand.style.transform=`translate(-50%,-70%) rotate(${d*14}deg)`; if(S0.turns&&S0.turns%2===0){ S0.n++; CharactersView.petTick(S0); if(S0.n===1) Economy.petAffect(S0.c); } } };
  const up=ev=>{ if(ev.pointerId===S0.id) end(); };
  addEventListener('pointermove',mv,{passive:false}); addEventListener('pointerup',up); addEventListener('pointercancel',up); },true);
document.addEventListener('click',e=>{ if(PET.swallow&&Date.now()-PET.swallow<400){ PET.swallow=0; e.stopPropagation(); e.preventDefault(); } },true);
document.addEventListener('contextmenu',e=>{ if(PET.on||(e.target.closest&&e.target.closest('[data-act=poke],[data-act=cspoke],[data-act=evspoke]'))) e.preventDefault(); },true);










































































































































































































document.addEventListener('click',async e=>{ const b=e.target.closest('[data-act]'); if(!b) return; const a=b.dataset.act, id=b.dataset.id, v=k=>(document.querySelector(`#modal [data-pf="${id}"][data-k="${k}"]`)||{}).value||'';
  if(a==='pstopen') PromptStudioView.openStudio();
  else if(a==='psttab') PromptStudioView.openStudio(b.dataset.k);
  else if(a==='pstsave'){ PromptStudio.pfSet(id,{text:v('text').trim(),add:v('add').trim()}); CoreView.toast('조각을 저장했어요'); PromptStudioView.openStudio(); }
  else if(a==='pstreset'){ PromptStudio.pfSet(id,null); CoreView.toast('기본으로 되돌렸어요'); PromptStudioView.openStudio(); }
  else if(a==='pstai') await PromptStudio.pstPolish(CoreView.uiProg(b),id);
  else if(a==='pstimgfix'){ const n=PromptStudio.imgAuditFix(PromptStudio.imgAuditScan()); CoreView.toast(`그림 프롬프트 ${n}개를 정리하고 교훈으로 기록했어요`); PromptStudioView.openStudio(); }
  else if(a==='pstundo'){ CharactersCtl.auditUndo(); G.lib.forEach(l=>Core.mark('l:'+l.id)); PromptStudioView.openStudio(); }
  else if(a==='pstltog'){ const L=PromptStudio.plList(), x=L.find(l=>l.id===id); if(x){ x.on=b.checked; PromptStudio.plSave(L); } }
  else if(a==='pstldel'){ PromptStudio.plSave(PromptStudio.plList().filter(l=>l.id!==id)); PromptStudioView.openStudio(); }
  else if(a==='pstladd'){ const t=($('#pl_new')||{}).value||''; if(!t.trim()){ CoreView.toast('교훈 내용을 써 주세요'); return; } PromptStudio.plAdd(t,($('#pl_scope')||{}).value); CoreView.toast('교훈을 추가했어요'); PromptStudioView.openStudio(); } });
System.aipMigrate();
/* 네이티브 HTTP (앱에서는 CORS 없이 직접 호출) */
const IS_NATIVE=!!(window.Capacitor&&(typeof window.Capacitor.isNativePlatform==='function'?window.Capacitor.isNativePlatform():window.Capacitor.Plugins&&window.Capacitor.Plugins.CapacitorHttp));
const IS_IOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const IS_STANDALONE=(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;
// QR 주소(?pc=키)로 열면 연결해요. 같은 주소를 다시 찍어도 지난 저장 기록(last·localAt)은 그대로 둬요(지우면 받지 않은 진행을 덮어써요)
// 아이폰 Safari에서는 주소에 키를 남겨 둬요: 홈 화면에 추가할 때 키가 같이 들어가야 홈 화면 앱(저장 공간이 Safari와 따로예요)도 PC에 연결돼요
(function(){ try{ const u=new URL(location.href), k=u.searchParams.get('pc'); if(k){ const old=System.PCS(); System.setPCS(Object.assign({},old&&old.key===k&&old.base===location.origin?old:{},{base:location.origin,key:k,at:Date.now()})); if(!(IS_IOS&&!IS_STANDALONE)){ u.searchParams.delete('pc'); history.replaceState(null,'',u.pathname+(u.search||'')+u.hash); } window.__PC_NEW=1; } }catch(e){} })();
(function(){ try{ const pc=System.PCS(); if(!pc||pc.base!==location.origin||!window.fetch||!URL.createObjectURL) return; const el=document.querySelector('link[rel=manifest]'); if(!el) return;
  fetch(el.href).then(r=>r.json()).then(m=>{ m.start_url=location.origin+'/?pc='+encodeURIComponent(pc.key); m.scope=location.origin+'/'; m.icons=(m.icons||[]).map(i=>Object.assign({},i,{src:new URL(i.src,el.href).href})); el.href=URL.createObjectURL(new Blob([JSON.stringify(m)],{type:'application/manifest+json'})); }).catch(()=>{}); }catch(e){ Core.quietErr(e,'0020-ai-connect.js:63'); } })();
/* AI 기록: 글 AI 호출마다 성공·실패, 걸린 시간, 오류, 받은 응답 앞부분을 남겨요(설정 → 글 AI → AI 기록). 키는 남기지 않아요 */
const AILOG=(()=>{ try{ const a=JSON.parse(appStorage.getItem('ggm-ailog')||'[]'); return Array.isArray(a)?a:[]; }catch(e){ return []; } })();
CoreView.naiBlocksMount.serial=0;
// Observe newly opened dialogs only, not keystrokes or the entire game data.
(function(){let queued=false;const pending=new Set();const observer=new MutationObserver(records=>{
 for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1&&!node.closest?.('.nai-block-editor'))pending.add(node);
 if(!pending.size||queued)return;queued=true;queueMicrotask(()=>{queued=false;const nodes=[...pending];pending.clear();for(const node of nodes)if(node.isConnected){CoreView.naiBlocksMount(node);MiscView.naiBlocksScan(node);}});
 });observer.observe(document.body,{childList:true,subtree:true});MiscView.naiBlocksScan();})();
(function(){
 MiscView.imageScrollGuard();
 const generate=Core.naiGenerate,emotion=Art.naiEmotion,inpaint=Characters.focusedInpaint;
 Core.naiGenerate=function(prompt,kind,opts={}){if(!opts.candidateEligible||opts.candidateBypass)return generate(prompt,kind,opts);return CharactersView.imageCandidates(async cfg=>{const op={...opts,neg:cfg.neg,seed:cfg.seed};const blob=await generate(cfg.prompt,kind,op);Object.assign(opts,{usedSeed:op.usedSeed,usedModel:op.usedModel,usedTp:op.usedTp});return blob;},{prompt,promptBlocks:['char','illust','lbcg','enemy'].includes(kind),promptParts:opts.promptParts,neg:opts.neg,seed:opts.seed,originalSrc:opts.originalSrc,prepare:opts.prepareCandidates});};
 Art.naiEmotion=function(src,emo,extra,level,eligible=false,originalSrc=''){if(!eligible)return emotion(src,emo,extra,level);return CharactersView.imageCandidates(cfg=>emotion(src,emo,cfg.prompt,level),{prompt:extra||'',originalSrc});};
 // Selection must compare the final full-size composition, never the cropped face.
 Characters.focusedInpaint=function(src,mask,draw,settings={}){if(!settings.candidateEligible)return inpaint(src,mask,(...args)=>draw(...args,settings));return CharactersView.imageCandidates(cfg=>inpaint(src,mask,(...args)=>draw(...args,cfg)),settings);};
 const thumbnails='#image-candidate-dialog img, .naiprev.done img, #v2-icon-dialog .ill-box img, .skp-img img, .cs-sheet [data-character-preview]';
 document.addEventListener('click',e=>{const img=e.target.closest?.(thumbnails);if(!img)return;e.preventDefault();e.stopImmediatePropagation();MiscView.imagePreviewThumbnail(img);},true);
 document.addEventListener('keydown',e=>{if(document.getElementById('generated-image-preview')&&['Escape','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();if(e.key==='Escape')MiscView.imagePreviewClose();else document.getElementById('generated-image-preview')._move(e.key==='ArrowLeft'?-1:1);return;}const img=e.target.closest?.(thumbnails);if(img&&['Enter',' '].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();MiscView.imagePreviewThumbnail(img);return;}if(e.key==='Escape'&&IMAGE_CANDIDATES){e.preventDefault();e.stopImmediatePropagation();MiscView.imageCandidateBack();}},true);
})();
document.addEventListener('click',e=>{ const im=e.target.closest&&e.target.closest('.cast-im img,.cast-fc img,.fc-it img,.fc-two img,.sk-slot img,.sk-face img,.skp-img img,.skinpkg .wthumb img'); if(im) CoreView.imgViewer(im.src); });
setInterval(()=>{ if(CAST&&$('#castGrid')&&$('#modal').hidden&&!CAST.busy) CharactersView.castRefresh(); },4000);
document.addEventListener('click',async e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act, id=el.dataset.id;
  if(a==='amopen') ArtView.openAssets();
  else if(a==='amtab') ArtView.openAssets(el.dataset.k);
  else if(a==='amput'){ const l=G.lib.find(x=>x.id===id); if(l&&await Art.shPut(l)) CoreView.toast(`「${l.name}」을(를) 공유 보관함에 넣었어요`); else CoreView.toast('넣을 그림·소리가 없어요'); ArtView.openAssets(); }
  else if(a==='amtake'){ const x=Art.shList().find(y=>y.id===id); const l=x&&await Art.shTake(x); CoreView.toast(l?`「${l.name}」을(를) 가져왔어요`:'가져오지 못했어요'); ArtView.openAssets(); }
  else if(a==='amshdel'){ if(!(await appConfirm('공유 보관함에서 지울까요? 이미 가져온 게임의 자료는 그대로예요.'))) return; Art.shSave(Art.shList().filter(x=>x.id!==id)); try{ await Core.idbDel('shared::'+id); }catch(_){} ArtView.openAssets(); }
  else if(a==='ammerge'){ const n=Art.libMerge(Art.libDupes()); CoreView.toast(`${n}개를 합쳤어요(그림 1장을 같이 써요)`); ArtView.openAssets(); }
  else if(a==='amundo'){ CharactersCtl.auditUndo(); G.lib.forEach(l=>Core.mark('l:'+l.id)); ArtView.openAssets(); }
  else if(a==='amadopt'){ let n=0; for(const l of G.lib.filter(l=>!l.img&&!l.audio&&!l.alias)){ const x=Art.shList().find(y=>y.kind===l.kind&&y.name===l.name); if(x&&await Art.shTake(x,l)) n++; } CoreView.toast(n?`${n}개를 보관함에서 채웠어요`:'채울 자료가 없어요'); ArtView.openAssets(); }
  else if(a==='amemodel'){ G.lib=G.lib.filter(x=>x.id!==id); Core.mark('l:'+id); ArtView.openAssets(); } });
document.addEventListener('change',async e=>{ const k=e.target.dataset&&e.target.dataset.amemo, f=e.target.files&&e.target.files[0]; if(!k||!f) return;
  let l=G.lib.find(x=>x.kind==='emote'&&x.name===k); if(!l){ l={id:'l'+uid(),kind:'emote',name:k,prompt:'',img:null}; G.lib.push(l); } await Art.storeImage(l,f); Core.mark('l:'+l.id); CoreView.toast(`「${k}」 아이콘을 바꿨어요`); ArtView.openAssets('emote'); });
const BGM={el:new Audio(),name:null,want:null,fadeT:null,blocked:false};
BGM.el.loop=true;
document.addEventListener('click',()=>{ if(BGM.blocked){ BGM.blocked=false; const n=BGM.want; BGM.name=null; ArtView.bgm(n); } },true);
document.addEventListener('click',e=>{ if(e.target.closest('.btn,.tile,.tab,.chip,.bsel button')) Art.sfx('버튼'); },true);
const VOICE=new Audio();
const DEFAULT_LIB_IMG = [
 LI('bg_office','bg','새벽등대 사무소','no humans, scenery, small detective office interior, night, rain on window, neon light from outside, cluttered desk, old leather sofa, coffee machine, warm desk lamp, cyberpunk harbor city, anime background, highly detailed'),
 LI('bg_alley','bg','회색구 골목','no humans, scenery, narrow back alley, night, heavy rain, puddles reflecting neon signs, korean signboards, ruined buildings, anime background, cinematic lighting'),
 LI('bg_roof','bg','사무소 옥상','no humans, scenery, rooftop at dawn, wet floor after rain, railing, water tank, distant skyline with red crater glow, anime background'),
 LI('bg_rail','bg','폐선로','no humans, scenery, abandoned railway, rusted train cars, overgrown tracks, eerie floating light particles, dusk, anime background'),
 LI('bg_helix','bg','헬릭스 물류창고','no humans, scenery, high-tech corporate warehouse interior, stacked containers with helix logo, cold blue lights, red alarm lights, anime background'),
 LI('bg_crater','bg','낙성 분화구','no humans, scenery, giant crater in ruined city, glowing red star fragment in center, night sky, pillars of light, apocalyptic, epic, anime background'),
 LI('bg_med','bg','의무실','no humans, scenery, small infirmary, white curtain, medical bed, shelves of medicine, wine bottle on desk, soft lamp, night, anime background'),
 LI('bg_port','bg','옛 항구','no humans, scenery, old harbor pier, rusted cranes, calm sea, sunset, seagulls, anime background'),
 LI('bg_casino','bg','카지노 뒷골목','no humans, scenery, back alley behind casino, red neon, playing card posters, cigarette smoke, night, anime background'),
 LI('bg_garage','bg','정비실','no humans, scenery, cluttered mechanic workshop, drones on workbench, tools on wall, warm work light, anime background'),
 LI('bg_stall','bg','포장마차','no humans, scenery, korean street food tent at night, orange tarp, steaming noodles, plastic stools, rain outside, anime background'),
 LI('bg_odelle','bg','오델의 집','no humans, scenery, tidy small apartment entrance, cat bowl, neatly arranged shoes, warm light, anime background'),
 LI('bg_room','bg','관리관 숙소','no humans, scenery, small bedroom at night, phone glowing on bed, city lights through window, anime background'),
 LI('pr_ace','prop','하트 에이스','no humans, still life, ace of hearts playing card, slightly worn, object focus, simple background, white background'),
 LI('pr_box','prop','헬릭스 상자','no humans, object focus, metal cargo case with glowing blue helix logo, sci-fi, simple background, white background'),
 LI('pr_tracker','prop','성핵 추적 장치','no humans, object focus, small sci-fi tracking device with red glowing core, simple background, white background'),
 LI('pr_mungchi','prop','뭉치','no humans, object focus, small cute round repair drone with one camera eye, patched paint, simple background, white background'),
 LI('pr_letter','prop','임명장','no humans, object focus, old paper appointment certificate with red wax seal, simple background, white background')
];
const DEFAULT_BGM = [
 LI('bgm_title','bgm','타이틀','Epic orchestral anime game title theme, melancholic solo piano intro building to soaring strings and soft choir, starry night, mysterious and grand, 90 bpm, instrumental, seamless loop'),
 LI('bgm_lobby','bgm','로비','Relaxed lo-fi jazz hip hop for a small detective office at night, gentle rain ambience, warm electric piano, brushed drums, upright bass, cozy anime game lobby, 80 bpm, instrumental, seamless loop'),
 LI('bgm_daily','bgm','일상','Lighthearted slice-of-life anime BGM, playful pizzicato strings, glockenspiel, ukulele, bouncy and comedic, 110 bpm, instrumental, seamless loop'),
 LI('bgm_tense','bgm','긴장','Tense suspense underscore for an investigation in a rainy cyberpunk city, low synth drones, ticking percussion, distant metallic hits, 90 bpm, instrumental, seamless loop'),
 LI('bgm_battle','bgm','전투','High-energy anime game battle music, driving electric guitar riffs, synth bass, orchestral hits, fast drums, heroic and urgent, 160 bpm, instrumental, seamless loop'),
 LI('bgm_boss','bgm','보스전','Epic boss battle theme, dark latin choir, heavy orchestral percussion, distorted guitars, apocalyptic red star rising, intense and desperate, 150 bpm, instrumental, seamless loop'),
 LI('bgm_gacha','bgm','계약','Magical summoning fanfare, shimmering harp glissandos, celesta, rising strings, anticipation and wonder, bright and sparkling, instrumental, seamless loop'),
 LI('bgm_sad','bgm','감성','Emotional anime piano ballad, gentle strings, bittersweet and intimate, late night confession, 70 bpm, instrumental, seamless loop'),
 LI('bgm_flirt','bgm','설렘','Romantic sultry lounge jazz, slow tenor saxophone, soft piano, muted trumpet, late night bar, flirty and teasing mood, 75 bpm, instrumental, seamless loop')
];
const DEFAULT_LIB=[...DEFAULT_LIB_IMG,...DEFAULT_BGM];
const DEFAULT_CHARS = [
 C({id:'sera',persona:{"traits": ["말수 적은 프로", "동료를 몰래 챙김", "과거를 숨김"], "self": "나", "call": "관리관", "ending": "~해. / ~야. (짧은 반말)", "quirk": "\"…보고는 짧게.\"", "catch": "표적이 보이면 끝난 거야.", "gap": "무뚝뚝하지만 관리관의 커피 취향은 한 번도 틀린 적이 없다", "flaw": "도움을 청하지 못한다", "want": "다시는 동료를 잃지 않는 것", "fear": "혼자 살아 돌아오는 것", "likes": ["진한 커피", "새벽 옥상"], "dislikes": ["긴 보고", "변명"], "hobby": "총기 손질", "motif": "붉은 조준경"},ord:0,name:'세라',age:27,rarity:3,role:'atk',elem:'홍',hp:1100,atk:170,def:45,spd:100,
  skill:{name:'적색 일섬',kind:'dmg',power:2.8,cd:3,desc:'체력이 가장 낮은 적 하나에게 큰 피해'},
  profile:'헬릭스 특수부대 출신 저격수. 회사를 떠난 이유는 말하지 않는다. 무뚝뚝하지만 관리관의 커피 취향은 정확히 기억한다.',
  intro:'계약? 좋아. 대신 내 사선 앞엔 서지 마.',
  lines:['보고는 짧게. 커피는 진하게.','표적이 보이면 끝난 거야.','…오늘은 일찍 퇴근해. 명령이야.'],
  touch:{head:['…쓰다듬지 마. 애 취급하는 거야?','머리는 저격수의 생명이야. 망가지면 책임져.'],body:['……지금 어딜 만지는 거지. 조준경 너머로 다 보여.','관리관. 세 번째는 경고 없이 쏜다.']},
  naiPrompt:'1girl, solo, tall, long crimson hair, sharp amber eyes, black tactical bodysuit, long dark coat, holding sniper rifle, cool expression, full body, standing, simple background, white background',
  img:null,episodes:[{id:'e1',lv:2,r19:false,title:'새벽 세 시의 옥상',script:`[사무소 옥상]
비가 그친 새벽. 난간에 기댄 세라의 담배 불빛이 깜빡인다.
세라: 아직 안 잤어?
관리관: 너야말로.
세라: 저격수는 원래 잠이 얕아. 헬릭스에 있을 때 버릇이야.
세라: 거기선 이유를 묻는 사람이 없었어. 쏘라면 쐈지.
선택: 여기선 물어볼 거야 | 담배는 몸에 안 좋아
1) 세라: …그래서 여기가 마음에 들어. 귀찮지만.
2) 세라: 잔소리는 이브 하나로 충분해. …한 대만 더 피우고 끊을게. 진짜로.
그녀는 처음으로 웃었다. 아주 짧게.`}]}),
 C({id:'eve',persona:{"traits": ["느긋한 살림꾼", "장난스러운 어른", "냉철한 군의관"], "self": "나", "call": "관리관", "ending": "~요. / ~려나? (느긋한 존댓말)", "quirk": "\"어머.\"", "catch": "아픈 데 생기면… 아니, 안 생겨도 와요.", "gap": "느긋하게 웃다가도 수술대 앞에서는 한 치의 망설임도 없다", "flaw": "자기 몸은 잘 돌보지 않는다", "want": "모두가 무사히 돌아오는 밤", "fear": "손쓸 수 없는 환자", "likes": ["와인", "관리관 놀리기"], "dislikes": ["무리하는 사람"], "hobby": "허브 화분 가꾸기", "motif": "청진기와 와인잔"},ord:1,name:'이브',age:29,rarity:3,role:'sup',elem:'청',hp:1300,atk:120,def:60,spd:95,
  skill:{name:'청람의 숨결',kind:'heal',power:1.6,cd:3,desc:'아군 전체의 체력을 회복'},
  profile:'새벽등대의 의무관이자 실질적인 살림꾼. 느긋한 말투 뒤에 전직 군의관의 냉철함이 숨어 있다. 와인과 관리관 놀리기를 좋아한다.',
  intro:'의무관 이브예요. 아픈 데 생기면… 아니, 안 생겨도 와요.',
  lines:['어머, 또 다쳐서 왔네? 이리 와 봐요.','진료비는… 오늘 저녁 한 잔이면 되려나.','무리하지 마요. 당신이 쓰러지면 다들 곤란하니까.'],
  touch:{head:['어머, 나 쓰다듬어 주는 거예요? 보답은 뭘로 할까~','머리 말고 다른 데가 아픈데. 농담이에요.'],body:['진찰은 제가 하는 쪽인데… 오늘은 역할 바꿔요?','후후, 손이 차갑네요. 따뜻하게 해 줄까요?']},
  naiPrompt:'1girl, solo, wavy long silver-blue hair, half-closed blue eyes, gentle smile, white coat over dark turtleneck, medical bag, full body, standing, simple background, white background',
  img:null,episodes:[{id:'e1',lv:2,r19:false,title:'진료 기록 외',script:`[의무실]
관리관: 이브, 아까 그 상처는 괜찮아?
이브: 내 걱정? 귀엽네요, {관리관}.
이브는 소독약을 내려놓고 의자를 돌려 마주 앉는다. 다리를 꼬는 동작이 쓸데없이 느리다.
이브: 군에 있을 땐 아무도 의무관한테 괜찮냐고 안 물었어요.
이브: 그래서 가끔은… 이렇게 물어봐 주는 사람이 필요했나 봐.
선택: 그럼 매일 물어볼게 | 지금 어디 보고 있었는지 묻지 마
1) 이브: 그 말, 기록해 둘게요. 진료 기록 말고, 내 기록에.
2) 이브: 어머~ 안 물어봤는데 자백하네요? 귀엽다, 진짜.`}]}),
 C({id:'kaya',persona:{"traits": ["힘 자랑하는 맏언니", "고기 애호가", "동료 바보"], "self": "나", "call": "관리관 / 너", "ending": "~다! / ~자! (시원한 반말)", "quirk": "\"앞은 맡겨!\"", "catch": "앞은 내가 맡는다!", "gap": "동료가 다치면 누구보다 먼저 울먹인다", "flaw": "앞뒤 안 보고 뛰어든다", "want": "모두가 배불리 먹는 식탁", "fear": "뒤에서 동료가 쓰러지는 소리", "likes": ["고기", "항구 노을"], "dislikes": ["동료가 다치는 것", "채소"], "hobby": "팔씨름", "motif": "거대한 방패"},ord:2,name:'카야',age:24,rarity:2,role:'def',elem:'녹',hp:1600,atk:95,def:95,spd:85,
  skill:{name:'강철 방벽',kind:'shield',power:1.5,cd:3,desc:'아군 전체에 보호막'},
  profile:'거대한 방패를 휘두르는 전직 항만 노동자. 힘자랑과 고기를 좋아하고, 동료가 다치는 걸 가장 싫어한다.',
  intro:'카야다! 앞은 맡겨! 고기는 네가 사고!',
  lines:['뒤에 있어! 앞은 내가 맡는다!','관리관, 오늘 고기 먹으러 가자. 내가 쏠게… 반만.','방패가 무겁냐고? 너보단 가벼워. 농담이야.'],
  touch:{head:['헤헤, 더 해도 돼!','머리 쓰다듬는 거 좋아. 엄마 생각나.'],body:['어, 어딜! 근육 만져보고 싶으면 말로 해!','…너 의외로 대담하다?']},
  naiPrompt:'1girl, solo, athletic, short messy green hair, confident grin, tank top, cargo pants, huge metal shield, full body, standing, simple background, white background',
  img:null,episodes:[{id:'e1',lv:2,r19:false,title:'옛 부두',script:`[옛 항구]
카야: 여기가 내가 일하던 부두야. 낙성 전엔 배가 엄청 많았대.
관리관: 지금은 조용하네.
카야: 응. 그래서 내가 시끄럽게 사는 거야. 누군가는 떠들어야지.
카야는 바다에 돌을 던진다. 생각보다 멀리 날아간다.
카야: 봤지? 방패 말고도 잘하는 거 많다니까.`}]}),
 C({id:'luna',persona:{"traits": ["말 빠른 장난꾸러기", "천재 해커", "외로움 많음"], "self": "나", "call": "관리관~", "ending": "~지롱 / ~거든? (빠른 반말)", "quirk": "\"농담… 반쯤.\"", "catch": "관리관 폰 이미 해킹했어. 농담… 반쯤.", "gap": "장난 뒤에 혼자 남는 게 무서워 늘 누군가에게 말을 건다", "flaw": "진지한 얘기를 장난으로 피한다", "want": "쫓기지 않고 쉴 수 있는 집", "fear": "연락이 끊기는 것", "likes": ["에너지 드링크", "보안 뚫기"], "dislikes": ["지루함", "기다리기"], "hobby": "게임 스피드런", "motif": "쌍권총과 노트북"},ord:3,name:'루나',age:22,rarity:2,role:'atk',elem:'청',hp:950,atk:140,def:40,spd:120,
  skill:{name:'체인 버스트',kind:'aoe',power:1.3,cd:3,desc:'적 전체에 연속 사격'},
  profile:'쌍권총과 해킹을 동시에 다루는 프리랜서. 말이 빠르고 장난이 많다. 헬릭스 서버를 털다 쫓기던 중 새벽등대에 굴러들어왔다.',
  intro:'루나 등장~ 관리관 폰 이미 해킹했어. 농담… 반쯤.',
  lines:['관리관~ 오늘 해킹한 거 보여줄까? 아, 불법이라 안 되나.','탕탕! 끝! 보너스는 계좌로~','심심해. 놀아줘. 명령이야. 아니, 부탁이야.'],
  touch:{head:['쓰다듬기 +1! 호감도 해킹 성공~','더더! 아 아니, 그만! …아니 계속.'],body:['꺄! 변태 관리관! 이거 녹화해서 이브 언니한테 보낸다!','흐응~ 이런 취향이었어? 메모해 둘게.']},
  naiPrompt:'1girl, solo, long blue hair, mischievous smile, cropped hoodie, shorts, thigh holsters, dual pistols, headset, full body, standing, simple background, white background',
  img:null,episodes:[{id:'e1',lv:2,r19:false,title:'새벽 두 시의 메시지',script:`[관리관 숙소]
메시지 알림이 울린다. 발신자는 루나.
루나: 자?
루나: 안 자지? 읽음 표시 떴거든.
관리관: 무슨 일이야.
루나: 그냥. 서버 털 때보다 이게 더 떨려서.
루나: …아냐, 잊어. 내일 커피 사.
화면 너머로 그녀가 웃는 것 같았다.`}]}),
 C({id:'miho',persona:{"traits": ["여유로운 승부사", "사람을 읽는 눈", "마음을 숨김"], "self": "저", "call": "당신", "ending": "~죠. / ~거든요. (나긋한 존댓말)", "quirk": "\"한 판 걸어볼래요?\"", "catch": "패는 숨기는 게 예의예요. 마음도요.", "gap": "확률도 사람도 안 믿는다면서 관리관에게만은 전부를 건다", "flaw": "진심을 농담처럼 말해 버린다", "want": "질 걱정 없는 승부 한 번", "fear": "누군가를 믿었다가 잃는 것", "likes": ["카드 섞는 소리", "달콤한 칵테일"], "dislikes": ["속임수 쓰는 사람"], "hobby": "동전 마술", "motif": "뒤집힌 카드"},ord:4,name:'미호',age:26,rarity:2,role:'sup',elem:'홍',hp:1000,atk:115,def:50,spd:110,
  skill:{name:'올인',kind:'buff',power:1.2,cd:4,desc:'아군 전체 공격력 상승'},
  profile:'회색구 카지노의 딜러였던 도박사. 확률은 믿지 않고 사람을 믿는다고 말하지만, 실은 둘 다 믿지 않는다.',
  intro:'판돈이 큰 계약이네요. 좋아요, 걸어보죠.',
  lines:['한 판 걸어볼래요? 판돈은… 당신.','운 좋은 사람 곁에 있으면 나도 운이 좋아지거든요.','패는 숨기는 게 예의예요. 마음도요.'],
  touch:{head:['어머, 행운의 부적 대신이에요?','머리 만지면 운이 옮는대요. 제 운 다 가져가면 곤란한데.'],body:['손버릇이 나쁘네요. 칩으로 계산할게요.','후후, 그 패… 블러핑 아니죠?']},
  naiPrompt:'1girl, solo, long black hair with red streak, fox-like eyes, sly smile, red qipao-style dress, black gloves, playing cards, full body, standing, simple background, white background',
  img:null,episodes:[{id:'e1',lv:2,r19:false,title:'하트 에이스',script:`[카지노 뒷골목]
미호: 여기서 처음 딜러를 했어요. 손님들이 다 거짓말쟁이였죠.
관리관: 너는?
미호: 나는 제일 큰 거짓말쟁이였고요.
미호는 카드 한 장을 뒤집어 관리관의 손에 쥐여 준다.
[소품: 하트 에이스]
미호: 이건 속임수 아니에요. …이번만은.
[소품 끝]`}]}),
 C({id:'hanna',persona:{"traits": ["근성의 신입", "선배 동경", "과하게 성실함"], "self": "저", "call": "관리관님", "ending": "~습니다! (군기 든 존댓말)", "quirk": "\"확인했습니다!\"", "catch": "언젠가 세라 선배처럼 될 거예요.", "gap": "완벽해 보이려 밤새 연습하다 아침에 졸아 버린다", "flaw": "실수를 혼자 끌어안는다", "want": "선배들에게 인정받는 것", "fear": "짐이 되는 것", "likes": ["보고서 체크리스트", "선배들 무용담"], "dislikes": ["대충 하는 것"], "hobby": "훈련 일지 쓰기", "motif": "새 군화"},ord:5,name:'한나',age:25,rarity:1,role:'atk',elem:'녹',hp:1000,atk:120,def:50,spd:105,
  skill:{name:'돌격',kind:'dmg',power:1.9,cd:2,desc:'체력이 가장 낮은 적 하나에게 피해'},
  profile:'새벽등대에 가장 최근 들어온 신입 용병. 성실함과 근성은 사무소 최고. 선배들을 동경한다.',
  intro:'신입 한나, 오늘부터 잘 부탁드립니다!',
  lines:['신입 한나, 출격 준비 완료입니다!','관리관님, 보고서 세 번 검토했습니다!','언젠가 세라 선배처럼 될 거예요.'],
  touch:{head:['헤, 헤헤… 칭찬이에요?','선배들한테 자랑할래요!'],body:['과, 관리관님?! 이, 이것도 훈련인가요?!','저, 저는 괜찮은데… 아니 안 괜찮아요!']},
  naiPrompt:'1girl, solo, brown ponytail, earnest expression, green military jacket, combat boots, assault rifle, full body, standing, simple background, white background',
  img:null,episodes:[{id:'e1',lv:2,r19:false,title:'첫 월급',script:`[포장마차]
한나: 관리관님! 첫 월급 받았어요! 오늘은 제가 살게요!
관리관: 괜찮아?
한나: 네! 누군가한테 한턱내는 게 꿈이었거든요.
한나: …사실 고향에 보낼 돈 빼면 국수 두 그릇이 한계지만요.
두 사람은 김이 나는 국수를 앞에 두고 웃었다.`}]}),
 C({id:'odelle',persona:{"traits": ["원칙주의자", "과묵한 보호자", "은근한 다정함"], "self": "저", "call": "관리관", "ending": "~입니다. (딱딱한 존댓말)", "quirk": "\"규정에 따라.\"", "catch": "규칙은 지키라고 있는 겁니다, 관리관.", "gap": "규칙에 엄격하면서 고양이 앞에서는 목소리가 반 옥타브 올라간다", "flaw": "융통성이 없다", "want": "모두가 제시간에 퇴근하는 사무소", "fear": "규칙이 사람을 지키지 못하는 순간", "likes": ["고양이", "정시 퇴근"], "dislikes": ["연장 근무", "무단 행동"], "hobby": "고양이 사진 정리", "motif": "경비대 배지"},ord:6,name:'오델',age:31,rarity:1,role:'def',elem:'청',hp:1500,atk:85,def:85,spd:80,
  skill:{name:'경비대 진형',kind:'shield',power:1.1,cd:3,desc:'아군 전체에 보호막'},
  profile:'은퇴한 시 경비대장. 원칙주의자이며 사무소의 규칙을 혼자 지킨다. 의외로 고양이를 키운다.',
  intro:'오델 크레인. 규정에 따라 계약에 응합니다.',
  lines:['규칙은 지키라고 있는 겁니다, 관리관.','퇴근 시간입니다. 연장 근무는 승인하지 않겠습니다.','…고양이 사진이요? 보고 싶으시다면야.'],
  touch:{head:['…근무 중입니다. 짧게 하세요.','고양이한테 하는 것처럼 하시는군요. 나쁘진 않습니다.'],body:['관리관. 그건 사내 규정 14조 위반입니다.','……보고서는 쓰지 않겠습니다. 이번만.']},
  naiPrompt:'1girl, solo, short navy hair, stern face, glasses, police-style uniform, long coat, riot shield, full body, standing, simple background, white background',
  img:null,episodes:[{id:'e1',lv:2,r19:false,title:'규칙 제0조',script:`[오델의 집]
오델: 서류를 놓고 가셨기에… 들어오시죠. 잠깐이면 됩니다.
작은 고양이가 관리관의 발목에 몸을 비빈다.
오델: 이름은 규칙입니다. 제 인생의 유일한 예외라서요.
관리관: 그럼 나는?
오델: …그건 아직 검토 중입니다.`}]}),
 C({id:'jia',persona:{"traits": ["과묵한 정비사", "기계에 이름 붙임", "은근히 세심함"], "self": "저", "call": "관리관", "ending": "…~요. (짧고 조용한 존댓말)", "quirk": "\"…고쳐 놨어요.\"", "catch": "고장 나면 가져와요. 사람도요.", "gap": "말은 없지만 관리관의 총 조준경이 1도 틀어진 것까지 알아챈다", "flaw": "사람보다 기계가 편하다", "want": "모두가 고장 나지 않는 것", "fear": "고칠 수 없는 고장", "likes": ["기름 냄새", "드론 뭉치"], "dislikes": ["시끄러운 곳"], "hobby": "고물 수집", "motif": "렌치와 드론"},ord:7,name:'지아',age:23,rarity:1,role:'sup',elem:'녹',hp:950,atk:100,def:45,spd:115,
  skill:{name:'수리 드론',kind:'heal',power:1.0,cd:3,desc:'아군 전체의 체력을 회복'},
  profile:'드론과 장비를 고치는 정비사. 말수가 적고 기계에게 이름을 붙인다. 손이 늘 기름투성이다.',
  intro:'…지아. 고장 난 거 있으면 가져와요.',
  lines:['…이 드론 이름은 뭉치예요.','고장 나면 가져와요. 사람도요.','관리관 총, 조준경이 1도 틀어졌어요. 고쳐 놨어요.'],
  touch:{head:['…따뜻해요. 계속해요.','기름 묻어요. 괜찮아요?'],body:['…거긴 정비 대상 아니에요.','뭉치, 녹화 끄고 저쪽 보고 있어.']},
  naiPrompt:'1girl, solo, messy short black hair, goggles on head, mechanic jumpsuit tied at waist, tank top, wrench, small drone, full body, standing, simple background, white background',
  img:null,episodes:[{id:'e1',lv:2,r19:false,title:'뭉치의 생일',script:`[정비실]
지아: …관리관. 잠깐 와 봐요.
작업대 위에 작은 케이크와 낡은 드론 한 대가 놓여 있다.
[소품: 뭉치]
지아: 뭉치가 오늘로 다섯 살이에요. 내가 처음 만든 드론.
지아: 아무한테도 말 안 했는데… 당신한텐 말하고 싶었어요.
[소품 끝]
드론의 불빛이 두 번 깜빡였다. 축하한다는 뜻이래.`}]})
];
const DEFAULT_CHAPTERS = [{id:'c1',ord:0,title:'1장 낙성의 도시',stages:[
 {id:'s11',title:'첫 계약',reward:300,enemies:[E('잔광 하운드','녹',700,70,25,95),E('잔광 하운드','녹',700,70,25,95)],
  pre:`[새벽등대 사무소]
프롤로그 다음 날 아침. 사무소에는 커피 냄새와 서류 더미가 가득하다.
이브: 좋은 아침이에요, {관리관}. 잘 잤어요? …소파에서?
세라: 숙소 열쇠 안 줬잖아, 이브.
이브: 어머. 일부러 그런 건 아니에요. 아마도.
이브: 자, 첫 의뢰예요. 회색구 3번가에 잔광 하운드 두 마리. 시민회 의뢰고, 보수는… 짜요.
선택: 바로 출동하자 | 보수가 얼마나 짠데?
1) 세라: 의욕은 합격.
2) 이브: 우리 사무소 한 달 커피값 정도요. 그러니까 꼭 받아 와야 해요.
세라: 편성은 네가 해. 하운드는 녹 속성이야. 홍으로 치면 빨리 끝나.
[회색구 골목]
[효과: 흔들림]
빗속에서 녹색 빛을 흘리는 짐승 두 마리가 이빨을 드러낸다.`,
  post:`[회색구 골목]
하운드의 빛이 꺼지고, 골목에 다시 어둠이 내린다.
세라: …나쁘지 않은 지휘였어.
[새벽등대 사무소]
이브: 어머, 세라가 칭찬을 다 하네. 오늘은 축하해야겠어요.
이브: 그리고 {관리관}. 아까 대원들 성흔 수치 봤어요? 전투 중인데도 안정적이었어요.
이브: 보통은 싸울수록 흔들리는데. …당신, 정말 특이한 사람이네요.
세라: 이브.
이브: 네네, 나중에요. 오늘은 와인이나 마셔요.`},
 {id:'s12',title:'폐선로',reward:400,enemies:[E('잔광 하운드','녹',800,75,30,95),E('잔광 하운드','청',800,75,30,95),E('잔광 파수꾼','홍',1100,80,40,85)],
  pre:`[폐선로]
낙성 이후 멈춘 열차들이 녹슨 채 늘어서 있다.
카야: 으, 이런 데는 꼭 뭐가 숨어 있더라.
루나: 신호 잡혔어! 선로 끝에 잔광 반응 셋! 그리고… 이상한 전파 하나.
선택: 이상한 전파? | 일단 잔광부터
1) 루나: 군용 암호야. 민간 거 아냐. 끝나고 뜯어볼게.
2) 루나: 오케이~ 지휘관님 말씀대로!
카야: 관리관, 내 뒤에 있어. 오늘 방패 새로 칠했거든. 긁히면 네가 다시 칠해 줘.
루나: 카야 언니 뒤에 서면 안전하긴 한데 시야가 0이야. 엉덩이밖에 안 보여.
카야: 루나!!
[효과: 흔들림]
녹슨 객차 지붕 위로 빛의 파수꾼이 몸을 일으킨다.`,
  post:`[폐선로]
루나: 전파 출처 찾았다! 저 객차 안!
[소품: 헬릭스 상자]
카야: 이거… 헬릭스 로고잖아?
루나: 안에 든 건 성핵 샘플이야. 그것도 잔광으로 변하기 직전의 것.
[소품 끝]
선택: 헬릭스가 잔광을 키우고 있다? | 일단 사무소로 가져가자
1) 루나: 그렇게밖에 안 보이지? 기업이 괴물 농장이라니, 영화 같네.
2) 카야: 내가 들게! …무거워. 루나 너도 들어.
세라: (무전) …헬릭스. 하필 또.`},
 {id:'s13',title:'헬릭스의 그림자',reward:500,enemies:[E('헬릭스 경비병','청',1200,90,55,90),E('헬릭스 경비병','청',1200,90,55,90),E('헬릭스 감시드론','녹',700,100,30,120)],
  pre:`[헬릭스 물류창고]
상자의 출고 기록을 따라 도착한 곳은 헬릭스의 하청 물류창고.
미호: 문 앞 경비병들, 표정 보니 패가 안 좋네요.
오델: 정면 돌파는 규정 위반입니다만.
미호: 그럼 뒷문? 열쇠 있는데요. 경비 반장이 카드빚이 좀 있어서.
오델: ……그것도 규정 위반입니다.
선택: 정면으로 간다 | 뒷문으로 간다
1) 오델: 승인합니다. 원칙적으로.
2) 미호: 현명하시네요. 그런데 어쩌죠, 들켰어요.
[효과: 플래시]
경보가 울리고 붉은 조명이 창고를 뒤덮는다.`,
  post:`[헬릭스 물류창고]
지아: …이 드론, 분해해 봤어요.
[소품: 성핵 추적 장치]
지아: 성핵 추적 장치예요. 잔광이 아니라, 성흔자를 찾는 거.
이브: (통신) 누군가 성흔자를 찾고 있다는 뜻이네요.
세라: 아니면 사냥하고 있거나.
[소품 끝]
세라: …이 드론 형번, 내가 있던 부대 거야. 바넷 소장의 부대.
선택: 바넷이 누구야? | 괜찮아?
1) 세라: 내 옛 상관. 그리고 내가 회사를 떠난 이유.
2) 세라: …괜찮아. 지금은 아니어도, 괜찮아질 거야.`},
 {id:'s14',title:'붉은 잔광',reward:800,enemies:[E('적색 잔광체','홍',5200,125,60,85,true),E('잔광 하운드','녹',800,75,30,95)],
  pre:`[낙성 분화구]
[효과: 흔들림]
하늘이 붉게 물든다. 분화구 중심에서 거대한 빛의 형체가 몸을 일으킨다.
한나: 저, 저게 뭐예요…!
???: 오랜만이군, 세라 바이스.
분화구 가장자리, 헬릭스의 검은 제복을 입은 남자가 서 있다.
바넷: 그리고 그쪽이 새 관리관인가. 낙성의 밤의 유일한 생존자.
바넷: 성핵과 공명하는 체질. 회사가 20년 동안 찾던 물건이지.
세라: 이 사람한테 손대면 너부터 쏜다.
바넷: 그럼 이것부터 처리해 보도록.
[효과: 플래시]
붉은 잔광체가 포효한다.
관리관: 전원, 전투 준비.`,
  post:`[낙성 분화구]
거대한 잔광이 무너지며 별가루처럼 흩어진다.
바넷의 모습은 이미 사라지고 없다.
이브: 다들 무사해요? …다행이다.
세라: {관리관}. 아까 그 말, 들었지.
선택: 내가 생존자라는 거? | 나는 기억이 없어
1) 세라: 응. 그리고 헬릭스는 널 원해.
2) 세라: 기억이 없어도 상관없어. 이제 네 곁엔 우리가 있으니까.
[새벽등대 사무소]
[효과: 암전]
그날 밤, 사무소의 불은 늦게까지 꺼지지 않았다.
1장 끝. 설정 탭의 AI 창작실에서 다음 장을 이어 쓸 수 있습니다.`}
]}];
const DEFAULT_THREADS = [
 TH('t_eve1','eve','첫 출동 수고했어요',{type:'clear',value:'s11'},false,`이브: 첫 출동 수고했어요, 관리관님
이브: 다친 데 없죠? 있으면 의무실로 오세요. 진찰해 줄게요
선택: 멀쩡해 | 사실 좀 아파
1) 이브: 아쉽네~ 핑계 하나 날아갔다
2) 이브: 어디가요? 사진 보내 봐요
2) 이브: …농담이에요. 직접 와요. 문 잠가 둘게요 🩺
이브: 그리고 세라가 칭찬했어요. 그 애가 칭찬하는 거 1년에 한 번 볼까 말까예요
이브: 오늘 밤 사무소에서 와인 한 잔 해요. 둘이서만 🍷`),
 TH('t_luna1','luna','모르는 번호',{type:'start'},true,`루나: 안녕~ 새 관리관 맞지?
루나: 번호 어떻게 알았냐고? 비밀~
선택: 해킹했지 | 누구세요
1) 루나: 들켰다 ㅋㅋ 근데 이 정도는 인사야
2) 루나: 섭섭하네~ 방금 계약한 루나잖아!
루나: 아 그리고 관리관 폰 갤러리 봤어
루나: 취향… 의외로 건전하네? 실망~
나: 그걸 왜 봐
루나: 보안 점검이지 ㅋㅋㅋ
[사진: 뭉치]
루나: 지아가 보여주래. 얘 이름 뭉치래`),
 TH('t_sera1','sera','커피',{type:'aff',value:2},true,`세라: 사무소 커피머신 고장 났어
세라: 지아가 고치는 중
선택: 내가 사 갈게 | 참아
1) 세라: …진하게. 시럽 빼고.
1) 세라: 그리고 고마워. 이건 못 들은 걸로 해.
2) 세라: 넌 오늘 회색구 순찰 혼자 가라.
2) 세라: 농담이야. 반쯤.`),
 TH('t_kaya1','kaya','고기!!!',{type:'clear',value:'s12'},true,`카야: 관리관!!! 고기!!!
카야: 아니 그게 아니라 오늘 작전 끝났으니까 고기
선택: 가자 | 다음에
1) 카야: 역시 내 관리관! 3인분… 아니 6인분 예약한다
2) 카야: …… (방패 내려놓는 소리)
2) 카야: 알았어… 다음에 꼭이다? 약속!`),
 TH('t_miho1','miho','VIP룸 초대권',{type:'clear',value:'s13'},true,`미호: 관리관님, 오늘 밤 시간 있어요?
미호: 카지노 VIP룸 초대권이 생겼거든요
미호: 드레스 코드는… 제가 골라 드릴게요. 치수는 대충 알아요
선택: 좋아 | 치수를 왜 알아
1) 미호: 후후, 판돈은 이미 걸렸어요. 당신으로.
2) 미호: 딜러는 손님 몸가짐부터 보거든요. 직업병이에요 ♠
미호: 아, 이건 비밀이에요. 루나한테 들키면 해킹당하니까`)
];
const LKEY=System.pjKey(Core.PJ().active);
 {const r=appStorage.getItem(LKEY);G=Characters.fix(r?JSON.parse(r):Core.defaults());}
addEventListener('pagehide',Misc.flushNow);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')Misc.flushNow();},true);
/* ── 0080-storage-integration.js에서 ── */
addEventListener('ggm-storage-error',e=>SystemView.storageWarning(e.detail.message));
addEventListener('ggm-saved',SystemView.storageWarningClear);
// Capturing guard also covers enhancement buttons installed by combat modules.
document.addEventListener('click',e=>{if(!appStorage.failed&&!document.getElementById('save-warning'))return;const a=e.target.closest('[data-act]')?.dataset.act;if(/^(pull|upgo|cheat|cheat2|skbbuy|cashpkg|v2train|v2training|v2gearunlock)/.test(a||'')){e.preventDefault();e.stopImmediatePropagation();SystemView.storageWarning('저장을 먼저 복구한 뒤 뽑기·강화를 진행해 주세요.');}},true);
// Begin persistence immediately after synchronous button actions, rather than waiting for app exit.
document.addEventListener('click',()=>{queueMicrotask(()=>{if(dirty.size&&!window.__NOFLUSH)Core.flush().catch(()=>{});});});
const IMGNS=Core.PJ().active==='main'?'':Core.PJ().active+'::';
document.addEventListener('error',event=>{const img=event.target;if(!img?.matches?.('.au-art img[data-battle-name]'))return;const label=document.createElement('div');label.className='art v2-art-name';label.setAttribute('role','img');label.setAttribute('aria-label',img.dataset.battleName+' · 일러스트 없음');label.textContent=img.dataset.battleName;img.replaceWith(label);},true);
document.addEventListener('DOMContentLoaded',()=>{});
(function(){ const i=document.createElement('input'); i.type='file'; i.id='filesm'; i.accept='image/*'; i.multiple=true; i.hidden=true; document.body.appendChild(i);
  i.addEventListener('change',async e=>{ const fs=[...e.target.files]; e.target.value=''; if(!fs.length||!uploadFor||uploadFor.kind!=='faces') return; const c=charById(uploadFor.id); if(!c) return; let n=0;
    for(const f of fs){ const nm=f.name.replace(/\.[^.]+$/,'').trim().slice(0,12); if(!nm) continue; try{ await Core.addFaceFile(c,nm,f); n++; }catch(err){ Core.quietErr(err,'0080-storage-integration.js:148'); } }
    CharactersView.openFaces(c.id); CoreView.toast(`표정 ${n}개를 넣었어요`); }); })();
document.getElementById('afile').addEventListener('change',async e=>{
  const f=e.target.files[0]; e.target.value=''; const l=libById(uploadAudioFor); if(!f||!l) return;
  try{ await Art.storeAudio(l,f); CoreView.toast(`「${l.name}」 음악을 등록했어요`); ArtView.bgm(l.name,true); CharactersView.openLibItem(l.id); }catch(err){ CoreView.toast('음악 파일을 저장하지 못했어요'); }
});
$('#file').addEventListener('change',async e=>{
  const f=e.target.files[0]; e.target.value=''; if(!f||!uploadFor) return;
  if(uploadFor.kind==='avatar'){ try{ await Art.storeImage(Core.progSlot('avatar'),await Core.shrink(f,1200),''); Core.mark('prog'); PlayerView.refreshPlayerForm(); CoreView.toast('프로필 그림을 등록했어요'); }catch(err){ CoreView.toast('이미지를 올리지 못했어요'); } return; }
  if(uploadFor.kind==='skinpart'){ const c=charById(uploadFor.id), k=c&&(c.skins||[]).find(x=>x.id===uploadFor.s); if(!k) return; const x=uploadFor.x; CoreView.toast('그림을 등록하는 중이에요');
    try{ let ub=await Core.shrink(f,2200); if(x==='stand'||x==='upper'){ try{ const ai=await System.alphaInfo(ub); if(ai.border<0.5) ub=await Core.cutoutWhite(ub); }catch(e){ Core.quietErr(e,'0080-storage-integration.js:158'); } } await Art.storeImage(x==='stand'?k:Characters.skinPart(k,x),ub,''); Core.mark('c:'+c.id); Challenge.render(); CharactersCtl.skinRefresh(c.id); CoreView.toast(`${k.name} ${x==='stand'?'스탠딩':SKP[x]}을(를) 등록했어요`); }catch(err){ CoreView.toast('이미지를 올리지 못했어요'); } return; }
  if(uploadFor.kind==='pthumb'){ try{ const d=await Misc.thumbData(f), id=uploadFor.id, up=Core.userPacks(), mine=up.find(x=>x.id===id); if(mine){ mine.thumb=d; Core.saveUserPacks(up); } else { const m=Art.pthumbs(); m[id]=d; appStorage.setItem(PTHUMB,JSON.stringify(m)); } if($('#modal .ep [data-act="packuse"]')) CoreView.openModal(ArtView.packHTML()); CoreView.toast('썸네일을 넣었어요'); }catch(err){ CoreView.toast('썸네일을 넣지 못했어요'); } return; }
  if(uploadFor.kind==='shk'){ try{ let ub=await Core.shrink(f,2200); try{ const ai=await System.alphaInfo(ub); if(ai.border<0.5) ub=await Core.cutoutWhite(ub); }catch(e){ Core.quietErr(e,'0080-storage-integration.js:160'); } const o=Economy.shkSelf(); await Art.storeImage(o,ub,''); G.meta.shop.charId='__self'; Core.mark('meta'); SHOP_LINE=''; const pv=document.querySelector('.sk-prev'); if(pv) pv.innerHTML=`<img src="${esc(Characters.imgSrc(o))}" alt="">`; if($('#sk_char')) $('#sk_char').value='__self'; Challenge.render(); CoreView.toast('상점 주인 그림을 올렸어요'); }catch(err){ CoreView.toast('이미지를 올리지 못했어요'); } return; }
  if(uploadFor.kind==='npc'||uploadFor.kind==='npcup'){ const n=(G.npcs||[]).find(x=>x.id===uploadFor.id); if(!n) return; const up=uploadFor.kind==='npcup';
    try{ let ub=await Core.shrink(f,2200); try{ const ai=await System.alphaInfo(ub); if(ai.border<0.5) ub=await Core.cutoutWhite(ub); }catch(e){ Core.quietErr(e,'0080-storage-integration.js:162'); } if(up&&!n.upper) n.upper={id:'up_'+n.id,kind:'upper',name:n.name+' 상반신',prompt:'',img:null}; await Art.storeImage(up?n.upper:n,ub,up?'':'c:'); Core.mark('meta'); CharactersView.npcRefresh(n.id); CoreView.toast(`${n.name} ${up?'상반신':'스탠딩'}을(를) 올렸어요`); }catch(err){ CoreView.toast('이미지를 올리지 못했어요'); } return; }
  if(uploadFor.kind==='scimg'){ /* 스토리 편집: 올린 그림을 CG로 저장하고 대본의 커서 자리에 [CG: 이름] … [CG 끝]을 넣어요 */
    const ta=$('#'+uploadFor.ta); if(!ta) return; CoreView.toast('그림을 넣는 중이에요');
    try{ let k=G.lib.filter(l=>l.kind==='cg'&&/^삽화 \d+$/.test(l.name)).length+1; while(G.lib.some(l=>l.name==='삽화 '+k)) k++;
      const l={id:'l'+uid(),kind:'cg',name:'삽화 '+k,prompt:'',cast:[],img:null}; await Art.storeImage(l,await Core.shrink(f,2200),'l:'); G.lib.push(l); Core.mark('l:'+l.id);
      const pos=Math.min(uploadFor.pos==null?ta.value.length:uploadFor.pos,ta.value.length), v=ta.value, pre=v.slice(0,pos), post=v.slice(pos);
      const ins=(pre&&!pre.endsWith('\n')?'\n':'')+`[CG: ${l.name}]\n…\n[CG 끝]`+(post&&!post.startsWith('\n')?'\n':'');
      ta.value=pre+ins+post; ta.focus({preventScroll:true}); try{ ta.setSelectionRange(pos+ins.length,pos+ins.length); }catch(e){} CoreView.toast(`「${l.name}」을(를) 넣었어요. 저장을 눌러야 반영돼요`); }
    catch(err){ CoreView.toast('이미지를 넣지 못했어요'); } return; }
  if(uploadFor.kind==='face'){ const c=charById(uploadFor.id); if(!c) return; try{ await Core.addFaceFile(c,uploadFor.name,f,uploadFor.b); CharactersView.openFaces(c.id); CoreView.toast(`표정 「${uploadFor.name}」${uploadFor.b==='up'?' 상반신':''}을(를) 넣었어요`); }catch(err){ CoreView.toast('이미지를 올리지 못했어요'); } return; }
  if(uploadFor.kind==='weapon'){ const c=charById(uploadFor.id); if(!c||!c.weapon) return; CoreView.toast('그림을 등록하는 중이에요'); try{ let ub=await Core.shrink(f,2000); try{ const ai=await System.alphaInfo(ub); if(ai.border<0.5) ub=await Core.cutoutWhite(ub); }catch(e){ Core.quietErr(e,'0080-storage-integration.js:172'); } await Art.storeImage(c.weapon,ub,''); Core.mark('c:'+c.id); Challenge.render(); CharactersCtl.openChar(c.id); CoreView.toast(System.T('weapon')+' 이미지를 등록했어요'); }catch(err){ CoreView.toast('이미지를 올리지 못했어요'); } return; }
  if(ILK(uploadFor.kind)||uploadFor.kind==='upper'||uploadFor.kind==='pose'||uploadFor.kind==='lbbg'||uploadFor.kind==='scg'){ const c=charById(uploadFor.id); if(!c) return; if(uploadFor.kind==='scg') Characters.scgSlot(c); CoreView.toast('그림을 등록하는 중이에요'); try{ let ub=await Core.shrink(f,2200); if(uploadFor.kind==='pose'){ try{ const ai=await System.alphaInfo(ub); if(ai.border<0.5) ub=await Core.cutoutWhite(ub); }catch(e){ Core.quietErr(e,'0080-storage-integration.js:173'); } } await Art.storeImage(c[uploadFor.kind],ub,''); Core.mark('c:'+c.id); Challenge.render(); CharactersCtl.openChar(c.id); CoreView.toast(uploadFor.kind==='upper'?'상반신을 등록했어요':'일러스트를 등록했어요'); }catch(err){ CoreView.toast('이미지를 올리지 못했어요'); } return; }
  const o=uploadFor.kind==='char'?charById(uploadFor.id):libById(uploadFor.id); if(!o) return;
  CoreView.toast('이미지를 등록하는 중이에요');
  const blob=await Core.shrink(f,uploadFor.kind==='char'?1800:2000);
  try{
    await Art.storeImage(o,blob,uploadFor.kind==='char'?'c:':'l:'); Challenge.render();
    if(uploadFor.kind==='char') CharactersCtl.openChar(o.id); else CharactersView.openLibItem(o.id);
    CoreView.toast(`${o.name} 이미지를 등록했어요`);
  }catch(err){ CoreView.toast('이미지를 올리지 못했어요. 더 작은 파일로 다시 시도해 주세요.'); }
});
document.addEventListener('click',e=>{const el=e.target.closest('[data-act]');if(!el)return;const kind=el.dataset.kind;if(el.dataset.act==='backup-save')SystemView.openBackupChoice(kind);if(el.dataset.act==='backup-load'){BACKUP_IMPORT_KIND=kind;document.getElementById('durable-backup-file').click();}if(el.dataset.act==='backup-start'){const dest=document.getElementById('backup-dest').value,voices=!!document.getElementById('backup-voices')?.checked;CoreView.closeModal();SystemView.backupExport(kind,dest,voices);}});
document.getElementById('durable-backup-file').addEventListener('change',e=>{const f=e.target.files[0],kind=BACKUP_IMPORT_KIND;e.target.value='';if(f)Art.backupImport(f,kind);});
/* zip: 압축 없이 저장(stored) · UTF-8 이름. 읽기는 stored와 deflate(브라우저 DecompressionStream) 둘 다.
   ponytail: zip64 없음 → 파일 하나·전체 4GB, 항목 65535개까지 */
const CRC_T=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
document.addEventListener('click',e=>{const el=e.target.closest('[data-act]');if(!el)return;
 if(el.dataset.act==='data-save')SystemView.dataExport();
 if(el.dataset.act==='data-load'){const i=document.createElement('input');i.type='file';i.accept='.zip,application/zip';i.onchange=()=>{if(i.files[0])SystemCtl.dataImport(i.files[0]);};i.click();}});
document.addEventListener('click',e=>{ const el=e.target.closest('[data-act="inhreset"]'); if(!el) return; const c=charById(el.dataset.id); if(!c) return; Characters.inheritReset(c,el.dataset.k); CoreView.toast(el.dataset.k==='*'?'모든 항목이 원본을 따라요':`${Characters.inheritLabel(el.dataset.k)}: 원본 값으로 되돌렸어요`); if(typeof Challenge.render==='function') Challenge.render(); if(typeof CoreView.closeModal==='function'&&!$('#modal').hidden){ const id=c.id; CoreView.closeModal(); if(typeof CharactersCtl.openChar==='function') CharactersCtl.openChar(id); } });
setInterval(()=>{ try{ if(typeof G!=='undefined'&&G){ System.progTick(); EconomyView.updStam(); } }catch(e){} },30000);
(()=>{ let sx=0,sy=0,st=0,el=null;
  const down=(x,y,t)=>{ el=t&&t.closest&&t.closest('[data-swipe]'); sx=x; sy=y; st=Date.now(); };
  const up=(x,y)=>{ if(!el) return; const dx=x-sx, dy=y-sy; const e2=el; el=null; if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.4&&Date.now()-st<900){ window.__SWIPED=Date.now(); if(e2.dataset.swipe==='banner') Acquire.bannerStep(dx<0?1:-1); } };
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
addEventListener('resize',()=>{ clearTimeout(window.__fitT); window.__fitT=setTimeout(EconomyView.fitLobby,120); });
document.addEventListener('change',e=>{ if(e.target.id==='ps_tpl'&&PROFILE_TPLS[e.target.value]) $('#ps_tplf').value=PROFILE_TPLS[e.target.value].join(', '); });
document.addEventListener('click',async e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act, c=el.dataset.id&&charById(el.dataset.id);
  if(a==='psedit'&&c) CharactersView.openPersona(c.id);
  else if(a==='pssave'&&c){ Characters.personaSave(c); CoreView.closeModal(); CoreView.toast('개성을 저장했어요'); if(typeof CharactersCtl.openChar==='function') CharactersCtl.openChar(c.id); }
  else if(a==='psai'&&c){ if(!SAMPLE){ CoreView.toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; } Core.auditSnap([c],'개성 '+(el.dataset.k==='improve'?'다듬기':'채우기')); if(await Characters.personaAI(c,el.dataset.k,{lines:el.dataset.k==='improve',btn:el})){ CoreView.toast('개성을 반영했어요 (점검 화면에서 되돌리기 가능)'); psReopen(c); } }
  else if(a==='psreview'&&c){ if(!SAMPLE){ CoreView.toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; } if(await Misc.personaAIReview(c,CoreView.uiProg(el))) psReopen(c); }
  else if(a==='pstalk'&&c){ if(!SAMPLE){ CoreView.toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; } const n=await Characters.talkAffGen(c,CoreView.uiProg(el)); if(n){ CoreView.toast(`인연 톡 ${n}개를 만들었어요`); psReopen(c); } }
  else if(a==='psmemo'&&c){ if(!SAMPLE){ CoreView.toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; } if(await Characters.memorialGen(c,CoreView.uiProg(el))){ CoreView.toast('메모리얼을 만들었어요'); psReopen(c); } }
  else if(a==='psmemoplay'&&c&&c.memorial){ CoreView.closeModal(); SystemView.playStory(c.memorial.title,c.memorial.script); }
  else if(a==='psmemolobby'&&c){ const p=P(); p.memoOn=p.memoOn||{}; p.memoOn[c.id]=!p.memoOn[c.id]; Core.mark('prog'); CoreView.toast(p.memoOn[c.id]?'메모리얼 로비를 켰어요. 로비에서 메모리얼 대사가 나와요':'메모리얼 로비를 껐어요'); psReopen(c); }
  else if(a==='psopen') CharactersView.openPersonaAll();
  else if(a==='pscfg'){ Characters.personaCfgSave(); CoreView.toast('개성 설정을 저장했어요'); CharactersView.openPersonaAll(); }
  else if(a==='psbatch') CharactersCtl.personaBatch(el.dataset.k);
  else if(a==='psstop'){ if(PS_JOB) PS_JOB.stop=true; }
  else if(a==='psundo'){ CharactersCtl.auditUndo(); CharactersView.openPersonaAll(); } });
(function(){ const i=document.createElement('input'); i.type='file'; i.id='chatfile'; i.accept='image/*'; i.hidden=true; document.body.appendChild(i);
  i.addEventListener('change',e=>{ const f=e.target.files[0]; e.target.value=''; NewGameCtl.chatPhotoPick(f); }); })();
document.addEventListener('keydown',e=>{ if(e.target&&e.target.id==='fcIn'&&e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); if(e.isComposing||e.keyCode===229) return; Core.fcSend(); } });
document.addEventListener('input',e=>{ if(e.target&&e.target.id==='fcIn'){ const t=e.target; t.style.height='auto'; t.style.height=Math.min(120,t.scrollHeight)+'px'; } });
// 휴대폰 키보드·주소창 때문에 입력칸이 가려지지 않게, 보이는 화면 높이에 맞춰요
(function(){ const vv=window.visualViewport; if(!vv) return; const fit=()=>{ const ph=document.getElementById('phone'); if(!ph||ph.hidden) return; ph.style.top=vv.offsetTop+'px'; ph.style.height=vv.height+'px'; ph.style.bottom='auto'; const el=document.getElementById('phChat'); if(el&&document.activeElement&&document.activeElement.id==='fcIn') el.scrollTop=el.scrollHeight; };
  vv.addEventListener('resize',fit); vv.addEventListener('scroll',fit); new MutationObserver(fit).observe(document.getElementById('phone'),{attributes:true,attributeFilter:['hidden']}); })();
document.addEventListener('click',e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act;
  if(a==='towergo') ChallengeCtl.towerGo(el.dataset.v);
  else if(a==='towerstart'){ const c=FORM&&FORM.ctx; if(!c||c.kind!=='tower') return; P().squad=[...squadSel]; Core.mark('prog'); CoreView.closeModal(); SystemView.startStage(FORM.stage,{kind:'tower',tid:c.tid,floor:c.floor,allow:c.allow}); } });
document.addEventListener('click',e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act;
  if(a==='mdgo'){ const ch=G.chapters.find(x=>x.id===el.dataset.ch), s=ch&&ch.stages.find(x=>x.id===el.dataset.st); if(!s) return; const sel=[...document.querySelectorAll('#modal [data-mdsel]')].filter(x=>x.checked).map(x=>x.dataset.mdsel); if(sel.length){ P().squad=sel.slice(0,s.mode==='contest'?3:4); Core.mark('prog'); } CoreView.closeModal(); const go=()=>s.mode==='debate'?BattleView.debateStart(ch,s):BattleView.contestStart(ch,s); if(!P().cleared[s.id]&&s.pre) SystemView.playStory(s.title,s.pre,go); else go(); }
  else if(!MD) return;
  else if(a==='dbnav'){ const R=MD.s.debate.rounds[MD.r]; MD.i=Math.max(0,Math.min(R.lines.length-1,MD.i+(+el.dataset.v))); BattleView.debateDraw(); }
  else if(a==='dbpress'){ const L=MD.s.debate.rounds[MD.r].lines[MD.i]; MD.pressed[MD.i]=1; BattleView.debateDraw(L.press?`${MD.s.debate.opponent}: ${L.press}`:'더 이상 나오는 말이 없어요'); }
  else if(a==='dbshow'){ const L=MD.s.debate.rounds[MD.r].lines[MD.i], ev=MD.s.debate.evidence.find(x=>x.id===el.dataset.v); if(L.weak&&L.weak===el.dataset.v) BattleCtl.debateHit(`「${ev.name}」을(를) 제시 — "${L.text}"의 모순을 밝혀냈다!`); else CoreCtl.debateMiss(`「${ev?ev.name:''}」은(는) 이 말과 맞지 않아요. 신뢰도 −1`); }
  else if(a==='dbpers'){ const L=MD.s.debate.rounds[MD.r].lines[MD.i], c=charById(el.dataset.v); if(L.persuade&&c&&(c.name===L.persuade.who||ROLE[c.role]===L.persuade.who||c.faction===L.persuade.who)) BattleCtl.debateHit(`${c.name}: ${L.persuade.text||'제 말을 들어 주세요.'}`); else CoreCtl.debateMiss(`${c?c.name:''}의 말은 이 대목에서 통하지 않았어요. 신뢰도 −1`); }
  else if(a==='ctap') BattleCtl.contestAppeal(el.dataset.c,el.dataset.k);
  else if(a==='dbquit'){ MD=null; CoreView.closeModal(); } });
document.addEventListener('change',e=>{ const id=e.target.dataset&&e.target.dataset.mdsel; if(id) e.target.closest('label').classList.toggle('on',e.target.checked); });
document.addEventListener('click',async e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act;
  if(a==='scvisit') LiveOps.schedVisit(el.dataset.s,el.dataset.c);
  else if(a==='scauto'){ LiveOps.spotsAuto(); Challenge.render(); }
  else if(a==='scai'){ if(!SAMPLE){ CoreView.toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; } if(await LiveOps.spotsAI(CoreView.uiProg(el))){ CoreView.toast('장소를 정했어요'); Challenge.render(); } }
  else if(a==='sctalkall'){ if(!SAMPLE){ CoreView.toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; } const L=G.chars.filter(c=>Characters.own(c.id)&&!c.alt&&LiveOps.spots().some(s=>!(c.spotTalk||{})[s.id])); let n=0; for(const c of L){ SystemView.syBar(`일정 장면 ${n+1}/${L.length}`); if(await LiveOps.spotTalkAI(c)) n++; } SystemView.syBar(''); CoreView.toast(`${n}명의 일정 장면을 만들었어요`); Challenge.render(); } });
setInterval(()=>{ if(BGJOBS.length) CoreView.bgJobsDraw(); },1000);
const AUDIT_RULES=[
 {id:'c_profile',scope:'char',kind:'missing',since:1,label:'프로필이 비었거나 너무 짧아요',test:c=>String(c.profile||'').trim().length<40,fix:{mode:'ai',fields:['profile']}},
 {id:'c_lines',scope:'char',kind:'missing',since:1,label:'평소 대사가 3개 미만이에요',test:c=>auditStrs(c.lines).length<3,fix:{mode:'ai',fields:['lines']}},
 {id:'c_touch',scope:'char',kind:'missing',since:1,label:'터치 반응 대사가 없어요',test:c=>!auditStrs(c.touch?.head).length||!auditStrs(c.touch?.body).length,fix:{mode:'ai',fields:['touch']}},
 {id:'c_aff',scope:'char',kind:'missing',since:1,label:'호감도 대사가 없어요',test:c=>!Object.values(c.affLines||{}).some(v=>auditStrs(v).length),fix:{mode:'ai',fields:['affLines']}},
 {id:'c_intro',scope:'char',kind:'missing',since:1,label:'첫 대사가 없어요',test:c=>!String(c.intro||'').trim(),fix:{mode:'ai',fields:['intro']}},
 {id:'c_look',scope:'char',kind:'missing',since:1,label:'외모 태그(그림 프롬프트)가 없어요',test:c=>!String(c.naiPrompt||'').trim(),fix:{mode:'ai',fields:['naiPrompt']}},
 {id:'c_age',scope:'char',kind:'missing',since:1,label:'외모 태그에 나이 태그가 남아 있어요(예전 생성물)',test:c=>Core.tagList(c.naiPrompt).some(t=>AGE_TAGS.test(Core.tagKey(t))),fix:{mode:'auto',run:c=>{ c.naiPrompt=Core.stripAge(c.naiPrompt); }}},
 {id:'c_minor',scope:'char',kind:'missing',since:1,label:'외모 태그에 허용되지 않는 태그가 있어요',test:c=>Core.tagList(c.naiPrompt).some(t=>MINOR_TAGS.test(Core.tagKey(t))),fix:{mode:'auto',run:c=>{ c.naiPrompt=Core.tagList(c.naiPrompt).filter(t=>!MINOR_TAGS.test(Core.tagKey(t))).join(', '); }}},
 {id:'c_weapon',scope:'char',kind:'missing',since:1,label:`${System.T('weapon')} 그림 프롬프트가 잘못됐거나 없어요`,test:c=>!!c.weapon&&!!c.weapon.name&&(!c.weapon.prompt||Characters.wpBad(c.weapon.prompt)),fix:{mode:'weapon'}},
 {id:'c_skills',scope:'char',kind:'upgrade',since:2,label:'스킬이 지금 전투 규칙(밸런스 검사)과 맞지 않아요',test:c=>!c.skills||c.skills.version!==2||!c.skillBalance||c.skillBalance.ruleset!==GGMCombat.RULESET,fix:{mode:'skills'}},
 {id:'c_symbol',scope:'char',kind:'upgrade',since:2,label:'상징 컬러·아이템이 정해지지 않았어요(바리에이션 디자인에 쓰여요)',test:c=>!c.alt&&(!c.symColor||!c.symItem)&&!!(GGMConstruct.symbolColor(c)||GGMConstruct.symbolItem(c)),fix:{mode:'auto',run:c=>{ c.symColor=c.symColor||GGMConstruct.symbolColor(c)||''; c.symItem=c.symItem||GGMConstruct.symbolItem(c)||''; }}},
 {id:'c_old',scope:'char',kind:'upgrade',since:3,label:'구버전 생성기로 만든 캐릭터예요(새 규칙으로 일부 다시 만들 수 있어요)',test:c=>!c.alt&&(+c.genVer||0)<LiveOps.auditGenVer()&&!DEFAULT_CHARS.some(d=>d.id===c.id),fix:{mode:'open',stamp:true}},
 {id:'c_img',scope:'char',kind:'missing',since:1,label:'그림(스탠딩·상반신·일러스트·무기)이 아직 없어요',test:c=>Art.drawTodo(auditImgCats).some(it=>it.c===c),fix:{mode:'image'}},
 {id:'s_script',scope:'stage',kind:'missing',since:1,label:'스테이지 대본(전투 전 장면)이 비었어요',test:s=>!String(s.pre||'').trim(),fix:{mode:'ai-stage'}},
 {id:'c_pos',scope:'char',kind:'upgrade',since:3,label:'포지션이 정해지지 않았어요(전투 기본형에 맞는 포지션으로 배정)',test:c=>!c.alt&&!Rules.posById(c.pos),fix:{mode:'auto',run:c=>{ Characters.posAssign(c,c.pos); }}},
 {id:'c_statband',scope:'char',kind:'upgrade',since:3,label:'능력치가 희귀도·기본형 기준에서 많이 벗어났어요(AI 생성 편차)',test:c=>!c.alt&&Rules.balInfo(c).statOut,fix:{mode:'auto',run:c=>{ Characters.balNormalize(c,'edge'); }}},
 {id:'c_genlag',scope:'char',kind:'upgrade',since:3,label:'출시 세대가 현재보다 많이 뒤처졌어요(구캐릭터 AS)',test:c=>!c.alt&&Rules.balInfo(c).genLag,fix:{mode:'skills-remaster'}},
 {id:'c_persona',scope:'char',kind:'missing',since:4,label:'개성 시트(성격·말투·반전 매력)가 없거나 비었어요',test:c=>!c.alt&&!((c.persona||{}).traits||[]).length,fix:{mode:'ai-persona',k:'fill'}},
 {id:'c_pfields',scope:'char',kind:'missing',since:9,label:'프로필 항목(생일·신장 등 게임의 프로필 틀)이 비었어요',test:c=>!c.alt&&((c.persona||{}).traits||[]).length>0&&!Object.keys(c.pfields||{}).length,fix:{mode:'ai-persona',k:'fill'}},
 {id:'c_persona_weak',scope:'char',kind:'upgrade',since:4,label:'개성 검수 점수가 낮아요(매력·차별성 부족)',test:c=>!c.alt&&((c.persona||{}).traits||[]).length>0&&Characters.personaReview(c).score<55,fix:{mode:'ai-persona',k:'improve'}},
 {id:'c_afftalk',scope:'char',kind:'missing',since:4,label:'호감도에 따라 열리는 인연 톡이 없어요',test:c=>!c.alt&&!affThreads(c).length,fix:{mode:'ai-afftalk'}},
 {id:'c_memorial',scope:'char',kind:'missing',since:4,label:'메모리얼(높은 호감도 특별 장면·로비 대사)이 없어요',test:c=>!c.alt&&!(c.memorial&&c.memorial.script),fix:{mode:'ai-memo'}},
 {id:'g_rules',scope:'game',kind:'upgrade',since:3,label:'속성·역할 설명이 없어요(게임 규칙·도감에 표시돼요)',test:()=>Rules.rulesMissingDesc(),fix:{mode:'ai-rules'}},
 {id:'g_pos',scope:'game',kind:'upgrade',since:9,label:'세계관에 맞춘 포지션이 없어요(기본 공격·방어·지원으로 돌아가요 — AI로 설계해 캐릭터에 배정)',test:()=>!(Array.isArray(G.meta.positions)&&G.meta.positions.length),fix:{mode:'ai-run',run:()=>Rules.posAI()}},
 {id:'g_codex',scope:'game',kind:'upgrade',since:3,label:'도감에 게임 규칙(상성·역할)이 기록되지 않았어요',test:()=>World.rulesNotInCodex(),fix:{mode:'auto',run:()=>{ RulesCtl.rulesCodex(); }}},
 {id:'w_stance',scope:'game',kind:'upgrade',since:10,label:'세력과 플레이어의 관계 변화(장별 태도)가 없어요(세력 종류 기본값으로만 돌아요 — 이미 쓴 장 이야기로 채워요)',test:()=>G.chapters.some(ch=>ch.kind==='main')&&World.factions().some(f=>f.kind!=='monster')&&World.factions().filter(f=>f.kind!=='monster').every(f=>!(f.stance||[]).length),fix:{mode:'ai-run',run:()=>World.stanceAI()}},
 {id:'w_faction',scope:'game',kind:'upgrade',since:8,label:'세력·몬스터 설정이 얕아요(종류·목적·관계·정체가 비어 있음)',test:()=>World.factionReview().score<70,fix:{mode:'ai-run',run:()=>World.factionAI()}},
 {id:'c_monster',scope:'char',kind:'missing',since:1,label:'몬스터로 보이는 캐릭터예요(톡·일정·인연 대상이 되면 안 돼요 → 적으로 전환)',test:c=>!c.monster&&!c.alt&&Art.isMonsterLike(c),fix:{mode:'auto',run:c=>World.charToMonster(c)}},
 {id:'c_debut',scope:'char',kind:'upgrade',since:8,label:'스토리 중간에 처음 나오는데 처음부터 뽑을 수 있는 캐릭터예요(첫 등장 스테이지 전엔 잠그기)',test:c=>!c.debut&&!Characters.own(c.id)&&!c.alt&&!c.monster&&!!Story.firstSpeak(c)&&Story.firstSpeak(c).k>0,fix:{mode:'auto',run:c=>{ const f=Story.firstSpeak(c); if(f){ c.debut=f.s.id; delete c.debutLater; } }}},
 {id:'c_range',scope:'char',kind:'upgrade',since:7,label:'사거리(근접·원거리·지원)가 정해지지 않았어요(무기·포지션으로 추정해 정해요)',test:c=>!c.npc&&!RANGE[c.range],fix:{mode:'auto',run:c=>{ c.range=Core.charRange(c); }}},
 {id:'s_direct',scope:'stage',kind:'upgrade',since:6,label:'대본에 연출(감정 아이콘·동작·화면 효과)이 없어요(AI로 대사는 그대로 두고 연출만 더해요)',test:s=>!s.dirV&&String((s.pre||'')+(s.post||'')).split('\n').length>=6&&System.dirCount((s.pre||'')+'\n'+(s.post||''))===0,fix:{mode:'ai-run',run:s=>Core.directStage(s)}},
 {id:'s_rules',scope:'stage',kind:'upgrade',since:5,label:'전장 규칙·별 조건이 없는 스테이지예요(예전 생성물)',test:s=>!s.story&&!s.farm&&(s.enemies||[]).length>0&&!s.rulesV,fix:{mode:'auto',run:s=>{ const ch=G.chapters.find(c=>(c.stages||[]).includes(s)), L=ch?ch.stages:[s]; Story.stageAutoRules(s,L.indexOf(s),L.length); }}},
 {id:'g_spots',scope:'game',kind:'upgrade',since:5,label:'일정(장소 방문) 장소가 없어요',test:()=>!LiveOps.spots().length,fix:{mode:'auto',ai:()=>LiveOps.spotsAI(),run:()=>{ LiveOps.spotsAuto(); }}},
 {id:'c_spot',scope:'char',kind:'upgrade',since:5,label:'일정 장소에서 만날 때의 장면이 없어요(기본 장면으로 나와요)',test:c=>!c.alt&&!c.npc&&LiveOps.spots().length>0&&LiveOps.spots().some(s=>!(c.spotTalk||{})[s.id]),fix:{mode:'ai-run',run:c=>LiveOps.spotTalkAI(c)}},
 {id:'l_imgperson',scope:'lib',kind:'missing',since:1,label:'배경·소품 그림 프롬프트에 사람 태그가 섞여 있어요(사람 그림이 돼요)',test:l=>!!IMG_NOHUMAN[l.kind]&&!!l.prompt&&PromptStudio.imgGuard(l.kind,l.prompt).removed.length>0,fix:{mode:'auto',run:l=>{ PromptStudio.plHit('img-person-'+l.kind,l.prompt); l.prompt=PromptStudio.imgGuard(l.kind,l.prompt).out; }}},
 {id:'l_img',scope:'lib',kind:'missing',since:1,label:'배경·소품·CG·적 그림이 아직 없어요',test:l=>Art.drawTodo(['bg','prop','cg','enemy']).some(it=>it.o===l),fix:{mode:'image'}}];
setTimeout(StoryView.auditNotice,6000);
document.addEventListener('click',e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act;
  if(a==='audopen') LiveOpsView.openAudit(el.dataset.id||null);
  else if(a==='audundo'){ CharactersCtl.auditUndo(); LiveOpsView.openAudit(AUDIT_FOCUS); }
  else if(a==='audstop'){ if(AUDIT_JOB) AUDIT_JOB.stop=true; }
  else if(a==='audfix'){ const r=AUDIT_RULES.find(x=>x.id===el.dataset.rule), g=r&&LiveOps.auditScan(AUDIT_FOCUS?(o=>o.id===AUDIT_FOCUS):null).find(x=>x.rule===r); if(!g) return;
    const pick=[...document.querySelectorAll(`[data-aud="${r.id}"]`)].filter(x=>x.checked).map(x=>g.items[+x.dataset.i]).filter(Boolean); if(!pick.length){ CoreView.toast('고칠 항목을 골라 주세요'); return; } LiveOpsCtl.auditFix(r,pick); }
  else if(a==='audconv'){ const cs=[...document.querySelectorAll('[data-audc]:checked')].map(x=>charById(x.dataset.audc)).filter(Boolean), fs=[...document.querySelectorAll('[data-audf]:checked')].map(x=>x.dataset.audf); LiveOpsCtl.auditConvert(cs,fs,($('#aud_ins')||{}).value||''); } });
const playGacha=noSkin(SystemView.playGacha0);
const revealCard=noSkin(MiscView.revealCard0);
const showCut=noSkin(MiscView.showCut0);
document.addEventListener('click',e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act;
  if(a==='conbuild') AcquireView.conBuild();
  else if(a==='conbuy') Acquire.conBuy(el.dataset.k);
  else if(a==='conpreset'){ const v=el.dataset.v.split(',').map(Number); v.forEach((x,i)=>{ const n=$('#con_'+i), r=$('#con_r'+i); if(n) n.value=x; if(r) r.value=x; }); const info=$('#conInfo'); if(info) info.innerHTML=AcquireView.conInfoHTML(GGMConstruct.normalize(v,Acquire.CON())); Core.progSlot('cbuild').input=GGMConstruct.normalize(v,Acquire.CON()); }
  else if(a==='contoggle'){ if(Acquire.conOn()){ G.meta.construct.on=false; Core.mark('meta'); Challenge.render(); } else AcquireView.openConSet(); }
  else if(a==='conset') AcquireView.openConSet();
  else if(a==='consave') Acquire.conSave();
  else if(a==='convadd'){ CONV=[...AcquireView.conReadVariants(),{id:'v_'+uid(),name:'새 바리에이션',prompt:'',brief:'',chance:30,recipe:{min:[200,200,200,400]},rarity:'same',on:true,cond:{}}]; $('#con_vars').innerHTML=CONV.map(AcquireView.conVariantRow).join(''); }
  else if(a==='convdel'){ CONV=AcquireView.conReadVariants(); CONV.splice(+el.dataset.i,1); $('#con_vars').innerHTML=CONV.map(AcquireView.conVariantRow).join(''); } });
document.addEventListener('input',e=>{ const i=e.target.dataset&&e.target.dataset.con; if(i==null) return; const v=e.target.value; const el=$('#con_'+i), r=$('#con_r'+i); if(el&&el!==e.target) el.value=v; if(r&&r!==e.target) r.value=v;
  const input=GGMConstruct.normalize(AcquireView.conReadInput(),Acquire.CON()), info=$('#conInfo'); if(info) info.innerHTML=AcquireView.conInfoHTML(input); Core.progSlot('cbuild').input=input; });
const contractHTML=noSkin(AcquireView.contractHTML0);
addEventListener('resize',()=>{ clearTimeout(window.__fbT); window.__fbT=setTimeout(SystemView.fitBrand,150); });
window.addEventListener('resize',()=>{ clearTimeout(window.__dk); window.__dk=setTimeout(SystemView.applyDesk,150); });
document.addEventListener('keydown',e=>{
  const tg=e.target, typing=tg&&(/^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName)||tg.isContentEditable); if(typing||e.ctrlKey||e.metaKey||e.altKey) return;
  const modalOpen=!$('#modal').hidden, phoneOpen=!$('#phone').hidden, ov=$('#ov');
  if(e.key==='Escape'){ if(modalOpen){ window.navBack(); e.preventDefault(); e.stopImmediatePropagation(); } else if(phoneOpen){ CoreView.closePhone(); e.preventDefault(); } return; }
  if(modalOpen||phoneOpen) return;
  if(!ov.hidden){ const vn=$('#vn'), ti=ov.querySelector('.title,[data-act=opnext]');
    if(vn&&(e.key===' '||e.key==='Enter'||e.key==='ArrowRight')){ e.preventDefault(); const el=$('#vnCh'); if(el&&el.children.length) return; vn.click(); return; }
    if(vn&&(e.key==='a'||e.key==='A')){ const b=$('#vnAuto'); if(b) b.click(); return; }
    if(ti&&(e.key===' '||e.key==='Enter')){ e.preventDefault(); ti.click(); }
    return; }
  const map={'1':'crew','2':'ops','3':'lobby','4':'contract','5':'studio'}; if(map[e.key]){ const b=document.querySelector(`.tab[data-tab="${map[e.key]}"]`); if(b) b.click(); }
});
/* ── 0570-modal-nav.js에서 ── */
/* MODAL_NAV_MODULE */
/* One user dismissal returns one modal level. Programmatic closeModal still closes all. */
(function(){
 const NAV={stack:[],cur:null,next:null,restoring:false,closing:false,revision:0};
 const rawOpen=CoreView.openModal,rawClose=CoreView.closeModal,project=()=>Core.PJ().active;
 const reset=()=>{NAV.stack=[];NAV.cur=null;NAV.next=null;NAV.closing=false;MBACK=null;};
 function snapshot(entry){const m=$('#modal');if(!entry||m.hidden)return;entry.nodes=[...m.childNodes];entry.scroll=m.querySelector('.sheet')?.scrollTop||0;entry.scrollState=PlayerView.uiScrollCapture(m.querySelector('.sheet'));entry.lock=m.dataset.lock||'';}
 function fallbackId(html){const template=document.createElement('template');template.innerHTML=html;if(template.content.querySelector('.naiprev')&&NAIJOB)return 'nairesult:'+NAIJOB.kind+':'+NAIJOB.id;return 'dialog:'+(template.content.querySelector('.sheet-head h2,h2,h3')?.textContent.trim()||template.content.firstElementChild?.className||'dialog');}
 function addBack(){const m=$('#modal'),hd=m.querySelector('.sheet-head');if(hd&&!m.dataset.lock&&(NAV.stack.length||NAV.cur?.mback)&&!hd.querySelector('[data-act="goback"]')){const b=document.createElement('button');b.type='button';b.className='x nav-back';b.dataset.act='goback';b.setAttribute('aria-label','뒤로가기');b.textContent='‹';hd.prepend(b);}}
 CoreView.openModal=function(html,lock,cls,route){
  const next=route?{id:route}:NAV.next;NAV.next=null;const m=$('#modal');if(NAV.cur&&NAV.cur.project!==project())reset();
  const id=next?.id||fallbackId(html),same=NAV.cur?.id===id;
  if(!same&&NAV.cur?.state&&NAV.cur.id.startsWith('skill:')&&V2EDIT===NAV.cur.state)v2ReadEditor();
  if(!same&&NAV.cur?.state&&NAV.cur.id.startsWith('gear:')&&V2GEAR===NAV.cur.state)v2GearRead();
  snapshot(NAV.cur);let scrollFrom=same&&!NAV.closing?NAV.cur:null;
  if(!NAV.restoring&&!same){
   const ancestor=NAV.stack.findIndex(e=>e.id===id);
   if(ancestor>=0){scrollFrom=NAV.stack[ancestor];NAV.stack=NAV.stack.slice(0,ancestor);}
   else if(NAV.cur&&!NAV.cur.transient&&!NAV.closing&&!m.hidden){NAV.stack.push(NAV.cur);if(NAV.stack.length>32)NAV.stack.shift();}
  }
  const r=rawOpen.apply(this,arguments);if(scrollFrom)PlayerView.uiScrollRestore(m.querySelector('.sheet'),scrollFrom.scrollState);NAV.revision++;NAV.closing=false;
  NAV.cur={...(same?NAV.cur:{}),...(next||{}),id,project:project(),mback:MBACK,transient:!!lock||!!m.querySelector('.spin'),context:next?.getContext?.()};snapshot(NAV.cur);addBack();return r;
 };
 CoreView.closeModal=function(){const r=rawClose.apply(this,arguments),m=$('#modal');if(!m.hidden)return r;NAV.closing=true;MBACK=null;const revision=++NAV.revision;setTimeout(()=>{if(m.hidden&&revision===NAV.revision)reset();},0);return r;};
 function restore(entry){
  if(entry.project!==project())return false;NAV.restoring=true;NAV.cur=null;MBACK=entry.mback||null;
  try{
   if(entry.id.startsWith('naprep:'))NPREP=entry.context;if(entry.id.startsWith('voice:'))VS=entry.context;if(entry.id.startsWith('skinprop:'))SKPROP=entry.context;
   if(!entry.dom&&entry.reopen)entry.reopen();
   if(!NAV.cur&&entry.nodes){const m=$('#modal');m.replaceChildren(...entry.nodes);m.hidden=false;m.dataset.lock=entry.lock;NAV.cur=entry;NAV.closing=false;NAV.revision++;addBack();}
   if(!NAV.cur)return false;const sheet=$('#modal .sheet');if(sheet){PlayerView.uiScrollRestore(sheet,entry.scrollState);sheet.scrollTop=entry.scroll||0;}return true;
  }finally{NAV.restoring=false;}
 }
 window.navBack=function(){
  if(appConfirmBack())return;
  if(NEW_GAME_SOURCE){CoreView.toast('게임 생성이 끝날 때까지 기다려 주세요');return;}
  if(typeof MiscView.imageCandidateBack==='function'&&MiscView.imageCandidateBack())return;
  // Icons are a separate overlay: never close the character underneath them.
  if(typeof V2ICONS!=='undefined'&&V2ICONS){const button=document.querySelector('[data-icon-act="back"],[data-icon-act="close"]');if(button)v2IconClick({target:button});return;}
  if(document.getElementById('v2-standing-help')){v2CloseStandingHelp();return;}
  if(document.querySelector('.v2-equipment-bubble')){document.querySelectorAll('.v2-equipment-bubble').forEach(e=>e.remove());document.querySelectorAll('[data-act=\"v2gearalert\"]').forEach(e=>e.setAttribute('aria-expanded','false'));return;}
  const m=$('#modal');if(m.hidden||m.dataset.lock)return;
  if(typeof Core.regenCancel==='function'&&!Core.regenCancel())return;
  NAIJOB=null;if(NAV.cur?.id.startsWith('training:'))V2TRAIN_CONFIRM=null;
  v2CancelEditorGeneration();if(typeof v2CancelGearEditor==='function')v2CancelGearEditor();
  while(NAV.stack.length){if(restore(NAV.stack.pop()))return;}
  const back=NAV.cur?.mback||MBACK;
  if(back){NAV.cur=null;MBACK=null;NAV.restoring=true;try{back();}finally{NAV.restoring=false;}return;}
  rawClose();if(m.hidden)reset();
 };
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&((typeof IMAGE_CANDIDATES!=='undefined'&&IMAGE_CANDIDATES)||!$('#modal').hidden||document.getElementById('v2-standing-help')||document.querySelector('.v2-equipment-bubble'))){window.navBack();event.preventDefault();event.stopImmediatePropagation();}},true);
 // Stable identities distinguish a redraw from opening a child dialog.
 const pages=[[EconomyView,'openMail',()=>'mail'],[CharactersView,'openGift',a=>'gift:'+a[0]],[StoryView,'openChEdit',()=>'chapter-edit:'+chDraft?.id],[StoryView,'openEpEdit',a=>'episode-edit:'+a[0]+':'+(a[1]||'new')],[StoryView,'openThEdit',a=>'thread-edit:'+a[0]+':'+(a[1]||'new')],[StoryView,'openOpeningEdit',()=>'opening-edit'],[AcquireView,'openBannerFrom',a=>'banner-edit:'+a[0]?.id],[StoryView,'openEvEdit',a=>'event-edit:'+(a[0]||'new')],[StoryView,'openDraft',()=>'draft'],[ExpeditionView,'openDispSel',a=>'dispatch:'+a[0]],[CoreView,'openRelEdit',a=>'rel-edit:'+a[0]],[WorldView,'openCxEdit',a=>'codex-edit:'+(a[0]||'new')],[StoryView,'openStoryMemoryEditor',a=>'story-memory:'+a[0]],[StoryView,'openStoryMemory',()=>'story-memory'],[ChallengeView,'openRgForm',()=>'rogue-formation'],[CharactersCtl,'openChar',a=>'char:'+a[0]],[CharactersView,'openCharEdit',a=>'charedit:'+a[0]],[ArtView,'openLib',a=>'lib:'+a[0]],[CharactersView,'openLibItem',a=>'libitem:'+(a[0]||'new:'+a[1])],[CoreView,'openNaiPrep',a=>'naprep:'+a[0]+':'+a[1]],[EconomyView,'openSkinBuy',a=>'skinbuy:'+a[0]],[CharactersView,'openFaces',()=> 'faces:'+FACET.cid+':'+FACET.sid],[CharactersView,'openSkin',a=>'skin:'+a[0]],[MiscView,'openSkinProp',()=> 'skinprop:'+SKPROP?.cid],[CharactersView,'openNpcs',()=>'npcs'],[CharactersView,'openRel',a=>'rel:'+(a[0]||RELC)],[CharactersView,'openDesign',()=>'design'],[CharactersView,'openImgLib',a=>'imglib:'+a[0]],[ArtView,'openNaiSet',()=>'naiset'],[SystemView,'openSound',()=>'sound'],[WorldView,'openWorld',()=>'world'],[SystemView,'openMeta',()=>'meta'],[CoreView,'openProjects',()=>'projects'],[WorldView,'openCx',a=>'cx:'+(a[0]||'')],[CoreView,'openUpConfirm',a=>'upgrade:'+a[0]?.id+':'+a[1]],[LiveOpsView,'openRegen',a=>'regen:'+a[0]],[CoreView,'regenPreview',()=> 'regenpreview:'+REGEN?.cid],[CharactersView,'renderVoice',()=> 'voice:'+VS?.cid+':'+VS?.sid],[window,'v2DrawEditor',()=> 'skill:'+V2EDIT?.id],[window,'v2DrawGearEditor',()=> 'gear:'+V2GEAR?.id],[window,'v2OpenTraining',a=>'training:'+a[0]+':'+(a[1]||'rank')],[window,'v2OpenPractice',()=>'practice']];
 for(const [own,fn,idf]of pages){const original=own[fn]; /* 창 여는 메서드(Class.이름)를 감쌈 — 옛 window[fn] 다리는 코드가 Class.이름을 불러 거치지 않음 */if(typeof original!=='function')continue;own[fn]=function(...args){
  const previous=NAV.next,state=fn==='v2DrawEditor'?V2EDIT:fn==='v2DrawGearEditor'?V2GEAR:null;
  const route={id:null,state,dom:['openNaiPrep','openCharEdit','openSkin','openSkinProp','renderVoice','openChEdit','openEpEdit','openThEdit','openOpeningEdit','openBannerFrom','openEvEdit','openDraft','openRelEdit','openCxEdit','openStoryMemoryEditor','openStoryMemory'].includes(fn),getContext:()=>fn==='openNaiPrep'?NPREP:fn==='renderVoice'?VS:fn==='openSkinProp'?SKPROP:null,reopen:()=>{if(fn==='v2DrawEditor')V2EDIT=state;if(fn==='v2DrawGearEditor')V2GEAR=state;own[fn](...args);}};
  // Some openers set their selection before openModal; calculate ID at render time.
  Object.defineProperty(route,'id',{get:()=>idf(args),enumerable:true});NAV.next=route;
  try{return original.apply(this,args);}finally{NAV.next=previous;}
 };}
})();
document.addEventListener('click',async e=>{
  if(window.__SWIPED&&Date.now()-window.__SWIPED<450){ window.__SWIPED=0; return; }
  const el=e.target.closest('[data-tab],[data-act]'); if(!el) return;
  if(el.dataset.tab){if(NEW_GAME_SOURCE){CoreView.toast('게임 생성이 끝날 때까지 기다려 주세요');return;} if(el.dataset.tab==='studio') STTAB=''; tab=el.dataset.tab;Challenge.render();$('#view').scrollTop=0;return;}
  const a=el.dataset.act,id=el.dataset.id,p=P();
  if(NEW_GAME_SOURCE&&!['ailog','ailogcopy','saveretry'].includes(a)){CoreView.toast('게임 생성이 끝날 때까지 기다려 주세요');return;}
  try{
  const handler=APP_ACTION_HANDLERS[a];if(handler)return await handler(a,el,id,p,e);
  }catch(error){CoreView.toast('작업을 완료하지 못했습니다. '+(typeof System.ghSafeMessage==='function'?System.ghSafeMessage(error?.message||String(error)):'다시 시도해 주세요'));}
});
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal'&&!e.currentTarget.dataset.lock)window.navBack();});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!$('#modal').hidden){window.navBack();e.preventDefault();e.stopImmediatePropagation();}
  if(e.key==='Enter'&&e.target.dataset&&e.target.dataset.act==='poke') e.target.click();
  if(e.key==='Enter'&&e.target.id==='nm_in') document.querySelector('[data-act="setname"]').click();
});
document.addEventListener('input',e=>{
  const k=e.target.dataset.set; if(!k) return; const s=P().settings; s[k]=+e.target.value;
  if(/Rate$/.test(k)){ const v=$('#v_'+k); if(v) v.textContent=s[k]+'%'; Core.mark('prog'); return; }
  if(s.ssr+s.sr>100){if(k==='ssr')s.sr=100-s.ssr;else s.ssr=100-s.sr;}
  $('#r_ssr').value=s.ssr;$('#r_sr').value=s.sr;$('#v_ssr').textContent=s.ssr+'%';$('#v_sr').textContent=s.sr+'%';$('#v_pity').textContent=s.pity+'회';
  if(P().pity>=s.pity)P().pity=s.pity-1; Core.mark('prog');
});
document.addEventListener('change',async e=>{ if(e.target.id==='orient_sel'){ try{ appStorage.setItem('ggm-orient',e.target.value); }catch(_){} const ok=await System.applyOrient(); SystemView.applyDesk(); CoreView.toast(ok?'화면 방향을 바꿨어요':'이 앱·브라우저는 화면 고정을 지원하지 않아요. 새 APK로 업데이트하면 돼요'); return; } })
document.addEventListener('change',e=>{ if(e.target.id==='fsort'&&FORM){ FORM.sort=e.target.value; CoreView.refreshForm(); return; } if(e.target.id==='ct_tol'||e.target.id==='ct_soft'){ return; } if(e.target.id==='np_frame'){ CoreView.reNaiPrep(); return; } if(e.target.id==='desk_mode'){ try{appStorage.setItem('ggm-desk',e.target.value);}catch(_){} SystemView.applyDesk(); return; } if(e.target.id==='np_style'||e.target.id==='np_posesel'){ if(e.target.id==='np_posesel'&&e.target.value!=='__custom') $('#np_pose').value=e.target.value; CoreView.reNaiPrep(); return; } });
document.addEventListener('input',e=>{ if(e.target.id==='np_pose') CoreView.reNaiPrep(); if(e.target.id==='ct_tol') $('#ct_tolv').textContent=e.target.value; if(e.target.id==='ct_soft') $('#ct_softv').textContent=e.target.value; if(e.target.id==='ct_ptol') $('#ct_ptolv').textContent=e.target.value; if(e.target.id==='ct_brush'){ $('#ct_brushv').textContent=e.target.value; CharactersView.cutPlaceCursor(); CharactersView.cutDrawLoupe(); } if(e.target.id==='ct_pmode'){ const br=['brush','restore'].includes(e.target.value); $('#ct_bs').hidden=!br; $('#ct_pt').hidden=br; $('.cutgo').lastChild.textContent=br?'커서 위치에 한 번 찍기':'커서 위치 지우기'; CharactersView.cutPlaceCursor(); CharactersView.cutDrawLoupe(); } });
document.addEventListener('change',e=>{if(e.target.id==='nai_prov'){ const cf=e.target.value==='comfy'; $('#comfyBox').hidden=!cf; $('#naiBox').hidden=cf; return; } if(e.target.id==='sw_img'){ CoreView.swRead(); ArtView.renderSetup(); return; } if(e.target.id==='ap_type'||e.target.id==='ap_pub'){CoreView.readAp();APD.type=$('#ap_type').value;if($('#ap_pub'))APD.pub=$('#ap_pub').value;if(e.target.id==='ap_type'){APD.model='';APD.quick='';if(Object.values(AITYPE).includes(APD.name))APD.name='';} if(SW&&$('#ov .setup')) ArtView.renderSetup(); else CharactersView.openAp();return;}});
document.addEventListener('change',e=>{const k=e.target.dataset&&e.target.dataset.pset; if(!k) return; P()[k]=e.target.value.trim(); Core.mark('prog'); if(k!=='player') Challenge.render(); else CoreView.toast('이름을 저장했어요');});
document.addEventListener('click',e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act;
  if(a==='rulesopen') RulesView.openRules();
  else if(a==='rulessave'){ if(Rules.rulesSave()){ CoreView.closeModal(); Challenge.render(); CoreView.toast('게임 규칙을 저장했어요'); } }
  else if(a==='rulescodex'){ if(Rules.rulesSave()){ RulesCtl.rulesCodex(); RulesView.openRules(); } }
  else if(a==='rulesai') RulesCtl.rulesAI(CoreView.uiProg(el));
  else if(a==='rulesposai') Rules.rulesPosAI(CoreView.uiProg(el));
  else if(a==='rulesrecalc') Characters.rulesRecalc();
  else if(a==='rulesposassign'){ RulesCtl.rulesPosAssign(); }
  else if(a==='rulespreset'){ RulesView.rulesRead(); RD.positions=POS_PRESETS[el.dataset.k].map(([name,base,desc,t])=>({id:'p_'+uid(),name:el.dataset.k==='basic'?ROLE[base]:name,base,desc,t:{...t},range:POS_RANGE[el.dataset.k==='basic'?ROLE[base]:name]||''})); RulesView.openRules(true); }
  else if(a==='rulesadd'){ RulesView.rulesRead(); const k=el.dataset.k, E=RD.elems.map(x=>x.n);
    if(k==='elem'&&RD.elems.length<8){ let n='속성'+(RD.elems.length+1); RD.elems.push({n,c:'#'+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0'),d:'',orig:'',beat:''}); }
    else if(k==='reaction') RD.reactions.push({a:E[0],b:E[1],name:'반응',type:'amp',value:1.5});
    else if(k==='pos') RD.positions.push({id:'p_'+uid(),name:'새 포지션',base:'atk',desc:'',t:{}});
    else if(k==='rel') RD.rel.push({by:'faction',a:'',b:'',mul:1.2}); RulesView.openRules(true); }
  else if(a==='rulesedel'){ RulesView.rulesRead(); const gone=RD.elems.splice(+el.dataset.i,1)[0]; RD.elems.forEach(x=>{ if(x.beat===gone.n) x.beat=''; }); RulesView.openRules(true); }
  else if(a==='rulesrdel'){ RulesView.rulesRead(); RD[el.dataset.k].splice(+el.dataset.i,1); RulesView.openRules(true); } });
document.addEventListener('click',e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act;
  if(a==='balopen') RulesView.openBalance();
  else if(a==='balsave'){ Rules.balSave(); CoreView.toast('밸런스 설정을 저장했어요'); RulesView.openBalance(); }
  else if(a==='balfix') Characters.balFix(el.dataset.k);
  else if(a==='balundo'){ CharactersCtl.auditUndo(); RulesView.openBalance(); } });
document.addEventListener('click',async e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act;
  if(a==='planopen') StoryView.openPlan();
  else if(a==='plansave'){ Story.planRead(); Core.mark('world'); CoreView.toast('시나리오 설계를 저장했어요'); StoryView.openPlan(); }
  else if(a==='planadd'){ Story.planRead(); const p=Core.gameSlot('world.plan'), k=el.dataset.k, n=G.chapters.filter(ch=>ch.kind==='main').length; p[k].push(k==='acts'?{name:'',upto:n+4,goal:''}:k==='twists'?{id:'t'+uid().slice(0,4),truth:'',reveal:n+3,who:'',clues:[]}:k==='branches'?{id:'b'+uid().slice(0,4),at:n+1,question:'',options:[]}:{name:'',start:'',change:'',end:''}); StoryView.openPlan(); }
  else if(a==='plandel'){ Story.planRead(); Core.gameSlot('world.plan')[el.dataset.k].splice(+el.dataset.i,1); Core.mark('world'); StoryView.openPlan(); }
  else if(a==='planai'){ if(!SAMPLE){ CoreView.toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; } Story.planRead(); if(await Story.planAI(el.dataset.k,CoreView.uiProg(el),($('#pl_ins')||{}).value||'')){ CoreView.toast('시나리오를 설계했어요'); StoryView.openPlan(); } } });
addEventListener('ggm-ai',Story.smRecord);
document.addEventListener('click',async e=>{const el=e.target.closest('[data-sm]');if(!el)return;const action=el.dataset.sm,id=el.dataset.id,origin=G,pid=Core.PJ().active;try{
 if(action==='open')StoryView.openStoryMemory();
 if(action==='chapter')StoryView.openStoryMemoryEditor(id);
 if(action==='request'){const r=Story.smState().latestRequest;MiscView.smTextView('최근 스토리 요청',r?`${new Date(r.at).toLocaleString()} · ${r.label} · ${r.characters}자\n상태: ${r.status}\n\n${r.prompt}`:'이 버전에서 아직 스토리를 요청하지 않았습니다.');}
 if(action==='memo')MiscView.smTextView('이어쓰기 기억 미리보기',Story.storyMemo()+Story.smNotes(false));
 if(action==='inspect')MiscView.smTextView('저장된 관계·도감',JSON.stringify({relations:G.rels||[],codex:G.world.codex||[],codexNotes:G.world.codexNotes||{}},null,2));
 if(action==='notes-save'){const value=document.getElementById('sm-notes').value;if(value.length>8000){CoreView.toast('8,000자를 초과했습니다. 내용을 보존한 채 저장을 중단합니다.');return;}Core.gameSlot('meta.storyMemory').notes=value;Core.mark('meta');await Core.flush();CoreView.toast('확정 규칙을 저장했어요');}
 if(action==='rebuild')await StoryView.smRebuild(id);
 if(action==='stop'){SM_JOB?.controller.abort();window.navBack();}
 if(action==='save'){const ch=G.chapters.find(x=>x.id===id);if(!ch)return;const text=document.getElementById('sm-text').value,brief=document.getElementById('sm-brief').value,unresolved=document.getElementById('sm-unresolved').value,locked=document.getElementById('sm-locked').checked;if(!text.trim()||text.length>6000||brief.length>600||unresolved.length>1200){CoreView.toast('기억 내용을 입력하고 각 항목의 글자 범위를 확인해 주세요. 초과 내용은 자르지 않았습니다.');return;}ch.memoryPrevious=JSON.parse(JSON.stringify({memory:ch.memory||null,summary:ch.summary||''}));ch.memory={version:1,text,brief,unresolved,locked,source:'author',at:Date.now(),fingerprint:Story.smFingerprint(ch)};ch.summary=text;Core.mark('ch:'+ch.id);await Core.flush();CoreView.toast('기억을 저장했어요. 이후 생성부터 반영됩니다.');}
 if(action==='undo'){const ch=G.chapters.find(x=>x.id===id);if(!ch?.memoryPrevious)return;const before=ch.memoryPrevious;if(!await appConfirm('이 장의 이전 기억으로 되돌릴까요? 대본은 바뀌지 않습니다.'))return;if(G!==origin||Core.PJ().active!==pid||!G.chapters.includes(ch)||ch.memoryPrevious!==before)return;const now={memory:ch.memory||null,summary:ch.summary||''};ch.memory=before.memory;ch.summary=before.summary;ch.memoryPrevious=JSON.parse(JSON.stringify(now));Core.mark('ch:'+ch.id);await Core.flush();StoryView.openStoryMemoryEditor(id);}
 }catch(err){CoreView.toast(err.message||String(err));}});
document.addEventListener('input',e=>{if(e.target.id==='ng_story'){const count=document.getElementById('story-char-count');if(count)count.textContent=e.target.value.length.toLocaleString()+' / 100,000자'+(e.target.value.length>100000?' · 초과했습니다. 저장 전에 줄여 주세요.':e.target.value.length>50000?' · 긴 원문입니다. AI 사용량과 응답 시간을 확인해 주세요.':'');}});
document.addEventListener('input',e=>{ if(e.target.closest&&e.target.closest('#drPage')){ clearTimeout(CoreView.drRead._t); CoreView.drRead._t=setTimeout(CoreView.drRead,400); } });
document.addEventListener('change',e=>{ const cy=e.target&&e.target.dataset&&e.target.dataset.cyc; if(cy){ const L=P().live; L.cyc=Object.assign({},L.cyc||{},{[cy]:+e.target.value}); Core.mark('prog'); Challenge.render(); CoreView.toast(`${LiveOps.cycLabel(cy)} 주기로 바꿨어요`); return; } });
document.addEventListener('change',e=>{ if(e.target.closest&&e.target.closest('#drPage')){ CoreView.drRead(); if(e.target.dataset&&e.target.dataset.dc==='kind') CoreView.drRerender(); } });
document.addEventListener('click',e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act, id=el.dataset.id;
  if(a==='exjob'){ const o=Expedition.exOffers(id), job=o.offers.find(x=>x.id===el.dataset.job); if(job) Expedition.exStart(id,job); }
  else if(a==='exstream'){ const pf=Expedition.EXC().streamer.platforms.find(p=>p.id===el.dataset.pf); if(pf) Expedition.exStart(id,pf); }
  else if(a==='exrest') Expedition.exRest(id,4);
  else if(a==='exclaim'){ Expedition.exClaim(id); Challenge.render(); }
  else if(a==='exclaimall'){ Object.keys(Core.progSlot('exped').jobs).forEach(Expedition.exClaim); Challenge.render(); }
  else if(a==='exlib') Expedition.exLibSettle();
  else if(a==='exsettle'){ Expedition.exBizSettle(); Challenge.render(); }
  else if(a==='exset') ExpeditionView.openExSet();
  else if(a==='exsave') ExpeditionCtl.exSave(); });
document.addEventListener('change',e=>{ const el=e.target; if(!el.dataset||el.dataset.exassign==null) return; Expedition.exAssign(el.dataset.exassign,+el.dataset.slot,el.value||null); });
document.addEventListener('click',async e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act;
  if(a==='fwopen') WorldView.openWorldDesign();
  else if(a==='fwtab'){ Characters.fwRead(); WorldView.openWorldDesign(el.dataset.k); }
  else if(a==='fwsave'){ Characters.fwRead(); CoreView.toast('세력·등장 설정을 저장했어요'); WorldView.openWorldDesign(); }
  else if(a==='fwadd'){ Characters.fwRead(); World.factionSync().push({name:'새 세력 '+(World.factions().length+1),desc:'',kind:'neutral',rel:{},stance:[]}); WorldView.openWorldDesign('fac'); }
  else if(a==='fwmon'){ const c=charById(el.dataset.id); if(c&&(await appConfirm(`「${c.name}」을(를) 몬스터(적)로 바꿀까요? ${System.T('gacha')}·톡·일정·인연에서 빠져요.`))){ World.charToMonster(c); CoreView.toast('몬스터로 바꿨어요'); WorldView.openWorldDesign('cast'); } }
  else if(a==='fwai'){ if(!SAMPLE){ CoreView.toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; } Characters.fwRead(); if(await World.factionAI(CoreView.uiProg(el),($('#fw_ins')||{}).value||'')){ CoreView.toast('세력·몬스터 설정을 채웠어요'); WorldView.openWorldDesign(); } } });
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='hidden'&&!System.LKMODE()){ const pc=System.PCS(); if(pc&&pc.auto!==false&&(G.prog.savedAt||0)>(pc.localAt||0)+3000) SystemView.pcPush(true); } });
setInterval(()=>{ const pc=System.PCS(); if(pc&&pc.auto!==false&&!PCJOB&&!LK.locked&&(G.prog.savedAt||0)>(pc.localAt||0)+3000) SystemView.pcPush(true); },2*60000);
addEventListener('ggm-storage-ok',()=>{ const pc=System.PCS(); if(!pc||pc.auto===false) return; clearTimeout(PCSOON); PCSOON=setTimeout(()=>{ const o=System.PCS(); if(o&&!PCJOB&&!LK.locked&&(G.prog.savedAt||0)>(o.localAt||0)) SystemView.pcPush(true); },5000); });
// 앱을 내릴 때(화면이 숨겨질 때) 자동 올리기를 켰고 마지막 올린 뒤 바뀐 게 있으면 올려요(한 기기만 플레이 모드가 아닐 때)
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='hidden'&&!System.LKMODE()){ const o=System.SY(); if(System.syReady()&&o.autoUp&&!SYJOB&&(G.prog.savedAt||0)>(o.localAt||0)+5000) SystemView.syPush(false); } });
System.devIdEnsure();
document.addEventListener('visibilitychange',async()=>{ if(!System.LKMODE()) return;
  if(document.visibilityState==='hidden'){ if(LK.claimed&&!LK.locked){ clearInterval(LK.t); try{ await System.lkSave(true); await SystemCtl.lkOp('away'); }catch(e){ Core.quietErr(e,'0360-sync/050-single-device.js:60'); } } }
  else setTimeout(SystemCtl.lkActivate,600); });
document.addEventListener('keydown',e=>{ if(LK.locked){ e.stopImmediatePropagation(); if(e.key!=='Tab') e.preventDefault(); } },true);
if(!IS_NATIVE){ setInterval(()=>{ if(document.visibilityState==='visible') System.checkWebUpdate(false); },30*60000); }
const EMOTES={
 하트:{c:'#ff5c8a',svg:EMO_SVG(`<path d="M20 34 6 20a8 8 0 0 1 14-10 8 8 0 0 1 14 10z" fill="#ff5c8a" ${EMO_ST}/>`),a:'pop',k:/좋아해|사랑|두근|설레|고마워|기뻐|♥|❤/},
 땀:{c:'#7cc8ff',svg:EMO_SVG(`<path d="M22 4c6 10 10 15 10 21a10 10 0 0 1-20 0c0-6 4-11 10-21z" fill="#a9dcff" ${EMO_ST}/>`),a:'drip',k:/(^|\s)(어,|어어|저기…|아하하|하하…)|당황|곤란|미안…|^\.\.\.|^…/},
 화남:{c:'#ff4b4b',svg:EMO_SVG(`<g fill="none" stroke="#ff3b3b" stroke-width="4.5" stroke-linecap="round"><path d="M8 15q7 0 7-7"/><path d="M25 8q0 7 7 7"/><path d="M32 25q-7 0-7 7"/><path d="M15 32q0-7-7-7"/></g>`),a:'throb',k:/화나|짜증|뭐야!|용서 못|열받|시끄러|그만해!/},
 놀람:{c:'#ffd23f',svg:EMO_SVG(`<path d="M15 3h10l-2 22h-6z" fill="#ffd23f" ${EMO_ST}/><circle cx="20" cy="32" r="4" fill="#ffd23f" ${EMO_ST}/>`),a:'pop',k:/[!！][?？]|[?？][!！]|뭐라고|설마|깜짝|에엣|헉/},
 의문:{c:'#9bd0ff',svg:EMO_SVG(`<path d="M12 13a8 8 0 1 1 12 7c-3 2-4 3-4 7" fill="none" stroke="#1a1020" stroke-width="7" stroke-linecap="round"/><path d="M12 13a8 8 0 1 1 12 7c-3 2-4 3-4 7" fill="none" stroke="#9bd0ff" stroke-width="3.5" stroke-linecap="round"/><circle cx="20" cy="35" r="3.5" fill="#9bd0ff" ${EMO_ST}/>`),a:'tilt',k:/글쎄|왜\?|그게 무슨|음\?|응\?/},
 침묵:{c:'#ffffff',svg:EMO_SVG(`<g fill="#fff" ${EMO_ST}><circle cx="9" cy="24" r="4"/><circle cx="20" cy="24" r="4"/><circle cx="31" cy="24" r="4"/></g>`),a:'fade',k:/^(…|\.\.\.)+$/},
 음표:{c:'#c49bff',svg:EMO_SVG(`<path d="M16 30V8l16-4v20" fill="none" stroke="#1a1020" stroke-width="6"/><path d="M16 30V8l16-4v20" fill="none" stroke="#c49bff" stroke-width="3"/><circle cx="12" cy="30" r="5" fill="#c49bff" ${EMO_ST}/><circle cx="28" cy="26" r="5" fill="#c49bff" ${EMO_ST}/>`),a:'bob',k:/[♪~]$|후후|에헤헤|흥흥|랄라|ㅎㅎ|ㅋㅋ/},
 번뜩:{c:'#fff27a',svg:EMO_SVG(`<g stroke="#fff27a" stroke-width="4" stroke-linecap="round"><path d="M20 3v8M20 29v8M3 20h8M29 20h8M8 8l5 5M27 27l5 5M32 8l-5 5M13 27l-5 5"/></g>`),a:'pop',k:/그렇구나!|알았다|좋은 생각|번뜩|맞아!/},
 눈물:{c:'#7cc8ff',svg:EMO_SVG(`<g fill="#a9dcff" ${EMO_ST}><path d="M12 8c4 7 6 10 6 14a6 6 0 0 1-12 0c0-4 2-7 6-14z"/><path d="M28 14c4 7 6 10 6 14a6 6 0 0 1-12 0c0-4 2-7 6-14z"/></g>`),a:'drip',k:/흑|훌쩍|울지|눈물|슬퍼/},
 홍조:{c:'#ff8fb0',svg:EMO_SVG(`<g stroke="#ff6f9a" stroke-width="3.5" stroke-linecap="round"><path d="M6 26l5-8M13 26l5-8M20 26l5-8M27 26l5-8"/></g>`),a:'fade',k:/부끄|창피|그, 그런|바보…|딱히/},
 졸림:{c:'#b8c4ff',svg:`<svg viewBox="0 0 40 40" aria-hidden="true"><text x="6" y="30" font-size="22" font-weight="900" fill="#b8c4ff" stroke="#1a1020" stroke-width="1.5">Z</text><text x="22" y="18" font-size="14" font-weight="900" fill="#b8c4ff" stroke="#1a1020" stroke-width="1">z</text></svg>`,a:'bob',k:/졸려|하암|피곤/},
 반짝:{c:'#fff3a8',svg:EMO_SVG(`<path d="M20 2l4 14 14 4-14 4-4 14-4-14-14-4 14-4z" fill="#fff3a8" ${EMO_ST}/>`),a:'pop',k:/반짝|멋지|대단해|최고/},
 한숨:{c:'#e6e6e6',svg:EMO_SVG(`<path d="M8 26a7 7 0 0 1 6-11 9 9 0 0 1 17 3 6 6 0 0 1-1 12H12a5 5 0 0 1-4-4z" fill="#eee" ${EMO_ST}/>`),a:'fade',k:/하아…|휴우|에휴|한숨/}};
PromptStudio.defineFragments(); /* 프롬프트 조각 등록(스튜디오 — tools/reshape.mjs --studio) */
document.addEventListener('click',e=>{ const el=e.target.closest('[data-act="bfocus"]'); if(!el) return; e.stopPropagation(); SystemView.bFocus(+el.dataset.i); });
document.addEventListener('click',e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act;
  if(a==='bsys'){ G.meta.rules=G.meta.rules||{}; G.meta.rules[el.dataset.k]=el.checked; Core.mark('meta'); }
  else if(a==='bsmode'){ G.meta.story=G.meta.story||{}; G.meta.story.modes=Object.assign({},G.meta.story.modes,{[el.dataset.k]:el.checked}); Core.mark('meta'); }
  else if(a==='sogo') BattleCtl.sortieFight();
  else if(a==='sonext'){ const x=Battle.sortieParts(); if(!x) return; x.run.node=el.dataset.v; Core.mark('prog'); BattleView.sortieMap(); }
  else if(a==='somap'){ B=null; CoreView.closeOv(); Challenge.render(); BattleView.sortieMap(); }
  else if(a==='soretreat'){ const x=Battle.sortieParts(); const g=x?x.run.gained:{}; Battle.sortieEnd(); CoreView.closeModal(); Challenge.render(); CoreView.toast(`퇴각했어요${g.gold?` · 얻은 골드 ${nf(g.gold)}`:''}`); } });
