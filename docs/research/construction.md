# 자원 투입식 건조/영입과 원정

## 1. 조사: 칸코레류 건조는 "완전 확률형"이 아니다

가챠는 고정된 확률표 하나에서 뽑습니다. 칸코레류 건조·제조는 다릅니다. **넣은 자원이 확률표 자체를 만듭니다.**

### 1.1 핵심 구조: 분류별 최소 투입 → 열린 분류만 테이블에 들어감

| 관찰 | 칸코레(함선 건조) | 소녀전선(인형 제조) |
|---|---|---|
| 자원 | 연료·탄약·강재·보크사이트 4종, 일반 건조 30~999 | 인력·탄약·식량·부품 4종, `MP/Ammo/Ration/Parts` 순 표기 |
| 분류(함종·병과)별 최소 조건 | 큰 함종은 특정 자원이 일정 이상이어야 후보에 들어감. 예: 전함 레시피 400/100/600/30 → 전함 32% · 중순양함 58% · 경순양함 7% (위키 예시, 오래된 수치) | 병과마다 최소 공식이 있음. 예: HG 130/130/130/130, SMG 230/330/330/130, AR 230/430/430/230, RF 430/130/430/230, MG 730/730/230/430 (위키, 버전마다 다름) |
| 테이블 구성 | 일반 건조에 **풀(pool) 4개**가 있고, 풀마다 값을 올리는 자원이 다름(풀1: 강재·보크사이트, 풀2·3: 탄약·강재, 풀4: 연료·강재). 투입량에 따라 어느 풀·함종으로 갈지 정해짐 | 최소 공식을 넘은 병과들이 후보가 됨. 부품을 많이 넣으면 고성급 확률이 조금 오름 |
| 대형(중형) 모드 | 대형 건조: 1500~7000 범위, 퀘스트로 해금, 일반 건조로는 안 나오는 대상 포함 | 중형 제조: 자원마다 1000 이상 + 코어. SG는 중형에서만 |
| 레시피 | 공식 비공개 → 커뮤니티가 실험으로 찾은 조합을 공유. "언제든 바뀔 수 있다", "운에 크게 좌우된다" | 같은 공식으로도 특정 인형은 보장되지 않음 |
| 결과 암시 | 건조 시간으로 함종·대상을 미리 알 수 있음 | 제조 시간표로 대상을 알 수 있음 |

정리하면 **세 단계**입니다.
1. **캡 해제(개방)**: 자원별 최소량·총량·비율 조건을 넘은 분류만 후보가 된다.
2. **테이블 구성**: 열린 분류들의 비중은 넣은 자원의 양과 비율로 정해진다(특정 자원이 특정 분류를 밀어 줌).
3. **추첨**: 그렇게 만들어진 테이블에서 뽑는다. 상위 희귀도도 총량·특정 자원으로 열리고 커진다.

### 1.2 원정

칸코레류의 원정은 **캐릭터(편대)를 보내 두면 일정 시간 뒤 자원을 가져오는** 구조입니다. 자원의 주 수입원이고, 원정마다 주는 자원 종류와 양이 다릅니다. 자연 회복은 보조(칸코레: 3분마다 3, 보크사이트 1)입니다.

### 1.3 확률 공개

한국은 2024년 3월부터 확률형 아이템 확률 공개가 의무입니다. 이 앱은 비상업이지만 **투입할 때마다 그 투입으로 만들어진 확률 테이블을 화면에 그대로 보여 줍니다.** 숨기는 것은 레시피의 *이름*뿐입니다(처음 맞추면 "발견").

## 2. 이 앱의 결정

| 항목 | 결정 |
|---|---|
| 자원 | 4종 `res1~res4`, 이름은 용어로(기본: 연료·탄약·합금·부품). `res4` = 바리에이션 열쇠 |
| 켜기·끄기 | `G.meta.construct.on` (게임별). 설정 → 게임 → 영입(자원 투입식) |
| **분류(groups)** | 분류마다 `match`(역할·소속·속성), **개방 조건** `min[4]`·`max[4]`·`total`·`share{자원:[최소비율,최대비율]}`, **비중** `weight{base, res[4]}`, `maxRarity`. 기본은 역할 3분류(지원·공격·방어) |
| **희귀도 캡** | 총량으로 SR·SSR이 열리고, 열린 뒤 총량에 비례해 확률이 오름. 분류마다 `maxRarity`로 상한 |
| 확률 테이블 | 분류 확률 × 분류 안 희귀도 확률 ÷ 후보 수 → 캐릭터별 확률. 후보가 없는 희귀도 칸의 몫은 같은 분류의 다른 희귀도로 나눠 줌(합계는 항상 100%) |
| 특수 레시피 | `min[4]`가 맞으면 소속·특정 캐릭터 확률 ×up. 처음 맞추면 발견. 기본은 비어 있음(분류가 역할 편향을 맡음) |
| 결과 풀 | 출시된 상시 캐릭터(한정·이격·바리에이션 제외) |
| 중복 | 가챠와 같은 공통 함수 `grantOwned`(돌파 +1, 환급) |
| 수급 | ① 가챠돌로 구매 ② **원정** = 기존 파견 보상에 자원 2종(시간·인원 비례) ③ 켤 때 시작 자원. 용어 "파견"을 "원정"으로 바꿔 쓰면 됨 |
| 건조 시간 | 넣지 않음(즉시). 5절 참고 |

## 3. 수치·공식 (기본값 `GGMConstruct.DEFAULTS`)

```
투입 r[i] ∈ [30, 999], 총량 T = Σr, 비율 s[i] = r[i]/T

[1] 분류 개방: r ≥ min, r ≤ max, T ≥ total, share 범위 안 → open
      지원: min 30/30/30/30   공격: min 30/100/30/30 (탄약 100↑)   방어: min 30/30/100/30 (합금 100↑)
[2] 비중: w = base + Σ res[i]·r[i]  (지원: 10 + 0.1·연료 + 0.02·부품 · 공격: 10 + 0.1·탄약 + … · 방어: 10 + 0.1·합금 + …)
      분류 확률 = w / Σ(열린 분류의 w)
[3] 희귀도 캡: SR% = T<800 ? 0 : 18 + 22·(T-800)/(3996-800)   SSR% = T<2000 ? 0 : 3 + 7·(T-2000)/(3996-2000)
[4] 캐릭터 확률 = 분류 확률 × 희귀도 확률(후보 없는 칸은 재분배) × (특수 레시피 up 비중)
[5] 바리에이션: 템플릿 레시피가 맞고 대상이 있으면 chance% 로 먼저 판정
```

| 투입 | 총량 | 지원 | 공격 | 방어 | SR | SSR |
|---|---|---|---|---|---|---|
| 30/30/30/30 | 120 | 100 | 잠김 | 잠김 | 0 | 0 |
| 30/100/30/30 | 190 | 39.8 | 60.2 | 잠김 | 0 | 0 |
| 300/300/300/300 | 1200 | 33.3 | 33.3 | 33.3 | 20.8 | 0 |
| 100/600/100/100 | 900 | 19.0 | **62.1** | 19.0 | 18.7 | 0 |
| 600/100/100/100 | 900 | **62.1** | 19.0 | 19.0 | 18.7 | 0 |
| 100/100/600/100 | 900 | 19.0 | 19.0 | **62.1** | 18.7 | 0 |
| 500/500/500/500 | 2000 | 33.3 | 33.3 | 33.3 | 26.3 | 3.0 |
| 999/999/999/999 | 3996 | 33.3 | 33.3 | 33.3 | 40.0 | 10.0 |

화면에는 분류마다 🔓/🔒, 열리는 조건, 확률이 나오고, "이번 투입의 확률 테이블"을 펼치면 캐릭터별 확률이 나옵니다.

### 분류를 직접 설계하는 예 (고급 설정 JSON의 `groups`)

```json
[{"id":"g_heavy","name":"중장갑","match":{"role":"def"},"min":[400,100,600,30],"weight":{"base":0,"res":[0,0,0.2,0]},"maxRarity":3},
 {"id":"g_scout","name":"정찰","match":{"faction":"새벽등대"},"min":[30,30,30,30],"share":{"0":[0.4,1]},"weight":{"base":20,"res":[0.05,0,0,0]},"maxRarity":2}]
```
- 중장갑: 합금 600·연료 400 이상일 때만 열리고, 합금을 넣을수록 비중↑
- 정찰: 연료 비율이 40% 이상일 때만 열리는 소속 분류, SR까지만

### 경제 균형

| 경로 | 계산 | SSR 1명당 기대 비용 |
|---|---|---|
| 가챠 (SSR 4%, 1회 120) | 120 / 0.04 | 약 3,000 가챠돌 |
| 건조를 가챠돌로만 (최대 투입, 300개 = 60돌) | 799돌 / 0.10 | 약 8,000 가챠돌 |
| 건조를 원정으로 (8시간·3명 = 자원 2종 × 600) | 3,996 / 1,200 ≈ 3.3회 / 0.10 | 원정 약 33회 |

가챠돌로 자원을 사서 건조하는 것이 가챠보다 유리하지 않게 했습니다. 건조는 원정으로 모은 무료 자원으로 **원하는 분류를 노리는** 콘텐츠입니다.

## 4. 데이터

| 위치 | 내용 |
|---|---|
| `G.meta.construct` | `{on, min, max, step, start, sr, ssr, groups[], buy:{gems,amt}, recipes[]}` (바꾼 값만 저장, 나머지는 엔진 기본값) |
| `G.meta.terms.construct/res1..res4` | 메뉴·자원 이름 |
| `P().cres` | 자원 보유량 |
| `P().cbuild` | `{n, input, found:{레시피id \| 'g:'+분류id \| 'v:'+바리에이션id: 시각}, log[], started}` |
| 원정(파견) 보상 | `reward.res1..res4` |

## 5. 확장 아이디어

- **건조 시간·도크**: 결과마다 시간을 두고 시간으로 결과를 암시, 즉시 완료 아이템. `P().cbuild.docks`
- **대형 건조**: 범위가 다른 두 번째 모드(`cfg.large`), 대형 전용 분류(`group.mode:'large'`)
- **자연 회복**: 접속하지 않은 시간에 비례해 자원 회복(상한)
- **비서 보정**: 로비 비서의 소속·역할로 분류 비중 보정
- **풀 이론식 확장**: 분류 비중을 선형식 대신 "풀 값 = Σ자원계수" 후 풀→분류 매핑 표로(칸코레 4풀 모델)

## 6. 출처

- [Construction — KanColle Wiki (fandom)](https://kancolle.fandom.com/wiki/Construction): 일반·대형 건조 범위, 전함 레시피 400/100/600/30과 함종 비율 예시
- [Construction — Kancolle Wiki (kancollewiki.net)](https://en.kancollewiki.net/w/index.php?title=Construction&mobileaction=toggle_view_desktop): 일반 건조 4풀, 풀마다 영향을 주는 자원
- [KanColle Construction: Build Time Lookup & Recipes — kouryakulab](https://kouryakulab.com/games/kancolle/construction/): 건조 시간으로 결과 확인
- [建造レシピ — 艦これ攻略 wikiwiki](https://wikiwiki.jp/kancolle/建造レシピ): 레시피는 바뀔 수 있다는 경고
- [Expedition/Reference tables — KanColle Wiki](https://kancolle.fandom.com/wiki/Expedition/Reference_tables): 원정 보상표
- [Beginner guide — r/kancolle wiki 미러](https://axebps-redlib.hf.space/r/kancolle/wiki/beginner): 자원 자연 회복, 레시피가 운에 좌우됨
- [Manufacture — Girls' Frontline Wiki](https://girls-frontline.fandom.com/wiki/Manufacture): 병과별 공식, 중형 제조 1000 이상
- [Girls' Frontline Recipes — BlueStacks](https://www.bluestacks.com/blog/game-guides/girls-frontline/gf-tips-tricks-en.html), [FCals](https://fcals.com/t-doll-production-guide-and-upgrade-in-girls-frontline/), [LDPlayer](https://www.ldplayer.net/blog/basic-introduction-of-girls-frontline.html): 공식 표기, 버전마다 다른 공식
- [T-Doll Production — IOP Wiki](https://iopwiki.com/wiki/T-Doll_Production), [Moegirlpedia](https://en.moegirl.org.cn/Girls%27_Frontline/T-doll_production): 제조 시간표
- 확률 공개: [Legal500](https://www.legal500.com/developments/thought-leadership/punitive-damages-and-other-special-legal-provisions-for-litigation-concerning-probability-based-game-items/), [Hwawoo](https://www.hwawoo.com/eng/insights/newsletter/2672), [PocketGamer.biz](https://www.pocketgamer.biz/news/82683/south-korea-to-enforce-probability-displays-and-investigate-blockchain-games-on-apple-and-google-stores/)

위 게임의 수치는 구조를 이해하기 위한 예시이고, 이 앱의 공식·수치는 이 앱용으로 새로 정한 값입니다.
