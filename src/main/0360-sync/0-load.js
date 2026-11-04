/* ===== 0360-sync — 불러올 때(상수·상태·리스너): 계층 파일 밖에 남은 옛 조각을 이름 순(불러오는 순서)으로 이음 ===== */

/* ── 010-common.js에서 ── */
/* ===== 동기화 공통(PC 서버·GitHub 연동이 같이 씀): 동기화 설정·기기 이름·그림 색인·동기화할 저장 키와 합치기·진행 막대·오류 문구·해시 ===== */
const SYKEY='ggm-sync', SYIDX='ggm-sync-idx';
/* 저장 정책(사용자 지시 — 브라우저 저장소는 캐시, 원본은 PC 서버의 파일: 게임은 data/, 그 밖의 설정은 ggm-data/state.json — 자동 동기화).
   브라우저 저장소(appStorage·localStorage) 키마다 갈래를 한곳에서 정해요. 게임 저장(starfall-projects·starfall-contract-v1…)은 저장소가 따로 관리해요(GGMStorage.managed)
   sync   — 사용자가 만든 내용·게임에 필요한 설정: PC 서버·GitHub 둘 다
   secret — 비밀(API 키·토큰)이 든 설정: PC 서버에는 그대로, GitHub에는 [뺄 칸]을 빼고(null이면 보내지 않음). 받을 때 빠진 비밀은 이 기기 것을 지킴
   keep   — 받을 때 이 기기 값을 지키는 칸(연동 설정의 기기 이름)
   device — 이 기기에만 의미 있는 값 · cache — 다시 만들 수 있는 캐시·기록 · legacy — 예전 형식 키(읽어서 새 키로 옮기기만) (셋 다 동기화 안 함)
   새 저장 키는 여기에 갈래를 정해요(tools/map.mjs가 갈래 없는 키·목록과 다른 동기화를 막아요) */
const STORE_POLICY={
  sync:['starfall-setup-done','ggm-plessons','ggm-packs','ggm-llmslot','ggm-shared-assets','ggm-drafts','ggm-draft2'],
  secret:{'starfall-nai':['key'],'starfall-sound':['fishKey','elKey'],'starfall-ai-profiles':null,'ggm-sync':null,'ggm-pub':null},
  keep:{'ggm-sync':['device']},
  device:['ggm-devid','ggm-orient','ggm-desk','ggm-a2hs','ggm-pc','ggm-proxy','ggm-proxy-off','ggm-play','ggm-start','ggm-bkdest','ggm-ng-draft','ggm-sync-idx','ggm-sync-hold'],
  cache:['starfall-live','starfall-live-html','ggm-pthumb','ggm-voice-ja','ggm-ailog','ggm-upd-notes','starfall-nai-tperr'],
  legacy:['starfall-ai']
};
let SYJOB=null;

/* ── 020-pc-server.js에서 ── */
/* ===== PC 서버 (내 컴퓨터에 저장 · 휴대폰으로 접속) ===== */
let PCJOB=false;
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='hidden'&&!LKMODE()){ const pc=PCS(); if(pc&&pc.auto!==false&&(G.prog.savedAt||0)>(pc.localAt||0)+3000) pcPush(true); } });
setInterval(()=>{ const pc=PCS(); if(pc&&pc.auto!==false&&!PCJOB&&!LK.locked&&(G.prog.savedAt||0)>(pc.localAt||0)+3000) pcPush(true); },2*60000);
// IndexedDB는 캐시예요: 기기 저장이 끝날 때마다(5초 모아서) PC 서버의 data 폴더로 올려요
let PCSOON=null;addEventListener('ggm-storage-ok',()=>{ const pc=PCS(); if(!pc||pc.auto===false) return; clearTimeout(PCSOON); PCSOON=setTimeout(()=>{ const o=PCS(); if(o&&!PCJOB&&!LK.locked&&(G.prog.savedAt||0)>(o.localAt||0)) pcPush(true); },5000); });

/* ── 030-github.js에서 ── */
/* ===== PC·폰 연동 (내 GitHub 비공개 저장소) ===== */

// 앱을 내릴 때(화면이 숨겨질 때) 자동 올리기를 켰고 마지막 올린 뒤 바뀐 게 있으면 올려요(한 기기만 플레이 모드가 아닐 때)
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='hidden'&&!LKMODE()){ const o=SY(); if(syReady()&&o.autoUp&&!SYJOB&&(G.prog.savedAt||0)>(o.localAt||0)+5000) syPush(false); } });

/* ── 040-boot.js에서 ── */
/* ===== 켤 때 자동으로 최신 게임 받기 ===== */

let PULLERR='';
let PULLERR_QUOTA=false;
let PCWARNED=false;

/* ── 0400-publish-subscribe.js에서 ── */
/* ===== 게임 게시·구독 (구독형 업데이트) =====
   만든 사람: 내 GitHub 공개 저장소에 게임(콘텐츠 + 그림)을 올려요. 그림은 내용 해시로 저장해서 바뀐 것만 다시 올라가요.
   받는 사람: 주소로 구독하면 새 게임으로 추가되고, 켤 때 새 버전을 확인해 콘텐츠만 바꿔요(진행·보유·재화는 그대로). */
const PUBKEY='ggm-pub';
let PUBJOB=null;
let SUBCHK=null;

/* ── 050-single-device.js에서 ── */
/* ===== 한 번에 한 기기만 플레이 (다른 기기는 멈춤) ===== */
devIdEnsure();
const LK={locked:false,t:null,busy:false,claimed:false};
document.addEventListener('visibilitychange',async()=>{ if(!LKMODE()) return;
  if(document.visibilityState==='hidden'){ if(LK.claimed&&!LK.locked){ clearInterval(LK.t); try{ await lkSave(true); await lkOp('away'); }catch(e){ quietErr(e,'0360-sync/050-single-device.js:60'); } } }
  else setTimeout(lkActivate,600); });
document.addEventListener('keydown',e=>{ if(LK.locked){ e.stopImmediatePropagation(); if(e.key!=='Tab') e.preventDefault(); } },true);
