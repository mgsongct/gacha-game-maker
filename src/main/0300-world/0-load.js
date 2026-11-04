/* ===== 0300-world — 불러올 때(상수·상태·리스너): 계층 파일 밖에 남은 옛 조각을 이름 순(불러오는 순서)으로 이음 ===== */

/* ── 0300-codex.js에서 ── */
/* ===== 도감 (로어북) ===== */
const CX_CATS=[['all','전체'],['world','세계'],['faction','세력'],['person','인물'],['place','장소'],['item','물건'],['term','용어'],['history','역사'],['enemy','적']];
const CX_LABEL=Object.fromEntries(CX_CATS);
let CXCAT='all';

let CXMEMO=null;

/* ── 0445-factions.js에서 ── */
/* ===== 세력 설계 · 몬스터 도감 · 등장/영입(캐스팅) 관리 ===== */
/* 1) 세력 G.world.factions[]: {name,desc,kind,goal,leader,base,ideology,secret,origin,nature,weakness,rel:{세력:관계},stance:[{ch,s,why}]}
      kind: playable(플레이어블 소속) | hostile(적대 세력) | neutral(중립) | monster(괴물·마물 무리)
      stance: 플레이어와의 관계가 장마다 바뀜(ally·neutral·hostile). 예: 1~3장 적대 → 4장부터 동맹. 장 생성 때 AI가 바꿀 수 있음
   2) 몬스터 도감: 자료실 적(kind 'enemy', 캐릭터가 아닌 것)마다 faction·desc(정체)·nature(습성)·weak(약점)
      몬스터는 메신저·일정·인연 같은 커뮤 대상이 아님 → 새 캐릭터·NPC로 만들어지지 않게 막고(isMonsterLike), 예전 데이터는 점검
   3) 등장·영입: c.debut(첫 등장 스테이지)를 깨기 전에는 상시·픽업 뽑기·건조에 안 나옴, 소속 세력이 지금 적대면 잠금(설정).
      AI에는 "보유했지만 스토리에서 아직 안 만남 → 이미 계약해 함께 작전 중인 동료"를 알려 첫 만남처럼 쓰지 않게 함
   문서: docs/research/factions-cast.md */
const FKIND={playable:'플레이어블 소속',hostile:'적대 세력',neutral:'중립',monster:'괴물·마물'}, FSTANCE={ally:'우호',neutral:'중립',hostile:'적대'};
const F_FIELDS=[['desc','개요'],['goal','목적'],['leader','지도자·핵심 인물'],['base','거점·영역'],['ideology','이념·규칙'],['secret','숨겨진 사실(작가용)']], M_FIELDS=[['origin','정체·기원'],['nature','습성·행동'],['weakness','약점']];
// 몬스터: 자료실 적 중 캐릭터·NPC가 아닌 것
const SYS_ENEMY=/^(훈련 |강화 표적|탑의 )/; // 훈련·탑의 표적은 시스템 적

/* 화면 */
let FW_TAB='fac';
document.addEventListener('click',async e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act;
  if(a==='fwopen') openWorldDesign();
  else if(a==='fwtab'){ fwRead(); openWorldDesign(el.dataset.k); }
  else if(a==='fwsave'){ fwRead(); toast('세력·등장 설정을 저장했어요'); openWorldDesign(); }
  else if(a==='fwadd'){ fwRead(); factionSync().push({name:'새 세력 '+(factions().length+1),desc:'',kind:'neutral',rel:{},stance:[]}); openWorldDesign('fac'); }
  else if(a==='fwmon'){ const c=charById(el.dataset.id); if(c&&(await appConfirm(`「${c.name}」을(를) 몬스터(적)로 바꿀까요? ${T('gacha')}·톡·일정·인연에서 빠져요.`))){ charToMonster(c); toast('몬스터로 바꿨어요'); openWorldDesign('cast'); } }
  else if(a==='fwai'){ if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; } fwRead(); if(await factionAI(uiProg(el),($('#fw_ins')||{}).value||'')){ toast('세력·몬스터 설정을 채웠어요'); openWorldDesign(); } } });

/* ── 0450-relations-memory.js에서 ── */
/* ===== 인물 관계도 · 스토리 기억 =====
   관계는 두 사람(대원·NPC·플레이어) 사이의 기록이에요. 로어북처럼 글에 이름이 나오면 그 사람의 관계만 골라 AI에 넣어요. */
const REL_ME='me';
let RELC=REL_ME;
let RELUNDO=null;
/* src/main/0250-story-factory.js에서 옮김 */
