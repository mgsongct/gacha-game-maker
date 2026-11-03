# 프롬프트 현황 조사 · 프롬프트 스튜디오

## 1. 현황 조사 (변경 전)

| 항목 | 상태 |
|---|---|
| 호출 지점 | `aiJSON(` 63곳. 많은 곳: `0250-story-factory` 9, `0510-actions/020-navigation` 8, `090-characters` 5, `040-story`·`0455-persona`·`0260-new-game-draft` 4 |
| 공통 조각 | `RULES`·`SCRIPT_FMT`·`THREAD_FMT`(게터), `NAI_CHAR`·`TITLE_RULE`·`BATTLE_FLOW`·`EXPLORATION_NAME_RULE`(0010), `JSON_STRICT`(0020), `POS_RULE`(0185) — 상수라 **게임마다 고칠 수 없음**, 어디 있는지 한눈에 볼 곳이 없음 |
| 나머지 | 대부분 호출 지점마다 문장으로 직접 씀(배경 "no humans, scenery로 시작", 소품 "no humans, object focus로 시작" 등) |
| 사용자 지침 | 글 AI 지침(상단·중단·하단·그림 태그, 프리셋) — 모든 요청에 같은 글을 끼우는 기능만 있음 |
| 그림 태그 검증 | 무기만 `wpBad`로 검사. **배경·소품은 지시만 하고 검증하지 않음** → 성능 낮은 AI가 `1girl, long hair…`를 섞으면 그대로 그려 사람 그림이 됨 |
| 실패 기록 | `AILOG`(최근 40건)는 볼 수만 있고 단계별 통계가 없음. 고친 내용이 다음 요청에 남지 않아 **같은 실수가 반복** |

## 2. 이 앱의 결정 (`src/main/0025-prompt-studio.js`)

### 조각 등록·관리
- `pfDef(id,label,get)`로 등록 → `window[id]`가 `promptFrag(id)`를 돌려줌. 호출 지점 코드는 그대로(`${NAI_CHAR}` 등)
- 게임별 `G.meta.prompts[id]={text(덮어쓰기), add(덧붙이기)}`. 비우면 기본
- AI로 다듬기: 쌓인 교훈과 최근 실패를 근거로 "성능이 낮은 AI도 오해 없이" 다듬은 제안 → 덮어쓰기 칸에 넣고 사람이 저장

### 그림 가드 (정정)
- `imgGuard(kind,tags)`: 배경·지도(`no humans, scenery`), 소품·아이콘·무기(`no humans, object focus`)에서 인물 태그(인원수·solo·머리·눈·표정·자세·구도·신체, 배경은 의상까지)를 빼고 머리말을 붙임. 소품은 옷·장신구 자체가 소품일 수 있어 의상 태그는 남김
- `composeNai`에서 그릴 때마다 실행(저장된 프롬프트가 틀려도 사람이 안 나옴)
- 저장된 프롬프트 정리: 스튜디오 → 그림 점검(모두 정리·되돌리기), 콘텐츠 점검 규칙 `l_imgperson`

### 교훈 (자산화 → 반복 방지)
- `ggm-plessons`(appStorage, 전체 공통 — 실수는 게임보다 AI 모델의 버릇이라서)
- 가드가 태그를 걸러 낼 때마다 해당 교훈(`img-person-bg` 등)이 생기거나 횟수가 오름
- 사용자 교훈 추가(그림 요청 / 모든 요청), 켜기·끄기·삭제
- `llmWrap`이 `JSON만 출력` 앞에 끼움: 그림 태그 요청(`TAG_REQ`)이면 `IMG_GUIDE` + 그림 교훈, 모든 요청에 '전체' 교훈

### AI 기록 분석
- 단계별 요청·실패 수, 잦은 오류 → 어느 조각을 고칠지 판단

## 3. 흐름

```
생성 요청 → llmWrap(지침 + 그림 가이드 + 교훈) → AI → 결과 저장
그릴 때 composeNai → imgGuard(사람 태그 제거) → 걸러 냈으면 plHit(교훈 +1)
스튜디오: 조각 수정 / 그림 점검 정리(교훈 기록) / 교훈 관리 / 실패 통계
```

## 4. 확장 아이디어

- 호출 지점의 인라인 문장(배경·소품·CG 지시)도 조각으로 옮기기 — 지금은 IMG_GUIDE가 공통 규칙을 덧씌움
- 적 그림: 사람형이 아닌 적(몬스터)을 구분해 인물 태그 정리
- 조각별 A/B 비교(같은 입력으로 두 버전 생성)

## 5. 출처

- NovelAI 태그 문서(`no humans`, `scenery`, `object focus`)와 Danbooru 태그 규칙
