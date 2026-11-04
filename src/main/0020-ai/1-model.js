/* ===== 0020-ai — Model(상태·규칙·저장·외부 서비스) ===== */
/* src/main/0020-ai/0020-ai.js에서 옮김 */
/* AI 설정 목록(저장소 PKEY): 읽기 AIP — 없으면 예전 키(AKEY)에서 옮긴 모양을 보여 주기만, 저장은 불러올 때 한 번(aipMigrate) */
function aipLegacy(){ const d={active:'',fallback:true,list:[]}; try{const o=JSON.parse(appStorage.getItem(AKEY)); if(o&&o.key){const p={id:'p'+Date.now(),name:'Claude',type:'anthropic',key:o.key,model:o.model||'',quick:o.quick||''};d.list.push(p);d.active=p.id;}}catch(e){} return d; }
function AIP(){
  let d=null; try{d=JSON.parse(appStorage.getItem(PKEY));}catch(e){}
  d=d||aipLegacy(); d.list=d.list||[]; return d;
}
function aipMigrate(){ try{ if(!appStorage.getItem(PKEY)) appStorage.setItem(PKEY,JSON.stringify(aipLegacy())); }catch(e){ quietErr(e,'aipMigrate'); } }
function saveAIP(d){appStorage.setItem(PKEY,JSON.stringify(d));setupAI();}
function defKey(p){return p.type==='vertex'?'vertex_'+(p.pub||'google'):p.type;}
function normBase(b){ let s=String(b||'').trim().replace(/\/+$/,'').replace(/\/chat\/completions$/i,'').replace(/\/+$/,'');
  try{ const u=new URL(s); if(/^(www\.)?ollama\.com$/i.test(u.hostname)) return 'https://ollama.com/v1';
    if(u.port==='11434'&&!/\/v1$/.test(u.pathname)) return u.origin+'/v1'; }catch(e){} return s; }
function apValid(p){
  if(p.type==='anthropic'||p.type==='gemini') return !!p.key;
  if(p.type==='openai') return !!(p.base&&p.key&&(p.model||'').trim());
  if(p.type==='copilot') return !!p.gh;
  if(p.type==='vertex') return !!((p.sa||p.vkey)&&(p.model||DEFM[defKey(p)][0]));
  return false;
}
async function copilotTok(p){ const c=CPTOK[p.gh]; if(c&&c.exp*1000>Date.now()+60000) return c;
  const r=await http('https://api.github.com/copilot_internal/v2/token',{headers:Object.assign({Authorization:'token '+p.gh,Accept:'application/json'},COPILOT_H),timeout:30000});
  if(r.status===401) throw {code:'bad_key',message:'GitHub 로그인이 만료됐어요. AI 편집에서 다시 로그인해 주세요'};
  if(r.status===403||r.status===404) throw {code:'bad_key',message:'이 GitHub 계정에 Copilot 구독이 없어요'};
  const j=okJSON(r); if(!j.token) throw {code:'upstream_error',message:'Copilot 토큰을 받지 못했어요'};
  return CPTOK[p.gh]={token:j.token,exp:+j.expires_at||Math.floor(Date.now()/1000)+600,api:String((j.endpoints&&j.endpoints.api)||'https://api.githubcopilot.com').replace(/\/+$/,'')}; }
function setupAI(){ SAMPLE=AIP().list.some(apValid)?{json:(pr,o)=>aiCall(llmWrap(pr),(o&&o.modelTier)||'default',o&&o.images,o||{})}:null; }
function PCS(){ try{ const o=JSON.parse(appStorage.getItem('ggm-pc')||'null'); return o&&o.base&&o.key?o:null; }catch(e){ return null; } }
function setPCS(o){ try{ if(o) appStorage.setItem('ggm-pc',JSON.stringify(o)); else appStorage.removeItem('ggm-pc'); }catch(e){} }
function parsePcLink(s){ try{ const u=new URL(String(s).trim()); const k=u.searchParams.get('pc'); return k?{base:u.origin,key:k}:null; }catch(e){ return null; } }
function pcOrigin(){ const pc=PCS(); return !!(pc&&pc.base===location.origin); }
// PC 서버 주소인데 연결 키가 없어요(키 없이 다시 열었거나, 홈 화면 앱처럼 저장 공간이 따로인 경우) → 빈 게임으로 시작하지 않고 다시 연결하게 해요
function pcLostKey(){ if(IS_NATIVE||PCS()) return false; return /\.trycloudflare\.com$/i.test(location.hostname)||location.port==='8790'; }
function webProxy(){ if(IS_NATIVE) return ''; try{ return String(appStorage.getItem('ggm-proxy')||'').trim(); }catch(e){ return ''; } }
function b64ToBytes(b){const s=atob(b);const u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u;}
function b64url(u8){let s='';for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
// 브라우저 요청 시간 제한: 끝없이 기다리지 않고 끊어서, 성공·실패를 꼭 알려 줘요 (PR #3 LTXY12님)
function pcSoon(){ try{ const pc=PCS(); if(pc&&pc.auto!==false) setTimeout(()=>{ try{ const r=pcPush(true); if(r&&r.catch) r.catch(()=>{}); }catch(e){} },400); }catch(e){} }
function abortedMsg(e,base){ return (e&&e.name==='AbortError')?'시간이 오래 걸려서 연결을 끊었어요. 로컬 AI라면 추론이 설정한 대기 시간보다 긴지 확인해 주세요.':base; }
function proxyOff(){ try{ return appStorage.getItem('ggm-proxy-off')==='1'; }catch(e){ return false; } }
async function http(url,{method='GET',headers={},body,binary=false,form=false,timeout=180000,signal}={}){
  v2CheckCancelled(signal);
  const H=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.CapacitorHttp;
  if(H){
    const nh=Object.assign({'User-Agent':'GachaGameMaker/'+APP_BUILD+' (Android)'},headers); let r; try{ r=await v2Abortable(H.request({url,method,headers:nh,data:body,responseType:binary?'arraybuffer':'text',connectTimeout:30000,readTimeout:timeout}),signal); }catch(e){if(signal?.aborted)throw v2AbortError(); throw {code:'network',message:String(e&&e.message||'')}; }
    let bytes=null,text=null;
    if(binary&&typeof r.data==='string'&&r.status<400){ try{bytes=b64ToBytes(r.data);}catch(e){text=r.data;} }
    else if(r.data instanceof ArrayBuffer) bytes=new Uint8Array(r.data);
    else text=typeof r.data==='string'?r.data:JSON.stringify(r.data);
    if(binary&&r.status>=400&&text&&!/^[\[{]/.test(text.trim())&&/^[A-Za-z0-9+/=\s]{8,}$/.test(text)){ try{const d=new TextDecoder().decode(b64ToBytes(text.replace(/\s/g,'')));if(!/[\u0000-\u0008\uFFFD]/.test(d))text=d;}catch(e){} }
    const hd={}; Object.entries(r.headers||{}).forEach(([k,v])=>{hd[String(k).toLowerCase()]=String(v);});
    return {status:r.status,bytes,text,headers:hd};
  }
  const pc=PCS(); let tgt=null; try{ tgt=new URL(url); }catch(e){}
  const direct=tgt&&(/(^|\.)(github\.com|githubusercontent\.com|github\.io)$/i.test(tgt.hostname)||proxyOff()); // GitHub는 브라우저에서 바로 돼요(PC를 거치지 않기). 'PC 거치지 않기'를 켜면 모두 직접
  if(pc&&tgt&&!direct&&tgt.origin!==pc.base&&(!IS_NATIVE||isLocalHost(tgt.hostname))&&!url.startsWith(pc.base)){
    return http(pc.base+'/api/proxy?u='+encodeURIComponent(url),{method,headers:Object.assign({},headers,{'X-GGM-Key':pc.key}),body,binary,form,timeout,signal});
  }
  const h={...headers}; delete h.Origin; delete h.Referer;
  const init={method,headers:h,body:body==null?undefined:(form?new URLSearchParams(body).toString():JSON.stringify(body))};
  const ac=typeof AbortController!=='undefined'?new AbortController():null; if(ac) init.signal=ac.signal; else if(signal) init.signal=signal;
  if(ac&&signal){ if(signal.aborted) ac.abort(); else signal.addEventListener('abort',()=>{ try{ ac.abort(); }catch(e){} },{once:true}); } // 전투 스킬 생성 취소(signal)와 시간 제한을 함께
  const tmr=ac?setTimeout(()=>{ try{ ac.abort(); }catch(e){} },Math.max(5000,timeout||180000)):null;
  try{
  const PX=webProxy(); let host=''; try{ host=new URL(url).host; }catch(e){}
  const strict=/(^|\.)ollama\.com$/i.test(host)||/:11434$/.test(host);
  if(PX&&strict&&!/:11434$/.test(host)) PXHOSTS.add(host);
  const viaPx=()=>fetch(PX.replace(/\/+$/,'')+'/?u='+encodeURIComponent(url),init);
  let res;
  if(PX&&PXHOSTS.has(host)){ try{ res=await viaPx(); }catch(e){ if(signal?.aborted) throw v2AbortError(); throw {code:'network',message:abortedMsg(e,'중계 서버에 연결하지 못했어요')}; } }
  else { try{ res=await fetch(url,init); }catch(e){ if(signal?.aborted) throw v2AbortError();
      if(e&&e.name==='AbortError') throw {code:'network',message:abortedMsg(e,'')};
      if(PX&&host&&host!==location.host){ try{ res=await viaPx(); PXHOSTS.add(host); }catch(e2){ if(signal?.aborted) throw v2AbortError(); throw {code:'network',message:abortedMsg(e2,'중계 서버에 연결하지 못했어요')}; } }
      else throw {code:'network',message:IS_NATIVE?'':'웹 버전에서는 이 서비스가 직접 연결을 막았을 수 있어요(CORS). 설정 → 아이폰·웹 연결에서 중계 서버를 넣어 주세요.'}; } }
  if(res.status===403&&host&&host!==location.host){
    if(PX&&!PXHOSTS.has(host)&&!/:11434$/.test(host)){ try{ const r2=await viaPx(); if(r2.status!==403){ PXHOSTS.add(host); res=r2; } }catch(e){if(signal?.aborted)throw v2AbortError();} }
    if(res.status===403&&strict) throw {code:'origin_block',message:/:11434$/.test(host)?'내 PC Ollama를 OLLAMA_ORIGINS=* 환경 변수와 함께 다시 켜 주세요.':(PX?'중계 서버의 worker.js가 최신인지(ollama.com 허용) 확인해 주세요.':'설정 → 아이폰·웹 연결에서 중계 서버를 넣거나, 안드로이드 앱에서 써 주세요.')};
  }
  const hd={}; try{res.headers.forEach((v,k)=>{hd[k.toLowerCase()]=v;});}catch(e){}
  try{ if(binary&&res.ok) return {status:res.status,bytes:new Uint8Array(await res.arrayBuffer()),headers:hd};
    return {status:res.status,text:await res.text(),headers:hd}; }catch(e){ if(signal?.aborted) throw v2AbortError(); throw {code:'network',message:abortedMsg(e,'응답을 끝까지 받지 못했어요')}; }
  } finally { if(tmr) clearTimeout(tmr); }
}
function errOf(r){
  let m=''; try{const j=JSON.parse(r.text||'');m=(j.error&&(j.error.message||j.error.status||j.error))||j.message||j.detail||'';if(typeof m!=='string')m=JSON.stringify(m);}catch(e){m=(r.text||'').slice(0,200);}
  const s=r.status;
  if(s===401||s===403) return {code:'bad_key',message:m};
  if(s===402||/credit|balance|anlas/i.test(m)) return {code:'low_credit',message:m};
  if(s===404) return {code:'model_not_found',message:m};
  if(s===429||s===529||s===503) return {code:'rate_limited',message:m};
  return {code:'upstream_error',message:`(${s}) ${m}`};
}
function okJSON(r){ if(r.status>=400) throw errOf(r); try{return JSON.parse(r.text||(r.bytes?new TextDecoder().decode(r.bytes):''));}catch(e){throw {code:'upstream_error',message:'응답을 읽지 못했어요'};} }
function aiLog(e){ e.at=Date.now(); if(AISTAGE&&!e.stage) e.stage=AISTAGE; AILOG.unshift(e); if(AILOG.length>40) AILOG.length=40; try{ appStorage.setItem('ggm-ailog',JSON.stringify(AILOG.slice(0,25))); }catch(_){} }
function aiLogText(){ return AILOG.map(e=>`[${new Date(e.at).toISOString()}] ${e.ok?'OK':'FAIL'} ${e.stage||''} | ${e.who||''} ${e.model||''} ${e.tier||''} ${e.ms!=null?(e.ms/1000).toFixed(1)+'s':''}${e.err?' | '+e.err:''}${e.res?'\n  응답: '+String(e.res).replace(/\n/g,' ').slice(0,500):''}`).join('\n'); }
function parseLoose(text){ AILAST=String(text||'');
  const all=String(text||'').replace(/^\uFEFF/,'').replace(/```(?:json|JSON)?/g,'').trim();
  // JSON이 시작할 수 있는 곳만 후보로: '{' 다음엔 " 나 }, '[' 다음엔 값. 설명글 속 [SR]·[배경] 같은 대괄호는 건너뛰어요
  const starts=[]; for(let i=0;i<all.length&&starts.length<40;i++){ const ch=all[i]; if(ch!=='{'&&ch!=='[') continue; let k=i+1; while(k<all.length&&/\s/.test(all[k])) k++; const nx=all[k]||'';
    if(ch==='{'?/["}]/.test(nx):(/["{\[\]\-0-9]/.test(nx)||/^(true|false|null)/.test(all.slice(k,k+5)))) starts.push(i); }
  if(!starts.length) throw {code:'invalid_json'};
  for(const a of starts){ const t=all.slice(a);
    try{ return JSON.parse(t); }catch(e){}
    try{ const v=JSON.parse(jsonRepair(t)); if(v&&typeof v==='object'&&(Array.isArray(v)?v.length:Object.keys(v).length)) return v; }catch(e){} }
  throw {code:'invalid_json'};
}
// 문자열 안의 따옴표가 진짜 끝인지: 뒤에 } ] 가 오거나, 쉼표·콜론 다음에 새 값("…", {, [, 숫자, true/false/null)이 오면 끝이에요. '"괜찮아요", 라고' 같은 대사 속 따옴표는 끝이 아니에요
function jsonStrEnd(t,i){ const nx=k=>{ while(k<t.length&&/\s/.test(t[k])) k++; return k; }; let j=nx(i+1); if(j>=t.length) return true; const c=t[j];
  if(c==='}'||c===']') return true; if(c===','||c===':'){ const k=nx(j+1); if(k>=t.length) return true; return /["{\[\-0-9tfn\]}]/.test(t[k])&&!(/[tfn]/.test(t[k])&&!/^(true|false|null)/.test(t.slice(k,k+5))); } return false; }
// 깨진 JSON 고치기: 문자열 안의 줄바꿈·탭, 끝의 쉼표, 길이 제한으로 끊긴 끝(닫는 따옴표·괄호), 뒤에 붙은 설명글
function jsonRepair(t){ let out='', inS=false, esc=false; const st=[];
  for(let i=0;i<t.length;i++){ const ch=t[i];
    if(inS){ if(esc){ esc=false; out+=ch; continue; } if(ch==='\\'){ esc=true; out+=ch; continue; }
      if(ch==='"'){ // 문자열 안의 따옴표를 이스케이프하지 않은 경우: 뒤가 , } ] : 가 아니면 문자로 봐요
        if(!jsonStrEnd(t,i)){ out+='\\"'; continue; } inS=false; out+=ch; continue; }
      if(ch==='\n'){ out+='\\n'; continue; } if(ch==='\r') continue; if(ch==='\t'){ out+='\\t'; continue; } if(ch<' ') continue; out+=ch; continue; }
    if(ch==='"'){ inS=true; out+=ch; continue; }
    if(ch==='{'||ch==='['){ st.push(ch==='{'?'}':']'); out+=ch; continue; }
    if(ch==='}'||ch===']'){ if(!st.length) continue; out=out.replace(/[\s,]+$/,''); out+=st.pop(); if(!st.length) return out; continue; }
    out+=ch; }
  if(esc) out=out.slice(0,-1); if(inS) out+='"';
  out=out.replace(/[\s,:]+$/,'').replace(/,\s*"[^"]*"$/,'').replace(/([{\[])\s*"[^"]*"$/,'$1');
  while(st.length){ out=out.replace(/[\s,]+$/,''); out+=st.pop(); }
  return out; }
async function vertexToken(p,options={}){
  const now=Math.floor(Date.now()/1000), c=TOKC[p.id||'tmp'];
  if(c&&c.exp>now+120&&c.sa===p.sa) return c.tok;
  let sa; try{ sa=JSON.parse(p.sa); }catch(e){ throw {code:'sa_bad'}; }
  if(!sa.client_email||!sa.private_key) throw {code:'sa_bad'};
  const aud=sa.token_uri||'https://oauth2.googleapis.com/token';
  const enc=o=>b64url(new TextEncoder().encode(JSON.stringify(o)));
  const unsigned=enc({alg:'RS256',typ:'JWT'})+'.'+enc({iss:sa.client_email,scope:'https://www.googleapis.com/auth/cloud-platform',aud,iat:now,exp:now+3600});
  let key; try{ const der=b64ToBytes(sa.private_key.replace(/-----[^-]+-----/g,'').replace(/\s+/g,'')); key=await crypto.subtle.importKey('pkcs8',der,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']); }catch(e){ throw {code:'sa_bad'}; }
  const sig=new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(unsigned)));
  const r=await http(aud,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:{grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:unsigned+'.'+b64url(sig)},form:true,timeout:30000,signal:options.signal});
  const j=okJSON(r); if(!j.access_token) throw {code:'bad_key',message:'토큰 발급 실패'};
  TOKC[p.id||'tmp']={tok:j.access_token,exp:now+(j.expires_in||3600),sa:p.sa};
  return j.access_token;
}
async function claudeMsg(url,hdr,body,tier,options={}){
  // 길이 제한(max_tokens)에 걸리면 끊긴 곳부터 이어 쓰게 해서 최대 2번 더 받아 붙여요.
  let text='', stop='';
  for(let i=0;i<3;i++){
    const msgs=i?[...body.messages,{role:'assistant',content:text},{role:'user',content:'앞 응답이 길이 제한으로 끊겼다. 끊긴 바로 다음 글자부터 이어서 출력한다. 앞부분을 반복하지 말고, 설명이나 코드 블록 없이 이어지는 내용만 쓴다.'}]:body.messages;
    const r=await http(url,{method:'POST',headers:{'Content-Type':'application/json',...hdr},body:{...body,messages:msgs},timeout:TMO[tier],signal:options.signal});
    const j=okJSON(r); if(j.stop_reason==='refusal') throw {code:'refused'};
    text+=(j.content||[]).filter(b=>b.type==='text').map(b=>b.text).join(''); stop=j.stop_reason;
    if(stop!=='max_tokens'||options.managedRetry) break;
  }
  try{ return parseLoose(text); }catch(e){ throw {code:'invalid_json',message:stop==='max_tokens'?'응답이 길이 제한에 걸렸어요':''}; }
}
async function geminiCall(url,hdr,prompt,tier,imgs,options={}){
  const max={quick:4000,default:16000,complex:32000}[tier];
  const body={contents:[{role:'user',parts:[...(imgs||[]).map(i=>({inline_data:{mime_type:i.mime,data:i.data}})),{text:prompt}]}],generationConfig:{maxOutputTokens:max,temperature:1,responseMimeType:'application/json'},
    safetySettings:['HARM_CATEGORY_HARASSMENT','HARM_CATEGORY_HATE_SPEECH','HARM_CATEGORY_SEXUALLY_EXPLICIT','HARM_CATEGORY_DANGEROUS_CONTENT'].map(c=>({category:c,threshold:'BLOCK_ONLY_HIGH'}))};
  const r=await http(url,{method:'POST',headers:{'Content-Type':'application/json',...hdr},body,timeout:TMO[tier],signal:options.signal});
  const j=okJSON(r);
  if(j.promptFeedback&&j.promptFeedback.blockReason) throw {code:'refused'};
  const cand=(j.candidates||[])[0]; if(!cand) throw {code:'refused'};
  if(['SAFETY','PROHIBITED_CONTENT','BLOCKLIST','SPII','RECITATION'].includes(cand.finishReason)) throw {code:'refused'};
  const text=((cand.content&&cand.content.parts)||[]).filter(x=>!x.thought).map(x=>x.text||'').join('');
  try{ return parseLoose(text); }catch(e){ throw {code:'invalid_json',message:cand.finishReason==='MAX_TOKENS'?'응답이 길이 제한에 걸렸어요':''}; }
}
/* 요청 단계 알림(Model → 듣는 쪽은 창 이벤트로 받음: ggm-ai {phase:start·ok·fail, prompt, tier·error} — 스토리 기억(0530)이 최근 요청을 기록) */
function aiNotify(phase,prompt,extra){ dispatchEvent(new CustomEvent('ggm-ai',{detail:Object.assign({phase,prompt},extra)})); }
async function aiOne(p,prompt,tier,imgs,options={}){
  v2CheckCancelled(options.signal);
  imgs=(imgs||[]).filter(x=>x&&x.data);
  const dm=DEFM[defKey(p)]||['',''];
  const model=((tier==='quick'?(p.quick||p.model):p.model)||(tier==='quick'?dm[1]||dm[0]:dm[0])||'').trim();
  if(!model) throw {code:'model_not_found',message:'모델 이름이 비어 있어요'};
  const max={quick:2000,default:8000,complex:16000}[tier];
  const cmax={quick:4000,default:16000,complex:32000}[tier];
  const P2=aiOneP2Text({prompt});
  aiNotify('start',P2,{tier});
  const CC=imgs.length?[...imgs.map(i=>({type:'image',source:{type:'base64',media_type:i.mime,data:i.data}})),{type:'text',text:P2}]:P2;
  const OC=imgs.length?[...imgs.map(i=>({type:'image_url',image_url:{url:`data:${i.mime};base64,${i.data}`}})),{type:'text',text:P2}]:P2;
  if(p.type==='anthropic') return claudeMsg('https://api.anthropic.com/v1/messages',{'x-api-key':p.key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},{model,max_tokens:cmax,messages:[{role:'user',content:CC}]},tier,options);
  if(p.type==='openai'||p.type==='copilot'){
    const cp=p.type==='copilot'?await copilotTok(p):null, base=cp?cp.api:normBase(p.base), auth=cp?Object.assign({Authorization:'Bearer '+cp.token},COPILOT_H,imgs.length?{'Copilot-Vision-Request':'true'}:{}):{Authorization:'Bearer '+p.key};
    let text='', fin='';
    for(let i=0;i<3;i++){
      const msgs=[{role:'user',content:OC}]; if(i) msgs.push({role:'assistant',content:text},{role:'user',content:'앞 응답이 길이 제한으로 끊겼다. 끊긴 바로 다음 글자부터 이어서 출력한다. 앞부분을 반복하지 말고, 설명이나 코드 블록 없이 이어지는 내용만 쓴다.'});
      const r=await http(base+'/chat/completions',{method:'POST',headers:Object.assign({'Content-Type':'application/json'},auth),body:{model,max_tokens:max,messages:msgs},timeout:TMO[tier],signal:options.signal});
      const j=okJSON(r), ch=(j.choices||[])[0]; if(!ch) throw {code:'upstream_error',message:JSON.stringify(j).slice(0,160)};
      if(ch.finish_reason==='content_filter') throw {code:'refused'};
      text+=(ch.message&&ch.message.content)||''; fin=ch.finish_reason;
      if(fin!=='length'||options.managedRetry) break;
    }
    try{ return parseLoose(text); }catch(e){ throw {code:'invalid_json',message:fin==='length'?'응답이 길이 제한에 걸렸어요':''}; }
  }
  if(p.type==='gemini') return geminiCall(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{'x-goog-api-key':p.key},P2,tier,imgs,options);
  if(p.type==='vertex'){
    const region=(p.region||'global').trim(), host=region==='global'?'aiplatform.googleapis.com':`${region}-aiplatform.googleapis.com`;
    if(!p.sa&&p.vkey) return geminiCall(`https://aiplatform.googleapis.com/v1/publishers/google/models/${model}:generateContent?key=${encodeURIComponent(p.vkey)}`,{},P2,tier,imgs,options);
    const tok=await vertexToken(p,options); let proj=(p.project||'').trim(); if(!proj){try{proj=JSON.parse(p.sa).project_id;}catch(e){}}
    const base=`https://${host}/v1/projects/${proj}/locations/${region}/publishers/${p.pub==='anthropic'?'anthropic':'google'}/models/${model}`;
    if(p.pub==='anthropic') return claudeMsg(base+':rawPredict',{Authorization:'Bearer '+tok},{anthropic_version:'vertex-2023-10-16',max_tokens:cmax,messages:[{role:'user',content:CC}]},tier,options);
    return geminiCall(base+':generateContent',{Authorization:'Bearer '+tok},P2,tier,imgs,options);
  }
  throw {code:'no_ai'};
}
async function aiCall(prompt,tier,imgs,options={}){
  const requestGame=G,requestProject=PJ().active;const current=()=>{v2CheckCancelled(options.signal);if(G!==requestGame||PJ().active!==requestProject)throw {code:'cancelled',message:'작업 중 게임이 바뀌어 이전 AI 응답을 적용하지 않았습니다'};};
  current();
  const A=AIP(), list=A.list.filter(apValid); if(!list.length) throw {code:'no_ai'};
  const act=list.find(p=>p.id===A.active)||list[0];
  const order=A.fallback&&!options.managedRetry?[act,...list.filter(p=>p!==act)]:[act];
  let last;
  for(const p of order){
    const t0=Date.now(), mdl=(tier==='quick'&&p.quick)||p.model||(DEFM[defKey(p)]||[])[0]||'', base={who:p.name||AITYPE[p.type],model:mdl,tier,req:String(prompt).slice(0,600),reqLen:String(prompt).length}; AILAST='';
    const rs=()=>AILAST.length>1400?AILAST.slice(0,900)+'\n…(가운데 생략)…\n'+AILAST.slice(-400):AILAST;
    try{ let r; try{ r=await aiOne(p,prompt,tier,imgs,options); }catch(e0){ current();if(options.managedRetry||options.signal?.aborted||!(e0&&e0.code==='invalid_json')) throw e0; aiLog(Object.assign({},base,{ok:false,ms:Date.now()-t0,err:'invalid_json · 형식을 강조해서 한 번 더 요청해요',res:rs(),resLen:AILAST.length})); r=await aiOne(p,prompt+JSON_STRICT,tier,imgs,options); } current();aiLog(Object.assign(base,{ok:true,ms:Date.now()-t0,res:rs(),resLen:AILAST.length}));aiNotify('ok',prompt); if(p!==act) toast(`${p.name}(으)로 대신 썼어요`); return r; }
    catch(e){current();aiNotify('fail',prompt,{error:String(e.message||e.code||e)});if(options.signal?.aborted)throw v2AbortError(); last=e; aiLog(Object.assign(base,{ok:false,ms:Date.now()-t0,err:`${(e&&e.code)||'오류'}${e&&e.code&&AIERR[e.code]?' ('+AIERR[e.code]+')':''}${e&&e.message?' · '+String(e.message).slice(0,300):''}`,res:rs(),resLen:AILAST.length})); if(imgs&&imgs.length&&!['no_ai','bad_key','refused'].includes(e&&e.code)){ try{ const r=await aiOne(p,prompt+'\n(첨부한 사진은 이 AI가 읽지 못했다. 사진 내용을 지어내지 않는다.)',tier,null,options);current();toast('이 AI는 사진을 읽지 못해서 글로만 답했어요'); return r; }catch(e2){ last=e2; } } }
  }
  throw last;
}
function userPacks(){ try{ const a=JSON.parse(appStorage.getItem(PACKKEY)||'[]'); return Array.isArray(a)?a:[]; }catch(e){ return []; } }
function pthumbs(){ try{ return JSON.parse(appStorage.getItem(PTHUMB)||'{}')||{}; }catch(e){ return {}; } }
function pthumb(id){ const p=userPacks().find(x=>x.id===id); return (p&&p.thumb)||pthumbs()[id]||''; }
async function thumbData(file){ const b=await shrink(file,160); return await new Promise(r=>{ const fr=new FileReader(); fr.onload=()=>r(fr.result); fr.readAsDataURL(b); }); }
function allPresets(){ return [...STYLE_PRESETS,...userPacks().filter(p=>p.tags!=null||p.neg!=null)]; }
function llmSlots(){ let o={}; try{ o=JSON.parse(appStorage.getItem(LLMKEY)||'{}')||{}; }catch(e){} const L=Object.assign({top:'',mid:'',bot:'',tag:''},o); L.presets=Array.isArray(o.presets)?o.presets:[]; return L; }
/* 지침 프리셋: 이름 붙여 저장해 두고 켜고 끄는 지침. 켜진 것만 자리(상단·중단·하단)에 이어 붙여요 */
function llmEff(L){ L=L||llmSlots(); const o={top:L.top||'',mid:L.mid||'',bot:L.bot||'',tag:L.tag||''}; L.presets.filter(x=>x&&x.on&&String(x.text||'').trim()).forEach(x=>{ const k=['top','mid','bot','tag'].includes(x.pos)?x.pos:'top'; o[k]=(o[k]?o[k].trim()+'\n':'')+String(x.text).trim(); }); return o; }
function llmFromCode(t){ const m=String(t||'').trim().match(/GGMLLM:([A-Za-z0-9+/=]+)/); if(!m) return null; try{ const o=JSON.parse(decodeURIComponent(escape(atob(m[1])))); return o&&o.text?o:null; }catch(e){ return null; } }
function packFromCode(t){ const m=String(t||'').trim().match(/GGMPACK:([A-Za-z0-9+/=]+)/); if(!m) return null; try{ const o=JSON.parse(decodeURIComponent(escape(atob(m[1])))); return o&&typeof o==='object'?o:null; }catch(e){ return null; } }
// All presets transport quality inside their positive style; qtags is legacy input only.
function presetQualityParts(p){return {tags:joinTags(p.tags,p.qtags),qtags:'',quality:false};}
function packApply(p){ if(p.tags!=null||p.neg!=null){ const c=naiCfg(),q=presetQualityParts(p); c.styles=[{id:'my_style',name:'내 그림체',tags:q.tags,neg:p.neg||''}]; c.styleId='my_style'; c.qtags='';c.quality=false;c.legacyQualityTags=''; ['steps','scale','cfgRescale','sampler'].forEach(k=>{ if(p[k]!=null&&p[k]!=='') c[k]=p[k]; }); try{ appStorage.setItem(NKEY,JSON.stringify(c)); }catch(e){} } }
// 초안에서 고른 프리셋을 그림 AI 설정에 바로 적용해요(그림체 태그·네거티브·품질 태그·스텝·가이던스·샘플러)
function presetToCfg(id){ const s=allPresets().find(x=>x.id===id); if(!s) return false; const c=naiCfg(),q=presetQualityParts(s); c.styles=[{id:'my_style',name:'내 그림체',tags:q.tags,neg:s.neg}]; c.styleId='my_style'; c.qtags=''; c.quality=false; c.legacyQualityTags=''; c.steps=s.steps; c.scale=s.scale; c.cfgRescale=s.cfgRescale; c.sampler=s.sampler; try{ appStorage.setItem(NKEY,JSON.stringify(c)); }catch(e){ return false; } return true; }
function naiCfg(){let o={};try{o=JSON.parse(appStorage.getItem(NKEY))||{};}catch(e){}const r=Object.assign({},NAI_DEF,o);
  r.endpoint=String(r.endpoint||NAI_ENDPOINT).trim().replace(/^https?:\/\/api\.novelai\.net/i,'https://image.novelai.net')||NAI_ENDPOINT;
  r.parts={}; ['char','bg','prop','cg','enemy','illust','lbcg','map','icon'].forEach(k=>{r.parts[k]=Object.assign({},NAI_DEF.parts[k],(o.parts||{})[k]||{});});
  r.sizes=Object.assign({},NAI_DEF.sizes,o.sizes||{}); r.ref=Object.assign({},NAI_DEF.ref,o.ref||{});
  { const L=Array.isArray(o.styles)?o.styles:[]; let my=L.find(x=>x&&x.id==='my_style');
    if(!my){ const cur=L.find(x=>x&&x.id===o.styleId), keep=cur&&!(cur.id==='s0'||cur.id==='am_v5'||/^sp_/.test(cur.id)||/^예시:/.test(cur.name||'')); my={tags:keep?cur.tags:'',neg:keep?cur.neg:''}; }
    r.styles=[{id:'my_style',name:'내 그림체',tags:String(my.tags||''),neg:String(my.neg||'')}]; r.styleId='my_style'; }
  if(!Array.isArray(r.poses)||!r.poses.length) r.poses=NAI_DEF.poses;
  r.poses=r.poses.map(x=>x.t==='standing, looking at viewer, arms at sides'?{n:x.n,t:NAI_FRONT}:x);
  r.cut=Object.assign({},CUT_DEF,o.cut||{}); const legacy=o.quality===true?naiQuality(r,r.model):String(o.legacyQualityTags||''); if(o.quality===true)r.styles[0].tags=joinTags(r.styles[0].tags,legacy); r.legacyQualityTags=legacy;r.quality=false;r.qtags='';return r;}
function naiQuality(c,model){return String(c.qtags||'').trim()||NAI_QUALITY[model]||'';}
function naiSize(kind,c){c=c||naiCfg();const v=(c.sizes||{})[kind]||NAI_DEF.sizes[kind]||'1024x1024';const m=String(v).match(/(\d+)\s*[x×]\s*(\d+)/);return m?[+m[1],+m[2]]:[1024,1024];}
function naiBase(c){return String((c||naiCfg()).endpoint||NAI_ENDPOINT).trim().replace(/\/ai\/generate-image.*$/,'')||'https://image.novelai.net';}
function tagList(s){const t=String(s||''),out=[];let inW=false,st=0;for(let i=0;i<t.length;i++){if(t[i]===':'&&t[i+1]===':'){inW=!inW;i++;continue;}if(t[i]===','&&!inW){const x=t.slice(st,i).trim();if(x)out.push(x);st=i+1;}}const x=t.slice(st).trim();if(x)out.push(x);return out;}
function tagKey(t){return String(t).replace(/^[-+]?\d+(?:\.\d+)?::\s*(.*?)\s*::$/,'$1').replace(/\s+/g,' ').trim().toLowerCase();}
function joinTags(...parts){const seen=new Set(),out=[];parts.forEach(p=>tagList(p).forEach(t=>{const k=tagKey(t);if(k&&!seen.has(k)){seen.add(k);out.push(t);}}));return out.join(', ');}
function naiStyle(c,id){const b=c.styles.find(x=>x.id===id)||c.styles.find(x=>x.id===c.styleId)||c.styles[0]||{id:'my_style',tags:'',neg:''};const m=(typeof G!=='undefined'&&G&&G.meta)?G.meta:null;if(m&&String(m.artTags||'').trim())return {id:b.id,name:'이 게임 그림체',tags:joinTags(String(m.artTags),c.legacyQualityTags),neg:String(m.artNeg||'')};return b;}
function stripAge(s){ return tagList(s).filter(t=>!AGE_TAGS.test(tagKey(t))).join(', '); }
/* CG에 플레이어가 나오면 플레이어 외모 태그(프로필 그림을 그린 태그)를 써요 */
function cgCast(l){return (l&&l.cast||[]).map(x=>({c:x.id==='__player'?playerCast():charById(x.id),pos:x.pos||'auto',act:x.act||''})).filter(x=>x.c);}
// 캐릭터 디자인 통일: 이 게임의 가챠 캐릭터 그림에 공통 태그 + 세력별 태그를 붙여요(NPC·콜라보 게스트·스킨에는 안 붙고, 캐릭터마다 끌 수 있어요)
function designTags(c){ if(!c||c.npc||c.noDesign||c.collab||typeof G==='undefined'||!G||!(G.chars||[]).includes(c)) return ''; const d=(G.meta&&G.meta.design)||{}; return joinTags(String(d.all||''),String(((d.fac||{})[c.faction])||'')); }
function naiBlocksJoin(p){return NAI_BLOCK_KEYS.map(k=>String(p?.[k]||'').trim()).filter(Boolean).join(', ');}
function naiBlocksTokens(text){
 const s=String(text||''),out=[];let start=0,weighted=false;const stack=[];
 for(let i=0;i<s.length;i++){
  const c=s[i];if(c===':'&&s[i+1]===':'){weighted=!weighted;i++;continue;}
  if('{[('.includes(c))stack.push(c);
  else if('}])'.includes(c)){const match={'}':'{',']':'[',')':'('}[c];if(stack.at(-1)===match)stack.pop();}
  if(c===','&&!weighted&&!stack.length){const t=s.slice(start,i).trim();if(t)out.push(t);start=i+1;}
 }
 const tail=s.slice(start).trim();if(tail)out.push(tail);return out;
}
function naiBlocksTagKey(tag){
 let k=tagKey(tag).replace(/_/g,' ').replace(/[\u2010-\u2015-]/g,' ').replace(/\s+/g,' ').trim();
 while(k.length>1&&((k[0]==='{'&&k.at(-1)==='}')||(k[0]==='['&&k.at(-1)===']')))k=k.slice(1,-1).trim();
 return k;
}
function naiBlocksIsStyle(tag){
 const k=naiBlocksTagKey(tag);
 // Keep weighted groups intact. Move a group only if every member is style/quality.
 if(k.includes(',')){const members=naiBlocksTokens(k);return members.length>1&&members.every(naiBlocksIsStyle);}
 return /^artist:/.test(k)||/^(?:artist collaboration|year \d{4}|newest|masterpiece|very aesthetic|amazing quality|best quality|great quality|good quality|normal quality|bad quality|worst quality|high quality|low quality|highres|absurdres|lowres|ultra detailed|high detail|highly detailed|fine details|detailed shading|expert shading|ultra complexity|high complexity|thick lineart|thin lineart|bold lineart|clean lineart|no lineart|flat colou?r|monochrome|greyscale|grayscale|3d|2d|anime style|anime colouring|anime coloring|cel shading|cell shading|soft shading|painterly|watercolou?r(?: \(medium\))?|oil painting(?: \(medium\))?|sketch|pixel art|digital art|digital painting|photorealistic|realistic|semi realistic|official style|official art|simple illustration|no text)$/.test(k);
}
function naiBlocksKnownStyle(){
 // Custom artist names need not have an artist: prefix. Match the configured
 // positive style as whole tokens; never classify by fragments of a name.
 try{if(typeof naiCfg==='function'&&typeof naiStyle==='function')return new Set(naiBlocksTokens(naiStyle(naiCfg()).tags).map(naiBlocksTagKey));}catch(_){}
 return new Set();
}
function naiBlocksTagSlot(tag,knownStyle){
 const k=naiBlocksTagKey(tag);if(naiBlocksIsStyle(tag)||knownStyle?.has(k))return 'style';if(k.includes(','))return 'other';
 // Camera, framing, composition and style apply to an image rather than anatomy.
 if(/\b(?:eye level|bird'?s? eye|worm'?s? eye|fish eye|fisheye|dutch angle|camera angle|camera view|bust shot|bust portrait|bust up|close up|cowboy shot|upper body|lower body|full body|head shot|headshot|from above|from below|from behind|from side)\b/.test(k)||/\b(?:focus|perspective|shot|view|background|lighting)\s*$/.test(k)||/\b(?:bust chart|character chart|reference sheet|multiple views)\b/.test(k))return 'other';
 // Gaze, expressions and interactions must not become permanent physical traits.
 if(/\b(?:eye contact|eye twitch|eye roll|rolling eyes|eyes rolling|squinting|winking|furrowed eyebrows|raised eyebrows|blushing skin|tears in eyes|tears in eye|hair flip|hair blowing|wind blown hair|wind swept hair|wet hair|wet skin|sweaty skin|blood on skin|ears down|ears back|tail between legs|spread wings|spreading wings|wings spread|flapping wings|tail wagging|wagging tail)\b/.test(k)||/^(?:half closed|closed|shut|narrowed|wide open|watery|tearful|teary|crying)\b.*\beyes?$/.test(k)||/^(?:one |both )?eyes? (?:closed|open|shut)\b/.test(k)||/^(?:looking|gazing|staring|holding|carrying|adjusting|lifting|pulling|tugging|grabbing|touching|covering|raising|opening|removing|petting)\b/.test(k)||/\b(?:skirt|shirt|dress|hair|ear|ears|breast|breasts|tail) (?:lift|grab|pull|hold|tug|touch|wag)\b/.test(k))return 'other';
 if(/^(?:one |both )?hands? (?:in|on|over|behind)\b/.test(k)||/\b(?:ears? blush|ear twitch|skirt lifted|hair grabbed)\b/.test(k))return 'other';
 // Bags under the eyes are a facial feature; unlike a carried/worn bag.
 if(/\bshaped (?:pupils?|hair)\b/.test(k))return 'appearance';
 if(/^(?:eye bags?|bags? under (?:the )?eyes|under eye bags?)$/.test(k))return 'appearance';
 // Artificial features and materials on clothing are accessories, not species traits.
 if(/\b(?:tank top|holsters|ear piercing|nose piercing|lip piercing|horn ornament|ear ornament|tail ornament|hair bows?|hair flower|hairpin|hair stick|hair scrunchie|eye patch|eyepatch|eye mask|face mask|headphones|fur trim|fur collar|fur cuffs|wing collar|fake (?:animal )?ears|fake horns|fake tail|skin tight|tailcoat|sleeves|collar|bowtie|neck bow)\b/.test(k))return 'outfit';
 if(/\b(robe|tunic|gown|costume|sundress|haori|hakama|tabard|surcoat|dress|shirt|t-shirt|turtleneck|blouse|coat|jacket|cloak|cape|uniform|bodysuit|swimsuit|bikini|yukata|kimono|suit|sweater|hoodie|vest|armor|armour|breastplate|gauntlets?|gloves?|skirt|shorts|pants|trousers|jeans|leggings|stockings|socks|boots?|shoes?|sandals?|heels|hat|cap|beret|helmet|ribbon|hairband|headband|hair ornament|hairclip|earrings?|necklace|choker|brooch|bracelet|belt|tie|necktie|scarf|apron|glasses|goggles|headset|holster|bag|backpack|jumpsuit|leotard|corset|lingerie|pantyhose|panties|bra)\b/i.test(k))return 'outfit';
 if(/^(\d+(girl|boy|other)s?|solo|no humans|faceless)$/.test(k)||/\b(hair|ponytail|twintails|braid|bangs|eyes?|pupils?|eyebrows?|eyelashes|sclera|heterochromia|skin|complexion|freckles|scar|tattoo|ears?|horns?|tail|wings?|breasts?|bust|muscular|slender|athletic|tall|short stature|petite|elf|demon|robot|dragon|fur|scales|tentacles)\b/i.test(k))return 'appearance';
 return 'other';
}
function naiBlocksSplit(text,mode='person'){
 const lists={appearance:[],outfit:[],other:[],style:[]},known=naiBlocksKnownStyle();for(const tag of naiBlocksTokens(text))lists[naiBlocksTagSlot(tag,known)].push(tag);
 return Object.fromEntries(NAI_BLOCK_KEYS.map(key=>[key,lists[key].join(', ')]));
}
function naiBlocksUpgrade(parts){
 const p=Object.fromEntries(NAI_BLOCK_KEYS.map(k=>[k,String(parts?.[k]||'')]));
 if(typeof parts?.style==='string')return p;
 const other=[],style=[],known=naiBlocksKnownStyle();
 for(const tag of naiBlocksTokens(p.other))(naiBlocksTagSlot(tag,known)==='style'?style:other).push(tag);
 if(style.length){p.other=other.join(', ');p.style=style.join(', ');}
 return p;
}
// Classify all actor prompts without changing their legacy text, tag order or images.
function naiBlocksRemember(o,key='naiPrompt'){
 if(!o||typeof o[key]!=='string'||!o[key].trim())return false;
 const text=o[key],saved=o.naiBlocks?.[key];if(saved?.combined===text&&(saved.method!=='rules'||saved.ruleVersion===NAI_BLOCK_RULE_VERSION)){
  if(typeof saved.style!=='string'){const p=naiBlocksUpgrade(saved);if(p.style){o.naiBlocks={...o.naiBlocks,[key]:{...saved,...p}};return true;}}
  return false;
 }
 o.naiBlocks={...o.naiBlocks,[key]:{...naiBlocksSplit(text),combined:text,original:saved?.original??text,method:'rules',ruleVersion:NAI_BLOCK_RULE_VERSION}};return true;
}
function naiBlocksGame(g){
 if(!g)return false;let changed=false;const remember=(o,k)=>{if(naiBlocksRemember(o,k))changed=true;};
 for(const c of g.chars||[]){remember(c,'naiPrompt');for(const skin of c.skins||[])remember(skin,'prompt');}
 for(const n of g.npcs||[])remember(n,'naiPrompt');
 for(const l of g.lib||[])if(l.kind==='enemy')remember(l,'prompt');
 remember(g.prog?.avatar,'prompt');remember(g.meta?.shop?.self,'naiPrompt');return changed;
}
function naiBlocksOf(o,key='naiPrompt'){
 const text=String(o?.[key]||''),saved=o?.naiBlocks?.[key];
 return saved&&saved.combined===text?naiBlocksUpgrade(saved):naiBlocksSplit(text);
}
function naiBlocksStore(o,key,parts){
 const p=naiBlocksUpgrade(parts);for(const k of NAI_BLOCK_KEYS)p[k]=p[k].trim();
 const previous=o.naiBlocks?.[key],original=previous?.original??String(o[key]||naiBlocksJoin(p));
 o[key]=naiBlocksJoin(p);o.naiBlocks={...o.naiBlocks,[key]:{...p,combined:o[key],original}};return o[key];
}
function naiBlocksValidateSplit(text,r){
 const normalize=s=>tagList(s).map(t=>t.trim()).sort().join('\n');
 if(!r||['appearance','outfit','other'].some(k=>typeof r[k]!=='string')||(r.style!=null&&typeof r.style!=='string')||normalize(text)!==normalize(naiBlocksJoin(r)))throw Error('AI가 태그를 누락하거나 바꿔서 적용하지 않았어요. 기존 입력은 유지했어요.');
 return naiBlocksUpgrade(r);
}
async function naiBlocksSeparate(text,rep){
 const r=await aiJSON(naiBlocksSeparatePrompt({text}),rep||null,'quick');
 return naiBlocksValidateSplit(text,r);
}
async function naiSkinBase(c,rep){
 const saved=c.naiBlocks?.naiPrompt;
 if(saved?.combined===c.naiPrompt&&saved.method!=='rules')return naiBlocksOf(c);
 // A legacy mixed prompt needs semantic separation before replacing its outfit.
 return naiBlocksSeparate(c.naiPrompt,rep);
}
function naiSkinParts(base,response){
 if(!String(base?.appearance||'').trim())throw Error('캐릭터 외형 블록이 비어 있어요. 외형 태그를 분류하거나 입력한 뒤 다시 생성해 주세요.');
 const outfit=typeof response?.outfit==='string'?response.outfit.trim():'';
 if(naiBlocksSplit(outfit).appearance||naiBlocksSplit(response?.other||'').appearance)throw Error('새 의상에 캐릭터 외형을 바꾸는 태그가 들어 있어 적용하지 않았어요. 다시 생성해 주세요.');
 if(!outfit)throw Error('AI가 새 의상 정보를 비워서 반환했어요. 기존 스킨은 변경하지 않았어요.');
 return naiBlocksUpgrade({appearance:base.appearance,outfit,other:typeof response.other==='string'?response.other.trim():''});
}
/* 글 AI JSON 호출(aiJSON): 실패 문구·재시도 중 알림 줄이기 */
function aiErrText(e){ const base=AIERR[e&&e.code]||'AI 호출에 실패했어요.'; const m=String((e&&e.message)||'').trim(); if(e&&e.code==='origin_block') return base+' '+m; return m?base+' (서버: '+m.slice(0,160)+')':base; }
async function aiJSON(prompt,rep,tier,images){
  if(!SAMPLE){toast('설정의 글 AI에서 AI를 먼저 등록해 주세요');return null;}
  let loadingTimer;if(rep){rep('AI가 쓰는 중…');if(String(prompt).includes('skills')){let dots=0;loadingTimer=setInterval(()=>rep('캐릭터와 스킬 생성중'+'.'.repeat(dots++%3+1)),400);}} /* 진행 알림 rep — 처리기가 uiProg(단추)로 만들어 넘김 */
  try{ const skillPrompt=aiJSONSkillPromptText({prompt}); const r=await SAMPLE.json(skillPrompt,{modelTier:tier||'default',cache:false,images});
    // AI가 {"chars":[…]} 대신 배열 […]만 돌려주는 경우(Gemini 등): 요청한 형식의 첫 키로 감싸요
    if(Array.isArray(r)){ const m=String(prompt).match(/JSON만 출력[^{\[]*\{\s*"([A-Za-z_]+)"\s*:\s*\[/); if(m) return {[m[1]]:r}; }
    return r; }
  catch(e){ if(!AI_QUIET) toast(aiErrText(e)); else AI_QUIET_LAST=aiErrText(e); return null; }
  finally{clearInterval(loadingTimer); if(rep) rep.end(); }
}
function naiSaved(){let sv={};try{sv=JSON.parse(appStorage.getItem(NKEY))||{};}catch(e){}return sv;}
function setMyStyle(tags,neg){const sv=naiSaved();sv.styles=[{id:'my_style',name:'내 그림체',tags:String(tags||'').trim(),neg:String(neg||'').trim()}];sv.styleId='my_style';appStorage.setItem(NKEY,JSON.stringify(sv));}
function myStyle(){return naiCfg().styles[0];}
