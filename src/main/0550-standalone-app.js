/* =========================================================
   독립 앱 전용: AI 연결, 백업 파일, 안드로이드 뒤로가기
   ========================================================= */
setupAI(); render(); loadAudio().then(()=>sceneBgm()); setTimeout(()=>skillResume().catch(e=>quietErr(e,'스킬 설계 이어 하기')),4000); /* 생성 중 미룬 스킬 설계 이어서 */
(()=>{ const o=LV();
  if(window.__LIVE__){ o.boots=0; saveLV(o); }
  if(o.failed){ o.failed=false; if(o.build) o.badBuild=o.build; saveLV(o); setTimeout(()=>toast('새 버전이 실행되지 않아 설치 버전으로 돌아왔어요'),1500); }
  if(o.superseded){ delete o.superseded; saveLV(o); }
  if(IS_NATIVE&&o.auto!==false&&Date.now()-(o.checked||0)>3*3600e3) setTimeout(()=>checkUpdate(false),5000);
  if(!IS_NATIVE) setTimeout(()=>{ try{ checkNoticeWeb(); }catch(e){} try{ checkWebUpdate(false); }catch(e){} },5000);
  setTimeout(()=>{ try{ syCheckOnStart(); }catch(e){} },3500);
  if(LKMODE()) setTimeout(()=>{ try{ lkActivate(); }catch(e){} },1500);
  if(PCS()) setTimeout(()=>{ try{ pcStart(); }catch(e){} },2500);
  if(!IS_NATIVE){ try{ navigator.storage&&navigator.storage.persist&&navigator.storage.persist(); }catch(e){} if(IS_IOS&&!IS_STANDALONE&&!appStorage.getItem('ggm-a2hs')&&!pcOrigin()&&!pcLostKey()){ let n=0; const tryA=()=>{ if(appStorage.getItem('ggm-a2hs')) return; if($('#modal').hidden&&$('#ov').hidden) openA2HS(true); else if(n++<400) setTimeout(tryA,3000); }; setTimeout(tryA,2500); } }
})();
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible'&&!$('#ov').querySelector('.title')&&P().seenOpening) setTimeout(()=>liveTick(false),800); });
if('serviceWorker' in navigator && location.protocol==='https:' && !window.Capacitor) navigator.serviceWorker.register('sw.js').catch(()=>{});
const CAP=window.Capacitor&&window.Capacitor.Plugins;
if(CAP&&CAP.App) CAP.App.addListener('backButton',()=>{
  if(appConfirmBack())return;
  if(NEW_GAME_SOURCE){toast('게임 생성이 끝날 때까지 기다려 주세요');return;}
  if(BACKUP_BUSY){toast('백업 처리가 끝날 때까지 기다려 주세요.');return;}
  if(document.getElementById('generated-image-preview')||(typeof IMAGE_CANDIDATES!=='undefined'&&IMAGE_CANDIDATES)||(typeof V2ICONS!=='undefined'&&V2ICONS)||!$('#modal').hidden){window.navBack();return;}
  if(!$('#phone').hidden){ if($('.ph-menu')){ $('.ph-menu').remove(); return; } if(PH&&PH.sel){ openRoom(PH.fc); return; } if(PH&&PH.add){ PH.from==='room'?openRoom(PH.add):phNewList(); return; } if(PH) phoneList(); else closePhone(); return; }
  if(S){ vnEnd(); return; }
  if(B){ return; }
  if(GC){ return; }
  if(!$('#ov').hidden) return;
  if(settingsBack())return;
  if(tab!=='lobby'){tab='lobby';render();return;}
  CAP.App.minimizeApp&&CAP.App.minimizeApp();
});
const blobToData=b=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(r.error);r.readAsDataURL(b);});
// 그림 한 장을 기기에 저장해요. 앱: Documents/가챠게임메이커/그림 (안 되면 공유하기), 웹: 다운로드(휴대폰은 공유하기로 사진 앱에 저장).
async function saveImgBlob(b,base){
  const ext=/png/.test(b.type)?'png':/jpe?g/.test(b.type)?'jpg':'webp', name=String(base||'image').replace(/[^\w가-힣-]+/g,'_').slice(0,40)+'_'+Date.now().toString(36)+'.'+ext;
  if(IS_NATIVE&&CAP&&CAP.Filesystem){ const FS=CAP.Filesystem, data=String(await blobToData(b)).split(',')[1], path='가챠게임메이커/그림/'+name;
    try{ try{ if(FS.requestPermissions) await FS.requestPermissions(); }catch(e){ quietErr(e,'0550-standalone-app.js:38'); } await FS.writeFile({path,data,directory:'DOCUMENTS',recursive:true}); toast('Documents/'+path+' 에 저장했어요'); return; }
    catch(e){ try{ await FS.writeFile({path:name,data,directory:'CACHE'}); const u=await FS.getUri({path:name,directory:'CACHE'}); if(CAP.Share){ await CAP.Share.share({title:name,files:[u.uri]}); return; } }catch(e2){ quietErr(e2,'0550-standalone-app.js:39'); } toast('그림을 저장하지 못했어요'); return; } }
  const file=new File([b],name,{type:b.type||'image/webp'});
  if(/iPhone|iPad|Android/i.test(navigator.userAgent)&&navigator.canShare&&navigator.canShare({files:[file]})){ try{ await navigator.share({files:[file],title:name}); return; }catch(e){ if(e&&e.name==='AbortError') return; } }
  downloadBlob(file,name); toast('다운로드 폴더에 저장했어요 · '+name);
}
function charImgList(c){return charImgItems(c).filter(x=>x.o?.id&&imgSrcRaw(x.o)).map(x=>[x.o,x.label,x.group]);}
async function saveImgUrl(u,base){ try{ const b=await (await fetch(u)).blob(); await saveImgBlob(b,base); }catch(e){ toast('그림을 저장하지 못했어요'); } }
$('#drfile').addEventListener('change',async e=>{ const f=e.target.files[0]; e.target.value=''; if(!f) return; const ld=$('#dri_load'); draftImportDone(draftFrom(await f.text()),ld?ld.checked:true); });
$('#bkfile').addEventListener('change',e=>{const f=e.target.files[0];e.target.value='';if(f)backupImport(f,'full');});
