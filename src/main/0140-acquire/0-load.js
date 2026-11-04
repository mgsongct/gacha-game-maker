/* ===== 0140-acquire — 불러올 때(상수·상태·리스너): 계층 파일 밖에 남은 옛 조각을 이름 순(불러오는 순서)으로 이음 ===== */

/* ── 0140-pickup-new.js에서 ── */
/* ===== 신규 픽업 만들기 ===== */
let NEWPU=false;

/* ── 0150-pickup-existing.js에서 ── */
/* ===== 기존 대원 픽업: 이미 있는 대원을 골라 확률 업 배너를 열어요 ===== */
let PUX=null;
const PUBUSY=new Set();

/* ── 0500-gacha.js에서 ── */
/* =========================================================
   계약 연출
   ========================================================= */
let GC=null;
const SPARK=200;
const playGacha=noSkin(playGacha0);
const revealCard=noSkin(revealCard0);
const showCut=noSkin(showCut0);

/* ── 0505-construct.js에서 ── */
/* ===== 건조/영입 (자원 4종 투입식) ===== */
/* 엔진: modules/app/020-construct.js (GGMConstruct). 여기서는 게임 상태·화면·AI 연결만.
   설정: G.meta.construct(바꾼 값만 저장) · G.meta.variants(바리에이션 공통 설정) · 진행: P().cres(자원) · P().cbuild(기록·발견한 레시피) */
const CON_RES=GGMConstruct.RES;
// 특수 레시피(소속·특정 캐릭터 확률 업). 분류 확률은 groups가 정해서 기본은 비워 둬요. 예: {id:'rc_x',name:'새벽 설계',min:[400,400,400,600],effect:{type:'faction',value:'새벽등대',up:3},hint:'부품을 넉넉히'}
const CON_RECIPES=[];

const conGem=()=>`<span style="display:inline-flex;width:1em;height:1em;vertical-align:-.15em">${rIco('gems')}</span>`;
const conResIcon=k=>`<i class="ricon-t" style="font-style:normal">${['⛽','✴','⬢','⚙'][CON_RES.indexOf(k)]}</i>`;




let CONJOB=false;


const CON_STATS=[['hp','체력'],['atk','공격'],['def','방어'],['spd','속도']];
let CONV=null; // 설정 창에서 고치는 중인 바리에이션(저장 전에는 게임에 반영 안 됨)

document.addEventListener('click',e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act;
  if(a==='conbuild') conBuild();
  else if(a==='conbuy') conBuy(el.dataset.k);
  else if(a==='conpreset'){ const v=el.dataset.v.split(',').map(Number); v.forEach((x,i)=>{ const n=$('#con_'+i), r=$('#con_r'+i); if(n) n.value=x; if(r) r.value=x; }); const info=$('#conInfo'); if(info) info.innerHTML=conInfoHTML(GGMConstruct.normalize(v,CON())); progSlot('cbuild').input=GGMConstruct.normalize(v,CON()); }
  else if(a==='contoggle'){ if(conOn()){ G.meta.construct.on=false; mark('meta'); render(); } else openConSet(); }
  else if(a==='conset') openConSet();
  else if(a==='consave') conSave();
  else if(a==='convadd'){ CONV=[...conReadVariants(),{id:'v_'+uid(),name:'새 바리에이션',prompt:'',brief:'',chance:30,recipe:{min:[200,200,200,400]},rarity:'same',on:true,cond:{}}]; $('#con_vars').innerHTML=CONV.map(conVariantRow).join(''); }
  else if(a==='convdel'){ CONV=conReadVariants(); CONV.splice(+el.dataset.i,1); $('#con_vars').innerHTML=CONV.map(conVariantRow).join(''); } });
document.addEventListener('input',e=>{ const i=e.target.dataset&&e.target.dataset.con; if(i==null) return; const v=e.target.value; const el=$('#con_'+i), r=$('#con_r'+i); if(el&&el!==e.target) el.value=v; if(r&&r!==e.target) r.value=v;
  const input=GGMConstruct.normalize(conReadInput(),CON()), info=$('#conInfo'); if(info) info.innerHTML=conInfoHTML(input); progSlot('cbuild').input=input; });
