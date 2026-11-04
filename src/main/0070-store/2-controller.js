/* ===== 0070-store — Controller(동작을 받아 Model을 바꾸고 다시 그리게 함 · 섞인 함수는 나눌 것) ===== */
/* src/main/0070-store/0080-storage-integration.js에서 옮김 */
async function switchProject(id){
 if(projectSwitchBusy)return false;if(NEW_GAME_SOURCE||PCJOB||SYJOB||BACKUP_BUSY){toast('진행 중인 생성·저장 작업이 끝난 뒤 전환해 주세요');return false;}projectSwitchBusy=true;
 try{if(window.__NOFLUSH)throw Error('데이터 적용 중입니다. 다시 시작한 뒤 전환해 주세요.');await flush();await appStorage.assertCurrent(PJKEY);const pj=PJ();if(!pj.list.some(x=>x.id===id))throw Error('게임 목록에서 대상을 찾지 못했습니다');const raw=appStorage.getItem(pjKey(id));if(!raw||!Array.isArray(JSON.parse(raw)?.chars))throw Error('선택한 게임의 저장 데이터를 읽지 못했습니다. 현재 게임을 유지합니다.');await appStorage.assertCurrent(pjKey(id));pj.active=id;await appStorage.commitRecords({[PJKEY]:JSON.stringify(pj)});try{sessionStorage.setItem('ggm-picked','1');}catch(e){}await reloadGame();return true;
 }catch(e){storageWarning(e.message||'게임을 전환하지 못했습니다');projectSwitchBusy=false;return false;}
}
async function loadIdbImages(){
  let ch=false;
  for(const o of allImgObjs()){ if(o.img&&o.img.idb&&!imgCache[o.id]){ try{const b=await idbGetNS(o.id); if(b){imgCache[o.id]=URL.createObjectURL(b);ch=true;}}catch(e){} } }
  if(ch){ render(); if(document.querySelector('#ov .title')) showTitle(); }
}
/* src/main/0070-store/0520-backup-storage.js에서 옮김 */
async function backupExport(kind,dest,voices=false){
 if(BACKUP_BUSY)return;BACKUP_BUSY=true;backupBusyOverlay(true);const label=BACKUP_TYPES[kind].name;let writer;
 try{await flush().catch(()=>{});await appStorage.drain().catch(()=>{});const game=JSON.parse(JSON.stringify(G)),media=backupMedia(game),stamp=new Date().toISOString(),name='gacha-'+kind+'-'+stamp.replace(/[:.]/g,'-')+'.ggmbak';writer=await bkWriter(dest,name);const write=o=>writer.write(JSON.stringify(o)+'\n');
 await write({format:'ggm-backup',version:2,kind,at:stamp,identity:backupIdentity(game),...(kind!=='assets'?{game}:{}),...(kind!=='progress'?{media}:{} )});let count=0;
 if(kind!=='progress'){
 const entries=[...media.images.map(x=>({key:x.id})),...media.audios.map(x=>({key:'a_'+x.id})),...media.chat.map(key=>({key}))];if(voices)for(const k of await idbKeys())if(String(k).startsWith('v_'))entries.push({key:k,global:true});
 for(const item of entries){syBar(`${label}: 자료 저장 ${++count}/${entries.length}…`);say('#backup-busy-lock b',`${label}: 자료 저장 ${count}/${entries.length}…`);const blob=item.global?await idbGet(item.key):await idbGetNS(item.key);if(!blob)throw Error('자료 파일을 찾지 못했습니다: '+item.key);await write({record:'media',key:item.key,global:!!item.global,type:blob.type,size:blob.size});for(let p=0;p<blob.size;p+=262144)await write({record:'chunk',data:await backupBytes(blob.slice(p,p+262144))});await write({record:'media-end'});}
 }
 await write({record:'end',count});const result=await writer.close();syBar('');
 if(result.uri&&dest==='share'){if(!CAP?.Share)throw Error('공유 기능을 사용할 수 없습니다');await CAP.Share.share({title:label,files:[result.uri]});}
 else if(result.blob){downloadBlob(result.blob,name);}
 openModal(backupDoneHTML(label,result,name,kind));
 }catch(e){syBar('');toast(label+' 실패: '+(e.message||e)+'. 완료되지 않은 파일은 복원용으로 사용하지 마세요.');}finally{BACKUP_BUSY=false;backupBusyOverlay(false);}
}
async function backupImport(file,kind){if(BACKUP_BUSY)return;if(!appStorage.durable){toast('이 환경은 안전한 자료 복원을 지원하지 않습니다. 최신 APK에서 다시 시도해 주세요.');return;}BACKUP_BUSY=true;backupBusyOverlay(true);const prefix='backup-'+Date.now()+'-'+uid()+'::';let paused=false,restarting=false;const originalProject=PJ().active,originalGame=G;
 try{sessionStorage.setItem('ggm-backup-staging',prefix);backupTransferStatus('공유팩·백업 파일 검사 중…');const head=await stageBackup(file,prefix);if(PJ().active!==originalProject||G!==originalGame)throw Error('게임이 바뀌었습니다. 다시 선택해 주세요.');if(head.kind==='share'){restarting=await applySharedArchive(head,prefix)==='reload';return;}if(head.kind!==kind&&!(head.kind==='full'&&kind!=='full'))throw Error(BACKUP_TYPES[head.kind].name+' 파일입니다. 해당 불러오기 버튼을 사용해 주세요.');if(kind!=='assets'&&(!head.game||!Array.isArray(head.game.chars)||!head.game.prog))throw Error('진행 데이터가 없는 파일입니다');if(kind==='assets'&&!backupMatches(head.identity,G))throw Error('현재 게임과 캐릭터 구성이 다른 자료 백업입니다. 같은 게임에서 불러오거나 전체 백업을 사용해 주세요.');
 syBar('');backupBusyOverlay(false);const identity=JSON.stringify(backupIdentity(G)),confirmText=kind==='assets'?'현재 게임의 이미지·음성을 백업 자료로 바꿉니다. 보유·성장·재화·스토리 진행은 유지됩니다.':kind==='progress'?'현재 게임의 진행·캐릭터 설정을 백업 시점으로 되돌립니다. 현재 기기의 같은 항목에 등록된 이미지·음성은 유지되며, 새 기기에는 자료 백업이 별도로 필요합니다.':'현재 게임을 백업의 진행·이미지·음성으로 복원합니다. 현재 진행 상황이 바뀝니다.';
 if(!await appConfirm(confirmText+'\n계속할까요?'))return;if(identity!==JSON.stringify(backupIdentity(G)))throw Error('게임이 바뀌었습니다. 다시 선택해 주세요.');backupBusyOverlay(true);await flush();window.__NOFLUSH=1;paused=true;
 const game=kind==='assets'?JSON.parse(JSON.stringify(G)):fix(head.game);
 if(kind==='progress'){const old=new Map(imgObjsOf(G).map(x=>[x.id,x]));for(const o of imgObjsOf(game)){const prev=old.get(o.id);o.img=prev?.img?JSON.parse(JSON.stringify(prev.img)):null;if(prev?.seed!=null)o.seed=prev.seed;else delete o.seed;}for(const l of game.lib||[]){const prev=G.lib.find(x=>x.id===l.id);l.audio=prev?.audio?JSON.parse(JSON.stringify(prev.audio)):null;}}
 else attachBackupMedia(game,head.media);
 if(kind==='progress')await appStorage.discard(prefix);
 const registry=PJ(),entry=registry.list.find(x=>x.id===registry.active);if(entry)entry.title=game.meta.title;await appStorage.commitImport(prefix,LKEY,JSON.stringify(game),IMGNS,{[PJKEY]:JSON.stringify(registry)});G=game;dirty.clear();clearTimeout(flushT);for(const k of Object.keys(imgCache)){URL.revokeObjectURL(imgCache[k]);delete imgCache[k];}for(const k of Object.keys(audioCache)){URL.revokeObjectURL(audioCache[k]);delete audioCache[k];}for(const k of Object.keys(chatImgCache)){URL.revokeObjectURL(chatImgCache[k]);delete chatImgCache[k];}await loadIdbImages();await loadAudio();render();closeModal();toast(BACKUP_TYPES[kind].name+'을 불러왔습니다.');
 }catch(e){syBar('');toast('불러오기 실패: '+(e.message||e)+'. 적용 전 실패한 자료는 현재 저장을 덮어쓰지 않습니다.');}finally{if(paused)window.__NOFLUSH=0;await appStorage.discard(prefix).catch(()=>{});sessionStorage.removeItem('ggm-backup-staging');BACKUP_BUSY=restarting;backupBusyOverlay(restarting);syBar('');}}
async function shareExport(options){
 if(BACKUP_BUSY)return;BACKUP_BUSY=true;backupBusyOverlay(true);let writer,destinationFailed=false,retryAsShare=false;
 try{
  await flush();await appStorage.drain();appStorage.setItem('ggm-bkdest',options.dest);
  const game=shareDefinition(options),media=backupMedia(game),stamp=new Date(),safe=String(game.meta.title||'game').replace(/[^\w가-힣-]+/g,'_').slice(0,20),name='gacha-share-'+safe+'-'+stamp.toISOString().replace(/[:.]/g,'-')+'.ggmpack';
  try{writer=await bkWriter(options.dest,name);}catch(e){destinationFailed=true;throw e;}const write=async record=>{try{await writer.write(JSON.stringify(record)+'\n');}catch(e){destinationFailed=true;throw e;}};
  await write({format:'ggm-share',version:2,kind:'share',app:'gacha-game-maker',build:APP_BUILD,at:stamp.toISOString(),game,media});
  const entries=[...media.images.map(x=>({key:x.id})),...media.audios.map(x=>({key:'a_'+x.id}))];let count=0;
  for(const item of entries){backupTransferStatus(`공유팩 자료 저장 ${++count}/${entries.length}…`);const blob=await idbGetNS(item.key);if(!blob)throw Error('자료 파일을 찾지 못했습니다: '+item.key);await write({record:'media',key:item.key,type:blob.type,size:blob.size});for(let p=0;p<blob.size;p+=262144){await write({record:'chunk',data:await backupBytes(blob.slice(p,p+262144))});backupTransferStatus(`공유팩 자료 저장 ${count}/${entries.length} · ${(Math.min(p+262144,blob.size)/1048576).toFixed(1)} / ${(blob.size/1048576).toFixed(1)} MiB`);}await write({record:'media-end'});}
  await write({record:'end',count});backupTransferStatus('공유팩 파일 저장 중…');let result;try{result=await writer.close();}catch(e){destinationFailed=true;throw e;}
  if(result.uri&&options.dest==='share'){if(!CAP?.Share)throw Error('공유 기능을 사용할 수 없습니다');await CAP.Share.share({title:game.meta.title+' 공유팩',files:[result.uri]});}
  else if(result.blob){const file=new File([result.blob],name,{type:'application/octet-stream'});if(options.dest==='share'&&navigator.canShare?.({files:[file]}))await navigator.share({title:game.meta.title+' 공유팩',files:[file]});else{downloadBlob(file,name);}}
  openModal(shareDoneHTML(result,name));
 }catch(e){if(e?.name!=='AbortError'){if(destinationFailed&&IS_NATIVE&&options.dest!=='share'){retryAsShare=true;toast('이 폴더에 저장할 수 없어 공유하기로 다시 저장합니다.');}else toast('공유팩 저장 실패: '+(e.message||e)+'. 완료되지 않은 파일은 사용하지 마세요. 저장 위치도 확인해 주세요.');}}
 finally{BACKUP_BUSY=false;backupBusyOverlay(false);syBar('');}
 if(retryAsShare)return shareExport({...options,dest:'share'});
}
async function applySharedArchive(header,prefix){
 if(!header.game||!Array.isArray(header.game.chars))throw Error('공유팩 게임 정보가 올바르지 않습니다');
 if(header.hasGlobalMedia)throw Error('공유팩에 허용되지 않는 음성 캐시가 포함되어 있습니다');
 const project=PJ().active,original=G;backupBusyOverlay(false);
 const toNew=await appConfirm(`공유 팩 「${header.game.meta?.title||'게임'}」이에요. 새 게임으로 추가할까요?\n확인: 새 게임으로 추가\n취소: 현재 게임을 덮어쓸지 다시 물어봅니다.`);
 if(!toNew&&!await appConfirm('현재 게임을 이 공유팩으로 덮어쓸까요? 진행 상황은 처음부터 시작합니다.'))return false;
 if(PJ().active!==project||G!==original)throw Error('게임이 바뀌었습니다. 파일을 다시 선택해 주세요.');
 backupBusyOverlay(true);backupTransferStatus('공유팩 검사 완료 · 안전하게 저장 중…');await flush();
 const raw=header.game;delete raw.prog;const game=fix(raw),present=new Set((header.media?.images||[]).map(x=>x.id)),audio=new Set((header.media?.audios||[]).map(x=>x.id));
 for(const o of imgObjsOf(game))o.img=present.has(o.id)?{idb:true}:null;
 for(const l of game.lib||[])l.audio=audio.has(l.id)?{idb:true}:null;
 for(const c of game.chars){delete c.voiceId;delete c.voiceName;}
 const registry=PJ(),id=toNew?'g'+uid():project,namespace=id==='main'?'':id+'::';
 if(toNew){registry.list.push({id,title:game.meta.title||'공유 게임'});registry.active=id;}else{const entry=registry.list.find(x=>x.id===id);if(entry){entry.title=game.meta.title;delete entry.sub;}}
 const previousPause=window.__NOFLUSH;window.__NOFLUSH=1;
 try{
  await appStorage.commitImport(prefix,pjKey(id),JSON.stringify(game),namespace,{[PJKEY]:JSON.stringify(registry)});
  dirty.clear();clearTimeout(flushT);
  if(toNew){toast('공유팩을 새 게임으로 추가했어요. 다시 시작합니다.');await reloadGame();return 'reload';}
  G=game;clearImportedMediaCache();try{await loadIdbImages();await loadAudio();applyMeta();render();closeModal();toast('공유팩을 불러왔어요. 새 진행으로 시작합니다.');}catch(e){toast('공유팩은 저장되었지만 화면을 갱신하지 못했습니다. 앱을 다시 실행해 주세요.');}return true;
 }finally{window.__NOFLUSH=previousPause;}
}
/* src/main/0070-store/0525-data-folder.js에서 옮김 */
async function dataExport(){
 if(BACKUP_BUSY)return;BACKUP_BUSY=true;backupBusyOverlay(true);
 try{await flush();await appStorage.drain();const gid=PJ().active,game=JSON.parse(JSON.stringify(G)),blob=await dataExportZip(game,gid),
  name='ggm-data-'+String(game.meta?.title||gid).replace(/[^\w가-힣-]+/g,'_').slice(0,30)+'-'+new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')+'.zip',where=await dataSaveBlob(blob,name);
  syBar('');if(where)openModal(dataExportDoneHTML(where,gid));}
 catch(e){syBar('');toast('내보내기 실패: '+(e.message||e));}finally{BACKUP_BUSY=false;backupBusyOverlay(false);}}
async function dataImport(file){
 if(BACKUP_BUSY)return;if(!appStorage.durable){toast('이 환경은 안전한 가져오기를 지원하지 않습니다.');return;}
 BACKUP_BUSY=true;backupBusyOverlay(true);const prefix='data-'+Date.now()+'-'+uid()+'::';let paused=false;
 try{syBar('데이터 폴더 zip 검사 중…');const r=await dataReadZip(file);syBar('');backupBusyOverlay(false);
  if(!await appConfirm(`「${r.title}」을(를) 새 게임으로 추가할까요?\n캐릭터 ${r.game.chars.length}명 · 자료 ${r.media.length}개 · 진행 포함`))return;
  backupBusyOverlay(true);let n=0;for(const m of r.media){await appStorage.stage(prefix+n++,{key:m.key,blob:m.blob});}
  const have=new Set(r.media.map(m=>m.key)),game=fix(r.game);
  for(const o of imgObjsOf(game))if(o.img?.idb&&!have.has(o.id))o.img=null;
  for(const l of game.lib||[])if(l.audio?.idb&&!have.has('a_'+l.id))l.audio=null;
  const registry=PJ(),id='g'+uid();registry.list.push({id,title:game.meta?.title||r.title});registry.active=id;
  await flush();window.__NOFLUSH=1;paused=true;
  await appStorage.commitImport(prefix,pjKey(id),JSON.stringify(game),id+'::',{[PJKEY]:JSON.stringify(registry)});dirty.clear();clearTimeout(flushT);
  toast('새 게임으로 추가했어요. 다시 시작할게요');setTimeout(()=>reloadGame(),800);}
 catch(e){syBar('');toast('가져오기 실패: '+(e.message||e)+'. 현재 저장은 바꾸지 않았어요.');if(paused)window.__NOFLUSH=0;}
 finally{await appStorage.discard(prefix).catch(()=>{});BACKUP_BUSY=false;backupBusyOverlay(false);}}
