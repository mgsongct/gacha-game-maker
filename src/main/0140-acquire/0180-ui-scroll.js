/* ===== 0140-acquire 화면(0180-ui-scroll.js에서 옮김) ===== */
/* src/main/0170-shell/0180-ui-scroll.js에서 옮김 */
function contractHTML0(){
  const s=P().settings, bs=G.banners.filter(bnOpen), bn=curBanner();
  if(!bn) return pageHead(T('gacha'),'RECRUIT')+`<div class="panel"><p>열린 배너가 없어요.</p><button class="btn" data-act="bnew">배너 만들기</button></div>`;
  const pity=pityGet(bn), left=s.pity-pity, pool=bannerPool(bn);
  const ups=(bn.pickup||[]).map(charById).filter(Boolean), show=(ups.length?ups:pool.filter(c=>c.rarity===3)).slice(0,4);
  const hero=show[0], hill=hero&&P().lobbyMode!=='stand'&&charIllust(hero);
  const rOf=r=>r===3?s.ssr:r===2?s.sr:Math.max(0,100-s.ssr-s.sr);
  const BIG={std:'STAN<br>DARD',pickup:'PICK<span>✦</span>UP',pool:'SQUAD<br>UP',event:'EVENT<br>LIMITED'};
  const KR={std:'상시 모집',pickup:'신규 '+T('crew')+' 등장!',pool:'소속 모집',event:'기간 한정!'};
  const rows=[3,2,1].map(r=>{const n=pool.filter(c=>c.rarity===r).length;return `<tr><td><span class="badge r${r}c">${RL[r]}</span> ${n}명</td><td style="text-align:right">${rOf(r)}%</td></tr>`;}).join('');
  return `<div class="bsel" style="margin-top:6px">${bs.map(x=>`<button class="${x.id===bn.id?'on':''}" data-act="bsel" data-id="${x.id}">${esc(x.name)}${x.until&&x.until>Date.now()?` <small class="b-dd">D-${Math.max(0,Math.ceil((x.until-Date.now())/864e5))}</small>`:''}</button>`).join('')}<button data-act="newpu" title="신규 픽업 만들기">✦ 신규</button><button data-act="puexist" title="기존 ${esc(T('crew'))} 픽업">★ 픽업</button><button data-act="bnew" title="배너 직접 만들기">＋</button></div>
  ${(bn.storyFail||(bn.type==='pickup'&&(bn.newAt||bn.pin)))&&!bn.eventId&&!PUBUSY.has(bn.id)&&(bn.pickup||[])[0]&&SAMPLE?`<div class="panel" style="margin:6px 0;display:flex;gap:8px;align-items:center;justify-content:space-between"><span class="muted" style="font-size:.85rem">${bn.storyFail?'이 배너의 픽업 스토리를 만들다 멈췄어요.':'이 배너에는 아직 픽업 스토리가 없어요.'}</span><button class="btn sm" data-act="pustoryretry" data-id="${esc(bn.pickup[0])}" data-b="${esc(bn.id)}">${bn.storyFail?'이어서 만들기':'픽업 스토리 만들기'}</button></div>`:''}
  <section class="pk-hero ${esc(bn.type||'')} ${window.__BSLIDE||''}" data-swipe="banner">${bs.length>1?`<button class="pk-nav l" data-act="bswipe" data-d="-1" aria-label="이전 배너">‹</button><button class="pk-nav r" data-act="bswipe" data-d="1" aria-label="다음 배너">›</button><div class="pk-dots">${bs.map(x=>`<i class="${x.id===bn.id?'on':''}"></i>`).join('')}</div>`:''}
    <div class="pk-bg" style="${bn.bg?bgStyle(bn.bg):bgStyle(P().gachaBg||'낙성 분화구')}"></div>
    ${hero&&(hill||imgSrc(hero))?`<div class="pk-ghost">${hill?`<img src="${esc(hill)}" alt="">`:art(hero)}</div>`:''}
    <div class="pk-diag"></div>
    <div class="pk-art ${hill?'ill':''}">${hill?`<img src="${esc(hill)}" alt="${esc(hero.name)}" draggable="false">`:hero?art(hero):''}</div>
    ${show.length>1?`<div class="pk-subs">${show.slice(1).map(c=>`<button class="s" data-act="char" data-id="${c.id}" aria-label="${esc(c.name)}">${art(c)}</button>`).join('')}</div>`:''}
    <div class="pk-title">
      <div class="pk-logo">${esc(G.meta.title)}<small>${esc(G.meta.sub)}</small></div>
      <h1 class="pk-big">${BIG[bn.type]||'PICK<span>✦</span>UP'}</h1>
      <div class="pk-rec">RECRUITMENT</div>
      <div class="pk-kr">${esc(bn.name||KR[bn.type]||'')}</div>
      ${bn.desc?`<p>${esc(bn.desc)}</p>`:''}
    </div>
    ${hero?`<button class="pk-name" data-act="char" data-id="${hero.id}"><span class="cs-rar r${hero.rarity}">${RL[hero.rarity]}</span><b>${esc(hero.name)}</b><i>${esc((hero.faction||ROLE_EN[hero.role]||'').toUpperCase())}</i></button>`:''}
  </section>
  <div class="panel pk-pity"><div style="display:flex;justify-content:space-between"><span>SSR 확정까지</span><b>${left}회</b></div><div class="bar" style="margin-top:6px"><i style="width:${pity/s.pity*100}%"></i></div>
    ${pity>=Math.floor(s.pity*0.75)?`<p class="soft">🔥 확률 상승 중 · 지금 SSR ${softRate(s,pity+1).toFixed(1)}%</p>`:`<p class="muted" style="margin:6px 0 0;font-size:.75rem">${Math.floor(s.pity*0.75)}회부터 SSR 확률이 점점 올라가요</p>`}
    ${ups.length&&guarGet(bn)?`<p class="soft gold">★ 다음 SSR은 확률 업 ${esc(T('crew'))} 확정</p>`:''}${pityKey(bn)==='pickup'?`<p class="muted" style="margin:4px 0 0;font-size:.72rem">천장·확정은 다음 픽업 배너로 이어져요</p>`:''}
    <div class="sparkrow"><span>모집 포인트</span><div class="bar"><i style="width:${Math.min(100,((P().spark||{})[bn.id]||0)/SPARK*100)}%"></i></div><b>${(P().spark||{})[bn.id]||0}/${SPARK}</b><button class="btn sm ${((P().spark||{})[bn.id]||0)>=SPARK?'':'ghost'}" data-act="sparkopen" data-id="${bn.id}">교환</button></div>${P().firstTen?'<p class="muted" style="margin:8px 0 0">첫 10회는 SSR 1명 확정</p>':''}${ups.length?`<p class="muted" style="margin:8px 0 0">확률 업: ${ups.map(c=>esc(c.name)).join(', ')} · 같은 등급이 나오면 ${bn.rate}% 확률</p>`:''}</div>
  <div class="pullrow"><button class="btn ghost" data-act="pull" data-n="1">1회<small>◆ ${COST}</small></button><button class="btn" data-act="pull" data-n="10">10회<small>◆ ${nf(COST*10)}${pool.some(c=>c.rarity>=2)?' · SR 이상 1명 보장':''}</small></button></div>
  <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="go" data-to="cash">◆ ${esc(T('currency'))} 충전</button></div>

  <div class="panel"><h3>확률 정보</h3><table style="width:100%;font-size:.9rem">${rows}</table>
    <p class="muted" style="margin:8px 0 0;font-size:.78rem">· ${Math.floor(s.pity*0.75)}회부터 SSR 확률이 조금씩 올라가고 ${s.pity}회째에 확정이에요.${ups.length?`<br>· SSR이 확률 업 ${esc(T('crew'))}이(가) 아니었으면 다음 SSR은 확률 업 확정이에요.`:''}<br>· 1회마다 모집 포인트 1, ${SPARK}포인트로 원하는 ${esc(T('crew'))} 교환.</p>
    <div class="row" style="margin-top:10px"><button class="btn sm ghost" data-act="bedit" data-id="${bn.id}">배너 편집</button><button class="btn sm ghost" data-act="ghist">${esc(T('gacha'))} 기록</button></div></div>`;
}
