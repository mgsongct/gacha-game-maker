/* ===== 0420-app-update — 불러올 때(상수·상태·리스너): 계층 파일 밖에 남은 옛 조각을 이름 순(불러오는 순서)으로 이음 ===== */

/* ── 0420-app-update.js에서 ── */
/* ===== 앱 업데이트 (GitHub에서 index.html 받기) ===== */
const LVKEY='starfall-live';

/* ---- public release channel ---- */
// 이 포크의 업데이트 채널. 원본(jjhk0803)을 가리키면 앱이 원본 빌드를 받아 포크 수정본을 덮어써요. APK 설치 파일은 원본 Releases에만 있어요
const RELEASE_REPO='mgsongct/gacha-game-maker';
let UPD=null;



let WEBUPD=null;
if(!IS_NATIVE){ setInterval(()=>{ if(document.visibilityState==='visible') checkWebUpdate(false); },30*60000); }
