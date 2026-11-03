(function(){
  var BUILT='2026.11.03.8'; var REQUIRED_APK='2026.10.21.6'; window.__REQUIRED_APK__=REQUIRED_APK; window.APP_BUILD=BUILT; window.__SHELL__=window.__SHELL__||BUILT;
  function vc(a,b){a=String(a||'').split(/\D+/).map(Number);b=String(b||'').split(/\D+/).map(Number);for(var i=0;i<Math.max(a.length,b.length);i++){var x=a[i]||0,y=b[i]||0;if(x!==y)return x<y?-1:1;}return 0;}
  if(window.__LIVE__) return;
  if(window.indexedDB){window.__STORAGE_SHELL__=BUILT;return;}
  try{
    if(/[?&]builtin/.test(location.search)) return;
    var m=JSON.parse(localStorage.getItem('starfall-live')||'null');
    if(!m||!m.on) return;
    var h=localStorage.getItem('starfall-live-html'); if(!h) return;
    if(m.build&&vc(m.build,BUILT)<0){ m.on=false; m.superseded=BUILT; localStorage.setItem('starfall-live',JSON.stringify(m)); return; }
    m.boots=(m.boots||0)+1;
    if(m.boots>3){ m.on=false; m.failed=true; m.badBuild=m.build; m.boots=0; localStorage.setItem('starfall-live',JSON.stringify(m)); return; }
    localStorage.setItem('starfall-live',JSON.stringify(m));
    window.__LIVE__=m.build||'live';
    document.write(h.replace(/<\/html>\s*$/i,'')+'<plaintext style="display:none">');
  }catch(e){}
})();
