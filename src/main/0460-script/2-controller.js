/* ===== 0460-script — Controller(동작을 받아 Model을 바꾸고 다시 그리게 함 · 섞인 함수는 나눌 것) ===== */
/* src/main/0460-script/0470-title-opening.js에서 옮김 */
function afterPrologue(){ setTimeout(()=>{ if(typeof prepAsk==='function') prepAsk(); },4000);
  const first=!P().seenOpening; P().seenOpening=true; mark('prog'); tab=first?'contract':tab; render();
  if(first){ toast('첫 10회는 SSR 1명 확정이에요'); setTimeout(()=>checkTriggers(),1500); }
  setTimeout(()=>liveTick(false),2500);
  if(G.meta.subscr) setTimeout(()=>{ if($('#modal').hidden&&$('#ov').hidden) subCheck(false); },4500);
}
