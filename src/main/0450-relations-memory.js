/* ===== 인물 관계도 · 스토리 기억 =====
   관계는 두 사람(대원·NPC·플레이어) 사이의 기록이에요. 로어북처럼 글에 이름이 나오면 그 사람의 관계만 골라 AI에 넣어요. */
const REL_ME='me';
function RELS(){ if(!Array.isArray(G.rels)) G.rels=[]; return G.rels; }
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
    if(!r){ r={id:'r'+uid(),a,b,kind:kind||'아는 사이',note,hist:[],src:String(src||'')}; RELS().push(r); } else { if(kind) r.kind=kind; if(note) r.note=note; if(kind||note) r.sys=false; } relNames(r);
    if(ev) { r.hist=(r.hist||[]).concat([{src:String(src||''),text:ev,at:Date.now()}]).slice(-30); } r.at=Date.now(); n++; });
  if(n&&!quiet) mark('meta'); return n; }
function relLine(r){ const last=(r.hist||[]).slice(-4).map(h=>(h.src?h.src+': ':'')+h.text).join(' / '); return `- ${relName(r.a)} ↔ ${relName(r.b)}: [${r.kind||'아는 사이'}] ${r.note||''}${last?' (최근: '+last+')':''}`; }
// 로어북: text에 이름이 나온 인물(+extra)의 관계를 골라요. 바로 닿은 관계 먼저, 남으면 한 다리 건너(마인드맵처럼)
function relCtx(text,extra,max){ const altOut=x=>{ const c=charById(x); return !!(c&&c.alt)&&!(extra||[]).includes(x); }, R=RELS().filter(r=>!altOut(r.a)&&!altOut(r.b)); max=Math.min(max||40,60); text=String(text||''); // 이격 전용 기록은 그 이격이 나올 때만 넣어요
  const hit=new Set((extra||[]).filter(Boolean)); relKeys().forEach(([ref,ks])=>{ if(ks.some(k=>k&&text.includes(k))) hit.add(ref); });
  if(!R.length){ return hit.size?`\n인물 관계 기록이 아직 없다. 설정과 지금까지의 이야기에서 함께 나온 적이 있으면 아는 사이로, 아니면 처음 만나는 사이로 자연스럽게 쓴다.`:''; }
  const core=R.filter(r=>(hit.has(r.a)||r.a===REL_ME)&&(hit.has(r.b)||r.b===REL_ME)&&(hit.has(r.a)||hit.has(r.b)));
  const ring=R.filter(r=>!core.includes(r)&&(hit.has(r.a)||hit.has(r.b)));
  const pri=r=>r.sys?1:0, rows=[...core.sort((x,y)=>pri(x)-pri(y)),...ring.sort((x,y)=>pri(x)-pri(y))].slice(0,max); if(!rows.length&&!hit.size) return '';
  const meKnown=new Set(relOf(REL_ME).map(r=>relOther(r,REL_ME))), stranger=[...hit].filter(x=>x!==REL_ME&&relObj(x)&&!meKnown.has(x)&&!relOf(x).length);
  return `\n인물 관계 기록(로어북. 지금까지의 이야기에서 쌓인 사실이다. 이미 아는 사이를 처음 보는 사이처럼 쓰지 않고, 관계와 최근 일을 대사·행동에 자연스럽게 반영한다):\n${smRelationRows(rows)||'(이번 인물들의 기록 없음)'}${stranger.length?`\n아직 관계 기록이 없는 인물: ${stranger.map(x=>relName(x)).join(', ')} — 설정상 아는 사이가 아니면 처음 만나는 사이로 쓴다.`:''}`; }
const REL_SCHEMA=()=>`"relations":[{"a":"인물 이름","b":"인물 이름(플레이어는 ${T('player')})","kind":"관계 2~8자(예: 첫 만남, 동료, 라이벌, 스승과 제자, 짝사랑, 적대, 은인)","note":"지금 두 사람의 관계 1~2문장","event":"이번에 둘 사이에 있었던 일 한 줄"}]`;
const REL_RULE='relations에는 이번 이야기에서 처음 만났거나 관계가 바뀌었거나 의미 있는 일이 있었던 두 사람만 3~15쌍 쓴다(플레이어와의 관계 포함).';
// 장별 요약(스토리 기억)
function chText(ch,max){ return ch.stages.map((s,i)=>`[스테이지 ${i+1} ${s.title}]\n${s.pre||''}\n${s.post||''}`).join('\n').slice(0,max||9000); }
/* 시스템이 맡는 기록: 대본·설정을 읽어 관계와 요약을 채워요(AI 호출 없이) */
function stageCast(s,withMe){ const set=new Set(); parseScript((s.pre||'')+'\n'+(s.post||'')).forEach(L=>{ if(L.type!=='say'||isMe(L.who)) return; const r=relRef(L.who); if(r&&!r.startsWith('x:')) set.add(r); }); if(withMe&&set.size) set.add(REL_ME); return set; }
function relNew(a,b,kind,note,src,quiet,stage){ if(!a||!b||a===b||relPair(a,b)) return 0; RELS().push(relNames({id:'r'+uid(),a,b,kind,note:(src&&note?src+': ':'')+note,hist:[],sys:true,at:Date.now(),stage:stage||''})); if(!quiet) mark('meta'); return 1; }
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
// 요약이 없는 장의 기본 기억: 등장 인물과 스테이지 흐름
function sysDigest(ch){ const cast=new Set(); (ch.stages||[]).forEach(s=>stageCast(s,false).forEach(x=>cast.add(relName(x)))); return `${chLogline(ch)?chLogline(ch)+' ':''}등장: ${[...cast].slice(0,10).join(', ')||'없음'}. 흐름: ${ch.stages.map(s=>s.title).join(' → ')}`; }
function memCatchUp(){ relGC(); if(!G.meta.relProf){ relFromProfiles(); G.meta.relProf=1; mark('meta'); } G.chapters.forEach(ch=>relFromScripts(ch,ch.kind==='event'?'외전 「'+ch.title+'」':ch.title)); }
// 새 대원 능력치는 희귀도·역할로 시스템이 정해요(밸런스가 들쭉날쭉하지 않게)
const SYS_BASE=GGMCombat.CHARACTER_BASE_STATS;
const SYS_SK={dmg:[1.9,2.3,2.8],aoe:[1.0,1.3,1.6],heal:[1.0,1.3,1.6],shield:[1.1,1.5,1.8],buff:[1.0,1.2,1.4]};
function sysStats(c){ const r=[1,2,3].includes(+c.rarity)?+c.rarity:1,i=r-1,B=SYS_BASE[c.role]||SYS_BASE.atk;
  Object.assign(c,GGMCombat.generateBaseStats(c),{baseStatsVersion:1});
  const k=B.sk.includes(c.skill.kind)?c.skill.kind:B.sk[0]; c.skill.kind=k; c.skill.power=SYS_SK[k][i]; c.skill.cd=k==='dmg'?(r===1?2:3):k==='buff'&&r>1?4:3; return c; }
// 적 기본 능력치를 만든 뒤 v2BalanceChapter에서 실제 전투 시뮬레이션으로 조정
function sysEventFoes(ch){ (ch.stages||[]).forEach((s,i)=>(s.enemies||[]).forEach(e=>{ if(e.manual) return; const m=(1+0.08*i)*(e.boss?4.5:1); e.hp=Math.round(1100*m*(0.92+Math.random()*0.16)); e.atk=Math.round(85*(e.boss?1.3:1)*(1+0.05*i)); e.def=Math.round(42*(1+0.05*i)); e.spd=e.spd||95; })); }
async function relSeedAI(btn){ if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return 0; }
  const r=await aiJSON(`${RULES}\n${ctx()}${storyMemo()}\n\n이미 있는 관계 기록:\n${RELS().map(relLine).join('\n')||'없음'}\n\n인물 설정과 지금까지의 이야기를 보고 인물 관계도를 넓혀라. 기존 기록과 겹치지 않는 새 쌍을 10~20개 쓰고, 기존 쌍도 이야기에 비해 낡았으면 고쳐 쓴다. 아는 사이, 처음 보는 사이(아직 만나지 않았지만 서로 엮일 사이는 kind를 "아직 모름"으로), 플레이어와의 관계를 고르게.\nJSON만 출력: {${REL_SCHEMA()}}`,btn,'default');
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
function charSchema(slim){return `{"skills":${JSON.stringify(GGMCombat.defaults({role:"atk"}))},"name":"짧은 이름","faction":"소속 세력","rarity":1~3 정수(3=SSR),"pos":"${POSITIONS().map(p=>p.name).join('|')}","role":"atk|def|sup(포지션의 기본형)","elem":"${ELEMS.join('|')}",${slim?'':'"hp":800~3000(방어형은2280~2820),"atk":80~180,"def":35~160(방어형은122~151),"spd":80~125,'}"skill":{"name":"","kind":"dmg|aoe|heal|shield|buff",${slim?'':'"power":0.8~3.0,"cd":2~4,'}"desc":"한 줄"},"profile":"2~3문장","intro":"${T('gacha')} 연출 첫마디","lines":["로비 인사 대사 8개(아침·밤·오랜만·일상·감정 등 상황을 다양하게). 다른 인물의 이름이나 아직 드러나지 않은 사건·적대 관계는 쓰지 않는다(플레이어가 아직 모를 수 있다)"],"affLines":{"4":["호감도 4부터 나오는 대사"],"7":["호감도 7부터"]},"lvLines":["${T('enhance')} 시 대사 2개"],"dupLines":["${T('limit')} 시 대사 1개"],"touch":{"head":["머리 터치 반응 4개"],"body":["몸 터치 시 당황하거나 놀리는 반응 4개"],"pet":["머리를 쓰다듬어 줄 때 반응 4개"]},"files":[{"dup":1,"text":"${T('limit')} 1단계에 공개되는 비밀 설정"},{"dup":3,"text":"3단계 비밀 설정, 메인 플롯과 연결"}],"weapon":{"name":"${T('weapon')} 이름","desc":"한 줄","prompt":"NovelAI 영어 태그, no humans, object focus로 시작해 simple background, white background로 끝"},"naiPrompt":"..."}`;}
function aiErrText(e){ const base=AIERR[e&&e.code]||'AI 호출에 실패했어요.'; const m=String((e&&e.message)||'').trim(); if(e&&e.code==='origin_block') return base+' '+m; return m?base+' (서버: '+m.slice(0,160)+')':base; }
const AIERR={origin_block:'이 서비스가 브라우저에서 온 요청(Origin 헤더)을 막았어요(403).',el_nokey:'설정의 소리에서 ElevenLabs 키를 넣어 주세요.',fish_nokey:'설정의 소리에서 Fish Audio 키를 넣어 주세요.',no_ai:'설정의 글 AI에서 AI를 먼저 등록해 주세요.',model_not_found:'모델 이름이나 리전을 확인해 주세요.',sa_bad:'서비스 계정 JSON을 확인해 주세요. 파일 내용 전체를 붙여넣어야 해요.',bad_key:'키가 올바르지 않거나 권한이 없어요. 설정의 글 AI에서 확인해 주세요.',network:'인터넷 연결을 확인해 주세요.',low_credit:'API 크레딧이 부족해요. Claude Console에서 충전해 주세요.',not_granted:'AI 사용 권한이 꺼져 있어요. 앱의 권한 메뉴에서 켤 수 있어요.',rate_limited:'요청이 많아요. 잠시 후 다시 시도해 주세요.',refused:'AI가 이 요청은 쓰지 않았어요. 수위나 내용을 바꿔 다시 시도해 주세요.',invalid_json:'AI 응답을 읽지 못했어요. 다시 시도해 주세요.',cancelled:'취소했어요.'};
async function aiJSON(prompt,btn,tier,images){
  if(!SAMPLE){toast('설정의 글 AI에서 AI를 먼저 등록해 주세요');return null;}
  const label=btn?btn.textContent:'';let loadingTimer;if(btn){btn.disabled=true;btn.textContent='AI가 쓰는 중…';if(String(prompt).includes('skills')){let dots=0;loadingTimer=setInterval(()=>{if(btn.isConnected)btn.textContent='캐릭터와 스킬 생성중'+'.'.repeat(dots++%3+1);},400);}}
  try{ const skillPrompt=String(prompt).includes('\"skills\"')&&!String(prompt).includes('스킬 JSON은 skills:')?prompt+'\n스킬 작성 규칙: '+GGMCombat.prompt():prompt; const r=await SAMPLE.json(skillPrompt,{modelTier:tier||'default',cache:false,images});
    // AI가 {"chars":[…]} 대신 배열 […]만 돌려주는 경우(Gemini 등): 요청한 형식의 첫 키로 감싸요
    if(Array.isArray(r)){ const m=String(prompt).match(/JSON만 출력[^{\[]*\{\s*"([A-Za-z_]+)"\s*:\s*\[/); if(m) return {[m[1]]:r}; }
    return r; }
  catch(e){ toast(aiErrText(e)); return null; }
  finally{clearInterval(loadingTimer); if(btn&&btn.isConnected){btn.disabled=false;btn.textContent=label;} }
}
const nl=s=>unComma(Array.isArray(s)?s.map(x=>typeof x==='string'?x:x&&typeof x==='object'?(x.name||x.speaker?`${x.name||x.speaker}: ${x.text||x.line||''}`:String(x.text||x.line||'')):String(x)).join('\n'):String(s||'').replace(/\\n/g,'\n'));
// AI가 대본 줄을 쉼표로 이어 붙여 보낸 경우("[음악: 일상],A: 안녕!,B: 뭐 해") 줄로 되돌려요
function unComma(t){ t=String(t||''); const re=/,\s*(?=\[[^\]\n]{1,30}\]|[^\s,:\[\]\n"'][^,:\n\[\]]{0,15}(?:\[[^\]\n]{1,12}\])?:\s)/g;
  return t.split('\n').map(l=>{ const m=l.match(re); return m&&m.length>=2&&/^\s*(\[|[^,:\n]{1,16}(\[[^\]]*\])?:)/.test(l)?l.replace(re,'\n'):l; }).join('\n'); }
const strs=a=>(Array.isArray(a)?a:[]).map(String).filter(Boolean);
function cleanChar(o){ const c=cleanChar0(o);posAssign(c,o&&o.pos);v2ApplyRoleSpeed(c);c.generation=v2CurrentGeneration(); let provided=null;try{if(o?.skills)provided=v2PrepareGenerated(o.skills,c);}catch(e){}c.skills=provided||GGMCombat.generationDefaults(c); if(o?.skills&&!provided)c.skillGenerationWarning='AI 스킬이 규칙에 맞지 않아 기본 스킬로 대체했어요. 스킬 편집기에서 다시 생성할 수 있어요.'; setTimeout(async()=>{try{if(!provided){if(SAMPLE){c.skillGenerationWarning='스킬을 구성하고 내부 검사하는 중…';const kit=await v2GenerateSkills(c,'',msg=>{c.skillGenerationWarning=msg;});c.skills=kit;delete c.skillGenerationWarning;}}await v2QueueCharacter(c);}catch(e){c.skillGenerationWarning=String(e.message||e);}if(G.chars.includes(c)){mark('c:'+c.id);if(document.querySelector('.cs-sheet')?.dataset.cid===c.id)openChar(c.id);}},0); try{ const en=(G.lib||[]).find(l=>l.kind==='enemy'&&l.name===c.name); if(en&&/^\s*(1girl|1boy|1other)/i.test(en.prompt||'')){ c.naiPrompt=en.prompt; c.fromEnemy=en.id; } }catch(e){} naiBlocksRemember(c);return c; }
function cleanChar0(o){
  o=o||{}; const sk=o.skill||{}, tc=o.touch||{}, w=o.weapon||{}, id=uid(), aff={},tank=o.role==='def'?GGMCombat.generateBaseStats(o):null;
  Object.entries(o.affLines||{}).forEach(([k,v])=>{const n=parseInt(k,10);if(n>=1&&n<=10)aff[n]=strs(v);});
  return {id,genVer:auditGenVer(),ord:G.chars.length,name:String(o.name||'').slice(0,20),age:24,faction:String(o.faction||''),limited:!!o.limited,
    useStanding:o.useStanding===true,rarity:[1,2,3].includes(+o.rarity)?+o.rarity:1,role:ROLE[o.role]?o.role:'atk',elem:ELEMS.includes(o.elem)?o.elem:ELEMS[0],
    baseStatsVersion:1,hp:tank?tank.hp:num(o.hp,600,2000,1000),atk:num(o.atk,60,200,110),def:tank?tank.def:num(o.def,20,120,50),spd:num(o.spd,70,130,100),
    skill:{name:String(sk.name||'스킬').slice(0,20),kind:KIND[sk.kind]?sk.kind:'dmg',power:num(sk.power,0.5,3.2,1.6),cd:num(Math.round(sk.cd),2,5,3),desc:String(sk.desc||'')},
    profile:String(o.profile||''),intro:String(o.intro||''),lines:strs(o.lines).slice(0,12),affLines:aff,lvLines:strs(o.lvLines).slice(0,4),dupLines:strs(o.dupLines).slice(0,3),
    touch:{head:strs(tc.head).slice(0,8),body:strs(tc.body).slice(0,8),pet:strs(tc.pet).slice(0,8)},
    files:(Array.isArray(o.files)?o.files:[]).map(f=>({dup:num(parseInt(f.dup,10),1,5,1),text:String(f.text||'')})).filter(f=>f.text).slice(0,5),
    weapon:{id:'w_'+id,name:String(w.name||''),desc:String(w.desc||''),prompt:String(w.prompt||''),img:null},
    naiPrompt:allyTags(String(o.naiPrompt||'')),img:null,episodes:[],faces:[],skins:[],illust:{id:'il_'+id,kind:'illust',name:String(o.name||'')+' 일러스트',prompt:'',img:null},upper:{id:'up_'+id,kind:'upper',name:String(o.name||'')+' 상반신',prompt:'',img:null},pose:{id:'po_'+id,kind:'pose',name:String(o.name||'')+' 로비 포즈',prompt:'',img:null},lbbg:{id:'lg_'+id,kind:'lbbg',name:String(o.name||'')+' 로비 배경',prompt:'',img:null},lbcg:{id:'lb_'+id,kind:'lbcg',name:String(o.name||'')+' 돌파 CG',prompt:'',img:null}};
}
