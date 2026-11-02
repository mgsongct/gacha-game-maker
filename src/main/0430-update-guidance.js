/* UPDATE_GUIDANCE_MODULE */
/* APK requirements are declared by releases, never guessed from arbitrary code differences. */
function updateHTMLMinimum(html){
 const text=String(html||'');const declared=(text.match(/var REQUIRED_APK='([^']+)'/)||[])[1];
 if(declared)return declared;
 // Compatibility with 2026.10.21.6, published before the explicit marker existed.
 const legacy=(text.match(/versionCompare\(window\.__SHELL__,'([^']+)'\)/)||[])[1];
 if(legacy)return legacy;
 if(text.includes('text/ggm-main')&&text.includes('ggm-durable-storage'))return '2026.10.21.4';
 return '';
}
function updateMinimum(man,html){
 const versions=[man?.apk?.minShell,updateHTMLMinimum(html),man?.build===APP_BUILD?window.__REQUIRED_APK__:''].filter(Boolean).map(String);
 if(versions.some(v=>!/^\d+(?:\.\d+){1,5}$/.test(v)))throw Error('최소 APK 버전 정보가 잘못되었습니다. 배포 정보를 확인해 주세요.');
 return versions.sort(verCmp).at(-1)||'';
}
function updateCheckRecord(man,repo,branch,result,html){const o=LV();o.lastCheck={at:Date.now(),running:APP_BUILD,installed:window.__SHELL__||APP_BUILD,remote:String(man.build||''),minimum:updateMinimum(man,html),repo,branch,result};saveLV(o);}
function updateCurrentMessage(remote){return verCmp(remote,APP_BUILD)<0?'현재 실행 '+APP_BUILD+' · 확인한 배포본 '+remote+'입니다. 업데이트 저장소와 브랜치를 확인해 주세요.':'이미 최신 버전이에요 ('+APP_BUILD+')';}
function updateCheckHTML(o){const r=o.lastCheck;if(!r)return '';return `<div class="panel" data-update-check><b>최근 업데이트 확인</b><p>실행 버전: ${esc(r.running)}<br>설치 APK: ${esc(r.installed)}<br>확인한 배포본: ${esc(r.remote)}<br>필요 APK: ${esc(r.minimum||'별도 요구 없음')}</p><p class="muted">${esc(r.repo)} · ${esc(r.branch)}<br>${esc(r.result)} · ${esc(new Date(r.at).toLocaleString())}</p></div>`;}
function updateReleaseURL(man){const url=String(man?.apk?.url||'');const match=url.match(/^https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/releases(?:\/|$)/i);return 'https://github.com/'+(match?match[1]:RELEASE_REPO)+'/releases/latest';}
function updateAPKRequired(man,html,repo=updRepo(LV()),branch=LV().branch||'main'){
 let minimum;try{minimum=updateMinimum(man,html);}catch(e){UPD=null;toast(e.message);return true;}const installed=window.__SHELL__||APP_BUILD;
 if(!minimum||verCmp(installed,minimum)>=0)return false;
 UPD=null;updateCheckRecord(man,repo,branch,'새 APK 설치 필요',html);
 openModal(`${head('새 APK 설치가 필요해요')}<p>이번 업데이트는 앱의 시작 방식·저장 기능 또는 안드로이드 기능과의 호환 조건이 바뀌어, 앱 안에서 받는 패치만으로는 적용할 수 없어요.</p><div class="panel"><p>현재 설치 APK: <b>${esc(installed)}</b><br>필요한 APK: <b>${esc(minimum)} 이상</b><br>업데이트 버전: <b>${esc(man.build)}</b></p></div><p><b>기존 앱을 삭제하지 말고 새 APK를 내려받아 덮어 설치해 주세요.</b> 같은 공식 앱과 서명으로 설치하면 기존 게임 데이터를 유지합니다. 앱 삭제·데이터 초기화는 하지 마세요.</p><p>GitHub 릴리즈 화면의 <b>Assets(첨부 파일)</b>에서 <b>gacha-game-maker.apk</b>를 내려받고, 다운로드한 APK 파일을 열어 설치해 주세요. Source code ZIP은 앱 설치 파일이 아닙니다.</p>${notesHTML(man)}<div class="row"><button class="btn" data-act="apkget" data-url="${esc(updateReleaseURL(man))}">GitHub 릴리즈 열기</button><button class="btn ghost" data-act="close">나중에</button></div>`);
 return true;
}
async function updateDownloadHTML(base,path,man){
 let response;try{response=await http(base+path+'?t='+Date.now(),{timeout:60000,binary:true});}catch(e){throw Error('업데이트 실행 파일을 확인하지 못했어요. 다시 확인해 주세요.');}
 if(response.status>=400)throw Error('업데이트 실행 파일을 받지 못했어요. 배포 경로를 확인해 주세요.');
 const raw=response.bytes,html=raw?new TextDecoder().decode(raw):String(response.text||'');
 if(!/APP_BUILD/.test(html)||!/<\/html>/i.test(html))throw Error('받은 파일이 게임 파일이 아니에요.');
 const build=(html.match(/var BUILT='([^']+)'/)||[])[1];if(!build||build!==String(man.build))throw Error('배포 정보와 실행 파일의 버전이 달라요. 잠시 뒤 다시 확인해 주세요.');
 if(man.sha256){const digest=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');let ok;
 try{ok=raw?(await digest(raw))===String(man.sha256).toLowerCase():(await Promise.all([html,html+'\n'].map(sha256hex))).includes(String(man.sha256).toLowerCase());}catch(e){throw Error('업데이트 파일의 무결성을 확인하지 못했어요.');}
 if(!ok)throw Error('받은 파일이 손상됐거나 배포 정보와 달라요. 다시 확인해 주세요.');}
 return html;
}

async function checkUpdate(manual){
  UPD=null;const o=LV(), repo=updRepo(o), branch=(o.branch||'main').trim();
  if(o.token) return checkUpdatePrivate(manual);
  let raw=`https://raw.githubusercontent.com/${repo}/${branch}/`;
  let man=null;
  const getMan=async base=>{ try{ const r=await http(base+'version.json?t='+Date.now(),{timeout:20000}); if(r.status<400) return JSON.parse(r.text||(r.bytes?new TextDecoder().decode(r.bytes):'')); }catch(e){} return null; };
  man=await getMan(raw);
  if(!man&&!o.repo){ const alt=`https://raw.githubusercontent.com/${RELEASE_REPO_OLD}/${branch}/`; man=await getMan(alt); if(man) raw=alt; }
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
  if(isBad){ openModal(`${head('이 버전은 전에 문제가 있었어요',`<span class="muted">${esc(man.build)}</span>`)}<p>이 버전은 이 기기에서 제대로 실행되지 않아서 설치 버전으로 돌아왔었어요. 새 버전이 나오면 자동으로 다시 알려 드려요.</p><div class="row" style="margin-top:12px"><button class="btn ghost" data-act="updget">그래도 받기</button><button class="btn" data-act="close">닫기</button></div>`); return; }
  if(o.mode==='silent'&&!manual) return applyUpdate(true);
  openModal(`${head('업데이트가 있어요',`<span class="muted">${esc(APP_BUILD)} → <b>${esc(man.build)}</b></span>`)}${notesHTML(man)}
    <div class="row" style="margin-top:12px"><button class="btn" data-act="updget">받기</button><button class="btn ghost" data-act="updskip">이번 버전 건너뛰기</button><button class="btn ghost" data-act="close">나중에</button></div>`);
}
async function applyUpdate(silent){
  const u=UPD;if(!u)return;let html;
  try{html=u.html||await updateDownloadHTML(u.raw,u.path,u.man);}catch(e){toast(e.message);return;}
  if(updateAPKRequired(u.man,html,updRepo(LV()),LV().branch||'main')){UPD=null;return;}
  const build=(html.match(/var BUILT='([^']+)'/)||[])[1]||u.man.build; try{ appStorage.setItem('ggm-upd-notes',JSON.stringify(Array.isArray(u.man.notes)?u.man.notes:String(u.man.notes||'').split('|').map(x=>x.trim()).filter(Boolean))); }catch(e){}
  try{ await appStorage.saveLive(html); }catch(e){ toast('업데이트 저장 실패: '+(e.message||'저장 공간을 확인해 주세요')); return; }
  const o=LV(); Object.assign(o,{on:true,prevBuild:o.build||'',build,boots:0,failed:false,at:Date.now()}); if(o.badBuild===build) delete o.badBuild; saveLV(o); await flush();
  if(silent){ toast('새 버전을 받았어요. 다음 실행부터 적용돼요'); return; }
  openModal(`${head('업데이트를 받았어요')}<p>버전 <b>${esc(build)}</b>. 다시 시작하면 적용돼요. 문제가 생기면 설정 → 앱 업데이트에서 이전 버전으로 되돌릴 수 있어요.</p><div class="row" style="margin-top:12px"><button class="btn" data-act="reload">지금 다시 시작</button><button class="btn ghost" data-act="close">나중에</button></div>`);
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
    else { const r=await http(base,{headers:Object.assign({},h,{Accept:'application/vnd.github.raw+json'}),timeout:60000}); html=r.text||''; } }catch(e){}
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

/* /UPDATE_GUIDANCE_MODULE */
function onPcServer(){ const pc=PCS(); return !!(pc&&location.origin===pc.base); }
let WEBUPD=null;
async function checkWebUpdate(manual){ if(IS_NATIVE) return; const o=LV(); let man=null;
  try{ const r=await fetch(`https://raw.githubusercontent.com/${updRepo(o)}/main/version.json?t=${Date.now()}`,{cache:'no-store'}); if(r.ok) man=await r.json(); }catch(e){}
  if(!man||!man.build){ if(manual) toast('업데이트 정보를 받지 못했어요. 인터넷 연결을 확인해 주세요'); return; }
  let srvOld=false; if(onPcServer()){ try{ const h=await pcApi('/api/hello'); srvOld=!h.ver||verCmp(String(h.ver),'2026.10.22.2')<0; }catch(e){} }
  if(verCmp(man.build,APP_BUILD)<=0){ if(manual) toast('이미 최신 버전이에요 ('+APP_BUILD+')'+(srvOld?' · PC 서버 프로그램은 새로 받아 주세요':'')); return; }
  if(!manual&&o.webSkip===man.build) return; WEBUPD=man;
  const show=()=>{ if(!manual&&(!$('#modal').hidden||($('#ov')&&!$('#ov').hidden&&!$('#ov').querySelector('.title'))||(typeof B!=='undefined'&&B&&!B.over))) return setTimeout(show,4000);
    openModal(`${head('업데이트가 있어요',`<span class="muted">${esc(APP_BUILD)} → <b>${esc(man.build)}</b></span>`)}${notesHTML(man)}
      ${srvOld?'<p class="muted" style="font-size:.82rem">PC 서버 프로그램(ggm-server.py)도 바뀌었어요. Releases의 gacha-game-maker-pc.zip을 새로 받아 덮어쓰면 좋아요.</p>':''}
      <div class="row" style="margin-top:12px"><button class="btn" data-act="webupdgo">지금 업데이트</button><button class="btn ghost" data-act="webupdskip">이번 버전 건너뛰기</button><button class="btn ghost" data-act="close">나중에</button></div>`); };
  show(); }
async function applyWebUpdate(btn){ if(btn){ btn.disabled=true; btn.textContent='받는 중…'; }
  try{ await flush(); }catch(e){}
  try{ if(LKMODE()&&LK.claimed&&!LK.locked) await lkSave(true); }catch(e){}
  try{ if(onPcServer()) await pcApi('/api/update',{method:'POST',body:{},timeout:90000}); }catch(e){}
  try{ if(window.caches){ const ks=await caches.keys(); await Promise.all(ks.map(k=>caches.delete(k))); } }catch(e){}
  try{ await fetch('./index.html',{cache:'reload'}); await fetch('./',{cache:'reload'}); await fetch('./sw.js',{cache:'reload'}); }catch(e){}
  try{ const rg=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration(); if(rg) await rg.update(); }catch(e){}
  reloadGame(); }
if(!IS_NATIVE){ setInterval(()=>{ if(document.visibilityState==='visible') checkWebUpdate(false); },30*60000); }
async function checkNoticeWeb(){
  const o=LV(); let man=null; try{ const r=await fetch(`https://raw.githubusercontent.com/${updRepo(o)}/main/version.json?t=${Date.now()}`); if(r.ok) man=await r.json(); }catch(e){} if(!man) return;
  if(man.feedback){ o.feedback=String(man.feedback); saveLV(o); }
  if(man.notice&&man.notice.id&&man.notice.title&&o.noticeSeen!==String(man.notice.id)){ o.noticeSeen=String(man.notice.id); saveLV(o); const nb=String(man.notice.body||''); sendMail({kind:'notice',from:'운영팀',title:String(man.notice.title).slice(0,60),body:nb,days:30}); const L=P().live; L.notices=L.notices.filter(x=>!x.dev); L.notices.unshift({dev:true,at:Date.now(),title:String(man.notice.title).slice(0,60),lines:nb.split('\n').map(x=>x.trim()).filter(Boolean)}); mark('prog'); if(tab==='lobby') render(); }
}
function notesHTML(man){const n=Array.isArray(man.notes)?man.notes:String(man.notes||'').split('|').map(x=>x.trim()).filter(Boolean);return n.length?`<div class="panel" style="margin:8px 0"><h3>바뀐 점</h3><ul style="margin:0;padding-left:18px">${n.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:'';}

function LV(){try{return JSON.parse(appStorage.getItem(LVKEY))||{};}catch(e){return {};}}
function saveLV(o){appStorage.setItem(LVKEY,JSON.stringify(o));}

function openUpdSet(){
  const o=LV(), hasPrev=!!o.prevBuild;
  openModal(`${head('앱 업데이트',`<span class="muted">지금 실행 중: ${esc(window.__LIVE__?('온라인 업데이트 '+window.__LIVE__):('설치 버전 '+APP_BUILD))} · 앱 ${esc(window.__SHELL__||APP_BUILD)}</span>`)}
    <p class="muted">앱이 GitHub 공개 저장소에서 새 버전을 받아 와요. 게임 데이터와 키는 그대로 남아요. 받기 전에 바뀐 점을 보여 주고 물어봐요.</p>
    ${updateCheckHTML(o)}
    <label class="f" for="up_mode">새 버전이 있으면</label><select class="in" id="up_mode">${opt([['ask','물어보고 받기'],['silent','조용히 받아서 다음 실행에 적용'],['off','확인하지 않기']],o.auto===false?'off':(o.mode||'ask'))}</select>
    <details style="margin-top:10px"><summary class="muted">개발자용: 받을 저장소 바꾸기</summary>
      <label class="f" for="up_repo">저장소 (아이디/저장소이름, 비우면 기본 ${RELEASE_REPO})</label><input class="in" id="up_repo" value="${esc(o.repo||'')}" placeholder="${RELEASE_REPO}">
      <div class="g2"><div><label class="f" for="up_br">브랜치</label><input class="in" id="up_br" value="${esc(o.branch||'main')}"></div><div><label class="f" for="up_path">파일 경로</label><input class="in" id="up_path" value="${esc(o.path||'www/index.html')}"></div></div>
      <label class="f" for="up_tok">읽기 전용 토큰 (비공개 저장소일 때만)</label><input class="in" id="up_tok" type="password" autocomplete="off" value="${esc(o.token||'')}" placeholder="github_pat_...">
    </details>
    <div class="row" style="margin-top:14px"><button class="btn" data-act="upsave">저장하고 확인</button><button class="btn ghost" data-act="relnotes">배포 페이지</button></div>
    <div class="row" style="margin-top:8px">${hasPrev?'<button class="btn sm ghost" data-act="uprollback">이전 버전으로 되돌리기</button>':''}${o.on?'<button class="btn sm ghost" data-act="upbuiltin">설치 버전으로 돌아가기</button>':''}</div>`);
}
function openAiChar(){
  openModal(`${head('AI로 새 '+T('crew')+' 만들기')}
    <label class="f" for="ai_c">어떤 ${esc(T('crew'))}인가요?</label><textarea class="in" id="ai_c" placeholder="예: 헬릭스에서 도망친 연구원 출신. 겁이 많지만 성핵 폭주를 다룰 줄 안다. 청 속성 지원형, SSR. 실험복 아래 의외로 대담한 옷차림."></textarea>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="aichar">만들기</button></div>
    <p class="muted">능력치, 스킬, 대사, 터치 반응, 계약 대사, NAI 프롬프트까지 채워져요.</p>`);
}
function openAiChapter(){
  openModal(`${head(`AI로 ${G.chapters.length+1}장 만들기`)}
    <label class="f" for="ai_d">이야기 방향</label><textarea class="in" id="ai_d" placeholder="예: 헬릭스의 비밀 연구소에 잠입한다. 세라의 과거 동료가 적으로 나온다. 중간에 미호와 단둘이 변장하고 파티장에 숨어드는 장면."></textarea>
    <label class="f" for="ai_n">스테이지 수</label><select class="in" id="ai_n">${opt([[3,'3개'],[4,'4개'],[5,'5개'],[6,'6개'],[8,'8개'],[10,'10개']],storyN(4))}</select>
    <label class="f">주요 등장 ${esc(T('crew'))}</label><div class="chips">${G.chars.map(c=>`<button class="chip" data-act="castt" data-id="${c.id}">${esc(c.name)}</button>`).join('')}</div>
    <div class="row" style="margin-top:14px"><button class="btn" data-act="aichapter">만들기</button></div>
    <p class="muted">새로 필요한 배경은 자료실에 NAI 프롬프트와 함께 추가되고, ${T('talk')}도 1~2개 함께 만들어져요. 시간이 조금 걸려요.</p>`);
}
function openBackup(){
  openModal(`${head('백업과 가져오기')}
    <label class="f" for="bk_out">현재 데이터</label><textarea class="in tall" id="bk_out" readonly>${esc(JSON.stringify(G))}</textarea>
    <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-act="copyfield" data-f="bk_out">복사</button></div>
    <label class="f" for="bk_in">가져올 데이터 붙여넣기</label><textarea class="in" id="bk_in"></textarea>
    <div class="row" style="margin-top:8px"><button class="btn sm" data-act="importbk">가져오기</button></div>`);
}

