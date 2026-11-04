/* ===== 0040-sound — View(HTML·DOM을 만듦) ===== */
/* src/main/0040-sound/0040-sound.js에서 옮김 */
// 배경음 한꺼번에: 고른 곡을 뒤에서 한 곡씩 작곡해요(그동안 플레이 가능, 다 되면 우편)
function openBgmAll(){ const items=G.lib.filter(l=>l.kind==='bgm'); if(!items.length){ toast('배경음 목록이 비어 있어요'); return; }
  openModal(`${head('배경음 한꺼번에 만들기','<span class="muted">ElevenLabs 작곡 · 한 곡에 1~3분</span>')}
    ${SND().elKey?'':'<p style="color:var(--rose);margin:0 0 8px">설정 → 소리에서 ElevenLabs 키를 먼저 넣어 주세요.</p>'}
    <p class="muted" style="margin:0 0 8px">고른 곡을 뒤에서 한 곡씩 작곡해요. 그동안 플레이해도 되고, 다 되면 우편으로 알려 드려요. 프롬프트가 비어 있는 곡은 곡 이름으로 만들어요.</p>
    <div class="chips">${items.map(l=>`<button class="chip ${l.audio?'':'on'}" data-act="bgmpick" data-id="${l.id}">${esc(l.name)}${l.audio?' ✓':''}</button>`).join('')}</div>
    <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-act="bgmpickall" data-v="miss">미등록만</button><button class="btn sm ghost" data-act="bgmpickall" data-v="all">모두</button><button class="btn sm ghost" data-act="bgmpickall" data-v="none">모두 빼기</button></div>
    <p class="muted" style="margin:8px 0 0;font-size:.78rem">✓는 이미 곡이 있는 항목이에요. 고르면 새로 작곡해서 바꿔요. 곡 길이는 설정 → 소리의 작곡 길이를 따라요.</p>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="bgmallgo" ${SND().elKey?'':'disabled'}>작곡 시작</button></div>`); }
function bgm(name,force){
  const s=SND(); BGM.want=name||null;
  if(!s.bgmOn&&!force) name=null;
  const it=name&&G.lib.find(l=>l.kind==='bgm'&&l.name===name), src=it&&audioCache[it.id];
  if(!src){ bgmFade(0,()=>{BGM.el.pause();BGM.name=null;}); return; }
  if(BGM.name===name&&!BGM.el.paused){ bgmFade(s.bgmVol); return; }
  bgmFade(0,()=>{ BGM.name=name; BGM.el.src=src; BGM.el.volume=0; BGM.el.play().then(()=>{BGM.blocked=false;bgmFade(s.bgmVol);}).catch(()=>{BGM.blocked=true;}); });
}
function sceneBgm(){
  const sc=sceneOf();
  if(typeof B!=='undefined'&&B) return bgm(B.enemies.some(en=>en.boss)?sc.boss:sc.battle);
  if(typeof GC!=='undefined'&&GC) return bgm(sc.gacha);
  if(document.querySelector('.title')) return bgm(sc.title);
  if(typeof S!=='undefined'&&S) return;
  bgm(sc.lobby);
}
async function speak(c,text){
  stopVoice(); const tok=voiceTok;
  try{ const b=await ttsBlob(c,text); if(!b||tok!==voiceTok) return false;
    if(VOICE._u) URL.revokeObjectURL(VOICE._u); VOICE._u=URL.createObjectURL(b); VOICE.src=VOICE._u; VOICE.volume=SND().voiceVol; await VOICE.play(); return true; }
  catch(e){ if(!voiceErr){voiceErr=true;setTimeout(()=>{voiceErr=false;},20000);toast('음성 생성 실패. '+(AIERR[e&&e.code]||'')+' '+((e&&e.message)||''));} return false; }
}
/* 배경음 한꺼번에 만들기 창: 고르기 칩 모두/없는 것만(View) */
function bgmPickShow(v){ document.querySelectorAll('#modal [data-act="bgmpick"]').forEach(b=>{ const l=libById(b.dataset.id); chipOn(b,v==='all'||(v==='miss'&&l&&!l.audio)); }); }
function openSound(){
  const s=SND(); s.scene=sceneOf(); const bg=['',...G.lib.filter(l=>l.kind==='bgm').map(l=>l.name)];
  const sel=(id,cur)=>`<select class="in" id="${id}">${bg.map(n=>`<option value="${esc(n)}" ${n===cur?'selected':''}>${n?esc(n):'없음'}</option>`).join('')}</select>`;
  const onoff=(id,v)=>`<select class="in" id="${id}">${opt([['1','켜기'],['0','끄기']],v?'1':'0')}</select>`;
  openModal(`${head('소리')}
    <div class="slider"><label for="sd_bv"><span>배경음 볼륨</span></label><input id="sd_bv" type="range" min="0" max="100" value="${Math.round(s.bgmVol*100)}"></div>
    <div class="slider"><label for="sd_xv"><span>효과음 볼륨</span></label><input id="sd_xv" type="range" min="0" max="100" value="${Math.round(s.sfxVol*100)}"></div>
    <div class="slider"><label for="sd_vv"><span>음성 볼륨</span></label><input id="sd_vv" type="range" min="0" max="100" value="${Math.round(s.voiceVol*100)}"></div>
    <div class="g2"><div><label class="f">배경음</label>${onoff('sd_bon',s.bgmOn)}</div><div><label class="f">스토리 음성</label>${onoff('sd_vs',s.voiceStory)}</div></div>
    <div class="g2"><div><label class="f">로비 터치 음성</label>${onoff('sd_vl',s.voiceLobby)}</div><div><label class="f" for="sd_lang">목소리 언어</label><select class="in" id="sd_lang">${opt([['ko','한국어 (자막 그대로)'],['ja','일본어 (자막은 한국어)']],s.voiceLang||'ko')}</select></div></div>
    <p class="muted" style="margin:4px 0 0;font-size:.78rem">일본어로 하면 대사를 글 AI가 일본어로 옮겨서 읽어요(한 번 옮긴 대사는 저장해서 다시 쓰고, 처음 한 번은 글 AI 요금이 조금 들어요). 일본어를 잘하는 목소리를 고르면 더 자연스러워요.</p>
    <h3 class="disp" style="margin:16px 0 0;font-size:1.05rem">장면별 배경음</h3>
    <div class="g2"><div><label class="f">타이틀</label>${sel('sd_title',s.scene.title)}</div><div><label class="f">로비</label>${sel('sd_lobby',s.scene.lobby)}</div></div>
    <div class="g2"><div><label class="f">전투</label>${sel('sd_battle',s.scene.battle)}</div><div><label class="f">보스전</label>${sel('sd_boss',s.scene.boss)}</div></div>
    <div class="g2"><div><label class="f">계약</label>${sel('sd_gacha',s.scene.gacha)}</div><div></div></div>
    <p class="muted" style="margin:6px 0 0">스토리에서는 대본의 [음악: 이름]으로 바뀌어요.</p>
    <h3 class="disp" style="margin:16px 0 0;font-size:1.05rem">음성 AI (Fish Audio)</h3>
    <label class="f" for="sd_fk">API 키</label><input class="in" id="sd_fk" type="password" autocomplete="off" value="${esc(s.fishKey)}">
    <label class="f" for="sd_fm">음성 모델</label><select class="in" id="sd_fm">${opt([['s2.1-pro','S2.1 Pro (기본)'],['s2-pro','S2 Pro'],['s1','S1'],['s2.1-pro-free','S2.1 Pro Free (무료 개발자 등급)'],['drama-3-preview','Drama 3 Preview']],s.fishModel)}</select>
    <p class="muted" style="margin:4px 0 0">fish.audio 로그인 → API Keys에서 만들어요. 한 번 만든 대사 음성은 기기에 저장돼서 다시 들을 때 돈이 들지 않아요.</p>
    <h3 class="disp" style="margin:16px 0 0;font-size:1.05rem">음악 AI (ElevenLabs Music)</h3>
    <label class="f" for="sd_ek">API 키</label><input class="in" id="sd_ek" type="password" autocomplete="off" value="${esc(s.elKey)}">
    <label class="f" for="sd_eb">API 주소 (비우면 공식 주소 ${EL_DEF})</label><input class="in" id="sd_eb" inputmode="url" autocomplete="off" placeholder="${EL_DEF}" value="${esc(s.elBase||'')}">
    <div class="g2"><div><label class="f" for="sd_em">모델</label><select class="in" id="sd_em">${opt([['music_v1','Music v1'],['music_v2','Music v2']],s.elModel)}</select></div><div><label class="f" for="sd_el">곡 길이(초)</label><input class="in" id="sd_el" type="number" value="${s.elLen}"></div></div>
    <p class="muted" style="margin:4px 0 0">elevenlabs.io → Developers → API Keys에서 만들어요. 음악 생성은 유료 요금제에서 쓸 수 있어요.</p>
    <div class="row" style="margin-top:14px"><button class="btn" data-act="sndsave">저장</button><button class="btn ghost" data-act="fishtest">Fish 연결 확인</button></div>
    <h3 class="disp" style="margin:16px 0 0;font-size:1.05rem">저장된 음성</h3>
    <p class="muted" id="vstat" style="margin:4px 0 8px">세는 중…</p>
    <div class="row"><button class="btn sm ghost" data-act="vprebuild">전체 대사 미리 만들기</button><button class="btn sm ghost" data-act="vclearall">음성 저장소 비우기</button></div>`);
  voiceStats().then(v=>{const el=$('#vstat'); if(el) el.textContent=`${v.n}개 · ${v.mb}MB. 같은 목소리·모델·대사는 다시 요청하지 않고 이 파일을 재생해요.`;});
}
