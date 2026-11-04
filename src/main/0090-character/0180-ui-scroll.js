/* ===== 0090-character 화면(0180-ui-scroll.js에서 옮김) ===== */
/* src/main/0170-shell/0180-ui-scroll.js에서 옮김 */
function lobbyHTML(){
  const p=P(), c=charById(p.sec), has=c&&own(c.id), nx=nextStage(), evs=G.events.filter(ev=>ev.active!==false&&gateOpen(ev));
  // 자동 로비는 레이어 유지: 포즈 → 상반신 → 스탠딩. 일러스트는 별도 표시 모드에서 사용합니다.
  const oo=has?own(c.id):null, lm=p.lobbyMode||'auto', poseSrc=has&&!(skinOf(c)&&imgSrc(skinOf(c)))&&c.pose&&imgSrc(c.pose), layer=lm==='layer'||(lm==='auto'&&!!has), ill=has&&lm!=='stand'&&!layer&&((oo.useCg&&oo.dup>=5&&lbcgSrc(c))||charIllust(c)), pose=layer&&poseSrc;
  const bn=curBanner(), bup=bn&&((bn.pickup||[]).map(charById).filter(Boolean)[0]||bannerPool(bn).filter(x=>x.rarity===3)[0]);
  const TYPE={std:'STANDARD',pickup:'PICK UP',pool:'FACTION',event:'EVENT LIMITED'};
  const ico=(act,to,ic,label,badge,hot)=>`<button class="lb-ico ${hot?'hot':''}" data-act="${act}" ${to?`data-to="${to}"`:''}><span class="ic">${ICO[ic]}</span><b>${esc(label)}</b>${badge?`<em>${badge}</em>`:''}</button>`;
  const newN=p.live.notices.filter(n=>n.at>p.live.seen).length;
  return `<div class="lobby ${ill?'ill':''} ${layer?'layer':''} lbsz-${esc(p.lbSize||'fit')}">${layer?`<div class="lb-far" style="${has&&c.lbbg&&imgSrc(c.lbbg)?`background-image:url('${esc(imgSrc(c.lbbg))}')`:bgStyle(p.lobbyBg||'새벽등대 사무소')}"></div>`:''}
    <div class="lb-stage" ${has?'data-act="poke" role="button" tabindex="0"':'data-act="lbshow"'} style="${ill?'background:#000':layer?'background:transparent':bgStyle(p.lobbyBg||'새벽등대 사무소')}">
      ${ill?`<img class="lobby-ill" src="${esc(ill)}" alt="${esc(c.name)}" draggable="false">`:pose?`<img class="art lobby-art lobby-pose" src="${esc(pose)}" alt="${esc(c.name)}" draggable="false">`:has?(layer?lobbyCharacterArt(c):art(c,'lobby-art')):''}<div class="lb-shade"></div>
    </div>
    <div class="lb-ui">
      ${bn?`<button class="lb-banner" data-act="go" data-to="contract" data-swipe="banner"><span class="bgl" style="${bn.bg?bgStyle(bn.bg):bgStyle(p.gachaBg||'낙성 분화구')}"></span><span class="bt"><i>${TYPE[bn.type]||'RECRUIT'}</i><b>${esc(bn.name)}</b><span>${bup?esc(bup.name)+' 확률 업':esc(T('gacha'))}</span></span><span class="bf">${bup?noSkin(()=>art(bup))():''}</span></button>`:''}
      <div class="lb-tr"><button class="lb-pass" data-act="go" data-to="pass"><i>SEASON PASS</i><b>Lv.${passLv()}</b>${passClaimable()?'<em></em>':''}</button>${seasonChip()}</div>
      <div class="lb-left">
        ${ico('phone','','talk',T('talk'),unread()||'')}
        ${evs.length?ico('go','event','event',T('event'),evs.length):''}
        ${ico('go','notice','notice','공지',newN||'')}
        ${ico('go','codex','book','도감',cxNewFast()||'')}
        ${p.daily!==today()?ico('daily','','gift','일일 보급','!',true):''}
      </div>
      <div class="lb-right">
        ${ico('mailopen','','mail','우편함',mailCount()||'',mailCount()>0)}
        ${ico('go','disp','disp',T('dispatch'),dispDone()||'')}
        ${ico('go','sched','talk','일정',G.chars.some(c=>own(c.id))&&progRead('sched').left?progRead('sched').left:'')}
        ${ico('go','farm','farm',T('farm'),'')}
        ${ico('go','challenge','raid','도전',progRead('rogue').run?'!':(raidTriesLeft()&&!progRead('raid').killed?raidTriesLeft():''))}
        ${ill||has?ico('lbhide','','eye','숨기기',''):''}
      </div>
      <div class="lb-foot">
      ${has?`<div class="bubble" id="bubble">${esc(sub(rand(affLinePool(c))||'…'))}</div>`:''}
      <div class="lb-id">${has?`<i>${esc(G.meta.sub)}</i><b>${esc(c.name)}</b><span>${esc(c.faction||ROLE[c.role])} · 호감도 Lv.${affLv(own(c.id))}</span>`:`<i>${esc(G.meta.sub)}</i><b>${esc(G.meta.title)}</b><span>첫 ${T('gacha')}로 ${T('crew')}을(를) 만나세요</span>`}</div>
      <div class="lb-bottom">
        <div class="lb-shops">
          <button class="lb-shop cash" data-act="go" data-to="cash">${ICO.gem}<span><i>CASH SHOP</i><b>캐시 상점</b></span></button>
          <button class="lb-shop" data-act="go" data-to="shop">${ICO.shop}<span><i>SUPPLY SHOP</i><b>상점</b></span></button>
        </div>
        <button class="lb-sortie" data-act="go" data-to="ops"><i>COMBAT</i><b>${esc(T('ops'))} 출격</b><span>${nx?esc(nx.code+' '+nx.s.title):'모든 '+esc(T('ops'))+' 완료'}</span></button>
      </div></div>
    </div>
  </div>`;
}
function passHTML(){
  const p=P(), d=progRead('dm'), lv=passLv(), xp=p.pass.xp;
  return `${pageHead(T('pass'),'SEASON PASS','lobby')}
  <div class="panel"><div style="display:flex;justify-content:space-between;align-items:baseline"><h3>Lv.${lv} / ${PASS_MAX}</h3><span class="muted">${nf(xp%PASS_PER)} / ${PASS_PER} XP</span></div><div class="bar"><i style="width:${lv>=PASS_MAX?100:(xp%PASS_PER)/PASS_PER*100}%"></i></div></div>
  <div class="row" style="margin:8px 0"><button class="btn sm" data-act="pgetall">모두 받기 <small>(임무·패스 보상)</small></button></div>
  <h3 class="sec">오늘의 임무</h3>
  ${MISSIONS.map(m=>{const c=Math.min(m.goal,d.cnt[m.k]||0),ok=c>=m.goal,got=d.got[m.k];return `<div class="ep"><span class="t"><b>${m.name}</b><span class="muted">${c}/${m.goal} · ${m.xp} XP</span></span><button class="btn sm ${got?'ghost':''}" data-act="mget" data-k="${m.k}" ${ok&&!got?'':'disabled'}>${got?'완료':'받기'}</button></div>`;}).join('')}
  <h3 class="sec">패스 보상</h3>
  <div class="passgrid">${Array.from({length:PASS_MAX},(_,i)=>i+1).map(l=>{const got=p.pass.got.includes(l),ok=l<=lv;return `<button class="pv ${got?'got':ok?'ok':''}" data-act="pget" data-lv="${l}" ${ok&&!got?'':'disabled'}><i>${l}</i><span>${rewardText(passReward(l))}</span></button>`;}).join('')}</div>
  <div class="row" style="margin-top:12px"><button class="btn sm ghost" data-act="passreset">새 시즌 시작</button></div>`;
}
