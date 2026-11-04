/* ===== 시련의 탑 ===== */
/* 층마다 강해지는 무한 전투. 통합 탑(누구나) + 제한 탑(소속별·속성별: 그 소속/속성 캐릭터만 출전) → 여러 캐릭터를 모으고 키울 이유.
   적은 이 게임 스토리에 나온 적 이름·외형을 다시 쓰고(생성 연계), 층마다 전장 규칙이 바뀌어요(0485). 5층마다 보스·큰 보상.
   P().tower={[탑 id]:{best}} · 문서: docs/research/combat-content.md */

function towerList(){ const L=[{id:'all',name:'시련의 탑',desc:'누구나 출전',allow:null}];
  ruleFacs().forEach(f=>L.push({id:'f:'+f,name:`${f}의 탑`,desc:`${f} 소속만 출전`,allow:c=>c.faction===f}));
  ELEMS.forEach(elem=>L.push({id:'e:'+elem,name:`${elem}의 탑`,desc:`${elem} 속성만 출전`,allow:c=>c.elem===elem}));
  return L; }
function towerById(id){ return towerList().find(t=>t.id===id); }
function towerPool(boss){ const out=[]; G.chapters.forEach(ch=>(ch.stages||[]).forEach(s=>(s.enemies||[]).forEach(e=>{ if(!!e.boss===!!boss&&!out.some(x=>x.name===e.name)) out.push(e); }))); return out; }
function towerStage(tid,floor){ const t=towerById(tid)||towerById('all'), h=hashN(tid+'#'+floor), boss=floor%5===0, k=(floor-1)*.4;
  const pool=towerPool(false), bp=towerPool(true), foeElem=tid.startsWith('e:')?(ELEMS.find(elem=>BEATS[tid.slice(2)]===elem)||ELEMS[0]):null;
  const mk=(src,i,b)=>{ const e={name:(src&&src.name)||(b?'탑의 수호자':'탑의 파수꾼'),look:src&&src.look,elem:foeElem&&i%2===0?foeElem:ELEMS[(h+i)%ELEMS.length],hp:900,atk:90,def:40,spd:92+Math.min(40,floor),boss:!!b}; return fitEnemy(e,enemyTarget(k,i,!!b)); };
  const n=boss?2:Math.min(4,2+Math.floor(floor/10)), en=[]; for(let i=0;i<n;i++) en.push(mk(pool[(h+i*7)%Math.max(1,pool.length)],i,false)); if(boss) en.push(mk(bp[h%Math.max(1,bp.length)],n,true));
  const s={id:`tower_${tid}_${floor}`,title:`${t.name} ${floor}층`,enemies:en,reward:0,pre:'',post:''};
  stageAutoRules(s,floor%3===1?0:1,boss?2:9); return s; }
function towerReward(floor){ return floor%5===0?{gems:80,gold:3000+floor*300,core:2}:{gems:20,gold:1500+floor*150}; }
function towerGo(tid){ const t=towerById(tid); if(!t) return; const fl=((progRead('tower')[tid]||{}).best||0)+1, st=towerStage(tid,fl);
  if(t.allow&&!G.chars.some(c=>own(c.id)&&t.allow(c))){ toast(`${t.desc} — 출전할 수 있는 ${T('crew')}이(가) 없어요`); return; }
  squadSel=null; FORM=null; openFormation(st,{kind:'tower',tid,floor:fl,allow:t.allow,code:'',extra:`data-v="${esc(tid)}"`},'towerstart'); }
function towerEnd(win){ const c=B.ctx, T0=progSlot('tower'), rec=T0[c.tid]||(T0[c.tid]={best:0}); let r=null;
  if(win&&c.floor>rec.best){ rec.best=c.floor; r=rateR(towerReward(c.floor)); giveReward(r); } B.allies.forEach(u=>{ const o=own(u.c.id); if(o) gainExp(o,expR(40+c.floor*4)); }); mark('prog'); sfx(win?'승리':'패배');
  return `<h2 class="disp" style="color:${win?'var(--rose)':'#ff5277'};margin:0">${win?`${c.floor}층 돌파!`:`${c.floor}층 실패`}</h2><p>${r?'첫 돌파 보상: '+rewardText(r):win?'':'편성·속성을 바꾸거나 더 키워서 다시 도전하세요. 전장 규칙을 확인해 보세요.'}</p><button class="btn" data-act="bdone">계속</button>`; }
function towerHTML(){ const T0=progRead('tower'); return `<section class="ch-card"><div class="ch-h"><i>TRIAL TOWER</i><h3>시련의 탑</h3><span>층마다 강해지는 적과 바뀌는 전장 규칙. 제한 탑은 그 소속·속성 ${T('crew')}만 출전해요. 5층마다 보스와 큰 보상.</span></div>
  <div class="tw-list">${towerList().map(t=>{ const b=(T0[t.id]||{}).best||0, n=t.allow?G.chars.filter(c=>own(c.id)&&t.allow(c)).length:G.chars.filter(c=>own(c.id)).length;
    return `<button class="tw-card" data-act="towergo" data-v="${esc(t.id)}" ${n?'':'disabled'}><b>${esc(t.name)}</b><span>${esc(t.desc)} · 보유 ${n}명</span><br><span>최고 ${b}층 → 다음 ${b+1}층</span></button>`; }).join('')}</div></section>`; }
document.addEventListener('click',e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act;
  if(a==='towergo') towerGo(el.dataset.v);
  else if(a==='towerstart'){ const c=FORM&&FORM.ctx; if(!c||c.kind!=='tower') return; P().squad=[...squadSel]; mark('prog'); closeModal(); startStage(FORM.stage,{kind:'tower',tid:c.tid,floor:c.floor,allow:c.allow}); } });
