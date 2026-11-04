/* =========================================================
   우편함
   ========================================================= */

/* 우편 하나 지우기 — 우편 칸은 이 모듈이 맡음(액션 처리기가 칸을 직접 바꿔 끼우지 않게) */
function mailRemove(x){ P().mail=progRead('mail').filter(q=>q!==x); }
function sendMail(m){ let box=progSlot('mail'); const now=Date.now(); if(m.kind){ const p0=P(); p0.mail=box=box.filter(x=>x.kind!==m.kind); } box.unshift({id:'m'+uid(),kind:m.kind||'',from:m.from||'운영팀',title:m.title||'우편',body:m.body||'',reward:m.reward||{},at:now,exp:m.days===0?0:now+(m.days||30)*864e5,got:false,read:false}); if(box.length>100) box.length=100; mark('prog'); }
function mailLive(x){return !x.got&&(!x.exp||Date.now()<x.exp);}
const mailHas=x=>Object.keys(x.reward||{}).length>0;
// 지워도 되는 우편: 받았거나, 기간이 지났거나, 보상이 없는 알림(업데이트 안내·완료 알림 등)
const mailDone=x=>x.got||!(!x.exp||Date.now()<x.exp)||!mailHas(x);
function mailCount(){return progRead('mail').filter(x=>mailLive(x)&&Object.keys(x.reward||{}).length).length;}
function mailTick(){
  const p=P();
  if(!p.mailInit){ p.mailInit=true; p.mailBuild=APP_BUILD; sendMail({from:'운영팀',title:`${G.meta.title}에 오신 걸 환영해요`,body:`${T('player')}님, 환영해요!\n첫 ${T('gacha')}에 보태라고 작은 선물을 보내요. 즐거운 시간 되세요.`,reward:{gems:1600,gold:20000},days:0}); return; }
  if(p.mailBuild!==APP_BUILD){ const notes=(()=>{try{return JSON.parse(appStorage.getItem('ggm-upd-notes')||'[]');}catch(e){return [];}})();
    p.mailBuild=APP_BUILD; mark('prog'); if(notes.length) sendMail({kind:'update',from:'운영팀',title:`업데이트 안내 (${APP_BUILD})`,body:`앱이 새 버전으로 업데이트됐어요.\n\n바뀐 점\n· ${notes.join('\n· ')}`,days:30}); try{appStorage.removeItem('ggm-upd-notes');}catch(e){} }
}
function mailRow(x){ const live=mailLive(x), left=x.exp?Math.max(0,Math.ceil((x.exp-Date.now())/864e5)):0, has=Object.keys(x.reward||{}).length;
  return `<div class="mrow ${x.got?'got':''} ${!live&&!x.got?'exp':''}" data-act="mailview" data-id="${x.id}"><span class="mic">${has?rIcon(x.reward):ICO.mail}</span><span class="t"><b>${esc(x.title)}</b><span class="muted">${esc(x.from)} · ${x.got?'수령 완료':!live?'기간 만료':!has?(x.read?'읽음':'알림'):x.exp?left+'일 남음':'기간 제한 없음'}</span>${has?`<span class="rw">${rewardText(x.reward)}</span>`:''}</span>${has&&live?`<button class="btn sm" data-act="mailget" data-id="${x.id}">받기</button>`:`<button class="btn sm ghost mdel" data-act="maildel" data-id="${x.id}" aria-label="지우기">✕</button>`}</div>`; }
function openMail(){
  const box=progRead('mail'), n=mailCount();
  openModal(`${head('우편함',`<span class="muted">받을 수 있는 우편 ${n}개 · 받지 않은 우편은 기간이 지나면 사라져요</span>`)}
    <div class="mlist">${box.length?box.map(mailRow).join(''):'<p class="muted" style="text-align:center;padding:30px 0">우편이 없어요.</p>'}</div>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="mailall" ${n?'':'disabled'}>모두 받기</button><button class="btn ghost" data-act="mailclean" ${box.some(mailDone)?'':'disabled'}>받은·읽은 우편 지우기</button></div>`);
}
function claimMail(x){ if(!x||!mailLive(x)) return null; x.got=true; x.read=true; giveReward(x.reward||{}); return x.reward||{}; }
