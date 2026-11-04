/* ===== 0460-script 화면(0180-ui-scroll.js에서 옮김) ===== */
/* src/main/0170-shell/0180-ui-scroll.js에서 옮김 */
function chLogline(ch){ if(ch.logline) return ch.logline; const L=parseScript((ch.stages[0]||{}).pre||'').find(l=>l.type==='nar'&&l.text&&l.text.length>8); return L?sub(L.text).slice(0,70)+(L.text.length>70?'…':''):''; }
