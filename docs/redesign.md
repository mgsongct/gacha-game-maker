# 재설계 — class 구조·상속 계층

사용자 지시(`docs/directives.md` U20·U21): 함수만 늘어놓고 class 구조·상속 계층이 없으며 중복 구현이 많음 — **빌드된 index.html에서 거꾸로 재설계**. 입력은 **원안 `index.html`(13a3fe9)** 과 **지금 빌드된 `www/index.html`**. 지금 `src/`는 폐기 대상(살려서 고치지 않음).
원칙(같은 대장): 기능 = data의 CRUD 일괄 단위 · 바꾸는 길은 한 창구 · 단일 책임 · SOLID/DRY/KISS/YAGNI · Model·Controller·View 분리.

## 1. 거꾸로 분석 (도구: `node tools/redesign.mjs --rev 13a3fe9 --label original` · `node tools/redesign.mjs --label www` → `tools/out/redesign-*.md`)

| 잰 것 | 원안 | 지금 | 뜻 |
|---|---|---|---|
| 함수 · class | 1437 · 0 | 2066 · 0 | 모든 일이 전역 함수 — 상태·행동을 묶은 단위가 없음 |
| AI 생성 흐름(글 AI를 부르는 함수) | 35 | 50 | 문맥 → 프롬프트 → 호출 → 해석·검증 → 반영 → 저장을 기능마다 따로 구현 |
| 창 열기(openModal을 부르는 함수) | 110 | 124 | 창 머리·본문·버튼·닫기를 창마다 따로 |
| 화면 그리기(…HTML) | 53 | 86 | 화면 틀을 화면마다 따로 |
| 그림 생성 흐름 | 23 | 22 | 그림 요청·후보·등록을 따로 |
| `chars.json`을 쓰는 함수 | 37 | 56 | 캐릭터 data의 만들기·고치기·지우기 창구가 없음 |
| `prog.json`을 쓰는 함수 | 92 | 80 | 진행 data 창구가 없음(칸 표만 있음) |
| `meta.json`을 쓰는 함수 | 10 | 27 | 설정 data 창구가 없음 |
| `world.json` · `banners.json` · `lib.json` · `chapters.json` | 7 · 11 · 17 · 12 | 12 · 15 · 20 · 15 | 같음 |
| 구조가 같은 함수 · 같은 호출 뼈대 | 0 · 7 | 1 · 8 | 글자 그대로 복사보다 **같은 역할을 다른 모양으로 되풀이**한 것이 대부분(위 역할 꼴) |

원안도 class가 없고 같은 역할을 기능마다 함수로 되풀이하는 구조였고, 포크가 그 위에 같은 꼴로 기능을 더해(함수 +629) 되풀이가 늘었음.

## 2. 설계 — class와 상속 계층

되풀이되는 역할 꼴은 상위 class(템플릿 메서드), data마다 창구 class 하나.

```
App                         부팅 · 화면 전환(라우터) · 동작 등록부(기능이 제 동작을 등록 — 중앙 분배기 없음) · 그리기 차례
Store                       게임 상태 불러오기·저장·형식 이전(버전 차례)·저장 표시·백업·데이터 폴더 — 저장소 갈래(STORE_POLICY)
 └ SyncAdapter              PC 서버 · GitHub · 한 기기(lease) · 게시·구독
Repository<T>               data 하나의 창구: list · get · create · update · remove · normalize(형식 맞춤) · validate · 저장 표시
 ├ Characters  chars.json   (+ 이격·바리에이션 상속, 개성, 스킨)
 ├ Npcs        npcs.json
 ├ Chapters    chapters.json  (장·스테이지·대본)
 ├ Events      events.json
 ├ Threads     threads.json   (톡 스레드)
 ├ Banners     banners.json
 ├ Library     lib.json       (배경·소품·CG·적·지도·아이콘)
 ├ World       world.json     (세계 설명·도감·세력·시나리오 설계)
 ├ Relations   rels.json
 ├ Meta        meta.json      (용어·규칙·밸런스·연출·설정)
 └ Progress    prog.json      — Slot들의 묶음
Slot                        진행 칸 하나: make · ok · stale(날·주) · fill · tick · read(상태 그대로) · write(맞춰 저장)
Service                     밖과의 경계(설정·오류·재시도)
 ├ TextAI                   글 AI 공급자들(Anthropic·OpenAI 호환·Gemini·Vertex·Copilot …)
 ├ ImageAI                  NovelAI · ComfyUI · 후보·등록
 ├ Sound                    BGM · 효과음 · 음성
 └ Updater                  앱 업데이트 채널
PromptStudio                프롬프트 조각 · 조립 — 모든 Generator가 씀(사용자 지시로 한 곳)
Generator                   AI 생성 흐름 하나(템플릿 메서드): context() → prompt()(PromptStudio) → TextAI 호출 → parse·validate(스키마) → repair(고쳐 다시 묻기) → apply(Repository 창구로) — 50개 흐름을 이 상위의 하위로
Engine (순수, Worker 가능)  Combat · Construct · Expedition — 지금 src/modules의 순수 엔진
View                        html(상태) → 글 · 동작 묶기
 ├ Screen                   탭·하위 화면(로비·대원·계약·작전·상점·스토리 …) — 86개 화면 그리기를 화면 class로
 └ Dialog                   창: 머리·본문·버튼·닫기·뒤로 — 124개 창 열기를 몇 가지 창 종류(폼·목록·확인·그림 보기·진행)의 하위로
Feature                     기능 하나 = 가진 Repository(창구) + Generator + View + 동작(Controller) — App에 등록
```

### 기능(Feature) — 원안 기능 구성(`docs/modules.md` §1–13)에 포크 기능을 가진 data로 흡수

| Feature | 가진 data(창구) | Generator(예) | View(예) | 원안 절 · 흡수한 포크 기능 |
|---|---|---|---|---|
| Characters | Characters · Progress(보유·성장·호감) | 캐릭터·개성·스킨·바리에이션 | 대원·캐릭터 시트·스킨 | 9 성장 · 바리에이션·상속형 이격·개성 |
| Acquire | Banners · Progress(천장·건조 자원) | 픽업·건조 디자인 | 계약·건조 | 8 가챠 · 건조/영입 |
| Battle | Progress(편성·스테이지) · Meta(전장 규칙) | 보스 패턴 | 전투·편성·출격 | 6 전투 v2 · 대열·출격·전장 규칙 |
| Challenge | Progress(레이드·심연·탑) | 이벤트 전투 | 도전 | 9 콘텐츠 · 탑·스테이지 양식 |
| Story | Chapters · Events · Threads(장 톡) | 장·스테이지·외전·시나리오 설계·기억 | 스토리·대본 재생·연출·오프닝 | 7 대본 엔진 · 11 스토리 공장 · 시나리오 설계·연출 |
| World | World · Relations · Library(적·배경) | 세력·도감·관계·적 | 세계관·도감·관계도 | 세력·적 도감·등장 계획 |
| Messenger | Threads · Progress(받은 톡·갠톡) | 톡·갠톡 | 메신저 | 10 메신저 |
| Economy | Progress(재화·상점·우편) | — | 상점·우편 | 9 경제 |
| LiveOps | Progress(시즌·일정) · Meta | liveTick·픽업·의상 | 운영·알림 | 9 라이브 · 일정·콘텐츠 점검 |
| Expedition | Progress(원정·파견) | — | 원정·파견 | 원정 · 파견 |
| Rules | Meta(규칙·밸런스) | 규칙 설명·포지션 | 게임 규칙·밸런스 | 게임 규칙·속성·포지션·밸런스 |
| NewGame | 새 게임 초안 | 새 게임(위 Generator들을 차례로) | 초안 편집 | 11 새 게임 |
| System | Store 설정 · Sync · Updater | — | 설정·동기화·업데이트 | 3 AI 연결 · 12 동기화 · 13 업데이트 |

## 3. 옮기는 길(도구로)

1. **틀 만들기**: 위 class의 뼈대 파일(상위 class 구현 + 빈 하위)을 새 src에 둠 — 지금 src는 버림(git 이력).
2. **함수 → class 메서드 대응표**: 두 index.html의 함수마다 역할 꼴(AI 생성·창·화면·data 쓰기)·쓰는 data로 어느 class의 무엇이 되는지 도구가 표로 냄(`tools/redesign.mjs`에 대응표) — 같은 역할의 되풀이는 상위 class 하나로 합쳐지고 하위는 다른 점(프롬프트·스키마·반영)만 가짐.
3. **채우기**: 대응표대로 하위 class를 채움. 깨지는 것은 이슈로 쌓음(사용자 지시 U16).
4. **복구**: 브라우저 시험·플레이 시험·규칙 전수검사로 제품 기능이 그대로인지 확인(지금 빌드된 index.html이 기준 동작).
