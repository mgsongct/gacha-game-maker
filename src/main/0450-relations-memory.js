/* ===== 인물 관계도 · 스토리 기억 =====
   관계는 두 사람(대원·NPC·플레이어) 사이의 기록이에요. 로어북처럼 글에 이름이 나오면 그 사람의 관계만 골라 AI에 넣어요. */
const REL_ME='me';
function RELS(){ return gameRead('rels'); } // 읽기 — 바꿀 때는 아래 관계 함수(relPut·relKeep)
/* 관계 기록 바꾸기(Model — 관계 칸 G.rels는 이 모듈만 씀): 넣기 · 조건에 맞는 것만 남기기 */
function relPut(r){ gameSlot('rels').push(r); return r; }
function relKeep(keep){ G.rels=RELS().filter(keep); }
/* 스토리 삭제 때 관계 정리(storyPurge가 부름 — L: storyLinks, pick: 지울 갈래): 그 스토리에서 생긴 관계와 남은 관계의 그 스토리 기록, 지운 인물의 관계를 빼고 청소(relGC) */
function relPurgeStory(L,pick){ if(pick.rels){ const gone=new Set(L.rels.filter(L.born).map(r=>r.id)); relKeep(r=>!gone.has(r.id)); RELS().forEach(r=>{ if(r.hist) r.hist=r.hist.filter(h=>!L.src.includes(h.src)); }); mark('meta'); }
  if(pick.chars){ const cs=new Set(L.chars.map(c=>c.id)); relKeep(r=>!cs.has(r.a)&&!cs.has(r.b)); mark('meta'); } relGC(); }
function relRef(name){ let n=String(name||'').trim().replace(/^\{|\}$/g,'').replace(/\s*\(.*?플레이어.*?\)$/,''); if(!n) return '';
  const pn=String(P().player||'').trim(); if(n===T('player')||n==='플레이어'||n==='주인공'||n==='나'||(pn&&n===pn&&!G.chars.some(c=>c.name===n))) return REL_ME;
  const c=findSpeaker(n); if(c) return baseChar(c).id; const m=npcBy(n); if(m) return m.id;
  const loose=G.chars.find(c=>n.length>=2&&(c.name.startsWith(n)||n.startsWith(c.name)))||(G.npcs||[]).find(c=>n.length>=2&&(c.name.startsWith(n)||n.startsWith(c.name))); if(loose) return baseChar(loose).id;
  return 'x:'+n.slice(0,20); }
function relObj(ref){ if(!ref||ref===REL_ME||ref.startsWith('x:')) return null; return charById(ref)||(G.npcs||[]).find(n=>n.id===ref)||null; }
function relName(ref,ui){ if(ref===REL_ME) return ui?'나 ('+T('player')+')':T('player')+'(플레이어)'; if(ref.startsWith('x:')) return ref.slice(2); const o=relObj(ref); return o?o.name:'(지워진 인물)'; }
function relKeys(){ const out=[]; const add=(ref,o)=>{ const k=[o.name]; const f=String(o.name).split(/[\s(]/)[0]; if(f&&f.length>=2&&f!==o.name) k.push(f); out.push([ref,k]); };
  G.chars.forEach(c=>add(baseChar(c).id,c)); (G.npcs||[]).forEach(n=>add(n.id,n)); RELS().forEach(r=>[r.a,r.b].forEach(x=>{ if(x.startsWith('x:')&&!out.some(o=>o[0]===x)) out.push([x,[x.slice(2)]]); })); return out; }
function relPair(a,b){ return RELS().find(r=>(r.a===a&&r.b===b)||(r.a===b&&r.b===a)); }
function relOf(ref){ return RELS().filter(r=>r.a===ref||r.b===ref); }
function relOther(r,ref){ return r.a===ref?r.b:r.a; }
// AI가 돌려준 관계 변화를 합쳐요: [{a,b,kind,note,event}]
// IF·외전 로어 범위: ''(정사·로어북에 반영) | 'if'(로어북에 반영 안 함) | 이격 id(그 이격의 기록에만 남겨요)
function loreOf(x){ const l=x&&x.lore; return l==='if'?'if':(l&&charById(l)?l:''); }
function loreMap(a,b,lore){ if(!lore) return [a,b]; if(lore==='if') return null; const al=charById(lore), base=al?baseChar(al).id:''; if(a===base) a=lore; if(b===base) b=lore; return (a===lore||b===lore)&&a!==b?[a,b]:null; }
function loreLabel(l){ return l==='if'?'IF 스토리':(l&&charById(l)?'이격 「'+charById(l).name+'」 전용':''); }
function loreOpts(cur){ return [['','정사 — 관계·기억(로어북)에 반영'],['if','IF 스토리 — 로어북에 반영 안 함'],...G.chars.filter(c=>c.alt&&charById(c.alt)).map(c=>[c.id,'이격 「'+c.name+'」의 기록에만 반영'])]; }
function relApply(arr,src,quiet,lore){ let n=0; if(lore==='if') return 0; (Array.isArray(arr)?arr:[]).slice(0,40).forEach(x=>{ if(!x) return; let a=relRef(x.a), b=relRef(x.b); if(!a||!b||a===b) return; const m=loreMap(a,b,lore); if(!m) return; [a,b]=m;
    let r=relPair(a,b); const kind=String(x.kind||'').trim().slice(0,16), note=String(x.note||'').trim().slice(0,800), ev=String(x.event||'').trim().slice(0,400);
    if(!r){ r={id:'r'+uid(),a,b,kind:kind||'아는 사이',note,hist:[],src:String(src||'')}; relPut(r); } else { if(kind) r.kind=kind; if(note) r.note=note; if(kind||note) r.sys=false; } relNames(r);
    if(ev) { r.hist=(r.hist||[]).concat([{src:String(src||''),text:ev,at:Date.now()}]).slice(-30); } r.at=Date.now(); n++; });
  if(n&&!quiet) mark('meta'); return n; }
function relLine(r){ const last=(r.hist||[]).slice(-4).map(h=>(h.src?h.src+': ':'')+h.text).join(' / '); return `- ${relName(r.a)} ↔ ${relName(r.b)}: [${r.kind||'아는 사이'}] ${r.note||''}${last?' (최근: '+last+')':''}`; }
// 장별 요약(스토리 기억)
/* 시스템이 맡는 기록: 대본·설정을 읽어 관계와 요약을 채워요(AI 호출 없이) */
function stageCast(s,withMe){ const set=new Set(); parseScript((s.pre||'')+'\n'+(s.post||'')).forEach(L=>{ if(L.type!=='say'||isMe(L.who)) return; const r=relRef(L.who); if(r&&!r.startsWith('x:')) set.add(r); }); if(withMe&&set.size) set.add(REL_ME); return set; }
function relNew(a,b,kind,note,src,quiet,stage){ if(!a||!b||a===b||relPair(a,b)) return 0; relPut(relNames({id:'r'+uid(),a,b,kind,note:(src&&note?src+': ':'')+note,hist:[],sys:true,at:Date.now(),stage:stage||''})); if(!quiet) mark('meta'); return 1; }
// 관계에 두 사람 이름도 적어 둬요: 나중에 id가 바뀌어도(리롤·가져오기) 이름으로 다시 이어 붙일 수 있게
function relNames(r){ [['a','an'],['b','bn']].forEach(([k,n])=>{ const o=relObj(r[k]); if(o) r[n]=o.name; }); return r; }
// 같은 스테이지에 함께 나온 두 사람은 '아는 사이'(플레이어와는 '함께한 사이')로 처음 한 번 기록해요
function relFromScripts(ch,src,quiet){ if(!ch||ch.relScan) return 0; let n=0; src=src||ch.title; const lore=loreOf(ch);
  if(lore!=='if') (ch.stages||[]).forEach(s=>{ const cast=[...stageCast(s,true)]; for(let i=0;i<cast.length;i++) for(let j=i+1;j<cast.length;j++){ const me=cast[i]===REL_ME||cast[j]===REL_ME, m=loreMap(cast[i],cast[j],lore); if(!m) continue; n+=relNew(m[0],m[1],me?'함께한 사이':'아는 사이',`「${s.title}」에서 함께 있었다`,src,true,s.id); } });
  ch.relScan=true; if(!quiet){ if(n) mark('meta'); mark('ch:'+ch.id); } return n; }
// 인물 설정(프로필·과거)에 다른 인물의 이름이 나오면 그 문장을 관계로 기록해요
function relFromProfiles(quiet){ let n=0; const who=[...G.chars.filter(c=>!c.alt),...(G.npcs||[])];
  who.forEach(a=>{ const txt=String(a.profile||''); if(!txt) return; who.forEach(b=>{ if(a===b||String(b.name).length<2||!txt.includes(b.name)) return; const sen=(txt.split(/(?<=[.!?。])\s*/).find(x=>x.includes(b.name))||'').slice(0,160); n+=relNew(baseChar(a).id||a.id,baseChar(b).id||b.id,'아는 사이',sen,'설정',true); }); });
  if(n&&!quiet) mark('meta'); return n; }
function memCatchUp(){ relGC(); if(!G.meta.relProf){ relFromProfiles(); G.meta.relProf=1; mark('meta'); } G.chapters.forEach(ch=>relFromScripts(ch,ch.kind==='event'?'외전 「'+ch.title+'」':ch.title)); }
async function relSeedAI(rep){ if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return 0; }
  const r=await aiJSON(relSeedAIPrompt(),rep,'default');
  const n=r?relApply(r.relations,'정리'):0; return n; }
function relNodeHTML(ref,x,y,big){ const o=relObj(ref), s=o&&imgSrc(o.upper&&imgSrc(o.upper)?o.upper:o), nm=relName(ref,true);
  return `<button class="rl-node ${big?'big':''} ${ref===REL_ME?'me':''} ${o&&o.npc?'npc':''}" style="left:${x}%;top:${y}%" data-act="relgo" data-r="${esc(ref)}"><span class="rl-av">${s?`<img src="${esc(s)}" alt="">`:`<i>${esc(ref===REL_ME?'나':nm.slice(0,1))}</i>`}</span><b>${esc(ref===REL_ME?T('player'):nm)}</b></button>`; }
let RELC=REL_ME;
let RELUNDO=null;
function openRel(ref){ if(ref) RELC=ref; const c=RELC, rs=relOf(c), nb=rs.map(r=>relOther(r,c));
  const N=nb.length, pos=nb.map((x,i)=>{ const a=-Math.PI/2+i*2*Math.PI/Math.max(1,N), rr=N>8?40:36; return [50+rr*Math.cos(a),50+rr*Math.sin(a)*0.92]; });
  const lines=pos.map(([x,y],i)=>`<line x1="50" y1="50" x2="${x}" y2="${y}"/><text x="${(50+x)/2}" y="${(50+y)/2}">${esc(rs[i].kind||'')}</text>`).join('');
  const people=[[REL_ME,relName(REL_ME,true)],...G.chars.filter(x=>!x.alt).map(x=>[x.id,x.name]),...(G.npcs||[]).map(x=>[x.id,x.name+' (NPC)'])].filter(([id])=>id!==c);
  openModal(`${head('인물 관계도',`<span class="muted">사람을 누르면 그 사람을 가운데에 두고 넓혀 봐요</span>`)}
    <div class="rl-map"><svg viewBox="0 0 100 100" preserveAspectRatio="none">${lines}</svg>${relNodeHTML(c,50,50,true)}${nb.map((x,i)=>relNodeHTML(x,pos[i][0],pos[i][1])).join('')}${N?'':'<p class="rl-empty muted">아직 이 사람의 관계 기록이 없어요</p>'}</div>
    <div class="row" style="margin:6px 0">${c!==REL_ME?`<button class="btn sm ghost" data-act="relgo" data-r="${REL_ME}">나를 가운데로</button>`:''}<button class="btn sm ghost" data-act="relrebuild" title="AI 없이 대본·인물 설정을 다시 읽어 빠진 기본 관계를 채워요">🔄 빠진 관계 다시 채우기</button>${SAMPLE?'<button class="btn sm ghost" data-act="relseed">✦ AI로 관계 넓히기</button>':''}${RELUNDO?'<button class="btn sm ghost" data-act="relundo">↩ 되돌리기</button>':''}<span class="muted" style="font-size:.76rem;align-self:center">기록 ${RELS().length}개 · 스토리를 만들 때마다 자동으로 늘어나요</span></div>
    <h3 class="sec">${esc(relName(c,true))}의 관계</h3>
    ${rs.map(r=>{ const o=relOther(r,c); return `<div class="rl-row"><div class="t"><b>${esc(relName(o,true))}</b> <em>${esc(r.kind||'')}</em><p>${esc(r.note||'')}</p>${(r.hist||[]).length?`<small>${(r.hist||[]).slice(-3).map(h=>esc((h.src?h.src+' · ':'')+h.text)).join('<br>')}</small>`:''}</div><div class="rl-acts"><button class="btn sm ghost" data-act="relgo" data-r="${esc(o)}">보기</button><button class="btn sm ghost" data-act="reledit" data-id="${r.id}">고치기</button></div></div>`; }).join('')||'<p class="muted">관계가 없어요. 아래에서 직접 추가하거나 AI로 넓혀 보세요.</p>'}
    <h3 class="sec">관계 추가</h3>
    <div class="g2"><div><label class="f" for="rl_b">상대</label><select class="in" id="rl_b">${people.map(([id,n])=>`<option value="${esc(id)}">${esc(n)}</option>`).join('')}</select></div><div><label class="f" for="rl_k">관계</label><input class="in" id="rl_k" maxlength="16" placeholder="예: 소꿉친구"></div></div>
    <label class="f" for="rl_n">설명</label><input class="in" id="rl_n" maxlength="240" placeholder="예: 어릴 적 같은 마을에서 자랐지만 5년 전 사건 뒤로 연락이 끊겼다">
    <div class="row" style="margin-top:8px"><button class="btn sm" data-act="reladd">추가</button></div>`);
}
function openRelEdit(id){ const r=RELS().find(x=>x.id===id); if(!r) return;
  openModal(`${head('관계 고치기',`<span class="muted">${esc(relName(r.a,true))} ↔ ${esc(relName(r.b,true))}</span>`)}
    <label class="f" for="rle_k">관계</label><input class="in" id="rle_k" maxlength="16" value="${esc(r.kind||'')}">
    <label class="f" for="rle_n">설명</label><textarea class="in" id="rle_n" maxlength="240">${esc(r.note||'')}</textarea>
    <label class="f" for="rle_h">있었던 일 (한 줄에 하나, 최근이 아래)</label><textarea class="in" id="rle_h">${esc((r.hist||[]).map(h=>(h.src?h.src+' · ':'')+h.text).join('\n'))}</textarea>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="relsave" data-id="${r.id}">저장</button><button class="btn ghost" data-act="reldel" data-id="${r.id}">이 관계 지우기</button><button class="btn ghost" data-act="relgo" data-r="${esc(RELC)}">돌아가기</button></div>`); }
/* src/main/0250-story-factory.js에서 옮김 */
// 관계 청소: 없어진 인물·스테이지에서 생긴 자동 기록, 내용이 다 지워진 빈 기록을 지워요
function relGC(){ const ok=x=>x===REL_ME||x.startsWith('x:')||!!relObj(x); let fixd=0;
  RELS().forEach(r=>{ [['a','an'],['b','bn']].forEach(([k,n])=>{ if(ok(r[k])||!r[n]) return; const c=findSpeaker(r[n])||npcBy(r[n]); if(c){ r[k]=baseChar(c).id||c.id; fixd++; } }); if(!r.an||!r.bn) relNames(r); });
  if(fixd){ const seen=new Map(); relKeep(r=>{ if(r.a===r.b) return false; const k=[r.a,r.b].sort().join('|'); if(seen.has(k)){ const o=seen.get(k); o.hist=[...(o.hist||[]),...(r.hist||[])].slice(-12); return false; } seen.set(k,r); return true; }); mark('meta'); }
  const n0=RELS().length;
  relKeep(r=>ok(r.a)&&ok(r.b)&&!(r.stage&&!stageById(r.stage))&&!(!r.sys&&!r.note&&!(r.hist||[]).length&&r.src)); if(RELS().length!==n0) mark('meta'); return n0-RELS().length; }
