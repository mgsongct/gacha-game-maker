# 캐릭터 개성·매력 · 인연 톡 · 메모리얼

## 1. 문제 (조사 결과)

| 항목 | 기존 상태 |
|---|---|
| 캐릭터 설정 | 이름·프로필(자유 글)·대사·터치·호감도/레벨/돌파 대사·기밀 파일. **성격·말투·매력 포인트를 담는 구조화된 항목이 없음** → AI가 매번 프로필 글에서 추측, 캐릭터끼리 말투·성격이 겹치기 쉬움 |
| 검수 | 콘텐츠 점검은 "대사 수가 적다" 같은 양만 봄. 개성이 약하거나 다른 캐릭터와 겹치는지는 보지 않음 |
| 톡 | 메신저(등대톡)에 호감도 트리거(`aff`)가 있지만 주로 스테이지 클리어·매일 라이브 운영 톡. 호감도 단계별로 관계가 깊어지는 흐름이 없음 |
| 메모리얼 | 없음(돌파 CG·로비 포즈는 있음) |

## 2. 장르 조사

| 게임 | 참고한 구조 |
|---|---|
| 블루 아카이브 | 인연 랭크가 오르면 모모톡 메시지가 오고, 대화를 진행하면 인연 스토리가 열림. 일정 랭크에서 **메모리얼 로비**(홈 화면으로 설정) 해금. 인연은 카페 터치·선물·스케줄로 올림 |
| 명일방주 | 오퍼레이터 파일: 프로필 → 임상 진단(신뢰 25%) → 보관 기록 1~4(신뢰 50~200%) 단계 공개. 기본 정보 필드(출신·생일·종족·신장·전투 경력 등). 대사는 상황별(비서 임명·작전 중 등) |
| 캐릭터 설계 일반 | **반전 매력(갭 모에)**: 겉과 반대되는 면이 드러나는 순간이 매력. 단, 중심 축(core)이 있어야 하고 차이가 너무 크면 정체가 흐려짐. 대표 대사·말버릇 같은 작은 디테일이 캐릭터를 구별 |

## 3. 이 앱의 결정 (`src/main/0455-persona.js`)

### 개성 시트 `c.persona`

| 항목 | 의도 |
|---|---|
| 핵심 성격 3개 | 서로 다른 축(겉모습·속마음·행동 습관) |
| 1인칭 · 부르는 말 · 어미 · 말버릇 · 대표 대사 | 말투의 개성(대사·톡·스토리에서 지켜짐) |
| 반전 매력 · 결점 | 매력 포인트. 결점이 반전과 이어지게 |
| 원하는 것 · 두려워하는 것 | 관계가 깊어질 때 꺼낼 이야깃거리 |
| 좋아함 · 싫어함 · 취미 · 상징 | 선물·일상 톡·디자인 소재 |

- **프로필 템플릿** `c.pfields`: 게임마다 고르는 항목 — 기본 / 소속 조직 / 작전 요원(코드네임·전투 경력·임상 소견) / 판타지(종족·계약) / 아이돌(소속사·데뷔·팬덤 이름) / 스트리머(활동명·플랫폼·구독자 애칭) / 직접 입력
- 모든 AI 생성의 컨텍스트(`ctx()`)에 개성 요약이 들어가서 스토리·톡·대사가 말투를 지킵니다. 새 캐릭터는 생성할 때 개성 시트·프로필을 같이 만듭니다.
- 샘플 게임 8명에게 개성 시트를 채워 두었습니다(예시).
- 이격·바리에이션은 개성·프로필을 상속합니다.

### 개성 검수 `personaReview` (0~100, S/A/B/C/D)

| 감점 | 기준 |
|---|---|
| 빠진 항목 | 핵심 성격 12, 어미 10, 반전 매력 10, 결점 8, 원하는 것 6, 대표 대사 6 … |
| 흔한 성격 | 핵심 성격이 전부 "밝음·친절·쿨·츤데레"처럼 흔한 단어 |
| 겹침 | 다른 캐릭터와 1인칭+어미 같음, 성격 2/3 이상 겹침, 대표 대사 같음 |
| 말투 불일치 | 대사에 어미·말버릇·대표 대사가 하나도 안 드러남 |
| 콘텐츠 | 평소 대사 4개 미만, 인연 톡 없음, 메모리얼 없음, 인연 스토리 없음 |

AI 매력 평가(선택): 첫인상 훅·말투·반전·차별성·팬 포인트·관계 여지로 점수와 장점·약점·바로 고칠 제안.

### AI 생성·개선

| 기능 | 동작 |
|---|---|
| AI로 채우기 | 비어 있는 항목만, 다른 캐릭터와 겹치지 않게 |
| AI로 다듬기(+대사) | 흔한 키워드를 구체적인 습관·반전으로, 대사·호감도 대사를 말투에 맞게 다시 씀 |
| 직접 편집 | 개성 편집 화면(시트 + 프로필 + 추가 항목) |
| 일괄 | 설정 → 캐릭터 개성·매력: 낮은 점수 순 목록에서 선택 → 채우기·다듬기·인연 톡·메모리얼, 되돌리기 |

### 인연 톡 · 메모리얼

- **인연 톡**: 호감도 단계(기본 2·4·6·8)마다 메신저 대화 1개. 단계가 오를수록 가벼운 안부 → 개인적인 이야기 → 약점·고민 → 특별한 약속. 기존 메신저의 `aff` 트리거로 배달
- **메모리얼**: 호감도 8(설정)에서 열리는 특별 장면(대본) + 메모리얼 로비 대사. 열리면 알림, 캐릭터 화면에서 다시 보기, **메모리얼 로비 켜기** → 로비 터치 대사에 메모리얼 대사가 섞임
- 콘텐츠 점검: `c_persona`(개성 없음), `c_persona_weak`(점수 낮음), `c_afftalk`(인연 톡 없음), `c_memorial`(메모리얼 없음). 생성 규칙 버전 4

## 4. 확장 아이디어

- 메모리얼 전용 일러스트(로비 그림 교체)와 연출
- 상황별 대사 카테고리(비서 임명·출격·승리·생일·다른 캐릭터에 대해) — 명일방주식
- 생일에 맞춘 특별 톡(프로필의 생일 사용)
- 선물 취향(좋아함·싫어함)으로 선물 호감도 보정

## 5. 출처

- [Affection — Blue Archive Wiki](https://bluearchive.fandom.com/wiki/Affection), [Relationship and Momo Talk (gameplay.tips)](https://gameplay.tips/guides/blue-archive-relationship-and-momo-talk.html), [Recollection Lobby (touchtapplay)](https://www.touchtapplay.com/how-to-get-recollection-lobby-live2d-wallpaper-in-blue-archive/), [Relationship guide (thegameslayer)](https://thegameslayer.com/guides/blue-archive-affection-relationship-guide/)
- [Operator file 예: Catapult — Arknights Wiki](https://arknights.wiki.gg/wiki/Catapult/File), [Category:Operator files](https://arknights.wiki.gg/wiki/Category:Operator_files), [Character voices](https://arknights.wiki.gg/wiki/Character_voices)
- [Gap moe (Japanese with Anime)](https://www.japanesewithanime.com/2017/11/gap-moe.html), [Moe — Dere Types Wiki](https://the-dere-types.fandom.com/wiki/Other:Moe), [Qoopedia: Gap moe](https://news.qoo-app.com/en/post/28639/qoopedia-gap-moe), [Manga Matrix로 본 가챠 캐릭터 디자인 (journal.uib.ac.id)](https://journal.uib.ac.id/index.php/combines/article/view/8702)

이 앱의 항목·점수 기준은 위 사례를 참고해 이 앱용으로 새로 정했습니다.
