# 아키텍처

## 1. 저장소 구성

| 경로 | 역할 |
|---|---|
| `index.html` (루트) | GitHub Pages 진입점. `www/`로 meta refresh 리다이렉트만 함 |
| `src/` | **소스**: 템플릿 `index.html`, `boot/`, `style/`, `modules/`, `main/` ([build.md](build.md)) |
| `build/` | `build.mjs`(합치기), `split.mjs`(단일 HTML → src), `test.mjs`(검증) |
| `www/index.html` | **빌드 결과물 = 앱 전체** (HTML+CSS+JS 단일 파일) |
| `www/sw.js` | 서비스 워커. 같은 출처는 network-first + 캐시 폴백, Google Fonts는 cache-first. `api.anthropic.com`은 건드리지 않음 |
| `www/manifest.webmanifest`, `www/icons/` | PWA(홈 화면 추가) 설정 |
| `version.json` | 업데이트 채널 매니페스트. 앱이 GitHub raw에서 읽어 새 빌드 여부·`sha256`·필요 APK 버전을 판단 |
| `proxy/worker.js` | Cloudflare Workers용 CORS 중계 서버(웹 버전용) |
| `proxy/vercel/` | 같은 중계 서버의 Vercel 판(`api/proxy.js`) |
| `gacha-game-maker-pc.zip` | PC 서버(`ggm-server.py` 등). 압축 안에만 있음 |
| `.nojekyll` | GitHub Pages에서 Jekyll 처리 끔 |

`www/index.html`은 **`src/`에서 빌드되는 결과물**입니다([build.md](build.md)). 직접 고치지 말고 `src/`를 고친 뒤 `node build/build.mjs`. 안드로이드 APK(Capacitor 셸)는 이 저장소에 소스가 없고 Releases로만 배포됩니다.

## 2. `www/index.html` 내부 구조

| 줄(대략) | 블록 | 실행 시점 | 내용 |
|---|---|---|---|
| 5–24 | `<head>` 인라인 스크립트 | 즉시 | `APP_BUILD`(=`BUILT`), `__REQUIRED_APK__` 설정. IndexedDB 없는 구형 환경에서만 localStorage의 라이브 패치 HTML로 `document.write` 교체 |
| 38–1959 | `<style>` | – | 전체 CSS. 테마는 `html[data-skin=tactical|fantasy|neon|noir|pastel]`, 강조색은 `--acc` |
| 1961–1985 | 고정 DOM | – | 아래 §3 |
| 1987–2006 | `ggm-app-confirm` | 지연 | `appConfirm(msg)` → Promise<boolean> 테마 확인창 |
| 2008–4254 | `COMBAT_V2_BUNDLE` (9개 모듈) | 지연 | 전투 v2. [modules.md §6](modules.md#6-전투-v2-combat_v2_bundle) |
| 4256–4305 | `ggm-durable-storage` | 즉시 | `GGMStorage.create()` 정의 |
| 4306–12793 | `ggm-main` | 지연 | 앱 본체 |
| 12794–12830 | `ggm-storage-boot` | 즉시 | 부팅 오케스트레이터 |

"지연"은 `type="text/ggm-module"` / `type="text/ggm-main"`이라 브라우저가 실행하지 않고, `ggm-storage-boot`가 저장소 준비 후 같은 내용의 진짜 `<script>`로 바꿔 끼워 실행한다는 뜻입니다. 순서는 **문서 순서대로 모듈들 → ggm-main**.

### `ggm-main` 섹션 지도

섹션 주석으로 검색하세요(`/* =====` 또는 `   섹션명`).

| 줄(대략) | 섹션 | 핵심 심볼 |
|---|---|---|
| 4307 | 규칙과 형식 | `rulesText()`, `castRule`, 상수 `ROLE/KIND/ELEMS/RL/COST/VER/DEFAULT_META/TERM_LABEL`, `T(k)`, `applyMeta()` |
| 4363 | AI 연결 | `AIP()`(프로필), `AITYPE`, `DEFM`, `http()`, `webProxy()`, `aiOne()`, `aiCall()`, Copilot·Vertex 토큰 |
| 4624 | NovelAI · 그림체 프리셋 · 프롬프트 블록 | `naiCfg`, `naiGenerate`, `naiBlocks*`, `llmSlots` |
| 4966 | `CHARACTER_REGEN_MODULE` | 캐릭터 재생성 |
| 5303 / 5439 | 컷 툴(배경 제거) / ComfyUI | `comfyGenerate`, `imgReady()` |
| 5567 | 소리 | `SND()`, `bgm()`, `sceneBgm()`, `sfx()`, Fish Audio 음성, ElevenLabs 음악 |
| 5679 | 기본 콘텐츠 | 샘플 게임 「낙성계약」: `DEFAULT_WORLD/CHARS/CHAPTERS/THREADS/OPENING/BANNERS/EVENTS/LIB/BGM/SFX/PROG` |
| 6143 | 유틸 | `$`, `clone`, `uid`, `esc`, `P`, `charById`, `toast`, 쓰다듬기(PET) |
| 6202 | 저장 | `PJ()`, `pjKey()`, `defaults()`, `fix()`, `G`, `mark()`, `flush()`, `STORAGE_INTEGRATION_MODULE`, `switchProject()` |
| 6371 | 이미지 | `imgSrc()`, `loadIdbImages()` |
| 6516 | 성장 | `own()`, 레벨·돌파·강화, `addAff()`(호감도) |
| 6633 | 메신저: 등대톡 | `openPhone()`, 스레드 |
| 6743–7217 | 도전: 레이드 · 심연 탐사(로그라이크 v2, 카드 전투) | `RG()`, `rgBattle()` |
| 7218–7464 | 선물 · 픽업 배너 만들기 · 갠톡(자유 채팅) | |
| 7465 | 렌더 | `render()`, `F` 맵, 각 `xxxHTML()`, `UI_SCROLL_MODULE` |
| 8113 | 상점 | 무료 보급 상점, 캐시 상점, 자동 스킨 상점 |
| 8229 | 처음 실행 설정 | `needSetup()`, `showSetup()` 마법사 |
| 8301 | 우편함 | `sendMail()` |
| 8326 | 모달 | `openModal()`, `closeModal()`, 이미지 뷰어 |
| 8599 | 성장 곡선 | 스테이지 밸런스 `rebalanceChapter` |
| 8798 | 스토리 공장 | 챕터 구성 → 스테이지별 집필 → 요약·관계·톡 |
| 9162 | 새 게임 초안 | 작가 설정으로 새 게임 생성 |
| 9498–9947 | 스킨 제안 · 라이브 운영 · 시즌 로테이션 · 도감 · 일괄 그림(`runPrep`) | `liveTick()` |
| 9948 | 캐스팅 | 오프닝 전 캐릭터 그림 확정 |
| 10037–10262 | 한 기기 플레이(lease) · 시작 시 동기화 · PC 서버 · 게임 고르기 | `bootSync()`, `pcPush/pcPull` |
| 10267 | PC·폰 연동(GitHub 비공개 저장소) | `SY()`, `syPush/syPull` |
| 10340 | 게임 게시·구독 | `PUB()`, `subCheck()` |
| 10518 | PC 화면(데스크톱 레이아웃) | `applyDesk()` |
| 10563 | 앱 업데이트 | `RELEASE_REPO`, `checkUpdate()`, `applyUpdate()`, `UPDATE_GUIDANCE_MODULE` |
| 10742 | AI(프롬프트 컨텍스트) | `ctx()`, 인물 관계도·스토리 기억, `aiJSON()` |
| 10887 | 대본 엔진 | `parseScript()`, `playStory()` |
| 10992 | 타이틀과 오프닝 | |
| 11051 | 전투 | `startBattle()`, `startStage()` → 전투 v2 |
| 11129 | 보스 패턴 | |
| 11196 | 계약 연출(가챠) | `rollOne()`, `pull()`, `playGacha()` |
| 11325 | 이벤트(= 클릭 액션 처리) | `handle*Action()` 12개, `APP_ACTION_HANDLERS`, 전역 click/keydown |
| 12389–12791 | `BACKUP_STORAGE_MODULE`, `STORY_MEMORY_MODULE`, 시작, 독립 앱 전용, `IMAGE_CANDIDATES_MODULE`, `MODAL_NAV_MODULE` | |

## 3. 고정 DOM

```html
<div id="app">
  <header class="top"> .brand  .res(#gold, #stamV, #gems) </header>
  <main id="view"></main>          <!-- render()가 탭 화면을 넣는 곳 -->
</div>
<nav class="tabs"> data-tab = crew | ops | lobby | contract | studio </nav>
<div id="ov">      <!-- 전체화면 오버레이: 타이틀, 대본(VN), 가챠 연출, 전투 -->
<div id="phone">   <!-- 메신저(등대톡) -->
<div id="modal">   <!-- openModal() 시트 -->
<div id="notif">   <!-- 알림 -->
<input type=file>  #file(그림) #afile(소리) #bkfile #drfile #durable-backup-file
```

## 4. 부팅 순서

```
1. <head> 스크립트       APP_BUILD 설정. (IndexedDB 없는 환경) 라이브 패치 HTML로 교체
2. ggm-durable-storage   GGMStorage 정의
3. ggm-storage-boot
   ├ appStorage = GGMStorage.create(window)
   ├ (라이브 실행인데 APK 셸이 너무 오래됨) → "새 APK 설치 필요" 화면
   ├ await appStorage.init()   IndexedDB 'starfall-img' 열기, localStorage → IDB 이전
   ├ starfall-live.on 이고 저장된 패치 빌드가 더 새로우면
   │     readLive('starfall-live-html') → document.open/write 로 새 HTML 전체 교체 (boots>3 이면 포기·롤백)
   └ run(): 지연 모듈들 → ggm-main 을 진짜 <script>로 교체 실행
4. ggm-main 최상위 코드
   ├ G = fix(저장된 JSON || defaults())
   ├ "시작" 섹션: render(); loadIdbImages(); applyMeta();
   │   bootSync()(PC/GitHub 동기화) → needSetup()? showSetup() : showStart()
   └ "독립 앱 전용": setupAI(); loadAudio(); 업데이트 확인(APK 3시간마다 / 웹 5초 후),
       동기화 확인, 서비스 워커 등록, Capacitor 뒤로가기 처리
```

실패 시 `showFailure()`가 데이터를 지우지 않고 안내 화면을 띄웁니다(초기화 금지 원칙).

## 5. 실행 환경 3가지

| 환경 | 판별 | HTTP | 저장 | 업데이트 |
|---|---|---|---|---|
| 웹/PWA (GitHub Pages, iOS Safari) | 기본 | `fetch`. CORS 막히는 호스트는 `ggm-proxy`(중계 서버) 경유 | IndexedDB + localStorage | `checkWebUpdate()` — 알림만, 새로고침으로 반영 |
| 안드로이드 APK (Capacitor) | `IS_NATIVE` (`window.Capacitor`) | `CapacitorHttp` 네이티브(CORS 없음) | + Capacitor Filesystem(`updates/*.html`) | `checkUpdate()` → `version.json` 비교 → HTML 다운로드·`sha256` 검증 → `saveLive()` → 재시작 시 교체 |
| PC 서버 (`ggm-server.py`) | URL `?pc=키`, 포트 8790, `*.trycloudflare.com` | `/api/proxy` 경유(서버가 대신 호출, 로컬 ComfyUI/Ollama 가능) | PC `ggm-data/state.json` + `blobs/`(그림, sha256 이름) + `history/` 백업 | 서버 시작 시 GitHub raw에서 `www/*` 받아 옴 |

### PC 서버 API (`ggm-server.py`)

`X-GGM-Key` 헤더로 인증(키는 `ggm-data/key.txt`).

| 경로 | 설명 |
|---|---|
| `GET /api/hello` | 상태 확인 |
| `/api/proxy?u=` | AI 요청 중계 |
| `GET/PUT /api/store/state` | 게임 전체 상태. 저장마다 `history/state-*.json`(최근 20) 백업, 크게 줄면 `keep-*`(10) 보존. 동시 저장 충돌 감지 |
| `GET /api/store/history[/파일]` | 백업 목록/복원 |
| `/api/store/list`, `/api/store/blob/<sha256>` | 그림·소리 바이너리 |
| `/api/lease` | 한 번에 한 기기만 플레이 |
| `POST /api/update` | `www/` 최신화 |

환경 변수: `GGM_PORT`(8790), `GGM_REPO`(기본 `jjhk0803/gacha-game-maker` — 포크라면 바꿔야 함).
