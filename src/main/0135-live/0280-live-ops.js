/* ===== 라이브 운영 ===== */
function dayKey(d){d=d||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function weekKey(d){d=d||new Date();const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));const w=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-w);const y=t.getUTCFullYear();return y+'-W'+Math.ceil(((t-Date.UTC(y,0,1))/864e5+1)/7);}
/* 뒤에서 만들기: 다음 장·이벤트·픽업은 화면을 막지 않고 만들어요(그동안 전투·뽑기 가능). 다 되면 우편이 와요 */
const BGJOBS=[];
function bgJobsDraw(){ let el=document.getElementById('bgjobs'); if(!BGJOBS.length){ if(el) el.remove(); return; } if(!el){ el=document.createElement('div'); el.id='bgjobs'; document.body.appendChild(el); }
  const now=Date.now(); el.innerHTML=BGJOBS.map(j=>{ const s=Math.floor((now-j.at)/1000), pct=j.total?Math.round(100*j.step/j.total):0; return `<div class="bgj"><span>${esc(j.label)}${j.sub?' · '+esc(j.sub):''}</span><em>${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}</em><i class="${j.total?'':'ind'}" style="--w:${Math.max(8,pct)}%"></i></div>`; }).join(''); }
setInterval(()=>{ if(BGJOBS.length) bgJobsDraw(); },1000);
function bgJob(key,label,fn){ if(BGJOBS.some(j=>j.key===key)){ toast('이미 뒤에서 만드는 중이에요. 끝나면 우편이 와요'); return false; }
  const game=G,project=PJ().active,j={key,label,at:Date.now(),step:0,total:0,sub:''}; BGJOBS.push(j); bgJobsDraw();
  toast(label+' · 뒤에서 만들어요. 그동안 플레이해도 돼요. 다 되면 우편으로 알려 드려요');
  (async()=>{ let out=null; try{ out=await fn(j); }catch(e){ console.warn(e); }
    finally{ const i=BGJOBS.indexOf(j); if(i>=0) BGJOBS.splice(i,1); bgJobsDraw(); }
    if(G!==game||PJ().active!==project)return;
    if(out&&out.title){ sendMail({from:'운영팀',title:out.title,body:out.body||'',days:30}); toast('📮 '+out.title); }
    else { sendMail({from:'운영팀',title:label.replace(/ 만드는 중$/,'')+' 실패',body:'만들지 못했어요. 글 AI 연결과 남은 사용량을 확인하고 다시 시도해 주세요.',days:7}); toast(label.replace(/ 만드는 중$/,'')+'에 실패했어요. 우편함을 확인해 주세요'); }
    mark('prog'); if($('#modal').hidden&&(!B||B.over)) render(); })();
  return true; }
function liveBar(msg){let el=document.getElementById('livebar');if(!msg){if(el)el.remove();return;}if(!el){el=document.createElement('div');el.id='livebar';document.body.appendChild(el);}el.textContent=msg;}
function rotatePickups(){
  const pus=G.banners.filter(bn=>bn.type==='pickup'&&bn.active!==false&&!bn.newAt&&!bn.eventId&&!bn.until&&!bn.pin), L=P().live, ssr=G.chars.filter(c=>c.rarity===3&&!c.limited);
  if(!pus.length||ssr.length<2) return '';
  const names=[], bgs=G.lib.filter(l=>l.kind==='bg');
  pus.forEach(b=>{ let cand=ssr.filter(c=>!L.recentPU.includes(c.id)&&!b.pickup.includes(c.id)); if(!cand.length) cand=ssr.filter(c=>!b.pickup.includes(c.id)); if(!cand.length) return;
    const c=rand(cand); b.pickup=[c.id]; b.name=`${c.name} 확률 업`; b.desc=`SSR ${c.name} 확률 상승`; if(bgs.length) b.bg=rand(bgs).name;
    L.recentPU.unshift(c.id); L.recentPU=L.recentPU.slice(0,Math.max(1,ssr.length-1)); names.push(c.name); });
  return names.length?`확률 업 교체: ${names.join(', ')}`:'';
}
async function dailyTalks(){
  const owned=[...new Set(G.chars.filter(c=>own(c.id)).map(c=>baseChar(c)))]; if(!owned.length) return 0;
  const picks=[...owned].sort(()=>Math.random()-.5).slice(0,Math.random()<0.5?1:2), evs=G.events.filter(ev=>ev.active!==false).map(e=>e.title).join(', ');
  const wd=['일','월','화','수','목','금','토'][new Date().getDay()];
  const r=await aiJSON(dailyTalksPrompt({picks,wd,evs}),null,'default');
  let n=0; (r&&Array.isArray(r.threads)?r.threads:[]).forEach(x=>{const c=findSpeaker(String(x.char||''));if(!c||!x.script)return;const th={id:uid(),charId:c.id,title:String(x.title||'메시지'),trigger:{type:'start'},needOwn:true,script:nl(x.script),daily:true};G.threads.push(th);mark('t:'+th.id);n++;});
  const old=G.threads.filter(t=>t.daily&&P().inbox[t.id]&&P().inbox[t.id].done); if(old.length>40){ old.slice(0,old.length-40).forEach(t=>{G.threads=G.threads.filter(x=>x!==t);mark('t:'+t.id);}); }
  return n;
}
