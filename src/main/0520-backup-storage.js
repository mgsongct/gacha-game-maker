/* BACKUP_STORAGE_MODULE */
/* Three explicit backup scopes; new archives are streamed JSON records, not one giant JSON string. */
var BACKUP_TYPES={progress:{name:'진행 백업',desc:'보유 캐릭터·레벨·스킬·장비·재화·스토리 진행과 게임 설정을 저장합니다. 이미지·음성 파일과 API 키는 포함하지 않습니다. 같은 기기의 기존 자료와 함께 이어하기에 적합합니다.'},assets:{name:'자료 백업',desc:'현재 게임에 등록된 이미지·음성 파일만 저장합니다. 캐릭터 보유·성장·재화·스토리 진행은 포함하지 않습니다. 같은 게임에 자료를 복원할 때 사용하며 진행 상태는 바꾸지 않습니다.'},full:{name:'전체 백업',desc:'진행 백업과 자료 백업을 함께 저장합니다. 다른 기기로 게임을 옮기거나 모든 내용을 보관할 때 사용합니다. API 키와 앱 전체 설정은 포함하지 않습니다.'}};
var BACKUP_IMPORT_KIND='full',BACKUP_BUSY=false;
function backupBlocks(){return Object.entries(BACKUP_TYPES).map(([k,v])=>`<section class="panel backup-block" data-backup-kind="${k}"><h3>${v.name}</h3><p class="muted">${v.desc}</p><p class="muted">불러오기: .ggmbak 또는 이전 .json 백업을 선택하세요. 파일명 변경은 필요 없으며, 파일 내용으로 형식을 확인합니다.</p>${k==='progress'?'<p class="muted">새 기기에는 그림이 따라가지 않습니다. 자료 백업도 따로 불러오거나 전체 백업을 사용하세요.</p>':''}<div class="row"><button class="btn sm" data-act="backup-save" data-kind="${k}">${v.name} 저장</button><button class="btn sm ghost" data-act="backup-load" data-kind="${k}">${v.name} 불러오기</button></div></section>`).join('')+(typeof dataFolderBlock==='function'?dataFolderBlock():'');}
function backupIdentity(g){return {title:String(g.meta?.title||''),ids:(g.chars||[]).map(x=>x.id).sort()};}
function backupMatches(a,g){const b=backupIdentity(g);return a&&a.title===b.title&&JSON.stringify(a.ids)===JSON.stringify(b.ids);}
function backupChatKeys(g){const keys=new Set();function visit(o){if(!o||typeof o!=='object')return;for(const[k,v]of Object.entries(o)){if(k==='img'&&typeof v==='string'&&v.startsWith('chat_'))keys.add(v);else if(v&&typeof v==='object')visit(v);}}visit(g);return [...keys];}
function backupMedia(g){return {chat:backupChatKeys(g),images:[...new Map(imgObjsOf(g).map(x=>[x.id,x])).values()].filter(x=>x.img?.idb).map(x=>({id:x.id,img:{idb:true},...(x.seed!=null?{seed:x.seed}:{})})),audios:(g.lib||[]).filter(x=>x.audio?.idb).map(x=>({id:x.id,audio:{idb:true}}))};}
function openBackupChoice(kind){const v=BACKUP_TYPES[kind];if(!v)return;openModal(`${head(v.name+' 저장')}<p>${v.desc}</p><label class="f" for="backup-dest">저장 위치</label><select class="in" id="backup-dest">${opt_(bkDests(),bkDest())}</select>${kind!=='progress'?'<label class="f"><input type="checkbox" id="backup-voices"> 기기 전체의 생성 음성 캐시도 추가 (다른 게임의 캐시 포함, 용량 증가)</label>':''}<p class="muted">현재 선택한 게임 하나를 저장합니다. 저장 중에는 앱을 닫지 마세요. 파일 생성 완료 안내를 확인해 주세요.</p><div class="row"><button class="btn" data-act="backup-start" data-kind="${kind}">저장 시작</button><button class="btn ghost" data-act="close">취소</button></div>`);}
async function backupBytes(blob){return String(await blobToData(blob)).split(',')[1];}
async function backupExport(kind,dest,voices=false){
 if(BACKUP_BUSY)return;BACKUP_BUSY=true;backupBusyOverlay(true);const label=BACKUP_TYPES[kind].name;let writer;
 try{await flush().catch(()=>{});await appStorage.drain().catch(()=>{});const game=JSON.parse(JSON.stringify(G)),media=backupMedia(game),stamp=new Date().toISOString(),name='gacha-'+kind+'-'+stamp.replace(/[:.]/g,'-')+'.ggmbak';writer=await bkWriter(dest,name);const write=o=>writer.write(JSON.stringify(o)+'\n');
 await write({format:'ggm-backup',version:2,kind,at:stamp,identity:backupIdentity(game),...(kind!=='assets'?{game}:{}),...(kind!=='progress'?{media}:{} )});let count=0;
 if(kind!=='progress'){
 const entries=[...media.images.map(x=>({key:x.id})),...media.audios.map(x=>({key:'a_'+x.id})),...media.chat.map(key=>({key}))];if(voices)for(const k of await idbKeys())if(String(k).startsWith('v_'))entries.push({key:k,global:true});
 for(const item of entries){syBar(`${label}: 자료 저장 ${++count}/${entries.length}…`);const status=document.querySelector('#backup-busy-lock b');if(status)status.textContent=`${label}: 자료 저장 ${count}/${entries.length}…`;const blob=item.global?await idbGet(item.key):await idbGetNS(item.key);if(!blob)throw Error('자료 파일을 찾지 못했습니다: '+item.key);await write({record:'media',key:item.key,global:!!item.global,type:blob.type,size:blob.size});for(let p=0;p<blob.size;p+=262144)await write({record:'chunk',data:await backupBytes(blob.slice(p,p+262144))});await write({record:'media-end'});}
 }
 await write({record:'end',count});const result=await writer.close();syBar('');
 if(result.uri&&dest==='share'){if(!CAP?.Share)throw Error('공유 기능을 사용할 수 없습니다');await CAP.Share.share({title:label,files:[result.uri]});}
 else if(result.blob){const a=document.createElement('a');a.href=URL.createObjectURL(result.blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},4000);}
 openModal(`${head(label+' 저장 완료')}<p>${esc(result.where||name)}</p><p class="muted">${BACKUP_TYPES[kind].desc}</p><button class="btn" data-act="close">확인</button>`);
 }catch(e){syBar('');toast(label+' 실패: '+(e.message||e)+'. 완료되지 않은 파일은 복원용으로 사용하지 마세요.');}finally{BACKUP_BUSY=false;backupBusyOverlay(false);}
}
async function* backupLines(file){const decoder=new TextDecoder();let carry='';for(let p=0;p<file.size;p+=262144){carry+=decoder.decode(await file.slice(p,p+262144).arrayBuffer(),{stream:true});let n;while((n=carry.indexOf('\n'))>=0){const line=carry.slice(0,n);carry=carry.slice(n+1);if(line.trim())yield JSON.parse(line);}if(carry.length>134217728)throw Error('백업 항목이 너무 큽니다');}carry+=decoder.decode();if(carry.trim())yield JSON.parse(carry);}
// Incremental legacy JSON reader: retain one game object or one media string, never the entire GB archive.
async function* legacyBackupEntries(file){
 const decoder=new TextDecoder('utf-8',{fatal:true});let buffer='',position=0,offset=0,yieldAt=0;
 async function fill(){
  if(position>0){buffer=buffer.slice(position);position=0;}if(offset>=file.size)return false;
  const end=Math.min(file.size,offset+262144);buffer+=decoder.decode(await file.slice(offset,end).arrayBuffer(),{stream:end<file.size});offset=end;
  if(offset-yieldAt>=1048576){yieldAt=offset;backupTransferStatus(`이전 JSON 읽는 중 · ${(offset/1048576).toFixed(1)} / ${(file.size/1048576).toFixed(1)} MiB`);await new Promise(resolve=>setTimeout(resolve,0));}return true;
 }
 async function peek(){while(position>=buffer.length){if(!await fill())return '';}return buffer[position];}
 async function ws(){while(true){while(position<buffer.length&&/\s/.test(buffer[position]))position++;if(position<buffer.length||!await fill())return;}}
 async function expect(c){await ws();if(await peek()!==c)throw Error('손상되었거나 끝이 잘린 JSON 파일입니다');position++;}
 async function value(){
  await ws();if(!await peek())throw Error('JSON 파일이 중간에 끝났습니다');
  const pieces=[];let size=0,depth=0,string=false,escape=false,started=false,done=false;
  while(!done){const start=position;
   while(position<buffer.length){const c=buffer[position];if(!string&&depth===0&&started&&/[},\]\s]/.test(c)){done=true;break;}position++;started=true;
    if(string){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"'){string=false;if(depth===0){done=true;break;}}}
    else if(c==='"')string=true;else if(c==='{'||c==='[')depth++;else if(c==='}'||c===']'){depth--;if(depth===0){done=true;break;}}
   }
   size+=position-start;if(size>134217728)throw Error('JSON의 단일 항목이 너무 큽니다. 이미지를 더 작게 만든 공유팩을 사용해 주세요.');pieces.push(buffer.slice(start,position));
   if(!done&&position>=buffer.length&&!await fill()){if(string||depth!==0)throw Error('JSON 파일이 중간에 끝났습니다. 원본 파일을 다시 전송해 주세요.');done=true;}
  }
  return JSON.parse(pieces.join(''));
 }
 const keys=new Set();await expect('{');await ws();if(await peek()==='}'){position++;return;}
 while(true){const key=await value();if(typeof key!=='string'||keys.has(key))throw Error('중복되거나 올바르지 않은 JSON 항목입니다');keys.add(key);await expect(':');
  if(['images','audios','voices'].includes(key)){await expect('{');await ws();if(await peek()!=='}'){const ids=new Set();while(true){const id=await value();if(typeof id!=='string'||ids.has(id))throw Error('중복되거나 올바르지 않은 자료 ID입니다');ids.add(id);await expect(':');yield {group:key,key:id,value:await value()};await ws();if(await peek()!==',')break;position++;}}await expect('}');}
  else yield {group:'root',key,value:await value()};await ws();const c=await peek();if(c==='}'){position++;break;}await expect(',');
 }
 await ws();if(await peek())throw Error('JSON 끝에 잘못된 데이터가 있습니다');
}
async function stageBackup(file,prefix){
 const first=await file.slice(0,100).text();let header=null,count=0;
 if(/"format"\s*:\s*"(?:ggm-backup|ggm-share)"/.test(first)){
 let active=null,parts=[],size=0,ended=false;const found=new Set();for await(const r of backupLines(file)){if(ended)throw Error('완료 표시 뒤에 추가 데이터가 있습니다');if(!header){if(r.version!==2||!(r.format==='ggm-backup'&&BACKUP_TYPES[r.kind]||r.format==='ggm-share'&&r.kind==='share'))throw Error('지원하지 않는 파일 버전입니다');if(r.kind==='share'&&(!r.game||!Array.isArray(r.game.chars)||!Array.isArray(r.media?.images)||!Array.isArray(r.media?.audios)))throw Error('공유팩의 게임·자료 목록이 올바르지 않습니다');header=r;continue;}
 if(r.record==='media'){if(active||r.global&&!String(r.key).startsWith('v_')||typeof r.key!=='string')throw Error('자료 정보가 잘못되었습니다');if(found.has((r.global?'global:':'')+r.key))throw Error('중복된 자료 항목입니다');found.add((r.global?'global:':'')+r.key);if(r.global)header.hasGlobalMedia=true;active=r;parts=[];size=0;}
 else if(r.record==='chunk'){if(!active||typeof r.data!=='string'||r.data.length>400000)throw Error('자료 조각이 올바르지 않습니다');const data=b64ToBytes(r.data);parts.push(data);size+=data.length;}
 else if(r.record==='media-end'){if(!active||size!==active.size)throw Error('자료 파일 크기가 맞지 않습니다');const status=document.querySelector('#backup-busy-lock b');if(status)status.textContent=`자료 확인 ${count+1}개…`;await appStorage.stage(prefix+count++,{key:active.key,global:active.global,blob:new Blob(parts,{type:active.type})});active=null;parts=[];}
 else if(r.record==='end'){if(active||r.count!==count)throw Error('완료되지 않은 백업입니다');ended=true;}
 else throw Error('알 수 없는 백업 항목입니다');}
 if(!ended||!header)throw Error('백업이 끝까지 저장되지 않았습니다');if(header.kind!=='progress'){for(const x of header.media?.images||[])if(!found.has(x.id))throw Error('누락된 이미지가 있습니다');for(const x of header.media?.audios||[])if(!found.has('a_'+x.id))throw Error('누락된 음성이 있습니다');for(const k of header.media?.chat||[])if(!found.has(k))throw Error('누락된 대화 사진이 있습니다');}
 }else{
 const fields=Object.create(null),media={images:[],audios:[]},mediaKeys=new Set();let isShare=false,hasGlobalMedia=false;for await(const entry of legacyBackupEntries(file)){if(entry.group==='root'){fields[entry.key]=entry.value;if(entry.key==='kind'&&entry.value==='share')isShare=true;}else{if(typeof entry.value!=='string'||!entry.value.startsWith('data:'))throw Error('백업 자료 형식이 잘못되었습니다');if(entry.group==='voices')hasGlobalMedia=true;const blob=await legacyMediaBlob(entry.value),key=entry.group==='images'?entry.key:entry.group==='audios'?'a_'+entry.key:entry.key;const stored=(entry.group==='voices'?'global:':'')+key;if(mediaKeys.has(stored))throw Error('중복된 자료 저장 경로입니다');mediaKeys.add(stored);await appStorage.stage(prefix+count++,{key,global:entry.group==='voices',blob});if(entry.group==='images')media.images.push({id:entry.key,img:{idb:true}});if(entry.group==='audios')media.audios.push({id:entry.key,audio:{idb:true}});}}
 const game=fields.game||fields;header={kind:isShare?'share':fields.kind==='progress'?'progress':'full',game,identity:backupIdentity(game),media,hasGlobalMedia};
 }
 return header;
}
function attachBackupMedia(game,media){const map=new Map(imgObjsOf(game).map(x=>[x.id,x]));for(const item of media?.images||[]){const o=map.get(item.id);if(o){o.img={idb:true};if(item.seed!=null)o.seed=item.seed;}}for(const item of media?.audios||[]){const o=(game.lib||[]).find(x=>x.id===item.id);if(o)o.audio={idb:true};}}
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
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;const kind=b.dataset.kind;if(b.dataset.act==='backup-save')openBackupChoice(kind);if(b.dataset.act==='backup-load'){BACKUP_IMPORT_KIND=kind;document.getElementById('durable-backup-file').click();}if(b.dataset.act==='backup-start'){const dest=document.getElementById('backup-dest').value,voices=!!document.getElementById('backup-voices')?.checked;closeModal();backupExport(kind,dest,voices);}});
document.getElementById('durable-backup-file').addEventListener('change',e=>{const f=e.target.files[0],kind=BACKUP_IMPORT_KIND;e.target.value='';if(f)backupImport(f,kind);});

function backupBusyOverlay(on){let el=document.getElementById('backup-busy-lock');if(!on){if(el)el.remove();return;}if(el)return;el=document.createElement('div');el.id='backup-busy-lock';el.setAttribute('role','status');el.style.cssText='position:fixed;inset:0;z-index:2147483640;background:rgba(0,0,0,.65);display:grid;place-items:center;color:white;padding:24px;pointer-events:auto';el.innerHTML='<div><b>파일 처리 중…</b><p>완료될 때까지 앱을 닫지 마세요.</p></div>';document.body.appendChild(el);}

/* /BACKUP_STORAGE_MODULE */
