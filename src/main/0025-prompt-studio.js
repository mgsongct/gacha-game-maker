/* ===== 프롬프트 스튜디오 ===== */
/* 흩어진 프롬프트 조각을 한곳에서 보고(조각 목록), 게임마다 고쳐 쓰고(덮어쓰기·덧붙이기), AI로 다듬고,
   그림 프롬프트를 점검·정정하고, 정정한 내용을 "교훈"으로 쌓아 다음 요청부터 같은 실수를 막아요.
   - 조각: pfDef(id,label,get)로 등록 → window[id] 게터가 promptFrag(id)를 돌려줌. 덮어쓰기는 G.meta.prompts[id]={text,add}
   - 그림 가드: imgGuard(kind,tags) — 배경·소품·지도·아이콘에서 사람 태그를 빼고 "no humans" 머리말을 붙임(composeNai에서 항상 실행)
   - 교훈: appStorage 'ggm-plessons' (모델 버릇은 게임이 아니라 AI에 딸리므로 전체 공통). 가드가 고칠 때마다 hits가 오르고,
     켜진 교훈은 그림 태그 요청(TAG_REQ)이나 모든 요청(scope:'all')에 llmWrap이 끼워 넣음
   문서: docs/research/prompts.md */
function pfDef(id,label,get,where){ const R=window.__PF||(window.__PF={}); R[id]={id,label,get,where:where||''}; Object.defineProperty(window,id,{get:()=>promptFrag(id),configurable:true}); }
function promptOv(){ try{ return (G&&G.meta&&G.meta.prompts)||{}; }catch(e){ return {}; } } // G는 0070에서 생겨요(그 전 호출은 기본값)
function promptFrag(id){ const f=(window.__PF||{})[id]; if(!f) return ''; const base=f.get(), o=promptOv()[id]; if(!o) return base; const t=o.text&&o.text.trim()?o.text:base; return o.add&&o.add.trim()?t+'\n'+o.add.trim():t; }
/* ===== 조각 모음: 글 AI에 보내는 지시문은 모두 여기 한곳에(파편화 방지) =====
   고칠 때는 여기서 고치고, 게임마다 다르게 할 것은 스튜디오 화면(덮어쓰기·덧붙이기·AI 다듬기)에서. 호출 지점은 ${ID}로 넣기만 하고,
   명단·수치 같은 데이터와 스키마(데이터 계약)만 각 기능 파일에 둬요. 도구가 다른 파일의 pfDef·지시문을 잡아요(tools/lib/prompts.mjs). */
// ── 공통 형식
const BATTLE_FLOW_BASE='\n전투 흐름: 스테이지마다 전투가 있는 건 게임 구조일 뿐이다. 데이트·일상·대화 장면 한가운데에 갑작스러운 습격을 만들어 전투에 억지 개연성을 붙이지 않는다. pre는 장면이 자연스럽게 마무리되는 곳에서 끝내고, 전투는 훈련·의뢰·순찰 중 마주친 적 정도로 한 줄만 언급하거나 아예 언급하지 않아도 된다. post도 전투를 길게 되짚지 말고 이야기의 흐름을 이어 간다.';
pfDef('BATTLE_FLOW','전투 흐름(스토리 안의 전투 다루기)',()=>BATTLE_FLOW_BASE);
function scriptFmt(){return `대본은 하나의 문자열이고 줄마다 줄바꿈(\\n)으로 나눈다(쉼표로 잇거나 배열로 쓰지 않는다). 대본 형식(한 줄에 하나): "이름: 대사" / 표정을 바꾸려면 "이름[표정]: 대사" (표정은 각 캐릭터의 표정 목록에서 고른다. 목록이 없는 캐릭터는 ${FACE_BASIC.join('·')} 중에서) / 그 외 문장은 나레이션 / [배경: 배경이름]은 배경 전환 / [장소이름]은 장소 자막과 배경 전환 / [소품: 소품이름]은 소품 클로즈업, [소품 끝]으로 닫음 / ${DIRECTION_GUIDE} / [효과음: 이름] / [음악: 음악이름]은 배경음 전환, [음악 끝]은 정지 / [톡: 캐릭터이름]부터 [톡 끝]까지는 휴대폰 메신저 화면으로 대화가 진행되는 장면 / [CG: CG이름]은 일러스트 한 장을 화면 가득 보여 주고, [CG 끝]으로 닫음 / "선택: 보기1 | 보기2"는 플레이어 선택지이고, 이어지는 줄 앞에 "1) "이나 "2) "를 붙이면 그 선택을 했을 때만 나온다. 플레이어 대사는 "${T('player')}: "로 쓰고, 플레이어를 부를 때는 보통 호칭 "${T('player')}"을 그대로 쓰며, 이름을 불러야 할 때만 {${T('player')}}으로 쓴다. 배경, 소품, 음악, 효과음은 가능한 한 기존 목록의 이름을 그대로 쓴다. 기존 인물이 적으로 나오거나 적이었던 인물이 동료가 되면 이름을 바꾸지 않고 같은 이름을 그대로 쓴다(그림이 이어지도록).`;}
function threadFmt(){return `메신저 형식(한 줄에 하나): "캐릭터이름: 메시지" / "선택: 답장1 | 답장2"는 플레이어 답장 선택지(고른 답장이 전송됨). 플레이어의 말은 반드시 선택지로만 쓰고 "나: 메시지"처럼 플레이어 대사를 직접 쓰지 않는다(플레이어가 멋대로 말하면 안 된다). 선택지 없이 플레이어 반응이 필요하면 선택지 1개짜리로 쓴다, 이어지는 줄 앞에 "1) " 같은 번호를 붙이면 그 답장을 골랐을 때만 나온다 / [사진: 소품 또는 배경 이름]은 사진 전송 / [스티커: 하트|땀|화남|놀람|의문|음표|눈물|홍조|반짝]은 감정 스티커(가끔만). 실제 메신저처럼 짧은 메시지를 여러 번 나눠 보내고, ㅋㅋ와 이모지를 써도 된다. 세계관과 메인 스토리의 사건, 떡밥을 자연스럽게 언급한다.`;}
pfDef('SCRIPT_FMT','대본 형식(스토리·이벤트·메모리얼 대본)',scriptFmt);
pfDef('THREAD_FMT','메신저(톡) 형식',threadFmt);
const TITLE_RULE_BASE="게임 이름은 요즘 서브컬처 가챠 게임처럼 짧고 느낌 있게 짓는다(실제 게임 이름은 쓰지 않는다): 2~4글자 한자어·합성어(예: 심연잔향, 성흔, 월하), 또는 영어 두 단어를 한글로 읽은 이름(예: 어비스 에코, 노바 레퀴엠). '~의 ~'처럼 풀어 쓴 이름이나 설명 같은 이름은 피한다. sub는 영문 제목(예: Abyss Echo). ";
pfDef('TITLE_RULE','게임 이름 짓기',()=>TITLE_RULE_BASE);
const NAI_CHAR_BASE='naiPrompt는 NovelAI용 영어 태그 문자열. "1girl, solo"(남자는 "1boy, solo")로 시작하고, 나이를 직접 나타내는 태그(mature female, adult woman 등)는 기본으로 넣지 않는다. 캐릭터 설정상 꼭 필요할 때만 스스로 판단해서 넣는다. V4 이상 모델 기준의 자연스러운 태그로 머리, 눈, 체형, 의상, 장신구, 들고 있는 무기 같은 외모 태그만 쓴다. 자세, 구도, 배경, 화풍 태그는 쓰지 않는다(앱이 따로 붙인다). 엘프처럼 귀가 뾰족한 종족이면 elf, pointy ears를 꼭 넣고, 사람이면 귀 모양 태그를 넣지 않는다(앱이 사람에게는 뾰족한 귀를 막는다). 의상·장신구·무기는 이 게임의 세계관·소속·직업·계급에 꼭 맞게 고르고, 세계관에 어울리지 않는 요소(현대 배경의 중세 갑옷, 판타지 배경의 교복·스마트폰 따위)는 쓰지 않는다. 무기를 든 모습을 넣을 때는 그 캐릭터의 전용 무기와 같은 무기만 쓴다. 아군·동료에게 적 전용 태그(faceless)는 쓰지 않는다.';
pfDef('NAI_CHAR','캐릭터 외모 태그(naiPrompt)',()=>NAI_CHAR_BASE);
pfDef('CHAR_STAT_RULE','새 캐릭터 능력치·외모 규칙(캐릭터 생성 4곳 공통)',()=>'희귀도가 높을수록 능력치 합이 높다. 지원형은 heal/shield/buff, 방어형은 체력과 방어가 높다. '+NAI_CHAR);
const EXPLORATION_NAME_RULE_BASE='탐사 콘텐츠 이름(terms.abyss)은 세계관에 어울리는 2~12자 이름으로 짓는다. 파티를 편성해 여러 구역에서 전투·발견·사건을 겪고 돌아오는 반복 탐사 콘텐츠다. 지하·심연을 전제하지 말고, 다른 메뉴 이름과 구분한다.';
pfDef('EXPLORATION_NAME_RULE','탐사 콘텐츠 이름',()=>EXPLORATION_NAME_RULE_BASE);
const JSON_STRICT_BASE='\n\n[중요] 응답 전체가 올바른 JSON 하나여야 한다. 문자열 안의 줄바꿈은 \\n으로, 큰따옴표는 \\"로 쓴다. 마지막 항목 뒤에 쉼표를 두지 않는다. JSON 앞뒤에 설명을 붙이지 않는다.';
pfDef('JSON_STRICT','JSON 출력 강조(모든 JSON 요청 끝)',()=>JSON_STRICT_BASE);
// ── 세계관·규칙
const POS_RULE_BASE='포지션은 4~8개, 세계관의 군 편제·직업·함종 같은 분류로 짓는다. base는 전투 기본형(atk 공격·def 방어·sup 지원). t는 기능 보정(%: hp atk def spd dmg 주는피해 taken 받는피해 heal 회복량 crit 치명타%p, sp 시작 SP 0~50, threat 위협도 -80~150). 보정은 -40~+40 안에서 장단점이 같이 있게.';
pfDef('POS_RULE','포지션(직군·함종) 설계',()=>POS_RULE_BASE);
const EXPEDITION_RULE_BASE='파견은 6개 — 이름·설명만 쓴다(실제 의뢰의 시간·인원·보상은 게임의 파견 게시판이 매일 정한다). expedition은 파견(원정) 방식이다: 전투·모험 세계관은 combat(지역에 보내 자원을 가져옴), 아이돌·연예계는 idol(방송·행사 출연), 방송인·크리에이터는 streamer(콘텐츠 제작), 가게·회사 경영은 business(파트에 배치해 영업). 세계관에 가장 맞는 하나를 고르고, dispatches 이름도 그 방식에 맞게 짓는다. expeditionNames는 고른 방식의 이름을 세계관에 맞게 짓는다(combat이면 비워 둔다). fame은 인기 수치 이름(idol의 인지도, streamer의 구독자, business의 평판에 해당). jobs는 idol이면 7개(작은 일→큰 무대 순으로 지역 방송·팬 사인회·광고 촬영·음악 방송·예능 고정·드라마 출연·단독 콘서트에 해당하는 일), streamer면 3개(긴 영상·생방송·짧은 영상에 해당하는 매체), business면 4개(손님 응대·만들기·홍보·관리에 해당하는 파트 — 세계관의 가게·사업 종류에 맞게, 식당을 전제하지 않는다). 각 2~10자.';
pfDef('EXPEDITION_RULE','파견(원정) 방식·이름(새 게임 세계관 단계)',()=>EXPEDITION_RULE_BASE);
pfDef('PROFILE_TPL_RULE','캐릭터 프로필 항목 틀(새 게임 세계관 단계)',()=>`profileTemplate은 캐릭터 프로필 항목 틀이다: ${Object.entries(PROFILE_TPLS).map(([k,v])=>`${k}(${v.slice(0,4).join('·')}${v.length>4?' …':''})`).join(', ')} 중 세계관에 맞는 하나를 고른다.`);
const VARIANT_RULE_BASE='variants는 같은 캐릭터의 다른 모습(특별 의상) 기본형 4~6개다: 교복·수영복·갑옷·무대의상처럼 여러 캐릭터에게 공통으로 입힐 수 있는 틀을 이 세계관에 맞게 짓는다(계절·행사·직업·의식 등). cond에는 그 틀이 어울리는 역할(atk/def/sup)·소속·속성만 넣고, 모두에게 어울리면 비운다. 위에서 정한 세력·속성 이름을 그대로 쓴다.';
pfDef('VARIANT_RULE','바리에이션 기본형(새 게임 세계관 단계)',()=>VARIANT_RULE_BASE);
// ── 세력·등장
const CAST_LOCK_RULE_BASE='첫 등장 장면이 정해진 대원은 그 장면에서만 처음 만난다. 정해진 장면이 없는 대원은 메인 스토리의 새 장을 쓸 때 이야기 흐름에 맞으면 첫 만남 장면으로 처음 등장시킨다. 이벤트·외전·메신저에서는 아직 만나지 않은 사이다.';
pfDef('CAST_LOCK_RULE','아직 등장하지 않은 대원 다루기(장·이벤트·톡)',()=>CAST_LOCK_RULE_BASE);
pfDef('FACTION_RULE','세력 설계 규칙(새 게임·세력 AI 채우기)',()=>'세력은 3~6개: 플레이어블 소속(kind playable) 1~3개, 적대 세력(hostile) 1개 이상, 적 몬스터의 근원이 되는 괴물·마물 무리(monster) 1개 이상(사람 세력만인 세계관이면 생략 가능), 중립(neutral) 0~2개. 세력마다 개요 3~4문장·목적·지도자·거점·이념·숨겨진 사실, 다른 세력과의 관계(rel: {"세력 이름":"관계 한 단어 — 이유"}). 몬스터 무리는 정체·기원(origin)·습성(nature)·약점(weakness). 처음엔 적대였다가 나중에 우호가 되는(또는 반대) 세력이 있으면 stance에 [{"ch":장 번호,"s":"ally|neutral|hostile","why":""}]. 몬스터는 말하는 동료·NPC가 아니다.');
pfDef('CAST_DEBUT_RULE','새 게임 대원의 첫 등장(debut)·소속',()=>`각 ${T('crew')}에 debut 항목: "start"(처음부터 함께하는 동료 — 프롤로그에서 처음 만나 1장부터 이미 아는 사이로 나오고 처음부터 뽑을 수 있음, 4~6명), 1장 스테이지 번호(그 스테이지에서 처음 만나는 인물 — 그 스테이지를 깨야 뽑기에 합류), "later"(2장 이후 첫 등장 — 그때까지 뽑기에 안 나옴). faction은 세력 목록 중 플레이어블 소속(또는 stance로 나중에 우호가 되는 세력)의 이름을 그대로 쓰고, 그 세력들 사이에서 고르게 나눈다. 몬스터·괴물은 ${T('crew')}으로 만들지 않는다.`);
const CAST_PLAN_RULE_BASE='등장 계획을 반드시 지킨다: 처음부터 함께하는 동료는 프롤로그에서 처음 만나고 1장부터는 이미 아는 사이다(1장에 첫 만남 장면으로 쓰지 않는다). 1장에서 처음 만나는 인물은 정해진 스테이지에서 처음 등장하고 그 전에는 나오지 않는다. 나중 등장 인물은 프롤로그와 1장에 내지 않는다.';
pfDef('CAST_PLAN_RULE','등장 계획 지키기(새 게임 오프닝·1장)',()=>CAST_PLAN_RULE_BASE);
const BESTIARY_RULE_BASE='적은 세력 목록의 적대·괴물 세력에 속하게 하고(faction), bestiary에 새 적(사람·캐릭터가 아닌 적)마다 정체·습성·약점을 쓴다. 몬스터는 말하는 동료·NPC가 아니다.';
pfDef('BESTIARY_RULE','적 소속·적 도감(새 게임 1장)',()=>BESTIARY_RULE_BASE);
const CAST_RARITY_RULE_BASE='희귀도는 R이 가장 많게 한다 — 뽑기·영입의 대부분이 R이라 R이 1~2명뿐이면 같은 대원만 되풀이해 나온다.';
pfDef('CAST_RARITY_RULE','새 게임 대원 희귀도 분포',()=>CAST_RARITY_RULE_BASE);
// ── 스토리·연출
pfDef('DIRECTION_GUIDE','연출 문법(감정 아이콘·동작·화면 효과)',()=>`연출: 이름 뒤 대괄호에 표정·감정·동작을 |로 함께 쓸 수 있다(예: "세라[미소|하트|점프]: 정말?"). 감정 아이콘: ${Object.keys(EMOTES).join('·')}. 동작: 점프·흔들·떨림·끄덕·갸웃·다가옴·물러남·퇴장·쓰러짐. 대사 없이 [연출: 이름 감정 동작]. 화면 효과: [효과: 흔들림|강한흔들림|플래시|붉은섬광|암전|페이드|집중선|비|눈|벚꽃|회상|비네트] (집중선·비·눈·벚꽃·회상·비네트는 [효과: 비 끝]처럼 끝을 쓴다). 메신저에서는 [스티커: 감정 아이콘 이름]. 감정이 크게 움직이는 순간에만 쓰고 남발하지 않는다.`);
const PLAN_WRITE_RULE_BASE='이 장의 분기가 있다면 장 전체에서 한 번만, 전체 구성에서 그 선택이 일어나는 스테이지에서만 쓴다.';
pfDef('PLAN_WRITE_RULE','시나리오 설계의 분기 쓰기(스테이지 집필)',()=>PLAN_WRITE_RULE_BASE);
const FINALE_RULE_BASE='finale(장의 마지막 스테이지 형식)은 장르에 맞게 정한다: 전투가 중심인 세계관이면 battle(마지막 스테이지는 반드시 보스전, battle:true), 무대·투표로 경쟁하면 contest(결승 콘테스트, mode "contest", enemies는 빈 배열), 논쟁·협상·재판이 중심이면 debate(결정적인 회담, mode "debate", enemies는 빈 배열).';
pfDef('FINALE_RULE','장의 마지막 스테이지 형식(장르에 따라)',()=>FINALE_RULE_BASE);
const STAGE_WRITE_RULE_BASE='회담·콘테스트 스테이지는 그 전(pre)과 후(post)만 대본으로 쓴다. 회담 자체(추궁·증거·설득)와 콘테스트의 무대 경연(매력 어필·심사)은 게임이 진행하므로 대본에 쓰지 않는다.';
pfDef('STAGE_WRITE_RULE','회담·콘테스트 스테이지의 대본 범위(스테이지 집필)',()=>STAGE_WRITE_RULE_BASE);
pfDef('STAGE_MODES','스테이지 양식(전투·이야기·회담·콘테스트) 고르기',()=>{ const m=modesCfg(); if(!m.debate&&!m.contest) return '스테이지는 battle(전투) 또는 이야기 스테이지만 쓴다.'; return `스테이지 양식(mode): 대부분은 battle(전투). 이야기에 맞으면 한 장에 0~2개를 다른 양식으로${m.debate?'':'(debate는 쓰지 않는다)'}${m.contest?'':'(contest는 쓰지 않는다)'}: debate(회담 — 협상·재판·심문·설득·거짓말 들추기 장면. 상대의 주장 줄 3~5개 중 모순이 있는 줄에 weak=그 모순을 밝히는 증거 id, 또는 persuade={who:설득할 수 있는 ${T('crew')} 이름,text}. 증거는 앞선 이야기에서 얻은 물건·증언·기록으로 3~5개. 라운드 1~3개), contest(콘테스트 — 축제·오디션·무대·대회·사교 파티. 심사위원 1~3명과 각자 좋아하는 매력 likes(${Object.keys(CHARM).join('|')}), 경쟁자 1~3명 power 0.8~1.3). battle:false인 이야기 스테이지도 섞을 수 있다. 회담·콘테스트 스테이지는 enemies를 빈 배열로 둔다.`; });

/* 그림 프롬프트 가드: 사람이 나오면 안 되는 그림에서 사람 태그를 빼요 */
const IMG_NOHUMAN={bg:'no humans, scenery',map:'no humans, scenery',prop:'no humans, object focus',icon:'no humans, object focus'};
const PERSON_TAG=/^(\d+\+?(girls?|boys?|others?)|solo|solo focus|multiple (girls|boys|others)|couple|crowd|people|person|human|character|girl|boy|woman|man|female|male|child|loli|shota|.* (hair|eyes|pupils|ears|bangs|sidelocks|ahoge)|(long|short|medium|very long) hair|ponytail|twintails|braids?|hair (ornament|ribbon|bun|between eyes)|bangs|smile|smiling|blush|open mouth|closed mouth|closed eyes|expressionless|.*(face|lips|teeth|tongue)|looking at viewer|looking (back|away|up|down)|standing|sitting|kneeling|lying|walking|running|arms? (up|crossed|behind back|at sides)|hands? (up|on hips)|holding.*|(full|upper|lower) body|cowboy shot|portrait|close-up|from (behind|side)|breasts|.*(breasts|thighs|legs|arms|navel|cleavage)|thighhighs|pantyhose|bare (shoulders|legs|arms)|.* (dress|skirt|shirt|uniform|jacket|coat|gloves|boots|stockings))$/i;
function imgGuard(kind,s){ const k=kind==='weapon'?'prop':kind, pre=IMG_NOHUMAN[k]; if(!pre) return {out:String(s||''),removed:[]};
  const removed=[], keep=tagList(s).filter(t=>{ const x=tagKey(t); if(PERSON_TAG.test(x)&&!(k==='prop'&&/(dress|skirt|shirt|uniform|jacket|coat|gloves|boots|ribbon|hair ornament)$/.test(x))){ removed.push(t); return false; } return true; });
  return {out:joinTags(pre,keep.join(', ')),removed}; }

/* 교훈(정정 기록 → 다음부터 지침으로) */
const PL_KEY='ggm-plessons';
const PL_SEED={
 'img-person-bg':{scope:'img',rule:'배경(backgrounds·배경 프롬프트)은 사람이 없는 풍경이다. "no humans, scenery"로 시작하고 장소·시간·날씨·조명·사물 태그만 쓴다. 1girl, solo, 머리·눈·의상·표정·자세 태그를 쓰지 않는다.'},
 'img-person-prop':{scope:'img',rule:'소품·아이템·무기 프롬프트는 물건 하나만 그린다. "no humans, object focus"로 시작하고 재질·모양·색·장식 태그만 쓴다. 들고 있는 사람(holding, 1girl, hands)이나 인물 태그를 쓰지 않는다.'},
 'img-person-map':{scope:'img',rule:'지도 그림은 사람 없는 지도·조감도다. "no humans, scenery"로 시작한다.'},
 'img-person-icon':{scope:'img',rule:'아이콘은 사람 없는 물건 하나다. "no humans, object focus"로 시작한다.'}};
function plList(){ try{ const a=JSON.parse(appStorage.getItem(PL_KEY)||'[]'); return Array.isArray(a)?a:[]; }catch(e){ return []; } }
function plSave(a){ try{ appStorage.setItem(PL_KEY,JSON.stringify(a.slice(0,60))); }catch(e){} }
function plHit(id,ex){ const a=plList(); let x=a.find(l=>l.id===id); if(!x){ const s=PL_SEED[id]; if(!s) return; x={id,scope:s.scope,rule:s.rule,on:true,hits:0,at:Date.now(),auto:true}; a.unshift(x); } x.hits=(x.hits||0)+1; x.last=Date.now(); if(ex) x.ex=String(ex).slice(0,160); plSave(a); }
function plAdd(rule,scope){ const a=plList(); a.unshift({id:'u'+uid().slice(0,6),scope:scope==='all'?'all':'img',rule:String(rule).trim().slice(0,400),on:true,hits:0,at:Date.now()}); plSave(a); }
// llmWrap에서 씀: 그림 태그 요청이면 그림 가이드 + 그림 교훈, 모든 요청에 scope:'all' 교훈
function plInject(isTag){ const on=plList().filter(l=>l.on&&(l.scope==='all'||isTag)); const g=isTag?IMG_GUIDE:''; if(!on.length&&!g) return ''; return `[프롬프트 교훈] 이전에 고친 실수를 되풀이하지 않는다:\n${g?g+'\n':''}${on.map(l=>'- '+l.rule).join('\n')}\n`; }
pfDef('IMG_GUIDE','그림 태그 공통 가이드(그림 태그를 쓰는 모든 요청에 자동으로 들어감)',()=>'- 그림 종류마다 태그 대상이 다르다. 캐릭터(naiPrompt)=외모만. CG=장소·구도·행동·분위기(외모 제외). 배경=사람 없는 풍경("no humans, scenery"로 시작). 소품·아이템·무기·아이콘=물건 하나("no humans, object focus"로 시작, 사람·손·holding 금지).\n- 태그는 쉼표로 나눈 영어 Danbooru 태그. 문장·한국어·설명을 쓰지 않는다.','llmWrap');

/* 그림 프롬프트 점검: 자료실(배경·소품)과 무기 프롬프트에서 사람 태그 찾기 */
function imgAuditScan(){ const out=[]; G.lib.forEach(l=>{ if(IMG_NOHUMAN[l.kind]&&l.prompt){ const g=imgGuard(l.kind,l.prompt); if(g.removed.length) out.push({o:l,kind:l.kind,name:l.name,cur:l.prompt,fix:g.out,removed:g.removed}); } });
  G.chars.forEach(c=>{ if(c.weapon&&c.weapon.prompt){ const g=imgGuard('prop',c.weapon.prompt); if(g.removed.length||wpBad(c.weapon.prompt)) out.push({o:c,kind:'weapon',name:c.name+' · '+(c.weapon.name||T('weapon')),cur:c.weapon.prompt,fix:g.out,removed:g.removed}); } }); return out; }
function imgAuditFix(list){ auditSnap(list.map(x=>x.o),'그림 프롬프트 정리'); list.forEach(x=>{ if(x.kind==='weapon'){ x.o.weapon.prompt=x.fix; mark('c:'+x.o.id); } else { x.o.prompt=x.fix; mark('l:'+x.o.id); } plHit('img-person-'+(x.kind==='weapon'?'prop':x.kind),x.cur); }); return list.length; }

/* AI 기록 분석: 실패가 잦은 단계와 오류 */
function aiLogStats(){ const by={}; AILOG.forEach(e=>{ const k=e.stage||'기타', o=by[k]||(by[k]={stage:k,n:0,fail:0,errs:{}}); o.n++; if(!e.ok){ o.fail++; const m=String(e.err||'오류').slice(0,60); o.errs[m]=(o.errs[m]||0)+1; } }); return Object.values(by).sort((a,b)=>b.fail-a.fail||b.n-a.n); }

/* 화면 */
let PS_TAB='frag';
function promptPanel(){ const ov=Object.keys(promptOv()).length, pl=plList().filter(l=>l.on).length, bad=imgAuditScan().length;
  return `<div class="panel pm-hide"><h3>프롬프트 스튜디오 ${bad?`<span class="badge">그림 ${bad}</span>`:''}</h3><p class="muted" style="margin:0 0 6px">AI에 보내는 프롬프트 조각 ${Object.keys(window.__PF||{}).length}개${ov?` · 고친 조각 ${ov}`:''} · 교훈 ${pl}개. 조각을 고치고 다듬거나, 그림 프롬프트(배경·소품에 사람이 나오는 문제 등)를 점검·정정하고, 고친 내용을 교훈으로 쌓아 반복을 막아요.</p><button class="btn sm" data-act="pstopen">프롬프트 스튜디오</button></div>`; }
function openStudio(tab){ if(tab) PS_TAB=tab; const tabs=[['frag','조각'],['img','그림 점검'],['lesson','교훈'],['log','AI 기록']], ov=promptOv();
  let body='';
  if(PS_TAB==='frag') body=Object.values(window.__PF||{}).map(f=>{ const o=ov[f.id]||{}; return `<details class="panel" style="padding:8px;margin:6px 0"><summary><b>${esc(f.label)}</b> <span class="muted">${esc(f.id)}${o.text?' · 덮어씀':''}${o.add?' · 덧붙임':''}</span></summary>
    <div style="font-size:.78rem;margin:6px 0 2px">기본</div><pre style="white-space:pre-wrap;font-size:.75rem;max-height:140px;overflow:auto;margin:0">${esc(f.get())}</pre>
    <label class="f">덮어쓰기 (비우면 기본)</label><textarea class="in" rows="3" data-pf="${f.id}" data-k="text">${esc(o.text||'')}</textarea>
    <label class="f">덧붙이기 (기본 뒤에 추가)</label><textarea class="in" rows="2" data-pf="${f.id}" data-k="add">${esc(o.add||'')}</textarea>
    <div class="row" style="gap:6px;margin-top:6px"><button class="btn sm" data-act="pstsave" data-id="${f.id}">저장</button><button class="btn sm ghost" data-act="pstai" data-id="${f.id}">AI로 다듬기 제안</button>${o.text||o.add?`<button class="btn sm ghost" data-act="pstreset" data-id="${f.id}">기본으로</button>`:''}</div></details>`; }).join('');
  else if(PS_TAB==='img'){ const L=imgAuditScan(); body=`<p class="muted" style="font-size:.82rem">배경·소품·지도·아이콘·${T('weapon')} 그림에는 사람이 나오면 안 돼요. 성능이 낮은 AI가 이런 프롬프트에 인물 태그(1girl, 머리·눈·의상)를 섞으면 모두 사람 그림이 돼요. 그릴 때는 앱이 항상 걸러 내지만(그림 가드), 저장된 프롬프트도 정리해 두면 좋아요. 정리하면 교훈으로 기록돼 다음 생성부터 AI에 주의를 줘요.</p>
    ${L.length?L.map(x=>`<div class="panel" style="padding:8px;margin:6px 0;font-size:.8rem"><b>${esc(x.name)}</b> <span class="muted">${esc(x.kind)}</span><div class="muted">지금: ${esc(x.cur)}</div><div>정리: ${esc(x.fix)}</div>${x.removed.length?`<div style="color:var(--bad,#c55)">뺄 태그: ${esc(x.removed.join(', '))}</div>`:''}</div>`).join('')+`<button class="btn" data-act="pstimgfix">모두 정리 (${L.length})</button>`:'<p>문제 있는 그림 프롬프트가 없어요 ✓</p>'}${AUDIT_UNDO?`<button class="btn ghost" data-act="pstundo">되돌리기: ${esc(AUDIT_UNDO.label)}</button>`:''}`; }
  else if(PS_TAB==='lesson'){ const L=plList(); body=`<p class="muted" style="font-size:.82rem">고친 실수를 규칙으로 쌓아 두는 곳이에요. 켜진 교훈은 AI 요청에 자동으로 들어가요(그림: 그림 태그를 쓰는 요청에만, 전체: 모든 요청). 그림 가드가 태그를 걸러 낼 때마다 해당 교훈의 횟수가 올라가요.</p>
    ${L.map(l=>`<div class="ep"><label style="display:flex;gap:8px;align-items:center;flex:1;min-width:0"><input type="checkbox" data-act="pstltog" data-id="${l.id}" ${l.on?'checked':''}><span class="t"><b>${l.scope==='all'?'전체':'그림'}${l.hits?` · ${l.hits}번 고침`:''}</b><span class="muted">${esc(l.rule)}</span></span></label><button class="btn sm ghost" data-act="pstldel" data-id="${l.id}">✕</button></div>`).join('')||'<p class="muted">아직 교훈이 없어요</p>'}
    <label class="f" style="margin-top:8px">교훈 추가 (AI가 자꾸 하는 실수와 바른 방법)</label><textarea class="in" id="pl_new" rows="2" placeholder="예: 적 이름에 실제 게임 캐릭터 이름을 쓰지 않는다"></textarea><div class="row" style="gap:6px;margin-top:6px"><select class="in" id="pl_scope" style="max-width:140px"><option value="img">그림 요청</option><option value="all">모든 요청</option></select><button class="btn sm" data-act="pstladd">추가</button></div>`; }
  else { const S=aiLogStats(); body=`<p class="muted" style="font-size:.82rem">최근 AI 요청 ${AILOG.length}건. 실패가 잦은 단계는 조각을 고치거나 교훈을 더하거나, 글 AI 단계별 모델을 바꿔 보세요.</p>${S.length?`<table style="width:100%;font-size:.8rem"><tr><th align="left">단계</th><th>요청</th><th>실패</th><th align="left">주요 오류</th></tr>${S.map(s=>`<tr><td>${esc(s.stage)}</td><td align="center">${s.n}</td><td align="center">${s.fail}</td><td>${esc(Object.entries(s.errs).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([m,n])=>m+(n>1?' ×'+n:'')).join(' / '))}</td></tr>`).join('')}</table>`:'<p class="muted">기록이 없어요</p>'}<div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="ailog">AI 기록 자세히</button></div><h3 class="sec">조용히 넘어간 오류 (${QUIET.length})</h3>${QUIET.length?`<div style="font-size:.78rem;max-height:200px;overflow:auto">${QUIET.map(q=>`<div><span class="muted">${esc(new Date(q.at).toLocaleTimeString())} ${esc(q.where)}</span> ${esc(q.msg)}</div>`).join('')}</div>`:'<p class="muted" style="font-size:.8rem">없어요</p>'}`; }
  openModal(`${head('프롬프트 스튜디오','<button class="linkb" type="button" data-act="llmopen">글 AI 지침(상단·중단·하단·그림 태그)</button>')}<div class="row" style="gap:4px;margin-bottom:8px">${tabs.map(([k,l])=>`<button class="btn sm ${PS_TAB===k?'':'ghost'}" data-act="psttab" data-k="${k}">${l}</button>`).join('')}</div>${body}<div class="row" style="margin-top:12px"><button class="btn ghost" data-act="close">닫기</button></div>`); }
function pfSet(id,o){ const m=G.meta; m.prompts=m.prompts||{}; if(o&&(o.text||o.add)) m.prompts[id]={text:o.text||'',add:o.add||''}; else delete m.prompts[id]; mark('meta'); }
document.addEventListener('click',async e=>{ const b=e.target.closest('[data-act]'); if(!b) return; const a=b.dataset.act, id=b.dataset.id, v=k=>(document.querySelector(`#modal [data-pf="${id}"][data-k="${k}"]`)||{}).value||'';
  if(a==='pstopen') openStudio();
  else if(a==='psttab') openStudio(b.dataset.k);
  else if(a==='pstsave'){ pfSet(id,{text:v('text').trim(),add:v('add').trim()}); toast('조각을 저장했어요'); openStudio(); }
  else if(a==='pstreset'){ pfSet(id,null); toast('기본으로 되돌렸어요'); openStudio(); }
  else if(a==='pstai'){ if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; } const f=window.__PF[id], fails=aiLogStats().filter(s=>s.fail).slice(0,3).map(s=>s.stage+': '+Object.keys(s.errs).join('/')).join('; '), less=plList().filter(l=>l.on).map(l=>l.rule).join(' / ');
    const r=await aiJSON(`다음은 가챠 게임 제작 앱이 AI에 보내는 프롬프트 조각 「${f.label}」이다. 성능이 낮은 AI도 오해 없이 따르도록 다듬어라: 모호한 말을 구체적으로, 금지와 허용을 분명히, 예시는 짧게, 같은 말 반복은 줄이고, 원래 의도와 규칙은 모두 지킨다.${less?' 지금까지 쌓인 교훈: '+less+'.':''}${fails?' 최근 실패: '+fails+'.':''}\n\n원문:\n${promptFrag(id)}\n\nJSON만 출력: {"text":"다듬은 조각 전체","why":"무엇을 왜 바꿨는지 한두 문장"}`,b,'complex');
    if(r&&r.text){ const el=document.querySelector(`#modal [data-pf="${id}"][data-k="text"]`); if(el){ el.value=String(r.text); el.closest('details').open=true; } toast('제안을 덮어쓰기 칸에 넣었어요. 확인 후 저장하세요'+(r.why?' — '+String(r.why).slice(0,80):'')); } }
  else if(a==='pstimgfix'){ const n=imgAuditFix(imgAuditScan()); toast(`그림 프롬프트 ${n}개를 정리하고 교훈으로 기록했어요`); openStudio(); }
  else if(a==='pstundo'){ auditUndo(); G.lib.forEach(l=>mark('l:'+l.id)); openStudio(); }
  else if(a==='pstltog'){ const L=plList(), x=L.find(l=>l.id===id); if(x){ x.on=b.checked; plSave(L); } }
  else if(a==='pstldel'){ plSave(plList().filter(l=>l.id!==id)); openStudio(); }
  else if(a==='pstladd'){ const t=($('#pl_new')||{}).value||''; if(!t.trim()){ toast('교훈 내용을 써 주세요'); return; } plAdd(t,($('#pl_scope')||{}).value); toast('교훈을 추가했어요'); openStudio(); } });
