/* ===== 0190-economy — 불러올 때(상수·상태·리스너): 계층 파일 밖에 남은 옛 조각을 이름 순(불러오는 순서)으로 이음 ===== */

/* ── 0190-shop.js에서 ── */
/* =========================================================
   상점 (무료 보급 상점, 캐시 상점)
   ========================================================= */
const RICON={
  gearMat:'<svg viewBox="0 0 24 24" fill="none" stroke="#e4ad74" stroke-width="2"><path d="m3 16 4-9h10l4 9-4 4H7zM3 16h18M7 7l3 9M17 7l-3 9"/></svg>',
  transcMat:'<svg viewBox="0 0 24 24" fill="none" stroke="#c9a1ff" stroke-width="2"><path d="m12 2 8 10-8 10-8-10zM12 2v20M4 12h16"/></svg>',
  gold:'<svg viewBox="0 0 24 24" fill="none" stroke="#e9c46a" stroke-width="2"><circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.5 10.5h4a1.5 1.5 0 0 1 0 3h-3"/></svg>',
  exp:'<svg viewBox="0 0 24 24" fill="none" stroke="#7fd8ff" stroke-width="2" stroke-linejoin="round"><path d="M4 5h7a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4zM20 5h-7a2 2 0 0 0-2 2"/><path d="M20 5v12h-7"/></svg>',
  wmat:'<svg viewBox="0 0 24 24" fill="none" stroke="#9ad17f" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/></svg>',
  core:'<svg viewBox="0 0 24 24" fill="none" stroke="#ff8ad1" stroke-width="2" stroke-linejoin="round"><path d="M12 2 21 7v10l-9 5-9-5V7z"/><path d="M12 8l4 2.5v4L12 17l-4-2.5v-4z"/></svg>',
  gems:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M9 3l3 18 3-18"/></svg>'};

const SHOP_ITEMS=()=>[
  {id:'free',name:'오늘의 무료 보급',give:{gold:3000,exp:10},cost:{},limit:1,tag:'FREE'},
  {id:'exp',name:T('expMat')+' ×20',give:{exp:20},cost:{gold:4000},limit:10},
  {id:'wmat',name:T('wMat')+' ×10',give:{wmat:10},cost:{gold:6000},limit:5},
  {id:'core',name:T('core')+' ×5',give:{core:5},cost:{gold:15000},limit:3},
  {id:'gem',name:T('currency')+' ×60',give:{gems:60},cost:{gold:20000},limit:2,tag:'HOT'},
  {id:'exp2',name:T('expMat')+' ×5',give:{exp:5},cost:{gold:800},limit:30},
  {id:'gift1',name:'선물 꾸러미 (무작위 1개)',give:{gift:1},cost:{gold:3000},limit:5,tag:'NEW'},
  {id:'gift5',name:'선물 꾸러미 ×5',give:{gift:5},cost:{gold:13000},limit:1}];
const SHOP_SWAP=()=>[
  {id:'x1',give:{wmat:10},cost:{exp:30}},{id:'x2',give:{exp:20},cost:{wmat:10}},
  {id:'x3',give:{gold:3000},cost:{core:1}},{id:'x4',give:{gold:1500},cost:{exp:10}},{id:'x5',give:{core:1},cost:{wmat:25}}];
let SHOP_LINE='';
const CASH_PACKS=[{id:'g1',gems:60,bonus:0},{id:'g2',gems:300,bonus:30},{id:'g3',gems:980,bonus:110},{id:'g4',gems:1980,bonus:260},{id:'g5',gems:3280,bonus:600},{id:'g6',gems:6480,bonus:1600}];
/* 자원 보급(₩0): 건조 자원(건조를 켰을 때)과 성장 재료를 낱개로 — 유료 상점 기분만 내는 무료 상점이라 모자란 자원은 여기서 채워요 */
const CASH_RES=()=>[...(conOn()?[...CON_RES.map(k=>({id:'cr_'+k,name:T(k)+' 보급',give:{[k]:1000},ico:conResIcon(k)})),{id:'cr_con',name:T('construct')+' 자원 꾸러미',give:Object.fromEntries(CON_RES.map(k=>[k,1000]))}]:[]),
 {id:'cr_gold',name:T('gold')+' 보급',give:{gold:100000}},{id:'cr_exp',name:T('expMat')+' 보급',give:{exp:300}},{id:'cr_wmat',name:T('wMat')+' 보급',give:{wmat:200}},{id:'cr_core',name:T('core')+' 보급',give:{core:50}},{id:'cr_gear',name:T('gearMat')+' 보급',give:{gearMat:100}},{id:'cr_transc',name:T('transcMat')+' 보급',give:{transcMat:30}}];
const CASH_PKGS=()=>[{id:'pk1',name:'성장 지원 패키지',give:{gold:50000,exp:200,wmat:100,core:50}},{id:'pk2',name:T('limit')+' 패키지',give:{core:40,gems:300}},{id:'pk3',name:'10연 '+T('gacha')+' 패키지',give:{gems:COST*10}}];

/* ── 0220-mail.js에서 ── */
/* =========================================================
   우편함
   ========================================================= */

const mailHas=x=>Object.keys(x.reward||{}).length>0;
// 지워도 되는 우편: 받았거나, 기간이 지났거나, 보상이 없는 알림(업데이트 안내·완료 알림 등)
const mailDone=x=>x.got||!(!x.exp||Date.now()<x.exp)||!mailHas(x);
