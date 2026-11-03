# tools — 자기점검·정적분석

tree-sitter(`web-tree-sitter` + `tree-sitter-javascript`)로 소스를 구문 트리로 읽고, ast-grep(`@ast-grep/napi`) 패턴으로 품질 규칙을 찾아요. 빌드와 같은 순서로 `src/main/`을 한 스크립트로 이어 붙여 분석하고(이 앱은 main이 한 스크립트라 파일끼리 함수를 바로 부름), 결과의 줄 번호는 원본 파일로 돌려 줘요.

```bash
npm ci --prefix tools
node tools/check.mjs            # 요약 + tools/out/report.md · flow.mmd · report.json
node tools/check.mjs --strict   # 오류가 있으면 exit 1 (CI)
node tools/test.mjs             # 도구 자체 검사
node tools/fix.mjs [--apply]    # 안 쓰는 함수·변수·액션 case 정리(기본은 미리 보기, 지운 뒤 생긴 것까지 되풀이)
```

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
| 안 쓰는 코드 | 선언 말고는 코드·문자열·HTML 어디에도 이름이 없는 함수·최상위 변수 | 목록 |

## 규칙 늘리기
- tree-sitter 분석은 `lib/graph.mjs`(구조)·`lib/flow.mjs`(흐름), ast-grep 패턴은 `lib/quality.mjs`의 `sgRules`
- 새 규칙을 넣으면 `test.mjs`의 예시 src에 그 문제를 하나 심고 잡히는지 확인

## 알려진 한계
- 멤버 호출(`obj.method()`)·문자열로 부르는 함수(`window[name]()`)는 그래프에 안 들어가요(안 쓰는 함수 판단은 이름 문자열 검색이라 안전한 쪽)
- 상태 흐름은 `G`·`P()`와 같은 함수 안 별칭만 따라가요. 다른 함수로 넘긴 객체(`c`, `ch`)의 변경은 저장 표시 검사에서 빠져요
- 화면에 안 보이는 설정은 휴리스틱(화면 함수 이름 규칙)이라 내부 표시값이 섞일 수 있어요
