# 자기점검 보고서

생성: `node tools/check.mjs` · 2026-11-03T05:20 · 9.4초

| 항목 | 값 |
|---|---|
| 분석 단위 | main(한 스크립트 88파일 9920줄) + 모듈·부트 15개 |
| 함수(최상위) | 1548 · 호출 간선 7038 |
| 오류 | 0 |
| 경고 | 0 |
| 화면 액션 | 발신 660 · 처리 707 · 처리기 없음 0 · 발신 없는 처리기 47 · 중복 처리 0 |
| 상태 변경 함수 | 67 (저장 표시 없음 0) |

## 오류 (0)

## 경고 (0)

## 병목·경합 후보 (팬인 × 복잡도)
| 함수 | 위치 | 부르는 함수 | 호출 수 | 부르는 함수 수(팬아웃) | 복잡도 | 상태 변경 |
|---|---|---|---|---|---|---|
| T | src/main/0010-rules.js:49 | 188 | 577 | 0 | 7 |  |
| mark | src/main/0070-save.js:121 | 186 | 368 | 3 | 6 |  |
| esc | src/main/0060-util.js:10 | 273 | 1250 | 0 | 2 |  |
| P | src/main/0060-util.js:13 | 194 | 350 | 0 | 1 |  |
| openModal | src/main/0230-modal.js:4 | 127 | 152 | 7 | 3 |  |
| render | src/main/0180-ui-scroll.js:33 | 60 | 177 | 20 | 20 |  |
| toast | src/main/0060-util.js:19 | 161 | 593 | 0 | 1 |  |
| imgSrc | src/main/0080-storage-integration.js:57 | 66 | 150 | 2 | 10 |  |
| $ | src/main/0060-util.js:4 | 149 | 870 | 0 | 1 |  |
| head | src/main/0230-modal.js:10 | 120 | 132 | 0 | 1 |  |
| naiCfg | src/main/0020-ai-connect.js:387 | 40 | 43 | 2 | 24 |  |
| art | src/main/0080-storage-integration.js:80 | 37 | 46 | 5 | 24 |  |
| aiJSON | src/main/0450-relations-memory.js:95 | 44 | 65 | 2 | 13 |  |
| charById | src/main/0060-util.js:14 | 106 | 203 | 0 | 1 |  |
| http | src/main/0020-ai-connect.js:72 | 24 | 29 | 7 | 81 |  |

## 꼬인 흐름: 서로 부르는 순환 (5)
- 8개: module:modules/combat/030-core.js#heal ↔ module:modules/combat/030-core.js#proc ↔ module:modules/combat/030-core.js#addStatus ↔ module:modules/combat/030-core.js#reactHit ↔ module:modules/combat/030-core.js#damage ↔ module:modules/combat/030-core.js#hit ↔ module:modules/combat/030-core.js#apply ↔ module:modules/combat/030-core.js#cast
- 6개: skinRefresh ↔ skinAcceptRun ↔ go ↔ wideFit ↔ lbReveal ↔ openChar
- 3개: imgSrcRaw ↔ skinPreviewSrc ↔ imgSrc
- 3개: walk ↔ safeIds ↔ fix
- 2개: module:modules/combat/050-bridge.js#v2DrainBattleEvents ↔ module:modules/combat/050-bridge.js#v2BattleEvents

## 가장 깊은 호출 사슬 (콜스택)
- 깊이 29: handleNavigationAndToolsAction → liveTick → seasonStart → aiPickupStory → aiEventGen → artAfterAI → artRun → go → showStart → showCast → castRun → faceDrawOne → focusedInpaint → draw → naiDraw → naiGenerate → imageCandidates → render → mailTick → sendMail → mark → naiBlocksGame → remember → naiBlocksRemember → naiBlocksUpgrade → naiBlocksKnownStyle → naiStyle → joinTags → tagList
- 깊이 27: handleStoryAndAuthoringAction → puStoryBg → aiEventGen → artAfterAI → artRun → go → showStart → showCast → castRun → faceDrawOne → focusedInpaint → draw → naiDraw → naiGenerate → imageCandidates → render → mailTick → sendMail → mark → naiBlocksGame → remember → naiBlocksRemember → naiBlocksUpgrade → naiBlocksKnownStyle → naiStyle → joinTags → tagList
- 깊이 27: handleEconomyAction → puStoryBg → aiEventGen → artAfterAI → artRun → go → showStart → showCast → castRun → faceDrawOne → focusedInpaint → draw → naiDraw → naiGenerate → imageCandidates → render → mailTick → sendMail → mark → naiBlocksGame → remember → naiBlocksRemember → naiBlocksUpgrade → naiBlocksKnownStyle → naiStyle → joinTags → tagList
- 깊이 26: handleImagesAndAssetsAction → openNaiGen → registerNaiJob → artRun → go → showStart → showCast → castRun → faceDrawOne → focusedInpaint → draw → naiDraw → naiGenerate → imageCandidates → render → mailTick → sendMail → mark → naiBlocksGame → remember → naiBlocksRemember → naiBlocksUpgrade → naiBlocksKnownStyle → naiStyle → joinTags → tagList
- 깊이 24: handleCombatAndFormationAction → dgMove → go → showStart → showCast → castRun → faceDrawOne → focusedInpaint → draw → naiDraw → naiGenerate → imageCandidates → render → mailTick → sendMail → mark → naiBlocksGame → remember → naiBlocksRemember → naiBlocksUpgrade → naiBlocksKnownStyle → naiStyle → joinTags → tagList

## 복잡한 함수 (분기 ≥40 · 120줄 이상 · 중첩 ≥7) — 50
| 함수 | 위치 | 복잡도 | 줄 | 중첩 |
|---|---|---|---|---|
| handleImagesAndAssetsAction | src/main/0510-actions/100-images-and-assets.js:1 | 414 | 174 | 6 |
| handleNavigationAndToolsAction | src/main/0510-actions/020-navigation-and-tools.js:1 | 394 | 193 | 3 |
| handleStoryAndAuthoringAction | src/main/0510-actions/040-story-and-authoring.js:1 | 330 | 169 | 4 |
| handleSettingsAndAudioAction | src/main/0510-actions/050-settings-and-audio.js:1 | 186 | 83 | 3 |
| handleStorageAndSharingAction | src/main/0510-actions/060-storage-and-sharing.js:1 | 160 | 69 | 2 |
| buildNewGameDraft | src/main/0250-story-factory.js:193 | 154 | 90 | 2 |
| handleCombatAndFormationAction | src/main/0510-actions/070-combat-and-formation.js:1 | 145 | 61 | 4 |
| handleCharactersAction | src/main/0510-actions/090-characters.js:1 | 135 | 46 | 5 |
| cbPlay | src/main/0120-abyss.js:210 | 106 | 44 | 3 |
| v2CompileSlot | src/modules/combat/060-generation.js:28 | 100 | 64 | 4 |
| openChar | src/main/0230-modal.js:85 | 94 | 93 | 2 |
| handleSetupAction | src/main/0510-actions/010-setup.js:4 | 92 | 39 | 2 |
| cutoutWhite | src/main/0030-character-regen.js:401 | 91 | 65 | 5 |
| handleMessengerAction | src/main/0510-actions/120-messenger.js:1 | 91 | 43 | 2 |
| apply | src/modules/combat/030-core.js:762 | 90 | 45 | 4 |
| handleEconomyAction | src/main/0510-actions/110-economy.js:1 | 87 | 44 | 3 |
| validate | src/modules/combat/030-core.js:63 | 84 | 36 | 5 |
| http | src/main/0020-ai-connect.js:72 | 81 | 43 | 5 |
| fix | src/main/0070-save.js:41 | 78 | 75 | 4 |
| damage | src/modules/combat/030-core.js:685 | 74 | 40 | 4 |
| effectText | src/modules/combat/010-catalog.js:5 | 70 | 2 | 2 |
| fcSend | src/main/0160-free-chat.js:37 | 69 | 39 | 3 |
| naiGenerate0 | src/main/0030-character-regen.js:533 | 68 | 62 | 4 |
| studioHTML | src/main/0180-ui-scroll.js:570 | 68 | 81 | 1 |
| liveTick | src/main/0290-season-rotation.js:69 | 64 | 43 | 4 |
| stageBackup | src/main/0520-backup-storage.js:58 | 63 | 16 | 7 |
| lobbyHTML | src/main/0180-ui-scroll.js:71 | 62 | 43 | 0 |
| cast | src/modules/combat/030-core.js:808 | 58 | 22 | 3 |
| aiPolicy | src/modules/combat/030-core.js:334 | 56 | 33 | 4 |
| v2EditorAction | src/modules/combat/050-bridge.js:140 | 56 | 37 | 3 |

## 데이터 ↔ 화면 흐름
- 여러 함수가 쓰는 상태(8곳 이상 — 소유자가 흩어짐): `P().gems`(9), `P().curBanner`(8)
- 쓰기만 하고 아무도 안 읽는 키: `P().scene`
- 화면 함수가 안 읽는 G.meta 키(설정이 화면에 안 보일 수 있음): `G.meta.relProf`
- 그래프: `tools/out/flow.mmd` (쓰는 함수 → 상태 → 화면 함수)

## 화면 액션
- 발신 없는 처리기(확인 필요 — 동적으로 만들면 정상): `enemy`, `icon`, `prop`, `towerstart`, `illust`, `lbcg`, `gateyes`, `gateno`, `swgenre`, `swpjgo`, `swpjnew`, `lbhide`, `cgview`, `sq`, `discover`, `aichar-open`, `collab`, `alt`, `aichar`, `testai`, `newgame-open`, `stamopen`, `charnew`, `cheat2`, `cheat`, `setname0`, `bkshare`, `exportfile`, `reset`, `raidstart`, `sortie`, `fsq`, `farmstart`, `wpai`, `naiall`, `wgen`, `styopen`, `daily`, `phone`, `phtab`

## 파편화·다중화
- 문서 전역 클릭 리스너 35개: src/main/0025-prompt-studio.js, src/main/0040-sound.js, src/main/0060-util.js, src/main/0065-inherit.js, src/main/0080-storage-integration.js, src/main/0125-tower.js, src/main/0130-gift.js, src/main/0135-schedule.js, src/main/0185-game-rules.js, src/main/0187-balance.js, src/main/0275-expedition.js, src/main/0330-casting.js, src/main/0445-factions.js, src/main/0455-persona.js, src/main/0465-story-plan.js, src/main/0485-battle-rules.js, src/main/0487-formation-sortie.js, src/main/0488-stage-modes.js, src/main/0505-construct.js, src/main/0510-actions/130-dispatch.js, src/main/0520-backup-storage.js, src/main/0525-data-folder.js, src/main/0530-story-memory.js, src/main/0535-content-audit.js, src/main/0560-image-candidates.js, src/main/0565-asset-library.js, src/modules/combat/040-effects.js, src/modules/combat/050-bridge.js, src/modules/combat/070-equipment.js, src/modules/combat/080-training.js, src/modules/combat/090-practice.js
- 3번 이상 되풀이되는 긴 문자열 0개
- 빈 catch 193개 (오류를 삼킴): src/main/0020-ai-connect.js:9, src/main/0020-ai-connect.js:10, src/main/0020-ai-connect.js:16, src/main/0020-ai-connect.js:41, src/main/0020-ai-connect.js:54, src/main/0020-ai-connect.js:58, src/main/0020-ai-connect.js:62, src/main/0020-ai-connect.js:69 …
- esc() 없이 innerHTML에 넣는 이름·글 0곳: 
- 안 쓰는 함수 0개: 
- 안 쓰는 최상위 변수·상수 0개: 
