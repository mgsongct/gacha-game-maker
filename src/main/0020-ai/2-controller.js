/* ===== 0020-ai — Controller(동작을 받아 Model을 바꾸고 다시 그리게 함 · 섞인 함수는 나눌 것) ===== */
/* src/main/0020-ai/0020-ai.js에서 옮김 */
function saveUserPacks(a){ try{ appStorage.setItem(PACKKEY,JSON.stringify(a.slice(0,50))); return true; }catch(e){ toast('저장 공간이 부족해요'); return false; } }
function saveLlm(L){ try{ appStorage.setItem(LLMKEY,JSON.stringify(L)); return true; }catch(e){ toast('저장 공간이 부족해요'); return false; } }
