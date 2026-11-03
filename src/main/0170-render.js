/* =========================================================
   렌더
   ========================================================= */
let tab='lobby', PREVTAB='lobby', RG_LIVE=false;
const PHONE_SVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8M8 13h5"/></svg>';
/* 플레이 모드: 만들기·편집·AI 설정을 숨기고 게임만 해요(이 기기에만 저장) */
// 구독한 게임은 만든 사람이 콘텐츠를 올려요: 늘 플레이 모드(편집·만들기·자체 업데이트 없음, AI 키 없이 플레이)
function subLocked(){ try{ return !!(typeof G!=='undefined'&&G&&G.meta&&G.meta.subscr); }catch(e){ return false; } }
function playMode(){ if(subLocked()) return true; try{ return appStorage.getItem('ggm-play')==='1'; }catch(e){ return false; } }
const PLAY_HIDE_ST=['lib','text','img','live','conn'];
