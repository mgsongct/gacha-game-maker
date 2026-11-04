/* ===== 0070-store 화면(0180-ui-scroll.js에서 옮김) ===== */
/* src/main/0170-shell/0180-ui-scroll.js에서 옮김 */
function charIllust(c){ if(!c) return null; const k=skinOf(c); if(k&&imgSrc(k)) return skinPartSrc(c,'illust'); return c.illust?imgSrc(c.illust):null; } // 스킨을 입으면 기본 옷 일러스트로 돌아가지 않아요
function lobbyCharacterArt(c,cls='lobby-art',face=''){
 const sk=skinOf(c),faces=sk?.upper&&imgSrc(sk.upper)?sk.faces:c.faces,f=(faces||[]).find(x=>x.name===face),src=f?.up&&imgSrc(f.up)||sk?.upper&&imgSrc(sk.upper)||c.upper&&imgSrc(c.upper);
 if(sk&&c.useStanding!==false&&!imgSrcRaw(sk.upper)&&skinPreviewSrc(c,sk))return art(c,cls,{upper:true,face});
 return src?`<img class="art upimg ${cls}" src="${esc(src)}" alt="${esc(c.name)}" draggable="false">`:art(c,cls,{upper:true,face});
}
