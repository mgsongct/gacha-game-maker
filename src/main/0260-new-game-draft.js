/* ===== 새 게임 초안 (작가 설정을 직접 자세히 적고 만들기) ===== */
const DR2KEY='ggm-draft2';
let DR2=null, DRTAB='theme';
const DR_TABS=[['theme','테마'],['world','세계관'],['setting','설정'],['chars','인물'],['hero','주인공']];
function drLoad(){ let d=null; try{ d=JSON.parse(appStorage.getItem(DR2KEY)||'null'); }catch(e){} d=d&&typeof d==='object'?d:{};
  return Object.assign({mode:'',auto:'',kw:'',tone:'',theme:'auto',n:8,style:'',fan:false,src:'',story:'',stages:0,len:'normal',world:'',setting:'',chars:[],hero:{name:'',gender:'',look:'',hide:false}},d,{hero:Object.assign({name:'',call:'',gender:'',look:'',bio:'',hide:false},d.hero||{}),chars:Array.isArray(d.chars)?d.chars:[]}); }
/* 초안 보관함: 이름 붙여 여러 개 저장하고 다시 불러와요. 게임을 만들면 그 게임에도 초안이 같이 저장돼요 */
const DRLIB='ggm-drafts';
function drLib(){ try{ const a=JSON.parse(appStorage.getItem(DRLIB)||'[]'); return Array.isArray(a)?a:[]; }catch(e){ return []; } }
function drLibSave(a){ try{ appStorage.setItem(DRLIB,JSON.stringify(a.slice(0,30))); return true; }catch(e){ toast('저장 공간이 부족해요'); return false; } }
const drName=d=>String(d.gtitle||'').trim()||String(d.mode==='auto'?d.auto:d.kw||'').trim().slice(0,24)||'이름 없는 초안';
function drClean(d){ const x=JSON.parse(JSON.stringify(d||{})); delete x.undo; return x; }
// 초안 내보내기·가져오기: 코드 한 줄(GGMDRAFT:…) 또는 파일(.json)로 다른 기기·다른 게임에 옮겨요
const draftCode=(d,name)=>{ const x=drClean(d); delete x.reuse; return 'GGMDRAFT:'+btoa(unescape(encodeURIComponent(JSON.stringify({v:1,name:name||drName(d),d:x})))); };
function draftFrom(t){ t=String(t||'').trim(); let o=null; const m=t.match(/GGMDRAFT:([A-Za-z0-9+/=\s]+)/);
  try{ if(m) o=JSON.parse(decodeURIComponent(escape(atob(m[1].replace(/\s+/g,''))))); else if(/^[\[{]/.test(t)) o=JSON.parse(t); }catch(e){ return null; }
  if(o&&o.d&&typeof o.d==='object') return {name:String(o.name||drName(o.d)).slice(0,40),d:o.d};
  if(o&&typeof o==='object'&&!Array.isArray(o)&&('chars' in o||'world' in o||'kw' in o||'auto' in o||'gtitle' in o)) return {name:drName(o),d:o}; // 초안 그대로 붙여 넣은 경우
  return null; }
async function saveTextFile(text,name){ const b=new Blob([text],{type:'application/json'});
  if(IS_NATIVE&&CAP&&CAP.Filesystem){ const FS=CAP.Filesystem, path='가챠게임메이커/초안/'+name;
    try{ try{ if(FS.requestPermissions) await FS.requestPermissions(); }catch(e){ quietErr(e,'0260-new-game-draft.js:22'); } await FS.writeFile({path,data:text,directory:'DOCUMENTS',encoding:'utf8',recursive:true}); toast('Documents/'+path+' 에 저장했어요'); return; }
    catch(e){ try{ await FS.writeFile({path:name,data:text,directory:'CACHE',encoding:'utf8'}); const u=await FS.getUri({path:name,directory:'CACHE'}); if(CAP.Share){ await CAP.Share.share({title:name,files:[u.uri]}); return; } }catch(e2){ quietErr(e2,'0260-new-game-draft.js:23'); } toast('파일을 저장하지 못했어요. 코드 복사를 써 주세요'); return; } }
  const file=new File([b],name,{type:'application/json'});
  if(/iPhone|iPad|Android/i.test(navigator.userAgent)&&navigator.canShare&&navigator.canShare({files:[file]})){ try{ await navigator.share({files:[file],title:name}); return; }catch(e){ if(e&&e.name==='AbortError') return; } }
  const a=document.createElement('a'); a.href=URL.createObjectURL(file); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},4000); toast('다운로드 폴더에 저장했어요 · '+name); }
let DRX=null; // 내보낼 초안 {name,d}
function openDraftExport(name,d,back){ DRX={name,d,back}; const code=draftCode(d,name);
  openModal(`${head('초안 내보내기',`<span class="muted">「${esc(name)}」</span>`)}
    <p class="muted" style="margin:0 0 6px;font-size:.82rem">코드를 복사해 다른 기기·다른 사람에게 보내거나 파일로 저장해요. 받는 쪽은 새 게임 초안 → 📂 초안 보관함 → 📥 가져오기에서 넣어요. 주인공 프로필 그림은 들어가지 않아요(외모 글은 들어가요).</p>
    <textarea class="in" id="drx_code" readonly style="min-height:110px;font-size:.72rem">${esc(code)}</textarea>
    <p class="muted" style="margin:4px 0 0;font-size:.74rem">${nf(code.length)}자</p>
    <div class="row" style="margin-top:10px"><button class="btn" data-act="drxcopy">코드 복사</button><button class="btn ghost" data-act="drxfile">파일로 저장</button><button class="btn ghost" data-act="drxback">돌아가기</button></div>`); }
function openDraftImport(){ openModal(`${head('초안 가져오기','<span class="muted">코드나 파일로 받은 초안을 보관함에 넣어요</span>')}
    <label class="f" for="dri_code">초안 코드 (GGMDRAFT:로 시작)</label><textarea class="in" id="dri_code" style="min-height:110px;font-size:.75rem" placeholder="GGMDRAFT:…"></textarea>
    <label class="f"><input type="checkbox" id="dri_load" checked> 가져온 뒤 바로 불러오기</label>
    <div class="row" style="margin-top:10px"><button class="btn" data-act="drigo">코드로 가져오기</button><button class="btn ghost" data-act="drifile">파일 고르기</button><button class="btn ghost" data-act="drxback">돌아가기</button></div>`); }
function draftImportDone(x,load){ if(!x){ toast('초안을 읽지 못했어요. 코드를 끝까지 복사했는지 확인해 주세요'); return; }
  const a=drLib(); let name=x.name, i=2; while(a.some(y=>y.name===name)) name=x.name+' ('+(i++)+')'; a.unshift({id:'d'+uid(),name,at:Date.now(),d:drClean(x.d)}); if(!drLibSave(a)) return;
  if(load){ drLoadFrom(x.d,name); } else { openDraft(); toast(`「${name}」 초안을 보관함에 넣었어요`); } }
function drLibHTML(){ const a=drLib(); return `<div class="dr-lib" id="drLib"><div class="row" style="margin:0 0 6px"><b style="flex:1">저장한 초안 ${a.length}개</b><button class="btn sm" data-act="drlibsave">💾 지금 초안 저장</button></div>
  <div class="row" style="margin:0 0 6px"><button class="btn sm ghost" data-act="drxcur">📤 지금 초안 내보내기</button><button class="btn sm ghost" data-act="drimport">📥 가져오기 (코드·파일)</button></div>
  ${a.length?a.map(x=>`<div class="sw-pjr"><b>${esc(x.name)}</b><i>${new Date(x.at).toLocaleDateString()}</i><button class="btn sm" data-act="drlibload" data-id="${x.id}">불러오기</button><button class="btn sm ghost" data-act="drxlib" data-id="${x.id}">내보내기</button><button class="btn sm ghost" data-act="drlibdel" data-id="${x.id}">✕</button></div>`).join(''):'<p class="muted" style="margin:0;font-size:.8rem">아직 없어요. 지금 초안을 저장해 두면 언제든 이대로 다시 만들 수 있어요.</p>'}</div>`; }
function drLoadFrom(d,label){ try{ appStorage.setItem(DR2KEY,JSON.stringify(drClean(d))); }catch(e){} DRTAB='theme'; openDraft(); toast(`「${label||drName(d)}」 초안을 불러왔어요. 고친 뒤 만들기를 누르면 새 게임으로 만들어져요`); }
function drSave(){ try{ appStorage.setItem(DR2KEY,JSON.stringify(DR2)); }catch(e){} }
function drLen(d){ d=d||DR2; return [d.auto,d.kw,d.tone,d.story,d.world,d.setting,d.hero.name,d.hero.gender,d.hero.look,d.hero.bio,...d.chars.flatMap(c=>[c.name,c.role,c.profile,c.look,c.speech])].reduce((n,s)=>n+String(s||'').length,0); }
function drRead(){ if(!DR2||!$('#drPage')) return; const v=id=>{const e=$('#'+id);return e?(e.type==='checkbox'?e.checked:e.value):undefined;}, set=(k,id,f)=>{const x=v(id); if(x!==undefined) DR2[k]=f?f(x):x;};
  set('auto','dr_auto'); set('gtitle','dr_gtitle'); set('crewTerm','dr_crew',x=>String(x||'').trim().slice(0,8)); set('castSex','dr_cast'); set('kw','ng_kw'); set('tone','ng_tone'); set('theme','ng_theme'); set('n','ng_n',Number); set('style','ng_style'); set('fan','ng_fan'); set('src','ng_src'); set('story','ng_story'); set('stages','ng_stages',Number); set('len','ng_len'); set('depth','ng_depth'); set('newc','ng_newc',Number); set('talkOnly','ng_talkonly',Number); set('world','dr_world'); set('setting','dr_setting');
  document.querySelectorAll('#drPage [data-dc]').forEach(e=>{ const c=DR2.chars[+e.dataset.i]; if(c){c[e.dataset.dc]=e.value;if(e.dataset.dc==='tags')naiBlocksSave(c,'tags',e);} });
  ['name','call','gender','look','bio'].forEach(k=>{ const x=v('dr_h_'+k); if(x!==undefined) DR2.hero[k]=x; }); const hd=v('dr_h_hide'); if(hd!==undefined) DR2.hero.hide=hd;
  drSave(); const c=$('#drCount'); if(c) c.textContent=nf(drLen()); }
function drText(d){ d=d||DR2; const L=[];
  if(d.world.trim()) L.push('[세계관]\n'+d.world.trim());
  if(d.setting.trim()) L.push('[설정: 세력·용어·규칙·비밀]\n'+d.setting.trim());
  if(d.story.trim()) L.push('[스토리 개요]\n'+d.story.trim());
  const cs=d.chars.filter(c=>String(c.name||'').trim()||String(c.profile||'').trim());
  if(cs.length) L.push('[인물]\n'+cs.map((c,i)=>`${i+1}. ${c.name||'(이름 미정)'}${c.role?' — '+c.role:''} (구분: ${c.kind==='npc'?'NPC':(d.crewTerm||'동료')+(c.rank?', 등급 '+RL[c.rank]:'')})\n   성격·과거·관계: ${c.profile||'(비어 있음)'}\n   말투: ${c.speech||'(비어 있음)'}\n   외모: ${c.look||'(비어 있음)'}`).join('\n'));
  const hr=d.hero; if(hr.name||hr.call||hr.gender||hr.look||hr.bio) L.push(`[주인공]\n호칭: ${hr.call||'(AI가 정함)'}\n이름: ${hr.name||'(호칭으로만 부름)'}\n성별·성 정체성: ${hr.gender||'정하지 않음'}\n외모: ${hr.look||'(비어 있음)'}\n설정: ${hr.bio||'(비어 있음)'}`);
  return L.join('\n\n'); }
function drTabHTML(k){ const d=DR2, sec=(id,h)=>`<section data-dr="${id}" ${DRTAB===id?'':'hidden'}>${h}</section>`;
  if(k==='theme') return sec('theme',`<h3 class="sec">테마</h3><p class="muted dr-help">장르, 분위기, 화면 테마, 규모를 정해요. 비워도 되는 칸은 AI가 채워요.</p>
    <label class="f" for="dr_gtitle">게임 이름 (선택 · 비우면 AI가 지어요)</label><input class="in" id="dr_gtitle" maxlength="30" value="${esc(d.gtitle||'')}" placeholder="예: 심연잔향, 어비스 에코">
    <label class="f" for="dr_crew">아군 호칭 <span class="muted" style="font-size:.75rem">(유닛 이름 · 비우면 AI가 새로 지어요)</span></label><input class="in" id="dr_crew" maxlength="8" value="${esc(d.crewTerm||'')}" placeholder="예: 대원, 요원, 사도">
    <label class="f" for="dr_cast">등장인물 성별</label><select class="in" id="dr_cast">${opt([['','AI가 정하기 (키워드에 맞게)'],['f','여성만'],['m','남성만'],['mix','여성 + 남성 혼성']],d.castSex||'')}</select>
    <label class="f" for="ng_kw">장르와 키워드</label><textarea class="in" id="ng_kw" placeholder="예: 정통 판타지. 몰락한 왕국을 되찾는 용병단.">${esc(d.kw)}</textarea>
    <label class="f" for="ng_tone">분위기</label><input class="in" id="ng_tone" value="${esc(d.tone)}" placeholder="예: 진지하고 비장하게">
    <div class="g2"><div><label class="f" for="ng_theme">화면 테마</label><select class="in" id="ng_theme">${opt([['auto','AI가 고르기'],['tactical','택티컬'],['fantasy','판타지'],['neon','네온 사이버'],['pastel','파스텔'],['noir','모노 누아르']],d.theme)}</select></div>
    <div><label class="f" for="ng_n">${esc(d.crewTerm||'동료')} 수 (인물 탭에 적은 인물 포함)</label><select class="in" id="ng_n">${opt([[6,'6명'],[8,'8명'],[10,'10명'],[12,'12명']],d.n)}</select></div></div>
    <label style="display:flex;gap:8px;align-items:center;margin-top:10px"><input type="checkbox" id="ng_fan" ${d.fan?'checked':''} onchange="document.getElementById('ng_srcw').hidden=!this.checked"><span><b>2차 창작</b> <span class="muted" style="font-size:.8rem">(원작 세계관·캐릭터로 만들기)</span></span></label>
    <div id="ng_srcw" ${d.fan?'':'hidden'}><label class="f" for="ng_src">원작 이름</label><input class="in" id="ng_src" value="${esc(d.src)}" placeholder="예: 작품 이름"><p class="muted" style="margin:4px 0 0;font-size:.78rem">원작에서 미성년자·학생인 캐릭터는 넣지 않고 성인 캐릭터만 써요. 개인 감상용으로만 써 주세요.</p></div>
    ${drPresetHTML()}
    <label class="f" for="ng_style">이 게임 그림체 태그 (선택 · 프리셋보다 우선)</label><input class="in" id="ng_style" value="${esc(d.style)}" placeholder="예: dark fantasy, muted colors">
    ${storyFormHTML({plot:d.story,stages:d.stages,len:d.len,depth:d.depth,newc:d.newc,talkOnly:d.talkOnly})}
    <button class="btn sm ghost" data-act="drpolish" data-k="story">✦ 스토리 개요 AI로 다듬기</button>`);
  if(k==='world') return sec('world',`<div class="dr-h"><h3 class="sec">세계관</h3><span class="muted">${nf(d.world.length)}자 / 권장 8,000</span></div><p class="muted dr-help">역사, 사회 구조, 기술이나 마법의 규칙, 지금 벌어지는 갈등, 사람들이 일상에서 겪는 불편까지. 고유명사와 구체적인 디테일이 많을수록 AI가 지어낼 틈이 줄어요. 플레이어에게 숨길 반전은 여기 말고 <b>설정</b> 탭에 '비밀'로 따로 적어 두세요.</p>
    <textarea class="in dr-big" id="dr_world" placeholder="예) 대붕괴 이후 300년. 도시는 운하로 나뉜 일곱 구역으로 이루어져 있고…">${esc(d.world)}</textarea>
    <button class="btn sm ghost" data-act="drpolish" data-k="world">✦ AI로 다듬기</button>`);
  if(k==='setting') return sec('setting',`<div class="dr-h"><h3 class="sec">설정</h3><span class="muted">${nf(d.setting.length)}자</span></div><p class="muted dr-help">세력과 조직, 고유 용어, 전투·능력의 규칙, 그리고 '비밀:'로 시작하는 줄에 숨겨진 진실과 반전을 적어요. 비밀은 AI가 이야기 속에서 천천히 드러내고, 개인 채팅 같은 곳에서는 새지 않게 해요.</p>
    <textarea class="in dr-big" id="dr_setting" placeholder="세력: 운하 길드 — 물길을 쥔 상인 연합…&#10;용어: 잔광 — 대붕괴 때 남은 빛의 파편…&#10;비밀: 길드장은 사실 대붕괴를 일으킨 장본인이다.">${esc(d.setting)}</textarea>
    <button class="btn sm ghost" data-act="drpolish" data-k="setting">✦ AI로 다듬기</button>`);
  if(k==='chars') return sec('chars',`<div class="dr-h"><h3 class="sec">인물</h3><span class="muted">${d.chars.length}명</span></div><p class="muted dr-help">꼭 넣고 싶은 동료을(를) 적어요. 적은 이름과 설정은 그대로 쓰고, 빈 칸과 모자란 인원은 AI가 채워요.</p>
    ${d.chars.map((c,i)=>`<div class="dr-card"><div class="g2" style="margin-bottom:4px"><div><label class="f">구분</label><select class="in" data-dc="kind" data-i="${i}">${opt([['crew',(d.crewTerm||'동료')+' (뽑기·편성 가능)'],['npc','NPC (스토리 조연, 그림만)']],c.kind||'crew')}</select></div><div><label class="f">등급</label><select class="in" data-dc="rank" data-i="${i}" ${c.kind==='npc'?'disabled':''}>${opt([['','AI가 정하기'],['3','SSR'],['2','SR'],['1','R']],c.rank||'')}</select></div></div><div class="g2"><div><label class="f">이름</label><input class="in" data-dc="name" data-i="${i}" value="${esc(c.name||'')}"></div><div><label class="f">역할·한 줄 소개</label><input class="in" data-dc="role" data-i="${i}" value="${esc(c.role||'')}" placeholder="예: 무뚝뚝한 저격수"></div></div>
      <label class="f">성격·과거·관계</label><textarea class="in" data-dc="profile" data-i="${i}">${esc(c.profile||'')}</textarea>
      <div class="g2"><div><label class="f">말투</label><input class="in" data-dc="speech" data-i="${i}" value="${esc(c.speech||'')}" placeholder="예: 짧게 끊는 반말"></div><div><label class="f">외모</label><input class="in" data-dc="look" data-i="${i}" value="${esc(c.look||'')}" placeholder="예: 은발 포니테일, 검은 코트"></div></div>
      <label class="f">외형 프롬프트 <span class="muted" style="font-size:.75rem">(선택 · 그림 AI 영어 태그. 적으면 AI가 바꾸지 않고 그대로 그려요)</span></label><textarea class="in" data-dc="tags" data-i="${i}" style="min-height:52px" placeholder="예: 1girl, solo, silver hair, ponytail, red eyes, black long coat, gloves">${esc(c.tags||'')}</textarea>
      <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-act="drcfill" data-i="${i}">✦ AI로 다듬기</button><button class="btn sm ghost" data-act="drcdel" data-i="${i}">삭제</button></div></div>`).join('')}
    <button class="btn sm" data-act="drcadd">＋ 인물 추가</button>`);
  if(k==='hero') return sec('hero',`<h3 class="sec">주인공</h3>${drHeroHTML()}`);
  return ''; }
let DRAVU=null;
function drHeroHTML(){ const hr=DR2.hero; return `<p class="muted dr-help">플레이어가 될 주인공이에요. 비워 두면 AI가 세계관에 맞게 정해요(글 AI가 없으면 기본 설정으로 시작해요). 시작한 뒤에는 설정 → 플레이어에서 바꿀 수 있어요.</p>
    <div class="g2"><div><label class="f" for="dr_h_call">호칭 <span class="muted" style="font-size:.75rem">(평소에 불리는 말)</span></label><input class="in" id="dr_h_call" maxlength="12" value="${esc(hr.call||'')}" placeholder="예: 지휘관 · 비우면 AI가 정해요"></div><div><label class="f" for="dr_h_name">이름 <span class="muted" style="font-size:.75rem">(필요할 때만)</span></label><input class="in" id="dr_h_name" maxlength="12" value="${esc(hr.name)}" placeholder="비우면 호칭으로만 불려요"></div></div>
    <label class="f" for="dr_h_gender">당신의 성별은? (직접 쓰기)</label><input class="in" id="dr_h_gender" maxlength="40" value="${esc(hr.gender)}" placeholder="예: 남성, 여성, 논바이너리… 비우면 AI가 정해요">
    <label class="f" for="dr_h_look">외모 (직접 쓰기)</label><textarea class="in" id="dr_h_look" maxlength="400" placeholder="예: 검은 단발, 회색 후드티">${esc(hr.look)}</textarea>
    <label class="f" for="dr_h_bio">설정 (성격·과거·직업·능력 등, 선택)</label><textarea class="in" id="dr_h_bio" maxlength="1500" placeholder="예: 기억을 잃고 이세계에 떨어진 평범한 회사원. 요리를 잘한다.">${esc(hr.bio||'')}</textarea>
    <label style="display:flex;gap:8px;align-items:center;margin-top:8px"><input type="checkbox" id="dr_h_hide" ${hr.hide?'checked':''}><span>앞머리로 눈 가리기 <span class="muted" style="font-size:.8rem">(미연시 주인공처럼)</span></span></label>
    <button class="btn sm ghost" data-act="drpolish" data-k="hero" style="margin-top:8px">✦ AI로 다듬기</button>
    ${imgReady()?`<div class="pf-av"><span id="drAvBox">${hr.av&&DRAVU?`<img src="${esc(DRAVU)}" alt="프로필">`:'<span>프로필 그림 없음</span>'}</span><div class="col"><button class="btn sm" data-act="drpfdraw" ${SAMPLE?'':'disabled'}>${hr.av?'다시 그리기':'외모로 프로필 그리기'}</button><span class="muted" style="font-size:.72rem">안 그리면 게임을 만들 때 외모로 같이 그려요</span></div></div>`:''}`; }
async function drAvatarDraw(btn){ drRead(); const hr=DR2.hero; if(!String(hr.look||'').trim()){ toast('외모를 먼저 적어 주세요'); return; } if(!imgReady()){ toast(imgNeed()); return; }
  const lab=btn.textContent; btn.disabled=true; btn.textContent='그리는 중…';
  try{ const tags=await heroTags(hr); if(!tags){ toast('태그를 만들지 못했어요. 다시 눌러 주세요'); return; } const b=await naiDraw('char',tags,{candidateEligible:true,originalSrc:DRAVU||'',frame:'cowboy shot',pose:'looking at viewer'}); await idbPut('draft_avatar',b); if(DRAVU) URL.revokeObjectURL(DRAVU); DRAVU=URL.createObjectURL(b); drRead(); DR2.hero.av=tags; drSave(); drRerender(); toast('프로필 그림을 만들었어요'); }
  catch(e){ toast(naiErr(e)); } finally{ if(btn.isConnected){ btn.disabled=false; btn.textContent=lab; } } }
function drModeHTML(){ return `<div class="dr-modes"><button class="dr-mode" data-act="drmode" data-v="auto"><em>1</em><b>자율주행</b><span>한 줄만 적으면 AI가 세계관·인물·이야기를 모두 만들어요.<br><i>예: 미소녀들만 있는 이세계 판타지.</i></span></button>
    <button class="dr-mode" data-act="drmode" data-v="detail"><em>2</em><b>디테일</b><span>테마·세계관·설정·인물·주인공을 직접 자세히 적어요. 적은 건 그대로 살리고 빈 곳만 AI가 채워요.</span></button></div>`; }
function drAutoHTML(){ const d=DR2; return `<div class="dr-intro"><p><b>자율주행</b> · 만들고 싶은 게임을 한두 줄로 적어요. 나머지는 AI가 알아서 채워요.</p></div>
    <label class="f" for="dr_auto">어떤 게임을 만들까요?</label><textarea class="in" id="dr_auto" style="min-height:90px" placeholder="예: 미소녀들만 있는 이세계 판타지.">${esc(d.auto)}</textarea>
    <div class="chips" style="margin-top:6px">${['미소녀들만 있는 이세계 판타지.','멸망한 도시의 마지막 용병단.','우주 함대의 함장이 되어 동료를 모으는 SF.','요괴와 계약하는 현대 도시 오컬트.'].map(x=>`<button class="chip" data-act="drautoex" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div>
    <label class="f" for="dr_gtitle">게임 이름 (선택 · 비우면 AI가 지어요)</label><input class="in" id="dr_gtitle" maxlength="30" value="${esc(d.gtitle||'')}" placeholder="예: 심연잔향, 어비스 에코">
    <label class="f" for="dr_crew">아군 호칭 <span class="muted" style="font-size:.75rem">(유닛 이름 · 비우면 AI가 새로 지어요)</span></label><input class="in" id="dr_crew" maxlength="8" value="${esc(d.crewTerm||'')}" placeholder="예: 대원, 요원, 사도">
    <label class="f" for="dr_cast">등장인물 성별</label><select class="in" id="dr_cast">${opt([['','AI가 정하기 (키워드에 맞게)'],['f','여성만'],['m','남성만'],['mix','여성 + 남성 혼성']],d.castSex||'')}</select>
    <label class="f" for="ng_n">${esc(d.crewTerm||'동료')} 수</label><select class="in" id="ng_n">${opt([[6,'6명'],[8,'8명'],[10,'10명'],[12,'12명']],d.n)}</select>
    ${drPresetHTML()}
    <details class="optbox" style="margin-top:10px" ${d.hero.name||d.hero.gender||d.hero.look?'open':''}><summary><b>주인공</b> <span class="muted" style="font-size:.8rem">(선택 · 비우면 AI가 정해요)</span></summary>${drHeroHTML()}</details>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="drmake" ${SAMPLE?'':'disabled'}>이 내용으로 새 게임 만들기</button></div>
    ${SAMPLE?'':'<p class="muted" style="font-size:.8rem;margin:6px 0 0">글 AI를 등록하면 만들 수 있어요.</p>'}<p class="muted" id="ng_stat" style="margin:6px 0 0"></p><button class="linkb" data-act="ailog" style="margin-top:4px;font-size:.8rem">🔍 AI 기록 보기 (안 만들어질 때 원인 확인)</button>`; }
function openDraft(tab){ DR2=drLoad(); if(tab) DRTAB=tab;
  if(DR2.hero.av&&!DRAVU){ idbGet('draft_avatar').then(b=>{ if(b){ DRAVU=URL.createObjectURL(b); const x=$('#drAvBox'); if(x) x.innerHTML=`<img src="${esc(DRAVU)}" alt="프로필">`; } }).catch(()=>{}); }
  const top=`<div class="dr-top"><button class="x" data-act="close" aria-label="닫기">‹</button><div><i>NEW GAME</i><h2>새 게임 초안</h2></div><button class="btn sm ghost" data-act="drlib" style="margin-left:auto">📂 초안 보관함</button>${DR2.mode?`<button class="btn sm ghost" data-act="drmode" data-v="">${DR2.mode==='auto'?'1. 자율주행':'2. 디테일'} · 바꾸기</button>`:''}</div>${DR2.reuse?`<div class="optbox dr-reuse" style="margin:0 0 8px;font-size:.82rem">🎲 <b>그림 유지 리롤</b> · 「${esc(DR2.reuse.title||'')}」의 ${esc(T('crew'))}·NPC·배경 그림을 <b>이름이 같은 인물·배경</b>에 그대로 써요. 이름을 바꾸거나 새 인물을 넣으면 그 인물만 새로 그려요. 원래 게임은 그대로 남아요. <button class="linkb" type="button" data-act="drreuseoff">그림 새로 그리기로 바꾸기</button></div>`:''}`;
  if(!DR2.mode){ openModal(`<div id="drPage" class="dr-page">${top}<p class="muted" style="margin:0 0 10px">어떻게 만들까요? 지금 게임은 그대로 남아요.</p>${drModeHTML()}</div>`,false,'cs-sheet dr-sheet'); return; }
  if(DR2.mode==='auto'){ openModal(`<div id="drPage" class="dr-page">${top}${drAutoHTML()}</div>`,false,'cs-sheet dr-sheet'); return; }
  openModal(`<div id="drPage" class="dr-page">${top}
    <div class="dr-intro"><p class="muted" style="margin:0">적은 내용은 그대로 살리고, 빈 곳만 AI가 채워요.</p>
      <p class="muted" style="margin:6px 0">전체 <b id="drCount">${nf(drLen())}</b>자</p>
      <div class="row"><button class="btn" data-act="drmake" ${SAMPLE?'':'disabled'}>이 설정으로 새 게임 만들기</button><button class="btn sm ghost" data-act="drmanual" title="글 AI 없이 적은 내용 그대로 게임을 만들어요">✍ AI 없이 직접 시작</button><button class="btn sm ghost" data-act="drdedup" title="AI 없이, 여러 칸에 똑같이 들어 있는 문장을 한 번만 남겨요">🧹 겹치는 문장 정리</button><button class="btn sm ghost" data-act="drharmony" ${SAMPLE?'':'disabled'}>✦ 전체를 서로 맞춰 다듬기</button>${DR2.undo?`<button class="btn sm ghost" data-act="drundo">↶ 되돌리기 (${esc(DR2.undo.label||'')})</button>`:''}<button class="btn sm ghost" data-act="drpreview">AI에 들어가는 설정 보기</button><button class="btn sm ghost" data-act="drclear">초안 비우기</button></div>
      ${SAMPLE?'':'<p class="muted" style="font-size:.8rem;margin:6px 0 0">글 AI 없이도 「✍ AI 없이 직접 시작」으로 적은 내용 그대로 게임을 만들 수 있어요. 나중에 글 AI를 등록하면 써 둔 내용을 바탕으로 다듬어요.</p>'}<p class="muted" id="ng_stat" style="margin:6px 0 0"></p><button class="linkb" data-act="ailog" style="margin-top:4px;font-size:.8rem">🔍 AI 기록 보기 (안 만들어질 때 원인 확인)</button></div>
    <div class="chips dr-tabs">${DR_TABS.map(([k,l])=>`<button class="chip ${DRTAB===k?'on':''}" data-act="drtab" data-k="${k}">${l}</button>`).join('')}</div>
    ${DR_TABS.map(([k])=>drTabHTML(k)).join('')}</div>`,false,'cs-sheet dr-sheet'); }
// 다시 그리기 전에 부르는 쪽에서 drRead()를 먼저 해요(여기서 읽으면 방금 바꾼 값이 옛 입력칸 값으로 덮여요)
function drRerender(){ const sc=$('#modal .sheet'), y=sc?sc.scrollTop:0; openDraft(); const s2=$('#modal .sheet'); if(s2) s2.scrollTop=y; }
document.addEventListener('input',e=>{ if(e.target.closest&&e.target.closest('#drPage')){ clearTimeout(drRead._t); drRead._t=setTimeout(drRead,400); } });
document.addEventListener('change',e=>{ const cy=e.target&&e.target.dataset&&e.target.dataset.cyc; if(cy){ const L=P().live; L.cyc=Object.assign({},L.cyc||{},{[cy]:+e.target.value}); mark('prog'); render(); toast(`${cycLabel(cy)} 주기로 바꿨어요`); return; } });
document.addEventListener('change',e=>{ if(e.target.closest&&e.target.closest('#drPage')){ drRead(); if(e.target.dataset&&e.target.dataset.dc==='kind') drRerender(); } });
// 장르·키워드와 분위기에 같은 글이 들어 있으면(한쪽이 다른 쪽을 품으면) 분위기는 한 번만 써요
const dupTxt=(a,b)=>{ const n=x=>String(x||'').replace(/[\s"'“”‘’.,!?~·…]/g,''); a=n(a); b=n(b); return !!(a&&b&&(a.includes(b)||b.includes(a))); };
function drTheme(d){ return [d.gtitle&&'게임 이름: '+d.gtitle,d.kw&&'장르·키워드: '+d.kw,d.tone&&!dupTxt(d.kw,d.tone)&&'분위기: '+d.tone,d.fan&&d.src&&'2차 창작 원작: '+d.src].filter(Boolean); }
const DR_NODUP='모든 항목(세계관·설정·스토리 개요·인물·주인공)에서 같은 문장·소개 문구·설명을 두 번 쓰지 않는다. 항목마다 자기 역할의 내용만 쓰고, 다른 항목에 이미 있는 문장·소개 문구를 그대로 되풀이하지 않는다(세계관은 무대와 역사, 설정은 세력·용어·규칙, 스토리 개요는 사건의 흐름, 인물은 그 사람 이야기).';
/* 중복 문장 정리(시스템, AI 없이): 앞 칸에 이미 나온 문장과 같거나 그 문장 안에 통째로 들어 있는 문장은 뒤 칸에서 지워요.
   같은 칸 안에서 되풀이된 문장도 지워요. 더 긴 문장이 짧은 문장을 품으면 긴 문장은 남겨요(내용이 줄지 않게) */
const sentKey=x=>String(x||'').replace(/[\s"'“”‘’「」『』()\[\].,!?~·…:;\-–—]/g,'').toLowerCase();
function dedupText(text,seen,min){ min=min||8; let cut=0; const out=String(text||'').split('\n').map(line=>{ const m=line.match(/^(\s*(?:[-*•]|\d+[.)])?\s*(?:비밀\s*:)?\s*)/), pre=m?m[1]:''; const parts=line.slice(pre.length).split(/(?<=[.!?。…])\s+/);
    const keep=parts.filter(sn=>{ const k=sentKey(sn); if(k.length<min) return true; if(seen.some(x=>x===k||x.includes(k))){ cut++; return false; } seen.push(k); return true; });
    if(!keep.length&&parts.some(x=>x.trim())) return null; return pre+keep.join(' '); }).filter(l=>l!==null).join('\n').replace(/\n{3,}/g,'\n\n').trim(); return {text:out,cut}; }
function drDedup(d){ d=d||DR2; const seen=[]; let n=0; const run=(o,k)=>{ if(!o||!String(o[k]||'').trim()) return; const r=dedupText(o[k],seen); if(r.cut){ o[k]=r.text; n+=r.cut; } };
  if(dupTxt(d.kw,d.tone)){ d.tone=''; n++; } run(d,'kw'); run(d,'tone'); run(d,'world'); run(d,'setting'); run(d,'story'); run(d.hero,'bio'); (d.chars||[]).forEach(c=>{ run(c,'role'); run(c,'profile'); });
  return n; }
// 초안의 다른 칸을 함께 보여 줘서 서로 맞춰 다듬어요(skip: 'world'|'setting'|'story'|'c:번호')
function drCtx(skip){ const d=DR2, L=[];
  const th=drTheme(d).map(x=>x.startsWith('2차 창작')?x+' (원작 설정을 따르고, 원작의 미성년자·학생 캐릭터는 쓰지 않는다)':x);
  if(th.length) L.push('[테마]\n'+th.join('\n'));
  if(skip!=='world'&&d.world.trim()) L.push('[세계관]\n'+d.world.trim().slice(0,6000));
  if(skip!=='setting'&&d.setting.trim()) L.push('[설정: 세력·용어·규칙·비밀]\n'+d.setting.trim().slice(0,4000));
  if(skip!=='story'&&d.story.trim()) L.push('[스토리 개요]\n'+d.story.trim().slice(0,3000));
  const cs=d.chars.map((c,i)=>[c,i]).filter(([c,i])=>skip!=='c:'+i&&(String(c.name||'').trim()||String(c.profile||'').trim()));
  if(cs.length) L.push('[다른 인물]\n'+cs.map(([c])=>`- ${c.name||'(이름 미정)'}${c.role?' — '+c.role:''}: ${String(c.profile||'').slice(0,300)}${c.speech?' / 말투: '+c.speech:''}${c.look?' / 외모: '+c.look:''}`).join('\n'));
  const hr=d.hero; if(skip!=='hero'&&(hr.name||hr.call||hr.gender||hr.look||hr.bio)) L.push(`[주인공(플레이어)]\n호칭: ${hr.call||'(미정)'} / 이름: ${hr.name||'(미정)'} / 성별: ${hr.gender||'정하지 않음'}${hr.look?' / 외모: '+hr.look:''}${hr.bio?'\n설정: '+hr.bio:''}`);
  return L.length?'\n초안의 다른 항목(이것들과 어긋나지 않게 맞추고, 여기 나온 고유명사·세력·인물 관계를 적극적으로 엮는다. 다른 항목은 고치지 않는다):\n'+L.join('\n\n')+'\n':''; }
function drSnap(label){ const d=DR2; d.undo={label,kw:d.kw,tone:d.tone,world:d.world,setting:d.setting,story:d.story,chars:JSON.parse(JSON.stringify(d.chars)),hero:JSON.parse(JSON.stringify(Object.assign({},d.hero,{av:undefined})))}; }
async function drPolish(k,btn){ drRead(); if(k==='hero') return drPolishHero(btn); const cur=String(DR2[k]||'').trim(); if(!cur){ toast('먼저 내용을 조금 적어 주세요'); return; }
  const what=k==='world'?'게임 세계관':k==='story'?'스토리 개요':'게임 설정(세력·용어·규칙·비밀)';
  const r=await aiJSON(`다음은 작가가 직접 쓴 ${what}이다. 적힌 내용, 고유명사, 설정은 그대로 살린다. 모순을 고치고, 빈약한 부분을 구체적인 디테일로 채우고, 읽기 좋게 정리한다. 같은 문장·소개 문구가 되풀이되면 한 번만 남기고, 다른 항목에 이미 있는 문장을 그대로 옮겨 쓰지 않는다. 작가가 정하지 않은 큰 설정을 새로 바꾸지는 않는다. 등장인물은 모두 성인이다. 한국어로 쓴다.
${k==='setting'?"'비밀:'로 시작하는 줄은 그 표시를 유지한다.\n":''}${drCtx(k)}원문(다듬을 글):
${cur}
JSON만 출력: {"text":"다듬은 전체 글"}`,btn,'default');
  if(r&&r.text){ drRead(); drSnap(what); DR2[k]=String(r.text); const dn=drDedup(); drSave(); drRerender(); toast('다른 항목에 맞춰 다듬었어요'+(dn?` (겹치는 문장 ${dn}개 정리)`:'')+'. 마음에 안 들면 「되돌리기」'); } }
async function drPolishHero(btn){ const h=DR2.hero;
  const r=await aiJSON(`새 게임의 주인공(플레이어)을 다듬어라. 호칭·이름·성별·외모·설정이 서로 맞물리고, 세계관 안에서 주인공의 자리(직책, 소속, 사연)와 인물들과의 관계가 드러나게 한다. 적힌 내용과 이름은 살리고, 어색한 곳을 고치고, 빈 칸은 다른 항목에 맞춰 채운다. 성별을 비워 두었으면 비워 둔다. 성인이다. 한국어로 쓴다.
${drCtx('hero')}지금 주인공: ${JSON.stringify({call:h.call||'',name:h.name||'',gender:h.gender||'',look:h.look||'',bio:h.bio||''})}
JSON만 출력: {"call":"호칭(2~4자)","name":"이름(비어 있었으면 빈 문자열)","look":"외모","bio":"설정 3~5문장"}`,btn,'default');
  if(!r||typeof r!=='object') return; drRead(); drSnap('주인공'); const S=v=>typeof v==='string'?v.trim():''; const H=DR2.hero;
  if(S(r.call)) H.call=S(r.call).slice(0,12); if(S(r.name)&&!String(H.name||'').trim()) H.name=S(r.name).slice(0,12); if(S(r.look)) H.look=S(r.look).slice(0,400); if(S(r.bio)) H.bio=S(r.bio).slice(0,1500);
  drDedup(); drSave(); drRerender(); toast('주인공을 다듬었어요. 마음에 안 들면 「되돌리기」'); }
/* 전체 맞추기: 세계관·설정·스토리·인물·주인공 설정을 한꺼번에 보고, 서로 어긋난 곳을 고치고 관계를 엮어요. 적힌 내용은 살리고, 한 번 되돌릴 수 있어요 */
async function drHarmony(btn){ drRead(); const d=DR2; if(!drText(d).trim()){ toast('먼저 세계관이나 인물을 조금 적어 주세요'); return; }
  const r=await aiJSON(`다음은 작가가 쓴 새 게임 초안이다. 세계관·설정·스토리 개요·인물·주인공이 서로를 참고해 하나의 이야기로 맞물리도록 다듬어라.
규칙: 작가가 적은 내용·고유명사·이름은 그대로 살린다. 항목끼리 어긋나는 곳(세력 이름, 지명, 연표, 관계)은 맞춘다. 인물은 세계관의 세력·사건에 자리를 잡게 하고, 인물끼리·주인공과의 관계를 서로 맞게(한쪽에 적힌 관계는 상대 쪽에도) 넣는다. 비어 있는 칸은 다른 항목에 맞춰 채운다. 비어 있던 항목(세계관·설정·스토리)은 빈 문자열로 둔다. 큰 설정을 새로 바꾸지 않는다. 설정의 '비밀:' 줄은 유지한다. 등장인물은 모두 성인이다. 한국어로 쓴다.
${DR_NODUP}
테마도 정리한다: kw(장르와 키워드)는 장르와 핵심 키워드만 짧게(예: "학원 판타지 활극. 기숙사 대항전, 검술, 우정"), tone(분위기)은 글의 톤과 감정선만 한 줄로(예: "밝고 떠들썩하게, 때때로 뭉클하게") 쓴다. 두 칸에 같은 문장을 넣지 않고, 홍보 문구 같은 긴 소개 문장은 세계관 쪽으로 옮긴다. 작가가 적은 핵심 단어는 살린다.
장르와 키워드(지금): ${d.kw||'(비어 있음)'}
분위기(지금): ${!d.tone?'(비어 있음)':dupTxt(d.kw,d.tone)?'(장르와 키워드와 같은 글이 들어 있음 — 분위기만 새로 뽑아 쓴다)':d.tone}
${drTheme(d).filter(x=>!/^장르|^분위기/.test(x)).join('\n')}
${drText(d).slice(0,20000)}
JSON만 출력: {"kw":"장르와 키워드","tone":"분위기","world":"세계관 전체 글","setting":"설정 전체 글","story":"스토리 개요 전체 글","chars":[{"name":"","role":"","profile":"","speech":"","look":""}],"heroBio":"주인공 설정"} — chars는 위 인물 순서 그대로, 같은 수로.`,btn,'complex');
  if(!r||typeof r!=='object'){ return; } drRead();
  drSnap('전체 맞추기');
  const S=v=>typeof v==='string'?v.trim():'';
  ['world','setting','story'].forEach(k=>{ if(String(d[k]||'').trim()&&S(r[k])) d[k]=S(r[k]); });
  if(String(d.kw||'').trim()&&S(r.kw)) d.kw=S(r.kw).slice(0,400); if(String(d.tone||'').trim()&&S(r.tone)) d.tone=S(r.tone).slice(0,200);
  const rc=Array.isArray(r.chars)?r.chars:[]; d.chars.forEach((c,i)=>{ const o=rc[i]||rc.find(x=>x&&x.name&&x.name===c.name); if(!o) return; ['role','profile','speech','look'].forEach(k=>{ if(S(o[k])) c[k]=S(o[k]); }); if(!String(c.name||'').trim()&&S(o.name)) c.name=S(o.name); });
  if(String(d.hero.bio||'').trim()&&S(r.heroBio)) d.hero.bio=S(r.heroBio);
  const dn=drDedup(d); drSave(); drRerender(); toast('서로 맞춰 다듬었어요'+(dn?` (겹치는 문장 ${dn}개 정리)`:'')+'. 마음에 안 들면 「되돌리기」'); }
async function drFillChar(i,btn){ drRead(); const c=DR2.chars[i]; if(!c) return;
  const r=await aiJSON(`게임에 들어갈 인물 한 명을 다듬어라. 이름·역할·성격·과거·관계·말투·외모가 서로 맞물려 한 사람으로 읽히게 한다(예: 과거가 성격과 말투를 만들고, 역할과 외모가 그 과거를 드러낸다). 세계관의 세력·사건 안에 자리를 잡게 하고, 다른 인물·주인공과의 관계를 구체적으로 넣는다(다른 인물 쪽에 이 인물과의 관계가 적혀 있으면 그것과 맞춘다). 다른 인물과 역할·말투·외모가 겹치지 않게 하고, 세계관·설정이나 다른 인물 칸에 이미 있는 문장을 그대로 옮겨 쓰지 않는다. 작가가 적은 이름과 핵심 설정은 그대로 살리고, 어색한 곳을 고치고, 빈 칸은 채운다. 등장인물은 모두 성인이다. 한국어로 쓴다.
${drCtx('c:'+i)}지금 인물: ${JSON.stringify({name:c.name||'',role:c.role||'',profile:c.profile||'',speech:c.speech||'',look:c.look||''})}
JSON만 출력: {"name":"","role":"한 줄 소개","profile":"성격·과거·관계 3~5문장","speech":"말투 설명과 예시 한 마디","look":"외모"}`,btn,'default');
  if(!r) return; let o=Array.isArray(r)?r[0]:r; if(o&&!o.profile&&!o.role){ const v=Object.values(o).find(x=>x&&typeof x==='object'&&!Array.isArray(x)); if(v) o=v; } if(!o||typeof o!=='object'){ toast('AI 응답을 읽지 못했어요. 다시 눌러 주세요'); return; }
  drRead(); const c2=DR2.chars[i]||c; drSnap((c2.name||'인물')+' 다듬기'); const S=v=>Array.isArray(v)?v.join(' ').trim():typeof v==='string'?v.trim():'';
  const RK=/\s*[\[(【]\s*(SSR|SR|R)\s*[\])】]\s*/gi; let rk=''; ['role','profile','speech','look'].forEach(k=>{ let v=S(o[k]); if(!v) return; v=v.replace(RK,(m,g)=>{ rk=rk||g.toUpperCase(); return ' '; }).replace(/\s{2,}/g,' ').trim(); if(v) c2[k]=v; }); if(rk&&!c2.rank&&c2.kind!=='npc') c2.rank=({SSR:3,SR:2,R:1})[rk]; if(!String(c2.name||'').trim()&&S(o.name)) c2.name=S(o.name).replace(RK,' ').trim();
  drDedup(); drSave(); drRerender(); toast(`${c2.name||'인물'}을(를) 다듬었어요. 마음에 안 들면 「되돌리기」`); }

let FACESEL=new Set();
// 얼굴 범위 칠하기: 그림 위에 칠한 곳만 다시 그려요(인페인팅). 흰색=다시 그릴 곳
function fitDims(iw,ih){ const A=832*1216, r=iw/ih; let w=Math.sqrt(A*r), h=w/r; w=Math.max(512,Math.round(w/64)*64); h=Math.max(512,Math.round(h/64)*64); return [w,h]; }
async function openMaskPainter(src,prev,cb,po){ po=po||{}; const im=await loadImg(src), [W,H]=fitDims(im.naturalWidth||im.width,im.naturalHeight||im.height);
  const mk=document.createElement('canvas'); mk.width=W; mk.height=H; const mx=mk.getContext('2d'); mx.fillStyle='#000'; mx.fillRect(0,0,W,H);
  if(prev){ try{ const pm=await loadImg(prev); mx.drawImage(pm,0,0,W,H); }catch(e){ quietErr(e,'0260-new-game-draft.js:205'); } }
  const d=document.createElement('div'); d.className='mpaint';
  d.innerHTML=`<div class="mp-bar"><b>${esc(po.title||'얼굴 범위 칠하기')}</b><button type="button" data-m="brush" class="on">✎ 칠하기</button><button type="button" data-m="erase">⌫ 지우개</button><label>크기 <input type="range" min="8" max="120" value="40"></label><button type="button" data-m="auto">얼굴 자동</button><button type="button" data-m="clear">비우기</button><span class="mp-sp"></span><button type="button" data-m="cancel">취소</button><button type="button" data-m="save" class="ok">저장</button></div>
    <div class="mp-stage"><canvas></canvas></div><p class="mp-tip">바꾸고 싶은 얼굴 부분(눈·눈썹·입)을 빨갛게 칠해 주세요. 머리카락·옷은 칠하지 않는 게 좋아요. 한 번 저장하면 모든 표정에 같이 써요.</p>`;
  document.body.appendChild(d);
  const cv=d.querySelector('canvas'), x=cv.getContext('2d'), stage=d.querySelector('.mp-stage');
  const fit=()=>{ const sw=stage.clientWidth-16, sh=stage.clientHeight-16, s=Math.min(sw/W,sh/H); cv.width=Math.round(W*s); cv.height=Math.round(H*s); draw(); };
  const tint=document.createElement('canvas'); tint.width=W; tint.height=H; const tx=tint.getContext('2d');
  const draw=()=>{ x.clearRect(0,0,cv.width,cv.height); x.fillStyle='#ddd'; x.fillRect(0,0,cv.width,cv.height); x.drawImage(im,0,0,cv.width,cv.height);
    tx.clearRect(0,0,W,H); tx.drawImage(mk,0,0); tx.globalCompositeOperation='source-in'; tx.fillStyle='rgba(255,40,80,1)'; tx.fillRect(0,0,W,H); tx.globalCompositeOperation='source-over';
    const id=mx.getImageData(0,0,W,H).data, t=tx.getImageData(0,0,W,H); for(let i=0;i<id.length;i+=4){ t.data[i+3]=id[i]>127?140:0; } tx.putImageData(t,0,0); x.drawImage(tint,0,0,cv.width,cv.height); };
  let mode='brush', size=40, down=false, last=null;
  const pt=e=>{ const r=cv.getBoundingClientRect(); return [(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H]; };
  const stroke=(a,b)=>{ mx.strokeStyle=mode==='erase'?'#000':'#fff'; mx.lineWidth=size*W/cv.width; mx.lineCap='round'; mx.beginPath(); mx.moveTo(a[0],a[1]); mx.lineTo(b[0],b[1]); mx.stroke(); };
  cv.addEventListener('pointerdown',e=>{ down=true; cv.setPointerCapture(e.pointerId); last=pt(e); stroke(last,last); draw(); });
  cv.addEventListener('pointermove',e=>{ if(!down) return; const p=pt(e); stroke(last,p); last=p; draw(); });
  cv.addEventListener('pointerup',()=>{ down=false; }); cv.addEventListener('pointercancel',()=>{ down=false; });
  d.querySelector('input[type=range]').addEventListener('input',e=>{ size=+e.target.value; });
  d.querySelector('.mp-bar').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; const m=b.dataset.m;
    if(m==='brush'||m==='erase'){ mode=m; d.querySelectorAll('[data-m=brush],[data-m=erase]').forEach(q=>q.classList.toggle('on',q===b)); }
    else if(m==='clear'){ mx.fillStyle='#000'; mx.fillRect(0,0,W,H); draw(); }
    else if(m==='auto'){ const tall=H/W>1.25; mx.fillStyle='#fff'; mx.beginPath(); mx.ellipse(W*0.5,H*(tall?0.12:0.24),W*(tall?0.1:0.16),H*(tall?0.055:0.11),0,0,Math.PI*2); mx.fill(); draw(); toast('얼굴 위치를 대충 칠했어요. 맞지 않으면 고쳐 주세요'); }
    else if(m==='cancel'){ d.remove(); if(po.onCancel) po.onCancel(); }
    else if(m==='save'){ const id=mx.getImageData(0,0,W,H).data; let n=0; for(let i=0;i<id.length;i+=4) if(id[i]>127) n++; if(!n){ toast('얼굴 부분을 먼저 칠해 주세요'); return; } d.remove(); cb(mk.toDataURL('image/png')); } });
  addEventListener('resize',fit,{once:false}); setTimeout(fit,30); }
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
async function faceDrawOne(c,F,f,ko,b,O,x,generationMode='automatic'){const game=G,project=PJ().active;x=x||''; const en=(FACE_PRESETS.find(p=>p[0]===ko)||[])[1]||'happy', ft=FACE_TAGS[en]||en, ew=[1.7,1.5,1.35,1.2][O.lv]||1.5, i2s=[0.72,0.64,0.56,0.48][O.lv]||0.6, emph=`${ew}::${ft}::, 1.2::expressive face::`;
  const basePr=F===c?c.naiPrompt:(F.prompt||c.naiPrompt), upO=faceUpperObj(c,F), srcO=b==='up'?upO:F, src=imgSrcRaw(srcO), frame=b==='up'?'cowboy shot':c.naiFrame, candidateEligible=imageCandidateEligible('face',b==='up'?f.up:f,c,generationMode),originalSrc=imgSrcRaw(b==='up'?f.up:f)||''; let blob;
  const refs=O.ref?[{image:await refImage(imgSrcRaw(F)||upO&&imgSrcRaw(upO)),type:'character',strength:1,fidelity:1}]:undefined;
  if(O.m==='inpaint') blob=await focusedInpaint(src,F.faceMask[b],(img,msk,tw,th,candidate)=>{ const pz=composeNai('char',candidate.prompt||joinTags(basePr,emph,x),{styleId:c.naiStyle,frame:'portrait, face focus',pose:''}); return naiGenerate(pz.input,'char',{candidateBypass:true,seed:candidate.seed,neg:joinTags(pz.neg,'blurry, deformed face'),model:O.model,refs,size:[tw,th],noCut:true,noTp:true,inpaint:{image:img,mask:msk,strength:1,addOrig:false}}); },{candidateEligible,originalSrc,prompt:joinTags(basePr,emph,x)});
  else if(O.m==='raw') blob=await naiDraw('char',joinTags(basePr,emph,x),{candidateEligible,originalSrc,frame,pose:c.naiPose||undefined,styleId:c.naiStyle,model:O.model,seed:srcO.seed!=null?srcO.seed:undefined});
  else if(O.m==='emo') blob=await naiEmotion(src,en,x,O.lv,candidateEligible,originalSrc);
  else { const im=await loadImg(src), [w,h]=fitDims(im.naturalWidth||im.width,im.naturalHeight||im.height); blob=await naiDraw('char',joinTags(basePr,emph,x),{candidateEligible,originalSrc,frame,pose:c.naiPose||undefined,styleId:c.naiStyle,model:O.model,refs,size:[w,h],seed:srcO.seed!=null?srcO.seed:undefined,img2img:{image:await imgB64(src,w,h,'#ffffff'),strength:i2s,noise:0.05}}); }
  if(G!==game||PJ().active!==project)throw Error('게임이 바뀌어 표정 생성을 중단했습니다');
  if(b==='up'){ f.up=f.up||{id:'fu'+f.id,name:ko+' 상반신',img:null}; await storeImage(f.up,blob,''); } else await storeImage(f,blob,'');
  mark('c:'+c.id); }
function faceUpperObj(c,F){ return F===c?(c.upper&&imgSrc(c.upper)?c.upper:null):(F.upper&&imgSrc(F.upper)?F.upper:null); }
function openFaces(id,sid){
  const c=charById(id); if(!c) return; if($('#ov').hidden) MBACK=()=>openChar(id); if(sid!==undefined) FACET={cid:id,sid:sid||''}; else if(FACET.cid!==id) FACET={cid:id,sid:''};
  const F=faceTgt(c), names=[...new Set([...FACE_BASIC,...F.faces.map(f=>f.name)])], up=faceUpperObj(c,F), mk=F.faceMask||{}, cm=naiCfg().model||NAI_DEF.model;
  FACEOPT=FACEOPT||{m:'inpaint',body:'both',model:/^nai-diffusion-5/.test(cm)?cm:'nai-diffusion-5-full',ref:false,lv:1};
  const thumb=(o,l)=>`<span>${o&&imgSrcRaw(o)?`<img src="${esc(imgSrcRaw(o))}" alt="">`:'<i class="fc-empty">없음</i>'}${l}</span>`;
  openModal(`${head(`${esc(c.name)} 표정`,`<span class="muted">${F===c?'기본 모습':esc(T('skin'))+' 「'+esc(F.name)+'」'}</span>`)}
    ${(c.skins||[]).length?`<div class="chips" style="margin:0 0 8px"><button class="chip ${F===c?'on':''}" data-act="facetgt" data-id="${esc(id)}" data-s="">기본</button>${c.skins.map(k=>`<button class="chip ${F===k?'on':''}" data-act="facetgt" data-id="${esc(id)}" data-s="${k.id}">${esc(T('skin'))}: ${esc(k.name)}</button>`).join('')}</div>`:''}
    <div class="fc-grid">${names.map(nm=>{ const f=F.faces.find(x=>x.name===nm); return `<div class="fc-it"><div class="fc-two">${thumb(f,'전신')}${thumb(f&&f.up,'상반신')}</div><b>${esc(nm)}</b><div class="row"><button class="btn sm ghost" data-act="faceup" data-id="${esc(id)}" data-v="${esc(nm)}">전신 ${f&&imgSrc(f)?'바꾸기':'넣기'}</button><button class="btn sm ghost" data-act="faceup" data-id="${esc(id)}" data-v="${esc(nm)}" data-b="up">상반신 ${f&&f.up&&imgSrc(f.up)?'바꾸기':'넣기'}</button>${f?`<button class="btn sm ghost" data-act="facedel" data-id="${esc(id)}" data-v="${esc(nm)}">✕</button>`:''}</div></div>`; }).join('')}</div>
    <div class="row" style="margin-top:8px"><input class="in" id="fc_new" placeholder="새 표정 이름 (예: 삐짐)" style="flex:1"><button class="btn sm" data-act="faceupnew" data-id="${esc(id)}">이 이름으로 넣기</button><button class="btn sm ghost" data-act="faceupmany" data-id="${esc(id)}">여러 장 넣기</button></div>
    <h4 class="sec">NovelAI로 만들기</h4>
    ${imgSrcRaw(F)?'':`<p class="muted">먼저 ${F===c?'기본':'이 '+esc(T('skin'))+'의'} 스탠딩이 있어야 해요.</p>`}
    <div class="row" style="margin:0 0 6px"><button class="btn sm ghost" data-act="facebasic">기본 6종 고르기 (${FACE_BASIC.join('·')})</button></div>
    <div class="chips">${FACE_PRESETS.map(([ko])=>`<button class="chip ${FACESEL.has(ko)?'on':''}" data-act="facesel" data-v="${ko}" data-id="${id}">${ko}${F.faces.some(f=>f.name===ko&&imgSrc(f))?' ✓':''}</button>`).join('')}</div>
    <div class="g2"><div><label class="f" for="fc_m">만드는 방법</label><select class="in" id="fc_m">${opt([['inpaint','얼굴만 다시 그리기 (인페인팅 · 추천)'],['raw','감정을 넣어 새로 그리기 (V5 전용, 같은 시드)'],['i2i','스탠딩을 바탕으로 다시 그리기 (img2img)'],['emo','NAI 표정 변환 (변화가 약할 수 있음)']],FACEOPT.m)}</select></div>
      <div><label class="f" for="fc_body">그릴 그림</label><select class="in" id="fc_body">${opt([['both','전신 + 상반신'],['full','전신만'],['up','상반신만']],FACEOPT.body)}</select></div></div>
    <div class="g2"><div><label class="f" for="fc_model">그림 모델</label><select class="in" id="fc_model">${opt(NAI_MODELS.filter(m=>/^nai-diffusion-(5|4-5)/.test(m[0])),FACEOPT.model)}</select></div>
      <div><label class="f" for="fc_lv">변화 강도</label><select class="in" id="fc_lv">${opt([[0,'강하게'],[1,'조금 강하게'],[2,'보통'],[3,'약하게']],FACEOPT.lv)}</select></div></div>
    <label class="f" style="margin-top:6px"><input type="checkbox" id="fc_ref" ${FACEOPT.ref?'checked':''}> 캐릭터 레퍼런스도 함께 (얼굴을 더 똑같이 · V4.5로 그려져요)</label>
    <div class="optbox" style="margin-top:6px"><b style="font-size:.85rem">얼굴 범위 (인페인팅용)</b> <span class="muted" style="font-size:.76rem">한 번 칠해 두면 모든 표정에 같이 써요</span>
      <div class="row" style="margin-top:6px"><button class="btn sm ${mk.full?'':'ghost'}" data-act="facemask" data-id="${esc(id)}" data-b="full" ${imgSrcRaw(F)?'':'disabled'}>${mk.full?'✓ ':''}전신에 칠하기</button><button class="btn sm ${mk.up?'':'ghost'}" data-act="facemask" data-id="${esc(id)}" data-b="up" ${up?'':'disabled'}>${mk.up?'✓ ':''}상반신에 칠하기</button>${up?'':'<span class="muted" style="font-size:.74rem">상반신 그림이 없어요</span>'}</div></div>
    <label class="f" for="fc_x">추가 프롬프트 (선택)</label><input class="in" id="fc_x" placeholder="예: blush, teary eyes">
    <p class="muted" id="fc_stat"></p>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="facego" data-id="${id}">선택한 표정 만들기</button></div>`);
}
let FACEOPT=null;
function faceOptRead(){ if(!$('#fc_m')) return; FACEOPT={m:$('#fc_m').value,body:$('#fc_body').value,model:$('#fc_model').value,ref:$('#fc_ref').checked,lv:+$('#fc_lv').value}; }
function openSkin(id){
  const c=charById(id); MBACK=()=>openChar(id);
  openModal(`${head(`${esc(c.name)} ${T('skin')} 만들기`)}
    <p class="muted">기본은 설정의 모델(V5 Full 권장)로 투명 배경 스탠딩을 그려요. 얼굴을 원본과 더 똑같이 맞추고 싶으면 아래에서 캐릭터 레퍼런스를 켜세요(V4.5로 그려지고 흰 배경을 지워요).</p>
    <label class="f" for="sk_name">${T('skin')} 이름</label><input class="in" id="sk_name" placeholder="예: 축제 유카타">
    <label class="f" for="sk_idea">의상 아이디어</label><input class="in" id="sk_idea" placeholder="예: 남색 유카타, 머리에 꽃장식, 손에 종이 등불">
    <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="aiskin" data-id="${id}">AI로 프롬프트 쓰기</button></div>
    <label class="f" for="sk_prompt">NAI 프롬프트</label><textarea class="in" id="sk_prompt" placeholder="1girl, solo, ..." data-nai-blocks="${esc(JSON.stringify({...naiBlocksOf(c),outfit:'',combined:naiBlocksJoin({...naiBlocksOf(c),outfit:''})}))}">${esc(naiBlocksJoin({...naiBlocksOf(c),outfit:''}))}</textarea>
    <label class="f" for="sk_pose">자세</label><select class="in" id="sk_pose">${naiCfg().poses.map(p=>`<option value="${esc(p.t)}" ${p.t===(c.naiPose||NAI_FRONT)?'selected':''}>${esc(p.n)}</option>`).join('')}</select>
    <div class="optbox"><label class="f"><input type="checkbox" id="sk_ref" ${imgSrc(c)?'':'disabled'}> 지금 스탠딩을 캐릭터 레퍼런스로 (선택)</label>
    <div class="g2"><div><label class="f" for="sk_fid">충실도</label><select class="in" id="sk_fid">${opt([[1,'1.0 (원본에 가깝게)'],[0.8,'0.8'],[0.6,'0.6']],1)}</select></div><div></div></div>
    <div class="g2"><div><label class="f" for="sk_str">레퍼런스 강도</label><select class="in" id="sk_str">${opt([[1,'강하게 (얼굴 유지)'],[0.8,'보통'],[0.6,'약하게']],1)}</select></div><div><label class="f" for="sk_style">그림체도 따라가기</label><select class="in" id="sk_style">${opt([['1','예'],['0','아니요']],'1')}</select></div></div></div>
    <div class="row" style="margin-top:14px"><button class="btn" data-act="skingo" data-id="${id}">그리기</button></div>
    ${(c.skins||[]).length?`<h3 class="sec">만든 ${T('skin')}</h3><p class="muted" style="margin:0 0 6px;font-size:.8rem">${T('skin')}마다 스탠딩·상반신·일러스트·돌파 CG를 따로 둘 수 있어요. ${T('skin')}을 입히면 있는 그림은 ${T('skin')} 것을, 로비 일러스트·돌파 CG가 없으면 스킨의 상반신이나 스탠딩을 써요. 스탠딩 사용이 꺼져 있으면 이 스킨의 상반신이 필요해요.</p>${c.skins.map(k=>skinCard(c,k)).join('')}`:''}`);
}
function skinRefresh(id){ if($('#modal .sheet.cs-sheet')) openChar(id); else if($('#sk_name')) openSkin(id); else render(); }
function skinCard(c,k){
  const slot=(x,l,o)=>`<div class="sk-slot ${x==='illust'||x==='lbcg'?'wide':''}">${o&&imgSrcRaw(o)?`<img src="${esc(imgSrcRaw(o))}" alt="">`:'<span>없음</span>'}<b>${l}</b><div class="sk-acts"><button class="btn sm" data-act="skpartgen" data-id="${c.id}" data-s="${k.id}" data-x="${x}">그리기</button><button class="btn sm ghost" data-act="skpartup" data-id="${c.id}" data-s="${k.id}" data-x="${x}">올리기</button>${o&&o.img?XBTN('skinpart',c.id,` data-s="${k.id}" data-x="${x}"`,'✕'):''}</div></div>`;
  return `<div class="sk-card"><div class="sk-h"><b>${esc(k.name)}</b><span><button class="btn sm" data-act="skpartall" data-id="${c.id}" data-s="${k.id}">빈 칸 모두 그리기</button> <button class="btn sm ghost" data-act="skindel" data-id="${c.id}" data-s="${k.id}">삭제</button></span></div>
    <details><summary>의상 프롬프트 편집</summary><textarea class="in" id="skin_prompt_${k.id}" data-skin-prompt="${k.id}" data-owner="${c.id}">${esc(k.prompt||'')}</textarea><button class="btn sm" data-act="skinpromptsave" data-id="${c.id}" data-s="${k.id}">프롬프트 저장</button><p class="muted">저장한 내용은 이후 새로 그리는 그림에 적용돼요. 기존 그림은 유지돼요.</p></details><div class="sk-grid">${slot('stand','스탠딩',k)}${slot('upper','상반신',k.upper)}${slot('illust','일러스트',k.illust)}${slot('lbcg',T('limit')+' CG',k.lbcg)}</div>
    <label class="f" for="skscene_${k.id}">일러스트·${T('limit')} CG 장면 태그 (선택)</label><input class="in" id="skscene_${k.id}" value="${esc(k.scene||'')}" placeholder="예: beach, sunset, waves, smile">
    <div class="sk-extra"><b>표정</b> ${(k.faces||[]).filter(f=>imgSrc(f)).map(f=>`<span class="sk-face"><img src="${esc(imgSrc(f))}" alt=""><i>${esc(f.name)}</i></span>`).join('')||'<span class="muted">없음 · 없으면 이 '+esc(T('skin'))+' 스탠딩을 써요</span>'}<button class="btn sm ghost" data-act="faces-open" data-id="${c.id}" data-s="${k.id}">표정 만들기</button></div>
    <div class="sk-extra"><b>대사</b> <span class="muted">${(k.lines||[]).length?esc((k.lines||[]).slice(0,2).join(' / '))+((k.lines||[]).length>2?' …':''):'없음 · 없으면 기본 대사를 써요'}</span><button class="btn sm ghost" data-act="skinlines" data-id="${c.id}" data-s="${k.id}">${(k.lines||[]).length?'대사 다시 쓰기':'AI로 대사 쓰기'}</button></div>
    <div class="sk-extra"><b>목소리</b> <span class="muted">${k.voiceId?esc(k.voiceName||'지정됨'):'기본 목소리'}</span><button class="btn sm ghost" data-act="voice" data-id="${c.id}" data-s="${k.id}">${k.voiceId?'바꾸기':'이 '+esc(T('skin'))+' 목소리 고르기'}</button>${k.voiceId?`<button class="btn sm ghost" data-act="skvclear" data-id="${c.id}" data-s="${k.id}">기본으로</button>`:''}</div></div>`; }
function skinPartDraw(c,k,x,generationMode='automatic'){ const inp=$('#skscene_'+k.id); if(inp){k.scene=inp.value.trim();naiBlocksSave(k,'scene',inp);} const scene=k.scene||'',candidateEligible=imageCandidateEligible('char',x==='stand'?k:skinPart(k,x),c,generationMode),originalSrc=imgSrcRaw(x==='stand'?k:skinPart(k,x))||'';
  if(x==='stand') return naiDraw('char',k.prompt,{candidateEligible,originalSrc,styleId:c.naiStyle,frame:c.naiFrame});
  if(x==='upper') return naiDraw('char',k.prompt,{candidateEligible,originalSrc,frame:'cowboy shot',pose:'looking at viewer, smile',styleId:c.naiStyle});
  return naiDraw(x,joinTags(k.prompt,scene||(x==='lbcg'?(c.lbcg&&c.lbcg.prompt)||'dramatic lighting, sparkles, smile, wind':(c.illust&&c.illust.prompt)||'')),{candidateEligible,originalSrc,styleId:c.naiStyle}); }
async function skinPartGen(c,k,xs,btn,generationMode='manual'){ if(!imgReady()){ toast(imgNeed()); return; } if(!k.prompt){ toast('이 '+T('skin')+'은 프롬프트가 없어서 그릴 수 없어요. 올리기를 써 주세요'); return; }
  const game=G,project=PJ().active,label=btn?.textContent;if(btn){btn.disabled=true;btn.textContent='그리는 중…';}let n=0;
  for(const x of xs){ try{ const b=await skinPartDraw(c,k,x,generationMode);if(G!==game||PJ().active!==project||charById(c.id)!==c||!c.skins.includes(k))throw Error('대상이 바뀌어 스킨 생성을 중단했습니다');await storeImage(x==='stand'?k:skinPart(k,x),b,''); n++; mark('c:'+c.id); }catch(e){ toast(naiErr(e)); break; } }
  if(btn?.isConnected){btn.disabled=false;btn.textContent=label;}if(n)toast(`${k.name}: ${n}장 완성`);skinRefresh(c.id);render(); }
