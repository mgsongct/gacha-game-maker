# 구버전·미비 생성 게임 감지·보완 검증

생성: `node tools/play/upgrade.mjs` · 2026-11-03T16:55 · 항목 10(tools/out/wiring.json — 포크 기능이 새로 만든 키·필드) · 항목마다 그 데이터만 뺀 예전 게임(점검 판·생성 판 0)을 지금 빌드에 불러와 감지·자동 보완

## idol-audition — 앙코르 시그널

| 키·필드 | 판정 | 점검 알림 | 점검 발견 | 보완 뒤 새 문제 | 이어서 채울 항목 | 비고 |
|---|---|---|---|---|---|---|
| G.meta.variants | 건너뜀 |  |  |  |  | 원래 게임에도 비어 있음 |
| G.meta.expedition | 건너뜀 |  |  |  |  | 원래 게임에도 비어 있음 |
| G.meta.rules | 보완됨(자동) | 뜸 | g_rules 1 |  | c_spot 0→6 | 글 AI 요청 2 |
| G.meta.positions | 보완됨(자동) | 뜸 | g_pos 1 |  | c_spot 0→6 | 글 AI 요청 2 |
| G.meta.balance | 건너뜀 |  |  |  |  | 원래 게임에도 비어 있음 |
| G.meta.persona | 건너뜀 |  |  |  |  | 원래 게임에도 비어 있음 |
| 캐릭터.persona | 보완됨(자동) | 뜸 | c_persona 6 |  | c_spot 0→6 | 글 AI 요청 7 |
| 캐릭터.pfields | 보완됨(자동) | 뜸 | c_pfields 6 |  | c_spot 0→6 | 글 AI 요청 7 |
| 세력.stance | 놓침 | 뜸 |  |  | c_spot 0→6 | 글 AI 요청 1 |
| 캐릭터.debutLater | 건너뜀 |  |  |  |  | 원래 게임에도 비어 있음 |


## sky-knights — 게일 크레스트

| 키·필드 | 판정 | 점검 알림 | 점검 발견 | 보완 뒤 새 문제 | 이어서 채울 항목 | 비고 |
|---|---|---|---|---|---|---|
| G.meta.variants | 건너뜀 |  |  |  |  | 원래 게임에도 비어 있음 |
| G.meta.expedition | 건너뜀 |  |  |  |  | 원래 게임에도 비어 있음 |
| G.meta.rules | 보완됨(자동) | 뜸 | g_rules 1 |  | c_spot 0→8 | 글 AI 요청 2 |
| G.meta.positions | 보완됨(자동) | 뜸 | g_pos 1 |  | c_spot 0→8 | 글 AI 요청 2 |
| G.meta.balance | 건너뜀 |  |  |  |  | 원래 게임에도 비어 있음 |
| G.meta.persona | 건너뜀 |  |  |  |  | 원래 게임에도 비어 있음 |
| 캐릭터.persona | 보완됨(자동) | 뜸 | c_persona 8 |  | c_spot 0→8 | 글 AI 요청 9 |
| 캐릭터.pfields | 보완됨(자동) | 뜸 | c_pfields 8 |  | c_spot 0→8 | 글 AI 요청 9 |
| 세력.stance | 놓침 | 뜸 |  |  | c_spot 0→8 | 글 AI 요청 1 |
| 캐릭터.debutLater | 건너뜀 |  |  |  |  | 원래 게임에도 비어 있음 |

