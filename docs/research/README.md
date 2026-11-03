# 조사 노트 (docs/research)

개발에 앞서 조사한 장르 사례, 설계 근거, 수치를 모아 둡니다. 구현을 바꿀 때는 해당 노트의 **결정과 수치** 절을 같이 고쳐서 문서와 코드가 어긋나지 않게 합니다.

| 노트 | 주제 | 구현 위치 |
|---|---|---|
| [construction.md](construction.md) | 칸코레류 건조·원정: 분류별 최소 투입으로 캡이 열려 **확률 테이블이 구성되는** 방식, 총량으로 희귀도 캡, 비율로 분류 비중, 특수 레시피, 자원 수급(구매·원정), 확률 공개 | `src/modules/app/020-construct.js`(엔진), `src/main/0505-construct.js`(화면·상태) |
| [expedition.md](expedition.md) | 원정(파견)의 장르별 확장: 전투형 원정 · 방송 출연(인지도 등급에 따라 배정→선택, 컨디션·휴식기) · 스트리머(플랫폼·영상 라이브러리·라이브) · 경영(파트 배치, 실적×평판 정산) | `src/modules/app/030-expedition.js`(엔진), `src/main/0275-expedition.js`(화면·상태) |
| [game-rules.md](game-rules.md) | 게임 규칙 공개·편집: 속성 추가·제거·상성표·반응, 포지션(직군·함종, 기능 설계), 속성 상성(이기는 속성·배율), 역할 기본 능력치·속도, 희귀도 배율, 진영 시너지, 진영·역할·속성 관계 배율, 도감 기록 | `src/main/0185-game-rules.js`, 전투 엔진 `src/modules/combat/030-core.js` |
| [balance.md](balance.md) | 밸런스 관리: 세대 인플레 제어(고정·자동 상승), AI 능력치 편차 점검·보수(성향 유지), 생성 시 자동 보정, 구캐릭터 AS(전투 보정·리마스터) | `src/main/0187-balance.js`, 엔진 `genBoost` |
| [character.md](character.md) | 캐릭터 개성·매력: 개성 시트·프로필 템플릿·개성 검수(빠짐·흔함·겹침·말투), AI 채우기·다듬기·평가, 인연 톡(호감도 단계)·메모리얼 | `src/main/0455-persona.js` |
| [story-design.md](story-design.md) | 시나리오 사전 설계: 막 구성·숨겨진 반전(복선→공개 장)·분기(선택 → 플래그 → 이후 장)·캐릭터 아크, 장마다 필요한 설계만 프롬프트에 | `src/main/0465-story-plan.js`, `aiChapterGen0`(`0250`), 대본 `[분기: id]`(`0460`) |
| [prompts.md](prompts.md) | 프롬프트 현황 조사와 스튜디오: 흩어진 조각 등록·게임별 수정·AI 다듬기, 그림 가드(배경·소품의 사람 태그), 정정 → 교훈 자산화로 반복 방지, AI 기록 분석 | `src/main/0025-prompt-studio.js`, `llmWrap`·`composeNai`(`0020`) |
| [combat-content.md](combat-content.md) | 전투 개선과 캐릭터 활용처: 전장 규칙·별 조건·집중 지시, 시련의 탑(소속·속성 제한), 일정(장소 방문·호감도), 생성·점검 연계 | `src/main/0485-battle-rules.js`, `0125-tower.js`, `0135-schedule.js` |
| [direction.md](direction.md) | 커뮤 연출: 감정 아이콘·캐릭터 동작·화면 효과·두 사람 무대·스티커, AI 연출 입히기, 공유 보관함·자동 재사용·중복 합치기 | `src/main/0462-direction.js`, `0565-asset-library.js`, 대본 엔진 `0460` |
| [formation-sortie.md](formation-sortie.md) | 대열(근접·원거리·지원, 후열 보호·엄호·자리 상성), 출격 경로(진격·퇴각·갈림길·체력 유지), 일러스트만으로 되는 전투 체계 조사 | `src/main/0487-formation-sortie.js`, 엔진 `030-core.js`(formation) |
| [factions-cast.md](factions-cast.md) | 세력 설계(종류·목적·관계·장별 적대/우호), 적·몬스터 도감과 몬스터의 커뮤 대상화 차단, 첫 등장 전 픽업 잠금·적대 세력 잠금·만나지 않은 보유 캐릭터 안내 | `src/main/0445-factions.js`, 뽑기 `0500`, 장 생성 `0250` |
| [content-audit.md](content-audit.md) | 콘텐츠 점검·업그레이드: 생성 기능 향상·구버전 생성물(genVer) 감지, 자동 변환·AI 채우기·지정 변환·되돌리기, 규칙 추가 방법 | `src/main/0535-content-audit.js` |
| [variants.md](variants.md) | 바리에이션(이격·영의): 공통 템플릿, 조건으로 자동 적용, **상속형 관리(원본 + 수정치)**, 캐릭터 특징을 반영한 디자인 프롬프트 | 같은 파일들 + `src/main/0065-inherit.js`, `aiAltChar`(`src/main/0290-season-rotation.js`) |

## 노트 쓰는 법

각 노트는 다음 순서로 씁니다.

1. **조사**: 장르에서 흔한 방식과 출처. 특정 게임을 그대로 옮기지 않고 공통 패턴만 정리합니다.
2. **이 앱의 결정**: 무엇을 채택하고 무엇을 뺐는지, 그 이유
3. **수치·공식**: 기본값과 계산식. 바꾸면 어떤 결과가 나오는지 예시 표
4. **확장 아이디어**: 아직 구현하지 않은 것과 넣을 때의 위치
5. **출처**

## 새 조사 추가

`docs/research/<주제>.md`를 만들고 위 표에 한 줄을 추가합니다.
