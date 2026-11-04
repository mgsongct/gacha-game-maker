/* ===== 0090-character — View(HTML·DOM을 만듦) ===== */
/* src/main/0090-character/0065-inherit.js에서 옮김 */
function inheritHTML(c){ // 캐릭터 화면의 상속 정보
  const b=c&&c.alt&&G.chars.find(x=>x.id===c.alt); if(!b||!c.over) return ''; const o=c.over, keys=Object.keys(o).filter(k=>k!=='statMul'), sm=o.statMul||{};
  const items=[...keys.map(k=>[k,inheritLabel(k)]),...Object.entries(sm).map(([k,v])=>[k,`${inheritLabel(k)} ×${v}`])];
  return `<div class="panel" style="margin:6px 0;padding:8px 10px"><p class="muted" style="margin:0 0 4px;font-size:.82rem">원본 「${esc(b.name)}」을(를) 물려받아요. 원본을 고치면 아래에 없는 항목은 같이 바뀌어요.</p>${items.length?`<div class="row" style="flex-wrap:wrap;gap:4px">${items.map(([k,l])=>`<button class="chip" data-act="inhreset" data-id="${c.id}" data-k="${k}" title="원본 값으로 되돌리기">${esc(l)} ✕</button>`).join('')}<button class="btn sm ghost" data-act="inhreset" data-id="${c.id}" data-k="*">모두 원본 따르기</button></div>`:'<p class="muted" style="margin:0;font-size:.82rem">바꾼 항목 없음 (모두 원본과 같아요)</p>'}</div>`; }
/* src/main/0090-character/0090-growth.js에서 옮김 */
function updStam(){ const el=document.getElementById('stamBox'); if(!el) return; el.hidden=!stamOn(); if(!stamOn()) return; const s=progRead('stam'); const v=document.getElementById('stamV'); if(v) v.textContent=s.v+'/'+STAM_MAX; }
function openStam(need){ const s=progRead('stam'), left=s.v>=STAM_MAX?0:Math.ceil((STAM_MS-(Date.now()-s.at))/60000), full=s.v>=STAM_MAX?0:Math.ceil(((STAM_MAX-s.v-1)*STAM_MS+(STAM_MS-(Date.now()-s.at)))/60000);
  openModal(`${head('⚡ 행동력',`<span class="muted">${s.v} / ${STAM_MAX}</span>`)}${need?`<p style="margin:0 0 8px">행동력이 모자라요. 필요 <b>${need}</b> · 지금 <b>${s.v}</b></p>`:''}
    <p class="muted" style="margin:0 0 10px;font-size:.85rem">5분마다 1씩 차요.${s.v<STAM_MAX?` 다음 1 회복까지 ${left}분 · 가득 차기까지 약 ${full}분`:' 지금 가득 찼어요.'}<br>메인·이벤트 전투 10, 재료 던전 8을 써요.</p>
    <div class="row"><button class="btn" data-act="stamfill" ${P().gems>=STAM_FILL[0]?'':'disabled'}>${rIco('gems')} ${STAM_FILL[0]}로 ⚡${STAM_FILL[1]} 회복</button><button class="btn ghost" data-act="close">닫기</button></div>`); }
function linePop(c,text,face){
  if(!c||!text) return; document.querySelectorAll('.linepop').forEach(x=>x.remove());
  const d=document.createElement('div'); d.className='linepop'; d.innerHTML=`<div class="lp-art">${art(c,'',{face})}</div><div class="lp-t"><b>${esc(c.name)}</b><span>${esc(sub(text))}</span></div>`;
  document.body.appendChild(d); setTimeout(()=>d.remove(),4200); if(c.voiceId) speak(c,text);
}
function openUpConfirm(c,k){ const u=upPlan(c,k); if(!u) return;
  const ok=u.ok&&u.cost.every(x=>x[2]>=x[1]);
  openModal(`${head(esc(c.name)+' · '+esc(u.title))}
    <div class="upc"><div class="upc-ft"><span>${esc(u.from)}</span><b>→</b><span>${esc(u.to)}</span></div>
    ${u.cost.length?`<div class="upc-cost">${u.cost.map(([n,need,have])=>`<div class="${have<need?'lack':''}"><span>${esc(n)}</span><b>${nf(need)}</b><i>보유 ${nf(have)}${have<need?' · '+nf(need-have)+' 부족':''}</i></div>`).join('')}</div>`:''}
    ${u.note?`<p class="muted" style="margin:8px 0 0;font-size:.82rem">${esc(u.note)}</p>`:''}</div>
    <div class="row" style="margin-top:14px"><button class="btn" data-act="upgo" data-k="${k}" data-id="${c.id}" ${ok?'':'disabled'}>${ok?'확인':'재료가 부족해요'}</button><button class="btn ghost" data-act="char" data-id="${c.id}">취소</button></div>`); }
/* src/main/0090-character/0130-gift.js에서 옮김 */
function openGift(cid){
  const c=charById(cid), inv=progRead('gifts'), likes=giftLikes(c), seen=(P().giftSeen||{})[cid]||{};
  const items=GIFTS.filter(g=>inv[g[0]]>0);
  const full=affFull(own(c.id));
  openModal(`${head(`${esc(c.name)}에게 선물하기`,`<span class="muted">호감도 Lv.${affLv(own(c.id))}${full?' · <b style="color:var(--rose)">MAX</b>':''} · 좋아하는 선물은 효과가 2배예요</span>`)}
    ${full?`<p class="gf-full">♥ 호감도가 가득 찼어요. 선물을 더 줘도 오르지 않으니 다른 ${esc(T('crew'))}에게 주세요.</p>`:''}
    ${items.length?`<div class="gf-grid">${items.map(g=>`<button class="gf-it" data-act="giftgive" data-id="${esc(cid)}" data-v="${g[0]}" ${full?'disabled':''}><em>${g[2]}</em><b>${esc(g[1])}</b><span>×${inv[g[0]]} · +${g[3]}${seen[g[0]]===2?' <i class="gf-like">♥ 좋아해요</i>':seen[g[0]]===1?' <i class="gf-meh">무난</i>':''}</span></button>`).join('')}</div>`
      :`<p class="muted">가진 선물이 없어요. 상점의 '선물 꾸러미', 일일 보급, 파견, 도전 보상에서 얻을 수 있어요.</p><div class="row"><button class="btn sm" data-act="go" data-to="shop">상점 가기</button></div>`}`);
}
function hsDecorate(){ document.querySelectorAll('.bsel,.cx-cats').forEach(el=>{
    if(!el.parentElement.classList.contains('hs-wrap')){ const w=document.createElement('div'); w.className='hs-wrap'; el.parentNode.insertBefore(w,el); w.appendChild(el); w.insertAdjacentHTML('beforeend','<button class="hs-ar l" data-hs="-1" aria-label="왼쪽으로">‹</button><button class="hs-ar r" data-hs="1" aria-label="오른쪽으로">›</button>'); el.addEventListener('scroll',()=>hsUpd(w),{passive:true}); }
    const on=el.querySelector('.on'); if(on&&!el.__did){ el.__did=1; const l=on.offsetLeft-el.clientWidth/2+on.offsetWidth/2; el.scrollLeft=Math.max(0,l); } hsUpd(el.parentElement); }); }
function hsUpd(w){ const el=w.firstElementChild; if(!el) return; const max=el.scrollWidth-el.clientWidth-2; w.classList.toggle('can-l',el.scrollLeft>2); w.classList.toggle('can-r',el.scrollLeft<max); }
function fitLobby(){ try{ hsDecorate(); }catch(e){} const el=document.querySelector('.lobby'); if(!el) return; const tb=document.querySelector('.tabs'); const top=el.getBoundingClientRect().top+(document.scrollingElement?document.scrollingElement.scrollTop:0);
  const tabsH=tb?tb.getBoundingClientRect().height:0; const h=Math.max(document.body.classList.contains('wide')?200:360,Math.floor(innerHeight-top-tabsH)); el.style.height=h+'px'; el.classList.toggle('short',h<600); el.classList.toggle('narrow',el.clientWidth<370); }
/* src/main/0090-character/0180-ui-scroll.js에서 옮김 */
function lobbyHTML(){
  const p=P(), c=charById(p.sec), has=c&&own(c.id), nx=nextStage(), evs=G.events.filter(ev=>ev.active!==false&&gateOpen(ev));
  // 자동 로비는 레이어 유지: 포즈 → 상반신 → 스탠딩. 일러스트는 별도 표시 모드에서 사용합니다.
  const oo=has?own(c.id):null, lm=p.lobbyMode||'auto', poseSrc=has&&!(skinOf(c)&&imgSrc(skinOf(c)))&&c.pose&&imgSrc(c.pose), layer=lm==='layer'||(lm==='auto'&&!!has), ill=has&&lm!=='stand'&&!layer&&((oo.useCg&&oo.dup>=5&&lbcgSrc(c))||charIllust(c)), pose=layer&&poseSrc;
  const bn=curBanner(), bup=bn&&((bn.pickup||[]).map(charById).filter(Boolean)[0]||bannerPool(bn).filter(x=>x.rarity===3)[0]);
  const TYPE={std:'STANDARD',pickup:'PICK UP',pool:'FACTION',event:'EVENT LIMITED'};
  const ico=(act,to,ic,label,badge,hot)=>`<button class="lb-ico ${hot?'hot':''}" data-act="${act}" ${to?`data-to="${to}"`:''}><span class="ic">${ICO[ic]}</span><b>${esc(label)}</b>${badge?`<em>${badge}</em>`:''}</button>`;
  const newN=p.live.notices.filter(n=>n.at>p.live.seen).length;
  return `<div class="lobby ${ill?'ill':''} ${layer?'layer':''} lbsz-${esc(p.lbSize||'fit')}">${layer?`<div class="lb-far" style="${has&&c.lbbg&&imgSrc(c.lbbg)?`background-image:url('${esc(imgSrc(c.lbbg))}')`:bgStyle(p.lobbyBg||'새벽등대 사무소')}"></div>`:''}
    <div class="lb-stage" ${has?'data-act="poke" role="button" tabindex="0"':'data-act="lbshow"'} style="${ill?'background:#000':layer?'background:transparent':bgStyle(p.lobbyBg||'새벽등대 사무소')}">
      ${ill?`<img class="lobby-ill" src="${esc(ill)}" alt="${esc(c.name)}" draggable="false">`:pose?`<img class="art lobby-art lobby-pose" src="${esc(pose)}" alt="${esc(c.name)}" draggable="false">`:has?(layer?lobbyCharacterArt(c):art(c,'lobby-art')):''}<div class="lb-shade"></div>
    </div>
    <div class="lb-ui">
      ${bn?`<button class="lb-banner" data-act="go" data-to="contract" data-swipe="banner"><span class="bgl" style="${bn.bg?bgStyle(bn.bg):bgStyle(p.gachaBg||'낙성 분화구')}"></span><span class="bt"><i>${TYPE[bn.type]||'RECRUIT'}</i><b>${esc(bn.name)}</b><span>${bup?esc(bup.name)+' 확률 업':esc(T('gacha'))}</span></span><span class="bf">${bup?noSkin(()=>art(bup))():''}</span></button>`:''}
      <div class="lb-tr"><button class="lb-pass" data-act="go" data-to="pass"><i>SEASON PASS</i><b>Lv.${passLv()}</b>${passClaimable()?'<em></em>':''}</button>${seasonChip()}</div>
      <div class="lb-left">
        ${ico('phone','','talk',T('talk'),unread()||'')}
        ${evs.length?ico('go','event','event',T('event'),evs.length):''}
        ${ico('go','notice','notice','공지',newN||'')}
        ${ico('go','codex','book','도감',cxNewFast()||'')}
        ${p.daily!==today()?ico('daily','','gift','일일 보급','!',true):''}
      </div>
      <div class="lb-right">
        ${ico('mailopen','','mail','우편함',mailCount()||'',mailCount()>0)}
        ${ico('go','disp','disp',T('dispatch'),dispDone()||'')}
        ${ico('go','sched','talk','일정',G.chars.some(c=>own(c.id))&&progRead('sched').left?progRead('sched').left:'')}
        ${ico('go','farm','farm',T('farm'),'')}
        ${ico('go','challenge','raid','도전',progRead('rogue').run?'!':(raidTriesLeft()&&!progRead('raid').killed?raidTriesLeft():''))}
        ${ill||has?ico('lbhide','','eye','숨기기',''):''}
      </div>
      <div class="lb-foot">
      ${has?`<div class="bubble" id="bubble">${esc(sub(rand(affLinePool(c))||'…'))}</div>`:''}
      <div class="lb-id">${has?`<i>${esc(G.meta.sub)}</i><b>${esc(c.name)}</b><span>${esc(c.faction||ROLE[c.role])} · 호감도 Lv.${affLv(own(c.id))}</span>`:`<i>${esc(G.meta.sub)}</i><b>${esc(G.meta.title)}</b><span>첫 ${T('gacha')}로 ${T('crew')}을(를) 만나세요</span>`}</div>
      <div class="lb-bottom">
        <div class="lb-shops">
          <button class="lb-shop cash" data-act="go" data-to="cash">${ICO.gem}<span><i>CASH SHOP</i><b>캐시 상점</b></span></button>
          <button class="lb-shop" data-act="go" data-to="shop">${ICO.shop}<span><i>SUPPLY SHOP</i><b>상점</b></span></button>
        </div>
        <button class="lb-sortie" data-act="go" data-to="ops"><i>COMBAT</i><b>${esc(T('ops'))} 출격</b><span>${nx?esc(nx.code+' '+nx.s.title):'모든 '+esc(T('ops'))+' 완료'}</span></button>
      </div></div>
    </div>
  </div>`;
}
function passHTML(){
  const p=P(), d=progRead('dm'), lv=passLv(), xp=p.pass.xp;
  return `${pageHead(T('pass'),'SEASON PASS','lobby')}
  <div class="panel"><div style="display:flex;justify-content:space-between;align-items:baseline"><h3>Lv.${lv} / ${PASS_MAX}</h3><span class="muted">${nf(xp%PASS_PER)} / ${PASS_PER} XP</span></div><div class="bar"><i style="width:${lv>=PASS_MAX?100:(xp%PASS_PER)/PASS_PER*100}%"></i></div></div>
  <div class="row" style="margin:8px 0"><button class="btn sm" data-act="pgetall">모두 받기 <small>(임무·패스 보상)</small></button></div>
  <h3 class="sec">오늘의 임무</h3>
  ${MISSIONS.map(m=>{const c=Math.min(m.goal,d.cnt[m.k]||0),ok=c>=m.goal,got=d.got[m.k];return `<div class="ep"><span class="t"><b>${m.name}</b><span class="muted">${c}/${m.goal} · ${m.xp} XP</span></span><button class="btn sm ${got?'ghost':''}" data-act="mget" data-k="${m.k}" ${ok&&!got?'':'disabled'}>${got?'완료':'받기'}</button></div>`;}).join('')}
  <h3 class="sec">패스 보상</h3>
  <div class="passgrid">${Array.from({length:PASS_MAX},(_,i)=>i+1).map(l=>{const got=p.pass.got.includes(l),ok=l<=lv;return `<button class="pv ${got?'got':ok?'ok':''}" data-act="pget" data-lv="${l}" ${ok&&!got?'':'disabled'}><i>${l}</i><span>${rewardText(passReward(l))}</span></button>`;}).join('')}</div>
  <div class="row" style="margin-top:12px"><button class="btn sm ghost" data-act="passreset">새 시즌 시작</button></div>`;
}
/* src/main/0090-character/0200-skin-shop.js에서 옮김 */
function skinPkgHTML(){ const a=skinShopList(), so=P().skinOwn||{};
  return `<h3 class="sec">${esc(T('skin'))} 패키지</h3><div class="row" style="margin:0 0 6px"><span class="muted" style="flex:1;font-size:.8rem">${P().live.on.season?'시즌이 바뀔 때마다':esc(cycLabel('rotate'))+'마다'} ${esc(T('crew'))} 한 명의 새 ${esc(T('skin'))}이 자동으로 나와요 (설정 → 시즌 운영에서 끄기)</span><button class="btn sm ghost" data-act="skinnew">✦ 지금 하나 만들기</button></div>${a.length?'':'<p class="muted" style="font-size:.8rem">아직 판매 중인 '+esc(T('skin'))+'이 없어요.</p>'}${a.map(({c,k},i)=>{ const got=!!so[k.id], src=skinPreviewSrc(c,k);
    return `<div class="cs-card pkg skinpkg">${i===0&&!got?'<span class="rib" style="position:absolute;left:8px;top:6px;background:#ff3d7f;padding:1px 8px;font-size:.62rem;font-weight:700">NEW</span>':''}<span class="wthumb" style="width:64px;height:84px;overflow:hidden">${src?`<img src="${esc(src)}" alt="" style="width:100%;height:100%;object-fit:cover;object-position:50% 12%">`:''}</span><div class="t"><b>${esc(c.name)} 「${esc(k.name)}」</b><span class="muted" style="color:#e9d9b0">${esc(k.desc||T('skin'))}${imgSrc(k)?'':' · 그림은 '+T('skin')+' 편집에서 그릴 수 있어요'}</span></div><span style="display:flex;flex-direction:column;gap:4px"><button class="btn sm" data-act="skinbuy" data-id="${k.id}" ${got?'disabled':''}>${got?'보유':rIco('gems')+nf(k.price||SKIN_PRICE)}</button>${got?'':`<button class="btn sm ghost" data-act="skinpkgdel" data-id="${k.id}">지우기</button>`}</span></div>`; }).join('')}`; }
/* src/main/0090-character/0270-skin-proposal.js에서 옮김 */
function openSkinProp(){ const P0=SKPROP; if(!P0||!P0.url) return; const c=charById(P0.cid); if(!c) return; const sel=P0.sel||{upper:1,illust:1,lbcg:1,faces:0,lines:SAMPLE?1:0};
  openModal(`${head(`「${esc(P0.name)}」 제안`,`<span class="muted">${esc(c.name)}의 새 ${esc(T('skin'))} · 이 모습으로 만들까요?</span>`)}
    <div class="skp-img"><img src="${esc(P0.url)}" alt="${esc(P0.name)}"></div><p class="muted" style="text-align:center;font-size:.78rem;margin:4px 0 0">그림을 누르면 크게 봐요</p>
    <h3 class="sec">수락하면 함께 만들 것</h3>
    ${skinSelHTML(sel,c)}
    <label class="f" for="skp_scene">일러스트·CG 장면 태그 (선택)</label><input class="in" id="skp_scene" value="${esc(P0.scene||'')}" placeholder="예: beach, sunset, waves, smile">
    <p class="muted" style="font-size:.78rem">수락하면 뒤에서 차례로 그려요(위쪽 막대에 진행이 보여요). 표정은 얼굴 범위를 칠한 뒤 전신·상반신 모두 얼굴만 다시 그려요.</p>
    <div class="row" style="margin-top:10px"><button class="btn" data-act="skpok">수락 · 이 모습으로 만들기</button><button class="btn ghost" data-act="skpredo">다시 그리기</button><button class="btn ghost" data-act="skpcancel">취소</button></div>`); }
function skinPropRead(){ const P0=SKPROP; if(!P0) return; P0.sel={}; document.querySelectorAll('[data-skp]').forEach(i=>{ P0.sel[i.dataset.skp]=i.checked?1:0; }); const sc=$('#skp_scene'); if(sc){P0.scene=sc.value.trim();naiBlocksSave(P0,'scene',sc);} }
function skinSelHTML(sel,c,k){const required=c?.useStanding===false&&(!k||!imgSrcRaw(k.upper)); return `<div class="prepcats">${[['upper','상반신'],['illust','일러스트 (로비)'],['lbcg',T('limit')+' CG (개화)'],['faces','표정 기본 6종 (얼굴 범위를 칠해요)'],['lines','이 '+T('skin')+' 전용 대사 (글 AI)']].map(([k,l])=>`<label class="pc"><input type="checkbox" data-skp="${k}" ${sel[k]||k==='upper'&&required?'checked':''} ${k==='lines'&&!SAMPLE||k==='upper'&&required?'disabled':''}><b>${esc(l)}${k==='upper'&&required?' (현재 표시 방식에 필수)':''}</b></label>`).join('')}</div>`; }
function skinSelRead(){ const o={}; document.querySelectorAll('[data-skp]').forEach(i=>{ o[i.dataset.skp]=i.checked?1:0; }); return o; }
function openSkinBuy(id){ const f=skinShopList().find(x=>x.k.id===id); if(!f) return; const {c,k}=f, src=skinPreviewSrc(c,k), pr=k.price||SKIN_PRICE, got=!!(P().skinOwn||{})[k.id], sel=SKBUYSEL||(SKBUYSEL={upper:1,illust:1,lbcg:1,faces:0,lines:SAMPLE?1:0});
  openModal(`${head(`${esc(c.name)} 「${esc(k.name)}」`,`<span class="muted">${esc(k.desc||T('skin'))}</span>`)}
    ${src?`<div class="skp-img"><img src="${esc(src)}" alt="${esc(k.name)}"></div><p class="muted" style="text-align:center;font-size:.78rem;margin:4px 0 0">그림을 누르면 크게 봐요</p>`:`<p class="muted">아직 이 스킨의 그림이 없어요. 사기 전에 그려서 확인해 보세요.</p>`}
    ${c.useStanding===false&&!skinDisplayReady(c,k)?'<p class="muted">스탠딩 사용이 꺼져 있어 이 스킨의 상반신이 필요해요. 아래에서 상반신을 그린 뒤 구매할 수 있어요.</p>':''}
    ${k.line?`<p style="margin:8px 0 0;text-align:center">“${esc(sub(k.line))}”</p>`:''}
    ${got||playMode()?'':`<h3 class="sec">사면 함께 만들 것</h3>${skinSelHTML(sel,c,k)}<p class="muted" style="font-size:.78rem">사면 뒤에서 차례로 그려요. 표정은 얼굴 범위를 칠한 뒤 전신·상반신 모두 얼굴만 다시 그려요.</p>`}
    <div class="row" style="margin-top:10px">${got?'<button class="btn" disabled>보유 중</button>':`<button class="btn" data-act="skbbuy" data-id="${k.id}" ${skinDisplayReady(c,k)?'':'disabled'}>${rIco('gems')}${nf(pr)} 구매</button>`}${imgReady()&&(!playMode()||!skinDisplayReady(c,k))?`<button class="btn ghost" data-act="skbdraw" data-id="${k.id}">${skinDisplayReady(c,k)?'다시 그리기':c.useStanding===false?'상반신 그려 보기':'스탠딩 그려 보기'}</button>`:''}${got||playMode()?'':`<button class="btn ghost" data-act="skinpkgdel" data-id="${k.id}">패키지 지우기</button>`}<button class="btn ghost" data-act="close">닫기</button></div>`); }
function openAiEvent(){
  openModal(`${head('AI로 이벤트 만들기')}
    <label class="f" for="ae_d">이벤트 내용</label><textarea class="in" id="ae_d" placeholder="예: 여름 해변 축제. 바다에서 떠오른 잔광 해파리 소동. 수영복 차림의 카야와 이브가 주인공."></textarea>
    <label class="f">주연 ${T('crew')}</label><div class="chips">${G.chars.map(c=>`<button class="chip" data-act="castt" data-id="${c.id}">${esc(c.name)}</button>`).join('')}</div>
    <div class="g2"><div><label class="f" for="ae_n">스테이지 수</label><select class="in" id="ae_n">${opt([[3,'3개'],[4,'4개'],[5,'5개']],3)}</select></div>
    <div><label class="f" for="ae_new">한정 ${T('crew')}</label><select class="in" id="ae_new">${opt([['1','새로 만들기'],['0','만들지 않기']],'1')}</select></div></div>
    <label class="f" for="ae_len">스토리 분량</label><select class="in" id="ae_len">${opt(Object.entries(STORY_LEN).map(([k,v])=>[k,v[0]+' (스테이지마다 대본 '+v[1].pre+'줄)']),storyCfg().len)}</select>
    <p class="muted" style="margin:4px 0 0;font-size:.78rem">길게 쓸수록 시간이 더 걸리고 글 AI 사용량이 늘어요.</p>
    <label class="f" for="ae_lore">이야기 종류 (로어북)</label><select class="in" id="ae_lore">${opt(loreOpts(),'')}</select>
    <p class="muted" style="margin:4px 0 0;font-size:.78rem">IF 스토리는 관계도·스토리 기억에 남지 않아서, 본편과 다른 과감한 이야기도 마음껏 쓸 수 있어요. 이격 전용은 그 이격의 관계 기록에만 남아요.</p>
    <div class="row" style="margin-top:14px"><button class="btn" data-act="aievent">만들기</button></div>
    <p class="muted">이벤트 스토리, 한정 배너, 교환소, 필요한 배경과 음악, ${T('talk')}까지 만들어요.</p>`);
}
/* src/main/0090-character/0455-persona.js에서 옮김 */
function memoCheck(c,before,after){ if(c&&c.memorial&&before<(+c.memorial.lv||8)&&after>=(+c.memorial.lv||8)) setTimeout(()=>toast(`✦ ${c.name}의 메모리얼 「${c.memorial.title}」이(가) 열렸어요`),1200); }
/* 화면: 캐릭터 정보 탭 · 개성 편집 · 일괄 검수 */
function personaHTML(c){ if(!c||c.npc) return ''; const p=c.persona||{}, rv=personaReview(c), at=affThreads(c), o=own(c.id), lv=o?affLv(o):0, chip=v=>`<span class="chip" style="font-size:.78rem">${esc(v)}</span>`, f=c.pfields||{}, ai=c.personaAIReview;
  return `<h3 class="sec">개성 <span class="badge">${rv.grade} ${rv.score}</span></h3>
  ${Object.keys(f).length?`<div class="g2" style="font-size:.85rem">${Object.entries(f).map(([k,v])=>`<div><span class="muted">${esc(k)}</span> ${esc(v)}</div>`).join('')}</div>`:''}
  ${(p.traits||[]).length?`<div class="row" style="flex-wrap:wrap;gap:4px;margin:6px 0">${p.traits.map(chip).join('')}</div>`:''}
  <div style="font-size:.85rem;line-height:1.6">${[['말투',[p.self&&'1인칭 '+p.self,p.ending&&'어미 '+p.ending,p.quirk&&'말버릇 '+p.quirk,p.call&&'부르는 말 '+p.call].filter(Boolean).join(' · ')],['대표 대사',p.catch&&`「${p.catch}」`],['반전 매력',p.gap],['약점',p.flaw],['원하는 것',p.want],['두려운 것',p.fear],['좋아함',(p.likes||[]).join(', ')],['싫어함',(p.dislikes||[]).join(', ')],['취미',p.hobby],['상징',p.motif]].filter(([,v])=>v).map(([k,v])=>`<div><span class="muted">${k}</span> ${esc(v)}</div>`).join('')||'<p class="muted">아직 개성 시트가 없어요.</p>'}</div>
  ${rv.issues.length?`<details style="margin:6px 0"><summary class="muted" style="font-size:.82rem">검수: 고칠 점 ${rv.issues.length}개</summary><ul style="margin:4px 0;padding-left:18px;font-size:.82rem">${rv.issues.map(x=>`<li>${esc(x.msg)}</li>`).join('')}</ul></details>`:''}
  ${ai?`<details style="margin:6px 0"><summary class="muted" style="font-size:.82rem">AI 평가 ${ai.score}점</summary><div style="font-size:.82rem"><b>장점</b> ${ai.strengths.map(esc).join(' / ')}<br><b>약점</b> ${ai.weaknesses.map(esc).join(' / ')}<br><b>제안</b> ${ai.suggestions.map(esc).join(' / ')}</div></details>`:''}
  <div class="row" style="flex-wrap:wrap;gap:4px;margin:6px 0"><button class="btn sm ghost" data-act="psedit" data-id="${c.id}">개성 편집</button><button class="btn sm ghost" data-act="psai" data-id="${c.id}" data-k="fill">AI로 채우기</button><button class="btn sm ghost" data-act="psai" data-id="${c.id}" data-k="improve">AI로 다듬기(+대사)</button><button class="btn sm ghost" data-act="psreview" data-id="${c.id}">AI 매력 평가</button></div>
  <h3 class="sec">인연 톡 · 메모리얼</h3>
  <p class="muted" style="font-size:.82rem;margin:0 0 6px">호감도 ${PERSONA_CFG().affLv.join('·')}에서 ${esc(T('talk'))}이 오고, ${c.memorial?`호감도 ${c.memorial.lv}에서 메모리얼이 열려요`:'메모리얼을 만들면 높은 호감도에서 열려요'}. 지금 호감도 Lv.${lv||'-'}</p>
  <div style="font-size:.85rem">${at.length?at.sort((a,b)=>a.trigger.value-b.trigger.value).map(t=>`<div>Lv.${t.trigger.value} 「${esc(t.title)}」 ${P().inbox[t.id]?'<span class="muted">받음</span>':'<span class="muted">잠김</span>'}</div>`).join(''):'<p class="muted" style="margin:0">아직 인연 톡이 없어요.</p>'}
  ${c.memorial?`<div style="margin-top:4px">✦ 메모리얼 「${esc(c.memorial.title)}」 ${memoOpen(c)?'<span class="badge">열림</span>':`<span class="muted">호감도 ${c.memorial.lv}에서 열림</span>`}</div>`:''}</div>
  <div class="row" style="flex-wrap:wrap;gap:4px;margin:6px 0"><button class="btn sm ghost" data-act="pstalk" data-id="${c.id}">AI로 인연 톡 만들기</button><button class="btn sm ghost" data-act="psmemo" data-id="${c.id}">${c.memorial?'메모리얼 다시 만들기':'AI로 메모리얼 만들기'}</button>${c.memorial&&(memoOpen(c)||!playMode())?`<button class="btn sm ghost" data-act="psmemoplay" data-id="${c.id}">메모리얼 보기</button>`:''}${memoOpen(c)?`<button class="btn sm${memoOn(c)?'':' ghost'}" data-act="psmemolobby" data-id="${c.id}">메모리얼 로비 ${memoOn(c)?'끄기':'켜기'}</button>`:''}</div>`; }
function openPersona(cid){ const c=charById(cid); if(!c) return; const p=c.persona||{}, cfg=PERSONA_CFG(), f=c.pfields||{}, keys=[...new Set([...cfg.tpl,...Object.keys(f)])];
  openModal(`${head(`${c.name} 개성 편집`)}<p class="muted" style="font-size:.8rem;margin:0 0 6px">목록 항목은 쉼표로 나눠요. 비운 칸은 지워져요.</p>
  ${PERSONA_FIELDS.map(([k,l,t])=>`<label class="f">${esc(l)}</label><input class="in" data-ps="${k}" value="${esc(t==='list'?(p[k]||[]).join(', '):p[k]||'')}">`).join('')}
  <h3 class="sec" style="margin-top:12px">프로필</h3><div class="g2">${keys.map(k=>`<div><label class="f">${esc(k)}</label><input class="in" data-pf="${esc(k)}" value="${esc(f[k]||'')}"></div>`).join('')}</div>
  <label class="f" style="margin-top:8px">추가 항목 (이름=값, 줄마다)</label><textarea class="in" id="ps_extra" rows="2" placeholder="별명=○○"></textarea>
  <div class="row" style="margin-top:12px"><button class="btn" data-act="pssave" data-id="${c.id}">저장</button><button class="btn ghost" data-act="close">취소</button></div>`); }
function personaPanel(){ const L=G.chars.filter(c=>!c.alt).map(c=>({c,r:personaReview(c)})), avg=L.length?Math.round(L.reduce((a,x)=>a+x.r.score,0)/L.length):0, low=L.filter(x=>x.r.score<55).length;
  return `<div class="panel pm-hide"><h3>캐릭터 개성·매력 ${low?`<span class="badge">약함 ${low}</span>`:''}</h3><p class="muted" style="margin:0 0 6px">개성 평균 ${avg}점. 개성 시트(성격·말투·반전 매력·결점…), 프로필 템플릿, 검수, 인연 톡·메모리얼을 관리해요.</p><button class="btn sm" data-act="psopen">개성 검수·설정</button></div>`; }
function openPersonaAll(){ const cfg=PERSONA_CFG(), L=G.chars.filter(c=>!c.alt).map(c=>({c,r:personaReview(c)})).sort((a,b)=>a.r.score-b.r.score), cur=Object.entries(PROFILE_TPLS).find(([,v])=>v.join()===cfg.tpl.join());
  openModal(`${head('캐릭터 개성 검수·설정')}
  <h3 class="sec">프로필 템플릿</h3><select class="in" id="ps_tpl">${[['basic','기본 (생일·신장·출신·특기)'],['org','소속 조직 (소속·직책 …)'],['operator','작전 요원 (코드네임·전투 경력·임상 소견 …)'],['fantasy','판타지 (종족·계약 …)'],['idol','아이돌 (소속사·데뷔·담당·팬덤 …)'],['streamer','스트리머 (활동명·플랫폼·구독자 애칭 …)'],['custom','직접 입력']].map(([k,l])=>`<option value="${k}" ${(cur?cur[0]:'custom')===k?'selected':''}>${l}</option>`).join('')}</select>
  <label class="f">항목 (쉼표)</label><input class="in" id="ps_tplf" value="${esc(cfg.tpl.join(', '))}">
  <div class="g2"><div><label class="f">인연 톡 호감도 단계 (쉼표)</label><input class="in" id="ps_aff" value="${esc(cfg.affLv.join(', '))}"></div><div><label class="f">메모리얼 호감도</label><input class="in" type="number" id="ps_memo" min="1" max="10" value="${cfg.memoLv}"></div></div>
  <div class="row" style="margin:8px 0"><button class="btn sm" data-act="pscfg">설정 저장</button></div>
  <h3 class="sec">검수 결과 <span class="muted" style="font-size:.8rem">(낮은 순)</span></h3>
  <div style="max-height:280px;overflow:auto;font-size:.82rem">${L.map(({c,r})=>`<label style="display:flex;gap:6px;align-items:flex-start;padding:3px 0;border-bottom:1px solid var(--line)"><input type="checkbox" data-psc="${c.id}" ${r.score<55?'checked':''}><b style="min-width:70px">${esc(c.name)}</b><span class="badge">${r.grade} ${r.score}</span><span class="muted">${esc(r.issues.slice(0,3).map(x=>x.msg).join(' · '))}${r.issues.length>3?' …':''}</span></label>`).join('')}</div>
  <div class="row" style="margin-top:8px;flex-wrap:wrap;gap:6px"><button class="btn sm" data-act="psbatch" data-k="fill">선택: AI로 개성 채우기</button><button class="btn sm ghost" data-act="psbatch" data-k="improve">선택: AI로 다듬기(+대사)</button><button class="btn sm ghost" data-act="psbatch" data-k="talk">선택: 인연 톡 만들기</button><button class="btn sm ghost" data-act="psbatch" data-k="memo">선택: 메모리얼 만들기</button>${PS_JOB?'<button class="btn sm ghost" data-act="psstop">멈추기</button>':''}${typeof AUDIT_UNDO!=='undefined'&&AUDIT_UNDO?`<button class="btn sm ghost" data-act="psundo">되돌리기: ${esc(AUDIT_UNDO.label)}</button>`:''}</div>
  <div class="row" style="margin-top:12px"><button class="btn ghost" data-act="close">닫기</button></div>`); }
