# tools — 자기점검·정적분석

tree-sitter(`web-tree-sitter` + `tree-sitter-javascript`)로 소스를 구문 트리로 읽고, ast-grep(`@ast-grep/napi`) 패턴으로 품질 규칙을 찾아요. 빌드와 같은 순서로 `src/main/`을 한 스크립트로 이어 붙여 분석하고(이 앱은 main이 한 스크립트라 파일끼리 함수를 바로 부름), 결과의 줄 번호는 원본 파일로 돌려 줘요.

분석 대상: `src/main/`(한 스크립트) · `src/modules/**` · `src/boot/*.js` · `src/index.html` · **`src/style/*.css`**(ast-grep CSS) · **부속 파일** `www/sw.js` · `proxy/**` · `build/*.mjs` · `tools/**`(JS 파싱) · `pc/*.py`(python3가 있으면 구문 검사)

```bash
npm ci --prefix tools
node tools/check.mjs            # 요약 + tools/out/report.md · flow.mmd · report.json
node tools/check.mjs --strict   # 오류가 있거나 기준선보다 새로 생기거나 나빠진 항목이 있으면 exit 1 (CI)
node tools/check.mjs --diff HEAD          # 이번 변경으로 새로 생김·나빠짐·해결 (git 기준 트리에 같은 분석을 돌려 비교 → out/diff.md)
node tools/check.mjs --update-baseline    # 줄었을 때 기준선(tools/baseline.json) 낮추기 — 늘었으면 거부(코드를 고침)
node tools/test.mjs             # 도구 자체 검사
node tools/fix.mjs [--apply]    # 안 쓰는 함수·변수·액션 case 정리(기본은 미리 보기, 지운 뒤 생긴 것까지 되풀이)
```

생성 기능과 **생성된 게임**의 QA·플레이 점검(브라우저로 실제 앱을 돌림)은 [play/README.md](play/README.md): `generate.mjs`(글 AI 응답을 파일로 주고받으며 게임 생성·재생) · `qa.mjs` · `shots.mjs` · `faults.mjs` · `test.mjs`.

## 무엇을 보나

| 분석 | 방법 | 결과 |
|---|---|---|
| 파싱 오류 | tree-sitter ERROR·MISSING 노드 | **오류** (예: 한 줄짜리 코드 중간에 `//` 주석을 넣어 뒤가 잘림) |
| 최상위 이름 충돌 | main 한 스크립트의 `const/let/class`와 같은 이름 | **오류**(실행 시 SyntaxError) · 함수 두 번 정의는 **오류**(뒤가 앞을 덮음) |
| 콜 그래프·콜스택 | 함수 선언·호출. **이름은 유효 범위로 찾음**(지역 함수·매개변수·지역 변수가 같은 이름의 전역 함수를 가림, 중첩 함수는 따로). 타이머·프로미스·이벤트 콜백 안 호출은 비동기 간선 | 가장 깊은 **동기** 호출 사슬, 동기 순환(Tarjan SCC) + 멈춤 조건 추정(깊이·바쁨·방문 검사 뒤 return), 비동기를 거치는 순환은 따로 |
| 가중치·병목·경합 | 팬인(부르는 함수 수)·호출 수·순환 복잡도(분기·논리 연산) | 팬인 × log(복잡도) 상위, 상태를 바꾸는 허브는 "경합 주의" |
| 조건·분기 복잡도 | if·for·while·case·catch·삼항·&&·\|\|·?? 개수, 중첩 깊이. 액션 분배기(`switch(a)`가 중심)는 **case마다** 잼 | 복잡도 ≥40 · 120줄 이상 · 중첩 ≥7, 분배기 case 복잡도 ≥20 · 중첩 ≥5 |
| 화면 액션 흐름 | 발신: `data-act="x"`(템플릿 안 `${…}` 문자열 포함)·`dataset.act='x'`·`src/index.html`·**도우미 인자**(`ico('daily')` → `function ico(act){…data-act="${act}"…}`) / 처리: `switch(a)`의 case, `dataset.act`로 만든 변수와의 비교, `['x'].includes(a)`, `closest('[data-act="x"]')` | **처리기 없는 액션(오류)**, 발신 없는 처리기, 같은 액션을 문서 전역 리스너 여러 곳에서 처리(이벤트 종류별, 특정 요소에 붙인 리스너는 제외) |
| 분배 표 | `APP_ACTION_HANDLERS = {"act": handleXAction}` 같은 큰 표 ↔ 그 처리기의 case | 표에 있지만 case 없음(**오류** — 눌러도 아무 일 없음), case가 있지만 표에 없음(실행 안 되는 코드) |
| 상태 → 저장 | `G.*`·`P().*`에 대입·delete·push/splice 하는 함수 | 자신·호출자 모두 `mark()` 등 저장 표시가 없으면 경고(대문자 접근자 `PLAN()` 등의 지연 기본값은 제외) |
| 데이터 ↔ 화면 | `G.meta.x`·`G.world.x`·`G.x`·`P().x`(별칭 `const p=P()`, `G.prog` = `P()` 포함)를 쓰는 함수·읽는 함수, 화면 함수(`…HTML`·`…Panel`·`render`·`open…`) | 여러 곳에서 쓰는 상태(소유자 분산), 쓰기만 하는 키, 화면에 안 보이는 설정. `flow.mmd`(Mermaid: 쓰는 함수 → 상태 → 화면) |
| 다중화·파편화 | 같은 본문 함수(주석·공백 무시 해시), 3번 이상 되풀이되는 60자 이상 문자열(흩어진 프롬프트·문구), 문서 전역 클릭 리스너 수 | 경고·목록 |
| ast-grep 규칙 | `document.addEventListener('click', $$$)`, `try {…} catch ($E) {}`(빈 catch — 파싱 대체·저장소 대체·동기 대체·의도 표시(주석)·**비동기 작업(경고 — `quietErr(e,'위치')`로 기록)**), `$EL.innerHTML = $V`의 esc() 없는 `${x.name}` | 목록 |
| 안 쓰는 코드 | 선언 말고는 코드·문자열·HTML·브라우저 테스트(`build/test.mjs`) 어디에도 이름이 없는 함수·최상위 변수(`fix.mjs`와 같은 기준) | 목록 |
| DOM id 참조 | 찾는 쪽: `$('#x')`·`getElementById('x')`·`querySelector('#x …')`·`closest` / 만드는 쪽: `id="x"`·`.id='x'`·`setAttribute('id')`·**도우미 인자**(`onoff('sd_bon')` → `id="${id}"`)·접두사(`id="row_${i}"`, 한 글자 접두사는 뒤가 숫자일 때만). 선택자 목록(`'#a,.b'`)은 하나라도 맞으면 통과 | 아무도 만들지 않는 id를 찾는 코드 **경고**(지운 화면의 흔적 — 늘 null) |
| HTML 주입 | **모든 HTML 템플릿**(태그가 든 \`…\`)의 `${…}` 중 esc() 없는 글(`.name`·`.title`·`.desc`·`.text`·`.prompt`… — `||`·`??`·삼항 가지까지), 상수 표에서 온 값(`UPPER.x`·`UPPER.map(v=>…)`·`Object.entries(UPPER)`·`const v=UPPER[k]`)은 통과. 용어 `T()`·`sub()`는 함수 안에서 `<`를 거르지 않으면 같이 잡음 | **경고**(AI·가져온 게임·공유받은 게임의 글이 태그로 실행 — 키 유출 위험) |
| 저장 키 | `mark('x')`·`mark('c:'+id)` ↔ `writeKey`의 `k==='x'`·`k.startsWith('x')` | 모르는 키 **경고**(전체 스냅샷엔 들어가도 PC·클라우드 문서 저장에서 빠짐) |
| 전역 리스너 누수 | `document`·`window`·전역 `addEventListener`를 여러 번 도는 곳(다른 함수가 부르는 함수·이벤트 콜백)에서 붙임 — `once`·`signal`·같은 이벤트·같은 처리기 `removeEventListener`가 없으면. 즉시 실행·최상위·한 번만 부르는 초기화는 제외 | **경고** |
| CSS | 파싱 오류(ast-grep ERROR)·**괄호 짝**(주석·문자열 빼고 — 닫히지 않은 `{`는 ast-grep이 조용히 복구해서 따로 셈), 코드·HTML 어디에도 없는 클래스 선택자(동적 접두사 `ls-${…}`·`'r-'+k`는 씀) | 오류 · 안 쓰는 클래스 목록 |
| 부속 파일 | 서비스 워커·중계 서버(Cloudflare·Vercel)·빌드·도구 스크립트 tree-sitter 파싱, PC 서버 파이썬 `ast.parse` | **오류** |
| 중계 서버 허용 주소 | 두 중계 서버의 `ALLOW_HOSTS`가 같은지, 앱이 부르는 API 주소(호출 첫 인자·`base`/`url`/`endpoint` 값·`…DEF`/`…ENDPOINT` 상수의 https 주소 중 API 모양)가 목록에 있는지 | **경고**(웹 버전 중계에서 host not allowed) |

## 포크 기능 배선 점검 (`node tools/wiring.mjs [--strict] [--update-baseline]`)
생성기가 포크 기능의 데이터를 만드는지, 생성된 게임에 실제로 들어갔는지를 tree-sitter로 맞춰 봐요(`lib/wiring.mjs`, 목록 `fork-features.json`). 결과 `out/wiring.md`.

| 단계 | 방법 |
|---|---|
| 기능의 범위 | `fork-features.json`의 커밋마다 그 커밋 트리 − 부모 트리의 최상위 함수(= 그 기능이 들여온 함수). git 트리의 `src/`만 `out/ref-src/<sha>/`에 풀어 캐시 |
| 기능이 읽는 데이터 | 그 함수들이 읽는 `G.meta.*`·`G.world.*`·`G.*`·`P().*` 키(상태 흐름 분석) + 게임 컬렉션 콜백·찾기 함수에 묶인 변수(`G.chars.map(c => c.x)`, `const c = charById(…)`)에서 읽는 **원본에 없던 필드** |
| 생성기가 만드는 것 | `generators`(buildNewGameDraft 등)에서 부르는 함수(깊이 3)의 `ng.*`·`G.*` 대입과 `Object.assign` 리터럴 키, 프롬프트 JSON 스키마의 `부모/키`(world/plan 등), 생성기 파일 안 객체 리터럴 키 |
| 기능 쪽 기본값 | 읽는 곳이 `키 \|\| 기본값`·`Object.assign(기본값, 키)`·`if(!x.키) x.키 = 기본값`이면 지연 기본값 — 빈 값([]·{})인지 쓸 만한 값인지 리터럴로 판단. 원본 샘플 기본값은 `DEFAULT_META`·`DEFAULT_WORLD`·`DEFAULT_PROG` 리터럴 |
| 생성된 게임 | `tools/play/games/*/game.json`(커밋된 결과)과 `regress/game.json`(지금 코드로 같은 응답을 다시 생성) — 값·빔·기본값·없음 |

판정: **P0** 생성기가 만들지 않고 생성 게임에도 없고 기능 기본값도 빈 값 → 기능이 비어 있는 채로 시작 · **P1** 공통 기본값으로만 시작(게임 맞춤 아님) / 생성기가 만드는 키인데 생성물에 없음 / 기능이 엔티티에서 읽는 새 필드가 어디에도 없음. 생성기가 정할 것이 아닌 키(사용자 설정)·공통 기본값으로 충분한 키·플레이 중 생기는 필드는 `fork-features.json`의 `userKeys`·`defaultOk`·`runtimeFields`에 **사유와 함께** 적어요. 판정은 `baseline.json`의 `wiring`으로 래칫(CI `--strict`).

## 이름 규칙 (`node tools/names.mjs [--apply] [--scope fork|all] [--strict] [--update-baseline]`)
분석이 헷갈리는 원인(같은 지역 이름 `b`·`e`·`x`가 배너·버튼·캐릭터, 적·이벤트·오류처럼 여러 종류에 쓰임)을 코드 품질 문제로 보고 정리하는 도구예요(`lib/names.mjs`, 규칙 `naming.json`, 결과 `out/names.md`).
- **자동 모으기**: 종류를 코드로 아는 바인딩만 셈 — 게임 컬렉션 콜백(`G.chars.map(c => …)`·`.stages`·`.enemies`·`G.lib`·`factions()`·`ELEMS` …), 찾기 함수 호출 자체(`const c = charById(…)`, `$('#x')` — `$('#x').value`처럼 호출 결과의 멤버는 아님), 이벤트 리스너 매개변수, catch 매개변수. 이름 × 종류 표
- **규칙**: `naming.json`(원칙과 함께 — 게임 엔티티 종류마다 고유 이름, 기반 종류 오류·이벤트 객체는 `e` 공유, DOM 요소 `el`). 자동 제안(가장 많이 쓴 이름)은 보고서에 참고로만
- **모호한 이름**: 규칙 이름이 아니면서 다른 종류에도 쓰이는 이름. 범위(포크 코드/원본 코드)는 둘러싼 최상위 함수가 원본 트리(`49cec7a`)에 있었는지로 나눔
- **치환** `--apply`: 기본은 포크 코드만(원본 코드를 대량으로 바꾸면 원본 업데이트 반영이 어려움 — CLAUDE.md §0). 범위 안에 새 이름이 이미 있거나, 바깥 범위의 같은 이름을 가리게 되거나, 구조 분해 단축 속성이면 건너뜀. 단축 속성 `{c}`는 `{c: ch}`로. 바꾼 뒤 빌드·테스트
- **래칫**: 파일·범위별 개수를 `baseline.json`의 `names`로(CI `--strict`)

## 위반 래칫 (기준선·변경 비교)
- 모든 발견(오류·경고·복잡한 함수·복잡한 익명 콜백·분배기 case·동기 순환·안 쓰는 코드·되풀이 문자열·빈 catch(파일·종류별 개수)·흩어진 상태·쓰기만 하는 키·발신 없는 처리기·안 쓰는 CSS·도구 메타 점검)을 **줄 번호 없는 키**로 바꿔 비교해요(`lib/ratchet.mjs`). 줄만 밀린 것은 같은 항목
- **새로 생김**(기준에 없던 키) · **나빠짐**(같은 항목의 복잡도·줄·중첩·횟수·개수 증가) · 해결 · 좋아짐
- 기준선 `tools/baseline.json`은 커밋돼 있고, CI의 `--strict`가 새로 생김·나빠짐을 막아요. 점검 항목을 새로 늘려 원래 있던 것이 처음 보이게 됐을 때만 `--update-baseline --force`(커밋 메시지에 이유)
- `--diff <기준>`은 기준 커밋을 `out/ref/<sha>/`에 풀어(git archive) 같은 분석을 돌려요

## 메타 점검 (도구 자체)
- 도구 코드(`tools/**`, `build/*.mjs` — node_modules·out·fixtures·games·reports 제외)도 앱과 같은 규칙으로 봐요: 파싱 오류·빈 catch·복잡한 함수·복잡한 익명 콜백·같은 본문·되풀이 문자열·안 쓰는 함수. 보고서 끝 "도구 자체" 절, 래칫 대상
- 큰 익명 콜백(`page.evaluate(async () => {…})`, `addEventListener('click', e => {…})`)은 이름이 없어 함수 그래프에 안 들어가므로 `complexAnon`이 따로 재요. 이름은 `둘러싼 함수→부른 함수 @파일`

## 규칙 늘리기
- tree-sitter 분석은 `lib/graph.mjs`(구조)·`lib/flow.mjs`(흐름), ast-grep 패턴은 `lib/quality.mjs`의 `sgRules`
- 새 규칙을 넣으면 `test.mjs`의 예시 src에 그 문제를 하나 심고 잡히는지 확인

## 알려진 한계
- 멤버 호출(`obj.method()`)·문자열로 부르는 함수(`window[name]()`)는 그래프에 안 들어가요(안 쓰는 함수 판단은 이름 문자열 검색이라 안전한 쪽)
- 상태 흐름은 `G`·`P()`와 같은 함수 안 별칭만 따라가요. 다른 함수로 넘긴 객체(`c`, `ch`)의 변경은 저장 표시 검사에서 빠져요
- 화면에 안 보이는 설정은 휴리스틱(화면 함수 이름 규칙)이라 내부 표시값이 섞일 수 있어요
- HTML 주입은 글 모양 속성 이름(`.name`·`.desc`…)과 `T()`·`sub()`만 봐요. 지역 변수에 담았다 넣는 글(`const n=c.name; …${n}`)이나 다른 함수가 만든 HTML 조각은 못 따라가요
- DOM id는 정적 문자열만 봐요(`$('#'+id)`처럼 이어 붙인 선택자는 건너뜀). 안 쓰는 CSS 클래스는 이름 검색이라, 문자열을 쪼개 만드는 클래스는 쓰는 것으로 못 볼 수 있어요(목록만, 오류·경고 아님)
- 리스너 누수는 "다른 함수가 부르는 함수"를 여러 번 도는 것으로 봐요. 실제로 한 번만 부르면 경고가 지나칠 수 있어요
