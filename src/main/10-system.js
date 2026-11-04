/* ===== system — 기능 class(Model · View · Ctl) — docs/redesign.md 2·3절, tools/reshape.mjs가 매핑대로 옮김 ===== */
class System {
    // 용어는 AI·가져온 게임·직접 입력에서 와서 화면 템플릿 70여 곳에 그대로 들어가요. 태그가 될 < >는 빼고 " 는 ” 로 바꿔 돌려줘요(HTML 주입 방지, tools: esc() 없이 HTML에 넣는 글)
static T(k){const t=(typeof G!=='undefined'&&G&&G.meta&&G.meta.terms)||{};return String(t[k]||DEFAULT_META.terms[k]||k).replace(/[<>]/g,'').replace(/"/g,'”');}

    // AI가 대본 줄을 쉼표로 이어 붙여 보낸 경우("[음악: 일상],A: 안녕!,B: 뭐 해") 줄로 되돌려요
static unComma(t){ t=String(t||''); const re=/,\s*(?=\[[^\]\n]{1,30}\]|[^\s,:\[\]\n"'][^,:\n\[\]]{0,15}(?:\[[^\]\n]{1,12}\])?:\s)/g;
    return t.split('\n').map(l=>{ const m=l.match(re); return m&&m.length>=2&&/^\s*(\[|[^,:\n]{1,16}(\[[^\]]*\])?:)/.test(l)?l.replace(re,'\n'):l; }).join('\n'); }

    /* 흩어진 프롬프트 조각을 한곳에서 보고(조각 목록), 게임마다 고쳐 쓰고(덮어쓰기·덧붙이기), AI로 다듬고,
     그림 프롬프트를 점검·정정하고, 정정한 내용을 "교훈"으로 쌓아 다음 요청부터 같은 실수를 막아요.
     - 조각: pfDef(id,label,get)로 등록 → window[id] 게터가 promptFrag(id)를 돌려줌. 덮어쓰기는 G.meta.prompts[id]={text,add}
     - 그림 가드: imgGuard(kind,tags) — 배경·소품·지도·아이콘에서 사람 태그를 빼고 "no humans" 머리말을 붙임(composeNai에서 항상 실행)
     - 교훈: appStorage 'ggm-plessons' (모델 버릇은 게임이 아니라 AI에 딸리므로 전체 공통). 가드가 고칠 때마다 hits가 오르고,
       켜진 교훈은 그림 태그 요청(TAG_REQ)이나 모든 요청(scope:'all')에 llmWrap이 끼워 넣음
     문서: docs/research/prompts.md */
static pfDef(id,label,get,where){ const R=window.__PF||(window.__PF={}); R[id]={id,label,get,where:where||''}; Object.defineProperty(window,id,{get:()=>System.promptFrag(id),configurable:true}); }

  static promptFrag(id){ const f=(window.__PF||{})[id]; if(!f) return ''; const base=f.get(), o=PromptStudio.promptOv()[id]; if(!o) return base; const t=o.text&&o.text.trim()?o.text:base; return o.add&&o.add.trim()?t+'\n'+o.add.trim():t; }

    // llmWrap에서 씀: 그림 태그 요청이면 그림 가이드 + 그림 교훈, 모든 요청에 scope:'all' 교훈
static plInject(isTag){ const on=PromptStudio.plList().filter(l=>l.on&&(l.scope==='all'||isTag)); const g=isTag?IMG_GUIDE:''; if(!on.length&&!g) return ''; return `${Core.pf('LESSON_HEAD')}\n${g?g+'\n':''}${on.map(l=>'- '+l.rule).join('\n')}\n`; }

    /* src/main/0040-sound.js */
static jaBatchPrompt({part}){ return `${Core.pf('VOICE_JA_BATCH',{part:part.map((x,j)=>(j+1)+'. '+x).join('\n')})}\nJSON만 출력: {"ja":["옮긴 대사 ${part.length}개"]}`; }

  static toJaPrompt({t}){ return `${Core.pf('VOICE_JA',{t})}JSON만 출력: {"ja":"일본어 대사"}`; }

    /* src/main/0462-direction.js */
static directScriptPrompt({src}){ return `${Core.pf('DIRECT_SCRIPT',{RULES,DIRECTION_GUIDE,src})}\n\nJSON만 출력: {"script":"연출을 더한 대본 전체"}`; }

    /* src/main/0020-ai-connect.js */
static llmWrap(pr){ const L=System.llmEff(); let s=String(pr);
    { const isTag=TAG_REQ.test(s), pl=System.plInject(isTag); if(pl){ let i=s.lastIndexOf('JSON만 출력'); if(i<0) i=s.length; s=s.slice(0,i)+pl+s.slice(i); } } // 프롬프트 스튜디오(0025) 교훈·그림 가이드
    if(L.tag&&TAG_REQ.test(s)){ let i=s.lastIndexOf('JSON만 출력'); if(i<0) i=s.length; s=s.slice(0,i)+Core.pf('USER_TAG_GUIDE_HEAD')+'\n'+L.tag.trim()+'\n'+s.slice(i); }
    if(!L.top&&!L.mid&&!L.bot) return s;
    if(L.mid){ let i=s.lastIndexOf('JSON만 출력'); if(i<0){ const j=s.lastIndexOf('\n'); i=j>0?j+1:s.length; } s=s.slice(0,i)+'[제작자 지침]\n'+L.mid.trim()+'\n'+s.slice(i); }
    return (L.top?'[제작자 지침]\n'+L.top.trim()+'\n\n':'')+s+(L.bot?'\n\n[제작자 지침]\n'+L.bot.trim():''); }

    /* AI 설정 목록(저장소 PKEY): 읽기 AIP — 없으면 예전 키(AKEY)에서 옮긴 모양을 보여 주기만, 저장은 불러올 때 한 번(aipMigrate) */
static aipLegacy(){ const d={active:'',fallback:true,list:[]}; try{const o=JSON.parse(appStorage.getItem(AKEY)); if(o&&o.key){const p={id:'p'+Date.now(),name:'Claude',type:'anthropic',key:o.key,model:o.model||'',quick:o.quick||''};d.list.push(p);d.active=p.id;}}catch(e){} return d; }

  static AIP(){
    let d=null; try{d=JSON.parse(appStorage.getItem(PKEY));}catch(e){}
    d=d||System.aipLegacy(); d.list=d.list||[]; return d;
  }

  static aipMigrate(){ try{ if(!appStorage.getItem(PKEY)) appStorage.setItem(PKEY,JSON.stringify(System.aipLegacy())); }catch(e){ Core.quietErr(e,'aipMigrate'); } }

  static saveAIP(d){appStorage.setItem(PKEY,JSON.stringify(d));System.setupAI();}

  static defKey(p){return p.type==='vertex'?'vertex_'+(p.pub||'google'):p.type;}

  static setupAI(){ SAMPLE=System.AIP().list.some(Core.apValid)?{json:(pr,o)=>System.aiCall(System.llmWrap(pr),(o&&o.modelTier)||'default',o&&o.images,o||{})}:null; }

  static PCS(){ try{ const o=JSON.parse(appStorage.getItem('ggm-pc')||'null'); return o&&o.base&&o.key?o:null; }catch(e){ return null; } }

  static setPCS(o){ try{ if(o) appStorage.setItem('ggm-pc',JSON.stringify(o)); else appStorage.removeItem('ggm-pc'); }catch(e){} }

  static parsePcLink(s){ try{ const u=new URL(String(s).trim()); const k=u.searchParams.get('pc'); return k?{base:u.origin,key:k}:null; }catch(e){ return null; } }

  static pcOrigin(){ const pc=System.PCS(); return !!(pc&&pc.base===location.origin); }

    // PC 서버 주소인데 연결 키가 없어요(키 없이 다시 열었거나, 홈 화면 앱처럼 저장 공간이 따로인 경우) → 빈 게임으로 시작하지 않고 다시 연결하게 해요
static pcLostKey(){ if(IS_NATIVE||System.PCS()) return false; return /\.trycloudflare\.com$/i.test(location.hostname)||location.port==='8790'; }

  static webProxy(){ if(IS_NATIVE) return ''; try{ return String(appStorage.getItem('ggm-proxy')||'').trim(); }catch(e){ return ''; } }

  static b64ToBytes(b){const s=atob(b);const u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u;}

  static b64url(u8){let s='';for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}

    // 브라우저 요청 시간 제한: 끝없이 기다리지 않고 끊어서, 성공·실패를 꼭 알려 줘요 (PR #3 LTXY12님)
static pcSoon(){ try{ const pc=System.PCS(); if(pc&&pc.auto!==false) setTimeout(()=>{ try{ const r=SystemView.pcPush(true); if(r&&r.catch) r.catch(()=>{}); }catch(e){} },400); }catch(e){} }

  static abortedMsg(e,base){ return (e&&e.name==='AbortError')?'시간이 오래 걸려서 연결을 끊었어요. 로컬 AI라면 추론이 설정한 대기 시간보다 긴지 확인해 주세요.':base; }

  static proxyOff(){ try{ return appStorage.getItem('ggm-proxy-off')==='1'; }catch(e){ return false; } }

  static async http(url,{method='GET',headers={},body,binary=false,form=false,timeout=180000,signal}={}){
    v2CheckCancelled(signal);
    const H=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.CapacitorHttp;
    if(H){
      const nh=Object.assign({'User-Agent':'GachaGameMaker/'+APP_BUILD+' (Android)'},headers); let r; try{ r=await v2Abortable(H.request({url,method,headers:nh,data:body,responseType:binary?'arraybuffer':'text',connectTimeout:30000,readTimeout:timeout}),signal); }catch(e){if(signal?.aborted)throw v2AbortError(); throw {code:'network',message:String(e&&e.message||'')}; }
      let bytes=null,text=null;
      if(binary&&typeof r.data==='string'&&r.status<400){ try{bytes=System.b64ToBytes(r.data);}catch(e){text=r.data;} }
      else if(r.data instanceof ArrayBuffer) bytes=new Uint8Array(r.data);
      else text=typeof r.data==='string'?r.data:JSON.stringify(r.data);
      if(binary&&r.status>=400&&text&&!/^[\[{]/.test(text.trim())&&/^[A-Za-z0-9+/=\s]{8,}$/.test(text)){ try{const d=new TextDecoder().decode(System.b64ToBytes(text.replace(/\s/g,'')));if(!/[\u0000-\u0008\uFFFD]/.test(d))text=d;}catch(e){} }
      const hd={}; Object.entries(r.headers||{}).forEach(([k,v])=>{hd[String(k).toLowerCase()]=String(v);});
      return {status:r.status,bytes,text,headers:hd};
    }
    const pc=System.PCS(); let tgt=null; try{ tgt=new URL(url); }catch(e){}
    const direct=tgt&&(/(^|\.)(github\.com|githubusercontent\.com|github\.io)$/i.test(tgt.hostname)||System.proxyOff()); // GitHub는 브라우저에서 바로 돼요(PC를 거치지 않기). 'PC 거치지 않기'를 켜면 모두 직접
    if(pc&&tgt&&!direct&&tgt.origin!==pc.base&&(!IS_NATIVE||isLocalHost(tgt.hostname))&&!url.startsWith(pc.base)){
      return System.http(pc.base+'/api/proxy?u='+encodeURIComponent(url),{method,headers:Object.assign({},headers,{'X-GGM-Key':pc.key}),body,binary,form,timeout,signal});
    }
    const h={...headers}; delete h.Origin; delete h.Referer;
    const init={method,headers:h,body:body==null?undefined:(form?new URLSearchParams(body).toString():JSON.stringify(body))};
    const ac=typeof AbortController!=='undefined'?new AbortController():null; if(ac) init.signal=ac.signal; else if(signal) init.signal=signal;
    if(ac&&signal){ if(signal.aborted) ac.abort(); else signal.addEventListener('abort',()=>{ try{ ac.abort(); }catch(e){} },{once:true}); } // 전투 스킬 생성 취소(signal)와 시간 제한을 함께
    const tmr=ac?setTimeout(()=>{ try{ ac.abort(); }catch(e){} },Math.max(5000,timeout||180000)):null;
    try{
    const PX=System.webProxy(); let host=''; try{ host=new URL(url).host; }catch(e){}
    const strict=/(^|\.)ollama\.com$/i.test(host)||/:11434$/.test(host);
    if(PX&&strict&&!/:11434$/.test(host)) PXHOSTS.add(host);
    const viaPx=()=>fetch(PX.replace(/\/+$/,'')+'/?u='+encodeURIComponent(url),init);
    let res;
    if(PX&&PXHOSTS.has(host)){ try{ res=await viaPx(); }catch(e){ if(signal?.aborted) throw v2AbortError(); throw {code:'network',message:System.abortedMsg(e,'중계 서버에 연결하지 못했어요')}; } }
    else { try{ res=await fetch(url,init); }catch(e){ if(signal?.aborted) throw v2AbortError();
        if(e&&e.name==='AbortError') throw {code:'network',message:System.abortedMsg(e,'')};
        if(PX&&host&&host!==location.host){ try{ res=await viaPx(); PXHOSTS.add(host); }catch(e2){ if(signal?.aborted) throw v2AbortError(); throw {code:'network',message:System.abortedMsg(e2,'중계 서버에 연결하지 못했어요')}; } }
        else throw {code:'network',message:IS_NATIVE?'':'웹 버전에서는 이 서비스가 직접 연결을 막았을 수 있어요(CORS). 설정 → 아이폰·웹 연결에서 중계 서버를 넣어 주세요.'}; } }
    if(res.status===403&&host&&host!==location.host){
      if(PX&&!PXHOSTS.has(host)&&!/:11434$/.test(host)){ try{ const r2=await viaPx(); if(r2.status!==403){ PXHOSTS.add(host); res=r2; } }catch(e){if(signal?.aborted)throw v2AbortError();} }
      if(res.status===403&&strict) throw {code:'origin_block',message:/:11434$/.test(host)?'내 PC Ollama를 OLLAMA_ORIGINS=* 환경 변수와 함께 다시 켜 주세요.':(PX?'중계 서버의 worker.js가 최신인지(ollama.com 허용) 확인해 주세요.':'설정 → 아이폰·웹 연결에서 중계 서버를 넣거나, 안드로이드 앱에서 써 주세요.')};
    }
    const hd={}; try{res.headers.forEach((v,k)=>{hd[k.toLowerCase()]=v;});}catch(e){}
    try{ if(binary&&res.ok) return {status:res.status,bytes:new Uint8Array(await res.arrayBuffer()),headers:hd};
      return {status:res.status,text:await res.text(),headers:hd}; }catch(e){ if(signal?.aborted) throw v2AbortError(); throw {code:'network',message:System.abortedMsg(e,'응답을 끝까지 받지 못했어요')}; }
    } finally { if(tmr) clearTimeout(tmr); }
  }

  static aiLogText(){ return AILOG.map(e=>`[${new Date(e.at).toISOString()}] ${e.ok?'OK':'FAIL'} ${e.stage||''} | ${e.who||''} ${e.model||''} ${e.tier||''} ${e.ms!=null?(e.ms/1000).toFixed(1)+'s':''}${e.err?' | '+e.err:''}${e.res?'\n  응답: '+String(e.res).replace(/\n/g,' ').slice(0,500):''}`).join('\n'); }

  static async vertexToken(p,options={}){
    const now=Math.floor(Date.now()/1000), c=TOKC[p.id||'tmp'];
    if(c&&c.exp>now+120&&c.sa===p.sa) return c.tok;
    let sa; try{ sa=JSON.parse(p.sa); }catch(e){ throw {code:'sa_bad'}; }
    if(!sa.client_email||!sa.private_key) throw {code:'sa_bad'};
    const aud=sa.token_uri||'https://oauth2.googleapis.com/token';
    const enc=o=>System.b64url(new TextEncoder().encode(JSON.stringify(o)));
    const unsigned=enc({alg:'RS256',typ:'JWT'})+'.'+enc({iss:sa.client_email,scope:'https://www.googleapis.com/auth/cloud-platform',aud,iat:now,exp:now+3600});
    let key; try{ const der=System.b64ToBytes(sa.private_key.replace(/-----[^-]+-----/g,'').replace(/\s+/g,'')); key=await crypto.subtle.importKey('pkcs8',der,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']); }catch(e){ throw {code:'sa_bad'}; }
    const sig=new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(unsigned)));
    const r=await System.http(aud,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:{grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:unsigned+'.'+System.b64url(sig)},form:true,timeout:30000,signal:options.signal});
    const j=Characters.okJSON(r); if(!j.access_token) throw {code:'bad_key',message:'토큰 발급 실패'};
    TOKC[p.id||'tmp']={tok:j.access_token,exp:now+(j.expires_in||3600),sa:p.sa};
    return j.access_token;
  }

    /* 요청 단계 알림(Model → 듣는 쪽은 창 이벤트로 받음: ggm-ai {phase:start·ok·fail, prompt, tier·error} — 스토리 기억(0530)이 최근 요청을 기록) */
static aiNotify(phase,prompt,extra){ dispatchEvent(new CustomEvent('ggm-ai',{detail:Object.assign({phase,prompt},extra)})); }

  static async aiCall(prompt,tier,imgs,options={}){
    const requestGame=G,requestProject=Core.PJ().active;const current=()=>{v2CheckCancelled(options.signal);if(G!==requestGame||Core.PJ().active!==requestProject)throw {code:'cancelled',message:'작업 중 게임이 바뀌어 이전 AI 응답을 적용하지 않았습니다'};};
    current();
    const A=System.AIP(), list=A.list.filter(Core.apValid); if(!list.length) throw {code:'no_ai'};
    const act=list.find(p=>p.id===A.active)||list[0];
    const order=A.fallback&&!options.managedRetry?[act,...list.filter(p=>p!==act)]:[act];
    let last;
    for(const p of order){
      const t0=Date.now(), mdl=(tier==='quick'&&p.quick)||p.model||(DEFM[System.defKey(p)]||[])[0]||'', base={who:p.name||AITYPE[p.type],model:mdl,tier,req:String(prompt).slice(0,600),reqLen:String(prompt).length}; AILAST='';
      const rs=()=>AILAST.length>1400?AILAST.slice(0,900)+'\n…(가운데 생략)…\n'+AILAST.slice(-400):AILAST;
      try{ let r; try{ r=await Core.aiOne(p,prompt,tier,imgs,options); }catch(e0){ current();if(options.managedRetry||options.signal?.aborted||!(e0&&e0.code==='invalid_json')) throw e0; Core.aiLog(Object.assign({},base,{ok:false,ms:Date.now()-t0,err:'invalid_json · 형식을 강조해서 한 번 더 요청해요',res:rs(),resLen:AILAST.length})); r=await Core.aiOne(p,prompt+JSON_STRICT,tier,imgs,options); } current();Core.aiLog(Object.assign(base,{ok:true,ms:Date.now()-t0,res:rs(),resLen:AILAST.length}));System.aiNotify('ok',prompt); if(p!==act) CoreView.toast(`${p.name}(으)로 대신 썼어요`); return r; }
      catch(e){current();System.aiNotify('fail',prompt,{error:String(e.message||e.code||e)});if(options.signal?.aborted)throw v2AbortError(); last=e; Core.aiLog(Object.assign(base,{ok:false,ms:Date.now()-t0,err:`${(e&&e.code)||'오류'}${e&&e.code&&AIERR[e.code]?' ('+AIERR[e.code]+')':''}${e&&e.message?' · '+String(e.message).slice(0,300):''}`,res:rs(),resLen:AILAST.length})); if(imgs&&imgs.length&&!['no_ai','bad_key','refused'].includes(e&&e.code)){ try{ const r=await Core.aiOne(p,prompt+'\n(첨부한 사진은 이 AI가 읽지 못했다. 사진 내용을 지어내지 않는다.)',tier,null,options);current();CoreView.toast('이 AI는 사진을 읽지 못해서 글로만 답했어요'); return r; }catch(e2){ last=e2; } } }
    }
    throw last;
  }

    /* 지침 프리셋: 이름 붙여 저장해 두고 켜고 끄는 지침. 켜진 것만 자리(상단·중단·하단)에 이어 붙여요 */
static llmEff(L){ L=L||Core.llmSlots(); const o={top:L.top||'',mid:L.mid||'',bot:L.bot||'',tag:L.tag||''}; L.presets.filter(x=>x&&x.on&&String(x.text||'').trim()).forEach(x=>{ const k=['top','mid','bot','tag'].includes(x.pos)?x.pos:'top'; o[k]=(o[k]?o[k].trim()+'\n':'')+String(x.text).trim(); }); return o; }

  static naiSize(kind,c){c=c||Core.naiCfg();const v=(c.sizes||{})[kind]||NAI_DEF.sizes[kind]||'1024x1024';const m=String(v).match(/(\d+)\s*[x×]\s*(\d+)/);return m?[+m[1],+m[2]]:[1024,1024];}

  static retryAfterMs(h){const v=String((h||{})['retry-after']||'').trim();if(!v)return 0;const n=Number(v);if(isFinite(n))return Math.max(0,n*1000);const d=Date.parse(v);return isFinite(d)?Math.max(0,d-Date.now()):0;}

    /* border: share of border pixels that are transparent, solid: share of all pixels that are mostly opaque */
static async alphaInfo(blob){
    try{ const bmp=await createImageBitmap(blob), W=bmp.width, H=bmp.height, cv=document.createElement('canvas'); cv.width=W; cv.height=H;
      const x=cv.getContext('2d',{willReadFrequently:true}); x.drawImage(bmp,0,0); const d=x.getImageData(0,0,W,H).data; let n=0,t=0,s=0,m=0;
      for(let i=0;i<W;i+=3){n+=2; if(d[i*4+3]<24)t++; if(d[((H-1)*W+i)*4+3]<24)t++;} for(let j=0;j<H;j+=3){n+=2; if(d[(j*W)*4+3]<24)t++; if(d[(j*W+W-1)*4+3]<24)t++;}
      for(let p=3;p<d.length;p+=64){m++; if(d[p]>128)s++;}
      return {border:n?t/n:0,solid:m?s/m:1}; }catch(e){ return {border:0,solid:1}; }
  }

  static async naiGenerate0(prompt,kind,opts){
    const c=Core.naiCfg(); if(!c.key) throw {code:'nai_nokey'};
    const refs=(opts.refs||[]).filter(r=>r&&r.image);
    let model=String(opts.model||c.model||NAI_DEF.model).trim(); if(refs.length&&!isV45(model)) model=isV45(c.refModel)?c.refModel:'nai-diffusion-4-5-full';
    if(opts.inpaint&&opts.inpaint.image&&!/-inpainting$/.test(model)) model+='-inpainting';
    opts.usedModel=model;
    const [w,h]=opts.size||System.naiSize(kind,c);
    const tp=!!c.transparent&&!NAI_TP_OFF&&!opts.noTp&&/^nai-diffusion-5/.test(model)&&!refs.length&&!(opts.img2img&&opts.img2img.image)&&!opts.inpaint&&['char','enemy','prop','icon'].includes(kind);
    opts.usedTp=tp;
    const BGTAG=/^(simple background|white background|grey background|gray background|gradient background|plain background|transparent background)$/i;
    const ql=''; // Quality is already part of the composed style prompt.
    let input=ql?Core.joinTags(prompt,ql):String(prompt||''), neg=opts.neg!=null?opts.neg:(c.neg||'');
    if(['char','enemy'].includes(kind)) neg=Core.joinTags(neg,'drop shadow, cast shadow');
    if(tp){ input=Core.joinTags(Core.tagList(prompt).filter(t=>!BGTAG.test(Core.tagKey(t))).join(', '),TP_BG_TAG,ql); neg=Core.tagList(neg).filter(t=>!/^(gradient background|simple background)$/i.test(Core.tagKey(t))).join(', '); }
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
      try{ r=await System.http(url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+String(c.key).trim()},body,binary:true,timeout:tmo}); }
      catch(e){ last=e; if(a<tries){ opts.onRetry&&opts.onRetry(a,tries,'네트워크 오류'); await wait(1000*a); continue; } throw e; }
      if(r.status<400&&r.bytes&&r.bytes.length){
        const img=await Art.naiDecode(r.bytes,(r.headers||{})['content-type']);
        let blob=new Blob([img.bytes],{type:img.type});
        let clear=false; if(tp){ const ai=await System.alphaInfo(blob); if(ai.solid<0.02){ opts.emptyAlpha=true; return blob; } clear=ai.border>0.5; } opts.gotAlpha=clear;
        if((kind==='char'||kind==='enemy'||kind==='icon')&&c.cutout&&!opts.noCut&&!clear) blob=await Core.cutoutWhite(blob);
        return blob;
      }
      const txt=r.text||'', locked=/Concurrent generation is locked/i.test(txt);
      last=locked?{code:'nai_locked',message:''}:(r.status<400?{code:'nai_empty'}:Core.errOf(r));
      const retry=locked||[408,425,429].includes(r.status)||r.status>=500;
      if(!retry||a>=tries) throw last;
      opts.onRetry&&opts.onRetry(a,tries,locked?'다른 생성 진행 중':'HTTP '+r.status);
      await wait(Math.min(20000,Math.max(System.retryAfterMs(r.headers),1500*a)));
    }
    throw last;
  }

  static async loadAudio(){ for(const l of G.lib){ if(l.audio&&l.audio.idb&&!audioCache[l.id]){ try{const b=await System.idbGetNS('a_'+l.id); if(b) audioCache[l.id]=URL.createObjectURL(b);}catch(e){} } } }

  static jaMap(){ try{ return JSON.parse(appStorage.getItem(JAKEY)||'{}')||{}; }catch(e){ return {}; } }

    /* 스토리를 열면 목소리가 있는 대사를 한 번에 일본어로 옮겨 둬요(한 줄씩 옮기면 느리고 늦게 나와서) */
static jaBatch(texts){ if(!SAMPLE) return; const m=System.jaMap(), todo=[...new Set(texts.map(x=>cleanTTS(sub(x))).filter(x=>x&&!m[jaKey(x)]&&!JAWAIT[jaKey(x)]))]; if(!todo.length) return;
    for(let i=0;i<todo.length;i+=30){ const part=todo.slice(i,i+30); const pr=(async()=>{ try{ const r=await SAMPLE.json(System.jaBatchPrompt({part}),{modelTier:'quick'}); const a=Array.isArray(r&&r.ja)?r.ja:[];
          if(a.length===part.length){ const m2=System.jaMap(); part.forEach((x,j)=>{ const v=String(a[j]||'').trim(); if(v) m2[jaKey(x)]=v; }); try{ appStorage.setItem(JAKEY,JSON.stringify(m2)); }catch(e){} } }catch(e){} finally{ part.forEach(x=>{ if(JAWAIT[jaKey(x)]===pr) delete JAWAIT[jaKey(x)]; }); } })().then(()=>null);
      part.forEach(x=>{ JAWAIT[jaKey(x)]=pr; }); } }

  static async toJa(t){ const k=jaKey(t); if(JAWAIT[k]){ const v=await JAWAIT[k]; if(v) return v; } const m=System.jaMap(); if(m[k]) return m[k]; if(!SAMPLE) return t; if(JAWAIT[k]) return JAWAIT[k];
    return JAWAIT[k]=(async()=>{ try{ const r=await SAMPLE.json(System.toJaPrompt({t}),{modelTier:'quick'}); const ja=String((r&&r.ja)||'').trim();
        if(!ja) return t; const m2=System.jaMap(); m2[k]=ja; const ks=Object.keys(m2); if(ks.length>3000) ks.slice(0,ks.length-3000).forEach(x=>delete m2[x]); try{ appStorage.setItem(JAKEY,JSON.stringify(m2)); }catch(e){} return ja; }
      catch(e){ return t; } finally{ delete JAWAIT[k]; } })(); }

  static async ttsBlob(c,text){
    const s=Core.SND(), t0=cleanTTS(sub(text)), vid=Economy.voiceOf(c); if(!t0||!s.fishKey||!c||!vid) return null;
    const t=s.voiceLang==='ja'?await System.toJa(t0):t0;
    const key='v_'+System.hash(vid+'|'+s.fishModel+'|'+t).toString(36)+'_'+t.length;
    try{const b=await Core.idbGet(key); if(b) return b;}catch(e){}
    const r=await System.http('https://api.fish.audio/v1/tts',{method:'POST',headers:{Authorization:'Bearer '+s.fishKey,'Content-Type':'application/json',model:s.fishModel},
      body:{text:t,reference_id:vid,format:'mp3',mp3_bitrate:128,latency:'normal',normalize:true},binary:true,timeout:90000});
    if(r.status>=400||!r.bytes) throw Core.errOf(r);
    const b=new Blob([r.bytes],{type:'audio/mpeg'}); try{await NewGame.idbPut(key,b);}catch(e){} return b;
  }

    /* 그리기 전·주기 타이머(Controller): 하루/주 단위 칸은 늘 있게, 있는 칸은 날이 바뀌었으면 새로·형식 맞춤 */
static progTick(){ if(!G||!G.prog) return; for(const k in PROG_SLOTS){ const s=PROG_SLOTS[k], on=typeof s.tick==='function'?s.tick():s.tick; if(on||(G.prog[k]!==undefined&&(s.stale||s.fill))) Core.progSlot(k); } }

  static pjKey(id){return id==='main'?'starfall-contract-v1':'starfall-contract-v1-'+id;}

  static markAll(){Core.mark('meta','world','prog','opening',...G.chars.map(c=>'c:'+c.id),...G.chapters.map(ch=>'ch:'+ch.id),...G.lib.map(l=>'l:'+l.id),...G.threads.map(t=>'t:'+t.id));}

    /* 저장 결과 알림(Model → 화면은 창 이벤트로 받음: ggm-saved · ggm-storage-error — 0080이 경고를 띄우고 지움) */
static saveFailed(message){ dispatchEvent(new CustomEvent('ggm-storage-error',{detail:{message}})); }

  static async idbGetNS(k){ let b=null; try{b=await Core.idbGet(IMGNS+k);}catch(e){} if(!b&&IMGNS){ try{b=await Core.idbGet(k);}catch(e){} } return b; }

  static idbOpen(){return appStorage.open();}

  static async idbKeys(){const d=await System.idbOpen();return new Promise((res,rej)=>{const q=d.transaction('img').objectStore('img').getAllKeys();q.onsuccess=()=>res(q.result||[]);q.onerror=()=>rej(q.error);});}

  static async voiceStats(){let n=0,b=0;try{for(const k of await System.idbKeys()){if(String(k).startsWith('v_')){n++;const x=await Core.idbGet(k);b+=x&&x.size||0;}}}catch(e){}return {n,mb:(b/1048576).toFixed(1)};}

  static hash(s){let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}

  static backupChatKeys(g){const keys=new Set();function visit(o){if(!o||typeof o!=='object')return;for(const[k,v]of Object.entries(o)){if(k==='img'&&typeof v==='string'&&v.startsWith('chat_'))keys.add(v);else if(v&&typeof v==='object')visit(v);}}visit(g);return [...keys];}

  static backupMedia(g){return {chat:System.backupChatKeys(g),images:[...new Map(Core.imgObjsOf(g).map(x=>[x.id,x])).values()].filter(x=>x.img?.idb).map(x=>({id:x.id,img:{idb:true},...(x.seed!=null?{seed:x.seed}:{})})),audios:(g.lib||[]).filter(x=>x.audio?.idb).map(x=>({id:x.id,audio:{idb:true}}))};}

  static async backupBytes(blob){return String(await blobToData(blob)).split(',')[1];}

    // Decode a legacy image in small base64 blocks rather than passing a huge URL to fetch.
static async legacyMediaBlob(value){
   const comma=value.indexOf(',');if(comma<5)throw Error('자료 파일의 데이터 주소가 올바르지 않습니다');const meta=value.slice(5,comma);
   if(!/;base64$/i.test(meta))return (await fetch(value)).blob();
   const type=meta.split(';')[0]||'application/octet-stream',parts=[];let data=value.slice(comma+1);if(/\s/.test(data))data=data.replace(/\s/g,'');
   for(let p=0;p<data.length;p+=349524){parts.push(System.b64ToBytes(data.slice(p,p+349524)));if(p&&p%1398096===0)await new Promise(resolve=>setTimeout(resolve,0));}
   return new Blob(parts,{type});
  }

    /* ---- 백업 파일 저장 위치·쓰기·내보내기(앱: 기기 폴더 / 웹: 내려받기) ---- */
static bkDests(){ return IS_NATIVE?[['docs','문서 폴더 (Documents/가챠게임메이커)'],['download','다운로드 폴더 (Download/가챠게임메이커)'],['share','공유하기 (구글 드라이브·카톡 등으로 보내기)']]
    :[...(window.showSaveFilePicker?[['pick','저장할 곳 직접 고르기']]:[]),['download','다운로드 폴더'],...(navigator.canShare?[['share','공유하기 (파일 앱·드라이브 등)']]:[])]; }

  static bkDest(){ let v=''; try{ v=appStorage.getItem('ggm-bkdest')||''; }catch(e){} const L=System.bkDests(); return L.some(x=>x[0]===v)?v:L[0][0]; }

  static async bkWriter(dest,name){
    if(IS_NATIVE&&CAP&&CAP.Filesystem){
      const FS=CAP.Filesystem, sub=dest==='docs'?'가챠게임메이커/':dest==='download'?'Download/가챠게임메이커/':'', dir=dest==='docs'?'DOCUMENTS':dest==='download'?'EXTERNAL_STORAGE':'CACHE', path=sub+name;
      if(dest!=='share'){ try{ if(FS.requestPermissions) await FS.requestPermissions(); }catch(e){ Core.quietErr(e,'0520-backup-storage.js:171'); } }
      let first=true, buf='';
      const put=async()=>{ if(!buf&&!first) return; const data=buf; buf=''; if(first){ await FS.writeFile({path,data,directory:dir,encoding:'utf8',recursive:true}); first=false; } else await FS.appendFile({path,data,directory:dir,encoding:'utf8'}); };
      return {write:async s=>{ buf+=s; if(buf.length>1500000) await put(); }, close:async()=>{ await put(); const u=await FS.getUri({path,directory:dir}); return {uri:u.uri,where:dest==='share'?'':(dest==='docs'?'Documents/':'')+path}; }};
    }
    if(dest==='pick'&&window.showSaveFilePicker){ const h=await window.showSaveFilePicker({suggestedName:name,types:[{description:'메이커 백업 파일',accept:{'application/octet-stream':/\.(ggmbak|ggmpack)$/i.test(name)?[name.slice(name.lastIndexOf('.'))]:['.json']}}]}); const ws=await h.createWritable(); return {write:s=>ws.write(s),close:async()=>{ await ws.close(); return {where:h.name}; }}; }
    const parts=[]; return {write:async s=>{ parts.push(s); },close:async()=>({blob:new Blob(parts,{type:/\.(ggmbak|ggmpack)$/i.test(name)?'application/octet-stream':'application/json'})})};
  }

  static async exportGo(o){return o.share?SystemView.shareExport(o):SystemView.backupExport('full',o.dest,!!o.voice);}

    /* 파일 내려받기(입출력 — 임시 링크를 눌러 브라우저 다운로드 폴더로): 백업·공유 팩·데이터 폴더·초안·그림 저장이 함께 씀 */
static downloadBlob(blob,name){ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},4000); }

  static dataSplit(g){const files={},rest={};for(const[k,v]of Object.entries(g))(DATA_TYPES.includes(k)?files:rest)[k]=v;files.game=rest;return files;}

  static dataJoin(files){const g={...(files.game||{})};for(const k of DATA_TYPES)if(k in files)g[k]=files[k];return g;}

  static crc32(u){let c=0xFFFFFFFF;for(let i=0;i<u.length;i++)c=CRC_T[(c^u[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}

  static zipMake(entries){const enc=new TextEncoder(),parts=[],central=[];let off=0;
   for(const e of entries){const n=enc.encode(e.name),d=e.data,crc=System.crc32(d),h=new DataView(new ArrayBuffer(30)),c=new DataView(new ArrayBuffer(46));
    h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(12,33,true);h.setUint32(14,crc,true);h.setUint32(18,d.length,true);h.setUint32(22,d.length,true);h.setUint16(26,n.length,true);
    c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(14,33,true);c.setUint32(16,crc,true);c.setUint32(20,d.length,true);c.setUint32(24,d.length,true);c.setUint16(28,n.length,true);c.setUint32(42,off,true);
    parts.push(h,n,d);central.push(c,n);off+=30+n.length+d.length;}
   const size=central.reduce((s,x)=>s+x.byteLength,0),end=new DataView(new ArrayBuffer(22));
   end.setUint32(0,0x06054b50,true);end.setUint16(8,entries.length,true);end.setUint16(10,entries.length,true);end.setUint32(12,size,true);end.setUint32(16,off,true);
   return new Blob([...parts,...central,end],{type:'application/zip'});}

  static async zipRead(file){ // → Map(name → Blob). 파일 전체를 한 번에 읽지 않고 항목별로 잘라 읽어요
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

  static async dataReadZip(file){ // zip → {game, media:[{key,blob}], title}
   const z0=await System.zipRead(file),ixName=[...z0.keys()].filter(n=>/(^|\/)index\.json$/.test(n)&&!/\/media\//.test(n)).sort((a,b)=>a.length-b.length)[0];
   if(!ixName)throw Error('index.json이 없어요. 데이터 폴더 zip이 맞는지 확인해 주세요');
   // 압축을 풀어 고친 뒤 다시 묶으면 맨 앞에 폴더가 붙거나 data/가 빠질 수 있어요: index.json이 있는 곳을 data/로 봐요
   const base=ixName.slice(0,-'index.json'.length),z=new Map([...z0].filter(([n])=>n.startsWith(base)).map(([n,b])=>['data/'+n.slice(base.length),b]));
   const readJSON=async(name,b)=>{try{return JSON.parse(await b.text());}catch(e){throw Error(name+' 을(를) 읽지 못했어요(JSON 문법 확인): '+e.message);}};
   const index=await readJSON('index.json',z.get('data/index.json')),gid=index?.games?.[0]?.id;if(index.format!=='ggm-data'||!gid||!/^[\w-]{1,64}$/.test(gid))throw Error('데이터 폴더 정보가 올바르지 않아요');
   const files={},re=new RegExp('^data/'+gid+'/([a-z]+)\\.json$');for(const[name,b]of z){const m=name.match(re);if(m&&m[1]!=='media')files[m[1]]=await readJSON(name,b);}
   const game=System.dataJoin(files);if(!Array.isArray(game.chars))throw Error('chars.json이 없거나 올바르지 않아요');
   const mj=z.get(`data/${gid}/media.json`),mm=mj?await readJSON('media.json',mj):{},media=[];
   for(const[k,v]of Object.entries(mm)){if(!/^[\w-]{1,80}$/.test(k))throw Error('자료 이름이 올바르지 않아요: '+k);const b=z.get(`data/${gid}/media/${k}`);if(!b)throw Error('자료 파일이 빠졌어요: '+k);media.push({key:k,blob:new Blob([b],{type:String(v?.type||'')})});}
   return {game,media,title:index.games[0].title||game.meta?.title||'가져온 게임'};}

  static async dataSaveBlob(blob,name){
   if(IS_NATIVE&&CAP&&CAP.Filesystem){const FS=CAP.Filesystem,path='가챠게임메이커/'+name;try{if(FS.requestPermissions)await FS.requestPermissions();}catch(e){ Core.quietErr(e,'0525-data-folder.js:58'); }
    await FS.writeFile({path,data:String(await blobToData(blob)).split(',')[1],directory:'DOCUMENTS',recursive:true});return 'Documents/'+path;}
   if(window.showSaveFilePicker){try{const h=await showSaveFilePicker({suggestedName:name,types:[{description:'데이터 폴더 zip',accept:{'application/zip':['.zip']}}]}),w=await h.createWritable();await w.write(blob);await w.close();return h.name;}catch(e){if(e?.name==='AbortError')return null;}}
   System.downloadBlob(blob,name);return name;}

  static async switchProject(id){
   if(projectSwitchBusy)return false;if(NEW_GAME_SOURCE||PCJOB||SYJOB||BACKUP_BUSY){CoreView.toast('진행 중인 생성·저장 작업이 끝난 뒤 전환해 주세요');return false;}projectSwitchBusy=true;
   try{if(window.__NOFLUSH)throw Error('데이터 적용 중입니다. 다시 시작한 뒤 전환해 주세요.');await Core.flush();await appStorage.assertCurrent(PJKEY);const pj=Core.PJ();if(!pj.list.some(x=>x.id===id))throw Error('게임 목록에서 대상을 찾지 못했습니다');const raw=appStorage.getItem(System.pjKey(id));if(!raw||!Array.isArray(JSON.parse(raw)?.chars))throw Error('선택한 게임의 저장 데이터를 읽지 못했습니다. 현재 게임을 유지합니다.');await appStorage.assertCurrent(System.pjKey(id));pj.active=id;await appStorage.commitRecords({[PJKEY]:JSON.stringify(pj)});try{sessionStorage.setItem('ggm-picked','1');}catch(e){}await SystemView.reloadGame();return true;
   }catch(e){SystemView.storageWarning(e.message||'게임을 전환하지 못했습니다');projectSwitchBusy=false;return false;}
  }

  static stamOn(){ return P().settings.stamina!==false; }

  static memoOn(c){ return !!((P().memoOn||{})[c.id]&&Core.memoOpen(c)); }

  static async chatImgB64(k){ try{ const b=await System.idbGetNS(k); if(!b) return undefined; const s=await Core.shrink(b,1024); const bmp=await createImageBitmap(s), cv=document.createElement('canvas'); cv.width=bmp.width; cv.height=bmp.height; cv.getContext('2d').drawImage(bmp,0,0); const u=cv.toDataURL('image/jpeg',0.85); return [{mime:'image/jpeg',data:u.split(',')[1]}]; }catch(e){ return undefined; } }

  static cbAtkVal(u,m,e){ if(!e&&CB){ const es=CB.enemies.filter(en=>en.hp>0); e=CB.enemies[CB.tgt]&&CB.enemies[CB.tgt].hp>0?CB.enemies[CB.tgt]:es[0]; } let v=u.atk*(CB?CB.str:1)*m; if(e){ v*=BEATS[u.elem]===e.elem?1.5:BEATS[e.elem]===u.elem?0.75:1; if(e.vul>0) v*=1.5; } return Math.max(1,Math.round(v)); }

  static cbBlk(u,m){ return Math.round(u.maxhp*0.09*m); }

  static cbSkillVal(u,sk,pw){ const k=sk.kind; if(k==='dmg') return System.cbAtkVal(u,pw*1.3); if(k==='aoe') return System.cbAtkVal(u,pw*0.9); if(k==='heal') return Math.round(u.maxhp*0.14*pw); if(k==='shield') return Math.round(u.maxhp*0.12*pw); return Math.min(0.6,0.2*pw); }

  static cbUnit(id){ return CB.units.find(u=>u.c.id===id)||CB.units[0]; }

    /* 플레이 모드: 만들기·편집·AI 설정을 숨기고 게임만 해요(이 기기에만 저장) */
  // 구독한 게임은 만든 사람이 콘텐츠를 올려요: 늘 플레이 모드(편집·만들기·자체 업데이트 없음, AI 키 없이 플레이)
static subLocked(){ try{ return !!(typeof G!=='undefined'&&G&&G.meta&&G.meta.subscr); }catch(e){ return false; } }

  static playMode(){ if(System.subLocked()) return true; try{ return appStorage.getItem('ggm-play')==='1'; }catch(e){ return false; } }

  static needSetup(){ return !appStorage.getItem(SETUP_KEY)&&!System.AIP().list.length&&!Core.imgReady(); }

  static guideText(){
    return `[${G.meta.title} 테스트 안내]\n개인적으로 만든 가챠 게임이에요. 해 보고 의견 부탁해요!\n공식 배포처: https://github.com/jjhk0803/gacha-game-maker (다른 곳에서 받은 파일은 쓰지 마세요)\n\n1. 같이 보낸 APK 파일을 눌러 설치해요. "출처를 알 수 없는 앱" 허용을 물으면 이번만 허용해요.\n2. 공유 팩(.ggmpack 또는 기존 .json)도 받았다면: 최신 버전으로 업데이트한 뒤 설정 → 데이터 → 공유 팩 불러오기 → "새 게임으로 추가".\n3. 새 ${System.T('crew')}·스토리 만들기, 그림, 음성 같은 AI 기능은 각자 키를 넣어야 써요. 없어도 기본 게임은 다 할 수 있어요. 키는 남에게 받지 말고 본인 것만 쓰세요.\n4. 다 해 봤으면 설정 → 공유와 피드백 → 피드백 보내기로 의견을 보내 주세요.\n\n※ 개인 테스트용이라 다른 곳에 올리거나 다시 퍼뜨리지는 말아 주세요.`;
  }

    /* 화면 방향(휴대폰): auto=기기 회전 따라, portrait=세로 고정, landscape=가로 고정. 앱은 화면 방향 플러그인, 웹은 브라우저 기능으로 잠가요 */
static orientPref(){ try{ return appStorage.getItem('ggm-orient')||'auto'; }catch(e){ return 'auto'; } }

  static async applyOrient(){ const v=System.orientPref(), SO=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.ScreenOrientation;
    try{ if(SO){ if(v==='auto') await SO.unlock(); else await SO.lock({orientation:v}); return true; } }catch(e){ Core.quietErr(e,'0410-desktop.js:5'); }
    try{ if(screen.orientation){ if(v==='auto') screen.orientation.unlock(); else await screen.orientation.lock(v); return true; } }catch(e){ Core.quietErr(e,'0410-desktop.js:6'); } return v==='auto'; }

  static deskMode(){ const def=Math.min(screen.width||innerWidth,screen.height||innerHeight)<600?'auto':'wide'; let v=def; try{ v=appStorage.getItem('ggm-desk')||def; }catch(e){} return v; }

  static storyTalkLines(ch){ const out=[]; (ch.stages||[]).forEach(s=>{ let on=false; System.parseScript((s.pre||'')+'\n'+(s.post||'')).forEach(L=>{ if(L.type==='cmd'&&L.cmd==='톡') on=true; else if(L.type==='cmd'&&L.cmd==='톡끝') on=false; else if(on&&L.type==='say') out.push(L.who+': '+L.text); }); }); return out; }

    // 글 AI 없이 초안만으로 게임을 만들어요. 비어 있는 곳은 기본값으로 두고, 나중에 글 AI를 등록하면 편집 도구로 다듬어요
static async buildManualGameDraft(rep,draft,sourceProject){if(String(draft?.story||'').length>100000)throw Error('스토리는 최대 100,000자입니다. 초과 내용은 자르지 않았습니다.'); const RSRC=NewGame.reuseSrc(draft);
    draft=draft||Core.drLoad(); const stat=m=>{if(rep)rep(m);};
    const DALL=(draft.chars||[]).filter(c=>String(c.name||'').trim()), DCH=DALL.filter(c=>c.kind!=='npc'), DNPC=DALL.filter(c=>c.kind==='npc');
    if(!DCH.length){ CoreView.toast(`인물 탭에 ${draft.crewTerm||'동료'}을 1명 이상 적어 주세요`); return; }
    const ng=Core.defaults(), hero=Object.assign({name:'',call:'',gender:'',look:'',bio:'',hide:false},draft.hero||{}), th=draft.theme||'auto';
    const kw=String(draft.kw||'').trim(), title=String(draft.gtitle||'').trim().slice(0,30)||kw.split(/[.\n,]/)[0].slice(0,16)||'새 게임';
    const ngSty=String(draft.style||'').trim()||(NewGame.presetQualityParts(Core.allPresets().find(x=>x.id===draft.preset)||{}).tags);
    ng.meta=Object.assign(clone(DEFAULT_META),{title,sub:'',theme:th==='auto'?'tactical':th,accent:'#ffb400'}); ng.meta.shop=NewGame.neutralShop();
    ng.meta.artTags=ngSty; { const sp=Core.allPresets().find(x=>x.id===draft.preset); if(sp&&ngSty===NewGame.presetQualityParts(sp).tags) ng.meta.artNeg=sp.neg; }
    ng.meta.tone=String(draft.tone||''); ng.meta.castSex=CAST_SEX[draft.castSex]?draft.castSex:''; const DT=Core.drText(draft); if(DT) ng.meta.bible=DT.slice(0,100000);
    ng.meta.story={plot:String(draft.story||''),stages:+draft.stages||0,len:STORY_LEN[draft.len]?draft.len:'normal'}; ng.meta.manual=true;
    ng.meta.terms=clone(DEFAULT_META.terms); if(String(draft.crewTerm||'').trim()) ng.meta.terms.crew=String(draft.crewTerm).trim().slice(0,8); if(String(hero.call||'').trim()) ng.meta.terms.player=String(hero.call).trim().slice(0,12);
    try{ ng.meta.draft=Story.drClean(draft); }catch(e){}
    const world=String(draft.world||'').trim(), sents=s=>String(s||'').split(/(?<=[.!?。])\s+|\n+/).map(x=>x.trim()).filter(Boolean);
    ng.world=Object.assign(NewGame.blankWorld(),{name:title,summary:sents(world).slice(0,3).join(' ')||kw||title,lore:world||kw,plot:String(draft.story||'').trim(),factions:[],source:draft.fan?String(draft.src||''):''});
    String(draft.setting||'').split('\n').map(x=>x.trim()).filter(x=>/^[-•*]?\s*[^:：]{1,20}[:：]/.test(x)).slice(0,6).forEach(x=>{ const m=x.replace(/^[-•*]\s*/,'').match(/^([^:：]{1,20})[:：]\s*(.*)$/); if(m) ng.world.factions.push({name:m[1].trim(),desc:m[2].trim()}); });
    ng.dispatches=clone(DEFAULT_DISP);
    const oldG=G; G=ng; SystemView.applyMeta();
    try{
      ng.chars=[]; ng.lib=clone(DEFAULT_SFX); const roles=['atk','def','sup'];
      DCH.forEach((d,i)=>{ const r=+d.rank||(i<1?3:i<3?2:1); const c=Characters.cleanChar({name:d.name,rarity:r,role:roles[i%3],elem:ELEMS[i%ELEMS.length],faction:'',hp:900+r*150,atk:95+r*15,def:40+r*8,spd:95+(i%3)*5,
        profile:[d.role,d.profile,d.speech?'말투: '+d.speech:'',d.look?'외모: '+d.look:''].filter(x=>String(x||'').trim()).join('\n'),intro:String(d.role||''),
        skill:{name:{atk:'강타',def:'수호',sup:'응원'}[roles[i%3]],kind:{atk:'dmg',def:'shield',sup:'heal'}[roles[i%3]],power:1.6,cd:3,desc:''},naiPrompt:String(d.tags||'').trim()?Core.stripAge(String(d.tags).trim()):''});
        c.ord=ng.chars.length; ng.chars.push(c); });
      ng.npcs=DNPC.map(d=>{ const id='npc_'+uid(); return {id,npc:true,name:d.name,role:d.role||'',profile:d.profile||'',speech:d.speech||'',look:d.look||'',naiPrompt:String(d.tags||'').trim()?Core.stripAge(String(d.tags).trim()):'',img:null,faces:[],skins:[],lines:[],touch:{head:[],body:[]},affLines:{},upper:{id:'up_'+id,kind:'upper',name:d.name+' 상반신',prompt:'',img:null}}; });
      // 스토리 개요를 스테이지마다 나눠 내레이션으로 넣어요. 대사는 나중에 직접 쓰거나 글 AI로 채워요
      const N=Math.max(1,Math.min(12,+draft.stages||4)), st=sents(draft.story), per=Math.ceil(st.length/N)||0, en=(i,boss)=>[{name:boss?'보스':'적',elem:ELEMS[i%ELEMS.length],hp:boss?3600:800+i*100,atk:70+i*5,def:30+i*4,spd:95,boss}];
      ng.chapters=[{id:'c1',ord:0,kind:'main',title:'1장',logline:sents(draft.story)[0]?sents(draft.story)[0].slice(0,120):'',stages:Array.from({length:N},(_,i)=>({id:'s1'+(i+1),title:`${i+1}화`,reward:300+100*i,pre:st.slice(i*per,(i+1)*per).join('\n'),post:'',enemies:en(i,i===N-1)}))}];
      ng.opening={lines:[...sents(world).slice(0,4),title],prologue:''};
      ng.banners=[{id:'std',name:'상시 '+System.T('gacha'),type:'std',desc:'',pool:{mode:'all',factions:[],ids:[]},pickup:[],rate:50,active:true,bg:''}];
      ng.threads=[]; ng.events=[]; Story.syncEnemies(ng);
      ng.prog=clone(DEFAULT_PROG); ng.prog.player=String(hero.name||'').slice(0,12); ng.prog.genderTxt=String(hero.gender||''); ng.prog.gender=genderCode(hero.gender); ng.prog.look=String(hero.look||''); ng.prog.bio=String(hero.bio||''); ng.prog.hideEyes=!!hero.hide; ng.prog.nameAsked=true;
      ng.ver=VER;
    } finally { G=oldG; SystemView.applyMeta(); }
    const id2='g'+uid(); if(RSRC){ (RSRC.g.lib||[]).filter(l=>['bg','prop'].includes(l.kind)&&l.img&&!ng.lib.some(x=>x.kind===l.kind&&nameEq(x.name,l.name))).forEach(l=>ng.lib.push(clone(l))); if(!ng.prog.lobbyBg){ const b0=ng.lib.find(l=>l.kind==='bg'); if(b0) ng.prog.lobbyBg=b0.name; } } const RU=Characters.artReuse(ng,RSRC); if(RU){ await NewGame.artReuseCopy(RU,id2); ng.prog.castDone=true; }
    try{ if(hero.av){ const b=await Core.idbGet('draft_avatar'); if(b){ const av={id:'pav_'+uid(),kind:'char',name:'플레이어',prompt:hero.av,img:{idb:true}}; await NewGame.idbPut(id2+'::'+av.id,b); ng.prog.avatar=av; } } }catch(e){}
    if(sourceProject&&Core.PJ().active!==sourceProject)throw Error('게임이 바뀌어 새 게임 적용을 중단했습니다');await Core.flush();
    LiveOps.ngFinish(ng,draft); const pj=Core.PJ();pj.list.push({id:id2,title:ng.meta.title});pj.active=id2; await appStorage.commitRecords({[System.pjKey(id2)]:JSON.stringify(ng),[PJKEY]:JSON.stringify(pj)});
    stat('완성! 새 게임으로 전환해요. 글 AI를 등록하면 편집 화면의 ✦ 버튼으로 대사·스킬·설정을 다듬을 수 있어요.'); setTimeout(()=>SystemView.reloadGame(),1200);
  }

  static SY(){ try{ return JSON.parse(appStorage.getItem(SYKEY))||{}; }catch(e){ return {}; } }

  static saveSY(o){ appStorage.setItem(SYKEY,JSON.stringify(o)); }

  static syIdx(){ try{ return JSON.parse(appStorage.getItem(SYIDX))||{}; }catch(e){ return {}; } }

  static saveSyIdx(o){ try{ appStorage.setItem(SYIDX,JSON.stringify(o)); }catch(e){} }

  static bytesToB64(u8){ let s=''; for(let i=0;i<u8.length;i+=0x8000) s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000)); return btoa(s); }

  static async shaHex(buf){ if(!(window.crypto&&crypto.subtle)) return System.sha256js(new Uint8Array(buf)); const h=await crypto.subtle.digest('SHA-256',buf); return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,'0')).join(''); }

    // http 주소(같은 와이파이의 PC 서버 등)에서는 브라우저가 crypto.subtle을 막아요 → 직접 계산
static sha256js(m){ const K=[],H=[]; let n=2; const fr=x=>(x-Math.floor(x))*4294967296|0; for(let c=0;c<64;n++){ let p=1; for(let d=2;d*d<=n;d++) if(n%d===0){ p=0; break; } if(p){ if(c<8) H[c]=fr(Math.pow(n,1/2)); K[c++]=fr(Math.pow(n,1/3)); } }
    const l=m.length, nb=((l+9+63)>>6)<<6, b=new Uint8Array(nb); b.set(m); b[l]=0x80; const dv=new DataView(b.buffer); dv.setUint32(nb-8,Math.floor(l/536870912)); dv.setUint32(nb-4,(l<<3)>>>0);
    const w=new Int32Array(64), r=(x,k)=>(x>>>k)|(x<<(32-k));
    for(let o=0;o<nb;o+=64){ for(let i=0;i<16;i++) w[i]=dv.getInt32(o+i*4); for(let i=16;i<64;i++){ const a=w[i-15], c=w[i-2]; w[i]=(w[i-16]+(r(a,7)^r(a,18)^(a>>>3))+w[i-7]+(r(c,17)^r(c,19)^(c>>>10)))|0; }
      let [A,B2,C,D,E,F,G2,Hh]=H; for(let i=0;i<64;i++){ const t1=(Hh+(r(E,6)^r(E,11)^r(E,25))+((E&F)^(~E&G2))+K[i]+w[i])|0, t2=((r(A,2)^r(A,13)^r(A,22))+((A&B2)^(A&C)^(B2&C)))|0; Hh=G2; G2=F; F=E; E=(D+t1)|0; D=C; C=B2; B2=A; A=(t1+t2)|0; }
      [A,B2,C,D,E,F,G2,Hh].forEach((v,i)=>{ H[i]=(H[i]+v)|0; }); }
    return H.map(x=>(x>>>0).toString(16).padStart(8,'0')).join(''); }

    // 게임 목록(starfall-projects)은 한 번도 저장 안 됐을 수 있어요(샘플 게임만 쓴 기기). 받는 쪽은 목록이 꼭 있어야 해서 기본 목록을 채워 보내요
static syLsValue(k){ const v=appStorage.getItem(k); return v==null&&k===PJKEY?JSON.stringify(Core.PJ()):v; }

  static syLsKeys(withKeys){ const pj=Core.PJ(), sec=Object.entries(STORE_POLICY.secret).filter(([,f])=>withKeys||f).map(([k])=>k); return [PJKEY,...pj.list.map(x=>System.pjKey(x.id)),...STORE_POLICY.sync,...sec]; }

  static syStrip(k,v,withKeys){ const f=STORE_POLICY.secret[k]; if(withKeys||v==null||!f) return v; try{ const o=JSON.parse(v); f.forEach(x=>{ delete o[x]; }); return JSON.stringify(o); }catch(e){} return v; }

    /* 받을 때: 빠진 비밀(GitHub로 받은 설정)과 이 기기 값(keep)은 이 기기 것을 지켜요 */
static syMerge(k,v){ if(v==null) return v; const f=[...(STORE_POLICY.secret[k]||[]),...(STORE_POLICY.keep[k]||[])]; if(!f.length) return v; try{ const cur=JSON.parse(appStorage.getItem(k)||'{}'), o=JSON.parse(v); f.forEach(x=>{ if((!o[x]||(STORE_POLICY.keep[k]||[]).includes(x))&&cur[x]) o[x]=cur[x]; }); return JSON.stringify(o); }catch(e){} return v; }

  static syErr(e){let message=e?.status===404?'저장소·브랜치를 찾지 못했습니다. 이름과 토큰 권한을 확인해 주세요.':e?.status===401||e?.status===403?'토큰 또는 저장소 쓰기 권한을 확인해 주세요.':AIERR[e?.code]||e?.message||'다시 시도해 주세요';if(e?.status)message=`HTTP ${e.status} · `+message;if(e?.endpoint)message+=' · 단계: '+e.endpoint;if(e?.details)message+=' · '+e.details;return System.ghSafeMessage(message).slice(0,1000);}

  static async pcApi(path,opt){ const pc=System.PCS(); if(!pc) throw {code:'network',message:'PC 서버가 연결돼 있지 않아요'}; opt=opt||{};
    const r=await System.http(pc.base+path,{method:opt.method||'GET',headers:Object.assign({'X-GGM-Key':pc.key},opt.body?{'Content-Type':'application/json'}:{}),body:opt.body,binary:!!opt.binary,timeout:opt.timeout||120000});
    if(r.status===404&&opt.ok404) return null; if(r.status===401) throw {code:'bad_key',message:'PC 서버 키가 맞지 않아요. QR을 다시 찍어 주세요'}; if(r.status>=400) throw Core.errOf(r);
    if(opt.binary) return r; try{return r.text?JSON.parse(r.text):{};}catch(e){throw Error('PC 서버 응답을 읽지 못했습니다');} }

  static syReady(){ const o=System.SY(); return !!(o.repo&&o.token); }

  static async syRemote(o){ // -> {head,tree,paths,state}
    const ref=await System.ghEnsureBranch(o);
    const head=ref.object.sha, commit=await System.gh(o,'/git/commits/'+head), tree=await System.gh(o,'/git/trees/'+commit.tree.sha+'?recursive=1');
    const paths={}; (tree.tree||[]).forEach(x=>{ if(x.type==='blob') paths[x.path]=x.sha; });
    let state=null; if(paths['sync/state.json']){ const r=await System.gh(o,'/git/blobs/'+paths['sync/state.json'],{binary:true}); try{ let j=JSON.parse(r.bytes?new TextDecoder().decode(r.bytes):(r.text||'')); if(j&&j.encoding==='base64'&&j.content) j=JSON.parse(new TextDecoder().decode(System.b64ToBytes(j.content.replace(/\s/g,'')))); state=j; }catch(e){throw Error('GitHub의 기존 진행 정보를 해석하지 못했습니다. 덮어쓰지 않고 중단합니다.');} }
    return {head,treeSha:commit.tree.sha,paths,state};
  }

  static ghH(o,extra){ return Object.assign({Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',Authorization:'Bearer '+String(o.token||'').trim()},extra||{}); }

  static async gh(o,path,opt){ opt=opt||{}; const tries=opt.tries||0; let r; try{ r=await System.http('https://api.github.com/repos/'+o.repo.trim()+path,{method:opt.method||'GET',headers:System.ghH(o,Object.assign(opt.body?{'Content-Type':'application/json'}:{},opt.binary?{Accept:'application/vnd.github.raw+json'}:{})),body:opt.body,binary:!!opt.binary,timeout:opt.timeout||120000}); }catch(e){ if(tries<4){ await wait(2000*Math.pow(2,tries)); return System.gh(o,path,Object.assign({},opt,{tries:tries+1})); } throw e; }
    if(r.status>=500&&r.status<600&&tries<4){ await wait(2000*Math.pow(2,tries)); return System.gh(o,path,Object.assign({},opt,{tries:tries+1})); }
    if(r.status===403||r.status===429){ const t=r.text||''; if(/secondary rate|abuse|rate limit/i.test(t)&&!opt.retried){ await wait(61000); return System.gh(o,path,Object.assign({},opt,{retried:true})); } }
    if(r.status>=400&&!opt.okStatus?.includes(r.status)) throw System.ghRequestError(r,path,opt.method||'GET');
    if(opt.binary) return r; try{return r.text?JSON.parse(r.text):{};}catch(e){throw Error('PC 서버 응답을 읽지 못했습니다');} }

  static ghSafeMessage(value){let text=String(value||'');for(const token of [System.SY().token,System.PUB().token])if(typeof token==='string'&&token.length>=8)text=text.split(token).join('[토큰 숨김]');return text.replace(/(?:github_pat_|gh[pousr]_)[A-Za-z0-9_]+/g,'[토큰 숨김]').replace(/Bearer\s+[^\s,;]+/gi,'Bearer [숨김]');}

  static ghRequestError(response,path,method){const error=Object.assign(Core.errOf(response),{status:response.status,endpoint:method+' '+String(path).split('?')[0]});try{const data=JSON.parse(response.text||'{}');error.details=(Array.isArray(data.errors)?data.errors:[]).map(x=>typeof x==='string'?x:[x.resource,x.field,x.code,x.message].filter(Boolean).join(' / ')).join('; ').slice(0,500);}catch(_){}return error;}

  static ghSHA(value,label){if(typeof value!=='string'||!/^[a-f0-9]{40}$/i.test(value))throw Error(label+' 응답의 커밋·파일 번호가 올바르지 않습니다');return value;}

  static ghRefPath(o){return '/git/ref/heads/'+encodeURIComponent(String(o.branch||'main').trim());}

  static async ghEnsureBranch(o){
   const path=System.ghRefPath(o);let ref=await System.gh(o,path,{okStatus:[404,409]});if(ref?.object?.sha){System.ghSHA(ref.object.sha,'브랜치');return ref;}
   const repo=await System.gh(o,''),defaultBranch=repo.default_branch||'main';let initial=await System.gh(o,System.ghRefPath({branch:defaultBranch}),{okStatus:[404,409]});
   if(!initial?.object?.sha){
    // Only initialize an empty repository. Never overwrite an existing README to repair a missing branch.
    try{await System.gh(o,'/contents/README.md',{method:'PUT',body:{message:'Initialize Maker data repository',content:System.bytesToB64(new TextEncoder().encode('# 가챠 게임 메이커 자료 저장소\n'))}});}catch(e){if(e.status!==409&&e.status!==422)throw e;initial=await System.gh(o,System.ghRefPath({branch:defaultBranch}),{okStatus:[404,409]});if(!initial?.object?.sha)throw e;}
    initial=await System.gh(o,System.ghRefPath({branch:defaultBranch}));
   }
   System.ghSHA(initial?.object?.sha,'기본 브랜치');if(String(o.branch||'main').trim()===defaultBranch)return initial;
   try{ref=await System.gh(o,'/git/refs',{method:'POST',body:{ref:'refs/heads/'+String(o.branch||'main').trim(),sha:initial.object.sha}});}catch(e){if(e.status!==409&&e.status!==422)throw e;ref=await System.gh(o,path,{okStatus:[404,409]});if(!ref?.object?.sha)throw e;}
   System.ghSHA(ref?.object?.sha,'새 브랜치');return ref;
  }

  static async ghCommitFiles(o,base,entries,message){
   let head=System.ghSHA(base.head,'이전 커밋'),treeSHA=System.ghSHA(base.treeSha,'이전 파일 목록');
   for(let attempt=0;attempt<5;attempt++){
    const tree=await System.gh(o,'/git/trees',{method:'POST',body:{base_tree:treeSHA,tree:entries}});System.ghSHA(tree?.sha,'파일 목록');
    const commit=await System.gh(o,'/git/commits',{method:'POST',body:{message,tree:tree.sha,parents:[head]}});System.ghSHA(commit?.sha,'새 커밋');
    try{
     const result=await System.gh(o,'/git/refs/heads/'+encodeURIComponent(String(o.branch||'main').trim()),{method:'PATCH',body:{sha:commit.sha,force:false}});
     if(result?.object?.sha!==commit.sha){const verified=await System.gh(o,System.ghRefPath(o));if(verified?.object?.sha!==commit.sha)throw Error('GitHub의 브랜치 반영을 확인하지 못했습니다. 성공으로 처리하지 않습니다.');}
     return {head:commit.sha,treeSha:tree.sha};
    }catch(e){
     if((e.status!==409&&e.status!==422)||attempt===4)throw e;
     const latest=await System.gh(o,System.ghRefPath(o));const next=System.ghSHA(latest?.object?.sha,'최신 브랜치');if(next===commit.sha)return {head:commit.sha,treeSha:tree.sha};
     if(next===head||!(e.status===409||/fast.?forward|conflict|reference update failed/i.test(e.message||'')))throw e;
     head=next;const current=await System.gh(o,'/git/commits/'+head);treeSHA=System.ghSHA(current?.tree?.sha,'최신 파일 목록');await wait(400+attempt*600);
    }
   }
   throw Error('GitHub 반영에 실패했습니다. 잠시 후 다시 시도해 주세요.');
  }

  static async ghCreateBlob(o,blob,label){if(blob.size>100*1048576)throw Error(label+': 파일 하나가 GitHub 전송 한도 100MiB를 넘습니다. 해당 자료를 줄여 주세요. 전체 게임의 합계 용량 제한은 아닙니다.');const result=await System.gh(o,'/git/blobs',{method:'POST',body:{content:System.bytesToB64(new Uint8Array(await blob.arrayBuffer())),encoding:'base64'},timeout:300000});System.ghSHA(result?.sha,label);return result;}

  static async ghUploadPool(items,task){let next=0,failure=null;await Promise.all(Array.from({length:Math.min(3,items.length)},async()=>{while(!failure&&next<items.length){const item=items[next++];try{await task(item);}catch(e){failure=failure||e;}}}));if(failure)throw failure;}

    // 켤 때 자동 받기는 3분에 두 번까지만(저장이 안 써져서 받기→다시 시작이 끝없이 되풀이되지 않게)
static bootPullOk(){ try{ const now=Date.now(), a=JSON.parse(sessionStorage.getItem('ggm-bootpull')||'[]').filter(x=>now-x<180000); if(a.length>=2) return false; a.push(now); sessionStorage.setItem('ggm-bootpull',JSON.stringify(a)); }catch(e){} return true; }

    // Remote game records and staged media become visible together, only after validation succeeds.
static async lsApply(ls,prefix){
   if(!ls||typeof ls!=='object'||Array.isArray(ls))throw Error('받은 저장 목록이 올바르지 않습니다');
   const pj=JSON.parse(ls[PJKEY]||'null');
   if(!pj||!Array.isArray(pj.list)||typeof pj.active!=='string'||!pj.list.some(x=>x&&x.id===pj.active))throw Error('받은 게임 목록을 확인하지 못했습니다');
   const records={},prefs={},allowed=new Set([...STORE_POLICY.sync,...Object.keys(STORE_POLICY.secret)]); /* 받는 설정 = 저장 정책의 동기화·비밀 갈래 */
   for(const[k,raw]of Object.entries(ls)){if(!GGMStorage.managed(k)&&!allowed.has(k))continue;if(typeof raw!=='string')throw Error('받은 저장 항목 형식이 올바르지 않습니다');const v=System.syMerge(k,raw);if(v==null)continue;if(GGMStorage.managed(k)){if(k!==PJKEY&&!Array.isArray(JSON.parse(v)?.chars))throw Error('받은 게임 자료를 확인하지 못했습니다');records[k]=v;}else prefs[k]=v;}
   const active=records[System.pjKey(pj.active)];if(!active)throw Error('선택한 게임의 저장 데이터가 빠져 있습니다');
   const old={};try{for(const[k,v]of Object.entries(prefs)){old[k]=appStorage.getItem(k);appStorage.setItem(k,v);}await appStorage.commitRecords(records,prefix||null);}
   catch(e){for(const[k,v]of Object.entries(old))try{v===null?appStorage.removeItem(k):appStorage.setItem(k,v);}catch(ignore){}throw e;}
   try{appStorage.removeItem('ggm-sync-hold');}catch(e){}return {ok:true,hold:[],at:JSON.parse(active).prog?.savedAt||0};
  }

    // 올릴 때: 이 기기에 안 들어가 잠시 빼 둔 게임은 PC에 있던 것을 그대로 넣어요(빠진 채로 올려서 PC의 게임이 사라지지 않게)
static lsHoldMerge(ls,rls){ let hold=[]; try{ hold=JSON.parse(appStorage.getItem('ggm-sync-hold')||'[]'); }catch(e){} if(!hold.length||!rls) return ls;
    let pj=null, rpj=null; try{ pj=JSON.parse(ls[PJKEY]||'null'); rpj=JSON.parse(rls[PJKEY]||'null'); }catch(e){} if(!pj) return ls;
    hold.forEach(id=>{ const k=System.pjKey(id); if(rls[k]==null||pj.list.some(x=>x.id===id)) return; ls[k]=rls[k]; pj.list.push((rpj&&(rpj.list||[]).find(x=>x.id===id))||{id,title:'게임'}); });
    ls[PJKEY]=JSON.stringify(pj); return ls; }

    // 아직 손대지 않은 샘플 게임이면(새 기기·지워진 저장소) PC의 저장을 자동으로 덮지 않아요
static freshGame(){ return G.meta.title===DEFAULT_META.title&&!G.meta.draft&&!P().seenOpening&&Core.PJ().list.length<=1; }

  static PUB(){ try{ return JSON.parse(appStorage.getItem(PUBKEY))||{}; }catch(e){ return {}; } }

  static savePUB(o){ try{ appStorage.setItem(PUBKEY,JSON.stringify(o)); }catch(e){} }

  static pubMeta(){ G.meta.pub=G.meta.pub&&typeof G.meta.pub==='object'?G.meta.pub:{}; const m=G.meta.pub; if(!m.slug) m.slug=(String(G.meta.sub||G.meta.title||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,24)||'game')+'-'+uid().slice(0,6); m.ver=+m.ver||0; return m; }

  static subAddr(repo,branch,dir){ return `GGMSUB:${repo}/${branch||'main'}/${dir}`; }

  static async subGet(base,path,binary){ const r=await System.http(base+path+(binary?'':'?t='+Date.now()),{binary:!!binary,timeout:120000}); if(r.status>=400) throw Object.assign(new Error(r.status===404?'게임을 찾지 못했어요. 주소와 저장소가 공개인지 확인해 주세요':'받기 실패 ('+r.status+')'),{status:r.status}); return binary?r.bytes:r.text; }

    /* 이 기기 id(저장소 ggm-devid): 불러올 때 한 번 만들어 두고(devIdEnsure) 읽기는 그 값 */
static devIdEnsure(){ try{ if(!appStorage.getItem('ggm-devid')) appStorage.setItem('ggm-devid','d'+uid()+uid()); }catch(e){ Core.quietErr(e,'devIdEnsure'); } }

  static devId(){ try{ return appStorage.getItem('ggm-devid')||'d0'; }catch(e){ return 'd0'; } }

  static LKMODE(){ const pc=System.PCS(); if(pc&&pc.lock!==false) return 'pc'; const o=System.SY(); if(System.syReady()&&o.lock!==false) return 'gh'; return null; }

  static lkAway(l){ if(!l||!l.id||l.away) return true; const now=l.now||Date.now(); return System.LKMODE()==='pc'?now-(l.seen||0)>45000:now-(l.at||0)>6*3600e3; }

  static async lkGet(){ const m=System.LKMODE();
    if(m==='pc') return await System.pcApi('/api/lease');
    if(m==='gh'){ const o=System.SY(); const r=await System.gh(o,'/contents/sync/lease.json?ref='+encodeURIComponent(o.branch||'main')+'&t='+Date.now(),{okStatus:[404]}); if(!r||!r.content) return {id:'',away:true,_sha:null,now:Date.now()};
      let j={}; try{ j=JSON.parse(new TextDecoder().decode(System.b64ToBytes(String(r.content).replace(/\s/g,'')))); }catch(e){} j._sha=r.sha; j.now=Date.now(); return j; }
    return null; }

  static async lkSave(onlyChanged){ const m=System.LKMODE(); if(m==='pc'){ const pc=System.PCS(); if(!onlyChanged||(G.prog.savedAt||0)>(pc.localAt||0)+1000){if(await SystemView.pcPush(true)!==true)throw Error('PC 저장에 실패하여 기기를 넘기지 않았습니다');} }
    else if(m==='gh'){ const o=System.SY(); if(!onlyChanged||(G.prog.savedAt||0)>(o.localAt||0)+1000){if(await SystemView.syPush(true)!==true)throw Error('클라우드 저장에 실패하여 기기를 넘기지 않았습니다');} } }

  static lkLoop(){ clearInterval(LK.t); const m=System.LKMODE(); if(!m) return; LK.t=setInterval(SystemCtl.lkTick,m==='pc'?12000:45000); }

    // 리롤 초안: 게임의 초안(없으면 지금 세계관으로 새로)에 실제 캐릭터·NPC 이름을 넣어요(그림이 같은 이름에 짝지어지게). 초안에 적어 둔 외모·말투는 이어받아요
static rerollDraft(g,title){ const w=g.world||{}, pr=g.prog||{};
    const d=g.meta&&g.meta.draft?clone(g.meta.draft):{mode:'detail',gtitle:title,kw:String(w.name||title),tone:(g.meta&&g.meta.tone)||'',world:[w.summary,w.lore].filter(Boolean).join('\n\n'),setting:(w.factions||[]).map(f=>f.name+': '+(f.desc||'')).join('\n'),story:'',stages:4,len:'normal',
      hero:{name:pr.player||'',call:(g.meta&&g.meta.terms&&g.meta.terms.player)||'',gender:pr.genderTxt||'',look:pr.look||'',bio:pr.bio||'',hide:!!pr.hideEyes},chars:[]};
    const old=Array.isArray(d.chars)?d.chars:[], pick=n=>old.find(x=>x&&nameEq(x.name,n))||{};
    d.chars=[...(g.chars||[]).filter(c=>!c.alt).map(c=>{ const o=pick(c.name); return {name:c.name,kind:'crew',rank:c.rarity,role:o.role||((c.faction||'')+(c.faction?' · ':'')+(ROLE[c.role]||'')),profile:c.profile||o.profile||'',speech:o.speech||(c.lines||[]).slice(0,2).join(' / '),look:o.look||'',tags:c.naiPrompt||o.tags||''}; }),
      ...(g.npcs||[]).map(n=>{ const o=pick(n.name); return {name:n.name,kind:'npc',role:n.role||o.role||'',profile:n.profile||o.profile||'',speech:n.speech||o.speech||'',look:n.look||o.look||'',tags:n.naiPrompt||o.tags||''}; })];
    return d; }

  static async handleStorageAndSharingAction(a,t,id,p,e){
    switch(a){
  case 'syopen': SystemView.openSync(); break;
  case 'sylink': CoreView.openUrl(t.dataset.url); break;
  case 'sypush': CoreView.closeModal(); SystemView.syPush(false); break;
  case 'sypushf': CoreView.closeModal(); SystemView.syPush(true); break;
  case 'sypull': { const o=System.SY(); if(o.last&&(G.prog.savedAt||0)>(o.localAt||0)+5000&&!(await appConfirm('이 기기에 아직 올리지 않은 진행이 있어요. 받으면 이 기기의 진행은 덮어써져요. 받을까요?'))) break; CoreView.closeModal(); SystemCtl.syPull(); break; }
  case 'sysave': { const repo=$('#sy_repo').value.trim().replace(/^https?:\/\/github\.com\//,'').replace(/\.git$/,'').replace(/\/+$/,''), token=$('#sy_tok').value.trim();
        if(!/^[\w.-]+\/[\w.-]+$/.test(repo)||!token){ CoreView.toast('저장소(아이디/이름)와 토큰을 넣어 주세요'); break; }
        const o=Object.assign(System.SY(),{repo,token,device:$('#sy_dev').value.trim()||SystemView.syDevice(),auto:$('#sy_auto').checked,autoUp:$('#sy_up').checked,keys:$('#sy_keys').checked,lock:$('#sy_lock').checked}); System.saveSY(o);
        const done=CoreView.busy(t,'확인 중…');
        try{ const info=await System.gh(o,''); if(!info.private){ CoreView.toast('이 저장소는 공개예요. 비공개(Private)로 바꾼 뒤 다시 저장해 주세요'); o.token=''; System.saveSY(o); done(); break; }
          if(info.permissions&&info.permissions.push===false){ CoreView.toast('이 토큰은 저장소에 쓸 권한이 없어요 (Contents: Read and write)'); done(); break; }
          const R=await System.syRemote(o); CoreView.closeModal(); Challenge.render(); if(System.LKMODE()==='gh') setTimeout(()=>{ SystemCtl.lkOp('claim').then(()=>{ LK.claimed=true; System.lkLoop(); }).catch(()=>{}); },500);
          SystemView.openSyLinked(R.state&&R.state.device!==o.device?R.state:null);
        }catch(err){ CoreView.toast('연결 실패. '+System.syErr(err)); done(); } break; }
  case 'bkgo': { const o={share:t.dataset.share==='1',img:t.dataset.img==='1',audio:t.dataset.aud==='1',gate:t.dataset.gate!=='0',dest:$('#bk_dest').value,voice:$('#bk_voice')?$('#bk_voice').checked:false}; CoreView.closeModal(); System.exportGo(o); break; }
  case 'pickgame': { if($('#pk_last')&&$('#pk_last').checked) try{ appStorage.setItem('ggm-start','last'); }catch(e){} try{ sessionStorage.setItem('ggm-picked','1'); }catch(e){} const pj=Core.PJ(); if(id===pj.active){ ArtView.showStart(); break; } await System.switchProject(id); break; }
  case 'saveretry': try{ await Core.flush(); if(!appStorage.failed) SystemView.storageWarningClear(); }catch(err){ Core.quietErr(err,'0510-actions/060-storage-and-sharing.js:19'); } break;
  case 'pcopen': SystemView.openPcSet(); break;
  case 'syoff': { if(!(await appConfirm('PC·폰 연동을 해제할까요?\n이 기기의 게임은 그대로 남고, GitHub 저장소의 데이터도 지워지지 않아요. 이 기기에 저장된 토큰만 지워요.'))) break; try{ if(System.LKMODE()==='gh'&&LK.claimed) await System.lkSave(true), await SystemCtl.lkOp('free'); }catch(e){ Core.quietErr(e,'0510-actions/060-storage-and-sharing.js:21'); } clearInterval(LK.t); LK.claimed=false; SystemView.lkUnlock(); try{ appStorage.removeItem(SYKEY); }catch(e){} CoreView.closeModal(); Challenge.render(); CoreView.toast('연동을 해제했어요'); break; }
  case 'pcsave': { if($('#pc_pxoff')){ try{ appStorage.setItem('ggm-proxy-off',$('#pc_pxoff').checked?'1':'0'); }catch(e){} } const o=System.parsePcLink($('#pc_link').value); if(!o){ CoreView.toast('주소에 ?pc=키가 들어 있어야 해요'); break; } o.auto=$('#pc_auto').checked; o.lock=$('#pc_lock').checked; const done=CoreView.busy(t);
        try{ const r=await System.http(o.base+'/api/hello',{headers:{'X-GGM-Key':o.key},timeout:15000}); const j=JSON.parse(r.text||'{}'); if(!j.app) throw 0; if(!j.auth){ CoreView.toast('키가 맞지 않아요. QR 주소를 다시 붙여 넣어 주세요'); done(); break; }
          const old=System.PCS(); System.setPCS(Object.assign({},old&&old.key===o.key?old:{},o)); CoreView.closeModal(); Challenge.render(); CoreView.toast(`PC 서버(${j.host||'PC'})에 연결했어요`); window.__PC_NEW=1; SystemView.pcStart(); if(System.LKMODE()==='pc') setTimeout(SystemCtl.lkActivate,1500); }
        catch(err){ CoreView.toast('PC 서버에 연결하지 못했어요. PC에서 서버 창이 켜져 있는지 확인해 주세요'); done(); } break; }
  case 'pcoff': { if(!(await appConfirm('PC 서버 연결을 해제할까요?\n이 기기의 게임은 그대로 남고, PC에 저장된 데이터도 지워지지 않아요.'))) break; try{ if(System.LKMODE()==='pc'&&LK.claimed) await System.lkSave(true), await SystemCtl.lkOp('free'); }catch(e){ Core.quietErr(e,'0510-actions/060-storage-and-sharing.js:26'); } clearInterval(LK.t); LK.claimed=false; SystemView.lkUnlock(); System.setPCS(null); CoreView.closeModal(); Challenge.render(); CoreView.toast('PC 서버 연결을 해제했어요'); break; }
  case 'pcpush': CoreView.closeModal(); SystemView.pcPush(false); break;
  case 'pcpushf': CoreView.closeModal(); SystemView.pcPush(false,true); break;
  case 'pcpullgo': CoreView.closeModal(); SystemCtl.pcPull(); break;
  case 'pchist': SystemView.openPcHist(); break;
  case 'pchistgo': { if(!(await appConfirm('이 백업으로 되돌릴까요?\n이 기기의 게임이 그 시점으로 바뀌고, PC에도 다시 저장돼요. (지금 PC에 있는 저장도 백업 목록에 남아요)'))) break; const done=CoreView.busy(t);
      try{ const h=await System.pcApi('/api/store/history/'+encodeURIComponent(id)), cur=await System.pcApi('/api/store/state',{ok404:true}); if(!h||!h.ls) throw {message:'백업을 읽지 못했어요'}; CoreView.closeModal(); await SystemCtl.pcPull({state:h,restore:true,cur:cur&&cur.at}); }catch(e){ CoreView.toast('백업을 받지 못했어요. '+System.syErr(e)); done(); } break; }
  case 'pcpull': { const pc=System.PCS(); if(pc&&pc.last&&(G.prog.savedAt||0)>(pc.localAt||0)+5000&&!(await appConfirm('이 기기에 아직 PC에 저장하지 않은 진행이 있어요. 받으면 덮어써져요. 받을까요?'))) break; CoreView.closeModal(); SystemCtl.pcPull(); break; }
  case 'resetth': delete p.inbox[t.dataset.th]; Core.mark('prog'); MessengerCtl.checkTriggers(); CoreView.toast('조건을 만족하면 다시 도착해요'); break;
  case 'importfile': $('#bkfile').click(); break;
  case 'pj-open': CoreView.openProjects(); break;
  case 'pjswitch': await System.switchProject(id); break;
  case 'pjdel': { if(!(await appConfirm('이 게임을 삭제할까요? 되돌릴 수 없어요.'))) break; const pj=Core.PJ(); if(id===pj.active){CoreView.toast('현재 플레이 중인 게임은 삭제할 수 없어요');break;} await Core.flush();await appStorage.assertCurrent(PJKEY);pj.list=pj.list.filter(x=>x.id!==id); appStorage.setItem(PJKEY,JSON.stringify(pj)); appStorage.removeItem(System.pjKey(id));await appStorage.drain(); CoreView.openProjects(); break; }
  case 'pjblank': { await Core.flush(); const id2='g'+uid(), d=Core.defaults(); d.meta.title=G.meta.title+' (사본)'; appStorage.setItem(System.pjKey(id2),JSON.stringify(d)); const pj=Core.PJ(); pj.list.push({id:id2,title:d.meta.title}); pj.active=id2; appStorage.setItem(PJKEY,JSON.stringify(pj)); SystemView.reloadGame(); break; }
  case 'pubopen': SystemView.openPub(); break;
  case 'pubgo': { const P0=System.PUB(); P0.repo=$('#pb_repo').value.trim().replace(/^https?:\/\/github\.com\//,'').replace(/\.git$/,'').replace(/\/$/,''); P0.branch=$('#pb_branch').value.trim()||'main'; P0.token=$('#pb_tok').value.trim(); System.savePUB(P0); await SystemView.pubUpload($('#pb_notes').value.trim(),t); break; }
  case 'pubcopy': case 'pubcopy2': { const v=t.dataset.v||($('#pub_addr')&&$('#pub_addr').value)||''; try{ await navigator.clipboard.writeText(v); CoreView.toast('주소를 복사했어요'); }catch(e){ prompt('복사해 주세요',v); } break; }
  case 'subadd': SystemView.openSubAdd(); break;
  case 'subgo': await Art.subscribe($('#sb_addr').value,CoreView.uiProg(t)); break;
  case 'subcheck': await SystemView.subCheck(true); break;
  case 'subapply': await SystemCtl.subApply(CoreView.uiProg(t)); break;
  case 'subskip': { if(G.meta.subscr){ G.meta.subscr.skip=+t.dataset.v||0; Core.mark('meta'); } CoreView.closeModal(); CoreView.toast('설정 → 게임 → 업데이트 확인에서 언제든 받을 수 있어요'); break; }
  case 'subcopy': { const b=G.meta.subscr&&G.meta.subscr.base, m=b&&b.match(/raw\.githubusercontent\.com\/([\w.-]+\/[\w.-]+)\/([\w.-]+)\/(.+?)\/$/), v=m?System.subAddr(m[1],m[2],m[3]):b; try{ await navigator.clipboard.writeText(v); CoreView.toast('구독 주소를 복사했어요'); }catch(e){ prompt('복사해 주세요',v); } break; }
  case 'subleave': { if(!(await appConfirm('구독을 끊을까요? 지금 게임은 그대로 남고, 앞으로 업데이트를 받지 않아요. 이 게임을 내 게임처럼 직접 고치고 만들 수 있어요.'))) break; delete G.meta.subscr; Core.mark('meta'); const pj=Core.PJ(), row=pj.list.find(x=>x.id===pj.active); if(row){ delete row.sub; appStorage.setItem(PJKEY,JSON.stringify(pj)); } Challenge.render(); CoreView.toast('구독을 끊었어요'); break; }
  case 'pjreroll': { const g=id===Core.PJ().active?G:(()=>{ try{ return JSON.parse(appStorage.getItem(System.pjKey(id))||'null'); }catch(e){ return null; } })(); if(!g){ CoreView.toast('게임을 읽지 못했어요'); break; }
        const title=(g.meta&&g.meta.title)||'게임', d=System.rerollDraft(g,title);
        d.mode='detail'; d.reuse={pj:id,title}; try{ if(typeof SW!=='undefined'&&SW&&$('#sw_card,.setup')){ CoreView.swRead(); Core.swSave(); } }catch(e){} appStorage.setItem(SETUP_KEY,'1'); Story.drLoadFrom(d,title+' 리롤');
        CoreView.toast(`「${title}」의 캐릭터·NPC·배경 그림을 이름이 같은 인물에 그대로 써요. 세계관·인물 설정을 고친 뒤 만들기를 누르세요`); break; }
  case 'pjdraftx': { let g=null; try{ g=JSON.parse(appStorage.getItem(System.pjKey(id))||'null'); }catch(e){} const d=g&&g.meta&&g.meta.draft; if(!d){ CoreView.toast('이 게임에는 저장된 초안이 없어요'); break; } StoryView.openDraftExport((g.meta.title||'게임')+' 초안',d,null); break; }
  case 'backup': SystemView.openBackup(); break;
  case 'importbk': try{const g=JSON.parse($('#bk_in').value);if(!g||!Array.isArray(g.chars))throw 0;Characters.replaceAll(g);CoreView.closeModal();CoreView.toast('데이터를 가져왔어요');}catch(err){CoreView.toast('올바른 백업 데이터가 아니에요');} break;
    }
  }

    /* /UPDATE_GUIDANCE_MODULE */
static onPcServer(){ const pc=System.PCS(); return !!(pc&&location.origin===pc.base); }

  static async applyWebUpdate(rep){ if(rep) rep('받는 중…');
    try{ await Core.flush(); }catch(e){ Core.quietErr(e,'0420-app-update.js:128'); }
    try{ if(System.LKMODE()&&LK.claimed&&!LK.locked) await System.lkSave(true); }catch(e){ Core.quietErr(e,'0420-app-update.js:129'); }
    try{ if(System.onPcServer()) await System.pcApi('/api/update',{method:'POST',body:{},timeout:90000}); }catch(e){ Core.quietErr(e,'0420-app-update.js:130'); }
    try{ if(window.caches){ const ks=await caches.keys(); await Promise.all(ks.map(k=>caches.delete(k))); } }catch(e){ Core.quietErr(e,'0420-app-update.js:131'); }
    try{ await fetch('./index.html',{cache:'reload'}); await fetch('./',{cache:'reload'}); await fetch('./sw.js',{cache:'reload'}); }catch(e){ Core.quietErr(e,'0420-app-update.js:132'); }
    try{ const rg=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration(); if(rg) await rg.update(); }catch(e){ Core.quietErr(e,'0420-app-update.js:133'); }
    SystemView.reloadGame(); }

  static async checkWebUpdate(manual){ if(IS_NATIVE) return; const o=Core.LV(); let man=null;
    try{ const r=await fetch(`https://raw.githubusercontent.com/${Core.updRepo(o)}/main/version.json?t=${Date.now()}`,{cache:'no-store'}); if(r.ok) man=await r.json(); }catch(e){ Core.quietErr(e,'0420-app-update.js:117'); }
    if(!man||!man.build){ if(manual) CoreView.toast('업데이트 정보를 받지 못했어요. 인터넷 연결을 확인해 주세요'); return; }
    let srvOld=false; if(System.onPcServer()){ try{ const h=await System.pcApi('/api/hello'); srvOld=!h.ver||Core.verCmp(String(h.ver),'2026.10.22.2')<0; }catch(e){ Core.quietErr(e,'0420-app-update.js:119'); } }
    if(Core.verCmp(man.build,APP_BUILD)<=0){ if(manual) CoreView.toast('이미 최신 버전이에요 ('+APP_BUILD+')'+(srvOld?' · PC 서버 프로그램은 새로 받아 주세요':'')); return; }
    if(!manual&&o.webSkip===man.build) return; WEBUPD=man;
    const show=()=>{ if(!manual&&(!$('#modal').hidden||($('#ov')&&!$('#ov').hidden&&!$('#ov').querySelector('.title'))||(typeof B!=='undefined'&&B&&!B.over))) return setTimeout(show,4000);
      CoreView.openModal(LiveOpsView.updateWebFoundHTML(man,srvOld)); };
    show(); }

  static splitTags(l){ const m0=l.match(/^(\d\)\s*)?([\s\S]*)$/), pre=m0[1]||'', body=m0[2]; TAG_RE.lastIndex=0; if(!TAG_RE.test(body)){ TAG_RE.lastIndex=0; return [l]; } TAG_RE.lastIndex=0;
    if(/^[^:：\[\s][^:：]{0,20}[:：]\s*\[[^\]]+\]$/.test(body)||/^\[[^\]]+\]$/.test(body)) return [l];
    const out=[]; let last=0, mm; while((mm=TAG_RE.exec(body))){ const before=body.slice(last,mm.index).trim(); if(before) out.push(before); out.push(mm[0]); last=mm.index+mm[0].length; } const rest=body.slice(last).trim(); if(rest) out.push(rest); TAG_RE.lastIndex=0;
    const sp=out[0]&&!out[0].startsWith('[')&&out[0].match(/^([^:：\[\s][^:：]{0,20})[:：]/); // 대사 중간에 지시가 끼면 뒤 조각도 같은 사람의 대사로
    return out.map((x,i)=>pre+(sp&&i>0&&!x.startsWith('[')?sp[1].trim()+': '+x:x)); }

  static parseScript(t){
    return System.unComma(t).split('\n').map(l=>l.trim()).filter(Boolean).flatMap(System.splitTags).map(raw=>{
      let l=raw,cond=0,m,o;
      // 선택지 갈래: "1) 대사", "1）", "(1) 대사", "[1] 대사", "1. 대사", "이름: 1) 대사" 모두 같은 뜻으로 읽어요
      if((m=l.match(/^[(\[（]?([1-9])\s*[)\]）.]\s*(.+)$/))&&!/^\d+\.\d/.test(l)){cond=+m[1];l=m[2];}
      else if((m=l.match(/^([^:：\s][^:：]{0,20}[:：])\s*[(\[（]?([1-9])\s*[)\]）]\s*(.+)$/))){cond=+m[2];l=m[1]+' '+m[3];}
      if(/^\[소품\s*끝\]$/.test(l)) o={type:'cmd',cmd:'소품끝',arg:''};
      else if(/^\[음악\s*끝\]$/.test(l)) o={type:'cmd',cmd:'음악끝',arg:''};
      else if(/^\[톡\s*끝\]$/.test(l)) o={type:'cmd',cmd:'톡끝',arg:''};
      else if(/^\[CG\s*끝\]$/i.test(l)) o={type:'cmd',cmd:'CG끝',arg:''};
      else if((m=l.match(/^\[(배경|소품|효과음|효과|사진|음악|톡|CG|cg|분기|연출|스티커)\s*[:：]\s*(.+?)\]$/))) o={type:'cmd',cmd:m[1],arg:m[2].trim()};
      else if((m=l.match(/^\[(.+?)\]/))) o={type:'place',text:m[1].trim()};
      else if((m=l.match(/^선택\s*[:：]\s*(.+)$/))) o={type:'choice',opts:m[1].split('|').map(s=>s.trim()).filter(Boolean)};
      else if((m=l.match(/^([^:：\s][^:：\[]{0,20}(?:\s*\[[^\]:：]{1,40}\])?)[:：]\s*(.+)$/))){ let who=m[1].trim(),face='',dir=null; const fm=who.match(/^(.+?)\s*\[(.+?)\]$/); if(fm){who=fm[1].trim();dir=System.dirSplit(fm[2]);face=dir.face;} /* 연출(0462): [표정|감정|동작] */ const cm=m[2].trim().match(/^\[(배경|소품|효과음|효과|사진|음악|톡|CG|cg|분기|연출|스티커)\s*[:：]\s*(.+?)\]$/); o=cm?{type:'cmd',cmd:cm[1],arg:cm[2].trim(),who}:{type:'say',who,face,text:m[2]}; if(dir&&!cm&&(dir.emo||dir.motion)) o.dir=dir; }
      else o={type:'nar',text:l};
      o.cond=cond; return o;
    });
  }

    // "미소|하트|점프" → {face,emo,motion}
static dirSplit(s){ const o={face:'',emo:'',motion:''}; String(s||'').split(/[|,·/]/).map(x=>x.trim()).forEach((t,i)=>{ if(!t) return; if(i===0&&FACE_BASIC.includes(t)) o.face=t; /* 첫 칸(빈 칸 포함 위치 — [|놀람]은 표정 없음+감정)이 기본 표정 이름이면 표정(화남·놀람·슬픔·당황은 감정 이름과 겹침) — 기존 이름[표정] 문법 유지 */ else if(!o.emo&&Art.emoKey(t)) o.emo=Art.emoKey(t); else if(!o.motion&&MOTIONS[t]) o.motion=t; else if(!o.face) o.face=t; }); return o; }

    /* AI 연출 입히기: 대사·나레이션은 그대로 두고 표정|감정|동작 태그와 [효과]만 더해요. 바뀐 글이 있으면 버려요 */
static dirStrip(t){ return System.parseScript(t).filter(L=>L.type==='say'||L.type==='nar'||L.type==='choice').map(L=>L.type==='choice'?L.opts.join('|'):(L.who||'')+':'+L.text).join('\n'); }

  static dirCount(t){ return System.parseScript(t).filter(L=>(L.type==='say'&&L.dir&&(L.dir.emo||L.dir.motion))||(L.type==='cmd'&&(L.cmd==='연출'||(L.cmd==='효과'&&!/흔들림|플래시|암전/.test(L.arg))))).length; }

  static async directScript(text,rep){ const src=String(text||''); if(!src.trim()) return null;
    const r=await Core.aiJSON(System.directScriptPrompt({src}),rep,'complex');
    const out=r&&nl(r.script); if(!out) return null; if(System.dirStrip(out)!==System.dirStrip(src)) return null; return out; }

  static bRun(){clearInterval(B.timer);B.timer=setInterval(SystemCtl.bTick,230/(B.speed||1));}

    /* 공격 연출: 근접(공격형·방어형, 보스, 일부 적)은 카드가 대상 쪽으로 몸통박치기, 원거리(지원형, 나머지 적)는 빛줄기가 날아가요. 연출이 닿을 때 피해 숫자가 떠요 */
static attackFx(a,t){return GGMVFX.basic(a,t);}

  static fieldApply(s,A,E){ const r=s&&s.field, d=r&&FIELDS[r.k]; if(d) d.f(A,E,r.a); }

  static fieldTime(s){ const r=s&&s.field; return r&&r.k==='timed'?Math.max(20,Math.min(119,+r.a||90)):0; }

  static bossNext(u){return B&&B.engine&&u.ready&&u.ready.active-B.engine.time<=1;}
}

class SystemView {
  static applyMeta(){
    const m=G.meta; ELEMS=m.elems.map(e=>e.n);
    Object.keys(ECOL).forEach(k=>delete ECOL[k]); Object.keys(BEATS).forEach(k=>delete BEATS[k]);
    m.elems.forEach((e,i)=>{ECOL[e.n]=e.c;BEATS[e.n]=m.elems[(i+1)%m.elems.length].n;});
    Object.assign(ROLE,m.roles); if(typeof Rules.rulesApply==='function') Rules.rulesApply(); // 게임 규칙(상성·능력치) 반영 (0185-game-rules.js)
    document.documentElement.dataset.skin=m.theme||'tactical';
    document.documentElement.style.setProperty('--acc',m.accent||'#ffb400');
    document.title=m.title;
    const el=document.querySelector('.brand'); if(el){ el.innerHTML=`<b class="brand-t">${esc(m.title)}</b><i>${esc(m.sub)}</i>`; SystemView.fitBrand(); }
  }

  static storyFormHTML(sc){ sc=sc||{}; return `<details class="optbox" style="margin-top:10px" ${sc.plot?'open':''}><summary><b>스토리 직접 짜기 · 분량</b> <span class="muted" style="font-size:.8rem">(선택)</span></summary>
      <label class="f" for="ng_story">내가 짠 스토리 (적으면 AI가 이 줄거리를 따라요)</label><textarea class="in tall" id="ng_story" placeholder="예: 1장 - 주인공이 몰락한 왕국의 마지막 기사를 구한다. 2장 - 기사의 배신 의혹… 결말은 주인공이 왕좌를 거절한다. 주요 인물: 레아(기사, 무뚝뚝), 미르(마녀, 장난꾸러기)">${esc(sc.plot||'')}</textarea><p class="muted" id="story-char-count">${String(sc.plot||'').length.toLocaleString()} / 100,000자 · 50,000자 이상은 AI 전달량이 커질 수 있어요. 초과 내용은 자동으로 자르지 않습니다.</p>
      <div class="g2"><div><label class="f" for="ng_stages">장마다 스테이지 수</label><select class="in" id="ng_stages">${CoreView.opt([[0,'자동 (4~5개)'],[3,'3개'],[4,'4개'],[5,'5개'],[6,'6개'],[8,'8개'],[10,'10개']],+sc.stages||0)}</select></div>
      <div><label class="f" for="ng_len">스토리 분량</label><select class="in" id="ng_len">${CoreView.opt(Object.entries(STORY_LEN).map(([k,v])=>[k,v[0]+' (대본 '+v[1].pre+'줄)']),sc.len||'normal')}</select></div></div>
      <div class="g2"><div><label class="f" for="ng_depth">스토리 제작 방식</label><select class="in" id="ng_depth">${CoreView.opt([['deep','꼼꼼하게 (구성 → 스테이지마다 따로 집필)'],['fast','빠르게 (한 번에)']],sc.depth==='fast'?'fast':'deep')}</select></div>
      <div><label class="f" for="ng_newc">새 장·이벤트마다 새 ${esc(System.T('crew'))}</label><select class="in" id="ng_newc">${CoreView.opt([[0,'만들지 않기'],[1,'1명'],[2,'2명 (권장)'],[3,'3명']],sc.newc==null?2:+sc.newc)}</select></div></div>
      <label class="f" for="ng_talkonly">장마다 전투 없는 이야기 스테이지</label><select class="in" id="ng_talkonly">${CoreView.opt([[0,'없음'],[1,'1개 정도'],[2,'2개 정도'],[3,'많이 (절반 가까이)']],sc.talkOnly==null?1:+sc.talkOnly)}</select>
      <p class="muted" style="margin:4px 0 0;font-size:.78rem">이후 AI가 새 장을 쓸 때도 이 설정을 따라요. 설정 → 게임 정의에서 바꿀 수 있어요. 길게·꼼꼼하게 할수록 AI 사용량과 시간이 늘어요. 꼼꼼하게는 장 전체 구성을 먼저 짜고(장면·인물 관계·복선), 스테이지마다 따로 대본을 써서 묘사가 훨씬 두꺼워요.</p></details>`; }

  static aiLogHTML(fromDraft){ const f=t=>{ const d=new Date(t); return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`; };
    return `${head('AI 기록',`<span class="muted">최근 ${AILOG.length}건 · 새 것이 위</span>`)}
    <p class="muted" style="margin:0 0 8px;font-size:.8rem">초안·스토리 생성이 안 될 때 어느 단계에서 왜 멈췄는지 볼 수 있어요. '복사'로 통째로 복사해서 제보에 붙여 주세요(API 키는 들어가지 않아요).</p>
    <div class="row" style="margin-bottom:8px">${fromDraft?'<button class="btn sm" data-act="draft-open">‹ 초안으로</button>':''}<button class="btn sm" data-act="ailogcopy">전체 복사</button><button class="btn sm ghost" data-act="ailogclear">지우기</button><button class="btn sm ghost" data-act="ailog" data-v="${fromDraft?1:''}">새로고침</button></div>
    ${AILOG.length?AILOG.map(e=>`<details class="ailog ${e.ok?'ok':'bad'}"><summary><b>${e.ok?'✓':'✗'}</b> <span>${esc(f(e.at))}</span> <i>${esc(e.stage||'')}</i> <span class="muted">${esc(e.who||'')}${e.model?' · '+esc(e.model):''}${e.tier?' · '+esc(e.tier):''}${e.ms!=null?' · '+(e.ms/1000).toFixed(1)+'초':''}</span>${e.err?`<em>${esc(e.err)}</em>`:''}</summary>
      ${e.req?`<div class="muted" style="font-size:.72rem;margin-top:4px">요청 앞부분 (${nf(e.reqLen||0)}자)</div><pre>${esc(e.req)}</pre>`:''}${e.res?`<div class="muted" style="font-size:.72rem">응답 앞·뒤부분 (${nf(e.resLen||0)}자)</div><pre>${esc(e.res)}</pre>`:''}</details>`).join(''):'<p class="muted">아직 기록이 없어요.</p>'}`; }

    /* 지침 프리셋 고치기: 입력칸에 그 프리셋을 채움(View) */
static llmPresetFormFill(x){ $('#llp_name').value=x.name||''; $('#llp_pos').value=x.pos||'top'; $('#llp_text').value=x.text||''; $('#llp_id').value=x.id; $('#llp_text').focus({preventScroll:true}); }

  static llmHTML(){ const L=Core.llmSlots(); return `${head('글 AI 지침','<span class="muted">모든 글 AI 요청에 들어가요</span>')}
    <label class="f" for="llm_top">상단 <span class="muted" style="font-size:.75rem">맨 앞 · 역할, 문체, 세계관 전반 규칙</span></label><textarea class="in" id="llm_top" style="min-height:80px" placeholder="예: 너는 서브컬처 가챠 게임 전문 시나리오 작가다. 문장은 짧고 리듬감 있게.">${esc(L.top)}</textarea>
    <label class="f" for="llm_mid">중단 <span class="muted" style="font-size:.75rem">출력 형식 바로 앞 · 내용에 대한 요구</span></label><textarea class="in" id="llm_mid" style="min-height:80px" placeholder="예: 대사마다 캐릭터의 말버릇을 한 번 이상 살린다. 장면 묘사는 2문장 이내.">${esc(L.mid)}</textarea>
    <label class="f" for="llm_bot">하단 <span class="muted" style="font-size:.75rem">맨 끝 · 마지막 확인·금지 사항</span></label><textarea class="in" id="llm_bot" style="min-height:80px" placeholder="예: 출력 전에 이름·호칭이 설정과 맞는지 다시 확인한다.">${esc(L.bot)}</textarea>
    <label class="f" for="llm_tag">그림 태그 지침 <span class="muted" style="font-size:.75rem">AI가 그림(NovelAI) 태그를 쓸 때만 · 캐릭터 외형·일러스트·CG·배경·소품·의상</span></label><textarea class="in" id="llm_tag" style="min-height:80px" placeholder="예: 의상은 색·재질·장식을 3가지 이상 구체적으로. 일러스트·CG 장면 태그에는 조명(rim light, backlighting 등)과 구도(dutch angle, from below 등)를 1개씩 넣는다. 노출이 많은 의상 태그는 쓰지 않는다.">${esc(L.tag||'')}</textarea>
    <p class="muted" style="margin:4px 0 0;font-size:.76rem">그림마다 항상 똑같이 붙일 태그는 설정 → 그림 AI의 '스탠딩 뒤·일러스트 뒤…' 칸에 적으세요(AI를 거치지 않고 그대로 붙어요).</p>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="llmsave">저장</button></div>
    <h3 class="sec">지침 프리셋 <span class="muted" style="font-size:.75rem">켜 둔 것만 위 칸 뒤에 이어 붙어요</span></h3>
    ${L.presets.length?L.presets.map(x=>`<div class="ep"><label style="display:flex;gap:8px;align-items:center;flex:1;min-width:0"><input type="checkbox" data-act="llmtog" data-id="${x.id}" ${x.on?'checked':''}><span class="t"><b>${esc(x.name||'이름 없음')}</b><span class="muted">${({top:'상단',mid:'중단',bot:'하단',tag:'그림 태그'})[x.pos]||'상단'} · ${esc(String(x.text||'').slice(0,40))}</span></span></label><button class="btn sm ghost" data-act="llmpedit" data-id="${x.id}">수정</button><button class="btn sm ghost" data-act="llmpcopy" data-id="${x.id}">내보내기</button><button class="btn sm ghost" data-act="llmpdel" data-id="${x.id}">✕</button></div>`).join(''):'<p class="muted" style="margin:0 0 6px;font-size:.82rem">자주 쓰는 지침을 이름 붙여 저장해 두면 복붙 없이 켜고 끌 수 있어요.</p>'}
    <div class="optbox" style="margin-top:8px"><div class="g2"><div><label class="f" for="llp_name">이름</label><input class="in" id="llp_name" maxlength="30" placeholder="예: 문체 지침"></div><div><label class="f" for="llp_pos">자리</label><select class="in" id="llp_pos">${CoreView.opt([['top','상단'],['mid','중단'],['bot','하단'],['tag','그림 태그 지침']],'top')}</select></div></div>
      <label class="f" for="llp_text">지침 내용</label><textarea class="in" id="llp_text" style="min-height:90px"></textarea><input type="hidden" id="llp_id" value="">
      <div class="row" style="margin-top:8px"><button class="btn sm" data-act="llmpadd">프리셋 저장</button><button class="btn sm ghost" data-act="llmpimport">코드로 가져오기</button></div></div>`; }

  static aiProfilesHTML(){
    const A=System.AIP(); if(!A.list.length) return '<p class="muted">아직 등록된 AI가 없어요.</p>';
    return A.list.map(p=>{const on=p.id===A.active||(!A.list.some(x=>x.id===A.active)&&p===A.list[0]);const dm=DEFM[System.defKey(p)]||[''];
      return `<div class="ep"><span class="t"><b>${esc(p.name||AITYPE[p.type])} ${on?'<span class="badge r3c">사용 중</span>':''}</b><span class="muted">${AITYPE[p.type]}${p.type==='vertex'?(p.pub==='anthropic'?' · Claude':' · Gemini'):''} · ${esc(p.model||dm[0]||'모델 미지정')}${Core.apValid(p)?'':' · 설정 미완료'}</span></span>${on?'':`<button class="btn sm" data-act="apuse" data-id="${p.id}">사용</button>`}<button class="btn sm ghost" data-act="apedit" data-id="${p.id}">편집</button></div>`;}).join('');
  }

  static sceneBgm(){
    const sc=Story.sceneOf();
    if(typeof B!=='undefined'&&B) return ArtView.bgm(B.enemies.some(en=>en.boss)?sc.boss:sc.battle);
    if(typeof GC!=='undefined'&&GC) return ArtView.bgm(sc.gacha);
    if(document.querySelector('.title')) return ArtView.bgm(sc.title);
    if(typeof S!=='undefined'&&S) return;
    ArtView.bgm(sc.lobby);
  }

  static openSound(){
    const s=Core.SND(); s.scene=Story.sceneOf(); const bg=['',...G.lib.filter(l=>l.kind==='bgm').map(l=>l.name)];
    const sel=(id,cur)=>`<select class="in" id="${id}">${bg.map(n=>`<option value="${esc(n)}" ${n===cur?'selected':''}>${n?esc(n):'없음'}</option>`).join('')}</select>`;
    const onoff=(id,v)=>`<select class="in" id="${id}">${CoreView.opt([['1','켜기'],['0','끄기']],v?'1':'0')}</select>`;
    CoreView.openModal(`${head('소리')}
      <div class="slider"><label for="sd_bv"><span>배경음 볼륨</span></label><input id="sd_bv" type="range" min="0" max="100" value="${Math.round(s.bgmVol*100)}"></div>
      <div class="slider"><label for="sd_xv"><span>효과음 볼륨</span></label><input id="sd_xv" type="range" min="0" max="100" value="${Math.round(s.sfxVol*100)}"></div>
      <div class="slider"><label for="sd_vv"><span>음성 볼륨</span></label><input id="sd_vv" type="range" min="0" max="100" value="${Math.round(s.voiceVol*100)}"></div>
      <div class="g2"><div><label class="f">배경음</label>${onoff('sd_bon',s.bgmOn)}</div><div><label class="f">스토리 음성</label>${onoff('sd_vs',s.voiceStory)}</div></div>
      <div class="g2"><div><label class="f">로비 터치 음성</label>${onoff('sd_vl',s.voiceLobby)}</div><div><label class="f" for="sd_lang">목소리 언어</label><select class="in" id="sd_lang">${CoreView.opt([['ko','한국어 (자막 그대로)'],['ja','일본어 (자막은 한국어)']],s.voiceLang||'ko')}</select></div></div>
      <p class="muted" style="margin:4px 0 0;font-size:.78rem">일본어로 하면 대사를 글 AI가 일본어로 옮겨서 읽어요(한 번 옮긴 대사는 저장해서 다시 쓰고, 처음 한 번은 글 AI 요금이 조금 들어요). 일본어를 잘하는 목소리를 고르면 더 자연스러워요.</p>
      <h3 class="disp" style="margin:16px 0 0;font-size:1.05rem">장면별 배경음</h3>
      <div class="g2"><div><label class="f">타이틀</label>${sel('sd_title',s.scene.title)}</div><div><label class="f">로비</label>${sel('sd_lobby',s.scene.lobby)}</div></div>
      <div class="g2"><div><label class="f">전투</label>${sel('sd_battle',s.scene.battle)}</div><div><label class="f">보스전</label>${sel('sd_boss',s.scene.boss)}</div></div>
      <div class="g2"><div><label class="f">계약</label>${sel('sd_gacha',s.scene.gacha)}</div><div></div></div>
      <p class="muted" style="margin:6px 0 0">스토리에서는 대본의 [음악: 이름]으로 바뀌어요.</p>
      <h3 class="disp" style="margin:16px 0 0;font-size:1.05rem">음성 AI (Fish Audio)</h3>
      <label class="f" for="sd_fk">API 키</label><input class="in" id="sd_fk" type="password" autocomplete="off" value="${esc(s.fishKey)}">
      <label class="f" for="sd_fm">음성 모델</label><select class="in" id="sd_fm">${CoreView.opt([['s2.1-pro','S2.1 Pro (기본)'],['s2-pro','S2 Pro'],['s1','S1'],['s2.1-pro-free','S2.1 Pro Free (무료 개발자 등급)'],['drama-3-preview','Drama 3 Preview']],s.fishModel)}</select>
      <p class="muted" style="margin:4px 0 0">fish.audio 로그인 → API Keys에서 만들어요. 한 번 만든 대사 음성은 기기에 저장돼서 다시 들을 때 돈이 들지 않아요.</p>
      <h3 class="disp" style="margin:16px 0 0;font-size:1.05rem">음악 AI (ElevenLabs Music)</h3>
      <label class="f" for="sd_ek">API 키</label><input class="in" id="sd_ek" type="password" autocomplete="off" value="${esc(s.elKey)}">
      <label class="f" for="sd_eb">API 주소 (비우면 공식 주소 ${EL_DEF})</label><input class="in" id="sd_eb" inputmode="url" autocomplete="off" placeholder="${EL_DEF}" value="${esc(s.elBase||'')}">
      <div class="g2"><div><label class="f" for="sd_em">모델</label><select class="in" id="sd_em">${CoreView.opt([['music_v1','Music v1'],['music_v2','Music v2']],s.elModel)}</select></div><div><label class="f" for="sd_el">곡 길이(초)</label><input class="in" id="sd_el" type="number" value="${s.elLen}"></div></div>
      <p class="muted" style="margin:4px 0 0">elevenlabs.io → Developers → API Keys에서 만들어요. 음악 생성은 유료 요금제에서 쓸 수 있어요.</p>
      <div class="row" style="margin-top:14px"><button class="btn" data-act="sndsave">저장</button><button class="btn ghost" data-act="fishtest">Fish 연결 확인</button></div>
      <h3 class="disp" style="margin:16px 0 0;font-size:1.05rem">저장된 음성</h3>
      <p class="muted" id="vstat" style="margin:4px 0 8px">세는 중…</p>
      <div class="row"><button class="btn sm ghost" data-act="vprebuild">전체 대사 미리 만들기</button><button class="btn sm ghost" data-act="vclearall">음성 저장소 비우기</button></div>`);
    System.voiceStats().then(v=>{const el=$('#vstat'); if(el) el.textContent=`${v.n}개 · ${v.mb}MB. 같은 목소리·모델·대사는 다시 요청하지 않고 이 파일을 재생해요.`;});
  }

  static async backupExport(kind,dest,voices=false){
   if(BACKUP_BUSY)return;BACKUP_BUSY=true;SystemView.backupBusyOverlay(true);const label=BACKUP_TYPES[kind].name;let writer;
   try{await Core.flush().catch(()=>{});await appStorage.drain().catch(()=>{});const game=JSON.parse(JSON.stringify(G)),media=System.backupMedia(game),stamp=new Date().toISOString(),name='gacha-'+kind+'-'+stamp.replace(/[:.]/g,'-')+'.ggmbak';writer=await System.bkWriter(dest,name);const write=o=>writer.write(JSON.stringify(o)+'\n');
   await write({format:'ggm-backup',version:2,kind,at:stamp,identity:Art.backupIdentity(game),...(kind!=='assets'?{game}:{}),...(kind!=='progress'?{media}:{} )});let count=0;
   if(kind!=='progress'){
   const entries=[...media.images.map(x=>({key:x.id})),...media.audios.map(x=>({key:'a_'+x.id})),...media.chat.map(key=>({key}))];if(voices)for(const k of await System.idbKeys())if(String(k).startsWith('v_'))entries.push({key:k,global:true});
   for(const item of entries){SystemView.syBar(`${label}: 자료 저장 ${++count}/${entries.length}…`);CoreView.say('#backup-busy-lock b',`${label}: 자료 저장 ${count}/${entries.length}…`);const blob=item.global?await Core.idbGet(item.key):await System.idbGetNS(item.key);if(!blob)throw Error('자료 파일을 찾지 못했습니다: '+item.key);await write({record:'media',key:item.key,global:!!item.global,type:blob.type,size:blob.size});for(let p=0;p<blob.size;p+=262144)await write({record:'chunk',data:await System.backupBytes(blob.slice(p,p+262144))});await write({record:'media-end'});}
   }
   await write({record:'end',count});const result=await writer.close();SystemView.syBar('');
   if(result.uri&&dest==='share'){if(!CAP?.Share)throw Error('공유 기능을 사용할 수 없습니다');await CAP.Share.share({title:label,files:[result.uri]});}
   else if(result.blob){System.downloadBlob(result.blob,name);}
   CoreView.openModal(SystemView.backupDoneHTML(label,result,name,kind));
   }catch(e){SystemView.syBar('');CoreView.toast(label+' 실패: '+(e.message||e)+'. 완료되지 않은 파일은 복원용으로 사용하지 마세요.');}finally{BACKUP_BUSY=false;SystemView.backupBusyOverlay(false);}
  }

  static async shareExport(options){
   if(BACKUP_BUSY)return;BACKUP_BUSY=true;SystemView.backupBusyOverlay(true);let writer,destinationFailed=false,retryAsShare=false;
   try{
    await Core.flush();await appStorage.drain();appStorage.setItem('ggm-bkdest',options.dest);
    const game=Characters.shareDefinition(options),media=System.backupMedia(game),stamp=new Date(),safe=String(game.meta.title||'game').replace(/[^\w가-힣-]+/g,'_').slice(0,20),name='gacha-share-'+safe+'-'+stamp.toISOString().replace(/[:.]/g,'-')+'.ggmpack';
    try{writer=await System.bkWriter(options.dest,name);}catch(e){destinationFailed=true;throw e;}const write=async record=>{try{await writer.write(JSON.stringify(record)+'\n');}catch(e){destinationFailed=true;throw e;}};
    await write({format:'ggm-share',version:2,kind:'share',app:'gacha-game-maker',build:APP_BUILD,at:stamp.toISOString(),game,media});
    const entries=[...media.images.map(x=>({key:x.id})),...media.audios.map(x=>({key:'a_'+x.id}))];let count=0;
    for(const item of entries){CoreView.backupTransferStatus(`공유팩 자료 저장 ${++count}/${entries.length}…`);const blob=await System.idbGetNS(item.key);if(!blob)throw Error('자료 파일을 찾지 못했습니다: '+item.key);await write({record:'media',key:item.key,type:blob.type,size:blob.size});for(let p=0;p<blob.size;p+=262144){await write({record:'chunk',data:await System.backupBytes(blob.slice(p,p+262144))});CoreView.backupTransferStatus(`공유팩 자료 저장 ${count}/${entries.length} · ${(Math.min(p+262144,blob.size)/1048576).toFixed(1)} / ${(blob.size/1048576).toFixed(1)} MiB`);}await write({record:'media-end'});}
    await write({record:'end',count});CoreView.backupTransferStatus('공유팩 파일 저장 중…');let result;try{result=await writer.close();}catch(e){destinationFailed=true;throw e;}
    if(result.uri&&options.dest==='share'){if(!CAP?.Share)throw Error('공유 기능을 사용할 수 없습니다');await CAP.Share.share({title:game.meta.title+' 공유팩',files:[result.uri]});}
    else if(result.blob){const file=new File([result.blob],name,{type:'application/octet-stream'});if(options.dest==='share'&&navigator.canShare?.({files:[file]}))await navigator.share({title:game.meta.title+' 공유팩',files:[file]});else{System.downloadBlob(file,name);}}
    CoreView.openModal(SystemView.shareDoneHTML(result,name));
   }catch(e){if(e?.name!=='AbortError'){if(destinationFailed&&IS_NATIVE&&options.dest!=='share'){retryAsShare=true;CoreView.toast('이 폴더에 저장할 수 없어 공유하기로 다시 저장합니다.');}else CoreView.toast('공유팩 저장 실패: '+(e.message||e)+'. 완료되지 않은 파일은 사용하지 마세요. 저장 위치도 확인해 주세요.');}}
   finally{BACKUP_BUSY=false;SystemView.backupBusyOverlay(false);SystemView.syBar('');}
   if(retryAsShare)return SystemView.shareExport({...options,dest:'share'});
  }

  static async dataExport(){
   if(BACKUP_BUSY)return;BACKUP_BUSY=true;SystemView.backupBusyOverlay(true);
   try{await Core.flush();await appStorage.drain();const gid=Core.PJ().active,game=JSON.parse(JSON.stringify(G)),blob=await SystemView.dataExportZip(game,gid),
    name='ggm-data-'+String(game.meta?.title||gid).replace(/[^\w가-힣-]+/g,'_').slice(0,30)+'-'+new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')+'.zip',where=await System.dataSaveBlob(blob,name);
    SystemView.syBar('');if(where)CoreView.openModal(SystemView.dataExportDoneHTML(where,gid));}
   catch(e){SystemView.syBar('');CoreView.toast('내보내기 실패: '+(e.message||e));}finally{BACKUP_BUSY=false;SystemView.backupBusyOverlay(false);}}

    /* STORAGE_INTEGRATION_MODULE */
  /* These hooks run in the main script's global lexical environment. */
static storageWarning(message){let el=document.getElementById('save-warning');if(!el){el=document.createElement('div');el.id='save-warning';el.setAttribute('role','alert');el.style.cssText='position:fixed;top:env(safe-area-inset-top,0px);left:8px;right:8px;z-index:2147483646;background:var(--panel,#fff);color:var(--ink,#222);border:2px solid var(--rose,#d92f5a);padding:12px;border-radius:12px';el.innerHTML='<b>저장 실패</b><p></p><button class="btn sm" type="button" data-act="saveretry">저장 다시 시도</button>';el.querySelector('b').textContent='저장 실패 · 앱을 종료하지 마세요';document.body.appendChild(el);}el.querySelector('p').textContent=message+(/다른 메이커 화면/.test(message)?' 이 화면의 미저장 변경은 진행 백업으로 따로 보관해 주세요.':' 현재 변경 내용은 아직 저장되지 않았습니다. 저장 공간을 확보하고 다시 시도하거나 진행 백업을 내보내 주세요.');}

  static storageWarningClear(){ document.getElementById('save-warning')?.remove(); }

  static async reloadGame(url){try{if(!window.__NOFLUSH)await Core.flush();await appStorage.drain();if(url)location.href=url;else location.reload();}catch(e){System.saveFailed(e.message||'저장하지 못했습니다');}}

  static battleCharacterArt(c){
   const name=c.name||'이름 없음',markup=CoreView.art(c);
   return markup.includes('<img ')?markup.replace('<img ',`<img data-battle-name="${esc(name)}" `):`<div class="art v2-art-name" role="img" aria-label="${esc(name)} · 일러스트 없음">${esc(name)}</div>`;
  }

  static procBg(name){
    if(procCache[name]) return procCache[name];
    let h=System.hash(name)||1; const R=()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return (h%10000)/10000;};
    const hue=System.hash(name+'h')%360;
    let svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice">';
    for(let i=0;i<40;i++) svg+=`<circle cx="${Math.round(R()*400)}" cy="${Math.round(R()*150)}" r="${(R()*1.2+.3).toFixed(1)}" fill="#fff" opacity="${(R()*.6+.2).toFixed(2)}"/>`;
    let x=0; while(x<400){const w=14+R()*30,hg=70+R()*120; svg+=`<rect x="${Math.round(x)}" y="${Math.round(300-hg)}" width="${Math.round(w)}" height="${Math.round(hg)}" fill="hsl(${hue},35%,15%)"/>`; x+=w+2;}
    x=0; while(x<400){const w=20+R()*40,hg=30+R()*90; svg+=`<rect x="${Math.round(x)}" y="${Math.round(300-hg)}" width="${Math.round(w)}" height="${Math.round(hg)}" fill="#0a0712"/>`;
      for(let k=0;k<4;k++) if(R()<.6) svg+=`<rect x="${Math.round(x+3+R()*(w-8))}" y="${Math.round(300-hg+6+R()*(hg-14))}" width="3" height="4" fill="hsl(${(hue+40)%360},90%,70%)" opacity=".8"/>`; x+=w+3;}
    svg+='</svg>';
    return procCache[name]=`url('data:image/svg+xml,${encodeURIComponent(svg)}'),linear-gradient(180deg,hsl(${hue},45%,14%),hsl(${(hue+35)%360},50%,30%) 75%,hsl(${(hue+60)%360},45%,20%))`;
  }

  static backupBlocks(){return Object.entries(BACKUP_TYPES).map(([k,v])=>`<section class="panel backup-block" data-backup-kind="${k}"><h3>${v.name}</h3><p class="muted">${v.desc}</p><p class="muted">불러오기: .ggmbak 또는 이전 .json 백업을 선택하세요. 파일명 변경은 필요 없으며, 파일 내용으로 형식을 확인합니다.</p>${k==='progress'?'<p class="muted">새 기기에는 그림이 따라가지 않습니다. 자료 백업도 따로 불러오거나 전체 백업을 사용하세요.</p>':''}<div class="row"><button class="btn sm" data-act="backup-save" data-kind="${k}">${v.name} 저장</button><button class="btn sm ghost" data-act="backup-load" data-kind="${k}">${v.name} 불러오기</button></div></section>`).join('')+(typeof SystemView.dataFolderBlock==='function'?SystemView.dataFolderBlock():'');}

  static openBackupChoice(kind){const v=BACKUP_TYPES[kind];if(!v)return;CoreView.openModal(`${head(v.name+' 저장')}<p>${v.desc}</p><label class="f" for="backup-dest">저장 위치</label><select class="in" id="backup-dest">${SystemView.opt_(System.bkDests(),System.bkDest())}</select>${kind!=='progress'?'<label class="f"><input type="checkbox" id="backup-voices"> 기기 전체의 생성 음성 캐시도 추가 (다른 게임의 캐시 포함, 용량 증가)</label>':''}<p class="muted">현재 선택한 게임 하나를 저장합니다. 저장 중에는 앱을 닫지 마세요. 파일 생성 완료 안내를 확인해 주세요.</p><div class="row"><button class="btn" data-act="backup-start" data-kind="${kind}">저장 시작</button><button class="btn ghost" data-act="close">취소</button></div>`);}

    /* 백업 저장 완료 창 내용(View) */
static backupDoneHTML(label,result,name,kind){ return `${head(label+' 저장 완료')}<p>${esc(result.where||name)}</p><p class="muted">${BACKUP_TYPES[kind].desc}</p><button class="btn" data-act="close">확인</button>`; }

  static backupBusyOverlay(on){let el=document.getElementById('backup-busy-lock');if(!on){if(el)el.remove();return;}if(el)return;el=document.createElement('div');el.id='backup-busy-lock';el.setAttribute('role','status');el.style.cssText='position:fixed;inset:0;z-index:2147483640;background:rgba(0,0,0,.65);display:grid;place-items:center;color:white;padding:24px;pointer-events:auto';el.innerHTML='<div><b>파일 처리 중…</b><p>완료될 때까지 앱을 닫지 마세요.</p></div>';document.body.appendChild(el);}

    /* 공유 팩 저장 완료 창 내용(View) */
static shareDoneHTML(result,name){ return `${head('공유 팩 저장 완료')}<p style="overflow-wrap:anywhere">${esc(result.where||name)}</p><p>받는 사람은 패치된 메이커의 설정 → 데이터 → 공유 팩 불러오기에서 새 게임으로 추가할 수 있어요. 기존 JSON 공유팩도 같은 곳에서 불러올 수 있어요.</p><button class="btn" data-act="close">확인</button>`; }

  static exportFile(opt){ opt=opt||{}; const share=!!opt.share;
    CoreView.openModal(`${head(share?'공유 팩 저장':'백업 파일 저장')}
      <label class="f" for="bk_dest">저장 위치</label><select class="in" id="bk_dest">${SystemView.opt_(System.bkDests(),System.bkDest())}</select>
      ${share?'':`<label style="display:flex;gap:8px;margin-top:10px"><input type="checkbox" id="bk_voice"><span>캐릭터 음성도 넣기 <span class="muted" style="font-size:.8rem">(새 기기에서 다시 만들지 않아도 돼요. 파일이 커져요)</span></span></label>`}
      <p class="muted" style="margin:8px 0 0;font-size:.82rem">${IS_NATIVE?'문서·다운로드 폴더에 저장하면 휴대폰의 \'내 파일\' 앱에서 찾을 수 있어요. 앱을 지워도 남아요.':'PC에서는 \'직접 고르기\'로 원하는 폴더에 저장할 수 있어요.'}</p>
      <div class="row" style="margin-top:14px"><button class="btn" data-act="bkgo" data-share="${share?1:0}" data-img="${opt.img===false?0:1}" data-aud="${opt.audio?1:0}" data-gate="${opt.gate===false?0:1}">저장</button><button class="btn ghost" data-act="close">취소</button></div>`);
  }

  static opt_(list,v){ return list.map(([k,l])=>`<option value="${esc(k)}" ${k===v?'selected':''}>${esc(l)}</option>`).join(''); }

  static async dataExportZip(game,gid){ // 현재 게임 하나 → zip Blob
   const media=System.backupMedia(game),entries=[],meta={},files=System.dataSplit(game),pj=Core.PJ(),entry=pj.list.find(x=>x.id===gid)||{id:gid,title:game.meta?.title||''};
   entries.push({name:'data/index.json',data:jsonBytes({format:'ggm-data',version:1,build:APP_BUILD,at:new Date().toISOString(),games:[entry]})});
   for(const[k,v]of Object.entries(files))entries.push({name:`data/${gid}/${k}.json`,data:jsonBytes(v)});
   const keys=[...media.images.map(x=>x.id),...media.audios.map(x=>'a_'+x.id),...media.chat];let n=0;
   for(const k of keys){SystemView.syBar(`데이터 폴더: 자료 ${++n}/${keys.length}`);const b=await System.idbGetNS(k);if(!b)throw Error('자료 파일을 찾지 못했습니다: '+k);meta[k]={type:b.type||''};entries.push({name:`data/${gid}/media/${k}`,data:new Uint8Array(await b.arrayBuffer())});}
   entries.push({name:`data/${gid}/media.json`,data:jsonBytes(meta)});
   return System.zipMake(entries);}

    /* 데이터 폴더 내보내기 완료 창 내용(View) */
static dataExportDoneHTML(where,gid){ return `${head('데이터 폴더 내보내기 완료')}<p>${esc(where)}</p><p class="muted">압축을 풀면 data/${esc(gid)}/ 안에 종류별 JSON(chars.json, chapters.json, world.json …)과 media 폴더가 있어요.</p><button class="btn" data-act="close">확인</button>`; }

  static dataFolderBlock(){return `<section class="panel backup-block" data-backup-kind="data-folder"><h3>데이터 폴더 (종류별 JSON)</h3><p class="muted">현재 게임을 data/게임id/ 폴더 구조의 zip으로 내보내요. 캐릭터·시나리오·세계관 등이 종류별 JSON 파일로 나뉘어 있어서 직접 열어 보거나 고칠 수 있어요. 그림·음성은 media 폴더에 들어가요. 가져오면 새 게임으로 추가돼요.</p><p class="muted">PC 서버를 쓰면 같은 구조로 PC의 data 폴더에 자동으로 저장돼요.</p><div class="row"><button class="btn sm" data-act="data-save">데이터 폴더 내보내기</button><button class="btn sm ghost" data-act="data-load">데이터 폴더 가져오기</button></div></section>`;}

  static async hydrateChatImgs(){ let ch=false;
    for(const el of [...document.querySelectorAll('[data-chatimg]')]){ const k=el.dataset.chatimg; if(!chatImgCache[k]){ try{ const b=await System.idbGetNS(k); if(b) chatImgCache[k]=URL.createObjectURL(b); }catch(e){} }
      if(!el.isConnected) continue; el.outerHTML=chatImgCache[k]?CoreView.chatImgHTML(k):`<div class="art ph"><small>사진이 이 기기에 없어요</small></div>`; ch=true; }
    if(ch){ const c=$('#phChat'); if(c) c.scrollTop=c.scrollHeight; } }

  static cardTxt(cd,u){ const df=CARD_DEF[cd.k]||CARD_DEF.strike, m=cd.up?df.mu:df.m, c=charById(cd.o);
    if(cd.k==='skill'){ const k=c.skill.kind, pw=c.skill.power*(cd.up?df.mu:1); if(!u) return SK_TXT[k]+` (×${(Math.round(pw*10)/10)})`; const v=System.cbSkillVal(u,c.skill,pw); return k==='dmg'?`적 1명에게 ${nf(v)} 피해`:k==='aoe'?`모든 적에게 ${nf(v)} 피해`:k==='heal'?`리더 체력 ${nf(v)} 회복`:k==='shield'?`보호막 ${nf(v)}`:`이번 전투 공격 +${Math.round(v*100)}%`; }
    if(!u){ const fx={rage:`최대 체력 ${Math.round(9*m)}%`,release:`공격력 ×${m}`,burnout:`공격력 ×${m}`,flurry:`공격력 ×${m}`,strike:`공격력 ×${m}`,guard:`최대 체력 ${Math.round(9*m)}%`,twin:`공격력 ×${m}`,taunt:`최대 체력 ${Math.round(9*m)}%`,heavy:`공격력 ×${m}`,sweep:`공격력 ×${m}`,wall:`최대 체력 ${Math.round(9*m)}%`,aid:`최대 체력 ${Math.round(12*m)}%`,combo:`공격력 ×${m}`,slash:`공격력 ×${m}`,brand:`공격력 ×${m}`,finisher:`공격력 ×${m}`,bleed:`공격력 ×${m}`,bulwark:`최대 체력 ${Math.round(9*m)}%`,counter:`최대 체력 ${Math.round(9*m)}%`}; return df.d(fx[cd.k]!=null?fx[cd.k]:m,cd); }
    if(cd.k==='shieldbash') return CB?`지금 보호막의 ${Math.round(m*100)}% → 적 1명에게 ${nf(Math.round(CB.block*m))} 피해`:df.d(m,cd);
    if(cd.k==='rage') return df.d(nf(System.cbBlk(CB?Challenge.cbLead():u,m)),cd);
    if(cd.k==='release') return df.d(nf(System.cbAtkVal(u,m)),cd)+(CB&&CB.charge?` <b>(지금 ×${1+CB.charge})</b>`:'');
    if(df.t==='atk') return df.d(nf(System.cbAtkVal(u,m)),cd);
    if(['guard','taunt','wall','bulwark','counter'].includes(cd.k)) return df.d(nf(System.cbBlk(u,m)),cd);
    if(cd.k==='aid') return df.d(nf(Math.round(u.maxhp*0.12*m)),cd);
    return df.d(m,cd); }

  static sealSVG(){
    let ticks=''; for(let i=0;i<36;i++){const a=i*10*Math.PI/180;ticks+=`<line x1="${(Math.cos(a)*86).toFixed(1)}" y1="${(Math.sin(a)*86).toFixed(1)}" x2="${(Math.cos(a)*(i%3?90:94)).toFixed(1)}" y2="${(Math.sin(a)*(i%3?90:94)).toFixed(1)}"/>`;}
    return `<svg viewBox="-100 -100 200 200" aria-hidden="true"><g fill="none" stroke="#e9b949" stroke-opacity=".85"><circle r="95" stroke-width="1.4"/><circle r="82" stroke-width=".7" stroke-dasharray="2 4"/>${ticks}<circle r="58" stroke-width="1.2"/><path d="M0,-80 L18,-25 L76,-25 L29,9 L47,64 L0,30 L-47,64 L-29,9 L-76,-25 L-18,-25Z" stroke-width="1"/><circle r="24" stroke-width="2"/><circle r="12" stroke-width=".8"/></g></svg>`;
  }

  static playGacha0(res){
    const top=Math.max(...res.map(x=>x.c.rarity)), fake=top===3&&Math.random()<0.5;
    GC={res,timers:[],open:new Set(),skip:false,cutCb:null,auto:false};
    const cb=Acquire.curBanner(), bgn=(cb&&cb.bg)||P().gachaBg;
    const bg=bgn?ArtView.bgStyle(bgn):'background:radial-gradient(circle at 50% 40%,#3a1d3f,#05030b 70%)';
    $('#ov').innerHTML=`<div class="gc" id="gc"><div class="gc-sky" style="${bg}"></div>${StoryView.shootHTML(6)}
      <div class="gc-seal" id="gcSeal">${SystemView.sealSVG()}</div>
      <div class="gc-streak" id="gcStreak" style="--sc:${fake?RCOL[2]:RCOL[top]}"><i class="tail"></i><i class="core"></i></div>
      <div class="gc-flash" id="gcFlash"></div>
      <button class="skipb" data-act="gcskip">건너뛰기</button>
      <div class="gc-stage" id="gcStage" hidden><div class="pgrid n${res.length}">${res.map((x,i)=>`<button class="pc r${x.c.rarity}" data-act="flip" data-i="${i}" style="--d:${i*60}ms" aria-label="카드 열기"><div class="pin"><div class="pb">◆</div><div class="pf">${x.isNew?'<span class="tag">NEW</span>':`<span class="tag d">+${x.refund}</span>`}${CoreView.art(x.c)}<div class="lbl"><span class="badge r${x.c.rarity}c" style="background:rgba(0,0,0,.45)">${RL[x.c.rarity]}</span><br>${esc(x.c.name)}</div></div></div></button>`).join('')}</div>
      <div class="row" style="width:100%;max-width:400px"><button class="btn ghost" data-act="flipall">모두 열기</button><button class="btn" data-act="closepull">확인</button></div></div></div>`;
    $('#ov').hidden=false; ArtView.bgm(Story.sceneOf().gacha);
    const T=(ms,f)=>GC.timers.push(setTimeout(f,ms));
    Art.sfx('계약진'); T(700,()=>{$('#gcStreak').classList.add('fall');Art.sfx('낙하');});
    if(fake) T(1350,()=>{$('#gcStreak').style.setProperty('--sc',RCOL[3]);$('#gcSeal').classList.add('gold');try{navigator.vibrate&&navigator.vibrate(120);}catch(e){}});
    T(1720,()=>{Art.sfx('섬광');const el=$('#gcFlash');el.style.setProperty('--fc',top===3?'#fff3c4':RCOL[top]);el.classList.add('on');$('#gcSeal').classList.add('go');$('#gcStreak').style.opacity=0;});
    T(1950,()=>{$('#gcStage').hidden=false;$('.gc .skipb').hidden=true;if(res.length===1)T(600,()=>revealCard(0));});
  }

  static studioHTML(){
    const s=P().settings,w=G.world,nb=G.lib.filter(l=>l.kind==='bg'),np=G.lib.filter(l=>l.kind==='prop'),nx=G.lib.filter(l=>l.kind==='sfx');
    const done=a=>a.filter(l=>l.img||l.audio).length, pj=Core.PJ();
    const ST=[['practice','연습장','🎯','허수아비로 파티·스킬 시험'],['game','게임','🎮',G.meta.title],['player',System.T('player'),'🙋',P().player||System.T('player')],['view','화면·연출','🖼','타이틀·로비·컷인'],['sound','소리','🔊',(Core.SND().fishKey?'목소리 ✓':'')+(Core.SND().elKey?' 배경음 ✓':'')||'설정 안 함'],['lib','자료실','🗂','배경·소품·적'],['text','글 AI','✍',System.AIP().list.length?System.AIP().list.length+'개 연결':'없음'],['img','그림 AI','🎨',Art.imgProvider()==='comfy'?'ComfyUI':(Core.naiCfg().key?'NovelAI ✓':'없음')],['live','시즌 운영','📅',v2CurrentGeneration()+'세대 · '+(P().live.on.season?'시즌 켜짐':'꺼짐')],['conn','연동','🔗',System.PCS()?'PC 서버':System.syReady()?'GitHub':'없음'],['data','데이터','💾','백업·초기화'],['info','앱 정보','ℹ','업데이트·공유·피드백']].filter(x=>!System.playMode()||!PLAY_HIDE_ST.includes(x[0]));
    const SEC={
    practice:`<div class="panel"><h3>연습장</h3><p class="muted">허수아비를 세워놓고 스킬을 시험할 수 있어요. 파티 구성과 공격 방식·이펙트를 확인하세요. 허수아비는 반격하지 않고 체력이 무제한이며, 행동력 소모와 보상은 없습니다.</p><button class="btn" data-act="v2practice">연습장 열기</button></div>`,
    game:`<div class="panel"><h3>플레이 모드 ${System.playMode()?'<span class="badge">켜짐</span>':''}</h3>${System.subLocked()?`<p class="muted" style="margin:0 0 10px">구독한 게임이라 <b>플레이 전용</b>이에요. 스토리·이벤트·캐릭터는 만든 사람이 업데이트하고, 이 기기에서는 시즌·새 이벤트 같은 자체 업데이트도 하지 않아요. AI 키 없이 그대로 즐기면 돼요. 직접 고치고 이어서 만들고 싶으면 아래 '구독 끊기'를 하세요.</p>`:`<p class="muted" style="margin:0 0 10px">켜면 새 캐릭터·스토리 만들기, 편집, 그림 다시 그리기, 글·그림 AI 설정 같은 메뉴를 숨기고 게임만 해요. 이미 연결해 둔 AI는 그대로 써요(${System.T('talk')}·라이브 운영 등). 언제든 여기서 다시 끌 수 있어요.</p>`}<div class="row">${System.subLocked()?'':`<button class="btn sm ${System.playMode()?'ghost':''}" data-act="playmode">${System.playMode()?'플레이 모드 끄기':'플레이 모드 켜기'}</button>`}${System.playMode()?`<button class="btn sm ghost" data-act="pj-open">게임 목록 (${pj.list.length})</button>`:''}</div></div>
    ${AcquireView.conSettingsPanel()}
    ${ExpeditionView.exSettingsPanel()}
    ${LiveOpsView.auditPanel()}
    ${RulesView.rulesPanel()}
    ${BattleView.battleSysPanel()}
    ${RulesView.balancePanel()}
    ${CharactersView.personaPanel()}
    ${WorldView.factionPanel()}
    ${StoryView.planPanel()}
    ${ArtView.assetPanel()}
    ${PromptStudioView.promptPanel()}
    <div class="panel pm-hide"><h3>게임</h3><p class="muted" style="margin:0 0 10px">지금 게임: <b>${esc(G.meta.title)}</b>. 세계관, 용어, 속성, 화면 테마를 바꾸거나, AI로 완전히 다른 가챠 게임을 새로 만들 수 있어요. 게임은 여러 개 만들어 두고 오갈 수 있어요.</p>
      <div class="row"><button class="btn sm" data-act="meta-open">게임 정의 편집</button><button class="btn sm" data-act="draft-open">AI로 새 게임 만들기</button><button class="btn sm ghost" data-act="pj-open">게임 목록 (${pj.list.length})</button></div></div>
    <div class="panel"><h3>게시·구독</h3><p class="muted" style="margin:0 0 10px">${G.meta.subscr?`구독 중인 게임이에요 · v${G.meta.subscr.ver||0}${G.meta.subscr.at?' · '+esc(new Date(G.meta.subscr.at).toLocaleDateString())+' 받음':''}. 만든 사람이 업데이트하면 켤 때 알려 줘요.`:G.meta.pub&&G.meta.pub.ver?`게시 중 · v${G.meta.pub.ver}. 새 장·이벤트를 만든 뒤 다시 게시하면 구독한 사람에게 업데이트가 가요.`:'내 게임을 GitHub 공개 저장소에 올려 다른 사람이 구독하게 하거나, 다른 사람이 게시한 게임을 주소로 받아요.'}</p>
      <div class="row">${G.meta.subscr?`<button class="btn sm" data-act="subcheck">업데이트 확인</button><button class="btn sm ghost" data-act="subcopy">구독 주소 복사</button><button class="btn sm ghost" data-act="subleave">구독 끊기</button>`:`<button class="btn sm" data-act="pubopen">🌐 게임 게시</button>`}<button class="btn sm ghost" data-act="subadd">🔗 게임 구독</button></div></div>
    <div class="panel pm-hide"><h3>스토리 기억 관리</h3><p class="muted">장별 기억·관계·도감과 최근 스토리 요청을 확인합니다. 비밀 설정이 포함되는 작가용 메뉴입니다.</p><button class="btn sm" data-sm="open">스토리 기억 관리</button></div>
    <div class="panel pm-hide"><h3>세계관: ${esc(w.name)}</h3><p style="margin:0 0 10px">${esc(w.summary)}</p><button class="btn sm ghost" data-act="world-open">세계관과 메인 플롯 편집</button></div>
    <div class="panel pm-hide"><h3>${System.T('gacha')} 규칙</h3>
      <div class="slider"><label for="r_ssr"><span>SSR 확률</span><b id="v_ssr">${s.ssr}%</b></label><input id="r_ssr" type="range" min="1" max="60" value="${s.ssr}" data-set="ssr"></div>
      <div class="slider"><label for="r_sr"><span>SR 확률</span><b id="v_sr">${s.sr}%</b></label><input id="r_sr" type="range" min="0" max="80" value="${s.sr}" data-set="sr"></div>
      <div class="slider"><label for="r_pity"><span>천장</span><b id="v_pity">${s.pity}회</b></label><input id="r_pity" type="range" min="5" max="150" value="${s.pity}" data-set="pity"></div>
      <label style="display:flex;gap:8px;align-items:center;margin-top:12px"><input type="checkbox" data-act="stamtog" ${s.stamina!==false?'checked':''}><span><b>행동력 사용</b> <span class="muted" style="font-size:.8rem">(메인·이벤트 10, 재료 던전 8 · 5분마다 1 회복 · 최대 ${STAM_MAX})</span></span></label>
      <h3 class="sec" style="margin-top:12px">획득량 배율 <span class="muted" style="font-size:.75rem">전투·소탕·파견·일일 보급 보상에 곱해요</span></h3>
      ${[['expRate','경험치 (캐릭터 경험치·재료)'],['goldRate',System.T('gold')],['gemRate',System.T('currency')]].map(([k,l])=>`<div class="slider"><label for="r_${k}"><span>${esc(l)}</span><b id="v_${k}">${s[k]||100}%</b></label><input id="r_${k}" type="range" min="50" max="500" step="10" value="${s[k]||100}" data-set="${k}"></div>`).join('')}</div>
    <div class="panel"><h3>AI 창작실</h3><div class="row"><button class="btn sm" data-act="newpu">신규 픽업</button><button class="btn sm" data-act="aichapter-open">다음 장</button><button class="btn sm" data-act="aievent-open">새 이벤트</button></div></div>`,
    player:`<div class="panel"><h3>${esc(System.T('player'))}</h3><p class="muted" style="margin:0 0 4px;font-size:.8rem">이름은 스토리·${esc(System.T('talk'))} 속 {${esc(System.T('player'))}} 자리에, 성별과 외모는 AI가 쓰는 대사·호칭에 반영돼요.</p><div id="pfWrap">${PlayerView.playerFormHTML()}</div><div class="row" style="margin-top:8px"><button class="btn sm" data-act="pfsave">저장</button></div></div>`,
    view:`<div class="panel"><h3>연출</h3>
      <div class="g2"><div><label class="f">타이틀 ${System.T('crew')}</label><select class="in" data-pset="titleChar"><option value="">자동</option>${G.chars.map(c=>`<option value="${c.id}" ${P().titleChar===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div>
      <div><label class="f">타이틀 배경</label><select class="in" data-pset="titleBg">${StoryView.bgOptions(P().titleBg)}</select></div></div>
      <div class="g2"><div><label class="f">로비 표시 (타이틀은 일러스트 우선)</label><select class="in" data-pset="lobbyMode">${CoreView.opt([['auto','자동 (포즈 → 상반신 → 스탠딩)'],['illust','일러스트 표시'],['layer','항상 배경 + 캐릭터 따로 (캐릭터만 움직임)'],['stand','항상 스탠딩 + 배경']],P().lobbyMode||'auto')}</select></div><div><label class="f">로비 캐릭터 크기</label><select class="in" data-pset="lbSize">${CoreView.opt([['fit','위 배너에 안 가리게 (기본)'],['big','크게 (머리가 가려질 수 있어요)'],['small','작게']],P().lbSize||'fit')}</select></div></div>
      <div class="g2"><div><label class="f">대본 연출 (감정 아이콘·동작·화면 효과)</label><select class="in" data-pset="vnDirect">${CoreView.opt([['auto','대본 + 대사에 맞춰 자동 감정 (기본)'],['script','대본에 쓴 것만'],['off','끄기']],P().vnDirect||'auto')}</select></div><div><label class="f">대화 무대</label><select class="in" data-pset="vnStage">${CoreView.opt([['duo','최근 두 사람 (기본)'],['single','말하는 사람만']],P().vnStage||'duo')}</select></div></div>
      <label class="f">전투 애니메이션</label><select class="in" data-pset="battleMotion">${CoreView.opt([['full','일반 — 타격 동작·투사체·스피드라인'],['reduced','간소화 — 이동과 스피드라인 생략'],['system','기기의 동작 줄이기 설정에 맞춤']],P().battleMotion||'full')}</select>
      <p class="muted" style="font-size:.8rem;margin:5px 0 12px">일반 모드는 기기의 애니메이션 배율과 별도로 전투 연출을 재생해요. 움직임을 줄이고 싶으면 간소화를 선택하세요.</p>
      <label class="f">기술 컷인 (전투에서 스킬 쓸 때)</label><select class="in" data-pset="skillCut">${CoreView.opt([['auto','직접 쓴 스킬과 컷인 그림이 있는 '+System.T('crew')+'는 크게'],['big','항상 크게 (없으면 스탠딩)'],['small','작은 띠만'],['off','끄기']],P().skillCut||'auto')}</select>
      <div class="g2"><div><label class="f">로비 배경</label><select class="in" data-pset="lobbyBg">${StoryView.bgOptions(P().lobbyBg)}</select></div>
      <div><label class="f">기본 ${System.T('gacha')} 배경</label><select class="in" data-pset="gachaBg">${StoryView.bgOptions(P().gachaBg,'기본')}</select></div></div>
      <div class="row" style="margin-top:12px"><button class="btn sm ghost" data-act="title">타이틀 보기</button><button class="btn sm ghost" data-act="opening-edit">오프닝 편집</button><button class="btn sm ghost" data-act="opening-play">오프닝 다시 보기</button></div></div>
    ${IS_NATIVE?'':`<div class="panel"><h3>아이폰·웹 연결</h3><p class="muted" style="margin:0 0 10px">웹 버전은 열 때마다 최신이에요. 일부 AI 서비스는 브라우저에서 직접 부르는 걸 막아서(CORS), 막히면 중계 서버를 거쳐요. ${System.webProxy()?'지금 중계 서버: <b>'+esc(System.webProxy())+'</b>':'중계 서버 없음'}</p>
      <label class="f" for="orient_sel">화면 방향 (휴대폰)</label><select class="in" id="orient_sel">${CoreView.opt([['auto','기기 회전 따라'],['portrait','세로로 고정'],['landscape','가로로 고정']],System.orientPref())}</select>
      <p class="muted" style="margin:4px 0 8px;font-size:.78rem">세로로 고정하면 휴대폰을 눕혀도 세로 화면으로 해요. 앱은 새 APK부터 고정돼요(지금 앱이 지원하지 않으면 알려 드려요).</p>
      <label class="f" for="desk_mode">PC 화면 (넓은 화면에서)</label><select class="in" id="desk_mode">${CoreView.opt([['wide','가로로 넓게 (PC 게임처럼, 추천 · 휴대폰은 가로로 돌려서)'],['auto','가운데 세로로 (휴대폰처럼) + 옆 안내'],['off','끄기 (창 전체를 씀)']],System.deskMode())}</select>
      <div class="row" style="margin-top:10px"><button class="btn sm" data-act="pxopen">중계 서버 설정</button>${IS_IOS&&!IS_STANDALONE?'<button class="btn sm ghost" data-act="a2hs">홈 화면에 추가하는 법</button>':''}</div></div>`}`,
    sound:`<div class="panel"><h3>소리</h3><p class="muted" style="margin:0 0 10px">${Core.SND().fishKey?'Fish Audio 연결됨':'Fish Audio 미연결'} · ${Core.SND().elKey?'ElevenLabs 연결됨':'ElevenLabs 미연결'}</p>
      <div class="row"><button class="btn sm" data-act="sndopen">소리 설정</button><button class="btn sm ghost" data-act="lib" data-k="bgm">배경음 ${done(G.lib.filter(l=>l.kind==='bgm'))}/${G.lib.filter(l=>l.kind==='bgm').length}</button><button class="btn sm ghost" data-act="lib" data-k="sfx">효과음 ${done(nx)}/${nx.length}</button><button class="btn sm ghost" data-act="bgmall">🎵 배경음 한꺼번에 작곡</button></div></div>`,
    lib:`<div class="panel"><h3>자료실</h3><p class="muted" style="margin:0 0 10px">스토리와 ${System.T('talk')}에 쓰이는 배경과 소품이에요. 이미지가 없으면 자동 생성된 풍경이 쓰여요.</p>
      <div class="row"><button class="btn sm" data-act="lib" data-k="bg">배경 ${done(nb)}/${nb.length}</button><button class="btn sm" data-act="lib" data-k="prop">소품 ${done(np)}/${np.length}</button><button class="btn sm" data-act="lib" data-k="enemy">적 ${done(G.lib.filter(l=>l.kind==='enemy'))}/${G.lib.filter(l=>l.kind==='enemy').length}</button><button class="btn sm" data-act="lib" data-k="cg">CG ${done(G.lib.filter(l=>l.kind==='cg'))}/${G.lib.filter(l=>l.kind==='cg').length}</button><button class="btn sm" data-act="lib" data-k="icon">재화 아이콘 ${done(G.lib.filter(l=>l.kind==='icon'))}/${G.lib.filter(l=>l.kind==='icon').length}</button><button class="btn sm" data-act="lib" data-k="map">작전 지도 ${done(G.lib.filter(l=>l.kind==='map'))}/${G.lib.filter(l=>l.kind==='map').length}</button><button class="btn sm" data-act="npcopen">NPC ${(G.npcs||[]).filter(x=>Characters.imgSrc(x)).length}/${(G.npcs||[]).length}</button></div></div>`,
    text:`<div class="panel"><h3>글 AI</h3>${SystemView.aiProfilesHTML()}
      <div class="row" style="margin-top:10px"><button class="btn sm" data-act="apnew">AI 추가</button><button class="btn sm ghost" data-act="apfb">실패하면 다음 AI로 ${System.AIP().fallback?'켜짐':'꺼짐'}</button><button class="btn sm ghost" data-act="ailog">🔍 AI 기록</button><button class="btn sm ghost" data-act="llmopen">생성 지침${(()=>{ const L=System.llmEff(); return L.top||L.mid||L.bot?' ✓':''; })()}</button></div></div>`,
    img:`<div class="panel"><h3>그림 AI</h3><p class="muted" style="margin:0 0 8px">${Art.imgProvider()==='comfy'?'ComfyUI '+(Core.imgReady()?'연결 설정됨':'설정 미완료'):'NovelAI '+(Core.naiCfg().key?'토큰 등록됨':'미등록')}</p><div class="row"><button class="btn sm ghost" data-act="naiopen">그림 AI 설정</button><button class="btn sm ghost" data-act="packopen">그림체 프리셋</button><button class="btn sm ghost" data-act="dsopen">🎨 캐릭터 디자인 통일${G.meta.design&&(G.meta.design.all||Object.values(G.meta.design.fac||{}).some(Boolean))?' ✓':''}</button><button class="btn sm" data-act="prepopen">그림 준비실 (${Art.drawTodo().length})</button><button class="btn sm ghost" data-act="setupopen">처음 설정 다시</button></div></div>`,
    live:`${v2SeasonGenerationHTML()}<div class="panel"><h3>시즌 운영</h3><p class="muted" style="margin:0 0 10px">앱을 켤 때 날짜를 보고 새 콘텐츠를 자동으로 만들어요. 켠 항목만큼 글 AI 요금이 들어요.</p>
      <div class="chips">${(P().live.on.season?[['season',LiveOps.cycLabel('season')+' 시즌 로테이션'],['talk',LiveOps.cycLabel('talk')+(LiveOps.cycDays('talk')>1?'마다':'')+' 새 '+System.T('talk')],['pass','매달 '+System.T('pass')+' 초기화'],['skin','시즌마다 새 '+System.T('skin')+' 상점'],['fill','빈 콘텐츠 자동 채움']]:[['season',LiveOps.cycLabel('season')+' 시즌 로테이션'],['talk',LiveOps.cycLabel('talk')+(LiveOps.cycDays('talk')>1?'마다':'')+' 새 '+System.T('talk')],['event',LiveOps.cycLabel('event')+'마다 새 이벤트'],['rerun','이벤트 복각'],['rotate',LiveOps.cycLabel('rotate')+'마다 확률 업 교체'],['pass','매달 '+System.T('pass')+' 초기화'],['chapter',LiveOps.cycLabel('chapter')+'마다 메인 다음 장'],['skin',LiveOps.cycLabel('rotate')+'마다 새 '+System.T('skin')+' 상점'],['fill','빈 콘텐츠 자동 채움']]).map(([k,l])=>`<button class="chip ${P().live.on[k]?'on':''}" data-act="livetog" data-k="${k}">${esc(l)}</button>`).join('')}</div>
      <h4 class="sec" style="margin-top:12px">운영 주기</h4>
      <div class="g2">${(P().live.on.season?['season','talk']:['talk','event','chapter','rotate']).map(k=>`<div><label class="f" for="cyc_${k}">${({season:'시즌 길이',event:'새 이벤트',chapter:'메인 다음 장',talk:'새 '+esc(System.T('talk')),rotate:'확률 업 교체 · 새 '+esc(System.T('skin'))})[k]}</label><select class="in" id="cyc_${k}" data-cyc="${k}">${CoreView.opt(LIVE_CYC[k][1].map(([d,l])=>[d,d===1?l:l+'마다']),LiveOps.cycDays(k))}</select></div>`).join('')}</div>
      <p class="muted" style="margin:4px 0 0;font-size:.78rem">주기를 바꾸면 그때부터 새로 세요. 짧을수록 글 AI 사용량이 늘어요.</p>
      ${P().live.on.season?`<p class="muted" style="margin:8px 0 0;font-size:.82rem">스토리 → 이벤트 → 캐릭터 → 복각 → 육성 시즌이 ${esc(LiveOps.cycLabel('season'))}마다 돌아가요. ${LiveOps.seasonNow()?'지금: '+esc(LiveOps.seasonMeta(LiveOps.seasonNow().type)[1])+' · ':''}<button class="linkb" data-act="seasoninfo">시즌 설정</button></p>`:''}
      <div class="row" style="margin-top:10px"><button class="btn sm" data-act="liverun">지금 업데이트 실행</button><button class="btn sm ghost" data-act="go" data-to="notice">공지 보기</button></div></div>`,
    conn:`<div class="panel"><h3>PC 서버</h3><p class="muted" style="margin:0 0 10px">${System.PCS()?`연결됨 · ${esc(System.PCS().base.replace(/^https?:\/\//,''))}${System.PCS().last?' · 마지막 저장 '+esc(new Date(System.PCS().last).toLocaleString()):''}`:'내 컴퓨터를 켜 두고 QR로 휴대폰에서 접속해요. 게임이 PC에 저장되고, PC의 ComfyUI·Ollama도 휴대폰에서 써요.'}</p>
      <div class="row">${System.PCS()?'<button class="btn sm" data-act="pcpush">PC에 저장</button><button class="btn sm ghost" data-act="pcpull">PC에서 받기</button>':''}<button class="btn sm ${System.PCS()?'ghost':''}" data-act="pcopen">${System.PCS()?'설정':'PC 서버 연결'}</button></div></div>
    <div class="panel"><h3>PC·폰 연동</h3><p class="muted" style="margin:0 0 10px">${System.syReady()?`저장소 <b>${esc(System.SY().repo)}</b> · 이 기기: ${esc(SystemView.syDevice())}${System.SY().last?' · 마지막 '+(System.SY().lastDir==='down'?'받기':'올리기')+' '+esc(new Date(System.SY().last).toLocaleString()):''}`:'내 GitHub 비공개 저장소를 거쳐 폰과 PC(웹 버전)가 같은 게임을 이어서 할 수 있어요.'}</p>
      <div class="row">${System.syReady()?'<button class="btn sm" data-act="sypush">올리기</button><button class="btn sm ghost" data-act="sypull">받기</button>':''}<button class="btn sm ${System.syReady()?'ghost':''}" data-act="syopen">${System.syReady()?'설정':'연동 설정'}</button></div></div>`,
    data:`${SystemView.backupBlocks()}<div class="panel"><h3>기타 데이터 관리</h3><p class="muted">백업은 위의 세 종류 중에서 선택하세요. 리세마라와 앱 초기화는 데이터를 지우는 기능입니다.</p><div class="row"><button class="btn sm ghost" data-act="backup">이전 텍스트 백업</button><button class="btn sm ghost" data-act="importfile">공유 팩 불러오기</button><button class="btn sm ghost" data-act="reroll0">이 게임 리세마라</button><button class="btn sm ghost" data-act="cachewipe" style="color:var(--rose)">앱 초기화</button></div></div>`,
    info:`<div class="panel"><h3>Special Thanks</h3><p class="muted" style="margin:0 0 6px;font-size:.82rem">그림체 프리셋을 나눠 주신 분들</p>${STYLE_PRESETS.filter(x=>x.by).map(x=>`<div class="ep"><span class="t"><b>${esc(x.by)}</b><span class="muted">그림체 「${esc(x.name)}」</span></span></div>`).join('')}</div>
  ${IS_NATIVE?`<div class="panel"><h3>앱 업데이트</h3><p class="muted" style="margin:0 0 10px">지금 버전: ${esc(window.__LIVE__?'온라인 업데이트 '+window.__LIVE__:'설치 버전 '+APP_BUILD)}. 새 버전이 나오면 앱이 GitHub에서 받아 와요. API 키는 이 기기에만 저장되고 어디로도 보내지 않아요(각 AI 회사 서버로 직접 요청할 때만 써요).</p>
      <div class="row"><button class="btn sm" data-act="upd-open">업데이트 설정</button><button class="btn sm ghost" data-act="updcheck">지금 확인</button></div></div>`:`<div class="panel"><h3>업데이트</h3><p class="muted" style="margin:0 0 10px">지금 버전: ${esc(APP_BUILD)}${System.onPcServer()?' · PC 서버로 실행 중':''}. 새 버전이 나오면 켤 때와 30분마다 확인해서 알려 드려요. 받기를 누르면 바로 새 버전으로 다시 열려요.</p>
      <div class="row"><button class="btn sm ghost" data-act="webupdcheck">지금 확인</button></div></div>`}
    <div class="panel"><h3>공유와 피드백</h3><p class="muted" style="margin:0 0 10px">공유팩은 .ggmpack 파일로 저장하며, 기존 JSON 공유팩도 불러올 수 있어요. 공유 팩에는 API 키, 업데이트 토큰, 진행 상황, 음성이 들어가지 않아요.</p>
      <div class="row"><button class="btn sm" data-act="shareopen">공유 팩 만들기</button><button class="btn sm ghost" data-act="importfile">공유 팩 불러오기</button><button class="btn sm ghost" data-act="fbopen">피드백 보내기</button><button class="btn sm ghost" data-act="guidecopy">친구용 안내문</button></div></div>
    <div class="panel official"><h3>공식 배포처</h3><p class="muted" style="margin:0 0 8px">이 앱은 아래 두 곳에서만 배포해요. <b style="color:var(--ink)">다른 곳에서 받은 APK나 파일은 쓰지 마세요.</b> 개조된 파일은 넣어 둔 API 키를 빼돌릴 수 있어요.</p>
      <div class="row"><button class="btn sm ghost" data-act="sylink" data-url="https://github.com/jjhk0803/gacha-game-maker/releases">안드로이드 APK (GitHub)</button><button class="btn sm ghost" data-act="sylink" data-url="https://jjhk0803.github.io/gacha-game-maker/">아이폰·PC 웹</button></div>
      <p class="muted" style="margin:8px 0 0;font-size:.78rem">© jjhk0803 · 이용 조건 CC BY-NC-ND 4.0 — 개인 사용과 원본 그대로 무료 공유는 자유, 수정본 재배포·판매는 금지. 내가 만든 게임 내용(세계관·캐릭터·그림)은 만든 사람의 것이에요. <button class="linkb" data-act="sylink" data-url="https://github.com/jjhk0803/gacha-game-maker/blob/main/LICENSE.md">자세히</button></p></div>`};
    if(!STTAB||!SEC[STTAB]) return `${pageHead('설정','SYSTEM')}<div class="st-grid">${ST.map(([k,l,ic,sub2])=>`<button class="st-tile" data-act="sttab" data-k="${k}"><i>${ic}</i><b>${esc(l)}</b><span>${esc(sub2||'')}</span></button>`).join('')}</div>`;
    const cur=ST.find(x=>x[0]===STTAB);
    return `<div class="st-head"><button class="x" data-act="sttab" data-k="" aria-label="설정으로">‹</button><b>${cur[2]} ${esc(cur[1])}</b></div>${SEC[STTAB]}`;
  }

    // 상단바 게임 이름: 한 줄로, 넘치면 글자를 줄여요(최소 0.7배, 그래도 넘치면 …)
static fitBrand(){ const el=document.querySelector('.brand .brand-t'); if(!el) return; el.style.fontSize=''; let f=1; for(let i=0;i<8&&el.scrollWidth>el.clientWidth+1&&f>0.7;i++){ f-=0.05; el.style.fontSize=f+'em'; } }

  static applyDesk(){ const W=window.innerWidth, H=window.innerHeight, land=W>H*1.15, wantW=System.deskMode()==='wide', small=Math.min(W,H)<600;
    // 휴대폰도 'PC 화면: 가로로 넓게'를 직접 고르면 가로로 돌렸을 때 PC 화면으로 보여요
    let picked=''; try{ picked=appStorage.getItem('ggm-desk')||''; }catch(e){}
    const on=System.deskMode()!=='off'&&(W>=900||(picked==='wide'&&land&&W>=600)); document.body.classList.toggle('desk',on); document.body.classList.toggle('wide',on&&wantW&&land);
    let rh=$('#rotHint'); const needRot=picked==='wide'&&small&&!land&&System.orientPref()!=='portrait';
    if(needRot&&!rh){ rh=document.createElement('div'); rh.id='rotHint'; rh.innerHTML='📱↻ PC 화면으로 보려면 휴대폰을 가로로 돌려 주세요 <button type="button" onclick="this.parentNode.remove()">닫기</button>'; document.body.appendChild(rh); } else if(!needRot&&rh) rh.remove();
    let side=$('#deskSide'); if(!on){ if(side) side.remove(); return; }
    if(!side){ side=document.createElement('aside'); side.id='deskSide'; document.body.appendChild(side); }
    side.innerHTML=`<div class="ds-logo"><i>GACHA GAME MAKER</i><b>${esc(G.meta.title)}</b><span>${esc(G.meta.sub||'')}</span></div>
      <div class="ds-keys"><h4>키보드</h4><p><kbd>1</kbd>~<kbd>5</kbd> 아래 메뉴</p><p><kbd>Space</kbd> <kbd>Enter</kbd> 대사 넘기기</p><p><kbd>Esc</kbd> 창 닫기</p><p><kbd>A</kbd> 스토리 자동 진행</p></div>
      <p class="ds-foot">설정 → 아이폰·웹 연결에서 PC 화면을 끌 수 있어요.</p>`;
    try{ const l=G.lib.find(x=>x.kind==='bg'&&x.name===P().lobbyBg), s=l&&Characters.imgSrc(l); document.body.style.setProperty('--deskbg',s?`url('${s}')`:'none'); }catch(e){}
  }

  static openMeta(){
    const m=G.meta;
    CoreView.openModal(`${head('게임 정의',`<span class="muted">이름, 용어, 속성, 테마를 바꾸면 화면 전체와 AI가 쓰는 글에 반영돼요</span>`)}
      <div class="g2"><div><label class="f" for="mt_title">게임 이름</label><input class="in" id="mt_title" value="${esc(m.title)}"></div><div><label class="f" for="mt_sub">영문 부제</label><input class="in" id="mt_sub" value="${esc(m.sub)}"></div></div>
      <label class="f" for="mt_art">이 게임 그림체 태그 (비우면 설정의 기본 그림체)</label><textarea class="in" id="mt_art" style="min-height:60px" placeholder="${esc(Core.naiCfg().styles[0].tags||STYLE_EX)}">${esc(m.artTags||'')}</textarea>
      <label class="f" for="mt_artn">이 게임 그림체 네거티브 (선택)</label><input class="in" id="mt_artn" value="${esc(m.artNeg||'')}">
      <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-act="artcopy">⇩ 지금 기본 그림체 가져오기</button><button class="btn sm ghost" data-act="artclear">비우기 (기본 그림체 따라가기)</button></div>
      <div class="g2"><div><label class="f" for="mt_theme">화면 테마</label><select class="in" id="mt_theme">${CoreView.opt([['tactical','택티컬'],['fantasy','판타지'],['neon','네온 사이버'],['pastel','파스텔 (밝은 화면)'],['noir','모노 누아르']],m.theme)}</select></div><div><label class="f" for="mt_acc">강조 색</label><input class="in" id="mt_acc" type="color" value="${esc(m.accent)}" style="height:42px;padding:4px"></div></div>
      <h3 class="sec">용어</h3><div class="g2">${Object.keys(DEFAULT_META.terms).map(k=>`<div><label class="f" for="mt_t_${k}">${TERM_LABEL[k]||k}</label><input class="in" id="mt_t_${k}" value="${esc(System.T(k))}" ${k==='abyss'?'maxlength="12"':''}></div>`).join('')}</div>
      <h3 class="sec">속성 (첫째가 둘째에, 둘째가 셋째에, 셋째가 첫째에 강해요)</h3>
      ${m.elems.map((e,i)=>`<div class="g2"><div><label class="f">속성 ${i+1}</label><input class="in" id="mt_e${i}" value="${esc(e.n)}" maxlength="4"></div><div><label class="f">색</label><input class="in" id="mt_c${i}" type="color" value="${esc(e.c)}" style="height:42px;padding:4px"></div></div>`).join('')}
      <h3 class="sec">역할 이름</h3><div class="g4">${['atk','def','sup'].map(k=>`<div><label class="f">${{atk:'공격형',def:'방어형',sup:'지원형'}[k]}</label><input class="in" id="mt_r_${k}" value="${esc(m.roles[k])}"></div>`).join('')}</div>
      <label class="f" for="mt_logo">타이틀 로고 모양</label><div class="row"><select class="in" id="mt_logo" style="flex:1">${CoreView.opt(LOGO_STYLES,m.logoStyle||'auto')}</select><button class="btn sm ghost" type="button" data-act="logoprev">미리 보기</button></div>
      <h3 class="sec">스토리</h3><label class="f" for="mt_tone">분위기 (AI가 쓰는 글의 톤, 비우면 정하지 않음)</label><input class="in" id="mt_tone" value="${esc(m.tone||'')}" placeholder="예: 진지하고 비장하게 / 가볍고 유쾌하게">
      <label class="f" for="mt_cast">등장인물 성별 <span class="muted" style="font-size:.75rem">(앞으로 새로 만드는 ${esc(System.T('crew'))}·인물에 적용)</span></label><select class="in" id="mt_cast">${CoreView.opt([['','AI가 정하기 (키워드에 맞게)'],['f','여성만'],['m','남성만'],['mix','여성 + 남성 혼성']],m.castSex||'')}</select>${SystemView.storyFormHTML(G.meta.story||{})}
      <h3 class="sec">재료 던전 이름</h3><div class="g2">${m.farms.map((f,i)=>`<div><label class="f">${{exp:'경험치',gold:'일반 재화',wmat:'스킬 강화 재료',core:'승급(Lv1~70) 재료'}[f.key]||f.key}</label><input class="in" id="mt_f${i}" value="${esc(f.name)}"></div>`).join('')}</div>
      <div class="row" style="margin-top:16px"><button class="btn" data-act="metasave">저장</button></div>`);
  }

  static async pcPush(silent,force){
    if(PCJOB||!System.PCS()) return; PCJOB=true; try{
      if(!silent) SystemView.syBar('PC에 저장하는 중…'); await Core.flush();
      const S0=await System.pcApi('/api/store/state',{ok404:true}), pc0=System.PCS(), other=!!(S0&&S0.at>(pc0.last||0)+1000&&(S0.devId?S0.devId!==System.devId():S0.device!==SystemView.syDevice()));
      if(S0&&!force&&(other||System.freshGame())){
        if(silent){ if(!PCWARNED){ PCWARNED=true; CoreView.toast(other?'PC에 다른 기기의 더 새 진행이 있어서 자동 저장을 멈췄어요. 설정 → PC 서버에서 받기를 눌러 주세요':'이 기기의 게임이 아직 시작 전이라 PC의 저장을 덮어쓰지 않았어요'); } return; }
        PCJOB=false; SystemView.syBar('');
        CoreView.openModal(SystemView.pcConflictHTML(other,S0)); return; }
      const have=new Set(((await System.pcApi('/api/store/list'))||{}).blobs||[]), idx=System.syIdx(), keys=await System.idbKeys(), bin={}, types={};
      for(const k of keys){ const b=await Core.idbGet(k); if(!b||!(b instanceof Blob)) continue; types[k]=b.type||''; const ent=idx[k]; let h;
        if(ent&&ent.size===b.size&&ent.hash) h=ent.hash; else { h=await System.shaHex(await b.arrayBuffer()); idx[k]={hash:h,size:b.size}; } bin[k]=h;
        if(!have.has(h)){ const ack=await System.pcApi('/api/store/blob/'+h,{method:'POST',body:{content:System.bytesToB64(new Uint8Array(await b.arrayBuffer()))}});if(ack?.ok!==true)throw Error('PC 자료 저장 완료를 확인하지 못했습니다');have.add(h); } }
      System.saveSyIdx(idx);
      let ls={}; System.syLsKeys(true).forEach(k=>{ const v=System.syLsValue(k); if(v!=null) ls[k]=v; }); ls=System.lsHoldMerge(ls,S0&&S0.ls);
      const state={v:1,at:Date.now(),baseAt:S0?.at||0,device:SystemView.syDevice(),devId:System.devId(),build:APP_BUILD,ls,bin,types};
      const ack=await System.pcApi('/api/store/state',{method:'POST',body:state});if(ack?.ok!==true)throw Error('PC 진행 저장 완료를 확인하지 못했습니다');
      const o=System.PCS(); o.last=state.at; o.localAt=G.prog.savedAt||Date.now(); delete o.restored; System.setPCS(o); PCWARNED=false; if(!silent) CoreView.toast('PC에 저장했어요'); return true;
    }catch(e){ if(!silent) CoreView.toast('PC 저장 실패. '+System.syErr(e)); } finally{ PCJOB=false; SystemView.syBar(''); }
  }

  static async syPush(force){
    const o=System.SY(); if(!System.syReady()){ SystemView.openSync(); return; } if(SYJOB){ CoreView.toast('동기화 중이에요'); return; }
    SYJOB='push'; try{
      SystemView.syBar('클라우드 확인 중…'); await Core.flush();
      const R=await System.syRemote(o);
      if(!force&&R.state&&R.state.at>(o.last||0)&&R.state.device!==SystemView.syDevice()){ SystemView.syBar(''); SYJOB=null;
        CoreView.openModal(SystemView.syConflictHTML(R)); return; }
      const idx=System.syIdx(), keys=await System.idbKeys(), bin={}, types={};
      let i=0; for(const k of keys){ i++; if(i%10===0) SystemView.syBar(`그림 확인 ${i}/${keys.length}`);
        const b=await Core.idbGet(k); if(!b||!(b instanceof Blob)) continue; types[k]=b.type||'';
        const ent=idx[k]; if(ent&&ent.size===b.size&&ent.hash){ bin[k]=ent.hash; continue; }
        const h=await System.shaHex(await b.arrayBuffer()); idx[k]={hash:h,size:b.size}; bin[k]=h; }
      System.saveSyIdx(idx);
      const need=[...new Set(Object.values(bin))].filter(h=>!R.paths['sync/b/'+h]); let entries=[];
      const byHash={}; Object.entries(bin).forEach(([k,h])=>{ byHash[h]=byHash[h]||k; });
      const br=o.branch||'main'; let hd=R.head, baseTree=R.treeSha, committing=null, done=0, nextAt=0;
      const pace=async()=>{ const now=Date.now(), t=Math.max(now,nextAt); nextAt=t+850; if(t>now) await wait(t-now); };
      const commitPart=async(part,msg)=>{const committed=await System.ghCommitFiles({...o,branch:br},{head:hd,treeSha:baseTree},part,msg);hd=committed.head;baseTree=committed.treeSha;};
      const flushPart=async()=>{ if(committing) return committing; if(!entries.length) return; const part=entries; entries=[]; committing=commitPart(part,`sync 그림 ${done}/${need.length}`).catch(e=>{ entries=part.concat(entries); throw e; }).finally(()=>{ committing=null; }); return committing; };
      await System.ghUploadPool(need,async h=>{const b=await Core.idbGet(byHash[h]);if(!b)throw Error('올릴 자료 파일을 찾지 못했습니다');await pace();const r=await System.ghCreateBlob(o,b,`자료 ${done+1}/${need.length}`);entries.push({path:'sync/b/'+h,mode:'100644',type:'blob',sha:r.sha});done++;SystemView.syBar(`자료 올리는 중 ${done}/${need.length}`);if(entries.length>=40)await flushPart();});if(committing)await committing;
      const withKeys=!!o.keys; let ls={}; System.syLsKeys(withKeys).forEach(k=>{ const v=System.syLsValue(k); if(v!=null) ls[k]=System.syStrip(k,v,withKeys); }); ls=System.lsHoldMerge(ls,R.state&&R.state.ls);
      const state={v:1,at:Date.now(),device:SystemView.syDevice(),devId:System.devId(),build:APP_BUILD,ls,bin,types};
      SystemView.syBar('게임 진행 저장하는 중…');
      const sb=await System.ghCreateBlob(o,new Blob([JSON.stringify(state)]),'진행 정보');
      entries.push({path:'sync/state.json',mode:'100644',type:'blob',sha:sb.sha});
      await commitPart(entries,`sync ${state.device} ${new Date(state.at).toISOString()}`); entries=[];
      const o2=System.SY(); o2.last=state.at; o2.lastDir='up'; o2.localAt=G.prog.savedAt||Date.now(); System.saveSY(o2);
      CoreView.toast(`클라우드에 올렸어요${need.length?' · 새 파일 '+need.length+'개':''}`); return true;
    }catch(e){ CoreView.toast('올리기 실패. '+System.syErr(e)+' 중간까지 올린 그림은 저장돼 있어서, 다시 누르면 이어서 올려요.'); }
    finally{ SYJOB=null; SystemView.syBar(''); if(tab==='studio') Challenge.render(); }
  }

  static async pubUpload(notes,btn){ const P0=System.PUB(); if(!P0.token||!/^[\w.-]+\/[\w.-]+$/.test(String(P0.repo||'').trim())){ CoreView.toast('토큰과 저장소(주인/이름)를 넣어 주세요'); return; } if(PUBJOB){ CoreView.toast('이미 게시하는 중이에요'); return; }
    const o={token:P0.token,repo:P0.repo.trim(),branch:P0.branch||'main'}, M=System.pubMeta(), dir='games/'+M.slug, done=btn?CoreView.busy(btn):()=>{}; PUBJOB=true;
    const st=m=>{ SystemView.syBar(m); if(btn&&btn.isConnected) CoreView.say(btn,m); };
    try{ st('저장소 확인 중…'); await Core.flush();
      const ref=await System.ghEnsureBranch(o);
      let hd=ref.object.sha; const cm0=await System.gh(o,'/git/commits/'+hd), tree0=await System.gh(o,'/git/trees/'+cm0.tree.sha+'?recursive=1'), have=new Set((tree0.tree||[]).filter(x=>x.type==='blob').map(x=>x.path));
      const game=Characters.pubContent(), objs=Core.imgObjsOf(game).filter(x=>x.img), imap={}, byHash={}, idx=System.syIdx(); let i=0;
      for(const x of objs){ i++; if(i%10===0) st(`그림 확인 ${i}/${objs.length}`); const b=await System.idbGetNS(x.id); if(!b){ x.img=null; continue; } const k=IMGNS+x.id, e=idx[k]; let h=e&&e.size===b.size&&e.hash; if(!h){ h=await System.shaHex(await b.arrayBuffer()); idx[k]={hash:h,size:b.size}; } imap[x.id]=h; byHash[h]=byHash[h]||b; x.img={idb:true}; }
      System.saveSyIdx(idx); game.images=imap;
      const need=Object.keys(byHash).filter(h=>!have.has(dir+'/b/'+h)), entries=[]; let done=0, nextAt=0, qi=0;
      const pace=async()=>{ const now=Date.now(), t=Math.max(now,nextAt); nextAt=t+850; if(t>now) await wait(t-now); };
      await System.ghUploadPool(need,async h=>{await pace();const r=await System.ghCreateBlob(o,byHash[h],`그림 ${done+1}/${need.length}`);entries.push({path:dir+'/b/'+h,mode:'100644',type:'blob',sha:r.sha});done++;st(`그림 올리는 중 ${done}/${need.length}`);});
      const ver=M.ver+1, man={app:'gacha-game-maker',kind:'pub',v:1,title:G.meta.title,sub:G.meta.sub||'',ver,at:Date.now(),build:APP_BUILD,notes:String(notes||'').slice(0,2000),images:Object.keys(imap).length,chapters:game.chapters.filter(ch=>ch.kind==='main').length,events:(game.events||[]).length,chars:(game.chars||[]).length};
      game.meta.pub={slug:M.slug,ver}; st('게임 올리는 중…');
      const gb=await System.ghCreateBlob(o,new Blob([JSON.stringify(game)]),'게임 정보');
      const mb=await System.ghCreateBlob(o,new Blob([JSON.stringify(man,null,1)]),'게시 정보');
      entries.push({path:dir+'/game.json',mode:'100644',type:'blob',sha:gb.sha},{path:dir+'/manifest.json',mode:'100644',type:'blob',sha:mb.sha});
      await System.ghCommitFiles(o,{head:hd,treeSha:cm0.tree.sha},entries,`${G.meta.title} v${ver}`);
      M.ver=ver; M.at=man.at; M.repo=o.repo; M.branch=o.branch; Core.mark('meta');
      CoreView.openModal(SystemView.pubDoneHTML(ver,o,dir,need)); }
    catch(e){ CoreView.toast('게시 실패. '+System.syErr(e)); }
    finally{ PUBJOB=null; SystemView.syBar(''); done(); } }

  static syDevice(){ const o=System.SY(); return o.device||(IS_NATIVE?'안드로이드 폰':IS_IOS?'아이폰':document.body.classList.contains('desk')?'PC':'브라우저'); }

  static syBar(t){ let el=$('#syBar'); if(!t){ if(el) el.remove(); return; } if(!el){ el=document.createElement('div'); el.id='syBar'; el.className='prepchip'; document.body.appendChild(el); } el.innerHTML=`<b>☁ ${esc(t)}</b>`; }

    /* PC 저장 덮어쓰기 확인 창 내용(View) */
static pcConflictHTML(other,S0){ return `${head(other?'PC에 더 새 진행이 있어요':'PC의 저장을 덮어쓸까요?')}<p>${other?`<b>${esc(S0.device||'다른 기기')}</b> · ${esc(new Date(S0.at).toLocaleString())}에 저장한 진행이 PC에 있어요. 이 기기의 게임으로 올리면 그 진행을 덮어써요.`:'이 기기의 게임은 아직 시작하지 않은 샘플 게임이에요. 올리면 PC에 저장된 게임을 덮어써요.'}</p><div class="row" style="margin-top:12px"><button class="btn" data-act="pcpullgo">PC의 게임 받기</button><button class="btn ghost" data-act="pcpushf">그래도 올리기</button></div>`; }

    // Download to staging; failed or incomplete transfers never replace live images or game records.
static async syncStageMedia(S,load,prefix){
   if(!S||!S.ls||typeof S.ls!=='object'||!S.bin||typeof S.bin!=='object')throw Error('받은 동기화 데이터 형식이 올바르지 않습니다');
   const idx=System.syIdx(),todo=[];for(const[k,h]of Object.entries(S.bin)){if(!/^[a-f0-9]{64}$/i.test(h))throw Error('자료 해시 정보가 올바르지 않습니다');if(idx[k]?.hash!==h||!(await Core.idbGet(k)))todo.push([k,h]);}
   let n=0;await System.ghUploadPool(todo,async([k,h])=>{const bytes=await load(k,h);if(!bytes)throw Error('자료를 받지 못했습니다: '+k);if(await System.shaHex(bytes)!==h)throw Error('받은 자료의 해시가 다릅니다: '+k);const blob=new Blob([bytes],{type:S.types?.[k]||''});await appStorage.stage(prefix+k,{key:k,global:true,blob});idx[k]={hash:h,size:blob.size};SystemView.syBar(`자료 받는 중 ${++n}/${todo.length}`);});return idx;
  }

  static async pcStart(){
    const pc=System.PCS(); if(!pc) return; if(window.__BOOTSYNC){ setTimeout(SystemView.pcStart,1500); return; }
    try{ const S=await System.pcApi('/api/store/state',{ok404:true});
      if(window.__PC_NEW&&!S){ CoreView.openModal(`${head('PC 서버에 연결됐어요')}<p>이제 게임 진행과 그림이 PC(ggm-data 폴더)에 저장돼요. 이 기기의 게임을 PC로 올려 둘까요?</p><div class="row" style="margin-top:12px"><button class="btn" data-act="pcpush">PC에 저장</button><button class="btn ghost" data-act="close">나중에</button></div>`); return; }
      if(pc.restored&&S){ SystemView.pcPush(true,true); return; } // 백업에서 되살린 게임은 PC에도 바로 다시 저장
      const other=S&&(S.devId?S.devId!==System.devId():S.device!==SystemView.syDevice());
      if(S&&S.at>(pc.last||0)&&other&&System.freshGame()&&!LK.locked&&!$('#modal').querySelector('[data-act=pcpullgo]')){ if(!System.bootPullOk()) return; CoreView.toast('PC에 저장된 게임을 받아 올게요'); SystemCtl.pcPull(); return; }
      if(S&&S.at>(pc.last||0)&&other){ const show=()=>{ if(!$('#modal').hidden||!$('#ov').hidden&&!$('#ov').querySelector('.title')) return setTimeout(show,2500);
          CoreView.openModal(`${head('PC에 더 새 게임이 있어요')}<p><b>${esc(S.device||'다른 기기')}</b> · ${esc(new Date(S.at).toLocaleString())}</p><div class="row" style="margin-top:12px"><button class="btn" data-act="pcpull">받기</button><button class="btn ghost" data-act="close">나중에</button></div>`); }; show(); }
    }catch(e){ CoreView.toast('PC 서버에 연결하지 못했어요. PC에서 서버 창이 켜져 있는지 확인해 주세요'); }
  }

  static openPcSet(lost){ const pc=System.PCS();
    CoreView.openModal(`${head('PC 서버',`<span class="muted">내 컴퓨터를 저장소·AI 중계로 쓰기</span>`)}
      ${lost?`<div class="panel" style="border-color:var(--gold);margin-bottom:10px"><b>PC 서버에 다시 연결해 주세요</b><p class="muted" style="margin:6px 0 0">이 주소는 PC 서버인데 연결 키가 없어서 이 기기의 빈 게임으로 열렸어요. PC 화면의 QR을 다시 찍거나, QR 주소(끝에 ?pc=… 가 붙은 주소)를 아래에 붙여 넣으면 PC에 저장된 게임을 받아 와요.${IS_IOS?' 아이폰은 홈 화면 앱과 Safari의 저장 공간이 따로라서, 홈 화면 아이콘으로 열면 이렇게 될 수 있어요.':''}</p></div>`:''}
      <p class="muted">PC에서 <b>PC서버-시작.bat</b>을 켜면 QR이 떠요. 휴대폰으로 찍으면 연결되고, 게임이 PC에 저장돼요. 내 PC의 ComfyUI·Ollama 주소(127.0.0.1)도 그대로 쓸 수 있어요.</p>
      <label class="f" for="pc_link">PC 서버 주소 (QR 주소를 붙여 넣기)</label><input class="in" id="pc_link" value="${pc?esc(pc.base+'/?pc='+pc.key):''}" placeholder="https://xxxx.trycloudflare.com/?pc=...">
      <label style="display:flex;gap:8px;margin-top:10px"><input type="checkbox" id="pc_auto" ${!pc||pc.auto!==false?'checked':''}><span>자동으로 PC에 저장 (저장할 때마다 몇 초 안에 · PC의 data/게임/종류.json)</span></label>
      <label style="display:flex;gap:8px;margin-top:6px"><input type="checkbox" id="pc_lock" ${!pc||pc.lock!==false?'checked':''}><span>한 번에 한 기기만 (다른 기기에서 하면 여기는 멈추고, 넘겨받을 때 진행을 이어받아요)</span></label>
      <label style="display:flex;gap:8px;margin-top:6px"><input type="checkbox" id="pc_pxoff" ${System.proxyOff()?'checked':''}><span>AI 요청은 PC를 거치지 않고 직접 보내기 <span class="muted" style="font-size:.78rem">(PC와 같은 기기에서 쓸 때 더 빨라요. 휴대폰에서 PC의 로컬 AI를 쓰거나 웹에서 막히는 서비스가 있으면 끄세요)</span></span></label>
      <div class="row" style="margin-top:12px"><button class="btn" data-act="pcsave">연결</button>${pc?'<button class="btn ghost" data-act="pcoff">연결 해제</button>':''}</div>
      ${pc?`<div class="row" style="margin-top:8px"><button class="btn sm" data-act="pcpush">지금 PC에 저장</button><button class="btn sm ghost" data-act="pcpull">PC에서 받기</button></div>`:''}
      ${pc?`<div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="pchist">PC 백업에서 되살리기</button></div>`:''}
      <p class="muted" style="margin-top:10px;font-size:.8rem">PC 서버 프로그램은 공개 저장소의 gacha-game-maker-pc.zip에 있어요(Python 필요). 바깥 주소(trycloudflare)는 PC 서버를 켤 때마다 바뀌어요. 바뀌면 QR을 다시 찍으면 되고, 게임은 PC에 있으니 그대로 이어져요.</p>`); }

    // PC 서버의 ggm-data/history에 남은 저장 백업(최근 20번 + 크게 줄어들기 전 저장)에서 되살리기
static async openPcHist(){ let L=null; try{ L=await System.pcApi('/api/store/history',{ok404:true,timeout:20000}); }catch(e){ CoreView.toast('PC 서버에 연결하지 못했어요. '+System.syErr(e)); return; }
    if(!L||!Array.isArray(L.items)){ CoreView.openModal(`${head('PC 백업')}<p>지금 켜 둔 PC 서버 프로그램이 예전 버전이라 백업 목록을 볼 수 없어요.</p><p class="muted">Releases의 gacha-game-maker-pc.zip을 새로 받아 덮어쓴 뒤 다시 켜 주세요(ggm-data 폴더는 그대로 두면 돼요). 그 전까지는 PC의 ggm-data/history 폴더에 있는 state-날짜.json을 state.json으로 바꿔 넣으면 그 시점으로 돌아가요.</p><div class="row" style="margin-top:12px"><button class="btn" data-act="close">닫기</button></div>`); return; }
    const kb=n=>n>1048576?(n/1048576).toFixed(1)+'MB':Math.max(1,Math.round(n/1024))+'KB';
    CoreView.openModal(`${head('PC 백업에서 되살리기',`<span class="muted">PC에 저장할 때마다 남겨 둔 기록이에요</span>`)}
      <p class="muted" style="margin:0 0 8px">게임이 초기화됐거나 진행이 사라졌다면, 사라지기 전 시간의 백업을 고르세요. 용량이 크게 줄어든 저장 바로 앞의 백업은 따로 오래 남겨 둬요(★).</p>
      <div class="mlist">${L.items.length?L.items.map(x=>`<div class="mrow" style="display:flex;gap:8px;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line)"><div style="min-width:0"><b>${x.keep?'★ ':''}${esc(new Date(x.at||0).toLocaleString())}</b><div class="muted" style="font-size:.8rem">${esc(x.device||'')} · ${esc((x.games||[]).join(', ')||'게임')} · ${kb(x.size||0)}</div></div><button class="btn sm" data-act="pchistgo" data-id="${esc(x.name)}">되살리기</button></div>`).join(''):'<p class="muted">아직 백업이 없어요.</p>'}</div>`); }

    /* 올리기·받기·시작할 때 확인·설정 화면 */
  /* 다른 기기에 더 새 데이터가 있을 때 창 내용(View) */
static syConflictHTML(R){ return `${head('다른 기기에 더 새 데이터가 있어요')}<p><b>${esc(R.state.device||'다른 기기')}</b>에서 ${esc(new Date(R.state.at).toLocaleString())}에 올린 데이터가 있어요. 그대로 올리면 그 데이터를 덮어써요.</p><div class="row" style="margin-top:12px"><button class="btn" data-act="sypull">그 데이터 받기</button><button class="btn ghost" data-act="sypushf">그래도 올리기</button></div>`; }

  static async syCheckOnStart(){
    const o=System.SY(); if(!System.syReady()||o.auto===false) return; if(window.__BOOTSYNC){ setTimeout(SystemView.syCheckOnStart,1500); return; }
    try{ const R=await System.syRemote(o); const S=R.state; if(!S||S.at<=(o.last||0)||S.device===SystemView.syDevice()) return;
      const localChanged=(G.prog.savedAt||0)>(o.localAt||0)+5000&&o.last;
      const show=()=>{ if(!$('#modal').hidden||!$('#ov').hidden) return setTimeout(show,2500);
        CoreView.openModal(`${head('다른 기기의 새 데이터가 있어요')}<p><b>${esc(S.device||'다른 기기')}</b> · ${esc(new Date(S.at).toLocaleString())}</p>${localChanged?'<p style="color:var(--rose)">이 기기에도 아직 올리지 않은 진행이 있어요. 받으면 이 기기의 진행은 덮어써져요.</p>':''}<div class="row" style="margin-top:12px"><button class="btn" data-act="sypull">받기</button><button class="btn ghost" data-act="close">나중에</button></div>`); };
      show(); }catch(e){ Core.quietErr(e,'syCheckOnStart'); }
  }

  static openSync(){
    const o=System.SY();
    CoreView.openModal(`${head('PC·폰 연동',`<span class="muted">내 GitHub 비공개 저장소에 게임을 올리고 받아요</span>`)}
      <ol class="a2hs"><li><button class="linkb" data-act="sylink" data-url="https://github.com/new?name=ggm-save&visibility=private">GitHub에서 비공개 저장소 만들기</button> (이름 예: ggm-save, <b>Private</b>)</li>
      <li><button class="linkb" data-act="sylink" data-url="https://github.com/settings/personal-access-tokens/new">토큰 만들기</button> → Repository access: <b>Only select repositories</b>에서 그 저장소만 → Permissions의 <b>Contents: Read and write</b> → 만들기</li>
      <li>아래에 <b>아이디/저장소이름</b>과 토큰을 넣고, 다른 기기에도 똑같이 넣어요.</li></ol>
      <label class="f" for="sy_repo">저장소</label><input class="in" id="sy_repo" value="${esc(o.repo||'')}" placeholder="내아이디/ggm-save">
      <label class="f" for="sy_tok">토큰</label><input class="in" id="sy_tok" type="password" autocomplete="off" value="${esc(o.token||'')}" placeholder="github_pat_...">
      <label class="f" for="sy_dev">이 기기 이름</label><input class="in" id="sy_dev" value="${esc(SystemView.syDevice())}">
      <label style="display:flex;gap:8px;margin-top:10px"><input type="checkbox" id="sy_auto" ${o.auto!==false?'checked':''}><span>켤 때 다른 기기의 새 데이터가 있으면 알려 주기</span></label>
      <label style="display:flex;gap:8px;margin-top:6px"><input type="checkbox" id="sy_up" ${o.autoUp?'checked':''}><span>앱을 나갈 때 자동으로 올리기</span></label>
      <label style="display:flex;gap:8px;margin-top:6px"><input type="checkbox" id="sy_lock" ${o.lock!==false?'checked':''}><span>한 번에 한 기기만 (다른 기기에서 하면 여기는 멈추고, 나갈 때 자동으로 올려요)</span></label>
      <label style="display:flex;gap:8px;margin-top:6px"><input type="checkbox" id="sy_keys" ${o.keys?'checked':''}><span>AI·그림·목소리 키도 같이 옮기기 <span class="muted" style="font-size:.8rem">(비공개 저장소일 때만 켜세요)</span></span></label>
      <p class="muted" style="margin:8px 0 0;font-size:.82rem">게임 진행, 만든 게임들, 그림·음악·목소리가 올라가요. 그림은 바뀐 것만 올려서 두 번째부터는 빨라요. 토큰은 이 기기에만 저장돼요.</p>
      <div class="row" style="margin-top:14px"><button class="btn" data-act="sysave">저장하고 연결 확인</button></div>
      ${System.syReady()?`<div class="row" style="margin-top:8px"><button class="btn sm" data-act="sypush">지금 올리기</button><button class="btn sm ghost" data-act="sypull">받기</button><button class="btn sm ghost" data-act="syoff">연동 해제</button></div>`:''}`);
  }

    /* GitHub 연결 확인 뒤 창(View): 다른 기기가 올린 데이터가 있으면 받기/올리기를 고르고, 없으면 지금 올릴지 물음 */
static openSyLinked(st){ if(st) CoreView.openModal(`${head('연결됐어요')}<p>클라우드에 <b>${esc(st.device)}</b>에서 ${esc(new Date(st.at).toLocaleString())}에 올린 데이터가 있어요.</p><div class="row" style="margin-top:12px"><button class="btn" data-act="sypull">그 데이터 받기</button><button class="btn ghost" data-act="sypushf">이 기기 데이터 올리기</button></div>`);
    else CoreView.openModal(`${head('연결됐어요')}<p>이 기기의 게임을 클라우드에 올려 둘까요? 그다음 다른 기기에서 같은 저장소로 연결하고 '받기'를 누르면 돼요.</p><div class="row" style="margin-top:12px"><button class="btn" data-act="sypush">지금 올리기</button><button class="btn ghost" data-act="close">나중에</button></div>`); }

    /* 게임 게시 완료 창 내용(View) */
static pubDoneHTML(ver,o,dir,need){ return `${head('게시했어요',`<span class="muted">「${esc(G.meta.title)}」 v${ver}</span>`)}
        <p style="margin:0 0 6px">이 주소를 받은 사람은 설정 → 게임 → 🔗 게임 구독에 넣으면 이 게임을 받고, 다음 게시부터 자동으로 업데이트를 받아요.</p>
        <textarea class="in" id="pub_addr" readonly style="min-height:56px">${esc(System.subAddr(o.repo,o.branch,dir))}</textarea>
        <p class="muted" style="font-size:.78rem;margin:4px 0 0">새 그림 ${need.length}장을 올렸어요. GitHub가 파일을 퍼뜨리는 데 몇 분 걸릴 수 있어요. 저장소는 꼭 공개(Public)로 두세요.</p>
        <div class="row" style="margin-top:10px"><button class="btn" data-act="pubcopy">주소 복사</button><button class="btn ghost" data-act="close">닫기</button></div>`; }

  static openPub(){ const P0=System.PUB(), M=G.meta.pub||{}, dir=M.slug?'games/'+M.slug:'';
    CoreView.openModal(`${head('🌐 게임 게시',`<span class="muted">다른 사람이 구독하고 업데이트를 받아요</span>`)}
      <p class="muted" style="margin:0 0 8px;font-size:.82rem">내 GitHub <b>공개</b> 저장소에 이 게임을 올려요. 진행 상황·API 키·음성은 올라가지 않아요. 새 장·이벤트를 만든 뒤 다시 게시하면 구독한 사람에게 업데이트가 가요(그 사람의 진행·보유 캐릭터는 그대로).</p>
      ${M.ver?`<div class="optbox" style="font-size:.82rem;margin:0 0 8px">지금 게시: v${M.ver} · ${M.at?new Date(M.at).toLocaleString():''}<br><span style="word-break:break-all">${esc(System.subAddr(M.repo||P0.repo||'',M.branch||P0.branch||'main',dir))}</span> <button class="linkb" type="button" data-act="pubcopy2" data-v="${esc(System.subAddr(M.repo||P0.repo||'',M.branch||P0.branch||'main',dir))}">복사</button></div>`:''}
      <label class="f" for="pb_repo">저장소 (주인/이름)</label><input class="in" id="pb_repo" placeholder="예: myname/my-gacha-games" value="${esc(P0.repo||'')}">
      <div class="g2"><div><label class="f" for="pb_branch">브랜치</label><input class="in" id="pb_branch" value="${esc(P0.branch||'main')}"></div><div><label class="f" for="pb_tok">토큰</label><input class="in" id="pb_tok" type="password" autocomplete="off" value="${esc(P0.token||'')}" placeholder="github_pat_…"></div></div>
      <p class="muted" style="margin:4px 0 0;font-size:.76rem">GitHub → Settings → Developer settings → Fine-grained tokens → 이 저장소만 · Contents: Read and write. 토큰은 이 기기에만 저장돼요(게임·공유 팩에 안 들어가요).</p>
      <label class="f" for="pb_notes">이번 업데이트 내용 (구독자에게 보여요)</label><textarea class="in" id="pb_notes" placeholder="예: 3장 「그늘 아래의 안내소」 추가, 여름 이벤트 개최"></textarea>
      <div class="row" style="margin-top:12px"><button class="btn" data-act="pubgo">${M.ver?'업데이트 게시 (v'+(M.ver+1)+')':'처음 게시하기'}</button><button class="btn ghost" data-act="close">닫기</button></div>`); }

    // 받는 쪽
static openSubAdd(){ CoreView.openModal(`${head('🔗 게임 구독','<span class="muted">다른 사람이 게시한 게임을 받아요</span>')}
      <label class="f" for="sb_addr">게임 주소</label><textarea class="in" id="sb_addr" style="min-height:60px" placeholder="GGMSUB:주인/저장소/main/games/…"></textarea>
      <p class="muted" style="font-size:.78rem;margin:4px 0 0">새 게임으로 추가돼요(지금 게임은 그대로). 만든 사람이 업데이트하면 켤 때 알려 주고, 받으면 콘텐츠만 바뀌어요. 내 진행·보유 캐릭터·재화는 그대로예요.</p>
      <div class="row" style="margin-top:12px"><button class="btn" data-act="subgo">구독하기</button><button class="btn ghost" data-act="close">닫기</button></div>`); }

  static async subCheck(manual){ const S=G.meta.subscr; if(!S||!S.base) { if(manual) CoreView.toast('구독한 게임이 아니에요'); return null; }
    try{ const man=JSON.parse(await System.subGet(S.base,'manifest.json')); SUBCHK=man;
      if(!(man.ver>(S.ver||0))){ if(manual) CoreView.toast(`최신이에요 (v${S.ver||0})`); return null; }
      if(!manual&&S.skip===man.ver) return man;
      CoreView.openModal(`${head(`「${esc(man.title||S.title)}」 업데이트`,`<span class="muted">v${S.ver||0} → v${man.ver}</span>`)}
        ${man.notes?`<div class="mbody">${esc(man.notes).replace(/\n/g,'<br>')}</div>`:'<p class="muted">만든 사람이 새 버전을 올렸어요.</p>'}
        <p class="muted" style="font-size:.78rem">받으면 세계관·캐릭터·스토리·이벤트·그림이 새 버전으로 바뀌어요. 내 진행·보유 캐릭터·재화·호감도는 그대로예요.</p>
        <div class="row" style="margin-top:12px"><button class="btn" data-act="subapply">지금 받기</button><button class="btn ghost" data-act="subskip" data-v="${man.ver}">나중에</button></div>`);
      return man; }
    catch(e){ if(manual) CoreView.toast('업데이트 확인 실패. '+((e&&e.message)||'')); return null; } }

  static lkLock(l,why){ LK.locked=true; LK.wasLocked=true; clearInterval(LK.t); try{ if(B&&!B.over) clearInterval(B.timer); }catch(e){} try{ Characters.stopVoice(); }catch(e){}
    const nm=esc((l&&l.name)||'다른 기기');
    const msg={pullfailed:['최신 진행을 받지 못했어요','다른 기기의 저장을 확인하거나 받지 못해 이어하기를 잠시 멈췄어요. 연결을 확인하고 다시 시도해 주세요. 기존 진행을 덮어쓰지 않았어요.'],savefailed:['진행을 넘기지 못했어요','최신 진행을 저장하지 못해 다른 기기로 넘기지 않았어요. 연결과 저장 공간을 확인한 뒤 다시 시도해 주세요.'],other:[`${nm}에서 하는 중이에요`,'다른 기기에서 플레이하고 있어서 여기는 멈춰 뒀어요. 진행이 섞이지 않게 한 번에 한 기기만 움직여요.'],
      taken:[`${nm}에서 이어서 하고 있어요`,'그쪽으로 넘어갔어요. 여기서 다시 하려면 아래 버튼을 눌러요.'],
      giving:[`${nm}(으)로 넘겨주는 중…`,'지금까지의 진행을 저장하고 있어요. 잠깐만 기다려 주세요.'],
      gave:[`${nm}(으)로 넘겨줬어요`,'진행을 저장하고 넘겨줬어요. 여기서 다시 하려면 아래 버튼을 눌러요.']}[why]||['멈춤',''];
    let d=$('#devlock'); if(!d){ d=document.createElement('div'); d.id='devlock'; document.body.appendChild(d); }
    d.innerHTML=`<div class="dl-box"><div class="dl-ico">⏸</div><b>${msg[0]}</b><p>${msg[1]}</p>${why==='giving'?'<div class="dl-spin"></div>':`<button class="btn" data-act="lktake">여기서 이어하기</button><small>누르면 ${nm}의 진행을 저장받아 이어서 해요.</small>`}</div>`; }

  static lkUnlock(){ LK.locked=false; const d=$('#devlock'); if(d) d.remove(); try{ if(B&&!B.over&&B.timer) System.bRun(); }catch(e){} }

  static async lkTake(btn){ if(LK.busy) return; LK.busy=true; const box=$('#devlock .dl-box'); const pcm=System.LKMODE()==='pc', me=System.devId(); let ok=false, pulled=false;
    const say=(t,s)=>{ if(box) box.innerHTML=`<div class="dl-ico">↻</div><b>${t}</b><p>${s||''}</p><div class="dl-spin"></div>`; };
    try{ let l=await System.lkGet();
      if(l&&l.id&&l.id!==me&&!System.lkAway(l)){ await SystemCtl.lkOp('want'); const until=Date.now()+(pcm?25000:75000);
        while(Date.now()<until){ say('넘겨받는 중…',`${esc(l.name||'다른 기기')}에서 저장을 마치면 바로 이어져요. (${Math.ceil((until-Date.now())/1000)}초)`); await wait(pcm?2000:6000); const x=await System.lkGet(); if(x.id===me){ ok=true; break; } if(System.lkAway(x)) break; } }
      if(!ok) await SystemCtl.lkOp('claim');
      LK.claimed=true; LK.wasLocked=false; say('최신 진행을 확인하는 중…'); pulled=await SystemCtl.lkPullIfNewer(); if(!pulled){ SystemView.lkUnlock(); System.lkLoop(); CoreView.toast('여기서 이어서 해요'); }
    }catch(e){ if(box) box.insertAdjacentHTML('beforeend','<p style="color:var(--rose)">연결에 실패했어요. 잠시 뒤 다시 눌러 주세요.</p><button class="btn" data-act="lktake">다시 시도</button>'); }
    finally{ if(!pulled) LK.busy=false; } }

  static updateCheckHTML(o){const r=o.lastCheck;if(!r)return '';return `<div class="panel" data-update-check><b>최근 업데이트 확인</b><p>실행 버전: ${esc(r.running)}<br>설치 APK: ${esc(r.installed)}<br>확인한 배포본: ${esc(r.remote)}<br>필요 APK: ${esc(r.minimum||'별도 요구 없음')}</p><p class="muted">${esc(r.repo)} · ${esc(r.branch)}<br>${esc(r.result)} · ${esc(new Date(r.at).toLocaleString())}</p></div>`;}

  static openUpdSet(){
    const o=Core.LV(), hasPrev=!!o.prevBuild;
    CoreView.openModal(`${head('앱 업데이트',`<span class="muted">지금 실행 중: ${esc(window.__LIVE__?('온라인 업데이트 '+window.__LIVE__):('설치 버전 '+APP_BUILD))} · 앱 ${esc(window.__SHELL__||APP_BUILD)}</span>`)}
      <p class="muted">앱이 GitHub 공개 저장소에서 새 버전을 받아 와요. 게임 데이터와 키는 그대로 남아요. 받기 전에 바뀐 점을 보여 주고 물어봐요.</p>
      ${SystemView.updateCheckHTML(o)}
      <label class="f" for="up_mode">새 버전이 있으면</label><select class="in" id="up_mode">${CoreView.opt([['ask','물어보고 받기'],['silent','조용히 받아서 다음 실행에 적용'],['off','확인하지 않기']],o.auto===false?'off':(o.mode||'ask'))}</select>
      <details style="margin-top:10px"><summary class="muted">개발자용: 받을 저장소 바꾸기</summary>
        <label class="f" for="up_repo">저장소 (아이디/저장소이름, 비우면 기본 ${RELEASE_REPO})</label><input class="in" id="up_repo" value="${esc(o.repo||'')}" placeholder="${RELEASE_REPO}">
        <div class="g2"><div><label class="f" for="up_br">브랜치</label><input class="in" id="up_br" value="${esc(o.branch||'main')}"></div><div><label class="f" for="up_path">파일 경로</label><input class="in" id="up_path" value="${esc(o.path||'www/index.html')}"></div></div>
        <label class="f" for="up_tok">읽기 전용 토큰 (비공개 저장소일 때만)</label><input class="in" id="up_tok" type="password" autocomplete="off" value="${esc(o.token||'')}" placeholder="github_pat_...">
      </details>
      <div class="row" style="margin-top:14px"><button class="btn" data-act="upsave">저장하고 확인</button><button class="btn ghost" data-act="relnotes">배포 페이지</button></div>
      <div class="row" style="margin-top:8px">${hasPrev?'<button class="btn sm ghost" data-act="uprollback">이전 버전으로 되돌리기</button>':''}${o.on?'<button class="btn sm ghost" data-act="upbuiltin">설치 버전으로 돌아가기</button>':''}</div>`);
  }

  static openBackup(){
    CoreView.openModal(`${head('백업과 가져오기')}
      <label class="f" for="bk_out">현재 데이터</label><textarea class="in tall" id="bk_out" readonly>${esc(JSON.stringify(G))}</textarea>
      <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-act="copyfield" data-f="bk_out">복사</button></div>
      <label class="f" for="bk_in">가져올 데이터 붙여넣기</label><textarea class="in" id="bk_in"></textarea>
      <div class="row" style="margin-top:8px"><button class="btn sm" data-act="importbk">가져오기</button></div>`);
  }

  static playStory(title,script,done){
    const ls=System.parseScript(script); if(!ls.length){done&&done();return;}
    S={title,lines:ls,i:0,done,cur:null,log:[],typing:false,full:'',timer:null,autoT:null,auto:false,choice:null,pick:0};
    { const sd=Core.SND(); if(sd.voiceLang==='ja'&&sd.fishKey&&sd.voiceStory) System.jaBatch(ls.filter(L=>L.type==='say'&&!isMe(L.who)&&Economy.voiceOf(Characters.findSpeaker(L.who))).map(L=>L.text).slice(2)); } // 처음 두 줄은 바로 한 줄씩 옮겨서 기다리지 않게
    $('#ov').innerHTML=`<div class="vn" id="vn" data-act="vnnext"><div class="vn-bg" id="vnBg"></div><div class="vn-cg" id="vnCG" hidden></div><div class="vn-char dim ${P().settings.vnFull?'':'up'}" id="vnChar"></div><div class="vn-prop" id="vnProp" hidden></div><div class="vn-flash" id="vnFlash"></div><div class="vn-phone" id="vnPhone" hidden><div class="vp-top" id="vnPhName"></div><div class="vp-body" id="vnPhBody"></div></div>
      <div class="vn-top"><span class="ttl">${esc(title)}</span><button data-act="vnauto" id="vnAuto">자동</button><button data-act="vnlog">로그</button><button data-act="vnskip">건너뛰기</button></div>
      <div class="vn-place" id="vnPlace"></div>
      <div class="vn-box"><div class="vn-in"><div class="vn-name" id="vnName"></div><div class="vn-text" id="vnText"></div><div class="vn-choices" id="vnCh"></div></div><span class="vn-next" id="vnNext" hidden>▼</span></div></div>`;
    $('#ov').hidden=false;
    const fb=ls.find(l=>(l.type==='cmd'&&l.cmd==='배경')||l.type==='place'); SystemView.setVnBg(fb?(fb.arg||fb.text):'');
    CoreView.vnStep();
  }

  static setVnBg(name){const el=$('#vnBg');if(!el)return;el.setAttribute('style',name?ArtView.bgStyle(name):'background:linear-gradient(180deg,#1b1530,#2b1a33 60%,#120e1c)');el.classList.remove('fade');void el.offsetWidth;el.classList.add('fade');}

    // 무대: 최근 두 사람을 좌우로, 말하는 사람은 밝게
static vnStage(c,face){ const ch=$('#vnChar'); if(!ch) return null; S.stage=S.stage||[]; let e=S.stage.find(x=>x.c===c);
    if(!e){ e={c,face:null}; S.stage.push(e); const duo=P().vnStage!=='single'; while(S.stage.length>(duo?2:1)) S.stage.shift(); ch.innerHTML=S.stage.map(x=>`<div class="vn-slot" data-cid="${esc(x.c.id)}"></div>`).join(''); S.stage.forEach(x=>x.face=null); ch.classList.toggle('duo',S.stage.length>1); }
    S.stage.forEach(x=>{ const el=ch.querySelector(`.vn-slot[data-cid="${CSS.escape(x.c.id)}"]`); if(!el) return; if(x.c===c&&x.face!==face){ x.face=face; el.innerHTML=CoreView.art(c,'',{face,upper:true}); } if(x.face===null){ x.face=''; el.innerHTML=CoreView.art(x.c,'',{upper:true}); } el.classList.toggle('speak',x.c===c); });
    return ch.querySelector(`.vn-slot[data-cid="${CSS.escape(c.id)}"]`); }

  static async startStage(s,ctx){
    const busy=busyIds();
    const squad=(ctx.squad||P().squad).map(charById).filter(c=>c&&(!ctx.allow||ctx.allow(c))&&(ctx.kind==='practice'||Characters.own(c.id))&&(ctx.kind==='practice'||ctx.squad||!busy.has(c.id))).slice(0,4);
    if(!squad.length){CoreView.toast('편성할 수 있는 '+System.T('crew')+'이(가) 없어요. 파견 중인지 확인해 주세요.');return;}
    if(window.__v2Starting) return; window.__v2Starting=true;
    try{ if(ctx.kind==='practice')squad.forEach(v2Ensure);else await v2ReadyChars(squad);
      await v2PrepareStage(s,ctx);
    }catch(e){CoreView.toast(e.message||'전투 준비에 실패했어요');return;}finally{window.__v2Starting=false;}
    if(ctx.kind!=='practice'&&!ctx.noStam&&!Economy.stamUse(Characters.stamCost(ctx.kind||'main'))) return;
    const fbon=Core.factionBonus(squad.map(c=>c.id));
    const allies=squad.map(c=>{const st=Core.stats(c),o=Characters.own(c.id)||{wlv:0};v2EnsureEquipment(c);return {side:'a',slot:squad.indexOf(c),c,name:c.name,range:Core.charRange(c),elem:c.elem,role:c.role,maxhp:st.hp,hp:st.hp,atk:Math.round(st.atk*(1+(fbon[c.faction]||0)/100)),def:st.def,spd:st.spd,g:Math.random()*600,sh:0,mul:1,skillTraining:GGMCombat.trainingState(o.skillTraining),wlv:o.wlv||0};});
    const enemies=s.enemies.map(en=>({side:'e',name:en.name,elem:en.elem,role:en.role,boss:en.boss,maxhp:en.hp,hp:en.hp,baseHp:en.hp,atk:en.atk,def:en.def,spd:en.spd,g:Math.random()*400,turns:0,sh:0,mul:1,pattern:en.pattern,skills:en.skills}));
    if(ctx.prep) ctx.prep(allies,enemies);
    System.fieldApply(s,allies,enemies); // 전장 규칙(0485)
    B={ch:ctx.ch||null,ctx,s,allies,enemies,auto:true,speed:[1,2,3].includes(P().settings.bspeed)?P().settings.bspeed:1,timer:null,over:false,log:[],ticks:0};
    B.engine=GGMCombat.create(allies,enemies,{...v2Options(),timedImpacts:true,externalImpacts:true,seed:ctx.kind==='practice'?77:Math.floor(Math.random()*0xffffffff),maxTime:System.fieldTime(s)||119,practice:ctx.kind==='practice'});
    if(Object.keys(fbon).length) setTimeout(()=>B&&blog(Object.entries(fbon).map(([f,v])=>`${f} 소속 보너스 공격 +${v}%`).join(', ')),300);
    $('#ov').innerHTML=`<div class="bt"><div class="bt-bg" style="${ArtView.bgStyle(Core.stageBg(s)||'폐선로')}"></div>
      <div class="bt-top"><span class="ttl"><i>${ctx.kind==='practice'?'PRACTICE':ctx.kind==='farm'?'TRAINING':ctx.kind==='event'?'EVENT':ctx.kind==='raid'?'RAID · '+Math.ceil(RAID_TICKS*GGMCombat.DT)+'s':ctx.kind==='rogue'?'EXPEDITION':'OPERATION'}</i>${esc(s.title)}</span><button data-act="bauto" class="on">필살 자동</button><button data-act="bspeed" class="${(P().settings.bspeed||1)>1?'on':''}">${[1,2,3].includes(P().settings.bspeed)?P().settings.bspeed:1}x</button><button data-act="bquit">${ctx.kind==='practice'?'연습 종료':'후퇴'}</button></div>
      <div class="bt-en">${enemies.map((en,i)=>`<div data-act="bfocus" data-i="${i}" class="eu row-${en.row||'front'} ${en.boss?'boss':''} ${Art.enemyLib(en.name)&&Characters.imgSrc(Art.enemyLib(en.name))?'hasimg':''}" id="u_e${i}" style="--ec:${ECOL[en.elem]}">${CharactersView.enemyArt(en)}<b>${esc(en.name)}</b><div class="hpb"><i></i></div><div class="gg"><i></i></div></div>`).join('')}</div>
      <div class="bt-log" id="bLog"></div>
      <div class="bt-al">${allies.map((u,i)=>`<div class="au row-${u.row||'front'}" id="u_a${i}" style="--ec:${ECOL[u.elem]}"><div class="au-art">${SystemView.battleCharacterArt(u.c)}</div>${B.engine.formation?`<em class="rg" title="${RANGE[u.range]||''} · ${u.row==='back'?'후열':'전열'}">${RANGE_ICO[u.range]||''}</em>`:''}<div class="meta"><div class="hpb"><i></i></div><div class="shb"><i></i></div></div><button class="skill" data-act="skill" data-i="${i}">${esc(u.kit.ultimate.name)}<small></small><span class="v2-sp" role="progressbar" aria-label="궁극기 SP" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" ><i></i></span></button><small class="v2-active-time" style="display:block;text-align:center;font-size:10px"></small></div>`).join('')}</div>
      <div class="cutin" id="cutin"></div></div>`;
    $('#ov').hidden=false;if(ctx.kind==='practice')v2MountPractice(); v2BattleEvents(B.engine.events); SystemView.bUpdate(); System.bRun(); SystemView.sceneBgm();
  }

  static uel(u){return document.getElementById('u_'+(u.side==='a'?'a'+B.allies.indexOf(u):'e'+B.enemies.indexOf(u)));}

  static skillCut(c,name,force,host,onComplete){
   const mode=P().skillCut||'auto',wk=Characters.skinOf(c),sc=wk?.scg&&Characters.imgSrc(wk.scg)||c?.scg&&Characters.imgSrc(c.scg);if(mode==='off'&&!force)return false;
   const big=force||mode==='big'||mode==='auto'&&(SCUT_MAN||!!sc),small=!big;
   host=host||$('#ov > .bt')||document.body;const d=document.createElement('div');d.className='scut'+(small?' v4-small-cut':'')+(host===document.body?' fixed':'');d.style.setProperty('--ec',v2Ensure(c).ultimate.color||'#edf6ff');
   d.innerHTML=`<div class="scut-bg"></div><div class="scut-lines"></div><div class="scut-band">${sc?`<img class="scut-img" src="${esc(sc)}" alt="">`:`<div class="scut-st">${CoreView.art(c,'',{face:Core.cutFace(c),upper:true})}</div>`}</div><div class="scut-t"><small>${esc(c.name)}</small><b>${esc(name)}</b></div>`;
   host.appendChild(d);GGMVFX.cutIn(d,onComplete);return true;
  }

    /* 전투 진행: 화면 갱신·끝났는지 판정·끝내기 */
static bUpdate(){
    if(!B||B.presentationBusy) return;
    B.enemies.forEach((en,i)=>{const el=$('#u_e'+i);if(!el)return;el.querySelector('.hpb i').style.width=(en.hp/en.maxhp*100)+'%';el.querySelector('.gg i').style.width=Math.min(100,en.g/10)+'%';el.classList.toggle('dead',en.hp<=0);el.classList.toggle('warn',!!en.boss&&en.hp>0&&System.bossNext(en));el.classList.toggle('focus',en.status.some(s=>s.id==='order'));});
    B.allies.forEach((u,i)=>{const el=$('#u_a'+i);if(!el)return;el.querySelector('.hpb i').style.width=(u.hp/u.maxhp*100)+'%';el.querySelector('.shb i').style.width=Math.min(100,u.sh/u.maxhp*100)+'%';el.classList.toggle('dead',u.hp<=0);
      const b=el.querySelector('.skill'),wait=Math.max(0,u.ready.ultimate-B.engine.time,(u.kit.ultimate.lockout||0)-(B.engine.time-u.lastCast.ultimate)),limited=!!u.kit.ultimate.limit&&u.casts.ultimate>=u.kit.ultimate.limit,blocked=u.status.some(s=>s.type==='stun')||GGMCombat.isSilenced(u,'ultimate'),r=wait<=0&&u.sp>=GGMCombat.SP.max&&u.hp>0&&!blocked&&!limited;b.classList.toggle('ready',r);b.disabled=!r;b.querySelector('small').textContent=u.hp<=0?'전투 불능':limited?'이번 전투 사용 완료':blocked?'행동 제한':r?'궁극기 사용':u.sp<100?'SP '+Math.floor(u.sp)+'/100':`${Math.ceil(wait)}초 후`;const sp=el.querySelector('.v2-sp');if(sp){sp.setAttribute('aria-valuenow',Math.floor(u.sp));sp.querySelector('i').style.width=u.sp+'%';}el.title=u.status.map(s=>GGMCombat.EFFECTS[s.type][0]).join(', ');const at=el.querySelector('.v2-active-time');if(at)at.textContent=u.hp>0?'액티브 · '+(u.kit.active.trigger==='interval'?Math.ceil(Math.max(0,u.ready.active-B.engine.time,(u.kit.active.lockout||0)-(B.engine.time-u.lastCast.active)))+'초 후':['after_basic','on_hit','attack_hit','critical'].includes(u.kit.active.trigger)?(u.counts[u.kit.active.trigger]||0)%Math.round(u.kit.active.triggerEvery)+'/'+Math.round(u.kit.active.triggerEvery)+'회':GGMCombat.TRIGGERS[u.kit.active.trigger]):'';});
    GGMVFX.sync();
  }

    // 집중 지시
static bFocus(i){ if(!B||B.over||!B.engine) return; const u=B.enemies[i], t=B.engine.time; if(!u||u.hp<=0) return; if(t<(B.focusReady||0)){ CoreView.toast(`집중 지시는 ${Math.ceil(B.focusReady-t)}초 뒤에 다시 쓸 수 있어요`); return; }
    B.enemies.forEach(en=>{ en.status=en.status.filter(s=>s.id!=='order'); }); u.status.push({id:'order',type:'focus',value:1,until:t+8,next:Infinity,source:null,slot:'order',remaining:1,hpRemain:1});
    B.focusReady=t+12; blog(`집중 공격 지시: ${u.name}`); SystemView.bUpdate(); }
}

class SystemCtl {
  static async loadIdbImages(){
    let ch=false;
    for(const o of Core.allImgObjs()){ if(o.img&&o.img.idb&&!imgCache[o.id]){ try{const b=await System.idbGetNS(o.id); if(b){imgCache[o.id]=URL.createObjectURL(b);ch=true;}}catch(e){} } }
    if(ch){ Challenge.render(); if(document.querySelector('#ov .title')) StoryView.showTitle(); }
  }

  static async dataImport(file){
   if(BACKUP_BUSY)return;if(!appStorage.durable){CoreView.toast('이 환경은 안전한 가져오기를 지원하지 않습니다.');return;}
   BACKUP_BUSY=true;SystemView.backupBusyOverlay(true);const prefix='data-'+Date.now()+'-'+uid()+'::';let paused=false;
   try{SystemView.syBar('데이터 폴더 zip 검사 중…');const r=await System.dataReadZip(file);SystemView.syBar('');SystemView.backupBusyOverlay(false);
    if(!await appConfirm(`「${r.title}」을(를) 새 게임으로 추가할까요?\n캐릭터 ${r.game.chars.length}명 · 자료 ${r.media.length}개 · 진행 포함`))return;
    SystemView.backupBusyOverlay(true);let n=0;for(const m of r.media){await appStorage.stage(prefix+n++,{key:m.key,blob:m.blob});}
    const have=new Set(r.media.map(m=>m.key)),game=Characters.fix(r.game);
    for(const o of Core.imgObjsOf(game))if(o.img?.idb&&!have.has(o.id))o.img=null;
    for(const l of game.lib||[])if(l.audio?.idb&&!have.has('a_'+l.id))l.audio=null;
    const registry=Core.PJ(),id='g'+uid();registry.list.push({id,title:game.meta?.title||r.title});registry.active=id;
    await Core.flush();window.__NOFLUSH=1;paused=true;
    await appStorage.commitImport(prefix,System.pjKey(id),JSON.stringify(game),id+'::',{[PJKEY]:JSON.stringify(registry)});dirty.clear();clearTimeout(flushT);
    CoreView.toast('새 게임으로 추가했어요. 다시 시작할게요');setTimeout(()=>SystemView.reloadGame(),800);}
   catch(e){SystemView.syBar('');CoreView.toast('가져오기 실패: '+(e.message||e)+'. 현재 저장은 바꾸지 않았어요.');if(paused)window.__NOFLUSH=0;}
   finally{await appStorage.discard(prefix).catch(()=>{});BACKUP_BUSY=false;SystemView.backupBusyOverlay(false);}}

  static cbPlay(i){ if(!CB||CB.busy||CB.over) return; const cd=CB.hand[i]; if(!cd) return; const u=System.cbUnit(cd.o), L=Challenge.cbLead(); const cost=Core.cardCost(cd); if(cost>CB.energy) return; if(cd.k==='echo'&&!CB.last) return;
    const df=CARD_DEF[cd.k]||CARD_DEF.strike, last1=CB.hand.length===1&&Challenge.rgCount('lastcard')?2:1, m=(cd.up?df.mu:df.m)*last1, es=Core.cbAliveE(), tg=CB.enemies[CB.tgt]&&CB.enemies[CB.tgt].hp>0?CB.enemies[CB.tgt]:es[0], pops=[], ty=Challenge.cardType(cd), chain=CB.last&&Challenge.cardType(CB.last)==='atk';
    CB.energy-=cost; CB.hand.splice(i,1); CB.sel=-1; (df.x?CB.exh:CB.disc).push(cd); if(CB.disc1) CB.disc1=false; CB.played++; if(df.x) ChallengeView.cbOnExhaust(pops);
    switch(cd.k){
      case 'strike': case 'heavy': if(tg) ChallengeView.cbHitE(u,tg,m,pops); Art.sfx('타격'); break;
      case 'slash': if(tg){ ChallengeView.cbHitE(u,tg,m*(chain?1.6:1),pops); if(chain) CoreView.cbLog('연계!'); } Art.sfx('타격'); break;
      case 'twin': if(tg){ ChallengeView.cbHitE(u,tg,m,pops); if(tg.hp>0) ChallengeView.cbHitE(u,tg,m,pops); else { const t2=Core.cbAliveE()[0]; if(t2) ChallengeView.cbHitE(u,t2,m,pops); } } Art.sfx('타격'); break;
      case 'combo': if(tg) ChallengeView.cbHitE(u,tg,m*CB.played,pops); Art.sfx('타격'); break;
      case 'sweep': es.forEach(e=>ChallengeView.cbHitE(u,e,m,pops)); Art.sfx('타격'); break;
      case 'brand': if(tg){ ChallengeView.cbHitE(u,tg,m,pops); if(tg.hp>0){ const s=(cd.up?df.mku:df.mk)+Challenge.rgCount('brandplus'); tg.mark+=s; pops.push(['ce'+tg.i,'낙인 +'+s,'weak']); } } Art.sfx('타격'); break;
      case 'finisher': if(tg){ const st=tg.mark; tg.mark=0; ChallengeView.cbHitE(u,tg,m*(1+st),pops); if(st) CoreView.cbLog(`낙인 ${st}개를 터뜨렸어요!`); } Art.sfx('타격'); break;
      case 'bleed': if(tg){ ChallengeView.cbHitE(u,tg,m,pops); if(tg.hp>0){ const s=cd.up?df.blu:df.bl; tg.bleed+=s; pops.push(['ce'+tg.i,'출혈 +'+s,'weak']); } } Art.sfx('타격'); break;
      case 'guard': case 'wall': case 'taunt': { const b=System.cbBlk(u,m); CB.block+=b; pops.push(['cbLead','🛡+'+nf(b),'heal']); Art.sfx('확인'); break; }
      case 'bulwark': { const b=System.cbBlk(u,m); CB.block+=b; CB.retain=true; pops.push(['cbLead','🛡+'+nf(b)+' 보존','heal']); Art.sfx('확인'); break; }
      case 'counter': { const b=System.cbBlk(u,m); CB.block+=b; CB.counter=Math.max(CB.counter,System.cbAtkVal(u,0.6)); pops.push(['cbLead','반격 태세','heal']); Art.sfx('확인'); break; }
      case 'tactic': case 'focus': Challenge.cbDraw(m); break;
      case 'plan': Challenge.cbDraw(m); CB.disc1=true; break;
      case 'surge': CB.energy+=m; break;
      case 'aid': Core.cbHealLead(Math.round(u.maxhp*0.12*m),pops); break;
      case 'revive': Core.cbHealLead(Math.round(L.maxhp*m),pops); break;
      case 'expose': if(tg){ tg.vul+=m; pops.push(['ce'+tg.i,'취약','weak']); } break;
      case 'weaken': if(tg){ tg.weak+=m; pops.push(['ce'+tg.i,'약화','weak']); } break;
      case 'rally': CB.str+=m; pops.push(['cbLead','공격↑','heal']); break;
      case 'charge': { CB.charge=(CB.charge||0)+m; const b=System.cbBlk(u,0.5); CB.block+=b; pops.push(['cbLead','충전 '+CB.charge,'heal']); Art.sfx('확인'); break; }
      case 'release': { const k=1+(CB.charge||0); es.forEach(e=>ChallengeView.cbHitE(u,e,m*k,pops)); if(CB.charge) CoreView.cbLog(`충전 ${CB.charge}을(를) 해방!`); CB.charge=0; Art.sfx('타격'); break; }
      case 'sacrifice': { const j=CB.hand.length-1; if(j>=0){ const x=CB.hand.splice(j,1)[0]; CB.exh.push(x); CoreView.cbLog(`「${Challenge.cardName(x)}」 소멸`); ChallengeView.cbOnExhaust(pops); } Challenge.cbDraw(m); break; }
      case 'burnout': if(tg) ChallengeView.cbHitE(u,tg,m,pops); Art.sfx('타격'); break;
      case 'shieldbash': if(tg&&CB.block>0){ ChallengeView.cbHitE(u,tg,CB.block*m/Math.max(1,u.atk*CB.str),pops); } else if(tg) pops.push(['ce'+tg.i,'보호막 없음','']); Art.sfx('타격'); break;
      case 'entrench': { const b=CB.block; CB.block+=b; pops.push(['cbLead','🛡+'+nf(b),'heal']); Art.sfx('확인'); break; }
      case 'hemorrhage': if(tg&&tg.bleed){ tg.bleed*=2; pops.push(['ce'+tg.i,'출혈 '+tg.bleed,'weak']); } break;
      case 'flurry': if(tg){ ChallengeView.cbHitE(u,tg,m,pops); if(chain){ Challenge.cbDraw(1); CoreView.cbLog('연계! 카드 1장'); } } Art.sfx('타격'); break;
      case 'spread': if(tg&&tg.mark){ es.forEach(e=>{ if(e!==tg){ e.mark+=tg.mark; pops.push(['ce'+e.i,'낙인 +'+tg.mark,'weak']); } }); } break;
      case 'overdrive': CB.ult=Math.min(ULT_MAX,CB.ult+m); pops.push(['cbLead','필살 +'+m,'heal']); break;
      case 'rage': CB.rage=(CB.rage||0)+System.cbBlk(L,m); pops.push(['cbLead','투지','heal']); break;
      case 'echo': if(CB.last){ CB.hand.push(Object.assign({},CB.last)); CoreView.cbLog(`「${Challenge.cardName(CB.last)}」을(를) 복사했어요`); } break;
      case 'skill': { const sk=u.c.skill, pw=sk.power*(cd.up?df.mu:1)*last1; SystemView.skillCut(u.c,sk.name,!['off','small'].includes(P().skillCut||'auto'),$('.cb')); Art.sfx('스킬'); CoreView.cbLog(`${u.name}: ${sk.name}`); CoreView.cbSkill(u,sk,pw,tg,es,pops); break; }
    }
    if(cd.k!=='echo') CB.last=cd;
    if((ty==='atk'||(cd.k==='skill'&&['dmg','aoe'].includes(u.c.skill.kind)))&&CB.rage){ CB.block+=CB.rage; pops.push(['cbLead','🛡+'+nf(CB.rage),'heal']); }
    if(ty==='atk'||(cd.k==='skill'&&['dmg','aoe'].includes(u.c.skill.kind))){ CB.atkN++; if(L.role==='atk'&&CB.atkN%3===0){ const t2=Core.cbAliveE()[0]; if(t2){ ChallengeView.cbHitE(L,t2,0.8,pops); CoreView.cbLog(`${L.name}의 맹공!`); } } }
    CB.ult=Math.min(ULT_MAX,CB.ult+1);
    if(CB.played===4&&Challenge.rgCount('chain4')){ CB.energy+=Challenge.rgCount('chain4'); CoreView.cbLog('연쇄 반응! 에너지 +1'); }
    if(CB.played===6&&Challenge.rgCount('tempo')){ Challenge.cbDraw(2*Challenge.rgCount('tempo')); CoreView.cbLog('리듬! 카드 2장'); }
    ChallengeView.cbRender(); pops.forEach(p=>CoreView.cbFx(...p)); if(!Core.cbAliveE().length) setTimeout(()=>ChallengeCtl.cbEnd(true),500); }

    // 그림 한 장을 기기에 저장해요. 앱: Documents/가챠게임메이커/그림 (안 되면 공유하기), 웹: 다운로드(휴대폰은 공유하기로 사진 앱에 저장).
static async saveImgBlob(b,base){
    const ext=/png/.test(b.type)?'png':/jpe?g/.test(b.type)?'jpg':'webp', name=String(base||'image').replace(/[^\w가-힣-]+/g,'_').slice(0,40)+'_'+Date.now().toString(36)+'.'+ext;
    if(IS_NATIVE&&CAP&&CAP.Filesystem){ const FS=CAP.Filesystem, data=String(await blobToData(b)).split(',')[1], path='가챠게임메이커/그림/'+name;
      try{ try{ if(FS.requestPermissions) await FS.requestPermissions(); }catch(e){ Core.quietErr(e,'0550-standalone-app.js:38'); } await FS.writeFile({path,data,directory:'DOCUMENTS',recursive:true}); CoreView.toast('Documents/'+path+' 에 저장했어요'); return; }
      catch(e){ try{ await FS.writeFile({path:name,data,directory:'CACHE'}); const u=await FS.getUri({path:name,directory:'CACHE'}); if(CAP.Share){ await CAP.Share.share({title:name,files:[u.uri]}); return; } }catch(e2){ Core.quietErr(e2,'0550-standalone-app.js:39'); } CoreView.toast('그림을 저장하지 못했어요'); return; } }
    const file=new File([b],name,{type:b.type||'image/webp'});
    if(/iPhone|iPad|Android/i.test(navigator.userAgent)&&navigator.canShare&&navigator.canShare({files:[file]})){ try{ await navigator.share({files:[file],title:name}); return; }catch(e){ if(e&&e.name==='AbortError') return; } }
    System.downloadBlob(file,name); CoreView.toast('다운로드 폴더에 저장했어요 · '+name);
  }

  static async pcPull(src){
   if(PCJOB||!System.PCS())return false;PCJOB=true;PULLERR='';PULLERR_QUOTA=false;
   const prefix='sync-pc-'+uid()+'::',source=G,project=Core.PJ().active,previous=window.__NOFLUSH;let committed=false;
   try{SystemView.syBar('PC에서 받는 중…');await Core.flush();const S=src&&src.state||await System.pcApi('/api/store/state',{ok404:true});if(!S)throw Error('PC에 아직 저장된 게임이 없어요');
    const idx=await SystemView.syncStageMedia(S,async(k,h)=>{let error;for(let t=0;t<3;t++){try{const r=await System.pcApi('/api/store/blob/'+h,{binary:true,timeout:60000});if(r?.bytes)return r.bytes;throw Error('빈 자료 응답');}catch(e){error=e;if(e?.code==='bad_key')throw e;if(t<2)await wait(1500*(t+1));}}throw error;},prefix);
    if(G!==source||Core.PJ().active!==project)throw Error('작업 중 게임이 바뀌어 받기를 취소했습니다');await Core.flush();window.__NOFLUSH=true;clearTimeout(flushT);
    const w=await System.lsApply(S.ls,prefix);committed=true;dirty.clear();System.saveSyIdx(idx);
    const o=System.PCS();o.last=src&&src.restore?src.cur||Date.now():S.at;o.localAt=src&&src.restore?0:w.at;if(src&&src.restore)o.restored=1;System.setPCS(o);
    CoreView.toast('PC의 게임을 받았어요. 다시 시작할게요');setTimeout(()=>SystemView.reloadGame(),800);return true;
   }catch(e){PULLERR_QUOTA=e?.name==='QuotaExceededError';PULLERR='PC에서 받기 실패. '+System.syErr(e);CoreView.toast(PULLERR);if(committed){setTimeout(()=>SystemView.reloadGame(),800);return true;}return false;}
   finally{if(!committed)window.__NOFLUSH=previous;await appStorage.discard(prefix).catch(()=>{});PCJOB=false;SystemView.syBar('');}
  }

  static async syPull(){
   const o=System.SY();if(!System.syReady()){SystemView.openSync();return false;}if(SYJOB){CoreView.toast('동기화 중이에요');return false;}
   SYJOB='pull';PULLERR='';PULLERR_QUOTA=false;const prefix='sync-gh-'+uid()+'::',source=G,project=Core.PJ().active,previous=window.__NOFLUSH;let committed=false;
   try{SystemView.syBar('클라우드 확인 중…');await Core.flush();const R=await System.syRemote(o);if(!R.state)throw Error('클라우드에 아직 올린 데이터가 없어요');const S=R.state;
    const idx=await SystemView.syncStageMedia(S,async(k,h)=>{const sha=R.paths['sync/b/'+h];if(!sha)throw Error('클라우드 자료가 빠져 있습니다: '+k);const r=await System.gh(o,'/git/blobs/'+sha,{binary:true});if(r.bytes)return r.bytes;if(r.text){const b=JSON.parse(r.text);if(b.content)return System.b64ToBytes(b.content.replace(/\s/g,''));}throw Error('자료 응답이 비어 있습니다: '+k);},prefix);
    if(G!==source||Core.PJ().active!==project)throw Error('작업 중 게임이 바뀌어 받기를 취소했습니다');await Core.flush();window.__NOFLUSH=true;clearTimeout(flushT);
    const w=await System.lsApply(S.ls,prefix);committed=true;dirty.clear();System.saveSyIdx(idx);
    const o2=System.SY();o2.last=S.at;o2.lastDir='down';o2.localAt=w.at;System.saveSY(o2);CoreView.toast('클라우드의 데이터를 받았어요. 다시 시작할게요');setTimeout(()=>SystemView.reloadGame(),900);return true;
   }catch(e){PULLERR_QUOTA=e?.name==='QuotaExceededError';PULLERR='받기 실패. '+System.syErr(e);CoreView.toast(PULLERR);if(committed){setTimeout(()=>SystemView.reloadGame(),900);return true;}return false;}
   finally{if(!committed)window.__NOFLUSH=previous;await appStorage.discard(prefix).catch(()=>{});SYJOB=null;SystemView.syBar('');}
  }

  static async subApply(rep){const S=G.meta.subscr;if(!S)return;const prefix='sub-update-'+uid()+'::',source=G,project=Core.PJ().active,st=m=>{SystemView.syBar(m);if(rep)rep(m);};
   try{st('새 버전 받는 중…');const man=SUBCHK?.ver?SUBCHK:JSON.parse(await System.subGet(S.base,'manifest.json'));const game=JSON.parse(await System.subGet(S.base,'game.json'));if(!Array.isArray(game?.chars))throw Error('캐릭터 자료가 올바르지 않습니다');
    const imap=await Core.subPullImages(S.base,game,IMGNS,S.imgs||{},st,prefix);delete game.images;if(G!==source||Core.PJ().active!==project)throw Error('작업 중 게임이 바뀌어 업데이트를 취소했습니다');await Core.flush();
    game.prog=clone(source.prog);game.meta=game.meta||{};game.meta.subscr=Object.assign({},S,{ver:man.ver,at:Date.now(),imgs:imap,notes:man.notes||'',skip:0});delete game.meta.pub;
    const mine=World.RELS().filter(r=>!(game.rels||[]).some(x=>(x.a===r.a&&x.b===r.b)||(x.a===r.b&&x.b===r.a)));game.rels=[...(game.rels||[]),...clone(mine)];const next=Characters.fix(game),pj=Core.PJ(),row=pj.list.find(x=>x.id===pj.active);if(row){row.title=next.meta.title||row.title;row.sub=S.base;}
    await appStorage.commitImport(prefix,LKEY,JSON.stringify(next),IMGNS,{[PJKEY]:JSON.stringify(pj)});
    const oldKeys=[...source.chars.map(c=>'c:'+c.id),...source.chapters.map(ch=>'ch:'+ch.id),...source.lib.map(l=>'l:'+l.id),...source.threads.map(x=>'t:'+x.id)];G=next;dirty.clear();clearTimeout(flushT);for(const id of Object.keys(imgCache)){try{URL.revokeObjectURL(imgCache[id]);}catch(e){}delete imgCache[id];}Core.mark(...oldKeys);System.markAll();await Core.flush();SystemView.applyMeta();await SystemCtl.loadIdbImages();CoreView.closeModal();Economy.sendMail({from:next.meta.title||'만든 사람',title:`v${man.ver} 업데이트를 받았어요`,body:man.notes||'새 버전으로 바뀌었어요.',days:14});CoreView.toast(`v${man.ver}(으)로 업데이트했어요`);Challenge.render();MessengerCtl.checkTriggers&&MessengerCtl.checkTriggers();
   }catch(e){CoreView.toast('업데이트 실패. '+(e.message||e)+' 다시 시도해 주세요');}
   finally{await appStorage.discard(prefix).catch(()=>{});SystemView.syBar('');if(rep)rep.end();}
  }

  static async lkOp(op){ const m=System.LKMODE(), me=System.devId(), nm=SystemView.syDevice();
    if(m==='pc') return await System.pcApi('/api/lease',{method:'POST',body:{op,id:me,name:nm}});
    if(m!=='gh') return null; if(op==='beat') return System.lkGet(); const o=System.SY();
    for(let i=0;i<3;i++){ const cur=await System.lkGet(), now=Date.now(); let nx={id:cur.id||'',name:cur.name||'',at:cur.at||0,away:!!cur.away,want:cur.want||null};
      if(op==='claim') nx={id:me,name:nm,at:now,away:false,want:null};
      else if(op==='want') nx.want={id:me,name:nm,at:now};
      else if(op==='give'){ if(cur.id!==me||!cur.want) return cur; nx={id:cur.want.id,name:cur.want.name,at:now,away:false,want:null}; }
      else if(op==='away'){ if(cur.id!==me) return cur; nx.away=true; }
      else if(op==='free'){ if(cur.id!==me) return cur; nx={id:'',name:'',at:now,away:true,want:null}; }
      const body={message:'play '+op+' · '+nm,content:System.bytesToB64(new TextEncoder().encode(JSON.stringify(nx)))}; if(cur._sha) body.sha=cur._sha; if(o.branch) body.branch=o.branch;
      const r=await System.gh(o,'/contents/sync/lease.json',{method:'PUT',body,okStatus:[409,422]}); if(r&&r.content) return Object.assign(nx,{now}); await wait(800); }
    return null; }

  static async lkNewer(){const m=System.LKMODE();
   if(m==='pc'){const pc=System.PCS(),S=await System.pcApi('/api/store/state',{ok404:true});return !!(S&&S.at>(pc.last||0)&&(S.devId?S.devId!==System.devId():S.device!==SystemView.syDevice()));}
   if(m==='gh'){const o=System.SY(),R=await System.syRemote(o),S=R.state;return !!(S&&S.at>(o.last||0)&&(S.devId?S.devId!==System.devId():S.device!==SystemView.syDevice()));}return false;
  }

  static async lkPullIfNewer(){try{if(!(await SystemCtl.lkNewer()))return false;CoreView.toast('다른 기기에서 하던 게임을 받아 올게요');const ok=System.LKMODE()==='pc'?await SystemCtl.pcPull():await SystemCtl.syPull();if(!ok)throw Error(PULLERR||'최신 진행을 받지 못했습니다');return true;}catch(e){const failure=Error(e.message||'최신 진행을 확인하지 못했습니다');failure.code='pull_failed';throw failure;}}

  static async lkTick(){ if(!System.LKMODE()){ clearInterval(LK.t); return; } if(document.visibilityState!=='visible'||LK.locked||LK.busy) return;
    LK.busy=true; try{ const l=await SystemCtl.lkOp('beat'); if(!l) return; const me=System.devId();
      if(l.id&&l.id!==me){ SystemView.lkLock(l,'taken'); return; }
      if(l.want&&l.want.id!==me&&((l.now||Date.now())-(l.want.at||0))<180000){ SystemView.lkLock({name:l.want.name},'giving'); await System.lkSave(false); await SystemCtl.lkOp('give'); SystemView.lkLock({name:l.want.name},'gave'); }
    }catch(e){if(LK.locked)SystemView.lkLock({name:'다른 기기'},'savefailed');CoreView.toast(e.message||'기기 전환을 완료하지 못했습니다');} finally{ LK.busy=false; } }

  static async lkActivate(){ if(window.__BOOTSYNC){ setTimeout(SystemCtl.lkActivate,1500); return; } if(!System.LKMODE()||LK.busy) return; LK.busy=true; let pulled=false; try{
      const l=await System.lkGet(), me=System.devId();
      if(!l||!l.id||l.id===me||System.lkAway(l)){ const other=l&&l.id&&l.id!==me; await SystemCtl.lkOp('claim'); LK.claimed=true; SystemView.lkUnlock(); System.lkLoop(); if(other||LK.wasLocked){ LK.wasLocked=false; pulled=await SystemCtl.lkPullIfNewer(); } }
      else SystemView.lkLock(l,'other');
    }catch(e){if(e.code==='pull_failed'){SystemView.lkLock({name:'다른 기기'},'pullfailed');CoreView.toast(e.message);} /* 최초 연결 확인 실패는 로컬 게임을 유지해요 */ } finally{ if(!pulled) LK.busy=false; } }

  static bTick(){
    if(!B||B.over||B.paused||B.presentationBusy||B.ending) return;
    v2BattleEvents(GGMCombat.step(B.engine,B.auto)); B.ticks=B.engine.ticks;
    if(B.presentationBusy)return;
    Core.bCheck();
    if(!B)return;
    if(!B.over&&B.engine.winner==='timeout')CoreCtl.bEnd(B.ctx.kind==='raid');
    SystemView.bUpdate();if(B?.ctx.kind==='practice')v2UpdatePractice();
  }
}
