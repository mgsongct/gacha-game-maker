# 개발 · 커스텀 가이드

## 0. 시작 전에 꼭 알아둘 것

1. **업데이트 채널은 이 포크(`mgsongct/gacha-game-maker`)로 바꿔 두었습니다(빌드 2026.11.03.1부터).** 원본 zip의 PC 서버나 예전 빌드는 원본 저장소에서 `index.html`을 받아 오므로 이 포크의 기능이 빠진 원본 앱이 뜹니다. §6 참고.
2. **라이선스 CC BY-NC-ND 4.0** (`LICENSE.md`): 개인 사용은 자유지만 **수정본 재배포·판매는 금지**입니다. 포크 커스텀은 개인 용도로 쓰고, 수정본을 공개 배포하려면 원저작자 허락을 받으세요.
3. 소스는 `src/`에 있고 `node build/build.mjs`로 `www/index.html`을 만듭니다([build.md](build.md)). 아래에서 "섹션"·"모듈"은 `src/main/*.js`, `src/modules/*/*.js` 파일을 뜻합니다.

## 1. 로컬 실행

```bash
node build/build.mjs
```

```bash
cd www && python3 -m http.server 8000
```

`http://localhost:8000/` 접속. 서비스 워커는 https에서만 등록되므로 로컬에선 캐시 문제가 없습니다.
- 라이브 패치를 무시하고 내장 빌드로 띄우기: `?builtin=1`
- AI 없이도 샘플 게임 「낙성계약」으로 대부분 기능 확인 가능
- 저장은 브라우저 IndexedDB `starfall-img`. 초기화하려면 개발자 도구 → Application → Clear site data
- 디버깅: 모든 함수·상태가 전역이므로 콘솔에서 `G`, `P()`, `render()`, `GGMCombat` 등을 바로 만질 수 있습니다

큰 파일이라 편집은 **함수 이름/섹션 주석 검색**으로 이동하세요(`grep -n "^function render" www/index.html`).

## 2. 자주 하는 커스텀

### 2.1 새 버튼 동작(액션) 추가

```js
// 1) 화면 HTML에 버튼
`<button class="btn" data-act="myact" data-id="${c.id}">내 기능</button>`

// 2) 알맞은 handle*Action의 switch에 case 추가 (예: handleCharactersAction)
case 'myact': { const c = charById(id); /* ... */ mark('c:'+c.id); render(); break; }

// 3) APP_ACTION_HANDLERS(이벤트 섹션 끝, Object.freeze 한 줄)에 등록
"myact":handleCharactersAction,
```

3)을 빠뜨리면 아무 반응이 없습니다. 액션 이름은 전체에서 유일해야 합니다(`grep -n '"myact"'`로 확인 — 전투·백업 모듈의 자체 리스너와도 겹치면 안 됨).

### 2.2 새 화면(탭) 추가

1. `function myHTML(){ return pageHead('제목','ENGLISH','lobby') + '...'; }` 작성 (렌더 섹션).
2. `render()` 안 `F` 맵에 `my:myHTML` 추가. 로비 하위 화면이면 `navTab` 맵에도 `my:'lobby'`.
3. 진입 버튼: `data-act="go" data-to="my"`.
4. 하단 탭 자체를 늘리려면 `<nav class="tabs">` 버튼 추가 + CSS 그리드 칸 수 조정.

### 2.2-1 생성 규칙을 바꿨을 때

생성 프롬프트·스키마를 바꾸면 `auditGenVer()`를 올리고, 예전 생성물을 감지·고치는 규칙을 `AUDIT_RULES`에 추가하세요([research/content-audit.md §3](research/content-audit.md#3-생성-기능이-좋아졌을-때-개발자가-할-일)). 구조가 바뀌어 불러오기가 깨지는 경우는 `fix()`에 넣습니다.

### 2.3 게임 상태에 새 필드

1. 사용하는 곳에서 그냥 읽고 쓰되, **`fix()`에 기본값**을 넣어 예전 저장본도 안전하게:
   `g.prog.myStat = g.prog.myStat || {};`
2. 형식 변경이면 `meta`에 버전 플래그를 두고 1회 변환 (`if(!g.meta.myVersion){ …; g.meta.myVersion=1; g.__curveNew=true; }`).
3. 값을 바꾼 뒤엔 반드시 `mark('prog')`(또는 해당 키). 재화가 걸린 동작은 `pull()`처럼 `await flush()` 후 결과를 보여 주는 게 안전합니다.
4. 동기화·백업·게시는 `G` 전체를 직렬화하므로 별도 작업이 필요 없습니다. 단, 게시(구독)에서 진행 데이터는 빠지므로 콘텐츠인지 진행인지에 따라 `meta/chars/...` 또는 `prog`에 두세요.

### 2.4 테마 · 브랜드

- 테마 추가: CSS에서 `:root[data-skin="tactical"]{--bg:…;--panel:…;}` 블록을 복사해 새 이름으로 변수 정의 → 테마 선택 목록(`[['tactical','택티컬'],…]` 배열, grep해서 나오는 곳 모두)에 `['이름','표시명']` 추가. `applyMeta()`가 `G.meta.theme`을 `html[data-skin]`에 적용합니다.
- 강조색: `G.meta.accent` → CSS 변수 `--acc`.
- 용어(재화·뽑기·아군 호칭 등): 코드 수정 없이 `G.meta.terms`(설정 화면). 기본값은 `DEFAULT_META.terms`, 라벨은 `TERM_LABEL`. 코드에서 화면 문구를 쓸 땐 하드코딩 대신 `T('currency')`처럼.
- 속성 3개 이름·색: `G.meta.elems` (항상 3개, 순환 상성).
- 폰트: `<head>`의 Google Fonts 링크.

### 2.5 샘플(기본) 게임 바꾸기

"기본 콘텐츠" 섹션의 `DEFAULT_META`, `DEFAULT_WORLD`, `DEFAULT_CHARS`(+`EXTRA2`), `DEFAULT_CHAPTERS`, `DEFAULT_EVENT_CHAPTER`, `DEFAULT_THREADS`, `DEFAULT_OPENING`, `DEFAULT_BANNERS`, `DEFAULT_EVENTS`, `DEFAULT_LIB`/`DEFAULT_BGM`/`DEFAULT_SFX`, `DEFAULT_PROG`.
주의: `fix()`가 `id==='sera'` 캐릭터 존재로 "샘플 게임"을 판별(`isDefaultGame`)하고, 샘플 적 외형(`ENEMY_LOOKS`)은 제목이 `DEFAULT_META.title`일 때만 씁니다. 샘플을 갈아엎으면 이 판별 조건도 같이 보세요.

### 2.6 가챠 · 밸런스

- 비용 `COST=120`, 중복 환급 `REFUND`, 교환 포인트 `SPARK=200`, 확률·천장은 `DEFAULT_PROG.settings`(게임 안 설정에서도 변경). 로직 `rollOne()`, `softRate()`.
- 시작 재화: `DEFAULT_PROG.gems`, `fix()`의 `gold` 기본값.
- 성장 비용·스탯·레벨 경험치: `GGMCombat`(`growthCost`, `levelExperience`, `limitBreakCost`, `CHARACTER_BASE_STATS`). 스테이지 난이도: `rebalanceChapter`(성장 곡선 섹션).

### 2.7 전투 · 스킬

- 효과 종류·대상·조건 추가: `ggm-combat-catalog`의 `data`(EFFECTS/TARGET/…) + `ggm-combat-core`에서 실제 처리 + `ggm-combat-effects`에 연출.
- 코어 3개 모듈(catalog, visual-catalog, core)은 Web Worker에서도 돌기 때문에 **`document`, `G`, 앱 함수 참조 금지.** UI 연결은 `ggm-combat-bridge`에서.
- 규칙을 바꾸면 `RULESET` 숫자를 올리세요. 캐릭터의 `skillBalance.ruleset`과 달라지면 `v2ReadyChars`가 밸런스를 다시 검사합니다.

### 2.8 AI 공급자 추가

1. `AITYPE`에 타입 이름, `DEFM`에 기본 모델.
2. `aiOne()`에 `if(p.type==='mytype'){ … return parseLoose(text); }` 분기 — 반드시 **파싱된 JSON 객체**를 반환하고, 실패는 `throw {code:'…', message}` 형식(`aiErrText()`가 코드를 사람 말로 바꿈).
3. 설정 화면 프로필 편집 폼(`aiProfilesHTML` 주변)에 필요한 입력칸 추가, `apValid()`에 유효성 조건.
4. 웹 버전에서 CORS가 막히는 호스트면 `proxy/worker.js`·`proxy/vercel/api/proxy.js`의 `ALLOW_HOSTS`, PC 서버도 확인.
5. OpenAI 호환 API(OpenRouter, DeepSeek, Ollama 등)라면 코드 수정 없이 `openai` 타입 + `base` URL로 충분합니다.

### 2.9 AI 프롬프트 손보기

- 전 요청 공통 규칙: `rulesText()`, `castRule()`, `TITLE_RULE`, `NAI_CHAR`, `BATTLE_FLOW`, `JSON_STRICT`.
- 게임 맥락 주입: `ctx(side, focus)`.
- 기능별 프롬프트는 각 기능 함수 안에 템플릿 문자열로 있음(`aiJSON(`을 grep).
- 생성된 프롬프트·응답은 설정의 **AI 기록**(`AILOG`)에서 확인 가능 — 프롬프트 디버깅에 유용.

## 3. 안전장치 (건드릴 때 주의)

- 저장: `GGMStorage`의 비교 후 쓰기, `storage_conflict`, `NEW_GAME_SOURCE` 중 저장 차단, `__NOFLUSH`. 우회하지 마세요 — 다른 탭/기기의 데이터 덮어쓰기를 막는 장치입니다.
- 실패 시 초기화 금지: 로드 실패하면 데이터를 지우지 않고 중단하는 것이 일관된 원칙입니다.
- 콘텐츠 안전: 성인 캐릭터 규칙(나이 ≥ 20 강제, `MINOR_TAGS`/`AGE_TAGS` 필터, `rulesText`의 "등장인물은 모두 성인"). 유지하세요.
- XSS: HTML 문자열 렌더링이라 AI/사용자 텍스트는 `esc()` 필수. 색상은 `HEXC` 검사, id는 `safeIds`.
- API 키: 기기 설정(localStorage)에만 두고 게임 데이터·게시물에 넣지 않습니다.

## 4. 웹 배포 (GitHub Pages)

저장소 Settings → Pages → Branch `main`, `/ (root)`. 루트 `index.html`이 `www/`로 보냅니다. 주소: `https://mgsongct.github.io/gacha-game-maker/`.

## 5. 릴리스 절차 (원본의 방식)

1. `www/index.html` `<head>` 스크립트의 `BUILT='YYYY.MM.DD.N'` 올리기 (이 값이 `APP_BUILD`). 셸(APK) 변경이 필요한 변경이면 `REQUIRED_APK`도.
2. 서비스 워커 캐시를 갈아야 하면 `www/sw.js`의 `CACHE` 이름 변경.
3. `version.json` 갱신:
   ```json
   { "build": "<BUILT와 동일>", "notes": ["변경점"], "html": "www/index.html",
     "sha256": "<sha256sum www/index.html>", "apk": {"build": "...", "minShell": "...", "url": "..."},
     "notice": null, "at": "<ISO 시각>" }
   ```
   ```bash
   sha256sum www/index.html
   ```
   `build`와 HTML의 `BUILT`가 다르거나 해시가 틀리면 앱이 업데이트를 거부합니다.
4. `notice: {id, title, body}`를 넣으면 앱 우편함으로 공지가 갑니다.

## 6. 포크용 설정 (적용됨)

| 위치 | 값 | 영향 |
|---|---|---|
| `src/main/0420-app-update.js` `RELEASE_REPO` | `mgsongct/gacha-game-maker` | 앱 업데이트·웹 업데이트 알림이 읽는 `version.json`. 원본으로 두면 앱이 원본 빌드로 덮어씀. 예전 원본 저장소(`starfall-contract`)로 가는 폴백은 제거 |
| `pc/ggm-server.py` `REPO`·`BRANCH` (`GGM_REPO`·`GGM_BRANCH`) | `mgsongct/gacha-game-maker` · `main` | PC 서버가 켤 때 받는 `www/`. 서버 창에 `앱 빌드: …`가 나와서 어느 앱이 떴는지 확인 가능. `--no-update`는 받지 않고 로컬 `www/` 사용 |
| `proxy/worker.js` `ALLOW_ORIGIN`, `proxy/vercel` 기본값 | `https://mgsongct.github.io` | 다른 출처에서는 중계 서버가 403 |
| 부팅 실패 화면·설정 화면의 APK 링크, `version.json`의 `apk.url` | 원본 Releases (유지) | APK 설치 파일은 원본에만 있어요 |
| 저작권·공식 배포처 표기 | 원본 (유지) | 라이선스상 유지 |
| 앱 설정 → 앱 업데이트에서 저장소 지정(`LV().repo`) | – | 코드 수정 없이 기기별로 채널 변경 가능 |

**주의**: PC 서버와 앱은 이 포크의 **`main` 브랜치**에서 받습니다. PR을 머지하기 전에는 `main`이 아직 원본과 같으므로, 미리 써 보려면 `GGM_BRANCH=<브랜치>`로 켜거나 직접 빌드한 `www/`를 `pc/www/`에 두고 `--no-update`로 켜세요.

APK 셸은 원본 것을 그대로 쓰게 되며, 셸이 부팅 시 라이브 패치로 위 채널의 HTML을 실행합니다. 셸 자체(Capacitor 프로젝트)는 이 저장소에 없습니다.
