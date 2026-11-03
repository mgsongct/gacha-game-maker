# 기능 모듈과 연계

모든 모듈은 **같은 전역 스코프**를 공유합니다(ES 모듈·번들러 없음). "모듈"은 섹션 단위 묶음이고, 서로 전역 함수·전역 변수로 직접 호출합니다.
예외로 전투 v2 코어는 `GGMCombat` 등 네임스페이스 객체를 `globalThis`에 내보냅니다.

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
- 팝업: `openModal(html, lock, cls)` / `closeModal()`. `MODAL_NAV_MODULE`이 `openXxx` 함수들을 감싸 **모달 뒤로가기 스택**(`NAV`, `window.navBack()`)을 만듦. Android 뒤로가기·Esc·배경 클릭 모두 `navBack()`.
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

- `pull(n)` → 비용 `n*COST(120)` 차감 → `rollOne(guarSR, forceSSR, banner)` n회 → `mark('prog')` → **`await flush()` 후** 연출 `playGacha(res)`. (저장 성공 전엔 결과를 보여 주지 않음)
- `rollOne`: 소프트 천장 확률 `softRate()`, 천장 `settings.pity`, 10연 마지막 SR 보장, 픽업 확률 `banner.rate`, 픽업 실패 시 다음 SSR 확정(`guar`), 모집 포인트(`spark`, `SPARK` 포인트로 교환). 중복은 `dup`(돌파, 최대 5) + `REFUND` 환급.
- `bannerPool(b)`: `pool.mode`(all/factions/ids)로 후보 결정.
- `discover()`: 재화를 써서 AI가 **새 캐릭터를 즉석 생성**하고 바로 획득.

## 8-1. 건조/영입 · 원정 · 바리에이션

- 엔진 `GGMConstruct`(`src/modules/app/020-construct.js`, 순수): `rates`(분류 개방·비중, 희귀도 캡) → `table`(캐릭터별 확률) → `roll`. `condMatch`(바리에이션 적용 조건), `variantPrompt`/`designBrief`(디자인 프롬프트)
- 화면·상태 `src/main/0505-construct.js`: `constructHTML`(탭 `construct`, 계약 화면 위 진입), `conBuild`, `conBuy`, `conDispReward`(파견 보상에 자원), `conMakeVariant`(AI `aiAltChar` 또는 규칙), 설정 `openConSet`
- 이격 상속 `src/main/0065-inherit.js`: `mark()`에서 `inheritOnMark`, `fix()`에서 `inheritAll`, `flush()`에서 `inheritStore`
- 설계·수치: [research/construction.md](research/construction.md), [research/variants.md](research/variants.md)

## 8-2. 원정 모드

- 엔진 `GGMExpedition`(`src/modules/app/030-expedition.js`, 순수): `tierOf`, `condNow`, `idolOffers`/`idolResult`, `streamResult`/`libIncome`, `bizPerformance`/`bizSettle`
- 화면·상태 `src/main/0275-expedition.js`: 탭 `disp`가 `dispPageHTML()` → 전투형이면 기존 `dispHTML`, 아니면 `exHTML`. `exBusyIds`를 `busyIds`(0090)에 합쳐 일하는 캐릭터는 전투 불가. 설정 `openExSet`
- 설계·수치: [research/expedition.md](research/expedition.md)

## 8-2-1. 게임 규칙 (상성·능력치)

- `src/main/0185-game-rules.js`: `G.meta.rules` 편집(`openRules`), `rulesApply`(applyMeta에서 BEATS·`GGMCombat.applyRules`), `rulesOptions`(v2Options로 전투·밸런스 검사에 전달), 캐릭터 화면 `rulesCharHTML`, 도감 `rulesCodex`
- 전투 엔진: `damage()`의 속성 배율 = `sim.elemAdv/elemDis × relMul`, `create()`에서 `synergy()`. 역할 기본 능력치·속도·희귀도 배율은 `CHARACTER_BASE_STATS`·`ROLE_SPEED`·`RARITY_STAT_MUL` 표(기본값 `RULE_DEFAULTS`)
- 설계: [research/game-rules.md](research/game-rules.md)

## 8-2-2. 밸런스 관리

- `src/main/0187-balance.js`: `BAL()`(G.meta.balance), `balanceGeneration`(v2CurrentGeneration이 먼저 물어봄), `balanceOptions`(전투 보정 → rulesOptions → v2Options), `balInfo/balNormalize/balRemaster`, 생성 시 `balanceOnCreate`(cleanChar)
- 엔진 `genBoost`: 세대 차이당 보정(아군만)
- 설계: [research/balance.md](research/balance.md)

## 8-2-3. 캐릭터 개성·인연 톡·메모리얼

- `src/main/0455-persona.js`: `c.persona`·`c.pfields`·`c.memorial`, `personaReview`(검수 점수), `personaAI`(채우기·다듬기), `personaAIReview`, `talkAffGen`(aff 트리거 톡), `memorialGen`, `memoOn`(로비 대사 → `affLinePool0`), 캐릭터 정보 탭 `personaHTML`
- `personaBrief`가 `ctx()`에 들어가 모든 AI 생성이 말투를 지킴. 새 캐릭터 스키마(`charSchema`)에 persona·pfields
- 설계: [research/character.md](research/character.md)

## 8-2-4. 시나리오 설계

- `src/main/0465-story-plan.js`: `G.world.plan`(로그라인·주제·결말·막·반전·분기·아크·메모), `planCtx(n)`(장 n에 필요한 설계만 → `aiChapterGen0` 프롬프트), `planCheck`(복선·공개·분기 점검), `planAI`(새로·다듬기·잇기), 편집 `openPlan`
- 분기: 대본 `[분기: id]` → `vnCmd`가 `S.branch` → `vnpick`이 `storyFlag` → `P().flags[id]={n,label}`
- 설계: [research/story-design.md](research/story-design.md)

## 8-2-5. 프롬프트 스튜디오

- `src/main/0025-prompt-studio.js`: 조각 등록 `pfDef(id,label,get)` → `window[id]` 게터 → `promptFrag(id)`(게임별 덮어쓰기·덧붙이기 `G.meta.prompts`). 등록 조각: SCRIPT_FMT·THREAD_FMT·BATTLE_FLOW·TITLE_RULE·NAI_CHAR·EXPLORATION_NAME_RULE(0010), JSON_STRICT(0020), POS_RULE(0185), IMG_GUIDE
- 그림 가드 `imgGuard(kind,tags)`: `composeNai`가 배경·소품·지도·아이콘에서 사람 태그를 빼고 `no humans` 머리말을 붙임
- 교훈 `plList/plHit/plAdd`(appStorage `ggm-plessons`) → `llmWrap`이 `plInject`로 끼움. 점검 규칙 `l_imgperson`
- 설계: [research/prompts.md](research/prompts.md)

## 8-2-6. 전장 규칙 · 시련의 탑 · 일정

- `src/main/0485-battle-rules.js`: `FIELDS`·`GOALS`, `stageAutoRules`(buildStages·점검 `s_rules`), `fieldApply`·`fieldTime`(startStage), `rulesHTML`(편성 화면), 집중 지시 `bFocus`(적 카드 `data-act="bfocus"`)
- `src/main/0125-tower.js`: `towerList`·`towerStage`·`towerGo`·`towerEnd`(bEnd), 진척 `P().tower`. 편성·출격 제한은 ctx `allow(c)`(openFormation·autoSquad·startStage)
- `src/main/0135-schedule.js`: `G.meta.spots`, `c.spotTalk`, `P().sched`, `spotsAuto`·`spotsAI`·`spotTalkAI`·`schedVisit`. 점검 `g_spots`·`c_spot`(fix 모드 `ai-run`)
- 설계: [research/combat-content.md](research/combat-content.md)

## 8-2-7. 연출 엔진 · 에셋 관리

- `src/main/0462-direction.js`: `EMOTES`·`MOTIONS`·`SCREEN_FX`, 파싱 `dirSplit`(parseScript가 `L.dir`), 무대 `vnStage`(두 사람), `vnDirectSay`·`vnDirectCmd`(vnShow·vnCmd), `autoEmote`, `emoteHTML`(메신저 스티커 `w:'k'`·로비 `lobbyEmote`), AI `directScript`·`directStage`, 조각 `DIRECTION_GUIDE`, 점검 `s_direct`
- `src/main/0565-asset-library.js`: 공유 보관함 `shList/shPut/shTake/shAdopt`(addLib·scanScriptAssets), `libUsage`, `libDupes/libMerge`(alias), 화면 `openAssets`
- 설계: [research/direction.md](research/direction.md)

## 8-2-8. 대열 · 출격 경로

- 엔진 `030-core.js`: `options.formation` → `formationSetup`(u.range·u.row), `weighted(sim,pool,u)`(근접은 전열만·엄호), `rowMul`(자리 상성), heal(후열 지원 +20%), `GGMCombat.rangeOf`
- `src/main/0487-formation-sortie.js`: `charRange`·`rowWarn`(편성), `routeOf/routeAuto`·`nodeStage`, `sortieBegin`(startBattle)·`sortieMap`·`sortieFight`·`sortieNodeEnd`(bEnd), `P().sortie`, 설정 `battleSysPanel`(G.meta.rules.formation·sortie)
- 설계: [research/formation-sortie.md](research/formation-sortie.md)

## 8-3. 콘텐츠 점검·업그레이드

- `src/main/0535-content-audit.js`: 규칙 `AUDIT_RULES`(감지 `test` + 고치기 `fix.mode`), `auditScan`, `auditFix`, 지정 변환 `auditConvert`, 되돌리기 `auditUndo`, 생성 버전 `auditGenVer()`(새 캐릭터 `cleanChar0`에서 `genVer`로 찍힘)
- 기존 기능 재사용: `openRegen`, `runPrep`, `fixWeaponPrompts`, `v2ReadyChars`, `stripAge`
- 설계·규칙 추가 방법: [research/content-audit.md](research/content-audit.md)

## 9. 성장 · 경제 · 콘텐츠

- 성장(성장·성장 곡선 섹션): 레벨(최대 120, 71~ 초월승급), 돌파, 스킬 강화, 전용 무기, 호감도(`addAff`, 레벨별 대사·에피소드 해금). 비용 공식은 `GGMCombat.growthCost/limitBreakCost` 등.
- 일일/주간 카운터: `dm()` / `bump(key)`(미션·패스 진행).
- 상점: 보급 상점(일일), 캐시 상점(전부 무료 재화), 이벤트 상점, 자동 스킨 상점.
- 파견(`dispatches`), 재료 던전(`meta.farms`), 레이드, 심연 탐사(로그라이크·카드 전투, `RG()`).
- **라이브 운영** `liveTick()`: 켤 때·화면 복귀 때 주기(`LIVE_CYC`)마다 AI로 새 톡/이벤트/챕터/픽업/스킨을 자동 생성, 시즌 로테이션(`SEASONS`). 구독 게임은 자동 생성 안 함.

## 10. 메신저(등대톡) · 갠톡

- `threads[]`의 대본을 `trigger` 조건(스테이지 클리어 등)에 따라 `prog.inbox`로 배달, `openPhone(tid)`.
- 갠톡: 캐릭터와 AI 자유 채팅. 결과는 스토리 기억에 반영될 수 있음.

## 11. 스토리 공장 · 새 게임 · 기억

- 새 게임 초안(`openDraft`)·장르 마법사(`showSetup`): 세계관 → 캐릭터 → 챕터 → 오프닝을 AI 다단계 생성. 생성 중에는 `NEW_GAME_SOURCE`가 설정되어 저장·탭 이동이 막힘.
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
