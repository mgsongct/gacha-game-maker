# 프롬프트 조합 검증

생성: `node tools/play/combos.mjs --quick` · 게임 idol-audition · 상황 1 + 새 게임 입력 1

## 요약

- 요청 지점(정적) 86곳 중 실행으로 닿은 곳 41 · 안 닿은 곳 45
- 보낸 프롬프트 106개 · 흐름 오류 15
- 발견: 깨짐 0 · 과잉 0 · 과소 0 · 정보 89


## 지점별 조합

갈래: 정적으로 찾은 조건 수(가능한 조합 2^갈래) · 두 쪽 다 봄 / 한 쪽만 / 못 봄 = 실제 프롬프트에서 그 갈래의 글이 나왔는지

| 지점 | 프롬프트 수 | 상황 수 | 서로 다른 조각 조합 | 글자(최소~최대) | 갈래 | 두 쪽 다 봄 | 한 쪽만 | 못 봄 |
|---|---|---|---|---|---|---|---|---|
| (지점 모름) 그림: 상반신 | 1 | 1 | 1 | 1791~1791 |  | 0 | 0 | 0 |
| (지점 모름) 그림: 소품 | 1 | 1 | 1 | 951~951 |  | 0 | 0 | 0 |
| (지점 모름) 그림: 적 | 1 | 1 | 1 | 921~921 |  | 0 | 0 | 0 |
| (지점 모름) 그림: 캐릭터 | 1 | 1 | 1 | 1993~1993 |  | 0 | 0 | 0 |
| 0015-prompt-studio/010-studio.js pstPolish | 1 | 1 | 1 | 555~555 | 1 | 0 | 0 | 1 |
| 0020-ai-connect.js naiBlocksSeparate | 3 | 1 | 1 | 813~813 | 0 | 0 | 0 | 0 |
| 0030-image/010-engine.js designAI | 1 | 1 | 1 | 1661~1661 | 0 | 0 | 0 | 0 |
| 0030-image/010-engine.js weaponPromptAI | 1 | 1 | 1 | 1388~1388 | 1 | 0 | 1 | 0 |
| 0040-sound.js jaBatch | 1 | 1 | 1 | 216~216 | 0 | 0 | 0 | 0 |
| 0040-sound.js toJa | 1 | 1 | 1 | 201~201 | 0 | 0 | 0 | 0 |
| 0135-schedule.js spotsAI | 2 | 1 | 1 | 7388~7388 | 25 | 0 | 5 | 20 |
| 0135-schedule.js spotTalkAI | 1 | 1 | 1 | 8588~8588 | 25 | 0 | 5 | 20 |
| 0160-player-profile.js heroTags | 2 | 2 | 1 | 534~578 | 0 | 0 | 0 | 0 |
| 0185-game-rules.js rulesAIData | 1 | 1 | 1 | 7308~7308 | 25 | 0 | 5 | 20 |
| 0185-game-rules.js rulesPosAI | 1 | 1 | 1 | 7521~7521 | 25 | 0 | 5 | 20 |
| 0250-story-factory.js aiChapterGen0 | 2 | 1 | 1 | 30402~30413 | 54 | 0 | 16 | 38 |
| 0250-story-factory.js aiEventGen0 | 1 | 1 | 1 | 25894~25894 | 49 | 0 | 10 | 39 |
| 0250-story-factory.js ensureLibPrompts | 1 | 1 | 1 | 3705~3705 | 19 | 0 | 2 | 17 |
| 0250-story-factory.js writeStages | 12 | 1 | 6 | 8812~10947 | 37 | 1 | 12 | 24 |
| 0260-new-game/010-draft.js drHarmony | 1 | 1 | 1 | 1113~1113 | 9 | 0 | 1 | 8 |
| 0260-new-game/010-draft.js drPolishHero | 1 | 1 | 1 | 397~397 | 6 | 0 | 0 | 6 |
| 0260-new-game/020-build.js buildNewGameDraft | 5 | 1 | 5 | 1237~18035 | 20 | 0 | 5 | 15 |
| 0270-skin-proposal.js skinLinesAI | 1 | 1 | 1 | 7389~7389 | 25 | 0 | 5 | 20 |
| 0290-season-rotation.js aiAltChar | 1 | 1 | 1 | 23276~23276 | 29 | 0 | 9 | 20 |
| 0290-season-rotation.js aiNewPickupChar | 1 | 1 | 1 | 22406~22406 | 31 | 0 | 9 | 22 |
| 0300-codex.js cxDeepen | 1 | 1 | 1 | 7871~7871 | 27 | 0 | 6 | 21 |
| 0300-codex.js cxDiscover | 1 | 1 | 1 | 7869~7869 | 27 | 0 | 6 | 21 |
| 0330-casting.js autoNpcs | 1 | 1 | 1 | 1255~1255 | 3 | 0 | 0 | 3 |
| 0445-factions.js factionAI | 1 | 1 | 1 | 8937~8937 | 25 | 0 | 5 | 20 |
| 0450-relations-memory.js relSeedAI | 1 | 1 | 1 | 9776~9776 | 28 | 0 | 6 | 22 |
| 0455-persona.js memorialGen | 1 | 1 | 1 | 8538~8538 | 25 | 0 | 5 | 20 |
| 0455-persona.js personaAI | 1 | 1 | 1 | 9347~9347 | 28 | 0 | 5 | 23 |
| 0455-persona.js personaAIReview | 1 | 1 | 1 | 8217~8217 | 25 | 0 | 5 | 20 |
| 0455-persona.js talkAffGen | 1 | 1 | 1 | 7981~7981 | 25 | 0 | 5 | 20 |
| 0462-direction.js directScript | 1 | 1 | 1 | 1796~1796 | 6 | 0 | 0 | 6 |
| 0465-story-plan.js planAI | 3 | 1 | 1 | 7699~7699 | 25 | 0 | 5 | 20 |
| 0510-actions/020-navigation-and-tools.js handleNavigationAndToolsAction | 2 | 1 | 2 | 636~8288 | 25 | 0 | 5 | 20 |
| 0510-actions/040-story-and-authoring.js handleStoryAndAuthoringAction | 3 | 1 | 3 | 1034~8903 | 27 | 0 | 5 | 22 |
| 0510-actions/090-characters.js handleCharactersAction#4 | 4 | 1 | 4 | 1106~7435 | 0 | 0 | 0 | 0 |
| 0510-actions/110-economy.js handleEconomyAction | 1 | 1 | 1 | 687~687 | 7 | 0 | 0 | 7 |
| 0510-actions/120-messenger.js handleMessengerAction | 1 | 1 | 1 | 8201~8201 | 28 | 0 | 7 | 21 |
| 0530-story-memory.js smExtract | 25 | 1 | 2 | 351~1711 | 0 | 0 | 0 | 0 |
| 0530-story-memory.js storyWrapUp | 4 | 1 | 1 | 1388~1388 | 6 | 0 | 0 | 6 |
| 0535-content-audit.js auditAIStage | 1 | 1 | 1 | 8152~8152 | 25 | 0 | 5 | 20 |
| 그림 0030-image/010-engine.js naiDraw | 7 | 2 | 1 | 833~1925 | 1 | 0 | 0 | 1 |

## 발견 (깨짐·과잉·과소)

| 종류 | 항목 | 지점 | 내용 | 상황 |
|---|---|---|---|---|

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
| 형식 견본 뒤 글 | 0160-player-profile.js heroTags | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0185-game-rules.js rulesAIData | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0185-game-rules.js rulesPosAI | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0250-story-factory.js ensureLibPrompts | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0465-story-plan.js planAI | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0250-story-factory.js aiChapterGen0 | 견본 뒤에 「스킬 작성 규칙: 스킬 JSON은 skills:{version:2,passive,activ」 |
| 요구하지 않은 키 읽을 수 있음 | 0250-story-factory.js aiChapterGen0 | 코드가 응답의 "relations"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0250-story-factory.js aiChapterGen0 | 코드가 응답의 "summary"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0250-story-factory.js aiChapterGen0 | 코드가 응답의 "threads"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 형식 견본 뒤 글 | 0250-story-factory.js writeStages | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 1 값 57] 대본 222 대본 223 다른 설명이나 코드 블록 없이 」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 2 값 92] 대본 224 대본 225 다른 설명이나 코드 블록 없이 」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 3 값 127] 대본 226 대본 227 다른 설명이나 코드 블록 없이」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 4 값 162] 대본 228 대본 229 다른 설명이나 코드 블록 없이」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「기록 230 기록 231 기록 232 기록 233 다른 설명이나 코드 블록 없이 JSON만」 |
| 형식 견본 뒤 글 | 0530-story-memory.js storyWrapUp | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 1 값 262] 대본 427 대본 428 다른 설명이나 코드 블록 없이」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 2 값 297] 대본 429 대본 430 다른 설명이나 코드 블록 없이」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 3 값 332] 대본 431 대본 432 다른 설명이나 코드 블록 없이」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 4 값 367] 대본 433 대본 434 다른 설명이나 코드 블록 없이」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「기록 435 기록 436 기록 437 기록 438 다른 설명이나 코드 블록 없이 JSON만」 |
| 형식 견본 뒤 글 | 0250-story-factory.js aiEventGen0 | 견본 뒤에 「스킬 작성 규칙: 스킬 JSON은 skills:{version:2,passive,activ」 |
| 요구하지 않은 키 읽을 수 있음 | 0250-story-factory.js aiEventGen0 | 코드가 응답의 "relations"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0250-story-factory.js aiEventGen0 | 코드가 응답의 "summary"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0250-story-factory.js aiEventGen0 | 코드가 응답의 "threads"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 1 값 467] 대본 616 대본 617 다른 설명이나 코드 블록 없이」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 2 값 502] 대본 618 대본 619 다른 설명이나 코드 블록 없이」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 3 값 537] 대본 620 대본 621 다른 설명이나 코드 블록 없이」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 4 값 572] 대본 622 대본 623 다른 설명이나 코드 블록 없이」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「기록 624 기록 625 기록 626 기록 627 다른 설명이나 코드 블록 없이 JSON만」 |
| 형식 견본 뒤 글 | 0260-new-game/010-draft.js drPolishHero | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0260-new-game/010-draft.js drHarmony | 견본 뒤에 「— chars는 위 인물 순서 그대로, 같은 수로. 다른 설명이나 코드 블록 없이 JSON」 |
| 형식 견본 뒤 글 | 0270-skin-proposal.js skinLinesAI | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0290-season-rotation.js aiNewPickupChar | 견본 뒤에 「희귀도가 높을수록 능력치 합이 높다. 지원형은 heal/shield/buff, 방어형은 체」 |
| 형식 견본 뒤 글 | 0290-season-rotation.js aiAltChar | 견본 뒤에 「희귀도가 높을수록 능력치 합이 높다. 지원형은 heal/shield/buff, 방어형은 체」 |
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
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「기록 971 기록 972 기록 973 기록 974 다른 설명이나 코드 블록 없이 JSON만」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「기록 978 기록 979 기록 980 기록 981 다른 설명이나 코드 블록 없이 JSON만」 |
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

## 실행으로 안 닿은 요청 지점 (45)

| 지점 | 위치 | 갈래 |
|---|---|---|
| 0030-image/010-engine.js regenRun | src/main/0030-image/010-engine.js:48 | 6 |
| 0030-image/010-engine.js requestUltimateScene | src/main/0030-image/010-engine.js:120 | 7 |
| 0030-image/010-engine.js illustrationScenePreparation | src/main/0030-image/010-engine.js:145 | 7 |
| 0100-messenger.js fcSend | src/main/0100-messenger.js:152 | 41 |
| 0100-messenger.js fcSummarize | src/main/0100-messenger.js:178 | 0 |
| 0185-game-rules.js posAI | src/main/0185-game-rules.js:128 | 25 |
| 0200-skin-shop.js skinAuto | src/main/0200-skin-shop.js:16 | 7 |
| 0260-new-game/010-draft.js drPolish | src/main/0260-new-game/010-draft.js:148 | 9 |
| 0260-new-game/010-draft.js drFillChar | src/main/0260-new-game/010-draft.js:167 | 6 |
| 0260-new-game/020-build.js buildNewGameDraft#2 | src/main/0260-new-game/020-build.js:94 | 22 |
| 0260-new-game/020-build.js buildNewGameDraft#3 | src/main/0260-new-game/020-build.js:101 | 8 |
| 0260-new-game/020-build.js buildNewGameDraft#4 | src/main/0260-new-game/020-build.js:107 | 0 |
| 0260-new-game/020-build.js buildNewGameDraft#5 | src/main/0260-new-game/020-build.js:116 | 29 |
| 0260-new-game/020-build.js buildNewGameDraft#6 | src/main/0260-new-game/020-build.js:119 | 32 |
| 0280-live-ops.js dailyTalks | src/main/0280-live-ops.js:33 | 33 |
| 0445-factions.js stanceAI | src/main/0445-factions.js:48 | 25 |
| 0510-actions/020-navigation-and-tools.js handleNavigationAndToolsAction#2 | src/main/0510-actions/020-navigation-and-tools.js:91 | 0 |
| 0510-actions/020-navigation-and-tools.js handleNavigationAndToolsAction#3 | src/main/0510-actions/020-navigation-and-tools.js:93 | 0 |
| 0510-actions/020-navigation-and-tools.js handleNavigationAndToolsAction#4 | src/main/0510-actions/020-navigation-and-tools.js:94 | 0 |
| 0510-actions/020-navigation-and-tools.js handleNavigationAndToolsAction#5 | src/main/0510-actions/020-navigation-and-tools.js:95 | 1 |
| 0510-actions/020-navigation-and-tools.js handleNavigationAndToolsAction#6 | src/main/0510-actions/020-navigation-and-tools.js:130 | 1 |
| 0510-actions/040-story-and-authoring.js handleStoryAndAuthoringAction#2 | src/main/0510-actions/040-story-and-authoring.js:72 | 25 |
| 0510-actions/040-story-and-authoring.js handleStoryAndAuthoringAction#3 | src/main/0510-actions/040-story-and-authoring.js:88 | 34 |
| 0510-actions/040-story-and-authoring.js handleStoryAndAuthoringAction#4 | src/main/0510-actions/040-story-and-authoring.js:98 | 6 |
| 0510-actions/050-settings-and-audio.js handleSettingsAndAudioAction | src/main/0510-actions/050-settings-and-audio.js:59 | 0 |
| 0510-actions/050-settings-and-audio.js handleSettingsAndAudioAction#2 | src/main/0510-actions/050-settings-and-audio.js:66 | 0 |
| 0510-actions/090-characters.js handleCharactersAction | src/main/0510-actions/090-characters.js:16 | 6 |
| 0510-actions/090-characters.js handleCharactersAction#2 | src/main/0510-actions/090-characters.js:18 | 25 |
| 0510-actions/090-characters.js handleCharactersAction#3 | src/main/0510-actions/090-characters.js:21 | 6 |
| 0510-actions/090-characters.js handleCharactersAction#5 | src/main/0510-actions/090-characters.js:42 | 0 |
| 0510-actions/100-images-and-assets.js handleImagesAndAssetsAction | src/main/0510-actions/100-images-and-assets.js:29 | 0 |
| 0510-actions/100-images-and-assets.js handleImagesAndAssetsAction#2 | src/main/0510-actions/100-images-and-assets.js:92 | 25 |
| 0530-story-memory.js smExtract#2 | src/main/0530-story-memory.js:11 | 0 |
| 0530-story-memory.js smExtract#3 | src/main/0530-story-memory.js:12 | 0 |
| 0530-story-memory.js smExtract#4 | src/main/0530-story-memory.js:13 | 0 |
| 0535-content-audit.js auditAIFill | src/main/0535-content-audit.js:62 | 27 |
| modules/combat/050-bridge.js v2GenerateSkills | src/modules/combat/050-bridge.js:296 | 4 |
| modules/combat/050-bridge.js v2ConceptPrompt | src/modules/combat/050-bridge.js:369 | 0 |
| modules/combat/060-generation.js v2ResolvePalette | src/modules/combat/060-generation.js:121 | 2 |
| modules/combat/060-generation.js v2GenerateSelected | src/modules/combat/060-generation.js:161 | 3 |
| modules/combat/060-generation.js v2GenerateSelected#2 | src/modules/combat/060-generation.js:188 | 4 |
| modules/combat/070-equipment.js v2GearGenerate | src/modules/combat/070-equipment.js:74 | 0 |
| 그림 0030-image/010-engine.js naiDraw#2 | src/main/0030-image/010-engine.js:180 | 1 |
| 그림 0030-image/010-engine.js openNaiGen | src/main/0030-image/010-engine.js:751 | 0 |
| 그림 0030-image/010-engine.js faceDrawOne | src/main/0030-image/010-engine.js:839 | 1 |

## 흐름 오류 (15)

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
| idol-audition | 기본 | handleStoryAndAuthoringAction:aiworld | Cannot set properties of null (setting 'value') |
| idol-audition | 기본 | handleCharactersAction:ailinesmore | Cannot read properties of null (reading 'value') |
| idol-audition | 기본 | handleEconomyAction:shkai | Cannot set properties of null (setting 'value') |

## 못 본 갈래 (지점별 앞 8개)

- 0015-prompt-studio/010-studio.js pstPolish: `less`(참 못 봄)
- 0030-image/010-engine.js weaponPromptAI: `x.cur`()
- 0135-schedule.js spotsAI: `tone`(참 못 봄) · `w.source`(참 못 봄) · `side`() · `storyCfg().plot`(참 못 봄) · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`() · `c.alt&&charById(c.alt)`(참 못 봄)
- 0135-schedule.js spotTalkAI: `tone`(참 못 봄) · `w.source`(참 못 봄) · `side`() · `storyCfg().plot`(참 못 봄) · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`() · `c.alt&&charById(c.alt)`(참 못 봄)
- 0185-game-rules.js rulesAIData: `tone`(참 못 봄) · `w.source`(참 못 봄) · `side`() · `storyCfg().plot`(참 못 봄) · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`() · `c.alt&&charById(c.alt)`(참 못 봄)
- 0185-game-rules.js rulesPosAI: `tone`(참 못 봄) · `w.source`(참 못 봄) · `side`() · `storyCfg().plot`(참 못 봄) · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`() · `c.alt&&charById(c.alt)`(참 못 봄)
- 0250-story-factory.js aiChapterGen0: `deep`( 거짓 못 봄) · `deep`( 거짓 못 봄) · `deep`( 거짓 못 봄) · `deep`( 거짓 못 봄) · `deep`( 거짓 못 봄) · `deep`( 거짓 못 봄) · `tone`(참 못 봄) · `w.source`(참 못 봄)
- 0250-story-factory.js aiEventGen0: `deep`( 거짓 못 봄) · `deep`( 거짓 못 봄) · `deep`( 거짓 못 봄) · `deep`( 거짓 못 봄) · `ncN`(참 못 봄) · `deep`( 거짓 못 봄) · `deep`( 거짓 못 봄) · `tone`(참 못 봄)
- 0250-story-factory.js ensureLibPrompts: `w.source`(참 못 봄) · `side`() · `storyCfg().plot`(참 못 봄) · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`( 거짓 못 봄) · `c.alt&&charById(c.alt)`(참 못 봄) · `G.chars.some(c=>c.alt&&!c.altCanon)`(참 못 봄)
- 0250-story-factory.js writeStages: `o.plan`() · `prevTail`() · `s.story`(참 못 봄) · `s.mode`() · `i===n-1`() · `tone`(참 못 봄) · `w.source`(참 못 봄) · `side`()
- 0260-new-game/010-draft.js drHarmony: `!d.tone`( 거짓 못 봄) · `dupTxt(d.kw,d.tone)`(참 못 봄) · `d.fan&&d.src`(참 못 봄) · `(d.setting.trim())`(참 못 봄) · `(d.story.trim())`(참 못 봄) · `(cs.length)`(참 못 봄) · `(hr.name||hr.call||hr.gender||hr.look||hr.bio)`() · `없으면: hr.call`( 거짓 못 봄)
- 0260-new-game/010-draft.js drPolishHero: `L.length`(참 못 봄) · `(skip!=='setting'&&d.setting.trim())`(참 못 봄) · `(skip!=='story'&&d.story.trim())`(참 못 봄) · `(skip!=='hero'&&(hr.name||hr.call||hr.gender||hr.look||hr.bio))`(참 못 봄) · `x.startsWith('2차 창작')`(참 못 봄) · `d.fan&&d.src`(참 못 봄)
- 0260-new-game/020-build.js buildNewGameDraft: `auto`() · `heroBlank`() · `hero.call`(참 못 봄) · `String(draft.crewTerm||'').trim()`(참 못 봄) · `!DT&&(hero.name||hero.gender||hero.look||hero.bio)`(참 못 봄) · `없으면: hero.name`( 거짓 못 봄) · `userTitle`(참 못 봄) · `th==='auto'`()
- 0270-skin-proposal.js skinLinesAI: `tone`(참 못 봄) · `w.source`(참 못 봄) · `side`() · `storyCfg().plot`(참 못 봄) · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`() · `c.alt&&charById(c.alt)`(참 못 봄)
- 0290-season-rotation.js aiAltChar: `canon`(참 못 봄) · `없으면: con`() · `tone`(참 못 봄) · `w.source`(참 못 봄) · `side`() · `storyCfg().plot`(참 못 봄) · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄)
- 0290-season-rotation.js aiNewPickupChar: `없으면: con`() · `COL`(참 못 봄) · `tone`(참 못 봄) · `w.source`(참 못 봄) · `side`() · `storyCfg().plot`(참 못 봄) · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄)
- 0300-codex.js cxDeepen: `tone`(참 못 봄) · `w.source`(참 못 봄) · `side`() · `storyCfg().plot`(참 못 봄) · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`() · `c.alt&&charById(c.alt)`(참 못 봄)
- 0300-codex.js cxDiscover: `tone`(참 못 봄) · `w.source`(참 못 봄) · `side`() · `storyCfg().plot`(참 못 봄) · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`() · `c.alt&&charById(c.alt)`(참 못 봄)
- 0330-casting.js autoNpcs: `k==='f'`(참 못 봄 거짓 못 봄) · `k==='m'`(참 못 봄 거짓 못 봄) · `k==='mix'`(참 못 봄)
- 0445-factions.js factionAI: `tone`(참 못 봄) · `w.source`(참 못 봄) · `side`() · `storyCfg().plot`(참 못 봄) · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`() · `c.alt&&charById(c.alt)`(참 못 봄)
- 0450-relations-memory.js relSeedAI: `tone`(참 못 봄) · `w.source`(참 못 봄) · `side`() · `storyCfg().plot`(참 못 봄) · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`() · `c.alt&&charById(c.alt)`(참 못 봄)
- 0455-persona.js memorialGen: `tone`(참 못 봄) · `w.source`(참 못 봄) · `side`() · `storyCfg().plot`(참 못 봄) · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`() · `c.alt&&charById(c.alt)`(참 못 봄)
- 0455-persona.js personaAI: `mode==='improve'`(참 못 봄 거짓 못 봄) · `opt.lines`(참 못 봄) · `opt.lines`(참 못 봄) · `tone`(참 못 봄) · `w.source`(참 못 봄) · `side`() · `storyCfg().plot`(참 못 봄) · `bib`(참 못 봄)
- 0455-persona.js personaAIReview: `tone`(참 못 봄) · `w.source`(참 못 봄) · `side`() · `storyCfg().plot`(참 못 봄) · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`() · `c.alt&&charById(c.alt)`(참 못 봄)
- 0455-persona.js talkAffGen: `tone`(참 못 봄) · `w.source`(참 못 봄) · `side`() · `storyCfg().plot`(참 못 봄) · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`() · `c.alt&&charById(c.alt)`(참 못 봄)
- 0462-direction.js directScript: `tone`(참 못 봄) · `(t&&!/^(정하지 ?않음|없음|모름|비밀)$/.test(t))`(참 못 봄) · `k==='f'`(참 못 봄 거짓 못 봄) · `k==='m'`(참 못 봄 거짓 못 봄) · `k==='mix'`(참 못 봄) · `bio`(참 못 봄)
- 0465-story-plan.js planAI: `tone`(참 못 봄) · `w.source`(참 못 봄) · `side`() · `storyCfg().plot`(참 못 봄) · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`() · `c.alt&&charById(c.alt)`(참 못 봄)
- 0510-actions/020-navigation-and-tools.js handleNavigationAndToolsAction: `tone`(참 못 봄) · `w.source`(참 못 봄) · `side`() · `storyCfg().plot`(참 못 봄) · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`() · `c.alt&&charById(c.alt)`(참 못 봄)
- 0510-actions/040-story-and-authoring.js handleStoryAndAuthoringAction: `af`(참 못 봄) · `dup`(참 못 봄) · `tone`(참 못 봄) · `w.source`(참 못 봄) · `side`() · `storyCfg().plot`(참 못 봄) · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄)
- 0510-actions/110-economy.js handleEconomyAction: `c`(참 못 봄) · `tone`(참 못 봄) · `(t&&!/^(정하지 ?않음|없음|모름|비밀)$/.test(t))`(참 못 봄) · `k==='f'`(참 못 봄 거짓 못 봄) · `k==='m'`(참 못 봄 거짓 못 봄) · `k==='mix'`(참 못 봄) · `bio`(참 못 봄)
- 0510-actions/120-messenger.js handleMessengerAction: `hint`( 거짓 못 봄) · `없으면: roomLog(c.id).slice(-10).map(l=>l.w==='me'?playerName()+': '+l.t:`() · `tone`(참 못 봄) · `w.source`(참 못 봄) · `side`() · `storyCfg().plot`(참 못 봄) · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄)
- 0530-story-memory.js storyWrapUp: `tone`(참 못 봄) · `(t&&!/^(정하지 ?않음|없음|모름|비밀)$/.test(t))`(참 못 봄) · `k==='f'`(참 못 봄 거짓 못 봄) · `k==='m'`(참 못 봄 거짓 못 봄) · `k==='mix'`(참 못 봄) · `bio`(참 못 봄)
- 0535-content-audit.js auditAIStage: `tone`(참 못 봄) · `w.source`(참 못 봄) · `side`() · `storyCfg().plot`(참 못 봄) · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`() · `c.alt&&charById(c.alt)`(참 못 봄)
- 그림 0030-image/010-engine.js naiDraw: `(m&&String(m.artTags||'').trim())`(참 못 봄)
