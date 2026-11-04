/* ===== 0260-new-game — View(HTML·DOM을 만듦) ===== */
/* src/main/0260-new-game/010-draft.js에서 옮김 */
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
function drLibHTML(){ const a=drLib(); return `<div class="dr-lib" id="drLib"><div class="row" style="margin:0 0 6px"><b style="flex:1">저장한 초안 ${a.length}개</b><button class="btn sm" data-act="drlibsave">💾 지금 초안 저장</button></div>
  <div class="row" style="margin:0 0 6px"><button class="btn sm ghost" data-act="drxcur">📤 지금 초안 내보내기</button><button class="btn sm ghost" data-act="drimport">📥 가져오기 (코드·파일)</button></div>
  ${a.length?a.map(x=>`<div class="sw-pjr"><b>${esc(x.name)}</b><i>${new Date(x.at).toLocaleDateString()}</i><button class="btn sm" data-act="drlibload" data-id="${x.id}">불러오기</button><button class="btn sm ghost" data-act="drxlib" data-id="${x.id}">내보내기</button><button class="btn sm ghost" data-act="drlibdel" data-id="${x.id}">✕</button></div>`).join(''):'<p class="muted" style="margin:0;font-size:.8rem">아직 없어요. 지금 초안을 저장해 두면 언제든 이대로 다시 만들 수 있어요.</p>'}</div>`; }
function drRead(){ if(!DR2||!$('#drPage')) return; const v=id=>{const el=$('#'+id);return el?(el.type==='checkbox'?el.checked:el.value):undefined;}, set=(k,id,f)=>{const x=v(id); if(x!==undefined) DR2[k]=f?f(x):x;};
  set('auto','dr_auto'); set('gtitle','dr_gtitle'); set('crewTerm','dr_crew',x=>String(x||'').trim().slice(0,8)); set('castSex','dr_cast'); set('kw','ng_kw'); set('tone','ng_tone'); set('theme','ng_theme'); set('n','ng_n',Number); set('style','ng_style'); set('fan','ng_fan'); set('src','ng_src'); set('story','ng_story'); set('stages','ng_stages',Number); set('len','ng_len'); set('depth','ng_depth'); set('newc','ng_newc',Number); set('talkOnly','ng_talkonly',Number); set('con','ng_con'); set('world','dr_world'); set('setting','dr_setting');
  document.querySelectorAll('#drPage [data-dc]').forEach(e=>{ const c=DR2.chars[+e.dataset.i]; if(c){c[e.dataset.dc]=e.value;if(e.dataset.dc==='tags')naiBlocksSave(c,'tags',e);} });
  ['name','call','gender','look','bio'].forEach(k=>{ const x=v('dr_h_'+k); if(x!==undefined) DR2.hero[k]=x; }); const hd=v('dr_h_hide'); if(hd!==undefined) DR2.hero.hide=hd;
  drSave(); const el=$('#drCount'); if(el) el.textContent=nf(drLen()); }
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
    <label style="display:flex;gap:8px;align-items:center;margin-top:10px"><input type="checkbox" id="ng_con" ${d.con?'checked':''}><span><b>건조/영입 사용</b> <span class="muted" style="font-size:.8rem">(자원 4종을 넣어 영입 · 기본 ${esc(d.crewTerm||'동료')}은(는) 뽑기, 특별 의상 바리에이션은 건조로 · 나중에 설정에서 켜고 끌 수 있어요)</span></span></label>
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
function drHeroHTML(){ const hr=DR2.hero; return `<p class="muted dr-help">플레이어가 될 주인공이에요. 비워 두면 AI가 세계관에 맞게 정해요(글 AI가 없으면 기본 설정으로 시작해요). 시작한 뒤에는 설정 → 플레이어에서 바꿀 수 있어요.</p>
    <div class="g2"><div><label class="f" for="dr_h_call">호칭 <span class="muted" style="font-size:.75rem">(평소에 불리는 말)</span></label><input class="in" id="dr_h_call" maxlength="12" value="${esc(hr.call||'')}" placeholder="예: 지휘관 · 비우면 AI가 정해요"></div><div><label class="f" for="dr_h_name">이름 <span class="muted" style="font-size:.75rem">(필요할 때만)</span></label><input class="in" id="dr_h_name" maxlength="12" value="${esc(hr.name)}" placeholder="비우면 호칭으로만 불려요"></div></div>
    <label class="f" for="dr_h_gender">당신의 성별은? (직접 쓰기)</label><input class="in" id="dr_h_gender" maxlength="40" value="${esc(hr.gender)}" placeholder="예: 남성, 여성, 논바이너리… 비우면 AI가 정해요">
    <label class="f" for="dr_h_look">외모 (직접 쓰기)</label><textarea class="in" id="dr_h_look" maxlength="400" placeholder="예: 검은 단발, 회색 후드티">${esc(hr.look)}</textarea>
    <label class="f" for="dr_h_bio">설정 (성격·과거·직업·능력 등, 선택)</label><textarea class="in" id="dr_h_bio" maxlength="1500" placeholder="예: 기억을 잃고 이세계에 떨어진 평범한 회사원. 요리를 잘한다.">${esc(hr.bio||'')}</textarea>
    <label style="display:flex;gap:8px;align-items:center;margin-top:8px"><input type="checkbox" id="dr_h_hide" ${hr.hide?'checked':''}><span>앞머리로 눈 가리기 <span class="muted" style="font-size:.8rem">(미연시 주인공처럼)</span></span></label>
    <button class="btn sm ghost" data-act="drpolish" data-k="hero" style="margin-top:8px">✦ AI로 다듬기</button>
    ${imgReady()?`<div class="pf-av"><span id="drAvBox">${hr.av&&DRAVU?`<img src="${esc(DRAVU)}" alt="프로필">`:'<span>프로필 그림 없음</span>'}</span><div class="col"><button class="btn sm" data-act="drpfdraw" ${SAMPLE?'':'disabled'}>${hr.av?'다시 그리기':'외모로 프로필 그리기'}</button><span class="muted" style="font-size:.72rem">안 그리면 게임을 만들 때 외모로 같이 그려요</span></div></div>`:''}`; }
function drModeHTML(){ return `<div class="dr-modes"><button class="dr-mode" data-act="drmode" data-v="auto"><em>1</em><b>자율주행</b><span>한 줄만 적으면 AI가 세계관·인물·이야기를 모두 만들어요.<br><i>예: 미소녀들만 있는 이세계 판타지.</i></span></button>
    <button class="dr-mode" data-act="drmode" data-v="detail"><em>2</em><b>디테일</b><span>테마·세계관·설정·인물·주인공을 직접 자세히 적어요. 적은 건 그대로 살리고 빈 곳만 AI가 채워요.</span></button></div>`; }
function drAutoHTML(){ const d=DR2; return `<div class="dr-intro"><p><b>자율주행</b> · 만들고 싶은 게임을 한두 줄로 적어요. 나머지는 AI가 알아서 채워요.</p></div>
    <label class="f" for="dr_auto">어떤 게임을 만들까요?</label><textarea class="in" id="dr_auto" style="min-height:90px" placeholder="예: 미소녀들만 있는 이세계 판타지.">${esc(d.auto)}</textarea>
    <div class="chips" style="margin-top:6px">${['미소녀들만 있는 이세계 판타지.','멸망한 도시의 마지막 용병단.','우주 함대의 함장이 되어 동료를 모으는 SF.','요괴와 계약하는 현대 도시 오컬트.'].map(x=>`<button class="chip" data-act="drautoex" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div>
    <label class="f" for="dr_gtitle">게임 이름 (선택 · 비우면 AI가 지어요)</label><input class="in" id="dr_gtitle" maxlength="30" value="${esc(d.gtitle||'')}" placeholder="예: 심연잔향, 어비스 에코">
    <label class="f" for="dr_crew">아군 호칭 <span class="muted" style="font-size:.75rem">(유닛 이름 · 비우면 AI가 새로 지어요)</span></label><input class="in" id="dr_crew" maxlength="8" value="${esc(d.crewTerm||'')}" placeholder="예: 대원, 요원, 사도">
    <label class="f" for="dr_cast">등장인물 성별</label><select class="in" id="dr_cast">${opt([['','AI가 정하기 (키워드에 맞게)'],['f','여성만'],['m','남성만'],['mix','여성 + 남성 혼성']],d.castSex||'')}</select>
    <label class="f" for="ng_n">${esc(d.crewTerm||'동료')} 수</label><select class="in" id="ng_n">${opt([[6,'6명'],[8,'8명'],[10,'10명'],[12,'12명']],d.n)}</select>
    <label style="display:flex;gap:8px;align-items:center;margin-top:10px"><input type="checkbox" id="ng_con" ${d.con?'checked':''}><span><b>건조/영입 사용</b> <span class="muted" style="font-size:.8rem">(자원 4종을 넣어 영입 · 특별 의상 바리에이션은 건조로)</span></span></label>
    ${drPresetHTML()}
    <details class="optbox" style="margin-top:10px" ${d.hero.name||d.hero.gender||d.hero.look?'open':''}><summary><b>주인공</b> <span class="muted" style="font-size:.8rem">(선택 · 비우면 AI가 정해요)</span></summary>${drHeroHTML()}</details>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="drmake" ${SAMPLE?'':'disabled'}>이 내용으로 새 게임 만들기</button></div>
    ${SAMPLE?'':'<p class="muted" style="font-size:.8rem;margin:6px 0 0">글 AI를 등록하면 만들 수 있어요.</p>'}<p class="muted" id="ng_stat" style="margin:6px 0 0"></p><button class="linkb" data-act="ailog" style="margin-top:4px;font-size:.8rem">🔍 AI 기록 보기 (안 만들어질 때 원인 확인)</button>`; }
function openDraft(tab){ DR2=drLoad(); if(tab) DRTAB=tab;
  if(DR2.hero.av&&!DRAVU){ idbGet('draft_avatar').then(b=>{ if(b){ DRAVU=URL.createObjectURL(b); const el=$('#drAvBox'); if(el) el.innerHTML=`<img src="${esc(DRAVU)}" alt="프로필">`; } }).catch(()=>{}); }
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
function drRerender(){ modalKeep(openDraft); }
/* 초안 화면 부분 갱신(View): 보관함 열고 닫기·다시 그리기 · 탭 · 그림체 칩 · 미리 보기 · 만드는 동안 단추 잠금 */
function drLibToggle(){ const ex=$('#drLib'); if(ex){ ex.remove(); return; } const top=document.querySelector('#drPage .dr-top'); if(top) top.insertAdjacentHTML('afterend',drLibHTML()); }
function drLibRefresh(){ const ex=$('#drLib'); if(ex) ex.outerHTML=drLibHTML(); }
function drTabShow(){ document.querySelectorAll('#drPage [data-dr]').forEach(s=>s.hidden=s.dataset.dr!==DRTAB); document.querySelectorAll('#drPage [data-act=drtab]').forEach(b=>chipOn(b,b.dataset.k===DRTAB)); }
function drPresetShow(v){ document.querySelectorAll('.dr-pre').forEach(b=>chipOn(b,(b.dataset.v||'')===v)); }
function drPreviewToggle(tx){ const old=$('#drPrev'); if(old){ old.remove(); return; } $('#drPage').querySelector('.dr-intro').insertAdjacentHTML('beforeend',`<pre id="drPrev" class="code-box" style="white-space:pre-wrap;max-height:50vh;overflow:auto;margin-top:8px">${esc(tx||'아직 적은 설정이 없어요. 테마 탭의 장르와 키워드만으로 만들어요.')}</pre>`); }
function drBusy(t){ document.querySelectorAll('#drPage button').forEach(b=>{ if(b!==t&&b.dataset.act!=='ailog') b.disabled=true; }); t.textContent='만드는 중… 화면을 끄지 마세요'; return ()=>{ document.querySelectorAll('#drPage button').forEach(b=>b.disabled=false); if(t.isConnected) t.textContent='다시 시도'; }; }
