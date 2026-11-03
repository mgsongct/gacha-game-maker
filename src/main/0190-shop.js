/* =========================================================
   상점 (무료 보급 상점, 캐시 상점)
   ========================================================= */
const RICON={
  gearMat:'<svg viewBox="0 0 24 24" fill="none" stroke="#e4ad74" stroke-width="2"><path d="m3 16 4-9h10l4 9-4 4H7zM3 16h18M7 7l3 9M17 7l-3 9"/></svg>',
  transcMat:'<svg viewBox="0 0 24 24" fill="none" stroke="#c9a1ff" stroke-width="2"><path d="m12 2 8 10-8 10-8-10zM12 2v20M4 12h16"/></svg>',
  gold:'<svg viewBox="0 0 24 24" fill="none" stroke="#e9c46a" stroke-width="2"><circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.5 10.5h4a1.5 1.5 0 0 1 0 3h-3"/></svg>',
  exp:'<svg viewBox="0 0 24 24" fill="none" stroke="#7fd8ff" stroke-width="2" stroke-linejoin="round"><path d="M4 5h7a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4zM20 5h-7a2 2 0 0 0-2 2"/><path d="M20 5v12h-7"/></svg>',
  wmat:'<svg viewBox="0 0 24 24" fill="none" stroke="#9ad17f" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/></svg>',
  core:'<svg viewBox="0 0 24 24" fill="none" stroke="#ff8ad1" stroke-width="2" stroke-linejoin="round"><path d="M12 2 21 7v10l-9 5-9-5V7z"/><path d="M12 8l4 2.5v4L12 17l-4-2.5v-4z"/></svg>',
  gems:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M9 3l3 18 3-18"/></svg>'};
function iconLib(k){return G.lib.find(l=>l.kind==='icon'&&l.key===k);}
function rIco(k){const l=iconLib(k), s=l&&imgSrc(l); return s?`<img class="ricon" src="${esc(s)}" alt="">`:(RICON[k]||RICON.gold);}
function rIcon(r){const k=['gems','transcMat','gearMat','core','wmat','exp','gold'].find(k=>r[k]); return rIco(k||'gold');}
function shopDay(){const p=P(); if(p.shop.day!==today()) p.shop={day:today(),buy:{}}; return p.shop;}
const SHOP_ITEMS=()=>[
  {id:'free',name:'오늘의 무료 보급',give:{gold:3000,exp:10},cost:{},limit:1,tag:'FREE'},
  {id:'exp',name:T('expMat')+' ×20',give:{exp:20},cost:{gold:4000},limit:10},
  {id:'wmat',name:T('wMat')+' ×10',give:{wmat:10},cost:{gold:6000},limit:5},
  {id:'core',name:T('core')+' ×5',give:{core:5},cost:{gold:15000},limit:3},
  {id:'gem',name:T('currency')+' ×60',give:{gems:60},cost:{gold:20000},limit:2,tag:'HOT'},
  {id:'exp2',name:T('expMat')+' ×5',give:{exp:5},cost:{gold:800},limit:30},
  {id:'gift1',name:'선물 꾸러미 (무작위 1개)',give:{gift:1},cost:{gold:3000},limit:5,tag:'NEW'},
  {id:'gift5',name:'선물 꾸러미 ×5',give:{gift:5},cost:{gold:13000},limit:1}];
const SHOP_SWAP=()=>[
  {id:'x1',give:{wmat:10},cost:{exp:30}},{id:'x2',give:{exp:20},cost:{wmat:10}},
  {id:'x3',give:{gold:3000},cost:{core:1}},{id:'x4',give:{gold:1500},cost:{exp:10}},{id:'x5',give:{core:1},cost:{wmat:25}}];
function costText(c){return Object.keys(c).length?rewardText(c):'무료';}
function canPay(c){const p=P();return Object.entries(c).every(([k,v])=>k==='gold'?p.gold>=v:k==='gems'?p.gems>=v:(p.mat[k]||0)>=v);}
function pay(c){const p=P();Object.entries(c).forEach(([k,v])=>{if(k==='gold')p.gold-=v;else if(k==='gems')p.gems-=v;else p.mat[k]-=v;});mark('prog');}
let SHOP_LINE='';
function shopkeeper(){const m=G.meta.shop||DEFAULT_META.shop;return {m,c:m.charId&&m.charId!=='__self'?charById(m.charId):null,self:m.charId==='__self'&&m.self&&imgSrc(m.self)?imgSrc(m.self):null};}
function shkSelf(){ const m=G.meta.shop; m.self=m.self||{id:'shk_self',kind:'char',name:'상점 주인',naiPrompt:'',img:null}; return m.self; }
function shopHTML(){
  const p=P(), sd=shopDay(), {m,c,self}=shopkeeper(); if(!SHOP_LINE) SHOP_LINE=rand(m.hello)||'어서 와요.';
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
const CASH_PACKS=[{id:'g1',gems:60,bonus:0},{id:'g2',gems:300,bonus:30},{id:'g3',gems:980,bonus:110},{id:'g4',gems:1980,bonus:260},{id:'g5',gems:3280,bonus:600},{id:'g6',gems:6480,bonus:1600}];
const CASH_PKGS=()=>[{id:'pk1',name:'성장 지원 패키지',give:{gold:50000,exp:200,wmat:100,core:50}},{id:'pk2',name:T('limit')+' 패키지',give:{core:40,gems:300}},{id:'pk3',name:'10연 '+T('gacha')+' 패키지',give:{gems:COST*10}}];
