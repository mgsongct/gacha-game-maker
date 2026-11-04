/* =========================================================
   모달
   ========================================================= */
function openModal(html,lock,cls){const m=$('#modal');m.innerHTML=`<div class="sheet ${cls||''}" role="dialog">${html}</div>`;m.hidden=false;m.dataset.lock=lock?'1':'';m.querySelector('.sheet').scrollTop=0;}
let MBACK=null; // 하위 창(스킨·표정·목소리)을 닫으면 돌아갈 화면
function closeModal(){if(typeof regenCancel==='function'&&!regenCancel())return;v2CancelEditorGeneration();if(typeof v2CloseGearEditor==='function')v2CloseGearEditor();const m=$('#modal');m.hidden=true;m.innerHTML='';m.dataset.lock='';NAIJOB=null;}
// 상단바 게임 이름: 한 줄로, 넘치면 글자를 줄여요(최소 0.7배, 그래도 넘치면 …)
function fitBrand(){ const el=document.querySelector('.brand .brand-t'); if(!el) return; el.style.fontSize=''; let f=1; for(let i=0;i<8&&el.scrollWidth>el.clientWidth+1&&f>0.7;i++){ f-=0.05; el.style.fontSize=f+'em'; } }
addEventListener('resize',()=>{ clearTimeout(window.__fbT); window.__fbT=setTimeout(fitBrand,150); });
const head=(t,sub2='')=>`<div class="sheet-head"><div><h2>${t}</h2>${sub2}</div><button class="x" data-act="close" aria-label="닫기">×</button></div>`;
function opt(list,cur){return list.map(([v,l])=>`<option value="${esc(v)}" ${String(v)===String(cur)?'selected':''}>${esc(l)}</option>`).join('');}
function trigDesc(t){const g=t.trigger||{type:'start'};return g.type==='start'?'계약 직후':g.type==='aff'?`호감도 Lv.${g.value}`:`${stageCode(g.value)} 클리어 후`;}

function epLock(c,e,o){
  if(!o) return '미보유';
  if(affLv(o)<e.lv) return `호감도 Lv.${e.lv}`;
  if(e.dup&&o.dup<e.dup) return `${T('limit')} ${e.dup}단계`;
  if(e.after&&!P().cleared[e.after]) return `${stageCode(e.after)} 클리어`;
  return '';
}
// 가로로 긴 그림은 세로 화면에서 돌려서 크게 보여 줘요(버튼으로 되돌리기)
function wideFit(d){ const im=d.querySelector('img'); if(!im) return; const go=()=>{ const wide=im.naturalWidth>im.naturalHeight*1.15; if(!wide) return; const b=document.createElement('button'); b.className='lb-rot'; b.type='button'; b.textContent='⟳ 가로로 보기'; b.addEventListener('click',e=>{ e.stopPropagation(); d.classList.toggle('rot'); b.textContent=d.classList.contains('rot')?'⟲ 세로로 보기':'⟳ 가로로 보기'; }); d.appendChild(b);
      // 휴대폰을 돌리면 그에 맞춰요: 세로로 들고 있을 때만 가로 그림을 눕혀 크게, 가로로 돌리면 바로 원래대로. 직접 누르면 그 선택을 따라요
      let manual=false; b.addEventListener('click',()=>{ manual=true; },true); const fit=()=>{ if(!d.isConnected){ removeEventListener('resize',fit); return; } if(manual) return; const port=innerHeight>innerWidth*1.1&&orientPref()!=='landscape'; d.classList.toggle('rot',port); b.textContent=port?'⟲ 세로로 보기':'⟳ 가로로 보기'; }; addEventListener('resize',fit); fit(); }; if(im.complete&&im.naturalWidth) go(); else im.addEventListener('load',go,{once:true}); }
function imgViewer(src){ if(!src) return; const d=document.createElement('div'); d.className='lbrev view'; d.innerHTML=`<img src="${esc(src)}" alt="">`; wideFit(d); d.addEventListener('click',e=>{ if(e.target.closest('.lb-rot')) return; d.remove(); }); document.body.appendChild(d); }
function lbReveal(c,view){
  const s=view?imgSrc(c[view]):imgSrc(c.lbcg); if(!s) return;
  const d=document.createElement('div'); d.className='lbrev'+(view?' view':'');
  d.innerHTML=view?`<img src="${esc(s)}" alt="">`:`<div class="rays"></div><img src="${esc(s)}" alt=""><div class="flash"></div><div class="lbt"><i>MAX ${esc(T('limit'))}</i><b>${esc(c.name)}</b><span>특별 일러스트가 공개됐어요 · 화면을 누르면 닫혀요</span></div>`;
  wideFit(d); d.addEventListener('click',e=>{ if(e.target.closest('.lb-rot')) return; d.remove(); }); document.body.appendChild(d); if(!view){ sfx('SSR'); if(c.voiceId&&SND().voiceLobby){ const l=rand(c.dupLines.length?c.dupLines:c.lines); if(l) speak(c,l); } }
}
async function shareText(title,text){
  try{ if(CAP&&CAP.Share){ await CAP.Share.share({title,text,dialogTitle:title}); return; } if(navigator.share){ await navigator.share({title,text}); return; } }catch(e){ if(e&&e.name==='AbortError') return; }
  try{ await navigator.clipboard.writeText(text); toast('복사했어요. 카톡 등에 붙여 넣으세요'); }catch(e){ openModal(`${head(title)}<textarea class="in" style="min-height:240px">${esc(text)}</textarea><p class="muted">길게 눌러 복사하세요.</p>`); }
}
function openShare(){
  const ni=allImgObjs().filter(o=>o.img).length, na=G.lib.filter(l=>l.audio).length;
  openModal(`${head('공유 팩 만들기')}
    <p>지금 게임(<b>${esc(G.meta.title)}</b>)의 세계관, ${esc(T('crew'))}, 스토리, 배너, 이벤트를 .ggmpack 파일 하나로 묶어요. 큰 그림도 조금씩 나누어 저장해요. 받은 사람은 설정 → 데이터 → 공유 팩 불러오기에서 <b>새 게임으로 추가</b>할 수 있어요.</p>
    <div class="optbox"><label class="f"><input type="checkbox" id="sh_img" checked> 그림 넣기 (${ni}장, 파일이 커져요)</label>
    <label class="f"><input type="checkbox" id="sh_aud"> 배경음·효과음 넣기 (${na}개)</label></div>
    <label class="f"><input type="checkbox" id="sh_gate" checked> 픽업·${esc(T('event'))}을 스토리 진행에 맞춰 차례로 열기 <span class="muted" style="font-size:.78rem">(${G.events.length}개 ${esc(T('event'))} · ${G.banners.filter(bn=>bn.id!=='std'&&!bn.eventId).length}개 픽업. 끄면 처음부터 모두 열려요)</span></label>
    <p class="muted">그림체: ${String(G.meta.artTags||'').trim()?'게임 정의의 그림체가 들어가요.':'게임 정의에 그림체가 비어 있어서, 지금 설정의 기본 그림체를 넣어 보내요.'} 받은 사람이 새 그림을 그릴 때 이 그림체를 써요.</p>
    <p class="muted">들어가지 않는 것: API 키, NovelAI 토큰, 업데이트 토큰, 내 진행 상황(보유 ${esc(T('crew'))}, 재화), 플레이어 이름, 캐릭터 음성과 목소리 ID.</p>
    <p class="muted">작가 이름 태그로 그린 그림이나 실제 성우를 닮은 목소리는 아는 사람끼리만 돌려 보고, 공개 커뮤니티에 올리지 마세요.</p>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="sharego">만들어서 보내기</button></div>`);
}
/* 창을 다시 그려도 스크롤 자리 유지(View) */
function modalKeep(open){ const sh=$('#modal .sheet'), y=sh?sh.scrollTop:0; open(); const sh2=$('#modal .sheet'); if(sh2) sh2.scrollTop=y; }
let FB_STAR=0;
function fbStarsShow(){ document.querySelectorAll('#fbStars .chip').forEach(b=>chipOn(b,+b.dataset.n===FB_STAR)); }
function openFeedback(){
  FB_STAR=0;
  openModal(`${head('피드백 보내기')}
    <p class="muted" style="margin:0 0 8px">써서 보내기를 누르면 카톡 같은 앱으로 보낼 수 있어요. 버전과 기기 정보가 자동으로 붙어요(키나 개인 정보는 안 붙어요).</p>
    <label class="f">전체 점수</label><div class="chips" id="fbStars">${[1,2,3,4,5].map(n=>`<button class="chip" data-act="fbstar" data-n="${n}">${'★'.repeat(n)}</button>`).join('')}</div>
    <label class="f" for="fb_name">이름 (선택)</label><input class="in" id="fb_name" maxlength="20">
    <label class="f" for="fb_good">재미있던 점</label><textarea class="in" id="fb_good"></textarea>
    <label class="f" for="fb_bad">불편했던 점, 버그 (어느 화면에서 무엇을 했을 때)</label><textarea class="in" id="fb_bad"></textarea>
    <label class="f" for="fb_want">있었으면 하는 것</label><textarea class="in" id="fb_want"></textarea>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="fbsend">복사·공유하기</button><button class="btn ghost" data-act="fbissue">GitHub 이슈로</button>${LV().feedback?'<button class="btn ghost" data-act="fbpost">게시글 열기</button>':''}</div>
    <p class="muted" style="margin:6px 0 0">복사해서 배포 게시글 댓글에 붙여 넣거나, GitHub 계정이 있으면 이슈로 남길 수 있어요.</p>`);
}
function feedbackText(){
  const v=id=>($('#'+id)&&$('#'+id).value.trim())||'-', p=P();
  const ua=(navigator.userAgent.match(/Android [\d.]+|iPhone OS [\d_]+|Windows NT [\d.]+|Mac OS X [\d_]+/)||['알 수 없음'])[0];
  return `[${G.meta.title} 피드백]\n점수: ${FB_STAR?'★'.repeat(FB_STAR)+'☆'.repeat(5-FB_STAR):'-'}\n보낸 사람: ${v('fb_name')}\n\n■ 재미있던 점\n${v('fb_good')}\n\n■ 불편했던 점, 버그\n${v('fb_bad')}\n\n■ 있었으면 하는 것\n${v('fb_want')}\n\n— 버전 ${window.__LIVE__||APP_BUILD} · ${ua} · 화면 ${innerWidth}×${innerHeight} · ${T('crew')} ${Object.keys(p.owned).length}/${G.chars.length} · 클리어 ${Object.keys(p.cleared||{}).length}`;
}
function guideText(){
  return `[${G.meta.title} 테스트 안내]\n개인적으로 만든 가챠 게임이에요. 해 보고 의견 부탁해요!\n공식 배포처: https://github.com/jjhk0803/gacha-game-maker (다른 곳에서 받은 파일은 쓰지 마세요)\n\n1. 같이 보낸 APK 파일을 눌러 설치해요. "출처를 알 수 없는 앱" 허용을 물으면 이번만 허용해요.\n2. 공유 팩(.ggmpack 또는 기존 .json)도 받았다면: 최신 버전으로 업데이트한 뒤 설정 → 데이터 → 공유 팩 불러오기 → "새 게임으로 추가".\n3. 새 ${T('crew')}·스토리 만들기, 그림, 음성 같은 AI 기능은 각자 키를 넣어야 써요. 없어도 기본 게임은 다 할 수 있어요. 키는 남에게 받지 말고 본인 것만 쓰세요.\n4. 다 해 봤으면 설정 → 공유와 피드백 → 피드백 보내기로 의견을 보내 주세요.\n\n※ 개인 테스트용이라 다른 곳에 올리거나 다시 퍼뜨리지는 말아 주세요.`;
}
let CS_TAB='equip';
/* 캐릭터 창 부분 갱신(View): 탭 · 전신/상반신 · 누르기 반응(물결·하트·몸짓·표정·말풍선 — 보였으면 true) */
function csTabShow(){ document.querySelectorAll('.cs-tabs button').forEach(b=>chipOn(b,b.dataset.k===CS_TAB)); document.querySelectorAll('[data-cs]').forEach(s=>s.hidden=s.dataset.cs!==CS_TAB); }
function csFrameShow(t,full){ const a2=$('.cs-art'); if(a2){ a2.classList.toggle('up',!full); const cc=charById(a2.dataset.id); if(cc) a2.innerHTML=characterDetailArt(cc,!full); } t.textContent=full?'상반신':'전신'; }
function csSayText(){ const sy=$('#csSay'); return sy?sy.textContent:undefined; }
function csPokeShow(t,c,l,owned,lv,zone,x,y){ ripple(x,y,lv>=7); if(owned&&lv>=5&&zone==='head') hearts(x,y,Math.min(5,lv-3)); charReact(t.querySelector('.art'),lv,zone); faceSwap(c,t.querySelector('.art'),touchFace(c,zone,lv));
  const sy=$('#csSay'); if(!l||!sy) return false; sy.textContent=sub(l); sy.hidden=false; sy.classList.remove('pop'); void sy.offsetWidth; sy.classList.add('pop'); clearTimeout(window._csT); window._csT=setTimeout(()=>{if(sy.isConnected)sy.hidden=true;},3200); return true; }
function crewOrder(){return [...G.chars].sort((a,b)=>(own(b.id)?1:0)-(own(a.id)?1:0)||b.rarity-a.rarity||(a.ord||0)-(b.ord||0));}
// Detail is an original-art viewer, independent of the gameplay standing preference.
function characterDetailArt(c,upper=false){
 const sk=skinOf(c),pick=o=>o&&(upper?imgSrcRaw(o.upper)||imgSrcRaw(o):imgSrcRaw(o)||imgSrcRaw(o.upper));
 const src=pick(sk)||pick(c),up=!!src&&(src===imgSrcRaw(sk?.upper)||src===imgSrcRaw(c.upper));
 return src?`<img class="art ${up?'upimg':''}" src="${esc(src)}" alt="${esc(c.name)}" loading="lazy" draggable="false">`:`<div class="art ph"><small>이미지 미등록</small></div>`;
}
function characterDetailPreviewTargets(root){
 const locked=new Set([...root.querySelectorAll('[data-cs=look] .locked img')].map(img=>img.src));
 for(const img of root.querySelectorAll('[data-cs="look"] img')){
  if(img.closest('.locked')||locked.has(img.src))continue;
  img.dataset.characterPreview='true';img.tabIndex=0;img.setAttribute('role','button');
  img.setAttribute('aria-label',(img.alt||'캐릭터 이미지')+' 크게 보기');
 }
}
/* 캐릭터 창 열기(Controller): 창을 그리고, 5돌파 CG를 처음 보면 본 것으로 하고 펼침 연출 */
function openChar(id){ const c=charById(id); if(!c) return; charSheetShow(id); if(cgFirstSeen(c)) setTimeout(()=>lbReveal(c),500); }
/* 5돌파 CG를 처음 봄(Model) — 처음이면 true */
function cgFirstSeen(c){ const o=own(c.id); if(!(o&&o.dup>=5&&o.cgNew&&imgSrcRaw(c.lbcg))) return false; o.cgNew=false; mark('prog'); return true; }
/* 캐릭터 창(View): 장비·스킬 · 스토리 · 외형 · 정보 탭 */
function charSheetShow(id){
  const c=charById(id); if(!c) return; MBACK=null; const o=own(c.id),st=stats(c);
  const eps=[...c.episodes].sort((a,b)=>a.lv-b.lv), ths=G.threads.filter(t=>t.charId===c.id), cap=o?levelCap(o):20;
  const old=$('#modal .sheet.cs-sheet'), keep=old&&old.dataset.cid===id?old.scrollTop:0;
  const list=crewOrder(), i=list.findIndex(x=>x.id===id), prev=list[(i-1+list.length)%list.length], next=list[(i+1)%list.length];
  const lbs=imgSrcRaw(c.lbcg), cgOpen=!!(o&&o.dup>=5), skinSel=o&&o.skin, ill=c.illust?imgSrcRaw(c.illust):null, wearing=skinOf(c), sec=(k,h)=>`<section data-cs="${k}" ${CS_TAB===k?'':'hidden'}>${h}</section>`;
  const equip=`${rulesCharHTML(c)}
    ${v2EquipmentCard(c,o)}
    ${v2SkillSummary(c)}
    <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-act="wnai" data-id="${c.id}">NAI로 ${T('weapon')} 그리기</button><button class="btn sm ghost" data-act="v2icons" data-id="${c.id}">스킬 이미지 생성</button></div>`;
  const story=`
    <h3 class="sec">개인 스토리</h3>
    ${eps.length?eps.map(e=>{const lk=epLock(c,e,o),seen=o&&(o.seen||[]).includes(e.id);return `<div class="ep ${lk?'lock':''}"><span class="badge">Lv.${e.lv}</span><span class="t"><b>${esc(e.title)}</b><span class="muted">${lk?lk+' 필요':(seen?'감상 완료':'NEW')}</span></span>${!lk?`<button class="btn sm" data-act="playep" data-id="${c.id}" data-ep="${e.id}">보기</button>`:''}<button class="btn sm ghost" data-act="epedit" data-id="${c.id}" data-ep="${e.id}">편집</button></div>`;}).join(''):'<p class="muted">아직 없어요.</p>'}
    <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="epedit" data-id="${c.id}" data-ep="">스토리 추가</button></div>
    <h3 class="sec">${T('talk')}</h3>
    ${ths.length?ths.map(t=>{const s=P().inbox[t.id];return `<div class="ep"><span class="t"><b>${esc(t.title)}</b><span class="muted">${trigDesc(t)} · ${s?(s.done?'읽음':'도착'):'미도착'}</span></span>${s?`<button class="btn sm" data-act="openthread" data-id="${t.id}">열기</button>`:''}<button class="btn sm ghost" data-act="thedit" data-id="${c.id}" data-th="${t.id}">편집</button></div>`;}).join(''):'<p class="muted">아직 없어요.</p>'}
    <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="thedit" data-id="${c.id}" data-th="">${T('talk')} 추가</button></div>
    <h3 class="sec">관계</h3>
    ${(()=>{ const ref=baseChar(c).id, rs=relOf(ref); return rs.length?rs.slice(0,6).map(r=>`<div class="ep"><span class="t"><b>${esc(relName(relOther(r,ref),true))} <span class="muted">· ${esc(r.kind||'')}</span></b><span class="muted">${esc(r.note||'')}</span></span></div>`).join('')+(rs.length>6?`<p class="muted" style="font-size:.78rem">외 ${rs.length-6}개</p>`:''):'<p class="muted">아직 관계 기록이 없어요. 스토리를 만들면 함께 쌓여요.</p>'; })()}
    <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="relopen" data-r="${esc(baseChar(c).id)}">🕸 관계도 보기</button></div>`;
  const outfit=(c.skins||[]).length?`<div class="outfit"><b>의상</b><div class="chips">${o?`<button class="chip ${!skinSel?'on':''}" data-act="skinuse" data-id="${c.id}" data-s="">기본</button>`:''}${(c.skins||[]).map(k=>`<button class="chip ${skinSel===k.id?'on':''}" data-act="skinuse" data-id="${c.id}" data-s="${k.id}" ${o?'':'disabled'}>${skinHave(k)?'':'🔒 '}${esc(k.name)}${skinDisplayReady(c,k)?'':skinPreviewSrc(c,k)?' (상반신 필요)':' (미생성)'}</button>`).join('')}</div>${wearing&&!skinDisplayReady(c,wearing)&&c.useStanding===false?`<p class="muted">선택한 스킨의 상반신이 없어 기본 상반신을 표시하고 있어요. <button class="btn sm ghost" data-act="skinuse" data-id="${c.id}" data-s="${wearing.id}">스킨 상반신 생성</button></p>`:''}</div>`:'';
  const look=(wearing?`${v2StandingHeader(c)}${outfit}<p class="muted" style="margin:4px 0 8px;font-size:.8rem">「${esc(wearing.name)}」을(를) 입고 있어요. 여기서 고치면 이 ${esc(T('skin'))}에 저장돼요. 기본 모습은 '기본'을 고른 뒤 고쳐요.</p>${skinCard(c,wearing)}
    <div class="row" style="margin:10px 0"><button class="btn sm ghost" data-act="skin-open" data-id="${c.id}">새 ${T('skin')} 만들기</button></div>`:`${outfit}
    <div class="row" style="margin:0 0 4px"><button class="btn sm ghost" data-act="imglib" data-id="${c.id}">🖼 그림 모아 보기</button></div>
    ${v2StandingHeader(c)}
    <p class="muted" style="margin:0 0 6px">배경 없는 전신 그림이에요. ${T('crew')} 목록과 ${T('talk')}에서는 위쪽(상반신, 얼굴)만 잘라서 보여 줘요.</p>
    <div class="ill-box standing-box">${imgSrcRaw(c)?`<img src="${esc(imgSrcRaw(c))}" alt="${esc(c.name)} 스탠딩">`:'<span>스탠딩 이미지가 아직 없어요</span>'}</div>
    <div class="row"><button class="btn sm" data-act="naigen" data-k="char" data-id="${c.id}">NAI로 스탠딩</button><button class="btn sm ghost" data-act="upload" data-k="char" data-id="${c.id}">이미지 올리기</button>${imgSrcRaw(c)?`<button class="btn sm ghost" data-act="cutopen" data-k="char" data-id="${c.id}">배경 지우기</button>`+XBTN('char',c.id,'','지우기'):''}</div>
    <h3 class="sec">상반신 (스토리·프로필)</h3>
    <p class="muted" style="margin:0 0 6px">배경 없는 상반신 그림이에요. 있으면 스토리와 ${T('crew')} 프로필에서 전신을 잘라 쓰는 대신 이 그림을 써요. 표정 그림이 있는 장면에서는 표정이 먼저예요.</p>
    <div class="ill-box up-box">${c.upper&&imgSrc(c.upper)?`<img src="${esc(imgSrc(c.upper))}" alt="">`:'<span>아직 없어요 · 없으면 전신 위쪽을 잘라서 보여 줘요</span>'}</div>
    <div class="row" style="margin-top:8px"><button class="btn sm" data-act="upgen" data-id="${c.id}">NAI로 상반신</button><button class="btn sm ghost" data-act="upload" data-k="upper" data-id="${c.id}">올리기</button>${c.upper&&imgSrc(c.upper)?`<button class="btn sm ghost" data-act="updel" data-id="${c.id}">지우기</button>`:''}</div>
    <h3 class="sec">로비 레이어 (배경 + 캐릭터 따로)</h3>
    <p class="muted" style="margin:0 0 6px;font-size:.8rem">배경과 투명 캐릭터를 따로 그려 겹쳐요. 로비에서 배경은 그대로, 캐릭터만 숨 쉬듯 움직여요. 배경이 없으면 로비 배경을, 포즈가 없으면 상반신 그림을 써요. 상반신도 없으면 스탠딩 사용 설정에 따라 표시해요. 일러스트로 자동 전환하지 않아요.</p>
    <div class="lbl-pair"><div class="lbl-prev">${(()=>{ /* 포즈 → 상반신 순서로 로비와 동일하게 표시 */ const bgI=c.lbbg&&imgSrc(c.lbbg),bg=bgI?`<img class="lbl-bg" src="${esc(bgI)}" alt="">`:`<div class="lbl-bg" style="${bgStyle(P().lobbyBg||'새벽등대 사무소')}"></div>`,ps=!(skinOf(c)&&imgSrc(skinOf(c)))&&c.pose&&imgSrc(c.pose);return bg+(ps?`<img class="lbl-ch" src="${esc(ps)}" alt="">`:lobbyCharacterArt(c,'lbl-ch')); })()}</div>
      <div class="lbl-side"><span class="muted">배경 ${c.lbbg&&imgSrc(c.lbbg)?'✓':'—'} · 포즈 ${c.pose&&imgSrc(c.pose)?'✓':'—'}</span>
      <label class="f" for="lbbg_scene">배경 장면 태그</label><input class="in" id="lbbg_scene" value="${esc((c.lbbg&&c.lbbg.prompt)||'')}" placeholder="${esc((c.illust&&c.illust.prompt)||'cozy room, window, soft light')}"></div></div>
    <div class="row" style="margin-top:8px"><button class="btn sm" data-act="posegen" data-id="${c.id}" data-w="both">NAI로 배경 + 포즈</button><button class="btn sm ghost" data-act="posegen" data-id="${c.id}" data-w="bg">배경만</button><button class="btn sm ghost" data-act="posegen" data-id="${c.id}" data-w="pose">포즈만</button></div>
    <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-act="upload" data-k="lbbg" data-id="${c.id}">배경 올리기</button><button class="btn sm ghost" data-act="upload" data-k="pose" data-id="${c.id}">포즈 올리기</button>${(c.pose&&imgSrc(c.pose))?`<button class="btn sm ghost" data-act="posedel" data-id="${c.id}">포즈 지우기</button>`:''}${c.lbbg&&imgSrc(c.lbbg)?`<button class="btn sm ghost" data-act="lbbgdel" data-id="${c.id}">배경 지우기</button>`:''}</div>
    <h3 class="sec">일러스트 (로비·타이틀·픽업)</h3>
    <p class="muted" style="margin:0 0 6px">배경까지 그려진 세로 한 장 그림이에요. 타이틀과 ${T('gacha')} 픽업 화면에 쓰이며, 로비에서는 표시 방식을 ‘일러스트 표시’로 골랐을 때 사용해요.</p>
    <div class="ill-box">${ill?`<img src="${esc(ill)}" alt="">`:'<span>아직 없어요</span>'}</div>
    <label class="f" for="il_scene">장면·배경 태그 (선택)</label><input class="in" id="il_scene" value="${esc(c.illust.prompt||'')}" placeholder="night, city lights, rooftop, wind, from below">
    <div class="row" style="margin-top:8px"><button class="btn sm" data-act="ilgen" data-k="illust" data-id="${c.id}">NAI로 일러스트</button><button class="btn sm ghost" data-act="upload" data-k="illust" data-id="${c.id}">올리기</button>${ill?`<button class="btn sm ghost" data-act="ildel" data-k="illust" data-id="${c.id}">지우기</button>`:''}</div>
    <h3 class="sec">최대 ${esc(T('limit'))} CG</h3>
    <p class="muted" style="margin:0 0 6px">${esc(T('limit'))} 5단계를 달성하면 공개되는 특별 일러스트예요. 미리 만들어 두면 달성하는 순간 연출과 함께 열려요. 공개 후에는 로비에도 쓸 수 있어요.</p>
    <div class="ill-box ${cgOpen?'':'locked'}">${lbs?`<img src="${esc(lbs)}" alt="">`:'<span>아직 없어요</span>'}${cgOpen?'':`<div class="lockcap">🔒 ${esc(T('limit'))} 5단계에서 공개<small>${o?o.dup:0} / 5</small></div>`}</div>
    <label class="f" for="lb_scene">장면 태그 (선택)</label><input class="in" id="lb_scene" value="${esc(c.lbcg.prompt||'')}" placeholder="night sky, shooting stars, reaching out, smile, wind">
    <div class="row" style="margin-top:8px"><button class="btn sm" data-act="ilgen" data-k="lbcg" data-id="${c.id}">NAI로 ${esc(T('limit'))} CG</button><button class="btn sm ghost" data-act="upload" data-k="lbcg" data-id="${c.id}">올리기</button>${lbs?`<button class="btn sm ghost" data-act="ildel" data-k="lbcg" data-id="${c.id}">지우기</button>`:''}</div>
    ${lbs&&cgOpen?`<label class="f" style="margin-top:8px"><input type="checkbox" data-act="cguse" data-id="${c.id}" ${o.useCg?'checked':''}> 로비와 타이틀에 이 CG 쓰기</label>`:''}
    <h3 class="sec">기술 컷인 (스킬 쓸 때 크게)</h3>
    <p class="muted" style="margin:0 0 6px">「${esc(v2Ensure(c).ultimate.name)}」 궁극기를 쓸 때 화면을 가로지르며 크게 나오는 그림이에요. 없으면 스탠딩을 크게 써요.</p>
    <div class="ill-box scg-box">${imgSrcRaw(scgOf(c))?`<img src="${esc(imgSrcRaw(c.scg))}" alt="">`:'<span>아직 없어요 · 없으면 스탠딩으로 나와요</span>'}</div>
    <label class="f" for="sc_scene">장면 요청 (선택 · 생성 시 AI가 궁극기에 맞게 구성)</label><input class="in" id="sc_scene" value="${esc(c.scg.prompt||'')}" placeholder="${esc(ultimateSceneTags(c))}, motion lines">
    <div class="row" style="margin-top:8px"><button class="btn sm" data-act="scggen" data-id="${c.id}">NAI로 기술 컷인</button><button class="btn sm ghost" data-act="upload" data-k="scg" data-id="${c.id}">올리기</button><button class="btn sm ghost" data-act="scgtest" data-id="${c.id}">미리 보기</button>${imgSrc(c.scg)?`<button class="btn sm ghost" data-act="scgdel" data-id="${c.id}">지우기</button>`:''}</div>
    <h3 class="sec">표정과 ${T('skin')}</h3>
    <div class="facegrid">${c.faces.map(f=>`<button class="fc" data-act="faceview" data-id="${c.id}" data-f="${f.id}">${imgSrc(f)?`<img src="${esc(imgSrc(f))}" alt="">`:''}<span>${esc(f.name)}</span></button>`).join('')}</div>
    <div class="row" style="margin:8px 0"><button class="btn sm ghost" data-act="faces-open" data-id="${c.id}">표정 만들기</button><button class="btn sm ghost" data-act="audopen" data-id="${c.id}">점검·변환</button><button class="btn sm ghost" data-act="skin-open" data-id="${c.id}">${T('skin')} 만들기</button>${c.alt?'':`<button class="btn sm ghost" data-act="altnew" data-id="${c.id}">이격 만들기</button>`}</div>
    ${c.alt&&charById(c.alt)?`<p class="muted" style="margin:4px 0">이격: <button class="linkb" data-act="char" data-id="${c.alt}">${esc(charById(c.alt).name)}</button>의 다른 모습이에요.</p>${inheritHTML(c)}`:altsOf(c).length?`<p class="muted" style="margin:4px 0">이격: ${altsOf(c).map(x=>`<button class="linkb" data-act="char" data-id="${x.id}">${esc(x.name)}</button>${own(x.id)?'':' (미보유)'}`).join(' · ')}</p>`:''}
    ${charImgList(c).length?`<h3 class="sec">그림 저장 <span class="muted" style="font-size:.75rem">${charImgList(c).length}장 · 묶음을 눌러 펼쳐요</span></h3><p class="muted" style="margin:0 0 6px;font-size:.8rem">${IS_NATIVE?'Documents/가챠게임메이커/그림 폴더에 저장돼요.':'휴대폰은 공유하기로 사진 앱에, PC는 다운로드 폴더에 저장돼요.'}</p>${(()=>{ const L=charImgList(c), gs=[...new Set(L.map(x=>x[2]))]; return gs.map(g=>{ const it=L.filter(x=>x[2]===g); return `<details class="isv"><summary>${esc(g)} <span class="muted">${it.length}장</span></summary><div class="isv-grid">${it.map(([o,l])=>`<button class="isv-it" data-act="imgsave" data-id="${c.id}" data-o="${esc(o.id)}"><img src="${esc(imgSrcRaw(o))}" alt="" loading="lazy"><span>⬇ ${esc(l)}</span></button>`).join('')}</div></details>`; }).join(''); })()}`:''}`);
  const info=`${personaHTML(c)}
    <div class="row" style="margin-top:4px">${o&&P().sec!==c.id?`<button class="btn sm" data-act="setsec" data-id="${c.id}">로비에 세우기</button>`:''}${o?`<button class="btn sm ghost" data-act="gift" data-id="${c.id}">🎁 선물하기</button>`:''}<button class="btn sm ghost" data-act="charedit" data-id="${c.id}">✏️ 이름·대사 편집</button><button class="btn sm ghost" data-act="puexist" data-id="${c.id}">★ 픽업 배너</button></div>
    <p style="margin:12px 2px 4px">${esc(c.profile)}</p>
    ${(c.files||[]).length?`<h3 class="sec">${T('files')}</h3>${c.files.map(f=>o&&o.dup>=f.dup?`<div class="file"><i>FILE ${f.dup}</i>${esc(f.text)}</div>`:`<div class="file lock"><i>FILE ${f.dup}</i>${T('limit')} ${f.dup}단계에서 공개</div>`).join('')}`:''}
    <h3 class="sec">목소리</h3>
    <div class="ep"><span class="t"><b>${c.voiceId?esc(c.voiceName||'지정됨'):'없음'}</b><span class="muted">${c.voiceId?esc(c.voiceId):'Fish Audio에서 어울리는 목소리를 찾아요'}</span></span>${c.voiceId?`<button class="btn sm ghost" data-act="vtest" data-id="${c.id}">▶</button>`:''}<button class="btn sm" data-act="voice" data-id="${c.id}">${c.voiceId?'바꾸기':'찾기'}</button></div>
    <h3 class="sec">NAI 프롬프트</h3><div class="code-box">${esc(c.naiPrompt||'설정 편집에서 AI로 만들 수 있어요.')}</div>
    <div class="row" style="margin-top:12px"><button class="btn sm ghost" data-act="copy" data-text="${esc(c.naiPrompt||'')}">프롬프트 복사</button><button class="btn sm" data-act="charedit" data-id="${c.id}">설정 편집</button></div>`;
  openModal(`<div class="cs" style="--ec:${ECOL[c.elem]||'var(--rose)'}">
    <div class="cs-hero">
      <div class="cs-bg" style="${bgStyle(P().lobbyBg||'새벽등대 사무소')}"></div><div class="cs-stripe"></div>
      <div class="cs-art ${P().csFull?'':'up'}" data-act="cspoke" data-id="${c.id}">${characterDetailArt(c,!P().csFull)}</div><div class="cs-say" id="csSay" hidden></div>${imgSrcRaw(skinOf(c)||c)?`<button class="cs-frame" data-act="csframe">${P().csFull?'상반신':'전신'}</button>`:''}
      <div class="cs-top"><button class="cs-back" data-act="close" aria-label="닫기">‹ <b>${esc(T('crew'))}</b></button><span class="cs-cap">${esc(T('crew')).toUpperCase()} INFORMATION</span></div>
      ${SAMPLE&&!playMode()?`<button class="cs-nav ai ${list.length>1?'':'solo'}" data-act="charregen" data-id="${c.id}" title="AI로 다시 만들기">✦ 재생성</button>`:''}${list.length>1?`<button class="cs-nav l" data-act="char" data-id="${prev.id}" aria-label="이전">‹</button><button class="cs-nav r" data-act="char" data-id="${next.id}" aria-label="다음">›</button>`:''}
      <div class="cs-panel">
        <div class="cs-rr"><span class="el" style="--ec:${ECOL[c.elem]}">${esc(c.elem)}</span><span class="cs-role">${ROLE_EN[c.role]}</span><span class="cs-rar r${c.rarity}">${RL[c.rarity]}</span></div>
        <div class="cs-plate"><span class="lv">LV.<b>${o?o.lv:1}</b>/${cap}</span><b class="nm">${esc(c.name)}</b></div>
        <div class="cs-sub"><span>${o?`<span class="st">${'★'.repeat(o.dup)}${'☆'.repeat(5-o.dup)}</span>`:'미보유'}${c.limited?' · 한정':''}</span>${o?`<span class="aff">♥ 호감도 ${affLv(o)}</span>`:''}</div>
        <div class="cs-pow"><i>POWER</i><b>${nf(charPower(c))}</b></div>
        <div class="cs-stat"><h4>STATUS</h4><div class="sg"><div><span>HP</span><b>${nf(st.hp)}</b></div><div><span>ATK</span><b>${nf(st.atk)}</b></div><div><span>DEF</span><b>${nf(st.def)}</b></div><div><span>SPD</span><b>${st.spd}</b></div></div></div>
        ${o?`<div class="cs-bar"><i style="width:${o.lv>=cap?100:o.exp/(GGMCombat.levelExperience(o.lv))*100}%"></i></div>
        <div class="cs-acts3"><button class="btn" data-act="enh" data-id="${c.id}">LV+ ${esc(T('enhance'))}</button><button class="btn max" data-act="enhmax" data-id="${c.id}">MAX</button><button class="btn lbk" data-act="lb" data-id="${c.id}">${o.lv>=70?'초월 승급':'승급'}</button></div>
`:`<p class="cs-mats" style="text-align:left">아직 보유하지 않았어요. ${esc(T('gacha'))}에서 만날 수 있어요.</p>`}
        <div class="cs-squad"><span>SQUAD</span><b>${esc(c.faction||'무소속')}</b></div>
      </div>
    </div>
    <div class="cs-tabs">${[['equip','장비·스킬'],['story','스토리'],['look','외형'],['info','정보']].map(([k,l])=>`<button class="${CS_TAB===k?'on':''}" data-act="cstab" data-k="${k}">${l}</button>`).join('')}</div>
    <div class="cs-body">${sec('equip',equip)}${sec('story',story)}${sec('look',look)}${sec('info',info)}</div>
  </div>`,false,'cs-sheet');
  characterDetailPreviewTargets($('#modal'));
  const el=$('#modal .sheet'); if(el){ el.dataset.cid=id; if(old)el.scrollTop=keep; }
}
function openCharEdit(id){
  const c=id?charById(id):cleanChar({name:''});
  const kv=o=>Object.entries(o||{}).flatMap(([k,v])=>(v||[]).map(x=>`${k}: ${x}`)).join('\n');
  openModal(`${head(id?'설정 편집':'새 '+T('crew'))}
    <div class="g2"><div><label class="f" for="f_name">이름</label><input class="in" id="f_name" value="${esc(c.name)}" maxlength="20"></div>
    <div><label class="f" for="f_fac">소속</label><input class="in" id="f_fac" value="${esc(c.faction)}" list="faclist"><datalist id="faclist">${[...new Set(G.chars.map(x=>x.faction).filter(Boolean))].map(f=>`<option value="${esc(f)}">`).join('')}</datalist></div></div>
    <div class="g2"><div><label class="f" for="f_rar">등급</label><select class="in" id="f_rar">${opt([[3,'SSR'],[2,'SR'],[1,'R']],c.rarity)}</select></div>
    <div><label class="f" for="f_pos">포지션 <span class="muted" style="font-size:.75rem">(전투 기본형)</span></label><select class="in" id="f_pos">${opt(POSITIONS().map(p=>[p.id,`${p.name} (${ROLE[p.base]}형)`]),posOf(c).id)}</select></div></div>
    <div class="g2"><div><label class="f" for="f_elem">속성</label><select class="in" id="f_elem">${opt(ELEMS.map(elem=>[elem,elem]),c.elem)}</select></div>
    <div><label class="f" for="f_lim">한정 여부</label><select class="in" id="f_lim">${opt([['0','상시'],['1','한정 (이벤트 배너에서만)']],c.limited?'1':'0')}</select></div></div>
    <div class="g4"><div><label class="f" for="f_hp">기본 체력</label><input class="in" id="f_hp" type="number" value="${c.hp}"></div><div><label class="f" for="f_atk">공격</label><input class="in" id="f_atk" type="number" value="${c.atk}"></div><div><label class="f" for="f_def">기본 방어력</label><input class="in" id="f_def" type="number" value="${c.def}"></div><div><label class="f" for="f_spd">속도</label><input class="in" id="f_spd" type="number" value="${c.spd}"></div></div>
    <p class="muted">아래는 심연탐사 호환용 스킬입니다. 일반 전투 스킬은 캐릭터 상세의 「일반 전투 스킬 편집 · AI 생성」에서 설정하세요.</p>
    <div class="g2"><div><label class="f" for="f_sk">심연탐사 스킬 이름</label><input class="in" id="f_sk" value="${esc(c.skill.name)}"></div><div><label class="f" for="f_kind">스킬 효과</label><select class="in" id="f_kind">${opt(Object.entries(KIND),c.skill.kind)}</select></div></div>
    <div class="g2"><div><label class="f" for="f_pow">위력 배율</label><input class="in" id="f_pow" type="number" step="0.1" value="${c.skill.power}"></div><div><label class="f" for="f_cd">쿨타임(턴)</label><input class="in" id="f_cd" type="number" value="${c.skill.cd}"></div></div>
    <label class="f" for="f_skd">스킬 설명</label><input class="in" id="f_skd" value="${esc(c.skill.desc)}">
    <label class="f" for="f_prof">프로필</label><textarea class="in" id="f_prof">${esc(c.profile)}</textarea>
    <label class="f" for="f_files">${T('files')} (한 줄에 하나, "${T('limit')}단계: 내용")</label><textarea class="in" id="f_files">${esc(c.files.map(f=>f.dup+': '+f.text).join('\n'))}</textarea>
    <label class="f" for="f_intro">${T('gacha')} 연출 대사</label><input class="in" id="f_intro" value="${esc(c.intro)}">
    <label class="f" for="f_lines">로비 대사 (한 줄에 하나)</label><textarea class="in" id="f_lines">${esc(c.lines.join('\n'))}</textarea>
    <label class="f" for="f_aff">호감도별 대사 ("레벨: 대사", 그 레벨부터 로비에 섞여 나와요)</label><textarea class="in" id="f_aff">${esc(kv(c.affLines))}</textarea>
    <div class="g2"><div><label class="f" for="f_lv">${T('enhance')} 대사</label><textarea class="in" id="f_lv">${esc(c.lvLines.join('\n'))}</textarea></div><div><label class="f" for="f_dup">${T('limit')} 대사</label><textarea class="in" id="f_dup">${esc(c.dupLines.join('\n'))}</textarea></div></div>
    <div class="g2"><div><label class="f" for="f_head">머리 터치 반응</label><textarea class="in" id="f_head">${esc(c.touch.head.join('\n'))}</textarea></div><div><label class="f" for="f_body">몸 터치 반응</label><textarea class="in" id="f_body">${esc(c.touch.body.join('\n'))}</textarea></div></div>
    <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-act="ailines">AI로 대사 채우기</button><button class="btn sm ghost" data-act="ailinesmore">AI로 대사 늘리기 (지금 대사에 더해요)</button></div>
    <div class="g2"><div><label class="f" for="f_wn">${T('weapon')} 이름</label><input class="in" id="f_wn" value="${esc(c.weapon.name)}"></div><div><label class="f" for="f_wd">${T('weapon')} 설명</label><input class="in" id="f_wd" value="${esc(c.weapon.desc)}"></div></div>
    <label class="f" for="f_wp">${T('weapon')} NAI 프롬프트</label><textarea class="in" id="f_wp" data-owner="${c.id}">${esc(c.weapon.prompt)}</textarea>
    ${id?`<div class="row" style="margin-top:6px">${SAMPLE?`<button class="btn sm ghost" data-act="wai" data-id="${c.id}">AI로 ${T('weapon')} 프롬프트 쓰기</button>`:''}<button class="btn sm ghost" data-act="wnai" data-id="${c.id}">NAI로 ${T('weapon')} 그리기</button></div>`:''}
    <label class="f" for="f_nai">NAI 스탠딩 프롬프트</label><textarea class="in" id="f_nai" data-owner="${c.id}">${esc(c.naiPrompt)}</textarea>
    <label class="f" style="margin-top:6px"><input type="checkbox" id="f_nodesign" ${c.noDesign?'checked':''}> 공통 디자인 태그 쓰지 않기 <span class="muted" style="font-size:.78rem">(설정 → 그림 AI → 캐릭터 디자인 통일)</span></label>
    <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-act="ainai">AI로 NAI 프롬프트 쓰기</button></div>
    <div class="row" style="margin-top:16px"><button class="btn" data-act="savechar" data-id="${id||''}">저장</button>${id?`<button class="btn ghost" data-act="delchar" data-id="${c.id}">삭제</button>`:''}</div>`);
}
const lines=v=>v.split('\n').map(s=>s.trim()).filter(Boolean);
/* 이름 바꾸기: 대본·톡·에피소드·대사·프로필 속 옛 이름을 새 이름으로(그림 프롬프트와 id는 그대로) */
function renameEverywhere(old,nu){ let n=0; const skip=new Set(['id','charId','img','prompt','naiPrompt','naiPose','asset','seed','bannerId','eventId','kind','type','name']);
  // 옛 이름을 품은 다른 이름(예: 세라 → 세라핀)은 건드리지 않게 잠깐 감춰 둬요
  const others=[...new Set([...G.chars,...(G.npcs||[])].map(x=>x.name).filter(x=>x&&x!==old&&x!==nu&&x.includes(old)))];
  const fix=v=>{ if(!v.includes(old)) return v; let t=v; others.forEach((o,i)=>{ t=t.split(o).join('\u0000'+i+'\u0000'); }); if(!t.includes(old)) return v; t=t.split(old).join(nu); others.forEach((o,i)=>{ t=t.split('\u0000'+i+'\u0000').join(o); }); n++; return t; };
  const walk=x=>{ if(Array.isArray(x)){ x.forEach((v,i)=>{ if(typeof v==='string') x[i]=fix(v); else if(v&&typeof v==='object') walk(v); }); return; }
    if(!x||typeof x!=='object') return; Object.keys(x).forEach(k=>{ if(skip.has(k)) return; const v=x[k]; if(typeof v==='string') x[k]=fix(v); else if(v&&typeof v==='object') walk(v); }); };
  [G.chapters,G.threads,G.events,G.chars,G.npcs,G.opening,G.world,G.banners,RELS()].forEach(walk); RELS().forEach(r=>relNames(r)); // 관계 설명·있었던 일 속 이름도, 관계에 적어 둔 두 사람 이름도
  (G.banners||[]).forEach(b=>{ if(typeof b.name==='string'){ const x=fix(b.name); if(x!==b.name){ b.name=x; } } }); if(n){ markAll(); mark('prog'); } return n; }
function readCharForm(c){
  const name=$('#f_name').value.trim(); if(!name){toast('이름을 입력해 주세요');return false;}
  const aff={}; lines($('#f_aff').value).forEach(l=>{const m=l.match(/^(\d+)\s*[:：]\s*(.+)$/); if(m)(aff[m[1]]=aff[m[1]]||[]).push(m[2]);});
  const files=lines($('#f_files').value).map(l=>{const m=l.match(/^(\d)\s*[:：]\s*(.+)$/);return m?{dup:+m[1],text:m[2]}:{dup:1,text:l};});
  Object.assign(c,{baseStatsVersion:1,name,faction:$('#f_fac').value.trim(),rarity:+$('#f_rar').value,role:(posById($('#f_pos').value)||posOf(c)).base,pos:(posById($('#f_pos').value)||posOf(c)).id,elem:$('#f_elem').value,limited:$('#f_lim').value==='1',
    hp:num($('#f_hp').value,100,1e10,1000),atk:num($('#f_atk').value,10,9999,100),def:num($('#f_def').value,0,1e8,50),spd:num($('#f_spd').value,30,300,100),
    profile:$('#f_prof').value.trim(),intro:$('#f_intro').value.trim(),lines:lines($('#f_lines').value),affLines:aff,files,
    lvLines:lines($('#f_lv').value),dupLines:lines($('#f_dup').value),
    touch:{head:lines($('#f_head').value),body:lines($('#f_body').value),pet:(c.touch&&c.touch.pet)||[]},naiPrompt:$('#f_nai').value.trim(),noDesign:$('#f_nodesign')?$('#f_nodesign').checked:!!c.noDesign});
  c.weapon=Object.assign(c.weapon||{id:'w_'+c.id,img:null},{name:$('#f_wn').value.trim(),desc:$('#f_wd').value.trim(),prompt:$('#f_wp').value.trim()});
  naiBlocksSave(c,'naiPrompt','f_nai');naiBlocksSave(c.weapon,'prompt','f_wp');
  if(!c.weapon.id||c.weapon.id==='w_') c.weapon.id='w_'+c.id;
  c.skill={name:$('#f_sk').value.trim()||'스킬',kind:$('#f_kind').value,power:num($('#f_pow').value,0.1,10,1.5),cd:num(Math.round($('#f_cd').value),1,9,3),desc:$('#f_skd').value.trim()};
  return true;
}
function stageOptions(cur){const o=[['','조건 없음']];G.chapters.forEach((ch)=>ch.stages.forEach((s)=>o.push([s.id,`${ch.kind==='event'?'[이벤트] ':''}${stageCode(s.id)} ${s.title}`])));return opt(o,cur||'');}
function openEpEdit(cid,eid){
  const c=charById(cid); const e=eid?c.episodes.find(x=>x.id===eid):{id:'',lv:[2,4,6,8,10].find(l=>!c.episodes.some(x=>x.lv===l))||10,dup:0,after:'',title:'',script:''};
  openModal(`${head(`${esc(c.name)} 개인 스토리`)}
    <div class="g2"><div><label class="f" for="ep_lv">호감도 조건</label><select class="in" id="ep_lv">${opt([1,2,3,4,5,6,7,8,9,10].map(n=>[n,'Lv.'+n]),e.lv)}</select></div>
    <div><label class="f" for="ep_dup">${T('limit')} 조건</label><select class="in" id="ep_dup">${opt([0,1,2,3,4,5].map(n=>[n,n?n+'단계':'없음']),e.dup||0)}</select></div></div>
    <label class="f" for="ep_after">메인 스토리 조건 (이 스테이지를 깨야 열림)</label><select class="in" id="ep_after">${stageOptions(e.after)}</select>
    <label class="f" for="ep_title">제목</label><input class="in" id="ep_title" value="${esc(e.title)}">
    <label class="f" for="ep_script">대본</label><textarea class="in tall" id="ep_script">${esc(e.script)}</textarea><button class="btn sm ghost scimg-b" data-act="scimg" data-ta="ep_script">🖼 이미지 넣기</button>
    <p class="muted" style="margin:4px 0 0">이름: 대사 / 이름[표정]: 대사 / [배경: 이름] / [소품: 이름] / [음악: 이름] / [효과음: 이름] / [톡: 이름] ~ [톡 끝] / 선택: A | B 와 1) 2) 분기</p>
    <label class="f" for="ep_hint">AI에게 바라는 내용 (선택)</label><input class="in" id="ep_hint" placeholder="예: 메인 2장 사건 직후, 둘만 남은 옥상">
    <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="aiep" data-id="${cid}">AI로 대본 쓰기</button></div>
    <div class="row" style="margin-top:16px"><button class="btn" data-act="saveep" data-id="${cid}" data-ep="${e.id}">저장</button>${eid?`<button class="btn ghost" data-act="delep" data-id="${cid}" data-ep="${e.id}">삭제</button>`:''}</div>`);
}
function trigOptions(cur){
  const v=cur?(cur.type==='start'?'start':cur.type+':'+cur.value):'start';
  const o=[['start','계약 직후']];
  for(let i=1;i<=10;i++) o.push(['aff:'+i,`호감도 Lv.${i} 달성`]);
  G.chapters.forEach((ch,ci)=>ch.stages.forEach((s,si)=>o.push(['clear:'+s.id,`${ci+1}-${si+1} ${s.title} 클리어`])));
  return opt(o,v);
}
function openThEdit(cid,tid){
  const c=charById(cid); const t=tid?threadById(tid):{id:'',title:'',trigger:{type:'aff',value:3},needOwn:true,script:''};
  openModal(`${head(`${esc(c.name)} ${esc(T('talk'))}`)}
    <label class="f" for="th_title">제목</label><input class="in" id="th_title" value="${esc(t.title)}">
    <label class="f" for="th_trig">도착 조건</label><select class="in" id="th_trig">${trigOptions(t.trigger)}</select>
    <label class="f" for="th_own">계약 필요 여부</label><select class="in" id="th_own">${opt([['1','계약한 경우에만'],['0','계약 전에도 도착']],t.needOwn===false?'0':'1')}</select>
    <label class="f" for="th_script">대화</label><textarea class="in tall" id="th_script" placeholder="${esc(c.name)}: 메시지&#10;선택: 답장1 | 답장2&#10;1) ${esc(c.name)}: 1번 답장에 대한 반응&#10;[사진: 소품이름]">${esc(t.script)}</textarea>
    <label class="f" for="th_hint">AI에게 바라는 내용 (선택)</label><input class="in" id="th_hint" placeholder="예: 새벽에 잠이 안 온다며 셀카를 보낼지 고민하는 대화">
    <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="aithread" data-id="${cid}">AI로 대화 쓰기</button></div>
    <div class="row" style="margin-top:16px"><button class="btn" data-act="saveth" data-id="${cid}" data-th="${t.id}">저장</button>${tid?`<button class="btn ghost" data-act="resetth" data-th="${t.id}">다시 받기</button><button class="btn ghost" data-act="delth" data-id="${cid}" data-th="${t.id}">삭제</button>`:''}</div>`);
}
let squadSel=null;
const unitPower=st=>Math.round(st.hp/5+st.atk*3+st.def*2+st.spd);
const charPower=c=>unitPower(stats(c));
const enemyPower=e=>unitPower({hp:e.hp,atk:e.atk,def:e.def,spd:e.spd});
function stagePower(s){return Math.round(s.enemies.reduce((a,e)=>a+enemyPower(e),0)*1.15);}
function factionBonus(ids){const cnt={};ids.map(charById).filter(Boolean).forEach(c=>{if(c.faction)cnt[c.faction]=(cnt[c.faction]||0)+1;});const out={};Object.entries(cnt).forEach(([f,n])=>{if(n>=2)out[f]=n>=4?15:n>=3?10:5;});return out;}
function teamPower(ids){const fb=factionBonus(ids);return ids.map(charById).filter(Boolean).reduce((a,c)=>a+Math.round(charPower(c)*(1+(fb[c.faction]||0)/100)),0);}

