# 프롬프트 조합 검증

생성: `node tools/play/combos.mjs --ref 59cd3f9` · 게임 idol-audition, sky-knights · 상황 15 + 새 게임 입력 4

## 요약

- 요청 지점(정적) 85곳 중 실행으로 닿은 곳 42 · 안 닿은 곳 43
- 보낸 프롬프트 3364개 · 흐름 오류 450
- 발견: 깨짐 0 · 과잉 2 · 과소 0 · 정보 117
- 기준(59cd3f9)과 다른 프롬프트 0

## 지점별 조합

갈래: 정적으로 찾은 조건 수(가능한 조합 2^갈래) · 두 쪽 다 봄 / 한 쪽만 / 못 봄 = 실제 프롬프트에서 그 갈래의 글이 나왔는지

| 지점 | 프롬프트 수 | 상황 수 | 서로 다른 조각 조합 | 글자(최소~최대) | 갈래 | 두 쪽 다 봄 | 한 쪽만 | 못 봄 |
|---|---|---|---|---|---|---|---|---|
| (지점 모름) aiAltChar | 180 | 30 | 1 | 3637~3687 |  | 0 | 0 | 0 |
| (지점 모름) aiNewPickupChar | 180 | 30 | 1 | 3639~3689 |  | 0 | 0 | 0 |
| (지점 모름) 그림: 상반신 | 30 | 30 | 1 | 1773~1791 |  | 0 | 0 | 0 |
| (지점 모름) 그림: 소품 | 30 | 30 | 1 | 951~991 |  | 0 | 0 | 0 |
| (지점 모름) 그림: 적 | 30 | 30 | 1 | 921~921 |  | 0 | 0 | 0 |
| (지점 모름) 그림: 캐릭터 | 30 | 30 | 1 | 1975~1993 |  | 0 | 0 | 0 |
| 0015-prompt-studio/010-studio.js pstPolish | 30 | 30 | 1 | 555~555 | 1 | 0 | 0 | 1 |
| 0020-ai-connect.js naiBlocksSeparate | 90 | 30 | 1 | 804~813 | 0 | 0 | 0 | 0 |
| 0030-image/010-engine.js designAI | 30 | 30 | 1 | 1143~2242 | 0 | 0 | 0 | 0 |
| 0030-image/010-engine.js weaponPromptAI | 32 | 32 | 1 | 1388~2163 | 1 | 0 | 1 | 0 |
| 0040-sound.js jaBatch | 30 | 30 | 1 | 216~216 | 0 | 0 | 0 | 0 |
| 0040-sound.js toJa | 30 | 30 | 1 | 201~201 | 0 | 0 | 0 | 0 |
| 0135-schedule.js spotsAI | 60 | 30 | 10 | 5135~10591 | 25 | 1 | 11 | 13 |
| 0135-schedule.js spotTalkAI | 30 | 30 | 10 | 6335~11744 | 25 | 1 | 11 | 13 |
| 0160-free-chat.js heroTags | 38 | 38 | 1 | 530~578 | 0 | 0 | 0 | 0 |
| 0185-game-rules.js rulesAIData | 30 | 30 | 10 | 5055~10472 | 25 | 1 | 11 | 13 |
| 0185-game-rules.js rulesPosAI | 30 | 30 | 10 | 5268~10687 | 25 | 1 | 11 | 13 |
| 0250-story-factory.js aiChapterGen0 | 60 | 30 | 14 | 28149~37297 | 54 | 3 | 27 | 24 |
| 0250-story-factory.js aiEventGen0 | 30 | 30 | 12 | 23641~29835 | 49 | 3 | 19 | 27 |
| 0250-story-factory.js ensureLibPrompts | 30 | 30 | 4 | 3705~3706 | 19 | 0 | 7 | 12 |
| 0250-story-factory.js writeStages | 336 | 28 | 42 | 6559~16486 | 37 | 2 | 17 | 18 |
| 0260-new-game/010-draft.js drHarmony | 30 | 30 | 1 | 1113~1113 | 9 | 0 | 1 | 8 |
| 0260-new-game/010-draft.js drPolishHero | 30 | 30 | 1 | 397~397 | 6 | 0 | 0 | 6 |
| 0260-new-game/020-build.js buildNewGameDraft | 46 | 8 | 27 | 1147~18984 | 20 | 0 | 13 | 7 |
| 0270-skin-proposal.js skinLinesAI | 30 | 30 | 10 | 5136~10530 | 25 | 1 | 11 | 13 |
| 0290-season-rotation.js aiAltChar | 30 | 30 | 10 | 21023~26187 | 29 | 1 | 15 | 13 |
| 0290-season-rotation.js aiNewPickupChar | 30 | 30 | 10 | 20153~25342 | 31 | 1 | 15 | 15 |
| 0300-codex.js cxDeepen | 30 | 30 | 10 | 5618~11155 | 27 | 1 | 12 | 14 |
| 0300-codex.js cxDiscover | 30 | 30 | 10 | 5560~11204 | 27 | 1 | 12 | 14 |
| 0330-casting.js autoNpcs | 15 | 15 | 3 | 1255~1306 | 3 | 1 | 1 | 1 |
| 0445-factions.js factionAI | 30 | 30 | 10 | 5792~12332 | 25 | 1 | 11 | 13 |
| 0450-relations-memory.js relSeedAI | 30 | 30 | 10 | 7523~17511 | 28 | 1 | 12 | 15 |
| 0455-persona.js memorialGen | 30 | 30 | 10 | 6285~11727 | 25 | 1 | 11 | 13 |
| 0455-persona.js personaAI | 30 | 30 | 10 | 6759~13087 | 28 | 1 | 11 | 16 |
| 0455-persona.js personaAIReview | 30 | 30 | 10 | 5964~11344 | 25 | 1 | 11 | 13 |
| 0455-persona.js talkAffGen | 30 | 30 | 10 | 5728~11167 | 25 | 1 | 11 | 13 |
| 0462-direction.js directScript | 30 | 30 | 3 | 1796~2196 | 6 | 1 | 1 | 4 |
| 0465-story-plan.js planAI | 90 | 30 | 10 | 5446~10865 | 25 | 1 | 11 | 13 |
| 0510-actions/020-navigation-and-tools.js handleNavigationAndToolsAction | 60 | 30 | 11 | 636~11457 | 25 | 1 | 11 | 13 |
| 0510-actions/040-story-and-authoring.js handleStoryAndAuthoringAction | 90 | 30 | 23 | 1034~12023 | 27 | 1 | 11 | 15 |
| 0510-actions/090-characters.js handleCharactersAction#4 | 120 | 30 | 15 | 1106~10597 | 0 | 0 | 0 | 0 |
| 0510-actions/100-images-and-assets.js handleImagesAndAssetsAction | 15 | 15 | 1 | 1199~1199 | 0 | 0 | 0 | 0 |
| 0510-actions/110-economy.js handleEconomyAction | 30 | 30 | 3 | 687~1018 | 7 | 1 | 1 | 5 |
| 0510-actions/120-messenger.js handleMessengerAction | 30 | 30 | 10 | 5948~11326 | 28 | 1 | 13 | 14 |
| 0530-story-memory.js smExtract | 750 | 30 | 2 | 347~1828 | 0 | 0 | 0 | 0 |
| 0530-story-memory.js storyWrapUp | 114 | 30 | 3 | 1388~1698 | 6 | 1 | 1 | 4 |
| 0535-content-audit.js auditAIStage | 30 | 30 | 10 | 5899~11309 | 25 | 1 | 11 | 13 |
| 그림 0030-image/010-engine.js naiDraw | 188 | 38 | 1 | 833~1925 | 1 | 0 | 0 | 1 |

## 발견 (깨짐·과잉·과소)

| 종류 | 항목 | 지점 | 내용 | 상황 |
|---|---|---|---|---|
| 과잉 | 읽지 않는 키 요구 | (지점 모름) aiAltChar | 견본의 "designPlan"를 이 흐름에서 코드가 읽지 않음(답을 받고도 버림) | idol-audition · 기본 / idol-audition · 마지막 스테이지: 전투 / idol-audition · 마지막 스테이지: 콘테스트 외 27 |
| 과잉 | 읽지 않는 키 요구 | (지점 모름) aiNewPickupChar | 견본의 "designPlan"를 이 흐름에서 코드가 읽지 않음(답을 받고도 버림) | idol-audition · 기본 / idol-audition · 마지막 스테이지: 전투 / idol-audition · 마지막 스테이지: 콘테스트 외 27 |

## 정보

| 항목 | 지점 | 내용 |
|---|---|---|
| 형식 견본 뒤 글 | 0020-ai-connect.js naiBlocksSeparate | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0030-image/010-engine.js designAI | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0030-image/010-engine.js weaponPromptAI | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0040-sound.js jaBatch | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0040-sound.js toJa | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0135-schedule.js spotsAI | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0135-schedule.js spotTalkAI | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0160-free-chat.js heroTags | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0185-game-rules.js rulesAIData | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0185-game-rules.js rulesPosAI | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0250-story-factory.js ensureLibPrompts | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0465-story-plan.js planAI | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0250-story-factory.js aiChapterGen0 | 견본 뒤에 「스킬 작성 규칙: 스킬 JSON은 skills:{version:2,passive,activ」 |
| 요구하지 않은 키 읽을 수 있음 | 0250-story-factory.js aiChapterGen0 | 코드가 응답의 "relations"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0250-story-factory.js aiChapterGen0 | 코드가 응답의 "summary"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0250-story-factory.js aiChapterGen0 | 코드가 응답의 "threads"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 형식 견본 뒤 글 | 0250-story-factory.js writeStages | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 1 값 59] 대본 228 대본 229 다른 설명이나 코드 블록 없이 」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 2 값 95] 대본 230 대본 231 다른 설명이나 코드 블록 없이 」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 3 값 131] 대본 232 대본 233 다른 설명이나 코드 블록 없이」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 4 값 167] 대본 234 대본 235 다른 설명이나 코드 블록 없이」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「기록 236 기록 237 기록 238 기록 239 다른 설명이나 코드 블록 없이 JSON만」 |
| 형식 견본 뒤 글 | 0530-story-memory.js storyWrapUp | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 1 값 270] 대본 439 대본 440 다른 설명이나 코드 블록 없이」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 2 값 306] 대본 441 대본 442 다른 설명이나 코드 블록 없이」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 3 값 342] 대본 443 대본 444 다른 설명이나 코드 블록 없이」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 4 값 378] 대본 445 대본 446 다른 설명이나 코드 블록 없이」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「기록 447 기록 448 기록 449 기록 450 다른 설명이나 코드 블록 없이 JSON만」 |
| 형식 견본 뒤 글 | 0250-story-factory.js aiEventGen0 | 견본 뒤에 「스킬 작성 규칙: 스킬 JSON은 skills:{version:2,passive,activ」 |
| 요구하지 않은 키 읽을 수 있음 | 0250-story-factory.js aiEventGen0 | 코드가 응답의 "relations"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0250-story-factory.js aiEventGen0 | 코드가 응답의 "summary"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0250-story-factory.js aiEventGen0 | 코드가 응답의 "threads"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 1 값 479] 대본 632 대본 633 다른 설명이나 코드 블록 없이」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 2 값 515] 대본 634 대본 635 다른 설명이나 코드 블록 없이」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 3 값 551] 대본 636 대본 637 다른 설명이나 코드 블록 없이」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 4 값 587] 대본 638 대본 639 다른 설명이나 코드 블록 없이」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「기록 640 기록 641 기록 642 기록 643 다른 설명이나 코드 블록 없이 JSON만」 |
| 형식 견본 뒤 글 | 0260-new-game/010-draft.js drPolishHero | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0260-new-game/010-draft.js drHarmony | 견본 뒤에 「— chars는 위 인물 순서 그대로, 같은 수로. 다른 설명이나 코드 블록 없이 JSON」 |
| 형식 견본 뒤 글 | 0270-skin-proposal.js skinLinesAI | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0290-season-rotation.js aiNewPickupChar | 견본 뒤에 「희귀도가 높을수록 능력치 합이 높다. 지원형은 heal/shield/buff, 방어형은 체」 |
| 형식 견본 뒤 글 | (지점 모름) aiNewPickupChar | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0290-season-rotation.js aiAltChar | 견본 뒤에 「희귀도가 높을수록 능력치 합이 높다. 지원형은 heal/shield/buff, 방어형은 체」 |
| 형식 견본 뒤 글 | (지점 모름) aiAltChar | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0300-codex.js cxDiscover | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0300-codex.js cxDeepen | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0330-casting.js autoNpcs | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0445-factions.js factionAI | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0450-relations-memory.js relSeedAI | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0455-persona.js personaAI | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 요구하지 않은 키 읽을 수 있음 | 0455-persona.js personaAI | 코드가 응답의 "affLines"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0455-persona.js personaAI | 코드가 응답의 "lines"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 형식 견본 뒤 글 | 0455-persona.js personaAIReview | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0455-persona.js talkAffGen | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0455-persona.js memorialGen | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0462-direction.js directScript | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 1 첫 녹화, 레벨 평가] [오로라TV 스튜디오] [음악: 긴장] 상암」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 2 플랫폼의 유령] [실장님 사무실] [음악: 일상] 밤 열한 시. 사」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 3 홍대 자리 싸움] [홍대 버스킹 거리] [음악: 일상] 토요일 저녁」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 4 1차 미션: 정면 승부] [대기실] [음악: 긴장] 1차 미션 「정」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「기록 1109 기록 1110 기록 1111 기록 1112 다른 설명이나 코드 블록 없이 J」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「기록 1116 기록 1117 기록 1118 기록 1119 다른 설명이나 코드 블록 없이 J」 |
| 형식 견본 뒤 글 | 0535-content-audit.js auditAIStage | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0015-prompt-studio/010-studio.js pstPolish | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0510-actions/020-navigation-and-tools.js handleNavigationAndToolsAction | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 요구하지 않은 키 읽을 수 있음 | 0510-actions/020-navigation-and-tools.js handleNavigationAndToolsAction | 코드가 응답의 "lines"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0510-actions/020-navigation-and-tools.js handleNavigationAndToolsAction | 코드가 응답의 "prologue"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 형식 견본 뒤 글 | 0510-actions/040-story-and-authoring.js handleStoryAndAuthoringAction | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0510-actions/040-story-and-authoring.js handleStoryAndAuthoringAction | 견본 뒤에 「세력은 3~5개. 다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따」 |
| 요구하지 않은 키 읽을 수 있음 | 0510-actions/040-story-and-authoring.js handleStoryAndAuthoringAction | 코드가 응답의 "script"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0510-actions/040-story-and-authoring.js handleStoryAndAuthoringAction | 코드가 응답의 "title"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 형식 견본 뒤 글 | 0510-actions/090-characters.js handleCharactersAction#4 | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 요구하지 않은 키 읽을 수 있음 | 0510-actions/090-characters.js handleCharactersAction#4 | 코드가 응답의 "looks"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 형식 견본 뒤 글 | 0510-actions/110-economy.js handleEconomyAction | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0510-actions/120-messenger.js handleMessengerAction | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 1 값 59] 값 60 값 61 다른 설명이나 코드 블록 없이 JSON」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 2 값 96] 값 97 값 98 다른 설명이나 코드 블록 없이 JSON」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 3 값 133] 값 134 값 135 다른 설명이나 코드 블록 없이 J」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 4 값 170] 값 171 값 172 다른 설명이나 코드 블록 없이 J」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「기록 241 기록 242 기록 243 기록 244 다른 설명이나 코드 블록 없이 JSON만」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 1 값 267] 값 268 값 269 다른 설명이나 코드 블록 없이 J」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 2 값 304] 값 305 값 306 다른 설명이나 코드 블록 없이 J」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 3 값 341] 값 342 값 343 다른 설명이나 코드 블록 없이 J」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 4 값 378] 값 379 값 380 다른 설명이나 코드 블록 없이 J」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「기록 449 기록 450 기록 451 기록 452 다른 설명이나 코드 블록 없이 JSON만」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 1 값 473] 값 474 값 475 다른 설명이나 코드 블록 없이 J」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 2 값 510] 값 511 값 512 다른 설명이나 코드 블록 없이 J」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 3 값 547] 값 548 값 549 다른 설명이나 코드 블록 없이 J」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 4 값 584] 값 585 값 586 다른 설명이나 코드 블록 없이 J」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「기록 639 기록 640 기록 641 기록 642 다른 설명이나 코드 블록 없이 JSON만」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「기록 1100 기록 1101 기록 1102 기록 1103 다른 설명이나 코드 블록 없이 J」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「기록 1107 기록 1108 기록 1109 기록 1110 다른 설명이나 코드 블록 없이 J」 |
| 형식 견본 뒤 글 | 0260-new-game/020-build.js buildNewGameDraft | 견본 뒤에 「파견은 6개 — 이름·설명만 쓴다(실제 의뢰의 시간·인원·보상은 게임의 파견 게시판이 매일」 |
| 형식 견본 뒤 글 | 0260-new-game/020-build.js buildNewGameDraft | 견본 뒤에 「naiPrompt는 NovelAI용 영어 태그 문자열. "1girl, solo"(남자는 "」 |
| 요구하지 않은 키 읽을 수 있음 | 0260-new-game/020-build.js buildNewGameDraft | 코드가 응답의 "accent"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0260-new-game/020-build.js buildNewGameDraft | 코드가 응답의 "elems"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0260-new-game/020-build.js buildNewGameDraft | 코드가 응답의 "finale"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0260-new-game/020-build.js buildNewGameDraft | 코드가 응답의 "hero"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0260-new-game/020-build.js buildNewGameDraft | 코드가 응답의 "positions"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0260-new-game/020-build.js buildNewGameDraft | 코드가 응답의 "reactions"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0260-new-game/020-build.js buildNewGameDraft | 코드가 응답의 "roleDesc"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0260-new-game/020-build.js buildNewGameDraft | 코드가 응답의 "roles"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0260-new-game/020-build.js buildNewGameDraft | 코드가 응답의 "sub"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0260-new-game/020-build.js buildNewGameDraft | 코드가 응답의 "terms"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0260-new-game/020-build.js buildNewGameDraft | 코드가 응답의 "theme"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0260-new-game/020-build.js buildNewGameDraft | 코드가 응답의 "title"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0260-new-game/020-build.js buildNewGameDraft | 코드가 응답의 "world"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 형식 견본 뒤 글 | 0260-new-game/020-build.js buildNewGameDraft | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 1 요새의 둥지] [음악: 일상] [리벳항 부두] 폭풍이 지나간 아침.」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 2 징발 명령서] [음악: 일상] [요새 집무실] 먼지를 털어 낸 집무」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 3 등대섬의 관측사] [음악: 설렘] [비행선 갑판] [효과음: 알림]」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 4 잿빛 아가리] [음악: 긴장] [폭풍권 하늘] [효과: 강한흔들림]」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「기록 1105 기록 1106 기록 1107 기록 1108 다른 설명이나 코드 블록 없이 J」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「기록 1112 기록 1113 기록 1114 기록 1115 다른 설명이나 코드 블록 없이 J」 |
| 형식 견본 뒤 글 | 0510-actions/100-images-and-assets.js handleImagesAndAssetsAction | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「기록 1096 기록 1097 기록 1098 기록 1099 다른 설명이나 코드 블록 없이 J」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「기록 1103 기록 1104 기록 1105 기록 1106 다른 설명이나 코드 블록 없이 J」 |

## 실행으로 안 닿은 요청 지점 (43)

| 지점 | 위치 | 갈래 |
|---|---|---|
| 0030-image/010-engine.js regenRun | src/main/0030-image/010-engine.js:48 | 6 |
| 0030-image/010-engine.js requestUltimateScene | src/main/0030-image/010-engine.js:116 | 7 |
| 0030-image/010-engine.js illustrationScenePreparation | src/main/0030-image/010-engine.js:141 | 7 |
| 0160-free-chat.js fcSend | src/main/0160-free-chat.js:46 | 41 |
| 0160-free-chat.js fcSummarize | src/main/0160-free-chat.js:67 | 0 |
| 0185-game-rules.js posAI | src/main/0185-game-rules.js:129 | 25 |
| 0200-skin-shop.js skinAuto | src/main/0200-skin-shop.js:16 | 7 |
| 0260-new-game/010-draft.js drPolish | src/main/0260-new-game/010-draft.js:141 | 9 |
| 0260-new-game/010-draft.js drFillChar | src/main/0260-new-game/010-draft.js:160 | 6 |
| 0260-new-game/020-build.js buildNewGameDraft#2 | src/main/0260-new-game/020-build.js:94 | 22 |
| 0260-new-game/020-build.js buildNewGameDraft#3 | src/main/0260-new-game/020-build.js:101 | 8 |
| 0260-new-game/020-build.js buildNewGameDraft#4 | src/main/0260-new-game/020-build.js:107 | 0 |
| 0260-new-game/020-build.js buildNewGameDraft#5 | src/main/0260-new-game/020-build.js:116 | 29 |
| 0260-new-game/020-build.js buildNewGameDraft#6 | src/main/0260-new-game/020-build.js:119 | 32 |
| 0280-live-ops.js dailyTalks | src/main/0280-live-ops.js:33 | 33 |
| 0510-actions/020-navigation-and-tools.js handleNavigationAndToolsAction#2 | src/main/0510-actions/020-navigation-and-tools.js:94 | 0 |
| 0510-actions/020-navigation-and-tools.js handleNavigationAndToolsAction#3 | src/main/0510-actions/020-navigation-and-tools.js:96 | 0 |
| 0510-actions/020-navigation-and-tools.js handleNavigationAndToolsAction#4 | src/main/0510-actions/020-navigation-and-tools.js:97 | 0 |
| 0510-actions/020-navigation-and-tools.js handleNavigationAndToolsAction#5 | src/main/0510-actions/020-navigation-and-tools.js:98 | 1 |
| 0510-actions/020-navigation-and-tools.js handleNavigationAndToolsAction#6 | src/main/0510-actions/020-navigation-and-tools.js:133 | 1 |
| 0510-actions/040-story-and-authoring.js handleStoryAndAuthoringAction#2 | src/main/0510-actions/040-story-and-authoring.js:73 | 25 |
| 0510-actions/040-story-and-authoring.js handleStoryAndAuthoringAction#3 | src/main/0510-actions/040-story-and-authoring.js:89 | 34 |
| 0510-actions/040-story-and-authoring.js handleStoryAndAuthoringAction#4 | src/main/0510-actions/040-story-and-authoring.js:99 | 6 |
| 0510-actions/050-settings-and-audio.js handleSettingsAndAudioAction | src/main/0510-actions/050-settings-and-audio.js:59 | 0 |
| 0510-actions/050-settings-and-audio.js handleSettingsAndAudioAction#2 | src/main/0510-actions/050-settings-and-audio.js:66 | 0 |
| 0510-actions/090-characters.js handleCharactersAction | src/main/0510-actions/090-characters.js:17 | 6 |
| 0510-actions/090-characters.js handleCharactersAction#2 | src/main/0510-actions/090-characters.js:19 | 25 |
| 0510-actions/090-characters.js handleCharactersAction#3 | src/main/0510-actions/090-characters.js:22 | 6 |
| 0510-actions/090-characters.js handleCharactersAction#5 | src/main/0510-actions/090-characters.js:43 | 0 |
| 0510-actions/100-images-and-assets.js handleImagesAndAssetsAction#2 | src/main/0510-actions/100-images-and-assets.js:92 | 25 |
| 0530-story-memory.js smExtract#2 | src/main/0530-story-memory.js:14 | 0 |
| 0530-story-memory.js smExtract#3 | src/main/0530-story-memory.js:15 | 0 |
| 0530-story-memory.js smExtract#4 | src/main/0530-story-memory.js:16 | 0 |
| 0535-content-audit.js auditAIFill | src/main/0535-content-audit.js:61 | 27 |
| modules/combat/050-bridge.js v2GenerateSkills | src/modules/combat/050-bridge.js:288 | 3 |
| modules/combat/050-bridge.js v2ConceptPrompt | src/modules/combat/050-bridge.js:361 | 0 |
| modules/combat/060-generation.js v2ResolvePalette | src/modules/combat/060-generation.js:121 | 2 |
| modules/combat/060-generation.js v2GenerateSelected | src/modules/combat/060-generation.js:159 | 3 |
| modules/combat/060-generation.js v2GenerateSelected#2 | src/modules/combat/060-generation.js:186 | 4 |
| modules/combat/070-equipment.js v2GearGenerate | src/modules/combat/070-equipment.js:73 | 0 |
| 그림 0030-image/010-engine.js naiDraw#2 | src/main/0030-image/010-engine.js:176 | 1 |
| 그림 0030-image/010-engine.js openNaiGen | src/main/0030-image/010-engine.js:738 | 0 |
| 그림 0030-image/010-engine.js faceDrawOne | src/main/0030-image/010-engine.js:825 | 1 |

## 흐름 오류 (450)

| 게임 | 상황 | 흐름 | 오류 |
|---|---|---|---|
| idol-audition | 기본 | naiBlocksSeparate | AI가 태그를 누락하거나 바꿔서 적용하지 않았어요. 기존 입력은 유지했어요. |
| idol-audition | 기본 | rulesPosAI | Cannot set properties of null (setting 'positions') |
| idol-audition | 기본 | skinAuto | AI가 태그를 누락하거나 바꿔서 적용하지 않았어요. 기존 입력은 유지했어요. |
| idol-audition | 기본 | auditAIFill | Cannot read properties of undefined (reading '1') |
| idol-audition | 기본 | 그림: 캐릭터 | (500) combos: image request recorded |
| idol-audition | 기본 | 그림: 상반신 | (500) combos: image request recorded |
| idol-audition | 기본 | 그림: 배경 | (500) combos: image request recorded |
| idol-audition | 기본 | 그림: 소품 | (500) combos: image request recorded |
| idol-audition | 기본 | 그림: 적 | (500) combos: image request recorded |
| idol-audition | 기본 | 그림: CG | (500) combos: image request recorded |
| idol-audition | 기본 | handleNavigationAndToolsAction:aiskin | AI가 태그를 누락하거나 바꿔서 적용하지 않았어요. 기존 입력은 유지했어요. |
| idol-audition | 기본 | handleStoryAndAuthoringAction:stdetail | Cannot read properties of null (reading 'value') |
| idol-audition | 기본 | handleStoryAndAuthoringAction:aiworld | Cannot set properties of null (setting 'textContent') |
| idol-audition | 기본 | handleCharactersAction:ailinesmore | Cannot read properties of null (reading 'value') |
| idol-audition | 기본 | handleEconomyAction:shkai | Cannot set properties of null (setting 'value') |
| idol-audition | 마지막 스테이지: 전투 | naiBlocksSeparate | AI가 태그를 누락하거나 바꿔서 적용하지 않았어요. 기존 입력은 유지했어요. |
| idol-audition | 마지막 스테이지: 전투 | rulesPosAI | Cannot set properties of null (setting 'positions') |
| idol-audition | 마지막 스테이지: 전투 | skinAuto | AI가 태그를 누락하거나 바꿔서 적용하지 않았어요. 기존 입력은 유지했어요. |
| idol-audition | 마지막 스테이지: 전투 | auditAIFill | Cannot read properties of undefined (reading '1') |
| idol-audition | 마지막 스테이지: 전투 | 그림: 캐릭터 | (500) combos: image request recorded |
| idol-audition | 마지막 스테이지: 전투 | 그림: 상반신 | (500) combos: image request recorded |
| idol-audition | 마지막 스테이지: 전투 | 그림: 배경 | (500) combos: image request recorded |
| idol-audition | 마지막 스테이지: 전투 | 그림: 소품 | (500) combos: image request recorded |
| idol-audition | 마지막 스테이지: 전투 | 그림: 적 | (500) combos: image request recorded |
| idol-audition | 마지막 스테이지: 전투 | 그림: CG | (500) combos: image request recorded |
| idol-audition | 마지막 스테이지: 전투 | handleNavigationAndToolsAction:aiskin | AI가 태그를 누락하거나 바꿔서 적용하지 않았어요. 기존 입력은 유지했어요. |
| idol-audition | 마지막 스테이지: 전투 | handleStoryAndAuthoringAction:stdetail | Cannot read properties of null (reading 'value') |
| idol-audition | 마지막 스테이지: 전투 | handleStoryAndAuthoringAction:aiworld | Cannot set properties of null (setting 'textContent') |
| idol-audition | 마지막 스테이지: 전투 | handleCharactersAction:ailinesmore | Cannot read properties of null (reading 'value') |
| idol-audition | 마지막 스테이지: 전투 | handleEconomyAction:shkai | Cannot set properties of null (setting 'value') |
| idol-audition | 마지막 스테이지: 콘테스트 | naiBlocksSeparate | AI가 태그를 누락하거나 바꿔서 적용하지 않았어요. 기존 입력은 유지했어요. |
| idol-audition | 마지막 스테이지: 콘테스트 | rulesPosAI | Cannot set properties of null (setting 'positions') |
| idol-audition | 마지막 스테이지: 콘테스트 | skinAuto | AI가 태그를 누락하거나 바꿔서 적용하지 않았어요. 기존 입력은 유지했어요. |
| idol-audition | 마지막 스테이지: 콘테스트 | auditAIFill | Cannot read properties of undefined (reading '1') |
| idol-audition | 마지막 스테이지: 콘테스트 | 그림: 캐릭터 | (500) combos: image request recorded |
| idol-audition | 마지막 스테이지: 콘테스트 | 그림: 상반신 | (500) combos: image request recorded |
| idol-audition | 마지막 스테이지: 콘테스트 | 그림: 배경 | (500) combos: image request recorded |
| idol-audition | 마지막 스테이지: 콘테스트 | 그림: 소품 | (500) combos: image request recorded |
| idol-audition | 마지막 스테이지: 콘테스트 | 그림: 적 | (500) combos: image request recorded |
| idol-audition | 마지막 스테이지: 콘테스트 | 그림: CG | (500) combos: image request recorded |
| idol-audition | 마지막 스테이지: 콘테스트 | handleNavigationAndToolsAction:aiskin | AI가 태그를 누락하거나 바꿔서 적용하지 않았어요. 기존 입력은 유지했어요. |
| idol-audition | 마지막 스테이지: 콘테스트 | handleStoryAndAuthoringAction:stdetail | Cannot read properties of null (reading 'value') |
| idol-audition | 마지막 스테이지: 콘테스트 | handleStoryAndAuthoringAction:aiworld | Cannot set properties of null (setting 'textContent') |
| idol-audition | 마지막 스테이지: 콘테스트 | handleCharactersAction:ailinesmore | Cannot read properties of null (reading 'value') |
| idol-audition | 마지막 스테이지: 콘테스트 | handleEconomyAction:shkai | Cannot set properties of null (setting 'value') |
| idol-audition | 마지막 스테이지: 회담 | naiBlocksSeparate | AI가 태그를 누락하거나 바꿔서 적용하지 않았어요. 기존 입력은 유지했어요. |
| idol-audition | 마지막 스테이지: 회담 | rulesPosAI | Cannot set properties of null (setting 'positions') |
| idol-audition | 마지막 스테이지: 회담 | skinAuto | AI가 태그를 누락하거나 바꿔서 적용하지 않았어요. 기존 입력은 유지했어요. |
| idol-audition | 마지막 스테이지: 회담 | auditAIFill | Cannot read properties of undefined (reading '1') |
| idol-audition | 마지막 스테이지: 회담 | 그림: 캐릭터 | (500) combos: image request recorded |
| idol-audition | 마지막 스테이지: 회담 | 그림: 상반신 | (500) combos: image request recorded |
| idol-audition | 마지막 스테이지: 회담 | 그림: 배경 | (500) combos: image request recorded |
| idol-audition | 마지막 스테이지: 회담 | 그림: 소품 | (500) combos: image request recorded |
| idol-audition | 마지막 스테이지: 회담 | 그림: 적 | (500) combos: image request recorded |
| idol-audition | 마지막 스테이지: 회담 | 그림: CG | (500) combos: image request recorded |
| idol-audition | 마지막 스테이지: 회담 | handleNavigationAndToolsAction:aiskin | AI가 태그를 누락하거나 바꿔서 적용하지 않았어요. 기존 입력은 유지했어요. |
| idol-audition | 마지막 스테이지: 회담 | handleStoryAndAuthoringAction:stdetail | Cannot read properties of null (reading 'value') |
| idol-audition | 마지막 스테이지: 회담 | handleStoryAndAuthoringAction:aiworld | Cannot set properties of null (setting 'textContent') |
| idol-audition | 마지막 스테이지: 회담 | handleCharactersAction:ailinesmore | Cannot read properties of null (reading 'value') |
| idol-audition | 마지막 스테이지: 회담 | handleEconomyAction:shkai | Cannot set properties of null (setting 'value') |
| idol-audition | 이야기 빠르게 | naiBlocksSeparate | AI가 태그를 누락하거나 바꿔서 적용하지 않았어요. 기존 입력은 유지했어요. |
| idol-audition | 이야기 빠르게 | rulesPosAI | Cannot set properties of null (setting 'positions') |
| idol-audition | 이야기 빠르게 | skinAuto | AI가 태그를 누락하거나 바꿔서 적용하지 않았어요. 기존 입력은 유지했어요. |
| idol-audition | 이야기 빠르게 | auditAIFill | Cannot read properties of undefined (reading '1') |
| idol-audition | 이야기 빠르게 | 그림: 캐릭터 | (500) combos: image request recorded |
| idol-audition | 이야기 빠르게 | 그림: 상반신 | (500) combos: image request recorded |
| idol-audition | 이야기 빠르게 | 그림: 배경 | (500) combos: image request recorded |
| idol-audition | 이야기 빠르게 | 그림: 소품 | (500) combos: image request recorded |
| idol-audition | 이야기 빠르게 | 그림: 적 | (500) combos: image request recorded |
| idol-audition | 이야기 빠르게 | 그림: CG | (500) combos: image request recorded |
| idol-audition | 이야기 빠르게 | handleNavigationAndToolsAction:aiskin | AI가 태그를 누락하거나 바꿔서 적용하지 않았어요. 기존 입력은 유지했어요. |
| idol-audition | 이야기 빠르게 | handleStoryAndAuthoringAction:stdetail | Cannot read properties of null (reading 'value') |
| idol-audition | 이야기 빠르게 | handleStoryAndAuthoringAction:aiworld | Cannot set properties of null (setting 'textContent') |
| idol-audition | 이야기 빠르게 | handleCharactersAction:ailinesmore | Cannot read properties of null (reading 'value') |
| idol-audition | 이야기 빠르게 | handleEconomyAction:shkai | Cannot set properties of null (setting 'value') |
| idol-audition | 플레이어가 쓴 플롯 | naiBlocksSeparate | AI가 태그를 누락하거나 바꿔서 적용하지 않았어요. 기존 입력은 유지했어요. |
| idol-audition | 플레이어가 쓴 플롯 | rulesPosAI | Cannot set properties of null (setting 'positions') |
| idol-audition | 플레이어가 쓴 플롯 | skinAuto | AI가 태그를 누락하거나 바꿔서 적용하지 않았어요. 기존 입력은 유지했어요. |
| idol-audition | 플레이어가 쓴 플롯 | auditAIFill | Cannot read properties of undefined (reading '1') |
| idol-audition | 플레이어가 쓴 플롯 | 그림: 캐릭터 | (500) combos: image request recorded |

## 기준(59cd3f9)과 다른 프롬프트 (0)

| 게임|상황|흐름|주인|순번 | 기준 | 지금 | 처음 다른 곳 |
|---|---|---|---|

## 못 본 갈래 (지점별 앞 8개)

- 0015-prompt-studio/010-studio.js pstPolish: `less`(참 못 봄)
- 0030-image/010-engine.js weaponPromptAI: `x.cur`()
- 0135-schedule.js spotsAI: `tone`(참 못 봄) · `w.source`() · `side`() · `storyCfg().plot`() · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`() · `c.alt&&charById(c.alt)`(참 못 봄)
- 0135-schedule.js spotTalkAI: `tone`(참 못 봄) · `w.source`() · `side`() · `storyCfg().plot`() · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`() · `c.alt&&charById(c.alt)`(참 못 봄)
- 0185-game-rules.js rulesAIData: `tone`(참 못 봄) · `w.source`() · `side`() · `storyCfg().plot`() · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`() · `c.alt&&charById(c.alt)`(참 못 봄)
- 0185-game-rules.js rulesPosAI: `tone`(참 못 봄) · `w.source`() · `side`() · `storyCfg().plot`() · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`() · `c.alt&&charById(c.alt)`(참 못 봄)
- 0250-story-factory.js aiChapterGen0: `deep`() · `deep`( 거짓 못 봄) · `deep`() · `deep`() · `deep`() · `tone`(참 못 봄) · `w.source`() · `side`()
- 0250-story-factory.js aiEventGen0: `deep`() · `deep`( 거짓 못 봄) · `deep`() · `ncN`(참 못 봄) · `deep`() · `deep`() · `tone`(참 못 봄) · `w.source`()
- 0250-story-factory.js ensureLibPrompts: `w.source`() · `side`() · `storyCfg().plot`() · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`() · `c.alt&&charById(c.alt)`(참 못 봄) · `G.chars.some(c=>c.alt&&!c.altCanon)`(참 못 봄)
- 0250-story-factory.js writeStages: `o.plan`() · `prevTail`() · `s.story`(참 못 봄) · `s.mode`() · `i===n-1`() · `tone`(참 못 봄) · `w.source`() · `side`()
- 0260-new-game/010-draft.js drHarmony: `!d.tone`( 거짓 못 봄) · `dupTxt(d.kw,d.tone)`(참 못 봄) · `d.fan&&d.src`(참 못 봄) · `(d.setting.trim())`(참 못 봄) · `(d.story.trim())`(참 못 봄) · `(cs.length)`(참 못 봄) · `(hr.name||hr.call||hr.gender||hr.look||hr.bio)`() · `없으면: hr.call`( 거짓 못 봄)
- 0260-new-game/010-draft.js drPolishHero: `L.length`(참 못 봄) · `(skip!=='setting'&&d.setting.trim())`(참 못 봄) · `(skip!=='story'&&d.story.trim())`(참 못 봄) · `(skip!=='hero'&&(hr.name||hr.call||hr.gender||hr.look||hr.bio))`(참 못 봄) · `x.startsWith('2차 창작')`(참 못 봄) · `d.fan&&d.src`(참 못 봄)
- 0260-new-game/020-build.js buildNewGameDraft: `auto`() · `heroBlank`() · `hero.call`() · `String(draft.crewTerm||'').trim()`(참 못 봄) · `!DT&&(hero.name||hero.gender||hero.look||hero.bio)`(참 못 봄) · `없으면: hero.name`( 거짓 못 봄) · `userTitle`(참 못 봄) · `th==='auto'`()
- 0270-skin-proposal.js skinLinesAI: `tone`(참 못 봄) · `w.source`() · `side`() · `storyCfg().plot`() · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`() · `c.alt&&charById(c.alt)`(참 못 봄)
- 0290-season-rotation.js aiAltChar: `canon`(참 못 봄) · `없으면: con`() · `tone`(참 못 봄) · `w.source`() · `side`() · `storyCfg().plot`() · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄)
- 0290-season-rotation.js aiNewPickupChar: `없으면: con`() · `COL`(참 못 봄) · `tone`(참 못 봄) · `w.source`() · `side`() · `storyCfg().plot`() · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄)
- 0300-codex.js cxDeepen: `tone`(참 못 봄) · `w.source`() · `side`() · `storyCfg().plot`() · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`() · `c.alt&&charById(c.alt)`(참 못 봄)
- 0300-codex.js cxDiscover: `tone`(참 못 봄) · `w.source`() · `side`() · `storyCfg().plot`() · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`() · `c.alt&&charById(c.alt)`(참 못 봄)
- 0330-casting.js autoNpcs: `k==='m'`( 거짓 못 봄) · `k==='mix'`(참 못 봄)
- 0445-factions.js factionAI: `tone`(참 못 봄) · `w.source`() · `side`() · `storyCfg().plot`() · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`() · `c.alt&&charById(c.alt)`(참 못 봄)
- 0450-relations-memory.js relSeedAI: `tone`(참 못 봄) · `w.source`() · `side`() · `storyCfg().plot`() · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`() · `c.alt&&charById(c.alt)`(참 못 봄)
- 0455-persona.js memorialGen: `tone`(참 못 봄) · `w.source`() · `side`() · `storyCfg().plot`() · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`() · `c.alt&&charById(c.alt)`(참 못 봄)
- 0455-persona.js personaAI: `mode==='improve'`(참 못 봄 거짓 못 봄) · `opt.lines`(참 못 봄) · `opt.lines`(참 못 봄) · `tone`(참 못 봄) · `w.source`() · `side`() · `storyCfg().plot`() · `bib`(참 못 봄)
- 0455-persona.js personaAIReview: `tone`(참 못 봄) · `w.source`() · `side`() · `storyCfg().plot`() · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`() · `c.alt&&charById(c.alt)`(참 못 봄)
- 0455-persona.js talkAffGen: `tone`(참 못 봄) · `w.source`() · `side`() · `storyCfg().plot`() · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`() · `c.alt&&charById(c.alt)`(참 못 봄)
- 0462-direction.js directScript: `tone`(참 못 봄) · `(t&&!/^(정하지 ?않음|없음|모름|비밀)$/.test(t))`(참 못 봄) · `k==='m'`( 거짓 못 봄) · `k==='mix'`(참 못 봄) · `bio`(참 못 봄)
- 0465-story-plan.js planAI: `tone`(참 못 봄) · `w.source`() · `side`() · `storyCfg().plot`() · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`() · `c.alt&&charById(c.alt)`(참 못 봄)
- 0510-actions/020-navigation-and-tools.js handleNavigationAndToolsAction: `tone`(참 못 봄) · `w.source`() · `side`() · `storyCfg().plot`() · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`() · `c.alt&&charById(c.alt)`(참 못 봄)
- 0510-actions/040-story-and-authoring.js handleStoryAndAuthoringAction: `af`(참 못 봄) · `dup`(참 못 봄) · `tone`(참 못 봄) · `w.source`() · `side`() · `storyCfg().plot`() · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄)
- 0510-actions/110-economy.js handleEconomyAction: `c`(참 못 봄) · `tone`(참 못 봄) · `(t&&!/^(정하지 ?않음|없음|모름|비밀)$/.test(t))`(참 못 봄) · `k==='m'`( 거짓 못 봄) · `k==='mix'`(참 못 봄) · `bio`(참 못 봄)
- 0510-actions/120-messenger.js handleMessengerAction: `hint`( 거짓 못 봄) · `없으면: roomLog(c.id).slice(-10).map(l=>l.w==='me'?playerName()+': '+l.t:`() · `tone`(참 못 봄) · `w.source`() · `side`() · `storyCfg().plot`() · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄)
- 0530-story-memory.js storyWrapUp: `tone`(참 못 봄) · `(t&&!/^(정하지 ?않음|없음|모름|비밀)$/.test(t))`(참 못 봄) · `k==='m'`( 거짓 못 봄) · `k==='mix'`(참 못 봄) · `bio`(참 못 봄)
- 0535-content-audit.js auditAIStage: `tone`(참 못 봄) · `w.source`() · `side`() · `storyCfg().plot`() · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`() · `c.alt&&charById(c.alt)`(참 못 봄)
- 그림 0030-image/010-engine.js naiDraw: `(m&&String(m.artTags||'').trim())`(참 못 봄)
