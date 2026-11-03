/* =========================================================
   AI
   ========================================================= */
const STORY_LEN={short:['짧게',{pre:'8~12',post:'4~6',pro:'18~24'}],normal:['보통',{pre:'15~25',post:'8~15',pro:'30~40'}],long:['길게',{pre:'25~40',post:'12~20',pro:'45~60'}],xlong:['아주 길게',{pre:'40~60',post:'20~30',pro:'60~80'}]};
function storyCfg(){ const s=(G.meta&&G.meta.story)||{}; return {finale:finaleOf(s.finale),stages:+s.stages||0,len:STORY_LEN[s.len]?s.len:'normal',plot:String(s.plot||''),depth:s.depth==='fast'?'fast':'deep',newc:s.newc==null?2:Math.max(0,Math.min(3,+s.newc||0)),talkOnly:s.talkOnly==null?1:Math.max(0,Math.min(3,+s.talkOnly||0))}; }
function storyN(def){ return storyCfg().stages||def; }
function lenSpec(){ return STORY_LEN[storyCfg().len][1]; }
function storyFormHTML(sc){ sc=sc||{}; return `<details class="optbox" style="margin-top:10px" ${sc.plot?'open':''}><summary><b>스토리 직접 짜기 · 분량</b> <span class="muted" style="font-size:.8rem">(선택)</span></summary>
    <label class="f" for="ng_story">내가 짠 스토리 (적으면 AI가 이 줄거리를 따라요)</label><textarea class="in tall" id="ng_story" placeholder="예: 1장 - 주인공이 몰락한 왕국의 마지막 기사를 구한다. 2장 - 기사의 배신 의혹… 결말은 주인공이 왕좌를 거절한다. 주요 인물: 레아(기사, 무뚝뚝), 미르(마녀, 장난꾸러기)">${esc(sc.plot||'')}</textarea><p class="muted" id="story-char-count">${String(sc.plot||'').length.toLocaleString()} / 100,000자 · 50,000자 이상은 AI 전달량이 커질 수 있어요. 초과 내용은 자동으로 자르지 않습니다.</p>
    <div class="g2"><div><label class="f" for="ng_stages">장마다 스테이지 수</label><select class="in" id="ng_stages">${opt([[0,'자동 (4~5개)'],[3,'3개'],[4,'4개'],[5,'5개'],[6,'6개'],[8,'8개'],[10,'10개']],+sc.stages||0)}</select></div>
    <div><label class="f" for="ng_len">스토리 분량</label><select class="in" id="ng_len">${opt(Object.entries(STORY_LEN).map(([k,v])=>[k,v[0]+' (대본 '+v[1].pre+'줄)']),sc.len||'normal')}</select></div></div>
    <div class="g2"><div><label class="f" for="ng_depth">스토리 제작 방식</label><select class="in" id="ng_depth">${opt([['deep','꼼꼼하게 (구성 → 스테이지마다 따로 집필)'],['fast','빠르게 (한 번에)']],sc.depth==='fast'?'fast':'deep')}</select></div>
    <div><label class="f" for="ng_newc">새 장·이벤트마다 새 ${esc(T('crew'))}</label><select class="in" id="ng_newc">${opt([[0,'만들지 않기'],[1,'1명'],[2,'2명 (권장)'],[3,'3명']],sc.newc==null?2:+sc.newc)}</select></div></div>
    <label class="f" for="ng_talkonly">장마다 전투 없는 이야기 스테이지</label><select class="in" id="ng_talkonly">${opt([[0,'없음'],[1,'1개 정도'],[2,'2개 정도'],[3,'많이 (절반 가까이)']],sc.talkOnly==null?1:+sc.talkOnly)}</select>
    <p class="muted" style="margin:4px 0 0;font-size:.78rem">이후 AI가 새 장을 쓸 때도 이 설정을 따라요. 설정 → 게임 정의에서 바꿀 수 있어요. 길게·꼼꼼하게 할수록 AI 사용량과 시간이 늘어요. 꼼꼼하게는 장 전체 구성을 먼저 짜고(장면·인물 관계·복선), 스테이지마다 따로 대본을 써서 묘사가 훨씬 두꺼워요.</p></details>`; }
function readStoryForm(){ return {plot:($('#ng_story')?$('#ng_story').value.trim():''),stages:$('#ng_stages')?+$('#ng_stages').value||0:0,len:$('#ng_len')?$('#ng_len').value:'normal',depth:$('#ng_depth')?$('#ng_depth').value:'deep',newc:$('#ng_newc')?+$('#ng_newc').value:2,talkOnly:$('#ng_talkonly')?+$('#ng_talkonly').value:1}; }
