# 연관 맵 — 모듈 → 빌드 → index.html(생성기·실행기·편집기) → data 게임 파일

생성: `node tools/map.mjs` · 2026-11-03T23:43 · git fa20988 · 입력: src 128파일 · www/index.html b8465c88e814 · 시험 게임 2 — 입력이 바뀌면 다시 만들고 바뀐 연결은 맨 아래 "최근 변화"에(증분 갱신, CI `--check`가 맵이 낡았는지 봄)

## 읽는 법 — 거꾸로 따라가기

index.html은 **생성기**(새 게임을 만듦)·**실행기**(만든 게임을 구동 — 플레이·실행 중 AI·예전 게임 불러오기)·**편집기**(만든 게임의 내용을 고치고 업데이트 — 편집 화면·콘텐츠 점검·AI 추가 지시)를 겸합니다(CLAUDE.md §0). 게임 data(`data/<게임id>/<종류>.json`)의 어떤 경로가 이상하면:

1. 아래 1절에서 그 파일·경로를 찾아 **누가 만들고 고치나**(역할별 함수<sub>모듈</sub>)를 봄 — 시나리오면 `chapters.json`, 캐릭터 밸런스·스킬·이격이면 `chars.json`(`[].skills`·`[].hp`·`[].alt`·`[].over` …)
2. `node tools/map.mjs --why <경로·함수·말>` — 함수마다 src 파일:줄 · index.html 줄 · 쓰는 프롬프트 조각, 그 경로의 점검 규칙·읽는 모듈·연계 모듈까지 한 번에
3. 2절에서 그 모듈의 index.html 줄 범위·쓰는 데이터·연계 모듈(호출 수)을 보고, 고친 뒤 `node tools/map.mjs`로 맵을 갱신

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
| [].cards |  |  | drawCardArts<sub>0120-abyss</sub> |  |  |  | 0/2 |
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
| construct | conStartNew<sub>0505-construct</sub> | conMeta<sub>0505-construct</sub> | conMeta<sub>0505-construct</sub> |  |  |  | 0/2 |
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
| variants | ngWorldExtras<sub>0260-new-game/</sub> | VARIANTS<sub>0505-construct</sub> conSave<sub>0505-construct</sub> | VARIANTS<sub>0505-construct</sub> |  |  |  | 0/2 |

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
| avatar | artReuse<sub>0260-new-game/</sub> buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> | avatarObj<sub>0160-free-chat</sub> playerDraw<sub>0160-free-chat</sub> |  |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 33 | 0/2 |
| bio | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> | readPlayerForm<sub>0160-free-chat</sub> |  |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 33 | 0/2 |
| bootPrep |  | bpRead<sub>0370-game-picker</sub> handleNavigationAndToolsAction<sub>0510-actions/</sub> |  |  |  | BGM_PROMPT CG_ART CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE …외 9 | 0/2 |
| castDone | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> | handleImagesAndAssetsAction<sub>0510-actions/</sub> |  |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 35 | 0/2 |
| cbuild | conStartNew<sub>0505-construct</sub> | CBUILD<sub>0505-construct</sub> conBuild<sub>0505-construct</sub> conSave<sub>0505-construct</sub> |  |  |  |  | 0/2 |
| cres | conStartNew<sub>0505-construct</sub> | CRES<sub>0505-construct</sub> conBuild<sub>0505-construct</sub> conBuy<sub>0505-construct</sub> conSave<sub>0505-construct</sub> …외 1 |  |  |  |  | 0/2 |
| csFull |  | handleCharactersAction<sub>0510-actions/</sub> |  |  |  | CHAR_LINES CHAR_LINES_MORE CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE …외 6 | 0/2 |
| curBanner |  | addPickupFor<sub>0150-pickup-existing</sub> aiPickupStory<sub>0290-season-rotation</sub> bannerStep<sub>0130-gift</sub> handleEconomyAction<sub>0510-actions/</sub> …외 4 |  |  |  | BGM_PROMPT CG_ART CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE …외 10 | 0/2 |
| curEvent |  | aiEvent<sub>0250-story-factory</sub> handleStoryAndAuthoringAction<sub>0510-actions/</sub> |  |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 13 | 0/2 |
| cxBadge |  |  |  | codexHTML<sub>0300-codex</sub> |  |  | 0/2 |
| cxSeen |  | cxSeenSet<sub>0300-codex</sub> openCx<sub>0300-codex</sub> |  | cxNew<sub>0300-codex</sub> |  |  | 0/2 |
| dboard |  | DBOARD<sub>0274-dispatch</sub> dispClaim<sub>0274-dispatch</sub> handleStoryAndAuthoringAction<sub>0510-actions/</sub> |  |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 13 | 0/2 |
| disp |  | dispEndAll<sub>0274-dispatch</sub> |  |  |  |  | 0/2 |
| dm |  | bump<sub>0090-growth</sub> dm<sub>0090-growth</sub> handleNavigationAndToolsAction<sub>0510-actions/</sub> |  |  |  | BGM_PROMPT CG_ART CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE …외 9 | 2/2 |
| exped |  | EXS<sub>0275-expedition</sub> exClaim<sub>0275-expedition</sub> exLibSettle<sub>0275-expedition</sub> exOffers<sub>0275-expedition</sub> …외 3 |  |  |  |  | 0/2 |
| farmV |  |  |  | farmHTML<sub>0180-ui-scroll</sub> |  |  | 0/2 |
| fcAff |  | fcSend<sub>0160-free-chat</sub> |  |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 7 | 0/2 |
| fchat |  | FC<sub>0160-free-chat</sub> fcOf<sub>0160-free-chat</sub> handleMessengerAction<sub>0510-actions/</sub> |  |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 2 | 0/2 |
| fcPhoto |  | handleMessengerAction<sub>0510-actions/</sub> |  |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 2 | 0/2 |
| firstTen |  | pull<sub>0500-gacha</sub> |  |  |  |  | 2/2 |
| flags |  | storyFlag<sub>0465-story-plan</sub> |  |  |  |  | 0/2 |
| gateSeen |  | gateCheck<sub>0500-gacha</sub> |  |  |  |  | 0/2 |
| gems |  | giveReward<sub>0090-growth</sub> pay<sub>0190-shop</sub> |  |  |  |  | 2/2 |
| gender | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> | readPlayerForm<sub>0160-free-chat</sub> |  |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 33 | 0/2 |
| genderTxt | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> | readPlayerForm<sub>0160-free-chat</sub> |  |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 33 | 0/2 |
| gifts |  | GI<sub>0130-gift</sub> addGifts<sub>0130-gift</sub> handleCharactersAction<sub>0510-actions/</sub> |  |  |  | CHAR_LINES CHAR_LINES_MORE CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE …외 6 | 0/2 |
| gold |  | enhance<sub>0090-growth</sub> giveReward<sub>0090-growth</sub> handleStoryAndAuthoringAction<sub>0510-actions/</sub> pay<sub>0190-shop</sub> …외 1 |  |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 13 | 2/2 |
| guar |  | pityGet<sub>0500-gacha</sub> rollOne<sub>0500-gacha</sub> |  |  |  |  | 0/2 |
| hideEyes | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> | readPlayerForm<sub>0160-free-chat</sub> |  |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 33 | 2/2 |
| hist2 |  | grantOwned<sub>0500-gacha</sub> rollOne<sub>0500-gacha</sub> |  |  |  |  | 0/2 |
| history |  | grantOwned<sub>0500-gacha</sub> |  |  |  |  | 0/2 |
| lobbyBg | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> |  |  |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 33 | 2/2 |
| lobbyMode |  | handleImagesAndAssetsAction<sub>0510-actions/</sub> |  |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 3 | 0/2 |
| look | buildManualGameDraft<sub>0260-new-game/</sub> buildNewGameDraft<sub>0260-new-game/</sub> | readPlayerForm<sub>0160-free-chat</sub> |  |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 33 | 2/2 |
| mail |  | handleMailAction<sub>0510-actions/</sub> mailBox<sub>0220-mail</sub> mailRemove<sub>0220-mail</sub> sendMail<sub>0220-mail</sub> |  |  |  |  | 0/2 |
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
| raid |  | RAID<sub>0110-challenge-raid</sub> handleCombatAndFormationAction<sub>0510-actions/</sub> raidBoss<sub>0110-challenge-raid</sub> raidEnd<sub>0110-challenge-raid</sub> |  |  |  |  | 0/2 |
| rogue |  | RG<sub>0120-abyss</sub> handleCombatAndFormationAction<sub>0510-actions/</sub> rgFinish<sub>0120-abyss</sub> rgStart<sub>0120-abyss</sub> |  | abyssHTML<sub>0120-abyss</sub> |  |  | 0/2 |
| scene | buildNewGameDraft<sub>0260-new-game/</sub> | handleSettingsAndAudioAction<sub>0510-actions/</sub> |  |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 35 | 2/2 |
| sched |  | SCHED<sub>0135-schedule</sub> schedVisit<sub>0135-schedule</sub> |  |  |  |  | 0/2 |
| sec |  | grantOwned<sub>0500-gacha</sub> |  |  |  |  | 0/2 |
| seen |  | handleNavigationAndToolsAction<sub>0510-actions/</sub> |  |  |  | BGM_PROMPT CG_ART CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE …외 9 | 0/2 |
| seenOpening |  |  |  | afterPrologue<sub>0470-title-opening</sub> |  |  | 2/2 |
| shop |  | handleEconomyAction<sub>0510-actions/</sub> shopDay<sub>0190-shop</sub> |  |  |  | SHOP_LINES | 2/2 |
| skinOwn |  | handleNavigationAndToolsAction<sub>0510-actions/</sub> |  |  |  | BGM_PROMPT CG_ART CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE …외 9 | 0/2 |
| sortie |  | sortieBegin<sub>0487-formation-sortie</sub> sortieEnd<sub>0487-formation-sortie</sub> sortieNodeEnd<sub>0487-formation-sortie</sub> sortieParts<sub>0487-formation-sortie</sub> |  |  |  |  | 0/2 |
| spark |  | rollOne<sub>0500-gacha</sub> |  |  |  |  | 0/2 |
| squad |  | handleCombatAndFormationAction<sub>0510-actions/</sub> |  |  |  |  | 0/2 |
| stam |  | handleStoryAndAuthoringAction<sub>0510-actions/</sub> stam<sub>0090-growth</sub> stamUse<sub>0090-growth</sub> |  |  |  | CTX_ALT_CANON CTX_ALT_SIDE CTX_BIBLE CTX_NPCS CTX_PLAYER_PLOT …외 13 | 0/2 |
| staminaCapVersion |  | stam<sub>0090-growth</sub> |  |  |  |  | 0/2 |
| stars |  | bEnd<sub>0480-battle</sub> modeClear<sub>0488-stage-modes</sub> |  |  |  |  | 0/2 |
| titleBg | buildNewGameDraft<sub>0260-new-game/</sub> |  |  |  |  | CAST_SEX_F CAST_SEX_M CAST_SEX_MIX CTX_ALT_CANON CTX_ALT_SIDE …외 33 | 2/2 |
| tower |  | TOWER<sub>0125-tower</sub> towerEnd<sub>0125-tower</sub> |  |  |  |  | 0/2 |
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

## 2. 모듈 → index.html 줄 · 역할 · 쓰는 데이터 · 연계 모듈

| 모듈 | index.html 줄 | 함수 | 역할(쓰기 수) | 쓰는 data | 연계 모듈(호출 수) |
|---|---|---|---|---|---|
| src/boot/durable-storage | 4566~4613 | 3 |  |  |  |
| src/boot/head | 6~23 | 1 |  |  |  |
| src/boot/storage-boot | 15035~15069 | 4 |  |  |  |
| 0010-rules | 4616~4658 | 5 |  |  | 0185-game-rules 2, 0060-util 1, 0230-modal 1 |
| 0015-prompt-studio/ | 4659~5033, 5034~5172, 5173~5374 | 156 | 편집기 1 | meta.json › prompts | 0010-rules 45, 0020-ai-connect 18, 0060-util 16, 0450-relations-memory 10, 0090-growth 8 |
| 0020-ai-connect | 5375~5961 | 98 | 생성기 1 · 실행기 1 | chars.json › [].naiBlocks | 0060-util 21, 0535-content-audit 13, 0230-modal 6, 0015-prompt-studio/ 5, 0070-save 3 |
| 0030-image/ | 5962~6853, 6854~6972 | 110 | 편집기 25 · 생성기 1 · 실행기 1 | chars.json › [].faceMask, chars.json › [].faction, chars.json › [].naiBlocks, chars.json › [].naiPrompt, chars.json › [].name, chars.json › [].skillBalance …외 19 | 0020-ai-connect 77, 0060-util 72, 0230-modal 36, 0080-storage-integration 24, 0070-save 13 |
| 0040-sound | 6973~7082 | 26 | 편집기 2 | lib.json › [].audio, lib.json › [].prompt | 0020-ai-connect 8, 0060-util 8, 0080-storage-integration 7, 0230-modal 3, 0070-save 2 |
| 0050-default-content | 7083~7556 | 4 |  |  |  |
| 0060-util | 7557~7622 | 32 |  |  | 0090-growth 7, 0080-storage-integration 4, 0010-rules 3, 0040-sound 3, 0535-content-audit 2 |
| 0065-inherit | 7623~7664 | 11 | 실행기 2 · 편집기 2 | chars.json › [].over, chars.json › [].skillBalance | 0070-save 1, 0060-util 1 |
| 0070-save | 7665~7797 | 13 | 실행기 44 | banners.json › [].pickup, banners.json › [].pool, banners.json › [].rate, chapters.json › [].kind, chapters.json › [].stages[].post, chapters.json › [].stages[].pre …외 36 | 0020-ai-connect 3, 0060-util 2, 0065-inherit 2, 0110-challenge-raid 1, 0010-rules 1 |
| 0080-storage-integration | 7798~7980 | 40 | 실행기 3 · 편집기 3 | lib.json › [].img, lib.json › [].redraw, lib.json › [].seed | 0070-save 10, 0060-util 10, 0180-ui-scroll 2, 0535-content-audit 1, 0470-title-opening 1 |
| 0090-growth | 7981~8097 | 37 | 실행기 10 | prog.json › cres, prog.json › dm, prog.json › gems, prog.json › gold, prog.json › stam, prog.json › staminaCapVersion | 0060-util 34, 0070-save 8, 0010-rules 6, 0040-sound 5, 0230-modal 4 |
| 0100-messenger | 8098~8207 | 29 |  |  | 0060-util 40, 0080-storage-integration 10, 0160-free-chat 7, 0090-growth 4, 0010-rules 4 |
| 0110-challenge-raid | 8208~8226 | 6 | 실행기 3 | prog.json › raid | 0090-growth 5, 0060-util 4, 0070-save 3, 0240-growth-curve 2, 0280-live-ops 1 |
| 0120-abyss | 8227~8680 | 70 | 편집기 1 · 실행기 3 · 기타 1 | chars.json › [].cards, prog.json › rogue | 0060-util 52, 0080-storage-integration 14, 0090-growth 12, 0230-modal 11, 0180-ui-scroll 8 |
| 0125-tower | 8681~8710 | 9 | 실행기 2 | prog.json › tower | 0090-growth 8, 0060-util 4, 0485-battle-rules 2, 0010-rules 2, 0110-challenge-raid 1 |
| 0130-gift | 8711~8755 | 9 | 실행기 3 | prog.json › curBanner, prog.json › gifts | 0060-util 5, 0090-growth 3, 0070-save 2, 0230-modal 2, 0110-challenge-raid 1 |
| 0135-schedule | 8756~8791 | 10 | 생성기 2 · 실행기 4 | meta.json › spots, prog.json › sched | 0060-util 9, 0090-growth 6, 0070-save 4, 0020-ai-connect 2, 0015-prompt-studio/ 2 |
| 0140-pickup-new | 8792~8811 | 1 |  |  | 0230-modal 3, 0060-util 1, 0010-rules 1 |
| 0150-pickup-existing | 8812~8858 | 9 | 실행기 19 | banners.json, banners.json › [].active, banners.json › [].alt, banners.json › [].bg, banners.json › [].collab, banners.json › [].desc …외 11 | 0060-util 18, 0230-modal 6, 0010-rules 4, 0070-save 4, 0290-season-rotation 3 |
| 0160-free-chat | 8859~8964 | 16 | 실행기 11 | prog.json › avatar, prog.json › bio, prog.json › fcAff, prog.json › fchat, prog.json › gender, prog.json › genderTxt …외 3 | 0060-util 28, 0100-messenger 15, 0020-ai-connect 8, 0080-storage-integration 7, 0030-image/ 7 |
| 0170-render | 8965~8973 | 2 |  |  |  |
| 0180-ui-scroll | 8974~9411 | 38 | 생성기 1 · 실행기 1 · 기타 1 | chars.json › [].scg, prog.json › farmV | 0060-util 52, 0080-storage-integration 29, 0090-growth 18, 0010-rules 12, 0020-ai-connect 11 |
| 0185-game-rules | 9412~9562 | 35 | 편집기 9 · 생성기 6 · 실행기 6 | chapters.json › [].stages[].enemies[].elem, chars.json › [].atk, chars.json › [].def, chars.json › [].hp, chars.json › [].pos, chars.json › [].role …외 5 | 0060-util 12, 0070-save 6, 0010-rules 3, 0020-ai-connect 3, 0015-prompt-studio/ 3 |
| 0187-balance | 9563~9620 | 16 | 생성기 6 · 실행기 12 · 편집기 8 | chars.json › [].atk, chars.json › [].def, chars.json › [].generation, chars.json › [].hp, chars.json › [].skillBalance, chars.json › [].skillDesignLog …외 3 | 0060-util 7, 0070-save 3, 0230-modal 2, 0010-rules 1, 0185-game-rules 1 |
| 0190-shop | 9621~9717 | 20 | 실행기 3 | prog.json › gems, prog.json › gold, prog.json › shop | 0060-util 19, 0080-storage-integration 6, 0010-rules 5, 0090-growth 4, 0180-ui-scroll 2 |
| 0200-skin-shop | 9718~9746 | 5 |  |  | 0060-util 10, 0020-ai-connect 4, 0080-storage-integration 4, 0030-image/ 3, 0290-season-rotation 2 |
| 0210-setup | 9747~9817 | 8 |  |  | 0020-ai-connect 13, 0060-util 6, 0030-image/ 5, 0180-ui-scroll 4, 0040-sound 2 |
| 0220-mail | 9818~9844 | 11 | 실행기 5 | prog.json › mail, prog.json › mailBuild, prog.json › mailInit | 0060-util 6, 0070-save 2, 0090-growth 2, 0230-modal 2, 0010-rules 1 |
| 0230-modal | 9845~10117 | 33 | 편집기 25 | banners.json › [].name, chars.json › [].affLines, chars.json › [].atk, chars.json › [].baseStatsVersion, chars.json › [].def, chars.json › [].dupLines …외 19 | 0060-util 26, 0080-storage-integration 11, 0090-growth 10, 0010-rules 9, 0185-game-rules 5 |
| 0240-growth-curve | 10118~10316 | 21 | 편집기 11 · 실행기 4 | chapters.json › [].stages[].combatBalance, chapters.json › [].stages[].enemies, chapters.json › [].stages[].enemies[].atk, chapters.json › [].stages[].enemies[].def, chapters.json › [].stages[].enemies[].hp, chapters.json › [].stages[].enemies[].spd …외 5 | 0230-modal 27, 0060-util 19, 0080-storage-integration 7, 0090-growth 6, 0010-rules 5 |
| 0250-story-factory | 10317~10542 | 39 | 편집기 38 · 실행기 33 · 생성기 9 | banners.json › [].active, banners.json › [].bg, banners.json › [].desc, banners.json › [].name, banners.json › [].pickup, banners.json › [].pool …외 40 | 0060-util 35, 0070-save 18, 0450-relations-memory 17, 0230-modal 13, 0015-prompt-studio/ 10 |
| 0260-new-game/ | 10543~10707, 10708~10898 | 49 | 생성기 117 · 편집기 1 | banners.json, chapters.json, chapters.json › [].stages[].enemies, chapters.json › [].stages[].post, chapters.json › [].stages[].pre, chapters.json › [].stages[].route …외 70 | 0060-util 37, 0015-prompt-studio/ 20, 0020-ai-connect 14, 0070-save 14, 0080-storage-integration 10 |
| 0270-skin-proposal | 10899~10964 | 11 |  |  | 0060-util 17, 0030-image/ 15, 0080-storage-integration 10, 0230-modal 7, 0010-rules 6 |
| 0274-dispatch | 10965~11006 | 7 | 실행기 3 | prog.json › dboard, prog.json › disp | 0060-util 11, 0090-growth 7, 0010-rules 2, 0080-storage-integration 2, 0505-construct 2 |
| 0275-expedition | 11007~11091 | 29 | 실행기 8 · 편집기 1 | meta.json › expedition, prog.json › exped | 0060-util 22, 0090-growth 8, 0070-save 7, 0180-ui-scroll 6, 0010-rules 3 |
| 0280-live-ops | 11092~11128 | 7 | 실행기 5 | banners.json › [].bg, banners.json › [].desc, banners.json › [].name, banners.json › [].pickup, threads.json | 0060-util 8, 0070-save 3, 0220-mail 1, 0180-ui-scroll 1, 0090-growth 1 |
| 0290-season-rotation | 11129~11309 | 28 | 실행기 23 · 편집기 13 · 기타 1 | banners.json, banners.json › [].active, banners.json › [].bg, banners.json › [].desc, banners.json › [].eventId, chars.json › [].age …외 13 | 0060-util 32, 0250-story-factory 9, 0070-save 9, 0280-live-ops 8, 0180-ui-scroll 8 |
| 0300-codex | 11310~11398 | 21 | 기타 2 · 실행기 4 · 편집기 2 | prog.json › cxBadge, prog.json › cxSeen, world.json › codex, world.json › codexNotes | 0060-util 15, 0070-save 6, 0080-storage-integration 5, 0090-growth 5, 0230-modal 4 |
| 0310-art-after-ai | 11399~11419 | 4 |  |  | 0290-season-rotation 2, 0030-image/ 1, 0020-ai-connect 1, 0060-util 1 |
| 0330-casting | 11420~11508 | 18 | 실행기 4 · 편집기 4 | npcs.json, npcs.json › [].look, npcs.json › [].naiPrompt, npcs.json › [].role | 0060-util 20, 0030-image/ 12, 0080-storage-integration 10, 0230-modal 6, 0020-ai-connect 5 |
| 0335-github-api | 11509~11551 | 10 |  |  | 0535-content-audit 3, 0360-sync/ 3, 0020-ai-connect 2, 0060-util 2, 0400-publish-subscribe 1 |
| 0360-sync/ | 11552~11576, 11577~11653, 11654~11733, 11734~11784, 11785~11847 | 47 |  |  | 0060-util 35, 0020-ai-connect 17, 0230-modal 14, 0070-save 12, 0335-github-api 9 |
| 0370-game-picker | 11848~11889 | 8 | 실행기 3 | meta.json › artTags, prog.json › bootPrep, prog.json › prepAsked | 0060-util 12, 0070-save 3, 0080-storage-integration 3, 0290-season-rotation 3, 0330-casting 2 |
| 0400-publish-subscribe | 11893~12000 | 15 | 편집기 4 | chars.json › [].voiceId, chars.json › [].voiceName, lib.json › [].live, meta.json › pub | 0060-util 12, 0070-save 10, 0230-modal 9, 0080-storage-integration 7, 0360-sync/ 7 |
| 0410-desktop | 12001~12045 | 6 |  |  | 0060-util 5, 0230-modal 4, 0020-ai-connect 2, 0080-storage-integration 1 |
| 0420-app-update | 12046~12220 | 25 |  |  | 0060-util 21, 0230-modal 18, 0020-ai-connect 5, 0070-save 4, 0360-sync/ 4 |
| 0440-ai-context | 12221~12236 | 5 |  |  | 0060-util 2, 0488-stage-modes 1, 0230-modal 1, 0010-rules 1 |
| 0445-factions | 12237~12345 | 25 | 편집기 9 · 실행기 11 · 생성기 8 | chars.json › [].debut, chars.json › [].debutLater, chars.json › [].faction, meta.json › bestiary, meta.json › cast, world.json › factions …외 4 | 0070-save 7, 0060-util 6, 0535-content-audit 5, 0090-growth 3, 0230-modal 3 |
| 0450-relations-memory | 12346~12415 | 24 | 생성기 2 · 실행기 3 · 편집기 1 | chapters.json › [].relScan, meta.json › relProf, rels.json | 0060-util 13, 0070-save 5, 0290-season-rotation 4, 0230-modal 4, 0010-rules 3 |
| 0455-persona | 12416~12529 | 21 | 실행기 4 · 편집기 7 | chars.json › [].affLines, chars.json › [].lines, chars.json › [].persona, chars.json › [].pfields, meta.json › persona | 0060-util 18, 0070-save 6, 0230-modal 6, 0015-prompt-studio/ 5, 0020-ai-connect 4 |
| 0460-script-engine | 12530~12638 | 17 |  |  | 0060-util 21, 0040-sound 13, 0080-storage-integration 4, 0535-content-audit 3, 0462-direction 3 |
| 0462-direction | 12639~12701 | 18 |  |  | 0060-util 8, 0535-content-audit 5, 0460-script-engine 3, 0080-storage-integration 2, 0040-sound 1 |
| 0465-story-plan | 12702~12762 | 11 | 실행기 3 · 편집기 2 | prog.json › flags, world.json › plan | 0060-util 5, 0070-save 2, 0230-modal 2, 0020-ai-connect 1, 0015-prompt-studio/ 1 |
| 0470-title-opening | 12763~12816 | 10 | 기타 1 | prog.json › seenOpening | 0060-util 17, 0080-storage-integration 4, 0180-ui-scroll 3, 0040-sound 3, 0290-season-rotation 2 |
| 0480-battle | 12817~12937 | 16 | 실행기 1 | prog.json › stars | 0060-util 19, 0090-growth 14, 0080-storage-integration 10, 0010-rules 4, 0487-formation-sortie 4 |
| 0485-battle-rules | 12938~12980 | 15 | 생성기 3 · 실행기 3 | chapters.json › [].stages[].field, chapters.json › [].stages[].goal, chapters.json › [].stages[].rulesV | 0120-abyss 2, 0060-util 2, 0110-challenge-raid 1, 0480-battle 1 |
| 0487-formation-sortie | 12981~13048 | 21 | 실행기 4 | prog.json › sortie | 0090-growth 10, 0060-util 9, 0070-save 4, 0230-modal 3, 0185-game-rules 1 |
| 0488-stage-modes | 13049~13135 | 17 | 실행기 1 | prog.json › stars | 0060-util 13, 0230-modal 9, 0090-growth 7, 0460-script-engine 5, 0010-rules 4 |
| 0490-boss-patterns | 13136~13157 | 6 |  |  | 0290-season-rotation 1, 0230-modal 1 |
| 0500-gacha | 13158~13287 | 22 | 실행기 12 | banners.json › [].newAt, prog.json › firstTen, prog.json › gateSeen, prog.json › guar, prog.json › hist2, prog.json › history …외 4 | 0060-util 27, 0040-sound 6, 0010-rules 5, 0080-storage-integration 5, 0230-modal 4 |
| 0505-construct | 13288~13439 | 31 | 실행기 24 · 편집기 2 · 생성기 3 | chars.json › [].age, chars.json › [].alt, chars.json › [].altCanon, chars.json › [].cvar, chars.json › [].faction, chars.json › [].naiPrompt …외 12 | 0060-util 31, 0010-rules 11, 0070-save 5, 0230-modal 5, 0190-shop 4 |
| 0510-actions/ | 13440~13472, 13473~13657, 13658~13670, 13671~13837, 13838~13920, 13921~13986, 13987~14047, 14048~14068, 14069~14115, 14116~14282, 14283~14324, 14325~14367, 14368~14397 | 14 | 편집기 70 · 실행기 29 | banners.json, banners.json › [].desc, banners.json › [].id, banners.json › [].name, banners.json › [].pickup, banners.json › [].textContent …외 85 | 0060-util 103, 0030-image/ 73, 0020-ai-connect 73, 0090-growth 53, 0230-modal 47 |
| 0520-backup-storage | 14398~14576 | 26 | 편집기 4 | chars.json › [].voiceId, chars.json › [].voiceName | 0080-storage-integration 12, 0230-modal 10, 0060-util 10, 0070-save 9, 0360-sync/ 4 |
| 0525-data-folder | 14577~14663 | 12 |  |  | 0070-save 7, 0060-util 5, 0520-backup-storage 3, 0360-sync/ 3, 0080-storage-integration 3 |
| 0530-story-memory | 14664~14706 | 15 | 편집기 1 | meta.json › storyMemory | 0230-modal 8, 0060-util 6, 0070-save 5, 0015-prompt-studio/ 4, 0450-relations-memory 2 |
| 0535-content-audit | 14707~14840 | 21 | 편집기 1 | meta.json › auditSeen | 0060-util 10, 0020-ai-connect 10, 0445-factions 8, 0185-game-rules 7, 0070-save 5 |
| 0537-live-fill | 14841~14860 | 4 |  |  | 0280-live-ops 3, 0060-util 3, 0170-render 1, 0535-content-audit 1, 0090-growth 1 |
| 0550-standalone-app | 14868~14914 | 4 |  |  | 0060-util 3, 0535-content-audit 1, 0030-image/ 1, 0080-storage-integration 1 |
| 0565-asset-library | 14915~14968 | 14 | 실행기 3 · 편집기 3 | lib.json › [].alias, lib.json › [].prompt, lib.json › [].shared | 0080-storage-integration 6, 0060-util 4, 0070-save 2, 0230-modal 2, 0040-sound 1 |
| app/010-confirm | 2074~2091 | 1 |  |  |  |
| app/020-construct | 2094~2208 | 18 |  |  |  |
| app/030-expedition | 2211~2278 | 14 |  |  |  |
| combat/010-catalog | 2282~2292 | 3 |  |  |  |
| combat/020-visual-catalog | 2295~2379 | 3 |  |  |  |
| combat/030-core | 2382~3310 | 128 | 기타 7 · 실행기 6 · 편집기 4 | chars.json › [].baseStatsMigration, chars.json › [].baseStatsVersion, chars.json › [].def, chars.json › [].hp, chars.json › [].skillBalance, lib.json › [].cooldown …외 4 |  |
| combat/040-effects | 3313~3766 | 49 |  |  | 0480-battle 8, 0060-util 1 |
| combat/050-bridge | 3769~4140 | 67 | 실행기 22 · 편집기 14 · 생성기 17 | chapters.json › [].stages[].combatBalance, chapters.json › [].stages[].enemies, chars.json › [].generation, chars.json › [].roleSpeedOriginal, chars.json › [].roleSpeedRole, chars.json › [].roleSpeedVersion …외 12 | 0060-util 28, 0070-save 5, 0480-battle 5, 0080-storage-integration 4, 0030-image/ 4 |
| combat/060-generation | 4143~4365 | 29 |  |  | 0015-prompt-studio/ 4, 0020-ai-connect 3, 0060-util 2 |
| combat/070-equipment | 4368~4479 | 18 | 편집기 2 · 생성기 1 · 실행기 1 | chars.json › [].skillRevisions, chars.json › [].weapon | 0060-util 8, 0070-save 3, 0230-modal 3, 0170-render 2, 0080-storage-integration 1 |
| combat/080-training | 4482~4506 | 9 |  |  | 0060-util 11, 0090-growth 5, 0230-modal 3, 0010-rules 1, 0070-save 1 |
| combat/090-practice | 4509~4562 | 9 |  |  | 0060-util 7, 0230-modal 3, 0460-script-engine 2, 0090-growth 1, 0480-battle 1 |

## 3. 최근 변화(증분 갱신 기록)

- 2026-11-03T23:43 · git fa20988 · src 5: 0020-ai-connect, 0220-mail, 0274-dispatch, 0275-expedition, 0510-actions/030-mail · index.html 다시 빌드
  - 함수: 추가 2 (mailRemove, dispEndAll) · 삭제 0 · 옮김 0
  - prog.json › disp: +실행기:dispEndAll −실행기:exSave
  - prog.json › mail: +실행기:mailRemove
- 2026-11-03T23:32 · git 411bea9
- 2026-11-03T23:30 · git 411bea9
- 2026-11-03T23:30 · git 411bea9
  - 함수: 추가 38 (updStam, stamUse, bump, roomItems, roomDel, raidTriesLeft) · 삭제 0 · 옮김 0
  - banners.json: +실행기:puStoryBg −편집기:aiPickupStory −편집기:puStoryBg
  - banners.json › [].active:  −편집기:addPickupFor −편집기:seasonStart
  - banners.json › [].alt:  −편집기:addPickupFor
  - banners.json › [].bg:  −편집기:addPickupFor −편집기:aiPickupStory −편집기:rotatePickups
  - banners.json › [].collab:  −편집기:addPickupFor
  - banners.json › [].desc:  −편집기:addPickupFor −편집기:aiPickupStory −편집기:rotatePickups
  - banners.json › [].eventId:  −편집기:aiPickupStory
  - banners.json › [].gate:  −편집기:addPickupFor
  - banners.json › [].id:  −편집기:addPickupFor
  - banners.json › [].name:  −편집기:addPickupFor −편집기:rotatePickups
- 2026-11-03T23:16 · git 2a0c2e5 · 처음 만듦
