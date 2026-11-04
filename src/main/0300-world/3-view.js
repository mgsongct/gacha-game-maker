/* ===== 0300-world — View(HTML·DOM을 만듦) ===== */
/* src/main/0300-world/0180-ui-scroll.js에서 옮김 */
function eventsHTML(){
  const evs=G.events.filter(gateOpen), locked=G.events.length-evs.length;
  return `${pageHead(T('event'),'EVENT','lobby')}
  ${evs.length?evs.map(ev=>`<button class="evcard ${ev.active===false?'off':''}" data-act="evopen" data-id="${ev.id}"><div class="bgl" style="${bgStyle(ev.bg||'회색구 골목')}"></div><div class="ev-t"><i>${ev.active===false?'CLOSED':'NOW OPEN'}${loreOf(ev)?' · '+esc(loreLabel(loreOf(ev))):''}</i><b>${esc(ev.title)}</b><span>${esc(ev.desc||'')}</span><em>${esc(ev.token)} ${nf(P().tokens[ev.id]||0)}</em></div></button>`).join(''):'<div class="panel"><p class="muted">아직 이벤트가 없어요.</p></div>'}
  ${locked?`<p class="muted" style="text-align:center;margin:8px 0">🔒 아직 열리지 않은 ${esc(T('event'))} ${locked}개 · 메인 스토리를 진행하면 차례로 열려요</p>`:''}
  <div class="panel pm-hide"><h3>새 이벤트</h3><p class="muted" style="margin:0 0 10px">AI가 이벤트 스토리, 이벤트 한정 배너, 교환소, 필요하면 한정 ${T('crew')}까지 한 번에 만들어요.</p><button class="btn block" data-act="aievent-open">AI로 이벤트 만들기</button></div>`;
}
function eventDetailHTML(){
  const ev=G.events.find(e=>e.id===P().curEvent); if(!ev){tab='event';return eventsHTML();}
  const ch=G.chapters.find(c=>c.id===ev.chapterId), tok=P().tokens[ev.id]||0, buy=P().shopBuy[ev.id]||{}, bn=G.banners.find(x=>x.id===ev.bannerId);
  let prev=true, st='';
  if(ch) ch.stages.forEach((s,si)=>{const cl=!!P().cleared[s.id],open=prev;st+=`<button class="stage ${cl?'clear':''} ${open?'':'lock'}" data-act="${open?'stage':'locked'}" data-ch="${ch.id}" data-st="${s.id}"><span class="code">EV${si+1}</span><span class="t"><b>${s.story?'📖 ':''}${esc(s.title)}</b><span class="st">${s.story?'이야기 · ':''}${esc(ev.token)} +${s.story?s.reward*2:s.reward}${cl?(s.story?' · 다시 보기':' · 반복 가능'):''}</span></span></button>`;prev=cl;});
  const item=it=>{const left=it.limit-(buy[it.id]||0), c=it.type==='char'?charById(it.ref):null;
    const name=c?`${c.name} (${own(c.id)?T('limit')+' +1':'획득'})`:rewardText({[it.type]:it.amt});
    return `<div class="ep"><span class="t"><b>${esc(name)}</b><span class="muted">${esc(ev.token)} ${it.price} · 남은 횟수 ${left}</span></span><button class="btn sm" data-act="evbuy" data-id="${it.id}" ${left<=0||tok<it.price?'disabled':''}>교환</button></div>`;};
  return `${pageHead(ev.title,'EVENT','event')}
  <section class="banner" style="min-height:180px"><div class="bgl" style="${bgStyle(ev.bg||'회색구 골목')}"></div><div class="bn-t"><i>${ev.active===false?'CLOSED':'EVENT'}${loreOf(ev)?' · '+esc(loreLabel(loreOf(ev))):''}</i><h1>${esc(ev.title)}</h1><p>${esc(ev.desc||'')}</p><p class="ups">${esc(ev.token)} <b>${nf(tok)}</b></p></div></section>
  <h3 class="sec">이벤트 스토리</h3>${st||'<p class="muted">스테이지가 없어요.</p>'}
  ${bn?`<button class="btn block" style="margin:10px 0" data-act="bsel" data-id="${bn.id}" data-go="1">이벤트 ${T('gacha')}: ${esc(bn.name)}</button>`:''}
  ${(()=>{ const host=evHost(ev); return `<button class="evs-door" data-act="go" data-to="evshop"><div class="evs-bg" style="${bgStyle(ev.bg||'회색구 골목')}"></div><div class="evs-av">${host?art(host):''}</div><div class="evs-t"><i>EXCHANGE</i><b>이벤트 교환소</b><span>${host?esc(host.name)+'이(가) 기다리고 있어요 · ':''}${esc(ev.token)} ${nf(tok)} · 상품 ${(ev.shop||[]).length}개</span></div><em>입장 ›</em></button>`; })()}
  <div class="row" style="margin-top:12px"><button class="btn sm ghost" data-act="evedit" data-id="${ev.id}">이벤트 편집</button>${ch?`<button class="btn sm ghost" data-act="chedit" data-ch="${ch.id}">스토리 편집</button>`:''}${ch&&SAMPLE?`<button class="btn sm ghost" data-act="evreroll" data-id="${ev.id}">🎲 스토리 다시 쓰기</button>`:''}</div>`;
}
/* src/main/0300-world/0300-codex.js에서 옮김 */
function cxCard(e){ const isNew=e.open&&!progRead('cxSeen')[e.key];
  const pic=e.open?(e.char?art(e.char,'cx-ch'):e.img?`<img src="${esc(e.img)}" alt="" class="${e.contain?'ct':''}" loading="lazy">`:`<span class="cx-glyph">${esc((e.title||'?').slice(0,1))}</span>`):'<span class="cx-glyph">?</span>';
  const snip=e.open?String(e.body||(e.notes[0]&&e.notes[0].text)||'아직 기록이 없어요').replace(/\n+/g,' ').slice(0,70):cxLockText(e.unlock);
  return `<button class="cx-card ${e.open?'':'lock'} c-${esc(e.cat)}" data-act="cxview" data-k="${esc(e.key)}"><span class="cx-pic">${pic}</span><span class="cx-tx"><i>${esc(CX_LABEL[e.cat]||'')}</i><b>${e.open?esc(e.title):'???'}</b><span>${esc(snip)}</span></span>${isNew?'<em>NEW</em>':''}</button>`; }
function codexHTML(){
  const all=cxEntries(), cat=CXCAT, list=all.filter(e=>cat==='all'||e.cat===cat), un=all.filter(e=>e.open).length;
  const cnt=k=>k==='all'?all.length:all.filter(e=>e.cat===k).length;
  return `${pageHead('도감','LORE BOOK','lobby')}
  <div class="cx-head"><div class="cx-meter"><b>${un}</b><span>/ ${all.length} 기록 해금</span></div><div class="cx-bar"><i style="width:${all.length?un/all.length*100:0}%"></i></div>
    <div class="cx-acts">${SAMPLE?`<button class="btn sm" data-act="cxdisc">✦ AI로 로어북 채우기</button>`:''}<button class="btn sm ghost" data-act="cxadd">＋ 직접 쓰기</button><button class="btn sm ghost" data-act="relopen" data-r="me">🕸 인물 관계도</button>${all.some(e=>e.open&&!progRead('cxSeen')[e.key])?'<button class="btn sm ghost" data-act="cxreadall">NEW 모두 지우기</button>':''}</div></div>
  <div class="cx-cats">${CX_CATS.filter(([k])=>cnt(k)).map(([k,l])=>`<button class="${k===cat?'on':''}" data-act="cxcat" data-v="${k}">${l}<em>${cnt(k)}</em></button>`).join('')}</div>
  ${!cxStore().length&&SAMPLE?`<div class="panel cx-hint"><b>세계를 더 깊게</b><p class="muted" style="margin:4px 0 0">AI가 세계관과 메인 플롯을 바탕으로 장소, 용어, 역사, 숨은 인물 같은 기록을 써요. 비밀이 담긴 기록은 해당 스테이지를 깨야 열려요.</p></div>`:''}
  <div class="cx-list">${list.map(cxCard).join('')||'<p class="muted">항목이 없어요</p>'}</div>`;
}
/* 도감 카드의 새 표시 지우기 · 기록 보기 창 내용(View) */
function cxCardSeenShow(key){ document.querySelectorAll('.cx-card[data-k]').forEach(el=>{ if(el.dataset.k===key){ const em=el.querySelector('em'); if(em) em.remove(); } }); }
function cxViewHTML(e,key){ const para=t=>String(t||'').split(/\n{2,}/).map(x=>`<p>${esc(x).replace(/\n/g,'<br>')}</p>`).join('');
  return `<div class="cx-view c-${esc(e.cat)}">
    ${e.img||e.char?`<div class="cx-hero">${e.char?art(e.char,'cx-ch'):`<img src="${esc(e.img)}" alt="" class="${e.contain?'ct':''}">`}</div>`:''}
    <div class="cx-vh"><i>${esc(CX_LABEL[e.cat]||'')}</i><h2>${esc(e.title)}</h2><span class="muted">${esc(e.sub||'')}</span></div>
    <div class="cx-body">${e.body?para(e.body):'<p class="muted">아직 기록이 없어요. 아래 \'더 알아보기\'를 누르면 AI가 지금까지 밝혀진 범위 안에서 써 줘요.</p>'}
      ${e.notes.map(n=>`<div class="cx-note"><small>${esc(n.at||'')}</small>${para(n.text)}</div>`).join('')}</div>
    ${SAMPLE?`<button class="btn block" data-act="cxdeep" data-k="${esc(key)}" style="margin-top:14px">✦ 더 알아보기</button>`:''}
    <div class="cx-sub">${e.char&&own(e.char.id)?`<button class="btn sm ghost" data-act="char" data-id="${esc(e.char.id)}">${esc(T('crew'))} 정보</button>`:''}${e.stored?`<button class="btn sm ghost" data-act="cxedit" data-id="${esc(e.stored.id)}">편집</button>`:''}<button class="btn sm ghost" data-act="cxnote" data-k="${esc(key)}">메모 추가</button><button class="btn sm ghost" data-act="close">닫기</button></div>
  </div>`; }
function openCxEdit(id){
  const x=id?cxStore().find(q=>q.id===id):{id:'',cat:'term',title:'',body:'',unlock:{type:'start'}}; if(!x) return;
  const st=mainStages();
  openModal(`${head(id?'기록 편집':'기록 쓰기')}
    <div class="g2"><div><label class="f" for="cx_cat">분류</label><select class="in" id="cx_cat">${opt(CX_CATS.filter(c=>c[0]!=='all'&&c[0]!=='enemy'),x.cat)}</select></div>
    <div><label class="f" for="cx_un">공개 시점</label><select class="in" id="cx_un">${opt([['start','처음부터'],...st.map(s=>[s.id,s.code+' 클리어 후'])],x.unlock&&x.unlock.type==='clear'?x.unlock.value:'start')}</select></div></div>
    <label class="f" for="cx_t">제목</label><input class="in" id="cx_t" value="${esc(x.title)}">
    <label class="f" for="cx_b">내용</label><textarea class="in" id="cx_b" style="min-height:180px">${esc(x.body)}</textarea>
    <div class="row" style="margin-top:14px"><button class="btn" data-act="cxsave" data-id="${esc(x.id)}">저장</button>${id?`<button class="btn ghost" data-act="cxdel" data-id="${esc(x.id)}">삭제</button>`:''}</div>`);
}
/* src/main/0300-world/0445-factions.js에서 옮김 */
function factionPanel(){ const r=factionReview(); return `<div class="panel pm-hide"><h3>세력·몬스터·등장 관리 <span class="badge">${r.score}점</span></h3><p class="muted" style="margin:0 0 6px">세력 ${factions().length}개 · 몬스터 ${monsterNames().length}종 · 점검 ${r.issues.length}건. 세력의 종류·목적·관계와 장마다 바뀌는 적대/우호, 몬스터의 정체, ${T('crew')}의 첫 등장·${T('gacha')} 잠금을 관리해요.</p><button class="btn sm" data-act="fwopen">세력·몬스터·등장 관리</button></div>`; }
function openWorldDesign(tab){ if(tab) FW_TAB=tab; const F=factions(), now=mainNow(), rv=factionReview(), t=(k,v,ph)=>`<input class="in" data-fw="${k}" value="${esc(v??'')}" placeholder="${esc(ph||'')}">`, ta=(k,v,ph)=>`<textarea class="in" rows="2" data-fw="${k}" placeholder="${esc(ph||'')}">${esc(v||'')}</textarea>`;
  const tabs=[['fac','세력'],['mon','적·몬스터 도감'],['cast','등장·영입']]; let body='';
  if(FW_TAB==='fac') body=F.map((f,i)=>`<details class="panel" style="padding:8px;margin:6px 0"><summary><b>${esc(f.name)}</b> <span class="muted">${FKIND[f.kind]} · 지금 ${FSTANCE[stanceAt(f,now)]}</span></summary>
    <div class="g2"><div><label class="f">종류</label><select class="in" data-fw="f.${i}.kind">${opt(Object.entries(FKIND),f.kind)}</select></div><div><label class="f">이름</label>${t(`f.${i}.name`,f.name)}</div></div>
    ${F_FIELDS.map(([k,l])=>`<label class="f">${l}</label>${k==='desc'||k==='secret'?ta(`f.${i}.${k}`,f[k]):t(`f.${i}.${k}`,f[k])}`).join('')}
    ${f.kind==='monster'?M_FIELDS.map(([k,l])=>`<label class="f">${l}</label>${t(`f.${i}.${k}`,f[k])}`).join(''):''}
    <label class="f">다른 세력과의 관계 (세력 | 관계, 줄마다)</label>${ta(`f.${i}.rel`,Object.entries(f.rel).map(([k,v])=>k+' | '+v).join('\n'))}
    <label class="f">플레이어와의 관계 변화 (장 | ally·neutral·hostile | 이유, 줄마다 · 비우면 종류대로)</label>${ta(`f.${i}.stance`,f.stance.map(s=>`${s.ch} | ${s.s} | ${s.why||''}`).join('\n'),'예: 1 | hostile | 처음엔 적\n4 | ally | 진실을 알고 손잡음')}
    <div class="muted" style="font-size:.78rem">소속: ${esc(G.chars.filter(c=>c.faction===f.name).map(c=>c.name).join(', ')||'없음')}${monsterNames().filter(l=>enemyFaction(l)===f.name).length?' · 몬스터: '+esc(monsterNames().filter(l=>enemyFaction(l)===f.name).map(l=>l.name).join(', ')):''}</div></details>`).join('')+`<button class="btn sm ghost" data-act="fwadd">+ 세력</button>`;
  else if(FW_TAB==='mon'){ const M=monsterNames(); body=`<p class="muted" style="font-size:.82rem">캐릭터가 아닌 적(몬스터·적 병력)이에요. 정체·습성·약점을 정하면 스토리·도감에 쓰이고, AI가 몬스터를 동료·NPC·메신저 상대로 만들지 않아요.</p>${M.map((l,i)=>`<div class="panel" style="padding:8px;margin:6px 0"><b>${esc(l.name)}</b> <select class="in" data-fw="m.${l.id}.faction" style="max-width:150px;display:inline-block"><option value="">무리 없음</option>${F.map(f=>`<option ${enemyFaction(l)===f.name?'selected':''}>${esc(f.name)}</option>`).join('')}</select>${t(`m.${l.id}.desc`,l.desc,'정체 (무엇인가)')}${t(`m.${l.id}.nature`,l.nature,'습성·행동')}${t(`m.${l.id}.weak`,l.weak,'약점')}</div>`).join('')||'<p class="muted">적이 없어요</p>'}`; }
  else { const L=G.chars.filter(c=>!c.alt&&!c.npc), stg=G.chapters.flatMap(ch=>(ch.stages||[]).map(s=>[s.id,`${ch.kind==='main'?stageCode(s.id):ch.title} ${s.title}`]));
    body=`<label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-fw="cast.pickupGate" ${castCfg().pickupGate?'checked':''}>픽업 배너도 첫 등장 스테이지를 깨기 전엔 잠금</label><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-fw="cast.hostileGate" ${castCfg().hostileGate?'checked':''}>소속 세력이 지금 적대면 ${T('gacha')}·건조에서 잠금</label>
    <p class="muted" style="font-size:.8rem">첫 등장을 정하면 그 스테이지를 깨기 전까지 ${T('gacha')}에 안 나오고, 스토리에서 처음 만나는 장면이 돼요. "처음부터"인 ${T('crew')}는 뽑아서 합류하면 AI가 이미 함께 작전 중인 동료로 다뤄요.</p>
    ${L.map(c=>{ const lk=castLock(c); return `<div class="ep"><span class="t"><b>${esc(c.name)}${c.monster?' (몬스터)':''}</b><span class="muted">${esc(c.faction||'무소속')} · ${own(c.id)?'보유':'미보유'} · ${metInStory(c)?'스토리에서 만남':'아직 안 만남'}${lk?' · 🔒 '+esc(lk):''}</span></span><select class="in" data-fw="c.${c.id}.debut" style="max-width:170px"><option value="">처음부터</option>${stg.map(([id,l])=>`<option value="${id}" ${c.debut===id?'selected':''}>${esc(l)}</option>`).join('')}</select>${!c.monster&&isMonsterLike(c)?`<button class="btn sm ghost" data-act="fwmon" data-id="${c.id}">몬스터로 전환</button>`:''}</div>`; }).join('')}`; }
  openModal(`${head('세력·몬스터·등장 관리',`<span class="muted">점수 ${rv.score}</span>`)}${rv.issues.length?`<div class="panel" style="border-color:var(--gold)"><b>점검</b><ul style="margin:4px 0;padding-left:18px;font-size:.8rem">${rv.issues.map(x=>`<li>${esc(x.msg)}</li>`).join('')}</ul></div>`:''}
  <div class="row" style="gap:4px;margin:6px 0">${tabs.map(([k,l])=>`<button class="btn sm ${FW_TAB===k?'':'ghost'}" data-act="fwtab" data-k="${k}">${l}</button>`).join('')}</div>${body}
  <label class="f" style="margin-top:8px">AI 추가 지시 (선택)</label><input class="in" id="fw_ins" placeholder="예: 헬릭스는 3장 이후 내분으로 일부가 우리 편이 된다">
  <div class="row" style="margin-top:10px;gap:6px;flex-wrap:wrap"><button class="btn" data-act="fwsave">저장</button><button class="btn ghost" data-act="fwai">AI로 깊이 채우기</button><button class="btn ghost" data-act="close">닫기</button></div>`); }
/* src/main/0300-world/0450-relations-memory.js에서 옮김 */
function relNodeHTML(ref,x,y,big){ const o=relObj(ref), s=o&&imgSrc(o.upper&&imgSrc(o.upper)?o.upper:o), nm=relName(ref,true);
  return `<button class="rl-node ${big?'big':''} ${ref===REL_ME?'me':''} ${o&&o.npc?'npc':''}" style="left:${x}%;top:${y}%" data-act="relgo" data-r="${esc(ref)}"><span class="rl-av">${s?`<img src="${esc(s)}" alt="">`:`<i>${esc(ref===REL_ME?'나':nm.slice(0,1))}</i>`}</span><b>${esc(ref===REL_ME?T('player'):nm)}</b></button>`; }
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
