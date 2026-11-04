/* ===== 대열(근접·원거리·지원)과 출격 경로(진격·퇴각·갈림길) ===== */
/* 1) 대열: 캐릭터마다 사거리 c.range('melee' 근접 | 'ranged' 원거리 | 'support' 지원). 없으면 포지션(range) → 역할·무기로 추정.
      편성 슬롯 1·2는 전열, 3·4는 후열. 엔진(GGMCombat, options.formation)이 근접 공격은 전열을 먼저 치고, 후열을 노린 공격은
      전열 방어형이 엄호하고, 자리에 안 맞는 배치(후열 근접·전열 원거리)는 불리하게 계산해요.
   2) 출격 경로: 전투 스테이지 하나가 여러 지점(전초전 → 갈림길(정면 돌파 / 우회 보급) → 보스)으로 이어져요.
      지점마다 체력이 이어지고, 이긴 뒤 "진격" 또는 "퇴각"을 고르고, 갈림길에서는 길을 골라요(우회로는 지원형이 있어야 열림).
      보스를 이겨야 스테이지 클리어(첫 클리어 보상·별·다음 대본). 퇴각하면 그때까지 얻은 골드·경험치만 받아요.
      경로는 s.route(AI가 장 생성 때 이름을 붙임)나 자동(routeAuto). P().sortie에 진행 상황 저장(다시 켜도 이어 감).
   문서: docs/research/formation-sortie.md */
const RANGE={melee:'근접',ranged:'원거리',support:'지원'}, RANGE_ICO={melee:'⚔',ranged:'➶',support:'✚'};
const POS_RANGE={선봉:'melee',근접:'melee',방벽:'melee',사수:'ranged',술사:'ranged',의무:'support',보조:'support',특수:'melee',구축:'melee',경순:'ranged',중순:'ranged',전함:'melee',항모:'support',잠수:'melee',공격:'',방어:'melee',지원:'support'};
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
async function sortieBegin(ch,s){ const ctx={kind:ch.kind||'main',ch}; try{ await v2PrepareStage(s,ctx); }catch(e){ toast(e.message||'전투 준비에 실패했어요'); return; }
  const busy=busyIds(), squad=P().squad.filter(id=>own(id)&&!busy.has(id)).slice(0,4); if(!squad.length){ toast('편성할 수 있는 '+T('crew')+'이(가) 없어요'); return; }
  if(!stamUse(stamCost(ctx.kind))) return;
  P().sortie={ch:ch.id,st:s.id,node:routeOf(s).start,hp:{},gained:{gold:0,exp:0},path:[],squad,at:Date.now()}; mark('prog'); sortieMap(); }
function sortieParts(){ const R0=SORTIE(); if(!R0) return null; const ch=G.chapters.find(c=>c.id===R0.ch), s=ch&&ch.stages.find(x=>x.id===R0.st); if(!s){ P().sortie=null; return null; } return {run:R0,ch,s,R:routeOf(s)}; }
function sortieMap(msg){ const x=sortieParts(); if(!x) return; const {run,s,R}=x, cur=nodeById(R,run.node), done=new Set(run.path), sq=run.squad.map(charById).filter(Boolean);
  const nodeBtn=n=>{ const here=n.id===run.node, past=done.has(n.id); return `<div class="so-node k-${n.kind} ${here?'here':''} ${past?'past':''}"><b>${{battle:'⚔',elite:'☠',supply:'⛺',boss:'♛'}[n.kind]||'●'} ${esc(n.name)}</b>${n.hint?`<span>${esc(n.hint)}</span>`:''}</div>`; };
  const cols=[[nodeById(R,'n1')],[nodeById(R,'n2a'),nodeById(R,'n2b')],[nodeById(R,'n3')]];
  openModal(`${head(esc(s.title),'<span class="muted">출격 경로 · 체력이 이어져요</span>')}${msg?`<p class="so-msg">${esc(msg)}</p>`:''}
  <div class="so-map">${cols.map(c=>`<div class="so-col">${c.map(nodeBtn).join('')}</div>`).join('<i class="so-arrow">›</i>')}</div>
  <div class="so-sq">${sq.map(c=>{ const h=run.hp[c.id]??1; return `<div class="so-u ${h<=0?'down':h<.25?'crit':''}"><b>${esc(c.name)}</b><span class="hpb"><i style="width:${Math.round(Math.max(0,h)*100)}%"></i></span><small>${RANGE_ICO[charRange(c)]} ${h<=0?'전투 불능':h<.25?'대파':Math.round(h*100)+'%'}</small></div>`; }).join('')}</div>
  ${sortieChoices(x)}`); }
function sortieChoices(x){ const {run,R}=x, cur=nodeById(R,run.node), sq=run.squad.map(charById).filter(Boolean), crit=sq.filter(c=>(run.hp[c.id]??1)>0&&(run.hp[c.id]??1)<.25).length;
  if(!run.path.includes(cur.id)) return `<div class="row" style="margin-top:10px;gap:6px"><button class="btn" data-act="sogo">${cur.kind==='supply'?'보급 받기':cur.kind==='boss'?'보스전 시작':'전투 시작'}</button><button class="btn ghost" data-act="soretreat">퇴각</button></div>`;
  const next=(cur.next||[]).map(id=>nodeById(R,id)); const ok=n=>!n.need||sq.some(c=>c.role===n.need.role&&(run.hp[c.id]??1)>0);
  return `${next.length>1?`<p class="muted" style="margin:8px 0 4px">${esc(R.fork)} — 어느 길로 갈까요?</p>`:''}<div class="row" style="margin-top:6px;gap:6px;flex-wrap:wrap">${next.map(n=>`<button class="btn ${n.kind==='boss'?'':'ghost'}" data-act="sonext" data-v="${n.id}" ${ok(n)?'':'disabled'}>진격 → ${esc(n.name)}</button>`).join('')}<button class="btn ghost" data-act="soretreat">퇴각</button></div>${crit?`<p class="so-warn">대파(체력 25% 미만) ${crit}명 — 진격하면 위험해요</p>`:''}`; }
function sortieFight(){ const x=sortieParts(); if(!x) return; const {run,ch,s,R}=x, n=nodeById(R,run.node);
  if(n.kind==='supply'){ run.squad.forEach(id=>{ const h=run.hp[id]??1; if(h>0) run.hp[id]=Math.min(1,h+.3); }); run.path.push(n.id); mark('prog'); sortieMap('보급을 받았어요. 체력 30% 회복'); return; }
  closeModal(); const st=nodeStage(s,n,R); startStage(st,{kind:ch.kind||'main',ch,sortie:true,boss:n.kind==='boss',noStam:true,squad:run.squad,prep:al=>al.forEach(u=>{ const h=run.hp[u.c.id]??1; u.hp=Math.max(0,Math.round(u.maxhp*h)); })}); }
// 지점 전투가 끝나면(보스 아님) — bEnd가 부름
/* 출격 지점 전투 끝(Controller): 정산 → 효과음 → 결과 */
function sortieNodeEnd(win){ const R=sortieNodeSettle(win); if(!R) return ''; sfx(win?'승리':'패배'); return sortieNodeResultHTML(R); }
/* 출격 지점 정산(Model): 대원 체력 이어 가기, 실패면 출격 끝, 돌파면 골드·경험치·경로 기록 */
function sortieNodeSettle(win){ const x=sortieParts(); if(!x) return null; const {run}=x, name=nodeById(x.R,run.node).name; B.allies.forEach(u=>{ run.hp[u.c.id]=u.hp>0?u.hp/u.maxhp:0; });
  if(!win){ P().sortie=null; mark('prog'); return {win,name}; }
  const g=rateR({gold:400+120*run.path.length}), xp=expR(30); giveReward(g); run.gained.gold+=g.gold||0; run.gained.exp+=xp; B.allies.forEach(u=>{ const o=own(u.c.id); if(o) gainExp(o,xp); }); run.path.push(run.node); mark('prog'); return {win,name,g,xp}; }
/* 출격 지점 결과(View) */
function sortieNodeResultHTML(R){ return R.win?`<h2 class="disp" style="color:var(--rose);margin:0">${esc(R.name)} 돌파</h2><p>${rewardText(R.g)} · 경험치 +${R.xp}</p><button class="btn" data-act="somap">경로로</button>`
  :`<h2 class="disp" style="color:#ff5277">작전 실패</h2><p>${esc(R.name)}에서 밀려났어요. 편성·대열을 바꿔 다시 출격하세요.</p><button class="btn" data-act="bdone">계속</button>`; }
function sortieEnd(){ P().sortie=null; mark('prog'); }
// 출격 전투가 끝났을 때 결과 화면(bEnd가 부름, 출격이 아니면 null): 지점 승패·보스 패배는 출격 결과(패배하면 출격 끝 — 행동력 없이 "다시 도전"하던 것 막음), 보스 승리는 출격을 닫고 보통 클리어 화면
function sortieResult(win){ if(!B.ctx.sortie) return null; if(B.ctx.boss&&win){ sortieEnd(); return null; } return sortieNodeEnd(win); }
// 전투 중 "후퇴": 출격 지점 전투면 출격 퇴각(지금까지 얻은 골드·경험치는 이미 받음). 예전엔 전투만 닫혀 출격이 남아 같은 지점을 행동력 없이 다시 도전할 수 있었음
async function quitConfirm(){ const so=!!B.ctx.sortie; if(!(await appConfirm(so?'퇴각하면 이번 출격이 끝나요. 지금까지 얻은 골드·경험치는 받아요.':'후퇴할까요? 보상은 받을 수 없어요.'))) return false; if(so) sortieEnd(); return true; }
function battleSysPanel(){ const r=G.meta.rules||{}; return `<div class="panel pm-hide"><h3>전투 체계</h3><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-act="bsys" data-k="formation" ${formOn()?'checked':''}>대열 (근접·원거리·지원, 전열이 후열을 지킴)</label><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-act="bsys" data-k="sortie" ${sortieOn()?'checked':''}>출격 경로 (지점마다 진격·퇴각, 갈림길, 체력 유지)</label><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-act="bsmode" data-k="debate" ${modesCfg().debate?'checked':''}>회담 스테이지 (주장·증거·설득) — 새 스토리 생성에 섞기</label><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-act="bsmode" data-k="contest" ${modesCfg().contest?'checked':''}>콘테스트 스테이지 (매력 어필) — 새 스토리 생성에 섞기</label></div>`; }
document.addEventListener('click',e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act;
  if(a==='bsys'){ G.meta.rules=G.meta.rules||{}; G.meta.rules[el.dataset.k]=el.checked; mark('meta'); }
  else if(a==='bsmode'){ G.meta.story=G.meta.story||{}; G.meta.story.modes=Object.assign({},G.meta.story.modes,{[el.dataset.k]:el.checked}); mark('meta'); }
  else if(a==='sogo') sortieFight();
  else if(a==='sonext'){ const x=sortieParts(); if(!x) return; x.run.node=el.dataset.v; mark('prog'); sortieMap(); }
  else if(a==='somap'){ B=null; closeOv(); render(); sortieMap(); }
  else if(a==='soretreat'){ const x=sortieParts(); const g=x?x.run.gained:{}; sortieEnd(); closeModal(); render(); toast(`퇴각했어요${g.gold?` · 얻은 골드 ${nf(g.gold)}`:''}`); } });
