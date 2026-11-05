# 연관 맵 — 모듈 → 빌드 → index.html(생성기·실행기·편집기) → data 게임 파일

생성: `node tools/map.mjs` · 2026-11-05T05:14 · git 6c71ddc · 입력: src 56파일 · www/index.html 3f6e8830c46d · 시험 게임 2 — 입력이 바뀌면 다시 만들고 바뀐 연결은 맨 아래 "최근 변화"에(증분 갱신, CI `--check`가 맵이 낡았는지 봄)

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
| (파일 전체) | buildManualGameDraft<sub>10-newgame</sub> buildNewGameDraft<sub>10-newgame</sub> | addPickupFor<sub>10-acquire</sub> aiEventGen0<sub>10-story</sub> aiPickupStory<sub>10-acquire</sub> puStoryBg<sub>10-acquire</sub> …외 1 | aiEventGen0<sub>10-story</sub> handleNavigationAndToolsAction<sub>10-acquire</sub> handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 2/2 |
| [].active |  | addPickupFor<sub>10-acquire</sub> seasonStart<sub>10-acquire</sub> |  |  |  |  | 2/2 |
| [].alt |  | addPickupFor<sub>10-acquire</sub> |  |  |  |  | 0/2 |
| [].bg |  | addPickupFor<sub>10-acquire</sub> rotatePickups<sub>10-acquire</sub> |  |  |  |  | 0/2 |
| [].collab |  | addPickupFor<sub>10-acquire</sub> |  |  |  |  | 0/2 |
| [].desc |  | addPickupFor<sub>10-acquire</sub> rotatePickups<sub>10-acquire</sub> |  |  |  |  | 2/2 |
| [].gate |  | addPickupFor<sub>10-acquire</sub> |  |  |  |  | 0/2 |
| [].id |  | addPickupFor<sub>10-acquire</sub> |  |  |  |  | 2/2 |
| [].name |  | addPickupFor<sub>10-acquire</sub> renameEverywhere<sub>10-acquire</sub> rotatePickups<sub>10-acquire</sub> | renameEverywhere<sub>10-acquire</sub> |  |  |  | 2/2 |
| [].newAt |  | addPickupFor<sub>10-acquire</sub> gateCheck<sub>10-acquire</sub> |  |  |  |  | 0/2 |
| [].pickup |  | addPickupFor<sub>10-acquire</sub> normalizeBanners<sub>10-acquire</sub> repairRefs<sub>10-acquire</sub> rotatePickups<sub>10-acquire</sub> …외 1 | storyPurge<sub>10-acquire</sub> |  |  |  | 2/2 |
| [].pool |  | addPickupFor<sub>10-acquire</sub> normalizeBanners<sub>10-acquire</sub> repairRefs<sub>10-acquire</sub> storyPurge<sub>10-acquire</sub> | storyPurge<sub>10-acquire</sub> |  |  |  | 2/2 |
| [].rate |  | addPickupFor<sub>10-acquire</sub> normalizeBanners<sub>10-acquire</sub> |  |  |  |  | 2/2 |
| [].type |  | addPickupFor<sub>10-acquire</sub> |  |  |  |  | 2/2 |
| [].until |  | addPickupFor<sub>10-acquire</sub> |  |  |  |  | 0/2 |

### chapters.json — 시나리오(장·스테이지·대본·적)

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| (파일 전체) | buildManualGameDraft<sub>10-newgame</sub> buildNewGameDraft<sub>10-newgame</sub> | aiChapterGen0<sub>10-story</sub> aiEventGen0<sub>10-story</sub> | aiChapterGen0<sub>10-story</sub> aiEventGen0<sub>10-story</sub> handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 2/2 |
| [].__purge |  |  | handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 0/2 |
| [].eventId |  |  | handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 0/2 |
| [].kind |  | normalizeChapters<sub>10-story</sub> |  |  | w_stance |  | 2/2 |
| [].lore |  | evLoreSet<sub>10-story</sub> | evLoreSet<sub>10-story</sub> |  |  |  | 0/2 |
| [].ord |  |  | handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 2/2 |
| [].recruits |  | storyPurge<sub>10-acquire</sub> | storyPurge<sub>10-acquire</sub> |  |  |  | 1/2 |
| [].relScan | relFromScripts<sub>10-story</sub> | evLoreSet<sub>10-story</sub> relFromScripts<sub>10-story</sub> | evLoreSet<sub>10-story</sub> handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 2/2 |
| [].stages |  |  | handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 2/2 |
| [].stages[].combatBalance |  | v2BalanceChapter<sub>combat/050-bridge</sub> v2PrepareStage<sub>combat/050-bridge</sub> readChForm<sub>10-story</sub> | v2BalanceChapter<sub>combat/050-bridge</sub> v2PrepareStage<sub>combat/050-bridge</sub> readChForm<sub>10-story</sub> |  |  |  | 1/2 |
| [].stages[].enemies | shapeFirstStages<sub>10-story</sub> | v2BalanceChapter<sub>combat/050-bridge</sub> v2PrepareStage<sub>combat/050-bridge</sub> readChForm<sub>10-story</sub> rebalanceChapter<sub>10-story</sub> …외 1 | v2BalanceChapter<sub>combat/050-bridge</sub> v2PrepareStage<sub>combat/050-bridge</sub> readChForm<sub>10-story</sub> |  | s_rules |  | 2/2 |
| [].stages[].enemies[].atk |  | sysEventFoes<sub>10-story</sub> | sysEventFoes<sub>10-story</sub> |  |  |  | 2/2 |
| [].stages[].enemies[].def |  | sysEventFoes<sub>10-story</sub> | sysEventFoes<sub>10-story</sub> |  |  |  | 2/2 |
| [].stages[].enemies[].elem |  | rulesSave<sub>10-rules</sub> | handleStoryAndAuthoringAction<sub>10-story</sub> rulesSave<sub>10-rules</sub> |  |  |  | 2/2 |
| [].stages[].enemies[].hp |  | sysEventFoes<sub>10-story</sub> | sysEventFoes<sub>10-story</sub> |  |  |  | 2/2 |
| [].stages[].enemies[].spd |  | sysEventFoes<sub>10-story</sub> | sysEventFoes<sub>10-story</sub> |  |  |  | 2/2 |
| [].stages[].field | stageAutoRules<sub>10-story</sub> | stageAutoRules<sub>10-story</sub> |  |  |  |  | 2/2 |
| [].stages[].goal | stageAutoRules<sub>10-story</sub> | stageAutoRules<sub>10-story</sub> |  |  |  |  | 2/2 |
| [].stages[].post | shapeFirstStages<sub>10-story</sub> | normalizeChapters<sub>10-story</sub> readChForm<sub>10-story</sub> shapeFirstStages<sub>10-story</sub> writeStages<sub>10-story</sub> | handleStoryAndAuthoringAction<sub>10-story</sub> readChForm<sub>10-story</sub> writeStages<sub>10-story</sub> |  | s_direct |  | 2/2 |
| [].stages[].pre | shapeFirstStages<sub>10-story</sub> | normalizeChapters<sub>10-story</sub> readChForm<sub>10-story</sub> shapeFirstStages<sub>10-story</sub> writeStages<sub>10-story</sub> | handleStoryAndAuthoringAction<sub>10-story</sub> readChForm<sub>10-story</sub> writeStages<sub>10-story</sub> |  | s_direct s_script |  | 2/2 |
| [].stages[].reward |  | readChForm<sub>10-story</sub> | readChForm<sub>10-story</sub> |  |  |  | 2/2 |
| [].stages[].route | shapeFirstStages<sub>10-story</sub> | shapeFirstStages<sub>10-story</sub> |  |  |  |  | 1/2 |
| [].stages[].rulesV | stageAutoRules<sub>10-story</sub> | stageAutoRules<sub>10-story</sub> |  |  | s_rules |  | 2/2 |
| [].stages[].stamina |  |  | handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 0/2 |
| [].stages[].story | shapeFirstStages<sub>10-story</sub> | readChForm<sub>10-story</sub> shapeFirstStages<sub>10-story</sub> | readChForm<sub>10-story</sub> |  | s_rules |  | 2/2 |
| [].stages[].title |  | readChForm<sub>10-story</sub> | readChForm<sub>10-story</sub> |  |  |  | 2/2 |

### chars.json — 캐릭터

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| (파일 전체) | buildManualGameDraft<sub>10-newgame</sub> buildNewGameDraft<sub>10-newgame</sub> | apply<sub>10-characters</sub> apply<sub>10-characters</sub> addNewChars<sub>10-characters</sub> conMakeVariant<sub>10-characters</sub> …외 1 | apply<sub>10-characters</sub> apply<sub>10-characters</sub> addNewChars<sub>10-characters</sub> handleStoryAndAuthoringAction<sub>10-story</sub> …외 1 |  |  |  | 2/2 |
| [].__deb | buildNewGameDraft<sub>10-newgame</sub> |  |  |  |  |  | 0/2 |
| [].affLines |  | fix<sub>10-characters</sub> readCharForm<sub>10-characters</sub> | readCharForm<sub>10-characters</sub> |  | c_aff |  | 2/2 |
| [].age |  | apply<sub>10-characters</sub> conMakeVariant<sub>10-characters</sub> fix<sub>10-characters</sub> | apply<sub>10-characters</sub> |  |  |  | 2/2 |
| [].alt |  | apply<sub>10-characters</sub> conMakeVariant<sub>10-characters</sub> | apply<sub>10-characters</sub> |  |  |  | 0/2 |
| [].altCanon |  | apply<sub>10-characters</sub> conMakeVariant<sub>10-characters</sub> | apply<sub>10-characters</sub> |  |  |  | 0/2 |
| [].atk | balNormalize<sub>10-characters</sub> | balNormalize<sub>10-characters</sub> readCharForm<sub>10-characters</sub> | readCharForm<sub>10-characters</sub> rulesRecalc<sub>10-characters</sub> |  |  |  | 2/2 |
| [].baseStatsMigration |  |  |  | migrateBaseStats<sub>combat/030-core</sub> |  |  | 0/2 |
| [].baseStatsVersion |  | readCharForm<sub>10-characters</sub> | readCharForm<sub>10-characters</sub> | migrateBaseStats<sub>combat/030-core</sub> |  |  | 2/2 |
| [].cards |  | drawCardArts<sub>10-characters</sub> |  |  |  |  | 0/2 |
| [].collab |  | apply<sub>10-characters</sub> | apply<sub>10-characters</sub> |  |  |  | 0/2 |
| [].cvar |  | conMakeVariant<sub>10-characters</sub> |  |  |  |  | 0/2 |
| [].debut | buildNewGameDraft<sub>10-newgame</sub> | debutResolve<sub>10-characters</sub> | debutResolve<sub>10-characters</sub> fwRead<sub>10-characters</sub> |  | c_debut |  | 2/2 |
| [].debutLater | buildNewGameDraft<sub>10-newgame</sub> | debutResolve<sub>10-characters</sub> | debutResolve<sub>10-characters</sub> |  | c_debut |  | 0/2 |
| [].def | balNormalize<sub>10-characters</sub> | balNormalize<sub>10-characters</sub> readCharForm<sub>10-characters</sub> | readCharForm<sub>10-characters</sub> rulesRecalc<sub>10-characters</sub> | migrateBaseStats<sub>combat/030-core</sub> |  |  | 2/2 |
| [].dupLines |  | fix<sub>10-characters</sub> readCharForm<sub>10-characters</sub> | readCharForm<sub>10-characters</sub> |  |  |  | 2/2 |
| [].elem |  | fix<sub>10-characters</sub> readCharForm<sub>10-characters</sub> | handleStoryAndAuthoringAction<sub>10-story</sub> readCharForm<sub>10-characters</sub> |  |  |  | 2/2 |
| [].episodes |  | fix<sub>10-characters</sub> | handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 0/2 |
| [].faceMask | artReuse<sub>10-characters</sub> | artReuse<sub>10-characters</sub> regenApply<sub>10-characters</sub> | handleImagesAndAssetsAction<sub>10-characters</sub> regenApply<sub>10-characters</sub> |  |  |  | 0/2 |
| [].faces | artReuse<sub>10-characters</sub> | artReuse<sub>10-characters</sub> fix<sub>10-characters</sub> | handleImagesAndAssetsAction<sub>10-characters</sub> |  |  |  | 0/2 |
| [].faction |  | apply<sub>10-characters</sub> apply<sub>10-characters</sub> conMakeVariant<sub>10-characters</sub> fix<sub>10-characters</sub> …외 2 | apply<sub>10-characters</sub> apply<sub>10-characters</sub> fwRead<sub>10-characters</sub> readCharForm<sub>10-characters</sub> …외 1 |  |  |  | 2/2 |
| [].files |  | fix<sub>10-characters</sub> readCharForm<sub>10-characters</sub> | readCharForm<sub>10-characters</sub> |  |  |  | 2/2 |
| [].generation |  | balRemaster<sub>10-characters</sub> | balRemaster<sub>10-characters</sub> v2EditorAction<sub>combat/050-bridge</sub> |  |  |  | 2/2 |
| [].hp | balNormalize<sub>10-characters</sub> | balNormalize<sub>10-characters</sub> readCharForm<sub>10-characters</sub> | readCharForm<sub>10-characters</sub> rulesRecalc<sub>10-characters</sub> | migrateBaseStats<sub>combat/030-core</sub> |  |  | 2/2 |
| [].illust |  | fix<sub>10-characters</sub> |  |  |  |  | 2/2 |
| [].img | artReuse<sub>10-characters</sub> | artReuse<sub>10-characters</sub> |  |  |  |  | 0/2 |
| [].intro |  | fix<sub>10-characters</sub> readCharForm<sub>10-characters</sub> | readCharForm<sub>10-characters</sub> |  | c_intro |  | 2/2 |
| [].lbbg |  | fix<sub>10-characters</sub> | handleImagesAndAssetsAction<sub>10-characters</sub> |  |  |  | 2/2 |
| [].lbcg |  | fix<sub>10-characters</sub> |  |  |  |  | 2/2 |
| [].limited |  | addPickupFor<sub>10-acquire</sub> fix<sub>10-characters</sub> readCharForm<sub>10-characters</sub> | handleNavigationAndToolsAction<sub>10-acquire</sub> readCharForm<sub>10-characters</sub> |  |  |  | 2/2 |
| [].lines |  | apply<sub>10-characters</sub> fix<sub>10-characters</sub> readCharForm<sub>10-characters</sub> | apply<sub>10-characters</sub> readCharForm<sub>10-characters</sub> |  | c_lines |  | 2/2 |
| [].lvLines |  | fix<sub>10-characters</sub> readCharForm<sub>10-characters</sub> | readCharForm<sub>10-characters</sub> |  |  |  | 2/2 |
| [].naiBlocks |  | regenApply<sub>10-characters</sub> | regenApply<sub>10-characters</sub> |  |  |  | 2/2 |
| [].naiPose |  | fix<sub>10-characters</sub> |  |  |  |  | 0/2 |
| [].naiPrompt |  | conMakeVariant<sub>10-characters</sub> fix<sub>10-characters</sub> readCharForm<sub>10-characters</sub> regenApply<sub>10-characters</sub> | readCharForm<sub>10-characters</sub> regenApply<sub>10-characters</sub> |  | c_age c_look c_minor |  | 2/2 |
| [].naiStyle |  | apply<sub>10-characters</sub> conMakeVariant<sub>10-characters</sub> | apply<sub>10-characters</sub> |  |  |  | 0/2 |
| [].name |  | apply<sub>10-characters</sub> apply<sub>10-characters</sub> conMakeVariant<sub>10-characters</sub> readCharForm<sub>10-characters</sub> …외 1 | apply<sub>10-characters</sub> apply<sub>10-characters</sub> readCharForm<sub>10-characters</sub> regenApply<sub>10-characters</sub> | edit<sub>10-newgame</sub> |  |  | 2/2 |
| [].noDesign |  | readCharForm<sub>10-characters</sub> | readCharForm<sub>10-characters</sub> |  |  |  | 0/2 |
| [].over |  | inheritAll<sub>10-characters</sub> inheritOnMark<sub>10-characters</sub> | inheritOnMark<sub>10-characters</sub> |  |  |  | 0/2 |
| [].persona |  |  | personaSave<sub>10-characters</sub> |  | c_persona c_persona_weak c_pfields |  | 2/2 |
| [].pfields |  |  | personaSave<sub>10-characters</sub> |  | c_pfields |  | 2/2 |
| [].pos | posSpread<sub>10-characters</sub> | posSpread<sub>10-characters</sub> readCharForm<sub>10-characters</sub> rulesSave<sub>10-rules</sub> | readCharForm<sub>10-characters</sub> rulesSave<sub>10-rules</sub> |  | c_pos |  | 2/2 |
| [].pose |  | fix<sub>10-characters</sub> |  |  |  |  | 2/2 |
| [].profile |  | readCharForm<sub>10-characters</sub> | readCharForm<sub>10-characters</sub> |  | c_profile |  | 2/2 |
| [].rarity |  | apply<sub>10-characters</sub> apply<sub>10-characters</sub> conMakeVariant<sub>10-characters</sub> fix<sub>10-characters</sub> …외 1 | apply<sub>10-characters</sub> apply<sub>10-characters</sub> readCharForm<sub>10-characters</sub> |  |  |  | 2/2 |
| [].role |  | fix<sub>10-characters</sub> readCharForm<sub>10-characters</sub> rulesSave<sub>10-rules</sub> | readCharForm<sub>10-characters</sub> rulesSave<sub>10-rules</sub> |  |  |  | 2/2 |
| [].roleSpeedOriginal | v2ApplyRoleSpeed<sub>combat/050-bridge</sub> | v2ApplyRoleSpeed<sub>combat/050-bridge</sub> |  |  |  |  | 2/2 |
| [].roleSpeedRole | v2ApplyRoleSpeed<sub>combat/050-bridge</sub> | v2ApplyRoleSpeed<sub>combat/050-bridge</sub> |  |  |  |  | 2/2 |
| [].roleSpeedVersion | v2ApplyRoleSpeed<sub>combat/050-bridge</sub> | v2ApplyRoleSpeed<sub>combat/050-bridge</sub> |  |  |  |  | 2/2 |
| [].scg |  | scgSlot<sub>10-characters</sub> | scgSlot<sub>10-characters</sub> |  |  |  | 0/2 |
| [].skill |  | fix<sub>10-characters</sub> readCharForm<sub>10-characters</sub> | readCharForm<sub>10-characters</sub> |  |  |  | 2/2 |
| [].skillBalance | balNormalize<sub>10-characters</sub> v2ApplyRoleSpeed<sub>combat/050-bridge</sub> v2Ensure<sub>combat/050-bridge</sub> v2QueueCharacter<sub>combat/050-bridge</sub> | balNormalize<sub>10-characters</sub> balRemaster<sub>10-characters</sub> balRemasterAI<sub>10-characters</sub> inheritApply<sub>10-characters</sub> …외 4 | balFix<sub>10-characters</sub> balRemaster<sub>10-characters</sub> balRemasterAI<sub>10-characters</sub> inheritApply<sub>10-characters</sub> …외 2 | migrateBaseStats<sub>combat/030-core</sub> | c_skills |  | 1/2 |
| [].skillConcept |  | regenApply<sub>10-characters</sub> | v2EditorAction<sub>combat/050-bridge</sub> regenApply<sub>10-characters</sub> |  |  |  | 0/2 |
| [].skillDesignLog | v2GenerateSkills<sub>combat/050-bridge</sub> v2QueueCharacter<sub>combat/050-bridge</sub> | balRemasterAI<sub>10-characters</sub> v2GenerateSkills<sub>combat/050-bridge</sub> v2QueueCharacter<sub>combat/050-bridge</sub> regenApply<sub>10-characters</sub> | balRemasterAI<sub>10-characters</sub> v2EditorAction<sub>combat/050-bridge</sub> regenApply<sub>10-characters</sub> |  |  |  | 1/2 |
| [].skillGenerationNotice | v2GenerateSkills<sub>combat/050-bridge</sub> v2QueueCharacter<sub>combat/050-bridge</sub> | v2GenerateSkills<sub>combat/050-bridge</sub> v2QueueCharacter<sub>combat/050-bridge</sub> regenApply<sub>10-characters</sub> | v2EditorAction<sub>combat/050-bridge</sub> regenApply<sub>10-characters</sub> |  |  |  | 0/2 |
| [].skillGenerationWarning | v2Ensure<sub>combat/050-bridge</sub> | v2Ensure<sub>combat/050-bridge</sub> regenApply<sub>10-characters</sub> skillResume<sub>10-characters</sub> | v2EditorAction<sub>combat/050-bridge</sub> regenApply<sub>10-characters</sub> |  |  |  | 0/2 |
| [].skillIcons |  | v2IconClick<sub>combat/050-bridge</sub> | v2IconClick<sub>combat/050-bridge</sub> |  |  |  | 0/2 |
| [].skillPending |  | fix<sub>10-characters</sub> skillResume<sub>10-characters</sub> |  |  |  |  | 0/2 |
| [].skillPlan | v2GenerateSkills<sub>combat/050-bridge</sub> | v2GenerateSkills<sub>combat/050-bridge</sub> regenKeepPlan<sub>10-characters</sub> | v2SavePlan<sub>combat/050-bridge</sub> regenKeepPlan<sub>10-characters</sub> |  |  |  | 0/2 |
| [].skillRevisions |  | v2EquipmentSkillSaved<sub>combat/070-equipment</sub> | v2EquipmentSkillSaved<sub>combat/070-equipment</sub> |  |  |  | 0/2 |
| [].skills | v2Ensure<sub>combat/050-bridge</sub> v2QueueCharacter<sub>combat/050-bridge</sub> | balRemasterAI<sub>10-characters</sub> v2Ensure<sub>combat/050-bridge</sub> v2QueueCharacter<sub>combat/050-bridge</sub> regenApply<sub>10-characters</sub> …외 1 | balRemasterAI<sub>10-characters</sub> v2EditorAction<sub>combat/050-bridge</sub> regenApply<sub>10-characters</sub> |  | c_skills |  | 2/2 |
| [].skillsLegacyBackup | v2Ensure<sub>combat/050-bridge</sub> | v2Ensure<sub>combat/050-bridge</sub> |  |  |  |  | 0/2 |
| [].skillTuning |  | balRemasterAI<sub>10-characters</sub> regenApply<sub>10-characters</sub> | balRemasterAI<sub>10-characters</sub> v2EditorAction<sub>combat/050-bridge</sub> regenApply<sub>10-characters</sub> |  |  |  | 0/2 |
| [].skins | artReuse<sub>10-characters</sub> | artReuse<sub>10-characters</sub> fix<sub>10-characters</sub> | handleImagesAndAssetsAction<sub>10-characters</sub> handleNavigationAndToolsAction<sub>10-acquire</sub> |  |  |  | 0/2 |
| [].spd | v2ApplyRoleSpeed<sub>combat/050-bridge</sub> | v2ApplyRoleSpeed<sub>combat/050-bridge</sub> readCharForm<sub>10-characters</sub> | readCharForm<sub>10-characters</sub> rulesRecalc<sub>10-characters</sub> |  |  |  | 2/2 |
| [].touch |  | fix<sub>10-characters</sub> readCharForm<sub>10-characters</sub> | readCharForm<sub>10-characters</sub> |  | c_touch |  | 2/2 |
| [].upper |  | fix<sub>10-characters</sub> | handleUpdatesAction<sub>10-characters</sub> |  |  |  | 2/2 |
| [].useStanding | v2Ensure<sub>combat/050-bridge</sub> | v2Ensure<sub>combat/050-bridge</sub> |  |  |  |  | 2/2 |
| [].voiceId |  | apply<sub>10-characters</sub> applySharedArchive<sub>10-characters</sub> conMakeVariant<sub>10-characters</sub> pubContent<sub>10-characters</sub> …외 1 | apply<sub>10-characters</sub> applySharedArchive<sub>10-characters</sub> handleSettingsAndAudioAction<sub>10-characters</sub> pubContent<sub>10-characters</sub> …외 1 |  |  |  | 0/2 |
| [].voiceName |  | applySharedArchive<sub>10-characters</sub> pubContent<sub>10-characters</sub> shareDefinition<sub>10-characters</sub> | applySharedArchive<sub>10-characters</sub> handleSettingsAndAudioAction<sub>10-characters</sub> pubContent<sub>10-characters</sub> shareDefinition<sub>10-characters</sub> |  |  |  | 0/2 |
| [].weapon | artReuse<sub>10-characters</sub> fixWeaponPrompts<sub>10-characters</sub> | artReuse<sub>10-characters</sub> fix<sub>10-characters</sub> fixWeaponPrompts<sub>10-characters</sub> v2EnsureEquipment<sub>combat/070-equipment</sub> …외 2 | handleCharactersAction<sub>10-characters</sub> handleImagesAndAssetsAction<sub>10-characters</sub> v2EnsureEquipment<sub>combat/070-equipment</sub> v2GearAction<sub>combat/070-equipment</sub> …외 2 |  | c_weapon |  | 2/2 |

### dispatches.json — 파견

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| (파일 전체) | buildManualGameDraft<sub>10-newgame</sub> ngWorldExtras<sub>10-expedition</sub> | ngWorldExtras<sub>10-expedition</sub> |  |  |  |  | 2/2 |

### events.json — 이벤트

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| (파일 전체) | buildManualGameDraft<sub>10-newgame</sub> buildNewGameDraft<sub>10-newgame</sub> | aiEventGen0<sub>10-story</sub> | aiEventGen0<sub>10-story</sub> handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 0/2 |
| [].active |  | liveTick<sub>10-story</sub> seasonStart<sub>10-acquire</sub> |  |  |  |  | 0/2 |
| [].shop |  | normalizeEvents<sub>10-story</sub> |  |  |  |  | 0/2 |

### game.json — 나머지

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| __looks | buildNewGameDraft<sub>10-newgame</sub> |  |  |  |  |  | 0/2 |
| ver | buildManualGameDraft<sub>10-newgame</sub> buildNewGameDraft<sub>10-newgame</sub> |  |  |  |  |  | 2/2 |

### lib.json — 자료실(배경·소품·CG·적)

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| (파일 전체) | buildManualGameDraft<sub>10-newgame</sub> buildNewGameDraft<sub>10-newgame</sub> charToMonster<sub>10-world</sub> | addCGs<sub>10-art</sub> addLib<sub>10-art</sub> charToMonster<sub>10-world</sub> ensureChMap<sub>10-story</sub> …외 4 | addCGs<sub>10-art</sub> addLib<sub>10-art</sub> ensureChMap<sub>10-story</sub> handleNavigationAndToolsAction<sub>10-acquire</sub> …외 4 |  |  |  | 2/2 |
| [].affLines |  | regenParseCharacter<sub>10-art</sub> | regenParseCharacter<sub>10-art</sub> |  |  |  | 0/2 |
| [].alias |  | shTake<sub>10-art</sub> | shTake<sub>10-art</sub> |  |  |  | 1/2 |
| [].audio |  | storeAudio<sub>10-art</sub> | storeAudio<sub>10-art</sub> |  |  |  | 0/2 |
| [].cast |  |  | handleNavigationAndToolsAction<sub>10-acquire</sub> |  |  |  | 1/2 |
| [].cooldown |  | trainedSkill<sub>combat/030-core</sub> weakenGeneratedSkill<sub>combat/030-core</sub> |  |  |  |  | 0/2 |
| [].faction |  | regenParseCharacter<sub>10-art</sub> | regenParseCharacter<sub>10-art</sub> |  |  |  | 2/2 |
| [].files |  | regenParseCharacter<sub>10-art</sub> | regenParseCharacter<sub>10-art</sub> |  |  |  | 0/2 |
| [].id |  | conMakeVariant<sub>10-characters</sub> |  |  |  |  | 2/2 |
| [].img | artReuse<sub>10-characters</sub> | artReuse<sub>10-characters</sub> storeImage<sub>10-art</sub> | storeImage<sub>10-art</sub> |  |  |  | 0/2 |
| [].initial |  | trainedSkill<sub>combat/030-core</sub> |  |  |  |  | 0/2 |
| [].intro |  | regenParseCharacter<sub>10-art</sub> | regenParseCharacter<sub>10-art</sub> |  |  |  | 0/2 |
| [].lines |  | regenParseCharacter<sub>10-art</sub> | regenParseCharacter<sub>10-art</sub> |  |  |  | 0/2 |
| [].live |  | subscribe<sub>10-art</sub> | subscribe<sub>10-art</sub> |  |  |  | 0/2 |
| [].lockout |  | trainedSkill<sub>combat/030-core</sub> |  |  |  |  | 0/2 |
| [].naiPrompt |  | conMakeVariant<sub>10-characters</sub> regenParseCharacter<sub>10-art</sub> | regenParseCharacter<sub>10-art</sub> |  |  |  | 0/2 |
| [].name |  | conMakeVariant<sub>10-characters</sub> fix<sub>10-characters</sub> regenParseCharacter<sub>10-art</sub> | handleNavigationAndToolsAction<sub>10-acquire</sub> regenParseCharacter<sub>10-art</sub> |  |  |  | 2/2 |
| [].profile |  | regenParseCharacter<sub>10-art</sub> | regenParseCharacter<sub>10-art</sub> |  |  |  | 0/2 |
| [].prompt | artReuse<sub>10-characters</sub> | artReuse<sub>10-characters</sub> elCompose<sub>10-art</sub> ensureLibPrompts<sub>10-art</sub> shTake<sub>10-art</sub> | elCompose<sub>10-art</sub> ensureLibPrompts<sub>10-art</sub> handleCharactersAction<sub>10-characters</sub> handleNavigationAndToolsAction<sub>10-acquire</sub> …외 2 |  | l_imgperson |  | 2/2 |
| [].rarity |  | conMakeVariant<sub>10-characters</sub> |  |  |  |  | 0/2 |
| [].redraw |  | storeImage<sub>10-art</sub> | storeImage<sub>10-art</sub> |  |  |  | 0/2 |
| [].seed |  | storeImage<sub>10-art</sub> | storeImage<sub>10-art</sub> |  |  |  | 0/2 |
| [].shared |  | shTake<sub>10-art</sub> | shTake<sub>10-art</sub> |  |  |  | 0/2 |
| [].skills |  |  |  | balanceSkill<sub>combat/030-core</sub> balanceSlot<sub>combat/030-core</sub> |  |  | 0/2 |
| [].touch |  | regenParseCharacter<sub>10-art</sub> | regenParseCharacter<sub>10-art</sub> |  |  |  | 0/2 |
| [].triggerEvery |  | trainedSkill<sub>combat/030-core</sub> weakenGeneratedSkill<sub>combat/030-core</sub> |  |  |  |  | 0/2 |
| [].weapon |  | regenParseCharacter<sub>10-art</sub> | regenParseCharacter<sub>10-art</sub> |  |  |  | 0/2 |

### meta.json — 게임 설정·규칙(건조·포지션·밸런스·일정 …)

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| accent | buildManualGameDraft<sub>10-newgame</sub> buildNewGameDraft<sub>10-newgame</sub> |  | handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 2/2 |
| artNeg | artReuse<sub>10-characters</sub> meta<sub>10-newgame</sub> | artReuse<sub>10-characters</sub> meta<sub>10-newgame</sub> | handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 0/2 |
| artTags | artReuse<sub>10-characters</sub> meta<sub>10-newgame</sub> | artReuse<sub>10-characters</sub> bpRead<sub>10-liveops</sub> meta<sub>10-newgame</sub> | handleSetupAction<sub>10-art</sub> handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 0/2 |
| auditSeen | ngFinish<sub>10-liveops</sub> | ngFinish<sub>10-liveops</sub> openAudit<sub>10-liveops</sub> | openAudit<sub>10-liveops</sub> |  |  |  | 0/2 |
| balance | balanceOnCreate<sub>10-rules</sub> | balanceOnCreate<sub>10-rules</sub> | balSave<sub>10-rules</sub> |  |  |  | 0/2 |
| bestiary | bestiaryApply<sub>10-world</sub> | bestiaryApply<sub>10-world</sub> |  |  |  |  | 2/2 |
| bible | meta<sub>10-newgame</sub> | meta<sub>10-newgame</sub> |  |  |  |  | 0/2 |
| cast |  |  | fwRead<sub>10-characters</sub> |  |  |  | 0/2 |
| castSex | meta<sub>10-newgame</sub> | meta<sub>10-newgame</sub> | handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 0/2 |
| construct | conStartNew<sub>10-acquire</sub> | conSave<sub>10-acquire</sub> conStartNew<sub>10-acquire</sub> |  |  |  |  | 0/2 |
| design |  |  | handleNavigationAndToolsAction<sub>10-acquire</sub> |  |  |  | 0/2 |
| draft | meta<sub>10-newgame</sub> | meta<sub>10-newgame</sub> |  |  |  |  | 2/2 |
| elems | buildNewGameDraft<sub>10-newgame</sub> | rulesSave<sub>10-rules</sub> | handleStoryAndAuthoringAction<sub>10-story</sub> rulesSave<sub>10-rules</sub> |  |  |  | 2/2 |
| expedition | ngWorldExtras<sub>10-expedition</sub> | ngWorldExtras<sub>10-expedition</sub> |  |  |  |  | 0/2 |
| farms | ngWorldExtras<sub>10-expedition</sub> | ngWorldExtras<sub>10-expedition</sub> |  |  |  |  | 2/2 |
| logoStyle |  |  | handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 0/2 |
| manual | buildManualGameDraft<sub>10-newgame</sub> |  |  |  |  |  | 0/2 |
| persona | ngWorldExtras<sub>10-expedition</sub> | ngWorldExtras<sub>10-expedition</sub> | personaCfgSave<sub>10-characters</sub> |  |  |  | 0/2 |
| positions | apply<sub>10-rules</sub> buildNewGameDraft<sub>10-newgame</sub> | apply<sub>10-rules</sub> rulesSave<sub>10-rules</sub> | rulesSave<sub>10-rules</sub> |  | g_pos |  | 2/2 |
| prompts |  |  | pfSet<sub>10-promptstudio</sub> |  |  |  | 0/2 |
| pub |  | pubMeta<sub>10-system</sub> | pubMeta<sub>10-system</sub> |  |  |  | 0/2 |
| relProf | buildNewGameDraft<sub>10-newgame</sub> | memCatchUp<sub>10-world</sub> | handleStoryAndAuthoringAction<sub>10-story</sub> memCatchUp<sub>10-world</sub> |  |  |  | 2/2 |
| roles | buildNewGameDraft<sub>10-newgame</sub> |  |  |  |  |  | 2/2 |
| rules | buildNewGameDraft<sub>10-newgame</sub> | rulesAIFill<sub>10-rules</sub> rulesRename<sub>10-rules</sub> rulesSave<sub>10-rules</sub> | rulesAIFill<sub>10-rules</sub> rulesRename<sub>10-rules</sub> rulesSave<sub>10-rules</sub> |  |  |  | 2/2 |
| shop | meta<sub>10-newgame</sub> ngWorldExtras<sub>10-expedition</sub> | meta<sub>10-newgame</sub> ngWorldExtras<sub>10-expedition</sub> |  |  |  |  | 2/2 |
| spots | apply<sub>10-liveops</sub> spotsAuto<sub>10-liveops</sub> | apply<sub>10-liveops</sub> spotsAuto<sub>10-liveops</sub> |  |  |  |  | 0/2 |
| story | meta<sub>10-newgame</sub> | meta<sub>10-newgame</sub> | handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 2/2 |
| storyMemory |  |  |  | smRecord<sub>10-story</sub> |  |  | 2/2 |
| sub | buildManualGameDraft<sub>10-newgame</sub> buildNewGameDraft<sub>10-newgame</sub> |  | handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 2/2 |
| terms | meta<sub>10-newgame</sub> | meta<sub>10-newgame</sub> |  |  |  |  | 2/2 |
| theme | buildManualGameDraft<sub>10-newgame</sub> buildNewGameDraft<sub>10-newgame</sub> |  | handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 2/2 |
| title | buildManualGameDraft<sub>10-newgame</sub> buildNewGameDraft<sub>10-newgame</sub> |  | handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 2/2 |
| tone | meta<sub>10-newgame</sub> | meta<sub>10-newgame</sub> | handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 0/2 |
| variants | ngWorldExtras<sub>10-expedition</sub> | conSave<sub>10-acquire</sub> ngWorldExtras<sub>10-expedition</sub> |  |  |  |  | 0/2 |

### npcs.json — NPC

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| (파일 전체) | buildManualGameDraft<sub>10-newgame</sub> buildNewGameDraft<sub>10-newgame</sub> | apply<sub>10-characters</sub> addNpcs<sub>10-characters</sub> | apply<sub>10-characters</sub> addNpcs<sub>10-characters</sub> handleImagesAndAssetsAction<sub>10-characters</sub> |  |  |  | 1/2 |
| [].affLines |  | fix<sub>10-characters</sub> |  |  |  |  | 0/2 |
| [].faces | artReuse<sub>10-characters</sub> | artReuse<sub>10-characters</sub> fix<sub>10-characters</sub> |  |  |  |  | 0/2 |
| [].img | artReuse<sub>10-characters</sub> | artReuse<sub>10-characters</sub> |  |  |  |  | 0/2 |
| [].lines |  | fix<sub>10-characters</sub> |  |  |  |  | 0/2 |
| [].naiPrompt | artReuse<sub>10-characters</sub> | artReuse<sub>10-characters</sub> |  |  |  |  | 1/2 |
| [].npc |  | fix<sub>10-characters</sub> |  |  |  |  | 1/2 |
| [].skins |  | fix<sub>10-characters</sub> |  |  |  |  | 0/2 |
| [].touch |  | fix<sub>10-characters</sub> |  |  |  |  | 1/2 |
| [].upper | artReuse<sub>10-characters</sub> | artReuse<sub>10-characters</sub> fix<sub>10-characters</sub> |  |  |  |  | 1/2 |

### opening.json — 오프닝

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| (파일 전체) | buildManualGameDraft<sub>10-newgame</sub> buildNewGameDraft<sub>10-newgame</sub> |  |  |  |  |  | 2/2 |

### prog.json — 진행(플레이어)

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| (파일 전체) |  | handleNavigationAndToolsAction<sub>10-acquire</sub> |  |  |  |  | 2/2 |
| avatar | artReuse<sub>10-characters</sub> buildManualGameDraft<sub>10-newgame</sub> buildNewGameDraft<sub>10-newgame</sub> | artReuse<sub>10-characters</sub> handleNavigationAndToolsAction<sub>10-acquire</sub> playerDraw<sub>10-player</sub> readPlayerForm<sub>10-player</sub> |  |  |  |  | 0/2 |
| bio |  | readPlayerForm<sub>10-player</sub> |  |  |  |  | 0/2 |
| bootPrep |  | bpRead<sub>10-liveops</sub> handleNavigationAndToolsAction<sub>10-acquire</sub> |  |  |  |  | 0/2 |
| castDone | buildManualGameDraft<sub>10-newgame</sub> buildNewGameDraft<sub>10-newgame</sub> | handleImagesAndAssetsAction<sub>10-characters</sub> |  |  |  |  | 0/2 |
| cbuild | conStartNew<sub>10-acquire</sub> | conBuild<sub>10-acquire</sub> conSave<sub>10-acquire</sub> conStartNew<sub>10-acquire</sub> |  |  |  |  | 0/2 |
| cres | conStartNew<sub>10-acquire</sub> | conBuild<sub>10-acquire</sub> conBuy<sub>10-acquire</sub> conSave<sub>10-acquire</sub> conStartNew<sub>10-acquire</sub> …외 1 |  |  |  |  | 0/2 |
| csFull |  | handleCharactersAction<sub>10-characters</sub> |  |  |  |  | 0/2 |
| curBanner |  | addPickupFor<sub>10-acquire</sub> aiPickupStory<sub>10-acquire</sub> bannerStep<sub>10-acquire</sub> handleEconomyAction<sub>10-economy</sub> …외 4 |  |  |  |  | 0/2 |
| curEvent |  | aiEvent<sub>10-story</sub> handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  |  | 0/2 |
| cxBadge |  |  |  | cxBadgeSync<sub>10-world</sub> |  |  | 0/2 |
| cxSeen |  | cxMarkSeen<sub>10-world</sub> handleStoryAndAuthoringAction<sub>10-story</sub> |  | cxBadgeSync<sub>10-world</sub> |  |  | 0/2 |
| dboard |  | dispClaim<sub>10-expedition</sub> handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  |  | 0/2 |
| disp |  | dispEndAll<sub>10-expedition</sub> |  |  |  |  | 0/2 |
| dm |  | bump<sub>10-economy</sub> handleNavigationAndToolsAction<sub>10-acquire</sub> |  |  |  |  | 2/2 |
| exped |  | exAssign<sub>10-expedition</sub> exBizSettle<sub>10-expedition</sub> exClaim<sub>10-expedition</sub> exLibSettle<sub>10-expedition</sub> …외 4 |  |  |  |  | 0/2 |
| fcAff |  | fcAfterReply<sub>10-messenger</sub> |  |  |  |  | 0/2 |
| fchat |  | fcOf<sub>10-messenger</sub> handleMessengerAction<sub>10-messenger</sub> roomDel<sub>10-messenger</sub> |  |  |  |  | 0/2 |
| fcPhoto |  | handleMessengerAction<sub>10-messenger</sub> |  |  |  |  | 0/2 |
| firstTen |  | pull<sub>10-acquire</sub> |  |  |  |  | 2/2 |
| flags |  | storyFlag<sub>10-liveops</sub> |  |  |  |  | 0/2 |
| gateSeen |  | gateCheck<sub>10-acquire</sub> |  |  |  |  | 0/2 |
| gems |  | giveReward<sub>10-economy</sub> pay<sub>10-economy</sub> |  |  |  |  | 2/2 |
| gender | buildNewGameDraft<sub>10-newgame</sub> | readPlayerForm<sub>10-player</sub> |  |  |  |  | 0/2 |
| genderTxt |  | readPlayerForm<sub>10-player</sub> |  |  |  |  | 0/2 |
| gifts |  | addGifts<sub>10-characters</sub> handleCharactersAction<sub>10-characters</sub> |  |  |  |  | 0/2 |
| gold |  | enhance<sub>10-economy</sub> giveReward<sub>10-economy</sub> handleStoryAndAuthoringAction<sub>10-story</sub> pay<sub>10-economy</sub> …외 1 |  |  |  |  | 2/2 |
| guar |  | pityGet<sub>10-acquire</sub> rollOne<sub>10-acquire</sub> |  |  |  |  | 0/2 |
| hideEyes |  | readPlayerForm<sub>10-player</sub> |  |  |  |  | 2/2 |
| hist2 |  | grantOwned<sub>10-acquire</sub> rollOne<sub>10-acquire</sub> |  |  |  |  | 0/2 |
| history |  | grantOwned<sub>10-acquire</sub> |  |  |  |  | 0/2 |
| lobbyBg | buildManualGameDraft<sub>10-newgame</sub> buildNewGameDraft<sub>10-newgame</sub> |  |  |  |  |  | 2/2 |
| lobbyMode |  | handleImagesAndAssetsAction<sub>10-characters</sub> |  |  |  |  | 0/2 |
| look |  | readPlayerForm<sub>10-player</sub> |  |  |  |  | 2/2 |
| mail |  | mailClean<sub>10-economy</sub> mailOpen<sub>10-economy</sub> mailRemove<sub>10-economy</sub> sendMail<sub>10-economy</sub> |  |  |  |  | 0/2 |
| mailBuild |  |  |  | mailTick<sub>10-economy</sub> |  |  | 0/2 |
| mailInit |  |  |  | mailTick<sub>10-economy</sub> |  |  | 0/2 |
| pass |  | handleEconomyAction<sub>10-economy</sub> liveTick<sub>10-story</sub> |  |  |  |  | 2/2 |
| pities |  | pityGet<sub>10-acquire</sub> |  |  |  |  | 0/2 |
| pity |  | pitySet<sub>10-acquire</sub> |  |  |  |  | 2/2 |
| player |  | readPlayerForm<sub>10-player</sub> |  |  |  |  | 0/2 |
| prepAsked |  | bpRead<sub>10-liveops</sub> handleNavigationAndToolsAction<sub>10-acquire</sub> prepAsk<sub>10-liveops</sub> |  |  |  |  | 0/2 |
| prepNever |  | handleNavigationAndToolsAction<sub>10-acquire</sub> |  |  |  |  | 0/2 |
| presets |  | handleCombatAndFormationAction<sub>10-challenge</sub> |  |  |  |  | 0/2 |
| prompt |  | handleNavigationAndToolsAction<sub>10-acquire</sub> |  |  |  |  | 0/2 |
| raid |  | handleCombatAndFormationAction<sub>10-challenge</sub> raidSettle<sub>10-challenge</sub> |  |  |  |  | 0/2 |
| rogue |  | dgMove<sub>10-challenge</sub> drawCardArts<sub>10-characters</sub> handleCombatAndFormationAction<sub>10-challenge</sub> handleNavigationAndToolsAction<sub>10-acquire</sub> …외 6 |  | rogueTick<sub>10-challenge</sub> |  |  | 0/2 |
| scene | buildNewGameDraft<sub>10-newgame</sub> | handleSettingsAndAudioAction<sub>10-characters</sub> |  |  |  |  | 2/2 |
| sched |  | schedVisit<sub>10-liveops</sub> |  |  |  |  | 0/2 |
| sec |  | grantOwned<sub>10-acquire</sub> |  |  |  |  | 0/2 |
| seen |  | handleNavigationAndToolsAction<sub>10-acquire</sub> |  |  |  |  | 0/2 |
| seenOpening |  |  |  | afterPrologue<sub>10-story</sub> |  |  | 2/2 |
| shop |  | handleEconomyAction<sub>10-economy</sub> |  |  |  |  | 2/2 |
| skinOwn |  | handleNavigationAndToolsAction<sub>10-acquire</sub> |  |  |  |  | 0/2 |
| sortie |  | sortieBegin<sub>10-battle</sub> sortieEnd<sub>10-battle</sub> sortieNodeSettle<sub>10-battle</sub> sortieParts<sub>10-battle</sub> |  |  |  |  | 0/2 |
| spark |  | rollOne<sub>10-acquire</sub> |  |  |  |  | 0/2 |
| squad |  | grantOwned<sub>10-acquire</sub> handleCombatAndFormationAction<sub>10-challenge</sub> joinChar<sub>10-characters</sub> |  |  |  |  | 0/2 |
| stam |  | handleStoryAndAuthoringAction<sub>10-story</sub> stamUse<sub>10-economy</sub> |  |  |  |  | 0/2 |
| stars |  | modeClear<sub>10-battle</sub> stageSettle<sub>10-battle</sub> |  |  |  |  | 0/2 |
| titleBg | buildNewGameDraft<sub>10-newgame</sub> |  |  |  |  |  | 2/2 |
| tower |  | towerSettle<sub>10-challenge</sub> |  |  |  |  | 0/2 |
| useCg |  | handleNavigationAndToolsAction<sub>10-acquire</sub> |  |  |  |  | 0/2 |

### rels.json — 관계

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| (파일 전체) | buildNewGameDraft<sub>10-newgame</sub> relPut<sub>10-world</sub> | relKeep<sub>10-world</sub> relPut<sub>10-world</sub> | handleStoryAndAuthoringAction<sub>10-story</sub> relKeep<sub>10-world</sub> |  |  |  | 2/2 |

### threads.json — 메신저(톡)

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| (파일 전체) | buildManualGameDraft<sub>10-newgame</sub> buildNewGameDraft<sub>10-newgame</sub> | apply<sub>10-messenger</sub> apply<sub>10-characters</sub> addThreads<sub>10-messenger</sub> prune<sub>10-messenger</sub> …외 1 | apply<sub>10-characters</sub> addThreads<sub>10-messenger</sub> handleMessengerAction<sub>10-messenger</sub> handleStoryAndAuthoringAction<sub>10-story</sub> …외 2 |  |  |  | 2/2 |
| [].added |  |  | handleMessengerAction<sub>10-messenger</sub> |  |  |  | 0/2 |
| [].charId |  | repairRefs<sub>10-acquire</sub> | handleMessengerAction<sub>10-messenger</sub> |  |  |  | 2/2 |
| [].id |  |  | handleMessengerAction<sub>10-messenger</sub> |  |  |  | 2/2 |
| [].needOwn |  |  | handleMessengerAction<sub>10-messenger</sub> |  |  |  | 2/2 |
| [].script |  |  | handleMessengerAction<sub>10-messenger</sub> |  |  |  | 2/2 |
| [].title |  |  | handleMessengerAction<sub>10-messenger</sub> |  |  |  | 2/2 |
| [].trigger |  |  | handleMessengerAction<sub>10-messenger</sub> |  |  |  | 2/2 |

### world.json — 세계관(세력·도감·설정)

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| codex | cxPut<sub>10-world</sub> cxUpsert<sub>10-world</sub> | cxKeep<sub>10-world</sub> cxPut<sub>10-world</sub> cxUpsert<sub>10-world</sub> | cxKeep<sub>10-world</sub> |  |  |  | 1/2 |
| codexNotes |  | cxNoteAdd<sub>10-world</sub> | cxNoteAdd<sub>10-world</sub> |  |  |  | 0/2 |
| factions | buildManualGameDraft<sub>10-newgame</sub> buildNewGameDraft<sub>10-newgame</sub> factionSync<sub>10-world</sub> | factionSync<sub>10-world</sub> regenApply<sub>10-characters</sub> | handleStoryAndAuthoringAction<sub>10-story</sub> regenApply<sub>10-characters</sub> |  |  |  | 2/2 |
| lore | buildManualGameDraft<sub>10-newgame</sub> buildNewGameDraft<sub>10-newgame</sub> |  | handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 2/2 |
| name | buildManualGameDraft<sub>10-newgame</sub> |  | handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 2/2 |
| plan |  | apply<sub>10-story</sub> | apply<sub>10-story</sub> planRead<sub>10-story</sub> |  |  |  | 0/2 |
| plot | buildManualGameDraft<sub>10-newgame</sub> |  | handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 2/2 |
| source | buildManualGameDraft<sub>10-newgame</sub> buildNewGameDraft<sub>10-newgame</sub> |  |  |  |  |  | 0/2 |
| summary | buildManualGameDraft<sub>10-newgame</sub> buildNewGameDraft<sub>10-newgame</sub> |  | handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 2/2 |

## 2. index.html 기능 표면 → 기능 단위 → 얽힌 모듈

산출물 index.html이 사용자에게 보여 주고 수행하는 기능을 코드에서 뽑은 분류(지금 모듈 구조는 기준이 아님 — 원안 한 파일을 고려 없이 나눈 것이라 대어 보는 대상): 아래 탭(메뉴) → 화면(경로표)·설정 하위 화면의 패널 → 창(openModal) + 배경(새 게임 생성·실행 중 AI·불러오기·앱 시작). 한 화면에서만 여는 창은 그 화면 안, 여러 단위가 여는 창은 공용 창. 함수는 동작(data-act → 처리기)과 호출을 따라 **가장 가까운 기능 단위**에 붙임(같은 거리면 같이 씀 — 공용·엔진). 「함수」 = 그 단위에서만 닿는 함수 수

### 배경(누르지 않아도 하는 일)

| 기능 단위 | 종류 | 함수 | 얽힌 모듈(함수 수) | 안의 창 |
|---|---|---|---|---|
| 새 게임 생성 | 배경 | 482 | 10-characters 130, 00-core 75, 10-newgame 64, 10-system 36, 90-load 35 …외 14 |  |
| 실행 중 AI | 배경 | 280 | 10-characters 51, 10-messenger 44, 10-story 43, 00-core 39, 10-liveops 34 …외 10 |  |
| 불러오기 | 배경 | 32 | 10-characters 13, 10-story 5, 00-core 3, 10-rules 3, 10-acquire 2 …외 3 |  |
| 앱 시작 | 배경 | 9 | 90-load 6, 00-core 1, 10-world 1, 80-misc 1 |  |

## 3. 계층(MVC) — 모듈마다 View · Controller · Model, 섞인 함수, 방향 위반

기준(CLAUDE.md §0-2, docs/research/developer-role.md 1-1 — 함수 자신이 하는 일로 판정, lib/arch.mjs): View = HTML 마크업 글을 만들거나 DOM을 바꿈 · Controller = 액션 처리기 또는 화면 갱신(render·toast·openModal·closeModal)을 부름 · Model = 게임 상태를 씀·저장소 쓰기·네트워크·AI·그림 서비스 또는 화면과 관계없는 계산·조회 · **섞임** = 한 함수가 화면을 만들면서 상태·저장·서비스를 직접 씀. **방향 위반** = View가 상태·저장·서비스를 바꾸는 함수를 부름(그리다가 바꿈) · Model이 화면을 만드는 함수를 부름. src/main 함수: View 479 · Controller 156 · Model 1193 · 섞임 8 · 방향 위반 64

| 모듈 | View | Controller | Model | 섞임 | 방향 위반 | 섞인 함수(예) | 방향 위반(예) |
|---|---|---|---|---|---|---|---|
| 00-core | 70 | 21 | 131 | 1 | 17 | checkUpdatePrivate | aiJSON→toast, naiGenerate→toast, designAI→aiJSON |
| 10-system | 60 | 22 | 140 | 0 | 15 |  | aiCall→toast, applyWebUpdate→reloadGame, reloadGame→flush |
| 10-characters | 89 | 25 | 198 | 3 | 7 | handleImagesAndAssetsAction, handleCharactersAction, handleSettingsAndAudioAction | openPresetCode→saveLlm, openPresetCode→saveUserPacks, imgTarget→openChar |
| 10-story | 46 | 12 | 88 | 1 | 8 | handleStoryAndAuthoringAction | aiChapterGen0→genStep, aiEventGen0→genStep, bootSync→pcApi |
| 10-acquire | 25 | 9 | 36 | 1 | 5 | handleNavigationAndToolsAction | seasonStart→liveBar, seasonStart→artAfterAI, puxGo→puxRead |
| 10-challenge | 27 | 11 | 52 | 0 | 4 |  | dgMove→dgHeroWalk, rogueTick→openRgResult, rgBattle→startStage |
| 10-economy | 22 | 4 | 23 | 1 | 2 | handleEconomyAction | stamUse→openStam, stamUse→updStam |
| 10-art | 30 | 5 | 61 | 0 | 2 |  | showCast→castRun, bootPrepRun→runPrep |
| 10-messenger | 19 | 2 | 27 | 1 | 1 | handleMessengerAction | openPhone→openThread |
| 10-battle | 8 | 6 | 15 | 0 | 1 |  | sortieMap→sortieParts |
| 10-liveops | 15 | 15 | 58 | 0 | 1 |  | updateAPKRequired→updateCheckRecord |
| 10-promptstudio | 3 | 0 | 13 | 0 | 1 |  | pstPolish→aiJSON |

## 4. 기능(같은 데이터·처리) ↔ 화면 · 모듈 판정

기능 = Model·Controller 함수를 호출과 같은 상태 키·data 경로·저장소 키로 이어 모듈성 최대화로 묶은 것(순서를 바꿔 6번 — 과반이 같이 묶인 것만, 경계는 빼고), View 함수는 부르는 Model·Controller의 기능으로 이음. 화면 = 그 기능의 함수에 닿는 index.html 기능 단위(2절). 이름(아래 판정 표) = 그 기능이 가장 많이 쓰는 데이터(여러 기능이 다 쓰는 데이터는 뺌)

| 기능 | 함수 | 주로 쓰는 데이터 | 계층(View·Controller·Model·섞임) | 이어진 화면(닿는 함수 수) | 모듈(함수 수) |
|---|---|---|---|---|---|
| F01 | 218 | lib.json › [].prompt · prog.json › avatar · chars.json › [].skins | 72·25·117·4 | 새 게임 생성 130, 실행 중 AI 21, 불러오기 2 | 10-characters 64, 00-core 38, 10-art 25, 90-load 22, 80-misc 14 …외 11 |
| F02 | 120 | chapters.json · chapters.json › [].relScan · lib.json | 22·3·94·1 | 실행 중 AI 61, 새 게임 생성 33, 앱 시작 8, 불러오기 2 | 10-story 37, 10-characters 22, 00-core 22, 10-world 10, 10-newgame 10 …외 7 |
| F03 | 103 | chars.json › [].skillBalance · chars.json › [].skills · chars.json › [].weapon | 32·10·61·0 | 새 게임 생성 38, 불러오기 12, 실행 중 AI 9 | 10-characters 40, 00-core 14, 10-art 11, 10-system 8, 10-story 8 …외 8 |
| F04 | 101 | prog.json › sortie · chapters.json › [].stages[].enemies · prog.json › gold | 16·18·67·0 | 새 게임 생성 14, 불러오기 5, 실행 중 AI 2 | 10-battle 23, 10-challenge 21, 10-story 14, 10-characters 11, 00-core 8 …외 7 |
| F05 | 96 | prog.json › fchat · threads.json · prog.json › fcAff | 42·4·49·1 | 실행 중 AI 67, 새 게임 생성 24 | 10-messenger 43, 00-core 15, 10-characters 9, 10-system 7, 10-story 4 …외 7 |
| F06 | 95 | 저장소 ggm-picked · 저장소 ggm-sync · 저장소 ggm-sync-idx | 22·15·58·0 | 새 게임 생성 9, 실행 중 AI 1 | 10-system 82, 10-newgame 4, 00-core 4, 10-art 2, 10-story 2 …외 1 |
| F07 | 87 | banners.json · chapters.json · chars.json | 10·3·74·0 | 새 게임 생성 60, 불러오기 2, 실행 중 AI 2 | 10-newgame 31, 10-world 14, 00-core 9, 10-characters 8, 10-rules 5 …외 7 |
| F08 | 84 | 저장소 starfall-nai · 저장소 starfall-sound · 저장소 starfall-ai-profiles | 24·3·56·1 | 새 게임 생성 17, 실행 중 AI 2 | 10-system 28, 00-core 15, 10-characters 14, 10-art 11, 80-misc 4 …외 6 |
| F09 | 71 | world.json › codex · prog.json › cxSeen · world.json › plan | 14·2·55·0 | 실행 중 AI 6, 새 게임 생성 6, 불러오기 4 | 10-world 40, 10-story 19, 10-characters 3, 00-core 3, 10-art 2 …외 3 |
| F10 | 70 | prog.json › rogue · prog.json › presets · prog.json › raid | 25·8·37·0 |  | 10-challenge 54, 10-system 8, 00-core 6, 10-player 1, 10-story 1 |
| F11 | 69 | prog.json › curBanner · banners.json · banners.json › [].pickup | 16·8·45·0 | 실행 중 AI 34, 새 게임 생성 7, 불러오기 1, 앱 시작 1 | 10-acquire 21, 10-liveops 21, 10-characters 6, 00-core 4, 10-economy 4 …외 7 |
| F12 | 62 | chars.json › [].atk · chars.json › [].def · chars.json › [].hp | 16·6·40·0 | 새 게임 생성 21, 불러오기 5, 실행 중 AI 1 | 10-rules 33, 10-characters 11, 00-core 6, 90-load 5, 10-challenge 3 …외 3 |
| F13 | 52 | lib.json · lib.json › [].prompt · chars.json › [].voiceId | 14·7·31·0 | 새 게임 생성 12, 실행 중 AI 9 | 10-system 25, 10-art 17, 00-core 4, 90-load 2, 10-world 1 …외 3 |
| F14 | 42 | prog.json › mail · 저장소 ggm-upd-notes · chars.json › [].upper | 12·9·20·1 | 실행 중 AI 3, 새 게임 생성 1 | 10-liveops 13, 10-economy 13, 00-core 7, 10-story 3, 10-system 2 …외 3 |
| F15 | 38 | prog.json › cres · prog.json › cbuild · chars.json | 13·4·21·0 | 실행 중 AI 7, 새 게임 생성 3 | 10-acquire 23, 10-characters 9, 00-core 2, 90-load 2, 10-liveops 1 …외 1 |
| F16 | 38 | meta.json › auditSeen · meta.json › rules | 3·5·30·0 | 실행 중 AI 18, 새 게임 생성 7 | 10-liveops 13, 10-system 7, 10-story 7, 10-rules 4, 00-core 3 …외 4 |
| F17 | 38 | prog.json › exped · prog.json › disp · prog.json › dm | 9·7·22·0 |  | 10-expedition 31, 10-characters 3, 90-load 3, 10-economy 1 |
| F18 | 37 | chars.json › [].debut · chars.json › [].faction · meta.json › cast | 3·1·33·0 | 새 게임 생성 9, 실행 중 AI 4 | 10-world 30, 10-characters 4, 10-acquire 2, 10-art 1 |
| F19 | 33 | meta.json › artNeg · meta.json › artTags · meta.json › bible | 8·3·22·0 | 새 게임 생성 6, 실행 중 AI 1 | 10-story 11, 10-promptstudio 6, 90-load 3, 10-player 3, 10-newgame 3 …외 4 |
| F20 | 31 |  | 2·4·25·0 | 새 게임 생성 3 | 10-newgame 17, 10-characters 9, 00-core 3, 80-misc 1, 90-load 1 |
| F21 | 30 | chars.json › [].persona · chars.json › [].pfields · meta.json › persona | 4·5·21·0 | 실행 중 AI 20, 새 게임 생성 6 | 10-characters 27, 90-load 2, 00-core 1 |
| F22 | 28 | 저장소 ggm-voice-ja | 9·1·18·0 | 새 게임 생성 18, 실행 중 AI 6 | 10-system 9, 10-characters 7, 10-story 6, 90-load 2, 00-core 2 …외 2 |
| F23 | 26 |  | 7·0·19·0 | 실행 중 AI 19, 새 게임 생성 11, 불러오기 8 | 10-characters 11, 10-liveops 8, 00-core 5, 80-misc 2 |
| F24 | 14 | meta.json › spots | 1·0·13·0 |  | 10-liveops 14 |
| F25 | 6 |  | 3·0·3·0 | 새 게임 생성 6 | 10-liveops 3, 00-core 2, 80-misc 1 |
| F26 | 5 |  | 0·0·5·0 |  | 10-characters 4, 00-core 1 |
| F27 | 4 |  | 2·0·2·0 |  | 10-story 2, 90-load 2 |
| F28 | 3 |  | 1·0·2·0 | 새 게임 생성 1 | 10-system 3 |
| F29 | 3 |  | 0·1·2·0 | 새 게임 생성 3 | 10-newgame 3 |
| F30 | 3 |  | 1·0·2·0 | 새 게임 생성 3 | 00-core 1, 80-misc 1, 10-liveops 1 |
| F31 | 2 |  | 0·0·2·0 |  | 00-core 1, 10-challenge 1 |
| F32 | 2 |  | 0·0·2·0 |  | 10-system 2 |

### 모듈 판정 — src/main 모듈 20: 고유 4 · 조각 1 · 흩어짐 9 · 슈퍼 5 · 기반 0 · 분배 0 · 층 1

기준(코드 냄새 — docs/research/developer-role.md 1-3): 슈퍼 = 관계없는 기능 둘 이상이 각각 함수 max(3, 20%)↑(발산적 변경 → 기능별로 나눔) · 조각 = 중심 기능의 함수가 다른 모듈에 2배↑(게으른 모듈 → 그 모듈로 합침) · 흩어짐 = 어느 기능도 절반이 안 되고 셋 이상에 나뉨(함수마다 제 기능 모듈로) · 기반 = 허브 함수(25개↑ 함수가 부름) 중심 · 분배 = 액션 분배기 층 · 층 = 프롬프트 스튜디오(사용자 지시로 모든 기능의 프롬프트를 취합) — 분배·층은 판정 대상 아님. 기능 하나 = 모듈 하나(사용자 결정)이고 그 안에서 계층은 함수 단위로 가름(3절). `node tools/map.mjs --why <모듈>`로 근거

| 모듈 | 판정 | 함수 | 기능(함수 수) | 나눌·합칠·보낼 곳 |
|---|---|---|---|---|
| 00-core | 흩어짐 | 223 | lib.json › [].prompt 38, chapters.json 22, prog.json › fchat 15 | lib.json › [].prompt 38 → 10-characters / chapters.json 22 → 10-story / prog.json › fchat 15 → 10-messenger / 저장소 starfall-nai 15 → 10-system / chars.json › [].skillBalance 14 → 10-characters / banners.json 9 → 10-newgame / prog.json › sortie 8 → 10-battle / prog.json › mail 7 → 10-liveops / chars.json › [].atk 6 → 10-rules / prog.json › rogue 6 → 10-challenge / 실행 중 AI 5 → 10-characters / prog.json › curBanner 4 → 10-acquire / lib.json 4 → 10-system / 저장소 ggm-picked 4 → 10-system / world.json › codex 3 → 10-world / meta.json › auditSeen 3 → 10-liveops / 새 게임 생성 3 → 10-newgame / prog.json › cres 2 → 10-acquire / 저장소 ggm-voice-ja 2 → 10-system / 새 게임 생성 2 → 10-liveops / v2DesignContext 1 → 10-characters / 새 게임 생성 1 → 여기 / bossPatText 1 → 여기 / chars.json › [].persona 1 → 10-characters |
| 10-acquire | 슈퍼 | 71 | prog.json › cres 23, prog.json › curBanner 21, lib.json › [].prompt 12 | prog.json › cres 23 → 여기 / prog.json › curBanner 21 → 여기 |
| 10-art | 슈퍼 | 96 | lib.json › [].prompt 25, lib.json 17, 저장소 starfall-nai 11 | lib.json › [].prompt 25 → 10-characters / lib.json 17 → 10-system |
| 10-battle | 고유 | 29 | prog.json › sortie 23, chapters.json 2, meta.json › artNeg 1 |  |
| 10-challenge | 슈퍼 | 90 | prog.json › rogue 54, prog.json › sortie 21, chars.json › [].skillBalance 3 | prog.json › rogue 54 → 여기 / prog.json › sortie 21 → 10-battle |
| 10-characters | 흩어짐 | 315 | lib.json › [].prompt 64, chars.json › [].skillBalance 40, chars.json › [].persona 27 | lib.json › [].prompt 64 → 여기 / chars.json › [].skillBalance 40 → 여기 / chars.json › [].persona 27 → 여기 / chapters.json 22 → 10-story / 저장소 starfall-nai 14 → 10-system / 실행 중 AI 11 → 여기 / prog.json › sortie 11 → 10-battle / chars.json › [].atk 11 → 10-rules / prog.json › fchat 9 → 10-messenger / 새 게임 생성 9 → 10-newgame / prog.json › cres 9 → 10-acquire / banners.json 8 → 10-newgame / 저장소 ggm-voice-ja 7 → 10-system / prog.json › curBanner 6 → 10-acquire / v2DesignContext 4 → 여기 / chars.json › [].debut 4 → 10-world / prog.json › exped 3 → 10-expedition / world.json › codex 3 → 10-world / lib.json 1 → 10-system / prog.json › mail 1 → 10-liveops |
| 10-economy | 흩어짐 | 50 | prog.json › mail 13, lib.json › [].prompt 7, chars.json › [].skillBalance 7 | prog.json › mail 13 → 10-liveops / lib.json › [].prompt 7 → 10-characters / chars.json › [].skillBalance 7 → 10-characters / prog.json › sortie 6 → 10-battle / prog.json › curBanner 4 → 10-acquire / prog.json › fchat 1 → 10-messenger / banners.json 1 → 10-newgame / 저장소 ggm-voice-ja 1 → 10-system / prog.json › exped 1 → 10-expedition |
| 10-expedition | 고유 | 37 | prog.json › exped 31, prog.json › sortie 2, prog.json › curBanner 2 |  |
| 10-liveops | 흩어짐 | 88 | prog.json › curBanner 21, meta.json › spots 14, meta.json › auditSeen 13 | prog.json › curBanner 21 → 10-acquire / meta.json › spots 14 → 여기 / meta.json › auditSeen 13 → 여기 / prog.json › mail 13 → 여기 / 실행 중 AI 8 → 10-characters / 새 게임 생성 3 → 여기 / lib.json › [].prompt 3 → 10-characters / chapters.json 2 → 10-story / prog.json › sortie 2 → 10-battle / chars.json › [].skillBalance 2 → 10-characters / prog.json › fchat 1 → 10-messenger / prog.json › cres 1 → 10-acquire / 새 게임 생성 1 → 00-core |
| 10-messenger | 고유 | 49 | prog.json › fchat 43, chapters.json 2, lib.json › [].prompt 1 |  |
| 10-newgame | 흩어짐 | 96 | banners.json 31, 새 게임 생성 17, lib.json › [].prompt 10 | banners.json 31 → 여기 / 새 게임 생성 17 → 여기 / lib.json › [].prompt 10 → 10-characters / chapters.json 10 → 10-story / 저장소 ggm-picked 4 → 10-system / meta.json › artNeg 3 → 10-story / prog.json › fchat 3 → 10-messenger / 새 게임 생성 3 → 여기 / prog.json › sortie 3 → 10-battle / 저장소 starfall-nai 1 → 10-system / chars.json › [].skillBalance 1 → 10-characters / prog.json › cres 1 → 10-acquire |
| 10-player | 슈퍼 | 15 | lib.json › [].prompt 4, meta.json › artNeg 3, 저장소 starfall-nai 2 | lib.json › [].prompt 4 → 10-characters / meta.json › artNeg 3 → 10-story |
| 10-promptstudio | 층 | 16 | meta.json › artNeg 6, lib.json › [].prompt 4, 저장소 starfall-nai 3 |  |
| 10-rules | 고유 | 46 | chars.json › [].atk 33, banners.json 5, meta.json › auditSeen 4 |  |
| 10-story | 흩어짐 | 147 | chapters.json 37, world.json › codex 19, prog.json › sortie 14 | chapters.json 37 → 여기 / world.json › codex 19 → 10-world / prog.json › sortie 14 → 10-battle / meta.json › artNeg 11 → 여기 / chars.json › [].skillBalance 8 → 10-characters / meta.json › auditSeen 7 → 10-liveops / 저장소 ggm-voice-ja 6 → 10-system / lib.json › [].prompt 6 → 10-characters / banners.json 5 → 10-newgame / prog.json › fchat 4 → 10-messenger / prog.json › curBanner 3 → 10-acquire / prog.json › mail 3 → 10-liveops / titleLines 2 → 여기 / 저장소 ggm-picked 2 → 10-system / 저장소 starfall-nai 2 → 10-system / lib.json 1 → 10-system / prog.json › rogue 1 → 10-challenge |
| 10-system | 흩어짐 | 222 | 저장소 ggm-picked 82, 저장소 starfall-nai 28, lib.json 25 | 저장소 ggm-picked 82 → 여기 / 저장소 starfall-nai 28 → 여기 / lib.json 25 → 여기 / 저장소 ggm-voice-ja 9 → 여기 / chars.json › [].skillBalance 8 → 10-characters / prog.json › rogue 8 → 10-challenge / prog.json › fchat 7 → 10-messenger / meta.json › auditSeen 7 → 10-liveops / lib.json › [].prompt 6 → 10-characters / prog.json › sortie 5 → 10-battle / 새 게임 생성 3 → 여기 / chapters.json 3 → 10-story / banners.json 3 → 10-newgame / meta.json › artNeg 2 → 10-story / crc32 2 → 여기 / prog.json › mail 2 → 10-liveops / chars.json › [].atk 2 → 10-rules / prog.json › curBanner 2 → 10-acquire |
| 10-world | 슈퍼 | 100 | world.json › codex 40, chars.json › [].debut 30, banners.json 14 | world.json › codex 40 → 여기 / chars.json › [].debut 30 → 여기 |
| 80-misc | 흩어짐 | 55 | lib.json › [].prompt 14, 저장소 starfall-nai 4, prog.json › fchat 4 | lib.json › [].prompt 14 → 10-characters / 저장소 starfall-nai 4 → 10-system / prog.json › fchat 4 → 10-messenger / chapters.json 2 → 10-story / 실행 중 AI 2 → 10-characters / 새 게임 생성 1 → 10-newgame / banners.json 1 → 10-newgame / 새 게임 생성 1 → 00-core / meta.json › auditSeen 1 → 10-liveops / 새 게임 생성 1 → 10-liveops / chars.json › [].skillBalance 1 → 10-characters / 저장소 ggm-voice-ja 1 → 10-system |
| 90-load | 흩어짐 | 90 | lib.json › [].prompt 22, banners.json 5, chars.json › [].skillBalance 5 | lib.json › [].prompt 22 → 10-characters / banners.json 5 → 10-newgame / chars.json › [].skillBalance 5 → 10-characters / chars.json › [].atk 5 → 10-rules / prog.json › fchat 4 → 10-messenger / chapters.json 4 → 10-story / prog.json › sortie 4 → 10-battle / prog.json › curBanner 3 → 10-acquire / prog.json › exped 3 → 10-expedition / meta.json › artNeg 3 → 10-story / 저장소 starfall-nai 2 → 10-system / lib.json 2 → 10-system / 저장소 ggm-voice-ja 2 → 10-system / world.json › codex 2 → 10-world / chars.json › [].persona 2 → 10-characters / prog.json › cres 2 → 10-acquire / prog.json › mail 2 → 10-liveops / titleLines 2 → 10-story / meta.json › auditSeen 1 → 10-liveops / 새 게임 생성 1 → 10-newgame |
| 95-start | 조각 | 1 | lib.json 1 | → 10-system (lib.json 1/25) |

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
| ggm-devid | 기기 | 씀 | devId, devIdEnsure |
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
| starfall-ai | 예전 키(옮기기만) | 읽기만 | aipLegacy |
| starfall-ai-profiles | 비밀(PC 서버에만) | 씀 | AIP, aipMigrate, saveAIP |
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
| src/boot/durable-storage | 4571~4618 | 3 |  |  |  |
| src/boot/head | 6~23 | 1 |  |  |  |
| src/boot/storage-boot | 17257~17291 | 4 |  |  |  |
| 00-core | 4621~5935 | 223 |  |  | 90-load 170, 10-characters 96, 10-system 65, 10-art 61, 10-newgame 30 |
| 10-acquire | 5936~6575 | 71 | 실행기 79 · 편집기 15 · 생성기 3 | banners.json, banners.json › [].active, banners.json › [].alt, banners.json › [].bg, banners.json › [].collab, banners.json › [].desc …외 47 | 00-core 122, 90-load 100, 10-characters 41, 10-system 38, 10-story 14 |
| 10-art | 6576~7209 | 96 | 실행기 24 · 편집기 25 | lib.json, lib.json › [].affLines, lib.json › [].alias, lib.json › [].audio, lib.json › [].faction, lib.json › [].files …외 14 | 00-core 128, 90-load 80, 10-system 24, 10-characters 19, 10-newgame 8 |
| 10-battle | 7210~7343 | 29 | 실행기 6 | prog.json › sortie, prog.json › stars | 90-load 28, 00-core 24, 10-characters 15, 10-system 7, 10-economy 4 |
| 10-challenge | 7344~7879 | 90 | 실행기 13 · 기타 1 | prog.json › presets, prog.json › raid, prog.json › rogue, prog.json › squad, prog.json › tower | 00-core 85, 90-load 57, 10-system 22, 10-characters 18, 10-art 8 |
| 10-characters | 7880~10027 | 315 | 실행기 157 · 편집기 98 · 생성기 20 | chars.json, chars.json › [].affLines, chars.json › [].age, chars.json › [].alt, chars.json › [].altCanon, chars.json › [].atk …외 86 | 00-core 367, 90-load 266, 10-system 77, 10-art 46, 10-world 26 |
| 10-economy | 10028~10316 | 50 | 실행기 16 · 기타 2 | prog.json › cres, prog.json › curBanner, prog.json › dm, prog.json › gems, prog.json › gold, prog.json › mail …외 5 | 90-load 85, 00-core 75, 10-characters 20, 10-system 19, 10-art 8 |
| 10-expedition | 10317~10473 | 37 | 생성기 6 · 실행기 16 | dispatches.json, meta.json › expedition, meta.json › farms, meta.json › persona, meta.json › shop, meta.json › variants …외 3 | 00-core 45, 90-load 34, 10-economy 5, 10-challenge 5, 10-system 5 |
| 10-liveops | 10474~10862 | 88 | 실행기 10 · 편집기 1 · 생성기 3 | meta.json › artTags, meta.json › auditSeen, meta.json › spots, prog.json › bootPrep, prog.json › flags, prog.json › prepAsked …외 1 | 00-core 95, 90-load 66, 10-system 19, 10-characters 7, 10-economy 5 |
| 10-messenger | 10863~11172 | 49 | 실행기 8 · 편집기 10 | prog.json › fcAff, prog.json › fcPhoto, prog.json › fchat, threads.json, threads.json › [].added, threads.json › [].charId …외 5 | 90-load 75, 00-core 51, 10-characters 16, 10-system 9, 10-newgame 2 |
| 10-newgame | 11173~11606 | 96 | 생성기 66 · 기타 1 · 실행기 9 | banners.json, chapters.json, chars.json, chars.json › [].__deb, chars.json › [].debut, chars.json › [].debutLater …외 41 | 00-core 87, 90-load 32, 10-system 16, 10-characters 15, 10-story 7 |
| 10-player | 11607~11689 | 15 | 실행기 8 | prog.json › avatar, prog.json › bio, prog.json › gender, prog.json › genderTxt, prog.json › hideEyes, prog.json › look …외 1 | 90-load 17, 00-core 17, 10-system 8, 10-newgame 2, 10-art 2 |
| 10-promptstudio | 11690~12041 | 16 | 편집기 1 | meta.json › prompts | 00-core 16, 90-load 6, 10-system 5, 10-battle 1, 10-characters 1 |
| 10-rules | 12042~12255 | 46 | 실행기 10 · 편집기 9 · 생성기 2 | chapters.json › [].stages[].enemies[].elem, chars.json › [].pos, chars.json › [].role, meta.json › balance, meta.json › elems, meta.json › positions …외 1 | 00-core 28, 90-load 21, 10-system 5, 10-world 3, 10-characters 3 |
| 10-story | 12256~13201 | 147 | 실행기 44 · 편집기 57 · 생성기 9 · 기타 2 | banners.json, chapters.json, chapters.json › [].__purge, chapters.json › [].eventId, chapters.json › [].kind, chapters.json › [].lore …외 55 | 00-core 154, 90-load 136, 10-system 47, 10-characters 37, 10-world 30 |
| 10-system | 13202~14737 | 222 | 실행기 1 · 편집기 1 | meta.json › pub | 00-core 170, 90-load 143, 10-characters 17, 10-art 16, 10-challenge 14 |
| 10-world | 14738~15101 | 100 | 생성기 6 · 실행기 11 · 편집기 4 · 기타 2 | lib.json, meta.json › bestiary, meta.json › relProf, prog.json › cxBadge, prog.json › cxSeen, rels.json …외 3 | 00-core 57, 90-load 34, 10-characters 11, 10-system 6, 10-story 5 |
| 80-misc | 15102~15362 | 55 |  |  | 90-load 25, 00-core 21, 10-characters 7, 10-system 5, 10-world 2 |
| 90-load | 15363~17211 | 105 |  |  | 10-system 11, 00-core 11, 10-characters 6, 10-world 6, 10-story 5 |
| 95-start | 17212~17254 | 1 |  |  |  |
| app/010-confirm | 2074~2091 | 1 |  |  |  |
| app/020-construct | 2094~2208 | 18 |  |  |  |
| app/030-expedition | 2211~2278 | 14 |  |  |  |
| combat/010-catalog | 2282~2292 | 3 |  |  |  |
| combat/020-visual-catalog | 2295~2379 | 3 |  |  |  |
| combat/030-core | 2382~3310 | 128 | 기타 7 · 실행기 6 | chars.json › [].baseStatsMigration, chars.json › [].baseStatsVersion, chars.json › [].def, chars.json › [].hp, chars.json › [].skillBalance, lib.json › [].cooldown …외 4 |  |
| combat/040-effects | 3313~3766 | 49 |  |  | 10-system 8, 90-load 1 |
| combat/050-bridge | 3769~4144 | 70 | 실행기 22 · 편집기 14 · 생성기 17 | chapters.json › [].stages[].combatBalance, chapters.json › [].stages[].enemies, chars.json › [].generation, chars.json › [].roleSpeedOriginal, chars.json › [].roleSpeedRole, chars.json › [].roleSpeedVersion …외 12 | 90-load 25, 00-core 14, 10-characters 8, 10-system 6, 10-art 3 |
| combat/060-generation | 4147~4369 | 29 |  |  | 10-characters 4, 10-art 2, 90-load 2, 00-core 1 |
| combat/070-equipment | 4372~4484 | 19 | 실행기 2 · 편집기 3 | chars.json › [].skillRevisions, chars.json › [].weapon | 90-load 8, 00-core 5, 10-characters 4, 10-system 3 |
| combat/080-training | 4487~4511 | 9 |  |  | 90-load 10, 10-characters 6, 00-core 4, 10-system 1, 10-art 1 |
| combat/090-practice | 4514~4567 | 9 |  |  | 90-load 7, 00-core 5, 10-characters 1, 10-system 1, 10-challenge 1 |

## 7. 최근 변화(증분 갱신 기록)

- 2026-11-05T05:14 · git 6c71ddc
  - meta.json › accent: +생성기:buildManualGameDraft +생성기:buildNewGameDraft
  - meta.json › sub: +생성기:buildManualGameDraft +생성기:buildNewGameDraft
  - meta.json › theme: +생성기:buildManualGameDraft +생성기:buildNewGameDraft
  - meta.json › title: +생성기:buildManualGameDraft +생성기:buildNewGameDraft
- 2026-11-05T05:04 · git 6c71ddc · src 2: 10-newgame, 10-story · index.html 다시 빌드
  - 함수: 추가 243 (designAI, progSlot, progRead, gateOpen, pitySet, guarGet) · 삭제 0 · 옮김 0
  - banners.json: +실행기:addPickupFor +실행기:aiEventGen0 +실행기:aiPickupStory +실행기:puStoryBg +실행기:puxGo +편집기:aiEventGen0 +편집기:handleNavigationAndToolsAction +편집기:handleStoryAndAuthoringAction
  - banners.json › [].active:  −편집기:addPickupFor −편집기:seasonStart
  - banners.json › [].alt:  −편집기:addPickupFor
  - banners.json › [].bg:  −편집기:addPickupFor −편집기:rotatePickups
  - banners.json › [].collab:  −편집기:addPickupFor
  - banners.json › [].desc:  −편집기:addPickupFor −편집기:rotatePickups
  - banners.json › [].gate:  −편집기:addPickupFor
  - banners.json › [].id:  −편집기:addPickupFor
  - banners.json › [].name:  −편집기:addPickupFor −편집기:rotatePickups
  - banners.json › [].newAt:  −편집기:addPickupFor −편집기:gateCheck
- 2026-11-05T04:55 · git 6c71ddc · src 2: 10-newgame, 10-story · index.html 다시 빌드
- 2026-11-05T04:46 · git 6c71ddc · src 3: 00-core, 10-newgame, 10-story · index.html 다시 빌드
  - 함수: 추가 1 (shapeFirstStages) · 삭제 0 · 옮김 0
  - chapters.json › [].stages[].enemies: +실행기:shapeFirstStages +생성기:shapeFirstStages −생성기:buildNewGameDraft
  - chapters.json › [].stages[].post: +실행기:shapeFirstStages +생성기:shapeFirstStages −생성기:buildNewGameDraft
  - chapters.json › [].stages[].pre: +실행기:shapeFirstStages +생성기:shapeFirstStages −생성기:buildNewGameDraft
  - chapters.json › [].stages[].route: +생성기:shapeFirstStages +실행기:shapeFirstStages −생성기:buildNewGameDraft
  - chapters.json › [].stages[].story: +실행기:shapeFirstStages +생성기:shapeFirstStages −생성기:buildNewGameDraft
- 2026-11-05T04:40 · git 6c71ddc · src 6: 00-core, 10-art, 10-characters, 10-story, 10-system, 90-load · index.html 다시 빌드
  - 함수: 추가 2 (normalizeEvents, normalizeCurve) · 삭제 0 · 옮김 1 (fix: src/main/00-core.js → src/main/10-characters.js)
  - chapters.json › [].kind: +실행기:normalizeChapters −실행기:fix
  - events.json › [].shop: +실행기:normalizeEvents −실행기:fix
- 2026-11-05T04:30 · git 6c71ddc · src 7: 00-core, 10-art, 10-characters, 10-newgame, 10-story, 10-system, 90-load · index.html 다시 빌드
  - 함수: 추가 0 · 삭제 0 · 옮김 3 (fix: src/main/10-characters.js → src/main/00-core.js; buildNewGameDraft: src/main/10-story.js → src/main/10-newgame.js; buildManualGameDraft: src/main/10-system.js → src/main/10-newgame.js)
- 2026-11-05T04:26 · git 6c71ddc · src 3: 10-acquire, 10-characters, 10-story · index.html 다시 빌드
  - 함수: 추가 2 (normalizeBanners, normalizeChapters) · 삭제 0 · 옮김 0
  - banners.json › [].pickup: +실행기:normalizeBanners −실행기:fix
  - banners.json › [].pool: +실행기:normalizeBanners −실행기:fix
  - banners.json › [].rate: +실행기:normalizeBanners −실행기:fix
  - chapters.json › [].stages[].post: +실행기:normalizeChapters −실행기:fix
  - chapters.json › [].stages[].pre: +실행기:normalizeChapters −실행기:fix
- 2026-11-05T04:20 · git 978f53b · src 3: 10-newgame, 10-story, 10-system · index.html 다시 빌드
  - 함수: 추가 1 (meta) · 삭제 0 · 옮김 0
  - meta.json › accent:  −생성기:buildManualGameDraft −생성기:buildNewGameDraft
  - meta.json › artNeg: +생성기:meta +실행기:meta −생성기:buildManualGameDraft −생성기:buildNewGameDraft
  - meta.json › artTags: +생성기:meta +실행기:meta −생성기:buildManualGameDraft −생성기:buildNewGameDraft
  - meta.json › bible: +생성기:meta +실행기:meta −생성기:buildManualGameDraft −생성기:buildNewGameDraft
  - meta.json › castSex: +생성기:meta +실행기:meta −생성기:buildManualGameDraft −생성기:buildNewGameDraft
  - meta.json › draft: +생성기:meta +실행기:meta −생성기:buildManualGameDraft −생성기:buildNewGameDraft
  - meta.json › shop: +생성기:meta +실행기:meta −생성기:buildManualGameDraft
  - meta.json › story: +생성기:meta +실행기:meta −생성기:buildManualGameDraft −생성기:buildNewGameDraft
  - meta.json › sub:  −생성기:buildManualGameDraft −생성기:buildNewGameDraft
  - meta.json › terms: +생성기:meta +실행기:meta −생성기:buildManualGameDraft −생성기:buildNewGameDraft
