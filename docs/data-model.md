# 데이터 모델과 저장

## 1. 게임(프로젝트)과 전역 상태

- 기기 하나에 여러 게임을 가질 수 있음. 목록은 `starfall-projects` = `{active, list:[{id,title}]}` (`PJ()`).
- 게임 하나의 저장 키: `pjKey(id)` → `main`이면 `starfall-contract-v1`, 그 외 `starfall-contract-v1-<id>`.
- 실행 중에는 **활성 게임 하나만** 전역 `G`에 로드됨. 게임 전환은 `switchProject(id)` → 저장 후 페이지 재로드.

```js
let G = fix(JSON.parse(appStorage.getItem(LKEY)) || defaults());
const P = () => G.prog;      // 진행 상태 단축
```

## 2. `G` 스키마 (`defaults()` 기준)

| 키 | 타입 | 내용 |
|---|---|---|
| `ver` | number | 스키마 버전 (`VER=3`) |
| `meta` | object | 게임 이름 `title/sub`, `theme`, `accent`, **용어 `terms`**(플레이어 호칭·재화·뽑기 이름 등, `T(k)`로 읽음), 속성 3개 `elems:[{n,c}]`, 역할 이름 `roles`, 재료 던전 `farms`, 상점 NPC `shop`, `tone`, `castSex`, 마이그레이션 플래그들, 게시 정보 `pub`, 구독 정보 `subscr` |
| `world` | object | 세계관 설명, `factions[]`, 도감 `codex[{cat,title,body}]` |
| `chars[]` | array | 아군 캐릭터 (아래 §3) |
| `npcs[]` | array | NPC(대본·톡에 나오는 비전투 인물). 구조는 캐릭터와 비슷, `npc:true` |
| `rels[]` | array | 인물 관계도 `{id,a,b,kind,note,hist[]}` |
| `chapters[]` | array | `{id,ord,title,kind:'main'|'event'|…, stages:[{id,title,reward,enemies[],pre,post}]}`. `pre/post`는 대본 텍스트 |
| `lib[]` | array | 미디어 라이브러리 `{id,kind,name,prompt,img}`. `kind`: `bg`, `prop`, `cg`, `bgm`, `sfx`, `enemy`, `icon` 등. `img`는 데이터 URL이 아니라 IDB 키 참조(§5) |
| `threads[]` | array | 메신저 대화 `{id,charId,title,trigger,needOwn,script}` |
| `opening` | object | 오프닝 대본 |
| `banners[]` | array | 가챠 배너 `{id,name,type:'std'|'pickup',pool:{mode,factions,ids},pickup[],rate,active,bg}` |
| `events[]` | array | 기간 이벤트(이벤트 챕터 + 이벤트 상점 `shop[]`) |
| `dispatches[]` | array | 파견 목록 |
| `prog` | object | **플레이어 진행** (§4) |

## 3. 캐릭터(`chars[]`) 주요 필드

```js
{ id, ord, name, age(>=20 강제), rarity:1|2|3 (R/SR/SSR), role:'atk'|'def'|'sup', elem:'<meta.elems[].n>',
  hp, atk, def, spd, faction, limited, alt,
  profile, intro, lines[], touch:{head[],body[],pet[]}, lvLines[], dupLines[], affLines:{lv:[...]}, files:[{dup,text}],
  naiPrompt, naiPose,                    // NovelAI 태그
  img, illust, upper, pose, lbbg, lbcg, scg, // 각각 {id,kind,name,prompt,img} 그림 슬롯
  faces:[{name,img,up}], skins:[...], weapon:{id,name,desc,prompt,img},
  episodes:[{id,lv,dup,r19,title,script,after}],
  skill (구형), skills:{version:2,passive,active,ultimate} (전투 v2), skillBalance, voiceId }
```

**이격(`alt`)은 상속형**입니다: 원본과 다른 항목만 `over`(능력치는 `over.statMul` 배율)로 저장하고, 불러올 때·원본을 고칠 때 원본 + 수정치로 채웁니다([research/variants.md §3](research/variants.md#3-상속형-관리-원본--수정치)). 바리에이션은 여기에 `cvar`(템플릿 id)가 더 붙습니다.

`fix()`가 빠진 필드를 모두 채우므로, 새 필드를 추가할 때도 `fix()`에서 기본값을 넣는 패턴을 따르세요.

## 4. 진행(`prog`) 주요 필드

| 키 | 내용 |
|---|---|
| `gems`, `gold`, `mat{exp,wmat,core,gearMat,transcMat}` | 재화·재료 |
| `owned{[charId]: {lv,exp,dup,aff,wlv,skin,transc,seen[],skillTraining,...}}` | 보유 캐릭터. `grantOwned()`(가챠·건조 공통)가 생성 |
| `cres{res1..res4}`, `cbuild{n,input,found,log}` | 건조/영입 자원·기록 ([research/construction.md](research/construction.md)) |
| `exped{fame,cond,jobs,offers,streak,lib,libAt,biz}` | 원정 모드(방송·스트리머·경영) 진행 ([research/expedition.md](research/expedition.md)) |
| `squad[]` (최대 4), `sec` | 편성, 로비 비서 |
| `pity`, `pities{[bannerId]}`, `guar{}`, `spark{}`, `history[]`, `hist2[]` | 가챠 천장·확정·포인트·기록 |
| `settings{ssr,sr,pity,...}` | 확률 설정 (천장 기본 150) |
| `cleared{[stageId]}`, `farmClear`, `disp`, `tokens`, `shopBuy`, `shop`, `cash`, `pass`, `dm` | 클리어·일일/주간·상점 기록 |
| `inbox{[threadId]}`, `mail[]` | 톡 진행, 우편함 |
| `live{on,seasons,last,notices,skillGeneration}` | 라이브 운영·시즌 |
| `seenOpening`, `firstTen`, `player`, `gender`, `genderTxt`, `look`, `bio` | 플레이어 설정 |
| `savedAt` | 마지막 저장 시각(동기화 충돌 판단에 사용) |

## 5. 저장 계층

```
코드 ──appStorage.getItem/setItem──▶ GGMStorage
                                     ├ 관리 키(starfall-projects, starfall-contract-v1*) → 메모리 cache + IndexedDB 'starfall-img'/records
                                     │   쓰기는 큐로 모아 한 트랜잭션에서 "디스크값 == 내가 읽은 값" 확인 후 기록(다른 탭 덮어쓰기 방지 → storage_conflict)
                                     ├ 그 외 키 → localStorage
                                     └ 라이브 패치 HTML → Capacitor Filesystem updates/*.html 또는 IDB
IndexedDB 'starfall-img' (v2): stores = img(그림·소리 바이너리) | records(게임 JSON) | staging(백업 복원 임시)
```

- **변경 → 저장 흐름**: 상태를 직접 수정 → `mark('prog')`, `mark('c:'+id)` 등 → 100ms 디바운스 → `flush()`가 `G` 전체를 JSON으로 `setItem(LKEY)` → `appStorage.drain()`. 버튼 클릭 직후·`pagehide`·`visibilitychange`에서도 즉시 flush.
- `mark` 키(`meta`, `world`, `prog`, `opening`, `c:<id>`, `ch:<id>`, `l:<id>`, `t:<id>`)는 로컬 저장에선 "더러움" 표시일 뿐(항상 전체 저장)이고, 원격 문서 DB(`DB`, 현재 미사용 `null`)용 `writeKey()`에서 세분화되어 쓰임.
- 저장 실패 시 `storageWarning()` 배너 + 가챠·강화 등 재화 액션을 클릭 단계에서 차단.
- 큰 일괄 교체: `replaceAll(newGame)` / `appStorage.commitRecords()`.

## 5-1. 데이터 폴더 (게임별·종류별 JSON)

PC 서버를 쓰면 **영구 저장소는 PC의 `data/` 폴더**이고, 기기의 IndexedDB는 그 캐시입니다.

```
<PC 서버 폴더>/
├ www/                      앱 (index.html)
├ data/                     ← 게임 데이터 (영구 저장소)
│ ├ index.json              게임 목록 (= starfall-projects)
│ └ <게임id>/               main = 샘플/첫 게임, 그 외 g……
│   ├ meta.json  world.json  chars.json  npcs.json  rels.json  chapters.json  lib.json
│   ├ threads.json  opening.json  banners.json  events.json  dispatches.json  prog.json
│   └ game.json             위 목록에 없는 나머지 키(ver 등)
└ ggm-data/                 key.txt, blobs/(그림·소리, sha256 이름), history/(저장 백업), state.json(기기 설정·자료 목록)
```

- 배치 규칙은 한 곳에 정의: 앱 `src/main/0525-data-folder.js`의 `DATA_TYPES`/`dataSplit`/`dataJoin`, 서버 `pc/ggm-server.py`의 `TYPES`/`save_games`/`load_state` (둘을 같이 고치세요).
- 동기화: 기기 저장이 끝나면(`ggm-storage-ok` 이벤트) 5초 모아서 `pcPush` → 서버가 게임을 나눠 **내용이 바뀐 종류 파일만** 다시 씀. 새 기기·빈 캐시는 켤 때 `bootSync`/`pcStart`가 서버에서 받아 옴.
- 서버 프로토콜(`/api/store/state`)은 그대로라 예전 앱과도 호환. 서버는 받을 때 나누고, 보낼 때 다시 합칩니다. 예전 `state.json`(게임 포함)은 서버를 켤 때 자동 이전.
- **직접 고치기**: `data/` JSON을 PC에서 고치면 서버가 파일 요약(`_dataSig`)이 달라진 걸 보고 새 저장(`device: PC data 폴더(직접 수정)`)으로 표시 → 앱이 켤 때 "PC에 더 새 게임"으로 받아 감. 받기 전의 기기는 409로 덮어쓰지 못함. JSON 문법 오류는 파일 이름과 함께 알림.
- 백업 `ggm-data/history/state-*.json`은 저장마다 전체 상태 한 파일(최근 20개), 앱에서 지운 게임 폴더는 `history/deleted-<id>-<시각>/`로 옮김.
- 내보내기·가져오기: 설정 → 데이터의 **데이터 폴더 내보내기/가져오기** = 같은 배치의 zip (`data/index.json`, `data/<id>/*.json`, `data/<id>/media.json`, `data/<id>/media/<자료 키>`). 가져오면 새 게임으로 추가. PC 서버가 없어도(웹·APK) 사용 가능.
- ponytail: 종류별 파일 하나라 캐릭터 하나만 바뀌어도 `chars.json` 전체를 다시 씀. 더 커지면 `chars/<id>.json`처럼 항목별로 나누는 게 다음 단계.

## 6. 저장 키 목록

| 키 | 위치 | 내용 |
|---|---|---|
| `starfall-projects`, `starfall-contract-v1[-id]` | IDB | 게임 목록, 게임 데이터 |
| `starfall-ai`, `starfall-ai-profiles` | LS | 글 AI 프로필(키 포함) — `AIP()` |
| `starfall-nai`, `starfall-nai-tperr` | LS | NovelAI 설정 |
| `starfall-sound` | LS | 소리 설정, Fish/ElevenLabs 키 — `SND()` |
| `starfall-setup-done` | LS | 첫 실행 마법사 완료 |
| `starfall-live`, `starfall-live-html`, `starfall-live-prev` | LS / 파일 | 앱 업데이트 상태(`LV()`), 패치 HTML, 직전 HTML |
| `ggm-packs`, `ggm-llmslot`, `ggm-pthumb` | LS | 그림체 프리셋, LLM 슬롯, 썸네일 |
| `ggm-sync`, `ggm-sync-idx`, `ggm-sync-hold` | LS | GitHub 동기화 설정·인덱스 |
| `ggm-pc` | LS | PC 서버 `{base,key}` |
| `ggm-pub` | LS | 게임 게시 설정 |
| `ggm-proxy`, `ggm-proxy-off` | LS | 웹 중계 서버 주소 |
| `ggm-ailog` | LS | AI 요청 로그 |
| `ggm-voice-ja`, `ggm-orient`, `ggm-desk`, `ggm-start`, `ggm-play`, `ggm-devid`, `ggm-a2hs`, `ggm-bkdest`, `ggm-ng-draft`, `ggm-upd-notes` | LS | 기타 기기별 설정 |

API 키는 **게임 데이터(`G`)가 아니라 기기 설정 키**에 있으므로 게임 백업/게시에 기본으로 섞이지 않습니다.

## 7. 마이그레이션: `fix(g)`

로드할 때마다 실행되는 **정규화 + 마이그레이션** 함수(저장 섹션).
- `safeIds`: id 형식(`^[\w-]{1,64}$`) 강제.
- 누락 배열/객체 기본값 채우기, 오래된 기본값 교체(예: 천장 70→150).
- 버전 플래그 기반 1회성 변환: `meta.materialTermNamesVersion`, `skillTrainingMaterialsVersion`, `ageTags`, `curve`, `owned[].levelCapVersion`, `combatVersion=2`(`v2Ensure`).
- 무언가 바뀌면 `g.__curveNew=true` → 시작 시 `markAll()`로 전체 저장.
- `repairRefs`: 사라진 캐릭터를 가리키는 톡·배너 정리. `syncEnemies`: 스테이지 적 → `lib` 적 그림 항목 생성.

새 필드·형식 변경을 넣을 땐 **`fix()`에 버전 플래그를 하나 추가해 1회 변환**하는 방식이 기존 관례입니다.
