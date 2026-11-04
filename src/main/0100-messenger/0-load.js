/* ===== 0100-messenger — 불러올 때(상수·상태·리스너): 계층 파일 밖에 남은 옛 조각을 이름 순(불러오는 순서)으로 이음 ===== */

/* ── 0100-messenger.js에서 ── */
/* =========================================================
   메신저: 등대톡
   ========================================================= */
const threadById=id=>G.threads.find(t=>t.id===id);
const threadChar=t=>t&&charById(t.charId);
let PH=null;
const chatImgCache={};
(function(){ const i=document.createElement('input'); i.type='file'; i.id='chatfile'; i.accept='image/*'; i.hidden=true; document.body.appendChild(i);
  i.addEventListener('change',e=>{ const f=e.target.files[0]; e.target.value=''; chatPhotoPick(f); }); })();
const PH_FREE_SW=`<button class="linkb ph-sw2" data-act="phmode" data-v="free">⌨ 직접 입력으로 전환</button>`;
let FCBUSY=false;

/* ── 0160-player-profile.js에서 ── */
/* ===== 플레이어(관리관) 프로필 — 호칭·성별·외형·소개, 아바타 그리기 ===== */
const EYE_TAG=/\b(eyes?|eyelash(es)?|pupils?|heterochromia|eyeliner|tsurime|tareme|sanpaku|jitome)\b/i;

const genderCode=g=>/^(남|남성|남자|male|man)$/i.test(g||'')?'m':/^(여|여성|여자|female|woman)$/i.test(g||'')?'f':'';

document.addEventListener('keydown',e=>{ if(e.target&&e.target.id==='fcIn'&&e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); if(e.isComposing||e.keyCode===229) return; fcSend(); } });
document.addEventListener('input',e=>{ if(e.target&&e.target.id==='fcIn'){ const t=e.target; t.style.height='auto'; t.style.height=Math.min(120,t.scrollHeight)+'px'; } });
// 휴대폰 키보드·주소창 때문에 입력칸이 가려지지 않게, 보이는 화면 높이에 맞춰요
(function(){ const vv=window.visualViewport; if(!vv) return; const fit=()=>{ const ph=document.getElementById('phone'); if(!ph||ph.hidden) return; ph.style.top=vv.offsetTop+'px'; ph.style.height=vv.height+'px'; ph.style.bottom='auto'; const el=document.getElementById('phChat'); if(el&&document.activeElement&&document.activeElement.id==='fcIn') el.scrollTop=el.scrollHeight; };
  vv.addEventListener('resize',fit); vv.addEventListener('scroll',fit); new MutationObserver(fit).observe(document.getElementById('phone'),{attributes:true,attributeFilter:['hidden']}); })();
