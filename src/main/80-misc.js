/* ===== misc — 미정(매핑 표에 없는 data만 다루거나 이어진 함수가 없음) — 매핑 표를 채우거나 지울 대상 ===== */
class Misc {
  static scriptFmt(){return `대본은 하나의 문자열이고 줄마다 줄바꿈(\\n)으로 나눈다(쉼표로 잇거나 배열로 쓰지 않는다). 대본 형식(한 줄에 하나): "이름: 대사" / 표정을 바꾸려면 "이름[표정]: 대사" (표정은 각 캐릭터의 표정 목록에서 고른다. 목록이 없는 캐릭터는 ${FACE_BASIC.join('·')} 중에서) / 그 외 문장은 나레이션 / [배경: 배경이름]은 배경 전환 / [장소이름]은 장소 자막과 배경 전환 / [소품: 소품이름]은 소품 클로즈업, [소품 끝]으로 닫음 / ${DIRECTION_GUIDE} / [효과음: 이름] / [음악: 음악이름]은 배경음 전환, [음악 끝]은 정지 / [톡: 캐릭터이름]부터 [톡 끝]까지는 휴대폰 메신저 화면으로 대화가 진행되는 장면 / [CG: CG이름]은 일러스트 한 장을 화면 가득 보여 주고, [CG 끝]으로 닫음 / "선택: 보기1 | 보기2"는 플레이어 선택지이고, 이어지는 줄 앞에 "1) "이나 "2) "를 붙이면 그 선택을 했을 때만 나온다. 플레이어 대사는 "${System.T('player')}: "로 쓰고, 플레이어를 부를 때는 보통 호칭 "${System.T('player')}"을 그대로 쓰며, 이름을 불러야 할 때만 {${System.T('player')}}으로 쓴다. 배경, 소품, 음악, 효과음은 가능한 한 기존 목록의 이름을 그대로 쓴다. 기존 인물이 적으로 나오거나 적이었던 인물이 동료가 되면 이름을 바꾸지 않고 같은 이름을 그대로 쓴다(그림이 이어지도록).`;}

  static threadFmt(){return `메신저 형식(한 줄에 하나): "캐릭터이름: 메시지" / "선택: 답장1 | 답장2"는 플레이어 답장 선택지(고른 답장이 전송됨). 플레이어의 말은 반드시 선택지로만 쓰고 "나: 메시지"처럼 플레이어 대사를 직접 쓰지 않는다(플레이어가 멋대로 말하면 안 된다). 선택지 없이 플레이어 반응이 필요하면 선택지 1개짜리로 쓴다, 이어지는 줄 앞에 "1) " 같은 번호를 붙이면 그 답장을 골랐을 때만 나온다 / [사진: 소품 또는 배경 이름]은 사진 전송 / [스티커: 하트|땀|화남|놀람|의문|음표|눈물|홍조|반짝]은 감정 스티커(가끔만). 실제 메신저처럼 짧은 메시지를 여러 번 나눠 보내고, ㅋㅋ와 이모지를 써도 된다. 세계관과 메인 스토리의 사건, 떡밥을 자연스럽게 언급한다.`;}

  static aiOneP2Text({prompt}){ return prompt+Core.pf('JSON_ONLY_SUFFIX'); }

  static illustrationScenePreparationPurposeText({kind}){ return kind==='lbcg'?`${System.T('limit')}를 끝까지 해서 플레이어와 가장 가까워진 순간을 담은 특별 일러스트. 감정이 터지는 한 장면, 드라마틱한 빛과 배경`:'로비와 타이틀·픽업 화면에 쓸 대표 일러스트. 캐릭터의 개성과 세계관이 드러나는 배경'; }

  static drPolishWhatText({k}){ return k==='world'?'게임 세계관':k==='story'?'스토리 개요':'게임 설정(세력·용어·규칙·비밀)'; }

  static faceDrawOneEmphText({ew,ft}){ return `${ew}::${ft}::, 1.2::expressive face::`; }

    /* src/main/0270-skin-proposal.js */
static skinLinesAIPrompt({c,k}){ return `${Core.pf('SKIN_LINES',{RULES,ctx:World.ctx(),crew:System.T('crew'),name:c.name,name2:k.name,skin:System.T('skin'),idea:String(k.idea||k.prompt||'').slice(0,200),lines:(c.lines||[]).slice(0,3).map(x=>'"'+x+'"').join(' / ')})}\nJSON만 출력: {"lines":["대사 6개"],"intro":"이 ${System.T('skin')}을 처음 입었을 때 한마디"}`; }

  static aiJSONSkillPromptText({prompt}){ return String(prompt).includes('\"skills\"')&&!String(prompt).includes('스킬 JSON은 skills:')?prompt+'\n스킬 작성 규칙: '+Core.pf('SKILL_RULE',GGMCombat.promptData()):prompt; }

  static personaAIReviewPrompt({c}){ return `${Core.pf('PERSONA_REVIEW',{RULES,ctx:World.ctx(),crew:System.T('crew'),name:c.name,profile:String(c.profile||'').slice(0,500),persona:JSON.stringify(c.persona||{}),lines:(c.lines||[]).slice(0,8).join(' / ')})}JSON만 출력: {"score":0~100,"strengths":["2~3개"],"weaknesses":["2~3개"],"suggestions":["바로 고칠 수 있는 구체적인 제안 3개"]}`; }

  static smFocused(c,text){return !!text&&[c.name,c.id].some(n=>n&&String(text).includes(n));}

  static smProfile(c,text){return String(c.profile||'').slice(0,text?(Misc.smFocused(c,text)?1000:150):80);}

  static smVoice(c,text){return Misc.smFocused(c,text)?(c.lines||[]).slice(0,3).map(x=>String(x).slice(0,150)).join(' / '):String(c.lines?.[0]||'').slice(0,40);}

  static smRelationRows(rows){let used=0;const out=[];for(const r of rows){const line=Misc.relLine(r);if(used+line.length>SM_LIMITS.relations)continue;used+=line.length;out.push(line);}return out.join('\n');}

  static normBase(b){ let s=String(b||'').trim().replace(/\/+$/,'').replace(/\/chat\/completions$/i,'').replace(/\/+$/,'');
    try{ const u=new URL(s); if(/^(www\.)?ollama\.com$/i.test(u.hostname)) return 'https://ollama.com/v1';
      if(u.port==='11434'&&!/\/v1$/.test(u.pathname)) return u.origin+'/v1'; }catch(e){} return s; }

  static async thumbData(file){ const b=await Core.shrink(file,160); return await new Promise(r=>{ const fr=new FileReader(); fr.onload=()=>r(fr.result); fr.readAsDataURL(b); }); }

  static naiQuality(c,model){return String(c.qtags||'').trim()||NAI_QUALITY[model]||'';}

  static regenCancelJob(){const job=REGEN_JOB;REGEN_JOB=null;if(job){job.controller.abort();clearInterval(job.timer);}}

  static ultimateSceneSnapshot(c){return JSON.stringify([v2Kit(c).ultimate,c.name,c.faction,c.profile,c.naiPrompt,c.weapon?.name,c.weapon?.desc,c.weapon?.prompt,c.scg]);}

  static async alphaBorder(blob){
    try{ const bmp=await createImageBitmap(blob), W=bmp.width, H=bmp.height, cv=document.createElement('canvas'); cv.width=W; cv.height=H;
      const x=cv.getContext('2d',{willReadFrequently:true}); x.drawImage(bmp,0,0); const d=x.getImageData(0,0,W,H).data; let n=0,t=0;
      const at=(px,py)=>{n++; if(d[(py*W+px)*4+3]<24) t++;};
      for(let i=0;i<W;i+=3){at(i,0);at(i,H-1);} for(let j=0;j<H;j+=3){at(0,j);at(W-1,j);}
      return n?t/n:0; }catch(e){ return 0; }
  }

  static sdTags(s){return String(s||'').replace(/(-?\d+(?:\.\d+)?)::\s*([^:]+?)\s*::/g,(m,w,t)=>`(${t}:${(+w).toFixed(2)})`);}

  static comfyBind(wf,v){
    const tt=id=>String((wf[id]._meta&&wf[id]._meta.title)||'').trim().toLowerCase();
    const by=t=>Object.keys(wf).filter(id=>tt(id)==='[ggm:'+t+']'||tt(id)==='[assetmaid:'+t+']');
    let P=by('positive'), N=by('negative'), S=by('size'), SD=[...by('seed'),...by('seed-progress')]; const O=by('output');
    const ks=Object.keys(wf).find(id=>/KSampler|SamplerCustom/i.test(wf[id].class_type||''));
    if(ks){ const k=wf[ks].inputs||{};
      if(!P.length&&Array.isArray(k.positive)) P=[String(k.positive[0])];
      if(!N.length&&Array.isArray(k.negative)) N=[String(k.negative[0])];
      if(!S.length&&Array.isArray(k.latent_image)) S=[String(k.latent_image[0])];
      if(!SD.length) SD=[ks]; }
    if(!P.length) throw {code:'comfy_wf',message:'프롬프트를 넣을 노드를 찾지 못했어요. 프롬프트 노드 제목을 [GGM:positive]로 바꿔 주세요.'};
    const setT=(id,val)=>{const inp=(wf[id]||{}).inputs; if(!inp) return; const k=['text','value','string','prompt','text_g'].find(k=>k in inp&&!Array.isArray(inp[k]))||['text','value'].find(k=>k in inp)||'text'; inp[k]=val; if('text_l' in inp&&!Array.isArray(inp.text_l)) inp.text_l=val;};
    P.forEach(id=>setT(id,v.pos)); N.forEach(id=>setT(id,v.neg));
    S.forEach(id=>{const inp=(wf[id]||{}).inputs||{}; if('width' in inp) inp.width=v.w; if('height' in inp) inp.height=v.h;});
    SD.forEach(id=>{const inp=(wf[id]||{}).inputs||{}; const k=['seed','noise_seed','value'].find(k=>k in inp&&!Array.isArray(inp[k])); if(k) inp[k]=v.seed;});
    return O[0]||null;
  }

  static artKey(it){return it.k+':'+((it.o&&it.o.id)||'')+':'+((it.c&&it.c.id)||'');}

  static castFaceOpt(){ const cm=Core.naiCfg().model||NAI_DEF.model; return {m:'inpaint',model:/^nai-diffusion-5/.test(cm)?cm:'nai-diffusion-5-full',ref:false,lv:1}; }

  static async *backupLines(file){const decoder=new TextDecoder();let carry='';for(let p=0;p<file.size;p+=262144){carry+=decoder.decode(await file.slice(p,p+262144).arrayBuffer(),{stream:true});let n;while((n=carry.indexOf('\n'))>=0){const line=carry.slice(0,n);carry=carry.slice(n+1);if(line.trim())yield JSON.parse(line);}if(carry.length>134217728)throw Error('백업 항목이 너무 큽니다');}carry+=decoder.decode();if(carry.trim())yield JSON.parse(carry);}

    // Incremental legacy JSON reader: retain one game object or one media string, never the entire GB archive.
static async *legacyBackupEntries(file){
   const decoder=new TextDecoder('utf-8',{fatal:true});let buffer='',position=0,offset=0,yieldAt=0;
   async function fill(){
    if(position>0){buffer=buffer.slice(position);position=0;}if(offset>=file.size)return false;
    const end=Math.min(file.size,offset+262144);buffer+=decoder.decode(await file.slice(offset,end).arrayBuffer(),{stream:end<file.size});offset=end;
    if(offset-yieldAt>=1048576){yieldAt=offset;CoreView.backupTransferStatus(`이전 JSON 읽는 중 · ${(offset/1048576).toFixed(1)} / ${(file.size/1048576).toFixed(1)} MiB`);await new Promise(resolve=>setTimeout(resolve,0));}return true;
   }
   async function peek(){while(position>=buffer.length){if(!await fill())return '';}return buffer[position];}
   async function ws(){while(true){while(position<buffer.length&&/\s/.test(buffer[position]))position++;if(position<buffer.length||!await fill())return;}}
   async function expect(c){await ws();if(await peek()!==c)throw Error('손상되었거나 끝이 잘린 JSON 파일입니다');position++;}
   async function value(){
    await ws();if(!await peek())throw Error('JSON 파일이 중간에 끝났습니다');
    const pieces=[];let size=0,depth=0,string=false,escape=false,started=false,done=false;
    while(!done){const start=position;
     while(position<buffer.length){const c=buffer[position];if(!string&&depth===0&&started&&/[},\]\s]/.test(c)){done=true;break;}position++;started=true;
      if(string){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"'){string=false;if(depth===0){done=true;break;}}}
      else if(c==='"')string=true;else if(c==='{'||c==='[')depth++;else if(c==='}'||c===']'){depth--;if(depth===0){done=true;break;}}
     }
     size+=position-start;if(size>134217728)throw Error('JSON의 단일 항목이 너무 큽니다. 이미지를 더 작게 만든 공유팩을 사용해 주세요.');pieces.push(buffer.slice(start,position));
     if(!done&&position>=buffer.length&&!await fill()){if(string||depth!==0)throw Error('JSON 파일이 중간에 끝났습니다. 원본 파일을 다시 전송해 주세요.');done=true;}
    }
    return JSON.parse(pieces.join(''));
   }
   const keys=new Set();await expect('{');await ws();if(await peek()==='}'){position++;return;}
   while(true){const key=await value();if(typeof key!=='string'||keys.has(key))throw Error('중복되거나 올바르지 않은 JSON 항목입니다');keys.add(key);await expect(':');
    if(['images','audios','voices'].includes(key)){await expect('{');await ws();if(await peek()!=='}'){const ids=new Set();while(true){const id=await value();if(typeof id!=='string'||ids.has(id))throw Error('중복되거나 올바르지 않은 자료 ID입니다');ids.add(id);await expect(':');yield {group:key,key:id,value:await value()};await ws();if(await peek()!==',')break;position++;}}await expect('}');}
    else yield {group:'root',key,value:await value()};await ws();const c=await peek();if(c==='}'){position++;break;}await expect(',');
   }
   await ws();if(await peek())throw Error('JSON 끝에 잘못된 데이터가 있습니다');
  }

  static flushNow(){if(dirty.size){clearTimeout(flushT);Core.flush().catch(()=>{});}}

  static writeKey(k,game=G){
    const ref=id=>DB.doc(BASE+'/'+id);
    const put=(pre,arr,id,doc)=>{const o=arr.find(x=>x.id===id);return o?ref(doc).set(clone(o)):ref(doc).delete();};
    if(k==='meta') return ref('meta').set({ver:VER});
    if(k==='world') return ref('world').set(clone(game.world));
    if(k==='opening') return ref('opening').set(clone(game.opening));
    if(k==='prog') return ref('progress').set(clone(game.prog));
    if(k.startsWith('c:')){const id=k.slice(2);return put('c',game.chars,id,'c_'+id);}
    if(k.startsWith('ch:')){const id=k.slice(3);return put('ch',game.chapters,id,'ch_'+id);}
    if(k.startsWith('l:')){const id=k.slice(2);return put('l',game.lib,id,'l_'+id);}
    if(k.startsWith('t:')){const id=k.slice(2);return put('t',game.threads,id,'t_'+id);}
  }

    /* 행동력 회복 규칙: 마지막 회복 뒤 STAM_MS마다 1씩 cap까지, 가득 차 있으면 시각만 지금으로 — 진행 칸 stam의 정의(0070 PROG_SLOTS)가 부름 */
static stamRegen(s,cap){ const now=Date.now(); if(s.v>=cap){ s.at=now; return s; } const n=Math.floor((now-s.at)/STAM_MS); if(n>0){ s.v=Math.min(cap,s.v+n); s.at=s.v>=cap?now:s.at+n*STAM_MS; } return s; }

  static skinLinesAI(c,k,rep){ return SkinLinesGen.run({c,k,rep}); }

  static personaAIReview(c,rep){ return PersonaReviewGen.run({c,rep}); }

    /* 스레드 기록(Model): 말 하나 더하기 · 끝냄(인연 +10) */
static thrLogAdd(s,entry){ entry.at=Date.now(); s.log.push(entry); s.at=entry.at; Core.mark('prog'); }

  static thrDone(c,s){ s.done=true; s.at=Date.now(); Core.mark('prog'); if(Characters.own(c.id)) CoreCtl.addAff(c,10); }

    // 한 항목 고치기 — 점검 화면의 일괄 고치기(auditFix)와 실행 중 자동 채움(liveFill, 0537)이 같이 씀. 고쳤으면 true
  // 규칙 고치기 중 글 AI로 더 잘 채울 수 있는 것(fix.ai — 일정 장소는 AI가 좋아하는 것 태그까지 붙여 "좋아하는 장소 ♥"가 맞음)은 AI가 있으면 AI로, 없거나 실패하면 규칙으로
static async auditAutoRun(rule,o){ if(SAMPLE&&rule.fix.ai){ try{ if(await rule.fix.ai(o)) return; }catch(e){ Core.quietErr(e,'auditAutoRun'); } } rule.fix.run(o); }

    /* 건조/영입 자원 칸 형식 맞춤(자원 4종 — 없거나 음수면 0) — 진행 칸 cres의 정의(0070 PROG_SLOTS)가 부름 */
static cresFill(c){ CON_RES.forEach(k=>{ if(!(c[k]>=0)) c[k]=0; }); return c; }

  static relLine(r){ const last=(r.hist||[]).slice(-4).map(h=>(h.src?h.src+': ':'')+h.text).join(' / '); return `- ${Core.relName(r.a)} ↔ ${Core.relName(r.b)}: [${r.kind||'아는 사이'}] ${r.note||''}${last?' (최근: '+last+')':''}`; }

  static async sha256hex(text){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');}
}

class MiscView {
  static naiBlocksEditable(e){
   if(!e.matches('textarea,input')||e.type==='password'||e.type==='hidden'||e.dataset.naiPart)return false;
   if(e.dataset.naiCharacter==='true')return true;
   if(e.matches('#f_nai,#rg_e_look,#sk_prompt,[id^="np_cc"],#pf_nai,[data-nf="naiPrompt"],[data-dc="tags"],[data-skin-prompt]'))return true;
   if(e.id==='np_in')return !!NPREP&&['char','illust','lbcg'].includes(NPREP.k)||NPREP?.k==='enemy';
   if(e.dataset.candidateField==='prompt')return typeof IMAGE_CANDIDATES!=='undefined'&&IMAGE_CANDIDATES?.config?.promptBlocks===true;
   if(e.id==='li_prompt')return e.closest('.sheet')?.querySelector('[data-act=savelib]')?.dataset.k==='enemy';
   return false;
  }

  static naiBlocksScan(root=document){for(const e of root.querySelectorAll('textarea,input'))CoreView.naiBlocksMount(e);}

  static regenProgress(job,event){if(REGEN_JOB!==job)return;job.status=event.text||String(event);if(event.kind&&event.kind!=='phase')job.history.push(event);const log=document.getElementById('regen-job-log');if(log){log.hidden=!job.history.length;log.innerHTML=v2GenerationHistoryHTML(job.history);}}

    /* 그림 생성 결과 창 내용(View) */
static naiResultHTML(o,op,k,url,job){ return `${head('생성 결과',`<span class="muted">${esc(o.name)} · ${esc(op.usedModel)} · 시드 ${op.usedSeed}${op.usedTp?' · 투명 배경':''}</span>`)}<div class="naiprev ${k} done"><img src="${url}" alt="${esc(o.name)}" data-original-src="${esc(job.originalSrc)}"></div>
      <div class="row" style="margin-top:12px"><button class="btn" data-act="naiuse">이걸로 등록</button><button class="btn ghost" data-act="naiagain">다시 뽑기</button><button class="btn ghost" data-act="naiedit">설정 고치기</button></div>`; }

    /* 그리는 중 창 내용(View) */
static naiDrawingHTML(o,k){ return `${head('그리는 중',`<span class="muted">${esc(o.name)}</span>`)}<div class="naiprev ${k}"><div class="spin"></div></div><p class="muted" id="nai_stat" style="text-align:center">보통 10~30초 걸려요. 창을 닫으면 결과를 버려요.</p>`; }

    /* IMAGE_CANDIDATES_MODULE */
  /* Generated-image gallery. Images are borrowed; no draft or selection is changed here. */
static imagePreviewClose(){const view=document.getElementById('generated-image-preview');if(!view)return false;view._cleanup?.();const focus=view._returnFocus;view.remove();if(focus?.isConnected)focus.focus({preventScroll:true});return true;}

  static imagePreviewOpen(src,alt,options={}){
   if(!src)return;const old=document.getElementById('generated-image-preview'),focus=old?old._returnFocus:document.activeElement;MiscView.imagePreviewClose();
   const items=options.items?.length?options.items.map(x=>typeof x==='string'?{url:x}:x):[{url:src,alt}],original=options.originalSrc||'';
   let index=Math.max(0,Math.min(items.length-1,Number.isInteger(options.index)?options.index:items.findIndex(x=>x.url===src))),comparing=false,flashTimer;
   const view=document.createElement('div');view.id='generated-image-preview';view.tabIndex=-1;view.setAttribute('role','dialog');view.setAttribute('aria-modal','true');view.setAttribute('aria-label','생성 이미지 크게 보기');view._returnFocus=focus;
   view.style.cssText='position:fixed;inset:0;z-index:26000;background:#000;display:flex;flex-direction:column;padding:env(safe-area-inset-top,0px) 10px env(safe-area-inset-bottom,0px);touch-action:none;overscroll-behavior:contain;user-select:none';
   view.innerHTML=`<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:56px;flex:none"><span data-preview-counter role="status" aria-live="polite" style="color:white;padding:8px"></span><button type="button" class="btn sm ghost" data-preview-action="compare" ${original?'':'disabled'} title="${original?'누르는 동안 기존에 등록된 이미지를 표시합니다':'기존에 등록된 이미지가 없습니다'}" style="flex:none;touch-action:none;transform:translate(-12px,8px)">기존 이미지 보기</button></div><div data-preview-stage style="position:relative;flex:1;min-height:0;width:100%;overflow:hidden"><img data-preview-image draggable="false" style="display:block;width:100%;height:100%;object-fit:contain;pointer-events:none"><span data-preview-label hidden style="position:absolute;top:8px;left:50%;transform:translateX(-50%);background:#000b;color:white;padding:4px 12px;pointer-events:none">기존 이미지</span><button type="button" data-preview-action="previous" aria-label="이전 이미지" style="position:absolute;left:0;top:0;bottom:0;width:50%;background:transparent;border:0;padding:0"></button><button type="button" data-preview-action="next" aria-label="다음 이미지" style="position:absolute;right:0;top:0;bottom:0;width:50%;background:transparent;border:0;padding:0"></button></div><div style="display:flex;justify-content:flex-end;align-items:center;min-height:60px;flex:none"><button type="button" class="btn sm" data-preview-action="close" style="flex:none;transform:translate(-12px,-8px)">닫기</button></div>`;
   const img=view.querySelector('[data-preview-image]'),counter=view.querySelector('[data-preview-counter]'),label=view.querySelector('[data-preview-label]'),compare=view.querySelector('[data-preview-action=compare]'),stage=view.querySelector('[data-preview-stage]');
   function paint(){img.src=comparing?original:items[index].url;img.alt=comparing?'기존에 등록된 이미지':items[index].alt||alt||'생성된 이미지';counter.textContent=(index+1)+'/'+items.length;label.hidden=!comparing;view.dataset.index=String(index);view.dataset.comparing=String(comparing);compare.setAttribute('aria-pressed',String(comparing));}
   function hold(e){if(!original)return;e?.preventDefault();comparing=true;paint();if(e?.pointerId!=null)try{compare.setPointerCapture(e.pointerId);}catch(_){} }
   function release(){if(!comparing)return;comparing=false;paint();}
   function flash(side){stage.querySelector('[data-preview-edge]')?.remove();clearTimeout(flashTimer);const edge=document.createElement('div');edge.dataset.previewEdge=side;edge.style.cssText='position:absolute;top:0;bottom:0;width:33%;pointer-events:none;opacity:.3;'+side+':0;background:linear-gradient(to '+(side==='left'?'right':'left')+',rgba(255,255,255,1) 0%,rgba(255,255,255,.45) 45%,rgba(255,255,255,0) 100%)';stage.append(edge);if(edge.animate)edge.animate([{opacity:0},{opacity:.35,offset:.25},{opacity:0}],{duration:300,fill:'forwards'});flashTimer=setTimeout(()=>edge.remove(),320);}
   function move(delta){if(comparing)return;const next=index+delta;if(next<0||next>=items.length){flash(delta<0?'left':'right');return;}index=next;paint();}
   view._move=move;view._cleanup=()=>{clearTimeout(flashTimer);window.removeEventListener('blur',release);document.removeEventListener('visibilitychange',release);};
   for(const event of ['pointerdown','touchstart'])compare.addEventListener(event,hold,{passive:false});
   for(const event of ['pointerup','pointercancel','lostpointercapture','pointerleave','touchend','touchcancel'])compare.addEventListener(event,release);
   compare.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter')hold(e);});compare.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter')release();});compare.addEventListener('contextmenu',e=>e.preventDefault());compare.addEventListener('blur',release);window.addEventListener('blur',release);document.addEventListener('visibilitychange',release);
   view.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();const action=e.target.closest('[data-preview-action]')?.dataset.previewAction;if(action==='close')MiscView.imagePreviewClose();else if(action==='previous')move(-1);else if(action==='next')move(1);});
   view.addEventListener('wheel',e=>e.preventDefault(),{passive:false});view.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});paint();document.body.append(view);view.focus({preventScroll:true});
  }

  static imagePreviewThumbnail(img){
   if(img.closest('#image-candidate-dialog')&&IMAGE_CANDIDATES){const d=IMAGE_CANDIDATES,index=[...document.querySelectorAll('.image-candidate-grid img')].indexOf(img);MiscView.imagePreviewOpen(img.currentSrc||img.src,img.alt,{items:d.items.map((x,i)=>({url:x.url,alt:'후보 '+(i+1)})),index,originalSrc:d.config.originalSrc});return;}
   MiscView.imagePreviewOpen(img.currentSrc||img.src,img.alt,{originalSrc:img.dataset.originalSrc||''});
  }

  static imageCandidateBack(){if(MiscView.imagePreviewClose())return true;if(!IMAGE_CANDIDATES)return false;IMAGE_CANDIDATES.back();return true;}

    // Lock only the page/sheets below the top image dialog; keep its own scroll usable.
static imageScrollGuard(){
   const locks=new Map();let savedPage=null,touch=null;
   const top=()=>document.getElementById('app-confirm-dialog')||document.getElementById('generated-image-preview')||document.getElementById('image-candidate-dialog')||document.getElementById('v2-icon-dialog')||(()=>{const m=document.getElementById('modal');return m&&!m.hidden&&m.querySelector('.naiprev,#np_in,#cutCv,.skp-img,.preset-code-sheet')?m:null;})();
   function sync(){if(typeof document==='undefined'||!document?.body)return;const root=top(),targets=root?[document.documentElement,document.body,...document.querySelectorAll('#app main,#modal>.sheet,#v2-icon-dialog>.sheet,#image-candidate-dialog>.sheet')].filter(el=>!root.contains(el)):[];
    for(const [el,old]of locks)if(!targets.includes(el)){for(const [k,v,priority]of old.styles){if(v)el.style.setProperty(k,v,priority);else el.style.removeProperty(k);}el.scrollTop=old.y;el.scrollLeft=old.x;locks.delete(el);}
    if(root&&!savedPage){savedPage={x:window.scrollX,y:window.scrollY,styles:['position','top','left','width'].map(k=>[k,document.body.style.getPropertyValue(k),document.body.style.getPropertyPriority(k)])};document.body.style.position='fixed';document.body.style.top=-savedPage.y+'px';document.body.style.left=-savedPage.x+'px';document.body.style.width='100%';}
    for(const el of targets)if(!locks.has(el)){locks.set(el,{styles:['overflow','overscroll-behavior'].map(k=>[k,el.style.getPropertyValue(k),el.style.getPropertyPriority(k)]),x:el.scrollLeft,y:el.scrollTop});el.style.setProperty('overflow','hidden');el.style.setProperty('overscroll-behavior','none');}
    if(!root&&savedPage){const old=savedPage;savedPage=null;for(const [k,v,p]of old.styles){if(v)document.body.style.setProperty(k,v,p);else document.body.style.removeProperty(k);}window.scrollTo(old.x,old.y);}
   }
   function consumes(target,root,dy,dx){for(let el=target?.nodeType===1?target:target?.parentElement;el&&root.contains(el);el=el.parentElement){const css=getComputedStyle(el);if(/auto|scroll/.test(css.overflowY||css.overflow)&&el.scrollHeight>el.clientHeight+1&&(dy<0?el.scrollTop>0:dy>0&&el.scrollTop+el.clientHeight<el.scrollHeight-1))return true;if(!dy&&/auto|scroll/.test(css.overflowX||css.overflow)&&el.scrollWidth>el.clientWidth+1&&(dx<0?el.scrollLeft>0:dx>0&&el.scrollLeft+el.clientWidth<el.scrollWidth-1))return true;}return false;}
   document.addEventListener('wheel',e=>{const root=top();if(root&&(!root.contains(e.target)||!consumes(e.target,root,e.deltaY,e.deltaX)))e.preventDefault();},{capture:true,passive:false});
   document.addEventListener('touchstart',e=>{const t=e.touches[0];touch=t?{x:t.clientX,y:t.clientY}:null;},{capture:true,passive:true});
   document.addEventListener('touchmove',e=>{const root=top(),t=e.touches[0];if(!root||!t||!touch)return;const dx=touch.x-t.clientX,dy=touch.y-t.clientY;touch={x:t.clientX,y:t.clientY};if(!root.contains(e.target)||!consumes(e.target,root,dy,dx))e.preventDefault();},{capture:true,passive:false});
   new MutationObserver(sync).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});sync();
  }

  static castCardHTML(c){ const q=CAST&&CAST.busy, bz=k=>q&&q.c===c.id&&q.k===k, wq=k=>CAST&&CAST.q.some(x=>x.c===c.id&&x.k===k), fs=Characters.imgSrc(c), us=c.upper&&Characters.imgSrc(c.upper), nf=(c.faces||[]).filter(f=>Characters.imgSrc(f)).length;
    const box=(k,src,lbl)=>`<div class="cast-im ${k}">${src?`<img src="${esc(src)}" alt="${esc(c.name)} ${lbl}">`:''}${bz(k)?'<span class="cast-st">그리는 중…</span>':wq(k)?'<span class="cast-st">순서 기다리는 중</span>':src?'':'<span class="cast-st">아직 없음</span>'}<b>${lbl}</b></div>`;
    return `<div class="cast-card" data-cid="${c.id}"><div class="cast-hd">${c.npc?'<span class="cast-npc">NPC</span>':`<span class="cs-rar r${c.rarity}">${RL[c.rarity]}</span>`}<b>${esc(c.name)}</b><i>${esc(c.faction||'')}</i></div>
    <div class="cast-ims">${box('full',fs,'전신')}${box('up',us,'상반신')}</div>
    ${nf?`<div class="cast-fc">${(c.faces||[]).filter(f=>Characters.imgSrc(f)).map(f=>`<span title="${esc(f.name)}"><img src="${esc((f.up&&Characters.imgSrc(f.up))||Characters.imgSrc(f))}" data-full="${esc(Characters.imgSrc(f))}" alt="${esc(f.name)}"><i>${esc(f.name)}</i></span>`).join('')}</div>`:''}
    <div class="cast-btns"><button class="btn sm ghost" data-act="castre" data-id="${c.id}" data-k="full">⟳ 전신</button><button class="btn sm ghost" data-act="castre" data-id="${c.id}" data-k="up">⟳ 상반신</button><button class="btn sm ghost" data-act="castface" data-id="${c.id}" ${fs&&!c.npc?'':'disabled'}>😊 표정${nf?' '+nf:''}</button></div></div>`; }

  static openSkinProp(){ const P0=SKPROP; if(!P0||!P0.url) return; const c=charById(P0.cid); if(!c) return; const sel=P0.sel||{upper:1,illust:1,lbcg:1,faces:0,lines:SAMPLE?1:0};
    CoreView.openModal(`${head(`「${esc(P0.name)}」 제안`,`<span class="muted">${esc(c.name)}의 새 ${esc(System.T('skin'))} · 이 모습으로 만들까요?</span>`)}
    <div class="skp-img"><img src="${esc(P0.url)}" alt="${esc(P0.name)}"></div><p class="muted" style="text-align:center;font-size:.78rem;margin:4px 0 0">그림을 누르면 크게 봐요</p>
    <h3 class="sec">수락하면 함께 만들 것</h3>
    ${CoreView.skinSelHTML(sel,c)}
    <label class="f" for="skp_scene">일러스트·CG 장면 태그 (선택)</label><input class="in" id="skp_scene" value="${esc(P0.scene||'')}" placeholder="예: beach, sunset, waves, smile">
    <p class="muted" style="font-size:.78rem">수락하면 뒤에서 차례로 그려요(위쪽 막대에 진행이 보여요). 표정은 얼굴 범위를 칠한 뒤 전신·상반신 모두 얼굴만 다시 그려요.</p>
    <div class="row" style="margin-top:10px"><button class="btn" data-act="skpok">수락 · 이 모습으로 만들기</button><button class="btn ghost" data-act="skpredo">다시 그리기</button><button class="btn ghost" data-act="skpcancel">취소</button></div>`); }

  static memoCheck(c,before,after){ if(c&&c.memorial&&before<(+c.memorial.lv||8)&&after>=(+c.memorial.lv||8)) setTimeout(()=>CoreView.toast(`✦ ${c.name}의 메모리얼 「${c.memorial.title}」이(가) 열렸어요`),1200); }

    /* 메신저 화면 조각(View): 대화방 열림 · 입력 중 표시(지우는 함수를 돌려줌) · 말풍선 · 빈 방 안내 지우기 · 입력 칸(비우기·사진 안내·초점) · 자유 입력으로 · 선택지·내 말 단추 · 아래 칸 비우기 */
static phOpen(){ return !!$('#phChat'); }

  static fcInputClear(inp,text){ inp.value=''; inp.style.height=''; [0,60,200].forEach(ms=>setTimeout(()=>{ const v=inp.value.trim(); if(v&&text.endsWith(v)&&v.length<=Math.max(2,text.length)) inp.value=''; },ms)); }

  static revealCard0(i,cb){
    const el=document.querySelectorAll('.pc')[i]; if(!el||GC.open.has(i)){cb&&cb();return;}
    el.classList.add('open'); GC.open.add(i); Art.sfx('카드');
    const x=GC.res[i];
    if(x.c.rarity===3&&!GC.skip) GC.timers.push(setTimeout(()=>showCut(x.c,cb),500)); else cb&&cb();
  }

  static showCut0(c,cb){
    GC.cutCb=cb; const d=document.createElement('div'); d.className='cut'; d.dataset.act='cutclose'; d.style.setProperty('--rc',RCOL[c.rarity]);
    d.innerHTML=`<div class="cut-burst"></div><div class="cut-band"></div><div class="cut-art">${CoreView.art(c)}</div><div class="cut-txt"><div class="cut-r">★★★ ${RL[c.rarity]}</div><div class="cut-name">${esc(c.name)}</div><div class="cut-sub">${c.elem}속성 ${ROLE[c.role]} · ${esc(c.skill.name)}</div>${c.intro?`<div class="cut-line">「${esc(sub(c.intro))}」</div>`:''}</div>`;
    $('#gc').appendChild(d); Art.sfx('SSR'); if(c.voiceId&&c.intro) CoreView.speak(c,c.intro); try{navigator.vibrate&&navigator.vibrate([80,60,160]);}catch(e){}
  }

  static voiceRow(m){
    const pk=VS.picks[m._id], smp=(m.samples||[]).find(x=>/^https?:/.test(x.audio||''));
    const meta=[(m.languages||[]).join('/'),(m.tags||[]).slice(0,4).join(', '),'사용 '+nf(m.task_count||0)].filter(Boolean).join(' · ');
    return `<div class="ep"><span class="t"><b>${pk!==undefined?'<span class="badge r3c">추천</span> ':''}${esc(m.title)}</b><span class="muted">${esc(meta)}</span>${pk?`<span class="muted" style="display:block;white-space:normal">${esc(pk)}</span>`:''}</span>${smp?`<button class="btn sm ghost" data-act="vsplay" data-u="${esc(smp.audio)}" aria-label="샘플 듣기">▶</button>`:''}<button class="btn sm ghost" data-act="vstry" data-id="${m._id}">대사</button><button class="btn sm" data-act="vspick" data-id="${m._id}">선택</button></div>`;
  }

  static smTextView(title,text){CoreView.openModal(`${head(title)}<pre class="code-box" style="white-space:pre-wrap;overflow-wrap:anywhere">${esc(text||'아직 기록이 없습니다.')}</pre>`);}
}
