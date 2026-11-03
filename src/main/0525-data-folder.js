/* DATA_FOLDER_MODULE
   게임 하나 = data/<게임id>/ 폴더, 종류별 JSON (meta.json, world.json, chars.json, chapters.json …).
   PC 서버(pc/ggm-server.py)가 영구 저장소로 쓰는 배치와 같아요. 여기서는 그 배치로 내보내기·가져오기(.zip)를 해요.
   zip 안: data/index.json · data/<id>/<종류>.json · data/<id>/media.json · data/<id>/media/<자료 키> */
const DATA_TYPES=['meta','world','chars','npcs','rels','chapters','lib','threads','opening','banners','events','dispatches','prog'];
function dataSplit(g){const files={},rest={};for(const[k,v]of Object.entries(g))(DATA_TYPES.includes(k)?files:rest)[k]=v;files.game=rest;return files;}
function dataJoin(files){const g={...(files.game||{})};for(const k of DATA_TYPES)if(k in files)g[k]=files[k];return g;}

/* zip: 압축 없이 저장(stored) · UTF-8 이름. 읽기는 stored와 deflate(브라우저 DecompressionStream) 둘 다.
   ponytail: zip64 없음 → 파일 하나·전체 4GB, 항목 65535개까지 */
const CRC_T=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc32(u){let c=0xFFFFFFFF;for(let i=0;i<u.length;i++)c=CRC_T[(c^u[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
function zipMake(entries){const enc=new TextEncoder(),parts=[],central=[];let off=0;
 for(const e of entries){const n=enc.encode(e.name),d=e.data,crc=crc32(d),h=new DataView(new ArrayBuffer(30)),c=new DataView(new ArrayBuffer(46));
  h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(12,33,true);h.setUint32(14,crc,true);h.setUint32(18,d.length,true);h.setUint32(22,d.length,true);h.setUint16(26,n.length,true);
  c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(14,33,true);c.setUint32(16,crc,true);c.setUint32(20,d.length,true);c.setUint32(24,d.length,true);c.setUint16(28,n.length,true);c.setUint32(42,off,true);
  parts.push(h,n,d);central.push(c,n);off+=30+n.length+d.length;}
 const size=central.reduce((s,x)=>s+x.byteLength,0),end=new DataView(new ArrayBuffer(22));
 end.setUint32(0,0x06054b50,true);end.setUint16(8,entries.length,true);end.setUint16(10,entries.length,true);end.setUint32(12,size,true);end.setUint32(16,off,true);
 return new Blob([...parts,...central,end],{type:'application/zip'});}
async function zipRead(file){ // → Map(name → Blob). 파일 전체를 한 번에 읽지 않고 항목별로 잘라 읽어요
 const tail=new DataView(await file.slice(Math.max(0,file.size-65557)).arrayBuffer());let e=-1;
 for(let i=tail.byteLength-22;i>=0;i--)if(tail.getUint32(i,true)===0x06054b50){e=i;break;}
 if(e<0)throw Error('zip 파일이 아니에요');
 const count=tail.getUint16(e+10,true),cdSize=tail.getUint32(e+12,true),cdOff=tail.getUint32(e+16,true),cd=new DataView(await file.slice(cdOff,cdOff+cdSize).arrayBuffer()),dec=new TextDecoder(),out=new Map();
 for(let p=0,i=0;i<count;i++){if(cd.getUint32(p,true)!==0x02014b50)throw Error('zip 목록이 손상됐어요');
  const method=cd.getUint16(p+10,true),comp=cd.getUint32(p+20,true),nl=cd.getUint16(p+28,true),xl=cd.getUint16(p+30,true),cl=cd.getUint16(p+32,true),lo=cd.getUint32(p+42,true),name=dec.decode(new Uint8Array(cd.buffer,cd.byteOffset+p+46,nl));p+=46+nl+xl+cl;
  if(name.endsWith('/'))continue;
  const lh=new DataView(await file.slice(lo,lo+30).arrayBuffer()),start=lo+30+lh.getUint16(26,true)+lh.getUint16(28,true),raw=file.slice(start,start+comp);
  if(method===0)out.set(name,raw);
  else if(method===8&&window.DecompressionStream)out.set(name,await new Response(raw.stream().pipeThrough(new DecompressionStream('deflate-raw'))).blob());
  else throw Error('지원하지 않는 zip 압축 방식이에요: '+name);}
 return out;}

const jsonBytes=o=>new TextEncoder().encode(JSON.stringify(o,null,1));
async function dataExportZip(game,gid){ // 현재 게임 하나 → zip Blob
 const media=backupMedia(game),entries=[],meta={},files=dataSplit(game),pj=PJ(),entry=pj.list.find(x=>x.id===gid)||{id:gid,title:game.meta?.title||''};
 entries.push({name:'data/index.json',data:jsonBytes({format:'ggm-data',version:1,build:APP_BUILD,at:new Date().toISOString(),games:[entry]})});
 for(const[k,v]of Object.entries(files))entries.push({name:`data/${gid}/${k}.json`,data:jsonBytes(v)});
 const keys=[...media.images.map(x=>x.id),...media.audios.map(x=>'a_'+x.id),...media.chat];let n=0;
 for(const k of keys){syBar(`데이터 폴더: 자료 ${++n}/${keys.length}`);const b=await idbGetNS(k);if(!b)throw Error('자료 파일을 찾지 못했습니다: '+k);meta[k]={type:b.type||''};entries.push({name:`data/${gid}/media/${k}`,data:new Uint8Array(await b.arrayBuffer())});}
 entries.push({name:`data/${gid}/media.json`,data:jsonBytes(meta)});
 return zipMake(entries);}
async function dataReadZip(file){ // zip → {game, media:[{key,blob}], title}
 const z0=await zipRead(file),ixName=[...z0.keys()].filter(n=>/(^|\/)index\.json$/.test(n)&&!/\/media\//.test(n)).sort((a,b)=>a.length-b.length)[0];
 if(!ixName)throw Error('index.json이 없어요. 데이터 폴더 zip이 맞는지 확인해 주세요');
 // 압축을 풀어 고친 뒤 다시 묶으면 맨 앞에 폴더가 붙거나 data/가 빠질 수 있어요: index.json이 있는 곳을 data/로 봐요
 const base=ixName.slice(0,-'index.json'.length),z=new Map([...z0].filter(([n])=>n.startsWith(base)).map(([n,b])=>['data/'+n.slice(base.length),b]));
 const readJSON=async(name,b)=>{try{return JSON.parse(await b.text());}catch(e){throw Error(name+' 을(를) 읽지 못했어요(JSON 문법 확인): '+e.message);}};
 const index=await readJSON('index.json',z.get('data/index.json')),gid=index?.games?.[0]?.id;if(index.format!=='ggm-data'||!gid||!/^[\w-]{1,64}$/.test(gid))throw Error('데이터 폴더 정보가 올바르지 않아요');
 const files={},re=new RegExp('^data/'+gid+'/([a-z]+)\\.json$');for(const[name,b]of z){const m=name.match(re);if(m&&m[1]!=='media')files[m[1]]=await readJSON(name,b);}
 const game=dataJoin(files);if(!Array.isArray(game.chars))throw Error('chars.json이 없거나 올바르지 않아요');
 const mj=z.get(`data/${gid}/media.json`),mm=mj?await readJSON('media.json',mj):{},media=[];
 for(const[k,v]of Object.entries(mm)){if(!/^[\w-]{1,80}$/.test(k))throw Error('자료 이름이 올바르지 않아요: '+k);const b=z.get(`data/${gid}/media/${k}`);if(!b)throw Error('자료 파일이 빠졌어요: '+k);media.push({key:k,blob:new Blob([b],{type:String(v?.type||'')})});}
 return {game,media,title:index.games[0].title||game.meta?.title||'가져온 게임'};}

async function dataSaveBlob(blob,name){
 if(IS_NATIVE&&CAP&&CAP.Filesystem){const FS=CAP.Filesystem,path='가챠게임메이커/'+name;try{if(FS.requestPermissions)await FS.requestPermissions();}catch(e){}
  await FS.writeFile({path,data:String(await blobToData(blob)).split(',')[1],directory:'DOCUMENTS',recursive:true});return 'Documents/'+path;}
 if(window.showSaveFilePicker){try{const h=await showSaveFilePicker({suggestedName:name,types:[{description:'데이터 폴더 zip',accept:{'application/zip':['.zip']}}]}),w=await h.createWritable();await w.write(blob);await w.close();return h.name;}catch(e){if(e?.name==='AbortError')return null;}}
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},4000);return name;}
async function dataExport(){
 if(BACKUP_BUSY)return;BACKUP_BUSY=true;backupBusyOverlay(true);
 try{await flush();await appStorage.drain();const gid=PJ().active,game=JSON.parse(JSON.stringify(G)),blob=await dataExportZip(game,gid),
  name='ggm-data-'+String(game.meta?.title||gid).replace(/[^\w가-힣-]+/g,'_').slice(0,30)+'-'+new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')+'.zip',where=await dataSaveBlob(blob,name);
  syBar('');if(where)openModal(`${head('데이터 폴더 내보내기 완료')}<p>${esc(where)}</p><p class="muted">압축을 풀면 data/${esc(gid)}/ 안에 종류별 JSON(chars.json, chapters.json, world.json …)과 media 폴더가 있어요.</p><button class="btn" data-act="close">확인</button>`);}
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
function dataFolderBlock(){return `<section class="panel backup-block" data-backup-kind="data-folder"><h3>데이터 폴더 (종류별 JSON)</h3><p class="muted">현재 게임을 data/게임id/ 폴더 구조의 zip으로 내보내요. 캐릭터·시나리오·세계관 등이 종류별 JSON 파일로 나뉘어 있어서 직접 열어 보거나 고칠 수 있어요. 그림·음성은 media 폴더에 들어가요. 가져오면 새 게임으로 추가돼요.</p><p class="muted">PC 서버를 쓰면 같은 구조로 PC의 data 폴더에 자동으로 저장돼요.</p><div class="row"><button class="btn sm" data-act="data-save">데이터 폴더 내보내기</button><button class="btn sm ghost" data-act="data-load">데이터 폴더 가져오기</button></div></section>`;}
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;
 if(b.dataset.act==='data-save')dataExport();
 if(b.dataset.act==='data-load'){const i=document.createElement('input');i.type='file';i.accept='.zip,application/zip';i.onchange=()=>{if(i.files[0])dataImport(i.files[0]);};i.click();}});
/* /DATA_FOLDER_MODULE */
