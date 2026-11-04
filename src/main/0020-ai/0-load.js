/* ===== 0020-ai — 불러올 때(상수·상태·리스너): 계층 파일 밖에 남은 옛 조각을 이름 순(불러오는 순서)으로 이음 ===== */

/* ── 0020-ai.js에서 ── */
/* =========================================================
   AI 연결: 여러 글 AI(Claude, Vertex, Gemini, OpenAI 호환) + NovelAI
   ========================================================= */
const AKEY='starfall-ai', PKEY='starfall-ai-profiles', NKEY='starfall-nai';
const AITYPE={anthropic:'Claude API',vertex:'Google Vertex AI',gemini:'Gemini API (AI Studio)',openai:'OpenAI 호환 (OpenRouter 등)',copilot:'GitHub Copilot (구독 필요)'};
const DEFM={anthropic:['claude-sonnet-5-5','claude-haiku-4-5-20251001'],gemini:['gemini-2.5-pro','gemini-2.5-flash'],vertex_google:['gemini-2.5-pro','gemini-2.5-flash'],vertex_anthropic:['',''],openai:['',''],copilot:['gpt-4.1','gpt-4.1']};
let NAIJOB=null, APD=null;
aipMigrate();
/* GitHub Copilot: GitHub 기기 로그인으로 받은 토큰을 이 기기에만 저장하고, 쓸 때마다 짧은 Copilot 토큰으로 바꿔요(비공식 방식) */
const COPILOT_CID='Iv1.b507a08c87ecfe98', COPILOT_H={'Editor-Version':'vscode/1.99.0','Editor-Plugin-Version':'copilot-chat/0.26.0','Copilot-Integration-Id':'vscode-chat','User-Agent':'GitHubCopilotChat/0.26.0'};
const CPTOK={};

/* 네이티브 HTTP (앱에서는 CORS 없이 직접 호출) */
const IS_NATIVE=!!(window.Capacitor&&(typeof window.Capacitor.isNativePlatform==='function'?window.Capacitor.isNativePlatform():window.Capacitor.Plugins&&window.Capacitor.Plugins.CapacitorHttp));
const IS_IOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const IS_STANDALONE=(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;
const PXHOSTS=new Set();
// QR 주소(?pc=키)로 열면 연결해요. 같은 주소를 다시 찍어도 지난 저장 기록(last·localAt)은 그대로 둬요(지우면 받지 않은 진행을 덮어써요)
// 아이폰 Safari에서는 주소에 키를 남겨 둬요: 홈 화면에 추가할 때 키가 같이 들어가야 홈 화면 앱(저장 공간이 Safari와 따로예요)도 PC에 연결돼요
(function(){ try{ const u=new URL(location.href), k=u.searchParams.get('pc'); if(k){ const old=PCS(); setPCS(Object.assign({},old&&old.key===k&&old.base===location.origin?old:{},{base:location.origin,key:k,at:Date.now()})); if(!(IS_IOS&&!IS_STANDALONE)){ u.searchParams.delete('pc'); history.replaceState(null,'',u.pathname+(u.search||'')+u.hash); } window.__PC_NEW=1; } }catch(e){} })();
(function(){ try{ const pc=PCS(); if(!pc||pc.base!==location.origin||!window.fetch||!URL.createObjectURL) return; const el=document.querySelector('link[rel=manifest]'); if(!el) return;
  fetch(el.href).then(r=>r.json()).then(m=>{ m.start_url=location.origin+'/?pc='+encodeURIComponent(pc.key); m.scope=location.origin+'/'; m.icons=(m.icons||[]).map(i=>Object.assign({},i,{src:new URL(i.src,el.href).href})); el.href=URL.createObjectURL(new Blob([JSON.stringify(m)],{type:'application/manifest+json'})); }).catch(()=>{}); }catch(e){ quietErr(e,'0020-ai-connect.js:63'); } })();
const isLocalHost=h=>/^(localhost|127\.0\.0\.1|\[::1\]|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h);
/* AI 기록: 글 AI 호출마다 성공·실패, 걸린 시간, 오류, 받은 응답 앞부분을 남겨요(설정 → 글 AI → AI 기록). 키는 남기지 않아요 */
const AILOG=(()=>{ try{ const a=JSON.parse(appStorage.getItem('ggm-ailog')||'[]'); return Array.isArray(a)?a:[]; }catch(e){ return []; } })();
let AILAST='', AISTAGE='';
const TMO={quick:60000,default:300000,complex:600000};

/* Vertex 서비스 계정 토큰 */
const TOKC={};

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
/* 그림체 프리셋 썸네일: 프리셋 id별로 작은 그림(160px JPEG)을 이 기기에 저장해요. 내 프리셋을 코드로 내보내면 썸네일도 같이 가요 */
const PTHUMB='ggm-pthumb';
const llmCode=p=>'GGMLLM:'+btoa(unescape(encodeURIComponent(JSON.stringify({name:p.name,pos:p.pos,text:p.text}))));
// 모든 글 AI 요청에 지침을 끼워요: 상단=맨 앞, 중단=출력 형식(JSON만 출력…) 바로 앞, 하단=맨 끝
// 그림 태그 지침: AI가 NovelAI(그림) 태그를 쓰는 요청에만 출력 형식 바로 앞에 넣어요
const TAG_REQ=/NovelAI|naiPrompt|Danbooru|영어 태그|장면 태그/;
const packCode=p=>'GGMPACK:'+btoa(unescape(encodeURIComponent(JSON.stringify(p))));
const NAI_QUALITY={'nai-diffusion-5-full':'very aesthetic, masterpiece, best quality','nai-diffusion-5-curated':'very aesthetic, masterpiece, best quality','nai-diffusion-4-5-full':'very aesthetic, masterpiece, no text','nai-diffusion-4-5-curated':'location, masterpiece, no text','nai-diffusion-4-full':'no text, best quality, very aesthetic, absurdres'};
const ILK=k=>k==='illust'||k==='lbcg';
const isV4p=m=>/^nai-diffusion-(?:4|5)(?:-|$)/.test(String(m||'').trim());
const isV45=m=>/^nai-diffusion-4-5/.test(String(m||'').trim());
const COMPO_TAGS=/^(full body|standing|straight-on|simple background|white background|cowboy shot|upper body|portrait|looking at viewer|arms at sides|transparent background)$/i;
const AGE_TAGS=/^(mature female|mature male|mature woman|mature man|milf|mature|adult woman|adult man|adult|older woman|old woman|aged up)$/i;
const CG_POS={left:{x:.3,y:.5},center:{x:.5,y:.5},right:{x:.7,y:.5}};
const CG_POS_LABEL=[['auto','자동'],['left','왼쪽'],['center','가운데'],['right','오른쪽']];
/* Structured image prompts. Legacy strings remain the transport format and are never
   discarded. Unknown tags stay editable in other; no LLM is called on opening a UI. */
const NAI_BLOCK_KEYS=['appearance','outfit','other','style'];
// Rules version 3: separate style/quality without rewriting transport strings.
const NAI_BLOCK_RULE_VERSION=3;
naiBlocksMount.serial=0;
// Observe newly opened dialogs only, not keystrokes or the entire game data.
(function(){let queued=false;const pending=new Set();const observer=new MutationObserver(records=>{
 for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1&&!node.closest?.('.nai-block-editor'))pending.add(node);
 if(!pending.size||queued)return;queued=true;queueMicrotask(()=>{queued=false;const nodes=[...pending];pending.clear();for(const node of nodes)if(node.isConnected){naiBlocksMount(node);naiBlocksScan(node);}});
 });observer.observe(document.body,{childList:true,subtree:true});naiBlocksScan();})();
const AIERR={origin_block:'이 서비스가 브라우저에서 온 요청(Origin 헤더)을 막았어요(403).',el_nokey:'설정의 소리에서 ElevenLabs 키를 넣어 주세요.',fish_nokey:'설정의 소리에서 Fish Audio 키를 넣어 주세요.',no_ai:'설정의 글 AI에서 AI를 먼저 등록해 주세요.',model_not_found:'모델 이름이나 리전을 확인해 주세요.',sa_bad:'서비스 계정 JSON을 확인해 주세요. 파일 내용 전체를 붙여넣어야 해요.',bad_key:'키가 올바르지 않거나 권한이 없어요. 설정의 글 AI에서 확인해 주세요.',network:'인터넷 연결을 확인해 주세요.',low_credit:'API 크레딧이 부족해요. Claude Console에서 충전해 주세요.',not_granted:'AI 사용 권한이 꺼져 있어요. 앱의 권한 메뉴에서 켤 수 있어요.',rate_limited:'요청이 많아요. 잠시 후 다시 시도해 주세요.',refused:'AI가 이 요청은 쓰지 않았어요. 수위나 내용을 바꿔 다시 시도해 주세요.',invalid_json:'AI 응답을 읽지 못했어요. 다시 시도해 주세요.',cancelled:'취소했어요.'};
let AI_QUIET=false,AI_QUIET_LAST=''; // 새 게임 단계 재시도 중에는 같은 오류 알림을 되풀이하지 않고 마지막 원인만 보여 줘요
/* 그림체(직접 입력): NovelAI 저장 설정 읽기·내 그림체 */
const STYLE_EX='예: anime coloring, cel shading, vibrant colors  /  watercolor (medium), soft colors  /  1.2::artist:이름 ::';
/* src/main/0170-shell/0180-ui-scroll.js에서 옮김 */
/* src/main/0170-shell/0180-ui-scroll.js에서 옮김 */
