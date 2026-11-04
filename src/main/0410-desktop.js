/* ===== PC 화면 ===== */
/* 화면 방향(휴대폰): auto=기기 회전 따라, portrait=세로 고정, landscape=가로 고정. 앱은 화면 방향 플러그인, 웹은 브라우저 기능으로 잠가요 */
function orientPref(){ try{ return appStorage.getItem('ggm-orient')||'auto'; }catch(e){ return 'auto'; } }
async function applyOrient(){ const v=orientPref(), SO=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.ScreenOrientation;
  try{ if(SO){ if(v==='auto') await SO.unlock(); else await SO.lock({orientation:v}); return true; } }catch(e){ quietErr(e,'0410-desktop.js:5'); }
  try{ if(screen.orientation){ if(v==='auto') screen.orientation.unlock(); else await screen.orientation.lock(v); return true; } }catch(e){ quietErr(e,'0410-desktop.js:6'); } return v==='auto'; }
function deskMode(){ const def=Math.min(screen.width||innerWidth,screen.height||innerHeight)<600?'auto':'wide'; let v=def; try{ v=appStorage.getItem('ggm-desk')||def; }catch(e){} return v; }
function applyDesk(){ const W=window.innerWidth, H=window.innerHeight, land=W>H*1.15, wantW=deskMode()==='wide', small=Math.min(W,H)<600;
  // 휴대폰도 'PC 화면: 가로로 넓게'를 직접 고르면 가로로 돌렸을 때 PC 화면으로 보여요
  let picked=''; try{ picked=appStorage.getItem('ggm-desk')||''; }catch(e){}
  const on=deskMode()!=='off'&&(W>=900||(picked==='wide'&&land&&W>=600)); document.body.classList.toggle('desk',on); document.body.classList.toggle('wide',on&&wantW&&land);
  let rh=$('#rotHint'); const needRot=picked==='wide'&&small&&!land&&orientPref()!=='portrait';
  if(needRot&&!rh){ rh=document.createElement('div'); rh.id='rotHint'; rh.innerHTML='📱↻ PC 화면으로 보려면 휴대폰을 가로로 돌려 주세요 <button type="button" onclick="this.parentNode.remove()">닫기</button>'; document.body.appendChild(rh); } else if(!needRot&&rh) rh.remove();
  let side=$('#deskSide'); if(!on){ if(side) side.remove(); return; }
  if(!side){ side=document.createElement('aside'); side.id='deskSide'; document.body.appendChild(side); }
  side.innerHTML=`<div class="ds-logo"><i>GACHA GAME MAKER</i><b>${esc(G.meta.title)}</b><span>${esc(G.meta.sub||'')}</span></div>
    <div class="ds-keys"><h4>키보드</h4><p><kbd>1</kbd>~<kbd>5</kbd> 아래 메뉴</p><p><kbd>Space</kbd> <kbd>Enter</kbd> 대사 넘기기</p><p><kbd>Esc</kbd> 창 닫기</p><p><kbd>A</kbd> 스토리 자동 진행</p></div>
    <p class="ds-foot">설정 → 아이폰·웹 연결에서 PC 화면을 끌 수 있어요.</p>`;
  try{ const l=G.lib.find(x=>x.kind==='bg'&&x.name===P().lobbyBg), s=l&&imgSrc(l); document.body.style.setProperty('--deskbg',s?`url('${s}')`:'none'); }catch(e){}
}
window.addEventListener('resize',()=>{ clearTimeout(window.__dk); window.__dk=setTimeout(applyDesk,150); });
document.addEventListener('keydown',e=>{
  const tg=e.target, typing=tg&&(/^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName)||tg.isContentEditable); if(typing||e.ctrlKey||e.metaKey||e.altKey) return;
  const modalOpen=!$('#modal').hidden, phoneOpen=!$('#phone').hidden, ov=$('#ov');
  if(e.key==='Escape'){ if(modalOpen){ window.navBack(); e.preventDefault(); e.stopImmediatePropagation(); } else if(phoneOpen){ closePhone(); e.preventDefault(); } return; }
  if(modalOpen||phoneOpen) return;
  if(!ov.hidden){ const vn=$('#vn'), ti=ov.querySelector('.title,[data-act=opnext]');
    if(vn&&(e.key===' '||e.key==='Enter'||e.key==='ArrowRight')){ e.preventDefault(); const el=$('#vnCh'); if(el&&el.children.length) return; vn.click(); return; }
    if(vn&&(e.key==='a'||e.key==='A')){ const b=$('#vnAuto'); if(b) b.click(); return; }
    if(ti&&(e.key===' '||e.key==='Enter')){ e.preventDefault(); ti.click(); }
    return; }
  const map={'1':'crew','2':'ops','3':'lobby','4':'contract','5':'studio'}; if(map[e.key]){ const b=document.querySelector(`.tab[data-tab="${map[e.key]}"]`); if(b) b.click(); }
});
/* 홈 화면에 추가 안내 창 내용(View) */
function a2hsHTML(){ return `${head('홈 화면에 추가해 주세요',`<span class="muted">아이폰은 앱처럼 쓰려면 이 단계가 필요해요</span>`)}
    <ol class="a2hs"><li>Safari 아래쪽(또는 위쪽)의 <b>공유 버튼</b> <span class="kbd">⬆︎</span>을 눌러요.</li><li>목록을 내려서 <b>홈 화면에 추가</b>를 눌러요.</li><li>오른쪽 위 <b>추가</b>를 누르면 홈 화면에 '가챠 메이커' 아이콘이 생겨요.</li><li>앞으로는 그 아이콘으로 열어요. 전체 화면으로 열리고, 저장한 게임도 안전하게 남아요.</li></ol>
    <p class="muted">Safari 탭에서 그냥 쓰면 오래 안 열었을 때 아이폰이 저장 데이터를 지울 수 있어요. 가끔 설정 → 백업으로 내보내 두면 더 안전해요.</p>
    ${pcOrigin()?'<p class="muted"><b>PC 서버로 접속 중이에요.</b> 게임은 PC에 저장되니 홈 화면에 추가하지 않아도 돼요. 바깥 주소(trycloudflare)는 PC 서버를 켤 때마다 바뀌어서, 홈 화면 아이콘은 다음에 안 열릴 수 있어요. 그럴 땐 PC의 QR을 다시 찍으면 PC에 저장된 게임이 그대로 이어져요.</p>':''}
    <div class="row" style="margin-top:12px"><button class="btn" data-act="close">알겠어요</button></div>`; }
function openA2HS(first){ if(first) appStorage.setItem('ggm-a2hs','1');
  openModal(a2hsHTML()); }
function openProxySet(){
  openModal(`${head('중계 서버 (아이폰·웹)')}
    <p class="muted">브라우저는 보안 규칙(CORS) 때문에 일부 AI 서비스에 직접 연결하지 못해요. 그럴 때만 중계 서버를 거쳐요. 직접 연결이 되는 서비스는 그대로 직접 연결해요.</p>
    <label class="f" for="px_url">중계 서버 주소</label><input class="in" id="px_url" value="${esc(webProxy())}" placeholder="https://내-이름.workers.dev">
    <p class="muted" style="margin:6px 0 0">Cloudflare Workers나 Vercel에 무료로 직접 만들 수 있어요. 만드는 법은 배포 페이지 README의 '아이폰' 항목과 proxy 폴더에 있어요(Vercel은 proxy/vercel). 중계 서버를 거치는 요청에는 API 키가 함께 지나가니, 내가 만든 서버나 믿을 수 있는 서버만 넣어 주세요.</p>
    <div class="row" style="margin-top:14px"><button class="btn" data-act="pxsave">저장</button><button class="btn ghost" data-act="pxtest">연결 확인</button></div>`); }
