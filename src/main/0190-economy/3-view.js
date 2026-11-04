/* ===== 0190-economy — View(HTML·DOM을 만듦) ===== */
/* src/main/0190-economy/0190-shop.js에서 옮김 */
function rIco(k){const l=iconLib(k), s=l&&imgSrc(l); return s?`<img class="ricon" src="${esc(s)}" alt="">`:(RICON[k]||RICON.gold);}
function rIcon(r){const k=['gems','transcMat','gearMat','core','wmat','exp','gold'].find(k=>r[k]); return rIco(k||'gold');}
function shopHTML(){
  const p=P(), sd=progRead('shop'), {m,c,self}=shopkeeper(); if(!SHOP_LINE) SHOP_LINE=rand(m.hello)||'어서 와요.';
  const sil='<div class="sil"><svg viewBox="0 0 100 120" fill="currentColor"><circle cx="50" cy="34" r="20"/><path d="M14 120c2-34 16-52 36-52s34 18 36 52z"/></svg></div>';
  return `${pageHead('상점','SUPPLY SHOP','lobby')}
  <div class="shk fr-upper"><div class="shk-bg" style="${bgStyle(P().lobbyBg||'새벽등대 사무소')}"></div>
    <div class="shk-art">${self?`<img class="art" src="${esc(self)}" alt="${esc(m.name||'')}">`:c?art(c,'',{upper:true}):sil}</div>
    <div class="shk-talk"><b>${esc(m.name||'상점 주인')}</b><p id="shkLine">${esc(sub(SHOP_LINE))}</p></div>
    <button class="btn sm ghost shk-edit" data-act="shkedit">주인 설정</button></div>
  <div class="wallet"><span>${rIco('gold')}${nf(p.gold)}</span><span>${rIco('exp')}${nf(p.mat.exp)}</span><span>${rIco('wmat')}${nf(p.mat.wmat)}</span><span>${rIco('core')}${nf(p.mat.core)}</span><span title="${esc(T('gearMat'))}">${rIco('gearMat')}${nf(p.mat.gearMat||0)}</span><span title="${esc(T('transcMat'))}">${rIco('transcMat')}${nf(p.mat.transcMat||0)}</span></div>
  <h3 class="sec">오늘의 상품 <span class="muted" style="font-size:.75rem">매일 초기화</span></h3>
  <div class="shop-grid">${SHOP_ITEMS().map(it=>{const n=sd.buy[it.id]||0,left=it.limit-n,out=left<=0;
    return `<div class="si ${out?'soldout':''}">${it.tag?`<span class="tag">${it.tag}</span>`:''}<span class="ri">${rIcon(it.give)}</span><b>${esc(it.name)}</b><small>${costText(it.cost)} · 남은 ${Math.max(0,left)}/${it.limit}</small><button class="btn ${it.tag==='FREE'?'':'ghost'}" data-act="shopbuy" data-id="${it.id}" ${out?'disabled':''}>${out?'매진':it.tag==='FREE'?'받기':'구매'}</button></div>`;}).join('')}</div>
  <h3 class="sec">재료 교환</h3>
  ${SHOP_SWAP().map(x=>`<div class="swap"><span class="t">${costText(x.cost)} → <b>${costText(x.give)}</b></span><button class="btn sm" data-act="shopswap" data-id="${x.id}" ${canPay(x.cost)?'':'disabled'}>교환</button><button class="btn sm ghost" data-act="shopswap" data-id="${x.id}" data-n="10" ${canPay(Object.fromEntries(Object.entries(x.cost).map(([k,v])=>[k,v*10])))?'':'disabled'}>×10</button></div>`).join('')}
  <div class="row" style="margin-top:12px"><button class="btn ghost block" data-act="go" data-to="cash">◆ ${esc(T('currency'))}이(가) 필요하면 캐시 상점으로</button></div>`;
}
function openShk(){
  const m=G.meta.shop;
  openModal(`${head('상점 주인')}
    <label class="f" for="sk_name">이름</label><input class="in" id="sk_name" value="${esc(m.name)}" maxlength="20">
    <label class="f" for="sk_char">모습</label><select class="in" id="sk_char" onchange="document.getElementById('skSelf').hidden=this.value!=='__self'"><option value="">실루엣</option><option value="__self" ${m.charId==='__self'?'selected':''}>직접 만든 모습 (상인 전용 그림)</option>${G.chars.map(c=>`<option value="${c.id}" ${m.charId===c.id?'selected':''}>${esc(c.name)} 상반신 빌리기</option>`).join('')}</select>
    <div class="optbox" id="skSelf" style="margin-top:8px" ${m.charId==='__self'?'':'hidden'}><div style="display:flex;gap:10px;align-items:flex-start"><div class="sk-prev">${m.self&&imgSrc(m.self)?`<img src="${esc(imgSrc(m.self))}" alt="">`:'<span>그림 없음</span>'}</div><div style="flex:1;min-width:0">
      <label class="f" for="sk_prompt">외형 프롬프트 (그림 AI 영어 태그)</label><textarea class="in" id="sk_prompt" style="min-height:70px" placeholder="1girl, solo, merchant, apron, smile, holding ledger">${esc((m.self&&m.self.naiPrompt)||'')}</textarea>
      <div class="row" style="margin-top:6px">${imgReady()?`<button class="btn sm" data-act="shkdraw">${m.self&&imgSrc(m.self)?'다시 그리기':'그리기'}</button>`:''}<button class="btn sm ghost" data-act="upload" data-k="shk">그림 올리기</button>${m.self&&m.self.img?XBTN('shk',''):''}</div></div></div></div>
    <label class="f" for="sk_hello">인사 대사 (한 줄에 하나)</label><textarea class="in" id="sk_hello">${esc(m.hello.join('\n'))}</textarea>
    <label class="f" for="sk_buy">구매했을 때</label><textarea class="in" id="sk_buy">${esc(m.buy.join('\n'))}</textarea>
    <label class="f" for="sk_poor">재화가 모자랄 때</label><textarea class="in" id="sk_poor">${esc(m.poor.join('\n'))}</textarea>
    <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="shkai">AI로 대사 쓰기</button></div>
    <div class="row" style="margin-top:14px"><button class="btn" data-act="shksave">저장</button></div>`);
}
/* 캐시 상점 화면: 젬 그림·월간 카드 지급·화면·구매 연출 */
function gemArt(t){const n=Math.min(6,t);let g='';for(let i=0;i<n;i++){const x=12+((i*37)%56),y=40-((i*23)%30),s=1-i*0.06;g+=`<g transform="translate(${x} ${y}) scale(${s.toFixed(2)})"><path d="M6 0h20l8 10-18 22L-2 10z" fill="#5fc8ff" stroke="#e8fbff" stroke-width="1.5"/><path d="M-2 10h36M13 0l3 32 3-32" stroke="#e8fbff" stroke-width="1" fill="none" opacity=".7"/></g>`;}return `<svg viewBox="0 0 90 76">${g}</svg>`;}
function cashHTML(){
  const p=P(), mo=p.cash.month, act=mo.until>Date.now(), days=act?Math.ceil((mo.until-Date.now())/864e5):0;
  return `${pageHead('캐시 상점','CASH SHOP','lobby')}
  <div class="cashhero"><i>PREMIUM STORE</i><h2>◆ ${esc(T('currency'))} 충전소</h2><div class="bal">${rIco('gems')}${nf(p.gems)}</div><p>나만의 게임이라 전부 무료예요. 마음껏 충전하세요.</p></div>
  <h3 class="sec">월간 보급 카드</h3>
  <div class="cs-card month hot"><div class="t"><b>월간 보급 카드</b><span class="muted" style="color:#cfe6ff">즉시 ◆300 + 30일 동안 매일 ◆100 (매일 우편함으로 와요)</span>${act?`<div style="margin-top:4px;color:#7fd8ff">남은 기간 ${days}일 · 오늘 ${mo.last===today()?'받음':'미수령'}</div>`:''}</div><button class="btn sm" data-act="cashmonth">${act?'연장':'무료'}</button></div>
  <h3 class="sec">${esc(T('currency'))}</h3>
  <div class="cash-grid">${CASH_PACKS.map((k,i)=>{const first=!p.cash.first[k.id];return `<div class="cs-card gem hot t${i+1}">${first?'<span class="rib">첫 구매 2배</span>':''}<div class="gv">${gemArt(i+1)}</div><div class="amt">${nf(k.gems)}<small>${first?'+'+nf(k.gems)+' 첫 구매 보너스':k.bonus?'+'+nf(k.bonus)+' 보너스':'&nbsp;'}</small></div><button class="btn" data-act="cashbuy" data-id="${k.id}">₩0 무료</button></div>`;}).join('')}</div>
  <h3 class="sec">패키지</h3>
  ${CASH_PKGS().map(k=>`<div class="cs-card pkg"><span class="wthumb">${rIcon(k.give)}</span><div class="t"><b>${esc(k.name)}</b><span class="muted" style="color:#e9d9b0">${rewardText(k.give)}</span></div><button class="btn sm" data-act="cashpkg" data-id="${k.id}">무료</button></div>`).join('')}
  <h3 class="sec">자원 보급</h3>
  ${CASH_RES().map(k=>`<div class="cs-card pkg"><span class="wthumb">${k.ico||rIcon(k.give)}</span><div class="t"><b>${esc(k.name)}</b><span class="muted" style="color:#e9d9b0">${rewardText(k.give)}</span></div><button class="btn sm" data-act="cashpkg" data-id="${k.id}">₩0</button></div>`).join('')}${skinPkgHTML()}`;
}
function buyFx(big,sub2){
  const d=document.createElement('div'); d.className='buyfx';
  let sp=''; for(let i=0;i<18;i++){const a=i/18*Math.PI*2,r=120+Math.random()*120; sp+=`<i class="sp" style="--dx:${Math.round(Math.cos(a)*r)}px;--dy:${Math.round(Math.sin(a)*r)}px;animation-delay:${(Math.random()*.15).toFixed(2)}s"></i>`;}
  d.innerHTML=`<div class="rays"></div><div class="ring"></div>${sp}<div class="core">${RICON.gems}<b>${big}</b><span>${sub2||''}</span></div>`;
  d.addEventListener('click',()=>d.remove()); document.body.appendChild(d); sfx('확인'); setTimeout(()=>d.remove(),1800);
}
/* 상점 주인 편집 창: 새로 그린 그림 미리 보기·고른 주인 표시(View) */
function shopKeeperShow(o){ const pv=document.querySelector('.sk-prev'); if(pv) pv.innerHTML=`<img src="${esc(imgSrc(o))}" alt="">`; $('#sk_char').value='__self'; }
/* src/main/0190-economy/0220-mail.js에서 옮김 */
function mailRow(x){ const live=mailLive(x), left=x.exp?Math.max(0,Math.ceil((x.exp-Date.now())/864e5)):0, has=Object.keys(x.reward||{}).length;
  return `<div class="mrow ${x.got?'got':''} ${!live&&!x.got?'exp':''}" data-act="mailview" data-id="${x.id}"><span class="mic">${has?rIcon(x.reward):ICO.mail}</span><span class="t"><b>${esc(x.title)}</b><span class="muted">${esc(x.from)} · ${x.got?'수령 완료':!live?'기간 만료':!has?(x.read?'읽음':'알림'):x.exp?left+'일 남음':'기간 제한 없음'}</span>${has?`<span class="rw">${rewardText(x.reward)}</span>`:''}</span>${has&&live?`<button class="btn sm" data-act="mailget" data-id="${x.id}">받기</button>`:`<button class="btn sm ghost mdel" data-act="maildel" data-id="${x.id}" aria-label="지우기">✕</button>`}</div>`; }
function openMail(){
  const box=progRead('mail'), n=mailCount();
  openModal(`${head('우편함',`<span class="muted">받을 수 있는 우편 ${n}개 · 받지 않은 우편은 기간이 지나면 사라져요</span>`)}
    <div class="mlist">${box.length?box.map(mailRow).join(''):'<p class="muted" style="text-align:center;padding:30px 0">우편이 없어요.</p>'}</div>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="mailall" ${n?'':'disabled'}>모두 받기</button><button class="btn ghost" data-act="mailclean" ${box.some(mailDone)?'':'disabled'}>받은·읽은 우편 지우기</button></div>`);
}
/* 우편 한 통 보기 창(View) */
function openMailView(x){ const has=Object.keys(x.reward||{}).length;
  openModal(`${head(esc(x.title),`<span class="muted">${esc(x.from)} · ${new Date(x.at).toLocaleDateString()}</span>`)}<div class="mbody">${esc(x.body).replace(/\n/g,'<br>')}</div>${has?`<div class="mreward">${rIcon(x.reward)}<b>${rewardText(x.reward)}</b></div>`:''}
        <div class="row" style="margin-top:12px">${has&&mailLive(x)?`<button class="btn" data-act="mailget" data-id="${x.id}" data-back="1">받기</button>`:`<button class="btn ghost" data-act="maildel" data-id="${x.id}">지우기</button>`}<button class="btn ghost" data-act="mailopen">목록</button></div>`); }
