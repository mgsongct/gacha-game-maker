/* =========================================================
   소리: 배경음(ElevenLabs Music 또는 파일), 음성(Fish Audio)
   ========================================================= */
const SKEY='starfall-sound';
// ElevenLabs 주소: 설정에 적으면 그 주소(중계 서버 등), 비우면 공식 주소
const EL_DEF='https://api.elevenlabs.io';
function elUrl(path){ let b=String(SND().elBase||'').trim().replace(/\/+$/,'').replace(/\/v1$/,''); if(b&&!/^https?:\/\//i.test(b)&&/\./.test(b)) b='https://'+b; if(!/^https?:\/\/[^/]+/i.test(b)) b=EL_DEF; return b+path; }
const SND_DEF={sfxOn:true,sfxVol:0.6,fishKey:'',fishModel:'s2.1-pro',elKey:'',elBase:'',elModel:'music_v1',elLen:90,bgmVol:0.5,voiceVol:1,bgmOn:true,voiceStory:true,voiceLobby:true,
  scene:{title:'타이틀',lobby:'로비',battle:'전투',boss:'보스전',gacha:'계약'}};
function SND(){let o={};try{o=JSON.parse(appStorage.getItem(SKEY))||{};}catch(e){}const r=Object.assign({},SND_DEF,o);r.scene=Object.assign({},SND_DEF.scene,o.scene||{});return r;}
const audioCache={};
async function storeAudio(o,blob){ await idbPut(IMGNS+'a_'+o.id,blob); if(audioCache[o.id]) URL.revokeObjectURL(audioCache[o.id]); audioCache[o.id]=URL.createObjectURL(blob); o.audio={idb:true}; mark('l:'+o.id); }
async function loadAudio(){ for(const l of G.lib){ if(l.audio&&l.audio.idb&&!audioCache[l.id]){ try{const b=await idbGetNS('a_'+l.id); if(b) audioCache[l.id]=URL.createObjectURL(b);}catch(e){} } } }
const BGM={el:new Audio(),name:null,want:null,fadeT:null,blocked:false};
BGM.el.loop=true;
function bgmFade(v,cb){ clearInterval(BGM.fadeT); const el=BGM.el; if(el.paused&&v===0){cb&&cb();return;} BGM.fadeT=setInterval(()=>{const d=v-el.volume; if(Math.abs(d)<=0.05){el.volume=v;clearInterval(BGM.fadeT);cb&&cb();return;} el.volume=Math.max(0,Math.min(1,el.volume+Math.sign(d)*0.05));},40); }
// ElevenLabs 작곡 한 곡: 프롬프트가 없으면 곡 이름으로 기본 프롬프트를 만들어요
function bgmPrompt(l){ return String(l.prompt||'').trim()||`${l.name}, ${(G.world&&G.world.name)||''} game background music, instrumental, seamless loop`; }
async function elCompose(l){ const s=SND(); if(!s.elKey) throw {code:'el_nokey',message:'설정의 소리에서 ElevenLabs 키를 넣어 주세요'}; const pr=bgmPrompt(l); if(!l.prompt){ l.prompt=pr; mark('l:'+l.id); }
  const r=await http(elUrl('/v1/music?output_format=mp3_44100_128'),{method:'POST',headers:{'xi-api-key':s.elKey,'Content-Type':'application/json'},body:{prompt:pr,music_length_ms:Math.round(num(s.elLen,10,300,90)*1000),model_id:s.elModel||'music_v1',force_instrumental:true},binary:true,timeout:600000});
  if(r.status>=400||!r.bytes) throw errOf(r); await storeAudio(l,new Blob([r.bytes],{type:'audio/mpeg'})); }
// 배경음 한꺼번에: 고른 곡을 뒤에서 한 곡씩 작곡해요(그동안 플레이 가능, 다 되면 우편)
function openBgmAll(){ const items=G.lib.filter(l=>l.kind==='bgm'); if(!items.length){ toast('배경음 목록이 비어 있어요'); return; }
  openModal(`${head('배경음 한꺼번에 만들기','<span class="muted">ElevenLabs 작곡 · 한 곡에 1~3분</span>')}
    ${SND().elKey?'':'<p style="color:var(--rose);margin:0 0 8px">설정 → 소리에서 ElevenLabs 키를 먼저 넣어 주세요.</p>'}
    <p class="muted" style="margin:0 0 8px">고른 곡을 뒤에서 한 곡씩 작곡해요. 그동안 플레이해도 되고, 다 되면 우편으로 알려 드려요. 프롬프트가 비어 있는 곡은 곡 이름으로 만들어요.</p>
    <div class="chips">${items.map(l=>`<button class="chip ${l.audio?'':'on'}" data-act="bgmpick" data-id="${l.id}">${esc(l.name)}${l.audio?' ✓':''}</button>`).join('')}</div>
    <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-act="bgmpickall" data-v="miss">미등록만</button><button class="btn sm ghost" data-act="bgmpickall" data-v="all">모두</button><button class="btn sm ghost" data-act="bgmpickall" data-v="none">모두 빼기</button></div>
    <p class="muted" style="margin:8px 0 0;font-size:.78rem">✓는 이미 곡이 있는 항목이에요. 고르면 새로 작곡해서 바꿔요. 곡 길이는 설정 → 소리의 작곡 길이를 따라요.</p>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="bgmallgo" ${SND().elKey?'':'disabled'}>작곡 시작</button></div>`); }
function bgmAllGo(ids){ const items=ids.map(libById).filter(Boolean); if(!items.length){ toast('곡을 하나 이상 골라 주세요'); return; } closeModal();
  bgJob('bgmall','배경음 '+items.length+'곡 작곡 중',async j=>{ j.total=items.length; let ok=0; const fail=[];
    for(const l of items){ j.sub=l.name; bgJobsDraw(); let done=false; for(let k=0;k<2&&!done;k++){ try{ await elCompose(l); done=true; ok++; }catch(e){ if(e&&(e.code==='el_nokey'||e.code==='bad_key'||e.code==='low_credit'||(e.status===401||e.status===402))){ fail.push(l.name); j.step=items.length; return ok?{title:`배경음 ${ok}곡을 만들었어요`,body:'키나 남은 사용량 문제로 나머지는 만들지 못했어요.'}:null; } if(k) fail.push(l.name); else await wait(3000); } }
      j.step++; bgJobsDraw(); if(done&&sceneBgmName()===l.name) bgm(l.name); }
    return ok?{title:`배경음 ${ok}곡을 만들었어요`,body:fail.length?'만들지 못한 곡: '+fail.join(', ')+'\n배경음 화면에서 다시 시도할 수 있어요.':'설정 → 자료 → 배경음에서 들어 볼 수 있어요.'}:null; }); }
function sceneBgmName(){ try{ return BGM.want||''; }catch(e){ return ''; } }
function bgm(name,force){
  const s=SND(); BGM.want=name||null;
  if(!s.bgmOn&&!force) name=null;
  const it=name&&G.lib.find(l=>l.kind==='bgm'&&l.name===name), src=it&&audioCache[it.id];
  if(!src){ bgmFade(0,()=>{BGM.el.pause();BGM.name=null;}); return; }
  if(BGM.name===name&&!BGM.el.paused){ bgmFade(s.bgmVol); return; }
  bgmFade(0,()=>{ BGM.name=name; BGM.el.src=src; BGM.el.volume=0; BGM.el.play().then(()=>{BGM.blocked=false;bgmFade(s.bgmVol);}).catch(()=>{BGM.blocked=true;}); });
}
document.addEventListener('click',()=>{ if(BGM.blocked){ BGM.blocked=false; const n=BGM.want; BGM.name=null; bgm(n); } },true);
function sceneOf(){return Object.assign({},SND().scene,(typeof G!=='undefined'&&G&&G.prog&&G.prog.scene)||{});}
function sceneBgm(){
  const sc=sceneOf();
  if(typeof B!=='undefined'&&B) return bgm(B.enemies.some(en=>en.boss)?sc.boss:sc.battle);
  if(typeof GC!=='undefined'&&GC) return bgm(sc.gacha);
  if(document.querySelector('.title')) return bgm(sc.title);
  if(typeof S!=='undefined'&&S) return;
  bgm(sc.lobby);
}
const sfxLast={};
function sfx(name){
  const s=SND(); if(!s.sfxOn) return; const now=Date.now(); if(sfxLast[name]&&now-sfxLast[name]<70) return; sfxLast[name]=now;
  const it=G.lib.find(l=>l.kind==='sfx'&&l.name===name), src=it&&audioCache[it.id]; if(!src) return;
  try{ const a=new Audio(src); a.volume=s.sfxVol; a.play().catch(()=>{}); }catch(e){}
}
async function elSfx(l){
  const s=SND(); if(!s.elKey) throw {code:'el_nokey'};
  const r=await http(elUrl('/v1/sound-generation?output_format=mp3_44100_128'),{method:'POST',headers:{'xi-api-key':s.elKey,'Content-Type':'application/json'},
    body:{text:l.prompt,duration_seconds:Math.min(22,Math.max(0.5,+l.dur||1.5)),prompt_influence:0.4},binary:true,timeout:120000});
  if(r.status>=400||!r.bytes) throw errOf(r);
  await storeAudio(l,new Blob([r.bytes],{type:'audio/mpeg'}));
}
document.addEventListener('click',e=>{ if(e.target.closest('.btn,.tile,.tab,.chip,.bsel button')) sfx('버튼'); },true);
const VOICE=new Audio(); let voiceTok=0, voiceErr=false;
const cleanTTS=t=>String(t||'').replace(/\([^)]*\)/g,'').replace(/[「」『』]/g,'').trim();
function voiceOf(c){ const k=c&&skinOf(c); return (k&&k.voiceId)||(c&&c.voiceId)||''; }
/* 일본어 목소리: 대사를 글 AI로 일본어로 옮겨 읽어요. 옮긴 글은 저장해 두고 다시 써요 */
const JAKEY='ggm-voice-ja', JAWAIT={};
function jaMap(){ try{ return JSON.parse(appStorage.getItem(JAKEY)||'{}')||{}; }catch(e){ return {}; } }
const jaKey=t=>hash(t).toString(36)+'_'+t.length;
/* 스토리를 열면 목소리가 있는 대사를 한 번에 일본어로 옮겨 둬요(한 줄씩 옮기면 느리고 늦게 나와서) */
function jaBatch(texts){ if(!SAMPLE) return; const m=jaMap(), todo=[...new Set(texts.map(x=>cleanTTS(sub(x))).filter(x=>x&&!m[jaKey(x)]&&!JAWAIT[jaKey(x)]))]; if(!todo.length) return;
  for(let i=0;i<todo.length;i+=30){ const part=todo.slice(i,i+30); const pr=(async()=>{ try{ const r=await SAMPLE.json(`${pf('VOICE_JA_BATCH',{part:part.map((x,j)=>(j+1)+'. '+x).join('\n')})}\nJSON만 출력: {"ja":["옮긴 대사 ${part.length}개"]}`,{modelTier:'quick'}); const a=Array.isArray(r&&r.ja)?r.ja:[];
        if(a.length===part.length){ const m2=jaMap(); part.forEach((x,j)=>{ const v=String(a[j]||'').trim(); if(v) m2[jaKey(x)]=v; }); try{ appStorage.setItem(JAKEY,JSON.stringify(m2)); }catch(e){} } }catch(e){} finally{ part.forEach(x=>{ if(JAWAIT[jaKey(x)]===pr) delete JAWAIT[jaKey(x)]; }); } })().then(()=>null);
    part.forEach(x=>{ JAWAIT[jaKey(x)]=pr; }); } }
async function toJa(t){ const k=jaKey(t); if(JAWAIT[k]){ const v=await JAWAIT[k]; if(v) return v; } const m=jaMap(); if(m[k]) return m[k]; if(!SAMPLE) return t; if(JAWAIT[k]) return JAWAIT[k];
  return JAWAIT[k]=(async()=>{ try{ const r=await SAMPLE.json(`${pf('VOICE_JA',{t})}JSON만 출력: {"ja":"일본어 대사"}`,{modelTier:'quick'}); const ja=String((r&&r.ja)||'').trim();
      if(!ja) return t; const m2=jaMap(); m2[k]=ja; const ks=Object.keys(m2); if(ks.length>3000) ks.slice(0,ks.length-3000).forEach(x=>delete m2[x]); try{ appStorage.setItem(JAKEY,JSON.stringify(m2)); }catch(e){} return ja; }
    catch(e){ return t; } finally{ delete JAWAIT[k]; } })(); }
async function ttsBlob(c,text){
  const s=SND(), t0=cleanTTS(sub(text)), vid=voiceOf(c); if(!t0||!s.fishKey||!c||!vid) return null;
  const t=s.voiceLang==='ja'?await toJa(t0):t0;
  const key='v_'+hash(vid+'|'+s.fishModel+'|'+t).toString(36)+'_'+t.length;
  try{const b=await idbGet(key); if(b) return b;}catch(e){}
  const r=await http('https://api.fish.audio/v1/tts',{method:'POST',headers:{Authorization:'Bearer '+s.fishKey,'Content-Type':'application/json',model:s.fishModel},
    body:{text:t,reference_id:vid,format:'mp3',mp3_bitrate:128,latency:'normal',normalize:true},binary:true,timeout:90000});
  if(r.status>=400||!r.bytes) throw errOf(r);
  const b=new Blob([r.bytes],{type:'audio/mpeg'}); try{await idbPut(key,b);}catch(e){} return b;
}
function stopVoice(){ voiceTok++; VOICE.onended=null; try{VOICE.pause();}catch(e){} }
async function speak(c,text){
  stopVoice(); const tok=voiceTok;
  try{ const b=await ttsBlob(c,text); if(!b||tok!==voiceTok) return false;
    if(VOICE._u) URL.revokeObjectURL(VOICE._u); VOICE._u=URL.createObjectURL(b); VOICE.src=VOICE._u; VOICE.volume=SND().voiceVol; await VOICE.play(); return true; }
  catch(e){ if(!voiceErr){voiceErr=true;setTimeout(()=>{voiceErr=false;},20000);toast('음성 생성 실패. '+(AIERR[e&&e.code]||'')+' '+((e&&e.message)||''));} return false; }
}
function prefetchTTS(c,text){ if(SND().fishKey&&c&&voiceOf(c)) ttsBlob(c,text).catch(()=>{}); }
async function fishSearch(q,lang,n){
  const s=SND(); if(!s.fishKey) throw {code:'fish_nokey'};
  const u=new URL('https://api.fish.audio/model'); u.searchParams.set('page_size',String(n||20)); u.searchParams.set('sort_by','score');
  if(q) u.searchParams.set('title',q); if(lang) u.searchParams.set('language',lang);
  const j=okJSON(await http(u.toString(),{headers:{Authorization:'Bearer '+s.fishKey},timeout:30000}));
  return (j.items||[]).filter(m=>!m.state||m.state==='trained');
}

