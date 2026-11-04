/* ===== 0090-character — Controller(동작을 받아 Model을 바꾸고 다시 그리게 함 · 섞인 함수는 나눌 것) ===== */
/* src/main/0090-character/0090-growth.js에서 옮김 */
function enhance(c,max){
  const o=own(c.id), p=P(); let n=0;
  while(o.lv<levelCap(o)){ const need=Math.ceil((GGMCombat.levelExperience(o.lv)-o.exp)/100), gold=need*100; if(p.mat.exp<need||p.gold<gold) break; p.mat.exp-=need; p.gold-=gold; gainExp(o,need*100); n++; if(!max) break; }
  if(!n){ toast(o.lv>=levelCap(o)?`레벨 상한이에요. 70까지 승급하거나, 초월승급으로 최대 120까지 올릴 수 있어요`:`${T('expMat')}이나 ${T('gold')}가 부족해요`); return; }
  bump('enhance'); mark('prog'); sfx('강화'); linePop(c,rand(c.lvLines.length?c.lvLines:c.lines),'웃음');
}
function limitBreak(c){
  const o=own(c.id), p=P(), cost=GGMCombat.limitBreakCost(o.dup);
  if(o.dup>=5){toast('최대 '+T('limit')+'예요');return;}
  if(p.mat.core<cost){toast(`${T('core')}가 ${cost}개 필요해요`);return;}
  p.mat.core-=cost; o.dup++; mark('prog'); sfx('SSR');
  const f=(c.files||[]).find(x=>x.dup===o.dup); linePop(c,rand(c.dupLines.length?c.dupLines:c.lines),'결의');
  toast(`${T('limit')} ${o.dup}단계! 레벨 상한 ${levelCap(o)}${f?' · '+T('files')+' 공개':''}`);
  if(o.dup>=5){ o.cgNew=true; mark('prog'); if(!imgSrc(c.lbcg)) setTimeout(()=>toast(`최대 ${T('limit')}! 외형 탭에서 ${T('limit')} CG를 만들면 바로 공개돼요`),2700); }
}
function transcendUp(c){const o=own(c.id),u=upPlan(c,'transc');if(!u?.ok){toast(o.lv>=70&&levelCap(o)<120?T('transcMat')+' '+u.cost[0][1]+'개가 필요해요':u?.note||'초월승급할 수 없어요');return;}P().mat.transcMat-=u.cost[0][1];o.transc=(o.transc||0)+1;mark('prog');sfx('강화');toast('초월승급! 레벨 상한 '+levelCap(o));}
function weaponUp(c){
  const o=own(c.id), p=P(); if(o.wlv>=5){toast('최대 단계예요');return;}
  const {materials:wm,gold}=GGMCombat.equipmentUpgradeCost(o.wlv);
  if(p.mat.wmat<wm||p.gold<gold){toast(`${T('wMat')} ${wm}개와 ${T('gold')} ${nf(gold)}가 필요해요`);return;}
  p.mat.wmat-=wm; p.gold-=gold; o.wlv++; mark('prog'); sfx('강화'); toast(`${c.weapon.name||T('weapon')} ${o.wlv}단계`);
}
function addAff(c,n){
  const o=own(c.id); if(!o) return; const b=affLv(o); o.aff=Math.min(AFF_MAX,o.aff+n); const a=affLv(o);
  if(a>b){ const ep=c.episodes.find(e=>e.lv>b&&e.lv<=a); toast(ep?`${c.name} 호감도 Lv.${a}! 에피소드 「${ep.title}」가 열렸어요`:`${c.name} 호감도 Lv.${a}`); checkTriggers(); memoCheck(c,b,a); }
}
/* src/main/0090-character/0130-gift.js에서 옮김 */
function bannerStep(d){ const bs=G.banners.filter(bnOpen); if(bs.length<2) return; const bn=curBanner(), i=Math.max(0,bs.findIndex(x=>bn&&x.id===bn.id));
  P().curBanner=bs[(i+d+bs.length)%bs.length].id; mark('prog'); window.__BSLIDE=d>0?'sl-r':'sl-l'; render(); window.__BSLIDE=''; sfx('버튼'); }
/* src/main/0090-character/0200-skin-shop.js에서 옮김 */
async function skinAuto(notes,period){
  const game=G,project=PJ().active;
  const L=P().live, rec=L.skinRecent||(L.skinRecent=[]), pu=G.banners.filter(bn=>bn.active!==false&&bn.type==='pickup').flatMap(b=>b.pickup||[]);
  const shopN=c=>(c.skins||[]).filter(k=>k.shop).length, base=G.chars.filter(c=>c.naiPrompt&&!c.alt); if(!base.length) return null;
  // 상점 의상이 가장 적은 캐릭터 중에서(같으면 픽업·보유 우선), 최근에 나온 캐릭터는 다른 후보가 있으면 빼요
  const minN=Math.min(...base.map(shopN)); let cand=base.filter(c=>shopN(c)===minN&&!rec.includes(c.id)); if(!cand.length) cand=base.filter(c=>!rec.includes(c.id)); if(!cand.length){ L.skinRecent=[]; cand=base; }
  const pri=cand.filter(c=>pu.includes(c.id)), mine=cand.filter(c=>own(c.id)); cand=pri.length?pri:mine.length?mine:cand;
  const c=rand(cand), evs=G.events.filter(ev=>ev.active!==false&&gateOpen(ev)).map(e=>e.title).join(', ');
  const originalPrompt=c.naiPrompt,skinBase=await naiSkinBase(c);
  if(G!==game||PJ().active!==project||charById(c.id)!==c||c.naiPrompt!==originalPrompt)throw Error('캐릭터나 게임이 바뀌어 스킨 생성을 중단했어요');
  const r=await aiJSON(skinAutoPrompt({c,skinBase,evs}),null,'quick');
  if(G!==game||PJ().active!==project||charById(c.id)!==c||c.naiPrompt!==originalPrompt)throw Error('캐릭터나 게임이 바뀌어 스킨 생성을 중단했어요');
  if(!r)return null;
  const parts=naiSkinParts(skinBase,r),k={id:'k'+uid(),name:String(r.name||'새 '+T('skin')).slice(0,16),desc:String(r.desc||'').slice(0,80),line:String(r.line||'').slice(0,80),prompt:'',img:null,shop:true,price:SKIN_PRICE,at:Date.now(),period:period||''};
  naiBlocksStore(k,'prompt',parts);
  c.skins=c.skins||[]; c.skins.push(k); rec.unshift(c.id); L.skinRecent=rec.slice(0,Math.max(1,Math.min(6,G.chars.filter(x=>x.naiPrompt&&!x.alt).length-1))); mark('c:'+c.id,'prog');
  if(imgReady()){ try{ liveBar(`${c.name} 「${k.name}」 그리는 중…`); const target=skinPrimaryPart(c,k),x=target===k?'stand':'upper',b=await skinPartDraw(c,k,x);if(G!==game||PJ().active!==project||charById(c.id)!==c||!c.skins.includes(k))throw Error('대상이 바뀌어 스킨 생성을 중단했습니다');await storeImage(target,b,''); mark('c:'+c.id); }catch(e){toast(naiErr(e,'스킨 이미지 생성 실패'));} }
  if(notes) notes.push(`${T('skin')} 신상품: ${c.name} 「${k.name}」 (캐시 상점 패키지)`);
  return {c,k};
}
/* src/main/0090-character/0270-skin-proposal.js에서 옮김 */
async function skinPropDraw(rep){ const P0=SKPROP, c=P0&&charById(P0.cid); if(!c) return; if(!imgReady()){ toast(imgNeed()); return; }
  if(rep) rep('그리는 중…');
  try{ const src=imgSrc(c), ref=src&&P0.ref.on?await refImage(src):null;
    const b=await naiDraw('char',P0.prompt,Object.assign({candidateEligible:true,pose:P0.pose||undefined,styleId:c.naiStyle,frame:c.naiFrame},ref?{refs:[{image:ref,type:P0.ref.style?'character&style':'character',strength:P0.ref.str,fidelity:P0.ref.fid}]}:{}));
    const cfg=b.__candidateConfig;if(cfg?.promptParts&&cfg.promptParts.combined===cfg.prompt){P0.prompt=cfg.prompt;P0.naiBlocks={...P0.naiBlocks,prompt:cfg.promptParts};}
    if(P0.url) URL.revokeObjectURL(P0.url); P0.blob=b; P0.url=URL.createObjectURL(b); openSkinProp(); }
  catch(err){ toast(naiErr(err)); if(rep){ rep.end(); rep(P0.url?'다시 그리기':'그리기'); } } }
function skinMakeRest(c,k,sel){ if(['upper','illust','lbcg','faces'].some(x=>sel[x])&&!imgReady()){ toast(imgNeed()); ['upper','illust','lbcg','faces'].forEach(x=>sel[x]=0); }
  if(c.useStanding===false&&!skinDisplayReady(c,k)&&imgReady())sel.upper=1;const go=()=>skinAcceptRun(c,k,sel);
  const faceBody=imgSrcRaw(k)?'full':'up',faceSrc=imgSrcRaw(k)||k.upper&&imgSrcRaw(k.upper);if(sel.faces&&faceSrc)openMaskPainter(faceSrc,null,url=>{k.faceMask=Object.assign({},k.faceMask||{},{[faceBody]:url}); mark('c:'+c.id); go(); },{title:`「${k.name}」 얼굴 범위 (표정용 · 취소하면 표정 없이 만들어요)`,onCancel:()=>{ sel.faces=0; go(); }});
  else if(['upper','illust','lbcg','lines'].some(x=>sel[x])) go(); }
async function skinFacesRun(c,k,b){ const cm=naiCfg().model||NAI_DEF.model, O={m:'inpaint',model:/^nai-diffusion-5/.test(cm)?cm:'nai-diffusion-5-full',ref:false,lv:1}; let n=0;
  for(const ko of FACE_BASIC){ if(SKJOB&&SKJOB.stop) break; liveBar(`${T('skin')} 「${k.name}」 표정 ${ko} (${b==='up'?'상반신':'전신'}) 그리는 중…`);
    let f=k.faces.find(q=>q.name===ko); if(!f){ f={id:'f'+uid(),name:ko,img:null}; k.faces.push(f); }
    try{ await faceDrawOne(c,k,f,ko,b,O); n++; }catch(e){ toast(naiErr(e)); break; } await wait(600); }
  return n; }
async function skinAcceptRun(c,k,sel){ if(SKJOB){ toast('다른 '+T('skin')+'을 만드는 중이에요'); return; } const game=G,project=PJ().active,current=()=>G===game&&PJ().active===project&&charById(c.id)===c&&c.skins.includes(k);SKJOB={stop:false,skinId:k.id};let done=[],failed=false;
  try{ k.faces=k.faces||[];
    const parts=['upper','illust','lbcg'].filter(x=>sel[x]&&!imgSrcRaw(k[x]));
    for(const x of parts){ liveBar(`${T('skin')} 「${k.name}」 ${({upper:'상반신',illust:'일러스트',lbcg:T('limit')+' CG'})[x]} 그리는 중…`);
      try{ const b=await skinPartDraw(c,k,x);if(!current())return;await storeImage(skinPart(k,x),b,''); mark('c:'+c.id); done.push(({upper:'상반신',illust:'일러스트',lbcg:T('limit')+' CG'})[x]);}catch(e){failed=true;toast(naiErr(e));break;} await wait(600); }
    if(sel.lines&&SAMPLE){ liveBar(`${T('skin')} 「${k.name}」 대사 쓰는 중…`); if(await skinLinesAI(c,k,null)) done.push('대사'); }
    if(sel.faces&&k.faceMask?.up&&k.upper&&imgSrcRaw(k.upper)){const n=await skinFacesRun(c,k,'up');if(n)done.push(`상반신 표정 ${n}장`);}
    if(sel.faces&&k.faceMask&&k.faceMask.full){ const n=await skinFacesRun(c,k,'full'); if(n) done.push(`전신 표정 ${n}장`); }
  } finally { liveBar(null); SKJOB=null; }
  if(!current())return;toast(`「${k.name}」 ${failed?'일부 생성 실패':'완성'}${done.length?' · '+done.join(', '):''}`); skinRefresh(c.id); render();
  // 상반신 표정은 상반신이 생긴 뒤 얼굴 범위를 한 번 더 칠해야 해요
  if(sel.faces&&k.upper&&imgSrc(k.upper)&&!k.faceMask?.up)openMaskPainter(imgSrc(k.upper),null,async url=>{ k.faceMask=Object.assign({},k.faceMask||{},{up:url}); mark('c:'+c.id); SKJOB={stop:false}; let n=0; try{ n=await skinFacesRun(c,k,'up'); } finally{ liveBar(null); SKJOB=null; } toast(`「${k.name}」 상반신 표정 ${n}장 완성`); skinRefresh(c.id); },{title:`「${k.name}」 상반신 얼굴 범위 (상반신 표정용)`}); }
/* src/main/0090-character/0455-persona.js에서 옮김 */
/* 인연 톡: 호감도 단계마다 메신저 대화(모모톡처럼 관계가 깊어지는 흐름) */
async function talkAffGen(c,rep){ const cfg=PERSONA_CFG(), have=new Set(affThreads(c).map(t=>+t.trigger.value)), levels=cfg.affLv.filter(l=>!have.has(+l)); if(!levels.length){ toast('이미 모든 단계의 인연 톡이 있어요'); return 0; }
  const r=await aiJSON(talkAffGenPrompt({c,levels}),rep,'default');
  const L=(r&&Array.isArray(r.threads)?r.threads:[]).filter(x=>x&&x.script&&levels.includes(+x.lv)); let n=0;
  for(const x of L){ const th={id:uid(),charId:c.id,title:String(x.title||'메시지').slice(0,30),trigger:{type:'aff',value:+x.lv},needOwn:true,script:String(x.script)}; G.threads.push(th); mark('t:'+th.id); n++; }
  if(n) checkTriggers(true); return n; }
function personaSave(c){ const p={}; document.querySelectorAll('#modal [data-ps]').forEach(el=>{ p[el.dataset.ps]=el.value; }); c.persona=personaClean(p); const f={}; document.querySelectorAll('#modal [data-pf]').forEach(el=>{ f[el.dataset.pf]=el.value; });
  String(($('#ps_extra')||{}).value||'').split('\n').forEach(l=>{ const i=l.indexOf('='); if(i>0) f[l.slice(0,i).trim()]=l.slice(i+1).trim(); }); c.pfields=pfieldsClean(f); mark('c:'+c.id); }
async function personaBatch(kind){ if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); return; } const cs=[...document.querySelectorAll('[data-psc]:checked')].map(x=>charById(x.dataset.psc)).filter(Boolean); if(!cs.length){ toast('캐릭터를 골라 주세요'); return; }
  const label={fill:'개성 채우기',improve:'개성 다듬기',talk:'인연 톡',memo:'메모리얼'}[kind]; if(kind==='fill'||kind==='improve'||kind==='memo') auditSnap(cs,label); PS_JOB={stop:false}; let n=0;
  try{ for(const [i,c] of cs.entries()){ if(PS_JOB.stop) break; syBar(`${label} ${i+1}/${cs.length}: ${c.name}`); try{ const ok=kind==='talk'?await talkAffGen(c):kind==='memo'?await memorialGen(c):await personaAI(c,kind,{lines:kind==='improve'}); if(ok) n++; }catch(e){ quietErr(e,'0455-persona.js:114'); } } }
  finally{ PS_JOB=null; syBar(''); } toast(`${label}: ${n}/${cs.length}명`); openPersonaAll(); }
function personaCfgSave(){ const m=G.meta, k=$('#ps_tpl').value, f=k==='custom'||$('#ps_tplf').value.trim()!==(PROFILE_TPLS[k]||[]).join(', ')?pStrs($('#ps_tplf').value):PROFILE_TPLS[k]; m.persona=Object.assign(m.persona||{},{tpl:f.length?f:PROFILE_TPLS.basic,affLv:[...new Set(String($('#ps_aff').value).split(/[,\s]+/).map(Number).filter(n=>n>=1&&n<=10))].sort((a,b)=>a-b),memoLv:Math.max(1,Math.min(10,+$('#ps_memo').value||8))}); mark('meta'); }
/* src/main/0090-character/090-characters.js에서 옮김 */
async function handleCharactersAction(a,t,id,p,e){
  switch(a){
case 'csframe': { const p2=P(); p2.csFull=!p2.csFull; mark('prog'); csFrameShow(t,p2.csFull); break; }
case 'cspoke': { const c=charById(id); if(!c) break; const o=own(c.id), lv=o?affLv(o):1, x=e.clientX||innerWidth/2, y=e.clientY||innerHeight/2, r=t.getBoundingClientRect(), zone=(y-r.top)/r.height<0.3?'head':'body';
      const pool=spoilFree(c,o?(zone==='head'&&c.touch?.head?.length?c.touch.head:zone==='body'&&c.touch?.body?.length?c.touch.body:affLinePool(c)):c.lines), l=pickTouchLine(pool,csSayText());
      if(csPokeShow(t,c,l,!!o,lv,zone,x,y)&&c.voiceId&&SND().voiceLobby) speak(c,l);
      if(o){ addAff(c,1); mark('prog'); } break; }
case 'cstab': CS_TAB=t.dataset.k; csTabShow(); break;
case 'upgen': { const c=charById(id); if(!c) break; if(!String(c.naiPrompt||'').trim()){toast('먼저 설정 편집에서 NAI 스탠딩 프롬프트를 채워 주세요');break;} if(!imgReady()){toast(imgNeed());break;} const done=busy(t,'그리는 중…');
      try{ const b=await naiDrawItem({k:'upper',o:c.upper,c,generationMode:'manual'}); await storeImage(c.upper,b,''); mark('c:'+c.id); toast('상반신을 그렸어요'); openChar(c.id); }catch(err){ toast(naiErr(err,'상반신 실패')); done(); } break; }
case 'gift': openGift(id); break;
case 'giftgive': { const c=charById(id), g=giftById(t.dataset.v), inv=progSlot('gifts'); if(!c||!g||!(inv[g[0]]>0)) break; if(affFull(own(c.id))){ toast(`${c.name}의 호감도가 이미 가득 찼어요. 선물은 아껴 두세요`); break; } inv[g[0]]--; const like=giftLikes(c).has(g[0]), val=g[3]*(like?2:1);
      p.giftSeen=p.giftSeen||{}; (p.giftSeen[c.id]=p.giftSeen[c.id]||{})[g[0]]=like?2:1; addAff(c,val); mark('prog'); sfx(like?'SSR':'확인');
      const line=like?rand((c.affLines&&Object.values(c.affLines).flat().length?Object.values(c.affLines).flat():c.lines)):rand(c.lines); if(line) linePop(c,line,like?'웃음':'');
      if(like) hearts(innerWidth/2,innerHeight/2,4); toast(`${g[1]} → ${c.name} 호감도 +${val}${like?' (정말 좋아해요!)':''}`); openGift(id); break; }
case 'ainai': { const r=await aiJSON(ainaiPrompt({fName:$('#f_name').value,fFac:$('#f_fac'),fElem:$('#f_elem').value,fPos:$('#f_pos').value,fProf:$('#f_prof').value}),uiProg(t),'quick');
      if(r&&r.naiPrompt&&$('#f_nai')) $('#f_nai').value=allyTags(String(r.naiPrompt)); break; }
case 'ailines': { const r=await aiJSON(ailinesPrompt({fName:$('#f_name').value,fFac:$('#f_fac').value,fProf:$('#f_prof').value}),uiProg(t));
      if(r&&$('#f_lines')){ $('#f_lines').value=strs(r.lines).join('\n'); $('#f_aff').value=Object.entries(r.affLines||{}).flatMap(([k,v])=>strs(v).map(x=>k+': '+x)).join('\n'); $('#f_lv').value=strs(r.lvLines).join('\n'); $('#f_dup').value=strs(r.dupLines).join('\n'); $('#f_head').value=strs(r.head).join('\n'); $('#f_body').value=strs(r.body).join('\n'); if(r.intro)$('#f_intro').value=String(r.intro); toast('대사를 채웠어요. 확인 후 저장하세요.'); } break; }
case 'ailinesmore': { const cur=k=>lines($('#'+k).value), L0=cur('f_lines'), H0=cur('f_head'), B0=cur('f_body');
      const r=await aiJSON(ailinesmorePrompt({L0,H0,B0,fName:$('#f_name').value,fFac:$('#f_fac').value,fProf:$('#f_prof').value}),uiProg(t),'quick');
      if(r&&$('#f_lines')){ const add=(k,a,old)=>{ const nw=strs(a).filter(x=>!old.includes(x)); $('#'+k).value=[...old,...nw].join('\n'); return nw.length; }; const n=add('f_lines',r.lines,L0)+add('f_head',r.head,H0)+add('f_body',r.body,B0); toast(`대사 ${n}개를 더했어요. 확인 후 저장하세요.`); } break; }
case 'upsave': { const o=LV(), md=$('#up_mode').value; Object.assign(o,{repo:$('#up_repo').value.trim().replace(/^https?:\/\/github\.com\//,'').replace(/\.git$/,'').replace(/\/$/,''),branch:$('#up_br').value.trim()||'main',path:$('#up_path').value.trim()||'www/index.html',token:$('#up_tok').value.trim(),auto:md!=='off',mode:md==='off'?'ask':md}); saveLV(o); closeModal(); if(o.auto) checkUpdate(true); else toast('업데이트 확인을 껐어요'); break; }
case 'upgo': {if(appStorage.failed||document.getElementById('save-warning'))break; const c=charById(id), k=t.dataset.k; if(!c) break; if(k==='enh') enhance(c); else if(k==='enhmax') enhance(c,true); else if(k==='lb') limitBreak(c); else if(k==='wup') weaponUp(c); else if(k==='transc') transcendUp(c); try{await flush();}catch(e){break;} openChar(id); render(); break; }
case 'wai': { const c=charById(id); if(!c) break; const ed=a==='wai';
      const nm=(ed&&$('#f_wn')&&$('#f_wn').value.trim())||String(c.weapon.name||''), ds=(ed&&$('#f_wd')&&$('#f_wd').value.trim())||String(c.weapon.desc||''), cur=(ed&&$('#f_wp')&&$('#f_wp').value.trim())||String(c.weapon.prompt||'');
      const p2=await weaponPromptAI([{c,name:nm,desc:ds,cur}],uiProg(t)); if(!p2[0]){ toast('쓰지 못했어요. AI 기록을 확인해 주세요'); break; }
      if(ed){ if($('#f_wp')) $('#f_wp').value=p2[0]; toast(T('weapon')+' 프롬프트를 썼어요. 저장을 눌러 주세요'); } else { c.weapon.prompt=p2[0]; mark('c:'+c.id); toast(T('weapon')+' 프롬프트를 썼어요'); } break; }
case 'wfixall': { const wb=G.chars.filter(c=>c.weapon&&wpBad(c.weapon.prompt)); if(!wb.length){ toast('정리할 '+T('weapon')+' 프롬프트가 없어요'); break; } const done=busy(t,'AI로 정리하는 중…');
      try{ const n=await fixWeaponPrompts(G.chars); toast(n>0?`${T('weapon')} 프롬프트 ${n}개를 ${T('weapon')}만 나오게 정리했어요`:'정리하지 못했어요. AI 기록을 확인해 주세요'); }finally{ done(); } openPrep(false); break; }
case 'regengo': { const c=charById(id); if(!c) break; const sel={}, reqs={}; document.querySelectorAll('#modal [data-rgsel]').forEach(ch=>{ if(ch.checked) sel[ch.dataset.rgsel]=true; }); document.querySelectorAll('#modal [data-rgreqi]').forEach(i=>{ const v=i.value.trim(); if(v) reqs[i.dataset.rgreqi]=v; });
      if(!Object.keys(sel).length){ toast('바꿀 항목을 하나 이상 켜 주세요'); break; } await regenRun(c,sel,reqs,($('#rg_all')&&$('#rg_all').value.trim())||'',$('#rg_skill_slot')?.value||'active'); break; }
case 'regenapply': await regenApply(); break;
case 'regenretry': { const R=REGEN; if(!R) break; REGEN=null; const c=charById(R.cid); if(c) await regenRun(c,R.sel,R.reqs,R.global,R.slot); break; }
case 'regenedit': if(REGEN&&!REGEN.busy){try{regenReadPreview(REGEN);REGEN.edit=!REGEN.edit;regenPreview();}catch(e){toast(e.message);}} break;
case 'regencancel': { const cid=REGEN?.cid||REGEN_JOB?.cid||id;if(!regenCancel())break;closeModal();if(cid&&charById(cid))openChar(cid);break; }
case 'ailooksall': { const list=G.lib.filter(l=>l.kind==='enemy'&&!l.alias&&!l.charId); if(!list.length){toast('적이 없어요');break;} if(!SAMPLE){ toast('설정의 글 AI에서 AI를 먼저 등록해 주세요'); break; }
      if(!(await appConfirm(`적 ${list.length}종의 외형 프롬프트를 지금 세계관에 맞게 전부 다시 쓸까요? 지금 프롬프트는 덮어써요(그림은 그대로라 다시 그려야 바뀌어요).`))) break;
      const r=await aiJSON(ailooksallPrompt({list}),uiProg(t));
      let n=0; if(r&&r.looks) list.forEach(l=>{const v=r.looks[l.name]; if(v){l.prompt=String(v); mark('l:'+l.id); n++;}}); toast(`적 ${n}종의 외형을 세계관에 맞게 다시 썼어요. 다시 그리면 바뀌어요`); openLib('enemy'); break; }
case 'ailooks': { const list=G.lib.filter(l=>l.kind==='enemy'&&!l.prompt); if(!list.length){toast('외형이 빈 적이 없어요');break;}
      const r=await aiJSON(ailooksPrompt({list}),uiProg(t));
      let n=0; if(r&&r.looks) list.forEach(l=>{const v=r.looks[l.name]; if(v){l.prompt=String(v); mark('l:'+l.id); n++;}}); toast(`적 ${n}종의 외형을 채웠어요`); openLib('enemy'); break; }
  }
}
