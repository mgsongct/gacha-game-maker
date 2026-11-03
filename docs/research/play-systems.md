# 플레이 시스템: 경제·성장·전투 다양성·소리 (제안 단계)

생성된 게임은 모두 같은 엔진으로 돌아가서, 엔진의 빈틈은 **모든 게임의 빈틈**이 됩니다. 성장·경제·전투·사이드·소리 파트를 점검한 결과와 코어 루프 조사입니다. 뽑기는 [gacha-fairness.md](gacha-fairness.md), 이야기·VN은 [narrative-quality.md](narrative-quality.md), 종합은 [maker-review.md](maker-review.md).

## 1. 현황 조사 (빌드 2026.11.03.17)

### 1-1. 지금 있는 것

| 파트 | 내용 | 위치 |
|---|---|---|
| 성장 | Lv 1~70(승급 5단계) → 71~120(초월승급, `transc` 1단계당 상한 +10), 무기 5단계, 스킬 훈련, 호감도 10단계 | `0090-growth.js` |
| 행동력 | 최대 **240**, **5분에 1** 회복(가득 차는 데 20시간), 충전(`STAM_FILL`) | `0090:12~16` |
| 일일·주기 | 일일 미션 6종(출석·전투 3회·뽑기 1회·파견·로비 터치 5회·강화), 시즌 패스 30단계(매월 초기화), 일일 보급, 무료 보급 상점, 우편 | `MISSIONS` `0090:34`, `0290-season-rotation.js`, `0190-shop.js` |
| 재화 | 성석(◆)은 캐시 상점에서 **무료·무제한 충전**("나만의 게임이라 전부 무료예요") — 의도된 설계 | `0200-skin-shop.js:37~41`, `cashbuy` `110-economy.js:40` |
| 재료 | 경험치 기록·스킬 교본·승급 재료는 재료 던전(소탕 있음)에서, 초월승급 재료·장비 강화 재료는 아래 §1-2 | `FARM_RW` `0490-boss-patterns.js:52`, `sweep` `010-setup.js:27` |
| 전투 | 결정적 실시간 시뮬레이터(0.17초 단위), 효과 카탈로그·대열·속성 반응·진영 시너지·상태 배지, 필살기 자동/수동, 1~3배속, 별 조건, 스킬 밸런스 검사·대체 | `modules/combat/030-core.js` 외 |
| 적 | 일반 적: 모두 같은 키트(광폭화·전술 공격·결전 공격·전투 태세). 보스: 이름 해시로 7개 패턴 중 선택 | `enemyKit` `030-core.js:376~385`, `enemyPatterns` `0490:3` |
| 사이드 | 시련의 탑(통합·소속·속성), 주간 레이드(난이도 자동 조정), 카드 전투 로그라이크(심연), 일정, 원정 4종, 도감 | `0125`·`0110`·`0120`·`0135`·`0275`·`0300` |
| 선물 | 세계관과 무관한 10종(케이크·찻잎·꽃다발·책·공구…), 취향은 `hashN(c.id+'likes')` 무작위 | `GIFTS` `0130-gift.js:2,6` |
| 소리 | 배경음·효과음·음성. 소리 파일은 ElevenLabs·Fish Audio로 만들어 저장한 것만 재생 | `0040-sound.js` |

### 1-2. 문제

| # | 문제 | 근거 | 영향 | 검증 | 심각도 |
|---|---|---|---|---|---|
| E1 | **초월승급 재료를 얻을 곳이 없음** | `transcMat`를 주는 보상 표·상점·패스·레이드·탑·재료 던전이 없음(정적 검색: 값이 있는 곳은 시작 진행값 `transcMat:0`뿐 `0050:473`, 재료 던전 키는 exp·gold·wmat·core). 초월승급 조건 `(p.mat.transcMat||0)>=cost` `0090:79` | **모든 게임에서 Lv71 이후 초월승급이 "재료 부족"**. 상한은 장 진행(`capExtra`)으로만 오름. 그런데 AI는 이 재료의 세계관 이름까지 지음(`0250:213`) | 코드 | 상 |
| E2 | 장비 강화 재료(`gearMat`)는 쓰는 곳도 없음 | 무기 강화는 스킬 교본(`wmat`)을 씀(`0090:66~67`) | 용어·아이콘·AI 이름 짓기만 있고 기능 없음 | 코드 | 하 |
| E3 | ElevenLabs 키가 없으면 **완전 무음** | `src=it&&audioCache[it.id]; if(!src) return;` `0040-sound.js:58`. 기본 배경음·효과음(`DEFAULT_BGM`·`DEFAULT_SFX`)은 생성용 프롬프트만 있고 소리 파일이 없음 | 샘플 포함 키 없는 플레이에서 뽑기 SSR 연출·타격·승패음이 모두 없음 | 코드 | 중 |
| E4 | 일반 적이 모두 같은 행동, 생성기는 적 행동을 AI에 묻지 않음 | `enemyKit` `030-core.js:376~385`. `buildStages`는 적의 이름·속성·체력·공격·방어·속도·보스 여부만 남김(`0250-story-factory.js:67`), 장 생성 프롬프트에 패턴·역할 항목 없음 | 생성되는 게임마다 적이 "능력치만 다른 같은 적" | 코드 | 중 |
| E5 | 메인·이벤트 스테이지 소탕 없음 | 소탕은 재료 던전만(`0180-ui-scroll.js:238`) | 이벤트 교환(예: 대원 1,200토큰 ≈ 20판)을 모두 손으로 반복 — 1배속 최대 약 2.7분/판 | 보고 | 중 |
| E6 | 재화 압박을 고를 수 없음 | 무료 무제한 충전(§1-1). 검토 추정 기본 수입만 하루 약 1,000 성석(약 8회 뽑기) | 의도된 설계지만, 수집·성장의 긴장을 원하는 사용자를 위한 선택지가 없음 | 코드(추정치는 보고) | 중 |
| E7 | 상성 안내가 실제 계산과 어긋날 수 있음 | 패배 안내가 속성 3개를 가정(`0490:47` `ELEMS[(i+1)%3]`), 편성 유불리(`matchup` `0240:11`)·자동 편성은 `BEATS`만 봄. 엔진은 사용자 상성표(`rulesElemMat`)와 관계 배율로 계산(`030-core.js:692`) | 속성을 늘리거나 상성표를 고친 게임에서 안내가 틀림 | 보고 | 하 |
| E8 | 수령·차감 시점 | 패스 월 초기화 때 미수령 보상을 우편으로 보내지 않음(`0290:86`), "모두 받기"가 패스를 미션 경험치보다 먼저 처리(`020-navigation-and-tools.js:148`), 레이드 도전 횟수를 시작 전에 차감(`070-combat-and-formation.js:4`), 후퇴·패배 시 행동력 반환 없음 | 작은 손해가 쌓임 | 보고 | 하 |
| E9 | 일일 루프·호감도 장치가 고정 | 미션 6종 하드코딩, 주간 미션·업적 없음, 선물이 세계관·개성 시트와 무관, 일정은 장소마다 장면 하나 반복 | 게임마다 같은 일상 | 코드 | 하~중 |
| E10 | 테스트 공백 | `build/test.mjs`에 `MISSIONS`·`pass`·`cashbuy`·레이드(`RG(`)·`GGMCombat.run` 직접 검사 0건 | 경제·사이드 회귀를 못 잡음 | 보고 | 중 |

잘 되어 있는 것: AI 데이터가 비거나 이상할 때의 대체 — 적이 없으면 기본 적(`0250:70`), 스킬이 검사에 걸리면 기본 키트, 대사가 비면 기본값(`0070:78`), 회담·콘테스트 데이터가 맞지 않으면 일반 전투(`modeClean`).

## 2. 조사 — 코어 루프·경제

| 주제 | 요점 | 이 앱에 |
|---|---|---|
| 소스·싱크 균형 | 재화가 들어오는 곳이 나가는 곳보다 많으면 인플레이션 — 장기적으로 균형[1]. GDC "Economic Balancing… Through Clever Sink Design"[2] | E1은 반대 문제(싱크만 있고 소스 없음). 자기점검에 "얻는 곳 없는 재화·쓰는 곳 없는 재화" 규칙 |
| 행동력 관례 | 원신 레진 8분/1, 상한 200(4.7, 2024-06), 가득 차는 데 약 26시간[3]. 스타레일 6분/1, 상한 300, 초과분은 예비로 18분/1·최대 2,400[4] (상향 버전 **[미확인]**) | 이 앱 5분/1·240(20시간) — 관례 범위. 넘치는 양을 예비로 쌓는 방식은 하루 1~2회 접속에 맞음 |
| 세션 설계 | 총량은 한 번의 세션 길이, 회복 속도는 접속 빈도를 정함[5]. AFK Arena: 12시간 누적 상자로 하루 2회, 5분·1시간 세션을 모두 받아 줌[6] | 소탕(E5)이 없으면 짧은 세션이 안 됨 |
| 플레이 시간 | 원신 세션당 약 31분·하루 3.75회, 스타레일 약 29.6분·3.14회라는 집계 — 출처 불명이라 신뢰도 낮음[7]. 1차 수치는 확보 못 함 **[미확인]** | 참고만 |
| 수집 동기 | Quantic Foundry 동기 모델에서 "Completion(수집·완료)"은 나이에 따른 변화가 가장 적음[8]. 교환 토큰·중복 처리가 무작위성을 상쇄[9] | 도감 완성률·중복 → 재화 전환을 눈에 띄게 |
| 위험 | 공격적인 수익화는 장기적으로 역효과(War Robots 사례, GDC)[10] | 돈이 없는 앱이라 행동력은 "돈을 쓰게 하는 장치"가 아니라 **속도 조절 도구**로 |

## 3. 제안

| # | 제안 | 해결 | 위치 | 규모 |
|---|---|---|---|---|
| 3-1 | **초월승급 재료 경로**: 재료 던전에 초월 던전 추가, 탑 보스층(`towerReward` `0125:18`)·레이드 마일스톤(`RAID_MS` `0120:388`)·이벤트 상점(`defaultShop` `0070:22`)에서 지급. `gearMat`는 무기 강화 재료로 쓰거나 용어에서 제거. 자기점검(`tools/`)에 "얻는 곳 없는 재화·쓰는 곳 없는 재화" 규칙 | E1·E2 | 위 위치, `tools/lib/extra.mjs` | S |
| 3-2 | **합성음 대체**: 소리 파일이 없을 때 WebAudio로 짧은 합성음(버튼·확인·SSR 섬광·타격·승리·패배), 첫 실행에 "무음 상태" 안내 칩 | E3 | `sfx`·`bgm`(`0040:58~59`) | S~M |
| 3-3 | **적 역할·행동을 생성 스키마로**: 장 생성 적 항목에 `role`(근접·원거리·회복·방어)과 보스 `pattern`(7키 중) 추가, `buildStages`가 통과, `enemyKit`에 역할별 템플릿(회복형은 `heal` 액티브 등). 없으면 지금처럼 이름 해시 | E4 | 장 생성 프롬프트(`0250`), `buildStages`(`0250:67`), `enemyKit` | M |
| 3-4 | **별 3개 스테이지 소탕(×1/×5)**: 재료 던전 `sweep` 처리를 재사용, 편성 화면 스토리 버튼(`storyBtns` `0240:56`) 옆 | E5 | `010-setup.js:27`, `0240` | S~M |
| 3-5 | **경제 모드 선택**: 설정 → 게임에 "자유(지금) / 절제" — 절제는 캐시 상점을 숨기고 월간 카드만 또는 하루 한도. 기본은 자유 유지 | E6 | `0200`, `110-economy.js` | S |
| 3-6 | **상성 판정 함수 하나로**: `rulesElemMat()` 기반 함수로 `matchup`·자동 편성·패배 문구·탑 `foeElem`을 통일 | E7 | `0185`·`0240:11`·`0490:47`·`0125` | S |
| 3-7 | **수령·차감 정리**: 패스 초기화 전 미수령 보상 우편, "모두 받기"는 미션 먼저, 레이드 횟수는 전투 시작 뒤 차감, 후퇴·패배 시 행동력 일부 반환 | E8 | `0290:86`, `020:148`, `070:4`, `0480:27` | S |
| 3-8 | **데이터 기반 미션·세계관 선물**: `MISSIONS`를 표로(일정·탑·레이드·이벤트 항목, 주간 미션·업적), 선물 목록은 세계관 용어로 AI가 만들고 취향은 개성 시트(`persona.likes`)로 — [character.md](character.md) 확장 아이디어와 같은 방향. 생일 톡 | E9 | `0090:34`, `0130` | M |
| 3-9 | **경제 시뮬레이션 테스트**: 하루 수입·소모를 시뮬레이션해 "무과금 N일에 SSR 1명", "초월승급까지 일수" 같은 지표를 고정 | E1·E6·E10 | `build/test.mjs` | M |

## 4. 수치

- 행동력: 240 ÷ (60/5) = 20시간에 가득. 원신(8분/1·200 → 26.7시간), 스타레일(6분/1·300 → 30시간)과 같은 범위.
- 일일 미션 패스 경험치 합: 출석 100 + 전투 150 + 뽑기 100 + 파견 100 + 터치 60 + 강화 100 = **610/일**.

## 5. 확장 아이디어

- 웨이브 전투, 탑 위험도, 역할별 성장 곡선, 건조 시간·자연 회복·비서 보정 — 기존 노트([combat-content.md](combat-content.md)·[formation-sortie.md](formation-sortie.md)·[construction.md](construction.md))의 확장 아이디어 중 아직 구현이 확인되지 않은 것
- 레이드·심연 정산(하루 한도) 테스트

## 6. 출처

1. Machinations, Game economy design in F2P games — https://machinations.io/articles/game-economy-design-free-to-play-games
2. GDC Vault, "Economic Balancing and Improved Monetization Through Clever Sink Design" — https://gdcvault.com/play/1020524/
3. Destructoid, Genshin Impact resin cap 4.7 — https://www.destructoid.com/genshin-impact-will-increase-its-resin-cap-in-version-4-7/
4. Icy Veins, Honkai: Star Rail Trailblaze Power — https://www.icy-veins.com/honkai-star-rail/trailblaze-power , https://honkai-star-rail.fandom.com/wiki/Trailblaze_Power
5. Mobile Free to Play, energy systems — https://mobilefreetoplay.com/?p=617
6. Game Developer, "Flexible time session design in AFK Arena" — https://www.gamedeveloper.com/design/flexible-time-session-design-in-afk-arena
7. games.gg, Most played mobile games 2025 — https://games.gg/ja/news/most-played-mobile-games-in-2025/ (출처 불명 집계)
8. Quantic Foundry, Gamer Motivation Model — https://quanticfoundry.com/wp-content/uploads/2019/04/Gamer-Motivation-Model-Reference.pdf
9. GDC 2020, Evolution of Gacha Systems — https://gdcvault.com/play/1026822/
10. GDC Vault — https://gdcvault.com/play/1026346/
- "보고" 표시 항목은 코드 검토에서 위치를 제시받았고 이 문서 작성 때 다시 재현하지 않았습니다. 구현 전에 해당 줄을 확인하세요.
