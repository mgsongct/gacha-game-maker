/* ===== 0274-expedition — 불러올 때(상수·상태·리스너): 계층 파일 밖에 남은 옛 조각을 이름 순(불러오는 순서)으로 이음 ===== */

/* ── 0274-dispatch.js에서 ── */
/* ===== 파견 게시판: 매일 바뀌는 파견 의뢰(전투형 원정) — 의뢰 만들기·보낼 대원 고르기·완료 보상·화면. 전투가 아닌 원정 방식(아이돌·방송·경영)은 0275 ===== */
/* src/main/0180-ui-scroll.js에서 옮김 */
/* src/main/0270-skin-proposal.js에서 옮김 */
// 파견 게시판: 게임의 파견 목록은 이름·설명 견본이고, 실제 의뢰는 매일·완료할 때마다 새로 뽑아요. 보상은 시간×인원에 맞춰요.
const DISP_FOCUS={gold:['크레딧',2500],exp:['경험',6],wmat:['교본',4],core:['코어',0.5]};
let DSEL=null;

/* ── 0275-expedition.js에서 ── */
/* ===== 원정 모드 (전투형 원정 · 방송 출연 · 스트리머 · 경영) ===== */
/* 엔진: modules/app/030-expedition.js (GGMExpedition). 설정: G.meta.expedition(바꾼 값만) · 진행: P().exped
   combat 모드는 기존 파견(dispHTML·dispOffer) 그대로. 나머지 모드는 이 파일의 화면을 써요. 문서: docs/research/expedition.md */
const EX_MODE_LABEL={combat:['전투형 원정','지역에 보내 자원을 가져와요 (칸코레·소녀전선류)'],idol:['방송 출연','방송국·스폰서 일정에 나가 보수와 인지도를 얻어요 (아이돌 육성류)'],streamer:['콘텐츠 방송','플랫폼을 골라 영상·라이브·숏폼을 올려 수익과 구독자를 모아요 (스트리머·버튜버류)'],business:['경영','파트에 배치해 일하게 하고, 전체 실적과 평판으로 수익이 나와요 (상점·기업 경영류)']};


const exIco=k=>`<span style="display:inline-flex;width:1em;height:1em;vertical-align:-.15em">${rIco(k)}</span>`; // 아이콘 그림을 글자 크기로
const exBar=v=>`<span style="display:inline-block;width:60px;height:6px;background:var(--line);border-radius:3px;vertical-align:middle;overflow:hidden"><i style="display:block;height:100%;width:${v}%;background:${v>=60?'#4fd18b':v>=30?'#ffd35a':'#ff5a5a'}"></i></span> ${v}`;


document.addEventListener('click',e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act, id=el.dataset.id;
  if(a==='exjob'){ const o=exOffers(id), job=o.offers.find(x=>x.id===el.dataset.job); if(job) exStart(id,job); }
  else if(a==='exstream'){ const pf=EXC().streamer.platforms.find(p=>p.id===el.dataset.pf); if(pf) exStart(id,pf); }
  else if(a==='exrest') exRest(id,4);
  else if(a==='exclaim'){ exClaim(id); render(); }
  else if(a==='exclaimall'){ Object.keys(progSlot('exped').jobs).forEach(exClaim); render(); }
  else if(a==='exlib') exLibSettle();
  else if(a==='exsettle'){ exBizSettle(); render(); }
  else if(a==='exset') openExSet();
  else if(a==='exsave') exSave(); });
document.addEventListener('change',e=>{ const el=e.target; if(!el.dataset||el.dataset.exassign==null) return; exAssign(el.dataset.exassign,+el.dataset.slot,el.value||null); });
