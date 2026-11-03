// 글 AI 요청 → kind(응답 파일 이름). 브라우저(생성 본체)와 노드(rekind.mjs) 양쪽에서 같은 규칙을 쓰려고 순수 함수로 둔다.
//   기본 단계: world · chars · opening · chapter1, 스킬 설계: skill-<대원 이름>-<그 대원의 n번째 요청>
//   그 밖: <phase>-<요청 첫머리>-<프롬프트 전체 해시 6자> — 앞부분(규칙·컨텍스트)이 같은 요청(예: 스테이지별 대본)도 서로 구분됨
export function kindOf(p, phase, seenSkill) {
  if (/속성\(elems\)은/.test(p)) return 'world';
  if (/debut 항목/.test(p)) return 'chars';
  if (/이 게임의 시작 부분을 만들어라/.test(p)) return 'opening';
  if (/프롤로그 다음으로 이어지는 1장/.test(p)) return 'chapter1';
  if (/캐릭터의 패시브·액티브·궁극기를 한 주역할로 설계하세요/.test(p)) { const nm = (p.match(/"name":"([^"]+)"/) || [, 'x'])[1]; seenSkill[nm] = (seenSkill[nm] || 0) + 1; return `skill-${nm}-${seenSkill[nm]}`; }
  const stage = (p.match(/\[스테이지 (\d+)[^\]]*\]/) || [])[1], head = p.replace(/^[\s\S]*?(다음[^\n]{0,30}|[^\n]{0,40}(만들어라|써라|정하라|작성하라|구성하라))/, '$1').slice(0, 24).replace(/[^\w가-힣]+/g, '_');
  let h = 2166136261; for (let i = 0; i < p.length; i++) { h ^= p.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return `${phase}-${head}${stage ? '-s' + stage : ''}-${h.toString(36).padStart(7, '0').slice(-6)}`;
}
