/* ===== 0300-world 화면(0180-ui-scroll.js에서 옮김) ===== */
/* src/main/0170-shell/0180-ui-scroll.js에서 옮김 */
function eventsHTML(){
  const evs=G.events.filter(gateOpen), locked=G.events.length-evs.length;
  return `${pageHead(T('event'),'EVENT','lobby')}
  ${evs.length?evs.map(ev=>`<button class="evcard ${ev.active===false?'off':''}" data-act="evopen" data-id="${ev.id}"><div class="bgl" style="${bgStyle(ev.bg||'회색구 골목')}"></div><div class="ev-t"><i>${ev.active===false?'CLOSED':'NOW OPEN'}${loreOf(ev)?' · '+esc(loreLabel(loreOf(ev))):''}</i><b>${esc(ev.title)}</b><span>${esc(ev.desc||'')}</span><em>${esc(ev.token)} ${nf(P().tokens[ev.id]||0)}</em></div></button>`).join(''):'<div class="panel"><p class="muted">아직 이벤트가 없어요.</p></div>'}
  ${locked?`<p class="muted" style="text-align:center;margin:8px 0">🔒 아직 열리지 않은 ${esc(T('event'))} ${locked}개 · 메인 스토리를 진행하면 차례로 열려요</p>`:''}
  <div class="panel pm-hide"><h3>새 이벤트</h3><p class="muted" style="margin:0 0 10px">AI가 이벤트 스토리, 이벤트 한정 배너, 교환소, 필요하면 한정 ${T('crew')}까지 한 번에 만들어요.</p><button class="btn block" data-act="aievent-open">AI로 이벤트 만들기</button></div>`;
}
/* src/main/0170-shell/0180-ui-scroll.js에서 옮김 */
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
