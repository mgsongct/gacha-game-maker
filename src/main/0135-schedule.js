/* ===== 일정 (장소 방문) ===== */
/* 전투 말고 캐릭터를 쓰는 곳: 하루 3번, 장소에 나와 있는 캐릭터를 만나 짧은 장면을 보고 호감도·보상을 받아요.
   좋아하는 것(개성 시트 likes·hobby)이 장소 태그와 맞으면 "좋아하는 장소" → 호감도 1.5배.
   - 장소 G.meta.spots=[{id,name,desc,bg,tags}] : 자료실 배경에서 자동으로 만들거나(spotsAuto) AI로(spotsAI)
   - 장면 c.spotTalk={[spot id]:대본} : AI로(spotTalkAI) 만들고, 없으면 개성 시트로 짧은 기본 장면(spotTemplate)
   - 생성 연계: 점검 규칙 g_spots(장소 없음 → 자동), c_spot(장면 없음 → AI) · 문서 docs/research/combat-content.md */
const SCHED_N=3;
function SCHED(){ const p=P(); if(!p.sched||p.sched.day!==today()) p.sched={day:today(),left:SCHED_N,done:[]}; return p.sched; }
function spots(){ return Array.isArray(G.meta.spots)?G.meta.spots:[]; }
function spotsAuto(){ const L=[]; G.lib.filter(l=>l.kind==='bg'&&l.name).slice(0,7).forEach(l=>L.push({id:uid(),name:l.name,desc:'',bg:l.name,tags:[]}));
  if(!L.length) ['광장','카페','훈련장','도서관'].forEach(n=>L.push({id:uid(),name:n,desc:'',bg:'',tags:[n]})); G.meta.spots=L; mark('meta'); return L.length; }
function spotFav(c,s){ const p=c.persona||{}, likes=[...(p.likes||[]),p.hobby||''].join(' '); return !!likes&&[s.name,...(s.tags||[])].some(t=>t&&(likes.includes(t)||t.split(/\s+/).some(w=>w.length>1&&likes.includes(w)))); }
function spotWho(s){ const owned=G.chars.filter(c=>own(c.id)&&!c.alt&&!c.monster), h=hashN(today()+s.id); if(!owned.length) return [];
  const fav=owned.filter(c=>spotFav(c,s)), rest=owned.filter(c=>!fav.includes(c)), out=[]; if(fav.length) out.push(fav[h%fav.length]);
  const pool=[...rest,...fav.filter(c=>!out.includes(c))]; for(let i=0;out.length<2&&pool.length;i++) out.push(pool.splice((h>>(i+2))%pool.length,1)[0]); return out; }
function spotTemplate(c,s){ const p=c.persona||{}, L=(c.lines||[]).filter(Boolean), r=i=>L.length?L[(hashN(s.id+c.id)+i)%L.length]:'…', n=c.name;
  return [`[배경: ${s.bg||s.name}]`,`${s.name}에서 ${n}을(를) 만났다.`,`${n}: ${p.catch||r(0)}`,'선택: 같이 둘러볼래? | 여기서 뭐 하고 있었어?',
    `1) ${n}: ${(p.likes||[])[0]?`좋아. ${p.likes[0]} 얘기라도 하면서 걸을까.`:r(1)}`,`2) ${n}: ${p.hobby?`${p.hobby}… 그런 거. 비밀이야.`:r(2)}`,`${n}: ${r(3)}`].join('\n'); }
async function spotsAI(btn){ const r=await aiJSON(`${RULES}\n${ctx()}\n\n이 세계관에서 ${T('crew')}와 플레이어가 함께 시간을 보낼 장소 5~7곳을 정하라(전투 장소가 아닌 일상·휴식·취미 장소 위주, 세계관에 맞게). 기존 배경 이름: ${G.lib.filter(l=>l.kind==='bg').map(l=>l.name).join(', ')||'없음'} (맞는 게 있으면 bg에 그 이름, 없으면 빈칸). tags는 그 장소와 어울리는 취미·좋아하는 것 키워드 2~4개(한국어).\nJSON만 출력: {"spots":[{"name":"","desc":"한 문장","bg":"","tags":[""]}]}`,btn,'complex');
  const L=(r&&Array.isArray(r.spots)?r.spots:[]).slice(0,8).map(x=>({id:uid(),name:String(x.name||'').trim().slice(0,20),desc:String(x.desc||'').slice(0,120),bg:String(x.bg||'').trim(),tags:(Array.isArray(x.tags)?x.tags:[]).map(String).slice(0,4)})).filter(x=>x.name);
  if(!L.length) return false; const old=spots(); L.forEach(s=>{ const o=old.find(x=>x.name===s.name); if(o) s.id=o.id; }); G.meta.spots=L; mark('meta'); return true; }
async function spotTalkAI(c,btn){ const S=spots(); if(!S.length) return false;
  const r=await aiJSON(`${RULES}\n${ctx(false,c.name)}\n${SCRIPT_FMT}\n\n${T('crew')} 「${c.name}」이(가) 아래 장소마다 플레이어와 우연히 만나 보내는 짧은 일상 장면을 써라. 장소마다 8~14줄, "[배경: 배경 이름]"으로 시작, 선택지 1개("선택: A | B"와 갈래 줄 1)·2)), 개성 시트의 말투·좋아하는 것·반전 매력이 드러나게. 전투·큰 사건 없이 가볍게, 장소마다 다른 면을 보여 준다.\n장소: ${S.map(s=>`${s.name}(${s.desc||''}${s.bg?' · 배경 '+s.bg:''})`).join(' / ')}\nJSON만 출력: {"scenes":[{"spot":"장소 이름","script":""}]}`,btn,'complex');
  let n=0; (r&&Array.isArray(r.scenes)?r.scenes:[]).forEach(x=>{ const s=S.find(y=>y.name===String(x.spot||'').trim()), t=nl(x.script); if(s&&t){ c.spotTalk=c.spotTalk||{}; c.spotTalk[s.id]=t; n++; } }); if(n) mark('c:'+c.id); return n>0; }
function schedVisit(sid,cid){ const sc=SCHED(), s=spots().find(x=>x.id===sid), c=charById(cid); if(!s||!c||!own(c.id)) return; if(sc.left<=0){ toast('오늘 일정을 다 썼어요. 내일 다시 와요'); return; } if(sc.done.includes(sid)){ toast('오늘 이미 다녀온 장소예요'); return; }
  const fav=spotFav(c,s); playStory(`${s.name} · ${c.name}`,(c.spotTalk&&c.spotTalk[s.id])||spotTemplate(c,s),()=>{ const k=SCHED(); k.left--; k.done.push(sid); addAff(c,fav?30:20); const r=rateR({gold:800}); giveReward(r); mark('prog'); toast(`${c.name} 호감도 +${fav?30:20}${fav?' (좋아하는 장소)':''} · ${rewardText(r)}`); render(); }); }
function schedHTML(){ const sc=SCHED(), S=spots();
  return `${pageHead('일정','SCHEDULE','lobby')}<p class="muted">하루 ${SCHED_N}번, 장소에 나와 있는 ${T('crew')}을(를) 만나요. 좋아하는 장소에서 만나면 호감도를 더 많이 얻어요. 오늘 남은 일정 <b>${sc.left}/${SCHED_N}</b></p>
  ${S.length?`<div class="sc-spots">${S.map(s=>{ const done=sc.done.includes(s.id), who=spotWho(s); return `<div class="sc-spot" style="${bgStyle(s.bg||s.name)}"><b>${esc(s.name)}</b>${s.desc?`<div class="muted" style="font-size:.75rem">${esc(s.desc)}</div>`:''}
    <div class="sc-who">${done?'<span class="badge">다녀옴</span>':who.length?who.map(c=>`<button class="btn sm" data-act="scvisit" data-s="${s.id}" data-c="${c.id}" ${sc.left?'':'disabled'}>${esc(c.name)}${spotFav(c,s)?' ♥':''}</button>`).join(''):'<span class="muted">아무도 없어요</span>'}</div></div>`; }).join('')}</div>`:`<p>아직 장소가 없어요.</p><button class="btn" data-act="scauto">자료실 배경으로 장소 만들기</button>`}
  ${playMode()?'':`<div class="row" style="margin-top:10px;gap:6px"><button class="btn sm ghost" data-act="scai">AI로 장소 다시 정하기</button><button class="btn sm ghost" data-act="sctalkall">AI로 장면 만들기(장면 없는 ${T('crew')})</button></div>`}`; }
document.addEventListener('click',async e=>{ const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act;
  if(a==='scvisit') schedVisit(el.dataset.s,el.dataset.c);
  else if(a==='scauto'){ spotsAuto(); render(); }
  else if(a==='scai'){ if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; } if(await spotsAI(el)){ toast('장소를 정했어요'); render(); } }
  else if(a==='sctalkall'){ if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; } const L=G.chars.filter(c=>own(c.id)&&!c.alt&&spots().some(s=>!(c.spotTalk||{})[s.id])); let n=0; for(const c of L){ syBar(`일정 장면 ${n+1}/${L.length}`); if(await spotTalkAI(c)) n++; } syBar(''); toast(`${n}명의 일정 장면을 만들었어요`); render(); } });
