/* ===== 보스 패턴 ===== */
const BPATS={aoe:['광역 포격','7초마다 전원 공격',7],snipe:['집중 저격','7초마다 체력 비율이 낮은 대상 공격',7],charge:['강타','7초마다 전원 강타',7],drain:['흡혈','7초마다 피해의 30% 회복',7],barrier:['방벽','7초마다 보호막',7],curse:['저주','7초마다 적 전체 공격력 감소',7],shift:['방어 약화','7초마다 적 전체 방어력 감소',7]};
function bossPats(e,raid){return GGMCombat.enemyPatterns(e);}
function bossPatText(e,raid){ return bossPats(e,raid).map(k=>BPATS[k][0]).join(' · ')+' · 체력 40% 이하 광폭화 (15초 / 재사용 30초)'; }
function bossNext(u){return B&&B.engine&&u.ready&&u.ready.active-B.engine.time<=1;}
// 훈련: 10단계, 단계마다 권장 레벨이 있어요(그 레벨 대원의 능력치에 맞춰 적이 강해져요)
const FARM_LV=[1,5,10,15,20,30,40,50,60,70], FARM_N=FARM_LV.length;
const FARM_RW={exp:[10,20,35,55,80,110,150,200,260,330],gold:[4000,7000,11000,16000,22000,30000,40000,52000,66000,82000],wmat:[5,9,14,20,28,38,50,64,80,100],core:[1,1,2,2,3,4,5,6,7,8]};
function farmReward(key,lv){ const m=seasonIs('train')?2:1, i=Math.max(0,Math.min(FARM_N-1,lv-1)); return key==='exp'?{exp:FARM_RW.exp[i]*m}:key==='gold'?{gold:FARM_RW.gold[i]*m}:key==='wmat'?{wmat:FARM_RW.wmat[i]*m}:{core:FARM_RW.core[i]*m}; }
function farmRec(lv){ return FARM_LV[Math.max(0,Math.min(FARM_N-1,lv-1))]; }
function farmStage(key,lv){
  const f=G.meta.farms.find(x=>x.key===key)||{name:key}, rec=farmRec(lv), m=(1+0.06*(rec-1))*(1+0.04*lv);
  const e=(n,i,boss)=>({name:n,elem:ELEMS[(lv+i)%ELEMS.length],hp:Math.round(950*m*(boss?3:1)),atk:Math.round(82*m*(boss?1.2:1)),def:Math.round(32*m),spd:92+lv*2,boss:!!boss});
  const en=[e('훈련 표적',0),e('훈련 표적',1)]; if(lv>=3) en.push(e('강화 표적',2)); if(lv>=6) en.push(e('훈련 교관',0,true));
  // 권장 레벨 대원 4명의 전투력보다 조금 낮게 맞춰요(10레벨 낮으면 버거워요)
  const lm=1+0.06*(rec-1), up=c=>{ const r=RMUL[c.rarity]||1; return unitPower({hp:(+c.hp||1150)*r*lm,atk:(+c.atk||130)*r*lm,def:(+c.def||60)*r*lm,spd:+c.spd||100}); };
  const top=(G.chars.length?G.chars.map(up):[up({})]).sort((a,b)=>b-a).slice(0,4); while(top.length<4) top.push(top[top.length-1]);
  const ref=top.reduce((a,b)=>a+b,0)/1.12;
  for(let k=0;k<2;k++){ const f=ref/stagePower({enemies:en}); en.forEach(x=>{ x.hp=Math.round(x.hp*f); x.atk=Math.round(x.atk*f); x.def=Math.round(x.def*f); }); }
  return {id:`farm_${key}_${lv}`,title:`${f.name} ${lv}단계 (권장 Lv.${rec})`,enemies:en,reward:0,pre:'',post:'',farm:{key,lv}};
}

