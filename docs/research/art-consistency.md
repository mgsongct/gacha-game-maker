# 캐릭터 그림 일관성 (제안 단계)

수집형 게임에서 같은 캐릭터가 스탠딩·표정·CG·스킨마다 달라 보이면 몰입이 깨집니다. 지금 그림 파이프라인이 일관성을 위해 하는 것과 빈틈, NovelAI·ComfyUI 쪽 방법을 조사했습니다. 프롬프트 조각·그림 가드는 [prompts.md](prompts.md), 종합은 [maker-review.md](maker-review.md).

## 1. 현황 조사 (빌드 2026.11.03.17)

| 장치 | 상태 | 위치 |
|---|---|---|
| 기본 모델 | NovelAI **V5 Full**, 참조용 모델 **V4.5 Full** | `NAI_DEF` `0020-ai-connect.js:271` |
| 참조 그림(캐릭터 레퍼런스) | 스탠딩을 참조로 일러스트·로비 CG·CG(설정이 'all'이면 스킬 컷인·상반신도) 그리기. **기본값 꺼짐**(`autoRef:'off'`), 켜면 강도 1·충실도 1 | `autoRefOn`·`standRefs` `0030-character-regen.js:194~195`, 기본값 `0020:274` |
| 참조를 쓸 때 모델 | V5가 아니라 **V4.5로 바꿔** 그림 | `0030:536` |
| 여러 인물 장면 | V4 이상 캐릭터별 캡션(`char_captions`)·위치 | `0030:556~558` |
| 표정 | 원본 그림에서 NovelAI 표정 변환(`augment-image`, `req_type:'emotion'`)으로 생성 — 같은 그림에서 출발해 정체성 유지가 좋음 | `naiEmotion` `0030:227~229` |
| 투명 배경 | V5에서 참조·img2img·인페인트가 없을 때만 | `0030:540` |
| 시드·후보 | 쓴 시드 기록, 후보 여러 장 중 고르기 | `usedSeed`, `0560-image-candidates.js` |
| 외형 태그 | 캐릭터 `naiPrompt` = 외모만(규칙), 바리에이션은 의상 태그를 빼고 대표 외모만 남김 | 그림 태그 안내(대원 생성 프롬프트), `variantPrompt`([variants.md](variants.md)) |
| ComfyUI | 워크플로에 **프롬프트·네거티브·크기·시드만** 넣음. 참조는 쓰지 않음(`autoRefOn`이 ComfyUI면 false) | `comfyGenerate` `0030:490~497`, `0030:194` |

### 문제

| # | 문제 | 영향 | 심각도 |
|---|---|---|---|
| A1 | 참조 그리기가 기본 꺼짐 | 기본 설정의 CG·일러스트는 태그만으로 같은 캐릭터를 맞춤 → 머리 모양·의상 세부가 흔들림 | 중 |
| A2 | 스탠딩(V5)과 참조를 쓴 CG(V4.5)의 모델이 다름 | 한 캐릭터 안에서 화풍이 갈릴 수 있음 | 하~중 |
| A3 | 켜면 참조 강도 1(최대) | NovelAI 문서: 강도가 높으면 표정·각도·포즈까지 참조를 닮음 → CG 구도가 스탠딩처럼 굳음 | 하 |
| A4 | ComfyUI 사용자는 참조 그리기가 아예 없음 | 내 PC로 그리는 사람은 일관성 장치가 없음 | 중 |
| A5 | 외형 태그가 고정(머리·눈·체형)과 가변(의상·소품)으로 나뉘어 있지 않음 | 스킨·CG에서 고정 외모만 확실히 넣기 어렵고, 태그 순서가 그림마다 달라짐 | 하~중 |

## 2. 조사

| 주제 | 요점 |
|---|---|
| NovelAI 여러 인물 | 기본 프롬프트 + 캐릭터별 프롬프트, V4는 최대 6명, 인원 태그(예: `2girls`)는 기본 프롬프트에, 위치 지정, 행동에 `source#`/`target#`/`mutual#` — 공식 문서도 "항상 믿을 수는 없다"고 적음[1] |
| Precise Reference(V4.5) | 캐릭터·스타일·둘 다 중 선택, 생성마다 5 Anlas 추가, Vibe Transfer와 함께 못 씀. 강도를 높이면 표정·각도·포즈까지 닮음. 참조는 **단색 배경에 중립 포즈로 선 전신**이 좋고 의상 세부는 인페인트로[2] |
| V5 | 공식 문서에 V5 Full/Curated, Opus 구독 무료 생성에 처음으로 한도[3]. 제3자 보도로는 V5가 Precise Reference·Vibe Transfer를 아직 지원하지 않아 V4.5로 넘어감[4] **[원문 미확인]** — 이 앱이 참조 시 V4.5로 바꾸는 것과 일치 |
| Vibe Transfer | 참조 강도가 높으면 텍스트 프롬프트를 무시하는 경향, Information Extracted를 낮추면 흰 배경 같은 원치 않는 요소가 덜 옮겨옴[5] |
| 태그 순서 | NovelAI(V3 이하): 앞 태그일수록 강함, `{}` 강조·`[]` 약화, 권장 순서 1girl → 캐릭터 → 시리즈 → 나머지[6]. NoobAI-XL: 품질 접두어 뒤 `<1girl/1boy>, <character>, <series>, <artists>, <special>, <general>`[7]. 시드는 계산 자체를 고정[8] — 표정 차분에서 시드 재사용의 효과를 수치로 보인 근거는 찾지 못함 |
| ComfyUI | IP-Adapter: 22M 파라미터의 분리 교차 어텐션, 텍스트와 함께 사용[9]. IPAdapter_plus: 스타일·구도 가중치 분리, Precise Style Transfer[10]. reference-only: 별도 모델 없이 어텐션을 참조에 연결[11]. LoRA 강도는 보통 0~1[12]. StoryDiffusion: 정체성·복장 유지, 사용자 선호에서 IP-Adapter보다 높음[13] |

## 3. 제안

| # | 제안 | 해결 | 위치 | 규모 |
|---|---|---|---|---|
| 3-1 | **참조 기본값 재검토**: NovelAI를 쓰면 CG·일러스트 참조를 기본 켜고(비용 5 Anlas/장을 설정 화면에 표시), 강도 기본 0.6 전후로. 표정은 지금처럼 표정 변환 유지 | A1·A3 | `NAI_DEF.autoRef`·`ref`(`0020:274`), 설정 화면 | S |
| 3-2 | **캐릭터 시트 먼저**: 캐스팅 때 참조용 전신(단색 배경·중립 포즈)을 V4.5로 한 장 만들어 참조 원본으로 쓰고, 한 캐릭터의 그림 세트는 한 모델로 통일하는 옵션. 스탠딩을 V5로 그릴지 V4.5로 그릴지 게임 단위로 고르게 | A2 | 캐스팅(`0330-casting.js`), `naiGenerate0`(`0030:533~`) | M |
| 3-3 | **ComfyUI 참조 자리**: 워크플로 JSON에 참조 이미지 표식(예: `LoadImage` 노드 입력값 `%REF%`)이 있으면 스탠딩을 업로드(`/upload/image`)해 그 자리에 넣기. 표식이 없으면 지금처럼. 설정 화면에 IP-Adapter 예시 워크플로 안내 | A4 | `comfyBind`·`comfyGenerate`(`0030:490~`), `autoRefOn`(`0030:194`) | M |
| 3-4 | **고정·가변 외형 태그**: 대원 생성 스키마에 `look:{fixed:"머리색, 눈, 머리 모양, 체형", outfit:"대표 의상·소품"}`를 두고, 그릴 때 고정 태그를 늘 같은 순서로 맨 앞에. 기존 `naiPrompt`는 점검 규칙으로 나눠 주기(AI 채우기) | A5 | 대원 스키마(`0250`), `composeNai`(`0020`), `0535` | M |
| 3-5 | **일관성 점검**: 같은 캐릭터 그림들의 프롬프트에서 고정 태그가 빠졌거나 다른 값(머리색 등)이 들어간 것을 찾는 점검 규칙 | A5 | `0535`, `imgAuditScan`(`0025`) | S |

## 4. 수치

- 참조 비용(NovelAI 문서 기준): 참조를 쓴 생성 1장마다 +5 Anlas. 새 게임 그림은 약 45~50장(캐스팅 16장 + 일괄 그림, 검토 추정)이고, 그중 참조 대상(일러스트·로비 CG·CG)만 추가 비용이 붙음 — 대원 8명이면 일러스트 8장 × 5 = 40 Anlas + CG 장수 × 5.
- 표정 변환은 원본 해상도 832×1216으로 맞춰 보냄(`0030:229`).

## 5. 확장 아이디어

- 게임 단위 그림체 LoRA(ComfyUI)와 캐릭터 LoRA를 설정에 등록
- 스킨 그림에 "의상만 인페인트" 경로(얼굴·머리는 원본 유지)

## 6. 출처

1. NovelAI Docs, Multiple characters — https://docs.novelai.net/en/image/multiplecharacters
2. NovelAI Docs, Precise Reference — https://docs.novelai.net/en/image/precisereference
3. NovelAI Docs, Models — https://docs.novelai.net/en/image/models
4. 제3자 리뷰(V5) — https://airmore.ai/ai-review/novelai-v5-review , https://hashout.jp/ai/8369/
5. NovelAI Docs, Vibe Transfer — https://docs.novelai.net/image/vibetransfer.html
6. NovelAI Docs, Tags — https://docs.novelai.net/en/image/tags
7. Laxhar, NoobAI-XL 1.0 — https://huggingface.co/Laxhar/noobai-XL-1.0
8. NovelAI Docs, Basics — https://docs.novelai.net/en/image/basics
9. Ye et al., "IP-Adapter", 2023 — https://arxiv.org/abs/2308.06721
10. cubiq, ComfyUI_IPAdapter_plus — https://github.com/cubiq/ComfyUI_IPAdapter_plus
11. Mikubill, sd-webui-controlnet(reference-only) — https://github.com/Mikubill/sd-webui-controlnet
12. ComfyUI Docs, LoraLoader — https://docs.comfy.org/built-in-nodes/LoraLoader.md
13. Zhou et al., "StoryDiffusion", 2024 — https://arxiv.org/abs/2405.01434
- NovelAI 문서는 이 조사 환경에서 원문을 열지 못해 검색 발췌로 확인했습니다. 구현 전에 원문 확인.
