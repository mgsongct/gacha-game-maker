/* ===== 스테이지 양식: 전투 말고도 회담(설득·증거)·콘테스트(매력) ===== */
/* s.mode = 'battle'(기본) | 'story'(s.story) | 'debate' | 'contest'
   - 회담 s.debate={opponent,goal,evidence:[{id,name,desc}],rounds:[{claim,lines:[{text,press,weak,persuade:{who,text}}]}],hp,win,lose}
     상대의 주장(줄)마다 추궁(press: 더 듣기)·증거 제시(weak와 같은 증거면 돌파)·동료 설득(persuade.who가 편성에 있으면 돌파).
     라운드마다 돌파 1번이 필요. 틀린 증거는 신뢰도 −1, 0이 되면 실패(다시 도전).
   - 콘테스트 s.contest={title,judges:[{name,likes}],rounds,rivals:[{name,power}]}
     출전 3명 → 라운드마다 출전자와 어필 종류를 고름. 점수 = 매력(개성 시트·역할·희귀도·호감도·레벨) × (심사위원 취향이면 1.6) × 분위기.
     같은 사람을 연달아 쓰면 분위기가 깨지고, 취향을 맞추거나 다른 사람으로 이어 가면 분위기가 오름. 1위면 통과.
   - 생성 연계: 조각 STAGE_MODES(프롬프트 스튜디오)를 장·이벤트·새 게임 1장 프롬프트에 넣고, stageSchema의 mode·debate·contest를
     buildStages가 검증(modeClean). 잘못되면 전투로. 설정에서 양식별로 끔. 문서: docs/research/stage-modes.md */
// 장의 마지막(클라이맥스) 스테이지 형식 — 세계관 단계가 장르에 맞게 고름(G.meta.story.finale). 지시문은 프롬프트 스튜디오의 FINALE_RULE, 값은 여기서
const FINALE_SCHEMA='"finale":"battle|contest|debate"'; // 새 게임 세계관 단계 스키마
const FINALE_END={battle:'보스전과',contest:'결승 무대와',debate:'결정적인 회담과'};
const finaleOf=f=>['contest','debate'].includes(f)?f:'battle';
const finaleRule=()=>`이 게임의 finale: ${storyCfg().finale}. ${FINALE_RULE}`, finaleEnd=()=>FINALE_END[storyCfg().finale];
// 스테이지 집필(writeStages)의 스테이지 종류 표시 — 회담·콘테스트면 프롬프트 스튜디오의 STAGE_WRITE_RULE(대본은 그 전·후만)을 붙임
const STAGE_KIND={debate:'회담 스테이지',contest:'콘테스트 스테이지'};
function stageWhat(s){ return s.story?' — 전투 없는 이야기 스테이지':STAGE_KIND[s.mode]?` — ${STAGE_KIND[s.mode]}. ${STAGE_WRITE_RULE}`:' — 전투 전(pre)과 전투 후(post)'; }
const CHARM={cool:'멋',cute:'귀여움',beauty:'아름다움',smart:'지성',tough:'강인함'};
const CHARM_KW={cool:/쿨|냉정|과묵|카리스마|멋|차분|무뚝뚝/,cute:/귀여|밝|천진|장난|애교|활발|명랑/,beauty:/우아|아름|기품|섬세|예술|고상|신비/,smart:/똑똑|지적|분석|침착|박식|천재|논리|책/,tough:/강인|용감|열혈|근성|힘|투지|단단|호쾌/};
function modesCfg(){ const m=(G.meta.story||{}).modes||{}; return {debate:m.debate!==false,contest:m.contest!==false}; }
function charmOf(c){ const p=c.persona||{}, txt=[...(p.traits||[]),p.gap,p.hobby,...(p.likes||[]),p.motif,c.profile].join(' '), o=own(c.id)||{lv:1,aff:0}, out={};
  Object.keys(CHARM).forEach(k=>{ let v=20+(CHARM_KW[k].test(txt)?25:0)+((p.traits||[]).filter(t=>CHARM_KW[k].test(t)).length*10); out[k]=v; });
  out[c.role==='sup'?'smart':'tough']+=c.role==='def'?15:10; if(c.role==='atk') out.cool+=8;
  const m=(1+(c.rarity||1)*.1)*(1+affLv(o)*.04)*(1+Math.min(120,o.lv||1)/200); Object.keys(out).forEach(k=>out[k]=Math.round(out[k]*m)); return out; }
const S_=(v,n)=>String(v||'').trim().slice(0,n||200);
function modeClean(s){ const mode=String(s&&s.mode||'').trim(), cfg=modesCfg();
  if(mode==='debate'&&cfg.debate&&s.debate){ const d=s.debate, ev=(Array.isArray(d.evidence)?d.evidence:[]).slice(0,8).map((e,i)=>({id:S_(e.id,12).replace(/[^\w-]/g,'')||'e'+(i+1),name:S_(e.name,30),desc:S_(e.desc,160)})).filter(e=>e.name);
    const ids=new Set(ev.map(e=>e.id)), rounds=(Array.isArray(d.rounds)?d.rounds:[]).slice(0,4).map(r=>({claim:S_(r.claim,120),lines:(Array.isArray(r.lines)?r.lines:[]).slice(0,6).map(l=>({text:S_(l.text,200),press:S_(l.press,200),weak:ids.has(S_(l.weak,12))?S_(l.weak,12):'',persuade:l.persuade&&S_(l.persuade.who,20)?{who:S_(l.persuade.who,20),text:S_(l.persuade.text,200)}:null})).filter(l=>l.text)})).filter(r=>r.lines.length&&r.lines.some(l=>l.weak||l.persuade));
    if(ev.length&&rounds.length) return {mode:'debate',debate:{opponent:S_(d.opponent,20)||'상대',goal:S_(d.goal,120),evidence:ev,rounds,hp:Math.max(3,Math.min(7,+d.hp||5)),win:S_(d.win,200),lose:S_(d.lose,200)}}; }
  if(mode==='contest'&&cfg.contest&&s.contest){ const c=s.contest, judges=(Array.isArray(c.judges)?c.judges:[]).slice(0,3).map(j=>({name:S_(j.name,20)||'심사위원',likes:CHARM[j.likes]?j.likes:Object.keys(CHARM).find(k=>CHARM[k]===j.likes)||'cool'}));
    if(judges.length) return {mode:'contest',contest:{title:S_(c.title,40)||'콘테스트',judges,rounds:Math.max(2,Math.min(5,+c.rounds||3)),rivals:(Array.isArray(c.rivals)?c.rivals:[]).slice(0,3).map(r=>({name:S_(r.name,20)||'경쟁자',power:Math.max(.6,Math.min(1.6,+r.power||1))})).filter(r=>r.name)}}; }
  return null; }
const MODE_SCHEMA=`"mode":"battle|debate|contest","debate":{"opponent":"상대 이름","goal":"이 회담의 목표","evidence":[{"id":"e1","name":"","desc":""}],"rounds":[{"claim":"상대 주장 요약","lines":[{"text":"상대의 말","press":"추궁하면 나오는 대답","weak":"모순을 밝히는 증거 id 또는 빈칸","persuade":{"who":"","text":""}}]}],"win":"","lose":""},"contest":{"title":"","judges":[{"name":"","likes":"${Object.keys(CHARM).join('|')}"}],"rounds":3,"rivals":[{"name":"","power":1}]}`;
function modeIcon(s){ return s&&s.mode==='debate'?'⚖':s&&s.mode==='contest'?'✦':''; }

/* 공통: 시작·클리어 */
let MD=null;
function openModeStage(ch,s){ const cl=!!P().cleared[s.id], first=!cl, code=ch.kind==='event'?'EV'+(ch.stages.indexOf(s)+1):stageCode(s.id), d=s.debate, c=s.contest;
  openModal(`${head(esc(code+' '+s.title),`<span class="muted">${s.mode==='debate'?'회담 · 주장 속 모순을 증거·설득으로 돌파':'콘테스트 · '+T('crew')+'의 매력으로 심사위원을 사로잡기'}</span>`)}
  ${s.mode==='debate'?`<p><b>상대</b> ${esc(d.opponent)} · <b>목표</b> ${esc(d.goal||'설득')}</p><p class="muted">증거 ${d.evidence.length}개 · 라운드 ${d.rounds.length} · 신뢰도 ${d.hp}</p>`:`<p><b>${esc(c.title)}</b> · 심사위원 ${c.judges.map(j=>`${esc(j.name)}(${CHARM[j.likes]})`).join(', ')}</p><p class="muted">라운드 ${c.rounds} · 경쟁자 ${c.rivals.map(r=>esc(r.name)).join(', ')||'없음'}</p>`}
  <h3 class="sec">${s.mode==='contest'?'출전 (최대 3명)':'함께 갈 동료 (설득에 나설 수 있어요, 최대 4명)'}</h3><div class="row" style="gap:4px;flex-wrap:wrap">${G.chars.filter(x=>own(x.id)&&!x.monster).map(x=>`<label class="chip ${P().squad.includes(x.id)?'on':''}" style="cursor:pointer"><input type="checkbox" data-mdsel="${x.id}" ${P().squad.includes(x.id)?'checked':''} hidden>${esc(x.name)}</label>`).join('')}</div>
  <p class="muted" style="font-size:.8rem">${first?'첫 클리어 보상: ◆'+s.reward:'다시 도전할 수 있어요'}</p>
  <div class="row"><button class="btn" data-act="mdgo" data-ch="${ch.id}" data-st="${s.id}">${s.pre&&first?'이야기 보고 시작':'시작'}</button>${cl&&s.post?`<button class="btn ghost" data-act="story" data-ch="${ch.id}" data-st="${s.id}" data-k="post">끝난 뒤 이야기</button>`:''}<button class="btn ghost" data-act="chedit" data-ch="${ch.id}">스토리 편집</button></div>`); }
function modeClear(ch,s,stars){ const p=P(), first=!p.cleared[s.id]; p.cleared[s.id]=true; p.stars=p.stars||{}; p.stars[s.id]=Math.max(p.stars[s.id]||0,stars);
  if(first){ if(ch.kind==='event'){ const ev=G.events.find(e=>e.id===ch.eventId); giveReward({token:s.reward*2},ev&&ev.id); } else { giveReward(rateR({gems:s.reward,gold:2000})); gateCheck(); recruitCheck(ch,s); } newBonds(s); }
  mark('prog'); closeModal(); const after=()=>{ render(); checkTriggers(); }; if(first&&s.post) playStory(s.title,s.post,after); else after(); toast(`${s.title} 클리어 ${'★'.repeat(stars)}`); }

/* 회담 */
function debateStart(ch,s){ MD={kind:'debate',ch,s,r:0,i:0,hp:s.debate.hp,log:[],pressed:{}}; debateDraw(); }
function debateDraw(msg){ const {s,r,i,hp}=MD, d=s.debate, R=d.rounds[r], L=R.lines[i], opp=findSpeaker(d.opponent)||npcBy(d.opponent), sq=P().squad.map(charById).filter(Boolean);
  openModal(`${head(`회담 · ${esc(d.opponent)}`,`<span class="muted">라운드 ${r+1}/${d.rounds.length} · 신뢰도 ${'◆'.repeat(hp)}${'◇'.repeat(Math.max(0,d.hp-hp))}</span>`)}
  <div class="db-stage">${opp&&imgSrc(opp)?`<div class="db-opp">${art(opp,'',{upper:true})}</div>`:''}<div class="db-claim"><i>${esc(R.claim||'주장')}</i><p class="db-line">“${esc(L.text)}”</p><span class="muted">${i+1}/${R.lines.length}</span></div></div>
  ${msg?`<p class="db-msg">${esc(msg)}</p>`:''}
  <div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn sm ghost" data-act="dbnav" data-v="-1" ${i?'':'disabled'}>◀</button><button class="btn sm ghost" data-act="dbnav" data-v="1" ${i<R.lines.length-1?'':'disabled'}>▶</button><button class="btn sm" data-act="dbpress">추궁</button></div>
  <h3 class="sec">증거 제시</h3><div class="db-ev">${d.evidence.map(e=>`<button class="btn sm ghost" data-act="dbshow" data-v="${e.id}" title="${esc(e.desc)}"><b>${esc(e.name)}</b><small>${esc(e.desc)}</small></button>`).join('')}</div>
  <h3 class="sec">동료 설득</h3><div class="row" style="gap:6px;flex-wrap:wrap">${sq.map(c=>`<button class="btn sm ghost" data-act="dbpers" data-v="${c.id}">${esc(c.name)}</button>`).join('')||'<span class="muted">편성한 '+T('crew')+'이(가) 없어요</span>'}</div>
  <div class="row" style="margin-top:10px"><button class="btn ghost" data-act="dbquit">그만두기</button></div>`); }
function debateHit(text){ const d=MD.s.debate; MD.log.push(text); MD.r++; MD.i=0; MD.pressed={}; sfx('확인'); if(MD.r>=d.rounds.length){ const st=MD.hp===d.hp?3:MD.hp>=Math.ceil(d.hp/2)?2:1, {ch,s}=MD; MD=null; playStory('회담 성공',[`${T('player')}: ${text}`,d.win?`${d.opponent}: ${d.win}`:''].filter(Boolean).join('\n'),()=>modeClear(ch,s,st)); return; } debateDraw(`돌파! ${text}`); }
function debateMiss(msg){ MD.hp--; sfx('타격'); if(MD.hp<=0){ const d=MD.s.debate; MD=null; closeModal(); toast('회담 실패 — 증거와 주장을 다시 살펴보세요'); if(d.lose) playStory('회담 실패',`${d.opponent}: ${d.lose}`,()=>render()); return; } debateDraw(msg); }

/* 콘테스트 */
function contestStart(ch,s){ const ent=P().squad.map(charById).filter(c=>c&&own(c.id)).slice(0,3); if(!ent.length){ toast(`출전할 ${T('crew')}을(를) 편성해 주세요`); return; }
  MD={kind:'contest',ch,s,round:0,ent,score:0,hype:0,last:null,rivals:s.contest.rivals.map(r=>({...r,score:0})),log:[]}; contestDraw(); }
function contestPref(r){ const J=MD.s.contest.judges; return J[r%J.length]; }
function contestDraw(msg){ const {s,round,ent,score,hype}=MD, c=s.contest, j=contestPref(round);
  openModal(`${head(esc(c.title),`<span class="muted">라운드 ${round+1}/${c.rounds} · 분위기 ${'♪'.repeat(hype)||'—'}</span>`)}
  <p>심사위원 <b>${esc(j.name)}</b>은(는) <b>${CHARM[j.likes]}</b>을(를) 좋아해요.</p>${msg?`<p class="db-msg">${esc(msg)}</p>`:''}
  <div class="ct-board"><div><b>우리</b> ${nf(score)}</div>${MD.rivals.map(r=>`<div>${esc(r.name)} ${nf(r.score)}</div>`).join('')}</div>
  ${ent.map(e=>{ const ch=charmOf(e); return `<div class="panel" style="padding:8px;margin:6px 0"><b>${esc(e.name)}</b>${MD.last===e.id?' <span class="muted">(방금 어필 — 연달아 쓰면 분위기가 식어요)</span>':''}<div class="row" style="gap:4px;flex-wrap:wrap;margin-top:4px">${Object.keys(CHARM).map(k=>`<button class="btn sm ${k===j.likes?'':'ghost'}" data-act="ctap" data-c="${e.id}" data-k="${k}">${CHARM[k]} ${ch[k]}</button>`).join('')}</div></div>`; }).join('')}
  <div class="row" style="margin-top:8px"><button class="btn ghost" data-act="dbquit">그만두기</button></div>`); }
function contestAppeal(cid,k){ const e=MD.ent.find(x=>x.id===cid); if(!e) return; const j=contestPref(MD.round), cm=charmOf(e), fit=k===j.likes, same=MD.last===cid;
  MD.hype=same?0:Math.min(4,MD.hype+(fit?1:0)+(MD.last&&!same?1:0)); const pts=Math.round(cm[k]*(fit?1.6:1)*(1+.12*MD.hype)*(.9+Math.random()*.2)); MD.score+=pts; MD.last=cid;
  const ref=Math.round(Object.values(charmOf(MD.ent[0])).reduce((a,b)=>a+b,0)/5*1.25); MD.rivals.forEach(r=>{ r.score+=Math.round(ref*r.power*(.85+Math.random()*.3)); });
  MD.round++; const msg=`${e.name}의 ${CHARM[k]} 어필 +${pts}${fit?' (취향 적중!)':''}${same?' · 분위기가 식었어요':''}`;
  if(MD.round<MD.s.contest.rounds){ sfx(fit?'확인':'알림'); contestDraw(msg); return; }
  const best=Math.max(0,...MD.rivals.map(r=>r.score)), mine=MD.score, win=mine>best, {ch,s}=MD, margin=best?mine/best:2; MD=null;
  if(!win){ closeModal(); toast(`콘테스트 결과: 우리 ${nf(mine)} · 1위 ${nf(best)} — 출전자와 어필을 바꿔 다시 도전해 보세요`); return; }
  modeClear(ch,s,margin>=1.3?3:margin>=1.1?2:1); }
document.addEventListener('click',e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act;
  if(a==='mdgo'){ const ch=G.chapters.find(x=>x.id===el.dataset.ch), s=ch&&ch.stages.find(x=>x.id===el.dataset.st); if(!s) return; const sel=[...document.querySelectorAll('#modal [data-mdsel]')].filter(x=>x.checked).map(x=>x.dataset.mdsel); if(sel.length){ P().squad=sel.slice(0,s.mode==='contest'?3:4); mark('prog'); } closeModal(); const go=()=>s.mode==='debate'?debateStart(ch,s):contestStart(ch,s); if(!P().cleared[s.id]&&s.pre) playStory(s.title,s.pre,go); else go(); }
  else if(!MD) return;
  else if(a==='dbnav'){ const R=MD.s.debate.rounds[MD.r]; MD.i=Math.max(0,Math.min(R.lines.length-1,MD.i+(+el.dataset.v))); debateDraw(); }
  else if(a==='dbpress'){ const L=MD.s.debate.rounds[MD.r].lines[MD.i]; MD.pressed[MD.i]=1; debateDraw(L.press?`${MD.s.debate.opponent}: ${L.press}`:'더 이상 나오는 말이 없어요'); }
  else if(a==='dbshow'){ const L=MD.s.debate.rounds[MD.r].lines[MD.i], ev=MD.s.debate.evidence.find(x=>x.id===el.dataset.v); if(L.weak&&L.weak===el.dataset.v) debateHit(`「${ev.name}」을(를) 제시 — "${L.text}"의 모순을 밝혀냈다!`); else debateMiss(`「${ev?ev.name:''}」은(는) 이 말과 맞지 않아요. 신뢰도 −1`); }
  else if(a==='dbpers'){ const L=MD.s.debate.rounds[MD.r].lines[MD.i], c=charById(el.dataset.v); if(L.persuade&&c&&(c.name===L.persuade.who||ROLE[c.role]===L.persuade.who||c.faction===L.persuade.who)) debateHit(`${c.name}: ${L.persuade.text||'제 말을 들어 주세요.'}`); else debateMiss(`${c?c.name:''}의 말은 이 대목에서 통하지 않았어요. 신뢰도 −1`); }
  else if(a==='ctap') contestAppeal(el.dataset.c,el.dataset.k);
  else if(a==='dbquit'){ MD=null; closeModal(); } });

document.addEventListener('change',e=>{ const id=e.target.dataset&&e.target.dataset.mdsel; if(id) e.target.closest('label').classList.toggle('on',e.target.checked); });
