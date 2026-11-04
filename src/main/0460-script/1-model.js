/* ===== 0460-script — Model(상태·규칙·저장·외부 서비스) ===== */
/* src/main/0460-script/0180-ui-scroll.js에서 옮김 */
function chLogline(ch){ if(ch.logline) return ch.logline; const L=parseScript((ch.stages[0]||{}).pre||'').find(l=>l.type==='nar'&&l.text&&l.text.length>8); return L?sub(L.text).slice(0,70)+(L.text.length>70?'…':''):''; }
/* src/main/0460-script/0460-script-engine.js에서 옮김 */
function splitTags(l){ const m0=l.match(/^(\d\)\s*)?([\s\S]*)$/), pre=m0[1]||'', body=m0[2]; TAG_RE.lastIndex=0; if(!TAG_RE.test(body)){ TAG_RE.lastIndex=0; return [l]; } TAG_RE.lastIndex=0;
  if(/^[^:：\[\s][^:：]{0,20}[:：]\s*\[[^\]]+\]$/.test(body)||/^\[[^\]]+\]$/.test(body)) return [l];
  const out=[]; let last=0, mm; while((mm=TAG_RE.exec(body))){ const before=body.slice(last,mm.index).trim(); if(before) out.push(before); out.push(mm[0]); last=mm.index+mm[0].length; } const rest=body.slice(last).trim(); if(rest) out.push(rest); TAG_RE.lastIndex=0;
  const sp=out[0]&&!out[0].startsWith('[')&&out[0].match(/^([^:：\[\s][^:：]{0,20})[:：]/); // 대사 중간에 지시가 끼면 뒤 조각도 같은 사람의 대사로
  return out.map((x,i)=>pre+(sp&&i>0&&!x.startsWith('[')?sp[1].trim()+': '+x:x)); }
function parseScript(t){
  return unComma(t).split('\n').map(l=>l.trim()).filter(Boolean).flatMap(splitTags).map(raw=>{
    let l=raw,cond=0,m,o;
    // 선택지 갈래: "1) 대사", "1）", "(1) 대사", "[1] 대사", "1. 대사", "이름: 1) 대사" 모두 같은 뜻으로 읽어요
    if((m=l.match(/^[(\[（]?([1-9])\s*[)\]）.]\s*(.+)$/))&&!/^\d+\.\d/.test(l)){cond=+m[1];l=m[2];}
    else if((m=l.match(/^([^:：\s][^:：]{0,20}[:：])\s*[(\[（]?([1-9])\s*[)\]）]\s*(.+)$/))){cond=+m[2];l=m[1]+' '+m[3];}
    if(/^\[소품\s*끝\]$/.test(l)) o={type:'cmd',cmd:'소품끝',arg:''};
    else if(/^\[음악\s*끝\]$/.test(l)) o={type:'cmd',cmd:'음악끝',arg:''};
    else if(/^\[톡\s*끝\]$/.test(l)) o={type:'cmd',cmd:'톡끝',arg:''};
    else if(/^\[CG\s*끝\]$/i.test(l)) o={type:'cmd',cmd:'CG끝',arg:''};
    else if((m=l.match(/^\[(배경|소품|효과음|효과|사진|음악|톡|CG|cg|분기|연출|스티커)\s*[:：]\s*(.+?)\]$/))) o={type:'cmd',cmd:m[1],arg:m[2].trim()};
    else if((m=l.match(/^\[(.+?)\]/))) o={type:'place',text:m[1].trim()};
    else if((m=l.match(/^선택\s*[:：]\s*(.+)$/))) o={type:'choice',opts:m[1].split('|').map(s=>s.trim()).filter(Boolean)};
    else if((m=l.match(/^([^:：\s][^:：\[]{0,20}(?:\s*\[[^\]:：]{1,40}\])?)[:：]\s*(.+)$/))){ let who=m[1].trim(),face='',dir=null; const fm=who.match(/^(.+?)\s*\[(.+?)\]$/); if(fm){who=fm[1].trim();dir=dirSplit(fm[2]);face=dir.face;} /* 연출(0462): [표정|감정|동작] */ const cm=m[2].trim().match(/^\[(배경|소품|효과음|효과|사진|음악|톡|CG|cg|분기|연출|스티커)\s*[:：]\s*(.+?)\]$/); o=cm?{type:'cmd',cmd:cm[1],arg:cm[2].trim(),who}:{type:'say',who,face,text:m[2]}; if(dir&&!cm&&(dir.emo||dir.motion)) o.dir=dir; }
    else o={type:'nar',text:l};
    o.cond=cond; return o;
  });
}
function findSpeaker(n){return G.chars.find(c=>c.name===n||c.name.split(' ')[0]===n);}
function npcBy(n){return (G.npcs||[]).find(c=>c.name===n||c.name.split(' ')[0]===n);}
function vnSpeaker(n){ const c=findSpeaker(n); if(c) return c; const m=npcBy(n); return m&&imgSrc(m)?m:null; } // 그림 없는 NPC는 이름만(빈 스탠딩 안 띄움)
function vnPrefetch(){ if(!SND().voiceStory) return; let n=0; for(let k=S.i;k<S.lines.length&&n<2;k++){const L=S.lines[k]; if(L.type==='say'&&!isMe(L.who)){const c=findSpeaker(L.who); if(c&&c.voiceId){prefetchTTS(c,L.text);n++;}}} }
function vnAutoNext(){if(!S||!S.auto||S.typing||S.choice)return;clearTimeout(S.autoT);const go=()=>{if(S&&S.auto&&!S.typing&&!S.choice)S.autoT=setTimeout(vnStep,600);};if(!VOICE.paused&&!VOICE.ended){VOICE.onended=go;}else S.autoT=setTimeout(vnStep,1000+S.full.length*40);}
/* src/main/0460-script/0462-direction.js에서 옮김 */
function emoKey(t){ t=String(t||'').trim(); return EMOTES[t]?t:EMO_ALIAS[t]||''; }
// "미소|하트|점프" → {face,emo,motion}
function dirSplit(s){ const o={face:'',emo:'',motion:''}; String(s||'').split(/[|,·/]/).map(x=>x.trim()).forEach((t,i)=>{ if(!t) return; if(i===0&&FACE_BASIC.includes(t)) o.face=t; /* 첫 칸(빈 칸 포함 위치 — [|놀람]은 표정 없음+감정)이 기본 표정 이름이면 표정(화남·놀람·슬픔·당황은 감정 이름과 겹침) — 기존 이름[표정] 문법 유지 */ else if(!o.emo&&emoKey(t)) o.emo=emoKey(t); else if(!o.motion&&MOTIONS[t]) o.motion=t; else if(!o.face) o.face=t; }); return o; }
function autoEmote(text){ const t=String(text||'').trim(); for(const [k,d] of Object.entries(EMOTES)) if(d.k&&d.k.test(t)) return k; return ''; }
function dirMode(){ const m=P().vnDirect; return m==='script'||m==='off'?m:'auto'; }
/* AI 연출 입히기: 대사·나레이션은 그대로 두고 표정|감정|동작 태그와 [효과]만 더해요. 바뀐 글이 있으면 버려요 */
function dirStrip(t){ return parseScript(t).filter(L=>L.type==='say'||L.type==='nar'||L.type==='choice').map(L=>L.type==='choice'?L.opts.join('|'):(L.who||'')+':'+L.text).join('\n'); }
function dirCount(t){ return parseScript(t).filter(L=>(L.type==='say'&&L.dir&&(L.dir.emo||L.dir.motion))||(L.type==='cmd'&&(L.cmd==='연출'||(L.cmd==='효과'&&!/흔들림|플래시|암전/.test(L.arg))))).length; }
async function directScript(text,rep){ const src=String(text||''); if(!src.trim()) return null;
  const r=await aiJSON(directScriptPrompt({src}),rep,'complex');
  const out=r&&nl(r.script); if(!out) return null; if(dirStrip(out)!==dirStrip(src)) return null; return out; }
async function directStage(s){ let ok=false; for(const k of ['pre','post']){ if(!s[k]) continue; const o=await directScript(s[k]); if(o){ s[k]=o; ok=true; } } if(ok){ s.dirV=1; auditMarkObj(s); } return ok; }
/* src/main/0460-script/0470-title-opening.js에서 옮김 */
function titleLines(t){ const w=String(t||'').trim().split(/\s+/).filter(Boolean); if(w.length<2) return [w.join('')];
  let best=null; for(let k=1;k<w.length;k++){ const a=w.slice(0,k).join(' '), b=w.slice(k).join(' '), m=Math.max(tlLen(a),tlLen(b)); if(!best||m<best.m) best={m,l:[a,b]}; } return best.l; }
function logoStyle(v0){ const v=v0||G.meta.logoStyle||'auto'; if(v!=='auto'&&LOGO_STYLES.some(x=>x[0]===v)) return v; return ({fantasy:'star',noir:'stroke',neon:'orbitline',pastel:'cute',tactical:'stencil'})[G.meta.theme]||'stencil'; }
/* 타이틀 배경음 단추(View) — 켜짐/꺼짐 표시만 */
function titleSndLabel(on){ return on?'배경음 끄기':'배경음 켜기'; }
