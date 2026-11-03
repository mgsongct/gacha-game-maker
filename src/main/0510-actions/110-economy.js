async function handleEconomyAction(a,t,id,p,e){
  switch(a){
case 'daily': if(p.daily!==today()){p.daily=today(); const dr=rateR({gems:120,gold:5000,exp:10,gift:2}); giveReward(dr);render();sfx('확인');toast(`일일 보급: ${rewardText(dr)}`);} break;
case 'shkdraw': { const m=G.meta.shop, o=shkSelf(); o.naiPrompt=stripMinor(stripAge($('#sk_prompt').value.trim())); naiBlocksSave(o,'naiPrompt','sk_prompt');o.name=$('#sk_name').value.trim()||m.name; if(!o.naiPrompt){ toast('외형 프롬프트를 먼저 적어 주세요'); break; } if(!imgReady()){ toast(imgNeed()); break; }
      const lab=t.textContent; t.disabled=true; t.textContent='그리는 중…'; try{ const bn=await naiDrawItem({k:'char',o,c:o}); await storeImage(o,bn,''); m.charId='__self'; mark('meta'); SHOP_LINE=''; const pv=document.querySelector('.sk-prev'); if(pv) pv.innerHTML=`<img src="${esc(imgSrc(o))}" alt="">`; $('#sk_char').value='__self'; render(); toast('상점 주인 그림을 그렸어요'); }catch(e){ toast(naiErr(e)); } finally{ if(t.isConnected){ t.disabled=false; t.textContent='다시 그리기'; } } break; }
case 'sparkopen': openSpark(id); break;
case 'sparkgo': { const bn=G.banners.find(x=>x.id===t.dataset.b), c=charById(id); if(!bn||!c||!castOk(c)) break; p.spark=p.spark||{}; if((p.spark[bn.id]||0)<SPARK){toast('포인트가 모자라요');break;}
      if(!(await appConfirm(`${c.name}을(를) ${SPARK}포인트로 데려올까요?`))) break; p.spark[bn.id]-=SPARK; let isNew=false;
      if(p.owned[c.id]){ const o=p.owned[c.id]; if(o.dup<5){o.dup++; if(o.dup>=5)o.cgNew=true;} else { p.mat.core+=10; } } else { p.owned[c.id]={levelCapVersion:1,transc:0,growthCostVersion:1,lv:1,exp:0,dup:0,aff:0,seen:[],wlv:0,skin:''}; isNew=true; if(p.squad.length<4)p.squad.push(c.id); }
      mark('prog'); closeModal(); render(); playGacha([{c,isNew,refund:0}]); break; }
case 'pull': pull(+t.dataset.n); break;
case 'puexist': if(playMode()) break; openPickExisting(id||''); break;
case 'puxpick': { puxRead(); const a=PUX.ids, i=a.indexOf(id); if(i>=0) a.splice(i,1); else if(a.length<3) a.push(id); else toast('최대 3명까지 고를 수 있어요'); openPickExisting(); break; }
case 'puxgo': { if(playMode()) break; const r=puxGo(); if(!r) break; closeModal(); PUX=null; tab='contract'; render(); toast(`${r.rerun?'복각 픽업':'픽업'} 「${r.b.name}」을(를) 열었어요`); if(r.story) puStoryBg(r.c,false,r.b); break; }
case 'pustoryretry': { const c=charById(id); if(c){ toast('픽업 스토리를 다시 만들어요'); puStoryBg(c,false,G.banners.find(x=>x.id===t.dataset.b)); } break; }
case 'bsel': P().curBanner=id; mark('prog'); if(t.dataset.go) tab='contract'; render(); break;
case 'bnew': openBanner(null); break;
case 'bedit': openBanner(id); break;
case 'dispset': DSEL={id,ids:[]}; openDispSel(id); break;
case 'dispall': { const now=Date.now(), done=dispList().filter(d=>{ const a=P().disp[d.id]; return a&&now>=a.start+a.hours*3600e3; }); if(!done.length){ toast('완료된 파견이 없어요'); break; } const tot={}; done.forEach(d=>{ const r=dispClaim(d); Object.entries(r).forEach(([k,v])=>{ if(typeof v==='number') tot[k]=(tot[k]||0)+v; }); }); mark('prog'); sfx('확인'); toast(`파견 ${done.length}곳 완료: ${rewardText(tot)}`); render(); break; }
case 'dispredo': { const busy=busyIds(); let n=0; dispList().forEach(d=>{ if(P().disp[d.id]) return; const pick=G.chars.filter(c=>own(c.id)&&!busy.has(c.id)).sort((a,b)=>own(a.id).lv-own(b.id).lv||charPower(a)-charPower(b)).slice(0,d.need); if(pick.length<d.need) return; pick.forEach(c=>busy.add(c.id)); P().disp[d.id]={chars:pick.map(c=>c.id),start:Date.now(),hours:d.hours}; bump('dispatch'); n++; }); mark('prog'); render(); toast(n?`${n}곳에 파견을 보냈어요`:'보낼 곳이나 '+T('crew')+'이(가) 없어요'); break; }
case 'dispgo': { const d=dispList().find(x=>x.id===DSEL.id); if(!d||DSEL.ids.length!==d.need){ toast(`${d?d.need:''}명을 골라 주세요`); break; } P().disp[d.id]={chars:[...DSEL.ids],start:Date.now(),hours:d.hours}; bump('dispatch'); mark('prog'); closeModal(); render(); toast(`${d.name} 출발`); break; }
case 'dispget': { const d=dispList().find(x=>x.id===id); if(!d||!P().disp[id]) break; const dr=dispClaim(d); mark('prog'); sfx('확인'); toast(`${d.name} 완료: ${rewardText(dr)}`); render(); break; }
case 'dispcancel': if((await appConfirm('파견을 취소할까요? 보상은 받지 못해요.'))){ delete P().disp[id]; mark('prog'); render(); } break;
case 'passreset': if((await appConfirm('새 시즌을 시작할까요? 패스 단계가 처음으로 돌아가요.'))){ P().pass={xp:0,got:[]}; mark('prog'); render(); } break;
case 'shopbuy': { const it=SHOP_ITEMS().find(x=>x.id===id), sd=shopDay(), m=G.meta.shop; if(!it) break;
      if((sd.buy[it.id]||0)>=it.limit){toast('오늘은 매진이에요');break;}
      if(!canPay(it.cost)){ SHOP_LINE=rand(m.poor)||'조금 모자라요.'; render(); break; }
      pay(it.cost); sd.buy[it.id]=(sd.buy[it.id]||0)+1; giveReward(it.give); SHOP_LINE=rand(m.buy)||'고마워요!'; sfx('확인'); render(); toast(rewardText(it.give)+' 획득'); break; }
case 'shopswap': { const x=SHOP_SWAP().find(q=>q.id===id); if(!x) break; const n=+(t.dataset.n||1), cost=Object.fromEntries(Object.entries(x.cost).map(([k,v])=>[k,v*n])), give=Object.fromEntries(Object.entries(x.give).map(([k,v])=>[k,v*n]));
      if(!canPay(cost)){ SHOP_LINE=rand(G.meta.shop.poor)||'조금 모자라요.'; render(); break; } pay(cost); giveReward(give); SHOP_LINE=rand(G.meta.shop.buy)||'교환 완료!'; render(); toast(rewardText(give)+' 획득'); break; }
case 'shkedit': openShk(); break;
case 'shksave': { const m=G.meta.shop; m.name=$('#sk_name').value.trim()||'상점 주인'; m.charId=$('#sk_char').value; if($('#sk_prompt'))naiBlocksSave(shkSelf(),'naiPrompt','sk_prompt'); ['hello','buy','poor'].forEach(k=>{const v=lines($('#sk_'+k).value); if(v.length) m[k]=v;}); mark('meta'); SHOP_LINE=''; closeModal(); render(); toast('상점 주인을 저장했어요'); break; }
case 'shkai': { const c=$('#sk_char').value?charById($('#sk_char').value):null, nm=$('#sk_name').value.trim()||'상점 주인';
      const r=await aiJSON(`${RULES}
세계관: ${G.world.summary}
상점 주인 "${nm}"의 대사를 써라.${c?` 이 인물은 ${c.name}이고 프로필은 다음과 같다: ${c.profile}`:''} 플레이어(${T('player')})에게 재료를 파는 가게 주인이다. 짧고 개성 있게, 세계관 용어를 섞는다.
JSON만 출력: {"hello":["인사 5개"],"buy":["구매 감사 5개"],"poor":["돈이 모자랄 때 3개"]}`,t);
      if(r){ ['hello','buy','poor'].forEach(k=>{ if(Array.isArray(r[k])&&r[k].length) $('#sk_'+k).value=r[k].map(String).join('\n'); }); toast('대사를 채웠어요. 저장을 눌러 주세요'); } break; }
case 'cashbuy': { const k=CASH_PACKS.find(x=>x.id===id); if(!k) break; const first=!p.cash.first[k.id], n=k.gems+(first?k.gems:k.bonus); p.cash.first[k.id]=true; p.cash.total+=n; giveReward({gems:n}); mark('prog'); render(); buyFx('+'+nf(n),`◆ ${T('currency')}${first?' · 첫 구매 2배':''}`); break; }
case 'cashmonth': { const mo=p.cash.month, base=Math.max(Date.now(),mo.until||0); mo.until=base+30*864e5; giveReward({gems:300}); mark('prog'); render(); buyFx('+300','월간 보급 카드 · 30일'); cashTick(); render(); break; }
case 'cashpkg': { const k=CASH_PKGS().find(x=>x.id===id); if(!k) break; giveReward(k.give); render(); buyFx(k.name,rewardText(k.give)); break; }
  }
}

