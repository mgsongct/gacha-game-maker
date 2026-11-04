# 연관 맵 — 모듈 → 빌드 → index.html(생성기·실행기·편집기) → data 게임 파일

생성: `node tools/map.mjs` · 2026-11-04T10:04 · git f41663d · 입력: src 57파일 · www/index.html 7c2993fbd53b · 시험 게임 2 — 입력이 바뀌면 다시 만들고 바뀐 연결은 맨 아래 "최근 변화"에(증분 갱신, CI `--check`가 맵이 낡았는지 봄)

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
| [].name |  | addPickupFor<sub>10-acquire</sub> rotatePickups<sub>10-acquire</sub> | addPickupFor<sub>10-acquire</sub> renameEverywhere<sub>10-acquire</sub> rotatePickups<sub>10-acquire</sub> |  |  |  | 2/2 |
| [].newAt |  | addPickupFor<sub>10-acquire</sub> | addPickupFor<sub>10-acquire</sub> gateCheck<sub>10-acquire</sub> |  |  |  | 0/2 |
| [].pickup |  | addPickupFor<sub>10-acquire</sub> fix<sub>10-characters</sub> repairRefs<sub>10-acquire</sub> rotatePickups<sub>10-acquire</sub> | addPickupFor<sub>10-acquire</sub> rotatePickups<sub>10-acquire</sub> storyPurge<sub>10-acquire</sub> |  |  |  | 2/2 |
| [].pool |  | addPickupFor<sub>10-acquire</sub> fix<sub>10-characters</sub> repairRefs<sub>10-acquire</sub> | addPickupFor<sub>10-acquire</sub> storyPurge<sub>10-acquire</sub> |  |  |  | 2/2 |
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
| [].lore |  |  | evLoreSet<sub>10-story</sub> |  |  |  | 0/2 |
| [].ord |  |  | handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 2/2 |
| [].recruits |  |  | storyPurge<sub>10-acquire</sub> |  |  |  | 1/2 |
| [].relScan | relFromScripts<sub>10-story</sub> | relFromScripts<sub>10-story</sub> | evLoreSet<sub>10-story</sub> handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 2/2 |
| [].stages |  |  | handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 2/2 |
| [].stages[].combatBalance |  | v2BalanceChapter<sub>combat/050-bridge</sub> v2PrepareStage<sub>combat/050-bridge</sub> | v2BalanceChapter<sub>combat/050-bridge</sub> v2PrepareStage<sub>combat/050-bridge</sub> readChForm<sub>10-story</sub> |  |  |  | 1/2 |
| [].stages[].enemies | buildNewGameDraft<sub>10-story</sub> | v2BalanceChapter<sub>combat/050-bridge</sub> v2PrepareStage<sub>combat/050-bridge</sub> rebalanceChapter<sub>10-story</sub> | v2BalanceChapter<sub>combat/050-bridge</sub> v2PrepareStage<sub>combat/050-bridge</sub> readChForm<sub>10-story</sub> |  | s_rules |  | 2/2 |
| [].stages[].enemies[].atk |  | sysEventFoes<sub>10-story</sub> | sysEventFoes<sub>10-story</sub> |  |  |  | 2/2 |
| [].stages[].enemies[].def |  | sysEventFoes<sub>10-story</sub> | sysEventFoes<sub>10-story</sub> |  |  |  | 2/2 |
| [].stages[].enemies[].elem |  |  | handleStoryAndAuthoringAction<sub>10-story</sub> | rulesSave<sub>10-rules</sub> |  |  | 2/2 |
| [].stages[].enemies[].hp |  | sysEventFoes<sub>10-story</sub> | sysEventFoes<sub>10-story</sub> |  |  |  | 2/2 |
| [].stages[].enemies[].spd |  | sysEventFoes<sub>10-story</sub> | sysEventFoes<sub>10-story</sub> |  |  |  | 2/2 |
| [].stages[].field | stageAutoRules<sub>10-story</sub> | stageAutoRules<sub>10-story</sub> |  |  |  |  | 2/2 |
| [].stages[].goal | stageAutoRules<sub>10-story</sub> | stageAutoRules<sub>10-story</sub> |  |  |  |  | 2/2 |
| [].stages[].post | buildNewGameDraft<sub>10-story</sub> | fix<sub>10-characters</sub> writeStages<sub>10-story</sub> | handleStoryAndAuthoringAction<sub>10-story</sub> readChForm<sub>10-story</sub> writeStages<sub>10-story</sub> |  | s_direct |  | 2/2 |
| [].stages[].pre | buildNewGameDraft<sub>10-story</sub> | fix<sub>10-characters</sub> writeStages<sub>10-story</sub> | handleStoryAndAuthoringAction<sub>10-story</sub> readChForm<sub>10-story</sub> writeStages<sub>10-story</sub> |  | s_direct s_script |  | 2/2 |
| [].stages[].reward |  |  | readChForm<sub>10-story</sub> |  |  |  | 2/2 |
| [].stages[].route | buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 1/2 |
| [].stages[].rulesV | stageAutoRules<sub>10-story</sub> | stageAutoRules<sub>10-story</sub> |  |  | s_rules |  | 2/2 |
| [].stages[].stamina |  |  | handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 0/2 |
| [].stages[].story | buildNewGameDraft<sub>10-story</sub> |  | readChForm<sub>10-story</sub> |  | s_rules |  | 2/2 |
| [].stages[].title |  |  | readChForm<sub>10-story</sub> |  |  |  | 2/2 |

### chars.json — 캐릭터

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| (파일 전체) | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 2/2 |
| [].__deb | buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 0/2 |
| [].affLines |  | fix<sub>10-characters</sub> personaAI<sub>10-characters</sub> |  |  | c_aff |  | 2/2 |
| [].age |  | aiAltChar<sub>10-characters</sub> fix<sub>10-characters</sub> | aiAltChar<sub>10-characters</sub> | conMakeVariant<sub>10-characters</sub> |  |  | 2/2 |
| [].alt |  | aiAltChar<sub>10-characters</sub> | aiAltChar<sub>10-characters</sub> | conMakeVariant<sub>10-characters</sub> |  |  | 0/2 |
| [].altCanon |  | aiAltChar<sub>10-characters</sub> | aiAltChar<sub>10-characters</sub> | conMakeVariant<sub>10-characters</sub> |  |  | 0/2 |
| [].atk |  |  |  | rulesRecalc<sub>10-characters</sub> |  |  | 2/2 |
| [].cards |  |  | drawCardArts<sub>10-characters</sub> |  |  |  | 0/2 |
| [].collab |  | aiNewPickupChar<sub>10-characters</sub> | aiNewPickupChar<sub>10-characters</sub> |  |  |  | 0/2 |
| [].cvar |  |  |  | conMakeVariant<sub>10-characters</sub> |  |  | 0/2 |
| [].debut | buildNewGameDraft<sub>10-story</sub> | debutResolve<sub>10-characters</sub> | debutResolve<sub>10-characters</sub> | fwRead<sub>10-characters</sub> | c_debut |  | 2/2 |
| [].debutLater | buildNewGameDraft<sub>10-story</sub> | debutResolve<sub>10-characters</sub> | debutResolve<sub>10-characters</sub> |  | c_debut |  | 0/2 |
| [].def |  |  |  | rulesRecalc<sub>10-characters</sub> |  |  | 2/2 |
| [].dupLines |  | fix<sub>10-characters</sub> |  |  |  |  | 2/2 |
| [].elem |  | fix<sub>10-characters</sub> | handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 2/2 |
| [].episodes |  | fix<sub>10-characters</sub> | handleStoryAndAuthoringAction<sub>10-story</sub> |  |  |  | 0/2 |
| [].faceMask | artReuse<sub>10-characters</sub> |  | handleImagesAndAssetsAction<sub>10-characters</sub> regenApply<sub>10-characters</sub> |  |  |  | 0/2 |
| [].faces | artReuse<sub>10-characters</sub> | fix<sub>10-characters</sub> | handleImagesAndAssetsAction<sub>10-characters</sub> |  |  |  | 0/2 |
| [].faction |  | aiAltChar<sub>10-characters</sub> aiNewPickupChar<sub>10-characters</sub> fix<sub>10-characters</sub> | aiAltChar<sub>10-characters</sub> aiNewPickupChar<sub>10-characters</sub> regenApply<sub>10-characters</sub> | conMakeVariant<sub>10-characters</sub> fwRead<sub>10-characters</sub> |  |  | 2/2 |
| [].files |  | fix<sub>10-characters</sub> |  |  |  |  | 2/2 |
| [].generation |  |  | v2EditorAction<sub>combat/050-bridge</sub> |  |  |  | 2/2 |
| [].hp |  |  |  | rulesRecalc<sub>10-characters</sub> |  |  | 2/2 |
| [].illust |  | fix<sub>10-characters</sub> |  |  |  |  | 2/2 |
| [].img | artReuse<sub>10-characters</sub> |  |  |  |  |  | 0/2 |
| [].intro |  | fix<sub>10-characters</sub> |  |  | c_intro |  | 2/2 |
| [].lbbg |  | fix<sub>10-characters</sub> | handleImagesAndAssetsAction<sub>10-characters</sub> |  |  |  | 2/2 |
| [].lbcg |  | fix<sub>10-characters</sub> |  |  |  |  | 2/2 |
| [].limited |  | fix<sub>10-characters</sub> | handleNavigationAndToolsAction<sub>10-acquire</sub> |  |  |  | 2/2 |
| [].lines |  | aiAltChar<sub>10-characters</sub> fix<sub>10-characters</sub> personaAI<sub>10-characters</sub> | aiAltChar<sub>10-characters</sub> |  | c_lines |  | 2/2 |
| [].lvLines |  | fix<sub>10-characters</sub> |  |  |  |  | 2/2 |
| [].naiBlocks |  |  | regenApply<sub>10-characters</sub> |  |  |  | 2/2 |
| [].naiPose |  | fix<sub>10-characters</sub> |  |  |  |  | 0/2 |
| [].naiPrompt |  | fix<sub>10-characters</sub> | regenApply<sub>10-characters</sub> | conMakeVariant<sub>10-characters</sub> | c_age c_look c_minor |  | 2/2 |
| [].naiStyle |  | aiAltChar<sub>10-characters</sub> | aiAltChar<sub>10-characters</sub> | conMakeVariant<sub>10-characters</sub> |  |  | 0/2 |
| [].name |  | aiAltChar<sub>10-characters</sub> aiNewPickupChar<sub>10-characters</sub> | aiAltChar<sub>10-characters</sub> aiNewPickupChar<sub>10-characters</sub> drHarmony<sub>10-characters</sub> regenApply<sub>10-characters</sub> | conMakeVariant<sub>10-characters</sub> |  |  | 2/2 |
| [].over |  | inheritAll<sub>10-characters</sub> | inheritOnMark<sub>10-characters</sub> |  |  |  | 0/2 |
| [].persona |  | personaAI<sub>10-characters</sub> |  | personaSave<sub>10-characters</sub> | c_persona c_persona_weak c_pfields |  | 2/2 |
| [].pfields |  | personaAI<sub>10-characters</sub> |  | personaSave<sub>10-characters</sub> | c_pfields |  | 2/2 |
| [].pos |  |  |  | posSpread<sub>10-characters</sub> rulesSave<sub>10-rules</sub> | c_pos |  | 2/2 |
| [].pose |  | fix<sub>10-characters</sub> |  |  |  |  | 2/2 |
| [].rarity |  | aiAltChar<sub>10-characters</sub> aiNewPickupChar<sub>10-characters</sub> fix<sub>10-characters</sub> | aiAltChar<sub>10-characters</sub> aiNewPickupChar<sub>10-characters</sub> | conMakeVariant<sub>10-characters</sub> |  |  | 2/2 |
| [].role |  | fix<sub>10-characters</sub> |  | rulesSave<sub>10-rules</sub> |  |  | 2/2 |
| [].roleSpeedOriginal | v2ApplyRoleSpeed<sub>combat/050-bridge</sub> | v2ApplyRoleSpeed<sub>combat/050-bridge</sub> |  |  |  |  | 2/2 |
| [].roleSpeedRole | v2ApplyRoleSpeed<sub>combat/050-bridge</sub> | v2ApplyRoleSpeed<sub>combat/050-bridge</sub> |  |  |  |  | 2/2 |
| [].roleSpeedVersion | v2ApplyRoleSpeed<sub>combat/050-bridge</sub> | v2ApplyRoleSpeed<sub>combat/050-bridge</sub> |  |  |  |  | 2/2 |
| [].skill |  | fix<sub>10-characters</sub> |  |  |  |  | 2/2 |
| [].skillBalance | v2ApplyRoleSpeed<sub>combat/050-bridge</sub> v2Ensure<sub>combat/050-bridge</sub> v2QueueCharacter<sub>combat/050-bridge</sub> | balRemasterAI<sub>10-characters</sub> inheritApply<sub>10-characters</sub> v2ApplyRoleSpeed<sub>combat/050-bridge</sub> v2Ensure<sub>combat/050-bridge</sub> …외 1 | inheritApply<sub>10-characters</sub> v2EditorAction<sub>combat/050-bridge</sub> regenApply<sub>10-characters</sub> | balFix<sub>10-characters</sub> | c_skills |  | 1/2 |
| [].skillConcept |  |  | v2EditorAction<sub>combat/050-bridge</sub> regenApply<sub>10-characters</sub> |  |  |  | 0/2 |
| [].skillDesignLog | v2GenerateSkills<sub>combat/050-bridge</sub> v2QueueCharacter<sub>combat/050-bridge</sub> | balRemasterAI<sub>10-characters</sub> v2GenerateSkills<sub>combat/050-bridge</sub> v2QueueCharacter<sub>combat/050-bridge</sub> | v2EditorAction<sub>combat/050-bridge</sub> regenApply<sub>10-characters</sub> |  |  |  | 1/2 |
| [].skillGenerationNotice | v2GenerateSkills<sub>combat/050-bridge</sub> v2QueueCharacter<sub>combat/050-bridge</sub> | v2GenerateSkills<sub>combat/050-bridge</sub> v2QueueCharacter<sub>combat/050-bridge</sub> | v2EditorAction<sub>combat/050-bridge</sub> regenApply<sub>10-characters</sub> |  |  |  | 0/2 |
| [].skillGenerationWarning | v2Ensure<sub>combat/050-bridge</sub> | v2Ensure<sub>combat/050-bridge</sub> | v2EditorAction<sub>combat/050-bridge</sub> regenApply<sub>10-characters</sub> | skillResume<sub>10-characters</sub> |  |  | 0/2 |
| [].skillIcons |  | v2IconClick<sub>combat/050-bridge</sub> | v2IconClick<sub>combat/050-bridge</sub> |  |  |  | 0/2 |
| [].skillPending |  | fix<sub>10-characters</sub> |  | skillResume<sub>10-characters</sub> |  |  | 0/2 |
| [].skillPlan | v2GenerateSkills<sub>combat/050-bridge</sub> | v2GenerateSkills<sub>combat/050-bridge</sub> | v2SavePlan<sub>combat/050-bridge</sub> |  |  |  | 0/2 |
| [].skillRevisions |  | v2EquipmentSkillSaved<sub>combat/070-equipment</sub> | v2EquipmentSkillSaved<sub>combat/070-equipment</sub> |  |  |  | 0/2 |
| [].skills | v2Ensure<sub>combat/050-bridge</sub> v2QueueCharacter<sub>combat/050-bridge</sub> | balRemasterAI<sub>10-characters</sub> v2Ensure<sub>combat/050-bridge</sub> v2QueueCharacter<sub>combat/050-bridge</sub> | v2EditorAction<sub>combat/050-bridge</sub> regenApply<sub>10-characters</sub> | skillResume<sub>10-characters</sub> | c_skills |  | 2/2 |
| [].skillsLegacyBackup | v2Ensure<sub>combat/050-bridge</sub> | v2Ensure<sub>combat/050-bridge</sub> |  |  |  |  | 0/2 |
| [].skillTuning |  | balRemasterAI<sub>10-characters</sub> | v2EditorAction<sub>combat/050-bridge</sub> regenApply<sub>10-characters</sub> |  |  |  | 0/2 |
| [].skins | artReuse<sub>10-characters</sub> | fix<sub>10-characters</sub> | handleImagesAndAssetsAction<sub>10-characters</sub> handleNavigationAndToolsAction<sub>10-acquire</sub> |  |  |  | 0/2 |
| [].spd | v2ApplyRoleSpeed<sub>combat/050-bridge</sub> | v2ApplyRoleSpeed<sub>combat/050-bridge</sub> |  | rulesRecalc<sub>10-characters</sub> |  |  | 2/2 |
| [].touch |  | fix<sub>10-characters</sub> |  |  | c_touch |  | 2/2 |
| [].upper |  | fix<sub>10-characters</sub> | handleUpdatesAction<sub>10-characters</sub> |  |  |  | 2/2 |
| [].useStanding | v2Ensure<sub>combat/050-bridge</sub> | v2Ensure<sub>combat/050-bridge</sub> |  |  |  |  | 2/2 |
| [].voiceId |  | aiAltChar<sub>10-characters</sub> | aiAltChar<sub>10-characters</sub> handleSettingsAndAudioAction<sub>10-characters</sub> pubContent<sub>10-characters</sub> shareDefinition<sub>10-characters</sub> | applySharedArchive<sub>10-characters</sub> conMakeVariant<sub>10-characters</sub> |  |  | 0/2 |
| [].voiceName |  |  | handleSettingsAndAudioAction<sub>10-characters</sub> pubContent<sub>10-characters</sub> shareDefinition<sub>10-characters</sub> | applySharedArchive<sub>10-characters</sub> |  |  | 0/2 |
| [].weapon | artReuse<sub>10-characters</sub> fixWeaponPrompts<sub>10-characters</sub> | fix<sub>10-characters</sub> fixWeaponPrompts<sub>10-characters</sub> v2EnsureEquipment<sub>combat/070-equipment</sub> | handleCharactersAction<sub>10-characters</sub> handleImagesAndAssetsAction<sub>10-characters</sub> v2EnsureEquipment<sub>combat/070-equipment</sub> v2GearAction<sub>combat/070-equipment</sub> …외 1 |  | c_weapon |  | 2/2 |

### dispatches.json — 파견

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| (파일 전체) | buildManualGameDraft<sub>10-system</sub> ngWorldExtras<sub>10-expedition</sub> |  |  |  |  |  | 2/2 |

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
| [].affLines |  |  | regenParseCharacter<sub>10-art</sub> |  |  |  | 0/2 |
| [].alias |  | shTake<sub>10-art</sub> | shTake<sub>10-art</sub> |  |  |  | 1/2 |
| [].cast |  |  | handleNavigationAndToolsAction<sub>10-acquire</sub> |  |  |  | 1/2 |
| [].cooldown |  | trainedSkill<sub>combat/030-core</sub> weakenGeneratedSkill<sub>combat/030-core</sub> | trainedSkill<sub>combat/030-core</sub> |  |  |  | 0/2 |
| [].faction |  |  | regenParseCharacter<sub>10-art</sub> |  |  |  | 2/2 |
| [].files |  |  | regenParseCharacter<sub>10-art</sub> |  |  |  | 0/2 |
| [].id |  |  |  | conMakeVariant<sub>10-characters</sub> |  |  | 2/2 |
| [].img | artReuse<sub>10-characters</sub> |  |  |  |  |  | 0/2 |
| [].initial |  | trainedSkill<sub>combat/030-core</sub> | trainedSkill<sub>combat/030-core</sub> |  |  |  | 0/2 |
| [].intro |  |  | regenParseCharacter<sub>10-art</sub> |  |  |  | 0/2 |
| [].lines |  |  | regenParseCharacter<sub>10-art</sub> |  |  |  | 0/2 |
| [].live |  |  | subscribe<sub>10-art</sub> |  |  |  | 0/2 |
| [].lockout |  | trainedSkill<sub>combat/030-core</sub> | trainedSkill<sub>combat/030-core</sub> |  |  |  | 0/2 |
| [].naiPrompt |  |  | regenParseCharacter<sub>10-art</sub> | conMakeVariant<sub>10-characters</sub> |  |  | 0/2 |
| [].name |  | fix<sub>10-characters</sub> | handleNavigationAndToolsAction<sub>10-acquire</sub> regenParseCharacter<sub>10-art</sub> | conMakeVariant<sub>10-characters</sub> |  |  | 2/2 |
| [].profile |  |  | regenParseCharacter<sub>10-art</sub> |  |  |  | 0/2 |
| [].prompt | artReuse<sub>10-characters</sub> | shTake<sub>10-art</sub> | ensureLibPrompts<sub>10-art</sub> handleCharactersAction<sub>10-characters</sub> handleNavigationAndToolsAction<sub>10-acquire</sub> handleSettingsAndAudioAction<sub>10-characters</sub> …외 1 |  | l_imgperson |  | 2/2 |
| [].rarity |  |  |  | conMakeVariant<sub>10-characters</sub> |  |  | 0/2 |
| [].shared |  | shTake<sub>10-art</sub> | shTake<sub>10-art</sub> |  |  |  | 0/2 |
| [].skills |  |  |  | balanceSkill<sub>combat/030-core</sub> balanceSlot<sub>combat/030-core</sub> |  |  | 0/2 |
| [].touch |  |  | regenParseCharacter<sub>10-art</sub> |  |  |  | 0/2 |
| [].triggerEvery |  | trainedSkill<sub>combat/030-core</sub> weakenGeneratedSkill<sub>combat/030-core</sub> | trainedSkill<sub>combat/030-core</sub> |  |  |  | 0/2 |
| [].weapon |  |  | regenParseCharacter<sub>10-art</sub> |  |  |  | 0/2 |

### meta.json — 게임 설정·규칙(건조·포지션·밸런스·일정 …)

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| accent | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 2/2 |
| artNeg | artReuse<sub>10-characters</sub> buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 0/2 |
| artTags | artReuse<sub>10-characters</sub> buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 0/2 |
| auditSeen | ngFinish<sub>10-liveops</sub> |  |  |  |  |  | 0/2 |
| bestiary | bestiaryApply<sub>10-world</sub> | bestiaryApply<sub>10-world</sub> |  |  |  |  | 2/2 |
| bible | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 0/2 |
| castSex | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 0/2 |
| construct | conStartNew<sub>10-acquire</sub> |  |  |  |  |  | 0/2 |
| draft | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 2/2 |
| elems | buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 2/2 |
| expedition | ngWorldExtras<sub>10-expedition</sub> |  |  |  |  |  | 0/2 |
| farms | ngWorldExtras<sub>10-expedition</sub> |  |  |  |  |  | 2/2 |
| manual | buildManualGameDraft<sub>10-system</sub> |  |  |  |  |  | 0/2 |
| persona | ngWorldExtras<sub>10-expedition</sub> |  |  |  |  |  | 0/2 |
| positions | buildNewGameDraft<sub>10-story</sub> |  |  |  | g_pos |  | 2/2 |
| relProf | buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 2/2 |
| roles | buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 2/2 |
| rules | buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 2/2 |
| shop | buildManualGameDraft<sub>10-system</sub> ngWorldExtras<sub>10-expedition</sub> |  |  |  |  |  | 2/2 |
| story | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 2/2 |
| sub | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 2/2 |
| terms | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 2/2 |
| theme | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 2/2 |
| title | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 2/2 |
| tone | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 0/2 |
| variants | ngWorldExtras<sub>10-expedition</sub> |  |  |  |  |  | 0/2 |

### npcs.json — NPC

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| (파일 전체) | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 1/2 |
| [].affLines |  | fix<sub>10-characters</sub> |  |  |  |  | 0/2 |
| [].faces | artReuse<sub>10-characters</sub> | fix<sub>10-characters</sub> |  |  |  |  | 0/2 |
| [].img | artReuse<sub>10-characters</sub> |  |  |  |  |  | 0/2 |
| [].lines |  | fix<sub>10-characters</sub> |  |  |  |  | 0/2 |
| [].naiPrompt | artReuse<sub>10-characters</sub> |  |  |  |  |  | 1/2 |
| [].npc |  | fix<sub>10-characters</sub> |  |  |  |  | 1/2 |
| [].skins |  | fix<sub>10-characters</sub> |  |  |  |  | 0/2 |
| [].touch |  | fix<sub>10-characters</sub> |  |  |  |  | 1/2 |
| [].upper | artReuse<sub>10-characters</sub> | fix<sub>10-characters</sub> |  |  |  |  | 1/2 |

### opening.json — 오프닝

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| (파일 전체) | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 2/2 |

### prog.json — 진행(플레이어)

| 경로 | 생성기 | 실행기 | 편집기 | 기타 | 점검 규칙 | 프롬프트 조각 | 게임 |
|---|---|---|---|---|---|---|---|
| avatar | artReuse<sub>10-characters</sub> buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 0/2 |
| bio | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 0/2 |
| castDone | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 0/2 |
| cbuild | conStartNew<sub>10-acquire</sub> |  |  |  |  |  | 0/2 |
| cres | conStartNew<sub>10-acquire</sub> |  |  |  |  |  | 0/2 |
| gender | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 0/2 |
| genderTxt | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 0/2 |
| hideEyes | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 2/2 |
| lobbyBg | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 2/2 |
| look | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 2/2 |
| nameAsked | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 2/2 |
| player | buildManualGameDraft<sub>10-system</sub> buildNewGameDraft<sub>10-story</sub> |  |  |  |  |  | 0/2 |
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
| 새 게임 생성 | 배경 | 222 | 10-newgame 54, 10-characters 32, 90-load 29, 00-core 27, 10-system 24 …외 12 |  |
| 실행 중 AI | 배경 | 174 | 10-story 35, 10-characters 29, 10-liveops 29, 00-core 27, 10-art 13 …외 9 |  |
| 불러오기 | 배경 | 28 | 10-characters 13, 00-core 4, 10-rules 3, 10-challenge 2, 10-system 2 …외 3 |  |
| 앱 시작 | 배경 | 6 | 90-load 6 |  |

## 3. 계층(MVC) — 모듈마다 View · Controller · Model, 섞인 함수, 방향 위반

기준(CLAUDE.md §0-2, docs/research/developer-role.md 1-1 — 함수 자신이 하는 일로 판정, lib/arch.mjs): View = HTML 마크업 글을 만들거나 DOM을 바꿈 · Controller = 액션 처리기 또는 화면 갱신(render·toast·openModal·closeModal)을 부름 · Model = 게임 상태를 씀·저장소 쓰기·네트워크·AI·그림 서비스 또는 화면과 관계없는 계산·조회 · **섞임** = 한 함수가 화면을 만들면서 상태·저장·서비스를 직접 씀. **방향 위반** = View가 상태·저장·서비스를 바꾸는 함수를 부름(그리다가 바꿈) · Model이 화면을 만드는 함수를 부름. src/main 함수: View 477 · Controller 135 · Model 1087 · 섞임 7 · 방향 위반 126

| 모듈 | View | Controller | Model | 섞임 | 방향 위반 | 섞인 함수(예) | 방향 위반(예) |
|---|---|---|---|---|---|---|---|
| 10-characters | 89 | 19 | 173 | 3 | 24 | handleImagesAndAssetsAction, handleCharactersAction, handleSettingsAndAudioAction | saveLlm→toast, regenApply→regenReadPreview, regenApply→toast |
| 10-system | 60 | 20 | 139 | 0 | 27 |  | aiCall→toast, switchProject→toast, switchProject→reloadGame |
| 00-core | 70 | 20 | 126 | 1 | 19 | checkUpdatePrivate | aiJSON→toast, saveUserPacks→toast, naiGenerate→toast |
| 10-story | 47 | 10 | 76 | 1 | 16 | handleStoryAndAuthoringAction | liveTick→liveBar, liveTick→liveFillNotes, liveTick→openNotice |
| 10-economy | 23 | 5 | 22 | 0 | 13 |  | handleEconomyAction→giveReward, handleEconomyAction→naiDrawItem, handleEconomyAction→storeImage |
| 10-art | 30 | 3 | 63 | 0 | 11 |  | showCast→castRun, bootPrepRun→runPrep, backupImport→toast |
| 10-acquire | 25 | 6 | 38 | 1 | 5 | handleNavigationAndToolsAction | seasonStart→liveBar, seasonStart→artAfterAI, gateCheck→toast |
| 10-liveops | 15 | 13 | 50 | 0 | 5 |  | applyUpdate→toast, applyUpdate→updateAPKRequired, applyUpdate→openModal |
| 10-rules | 8 | 5 | 30 | 0 | 3 |  | rulesSave→rulesRead, rulesSave→toast, rulesSave→applyMeta |
| 10-messenger | 19 | 2 | 16 | 1 | 1 | handleMessengerAction | openPhone→openThread |
| 10-challenge | 27 | 13 | 50 | 0 | 1 |  | cbUlt→cbEnd |
| 10-promptstudio | 3 | 0 | 12 | 0 | 1 |  | pstPolish→aiJSON |

## 4. 기능(같은 데이터·처리) ↔ 화면 · 모듈 판정

기능 = Model·Controller 함수를 호출과 같은 상태 키·data 경로·저장소 키로 이어 모듈성 최대화로 묶은 것(순서를 바꿔 6번 — 과반이 같이 묶인 것만, 경계는 빼고), View 함수는 부르는 Model·Controller의 기능으로 이음. 화면 = 그 기능의 함수에 닿는 index.html 기능 단위(2절). 이름(아래 판정 표) = 그 기능이 가장 많이 쓰는 데이터(여러 기능이 다 쓰는 데이터는 뺌)

| 기능 | 함수 | 주로 쓰는 데이터 | 계층(View·Controller·Model·섞임) | 이어진 화면(닿는 함수 수) | 모듈(함수 수) |
|---|---|---|---|---|---|
| F01 | 274 | chars.json › [].weapon · lib.json › [].prompt · chars.json › [].skins | 104·30·136·4 | 새 게임 생성 50, 실행 중 AI 14, 불러오기 2 | 10-characters 69, 00-core 51, 10-art 22, 10-messenger 21, 90-load 19 …외 12 |
| F02 | 147 | chapters.json › [].relScan · chapters.json › [].stages[].post · chapters.json › [].stages[].pre | 32·7·107·1 | 실행 중 AI 60, 새 게임 생성 40, 불러오기 1 | 10-story 42, 00-core 22, 10-characters 19, 10-newgame 16, 10-world 11 …외 8 |
| F03 | 103 | 저장소 starfall-nai · 저장소 starfall-sound · 저장소 starfall-ai-profiles | 29·3·69·2 | 새 게임 생성 11, 실행 중 AI 1 | 10-system 31, 00-core 17, 10-art 14, 10-characters 13, 10-liveops 11 …외 7 |
| F04 | 102 | banners.json › [].active · banners.json › [].bg · banners.json › [].desc | 23·10·69·0 | 실행 중 AI 40, 새 게임 생성 3, 앱 시작 1 | 10-acquire 21, 10-liveops 21, 10-characters 13, 00-core 9, 10-story 8 …외 8 |
| F05 | 93 | 저장소 ggm-sync · chars.json › [].upper · chars.json › [].voiceId | 25·14·54·0 | 새 게임 생성 4 | 10-system 84, 00-core 3, 10-characters 2, 10-story 2, 10-acquire 1 …외 1 |
| F06 | 92 | chars.json › [].skillBalance · chars.json › [].skills · chars.json › [].weapon | 24·7·61·0 | 불러오기 10, 새 게임 생성 9, 실행 중 AI 9 | 10-characters 34, 10-art 13, 10-system 12, 00-core 9, 10-story 6 …외 7 |
| F07 | 84 | chars.json › [].faction · chars.json › [].name · chars.json › [].rarity | 22·4·58·0 | 새 게임 생성 10, 실행 중 AI 9 | 10-acquire 24, 10-world 24, 10-characters 18, 00-core 7, 90-load 5 …외 4 |
| F08 | 73 |  | 26·10·37·0 |  | 10-challenge 55, 10-system 8, 00-core 6, 10-characters 2, 10-player 1 …외 1 |
| F09 | 69 | banners.json · chapters.json · chars.json | 14·1·54·0 | 새 게임 생성 43, 불러오기 2, 실행 중 AI 2 | 10-newgame 23, 90-load 11, 00-core 9, 10-story 7, 10-art 6 …외 5 |
| F10 | 63 |  | 16·1·46·0 | 새 게임 생성 6, 실행 중 AI 5, 불러오기 4 | 10-world 29, 10-story 17, 10-rules 7, 10-characters 3, 00-core 3 …외 3 |
| F11 | 57 |  | 12·14·31·0 | 새 게임 생성 2 | 10-battle 14, 10-economy 9, 10-characters 8, 00-core 7, 10-challenge 7 …외 5 |
| F12 | 47 | chars.json › [].persona · chars.json › [].pfields · chars.json › [].affLines | 5·10·32·0 | 실행 중 AI 20, 새 게임 생성 7 | 10-characters 17, 10-liveops 12, 00-core 4, 10-rules 4, 10-system 3 …외 5 |
| F13 | 45 | chapters.json › [].stages[].enemies · chapters.json › [].stages[].combatBalance · chapters.json › [].stages[].enemies[].atk | 7·6·32·0 | 새 게임 생성 9, 불러오기 6, 실행 중 AI 1 | 10-challenge 12, 10-battle 9, 10-story 9, 10-newgame 4, 10-economy 4 …외 3 |
| F14 | 36 |  | 10·1·25·0 | 새 게임 생성 10, 불러오기 5 | 10-rules 21, 10-player 3, 00-core 3, 10-characters 2, 10-system 2 …외 5 |
| F15 | 32 |  | 6·5·21·0 |  | 10-expedition 28, 90-load 2, 10-economy 1, 10-characters 1 |
| F16 | 27 | 저장소 ggm-voice-ja | 9·0·18·0 | 새 게임 생성 10, 실행 중 AI 6 | 10-system 9, 10-story 6, 10-characters 6, 90-load 2, 00-core 2 …외 2 |
| F17 | 23 |  | 7·0·16·0 | 실행 중 AI 16, 새 게임 생성 8 | 10-characters 11, 10-liveops 5, 00-core 5, 80-misc 2 |
| F18 | 18 |  | 4·1·13·0 | 새 게임 생성 3, 실행 중 AI 1 | 10-liveops 10, 10-story 3, 10-characters 2, 90-load 1, 10-art 1 …외 1 |
| F19 | 10 | 저장소 ggm-shared-assets | 4·0·6·0 | 실행 중 AI 2 | 10-art 8, 90-load 1, 10-characters 1 |
| F20 | 9 | chars.json › [].over · chars.json › [].skillBalance | 0·0·9·0 | 불러오기 6 | 10-characters 9 |
| F21 | 8 | chars.json › [].pos | 1·2·5·0 | 새 게임 생성 2 | 10-rules 5, 10-newgame 2, 10-characters 1 |
| F22 | 7 | 저장소 ggm-packs | 3·0·4·0 | 새 게임 생성 1 | 10-art 4, 00-core 2, 10-characters 1 |
| F23 | 6 |  | 3·0·3·0 |  | 10-promptstudio 4, 10-system 2 |
| F24 | 6 |  | 3·0·3·0 |  | 10-liveops 3, 00-core 2, 80-misc 1 |
| F25 | 5 |  | 0·0·5·0 |  | 10-characters 4, 00-core 1 |
| F26 | 4 |  | 2·0·2·0 |  | 10-story 2, 90-load 2 |
| F27 | 3 |  | 1·0·2·0 |  | 10-system 3 |
| F28 | 3 |  | 0·0·3·0 |  | 90-load 2, 10-economy 1 |
| F29 | 3 |  | 0·1·2·0 | 새 게임 생성 3 | 10-newgame 3 |
| F30 | 3 |  | 1·0·2·0 |  | 10-characters 1, 90-load 1, 10-economy 1 |
| F31 | 3 |  | 1·0·2·0 |  | 00-core 1, 80-misc 1, 10-liveops 1 |
| F32 | 3 |  | 0·0·3·0 |  | 80-misc 3 |
| F33 | 2 |  | 0·0·2·0 |  | 00-core 1, 10-challenge 1 |
| F34 | 2 |  | 0·0·2·0 |  | 10-system 2 |
| F35 | 2 |  | 0·0·2·0 |  | 10-world 2 |

### 모듈 판정 — src/main 모듈 20: 고유 3 · 조각 1 · 흩어짐 8 · 슈퍼 7 · 기반 1 · 분배 0 · 층 0

기준(코드 냄새 — docs/research/developer-role.md 1-3): 슈퍼 = 관계없는 기능 둘 이상이 각각 함수 max(3, 20%)↑(발산적 변경 → 기능별로 나눔) · 조각 = 중심 기능의 함수가 다른 모듈에 2배↑(게으른 모듈 → 그 모듈로 합침) · 흩어짐 = 어느 기능도 절반이 안 되고 셋 이상에 나뉨(함수마다 제 기능 모듈로) · 기반 = 허브 함수(25개↑ 함수가 부름) 중심 · 분배 = 액션 분배기 층 · 층 = 프롬프트 스튜디오(사용자 지시로 모든 기능의 프롬프트를 취합) — 분배·층은 판정 대상 아님. 기능 하나 = 모듈 하나(사용자 결정)이고 그 안에서 계층은 함수 단위로 가름(3절). `node tools/map.mjs --why <모듈>`로 근거

| 모듈 | 판정 | 함수 | 기능(함수 수) | 나눌·합칠·보낼 곳 |
|---|---|---|---|---|
| 00-core | 흩어짐 | 217 | chars.json › [].weapon 51, chapters.json › [].relScan 22, 저장소 starfall-nai 17 | chars.json › [].weapon 51 → 10-characters / chapters.json › [].relScan 22 → 10-story / 저장소 starfall-nai 17 → 10-system / banners.json › [].active 9 → 10-acquire / banners.json 9 → 10-newgame / chars.json › [].skillBalance 9 → 10-characters / chars.json › [].faction 7 → 10-acquire / 새 게임 생성 7 → 10-battle / cardCost 6 → 10-challenge / 실행 중 AI 5 → 10-characters / chars.json › [].persona 4 → 10-characters / 새 게임 생성 3 → 10-world / 저장소 ggm-sync 3 → 10-system / 새 게임 생성 3 → 10-rules / 저장소 ggm-packs 2 → 10-art / 저장소 ggm-voice-ja 2 → 10-system / chapters.json › [].stages[].enemies 2 → 10-challenge / regenFields 2 → 10-liveops / v2DesignContext 1 → 10-characters / regenCancel 1 → 여기 / bossPatText 1 → 여기 |
| 10-acquire | 슈퍼 | 70 | chars.json › [].faction 24, banners.json › [].active 21, chars.json › [].weapon 13 | chars.json › [].faction 24 → 여기 / banners.json › [].active 21 → 여기 |
| 10-art | 흩어짐 | 96 | chars.json › [].weapon 22, 저장소 starfall-nai 14, chars.json › [].skillBalance 13 | chars.json › [].weapon 22 → 10-characters / 저장소 starfall-nai 14 → 10-system / chars.json › [].skillBalance 13 → 10-characters / chapters.json › [].relScan 9 → 10-story / 저장소 ggm-shared-assets 8 → 여기 / banners.json 6 → 10-newgame / 저장소 ggm-packs 4 → 여기 / 저장소 ggm-sync 1 → 10-system / 새 게임 생성 1 → 10-liveops / chars.json › [].persona 1 → 10-characters / 새 게임 생성 1 → 10-world / chars.json › [].faction 1 → 10-acquire |
| 10-battle | 슈퍼 | 29 | 새 게임 생성 14, chapters.json › [].stages[].enemies 9, chapters.json › [].relScan 2 | 새 게임 생성 14 → 여기 / chapters.json › [].stages[].enemies 9 → 10-challenge |
| 10-challenge | 고유 | 90 | cardCost 55, chapters.json › [].stages[].enemies 12, 새 게임 생성 7 |  |
| 10-characters | 흩어짐 | 284 | chars.json › [].weapon 69, chars.json › [].skillBalance 34, chapters.json › [].relScan 19 | chars.json › [].weapon 69 → 여기 / chars.json › [].skillBalance 34 → 여기 / chapters.json › [].relScan 19 → 10-story / chars.json › [].faction 18 → 10-acquire / chars.json › [].persona 17 → 여기 / banners.json › [].active 13 → 10-acquire / 저장소 starfall-nai 13 → 10-system / 실행 중 AI 11 → 여기 / chars.json › [].over 9 → 여기 / 새 게임 생성 8 → 10-battle / 저장소 ggm-voice-ja 6 → 10-system / banners.json 5 → 10-newgame / v2DesignContext 4 → 여기 / chapters.json › [].stages[].enemies 3 → 10-challenge / 새 게임 생성 3 → 10-world / 새 게임 생성 2 → 10-liveops / cardCost 2 → 10-challenge / 새 게임 생성 2 → 10-rules / 저장소 ggm-sync 2 → 10-system / passClaimable 1 → 여기 / chars.json › [].pos 1 → 10-rules / EXC 1 → 10-expedition / 저장소 ggm-packs 1 → 10-art / 저장소 ggm-shared-assets 1 → 10-art |
| 10-economy | 슈퍼 | 50 | 새 게임 생성 9, banners.json › [].active 8, chars.json › [].weapon 7 | 새 게임 생성 9 → 10-battle / banners.json › [].active 8 → 10-acquire |
| 10-expedition | 고유 | 37 | EXC 28, chars.json › [].weapon 3, 새 게임 생성 2 |  |
| 10-liveops | 흩어짐 | 78 | banners.json › [].active 21, chars.json › [].persona 12, 저장소 starfall-nai 11 | banners.json › [].active 21 → 10-acquire / chars.json › [].persona 12 → 10-characters / 저장소 starfall-nai 11 → 10-system / 새 게임 생성 10 → 여기 / 실행 중 AI 5 → 10-characters / chapters.json › [].relScan 3 → 10-story / regenFields 3 → 여기 / chars.json › [].weapon 3 → 10-characters / banners.json 2 → 10-newgame / regenCancel 1 → 00-core / chars.json › [].skillBalance 1 → 10-characters |
| 10-messenger | 조각 | 38 | chars.json › [].weapon 21, banners.json › [].active 6, chapters.json › [].relScan 4 | → 10-characters (chars.json › [].weapon 21/69) |
| 10-newgame | 슈퍼 | 62 | banners.json 23, chapters.json › [].relScan 16, chars.json › [].weapon 11 | banners.json 23 → 여기 / chapters.json › [].relScan 16 → 10-story |
| 10-player | 슈퍼 | 15 | chars.json › [].weapon 4, 새 게임 생성 3, banners.json › [].active 2 | chars.json › [].weapon 4 → 10-characters / 새 게임 생성 3 → 10-rules |
| 10-promptstudio | 슈퍼 | 15 | pfDef 4, chars.json › [].weapon 4, 저장소 starfall-nai 3 | pfDef 4 → 여기 / chars.json › [].weapon 4 → 10-characters / 저장소 starfall-nai 3 → 10-system |
| 10-rules | 고유 | 43 | 새 게임 생성 21, 새 게임 생성 7, chars.json › [].pos 5 |  |
| 10-story | 흩어짐 | 134 | chapters.json › [].relScan 42, 새 게임 생성 17, chapters.json › [].stages[].enemies 9 | chapters.json › [].relScan 42 → 여기 / 새 게임 생성 17 → 10-world / chapters.json › [].stages[].enemies 9 → 10-challenge / banners.json › [].active 8 → 10-acquire / banners.json 7 → 10-newgame / chars.json › [].skillBalance 6 → 10-characters / 저장소 ggm-voice-ja 6 → 10-system / chars.json › [].weapon 5 → 10-characters / 저장소 starfall-nai 3 → 10-system / 새 게임 생성 3 → 10-battle / 새 게임 생성 3 → 10-liveops / chars.json › [].persona 2 → 10-characters / titleLines 2 → 여기 / 저장소 ggm-sync 2 → 10-system / 새 게임 생성 1 → 10-rules / cardCost 1 → 10-challenge |
| 10-system | 흩어짐 | 219 | 저장소 ggm-sync 84, 저장소 starfall-nai 31, chars.json › [].weapon 12 | 저장소 ggm-sync 84 → 여기 / 저장소 starfall-nai 31 → 여기 / chars.json › [].weapon 12 → 10-characters / chars.json › [].skillBalance 12 → 10-characters / 저장소 ggm-voice-ja 9 → 여기 / cardCost 8 → 10-challenge / chapters.json › [].relScan 7 → 10-story / banners.json 4 → 10-newgame / chars.json › [].persona 3 → 10-characters / banners.json › [].active 3 → 10-acquire / applyOrient 3 → 여기 / 새 게임 생성 3 → 10-battle / pfDef 2 → 10-promptstudio / crc32 2 → 여기 / chapters.json › [].stages[].enemies 2 → 10-challenge / 새 게임 생성 2 → 10-rules |
| 10-world | 슈퍼 | 83 | 새 게임 생성 29, chars.json › [].faction 24, chars.json › [].weapon 11 | 새 게임 생성 29 → 여기 / chars.json › [].faction 24 → 10-acquire |
| 80-misc | 흩어짐 | 55 | chars.json › [].weapon 16, 저장소 starfall-nai 4, smFocused 3 | chars.json › [].weapon 16 → 10-characters / 저장소 starfall-nai 4 → 10-system / smFocused 3 → 여기 / chapters.json › [].relScan 2 → 10-story / banners.json › [].active 2 → 10-acquire / 실행 중 AI 2 → 10-characters / regenCancel 1 → 00-core / chars.json › [].persona 1 → 10-characters / regenFields 1 → 10-liveops / 저장소 ggm-voice-ja 1 → 10-system |
| 90-load | 흩어짐 | 90 | chars.json › [].weapon 19, banners.json 11, chapters.json › [].relScan 9 | chars.json › [].weapon 19 → 10-characters / banners.json 11 → 10-newgame / chapters.json › [].relScan 9 → 10-story / banners.json › [].active 6 → 10-acquire / chars.json › [].skillBalance 5 → 10-characters / chars.json › [].faction 5 → 10-acquire / 새 게임 생성 3 → 10-battle / 저장소 starfall-nai 2 → 10-system / 저장소 ggm-voice-ja 2 → 10-system / 새 게임 생성 2 → 10-world / EXC 2 → 10-expedition / chars.json › [].persona 2 → 10-characters / mailClean 2 → 여기 / titleLines 2 → 10-story / 저장소 ggm-shared-assets 1 → 10-art / passClaimable 1 → 10-characters / 새 게임 생성 1 → 10-liveops / 새 게임 생성 1 → 10-rules |
| 95-start | 기반 | 1 |  |  |

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
| src/boot/storage-boot | 18416~18450 | 4 |  |  |  |
| 00-core | 4621~5937 | 217 |  |  | 90-load 171, 10-characters 100, 10-system 65, 10-art 61, 80-misc 30 |
| 10-acquire | 5938~6574 | 70 | 실행기 23 · 편집기 30 · 생성기 3 | banners.json › [].active, banners.json › [].alt, banners.json › [].bg, banners.json › [].collab, banners.json › [].desc, banners.json › [].gate …외 19 | 00-core 122, 90-load 99, 10-characters 41, 10-system 38, 10-story 14 |
| 10-art | 6575~7208 | 96 | 편집기 15 · 실행기 3 | lib.json › [].affLines, lib.json › [].alias, lib.json › [].faction, lib.json › [].files, lib.json › [].intro, lib.json › [].lines …외 8 | 00-core 128, 90-load 80, 10-system 24, 10-characters 19, 10-newgame 8 |
| 10-battle | 7209~7342 | 29 |  |  | 90-load 28, 00-core 24, 10-characters 15, 10-system 7, 10-economy 4 |
| 10-challenge | 7343~7878 | 90 |  |  | 00-core 85, 90-load 57, 10-system 22, 10-characters 18, 10-art 8 |
| 10-characters | 7879~9984 | 284 | 실행기 67 · 편집기 47 · 기타 29 · 생성기 15 | banners.json › [].pickup, banners.json › [].pool, banners.json › [].rate, chapters.json › [].kind, chapters.json › [].stages[].post, chapters.json › [].stages[].pre …외 74 | 00-core 377, 90-load 256, 10-system 77, 10-art 46, 10-world 26 |
| 10-economy | 9985~10273 | 50 |  |  | 90-load 85, 00-core 75, 10-characters 20, 10-system 19, 10-art 8 |
| 10-expedition | 10274~10430 | 37 | 생성기 6 | dispatches.json, meta.json › expedition, meta.json › farms, meta.json › persona, meta.json › shop, meta.json › variants | 00-core 45, 90-load 34, 10-economy 5, 10-challenge 5, 10-system 5 |
| 10-liveops | 10431~10802 | 78 | 생성기 1 | meta.json › auditSeen | 00-core 95, 90-load 63, 10-system 19, 10-characters 7, 10-economy 5 |
| 10-messenger | 10803~11095 | 38 | 편집기 7 | threads.json › [].added, threads.json › [].charId, threads.json › [].id, threads.json › [].needOwn, threads.json › [].script, threads.json › [].title …외 1 | 90-load 73, 00-core 49, 10-characters 16, 10-system 9, 10-newgame 2 |
| 10-newgame | 11096~11307 | 62 |  |  | 00-core 54, 90-load 16, 10-system 9, 10-characters 4, 10-battle 3 |
| 10-player | 11308~11390 | 15 |  |  | 90-load 17, 00-core 17, 10-system 8, 10-newgame 2, 10-art 2 |
| 10-promptstudio | 11391~11463 | 15 |  |  | 00-core 16, 90-load 6, 10-system 3, 10-characters 1 |
| 10-rules | 11464~11669 | 43 | 기타 3 | chapters.json › [].stages[].enemies[].elem, chars.json › [].pos, chars.json › [].role | 00-core 28, 90-load 20, 10-system 5, 10-world 3, 10-newgame 3 |
| 10-story | 11670~12663 | 134 | 생성기 56 · 편집기 27 · 실행기 12 | banners.json, chapters.json, chapters.json › [].__purge, chapters.json › [].eventId, chapters.json › [].lore, chapters.json › [].ord …외 67 | 00-core 167, 90-load 138, 10-system 51, 10-newgame 42, 10-characters 41 |
| 10-system | 12664~14231 | 219 | 생성기 40 | banners.json, chapters.json, chars.json, dispatches.json, events.json, game.json › ver …외 34 | 00-core 179, 90-load 147, 10-characters 19, 10-art 16, 10-challenge 14 |
| 10-world | 14232~14579 | 83 | 생성기 1 · 실행기 1 | meta.json › bestiary | 00-core 57, 90-load 30, 10-characters 11, 10-system 6, 10-story 5 |
| 80-misc | 14580~14841 | 55 |  |  | 90-load 24, 00-core 23, 10-system 5, 10-world 2, 10-characters 2 |
| 90-load | 14842~16754 | 105 |  |  | 10-system 10, 00-core 4, 10-story 2, 10-economy 2, 10-expedition 1 |
| 95-start | 16755~16797 | 1 |  |  |  |
| app/010-confirm | 2074~2091 | 1 |  |  |  |
| app/020-construct | 2094~2208 | 18 |  |  |  |
| app/030-expedition | 2211~2278 | 14 |  |  |  |
| combat/010-catalog | 2282~2292 | 3 |  |  |  |
| combat/020-visual-catalog | 2295~2379 | 3 |  |  |  |
| combat/030-core | 2382~3310 | 128 | 실행기 6 · 편집기 4 · 기타 2 | lib.json › [].cooldown, lib.json › [].initial, lib.json › [].lockout, lib.json › [].skills, lib.json › [].triggerEvery |  |
| combat/040-effects | 3313~3766 | 49 |  |  | 10-system 8, 90-load 1 |
| combat/050-bridge | 3769~4144 | 70 | 실행기 22 · 편집기 14 · 생성기 17 | chapters.json › [].stages[].combatBalance, chapters.json › [].stages[].enemies, chars.json › [].generation, chars.json › [].roleSpeedOriginal, chars.json › [].roleSpeedRole, chars.json › [].roleSpeedVersion …외 12 | 90-load 25, 00-core 14, 10-characters 8, 10-system 6, 10-art 3 |
| combat/060-generation | 4147~4369 | 29 |  |  | 10-characters 4, 10-art 2, 90-load 2, 00-core 1 |
| combat/070-equipment | 4372~4484 | 19 | 실행기 2 · 편집기 3 | chars.json › [].skillRevisions, chars.json › [].weapon | 90-load 8, 00-core 5, 10-characters 4, 10-system 3 |
| combat/080-training | 4487~4511 | 9 |  |  | 90-load 10, 10-characters 6, 00-core 4, 10-system 1, 10-art 1 |
| combat/090-practice | 4514~4567 | 9 |  |  | 90-load 7, 00-core 5, 10-characters 1, 10-system 1, 10-challenge 1 |

## 7. 최근 변화(증분 갱신 기록)

- 2026-11-04T10:04 · git f41663d · src 2: +src/main/95-start, 90-load · index.html 다시 빌드
  - 함수: 추가 356 (relCtx, drText, naiStyle, naiGenerate, naiTarget, faceDrawOne) · 삭제 36 (llmCode, unitPower, enemyPower, balPower, module:modules/app/020-construct.js#inGroup, module:modules/app/020-construct.js#condMatch) · 옮김 0
  - chapters.json › [].kind: +실행기:fix
  - chapters.json › [].stages: +편집기:handleStoryAndAuthoringAction
  - chapters.json › [].stages[].combatBalance: +편집기:module:modules/combat/050-bridge.js#v2BalanceChapter +편집기:module:modules/combat/050-bridge.js#v2PrepareStage +편집기:readChForm
  - chapters.json › [].stages[].enemies: +실행기:rebalanceChapter +편집기:module:modules/combat/050-bridge.js#v2BalanceChapter +편집기:module:modules/combat/050-bridge.js#v2PrepareStage +편집기:readChForm +생성기:buildNewGameDraft
  - chapters.json › [].stages[].story: +편집기:readChForm +생성기:buildNewGameDraft
  - chars.json: +생성기:buildManualGameDraft +생성기:buildNewGameDraft
  - chars.json › [].activeStarted:  −실행기:module:modules/combat/030-core.js#cast −편집기:module:modules/combat/030-core.js#cast
  - chars.json › [].alt: +실행기:aiAltChar +편집기:aiAltChar +기타:conMakeVariant
  - chars.json › [].atk: +기타:rulesRecalc
  - chars.json › [].aura:  −실행기:module:modules/combat/030-core.js#reactHit −편집기:module:modules/combat/030-core.js#reactHit
- 2026-11-04T09:50 · git f41663d · src 112: +src/main/00-core, +src/main/10-acquire, +src/main/10-art, +src/main/10-battle, +src/main/10-challenge, +src/main/10-characters, +src/main/10-economy, +src/main/10-expedition … · index.html 다시 빌드
  - 함수: 추가 34 (llmCode, unitPower, module:modules/app/020-construct.js#inGroup, module:modules/app/020-construct.js#condMatch, module:modules/combat/030-core.js#baseStats, module:modules/combat/030-core.js#isRanged) · 삭제 696 (elemLine, T, applyMeta, skinFaces, promptOv, imgAuditScan) · 옮김 19 (charById: src/main/0010-base/0060-util.js → src/main/90-load.js; libById: src/main/0010-base/0060-util.js → src/main/90-load.js; playerName: src/main/0010-base/0060-util.js → src/main/90-load.js; isMe: src/main/0010-base/0060-util.js → src/main/90-load.js)
  - banners.json:  −실행기:aiPickupStory −실행기:puStoryBg −편집기:handleNavigationAndToolsAction −편집기:handleStoryAndAuthoringAction −생성기:buildManualGameDraft −생성기:buildNewGameDraft
  - banners.json › [].active:  −실행기:addPickupFor −실행기:seasonStart −편집기:readBanner
  - banners.json › [].alt:  −실행기:addPickupFor
  - banners.json › [].bg:  −실행기:addPickupFor −실행기:aiPickupStory −실행기:rotatePickups −편집기:readBanner
  - banners.json › [].collab:  −실행기:addPickupFor
  - banners.json › [].desc:  −실행기:addPickupFor −실행기:aiPickupStory −실행기:rotatePickups −편집기:handleNavigationAndToolsAction −편집기:readBanner
  - banners.json › [].eventId:  −실행기:aiPickupStory
  - banners.json › [].gate:  −실행기:addPickupFor
  - banners.json › [].id:  −실행기:addPickupFor −편집기:handleNavigationAndToolsAction
  - banners.json › [].name:  −실행기:addPickupFor −실행기:rotatePickups −편집기:handleNavigationAndToolsAction −편집기:readBanner −편집기:renameEverywhere
- 2026-11-04T09:06 · git 1251f3a
- 2026-11-04T09:06 · git 1251f3a · src 128: +src/main/0010-base/0010-rules, +src/main/0010-base/0060-util, +src/main/0015-prompt-studio/0440-ai-context, +src/main/0020-ai, +src/main/0030-image/0310-art-after-ai, +src/main/0030-image/0330-casting, +src/main/0030-image/0565-asset-library, +src/main/0070-store/0070-save … · index.html 다시 빌드
  - 함수: 추가 0 · 삭제 1 (showCut0) · 옮김 574 (elemLine: src/main/0010-rules.js → src/main/0010-base/0010-rules.js; T: src/main/0010-rules.js → src/main/0010-base/0010-rules.js; applyMeta: src/main/0010-rules.js → src/main/0010-base/0010-rules.js; charById: src/main/0060-util.js → src/main/0010-base/0060-util.js)
- 2026-11-04T08:45 · git a566785 · src 2: 0020-ai-connect, 0360-sync/050-single-device · index.html 다시 빌드
- 2026-11-04T08:33 · git a566785
- 2026-11-04T08:32 · git a566785 · src 2: 0020-ai-connect, 0360-sync/050-single-device · index.html 다시 빌드
- 2026-11-04T08:25 · git 5e8f873 · src 7: 0015-prompt-studio/030-builders, 0070-save, 0100-messenger, 0110-challenge-raid, 0250-story-factory, 0275-expedition, 0530-story-memory · index.html 다시 빌드
  - 함수: 추가 1 (raidBossOf) · 삭제 0 · 옮김 1 (storyWrapUp: src/main/0530-story-memory.js → src/main/0250-story-factory.js)
  - prog.json › exped:  −실행기:exBusyIds
  - prog.json › fchat:  −실행기:phRooms −실행기:roomItems
  - prog.json › raid:  −실행기:raidBoss
