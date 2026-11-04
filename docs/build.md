# 소스 구조와 빌드

TiddlyWiki처럼 **배포물은 HTML 하나**이고, 개발은 파트·모듈 파일로 나눠서 합니다. `build/`는 Node 기본 모듈만 써서 의존성 설치(`npm install`)가 필요 없습니다(Node 18+).

```bash
node build/build.mjs          # src/ → www/index.html, version.json의 build·sha256 맞춤 (스크립트 블록마다 JS 구문 검사 — 오류면 빌드 안 함, 오류 줄의 src 파일 표시)
```

```bash
node build/build.mjs --check  # www/index.html이 src와 같은지 확인 (다르면 exit 1)
```

```bash
node build/test.mjs           # 검증: 동일성 · 왕복 · 모듈 추가/수정 · 브라우저 실행
```

```bash
python3 pc/test_store.py     # PC 서버 data 폴더 저장 검사
```

```bash
node build/split.mjs [upstream.html] [출력 폴더]   # 단일 HTML → src (원본 업데이트 가져오기). 폴더가 있으면 --force 필요
```

```bash
node build/compare.mjs [git참조|html]   # 원본(기본 13a3fe9 = jjhk0803 2026.10.24.1) 대비 더한·뺀·바뀐 모듈 목록
```

## 1. `src/` 구조

```
src/
├ index.html            HTML 뼈대 + 포함 지시어(아래 §2). 고정 DOM은 여기서 고침
├ boot/
│ ├ head.js             <head> 부트: BUILT(=APP_BUILD), REQUIRED_APK, 구형 환경 라이브 패치
│ ├ durable-storage.js  GGMStorage (즉시 실행)
│ └ storage-boot.js     부팅: 저장소 init → 모듈 → main 실행 (즉시 실행, 문서 맨 끝)
├ style/                CSS. /* ===== 제목 ===== */ 마다 파일 하나(0010-base … 0160-card-battle). 번호 순서 = cascade 순서
├ modules/              지연 실행 모듈. 파일 하나 = <script type="text/ggm-module" id="ggm-<폴더>-<이름>">
│ ├ app/010-confirm.js           → id ggm-app-confirm
│ └ combat/010-catalog.js … 090-practice.js  → ggm-combat-catalog … (전투 v2)
└ main/                 앱 본체 ggm-main. 파일 이름순으로 이어 붙여 <script> 하나가 됨
  ├ 0010-rules.js  0020-ai-connect.js  …  0500-gacha.js  0520-backup-storage.js  0525-data-folder.js  …  0570-modal-nav.js
  ├ 0015-prompt-studio/ · 0030-image/ · 0260-new-game/ · 0360-sync/   폴더 모듈(한 기능을 여러 파일로 — 폴더 전체가 모듈 하나): 프롬프트 스튜디오 · 그림(엔진·화면·후보) · 새 게임(초안·만들기) · 동기화(공통·PC 서버·GitHub·시작 시 받기·한 기기 플레이)
  └ 0510-actions/        클릭 액션: 010-setup.js … 120-messenger.js (handle*Action 하나씩), 130-dispatch.js(APP_ACTION_HANDLERS·전역 리스너)
```

`main/` 파일과 원래 섹션의 대응은 [architecture.md §2 섹션 지도](architecture.md#ggm-main-섹션-지도)와 같습니다(파일 이름은 `build/split.mjs`의 `NAMES` 표).

## 2. 템플릿 지시어 (`src/index.html`)

지시어는 **한 줄 전체**를 차지해야 합니다.

| 지시어 | 결과 |
|---|---|
| `<!--@ boot/head.js -->` | 파일 내용을 그 자리에 넣음 |
| `<!--@ main/ -->` | 폴더 안 파일을 **이름순**으로 이어 붙임. 하위 폴더도 그 자리에서 이름순으로(예: `main/0510-actions/` 는 `0500-gacha.js` 다음) |
| `<!--@modules modules/combat/ ggm-combat- -->` | 폴더 안 파일마다 `<script type="text/ggm-module" id="ggm-combat-<이름>">…</script>` 생성. 이름 = 파일명에서 `숫자-`와 `.js`를 뺀 것 |

모든 소스 파일은 줄바꿈(`\n`)으로 끝나야 합니다(아니면 빌드 오류). CRLF는 쓰지 마세요(`.gitattributes`가 LF로 고정).

## 3. 실행 순서와 스코프 (모듈을 넣을 때 알아야 할 것)

1. `boot/head.js` → `boot/durable-storage.js` 즉시 실행
2. `boot/storage-boot.js`가 저장소를 연 뒤 **`modules/` 블록을 문서 순서대로**, 마지막에 **`main/` 전체**를 실행
3. `main/` 파일들은 **하나의 `<script>`** 로 합쳐지므로 `let`/`const`/`function`을 서로 그대로 공유합니다(파일 경계는 의미가 없음). 그래서 순서가 중요합니다: 최상위에서 **즉시 실행되는** 코드는 앞 파일에서 정의된 것만 쓸 수 있고, 함수 안에서 쓰는 건 어디에 정의돼도 됩니다.
4. `modules/` 파일은 **각각 별도 `<script>`** 입니다. 여기서 선언한 `function`·`var`는 전역이 되어 main에서 보이고, `let`/`const`도 전역 렉시컬 스코프로 공유됩니다. 단, main보다 **먼저** 실행되므로 최상위에서 `G`, `render` 같은 main의 것을 바로 쓰면 안 됩니다(이벤트 리스너·함수 안에서만).
5. `modules/combat/010~030`(catalog, visual-catalog, core)은 Web Worker에서도 그대로 돌기 때문에 DOM·앱 전역을 참조하면 안 됩니다.

## 4. 모듈·기능 추가 방법

| 하려는 것 | 방법 |
|---|---|
| 앱 본체 기능 추가 | 새 파일이 아니라 그 기능이 속한 모듈 안에(사용자 지시 — 모듈을 분류 없이 늘리지 않음). 속할 모듈은 연관 맵의 기능 표면(`docs/map.md` 2절: 메뉴 → 화면·패널·창 → 얽힌 모듈)과 모듈 판정(3절)에서 그 기능 단위의 고유 모듈. 새 모듈(`src/main/`의 번호 파일 — 예: `0545-my-feature.js`는 `0540-start.js`와 `0550-standalone-app.js` 사이, 번호를 10 단위로 띄워 둔 이유)은 도구가 새 기능 단위로 판정할 때만. 고친 뒤 `node tools/map.mjs --strict`(조각·흩어짐·슈퍼가 늘면 실패) |
| 독립 모듈 추가 (먼저 실행, 자체 클릭 리스너 등) | `src/modules/app/020-my-module.js` → `id="ggm-app-my-module"`로 자동 등록·실행 |
| 새 모듈 묶음 | `src/modules/<묶음>/` 폴더를 만들고 `src/index.html`에 `<!--@modules modules/<묶음>/ ggm-<묶음>- -->` 한 줄 추가 |
| 기존 섹션 수정 | 해당 `src/main/*.js` 파일 수정 |
| 큰 섹션 쪼개기 | 파일을 두 개로 자르고 번호만 이어지게(내용 순서 유지) |
| CSS 나누기 | `style/` 폴더에 여러 파일로 나누고 템플릿을 `<!--@ style/ -->`로 |

추가 후 `node build/build.mjs` → 로컬 실행(`cd www && python3 -m http.server 8000`)으로 확인 → `node build/test.mjs`(1번은 src와 www가 맞는지, 4번은 앱이 오류 없이 뜨는지 확인).

**`www/index.html`은 손으로 고치지 마세요.** 다음 빌드 때 덮어씁니다. `src`와 `www`를 같이 커밋하세요(배포·APK 라이브 패치는 `www/index.html`을 받습니다).

## 5. 릴리스

1. `src/boot/head.js`의 `BUILT` 올리기 (필요하면 `REQUIRED_APK`)
2. `node build/build.mjs` → `version.json`의 `build`·`sha256`이 자동으로 맞춰짐
3. `version.json`의 `notes`, `at`, `apk` 손으로 수정 → 커밋·푸시
4. PC 서버(`pc/`)를 고쳤다면 `SERVER_VER`를 올리고 `pc/README.txt`에 바뀐 점과 버전을 적은 뒤 배포 zip을 다시 묶기:

```bash
node build/build.mjs --zip
```

5. `node build/build.mjs --check`로 배포본 점검: `www/index.html` = src 빌드, `version.json`의 build·sha256 = `www/index.html`, `gacha-game-maker-pc.zip` = `pc/`의 실행 파일 4개(원본 배포 zip과 같은 구성), `pc/README.txt`에 서버 버전.

배포본의 구성은 원본과 같아요: zip에는 실행 파일(`ggm-server.py`·`start.sh`·`PC서버-시작.bat`)과 안내(`README.txt`)만 있고, 앱(`www/` — 빌드된 `index.html` 등)은 서버를 켤 때 GitHub(`GGM_REPO`·`GGM_BRANCH`, 기본 이 포크의 main)에서 받아요. 그래서 작업 브랜치의 빌드는 main에 합쳐야 배포본이 받아요.

## 6. 원본(upstream) 새 릴리스 가져오기

원본은 단일 `www/index.html`로 배포됩니다.

```bash
git fetch upstream && git show upstream/main:www/index.html > /tmp/upstream.html
```

```bash
node build/split.mjs /tmp/upstream.html /tmp/upstream-src && diff -ru src /tmp/upstream-src
```

`node build/compare.mjs /tmp/upstream.html`로 원본에서 바뀐 모듈을 먼저 보고, 내 수정이 없는 파트는 그대로 복사하고, 겹치는 파트만 손으로 합칩니다. 큰 섹션을 폴더로 나누는 규칙은 `split.mjs`의 `SUBSPLIT`에 있어요. 원본에 새 섹션 제목이 생기면 `main/NNNN-part.js`로 나오니 `build/split.mjs`의 `NAMES`에 이름을 추가하세요.

## 7. 검증 (`build/test.mjs`, GitHub Actions `check`에서도 실행)

| # | 확인 내용 |
|---|---|
| 1 | `src` 빌드 결과 == `www/index.html` (바이트 단위) |
| 2 | `split` → `build` 왕복이 원본과 동일 |
| 2b | **원본 커밋(13a3fe9 = jjhk0803 2026.10.24.1)** 도 나눴다 합치면 바이트 단위로 같음 |
| 3 | 임시 복사본에 `modules/app/020-hello.js`, `main/0545-hello.js` 추가와 기존 파일 수정 → 빌드 결과에서 제 순서 |
| 4 | 그 결과를 Chromium(Playwright)으로 실행 → 추가 모듈·파트·수정 코드 실행, 앱 화면 렌더링, 페이지 오류 0 (Playwright가 없으면 건너뜀) |
| 5 | 실제 빌드에서 데이터 폴더 zip 내보내기 → 다시 읽으면 같은 내용 → 새 게임으로 가져오기(그림 포함) |
| 6 | 실제 PC 서버를 켜고 앱에서 저장 → `data/main/*.json` 자동 동기화, 빈 브라우저는 서버에서 게임을 받아 옴 (python3 없으면 건너뜀) |
| 33 | 배포본: `gacha-game-maker-pc.zip`을 빈 폴더에 풀고 `start.sh`로 켜면 받는 곳(GitHub raw 자리에 로컬 서버 — `GGM_RAW`)에서 빌드된 `www`를 받아 띄우고, 브라우저에서 그 빌드가 돎(앱 빌드 = `version.json`, 서버 버전 = `SERVER_VER`) |

`pc/test_store.py`: 나눠 저장·합쳐 받기 동일성, 바뀐 종류만 쓰기, 409 충돌, 삭제 게임 보존, 예전 `state.json` 이전.
