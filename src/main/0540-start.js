/* =========================================================
   시작
   ========================================================= */
render(); loadIdbImages(); if(orientPref()!=='auto') applyOrient();
if(G.__curveNew){ delete G.__curveNew; markAll(); }
applyMeta(); (async()=>{ if(PCS()||syReady()){ if(await bootSync()) return; } const lost=pcLostKey(); if(needSetup()&&!lost) showSetup(); else showStart(); if(lost) setTimeout(()=>openPcSet(true),700); })(); dm();

