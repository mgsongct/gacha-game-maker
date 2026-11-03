async function handleMailAction(a,t,id,p,e){
  switch(a){
case 'mailopen': openMail(); break;
case 'mailview': { if(e.target.closest('[data-act=mailget]')) break; const x=mailBox().find(q=>q.id===id); if(!x) break; x.read=true; mark('prog'); const has=Object.keys(x.reward||{}).length;
      openModal(`${head(esc(x.title),`<span class="muted">${esc(x.from)} · ${new Date(x.at).toLocaleDateString()}</span>`)}<div class="mbody">${esc(x.body).replace(/\n/g,'<br>')}</div>${has?`<div class="mreward">${rIcon(x.reward)}<b>${rewardText(x.reward)}</b></div>`:''}
        <div class="row" style="margin-top:12px">${has&&mailLive(x)?`<button class="btn" data-act="mailget" data-id="${x.id}" data-back="1">받기</button>`:`<button class="btn ghost" data-act="maildel" data-id="${x.id}">지우기</button>`}<button class="btn ghost" data-act="mailopen">목록</button></div>`); break; }
case 'mailget': { const x=mailBox().find(q=>q.id===id); const r=claimMail(x); if(!r){toast('받을 수 없는 우편이에요');break;} sfx('확인'); render(); openMail(); buyFx(rewardText(r)||'수령 완료',x.title); break; }
case 'mailall': { let tot={}; mailBox().forEach(x=>{ if(mailLive(x)&&Object.keys(x.reward||{}).length){ const r=claimMail(x); Object.entries(r).forEach(([k,v])=>tot[k]=(tot[k]||0)+v); } }); if(!Object.keys(tot).length){toast('받을 우편이 없어요');break;} render(); openMail(); buyFx('모두 받기',rewardText(tot)); break; }
case 'mailclean': { const p2=P(), n0=mailBox().length; p2.mail=mailBox().filter(x=>!mailDone(x)); mark('prog'); openMail(); render(); toast(`우편 ${n0-p2.mail.length}개를 지웠어요`); break; }
case 'maildel': { const x=mailBox().find(q=>q.id===id); if(!x) break; if(mailHas(x)&&mailLive(x)&&!(await appConfirm('아직 받지 않은 보상이 있어요. 그래도 지울까요?'))) break; mailRemove(x); mark('prog'); openMail(); render(); break; }
  }
}

