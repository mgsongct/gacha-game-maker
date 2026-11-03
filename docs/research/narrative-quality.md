# 이야기·연출 품질과 생성물 평가 (제안 단계)

생성된 게임의 이야기 품질을 좌우하는 것 — 1장이 만들어지는 경로, 시나리오 설계, 대본 엔진의 건너뛰기·분기, 캐릭터 말투 유지 — 과 생성물을 자동으로 평가하는 방법을 점검·조사했습니다. 시나리오 설계 자체의 결정은 [story-design.md](story-design.md), 연출 엔진은 [direction.md](direction.md), 종합은 [maker-review.md](maker-review.md).

## 1. 현황 조사 (빌드 2026.11.03.17)

### 1-1. 1장과 이후 장의 차이

| 장치 | 이후 장(`aiChapterGen0` `0250-story-factory.js:100~121`) | 1장(`buildNewGameDraft` c3b `0250:251`) |
|---|---|---|
| 구성 → 스테이지별 집필 → 마무리 | 구성(beats·CG) → `writeStages` → `storyWrapUp` | **한 번의 호출로 대본까지** (깊이 설정 `depth`와 무관) |
| 시나리오 설계 | 설계가 있으면 `planCtx(n)`(이번 장의 복선·공개·분기) | 넣지 않음. 설계(`G.world.plan`)는 수동 `planAI`(`0465-story-plan.js:31,70`)에서만 생성 |
| 도감 기록·조연 NPC 등록·나중 등장 처리·모의 전투 밸런스 | `codex`·`autoNpcs`·`debutResolve`·`v2BalanceChapter` | **호출 0건**(정적 검색) |

- 결과: 첫인상이 되는 1장이 묘사·밸런스·NPC 그림·등장 검증을 덜 받고, AI가 만든 게임은 설계가 없으니 [story-design.md](story-design.md)가 고친다고 적은 "즉흥 지시" 경로(`0250:108`)로 계속 갑니다.
- 불러올 때 `fix()`가 1장 적 능력치를 성장 곡선에 맞추는 것은 `curve` 플래그가 없어서 생기는 우연한 경로입니다(`0070-save.js:108`, 검토 보고).

### 1-2. 대본 엔진

| 기능 | 상태 | 위치 |
|---|---|---|
| 자동·로그·건너뛰기 | 있음 | `vnauto`·`vnlog`·`vnskip` `020-navigation-and-tools.js:67~69` |
| **건너뛰기** | **즉시 종료**(`vnEnd()`), 확인 없음 → `[분기: id]` 선택지를 지나쳐 `P().flags`가 기록되지 않음 → 다음 장 프롬프트의 "플레이어가 고른 분기"가 비게 됨 | `:68`, `vnEnd` `0460-script-engine.js:105` |
| 글자 속도 | 28ms마다 2글자(초당 약 71자) 고정 | `0460:102` |
| 자동 넘김 간격 | `1000 + 글자 수 × 40`ms 고정(음성이 있으면 끝나고 600ms) | `0460:104` |
| 읽은 대사만 건너뛰기·UI 숨기기·글자 크기 | 없음 | – |

### 1-3. 말투·캐릭터 유지

- 개성 시트(14항목)와 개성 검수(`personaReview` `0455-persona.js:19`)가 있고, `ctx()`가 인물마다 개성 요약과 **말투 예문**을 넣습니다(`0440-ai-context.js:20`).
- 샘플 게임 개성 검수: 평균 86점, 24건(평소 대사 3개 — 권장 4개 이상, 말투가 안 드러남) — [sample-onboarding.md](sample-onboarding.md).
- 생성 결과의 이야기 품질(설정 모순·말투 일치·복선 회수)을 **자동으로 평가하는 장치는 없습니다**. 콘텐츠 점검(`0535`)은 빠진 항목·구버전 감지(규칙 기반)입니다.

### 1-4. 문제

| # | 문제 | 검증 | 심각도 |
|---|---|---|---|
| N1 | 1장이 이후 장의 품질 장치를 거치지 않음, 시나리오 설계 자동 생성 없음 | 코드 | 중 |
| N2 | 건너뛰기가 분기 선택까지 지나쳐 플래그 누락 | 코드 | 중(분기가 있는 대본에선 상) |
| N3 | 글자·자동 속도 설정, 읽은 대사 건너뛰기 없음 | 코드 | 하 |
| N4 | 이야기 품질 자동 평가 없음 | 코드 | 중 |

## 2. 조사

| 주제 | 요점 | 이 앱에 |
|---|---|---|
| 분기 구조 | 타임 케이브(마구 갈라짐)·건틀릿(거의 선형)·**분기-병목**(갈라졌다 합류, 상태 추적 필수)[1]. ink는 선택 뒤 흐름을 다시 모으는 문법(gather)을 가짐[2] | 지금 `[분기: id]` + 플래그 → 다음 장 반영이 분기-병목. **플래그를 잃지 않는 것**(N2)이 전제 |
| 품질 기반·스토리렛 | 수치 상태가 조건을 채우면 열리는 작은 조각, 살리언스 기반은 상황에 가장 맞는 조각을 시스템이 고름[3]. 스토리렛은 단순·원자적·튼튼·재조합 가능[4]. 순서가 중요한 사건에는 약함[5]. "resource narrative"라는 이름도 제안됨[6] | 메인은 분기-병목, **인연 톡·일정 장면·사이드**는 스토리렛(조건 → 조각)으로 많이 만들어 두고 엔진이 고르는 구조가 맞음 |
| VN 표준 기능 | Ren'Py: 기본은 **읽은 텍스트만 스킵**, 롤백으로 선택 다시 고르기, 자동 진행, 세이브·로드[7]. 대사 기록은 화자·대사·음성을 함께 저장[8] | 건너뛰기 기본값을 "읽은 것만 + 선택지에서 멈춤"으로 |
| 말투 유지 | 대화 8턴 안에 페르소나·지시가 흔들림[9]. CharacterEval: 다중 턴 대화 1,785개로 지식·페르소나 일관성 평가[10]. 역할극 대사의 화자 맞히기: 최고 LLM 68.8% vs 사람 90.8%[11] | 말투 예문 재주입은 이미 함. 자동 "말투 판정"은 정확도가 낮아 **보조 지표로만** |
| 계획 → 집필 | Re3·DOC: 계획(개요)을 먼저 세우면 플롯 일관성이 뚜렷이 오름[12][13] | 1장도 이후 장과 같은 "구성 → 집필", 세계관 직후 설계 |
| LLM 채점과 편향 | GPT-4 판정은 사람과 80% 넘게 일치하지만 위치·장황함·자기 선호 편향[14]. 자기 글을 알아볼수록 자기 글을 높게 침[15]. 창작 평가(TTCW)에서 LLM 채점은 전문가 평가와 양의 상관이 없었음[16]. 권장: 상세한 루브릭, 정오·1~5처럼 구체적 출력, 생각을 켠 채점, **생성 모델과 다른 모델로** 채점[17] | "재미" 점수는 쓰지 않고, 검사 가능한 **이진 항목**(설정 모순·등장 계획 준수·복선 회수·화자 등록)만. 순서를 바꿔 두 번 판정 |

## 3. 제안

| # | 제안 | 해결 | 위치 | 규모 |
|---|---|---|---|---|
| 3-1 | **1장 경로 통일**: 깊이 설정이 '꼼꼼하게'면 1장도 구성 → `writeStages` → `storyWrapUp`. 깊이와 무관하게 `codex`·`autoNpcs`·`debutResolve`·`v2BalanceChapter`는 호출 | N1 | `buildNewGameDraft` c3b 이후(`0250:251~`) | M |
| 3-2 | **시나리오 설계 자동 생성**: 세계관 단계 직후 `planAI('new')`를 부르거나 세계관 스키마에 설계(로그라인·막·반전·복선)를 포함, 1장 생성에 `planCtx(1)` | N1 | `0250:213~`, `0465` | M |
| 3-3 | **건너뛰기 = 다음 선택지까지 빨리 감기**: `vnStep` 빨리 감기 상태 — 배경·음악·`[분기]` 같은 명령은 적용하고 `선택:`에서 멈춤. 처음 보는 대본이면 한 번 확인 | N2 | `vnskip`(`020:68`), `vnStep`(`0460:43`) | S |
| 3-4 | **VN 편의**: 글자 속도·자동 간격 설정(설정 → 소리·화면), 읽은 줄 기록(대본 해시 + 줄 번호) → "읽은 것만 건너뛰기", UI 숨기기(탭하면 복귀) | N3 | `0460:102~104`, 설정 | S~M |
| 3-5 | **분기 플래그 검사**: `planCheck`에 "정의한 분기 플래그가 병목 이후 장 프롬프트에 실제로 쓰였는가", 대본 점검 규칙에 "분기 장인데 `[분기: id]` 뒤 `선택:` 없음" | N2 | `planCheck`(`0465:24`), `0535` | S |
| 3-6 | **생성물 평가(선택)**: 장 생성 후 `quick` tier로 **다른 공급자·모델**이 이진 루브릭 판정 — ① 세계관·이전 장과 모순 ② 등장 계획 위반(아직 안 만난 인물 등장) ③ 이번 장에 심기로 한 복선 누락 ④ 대본 화자가 등록된 인물·NPC인가(이건 코드로도 가능). 순서를 바꿔 2회 판정해 엇갈리면 "확인 필요". 결과는 콘텐츠 점검 항목으로 표시만 하고 자동 수정은 사람이 고름 | N4 | `aiChapterGen` 뒤(`0240:199`), `0535` | M |
| 3-7 | **스토리렛 형식의 인연·사이드**: 인연 톡·일정 장면을 `{조건(호감도·플래그·장 진행·장소), 내용, 결과(플래그·호감도)}` 스키마로 여러 개 생성해 두고, 엔진이 조건에 맞는 것을 고름. 일정 장소마다 장면 하나가 반복되는 문제([play-systems.md](play-systems.md) E9)도 해결 | 다양성 | `0135-schedule.js`, `0455` 인연 톡 | M~L |

## 4. 수치

- 글자 속도: 2글자/28ms ≈ 71자/초. 자동 간격: 30자 대사면 2.2초, 60자면 3.4초.
- 1장 대본 분량(지시): 스테이지 4개 × (pre 15~25줄 + post 8~15줄) = 92~160줄. 샘플 게임 1장 실제는 91줄(대사 56줄).

## 5. 확장 아이디어

- 분기별 다른 결말(멀티 엔딩)과 플래그 조건 스테이지 — [story-design.md](story-design.md) 확장 아이디어와 같음
- 롤백(이전 대사로 되돌아가 선택 다시 고르기)

## 6. 출처

1. Sam Kabo Ashwell, "Standard Patterns in Choice-Based Games", 2015 — https://www.ifwiki.org/Standard_Patterns_in_Choice-Based_Games
2. inkle, Writing with ink — https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md
3. Emily Short, "Beyond Branching: Quality-Based, Salience-Based, and Waypoint Narrative Structures", 2016 — https://emshort.blog/2016/04/12/beyond-branching-quality-based-and-salience-based-narrative-structures/
4. Emily Short, quality-based narrative — https://emshort.blog/tag/quality-based-narrative/
5. Failbetter Games, "Don't poke that narrative: engineering principles" — https://www.failbettergames.com/dont-poke-that-narrative-engineering-principles-part-1
6. Dan Cox, Simple QBN — https://videlais.github.io/simple-qbn/qbn
7. Ren'Py 튜토리얼(플레이 기능) — https://sources.debian.org/src/renpy/8.3.4%2Bdfsg-6/tutorial/game/tutorial_playing.rpy
8. Ren'Py, Dialogue history — https://renpy.org/doc/html/history.html
9. Li et al., "Measuring and Controlling Instruction (In)Stability in Language Model Dialogs", 2024 — https://arxiv.org/abs/2402.10962
10. Tu et al., "CharacterEval", 2024 — https://arxiv.org/abs/2401.01275
11. 역할극 화자 식별 연구, 2025 — https://arxiv.org/abs/2508.10014
12. Yang et al., Re3, EMNLP 2022 — https://arxiv.org/abs/2210.06774
13. Yang et al., DOC, 2022 — https://arxiv.org/abs/2212.10077
14. Zheng et al., "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena", 2023 — https://arxiv.org/abs/2306.05685
15. Panickssery et al., "LLM Evaluators Recognize and Favor Their Own Generations", 2024 — https://arxiv.org/abs/2404.13076
16. Chakrabarty et al., "Art or Artifice? Large Language Models and the False Promise of Creativity"(TTCW), 2023 — https://arxiv.org/abs/2309.14556
17. Anthropic, Define success criteria and build evaluations — https://platform.claude.com/docs/en/test-and-evaluate/develop-tests
