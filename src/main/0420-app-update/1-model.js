/* ===== 0420-app-update — Model(상태·규칙·저장·외부 서비스) ===== */
/* src/main/0420-app-update/0420-app-update.js에서 옮김 */
function verCmp(a,b){a=String(a||'').split(/\D+/).map(Number);b=String(b||'').split(/\D+/).map(Number);for(let i=0;i<Math.max(a.length,b.length);i++){const x=a[i]||0,y=b[i]||0;if(x!==y)return x<y?-1:1;}return 0;}
function updRepo(o){return String((o&&o.repo)||RELEASE_REPO).trim();}
async function sha256hex(text){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');}
/* ---- 업데이트 확인·안내·적용(앱·웹·APK), 업데이트 설정 ---- */
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
function updateReleaseURL(man){const url=String(man?.apk?.url||'');const match=url.match(/^https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/releases(?:\/|$)/i);return 'https://github.com/'+(match?match[1]:RELEASE_REPO)+'/releases/latest';}
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
/* /UPDATE_GUIDANCE_MODULE */
function onPcServer(){ const pc=PCS(); return !!(pc&&location.origin===pc.base); }
async function applyWebUpdate(rep){ if(rep) rep('받는 중…');
  try{ await flush(); }catch(e){ quietErr(e,'0420-app-update.js:128'); }
  try{ if(LKMODE()&&LK.claimed&&!LK.locked) await lkSave(true); }catch(e){ quietErr(e,'0420-app-update.js:129'); }
  try{ if(onPcServer()) await pcApi('/api/update',{method:'POST',body:{},timeout:90000}); }catch(e){ quietErr(e,'0420-app-update.js:130'); }
  try{ if(window.caches){ const ks=await caches.keys(); await Promise.all(ks.map(k=>caches.delete(k))); } }catch(e){ quietErr(e,'0420-app-update.js:131'); }
  try{ await fetch('./index.html',{cache:'reload'}); await fetch('./',{cache:'reload'}); await fetch('./sw.js',{cache:'reload'}); }catch(e){ quietErr(e,'0420-app-update.js:132'); }
  try{ const rg=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration(); if(rg) await rg.update(); }catch(e){ quietErr(e,'0420-app-update.js:133'); }
  reloadGame(); }
function LV(){try{return JSON.parse(appStorage.getItem(LVKEY))||{};}catch(e){return {};}}
function saveLV(o){appStorage.setItem(LVKEY,JSON.stringify(o));}
