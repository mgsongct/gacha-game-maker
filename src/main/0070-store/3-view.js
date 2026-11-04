/* ===== 0070-store — View(HTML·DOM을 만듦) ===== */
/* src/main/0070-store/0080-storage-integration.js에서 옮김 */
/* STORAGE_INTEGRATION_MODULE */
/* These hooks run in the main script's global lexical environment. */
function storageWarning(message){let el=document.getElementById('save-warning');if(!el){el=document.createElement('div');el.id='save-warning';el.setAttribute('role','alert');el.style.cssText='position:fixed;top:env(safe-area-inset-top,0px);left:8px;right:8px;z-index:2147483646;background:var(--panel,#fff);color:var(--ink,#222);border:2px solid var(--rose,#d92f5a);padding:12px;border-radius:12px';el.innerHTML='<b>저장 실패</b><p></p><button class="btn sm" type="button" data-act="saveretry">저장 다시 시도</button>';el.querySelector('b').textContent='저장 실패 · 앱을 종료하지 마세요';document.body.appendChild(el);}el.querySelector('p').textContent=message+(/다른 메이커 화면/.test(message)?' 이 화면의 미저장 변경은 진행 백업으로 따로 보관해 주세요.':' 현재 변경 내용은 아직 저장되지 않았습니다. 저장 공간을 확보하고 다시 시도하거나 진행 백업을 내보내 주세요.');}
function storageWarningClear(){ document.getElementById('save-warning')?.remove(); }
async function reloadGame(url){try{if(!window.__NOFLUSH)await flush();await appStorage.drain();if(url)location.href=url;else location.reload();}catch(e){saveFailed(e.message||'저장하지 못했습니다');}}
function art(c,cls='',opt){
  if(c.useStanding===false){const src=charSrc(c,opt?.face);return src?`<img class="art upimg ${cls}" src="${esc(src)}" alt="${esc(c.name)}" loading="lazy" draggable="false">`:`<div class="art ph ${cls}"><small>상반신 미등록</small></div>`;}
  if(opt&&opt.upper&&opt.face){ const fo=skinFaces(c).find(x=>x.name===opt.face), fu=fo&&fo.up&&imgSrc(fo.up); if(fu) return `<img class="art upimg ${cls}" src="${esc(fu)}" alt="${esc(c.name)}" loading="lazy" draggable="false">`; }
  if(opt&&opt.upper){ const sk=skinOf(c), hasFace=false, us=c.upper&&imgSrc(c.upper); // 상반신판 표정이 없으면 기본 상반신 그대로
    const sku=sk&&sk.upper&&imgSrc(sk.upper); if(sku&&!hasFace) return `<img class="art upimg ${cls}" src="${esc(sku)}" alt="${esc(c.name)}" loading="lazy" draggable="false">`;
    if(us&&!hasFace&&!(sk&&imgSrc(sk))) return `<img class="art upimg ${cls}" src="${esc(us)}" alt="${esc(c.name)}" loading="lazy" draggable="false">`; }
  const s=charSrc(c,opt&&opt.face);
  if(s) return `<img class="art ${cls}" src="${esc(s)}" alt="${esc(c.name)}" loading="lazy" draggable="false">`;
  return `<div class="art ph ${cls}" style="--ec:${ECOL[c.elem]||'var(--rose)'}"><span>${esc((c.name||'?').slice(0,1))}</span><small>스탠딩 미등록</small></div>`;
}
function battleCharacterArt(c){
 const name=c.name||'이름 없음',markup=art(c);
 return markup.includes('<img ')?markup.replace('<img ',`<img data-battle-name="${esc(name)}" `):`<div class="art v2-art-name" role="img" aria-label="${esc(name)} · 일러스트 없음">${esc(name)}</div>`;
}
function enemyArt(e,cls){const l=enemyLib(e.name), ch=G.chars.find(c=>c.name===e.name), s=(ch&&imgSrc(ch))||(l&&imgSrc(l)); return s?`<img class="en-img ${cls||''}" src="${esc(s)}" alt="${esc(e.name)}" draggable="false">`:`<div class="shape"><i></i></div>`;}
function libArt(name){
  const it=G.lib.find(l=>l.name===name);
  const s=it&&imgSrc(it);
  if(s) return `<img class="art" src="${esc(s)}" alt="${esc(name)}">`;
  if(it&&it.kind==='bg') return `<div class="art" style="${bgStyle(name)}"></div>`;
  return `<div class="art ph" style="--ec:var(--brass)"><small>${esc(name)}</small><small>이미지 미등록</small></div>`;
}
function procBg(name){
  if(procCache[name]) return procCache[name];
  let h=hash(name)||1; const R=()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return (h%10000)/10000;};
  const hue=hash(name+'h')%360;
  let svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice">';
  for(let i=0;i<40;i++) svg+=`<circle cx="${Math.round(R()*400)}" cy="${Math.round(R()*150)}" r="${(R()*1.2+.3).toFixed(1)}" fill="#fff" opacity="${(R()*.6+.2).toFixed(2)}"/>`;
  let x=0; while(x<400){const w=14+R()*30,hg=70+R()*120; svg+=`<rect x="${Math.round(x)}" y="${Math.round(300-hg)}" width="${Math.round(w)}" height="${Math.round(hg)}" fill="hsl(${hue},35%,15%)"/>`; x+=w+2;}
  x=0; while(x<400){const w=20+R()*40,hg=30+R()*90; svg+=`<rect x="${Math.round(x)}" y="${Math.round(300-hg)}" width="${Math.round(w)}" height="${Math.round(hg)}" fill="#0a0712"/>`;
    for(let k=0;k<4;k++) if(R()<.6) svg+=`<rect x="${Math.round(x+3+R()*(w-8))}" y="${Math.round(300-hg+6+R()*(hg-14))}" width="3" height="4" fill="hsl(${(hue+40)%360},90%,70%)" opacity=".8"/>`; x+=w+3;}
  svg+='</svg>';
  return procCache[name]=`url('data:image/svg+xml,${encodeURIComponent(svg)}'),linear-gradient(180deg,hsl(${hue},45%,14%),hsl(${(hue+35)%360},50%,30%) 75%,hsl(${(hue+60)%360},45%,20%))`;
}
function bgStyle(name){
  const it=G.lib.find(l=>l.kind==='bg'&&l.name===name); const s=it&&imgSrc(it);
  if(s) return `background-image:url('${s}');background-size:cover;background-position:center`;
  return `background-image:${procBg(name||'밤')};background-size:cover;background-position:center bottom`;
}
/* src/main/0070-store/0180-ui-scroll.js에서 옮김 */
function lobbyCharacterArt(c,cls='lobby-art',face=''){
 const sk=skinOf(c),faces=sk?.upper&&imgSrc(sk.upper)?sk.faces:c.faces,f=(faces||[]).find(x=>x.name===face),src=f?.up&&imgSrc(f.up)||sk?.upper&&imgSrc(sk.upper)||c.upper&&imgSrc(c.upper);
 if(sk&&c.useStanding!==false&&!imgSrcRaw(sk.upper)&&skinPreviewSrc(c,sk))return art(c,cls,{upper:true,face});
 return src?`<img class="art upimg ${cls}" src="${esc(src)}" alt="${esc(c.name)}" draggable="false">`:art(c,cls,{upper:true,face});
}
/* src/main/0070-store/0520-backup-storage.js에서 옮김 */
function backupBlocks(){return Object.entries(BACKUP_TYPES).map(([k,v])=>`<section class="panel backup-block" data-backup-kind="${k}"><h3>${v.name}</h3><p class="muted">${v.desc}</p><p class="muted">불러오기: .ggmbak 또는 이전 .json 백업을 선택하세요. 파일명 변경은 필요 없으며, 파일 내용으로 형식을 확인합니다.</p>${k==='progress'?'<p class="muted">새 기기에는 그림이 따라가지 않습니다. 자료 백업도 따로 불러오거나 전체 백업을 사용하세요.</p>':''}<div class="row"><button class="btn sm" data-act="backup-save" data-kind="${k}">${v.name} 저장</button><button class="btn sm ghost" data-act="backup-load" data-kind="${k}">${v.name} 불러오기</button></div></section>`).join('')+(typeof dataFolderBlock==='function'?dataFolderBlock():'');}
function openBackupChoice(kind){const v=BACKUP_TYPES[kind];if(!v)return;openModal(`${head(v.name+' 저장')}<p>${v.desc}</p><label class="f" for="backup-dest">저장 위치</label><select class="in" id="backup-dest">${opt_(bkDests(),bkDest())}</select>${kind!=='progress'?'<label class="f"><input type="checkbox" id="backup-voices"> 기기 전체의 생성 음성 캐시도 추가 (다른 게임의 캐시 포함, 용량 증가)</label>':''}<p class="muted">현재 선택한 게임 하나를 저장합니다. 저장 중에는 앱을 닫지 마세요. 파일 생성 완료 안내를 확인해 주세요.</p><div class="row"><button class="btn" data-act="backup-start" data-kind="${kind}">저장 시작</button><button class="btn ghost" data-act="close">취소</button></div>`);}
/* 백업 저장 완료 창 내용(View) */
function backupDoneHTML(label,result,name,kind){ return `${head(label+' 저장 완료')}<p>${esc(result.where||name)}</p><p class="muted">${BACKUP_TYPES[kind].desc}</p><button class="btn" data-act="close">확인</button>`; }
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
function backupBusyOverlay(on){let el=document.getElementById('backup-busy-lock');if(!on){if(el)el.remove();return;}if(el)return;el=document.createElement('div');el.id='backup-busy-lock';el.setAttribute('role','status');el.style.cssText='position:fixed;inset:0;z-index:2147483640;background:rgba(0,0,0,.65);display:grid;place-items:center;color:white;padding:24px;pointer-events:auto';el.innerHTML='<div><b>파일 처리 중…</b><p>완료될 때까지 앱을 닫지 마세요.</p></div>';document.body.appendChild(el);}
/* 공유 팩 저장 완료 창 내용(View) */
function shareDoneHTML(result,name){ return `${head('공유 팩 저장 완료')}<p style="overflow-wrap:anywhere">${esc(result.where||name)}</p><p>받는 사람은 패치된 메이커의 설정 → 데이터 → 공유 팩 불러오기에서 새 게임으로 추가할 수 있어요. 기존 JSON 공유팩도 같은 곳에서 불러올 수 있어요.</p><button class="btn" data-act="close">확인</button>`; }
function backupTransferStatus(message){const el=document.querySelector('#backup-busy-lock b');if(el)el.textContent=message;syBar(message);}
function exportFile(opt){ opt=opt||{}; const share=!!opt.share;
  openModal(`${head(share?'공유 팩 저장':'백업 파일 저장')}
    <label class="f" for="bk_dest">저장 위치</label><select class="in" id="bk_dest">${opt_(bkDests(),bkDest())}</select>
    ${share?'':`<label style="display:flex;gap:8px;margin-top:10px"><input type="checkbox" id="bk_voice"><span>캐릭터 음성도 넣기 <span class="muted" style="font-size:.8rem">(새 기기에서 다시 만들지 않아도 돼요. 파일이 커져요)</span></span></label>`}
    <p class="muted" style="margin:8px 0 0;font-size:.82rem">${IS_NATIVE?'문서·다운로드 폴더에 저장하면 휴대폰의 \'내 파일\' 앱에서 찾을 수 있어요. 앱을 지워도 남아요.':'PC에서는 \'직접 고르기\'로 원하는 폴더에 저장할 수 있어요.'}</p>
    <div class="row" style="margin-top:14px"><button class="btn" data-act="bkgo" data-share="${share?1:0}" data-img="${opt.img===false?0:1}" data-aud="${opt.audio?1:0}" data-gate="${opt.gate===false?0:1}">저장</button><button class="btn ghost" data-act="close">취소</button></div>`);
}
function opt_(list,v){ return list.map(([k,l])=>`<option value="${esc(k)}" ${k===v?'selected':''}>${esc(l)}</option>`).join(''); }
/* src/main/0070-store/0525-data-folder.js에서 옮김 */
async function dataExportZip(game,gid){ // 현재 게임 하나 → zip Blob
 const media=backupMedia(game),entries=[],meta={},files=dataSplit(game),pj=PJ(),entry=pj.list.find(x=>x.id===gid)||{id:gid,title:game.meta?.title||''};
 entries.push({name:'data/index.json',data:jsonBytes({format:'ggm-data',version:1,build:APP_BUILD,at:new Date().toISOString(),games:[entry]})});
 for(const[k,v]of Object.entries(files))entries.push({name:`data/${gid}/${k}.json`,data:jsonBytes(v)});
 const keys=[...media.images.map(x=>x.id),...media.audios.map(x=>'a_'+x.id),...media.chat];let n=0;
 for(const k of keys){syBar(`데이터 폴더: 자료 ${++n}/${keys.length}`);const b=await idbGetNS(k);if(!b)throw Error('자료 파일을 찾지 못했습니다: '+k);meta[k]={type:b.type||''};entries.push({name:`data/${gid}/media/${k}`,data:new Uint8Array(await b.arrayBuffer())});}
 entries.push({name:`data/${gid}/media.json`,data:jsonBytes(meta)});
 return zipMake(entries);}
/* 데이터 폴더 내보내기 완료 창 내용(View) */
function dataExportDoneHTML(where,gid){ return `${head('데이터 폴더 내보내기 완료')}<p>${esc(where)}</p><p class="muted">압축을 풀면 data/${esc(gid)}/ 안에 종류별 JSON(chars.json, chapters.json, world.json …)과 media 폴더가 있어요.</p><button class="btn" data-act="close">확인</button>`; }
function dataFolderBlock(){return `<section class="panel backup-block" data-backup-kind="data-folder"><h3>데이터 폴더 (종류별 JSON)</h3><p class="muted">현재 게임을 data/게임id/ 폴더 구조의 zip으로 내보내요. 캐릭터·시나리오·세계관 등이 종류별 JSON 파일로 나뉘어 있어서 직접 열어 보거나 고칠 수 있어요. 그림·음성은 media 폴더에 들어가요. 가져오면 새 게임으로 추가돼요.</p><p class="muted">PC 서버를 쓰면 같은 구조로 PC의 data 폴더에 자동으로 저장돼요.</p><div class="row"><button class="btn sm" data-act="data-save">데이터 폴더 내보내기</button><button class="btn sm ghost" data-act="data-load">데이터 폴더 가져오기</button></div></section>`;}
