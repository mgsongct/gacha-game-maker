/* ===== 앱 업데이트 (GitHub에서 index.html 받기) ===== */
const LVKEY='starfall-live';

/* ---- public release channel ---- */
const RELEASE_REPO='jjhk0803/gacha-game-maker', RELEASE_REPO_OLD='jjhk0803/starfall-contract';
function verCmp(a,b){a=String(a||'').split(/\D+/).map(Number);b=String(b||'').split(/\D+/).map(Number);for(let i=0;i<Math.max(a.length,b.length);i++){const x=a[i]||0,y=b[i]||0;if(x!==y)return x<y?-1:1;}return 0;}
function updRepo(o){return String((o&&o.repo)||RELEASE_REPO).trim();}
async function sha256hex(text){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');}
// 바깥 링크: 새 창이 막혀도(팝업 차단·인앱 브라우저) 앱 페이지를 떠나지 않게, 누를 수 있는 링크와 복사 버튼을 보여 줘요(뒤에서 만들던 작업이 끊기지 않게)
function openUrl(url){ try{ if(CAP&&CAP.Browser){ CAP.Browser.open({url}); return; } }catch(e){} let w=null; try{ w=window.open(url,'_blank'); }catch(e){} if(w){ try{ w.opener=null; }catch(e){} return; }
  openModal(`${head('링크 열기')}<p class="muted" style="margin:0 0 8px">새 창을 열지 못했어요. 아래 링크를 눌러 열거나 복사해서 브라우저에 붙여 넣어 주세요.</p><a class="btn block" href="${esc(url)}" target="_blank" rel="noopener">열기</a><div class="code-box" style="margin:10px 0;padding:8px;word-break:break-all;user-select:all">${esc(url)}</div><div class="row"><button class="btn ghost" data-act="copy" data-text="${esc(url)}">주소 복사</button></div>`); }
let UPD=null;
