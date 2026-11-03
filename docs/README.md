# 개발자 문서 (포크용 분석)

원본: `jjhk0803/gacha-game-maker` · 이 포크: `mgsongct/gacha-game-maker` · 분석 기준 빌드 `2026.10.24.1`

AI로 세계관·캐릭터·스토리·그림·음성·음악을 만들고 그대로 플레이하는 **개인용 가챠 게임 메이커 SPA**입니다.
배포물은 **HTML 파일 하나(`www/index.html`, 약 1.6MB, 12,800줄)** 입니다. 이 포크에서는 TiddlyWiki처럼 **`src/`의 파트·모듈 파일을 `build/`로 합쳐** 그 파일을 만듭니다(의존성 없음, Node 18+).

| 문서 | 내용 |
|---|---|
| [architecture.md](architecture.md) | 저장소 구성, `index.html` 내부 구조와 줄 지도, 부팅 순서, 실행 환경(웹/APK/PC 서버) |
| [data-model.md](data-model.md) | 게임 상태 `G`의 스키마, 저장 계층(IndexedDB/localStorage), 저장 키 목록, 마이그레이션(`fix`) |
| [self-check.md](self-check.md) | 자기점검 보고서(`node tools/check.mjs`): 콜 그래프·병목·순환·복잡도·액션/상태/화면 흐름·다중화·파편화. 도구 설명은 [tools/README.md](../tools/README.md) |
| [modules.md](modules.md) | 기능 모듈별 설명과 모듈 사이 연계(AI, 그림, 소리, 대본 엔진, 전투 v2, 가챠, 메신저, 동기화, 업데이트) |
| [build.md](build.md) | 소스 구조(`src/`), 빌드·검증 명령, 모듈 추가 방법, 원본 업데이트 가져오기 |
| [customization.md](customization.md) | 커스텀 방법: 화면·액션 추가, 테마, 기본 콘텐츠, AI 공급자, 포크용 업데이트 채널, 배포 절차, 주의사항 |

## 한눈에 보기

```
브라우저 / Capacitor APK / PC 서버(Python)
        │  www/index.html 하나를 로드
        ▼
 ┌─ <head> 부트 스크립트 ── 라이브 패치(저장된 새 HTML) 있으면 교체 실행
 ├─ <style>  (테마: html[data-skin])
 ├─ <body> 고정 DOM: #app > header, main#view, nav.tabs, #ov, #phone, #modal, #notif
 ├─ text/ggm-module  (지연 실행 모듈: 확인창, 전투 v2 번들 9개)
 ├─ ggm-durable-storage (즉시 실행: GGMStorage)
 ├─ text/ggm-main   (지연 실행: 본체 8,500줄, 전역 함수 1,300여 개)
 └─ ggm-storage-boot (즉시 실행: 저장소 init → 모듈들을 실제 <script>로 바꿔 실행)
```

- 상태: 전역 `G`(게임 하나) + `P()` = `G.prog`(진행). 변경 후 `mark(키)` → 100ms 뒤 `flush()`가 IndexedDB에 저장.
- 화면: 전역 `tab` 값 → `render()`가 `F[tab]()`이 만든 HTML 문자열을 `#view.innerHTML`에 넣음. 팝업은 `openModal(html)`.
- 입력: `data-tab` / `data-act` 속성을 가진 요소 클릭 → 문서 전체 위임 리스너 → `APP_ACTION_HANDLERS[act]`.
- AI: `aiJSON(prompt)` → `aiCall` → `aiOne`(공급자별 분기) → `http()`(네이티브 HTTP / 중계 서버 / fetch).

> 줄 번호는 빌드마다 바뀝니다. 문서의 줄 번호는 위치 감을 잡는 용도이고, 실제로는 **섹션 주석**(`/* ===== … ===== */`, `/* XXX_MODULE */`)이나 함수 이름으로 검색하세요.
