/* =========================================================
   처음 실행 설정 (AI 키)
   ========================================================= */
const APP_NAME='가챠 게임 메이커';
const SETUP_KEY='starfall-setup-done';
let SW=null;
function needSetup(){ return !appStorage.getItem(SETUP_KEY)&&!AIP().list.length&&!imgReady(); }
function showSetup(){ const s=SND(); APD={id:'',type:'gemini',pub:'google',name:'',region:'global',base:'https://openrouter.ai/api/v1'}; SW={step:0,ai:{type:'gemini',key:''},img:imgProvider(),cf:Object.assign({},comfyCfg()),nai:naiCfg().key||'',fish:s.fishKey||'',el:s.elKey||'',ok:{},hasAI:AIP().list.some(apValid),cst:{tags:myStyle().tags||'',neg:myStyle().neg||''},stPrev:''}; renderSetup(); $('#ov').hidden=false; }
const SETUP_HELP={vertex:['Google Cloud 콘솔에서 서비스 계정 키나 익스프레스 키를 만들어요','https://console.cloud.google.com/vertex-ai'],gemini:['Google AI Studio에서 무료로 받을 수 있어요','https://aistudio.google.com/apikey'],anthropic:['Anthropic Console에서 받아요 (유료)','https://console.anthropic.com/settings/keys'],openai:['OpenRouter 등 OpenAI 호환 서비스의 키','https://openrouter.ai/keys']};
function swRead(){ const v=id=>{const e=$('#'+id);return e?e.value.trim():null;};
  if($('#ap_type')){ readAp(); SW.ai.type=APD.type; SW.ai.key=APD.key||APD.sa||APD.vkey||''; }
  if(v('sw_img')!=null) SW.img=v('sw_img'); if(v('sw_cfurl')!=null) SW.cf.url=v('sw_cfurl'); if($('#sw_cfwf')) SW.cf.wf=$('#sw_cfwf').value.trim();
  if(v('sw_nai')!=null) SW.nai=v('sw_nai'); if(v('sw_fish')!=null) SW.fish=v('sw_fish'); if(v('sw_el')!=null) SW.el=v('sw_el');
  if($('#sw_auto')) SW.autoArt=$('#sw_auto').value; if($('#sw_stags')) SW.cst.tags=$('#sw_stags').value.trim(); if(v('sw_sneg')!=null) SW.cst.neg=v('sw_sneg'); }
function swStyleId(){ setMyStyle(SW.cst.tags,SW.cst.neg); return 'my_style'; }
function swProfile(){ return Object.assign({},APD,{id:'p'+uid(),name:APD.name||AITYPE[APD.type]}); }
function swAddAI(){ const p=swProfile(); if(!apValid(p)) return false; const A=AIP(); if(A.list.some(x=>(x.key&&x.key===p.key)||(x.sa&&x.sa===p.sa&&x.model===p.model))) return true; A.list.push(p); if(!A.list.some(x=>x.id===A.active)) A.active=p.id; saveAIP(A); SW.hasAI=true; return true; }
function swSave(){
  swAddAI();
  { let sv={}; try{sv=JSON.parse(appStorage.getItem(NKEY))||{};}catch(e){} sv.provider=SW.img; sv.comfy=Object.assign({},comfyCfg(),SW.cf); appStorage.setItem(NKEY,JSON.stringify(sv)); }
  if(SW.nai){ let sv={}; try{sv=JSON.parse(appStorage.getItem(NKEY))||{};}catch(e){} sv.key=SW.nai; appStorage.setItem(NKEY,JSON.stringify(sv)); }
  if(SW.cst) swStyleId(); if(SW.autoArt){ const sv=naiSaved(); sv.autoArt=SW.autoArt; appStorage.setItem(NKEY,JSON.stringify(sv)); }
  if(SW.fish||SW.el){ const o=SND(); if(SW.fish) o.fishKey=SW.fish; if(SW.el) o.elKey=SW.el; appStorage.setItem(SKEY,JSON.stringify(o)); }
}
function renderSetup(){
  const oldSetup=$('#ov .setup'),setupPosition=oldSetup?.dataset.step===String(SW.step)?uiScrollCapture($('#ov')):null;
  const st=SW.step, dots=[0,1,2,3,4,5].map(i=>`<i class="${i<=st?'on':''}"></i>`).join(''), a=SW.ai, help=SETUP_HELP[a.type];
  const card=[
    `<div class="sw-logo sw-splash"><i>GACHA GAME MAKER</i><b>가챠 게임 메이커</b><span>내가 정한 세계관으로 만드는 나만의 가챠 게임</span></div>
     ${IS_IOS&&!IS_STANDALONE?'<p style="margin:8px 0 0;font-size:.82rem">📱 Safari 공유(⬆︎) → <b>홈 화면에 추가</b> 후 아이콘으로 열면 저장이 안전해요.</p>':''}
     <div class="sw-btns"><button class="btn" data-act="swnext">시작하기</button><button class="btn ghost" data-act="swskipall">샘플 게임으로</button></div>`,
    `<h2>글 AI</h2><p class="muted">세계관·캐릭터·스토리를 써요. 키는 이 기기에만 저장돼요.</p>
     ${AIP().list.length?`<div class="sw-added">${AIP().list.map(p=>`<span>✓ ${esc(p.name||AITYPE[p.type])}${p.model?' · '+esc(p.model):''}</span>`).join('')}</div>`:''}
     ${apForm(APD)}
     ${SETUP_HELP[APD.type]?`<p class="muted" style="margin:2px 0 0"><button class="linkb" data-act="swlink" data-url="${SETUP_HELP[APD.type][1]}">키 받으러 가기</button></p>`:''}
     <div class="sw-test"><button class="btn sm ghost" data-act="swtestai">연결 확인</button><button class="btn sm ghost" data-act="swaddai">이 AI 추가하고 하나 더</button><span id="sw_res">${SW.ok.ai?'✓ 연결됨':''}</span></div>
     <div class="sw-btns"><button class="btn ghost" data-act="swprev">이전</button><button class="btn" data-act="swnext">다음</button></div>`,
    `<h2>그림 AI</h2><p class="muted">스탠딩, 일러스트, 배경, 적, 아이콘을 그려요.</p>
     <label class="f" for="sw_img">종류</label><select class="in" id="sw_img">${opt([['nai','NovelAI (구독 필요, 투명 배경·레퍼런스·표정 변환)'],['comfy','ComfyUI (내 PC·서버의 워크플로)']],SW.img)}</select>
     ${SW.img==='comfy'?`<label class="f" for="sw_cfurl">ComfyUI 주소</label><input class="in" id="sw_cfurl" value="${esc(SW.cf.url||'')}" placeholder="http://192.168.0.10:8188">
     <p class="muted" style="margin:4px 0 0">PC에서 ComfyUI를 --listen 옵션으로 켜고, 폰과 같은 와이파이에서 PC의 IP를 넣어요.</p>
     <label class="f" for="sw_cfwf">워크플로 (Export (API) JSON)</label><textarea class="in" id="sw_cfwf" style="min-height:80px">${esc(SW.cf.wf||'')}</textarea>
     <div class="sw-test"><button class="btn sm ghost" data-act="cfload">JSON 파일 불러오기</button><button class="btn sm ghost" data-act="cftest">연결 확인</button><span id="sw_res"></span></div>
     <div class="sw-btns"><button class="btn ghost" data-act="swprev">이전</button><button class="btn" data-act="swnext">다음</button></div>`:`
     <label class="f" for="sw_nai">영구 API 토큰</label><input class="in" id="sw_nai" type="password" autocomplete="off" value="${esc(SW.nai)}" placeholder="pst-...">
     <p class="muted" style="margin:6px 0 0">novelai.net 로그인 → 설정(톱니) → Account → Get Persistent API Token <button class="linkb" data-act="swlink" data-url="https://novelai.net/image">NovelAI 열기</button></p>
     <div class="sw-test"><button class="btn sm ghost" data-act="swtestnai">연결 확인</button><span id="sw_res">${SW.ok.nai?'✓ 연결됨':''}</span></div>
     <div class="sw-btns"><button class="btn ghost" data-act="swprev">이전</button><button class="btn" data-act="swnext">다음</button></div>`}`,
    `<h2>그림체 (선택)</h2><p class="muted">프리셋을 고르거나 직접 적어요. 비워 두면 기본 그림체예요.</p>
     <div class="chips" style="margin:6px 0">${allPresets().map(p=>`<button class="chip ${SW.preset===p.id?'on':''}" data-act="swpreset" data-v="${p.id}">${pthumbHTML(p.id,'chip')}${esc(p.name)}</button>`).join('')}</div>
     ${imgReady()||(SW.img==='comfy'?SW.cf.url:SW.nai)?'':'<p style="color:var(--rose);font-size:.85rem">그림 AI를 안 넣었으면 건너뛰어도 돼요.</p>'}
     <label class="f" for="sw_stags">그림체 태그 (쉼표로 구분)</label><textarea class="in" id="sw_stags" style="min-height:90px" placeholder="${esc(STYLE_EX)}">${esc(SW.cst.tags||'')}</textarea>
     <label class="f" for="sw_sneg">빼고 싶은 것 (선택)</label><input class="in" id="sw_sneg" value="${esc(SW.cst.neg||'')}" placeholder="예: 3d, realistic">
     <label class="f" for="sw_auto">AI가 새 스테이지·이벤트·캐릭터를 만들면</label><select class="in" id="sw_auto">${opt([['ask','그릴지 물어보기'],['auto','자동으로 그리기'],['off','그리지 않기']],SW.autoArt||naiCfg().autoArt||'ask')}</select>
     <div class="sw-test"><button class="btn sm ghost" data-act="swstytest">시험 그리기</button><span id="sw_sres"></span></div>
     ${SW.stPrev?`<div class="sty-prev"><img src="${SW.stPrev}" alt="시험 그림"></div>`:''}
     <div class="sw-btns"><button class="btn ghost" data-act="swprev">이전</button><button class="btn" data-act="swnext">다음</button></div>`,
    `<h2>목소리·배경음 (선택)</h2>
     <label class="f" for="sw_fish">Fish Audio API 키 (목소리)</label><input class="in" id="sw_fish" type="password" autocomplete="off" value="${esc(SW.fish)}">
     <label class="f" for="sw_el">ElevenLabs API 키 (배경음·효과음)</label><input class="in" id="sw_el" type="password" autocomplete="off" value="${esc(SW.el)}">
     <div class="sw-btns"><button class="btn ghost" data-act="swprev">이전</button><button class="btn" data-act="swnext">다음</button></div>`,
    `<h2>어떤 게임을 만들까요?</h2>
     <ul class="sw-sum"><li class="${a.key||SW.hasAI?'on':''}">${a.key||SW.hasAI?'✓':'–'} 글 AI ${a.key?esc(AITYPE[a.type]):SW.hasAI?'등록됨':'없음'}</li><li class="${SW.img==='comfy'?(SW.cf.url?'on':''):(SW.nai?'on':'')}">${(SW.img==='comfy'?SW.cf.url:SW.nai)?'✓':'–'} 그림 AI ${SW.img==='comfy'?'ComfyUI':'NovelAI'}${(SW.img==='comfy'?SW.cf.url:SW.nai)?'':' 없음'}</li><li class="${SW.fish?'on':''}">${SW.fish?'✓':'–'} 목소리</li><li class="${SW.el?'on':''}">${SW.el?'✓':'–'} 배경음</li></ul>
     <div class="sw-opt ${a.key||SW.hasAI?'':'off'}"><b>✦ AI로 새 게임 만들기</b><span>한 줄만 적거나, 세계관을 직접 적어요.</span>
       ${a.key||SW.hasAI?`<button class="btn block" data-act="swdraft" style="margin-top:10px">새 게임 초안 열기</button>`:`<span class="muted">글 AI 키를 넣으면 쓸 수 있어요. <button class="linkb" data-act="swgo1">키 넣으러 가기</button></span>`}</div>
     <div class="sw-opt"><b>🔗 구독 주소로 받기</b><span>다른 사람이 게시한 게임을 받아서 플레이해요. AI 키가 없어도 돼요.</span><input class="in" id="sw_sub" placeholder="GGMSUB:주인/저장소/브랜치/games/…" autocomplete="off" style="margin-top:8px"><button class="btn ghost block" data-act="swsub" style="margin-top:8px">구독하고 시작</button></div>
     <div class="sw-opt"><b>☆ 샘플 게임 「낙성계약」</b><span>바로 해 볼 수 있는 기본 게임이에요.</span><button class="btn ghost block" data-act="swdone" style="margin-top:10px">샘플로 시작</button></div>
     <div class="sw-btns"><button class="btn ghost" data-act="swprev">이전</button></div>`][st];
  $('#ov').innerHTML=`<div class="setup" data-step="${st}"><div class="sw-bg" style="${bgStyle(P().titleBg||'낙성 분화구')}"></div><div class="sw-card"><div class="sw-dots">${dots}</div>${card}</div></div>`;
  if(setupPosition)uiScrollRestore($('#ov'),setupPosition);
}

