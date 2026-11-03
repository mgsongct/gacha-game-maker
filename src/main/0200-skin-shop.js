/* ===== 자동 스킨 상점: 2주마다 캐릭터 한 명의 새 의상을 만들어 캐시 상점 패키지로 팔아요(재화는 게임 안 유료 재화) ===== */
const SKIN_PRICE=1280;
const skinHave=k=>!k||!k.shop||!!(P().skinOwn||{})[k.id];
function skinShopList(){ return G.chars.flatMap(c=>(c.skins||[]).filter(k=>k.shop).map(k=>({c,k}))).sort((a,b)=>(b.k.at||0)-(a.k.at||0)); }
function skinPeriodKey(){ const L=P().live, se=L.on.season&&L.season; return se&&se.start?'season:'+se.start:cycKey('rotate'); }
async function skinAuto(notes,period){
  const game=G,project=PJ().active;
  const L=P().live, rec=L.skinRecent||(L.skinRecent=[]), pu=G.banners.filter(bn=>bn.active!==false&&bn.type==='pickup').flatMap(b=>b.pickup||[]);
  const shopN=c=>(c.skins||[]).filter(k=>k.shop).length, base=G.chars.filter(c=>c.naiPrompt&&!c.alt); if(!base.length) return null;
  // 상점 의상이 가장 적은 캐릭터 중에서(같으면 픽업·보유 우선), 최근에 나온 캐릭터는 다른 후보가 있으면 빼요
  const minN=Math.min(...base.map(shopN)); let cand=base.filter(c=>shopN(c)===minN&&!rec.includes(c.id)); if(!cand.length) cand=base.filter(c=>!rec.includes(c.id)); if(!cand.length){ L.skinRecent=[]; cand=base; }
  const pri=cand.filter(c=>pu.includes(c.id)), mine=cand.filter(c=>own(c.id)); cand=pri.length?pri:mine.length?mine:cand;
  const c=rand(cand), evs=G.events.filter(ev=>ev.active!==false&&gateOpen(ev)).map(e=>e.title).join(', ');
  const originalPrompt=c.naiPrompt,skinBase=await naiSkinBase(c);
  if(G!==game||PJ().active!==project||charById(c.id)!==c||c.naiPrompt!==originalPrompt)throw Error('캐릭터나 게임이 바뀌어 스킨 생성을 중단했어요');
  const r=await aiJSON(skinAutoPrompt({c,skinBase,evs}),null,'quick');
  if(G!==game||PJ().active!==project||charById(c.id)!==c||c.naiPrompt!==originalPrompt)throw Error('캐릭터나 게임이 바뀌어 스킨 생성을 중단했어요');
  if(!r)return null;
  const parts=naiSkinParts(skinBase,r),k={id:'k'+uid(),name:String(r.name||'새 '+T('skin')).slice(0,16),desc:String(r.desc||'').slice(0,80),line:String(r.line||'').slice(0,80),prompt:'',img:null,shop:true,price:SKIN_PRICE,at:Date.now(),period:period||''};
  naiBlocksStore(k,'prompt',parts);
  c.skins=c.skins||[]; c.skins.push(k); rec.unshift(c.id); L.skinRecent=rec.slice(0,Math.max(1,Math.min(6,G.chars.filter(x=>x.naiPrompt&&!x.alt).length-1))); mark('c:'+c.id,'prog');
  if(imgReady()){ try{ liveBar(`${c.name} 「${k.name}」 그리는 중…`); const target=skinPrimaryPart(c,k),x=target===k?'stand':'upper',b=await skinPartDraw(c,k,x);if(G!==game||PJ().active!==project||charById(c.id)!==c||!c.skins.includes(k))throw Error('대상이 바뀌어 스킨 생성을 중단했습니다');await storeImage(target,b,''); mark('c:'+c.id); }catch(e){toast(naiErr(e,'스킨 이미지 생성 실패'));} }
  if(notes) notes.push(`${T('skin')} 신상품: ${c.name} 「${k.name}」 (캐시 상점 패키지)`);
  return {c,k};
}
function skinPkgHTML(){ const a=skinShopList(), so=P().skinOwn||{};
  return `<h3 class="sec">${esc(T('skin'))} 패키지</h3><div class="row" style="margin:0 0 6px"><span class="muted" style="flex:1;font-size:.8rem">${P().live.on.season?'시즌이 바뀔 때마다':esc(cycLabel('rotate'))+'마다'} ${esc(T('crew'))} 한 명의 새 ${esc(T('skin'))}이 자동으로 나와요 (설정 → 시즌 운영에서 끄기)</span><button class="btn sm ghost" data-act="skinnew">✦ 지금 하나 만들기</button></div>${a.length?'':'<p class="muted" style="font-size:.8rem">아직 판매 중인 '+esc(T('skin'))+'이 없어요.</p>'}${a.map(({c,k},i)=>{ const got=!!so[k.id], src=skinPreviewSrc(c,k);
    return `<div class="cs-card pkg skinpkg">${i===0&&!got?'<span class="rib" style="position:absolute;left:8px;top:6px;background:#ff3d7f;padding:1px 8px;font-size:.62rem;font-weight:700">NEW</span>':''}<span class="wthumb" style="width:64px;height:84px;overflow:hidden">${src?`<img src="${esc(src)}" alt="" style="width:100%;height:100%;object-fit:cover;object-position:50% 12%">`:''}</span><div class="t"><b>${esc(c.name)} 「${esc(k.name)}」</b><span class="muted" style="color:#e9d9b0">${esc(k.desc||T('skin'))}${imgSrc(k)?'':' · 그림은 '+T('skin')+' 편집에서 그릴 수 있어요'}</span></div><span style="display:flex;flex-direction:column;gap:4px"><button class="btn sm" data-act="skinbuy" data-id="${k.id}" ${got?'disabled':''}>${got?'보유':rIco('gems')+nf(k.price||SKIN_PRICE)}</button>${got?'':`<button class="btn sm ghost" data-act="skinpkgdel" data-id="${k.id}">지우기</button>`}</span></div>`; }).join('')}`; }
function gemArt(t){const n=Math.min(6,t);let g='';for(let i=0;i<n;i++){const x=12+((i*37)%56),y=40-((i*23)%30),s=1-i*0.06;g+=`<g transform="translate(${x} ${y}) scale(${s.toFixed(2)})"><path d="M6 0h20l8 10-18 22L-2 10z" fill="#5fc8ff" stroke="#e8fbff" stroke-width="1.5"/><path d="M-2 10h36M13 0l3 32 3-32" stroke="#e8fbff" stroke-width="1" fill="none" opacity=".7"/></g>`;}return `<svg viewBox="0 0 90 76">${g}</svg>`;}
function cashTick(){
  const p=P(), mo=p.cash&&p.cash.month; if(!mo||!mo.until) return;
  if(Date.now()<mo.until&&mo.last!==today()){ mo.last=today(); sendMail({from:'캐시 상점',title:'월간 보급 카드 오늘의 지급',body:`월간 보급 카드 남은 기간 ${Math.ceil((mo.until-Date.now())/864e5)}일`,reward:{gems:100},days:7}); setTimeout(()=>toast('우편함에 월간 보급 카드가 도착했어요'),300); }
}
function cashHTML(){
  const p=P(), mo=p.cash.month, act=mo.until>Date.now(), days=act?Math.ceil((mo.until-Date.now())/864e5):0;
  return `${pageHead('캐시 상점','CASH SHOP','lobby')}
  <div class="cashhero"><i>PREMIUM STORE</i><h2>◆ ${esc(T('currency'))} 충전소</h2><div class="bal">${rIco('gems')}${nf(p.gems)}</div><p>나만의 게임이라 전부 무료예요. 마음껏 충전하세요.</p></div>
  <h3 class="sec">월간 보급 카드</h3>
  <div class="cs-card month hot"><div class="t"><b>월간 보급 카드</b><span class="muted" style="color:#cfe6ff">즉시 ◆300 + 30일 동안 매일 ◆100 (매일 우편함으로 와요)</span>${act?`<div style="margin-top:4px;color:#7fd8ff">남은 기간 ${days}일 · 오늘 ${mo.last===today()?'받음':'미수령'}</div>`:''}</div><button class="btn sm" data-act="cashmonth">${act?'연장':'무료'}</button></div>
  <h3 class="sec">${esc(T('currency'))}</h3>
  <div class="cash-grid">${CASH_PACKS.map((k,i)=>{const first=!p.cash.first[k.id];return `<div class="cs-card gem hot t${i+1}">${first?'<span class="rib">첫 구매 2배</span>':''}<div class="gv">${gemArt(i+1)}</div><div class="amt">${nf(k.gems)}<small>${first?'+'+nf(k.gems)+' 첫 구매 보너스':k.bonus?'+'+nf(k.bonus)+' 보너스':'&nbsp;'}</small></div><button class="btn" data-act="cashbuy" data-id="${k.id}">₩0 무료</button></div>`;}).join('')}</div>
  <h3 class="sec">패키지</h3>
  ${CASH_PKGS().map(k=>`<div class="cs-card pkg"><span class="wthumb">${rIcon(k.give)}</span><div class="t"><b>${esc(k.name)}</b><span class="muted" style="color:#e9d9b0">${rewardText(k.give)}</span></div><button class="btn sm" data-act="cashpkg" data-id="${k.id}">무료</button></div>`).join('')}${skinPkgHTML()}`;
}
function buyFx(big,sub2){
  const d=document.createElement('div'); d.className='buyfx';
  let sp=''; for(let i=0;i<18;i++){const a=i/18*Math.PI*2,r=120+Math.random()*120; sp+=`<i class="sp" style="--dx:${Math.round(Math.cos(a)*r)}px;--dy:${Math.round(Math.sin(a)*r)}px;animation-delay:${(Math.random()*.15).toFixed(2)}s"></i>`;}
  d.innerHTML=`<div class="rays"></div><div class="ring"></div>${sp}<div class="core">${RICON.gems}<b>${big}</b><span>${sub2||''}</span></div>`;
  d.addEventListener('click',()=>d.remove()); document.body.appendChild(d); sfx('확인'); setTimeout(()=>d.remove(),1800);
}

