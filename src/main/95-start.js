/* ===== 시작 — 앱을 띄움(원안처럼 main 맨 끝: 모든 상수·상태 선언 뒤에 돎. docs/redesign.md 3절 App.start 자리) ===== */
Challenge.render();
 SystemCtl.loadIdbImages();
 if(System.orientPref()!=='auto') System.applyOrient();
if(G.__curveNew){ delete G.__curveNew; System.markAll(); }
SystemView.applyMeta();
 (async()=>{ if(System.PCS()||System.syReady()){ if(await StoryView.bootSync()) return; } const lost=System.pcLostKey(); if(System.needSetup()&&!lost) ArtView.showSetup(); else ArtView.showStart(); if(lost) setTimeout(()=>SystemView.openPcSet(true),700); })();
 System.progTick();
System.setupAI();
 Challenge.render();
 System.loadAudio().then(()=>SystemView.sceneBgm());
 setTimeout(()=>Characters.skillResume().catch(e=>Core.quietErr(e,'스킬 설계 이어 하기')),4000);
(()=>{ const o=Core.LV();
  if(window.__LIVE__){ o.boots=0; LiveOps.saveLV(o); }
  if(o.failed){ o.failed=false; if(o.build) o.badBuild=o.build; LiveOps.saveLV(o); setTimeout(()=>CoreView.toast('새 버전이 실행되지 않아 설치 버전으로 돌아왔어요'),1500); }
  if(o.superseded){ delete o.superseded; LiveOps.saveLV(o); }
  if(IS_NATIVE&&o.auto!==false&&Date.now()-(o.checked||0)>3*3600e3) setTimeout(()=>LiveOpsView.checkUpdate(false),5000);
  if(!IS_NATIVE) setTimeout(()=>{ try{ LiveOps.checkNoticeWeb(); }catch(e){} try{ System.checkWebUpdate(false); }catch(e){} },5000);
  setTimeout(()=>{ try{ SystemView.syCheckOnStart(); }catch(e){} },3500);
  if(System.LKMODE()) setTimeout(()=>{ try{ SystemCtl.lkActivate(); }catch(e){} },1500);
  if(System.PCS()) setTimeout(()=>{ try{ SystemView.pcStart(); }catch(e){} },2500);
  if(!IS_NATIVE){ try{ navigator.storage&&navigator.storage.persist&&navigator.storage.persist(); }catch(e){} if(IS_IOS&&!IS_STANDALONE&&!appStorage.getItem('ggm-a2hs')&&!System.pcOrigin()&&!System.pcLostKey()){ let n=0; const tryA=()=>{ if(appStorage.getItem('ggm-a2hs')) return; if($('#modal').hidden&&$('#ov').hidden) AcquireView.openA2HS(true); else if(n++<400) setTimeout(tryA,3000); }; setTimeout(tryA,2500); } }
})();
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible'&&!$('#ov').querySelector('.title')&&P().seenOpening) setTimeout(()=>Story.liveTick(false),800); });
if('serviceWorker' in navigator && location.protocol==='https:' && !window.Capacitor) navigator.serviceWorker.register('sw.js').catch(()=>{});
const CAP=window.Capacitor&&window.Capacitor.Plugins;
if(CAP&&CAP.App) CAP.App.addListener('backButton',()=>{
  if(appConfirmBack())return;
  if(NEW_GAME_SOURCE){CoreView.toast('게임 생성이 끝날 때까지 기다려 주세요');return;}
  if(BACKUP_BUSY){CoreView.toast('백업 처리가 끝날 때까지 기다려 주세요.');return;}
  if(document.getElementById('generated-image-preview')||(typeof IMAGE_CANDIDATES!=='undefined'&&IMAGE_CANDIDATES)||(typeof V2ICONS!=='undefined'&&V2ICONS)||!$('#modal').hidden){window.navBack();return;}
  if(!$('#phone').hidden){ if($('.ph-menu')){ $('.ph-menu').remove(); return; } if(PH&&PH.sel){ MessengerCtl.openRoom(PH.fc); return; } if(PH&&PH.add){ PH.from==='room'?MessengerCtl.openRoom(PH.add):CharactersView.phNewList(); return; } if(PH) MessengerView.phoneList(); else CoreView.closePhone(); return; }
  if(S){ CharactersView.vnEnd(); return; }
  if(B){ return; }
  if(GC){ return; }
  if(!$('#ov').hidden) return;
  if(CharactersView.settingsBack())return;
  if(tab!=='lobby'){tab='lobby';Challenge.render();return;}
  CAP.App.minimizeApp&&CAP.App.minimizeApp();
});
const blobToData=b=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(r.error);r.readAsDataURL(b);});
$('#drfile').addEventListener('change',async e=>{ const f=e.target.files[0]; e.target.value=''; if(!f) return; const ld=$('#dri_load'); StoryCtl.draftImportDone(Story.draftFrom(await f.text()),ld?ld.checked:true); });
$('#bkfile').addEventListener('change',e=>{const f=e.target.files[0];e.target.value='';if(f)Art.backupImport(f,'full');});
