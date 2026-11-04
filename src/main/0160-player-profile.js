/* ===== 플레이어(관리관) 프로필 — 호칭·성별·외형·소개, 아바타 그리기 ===== */
const EYE_TAG=/\b(eyes?|eyelash(es)?|pupils?|heterochromia|eyeliner|tsurime|tareme|sanpaku|jitome)\b/i;

function playerFormHTML(){ const p=P(), ai=!!SAMPLE, av=p.avatar&&imgSrc(p.avatar);
  return `<div class="g2"><div><label class="f" for="pf_call">호칭 <span class="muted" style="font-size:.75rem">(평소에 불리는 말)</span></label><input class="in" id="pf_call" maxlength="12" value="${esc(T('player'))}" placeholder="예: 지휘관"></div><div><label class="f" for="pf_name">이름 <span class="muted" style="font-size:.75rem">(필요할 때만)</span></label><input class="in" id="pf_name" maxlength="12" value="${esc(p.player||'')}" placeholder="비우면 호칭으로만 불려요"></div></div>
  ${ai?`<label class="f" for="pf_gender">당신의 성별은? (직접 쓰기)</label><input class="in" id="pf_gender" maxlength="40" value="${esc(p.genderTxt!=null?p.genderTxt:(({m:'남성',f:'여성'})[p.gender]||''))}" placeholder="예: 남성, 여성, 논바이너리… 비우면 정하지 않아요">
  <label class="f" for="pf_look">외모 (직접 쓰기)</label><textarea class="in" id="pf_look" maxlength="400" placeholder="예: 검은 단발, 회색 후드티, 키가 크고 마른 편, 왼쪽 귀에 피어싱">${esc(p.look||'')}</textarea>
  <label class="f" for="pf_bio">설정 (성격·과거·직업·능력 등, 직접 쓰기)</label><textarea class="in" id="pf_bio" maxlength="1500" placeholder="예: 전직 기사단 정보원. 말수가 적고 단 걸 좋아한다. 잃어버린 기억을 찾고 있다.">${esc(p.bio||'')}</textarea>
  <label style="display:flex;gap:8px;align-items:center;margin-top:8px"><input type="checkbox" id="pf_hide" ${p.hideEyes?'checked':''}><span>앞머리로 눈 가리기 <span class="muted" style="font-size:.8rem">(미연시 주인공처럼 눈이 보이지 않게 그려요)</span></span></label>
`
  :`<label class="f" for="pf_gsel">성별</label><select class="in" id="pf_gsel">${opt([['m','남성'],['f','여성']],p.gender==='f'?'f':'m')}</select><p class="muted" style="font-size:.8rem;margin:6px 0 0">글 AI를 등록하면 성별과 외모를 직접 쓰고 프로필 그림도 만들 수 있어요.</p>`}
  <label class="f" for="pf_nai">프로필 그림 NAI 프롬프트 (비우면 외모 설명으로 자동 구성)</label><textarea class="in" id="pf_nai">${esc(p.avatar?.prompt||'')}</textarea>
  <div class="pf-av">${av?`<img src="${esc(av)}" alt="프로필">`:'<span>프로필 그림 없음</span>'}<div class="col">${imgReady()&&ai?`<button class="btn sm" data-act="pfdraw">${av?'다시 그리기':'외모로 프로필 그리기'}</button>`:''}<button class="btn sm ghost" data-act="upload" data-k="avatar">올리기</button>${av?'<button class="btn sm ghost" data-act="avdel">지우기</button>':''}</div></div>${imgReady()||!ai?'':'<p class="muted" style="font-size:.8rem;margin:6px 0 0">그림 AI를 등록하면 외모로 프로필 그림을 만들 수 있어요.</p>'}`; }
function readPlayerForm(){ const p=P(); if($('#pf_name')) p.player=$('#pf_name').value.trim().slice(0,12);
  if($('#pf_call')){ const cv=$('#pf_call').value.trim().slice(0,12); if(cv&&cv!==T('player')){ G.meta.terms.player=cv; mark('meta'); } }
  if($('#pf_gender')){ const g=$('#pf_gender').value.trim().slice(0,40); p.genderTxt=g; p.gender=/^(남|남성|남자|male|man)$/i.test(g)?'m':/^(여|여성|여자|female|woman)$/i.test(g)?'f':''; }
  if($('#pf_gsel')){ p.gender=$('#pf_gsel').value; p.genderTxt=''; }
  if($('#pf_look')) p.look=$('#pf_look').value.trim().slice(0,400); if($('#pf_bio')) p.bio=$('#pf_bio').value.trim().slice(0,1500); if($('#pf_hide')) p.hideEyes=$('#pf_hide').checked;if($('#pf_nai'))naiBlocksSave(progSlot('avatar'),'prompt','pf_nai'); mark('prog'); }
const genderCode=g=>/^(남|남성|남자|male|man)$/i.test(g||'')?'m':/^(여|여성|여자|female|woman)$/i.test(g||'')?'f':'';
async function heroTags(hr){ const r=await aiJSON(heroTagsPrompt({hr}),null,'quick');
  let tags=String((r&&r.tags)||'').trim(); if(!tags) return '';
  if(hr.hide) tags=joinTags(tagList(tags).filter(t=>!EYE_TAG.test(tagKey(t))).join(', '),'hair over eyes, bangs covering eyes, long bangs');
  return tags; }
function refreshPlayerForm(){ const w=$('#pfWrap'); if(w){const sheet=w.closest('.sheet')||$('#view'),position=uiScrollCapture(sheet);w.innerHTML=playerFormHTML();uiScrollRestore(sheet,position);} }
async function playerDraw(rep){ readPlayerForm(); const p=P(); if(!p.look&&!p.avatar?.prompt){ toast('외모나 NAI 프롬프트를 먼저 적어 주세요'); return; } if(!imgReady()){ toast(imgNeed()); return; }
  if(rep) rep('태그 만드는 중…');
  try{ const tags=p.avatar?.prompt||await heroTags({gender:p.genderTxt,look:p.look,hide:p.hideEyes}); if(!tags){ toast('태그를 만들지 못했어요. 다시 눌러 주세요'); return; }
    if(rep) rep('그리는 중…'); const o=progSlot('avatar'); o.prompt=tags;
    const b=await naiDraw('char',tags,{candidateEligible:true,originalSrc:imgSrcRaw(o)||'',frame:'cowboy shot',pose:'looking at viewer'}); await storeImage(o,b,''); mark('prog'); toast('프로필 그림을 만들었어요'); refreshPlayerForm();
  }catch(e){ toast(naiErr(e)); } finally{ if(rep) rep.end(); } }

document.addEventListener('keydown',e=>{ if(e.target&&e.target.id==='fcIn'&&e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); if(e.isComposing||e.keyCode===229) return; fcSend(); } });
document.addEventListener('input',e=>{ if(e.target&&e.target.id==='fcIn'){ const t=e.target; t.style.height='auto'; t.style.height=Math.min(120,t.scrollHeight)+'px'; } });
// 휴대폰 키보드·주소창 때문에 입력칸이 가려지지 않게, 보이는 화면 높이에 맞춰요
(function(){ const vv=window.visualViewport; if(!vv) return; const fit=()=>{ const ph=document.getElementById('phone'); if(!ph||ph.hidden) return; ph.style.top=vv.offsetTop+'px'; ph.style.height=vv.height+'px'; ph.style.bottom='auto'; const el=document.getElementById('phChat'); if(el&&document.activeElement&&document.activeElement.id==='fcIn') el.scrollTop=el.scrollHeight; };
  vv.addEventListener('resize',fit); vv.addEventListener('scroll',fit); new MutationObserver(fit).observe(document.getElementById('phone'),{attributes:true,attributeFilter:['hidden']}); })();

