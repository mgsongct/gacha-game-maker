# 자기점검 보고서

생성: `node tools/check.mjs` · 2026-11-03T06:26 · 9.9초

| 항목 | 값 |
|---|---|
| 분석 단위 | main(한 스크립트 88파일 9840줄) + 모듈·부트 15개 + CSS 20개 + 부속 파일 17개(파이썬 2) |
| 함수(최상위) | 1764 · 호출 간선 7037 |
| 오류 | 0 |
| 경고 | 0 |
| 화면 액션 | 분배 표 535 · 발신 665 · 처리 665 · 처리기 없음 0 · 발신 없는 처리기 0 · 중복 처리 0 |
| 상태 변경 함수 | 66 (저장 표시 없음 0) |
| DOM id | 만드는 id 567 · 찾는 id 465 · 없는 id 0 |
| HTML 주입 | esc() 없는 글 0 (HTML 안전하지 않은 함수: sub) |
| CSS | 클래스 1001 · 오류 0 · 안 쓰는 클래스 36 |

## 오류 (0)

## 경고 (0)

## 병목·경합 후보 (팬인 × 복잡도)
| 함수 | 위치 | 부르는 함수 | 호출 수 | 부르는 함수 수(팬아웃) | 복잡도 | 상태 변경 |
|---|---|---|---|---|---|---|
| T | src/main/0010-rules.js:50 | 185 | 555 | 0 | 7 |  |
| esc | src/main/0060-util.js:10 | 277 | 1246 | 0 | 2 |  |
| mark | src/main/0070-save.js:121 | 184 | 359 | 3 | 6 |  |
| P | src/main/0060-util.js:13 | 192 | 346 | 0 | 1 |  |
| openModal | src/main/0230-modal.js:4 | 128 | 150 | 1 | 3 |  |
| render | src/main/0180-ui-scroll.js:33 | 58 | 158 | 17 | 20 |  |
| $ | src/main/0060-util.js:4 | 159 | 845 | 0 | 1 |  |
| toast | src/main/0060-util.js:22 | 159 | 576 | 0 | 1 |  |
| imgSrc | src/main/0080-storage-integration.js:57 | 66 | 150 | 2 | 10 |  |
| head | src/main/0230-modal.js:10 | 122 | 131 | 0 | 1 |  |
| naiCfg | src/main/0020-ai-connect.js:387 | 39 | 42 | 2 | 24 |  |
| art | src/main/0080-storage-integration.js:80 | 37 | 46 | 5 | 24 |  |
| charById | src/main/0060-util.js:14 | 107 | 201 | 0 | 1 |  |
| aiJSON | src/main/0450-relations-memory.js:95 | 43 | 62 | 2 | 13 |  |
| http | src/main/0020-ai-connect.js:72 | 24 | 29 | 7 | 81 |  |

## 꼬인 흐름: 동기 호출로 서로 부르는 순환 (3) — 멈춤 조건(깊이 제한 등)이 있는지 확인
- 8개: combat/030-core.js#heal ↔ combat/030-core.js#proc ↔ combat/030-core.js#addStatus ↔ combat/030-core.js#reactHit ↔ combat/030-core.js#damage ↔ combat/030-core.js#hit@80347 ↔ combat/030-core.js#apply ↔ combat/030-core.js#cast — 멈춤 조건 있음(proc: if(u.hp<=0||sim.depth>=3))
- 3개: imgSrcRaw ↔ skinPreviewSrc ↔ imgSrc — 멈춤 조건 있음(imgSrcRaw: if(o&&!o.img&&o.alias&&typeof G!=='undefined'&&G&&G.)
- 2개: combat/050-bridge.js#v2DrainBattleEvents ↔ combat/050-bridge.js#v2BattleEvents — 멈춤 조건 있음(v2DrainBattleEvents: if(B!==battle||battle.presentationBusy))
- 비동기(타이머·이벤트)를 거치는 순환 0개: 없음

## 가장 깊은 호출 사슬 (콜스택)
- 깊이 21: handleNavigationAndToolsAction → liveTick → seasonStart → aiPickupStory → aiEventGen → artAfterAI → artRun → main#go@801956 → runPrep → naiDrawItem → naiDrawItem0 → ensureLibPrompts → mark → naiBlocksGame → main#remember@71907 → naiBlocksRemember → naiBlocksUpgrade → naiBlocksKnownStyle → naiStyle → joinTags → tagList
- 깊이 19: handleStoryAndAuthoringAction → puStoryBg → aiEventGen → artAfterAI → artRun → main#go@801956 → runPrep → naiDrawItem → naiDrawItem0 → ensureLibPrompts → mark → naiBlocksGame → main#remember@71907 → naiBlocksRemember → naiBlocksUpgrade → naiBlocksKnownStyle → naiStyle → joinTags → tagList
- 깊이 19: handleEconomyAction → puStoryBg → aiEventGen → artAfterAI → artRun → main#go@801956 → runPrep → naiDrawItem → naiDrawItem0 → ensureLibPrompts → mark → naiBlocksGame → main#remember@71907 → naiBlocksRemember → naiBlocksUpgrade → naiBlocksKnownStyle → naiStyle → joinTags → tagList
- 깊이 18: handleCombatAndFormationAction → dgMove → main#go@330114 → dgEnter → rgBattle → startStage → stamUse → openStam → stam → mark → naiBlocksGame → main#remember@71907 → naiBlocksRemember → naiBlocksUpgrade → naiBlocksKnownStyle → naiStyle → joinTags → tagList
- 깊이 18: handleImagesAndAssetsAction → openNaiGen → registerNaiJob → artRun → main#go@801956 → runPrep → naiDrawItem → naiDrawItem0 → ensureLibPrompts → mark → naiBlocksGame → main#remember@71907 → naiBlocksRemember → naiBlocksUpgrade → naiBlocksKnownStyle → naiStyle → joinTags → tagList

## 복잡한 함수 (분기 ≥40 · 120줄 이상 · 중첩 ≥7) — 40
| 함수 | 위치 | 복잡도 | 줄 | 중첩 |
|---|---|---|---|---|
| buildNewGameDraft | src/main/0250-story-factory.js:193 | 154 | 90 | 2 |
| cbPlay | src/main/0120-abyss.js:210 | 106 | 44 | 3 |
| v2CompileSlot | src/modules/combat/060-generation.js:28 | 100 | 64 | 4 |
| openChar | src/main/0230-modal.js:85 | 94 | 93 | 2 |
| cutoutWhite | src/main/0030-character-regen.js:401 | 91 | 65 | 5 |
| apply | src/modules/combat/030-core.js:762 | 90 | 45 | 4 |
| validate | src/modules/combat/030-core.js:63 | 84 | 36 | 5 |
| http | src/main/0020-ai-connect.js:72 | 81 | 43 | 5 |
| fix | src/main/0070-save.js:41 | 78 | 75 | 4 |
| damage | src/modules/combat/030-core.js:685 | 74 | 40 | 4 |
| effectText | src/modules/combat/010-catalog.js:5 | 70 | 2 | 2 |
| fcSend | src/main/0160-free-chat.js:36 | 69 | 39 | 3 |
| naiGenerate0 | src/main/0030-character-regen.js:533 | 68 | 62 | 4 |
| studioHTML | src/main/0180-ui-scroll.js:553 | 68 | 81 | 1 |
| liveTick | src/main/0290-season-rotation.js:69 | 64 | 43 | 4 |
| stageBackup | src/main/0520-backup-storage.js:58 | 63 | 16 | 7 |
| lobbyHTML | src/main/0180-ui-scroll.js:71 | 62 | 43 | 0 |
| cast | src/modules/combat/030-core.js:808 | 58 | 22 | 3 |
| aiPolicy | src/modules/combat/030-core.js:334 | 56 | 33 | 4 |
| v2EditorAction | src/modules/combat/050-bridge.js:140 | 56 | 37 | 3 |
| aiEventGen0 | src/main/0250-story-factory.js:132 | 55 | 28 | 2 |
| buildManualGameDraft | src/main/0250-story-factory.js:284 | 55 | 40 | 3 |
| contractHTML0 | src/main/0180-ui-scroll.js:151 | 54 | 38 | 1 |
| openNaiPrep | src/main/0180-ui-scroll.js:415 | 52 | 35 | 2 |
| bEnd | src/main/0490-boss-patterns.js:21 | 51 | 29 | 4 |
| openLibItem | src/main/0240-growth-curve.js:130 | 45 | 35 | 1 |
| motif | src/modules/combat/040-effects.js:234 | 44 | 29 | 3 |
| v2IconClick | src/modules/combat/050-bridge.js:314 | 44 | 25 | 3 |
| regenApply | src/main/0030-character-regen.js:86 | 43 | 15 | 3 |
| renderSetup | src/main/0210-setup.js:24 | 43 | 47 | 1 |

## 분배기 안의 복잡한 case (분기 ≥20 · 중첩 ≥5) — 6
- handleImagesAndAssetsAction · `facego` (src/main/0510-actions/100-images-and-assets.js:74) 복잡도 25 · 15줄 · 중첩 3
- handleNavigationAndToolsAction · `ailib` (src/main/0510-actions/020-navigation-and-tools.js:92) 복잡도 23 · 8줄 · 중첩 3
- handleNavigationAndToolsAction · `poke` (src/main/0510-actions/020-navigation-and-tools.js:26) 복잡도 21 · 9줄 · 중첩 1
- handleSettingsAndAudioAction · `vsai` (src/main/0510-actions/050-settings-and-audio.js:57) 복잡도 21 · 13줄 · 중첩 3
- handleImagesAndAssetsAction · `skinuse` (src/main/0510-actions/100-images-and-assets.js:57) 복잡도 20 · 5줄 · 중첩 3
- handleCharactersAction · `upgo` (src/main/0510-actions/090-characters.js:25) 복잡도 10 · 1줄 · 중첩 5

## 데이터 ↔ 화면 흐름
- 여러 함수가 쓰는 상태(8곳 이상 — 소유자가 흩어짐): `P().curBanner`(8)
- 쓰기만 하고 아무도 안 읽는 키: 없음
- 화면 함수가 안 읽는 G.meta 키(설정이 화면에 안 보일 수 있음): `G.meta.relProf`
- 그래프: `tools/out/flow.mmd` (쓰는 함수 → 상태 → 화면 함수)

## 화면 액션
- 발신 없는 처리기(확인 필요 — 동적으로 만들면 정상): 없음

## 파편화·다중화
- 문서 전역 클릭 리스너 35개: src/main/0015-prompt-studio/, src/main/0040-sound.js, src/main/0060-util.js, src/main/0065-inherit.js, src/main/0080-storage-integration.js, src/main/0125-tower.js, src/main/0130-gift.js, src/main/0135-schedule.js, src/main/0185-game-rules.js, src/main/0187-balance.js, src/main/0275-expedition.js, src/main/0330-casting.js, src/main/0445-factions.js, src/main/0455-persona.js, src/main/0465-story-plan.js, src/main/0485-battle-rules.js, src/main/0487-formation-sortie.js, src/main/0488-stage-modes.js, src/main/0505-construct.js, src/main/0510-actions/130-dispatch.js, src/main/0520-backup-storage.js, src/main/0525-data-folder.js, src/main/0530-story-memory.js, src/main/0535-content-audit.js, src/main/0560-image-candidates.js, src/main/0565-asset-library.js, src/modules/combat/040-effects.js, src/modules/combat/050-bridge.js, src/modules/combat/070-equipment.js, src/modules/combat/080-training.js, src/modules/combat/090-practice.js
- 3번 이상 되풀이되는 긴 문자열 0개
- 빈 catch 150개: 파싱 대체 31 · 동기 대체 64 · 저장소 대체 53 · 의도 표시 2 — 비동기 작업은 quietErr()로 기록하세요(경고)
- esc() 없이 HTML 템플릿에 넣는 이름·글·용어 0곳: 
- 안 쓰는 함수 0개: 
- 안 쓰는 최상위 변수·상수 0개: 

## 저장·리스너·중계
- 저장 키(writeKey): meta·world·opening·prog · 접두사 c:·ch:·l:·t: — 모르는 키 0
- 떼지 않는 전역 리스너 0개
- 중계 서버 허용 주소: proxy/worker.js 17개 · proxy/vercel/api/proxy.js 17개 — 차이 0 · 앱 API 주소 11개 중 허용 안 됨 0

## CSS (src/style)
- 파싱 오류·괄호 짝 0개
- 코드·HTML 어디에도 없는 클래스 선택자 36개(지운 화면의 흔적 — 동적 접두사 `ls-${…}`는 씀으로 봄): `.lobby-stage` (src/style/0010-base.css:61), `.shade` (src/style/0010-base.css:62), `.vname` (src/style/0010-base.css:63), `.phbtn` (src/style/0010-base.css:70), `.nbadge` (src/style/0010-base.css:72), `.lobby-name` (src/style/0010-base.css:77), `.float` (src/style/0010-base.css:79), `.trio` (src/style/0010-base.css:99), `.bigart` (src/style/0010-base.css:133), `.picking` (src/style/0010-base.css:413), `.lb-menu` (src/style/0020-v3-theme-tactical-default-skins.css:54), `.lvrow` (src/style/0020-v3-theme-tactical-default-skins.css:78), `.cs-acts` (src/style/0030-lobby-nav-char-screen-pickup-shops.css:156), `.cs-stars` (src/style/0030-lobby-nav-char-screen-pickup-shops.css:161), `.styrow` (src/style/0030-lobby-nav-char-screen-pickup-shops.css:193), `.styhead` (src/style/0030-lobby-nav-char-screen-pickup-shops.css:194), `.lb-tl` (src/style/0080-desktop.css:28), `.lb-ban` (src/style/0080-desktop.css:28), `.ph-tabs` (src/style/0090-free-chat.css:2), `.fc-tag` (src/style/0090-free-chat.css:5), `.ch-boss` (src/style/0110-challenge-raid.css:7), `.sw-genre` (src/style/0120-2026-10-07-2.css:24), `.sw-pj` (src/style/0120-2026-10-07-2.css:34), `.sw-list` (src/style/0120-2026-10-07-2.css:54), `.disc-bg` (src/style/0120-2026-10-07-2.css:77), `.disc-t` (src/style/0120-2026-10-07-2.css:79), `.disc-rate` (src/style/0120-2026-10-07-2.css:83), `.disc-go` (src/style/0120-2026-10-07-2.css:84), `.collab-b` (src/style/0130-lobby-cleanup.css:88), `.look-who` (src/style/0150-cards.css:51), `.ca` (src/style/0160-card-battle.css:14), `.ca-n` (src/style/0160-card-battle.css:16), `.it-aoe` (src/style/0160-card-battle.css:19), `.ca-art` (src/style/0160-card-battle.css:21), `.cb-al` (src/style/0160-card-battle.css:27), `.dgb` (src/style/0160-card-battle.css:50)
