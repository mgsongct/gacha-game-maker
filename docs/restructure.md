# 재구조화 계획 — 모듈 통합(정돈 단계)

사용자 지시(`docs/directives.md` U12–U15): 모듈이 너무 많이 파편화돼 있음 — 포크 전 원형 분석 문서 기준으로 **통합하고 줄임**, 모듈마다 **단일 책임**(SRP), 기능 = 그 data의 **CRUD 일괄 단위**이고 바꾸는 길은 **한 창구**. 순서는 **추상 분석 → 재구조화(통합) → 도구로 세부 처리·복구**(중간에 깨져도 됨).

## 1. 추상 분석

- 원형(13a3fe9) 분석 문서(`docs/modules.md` §1–13, `docs/architecture.md` §2 ggm-main 섹션 지도)의 기능 모듈은 **13개**: UI 렌더링·라우팅 · 액션 디스패치 · AI 연결 · 그림 · 소리 · 전투 v2 · 대본 엔진 · 가챠 · 성장·경제·콘텐츠 · 메신저 · 스토리 공장·새 게임·기억 · 동기화·백업·공유 · 앱 업데이트.
- 지금은 **84개 모듈**(src/main 파일·폴더 + src/modules): 포크 기능(`docs/modules.md` 8-1~8-3, 15절)이 기능마다 파일을 따로 두었고, 원형 섹션도 파일 여럿으로 잘게 나뉨(렌더·UI 스크롤·모달·모달 내비, 저장·저장 통합·백업·데이터 폴더 …).
- 액션 디스패치(`0510-actions/`)는 모든 기능의 동작을 한 분배기에 모음 — 기능을 고치면 분배기도 고쳐야 함(OCP·CRUD 창구 위반). 화면 함수 여럿이 `0180-ui-scroll.js`에 몰림. → 2단계에서 기능 모듈로 해체.

## 2. 목표 모듈(책임 하나 · 가진 data)

1단계는 아래 표대로 파일을 목표 모듈(폴더)로 모음(84 → 24). 2단계에서 모듈 안을 책임·계층(Model·Controller·View)으로 다시 짜고, 액션 분배기·UI 스크롤의 기능별 부분을 각 모듈로 보냄.

| 목표 모듈 | 책임(하나) | 가진 data(CRUD 창구) | 모으는 지금 파일 |
|---|---|---|---|
| `0010-base` | 기반 — 형식 상수·용어·유틸(모든 기능이 쓰는 것) | — | `0010-rules.js` `0060-util.js` |
| `0015-prompt-studio` | 프롬프트 — 조각·요청 조립·AI 컨텍스트 | `G.meta.prompts` | `0015-prompt-studio/*` `0440-ai-context.js` |
| `0020-ai` | 글 AI 연결 | AI 설정(저장소) | `0020-ai-connect.js` |
| `0030-image` | 그림 — 생성·후보·일괄·에셋·캐스팅 | `G.lib` 그림·에셋 | `0030-image/*` `0310-art-after-ai.js` `0330-casting.js` `0565-asset-library.js` `0510-actions/100-images-and-assets.js` |
| `0040-sound` | 소리 | BGM·효과음·음성 설정 | `0040-sound.js` |
| `0050-default-content` | 기본 콘텐츠(샘플 data) | — | `0050-default-content.js` |
| `0070-store` | 저장 — 게임 상태·형식 이전·저장소·백업·데이터 폴더 | `G` 저장·`fix` | `0070-save.js` `0080-storage-integration.js` `0520-backup-storage.js` `0525-data-folder.js` |
| `0090-character` | 캐릭터 — 보유·성장·호감·개성·이격 상속·스킨 | `G.chars`·`P().owned` | `0065-inherit.js` `0090-growth.js` `0130-gift.js` `0455-persona.js` `0200-skin-shop.js` `0270-skin-proposal.js` `0510-actions/090-characters.js` |
| `0100-messenger` | 메신저·갠톡·플레이어 프로필 | `G.threads`·`P().inbox`·`P().fchat`·`P().avatar` | `0100-messenger.js` `0160-player-profile.js` `0510-actions/120-messenger.js` |
| `0110-challenge` | 도전 콘텐츠 — 레이드·심연·탑·스테이지 양식 | `P().raid`·`P().rogue`·탑 | `0110-challenge-raid.js` `0120-abyss.js` `0125-tower.js` `0488-stage-modes.js` `0510-actions/070-combat-and-formation.js` |
| `0135-live` | 라이브 운영 — liveTick·시즌·일정·콘텐츠 점검·채움 | `P().live`·일정 | `0135-schedule.js` `0280-live-ops.js` `0290-season-rotation.js` `0535-content-audit.js` `0537-live-fill.js` |
| `0140-acquire` | 획득 — 가챠·픽업 배너·건조 | `G.banners`·`P().pity`·`P().cres` | `0140-pickup-new.js` `0150-pickup-existing.js` `0500-gacha.js` `0505-construct.js` |
| `0170-shell` | 화면 틀 — 렌더·라우팅·모달·시작·설치 환경·게임 고르기 | 화면 상태 | `0170-render.js` `0180-ui-scroll.js` `0210-setup.js` `0230-modal.js` `0370-game-picker.js` `0380-ios-web.js` `0410-desktop.js` `0540-start.js` `0550-standalone-app.js` `0570-modal-nav.js` `0510-actions/010-setup.js` `0510-actions/020-navigation-and-tools.js` `0510-actions/050-settings-and-audio.js` `0510-actions/130-dispatch.js` |
| `0185-rules` | 게임 규칙·밸런스 — 상성·능력치·성장 곡선 | `G.meta.rules`·`G.meta.balance` | `0185-game-rules.js` `0187-balance.js` `0240-growth-curve.js` |
| `0190-economy` | 경제 — 상점·우편 | `P().shop`·우편 | `0190-shop.js` `0220-mail.js` `0510-actions/030-mail.js` `0510-actions/110-economy.js` |
| `0250-story` | 스토리 생성 — 장 공장·시나리오 설계·스토리 기억 | `G.chapters`·`G.world.plan`·`G.meta.storyMemory` | `0250-story-factory.js` `0465-story-plan.js` `0530-story-memory.js` |
| `0260-new-game` | 새 게임 — 초안 편집·생성 | 새 게임 초안 | `0260-new-game/*` `0510-actions/040-story-and-authoring.js` |
| `0274-expedition` | 원정·파견 | `P().exped`·`P().dispatches` | `0274-dispatch.js` `0275-expedition.js` |
| `0300-world` | 세계관 data — 도감·세력·관계 | `G.world.codex`·`G.world.factions`·`G.rels` | `0300-codex.js` `0445-factions.js` `0450-relations-memory.js` |
| `0360-sync` | 동기화·공유 — PC 서버·GitHub·한 기기·게시 | 동기화 설정 | `0360-sync/*` `0335-github-api.js` `0400-publish-subscribe.js` `0510-actions/060-storage-and-sharing.js` |
| `0420-app-update` | 앱 업데이트 | 업데이트 설정 | `0420-app-update.js` `0510-actions/080-updates.js` |
| `0460-script` | 대본·연출 — 대본 엔진·연출·타이틀·오프닝 | 연출 설정 | `0460-script-engine.js` `0462-direction.js` `0470-title-opening.js` |
| `0480-battle` | 전투 — 시작·정산·전장 규칙·대열·출격·보스 패턴 | `P().squad`·편성 | `0480-battle.js` `0485-battle-rules.js` `0487-formation-sortie.js` `0490-boss-patterns.js` |

규칙 엔진(순수 모듈 — `src/modules/app`·`src/modules/combat`)은 그대로 둠(CLAUDE.md §0-1).

## 3. 단계

1. **모으기**: `node tools/restructure.mjs --apply` — 위 표대로 파일을 목표 모듈 폴더로 옮김(`git mv`, 폴더 안 파일 이름은 원래 이름이라 같은 모듈 안 순서 유지). 깨진 연관(문서·도구 설정의 옛 경로, 불러올 때 순서가 바뀌어 생기는 TDZ 등)은 고치지 않고 아래 4절 이슈로 기록(사용자 지시 U16).
2. **해체·재구성**(진행: 처리기 옮김 · UI 스크롤 해체 · 모듈마다 0-load·1-model·2-controller·3-view로 다시 짬 — `--dissolve`·`--layers`·`--merge-rest`): 액션 분배기(`0510-actions/`)의 처리기 파일을 부르는 함수가 가장 많은 기능 모듈로(위 표 — `node tools/map.mjs --why <처리기>`의 「부르는 것의 모듈별 수」), `0180-ui-scroll.js`의 화면 함수를 그 기능 모듈로, 모듈 안을 책임·계층으로 다시 짬, 모듈마다 data 창구 하나(규칙 D3).
3. **복구**: 쌓인 이슈를 도구로 일괄 처리하고 빌드·정적 점검·규칙·브라우저 시험으로 확인.

## 4. 이슈·할 일(재구조화로 깨진 것 — 나중에 도구로 일괄 처리)

| # | 단계 | 깨진 것 | 일괄 처리할 도구 |
|---|---|---|---|
| R1 | 1 모으기(2026-11-04) | 옛 src/main 경로를 가리키는 곳 237(파일 23: docs/data-model.md · docs/map.json · docs/map.md · docs/modules.md · docs/problems.md · docs/research/README.md · docs/research/balance.md · docs/research/character.md …) · 불러올 때 순서가 바뀌어 생길 수 있는 TDZ·정의 안 된 이름 | 경로: 옛 → 새 경로 바꾸기(이 도구의 옮김 목록) · TDZ·이름: `node tools/check.mjs` |
| R2 | 1 모으기(2026-11-04) | 옛 src/main 경로를 가리키는 곳 38(파일 7: docs/customization.md · docs/map.json · docs/modules.md · docs/self-check.md · tools/baseline.json · tools/fix.mjs · tools/play/reports/combos.md) · 불러올 때 순서가 바뀌어 생길 수 있는 TDZ·정의 안 된 이름 | 경로: 옛 → 새 경로 바꾸기(이 도구의 옮김 목록) · TDZ·이름: `node tools/check.mjs` |
| R3 | 2 처리기 옮김(2026-11-04) | 처리기 파일을 부르는 함수가 가장 많은 모듈로 통째 옮김 — 여러 기능의 case가 섞인 처리기는 case마다 제 기능 모듈로 나눠야 함: `0170-shell/020-navigation-and-tools.js`(캐릭터·그림·AI·대본·라이브 case) · `0260-new-game/040-story-and-authoring.js`(세계관·스토리 case) · `0170-shell/050-settings-and-audio.js`(AI·소리 case) · `0030-image/100-images-and-assets.js`(AI case) · `0190-economy/110-economy.js`(획득·원정 case) · `0170-shell/010-setup.js`(AI case) | case 나누기 도구(case가 부르는 함수의 모듈로 묶어 기능 모듈마다 처리기 하나 · 분배 표 갱신) |
| R4 | 2 계층으로(2026-11-04) | 모듈마다 `0-load.js`(상수·상태·불러올 때 리스너 — 옛 조각을 순서대로 이음)·`1-model.js`·`2-controller.js`·`3-view.js`로 다시 짬(함수 1449). `0-load.js`의 상수·상태는 그 모듈의 data 창구(Model)로, 리스너는 Controller로 정리해야 함 · 섞인 함수(계층 섞임 L1)가 `2-controller.js`에 들어 있음 — 나눠야 함 | `node tools/rules.mjs`(L1·L2·L3·D3) · `node tools/map.mjs --split` |
| R5 | 2 계층으로(2026-11-04) | 브라우저 시험·플레이 시험은 이 단계에서 돌리지 않음(사용자 지시 U15 — 재구조화 먼저, 도구로 나중에 복구) | `node build/test.mjs` · `node tools/play/*.mjs` |
