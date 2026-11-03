/* =========================================================
   독립 앱 전용: AI 연결, 백업 파일, 안드로이드 뒤로가기
   ========================================================= */
setupAI(); render(); loadAudio().then(()=>sceneBgm()); setTimeout(()=>{ try{ skillResume(); }catch(e){} },4000); /* 생성 중 미룬 스킬 설계 이어서 */
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
  const a=document.createElement('a'); a.href=URL.createObjectURL(file); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},4000); toast('다운로드 폴더에 저장했어요 · '+name);
}
function charImgList(c){return charImgItems(c).filter(x=>x.o?.id&&imgSrcRaw(x.o)).map(x=>[x.o,x.label,x.group]);}
async function saveImgUrl(u,base){ try{ const b=await (await fetch(u)).blob(); await saveImgBlob(b,base); }catch(e){ toast('그림을 저장하지 못했어요'); } }
function bkDests(){ return IS_NATIVE?[['docs','문서 폴더 (Documents/가챠게임메이커)'],['download','다운로드 폴더 (Download/가챠게임메이커)'],['share','공유하기 (구글 드라이브·카톡 등으로 보내기)']]
  :[...(window.showSaveFilePicker?[['pick','저장할 곳 직접 고르기']]:[]),['download','다운로드 폴더'],...(navigator.canShare?[['share','공유하기 (파일 앱·드라이브 등)']]:[])]; }
function bkDest(){ let v=''; try{ v=appStorage.getItem('ggm-bkdest')||''; }catch(e){} const L=bkDests(); return L.some(x=>x[0]===v)?v:L[0][0]; }
function exportFile(opt){ opt=opt||{}; const share=!!opt.share;
  openModal(`${head(share?'공유 팩 저장':'백업 파일 저장')}
    <label class="f" for="bk_dest">저장 위치</label><select class="in" id="bk_dest">${opt_(bkDests(),bkDest())}</select>
    ${share?'':`<label style="display:flex;gap:8px;margin-top:10px"><input type="checkbox" id="bk_voice"><span>캐릭터 음성도 넣기 <span class="muted" style="font-size:.8rem">(새 기기에서 다시 만들지 않아도 돼요. 파일이 커져요)</span></span></label>`}
    <p class="muted" style="margin:8px 0 0;font-size:.82rem">${IS_NATIVE?'문서·다운로드 폴더에 저장하면 휴대폰의 \'내 파일\' 앱에서 찾을 수 있어요. 앱을 지워도 남아요.':'PC에서는 \'직접 고르기\'로 원하는 폴더에 저장할 수 있어요.'}</p>
    <div class="row" style="margin-top:14px"><button class="btn" data-act="bkgo" data-share="${share?1:0}" data-img="${opt.img===false?0:1}" data-aud="${opt.audio?1:0}" data-gate="${opt.gate===false?0:1}">저장</button><button class="btn ghost" data-act="close">취소</button></div>`);
}
function opt_(list,v){ return list.map(([k,l])=>`<option value="${esc(k)}" ${k===v?'selected':''}>${esc(l)}</option>`).join(''); }
async function bkWriter(dest,name){
  if(IS_NATIVE&&CAP&&CAP.Filesystem){
    const FS=CAP.Filesystem, sub=dest==='docs'?'가챠게임메이커/':dest==='download'?'Download/가챠게임메이커/':'', dir=dest==='docs'?'DOCUMENTS':dest==='download'?'EXTERNAL_STORAGE':'CACHE', path=sub+name;
    if(dest!=='share'){ try{ if(FS.requestPermissions) await FS.requestPermissions(); }catch(e){ quietErr(e,'0550-standalone-app.js:60'); } }
    let first=true, buf='';
    const put=async()=>{ if(!buf&&!first) return; const data=buf; buf=''; if(first){ await FS.writeFile({path,data,directory:dir,encoding:'utf8',recursive:true}); first=false; } else await FS.appendFile({path,data,directory:dir,encoding:'utf8'}); };
    return {write:async s=>{ buf+=s; if(buf.length>1500000) await put(); }, close:async()=>{ await put(); const u=await FS.getUri({path,directory:dir}); return {uri:u.uri,where:dest==='share'?'':(dest==='docs'?'Documents/':'')+path}; }};
  }
  if(dest==='pick'&&window.showSaveFilePicker){ const h=await window.showSaveFilePicker({suggestedName:name,types:[{description:'메이커 백업 파일',accept:{'application/octet-stream':/\.(ggmbak|ggmpack)$/i.test(name)?[name.slice(name.lastIndexOf('.'))]:['.json']}}]}); const ws=await h.createWritable(); return {write:s=>ws.write(s),close:async()=>{ await ws.close(); return {where:h.name}; }}; }
  const parts=[]; return {write:async s=>{ parts.push(s); },close:async()=>({blob:new Blob(parts,{type:/\.(ggmbak|ggmpack)$/i.test(name)?'application/octet-stream':'application/json'})})};
}
async function exportGo(o){return o.share?shareExport(o):backupExport('full',o.dest,!!o.voice);}
$('#drfile').addEventListener('change',async e=>{ const f=e.target.files[0]; e.target.value=''; if(!f) return; const ld=$('#dri_load'); draftImportDone(draftFrom(await f.text()),ld?ld.checked:true); });
$('#bkfile').addEventListener('change',e=>{const f=e.target.files[0];e.target.value='';if(f)backupImport(f,'full');});
