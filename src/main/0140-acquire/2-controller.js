/* ===== 0140-acquire — Controller(동작을 받아 Model을 바꾸고 다시 그리게 함 · 섞인 함수는 나눌 것) ===== */
/* src/main/0140-acquire/0150-pickup-existing.js에서 옮김 */
async function puStoryBg(c,lim,bn){ // 배너는 이미 열렸고, 스토리는 뒤에서 써요
  const b=bn||G.banners.find(x=>x.type==='pickup'&&(x.pickup||[])[0]===c.id&&!x.eventId), ex=!!(b&&b.pin), mates=ex?(b.pickup||[]).slice(1).map(charById).filter(Boolean):[]; if(b&&PUBUSY.has(b.id)) return; if(b){ PUBUSY.add(b.id); b.storyFail=false; } liveBar(`${c.name}의 픽업 스토리를 쓰는 중… 몇 분 걸려요. 그동안 플레이해도 돼요.`);
  const ab=c.alt&&charById(c.alt);
  try{ let res=null; for(let k=0;k<3&&!res;k++){ if(k){ liveBar(`${c.name}의 픽업 스토리 다시 시도 중… (${k}/2)`); await wait(2000); } res=await aiEventGen(ab?`이격 ${T('crew')} 「${c.name}」의 픽업 기념 이벤트 스토리. ${c.altCanon?'정사 이야기: 이 사건으로 '+ab.name+'이(가) 지금의 모습이 되고, 이 변화는 이후 메인 스토리에 이어진다.':'외전 이야기: 메인 스토리와 무관한 단발성 소동이고, 이야기가 끝나면 원래대로 돌아간다. 메인 플롯을 바꾸지 않는다.'} 익숙한 ${ab.name}이(가) 지금까지와 다른 모습(${c.name.replace(ab.name,'').replace(/[()]/g,'')||'새 모습'})으로 ${playerName()} 앞에 나타나는 이야기. 성격과 말투는 ${ab.name} 그대로지만, 이 모습이라서 생기는 설렘·웃음·사건을 보여 준다. 이 모습일 때의 대사 이름은 반드시 「${c.name}」로 쓴다. 프로필: ${String(c.profile||'').slice(0,300)}. 기존 ${T('crew')} 1~2명이 조연으로 나온다.`:c.collab?`「${c.collab}」 콜라보 이벤트. 다른 세계에서 온 「${c.name}」이(가) 이 세계에 떨어져 ${playerName()}와(과) 만나는 이야기. 서로의 세계 차이에서 오는 웃음과 긴장, 함께 싸우며 믿음을 쌓는 과정, 마지막은 돌아가기 전까지 동료로 함께하기로 하는 여운. 원작 설정과 말투를 지키고, 원작의 미성년자·학생 캐릭터는 등장시키지 않는다. 학교 배경은 쓰지 않는다. 프로필: ${String(c.profile||'').slice(0,300)}.`:ex?`${T('crew')} 「${c.name}」의 픽업 기념 이벤트 스토리. 이미 ${playerName()}와(과) 함께하는 ${c.name}이(가) 주인공이다. 지금까지의 관계와 스토리를 이어 가면서, 아직 보여 주지 않았던 면모나 사연이 드러나는 사건을 그린다. 처음 만나는 이야기로 쓰지 않는다. 프로필: ${String(c.profile||'').slice(0,300)}.${mates.length?` 함께 픽업된 ${mates.map(x=>x.name).join(', ')}도 비중 있게 나온다.`:` 기존 ${T('crew')} 1~2명이 조연으로 나온다.`} 마지막 장면은 ${c.name}와(과) ${playerName()}의 사이가 한층 가까워지는 여운으로 끝낸다.`:`신규 ${T('crew')} 「${c.name}」의 픽업 기념 이벤트 스토리. ${c.name}이(가) 주인공으로 처음 등장해 성격·매력·사연을 보여 주고 ${playerName()}와(과) 인연을 맺는다. 프로필: ${String(c.profile||'').slice(0,300)}. 기존 ${T('crew')} 1~2명이 조연으로 나온다. 마지막 장면은 ${c.name}이(가) 동료가 되고 싶어 하는 여운으로 끝낸다.`,3,false,[c.name,...mates.map(x=>x.name)],'',ab&&!c.altCanon?c.id:''); }
    if(res&&b){ const ev=res.ev, eb=G.banners.find(x=>x.id===ev.bannerId); if(eb&&eb!==b) G.banners=G.banners.filter(x=>x!==eb); ev.bannerId=b.id; ev.pickupFor=c.id; ev.keepBanner=true; b.eventId=ev.id; b.desc=ex?`${b.name} · 픽업 스토리 「${ev.title}」`:c.collab?`「${c.collab}」 콜라보! ${c.name} 등장 · 콜라보 스토리 「${ev.title}」`:ab?`이격! ${c.name} 등장 · 이격 스토리 「${ev.title}」`:`신규 ${RL[c.rarity]} ${c.name} 등장! 픽업 스토리 「${ev.title}」`; P().curBanner=b.id; mark('prog'); render(); toast(`${c.name} 픽업 스토리 「${ev.title}」가 이벤트에 열렸어요`); }
    else if(!res){ if(b) b.storyFail=true; mark('prog'); render(); toast('픽업 스토리를 만들지 못했어요. 배너 화면의 \'이어서 만들기\'로 다시 시도할 수 있어요'); } }
  finally{ if(b) PUBUSY.delete(b.id); liveBar(null); } }
function joinChar(c,why){ const p=P(); if(!c||p.owned[c.id]) return false; p.owned[c.id]={levelCapVersion:1,transc:0,growthCostVersion:1,lv:1,exp:0,dup:0,aff:0,seen:[],wlv:0,skin:''}; if(p.squad.length<4) p.squad.push(c.id); mark('prog');
  sendMail({from:'운영팀',title:`${RL[c.rarity]} ${c.name} 합류`,body:`${why||'인연이 닿아'} ${c.name}이(가) 함께하게 됐어요. ${T('crew')} 화면에서 확인해 보세요.`,days:30}); setTimeout(()=>toast(`🤝 ${c.name}이(가) 합류했어요!`),1200); return true; }
/* src/main/0140-acquire/0500-gacha.js에서 옮김 */
function gateCheck(){ if(!G.meta.gated) return; const p=P(); p.gateSeen=p.gateSeen||[]; const n=[];
  G.events.forEach(ev=>{ if(ev.gate>0&&gateOpen(ev)&&!p.gateSeen.includes(ev.id)){ p.gateSeen.push(ev.id); n.push(ev.title); sendMail({from:'운영팀',title:`새 ${T('event')} 「${ev.title}」가 열렸어요`,body:`메인 스토리를 진행해서 새 ${T('event')}이(가) 열렸어요. ${T('event')} 화면에서 확인해 보세요.`,days:30}); } });
  G.banners.forEach(bn=>{ if(bn.gate>0&&!bn.eventId&&bnOpen(bn)&&!p.gateSeen.includes(bn.id)){ p.gateSeen.push(bn.id); n.push(bn.name); bn.newAt=Date.now(); sendMail({from:'운영팀',title:`「${bn.name}」 배너가 열렸어요`,body:`${bn.desc||''}\n${T('gacha')} 화면에서 확인해 보세요.`,days:30}); } });
  if(n.length){ mark('prog'); setTimeout(()=>toast('📮 새로 열렸어요: '+n.join(', ')),1600); } }
async function pull(n){
  if(appStorage.failed||document.getElementById('save-warning')){storageWarning('저장을 먼저 복구해 주세요.');return;}
  if(!G.chars.length){toast(T('gacha')+'할 '+T('crew')+'이(가) 없어요.');return;}
  const bn=curBanner(); if(!bn){toast('열린 배너가 없어요');return;} const cost=n*COST; if(P().gems<cost){toast(`${T('currency')}이(가) ${nf(cost-P().gems)}개 모자라요.`);return;}
  pay({gems:cost}); bump('pull',n); const res=[]; const ft=n===10&&P().firstTen; if(ft) P().firstTen=false;
  for(let i=0;i<n;i++) res.push(rollOne(n===10&&i===9&&!res.some(x=>x.c.rarity>=2),ft&&i===9&&!res.some(x=>x.c.rarity===3),bn));
  mark('prog'); try{await flush();}catch(e){render();return;} render(); playGacha(res);
}
/* src/main/0140-acquire/0505-construct.js에서 옮김 */
async function conBuild(){
  if(CONJOB||NEW_GAME_SOURCE||!conOn()) return; if(appStorage.failed||document.getElementById('save-warning')){ storageWarning('저장을 먼저 복구해 주세요.'); return; }
  const cfg=CON(), r=progSlot('cres'); let input=GGMConstruct.normalize(conReadInput(),cfg);
  /* 나올 대원이 없는 투입이면 멈추지 않고 나올 수 있게 맞춘 투입을 권해요(PL1 — 예: 최소 투입은 R만인데 열린 분류에 SR만 있음) */
  const sg=GGMConstruct.suggest(input,cfg,conPool()); if(!sg){ toast(`${T('construct')}로 나올 ${T('crew')}이(가) 없어요(건조 대상 대원이 없음)`); return; }
  if(sg.changed){ if(!(await appConfirm(`${conEmptyWhy(sg.why)}.\n투입을 ${sg.input.join(' / ')}(으)로 올려 ${T('construct')}할까요?`))) return; input=sg.input; }
  /* 자원이 모자라도 멈추지 않고 캐시 상점에서 ₩0으로 보충해요(나만의 게임이라 무료) */
  const lack=CON_RES.filter((k,i)=>r[k]<input[i]); if(lack.length&&!(await cashTopUp(Object.fromEntries(lack.map(k=>[k,input[CON_RES.indexOf(k)]-r[k]])),`${T('construct')}에 `))) return;
  const variants=conVariantChoices(input), res=GGMConstruct.roll(input,cfg,conPool(),variants);
  if(res.kind==='none'){ toast(`${T('construct')}로 나올 ${T('crew')}이(가) 없어요`); return; }
  CONJOB=true;
  try{
    CON_RES.forEach((k,i)=>{ r[k]-=input[i]; }); const B=progSlot('cbuild'); B.n++; B.input=input;
    res.info.recipes.forEach(x=>{ if(!B.found[x.id]) { B.found[x.id]=Date.now(); toast(`새 레시피 발견: ${x.name}`); } });
    res.info.groups.filter(g=>g.open&&!B.found['g:'+g.id]).forEach(g=>{ B.found['g:'+g.id]=Date.now(); });
    let c;
    if(res.kind==='variant'){ const key='v:'+res.tpl.id; if(!B.found[key]) B.found[key]=Date.now();
      c=conVariantOf(res.base,res.tpl);
      if(!c){ openModal(conDecodeHTML(res),true);
        try{ c=await conMakeVariant(res.base,res.tpl); }finally{ closeModal(); } } }
    else c=charById(res.id);
    const got=grantOwned(c,T('construct')); B.log.unshift({id:c.id,at:Date.now(),input,v:res.kind==='variant'?res.tpl.id:''}); B.log=B.log.slice(0,30);
    bump('pull',1); mark('prog'); try{ await flush(); }catch(e){ render(); return; }
    render(); playGacha([got]);
    if(res.kind==='variant'&&imgReady()&&!imgSrc(c)) setTimeout(()=>runPrep(['char'],it=>it.c&&it.c.id===c.id),1500);
  } finally{ CONJOB=false; }
}
async function conBuy(k){ const cfg=CON(), p=P(); if(p.gems<cfg.buy.gems&&!(await cashTopUp({gems:cfg.buy.gems-p.gems},'자원 보급에 '))) return; pay({gems:cfg.buy.gems}); progSlot('cres')[k]+=cfg.buy.amt; mark('prog'); render(); }
async function conSave(){ let adv; try{ adv=JSON.parse($('#con_adv').value); }catch(e){ toast('고급 설정 JSON을 확인해 주세요: '+e.message); return; }
  const m=G.meta.construct=conMeta(), wasOn=m.on; Object.assign(m,adv,{on:$('#con_on').checked,buy:{gems:Math.max(1,+$('#con_bg').value||60),amt:Math.max(1,+$('#con_ba').value||300)}});
  G.meta.variants=conReadVariants();
  if(m.on&&!wasOn&&!progRead('cbuild').started){ progSlot('cbuild').started=Date.now(); const r=progSlot('cres'), s=CON().start; CON_RES.forEach(k=>{ r[k]+=s; }); toast(`${T('construct')}을(를) 켰어요. 시작 자원 ${nf(s)}씩 드려요`); }
  mark('meta','prog'); closeModal(); render(); }
