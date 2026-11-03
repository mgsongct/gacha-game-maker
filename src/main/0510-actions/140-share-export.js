/* Share archives use the same staged, chunked media pipeline as backups.
   Legacy JSON remains an import format; sharing never carries player progress. */
function shareDefinition(options){
 const game=JSON.parse(JSON.stringify(G));delete game.prog;
 const stages=game.chapters.filter(c=>c.kind==='main').reduce((n,ch)=>n+ch.stages.length,0);
 const spread=arr=>arr.forEach((x,k)=>{x.gate=options.gate===false?0:Math.min(stages,x.gate>0?x.gate:Math.max(1,Math.round((k+1)*stages/(arr.length+1))));});
 spread(game.events||[]);spread((game.banners||[]).filter(b=>b.id!=='std'&&!b.eventId));game.meta.gated=options.gate!==false&&stages>0;
 for(const b of game.banners||[]){delete b.until;if(b.id!=='std'&&game.meta.gated){b.active=true;delete b.newAt;}}
 for(const e of game.events||[]){delete e.until;if(game.meta.gated)e.active=true;}
 if(!String(game.meta.artTags||'').trim()){const config=naiCfg(),style=config.styles.find(x=>x.id===config.styleId)||config.styles[0];if(style&&String(style.tags||'').trim()){game.meta.artTags=style.tags;game.meta.artNeg=style.neg||'';}}
 for(const c of game.chars){delete c.voiceId;delete c.voiceName;}
 for(const o of imgObjsOf(game))if(!options.img||!o.img?.idb)o.img=null;
 for(const l of game.lib||[])if(!options.audio)l.audio=null;
 return game;
}
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
  else if(result.blob){const file=new File([result.blob],name,{type:'application/octet-stream'});if(options.dest==='share'&&navigator.canShare?.({files:[file]}))await navigator.share({title:game.meta.title+' 공유팩',files:[file]});else{const a=document.createElement('a');a.href=URL.createObjectURL(file);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},4000);}}
  openModal(`${head('공유 팩 저장 완료')}<p style="overflow-wrap:anywhere">${esc(result.where||name)}</p><p>받는 사람은 패치된 메이커의 설정 → 데이터 → 공유 팩 불러오기에서 새 게임으로 추가할 수 있어요. 기존 JSON 공유팩도 같은 곳에서 불러올 수 있어요.</p><button class="btn" data-act="close">확인</button>`);
 }catch(e){if(e?.name!=='AbortError'){if(destinationFailed&&IS_NATIVE&&options.dest!=='share'){retryAsShare=true;toast('이 폴더에 저장할 수 없어 공유하기로 다시 저장합니다.');}else toast('공유팩 저장 실패: '+(e.message||e)+'. 완료되지 않은 파일은 사용하지 마세요. 저장 위치도 확인해 주세요.');}}
 finally{BACKUP_BUSY=false;backupBusyOverlay(false);syBar('');}
 if(retryAsShare)return shareExport({...options,dest:'share'});
}
function backupTransferStatus(message){const b=document.querySelector('#backup-busy-lock b');if(b)b.textContent=message;syBar(message);}
function clearImportedMediaCache(){for(const cache of [imgCache,audioCache,chatImgCache])for(const k of Object.keys(cache)){URL.revokeObjectURL(cache[k]);delete cache[k];}}
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

// Decode a legacy image in small base64 blocks rather than passing a huge URL to fetch.
async function legacyMediaBlob(value){
 const comma=value.indexOf(',');if(comma<5)throw Error('자료 파일의 데이터 주소가 올바르지 않습니다');const meta=value.slice(5,comma);
 if(!/;base64$/i.test(meta))return (await fetch(value)).blob();
 const type=meta.split(';')[0]||'application/octet-stream',parts=[];let data=value.slice(comma+1);if(/\s/.test(data))data=data.replace(/\s/g,'');
 for(let p=0;p<data.length;p+=349524){parts.push(b64ToBytes(data.slice(p,p+349524)));if(p&&p%1398096===0)await new Promise(resolve=>setTimeout(resolve,0));}
 return new Blob(parts,{type});
}
