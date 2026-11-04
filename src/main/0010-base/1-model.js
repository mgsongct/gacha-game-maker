/* ===== 0010-base — Model(상태·규칙·저장·외부 서비스) ===== */
/* src/main/0010-base/0010-rules.js에서 옮김 */
// 속성 상성 문장: 실제 상성표(rulesElemMat, 없으면 BEATS)에서 만들어요(예전엔 속성 3개를 가정해 4개 이상인 게임에 틀린 상성을 알렸음)
function elemLine(){ const m=G&&G.meta&&Array.isArray(G.meta.elems)&&G.meta.elems.length?rulesElemMat():null; return ELEMS.map(elem=>{ const s=m&&m[elem]?Object.keys(m[elem]).filter(t=>t!==elem&&m[elem][t]>1):(BEATS[elem]?[BEATS[elem]]:[]); return s.length?jo(elem,'은','는')+' '+s.join('·')+'에 강함':''; }).filter(Boolean).join(', '); }
// 받침에 맞는 조사: jo('열정','은','는') → '열정은', jo('캐스팅','으로','로') → '캐스팅으로'(ㄹ 받침이면 '로'). 한글이 아닌 끝 글자는 '을(를)'처럼 둘 다
function jo(w,a,b){ w=String(w??''); const c=w.charCodeAt(w.length-1)-0xAC00, j=c>=0&&c<=11171?c%28:-1; if(j<0) return w+(a==='으로'?'(으)로':a+'('+b+')'); return w+((j>0&&!(a==='으로'&&j===8))?a:b); }
// Names are metadata only; saved runs and reward identifiers remain unchanged.
function explorationName(value){return typeof value==='string'&&value.trim()?value.replace(/\s+/g,' ').trim().slice(0,12):'미지 탐사';}
// 용어는 AI·가져온 게임·직접 입력에서 와서 화면 템플릿 70여 곳에 그대로 들어가요. 태그가 될 < >는 빼고 " 는 ” 로 바꿔 돌려줘요(HTML 주입 방지, tools: esc() 없이 HTML에 넣는 글)
function T(k){const t=(typeof G!=='undefined'&&G&&G.meta&&G.meta.terms)||{};return String(t[k]||DEFAULT_META.terms[k]||k).replace(/[<>]/g,'').replace(/"/g,'”');}
/* src/main/0010-base/0060-util.js에서 옮김 */
function quietErr(e,where){ QUIET.unshift({at:Date.now(),where:String(where||''),msg:String(e&&e.message||e||'오류').slice(0,200)}); if(QUIET.length>60) QUIET.length=60; try{ console.debug('[quiet]',where,e); }catch(_){ /* 콘솔이 없어도 괜찮음 */ } }
// 만든 표정을 쓰는 곳: 터치 반응, 스토리 대사(표정 지정이 없을 때 대사로 짐작)
// 스킨을 입었고 스킨 스탠딩이 있으면 그 스킨의 표정만 써요(없으면 표정 없이 스킨 모습 그대로)
function skinFaces(c){ const k=skinOf(c); return ((k&&(imgSrc(k)||(c.useStanding===false&&k.upper&&imgSrc(k.upper))))?k.faces:c.faces)||[]; }
function facePool(c){ return skinFaces(c).filter(f=>imgSrc(f)||(f.up&&imgSrc(f.up))); }
function pickFace(c,names){ const fs=facePool(c), hit=names.map(n=>fs.find(f=>f.name===n)).filter(Boolean); return hit.length?rand(hit).name:''; }
function touchFace(c,zone,lv){ return zone==='head'?pickFace(c,lv>=5?['미소','웃음','수줍음','부끄럼']:['당황','놀람','평온']):zone==='body'?pickFace(c,lv>=6?['부끄럼','당황','수줍음']:['화남','놀람','당황','짜증']):pickFace(c,['미소','평온','웃음']); }
function textFace(c,text){ const t=String(text||''); if(!facePool(c).length) return ''; for(const [re,names] of TEXT_FACE) if(re.test(t)){ const f=pickFace(c,names); if(f) return f; } return ''; }
function petLine(c,o){ const lv=o?affLv(o):1, pool=spoilFree(c,o?[...((c.touch&&c.touch.pet)||[]),...(lv>=4?((c.touch&&c.touch.head)||[]):[]),...(lv>=5?affLinePool(c):[])]:c.lines); return rand(pool.length?pool:spoilFree(c,((c.touch&&c.touch.head)||[]).concat(c.lines||[])))||''; }
/* 쓰다듬기 반영(Model): 8초에 한 번 호감도 +3·미션 */
function petAffect(c){ const o=own(c.id); if(!o) return; const now=Date.now(); if(now-(o.petAt||0)>8000){ o.petAt=now; addAff(c,3); bump('touch'); mark('prog'); } }
// AI가 대본 줄을 쉼표로 이어 붙여 보낸 경우("[음악: 일상],A: 안녕!,B: 뭐 해") 줄로 되돌려요
function unComma(t){ t=String(t||''); const re=/,\s*(?=\[[^\]\n]{1,30}\]|[^\s,:\[\]\n"'][^,:\n\[\]]{0,15}(?:\[[^\]\n]{1,12}\])?:\s)/g;
  return t.split('\n').map(l=>{ const m=l.match(re); return m&&m.length>=2&&/^\s*(\[|[^,:\n]{1,16}(\[[^\]]*\])?:)/.test(l)?l.replace(re,'\n'):l; }).join('\n'); }
