# 프롬프트 조합 검증

생성: `node tools/play/combos.mjs --ref HEAD` · 게임 idol-audition, sky-knights · 상황 15 + 새 게임 입력 4

## 요약

- 요청 지점(정적) 84곳 중 실행으로 닿은 곳 40 · 안 닿은 곳 44
- 보낸 프롬프트 2462개 · 흐름 오류 456
- 발견: 깨짐 3 · 과잉 7 · 과소 2 · 정보 82
- 기준(6f687b4)과 다른 프롬프트 0

## 지점별 조합

갈래: 정적으로 찾은 조건 수(가능한 조합 2^갈래) · 두 쪽 다 봄 / 한 쪽만 / 못 봄 = 실제 프롬프트에서 그 갈래의 글이 나왔는지

| 지점 | 프롬프트 수 | 상황 수 | 서로 다른 조각 조합 | 글자(최소~최대) | 갈래 | 두 쪽 다 봄 | 한 쪽만 | 못 봄 |
|---|---|---|---|---|---|---|---|---|
| (지점 모름) (최상위 문장) | 30 | 30 | 1 | 496~496 |  | 0 | 0 | 0 |
| (지점 모름) aiAltChar | 30 | 30 | 1 | 3579~3579 |  | 0 | 0 | 0 |
| (지점 모름) aiNewPickupChar | 30 | 30 | 1 | 3577~3577 |  | 0 | 0 | 0 |
| (지점 모름) 그림: 상반신 | 30 | 30 | 1 | 1773~1791 |  | 0 | 0 | 0 |
| (지점 모름) 그림: 소품 | 30 | 30 | 1 | 951~991 |  | 0 | 0 | 0 |
| (지점 모름) 그림: 적 | 30 | 30 | 1 | 921~921 |  | 0 | 0 | 0 |
| (지점 모름) 그림: 캐릭터 | 30 | 30 | 1 | 1975~1993 |  | 0 | 0 | 0 |
| 0020-ai-connect.js naiBlocksSeparate | 90 | 30 | 1 | 804~813 | 0 | 0 | 0 | 0 |
| 0030-character-regen.js designAI | 30 | 30 | 1 | 1143~2242 | 0 | 0 | 0 | 0 |
| 0030-character-regen.js weaponPromptAI | 30 | 30 | 1 | 1388~1397 | 1 | 0 | 1 | 0 |
| 0040-sound.js jaBatch | 30 | 30 | 1 | 216~216 | 0 | 0 | 0 | 0 |
| 0040-sound.js toJa | 30 | 30 | 1 | 201~201 | 0 | 0 | 0 | 0 |
| 0135-schedule.js spotsAI | 60 | 30 | 10 | 5135~10591 | 25 | 1 | 11 | 13 |
| 0160-free-chat.js heroTags | 32 | 32 | 1 | 534~578 | 0 | 0 | 0 | 0 |
| 0185-game-rules.js rulesAIData | 30 | 30 | 10 | 5055~10472 | 25 | 1 | 11 | 13 |
| 0185-game-rules.js rulesPosAI | 30 | 30 | 10 | 5268~10687 | 25 | 1 | 11 | 13 |
| 0250-story-factory.js aiChapterGen0 | 60 | 30 | 14 | 28004~37093 | 54 | 3 | 24 | 27 |
| 0250-story-factory.js aiEventGen0 | 30 | 30 | 12 | 23641~29835 | 49 | 3 | 19 | 27 |
| 0250-story-factory.js buildNewGameDraft | 10 | 2 | 7 | 1233~18426 | 20 | 0 | 5 | 15 |
| 0250-story-factory.js ensureLibPrompts | 30 | 30 | 4 | 3705~3706 | 19 | 0 | 7 | 12 |
| 0250-story-factory.js writeStages | 84 | 28 | 18 | 6333~15981 | 37 | 1 | 18 | 18 |
| 0260-new-game-draft.js drHarmony | 30 | 30 | 1 | 1101~1101 | 9 | 0 | 1 | 8 |
| 0260-new-game-draft.js drPolishHero | 30 | 30 | 1 | 397~397 | 6 | 0 | 0 | 6 |
| 0270-skin-proposal.js skinLinesAI | 30 | 30 | 10 | 5136~10530 | 25 | 1 | 11 | 13 |
| 0290-season-rotation.js aiAltChar | 30 | 30 | 10 | 21026~26190 | 29 | 1 | 15 | 13 |
| 0290-season-rotation.js aiNewPickupChar | 30 | 30 | 10 | 20156~25345 | 31 | 1 | 15 | 15 |
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
| 0510-actions/120-messenger.js handleMessengerAction | 30 | 30 | 10 | 5938~11316 | 27 | 1 | 12 | 14 |
| 0530-story-memory.js smExtract | 480 | 30 | 2 | 337~1828 | 0 | 0 | 0 | 0 |
| 0530-story-memory.js storyWrapUp | 114 | 30 | 3 | 1384~1693 | 6 | 1 | 1 | 4 |
| 0535-content-audit.js auditAIStage | 30 | 30 | 10 | 5899~11309 | 25 | 1 | 11 | 13 |
| 그림 0030-character-regen.js naiDraw | 182 | 32 | 1 | 833~1925 | 1 | 0 | 0 | 1 |

## 발견 (깨짐·과잉·과소)

| 종류 | 항목 | 지점 | 내용 | 상황 |
|---|---|---|---|---|
| 과소 | 형식 지시 없음 | 0290-season-rotation.js aiAltChar | JSON으로 답을 받는데 "JSON만 출력" 표식·견본이 없음 | idol-audition · 기본 / idol-audition · 마지막 스테이지: 전투 / idol-audition · 마지막 스테이지: 콘테스트 외 27 |
| 과소 | 형식 지시 없음 | 0290-season-rotation.js aiNewPickupChar | JSON으로 답을 받는데 "JSON만 출력" 표식·견본이 없음 | idol-audition · 기본 / idol-audition · 마지막 스테이지: 전투 / idol-audition · 마지막 스테이지: 콘테스트 외 27 |
| 과잉 | 읽지 않는 키 요구 | (지점 모름) aiAltChar | 견본의 "designPlan"를 이 흐름에서 코드가 읽지 않음(답을 받고도 버림) | idol-audition · 기본 / idol-audition · 마지막 스테이지: 전투 / idol-audition · 마지막 스테이지: 콘테스트 외 27 |
| 과잉 | 읽지 않는 키 요구 | (지점 모름) aiNewPickupChar | 견본의 "designPlan"를 이 흐름에서 코드가 읽지 않음(답을 받고도 버림) | idol-audition · 기본 / idol-audition · 마지막 스테이지: 전투 / idol-audition · 마지막 스테이지: 콘테스트 외 27 |
| 과잉 | 같은 조각 되풀이 | 0250-story-factory.js aiChapterGen0 | CAST_SEX_F가 2번 들어감 | idol-audition · 출연 성별: 여성만 / sky-knights · 출연 성별: 여성만 |
| 과잉 | 같은 조각 되풀이 | 0250-story-factory.js aiChapterGen0 | CAST_SEX_M가 2번 들어감 | idol-audition · 출연 성별: 남성만 / sky-knights · 출연 성별: 남성만 |
| 과잉 | 같은 조각 되풀이 | 0250-story-factory.js aiEventGen0 | CAST_SEX_F가 2번 들어감 | idol-audition · 출연 성별: 여성만 / sky-knights · 출연 성별: 여성만 |
| 과잉 | 같은 조각 되풀이 | 0250-story-factory.js aiEventGen0 | CAST_SEX_M가 2번 들어감 | idol-audition · 출연 성별: 남성만 / sky-knights · 출연 성별: 남성만 |
| 과잉 | 같은 조각 되풀이 | 0250-story-factory.js buildNewGameDraft | FINALE_RULE가 2번 들어감 | idol-audition · 새 게임 · 자동 / sky-knights · 새 게임 · 자동 |
| 깨짐 | 빈 머리말 | (지점 모름) (최상위 문장) | 「원문:」 뒤에 내용이 없음 | idol-audition · 기본 / idol-audition · 마지막 스테이지: 전투 / idol-audition · 마지막 스테이지: 콘테스트 외 27 |
| 깨짐 | 빈 머리말 | 0250-story-factory.js buildNewGameDraft | 「배경 목록:」 뒤에 내용이 없음 | idol-audition · 새 게임 · 자동 / sky-knights · 새 게임 · 자동 |
| 깨짐 | 빈 머리말 | 0510-actions/120-messenger.js handleMessengerAction | 「최근 대화 일부:」 뒤에 내용이 없음 | idol-audition · 기본 / idol-audition · 마지막 스테이지: 전투 / idol-audition · 마지막 스테이지: 콘테스트 외 27 |

## 정보

| 항목 | 지점 | 내용 |
|---|---|---|
| 형식 견본 뒤 글 | 0020-ai-connect.js naiBlocksSeparate | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0030-character-regen.js designAI | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0030-character-regen.js weaponPromptAI | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0040-sound.js jaBatch | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0040-sound.js toJa | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0135-schedule.js spotsAI | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
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
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 1 작전] 대본 대본 다른 설명이나 코드 블록 없이 JSON만 출력한다」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「기록 다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하」 |
| 형식 견본 뒤 글 | 0530-story-memory.js storyWrapUp | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0250-story-factory.js aiEventGen0 | 견본 뒤에 「스킬 작성 규칙: 스킬 JSON은 skills:{version:2,passive,activ」 |
| 요구하지 않은 키 읽을 수 있음 | 0250-story-factory.js aiEventGen0 | 코드가 응답의 "relations"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0250-story-factory.js aiEventGen0 | 코드가 응답의 "summary"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0250-story-factory.js aiEventGen0 | 코드가 응답의 "threads"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 1 스테이지] 대본 대본 다른 설명이나 코드 블록 없이 JSON만 출력」 |
| 형식 견본 뒤 글 | 0260-new-game-draft.js drPolishHero | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0260-new-game-draft.js drHarmony | 견본 뒤에 「— chars는 위 인물 순서 그대로, 같은 수로. 다른 설명이나 코드 블록 없이 JSON」 |
| 형식 견본 뒤 글 | 0270-skin-proposal.js skinLinesAI | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | (지점 모름) aiNewPickupChar | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
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
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「기록 기록 기록 기록 다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서」 |
| 형식 견본 뒤 글 | 0535-content-audit.js auditAIStage | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | (지점 모름) (최상위 문장) | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
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
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 1 작전] 다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 1 스테이지] 다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자」 |
| 형식 견본 뒤 글 | 0250-story-factory.js buildNewGameDraft | 견본 뒤에 「파견은 6개 — 이름·설명만 쓴다(실제 의뢰의 시간·인원·보상은 게임의 파견 게시판이 매일」 |
| 형식 견본 뒤 글 | 0250-story-factory.js buildNewGameDraft | 견본 뒤에 「naiPrompt는 NovelAI용 영어 태그 문자열. "1girl, solo"(남자는 "」 |
| 요구하지 않은 키 읽을 수 있음 | 0250-story-factory.js buildNewGameDraft | 코드가 응답의 "accent"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0250-story-factory.js buildNewGameDraft | 코드가 응답의 "elems"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0250-story-factory.js buildNewGameDraft | 코드가 응답의 "finale"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0250-story-factory.js buildNewGameDraft | 코드가 응답의 "hero"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0250-story-factory.js buildNewGameDraft | 코드가 응답의 "positions"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0250-story-factory.js buildNewGameDraft | 코드가 응답의 "reactions"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0250-story-factory.js buildNewGameDraft | 코드가 응답의 "roleDesc"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0250-story-factory.js buildNewGameDraft | 코드가 응답의 "roles"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0250-story-factory.js buildNewGameDraft | 코드가 응답의 "sub"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0250-story-factory.js buildNewGameDraft | 코드가 응답의 "terms"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0250-story-factory.js buildNewGameDraft | 코드가 응답의 "theme"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0250-story-factory.js buildNewGameDraft | 코드가 응답의 "title"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 요구하지 않은 키 읽을 수 있음 | 0250-story-factory.js buildNewGameDraft | 코드가 응답의 "world"를 읽을 수 있는데 이 프롬프트에 그 키가 없음(정적 추정 — 다른 모드의 키일 수 있음) |
| 형식 견본 뒤 글 | 0250-story-factory.js buildNewGameDraft | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 1 요새의 둥지] [음악: 일상] [리벳항 부두] 폭풍이 지나간 아침.」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 2 징발 명령서] [음악: 일상] [요새 집무실] 먼지를 털어 낸 집무」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 3 등대섬의 관측사] [음악: 설렘] [비행선 갑판] [효과음: 알림]」 |
| 형식 견본 뒤 글 | 0530-story-memory.js smExtract | 견본 뒤에 「[대본] [스테이지 4 잿빛 아가리] [음악: 긴장] [폭풍권 하늘] [효과: 강한흔들림]」 |
| 형식 견본 뒤 글 | 0510-actions/100-images-and-assets.js handleImagesAndAssetsAction | 견본 뒤에 「다른 설명이나 코드 블록 없이 JSON만 출력한다. 문자열 값 안에서 따옴표가 필요하면 큰」 |

## 실행으로 안 닿은 요청 지점 (44)

| 지점 | 위치 | 갈래 |
|---|---|---|
| 0015-prompt-studio/010-studio.js (최상위 문장) | src/main/0015-prompt-studio/010-studio.js:363 | 2 |
| 0030-character-regen.js regenRun | src/main/0030-character-regen.js:48 | 6 |
| 0030-character-regen.js requestUltimateScene | src/main/0030-character-regen.js:116 | 7 |
| 0030-character-regen.js illustrationScenePreparation | src/main/0030-character-regen.js:141 | 7 |
| 0135-schedule.js spotTalkAI | src/main/0135-schedule.js:23 | 25 |
| 0160-free-chat.js fcSend | src/main/0160-free-chat.js:46 | 41 |
| 0160-free-chat.js fcSummarize | src/main/0160-free-chat.js:67 | 0 |
| 0200-skin-shop.js skinAuto | src/main/0200-skin-shop.js:16 | 7 |
| 0250-story-factory.js buildNewGameDraft#2 | src/main/0250-story-factory.js:248 | 22 |
| 0250-story-factory.js buildNewGameDraft#3 | src/main/0250-story-factory.js:255 | 8 |
| 0250-story-factory.js buildNewGameDraft#4 | src/main/0250-story-factory.js:261 | 0 |
| 0250-story-factory.js buildNewGameDraft#5 | src/main/0250-story-factory.js:270 | 29 |
| 0250-story-factory.js buildNewGameDraft#6 | src/main/0250-story-factory.js:273 | 32 |
| 0260-new-game-draft.js drPolish | src/main/0260-new-game-draft.js:142 | 9 |
| 0260-new-game-draft.js drFillChar | src/main/0260-new-game-draft.js:161 | 6 |
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
| 0530-story-memory.js smExtract#2 | src/main/0530-story-memory.js:15 | 0 |
| 0530-story-memory.js smExtract#3 | src/main/0530-story-memory.js:16 | 0 |
| 0530-story-memory.js smExtract#4 | src/main/0530-story-memory.js:17 | 0 |
| 0535-content-audit.js auditAIFill | src/main/0535-content-audit.js:59 | 27 |
| modules/combat/050-bridge.js v2GenerateSkills | src/modules/combat/050-bridge.js:288 | 3 |
| modules/combat/050-bridge.js v2ConceptPrompt | src/modules/combat/050-bridge.js:361 | 0 |
| modules/combat/060-generation.js v2ResolvePalette | src/modules/combat/060-generation.js:121 | 2 |
| modules/combat/060-generation.js v2GenerateSelected | src/modules/combat/060-generation.js:159 | 3 |
| modules/combat/060-generation.js v2GenerateSelected#2 | src/modules/combat/060-generation.js:186 | 4 |
| modules/combat/070-equipment.js v2GearGenerate | src/modules/combat/070-equipment.js:73 | 0 |
| 그림 0030-character-regen.js naiDraw#2 | src/main/0030-character-regen.js:176 | 1 |
| 그림 0180-ui-scroll.js openNaiGen | src/main/0180-ui-scroll.js:472 | 0 |
| 그림 0260-new-game-draft.js faceDrawOne | src/main/0260-new-game-draft.js:223 | 1 |

## 흐름 오류 (456)

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

## 기준(6f687b4)과 다른 프롬프트 (0)

| 게임|상황|흐름|주인|순번 | 기준 | 지금 | 처음 다른 곳 |
|---|---|---|---|

## 못 본 갈래 (지점별 앞 8개)

- 0030-character-regen.js weaponPromptAI: `x.cur`()
- 0135-schedule.js spotsAI: `tone`(참 못 봄) · `w.source`() · `side`() · `storyCfg().plot`() · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`() · `c.alt&&charById(c.alt)`(참 못 봄)
- 0185-game-rules.js rulesAIData: `tone`(참 못 봄) · `w.source`() · `side`() · `storyCfg().plot`() · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`() · `c.alt&&charById(c.alt)`(참 못 봄)
- 0185-game-rules.js rulesPosAI: `tone`(참 못 봄) · `w.source`() · `side`() · `storyCfg().plot`() · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`() · `c.alt&&charById(c.alt)`(참 못 봄)
- 0250-story-factory.js aiChapterGen0: `deep`() · `deep`( 거짓 못 봄) · `deep`() · `deep`() · `deep`() · `tone`(참 못 봄) · `w.source`() · `side`()
- 0250-story-factory.js aiEventGen0: `deep`() · `deep`( 거짓 못 봄) · `deep`() · `ncN`(참 못 봄) · `deep`() · `deep`() · `tone`(참 못 봄) · `w.source`()
- 0250-story-factory.js buildNewGameDraft: `auto`() · `heroBlank`() · `hero.call`(참 못 봄) · `String(draft.crewTerm||'').trim()`(참 못 봄) · `!DT&&(hero.name||hero.gender||hero.look||hero.bio)`(참 못 봄) · `없으면: hero.name`( 거짓 못 봄) · `userTitle`(참 못 봄) · `th==='auto'`()
- 0250-story-factory.js ensureLibPrompts: `w.source`() · `side`() · `storyCfg().plot`() · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`() · `c.alt&&charById(c.alt)`(참 못 봄) · `G.chars.some(c=>c.alt&&!c.altCanon)`(참 못 봄)
- 0250-story-factory.js writeStages: `o.plan`() · `prevTail`() · `s.story`(참 못 봄) · `s.mode`() · `i===n-1`() · `tone`(참 못 봄) · `w.source`() · `side`()
- 0260-new-game-draft.js drHarmony: `!d.tone`( 거짓 못 봄) · `dupTxt(d.kw,d.tone)`(참 못 봄) · `d.fan&&d.src`(참 못 봄) · `(d.setting.trim())`(참 못 봄) · `(d.story.trim())`(참 못 봄) · `(cs.length)`(참 못 봄) · `(hr.name||hr.call||hr.gender||hr.look||hr.bio)`() · `없으면: hr.call`( 거짓 못 봄)
- 0260-new-game-draft.js drPolishHero: `L.length`(참 못 봄) · `(skip!=='setting'&&d.setting.trim())`(참 못 봄) · `(skip!=='story'&&d.story.trim())`(참 못 봄) · `(skip!=='hero'&&(hr.name||hr.call||hr.gender||hr.look||hr.bio))`(참 못 봄) · `x.startsWith('2차 창작')`(참 못 봄) · `d.fan&&d.src`(참 못 봄)
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
- 0510-actions/120-messenger.js handleMessengerAction: `hint`( 거짓 못 봄) · `tone`(참 못 봄) · `w.source`() · `side`() · `storyCfg().plot`() · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`()
- 0530-story-memory.js storyWrapUp: `tone`(참 못 봄) · `(t&&!/^(정하지 ?않음|없음|모름|비밀)$/.test(t))`(참 못 봄) · `k==='m'`( 거짓 못 봄) · `k==='mix'`(참 못 봄) · `bio`(참 못 봄)
- 0535-content-audit.js auditAIStage: `tone`(참 못 봄) · `w.source`() · `side`() · `storyCfg().plot`() · `bib`(참 못 봄) · `side`(참 못 봄 거짓 못 봄) · `side`() · `c.alt&&charById(c.alt)`(참 못 봄)
- 그림 0030-character-regen.js naiDraw: `(m&&String(m.artTags||'').trim())`(참 못 봄)
