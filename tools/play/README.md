# tools/play — 생성기 동적 분석(실제 앱에 데이터를 넣어 반응 보기)

이 프로젝트는 **게임 생성기**(`www/index.html` SPA)이고, 게임은 사용자가 자기 AI로 생성합니다(`CLAUDE.md` §0). `tools/play`는 그 생성기와 생성 결과를 **실제 앱 코드로 돌려 분석**하는 도구입니다. 정적 분석(`tools/check.mjs`·`tools/wiring.mjs`)이 소스·생성물을 파서로 맞춰 본다면, 여기서는 실제 데이터를 넣어 반응을 봅니다.

- 글 AI 요청만 가로채 **기록된 응답(데이터)으로 답합니다**. 같은 응답을 다른 빌드에 넣어 생성 결과를 비교할 수 있습니다(`regress.mjs`).
- 저장은 앱 흐름 그대로입니다: 실제 PC 서버(`pc/ggm-server.py`)를 `pc/`(`PC서버-시작.bat`과 같은 경로)에서 켜고, 게임은 `pc/data/<게임id>/<종류>.json`, 브라우저 IndexedDB는 캐시(빈 브라우저가 서버 data에서 받아 오고 앱의 `pcPush`로 다시 씀). 분석에 쓰는 게임 데이터는 `pc/data/`에 커밋돼 있습니다(서버 상태 `pc/ggm-data/state.json` 포함, 나머지 `pc/www/`·키·blobs는 git에서 뺌).
- 브라우저(playwright)와 python3가 필요합니다. 없으면 `test.mjs`는 건너뜁니다(CI).

## 명령

```bash
node tools/play/generate.mjs <게임 폴더> new        # input.json의 입력으로 앱의 새 게임 생성 경로를 돌림(답이 없는 요청은 prompts/에 내놓고 멈춤) → pc/data/<id>
node tools/play/generate.mjs <게임 폴더> skills     # 그 게임에서 스킬이 임시(기본) 상태인 대원의 스킬 설계
node tools/play/generate.mjs <게임 폴더> chapter [--stages 4] [--dir "지시"]   # 다음 메인 장
node tools/play/generate.mjs <게임 폴더> import <게임.json>   # 게임 파일을 앱의 데이터 폴더 가져오기로 pc/data에 추가
node tools/play/qa.mjs <게임 폴더>                  # 그 폴더의 게임(pc/data)을 QA·플레이 점검 → qa/game.md · .json
node tools/play/shots.mjs <게임 폴더>               # 새 플레이어로 화면 플레이·캡처 → shots/
node tools/play/regress.mjs [--ref <git 기준>] [게임 폴더…]   # 같은 응답을 기준 빌드와 지금 빌드에 넣어 새 게임 생성 결과 비교 → reports/regress.md
node tools/play/faults.mjs [시나리오…]              # 생성기 실패 주입 → reports/faults.md
node tools/play/prompts.mjs <게임 폴더…>            # 생성 프롬프트 점검(스튜디오 조각 비율·되풀이·충돌·샘플 이름) → reports/prompts.md
node tools/play/test.mjs                           # 도구 자체 검사(fixtures/mini)
node tools/play/rekind.mjs <게임 폴더> [--dry]       # kind 규칙이 바뀌었을 때 prompts/·responses/ 이름 옮기기
```

## 게임 폴더

| 파일 | 내용 | 커밋 |
|---|---|---|
| `input.json` | 새 게임 입력. 초안 화면의 자율 모드와 같은 형식 `{"mode":"auto","auto":"한 줄 아이디어","n":6}` | 예 |
| `prompts/<kind>.txt` | 앱이 글 AI에 보낸 글(지침·교훈·"JSON만 출력"까지 붙은 최종본) | 예 — 프롬프트 품질을 볼 근거 |
| `responses/<kind>.txt` | 그 요청에 대한 답(모델이 낸 글 그대로) | 예 — 재생에 필요 |
| (게임 데이터) | 이 폴더의 게임은 `pc/data/<게임id>/` — 게임 id는 `runs.json`의 마지막 `saved.gid`. `skills`·`chapter`는 대기 중 요청이 없을 때만 저장(반쯤 된 장을 저장하면 다음 실행이 그다음 장을 만들기 시작함) | `pc/data`에 |
| `runs.json` | 실행 기록: 호출 순서·길이·대기 중 요청·저장 시점·저장한 게임 id·알림·AI 기록 | 예 |
| `regress/` | 회귀 재생 때 앱이 보낸 프롬프트·QA(지금 빌드) | 예 |
| `qa/` · `shots/` | QA 보고서·화면 캡처 | 예 |

**kind** — `world` · `chars` · `opening` · `chapter1` · `skill-<대원 이름>-<그 대원의 n번째 요청>` · `<단계>-<요청 첫머리>[-s<스테이지>]-<프롬프트 전체 해시>`(규칙은 `lib/kind.mjs`). 스테이지별 대본처럼 앞부분이 같은 요청도 전체 해시로 구분됩니다. 규칙을 바꾸면 `node tools/play/rekind.mjs <게임 폴더>`로 기존 파일 이름을 옮깁니다. 끝에 `-cont1`이 붙으면 길이 초과로 끊긴 답을 이어 달라는 요청. `skill-이름-2`처럼 번호가 오르면 앱이 앞 답을 거절하고 이유를 덧붙여 다시 물은 것입니다.

## 게임 하나 만들기 (사람·에이전트가 글 AI 역할)

1. `tools/play/games/<이름>/input.json`을 만듭니다.
2. `node tools/play/generate.mjs tools/play/games/<이름> new` → 출력의 "답이 필요한 프롬프트" 파일을 **끝까지** 읽습니다(1만~4만 자).
3. 같은 이름으로 `responses/<kind>.txt`에 답을 씁니다: **JSON만**, 코드 블록·설명 없이, 프롬프트의 개수·길이·스키마를 지켜서. 앱 소스를 보고 맞추지 말고 프롬프트만 보고 답합니다(실제 모델과 같은 조건).
4. 다시 실행 → 2~3을 `"done": true`까지 되풀이. 이어서 `skills`, 필요하면 `chapter`.
5. `qa.mjs`·`shots.mjs`로 점검하고 결과를 커밋합니다.

에이전트에게 맡길 때는 위 3의 조건(프롬프트만 보고 답하기, 소스·하네스 수정 금지)과 함께 "프롬프트를 읽으며 헷갈리거나 모순된 지시를 따로 적어 달라"고 하면 프롬프트 개선 근거가 남습니다.

## QA·플레이가 보는 것 (`lib/qa.mjs`)

| 묶음 | 내용 | 발견 등급 |
|---|---|---|
| 요청 대비 결과 | 대원 수(요청의 80% 미만), SSR 수, 이름 중복, 대원 세력이 세계관 목록에 있는지 | 상·중 |
| 기본값 섞임 | 플롯·설정·세력이 기본(원본 샘플) 값 그대로, 재료 던전 이름·용어가 기본값 그대로 | 상·중·하 |
| 스킬 | 임시 상태로 저장(`skillGenerationWarning`), 기본 스킬 그대로 | 상·중 |
| 적·배너 | 적 속성이 게임 속성 목록에 없음, 픽업 대상이 없는 대원·아직 못 만난 대원 | 중 |
| 앱 자체 점검 | 콘텐츠 점검(`auditScan`)·개성 검수·시나리오 설계·세력 점수·밸런스·배경/소품 인물 태그 | 하·정보 |
| 대본 | 읽기 오류, 등록 안 된 화자, 첫 등장 위반(등장 계획), 없는 배경·음악, 영어 섞임, 1장 분량(지시: 전 15~25·후 8~15줄) | 상·중·하 |
| 건조·원정 | 생성기가 건조·원정 방식을 설정했는지, 자원 이름 기본값, 파견 보상이 시간·인원과 맞는지, (켰을 때) 대표 투입별 분류 개방·희귀도·캐릭터 확률, 건조되지 않는 대원, 원정 자원 수입 | 중·하 |
| 플레이 | 새 플레이어로 첫 10연(시드 고정) → 자동 편성 → 메인 장 전투를 레벨 1·10·20 × 시드 20으로 시뮬레이션: 첫 전투 승률 50% 미만, 레벨 20에서도 0%, 레벨 1에서 15초 안에 100%(너무 쉬움) | 상·중·하 |

검사를 늘릴 때는 `lib/qa.mjs`에 `F(등급, 영역, 내용)`을 추가하고, `fixtures/mini/responses`에 그 문제를 하나 심은 뒤 `test.mjs`에 잡히는지 확인을 넣습니다(정적 분석 도구와 같은 규칙).

## 생성한 게임

| 폴더 | 입력 | 상태 |
|---|---|---|
| `games/sky-knights` | 하늘섬 군도·몰락한 기사단 재건·폭풍의 정체(판타지 전투물), 대원 6명 + 2장(새 대원 2명) | 완료 · 글 AI: Claude 에이전트 |
| `games/idol-audition` | 신생 기획사 서바이벌 오디션(전투 대신 무대 대결·팬 투표), 대원 6명 | 완료 · 글 AI: Claude 에이전트 (`NOTES.md`) |

점검 결과의 종합과 개선 안건은 [docs/research/maker-review.md](../../docs/research/maker-review.md).

## 알려진 한계

- 글 AI 요청은 Anthropic 형식 경로만 가로챕니다(앱 설정의 공급자를 Anthropic으로 둠). 다른 공급자 고유의 파싱 차이는 보지 않습니다.
- 그림·음성·음악 AI는 부르지 않습니다(외부 요청 차단). 그림은 프롬프트 품질만 점검합니다.
- 전투는 실제 전투와 같은 방식으로 아군·적을 만들어 엔진(`GGMCombat.run`)을 돌린 시뮬레이션입니다. 출격 경로·회담·콘테스트 같은 특수 스테이지는 승률을 내지 않고 양식만 기록합니다.
- 에이전트가 쓴 답은 특정 모델 하나의 결과입니다. 사용자가 쓰는 다른 모델(작은 모델 포함)의 결과는 같은 프롬프트로 따로 받아 비교해야 합니다.
