/* ===== 선물 ===== */
const GIFTS=[['g_cake','달콤한 케이크','🍰',20],['g_tea','고급 찻잎','🍵',20],['g_flower','꽃다발','💐',25],['g_book','두꺼운 책','📖',25],['g_tool','공구 세트','🔧',25],['g_doll','봉제 인형','🧸',30],['g_perfume','향수','🧴',35],['g_music','음반','💿',30],['g_brooch','보석 브로치','💎',50],['g_letter','손편지','✉️',60]];
const giftById=id=>GIFTS.find(g=>g[0]===id);
function GI(){ const p=P(); if(!p.gifts||typeof p.gifts!=='object') p.gifts={}; return p.gifts; }
function addGifts(n){ const inv=GI(), got=[]; for(let i=0;i<n;i++){ const w=GIFTS.map(g=>g[3]>=50?1:g[3]>=30?3:5), tot=w.reduce((a,b)=>a+b,0); let x=Math.random()*tot, k=0; while((x-=w[k])>0) k++; const id=GIFTS[k][0]; inv[id]=(inv[id]||0)+1; got.push(id); } mark('prog'); return got; }
function giftLikes(c){ const h=hashN(c.id+'likes'); const a=h%GIFTS.length, b=(Math.floor(h/7)+3)%GIFTS.length; return new Set([GIFTS[a][0],GIFTS[b===a?(b+1)%GIFTS.length:b][0]]); }
function openGift(cid){
  const c=charById(cid), inv=GI(), likes=giftLikes(c), seen=(P().giftSeen||{})[cid]||{};
  const items=GIFTS.filter(g=>inv[g[0]]>0);
  const full=affFull(own(c.id));
  openModal(`${head(`${esc(c.name)}에게 선물하기`,`<span class="muted">호감도 Lv.${affLv(own(c.id))}${full?' · <b style="color:var(--rose)">MAX</b>':''} · 좋아하는 선물은 효과가 2배예요</span>`)}
    ${full?`<p class="gf-full">♥ 호감도가 가득 찼어요. 선물을 더 줘도 오르지 않으니 다른 ${esc(T('crew'))}에게 주세요.</p>`:''}
    ${items.length?`<div class="gf-grid">${items.map(g=>`<button class="gf-it" data-act="giftgive" data-id="${esc(cid)}" data-v="${g[0]}" ${full?'disabled':''}><em>${g[2]}</em><b>${esc(g[1])}</b><span>×${inv[g[0]]} · +${g[3]}${seen[g[0]]===2?' <i class="gf-like">♥ 좋아해요</i>':seen[g[0]]===1?' <i class="gf-meh">무난</i>':''}</span></button>`).join('')}</div>`
      :`<p class="muted">가진 선물이 없어요. 상점의 '선물 꾸러미', 일일 보급, 파견, 도전 보상에서 얻을 수 있어요.</p><div class="row"><button class="btn sm" data-act="go" data-to="shop">상점 가기</button></div>`}`);
}
function bannerStep(d){ const bs=G.banners.filter(bnOpen); if(bs.length<2) return; const bn=curBanner(), i=Math.max(0,bs.findIndex(x=>bn&&x.id===bn.id));
  P().curBanner=bs[(i+d+bs.length)%bs.length].id; mark('prog'); window.__BSLIDE=d>0?'sl-r':'sl-l'; render(); window.__BSLIDE=''; sfx('버튼'); }
(()=>{ let sx=0,sy=0,st=0,el=null;
  const down=(x,y,t)=>{ el=t&&t.closest&&t.closest('[data-swipe]'); sx=x; sy=y; st=Date.now(); };
  const up=(x,y)=>{ if(!el) return; const dx=x-sx, dy=y-sy; const e2=el; el=null; if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.4&&Date.now()-st<900){ window.__SWIPED=Date.now(); if(e2.dataset.swipe==='banner') bannerStep(dx<0?1:-1); } };
  document.addEventListener('touchstart',e=>{ const p=e.touches[0]; down(p.clientX,p.clientY,e.target); },{passive:true});
  document.addEventListener('touchend',e=>{ const p=e.changedTouches[0]; up(p.clientX,p.clientY); },{passive:true});
  document.addEventListener('mousedown',e=>{ if(e.button===0) down(e.clientX,e.clientY,e.target); });
  document.addEventListener('mouseup',e=>{ up(e.clientX,e.clientY); });
})();

(()=>{ let tx=0,ty=0,cx=0,cy=0,raf=0; const step=()=>{ cx+=(tx-cx)*0.08; cy+=(ty-cy)*0.08; const el=document.querySelector('.lobby.layer'); if(el){ el.style.setProperty('--px',cx.toFixed(3)); el.style.setProperty('--py',cy.toFixed(3)); } raf=(Math.abs(tx-cx)+Math.abs(ty-cy)>0.002)?requestAnimationFrame(step):0; };
  const set=(x,y)=>{ tx=Math.max(-1,Math.min(1,x)); ty=Math.max(-1,Math.min(1,y)); if(!raf) raf=requestAnimationFrame(step); };
  document.addEventListener('pointermove',e=>{ if(e.pointerType==='mouse'&&document.querySelector('.lobby.layer')) set(e.clientX/innerWidth*2-1,e.clientY/innerHeight*2-1); },{passive:true});
  addEventListener('deviceorientation',e=>{ if(e.gamma==null||!document.querySelector('.lobby.layer')) return; set(e.gamma/30,(e.beta-45)/30); },{passive:true});
})();
function hsDecorate(){ document.querySelectorAll('.bsel,.cx-cats').forEach(el=>{
    if(!el.parentElement.classList.contains('hs-wrap')){ const w=document.createElement('div'); w.className='hs-wrap'; el.parentNode.insertBefore(w,el); w.appendChild(el); w.insertAdjacentHTML('beforeend','<button class="hs-ar l" data-hs="-1" aria-label="왼쪽으로">‹</button><button class="hs-ar r" data-hs="1" aria-label="오른쪽으로">›</button>'); el.addEventListener('scroll',()=>hsUpd(w),{passive:true}); }
    const on=el.querySelector('.on'); if(on&&!el.__did){ el.__did=1; const l=on.offsetLeft-el.clientWidth/2+on.offsetWidth/2; el.scrollLeft=Math.max(0,l); } hsUpd(el.parentElement); }); }
function hsUpd(w){ const el=w.firstElementChild; if(!el) return; const max=el.scrollWidth-el.clientWidth-2; w.classList.toggle('can-l',el.scrollLeft>2); w.classList.toggle('can-r',el.scrollLeft<max); }
(()=>{ let d=null;
  document.addEventListener('mousedown',e=>{ const el=e.target.closest&&e.target.closest('.bsel,.cx-cats'); if(!el||e.button!==0) return; d={el,x:e.clientX,s:el.scrollLeft,moved:false}; });
  document.addEventListener('mousemove',e=>{ if(!d) return; const dx=e.clientX-d.x; if(Math.abs(dx)>5){ d.moved=true; d.el.scrollLeft=d.s-dx; } });
  document.addEventListener('mouseup',()=>{ if(d&&d.moved) window.__SWIPED=Date.now(); d=null; });
  document.addEventListener('wheel',e=>{ const el=e.target.closest&&e.target.closest('.bsel,.cx-cats'); if(!el||Math.abs(e.deltaY)<=Math.abs(e.deltaX)) return; if(el.scrollWidth<=el.clientWidth) return; el.scrollLeft+=e.deltaY; e.preventDefault(); },{passive:false});
  document.addEventListener('click',e=>{ const a=e.target.closest&&e.target.closest('[data-hs]'); if(!a) return; e.stopPropagation(); const el=a.parentElement.firstElementChild; el.scrollBy({left:(+a.dataset.hs)*el.clientWidth*0.7,behavior:'smooth'}); },true);
})();
function fitLobby(){ try{ hsDecorate(); }catch(e){} const el=document.querySelector('.lobby'); if(!el) return; const tb=document.querySelector('.tabs'); const top=el.getBoundingClientRect().top+(document.scrollingElement?document.scrollingElement.scrollTop:0);
  const tabsH=tb?tb.getBoundingClientRect().height:0; const h=Math.max(document.body.classList.contains('wide')?200:360,Math.floor(innerHeight-top-tabsH)); el.style.height=h+'px'; el.classList.toggle('short',h<600); el.classList.toggle('narrow',el.clientWidth<370); }
addEventListener('resize',()=>{ clearTimeout(window.__fitT); window.__fitT=setTimeout(fitLobby,120); });
