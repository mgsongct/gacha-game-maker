# 연관 맵 — 모듈 → 빌드 → index.html(생성기·실행기·편집기) → data 게임 파일

생성: `node tools/map.mjs` · 2026-11-05T04:20 · git 978f53b · 입력: src 56파일 · www/index.html 041ed2d305d1 · 시험 게임 2 — 입력이 바뀌면 다시 만들고 바뀐 연결은 맨 아래 "최근 변화"에(증분 갱신, CI `--check`가 맵이 낡았는지 봄)

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
| (파일 전체) | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 2/2 |
| [].active |  | addPickupFor<sub>10-acquire</sub> seasonStart<sub>10-acquire</sub> | addPickupFor<sub>10-acquire</sub> seasonStart<sub>10-acquire</sub> |  |  |  | 2/2 |
| [].alt |  | addPickupFor<sub>10-acquire</sub> | addPickupFor<sub>10-acquire</sub> |  |  |  | 0/2 |
| [].bg |  | addPickupFor<sub>10-acquire</sub> rotatePickups<sub>10-acquire</sub> | addPickupFor<sub>10-acquire</sub> rotatePickups<sub>10-acquire</sub> |  |  |  | 0/2 |
| [].collab |  | addPickupFor<sub>10-acquire</sub> | addPickupFor<sub>10-acquire</sub> |  |  |  | 0/2 |
| [].desc |  | addPickupFor<sub>10-acquire</sub> rotatePickups<sub>10-acquire</sub> | addPickupFor<sub>10-acquire</sub> rotatePickups<sub>10-acquire</sub> |  |  |  | 2/2 |
| [].gate |  | addPickupFor<sub>10-acquire</sub> | addPickupFor<sub>10-acquire</sub> |  |  |  | 0/2 |
| [].id |  | addPickupFor<sub>10-acquire</sub> | addPickupFor<sub>10-acquire</sub> |  |  |  | 2/2 |
| [].name |  | addPickupFor<sub>10-acquire</sub> renameEverywhere<sub>10-acquire</sub> rotatePickups<sub>10-acquire</sub> | addPickupFor<sub>10-acquire</sub> renameEverywhere<sub>10-acquire</sub> rotatePickups<sub>10-acquire</sub> |  |  |  | 2/2 |
| [].newAt |  | addPickupFor<sub>10-acquire</sub> gateCheck<sub>10-acquire</sub> | addPickupFor<sub>10-acquire</sub> gateCheck<sub>10-acquire</sub> |  |  |  | 0/2 |
| [].pickup |  | addPickupFor<sub>10-acquire</sub> fix<sub>10-characters</sub> repairRefs<sub>10-acquire</sub> rotatePickups<sub>10-acquire</sub> …외 1 | addPickupFor<sub>10-acquire</sub> rotatePickups<sub>10-acquire</sub> storyPurge<sub>10-acquire</sub> |  |  |  | 2/2 |
| [].pool |  | addPickupFor<sub>10-acquire</sub> fix<sub>10-characters</sub> repairRefs<sub>10-acquire</sub> storyPurge<sub>10-acquire</sub> | addPickupFor<sub>10-acquire</sub> storyPurge<sub>10-acquire</sub> |  |  |  | 2/2 |
| [].rate |  | addPickupFor<sub>10-acquire</sub> fix<sub>10-characters</sub> | addPickupFor<sub>10-acquire</sub> |  |  |  | 2/2 |
| [].type |  | addPickupFor<sub>10-acquire</sub> | addPickupFor<sub>10-acquire</sub> |  |  |  | 2/2 |
| [].until |  | addPickupFor<sub>10-acquire</sub> | addPickupFor<sub>10-acquire</sub> |  |  |  | 0/2 |

### chapters.json — 시나리오(장·스테이지·대본·적)

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| (파일 전체) | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 2/2 |
| [].__purge |  |  | handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 0/2 |
| [].eventId |  |  | handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 0/2 |
| [].kind |  | fix<sub>10-characters</sub> |  |  | w_stance |  | 2/2 |
| [].lore |  | evLoreSet<sub>10-story</sub> | evLoreSet<sub>10-story</sub> |  |  |  | 0/2 |
| [].ord |  |  | handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 2/2 |
| [].recruits |  | storyPurge<sub>10-acquire</sub> | storyPurge<sub>10-acquire</sub> |  |  |  | 1/2 |
| [].relScan | relFromScripts<sub>10-story</sub> | evLoreSet<sub>10-story</sub> relFromScripts<sub>10-story</sub> | evLoreSet<sub>10-story</sub> handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 2/2 |
| [].stages |  |  | handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 2/2 |
| [].stages[].combatBalance |  | v2BalanceChapter<sub>combat/050-bridge</sub> v2PrepareStage<sub>combat/050-bridge</sub> readChForm<sub>10-story</sub> | v2BalanceChapter<sub>combat/050-bridge</sub> v2PrepareStage<sub>combat/050-bridge</sub> readChForm<sub>10-story</sub> |  |  |  | 1/2 |
| [].stages[].enemies | buildNewGameDraft<sub>10-story</sub> | v2BalanceChapter<sub>combat/050-bridge</sub> v2PrepareStage<sub>combat/050-bridge</sub> readChForm<sub>10-story</sub> rebalanceChapter<sub>10-story</sub> | v2BalanceChapter<sub>combat/050-bridge</sub> v2PrepareStage<sub>combat/050-bridge</sub> readChForm<sub>10-story</sub> |  | s_rules |  | 2/2 |
| [].stages[].enemies[].atk |  | sysEventFoes<sub>10-story</sub> | sysEventFoes<sub>10-story</sub> |  |  |  | 2/2 |
| [].stages[].enemies[].def |  | sysEventFoes<sub>10-story</sub> | sysEventFoes<sub>10-story</sub> |  |  |  | 2/2 |
| [].stages[].enemies[].elem |  | rulesSave<sub>10-rules</sub> | handleStoryAndAuthoringAction<sub>10-story</sub> rulesSave<sub>10-rules</sub> |  |  |  | 2/2 |
| [].stages[].enemies[].hp |  | sysEventFoes<sub>10-story</sub> | sysEventFoes<sub>10-story</sub> |  |  |  | 2/2 |
| [].stages[].enemies[].spd |  | sysEventFoes<sub>10-story</sub> | sysEventFoes<sub>10-story</sub> |  |  |  | 2/2 |
| [].stages[].field | stageAutoRules<sub>10-story</sub> | stageAutoRules<sub>10-story</sub> |  |  |  |  | 2/2 |
| [].stages[].goal | stageAutoRules<sub>10-story</sub> | stageAutoRules<sub>10-story</sub> |  |  |  |  | 2/2 |
| [].stages[].post | buildNewGameDraft<sub>10-story</sub> | fix<sub>10-characters</sub> readChForm<sub>10-story</sub> writeStages<sub>10-story</sub> | handleStoryAndAuthoringAction<sub>10-story</sub> readChForm<sub>10-story</sub> writeStages<sub>10-story</sub> |  | s_direct |  | 2/2 |
| [].stages[].pre | buildNewGameDraft<sub>10-story</sub> | fix<sub>10-characters</sub> readChForm<sub>10-story</sub> writeStages<sub>10-story</sub> | handleStoryAndAuthoringAction<sub>10-story</sub> readChForm<sub>10-story</sub> writeStages<sub>10-story</sub> |  | s_direct s_script |  | 2/2 |
| [].stages[].reward |  | readChForm<sub>10-story</sub> | readChForm<sub>10-story</sub> |  |  |  | 2/2 |
| [].stages[].route | buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 1/2 |
| [].stages[].rulesV | stageAutoRules<sub>10-story</sub> | stageAutoRules<sub>10-story</sub> |  |  | s_rules |  | 2/2 |
| [].stages[].stamina |  |  | handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 0/2 |
| [].stages[].story | buildNewGameDraft<sub>10-story</sub> | readChForm<sub>10-story</sub> | readChForm<sub>10-story</sub> |  | s_rules |  | 2/2 |
| [].stages[].title |  | readChForm<sub>10-story</sub> | readChForm<sub>10-story</sub> |  |  |  | 2/2 |

### chars.json — 캐릭터

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| (파일 전체) | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 2/2 |
| [].__deb | buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 0/2 |
| [].affLines |  | fix<sub>10-characters</sub> readCharForm<sub>10-characters</sub> | readCharForm<sub>10-characters</sub> |  | c_aff |  | 2/2 |
| [].age |  | apply<sub>10-characters</sub> conMakeVariant<sub>10-characters</sub> fix<sub>10-characters</sub> | apply<sub>10-characters</sub> conMakeVariant<sub>10-characters</sub> |  |  |  | 2/2 |
| [].alt |  | apply<sub>10-characters</sub> conMakeVariant<sub>10-characters</sub> | apply<sub>10-characters</sub> conMakeVariant<sub>10-characters</sub> |  |  |  | 0/2 |
| [].altCanon |  | apply<sub>10-characters</sub> conMakeVariant<sub>10-characters</sub> | apply<sub>10-characters</sub> conMakeVariant<sub>10-characters</sub> |  |  |  | 0/2 |
| [].atk | balNormalize<sub>10-characters</sub> | balNormalize<sub>10-characters</sub> readCharForm<sub>10-characters</sub> | readCharForm<sub>10-characters</sub> rulesRecalc<sub>10-characters</sub> |  |  |  | 2/2 |
| [].baseStatsMigration |  |  |  | migrateBaseStats<sub>combat/030-core</sub> |  |  | 0/2 |
| [].baseStatsVersion |  | readCharForm<sub>10-characters</sub> | readCharForm<sub>10-characters</sub> | migrateBaseStats<sub>combat/030-core</sub> |  |  | 2/2 |
| [].cards |  | drawCardArts<sub>10-characters</sub> | drawCardArts<sub>10-characters</sub> |  |  |  | 0/2 |
| [].collab |  | apply<sub>10-characters</sub> | apply<sub>10-characters</sub> |  |  |  | 0/2 |
| [].cvar |  | conMakeVariant<sub>10-characters</sub> | conMakeVariant<sub>10-characters</sub> |  |  |  | 0/2 |
| [].debut | buildNewGameDraft<sub>10-story</sub> | debutResolve<sub>10-characters</sub> | debutResolve<sub>10-characters</sub> fwRead<sub>10-characters</sub> |  | c_debut |  | 2/2 |
| [].debutLater | buildNewGameDraft<sub>10-story</sub> | debutResolve<sub>10-characters</sub> | debutResolve<sub>10-characters</sub> |  | c_debut |  | 0/2 |
| [].def | balNormalize<sub>10-characters</sub> | balNormalize<sub>10-characters</sub> readCharForm<sub>10-characters</sub> | readCharForm<sub>10-characters</sub> rulesRecalc<sub>10-characters</sub> | migrateBaseStats<sub>combat/030-core</sub> |  |  | 2/2 |
| [].dupLines |  | fix<sub>10-characters</sub> readCharForm<sub>10-characters</sub> | readCharForm<sub>10-characters</sub> |  |  |  | 2/2 |
| [].elem |  | fix<sub>10-characters</sub> readCharForm<sub>10-characters</sub> | handleStoryAndAuthoringAction<sub>10-story</sub> readCharForm<sub>10-characters</sub> |  |  |  | 2/2 |
| [].episodes |  | fix<sub>10-characters</sub> | handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 0/2 |
| [].faceMask | artReuse<sub>10-characters</sub> | artReuse<sub>10-characters</sub> regenApply<sub>10-characters</sub> | handleImagesAndAssetsAction<sub>10-characters</sub> regenApply<sub>10-characters</sub> |  |  |  | 0/2 |
| [].faces | artReuse<sub>10-characters</sub> | artReuse<sub>10-characters</sub> fix<sub>10-characters</sub> | handleImagesAndAssetsAction<sub>10-characters</sub> |  |  |  | 0/2 |
| [].faction |  | apply<sub>10-characters</sub> apply<sub>10-characters</sub> conMakeVariant<sub>10-characters</sub> fix<sub>10-characters</sub> …외 2 | apply<sub>10-characters</sub> apply<sub>10-characters</sub> conMakeVariant<sub>10-characters</sub> fwRead<sub>10-characters</sub> …외 2 |  |  |  | 2/2 |
| [].files |  | fix<sub>10-characters</sub> readCharForm<sub>10-characters</sub> | readCharForm<sub>10-characters</sub> |  |  |  | 2/2 |
| [].generation |  | balRemaster<sub>10-characters</sub> | balRemaster<sub>10-characters</sub> v2EditorAction<sub>combat/050-bridge</sub> |  |  |  | 2/2 |
| [].hp | balNormalize<sub>10-characters</sub> | balNormalize<sub>10-characters</sub> readCharForm<sub>10-characters</sub> | readCharForm<sub>10-characters</sub> rulesRecalc<sub>10-characters</sub> | migrateBaseStats<sub>combat/030-core</sub> |  |  | 2/2 |
| [].illust |  | fix<sub>10-characters</sub> |  |  |  |  | 2/2 |
| [].img | artReuse<sub>10-characters</sub> | artReuse<sub>10-characters</sub> |  |  |  |  | 0/2 |
| [].intro |  | fix<sub>10-characters</sub> readCharForm<sub>10-characters</sub> | readCharForm<sub>10-characters</sub> |  | c_intro |  | 2/2 |
| [].lbbg |  | fix<sub>10-characters</sub> | handleImagesAndAssetsAction<sub>10-characters</sub> |  |  |  | 2/2 |
| [].lbcg |  | fix<sub>10-characters</sub> |  |  |  |  | 2/2 |
| [].limited |  | addPickupFor<sub>10-acquire</sub> fix<sub>10-characters</sub> readCharForm<sub>10-characters</sub> | addPickupFor<sub>10-acquire</sub> handleNavigationAndToolsAction<sub>10-acquire</sub> readCharForm<sub>10-characters</sub> |  |  |  | 2/2 |
| [].lines |  | apply<sub>10-characters</sub> fix<sub>10-characters</sub> readCharForm<sub>10-characters</sub> | apply<sub>10-characters</sub> readCharForm<sub>10-characters</sub> |  | c_lines |  | 2/2 |
| [].lvLines |  | fix<sub>10-characters</sub> readCharForm<sub>10-characters</sub> | readCharForm<sub>10-characters</sub> |  |  |  | 2/2 |
| [].naiBlocks |  | regenApply<sub>10-characters</sub> | regenApply<sub>10-characters</sub> |  |  |  | 2/2 |
| [].naiPose |  | fix<sub>10-characters</sub> |  |  |  |  | 0/2 |
| [].naiPrompt |  | conMakeVariant<sub>10-characters</sub> fix<sub>10-characters</sub> readCharForm<sub>10-characters</sub> regenApply<sub>10-characters</sub> | conMakeVariant<sub>10-characters</sub> readCharForm<sub>10-characters</sub> regenApply<sub>10-characters</sub> |  | c_age c_look c_minor |  | 2/2 |
| [].naiStyle |  | apply<sub>10-characters</sub> conMakeVariant<sub>10-characters</sub> | apply<sub>10-characters</sub> conMakeVariant<sub>10-characters</sub> |  |  |  | 0/2 |
| [].name |  | apply<sub>10-characters</sub> apply<sub>10-characters</sub> conMakeVariant<sub>10-characters</sub> readCharForm<sub>10-characters</sub> …외 1 | apply<sub>10-characters</sub> apply<sub>10-characters</sub> conMakeVariant<sub>10-characters</sub> readCharForm<sub>10-characters</sub> …외 1 | edit<sub>10-newgame</sub> |  |  | 2/2 |
| [].noDesign |  | readCharForm<sub>10-characters</sub> | readCharForm<sub>10-characters</sub> |  |  |  | 0/2 |
| [].over |  | inheritAll<sub>10-characters</sub> inheritOnMark<sub>10-characters</sub> | inheritOnMark<sub>10-characters</sub> |  |  |  | 0/2 |
| [].persona |  |  | personaSave<sub>10-characters</sub> |  | c_persona c_persona_weak c_pfields |  | 2/2 |
| [].pfields |  |  | personaSave<sub>10-characters</sub> |  | c_pfields |  | 2/2 |
| [].pos | posSpread<sub>10-characters</sub> | posSpread<sub>10-characters</sub> readCharForm<sub>10-characters</sub> rulesSave<sub>10-rules</sub> | readCharForm<sub>10-characters</sub> rulesSave<sub>10-rules</sub> |  | c_pos |  | 2/2 |
| [].pose |  | fix<sub>10-characters</sub> |  |  |  |  | 2/2 |
| [].profile |  | readCharForm<sub>10-characters</sub> | readCharForm<sub>10-characters</sub> |  | c_profile |  | 2/2 |
| [].rarity |  | apply<sub>10-characters</sub> apply<sub>10-characters</sub> conMakeVariant<sub>10-characters</sub> fix<sub>10-characters</sub> …외 1 | apply<sub>10-characters</sub> apply<sub>10-characters</sub> conMakeVariant<sub>10-characters</sub> readCharForm<sub>10-characters</sub> |  |  |  | 2/2 |
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
| [].voiceId |  | apply<sub>10-characters</sub> applySharedArchive<sub>10-characters</sub> conMakeVariant<sub>10-characters</sub> pubContent<sub>10-characters</sub> …외 1 | apply<sub>10-characters</sub> applySharedArchive<sub>10-characters</sub> conMakeVariant<sub>10-characters</sub> handleSettingsAndAudioAction<sub>10-characters</sub> …외 2 |  |  |  | 0/2 |
| [].voiceName |  | applySharedArchive<sub>10-characters</sub> pubContent<sub>10-characters</sub> shareDefinition<sub>10-characters</sub> | applySharedArchive<sub>10-characters</sub> handleSettingsAndAudioAction<sub>10-characters</sub> pubContent<sub>10-characters</sub> shareDefinition<sub>10-characters</sub> |  |  |  | 0/2 |
| [].weapon | artReuse<sub>10-characters</sub> fixWeaponPrompts<sub>10-characters</sub> | artReuse<sub>10-characters</sub> fix<sub>10-characters</sub> fixWeaponPrompts<sub>10-characters</sub> v2EnsureEquipment<sub>combat/070-equipment</sub> …외 2 | handleCharactersAction<sub>10-characters</sub> handleImagesAndAssetsAction<sub>10-characters</sub> v2EnsureEquipment<sub>combat/070-equipment</sub> v2GearAction<sub>combat/070-equipment</sub> …외 2 |  | c_weapon |  | 2/2 |

### dispatches.json — 파견

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| (파일 전체) | buildManualGameDraft<sub>10-system</sub> ngWorldExtras<sub>10-expedition</sub> | ngWorldExtras<sub>10-expedition</sub> |  |  |  |  | 2/2 |

### events.json — 이벤트

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| (파일 전체) | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 0/2 |
| [].active |  | liveTick<sub>10-story</sub> seasonStart<sub>10-acquire</sub> | liveTick<sub>10-story</sub> seasonStart<sub>10-acquire</sub> |  |  |  | 0/2 |
| [].shop |  | fix<sub>10-characters</sub> |  |  |  |  | 0/2 |

### game.json — 나머지

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| __looks | buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 0/2 |
| ver | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 2/2 |

### lib.json — 자료실(배경·소품·CG·적)

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| (파일 전체) | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 2/2 |
| [].affLines |  | regenParseCharacter<sub>10-art</sub> | regenParseCharacter<sub>10-art</sub> |  |  |  | 0/2 |
| [].alias |  | shTake<sub>10-art</sub> | shTake<sub>10-art</sub> |  |  |  | 1/2 |
| [].audio |  | storeAudio<sub>10-art</sub> | storeAudio<sub>10-art</sub> |  |  |  | 0/2 |
| [].cast |  |  | handleNavigationAndToolsAction<sub>10-acquire</sub> |  |  |  | 1/2 |
| [].cooldown |  | trainedSkill<sub>combat/030-core</sub> weakenGeneratedSkill<sub>combat/030-core</sub> |  |  |  |  | 0/2 |
| [].faction |  | regenParseCharacter<sub>10-art</sub> | regenParseCharacter<sub>10-art</sub> |  |  |  | 2/2 |
| [].files |  | regenParseCharacter<sub>10-art</sub> | regenParseCharacter<sub>10-art</sub> |  |  |  | 0/2 |
| [].id |  | conMakeVariant<sub>10-characters</sub> | conMakeVariant<sub>10-characters</sub> |  |  |  | 2/2 |
| [].img | artReuse<sub>10-characters</sub> | artReuse<sub>10-characters</sub> storeImage<sub>10-art</sub> | storeImage<sub>10-art</sub> |  |  |  | 0/2 |
| [].initial |  | trainedSkill<sub>combat/030-core</sub> |  |  |  |  | 0/2 |
| [].intro |  | regenParseCharacter<sub>10-art</sub> | regenParseCharacter<sub>10-art</sub> |  |  |  | 0/2 |
| [].lines |  | regenParseCharacter<sub>10-art</sub> | regenParseCharacter<sub>10-art</sub> |  |  |  | 0/2 |
| [].live |  | subscribe<sub>10-art</sub> | subscribe<sub>10-art</sub> |  |  |  | 0/2 |
| [].lockout |  | trainedSkill<sub>combat/030-core</sub> |  |  |  |  | 0/2 |
| [].naiPrompt |  | conMakeVariant<sub>10-characters</sub> regenParseCharacter<sub>10-art</sub> | conMakeVariant<sub>10-characters</sub> regenParseCharacter<sub>10-art</sub> |  |  |  | 0/2 |
| [].name |  | conMakeVariant<sub>10-characters</sub> fix<sub>10-characters</sub> regenParseCharacter<sub>10-art</sub> | conMakeVariant<sub>10-characters</sub> handleNavigationAndToolsAction<sub>10-acquire</sub> regenParseCharacter<sub>10-art</sub> |  |  |  | 2/2 |
| [].profile |  | regenParseCharacter<sub>10-art</sub> | regenParseCharacter<sub>10-art</sub> |  |  |  | 0/2 |
| [].prompt | artReuse<sub>10-characters</sub> | artReuse<sub>10-characters</sub> elCompose<sub>10-art</sub> ensureLibPrompts<sub>10-art</sub> shTake<sub>10-art</sub> | elCompose<sub>10-art</sub> ensureLibPrompts<sub>10-art</sub> handleCharactersAction<sub>10-characters</sub> handleNavigationAndToolsAction<sub>10-acquire</sub> …외 2 |  | l_imgperson |  | 2/2 |
| [].rarity |  | conMakeVariant<sub>10-characters</sub> | conMakeVariant<sub>10-characters</sub> |  |  |  | 0/2 |
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
| artNeg | artReuse<sub>10-characters</sub> meta<sub>10-newgame</sub> | artReuse<sub>10-characters</sub> meta<sub>10-newgame</sub> |  |  |  |  | 0/2 |
| artTags | artReuse<sub>10-characters</sub> meta<sub>10-newgame</sub> | artReuse<sub>10-characters</sub> meta<sub>10-newgame</sub> |  |  |  |  | 0/2 |
| auditSeen | ngFinish<sub>10-liveops</sub> | ngFinish<sub>10-liveops</sub> |  |  |  |  | 0/2 |
| bestiary | bestiaryApply<sub>10-world</sub> | bestiaryApply<sub>10-world</sub> |  |  |  |  | 2/2 |
| bible | meta<sub>10-newgame</sub> | meta<sub>10-newgame</sub> |  |  |  |  | 0/2 |
| castSex | meta<sub>10-newgame</sub> | meta<sub>10-newgame</sub> |  |  |  |  | 0/2 |
| construct | conStartNew<sub>10-acquire</sub> | conStartNew<sub>10-acquire</sub> |  |  |  |  | 0/2 |
| draft | meta<sub>10-newgame</sub> | meta<sub>10-newgame</sub> |  |  |  |  | 2/2 |
| elems | buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 2/2 |
| expedition | ngWorldExtras<sub>10-expedition</sub> | ngWorldExtras<sub>10-expedition</sub> |  |  |  |  | 0/2 |
| farms | ngWorldExtras<sub>10-expedition</sub> | ngWorldExtras<sub>10-expedition</sub> |  |  |  |  | 2/2 |
| manual | buildManualGameDraft<sub>10-system</sub> |  |  |  |  |  | 0/2 |
| persona | ngWorldExtras<sub>10-expedition</sub> | ngWorldExtras<sub>10-expedition</sub> |  |  |  |  | 0/2 |
| positions | buildNewGameDraft<sub>10-story</sub> |  |  |  | g_pos |  | 2/2 |
| relProf | buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 2/2 |
| roles | buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 2/2 |
| rules | buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 2/2 |
| shop | meta<sub>10-newgame</sub> ngWorldExtras<sub>10-expedition</sub> | meta<sub>10-newgame</sub> ngWorldExtras<sub>10-expedition</sub> |  |  |  |  | 2/2 |
| spots | spotsAuto<sub>10-liveops</sub> | spotsAuto<sub>10-liveops</sub> |  |  |  |  | 0/2 |
| story | meta<sub>10-newgame</sub> | meta<sub>10-newgame</sub> |  |  |  |  | 2/2 |
| terms | meta<sub>10-newgame</sub> | meta<sub>10-newgame</sub> |  |  |  |  | 2/2 |
| tone | meta<sub>10-newgame</sub> | meta<sub>10-newgame</sub> |  |  |  |  | 0/2 |
| variants | ngWorldExtras<sub>10-expedition</sub> | ngWorldExtras<sub>10-expedition</sub> |  |  |  |  | 0/2 |

### npcs.json — NPC

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| (파일 전체) | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 1/2 |
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
| (파일 전체) | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 2/2 |

### prog.json — 진행(플레이어)

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| avatar | artReuse<sub>10-characters</sub> buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> | artReuse<sub>10-characters</sub> |  |  |  |  | 0/2 |
| castDone | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 0/2 |
| cbuild | conStartNew<sub>10-acquire</sub> | conStartNew<sub>10-acquire</sub> |  |  |  |  | 0/2 |
| cres | conStartNew<sub>10-acquire</sub> | conStartNew<sub>10-acquire</sub> |  |  |  |  | 0/2 |
| gender | buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 0/2 |
| lobbyBg | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 2/2 |
| scene | buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 2/2 |
| titleBg | buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 2/2 |

### rels.json — 관계

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| (파일 전체) | buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 2/2 |

### threads.json — 메신저(톡)

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| (파일 전체) | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 2/2 |
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
| factions | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 2/2 |
| lore | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 2/2 |
| name | buildManualGameDraft<sub>10-system</sub> |  |  |  |  |  | 2/2 |
| plot | buildManualGameDraft<sub>10-system</sub> |  |  |  |  |  | 2/2 |
| source | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 0/2 |
| summary | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 2/2 |

## 2. index.html 기능 표면 → 기능 단위 → 얽힌 모듈

산출물 index.html이 사용자에게 보여 주고 수행하는 기능을 코드에서 뽑은 분류(지금 모듈 구조는 기준이 아님 — 원안 한 파일을 고려 없이 나눈 것이라 대어 보는 대상): 아래 탭(메뉴) → 화면(경로표)·설정 하위 화면의 패널 → 창(openModal) + 배경(새 게임 생성·실행 중 AI·불러오기·앱 시작). 한 화면에서만 여는 창은 그 화면 안, 여러 단위가 여는 창은 공용 창. 함수는 동작(data-act → 처리기)과 호출을 따라 **가장 가까운 기능 단위**에 붙임(같은 거리면 같이 씀 — 공용·엔진). 「함수」 = 그 단위에서만 닿는 함수 수

### 배경(누르지 않아도 하는 일)

| 기능 단위 | 종류 | 함수 | 얽힌 모듈(함수 수) | 안의 창 |
|---|---|---|---|---|
| 새 게임 생성 | 배경 | 479 | 10-characters 130, 00-core 74, 10-newgame 63, 10-system 37, 90-load 35 …외 14 |  |
| 실행 중 AI | 배경 | 280 | 10-characters 51, 10-messenger 44, 10-story 42, 00-core 40, 10-liveops 34 …외 10 |  |
| 불러오기 | 배경 | 28 | 10-characters 13, 00-core 4, 10-rules 3, 10-challenge 2, 10-system 2 …외 3 |  |
| 앱 시작 | 배경 | 9 | 90-load 6, 00-core 1, 10-world 1, 80-misc 1 |  |

## 3. 계층(MVC) — 모듈마다 View · Controller · Model, 섞인 함수, 방향 위반

기준(CLAUDE.md §0-2, docs/research/developer-role.md 1-1 — 함수 자신이 하는 일로 판정, lib/arch.mjs): View = HTML 마크업 글을 만들거나 DOM을 바꿈 · Controller = 액션 처리기 또는 화면 갱신(render·toast·openModal·closeModal)을 부름 · Model = 게임 상태를 씀·저장소 쓰기·네트워크·AI·그림 서비스 또는 화면과 관계없는 계산·조회 · **섞임** = 한 함수가 화면을 만들면서 상태·저장·서비스를 직접 씀. **방향 위반** = View가 상태·저장·서비스를 바꾸는 함수를 부름(그리다가 바꿈) · Model이 화면을 만드는 함수를 부름. src/main 함수: View 481 · Controller 157 · Model 1185 · 섞임 7 · 방향 위반 66

| 모듈 | View | Controller | Model | 섞임 | 방향 위반 | 섞인 함수(예) | 방향 위반(예) |
|---|---|---|---|---|---|---|---|
| 00-core | 70 | 21 | 132 | 1 | 17 | checkUpdatePrivate | aiJSON→toast, naiGenerate→toast, designAI→aiJSON |
| 10-system | 60 | 23 | 140 | 0 | 15 |  | aiCall→toast, applyWebUpdate→reloadGame, reloadGame→flush |
| 10-economy | 23 | 5 | 22 | 0 | 13 |  | handleEconomyAction→giveReward, handleEconomyAction→naiDrawItem, handleEconomyAction→storeImage |
| 10-characters | 89 | 25 | 198 | 3 | 7 | handleImagesAndAssetsAction, handleCharactersAction, handleSettingsAndAudioAction | openPresetCode→saveLlm, openPresetCode→saveUserPacks, imgTarget→openChar |
| 10-story | 47 | 14 | 79 | 1 | 6 | handleStoryAndAuthoringAction | bootSync→pcApi, bootSync→syRemote, bootSync→bootPullOk |
| 10-acquire | 25 | 8 | 36 | 1 | 2 | handleNavigationAndToolsAction | seasonStart→liveBar, seasonStart→artAfterAI |
| 10-art | 30 | 5 | 61 | 0 | 2 |  | showCast→castRun, bootPrepRun→runPrep |
| 10-messenger | 19 | 2 | 27 | 1 | 1 | handleMessengerAction | openPhone→openThread |
| 10-challenge | 27 | 13 | 50 | 0 | 1 |  | cbUlt→cbEnd |
| 10-liveops | 15 | 15 | 58 | 0 | 1 |  | updateAPKRequired→updateCheckRecord |
| 10-promptstudio | 3 | 0 | 13 | 0 | 1 |  | pstPolish→aiJSON |

## 4. 기능(같은 데이터·처리) ↔ 화면 · 모듈 판정

기능 = Model·Controller 함수를 호출과 같은 상태 키·data 경로·저장소 키로 이어 모듈성 최대화로 묶은 것(순서를 바꿔 6번 — 과반이 같이 묶인 것만, 경계는 빼고), View 함수는 부르는 Model·Controller의 기능으로 이음. 화면 = 그 기능의 함수에 닿는 index.html 기능 단위(2절). 이름(아래 판정 표) = 그 기능이 가장 많이 쓰는 데이터(여러 기능이 다 쓰는 데이터는 뺌)

| 기능 | 함수 | 주로 쓰는 데이터 | 계층(View·Controller·Model·섞임) | 이어진 화면(닿는 함수 수) | 모듈(함수 수) |
|---|---|---|---|---|---|
| F01 | 208 | chars.json › [].skins · chars.json › [].weapon · lib.json › [].name | 66·23·116·3 | 새 게임 생성 128, 실행 중 AI 22, 불러오기 2 | 10-characters 53, 00-core 37, 10-art 20, 90-load 18, 80-misc 13 …외 12 |
| F02 | 99 | threads.json › [].added · threads.json › [].charId · threads.json › [].id | 45·5·48·1 | 실행 중 AI 51, 새 게임 생성 28 | 10-messenger 31, 00-core 15, 10-characters 14, 10-liveops 11, 80-misc 7 …외 6 |
| F03 | 98 | 저장소 ggm-picked · 저장소 ggm-sync · 저장소 ggm-sync-idx | 23·16·59·0 | 새 게임 생성 8, 실행 중 AI 4 | 10-system 81, 10-art 5, 10-newgame 4, 00-core 3, 10-story 2 …외 3 |
| F04 | 98 | banners.json · chapters.json · chars.json | 25·7·66·0 | 새 게임 생성 52, 실행 중 AI 3, 불러오기 1 | 10-newgame 27, 10-story 14, 00-core 12, 90-load 11, 10-characters 11 …외 8 |
| F05 | 88 | 저장소 starfall-sound · lib.json › [].prompt · 저장소 starfall-ai-profiles | 26·6·54·2 | 새 게임 생성 20, 실행 중 AI 2 | 10-system 28, 00-core 16, 10-characters 13, 10-liveops 11, 10-art 6 …외 6 |
| F06 | 88 | chars.json › [].skillBalance · chars.json › [].skills · chars.json › [].weapon | 28·7·53·0 | 새 게임 생성 31, 불러오기 11, 실행 중 AI 7 | 10-characters 40, 00-core 11, 10-art 10, 10-economy 7, 10-system 6 …외 7 |
| F07 | 83 | chars.json › [].atk · chars.json › [].def · chars.json › [].hp | 19·7·57·0 | 새 게임 생성 27, 실행 중 AI 6, 불러오기 5 | 10-rules 32, 10-characters 21, 90-load 8, 00-core 6, 10-player 3 …외 8 |
| F08 | 77 | banners.json › [].active · banners.json › [].bg · banners.json › [].desc | 17·11·49·0 | 실행 중 AI 41, 새 게임 생성 6, 앱 시작 1 | 10-acquire 20, 10-liveops 19, 10-economy 7, 10-messenger 6, 00-core 5 …외 8 |
| F09 | 77 | chapters.json › [].stages[].post · chapters.json › [].stages[].pre · chars.json › [].debut | 6·5·66·0 | 실행 중 AI 44, 새 게임 생성 21, 불러오기 1 | 10-story 20, 10-characters 16, 10-newgame 11, 00-core 8, 10-art 6 …외 6 |
| F10 | 71 |  | 26·10·35·0 |  | 10-challenge 55, 10-system 8, 00-core 6, 10-player 1, 10-story 1 |
| F11 | 64 |  | 13·1·50·0 | 실행 중 AI 7, 새 게임 생성 5, 불러오기 4 | 10-world 38, 10-story 16, 10-characters 3, 90-load 2, 00-core 2 …외 3 |
| F12 | 63 | chapters.json › [].relScan · banners.json › [].pickup · banners.json › [].pool | 18·0·44·1 | 새 게임 생성 18, 실행 중 AI 17, 앱 시작 8 | 10-story 23, 00-core 12, 10-world 10, 10-characters 6, 10-newgame 3 …외 6 |
| F13 | 58 | chars.json › [].weapon · 저장소 ggm-plessons | 3·8·47·0 | 실행 중 AI 26, 새 게임 생성 18 | 10-characters 18, 10-liveops 12, 10-system 7, 10-story 6, 10-promptstudio 5 …외 5 |
| F14 | 58 |  | 13·14·31·0 | 새 게임 생성 4, 실행 중 AI 2 | 10-battle 14, 10-economy 10, 10-characters 7, 00-core 7, 10-challenge 7 …외 6 |
| F15 | 57 | chars.json › [].voiceId · chars.json › [].voiceName · lib.json › [].live | 16·11·30·0 | 새 게임 생성 6, 실행 중 AI 6 | 10-system 31, 10-art 11, 00-core 5, 10-characters 4, 10-story 4 …외 2 |
| F16 | 49 | chapters.json › [].stages[].enemies · chapters.json › [].stages[].combatBalance · chapters.json › [].stages[].enemies[].atk | 7·6·36·0 | 새 게임 생성 11, 불러오기 6, 실행 중 AI 1 | 10-challenge 12, 10-battle 9, 10-story 9, 10-characters 7, 10-newgame 4 …외 4 |
| F17 | 41 | chars.json › [].faction · chars.json › [].name · chars.json › [].rarity | 13·3·25·0 | 실행 중 AI 11 | 10-acquire 23, 10-characters 12, 00-core 3, 90-load 2, 10-economy 1 |
| F18 | 41 | chars.json › [].debut · chars.json › [].faction · lib.json › [].prompt | 4·1·36·0 | 새 게임 생성 11, 실행 중 AI 4 | 10-world 30, 10-art 5, 10-characters 4, 10-acquire 2 |
| F19 | 31 |  | 2·4·25·0 | 새 게임 생성 3 | 10-newgame 17, 10-characters 9, 00-core 3, 80-misc 1, 90-load 1 |
| F20 | 29 |  | 6·5·18·0 |  | 10-expedition 27, 10-characters 1, 90-load 1 |
| F21 | 27 | 저장소 ggm-voice-ja | 9·0·18·0 | 새 게임 생성 18, 실행 중 AI 6 | 10-system 9, 10-story 6, 10-characters 6, 90-load 2, 00-core 2 …외 2 |
| F22 | 26 |  | 7·0·19·0 | 실행 중 AI 19, 새 게임 생성 11, 불러오기 8 | 10-characters 11, 10-liveops 8, 00-core 5, 80-misc 2 |
| F23 | 10 |  | 3·0·7·0 | 새 게임 생성 3 | 10-promptstudio 5, 10-system 2, 90-load 1, 10-newgame 1, 10-battle 1 |
| F24 | 9 | chars.json › [].over · chars.json › [].skillBalance | 0·0·9·0 | 불러오기 6 | 10-characters 9 |
| F25 | 7 |  | 0·0·7·0 | 실행 중 AI 7 | 10-messenger 5, 00-core 1, 10-player 1 |
| F26 | 6 |  | 0·0·6·0 |  | 10-liveops 6 |
| F27 | 6 |  | 3·0·3·0 | 새 게임 생성 6 | 10-liveops 3, 00-core 2, 80-misc 1 |
| F28 | 5 |  | 0·0·5·0 | 새 게임 생성 5 | 10-characters 3, 80-misc 2 |
| F29 | 5 |  | 0·0·5·0 |  | 10-characters 4, 00-core 1 |
| F30 | 4 |  | 2·0·2·0 |  | 10-story 2, 90-load 2 |
| F31 | 3 |  | 1·0·2·0 | 새 게임 생성 1 | 10-system 3 |
| F32 | 3 |  | 0·0·3·0 |  | 90-load 2, 10-economy 1 |
| F33 | 3 |  | 0·1·2·0 | 새 게임 생성 3 | 10-newgame 3 |
| F34 | 3 |  | 1·0·2·0 |  | 10-characters 1, 90-load 1, 10-economy 1 |
| F35 | 3 |  | 1·0·2·0 | 새 게임 생성 3 | 00-core 1, 80-misc 1, 10-liveops 1 |
| F36 | 2 |  | 0·0·2·0 |  | 00-core 1, 10-challenge 1 |
| F37 | 2 |  | 0·0·2·0 |  | 10-system 2 |
| F38 | 2 |  | 0·0·2·0 | 새 게임 생성 2 | 10-world 2 |

### 모듈 판정 — src/main 모듈 20: 고유 4 · 조각 1 · 흩어짐 10 · 슈퍼 4 · 기반 0 · 분배 0 · 층 1

기준(코드 냄새 — docs/research/developer-role.md 1-3): 슈퍼 = 관계없는 기능 둘 이상이 각각 함수 max(3, 20%)↑(발산적 변경 → 기능별로 나눔) · 조각 = 중심 기능의 함수가 다른 모듈에 2배↑(게으른 모듈 → 그 모듈로 합침) · 흩어짐 = 어느 기능도 절반이 안 되고 셋 이상에 나뉨(함수마다 제 기능 모듈로) · 기반 = 허브 함수(25개↑ 함수가 부름) 중심 · 분배 = 액션 분배기 층 · 층 = 프롬프트 스튜디오(사용자 지시로 모든 기능의 프롬프트를 취합) — 분배·층은 판정 대상 아님. 기능 하나 = 모듈 하나(사용자 결정)이고 그 안에서 계층은 함수 단위로 가름(3절). `node tools/map.mjs --why <모듈>`로 근거

| 모듈 | 판정 | 함수 | 기능(함수 수) | 나눌·합칠·보낼 곳 |
|---|---|---|---|---|
| 00-core | 흩어짐 | 224 | chars.json › [].skins 37, 저장소 starfall-sound 16, threads.json › [].added 15 | chars.json › [].skins 37 → 10-characters / 저장소 starfall-sound 16 → 10-system / threads.json › [].added 15 → 10-messenger / chapters.json › [].relScan 12 → 10-story / banners.json 12 → 10-newgame / chars.json › [].skillBalance 11 → 10-characters / chapters.json › [].stages[].post 8 → 10-story / 새 게임 생성 7 → 10-battle / chars.json › [].atk 6 → 10-rules / cardCost 6 → 10-challenge / banners.json › [].active 5 → 10-acquire / 실행 중 AI 5 → 10-characters / chars.json › [].voiceId 5 → 10-system / chars.json › [].faction 3 → 10-acquire / 저장소 ggm-picked 3 → 10-system / chars.json › [].weapon 3 → 10-characters / 새 게임 생성 3 → 10-newgame / 저장소 ggm-voice-ja 2 → 10-system / 실행 중 AI 2 → 10-world / chapters.json › [].stages[].enemies 2 → 10-challenge / 새 게임 생성 2 → 10-liveops / v2DesignContext 1 → 10-characters / 새 게임 생성 1 → 여기 / 실행 중 AI 1 → 10-messenger / bossPatText 1 → 여기 |
| 10-acquire | 슈퍼 | 70 | chars.json › [].faction 23, banners.json › [].active 20, chars.json › [].skins 13 | chars.json › [].faction 23 → 여기 / banners.json › [].active 20 → 여기 |
| 10-art | 흩어짐 | 96 | chars.json › [].skins 20, chars.json › [].voiceId 11, banners.json 10 | chars.json › [].skins 20 → 10-characters / chars.json › [].voiceId 11 → 10-system / banners.json 10 → 10-newgame / chars.json › [].skillBalance 10 → 10-characters / threads.json › [].added 6 → 10-messenger / 저장소 starfall-sound 6 → 10-system / chapters.json › [].stages[].post 6 → 10-story / 저장소 ggm-picked 5 → 10-system / chars.json › [].debut 5 → 10-world / chars.json › [].atk 1 → 10-rules / chars.json › [].weapon 1 → 10-characters / 실행 중 AI 1 → 10-world |
| 10-battle | 슈퍼 | 29 | 새 게임 생성 14, chapters.json › [].stages[].enemies 9, chapters.json › [].stages[].post 2 | 새 게임 생성 14 → 여기 / chapters.json › [].stages[].enemies 9 → 10-challenge |
| 10-challenge | 고유 | 90 | cardCost 55, chapters.json › [].stages[].enemies 12, 새 게임 생성 7 |  |
| 10-characters | 흩어짐 | 315 | chars.json › [].skins 53, chars.json › [].skillBalance 40, chars.json › [].atk 21 | chars.json › [].skins 53 → 여기 / chars.json › [].skillBalance 40 → 여기 / chars.json › [].atk 21 → 10-rules / chars.json › [].weapon 18 → 여기 / chapters.json › [].stages[].post 16 → 10-story / threads.json › [].added 14 → 10-messenger / 저장소 starfall-sound 13 → 10-system / chars.json › [].faction 12 → 10-acquire / banners.json 11 → 10-newgame / 실행 중 AI 11 → 여기 / 새 게임 생성 9 → 10-newgame / chars.json › [].over 9 → 여기 / 새 게임 생성 7 → 10-battle / chapters.json › [].stages[].enemies 7 → 10-challenge / 저장소 ggm-voice-ja 6 → 10-system / chapters.json › [].relScan 6 → 10-story / banners.json › [].active 5 → 10-acquire / v2DesignContext 4 → 여기 / chars.json › [].debut 4 → 10-world / chars.json › [].voiceId 4 → 10-system / 실행 중 AI 3 → 10-world / 새 게임 생성 3 → 여기 / passClaimable 1 → 여기 / EXC 1 → 10-expedition / 저장소 ggm-picked 1 → 10-system |
| 10-economy | 흩어짐 | 50 | 새 게임 생성 10, banners.json › [].active 7, chars.json › [].skillBalance 7 | 새 게임 생성 10 → 10-battle / banners.json › [].active 7 → 10-acquire / chars.json › [].skillBalance 7 → 10-characters / chars.json › [].skins 5 → 10-characters / chapters.json › [].stages[].enemies 4 → 10-challenge / threads.json › [].added 1 → 10-messenger / 저장소 ggm-voice-ja 1 → 10-system / chars.json › [].faction 1 → 10-acquire / mailClean 1 → 90-load / passClaimable 1 → 10-characters |
| 10-expedition | 고유 | 37 | EXC 27, chars.json › [].skins 3, 새 게임 생성 2 |  |
| 10-liveops | 흩어짐 | 88 | banners.json › [].active 19, chars.json › [].weapon 12, threads.json › [].added 11 | banners.json › [].active 19 → 10-acquire / chars.json › [].weapon 12 → 10-characters / threads.json › [].added 11 → 10-messenger / 저장소 starfall-sound 11 → 10-system / 실행 중 AI 8 → 10-characters / apply 6 → 여기 / 새 게임 생성 3 → 여기 / chars.json › [].skins 3 → 10-characters / chapters.json › [].relScan 2 → 10-story / chapters.json › [].stages[].post 2 → 10-story / banners.json 2 → 10-newgame / 새 게임 생성 1 → 10-battle / 새 게임 생성 1 → 00-core / chars.json › [].skillBalance 1 → 10-characters |
| 10-messenger | 고유 | 49 | threads.json › [].added 31, banners.json › [].active 6, 실행 중 AI 5 |  |
| 10-newgame | 흩어짐 | 95 | banners.json 27, 새 게임 생성 17, chars.json › [].skins 12 | banners.json 27 → 여기 / 새 게임 생성 17 → 여기 / chars.json › [].skins 12 → 10-characters / chapters.json › [].stages[].post 11 → 10-story / 저장소 ggm-picked 4 → 10-system / chapters.json › [].stages[].enemies 4 → 10-challenge / 새 게임 생성 3 → 여기 / chapters.json › [].relScan 3 → 10-story / threads.json › [].added 2 → 10-messenger / chars.json › [].atk 1 → 10-rules / 새 게임 생성 1 → 10-system / chars.json › [].skillBalance 1 → 10-characters |
| 10-player | 슈퍼 | 15 | chars.json › [].skins 4, chars.json › [].atk 3, 저장소 starfall-sound 2 | chars.json › [].skins 4 → 10-characters / chars.json › [].atk 3 → 10-rules |
| 10-promptstudio | 층 | 16 | 새 게임 생성 5, chars.json › [].weapon 5, chars.json › [].skins 4 |  |
| 10-rules | 고유 | 46 | chars.json › [].atk 32, banners.json 6, chars.json › [].weapon 4 |  |
| 10-story | 흩어짐 | 141 | chapters.json › [].relScan 23, chapters.json › [].stages[].post 20, 실행 중 AI 16 | chapters.json › [].relScan 23 → 여기 / chapters.json › [].stages[].post 20 → 여기 / 실행 중 AI 16 → 10-world / banners.json 14 → 10-newgame / chapters.json › [].stages[].enemies 9 → 10-challenge / 저장소 ggm-voice-ja 6 → 10-system / chars.json › [].weapon 6 → 10-characters / banners.json › [].active 5 → 10-acquire / threads.json › [].added 4 → 10-messenger / chars.json › [].voiceId 4 → 10-system / chars.json › [].skins 4 → 10-characters / chars.json › [].skillBalance 3 → 10-characters / 저장소 starfall-sound 3 → 10-system / 새 게임 생성 3 → 10-battle / titleLines 2 → 여기 / 저장소 ggm-picked 2 → 10-system / chars.json › [].atk 1 → 10-rules / cardCost 1 → 10-challenge |
| 10-system | 흩어짐 | 223 | 저장소 ggm-picked 81, chars.json › [].voiceId 31, 저장소 starfall-sound 28 | 저장소 ggm-picked 81 → 여기 / chars.json › [].voiceId 31 → 여기 / 저장소 starfall-sound 28 → 여기 / 저장소 ggm-voice-ja 9 → 여기 / cardCost 8 → 10-challenge / chars.json › [].weapon 7 → 10-characters / chars.json › [].skins 7 → 10-characters / chars.json › [].skillBalance 6 → 10-characters / chapters.json › [].stages[].post 5 → 10-story / threads.json › [].added 4 → 10-messenger / 새 게임 생성 3 → 여기 / chars.json › [].atk 3 → 10-rules / 새 게임 생성 3 → 10-battle / 새 게임 생성 2 → 여기 / crc32 2 → 여기 / banners.json › [].active 2 → 10-acquire / chapters.json › [].stages[].enemies 1 → 10-challenge / banners.json 1 → 10-newgame / chapters.json › [].relScan 1 → 10-story |
| 10-world | 슈퍼 | 100 | 실행 중 AI 38, chars.json › [].debut 30, chars.json › [].skins 10 | 실행 중 AI 38 → 여기 / chars.json › [].debut 30 → 여기 |
| 80-misc | 흩어짐 | 55 | chars.json › [].skins 13, threads.json › [].added 7, 저장소 starfall-sound 4 | chars.json › [].skins 13 → 10-characters / threads.json › [].added 7 → 10-messenger / 저장소 starfall-sound 4 → 10-system / 새 게임 생성 2 → 10-characters / chapters.json › [].relScan 2 → 10-story / 실행 중 AI 2 → 10-characters / 새 게임 생성 1 → 10-newgame / banners.json 1 → 10-newgame / 새 게임 생성 1 → 00-core / chars.json › [].weapon 1 → 10-characters / 새 게임 생성 1 → 10-liveops / 저장소 ggm-voice-ja 1 → 10-system |
| 90-load | 흩어짐 | 90 | chars.json › [].skins 18, banners.json 11, chars.json › [].atk 8 | chars.json › [].skins 18 → 10-characters / banners.json 11 → 10-newgame / chars.json › [].atk 8 → 10-rules / chapters.json › [].stages[].post 5 → 10-story / threads.json › [].added 4 → 10-messenger / banners.json › [].active 3 → 10-acquire / 새 게임 생성 3 → 10-battle / chars.json › [].skillBalance 3 → 10-characters / 저장소 starfall-sound 2 → 10-system / 저장소 ggm-voice-ja 2 → 10-system / 실행 중 AI 2 → 10-world / chars.json › [].faction 2 → 10-acquire / mailClean 2 → 여기 / titleLines 2 → 10-story / 저장소 ggm-picked 1 → 10-system / chars.json › [].voiceId 1 → 10-system / passClaimable 1 → 10-characters / 새 게임 생성 1 → 10-system / chapters.json › [].relScan 1 → 10-story / chars.json › [].weapon 1 → 10-characters / chapters.json › [].stages[].enemies 1 → 10-challenge / 새 게임 생성 1 → 10-newgame / EXC 1 → 10-expedition |
| 95-start | 조각 | 1 | chars.json › [].voiceId 1 | → 10-system (chars.json › [].voiceId 1/31) |

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
| src/boot/storage-boot | 17237~17271 | 4 |  |  |  |
| 00-core | 4621~5941 | 224 |  |  | 90-load 174, 10-characters 96, 10-system 65, 10-art 61, 10-newgame 33 |
| 10-acquire | 5942~6578 | 70 | 실행기 32 · 편집기 31 · 생성기 3 | banners.json › [].active, banners.json › [].alt, banners.json › [].bg, banners.json › [].collab, banners.json › [].desc, banners.json › [].gate …외 19 | 00-core 122, 90-load 99, 10-characters 41, 10-system 38, 10-story 14 |
| 10-art | 6579~7212 | 96 | 실행기 20 · 편집기 20 | lib.json › [].affLines, lib.json › [].alias, lib.json › [].audio, lib.json › [].faction, lib.json › [].files, lib.json › [].img …외 12 | 00-core 128, 90-load 80, 10-system 24, 10-characters 19, 10-newgame 8 |
| 10-battle | 7213~7346 | 29 |  |  | 90-load 28, 00-core 24, 10-characters 15, 10-system 7, 10-economy 4 |
| 10-challenge | 7347~7882 | 90 |  |  | 00-core 85, 90-load 57, 10-system 22, 10-characters 18, 10-art 8 |
| 10-characters | 7883~10034 | 315 | 실행기 148 · 편집기 103 · 생성기 20 | banners.json › [].pickup, banners.json › [].pool, banners.json › [].rate, chapters.json › [].kind, chapters.json › [].stages[].post, chapters.json › [].stages[].pre …외 80 | 00-core 368, 90-load 266, 10-system 77, 10-art 46, 10-world 26 |
| 10-economy | 10035~10323 | 50 |  |  | 90-load 85, 00-core 75, 10-characters 20, 10-system 19, 10-art 8 |
| 10-expedition | 10324~10480 | 37 | 생성기 6 · 실행기 6 | dispatches.json, meta.json › expedition, meta.json › farms, meta.json › persona, meta.json › shop, meta.json › variants | 00-core 45, 90-load 34, 10-economy 5, 10-challenge 5, 10-system 5 |
| 10-liveops | 10481~10869 | 88 | 생성기 2 · 실행기 2 | meta.json › auditSeen, meta.json › spots | 00-core 95, 90-load 66, 10-system 19, 10-characters 7, 10-economy 5 |
| 10-messenger | 10870~11179 | 49 | 편집기 7 | threads.json › [].added, threads.json › [].charId, threads.json › [].id, threads.json › [].needOwn, threads.json › [].script, threads.json › [].title …외 1 | 90-load 75, 00-core 51, 10-characters 16, 10-system 9, 10-newgame 2 |
| 10-newgame | 11180~11486 | 95 | 기타 1 · 생성기 9 · 실행기 9 | chars.json › [].name, meta.json › artNeg, meta.json › artTags, meta.json › bible, meta.json › castSex, meta.json › draft …외 4 | 00-core 68, 90-load 19, 10-system 10, 10-characters 9, 10-battle 3 |
| 10-player | 11487~11569 | 15 |  |  | 90-load 17, 00-core 17, 10-system 8, 10-newgame 2, 10-art 2 |
| 10-promptstudio | 11570~11921 | 16 |  |  | 00-core 16, 90-load 6, 10-system 5, 10-battle 1, 10-characters 1 |
| 10-rules | 11922~12135 | 46 | 실행기 3 · 편집기 3 | chapters.json › [].stages[].enemies[].elem, chars.json › [].pos, chars.json › [].role | 00-core 28, 90-load 21, 10-system 5, 10-world 3, 10-characters 3 |
| 10-story | 12136~13144 | 141 | 생성기 38 · 편집기 27 · 실행기 21 | banners.json, chapters.json, chapters.json › [].__purge, chapters.json › [].eventId, chapters.json › [].lore, chapters.json › [].ord …외 49 | 00-core 166, 90-load 140, 10-system 50, 10-newgame 45, 10-characters 41 |
| 10-system | 13145~14717 | 223 | 생성기 20 | banners.json, chapters.json, chars.json, dispatches.json, events.json, game.json › ver …외 14 | 00-core 178, 90-load 147, 10-characters 19, 10-art 16, 10-challenge 14 |
| 10-world | 14718~15081 | 100 | 생성기 1 · 실행기 1 | meta.json › bestiary | 00-core 57, 90-load 34, 10-characters 11, 10-system 6, 10-story 5 |
| 80-misc | 15082~15342 | 55 |  |  | 90-load 25, 00-core 21, 10-characters 7, 10-system 5, 10-world 2 |
| 90-load | 15343~17191 | 105 |  |  | 10-system 11, 00-core 11, 10-characters 6, 10-world 6, 10-story 5 |
| 95-start | 17192~17234 | 1 |  |  |  |
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
- 2026-11-05T00:16 · git 6072b04
  - 함수: 추가 96 (cgCast, naiSkinBase, elSfx, defaultShop, skinPreviewSrc, skinDisplayReady) · 삭제 3 (shAdopt, showCut0, module:modules/combat/030-core.js#baseStats) · 옮김 0
  - banners.json › [].name: +실행기:renameEverywhere
  - banners.json › [].newAt: +실행기:gateCheck
  - banners.json › [].pickup: +실행기:storyPurge
  - banners.json › [].pool: +실행기:storyPurge
  - chapters.json › [].lore: +실행기:evLoreSet
  - chapters.json › [].recruits: +실행기:storyPurge
  - chapters.json › [].relScan: +실행기:evLoreSet
  - chapters.json › [].stages[].combatBalance: +실행기:readChForm
  - chapters.json › [].stages[].enemies: +실행기:readChForm
  - chapters.json › [].stages[].enemies[].elem: +실행기:rulesSave +편집기:rulesSave −기타:rulesSave
- 2026-11-04T22:54 · git 66e349f
- 2026-11-04T22:51 · git 66e349f
- 2026-11-04T22:51 · git 66e349f
- 2026-11-04T22:47 · git 66e349f
- 2026-11-04T22:37 · git 883b36b · src 10: −src/main/99-aliases, 10-liveops, 90-load, app/010-confirm, combat/040-effects, combat/050-bridge, combat/060-generation, combat/070-equipment … · index.html 다시 빌드
  - chars.json › [].over: +기타:inheritOnMark −편집기:inheritOnMark
  - chars.json › [].skillBalance:  −편집기:inheritApply
- 2026-11-04T14:49 · git ef1621f · src 4: 00-core, 10-newgame, 10-world, 99-aliases · index.html 다시 빌드
