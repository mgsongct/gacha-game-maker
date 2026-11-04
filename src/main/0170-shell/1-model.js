/* ===== 0170-shell — Model(상태·규칙·저장·외부 서비스) ===== */
/* src/main/0170-shell/0170-render.js에서 옮김 */
/* 플레이 모드: 만들기·편집·AI 설정을 숨기고 게임만 해요(이 기기에만 저장) */
// 구독한 게임은 만든 사람이 콘텐츠를 올려요: 늘 플레이 모드(편집·만들기·자체 업데이트 없음, AI 키 없이 플레이)
function subLocked(){ try{ return !!(typeof G!=='undefined'&&G&&G.meta&&G.meta.subscr); }catch(e){ return false; } }
function playMode(){ if(subLocked()) return true; try{ return appStorage.getItem('ggm-play')==='1'; }catch(e){ return false; } }
/* src/main/0170-shell/0180-ui-scroll.js에서 옮김 */
function uiScrollPath(root,node){
 if(node===root)return [];
 const path=[];for(let el=node;el&&el!==root;el=el.parentElement){if(!el.parentElement)return null;path.unshift([...el.parentElement.children].indexOf(el));}
 return path;
}
function uiPageScrollKey(){return JSON.stringify([PJ().active,tab,tab==='studio'?STTAB:'',tab==='evd'?P().curEvent:'',tab==='ops'?OPS_CH:'']);}
function nextStage(){ const main=G.chapters.filter(ch=>ch.kind==='main'); for(const [ci,ch] of main.entries()) for(const [si,s] of ch.stages.entries()) if(!P().cleared[s.id]) return {ch,s,code:(ci+1)+'-'+(si+1)}; return null; }
/* 캐릭터의 기술 컷인 그림 칸 c.scg: 새 값 · 쓰기(맞춰 저장하고 돌려줌 — 그릴 때·올릴 때·불러오기) · 읽기(없으면 새 값을 보여 주기만) */
function scgNew(c){ return {id:'sc_'+c.id,kind:'scg',name:c.name+' 기술 컷인',prompt:'',img:null}; }
function scgSlot(c){ if(!c) return null; if(!c.scg||typeof c.scg!=='object') c.scg=scgNew(c); c.scg.id=c.scg.id||'sc_'+c.id; c.scg.kind='scg'; return c.scg; }
function scgFixAll(g){ (g.chars||[]).forEach(c=>{ if(c.scg) scgSlot(c); }); } // 불러오기(fix): 있는 칸의 id·종류만 맞춤
function scgOf(c){ if(!c) return null; return c.scg&&typeof c.scg==='object'?c.scg:scgNew(c); } // 읽기 — 고칠 때는 scgSlot
function chMapLib(ch){return G.lib.find(l=>l.kind==='map'&&l.ch===ch.id);}
/* 장 작전 지도(자료실 map): 새 값(장마다 id 하나 — 목록에서 미리 보여 줄 때도 같은 열쇠) · 쓰기(없으면 넣고 돌려줌 — 지도 편집·그림 등록) */
function chMapNew(ch){return {id:'m_'+ch.id,kind:'map',ch:ch.id,name:ch.title+' 지도',prompt:'ruined city at night, glowing roads, rivers of light, crater, scattered buildings',img:null};}
function ensureChMap(ch){let l=chMapLib(ch); if(!l){ l=chMapNew(ch); G.lib.push(l); mark('l:'+l.id); } return l;}
function evHost(ev){ const bn=G.banners.find(x=>x.id===ev.bannerId); const ids=[...((bn&&bn.pickup)||[]),...(ev.shop||[]).filter(i=>i.type==='char').map(i=>i.ref)]; return ids.map(charById).find(Boolean)||null; }
/* src/main/0170-shell/0210-setup.js에서 옮김 */
function needSetup(){ return !appStorage.getItem(SETUP_KEY)&&!AIP().list.length&&!imgReady(); }
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
/* src/main/0170-shell/0230-modal.js에서 옮김 */
function trigDesc(t){const g=t.trigger||{type:'start'};return g.type==='start'?'계약 직후':g.type==='aff'?`호감도 Lv.${g.value}`:`${stageCode(g.value)} 클리어 후`;}
function epLock(c,e,o){
  if(!o) return '미보유';
  if(affLv(o)<e.lv) return `호감도 Lv.${e.lv}`;
  if(e.dup&&o.dup<e.dup) return `${T('limit')} ${e.dup}단계`;
  if(e.after&&!P().cleared[e.after]) return `${stageCode(e.after)} 클리어`;
  return '';
}
function guideText(){
  return `[${G.meta.title} 테스트 안내]\n개인적으로 만든 가챠 게임이에요. 해 보고 의견 부탁해요!\n공식 배포처: https://github.com/jjhk0803/gacha-game-maker (다른 곳에서 받은 파일은 쓰지 마세요)\n\n1. 같이 보낸 APK 파일을 눌러 설치해요. "출처를 알 수 없는 앱" 허용을 물으면 이번만 허용해요.\n2. 공유 팩(.ggmpack 또는 기존 .json)도 받았다면: 최신 버전으로 업데이트한 뒤 설정 → 데이터 → 공유 팩 불러오기 → "새 게임으로 추가".\n3. 새 ${T('crew')}·스토리 만들기, 그림, 음성 같은 AI 기능은 각자 키를 넣어야 써요. 없어도 기본 게임은 다 할 수 있어요. 키는 남에게 받지 말고 본인 것만 쓰세요.\n4. 다 해 봤으면 설정 → 공유와 피드백 → 피드백 보내기로 의견을 보내 주세요.\n\n※ 개인 테스트용이라 다른 곳에 올리거나 다시 퍼뜨리지는 말아 주세요.`;
}
function crewOrder(){return [...G.chars].sort((a,b)=>(own(b.id)?1:0)-(own(a.id)?1:0)||b.rarity-a.rarity||(a.ord||0)-(b.ord||0));}
/* 5돌파 CG를 처음 봄(Model) — 처음이면 true */
function cgFirstSeen(c){ const o=own(c.id); if(!(o&&o.dup>=5&&o.cgNew&&imgSrcRaw(c.lbcg))) return false; o.cgNew=false; mark('prog'); return true; }
/* 이름 바꾸기: 대본·톡·에피소드·대사·프로필 속 옛 이름을 새 이름으로(그림 프롬프트와 id는 그대로) */
function renameEverywhere(old,nu){ let n=0; const skip=new Set(['id','charId','img','prompt','naiPrompt','naiPose','asset','seed','bannerId','eventId','kind','type','name']);
  // 옛 이름을 품은 다른 이름(예: 세라 → 세라핀)은 건드리지 않게 잠깐 감춰 둬요
  const others=[...new Set([...G.chars,...(G.npcs||[])].map(x=>x.name).filter(x=>x&&x!==old&&x!==nu&&x.includes(old)))];
  const fix=v=>{ if(!v.includes(old)) return v; let t=v; others.forEach((o,i)=>{ t=t.split(o).join('\u0000'+i+'\u0000'); }); if(!t.includes(old)) return v; t=t.split(old).join(nu); others.forEach((o,i)=>{ t=t.split('\u0000'+i+'\u0000').join(o); }); n++; return t; };
  const walk=x=>{ if(Array.isArray(x)){ x.forEach((v,i)=>{ if(typeof v==='string') x[i]=fix(v); else if(v&&typeof v==='object') walk(v); }); return; }
    if(!x||typeof x!=='object') return; Object.keys(x).forEach(k=>{ if(skip.has(k)) return; const v=x[k]; if(typeof v==='string') x[k]=fix(v); else if(v&&typeof v==='object') walk(v); }); };
  [G.chapters,G.threads,G.events,G.chars,G.npcs,G.opening,G.world,G.banners,RELS()].forEach(walk); RELS().forEach(r=>relNames(r)); // 관계 설명·있었던 일 속 이름도, 관계에 적어 둔 두 사람 이름도
  (G.banners||[]).forEach(b=>{ if(typeof b.name==='string'){ const x=fix(b.name); if(x!==b.name){ b.name=x; } } }); if(n){ markAll(); mark('prog'); } return n; }
function stagePower(s){return Math.round(s.enemies.reduce((a,e)=>a+enemyPower(e),0)*1.15);}
function factionBonus(ids){const cnt={};ids.map(charById).filter(Boolean).forEach(c=>{if(c.faction)cnt[c.faction]=(cnt[c.faction]||0)+1;});const out={};Object.entries(cnt).forEach(([f,n])=>{if(n>=2)out[f]=n>=4?15:n>=3?10:5;});return out;}
function teamPower(ids){const fb=factionBonus(ids);return ids.map(charById).filter(Boolean).reduce((a,c)=>a+Math.round(charPower(c)*(1+(fb[c.faction]||0)/100)),0);}
/* src/main/0170-shell/0370-game-picker.js에서 옮김 */
function startMode(){ try{ return appStorage.getItem('ggm-start')||'last'; }catch(e){ return 'last'; } }
function bootPrepNeeded(){ const p=P(); return !playMode()&&!p.seenOpening&&!p.bootPrep&&imgReady()&&drawTodo(bootCats().map(x=>x[0])).length>0; }
/* src/main/0170-shell/0410-desktop.js에서 옮김 */
/* 화면 방향(휴대폰): auto=기기 회전 따라, portrait=세로 고정, landscape=가로 고정. 앱은 화면 방향 플러그인, 웹은 브라우저 기능으로 잠가요 */
function orientPref(){ try{ return appStorage.getItem('ggm-orient')||'auto'; }catch(e){ return 'auto'; } }
async function applyOrient(){ const v=orientPref(), SO=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.ScreenOrientation;
  try{ if(SO){ if(v==='auto') await SO.unlock(); else await SO.lock({orientation:v}); return true; } }catch(e){ quietErr(e,'0410-desktop.js:5'); }
  try{ if(screen.orientation){ if(v==='auto') screen.orientation.unlock(); else await screen.orientation.lock(v); return true; } }catch(e){ quietErr(e,'0410-desktop.js:6'); } return v==='auto'; }
function deskMode(){ const def=Math.min(screen.width||innerWidth,screen.height||innerHeight)<600?'auto':'wide'; let v=def; try{ v=appStorage.getItem('ggm-desk')||def; }catch(e){} return v; }
/* src/main/0170-shell/0550-standalone-app.js에서 옮김 */
function charImgList(c){return charImgItems(c).filter(x=>x.o?.id&&imgSrcRaw(x.o)).map(x=>[x.o,x.label,x.group]);}
