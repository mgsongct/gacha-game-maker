/* ===== player — 기능 class(Model · View · Ctl) — docs/redesign.md 2·3절, tools/reshape.mjs가 매핑대로 옮김 ===== */
class Player {
  static fcSendRecentText({cid,c}){ return Messenger.roomLog(cid).slice(-24).map(l=>l.w==='me'?(l.img?`(${playerName()}이(가) 사진을 보냄${l.t?': '+l.t:''})`:`${playerName()}: ${l.t}`):l.w==='c'?`${c.name}: ${l.t}`:l.w==='p'?`(${c.name}이(가) 사진을 보냄)`:`(${l.t})`).join('\n'); }

  static fcSummarizePrompt({c,f,part}){ return `${Core.pf('FREE_CHAT_SUMMARY',{name:c.name,playerName:playerName(),sum:f.sum?'기존 요약: '+f.sum+'\n':'',name2:part.map(l=>(l.w==='me'?playerName():l.w==='c'?c.name:'')+': '+l.t).join('\n')})}JSON만 출력: {"summary":"요약"}`; }

  static playerCast(){ const p=P(), g=p.gender==='m'?'1boy':p.gender==='f'?'1girl':'1other', tags=String((p.avatar&&p.avatar.prompt)||'').trim(); return {id:'__player',name:System.T('player'),naiPrompt:Core.joinTags(tags||g,p.hideEyes?'hair over eyes, covered eyes':'')}; }

    /* src/main/0010-rules.js */
static genderText(){ const t=String(P().genderTxt||'').trim(), lk=String(P().look||'').trim(), bio=String(P().bio||'').trim(), L=(lk?`플레이어(${System.T('player')})의 외모: ${lk}. `:'')+(bio?Core.pf('PLAYER_BIO',{player:System.T('player'),bio}):'');
    if(t&&!/^(정하지 ?않음|없음|모름|비밀)$/.test(t)) return Core.pf('PLAYER_GENDER_TEXT',{player:System.T('player'),gender:t})+L;
    return Player.genderText0()+L; }

  static genderText0(){ const g=P().gender; return Core.pf(g==='m'?'PLAYER_MALE':g==='f'?'PLAYER_FEMALE':'PLAYER_GENDER_OPEN',{player:System.T('player')}); }

  static callText(){ const n=String(P().player||'').trim(), t=System.T('player'); return Core.pf(n&&n!==t?'CALL_NAME':'CALL_TERM',{crew:System.T('crew'),call:t,name:n}); }

  static readPlayerForm(){ const p=P(); if($('#pf_name')) p.player=$('#pf_name').value.trim().slice(0,12);
    if($('#pf_call')){ const cv=$('#pf_call').value.trim().slice(0,12); if(cv&&cv!==System.T('player')){ G.meta.terms.player=cv; Core.mark('meta'); } }
    if($('#pf_gender')){ const g=$('#pf_gender').value.trim().slice(0,40); p.genderTxt=g; p.gender=/^(남|남성|남자|male|man)$/i.test(g)?'m':/^(여|여성|여자|female|woman)$/i.test(g)?'f':''; }
    if($('#pf_gsel')){ p.gender=$('#pf_gsel').value; p.genderTxt=''; }
    if($('#pf_look')) p.look=$('#pf_look').value.trim().slice(0,400); if($('#pf_bio')) p.bio=$('#pf_bio').value.trim().slice(0,1500); if($('#pf_hide')) p.hideEyes=$('#pf_hide').checked;if($('#pf_nai'))CoreView.naiBlocksSave(Core.progSlot('avatar'),'prompt','pf_nai'); Core.mark('prog'); }

  static async playerDraw(rep){ Player.readPlayerForm(); const p=P(); if(!p.look&&!p.avatar?.prompt){ CoreView.toast('외모나 NAI 프롬프트를 먼저 적어 주세요'); return; } if(!Core.imgReady()){ CoreView.toast(Core.imgNeed()); return; }
    if(rep) rep('태그 만드는 중…');
    try{ const tags=p.avatar?.prompt||await NewGame.heroTags({gender:p.genderTxt,look:p.look,hide:p.hideEyes}); if(!tags){ CoreView.toast('태그를 만들지 못했어요. 다시 눌러 주세요'); return; }
      if(rep) rep('그리는 중…'); const o=Core.progSlot('avatar'); o.prompt=tags;
      const b=await NewGame.naiDraw('char',tags,{candidateEligible:true,originalSrc:Art.imgSrcRaw(o)||'',frame:'cowboy shot',pose:'looking at viewer'}); await Art.storeImage(o,b,''); Core.mark('prog'); CoreView.toast('프로필 그림을 만들었어요'); PlayerView.refreshPlayerForm();
    }catch(e){ CoreView.toast(Core.naiErr(e)); } finally{ if(rep) rep.end(); } }

  static uiScrollPath(root,node){
   if(node===root)return [];
   const path=[];for(let el=node;el&&el!==root;el=el.parentElement){if(!el.parentElement)return null;path.unshift([...el.parentElement.children].indexOf(el));}
   return path;
  }
}

class PlayerView {
  static playerFormHTML(){ const p=P(), ai=!!SAMPLE, av=p.avatar&&Characters.imgSrc(p.avatar);
    return `<div class="g2"><div><label class="f" for="pf_call">호칭 <span class="muted" style="font-size:.75rem">(평소에 불리는 말)</span></label><input class="in" id="pf_call" maxlength="12" value="${esc(System.T('player'))}" placeholder="예: 지휘관"></div><div><label class="f" for="pf_name">이름 <span class="muted" style="font-size:.75rem">(필요할 때만)</span></label><input class="in" id="pf_name" maxlength="12" value="${esc(p.player||'')}" placeholder="비우면 호칭으로만 불려요"></div></div>
    ${ai?`<label class="f" for="pf_gender">당신의 성별은? (직접 쓰기)</label><input class="in" id="pf_gender" maxlength="40" value="${esc(p.genderTxt!=null?p.genderTxt:(({m:'남성',f:'여성'})[p.gender]||''))}" placeholder="예: 남성, 여성, 논바이너리… 비우면 정하지 않아요">
    <label class="f" for="pf_look">외모 (직접 쓰기)</label><textarea class="in" id="pf_look" maxlength="400" placeholder="예: 검은 단발, 회색 후드티, 키가 크고 마른 편, 왼쪽 귀에 피어싱">${esc(p.look||'')}</textarea>
    <label class="f" for="pf_bio">설정 (성격·과거·직업·능력 등, 직접 쓰기)</label><textarea class="in" id="pf_bio" maxlength="1500" placeholder="예: 전직 기사단 정보원. 말수가 적고 단 걸 좋아한다. 잃어버린 기억을 찾고 있다.">${esc(p.bio||'')}</textarea>
    <label style="display:flex;gap:8px;align-items:center;margin-top:8px"><input type="checkbox" id="pf_hide" ${p.hideEyes?'checked':''}><span>앞머리로 눈 가리기 <span class="muted" style="font-size:.8rem">(미연시 주인공처럼 눈이 보이지 않게 그려요)</span></span></label>
  `
    :`<label class="f" for="pf_gsel">성별</label><select class="in" id="pf_gsel">${CoreView.opt([['m','남성'],['f','여성']],p.gender==='f'?'f':'m')}</select><p class="muted" style="font-size:.8rem;margin:6px 0 0">글 AI를 등록하면 성별과 외모를 직접 쓰고 프로필 그림도 만들 수 있어요.</p>`}
    <label class="f" for="pf_nai">프로필 그림 NAI 프롬프트 (비우면 외모 설명으로 자동 구성)</label><textarea class="in" id="pf_nai">${esc(p.avatar?.prompt||'')}</textarea>
    <div class="pf-av">${av?`<img src="${esc(av)}" alt="프로필">`:'<span>프로필 그림 없음</span>'}<div class="col">${Core.imgReady()&&ai?`<button class="btn sm" data-act="pfdraw">${av?'다시 그리기':'외모로 프로필 그리기'}</button>`:''}<button class="btn sm ghost" data-act="upload" data-k="avatar">올리기</button>${av?'<button class="btn sm ghost" data-act="avdel">지우기</button>':''}</div></div>${Core.imgReady()||!ai?'':'<p class="muted" style="font-size:.8rem;margin:6px 0 0">그림 AI를 등록하면 외모로 프로필 그림을 만들 수 있어요.</p>'}`; }

  static refreshPlayerForm(){ const w=$('#pfWrap'); if(w){const sheet=w.closest('.sheet')||$('#view'),position=PlayerView.uiScrollCapture(sheet);w.innerHTML=PlayerView.playerFormHTML();PlayerView.uiScrollRestore(sheet,position);} }

  static uiScrollResolve(root,entry){
   if(!root)return null;
   let node=entry.id?[root,...root.querySelectorAll('[id]')].find(el=>el.id===entry.id):null;
   if(!node){node=root;for(const i of entry.path||[]){node=node?.children[i];if(!node)return null;}}
   return node?.tagName===entry.tag?node:null;
  }

  static uiScrollCapture(root){
   if(!root)return null;
   const nodes=[root,...root.querySelectorAll('*')],rows=[],details=[];
   for(const node of nodes){if(node!==root&&!node.scrollTop&&!node.scrollLeft&&node.tagName!=='DETAILS')continue;const entry={id:node.id||'',path:Player.uiScrollPath(root,node),tag:node.tagName};
    if(node===root||node.scrollTop||node.scrollLeft)rows.push({...entry,top:node.scrollTop,left:node.scrollLeft});
    if(node.tagName==='DETAILS')details.push({...entry,open:node.open});
   }
   return {rows,details};
  }

  static uiScrollRestore(root,state){
   if(!root||!state)return;
   for(const entry of state.details||[]){const node=PlayerView.uiScrollResolve(root,entry);if(node)node.open=entry.open;}
   for(const entry of state.rows||[]){const node=PlayerView.uiScrollResolve(root,entry);if(node){node.style.overflowAnchor='none';node.scrollTop=entry.top;node.scrollLeft=entry.left;}}
  }

  static opEnd(){
    if(!OP) return; clearTimeout(OP.t); OP=null;
    if(!P().seenOpening&&P().nameAsked){ SystemView.playStory('프롤로그',G.opening.prologue,Story.afterPrologue); return; }
    if(!P().seenOpening){
      CoreView.openModal(`<h2>${esc(System.T('player'))}의 이름</h2><p class="muted">${esc(System.T('crew'))}들은 평소에 「${esc(System.T('player'))}」(이)라고 부르고, 이름은 필요할 때 불러요. 나중에 설정에서 바꿀 수 있어요.</p><label class="f" for="nm_call">호칭</label><input class="in" id="nm_call" maxlength="12" value="${esc(System.T('player'))}"><label class="f" for="nm_in">이름</label><input class="in" id="nm_in" maxlength="12" placeholder="비우면 호칭으로만 불려요" value="${esc(P().player)}"><div class="row" style="margin-top:14px"><button class="btn" data-act="setname">임명장에 서명하기</button></div>`,true);
      setTimeout(()=>$('#nm_in')&&$('#nm_in').focus({preventScroll:true}),100);
    } else SystemView.playStory('프롤로그',G.opening.prologue,()=>Challenge.render());
  }
}
