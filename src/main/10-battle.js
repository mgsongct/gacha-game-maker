/* ===== battle — 기능 class(Model · View · Ctl) — docs/redesign.md 2·3절, tools/reshape.mjs가 매핑대로 옮김 ===== */
class Battle {
  static storyCfg(){ const s=(G.meta&&G.meta.story)||{}; return {finale:finaleOf(s.finale),stages:+s.stages||0,len:STORY_LEN[s.len]?s.len:'normal',plot:String(s.plot||''),depth:s.depth==='fast'?'fast':'deep',newc:s.newc==null?2:Math.max(0,Math.min(3,+s.newc||0)),talkOnly:s.talkOnly==null?1:Math.max(0,Math.min(3,+s.talkOnly||0))}; }

  static modesCfg(){ const m=(G.meta.story||{}).modes||{}; return {debate:m.debate!==false,contest:m.contest!==false}; }

  static charmOf(c){ const p=c.persona||{}, txt=[...(p.traits||[]),p.gap,p.hobby,...(p.likes||[]),p.motif,c.profile].join(' '), o=Characters.own(c.id)||{lv:1,aff:0}, out={};
    Object.keys(CHARM).forEach(k=>{ let v=20+(CHARM_KW[k].test(txt)?25:0)+((p.traits||[]).filter(t=>CHARM_KW[k].test(t)).length*10); out[k]=v; });
    out[c.role==='sup'?'smart':'tough']+=c.role==='def'?15:10; if(c.role==='atk') out.cool+=8;
    const m=(1+(c.rarity||1)*.1)*(1+Core.affLv(o)*.04)*(1+Math.min(120,o.lv||1)/200); Object.keys(out).forEach(k=>out[k]=Math.round(out[k]*m)); return out; }

  static contestPref(r){ const J=MD.s.contest.judges; return J[r%J.length]; }

  static modeClear(ch,s,stars){ const p=P(), first=!p.cleared[s.id]; p.cleared[s.id]=true; p.stars=p.stars||{}; p.stars[s.id]=Math.max(p.stars[s.id]||0,stars);
    if(first){ if(ch.kind==='event'){ const ev=G.events.find(e=>e.id===ch.eventId); Economy.giveReward({token:s.reward*2},ev&&ev.id); } else { Economy.giveReward(Characters.rateR({gems:s.reward,gold:2000})); Acquire.gateCheck(); Story.recruitCheck(ch,s); } CharactersCtl.newBonds(s); }
    Core.mark('prog'); CoreView.closeModal(); const after=()=>{ Challenge.render(); MessengerCtl.checkTriggers(); }; if(first&&s.post) SystemView.playStory(s.title,s.post,after); else after(); CoreView.toast(`${s.title} 클리어 ${'★'.repeat(stars)}`); }

    /* 스테이지 정산(Model): 보상(첫 클리어·재료 던전·이벤트 토큰)·클리어 기록·영입·인연·경험치·별(전원 생존·목표)·첫 ★3 보너스, MVP와 한마디 */
static stageSettle(win){ const s=B.s, kind=B.ctx.kind; if(!win) return {win:false};
    const p=P(); let r={}, first=false, exp=60;
    if(kind==='farm'){ const f=s.farm; r=Core.farmReward(f.key,f.lv); p.farmClear[s.id]=true; exp=20+20*Characters.farmRec(f.lv); }
    else if(kind==='event'){ const ev=G.events.find(e=>e.id===B.ch.eventId); first=!p.cleared[s.id]; r={token:s.reward*(first?2:1),tokenName:ev?ev.token:'토큰'}; if(first) r.gems=100; Economy.giveReward(r,ev&&ev.id); r={...r}; p.cleared[s.id]=true; if(first) Story.recruitCheck(B.ch,s); exp=80; }
    else { first=!p.cleared[s.id]; r=first?{gems:s.reward*2,gold:3000,exp:10}:{gold:1500,exp:3}; p.cleared[s.id]=true; if(first){ Acquire.gateCheck(); Story.recruitCheck(B.ch,s); } exp=120+Math.max(0,G.chapters.filter(ch=>ch.kind==='main').indexOf(B.ch))*40; }
    if(kind!=='event'){ Object.assign(r,Characters.rateR(r)); Economy.giveReward(r); }
    if(first&&kind!=='farm') CharactersCtl.newBonds(s);
    B.allies.forEach(u=>{const o=Characters.own(u.c.id);if(o)Core.gainExp(o,expR(exp));});
    Core.mark('prog');
    const noDeath=B.allies.every(u=>u.hp>0), fast=s.goal&&GOALS[s.goal.k]?GOALS[s.goal.k].ok(B,s.goal.a):B.ticks<=420, stars=1+(noDeath?1:0)+(fast?1:0);
    p.stars=p.stars||{}; const was=p.stars[s.id]||0; if(stars>was) p.stars[s.id]=stars; let bonus='';
    if(stars===3&&was<3&&kind!=='farm'){ Economy.giveReward({gems:50}); bonus=` · 첫 ★3 보너스 ◆50`; }
    const mvp=[...B.allies].sort((a,b)=>(b.dmg||0)-(a.dmg||0))[0], tot=B.allies.reduce((a,u)=>a+(u.dmg||0),0)||1, ml=mvp&&rand((mvp.c.lvLines.length?mvp.c.lvLines:[]).concat(mvp.c.lines));
    return {win:true,s,kind,r,first,exp,noDeath,fast,stars,bonus,mvp,tot,ml}; }

  static sortieOn(){ return (G.meta.rules||{}).sortie!==false; }

    /* 경로 */
static routeAuto(s){ const r=s.route||{}, H=Core.hashN(s.id), boss=(s.enemies||[]).some(e=>e.boss);
    return {nodes:[{id:'n1',kind:'battle',name:r.n1||'전초전',next:['n2a','n2b'],scale:.55,count:2},
      {id:'n2a',kind:'elite',name:r.a||'정면 돌파',hint:'강한 적 · 보상↑',next:['n3'],scale:.8,count:3},
      {id:'n2b',kind:'supply',name:r.b||'우회로 보급 지점',hint:'체력 30% 회복 · 지원형이 있어야 갈 수 있어요',need:{role:'sup'},next:['n3']},
      {id:'n3',kind:'boss',name:r.boss||(boss?'적 본대':'목표 지점'),next:[]}],start:'n1',fork:r.fork||'두 갈래 길이 나타났다',seed:H}; }

  static routeOf(s){ return Battle.routeAuto(s); }

  static nodeById(R,id){ return R.nodes.find(n=>n.id===id); }

  static nodeStage(s,n,R){ if(n.kind==='boss') return s; const src=(s.enemies||[]).filter(e=>!e.boss), pool=src.length?src:(s.enemies||[]), h=R.seed, en=[];
    for(let i=0;i<(n.count||2);i++){ const b=pool[(h+i)%pool.length]; if(!b) break; en.push(Object.assign({},b,{hp:Math.round(b.hp*n.scale),atk:Math.round(b.atk*Math.min(1,n.scale+.15)),boss:false,skills:b.skills})); }
    const st={id:s.id+'_'+n.id,title:`${s.title} · ${n.name}`,enemies:en,reward:0,pre:'',post:'',combatBalance:s.combatBalance,field:n.kind==='elite'?s.field:null,goal:null,node:n.id}; return st; }

  static SORTIE(){ const p=P(); return p.sortie||null; }

  static sortieParts(){ const R0=Battle.SORTIE(); if(!R0) return null; const ch=G.chapters.find(c=>c.id===R0.ch), s=ch&&ch.stages.find(x=>x.id===R0.st); if(!s){ P().sortie=null; return null; } return {run:R0,ch,s,R:Battle.routeOf(s)}; }

    /* 출격 지점 정산(Model): 대원 체력 이어 가기, 실패면 출격 끝, 돌파면 골드·경험치·경로 기록 */
static sortieNodeSettle(win){ const x=Battle.sortieParts(); if(!x) return null; const {run}=x, name=Battle.nodeById(x.R,run.node).name; B.allies.forEach(u=>{ run.hp[u.c.id]=u.hp>0?u.hp/u.maxhp:0; });
    if(!win){ P().sortie=null; Core.mark('prog'); return {win,name}; }
    const g=Characters.rateR({gold:400+120*run.path.length}), xp=expR(30); Economy.giveReward(g); run.gained.gold+=g.gold||0; run.gained.exp+=xp; B.allies.forEach(u=>{ const o=Characters.own(u.c.id); if(o) Core.gainExp(o,xp); }); run.path.push(run.node); Core.mark('prog'); return {win,name,g,xp}; }

  static sortieEnd(){ P().sortie=null; Core.mark('prog'); }

    // 출격 전투가 끝났을 때 결과 화면(bEnd가 부름, 출격이 아니면 null): 지점 승패·보스 패배는 출격 결과(패배하면 출격 끝 — 행동력 없이 "다시 도전"하던 것 막음), 보스 승리는 출격을 닫고 보통 클리어 화면
static sortieResult(win){ if(!B.ctx.sortie) return null; if(B.ctx.boss&&win){ Battle.sortieEnd(); return null; } return BattleCtl.sortieNodeEnd(win); }

  static async sortieBegin(ch,s){ const ctx={kind:ch.kind||'main',ch}; try{ await v2PrepareStage(s,ctx); }catch(e){ CoreView.toast(e.message||'전투 준비에 실패했어요'); return; }
    const busy=busyIds(), squad=P().squad.filter(id=>Characters.own(id)&&!busy.has(id)).slice(0,4); if(!squad.length){ CoreView.toast('편성할 수 있는 '+System.T('crew')+'이(가) 없어요'); return; }
    if(!Economy.stamUse(Characters.stamCost(ctx.kind))) return;
    P().sortie={ch:ch.id,st:s.id,node:Battle.routeOf(s).start,hp:{},gained:{gold:0,exp:0},path:[],squad,at:Date.now()}; Core.mark('prog'); BattleView.sortieMap(); }
}

class BattleCtl {
  static debateHit(text){ const d=MD.s.debate; MD.log.push(text); MD.r++; MD.i=0; MD.pressed={}; Art.sfx('확인'); if(MD.r>=d.rounds.length){ const st=MD.hp===d.hp?3:MD.hp>=Math.ceil(d.hp/2)?2:1, {ch,s}=MD; MD=null; SystemView.playStory('회담 성공',[`${System.T('player')}: ${text}`,d.win?`${d.opponent}: ${d.win}`:''].filter(Boolean).join('\n'),()=>Battle.modeClear(ch,s,st)); return; } BattleView.debateDraw(`돌파! ${text}`); }

  static contestAppeal(cid,k){ const e=MD.ent.find(x=>x.id===cid); if(!e) return; const j=Battle.contestPref(MD.round), cm=Battle.charmOf(e), fit=k===j.likes, same=MD.last===cid;
    MD.hype=same?0:Math.min(4,MD.hype+(fit?1:0)+(MD.last&&!same?1:0)); const pts=Math.round(cm[k]*(fit?1.6:1)*(1+.12*MD.hype)*(.9+Math.random()*.2)); MD.score+=pts; MD.last=cid;
    const ref=Math.round(Object.values(Battle.charmOf(MD.ent[0])).reduce((a,b)=>a+b,0)/5*1.25); MD.rivals.forEach(r=>{ r.score+=Math.round(ref*r.power*(.85+Math.random()*.3)); });
    MD.round++; const msg=`${e.name}의 ${CHARM[k]} 어필 +${pts}${fit?' (취향 적중!)':''}${same?' · 분위기가 식었어요':''}`;
    if(MD.round<MD.s.contest.rounds){ Art.sfx(fit?'확인':'알림'); BattleView.contestDraw(msg); return; }
    const best=Math.max(0,...MD.rivals.map(r=>r.score)), mine=MD.score, win=mine>best, {ch,s}=MD, margin=best?mine/best:2; MD=null;
    if(!win){ CoreView.closeModal(); CoreView.toast(`콘테스트 결과: 우리 ${nf(mine)} · 1위 ${nf(best)} — 출전자와 어필을 바꿔 다시 도전해 보세요`); return; }
    Battle.modeClear(ch,s,margin>=1.3?3:margin>=1.1?2:1); }

  static sortieFight(){ const x=Battle.sortieParts(); if(!x) return; const {run,ch,s,R}=x, n=Battle.nodeById(R,run.node);
    if(n.kind==='supply'){ run.squad.forEach(id=>{ const h=run.hp[id]??1; if(h>0) run.hp[id]=Math.min(1,h+.3); }); run.path.push(n.id); Core.mark('prog'); BattleView.sortieMap('보급을 받았어요. 체력 30% 회복'); return; }
    CoreView.closeModal(); const st=Battle.nodeStage(s,n,R); SystemView.startStage(st,{kind:ch.kind||'main',ch,sortie:true,boss:n.kind==='boss',noStam:true,squad:run.squad,prep:al=>al.forEach(u=>{ const h=run.hp[u.c.id]??1; u.hp=Math.max(0,Math.round(u.maxhp*h)); })}); }

    // 지점 전투가 끝나면(보스 아님) — bEnd가 부름
  /* 출격 지점 전투 끝(Controller): 정산 → 효과음 → 결과 */
static sortieNodeEnd(win){ const R=Battle.sortieNodeSettle(win); if(!R) return ''; Art.sfx(win?'승리':'패배'); return BattleView.sortieNodeResultHTML(R); }
}

class BattleView {
    /* 회담 */
static debateStart(ch,s){ MD={kind:'debate',ch,s,r:0,i:0,hp:s.debate.hp,log:[],pressed:{}}; BattleView.debateDraw(); }

  static debateDraw(msg){ const {s,r,i,hp}=MD, d=s.debate, R=d.rounds[r], L=R.lines[i], opp=Characters.findSpeaker(d.opponent)||Characters.npcBy(d.opponent), sq=P().squad.map(charById).filter(Boolean);
    CoreView.openModal(`${head(`회담 · ${esc(d.opponent)}`,`<span class="muted">라운드 ${r+1}/${d.rounds.length} · 신뢰도 ${'◆'.repeat(hp)}${'◇'.repeat(Math.max(0,d.hp-hp))}</span>`)}
  <div class="db-stage">${opp&&Characters.imgSrc(opp)?`<div class="db-opp">${CoreView.art(opp,'',{upper:true})}</div>`:''}<div class="db-claim"><i>${esc(R.claim||'주장')}</i><p class="db-line">“${esc(L.text)}”</p><span class="muted">${i+1}/${R.lines.length}</span></div></div>
  ${msg?`<p class="db-msg">${esc(msg)}</p>`:''}
  <div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn sm ghost" data-act="dbnav" data-v="-1" ${i?'':'disabled'}>◀</button><button class="btn sm ghost" data-act="dbnav" data-v="1" ${i<R.lines.length-1?'':'disabled'}>▶</button><button class="btn sm" data-act="dbpress">추궁</button></div>
  <h3 class="sec">증거 제시</h3><div class="db-ev">${d.evidence.map(e=>`<button class="btn sm ghost" data-act="dbshow" data-v="${e.id}" title="${esc(e.desc)}"><b>${esc(e.name)}</b><small>${esc(e.desc)}</small></button>`).join('')}</div>
  <h3 class="sec">동료 설득</h3><div class="row" style="gap:6px;flex-wrap:wrap">${sq.map(c=>`<button class="btn sm ghost" data-act="dbpers" data-v="${c.id}">${esc(c.name)}</button>`).join('')||'<span class="muted">편성한 '+System.T('crew')+'이(가) 없어요</span>'}</div>
  <div class="row" style="margin-top:10px"><button class="btn ghost" data-act="dbquit">그만두기</button></div>`); }

    /* 콘테스트 */
static contestStart(ch,s){ const ent=P().squad.map(charById).filter(c=>c&&Characters.own(c.id)).slice(0,3); if(!ent.length){ CoreView.toast(`출전할 ${System.T('crew')}을(를) 편성해 주세요`); return; }
    MD={kind:'contest',ch,s,round:0,ent,score:0,hype:0,last:null,rivals:s.contest.rivals.map(r=>({...r,score:0})),log:[]}; BattleView.contestDraw(); }

  static contestDraw(msg){ const {s,round,ent,score,hype}=MD, c=s.contest, j=Battle.contestPref(round);
    CoreView.openModal(`${head(esc(c.title),`<span class="muted">라운드 ${round+1}/${c.rounds} · 분위기 ${'♪'.repeat(hype)||'—'}</span>`)}
  <p>심사위원 <b>${esc(j.name)}</b>은(는) <b>${CHARM[j.likes]}</b>을(를) 좋아해요.</p>${msg?`<p class="db-msg">${esc(msg)}</p>`:''}
  <div class="ct-board"><div><b>우리</b> ${nf(score)}</div>${MD.rivals.map(r=>`<div>${esc(r.name)} ${nf(r.score)}</div>`).join('')}</div>
  ${ent.map(e=>{ const ch=Battle.charmOf(e); return `<div class="panel" style="padding:8px;margin:6px 0"><b>${esc(e.name)}</b>${MD.last===e.id?' <span class="muted">(방금 어필 — 연달아 쓰면 분위기가 식어요)</span>':''}<div class="row" style="gap:4px;flex-wrap:wrap;margin-top:4px">${Object.keys(CHARM).map(k=>`<button class="btn sm ${k===j.likes?'':'ghost'}" data-act="ctap" data-c="${e.id}" data-k="${k}">${CHARM[k]} ${ch[k]}</button>`).join('')}</div></div>`; }).join('')}
  <div class="row" style="margin-top:8px"><button class="btn ghost" data-act="dbquit">그만두기</button></div>`); }

  static sortieMap(msg){ const x=Battle.sortieParts(); if(!x) return; const {run,s,R}=x, cur=Battle.nodeById(R,run.node), done=new Set(run.path), sq=run.squad.map(charById).filter(Boolean);
    const nodeBtn=n=>{ const here=n.id===run.node, past=done.has(n.id); return `<div class="so-node k-${n.kind} ${here?'here':''} ${past?'past':''}"><b>${{battle:'⚔',elite:'☠',supply:'⛺',boss:'♛'}[n.kind]||'●'} ${esc(n.name)}</b>${n.hint?`<span>${esc(n.hint)}</span>`:''}</div>`; };
    const cols=[[Battle.nodeById(R,'n1')],[Battle.nodeById(R,'n2a'),Battle.nodeById(R,'n2b')],[Battle.nodeById(R,'n3')]];
    CoreView.openModal(`${head(esc(s.title),'<span class="muted">출격 경로 · 체력이 이어져요</span>')}${msg?`<p class="so-msg">${esc(msg)}</p>`:''}
  <div class="so-map">${cols.map(c=>`<div class="so-col">${c.map(nodeBtn).join('')}</div>`).join('<i class="so-arrow">›</i>')}</div>
  <div class="so-sq">${sq.map(c=>{ const h=run.hp[c.id]??1; return `<div class="so-u ${h<=0?'down':h<.25?'crit':''}"><b>${esc(c.name)}</b><span class="hpb"><i style="width:${Math.round(Math.max(0,h)*100)}%"></i></span><small>${RANGE_ICO[Core.charRange(c)]} ${h<=0?'전투 불능':h<.25?'대파':Math.round(h*100)+'%'}</small></div>`; }).join('')}</div>
  ${BattleView.sortieChoices(x)}`); }

  static sortieChoices(x){ const {run,R}=x, cur=Battle.nodeById(R,run.node), sq=run.squad.map(charById).filter(Boolean), crit=sq.filter(c=>(run.hp[c.id]??1)>0&&(run.hp[c.id]??1)<.25).length;
    if(!run.path.includes(cur.id)) return `<div class="row" style="margin-top:10px;gap:6px"><button class="btn" data-act="sogo">${cur.kind==='supply'?'보급 받기':cur.kind==='boss'?'보스전 시작':'전투 시작'}</button><button class="btn ghost" data-act="soretreat">퇴각</button></div>`;
    const next=(cur.next||[]).map(id=>Battle.nodeById(R,id)); const ok=n=>!n.need||sq.some(c=>c.role===n.need.role&&(run.hp[c.id]??1)>0);
    return `${next.length>1?`<p class="muted" style="margin:8px 0 4px">${esc(R.fork)} — 어느 길로 갈까요?</p>`:''}<div class="row" style="margin-top:6px;gap:6px;flex-wrap:wrap">${next.map(n=>`<button class="btn ${n.kind==='boss'?'':'ghost'}" data-act="sonext" data-v="${n.id}" ${ok(n)?'':'disabled'}>진격 → ${esc(n.name)}</button>`).join('')}<button class="btn ghost" data-act="soretreat">퇴각</button></div>${crit?`<p class="so-warn">대파(체력 25% 미만) ${crit}명 — 진격하면 위험해요</p>`:''}`; }

    /* 출격 지점 결과(View) */
static sortieNodeResultHTML(R){ return R.win?`<h2 class="disp" style="color:var(--rose);margin:0">${esc(R.name)} 돌파</h2><p>${Core.rewardText(R.g)} · 경험치 +${R.xp}</p><button class="btn" data-act="somap">경로로</button>`
    :`<h2 class="disp" style="color:#ff5277">작전 실패</h2><p>${esc(R.name)}에서 밀려났어요. 편성·대열을 바꿔 다시 출격하세요.</p><button class="btn" data-act="bdone">계속</button>`; }

  static battleSysPanel(){ const r=G.meta.rules||{}; return `<div class="panel pm-hide"><h3>전투 체계</h3><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-act="bsys" data-k="formation" ${Rules.formOn()?'checked':''}>대열 (근접·원거리·지원, 전열이 후열을 지킴)</label><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-act="bsys" data-k="sortie" ${Battle.sortieOn()?'checked':''}>출격 경로 (지점마다 진격·퇴각, 갈림길, 체력 유지)</label><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-act="bsmode" data-k="debate" ${Battle.modesCfg().debate?'checked':''}>회담 스테이지 (주장·증거·설득) — 새 스토리 생성에 섞기</label><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-act="bsmode" data-k="contest" ${Battle.modesCfg().contest?'checked':''}>콘테스트 스테이지 (매력 어필) — 새 스토리 생성에 섞기</label></div>`; }
}
