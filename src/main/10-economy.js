/* ===== economy — 기능 class(Model · View · Ctl) — docs/redesign.md 2·3절, tools/reshape.mjs가 매핑대로 옮김 ===== */
class Economy {
    /* 쓰다듬기 반영(Model): 8초에 한 번 호감도 +3·미션 */
static petAffect(c){ const o=Characters.own(c.id); if(!o) return; const now=Date.now(); if(now-(o.petAt||0)>8000){ o.petAt=now; CoreCtl.addAff(c,3); Economy.bump('touch'); Core.mark('prog'); } }

    /* src/main/0510-actions/110-economy.js */
static shkaiPrompt({nm,c}){ return `${Core.pf('SHOP_LINES',{RULES,summary:G.world.summary,nm,name:c?` 이 인물은 ${c.name}이고 프로필은 다음과 같다: ${c.profile}`:'',player:System.T('player')})}JSON만 출력: {"hello":["인사 5개"],"buy":["구매 감사 5개"],"poor":["돈이 모자랄 때 3개"]}`; }

  static shkaiNmText({skName}){ return skName||'상점 주인'; }

  static voiceOf(c){ const k=c&&Characters.skinOf(c); return (k&&k.voiceId)||(c&&c.voiceId)||''; }

  static skinPrimaryPart(c,k){return c.useStanding===false?Characters.skinPart(k,'upper'):k;}

  static stamUse(n){ if(!System.stamOn()||!n) return true; const s=Core.progSlot('stam'); if(s.v<n){ EconomyView.openStam(n); return false; } s.v-=n; Core.mark('prog'); EconomyView.updStam(); return true; }

  static giveReward(r,evId){const p=P();if(r.gift)Characters.addGifts(r.gift);if(r.gems)p.gems+=r.gems;if(r.gold)p.gold+=r.gold;['exp','wmat','core','gearMat','transcMat'].forEach(k=>{if(r[k])p.mat[k]=(p.mat[k]||0)+r[k];});['res1','res2','res3','res4'].forEach(k=>{if(r[k]){const c=Core.progSlot('cres');c[k]=(c[k]||0)+r[k];}});if(r.token&&evId)p.tokens[evId]=(p.tokens[evId]||0)+r.token;Core.mark('prog');}

  static bump(k,n){const d=Core.progSlot('dm');d.cnt[k]=(d.cnt[k]||0)+(n||1);Core.mark('prog');}

  static passReward(l){return l%10===0?{gems:1000}:l%5===0?{core:10}:l%3===0?{wmat:15}:l%2===0?{exp:30}:{gold:8000};}

    /* 강화·돌파 전에 드는 재료와 결과를 보여 주고 확인받아요 */
static upPlan(c,k){ const o=Characters.own(c.id), p=P(); if(!o) return null;
    if(k==='enh'||k==='enhmax'){ const o2={...o}; let e=p.mat.exp,g=p.gold,ue=0,ug=0;
      while(o2.lv<levelCap(o)){ const need=Math.ceil((GGMCombat.levelExperience(o2.lv)-o2.exp)/100), gold=need*100; if(e<need||g<gold){ if(!ue){ ue=need; ug=gold; } break; } e-=need; g-=gold; ue+=need; ug+=gold; Core.gainExp(o2,need*100); if(k==='enh') break; }
      const capped=o.lv>=levelCap(o);
      return {title:k==='enh'?System.T('enhance'):System.T('enhance')+' MAX',from:'Lv.'+o.lv,to:'Lv.'+o2.lv,ok:!capped&&o2.lv>o.lv,note:capped?`레벨 상한이에요. ${o.lv>=70?'초월 승급':'승급'}하면 상한이 올라가요`:'',
        cost:[[System.T('expMat'),ue,p.mat.exp],[System.T('gold'),ug,p.gold]]}; }
    if(k==='lb'){ const cost=GGMCombat.limitBreakCost(o.dup), cap0=levelCap(o), cap1=(()=>{ const x={...o,dup:o.dup+1}; return levelCap(x); })(), f=(c.files||[]).find(x=>x.dup===o.dup+1);
      return {title:'승급',from:o.dup+'단계',to:Math.min(5,o.dup+1)+'단계',ok:o.dup<5&&p.mat.core>=cost,note:o.dup>=5?'최대 '+System.T('limit')+'예요':`레벨 상한 ${cap0} → ${cap1}${f?' · '+System.T('files')+' 공개':''}${o.dup===4?' · '+System.T('limit')+' CG 공개':''}`,cost:o.dup>=5?[]:[[System.T('core'),cost,p.mat.core]]}; }
    if(k==='transc'){ const n=Math.min(5,Math.max(0,o.transc||0)),cap=levelCap(o),cost=GGMCombat.limitBreakCost(n);return {title:'초월 승급',from:'상한 '+cap,to:'상한 '+Math.min(120,cap+10),ok:o.lv>=70&&n<5&&cap<120&&(p.mat.transcMat||0)>=cost,note:o.lv<70?'먼저 캐릭터를 70레벨까지 강화해 주세요.':cap>=120?'최대 레벨은 120이에요.':'단계마다 상한이 10 올라가요. 레벨은 경험치로 별도 강화해요.',cost:cap>=120?[]:[[System.T('transcMat'),cost,p.mat.transcMat||0]]}; }
    if(k==='wup'){ const {materials:wm,gold}=GGMCombat.equipmentUpgradeCost(o.wlv);
      return {title:(c.weapon.name||System.T('weapon'))+' 강화',from:o.wlv?o.wlv+'단계':'잠김',to:Math.min(5,o.wlv+1)+'단계',ok:o.wlv<5&&p.mat.wmat>=wm&&p.gold>=gold,note:o.wlv>=5?'최대 단계예요':'',cost:o.wlv>=5?[]:[[System.T('wMat'),wm,p.mat.wmat],[System.T('gold'),gold,p.gold]]}; }
    return null; }

  static enhance(c,max){
    const o=Characters.own(c.id), p=P(); let n=0;
    while(o.lv<levelCap(o)){ const need=Math.ceil((GGMCombat.levelExperience(o.lv)-o.exp)/100), gold=need*100; if(p.mat.exp<need||p.gold<gold) break; p.mat.exp-=need; p.gold-=gold; Core.gainExp(o,need*100); n++; if(!max) break; }
    if(!n){ CoreView.toast(o.lv>=levelCap(o)?`레벨 상한이에요. 70까지 승급하거나, 초월승급으로 최대 120까지 올릴 수 있어요`:`${System.T('expMat')}이나 ${System.T('gold')}가 부족해요`); return; }
    Economy.bump('enhance'); Core.mark('prog'); Art.sfx('강화'); CharactersView.linePop(c,rand(c.lvLines.length?c.lvLines:c.lines),'웃음');
  }

  static weaponUp(c){
    const o=Characters.own(c.id), p=P(); if(o.wlv>=5){CoreView.toast('최대 단계예요');return;}
    const {materials:wm,gold}=GGMCombat.equipmentUpgradeCost(o.wlv);
    if(p.mat.wmat<wm||p.gold<gold){CoreView.toast(`${System.T('wMat')} ${wm}개와 ${System.T('gold')} ${nf(gold)}가 필요해요`);return;}
    p.mat.wmat-=wm; p.gold-=gold; o.wlv++; Core.mark('prog'); Art.sfx('강화'); CoreView.toast(`${c.weapon.name||System.T('weapon')} ${o.wlv}단계`);
  }

  static costText(c){return Object.keys(c).length?Core.rewardText(c):'무료';}

  static canPay(c){const p=P();return Object.entries(c).every(([k,v])=>k==='gold'?p.gold>=v:k==='gems'?p.gems>=v:(p.mat[k]||0)>=v);}

  static pay(c){const p=P();Object.entries(c).forEach(([k,v])=>{if(k==='gold')p.gold-=v;else if(k==='gems')p.gems-=v;else p.mat[k]-=v;});Core.mark('prog');}

  static shopkeeper(){const m=G.meta.shop||DEFAULT_META.shop;return {m,c:m.charId&&m.charId!=='__self'?charById(m.charId):null,self:m.charId==='__self'&&m.self&&Characters.imgSrc(m.self)?Characters.imgSrc(m.self):null};}

  static shkSelf(){ const m=G.meta.shop; m.self=m.self||{id:'shk_self',kind:'char',name:'상점 주인',naiPrompt:'',img:null}; return m.self; }

    /* 우편 하나 지우기 — 우편 칸은 이 모듈이 맡음(액션 처리기가 칸을 직접 바꿔 끼우지 않게) */
static mailRemove(x){ P().mail=Core.progRead('mail').filter(q=>q!==x); }

    /* 우편 열기(읽음 표시) · 다 받은·지난 우편 정리(지운 수) */
static mailOpen(id){ const x=Core.progSlot('mail').find(q=>q.id===id); if(x){ x.read=true; Core.mark('prog'); } return x; }

  static mailClean(){ const p=P(), n0=Core.progRead('mail').length; p.mail=Core.progRead('mail').filter(x=>!mailDone(x)); Core.mark('prog'); return n0-p.mail.length; }

  static sendMail(m){ let box=Core.progSlot('mail'); const now=Date.now(); if(m.kind){ const p0=P(); p0.mail=box=box.filter(x=>x.kind!==m.kind); } box.unshift({id:'m'+uid(),kind:m.kind||'',from:m.from||'운영팀',title:m.title||'우편',body:m.body||'',reward:m.reward||{},at:now,exp:m.days===0?0:now+(m.days||30)*864e5,got:false,read:false}); if(box.length>100) box.length=100; Core.mark('prog'); }

  static mailLive(x){return !x.got&&(!x.exp||Date.now()<x.exp);}

  static mailCount(){return Core.progRead('mail').filter(x=>Economy.mailLive(x)&&Object.keys(x.reward||{}).length).length;}

  static mailTick(){
    const p=P();
    if(!p.mailInit){ p.mailInit=true; p.mailBuild=APP_BUILD; Economy.sendMail({from:'운영팀',title:`${G.meta.title}에 오신 걸 환영해요`,body:`${System.T('player')}님, 환영해요!\n첫 ${System.T('gacha')}에 보태라고 작은 선물을 보내요. 즐거운 시간 되세요.`,reward:{gems:1600,gold:20000},days:0}); return; }
    if(p.mailBuild!==APP_BUILD){ const notes=(()=>{try{return JSON.parse(appStorage.getItem('ggm-upd-notes')||'[]');}catch(e){return [];}})();
      p.mailBuild=APP_BUILD; Core.mark('prog'); if(notes.length) Economy.sendMail({kind:'update',from:'운영팀',title:`업데이트 안내 (${APP_BUILD})`,body:`앱이 새 버전으로 업데이트됐어요.\n\n바뀐 점\n· ${notes.join('\n· ')}`,days:30}); try{appStorage.removeItem('ggm-upd-notes');}catch(e){} }
  }

  static claimMail(x){ if(!x||!Economy.mailLive(x)) return null; x.got=true; x.read=true; Economy.giveReward(x.reward||{}); return x.reward||{}; }

  static async handleEconomyAction(a,t,id,p,e){
    switch(a){
  case 'daily': if(p.daily!==today()){p.daily=today(); const dr=Characters.rateR({gems:120,gold:5000,exp:10,gift:2}); Economy.giveReward(dr);Challenge.render();Art.sfx('확인');CoreView.toast(`일일 보급: ${Core.rewardText(dr)}`);} break;
  case 'shkdraw': { const m=G.meta.shop, o=Economy.shkSelf(); o.naiPrompt=stripMinor(Core.stripAge($('#sk_prompt').value.trim())); CoreView.naiBlocksSave(o,'naiPrompt','sk_prompt');o.name=$('#sk_name').value.trim()||m.name; if(!o.naiPrompt){ CoreView.toast('외형 프롬프트를 먼저 적어 주세요'); break; } if(!Core.imgReady()){ CoreView.toast(Core.imgNeed()); break; }
        const done=CoreView.busy(t,'그리는 중…'); try{ const bn=await Core.naiDrawItem({k:'char',o,c:o}); await Art.storeImage(o,bn,''); m.charId='__self'; Core.mark('meta'); SHOP_LINE=''; EconomyView.shopKeeperShow(o); Challenge.render(); CoreView.toast('상점 주인 그림을 그렸어요'); }catch(e){ CoreView.toast(Core.naiErr(e)); } finally{ done(); CoreView.say(t,'다시 그리기'); } break; }
  case 'sparkopen': AcquireView.openSpark(id); break;
  case 'sparkgo': { const bn=G.banners.find(x=>x.id===t.dataset.b), c=charById(id); if(!bn||!c||!Acquire.castOk(c)) break; p.spark=p.spark||{}; if((p.spark[bn.id]||0)<SPARK){CoreView.toast('포인트가 모자라요');break;}
        if(!(await appConfirm(`${c.name}을(를) ${SPARK}포인트로 데려올까요?`))) break; p.spark[bn.id]-=SPARK; let isNew=false;
        if(p.owned[c.id]){ const o=p.owned[c.id]; if(o.dup<5){o.dup++; if(o.dup>=5)o.cgNew=true;} else { p.mat.core+=10; } } else { p.owned[c.id]={levelCapVersion:1,transc:0,growthCostVersion:1,lv:1,exp:0,dup:0,aff:0,seen:[],wlv:0,skin:''}; isNew=true; if(p.squad.length<4)p.squad.push(c.id); }
        Core.mark('prog'); CoreView.closeModal(); Challenge.render(); playGacha([{c,isNew,refund:0}]); break; }
  case 'pull': Acquire.pull(+t.dataset.n); break;
  case 'puexist': if(System.playMode()) break; CharactersView.openPickExisting(id||''); break;
  case 'puxpick': { CoreView.puxRead(); const a=PUX.ids, i=a.indexOf(id); if(i>=0) a.splice(i,1); else if(a.length<3) a.push(id); else CoreView.toast('최대 3명까지 고를 수 있어요'); CharactersView.openPickExisting(); break; }
  case 'puxgo': { if(System.playMode()) break; const r=Acquire.puxGo(); if(!r) break; CoreView.closeModal(); PUX=null; tab='contract'; Challenge.render(); CoreView.toast(`${r.rerun?'복각 픽업':'픽업'} 「${r.b.name}」을(를) 열었어요`); if(r.story) Acquire.puStoryBg(r.c,false,r.b); break; }
  case 'pustoryretry': { const c=charById(id); if(c){ CoreView.toast('픽업 스토리를 다시 만들어요'); Acquire.puStoryBg(c,false,G.banners.find(x=>x.id===t.dataset.b)); } break; }
  case 'bsel': P().curBanner=id; Core.mark('prog'); if(t.dataset.go) tab='contract'; Challenge.render(); break;
  case 'bnew': AcquireView.openBanner(null); break;
  case 'bedit': AcquireView.openBanner(id); break;
  case 'dispset': DSEL={id,ids:[]}; ExpeditionView.openDispSel(id); break;
  case 'dispall': { const now=Date.now(), done=Expedition.dispList().filter(d=>{ const a=P().disp[d.id]; return a&&now>=a.start+a.hours*3600e3; }); if(!done.length){ CoreView.toast('완료된 파견이 없어요'); break; } const tot={}; done.forEach(d=>{ const r=Expedition.dispClaim(d); Object.entries(r).forEach(([k,v])=>{ if(typeof v==='number') tot[k]=(tot[k]||0)+v; }); }); Core.mark('prog'); Art.sfx('확인'); CoreView.toast(`파견 ${done.length}곳 완료: ${Core.rewardText(tot)}`); Challenge.render(); break; }
  case 'dispredo': { const busy=busyIds(); let n=0; Expedition.dispList().forEach(d=>{ if(P().disp[d.id]) return; const pick=G.chars.filter(c=>Characters.own(c.id)&&!busy.has(c.id)).sort((a,b)=>Characters.own(a.id).lv-Characters.own(b.id).lv||charPower(a)-charPower(b)).slice(0,d.need); if(pick.length<d.need) return; pick.forEach(c=>busy.add(c.id)); P().disp[d.id]={chars:pick.map(c=>c.id),start:Date.now(),hours:d.hours}; Economy.bump('dispatch'); n++; }); Core.mark('prog'); Challenge.render(); CoreView.toast(n?`${n}곳에 파견을 보냈어요`:'보낼 곳이나 '+System.T('crew')+'이(가) 없어요'); break; }
  case 'dispgo': { const d=Expedition.dispList().find(x=>x.id===DSEL.id); if(!d||DSEL.ids.length!==d.need){ CoreView.toast(`${d?d.need:''}명을 골라 주세요`); break; } P().disp[d.id]={chars:[...DSEL.ids],start:Date.now(),hours:d.hours}; Economy.bump('dispatch'); Core.mark('prog'); CoreView.closeModal(); Challenge.render(); CoreView.toast(`${d.name} 출발`); break; }
  case 'dispget': { const d=Expedition.dispList().find(x=>x.id===id); if(!d||!P().disp[id]) break; const dr=Expedition.dispClaim(d); Core.mark('prog'); Art.sfx('확인'); CoreView.toast(`${d.name} 완료: ${Core.rewardText(dr)}`); Challenge.render(); break; }
  case 'dispcancel': if((await appConfirm('파견을 취소할까요? 보상은 받지 못해요.'))){ delete P().disp[id]; Core.mark('prog'); Challenge.render(); } break;
  case 'passreset': if((await appConfirm('새 시즌을 시작할까요? 패스 단계가 처음으로 돌아가요.'))){ P().pass={xp:0,got:[]}; Core.mark('prog'); Challenge.render(); } break;
  case 'shopbuy': { const it=SHOP_ITEMS().find(x=>x.id===id), sd=Core.progSlot('shop'), m=G.meta.shop; if(!it) break;
        if((sd.buy[it.id]||0)>=it.limit){CoreView.toast('오늘은 매진이에요');break;}
        if(!Economy.canPay(it.cost)){ SHOP_LINE=rand(m.poor)||'조금 모자라요.'; Challenge.render(); break; }
        Economy.pay(it.cost); sd.buy[it.id]=(sd.buy[it.id]||0)+1; Economy.giveReward(it.give); SHOP_LINE=rand(m.buy)||'고마워요!'; Art.sfx('확인'); Challenge.render(); CoreView.toast(Core.rewardText(it.give)+' 획득'); break; }
  case 'shopswap': { const x=SHOP_SWAP().find(q=>q.id===id); if(!x) break; const n=+(t.dataset.n||1), cost=Object.fromEntries(Object.entries(x.cost).map(([k,v])=>[k,v*n])), give=Object.fromEntries(Object.entries(x.give).map(([k,v])=>[k,v*n]));
        if(!Economy.canPay(cost)){ SHOP_LINE=rand(G.meta.shop.poor)||'조금 모자라요.'; Challenge.render(); break; } Economy.pay(cost); Economy.giveReward(give); SHOP_LINE=rand(G.meta.shop.buy)||'교환 완료!'; Challenge.render(); CoreView.toast(Core.rewardText(give)+' 획득'); break; }
  case 'shkedit': EconomyView.openShk(); break;
  case 'shksave': { const m=G.meta.shop; m.name=$('#sk_name').value.trim()||'상점 주인'; m.charId=$('#sk_char').value; if($('#sk_prompt'))CoreView.naiBlocksSave(Economy.shkSelf(),'naiPrompt','sk_prompt'); ['hello','buy','poor'].forEach(k=>{const v=lines($('#sk_'+k).value); if(v.length) m[k]=v;}); Core.mark('meta'); SHOP_LINE=''; CoreView.closeModal(); Challenge.render(); CoreView.toast('상점 주인을 저장했어요'); break; }
  case 'shkai': { const c=$('#sk_char').value?charById($('#sk_char').value):null, nm=Economy.shkaiNmText({skName:$('#sk_name').value.trim()});
        const r=await Core.aiJSON(Economy.shkaiPrompt({nm,c}),CoreView.uiProg(t));
        if(r){ ['hello','buy','poor'].forEach(k=>{ if(Array.isArray(r[k])&&r[k].length) $('#sk_'+k).value=r[k].map(String).join('\n'); }); CoreView.toast('대사를 채웠어요. 저장을 눌러 주세요'); } break; }
  case 'cashbuy': { const k=CASH_PACKS.find(x=>x.id===id); if(!k) break; const first=!p.cash.first[k.id], n=k.gems+(first?k.gems:k.bonus); p.cash.first[k.id]=true; p.cash.total+=n; Economy.giveReward({gems:n}); Core.mark('prog'); Challenge.render(); CoreView.buyFx('+'+nf(n),`◆ ${System.T('currency')}${first?' · 첫 구매 2배':''}`); break; }
  case 'cashmonth': { const mo=p.cash.month, base=Math.max(Date.now(),mo.until||0); mo.until=base+30*864e5; Economy.giveReward({gems:300}); Core.mark('prog'); Challenge.render(); CoreView.buyFx('+300','월간 보급 카드 · 30일'); EconomyCtl.cashTick(); Challenge.render(); break; }
  case 'cashpkg': { const k=[...CASH_PKGS(),...CASH_RES()].find(x=>x.id===id); if(!k) break; Economy.giveReward(k.give); Challenge.render(); CoreView.buyFx(k.name,Core.rewardText(k.give)); break; }
    }
  }
}

class EconomyView {
    /* 이벤트 화면 진행자를 눌렀을 때 반응(View): 물결 · 몸짓 · 표정 · 대사 칸 */
static evsPokeShow(t,c,l,zone,lv,x,y){ CoreView.ripple(x,y,lv>=7); CoreView.charReact(t.querySelector('.art'),lv,zone); CoreView.faceSwap(c,t.querySelector('.art'),Characters.touchFace(c,zone,lv)); const pe=$('#evsLine'); if(pe){ pe.textContent=sub(l); pe.classList.remove('pop'); void pe.offsetWidth; pe.classList.add('pop'); } }

  static updStam(){ const el=document.getElementById('stamBox'); if(!el) return; el.hidden=!System.stamOn(); if(!System.stamOn()) return; const s=Core.progRead('stam'); const v=document.getElementById('stamV'); if(v) v.textContent=s.v+'/'+STAM_MAX; }

  static openStam(need){ const s=Core.progRead('stam'), left=s.v>=STAM_MAX?0:Math.ceil((STAM_MS-(Date.now()-s.at))/60000), full=s.v>=STAM_MAX?0:Math.ceil(((STAM_MAX-s.v-1)*STAM_MS+(STAM_MS-(Date.now()-s.at)))/60000);
    CoreView.openModal(`${head('⚡ 행동력',`<span class="muted">${s.v} / ${STAM_MAX}</span>`)}${need?`<p style="margin:0 0 8px">행동력이 모자라요. 필요 <b>${need}</b> · 지금 <b>${s.v}</b></p>`:''}
    <p class="muted" style="margin:0 0 10px;font-size:.85rem">5분마다 1씩 차요.${s.v<STAM_MAX?` 다음 1 회복까지 ${left}분 · 가득 차기까지 약 ${full}분`:' 지금 가득 찼어요.'}<br>메인·이벤트 전투 10, 재료 던전 8을 써요.</p>
    <div class="row"><button class="btn" data-act="stamfill" ${P().gems>=STAM_FILL[0]?'':'disabled'}>${EconomyView.rIco('gems')} ${STAM_FILL[0]}로 ⚡${STAM_FILL[1]} 회복</button><button class="btn ghost" data-act="close">닫기</button></div>`); }

  static hsDecorate(){ document.querySelectorAll('.bsel,.cx-cats').forEach(el=>{
      if(!el.parentElement.classList.contains('hs-wrap')){ const w=document.createElement('div'); w.className='hs-wrap'; el.parentNode.insertBefore(w,el); w.appendChild(el); w.insertAdjacentHTML('beforeend','<button class="hs-ar l" data-hs="-1" aria-label="왼쪽으로">‹</button><button class="hs-ar r" data-hs="1" aria-label="오른쪽으로">›</button>'); el.addEventListener('scroll',()=>EconomyView.hsUpd(w),{passive:true}); }
      const on=el.querySelector('.on'); if(on&&!el.__did){ el.__did=1; const l=on.offsetLeft-el.clientWidth/2+on.offsetWidth/2; el.scrollLeft=Math.max(0,l); } EconomyView.hsUpd(el.parentElement); }); }

  static hsUpd(w){ const el=w.firstElementChild; if(!el) return; const max=el.scrollWidth-el.clientWidth-2; w.classList.toggle('can-l',el.scrollLeft>2); w.classList.toggle('can-r',el.scrollLeft<max); }

  static fitLobby(){ try{ EconomyView.hsDecorate(); }catch(e){} const el=document.querySelector('.lobby'); if(!el) return; const tb=document.querySelector('.tabs'); const top=el.getBoundingClientRect().top+(document.scrollingElement?document.scrollingElement.scrollTop:0);
    const tabsH=tb?tb.getBoundingClientRect().height:0; const h=Math.max(document.body.classList.contains('wide')?200:360,Math.floor(innerHeight-top-tabsH)); el.style.height=h+'px'; el.classList.toggle('short',h<600); el.classList.toggle('narrow',el.clientWidth<370); }

  static passHTML(){
    const p=P(), d=Core.progRead('dm'), lv=passLv(), xp=p.pass.xp;
    return `${pageHead(System.T('pass'),'SEASON PASS','lobby')}
  <div class="panel"><div style="display:flex;justify-content:space-between;align-items:baseline"><h3>Lv.${lv} / ${PASS_MAX}</h3><span class="muted">${nf(xp%PASS_PER)} / ${PASS_PER} XP</span></div><div class="bar"><i style="width:${lv>=PASS_MAX?100:(xp%PASS_PER)/PASS_PER*100}%"></i></div></div>
  <div class="row" style="margin:8px 0"><button class="btn sm" data-act="pgetall">모두 받기 <small>(임무·패스 보상)</small></button></div>
  <h3 class="sec">오늘의 임무</h3>
  ${MISSIONS.map(m=>{const c=Math.min(m.goal,d.cnt[m.k]||0),ok=c>=m.goal,got=d.got[m.k];return `<div class="ep"><span class="t"><b>${m.name}</b><span class="muted">${c}/${m.goal} · ${m.xp} XP</span></span><button class="btn sm ${got?'ghost':''}" data-act="mget" data-k="${m.k}" ${ok&&!got?'':'disabled'}>${got?'완료':'받기'}</button></div>`;}).join('')}
  <h3 class="sec">패스 보상</h3>
  <div class="passgrid">${Array.from({length:PASS_MAX},(_,i)=>i+1).map(l=>{const got=p.pass.got.includes(l),ok=l<=lv;return `<button class="pv ${got?'got':ok?'ok':''}" data-act="pget" data-lv="${l}" ${ok&&!got?'':'disabled'}><i>${l}</i><span>${Core.rewardText(Economy.passReward(l))}</span></button>`;}).join('')}</div>
  <div class="row" style="margin-top:12px"><button class="btn sm ghost" data-act="passreset">새 시즌 시작</button></div>`;
  }

  static skinPkgHTML(){ const a=Characters.skinShopList(), so=P().skinOwn||{};
    return `<h3 class="sec">${esc(System.T('skin'))} 패키지</h3><div class="row" style="margin:0 0 6px"><span class="muted" style="flex:1;font-size:.8rem">${P().live.on.season?'시즌이 바뀔 때마다':esc(LiveOps.cycLabel('rotate'))+'마다'} ${esc(System.T('crew'))} 한 명의 새 ${esc(System.T('skin'))}이 자동으로 나와요 (설정 → 시즌 운영에서 끄기)</span><button class="btn sm ghost" data-act="skinnew">✦ 지금 하나 만들기</button></div>${a.length?'':'<p class="muted" style="font-size:.8rem">아직 판매 중인 '+esc(System.T('skin'))+'이 없어요.</p>'}${a.map(({c,k},i)=>{ const got=!!so[k.id], src=Core.skinPreviewSrc(c,k);
      return `<div class="cs-card pkg skinpkg">${i===0&&!got?'<span class="rib" style="position:absolute;left:8px;top:6px;background:#ff3d7f;padding:1px 8px;font-size:.62rem;font-weight:700">NEW</span>':''}<span class="wthumb" style="width:64px;height:84px;overflow:hidden">${src?`<img src="${esc(src)}" alt="" style="width:100%;height:100%;object-fit:cover;object-position:50% 12%">`:''}</span><div class="t"><b>${esc(c.name)} 「${esc(k.name)}」</b><span class="muted" style="color:#e9d9b0">${esc(k.desc||System.T('skin'))}${Characters.imgSrc(k)?'':' · 그림은 '+System.T('skin')+' 편집에서 그릴 수 있어요'}</span></div><span style="display:flex;flex-direction:column;gap:4px"><button class="btn sm" data-act="skinbuy" data-id="${k.id}" ${got?'disabled':''}>${got?'보유':EconomyView.rIco('gems')+nf(k.price||SKIN_PRICE)}</button>${got?'':`<button class="btn sm ghost" data-act="skinpkgdel" data-id="${k.id}">지우기</button>`}</span></div>`; }).join('')}`; }

  static skinSelRead(){ const o={}; document.querySelectorAll('[data-skp]').forEach(i=>{ o[i.dataset.skp]=i.checked?1:0; }); return o; }

  static openSkinBuy(id){ const f=Characters.skinShopList().find(x=>x.k.id===id); if(!f) return; const {c,k}=f, src=Core.skinPreviewSrc(c,k), pr=k.price||SKIN_PRICE, got=!!(P().skinOwn||{})[k.id], sel=SKBUYSEL||(SKBUYSEL={upper:1,illust:1,lbcg:1,faces:0,lines:SAMPLE?1:0});
    CoreView.openModal(`${head(`${esc(c.name)} 「${esc(k.name)}」`,`<span class="muted">${esc(k.desc||System.T('skin'))}</span>`)}
    ${src?`<div class="skp-img"><img src="${esc(src)}" alt="${esc(k.name)}"></div><p class="muted" style="text-align:center;font-size:.78rem;margin:4px 0 0">그림을 누르면 크게 봐요</p>`:`<p class="muted">아직 이 스킨의 그림이 없어요. 사기 전에 그려서 확인해 보세요.</p>`}
    ${c.useStanding===false&&!Core.skinDisplayReady(c,k)?'<p class="muted">스탠딩 사용이 꺼져 있어 이 스킨의 상반신이 필요해요. 아래에서 상반신을 그린 뒤 구매할 수 있어요.</p>':''}
    ${k.line?`<p style="margin:8px 0 0;text-align:center">“${esc(sub(k.line))}”</p>`:''}
    ${got||System.playMode()?'':`<h3 class="sec">사면 함께 만들 것</h3>${CoreView.skinSelHTML(sel,c,k)}<p class="muted" style="font-size:.78rem">사면 뒤에서 차례로 그려요. 표정은 얼굴 범위를 칠한 뒤 전신·상반신 모두 얼굴만 다시 그려요.</p>`}
    <div class="row" style="margin-top:10px">${got?'<button class="btn" disabled>보유 중</button>':`<button class="btn" data-act="skbbuy" data-id="${k.id}" ${Core.skinDisplayReady(c,k)?'':'disabled'}>${EconomyView.rIco('gems')}${nf(pr)} 구매</button>`}${Core.imgReady()&&(!System.playMode()||!Core.skinDisplayReady(c,k))?`<button class="btn ghost" data-act="skbdraw" data-id="${k.id}">${Core.skinDisplayReady(c,k)?'다시 그리기':c.useStanding===false?'상반신 그려 보기':'스탠딩 그려 보기'}</button>`:''}${got||System.playMode()?'':`<button class="btn ghost" data-act="skinpkgdel" data-id="${k.id}">패키지 지우기</button>`}<button class="btn ghost" data-act="close">닫기</button></div>`); }

    /* 그리기(View): 지금 탭 화면·머리 재화·탭 표시 */
static renderView(){ const scrollKey=Story.uiPageScrollKey(),viewBefore=$('#view'),viewState=UI_PAGE_SCROLL_ROUTE===scrollKey&&UI_PAGE_SCROLL_GAME===G?PlayerView.uiScrollCapture(viewBefore):null; setTimeout(()=>{ try{ EconomyView.fitLobby(); }catch(e){} },0); document.body.classList.toggle('play',System.playMode()); if(System.playMode()&&PLAY_HIDE_ST.includes(STTAB)) STTAB='';
    EconomyView.updStam(); $('#gems').textContent=nf(P().gems); try{ $('#ic_gold').innerHTML=EconomyView.rIco('gold'); $('#ic_gems').innerHTML=EconomyView.rIco('gems'); }catch(e){} $('#gold').textContent=nf(P().gold);
    $('#tb_ops').textContent=System.T('ops'); $('#tb_gacha').textContent=System.T('gacha'); $('#tb_crew').textContent=System.T('crew');
    const navTab={evshop:'lobby',abyss:'lobby',challenge:'lobby',codex:'lobby',notice:'lobby',event:'lobby',evd:'lobby',farm:'lobby',disp:'lobby',sched:'lobby',construct:'contract',pass:'lobby',shop:'lobby',cash:'lobby'}[tab]||tab;
    if(tab!=='lobby') document.body.classList.remove('lb-hidden');
    document.querySelectorAll('.tab').forEach(b=>b.setAttribute('aria-current',b.dataset.tab===navTab?'true':'false'));
    const F={sched:LiveOpsView.schedHTML,evshop:EconomyView.evShopHTML,abyss:ChallengeView.abyssHTML,challenge:ChallengeView.challengeHTML,codex:WorldView.codexHTML,shop:EconomyView.shopHTML,cash:EconomyView.cashHTML,lobby:CharactersView.lobbyHTML,ops:StoryView.opsHTML,contract:()=>AcquireView.conEntryHTML()+contractHTML(),construct:AcquireView.constructHTML,crew:CharactersView.crewHTML,studio:SystemView.studioHTML,event:StoryView.eventsHTML,evd:StoryView.eventDetailHTML,notice:LiveOpsView.noticeHTML,farm:CharactersView.farmHTML,disp:ExpeditionView.dispPageHTML,pass:EconomyView.passHTML};
    $('#view').innerHTML=(F[tab]||CharactersView.lobbyHTML)();
    document.body.classList.toggle('on-lobby',tab==='lobby'); document.body.classList.toggle('abyss-full',tab==='abyss');
    if(typeof SystemView.applyDesk==='function') SystemView.applyDesk();
    if(viewState)PlayerView.uiScrollRestore($('#view'),viewState);else $('#view').scrollTop=0;UI_PAGE_SCROLL_ROUTE=scrollKey;UI_PAGE_SCROLL_GAME=G;
  }

  static evShopHTML(){
    const ev=G.events.find(e=>e.id===P().curEvent); if(!ev){ tab='event'; return StoryView.eventsHTML(); }
    const tok=P().tokens[ev.id]||0, buy=P().shopBuy[ev.id]||{}, host=Acquire.evHost(ev);
    if(EVS_FOR!==ev.id){ EVS_FOR=ev.id; const pool=host?[...(host.lines||[]),...(host.dupLines||[])].filter(Boolean):[]; EVS_LINE=pool.length?rand(pool):`어서 와요! 「${ev.title}」 기념 교환소예요. ${ev.token}(으)로 마음에 드는 걸 골라 가요.`; }
    const sil='<div class="sil"><svg viewBox="0 0 100 120" fill="currentColor"><circle cx="50" cy="34" r="20"/><path d="M14 120c2-34 16-52 36-52s34 18 36 52z"/></svg></div>';
    return `${pageHead(ev.title+' 교환소','EVENT EXCHANGE','evd')}
  <div class="evs-wrap"><div class="evs-host"><div class="evs-hbg" style="${ArtView.bgStyle(ev.bg||'회색구 골목')}"></div><div class="evs-hart" ${host?`data-act="evspoke" data-id="${host.id}"`:''}>${host?CoreView.art(host,'',{upper:true}):sil}</div>
    <div class="evs-talk"><b>${esc(host?host.name:'교환소')}</b><p id="evsLine">${esc(sub(EVS_LINE))}</p></div></div>
  <div class="evs-shelf"><div class="wallet"><span>🎟 ${esc(ev.token)} <b>${nf(tok)}</b></span></div>
  <div class="shop-grid evs-grid">${(ev.shop||[]).map(it=>{ const left=it.limit-(buy[it.id]||0), c=it.type==='char'?charById(it.ref):null, out=left<=0, poor=tok<it.price;
      const name=c?`${c.name} ${Characters.own(c.id)?System.T('limit')+' +1':'획득'}`:Core.rewardText({[it.type]:it.amt});
      return `<div class="si ${out?'soldout':''} ${c?'char':''}">${c?'<span class="tag">한정</span>':''}<span class="ri">${c?`<i class="evs-c">${CoreView.art(c)}</i>`:EconomyView.rIcon({[it.type]:1})}</span><b>${esc(name)}</b><small>${esc(ev.token)} ${nf(it.price)} · 남은 ${Math.max(0,left)}/${it.limit}</small><button class="btn ${c?'':'ghost'}" data-act="evbuy" data-id="${it.id}" ${out||poor?'disabled':''}>${out?'매진':poor?'부족':'교환'}</button></div>`; }).join('')||'<p class="muted">상품이 없어요.</p>'}</div></div></div>`;
  }

  static rIco(k){const l=Art.iconLib(k), s=l&&Characters.imgSrc(l); return s?`<img class="ricon" src="${esc(s)}" alt="">`:(RICON[k]||RICON.gold);}

  static rIcon(r){const k=['gems','transcMat','gearMat','core','wmat','exp','gold'].find(k=>r[k]); return EconomyView.rIco(k||'gold');}

  static shopHTML(){
    const p=P(), sd=Core.progRead('shop'), {m,c,self}=Economy.shopkeeper(); if(!SHOP_LINE) SHOP_LINE=rand(m.hello)||'어서 와요.';
    const sil='<div class="sil"><svg viewBox="0 0 100 120" fill="currentColor"><circle cx="50" cy="34" r="20"/><path d="M14 120c2-34 16-52 36-52s34 18 36 52z"/></svg></div>';
    return `${pageHead('상점','SUPPLY SHOP','lobby')}
  <div class="shk fr-upper"><div class="shk-bg" style="${ArtView.bgStyle(P().lobbyBg||'새벽등대 사무소')}"></div>
    <div class="shk-art">${self?`<img class="art" src="${esc(self)}" alt="${esc(m.name||'')}">`:c?CoreView.art(c,'',{upper:true}):sil}</div>
    <div class="shk-talk"><b>${esc(m.name||'상점 주인')}</b><p id="shkLine">${esc(sub(SHOP_LINE))}</p></div>
    <button class="btn sm ghost shk-edit" data-act="shkedit">주인 설정</button></div>
  <div class="wallet"><span>${EconomyView.rIco('gold')}${nf(p.gold)}</span><span>${EconomyView.rIco('exp')}${nf(p.mat.exp)}</span><span>${EconomyView.rIco('wmat')}${nf(p.mat.wmat)}</span><span>${EconomyView.rIco('core')}${nf(p.mat.core)}</span><span title="${esc(System.T('gearMat'))}">${EconomyView.rIco('gearMat')}${nf(p.mat.gearMat||0)}</span><span title="${esc(System.T('transcMat'))}">${EconomyView.rIco('transcMat')}${nf(p.mat.transcMat||0)}</span></div>
  <h3 class="sec">오늘의 상품 <span class="muted" style="font-size:.75rem">매일 초기화</span></h3>
  <div class="shop-grid">${SHOP_ITEMS().map(it=>{const n=sd.buy[it.id]||0,left=it.limit-n,out=left<=0;
      return `<div class="si ${out?'soldout':''}">${it.tag?`<span class="tag">${it.tag}</span>`:''}<span class="ri">${EconomyView.rIcon(it.give)}</span><b>${esc(it.name)}</b><small>${Economy.costText(it.cost)} · 남은 ${Math.max(0,left)}/${it.limit}</small><button class="btn ${it.tag==='FREE'?'':'ghost'}" data-act="shopbuy" data-id="${it.id}" ${out?'disabled':''}>${out?'매진':it.tag==='FREE'?'받기':'구매'}</button></div>`;}).join('')}</div>
  <h3 class="sec">재료 교환</h3>
  ${SHOP_SWAP().map(x=>`<div class="swap"><span class="t">${Economy.costText(x.cost)} → <b>${Economy.costText(x.give)}</b></span><button class="btn sm" data-act="shopswap" data-id="${x.id}" ${Economy.canPay(x.cost)?'':'disabled'}>교환</button><button class="btn sm ghost" data-act="shopswap" data-id="${x.id}" data-n="10" ${Economy.canPay(Object.fromEntries(Object.entries(x.cost).map(([k,v])=>[k,v*10])))?'':'disabled'}>×10</button></div>`).join('')}
  <div class="row" style="margin-top:12px"><button class="btn ghost block" data-act="go" data-to="cash">◆ ${esc(System.T('currency'))}이(가) 필요하면 캐시 상점으로</button></div>`;
  }

  static openShk(){
    const m=G.meta.shop;
    CoreView.openModal(`${head('상점 주인')}
    <label class="f" for="sk_name">이름</label><input class="in" id="sk_name" value="${esc(m.name)}" maxlength="20">
    <label class="f" for="sk_char">모습</label><select class="in" id="sk_char" onchange="document.getElementById('skSelf').hidden=this.value!=='__self'"><option value="">실루엣</option><option value="__self" ${m.charId==='__self'?'selected':''}>직접 만든 모습 (상인 전용 그림)</option>${G.chars.map(c=>`<option value="${c.id}" ${m.charId===c.id?'selected':''}>${esc(c.name)} 상반신 빌리기</option>`).join('')}</select>
    <div class="optbox" id="skSelf" style="margin-top:8px" ${m.charId==='__self'?'':'hidden'}><div style="display:flex;gap:10px;align-items:flex-start"><div class="sk-prev">${m.self&&Characters.imgSrc(m.self)?`<img src="${esc(Characters.imgSrc(m.self))}" alt="">`:'<span>그림 없음</span>'}</div><div style="flex:1;min-width:0">
      <label class="f" for="sk_prompt">외형 프롬프트 (그림 AI 영어 태그)</label><textarea class="in" id="sk_prompt" style="min-height:70px" placeholder="1girl, solo, merchant, apron, smile, holding ledger">${esc((m.self&&m.self.naiPrompt)||'')}</textarea>
      <div class="row" style="margin-top:6px">${Core.imgReady()?`<button class="btn sm" data-act="shkdraw">${m.self&&Characters.imgSrc(m.self)?'다시 그리기':'그리기'}</button>`:''}<button class="btn sm ghost" data-act="upload" data-k="shk">그림 올리기</button>${m.self&&m.self.img?XBTN('shk',''):''}</div></div></div></div>
    <label class="f" for="sk_hello">인사 대사 (한 줄에 하나)</label><textarea class="in" id="sk_hello">${esc(m.hello.join('\n'))}</textarea>
    <label class="f" for="sk_buy">구매했을 때</label><textarea class="in" id="sk_buy">${esc(m.buy.join('\n'))}</textarea>
    <label class="f" for="sk_poor">재화가 모자랄 때</label><textarea class="in" id="sk_poor">${esc(m.poor.join('\n'))}</textarea>
    <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="shkai">AI로 대사 쓰기</button></div>
    <div class="row" style="margin-top:14px"><button class="btn" data-act="shksave">저장</button></div>`);
  }

    /* 캐시 상점 화면: 젬 그림·월간 카드 지급·화면·구매 연출 */
static gemArt(t){const n=Math.min(6,t);let g='';for(let i=0;i<n;i++){const x=12+((i*37)%56),y=40-((i*23)%30),s=1-i*0.06;g+=`<g transform="translate(${x} ${y}) scale(${s.toFixed(2)})"><path d="M6 0h20l8 10-18 22L-2 10z" fill="#5fc8ff" stroke="#e8fbff" stroke-width="1.5"/><path d="M-2 10h36M13 0l3 32 3-32" stroke="#e8fbff" stroke-width="1" fill="none" opacity=".7"/></g>`;}return `<svg viewBox="0 0 90 76">${g}</svg>`;}

  static cashHTML(){
    const p=P(), mo=p.cash.month, act=mo.until>Date.now(), days=act?Math.ceil((mo.until-Date.now())/864e5):0;
    return `${pageHead('캐시 상점','CASH SHOP','lobby')}
  <div class="cashhero"><i>PREMIUM STORE</i><h2>◆ ${esc(System.T('currency'))} 충전소</h2><div class="bal">${EconomyView.rIco('gems')}${nf(p.gems)}</div><p>나만의 게임이라 전부 무료예요. 마음껏 충전하세요.</p></div>
  <h3 class="sec">월간 보급 카드</h3>
  <div class="cs-card month hot"><div class="t"><b>월간 보급 카드</b><span class="muted" style="color:#cfe6ff">즉시 ◆300 + 30일 동안 매일 ◆100 (매일 우편함으로 와요)</span>${act?`<div style="margin-top:4px;color:#7fd8ff">남은 기간 ${days}일 · 오늘 ${mo.last===today()?'받음':'미수령'}</div>`:''}</div><button class="btn sm" data-act="cashmonth">${act?'연장':'무료'}</button></div>
  <h3 class="sec">${esc(System.T('currency'))}</h3>
  <div class="cash-grid">${CASH_PACKS.map((k,i)=>{const first=!p.cash.first[k.id];return `<div class="cs-card gem hot t${i+1}">${first?'<span class="rib">첫 구매 2배</span>':''}<div class="gv">${EconomyView.gemArt(i+1)}</div><div class="amt">${nf(k.gems)}<small>${first?'+'+nf(k.gems)+' 첫 구매 보너스':k.bonus?'+'+nf(k.bonus)+' 보너스':'&nbsp;'}</small></div><button class="btn" data-act="cashbuy" data-id="${k.id}">₩0 무료</button></div>`;}).join('')}</div>
  <h3 class="sec">패키지</h3>
  ${CASH_PKGS().map(k=>`<div class="cs-card pkg"><span class="wthumb">${EconomyView.rIcon(k.give)}</span><div class="t"><b>${esc(k.name)}</b><span class="muted" style="color:#e9d9b0">${Core.rewardText(k.give)}</span></div><button class="btn sm" data-act="cashpkg" data-id="${k.id}">무료</button></div>`).join('')}
  <h3 class="sec">자원 보급</h3>
  ${CASH_RES().map(k=>`<div class="cs-card pkg"><span class="wthumb">${k.ico||EconomyView.rIcon(k.give)}</span><div class="t"><b>${esc(k.name)}</b><span class="muted" style="color:#e9d9b0">${Core.rewardText(k.give)}</span></div><button class="btn sm" data-act="cashpkg" data-id="${k.id}">₩0</button></div>`).join('')}${EconomyView.skinPkgHTML()}`;
  }

    /* 상점 주인 편집 창: 새로 그린 그림 미리 보기·고른 주인 표시(View) */
static shopKeeperShow(o){ const pv=document.querySelector('.sk-prev'); if(pv) pv.innerHTML=`<img src="${esc(Characters.imgSrc(o))}" alt="">`; $('#sk_char').value='__self'; }

  static mailRow(x){ const live=Economy.mailLive(x), left=x.exp?Math.max(0,Math.ceil((x.exp-Date.now())/864e5)):0, has=Object.keys(x.reward||{}).length;
    return `<div class="mrow ${x.got?'got':''} ${!live&&!x.got?'exp':''}" data-act="mailview" data-id="${x.id}"><span class="mic">${has?EconomyView.rIcon(x.reward):ICO.mail}</span><span class="t"><b>${esc(x.title)}</b><span class="muted">${esc(x.from)} · ${x.got?'수령 완료':!live?'기간 만료':!has?(x.read?'읽음':'알림'):x.exp?left+'일 남음':'기간 제한 없음'}</span>${has?`<span class="rw">${Core.rewardText(x.reward)}</span>`:''}</span>${has&&live?`<button class="btn sm" data-act="mailget" data-id="${x.id}">받기</button>`:`<button class="btn sm ghost mdel" data-act="maildel" data-id="${x.id}" aria-label="지우기">✕</button>`}</div>`; }

  static openMail(){
    const box=Core.progRead('mail'), n=Economy.mailCount();
    CoreView.openModal(`${head('우편함',`<span class="muted">받을 수 있는 우편 ${n}개 · 받지 않은 우편은 기간이 지나면 사라져요</span>`)}
    <div class="mlist">${box.length?box.map(EconomyView.mailRow).join(''):'<p class="muted" style="text-align:center;padding:30px 0">우편이 없어요.</p>'}</div>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="mailall" ${n?'':'disabled'}>모두 받기</button><button class="btn ghost" data-act="mailclean" ${box.some(mailDone)?'':'disabled'}>받은·읽은 우편 지우기</button></div>`);
  }

    /* 우편 한 통 보기 창(View) */
static openMailView(x){ const has=Object.keys(x.reward||{}).length;
    CoreView.openModal(`${head(esc(x.title),`<span class="muted">${esc(x.from)} · ${new Date(x.at).toLocaleDateString()}</span>`)}<div class="mbody">${esc(x.body).replace(/\n/g,'<br>')}</div>${has?`<div class="mreward">${EconomyView.rIcon(x.reward)}<b>${Core.rewardText(x.reward)}</b></div>`:''}
        <div class="row" style="margin-top:12px">${has&&Economy.mailLive(x)?`<button class="btn" data-act="mailget" data-id="${x.id}" data-back="1">받기</button>`:`<button class="btn ghost" data-act="maildel" data-id="${x.id}">지우기</button>`}<button class="btn ghost" data-act="mailopen">목록</button></div>`); }
}

class EconomyCtl {
  static cashTick(){
    const p=P(), mo=p.cash&&p.cash.month; if(!mo||!mo.until) return;
    if(Date.now()<mo.until&&mo.last!==today()){ mo.last=today(); Economy.sendMail({from:'캐시 상점',title:'월간 보급 카드 오늘의 지급',body:`월간 보급 카드 남은 기간 ${Math.ceil((mo.until-Date.now())/864e5)}일`,reward:{gems:100},days:7}); setTimeout(()=>CoreView.toast('우편함에 월간 보급 카드가 도착했어요'),300); }
  }

  static async handleMailAction(a,t,id,p,e){
    switch(a){
  case 'mailopen': EconomyView.openMail(); break;
  case 'mailview': { if(e.target.closest('[data-act=mailget]')) break; const x=Economy.mailOpen(id); if(x) EconomyView.openMailView(x); break; }
  case 'mailget': { const x=Core.progRead('mail').find(q=>q.id===id); const r=Economy.claimMail(x); if(!r){CoreView.toast('받을 수 없는 우편이에요');break;} Art.sfx('확인'); Challenge.render(); EconomyView.openMail(); CoreView.buyFx(Core.rewardText(r)||'수령 완료',x.title); break; }
  case 'mailall': { let tot={}; Core.progRead('mail').forEach(x=>{ if(Economy.mailLive(x)&&Object.keys(x.reward||{}).length){ const r=Economy.claimMail(x); Object.entries(r).forEach(([k,v])=>tot[k]=(tot[k]||0)+v); } }); if(!Object.keys(tot).length){CoreView.toast('받을 우편이 없어요');break;} Challenge.render(); EconomyView.openMail(); CoreView.buyFx('모두 받기',Core.rewardText(tot)); break; }
  case 'mailclean': { const n=Economy.mailClean(); EconomyView.openMail(); Challenge.render(); CoreView.toast(`우편 ${n}개를 지웠어요`); break; }
  case 'maildel': { const x=Core.progRead('mail').find(q=>q.id===id); if(!x) break; if(mailHas(x)&&Economy.mailLive(x)&&!(await appConfirm('아직 받지 않은 보상이 있어요. 그래도 지울까요?'))) break; Economy.mailRemove(x); Core.mark('prog'); EconomyView.openMail(); Challenge.render(); break; }
    }
  }
}
