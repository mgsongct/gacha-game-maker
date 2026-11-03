# 원정(파견) — 장르별 확장

## 1. 조사: 장르마다 "원정"이 다르게 생겼다

칸코레류의 원정은 "캐릭터를 보내 두면 시간이 지나 자원을 가져오는" 구조입니다. 같은 뼈대를 다른 장르에 맞추면 이름과 규칙이 달라집니다.

| 장르 | 원정에 해당하는 것 | 핵심 규칙 (조사) |
|---|---|---|
| 전투형 (칸코레·소녀전선류) | 특정 지역·해역으로 원정 → 자원 회수 | 원정마다 시간·필요 인원·보상 자원이 다름. 자원의 주 수입원 |
| 아이돌 육성형 | 방송·행사·광고 출연 스케줄 | 일·연습·휴식에 시간을 나누는 것이 핵심. 너무 몰아붙이면 사기가 떨어지고, 너무 쉬면 경쟁자에게 밀림. 과로하면 피로·자신감 하락. 멤버마다 강점·에너지를 보고 스케줄을 짬. 순위·인기가 수입과 연결 |
| 스트리머·버튜버형 | 플랫폼을 골라 영상 제작·라이브 방송 | 팔로워(구독자)가 핵심 지표. 스트레스 관리, 평판 관리. 무엇을 방송하느냐가 성장 경로를 바꿈 |
| 경영형 (상점·기업) | 직원을 부서·파트에 배치 | 직원 능력치가 결과물 품질에 기여. 같은 일을 반복시키면 번아웃. 계약 성공이 평판을 올리고 실패하면 깎임. 매출은 품질·평판·광고(팬)로 결정 |

### 사용자 요구로 구체화한 규칙

- **아이돌형**: 인지도가 낮으면 방송국·스폰서가 주는 일정을 받아야 하고 선택권이 거의 없음. 인지도가 오르고 톱이 되면 나갈지 말지, 어디에 나갈지 자유롭게 고르고 보수도 크게 오름. 대신 컨디션 관리를 위한 휴식기가 필수
- **스트리머형**: 플랫폼을 골라 콘텐츠를 제작해 올려 수익화하거나, 실시간 라이브 소통 방송
- **경영형**: 특정 파트에 배치해 일하게 하고, 수익은 파트별로 따로가 아니라 경영 실적과 누적된 평판에 따라 나옴

## 2. 이 앱의 결정

`G.meta.expedition.mode`로 게임마다 하나를 고릅니다. 설정 → 게임 → 파견 방식에서 바꾸고, 메뉴 이름은 용어 `dispatch`로 바꿉니다(원정·스케줄·방송·영업 등).
새 게임은 세계관 단계에서 방식과 그 이름(`expeditionNames` — 인기 수치 이름, 아이돌 일·방송 매체·경영 파트 이름)을 세계관에 맞게 정합니다. 수치(시간·보수·인지도·파트 능력)는 엔진 기본값 그대로이고 이름만 바뀝니다(원정 엔진 `GGMExpedition.fromWorld`·`namesApply`, 지시문은 프롬프트 스튜디오 `EXPEDITION_RULE`).

| 모드 | 화면 | 보상 |
|---|---|---|
| `combat` 전투형 원정 | 기존 파견 그대로(의뢰판, 인원 선택, 시간) | 크레딧·재료 + 건조가 켜져 있으면 건조 자원 |
| `idol` 방송 출연 | 캐릭터마다 하루 일정이 들어옴. **등급이 낮으면 배정된 1건**(받거나 쉬기만 가능), 등급이 오를수록 여러 건 중에서 고르고 거절도 자유 | 보수(등급 배율) + 인지도 |
| `streamer` 콘텐츠 방송 | 캐릭터마다 플랫폼(영상·라이브·숏폼)을 골라 제작 | 즉시 수익 + 구독자. 영상은 **라이브러리에 남아 계속 수익**(정산) |
| `business` 경영 | 파트(매장·주방·홍보·관리)에 자리를 배치. 시간 단위 영업 | **전체 실적 × 누적 평판으로 한 번에** 정산(파트별 수익 없음) |

### 공통 규칙

- **컨디션(0~100)**: 일을 시작하면 그 일의 소모량만큼 줄고, 일하는 동안은 회복하지 않음. 대기 중 시간당 6, **휴식** 중 시간당 18 회복. 30 아래면 성과(보수·인지도·실적)가 최대 40%까지 떨어지고, 20 아래면 일을 못 함
- **연속 출연(번아웃)**: 쉬지 않고 3번 이상 이어서 출연하면 컨디션 소모 1.5배. 휴식하면 초기화. 톱일수록 일정이 비싸고 소모가 커서 휴식기가 사실상 필수
- **인지도(구독자) 등급**: 신인 0 → 라이징 150 → 인기 600 → 스타 1,800 → 톱 4,500

| 등급 | 들어오는 일정 | 고를 수 있나 | 보수 배율 |
|---|---|---|---|
| 신인 | 1 | 배정(받거나 쉬기) | ×1 |
| 라이징 | 2 | 배정 | ×1.3 |
| 인기 | 3 | 선택 | ×1.8 |
| 스타 | 4 | 선택 | ×2.6 |
| 톱 | 6 | 선택 | ×4 |

등급이 높을수록 상위 일정(드라마·단독 콘서트: `minTier` 3)도 열립니다.

- 일하는 중·쉬는 중·경영 배치 중인 캐릭터는 전투에 나갈 수 없음(`busyIds`)
- 건조/영입이 켜져 있으면 모든 모드의 수익에 건조 자원 2종이 같이 들어옴

## 3. 수치·공식 (`GGMExpedition.DEFAULTS`)

```
[방송] 보수 = pay × 등급 배율 × (0.9~1.1)   인지도 = fame × 컨디션 계수   소모 = cond × (연속 3회↑ 1.5)
[방송국·행사·스폰서] 지역 방송 2h 2,000 +20 · 팬 사인회 2h 1,500 +30 · 광고 촬영 4h 6,000 +15
                     음악 방송(라이징↑) 3h 3,500 +45 · 예능 고정(인기↑) 4h 5,000 +60
                     드라마(스타↑) 8h 12,000 +110 · 단독 콘서트(스타↑) 6h 20,000 +160

[스트리머] 라이브 2h: 900 × (1 + 구독자/400) × (1 ± 0.6) · 구독자 +45  (후원이라 변동 큼, 소모 30)
          영상 6h:   600 × (1 + 구독자/800) · 구독자 +25 · 라이브러리에 600×(1+구독자/500)×0.4 등록
          숏폼 1h:   150 × (1 + 구독자/1000) · 구독자 +15, 8% 확률로 터짐(구독자 ×8)
          라이브러리 수익/시간 = Σ 영상 base × 5% × 0.5^(경과일/7)   → 오래된 영상일수록 줄어듦, 90일 뒤 정리

[경영] 파트 적합도 = min(1.5, Σ(배치 인원의 담당 능력치 / 기준값 × 컨디션 계수) / 자리 수)
       기준값 hp 1000 · atk 150 · def 60 · spd 100   (매장=속도, 주방=공격, 홍보=체력, 관리=방어)
       실적 = Σ(파트 가중치 × 적합도) / Σ가중치
       수익/시간 = 500 × (0.2 + 실적) × (1 + 평판/1000)     최대 24시간까지 쌓임
       평판 += (실적 − 0.6) × 25 × 시간   (0~1000)
       배치된 인원은 시간당 컨디션 4 소모 → 쉬게 해야 함
```

예) 실적 90%로 5시간 영업: 평판 0이면 수익 2,750, 평판 800이면 4,950. 평판이 같은 실적의 수익을 키워서 **꾸준히 잘 운영할수록** 벌이가 커집니다. 실적 20%로 운영하면 평판이 시간당 10씩 깎입니다.

모든 값은 설정의 상세 JSON에서 바꿀 수 있습니다(방송국·플랫폼·파트 목록, 등급, 컨디션).

## 4. 데이터

| 위치 | 내용 |
|---|---|
| `G.meta.expedition` | `{mode, cond, tiers, burnout, idol:{fameName, places[]}, streamer:{fameName, platforms[]}, business:{repName, base, repMax, target, cap, parts[]}}` (바꾼 값만) |
| `P().exped.fame[id]` | 인지도·구독자 |
| `P().exped.cond[id]` | `{v, at, rest?}` — `at`이 미래면 일하는 중(그때까지 회복 없음), `rest`까지는 휴식 회복 |
| `P().exped.jobs[jid]` | `{chars:[id], start, hours, job, mode}` |
| `P().exped.offers[id]` | 오늘 들어온 일정 `{day, tier, offers[], choice}` |
| `P().exped.streak[id]` | 연속 출연 수 |
| `P().exped.lib[]`, `libAt` | 영상 라이브러리 `{at, base, id}`, 마지막 정산 시각 |
| `P().exped.biz` | `{assign:{파트id:[id…]}, at(마지막 정산), rep}` |

## 5. 확장 아이디어

- 아이돌: 그룹 출연(여러 명이 한 일정), 경쟁 아이돌과 순위, 스캔들 이벤트(컨디션 바닥일 때)
- 스트리머: 시청자 채팅·후원 연출, 플랫폼마다 수익 배분율, 장르(게임·노래·토크) 적합도
- 경영: 파트 업그레이드(자원 사용), 손님 수요 시간대, 직원 궁합 보너스
- 공통: 이벤트 시즌에 일정 보수 증가, 캐릭터 속성·역할에 따른 일정 적합도

## 6. 출처

- 아이돌 육성: [K-pop Idol Stories: Road to Debut 리뷰 (tech-gaming)](https://www.tech-gaming.com/k-pop-idol-stories-road-to-debut-review/), [Road to Debut 게임플레이 소개 (hartware)](https://www.hartware.de/2026/04/24/new-gameplay-overview-trailer-for-k-pop-idol-stories-road-to-debut-details-how-to-become-a-successful-manager/), [Project V6 (LaunchBox)](https://gamesdb.launchbox-app.com/games/details/134888-project-v6), [Hop Step Idol (MobyGames)](https://www.mobygames.com/game/223608/hop-step-idol/), [Idling Idol (itch.io)](https://examgames.itch.io/idling-idle), [Idol Manager 리뷰 (Nook Gaming)](https://www.nookgaming.com/idol-manager-review/)
- 스트리머: [NEEDY STREAMER OVERLOAD Wiki](https://needystreameroverload.wiki.gg/wiki/NEEDY_STREAMER_OVERLOAD), [게임 행동 가이드 (steamah)](https://steamah.com/needy-streamer-overload-game-action-mechanics-guide/), [USC 논문: 스트리밍 산업과 셀럽 상품화](https://scribe.usc.edu/the-invisible-epidemic-needy-streamer-overload-and-gamified-resistance-to-celebrity-commodification-in-the-streaming-industry)
- 경영: [Game Dev Story — Giant Bomb](https://www.giantbomb.com/game-dev-story/3030-32908/), [Game Dev Story — Kairosoft Wiki](https://kairosoft.wiki.gg/wiki/Game_Dev_Story)
- 전투형 원정: [Expedition/Reference tables — KanColle Wiki](https://kancolle.fandom.com/wiki/Expedition/Reference_tables)

장르 관례를 참고했고, 이 앱의 규칙·수치는 이 앱용으로 새로 정한 값입니다.
