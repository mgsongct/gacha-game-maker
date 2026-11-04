/* ===== 0030-image — Model(상태·규칙·저장·외부 서비스) ===== */
/* src/main/0030-image/010-engine.js에서 옮김 */
function charCGs(c){return G.lib.filter(l=>l.kind==='cg'&&(l.cast||[]).some(x=>x.id===c.id));}
function weaponRenameOk(o,n){o=String(o||'').trim();n=String(n||'').trim();return o.length>=3&&n&&o!==n&&!G.chars.some(c=>c.name===o)&&!(G.npcs||[]).some(x=>x.name===o);}
function regenSlot(slot){return Object.prototype.hasOwnProperty.call(GGMCombat.SLOTS,slot)?slot:'active';}
function regenSkillLabel(c,slot){const s=v2Kit(c)[regenSlot(slot)];return s.name+' — '+v2SkillText(s,regenSlot(slot));}
function regenFields(slot='active'){slot=regenSlot(slot);return [
 ['name','이름·소속',c=>c.name+' / '+(c.faction||'무소속')],['profile','프로필·비밀',c=>String(c.profile||'')],['look','외모 태그 (디자인)',c=>String(c.naiPrompt||'')],
 ['skill',GGMCombat.SLOTS[slot]+' 스킬',c=>regenSkillLabel(c,slot)],['weapon',T('weapon'),c=>c.weapon?c.weapon.name+(c.weapon.desc?' — '+c.weapon.desc:''):''],['lines','대사·반응',c=>(c.lines||[]).slice(0,3).join(' / ')]];}
function regenSourceSnapshot(c){return JSON.stringify(['name','faction','profile','intro','files','naiPrompt','naiBlocks','skill','skills','skillConcept','generation','skillTuning','skillRevisions','weapon','img','upper','illust','lbcg','pose','lbbg','scg','faces','lines','affLines','lvLines','dupLines','touch'].map(k=>[k,c[k]]));}
function regenSourceCurrent(state){return PJ().active===state.project&&charById(state.cid)===state.target&&regenSourceSnapshot(state.target)===state.snapshot;}
function regenAssertCurrent(state){if(!regenSourceCurrent(state))throw new Error('작업 중 캐릭터나 게임이 바뀌었어요. 이전 결과를 덮어쓰지 않았어요. 다시 생성해 주세요.');}
function regenCancelJob(){const job=REGEN_JOB;REGEN_JOB=null;if(job){job.controller.abort();clearInterval(job.timer);}}
function regenCancel(){if(REGEN?.committing)return false;regenCancelJob();REGEN?.controller?.abort();REGEN=null;return true;}
function regenWeaponPrompt(prompt){return joinTags('no humans, object focus',tagList(prompt).filter(t=>!(/\b(1girl|1boy|1other|2girls|2boys|solo|holding)\b/i.test(tagKey(t)))).join(', '),'simple background, white background');}
function regenParseCharacter(c,response,sel){
 const raw=response&&(Array.isArray(response.chars)?response.chars[0]:Array.isArray(response)?response[0]:response);if(!raw||typeof raw!=='object')throw new Error('캐릭터 응답이 객체가 아니에요.');const nc=clone(c);
 const text=(v,label,max=6000)=>{if(typeof v!=='string'||!v.trim())throw new Error(label+' 항목이 비어 있어요.');return v.trim().slice(0,max);};
 if(sel.name){nc.name=text(raw.name,'이름',20);if(typeof raw.faction!=='string')throw new Error('소속을 문자열로 작성해 주세요.');nc.faction=raw.faction.trim().slice(0,100);}
 if(sel.profile){nc.profile=text(raw.profile,'프로필');if(typeof raw.intro==='string')nc.intro=raw.intro.trim().slice(0,1000);if(Array.isArray(raw.files))nc.files=raw.files.filter(x=>x&&typeof x.text==='string'&&x.text.trim()).slice(0,5).map(x=>({dup:num(+x.dup,1,5,1),text:x.text.trim().slice(0,4000)}));}
 if(sel.look){nc.naiPrompt=allyTags(unFaceless(text(raw.naiPrompt,'외모 태그',4000)));const gender=tagList(c.naiPrompt).find(x=>/^(1girl|1boy|1other)$/i.test(tagKey(x)));if(gender&&!tagList(nc.naiPrompt).some(x=>/^(1girl|1boy|1other)$/i.test(tagKey(x))))nc.naiPrompt=joinTags(gender,nc.naiPrompt);}
 if(sel.weapon){if(!raw.weapon||typeof raw.weapon!=='object')throw new Error('무기 항목이 없어요.');nc.weapon={...clone(c.weapon||{}),name:text(raw.weapon.name,'무기 이름',100),desc:text(raw.weapon.desc,'무기 설명',2000),prompt:regenWeaponPrompt(text(raw.weapon.prompt,'무기 프롬프트',4000))};}
 if(sel.lines){if(!Array.isArray(raw.lines)||!raw.lines.some(x=>typeof x==='string'&&x.trim()))throw new Error('로비 대사가 없어요.');nc.lines=strs(raw.lines).slice(0,12);for(const key of ['lvLines','dupLines'])if(Array.isArray(raw[key]))nc[key]=strs(raw[key]).slice(0,4);if(raw.affLines&&typeof raw.affLines==='object'){nc.affLines={};for(const [key,value] of Object.entries(raw.affLines)){const lv=+key;if(Number.isInteger(lv)&&lv>=1&&lv<=10&&Array.isArray(value))nc.affLines[lv]=strs(value).slice(0,8);}}if(raw.touch&&typeof raw.touch==='object'){nc.touch={...nc.touch};for(const key of ['head','body','pet'])if(Array.isArray(raw.touch[key]))nc.touch[key]=strs(raw.touch[key]).slice(0,8);}}
 return nc;
}
/* 다시 만들기로 바꾼 스킬의 설계 의도(슬롯 재설계 plan)를 캐릭터에 */
function regenKeepPlan(c,nc){ if(nc.skillPlan) c.skillPlan=clone(nc.skillPlan); }
// One inventory feeds both the gallery and image download list, including skin faces and skill icons.
function charImgItems(c){if(!c)return [];const L=[],add=(k,label,o,group='기본')=>{if(o)L.push({k,label,o,group});};
 for(const [k,label,o] of [['stand','스탠딩',c],['upper','상반신',c.upper],['illust','일러스트',c.illust],['lbcg',T('limit')+' CG',c.lbcg],['scg','기술 컷인',c.scg],['pose','로비 포즈',c.pose],['lbbg','로비 배경',c.lbbg],['weapon',T('weapon'),c.weapon]])add(k,label,o);
 for(const [slot,label] of Object.entries(GGMCombat.SLOTS))add('skill:'+slot,label+' 아이콘',c.skillIcons?.[slot],'스킬 아이콘');
 for(const f of c.faces||[]){add('face:'+f.id,'표정 '+f.name,f,'표정');add('faceup:'+f.id,'표정 '+f.name+' (상반신)',f.up,'표정');}
 for(const k of c.skins||[]){const group=T('skin')+' · '+k.name;add('skin:'+k.id,k.name+' 스탠딩',k,group);for(const part of ['upper','illust','lbcg'])add('skin'+part+':'+k.id,k.name+' '+(SKP[part]||part),k[part],group);for(const f of k.faces||[]){add('skinface:'+f.id,k.name+' · '+f.name,f,group);add('skinfaceup:'+f.id,k.name+' · '+f.name+' (상반신)',f.up,group);}}
 for(const o of Object.values(c.cards||{}))add('card:'+o.id,o.name||'카드',o,'카드');return L;
}
function ultimateSceneTags(c){const type=v2Kit(c).ultimate.effects?.[0]?.type;return ['heal','regen','support'].includes(type)?'healing magic, gentle light':['shield','reduction','block','invincible'].includes(type)?'protective barrier, radiant aura':'attacking, special effects';}
function ultimateSceneSnapshot(c){return JSON.stringify([v2Kit(c).ultimate,c.name,c.faction,c.profile,c.naiPrompt,c.weapon?.name,c.weapon?.desc,c.weapon?.prompt,c.scg]);}
async function requestUltimateScene(c,instructions='',signal){
 if(!SAMPLE)throw new Error('기술 컷인 장면을 구성하려면 설정 → 글 AI를 먼저 등록해 주세요.');
 const s=v2Kit(c).ultimate,context={name:c.name,profile:c.profile,appearance:c.naiPrompt,weapon:{name:c.weapon?.name,description:c.weapon?.desc,prompt:c.weapon?.prompt},ultimate:{name:s.name,description:v2SkillText(s,'ultimate'),effects:s.effects,fx:s.fx}};
 const response=await v2SkillRequest(SAMPLE,requestUltimateScenePrompt({context,instructions}),signal);
 if(typeof response?.tags!=='string'||!response.tags.trim())throw new Error('AI가 기술 컷인 장면을 비워서 반환했어요. 다시 뽑기를 눌러 주세요.');
 return response.tags.trim().slice(0,2000);
}
function illustrationScenePreparation(c,kind,custom){
 const project=PJ().active,target=c[kind],snapshot=JSON.stringify([c.profile,c.naiPrompt,c.faction,target,G.world.summary]);
 const check=()=>{if(PJ().active!==project||charById(c.id)!==c||JSON.stringify([c.profile,c.naiPrompt,c.faction,c[kind],G.world.summary])!==snapshot)throw new Error('캐릭터나 이미지 설정이 바뀌었어요. 창을 다시 열어 생성해 주세요.');};
 const prepare=async(cfg,progress,signal)=>{
  check();if(cfg.sceneReady)return;if(!SAMPLE)throw new Error('설정 → 글 AI를 먼저 등록해 주세요.');
  progress(kind==='lbcg'?'캐릭터·세계관을 바탕으로 최대 돌파 CG 장면 구성 중':'캐릭터·세계관을 바탕으로 일러스트 장면 구성 중');
  const purpose=illustrationScenePreparationPurposeText({kind});
  const response=await v2SkillRequest(SAMPLE,illustrationScenePreparationPrompt({c,purpose,cfg}),signal);
  check();if(typeof response?.tags!=='string'||!response.tags.trim())throw new Error('AI가 장면을 비워서 반환했어요. 다시 뽑기를 눌러 주세요.');
  cfg.sceneTags=response.tags.trim().slice(0,2000);
  cfg.prompt=composeNai(kind,joinTags(c.naiPrompt,designTags(c),cfg.sceneTags),{pose:custom.scenePose??'',frame:custom.sceneFrame||target.naiFrame,styleId:custom.sceneStyle||target.naiStyle||c.naiStyle}).input;
  cfg.sceneReady=true;
 };
 prepare.check=check;return prepare;
}
/* /CHARACTER_REGEN_MODULE */
function designFacs(){ const n=f=>G.chars.filter(c=>c.faction===f&&!c.collab).length; return [...new Set([...((G.world&&G.world.factions)||[]).map(f=>f.name),...G.chars.map(c=>c.faction)].filter(Boolean))].sort((a,b)=>n(b)-n(a)); }
// 무기 프롬프트 검사: 사람 태그가 섞였거나 '물건 사진'으로 시작하지 않으면 정리가 필요해요 (PR #3 LTXY12님 아이디어)
function wpBad(p){ const s=String(p||'').trim(); if(!s) return false; return /\b(1girl|1boy|1other|2girls|2boys|solo|holding)\b/i.test(s)||!/^(no humans|object focus)/i.test(s); }
async function weaponPromptAI(list,rep,world){ const w=world||G.world; const v=weaponPromptAIVText({list});
  const r=await aiJSON(weaponPromptAIPrompt({w,v}),rep||null,'quick');
  const out=list.map(()=>''); (r&&Array.isArray(r.weapons)?r.weapons:[]).forEach(x=>{ const i=list.findIndex(y=>y.c.name===String(x&&x.name||'').trim()), p=String((x&&x.prompt)||'').trim(); const k=i>=0?i:(list.length===1?0:-1); if(k>=0&&p&&!wpBad(p)) out[k]=p; }); return out; }
async function fixWeaponPrompts(chars,world){ try{ const bad=(chars||[]).filter(c=>c&&c.weapon&&wpBad(c.weapon.prompt)); if(!bad.length) return 0; const out=await weaponPromptAI(bad.map(c=>({c,name:c.weapon.name,desc:c.weapon.desc,cur:c.weapon.prompt})),null,world); let n=0; bad.forEach((c,i)=>{ if(out[i]){ c.weapon.prompt=out[i]; try{ mark('c:'+c.id); }catch(e){} n++; } }); return n; }catch(e){ return 0; } }
function allyTags(s){ const L=tagList(s), en=L.some(t=>/^faceless$/i.test(tagKey(t))); return en?L.filter(t=>!/^(faceless|1other|no humans)$/i.test(tagKey(t))).join(', '):String(s||''); }
function charCaption(c,act){return joinTags(tagList(c.naiPrompt).filter(t=>{const k=tagKey(t);return !COMPO_TAGS.test(k)&&!FRAME_TAGS.test(k)&&!/^(1girl|1boy|solo|\d+girls|\d+boys|mature female|adult woman)$/.test(k);}).join(', '),designTags(c),act);}
function naiDraw(kind,base,opt){
  opt=opt||{};
  if(kind==='cg'){ const p=composeCG(opt.item||{},opt); return naiGenerate(p.input,'cg',Object.assign({},opt,{neg:p.neg,chars:p.chars})); }
  const k=kind==='weapon'?'prop':kind, p=composeNai(k,base,opt); return naiGenerate(p.input,k,Object.assign({},opt,{neg:p.neg}));
}
// 스탠딩 레퍼런스: 설정에서 켜면 일러스트·CG(+스킬 컷인·상반신)를 그릴 때 그 캐릭터의 스탠딩을 캐릭터 레퍼런스로 넣어 얼굴·머리를 맞춰요(V4.5로 그려요)
function autoRefOn(k){ const m=naiCfg().autoRef; if(imgProvider()==='comfy'||!m||m==='off') return false; return ['illust','lbcg','cg'].includes(k)||(m==='all'&&['scg','upper'].includes(k)); }
async function standRefs(cs){ const rf=naiCfg().ref||NAI_DEF.ref, out=[]; for(const c of cs){ const src=c&&imgSrc(c); if(!src) continue; try{ out.push({image:await refImage(src),type:rf.type||'character',strength:rf.strength!=null?rf.strength:1,fidelity:rf.fidelity!=null?rf.fidelity:1}); }catch(e){ quietErr(e,'0030-image/010-engine.js:181'); } if(out.length>=4) break; } return out; }
async function naiDrawItem(it){
  const candidateEligible=imageCandidateEligible(it.k,it.o,it.c,it.generationMode||'automatic'),originalSrc=imgSrcRaw(it.o)||'';
  if(autoRefOn(it.k)){ const cs=it.k==='cg'?cgCast(it.o).map(x=>x.c):[it.c], refs=await standRefs(cs); if(refs.length) return naiDrawItem0(it,{refs,candidateEligible,originalSrc}); }
  return naiDrawItem0(it,{candidateEligible,originalSrc});
}
function naiDrawItem0(it,X){
  const draw=(kind,base,opt={})=>naiDraw(kind,base,{...opt,candidateEligible:X.candidateEligible,originalSrc:X.originalSrc});
  if((it.k==='prop'||it.k==='bg'||(it.k==='enemy'&&!it.o.alias))&&!it.o.prompt) return ensureLibPrompts().then(()=>draw(it.k,it.o.prompt));
  if(it.k==='upper'){ const c=it.c; return draw('char',joinTags(c.naiPrompt,designTags(c),it.o.prompt),Object.assign({frame:'cowboy shot',pose:'looking at viewer, smile',styleId:c.naiStyle},X)); }
  if(it.k==='lbbg'){ const c=it.c; return draw('bg',it.o.prompt||(c.illust&&c.illust.prompt)||'cozy room interior, window, soft light',{}); }
  if(it.k==='pose'){ const c=it.c; return draw('char',joinTags(c.naiPrompt,designTags(c),it.o.prompt),{frame:'cowboy shot',pose:it.o.prompt?'':'dynamic pose, looking at viewer, smile, hand up, white background, simple background',styleId:c.naiStyle}); }
  if(it.k==='scg'){ const c=it.c; return draw('illust',joinTags(c.naiPrompt,designTags(c),it.o.prompt),Object.assign({pose:it.o.prompt?'special effects, motion lines':ultimateSceneTags(c)+', special effects',styleId:c.naiStyle,frame:'upper body'},X)); }
  if(it.k==='illust'||it.k==='lbcg'){ const c=it.c; return draw(it.k,joinTags(c.naiPrompt,designTags(c),it.o.prompt),Object.assign({pose:it.o.naiPose!=null?it.o.naiPose:undefined,styleId:c.naiStyle,frame:it.o.naiFrame},X)); }
  if(it.k==='cg') return draw('cg',null,Object.assign({item:it.o,styleId:it.o.naiStyle},X));
  if(it.k==='char') return draw('char',joinTags(it.o.naiPrompt,designTags(it.o)),{pose:it.o.naiPose||undefined,styleId:it.o.naiStyle,frame:it.o.naiFrame});
  return draw(it.k==='weapon'?'weapon':it.k,it.o.prompt);
}
function naiErr(e,label){
  if(e&&/update to the image URL|refresh NovelAI/i.test(e.message||'')) return 'NovelAI 옛 서버 주소로 요청했어요. 설정의 그림 AI에서 생성 주소를 '+NAI_ENDPOINT+' 로 바꿔 주세요.';
  if(!IS_NATIVE&&e&&e.code==='network'&&e.message) return (label?label+'. ':'')+e.message;
  if(imgProvider()==='comfy'&&e&&e.code==='network') return 'ComfyUI 서버에 연결하지 못했어요. PC에서 --listen 옵션으로 켰는지, 같은 와이파이인지, 주소(http://PC주소:8188)를 확인해 주세요.';
  const m={comfy_nourl:'설정의 그림 AI에서 ComfyUI 주소를 넣어 주세요.',comfy_wf:'ComfyUI 워크플로 문제: '+((e&&e.message)||''),comfy_err:'ComfyUI 오류: '+((e&&e.message)||''),comfy_timeout:'ComfyUI가 시간 안에 그림을 끝내지 못했어요. 설정에서 대기 시간을 늘려 보세요.',nai_locked:'NovelAI에서 다른 생성이 진행 중이에요. 잠시 뒤 다시 시도해 주세요.',nai_empty:'NovelAI 응답에 이미지가 없어요.',bad_key:'NovelAI 토큰이 올바르지 않아요. 설정의 그림 AI에서 확인해 주세요.',low_credit:'Anlas가 부족하거나 구독이 필요해요.',rate_limited:'NovelAI가 바빠요. 다른 생성이 끝난 뒤 다시 시도해 주세요.',network:'인터넷 연결을 확인해 주세요. 웹 버전에서는 그림 AI가 안 될 수 있어요.',nai_zip:'NovelAI 응답을 풀지 못했어요.',nai_nokey:'설정의 그림 AI에 NovelAI 토큰을 넣어 주세요.'};
  return m[e&&e.code]||((label||'그림 생성 실패')+'. '+((e&&e.message)||''));
}
function loadImg(src){return new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=rej;im.src=src;});}
async function imgB64(src,W,H,bg){
  const im=await loadImg(src), cv=document.createElement('canvas'); cv.width=W; cv.height=H; const x=cv.getContext('2d');
  x.fillStyle=bg; x.fillRect(0,0,W,H); const s=Math.min(W/im.width,H/im.height), w=im.width*s, h=im.height*s;
  x.drawImage(im,(W-w)/2,(H-h)/2,w,h); return cv.toDataURL('image/png').split(',')[1];
}
async function naiEmotion(src,emo,extra,level){
  const c=naiCfg(); if(!c.key) throw {code:'nai_nokey'};
  const image=await imgB64(src,832,1216,'#ffffff');
  const r=await http(naiBase(c)+'/ai/augment-image',{method:'POST',headers:NAI_HDR(c.key),body:{req_type:'emotion',width:832,height:1216,image,prompt:`${emo};;${extra||''}`,defry:level||0},binary:true,timeout:180000});
  if(r.status>=400||!r.bytes) throw errOf(r);
  let blob=new Blob([await unzipFirst(r.bytes)],{type:'image/png'});
  if(c.cutout) blob=await cutoutWhite(blob);
  return blob;
}
function imgType(u8){if(!u8||u8.length<12)return '';if(u8[0]===0x89&&u8[1]===0x50)return 'image/png';if(u8[0]===0xFF&&u8[1]===0xD8)return 'image/jpeg';if(u8[0]===0x52&&u8[1]===0x49&&u8[8]===0x57&&u8[9]===0x45)return 'image/webp';return '';}
async function naiDecode(u8,ct){
  const t=String(ct||'').split(';')[0].trim().toLowerCase();
  if(/^image\/(png|jpe?g|webp)$/.test(t)) return {bytes:u8,type:t==='image/jpg'?'image/jpeg':t};
  const ty=imgType(u8); if(ty) return {bytes:u8,type:ty};
  const inner=await unzipFirst(u8); return {bytes:inner,type:imgType(inner)||'image/png'};
}
async function refImage(src){
  const im=await loadImg(src), w=im.naturalWidth||im.width, h=im.naturalHeight||im.height, r=w&&h?w/h:2/3;
  const [W,H]=[[1024,1536],[1536,1024],[1472,1472]].sort((a,b)=>Math.abs(r-a[0]/a[1])-Math.abs(r-b[0]/b[1]))[0];
  return imgB64(src,W,H,'#000000');
}
function retryAfterMs(h){const v=String((h||{})['retry-after']||'').trim();if(!v)return 0;const n=Number(v);if(isFinite(n))return Math.max(0,n*1000);const d=Date.parse(v);return isFinite(d)?Math.max(0,d-Date.now()):0;}
async function unzipFirst(u8){
  if(imgType(u8)) return u8;
  const dv=new DataView(u8.buffer,u8.byteOffset,u8.byteLength);
  let e=u8.length-22; while(e>=0&&dv.getUint32(e,true)!==0x06054b50) e--;
  if(e<0) throw {code:'nai_zip'};
  const cd=dv.getUint32(e+16,true); if(dv.getUint32(cd,true)!==0x02014b50) throw {code:'nai_zip'};
  const method=dv.getUint16(cd+10,true), csize=dv.getUint32(cd+20,true), lho=dv.getUint32(cd+42,true);
  const st=lho+30+dv.getUint16(lho+26,true)+dv.getUint16(lho+28,true), data=u8.subarray(st,st+csize);
  if(method===0) return data;
  if(method===8&&typeof DecompressionStream!=='undefined'){ const out=await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer(); return new Uint8Array(out); }
  throw {code:'nai_zip'};
}
async function unzipAll(u8){
  if(imgType(u8)) return [u8];
  const dv=new DataView(u8.buffer,u8.byteOffset,u8.byteLength);
  let e=u8.length-22; while(e>=0&&dv.getUint32(e,true)!==0x06054b50) e--;
  if(e<0) throw {code:'nai_zip'};
  const n=dv.getUint16(e+10,true); let cd=dv.getUint32(e+16,true); const out=[];
  for(let k=0;k<n;k++){
    if(dv.getUint32(cd,true)!==0x02014b50) break;
    const method=dv.getUint16(cd+10,true), csize=dv.getUint32(cd+20,true), lho=dv.getUint32(cd+42,true), next=cd+46+dv.getUint16(cd+28,true)+dv.getUint16(cd+30,true)+dv.getUint16(cd+32,true);
    const st=lho+30+dv.getUint16(lho+26,true)+dv.getUint16(lho+28,true), data=u8.subarray(st,st+csize);
    if(method===0) out.push(data);
    else if(method===8&&typeof DecompressionStream!=='undefined') out.push(new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()));
    cd=next;
  }
  if(!out.length) throw {code:'nai_zip'};
  return out;
}
/* border: share of border pixels that are transparent, solid: share of all pixels that are mostly opaque */
async function alphaInfo(blob){
  try{ const bmp=await createImageBitmap(blob), W=bmp.width, H=bmp.height, cv=document.createElement('canvas'); cv.width=W; cv.height=H;
    const x=cv.getContext('2d',{willReadFrequently:true}); x.drawImage(bmp,0,0); const d=x.getImageData(0,0,W,H).data; let n=0,t=0,s=0,m=0;
    for(let i=0;i<W;i+=3){n+=2; if(d[i*4+3]<24)t++; if(d[((H-1)*W+i)*4+3]<24)t++;} for(let j=0;j<H;j+=3){n+=2; if(d[(j*W)*4+3]<24)t++; if(d[(j*W+W-1)*4+3]<24)t++;}
    for(let p=3;p<d.length;p+=64){m++; if(d[p]>128)s++;}
    return {border:n?t/n:0,solid:m?s/m:1}; }catch(e){ return {border:0,solid:1}; }
}
async function alphaBorder(blob){
  try{ const bmp=await createImageBitmap(blob), W=bmp.width, H=bmp.height, cv=document.createElement('canvas'); cv.width=W; cv.height=H;
    const x=cv.getContext('2d',{willReadFrequently:true}); x.drawImage(bmp,0,0); const d=x.getImageData(0,0,W,H).data; let n=0,t=0;
    const at=(px,py)=>{n++; if(d[(py*W+px)*4+3]<24) t++;};
    for(let i=0;i<W;i+=3){at(i,0);at(i,H-1);} for(let j=0;j<H;j+=3){at(0,j);at(W-1,j);}
    return n?t/n:0; }catch(e){ return 0; }
}
async function naiBgRemove(src){
  const c=naiCfg(); if(!c.key) throw {code:'nai_nokey'};
  const im=await loadImg(src), iw=im.naturalWidth||im.width, ih=im.naturalHeight||im.height, r=iw&&ih?iw/ih:2/3;
  let W,H; if(iw%64===0&&ih%64===0&&iw*ih<=1024*1536){W=iw;H=ih;} else [W,H]=[[832,1216],[1216,832],[1024,1024],[896,1152],[1152,896]].sort((a,b)=>Math.abs(r-a[0]/a[1])-Math.abs(r-b[0]/b[1]))[0];
  const image=await imgB64(src,W,H,'#ffffff');
  const res=await http(naiBase(c)+'/ai/augment-image',{method:'POST',headers:NAI_HDR(c.key),body:{req_type:'bg-removal',width:W,height:H,image},binary:true,timeout:180000});
  if(res.status>=400||!res.bytes) throw errOf(res);
  const files=await unzipAll(res.bytes); let best=null,bs=-1;
  for(const f of files){ const b=new Blob([f],{type:imgType(f)||'image/png'}); const s=await alphaBorder(b); if(s>bs){bs=s;best=b;} }
  if(!best||bs<0.3) throw {code:'nai_empty',message:'투명 배경 결과를 찾지 못했어요'};
  return best;
}
/* eyedropper on raw pixels: remove the colour under (px,py). mode 'wand' = connected area only, 'all' = that colour everywhere */
function eraseColorData(id,W,H,px,py,o){
  o=Object.assign({tol:24,soft:14,mode:'wand'},o||{}); const d=id.data, N=W*H;
  px=Math.max(0,Math.min(W-1,Math.round(px))); py=Math.max(0,Math.min(H-1,Math.round(py)));
  let r=0,g=0,b=0,n=0; for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){const X=px+dx,Y=py+dy; if(X<0||Y<0||X>=W||Y>=H) continue; const i=(Y*W+X)*4; if(d[i+3]<40) continue; r+=d[i];g+=d[i+1];b+=d[i+2];n++;}
  if(!n) return {removed:0,color:null};
  r/=n; g/=n; b/=n;
  const T=o.tol, S=Math.max(1,o.soft), lim=T+S;
  const dist=p=>{const i=p*4; if(d[i+3]<8) return 999; const a=d[i]-r,c=d[i+1]-g,e=d[i+2]-b; return Math.sqrt(a*a+c*c+e*e);};
  const kill=new Uint8Array(N); let removed=0;
  if(o.mode==='all'){ for(let p=0;p<N;p++) if(dist(p)<=T){kill[p]=1;removed++;} }
  else{ const q=new Int32Array(N); let qh=0,qt=0; const s0=py*W+px;
    if(dist(s0)<=T){ kill[s0]=1; q[qt++]=s0; removed++; }
    while(qh<qt){const p=q[qh++],X=p%W; const nb=[X>0?p-1:-1,X<W-1?p+1:-1,p>=W?p-W:-1,p<N-W?p+W:-1];
      for(const m of nb){ if(m>=0&&!kill[m]&&dist(m)<=T){kill[m]=1;removed++;q[qt++]=m;} } } }
  if(!removed) return {removed:0,color:[r,g,b]};
  const band=new Uint8Array(N);
  for(let pass=1;pass<=2;pass++) for(let p=0;p<N;p++){ if(kill[p]||band[p]) continue; const X=p%W, prev=pass===1?(m=>kill[m]):(m=>band[m]===1);
    if((X>0&&prev(p-1))||(X<W-1&&prev(p+1))||(p>=W&&prev(p-W))||(p<N-W&&prev(p+W))) band[p]=pass; }
  for(let p=0,i=0;p<N;p++,i+=4){
    if(kill[p]){d[i+3]=0;continue;}
    if(band[p]){ const dd=dist(p); if(dd>=lim) continue; let a=(dd-T)/S; a=Math.max(0.1,Math.min(1,a)); const k=1/a;
      d[i]=Math.max(0,Math.min(255,Math.round((d[i]-(1-a)*r)*k))); d[i+1]=Math.max(0,Math.min(255,Math.round((d[i+1]-(1-a)*g)*k))); d[i+2]=Math.max(0,Math.min(255,Math.round((d[i+2]-(1-a)*b)*k)));
      d[i+3]=Math.round(d[i+3]*a); }
  }
  return {removed,color:[r,g,b]};
}
function cutCtx(){const j=CUTJOB;return j&&j.cv?j.cv.getContext('2d',{willReadFrequently:true}):null;}
function cutBlob(){const j=CUTJOB;return new Promise(r=>j.cv.toBlob(b=>r(b),'image/png'));}
function cutCfg(){const c=naiCfg();return Object.assign({},CUT_DEF,c.cut||{});}
async function cutoutWhite(blob,o){
  try{
    o=Object.assign(cutCfg(),o||{});
    const bmp=await createImageBitmap(blob), W=bmp.width, H=bmp.height, N=W*H;
    const cv=document.createElement('canvas'); cv.width=W; cv.height=H; const x=cv.getContext('2d',{willReadFrequently:true}); x.drawImage(bmp,0,0);
    const id=x.getImageData(0,0,W,H), d=id.data;
    // 1. background colour = median of the border ring (works for white, off-white and light grey)
    const ring=[]; const R=Math.max(2,Math.round(Math.min(W,H)*0.01));
    for(let y=0;y<H;y+=2) for(let k=0;k<R;k++){ring.push((y*W+k)*4,(y*W+W-1-k)*4);}
    for(let xx=0;xx<W;xx+=2) for(let k=0;k<R;k++){ring.push((k*W+xx)*4,((H-1-k)*W+xx)*4);}
    const med=ch=>{const a=ring.map(i=>d[i+ch]).sort((p,q)=>p-q);return a[a.length>>1];};
    const br=med(0),bgc=med(1),bb=med(2);
    // distance from background colour (perceptual-ish)
    const dist=new Uint8Array(N);
    for(let p=0,i=0;p<N;p++,i+=4){const dr=d[i]-br,dg=d[i+1]-bgc,db=d[i+2]-bb;dist[p]=Math.min(255,Math.round(Math.sqrt(dr*dr+dg*dg+db*db)));}
    const T=o.tol, S=Math.max(1,o.soft);
    // 2. flood fill background reachable from the border (4-neighbour)
    const bgm=new Uint8Array(N), q=new Int32Array(N); let qh=0,qt=0;
    const push=p=>{if(!bgm[p]&&dist[p]<=T){bgm[p]=1;q[qt++]=p;}};
    for(let i=0;i<W;i++){push(i);push((H-1)*W+i);} for(let j=0;j<H;j++){push(j*W);push(j*W+W-1);}
    while(qh<qt){const p=q[qh++],px=p%W;if(px>0)push(p-1);if(px<W-1)push(p+1);if(p>=W)push(p-W);if(p<N-W)push(p+W);}
    if(qt<N*0.08) return blob;
    // 2b. soft grey shadows on the floor that touch the background (low chroma, slightly darker than bg)
    if(o.shadow){
      const bl=br*0.3+bgc*0.59+bb*0.11; qh=0; let qt2=0;
      const y0=Math.floor(H*0.7)*W;
      const sh=p=>{if(p<y0)return false;const i=p*4,mx=Math.max(d[i],d[i+1],d[i+2]),mn=Math.min(d[i],d[i+1],d[i+2]),l=d[i]*0.3+d[i+1]*0.59+d[i+2]*0.11;return mx-mn<=24&&l<=bl+4&&l>=bl-95;};
      for(let p=0;p<N;p++) if(bgm[p]){const px=p%W;const nb=[px>0?p-1:-1,px<W-1?p+1:-1,p>=W?p-W:-1,p<N-W?p+W:-1];for(const n of nb){if(n>=0&&!bgm[n]&&sh(n)){bgm[n]=1;q[qt2++]=n;}}}
      while(qh<qt2){const p=q[qh++],px=p%W;const nb=[px>0?p-1:-1,px<W-1?p+1:-1,p>=W?p-W:-1,p<N-W?p+W:-1];for(const n of nb){if(n>=0&&!bgm[n]&&sh(n)){bgm[n]=1;q[qt2++]=n;}}}
    }
    // 3. enclosed holes (between arms, under hair) that match the background closely
    if(o.holes){
      const lab=new Uint8Array(N), minHole=Math.max(60,N*0.0006), Th=Math.max(6,Math.round(T*0.55));
      for(let s0=0;s0<N;s0++){ if(bgm[s0]||lab[s0]||dist[s0]>Th) continue;
        qh=0;qt=0;q[qt++]=s0;lab[s0]=1;
        while(qh<qt){const p=q[qh++],px=p%W;const nb=[px>0?p-1:-1,px<W-1?p+1:-1,p>=W?p-W:-1,p<N-W?p+W:-1];for(const n of nb){if(n>=0&&!lab[n]&&!bgm[n]&&dist[n]<=Th){lab[n]=1;q[qt++]=n;}}}
        if(qt>=minHole){ let m=0,m2=0; for(let k=0;k<qt;k++){const i=q[k]*4,l=d[i]*0.3+d[i+1]*0.59+d[i+2]*0.11;m+=l;m2+=l*l;} m/=qt; const sd=Math.sqrt(Math.max(0,m2/qt-m*m)); if(sd<=2.2) for(let k=0;k<qt;k++) bgm[q[k]]=1; }
      }
    }
    // 4. remove small floating specks of foreground
    if(o.despeck){
      const lab=new Uint8Array(N), minObj=Math.max(40,N*0.0015);
      for(let s0=0;s0<N;s0++){ if(bgm[s0]||lab[s0]) continue;
        qh=0;qt=0;q[qt++]=s0;lab[s0]=1;
        while(qh<qt){const p=q[qh++],px=p%W;const nb=[px>0?p-1:-1,px<W-1?p+1:-1,p>=W?p-W:-1,p<N-W?p+W:-1];for(const n of nb){if(n>=0&&!lab[n]&&!bgm[n]){lab[n]=1;q[qt++]=n;}}}
        if(qt<minObj) for(let k=0;k<qt;k++) bgm[q[k]]=1;
      }
    }
    // 5. alpha: background transparent, soft matte on the boundary band, colour decontamination
    const near=new Uint8Array(N); // distance (in px, up to 3) from the background region
    for(let p=0;p<N;p++) if(bgm[p]) near[p]=1;
    for(let pass=2;pass<=3;pass++){ for(let p=0;p<N;p++){ if(near[p]) continue; const px=p%W;
      if((px>0&&near[p-1]===pass-1)||(px<W-1&&near[p+1]===pass-1)||(p>=W&&near[p-W]===pass-1)||(p<N-W&&near[p+W]===pass-1)) near[p]=pass; } }
    for(let p=0,i=0;p<N;p++,i+=4){
      if(bgm[p]){d[i+3]=0;continue;}
      if(near[p]>=2&&near[p]<=3){
        let a=(dist[p]-T)/S; a=a<=0?0.08:a>=1?1:a; if(near[p]===2) a=Math.min(a,0.92);
        d[i+3]=Math.round(255*a);
        if(a<1){const k=1/a; d[i]=Math.max(0,Math.min(255,Math.round((d[i]-(1-a)*br)*k))); d[i+1]=Math.max(0,Math.min(255,Math.round((d[i+1]-(1-a)*bgc)*k))); d[i+2]=Math.max(0,Math.min(255,Math.round((d[i+2]-(1-a)*bb)*k)));}
      }
    }
    x.putImageData(id,0,0);
    return await new Promise(r=>cv.toBlob(b=>r(b||blob),'image/png'));
  }catch(e){ return blob; }
}
/* ---- ComfyUI (local / remote server) ---- */
function imgProvider(){return naiCfg().provider==='comfy'?'comfy':'nai';}
function comfyCfg(){return Object.assign({url:'',wf:'',timeoutSec:300,qtags:COMFY_TAGS_DEF.qtags,neg:COMFY_TAGS_DEF.neg},naiCfg().comfy||{});}
function imgReady(){return imgProvider()==='comfy'?!!(comfyCfg().url&&comfyCfg().wf):!!naiCfg().key;}
function imgNeed(){return imgProvider()==='comfy'?'설정의 그림 AI에서 ComfyUI 주소와 워크플로를 넣어 주세요':'설정의 그림 AI에 NovelAI 토큰을 넣어 주세요';}
function sdTags(s){return String(s||'').replace(/(-?\d+(?:\.\d+)?)::\s*([^:]+?)\s*::/g,(m,w,t)=>`(${t}:${(+w).toFixed(2)})`);}
function comfyBind(wf,v){
  const tt=id=>String((wf[id]._meta&&wf[id]._meta.title)||'').trim().toLowerCase();
  const by=t=>Object.keys(wf).filter(id=>tt(id)==='[ggm:'+t+']'||tt(id)==='[assetmaid:'+t+']');
  let P=by('positive'), N=by('negative'), S=by('size'), SD=[...by('seed'),...by('seed-progress')]; const O=by('output');
  const ks=Object.keys(wf).find(id=>/KSampler|SamplerCustom/i.test(wf[id].class_type||''));
  if(ks){ const k=wf[ks].inputs||{};
    if(!P.length&&Array.isArray(k.positive)) P=[String(k.positive[0])];
    if(!N.length&&Array.isArray(k.negative)) N=[String(k.negative[0])];
    if(!S.length&&Array.isArray(k.latent_image)) S=[String(k.latent_image[0])];
    if(!SD.length) SD=[ks]; }
  if(!P.length) throw {code:'comfy_wf',message:'프롬프트를 넣을 노드를 찾지 못했어요. 프롬프트 노드 제목을 [GGM:positive]로 바꿔 주세요.'};
  const setT=(id,val)=>{const inp=(wf[id]||{}).inputs; if(!inp) return; const k=['text','value','string','prompt','text_g'].find(k=>k in inp&&!Array.isArray(inp[k]))||['text','value'].find(k=>k in inp)||'text'; inp[k]=val; if('text_l' in inp&&!Array.isArray(inp.text_l)) inp.text_l=val;};
  P.forEach(id=>setT(id,v.pos)); N.forEach(id=>setT(id,v.neg));
  S.forEach(id=>{const inp=(wf[id]||{}).inputs||{}; if('width' in inp) inp.width=v.w; if('height' in inp) inp.height=v.h;});
  SD.forEach(id=>{const inp=(wf[id]||{}).inputs||{}; const k=['seed','noise_seed','value'].find(k=>k in inp&&!Array.isArray(inp[k])); if(k) inp[k]=v.seed;});
  return O[0]||null;
}
async function comfyGenerate(prompt,kind,opts){
  opts=opts||{}; const cc=comfyCfg(), c=naiCfg(); if(!cc.url) throw {code:'comfy_nourl'};
  let wf; try{ wf=JSON.parse(cc.wf); }catch(e){ throw {code:'comfy_wf',message:'워크플로 JSON을 읽지 못했어요'}; }
  if(!wf||Array.isArray(wf.nodes)) throw {code:'comfy_wf',message:'ComfyUI에서 "Export (API)"로 저장한 워크플로를 넣어 주세요'};
  const [w,h]=opts.size||naiSize(kind,c);
  const seed=opts.seed!=null&&String(opts.seed).trim()!==''?(Math.floor(+opts.seed)>>>0):Math.floor(Math.random()*4294967295); opts.usedSeed=seed; opts.usedModel='ComfyUI';
  const pos=sdTags(joinTags(prompt,cc.qtags)), neg=sdTags(joinTags(opts.neg!=null?opts.neg:c.neg,cc.neg));
  const outNode=comfyBind(wf,{pos,neg,w,h,seed}), base=cc.url.trim().replace(/\/+$/,'');
  const r=await http(base+'/prompt',{method:'POST',headers:{'Content-Type':'application/json'},body:{prompt:wf,client_id:'ggm'+uid()},timeout:30000});
  let j; try{ j=JSON.parse(r.text||(r.bytes?new TextDecoder().decode(r.bytes):'')); }catch(e){ j={}; }
  if(r.status>=400||!j.prompt_id) throw {code:'comfy_err',message:String((j.error&&(j.error.message||j.error))||JSON.stringify(j.node_errors||j)).slice(0,240)};
  const pid=j.prompt_id, t0=Date.now(); let out=null, n=0;
  while(Date.now()-t0<num(cc.timeoutSec,30,1200,300)*1000){
    await wait(1500); n++; if(opts.onRetry&&n%4===0) opts.onRetry(Math.round((Date.now()-t0)/1000),0,'ComfyUI 생성 중');
    let hj; try{ hj=okJSON(await http(base+'/history/'+pid,{timeout:20000})); }catch(e){ continue; }
    const it=hj&&hj[pid]; if(!it) continue;
    if(it.status&&it.status.status_str==='error') throw {code:'comfy_err',message:'워크플로 실행 중 오류가 났어요'};
    const imgs=[]; Object.entries(it.outputs||{}).forEach(([nid,o])=>(o.images||[]).forEach(im=>imgs.push(Object.assign({nid},im))));
    out=imgs.find(x=>outNode&&x.nid===outNode)||imgs.find(x=>x.type==='output')||imgs[0]; if(out) break;
  }
  if(!out) throw {code:'comfy_timeout'};
  const vr=await http(`${base}/view?filename=${encodeURIComponent(out.filename)}&subfolder=${encodeURIComponent(out.subfolder||'')}&type=${encodeURIComponent(out.type||'output')}`,{binary:true,timeout:90000});
  if(vr.status>=400||!vr.bytes) throw {code:'comfy_err',message:'결과 이미지를 받지 못했어요'};
  let blob=new Blob([vr.bytes],{type:imgType(vr.bytes)||'image/png'});
  if(['char','enemy','icon'].includes(kind)&&c.cutout&&!opts.noCut){ const ai=await alphaInfo(blob); if(ai.border<0.5) blob=await cutoutWhite(blob); }
  return blob;
}
async function naiGenerate(prompt,kind,opts){
  opts=opts||{}; prompt=stripMinor(prompt); if(Array.isArray(opts.chars)) opts.chars=opts.chars.map(c=>c&&typeof c.prompt==='string'?Object.assign({},c,{prompt:stripMinor(c.prompt)}):c); if(imgProvider()==='comfy') return comfyGenerate(prompt,kind,opts);
  try{ const b=await naiGenerate0(prompt,kind,opts); if(opts.usedTp&&opts.emptyAlpha) throw {code:'nai_empty',message:'투명 결과가 비어 있어요'}; try{ b.__seed=opts.usedSeed; }catch(_){} return b; }
  catch(e){
    if(!opts.usedTp||opts.noTp||(e&&['nai_nokey','bad_key','low_credit','nai_locked','rate_limited','network'].includes(e.code))) throw e;
    const why=naiErr(e,'투명 생성 실패');
    opts.onRetry&&opts.onRetry(1,2,'투명 배경 실패, 흰 배경으로');
    opts.noTp=true; opts.emptyAlpha=false; const b2=await naiGenerate0(prompt,kind,opts);
    NAI_TP_OFF=true; try{appStorage.setItem('starfall-nai-tperr',why+' @'+new Date().toLocaleString());}catch(_){}
    toast('투명 배경 생성이 안 돼서 흰 배경으로 그렸어요. 앱을 다시 켜기 전까지는 흰 배경으로 그려요'); return b2;
  }
}
async function naiGenerate0(prompt,kind,opts){
  const c=naiCfg(); if(!c.key) throw {code:'nai_nokey'};
  const refs=(opts.refs||[]).filter(r=>r&&r.image);
  let model=String(opts.model||c.model||NAI_DEF.model).trim(); if(refs.length&&!isV45(model)) model=isV45(c.refModel)?c.refModel:'nai-diffusion-4-5-full';
  if(opts.inpaint&&opts.inpaint.image&&!/-inpainting$/.test(model)) model+='-inpainting';
  opts.usedModel=model;
  const [w,h]=opts.size||naiSize(kind,c);
  const tp=!!c.transparent&&!NAI_TP_OFF&&!opts.noTp&&/^nai-diffusion-5/.test(model)&&!refs.length&&!(opts.img2img&&opts.img2img.image)&&!opts.inpaint&&['char','enemy','prop','icon'].includes(kind);
  opts.usedTp=tp;
  const BGTAG=/^(simple background|white background|grey background|gray background|gradient background|plain background|transparent background)$/i;
  const ql=''; // Quality is already part of the composed style prompt.
  let input=ql?joinTags(prompt,ql):String(prompt||''), neg=opts.neg!=null?opts.neg:(c.neg||'');
  if(['char','enemy'].includes(kind)) neg=joinTags(neg,'drop shadow, cast shadow');
  if(tp){ input=joinTags(tagList(prompt).filter(t=>!BGTAG.test(tagKey(t))).join(', '),TP_BG_TAG,ql); neg=tagList(neg).filter(t=>!/^(gradient background|simple background)$/i.test(tagKey(t))).join(', '); }
  const rnd=()=>{try{return crypto.getRandomValues(new Uint32Array(1))[0];}catch(e){return Math.floor(Math.random()*4294967295);}};
  const seed=opts.seed!=null&&String(opts.seed).trim()!==''?(Math.floor(+opts.seed)>>>0):rnd(); opts.usedSeed=seed;
  const P={params_version:3,width:w,height:h,scale:num(c.scale,0,10,6),sampler:c.sampler||'k_euler_ancestral',steps:Math.round(num(c.steps,1,50,28)),n_samples:1,ucPreset:0,qualityToggle:false,
    noise_schedule:c.noise||'karras',cfg_rescale:num(c.cfgRescale,0,1,0),negative_prompt:neg,seed,extra_noise_seed:rnd(),dynamic_thresholding:false,controlnet_strength:1,legacy:false,
    add_original_image:false,prefer_brownian:true,deliberate_euler_ancestral_bug:false,reference_image_multiple:[],reference_information_extracted_multiple:[],reference_strength_multiple:[],use_coords:false};
  const chars=(opts.chars||[]).filter(x=>x&&(x.prompt||x.uc));
  if(isV4p(model)){
    const coords=chars.length>1&&chars.some(x=>CG_POS[x.pos]);
    const cen=x=>[coords&&CG_POS[x.pos]?CG_POS[x.pos]:{x:.5,y:.5}];
    P.v4_prompt={caption:{base_caption:input,char_captions:chars.map(x=>({char_caption:x.prompt||'',centers:cen(x)}))},use_coords:coords,use_order:true};
    P.v4_negative_prompt={caption:{base_caption:neg,char_captions:chars.map(x=>({char_caption:x.uc||'',centers:cen(x)}))},legacy_uc:false};
    P.use_coords=coords;
    if(isV45(model)&&c.varietyBoostV45!==false) P.skip_cfg_above_sigma=59.04722600415217;
  }
  if(refs.length){
    P.director_reference_images=refs.map(r=>r.image);
    P.director_reference_strength_values=refs.map(r=>num(r.strength,0,1,.6));
    P.director_reference_secondary_strength_values=refs.map(r=>num(1-num(r.fidelity,0,1,1),0,1,0));
    P.director_reference_descriptions=refs.map(r=>({caption:{base_caption:['character','style','character&style'].includes(r.type)?r.type:'character',char_captions:[]},legacy_uc:false}));
    P.director_reference_information_extracted=refs.map(()=>1);
    P.controlnet_strength=1; P.inpaintImg2ImgStrength=1; P.normalize_reference_strength_multiple=true; delete P.skip_cfg_above_sigma;
  }
  if(tp){ P.params_version=4; P.straight_alpha=true; P.tag_hint_transparent_background=true; }
  let action='generate';
  if(opts.inpaint&&opts.inpaint.image){ action='infill'; const st=num(opts.inpaint.strength,0.3,1,1); P.image=opts.inpaint.image; P.mask=opts.inpaint.mask; P.add_original_image=!!opts.inpaint.addOrig; P.strength=st; P.noise=0; P.inpaintImg2ImgStrength=st; P.img2img={strength:st,begin_from_sigma:null,noise:0,extra_noise_seed:seed,color_correct:true}; if(P.sampler==='ddim') P.sampler='k_euler_ancestral'; }
  else if(opts.img2img&&opts.img2img.image){ action='img2img'; P.image=opts.img2img.image; P.strength=num(opts.img2img.strength,.4,1,.6); P.noise=num(opts.img2img.noise,0,1,0); }
  const body={input,model,action,parameters:P}, url=String(c.endpoint||NAI_ENDPOINT).trim(), tries=Math.round(num(c.retries,1,5,3)), tmo=Math.round(num(c.timeoutSec,30,300,120))*1000;
  let last;
  for(let a=1;a<=tries;a++){
    let r;
    try{ r=await http(url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+String(c.key).trim()},body,binary:true,timeout:tmo}); }
    catch(e){ last=e; if(a<tries){ opts.onRetry&&opts.onRetry(a,tries,'네트워크 오류'); await wait(1000*a); continue; } throw e; }
    if(r.status<400&&r.bytes&&r.bytes.length){
      const img=await naiDecode(r.bytes,(r.headers||{})['content-type']);
      let blob=new Blob([img.bytes],{type:img.type});
      let clear=false; if(tp){ const ai=await alphaInfo(blob); if(ai.solid<0.02){ opts.emptyAlpha=true; return blob; } clear=ai.border>0.5; } opts.gotAlpha=clear;
      if((kind==='char'||kind==='enemy'||kind==='icon')&&c.cutout&&!opts.noCut&&!clear) blob=await cutoutWhite(blob);
      return blob;
    }
    const txt=r.text||'', locked=/Concurrent generation is locked/i.test(txt);
    last=locked?{code:'nai_locked',message:''}:(r.status<400?{code:'nai_empty'}:errOf(r));
    const retry=locked||[408,425,429].includes(r.status)||r.status>=500;
    if(!retry||a>=tries) throw last;
    opts.onRetry&&opts.onRetry(a,tries,locked?'다른 생성 진행 중':'HTTP '+r.status);
    await wait(Math.min(20000,Math.max(retryAfterMs(r.headers),1500*a)));
  }
  throw last;
}
function naiTarget(kind,id){if(ILK(kind)){const c=charById(id);return c&&c[kind];}if(kind==='weapon'){const c=charById(id);return c&&c.weapon;}return kind==='char'?charById(id):libById(id);}
// 얼굴 범위 칠하기: 그림 위에 칠한 곳만 다시 그려요(인페인팅). 흰색=다시 그릴 곳
function fitDims(iw,ih){ const A=832*1216, r=iw/ih; let w=Math.sqrt(A*r), h=w/r; w=Math.max(512,Math.round(w/64)*64); h=Math.max(512,Math.round(h/64)*64); return [w,h]; }
// 얼굴 집중 인페인팅: 칠한 곳 주변만 잘라 크게 키워 다시 그리고, 줄여서 원본에 부드럽게 섞어요(원본의 투명 배경·흰 옷은 그대로)
async function focusedInpaint(src,maskUrl,draw){ const o=await loadImg(src), W=o.naturalWidth||o.width, H=o.naturalHeight||o.height, cv=(w,h)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; };
  const M=cv(W,H), mx=M.getContext('2d'); mx.fillStyle='#000'; mx.fillRect(0,0,W,H); mx.drawImage(await loadImg(maskUrl),0,0,W,H);
  const md=mx.getImageData(0,0,W,H).data; let bx0=W,by0=H,bx1=0,by1=0; for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(md[(y*W+x)*4]>127){ if(x<bx0)bx0=x; if(x>bx1)bx1=x; if(y<by0)by0=y; if(y>by1)by1=y; }
  if(bx1<bx0) throw {code:'mask_empty',message:'얼굴 범위가 비어 있어요'};
  const pad=Math.max(48,Math.round(0.45*Math.max(bx1-bx0,by1-by0))), x0=Math.max(0,Math.floor((bx0-pad)/8)*8), y0=Math.max(0,Math.floor((by0-pad)/8)*8), x1=Math.min(W,Math.ceil((bx1+pad)/8)*8), y1=Math.min(H,Math.ceil((by1+pad)/8)*8), cw=x1-x0, ch=y1-y0;
  const sc=Math.min(4,Math.sqrt(1048576/(cw*ch))), tw=Math.max(256,Math.floor(cw*sc/64)*64), th=Math.max(256,Math.floor(ch*sc/64)*64);
  const I=cv(tw,th), ix=I.getContext('2d'); ix.fillStyle='#fff'; ix.fillRect(0,0,tw,th); ix.drawImage(o,x0,y0,cw,ch,0,0,tw,th);
  const K=cv(tw,th), kx=K.getContext('2d'); kx.imageSmoothingEnabled=false; kx.drawImage(M,x0,y0,cw,ch,0,0,tw,th);
  const kd=kx.getImageData(0,0,tw,th), BW=Math.ceil(tw/8), on=new Uint8Array(BW*Math.ceil(th/8)); for(let y=0;y<th;y++) for(let x=0;x<tw;x++) if(kd.data[(y*tw+x)*4]>127) on[(y>>3)*BW+(x>>3)]=1;
  for(let y=0;y<th;y++) for(let x=0;x<tw;x++){ const i=(y*tw+x)*4, v=on[(y>>3)*BW+(x>>3)]?255:0; kd.data[i]=kd.data[i+1]=kd.data[i+2]=v; kd.data[i+3]=255; } kx.putImageData(kd,0,0);
  const res=await draw(I.toDataURL('image/png').split(',')[1],K.toDataURL('image/png').split(',')[1],tw,th), ru=URL.createObjectURL(res);
  try{ const r=await loadImg(ru), f=cw/tw;
    // 칠한 곳을 조금 넓히고(팽창) 가장자리를 흐려서 이음매가 안 보이게
    const D=cv(W,H), dx=D.getContext('2d'); dx.filter=`blur(${Math.max(2,Math.round(16*f))}px)`; dx.drawImage(M,0,0); dx.filter='none'; const dd=dx.getImageData(0,0,W,H); for(let i=0;i<dd.data.length;i+=4){ const v=dd.data[i]>8?255:0; dd.data[i]=dd.data[i+1]=dd.data[i+2]=v; dd.data[i+3]=255; } dx.putImageData(dd,0,0);
    const Fm=cv(W,H), fx=Fm.getContext('2d'); fx.fillStyle='#000'; fx.fillRect(0,0,W,H); fx.save(); fx.beginPath(); fx.rect(x0,y0,cw,ch); fx.clip(); fx.filter=`blur(${Math.max(2,Math.round(10*f))}px)`; fx.drawImage(D,0,0); fx.restore();
    const A=cv(W,H), ax=A.getContext('2d'); ax.drawImage(o,0,0,W,H); const B=cv(W,H), bx=B.getContext('2d'); bx.drawImage(r,0,0,tw,th,x0,y0,cw,ch);
    const ad=ax.getImageData(0,0,W,H), bd=bx.getImageData(0,0,W,H).data, fd=fx.getImageData(0,0,W,H).data;
    for(let i=0;i<ad.data.length;i+=4){ const k=fd[i]/255; if(k<=0.002) continue; ad.data[i]=ad.data[i]*(1-k)+bd[i]*k; ad.data[i+1]=ad.data[i+1]*(1-k)+bd[i+1]*k; ad.data[i+2]=ad.data[i+2]*(1-k)+bd[i+2]*k; }
    ax.putImageData(ad,0,0); return await new Promise(res2=>A.toBlob(res2,'image/png')); }
  finally{ URL.revokeObjectURL(ru); } }
// 인페인팅 결과에서 칠한 얼굴 부분만 원본에 부드럽게 붙여요(원본의 투명 배경·흰 옷은 그대로)
/* 표정 한 장 그리기 (b: 'full'|'up') — 표정 창과 새 게임 자동 표정이 같이 써요 */
async function faceDrawOne(c,F,f,ko,b,O,x,generationMode='automatic'){const game=G,project=PJ().active;x=x||''; const en=(FACE_PRESETS.find(p=>p[0]===ko)||[])[1]||'happy', ft=FACE_TAGS[en]||en, ew=[1.7,1.5,1.35,1.2][O.lv]||1.5, i2s=[0.72,0.64,0.56,0.48][O.lv]||0.6, emph=faceDrawOneEmphText({ew,ft});
  const basePr=F===c?c.naiPrompt:(F.prompt||c.naiPrompt), upO=faceUpperObj(c,F), srcO=b==='up'?upO:F, src=imgSrcRaw(srcO), frame=b==='up'?'cowboy shot':c.naiFrame, candidateEligible=imageCandidateEligible('face',b==='up'?f.up:f,c,generationMode),originalSrc=imgSrcRaw(b==='up'?f.up:f)||''; let blob;
  const refs=O.ref?[{image:await refImage(imgSrcRaw(F)||upO&&imgSrcRaw(upO)),type:'character',strength:1,fidelity:1}]:undefined;
  if(O.m==='inpaint') blob=await focusedInpaint(src,F.faceMask[b],(img,msk,tw,th,candidate)=>{ const pz=faceDrawOnePzText({candidate,basePr,emph,x,c}); return naiGenerate(pz.input,'char',{candidateBypass:true,seed:candidate.seed,neg:joinTags(pz.neg,'blurry, deformed face'),model:O.model,refs,size:[tw,th],noCut:true,noTp:true,inpaint:{image:img,mask:msk,strength:1,addOrig:false}}); },{candidateEligible,originalSrc,prompt:joinTags(basePr,emph,x)});
  else if(O.m==='raw') blob=await naiDraw('char',joinTags(basePr,emph,x),{candidateEligible,originalSrc,frame,pose:c.naiPose||undefined,styleId:c.naiStyle,model:O.model,seed:srcO.seed!=null?srcO.seed:undefined});
  else if(O.m==='emo') blob=await naiEmotion(src,en,x,O.lv,candidateEligible,originalSrc);
  else { const im=await loadImg(src), [w,h]=fitDims(im.naturalWidth||im.width,im.naturalHeight||im.height); blob=await naiDraw('char',joinTags(basePr,emph,x),{candidateEligible,originalSrc,frame,pose:c.naiPose||undefined,styleId:c.naiStyle,model:O.model,refs,size:[w,h],seed:srcO.seed!=null?srcO.seed:undefined,img2img:{image:await imgB64(src,w,h,'#ffffff'),strength:i2s,noise:0.05}}); }
  if(G!==game||PJ().active!==project)throw Error('게임이 바뀌어 표정 생성을 중단했습니다');
  if(b==='up'){ f.up=f.up||{id:'fu'+f.id,name:ko+' 상반신',img:null}; await storeImage(f.up,blob,''); } else await storeImage(f,blob,'');
  mark('c:'+c.id); }
function faceUpperObj(c,F){ return F===c?(c.upper&&imgSrc(c.upper)?c.upper:null):(F.upper&&imgSrc(F.upper)?F.upper:null); }
/* src/main/0030-image/020-candidates.js에서 옮김 */
function imageCandidateAbort(){return Object.assign(new Error('이미지 생성을 취소했어요.'),{code:'image_cancelled',name:'AbortError'});}
// Only explicitly requested manual generation offers candidates; automatic/batch work stays single.
function imageCandidateEligible(kind,target,owner,mode='manual'){
 if(mode!=='manual')return false;
 if(kind==='enemy')return true;
 if(typeof G==='undefined'||!G)return false;
 const c=owner||(kind==='char'?target:null);
 const character=(G.chars||[]).includes(c),npc=(G.npcs||[]).includes(c);
 return character&&['char','upper','illust','lbcg','scg','pose','lbbg','weapon','face'].includes(kind)||npc&&['char','upper','face'].includes(kind);
}
/* src/main/0030-image/0310-art-after-ai.js에서 옮김 */
function artKey(it){return it.k+':'+((it.o&&it.o.id)||'')+':'+((it.c&&it.c.id)||'');}
function artSnap(){try{return new Set(drawTodo().map(artKey));}catch(e){return new Set();}}
function artRun(keys){ const go=()=>{ if(PREPJOB) return setTimeout(go,5000); runPrep(null,x=>keys.has(artKey(x)),{order:ART_ORDER}); }; go(); }
/* src/main/0030-image/0330-casting.js에서 옮김 */
function castNeeded(){ const p=P(); return !playMode()&&!p.seenOpening&&!p.castDone&&imgReady()&&G.chars.some(c=>c.naiPrompt); }
function npcNew(name){ const id='npc_'+uid(); return {id,npc:true,name,role:'',profile:'',speech:'',look:'',naiPrompt:'',img:null,faces:[],skins:[],lines:[],touch:{head:[],body:[]},affLines:{},upper:{id:'up_'+id,kind:'upper',name:name+' 상반신',prompt:'',img:null}}; }
/* 중요한 NPC 자동 추가: 대본에 대사가 3줄 이상인데 ${'캐릭터'}·NPC가 아닌 인물을 NPC로 만들고 그림 프롬프트를 써요(그림 목록에 들어가요) */
async function autoNpcs(chs,rep){ if(!SAMPLE) return 0; const cnt={}; const skip=n=>!n||isMe(n)||findSpeaker(n)||npcBy(n)||enemyLib(n)||/^(나레이션|내레이션|해설|모두|일동|\?\?\?|목소리|소리|방송|안내)$/.test(n);
  (chs||[]).forEach(ch=>(ch.stages||[]).forEach(st=>[st.pre,st.post].forEach(t=>parseScript(t||'').forEach(L=>{ if(L.type==='say'&&!skip(L.who)) cnt[L.who]=(cnt[L.who]||0)+1; }))));
  const names=Object.entries(cnt).filter(([,n])=>n>=3).sort((a,b)=>b[1]-a[1]).map(x=>x[0]).slice(0,6); if(!names.length) return 0;
  const lines=n=>{ const out=[]; (chs||[]).forEach(ch=>(ch.stages||[]).forEach(st=>[st.pre,st.post].forEach(t=>parseScript(t||'').forEach(L=>{ if(L.type==='say'&&L.who===n&&out.length<4) out.push(L.text); })))); return out.join(' / '); };
  const r=await aiJSON(autoNpcsPrompt({names,lines}),rep||null,'quick');
  let n=0; (r&&Array.isArray(r.npcs)?r.npcs:[]).forEach(x=>{ const nm=String((x&&x.name)||'').trim(); if(!names.includes(nm)||npcBy(nm)) return; const o=npcNew(nm); Object.assign(o,{role:String(x.role||''),look:String(x.look||''),naiPrompt:stripMinor(stripAge(String(x.naiPrompt||'')))}); G.npcs=G.npcs||[]; G.npcs.push(o); n++; }); if(n) mark('meta'); return n; }
function castChars(){ return [...G.chars.filter(c=>c.naiPrompt&&!(c.alt)),...(G.npcs||[]).filter(n=>n.naiPrompt)]; }
function castFaceOpt(){ const cm=naiCfg().model||NAI_DEF.model; return {m:'inpaint',model:/^nai-diffusion-5/.test(cm)?cm:'nai-diffusion-5-full',ref:false,lv:1}; }
/* src/main/0030-image/0565-asset-library.js에서 옮김 */
function shList(){ try{ const a=JSON.parse(appStorage.getItem(SH_KEY)||'[]'); return Array.isArray(a)?a:[]; }catch(e){ return []; } }
function shSave(a){ try{ appStorage.setItem(SH_KEY,JSON.stringify(a)); }catch(e){} }
async function shSrc(x){ if(shCache[x.id]) return shCache[x.id]; try{ const b=await idbGet('shared::'+x.id); if(b) return shCache[x.id]=URL.createObjectURL(b); }catch(e){} return null; }
function libTarget(l){ return l&&l.alias&&G.lib.find(x=>x.id===l.alias)||l; }
async function libBlob(l){ const o=libTarget(l); return idbGetNS(shAudio(o.kind)?'a_'+o.id:o.id); }
async function shPut(l){ const b=await libBlob(l); if(!b) return false; const L=shList(), old=L.find(x=>x.kind===l.kind&&x.name===l.name), id=old?old.id:'s'+uid();
  await idbPut('shared::'+id,b); if(shCache[id]){ URL.revokeObjectURL(shCache[id]); delete shCache[id]; }
  const it={id,kind:l.kind,name:l.name,prompt:String(libTarget(l).prompt||''),from:G.meta.title,at:Date.now()}; shSave(old?L.map(x=>x===old?it:x):[it,...L]); return true; }
async function shTake(x,into){ const b=await idbGet('shared::'+x.id).catch(()=>null); if(!b) return null; let l=into||G.lib.find(y=>y.kind===x.kind&&y.name===x.name);
  if(!l){ l={id:'l'+uid(),kind:x.kind,name:x.name,prompt:x.prompt||'',img:null}; G.lib.push(l); } delete l.alias; if(!l.prompt&&x.prompt) l.prompt=x.prompt;
  if(shAudio(x.kind)) await storeAudio(l,b); else await storeImage(l,b); l.shared=x.id; mark('l:'+l.id); return l; }
function shAdopt(l){ if(!l||l.img||l.audio||l.alias) return; const x=shList().find(y=>y.kind===l.kind&&y.name===l.name); if(x) shTake(x,l).catch(()=>{}); }
// 대본에 나오는 자료 이름 세기
function libUsage(){ const n={}, add=k=>{ if(k) n[k]=(n[k]||0)+1; }, scan=t=>{ if(!t) return; try{ parseScript(t).forEach(L=>{ if(L.type==='cmd') add(L.arg); else if(L.type==='place') add(L.text); }); }catch(e){} };
  G.chapters.forEach(ch=>(ch.stages||[]).forEach(s=>{ scan(s.pre); scan(s.post); })); (G.threads||[]).forEach(t=>scan(t.script)); G.chars.forEach(c=>{ (c.episodes||[]).forEach(e=>scan(e.script)); if(c.memorial) scan(c.memorial.script); Object.values(c.spotTalk||{}).forEach(scan); });
  scan(G.opening&&G.opening.prologue); spots().forEach(s=>add(s.bg)); add(P().titleBg); add(P().lobbyBg); G.lib.filter(l=>l.kind==='cg').forEach(l=>add(l.name)); return n; }
function libDupes(){ const out=[], seen={}; G.lib.filter(l=>['bg','prop','enemy','icon'].includes(l.kind)&&!l.alias).forEach(l=>{ const k=l.kind+'|'+(String(l.prompt||'').trim().toLowerCase()||'#'+l.name.replace(/\s+/g,'')); if(seen[k]) out.push({keep:seen[k],dup:l}); else seen[k]=l; }); return out; }
function libMerge(list){ auditSnap(list.map(x=>x.dup),'자료 합치기'); list.forEach(({keep,dup})=>{ dup.alias=keep.id; dup.img=null; mark('l:'+dup.id); }); return list.length; }
