/* ===== 0040-sound — Model(상태·규칙·저장·외부 서비스) ===== */
/* src/main/0040-sound/0040-sound.js에서 옮김 */
function elUrl(path){ let b=String(SND().elBase||'').trim().replace(/\/+$/,'').replace(/\/v1$/,''); if(b&&!/^https?:\/\//i.test(b)&&/\./.test(b)) b='https://'+b; if(!/^https?:\/\/[^/]+/i.test(b)) b=EL_DEF; return b+path; }
function SND(){let o={};try{o=JSON.parse(appStorage.getItem(SKEY))||{};}catch(e){}const r=Object.assign({},SND_DEF,o);r.scene=Object.assign({},SND_DEF.scene,o.scene||{});return r;}
async function storeAudio(o,blob){ await idbPut(IMGNS+'a_'+o.id,blob); if(audioCache[o.id]) URL.revokeObjectURL(audioCache[o.id]); audioCache[o.id]=URL.createObjectURL(blob); o.audio={idb:true}; mark('l:'+o.id); }
async function loadAudio(){ for(const l of G.lib){ if(l.audio&&l.audio.idb&&!audioCache[l.id]){ try{const b=await idbGetNS('a_'+l.id); if(b) audioCache[l.id]=URL.createObjectURL(b);}catch(e){} } } }
function bgmFade(v,cb){ clearInterval(BGM.fadeT); const el=BGM.el; if(el.paused&&v===0){cb&&cb();return;} BGM.fadeT=setInterval(()=>{const d=v-el.volume; if(Math.abs(d)<=0.05){el.volume=v;clearInterval(BGM.fadeT);cb&&cb();return;} el.volume=Math.max(0,Math.min(1,el.volume+Math.sign(d)*0.05));},40); }
// ElevenLabs 작곡 한 곡: 프롬프트가 없으면 곡 이름으로 기본 프롬프트를 만들어요
function bgmPrompt(l){ return String(l.prompt||'').trim()||`${l.name}, ${(G.world&&G.world.name)||''} game background music, instrumental, seamless loop`; }
async function elCompose(l){ const s=SND(); if(!s.elKey) throw {code:'el_nokey',message:'설정의 소리에서 ElevenLabs 키를 넣어 주세요'}; const pr=bgmPrompt(l); if(!l.prompt){ l.prompt=pr; mark('l:'+l.id); }
  const r=await http(elUrl('/v1/music?output_format=mp3_44100_128'),{method:'POST',headers:{'xi-api-key':s.elKey,'Content-Type':'application/json'},body:{prompt:pr,music_length_ms:Math.round(num(s.elLen,10,300,90)*1000),model_id:s.elModel||'music_v1',force_instrumental:true},binary:true,timeout:600000});
  if(r.status>=400||!r.bytes) throw errOf(r); await storeAudio(l,new Blob([r.bytes],{type:'audio/mpeg'})); }
function sceneBgmName(){ try{ return BGM.want||''; }catch(e){ return ''; } }
function sceneOf(){return Object.assign({},SND().scene,(typeof G!=='undefined'&&G&&G.prog&&G.prog.scene)||{});}
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
function voiceOf(c){ const k=c&&skinOf(c); return (k&&k.voiceId)||(c&&c.voiceId)||''; }
function jaMap(){ try{ return JSON.parse(appStorage.getItem(JAKEY)||'{}')||{}; }catch(e){ return {}; } }
/* 스토리를 열면 목소리가 있는 대사를 한 번에 일본어로 옮겨 둬요(한 줄씩 옮기면 느리고 늦게 나와서) */
function jaBatch(texts){ if(!SAMPLE) return; const m=jaMap(), todo=[...new Set(texts.map(x=>cleanTTS(sub(x))).filter(x=>x&&!m[jaKey(x)]&&!JAWAIT[jaKey(x)]))]; if(!todo.length) return;
  for(let i=0;i<todo.length;i+=30){ const part=todo.slice(i,i+30); const pr=(async()=>{ try{ const r=await SAMPLE.json(jaBatchPrompt({part}),{modelTier:'quick'}); const a=Array.isArray(r&&r.ja)?r.ja:[];
        if(a.length===part.length){ const m2=jaMap(); part.forEach((x,j)=>{ const v=String(a[j]||'').trim(); if(v) m2[jaKey(x)]=v; }); try{ appStorage.setItem(JAKEY,JSON.stringify(m2)); }catch(e){} } }catch(e){} finally{ part.forEach(x=>{ if(JAWAIT[jaKey(x)]===pr) delete JAWAIT[jaKey(x)]; }); } })().then(()=>null);
    part.forEach(x=>{ JAWAIT[jaKey(x)]=pr; }); } }
async function toJa(t){ const k=jaKey(t); if(JAWAIT[k]){ const v=await JAWAIT[k]; if(v) return v; } const m=jaMap(); if(m[k]) return m[k]; if(!SAMPLE) return t; if(JAWAIT[k]) return JAWAIT[k];
  return JAWAIT[k]=(async()=>{ try{ const r=await SAMPLE.json(toJaPrompt({t}),{modelTier:'quick'}); const ja=String((r&&r.ja)||'').trim();
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
function prefetchTTS(c,text){ if(SND().fishKey&&c&&voiceOf(c)) ttsBlob(c,text).catch(()=>{}); }
async function fishSearch(q,lang,n){
  const s=SND(); if(!s.fishKey) throw {code:'fish_nokey'};
  const u=new URL('https://api.fish.audio/model'); u.searchParams.set('page_size',String(n||20)); u.searchParams.set('sort_by','score');
  if(q) u.searchParams.set('title',q); if(lang) u.searchParams.set('language',lang);
  const j=okJSON(await http(u.toString(),{headers:{Authorization:'Bearer '+s.fishKey},timeout:30000}));
  return (j.items||[]).filter(m=>!m.state||m.state==='trained');
}
