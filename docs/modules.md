# 기능 모듈과 연계

모든 모듈은 **같은 전역 스코프**를 공유합니다(ES 모듈·번들러 없음). "모듈"은 섹션 단위 묶음이고, 서로 전역 함수·전역 변수로 직접 호출합니다.
예외로 전투 v2 코어는 `GGMCombat` 등 네임스페이스 객체를 `globalThis`에 내보냅니다.

## 0-0. 구조 원칙과 검증 (어디에 무엇을 두나 — 어긋나면 도구가 막음)

원안 `index.html` 한 파일을 개발 편의·혼돈 방지를 위해 모듈로 나눴어요(CLAUDE.md §0-1). 잘못된 위치에 코드를 두거나 파편화가 생기지 않게, 원칙마다 잡는 도구와 막는 정도를 둡니다. CI(`.github/workflows/check.yml`)가 모두 돌려요.

| 원칙 | 잡는 도구 | 막는 정도 |
|---|---|---|
| 분석한 코드 = 빌드된 SPA(`www/index.html`) 코드, 로컬 파일을 따로 불러오지 않음 | `tools/check.mjs`(`spaCheck`) · `node build/build.mjs --check` | 오류 |
| 불러올 때 아직 없는 이름 없음(모듈 블록 → main 이름순 실행 — 코드를 옮길 때 생기기 쉬움) | `tools/check.mjs`(`tdzRefs`) | 오류 |
| 규칙 엔진(순수 모듈)은 DOM·앱 상태를 참조하지 않음 | `tools/check.mjs`(`pureModules`) | 오류 |
| 프롬프트(LLM·그림)는 프롬프트 스튜디오 한 모듈(`src/main/0015-prompt-studio/`)에: 조각 등록(`pfDef`)은 스튜디오만, 지시문은 조각, 프롬프트 글·그림 태그는 스튜디오 밖에 없음(화면과 같이 쓰는 글 도구는 `tools/prompt-shared.json`에 이유와 함께) | `tools/check.mjs`(`tools/lib/prompts.mjs` 프롬프트 흐름) | 오류 |
| 모듈 경계: 영역 침범 후보·남의 상태 쓰기·상태 파편화(3모듈 이상이 쓰는 키) | `tools/modules.mjs` · `tools/check.mjs` 래칫 | 늘면 실패 |
| 자연 경계(함수 그래프 모듈성 최대화): 과잉 분할(서로 강하게 묶인 모듈·위성 모듈)·기능 섞임·기능 분산(다른 한 모듈의 일을 하는 함수) | `tools/modules.mjs` · `tools/check.mjs` 래칫 | 늘면 실패 |
| 기능 영역(이 문서 절마다 적은 파일): 영역 함수가 영역 밖에·영역 상태를 밖에서 씀 | `tools/modules.mjs` | 보고 |
| 포크 기능이 생성기 ↔ 기능 ↔ 생성물로 이어짐 | `tools/wiring.mjs --strict` | 늘면 실패 |
| 상황별 실제 프롬프트 조합에 깨짐·과잉·과소 없음, 코드를 옮겨도 보낸 프롬프트(글·그림)가 같음 | `node tools/play/combos.mjs [--ref <git>]` | 보고 · --ref는 다르면 실패 |
| 지금 빌드로 생성한 게임을 플레이할 때 기능이 이어짐(가챠·장 진행·세력·관계·파견·원정·건조) | `node tools/play/link.mjs` | 실패 있으면 실패 |
| 예전 빌드로 만든·빠진 데 있는 게임을 지금 앱이 감지·보완(불러오기 이전·점검 규칙·자동 채움·기본값) | `node tools/wiring.mjs`(정적 표 — 경로 없음이 늘면 실패) · `node tools/play/upgrade.mjs`(동적 — 놓침이 있으면 실패) | 늘면 실패 · 보고 |

새 기능은 새 파일로(`docs/build.md` §4), 그 기능의 절을 이 문서에 두고 파일을 적어요. 코드를 다른 파일로 옮길 때는 `tools/prompts-move.mjs`(프롬프트 — 원문 그대로, 지역 값·화면 입력은 인자로)처럼 뜻이 같게 옮기고 위 도구로 확인해요.

## 0. 연계 지도

```
                      ┌────────────── 클릭: data-tab / data-act ──────────────┐
                      ▼                                                     │
            APP_ACTION_HANDLERS ─▶ handle*Action (12개)                      │
                      │                                                     │
   ┌──────────┬───────┼─────────┬───────────┬────────────┬────────────┐     │
   ▼          ▼       ▼         ▼           ▼            ▼            ▼     │
 가챠       전투v2   대본엔진   메신저      스토리 공장   그림 생성     동기화   │
 rollOne   GGMCombat playStory openPhone   aiJSON       naiGenerate  syPush  │
 pull()    startStage parseScript threads   ctx()        comfyGenerate pcPush │
   │          │       │  ▲      │           │  │         │            │     │
   │          │       │  └──────┴───────────┘  │         │            │     │
   │          │       │    (대본 텍스트 형식 공유)   ▼         │            │     │
   │          │       │                     aiCall ─▶ http() ◀───────────┘     │
   │          │       ├─▶ bgm/sfx/voice (소리)        (네이티브/중계/fetch)       │
   ▼          ▼       ▼                                                     │
 G / P() 수정 ─▶ mark() ─▶ flush() ─▶ appStorage(GGMStorage) ─▶ IndexedDB      │
   └────────────────────────▶ render() ─▶ #view.innerHTML ─────────────────────┘
```

## 1. UI 렌더링 · 라우팅

- 전역 `tab`(현재 화면). 하단 탭: `crew`(대원) / `ops`(작전) / `lobby`(로비) / `contract`(계약=가챠) / `studio`(설정·제작).
- 로비 하위 화면: `evshop, abyss, challenge, codex, notice, event, evd, farm, disp, pass, shop, cash`.
- `render()`: 상단 재화 갱신 → `F[tab]()`이 반환한 **HTML 문자열**을 `#view.innerHTML`로 통째 교체 → 스크롤 복원(`UI_SCROLL_MODULE`). 가상 DOM·컴포넌트 없음.
- 문자열 템플릿에 사용자/AI 텍스트를 넣을 땐 **반드시 `esc()`** 사용(기존 코드 관례).
- 팝업: `openModal(html, lock, cls)` / `closeModal()`. `MODAL_NAV_MODULE`이 `open…` 함수들을 감싸 **모달 뒤로가기 스택**(`NAV`, `window.navBack()`)을 만듦. Android 뒤로가기·Esc·배경 클릭 모두 `navBack()`.
- 전체화면 연출(타이틀, VN 대본, 가챠, 전투)은 `#ov`, 메신저는 `#phone`.
- 데스크톱: `applyDesk()`가 가운데 세로 레이아웃 + 키보드(1~5 탭, Space/Enter, Esc).

## 2. 액션 디스패치

```js
// 클릭 위임 (이벤트 섹션 끝)
document.addEventListener('click', async e => {
  const t = e.target.closest('[data-tab],[data-act]');
  if (t.dataset.tab) { tab = t.dataset.tab; render(); return; }
  const a = t.dataset.act, id = t.dataset.id, p = P();
  const handler = APP_ACTION_HANDLERS[a];
  if (handler) return await handler(a, t, id, p, e);
});
```

`APP_ACTION_HANDLERS`(Object.freeze, 약 560개 액션) → 영역별 핸들러, 각 핸들러는 `switch(a)`:

| 핸들러 | 액션 수 | 영역 |
|---|---|---|
| `handleNavigationAndToolsAction` | 130 | 화면 이동(`go` + `data-to`), 도구 |
| `handleStoryAndAuthoringAction` | 95 | 대본·챕터·이벤트·도감 편집, AI 집필 |
| `handleImagesAndAssetsAction` | 94 | 그림 생성/교체, 라이브러리 |
| `handleCombatAndFormationAction` | 46 | 편성, 전투 시작 |
| `handleStorageAndSharingAction` | 42 | 백업, 동기화, 게시·구독 |
| `handleSettingsAndAudioAction` | 39 | 설정, 소리, 중계 서버 |
| `handleMessengerAction` | 29 | 톡 |
| `handleEconomyAction` | 27 | 가챠(`pull`), 상점, 강화 |
| `handleSetupAction` | 23 | 첫 실행 마법사, 타이틀 |
| `handleCharactersAction` | 21 | 캐릭터 편집 |
| `handleUpdatesAction` | 12 | 앱 업데이트 |
| `handleMailAction` | 6 | 우편함 |

전투 v2·백업·스토리 기억·이미지 후보 모듈은 **자체 `document.addEventListener('click')`** 로 `data-act`(예: `v2edit`, `v2train`, `backup-save`)나 `data-sm` 등을 따로 처리합니다. 새 액션 이름이 기존 것과 겹치지 않게 주의하세요.

캡처 단계 리스너들: 버튼 효과음(`sfx('버튼')`), 저장 실패 시 재화 액션 차단, 쓰다듬기 후 클릭 삼키기, 클릭 직후 flush.

## 3. AI 연결 (글 AI)

```
aiJSON(prompt, btn, tier, images)       // UI용: 버튼 로딩 표시, 오류 토스트, 스킬 규칙 자동 첨부
 └ SAMPLE.json  (setupAI()가 프로필 있으면 만듦; 없으면 null → "AI 등록" 안내)
    └ aiCall(llmWrap(prompt), tier)     // 활성 프로필 + fallback 순서로 시도, AILOG 기록, 게임 전환 시 결과 폐기
       └ aiOne(profile, prompt, tier)   // 공급자별 요청 생성, JSON 파싱(parseLoose)
          ├ anthropic → claudeMsg(api.anthropic.com/v1/messages)
          ├ openai / copilot → /chat/completions (finish_reason=length면 최대 3회 이어쓰기)
          ├ gemini → generativelanguage.googleapis.com
          └ vertex → 서비스 계정 JWT 토큰(vertexToken) → Gemini 또는 Claude(rawPredict)
             └ http(url, {method, headers, body, timeout, signal})
```

- `tier`: `quick`(60초, 2k 토큰) / `default`(5분) / `complex`(10분). 프로필의 `model`/`quick` 또는 `DEFM` 기본 모델.
- 프로필(`AIP()`, 키 `starfall-ai-profiles`): `{list:[{id,type,name,key,model,quick,base,region,sa,pub,...}], active, fallback}`. 타입 목록 `AITYPE`.
- **모든 응답은 JSON** 전제. 프롬프트에 `JSON만 출력` 규칙을 붙이고, 배열만 오면 첫 키로 감쌈.
- 프롬프트 컨텍스트: `RULES`/`rulesText()`(성인·한국어·용어·성별·톤 규칙) + `ctx(side, focus)`(세계관·캐릭터·진행·관계·스토리 기억 요약). 새 생성 기능은 `` `${RULES}\n${ctx()}\n\n요청…` `` 패턴을 따르세요.
- `http()`: Capacitor면 `CapacitorHttp`; 웹이면 `fetch`, 실패한 호스트는 `PXHOSTS`에 기억했다가 `ggm-proxy` 중계(`?u=<url>`) 경유; PC 서버 연결 시 `/api/proxy`.

## 4. 그림 생성

- 공급자: `imgProvider()` = NovelAI(`naiGenerate`, `image.novelai.net`) 또는 ComfyUI(`comfyGenerate`, 사용자 워크플로 JSON에 프롬프트 바인딩).
- 프롬프트 = 캐릭터 `naiPrompt`(AI가 Danbooru 태그로 작성) + 프레이밍(`NAI_FRAMES`) + 포즈(`NAI_POSES`) + 그림체 프리셋(`ggm-packs`) + 품질 태그(`NAI_QUALITY`). `naiBlocks*`가 태그를 슬롯 단위로 분리·보존.
- 안전 필터: `MINOR_TAGS`, `AGE_TAGS`, `stripAge()`로 미성년·나이 태그 제거, 캐릭터 나이는 최소 20.
- 후처리: 배경 제거(`naiBgRemove`, 컷 툴 캔버스), 표정 변형(`naiEmotion`).
- 일괄 처리: `runPrep(cats, filter)` / `artAfterAI()` — AI가 새로 만든 캐릭터·배경·적의 그림을 이어서 생성.
- 결과는 IndexedDB `img` 스토어에 저장, 객체의 `img` 필드는 키 참조. 표시용 URL은 `imgSrc(obj)`(`loadIdbImages()`가 Blob URL 캐시).
- `IMAGE_CANDIDATES_MODULE`: 후보 여러 장 중 고르기·미리보기.

## 5. 소리

- `SND()`(키 `starfall-sound`): 볼륨, Fish Audio 키/모델, ElevenLabs 키/모델.
- BGM: `bgm(name)`이 `lib`의 `kind:'bgm'` 항목 재생(페이드), `sceneBgm()`이 화면별 자동 선택. ElevenLabs Music으로 생성 가능.
- 효과음: `sfx(name)` — `lib`의 `kind:'sfx'`.
- 음성: 캐릭터 `voiceId` → Fish Audio TTS(`api.fish.audio/v1/tts`). 일본어 음성용 번역 캐시 `ggm-voice-ja`.

## 6. 전투 v2 (`COMBAT_V2_BUNDLE`)

DOM 없는 순수 코어와 UI 어댑터로 분리돼 있습니다.

| 모듈 id | 내보냄 | 역할 |
|---|---|---|
| `ggm-combat-catalog` | `GGMStudio` | 스킬 효과 카탈로그(대상·효과·조건·기준값), 효과 설명문 `describe()` |
| `ggm-combat-visual-catalog` | `GGMVisuals` | 스킬 연출 프리셋·상태 아이콘 |
| `ggm-combat-core` | `GGMCombat` | **결정적 전투 시뮬레이터**(`DT=0.17초` 틱, `create/step/run`), 스탯·성장 비용, 스킬 `normalize/validate/budget`, 밸런스 검사(`balanceSkill`), AI 스킬 프롬프트 `prompt()`, 적 패턴 |
| `ggm-combat-effects` | `GGMVFX` | 전투 연출(컷인, 투사체, 피격, 데미지 숫자) |
| `ggm-combat-bridge` | 전역 `v2*` 함수 | 엔진 ↔ UI/저장 연결. `v2Ensure(c)`, `v2ReadyChars`, 스킬 편집기, `v2RunJob`(Web Worker 실행) |
| `ggm-combat-generation` | 전역 | AI가 만든 1슬롯 스킬 설계 → 엔진 스키마로 컴파일 |
| `ggm-combat-equipment` | 전역 | 장비(패시브 1개를 스킬에 결합) |
| `ggm-combat-training` | 전역 | 스킬 훈련 랭크 1–7, 전문화 1–3 |
| `ggm-combat-practice` | 전역 | 연습 전투(저장된 편성 불변) |

- 스킬 스키마: `c.skills = {version:2, passive, active, ultimate}`. ultimate는 SP 100 충전 발동. 효과는 `GGMStudio.EFFECTS` 형식.
- 무거운 밸런스 검사는 `catalog + visual-catalog + core` 스크립트 텍스트를 Blob으로 묶어 **Web Worker**에서 실행(실패 시 메인 스레드 제너레이터로 폴백). 그래서 이 세 모듈은 **DOM·전역 앱 상태를 참조하면 안 됩니다.**
- 진입: `startBattle(chId, stId)` → `startStage(stage, ctx)` (`ctx.kind`: `main|event|farm|raid|rogue|practice` …) → 편성 확인 → `v2PrepareStage` → 전투 화면.
- 속성 상성: `BEATS`(meta.elems 순환: 0→1→2→0), 역할 `atk/def/sup`.

## 7. 대본 엔진 (VN)

파일: `src/main/0460-script-engine.js`

스토리·에피소드·오프닝·이벤트·톡이 공유하는 **텍스트 대본 형식**. AI도 이 형식으로 씁니다.

```
[사무소 옥상]                 ← 장소(place)
비가 그친 새벽.               ← 나레이션(nar)
세라: 아직 안 잤어?           ← 대사 (이름: 텍스트)
세라 [미소]: 응.              ← 표정 지정 (faces[].name)
[배경: 옥상 밤] [소품: 커피] [효과음: 문] [음악: 잔잔] [CG: 이름] [사진: …] [톡: …]
[소품 끝] [음악 끝] [CG 끝] [톡 끝]
선택: 같이 있는다 | 들어간다    ← 선택지
1) 세라: 그래.                ← 1번 선택 시에만 나오는 줄
{관리관}                       ← 플레이어 이름 치환(sub())
```

- `parseScript(text)` → `[{type:'nar'|'say'|'place'|'cmd'|'choice', cond, ...}]`.
- `playStory(title, script, done)` → `#ov`에서 재생. 화자는 `findSpeaker`(캐릭터) / `npcBy`(NPC). 표정 미지정 시 `textFace()`가 대사 감정으로 추정. `[배경:]`·`[소품:]`·`[CG:]`·`[음악:]`은 `lib`에서 이름으로 찾음.

## 8. 가챠(계약)

파일: `src/main/0500-gacha.js` · 픽업 `src/main/0140-pickup-new.js` `src/main/0150-pickup-existing.js`

- `pull(n)` → 비용 `n*COST(120)` 차감 → `rollOne(guarSR, forceSSR, banner)` n회 → `mark('prog')` → **`await flush()` 후** 연출 `playGacha(res)`. (저장 성공 전엔 결과를 보여 주지 않음)
- `rollOne`: 소프트 천장 확률 `softRate()`, 천장 `settings.pity`, 10연 마지막 SR 보장, 픽업 확률 `banner.rate`, 픽업 실패 시 다음 SSR 확정(`guar`), 모집 포인트(`spark`, `SPARK` 포인트로 교환). 중복은 `dup`(돌파, 최대 5) + `REFUND` 환급.
- `bannerPool(b)`: `pool.mode`(all/factions/ids)로 후보 결정.

## 8-1. 건조/영입 · 원정 · 바리에이션

- 엔진 `GGMConstruct`(`src/modules/app/020-construct.js`, 순수): `rates`(분류 개방·비중, 희귀도 캡) → `table`(캐릭터별 확률) → `roll`. `condMatch`(바리에이션 적용 조건), `variantPrompt`/`designBrief`(디자인 프롬프트), `variantsFrom`(새 게임이 만든 바리에이션 기본형 정리)
- 생성기 연결 `src/main/0505-construct.js`: 세계관 단계 스키마 `CON_TERMS_SCHEMA`·`VARIANT_SCHEMA`, `variantsFromAI`(엔진 정리 + id)
- 화면·상태 `src/main/0505-construct.js`: `constructHTML`(탭 `construct`, 계약 화면 위 진입), `conBuild`, `conBuy`, `conDispReward`(파견 보상에 자원), `conMakeVariant`(AI `aiAltChar` 또는 규칙), 설정 `openConSet`
- 이격 상속 `src/main/0065-inherit.js`: `mark()`에서 `inheritOnMark`, `fix()`에서 `inheritAll`, `flush()`에서 `inheritStore`
- 설계·수치: [research/construction.md](research/construction.md), [research/variants.md](research/variants.md)

## 8-2. 원정 모드

- 엔진 `GGMExpedition`(`src/modules/app/030-expedition.js`, 순수): `tierOf`, `condNow`, `idolOffers`/`idolResult`, `streamResult`/`libIncome`, `bizPerformance`/`bizSettle`, `fromWorld`/`namesApply`(새 게임 세계관 단계의 방식·이름 → `G.meta.expedition`, 수치는 기본값)
- 생성기 연결 `src/main/0275-expedition.js`: 스키마 `EXPEDITION_SCHEMA`
- 화면·상태 `src/main/0275-expedition.js`: 탭 `disp`가 `dispPageHTML()` → 전투형이면 기존 `dispHTML`, 아니면 `exHTML`. `exBusyIds`를 `busyIds`(0090)에 합쳐 일하는 캐릭터는 전투 불가. 설정 `openExSet`
- 설계·수치: [research/expedition.md](research/expedition.md)

## 8-2-1. 게임 규칙 (상성·능력치)

- `src/main/0185-game-rules.js`: 생성기 연결(반응 스키마 `REACT_SCHEMA`, `elemName`·`reactClean`), `G.meta.rules` 편집(`openRules`), `rulesApply`(applyMeta에서 BEATS·`GGMCombat.applyRules`), `rulesOptions`(v2Options로 전투·밸런스 검사에 전달), 포지션 `posValid`(기본형 셋이 다 있어야 받음 — 새 게임 생성도 씀)·`posSpread`(기본형이 같은 포지션에 고루 배정)·`posAI`(점검 `g_pos` — 포지션 없는 예전 게임에 세계관 맞춤 포지션 설계, 실행 중 자동 채움), 캐릭터 화면 `rulesCharHTML`, 도감 `rulesCodex`
- 전투 엔진: `damage()`의 속성 배율 = `sim.elemAdv/elemDis × relMul`, `create()`에서 `synergy()`. 역할 기본 능력치·속도·희귀도 배율은 `CHARACTER_BASE_STATS`·`ROLE_SPEED`·`RARITY_STAT_MUL` 표(기본값 `RULE_DEFAULTS`)
- 설계: [research/game-rules.md](research/game-rules.md)

## 8-2-2. 밸런스 관리

- `src/main/0187-balance.js`: `BAL()`(G.meta.balance), `balanceGeneration`(v2CurrentGeneration이 먼저 물어봄), `balanceOptions`(전투 보정 → rulesOptions → v2Options), `balInfo/balNormalize/balRemaster`, 생성 시 `balanceOnCreate`(cleanChar)
- 엔진 `genBoost`: 세대 차이당 보정(아군만)
- 설계: [research/balance.md](research/balance.md)

## 8-2-3. 캐릭터 개성·인연 톡·메모리얼

- `src/main/0455-persona.js`: `c.persona`·`c.pfields`·`c.memorial`, `personaReview`(검수 점수), `personaAI`(채우기·다듬기), `personaAIReview`, `talkAffGen`(aff 트리거 톡), `memorialGen`, `memoOn`(로비 대사 → `affLinePool0`), 캐릭터 정보 탭 `personaHTML`
- 생성기 연결: 프로필 틀 `PROFILE_TPLS`·스키마 `PROFILE_TPL_SCHEMA`. 점검 `c_persona`·`c_persona_weak`·`c_pfields`(프로필 항목만 빔 → 개성 채우기)
- `personaBrief`가 `ctx()`에 들어가 모든 AI 생성이 말투를 지킴. 새 캐릭터 스키마(`charSchema`)에 persona·pfields
- 설계: [research/character.md](research/character.md)

## 8-2-4. 시나리오 설계

- `src/main/0465-story-plan.js`: 장을 쓰기 전 자동 설계 `planEnsure`(aiChapterGen0), `G.world.plan`(로그라인·주제·결말·막·반전·분기·아크·메모), `planCtx(n)`(장 n에 필요한 설계만 → `aiChapterGen0` 프롬프트), `planCheck`(복선·공개·분기 점검), `planAI`(새로·다듬기·잇기), 편집 `openPlan`
- 분기: 대본 `[분기: id]` → `vnCmd`가 `S.branch` → `vnpick`이 `storyFlag` → `P().flags[id]={n,label}`
- 설계: [research/story-design.md](research/story-design.md)

## 8-2-5. 프롬프트 스튜디오

파일: `src/main/0015-prompt-studio/` (폴더 모듈 — AI 연결(0020)보다 먼저 돌아 그림 설정 기본값이 스튜디오의 태그를 씀)
- `010-studio.js`: 조각 등록 `pfDef(id,label,get)` → `window[id]` 게터 → `promptFrag(id)`(게임별 덮어쓰기·덧붙이기 `G.meta.prompts`), `pf('ID',{이름:값})`(조각의 `{이름}` 자리 채움). 글 AI 지시문은 모두 「조각 모음」 한곳(끝은 「조각 모음 끝」 표식) — 연결 층 끝 지시(`JSON_ONLY_SUFFIX`)·새 게임·이벤트·픽업·그림·스킬·장비 설계 지시 포함. 교훈·그림 점검·AI 기록·스튜디오 화면
- `020-requests.js` 요청 조립: 기능 파일이 글 AI·그림 AI에 보내는 요청 글(머리말·답 형식 견본·조건부 지시)을 만드는 함수(`buildNewGameDraftPrompt`·`aiChapterGen0Prompt`·`personaAIPrompt`·`ainaiPrompt` …). 기능 파일은 데이터(지역 값·화면 입력 값)만 넘김 — `tools/prompts-move.mjs --req`로 원문 그대로 옮김
- `030-builders.js` 조립 함수: 여러 요청이 같이 쓰는 프롬프트 글 — AI 컨텍스트 `ctx`·`factionCtx`·`castLockCtx`·`castPlanData`·`relCtx`·`planCtx`·`drCtx`, 답 형식 견본 `charSchema`·`stageSchema`·`modeSchema()`·`*_SCHEMA`, 연결 층 `llmWrap`(지침·교훈 끼우기), 그림 `composeNai`·`composeCG`·`NAI_POSES`·`NAI_FRONT`·`FACE_TAGS`·그림 설정 기본 태그(`NAI_PARTS_DEF`·`NAI_NEG_DEF`·`COMFY_TAGS_DEF`)·그림체 프리셋 `STYLE_PRESETS`, 스킬 설계 `v2SlotPrompt`·`v2PalettePrompt`·`v2DesignContext`
- 화면과 같이 쓰는 글 도구(도감 항목·스킬 설명·대본 해석·관계 한 줄 등)는 제 기능 파일에 두고 `tools/prompt-shared.json`에 이유와 함께 적음
- 도구(오류로 막음): 다른 모듈의 `pfDef`, 스튜디오 조각이 아닌 지시문, 스튜디오 모듈 밖 프롬프트 글(LLM·그림), 목록에 있는데 코드에 없는 공용 글 도구(`tools/lib/prompts.mjs`·`tools/lib/analyze.mjs`). 상황별 실제 프롬프트 조합·깨짐·과잉·과소는 `node tools/play/combos.mjs`
- 그림 가드 `imgGuard(kind,tags)`: `composeNai`가 배경·소품·지도·아이콘에서 사람 태그를 빼고 `no humans` 머리말을 붙임

## 8-2-6. 전장 규칙 · 시련의 탑 · 일정

- `src/main/0485-battle-rules.js`: `FIELDS`·`GOALS`, `stageAutoRules`(buildStages·점검 `s_rules`), `fieldApply`·`fieldTime`(startStage), `rulesHTML`(편성 화면), 집중 지시 `bFocus`(적 카드 `data-act="bfocus"`)
- `src/main/0125-tower.js`: `towerList`·`towerStage`·`towerGo`·`towerEnd`(bEnd), 진척 `P().tower`. 편성·출격 제한은 ctx `allow(c)`(openFormation·autoSquad·startStage)
- `src/main/0135-schedule.js`: `G.meta.spots`, `c.spotTalk`, `P().sched`, `spotsAuto`·`spotsAI`·`spotTalkAI`·`schedVisit`. 점검 `g_spots`·`c_spot`(fix 모드 `ai-run`)
- 설계: [research/combat-content.md](research/combat-content.md)

## 8-2-7. 연출 엔진 · 에셋 관리

- `src/main/0462-direction.js`: `EMOTES`·`MOTIONS`·`SCREEN_FX`, 파싱 `dirSplit`(parseScript가 `L.dir`), 무대 `vnStage`(두 사람), `vnDirectSay`·`vnDirectCmd`(vnShow·vnCmd), `autoEmote`, `emoteHTML`(메신저 스티커 `w:'k'`·로비 `lobbyEmote`), AI `directScript`·`directStage`, 점검 `s_direct`
- `src/main/0565-asset-library.js`: 공유 보관함 `shList/shPut/shTake/shAdopt`(addLib·scanScriptAssets), `libUsage`, `libDupes/libMerge`(alias), 화면 `openAssets`
- 설계: [research/direction.md](research/direction.md)

## 8-2-8. 대열 · 출격 경로

- 엔진 `030-core.js`: `options.formation` → `formationSetup`(u.range·u.row), `weighted(sim,pool,u)`(근접은 전열만·엄호), `rowMul`(자리 상성), heal(후열 지원 +20%), `GGMCombat.rangeOf`
- `src/main/0487-formation-sortie.js`: `charRange`·`rowWarn`(편성), `routeOf/routeAuto`·`nodeStage`, 생성기 연결 `ROUTE_SCHEMA`·`routeClean`, `sortieBegin`(startBattle)·`sortieMap`·`sortieFight`·`sortieNodeEnd`·`sortieResult`(bEnd)·`quitConfirm`(전투 중 후퇴 = 출격 퇴각), `P().sortie`, 설정 `battleSysPanel`(G.meta.rules.formation·sortie)
- 설계: [research/formation-sortie.md](research/formation-sortie.md)

## 8-2-9. 세력 · 적 도감 · 등장/영입

- `src/main/0445-factions.js`: `factions()`(kind·rel·stance 정리), `stanceAt`·`stanceApply`(장 생성 `stance`), `factionCtx`·`castLockCtx`(ctx), 생성기 연결 `factionMatch`·`castPlanData`, `factionReview`·`factionAI`, `monsterNames`·`isMonsterLike`·`monsterFromGen`(addNewChars·addNpcs)·`charToMonster`, `castLock/castOk`(bannerPool·conPool), `metInStory`·`firstSpeak`, 화면 `openWorldDesign`
- 점검 `w_faction`·`c_monster`·`c_debut` · 설계: [research/factions-cast.md](research/factions-cast.md)

## 8-2-10. 스테이지 양식(회담·콘테스트)

- `src/main/0488-stage-modes.js`: `modeClean`(buildStages·새 게임 1장), `STAGE_MODES`·`MODE_SCHEMA`(stageSchema), 장의 마지막 스테이지 `finaleOf`·`FINALE_SCHEMA`·`finaleRule`/`finaleEnd`, 집필 `stageWhat`, `openModeStage`(stage 액션·startBattle), 회담 `debateStart/debateDraw/debateHit/debateMiss`, 콘테스트 `charmOf`·`contestStart/contestAppeal`, 클리어 `modeClear`
- 설계: [research/stage-modes.md](research/stage-modes.md)

## 8-3. 콘텐츠 점검·업그레이드

- `src/main/0535-content-audit.js`: 규칙 `AUDIT_RULES`(감지 `test` + 고치기 `fix.mode`), `auditScan`, `auditFix`, 지정 변환 `auditConvert`, 되돌리기 `auditUndo`, 생성 버전 `auditGenVer()`(새 캐릭터 `cleanChar0`에서 `genVer`로 찍힘)
- 기존 기능 재사용: `openRegen`, `runPrep`, `fixWeaponPrompts`, `v2ReadyChars`, `stripAge`
- 실행 중 자동 채움 `src/main/0537-live-fill.js`: `liveTick`이 빈 포크 기능 내용을 점검 규칙의 고치기(`auditFixOne`)로 채움(`liveFill`·`liveFillStep`·`liveFillRun`, 설정 `live.on.fill`)
- 설계·규칙 추가 방법: [research/content-audit.md](research/content-audit.md)

## 9. 성장 · 경제 · 콘텐츠

파일: `src/main/0090-growth.js` `src/main/0240-growth-curve.js` `src/main/0190-shop.js` `src/main/0110-challenge-raid.js` `src/main/0120-abyss.js` · 라이브 운영 `src/main/0280-live-ops.js` `src/main/0290-season-rotation.js`

- 성장(성장·성장 곡선 섹션): 레벨(최대 120, 71~ 초월승급), 돌파, 스킬 강화, 전용 무기, 호감도(`addAff`, 레벨별 대사·에피소드 해금). 비용 공식은 `GGMCombat.growthCost/limitBreakCost` 등.
- 일일/주간 카운터: `dm()` / `bump(key)`(미션·패스 진행).
- 상점: 보급 상점(일일), 캐시 상점(전부 무료 재화), 이벤트 상점, 자동 스킨 상점.
- 파견(`dispatches`), 재료 던전(`meta.farms`), 레이드, 심연 탐사(로그라이크·카드 전투, `RG()`).
- **라이브 운영** `liveTick()`: 켤 때·화면 복귀 때 주기(`LIVE_CYC`)마다 AI로 새 톡/이벤트/챕터/픽업/스킨을 자동 생성, 시즌 로테이션(`SEASONS`). 구독 게임은 자동 생성 안 함.

## 10. 메신저(등대톡) · 갠톡

파일: `src/main/0100-messenger.js` `src/main/0160-free-chat.js`

- `threads[]`의 대본을 `trigger` 조건(스테이지 클리어 등)에 따라 `prog.inbox`로 배달, `openPhone(tid)`.
- 갠톡: 캐릭터와 AI 자유 채팅. 결과는 스토리 기억에 반영될 수 있음.

## 11. 스토리 공장 · 새 게임 · 기억

파일: `src/main/0250-story-factory.js` `src/main/0260-new-game-draft.js` `src/main/0330-casting.js` · 관계·기억 `src/main/0450-relations-memory.js` `src/main/0530-story-memory.js` · 도감 `src/main/0300-codex.js`

- 새 게임 초안(`openDraft`)·장르 마법사(`showSetup`): 세계관 → 캐릭터 → 오프닝(배경·소품·음악·배너 포함) → 1장 순서로 AI 다단계 생성(`buildNewGameDraft`, 단계별 `ngStep`이 최대 3회 시도·초안에 저장해 이어 쓰기). 1장은 이후 장과 달리 한 번의 호출로 대본까지 씀. 생성 중에는 `NEW_GAME_SOURCE`가 설정되어 저장·탭 이동이 막힘. 계측과 개선 안건은 [research/generation-pipeline.md](research/generation-pipeline.md).
- 스토리 공장: 챕터 구성 → 스테이지마다 집필 → 요약·관계(`rels`)·톡 생성.
- `STORY_MEMORY_MODULE`: 작가용 스토리 기억(원문 대본은 바꾸지 않음), `ctx()`가 프롬프트에 주입.
- 캐스팅: 오프닝 전 캐릭터 그림을 확정.

## 12. 동기화 · 백업 · 공유

| 기능 | 함수 | 저장소 |
|---|---|---|
| 백업 파일 | `BACKUP_STORAGE_MODULE` (`openBackupChoice`, staging 스토어) | 파일 |
| PC·폰 연동 | `SY()`, `syPush/syPull`, `syCheckOnStart` | 내 GitHub **비공개** 저장소(Git Data API: tree·commit, 바뀐 파일만 업로드) |
| PC 서버 | `PCS()`, `pcPush/pcPull`, `pcStart`, 저장 후 5초 자동 push | `pc/ggm-server.py` → `data/<게임id>/<종류>.json` |
| 데이터 폴더 zip | `DATA_FOLDER_MODULE` (`dataExport`, `dataImport`, `zipMake/zipRead`) | 파일 (`data/<id>/*.json` + media) |
| 한 기기만 플레이 | `LKMODE()`, `lkActivate`, `lkPullIfNewer` | PC 서버 lease 또는 GitHub |
| 게임 게시·구독 | `PUB()`, 게시 / `subCheck()`, `subPullImages` | 내 GitHub **공개** 저장소. 주소 `GGMSUB:owner/repo/branch/dir`. 구독자는 콘텐츠만 교체, 진행은 유지 |
| 시작 시 자동 받기 | `bootSync()` | PC 또는 GitHub |

## 13. 앱 업데이트

```
version.json(GitHub raw, RELEASE_REPO/main) ─▶ build > APP_BUILD ?
   ├ apk.minShell > 설치 셸  → "새 APK 필요" 안내 (updateAPKRequired)
   └ updateDownloadHTML(): html 경로 받기 → BUILT 일치 확인 → sha256 검증
        └ applyUpdate() → appStorage.saveLive(html) (직전본은 starfall-live-prev)
             → 재시작 시 ggm-storage-boot가 document.write로 교체 실행
             → 3번 연속 부팅 실패 시 자동 롤백(badBuild 기록)
```

웹 버전은 `checkWebUpdate()`가 알림만 하고, 서비스 워커(network-first)로 새로고침 시 반영됩니다. 비공개 저장소 채널(`o.token`)은 `checkUpdatePrivate()`.
