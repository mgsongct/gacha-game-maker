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

