/* ===== art — 기능 class(Model · View · Ctl) — docs/redesign.md 2·3절, tools/reshape.mjs가 매핑대로 옮김 ===== */
class ArtView {
  static switchFlip(el){ const on=el.getAttribute('aria-checked')!=='true'; el.setAttribute('aria-checked',String(on)); return on; }

  static pthumbHTML(id,cls){ const t=Art.pthumb(id); return t?`<img class="pthumb ${cls||''}" src="${esc(t)}" alt="">`:''; }

  static packHTML(){ const up=Core.userPacks();
    return `${head('그림체 프리셋','<span class="muted">적용하면 그림 AI 설정에 바로 들어가요</span>')}
    <h3 class="sec">기본 프리셋</h3>${STYLE_PRESETS.map(p=>`<div class="ep">${ArtView.pthumbHTML(p.id)}<span class="t"><b>${esc(p.name)}</b><span class="muted">${esc(p.desc||'')}${p.by?' · '+esc(p.by):''}</span></span><button class="btn sm" data-act="packuse" data-v="${p.id}">적용</button><button class="btn sm ghost" data-act="pthumbset" data-v="${p.id}" title="썸네일">🖼</button>${Art.pthumb(p.id)?`<button class="btn sm ghost" data-act="pthumbdel" data-v="${p.id}" title="썸네일 지우기">🗑</button>`:''}</div>`).join('')}
    <h3 class="sec">내 프리셋 ${up.length}</h3>${up.length?up.map(p=>`<div class="ep">${ArtView.pthumbHTML(p.id)}<span class="t"><b>${esc(p.name)}</b><span class="muted">${esc(String(p.tags||'').slice(0,40))}${p.by?' · '+esc(p.by):''}</span></span><button class="btn sm" data-act="packuse" data-v="${p.id}">적용</button><button class="btn sm ghost" data-act="pthumbset" data-v="${p.id}" title="썸네일">🖼</button>${Art.pthumb(p.id)?`<button class="btn sm ghost" data-act="pthumbdel" data-v="${p.id}" title="썸네일 지우기">🗑</button>`:''}<button class="btn sm ghost" data-act="packcopy" data-v="${p.id}">내보내기</button><button class="btn sm ghost" data-act="packdel" data-v="${p.id}">✕</button></div>`).join(''):'<p class="muted" style="margin:0">아직 없어요.</p>'}
    <div class="row" style="margin-top:12px"><button class="btn sm" data-act="packsave">지금 그림체를 프리셋으로 저장</button><button class="btn sm ghost" data-act="packimport">코드로 가져오기</button></div>`; }

  static drPresetHTML(){ const cur=DR2.preset||''; return `<label class="f">그림체 프리셋</label><div class="dr-pres">${[{id:'',name:'지금 설정 그대로',desc:'설정 → 그림 AI의 그림체를 써요'},...Core.allPresets()].map(s=>`<button type="button" class="dr-pre ${cur===s.id?'on':''}" data-act="drpreset" data-v="${s.id}">${s.id?ArtView.pthumbHTML(s.id,'big'):''}<b>${esc(s.name)}</b><span>${esc(s.desc)}${s.by?` · 프리셋 제공: ${esc(s.by)}`:''}</span></button>`).join('')}</div><p class="muted" style="margin:4px 0 0;font-size:.76rem">고르면 그림 AI 설정(그림체·품질 태그·스텝·가이던스·샘플러)에 바로 적용되고, 이 게임의 그림체로 저장돼요.</p>`; }

  static applyStylePreset(id){ const s=Core.allPresets().find(x=>x.id===id); if(!s) return; const set=(k,v)=>{ const el=$('#'+k); if(el) el.value=v; };
    const q=NewGame.presetQualityParts(s); set('nai_stags',q.tags); if($('#nai_stags'))$('#nai_stags').dataset.presetApplied='true'; set('nai_sneg',s.neg); set('nai_steps',s.steps); set('nai_scale',s.scale); set('nai_cfgr',s.cfgRescale); set('nai_sampler',s.sampler);
    CoreView.toast(`「${s.name}」 프리셋을 채웠어요. 아래 '저장'을 눌러야 적용돼요`);  }

  static async naiBatch(kind){
    const items=G.lib.filter(l=>l.kind===kind&&!l.img&&((l.prompt||'').trim()||(kind==='cg'&&Core.cgCast(l).length)));
    if(!items.length){CoreView.toast('그릴 미등록 항목이 없어요');return;}
    if(!Core.imgReady()){CoreView.toast(Core.imgNeed());return;}
    if(NAIBATCH){CoreView.toast('이미 일괄 생성 중이에요');return;}
    const job={stop:false}; NAIBATCH=job; let done=0;
    CoreView.openModal(ArtView.naiBatchHTML(items));
    for(const l of items){
      if(job.stop) break; CoreView.say('#nbStat',`${done} / ${items.length} · ${l.name} 그리는 중`);
      try{ const b=await Core.naiDrawItem({k:kind,o:l}); await Art.storeImage(l,b,'l:'); done++; await wait(600); }catch(e){ CoreView.toast(Core.naiErr(e)); break; }
    }
    NAIBATCH=null; Challenge.render(); if($('#nbStat')) ArtView.openLib(kind); CoreView.toast(`${done}개를 그려서 등록했어요`);
  }

  static openNaiSet(){
    const c=Core.naiCfg(), sz=k=>{const v=(c.sizes||{})[k];const list=NAI_SIZES.map(x=>[x[0]+'x'+x[1],x[2]]);if(v&&!list.some(x=>x[0]===v))list.unshift([v,v]);return CoreView.opt(list,v);};
    CoreView.openModal(`${head('그림 AI')}
      <label class="f" for="nai_auto">AI가 새 스테이지·이벤트·${System.T('crew')}를 만들면</label><select class="in" id="nai_auto">${CoreView.opt([['ask','그릴지 물어보기'],['auto','자동으로 그리기'],['off','그리지 않기']],c.autoArt||'ask')}</select>
      <label class="f" for="nai_prov">그림 AI 종류</label><select class="in" id="nai_prov">${CoreView.opt([['nai','NovelAI'],['comfy','ComfyUI (내 PC나 서버)']],c.provider||'nai')}</select>
      <div class="optbox" id="comfyBox" ${c.provider==='comfy'?'':'hidden'}>
        <label class="f" for="cf_url">ComfyUI 주소</label><input class="in" id="cf_url" value="${esc(Art.comfyCfg().url)}" placeholder="http://192.168.0.10:8188">
        ${!IS_NATIVE&&location.protocol==='https:'?'<p style="color:var(--rose);margin:4px 0 0;font-size:.82rem">아이폰·웹 버전에서는 https 주소만 연결돼요. PC의 ComfyUI를 Cloudflare Tunnel 같은 걸로 https 주소로 열고, --enable-cors-header 옵션도 켜 주세요.</p>':''}
        <p class="muted" style="margin:4px 0 0">PC에서 ComfyUI를 <code>--listen</code> 옵션으로 켜고, 폰과 같은 와이파이에서 PC의 IP 주소를 넣어요. 밖에서 쓰려면 Cloudflare Tunnel 같은 https 주소도 돼요.</p>
        <label class="f" for="cf_wf">워크플로 (API 형식 JSON)</label><textarea class="in" id="cf_wf" style="min-height:90px" placeholder='ComfyUI 메뉴 → Workflow → Export (API)로 저장한 파일 내용'>${esc(Art.comfyCfg().wf)}</textarea>
        <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-act="cfload">JSON 파일 불러오기</button><button class="btn sm ghost" data-act="cftest">연결 확인</button></div>
        <p class="muted" style="margin:4px 0 0">KSampler에 연결된 프롬프트·크기·시드 노드를 자동으로 찾아요. 직접 지정하려면 노드 제목을 <code>[GGM:positive]</code> <code>[GGM:negative]</code> <code>[GGM:size]</code> <code>[GGM:seed]</code> <code>[GGM:output]</code>으로 바꾸세요. 에셋 메이드의 <code>[AssetMaid:…]</code> 제목도 그대로 알아들어요.</p>
        <div class="g2"><div><label class="f" for="cf_q">항상 붙일 품질 태그</label><input class="in" id="cf_q" value="${esc(Art.comfyCfg().qtags)}"></div><div><label class="f" for="cf_n">항상 붙일 네거티브</label><input class="in" id="cf_n" value="${esc(Art.comfyCfg().neg)}"></div></div>
        <label class="f" for="cf_t">최대 대기 (초)</label><input class="in" id="cf_t" type="number" value="${Art.comfyCfg().timeoutSec}">
      </div>
      <div id="naiBox" ${c.provider==='comfy'?'hidden':''}>
      <label class="f" for="nai_key">영구 API 토큰</label><input class="in" id="nai_key" type="password" autocomplete="off" value="${esc(c.key)}" placeholder="pst-...">
      <p class="muted" style="margin:4px 0 0">novelai.net 로그인 → 왼쪽 위 톱니(설정) → Account → Get Persistent API Token</p>
      <label class="f" for="nai_ep">생성 주소 (엔드포인트)</label><input class="in" id="nai_ep" value="${esc(c.endpoint)}" placeholder="${NAI_ENDPOINT}">
      <p class="muted" style="margin:4px 0 0">보통은 그대로 두세요. 중계 서버를 쓸 때만 바꿔요. 표정 변환도 같은 서버로 보내요.</p>
      <datalist id="naimodels">${NAI_MODELS.map(m=>`<option value="${m[0]}">${m[1]}</option>`).join('')}</datalist>
      <div class="g2"><div><label class="f" for="nai_model">기본 모델</label><input class="in" id="nai_model" list="naimodels" value="${esc(c.model)}"></div><div><label class="f" for="nai_rmodel">레퍼런스용 모델 (V4.5)</label><input class="in" id="nai_rmodel" list="naimodels" value="${esc(c.refModel)}"></div></div>
      <div class="optbox"><div style="display:flex;align-items:center;justify-content:space-between;gap:12px"><label class="f" for="nai_variety" style="margin:0">Variety Boost (V4.5 전용)</label><button type="button" id="nai_variety" class="v2-switch" role="switch" aria-label="V4.5 Variety Boost" aria-checked="${c.varietyBoostV45!==false}" data-act="naivariety"><span></span></button></div><p class="muted" style="margin:6px 0 0">V4.5 생성 옵션을 켜거나 꺼요. 기본은 켜기이며 품질 태그와 별개예요. V5·다른 모델과 캐릭터 레퍼런스를 쓰는 생성에는 적용하지 않아요. 아래 저장을 눌러 적용해 주세요.</p></div>
      <div class="g2"><div><label class="f" for="nai_sampler">샘플러</label><select class="in" id="nai_sampler">${CoreView.opt([['k_euler_ancestral','Euler Ancestral'],['k_euler','Euler'],['k_dpmpp_2s_ancestral','DPM++ 2S Ancestral'],['k_dpmpp_2m_sde','DPM++ 2M SDE'],['k_dpmpp_2m','DPM++ 2M'],['k_dpmpp_sde','DPM++ SDE']],c.sampler)}</select></div>
      <div><label class="f" for="nai_noise">노이즈 스케줄</label><select class="in" id="nai_noise">${CoreView.opt([['karras','karras'],['exponential','exponential'],['polyexponential','polyexponential']],c.noise)}</select></div></div>
      <div class="g4"><div><label class="f" for="nai_steps">스텝</label><input class="in" id="nai_steps" type="number" value="${c.steps}"></div><div><label class="f" for="nai_scale">프롬프트 강도</label><input class="in" id="nai_scale" type="number" step="0.1" value="${c.scale}"></div><div><label class="f" for="nai_cfgr">CFG 리스케일</label><input class="in" id="nai_cfgr" type="number" step="0.05" value="${c.cfgRescale}"></div><div><label class="f" for="nai_retry">재시도</label><input class="in" id="nai_retry" type="number" value="${c.retries}"></div></div>
      </div>
      <h3 class="sec">기본 크기</h3>
      <div class="g2"><div><label class="f" for="nai_sz_char">스탠딩</label><select class="in" id="nai_sz_char">${sz('char')}</select></div><div><label class="f" for="nai_sz_bg">배경</label><select class="in" id="nai_sz_bg">${sz('bg')}</select></div></div>
      <div class="g2"><div><label class="f" for="nai_sz_prop">소품·무기</label><select class="in" id="nai_sz_prop">${sz('prop')}</select></div><div><label class="f" for="nai_sz_cg">CG</label><select class="in" id="nai_sz_cg">${sz('cg')}</select></div></div>
      <div class="g2"><div><label class="f" for="nai_sz_enemy">적</label><select class="in" id="nai_sz_enemy">${sz('enemy')}</select></div><div><label class="f" for="nai_sz_illust">일러스트</label><select class="in" id="nai_sz_illust">${sz('illust')}</select></div></div>
      <h3 class="sec">캐릭터 레퍼런스 기본값</h3>
      <div class="g4"><div style="grid-column:span 2"><label class="f" for="nai_rt">종류</label><select class="in" id="nai_rt">${CoreView.opt([['character','캐릭터'],['character&style','캐릭터+화풍'],['style','화풍만']],c.ref.type)}</select></div><div><label class="f" for="nai_rs">강도</label><input class="in" id="nai_rs" type="number" step="0.1" value="${c.ref.strength}"></div><div><label class="f" for="nai_rf">충실도</label><input class="in" id="nai_rf" type="number" step="0.1" value="${c.ref.fidelity}"></div></div>
      <label class="f" for="nai_aref">스탠딩을 레퍼런스로 자동 사용</label><select class="in" id="nai_aref">${CoreView.opt([['off','끄기'],['illust','일러스트·로비 CG·스토리 CG'],['all','일러스트·CG + 기술 컷인·상반신']],c.autoRef||'off')}</select>
      <p class="muted" style="margin:4px 0 0">켜면 그림 준비실·바로 그리기에서 그 캐릭터(CG는 등장 ${System.T('crew')})의 스탠딩을 캐릭터 레퍼런스로 넣어서 얼굴·머리·옷이 스탠딩과 맞게 나와요. 스탠딩이 없는 캐릭터는 그냥 그려요. 레퍼런스는 V4.5 전용이라 위의 레퍼런스용 모델로 그리고, Anlas가 더 들 수 있어요.</p>
      <h3 class="sec">그림체 프리셋</h3>
      ${Core.allPresets().map(s=>`<div class="ep">${ArtView.pthumbHTML(s.id)}<span class="t"><b>✦ ${esc(s.name)}</b><span class="muted">${esc(s.desc||'')}${s.by?' · 프리셋 제공: '+esc(s.by):''}</span></span><button class="btn sm" data-act="naipreset" data-v="${s.id}">불러오기</button></div>`).join('')}<div class="row" style="margin-top:6px"><button class="btn sm ghost" data-act="packopen">내 프리셋 저장·공유</button></div>
      <p class="muted" style="margin:4px 0 0;font-size:.78rem">불러오면 그림체·네거티브·생성 설정이 채워져요. 기본·개인 프리셋 모두 품질 태그를 상단 그림체 태그에 포함해요. 저장을 눌러야 적용되고, 저장하지 않고 닫으면 그대로예요.</p>
      <h3 class="sec">프롬프트 조립</h3>
      <p class="muted" style="margin:0">화풍 → 공통 앞 → 각자의 프롬프트 → 자세·구도(스탠딩) → 종류별 뒤. 겹치는 태그는 한 번만 들어가요. CG는 장면 프롬프트에 인물별 프롬프트를 따로 붙여요.</p>
      <label class="f" for="nai_stags">그림체 태그 (모든 그림 맨 앞에 붙어요. 게임 정의에서 게임마다 따로 정할 수도 있어요)</label><textarea class="in" id="nai_stags" placeholder="${esc(STYLE_EX)}">${esc(c.styles[0].tags)}</textarea>
      <label class="f" for="nai_sneg">그림체 네거티브 (선택)</label><input class="in" id="nai_sneg" value="${esc(c.styles[0].neg||'')}" placeholder="예: 3d, realistic">
      <label class="f" for="nai_prefix">공통 앞 프롬프트 (모든 그림)</label><input class="in" id="nai_prefix" value="${esc(c.prefix)}">
      <label class="f" for="nai_poses">자세 프리셋 (한 줄에 하나: 이름 | 태그)</label><textarea class="in" id="nai_poses">${esc(c.poses.map(x=>x.n+' | '+x.t).join('\n'))}</textarea>
      <div class="optbox" style="margin-top:10px;font-size:.8rem"><b>종류별 추가 태그</b> <span class="muted">아래 '뒤' 칸은 AI를 거치지 않고 그 종류 그림에 항상 붙어요. AI가 태그를 쓸 때 따를 지침(의상을 자세히, 일러스트 조명·구도 등)은</span> <button class="linkb" type="button" data-act="llmopen">글 AI 지침 → 그림 태그 지침</button></div>
      ${['char','illust','lbcg','enemy','bg','prop','cg'].map(k=>`<div class="g2"><div><label class="f" for="nai_p_${k}">${({char:'스탠딩',illust:'일러스트',lbcg:'돌파 CG',enemy:'적',bg:'배경',prop:'소품·무기',cg:'CG'})[k]} 뒤</label><input class="in" id="nai_p_${k}" value="${esc(c.parts[k].suffix)}"></div><div><label class="f" for="nai_n_${k}">네거티브 추가</label><input class="in" id="nai_n_${k}" value="${esc(c.parts[k].neg)}"></div></div>`).join('')}
      <label class="f" for="nai_neg">공통 네거티브</label><textarea class="in" id="nai_neg">${esc(c.neg)}</textarea>
      <label class="f" for="nai_cut">스탠딩·적 배경 자동 제거 (세부 조절은 각 이미지의 '배경 지우기'에서)</label><select class="in" id="nai_cut">${CoreView.opt([['1','켜기'],['0','끄기']],c.cutout?'1':'0')}</select>
      <label class="f" for="nai_tp">V5 투명 배경으로 생성 (스탠딩·적·프랍. 흰 배경을 지울 필요가 없어져요. 레퍼런스를 쓰면 V4.5라서 꺼져요)</label><select class="in" id="nai_tp">${CoreView.opt([['1','켜기'],['0','끄기']],c.transparent?'1':'0')}</select>${appStorage.getItem('starfall-nai-tperr')?`<p class="muted" style="margin:4px 0 0">최근 투명 생성 실패: ${esc(appStorage.getItem('starfall-nai-tperr'))}</p>`:''}
      <p class="muted" style="margin-top:8px">Opus 구독이면 1024×1024 이하 넓이, 28스텝 이하, 1장 생성에 Anlas가 들지 않아요. 레퍼런스와 img2img는 추가로 들 수 있어요.</p>
      <div class="row" style="margin-top:14px"><button class="btn" data-act="naisave">저장</button><button class="btn ghost" data-act="naitest">연결 확인</button></div>`);
  }

  static readNai(){
    const old=Core.naiCfg(), v=id=>$('#'+id).value.trim();
    const styles=old.styles;
    const poses=lines($('#nai_poses').value).map(l=>{const p=l.split('|');return {n:(p[0]||'').trim(),t:p.slice(1).join('|').trim()};}).filter(x=>x.n&&x.t);
    const parts={}; ['char','illust','lbcg','enemy','bg','prop','cg'].forEach(k=>{parts[k]={suffix:v('nai_p_'+k),neg:v('nai_n_'+k)};});
    return {key:v('nai_key'),endpoint:v('nai_ep')||NAI_ENDPOINT,model:v('nai_model')||NAI_DEF.model,refModel:v('nai_rmodel')||NAI_DEF.refModel,sampler:$('#nai_sampler').value,noise:$('#nai_noise').value,
      steps:num(v('nai_steps'),1,50,28),scale:num(v('nai_scale'),0,10,6),cfgRescale:num(v('nai_cfgr'),0,1,0),retries:num(v('nai_retry'),1,5,3),timeoutSec:old.timeoutSec,
      provider:$('#nai_prov').value,comfy:{url:v('cf_url'),wf:$('#cf_wf').value.trim(),qtags:v('cf_q'),neg:v('cf_n'),timeoutSec:num(v('cf_t'),30,1200,300)},varietyBoostV45:$('#nai_variety').getAttribute('aria-checked')==='true',quality:false,qtags:'',legacyQualityTags:$('#nai_stags').dataset.presetApplied?'':old.legacyQualityTags||'',cutout:$('#nai_cut').value==='1',transparent:$('#nai_tp').value==='1',prefix:v('nai_prefix'),neg:v('nai_neg'),autoArt:$('#nai_auto').value,
      sizes:{char:$('#nai_sz_char').value,bg:$('#nai_sz_bg').value,prop:$('#nai_sz_prop').value,cg:$('#nai_sz_cg').value,enemy:$('#nai_sz_enemy').value,illust:$('#nai_sz_illust').value},cut:Object.assign({},old.cut),
      ref:{type:$('#nai_rt').value,strength:num(v('nai_rs'),0,1,1),fidelity:num(v('nai_rf'),0,1,1)},autoRef:$('#nai_aref')?$('#nai_aref').value:(old.autoRef||'off'),
      styles:[{id:'my_style',name:'내 그림체',tags:v('nai_stags'),neg:v('nai_sneg')}],styleId:'my_style',poses:poses.length?poses:NAI_DEF.poses,parts};
  }

    /* 일괄 생성 진행 창 내용(View) */
static naiBatchHTML(items){ return `${head('일괄 생성')}<p id="nbStat">0 / ${items.length}</p><p class="muted">한 장씩 그려서 자동으로 등록해요. 창을 닫아도 계속 진행돼요.</p><div class="row"><button class="btn ghost" data-act="naistop">중지</button></div>`; }

  static showCast(){ if(!CAST) CAST={q:[],busy:null};
    const cs=Characters.castChars(); cs.forEach(c=>{ if(!Characters.imgSrc(c)&&!CAST.q.some(x=>x.c===c.id&&x.k==='full')&&!(CAST.busy&&CAST.busy.c===c.id&&CAST.busy.k==='full')) CAST.q.push({c:c.id,k:'full'}); if(c.upper&&!Characters.imgSrc(c.upper)&&!CAST.q.some(x=>x.c===c.id&&x.k==='up')&&!(CAST.busy&&CAST.busy.c===c.id&&CAST.busy.k==='up')) CAST.q.push({c:c.id,k:'up'}); });
    $('#ov').innerHTML=`<div class="setup cast-wrap"><div class="sw-bg" style="${ArtView.bgStyle(P().titleBg||'')}"></div><div class="sw-card cast-sheet">
      <div class="sw-logo"><i>CASTING</i><b>${esc(G.meta.title)}</b></div>
      <p class="muted" style="margin:0 0 6px;font-size:.85rem">⟳ 다시 뽑기 · 😊 표정 · 그림을 누르면 크게</p>
      <div class="row" style="margin:0 0 6px"><button class="btn sm" data-act="castfaces">😊 표정 한꺼번에 만들기 (인페인팅)</button></div>
      <p class="muted" id="castStat" style="margin:0 0 10px;font-size:.8rem"></p>
      <div class="cast-grid" id="castGrid">${cs.map(MiscView.castCardHTML).join('')}</div>
      <div class="sw-btns" style="margin-top:12px"><button class="btn" data-act="castok">이 모습으로 시작</button><button class="btn ghost" data-act="castskip">나중에 정하기</button></div>
    </div></div>`; $('#ov').hidden=false; CoreView.castStat(); CoreCtl.castRun(); }

  static async openAssets(tab){ if(tab) AM_TAB=tab; const tabs=[['shared','공유 보관함'],['game','이 게임 자료'],['emote','감정 아이콘']]; let body='';
    if(AM_TAB==='shared'){ const L=Art.shList(); const srcs=await Promise.all(L.map(x=>shAudio(x.kind)?null:Art.shSrc(x)));
      body=`<p class="muted" style="font-size:.82rem">모든 게임이 함께 쓰는 자료예요. 이 게임 자료에서 '보관함에 넣기'로 넣고, 여기서 '가져오기'로 지금 게임에 넣어요. 새 장을 만들 때 같은 이름의 배경·소품이 생기면 자동으로 가져와요.</p>
      ${L.length?L.map((x,i)=>`<div class="ep">${srcs[i]?`<img src="${esc(srcs[i])}" alt="" style="width:48px;height:48px;object-fit:cover;border-radius:6px">`:`<span style="width:48px;text-align:center">${shAudio(x.kind)?'♪':'—'}</span>`}<span class="t"><b>${esc(x.name)}</b><span class="muted">${esc(SH_KINDS[x.kind]||x.kind)} · ${esc(x.from||'')}${G.lib.some(l=>l.kind===x.kind&&l.name===x.name&&(l.img||l.audio))?' · 이 게임에 있음':''}</span></span><button class="btn sm" data-act="amtake" data-id="${x.id}">가져오기</button><button class="btn sm ghost" data-act="amshdel" data-id="${x.id}">✕</button></div>`).join(''):'<p class="muted">아직 비어 있어요</p>'}`; }
    else if(AM_TAB==='game'){ const U=Art.libUsage(), D=Art.libDupes(), L=G.lib.filter(l=>SH_KINDS[l.kind]), unused=L.filter(l=>['bg','prop'].includes(l.kind)&&!U[l.name]&&!l.alias);
      body=`<p class="muted" style="font-size:.82rem">자료 ${L.length}개 · 대본에서 안 쓰는 배경·소품 ${unused.length}개 · 중복 ${D.length}개</p>
      ${D.length?`<div class="panel" style="padding:8px"><b>중복</b> (같은 프롬프트·이름): ${D.map(x=>`${esc(x.dup.name)} → ${esc(x.keep.name)}`).join(', ')}<div class="row" style="margin-top:6px"><button class="btn sm" data-act="ammerge">그림 1장으로 합치기 (${D.length})</button>${AUDIT_UNDO?`<button class="btn sm ghost" data-act="amundo">되돌리기</button>`:''}</div></div>`:''}
      <div class="row" style="gap:6px;margin:6px 0"><button class="btn sm ghost" data-act="amadopt">보관함에서 같은 이름 자료 채우기</button></div>
      ${L.map(l=>{ const s=shAudio(l.kind)?null:Characters.imgSrc(l); return `<div class="ep">${s?`<img src="${esc(s)}" alt="" style="width:48px;height:48px;object-fit:cover;border-radius:6px">`:`<span style="width:48px;text-align:center">${shAudio(l.kind)?(l.audio?'♪':'—'):'—'}</span>`}<span class="t"><b>${esc(l.name)}</b><span class="muted">${esc(SH_KINDS[l.kind])} · 대본 ${U[l.name]||0}번${l.alias?' · 별칭':''}${l.shared?' · 보관함':''}</span></span>${(s||l.audio)&&!l.alias?`<button class="btn sm ghost" data-act="amput" data-id="${l.id}">보관함에 넣기</button>`:''}</div>`; }).join('')}`; }
    else { body=`<p class="muted" style="font-size:.82rem">대본의 [표정|하트] · [연출: 이름 땀] · [스티커: 화남]에 쓰는 감정 아이콘이에요. 그림을 올리면 기본 아이콘 대신 써요(공유 보관함에 넣으면 다른 게임에서도).</p>
      <div style="display:flex;flex-wrap:wrap;gap:10px">${Object.keys(EMOTES).map(k=>{ const l=G.lib.find(x=>x.kind==='emote'&&x.name===k); return `<div style="width:92px;text-align:center"><div style="height:60px">${ArtView.emoteHTML(k,true).replace('class="emo big','class="emo big still')}</div><b style="font-size:.8rem">${esc(k)}</b><label class="btn sm ghost" style="display:block;margin-top:4px">그림<input type="file" accept="image/*" hidden data-amemo="${esc(k)}"></label>${l?`<button class="btn sm ghost" data-act="amemodel" data-id="${l.id}" style="margin-top:2px">기본으로</button>`:''}</div>`; }).join('')}</div>`; }
    CoreView.openModal(`${head('에셋 관리','<span class="muted">공유·재사용</span>')}<div class="row" style="gap:4px;margin-bottom:8px">${tabs.map(([k,l])=>`<button class="btn sm ${AM_TAB===k?'':'ghost'}" data-act="amtab" data-k="${k}">${l}</button>`).join('')}</div>${body}<div class="row" style="margin-top:12px"><button class="btn ghost" data-act="close">닫기</button></div>`); }

  static assetPanel(){ const sh=Art.shList().length, d=Art.libDupes().length; return `<div class="panel pm-hide"><h3>에셋 관리 ${d?`<span class="badge">중복 ${d}</span>`:''}</h3><p class="muted" style="margin:0 0 6px">공유 보관함 ${sh}개 · 게임끼리 배경·소품·음악·감정 아이콘을 재사용하고, 중복 자료를 합치고, 안 쓰는 자료를 찾아요.</p><button class="btn sm" data-act="amopen">에셋 관리</button></div>`; }

    // 배경음 한꺼번에: 고른 곡을 뒤에서 한 곡씩 작곡해요(그동안 플레이 가능, 다 되면 우편)
static openBgmAll(){ const items=G.lib.filter(l=>l.kind==='bgm'); if(!items.length){ CoreView.toast('배경음 목록이 비어 있어요'); return; }
    CoreView.openModal(`${head('배경음 한꺼번에 만들기','<span class="muted">ElevenLabs 작곡 · 한 곡에 1~3분</span>')}
      ${Core.SND().elKey?'':'<p style="color:var(--rose);margin:0 0 8px">설정 → 소리에서 ElevenLabs 키를 먼저 넣어 주세요.</p>'}
      <p class="muted" style="margin:0 0 8px">고른 곡을 뒤에서 한 곡씩 작곡해요. 그동안 플레이해도 되고, 다 되면 우편으로 알려 드려요. 프롬프트가 비어 있는 곡은 곡 이름으로 만들어요.</p>
      <div class="chips">${items.map(l=>`<button class="chip ${l.audio?'':'on'}" data-act="bgmpick" data-id="${l.id}">${esc(l.name)}${l.audio?' ✓':''}</button>`).join('')}</div>
      <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-act="bgmpickall" data-v="miss">미등록만</button><button class="btn sm ghost" data-act="bgmpickall" data-v="all">모두</button><button class="btn sm ghost" data-act="bgmpickall" data-v="none">모두 빼기</button></div>
      <p class="muted" style="margin:8px 0 0;font-size:.78rem">✓는 이미 곡이 있는 항목이에요. 고르면 새로 작곡해서 바꿔요. 곡 길이는 설정 → 소리의 작곡 길이를 따라요.</p>
      <div class="row" style="margin-top:12px"><button class="btn" data-act="bgmallgo" ${Core.SND().elKey?'':'disabled'}>작곡 시작</button></div>`); }

  static bgm(name,force){
    const s=Core.SND(); BGM.want=name||null;
    if(!s.bgmOn&&!force) name=null;
    const it=name&&G.lib.find(l=>l.kind==='bgm'&&l.name===name), src=it&&audioCache[it.id];
    if(!src){ Core.bgmFade(0,()=>{BGM.el.pause();BGM.name=null;}); return; }
    if(BGM.name===name&&!BGM.el.paused){ Core.bgmFade(s.bgmVol); return; }
    Core.bgmFade(0,()=>{ BGM.name=name; BGM.el.src=src; BGM.el.volume=0; BGM.el.play().then(()=>{BGM.blocked=false;Core.bgmFade(s.bgmVol);}).catch(()=>{BGM.blocked=true;}); });
  }

  static libArt(name){
    const it=G.lib.find(l=>l.name===name);
    const s=it&&Characters.imgSrc(it);
    if(s) return `<img class="art" src="${esc(s)}" alt="${esc(name)}">`;
    if(it&&it.kind==='bg') return `<div class="art" style="${ArtView.bgStyle(name)}"></div>`;
    return `<div class="art ph" style="--ec:var(--brass)"><small>${esc(name)}</small><small>이미지 미등록</small></div>`;
  }

  static bgStyle(name){
    const it=G.lib.find(l=>l.kind==='bg'&&l.name===name); const s=it&&Characters.imgSrc(it);
    if(s) return `background-image:url('${s}');background-size:cover;background-position:center`;
    return `background-image:${SystemView.procBg(name||'밤')};background-size:cover;background-position:center bottom`;
  }

  static bubbleHTML(l,c){
    if(l.w==='s') return `<div class="sys">${esc(l.t)}</div>`;
    if(l.w==='me') return `<div class="msg me">${l.img?`<div class="bub photo">${CoreView.chatImgHTML(l.img)}</div>`:''}${l.t||!l.img?`<div class="bub">${esc(l.t)}</div>`:''}</div>`;
    const inner=l.w==='k'?`<div class="bub sticker">${ArtView.emoteHTML(l.t,true)}</div>`:l.w==='p'?`<div class="bub photo">${l.img?CoreView.chatImgHTML(l.img):ArtView.libArt(l.t)}</div>`:`<div class="bub">${esc(l.t)}</div>`;
    return `<div class="msg"><div class="av sm">${CoreView.art(c)}</div>${inner}</div>`;
  }

  static showSetup(){ const s=Core.SND(); APD={id:'',type:'gemini',pub:'google',name:'',region:'global',base:'https://openrouter.ai/api/v1'}; SW={step:0,ai:{type:'gemini',key:''},img:Art.imgProvider(),cf:Object.assign({},Art.comfyCfg()),nai:Core.naiCfg().key||'',fish:s.fishKey||'',el:s.elKey||'',ok:{},hasAI:System.AIP().list.some(Core.apValid),cst:{tags:Art.myStyle().tags||'',neg:Art.myStyle().neg||''},stPrev:''}; ArtView.renderSetup(); $('#ov').hidden=false; }

  static renderSetup(){
    const oldSetup=$('#ov .setup'),setupPosition=oldSetup?.dataset.step===String(SW.step)?PlayerView.uiScrollCapture($('#ov')):null;
    const st=SW.step, dots=[0,1,2,3,4,5].map(i=>`<i class="${i<=st?'on':''}"></i>`).join(''), a=SW.ai, help=SETUP_HELP[a.type];
    const card=[
      `<div class="sw-logo sw-splash"><i>GACHA GAME MAKER</i><b>가챠 게임 메이커</b><span>내가 정한 세계관으로 만드는 나만의 가챠 게임</span></div>
       ${IS_IOS&&!IS_STANDALONE?'<p style="margin:8px 0 0;font-size:.82rem">📱 Safari 공유(⬆︎) → <b>홈 화면에 추가</b> 후 아이콘으로 열면 저장이 안전해요.</p>':''}
       <div class="sw-btns"><button class="btn" data-act="swnext">시작하기</button><button class="btn ghost" data-act="swskipall">샘플 게임으로</button></div>`,
      `<h2>글 AI</h2><p class="muted">세계관·캐릭터·스토리를 써요. 키는 이 기기에만 저장돼요.</p>
       ${System.AIP().list.length?`<div class="sw-added">${System.AIP().list.map(p=>`<span>✓ ${esc(p.name||AITYPE[p.type])}${p.model?' · '+esc(p.model):''}</span>`).join('')}</div>`:''}
       ${CoreView.apForm(APD)}
       ${SETUP_HELP[APD.type]?`<p class="muted" style="margin:2px 0 0"><button class="linkb" data-act="swlink" data-url="${SETUP_HELP[APD.type][1]}">키 받으러 가기</button></p>`:''}
       <div class="sw-test"><button class="btn sm ghost" data-act="swtestai">연결 확인</button><button class="btn sm ghost" data-act="swaddai">이 AI 추가하고 하나 더</button><span id="sw_res">${SW.ok.ai?'✓ 연결됨':''}</span></div>
       <div class="sw-btns"><button class="btn ghost" data-act="swprev">이전</button><button class="btn" data-act="swnext">다음</button></div>`,
      `<h2>그림 AI</h2><p class="muted">스탠딩, 일러스트, 배경, 적, 아이콘을 그려요.</p>
       <label class="f" for="sw_img">종류</label><select class="in" id="sw_img">${CoreView.opt([['nai','NovelAI (구독 필요, 투명 배경·레퍼런스·표정 변환)'],['comfy','ComfyUI (내 PC·서버의 워크플로)']],SW.img)}</select>
       ${SW.img==='comfy'?`<label class="f" for="sw_cfurl">ComfyUI 주소</label><input class="in" id="sw_cfurl" value="${esc(SW.cf.url||'')}" placeholder="http://192.168.0.10:8188">
       <p class="muted" style="margin:4px 0 0">PC에서 ComfyUI를 --listen 옵션으로 켜고, 폰과 같은 와이파이에서 PC의 IP를 넣어요.</p>
       <label class="f" for="sw_cfwf">워크플로 (Export (API) JSON)</label><textarea class="in" id="sw_cfwf" style="min-height:80px">${esc(SW.cf.wf||'')}</textarea>
       <div class="sw-test"><button class="btn sm ghost" data-act="cfload">JSON 파일 불러오기</button><button class="btn sm ghost" data-act="cftest">연결 확인</button><span id="sw_res"></span></div>
       <div class="sw-btns"><button class="btn ghost" data-act="swprev">이전</button><button class="btn" data-act="swnext">다음</button></div>`:`
       <label class="f" for="sw_nai">영구 API 토큰</label><input class="in" id="sw_nai" type="password" autocomplete="off" value="${esc(SW.nai)}" placeholder="pst-...">
       <p class="muted" style="margin:6px 0 0">novelai.net 로그인 → 설정(톱니) → Account → Get Persistent API Token <button class="linkb" data-act="swlink" data-url="https://novelai.net/image">NovelAI 열기</button></p>
       <div class="sw-test"><button class="btn sm ghost" data-act="swtestnai">연결 확인</button><span id="sw_res">${SW.ok.nai?'✓ 연결됨':''}</span></div>
       <div class="sw-btns"><button class="btn ghost" data-act="swprev">이전</button><button class="btn" data-act="swnext">다음</button></div>`}`,
      `<h2>그림체 (선택)</h2><p class="muted">프리셋을 고르거나 직접 적어요. 비워 두면 기본 그림체예요.</p>
       <div class="chips" style="margin:6px 0">${Core.allPresets().map(p=>`<button class="chip ${SW.preset===p.id?'on':''}" data-act="swpreset" data-v="${p.id}">${ArtView.pthumbHTML(p.id,'chip')}${esc(p.name)}</button>`).join('')}</div>
       ${Core.imgReady()||(SW.img==='comfy'?SW.cf.url:SW.nai)?'':'<p style="color:var(--rose);font-size:.85rem">그림 AI를 안 넣었으면 건너뛰어도 돼요.</p>'}
       <label class="f" for="sw_stags">그림체 태그 (쉼표로 구분)</label><textarea class="in" id="sw_stags" style="min-height:90px" placeholder="${esc(STYLE_EX)}">${esc(SW.cst.tags||'')}</textarea>
       <label class="f" for="sw_sneg">빼고 싶은 것 (선택)</label><input class="in" id="sw_sneg" value="${esc(SW.cst.neg||'')}" placeholder="예: 3d, realistic">
       <label class="f" for="sw_auto">AI가 새 스테이지·이벤트·캐릭터를 만들면</label><select class="in" id="sw_auto">${CoreView.opt([['ask','그릴지 물어보기'],['auto','자동으로 그리기'],['off','그리지 않기']],SW.autoArt||Core.naiCfg().autoArt||'ask')}</select>
       <div class="sw-test"><button class="btn sm ghost" data-act="swstytest">시험 그리기</button><span id="sw_sres"></span></div>
       ${SW.stPrev?`<div class="sty-prev"><img src="${SW.stPrev}" alt="시험 그림"></div>`:''}
       <div class="sw-btns"><button class="btn ghost" data-act="swprev">이전</button><button class="btn" data-act="swnext">다음</button></div>`,
      `<h2>목소리·배경음 (선택)</h2>
       <label class="f" for="sw_fish">Fish Audio API 키 (목소리)</label><input class="in" id="sw_fish" type="password" autocomplete="off" value="${esc(SW.fish)}">
       <label class="f" for="sw_el">ElevenLabs API 키 (배경음·효과음)</label><input class="in" id="sw_el" type="password" autocomplete="off" value="${esc(SW.el)}">
       <div class="sw-btns"><button class="btn ghost" data-act="swprev">이전</button><button class="btn" data-act="swnext">다음</button></div>`,
      `<h2>어떤 게임을 만들까요?</h2>
       <ul class="sw-sum"><li class="${a.key||SW.hasAI?'on':''}">${a.key||SW.hasAI?'✓':'–'} 글 AI ${a.key?esc(AITYPE[a.type]):SW.hasAI?'등록됨':'없음'}</li><li class="${SW.img==='comfy'?(SW.cf.url?'on':''):(SW.nai?'on':'')}">${(SW.img==='comfy'?SW.cf.url:SW.nai)?'✓':'–'} 그림 AI ${SW.img==='comfy'?'ComfyUI':'NovelAI'}${(SW.img==='comfy'?SW.cf.url:SW.nai)?'':' 없음'}</li><li class="${SW.fish?'on':''}">${SW.fish?'✓':'–'} 목소리</li><li class="${SW.el?'on':''}">${SW.el?'✓':'–'} 배경음</li></ul>
       <div class="sw-opt ${a.key||SW.hasAI?'':'off'}"><b>✦ AI로 새 게임 만들기</b><span>한 줄만 적거나, 세계관을 직접 적어요.</span>
         ${a.key||SW.hasAI?`<button class="btn block" data-act="swdraft" style="margin-top:10px">새 게임 초안 열기</button>`:`<span class="muted">글 AI 키를 넣으면 쓸 수 있어요. <button class="linkb" data-act="swgo1">키 넣으러 가기</button></span>`}</div>
       <div class="sw-opt"><b>🔗 구독 주소로 받기</b><span>다른 사람이 게시한 게임을 받아서 플레이해요. AI 키가 없어도 돼요.</span><input class="in" id="sw_sub" placeholder="GGMSUB:주인/저장소/브랜치/games/…" autocomplete="off" style="margin-top:8px"><button class="btn ghost block" data-act="swsub" style="margin-top:8px">구독하고 시작</button></div>
       <div class="sw-opt"><b>☆ 샘플 게임 「낙성계약」</b><span>바로 해 볼 수 있는 기본 게임이에요.</span><button class="btn ghost block" data-act="swdone" style="margin-top:10px">샘플로 시작</button></div>
       <div class="sw-btns"><button class="btn ghost" data-act="swprev">이전</button></div>`][st];
    $('#ov').innerHTML=`<div class="setup" data-step="${st}"><div class="sw-bg" style="${ArtView.bgStyle(P().titleBg||'낙성 분화구')}"></div><div class="sw-card"><div class="sw-dots">${dots}</div>${card}</div></div>`;
    if(setupPosition)PlayerView.uiScrollRestore($('#ov'),setupPosition);
  }

  static openShare(){
    const ni=Core.allImgObjs().filter(o=>o.img).length, na=G.lib.filter(l=>l.audio).length;
    CoreView.openModal(`${head('공유 팩 만들기')}
      <p>지금 게임(<b>${esc(G.meta.title)}</b>)의 세계관, ${esc(System.T('crew'))}, 스토리, 배너, 이벤트를 .ggmpack 파일 하나로 묶어요. 큰 그림도 조금씩 나누어 저장해요. 받은 사람은 설정 → 데이터 → 공유 팩 불러오기에서 <b>새 게임으로 추가</b>할 수 있어요.</p>
      <div class="optbox"><label class="f"><input type="checkbox" id="sh_img" checked> 그림 넣기 (${ni}장, 파일이 커져요)</label>
      <label class="f"><input type="checkbox" id="sh_aud"> 배경음·효과음 넣기 (${na}개)</label></div>
      <label class="f"><input type="checkbox" id="sh_gate" checked> 픽업·${esc(System.T('event'))}을 스토리 진행에 맞춰 차례로 열기 <span class="muted" style="font-size:.78rem">(${G.events.length}개 ${esc(System.T('event'))} · ${G.banners.filter(bn=>bn.id!=='std'&&!bn.eventId).length}개 픽업. 끄면 처음부터 모두 열려요)</span></label>
      <p class="muted">그림체: ${String(G.meta.artTags||'').trim()?'게임 정의의 그림체가 들어가요.':'게임 정의에 그림체가 비어 있어서, 지금 설정의 기본 그림체를 넣어 보내요.'} 받은 사람이 새 그림을 그릴 때 이 그림체를 써요.</p>
      <p class="muted">들어가지 않는 것: API 키, NovelAI 토큰, 업데이트 토큰, 내 진행 상황(보유 ${esc(System.T('crew'))}, 재화), 플레이어 이름, 캐릭터 음성과 목소리 ID.</p>
      <p class="muted">작가 이름 태그로 그린 그림이나 실제 성우를 닮은 목소리는 아는 사람끼리만 돌려 보고, 공개 커뮤니티에 올리지 마세요.</p>
      <div class="row" style="margin-top:12px"><button class="btn" data-act="sharego">만들어서 보내기</button></div>`);
  }

  static showPicker(){
    const pj=Core.PJ();
    $('#ov').innerHTML=`<div class="setup"><div class="sw-bg" style="${ArtView.bgStyle(P().titleBg||'')}"></div><div class="sw-card"><div class="sw-logo"><i>GACHA GAME MAKER</i><b>어떤 게임을 할까요?</b></div>
      <div class="pk-list">${pj.list.map(x=>`<button class="pk-g ${x.id===pj.active?'on':''}" data-act="pickgame" data-id="${esc(x.id)}"><b>${esc(x.title)}</b><span>${x.id===pj.active?'마지막으로 한 게임':''}</span></button>`).join('')}</div>
      <label style="display:flex;gap:8px;margin-top:12px;font-size:.85rem"><input type="checkbox" id="pk_last"><span>다음부터 묻지 않고 마지막 게임으로 시작</span></label></div></div>`;
    $('#ov').hidden=false;
  }

  static showStart(){ try{ if(Art.startMode()==='pick'&&Core.PJ().list.length>1&&!sessionStorage.getItem('ggm-picked')){ ArtView.showPicker(); return; } }catch(e){} if(Art.castNeeded()) ArtView.showCast(); else if(Art.bootPrepNeeded()) ArtView.showBootPrep(); else StoryView.showTitle(); }

  static showBootPrep(){
    const all=Art.drawTodo(bootCats().map(x=>x[0])), cnt=k=>all.filter(x=>x.cat===k).length, c=Core.naiCfg();
    if(!BP) BP={cats:new Set(bootCats().filter(x=>x[2]).map(x=>x[0]))};
    $('#ov').innerHTML=`<div class="setup"><div class="sw-bg" style="${ArtView.bgStyle(P().titleBg||'')}"></div><div class="sw-card">
      <div class="sw-logo"><i>BEFORE THE OPENING</i><b>${esc(G.meta.title)}</b></div>
      <p>오프닝 전에 그림부터 준비할까요? 미리 그려 두면 타이틀, 오프닝, 로비가 처음부터 그림으로 채워져요.</p>
      <label class="f" for="bp_tags">이 게임의 그림체 태그 (비우면 기본 그림체)</label><textarea class="in" id="bp_tags" style="min-height:60px" placeholder="${esc(c.styles[0].tags||STYLE_EX)}">${esc(G.meta.artTags||'')}</textarea>
      <div class="prepcats" style="margin-top:10px">${bootCats().map(([k,l])=>cnt(k)?`<label class="pc"><input type="checkbox" data-bpc="${k}" ${BP.cats.has(k)?'checked':''}><b>${esc(l)}</b><span>${cnt(k)}장</span></label>`:'').join('')}</div>
      <p class="muted" style="margin:8px 0 0">한 장에 10~30초쯤 걸려요.${Art.imgProvider()==='nai'?' Opus 구독이면 기본 크기는 Anlas가 들지 않아요.':''} 그리는 도중에도 언제든 시작할 수 있어요.</p>
      <div class="sw-btns bp-btns"><button class="btn" data-act="bpgo">그리고 시작</button><button class="btn ghost" data-act="bpbg">게임하면서 그리기</button></div>
      <button class="linkb" data-act="bpskip" style="margin-top:10px">그림 없이 시작</button>
    </div></div>`;
    $('#ov').hidden=false;
  }

  static bootPrepRun(cats){
    $('#ov').innerHTML=`<div class="setup"><div class="sw-bg" style="${ArtView.bgStyle(P().titleBg||'')}"></div><div class="sw-card">
      <div class="sw-logo"><i>DRAWING</i><b>그림 준비 중</b></div>
      <div class="bp-prev" id="bp_prev"><span>첫 그림을 그리는 중…</span></div>
      <div class="bp-bar"><i id="bp_bar"></i></div><p class="muted" id="bp_lb" style="margin:6px 0 0">준비 중</p>
      <div class="sw-btns"><button class="btn ghost" data-act="bpleave">나머지는 게임하면서 그리기</button></div></div></div>`;
    const upd=(it,j,ph)=>{ const pv=$('#bp_prev'); if(!pv) return; $('#bp_bar').style.width=(j.total?j.done/j.total*100:0)+'%';
      $('#bp_lb').textContent=`${j.done}/${j.total} · ${ph==='done'?'완성: ':'그리는 중: '}${it.label}`;
      if(ph==='done'){ const s=Characters.imgSrc(it.o); if(s) pv.innerHTML=`<img src="${esc(s)}" alt="">`; } };
    CoreCtl.runPrep(cats,null,{fg:true,order:bootCats().map(x=>x[0]),step:upd,done:()=>{ if($('#bp_prev')) setTimeout(StoryView.showTitle,700); }});
  }

  static openLib(kind){
    if(kind==='sfx'){
      const items=G.lib.filter(l=>l.kind==='sfx');
      CoreView.openModal(`${head('효과음',`<span class="muted">${items.filter(l=>l.audio).length}/${items.length}개 등록됨</span>`)}
        ${items.map(l=>`<div class="ep"><span class="t"><b>${esc(l.name)}</b><span class="muted">${l.audio?'등록됨':'미등록'} · ${esc(l.prompt).slice(0,60)}</span></span>${l.audio?`<button class="btn sm ghost" data-act="sfxplay" data-id="${l.id}">▶</button>`:''}<button class="btn sm ghost" data-act="sfxgen" data-id="${l.id}">AI 생성</button><button class="btn sm ghost" data-act="aupload" data-id="${l.id}">파일</button></div>`).join('')}
        <div class="row" style="margin-top:12px"><button class="btn" data-act="sfxall">미등록 전부 AI로 만들기</button></div>
        <p class="muted">ElevenLabs 효과음 생성으로 만들어요. 대본에서는 [효과음: 이름]으로 불러요.</p>`);
      return;
    }
    if(kind==='bgm'){
      const items=G.lib.filter(l=>l.kind==='bgm');
      CoreView.openModal(`${head('배경음',`<span class="muted">${items.filter(l=>l.audio).length}/${items.length}곡 등록됨</span>`)}
        ${items.map(l=>`<div class="ep"><span class="t"><b>${esc(l.name)}</b><span class="muted">${l.audio?'등록됨':'미등록'}${BGM.name===l.name&&!BGM.el.paused?' · 재생 중':''}</span></span>${l.audio?`<button class="btn sm ghost" data-act="bgmplay" data-id="${l.id}" aria-label="재생">▶</button>`:''}<button class="btn sm ghost" data-act="libitem" data-id="${l.id}">편집</button></div>`).join('')}
        <div class="row" style="margin-top:12px"><button class="btn ghost" data-act="bgmstop">정지</button><button class="btn" data-act="libnew" data-k="bgm">곡 추가</button><button class="btn" data-act="bgmall">🎵 한꺼번에 작곡</button></div>
        <p class="muted">Suno, Udio 같은 곳에서 만든 곡도 편집 → 파일 올리기로 넣을 수 있어요.</p>`);
      return;
    }
    const items=G.lib.filter(l=>l.kind===kind);
    CoreView.openModal(`${head(({bg:'배경',prop:'소품',cg:'CG',enemy:'적',icon:'재화 아이콘',map:'작전 지도'})[kind]||kind,`<span class="muted">${items.filter(l=>l.img).length}/${items.length}개 등록됨</span>`)}
      <div class="lgrid" style="margin-top:10px">${items.map(l=>`<button class="lt ${kind}" data-act="libitem" data-id="${l.id}">${Characters.imgSrc(l)?`<img class="art" src="${esc(Characters.imgSrc(l))}" alt="">`:(kind==='bg'?`<div class="bgfill" style="${ArtView.bgStyle(l.name)}"></div>`:`<div class="art ph" style="--ec:var(--brass)"><small>미등록</small></div>`)}<span class="lbl">${esc(l.name)}${l.img?'':' · 미등록'}</span></button>`).join('')}</div>
      <div class="row" style="margin-top:12px">${kind==='enemy'?`<button class="btn ghost" data-act="ailooks">빈 외형 AI로 채우기</button><button class="btn ghost" data-act="ailooksall">외형 전부 세계관에 맞게 다시 쓰기</button>`:''}<button class="btn ghost" data-act="naibatch" data-k="${kind}">미등록 전부 NAI로 그리기</button><button class="btn" data-act="libnew" data-k="${kind}">${({bg:'배경',prop:'소품',cg:'CG',enemy:'적',icon:'재화 아이콘',map:'작전 지도'})[kind]} 추가</button></div>`);
  }

  static drHeroHTML(){ const hr=DR2.hero; return `<p class="muted dr-help">플레이어가 될 주인공이에요. 비워 두면 AI가 세계관에 맞게 정해요(글 AI가 없으면 기본 설정으로 시작해요). 시작한 뒤에는 설정 → 플레이어에서 바꿀 수 있어요.</p>
      <div class="g2"><div><label class="f" for="dr_h_call">호칭 <span class="muted" style="font-size:.75rem">(평소에 불리는 말)</span></label><input class="in" id="dr_h_call" maxlength="12" value="${esc(hr.call||'')}" placeholder="예: 지휘관 · 비우면 AI가 정해요"></div><div><label class="f" for="dr_h_name">이름 <span class="muted" style="font-size:.75rem">(필요할 때만)</span></label><input class="in" id="dr_h_name" maxlength="12" value="${esc(hr.name)}" placeholder="비우면 호칭으로만 불려요"></div></div>
      <label class="f" for="dr_h_gender">당신의 성별은? (직접 쓰기)</label><input class="in" id="dr_h_gender" maxlength="40" value="${esc(hr.gender)}" placeholder="예: 남성, 여성, 논바이너리… 비우면 AI가 정해요">
      <label class="f" for="dr_h_look">외모 (직접 쓰기)</label><textarea class="in" id="dr_h_look" maxlength="400" placeholder="예: 검은 단발, 회색 후드티">${esc(hr.look)}</textarea>
      <label class="f" for="dr_h_bio">설정 (성격·과거·직업·능력 등, 선택)</label><textarea class="in" id="dr_h_bio" maxlength="1500" placeholder="예: 기억을 잃고 이세계에 떨어진 평범한 회사원. 요리를 잘한다.">${esc(hr.bio||'')}</textarea>
      <label style="display:flex;gap:8px;align-items:center;margin-top:8px"><input type="checkbox" id="dr_h_hide" ${hr.hide?'checked':''}><span>앞머리로 눈 가리기 <span class="muted" style="font-size:.8rem">(미연시 주인공처럼)</span></span></label>
      <button class="btn sm ghost" data-act="drpolish" data-k="hero" style="margin-top:8px">✦ AI로 다듬기</button>
      ${Core.imgReady()?`<div class="pf-av"><span id="drAvBox">${hr.av&&DRAVU?`<img src="${esc(DRAVU)}" alt="프로필">`:'<span>프로필 그림 없음</span>'}</span><div class="col"><button class="btn sm" data-act="drpfdraw" ${SAMPLE?'':'disabled'}>${hr.av?'다시 그리기':'외모로 프로필 그리기'}</button><span class="muted" style="font-size:.72rem">안 그리면 게임을 만들 때 외모로 같이 그려요</span></div></div>`:''}`; }

  static drAutoHTML(){ const d=DR2; return `<div class="dr-intro"><p><b>자율주행</b> · 만들고 싶은 게임을 한두 줄로 적어요. 나머지는 AI가 알아서 채워요.</p></div>
      <label class="f" for="dr_auto">어떤 게임을 만들까요?</label><textarea class="in" id="dr_auto" style="min-height:90px" placeholder="예: 미소녀들만 있는 이세계 판타지.">${esc(d.auto)}</textarea>
      <div class="chips" style="margin-top:6px">${['미소녀들만 있는 이세계 판타지.','멸망한 도시의 마지막 용병단.','우주 함대의 함장이 되어 동료를 모으는 SF.','요괴와 계약하는 현대 도시 오컬트.'].map(x=>`<button class="chip" data-act="drautoex" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div>
      <label class="f" for="dr_gtitle">게임 이름 (선택 · 비우면 AI가 지어요)</label><input class="in" id="dr_gtitle" maxlength="30" value="${esc(d.gtitle||'')}" placeholder="예: 심연잔향, 어비스 에코">
      <label class="f" for="dr_crew">아군 호칭 <span class="muted" style="font-size:.75rem">(유닛 이름 · 비우면 AI가 새로 지어요)</span></label><input class="in" id="dr_crew" maxlength="8" value="${esc(d.crewTerm||'')}" placeholder="예: 대원, 요원, 사도">
      <label class="f" for="dr_cast">등장인물 성별</label><select class="in" id="dr_cast">${CoreView.opt([['','AI가 정하기 (키워드에 맞게)'],['f','여성만'],['m','남성만'],['mix','여성 + 남성 혼성']],d.castSex||'')}</select>
      <label class="f" for="ng_n">${esc(d.crewTerm||'동료')} 수</label><select class="in" id="ng_n">${CoreView.opt([[6,'6명'],[8,'8명'],[10,'10명'],[12,'12명']],d.n)}</select>
      <label style="display:flex;gap:8px;align-items:center;margin-top:10px"><input type="checkbox" id="ng_con" ${d.con?'checked':''}><span><b>건조/영입 사용</b> <span class="muted" style="font-size:.8rem">(자원 4종을 넣어 영입 · 특별 의상 바리에이션은 건조로)</span></span></label>
      ${ArtView.drPresetHTML()}
      <details class="optbox" style="margin-top:10px" ${d.hero.name||d.hero.gender||d.hero.look?'open':''}><summary><b>주인공</b> <span class="muted" style="font-size:.8rem">(선택 · 비우면 AI가 정해요)</span></summary>${ArtView.drHeroHTML()}</details>
      <div class="row" style="margin-top:12px"><button class="btn" data-act="drmake" ${SAMPLE?'':'disabled'}>이 내용으로 새 게임 만들기</button></div>
      ${SAMPLE?'':'<p class="muted" style="font-size:.8rem;margin:6px 0 0">글 AI를 등록하면 만들 수 있어요.</p>'}<p class="muted" id="ng_stat" style="margin:6px 0 0"></p><button class="linkb" data-act="ailog" style="margin-top:4px;font-size:.8rem">🔍 AI 기록 보기 (안 만들어질 때 원인 확인)</button>`; }

  static vnCmd(L){
    const a=L.arg;
    if(L.cmd==='분기'){ S.branch=a; return; } // 다음 선택지를 시나리오 분기로 기록(0465-story-plan.js)
    if(ArtView.vnDirectCmd(L)) return; // 연출·스티커·화면 효과(0462)
    if(L.cmd==='배경') SystemView.setVnBg(a);
    else if(L.cmd==='음악') ArtView.bgm(a);
    else if(L.cmd==='CG'||L.cmd==='cg'){ const g=$('#vnCG'); g.innerHTML=ArtView.libArt(a)+'<button class="vn-cgx" data-act="vncgview" type="button">⤢ 크게 보기</button>'; g.hidden=false; g.classList.remove('in'); void g.offsetWidth; g.classList.add('in'); $('#vn').classList.add('cgon'); }
    else if(L.cmd==='CG끝'){ const g=$('#vnCG'); g.hidden=true; g.innerHTML=''; $('#vn').classList.remove('cgon'); }
    else if(L.cmd==='효과음') Art.sfx(a);
    else if(L.cmd==='톡'){ S.phone=a; const ph=$('#vnPhone'); ph.hidden=false; $('#vnPhName').textContent=a; $('#vnPhBody').innerHTML=''; }
    else if(L.cmd==='톡끝'){ S.phone=null; $('#vnPhone').hidden=true; }
    else if(L.cmd==='음악끝') ArtView.bgm(null);
    else if(L.cmd==='소품'||L.cmd==='사진'){const el=$('#vnProp');if(a==='끝')el.hidden=true;else{el.innerHTML=ArtView.libArt(a);el.hidden=false;}}
    else if(L.cmd==='소품끝') $('#vnProp').hidden=true;
    else if(L.cmd==='효과'){const v=$('#vn'),f=$('#vnFlash');
      if(/흔들/.test(a)){v.classList.remove('shake');void v.offsetWidth;v.classList.add('shake');}
      if(/플래시|섬광/.test(a)){f.className='vn-flash';void f.offsetWidth;f.className='vn-flash w';}
      if(/암전/.test(a)){f.className='vn-flash';void f.offsetWidth;f.className='vn-flash b';}}
  }

  static emoteHTML(name,big){ const k=Art.emoKey(name); if(!k) return ''; const l=typeof G!=='undefined'&&G&&G.lib.find(x=>x.kind==='emote'&&x.name===k), s=l&&Characters.imgSrc(l);
    return `<i class="emo ${big?'big':''} e-${EMOTES[k].a}" data-emo="${esc(k)}">${s?`<img src="${esc(s)}" alt="${esc(k)}">`:EMOTES[k].svg}</i>`; }

  static vnScreen(arg){ const v=$('#vn'), el=$('#vnFlash'); if(!v) return; const end=/끝$/.test(arg), key=String(arg).replace(/\s*끝$/,'').replace(/\s+/g,''), k=SCREEN_FX[key]; if(!k) return false;
    if(FX_KEEP.includes(k)){ v.classList.toggle('fx-'+k,!end); return true; }
    if(k==='shake'||k==='shake2'){ v.classList.remove('shake','shake2'); void v.offsetWidth; v.classList.add(k); }
    else { el.className='vn-flash'; void el.offsetWidth; el.className='vn-flash '+k; } return true; }

  static vnDirectCmd(L){ if(L.cmd==='연출'){ const [who,...rest]=String(L.arg).split(/\s+/), slot=CoreView.slotOf(who), d=System.dirSplit(rest.join('|')); CharactersView.vnMotion(slot,d.motion); CoreView.vnEmote(slot,d.emo); return true; }
    if(L.cmd==='스티커'){ if(S.phone){ const body=$('#vnPhBody'); body&&body.insertAdjacentHTML('beforeend',`<div class="msg"><div class="bub sticker">${ArtView.emoteHTML(L.arg,true)}</div></div>`); } else CoreView.vnEmote(S.stage&&S.stage.length?$('#vnChar .vn-slot.speak'):null,Art.emoKey(L.arg)); return true; }
    if(L.cmd==='효과') return ArtView.vnScreen(L.arg); return false; }
}

class Art {
  static ensureLibPromptsPrompt({need}){ return `${World.ctx().slice(0,3000)}\n\n${Core.pf('LIB_ART')}\n${need.map(l=>`- ${l.kind}: ${l.name}`).join('\n')}\nJSON만 출력: {"items":[{"name":"","prompt":""}]}`; }

  static v2GenerateSelectedReasonText({c,r}){ return Core.pf('SKILL_TOO_STRONG',{generation:GGMCombat.generation(c),report:r.report.ratio}); }

  static enemyReuseHint(){ const L=[...new Set(G.lib.filter(l=>l.kind==='enemy'&&!l.alias&&!l.charId&&(l.prompt||l.img)).map(l=>l.name))].slice(-40); return L.length?Core.pf('ENEMY_REUSE',{L:L.join(', ')}):''; }

  static pthumbs(){ try{ return JSON.parse(appStorage.getItem(PTHUMB)||'{}')||{}; }catch(e){ return {}; } }

  static pthumb(id){ const p=Core.userPacks().find(x=>x.id===id); return (p&&p.thumb)||Art.pthumbs()[id]||''; }

  static packApply(p){ if(p.tags!=null||p.neg!=null){ const c=Core.naiCfg(),q=NewGame.presetQualityParts(p); c.styles=[{id:'my_style',name:'내 그림체',tags:q.tags,neg:p.neg||''}]; c.styleId='my_style'; c.qtags='';c.quality=false;c.legacyQualityTags=''; ['steps','scale','cfgRescale','sampler'].forEach(k=>{ if(p[k]!=null&&p[k]!=='') c[k]=p[k]; }); try{ appStorage.setItem(NKEY,JSON.stringify(c)); }catch(e){} } }

    // 초안에서 고른 프리셋을 그림 AI 설정에 바로 적용해요(그림체 태그·네거티브·품질 태그·스텝·가이던스·샘플러)
static presetToCfg(id){ const s=Core.allPresets().find(x=>x.id===id); if(!s) return false; const c=Core.naiCfg(),q=NewGame.presetQualityParts(s); c.styles=[{id:'my_style',name:'내 그림체',tags:q.tags,neg:s.neg}]; c.styleId='my_style'; c.qtags=''; c.quality=false; c.legacyQualityTags=''; c.steps=s.steps; c.scale=s.scale; c.cfgRescale=s.cfgRescale; c.sampler=s.sampler; try{ appStorage.setItem(NKEY,JSON.stringify(c)); }catch(e){ return false; } return true; }

  static naiBase(c){return String((c||Core.naiCfg()).endpoint||NAI_ENDPOINT).trim().replace(/\/ai\/generate-image.*$/,'')||'https://image.novelai.net';}

    /* 글 AI JSON 호출(aiJSON): 실패 문구·재시도 중 알림 줄이기 */
static aiErrText(e){ const base=AIERR[e&&e.code]||'AI 호출에 실패했어요.'; const m=String((e&&e.message)||'').trim(); if(e&&e.code==='origin_block') return base+' '+m; return m?base+' (서버: '+m.slice(0,160)+')':base; }

  static myStyle(){return Core.naiCfg().styles[0];}

  static charCGs(c){return G.lib.filter(l=>l.kind==='cg'&&(l.cast||[]).some(x=>x.id===c.id));}

  static regenWeaponPrompt(prompt){return Core.joinTags('no humans, object focus',Core.tagList(prompt).filter(t=>!(/\b(1girl|1boy|1other|2girls|2boys|solo|holding)\b/i.test(Core.tagKey(t)))).join(', '),'simple background, white background');}

  static regenParseCharacter(c,response,sel){
   const raw=response&&(Array.isArray(response.chars)?response.chars[0]:Array.isArray(response)?response[0]:response);if(!raw||typeof raw!=='object')throw new Error('캐릭터 응답이 객체가 아니에요.');const nc=clone(c);
   const text=(v,label,max=6000)=>{if(typeof v!=='string'||!v.trim())throw new Error(label+' 항목이 비어 있어요.');return v.trim().slice(0,max);};
   if(sel.name){nc.name=text(raw.name,'이름',20);if(typeof raw.faction!=='string')throw new Error('소속을 문자열로 작성해 주세요.');nc.faction=raw.faction.trim().slice(0,100);}
   if(sel.profile){nc.profile=text(raw.profile,'프로필');if(typeof raw.intro==='string')nc.intro=raw.intro.trim().slice(0,1000);if(Array.isArray(raw.files))nc.files=raw.files.filter(x=>x&&typeof x.text==='string'&&x.text.trim()).slice(0,5).map(x=>({dup:num(+x.dup,1,5,1),text:x.text.trim().slice(0,4000)}));}
   if(sel.look){nc.naiPrompt=Characters.allyTags(unFaceless(text(raw.naiPrompt,'외모 태그',4000)));const gender=Core.tagList(c.naiPrompt).find(x=>/^(1girl|1boy|1other)$/i.test(Core.tagKey(x)));if(gender&&!Core.tagList(nc.naiPrompt).some(x=>/^(1girl|1boy|1other)$/i.test(Core.tagKey(x))))nc.naiPrompt=Core.joinTags(gender,nc.naiPrompt);}
   if(sel.weapon){if(!raw.weapon||typeof raw.weapon!=='object')throw new Error('무기 항목이 없어요.');nc.weapon={...clone(c.weapon||{}),name:text(raw.weapon.name,'무기 이름',100),desc:text(raw.weapon.desc,'무기 설명',2000),prompt:Art.regenWeaponPrompt(text(raw.weapon.prompt,'무기 프롬프트',4000))};}
   if(sel.lines){if(!Array.isArray(raw.lines)||!raw.lines.some(x=>typeof x==='string'&&x.trim()))throw new Error('로비 대사가 없어요.');nc.lines=strs(raw.lines).slice(0,12);for(const key of ['lvLines','dupLines'])if(Array.isArray(raw[key]))nc[key]=strs(raw[key]).slice(0,4);if(raw.affLines&&typeof raw.affLines==='object'){nc.affLines={};for(const [key,value] of Object.entries(raw.affLines)){const lv=+key;if(Number.isInteger(lv)&&lv>=1&&lv<=10&&Array.isArray(value))nc.affLines[lv]=strs(value).slice(0,8);}}if(raw.touch&&typeof raw.touch==='object'){nc.touch={...nc.touch};for(const key of ['head','body','pet'])if(Array.isArray(raw.touch[key]))nc.touch[key]=strs(raw.touch[key]).slice(0,8);}}
   return nc;
  }

    // 스탠딩 레퍼런스: 설정에서 켜면 일러스트·CG(+스킬 컷인·상반신)를 그릴 때 그 캐릭터의 스탠딩을 캐릭터 레퍼런스로 넣어 얼굴·머리를 맞춰요(V4.5로 그려요)
static autoRefOn(k){ const m=Core.naiCfg().autoRef; if(Art.imgProvider()==='comfy'||!m||m==='off') return false; return ['illust','lbcg','cg'].includes(k)||(m==='all'&&['scg','upper'].includes(k)); }

  static async naiEmotion(src,emo,extra,level){
    const c=Core.naiCfg(); if(!c.key) throw {code:'nai_nokey'};
    const image=await Core.imgB64(src,832,1216,'#ffffff');
    const r=await System.http(Art.naiBase(c)+'/ai/augment-image',{method:'POST',headers:NAI_HDR(c.key),body:{req_type:'emotion',width:832,height:1216,image,prompt:`${emo};;${extra||''}`,defry:level||0},binary:true,timeout:180000});
    if(r.status>=400||!r.bytes) throw Core.errOf(r);
    let blob=new Blob([await Art.unzipFirst(r.bytes)],{type:'image/png'});
    if(c.cutout) blob=await Core.cutoutWhite(blob);
    return blob;
  }

  static imgType(u8){if(!u8||u8.length<12)return '';if(u8[0]===0x89&&u8[1]===0x50)return 'image/png';if(u8[0]===0xFF&&u8[1]===0xD8)return 'image/jpeg';if(u8[0]===0x52&&u8[1]===0x49&&u8[8]===0x57&&u8[9]===0x45)return 'image/webp';return '';}

  static async naiDecode(u8,ct){
    const t=String(ct||'').split(';')[0].trim().toLowerCase();
    if(/^image\/(png|jpe?g|webp)$/.test(t)) return {bytes:u8,type:t==='image/jpg'?'image/jpeg':t};
    const ty=Art.imgType(u8); if(ty) return {bytes:u8,type:ty};
    const inner=await Art.unzipFirst(u8); return {bytes:inner,type:Art.imgType(inner)||'image/png'};
  }

  static async unzipFirst(u8){
    if(Art.imgType(u8)) return u8;
    const dv=new DataView(u8.buffer,u8.byteOffset,u8.byteLength);
    let e=u8.length-22; while(e>=0&&dv.getUint32(e,true)!==0x06054b50) e--;
    if(e<0) throw {code:'nai_zip'};
    const cd=dv.getUint32(e+16,true); if(dv.getUint32(cd,true)!==0x02014b50) throw {code:'nai_zip'};
    const method=dv.getUint16(cd+10,true), csize=dv.getUint32(cd+20,true), lho=dv.getUint32(cd+42,true);
    const st=lho+30+dv.getUint16(lho+26,true)+dv.getUint16(lho+28,true), data=u8.subarray(st,st+csize);
    if(method===0) return data;
    if(method===8&&typeof DecompressionStream!=='undefined'){ const out=await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer(); return new Uint8Array(out); }
    throw {code:'nai_zip'};
  }

  static async unzipAll(u8){
    if(Art.imgType(u8)) return [u8];
    const dv=new DataView(u8.buffer,u8.byteOffset,u8.byteLength);
    let e=u8.length-22; while(e>=0&&dv.getUint32(e,true)!==0x06054b50) e--;
    if(e<0) throw {code:'nai_zip'};
    const n=dv.getUint16(e+10,true); let cd=dv.getUint32(e+16,true); const out=[];
    for(let k=0;k<n;k++){
      if(dv.getUint32(cd,true)!==0x02014b50) break;
      const method=dv.getUint16(cd+10,true), csize=dv.getUint32(cd+20,true), lho=dv.getUint32(cd+42,true), next=cd+46+dv.getUint16(cd+28,true)+dv.getUint16(cd+30,true)+dv.getUint16(cd+32,true);
      const st=lho+30+dv.getUint16(lho+26,true)+dv.getUint16(lho+28,true), data=u8.subarray(st,st+csize);
      if(method===0) out.push(data);
      else if(method===8&&typeof DecompressionStream!=='undefined') out.push(new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()));
      cd=next;
    }
    if(!out.length) throw {code:'nai_zip'};
    return out;
  }

    /* ---- ComfyUI (local / remote server) ---- */
static imgProvider(){return Core.naiCfg().provider==='comfy'?'comfy':'nai';}

  static comfyCfg(){return Object.assign({url:'',wf:'',timeoutSec:300,qtags:COMFY_TAGS_DEF.qtags,neg:COMFY_TAGS_DEF.neg},Core.naiCfg().comfy||{});}

  static castNeeded(){ const p=P(); return !System.playMode()&&!p.seenOpening&&!p.castDone&&Core.imgReady()&&G.chars.some(c=>c.naiPrompt); }

  static shList(){ try{ const a=JSON.parse(appStorage.getItem(SH_KEY)||'[]'); return Array.isArray(a)?a:[]; }catch(e){ return []; } }

  static shSave(a){ try{ appStorage.setItem(SH_KEY,JSON.stringify(a)); }catch(e){} }

  static async shSrc(x){ if(shCache[x.id]) return shCache[x.id]; try{ const b=await Core.idbGet('shared::'+x.id); if(b) return shCache[x.id]=URL.createObjectURL(b); }catch(e){} return null; }

  static libTarget(l){ return l&&l.alias&&G.lib.find(x=>x.id===l.alias)||l; }

  static async libBlob(l){ const o=Art.libTarget(l); return System.idbGetNS(shAudio(o.kind)?'a_'+o.id:o.id); }

  static async shPut(l){ const b=await Art.libBlob(l); if(!b) return false; const L=Art.shList(), old=L.find(x=>x.kind===l.kind&&x.name===l.name), id=old?old.id:'s'+uid();
    await NewGame.idbPut('shared::'+id,b); if(shCache[id]){ URL.revokeObjectURL(shCache[id]); delete shCache[id]; }
    const it={id,kind:l.kind,name:l.name,prompt:String(Art.libTarget(l).prompt||''),from:G.meta.title,at:Date.now()}; Art.shSave(old?L.map(x=>x===old?it:x):[it,...L]); return true; }

  static async shTake(x,into){ const b=await Core.idbGet('shared::'+x.id).catch(()=>null); if(!b) return null; let l=into||G.lib.find(y=>y.kind===x.kind&&y.name===x.name);
    if(!l){ l={id:'l'+uid(),kind:x.kind,name:x.name,prompt:x.prompt||'',img:null}; G.lib.push(l); } delete l.alias; if(!l.prompt&&x.prompt) l.prompt=x.prompt;
    if(shAudio(x.kind)) await Art.storeAudio(l,b); else await Art.storeImage(l,b); l.shared=x.id; Core.mark('l:'+l.id); return l; }

  static shAdopt(l){ if(!l||l.img||l.audio||l.alias) return; const x=Art.shList().find(y=>y.kind===l.kind&&y.name===l.name); if(x) Art.shTake(x,l).catch(()=>{}); }

    // 대본에 나오는 자료 이름 세기
static libUsage(){ const n={}, add=k=>{ if(k) n[k]=(n[k]||0)+1; }, scan=t=>{ if(!t) return; try{ System.parseScript(t).forEach(L=>{ if(L.type==='cmd') add(L.arg); else if(L.type==='place') add(L.text); }); }catch(e){} };
    G.chapters.forEach(ch=>(ch.stages||[]).forEach(s=>{ scan(s.pre); scan(s.post); })); (G.threads||[]).forEach(t=>scan(t.script)); G.chars.forEach(c=>{ (c.episodes||[]).forEach(e=>scan(e.script)); if(c.memorial) scan(c.memorial.script); Object.values(c.spotTalk||{}).forEach(scan); });
    scan(G.opening&&G.opening.prologue); LiveOps.spots().forEach(s=>add(s.bg)); add(P().titleBg); add(P().lobbyBg); G.lib.filter(l=>l.kind==='cg').forEach(l=>add(l.name)); return n; }

  static libDupes(){ const out=[], seen={}; G.lib.filter(l=>['bg','prop','enemy','icon'].includes(l.kind)&&!l.alias).forEach(l=>{ const k=l.kind+'|'+(String(l.prompt||'').trim().toLowerCase()||'#'+l.name.replace(/\s+/g,'')); if(seen[k]) out.push({keep:seen[k],dup:l}); else seen[k]=l; }); return out; }

  static libMerge(list){ Core.auditSnap(list.map(x=>x.dup),'자료 합치기'); list.forEach(({keep,dup})=>{ dup.alias=keep.id; dup.img=null; Core.mark('l:'+dup.id); }); return list.length; }

  static elUrl(path){ let b=String(Core.SND().elBase||'').trim().replace(/\/+$/,'').replace(/\/v1$/,''); if(b&&!/^https?:\/\//i.test(b)&&/\./.test(b)) b='https://'+b; if(!/^https?:\/\/[^/]+/i.test(b)) b=EL_DEF; return b+path; }

  static async storeAudio(o,blob){ await NewGame.idbPut(IMGNS+'a_'+o.id,blob); if(audioCache[o.id]) URL.revokeObjectURL(audioCache[o.id]); audioCache[o.id]=URL.createObjectURL(blob); o.audio={idb:true}; Core.mark('l:'+o.id); }

  static async elCompose(l){ const s=Core.SND(); if(!s.elKey) throw {code:'el_nokey',message:'설정의 소리에서 ElevenLabs 키를 넣어 주세요'}; const pr=World.bgmPrompt(l); if(!l.prompt){ l.prompt=pr; Core.mark('l:'+l.id); }
    const r=await System.http(Art.elUrl('/v1/music?output_format=mp3_44100_128'),{method:'POST',headers:{'xi-api-key':s.elKey,'Content-Type':'application/json'},body:{prompt:pr,music_length_ms:Math.round(num(s.elLen,10,300,90)*1000),model_id:s.elModel||'music_v1',force_instrumental:true},binary:true,timeout:600000});
    if(r.status>=400||!r.bytes) throw Core.errOf(r); await Art.storeAudio(l,new Blob([r.bytes],{type:'audio/mpeg'})); }

  static sceneBgmName(){ try{ return BGM.want||''; }catch(e){ return ''; } }

  static sfx(name){
    const s=Core.SND(); if(!s.sfxOn) return; const now=Date.now(); if(sfxLast[name]&&now-sfxLast[name]<70) return; sfxLast[name]=now;
    const it=G.lib.find(l=>l.kind==='sfx'&&l.name===name), src=it&&audioCache[it.id]; if(!src) return;
    try{ const a=new Audio(src); a.volume=s.sfxVol; a.play().catch(()=>{}); }catch(e){}
  }

  static imgSrcRaw(o){ if(o&&!o.img&&o.alias&&typeof G!=='undefined'&&G&&G.lib){ const t=G.lib.find(l=>l.id===o.alias); return t&&t!==o&&!t.alias?Characters.imgSrc(t):null; } if(!o||!o.img) return null; if(o.img.asset) return null; if(o.img.idb) return imgCache[o.id]||null; return null; }

  static charSrc(c,face){
    if(c.useStanding===false){const sk=Characters.skinOf(c);if(face){const f=((sk?.upper&&Characters.imgSrc(sk.upper)?sk.faces:c.faces)||[]).find(x=>x.name===face);if(f?.up&&Characters.imgSrc(f.up))return Characters.imgSrc(f.up);}return sk?.upper&&Characters.imgSrc(sk.upper)||c.upper&&Characters.imgSrc(c.upper)||null;}
    const sk=Characters.skinOf(c);
    if(sk&&Core.skinPreviewSrc(c,sk)){ if(face){ const f=(sk.faces||[]).find(x=>x.name===face); if(f&&Characters.imgSrc(f)) return Characters.imgSrc(f); } return Core.skinPreviewSrc(c,sk); }
    if(face){ const f=(c.faces||[]).find(x=>x.name===face); if(f&&Characters.imgSrc(f)) return Characters.imgSrc(f); }
    return Characters.imgSrc(c)||(()=>{ const en=G.lib.find(l=>l.kind==='enemy'&&l.name===c.name); return en?Characters.imgSrc(en):null; })();
  }

  static enemyLib(name){return G.lib.find(l=>l.kind==='enemy'&&l.name===name);}

  static async storeImage(o,blob,prefix){
    if(ASSETS){ const r=await ASSETS.upload(blob); o.img={asset:r.id}; }
    else { await NewGame.idbPut(IMGNS+o.id,blob); if(imgCache[o.id]) URL.revokeObjectURL(imgCache[o.id]); imgCache[o.id]=URL.createObjectURL(blob); o.img={idb:true}; }
    if(o.redraw)delete o.redraw;if(blob&&blob.__seed!=null)o.seed=blob.__seed;else if(blob)delete o.seed;
    Core.mark(prefix+o.id);
  }

  static backupIdentity(g){return {title:String(g.meta?.title||''),ids:(g.chars||[]).map(x=>x.id).sort()};}

  static backupMatches(a,g){const b=Art.backupIdentity(g);return a&&a.title===b.title&&JSON.stringify(a.ids)===JSON.stringify(b.ids);}

  static attachBackupMedia(game,media){const map=new Map(Core.imgObjsOf(game).map(x=>[x.id,x]));for(const item of media?.images||[]){const o=map.get(item.id);if(o){o.img={idb:true};if(item.seed!=null)o.seed=item.seed;}}for(const item of media?.audios||[]){const o=(game.lib||[]).find(x=>x.id===item.id);if(o)o.audio={idb:true};}}

  static async backupImport(file,kind){if(BACKUP_BUSY)return;if(!appStorage.durable){CoreView.toast('이 환경은 안전한 자료 복원을 지원하지 않습니다. 최신 APK에서 다시 시도해 주세요.');return;}BACKUP_BUSY=true;SystemView.backupBusyOverlay(true);const prefix='backup-'+Date.now()+'-'+uid()+'::';let paused=false,restarting=false;const originalProject=Core.PJ().active,originalGame=G;
   try{sessionStorage.setItem('ggm-backup-staging',prefix);CoreView.backupTransferStatus('공유팩·백업 파일 검사 중…');const head=await CoreView.stageBackup(file,prefix);if(Core.PJ().active!==originalProject||G!==originalGame)throw Error('게임이 바뀌었습니다. 다시 선택해 주세요.');if(head.kind==='share'){restarting=await Characters.applySharedArchive(head,prefix)==='reload';return;}if(head.kind!==kind&&!(head.kind==='full'&&kind!=='full'))throw Error(BACKUP_TYPES[head.kind].name+' 파일입니다. 해당 불러오기 버튼을 사용해 주세요.');if(kind!=='assets'&&(!head.game||!Array.isArray(head.game.chars)||!head.game.prog))throw Error('진행 데이터가 없는 파일입니다');if(kind==='assets'&&!Art.backupMatches(head.identity,G))throw Error('현재 게임과 캐릭터 구성이 다른 자료 백업입니다. 같은 게임에서 불러오거나 전체 백업을 사용해 주세요.');
   SystemView.syBar('');SystemView.backupBusyOverlay(false);const identity=JSON.stringify(Art.backupIdentity(G)),confirmText=kind==='assets'?'현재 게임의 이미지·음성을 백업 자료로 바꿉니다. 보유·성장·재화·스토리 진행은 유지됩니다.':kind==='progress'?'현재 게임의 진행·캐릭터 설정을 백업 시점으로 되돌립니다. 현재 기기의 같은 항목에 등록된 이미지·음성은 유지되며, 새 기기에는 자료 백업이 별도로 필요합니다.':'현재 게임을 백업의 진행·이미지·음성으로 복원합니다. 현재 진행 상황이 바뀝니다.';
   if(!await appConfirm(confirmText+'\n계속할까요?'))return;if(identity!==JSON.stringify(Art.backupIdentity(G)))throw Error('게임이 바뀌었습니다. 다시 선택해 주세요.');SystemView.backupBusyOverlay(true);await Core.flush();window.__NOFLUSH=1;paused=true;
   const game=kind==='assets'?JSON.parse(JSON.stringify(G)):Characters.fix(head.game);
   if(kind==='progress'){const old=new Map(Core.imgObjsOf(G).map(x=>[x.id,x]));for(const o of Core.imgObjsOf(game)){const prev=old.get(o.id);o.img=prev?.img?JSON.parse(JSON.stringify(prev.img)):null;if(prev?.seed!=null)o.seed=prev.seed;else delete o.seed;}for(const l of game.lib||[]){const prev=G.lib.find(x=>x.id===l.id);l.audio=prev?.audio?JSON.parse(JSON.stringify(prev.audio)):null;}}
   else Art.attachBackupMedia(game,head.media);
   if(kind==='progress')await appStorage.discard(prefix);
   const registry=Core.PJ(),entry=registry.list.find(x=>x.id===registry.active);if(entry)entry.title=game.meta.title;await appStorage.commitImport(prefix,LKEY,JSON.stringify(game),IMGNS,{[PJKEY]:JSON.stringify(registry)});G=game;dirty.clear();clearTimeout(flushT);for(const k of Object.keys(imgCache)){URL.revokeObjectURL(imgCache[k]);delete imgCache[k];}for(const k of Object.keys(audioCache)){URL.revokeObjectURL(audioCache[k]);delete audioCache[k];}for(const k of Object.keys(chatImgCache)){URL.revokeObjectURL(chatImgCache[k]);delete chatImgCache[k];}await SystemCtl.loadIdbImages();await System.loadAudio();Challenge.render();CoreView.closeModal();CoreView.toast(BACKUP_TYPES[kind].name+'을 불러왔습니다.');
   }catch(e){SystemView.syBar('');CoreView.toast('불러오기 실패: '+(e.message||e)+'. 적용 전 실패한 자료는 현재 저장을 덮어쓰지 않습니다.');}finally{if(paused)window.__NOFLUSH=0;await appStorage.discard(prefix).catch(()=>{});sessionStorage.removeItem('ggm-backup-staging');BACKUP_BUSY=restarting;SystemView.backupBusyOverlay(restarting);SystemView.syBar('');}}

  static addCGs(arr){ let n=0; (Array.isArray(arr)?arr:[]).forEach(x=>{ if(!x||!x.name||G.lib.some(l=>l.name===String(x.name))) return;
      const cast=strs(x.cast).map(nm=>isMe(nm.trim())?{id:'__player'}:Characters.findSpeaker(nm.trim())).filter(Boolean).slice(0,4), pos=cast.length===1?['center']:cast.length===2?['left','right']:['left','center','right','auto'];
      const l={id:'l'+uid(),kind:'cg',name:String(x.name),prompt:String(x.prompt||''),cast:cast.map((c,i)=>({id:c.id,pos:pos[i]||'auto',act:''})),img:null}; G.lib.push(l); Core.mark('l:'+l.id); n++; }); return n; }

  static drawTodo(cats){
    const a=[], on=k=>!cats||cats.includes(k);
    G.chars.forEach(c=>{ if(!c.naiPrompt) return;
      if(on('char')&&c.useStanding!==false&&!c.img) a.push({k:'char',cat:'char',o:c,c,label:c.name+' 스탠딩'});
      if(on('upper')&&c.upper&&!c.upper.img) a.push({k:'upper',cat:'upper',o:c.upper,c,label:c.name+' 상반신'});
      if(cats&&on('pose')&&c.pose&&!c.pose.img) a.push({k:'pose',cat:'pose',o:c.pose,c,label:c.name+' 로비 포즈'});
      const sc=Core.scgOf(c); if(cats&&on('scg')&&!sc.img) a.push({k:'scg',cat:'scg',o:sc,c,label:c.name+' 기술 컷인'}); /* 목록은 읽기 — 그릴 때 runPrep이 scgSlot으로 칸을 맞춤 */
      if(cats&&on('pose')&&c.lbbg&&!c.lbbg.img) a.push({k:'lbbg',cat:'pose',o:c.lbbg,c,label:c.name+' 로비 배경'});
      if(on('illust')&&c.illust&&!c.illust.img) a.push({k:'illust',cat:'illust',o:c.illust,c,label:c.name+' 일러스트'});
      if(on('weapon')&&c.weapon&&!c.weapon.img&&c.weapon.prompt) a.push({k:'weapon',cat:'weapon',o:c.weapon,c,label:c.name+' '+System.T('weapon')}); });
    (G.npcs||[]).forEach(n=>{ if(!n.naiPrompt) return; if(on('char')&&!n.img) a.push({k:'char',cat:'char',o:n,c:n,label:n.name+' (NPC) 스탠딩'}); if(on('upper')&&n.upper&&!n.upper.img) a.push({k:'upper',cat:'upper',o:n.upper,c:n,label:n.name+' (NPC) 상반신'}); });
    if(on('map')) G.chapters.filter(ch=>ch.kind==='main').forEach(ch=>{ if(!Art.chMapLib(ch)){ const o=Art.chMapNew(ch); a.push({k:'map',cat:'map',o,ch,label:o.name}); } }); /* 아직 없는 장 지도는 목록에만 — 그릴 때 runPrep이 ensureChMap으로 넣음 */
    G.lib.forEach(l=>{ if(['bg','prop','cg','enemy','icon','map'].includes(l.kind)&&on(l.kind)&&(!l.img||l.redraw)&&(l.prompt||(l.kind==='cg'&&Core.cgCast(l).length)||l.kind==='prop'||(l.kind==='bg'&&l.auto)||(l.kind==='enemy'&&!l.alias&&!l.charId))) a.push({k:l.kind,cat:l.kind,o:l,label:({bg:'배경 ',prop:'소품 ',cg:'CG ',enemy:'적 ',icon:'',map:''})[l.kind]+l.name}); });
    return a;
  }

  static chMapLib(ch){return G.lib.find(l=>l.kind==='map'&&l.ch===ch.id);}

    /* 장 작전 지도(자료실 map): 새 값(장마다 id 하나 — 목록에서 미리 보여 줄 때도 같은 열쇠) · 쓰기(없으면 넣고 돌려줌 — 지도 편집·그림 등록) */
static chMapNew(ch){return {id:'m_'+ch.id,kind:'map',ch:ch.id,name:ch.title+' 지도',prompt:'ruined city at night, glowing roads, rivers of light, crater, scattered buildings',img:null};}

  static swProfile(){ return Object.assign({},APD,{id:'p'+uid(),name:APD.name||AITYPE[APD.type]}); }

    /* 5돌파 CG를 처음 봄(Model) — 처음이면 true */
static cgFirstSeen(c){ const o=Characters.own(c.id); if(!(o&&o.dup>=5&&o.cgNew&&Art.imgSrcRaw(c.lbcg))) return false; o.cgNew=false; Core.mark('prog'); return true; }

  static startMode(){ try{ return appStorage.getItem('ggm-start')||'last'; }catch(e){ return 'last'; } }

  static bootPrepNeeded(){ const p=P(); return !System.playMode()&&!p.seenOpening&&!p.bootPrep&&Core.imgReady()&&Art.drawTodo(bootCats().map(x=>x[0])).length>0; }

  static async handleSetupAction(a,t,id,p,e){
    switch(a){
  case 'titletap': if(!p.seenOpening&&!p.nameAsked){ p.nameAsked=true; Core.mark('prog'); }
      if(!p.seenOpening) StoryView.playOpening(); else {CoreView.closeOv(); Challenge.render(); MessengerCtl.checkTriggers(); setTimeout(()=>Story.liveTick(false),1200); setTimeout(LiveOps.prepAsk,2600);} break;
  case 'swnext': CoreView.swRead(); if(SW.step===1) Core.swAddAI(); SW.step=Math.min(5,SW.step+1); ArtView.renderSetup(); break;
  case 'swaddai': CoreView.swRead(); if(!Core.swAddAI()){CoreView.toast('키와 모델 정보를 확인해 주세요');break;} APD={id:'',type:APD.type,pub:APD.pub||'google',name:'',region:'global',base:APD.base||'https://openrouter.ai/api/v1'}; SW.ok.ai=false; ArtView.renderSetup(); CoreView.toast('추가했어요. 하나 더 넣거나 다음으로 가세요'); break;
  case 'swprev': CoreView.swRead(); SW.step=Math.max(0,SW.step-1); ArtView.renderSetup(); break;
  case 'swlink': CoreView.openUrl(t.dataset.url); break;
  case 'swskipall': appStorage.setItem(SETUP_KEY,'1'); if(Core.PJ().active!=='main'){ await Core.flush(); const pj=Core.PJ(); if(!pj.list.some(x=>x.id==='main')) pj.list.unshift({id:'main',title:DEFAULT_META.title}); pj.active='main'; appStorage.setItem(PJKEY,JSON.stringify(pj)); SystemView.reloadGame(); break; } SW=null; ArtView.showStart(); break;
  case 'swgo1': CoreView.swRead(); SW.step=1; ArtView.renderSetup(); break;
  case 'swsub': { const a=($('#sw_sub')||{}).value; if(!String(a||'').trim()){ CoreView.toast('구독 주소를 붙여 넣어 주세요'); break; } CoreView.swRead(); Core.swSave(); appStorage.setItem(SETUP_KEY,'1'); try{ sessionStorage.setItem('ggm-picked','1'); }catch(e){} await Art.subscribe(String(a).trim(),CoreView.uiProg(t)); break; }
  case 'swdone': CoreView.swRead(); Core.swSave(); if(Core.PJ().active!=='main'){ appStorage.setItem(SETUP_KEY,'1'); await Core.flush(); try{ sessionStorage.setItem('ggm-picked','1'); }catch(e){} const pj=Core.PJ(); if(!pj.list.some(x=>x.id==='main')) pj.list.unshift({id:'main',title:DEFAULT_META.title}); pj.active='main'; appStorage.setItem(PJKEY,JSON.stringify(pj)); SystemView.reloadGame(); break; } { const v=$('#ng_style')?$('#ng_style').value.trim():''; if(v){ G.meta.artTags=v; Core.mark('meta'); } } appStorage.setItem(SETUP_KEY,'1'); SW=null; Challenge.render(); ArtView.showStart(); CoreView.toast('설정을 저장했어요'); break;
  case 'swstytest': { CoreView.swRead(); Core.swSave(); if(!Core.imgReady()){ CoreView.toast(Core.imgNeed()); break; } const r0=$('#sw_sres'), done=CoreView.busy(t); CoreView.say(r0,'그리는 중… 20초쯤 걸려요');
        try{ const el=await NewGame.naiDraw('char','1girl, solo, long hair, smile, jacket, hand on hip',{styleId:Core.swStyleId()}); if(SW.stPrev) URL.revokeObjectURL(SW.stPrev); SW.stPrev=URL.createObjectURL(el); ArtView.renderSetup(); }
        catch(err){ CoreView.toast(Core.naiErr(err,'시험 그리기 실패')); CoreView.say(r0,''); done(); } break; }
  case 'swtestai': { CoreView.swRead(); const pr=Art.swProfile(), r0=$('#sw_res'); if(!Core.apValid(pr)){CoreView.toast('키를 넣어 주세요');break;} const done=CoreView.busy(t); CoreView.say(r0,'확인 중…');
        try{ const r=await Core.aiOne(Object.assign(pr,{id:'tmp'}),'연결 테스트다. {"ok":true}를 그대로 출력하라.','quick'); SW.ok.ai=!!(r&&r.ok); CoreView.say(r0,SW.ok.ai?'✓ 연결됨':'응답은 왔지만 형식이 달라요'); }
        catch(err){ CoreView.say(r0,'✗ '+Art.aiErrText(err)); } finally{ done(); } break; }
  case 'swtestnai': { CoreView.swRead(); const r0=$('#sw_res'); if(!SW.nai){CoreView.toast('토큰을 넣어 주세요');break;} const done=CoreView.busy(t); CoreView.say(r0,'확인 중…');
        try{ const r=await System.http(Art.naiBase(Core.naiCfg())+'/user/subscription',{headers:NAI_HDR(SW.nai),timeout:20000}); const j=Characters.okJSON(r); SW.ok.nai=true; CoreView.say(r0,`✓ 연결됨 · ${['Paper','Tablet','Scroll','Opus'][j.tier]||'구독'}`); }
        catch(err){ CoreView.say(r0,'✗ '+Core.naiErr(err,'연결 실패')); } finally{ done(); } break; }
  case 'title': StoryView.showTitle(); break;
  case 'swpreset': { CoreView.swRead(); const p=Core.allPresets().find(x=>x.id===t.dataset.v); if(!p) break; SW.preset=p.id; Art.presetToCfg(p.id); SW.cst=Object.assign(SW.cst||{},{tags:NewGame.presetQualityParts(p).tags,neg:p.neg||''}); ArtView.renderSetup(); CoreView.toast(`「${p.name}」 그림체를 골랐어요`); break; }
  case 'sweep': { if(!Economy.stamUse(Characters.stamCost('farm')*(+t.dataset.n||1))) break; const n=+t.dataset.n||1, r0=Characters.rateR(Core.farmReward(t.dataset.k,+t.dataset.lv)), r={}; for(let i=0;i<n;i++){ Economy.giveReward(r0); Economy.bump('battle'); } Object.entries(r0).forEach(([k,v])=>r[k]=v*n); Art.sfx('확인'); CoreView.toast(`소탕 ${n>1?n+'회 ':''}완료: `+Core.rewardText(r)); Challenge.render(); break; }
  case 'swdraft': CoreView.swRead(); Core.swSave(); appStorage.setItem(SETUP_KEY,'1'); StoryView.openDraft(); break;
  case 'swpjdraft': { let g=null; try{ g=JSON.parse(appStorage.getItem(System.pjKey(id))||'null'); }catch(e){} const d=g&&g.meta&&g.meta.draft; if(!d){ CoreView.toast('이 게임에는 저장된 초안이 없어요'); break; } CoreView.swRead(); Core.swSave(); appStorage.setItem(SETUP_KEY,'1'); Story.drLoadFrom(d,(g.meta.title||'')+' 초안'); break; }
  case 'titlesnd': { const s=Core.SND(); s.bgmOn=!s.bgmOn; try{ appStorage.setItem(SKEY,JSON.stringify(s)); }catch(err){} if(s.bgmOn){ BGM.name=null; ArtView.bgm(Story.sceneOf().title); } else ArtView.bgm(null); StoryView.titleSndShow(s.bgmOn); CoreView.toast(s.bgmOn?'배경음을 켰어요':'배경음을 껐어요'); break; }
    }
  }

  static iconLib(k){return G.lib.find(l=>l.kind==='icon'&&l.key===k);}

  static addLib(kind,arr){ let n=0; (Array.isArray(arr)?arr:[]).forEach(b=>{ if(b&&b.name&&!G.lib.some(l=>l.name===String(b.name))){ const l={id:'l'+uid(),kind,name:String(b.name),prompt:String(b.prompt||''),img:null}; G.lib.push(l); Core.mark('l:'+l.id); Art.shAdopt(l); n++; } }); return n; }

  static ensureLibPrompts(){ if(LIBP_JOB) return LIBP_JOB; const need=G.lib.filter(l=>(['prop','bg'].includes(l.kind)||(l.kind==='enemy'&&!l.alias&&!l.charId))&&!l.prompt); if(!need.length) return Promise.resolve();
    LIBP_JOB=(async()=>{ try{ let r=null; if(SAMPLE){ try{ r=await SAMPLE.json(Art.ensureLibPromptsPrompt({need}),{modelTier:'quick',cache:false}); }catch(e){ Core.quietErr(e,'0250-story-factory.js:97'); } }
        need.forEach(l=>{ const x=(r&&Array.isArray(r.items)?r.items:[]).find(y=>y&&y.name===l.name); l.prompt=String((x&&x.prompt)||({bg:'no humans, scenery, ',enemy:'no humans, monster, '})[l.kind]||'no humans, object focus, simple background, ')+(x&&x.prompt?'':l.name); Core.mark('l:'+l.id); }); }
      finally{ LIBP_JOB=null; } })(); return LIBP_JOB; }

  static isMonsterLike(x){ if(!x) return false; const name=String(x.name||'').trim(), t=String(x.role||''), np=String(x.naiPrompt||x.look||'').trim();
    return G.lib.some(l=>l.kind==='enemy'&&!l.charId&&l.name===name&&(/^no humans/i.test(l.prompt||'')||(World.facByName(World.enemyFaction(l))||{}).kind==='monster'))||/^no humans/i.test(np)||/(^|[\s(])(몬스터|괴물|마물|마수|짐승|야수|괴수|언데드|슬라임|기계 병기)/.test(t)||(World.facByName(x.faction)||{}).kind==='monster'; }

  static monsterFromGen(x){ const name=String(x.name||'').trim(); if(!name||G.lib.some(l=>l.kind==='enemy'&&l.name===name)) return; G.lib.push({id:'l'+uid(),kind:'enemy',name,prompt:String(x.naiPrompt||x.look||''),img:null,desc:String(x.profile||x.desc||'').slice(0,200),faction:String(x.faction||'')}); }

  static subBase(repo,branch,dir){ return `https://raw.githubusercontent.com/${repo}/${branch||'main'}/${dir}/`; }

    // 주소 읽기: GGMSUB:주인/저장소/브랜치/폴더, raw.githubusercontent.com/…/manifest.json, github.com/주인/저장소/tree/브랜치/폴더
static subParse(s){ s=String(s||'').trim().replace(/\s+/g,''); let m;
    if((m=s.match(/GGMSUB:([\w.-]+\/[\w.-]+)\/([\w.-]+)\/(.+?)\/?$/))) return Art.subBase(m[1],m[2],m[3]);
    if((m=s.match(/^https?:\/\/raw\.githubusercontent\.com\/([\w.-]+\/[\w.-]+)\/([\w.-]+)\/(.+?)(?:\/manifest\.json)?\/?$/))) return Art.subBase(m[1],m[2],m[3]);
    if((m=s.match(/^https?:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/tree\/([\w.-]+)\/(.+?)\/?$/))) return Art.subBase(m[1],m[2],m[3]);
    return null; }

  static async subscribe(addr,rep){const base=Art.subParse(addr);if(!base){CoreView.toast('게임 구독 주소를 읽지 못했습니다');return;}
   const prefix='subscribe-'+uid()+'::',source=G,project=Core.PJ().active,st=m=>{SystemView.syBar(m);if(rep)rep(m);};
   try{st('게임 정보 받는 중…');const man=JSON.parse(await System.subGet(base,'manifest.json'));if(man?.kind!=='pub')throw Error('게임 구독 주소가 아닙니다');
    const dup=Core.PJ().list.find(x=>x.sub===base);if(dup&&!(await appConfirm(`「${man.title}」은(는) 이미 구독 중이에요. 하나 더 추가할까요?`)))return;
    const game=JSON.parse(await System.subGet(base,'game.json'));if(!Array.isArray(game?.chars))throw Error('캐릭터 자료가 올바르지 않습니다');const id2='g'+uid(),ns=id2+'::';const imap=await Core.subPullImages(base,game,ns,null,st,prefix);delete game.images;
    game.meta=game.meta||{};game.meta.subscr={base,ver:man.ver,title:man.title,at:Date.now(),imgs:imap,notes:man.notes||''};delete game.meta.pub;
    const pr=clone(DEFAULT_PROG);pr.live.on=Object.assign({},pr.live.on,{season:false,event:false,chapter:false,rerun:false,rotate:false,skin:false,talk:false});game.prog=pr;
    if(G!==source||Core.PJ().active!==project)throw Error('작업 중 게임이 바뀌어 구독 적용을 취소했습니다');await Core.flush();const pj=Core.PJ();pj.list.push({id:id2,title:man.title||'구독 게임',sub:base});pj.active=id2;
    await appStorage.commitImport(prefix,System.pjKey(id2),JSON.stringify(game),ns,{[PJKEY]:JSON.stringify(pj)});CoreView.toast('구독 게임을 저장했어요. 다시 시작할게요');setTimeout(()=>SystemView.reloadGame(),900);
   }catch(e){CoreView.toast('구독 실패. '+(e.message||e));}
   finally{await appStorage.discard(prefix).catch(()=>{});SystemView.syBar('');if(rep)rep.end();}
  }

  static emoKey(t){ t=String(t||'').trim(); return EMOTES[t]?t:EMO_ALIAS[t]||''; }
}

class ArtCtl {
  static bgmAllGo(ids){ const items=ids.map(libById).filter(Boolean); if(!items.length){ CoreView.toast('곡을 하나 이상 골라 주세요'); return; } CoreView.closeModal();
    CoreCtl.bgJob('bgmall','배경음 '+items.length+'곡 작곡 중',async j=>{ j.total=items.length; let ok=0; const fail=[];
      for(const l of items){ j.sub=l.name; CoreView.bgJobsDraw(); let done=false; for(let k=0;k<2&&!done;k++){ try{ await Art.elCompose(l); done=true; ok++; }catch(e){ if(e&&(e.code==='el_nokey'||e.code==='bad_key'||e.code==='low_credit'||(e.status===401||e.status===402))){ fail.push(l.name); j.step=items.length; return ok?{title:`배경음 ${ok}곡을 만들었어요`,body:'키나 남은 사용량 문제로 나머지는 만들지 못했어요.'}:null; } if(k) fail.push(l.name); else await wait(3000); } }
        j.step++; CoreView.bgJobsDraw(); if(done&&Art.sceneBgmName()===l.name) ArtView.bgm(l.name); }
      return ok?{title:`배경음 ${ok}곡을 만들었어요`,body:fail.length?'만들지 못한 곡: '+fail.join(', ')+'\n배경음 화면에서 다시 시도할 수 있어요.':'설정 → 자료 → 배경음에서 들어 볼 수 있어요.'}:null; }); }
}
