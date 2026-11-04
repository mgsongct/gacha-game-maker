/* ===== 0420-app-update — View(HTML·DOM을 만듦) ===== */
/* src/main/0420-app-update/0420-app-update.js에서 옮김 */
// 바깥 링크: 새 창이 막혀도(팝업 차단·인앱 브라우저) 앱 페이지를 떠나지 않게, 누를 수 있는 링크와 복사 버튼을 보여 줘요(뒤에서 만들던 작업이 끊기지 않게)
function openUrl(url){ try{ if(CAP&&CAP.Browser){ CAP.Browser.open({url}); return; } }catch(e){} let w=null; try{ w=window.open(url,'_blank'); }catch(e){} if(w){ try{ w.opener=null; }catch(e){} return; }
  openModal(`${head('링크 열기')}<p class="muted" style="margin:0 0 8px">새 창을 열지 못했어요. 아래 링크를 눌러 열거나 복사해서 브라우저에 붙여 넣어 주세요.</p><a class="btn block" href="${esc(url)}" target="_blank" rel="noopener">열기</a><div class="code-box" style="margin:10px 0;padding:8px;word-break:break-all;user-select:all">${esc(url)}</div><div class="row"><button class="btn ghost" data-act="copy" data-text="${esc(url)}">주소 복사</button></div>`); }
function updateCheckHTML(o){const r=o.lastCheck;if(!r)return '';return `<div class="panel" data-update-check><b>최근 업데이트 확인</b><p>실행 버전: ${esc(r.running)}<br>설치 APK: ${esc(r.installed)}<br>확인한 배포본: ${esc(r.remote)}<br>필요 APK: ${esc(r.minimum||'별도 요구 없음')}</p><p class="muted">${esc(r.repo)} · ${esc(r.branch)}<br>${esc(r.result)} · ${esc(new Date(r.at).toLocaleString())}</p></div>`;}
function updateAPKRequired(man,html,repo=updRepo(LV()),branch=LV().branch||'main'){
 let minimum;try{minimum=updateMinimum(man,html);}catch(e){UPD=null;toast(e.message);return true;}const installed=window.__SHELL__||APP_BUILD;
 if(!minimum||verCmp(installed,minimum)>=0)return false;
 UPD=null;updateCheckRecord(man,repo,branch,'새 APK 설치 필요',html);
 openModal(`${head('새 APK 설치가 필요해요')}<p>이번 업데이트는 앱의 시작 방식·저장 기능 또는 안드로이드 기능과의 호환 조건이 바뀌어, 앱 안에서 받는 패치만으로는 적용할 수 없어요.</p><div class="panel"><p>현재 설치 APK: <b>${esc(installed)}</b><br>필요한 APK: <b>${esc(minimum)} 이상</b><br>업데이트 버전: <b>${esc(man.build)}</b></p></div><p><b>기존 앱을 삭제하지 말고 새 APK를 내려받아 덮어 설치해 주세요.</b> 같은 공식 앱과 서명으로 설치하면 기존 게임 데이터를 유지합니다. 앱 삭제·데이터 초기화는 하지 마세요.</p><p>GitHub 릴리즈 화면의 <b>Assets(첨부 파일)</b>에서 <b>gacha-game-maker.apk</b>를 내려받고, 다운로드한 APK 파일을 열어 설치해 주세요. Source code ZIP은 앱 설치 파일이 아닙니다.</p>${notesHTML(man)}<div class="row"><button class="btn" data-act="apkget" data-url="${esc(updateReleaseURL(man))}">GitHub 릴리즈 열기</button><button class="btn ghost" data-act="close">나중에</button></div>`);
 return true;
}
/* 새 업데이트 안내 창 내용(View) */
function updateFoundHTML(man){ return `${head('업데이트가 있어요',`<span class="muted">${esc(APP_BUILD)} → <b>${esc(man.build)}</b></span>`)}${notesHTML(man)}
    <div class="row" style="margin-top:12px"><button class="btn" data-act="updget">받기</button><button class="btn ghost" data-act="updskip">이번 버전 건너뛰기</button><button class="btn ghost" data-act="close">나중에</button></div>`; }
/* 전에 문제가 있던 버전 안내 창 내용(View) */
function updateBadHTML(man){ return `${head('이 버전은 전에 문제가 있었어요',`<span class="muted">${esc(man.build)}</span>`)}<p>이 버전은 이 기기에서 제대로 실행되지 않아서 설치 버전으로 돌아왔었어요. 새 버전이 나오면 자동으로 다시 알려 드려요.</p><div class="row" style="margin-top:12px"><button class="btn ghost" data-act="updget">그래도 받기</button><button class="btn" data-act="close">닫기</button></div>`; }
/* 업데이트를 받은 뒤 창 내용(View) */
function updateReadyHTML(build){ return `${head('업데이트를 받았어요')}<p>버전 <b>${esc(build)}</b>. 다시 시작하면 적용돼요. 문제가 생기면 설정 → 앱 업데이트에서 이전 버전으로 되돌릴 수 있어요.</p><div class="row" style="margin-top:12px"><button class="btn" data-act="reload">지금 다시 시작</button><button class="btn ghost" data-act="close">나중에</button></div>`; }
/* 웹 업데이트 안내 창 내용(View) */
function updateWebFoundHTML(man,srvOld){ return `${head('업데이트가 있어요',`<span class="muted">${esc(APP_BUILD)} → <b>${esc(man.build)}</b></span>`)}${notesHTML(man)}
      ${srvOld?'<p class="muted" style="font-size:.82rem">PC 서버 프로그램(ggm-server.py)도 바뀌었어요. Releases의 gacha-game-maker-pc.zip을 새로 받아 덮어쓰면 좋아요.</p>':''}
      <div class="row" style="margin-top:12px"><button class="btn" data-act="webupdgo">지금 업데이트</button><button class="btn ghost" data-act="webupdskip">이번 버전 건너뛰기</button><button class="btn ghost" data-act="close">나중에</button></div>`; }
function notesHTML(man){const n=Array.isArray(man.notes)?man.notes:String(man.notes||'').split('|').map(x=>x.trim()).filter(Boolean);return n.length?`<div class="panel" style="margin:8px 0"><h3>바뀐 점</h3><ul style="margin:0;padding-left:18px">${n.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:'';}
function openUpdSet(){
  const o=LV(), hasPrev=!!o.prevBuild;
  openModal(`${head('앱 업데이트',`<span class="muted">지금 실행 중: ${esc(window.__LIVE__?('온라인 업데이트 '+window.__LIVE__):('설치 버전 '+APP_BUILD))} · 앱 ${esc(window.__SHELL__||APP_BUILD)}</span>`)}
    <p class="muted">앱이 GitHub 공개 저장소에서 새 버전을 받아 와요. 게임 데이터와 키는 그대로 남아요. 받기 전에 바뀐 점을 보여 주고 물어봐요.</p>
    ${updateCheckHTML(o)}
    <label class="f" for="up_mode">새 버전이 있으면</label><select class="in" id="up_mode">${opt([['ask','물어보고 받기'],['silent','조용히 받아서 다음 실행에 적용'],['off','확인하지 않기']],o.auto===false?'off':(o.mode||'ask'))}</select>
    <details style="margin-top:10px"><summary class="muted">개발자용: 받을 저장소 바꾸기</summary>
      <label class="f" for="up_repo">저장소 (아이디/저장소이름, 비우면 기본 ${RELEASE_REPO})</label><input class="in" id="up_repo" value="${esc(o.repo||'')}" placeholder="${RELEASE_REPO}">
      <div class="g2"><div><label class="f" for="up_br">브랜치</label><input class="in" id="up_br" value="${esc(o.branch||'main')}"></div><div><label class="f" for="up_path">파일 경로</label><input class="in" id="up_path" value="${esc(o.path||'www/index.html')}"></div></div>
      <label class="f" for="up_tok">읽기 전용 토큰 (비공개 저장소일 때만)</label><input class="in" id="up_tok" type="password" autocomplete="off" value="${esc(o.token||'')}" placeholder="github_pat_...">
    </details>
    <div class="row" style="margin-top:14px"><button class="btn" data-act="upsave">저장하고 확인</button><button class="btn ghost" data-act="relnotes">배포 페이지</button></div>
    <div class="row" style="margin-top:8px">${hasPrev?'<button class="btn sm ghost" data-act="uprollback">이전 버전으로 되돌리기</button>':''}${o.on?'<button class="btn sm ghost" data-act="upbuiltin">설치 버전으로 돌아가기</button>':''}</div>`);
}
function openAiChapter(){
  openModal(`${head(`AI로 ${G.chapters.length+1}장 만들기`)}
    <label class="f" for="ai_d">이야기 방향</label><textarea class="in" id="ai_d" placeholder="예: 헬릭스의 비밀 연구소에 잠입한다. 세라의 과거 동료가 적으로 나온다. 중간에 미호와 단둘이 변장하고 파티장에 숨어드는 장면."></textarea>
    <label class="f" for="ai_n">스테이지 수</label><select class="in" id="ai_n">${opt([[3,'3개'],[4,'4개'],[5,'5개'],[6,'6개'],[8,'8개'],[10,'10개']],storyN(4))}</select>
    <label class="f">주요 등장 ${esc(T('crew'))}</label><div class="chips">${G.chars.map(c=>`<button class="chip" data-act="castt" data-id="${c.id}">${esc(c.name)}</button>`).join('')}</div>
    <div class="row" style="margin-top:14px"><button class="btn" data-act="aichapter">만들기</button></div>
    <p class="muted">새로 필요한 배경은 자료실에 NAI 프롬프트와 함께 추가되고, ${T('talk')}도 1~2개 함께 만들어져요. 시간이 조금 걸려요.</p>`);
}
function openBackup(){
  openModal(`${head('백업과 가져오기')}
    <label class="f" for="bk_out">현재 데이터</label><textarea class="in tall" id="bk_out" readonly>${esc(JSON.stringify(G))}</textarea>
    <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-act="copyfield" data-f="bk_out">복사</button></div>
    <label class="f" for="bk_in">가져올 데이터 붙여넣기</label><textarea class="in" id="bk_in"></textarea>
    <div class="row" style="margin-top:8px"><button class="btn sm" data-act="importbk">가져오기</button></div>`);
}
