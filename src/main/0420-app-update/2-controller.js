/* ===== 0420-app-update — Controller(동작을 받아 Model을 바꾸고 다시 그리게 함 · 섞인 함수는 나눌 것) ===== */
/* src/main/0420-app-update/0420-app-update.js에서 옮김 */
async function checkUpdate(manual){
  UPD=null;const o=LV(), repo=updRepo(o), branch=(o.branch||'main').trim();
  if(o.token) return checkUpdatePrivate(manual);
  let raw=`https://raw.githubusercontent.com/${repo}/${branch}/`;
  let man=null;
  const getMan=async base=>{ try{ const r=await http(base+'version.json?t='+Date.now(),{timeout:20000}); if(r.status<400) return JSON.parse(r.text||(r.bytes?new TextDecoder().decode(r.bytes):'')); }catch(e){} return null; };
  man=await getMan(raw);
  o.checked=Date.now(); saveLV(o);
  if(!man||!man.build){ if(o.repo) return checkUpdatePrivate(manual); if(manual) toast('업데이트 정보를 받지 못했어요. 인터넷을 확인해 주세요'); return; }
  if(man.feedback){ o.feedback=String(man.feedback); saveLV(o); }
  if(man.notice&&man.notice.id&&man.notice.title&&o.noticeSeen!==String(man.notice.id)){ o.noticeSeen=String(man.notice.id); saveLV(o); const nb=String(man.notice.body||''); sendMail({kind:'notice',from:'운영팀',title:String(man.notice.title).slice(0,60),body:nb,days:30}); const L=P().live; L.notices=L.notices.filter(x=>!x.dev); L.notices.unshift({dev:true,at:Date.now(),title:String(man.notice.title).slice(0,60),lines:nb.split('\n').map(x=>x.trim()).filter(Boolean)}); L.notices=L.notices.slice(0,30); mark('prog'); render(); toast('새 공지가 도착했어요'); }
  if(updateAPKRequired(man,'',repo,branch))return;
  const newer=verCmp(man.build,APP_BUILD)>0;
  if(!newer){updateCheckRecord(man,repo,branch,'최신 또는 배포본보다 새 버전');if(manual)toast(updateCurrentMessage(man.build));return;}
  if(o.skip===man.build&&!manual) return;
  const isBad=!!o.badBuild&&o.badBuild===man.build; if(isBad&&!manual) return;
  const path=(man.html||o.path||'www/index.html').replace(/^\//,'');let html;
  try{html=await updateDownloadHTML(raw,path,man);}catch(e){updateCheckRecord(man,repo,branch,'확인 실패: '+e.message);if(manual)toast(e.message);return;}
  if(updateAPKRequired(man,html,repo,branch))return;
  updateCheckRecord(man,repo,branch,'웹 패치 가능',html);UPD={man,raw,path,html};
  if(isBad){ openModal(updateBadHTML(man)); return; }
  if(o.mode==='silent'&&!manual) return applyUpdate(true);
  openModal(updateFoundHTML(man));
}
async function applyUpdate(silent){
  const u=UPD;if(!u)return;let html;
  try{html=u.html||await updateDownloadHTML(u.raw,u.path,u.man);}catch(e){toast(e.message);return;}
  if(updateAPKRequired(u.man,html,updRepo(LV()),LV().branch||'main')){UPD=null;return;}
  const build=(html.match(/var BUILT='([^']+)'/)||[])[1]||u.man.build; try{ appStorage.setItem('ggm-upd-notes',JSON.stringify(Array.isArray(u.man.notes)?u.man.notes:String(u.man.notes||'').split('|').map(x=>x.trim()).filter(Boolean))); }catch(e){}
  try{ await appStorage.saveLive(html); }catch(e){ toast('업데이트 저장 실패: '+(e.message||'저장 공간을 확인해 주세요')); return; }
  const o=LV(); Object.assign(o,{on:true,prevBuild:o.build||'',build,boots:0,failed:false,at:Date.now()}); if(o.badBuild===build) delete o.badBuild; saveLV(o); await flush();
  if(silent){ toast('새 버전을 받았어요. 다음 실행부터 적용돼요'); return; }
  openModal(updateReadyHTML(build));
}
async function checkUpdatePrivate(manual){
  UPD=null;const o=LV(); if(!o.repo){ if(manual) toast('업데이트 설정에서 GitHub 저장소를 먼저 넣어 주세요'); return; }
  const base=`https://api.github.com/repos/${o.repo.trim()}/contents/${(o.path||'www/index.html').trim()}?ref=${encodeURIComponent((o.branch||'main').trim())}`;
  const h={Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}; if(o.token) h.Authorization='Bearer '+o.token.trim();
  let j; try{ j=okJSON(await http(base,{headers:h,timeout:30000})); }
  catch(e){ if(manual) toast('업데이트 확인 실패. '+(e.code==='bad_key'?'토큰 권한을 확인해 주세요.':e.code==='model_not_found'?'저장소 이름, 브랜치, 경로를 확인해 주세요.':(e.message||''))); return; }
  o.checked=Date.now(); saveLV(o);
  let html='';
  try{ if(j.content&&j.encoding==='base64') html=new TextDecoder().decode(b64ToBytes(j.content.replace(/\s/g,'')));
    else { const r=await http(base,{headers:Object.assign({},h,{Accept:'application/vnd.github.raw+json'}),timeout:60000}); html=r.text||''; } }catch(e){ quietErr(e,'0420-app-update.js:99'); }
  if(!/APP_BUILD/.test(html)||!/<\/html>/i.test(html)){ if(manual) toast('받은 파일이 게임 파일이 아니에요. 경로를 확인해 주세요.'); return; }
  const build=(html.match(/var BUILT='([^']+)'/)||[])[1]||'';
  const man={build,apk:{url:'https://github.com/'+RELEASE_REPO+'/releases/latest/download/gacha-game-maker.apk'}};
  if(updateAPKRequired(man,html,o.repo,o.branch||'main'))return;
  if(build&&verCmp(build,APP_BUILD)<=0){o.sha=j.sha;saveLV(o);updateCheckRecord(man,o.repo,o.branch||'main','최신 또는 배포본보다 새 버전',html);if(manual)toast(updateCurrentMessage(build));return;}
  updateCheckRecord(man,o.repo,o.branch||'main','웹 패치 가능',html);
  if(build&&o.badBuild===build&&!manual) return;
  try{ await appStorage.saveLive(html); }
  catch(e){ toast('업데이트 저장 실패: '+(e.message||'저장 공간을 확인해 주세요')); return; }
  Object.assign(o,{on:true,sha:j.sha,prevBuild:o.build||'',build,boots:0,failed:false,at:Date.now()}); saveLV(o);
  openModal(`${head('새 버전을 받았어요')}<p>버전 <b>${esc(build||'알 수 없음')}</b>. 앱을 다시 시작하면 적용돼요.</p><div class="row" style="margin-top:12px"><button class="btn" data-act="reload">지금 다시 시작</button><button class="btn ghost" data-act="close">나중에</button></div>`);
}
async function checkWebUpdate(manual){ if(IS_NATIVE) return; const o=LV(); let man=null;
  try{ const r=await fetch(`https://raw.githubusercontent.com/${updRepo(o)}/main/version.json?t=${Date.now()}`,{cache:'no-store'}); if(r.ok) man=await r.json(); }catch(e){ quietErr(e,'0420-app-update.js:117'); }
  if(!man||!man.build){ if(manual) toast('업데이트 정보를 받지 못했어요. 인터넷 연결을 확인해 주세요'); return; }
  let srvOld=false; if(onPcServer()){ try{ const h=await pcApi('/api/hello'); srvOld=!h.ver||verCmp(String(h.ver),'2026.10.22.2')<0; }catch(e){ quietErr(e,'0420-app-update.js:119'); } }
  if(verCmp(man.build,APP_BUILD)<=0){ if(manual) toast('이미 최신 버전이에요 ('+APP_BUILD+')'+(srvOld?' · PC 서버 프로그램은 새로 받아 주세요':'')); return; }
  if(!manual&&o.webSkip===man.build) return; WEBUPD=man;
  const show=()=>{ if(!manual&&(!$('#modal').hidden||($('#ov')&&!$('#ov').hidden&&!$('#ov').querySelector('.title'))||(typeof B!=='undefined'&&B&&!B.over))) return setTimeout(show,4000);
    openModal(updateWebFoundHTML(man,srvOld)); };
  show(); }
async function checkNoticeWeb(){
  const o=LV(); let man=null; try{ const r=await fetch(`https://raw.githubusercontent.com/${updRepo(o)}/main/version.json?t=${Date.now()}`); if(r.ok) man=await r.json(); }catch(e){ quietErr(e,'0420-app-update.js:137'); } if(!man) return;
  if(man.feedback){ o.feedback=String(man.feedback); saveLV(o); }
  if(man.notice&&man.notice.id&&man.notice.title&&o.noticeSeen!==String(man.notice.id)){ o.noticeSeen=String(man.notice.id); saveLV(o); const nb=String(man.notice.body||''); sendMail({kind:'notice',from:'운영팀',title:String(man.notice.title).slice(0,60),body:nb,days:30}); const L=P().live; L.notices=L.notices.filter(x=>!x.dev); L.notices.unshift({dev:true,at:Date.now(),title:String(man.notice.title).slice(0,60),lines:nb.split('\n').map(x=>x.trim()).filter(Boolean)}); mark('prog'); if(tab==='lobby') render(); }
}
/* src/main/0420-app-update/080-updates.js에서 옮김 */
async function handleUpdatesAction(a,t,id,p,e){
  switch(a){
case 'webupdcheck': checkWebUpdate(true); break;
case 'webupdgo': applyWebUpdate(uiProg(t)); break;
case 'webupdskip': { const o=LV(); if(WEBUPD) o.webSkip=WEBUPD.build; saveLV(o); closeModal(); toast('다음 버전이 나오면 다시 알려 드릴게요'); break; }
case 'updel': { const c=charById(id); if(!c||!c.upper) break; c.upper.img=null; mark('c:'+c.id); openChar(c.id); break; }
case 'upd-open': openUpdSet(); break;
case 'updcheck': checkUpdate(true); break;
case 'updget': { const done=busy(t,'받는 중…'); await applyUpdate(false); done(); break; }
case 'updskip': { const o=LV(); if(UPD) o.skip=UPD.man.build; saveLV(o); closeModal(); toast('이 버전은 다시 묻지 않아요. 설정에서 직접 확인할 수 있어요'); break; }
case 'apkget': openUrl(t.dataset.url); break;
case 'relnotes': openUrl('https://github.com/'+updRepo(LV())+'/releases/latest'); break;
case 'uprollback': { const prev=await appStorage.readLive('starfall-live-prev'); if(!prev) break; const o=LV(); const b=(prev.match(/var BUILT='([^']+)'/)||[])[1]||'';
      if(o.on&&o.build) o.badBuild=o.build;
      if(!b||verCmp(b,window.__SHELL__||APP_BUILD)<=0){ o.on=false; saveLV(o); toast('이전 버전이 설치 버전보다 오래돼서 설치 버전으로 돌아가요'); setTimeout(()=>{reloadGame(location.pathname+'?builtin=1');},900); break; }
      const cur=await appStorage.readLive('starfall-live-html'); await appStorage.writeLive('starfall-live-html',prev); if(cur) await appStorage.writeLive('starfall-live-prev',cur);
      Object.assign(o,{on:true,prevBuild:o.build,build:b,boots:0,sha:''}); saveLV(o); reloadGame(); break; }
case 'upbuiltin': { const o=LV(); if(o.on&&o.build) o.badBuild=o.build; o.on=false; saveLV(o); reloadGame(location.pathname+'?builtin=1'); break; }
  }
}
