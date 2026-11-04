/* ===== 0010-base 화면(0180-ui-scroll.js에서 옮김) ===== */
/* src/main/0170-shell/0180-ui-scroll.js에서 옮김 */
/* 로비 캐릭터를 눌렀을 때 반응(View): 말풍선 · 감정 연출 · 표정 그림 잠깐 바꾸기 · 물결·하트 · 몸짓 — 호감도·미션 반영은 처리기(Controller)가 먼저 */
function lobbyPokeShow(t,e,c,l,zone,face){
  const el=$('#bubble'); if(el){ el.textContent=sub(l); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); } lobbyEmote(t,l,zone);
  const st=t.querySelector('.lb-stage')||t; const old=st.querySelector('.lobby-art:not(.lobby-pose)'); if(old){ /* 레이어 그림(포즈)은 표정 그림이 없어서 그대로 둬요. 바꾸면 스탠딩으로 고정돼 버렸어요 */ const tmp=document.createElement('div'); tmp.innerHTML=P().lobbyMode==='stand'?art(c,'lobby-art react',{face}):lobbyCharacterArt(c,'lobby-art react',face); old.replaceWith(tmp.firstElementChild); clearTimeout(window._faceT); window._faceT=setTimeout(()=>{const cur=document.querySelector('.lobby-art'); if(cur&&tab==='lobby'){const t2=document.createElement('div');t2.innerHTML=P().lobbyMode==='stand'?art(c,'lobby-art'):lobbyCharacterArt(c);cur.replaceWith(t2.firstElementChild);}},3500); }
  const x=e.clientX||innerWidth/2, y=e.clientY||innerHeight/2, lv=affLv(own(c.id)); ripple(x,y,lv>=7); if(lv>=5&&zone!=='body') hearts(x,y,Math.min(5,lv-3)); setTimeout(()=>charReact(document.querySelector('.lobby .lobby-art,.lobby .lobby-ill'),lv,zone),10); }
/* 이벤트 화면 진행자를 눌렀을 때 반응(View): 물결 · 몸짓 · 표정 · 대사 칸 */
function evsPokeShow(t,c,l,zone,lv,x,y){ ripple(x,y,lv>=7); charReact(t.querySelector('.art'),lv,zone); faceSwap(c,t.querySelector('.art'),touchFace(c,zone,lv)); const pe=$('#evsLine'); if(pe){ pe.textContent=sub(l); pe.classList.remove('pop'); void pe.offsetWidth; pe.classList.add('pop'); } }
