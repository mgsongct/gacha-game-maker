/* =========================================================
   AI 연결: 여러 글 AI(Claude, Vertex, Gemini, OpenAI 호환) + NovelAI
   ========================================================= */
const AKEY='starfall-ai', PKEY='starfall-ai-profiles', NKEY='starfall-nai';
const AITYPE={anthropic:'Claude API',vertex:'Google Vertex AI',gemini:'Gemini API (AI Studio)',openai:'OpenAI 호환 (OpenRouter 등)',copilot:'GitHub Copilot (구독 필요)'};
const DEFM={anthropic:['claude-sonnet-5-5','claude-haiku-4-5-20251001'],gemini:['gemini-2.5-pro','gemini-2.5-flash'],vertex_google:['gemini-2.5-pro','gemini-2.5-flash'],vertex_anthropic:['',''],openai:['',''],copilot:['gpt-4.1','gpt-4.1']};
let NAIJOB=null, APD=null;
function AIP(){
  let d=null; try{d=JSON.parse(appStorage.getItem(PKEY));}catch(e){}
  if(!d){ d={active:'',fallback:true,list:[]}; try{const o=JSON.parse(appStorage.getItem(AKEY)); if(o&&o.key){const p={id:'p'+Date.now(),name:'Claude',type:'anthropic',key:o.key,model:o.model||'',quick:o.quick||''};d.list.push(p);d.active=p.id;}}catch(e){} appStorage.setItem(PKEY,JSON.stringify(d)); }
  d.list=d.list||[]; return d;
}
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
/* GitHub Copilot: GitHub 기기 로그인으로 받은 토큰을 이 기기에만 저장하고, 쓸 때마다 짧은 Copilot 토큰으로 바꿔요(비공식 방식) */
const COPILOT_CID='Iv1.b507a08c87ecfe98', COPILOT_H={'Editor-Version':'vscode/1.99.0','Editor-Plugin-Version':'copilot-chat/0.26.0','Copilot-Integration-Id':'vscode-chat','User-Agent':'GitHubCopilotChat/0.26.0'};
const CPTOK={};
async function copilotTok(p){ const c=CPTOK[p.gh]; if(c&&c.exp*1000>Date.now()+60000) return c;
  const r=await http('https://api.github.com/copilot_internal/v2/token',{headers:Object.assign({Authorization:'token '+p.gh,Accept:'application/json'},COPILOT_H),timeout:30000});
  if(r.status===401) throw {code:'bad_key',message:'GitHub 로그인이 만료됐어요. AI 편집에서 다시 로그인해 주세요'};
  if(r.status===403||r.status===404) throw {code:'bad_key',message:'이 GitHub 계정에 Copilot 구독이 없어요'};
  const j=okJSON(r); if(!j.token) throw {code:'upstream_error',message:'Copilot 토큰을 받지 못했어요'};
  return CPTOK[p.gh]={token:j.token,exp:+j.expires_at||Math.floor(Date.now()/1000)+600,api:String((j.endpoints&&j.endpoints.api)||'https://api.githubcopilot.com').replace(/\/+$/,'')}; }
async function copilotLogin(btn){ const box=$('#cpBox'); if(!box) return; btn.disabled=true;
  try{ const r=await http('https://github.com/login/device/code',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:{client_id:COPILOT_CID,scope:'read:user'},timeout:30000}); const j=okJSON(r);
    if(!j.device_code) throw {message:'로그인 코드를 받지 못했어요'};
    box.innerHTML=`<p style="margin:6px 0">아래 코드를 복사하고 GitHub 페이지에서 입력해 주세요. 입력하면 여기서 자동으로 이어져요.</p><div class="row"><b style="font-size:1.4rem;letter-spacing:.12em">${esc(j.user_code)}</b><button class="btn sm ghost" data-act="copy" data-text="${esc(j.user_code)}">복사</button><button class="btn sm" data-act="sylink" data-url="${esc(j.verification_uri||'https://github.com/login/device')}">GitHub 열기</button></div><p class="muted" id="cpWait" style="margin:6px 0 0;font-size:.8rem">기다리는 중…</p>`;
    let iv=Math.max(5,+j.interval||5); const until=Date.now()+(+j.expires_in||900)*1000;
    while(Date.now()<until&&$('#cpBox')){ await wait(iv*1000);
      const r2=await http('https://github.com/login/oauth/access_token',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:{client_id:COPILOT_CID,device_code:j.device_code,grant_type:'urn:ietf:params:oauth:grant-type:device_code'},timeout:30000});
      let k={}; try{ k=JSON.parse(r2.text||'{}'); }catch(e){}
      if(k.access_token){ APD.gh=k.access_token; try{ await copilotTok(APD); }catch(e){ box.innerHTML=`<p style="color:var(--rose)">${esc(e.message||'Copilot을 쓸 수 없는 계정이에요')}</p>`; return; } box.innerHTML='<p style="margin:6px 0">✓ GitHub에 로그인했어요. 모델을 고르고 저장해 주세요.</p>'; const w=$('#cpState'); if(w) w.textContent='로그인됨'; return; }
      if(k.error==='slow_down') iv+=5; else if(k.error&&k.error!=='authorization_pending'){ box.innerHTML=`<p style="color:var(--rose)">로그인에 실패했어요 (${esc(k.error)}). 다시 눌러 주세요.</p>`; return; } }
  }catch(e){ box.innerHTML=`<p style="color:var(--rose)">${esc(e.message||'GitHub에 연결하지 못했어요')}${IS_NATIVE?'':' · 웹 버전에서는 중계 서버가 필요해요'}</p>`; }
  finally{ if(btn.isConnected) btn.disabled=false; } }
function setupAI(){ SAMPLE=AIP().list.some(apValid)?{json:(pr,o)=>aiCall(llmWrap(pr),(o&&o.modelTier)||'default',o&&o.images,o||{})}:null; }

/* 네이티브 HTTP (앱에서는 CORS 없이 직접 호출) */
const IS_NATIVE=!!(window.Capacitor&&(typeof window.Capacitor.isNativePlatform==='function'?window.Capacitor.isNativePlatform():window.Capacitor.Plugins&&window.Capacitor.Plugins.CapacitorHttp));
const IS_IOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const IS_STANDALONE=(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;
const PXHOSTS=new Set();
function PCS(){ try{ const o=JSON.parse(appStorage.getItem('ggm-pc')||'null'); return o&&o.base&&o.key?o:null; }catch(e){ return null; } }
function setPCS(o){ try{ if(o) appStorage.setItem('ggm-pc',JSON.stringify(o)); else appStorage.removeItem('ggm-pc'); }catch(e){} }
function parsePcLink(s){ try{ const u=new URL(String(s).trim()); const k=u.searchParams.get('pc'); return k?{base:u.origin,key:k}:null; }catch(e){ return null; } }
// QR 주소(?pc=키)로 열면 연결해요. 같은 주소를 다시 찍어도 지난 저장 기록(last·localAt)은 그대로 둬요(지우면 받지 않은 진행을 덮어써요)
// 아이폰 Safari에서는 주소에 키를 남겨 둬요: 홈 화면에 추가할 때 키가 같이 들어가야 홈 화면 앱(저장 공간이 Safari와 따로예요)도 PC에 연결돼요
(function(){ try{ const u=new URL(location.href), k=u.searchParams.get('pc'); if(k){ const old=PCS(); setPCS(Object.assign({},old&&old.key===k&&old.base===location.origin?old:{},{base:location.origin,key:k,at:Date.now()})); if(!(IS_IOS&&!IS_STANDALONE)){ u.searchParams.delete('pc'); history.replaceState(null,'',u.pathname+(u.search||'')+u.hash); } window.__PC_NEW=1; } }catch(e){} })();
function pcOrigin(){ const pc=PCS(); return !!(pc&&pc.base===location.origin); }
// PC 서버 주소인데 연결 키가 없어요(키 없이 다시 열었거나, 홈 화면 앱처럼 저장 공간이 따로인 경우) → 빈 게임으로 시작하지 않고 다시 연결하게 해요
function pcLostKey(){ if(IS_NATIVE||PCS()) return false; return /\.trycloudflare\.com$/i.test(location.hostname)||location.port==='8790'; }
(function(){ try{ const pc=PCS(); if(!pc||pc.base!==location.origin||!window.fetch||!URL.createObjectURL) return; const el=document.querySelector('link[rel=manifest]'); if(!el) return;
  fetch(el.href).then(r=>r.json()).then(m=>{ m.start_url=location.origin+'/?pc='+encodeURIComponent(pc.key); m.scope=location.origin+'/'; m.icons=(m.icons||[]).map(i=>Object.assign({},i,{src:new URL(i.src,el.href).href})); el.href=URL.createObjectURL(new Blob([JSON.stringify(m)],{type:'application/manifest+json'})); }).catch(()=>{}); }catch(e){ quietErr(e,'0020-ai-connect.js:63'); } })();
const isLocalHost=h=>/^(localhost|127\.0\.0\.1|\[::1\]|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h);
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
/* AI 기록: 글 AI 호출마다 성공·실패, 걸린 시간, 오류, 받은 응답 앞부분을 남겨요(설정 → 글 AI → AI 기록). 키는 남기지 않아요 */
const AILOG=(()=>{ try{ const a=JSON.parse(appStorage.getItem('ggm-ailog')||'[]'); return Array.isArray(a)?a:[]; }catch(e){ return []; } })();
let AILAST='', AISTAGE='';
function aiLog(e){ e.at=Date.now(); if(AISTAGE&&!e.stage) e.stage=AISTAGE; AILOG.unshift(e); if(AILOG.length>40) AILOG.length=40; try{ appStorage.setItem('ggm-ailog',JSON.stringify(AILOG.slice(0,25))); }catch(_){} }
function aiLogHTML(fromDraft){ const f=t=>{ const d=new Date(t); return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`; };
  return `${head('AI 기록',`<span class="muted">최근 ${AILOG.length}건 · 새 것이 위</span>`)}
  <p class="muted" style="margin:0 0 8px;font-size:.8rem">초안·스토리 생성이 안 될 때 어느 단계에서 왜 멈췄는지 볼 수 있어요. '복사'로 통째로 복사해서 제보에 붙여 주세요(API 키는 들어가지 않아요).</p>
  <div class="row" style="margin-bottom:8px">${fromDraft?'<button class="btn sm" data-act="draft-open">‹ 초안으로</button>':''}<button class="btn sm" data-act="ailogcopy">전체 복사</button><button class="btn sm ghost" data-act="ailogclear">지우기</button><button class="btn sm ghost" data-act="ailog" data-v="${fromDraft?1:''}">새로고침</button></div>
  ${AILOG.length?AILOG.map(e=>`<details class="ailog ${e.ok?'ok':'bad'}"><summary><b>${e.ok?'✓':'✗'}</b> <span>${esc(f(e.at))}</span> <i>${esc(e.stage||'')}</i> <span class="muted">${esc(e.who||'')}${e.model?' · '+esc(e.model):''}${e.tier?' · '+esc(e.tier):''}${e.ms!=null?' · '+(e.ms/1000).toFixed(1)+'초':''}</span>${e.err?`<em>${esc(e.err)}</em>`:''}</summary>
    ${e.req?`<div class="muted" style="font-size:.72rem;margin-top:4px">요청 앞부분 (${nf(e.reqLen||0)}자)</div><pre>${esc(e.req)}</pre>`:''}${e.res?`<div class="muted" style="font-size:.72rem">응답 앞·뒤부분 (${nf(e.resLen||0)}자)</div><pre>${esc(e.res)}</pre>`:''}</details>`).join(''):'<p class="muted">아직 기록이 없어요.</p>'}`; }
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
const TMO={quick:60000,default:300000,complex:600000};

/* Vertex 서비스 계정 토큰 */
const TOKC={};
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
async function aiOne(p,prompt,tier,imgs,options={}){
  v2CheckCancelled(options.signal);
  imgs=(imgs||[]).filter(x=>x&&x.data);
  const dm=DEFM[defKey(p)]||['',''];
  const model=((tier==='quick'?(p.quick||p.model):p.model)||(tier==='quick'?dm[1]||dm[0]:dm[0])||'').trim();
  if(!model) throw {code:'model_not_found',message:'모델 이름이 비어 있어요'};
  const max={quick:2000,default:8000,complex:16000}[tier];
  const cmax={quick:4000,default:16000,complex:32000}[tier];
  const P2=aiOneP2Text({prompt});
  smRecord(P2,tier);
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
    try{ let r; try{ r=await aiOne(p,prompt,tier,imgs,options); }catch(e0){ current();if(options.managedRetry||options.signal?.aborted||!(e0&&e0.code==='invalid_json')) throw e0; aiLog(Object.assign({},base,{ok:false,ms:Date.now()-t0,err:'invalid_json · 형식을 강조해서 한 번 더 요청해요',res:rs(),resLen:AILAST.length})); r=await aiOne(p,prompt+JSON_STRICT,tier,imgs,options); } current();aiLog(Object.assign(base,{ok:true,ms:Date.now()-t0,res:rs(),resLen:AILAST.length}));if(String(prompt).includes('【스토리 참조:')&&smState().latestRequest){smState().latestRequest.status='응답 수신';mark('meta');} if(p!==act) toast(`${p.name}(으)로 대신 썼어요`); return r; }
    catch(e){current();if(String(prompt).includes('【스토리 참조:')&&smState().latestRequest){smState().latestRequest.status='실패: '+String(e.message||e.code||e);mark('meta');}if(options.signal?.aborted)throw v2AbortError(); last=e; aiLog(Object.assign(base,{ok:false,ms:Date.now()-t0,err:`${(e&&e.code)||'오류'}${e&&e.code&&AIERR[e.code]?' ('+AIERR[e.code]+')':''}${e&&e.message?' · '+String(e.message).slice(0,300):''}`,res:rs(),resLen:AILAST.length})); if(imgs&&imgs.length&&!['no_ai','bad_key','refused'].includes(e&&e.code)){ try{ const r=await aiOne(p,prompt+'\n(첨부한 사진은 이 AI가 읽지 못했다. 사진 내용을 지어내지 않는다.)',tier,null,options);current();toast('이 AI는 사진을 읽지 못해서 글로만 답했어요'); return r; }catch(e2){ last=e2; } } }
  }
  throw last;
}

/* NovelAI */
const NAI_ENDPOINT='https://image.novelai.net/ai/generate-image';
const NAI_MODELS=[['nai-diffusion-5-full','V5 Full'],['nai-diffusion-5-curated','V5 Curated'],['nai-diffusion-4-5-full','V4.5 Full'],['nai-diffusion-4-5-curated','V4.5 Curated'],['nai-diffusion-4-full','V4 Full']];
const NAI_SIZES=[[832,1216,'세로 832×1216'],[1216,832,'가로 1216×832'],[896,1152,'세로 896×1152'],[1152,896,'가로 1152×896'],[1024,1024,'정사각 1024×1024']];
const NAI_FRAMES=[['full body','전신'],['cowboy shot','무릎 위'],['upper body','상반신'],['portrait','얼굴']];
const FRAME_TAGS=/^(full body|cowboy shot|upper body|portrait|lower body|feet out of frame)$/i;
const NAI_DEF={key:'',endpoint:NAI_ENDPOINT,model:'nai-diffusion-5-full',refModel:'nai-diffusion-4-5-full',steps:28,scale:6,cfgRescale:0.5,sampler:'k_euler_ancestral',noise:'karras',retries:3,timeoutSec:120,
  cutout:true,transparent:true,varietyBoostV45:true,quality:false,qtags:'',prefix:'',styleId:'my_style',autoArt:'ask',
  sizes:{char:'832x1216',bg:'1216x832',prop:'1024x1024',cg:'1216x832',enemy:'1024x1024',illust:'832x1216',lbcg:'832x1216',map:'832x1216',icon:'1024x1024'},
  ref:{type:'character',strength:1,fidelity:1},autoRef:'off',
  styles:[{id:'my_style',name:'내 그림체',tags:'',neg:''}],
  poses:NAI_POSES.map(([n,t])=>({n,t})),
  parts:NAI_PARTS_DEF, // 종류별 덧붙임·제외 태그 기본값은 프롬프트 스튜디오(0015)
  neg:NAI_NEG_DEF};
// 그림체 프리셋(STYLE_PRESETS)은 프롬프트 스튜디오(0015) 조립 함수 파일로 — 그림 프롬프트 태그는 스튜디오 한곳에
/* ===== 그림체 프리셋(내 프리셋): 태그·네거티브·품질·스텝·가이던스·리스케일·샘플러를 저장하고, 코드 한 줄(GGMPACK:…)로 공유해요.
   글 AI 지침(상단·중단·하단)은 설정 → 글 AI → 생성 지침에서 따로 정해요 ===== */
const PACKKEY='ggm-packs', LLMKEY='ggm-llmslot';
function userPacks(){ try{ const a=JSON.parse(appStorage.getItem(PACKKEY)||'[]'); return Array.isArray(a)?a:[]; }catch(e){ return []; } }
function saveUserPacks(a){ try{ appStorage.setItem(PACKKEY,JSON.stringify(a.slice(0,50))); return true; }catch(e){ toast('저장 공간이 부족해요'); return false; } }
/* 그림체 프리셋 썸네일: 프리셋 id별로 작은 그림(160px JPEG)을 이 기기에 저장해요. 내 프리셋을 코드로 내보내면 썸네일도 같이 가요 */
const PTHUMB='ggm-pthumb';
function pthumbs(){ try{ return JSON.parse(appStorage.getItem(PTHUMB)||'{}')||{}; }catch(e){ return {}; } }
function pthumb(id){ const p=userPacks().find(x=>x.id===id); return (p&&p.thumb)||pthumbs()[id]||''; }
function pthumbHTML(id,cls){ const t=pthumb(id); return t?`<img class="pthumb ${cls||''}" src="${esc(t)}" alt="">`:''; }
async function thumbData(file){ const b=await shrink(file,160); return await new Promise(r=>{ const fr=new FileReader(); fr.onload=()=>r(fr.result); fr.readAsDataURL(b); }); }
function allPresets(){ return [...STYLE_PRESETS,...userPacks().filter(p=>p.tags!=null||p.neg!=null)]; }
function llmSlots(){ let o={}; try{ o=JSON.parse(appStorage.getItem(LLMKEY)||'{}')||{}; }catch(e){} const L=Object.assign({top:'',mid:'',bot:'',tag:''},o); L.presets=Array.isArray(o.presets)?o.presets:[]; return L; }
function saveLlm(L){ try{ appStorage.setItem(LLMKEY,JSON.stringify(L)); return true; }catch(e){ toast('저장 공간이 부족해요'); return false; } }
/* 지침 프리셋: 이름 붙여 저장해 두고 켜고 끄는 지침. 켜진 것만 자리(상단·중단·하단)에 이어 붙여요 */
function llmEff(L){ L=L||llmSlots(); const o={top:L.top||'',mid:L.mid||'',bot:L.bot||'',tag:L.tag||''}; L.presets.filter(x=>x&&x.on&&String(x.text||'').trim()).forEach(x=>{ const k=['top','mid','bot','tag'].includes(x.pos)?x.pos:'top'; o[k]=(o[k]?o[k].trim()+'\n':'')+String(x.text).trim(); }); return o; }
const llmCode=p=>'GGMLLM:'+btoa(unescape(encodeURIComponent(JSON.stringify({name:p.name,pos:p.pos,text:p.text}))));
function llmFromCode(t){ const m=String(t||'').trim().match(/GGMLLM:([A-Za-z0-9+/=]+)/); if(!m) return null; try{ const o=JSON.parse(decodeURIComponent(escape(atob(m[1])))); return o&&o.text?o:null; }catch(e){ return null; } }
// Native Android prompt can expand past the keyboard when a long code is pasted.
// Keep long text in its field and the action footer outside the scrolling body.
function openPresetCode(kind,code){
 const exporting=typeof code==='string',llm=kind==='llm',title=(llm?'지침':'그림체')+' 프리셋 '+(exporting?'코드 내보내기':'코드 가져오기'),parent=$('#modal .sheet');
 const draft=[...(parent?.querySelectorAll('input[id],textarea[id],select[id]')||[])].map(el=>({id:el.id,value:el.value,checked:el.checked})),scroll=parent?.scrollTop||0,project=PJ().active;
 openModal(`${head(title)}<div class="preset-code-body"><p class="muted preset-code-help">${exporting?'코드를 길게 눌러 복사하거나 전체 선택을 눌러 주세요.':(llm?'GGMLLM:':'GGMPACK:')+'로 시작하는 코드 전체를 붙여 넣어 주세요.'}</p><label class="preset-code-label" for="preset-code-input">프리셋 코드</label><textarea class="in" id="preset-code-input" wrap="soft" spellcheck="false" autocapitalize="off" autocomplete="off" ${exporting?'readonly':''}></textarea><p id="preset-code-error" role="alert" hidden></p></div><div class="preset-code-actions"><button type="button" class="btn ghost" data-preset-code-action="cancel">${exporting?'닫기':'취소'}</button><button type="button" class="btn" data-preset-code-action="accept" ${exporting?'':'disabled'}>${exporting?'전체 선택':'가져오기'}</button></div>`,false,'preset-code-sheet');
 const modal=$('#modal'),sheet=modal.querySelector('.preset-code-sheet'),input=sheet.querySelector('textarea'),accept=sheet.querySelector('[data-preset-code-action=accept]'),error=sheet.querySelector('[role=alert]'),previousStyle=modal.style.cssText,vv=window.visualViewport;
 input.value=exporting?code:'';
 const current=()=>sheet.isConnected&&!modal.hidden&&PJ().active===project;
 const showError=text=>{error.textContent=text;error.hidden=false;};
 const fit=()=>{if(!current())return;const height=Math.max(0,Number(vv?.height)||innerHeight);modal.style.top=(vv?.offsetTop||0)+'px';modal.style.height=height+'px';modal.style.bottom='auto';sheet.style.height=Math.min(620,Math.max(0,height-16))+'px';};
 function cleanup(){vv?.removeEventListener('resize',fit);vv?.removeEventListener('scroll',fit);removeEventListener('resize',fit);observer.disconnect();modal.style.cssText=previousStyle;}
 const observer=new MutationObserver(()=>{if(!sheet.isConnected||modal.hidden)cleanup();});observer.observe(modal,{childList:true,attributes:true,attributeFilter:['hidden'],subtree:true});
 vv?.addEventListener('resize',fit);vv?.addEventListener('scroll',fit);addEventListener('resize',fit);fit();
 input.addEventListener('input',()=>{accept.disabled=!input.value.trim();error.hidden=true;});
 let committed=false;
 sheet.addEventListener('click',event=>{
  const button=event.target.closest('[data-preset-code-action]');if(!button)return;event.stopPropagation();if(!current()||committed)return;
  if(button.dataset.presetCodeAction==='cancel'){window.navBack();return;}
  if(exporting){input.focus({preventScroll:true});uiSelectText(input);return;}
  if(!input.value.trim())return;
  if(llm){
   const item=llmFromCode(input.value);if(!item){showError('코드를 읽지 못했어요. GGMLLM:으로 시작하는 코드 전체를 확인해 주세요.');return;}
   const L=llmSlots();L.presets.push({id:'lp'+uid(),name:String(item.name||'가져온 지침').slice(0,30),pos:['top','mid','bot','tag'].includes(item.pos)?item.pos:'top',text:String(item.text),on:false});
   for(const key of ['top','mid','bot','tag']){const field=draft.find(x=>x.id==='llm_'+key);if(field)L[key]=field.value;}
   if(!saveLlm(L)){showError('저장 공간이 부족해요. 입력한 코드는 유지했어요.');return;}
  }else{
   const item=packFromCode(input.value);if(!item){showError('코드를 읽지 못했어요. GGMPACK:으로 시작하는 코드 전체를 확인해 주세요.');return;}
   item.id='u'+uid();delete item.llm;item.name=String(item.name||'받은 프리셋').slice(0,30);const items=userPacks();items.unshift(item);
   if(!saveUserPacks(items)){showError('저장 공간이 부족해요. 입력한 코드는 유지했어요.');return;}
  }
  committed=true;cleanup();window.navBack();openModal(llm?llmHTML():packHTML());
  const restored=$('#modal .sheet');for(const value of draft){const el=restored.querySelector('#'+value.id);if(el){el.value=value.value;if(el.type==='checkbox'||el.type==='radio')el.checked=value.checked;}}restored.scrollTop=scroll;
  toast(llm?'가져왔어요. 내용을 확인하고 켜 주세요':'그림체 프리셋을 추가했어요. 적용을 눌러 쓰세요');
 });
 if(!exporting)input.focus({preventScroll:true});
}
// 모든 글 AI 요청에 지침을 끼워요: 상단=맨 앞, 중단=출력 형식(JSON만 출력…) 바로 앞, 하단=맨 끝
// 그림 태그 지침: AI가 NovelAI(그림) 태그를 쓰는 요청에만 출력 형식 바로 앞에 넣어요
const TAG_REQ=/NovelAI|naiPrompt|Danbooru|영어 태그|장면 태그/;
const packCode=p=>'GGMPACK:'+btoa(unescape(encodeURIComponent(JSON.stringify(p))));
function packFromCode(t){ const m=String(t||'').trim().match(/GGMPACK:([A-Za-z0-9+/=]+)/); if(!m) return null; try{ const o=JSON.parse(decodeURIComponent(escape(atob(m[1])))); return o&&typeof o==='object'?o:null; }catch(e){ return null; } }
// All presets transport quality inside their positive style; qtags is legacy input only.
function presetQualityParts(p){return {tags:joinTags(p.tags,p.qtags),qtags:'',quality:false};}
function packApply(p){ if(p.tags!=null||p.neg!=null){ const c=naiCfg(),q=presetQualityParts(p); c.styles=[{id:'my_style',name:'내 그림체',tags:q.tags,neg:p.neg||''}]; c.styleId='my_style'; c.qtags='';c.quality=false;c.legacyQualityTags=''; ['steps','scale','cfgRescale','sampler'].forEach(k=>{ if(p[k]!=null&&p[k]!=='') c[k]=p[k]; }); try{ appStorage.setItem(NKEY,JSON.stringify(c)); }catch(e){} } }
function packHTML(){ const up=userPacks();
  return `${head('그림체 프리셋','<span class="muted">적용하면 그림 AI 설정에 바로 들어가요</span>')}
  <h3 class="sec">기본 프리셋</h3>${STYLE_PRESETS.map(p=>`<div class="ep">${pthumbHTML(p.id)}<span class="t"><b>${esc(p.name)}</b><span class="muted">${esc(p.desc||'')}${p.by?' · '+esc(p.by):''}</span></span><button class="btn sm" data-act="packuse" data-v="${p.id}">적용</button><button class="btn sm ghost" data-act="pthumbset" data-v="${p.id}" title="썸네일">🖼</button>${pthumb(p.id)?`<button class="btn sm ghost" data-act="pthumbdel" data-v="${p.id}" title="썸네일 지우기">🗑</button>`:''}</div>`).join('')}
  <h3 class="sec">내 프리셋 ${up.length}</h3>${up.length?up.map(p=>`<div class="ep">${pthumbHTML(p.id)}<span class="t"><b>${esc(p.name)}</b><span class="muted">${esc(String(p.tags||'').slice(0,40))}${p.by?' · '+esc(p.by):''}</span></span><button class="btn sm" data-act="packuse" data-v="${p.id}">적용</button><button class="btn sm ghost" data-act="pthumbset" data-v="${p.id}" title="썸네일">🖼</button>${pthumb(p.id)?`<button class="btn sm ghost" data-act="pthumbdel" data-v="${p.id}" title="썸네일 지우기">🗑</button>`:''}<button class="btn sm ghost" data-act="packcopy" data-v="${p.id}">내보내기</button><button class="btn sm ghost" data-act="packdel" data-v="${p.id}">✕</button></div>`).join(''):'<p class="muted" style="margin:0">아직 없어요.</p>'}
  <div class="row" style="margin-top:12px"><button class="btn sm" data-act="packsave">지금 그림체를 프리셋으로 저장</button><button class="btn sm ghost" data-act="packimport">코드로 가져오기</button></div>`; }
/* 지침 프리셋 고치기: 입력칸에 그 프리셋을 채움(View) */
function llmPresetFormFill(x){ $('#llp_name').value=x.name||''; $('#llp_pos').value=x.pos||'top'; $('#llp_text').value=x.text||''; $('#llp_id').value=x.id; $('#llp_text').focus({preventScroll:true}); }
function llmHTML(){ const L=llmSlots(); return `${head('글 AI 지침','<span class="muted">모든 글 AI 요청에 들어가요</span>')}
  <label class="f" for="llm_top">상단 <span class="muted" style="font-size:.75rem">맨 앞 · 역할, 문체, 세계관 전반 규칙</span></label><textarea class="in" id="llm_top" style="min-height:80px" placeholder="예: 너는 서브컬처 가챠 게임 전문 시나리오 작가다. 문장은 짧고 리듬감 있게.">${esc(L.top)}</textarea>
  <label class="f" for="llm_mid">중단 <span class="muted" style="font-size:.75rem">출력 형식 바로 앞 · 내용에 대한 요구</span></label><textarea class="in" id="llm_mid" style="min-height:80px" placeholder="예: 대사마다 캐릭터의 말버릇을 한 번 이상 살린다. 장면 묘사는 2문장 이내.">${esc(L.mid)}</textarea>
  <label class="f" for="llm_bot">하단 <span class="muted" style="font-size:.75rem">맨 끝 · 마지막 확인·금지 사항</span></label><textarea class="in" id="llm_bot" style="min-height:80px" placeholder="예: 출력 전에 이름·호칭이 설정과 맞는지 다시 확인한다.">${esc(L.bot)}</textarea>
  <label class="f" for="llm_tag">그림 태그 지침 <span class="muted" style="font-size:.75rem">AI가 그림(NovelAI) 태그를 쓸 때만 · 캐릭터 외형·일러스트·CG·배경·소품·의상</span></label><textarea class="in" id="llm_tag" style="min-height:80px" placeholder="예: 의상은 색·재질·장식을 3가지 이상 구체적으로. 일러스트·CG 장면 태그에는 조명(rim light, backlighting 등)과 구도(dutch angle, from below 등)를 1개씩 넣는다. 노출이 많은 의상 태그는 쓰지 않는다.">${esc(L.tag||'')}</textarea>
  <p class="muted" style="margin:4px 0 0;font-size:.76rem">그림마다 항상 똑같이 붙일 태그는 설정 → 그림 AI의 '스탠딩 뒤·일러스트 뒤…' 칸에 적으세요(AI를 거치지 않고 그대로 붙어요).</p>
  <div class="row" style="margin-top:12px"><button class="btn" data-act="llmsave">저장</button></div>
  <h3 class="sec">지침 프리셋 <span class="muted" style="font-size:.75rem">켜 둔 것만 위 칸 뒤에 이어 붙어요</span></h3>
  ${L.presets.length?L.presets.map(x=>`<div class="ep"><label style="display:flex;gap:8px;align-items:center;flex:1;min-width:0"><input type="checkbox" data-act="llmtog" data-id="${x.id}" ${x.on?'checked':''}><span class="t"><b>${esc(x.name||'이름 없음')}</b><span class="muted">${({top:'상단',mid:'중단',bot:'하단',tag:'그림 태그'})[x.pos]||'상단'} · ${esc(String(x.text||'').slice(0,40))}</span></span></label><button class="btn sm ghost" data-act="llmpedit" data-id="${x.id}">수정</button><button class="btn sm ghost" data-act="llmpcopy" data-id="${x.id}">내보내기</button><button class="btn sm ghost" data-act="llmpdel" data-id="${x.id}">✕</button></div>`).join(''):'<p class="muted" style="margin:0 0 6px;font-size:.82rem">자주 쓰는 지침을 이름 붙여 저장해 두면 복붙 없이 켜고 끌 수 있어요.</p>'}
  <div class="optbox" style="margin-top:8px"><div class="g2"><div><label class="f" for="llp_name">이름</label><input class="in" id="llp_name" maxlength="30" placeholder="예: 문체 지침"></div><div><label class="f" for="llp_pos">자리</label><select class="in" id="llp_pos">${opt([['top','상단'],['mid','중단'],['bot','하단'],['tag','그림 태그 지침']],'top')}</select></div></div>
    <label class="f" for="llp_text">지침 내용</label><textarea class="in" id="llp_text" style="min-height:90px"></textarea><input type="hidden" id="llp_id" value="">
    <div class="row" style="margin-top:8px"><button class="btn sm" data-act="llmpadd">프리셋 저장</button><button class="btn sm ghost" data-act="llmpimport">코드로 가져오기</button></div></div>`; }
// 초안에서 고른 프리셋을 그림 AI 설정에 바로 적용해요(그림체 태그·네거티브·품질 태그·스텝·가이던스·샘플러)
function presetToCfg(id){ const s=allPresets().find(x=>x.id===id); if(!s) return false; const c=naiCfg(),q=presetQualityParts(s); c.styles=[{id:'my_style',name:'내 그림체',tags:q.tags,neg:s.neg}]; c.styleId='my_style'; c.qtags=''; c.quality=false; c.legacyQualityTags=''; c.steps=s.steps; c.scale=s.scale; c.cfgRescale=s.cfgRescale; c.sampler=s.sampler; try{ appStorage.setItem(NKEY,JSON.stringify(c)); }catch(e){ return false; } return true; }
function drPresetHTML(){ const cur=DR2.preset||''; return `<label class="f">그림체 프리셋</label><div class="dr-pres">${[{id:'',name:'지금 설정 그대로',desc:'설정 → 그림 AI의 그림체를 써요'},...allPresets()].map(s=>`<button type="button" class="dr-pre ${cur===s.id?'on':''}" data-act="drpreset" data-v="${s.id}">${s.id?pthumbHTML(s.id,'big'):''}<b>${esc(s.name)}</b><span>${esc(s.desc)}${s.by?` · 프리셋 제공: ${esc(s.by)}`:''}</span></button>`).join('')}</div><p class="muted" style="margin:4px 0 0;font-size:.76rem">고르면 그림 AI 설정(그림체·품질 태그·스텝·가이던스·샘플러)에 바로 적용되고, 이 게임의 그림체로 저장돼요.</p>`; }
function applyStylePreset(id){ const s=allPresets().find(x=>x.id===id); if(!s) return; const set=(k,v)=>{ const el=$('#'+k); if(el) el.value=v; };
  const q=presetQualityParts(s); set('nai_stags',q.tags); if($('#nai_stags'))$('#nai_stags').dataset.presetApplied='true'; set('nai_sneg',s.neg); set('nai_steps',s.steps); set('nai_scale',s.scale); set('nai_cfgr',s.cfgRescale); set('nai_sampler',s.sampler);
  toast(`「${s.name}」 프리셋을 채웠어요. 아래 '저장'을 눌러야 적용돼요`);  }
const NAI_QUALITY={'nai-diffusion-5-full':'very aesthetic, masterpiece, best quality','nai-diffusion-5-curated':'very aesthetic, masterpiece, best quality','nai-diffusion-4-5-full':'very aesthetic, masterpiece, no text','nai-diffusion-4-5-curated':'location, masterpiece, no text','nai-diffusion-4-full':'no text, best quality, very aesthetic, absurdres'};
const ILK=k=>k==='illust'||k==='lbcg';
const isV4p=m=>/^nai-diffusion-(?:4|5)(?:-|$)/.test(String(m||'').trim());
const isV45=m=>/^nai-diffusion-4-5/.test(String(m||'').trim());
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
const COMPO_TAGS=/^(full body|standing|straight-on|simple background|white background|cowboy shot|upper body|portrait|looking at viewer|arms at sides|transparent background)$/i;
function tagList(s){const t=String(s||''),out=[];let inW=false,st=0;for(let i=0;i<t.length;i++){if(t[i]===':'&&t[i+1]===':'){inW=!inW;i++;continue;}if(t[i]===','&&!inW){const x=t.slice(st,i).trim();if(x)out.push(x);st=i+1;}}const x=t.slice(st).trim();if(x)out.push(x);return out;}
function tagKey(t){return String(t).replace(/^[-+]?\d+(?:\.\d+)?::\s*(.*?)\s*::$/,'$1').replace(/\s+/g,' ').trim().toLowerCase();}
function joinTags(...parts){const seen=new Set(),out=[];parts.forEach(p=>tagList(p).forEach(t=>{const k=tagKey(t);if(k&&!seen.has(k)){seen.add(k);out.push(t);}}));return out.join(', ');}
function naiStyle(c,id){const b=c.styles.find(x=>x.id===id)||c.styles.find(x=>x.id===c.styleId)||c.styles[0]||{id:'my_style',tags:'',neg:''};const m=(typeof G!=='undefined'&&G&&G.meta)?G.meta:null;if(m&&String(m.artTags||'').trim())return {id:b.id,name:'이 게임 그림체',tags:joinTags(String(m.artTags),c.legacyQualityTags),neg:String(m.artNeg||'')};return b;}
const AGE_TAGS=/^(mature female|mature male|mature woman|mature man|milf|mature|adult woman|adult man|adult|older woman|old woman|aged up)$/i;
function stripAge(s){ return tagList(s).filter(t=>!AGE_TAGS.test(tagKey(t))).join(', '); }
const CG_POS={left:{x:.3,y:.5},center:{x:.5,y:.5},right:{x:.7,y:.5}};
const CG_POS_LABEL=[['auto','자동'],['left','왼쪽'],['center','가운데'],['right','오른쪽']];
/* CG에 플레이어가 나오면 플레이어 외모 태그(프로필 그림을 그린 태그)를 써요 */
function cgCast(l){return (l&&l.cast||[]).map(x=>({c:x.id==='__player'?playerCast():charById(x.id),pos:x.pos||'auto',act:x.act||''})).filter(x=>x.c);}
// 캐릭터 디자인 통일: 이 게임의 가챠 캐릭터 그림에 공통 태그 + 세력별 태그를 붙여요(NPC·콜라보 게스트·스킨에는 안 붙고, 캐릭터마다 끌 수 있어요)
function designTags(c){ if(!c||c.npc||c.noDesign||c.collab||typeof G==='undefined'||!G||!(G.chars||[]).includes(c)) return ''; const d=(G.meta&&G.meta.design)||{}; return joinTags(String(d.all||''),String(((d.fac||{})[c.faction])||'')); }
/* Structured image prompts. Legacy strings remain the transport format and are never
   discarded. Unknown tags stay editable in other; no LLM is called on opening a UI. */
const NAI_BLOCK_KEYS=['appearance','outfit','other','style'];
function naiBlocksJoin(p){return NAI_BLOCK_KEYS.map(k=>String(p?.[k]||'').trim()).filter(Boolean).join(', ');}
// Rules version 3: separate style/quality without rewriting transport strings.
const NAI_BLOCK_RULE_VERSION=3;
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
function naiBlocksFieldParts(field){
 const e=typeof field==='string'?document.getElementById(field):field;if(!e)return null;
 try{const p=JSON.parse(e.dataset.naiBlocks||'null');if(p?.combined===e.value)return {...p,...naiBlocksUpgrade(p)};}catch(_){}
 return {...naiBlocksSplit(e.value),combined:e.value};
}
function naiBlocksSave(o,key,field){const p=naiBlocksFieldParts(field);if(!p)return;const e=typeof field==='string'?document.getElementById(field):field,original=o.naiBlocks?.[key]?.original??e?.dataset.naiOriginal??String(o[key]||'');
 o[key]=p.combined;o.naiBlocks={...o.naiBlocks,[key]:{...p,original}};
}
function naiBlocksSeed(field,parts){const e=typeof field==='string'?document.getElementById(field):field;if(!e)return;
 const p={...parts,...naiBlocksUpgrade(parts),combined:parts.combined??naiBlocksJoin(parts)};e.dataset.naiBlocks=JSON.stringify(p);e.value=p.combined;
}
// Lookup only runs while an editor exists. It does not migrate or save a game on load.
function naiBlocksOwner(e){
 const id=e.id;
 if(id==='f_nai'||id==='f_wp'){const cid=document.querySelector('[data-act=savechar]')?.dataset.id||document.querySelector('[data-act=savec]')?.dataset.id||e.dataset.owner;const c=charById(cid);return {o:id==='f_wp'?c?.weapon:c,key:id==='f_wp'?'prompt':'naiPrompt'};}
 if(e.dataset.nf==='naiPrompt'){const n=(G.npcs||[]).find(n=>e.closest('[id]')?.id==='npc_'+n.id||e.closest('#npc_'+n.id));return {o:n,key:'naiPrompt'};}
 if(e.dataset.dc==='tags')return {o:DR2.chars[+e.dataset.i],key:'tags'};
 if(id==='ds_all')return {o:G.meta.design,key:'all'};
 if(id.startsWith('ds_f'))return {o:{value:(G.meta.design?.fac||{})[e.dataset.fac]||'',naiBlocks:{value:G.meta.design?.facBlocks?.[e.dataset.fac]}},key:'value'};
 if(id==='nai_prefix')return {o:naiCfg(),key:'prefix'};
 if(id.startsWith('nai_p_'))return {o:naiCfg().parts[id.slice(6)],key:'suffix'};
 if(['wp_scene','il_scene','lb_scene','sc_scene','lbbg_scene'].includes(id)){const c=charById(e.closest('.cs-sheet')?.dataset.cid);return {o:id==='wp_scene'?c?.weapon:c?.[({il_scene:'illust',lb_scene:'lbcg',sc_scene:'scg',lbbg_scene:'lbbg'})[id]],key:'prompt'};}
 if(id==='v2-icon-prompt'&&typeof V2ICONS!=='undefined'){const p=V2ICONS?.preview;return {o:p&&{prompt:p.prompt,naiBlocks:{prompt:p.promptParts}},key:'prompt'};}
 if(id==='pf_nai')return {o:progSlot('avatar'),key:'prompt'}; /* 플레이어 외형 칸은 0160 avatarObj가 맡음(없으면 만듦) */
 if(id==='sk_prompt'&&document.getElementById('sk_char'))return {o:G.meta.shop?.self,key:'naiPrompt'};
 if(id==='rg_e_look')return {o:REGEN?.nc,key:'naiPrompt'};
 if(id==='li_prompt')return {o:libById(document.querySelector('[data-act=savelib]')?.dataset.id),key:'prompt'};
 if(e.dataset.skinPrompt){const c=charById(e.dataset.owner);return {o:c?.skins?.find(k=>k.id===e.dataset.skinPrompt),key:'prompt'};}
 if(e.dataset.candidateField==='prompt'&&typeof IMAGE_CANDIDATES!=='undefined'&&IMAGE_CANDIDATES?.config?.promptParts){e.dataset.naiBlocks=JSON.stringify(IMAGE_CANDIDATES.config.promptParts);}
 return null;
}
function naiBlocksEditable(e){
 if(!e.matches('textarea,input')||e.type==='password'||e.type==='hidden'||e.dataset.naiPart)return false;
 if(e.dataset.naiCharacter==='true')return true;
 if(e.matches('#f_nai,#rg_e_look,#sk_prompt,[id^="np_cc"],#pf_nai,[data-nf="naiPrompt"],[data-dc="tags"],[data-skin-prompt]'))return true;
 if(e.id==='np_in')return !!NPREP&&['char','illust','lbcg'].includes(NPREP.k)||NPREP?.k==='enemy';
 if(e.dataset.candidateField==='prompt')return typeof IMAGE_CANDIDATES!=='undefined'&&IMAGE_CANDIDATES?.config?.promptBlocks===true;
 if(e.id==='li_prompt')return e.closest('.sheet')?.querySelector('[data-act=savelib]')?.dataset.k==='enemy';
 return false;
}
function naiBlocksMount(e){
 if(e._naiBlocksUI||!naiBlocksEditable(e))return;
 const key=e.id||'nai-block-'+(++naiBlocksMount.serial),origin=e.value,owner=naiBlocksOwner(e);
 if(!e.id)e.id=key;
 if(owner?.o&&!e.dataset.naiBlocks){const saved=owner.o.naiBlocks?.[owner.key];if(saved?.combined===origin)e.dataset.naiBlocks=JSON.stringify(saved);}
 e.dataset.naiOriginal=e.dataset.naiOriginal??owner?.o?.naiBlocks?.[owner.key]?.original??origin;
 const wrap=document.createElement('div');wrap.className='nai-block-editor';
 e.before(wrap);wrap.append(e);e.hidden=true;e.setAttribute('aria-hidden','true');
 const isObject=e.id==='li_prompt';
 const labels={appearance:isObject?'외형·형태':'캐릭터 외형',outfit:'의상·착용 장신구',other:'표정·자세·장면 / 미분류',style:'그림체·품질'};
 for(const k of NAI_BLOCK_KEYS){const label=document.createElement('label');label.className='f';label.htmlFor=key+'__'+k;label.textContent=labels[k];
  const input=document.createElement('textarea');input.className='in';input.id=label.htmlFor;input.dataset.naiPart=k;input.rows=2;input.spellcheck=false;
  input.placeholder=k==='appearance'?(isObject?'물건의 모양·재질·색, 몬스터의 생김새':'머리·눈·피부·체형·종족 등 변하지 않는 특징'):k==='outfit'?'옷·신발·모자·착용 장식 (해당 없으면 비워 두세요)':k==='style'?'작가·화풍·채색·선화·품질 태그':'표정·행동·구도·배경·효과·분류가 애매한 태그';wrap.append(label,input);
 }
 const help=document.createElement('p');help.className='muted nai-block-help';help.textContent='네 칸을 합쳐 그림 AI에 전달해요. 기존 태그와 가중치는 보존하며, 애매한 태그는 미분류 칸에서 확인해 주세요.';wrap.append(help);
 const details=document.createElement('details'),summary=document.createElement('summary'),raw=document.createElement('pre');summary.textContent='프롬프트 한 번에 보기';raw.textContent=origin;details.append(summary,raw);wrap.append(details);
 const native=Object.getOwnPropertyDescriptor(e instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value'),fields=Object.fromEntries(NAI_BLOCK_KEYS.map(k=>[k,wrap.querySelector('[data-nai-part="'+k+'"]')]));
 const paint=()=>{raw.textContent=e.value;const p=naiBlocksFieldParts(e);for(const k of NAI_BLOCK_KEYS)fields[k].value=p[k]||'';};
 Object.defineProperty(e,'value',{configurable:true,get(){return native.get.call(this);},set(v){native.set.call(this,v);paint();}});
 wrap.addEventListener('input',event=>{if(!event.target.dataset.naiPart)return;const p=Object.fromEntries(NAI_BLOCK_KEYS.map(k=>[k,fields[k].value]));p.combined=naiBlocksJoin(p);e.dataset.naiBlocks=JSON.stringify(p);native.set.call(e,p.combined);raw.textContent=p.combined;});
 e._naiBlocksUI=wrap;paint();
}
naiBlocksMount.serial=0;
function naiBlocksScan(root=document){for(const e of root.querySelectorAll('textarea,input'))naiBlocksMount(e);}
// Observe newly opened dialogs only, not keystrokes or the entire game data.
(function(){let queued=false;const pending=new Set();const observer=new MutationObserver(records=>{
 for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1&&!node.closest?.('.nai-block-editor'))pending.add(node);
 if(!pending.size||queued)return;queued=true;queueMicrotask(()=>{queued=false;const nodes=[...pending];pending.clear();for(const node of nodes)if(node.isConnected){naiBlocksMount(node);naiBlocksScan(node);}});
 });observer.observe(document.body,{childList:true,subtree:true});naiBlocksScan();})();
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
const AIERR={origin_block:'이 서비스가 브라우저에서 온 요청(Origin 헤더)을 막았어요(403).',el_nokey:'설정의 소리에서 ElevenLabs 키를 넣어 주세요.',fish_nokey:'설정의 소리에서 Fish Audio 키를 넣어 주세요.',no_ai:'설정의 글 AI에서 AI를 먼저 등록해 주세요.',model_not_found:'모델 이름이나 리전을 확인해 주세요.',sa_bad:'서비스 계정 JSON을 확인해 주세요. 파일 내용 전체를 붙여넣어야 해요.',bad_key:'키가 올바르지 않거나 권한이 없어요. 설정의 글 AI에서 확인해 주세요.',network:'인터넷 연결을 확인해 주세요.',low_credit:'API 크레딧이 부족해요. Claude Console에서 충전해 주세요.',not_granted:'AI 사용 권한이 꺼져 있어요. 앱의 권한 메뉴에서 켤 수 있어요.',rate_limited:'요청이 많아요. 잠시 후 다시 시도해 주세요.',refused:'AI가 이 요청은 쓰지 않았어요. 수위나 내용을 바꿔 다시 시도해 주세요.',invalid_json:'AI 응답을 읽지 못했어요. 다시 시도해 주세요.',cancelled:'취소했어요.'};
let AI_QUIET=false,AI_QUIET_LAST=''; // 새 게임 단계 재시도 중에는 같은 오류 알림을 되풀이하지 않고 마지막 원인만 보여 줘요
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
/* 그림체(직접 입력): NovelAI 저장 설정 읽기·내 그림체 */
const STYLE_EX='예: anime coloring, cel shading, vibrant colors  /  watercolor (medium), soft colors  /  1.2::artist:이름 ::';
function naiSaved(){let sv={};try{sv=JSON.parse(appStorage.getItem(NKEY))||{};}catch(e){}return sv;}
function setMyStyle(tags,neg){const sv=naiSaved();sv.styles=[{id:'my_style',name:'내 그림체',tags:String(tags||'').trim(),neg:String(neg||'').trim()}];sv.styleId='my_style';appStorage.setItem(NKEY,JSON.stringify(sv));}
function myStyle(){return naiCfg().styles[0];}
