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

## 2. 추상 매핑 — 제품이 가진 data → 기능(주인 하나)

사용자 지시(U22): 「추상적으로 매핑부터 먼저 하고 설계부터 하고 진행」. 기능 = 그 data의 CRUD 일괄 단위(U9)이므로, 먼저 제품(index.html)이 가진 data를 기능에 하나씩 나눠 줌. 함수는 이 표를 따라 「무엇을 만들고·고치고·지우나」로 기능이 정해짐(`node tools/redesign.mjs --map`). data 목록은 연관 맵(`docs/map.json`)의 data 파일·첫 칸.

| 기능 | data 파일 | meta.json 칸 | prog.json 칸 | world.json 칸 |
|---|---|---|---|---|
| Characters | `chars.json` `npcs.json` | `variants` `persona` `design` `castSex` | `owned` `mat` `tokens` `gifts` `giftSeen` `skinOwn` | |
| Acquire | `banners.json` | `construct` `gated` | `pity` `pities` `guar` `spark` `firstTen` `curBanner` `cres` `cbuild` `history` `hist2` | |
| Battle | | `story` | `squad` `sortie` `stars` | |
| Challenge | | `farms` | `raid` `rogue` `run` `tower` `farmClear` | |
| Story | `chapters.json` `events.json` `opening.json` | `storyMemory` `tone` | `cleared` `curEvent` `seenOpening` `castDone` `scene` `after` | `plan` `plot` |
| World | `rels.json` | `bestiary` `bible` `cast` `relProf` | `cxSeen` `cxBadge` | `factions` `codex` `codexNotes` `lore` `name` `summary` `source` |
| Messenger | `threads.json` | | `inbox` `fchat` `fcPhoto` `fcAff` | |
| Player | | | `player` `avatar` `gender` `genderTxt` `bio` `look` `nameAsked` `hideEyes` `title` | |
| Economy | | `shop` | `gold` `gems` `cash` `shop` `shopBuy` `mail` `mailBuild` `mailInit` `pass` `stam` `daily` `dm` | |
| LiveOps | | `spots` `auditSeen` | `live` `sched` `prepAsked` `prepNever` `bootPrep` `flags` `gateSeen` | |
| Expedition | `dispatches.json` | `expedition` | `exped` `disp` `dboard` | |
| Rules | | `rules` `balance` `elems` `roles` `positions` | | |
| NewGame | | `draft` | | |
| PromptStudio | | `prompts` | | |
| Image | `lib.json` | `artTags` `artNeg` | | |
| System | `game.json` | `title` `sub` `theme` `accent` `terms` `logoStyle` `manual` `pub` `subscr` | `settings` `presets` `lobbyBg` `lobbyMode` `lbSize` `titleBg` `titleChar` `gachaBg` `dgBg` `csFull` `useCg` `skillCut` `battleMotion` `vnDirect` `vnStage` `memoOn` `savedAt` | |
| 미정(도구로 확인) | | | `back` `ids` `prompt` `sec` `seen` `total` | |

### 2-2. 화면 → 기능 (data를 쓰지 않는 화면·창 함수의 자리)

화면 단위는 연관 맵이 index.html에서 뽑은 것(탭 화면 31 · 설정 패널 28 · 배경 처리 4 — 창 77은 그 창을 여는 화면의 기능). `node tools/redesign.mjs --map`이 data로 기능이 안 정해진 함수를 이 표로 놓음(이름이 화면 이름에 들어 있으면 그 줄).

| 기능 | 화면·패널·배경 처리 |
|---|---|
| Characters | `대원` `로비` `훈련` `캐릭터 개성·매력` |
| Acquire | `계약` `영입` `conSettingsPanel` |
| Battle | `연습장` `전투 체계` |
| Challenge | `도전` `abyss` |
| Story | `작전` `이벤트` `evd` `시나리오 설계` `스토리 기억 관리` `연출` |
| World | `도감` `세력·몬스터·등장 관리` `세계관:` |
| Economy | `상점` `캐시 상점` `evshop` `시즌 패스` |
| LiveOps | `공지` `일정` `시즌 운영` `콘텐츠 점검·업그레이드` `실행 중 AI` |
| Expedition | `disp` `exSettingsPanel` |
| Rules | `게임 규칙 (속성·포지션·능력치)` `밸런스 관리` |
| Player | `관리관` |
| NewGame | `새 게임 생성` `AI 창작실` |
| PromptStudio | `프롬프트 스튜디오` |
| Image | `그림 AI` `에셋 관리` `자료실` |
| System | `설정` `화면·연출` `소리` `글 AI` `연동` `데이터` `앱 정보` `플레이 모드` `게시·구독` `아이폰·웹 연결` `PC 서버` `PC·폰 연동` `backupBlocks` `앱 업데이트` `불러오기` `앱 시작` |

### 2-3. 매핑 결과 — 함수 → 기능 · class 종류 (`node tools/redesign.mjs --map` → `tools/out/redesign-map-www.md`·`.json`, 함수마다 기능·까닭·종류)

| 기능 | 합 | Repository | Generator | Service | Controller | Screen | Dialog | Helper |
|---|---|---|---|---|---|---|---|---|
| Acquire | 72 | 20 | 1 | 1 | 1 | 19 | 9 | 21 |
| Battle | 29 | 6 | 0 | 0 | 4 | 5 | 3 | 11 |
| Challenge | 91 | 11 | 0 | 0 | 8 | 24 | 3 | 45 |
| Characters | 376 | 46 | 12 | 1 | 13 | 91 | 27 | 186 |
| Economy | 58 | 10 | 1 | 1 | 2 | 18 | 5 | 21 |
| Expedition | 40 | 11 | 0 | 0 | 1 | 7 | 2 | 19 |
| Image | 245 | 9 | 1 | 6 | 8 | 39 | 6 | 176 |
| LiveOps | 79 | 6 | 5 | 2 | 6 | 11 | 7 | 42 |
| Messenger | 40 | 3 | 2 | 0 | 2 | 18 | 1 | 14 |
| NewGame | 70 | 0 | 1 | 2 | 4 | 2 | 0 | 61 |
| Player | 16 | 2 | 0 | 0 | 0 | 5 | 1 | 8 |
| PromptStudio | 15 | 1 | 1 | 1 | 0 | 1 | 1 | 10 |
| Rules | 47 | 5 | 3 | 0 | 3 | 7 | 2 | 27 |
| Shared | 244 | 0 | 6 | 11 | 16 | 66 | 11 | 134 |
| Story | 142 | 13 | 8 | 2 | 5 | 32 | 16 | 66 |
| System | 296 | 2 | 3 | 19 | 15 | 82 | 21 | 154 |
| World | 83 | 11 | 4 | 0 | 0 | 5 | 4 | 59 |
| 미정 | 123 | 0 | 2 | 1 | 0 | 30 | 2 | 88 |

기능이 정해진 까닭: 쓰는 data 181 · 화면 507 · 읽는 상태 212 · 부르는·불리는 함수 799 · 공용(많이 불림) 25 · 공용(여러 기능) 219 · — 123

- **Shared**(공용 244): 25곳↑에서 불리거나 여러 기능이 같이 쓰는 함수 — 설계에서 상위 class(View·Dialog·Service·Generator)와 공용 도구로 감.
- **미정**(123): 매핑 표에 없는 data만 다루거나 이어진 함수가 없음 — 표를 채우거나 YAGNI로 지울 대상.
- 기능 크기: Characters 376 · System 296 · Image 245 가 큼 — 설계에서 하위 class로 더 나눔(예: Characters = 보유·성장 / 캐릭터 data·시트 / 이격·바리에이션).

## 3. 설계 — class와 상속 계층

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

### 기능(Feature) — 2절 매핑대로(원안 기능 구성 `docs/modules.md` §1–13에 포크 기능을 가진 data로 흡수)

| Feature | 가진 data(Repository 창구) | 매핑 함수 | 하위 class(나눔) | 원안 절 · 흡수한 포크 기능 |
|---|---|---|---|---|
| Characters | `chars.json` `npcs.json` · prog 보유·성장·호감·스킨 · meta 이격·개성 | 376 | Roster(보유·성장·호감) · CharacterSheet(캐릭터 data·시트 View) · Variants(이격 상속·바리에이션·스킨) · Persona(개성) | 9 성장 · 바리에이션·상속형 이격·개성 |
| Acquire | `banners.json` · prog 천장·건조 자원 · meta 건조 | 72 | Gacha(뽑기·픽업) · Construct(건조 — 순수 엔진 GGMConstruct를 부름) | 8 가챠 · 건조/영입 |
| Battle | prog 편성·출격·별 · meta 전장 규칙 | 29 | BattleSession(전투 v2 연결) · Formation(편성·출격) | 6 전투 v2 · 대열·출격·전장 규칙 |
| Challenge | prog 레이드·심연·탑·재료 던전 · meta 던전 | 91 | Raid · Abyss · Tower · StageModes | 9 콘텐츠 · 탑·스테이지 양식 |
| Story | `chapters.json` `events.json` `opening.json` · prog 진행 · meta 기억 · world 설계 | 142 | StoryFactory(장·스테이지·외전 Generator) · ScriptPlayer(대본 재생·연출) · ScenarioPlan · StoryMemory | 7 대본 엔진 · 11 스토리 공장 · 시나리오 설계·연출 |
| World | `rels.json` · world 세계·도감·세력 · meta 도감·세계 성경 | 83 | Codex · Factions · Relations | 세력·적 도감·등장 계획 |
| Image | `lib.json`(자료실) · meta 그림 태그 | 245 | Library(배경·소품·CG·적·지도·아이콘 창구) · ImageJobs(생성·후보·일괄) · Assets(에셋 관리) | 4 그림 · 에셋 관리 |
| Messenger | `threads.json` · prog 받은 톡·갠톡 | 40 | Threads · FreeChat | 10 메신저 |
| Player | prog 플레이어 프로필·외형 | 16 | Profile | 10(프로필) |
| Economy | prog 재화·상점·우편·패스·행동력 · meta 상점 | 58 | Wallet · Shop · Mail · Pass | 9 경제 |
| LiveOps | prog 시즌·일정·알림 · meta 일정 장소·점검 | 79 | LiveTick · Season · Schedule · ContentAudit | 9 라이브 · 일정·콘텐츠 점검 |
| Expedition | `dispatches.json` · prog 원정·파견 · meta 원정 | 40 | Expedition(순수 엔진 GGMExpedition) · Dispatch | 원정 · 파견 |
| Rules | meta 규칙·밸런스·속성·역할·포지션 | 47 | GameRules · Balance | 게임 규칙·속성·포지션·밸런스 |
| NewGame | meta 초안 | 70 | Draft(초안 편집) · GameBuilder(새 게임 — 위 Generator들을 차례로) | 11 새 게임 |
| PromptStudio | meta 프롬프트 | 15(+조각) | PromptStudio | 프롬프트 스튜디오 |
| System | `game.json` · meta 제목·테마·용어 · prog 설정·표시 | 296 | Settings · SyncPanel · UpdatePanel · Boot | 3 AI 연결 · 12 동기화 · 13 업데이트 |
| (Shared → 상위 class) | — | 244 | 화면 66 → View·Screen 공용 부품 · 창 11 → Dialog · 입출력 11 → Service·Store · 생성 6 → Generator · 처리 16 → App · 도구 134 → 공용 도구 | — |
| (미정) | — | 123 | 매핑 표를 채우거나 YAGNI로 지움 | — |

### 파일 배치(모듈 하나 = 파일 하나 — 사용자 지시 U19·U20: 계층마다 파일을 나누지 않고 class로 묶음)

- `src/main/00-core.js` — 상위 class: App · Store · Repository · Slot · Service · Generator · View · Screen · Dialog · Feature + 공용 도구
- `src/main/01-services.js` — TextAI · ImageAI · Sound · Updater · SyncAdapter들(PC 서버·GitHub·한 기기·게시)
- `src/main/02-prompt-studio.js` — PromptStudio(조각·조립)
- `src/main/10-<기능>.js` — 기능마다 하나: 그 기능의 Repository 하위 · Generator 하위 · Screen·Dialog 하위 · Feature(동작 등록)
- `src/main/90-default-content.js` — 기본 콘텐츠(샘플 data)
- 규칙 엔진(`src/modules` — 순수, Worker)은 그대로. `src/style` 20개 파일은 한 파일로(이슈).

## 4. 옮기는 길(도구로)

1. **틀 만들기**: 위 class의 뼈대 파일(상위 class 구현 + 빈 하위)을 새 src에 둠 — 지금 src는 버림(git 이력).
2. **함수 → class 메서드 대응표**: 두 index.html의 함수마다 역할 꼴(AI 생성·창·화면·data 쓰기)·쓰는 data로 어느 class의 무엇이 되는지 도구가 표로 냄(`tools/redesign.mjs`에 대응표) — 같은 역할의 되풀이는 상위 class 하나로 합쳐지고 하위는 다른 점(프롬프트·스키마·반영)만 가짐.
3. **채우기**: 대응표대로 하위 class를 채움. 깨지는 것은 이슈로 쌓음(사용자 지시 U16).
4. **복구**: 브라우저 시험·플레이 시험·규칙 전수검사로 제품 기능이 그대로인지 확인(지금 빌드된 index.html이 기준 동작).

진행(2026-11-04):
- **1단계 — 기계적 옮기기**: `node tools/reshape.mjs --apply` — 빌드된 `www/index.html`의 ggm-main 함수 1615개를 2-3절 매핑(기능·종류)대로 class 50개의 static 메서드로(기능 X → `X`(Model) · `XView`(Screen·Dialog) · `XCtl`(Controller), Shared → `Core`, 미정 → `Misc`, Image → `Art`). 함수를 가리키는 곳은 범위를 따져 `Class.이름`으로. 함수가 아닌 맨 위 문장은 `90-load.js`(원래 순서), 시작 블록은 `95-start.js`(맨 끝), 옛 이름 다리는 `99-aliases.js`. 파일 23개 모듈·136파일 → 20파일.
- 복구: 빌드·`node build/test.mjs` 전부 통과 · `node tools/check.mjs` 오류 0 · 함수 그래프·TDZ·정의 안 된 이름·도달 도구를 class 인식으로. 남은 것은 `docs/restructure.md` 4절 R6–R11.
- **2단계 — Generator**(진행): `00-core.js`에 상위 class `Generator`(context → ready → prompt → 글 AI → parse → apply, 실패 때 fail·none). AI 생성 흐름 26개를 하위 class로 — 기능 파일 끝: World(CodexDiscoverGen·CodexDeepenGen·StanceGen·FactionGen·RelSeedGen) · LiveOps(NaiBlocksGen·SpotsGen·SpotTalkGen) · Rules(PositionsGen) · Story(StageAuditGen·PlanGen) · Characters(WeaponPromptGen·NpcAutoGen·PersonaGen·PersonaReviewGen·SkinLinesGen·MemorialGen·TalkAffGen·PickupCharGen·AltCharGen) · NewGame(HeroTagsGen, 새 게임 초안 다듬기 무리 `DraftGen` → DraftPolishGen·DraftHeroGen·DraftHarmonyGen·DraftCharGen) · Messenger(DailyTalksGen·ChatSummaryGen) · System(DirectScriptGen). 기능 class의 옛 메서드 이름은 `XGen.run({…})`을 부르는 한 줄(진입점)로 남음. 브라우저 시험 34개 통과. 남은 흐름은 `docs/restructure.md` R13
- **다음 — 2단계 나머지(의미 재구성)**: 3절 상위 class(Repository·Generator·Dialog·Screen)를 `00-core.js`에 세우고, 역할 꼴이 같은 메서드 무리(AI 생성 흐름 50 · 창 124 · data 쓰기)를 그 하위 class로 합침 — data마다 Repository 하나가 창구(규칙 D3).
