/* ===== 0040-sound — Controller(동작을 받아 Model을 바꾸고 다시 그리게 함 · 섞인 함수는 나눌 것) ===== */
/* src/main/0040-sound/0040-sound.js에서 옮김 */
function bgmAllGo(ids){ const items=ids.map(libById).filter(Boolean); if(!items.length){ toast('곡을 하나 이상 골라 주세요'); return; } closeModal();
  bgJob('bgmall','배경음 '+items.length+'곡 작곡 중',async j=>{ j.total=items.length; let ok=0; const fail=[];
    for(const l of items){ j.sub=l.name; bgJobsDraw(); let done=false; for(let k=0;k<2&&!done;k++){ try{ await elCompose(l); done=true; ok++; }catch(e){ if(e&&(e.code==='el_nokey'||e.code==='bad_key'||e.code==='low_credit'||(e.status===401||e.status===402))){ fail.push(l.name); j.step=items.length; return ok?{title:`배경음 ${ok}곡을 만들었어요`,body:'키나 남은 사용량 문제로 나머지는 만들지 못했어요.'}:null; } if(k) fail.push(l.name); else await wait(3000); } }
      j.step++; bgJobsDraw(); if(done&&sceneBgmName()===l.name) bgm(l.name); }
    return ok?{title:`배경음 ${ok}곡을 만들었어요`,body:fail.length?'만들지 못한 곡: '+fail.join(', ')+'\n배경음 화면에서 다시 시도할 수 있어요.':'설정 → 자료 → 배경음에서 들어 볼 수 있어요.'}:null; }); }
