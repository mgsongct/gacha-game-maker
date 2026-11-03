# tools — 자기점검·정적분석

tree-sitter(`web-tree-sitter` + `tree-sitter-javascript`)로 소스를 구문 트리로 읽고, ast-grep(`@ast-grep/napi`) 패턴으로 품질 규칙을 찾아요. 빌드와 같은 순서로 `src/main/`을 한 스크립트로 이어 붙여 분석하고(이 앱은 main이 한 스크립트라 파일끼리 함수를 바로 부름), 결과의 줄 번호는 원본 파일로 돌려 줘요.

```bash
npm ci --prefix tools
node tools/check.mjs            # 요약 + tools/out/report.md · flow.mmd · report.json
node tools/check.mjs --strict   # 오류가 있으면 exit 1 (CI)
node tools/test.mjs             # 도구 자체 검사
```

## 무엇을 보나

| 분석 | 방법 | 결과 |
|---|---|---|
| 파싱 오류 | tree-sitter ERROR·MISSING 노드 | **오류** (예: 한 줄짜리 코드 중간에 `//` 주석을 넣어 뒤가 잘림) |
| 최상위 이름 충돌 | main 한 스크립트의 `const/let/class`와 같은 이름 | **오류**(실행 시 SyntaxError) · 함수 두 번 정의는 **오류**(뒤가 앞을 덮음) |
| 콜 그래프·콜스택 | 함수 선언·호출(가장 안쪽 이름 있는 함수에 붙임). 타이머·프로미스·이벤트 콜백 안 호출은 비동기 간선 | 가장 깊은 **동기** 호출 사슬, 서로 부르는 순환(Tarjan SCC) |
| 가중치·병목·경합 | 팬인(부르는 함수 수)·호출 수·순환 복잡도(분기·논리 연산) | 팬인 × log(복잡도) 상위, 상태를 바꾸는 허브는 "경합 주의" |
| 조건·분기 복잡도 | if·for·while·case·catch·삼항·&&·\|\|·?? 개수, 중첩 깊이 | 복잡도 ≥40 · 120줄 이상 · 중첩 ≥7 |
| 화면 액션 흐름 | 발신: `data-act="x"`(템플릿 안 `${…}` 문자열 포함)·`dataset.act='x'` / 처리: `switch(a)`의 case, `dataset.act`로 만든 변수와의 비교, `['x'].includes(a)`, `closest('[data-act="x"]')` | **처리기 없는 액션(오류)**, 발신 없는 처리기, 같은 액션을 문서 전역 리스너 여러 곳에서 처리(이벤트 종류별, 특정 요소에 붙인 리스너는 제외) |
| 상태 → 저장 | `G.*`·`P().*`에 대입·delete·push/splice 하는 함수 | 자신·호출자 모두 `mark()` 등 저장 표시가 없으면 경고(대문자 접근자 `PLAN()` 등의 지연 기본값은 제외) |
| 데이터 ↔ 화면 | `G.meta.x`·`G.world.x`·`G.x`·`P().x`(별칭 `const p=P()` 포함)를 쓰는 함수·읽는 함수, 화면 함수(`…HTML`·`…Panel`·`render`·`open…`) | 여러 곳에서 쓰는 상태(소유자 분산), 쓰기만 하는 키, 화면에 안 보이는 설정. `flow.mmd`(Mermaid: 쓰는 함수 → 상태 → 화면) |
| 다중화·파편화 | 같은 본문 함수(주석·공백 무시 해시), 3번 이상 되풀이되는 60자 이상 문자열(흩어진 프롬프트·문구), 문서 전역 클릭 리스너 수 | 경고·목록 |
| ast-grep 규칙 | `document.addEventListener('click', $$$)`, `try {…} catch ($E) {}`(빈 catch), `$EL.innerHTML = $V`의 esc() 없는 `${x.name}` | 목록 |
| 안 쓰는 코드 | 선언 말고는 코드·문자열·HTML 어디에도 이름이 없는 함수·최상위 변수 | 목록 |

## 규칙 늘리기
- tree-sitter 분석은 `lib/graph.mjs`(구조)·`lib/flow.mjs`(흐름), ast-grep 패턴은 `lib/quality.mjs`의 `sgRules`
- 새 규칙을 넣으면 `test.mjs`의 예시 src에 그 문제를 하나 심고 잡히는지 확인
