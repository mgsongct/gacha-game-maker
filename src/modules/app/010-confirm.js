/* Independent themed confirmation: never replace or pop the underlying route. */
function appConfirmBack(){const dialog=document.getElementById('app-confirm-dialog');if(!dialog)return false;dialog._finish(false);return true;}
var appConfirm=window.appConfirm||function(message){
 if(document.getElementById('app-confirm-dialog'))return Promise.resolve(false);
 return new Promise(resolve=>{
  const focus=document.activeElement,project=(typeof Core==='undefined'?'undefined':typeof Core.PJ)==='function'?Core.PJ().active:null,root=document.createElement('div');
  root.id='app-confirm-dialog';root.setAttribute('role','alertdialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-labelledby','app-confirm-title');root.setAttribute('aria-describedby','app-confirm-message');
  root.style.cssText='position:fixed;inset:0;z-index:40000;background:#000b;display:flex;align-items:center;justify-content:center;padding:24px;overscroll-behavior:contain';
  root.innerHTML='<section style="width:100%;max-width:400px;background:var(--panel,#211b30);color:var(--ink,#fff);border:1px solid var(--rose,#9c83ff);border-radius:18px;padding:22px;box-shadow:0 16px 60px #0008"><h2 id="app-confirm-title" style="margin:0 0 14px">확인</h2><p id="app-confirm-message" style="white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.6;margin:0 0 22px;max-height:55dvh;overflow:auto"></p><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><button type="button" class="btn" data-confirm-choice="cancel" style="background:var(--panel2,#443952);color:var(--ink,#fff);border:1px solid var(--sub,#a293b5)">취소</button><button type="button" class="btn" data-confirm-choice="accept">확인</button></div></section>';
  root.querySelector('#app-confirm-message').textContent=String(message||'계속 진행할까요?');
  let finished=false;const locked=[...document.body.children].filter(el=>el.tagName!=='SCRIPT').map(el=>[el,el.inert]);for(const [el]of locked)el.inert=true;
  root._finish=accepted=>{if(finished)return;finished=true;const current=(typeof Core==='undefined'?'undefined':typeof Core.PJ)!=='function'||Core.PJ().active===project,connected=!focus||focus.isConnected;root.remove();for(const [el,old]of locked)el.inert=old;document.removeEventListener('keydown',key,true);if(focus?.isConnected)focus.focus({preventScroll:true});resolve(!!accepted&&current&&connected);};
  function key(e){if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();root._finish(false);}else if(e.key==='Tab'){const buttons=[...root.querySelectorAll('button')],i=buttons.indexOf(document.activeElement);e.preventDefault();buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus({preventScroll:true});}}
  root.addEventListener('click',e=>{e.stopPropagation();const choice=e.target.closest('[data-confirm-choice]')?.dataset.confirmChoice;if(choice)root._finish(choice==='accept');});
  document.addEventListener('keydown',key,true);document.body.append(root);root.querySelector('[data-confirm-choice=cancel]').focus({preventScroll:true});
 });
};

