/* ===== 0190-economy — Model(상태·규칙·저장·외부 서비스) ===== */
/* src/main/0190-economy/0190-shop.js에서 옮김 */
function iconLib(k){return G.lib.find(l=>l.kind==='icon'&&l.key===k);}
function costText(c){return Object.keys(c).length?rewardText(c):'무료';}
function canPay(c){const p=P();return Object.entries(c).every(([k,v])=>k==='gold'?p.gold>=v:k==='gems'?p.gems>=v:(p.mat[k]||0)>=v);}
function pay(c){const p=P();Object.entries(c).forEach(([k,v])=>{if(k==='gold')p.gold-=v;else if(k==='gems')p.gems-=v;else p.mat[k]-=v;});mark('prog');}
function shopkeeper(){const m=G.meta.shop||DEFAULT_META.shop;return {m,c:m.charId&&m.charId!=='__self'?charById(m.charId):null,self:m.charId==='__self'&&m.self&&imgSrc(m.self)?imgSrc(m.self):null};}
function shkSelf(){ const m=G.meta.shop; m.self=m.self||{id:'shk_self',kind:'char',name:'상점 주인',naiPrompt:'',img:null}; return m.self; }
/* src/main/0190-economy/0220-mail.js에서 옮김 */
/* 우편 하나 지우기 — 우편 칸은 이 모듈이 맡음(액션 처리기가 칸을 직접 바꿔 끼우지 않게) */
function mailRemove(x){ P().mail=progRead('mail').filter(q=>q!==x); }
/* 우편 열기(읽음 표시) · 다 받은·지난 우편 정리(지운 수) */
function mailOpen(id){ const x=progSlot('mail').find(q=>q.id===id); if(x){ x.read=true; mark('prog'); } return x; }
function mailClean(){ const p=P(), n0=progRead('mail').length; p.mail=progRead('mail').filter(x=>!mailDone(x)); mark('prog'); return n0-p.mail.length; }
function sendMail(m){ let box=progSlot('mail'); const now=Date.now(); if(m.kind){ const p0=P(); p0.mail=box=box.filter(x=>x.kind!==m.kind); } box.unshift({id:'m'+uid(),kind:m.kind||'',from:m.from||'운영팀',title:m.title||'우편',body:m.body||'',reward:m.reward||{},at:now,exp:m.days===0?0:now+(m.days||30)*864e5,got:false,read:false}); if(box.length>100) box.length=100; mark('prog'); }
function mailLive(x){return !x.got&&(!x.exp||Date.now()<x.exp);}
function mailCount(){return progRead('mail').filter(x=>mailLive(x)&&Object.keys(x.reward||{}).length).length;}
function mailTick(){
  const p=P();
  if(!p.mailInit){ p.mailInit=true; p.mailBuild=APP_BUILD; sendMail({from:'운영팀',title:`${G.meta.title}에 오신 걸 환영해요`,body:`${T('player')}님, 환영해요!\n첫 ${T('gacha')}에 보태라고 작은 선물을 보내요. 즐거운 시간 되세요.`,reward:{gems:1600,gold:20000},days:0}); return; }
  if(p.mailBuild!==APP_BUILD){ const notes=(()=>{try{return JSON.parse(appStorage.getItem('ggm-upd-notes')||'[]');}catch(e){return [];}})();
    p.mailBuild=APP_BUILD; mark('prog'); if(notes.length) sendMail({kind:'update',from:'운영팀',title:`업데이트 안내 (${APP_BUILD})`,body:`앱이 새 버전으로 업데이트됐어요.\n\n바뀐 점\n· ${notes.join('\n· ')}`,days:30}); try{appStorage.removeItem('ggm-upd-notes');}catch(e){} }
}
function claimMail(x){ if(!x||!mailLive(x)) return null; x.got=true; x.read=true; giveReward(x.reward||{}); return x.reward||{}; }
