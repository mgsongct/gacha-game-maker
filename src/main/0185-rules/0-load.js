/* ===== 0185-rules — 불러올 때(상수·상태·리스너): 계층 파일 밖에 남은 옛 조각을 이름 순(불러오는 순서)으로 이음 ===== */

/* ── 0185-game-rules.js에서 ── */
/* ===== 게임 규칙: 속성(추가·제거·상성표·반응) · 포지션(기능) · 역할 기본 능력치 · 희귀도 · 진영 시너지 · 관계 ===== */
const RULE_STATS=[['hp','체력'],['atk','공격'],['def','방어'],['spd','속도']];
const POS_TRAITS=[['hp','체력 %'],['atk','공격 %'],['def','방어 %'],['spd','속도 %'],['dmg','주는 피해 %'],['taken','받는 피해 %'],['heal','회복량 %'],['crit','치명타 %p'],['sp','시작 SP'],['threat','위협도 %']];
const REACT_TYPES=[['amp','피해 증폭(배율)'],['burst','폭발(공격력×값 추가 피해)'],['stun','기절(초)'],['vuln','취약(받는 피해 +값%)']];
// 생성기가 쓰는 속성 이름 다듬기 — 속성 목록·상성(beats)·반응의 속성 이름에 같이 써야 서로 맞음
const elemName=v=>String(v||'').replace(/[<>"'&`.]/g,'').trim().slice(0,4);
const POS_PRESETS={
 basic:[['공격','atk','적을 쓰러뜨리는 주력',{}],['방어','def','앞에서 버티며 동료를 지킴',{}],['지원','sup','회복과 강화로 돕기',{}]],
 squad8:[['선봉','atk','전투를 여는 돌격수. 시작부터 기술을 쓸 준비가 돼 있음',{sp:30,spd:10,hp:-10}],['근접','atk','근거리 주력 딜러',{atk:10,dmg:5}],['방벽','def','적의 공격을 끌어 아군을 지킴',{hp:15,def:15,threat:80,taken:-10}],['사수','atk','멀리서 약점을 노림',{crit:10,threat:-50,hp:-15}],['술사','atk','속성 공격 전문가',{dmg:15,def:-15}],['의무','sup','회복 전문',{heal:25,atk:-10}],['보조','sup','강화·약화로 판을 짬',{sp:20,threat:-30}],['특수','atk','변칙 전술',{spd:15,crit:5,hp:-10}]],
 ship6:[['구축','atk','빠르고 가벼운 선봉',{spd:20,hp:-15,crit:5}],['경순','atk','균형 잡힌 지휘함',{spd:5,dmg:5}],['중순','atk','강한 포격',{atk:15,spd:-5}],['전함','def','두꺼운 장갑과 주포',{hp:25,def:20,spd:-25,atk:10,threat:50}],['항모','sup','함재기로 지원과 공격',{heal:15,sp:20,threat:-20}],['잠수','atk','은밀한 일격',{crit:15,threat:-60,hp:-20}]]};
const rulesPct=x=>`×${Math.round(x*100)/100}`;

/* 편집 창: RD(초안)를 고치다가 저장할 때 게임에 반영 */
let RD=null;
document.addEventListener('click',e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act;
  if(a==='rulesopen') openRules();
  else if(a==='rulessave'){ if(rulesSave()){ closeModal(); render(); toast('게임 규칙을 저장했어요'); } }
  else if(a==='rulescodex'){ if(rulesSave()){ rulesCodex(); openRules(); } }
  else if(a==='rulesai') rulesAI(uiProg(el));
  else if(a==='rulesposai') rulesPosAI(uiProg(el));
  else if(a==='rulesrecalc') rulesRecalc();
  else if(a==='rulesposassign'){ rulesPosAssign(); }
  else if(a==='rulespreset'){ rulesRead(); RD.positions=POS_PRESETS[el.dataset.k].map(([name,base,desc,t])=>({id:'p_'+uid(),name:el.dataset.k==='basic'?ROLE[base]:name,base,desc,t:{...t},range:POS_RANGE[el.dataset.k==='basic'?ROLE[base]:name]||''})); openRules(true); }
  else if(a==='rulesadd'){ rulesRead(); const k=el.dataset.k, E=RD.elems.map(x=>x.n);
    if(k==='elem'&&RD.elems.length<8){ let n='속성'+(RD.elems.length+1); RD.elems.push({n,c:'#'+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0'),d:'',orig:'',beat:''}); }
    else if(k==='reaction') RD.reactions.push({a:E[0],b:E[1],name:'반응',type:'amp',value:1.5});
    else if(k==='pos') RD.positions.push({id:'p_'+uid(),name:'새 포지션',base:'atk',desc:'',t:{}});
    else if(k==='rel') RD.rel.push({by:'faction',a:'',b:'',mul:1.2}); openRules(true); }
  else if(a==='rulesedel'){ rulesRead(); const gone=RD.elems.splice(+el.dataset.i,1)[0]; RD.elems.forEach(x=>{ if(x.beat===gone.n) x.beat=''; }); openRules(true); }
  else if(a==='rulesrdel'){ rulesRead(); RD[el.dataset.k].splice(+el.dataset.i,1); openRules(true); } });

/* ── 0187-balance.js에서 ── */
/* ===== 밸런스 관리: 파워 인플레(세대) 제어 · 능력치 균질화 · 구캐릭터 AS ===== */
const balPower=s=>Math.round(s.hp/5+s.atk*3+s.def*2+s.spd); // 캐릭터 화면 전투력과 같은 식(성장 전 기본값)

document.addEventListener('click',e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act;
  if(a==='balopen') openBalance();
  else if(a==='balsave'){ balSave(); toast('밸런스 설정을 저장했어요'); openBalance(); }
  else if(a==='balfix') balFix(el.dataset.k);
  else if(a==='balundo'){ auditUndo(); openBalance(); } });

/* ── 0240-growth-curve.js에서 ── */
/* ===== 성장 곡선 (2026.10.07.17) ===== */

let FORM=null;
let chDraft=null;
let WTERMS=null;
let BD=null;
