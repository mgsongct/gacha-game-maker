/* ===== 0480-battle 화면(0180-ui-scroll.js에서 옮김) ===== */
/* src/main/0170-shell/0180-ui-scroll.js에서 옮김 */
function farmHTML(){
  const p=P(), top4=G.chars.filter(c=>own(c.id)).map(c=>own(c.id).lv||1).sort((a,b)=>b-a).slice(0,4), topLv=top4.length?Math.round(top4.reduce((a,b)=>a+b,0)/top4.length):1;
  return `${pageHead(T('farm'),'TRAINING','lobby')}<p class="muted">반복해서 재료를 모으는 곳이에요. 단계마다 권장 레벨이 있고, 높은 단계일수록 보상이 커요. 한 번 깬 단계는 소탕으로 바로 보상을 받을 수 있어요. 보유: ${rewardText({exp:p.mat.exp,wmat:p.mat.wmat,core:p.mat.core,gold:p.gold})}</p>
  ${G.meta.farms.map(f=>`<h3 class="sec">${esc(f.name)}</h3>${Array.from({length:FARM_N},(_,k)=>k+1).map(lv=>{const id=`farm_${f.key}_${lv}`, rec=farmRec(lv), low=topLv<rec,cl=!!p.farmClear[id],open=lv===1||!!p.farmClear[`farm_${f.key}_${lv-1}`];
    return `<div class="stage ${cl?'clear':''} ${open?'':'lock'}"><span class="code">${lv}</span><span class="t"><b>${lv}단계 <small class="${low?'farm-low':'muted'}">권장 Lv.${rec}</small></b><span class="st">${rewardText(farmReward(f.key,lv))}</span></span>${open?`<button class="btn sm ghost" data-act="farmgo" data-k="${f.key}" data-lv="${lv}">출격</button>`:''}${cl?`<button class="btn sm" data-act="sweep" data-k="${f.key}" data-lv="${lv}">소탕</button><button class="btn sm ghost" data-act="sweep" data-k="${f.key}" data-lv="${lv}" data-n="5">×5</button>`:''}</div>`;}).join('')}`).join('')}`;
}
