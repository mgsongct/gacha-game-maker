var appStorage=GGMStorage.create(window);
(function(){
 function versionCompare(a,b){const x=String(a||'').split(/\D/).map(Number),y=String(b||'').split(/\D/).map(Number);for(let i=0;i<Math.max(x.length,y.length);i++)if((x[i]||0)!==(y[i]||0))return(x[i]||0)-(y[i]||0);return 0;}
 function run(){
  // Runtime modules must only execute after the final document is selected.
  // document.open() clears handlers but keeps global lexical declarations.
  const modules=[...document.querySelectorAll('script[type="text/ggm-module"]'),document.getElementById('ggm-main')];
  for(const code of modules){if(!code)throw Error('앱 실행 코드가 누락되었습니다.');const script=document.createElement('script');script.id=code.id==='ggm-main'?'ggm-main-running':code.id;script.textContent=code.textContent;code.replaceWith(script);}
 }
 async function boot(){if(window.__LIVE__&&(versionCompare(window.__SHELL__,window.__REQUIRED_APK__||'2026.10.21.6')<0||!window.__STORAGE_SHELL__)){const error=Error('새 APK 설치가 필요합니다.');error.code='apk_required';error.minimum=window.__REQUIRED_APK__||'2026.10.21.6';throw error;}await appStorage.init();try{if(navigator.storage?.persist)navigator.storage.persist().catch(()=>{});}catch(e){}
 if(!window.__LIVE__&&!/[?&]builtin/.test(location.search)){
  const m=JSON.parse(localStorage.getItem('starfall-live')||'null');
  if(m?.on){const built=window.APP_BUILD,cmp=(a,b)=>{const x=String(a).split(/\D/).map(Number),y=String(b).split(/\D/).map(Number);for(let i=0;i<Math.max(x.length,y.length);i++)if((x[i]||0)!==(y[i]||0))return(x[i]||0)-(y[i]||0);return 0;};
   if(cmp(m.build,built)<0){m.on=false;m.superseded=built;localStorage.setItem('starfall-live',JSON.stringify(m));}
   else {m.boots=(m.boots||0)+1;const h=await appStorage.readLive('starfall-live-html');if(m.boots>3||!h){m.on=false;m.failed=true;m.badBuild=m.build;m.boots=0;localStorage.setItem('starfall-live',JSON.stringify(m));}
    else{localStorage.setItem('starfall-live',JSON.stringify(m));window.__LIVE__=m.build;document.open();document.write(h);document.close();return;}}
  }
 }
 run();}
 if(!window.indexedDB){run();return;}
 function showFailure(error){
  const box=document.createElement('div');box.id='storage-boot-error';box.style.cssText='position:fixed;inset:0;z-index:2147483647;background:var(--bg,#14161a);color:var(--text,white);padding:28px 22px;overflow:auto';
  if(error.code==='apk_required'){
   box.dataset.reason='apk-required';box.innerHTML='<h2>새 APK 설치가 필요해요</h2><p>이번 업데이트는 앱 안에서 받는 패치만으로 적용할 수 없습니다.</p><div class="panel"><p>현재 설치 APK: <b data-installed></b><br>필요한 APK: <b data-minimum></b> 이상</p></div><p><b>기존 앱을 삭제하지 말고 새 APK를 덮어 설치해 주세요.</b> 데이터를 초기화하지 않았습니다. 같은 공식 앱과 서명으로 덮어 설치하면 기존 게임 데이터를 유지합니다.</p><p>아래 버튼으로 GitHub 릴리즈를 열고, <b>Assets(첨부 파일)</b>에서 <b>gacha-game-maker.apk</b>를 내려받으세요. 다운로드한 APK 파일을 열어 설치합니다. Source code ZIP은 앱 설치 파일이 아닙니다.</p><div class="row"><button class="btn" data-boot-release>GitHub 릴리즈 열기</button><button class="btn ghost" data-boot-builtin>설치된 버전으로 돌아가기</button></div><p data-boot-hint role="status"></p>';
   box.querySelector('[data-installed]').textContent=window.__SHELL__||'확인 필요';box.querySelector('[data-minimum]').textContent=error.minimum;
   box.querySelector('[data-boot-release]').onclick=async()=>{const url='https://github.com/jjhk0803/gacha-game-maker/releases/latest';try{const browser=window.Capacitor?.Plugins?.Browser;if(browser){await browser.open({url});return;}}catch(e){}try{const opened=window.open(url,'_blank');if(opened)return;}catch(e){}const hint=box.querySelector('[data-boot-hint]');hint.textContent='브라우저에서 아래 주소를 열어 주세요: ';const link=document.createElement('a');link.href=url;link.target='_blank';link.rel='noopener';link.textContent=url;hint.append(link);};
   box.querySelector('[data-boot-builtin]').onclick=()=>{location.href=location.pathname+'?builtin=1';};
  }else{
   box.innerHTML='<h2>저장 데이터를 안전하게 열지 못했습니다</h2><p></p><p>데이터를 초기화하지 않았습니다. 다른 메이커 화면을 닫고 기기 저장 공간을 확인한 뒤 다시 실행해 주세요. 앱 삭제·데이터 삭제는 하지 마세요.</p><button class="btn">다시 시도</button>';box.querySelector('p').textContent=String(error.message||error);box.querySelector('button').onclick=()=>location.reload();
  }
  document.body.appendChild(box);
 }
 boot().catch(showFailure);
})();

