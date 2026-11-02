/* ===== 스킨 제안: 스탠딩을 먼저 보여 주고, 수락하면 나머지를 한꺼번에 만들어요 ===== */
let SKPROP=null;
async function skinPropDraw(btn){ const P0=SKPROP, c=P0&&charById(P0.cid); if(!c) return; if(!imgReady()){ toast(imgNeed()); return; }
  if(btn){ btn.disabled=true; btn.textContent='그리는 중…'; }
  try{ const src=imgSrc(c), ref=src&&P0.ref.on?await refImage(src):null;
    const b=await naiDraw('char',P0.prompt,Object.assign({candidateEligible:true,pose:P0.pose||undefined,styleId:c.naiStyle,frame:c.naiFrame},ref?{refs:[{image:ref,type:P0.ref.style?'character&style':'character',strength:P0.ref.str,fidelity:P0.ref.fid}]}:{}));
    const cfg=b.__candidateConfig;if(cfg?.promptParts&&cfg.promptParts.combined===cfg.prompt){P0.prompt=cfg.prompt;P0.naiBlocks={...P0.naiBlocks,prompt:cfg.promptParts};}
    if(P0.url) URL.revokeObjectURL(P0.url); P0.blob=b; P0.url=URL.createObjectURL(b); openSkinProp(); }
  catch(err){ toast(naiErr(err)); if(btn&&btn.isConnected){ btn.disabled=false; btn.textContent=P0.url?'다시 그리기':'그리기'; } } }
function openSkinProp(){ const P0=SKPROP; if(!P0||!P0.url) return; const c=charById(P0.cid); if(!c) return; const sel=P0.sel||{upper:1,illust:1,lbcg:1,faces:0,lines:SAMPLE?1:0};
  openModal(`${head(`「${esc(P0.name)}」 제안`,`<span class="muted">${esc(c.name)}의 새 ${esc(T('skin'))} · 이 모습으로 만들까요?</span>`)}
    <div class="skp-img"><img src="${esc(P0.url)}" alt="${esc(P0.name)}"></div><p class="muted" style="text-align:center;font-size:.78rem;margin:4px 0 0">그림을 누르면 크게 봐요</p>
    <h3 class="sec">수락하면 함께 만들 것</h3>
    ${skinSelHTML(sel,c)}
    <label class="f" for="skp_scene">일러스트·CG 장면 태그 (선택)</label><input class="in" id="skp_scene" value="${esc(P0.scene||'')}" placeholder="예: beach, sunset, waves, smile">
    <p class="muted" style="font-size:.78rem">수락하면 뒤에서 차례로 그려요(위쪽 막대에 진행이 보여요). 표정은 얼굴 범위를 칠한 뒤 전신·상반신 모두 얼굴만 다시 그려요.</p>
    <div class="row" style="margin-top:10px"><button class="btn" data-act="skpok">수락 · 이 모습으로 만들기</button><button class="btn ghost" data-act="skpredo">다시 그리기</button><button class="btn ghost" data-act="skpcancel">취소</button></div>`); }
function skinPropRead(){ const P0=SKPROP; if(!P0) return; P0.sel={}; document.querySelectorAll('[data-skp]').forEach(i=>{ P0.sel[i.dataset.skp]=i.checked?1:0; }); const sc=$('#skp_scene'); if(sc){P0.scene=sc.value.trim();naiBlocksSave(P0,'scene',sc);} }
async function skinLinesAI(c,k,btn){ const r=await aiJSON(`${RULES}\n${ctx()}\n\n${T('crew')} 「${c.name}」이(가) 「${k.name}」 ${T('skin')}(의상: ${String(k.idea||k.prompt||'').slice(0,200)})을(를) 입었을 때 로비에서 하는 대사를 써라. 성격·말투는 그대로(말투 예: ${(c.lines||[]).slice(0,3).map(x=>'"'+x+'"').join(' / ')}), 이 옷을 입은 상황과 기분이 드러나게. 한 줄 40자 이내.\nJSON만 출력: {"lines":["대사 6개"],"intro":"이 ${T('skin')}을 처음 입었을 때 한마디"}`,btn,'quick');
  if(r&&Array.isArray(r.lines)){ k.lines=r.lines.map(x=>String(x||'').trim()).filter(Boolean).slice(0,8); if(r.intro) k.intro=String(r.intro).slice(0,120); mark('c:'+c.id); return k.lines.length; } return 0; }
function skinMakeRest(c,k,sel){ if(['upper','illust','lbcg','faces'].some(x=>sel[x])&&!imgReady()){ toast(imgNeed()); ['upper','illust','lbcg','faces'].forEach(x=>sel[x]=0); }
  if(c.useStanding===false&&!skinDisplayReady(c,k)&&imgReady())sel.upper=1;const go=()=>skinAcceptRun(c,k,sel);
  const faceBody=imgSrcRaw(k)?'full':'up',faceSrc=imgSrcRaw(k)||k.upper&&imgSrcRaw(k.upper);if(sel.faces&&faceSrc)openMaskPainter(faceSrc,null,url=>{k.faceMask=Object.assign({},k.faceMask||{},{[faceBody]:url}); mark('c:'+c.id); go(); },{title:`「${k.name}」 얼굴 범위 (표정용 · 취소하면 표정 없이 만들어요)`,onCancel:()=>{ sel.faces=0; go(); }});
  else if(['upper','illust','lbcg','lines'].some(x=>sel[x])) go(); }
// 스킨 상점: 사기 전에 스탠딩을 크게 보여 주고(제안), 사면 고른 그림·대사를 한꺼번에 만들어요
let SKBUYSEL=null;
function skinSelHTML(sel,c,k){const required=c?.useStanding===false&&(!k||!imgSrcRaw(k.upper)); return `<div class="prepcats">${[['upper','상반신'],['illust','일러스트 (로비)'],['lbcg',T('limit')+' CG (개화)'],['faces','표정 기본 6종 (얼굴 범위를 칠해요)'],['lines','이 '+T('skin')+' 전용 대사 (글 AI)']].map(([k,l])=>`<label class="pc"><input type="checkbox" data-skp="${k}" ${sel[k]||k==='upper'&&required?'checked':''} ${k==='lines'&&!SAMPLE||k==='upper'&&required?'disabled':''}><b>${esc(l)}${k==='upper'&&required?' (현재 표시 방식에 필수)':''}</b></label>`).join('')}</div>`; }
function skinSelRead(){ const o={}; document.querySelectorAll('[data-skp]').forEach(i=>{ o[i.dataset.skp]=i.checked?1:0; }); return o; }
function openSkinBuy(id){ const f=skinShopList().find(x=>x.k.id===id); if(!f) return; const {c,k}=f, src=skinPreviewSrc(c,k), pr=k.price||SKIN_PRICE, got=!!(P().skinOwn||{})[k.id], sel=SKBUYSEL||(SKBUYSEL={upper:1,illust:1,lbcg:1,faces:0,lines:SAMPLE?1:0});
  openModal(`${head(`${esc(c.name)} 「${esc(k.name)}」`,`<span class="muted">${esc(k.desc||T('skin'))}</span>`)}
    ${src?`<div class="skp-img"><img src="${esc(src)}" alt="${esc(k.name)}"></div><p class="muted" style="text-align:center;font-size:.78rem;margin:4px 0 0">그림을 누르면 크게 봐요</p>`:`<p class="muted">아직 이 스킨의 그림이 없어요. 사기 전에 그려서 확인해 보세요.</p>`}
    ${c.useStanding===false&&!skinDisplayReady(c,k)?'<p class="muted">스탠딩 사용이 꺼져 있어 이 스킨의 상반신이 필요해요. 아래에서 상반신을 그린 뒤 구매할 수 있어요.</p>':''}
    ${k.line?`<p style="margin:8px 0 0;text-align:center">“${esc(sub(k.line))}”</p>`:''}
    ${got||playMode()?'':`<h3 class="sec">사면 함께 만들 것</h3>${skinSelHTML(sel,c,k)}<p class="muted" style="font-size:.78rem">사면 뒤에서 차례로 그려요. 표정은 얼굴 범위를 칠한 뒤 전신·상반신 모두 얼굴만 다시 그려요.</p>`}
    <div class="row" style="margin-top:10px">${got?'<button class="btn" disabled>보유 중</button>':`<button class="btn" data-act="skbbuy" data-id="${k.id}" ${skinDisplayReady(c,k)?'':'disabled'}>${rIco('gems')}${nf(pr)} 구매</button>`}${imgReady()&&(!playMode()||!skinDisplayReady(c,k))?`<button class="btn ghost" data-act="skbdraw" data-id="${k.id}">${skinDisplayReady(c,k)?'다시 그리기':c.useStanding===false?'상반신 그려 보기':'스탠딩 그려 보기'}</button>`:''}${got||playMode()?'':`<button class="btn ghost" data-act="skinpkgdel" data-id="${k.id}">패키지 지우기</button>`}<button class="btn ghost" data-act="close">닫기</button></div>`); }
let SKJOB=null;
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
// 파견 게시판: 게임의 파견 목록은 이름·설명 견본이고, 실제 의뢰는 매일·완료할 때마다 새로 뽑아요. 보상은 시간×인원에 맞춰요.
const DISP_FOCUS={gold:['크레딧',2500],exp:['경험',6],wmat:['교본',4],core:['코어',0.5]};
function dispOffer(taken){ const pool=(G.dispatches&&G.dispatches.length?G.dispatches:[{name:'주변 정찰',desc:'근처 구역을 둘러보고 쓸 만한 물자를 모아 와요.'},{name:'물자 호송',desc:'보급품을 안전하게 옮겨요.'}]);
  const free=pool.filter(t=>!(taken||[]).includes(t.name)), tpl=rand(free.length?free:pool), hours=rand([1,2,4,8,12]), need=hours<=2?rand([1,2]):hours<=4?rand([2,3]):rand([3,4]);
  let focus=rand(['gold','gold','exp','exp','wmat','core']); if(focus==='core'&&hours<4) focus='exp';
  const pts=Math.pow(hours,0.85)*(1+0.35*(need-1)), r={}; r[focus]=Math.max(1,Math.round(DISP_FOCUS[focus][1]*pts*(focus==='gold'?1:1)));
  if(focus!=='gold') r.gold=Math.round(600*pts/100)*100; if(focus==='gold') r.gold=Math.round(r.gold/100)*100;
  return {id:'o'+uid(),name:String(tpl.name||'파견'),desc:String(tpl.desc||''),hours,need,reward:r}; }
function DBOARD(){ const p=P(); let b=p.dboard; if(!b||!Array.isArray(b.list)) b=p.dboard={day:'',list:[],rr:0};
  // 예전 방식으로 보낸 파견은 그대로 이어서 보여 줘요
  Object.keys(p.disp||{}).forEach(id=>{ if(!b.list.some(o=>o.id===id)){ const t=(G.dispatches||[]).find(x=>x.id===id)||{}, a=p.disp[id]; b.list.push({id,name:String(t.name||'파견'),desc:String(t.desc||''),hours:a.hours||t.hours||2,need:(a.chars||[]).length||t.need||2,reward:t.reward||{gold:2000}}); } });
  if(b.day!==today()){ b.day=today(); b.rr=0; b.list=b.list.filter(o=>p.disp[o.id]); }
  while(b.list.length<5) b.list.push(dispOffer(b.list.map(o=>o.name)));
  return b; }
function dispList(){ return DBOARD().list; }
function dispClaim(d){ const id=d.id; const dr=Object.assign({},d.reward,{gift:d.hours>=4?2:1}); if(dr.gems){ dr.gold=(dr.gold||0)+dr.gems*100; delete dr.gems; } if(seasonIs('train')) Object.keys(dr).forEach(k=>{ if(typeof dr[k]==='number'&&k!=='gift') dr[k]=Math.round(dr[k]*1.5); }); Object.assign(dr,rateR(dr)); giveReward(dr); (P().disp[id].chars||[]).forEach(cid=>{const c=charById(cid);if(c)addAff(c,10);}); delete P().disp[id]; const b=DBOARD(), i=b.list.findIndex(o=>o.id===id); if(i>=0) b.list.splice(i,1,dispOffer(b.list.map(o=>o.name))); return dr; }
function openDispSel(did){
  const d=dispList().find(x=>x.id===did), busy=busyIds(), owned=G.chars.filter(c=>own(c.id)&&!busy.has(c.id));
  DSEL=DSEL&&DSEL.id===did?DSEL:{id:did,ids:[]};
  openModal(`${head(esc(d.name),`<span class="muted">${d.hours}시간 · ${d.need}명 필요 · ${rewardText(d.reward)}</span>`)}
    <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="dsauto">자동 선택 <small>(레벨 낮은 순)</small></button>${DSEL.ids.length?'<button class="btn sm ghost" data-act="dsclr">비우기</button>':''}</div>
    <div class="froster">${owned.map(c=>{ const k=DSEL.ids.indexOf(c.id); return `<button class="fr r${c.rarity} ${k>=0?'on':''}" data-act="dsel" data-id="${c.id}" style="--ec:${ECOL[c.elem]}"><div class="fr-art">${art(c)}</div><span class="el" style="--ec:${ECOL[c.elem]}">${esc(c.elem)}</span>${k>=0?`<em class="num">${k+1}</em>`:''}<b>${esc(c.name)}</b><span>Lv.${own(c.id).lv} · ${esc(ROLE[c.role]||'')}</span></button>`; }).join('')||'<p class="muted">보낼 수 있는 '+T('crew')+'이(가) 없어요</p>'}</div>
    <div class="row" style="margin-top:14px"><button class="btn block" data-act="dispgo" ${DSEL.ids.length===d.need?'':'disabled'}>${DSEL.ids.length}/${d.need} 보내기</button></div>`);
}
let DSEL=null;
function openAiEvent(){
  openModal(`${head('AI로 이벤트 만들기')}
    <label class="f" for="ae_d">이벤트 내용</label><textarea class="in" id="ae_d" placeholder="예: 여름 해변 축제. 바다에서 떠오른 잔광 해파리 소동. 수영복 차림의 카야와 이브가 주인공."></textarea>
    <label class="f">주연 ${T('crew')}</label><div class="chips">${G.chars.map(c=>`<button class="chip" data-act="castt" data-id="${c.id}">${esc(c.name)}</button>`).join('')}</div>
    <div class="g2"><div><label class="f" for="ae_n">스테이지 수</label><select class="in" id="ae_n">${opt([[3,'3개'],[4,'4개'],[5,'5개']],3)}</select></div>
    <div><label class="f" for="ae_new">한정 ${T('crew')}</label><select class="in" id="ae_new">${opt([['1','새로 만들기'],['0','만들지 않기']],'1')}</select></div></div>
    <label class="f" for="ae_len">스토리 분량</label><select class="in" id="ae_len">${opt(Object.entries(STORY_LEN).map(([k,v])=>[k,v[0]+' (스테이지마다 대본 '+v[1].pre+'줄)']),storyCfg().len)}</select>
    <p class="muted" style="margin:4px 0 0;font-size:.78rem">길게 쓸수록 시간이 더 걸리고 글 AI 사용량이 늘어요.</p>
    <label class="f" for="ae_lore">이야기 종류 (로어북)</label><select class="in" id="ae_lore">${opt(loreOpts(),'')}</select>
    <p class="muted" style="margin:4px 0 0;font-size:.78rem">IF 스토리는 관계도·스토리 기억에 남지 않아서, 본편과 다른 과감한 이야기도 마음껏 쓸 수 있어요. 이격 전용은 그 이격의 관계 기록에만 남아요.</p>
    <div class="row" style="margin-top:14px"><button class="btn" data-act="aievent">만들기</button></div>
    <p class="muted">이벤트 스토리, 한정 배너, 교환소, 필요한 배경과 음악, ${T('talk')}까지 만들어요.</p>`);
}
