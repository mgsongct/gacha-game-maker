# 개발자 역할 — 이 프로젝트의 분야·기술을 전제로 한 기초지식과 기능 (조사)

사용자 지시(2026-11-04): 이 프로젝트의 개발 분야와 사용 기술을 전제로 개발자 역할에 필요한 기초지식과 기능을 조사해 역할로 다듬고 지침(CLAUDE.md)에 새김.
계기: 모듈 판정 도구를 화면 목록·호출 그래프 통계만으로 만들다가, 화면(View)과 처리(Controller)·데이터(Model)가 섞인 **계층 문제**를 기능 쪼개기 문제로 잘못 읽음(사용자 지적 — "아키텍처 패러다임 미준수", "개발자로서 기본 숙지 사항"). 저장 정책(브라우저 DB는 캐시, data 디렉토리 자동 동기화)을 어기는 설정 저장도 놓침.

조사 방법: 웹 검색(2026-11-04). 원문 사이트(martinfowler.com · refactoring.guru · inkandswitch.com · developer.mozilla.org)는 이 세션의 네트워크 허용 목록 밖이라 직접 열지 못했고, 검색 결과에 실린 원문 요약·인용과 2차 자료로 확인함 — 원문 대조가 필요한 항목은 「원문 미확인」으로 표시. 이 노트는 참고 자료이고, 지침에는 사용자 지시로 역할 요지만 둠(CLAUDE.md §0-2).

## 0. 이 프로젝트의 분야와 기술 (저장소에서 확인한 사실)

| 구분 | 내용 | 근거 |
|---|---|---|
| 분야 | 가챠·스토리 게임 **생성기·실행기·편집기**를 겸하는 단일 HTML SPA(사용자 정의) — 생성형 AI로 세계관·캐릭터·시나리오·그림을 만들고, 만든 게임을 구동하고, 고침 | CLAUDE.md §0 |
| 화면·처리 | 바닐라 JavaScript, 템플릿 문자열 + `innerHTML`로 그림(`render()`의 경로표 → 이름이 HTML로 끝나는 화면 함수), 동작은 `data-act` → `handle*Action` 분배 | `src/main/0180-ui-scroll.js`, `src/main/0510-actions/` |
| 빌드 | `src/`를 `build/build.mjs`가 한 파일로 합침, 본체는 저장소 준비 후 지연 실행(`text/ggm-main`) | `docs/build.md`, `docs/architecture.md` §2 |
| 계산 | 전투 코어는 Web Worker에서도 도는 순수 모듈(`GGMCombat`), 건조·원정 규칙 엔진도 순수 모듈 | `src/modules/` |
| 저장 | IndexedDB(`GGMStorage`)·localStorage(`appStorage`) = 캐시, PC 서버(`pc/ggm-server.py`)의 `data/<게임id>/<종류>.json` = 원본(사용자 정책), GitHub 저장소 동기화 | CLAUDE.md §0, `src/main/0360-sync/` |
| 배포 | PWA(서비스 워커 `www/sw.js` — 같은 출처 network-first·글꼴 cache-first), Capacitor 안드로이드 셸, 앱 업데이트(`version.json`) | `docs/architecture.md` §1 |
| 외부 서비스 | 글 AI(여러 제공자 프로필), 그림 AI(NovelAI·ComfyUI), 소리(Fish Audio·ElevenLabs), CORS 중계(Cloudflare Workers·Vercel) | `src/main/0020-ai-connect.js`, `proxy/` |
| 프롬프트 | 프롬프트 스튜디오(조각·조립·그림 태그)가 모든 프롬프트를 취합(사용자 지시) | CLAUDE.md §0-1 |
| 도구 | tree-sitter·ast-grep 정적 분석, Playwright 브라우저 시험, 래칫 기준선, CI | `tools/`, `build/test.mjs`, `.github/workflows/check.yml` |

## 1. 기초지식 — 영역별 개념 · 출처 · 이 프로젝트에 대면

### 1-1. 계층 분리 (분리된 표현 · MVC 계열 · 단방향 흐름)
- **분리된 표현(Separated Presentation)**: 실세계를 모델링하는 도메인 객체와 화면 요소인 표현 객체를 나눔 — 같은 도메인 코드에 여러 표현을 붙일 수 있게. Fowler는 MVC를 "가장 많이 인용되고 가장 많이 잘못 인용되는" 패턴이라 하고, 이름이 같아도 시스템마다 중요한 차이가 있다고 함. 테스트하기 쉽게 하려고 Passive View·Supervising Controller·Presentation Model로 더 나눔(GUI Architectures — 원문 미확인, 검색 요약).
- **단방향 흐름(Elm Architecture·MVU, Redux의 바탕)**: 사용자 입력(메시지) → update(상태를 바꾸는 유일한 곳) → view(상태의 순수 함수). 부작용은 update 흐름에서 일으킴 — **단일 진실 원천**.
- **이 프로젝트에 대면**: View = HTML·DOM을 만드는 함수(이름이 HTML로 끝나는 화면 함수·창 여는 함수), Controller = 동작을 받아 Model을 바꾸고 다시 그리게 하는 함수(`handle*Action`·흐름 함수), Model = 상태(`G`·`P()`)·규칙 엔진·저장·외부 서비스(AI·그림·소리). 원칙: 한 함수에 섞지 않음, **View는 상태를 바꾸지 않음**, **Model은 화면을 부르지 않음**. 지금 어긋난 예(코드 확인): 행동력 표시 `updStam()`이 회복 계산 `stam()`을 불러 상태를 고치고 저장 표시, `render()`가 우편 처리 `mailTick()`을 부름, 로비·도전 화면이 레이드 주간 갱신 `RAID()`(단계 계산·저장 표시)을 부름, 행동력 사용 `stamUse()`(Model)가 모자라면 직접 창 `openStam()`을 엶, 액션 처리기들이 처리 중에 창 HTML을 직접 만듦.

### 1-2. 모듈성 (응집·결합 · 컴포넌트 원칙 · 기능별 묶음)
- **응집 원칙**: REP(재사용 단위 = 릴리스 단위) · **CCP(같은 이유로 같은 때 바뀌는 것을 모음)** · CRP(같이 쓰이지 않는 것은 한 컴포넌트에 두지 않음). REP·CCP는 컴포넌트를 키우고 CRP는 줄이는 쪽이라 서로 당김(Robert C. Martin, *Agile Software Development* — 2차 자료).
- **결합 원칙**: ADP(의존 그래프에 순환 없음) · SDP(안정된 쪽으로 의존) · SAP(안정한 만큼 추상적).
- **기능별 묶음(package by feature · vertical slice) vs 계층별 묶음**: 기능별로 묶으면 기능 응집과 변경 국소성이 높음. 기능 경계가 뚜렷하지 않으면 계층별이 낫고, 어려운 점은 "무엇이 기능인가"를 정하는 것과 기능 묶음 안이 엉키지 않게 하는 것(Vaadin 공식 문서).
- **이 프로젝트에 대면**: 사용자 결정 — 기능 하나 = 모듈 하나(실행기·편집기·생성기 부분을 같이 담음), 새 기능은 그 기능 모듈 안으로(새 파일 남발 금지). 기능 모듈 **안에서** View·Controller·Model이 함수 단위로 갈려야 함(1-1). "기능"은 화면 목록이 아니라 같은 데이터·처리(CCP)로 정하고, 화면·창은 그 기능의 View로 연결함.

### 1-3. 코드 냄새와 리팩터링 (사용자가 지적한 문제의 표준 이름)
| 냄새(Fowler·refactoring.guru) | 뜻 | 이 프로젝트에서 부르던 이름 | 고치는 법 |
|---|---|---|---|
| Divergent Change(발산적 변경) | 한 모듈이 서로 관계없는 여러 이유로 바뀜 | 슈퍼 모듈 | Extract Class(나누기)·Move Method |
| Shotgun Surgery(산탄총 수술) | 한 가지를 바꾸려면 여러 모듈을 조금씩 고쳐야 함 — Divergent Change를 지나치게 고친 결과로도 생김 | 파편화(진행 칸 정의가 15곳) | Move Method/Field로 한곳에 모음 |
| Feature Envy(기능 욕심) | 함수가 제 모듈보다 다른 모듈의 데이터에 더 관심 | 영역 침범 | 그 데이터가 있는 모듈로 옮김 |
| Lazy Class(게으른 클래스) | 유지 비용만큼 일을 하지 않음 | 허당·조각 모듈 | Inline Class(합치기) |
- 둘은 "변경 방해(Change Preventers)", Feature Envy는 "결합(Couplers)", Lazy Class는 "없어도 되는 것(Dispensables)"으로 분류됨(refactoring.guru 미러·강의 자료 — 원문 미확인).
- **리팩터링 기율**: 동작을 바꾸지 않는 작은 단계로, 단계마다 시험을 녹색으로 유지.

### 1-4. 상태와 데이터 (단일 진실 원천 · 데이터 주도 · 저장 형식 이전)
- **데이터 주도 설계**: 게임 내용(능력치·대사·확률)은 코드가 아니라 데이터에 두고, 엔진에는 게임 고유 코드를 두지 않음. 프로그래머는 디자이너가 엔지니어 없이 일하게 가져오기·보기·시험 도구(콘텐츠 파이프라인)를 만듦, 데이터는 중복하지 않고 참조(Cornell CS3152 강의). 이 앱은 생성된 게임 data(JSON)가 그 데이터이고, 생성기·편집기가 콘텐츠 파이프라인.
- **저장 형식 버전과 이전**: 저장 데이터에 형식 버전을 두고(빌드 번호와 별개), 버전마다 이전 함수를 차례로 이어 실행(4→5→6), 이전할 수 없으면 버리는 대비, **기본값 위에 저장 데이터를 덮어** 빠진 칸이 깨지지 않게, 쓰기 실패 대비 두 벌 번갈아 쓰기·무결성 검사(Meta 개발자 문서). 이 앱의 `fix()`·`AUDIT_RULES`·`genVer`가 이 일을 함 — 이전 규칙이 한곳에 모이고 버전이 명시돼야 함.
- **단일 진실 원천**: 같은 상태의 정의(기본값·만들기·리셋·형식 보정)는 한곳(1-3 산탄총 수술 방지).

### 1-5. 브라우저 저장소와 동기화
- **할당과 축출**: 브라우저가 출처(origin)마다 할당량을 정하고, 저장 공간이 모자라면 "최선(best-effort)" 데이터를 LRU로 지울 수 있음. `navigator.storage.persist()`로 지속 저장을 요청, `navigator.storage.persisted()`·`navigator.storage.estimate()`로 확인. localStorage·sessionStorage는 문자열 키·값(출처당 약 5MiB — 2차 자료), 사생활 보호 모드에서는 끝나면 지워짐(MDN — 원문 미확인).
- **로컬 우선(local-first)**: 즉시 반응, 기기에 갇히지 않음, 오프라인 동작, 사용자가 데이터의 최종 권한 등 일곱 가지 이상(Ink & Switch 2019 — 저자들도 엄격한 목록보다 "정도"로 보라고 함).
- **이 프로젝트 정책(사용자 지시)**: 브라우저 DB(IndexedDB·localStorage)는 **캐시**, 원본은 PC 서버 옆 `data/` 디렉토리 — 자동 동기화. 따라서 사용자가 만든 내용이나 게임을 다시 만들 때 필요한 설정을 브라우저 저장소에만 두면 정책 위반. **확인된 사실**: PC 서버 저장(`pcPush`)이 보내는 것은 `syLsKeys(true)`(게임 목록 `starfall-projects`·처음 설정·게임별 저장·그림 AI `starfall-nai`·소리 `starfall-sound`·글 AI 프로필 `starfall-ai-profiles`)와 IndexedDB 그림뿐 — 프롬프트 교훈 `ggm-plessons`·사용자 프리셋 묶음 `ggm-packs`·글 AI 슬롯 `ggm-llmslot`·공유 에셋 보관함 `ggm-shared-assets`·새 게임 초안 `ggm-drafts`·`ggm-draft2`·게시 설정 `ggm-pub`·GitHub 연동 설정 `ggm-sync`는 브라우저에만 있음(`src/main/0360-sync/010-common.js` `syLsKeys`). 기기 고유값(`ggm-devid`)·화면 방향 같은 기기 설정은 성격상 기기에 남는 것 — 어디까지 data로 보낼지는 사용자 결정(문제 목록 S6).

### 1-6. 보안
- **XSS 싱크**: `innerHTML`·`outerHTML`·`insertAdjacentHTML`·`document.write`는 HTML을 해석하는 싱크 — 글은 `textContent`, HTML이 꼭 필요하면 정화(DOMPurify)(OWASP XSS Prevention Cheat Sheet — 2차 자료). 이 앱은 템플릿 문자열 + `innerHTML`로 그리므로 **모든 데이터 값은 `esc()`를 거쳐야 함**(도구: HTML 주입 점검 `tools/lib/extra.mjs` htmlInject).
- **AI 출력은 신뢰하지 않는 입력**: OWASP LLM Top 10(2025) LLM05 부적절한 출력 처리 — 검증·정화 없이 다음 단계로 넘기면 XSS 등으로 이어짐, LLM01 프롬프트 주입이 그 통로가 됨. 이 앱은 AI가 만든 이름·대사·설명을 화면에 그리므로 1-6 첫 항목과 같이 다룸, 구조화 출력은 스키마로 검증(1-8).
- **웹 저장소의 민감 정보**: OWASP HTML5 Security Cheat Sheet는 민감 정보를 localStorage에 두지 말라고 함 — XSS 하나로 전부 읽힘, 암호화되지 않음. 이 앱은 사용자 기기에서 사용자가 자기 AI 키를 넣는 구조라 키가 브라우저 저장소·data 파일에 있게 됨 — 어디에 어떻게 둘지(파일 동기화 포함)는 사용자 결정(문제 목록 S6).

### 1-7. 성능
- **메인 스레드 밖**: 무거운 계산을 Worker로 옮기면 입력·그리기가 막히지 않음(INP 개선). Worker는 DOM에 접근할 수 없어 화면 코드는 메인 스레드에 남고, 메시지 비용이 있음 — 화면 상태와 게임 논리를 나누는 것이 전제(web.dev Off-main-thread). 이 앱의 전투 코어(010~030)가 그 예 — 순수 모듈 경계를 지켜야 Worker에서 돔.
- **서비스 워커 캐시 전략**: network-first(새것 우선, 실패하면 캐시) · cache-first(버전 붙은 주소에 맞음 — 한 번 캐시되면 갱신 안 됨) · stale-while-revalidate(Workbox runtime caching).

### 1-8. 생성형 AI 연동
- **구조화 출력**: JSON 스키마로 응답 형식을 제한하면 깨진 JSON·빠진 필수 칸·자료형 불일치를 막음. 제한이 걸리지 않는 경우에는 여전히 오류 처리·재시도가 필요(Claude 공식 문서 Structured outputs). 이 앱은 여러 제공자를 쓰므로 응답을 **스키마로 검증하고 실패하면 고쳐 다시 묻는 흐름**이 Model 계층의 일.
- **프롬프트 기법**: 명확·직접하게, 예시(입력과 원하는 출력을 같이 — 예시 모양을 그대로 따라 함), 단계적으로 생각하게, XML 태그로 지시·예시를 구조화, 역할 부여, 복잡한 일은 단계로 나눠 잇기(체인 — 단계 사이에 검사 지점)(Anthropic 프롬프트 엔지니어링 문서 — 일부 원문 미확인). 이 앱은 프롬프트 스튜디오가 조각·조립을 맡음(사용자 지시) — 기법은 조각에 담고, 기능 코드는 데이터만 넘김.
- **검수·향상**: 생성 → 검수(규칙·AI) → 고침의 체인이 기본(스토리 체계 연구 #37과 연결).

### 1-9. 품질 공학
- **시험 피라미드**: 빠르고 많은 단위 시험 → 통합 → 적은 종단(E2E) 시험. 위로 갈수록 느리고 비싸서 적게. 거꾸로 된 "아이스크림 콘"(대부분 느린 E2E·수동)은 피함(Mike Cohn, Fowler의 Practical Test Pyramid — 2차 자료). 이 앱은 브라우저 시험(Playwright)이 많고 순수 모듈 단위 시험이 적음 — 규칙 엔진·Model 함수는 단위 시험이 맞음.
- **새 코드 기준 품질 게이트**: 품질 조건을 새로 쓰거나 바꾼 코드에 걸어, 옛 문제에 막히지 않으면서 점점 깨끗하게(SonarSource Clean as You Code). 이 앱의 래칫 기준선(`tools/baseline.json`)이 같은 생각 — 늘면 실패, 줄면 기준선을 내림.
- **정적 분석**: 파서(tree-sitter·ast-grep)로 구조 원칙을 오류로 막음(CLAUDE.md §2). 판정은 위 원칙(계층·응집·냄새)을 기준으로 — 통계만으로 판정하지 않음.

## 2. 역할로 — 이 프로젝트의 개발자가 하는 일

1. **바꾸기 전에 자리를 찾음**: 연관 맵(`node tools/map.mjs --why`)으로 그 일이 어느 기능·어느 계층(View·Controller·Model)·어느 data 경로인지, 생성기·실행기·편집기 중 어디인지.
2. **계층에 맞게 둠**: 화면 함수는 그리기만, 상태 변경·저장·AI는 Model, 그 둘을 잇는 것은 Controller. 한 함수에 섞지 않음.
3. **기능 하나 = 모듈 하나**: 같은 이유로 바뀌는 것을 모음(CCP). 슈퍼(발산적 변경)·파편화(산탄총 수술)·영역 침범(기능 욕심)·조각(게으른 모듈)을 도구로 재고 표준 리팩터링으로 고침 — 레이어·모듈을 늘려서 덮지 않음(사용자 지시).
4. **상태는 한곳에서 정의**: 기본값·만들기·리셋·형식 이전을 한곳에, 저장 형식에 버전, 기본값 위에 덮기.
5. **저장 정책을 지킴**: 브라우저 저장소는 캐시, 원본은 data 디렉토리 — 새 저장 키를 만들면 동기화 대상인지부터.
6. **안전하게 그림**: `innerHTML`로 가는 값은 `esc()`, AI 출력은 신뢰하지 않는 입력으로 검증.
7. **AI 연동은 Model에서**: 스키마 검증·재시도·비용, 프롬프트 글은 스튜디오 조각.
8. **도구로 재고 시험으로 확인**: 측정은 도구로(수동 금지), 래칫으로 늘지 않게, 작은 단계로 리팩터링하고 시험을 녹색으로.

## 3. 지금 어긋난 것 (확인된 사실 → `docs/problems.md` 7-6)
- 계층 섞임·방향 위반: 1-1의 예들(그리다가 상태 변경, Model이 창을 엶, 처리기가 창 HTML을 만듦) — 도구가 함수마다 재고(`tools/lib/arch.mjs`, `docs/map.md` 3절) 늘면 막음(섞임 60 · 방향 위반 182, 2026-11-04).
- 모듈 판정: 계층 × 같은 데이터·처리로 묶은 기능으로 다시 세움(`docs/map.md` 4절) — 화면 목록 기준 판정은 지움.
- 저장 정책: 앱에 저장 정책 표(`STORE_POLICY`)를 두고 동기화가 그 표를 따르게 함, 도구가 코드의 저장 키마다 갈래를 확인(`docs/map.md` 5절).

## 출처
- [Martin Fowler — GUI Architectures](https://www.martinfowler.com/eaaDev/uiArchs.html) (원문 미확인 — 검색 요약) · [MVC 요약(architect-handbook)](https://herrera-ignacio.github.io/architect-handbook/legacy/design-patterns/web-presentation/mvc) · [Patterns of Enterprise Application Architecture ch.14](https://www.oreilly.com/library/view/patterns-of-enterprise/0321127420/ch14.html)
- [functional-frontend-architecture (Elm 계열 정리)](https://github.com/paldepind/functional-frontend-architecture) · [Taming state with Elm Architecture](https://proandroiddev.com/taming-state-in-android-with-elm-architecture-and-kotlin-part-1-566caae0f706)
- [Principles of package and component design](https://blog.avenuecode.com/principles-of-package-and-component-design) · [Helix — Principles of Package Design](https://helix.sitecore.com/appendix/package-principles.html)
- [Vaadin — Package by feature/layer](https://vaadin.com/docs/latest/building-apps/architecture/packages) · [SSW — Vertical slice architecture](https://www.ssw.com.au/rules/rules-to-better-vertical-slice-architecture)
- [refactoring.guru — Shotgun Surgery](https://refactoring.guru/smells/shotgun-surgery) (원문 미확인) · [Divergent Change(미러)](https://refactoringguru.cn/smells/divergent-change) · [Change preventers](https://smells-to-refactorings.gitbook.io/smells/change-preventers) · [UFMG bad smells 강의](https://homepages.dcc.ufmg.br/~figueiredo/disciplinas/lectures/bad-smells_v01.pdf)
- [Cornell CS3152 — Data-Driven Design](https://www.cs.cornell.edu/courses/cs3152/2014sp/lectures/14-DataDriven.pdf) · [FOSDEM 2012 — Data-Driven and Component-Based Game Entities](https://fosdem.org/2012/schedule/event/536/104_Thomas_Kinnen_-_Data-Driven_and_Component-Based_Game-Entities_-_Slides.pdf)
- [Meta — Save game best practices](https://developers.meta.com/horizon/documentation/unity/ps-save-game-best-practices/) · [Save File Migration](https://arawn-software-publishing.gitbook.io/arawn/basics/save-file-migration)
- [MDN — Storage quotas and eviction criteria](https://developer.mozilla.org/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) (원문 미확인) · [Web storage 정리(patrickbrosset)](https://patrickbrosset.com/articles/2023-01-17-web-storage/)
- [Ink & Switch — Local-first software](https://inkandswitch.com/local-first/) (원문 미확인) · [Wikipedia — Local-first software](https://en.wikipedia.org/wiki/Local-first_software) · [Kleppmann — local-first at Onward!](https://martin.kleppmann.com/2019/10/23/local-first-at-onward.html)
- [OWASP XSS Prevention 요약(stormfors KB)](https://stormfors-kb.pages.dev/building/xss-prevention) · [OWASP HTML5 Security Cheat Sheet(미러)](https://pentest.y-security.de/OWASP%20Cheat%20Sheet%20Series/HTML5_Security_Cheat_Sheet/) · [Sensitive data in Web Storage](https://detectors.xygeni.io/xydocs/sast/detectors/javascript/javascript.sensitive_data_web_storage.html)
- [OWASP Top 10 for LLMs 2025 (HackerOne 정리)](https://www.hackerone.com/ai/owasp-top-10-llms-2025) · [LLM05 정리](https://guptadeepak.com/agent-security/threats/llm05/)
- [web.dev — Off-main-thread](https://web.dev/articles/off-main-thread) · [web.dev — Workers basics](https://web.dev/articles/workers-basics) · [web.dev — Runtime caching with Workbox](https://web.dev/articles/runtime-caching-with-workbox)
- [Claude 문서 — Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) · [Claude 문서 — Use XML tags](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/use-xml-tags)
- [Martin Fowler — Software Testing Guide](https://martinfowler.com/testing) · [Practical Test Pyramid 요약](https://documentdrivendx.github.io/helix/research/fowler-practical-test-pyramid/)
- [SonarSource — Clean as You Code](https://docs.sonarsource.com/sonarqube-server/10.5/user-guide/clean-as-you-code) · [Sonar 블로그](https://www.sonarsource.com/blog/clean-as-you-code)
