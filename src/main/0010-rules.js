/* =========================================================
   규칙과 형식
   ========================================================= */
function genderText(){ const t=String(P().genderTxt||'').trim(), lk=String(P().look||'').trim(), bio=String(P().bio||'').trim(), L=(lk?`플레이어(${T('player')})의 외모: ${lk}. `:'')+(bio?`플레이어(${T('player')})의 설정: ${bio}. 이 설정과 어긋나게 쓰지 않는다. `:'');
  if(t&&!/^(정하지 ?않음|없음|모름|비밀)$/.test(t)) return `플레이어(${T('player')})의 성별·성 정체성: ${t}. 호칭과 반응을 이에 맞추고 임의로 바꾸지 않는다. `+L;
  return genderText0()+L; }
function genderText0(){ const g=P().gender; return g==='m'?`플레이어(${T('player')})는 남성이다. 호칭과 반응을 그에 맞춘다. `:g==='f'?`플레이어(${T('player')})는 여성이다. 호칭과 반응을 그에 맞춘다. `:`플레이어(${T('player')})의 성별은 정하지 않는다. 성별이 드러나는 호칭은 피한다. `; }
function callText(){ const n=String(P().player||'').trim(), t=T('player'); return n&&n!==t?`${T('crew')}들은 플레이어를 보통 호칭 "${t}"(으)로 부른다. 이름 "${n}"은(는) 친밀한 순간이나 꼭 필요할 때만 부른다. `:`${T('crew')}들은 플레이어를 호칭 "${t}"(으)로 부른다. `; }
/* 등장인물 성별 구성: f=여성만, m=남성만, mix=혼성, ''=AI가 정함. 아군·NPC를 만드는 모든 요청에 들어가요 */
const CAST_SEX={f:'여성만',m:'남성만',mix:'여성 + 남성 혼성'};
function castRule(k){ k=k==null?((typeof G!=='undefined'&&G&&G.meta&&G.meta.castSex)||''):k; return k==='f'?'등장인물 성별: 아군과 주요 인물은 모두 여성이다(naiPrompt는 1girl로 시작). ':k==='m'?'등장인물 성별: 아군과 주요 인물은 모두 남성이다(naiPrompt는 1boy로 시작). ':k==='mix'?'등장인물 성별: 아군과 주요 인물은 여성과 남성을 고르게 섞는다(대략 반반. 여성은 1girl, 남성은 1boy로 시작). 새 인물을 만들 때 지금 아군의 성비를 보고 적은 쪽을 채운다. ':''; }
function rulesText(){const tone=String((G.meta&&G.meta.tone)||'').trim();return genderText()+callText()+castRule()+`규칙: 등장인물은 모두 성인이다. ${tone?'이 게임의 분위기: '+tone+'. 글의 톤은 이 분위기를 따른다. ':''}모든 글은 한국어로 쓴다. 이 게임의 용어: 플레이어 호칭 "${T('player')}", 유료 재화 "${T('currency')}", 뽑기 "${T('gacha')}", 전투 "${T('ops')}", 탐사 콘텐츠 "${T('abyss')}", 아군 "${T('crew')}", 메신저 "${T('talk')}". 속성: ${ELEMS.join(', ')} (${ELEMS.map((e,i)=>e+'은 '+ELEMS[(i+1)%3]+'에 강함').join(', ')}).`;}
// 이미 만든 이벤트 소재를 알려 줘서 같은 얘기를 또 하지 않게 해요
function evPastHint(skip){ const L=(G.events||[]).filter(e=>e&&e.id!==skip).slice(-12).map(e=>`${e.title}${e.desc?'('+String(e.desc).slice(0,40)+')':''}`); return L.length?`\n지금까지 나온 이벤트(소재·사건·결말을 반복하지 않고 새로운 소재로 쓴다): ${L.join(' / ')}`:''; }
const BATTLE_FLOW='\n전투 흐름: 스테이지마다 전투가 있는 건 게임 구조일 뿐이다. 데이트·일상·대화 장면 한가운데에 갑작스러운 습격을 만들어 전투에 억지 개연성을 붙이지 않는다. pre는 장면이 자연스럽게 마무리되는 곳에서 끝내고, 전투는 훈련·의뢰·순찰 중 마주친 적 정도로 한 줄만 언급하거나 아예 언급하지 않아도 된다. post도 전투를 길게 되짚지 말고 이야기의 흐름을 이어 간다.';
function scriptFmt(){return `대본은 하나의 문자열이고 줄마다 줄바꿈(\\n)으로 나눈다(쉼표로 잇거나 배열로 쓰지 않는다). 대본 형식(한 줄에 하나): "이름: 대사" / 표정을 바꾸려면 "이름[표정]: 대사" (표정은 각 캐릭터의 표정 목록에서 고른다) / 그 외 문장은 나레이션 / [배경: 배경이름]은 배경 전환 / [장소이름]은 장소 자막과 배경 전환 / [소품: 소품이름]은 소품 클로즈업, [소품 끝]으로 닫음 / [효과: 흔들림], [효과: 플래시], [효과: 암전] / [효과음: 이름] / [음악: 음악이름]은 배경음 전환, [음악 끝]은 정지 / [톡: 캐릭터이름]부터 [톡 끝]까지는 휴대폰 메신저 화면으로 대화가 진행되는 장면 / [CG: CG이름]은 일러스트 한 장을 화면 가득 보여 주고, [CG 끝]으로 닫음 / "선택: 보기1 | 보기2"는 플레이어 선택지이고, 이어지는 줄 앞에 "1) "이나 "2) "를 붙이면 그 선택을 했을 때만 나온다. 플레이어 대사는 "${T('player')}: "로 쓰고, 플레이어를 부를 때는 보통 호칭 "${T('player')}"을 그대로 쓰며, 이름을 불러야 할 때만 {${T('player')}}으로 쓴다. 배경, 소품, 음악, 효과음은 가능한 한 기존 목록의 이름을 그대로 쓴다. 기존 인물이 적으로 나오거나 적이었던 인물이 동료가 되면 이름을 바꾸지 않고 같은 이름을 그대로 쓴다(그림이 이어지도록).`;}
function threadFmt(){return `메신저 형식(한 줄에 하나): "캐릭터이름: 메시지" / "선택: 답장1 | 답장2"는 플레이어 답장 선택지(고른 답장이 전송됨). 플레이어의 말은 반드시 선택지로만 쓰고 "나: 메시지"처럼 플레이어 대사를 직접 쓰지 않는다(플레이어가 멋대로 말하면 안 된다). 선택지 없이 플레이어 반응이 필요하면 선택지 1개짜리로 쓴다, 이어지는 줄 앞에 "1) " 같은 번호를 붙이면 그 답장을 골랐을 때만 나온다 / [사진: 소품 또는 배경 이름]은 사진 전송. 실제 메신저처럼 짧은 메시지를 여러 번 나눠 보내고, ㅋㅋ와 이모지를 써도 된다. 세계관과 메인 스토리의 사건, 떡밥을 자연스럽게 언급한다.`;}
Object.defineProperty(window,'RULES',{get:rulesText});
Object.defineProperty(window,'SCRIPT_FMT',{get:scriptFmt});
Object.defineProperty(window,'THREAD_FMT',{get:threadFmt});
const TITLE_RULE="게임 이름은 요즘 서브컬처 가챠 게임처럼 짧고 느낌 있게 짓는다(실제 게임 이름은 쓰지 않는다): 2~4글자 한자어·합성어(예: 심연잔향, 성흔, 월하), 또는 영어 두 단어를 한글로 읽은 이름(예: 어비스 에코, 노바 레퀴엠). '~의 ~'처럼 풀어 쓴 이름이나 설명 같은 이름은 피한다. sub는 영문 제목(예: Abyss Echo). ";
const NAI_CHAR = 'naiPrompt는 NovelAI용 영어 태그 문자열. "1girl, solo"(남자는 "1boy, solo")로 시작하고, 나이를 직접 나타내는 태그(mature female, adult woman 등)는 기본으로 넣지 않는다. 캐릭터 설정상 꼭 필요할 때만 스스로 판단해서 넣는다. V4 이상 모델 기준의 자연스러운 태그로 머리, 눈, 체형, 의상, 장신구, 들고 있는 무기 같은 외모 태그만 쓴다. 자세, 구도, 배경, 화풍 태그는 쓰지 않는다(앱이 따로 붙인다). 엘프처럼 귀가 뾰족한 종족이면 elf, pointy ears를 꼭 넣고, 사람이면 귀 모양 태그를 넣지 않는다(앱이 사람에게는 뾰족한 귀를 막는다). 의상·장신구·무기는 이 게임의 세계관·소속·직업·계급에 꼭 맞게 고르고, 세계관에 어울리지 않는 요소(현대 배경의 중세 갑옷, 판타지 배경의 교복·스마트폰 따위)는 쓰지 않는다. 무기를 든 모습을 넣을 때는 그 캐릭터의 전용 무기와 같은 무기만 쓴다. 아군·동료에게 적 전용 태그(faceless)는 쓰지 않는다.';
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
  terms:{player:'관리관',currency:'성석',gold:'크레딧',expMat:'전투 기록',wMat:'스킬 교본',core:'승급(Lv1~70) 재료',gearMat:'장비 강화 재료',transcMat:'초월승급(Lv71~120) 재료',gacha:'계약',ops:'작전',crew:'대원',talk:'등대톡',dispatch:'파견',farm:'훈련',pass:'시즌 패스',event:'이벤트',weapon:'전용 무기',files:'기밀 파일',skin:'스킨',enhance:'강화',limit:'돌파',abyss:'미지 탐사'},
  elems:[{n:'홍',c:'#ff5a5a'},{n:'녹',c:'#4fd18b'},{n:'청',c:'#4fa3ff'}],
  roles:{atk:'공격',def:'방어',sup:'지원'},
  farms:[{key:'exp',name:'전투 기록 회수'},{key:'gold',name:'크레딧 수급'},{key:'wmat',name:'스킬 교본 회수'},{key:'core',name:'성핵 코어 정제'}],
  shop:{name:'보급관',charId:'',hello:['어서 와요, {관리관}. 오늘은 뭐가 필요해요?','재고 넉넉해요. 천천히 골라요.','오늘 들어온 물건, 꽤 괜찮아요.'],buy:['좋은 선택이에요!','고마워요. 다음에 또 와요.','포장해 둘게요. 잘 쓰세요.'],poor:['음… 그건 조금 모자라요.','작전 한 번 다녀오면 살 수 있을 거예요.']}};
const TERM_LABEL={player:'플레이어 호칭',currency:'유료 재화',gold:'일반 재화',expMat:'경험치 재료',wMat:'스킬 강화 재료',core:'승급(Lv1~70) 재료',gearMat:'장비 강화 재료',transcMat:'초월승급(Lv71~120) 재료',gacha:'뽑기 이름',ops:'전투 메뉴',crew:'아군 호칭',talk:'메신저 앱',dispatch:'파견',farm:'재료 던전',pass:'패스',event:'이벤트',weapon:'전용 무기',files:'캐릭터 기록',skin:'스킨',enhance:'강화',limit:'돌파',abyss:'로그라이크 탐험'};
// Names are metadata only; saved runs and reward identifiers remain unchanged.
function explorationName(value){return typeof value==='string'&&value.trim()?value.replace(/\s+/g,' ').trim().slice(0,12):'미지 탐사';}
const EXPLORATION_NAME_RULE='탐사 콘텐츠 이름(terms.abyss)은 세계관에 어울리는 2~12자 이름으로 짓는다. 파티를 편성해 여러 구역에서 전투·발견·사건을 겪고 돌아오는 반복 탐사 콘텐츠다. 지하·심연을 전제하지 말고, 다른 메뉴 이름과 구분한다.';
function T(k){const t=(typeof G!=='undefined'&&G&&G.meta&&G.meta.terms)||{};return t[k]||DEFAULT_META.terms[k]||k;}
function applyMeta(){
  const m=G.meta; ELEMS=m.elems.map(e=>e.n);
  Object.keys(ECOL).forEach(k=>delete ECOL[k]); Object.keys(BEATS).forEach(k=>delete BEATS[k]);
  m.elems.forEach((e,i)=>{ECOL[e.n]=e.c;BEATS[e.n]=m.elems[(i+1)%3].n;});
  Object.assign(ROLE,m.roles);
  document.documentElement.dataset.skin=m.theme||'tactical';
  document.documentElement.style.setProperty('--acc',m.accent||'#ffb400');
  document.title=m.title;
  const b=document.querySelector('.brand'); if(b){ b.innerHTML=`<b class="brand-t">${esc(m.title)}</b><i>${esc(m.sub)}</i>`; fitBrand(); }
}
const MAT={exp:'expMat',wmat:'wMat',core:'core',gearMat:'gearMat',transcMat:'transcMat'};

