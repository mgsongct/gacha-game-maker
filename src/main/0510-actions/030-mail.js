async function handleMailAction(a,t,id,p,e){
  switch(a){
case 'mailopen': openMail(); break;
case 'mailview': { if(e.target.closest('[data-act=mailget]')) break; const x=mailOpen(id); if(x) openMailView(x); break; }
case 'mailget': { const x=progRead('mail').find(q=>q.id===id); const r=claimMail(x); if(!r){toast('받을 수 없는 우편이에요');break;} sfx('확인'); render(); openMail(); buyFx(rewardText(r)||'수령 완료',x.title); break; }
case 'mailall': { let tot={}; progRead('mail').forEach(x=>{ if(mailLive(x)&&Object.keys(x.reward||{}).length){ const r=claimMail(x); Object.entries(r).forEach(([k,v])=>tot[k]=(tot[k]||0)+v); } }); if(!Object.keys(tot).length){toast('받을 우편이 없어요');break;} render(); openMail(); buyFx('모두 받기',rewardText(tot)); break; }
case 'mailclean': { const n=mailClean(); openMail(); render(); toast(`우편 ${n}개를 지웠어요`); break; }
case 'maildel': { const x=progRead('mail').find(q=>q.id===id); if(!x) break; if(mailHas(x)&&mailLive(x)&&!(await appConfirm('아직 받지 않은 보상이 있어요. 그래도 지울까요?'))) break; mailRemove(x); mark('prog'); openMail(); render(); break; }
  }
}

