/* ===== 0480-battle — Model(상태·규칙·저장·외부 서비스) ===== */
/* src/main/0480-battle/0480-battle.js에서 옮김 */
function stageBg(s){const L=parseScript(s.pre).find(l=>(l.type==='cmd'&&l.cmd==='배경')||l.type==='place');return L?(L.arg||L.text):'';}
function bRun(){clearInterval(B.timer);B.timer=setInterval(bTick,230/(B.speed||1));}
/* 공격 연출: 근접(공격형·방어형, 보스, 일부 적)은 카드가 대상 쪽으로 몸통박치기, 원거리(지원형, 나머지 적)는 빛줄기가 날아가요. 연출이 닿을 때 피해 숫자가 떠요 */
function attackFx(a,t){return GGMVFX.basic(a,t);}
function cutFace(c){ const fs=facePool(c); if(!fs.length) return ''; const f=CUT_FACES.map(n=>fs.find(x=>x.name===n)).find(Boolean)||fs[0]; return f.name; }
function useSkill(u){
  if(!B||B.over||!B.engine||B.paused||B.presentationBusy||B.ending)return;
  B.engine.events=[];
  if(GGMCombat.cast(B.engine,u,'ultimate')){v2BattleEvents(B.engine.events);bCheck();}
}
function bCheck(){
 if(!B||B.over||B.presentationBusy||B.ending)return;
 if(B.engine?.impactJobs.length&&!B.engine.winner)return;
 const win=!alive(B.enemies).length,lose=!alive(B.allies).length;if(!win&&!lose)return;
 const battle=B,delay=Math.max(0,(battle.impactUntil||0)-Date.now());
 if(delay){battle.ending=true;battle.finishTimer=setTimeout(()=>{if(B!==battle||battle.over)return;battle.ending=false;bEnd(win);},delay);}
 else bEnd(win);
}
/* 스테이지 정산(Model): 보상(첫 클리어·재료 던전·이벤트 토큰)·클리어 기록·영입·인연·경험치·별(전원 생존·목표)·첫 ★3 보너스, MVP와 한마디 */
function stageSettle(win){ const s=B.s, kind=B.ctx.kind; if(!win) return {win:false};
  const p=P(); let r={}, first=false, exp=60;
  if(kind==='farm'){ const f=s.farm; r=farmReward(f.key,f.lv); p.farmClear[s.id]=true; exp=20+20*farmRec(f.lv); }
  else if(kind==='event'){ const ev=G.events.find(e=>e.id===B.ch.eventId); first=!p.cleared[s.id]; r={token:s.reward*(first?2:1),tokenName:ev?ev.token:'토큰'}; if(first) r.gems=100; giveReward(r,ev&&ev.id); r={...r}; p.cleared[s.id]=true; if(first) recruitCheck(B.ch,s); exp=80; }
  else { first=!p.cleared[s.id]; r=first?{gems:s.reward*2,gold:3000,exp:10}:{gold:1500,exp:3}; p.cleared[s.id]=true; if(first){ gateCheck(); recruitCheck(B.ch,s); } exp=120+Math.max(0,G.chapters.filter(ch=>ch.kind==='main').indexOf(B.ch))*40; }
  if(kind!=='event'){ Object.assign(r,rateR(r)); giveReward(r); }
  if(first&&kind!=='farm') newBonds(s);
  B.allies.forEach(u=>{const o=own(u.c.id);if(o)gainExp(o,expR(exp));});
  mark('prog');
  const noDeath=B.allies.every(u=>u.hp>0), fast=s.goal&&GOALS[s.goal.k]?GOALS[s.goal.k].ok(B,s.goal.a):B.ticks<=420, stars=1+(noDeath?1:0)+(fast?1:0);
  p.stars=p.stars||{}; const was=p.stars[s.id]||0; if(stars>was) p.stars[s.id]=stars; let bonus='';
  if(stars===3&&was<3&&kind!=='farm'){ giveReward({gems:50}); bonus=` · 첫 ★3 보너스 ◆50`; }
  const mvp=[...B.allies].sort((a,b)=>(b.dmg||0)-(a.dmg||0))[0], tot=B.allies.reduce((a,u)=>a+(u.dmg||0),0)||1, ml=mvp&&rand((mvp.c.lvLines.length?mvp.c.lvLines:[]).concat(mvp.c.lines));
  return {win:true,s,kind,r,first,exp,noDeath,fast,stars,bonus,mvp,tot,ml}; }
/* src/main/0480-battle/0485-battle-rules.js에서 옮김 */
function ruleFacs(){ const n={}; G.chars.forEach(c=>{ if(c.faction&&!c.npc) n[c.faction]=(n[c.faction]||0)+1; }); return Object.keys(n).filter(f=>n[f]>=2); }
function ruleArg(kind,seed){ const pick=a=>a.length?a[seed%a.length]:''; return kind==='elem'?pick(ELEMS):kind==='role'?pick(Object.keys(ROLE)):kind==='faction'?pick(ruleFacs()):kind==='sec'?[60,75,90][seed%3]:kind==='pct'?[40,50,60][seed%3]:kind==='n'?3:''; }
function ruleOk(cat,r){ const d=r&&cat[r.k]; if(!d) return false; if(!d.arg) return true; const a=r.a; return d.arg==='elem'?ELEMS.includes(a):d.arg==='role'?!!ROLE[a]:d.arg==='faction'?ruleFacs().includes(a):+a>0; }
function ruleClean(cat,r){ if(!r||typeof r!=='object') return null; const o={k:String(r.k||'')}; if(cat[o.k]&&cat[o.k].arg) o.a=['sec','pct','n'].includes(cat[o.k].arg)?Math.round(+r.a||0):String(r.a||'').trim(); return ruleOk(cat,o)?o:null; }
function fieldText(r){ const d=r&&FIELDS[r.k]; return d?`${d.n}: ${d.d(r.a)}`:''; }
function goalText(r){ const d=r&&GOALS[r.k]; return d?d.d(r.a):'71초 안에 승리'; }
// 스테이지 i/n에 규칙을 정해요(첫 스테이지는 규칙 없음, 마지막(보스)은 시간·체력 목표). 같은 스테이지는 늘 같은 결과
function stageAutoRules(s,i,n){ if(!s||s.story||!(s.enemies||[]).length) return s; const h=hashN(s.id||s.title||i);
  if(i>0){ const fk=['resonance','role','home','armor','fortress','swift','resonance','frenzy','suppress'].filter(k=>FIELDS[k].arg!=='faction'||ruleFacs().length), k=fk[h%fk.length]; const f=ruleClean(FIELDS,{k,a:ruleArg(FIELDS[k].arg,h>>3)}); if(f) s.field=f; }
  const gk=i===n-1?['fast','hp']:['elem','role','noRole','few','hp','faction'].filter(k=>k!=='faction'||ruleFacs().length), g=gk[(h>>5)%gk.length], goal=ruleClean(GOALS,{k:g,a:ruleArg(GOALS[g].arg,h>>7)}); if(goal) s.goal=goal;
  s.rulesV=1; return s; }
function fieldApply(s,A,E){ const r=s&&s.field, d=r&&FIELDS[r.k]; if(d) d.f(A,E,r.a); }
function fieldTime(s){ const r=s&&s.field; return r&&r.k==='timed'?Math.max(20,Math.min(119,+r.a||90)):0; }
/* src/main/0480-battle/0487-formation-sortie.js에서 옮김 */
function charRange(c){ if(!c) return 'melee'; if(RANGE[c.range]) return c.range; const p=POSITIONS().find(x=>x.id===c.pos); if(p&&RANGE[p.range]) return p.range; return GGMCombat.rangeOf({role:c.role,c,name:c.name}); }
function formOn(){ return (G.meta.rules||{}).formation!==false; }
function sortieOn(){ return (G.meta.rules||{}).sortie!==false; }
// 편성 칸 경고: 자리에 안 맞는 배치
function rowWarn(c,i,n){ if(!formOn()||!c) return ''; const r=charRange(c), back=n>2&&i>=2; return back&&r==='melee'?'후열 근접: 일반 공격 −30%':!back&&r!=='melee'&&n>2?`전열 ${RANGE[r]}: 받는 피해 +25%`:''; }
function formHelp(){ return formOn()?'전열(1·2)은 근접 공격을 막아 후열(3·4)을 지켜요. 근접은 전열, 원거리·지원은 후열이 좋아요. 후열을 노린 공격은 전열 방어형이 30% 확률로 엄호해요. 후열 지원형은 회복 +20%.':''; }
/* 경로 */
function routeAuto(s){ const r=s.route||{}, H=hashN(s.id), boss=(s.enemies||[]).some(e=>e.boss);
  return {nodes:[{id:'n1',kind:'battle',name:r.n1||'전초전',next:['n2a','n2b'],scale:.55,count:2},
    {id:'n2a',kind:'elite',name:r.a||'정면 돌파',hint:'강한 적 · 보상↑',next:['n3'],scale:.8,count:3},
    {id:'n2b',kind:'supply',name:r.b||'우회로 보급 지점',hint:'체력 30% 회복 · 지원형이 있어야 갈 수 있어요',need:{role:'sup'},next:['n3']},
    {id:'n3',kind:'boss',name:r.boss||(boss?'적 본대':'목표 지점'),next:[]}],start:'n1',fork:r.fork||'두 갈래 길이 나타났다',seed:H}; }
function routeOf(s){ return routeAuto(s); }
function routeClean(x){ if(!x||typeof x!=='object') return null; const r={}; ['n1','fork','a','b','boss'].forEach(k=>{ const v=String(x[k]||'').trim(); if(v) r[k]=v.slice(0,k==='fork'?60:20); }); return Object.keys(r).length?r:null; }
function nodeById(R,id){ return R.nodes.find(n=>n.id===id); }
function nodeStage(s,n,R){ if(n.kind==='boss') return s; const src=(s.enemies||[]).filter(e=>!e.boss), pool=src.length?src:(s.enemies||[]), h=R.seed, en=[];
  for(let i=0;i<(n.count||2);i++){ const b=pool[(h+i)%pool.length]; if(!b) break; en.push(Object.assign({},b,{hp:Math.round(b.hp*n.scale),atk:Math.round(b.atk*Math.min(1,n.scale+.15)),boss:false,skills:b.skills})); }
  const st={id:s.id+'_'+n.id,title:`${s.title} · ${n.name}`,enemies:en,reward:0,pre:'',post:'',combatBalance:s.combatBalance,field:n.kind==='elite'?s.field:null,goal:null,node:n.id}; return st; }
function SORTIE(){ const p=P(); return p.sortie||null; }
function sortieParts(){ const R0=SORTIE(); if(!R0) return null; const ch=G.chapters.find(c=>c.id===R0.ch), s=ch&&ch.stages.find(x=>x.id===R0.st); if(!s){ P().sortie=null; return null; } return {run:R0,ch,s,R:routeOf(s)}; }
/* 출격 지점 정산(Model): 대원 체력 이어 가기, 실패면 출격 끝, 돌파면 골드·경험치·경로 기록 */
function sortieNodeSettle(win){ const x=sortieParts(); if(!x) return null; const {run}=x, name=nodeById(x.R,run.node).name; B.allies.forEach(u=>{ run.hp[u.c.id]=u.hp>0?u.hp/u.maxhp:0; });
  if(!win){ P().sortie=null; mark('prog'); return {win,name}; }
  const g=rateR({gold:400+120*run.path.length}), xp=expR(30); giveReward(g); run.gained.gold+=g.gold||0; run.gained.exp+=xp; B.allies.forEach(u=>{ const o=own(u.c.id); if(o) gainExp(o,xp); }); run.path.push(run.node); mark('prog'); return {win,name,g,xp}; }
function sortieEnd(){ P().sortie=null; mark('prog'); }
// 출격 전투가 끝났을 때 결과 화면(bEnd가 부름, 출격이 아니면 null): 지점 승패·보스 패배는 출격 결과(패배하면 출격 끝 — 행동력 없이 "다시 도전"하던 것 막음), 보스 승리는 출격을 닫고 보통 클리어 화면
function sortieResult(win){ if(!B.ctx.sortie) return null; if(B.ctx.boss&&win){ sortieEnd(); return null; } return sortieNodeEnd(win); }
// 전투 중 "후퇴": 출격 지점 전투면 출격 퇴각(지금까지 얻은 골드·경험치는 이미 받음). 예전엔 전투만 닫혀 출격이 남아 같은 지점을 행동력 없이 다시 도전할 수 있었음
async function quitConfirm(){ const so=!!B.ctx.sortie; if(!(await appConfirm(so?'퇴각하면 이번 출격이 끝나요. 지금까지 얻은 골드·경험치는 받아요.':'후퇴할까요? 보상은 받을 수 없어요.'))) return false; if(so) sortieEnd(); return true; }
/* src/main/0480-battle/0490-boss-patterns.js에서 옮김 */
function bossPats(e,raid){return GGMCombat.enemyPatterns(e);}
function bossPatText(e,raid){ return bossPats(e,raid).map(k=>BPATS[k][0]).join(' · ')+' · 체력 40% 이하 광폭화 (15초 / 재사용 30초)'; }
function bossNext(u){return B&&B.engine&&u.ready&&u.ready.active-B.engine.time<=1;}
/* 훈련 기록 형식 이전(불러오기 fix가 부름): 단계가 바뀌어서(5→10단계, 권장 레벨) 예전 3단계 이상 기록은 다시 깨야 소탕 */
function farmClearV2(pr){ if(pr.farmV===2) return; Object.keys(pr.farmClear).forEach(k=>{ const m=k.match(/^farm_.+_(\d+)$/); if(m&&+m[1]>=3) delete pr.farmClear[k]; }); pr.farmV=2; }
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
