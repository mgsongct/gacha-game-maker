# 연관 맵 — 모듈 → 빌드 → index.html(생성기·실행기·편집기) → data 게임 파일

생성: `node tools/map.mjs` · 2026-11-04T02:01 · git b36fbca · 입력: src 128파일 · www/index.html 3409f28bdc72 · 시험 게임 2 — 입력이 바뀌면 다시 만들고 바뀐 연결은 맨 아래 "최근 변화"에(증분 갱신, CI `--check`가 맵이 낡았는지 봄)

## 읽는 법 — 거꾸로 따라가기

index.html은 **생성기**(새 게임을 만듦)·**실행기**(만든 게임을 구동 — 플레이·실행 중 AI·예전 게임 불러오기)·**편집기**(만든 게임의 내용을 고치고 업데이트 — 편집 화면·콘텐츠 점검·AI 추가 지시)를 겸합니다(CLAUDE.md §0). 게임 data(`data/<게임id>/<종류>.json`)의 어떤 경로가 이상하면:

1. 아래 1절에서 그 파일·경로를 찾아 **누가 만들고 고치나**(역할별 함수<sub>모듈</sub>)를 봄 — 시나리오면 `chapters.json`, 캐릭터 밸런스·스킬·이격이면 `chars.json`(`[].skills`·`[].hp`·`[].alt`·`[].over` …)
2. `node tools/map.mjs --why <경로·함수·말>` — 함수마다 src 파일:줄 · index.html 줄 · 쓰는 프롬프트 조각, 그 경로의 점검 규칙·읽는 모듈·연계 모듈까지 한 번에
3. 6절에서 그 모듈의 index.html 줄 범위·쓰는 데이터·연계 모듈(호출 수)을 보고, 고친 뒤 `node tools/map.mjs`로 맵을 갱신
4. 화면·창이 이상하면 2절(기능 표면)에서 그 화면 단위에 얽힌 모듈을, 3절에서 계층(View·Controller·Model — 섞임·방향 위반), 4절에서 같은 데이터·처리로 묶은 기능과 모듈 판정, 5절에서 저장 정책을 봄 — `--why <화면·창 이름·모듈>`

역할 판정(정적): 생성기 = 새 게임 생성 단계(newGame…)가 부르는 함수 · 실행기 = 실행 중 AI(liveTick)·불러오기(fix)·앱을 열 때(부팅·게임 열기)가 부르거나, 사용자 조작이 진행(prog.json)을 쓰거나, 플레이 조작(진행을 쓰는 사용자 함수 — CRES()·CBUILD() 같은 접근 함수로 받은 객체 포함, 액션 분배기 제외)에서 닿는 콘텐츠 쓰기(예: 건조 바리에이션) · 편집기 = 사용자 조작이 플레이 조작을 거치지 않고 콘텐츠를 씀 · 기타 = 위 시작점에서 닿지 않음(엔진 안쪽 등). 한 함수가 여러 역할일 수 있음(예: cleanChar는 생성·실행 중 AI 둘 다). 「게임」 = 시험 게임 2개 중 값이 있는 수

## 1. data 게임 파일 → 만드는 곳(역할) → 모듈

### banners.json — 배너(가챠)

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| (파일 전체) | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> | aiPickupStory<sub>0290-season-rotation</sub> puStoryBg<sub>0150-pickup-existing</sub> | handleNavigationAndToolsAction<sub>0510-actions/</sub> handleStoryAndAuthoringAction<sub>0510-actions/</sub> |  |  | BGM_PROMPT CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CG_ART …외 53 | 2/2 |
| [].active |  | addPickupFor<sub>0150-pickup-existing</sub> seasonStart<sub>0290-season-rotation</sub> | readBanner<sub>0250-story-factory</sub> |  |  |  | 2/2 |
| [].alt |  | addPickupFor<sub>0150-pickup-existing</sub> |  |  |  |  | 0/2 |
| [].bg |  | addPickupFor<sub>0150-pickup-existing</sub> aiPickupStory<sub>0290-season-rotation</sub> rotatePickups<sub>0280-live-ops</sub> | readBanner<sub>0250-story-factory</sub> |  |  |  | 0/2 |
| [].collab |  | addPickupFor<sub>0150-pickup-existing</sub> |  |  |  |  | 0/2 |
| [].desc |  | addPickupFor<sub>0150-pickup-existing</sub> aiPickupStory<sub>0290-season-rotation</sub> rotatePickups<sub>0280-live-ops</sub> | handleNavigationAndToolsAction<sub>0510-actions/</sub> readBanner<sub>0250-story-factory</sub> |  |  | BGM_PROMPT CG_ART CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE …외 9 | 2/2 |
| [].eventId |  | aiPickupStory<sub>0290-season-rotation</sub> |  |  |  |  | 0/2 |
| [].gate |  | addPickupFor<sub>0150-pickup-existing</sub> |  |  |  |  | 0/2 |
| [].id |  | addPickupFor<sub>0150-pickup-existing</sub> | handleNavigationAndToolsAction<sub>0510-actions/</sub> |  |  | BGM_PROMPT CG_ART CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE …외 9 | 2/2 |
| [].name |  | addPickupFor<sub>0150-pickup-existing</sub> rotatePickups<sub>0280-live-ops</sub> | handleNavigationAndToolsAction<sub>0510-actions/</sub> readBanner<sub>0250-story-factory</sub> renameEverywhere<sub>0230-modal</sub> |  |  | BGM_PROMPT CG_ART CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE …외 9 | 2/2 |
| [].newAt |  | addPickupFor<sub>0150-pickup-existing</sub> gateCheck<sub>0500-gacha</sub> |  |  |  |  | 0/2 |
| [].pickup |  | addPickupFor<sub>0150-pickup-existing</sub> fix<sub>0070-save</sub> repairRefs<sub>0070-save</sub> rotatePickups<sub>0280-live-ops</sub> | handleNavigationAndToolsAction<sub>0510-actions/</sub> storyPurge<sub>0250-story-factory</sub> |  |  | BGM_PROMPT CG_ART CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE …외 9 | 2/2 |
| [].pool |  | addPickupFor<sub>0150-pickup-existing</sub> fix<sub>0070-save</sub> repairRefs<sub>0070-save</sub> | readBanner<sub>0250-story-factory</sub> storyPurge<sub>0250-story-factory</sub> |  |  |  | 2/2 |
| [].rate |  | addPickupFor<sub>0150-pickup-existing</sub> fix<sub>0070-save</sub> | readBanner<sub>0250-story-factory</sub> |  |  |  | 2/2 |
| [].textContent |  |  | handleNavigationAndToolsAction<sub>0510-actions/</sub> |  |  | BGM_PROMPT CG_ART CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE …외 9 | 0/2 |
| [].type |  | addPickupFor<sub>0150-pickup-existing</sub> | readBanner<sub>0250-story-factory</sub> |  |  |  | 2/2 |
| [].until |  | addPickupFor<sub>0150-pickup-existing</sub> |  |  |  |  | 0/2 |

### chapters.json — 시나리오(장·스테이지·대본·적)

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| (파일 전체) | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> |  | handleStoryAndAuthoringAction<sub>0510-actions/</sub> |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 45 | 2/2 |
| [].__purge |  |  | handleStoryAndAuthoringAction<sub>0510-actions/</sub> |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 13 | 0/2 |
| [].eventId |  |  | handleStoryAndAuthoringAction<sub>0510-actions/</sub> |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 13 | 0/2 |
| [].kind |  | fix<sub>0070-save</sub> |  |  | w_stance |  | 2/2 |
| [].lore |  |  | evLoreSet<sub>0250-story-factory</sub> |  |  |  | 0/2 |
| [].ord |  |  | handleStoryAndAuthoringAction<sub>0510-actions/</sub> |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 13 | 2/2 |
| [].recruits |  |  | storyPurge<sub>0250-story-factory</sub> |  |  |  | 1/2 |
| [].relScan | relFromScripts<sub>0450-relations-memory</sub> | relFromScripts<sub>0450-relations-memory</sub> | evLoreSet<sub>0250-story-factory</sub> handleStoryAndAuthoringAction<sub>0510-actions/</sub> |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 13 | 2/2 |
| [].stages |  |  | handleStoryAndAuthoringAction<sub>0510-actions/</sub> |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 13 | 2/2 |
| [].stages[].combatBalance |  | v2BalanceChapter<sub>combat/050-bridge</sub> v2PrepareStage<sub>combat/050-bridge</sub> | v2BalanceChapter<sub>combat/050-bridge</sub> v2PrepareStage<sub>combat/050-bridge</sub> readChForm<sub>0240-growth-curve</sub> |  |  |  | 1/2 |
| [].stages[].enemies | buildNewGameDraft<sub>0260-new-game/</sub> | v2BalanceChapter<sub>combat/050-bridge</sub> v2PrepareStage<sub>combat/050-bridge</sub> | v2BalanceChapter<sub>combat/050-bridge</sub> v2PrepareStage<sub>combat/050-bridge</sub> readChForm<sub>0240-growth-curve</sub> |  | s_rules | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 33 | 2/2 |
| [].stages[].enemies[].atk |  | fitEnemy<sub>0240-growth-curve</sub> sysEventFoes<sub>0250-story-factory</sub> | fitEnemy<sub>0240-growth-curve</sub> sysEventFoes<sub>0250-story-factory</sub> |  |  |  | 2/2 |
| [].stages[].enemies[].def |  | fitEnemy<sub>0240-growth-curve</sub> sysEventFoes<sub>0250-story-factory</sub> | fitEnemy<sub>0240-growth-curve</sub> sysEventFoes<sub>0250-story-factory</sub> |  |  |  | 2/2 |
| [].stages[].enemies[].elem |  |  | handleStoryAndAuthoringAction<sub>0510-actions/</sub> rulesSave<sub>0185-game-rules</sub> |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 13 | 2/2 |
| [].stages[].enemies[].hp |  | fitEnemy<sub>0240-growth-curve</sub> sysEventFoes<sub>0250-story-factory</sub> | fitEnemy<sub>0240-growth-curve</sub> sysEventFoes<sub>0250-story-factory</sub> |  |  |  | 2/2 |
| [].stages[].enemies[].spd |  | fitEnemy<sub>0240-growth-curve</sub> sysEventFoes<sub>0250-story-factory</sub> | fitEnemy<sub>0240-growth-curve</sub> sysEventFoes<sub>0250-story-factory</sub> |  |  |  | 2/2 |
| [].stages[].field | stageAutoRules<sub>0485-battle-rules</sub> | stageAutoRules<sub>0485-battle-rules</sub> |  |  | s_rules |  | 2/2 |
| [].stages[].goal | stageAutoRules<sub>0485-battle-rules</sub> | stageAutoRules<sub>0485-battle-rules</sub> |  |  | s_rules |  | 2/2 |
| [].stages[].post | buildNewGameDraft<sub>0260-new-game/</sub> | fix<sub>0070-save</sub> writeStages<sub>0250-story-factory</sub> | handleStoryAndAuthoringAction<sub>0510-actions/</sub> readChForm<sub>0240-growth-curve</sub> writeStages<sub>0250-story-factory</sub> |  | s_direct | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 49 | 2/2 |
| [].stages[].pre | buildNewGameDraft<sub>0260-new-game/</sub> | fix<sub>0070-save</sub> writeStages<sub>0250-story-factory</sub> | handleStoryAndAuthoringAction<sub>0510-actions/</sub> readChForm<sub>0240-growth-curve</sub> writeStages<sub>0250-story-factory</sub> |  | s_direct s_script | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 49 | 2/2 |
| [].stages[].reward |  |  | readChForm<sub>0240-growth-curve</sub> |  |  |  | 2/2 |
| [].stages[].route | buildNewGameDraft<sub>0260-new-game/</sub> |  |  |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 33 | 1/2 |
| [].stages[].rulesV | stageAutoRules<sub>0485-battle-rules</sub> | stageAutoRules<sub>0485-battle-rules</sub> |  |  | s_rules |  | 2/2 |
| [].stages[].stamina |  |  | handleStoryAndAuthoringAction<sub>0510-actions/</sub> |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 13 | 0/2 |
| [].stages[].story | buildNewGameDraft<sub>0260-new-game/</sub> |  | readChForm<sub>0240-growth-curve</sub> |  | s_rules | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 33 | 2/2 |
| [].stages[].textContent |  |  | handleStoryAndAuthoringAction<sub>0510-actions/</sub> |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 13 | 0/2 |
| [].stages[].title |  |  | readChForm<sub>0240-growth-curve</sub> |  | s_rules |  | 2/2 |

### chars.json — 캐릭터

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| (파일 전체) | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> |  | handleStoryAndAuthoringAction<sub>0510-actions/</sub> storyPurge<sub>0250-story-factory</sub> |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 45 | 2/2 |
| [].__deb | buildNewGameDraft<sub>0260-new-game/</sub> |  |  |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 33 | 0/2 |
| [].affLines |  | fix<sub>0070-save</sub> personaAI<sub>0455-persona</sub> | personaAI<sub>0455-persona</sub> readCharForm<sub>0230-modal</sub> |  | c_aff c_persona_weak | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 3 | 2/2 |
| [].age |  | aiAltChar<sub>0290-season-rotation</sub> conMakeVariant<sub>0505-construct</sub> fix<sub>0070-save</sub> | aiAltChar<sub>0290-season-rotation</sub> |  |  | ALT_CANON ALT_CHAR ALT_SIDE ALT_THEME_AUTO CTX_ALT_CANON …외 5 | 2/2 |
| [].alt |  | aiAltChar<sub>0290-season-rotation</sub> conMakeVariant<sub>0505-construct</sub> | aiAltChar<sub>0290-season-rotation</sub> |  |  | ALT_CANON ALT_CHAR ALT_SIDE ALT_THEME_AUTO CTX_ALT_CANON …외 5 | 0/2 |
| [].altCanon |  | aiAltChar<sub>0290-season-rotation</sub> conMakeVariant<sub>0505-construct</sub> | aiAltChar<sub>0290-season-rotation</sub> |  |  | ALT_CANON ALT_CHAR ALT_SIDE ALT_THEME_AUTO CTX_ALT_CANON …외 5 | 0/2 |
| [].atk | balNormalize<sub>0187-balance</sub> | balNormalize<sub>0187-balance</sub> | readCharForm<sub>0230-modal</sub> rulesRecalc<sub>0185-game-rules</sub> |  | c_statband |  | 2/2 |
| [].baseStatsMigration |  |  |  | migrateBaseStats<sub>combat/030-core</sub> |  |  | 0/2 |
| [].baseStatsVersion |  | sysStats<sub>0250-story-factory</sub> | readCharForm<sub>0230-modal</sub> sysStats<sub>0250-story-factory</sub> | migrateBaseStats<sub>combat/030-core</sub> |  |  | 2/2 |
| [].bond |  | addNewChars<sub>0250-story-factory</sub> | addNewChars<sub>0250-story-factory</sub> |  |  |  | 1/2 |
| [].cards |  | drawCardArts<sub>0120-abyss</sub> |  |  |  |  | 0/2 |
| [].collab |  | aiNewPickupChar<sub>0290-season-rotation</sub> | aiNewPickupChar<sub>0290-season-rotation</sub> |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 3 | 0/2 |
| [].cvar |  | conMakeVariant<sub>0505-construct</sub> |  |  |  |  | 0/2 |
| [].debut | buildNewGameDraft<sub>0260-new-game/</sub> | addNewChars<sub>0250-story-factory</sub> debutResolve<sub>0445-factions</sub> | addNewChars<sub>0250-story-factory</sub> debutResolve<sub>0445-factions</sub> fwRead<sub>0445-factions</sub> |  | c_debut | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 33 | 2/2 |
| [].debutLater | buildNewGameDraft<sub>0260-new-game/</sub> | debutResolve<sub>0445-factions</sub> | debutResolve<sub>0445-factions</sub> |  | c_debut | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 33 | 0/2 |
| [].def | balNormalize<sub>0187-balance</sub> | balNormalize<sub>0187-balance</sub> | readCharForm<sub>0230-modal</sub> rulesRecalc<sub>0185-game-rules</sub> | migrateBaseStats<sub>combat/030-core</sub> | c_statband |  | 2/2 |
| [].dupLines |  | fix<sub>0070-save</sub> | readCharForm<sub>0230-modal</sub> |  |  |  | 2/2 |
| [].elem |  | fix<sub>0070-save</sub> | handleStoryAndAuthoringAction<sub>0510-actions/</sub> readCharForm<sub>0230-modal</sub> |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 13 | 2/2 |
| [].episodes |  | fix<sub>0070-save</sub> | handleStoryAndAuthoringAction<sub>0510-actions/</sub> |  | c_persona_weak | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 13 | 0/2 |
| [].faceMask | artReuse<sub>0260-new-game/</sub> |  | handleImagesAndAssetsAction<sub>0510-actions/</sub> regenApply<sub>0030-image/</sub> |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 3 | 0/2 |
| [].faces | artReuse<sub>0260-new-game/</sub> | fix<sub>0070-save</sub> | handleImagesAndAssetsAction<sub>0510-actions/</sub> |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 3 | 0/2 |
| [].faction | buildNewGameDraft<sub>0260-new-game/</sub> | aiAltChar<sub>0290-season-rotation</sub> aiNewPickupChar<sub>0290-season-rotation</sub> conMakeVariant<sub>0505-construct</sub> fix<sub>0070-save</sub> | aiAltChar<sub>0290-season-rotation</sub> aiNewPickupChar<sub>0290-season-rotation</sub> fwRead<sub>0445-factions</sub> readCharForm<sub>0230-modal</sub> …외 1 |  | c_monster | ALT_CANON ALT_CHAR ALT_SIDE ALT_THEME_AUTO CAST_SEX_F …외 39 | 2/2 |
| [].files |  | fix<sub>0070-save</sub> | readCharForm<sub>0230-modal</sub> |  |  |  | 2/2 |
| [].fromEnemy | cleanChar<sub>0250-story-factory</sub> | cleanChar<sub>0250-story-factory</sub> |  |  |  |  | 0/2 |
| [].generation | cleanChar<sub>0250-story-factory</sub> | balRemaster<sub>0187-balance</sub> cleanChar<sub>0250-story-factory</sub> | balRemaster<sub>0187-balance</sub> v2EditorAction<sub>combat/050-bridge</sub> |  |  |  | 2/2 |
| [].hp | balNormalize<sub>0187-balance</sub> | balNormalize<sub>0187-balance</sub> | readCharForm<sub>0230-modal</sub> rulesRecalc<sub>0185-game-rules</sub> | migrateBaseStats<sub>combat/030-core</sub> | c_statband |  | 2/2 |
| [].illust |  | fix<sub>0070-save</sub> |  |  |  |  | 2/2 |
| [].img | artReuse<sub>0260-new-game/</sub> |  |  |  |  |  | 0/2 |
| [].intro |  | fix<sub>0070-save</sub> | readCharForm<sub>0230-modal</sub> |  | c_intro |  | 2/2 |
| [].lbbg |  | fix<sub>0070-save</sub> | handleImagesAndAssetsAction<sub>0510-actions/</sub> |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 3 | 2/2 |
| [].lbcg |  | fix<sub>0070-save</sub> |  |  |  |  | 2/2 |
| [].limited |  | addNewChars<sub>0250-story-factory</sub> addPickupFor<sub>0150-pickup-existing</sub> fix<sub>0070-save</sub> | addNewChars<sub>0250-story-factory</sub> handleNavigationAndToolsAction<sub>0510-actions/</sub> readCharForm<sub>0230-modal</sub> |  | c_monster | BGM_PROMPT CG_ART CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE …외 9 | 2/2 |
| [].lines |  | aiAltChar<sub>0290-season-rotation</sub> fix<sub>0070-save</sub> personaAI<sub>0455-persona</sub> | aiAltChar<sub>0290-season-rotation</sub> personaAI<sub>0455-persona</sub> readCharForm<sub>0230-modal</sub> |  | c_lines c_persona_weak | ALT_CANON ALT_CHAR ALT_SIDE ALT_THEME_AUTO CTX_ALT_CANON …외 7 | 2/2 |
| [].lvLines |  | fix<sub>0070-save</sub> | readCharForm<sub>0230-modal</sub> |  |  |  | 2/2 |
| [].naiBlocks | naiBlocksRemember<sub>0020-ai-connect</sub> | naiBlocksRemember<sub>0020-ai-connect</sub> | regenApply<sub>0030-image/</sub> |  |  |  | 2/2 |
| [].naiPose |  | fix<sub>0070-save</sub> |  |  |  |  | 0/2 |
| [].naiPrompt | cleanChar<sub>0250-story-factory</sub> | cleanChar<sub>0250-story-factory</sub> conMakeVariant<sub>0505-construct</sub> fix<sub>0070-save</sub> | readCharForm<sub>0230-modal</sub> regenApply<sub>0030-image/</sub> |  | c_age c_look c_minor c_monster |  | 2/2 |
| [].naiStyle |  | aiAltChar<sub>0290-season-rotation</sub> conMakeVariant<sub>0505-construct</sub> | aiAltChar<sub>0290-season-rotation</sub> |  |  | ALT_CANON ALT_CHAR ALT_SIDE ALT_THEME_AUTO CTX_ALT_CANON …외 5 | 0/2 |
| [].name | buildNewGameDraft<sub>0260-new-game/</sub> | aiAltChar<sub>0290-season-rotation</sub> aiNewPickupChar<sub>0290-season-rotation</sub> conMakeVariant<sub>0505-construct</sub> | aiAltChar<sub>0290-season-rotation</sub> aiNewPickupChar<sub>0290-season-rotation</sub> drHarmony<sub>0260-new-game/</sub> readCharForm<sub>0230-modal</sub> …외 1 |  | c_debut c_monster c_range | ALT_CANON ALT_CHAR ALT_SIDE ALT_THEME_AUTO CAST_SEX_F …외 41 | 2/2 |
| [].noDesign |  |  | readCharForm<sub>0230-modal</sub> |  |  |  | 0/2 |
| [].ord | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> | addNewChars<sub>0250-story-factory</sub> | addNewChars<sub>0250-story-factory</sub> |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 33 | 2/2 |
| [].over |  | inheritAll<sub>0065-inherit</sub> | inheritOnMark<sub>0065-inherit</sub> |  |  |  | 0/2 |
| [].persona | cleanChar<sub>0250-story-factory</sub> | cleanChar<sub>0250-story-factory</sub> personaAI<sub>0455-persona</sub> | personaAI<sub>0455-persona</sub> personaSave<sub>0455-persona</sub> |  | c_persona c_persona_weak c_pfields | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 3 | 2/2 |
| [].pfields | cleanChar<sub>0250-story-factory</sub> | cleanChar<sub>0250-story-factory</sub> personaAI<sub>0455-persona</sub> | personaAI<sub>0455-persona</sub> personaSave<sub>0455-persona</sub> |  | c_pfields | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 3 | 2/2 |
| [].pos | posAssign<sub>0185-game-rules</sub> posSpread<sub>0185-game-rules</sub> | posAssign<sub>0185-game-rules</sub> posSpread<sub>0185-game-rules</sub> | readCharForm<sub>0230-modal</sub> rulesSave<sub>0185-game-rules</sub> |  | c_pos c_range |  | 2/2 |
| [].pose |  | fix<sub>0070-save</sub> |  |  |  |  | 2/2 |
| [].profile |  |  | readCharForm<sub>0230-modal</sub> |  | c_monster c_profile |  | 2/2 |
| [].range | cleanChar<sub>0250-story-factory</sub> | cleanChar<sub>0250-story-factory</sub> |  |  | c_range |  | 2/2 |
| [].rarity |  | addNewChars<sub>0250-story-factory</sub> aiAltChar<sub>0290-season-rotation</sub> aiNewPickupChar<sub>0290-season-rotation</sub> conMakeVariant<sub>0505-construct</sub> …외 1 | addNewChars<sub>0250-story-factory</sub> aiAltChar<sub>0290-season-rotation</sub> aiNewPickupChar<sub>0290-season-rotation</sub> readCharForm<sub>0230-modal</sub> |  |  | ALT_CANON ALT_CHAR ALT_SIDE ALT_THEME_AUTO CTX_ALT_CANON …외 7 | 2/2 |
| [].role | posAssign<sub>0185-game-rules</sub> | fix<sub>0070-save</sub> posAssign<sub>0185-game-rules</sub> | readCharForm<sub>0230-modal</sub> rulesSave<sub>0185-game-rules</sub> |  | c_monster c_pos c_range |  | 2/2 |
| [].roleSpeedOriginal | v2ApplyRoleSpeed<sub>combat/050-bridge</sub> | v2ApplyRoleSpeed<sub>combat/050-bridge</sub> |  |  |  |  | 2/2 |
| [].roleSpeedRole | v2ApplyRoleSpeed<sub>combat/050-bridge</sub> | v2ApplyRoleSpeed<sub>combat/050-bridge</sub> |  |  |  |  | 2/2 |
| [].roleSpeedVersion | v2ApplyRoleSpeed<sub>combat/050-bridge</sub> | v2ApplyRoleSpeed<sub>combat/050-bridge</sub> |  |  |  |  | 2/2 |
| [].scg | scgOf<sub>0180-ui-scroll</sub> | scgOf<sub>0180-ui-scroll</sub> |  |  |  |  | 0/2 |
| [].skill |  | fix<sub>0070-save</sub> sysStats<sub>0250-story-factory</sub> | readCharForm<sub>0230-modal</sub> sysStats<sub>0250-story-factory</sub> |  |  |  | 2/2 |
| [].skillBalance | balNormalize<sub>0187-balance</sub> v2ApplyRoleSpeed<sub>combat/050-bridge</sub> v2Ensure<sub>combat/050-bridge</sub> v2QueueCharacter<sub>combat/050-bridge</sub> | balNormalize<sub>0187-balance</sub> balRemaster<sub>0187-balance</sub> balRemasterAI<sub>0187-balance</sub> inheritApply<sub>0065-inherit</sub> …외 3 | balFix<sub>0187-balance</sub> balRemaster<sub>0187-balance</sub> balRemasterAI<sub>0187-balance</sub> inheritApply<sub>0065-inherit</sub> …외 2 | migrateBaseStats<sub>combat/030-core</sub> | c_genlag c_skills c_statband |  | 1/2 |
| [].skillConcept |  |  | v2EditorAction<sub>combat/050-bridge</sub> regenApply<sub>0030-image/</sub> |  |  |  | 0/2 |
| [].skillDesignLog | v2GenerateSkills<sub>combat/050-bridge</sub> v2QueueCharacter<sub>combat/050-bridge</sub> | balRemasterAI<sub>0187-balance</sub> v2GenerateSkills<sub>combat/050-bridge</sub> v2QueueCharacter<sub>combat/050-bridge</sub> | balRemasterAI<sub>0187-balance</sub> v2EditorAction<sub>combat/050-bridge</sub> regenApply<sub>0030-image/</sub> |  |  | SKILL_KIT_DESIGN SKILL_PALETTE SKILL_REMASTER | 1/2 |
| [].skillGenerationNotice | v2GenerateSkills<sub>combat/050-bridge</sub> v2QueueCharacter<sub>combat/050-bridge</sub> | v2GenerateSkills<sub>combat/050-bridge</sub> v2QueueCharacter<sub>combat/050-bridge</sub> | v2EditorAction<sub>combat/050-bridge</sub> regenApply<sub>0030-image/</sub> |  |  | SKILL_KIT_DESIGN SKILL_PALETTE SKILL_REMASTER | 0/2 |
| [].skillGenerationWarning | cleanChar<sub>0250-story-factory</sub> v2Ensure<sub>combat/050-bridge</sub> | cleanChar<sub>0250-story-factory</sub> v2Ensure<sub>combat/050-bridge</sub> skillResume<sub>0250-story-factory</sub> | v2EditorAction<sub>combat/050-bridge</sub> regenApply<sub>0030-image/</sub> |  |  |  | 0/2 |
| [].skillIcons |  | v2IconClick<sub>combat/050-bridge</sub> | v2IconClick<sub>combat/050-bridge</sub> |  |  |  | 0/2 |
| [].skillPending | cleanChar<sub>0250-story-factory</sub> | cleanChar<sub>0250-story-factory</sub> fix<sub>0070-save</sub> skillResume<sub>0250-story-factory</sub> |  |  |  |  | 0/2 |
| [].skillPlan | v2GenerateSkills<sub>combat/050-bridge</sub> | v2GenerateSkills<sub>combat/050-bridge</sub> | v2SavePlan<sub>combat/050-bridge</sub> regenKeepPlan<sub>0030-image/</sub> |  |  | SKILL_KIT_DESIGN SKILL_PALETTE SKILL_REMASTER | 0/2 |
| [].skillRevisions |  |  | v2EquipmentSkillSaved<sub>combat/070-equipment</sub> |  |  |  | 0/2 |
| [].skills | cleanChar<sub>0250-story-factory</sub> v2Ensure<sub>combat/050-bridge</sub> v2QueueCharacter<sub>combat/050-bridge</sub> | balRemasterAI<sub>0187-balance</sub> cleanChar<sub>0250-story-factory</sub> v2Ensure<sub>combat/050-bridge</sub> v2QueueCharacter<sub>combat/050-bridge</sub> …외 1 | balRemasterAI<sub>0187-balance</sub> v2EditorAction<sub>combat/050-bridge</sub> regenApply<sub>0030-image/</sub> |  | c_skills |  | 2/2 |
| [].skillsLegacyBackup | v2Ensure<sub>combat/050-bridge</sub> | v2Ensure<sub>combat/050-bridge</sub> |  |  |  |  | 0/2 |
| [].skillTuning |  | balRemasterAI<sub>0187-balance</sub> | balRemasterAI<sub>0187-balance</sub> v2EditorAction<sub>combat/050-bridge</sub> regenApply<sub>0030-image/</sub> |  |  |  | 0/2 |
| [].skins | artReuse<sub>0260-new-game/</sub> | fix<sub>0070-save</sub> | handleImagesAndAssetsAction<sub>0510-actions/</sub> handleNavigationAndToolsAction<sub>0510-actions/</sub> |  |  | BGM_PROMPT CG_ART CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE …외 11 | 0/2 |
| [].spd | v2ApplyRoleSpeed<sub>combat/050-bridge</sub> | v2ApplyRoleSpeed<sub>combat/050-bridge</sub> | readCharForm<sub>0230-modal</sub> rulesRecalc<sub>0185-game-rules</sub> |  | c_statband |  | 2/2 |
| [].touch |  | fix<sub>0070-save</sub> | readCharForm<sub>0230-modal</sub> |  | c_touch |  | 2/2 |
| [].upper |  | fix<sub>0070-save</sub> | handleUpdatesAction<sub>0510-actions/</sub> |  |  |  | 2/2 |
| [].useStanding | v2Ensure<sub>combat/050-bridge</sub> | v2Ensure<sub>combat/050-bridge</sub> |  |  |  |  | 2/2 |
| [].voiceId |  | aiAltChar<sub>0290-season-rotation</sub> conMakeVariant<sub>0505-construct</sub> | aiAltChar<sub>0290-season-rotation</sub> applySharedArchive<sub>0520-backup-storage</sub> handleSettingsAndAudioAction<sub>0510-actions/</sub> pubContent<sub>0400-publish-subscribe</sub> …외 1 |  |  | ALT_CANON ALT_CHAR ALT_SIDE ALT_THEME_AUTO CTX_ALT_CANON …외 7 | 0/2 |
| [].voiceName |  |  | applySharedArchive<sub>0520-backup-storage</sub> handleSettingsAndAudioAction<sub>0510-actions/</sub> pubContent<sub>0400-publish-subscribe</sub> shareDefinition<sub>0520-backup-storage</sub> |  |  | VOICE_PICK VOICE_SEARCH | 0/2 |
| [].weapon | artReuse<sub>0260-new-game/</sub> fixWeaponPrompts<sub>0030-image/</sub> v2EnsureEquipment<sub>combat/070-equipment</sub> | fix<sub>0070-save</sub> fixWeaponPrompts<sub>0030-image/</sub> v2EnsureEquipment<sub>combat/070-equipment</sub> | handleCharactersAction<sub>0510-actions/</sub> handleImagesAndAssetsAction<sub>0510-actions/</sub> v2GearAction<sub>combat/070-equipment</sub> readCharForm<sub>0230-modal</sub> …외 1 |  | c_weapon | CHAR_LINES CHAR_LINES_MORE CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE …외 8 | 2/2 |

### dispatches.json — 파견

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| (파일 전체) | buildManualGameDraft<sub>0260-new-game/</sub> ngWorldExtras<sub>0260-new-game/</sub> |  |  |  |  |  | 2/2 |

### events.json — 이벤트

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| (파일 전체) | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> |  | handleStoryAndAuthoringAction<sub>0510-actions/</sub> |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 45 | 0/2 |
| [].active |  | liveTick<sub>0290-season-rotation</sub> seasonStart<sub>0290-season-rotation</sub> |  |  |  |  | 0/2 |
| [].shop |  | fix<sub>0070-save</sub> |  |  |  |  | 0/2 |

### game.json — 나머지

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| __looks | buildNewGameDraft<sub>0260-new-game/</sub> |  |  |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 33 | 0/2 |
| ver | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> |  |  |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 33 | 2/2 |

### lib.json — 자료실(배경·소품·CG·적)

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| (파일 전체) | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> |  | handleNavigationAndToolsAction<sub>0510-actions/</sub> storyPurge<sub>0250-story-factory</sub> |  |  | BGM_PROMPT CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CG_ART …외 41 | 2/2 |
| [].affLines |  |  | regenParseCharacter<sub>0030-image/</sub> |  |  |  | 0/2 |
| [].alias |  | shTake<sub>0565-asset-library</sub> | shTake<sub>0565-asset-library</sub> |  |  |  | 1/2 |
| [].audio |  |  | storeAudio<sub>0040-sound</sub> |  |  |  | 0/2 |
| [].cast |  |  | handleNavigationAndToolsAction<sub>0510-actions/</sub> |  |  | BGM_PROMPT CG_ART CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE …외 9 | 1/2 |
| [].cooldown |  | trainedSkill<sub>combat/030-core</sub> weakenGeneratedSkill<sub>combat/030-core</sub> | trainedSkill<sub>combat/030-core</sub> |  |  |  | 0/2 |
| [].faction |  |  | regenParseCharacter<sub>0030-image/</sub> |  |  |  | 2/2 |
| [].files |  |  | regenParseCharacter<sub>0030-image/</sub> |  |  |  | 0/2 |
| [].id |  | conMakeVariant<sub>0505-construct</sub> |  |  |  |  | 2/2 |
| [].img | artReuse<sub>0260-new-game/</sub> | storeImage<sub>0080-storage-integration</sub> | storeImage<sub>0080-storage-integration</sub> |  |  |  | 0/2 |
| [].initial |  | trainedSkill<sub>combat/030-core</sub> | trainedSkill<sub>combat/030-core</sub> |  |  |  | 0/2 |
| [].intro |  |  | regenParseCharacter<sub>0030-image/</sub> |  |  |  | 0/2 |
| [].lines |  |  | regenParseCharacter<sub>0030-image/</sub> |  |  |  | 0/2 |
| [].live |  |  | subscribe<sub>0400-publish-subscribe</sub> |  |  |  | 0/2 |
| [].lockout |  | trainedSkill<sub>combat/030-core</sub> | trainedSkill<sub>combat/030-core</sub> |  |  |  | 0/2 |
| [].naiPrompt |  | conMakeVariant<sub>0505-construct</sub> | regenParseCharacter<sub>0030-image/</sub> |  |  |  | 0/2 |
| [].name |  | conMakeVariant<sub>0505-construct</sub> fix<sub>0070-save</sub> | handleNavigationAndToolsAction<sub>0510-actions/</sub> regenParseCharacter<sub>0030-image/</sub> |  |  | BGM_PROMPT CG_ART CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE …외 9 | 2/2 |
| [].profile |  |  | regenParseCharacter<sub>0030-image/</sub> |  |  |  | 0/2 |
| [].prompt | artReuse<sub>0260-new-game/</sub> | shTake<sub>0565-asset-library</sub> | elCompose<sub>0040-sound</sub> ensureLibPrompts<sub>0250-story-factory</sub> handleCharactersAction<sub>0510-actions/</sub> handleNavigationAndToolsAction<sub>0510-actions/</sub> …외 2 |  | l_imgperson | BGM_PROMPT CG_ART CHAR_LINES CHAR_LINES_MORE CTX_ALT_CANON …외 17 | 2/2 |
| [].rarity |  | conMakeVariant<sub>0505-construct</sub> |  |  |  |  | 0/2 |
| [].redraw |  | storeImage<sub>0080-storage-integration</sub> | storeImage<sub>0080-storage-integration</sub> |  |  |  | 0/2 |
| [].seed |  | storeImage<sub>0080-storage-integration</sub> | storeImage<sub>0080-storage-integration</sub> |  |  |  | 0/2 |
| [].shared |  | shTake<sub>0565-asset-library</sub> | shTake<sub>0565-asset-library</sub> |  |  |  | 0/2 |
| [].skills |  |  |  | balanceSkill<sub>combat/030-core</sub> balanceSlot<sub>combat/030-core</sub> |  |  | 0/2 |
| [].touch |  |  | regenParseCharacter<sub>0030-image/</sub> |  |  |  | 0/2 |
| [].triggerEvery |  | trainedSkill<sub>combat/030-core</sub> weakenGeneratedSkill<sub>combat/030-core</sub> | trainedSkill<sub>combat/030-core</sub> |  |  |  | 0/2 |
| [].weapon |  |  | regenParseCharacter<sub>0030-image/</sub> |  |  |  | 0/2 |

### meta.json — 게임 설정·규칙(건조·포지션·밸런스·일정 …)

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| accent | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> |  | handleStoryAndAuthoringAction<sub>0510-actions/</sub> |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 45 | 2/2 |
| artNeg | artReuse<sub>0260-new-game/</sub> buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> |  | handleStoryAndAuthoringAction<sub>0510-actions/</sub> |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 45 | 0/2 |
| artTags | artReuse<sub>0260-new-game/</sub> buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> | bpRead<sub>0370-game-picker</sub> | handleSetupAction<sub>0510-actions/</sub> handleStoryAndAuthoringAction<sub>0510-actions/</sub> |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 45 | 0/2 |
| auditSeen | ngFinish<sub>0260-new-game/</sub> |  | openAudit<sub>0535-content-audit</sub> |  |  |  | 0/2 |
| balance | BAL<sub>0187-balance</sub> balanceOnCreate<sub>0187-balance</sub> | BAL<sub>0187-balance</sub> balanceOnCreate<sub>0187-balance</sub> | balSave<sub>0187-balance</sub> |  |  |  | 0/2 |
| bestiary | bestiaryApply<sub>0445-factions</sub> | bestiaryApply<sub>0445-factions</sub> |  |  |  |  | 2/2 |
| bible | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> |  |  |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 33 | 0/2 |
| cast |  |  | fwRead<sub>0445-factions</sub> |  |  |  | 0/2 |
| castSex | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> |  | handleStoryAndAuthoringAction<sub>0510-actions/</sub> |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 45 | 0/2 |
| construct | conStartNew<sub>0505-construct</sub> | conSave<sub>0505-construct</sub> |  |  |  |  | 0/2 |
| design |  |  | handleNavigationAndToolsAction<sub>0510-actions/</sub> |  |  | BGM_PROMPT CG_ART CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE …외 9 | 0/2 |
| draft | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> |  |  |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 33 | 2/2 |
| elems | buildNewGameDraft<sub>0260-new-game/</sub> |  | handleStoryAndAuthoringAction<sub>0510-actions/</sub> rulesSave<sub>0185-game-rules</sub> |  | g_codex g_rules | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 45 | 2/2 |
| expedition | ngWorldExtras<sub>0260-new-game/</sub> | exMeta<sub>0275-expedition</sub> | exMeta<sub>0275-expedition</sub> |  |  |  | 0/2 |
| farms | ngWorldExtras<sub>0260-new-game/</sub> |  |  |  |  |  | 2/2 |
| logoStyle |  |  | handleNavigationAndToolsAction<sub>0510-actions/</sub> handleStoryAndAuthoringAction<sub>0510-actions/</sub> |  |  | BGM_PROMPT CG_ART CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE …외 21 | 0/2 |
| manual | buildManualGameDraft<sub>0260-new-game/</sub> |  |  |  |  |  | 0/2 |
| persona | ngWorldExtras<sub>0260-new-game/</sub> |  | personaCfgSave<sub>0455-persona</sub> |  |  |  | 0/2 |
| positions | buildNewGameDraft<sub>0260-new-game/</sub> posAI<sub>0185-game-rules</sub> | posAI<sub>0185-game-rules</sub> | rulesSave<sub>0185-game-rules</sub> |  | g_pos | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 34 | 2/2 |
| prompts |  |  | pfSet<sub>0015-prompt-studio/</sub> |  |  |  | 0/2 |
| pub |  |  | pubMeta<sub>0400-publish-subscribe</sub> |  |  |  | 0/2 |
| relProf | buildNewGameDraft<sub>0260-new-game/</sub> | memCatchUp<sub>0450-relations-memory</sub> | handleStoryAndAuthoringAction<sub>0510-actions/</sub> memCatchUp<sub>0450-relations-memory</sub> |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 45 | 2/2 |
| roles | buildNewGameDraft<sub>0260-new-game/</sub> |  |  |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 33 | 2/2 |
| rules | RULESM<sub>0185-game-rules</sub> buildNewGameDraft<sub>0260-new-game/</sub> | RULESM<sub>0185-game-rules</sub> |  |  | g_rules | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 33 | 2/2 |
| shop | buildManualGameDraft<sub>0260-new-game/</sub> ngWorldExtras<sub>0260-new-game/</sub> |  |  |  |  |  | 2/2 |
| spots | spotsAI<sub>0135-schedule</sub> spotsAuto<sub>0135-schedule</sub> | spotsAI<sub>0135-schedule</sub> spotsAuto<sub>0135-schedule</sub> |  |  | c_spot g_spots | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 1 | 0/2 |
| story | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> |  | handleStoryAndAuthoringAction<sub>0510-actions/</sub> |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 45 | 2/2 |
| storyMemory |  |  | smState<sub>0530-story-memory</sub> |  |  |  | 2/2 |
| sub | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> |  | handleStoryAndAuthoringAction<sub>0510-actions/</sub> |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 45 | 2/2 |
| terms | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> |  |  |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 33 | 2/2 |
| theme | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> |  | handleStoryAndAuthoringAction<sub>0510-actions/</sub> |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 45 | 2/2 |
| title | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> |  | handleStoryAndAuthoringAction<sub>0510-actions/</sub> |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 45 | 2/2 |
| tone | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> |  | handleStoryAndAuthoringAction<sub>0510-actions/</sub> |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 45 | 0/2 |
| variants | ngWorldExtras<sub>0260-new-game/</sub> | conSave<sub>0505-construct</sub> |  |  |  |  | 0/2 |

### npcs.json — NPC

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| (파일 전체) | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> | addNpcs<sub>0250-story-factory</sub> autoNpcs<sub>0330-casting</sub> | addNpcs<sub>0250-story-factory</sub> autoNpcs<sub>0330-casting</sub> handleImagesAndAssetsAction<sub>0510-actions/</sub> |  |  | AUTO_NPCS CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON …외 36 | 1/2 |
| [].affLines |  | fix<sub>0070-save</sub> |  |  |  |  | 0/2 |
| [].faces | artReuse<sub>0260-new-game/</sub> | fix<sub>0070-save</sub> |  |  |  |  | 0/2 |
| [].img | artReuse<sub>0260-new-game/</sub> |  |  |  |  |  | 0/2 |
| [].lines |  | fix<sub>0070-save</sub> |  |  |  |  | 0/2 |
| [].look |  | autoNpcs<sub>0330-casting</sub> mkNpc<sub>0250-story-factory</sub> | autoNpcs<sub>0330-casting</sub> mkNpc<sub>0250-story-factory</sub> |  |  | AUTO_NPCS CAST_SEX_F CAST_SEX_M CAST_SEX_MIX | 1/2 |
| [].naiPrompt | artReuse<sub>0260-new-game/</sub> | autoNpcs<sub>0330-casting</sub> mkNpc<sub>0250-story-factory</sub> | autoNpcs<sub>0330-casting</sub> mkNpc<sub>0250-story-factory</sub> |  |  | AUTO_NPCS CAST_SEX_F CAST_SEX_M CAST_SEX_MIX | 1/2 |
| [].npc |  | fix<sub>0070-save</sub> |  |  |  |  | 1/2 |
| [].profile |  | mkNpc<sub>0250-story-factory</sub> | mkNpc<sub>0250-story-factory</sub> |  |  |  | 1/2 |
| [].role |  | autoNpcs<sub>0330-casting</sub> mkNpc<sub>0250-story-factory</sub> | autoNpcs<sub>0330-casting</sub> mkNpc<sub>0250-story-factory</sub> |  |  | AUTO_NPCS CAST_SEX_F CAST_SEX_M CAST_SEX_MIX | 1/2 |
| [].skins |  | fix<sub>0070-save</sub> |  |  |  |  | 0/2 |
| [].speech |  | mkNpc<sub>0250-story-factory</sub> | mkNpc<sub>0250-story-factory</sub> |  |  |  | 1/2 |
| [].touch |  | fix<sub>0070-save</sub> |  |  |  |  | 1/2 |
| [].upper | artReuse<sub>0260-new-game/</sub> | fix<sub>0070-save</sub> |  |  |  |  | 1/2 |

### opening.json — 오프닝

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| (파일 전체) | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> |  |  |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 33 | 2/2 |

### prog.json — 진행(플레이어)

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| (파일 전체) |  | handleNavigationAndToolsAction<sub>0510-actions/</sub> |  |  |  | BGM_PROMPT CG_ART CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE …외 9 | 2/2 |
| avatar | artReuse<sub>0260-new-game/</sub> buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> | handleNavigationAndToolsAction<sub>0510-actions/</sub> naiBlocksOwner<sub>0020-ai-connect</sub> playerDraw<sub>0160-free-chat</sub> readPlayerForm<sub>0160-free-chat</sub> |  |  |  | BGM_PROMPT CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CG_ART …외 41 | 0/2 |
| bio | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> | readPlayerForm<sub>0160-free-chat</sub> |  |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 33 | 0/2 |
| bootPrep |  | bpRead<sub>0370-game-picker</sub> handleNavigationAndToolsAction<sub>0510-actions/</sub> |  |  |  | BGM_PROMPT CG_ART CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE …외 9 | 0/2 |
| castDone | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> | handleImagesAndAssetsAction<sub>0510-actions/</sub> |  |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 35 | 0/2 |
| cbuild | conStartNew<sub>0505-construct</sub> | conBuild<sub>0505-construct</sub> conSave<sub>0505-construct</sub> |  |  |  |  | 0/2 |
| cres | conStartNew<sub>0505-construct</sub> | conBuild<sub>0505-construct</sub> conBuy<sub>0505-construct</sub> conSave<sub>0505-construct</sub> giveReward<sub>0090-growth</sub> |  |  |  |  | 0/2 |
| csFull |  | handleCharactersAction<sub>0510-actions/</sub> |  |  |  | CHAR_LINES CHAR_LINES_MORE CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE …외 6 | 0/2 |
| curBanner |  | addPickupFor<sub>0150-pickup-existing</sub> aiPickupStory<sub>0290-season-rotation</sub> bannerStep<sub>0130-gift</sub> handleEconomyAction<sub>0510-actions/</sub> …외 4 |  |  |  | BGM_PROMPT CG_ART CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE …외 10 | 0/2 |
| curEvent |  | aiEvent<sub>0250-story-factory</sub> handleStoryAndAuthoringAction<sub>0510-actions/</sub> |  |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 13 | 0/2 |
| cxBadge |  |  |  | codexHTML<sub>0300-codex</sub> |  |  | 0/2 |
| cxSeen |  | handleStoryAndAuthoringAction<sub>0510-actions/</sub> openCx<sub>0300-codex</sub> |  | cxNew<sub>0300-codex</sub> |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 13 | 0/2 |
| dboard |  | dispClaim<sub>0274-dispatch</sub> handleStoryAndAuthoringAction<sub>0510-actions/</sub> |  |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 13 | 0/2 |
| disp |  | dispEndAll<sub>0274-dispatch</sub> |  |  |  |  | 0/2 |
| dm |  | bump<sub>0090-growth</sub> handleNavigationAndToolsAction<sub>0510-actions/</sub> |  |  |  | BGM_PROMPT CG_ART CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE …외 9 | 2/2 |
| exped |  | exAssign<sub>0275-expedition</sub> exBizSettle<sub>0275-expedition</sub> exBusyIds<sub>0275-expedition</sub> exClaim<sub>0275-expedition</sub> …외 5 |  |  |  |  | 0/2 |
| farmV |  |  |  | farmHTML<sub>0180-ui-scroll</sub> |  |  | 0/2 |
| fcAff |  | fcSend<sub>0160-free-chat</sub> |  |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 7 | 0/2 |
| fchat |  | fcOf<sub>0160-free-chat</sub> handleMessengerAction<sub>0510-actions/</sub> phRooms<sub>0100-messenger</sub> roomDel<sub>0100-messenger</sub> …외 1 |  |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 2 | 0/2 |
| fcPhoto |  | handleMessengerAction<sub>0510-actions/</sub> |  |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 2 | 0/2 |
| firstTen |  | pull<sub>0500-gacha</sub> |  |  |  |  | 2/2 |
| flags |  | storyFlag<sub>0465-story-plan</sub> |  |  |  |  | 0/2 |
| gateSeen |  | gateCheck<sub>0500-gacha</sub> |  |  |  |  | 0/2 |
| gems |  | giveReward<sub>0090-growth</sub> pay<sub>0190-shop</sub> |  |  |  |  | 2/2 |
| gender | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> | readPlayerForm<sub>0160-free-chat</sub> |  |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 33 | 0/2 |
| genderTxt | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> | readPlayerForm<sub>0160-free-chat</sub> |  |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 33 | 0/2 |
| gifts |  | addGifts<sub>0130-gift</sub> handleCharactersAction<sub>0510-actions/</sub> |  |  |  | CHAR_LINES CHAR_LINES_MORE CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE …외 6 | 0/2 |
| gold |  | enhance<sub>0090-growth</sub> giveReward<sub>0090-growth</sub> handleStoryAndAuthoringAction<sub>0510-actions/</sub> pay<sub>0190-shop</sub> …외 1 |  |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 13 | 2/2 |
| guar |  | pityGet<sub>0500-gacha</sub> rollOne<sub>0500-gacha</sub> |  |  |  |  | 0/2 |
| hideEyes | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> | readPlayerForm<sub>0160-free-chat</sub> |  |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 33 | 2/2 |
| hist2 |  | grantOwned<sub>0500-gacha</sub> rollOne<sub>0500-gacha</sub> |  |  |  |  | 0/2 |
| history |  | grantOwned<sub>0500-gacha</sub> |  |  |  |  | 0/2 |
| lobbyBg | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> |  |  |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 33 | 2/2 |
| lobbyMode |  | handleImagesAndAssetsAction<sub>0510-actions/</sub> |  |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 3 | 0/2 |
| look | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> | readPlayerForm<sub>0160-free-chat</sub> |  |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 33 | 2/2 |
| mail |  | handleMailAction<sub>0510-actions/</sub> mailRemove<sub>0220-mail</sub> sendMail<sub>0220-mail</sub> |  |  |  |  | 0/2 |
| mailBuild |  | mailTick<sub>0220-mail</sub> |  |  |  |  | 0/2 |
| mailInit |  | mailTick<sub>0220-mail</sub> |  |  |  |  | 0/2 |
| nameAsked | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> |  |  |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 33 | 2/2 |
| pass |  | handleEconomyAction<sub>0510-actions/</sub> liveTick<sub>0290-season-rotation</sub> |  |  |  | SHOP_LINES | 2/2 |
| pities |  | pityGet<sub>0500-gacha</sub> |  |  |  |  | 0/2 |
| pity |  | pitySet<sub>0500-gacha</sub> |  |  |  |  | 2/2 |
| player | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> | readPlayerForm<sub>0160-free-chat</sub> |  |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 33 | 0/2 |
| prepAsked |  | bpRead<sub>0370-game-picker</sub> handleNavigationAndToolsAction<sub>0510-actions/</sub> |  | prepAsk<sub>0290-season-rotation</sub> |  | BGM_PROMPT CG_ART CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE …외 9 | 0/2 |
| prepNever |  | handleNavigationAndToolsAction<sub>0510-actions/</sub> |  |  |  | BGM_PROMPT CG_ART CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE …외 9 | 0/2 |
| presets |  | handleCombatAndFormationAction<sub>0510-actions/</sub> |  |  |  |  | 0/2 |
| prompt |  | handleNavigationAndToolsAction<sub>0510-actions/</sub> |  |  |  | BGM_PROMPT CG_ART CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE …외 9 | 0/2 |
| raid |  | handleCombatAndFormationAction<sub>0510-actions/</sub> raidBoss<sub>0110-challenge-raid</sub> raidEnd<sub>0110-challenge-raid</sub> |  |  |  |  | 0/2 |
| rogue |  | dgMove<sub>0120-abyss</sub> drawCardArts<sub>0120-abyss</sub> handleCombatAndFormationAction<sub>0510-actions/</sub> handleNavigationAndToolsAction<sub>0510-actions/</sub> …외 6 |  | abyssHTML<sub>0120-abyss</sub> |  | BGM_PROMPT CG_ART CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE …외 9 | 0/2 |
| scene | buildNewGameDraft<sub>0260-new-game/</sub> | handleSettingsAndAudioAction<sub>0510-actions/</sub> |  |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 35 | 2/2 |
| sched |  | schedVisit<sub>0135-schedule</sub> |  |  |  |  | 0/2 |
| sec |  | grantOwned<sub>0500-gacha</sub> |  |  |  |  | 0/2 |
| seen |  | handleNavigationAndToolsAction<sub>0510-actions/</sub> |  |  |  | BGM_PROMPT CG_ART CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE …외 9 | 0/2 |
| seenOpening |  |  |  | afterPrologue<sub>0470-title-opening</sub> |  |  | 2/2 |
| shop |  | handleEconomyAction<sub>0510-actions/</sub> |  |  |  | SHOP_LINES | 2/2 |
| skinOwn |  | handleNavigationAndToolsAction<sub>0510-actions/</sub> |  |  |  | BGM_PROMPT CG_ART CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE …외 9 | 0/2 |
| sortie |  | sortieBegin<sub>0487-formation-sortie</sub> sortieEnd<sub>0487-formation-sortie</sub> sortieNodeEnd<sub>0487-formation-sortie</sub> sortieParts<sub>0487-formation-sortie</sub> |  |  |  |  | 0/2 |
| spark |  | rollOne<sub>0500-gacha</sub> |  |  |  |  | 0/2 |
| squad |  | handleCombatAndFormationAction<sub>0510-actions/</sub> |  |  |  |  | 0/2 |
| stam |  | handleStoryAndAuthoringAction<sub>0510-actions/</sub> stamUse<sub>0090-growth</sub> |  |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 13 | 0/2 |
| stars |  | bEnd<sub>0480-battle</sub> modeClear<sub>0488-stage-modes</sub> |  |  |  |  | 0/2 |
| titleBg | buildNewGameDraft<sub>0260-new-game/</sub> |  |  |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 33 | 2/2 |
| tower |  | towerEnd<sub>0125-tower</sub> |  |  |  |  | 0/2 |
| useCg |  | handleNavigationAndToolsAction<sub>0510-actions/</sub> |  |  |  | BGM_PROMPT CG_ART CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE …외 9 | 0/2 |

### rels.json — 관계

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| (파일 전체) | RELS<sub>0450-relations-memory</sub> buildNewGameDraft<sub>0260-new-game/</sub> | RELS<sub>0450-relations-memory</sub> relGC<sub>0250-story-factory</sub> | handleStoryAndAuthoringAction<sub>0510-actions/</sub> relGC<sub>0250-story-factory</sub> storyPurge<sub>0250-story-factory</sub> |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 45 | 2/2 |

### threads.json — 메신저(톡)

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| (파일 전체) | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> | dailyTalks<sub>0280-live-ops</sub> | handleStoryAndAuthoringAction<sub>0510-actions/</sub> storyPurge<sub>0250-story-factory</sub> |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 46 | 2/2 |
| [].added |  |  | handleMessengerAction<sub>0510-actions/</sub> |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 2 | 0/2 |
| [].charId |  | repairRefs<sub>0070-save</sub> | handleMessengerAction<sub>0510-actions/</sub> |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 2 | 2/2 |
| [].id |  |  | handleMessengerAction<sub>0510-actions/</sub> |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 2 | 2/2 |
| [].needOwn |  |  | handleMessengerAction<sub>0510-actions/</sub> |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 2 | 2/2 |
| [].script |  |  | handleMessengerAction<sub>0510-actions/</sub> |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 2 | 2/2 |
| [].title |  |  | handleMessengerAction<sub>0510-actions/</sub> |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 2 | 2/2 |
| [].trigger |  |  | handleMessengerAction<sub>0510-actions/</sub> |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 2 | 2/2 |

### world.json — 세계관(세력·도감·설정)

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| codex | rulesCodex<sub>0185-game-rules</sub> | cxStore<sub>0300-codex</sub> rulesCodex<sub>0185-game-rules</sub> | cxStore<sub>0300-codex</sub> handleStoryAndAuthoringAction<sub>0510-actions/</sub> storyPurge<sub>0250-story-factory</sub> |  | g_codex | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 13 | 1/2 |
| codexNotes |  | cxNotes<sub>0300-codex</sub> | cxNotes<sub>0300-codex</sub> |  |  |  | 0/2 |
| factions | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> factions<sub>0445-factions</sub> | factions<sub>0445-factions</sub> | handleStoryAndAuthoringAction<sub>0510-actions/</sub> regenApply<sub>0030-image/</sub> |  | w_stance | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 45 | 2/2 |
| factions[].kind | factionAI<sub>0445-factions</sub> factions<sub>0445-factions</sub> | factionAI<sub>0445-factions</sub> factions<sub>0445-factions</sub> |  |  | w_stance | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 1 | 2/2 |
| factions[].name |  |  | fwRead<sub>0445-factions</sub> |  |  |  | 2/2 |
| factions[].rel | factions<sub>0445-factions</sub> | factions<sub>0445-factions</sub> | fwRead<sub>0445-factions</sub> |  |  |  | 2/2 |
| factions[].stance | factionAI<sub>0445-factions</sub> factions<sub>0445-factions</sub> stanceAI<sub>0445-factions</sub> | factionAI<sub>0445-factions</sub> factions<sub>0445-factions</sub> stanceAI<sub>0445-factions</sub> stanceApply<sub>0445-factions</sub> | fwRead<sub>0445-factions</sub> stanceApply<sub>0445-factions</sub> |  | w_stance | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 2 | 2/2 |
| lore | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> |  | handleStoryAndAuthoringAction<sub>0510-actions/</sub> |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 45 | 2/2 |
| name | buildManualGameDraft<sub>0260-new-game/</sub> |  | handleStoryAndAuthoringAction<sub>0510-actions/</sub> |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 13 | 2/2 |
| plan |  | PLAN<sub>0465-story-plan</sub> planAI<sub>0465-story-plan</sub> | PLAN<sub>0465-story-plan</sub> planAI<sub>0465-story-plan</sub> |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 2 | 0/2 |
| plot | buildManualGameDraft<sub>0260-new-game/</sub> |  | handleStoryAndAuthoringAction<sub>0510-actions/</sub> |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 13 | 2/2 |
| source | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> |  |  |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 33 | 0/2 |
| summary | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> |  | handleStoryAndAuthoringAction<sub>0510-actions/</sub> |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 45 | 2/2 |

## 2. index.html 기능 표면 → 기능 단위 → 얽힌 모듈

산출물 index.html이 사용자에게 보여 주고 수행하는 기능을 코드에서 뽑은 분류(지금 모듈 구조는 기준이 아님 — 원안 한 파일을 고려 없이 나눈 것이라 대어 보는 대상): 아래 탭(메뉴) → 화면(경로표)·설정 하위 화면의 패널 → 창(openModal) + 배경(새 게임 생성·실행 중 AI·불러오기·앱 시작). 한 화면에서만 여는 창은 그 화면 안, 여러 단위가 여는 창은 공용 창. 함수는 동작(data-act → 처리기)과 호출을 따라 **가장 가까운 기능 단위**에 붙임(같은 거리면 같이 씀 — 공용·엔진). 「함수」 = 그 단위에서만 닿는 함수 수

### 대원

| 기능 단위 | 종류 | 함수 | 얽힌 모듈(함수 수) | 안의 창 |
|---|---|---|---|---|
| 대원 | 화면 | 2 | 0150-pickup-existing 1, 0180-ui-scroll 1 | openAddChar |

### 작전

| 기능 단위 | 종류 | 함수 | 얽힌 모듈(함수 수) | 안의 창 |
|---|---|---|---|---|
| 작전 | 화면 | 5 | 0180-ui-scroll 4, 0488-stage-modes 1 |  |

### 로비

| 기능 단위 | 종류 | 함수 | 얽힌 모듈(함수 수) | 안의 창 |
|---|---|---|---|---|
| disp | 화면 | 26 | 0275-expedition 20, 0274-dispatch 5, 0505-construct 1 | openDispSel |
| 도전 | 화면 | 21 | 0120-abyss 13, 0125-tower 6, 0110-challenge-raid 1, 0490-boss-patterns 1 | openRgForm |
| 도감 | 화면 | 21 | 0300-codex 18, 0015-prompt-studio/ 3 | openCx · openCxEdit |
| 미지 탐사 | 화면 | 17 | 0120-abyss 17 |  |
| 창 만든  | 공용 창 | 13 | 0020-ai-connect 6, 0015-prompt-studio/ 4, 0180-ui-scroll 2, 0030-image/ 1 | renderVoice |
| 일정 | 화면 | 11 | 0135-schedule 9, 0015-prompt-studio/ 2 |  |
| 상점 | 화면 | 11 | 0190-shop 8, 0015-prompt-studio/ 2, 0030-image/ 1 | 상점 주인 |
| 로비 | 화면 | 10 | 0462-direction 3, 0090-growth 2, 0100-messenger 2, 0180-ui-scroll 1, 0290-season-rotation 1 …외 1 |  |
| 캐시 상점 | 화면 | 9 | 0190-shop 5, 0270-skin-proposal 2, 0080-storage-integration 1, 0200-skin-shop 1 | 사면 함께 만들 것 |
| 훈련 | 화면 | 7 | 0090-growth 3, 0490-boss-patterns 2, 0180-ui-scroll 1, 0240-growth-curve 1 |  |
| evd | 화면 | 3 | 0250-story-factory 2, 0180-ui-scroll 1 | 이벤트 편집 |
| evshop | 화면 | 2 | 0040-sound 1, 0180-ui-scroll 1 |  |
| 시즌 패스 | 화면 | 2 | 0090-growth 1, 0180-ui-scroll 1 |  |
| 창 수락하면 함께 만들 것 | 공용 창 | 2 | 0270-skin-proposal 2 |  |
| 공지 | 화면 | 1 | 0290-season-rotation 1 |  |
| 이벤트 | 화면 | 1 | 0180-ui-scroll 1 |  |
| 창 ⚡ 행동력 | 공용 창 | 1 | 0090-growth 1 |  |
| 창 덱 | 공용 창 | 1 | 0120-abyss 1 |  |
| 창 rgAbandon | 공용 창 | 1 | 0120-abyss 1 |  |

### 계약

| 기능 단위 | 종류 | 함수 | 얽힌 모듈(함수 수) | 안의 창 |
|---|---|---|---|---|
| 영입 | 화면 | 17 | 0505-construct 15, 0190-shop 1, 0500-gacha 1 | conBuild |
| 계약 | 화면 | 17 | 0500-gacha 10, 0240-growth-curve 2, 0130-gift 1, 0180-ui-scroll 1, 0250-story-factory 1 …외 2 | openBanner · openBannerFrom · 모집 포인트 교환 · openHistory |

### 설정

| 기능 단위 | 종류 | 함수 | 얽힌 모듈(함수 수) | 안의 창 |
|---|---|---|---|---|
| 설정 › 그림 AI | 화면 | 22 | 0020-ai-connect 8, 0370-game-picker 7, 0210-setup 3, 0330-casting 2, 0030-image/ 1 …외 1 |  |
| 설정 › 게임 › 게임 규칙 (속성·포지션·능력치) | 패널 | 19 | 0185-game-rules 16, 0015-prompt-studio/ 2, 0187-balance 1 | 게임 규칙 |
| 설정 › 게임 › 콘텐츠 점검·업그레이드 | 패널 | 18 | 0535-content-audit 15, 0015-prompt-studio/ 2, 0185-game-rules 1 | openAudit |
| 설정 › 게임 › 세력·몬스터·등장 관리 | 패널 | 17 | 0445-factions 14, 0250-story-factory 2, 0015-prompt-studio/ 1 | 세력·몬스터·등장 관리 |
| 창 openAp | 공용 창 | 16 | 0020-ai-connect 11, 0180-ui-scroll 3, 0015-prompt-studio/ 1, 0530-story-memory 1 |  |
| 설정 › 게임 › 에셋 관리 | 패널 | 15 | 0565-asset-library 13, 0462-direction 2 | 에셋 관리 |
| 설정 › 데이터 › backupBlocks | 패널 | 14 | 0525-data-folder 12, 0520-backup-storage 2 | openBackupChoice · 데이터 폴더 내보내기 완료 |
| 설정 › 게임 › 밸런스 관리 | 패널 | 13 | 0187-balance 13 | 밸런스 점검·설정 |
| 설정 › 게임 › 캐릭터 개성·매력 | 패널 | 13 | 0455-persona 9, 0015-prompt-studio/ 4 | 캐릭터 개성 검수·설정 |
| 창 openFaces | 공용 창 | 12 | 0030-image/ 9, 0015-prompt-studio/ 2, 0080-storage-integration 1 |  |
| 창 소리 | 공용 창 | 12 | 0040-sound 4, 0080-storage-integration 2, 0460-script-engine 2, 0015-prompt-studio/ 1, 0060-util 1 …외 2 |  |
| 창 PC 서버 | 공용 창 | 11 | 0360-sync/ 9, 0020-ai-connect 2 | pcStart |
| 창 checkUpdate | 공용 창 | 11 | 0420-app-update 11 | 새 APK 설치가 필요해요 · 업데이트를 받았어요 · 새 버전을 받았어요 |
| 설정 › 게임 › 프롬프트 스튜디오 | 패널 | 11 | 0015-prompt-studio/ 11 | 프롬프트 스튜디오 |
| 설정 › 화면·연출 › 연출 | 패널 | 11 | 0470-title-opening 8, 0060-util 1, 0180-ui-scroll 1, 0290-season-rotation 1 |  |
| 설정 › 게임 › 시나리오 설계 | 패널 | 9 | 0465-story-plan 8, 0015-prompt-studio/ 1 | 시나리오 설계 |
| 설정 › 글 AI | 화면 | 9 | 0020-ai-connect 8, 0180-ui-scroll 1 |  |
| 창 🌐 게임 게시 | 공용 창 | 8 | 0400-publish-subscribe 6, 0080-storage-integration 1, 0335-github-api 1 | 게시했어요 |
| 설정 › 관리관 | 화면 | 8 | 0160-free-chat 4, 0180-ui-scroll 4 |  |
| 창 게임 목록 | 공용 창 | 7 | 0210-setup 2, 0080-storage-integration 1, 0250-story-factory 1, 0260-new-game/ 1, 0370-game-picker 1 …외 1 |  |
| 창 공유 팩 만들기 | 공용 창 | 6 | 0520-backup-storage 5, 0230-modal 1 | 공유 팩 저장 완료 · exportFile |
| 설정 › 게임 › conSettingsPanel | 패널 | 6 | 0505-construct 6 | 바리에이션 (공통 설정) |
| 설정 › 게임 › exSettingsPanel | 패널 | 6 | 0275-expedition 5, 0274-dispatch 1 | openExSet |
| 창 캐릭터 디자인 통일 | 공용 창 | 5 | 0030-image/ 4, 0015-prompt-studio/ 1 |  |
| 창 그림 AI | 공용 창 | 5 | 0030-image/ 3, 0020-ai-connect 2 |  |
| 창 게임 정의 | 공용 창 | 4 | 0440-ai-context 2, 0185-game-rules 1, 0250-story-factory 1 |  |
| 창 🔗 게임 구독 | 공용 창 | 4 | 0400-publish-subscribe 4 |  |
| 설정 › 시즌 운영 | 화면 | 4 | 0290-season-rotation 4 |  |
| 설정 › 연동 › PC·폰 연동 | 패널 | 4 | 0360-sync/ 4 |  |
| 창 openPresetCode | 공용 창 | 3 | 0020-ai-connect 3 |  |
| 창 배경음 한꺼번에 만들기 | 공용 창 | 3 | 0040-sound 3 |  |
| 창 초안 내보내기 | 공용 창 | 3 | 0260-new-game/ 3 |  |
| 창 subCheck | 공용 창 | 3 | 0400-publish-subscribe 3 |  |
| 설정 › 게임 › 전투 체계 | 패널 | 3 | 0487-formation-sortie 2, 0488-stage-modes 1 |  |
| 창 피드백 보내기 | 공용 창 | 2 | 0230-modal 2 |  |
| 창 세계관 | 공용 창 | 2 | 0015-prompt-studio/ 1, 0240-growth-curve 1 |  |
| 창 오프닝 | 공용 창 | 2 | 0015-prompt-studio/ 1, 0240-growth-curve 1 |  |
| 창 다른 기기에 더 새 데이터가 있어요 | 공용 창 | 2 | 0360-sync/ 2 |  |
| 창 홈 화면에 추가해 주세요 | 공용 창 | 2 | 0020-ai-connect 1, 0410-desktop 1 |  |
| 창 업데이트가 있어요 | 공용 창 | 2 | 0420-app-update 2 |  |
| 창 앱 업데이트 | 공용 창 | 2 | 0420-app-update 2 |  |
| 창 백업과 가져오기 | 공용 창 | 2 | 0080-storage-integration 1, 0420-app-update 1 |  |
| 창 backupExport | 공용 창 | 2 | 0520-backup-storage 2 |  |
| 설정 › 게임 › 플레이 모드 | 패널 | 2 | 0170-render 2 |  |
| 설정 › 게임 › 패널 17 | 패널 | 2 | 0090-growth 2 |  |
| 설정 › 화면·연출 › 아이폰·웹 연결 | 패널 | 2 | 0020-ai-connect 1, 0410-desktop 1 |  |
| 설정 › 연동 › PC 서버 | 패널 | 2 | 0020-ai-connect 1, 0360-sync/ 1 |  |
| 설정 › 데이터 | 화면 | 2 | 0080-storage-integration 2 |  |
| 설정 | 화면 | 1 | 0180-ui-scroll 1 |  |
| 창 AI로 다시 만들기 | 공용 창 | 1 | 0030-image/ 1 |  |
| 창 shareText | 공용 창 | 1 | 0230-modal 1 |  |
| 창 openPcHist | 공용 창 | 1 | 0360-sync/ 1 |  |
| 창 중계 서버 (아이폰·웹) | 공용 창 | 1 | 0410-desktop 1 |  |
| 설정 › 게임 › 게시·구독 | 패널 | 1 | 0400-publish-subscribe 1 |  |
| 설정 › 앱 정보 › 업데이트 | 패널 | 1 | 0420-app-update 1 |  |
| 설정 › 앱 정보 › 공유와 피드백 | 패널 | 1 | 0230-modal 1 |  |

### 배경(누르지 않아도 하는 일)

| 기능 단위 | 종류 | 함수 | 얽힌 모듈(함수 수) | 안의 창 |
|---|---|---|---|---|
| 새 게임 생성 | 배경 | 70 | 0015-prompt-studio/ 21, 0260-new-game/ 19, 0485-battle-rules 5, 0185-game-rules 4, 0250-story-factory 3 …외 10 |  |
| 실행 중 AI | 배경 | 21 | 0290-season-rotation 6, 0280-live-ops 4, 0537-live-fill 4, 0015-prompt-studio/ 2, 0200-skin-shop 2 …외 3 | openNotice |
| 앱 시작 | 배경 | 18 | 0015-prompt-studio/ 4, 0050-default-content 4, 0070-save 3, 0020-ai-connect 2, 0080-storage-integration 2 …외 3 |  |

### 여러 메뉴가 여는 창

| 기능 단위 | 종류 | 함수 | 얽힌 모듈(함수 수) | 안의 창 |
|---|---|---|---|---|
| 창 개인 스토리 | 공용 창 | 73 | 0100-messenger 21, 0030-image/ 9, 0230-modal 9, 0160-free-chat 8, 0015-prompt-studio/ 6 …외 10 | openImgLib |
| 창 openCharEdit | 공용 창 | 42 | 0030-image/ 19, 0020-ai-connect 11, 0015-prompt-studio/ 9, 0230-modal 3 | 그리기 전 확인 · openNaiGen |
| 창 등장  | 공용 창 | 29 | 0030-image/ 22, 0015-prompt-studio/ 4, 0040-sound 2, 0240-growth-curve 1 | 배경 지우기 |
| 창 openDraft | 공용 창 | 25 | 0260-new-game/ 17, 0015-prompt-studio/ 7, 0020-ai-connect 1 |  |
| 창 regenPreview | 공용 창 | 17 | 0030-image/ 15, 0015-prompt-studio/ 2 | 다시 만드는 중 |
| 창 openFormation | 공용 창 | 16 | 0240-growth-curve 5, 0230-modal 4, 0485-battle-rules 3, 0487-formation-sortie 2, 0125-tower 1 …외 1 |  |
| 창 openModeStage | 공용 창 | 13 | 0488-stage-modes 11, 0150-pickup-existing 1, 0500-gacha 1 | 증거 제시 · contestDraw |
| 창 챕터 편집 | 공용 창 | 10 | 0015-prompt-studio/ 5, 0240-growth-curve 3, 0450-relations-memory 1, 0530-story-memory 1 |  |
| 창 NPC | 공용 창 | 10 | 0330-casting 7, 0015-prompt-studio/ 2, 0310-art-after-ai 1 |  |
| 창 표정 한꺼번에 만들기 | 공용 창 | 9 | 0330-casting 9 |  |
| 창 관계 고치기 | 공용 창 | 9 | 0450-relations-memory 8, 0015-prompt-studio/ 1 | 인물 관계도 |
| 창 sortieMap | 공용 창 | 9 | 0487-formation-sortie 9 |  |
| 창 openUpConfirm | 공용 창 | 7 | 0090-growth 7 |  |
| 창 우편함 | 공용 창 | 7 | 0220-mail 7 |  |
| 창 이야기 기억 다시 정리 | 공용 창 | 6 | 0530-story-memory 4, 0015-prompt-studio/ 2 | openStoryMemoryEditor |
| 창 openGift | 공용 창 | 5 | 0130-gift 3, 0090-growth 2 |  |
| 창 openLib | 공용 창 | 5 | 0015-prompt-studio/ 2, 0040-sound 2, 0240-growth-curve 1 |  |
| 창 openPickExisting | 공용 창 | 4 | 0150-pickup-existing 4 |  |
| 창 openEpEdit | 공용 창 | 4 | 0015-prompt-studio/ 2, 0230-modal 2 |  |
| 창 openThEdit | 공용 창 | 4 | 0230-modal 2, 0015-prompt-studio/ 1, 0100-messenger 1 |  |
| 창 새 그림을 그릴까요? | 공용 창 | 4 | 0310-art-after-ai 3, 0020-ai-connect 1 |  |
| 창 openStoryStage | 공용 창 | 4 | 0480-battle 3, 0250-story-factory 1 |  |
| 창 초안 가져오기 | 공용 창 | 3 | 0260-new-game/ 3 |  |
| 창 PC·폰 연동 | 공용 창 | 3 | 0360-sync/ 3 |  |
| 창 스토리 기억 관리 | 공용 창 | 3 | 0530-story-memory 3 |  |
| 창 신규 픽업 만들기 | 공용 창 | 2 | 0140-pickup-new 1, 0280-live-ops 1 |  |
| 창 AI로 이벤트 만들기 | 공용 창 | 2 | 0250-story-factory 1, 0270-skin-proposal 1 |  |
| 창 시즌 | 공용 창 | 2 | 0290-season-rotation 2 |  |
| 창 openPrep | 공용 창 | 2 | 0290-season-rotation 2 |  |
| 창 pcPush | 공용 창 | 2 | 0360-sync/ 2 |  |
| 창 opEnd | 공용 창 | 2 | 0470-title-opening 2 |  |
| 창 일괄 생성 | 공용 창 | 1 | 0030-image/ 1 |  |
| 창 스토리 삭제 | 공용 창 | 1 | 0250-story-factory 1 |  |
| 창 다른 기기의 새 데이터가 있어요 | 공용 창 | 1 | 0360-sync/ 1 |  |
| 창 openPullFail | 공용 창 | 1 | 0360-sync/ 1 |  |
| 창 링크 열기 | 공용 창 | 1 | 0420-app-update 1 |  |
| 창 openAiChapter | 공용 창 | 1 | 0420-app-update 1 |  |
| 창 프로필 | 공용 창 | 1 | 0455-persona 1 |  |
| 창 smTextView | 공용 창 | 1 | 0530-story-memory 1 |  |

## 3. 계층(MVC) — 모듈마다 View · Controller · Model, 섞인 함수, 방향 위반

기준(CLAUDE.md §0-2, docs/research/developer-role.md 1-1 — 함수 자신이 하는 일로 판정, lib/arch.mjs): View = HTML 마크업 글을 만들거나 DOM을 바꿈 · Controller = 액션 처리기 또는 화면 갱신(render·toast·openModal·closeModal)을 부름 · Model = 게임 상태를 씀·저장소 쓰기·네트워크·AI·그림 서비스 또는 화면과 관계없는 계산·조회 · **섞임** = 한 함수가 화면을 만들면서 상태·저장·서비스를 직접 씀. **방향 위반** = View가 상태·저장·서비스를 바꾸는 함수를 부름(그리다가 바꿈) · Model이 화면을 만드는 함수를 부름. src/main 함수: View 316 · Controller 99 · Model 1083 · 섞임 62 · 방향 위반 152

| 모듈 | View | Controller | Model | 섞임 | 방향 위반 | 섞인 함수(예) | 방향 위반(예) |
|---|---|---|---|---|---|---|---|
| 0120-abyss | 18 | 4 | 41 | 5 | 13 | drawCardArts, dgMove, abyssHTML, rogueEnd … | cbTurn→cbRender, cbHitE→cbLog, cbOnExhaust→cbLog |
| 0360-sync/ | 12 | 5 | 28 | 2 | 16 | pcPush, syPush | syncStageMedia→syBar, pcStart→pcPush, pcStart→devId |
| 0510-actions/ | 1 | 0 | 1 | 12 | 1 | handleSetupAction, handleNavigationAndToolsAction, handleMailAction, handleStoryAndAuthoringAction … | imgTarget→openChar |
| 0030-image/ | 23 | 4 | 79 | 4 | 8 | regenApply, openNaiGen, naiBatch, skinPartGen | regenRun→regenParseCharacter, generateUltimateCutin→imageCandidates, weaponPromptAI→aiJSON |
| 0020-ai-connect | 11 | 3 | 83 | 1 | 7 | naiBlocksOwner | copilotLogin→http, pcSoon→pcPush, openPresetCode→saveLlm |
| 0100-messenger | 14 | 0 | 13 | 2 | 5 | chatPhotoPick, openRoom | checkTriggers→notify, checkTriggers→updateBadge, phoneList→phRooms |
| 0160-free-chat | 3 | 0 | 7 | 4 | 3 | playerDraw, fcSend, fcNpcPhoto, phPlay | heroTags→aiJSON, openFree→openRoom, fcSummarize→aiJSON |
| 0260-new-game/ | 11 | 7 | 27 | 4 | 3 | drAvatarDraw, runNewGameBuild, buildNewGameDraft, buildManualGameDraft | drRead→drSave, newGame→runNewGameBuild, newGameManual→runNewGameBuild |
| 0290-season-rotation | 5 | 2 | 20 | 1 | 6 | noticeHTML | aiNewPickupChar→aiJSON, aiAltChar→aiJSON, seasonStart→liveBar |
| 0480-battle | 4 | 1 | 10 | 1 | 6 | bEnd | startBattle→openModeStage, startBattle→startStage, startStage→stamUse |
| 0250-story-factory | 5 | 2 | 30 | 2 | 4 | aiChapterGen0, aiEventGen0 | aiJSONRetry→aiJSON, aiEventGen→aiEventGen0, aiEventGen→artAfterAI |
| 0420-app-update | 8 | 1 | 12 | 4 | 2 | checkUpdate, applyUpdate, checkWebUpdate, applyWebUpdate | checkUpdatePrivate→http, checkUpdatePrivate→saveLV |
| 0180-ui-scroll | 23 | 1 | 14 | 1 | 4 | farmHTML | contractHTML0→pityGet, aiProfilesHTML→AIP, settingsBack→settingsNavigate |
| 0300-codex | 2 | 0 | 16 | 2 | 3 | codexHTML, openCx | openCxEdit→cxStore, cxDiscover→aiJSON, cxDeepen→aiJSON |
| 0370-game-picker | 3 | 0 | 5 | 0 | 5 |  | showStart→showPicker, showStart→showCast, showStart→showBootPrep |
| 0462-direction | 8 | 0 | 10 | 0 | 5 |  | slotOf→vnStage, vnDirectSay→vnStage, vnDirectSay→vnMotion |
| 0520-backup-storage | 7 | 2 | 15 | 2 | 3 | backupExport, shareExport | stageBackup→legacyMediaBlob, exportGo→shareExport, exportGo→backupExport |
| 0080-storage-integration | 6 | 3 | 30 | 1 | 3 | storageWarning | reloadGame→flush, reloadGame→storageWarning, bgStyle→procBg |
| 0230-modal | 16 | 1 | 15 | 1 | 3 | openChar | openCharEdit→cleanChar, stageOptions→opt, trigOptions→opt |
| 0240-growth-curve | 9 | 0 | 12 | 0 | 4 |  | refreshForm→openFormation, openFarmSquad→openFormation, aiChapterGen→aiChapterGen0 |
| 0445-factions | 2 | 0 | 23 | 0 | 4 |  | stanceAI→aiJSON, factionAI→aiJSON, factionPanel→factions |
| 0460-script-engine | 8 | 0 | 9 | 0 | 4 |  | playStory→jaBatch, vnSkip→vnFinish, vnSkip→vnStep |
| 0070-save | 0 | 0 | 17 | 1 | 2 | flush | mark→flush, flushNow→flush |
| 0185-game-rules | 4 | 6 | 25 | 0 | 3 |  | rulesCharHTML→RULESM, rulesAIData→aiJSON, posAI→aiJSON |
| 0190-shop | 6 | 1 | 12 | 0 | 3 |  | rIcon→rIco, CASH_RES→conResIcon, cashTopUp→buyFx |
| 0400-publish-subscribe | 3 | 0 | 9 | 3 | 0 | pubUpload, subscribe, subApply |  |
| 0455-persona | 4 | 4 | 13 | 0 | 3 |  | personaAI→aiJSON, personaAIReview→aiJSON, memorialGen→aiJSON |
| 0487-formation-sortie | 3 | 2 | 15 | 1 | 2 | sortieNodeEnd | sortieMap→sortieParts, sortieResult→sortieNodeEnd |
| 0488-stage-modes | 3 | 4 | 10 | 0 | 3 |  | debateStart→debateDraw, debateHit→playStory, debateHit→debateDraw |
| 0535-content-audit | 1 | 4 | 12 | 1 | 2 | openAudit | auditAIFill→aiJSON, auditAIStage→aiJSON |
| 0090-growth | 4 | 5 | 27 | 0 | 2 |  | stamUse→openStam, stamUse→updStam |
| 0135-schedule | 1 | 1 | 7 | 0 | 2 |  | spotsAI→aiJSON, spotTalkAI→aiJSON |
| 0187-balance | 2 | 1 | 13 | 0 | 2 |  | balancePanel→BAL, openBalance→BAL |
| 0210-setup | 2 | 0 | 6 | 0 | 2 |  | showSetup→AIP, renderSetup→AIP |
| 0270-skin-proposal | 4 | 3 | 3 | 1 | 1 | skinPropDraw | skinLinesAI→aiJSON |
| 0275-expedition | 6 | 7 | 17 | 0 | 2 |  | dispPageHTML→dispHTML, dispPageHTML→exHTML |
| 0330-casting | 8 | 3 | 7 | 0 | 2 |  | autoNpcs→aiJSON, showCast→castRun |
| 0450-relations-memory | 3 | 1 | 20 | 0 | 2 |  | openRel→RELS, openRelEdit→RELS |
| 0465-story-plan | 2 | 1 | 8 | 0 | 2 |  | planAI→aiJSON, openPlan→PLAN |
| 0525-data-folder | 2 | 1 | 8 | 1 | 1 | dataExport | dataExportZip→syBar |
| 0537-live-fill | 0 | 2 | 2 | 0 | 2 |  | liveFill→liveBar, liveFillStep→liveBar |
| 0060-util | 6 | 0 | 24 | 1 | 0 | petTick |  |
| 0110-challenge-raid | 0 | 0 | 5 | 1 | 0 | raidEnd |  |
| 0125-tower | 1 | 1 | 5 | 1 | 0 | towerEnd |  |
| 0280-live-ops | 2 | 1 | 4 | 0 | 1 |  | dailyTalks→aiJSON |
| 0410-desktop | 2 | 0 | 3 | 1 | 0 | openA2HS |  |
| 0505-construct | 9 | 2 | 18 | 1 | 0 | conBuild |  |
| 0530-story-memory | 4 | 1 | 10 | 0 | 1 |  | openStoryMemory→smState |

## 4. 기능(같은 데이터·처리) ↔ 화면 · 모듈 판정

기능 = Model·Controller 함수를 호출과 같은 상태 키·data 경로·저장소 키로 이어 모듈성 최대화로 묶은 것(순서를 바꿔 6번 — 과반이 같이 묶인 것만, 경계는 빼고), View 함수는 부르는 Model·Controller의 기능으로 이음. 화면 = 그 기능의 함수에 닿는 index.html 기능 단위(2절). 이름(아래 판정 표) = 그 기능이 가장 많이 쓰는 데이터(여러 기능이 다 쓰는 데이터는 뺌)

| 기능 | 함수 | 주로 쓰는 데이터 | 계층(View·Controller·Model·섞임) | 이어진 화면(닿는 함수 수) | 모듈(함수 수) |
|---|---|---|---|---|---|
| F01 | 125 | chars.json › [].weapon · lib.json › [].prompt · chars.json › [].faceMask | 15·8·91·11 | 상점 13, 캐시 상점 8, 설정 › 그림 AI 5, 영입 2 | 0030-image/ 62, 0020-ai-connect 15, 0015-prompt-studio/ 11, 0080-storage-integration 6, 0330-casting 5 …외 11 |
| F02 | 125 | rels.json · chapters.json › [].relScan · chapters.json › [].stages[].post | 17·4·101·3 | evd 34, 미지 탐사 6, 작전 2, 이벤트 1 | 0015-prompt-studio/ 25, 0450-relations-memory 23, 0250-story-factory 21, 0465-story-plan 9, 0460-script-engine 7 …외 20 |
| F03 | 89 | chars.json › [].voiceId · chars.json › [].voiceName · 저장소 ggm-picked | 13·8·60·8 | 설정 › 데이터 2, 도감 1, 일정 1, 설정 › 연동 › PC·폰 연동 16 | 0360-sync/ 46, 0335-github-api 10, 0400-publish-subscribe 8, 0080-storage-integration 7, 0020-ai-connect 5 …외 10 |
| F04 | 85 | chars.json › [].pos · chars.json › [].skillBalance · chars.json › [].atk | 14·9·62·0 | 도전 7, disp 2, 상점 2, evd 2 | 0185-game-rules 31, 0187-balance 15, 0230-modal 8, 0240-growth-curve 6, 0487-formation-sortie 5 …외 13 |
| F05 | 81 | prog.json › avatar · prog.json › bio · prog.json › gender | 12·8·58·3 | 설정 › 그림 AI 10, 도전 2, 설정 › 관리관 2, 상점 2 | 0260-new-game/ 30, 0015-prompt-studio/ 21, 0020-ai-connect 12, 0010-rules 3, 0160-free-chat 3 …외 9 |
| F06 | 74 | prog.json › gold · prog.json › sortie · prog.json › gems | 15·13·40·6 | 훈련 11, 도전 10, 상점 7, 캐시 상점 6 | 0090-growth 16, 0487-formation-sortie 12, 0480-battle 8, 0488-stage-modes 7, 0190-shop 6 …외 15 |
| F07 | 70 | 저장소 starfall-nai · 저장소 starfall-sound · 저장소 starfall-ai-profiles | 15·3·50·2 | 설정 › 글 AI 9, 설정 › 그림 AI 9, 설정 1, 설정 › 게임 › 프롬프트 스튜디오 5 | 0020-ai-connect 34, 0015-prompt-studio/ 9, 0210-setup 7, 0180-ui-scroll 5, 0520-backup-storage 3 …외 7 |
| F08 | 65 | prog.json › rogue · prog.json › presets · prog.json › raid | 19·4·37·5 | 도전 42, 미지 탐사 24, 이벤트 3, evd 3 | 0120-abyss 54, 0180-ui-scroll 5, 0110-challenge-raid 2, 0070-save 1, 0280-live-ops 1 …외 2 |
| F09 | 64 | prog.json › curBanner · banners.json › [].bg · banners.json › [].desc | 10·8·46·0 | 계약 14, 로비 7, 대원 3, 설정 › 시즌 운영 3 | 0500-gacha 14, 0290-season-rotation 13, 0150-pickup-existing 5, 0015-prompt-studio/ 4, 0280-live-ops 4 …외 12 |
| F10 | 63 | prog.json › fchat · prog.json › fcAff · prog.json › fcPhoto | 15·2·40·6 | evshop 12, 로비 11, 미지 탐사 7, evd 4 | 0100-messenger 21, 0060-util 9, 0455-persona 7, 0160-free-chat 7, 0015-prompt-studio/ 6 …외 6 |
| F11 | 61 | meta.json › spots · prog.json › cxSeen · prog.json › cxBadge | 9·0·50·2 | 도감 22, 일정 7, evd 3, 로비 2 | 0015-prompt-studio/ 19, 0300-codex 19, 0135-schedule 5, 0250-story-factory 4, 0230-modal 3 …외 9 |
| F12 | 58 | lib.json › [].prompt · chars.json › [].voiceId · chars.json › [].voiceName | 14·3·38·3 | 이벤트 1, 미지 탐사 1, 계약 1, 영입 1 | 0520-backup-storage 17, 0040-sound 12, 0565-asset-library 11, 0525-data-folder 7, 0550-standalone-app 3 …외 7 |
| F13 | 56 | chars.json › [].cards · chars.json › [].faceMask · chars.json › [].faces | 20·3·29·4 | 작전 5, 설정 › 그림 AI 5, 로비 5, 캐시 상점 5 | 0080-storage-integration 11, 0180-ui-scroll 8, 0230-modal 7, 0120-abyss 6, 0290-season-rotation 3 …외 15 |
| F14 | 45 | chars.json › [].persona · chars.json › [].pfields · meta.json › auditSeen | 3·5·36·1 | 설정 › 게임 › 콘텐츠 점검·업그레이드 19, 설정 › 게임 › 캐릭터 개성·매력 13, 설정 › 게임 › 프롬프트 스튜디오 2, 설정 › 게임 › 에셋 관리 2 | 0535-content-audit 17, 0455-persona 12, 0015-prompt-studio/ 8, 0462-direction 3, 0505-construct 1 …외 4 |
| F15 | 36 | prog.json › exped · meta.json › expedition · prog.json › disp | 7·7·22·0 | disp 24, 대원 3, 도전 2, 로비 1 | 0275-expedition 28, 0274-dispatch 4, 0090-growth 2, 0240-growth-curve 1, 0180-ui-scroll 1 |
| F16 | 31 | prog.json › mail · 저장소 ggm-upd-notes · chars.json › [].upper | 7·3·16·5 | evd 1, 대원 1, 로비 1, 실행 중 AI 1 | 0420-app-update 17, 0220-mail 8, 0510-actions/ 2, 0250-story-factory 1, 0280-live-ops 1 …외 2 |
| F17 | 31 | world.json › factions[].stance · world.json › factions[].kind · world.json › factions[].rel | 4·1·26·0 | 계약 3, 로비 1, 설정 › 게임 › 세력·몬스터·등장 관리 18, 새 게임 생성 3 | 0445-factions 19, 0015-prompt-studio/ 5, 0030-image/ 3, 0500-gacha 2, 0250-story-factory 2 |
| F18 | 31 | chapters.json › [].stages[].enemies[].atk · chapters.json › [].stages[].enemies[].def · chapters.json › [].stages[].enemies[].hp | 2·1·28·0 | 도전 12, 일정 2, 로비 1, evd 1 | 0125-tower 6, 0485-battle-rules 5, 0240-growth-curve 4, 0110-challenge-raid 3, 0487-formation-sortie 3 …외 7 |
| F19 | 30 | prog.json › cres · chars.json › [].age · chars.json › [].alt | 9·2·18·1 | 영입 21, 캐시 상점 2, 대원 2, 계약 2 | 0505-construct 25, 0190-shop 3, 0290-season-rotation 1, 0015-prompt-studio/ 1 |
| F20 | 30 | 저장소 ggm-voice-ja | 8·1·21·0 | 미지 탐사 12, evshop 3, 로비 2, 계약 1 | 0040-sound 10, 0460-script-engine 7, 0015-prompt-studio/ 4, 0530-story-memory 4, 0080-storage-integration 2 …외 3 |
| F21 | 21 | chars.json › [].naiBlocks | 4·0·17·0 | 실행 중 AI 1, 새 게임 생성 1, 불러오기 1, 앱 시작 1 | 0020-ai-connect 17, 0030-image/ 3, 0015-prompt-studio/ 1 |
| F22 | 19 | prog.json › prepAsked · meta.json › artTags · prog.json › bootPrep | 4·2·13·0 | 설정 › 그림 AI 6, 캐시 상점 2, disp 2, 도전 1 | 0370-game-picker 6, 0274-dispatch 2, 0170-render 2, 0470-title-opening 1, 0190-shop 1 …외 7 |
| F23 | 11 |  | 6·0·5·0 | 창 등장  11 | 0030-image/ 11 |
| F24 | 9 | chars.json › [].over · chars.json › [].skillBalance | 0·0·9·0 | 불러오기 6, 앱 시작 6 | 0065-inherit 9 |
| F25 | 7 |  | 5·0·2·0 | 설정 › 관리관 4, 설정 › 그림 AI 1, 창 openPresetCode 1, 창 등장  1 | 0180-ui-scroll 5, 0160-free-chat 1, 0210-setup 1 |
| F26 | 6 |  | 3·0·3·0 | 로비 3, 미지 탐사 3, 창 rgAbandon 3, 창 개인 스토리 3 | 0462-direction 6 |
| F27 | 5 |  | 2·0·3·0 | 창 regenPreview 5, 창 AI로 다시 만들기 2 | 0030-image/ 5 |
| F28 | 5 |  | 0·0·5·0 |  | 0015-prompt-studio/ 5 |
| F29 | 4 |  | 2·0·2·0 | 설정 › 화면·연출 › 연출 4 | 0470-title-opening 4 |
| F30 | 3 |  | 0·0·2·1 | 새 게임 생성 3 | 0260-new-game/ 3 |
| F31 | 2 |  | 0·0·2·0 | 설정 › 화면·연출 › 아이폰·웹 연결 1, 앱 시작 2 | 0410-desktop 2 |
| F32 | 2 |  | 0·0·2·0 | 도전 1, 창 openFormation 1 | 0490-boss-patterns 2 |
| F33 | 2 |  | 0·0·2·0 | 창 우편함 2 | 0220-mail 2 |
| F34 | 2 |  | 0·0·2·0 | 창 AI로 다시 만들기 2, 창 regenPreview 2 | 0030-image/ 2 |

### 모듈 판정 — src/main 모듈 69: 고유 22 · 조각 22 · 흩어짐 4 · 슈퍼 17 · 기반 2 · 분배 1 · 층 1

기준(코드 냄새 — docs/research/developer-role.md 1-3): 슈퍼 = 관계없는 기능 둘 이상이 각각 함수 max(3, 20%)↑(발산적 변경 → 기능별로 나눔) · 조각 = 중심 기능의 함수가 다른 모듈에 2배↑(게으른 모듈 → 그 모듈로 합침) · 흩어짐 = 어느 기능도 절반이 안 되고 셋 이상에 나뉨(함수마다 제 기능 모듈로) · 기반 = 허브 함수(25개↑ 함수가 부름) 중심 · 분배 = 액션 분배기 층 · 층 = 프롬프트 스튜디오(사용자 지시로 모든 기능의 프롬프트를 취합) — 분배·층은 판정 대상 아님. 기능 하나 = 모듈 하나(사용자 결정)이고 그 안에서 계층은 함수 단위로 가름(3절). `node tools/map.mjs --why <모듈>`로 근거

| 모듈 | 판정 | 함수 | 기능(함수 수) | 나눌·합칠·보낼 곳 |
|---|---|---|---|---|
| 0010-rules | 조각 | 5 | prog.json › avatar 3, chars.json › [].pos 1 | → 0260-new-game/ (prog.json › avatar 3/30) |
| 0015-prompt-studio/ | 층 | 156 | rels.json 25, prog.json › avatar 21, meta.json › spots 19 |  |
| 0020-ai-connect | 슈퍼 | 98 | 저장소 starfall-nai 34, chars.json › [].naiBlocks 17, chars.json › [].weapon 15 | 저장소 starfall-nai 34 → 여기 / chars.json › [].naiBlocks 17 → 여기 |
| 0030-image/ | 고유 | 110 | chars.json › [].weapon 62, 창 등장  11, 창 regenPreview 5 |  |
| 0040-sound | 슈퍼 | 26 | lib.json › [].prompt 12, 저장소 ggm-voice-ja 10, 저장소 starfall-nai 1 | lib.json › [].prompt 12 → 0520-backup-storage / 저장소 ggm-voice-ja 10 → 여기 |
| 0050-default-content | 기반 | 4 |  |  |
| 0060-util | 흩어짐 | 31 | prog.json › fchat 9, rels.json 3, prog.json › curBanner 2 | prog.json › fchat 9 → 0100-messenger / rels.json 3 → 0450-relations-memory / prog.json › curBanner 2 → 0500-gacha / chars.json › [].weapon 2 → 0030-image/ / chars.json › [].pos 1 → 0185-game-rules / prog.json › prepAsked 1 → 0370-game-picker / chars.json › [].cards 1 → 0080-storage-integration |
| 0065-inherit | 고유 | 11 | chars.json › [].over 9, chars.json › [].cards 1 |  |
| 0070-save | 흩어짐 | 18 | chars.json › [].voiceId 2, chapters.json › [].stages[].enemies[].atk 2, prog.json › avatar 2 | chars.json › [].voiceId 2 → 0360-sync/ / chapters.json › [].stages[].enemies[].atk 2 → 0125-tower / prog.json › avatar 2 → 0260-new-game/ / prog.json › rogue 1 → 0120-abyss / rels.json 1 → 0450-relations-memory |
| 0080-storage-integration | 슈퍼 | 40 | chars.json › [].cards 11, chars.json › [].voiceId 7, chars.json › [].weapon 6 | chars.json › [].cards 11 → 여기 / chars.json › [].voiceId 7 → 0360-sync/ |
| 0090-growth | 고유 | 36 | prog.json › gold 16, prog.json › fchat 5, prog.json › exped 2 |  |
| 0100-messenger | 고유 | 29 | prog.json › fchat 21, chars.json › [].weapon 2, rels.json 1 |  |
| 0110-challenge-raid | 조각 | 6 | chapters.json › [].stages[].enemies[].atk 3, prog.json › rogue 2, prog.json › gold 1 | → 0125-tower (chapters.json › [].stages[].enemies[].atk 3/6) |
| 0120-abyss | 고유 | 68 | prog.json › rogue 54, chars.json › [].cards 6, chars.json › [].pos 3 |  |
| 0125-tower | 고유 | 8 | chapters.json › [].stages[].enemies[].atk 6, prog.json › gold 2 |  |
| 0130-gift | 조각 | 8 | chapters.json › [].stages[].enemies[].atk 2, prog.json › gold 1, prog.json › curBanner 1 | → 0125-tower (chapters.json › [].stages[].enemies[].atk 2/6) |
| 0135-schedule | 조각 | 9 | meta.json › spots 5, chapters.json › [].stages[].enemies[].atk 1, prog.json › gold 1 | → 0300-codex (meta.json › spots 5/19) |
| 0140-pickup-new | 기반 | 1 |  |  |
| 0150-pickup-existing | 슈퍼 | 9 | prog.json › curBanner 5, prog.json › gold 3 | prog.json › curBanner 5 → 0500-gacha / prog.json › gold 3 → 0090-growth |
| 0160-free-chat | 슈퍼 | 14 | prog.json › fchat 7, prog.json › avatar 3, chars.json › [].weapon 1 | prog.json › fchat 7 → 0100-messenger / prog.json › avatar 3 → 0260-new-game/ |
| 0170-render | 조각 | 2 | prog.json › prepAsked 2 | → 0370-game-picker (prog.json › prepAsked 2/6) |
| 0180-ui-scroll | 흩어짐 | 39 | chars.json › [].cards 8, 설정 › 관리관 5, prog.json › rogue 5 | chars.json › [].cards 8 → 0080-storage-integration / 설정 › 관리관 5 → 여기 / prog.json › rogue 5 → 0120-abyss / 저장소 starfall-nai 5 → 0020-ai-connect / prog.json › curBanner 4 → 0500-gacha / prog.json › mail 1 → 0420-app-update / rels.json 1 → 0450-relations-memory / prog.json › exped 1 → 0275-expedition / prog.json › gold 1 → 0090-growth / lib.json › [].prompt 1 → 0520-backup-storage |
| 0185-game-rules | 고유 | 35 | chars.json › [].pos 31, prog.json › avatar 1, chars.json › [].persona 1 |  |
| 0187-balance | 조각 | 16 | chars.json › [].pos 15 | → 0185-game-rules (chars.json › [].pos 15/31) |
| 0190-shop | 슈퍼 | 19 | prog.json › gold 6, prog.json › cres 3, prog.json › avatar 2 | prog.json › gold 6 → 0090-growth / prog.json › cres 3 → 0505-construct |
| 0200-skin-shop | 조각 | 5 | prog.json › curBanner 4, chars.json › [].cards 1 | → 0500-gacha (prog.json › curBanner 4/14) |
| 0210-setup | 조각 | 8 | 저장소 starfall-nai 7, 설정 › 관리관 1 | → 0020-ai-connect (저장소 starfall-nai 7/34) |
| 0220-mail | 조각 | 10 | prog.json › mail 8, 창 우편함 2 | → 0420-app-update (prog.json › mail 8/17) |
| 0230-modal | 슈퍼 | 33 | chars.json › [].pos 8, chars.json › [].cards 7, meta.json › spots 3 | chars.json › [].pos 8 → 0185-game-rules / chars.json › [].cards 7 → 0080-storage-integration |
| 0240-growth-curve | 슈퍼 | 21 | chars.json › [].pos 6, chapters.json › [].stages[].enemies[].atk 4, chars.json › [].weapon 2 | chars.json › [].pos 6 → 0185-game-rules / chapters.json › [].stages[].enemies[].atk 4 → 0125-tower |
| 0250-story-factory | 고유 | 39 | rels.json 21, meta.json › spots 4, prog.json › curBanner 3 |  |
| 0260-new-game/ | 고유 | 49 | prog.json › avatar 30, 새 게임 생성 3, chars.json › [].weapon 2 |  |
| 0270-skin-proposal | 슈퍼 | 11 | chars.json › [].weapon 5, chars.json › [].cards 3, chars.json › [].pos 1 | chars.json › [].weapon 5 → 0030-image/ / chars.json › [].cards 3 → 0080-storage-integration |
| 0274-dispatch | 조각 | 7 | prog.json › exped 4, prog.json › prepAsked 2, prog.json › gold 1 | → 0275-expedition (prog.json › exped 4/28) |
| 0275-expedition | 고유 | 30 | prog.json › exped 28, prog.json › gold 1 |  |
| 0280-live-ops | 조각 | 7 | prog.json › curBanner 4, prog.json › rogue 1, lib.json › [].prompt 1 | → 0500-gacha (prog.json › curBanner 4/14) |
| 0290-season-rotation | 흩어짐 | 28 | prog.json › curBanner 13, prog.json › gold 3, rels.json 3 | prog.json › curBanner 13 → 0500-gacha / prog.json › gold 3 → 0090-growth / rels.json 3 → 0450-relations-memory / chars.json › [].cards 3 → 0080-storage-integration / chars.json › [].weapon 3 → 0030-image/ / prog.json › cres 1 → 0505-construct / prog.json › prepAsked 1 → 0370-game-picker |
| 0300-codex | 고유 | 20 | meta.json › spots 19, rels.json 1 |  |
| 0310-art-after-ai | 조각 | 4 | chars.json › [].weapon 3, rels.json 1 | → 0030-image/ (chars.json › [].weapon 3/62) |
| 0330-casting | 슈퍼 | 18 | rels.json 6, chars.json › [].weapon 5, chars.json › [].cards 2 | rels.json 6 → 0450-relations-memory / chars.json › [].weapon 5 → 0030-image/ |
| 0335-github-api | 조각 | 10 | chars.json › [].voiceId 10 | → 0360-sync/ (chars.json › [].voiceId 10/46) |
| 0360-sync/ | 고유 | 47 | chars.json › [].voiceId 46, 저장소 ggm-voice-ja 1 |  |
| 0370-game-picker | 고유 | 8 | prog.json › prepAsked 6, chars.json › [].cards 1, chars.json › [].weapon 1 |  |
| 0400-publish-subscribe | 조각 | 15 | chars.json › [].voiceId 8, 저장소 starfall-nai 2, chars.json › [].cards 2 | → 0360-sync/ (chars.json › [].voiceId 8/46) |
| 0410-desktop | 조각 | 6 | 저장소 starfall-nai 3, 설정 › 화면·연출 › 아이폰·웹 연결 2, chars.json › [].voiceId 1 | → 0020-ai-connect (저장소 starfall-nai 3/34) |
| 0420-app-update | 고유 | 25 | prog.json › mail 17, chars.json › [].voiceId 2, prog.json › curBanner 1 |  |
| 0440-ai-context | 조각 | 5 | rels.json 2, prog.json › curBanner 1, prog.json › avatar 1 | → 0450-relations-memory (rels.json 2/23) |
| 0445-factions | 고유 | 25 | world.json › factions[].stance 19, rels.json 2, prog.json › avatar 2 |  |
| 0450-relations-memory | 고유 | 24 | rels.json 23, prog.json › rogue 1 |  |
| 0455-persona | 슈퍼 | 21 | chars.json › [].persona 12, prog.json › fchat 7, rels.json 1 | chars.json › [].persona 12 → 0535-content-audit / prog.json › fchat 7 → 0100-messenger |
| 0460-script-engine | 슈퍼 | 17 | rels.json 7, 저장소 ggm-voice-ja 7, prog.json › fchat 1 | rels.json 7 → 0450-relations-memory / 저장소 ggm-voice-ja 7 → 0040-sound |
| 0462-direction | 슈퍼 | 18 | 로비 6, prog.json › fchat 4, rels.json 3 | 로비 6 → 여기 / prog.json › fchat 4 → 0100-messenger |
| 0465-story-plan | 조각 | 11 | rels.json 9, meta.json › spots 1 | → 0450-relations-memory (rels.json 9/23) |
| 0470-title-opening | 고유 | 10 | 설정 › 화면·연출 › 연출 4, prog.json › avatar 1, chars.json › [].cards 1 |  |
| 0480-battle | 조각 | 16 | prog.json › gold 8, chapters.json › [].stages[].enemies[].atk 1, meta.json › spots 1 | → 0090-growth (prog.json › gold 8/16) |
| 0485-battle-rules | 슈퍼 | 11 | chapters.json › [].stages[].enemies[].atk 5, prog.json › gold 3, chars.json › [].pos 2 | chapters.json › [].stages[].enemies[].atk 5 → 0125-tower / prog.json › gold 3 → 0090-growth |
| 0487-formation-sortie | 슈퍼 | 21 | prog.json › gold 12, chars.json › [].pos 5, chapters.json › [].stages[].enemies[].atk 3 | prog.json › gold 12 → 0090-growth / chars.json › [].pos 5 → 0185-game-rules |
| 0488-stage-modes | 슈퍼 | 17 | prog.json › gold 7, rels.json 5, chars.json › [].pos 2 | prog.json › gold 7 → 0090-growth / rels.json 5 → 0450-relations-memory |
| 0490-boss-patterns | 조각 | 6 | prog.json › gold 4, 도전 2 | → 0090-growth (prog.json › gold 4/16) |
| 0500-gacha | 고유 | 22 | prog.json › curBanner 14, world.json › factions[].stance 2, lib.json › [].prompt 1 |  |
| 0505-construct | 고유 | 30 | prog.json › cres 25, prog.json › avatar 1, chars.json › [].persona 1 |  |
| 0510-actions/ | 분배 | 14 | chars.json › [].weapon 4, 저장소 starfall-nai 2, prog.json › mail 2 |  |
| 0520-backup-storage | 고유 | 26 | lib.json › [].prompt 17, 저장소 starfall-nai 3, chars.json › [].voiceId 2 |  |
| 0525-data-folder | 조각 | 12 | lib.json › [].prompt 7, chars.json › [].voiceId 1, 저장소 starfall-nai 1 | → 0520-backup-storage (lib.json › [].prompt 7/17) |
| 0530-story-memory | 슈퍼 | 15 | 저장소 ggm-voice-ja 4, rels.json 3, 저장소 starfall-nai 2 | 저장소 ggm-voice-ja 4 → 0040-sound / rels.json 3 → 0450-relations-memory |
| 0535-content-audit | 고유 | 18 | chars.json › [].persona 17 |  |
| 0537-live-fill | 조각 | 4 | prog.json › curBanner 3, chars.json › [].persona 1 | → 0500-gacha (prog.json › curBanner 3/14) |
| 0550-standalone-app | 조각 | 4 | lib.json › [].prompt 3, chars.json › [].cards 1 | → 0520-backup-storage (lib.json › [].prompt 3/17) |
| 0565-asset-library | 고유 | 14 | lib.json › [].prompt 11, chars.json › [].voiceId 1, meta.json › spots 1 |  |

## 5. 저장 정책 — 브라우저 저장소 키 갈래

사용자 지시: 브라우저 저장소는 캐시, 원본은 PC 서버의 파일(게임은 data/, 그 밖의 설정은 ggm-data/state.json) — 자동 동기화. 갈래는 앱의 저장 정책 표 STORE_POLICY(src/main/0360-sync/010-common.js) — 보내는 목록·받는 허용 목록이 이 표를 따름. 키 37 · 갈래 없음 0(위반 — 표에 정해야 함) · 표에만 있고 코드가 안 씀 0

| 키 | 갈래 | 쓰기 | 쓰는 함수 |
|---|---|---|---|
| ggm-a2hs | 기기 | 씀 | main, openA2HS |
| ggm-ailog | 캐시 | 씀 | aiLog, handleNavigationAndToolsAction, main |
| ggm-backup-staging | 세션(한 번) | 씀 | backupImport |
| ggm-bkdest | 기기 | 씀 | bkDest, shareExport |
| ggm-bootpull | 세션(한 번) | 씀 | bootPullOk |
| ggm-desk | 기기 | 씀 | applyDesk, deskMode, main |
| ggm-devid | 기기 | 씀 | devId |
| ggm-draft2 | 동기화 | 씀 | drLoad, drLoadFrom, drSave, handleStoryAndAuthoringAction |
| ggm-drafts | 동기화 | 씀 | drLib, drLibSave |
| ggm-llmslot | 동기화 | 씀 | llmSlots, saveLlm |
| ggm-ng-draft | 기기 | 씀 | buildNewGameDraft |
| ggm-orient | 기기 | 씀 | main, orientPref |
| ggm-packs | 동기화 | 씀 | saveUserPacks, userPacks |
| ggm-pc | 기기 | 씀 | PCS, setPCS |
| ggm-picked | 세션(한 번) | 씀 | handleSetupAction, handleStorageAndSharingAction, showStart, switchProject |
| ggm-play | 기기 | 씀 | handleSettingsAndAudioAction, playMode |
| ggm-plessons | 동기화 | 씀 | plList, plSave |
| ggm-proxy | 기기 | 씀 | handleSettingsAndAudioAction, webProxy |
| ggm-proxy-off | 기기 | 씀 | handleStorageAndSharingAction, proxyOff |
| ggm-pthumb | 캐시 | 씀 | handleNavigationAndToolsAction, main, pthumbs |
| ggm-pub | 비밀(PC 서버에만) | 씀 | PUB, savePUB |
| ggm-shared-assets | 동기화 | 씀 | shList, shSave |
| ggm-start | 기기 | 씀 | handleStorageAndSharingAction, startMode |
| ggm-sync | 비밀(PC 서버에만) | 씀 | SY, handleStorageAndSharingAction, saveSY |
| ggm-sync-hold | 기기 | 씀 | lsApply, lsHoldMerge |
| ggm-sync-idx | 기기 | 씀 | idbPut, saveSyIdx, syIdx |
| ggm-upd-notes | 캐시 | 씀 | applyUpdate, mailTick |
| ggm-voice-ja | 캐시 | 씀 | jaBatch, jaMap, toJa |
| starfall-ai | 예전 키(옮기기만) | 읽기만 | AIP |
| starfall-ai-profiles | 비밀(PC 서버에만) | 씀 | AIP, saveAIP |
| starfall-live | 캐시 | 씀 | LV, boot:boot/head.js, boot:boot/storage-boot.js, saveLV |
| starfall-live-html | 캐시 | 읽기만 | boot:boot/head.js |
| starfall-nai | 비밀(PC 서버에만) | 씀 | handleImagesAndAssetsAction, handleNavigationAndToolsAction, naiCfg, naiSaved, packApply … |
| starfall-nai-tperr | 캐시 | 씀 | naiGenerate, openNaiSet |
| starfall-projects | 게임 저장 | 씀 | PJ, handleSetupAction, handleStorageAndSharingAction, handleStoryAndAuthoringAction |
| starfall-setup-done | 동기화 | 씀 | handleSetupAction, handleStorageAndSharingAction, needSetup |
| starfall-sound | 비밀(PC 서버에만) | 씀 | SND, handleSettingsAndAudioAction, handleSetupAction, swSave |

## 6. 모듈 → index.html 줄 · 역할 · 쓰는 데이터 · 연계 모듈

| 모듈 | index.html 줄 | 함수 | 역할(쓰기 수) | 쓰는 data | 연계 모듈(호출 수) |
|---|---|---|---|---|---|
| src/boot/durable-storage | 4566~4613 | 3 |  |  |  |
| src/boot/head | 6~23 | 1 |  |  |  |
| src/boot/storage-boot | 15077~15111 | 4 |  |  |  |
| 0010-rules | 4616~4658 | 5 |  |  | 0185-game-rules 2, 0060-util 1, 0230-modal 1 |
| 0015-prompt-studio/ | 4659~5033, 5034~5172, 5173~5374 | 156 | 편집기 1 | meta.json › prompts | 0010-rules 45, 0020-ai-connect 18, 0070-save 12, 0450-relations-memory 10, 0060-util 8 |
| 0020-ai-connect | 5375~5961 | 98 | 생성기 1 · 실행기 2 | chars.json › [].naiBlocks, prog.json › avatar | 0060-util 21, 0535-content-audit 13, 0070-save 10, 0230-modal 6, 0015-prompt-studio/ 5 |
| 0030-image/ | 5962~6853, 6854~6972 | 110 | 편집기 25 · 생성기 1 · 실행기 1 | chars.json › [].faceMask, chars.json › [].faction, chars.json › [].naiBlocks, chars.json › [].naiPrompt, chars.json › [].name, chars.json › [].skillBalance …외 19 | 0020-ai-connect 77, 0060-util 72, 0230-modal 36, 0080-storage-integration 24, 0070-save 17 |
| 0040-sound | 6973~7082 | 26 | 편집기 2 | lib.json › [].audio, lib.json › [].prompt | 0020-ai-connect 8, 0060-util 8, 0080-storage-integration 7, 0070-save 3, 0230-modal 3 |
| 0050-default-content | 7083~7550 | 4 |  |  |  |
| 0060-util | 7551~7615 | 31 |  |  | 0090-growth 7, 0070-save 5, 0080-storage-integration 4, 0010-rules 3, 0040-sound 3 |
| 0065-inherit | 7616~7657 | 11 | 실행기 2 · 편집기 2 | chars.json › [].over, chars.json › [].skillBalance | 0070-save 1, 0060-util 1 |
| 0070-save | 7658~7820 | 23 | 실행기 44 | banners.json › [].pickup, banners.json › [].pool, banners.json › [].rate, chapters.json › [].kind, chapters.json › [].stages[].post, chapters.json › [].stages[].pre …외 36 | 0060-util 6, 0020-ai-connect 3, 0065-inherit 2, 0090-growth 2, 0110-challenge-raid 1 |
| 0080-storage-integration | 7821~8003 | 40 | 실행기 3 · 편집기 3 | lib.json › [].img, lib.json › [].redraw, lib.json › [].seed | 0070-save 11, 0060-util 9, 0180-ui-scroll 2, 0535-content-audit 1, 0470-title-opening 1 |
| 0090-growth | 8004~8110 | 36 | 실행기 7 | prog.json › cres, prog.json › dm, prog.json › gems, prog.json › gold, prog.json › stam | 0070-save 32, 0060-util 15, 0010-rules 6, 0040-sound 5, 0230-modal 4 |
| 0100-messenger | 8111~8220 | 29 | 실행기 3 | prog.json › fchat | 0060-util 32, 0070-save 16, 0080-storage-integration 10, 0090-growth 4, 0010-rules 4 |
| 0110-challenge-raid | 8221~8240 | 6 | 실행기 2 | prog.json › raid | 0070-save 7, 0090-growth 5, 0240-growth-curve 2, 0060-util 2, 0280-live-ops 1 |
| 0120-abyss | 8241~8694 | 69 | 실행기 8 · 기타 1 | chars.json › [].cards, prog.json › rogue | 0060-util 47, 0070-save 27, 0080-storage-integration 14, 0090-growth 12, 0230-modal 11 |
| 0125-tower | 8695~8724 | 8 | 실행기 1 | prog.json › tower | 0090-growth 8, 0070-save 4, 0060-util 3, 0485-battle-rules 2, 0010-rules 2 |
| 0130-gift | 8725~8769 | 8 | 실행기 2 | prog.json › curBanner, prog.json › gifts | 0070-save 6, 0090-growth 3, 0060-util 2, 0230-modal 2, 0110-challenge-raid 1 |
| 0135-schedule | 8770~8805 | 9 | 생성기 2 · 실행기 3 | meta.json › spots, prog.json › sched | 0060-util 7, 0070-save 7, 0090-growth 6, 0020-ai-connect 2, 0015-prompt-studio/ 2 |
| 0140-pickup-new | 8806~8825 | 1 |  |  | 0230-modal 3, 0060-util 1, 0010-rules 1 |
| 0150-pickup-existing | 8826~8872 | 9 | 실행기 19 | banners.json, banners.json › [].active, banners.json › [].alt, banners.json › [].bg, banners.json › [].collab, banners.json › [].desc …외 11 | 0060-util 14, 0070-save 10, 0230-modal 6, 0010-rules 4, 0290-season-rotation 3 |
| 0160-free-chat | 8873~8978 | 14 | 실행기 10 | prog.json › avatar, prog.json › bio, prog.json › fcAff, prog.json › fchat, prog.json › gender, prog.json › genderTxt …외 3 | 0060-util 20, 0070-save 17, 0100-messenger 15, 0020-ai-connect 8, 0080-storage-integration 7 |
| 0170-render | 8979~8987 | 2 |  |  |  |
| 0180-ui-scroll | 8988~9429 | 39 | 생성기 1 · 실행기 2 · 기타 1 | chars.json › [].scg, prog.json › farmV, prog.json › rogue | 0060-util 39, 0080-storage-integration 29, 0070-save 22, 0090-growth 16, 0010-rules 12 |
| 0185-game-rules | 9430~9580 | 35 | 편집기 9 · 생성기 6 · 실행기 6 | chapters.json › [].stages[].enemies[].elem, chars.json › [].atk, chars.json › [].def, chars.json › [].hp, chars.json › [].pos, chars.json › [].role …외 5 | 0060-util 12, 0070-save 6, 0010-rules 3, 0020-ai-connect 3, 0015-prompt-studio/ 3 |
| 0187-balance | 9581~9638 | 16 | 생성기 6 · 실행기 12 · 편집기 8 | chars.json › [].atk, chars.json › [].def, chars.json › [].generation, chars.json › [].hp, chars.json › [].skillBalance, chars.json › [].skillDesignLog …외 3 | 0060-util 7, 0070-save 3, 0230-modal 2, 0010-rules 1, 0185-game-rules 1 |
| 0190-shop | 9639~9735 | 19 | 실행기 2 | prog.json › gems, prog.json › gold | 0060-util 12, 0070-save 9, 0080-storage-integration 6, 0010-rules 5, 0090-growth 4 |
| 0200-skin-shop | 9736~9764 | 5 |  |  | 0070-save 7, 0060-util 6, 0020-ai-connect 4, 0080-storage-integration 4, 0030-image/ 3 |
| 0210-setup | 9765~9835 | 8 |  |  | 0020-ai-connect 13, 0030-image/ 5, 0060-util 5, 0180-ui-scroll 4, 0040-sound 2 |
| 0220-mail | 9836~9862 | 10 | 실행기 4 | prog.json › mail, prog.json › mailBuild, prog.json › mailInit | 0070-save 13, 0060-util 2, 0090-growth 2, 0230-modal 2, 0010-rules 1 |
| 0230-modal | 9863~10135 | 33 | 편집기 25 | banners.json › [].name, chars.json › [].affLines, chars.json › [].atk, chars.json › [].baseStatsVersion, chars.json › [].def, chars.json › [].dupLines …외 19 | 0060-util 23, 0080-storage-integration 11, 0090-growth 10, 0010-rules 9, 0070-save 6 |
| 0240-growth-curve | 10136~10334 | 21 | 편집기 11 · 실행기 4 | chapters.json › [].stages[].combatBalance, chapters.json › [].stages[].enemies, chapters.json › [].stages[].enemies[].atk, chapters.json › [].stages[].enemies[].def, chapters.json › [].stages[].enemies[].hp, chapters.json › [].stages[].enemies[].spd …외 5 | 0230-modal 27, 0060-util 17, 0080-storage-integration 7, 0090-growth 6, 0010-rules 5 |
| 0250-story-factory | 10335~10560 | 39 | 편집기 38 · 실행기 33 · 생성기 9 | banners.json › [].active, banners.json › [].bg, banners.json › [].desc, banners.json › [].name, banners.json › [].pickup, banners.json › [].pool …외 40 | 0060-util 32, 0070-save 21, 0450-relations-memory 17, 0230-modal 13, 0015-prompt-studio/ 10 |
| 0260-new-game/ | 10561~10725, 10726~10916 | 49 | 생성기 117 · 편집기 1 | banners.json, chapters.json, chapters.json › [].stages[].enemies, chapters.json › [].stages[].post, chapters.json › [].stages[].pre, chapters.json › [].stages[].route …외 70 | 0060-util 37, 0015-prompt-studio/ 20, 0070-save 15, 0020-ai-connect 14, 0080-storage-integration 10 |
| 0270-skin-proposal | 10917~10982 | 11 |  |  | 0060-util 16, 0030-image/ 15, 0080-storage-integration 10, 0230-modal 7, 0010-rules 6 |
| 0274-dispatch | 10983~11025 | 7 | 실행기 2 | prog.json › dboard, prog.json › disp | 0070-save 7, 0060-util 7, 0090-growth 7, 0010-rules 2, 0080-storage-integration 2 |
| 0275-expedition | 11026~11114 | 30 | 실행기 10 · 편집기 1 | meta.json › expedition, prog.json › exped | 0070-save 38, 0060-util 20, 0090-growth 9, 0180-ui-scroll 6, 0010-rules 3 |
| 0280-live-ops | 11115~11151 | 7 | 실행기 5 | banners.json › [].bg, banners.json › [].desc, banners.json › [].name, banners.json › [].pickup, threads.json | 0070-save 7, 0060-util 6, 0220-mail 1, 0180-ui-scroll 1, 0090-growth 1 |
| 0290-season-rotation | 11152~11332 | 28 | 실행기 23 · 편집기 13 · 기타 1 | banners.json, banners.json › [].active, banners.json › [].bg, banners.json › [].desc, banners.json › [].eventId, chars.json › [].age …외 13 | 0070-save 26, 0060-util 22, 0250-story-factory 9, 0280-live-ops 8, 0180-ui-scroll 8 |
| 0300-codex | 11333~11421 | 20 | 기타 2 · 실행기 3 · 편집기 2 | prog.json › cxBadge, prog.json › cxSeen, world.json › codex, world.json › codexNotes | 0070-save 21, 0060-util 6, 0080-storage-integration 5, 0090-growth 5, 0230-modal 4 |
| 0310-art-after-ai | 11422~11442 | 4 |  |  | 0290-season-rotation 2, 0030-image/ 1, 0020-ai-connect 1, 0060-util 1 |
| 0330-casting | 11443~11531 | 18 | 실행기 4 · 편집기 4 | npcs.json, npcs.json › [].look, npcs.json › [].naiPrompt, npcs.json › [].role | 0060-util 18, 0030-image/ 12, 0080-storage-integration 10, 0070-save 6, 0230-modal 6 |
| 0335-github-api | 11532~11574 | 10 |  |  | 0535-content-audit 3, 0360-sync/ 3, 0020-ai-connect 2, 0060-util 2, 0400-publish-subscribe 1 |
| 0360-sync/ | 11575~11615, 11616~11692, 11693~11772, 11773~11823, 11824~11886 | 47 |  |  | 0060-util 33, 0070-save 23, 0020-ai-connect 17, 0230-modal 14, 0335-github-api 9 |
| 0370-game-picker | 11887~11928 | 8 | 실행기 3 | meta.json › artTags, prog.json › bootPrep, prog.json › prepAsked | 0070-save 8, 0060-util 7, 0080-storage-integration 3, 0290-season-rotation 3, 0330-casting 2 |
| 0400-publish-subscribe | 11932~12039 | 15 | 편집기 4 | chars.json › [].voiceId, chars.json › [].voiceName, lib.json › [].live, meta.json › pub | 0070-save 14, 0060-util 12, 0230-modal 9, 0080-storage-integration 7, 0360-sync/ 7 |
| 0410-desktop | 12040~12084 | 6 |  |  | 0060-util 4, 0230-modal 4, 0020-ai-connect 2, 0070-save 1, 0080-storage-integration 1 |
| 0420-app-update | 12085~12259 | 25 |  |  | 0060-util 19, 0230-modal 18, 0070-save 13, 0020-ai-connect 5, 0360-sync/ 4 |
| 0440-ai-context | 12260~12275 | 5 |  |  | 0060-util 2, 0488-stage-modes 1, 0230-modal 1, 0010-rules 1 |
| 0445-factions | 12276~12384 | 25 | 편집기 9 · 실행기 11 · 생성기 8 | chars.json › [].debut, chars.json › [].debutLater, chars.json › [].faction, meta.json › bestiary, meta.json › cast, world.json › factions …외 4 | 0070-save 9, 0535-content-audit 5, 0060-util 4, 0090-growth 3, 0230-modal 3 |
| 0450-relations-memory | 12385~12454 | 24 | 생성기 2 · 실행기 3 · 편집기 1 | chapters.json › [].relScan, meta.json › relProf, rels.json | 0060-util 12, 0070-save 8, 0290-season-rotation 4, 0230-modal 4, 0010-rules 3 |
| 0455-persona | 12455~12568 | 21 | 실행기 4 · 편집기 7 | chars.json › [].affLines, chars.json › [].lines, chars.json › [].persona, chars.json › [].pfields, meta.json › persona | 0060-util 16, 0070-save 9, 0230-modal 6, 0015-prompt-studio/ 5, 0020-ai-connect 4 |
| 0460-script-engine | 12569~12677 | 17 |  |  | 0060-util 20, 0040-sound 13, 0080-storage-integration 4, 0535-content-audit 3, 0462-direction 3 |
| 0462-direction | 12678~12740 | 18 |  |  | 0060-util 6, 0535-content-audit 5, 0460-script-engine 3, 0080-storage-integration 2, 0070-save 2 |
| 0465-story-plan | 12741~12801 | 11 | 실행기 3 · 편집기 2 | prog.json › flags, world.json › plan | 0070-save 5, 0060-util 3, 0230-modal 2, 0020-ai-connect 1, 0015-prompt-studio/ 1 |
| 0470-title-opening | 12802~12855 | 10 | 기타 1 | prog.json › seenOpening | 0060-util 14, 0070-save 4, 0080-storage-integration 4, 0180-ui-scroll 3, 0040-sound 3 |
| 0480-battle | 12856~12976 | 16 | 실행기 1 | prog.json › stars | 0090-growth 14, 0060-util 14, 0080-storage-integration 10, 0070-save 9, 0010-rules 4 |
| 0485-battle-rules | 12977~13019 | 15 | 생성기 3 · 실행기 3 | chapters.json › [].stages[].field, chapters.json › [].stages[].goal, chapters.json › [].stages[].rulesV | 0120-abyss 2, 0060-util 2, 0110-challenge-raid 1, 0480-battle 1 |
| 0487-formation-sortie | 13020~13087 | 21 | 실행기 4 | prog.json › sortie | 0070-save 10, 0090-growth 10, 0060-util 4, 0230-modal 3, 0185-game-rules 1 |
| 0488-stage-modes | 13088~13174 | 17 | 실행기 1 | prog.json › stars | 0230-modal 9, 0060-util 9, 0090-growth 7, 0070-save 5, 0460-script-engine 5 |
| 0490-boss-patterns | 13175~13196 | 6 |  |  | 0290-season-rotation 1, 0230-modal 1 |
| 0500-gacha | 13197~13326 | 22 | 실행기 12 | banners.json › [].newAt, prog.json › firstTen, prog.json › gateSeen, prog.json › guar, prog.json › hist2, prog.json › history …외 4 | 0070-save 19, 0060-util 14, 0040-sound 6, 0010-rules 5, 0080-storage-integration 5 |
| 0505-construct | 13327~13481 | 30 | 실행기 21 · 생성기 3 | chars.json › [].age, chars.json › [].alt, chars.json › [].altCanon, chars.json › [].cvar, chars.json › [].faction, chars.json › [].naiPrompt …외 12 | 0060-util 26, 0070-save 19, 0010-rules 11, 0230-modal 5, 0190-shop 4 |
| 0510-actions/ | 13482~13514, 13515~13699, 13700~13712, 13713~13879, 13880~13962, 13963~14028, 14029~14089, 14090~14110, 14111~14157, 14158~14324, 14325~14366, 14367~14409, 14410~14439 | 14 | 편집기 70 · 실행기 32 | banners.json, banners.json › [].desc, banners.json › [].id, banners.json › [].name, banners.json › [].pickup, banners.json › [].textContent …외 87 | 0060-util 94, 0030-image/ 73, 0020-ai-connect 73, 0090-growth 51, 0070-save 48 |
| 0520-backup-storage | 14440~14618 | 26 | 편집기 4 | chars.json › [].voiceId, chars.json › [].voiceName | 0080-storage-integration 12, 0230-modal 10, 0070-save 10, 0060-util 10, 0360-sync/ 4 |
| 0525-data-folder | 14619~14705 | 12 |  |  | 0070-save 8, 0060-util 5, 0520-backup-storage 3, 0360-sync/ 3, 0080-storage-integration 3 |
| 0530-story-memory | 14706~14748 | 15 | 편집기 1 | meta.json › storyMemory | 0230-modal 8, 0070-save 7, 0060-util 6, 0015-prompt-studio/ 4, 0450-relations-memory 2 |
| 0535-content-audit | 14749~14882 | 21 | 편집기 1 | meta.json › auditSeen | 0020-ai-connect 10, 0060-util 9, 0445-factions 8, 0070-save 7, 0185-game-rules 7 |
| 0537-live-fill | 14883~14902 | 4 |  |  | 0280-live-ops 3, 0060-util 3, 0170-render 1, 0535-content-audit 1, 0090-growth 1 |
| 0550-standalone-app | 14910~14956 | 4 |  |  | 0060-util 3, 0535-content-audit 1, 0070-save 1, 0030-image/ 1, 0080-storage-integration 1 |
| 0565-asset-library | 14957~15010 | 14 | 실행기 3 · 편집기 3 | lib.json › [].alias, lib.json › [].prompt, lib.json › [].shared | 0080-storage-integration 6, 0070-save 4, 0060-util 3, 0230-modal 2, 0040-sound 1 |
| app/010-confirm | 2074~2091 | 1 |  |  |  |
| app/020-construct | 2094~2208 | 18 |  |  |  |
| app/030-expedition | 2211~2278 | 14 |  |  |  |
| combat/010-catalog | 2282~2292 | 3 |  |  |  |
| combat/020-visual-catalog | 2295~2379 | 3 |  |  |  |
| combat/030-core | 2382~3310 | 128 | 기타 7 · 실행기 6 · 편집기 4 | chars.json › [].baseStatsMigration, chars.json › [].baseStatsVersion, chars.json › [].def, chars.json › [].hp, chars.json › [].skillBalance, lib.json › [].cooldown …외 4 |  |
| combat/040-effects | 3313~3766 | 49 |  |  | 0480-battle 8, 0070-save 1 |
| combat/050-bridge | 3769~4140 | 67 | 실행기 22 · 편집기 14 · 생성기 17 | chapters.json › [].stages[].combatBalance, chapters.json › [].stages[].enemies, chars.json › [].generation, chars.json › [].roleSpeedOriginal, chars.json › [].roleSpeedRole, chars.json › [].roleSpeedVersion …외 12 | 0060-util 28, 0070-save 5, 0480-battle 5, 0080-storage-integration 4, 0030-image/ 4 |
| combat/060-generation | 4143~4365 | 29 |  |  | 0015-prompt-studio/ 4, 0020-ai-connect 3, 0060-util 2 |
| combat/070-equipment | 4368~4479 | 18 | 편집기 2 · 생성기 1 · 실행기 1 | chars.json › [].skillRevisions, chars.json › [].weapon | 0060-util 8, 0070-save 3, 0230-modal 3, 0170-render 2, 0080-storage-integration 1 |
| combat/080-training | 4482~4506 | 9 |  |  | 0060-util 9, 0090-growth 5, 0070-save 3, 0230-modal 3, 0010-rules 1 |
| combat/090-practice | 4509~4562 | 9 |  |  | 0060-util 6, 0230-modal 3, 0460-script-engine 2, 0070-save 1, 0090-growth 1 |

## 7. 최근 변화(증분 갱신 기록)

- 2026-11-04T02:01 · git b36fbca
- 2026-11-04T01:56 · git b36fbca · src 1: 0505-construct · index.html 다시 빌드
  - meta.json › construct: +실행기:conSave −실행기:conMeta −편집기:conMeta
  - meta.json › variants:  −실행기:VARIANTS −편집기:VARIANTS
- 2026-11-04T01:55 · git b36fbca
- 2026-11-04T01:54 · git b36fbca · src 4: 0070-save, 0274-dispatch, 0275-expedition, 0300-codex · index.html 다시 빌드
  - 함수: 추가 1 (expedFill) · 삭제 0 · 옮김 0
  - prog.json › cxSeen:  −기타:cxNewFast
  - prog.json › dboard:  −실행기:dispList
  - prog.json › exped:  −실행기:exBizOf −실행기:exBizState −실행기:exCond −실행기:exJobOf −기타:exStatus
- 2026-11-04T01:43 · git b36fbca · src 1: 0125-tower · index.html 다시 빌드
  - chars.json › [].cards: +실행기:drawCardArts −편집기:drawCardArts
  - prog.json › avatar: +실행기:handleNavigationAndToolsAction +실행기:naiBlocksOwner +실행기:readPlayerForm
  - prog.json › cxSeen: +기타:cxNewFast +실행기:handleStoryAndAuthoringAction
  - prog.json › dboard: +실행기:dispList
  - prog.json › exped: +실행기:exBizOf +실행기:exBizSettle +실행기:exBizState +실행기:exBusyIds +실행기:exCond +실행기:exJobOf +기타:exStatus
  - prog.json › fchat: +실행기:phRooms +실행기:roomItems
  - prog.json › rogue: +실행기:drawCardArts +실행기:handleNavigationAndToolsAction +실행기:rgBattle +실행기:rgNode +실행기:rogueEnd
- 2026-11-04T01:32 · git b36fbca
- 2026-11-04T01:31 · git b36fbca
- 2026-11-04T01:30 · git b36fbca
