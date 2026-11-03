# 구버전·미비 생성 게임 감지·보완 검증

생성: `node tools/play/upgrade.mjs` · 2026-11-03T15:30 · 항목 10(tools/out/wiring.json — 포크 기능이 새로 만든 키·필드) · 항목마다 그 데이터만 뺀 예전 게임(점검 판·생성 판 0)을 지금 빌드에 불러와 감지·자동 보완

## idol-audition — 앙코르 시그널

| 키·필드 | 판정 | 점검 알림 | 점검 발견 | 비고 |
|---|---|---|---|---|
| G.meta.variants | 건너뜀 |  |  | 원래 게임에도 비어 있음 |
| G.meta.expedition | 건너뜀 |  |  | 원래 게임에도 비어 있음 |
| G.meta.rules | 보완됨(자동) | 뜸 | g_rules 1 | 글 AI 요청 2 |
| G.meta.positions | 기본값으로 동작 | 뜸 |  | 글 AI 요청 1 |
| G.meta.balance | 건너뜀 |  |  | 원래 게임에도 비어 있음 |
| G.meta.persona | 건너뜀 |  |  | 원래 게임에도 비어 있음 |
| 캐릭터.persona | 감지됨·보완 요청함(가짜 AI라 내용 미확인) | 뜸 | c_persona 6 | 글 AI 요청 11 |
| 캐릭터.pfields | 놓침 | 뜸 |  | 글 AI 요청 1 |
| 세력.stance | 놓침 | 뜸 |  | 글 AI 요청 1 |
| 캐릭터.debutLater | 건너뜀 |  |  | 원래 게임에도 비어 있음 |


## sky-knights — 게일 크레스트

| 키·필드 | 판정 | 점검 알림 | 점검 발견 | 비고 |
|---|---|---|---|---|
| G.meta.variants | 건너뜀 |  |  | 원래 게임에도 비어 있음 |
| G.meta.expedition | 건너뜀 |  |  | 원래 게임에도 비어 있음 |
| G.meta.rules | 보완됨(자동) | 뜸 | g_rules 1 | 글 AI 요청 2 |
| G.meta.positions | 기본값으로 동작 | 뜸 |  | 글 AI 요청 1 |
| G.meta.balance | 건너뜀 |  |  | 원래 게임에도 비어 있음 |
| G.meta.persona | 건너뜀 |  |  | 원래 게임에도 비어 있음 |
| 캐릭터.persona | 감지됨·보완 요청함(가짜 AI라 내용 미확인) | 뜸 | c_persona 8 | 글 AI 요청 11 |
| 캐릭터.pfields | 놓침 | 뜸 |  | 글 AI 요청 1 |
| 세력.stance | 놓침 | 뜸 |  | 글 AI 요청 1 |
| 캐릭터.debutLater | 건너뜀 |  |  | 원래 게임에도 비어 있음 |

