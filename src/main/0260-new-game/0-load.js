/* ===== 0260-new-game — 불러올 때(상수·상태·리스너): 계층 파일 밖에 남은 옛 조각을 이름 순(불러오는 순서)으로 이음 ===== */

/* ── 010-draft.js에서 ── */
/* ===== 새 게임 초안 (작가 설정을 직접 자세히 적고 만들기) ===== */
const DR2KEY='ggm-draft2';
let DR2=null, DRTAB='theme';
const DR_TABS=[['theme','테마'],['world','세계관'],['setting','설정'],['chars','인물'],['hero','주인공']];
/* 초안 보관함: 이름 붙여 여러 개 저장하고 다시 불러와요. 게임을 만들면 그 게임에도 초안이 같이 저장돼요 */
const DRLIB='ggm-drafts';
const drName=d=>String(d.gtitle||'').trim()||String(d.mode==='auto'?d.auto:d.kw||'').trim().slice(0,24)||'이름 없는 초안';
// 초안 내보내기·가져오기: 코드 한 줄(GGMDRAFT:…) 또는 파일(.json)로 다른 기기·다른 게임에 옮겨요
const draftCode=(d,name)=>{ const x=drClean(d); delete x.reuse; return 'GGMDRAFT:'+btoa(unescape(encodeURIComponent(JSON.stringify({v:1,name:name||drName(d),d:x})))); };
let DRX=null; // 내보낼 초안 {name,d}
let DRAVU=null;
document.addEventListener('input',e=>{ if(e.target.closest&&e.target.closest('#drPage')){ clearTimeout(drRead._t); drRead._t=setTimeout(drRead,400); } });
document.addEventListener('change',e=>{ const cy=e.target&&e.target.dataset&&e.target.dataset.cyc; if(cy){ const L=P().live; L.cyc=Object.assign({},L.cyc||{},{[cy]:+e.target.value}); mark('prog'); render(); toast(`${cycLabel(cy)} 주기로 바꿨어요`); return; } });
document.addEventListener('change',e=>{ if(e.target.closest&&e.target.closest('#drPage')){ drRead(); if(e.target.dataset&&e.target.dataset.dc==='kind') drRerender(); } });
// 장르·키워드와 분위기에 같은 글이 들어 있으면(한쪽이 다른 쪽을 품으면) 분위기는 한 번만 써요
const dupTxt=(a,b)=>{ const n=x=>String(x||'').replace(/[\s"'“”‘’.,!?~·…]/g,''); a=n(a); b=n(b); return !!(a&&b&&(a.includes(b)||b.includes(a))); };
/* 중복 문장 정리(시스템, AI 없이): 앞 칸에 이미 나온 문장과 같거나 그 문장 안에 통째로 들어 있는 문장은 뒤 칸에서 지워요.
   같은 칸 안에서 되풀이된 문장도 지워요. 더 긴 문장이 짧은 문장을 품으면 긴 문장은 남겨요(내용이 줄지 않게) */
const sentKey=x=>String(x||'').replace(/[\s"'“”‘’「」『』()\[\].,!?~·…:;\-–—]/g,'').toLowerCase();

/* ── 020-build.js에서 ── */
/* ===== 새 게임 만들기: 초안(작가 설정) → 단계별 생성(세계·대원·1장) → 마무리(시작 자원·희귀도·재료 던전·상점) · 그림 유지 리롤 ===== */
// 이름 짝짓기: 띄어쓰기·괄호 설명을 빼고 비교해요("아린 (검사)" = "아린")
const nameKey=x=>String(x||'').replace(/\s*[(（\[][^)）\]]*[)）\]]\s*/g,'').replace(/\s+/g,'').toLowerCase();
const nameEq=(a,b)=>!!nameKey(a)&&nameKey(a)===nameKey(b);
