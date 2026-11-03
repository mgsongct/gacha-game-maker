# 생성 프롬프트 점검 (프롬프트 스튜디오 관점)

생성: `node tools/play/prompts.mjs --regress` · 프롬프트: regress/prompts · 2026-11-03T12:06 · 대상: idol-audition(앙코르 시그널), sky-knights(게일 크레스트)

스튜디오 조각(`pfDef`)은 설정 → 프롬프트 스튜디오에서 게임마다 덮어쓰기·덧붙이기할 수 있는 부분입니다. 공통 규칙(`RULES`)과 스킬 작성 규칙(`GGMCombat.prompt()`)은 조각이 아니라 고칠 수 없습니다.

## idol-audition — 앙코르 시그널

- 조각 24개(사용된 요청 수): BATTLE_FLOW 207자(0), SCRIPT_FMT 985자(2), THREAD_FMT 380자(1), TITLE_RULE 190자(1), NAI_CHAR 523자(1), CHAR_STAT_RULE 584자(0), EXPLORATION_NAME_RULE 127자(1), JSON_STRICT 107자(0), IMG_GUIDE 221자(3), POS_RULE 206자(1), CAST_RARITY_RULE 62자(1), EXPEDITION_RULE 574자(1), CAST_LOCK_RULE 125자(0), FACTION_RULE 381자(1), CAST_DEBUT_RULE 287자(1), CAST_PLAN_RULE 160자(2), BESTIARY_RULE 102자(1), PROFILE_TPL_RULE 194자(1), DIRECTION_GUIDE 317자(2), PLAN_WRITE_RULE 56자(0), FINALE_RULE 212자(2), STAGE_WRITE_RULE 103자(0), STAGE_MODES 412자(1), VARIANT_RULE 197자(1)
- 스튜디오 밖 정적 덩어리: 공통 규칙 RULES 332자 · 스킬 작성 규칙 10462자

| 요청 | 길이(자) | 조각 비율 | 조각 | RULES | 스킬 규칙 | 고정 덩어리 비율 | "JSON만 출력" 횟수 | 샘플 이름 |
|---|---|---|---|---|---|---|---|---|
| chapter1 | 11255 | 25% | SCRIPT_FMT THREAD_FMT IMG_GUIDE CAST_PLAN_RULE BESTIARY_RULE DIRECTION_GUIDE FINALE_RULE STAGE_MODES | 예 |  | 3% | 2 | 10 |
| chars | 18035 | 6% | NAI_CHAR IMG_GUIDE CAST_RARITY_RULE CAST_DEBUT_RULE | 예 | 예 | 60% | 2 | 3 |
| opening | 8384 | 20% | SCRIPT_FMT IMG_GUIDE CAST_PLAN_RULE DIRECTION_GUIDE | 예 |  | 4% | 2 | 10 |
| world | 5046 | 41% | TITLE_RULE EXPLORATION_NAME_RULE POS_RULE EXPEDITION_RULE FACTION_RULE PROFILE_TPL_RULE FINALE_RULE VARIANT_RULE |  |  | 0% | 2 | 3 |

### 여러 요청에 되풀이되는 긴 줄 (재사용·캐싱 후보)

| 길이 | 요청 수 | 어디서 | 첫머리 |
|---|---|---|---|
| 2120 | 2 | 하드코딩 | 멤버: 차하린(SSR, 새벽별 엔터테인먼트, 열정속성 퍼포머, 새벽별 엔터테인먼트의 센터 지망 연습생. 데뷔 직전까지 갔던 경 |
| 985 | 2 | SCRIPT_FMT | 대본은 하나의 문자열이고 줄마다 줄바꿈(\n)으로 나눈다(쉼표로 잇거나 배열로 쓰지 않는다). 대본 형식(한 줄에 하나): " |
| 611 | 2 | 하드코딩 | 메인 플롯(작가용 비밀 설정 포함): 새벽별의 연습생들은 첫 순위 발표에서 최하위권을 기록하며 팀 내 센터 자리와 방향성을 두 |
| 525 | 2 | 하드코딩 | - 새벽별 엔터테인먼트 [플레이어블 소속 · 지금 플레이어와 우호]: 망원동 상가 3층의 연습실 하나로 시작한 신생 기획사다. |
| 332 | 3 | RULES(조각 아님) | 플레이어(실장님)의 성별은 정하지 않는다. 성별이 드러나는 호칭은 피한다. 플레이어(실장님)의 외모: 단정한 셔츠에 사원증을  |
| 495 | 2 | 하드코딩 | - 시그널 팬연합 [중립 · 지금 플레이어와 중립 · 3장부터 우호 예정(새벽별의 진심 어린 무대에 반한 회원들이 생겨나며 공 |
| 473 | 2 | 하드코딩 | - 오로라TV 스타라인 제작국 [중립 · 지금 플레이어와 중립 · 5장부터 적대 예정(실장님이 투표 보정의 흔적을 쫓기 시작하 |
| 435 | 2 | 하드코딩 | 상세 설정: 10년 전 첫 시즌 이후 「스타라인」은 아이돌이 되는 가장 빠른 길이자 유일한 길처럼 여겨진다. 매 회차 연습생들 |
| 432 | 2 | 하드코딩 | - 크라운 엔터테인먼트 [적대 세력 · 지금 플레이어와 적대]: 매 시즌 데뷔조 과반을 배출해 온 업계 1위 대형 기획사다.  |
| 399 | 2 | 하드코딩 | - 블랙 렌즈 [적대 세력 · 지금 플레이어와 적대]: 연습생의 과거와 사생활을 캐내 영상으로 퍼뜨리는 폭로 채널 집단이다.  |
| 173 | 3 | IMG_GUIDE | - 그림 종류마다 태그 대상이 다르다. 캐릭터(naiPrompt)=외모만. CG=장소·구도·행동·분위기(외모 제외). 배경=사 |
| 160 | 2 | 하드코딩 | 게임 "앙코르 시그널". 세계관 "스타라인의 서울": 국민 투표로 데뷔조를 뽑는 서바이벌 오디션 「스타라인」이 모든 화제를 삼 |
| 160 | 2 | CAST_PLAN_RULE | 등장 계획을 반드시 지킨다: 처음부터 함께하는 동료는 프롤로그에서 처음 만나고 1장부터는 이미 아는 사이다(1장에 첫 만남 장 |

### 충돌하는 지시

- 없음


## sky-knights — 게일 크레스트

- 조각 24개(사용된 요청 수): BATTLE_FLOW 207자(0), SCRIPT_FMT 988자(2), THREAD_FMT 380자(1), TITLE_RULE 190자(1), NAI_CHAR 523자(1), CHAR_STAT_RULE 584자(0), EXPLORATION_NAME_RULE 127자(1), JSON_STRICT 107자(0), IMG_GUIDE 221자(3), POS_RULE 206자(1), CAST_RARITY_RULE 62자(1), EXPEDITION_RULE 574자(1), CAST_LOCK_RULE 125자(2), FACTION_RULE 381자(1), CAST_DEBUT_RULE 287자(1), CAST_PLAN_RULE 160자(2), BESTIARY_RULE 102자(1), PROFILE_TPL_RULE 194자(1), DIRECTION_GUIDE 317자(2), PLAN_WRITE_RULE 56자(0), FINALE_RULE 212자(2), STAGE_WRITE_RULE 103자(0), STAGE_MODES 412자(1), VARIANT_RULE 197자(1)
- 스튜디오 밖 정적 덩어리: 공통 규칙 RULES 334자 · 스킬 작성 규칙 10462자

| 요청 | 길이(자) | 조각 비율 | 조각 | RULES | 스킬 규칙 | 고정 덩어리 비율 | "JSON만 출력" 횟수 | 샘플 이름 |
|---|---|---|---|---|---|---|---|---|
| chapter1 | 12486 | 23% | SCRIPT_FMT THREAD_FMT IMG_GUIDE CAST_LOCK_RULE CAST_PLAN_RULE BESTIARY_RULE DIRECTION_GUIDE FINALE_RULE STAGE_MODES | 예 |  | 3% | 2 | 9 |
| chars | 18426 | 6% | NAI_CHAR IMG_GUIDE CAST_RARITY_RULE CAST_DEBUT_RULE | 예 | 예 | 59% | 2 | 3 |
| opening | 9615 | 19% | SCRIPT_FMT IMG_GUIDE CAST_LOCK_RULE CAST_PLAN_RULE DIRECTION_GUIDE | 예 |  | 3% | 2 | 9 |
| world | 5041 | 41% | TITLE_RULE EXPLORATION_NAME_RULE POS_RULE EXPEDITION_RULE FACTION_RULE PROFILE_TPL_RULE FINALE_RULE VARIANT_RULE |  |  | 0% | 2 | 3 |

### 여러 요청에 되풀이되는 긴 줄 (재사용·캐싱 후보)

| 길이 | 요청 수 | 어디서 | 첫머리 |
|---|---|---|---|
| 2270 | 2 | 하드코딩 | 단원: 카시아(SSR, 질풍문장 기사단, 질풍속성 선봉, 옛 질풍문장 기사단 총장의 마지막 종자였던 기사. 기사단이 해산된 뒤 |
| 988 | 2 | SCRIPT_FMT | 대본은 하나의 문자열이고 줄마다 줄바꿈(\n)으로 나눈다(쉼표로 잇거나 배열로 쓰지 않는다). 대본 형식(한 줄에 하나): " |
| 701 | 2 | 하드코딩 | 메인 플롯(작가용 비밀 설정 포함): 부유석은 아득한 옛날 운해를 헤엄치던 거대한 하늘고래 '천경'들의 굳은 심장이며, 군도의 |
| 615 | 2 | 하드코딩 | - 와류수 [괴물·마물 · 지금 플레이어와 적대]: 잿빛 폭풍 '아가리'가 지나간 자리에 나타나는 괴물 무리다. 기류와 번개, |
| 561 | 2 | 하드코딩 | - 검은 돛 공적단 [적대 세력 · 지금 플레이어와 적대 · 3장부터 우호 예정(선장 로웬이 옛 부단장임이 밝혀지고, 의회라는 |
| 532 | 2 | 하드코딩 | 상세 설정: 아주 오래전 지상은 끝없는 구름의 바다 '운해' 아래로 가라앉았고, 살아남은 사람들은 부유석이 박힌 섬 위에서 하 |
| 503 | 2 | 하드코딩 | - 질풍문장 기사단 [플레이어블 소속 · 지금 플레이어와 우호]: 삼백 년 동안 아스테른 군도의 항로를 지켜 온 기사단이다.  |
| 334 | 3 | RULES(조각 아님) | 플레이어(기사단장)의 성별은 정하지 않는다. 성별이 드러나는 호칭은 피한다. 플레이어(기사단장)의 외모: 바람에 해진 기사단  |
| 486 | 2 | 하드코딩 | - 백운 의회 [적대 세력 · 지금 플레이어와 적대]: 수도섬 아우렐리아를 다스리며 군도 전체의 부유석 거래와 항로 허가를 쥔 |
| 441 | 2 | 하드코딩 | - 황동 상회 연합 [플레이어블 소속 · 지금 플레이어와 우호]: 자유항 코그웰을 중심으로 비행선 조선소와 공방, 상인들이 모 |
| 425 | 2 | 하드코딩 | - 운해 순례회 [중립 · 지금 플레이어와 중립]: 종루섬 에코벨에 모여 사는 순례자 공동체다. 폭풍을 하늘이 내리는 심판이라 |
| 173 | 3 | IMG_GUIDE | - 그림 종류마다 태그 대상이 다르다. 캐릭터(naiPrompt)=외모만. CG=장소·구도·행동·분위기(외모 제외). 배경=사 |
| 181 | 2 | 하드코딩 | 게임 "게일 크레스트". 세계관 "아스테른 군도": 수백 개의 하늘섬이 부유석의 힘으로 떠 있는 아스테른 군도에, 섬을 통째로 |
| 160 | 2 | CAST_PLAN_RULE | 등장 계획을 반드시 지킨다: 처음부터 함께하는 동료는 프롤로그에서 처음 만나고 1장부터는 이미 아는 사이다(1장에 첫 만남 장 |
| 125 | 2 | CAST_LOCK_RULE | 첫 등장 장면이 정해진 대원은 그 장면에서만 처음 만난다. 정해진 장면이 없는 대원은 메인 스토리의 새 장을 쓸 때 이야기 흐 |

### 충돌하는 지시

- 없음


