/* ===== 동기화 공통(PC 서버·GitHub 연동이 같이 씀): 동기화 설정·기기 이름·그림 색인·동기화할 저장 키와 합치기·진행 막대·오류 문구·해시 ===== */
const SYKEY='ggm-sync', SYIDX='ggm-sync-idx';
function SY(){ try{ return JSON.parse(appStorage.getItem(SYKEY))||{}; }catch(e){ return {}; } }
function saveSY(o){ appStorage.setItem(SYKEY,JSON.stringify(o)); }
function syIdx(){ try{ return JSON.parse(appStorage.getItem(SYIDX))||{}; }catch(e){ return {}; } }
function saveSyIdx(o){ try{ appStorage.setItem(SYIDX,JSON.stringify(o)); }catch(e){} }
function syDevice(){ const o=SY(); return o.device||(IS_NATIVE?'안드로이드 폰':IS_IOS?'아이폰':document.body.classList.contains('desk')?'PC':'브라우저'); }
function bytesToB64(u8){ let s=''; for(let i=0;i<u8.length;i+=0x8000) s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000)); return btoa(s); }
async function shaHex(buf){ if(!(window.crypto&&crypto.subtle)) return sha256js(new Uint8Array(buf)); const h=await crypto.subtle.digest('SHA-256',buf); return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,'0')).join(''); }
// http 주소(같은 와이파이의 PC 서버 등)에서는 브라우저가 crypto.subtle을 막아요 → 직접 계산
function sha256js(m){ const K=[],H=[]; let n=2; const fr=x=>(x-Math.floor(x))*4294967296|0; for(let c=0;c<64;n++){ let p=1; for(let d=2;d*d<=n;d++) if(n%d===0){ p=0; break; } if(p){ if(c<8) H[c]=fr(Math.pow(n,1/2)); K[c++]=fr(Math.pow(n,1/3)); } }
  const l=m.length, nb=((l+9+63)>>6)<<6, b=new Uint8Array(nb); b.set(m); b[l]=0x80; const dv=new DataView(b.buffer); dv.setUint32(nb-8,Math.floor(l/536870912)); dv.setUint32(nb-4,(l<<3)>>>0);
  const w=new Int32Array(64), r=(x,k)=>(x>>>k)|(x<<(32-k));
  for(let o=0;o<nb;o+=64){ for(let i=0;i<16;i++) w[i]=dv.getInt32(o+i*4); for(let i=16;i<64;i++){ const a=w[i-15], c=w[i-2]; w[i]=(w[i-16]+(r(a,7)^r(a,18)^(a>>>3))+w[i-7]+(r(c,17)^r(c,19)^(c>>>10)))|0; }
    let [A,B2,C,D,E,F,G2,Hh]=H; for(let i=0;i<64;i++){ const t1=(Hh+(r(E,6)^r(E,11)^r(E,25))+((E&F)^(~E&G2))+K[i]+w[i])|0, t2=((r(A,2)^r(A,13)^r(A,22))+((A&B2)^(A&C)^(B2&C)))|0; Hh=G2; G2=F; F=E; E=(D+t1)|0; D=C; C=B2; B2=A; A=(t1+t2)|0; }
    [A,B2,C,D,E,F,G2,Hh].forEach((v,i)=>{ H[i]=(H[i]+v)|0; }); }
  return H.map(x=>(x>>>0).toString(16).padStart(8,'0')).join(''); }
// 게임 목록(starfall-projects)은 한 번도 저장 안 됐을 수 있어요(샘플 게임만 쓴 기기). 받는 쪽은 목록이 꼭 있어야 해서 기본 목록을 채워 보내요
function syLsValue(k){ const v=appStorage.getItem(k); return v==null&&k===PJKEY?JSON.stringify(PJ()):v; }
/* 저장 정책(사용자 지시 — 브라우저 저장소는 캐시, 원본은 PC 서버의 파일: 게임은 data/, 그 밖의 설정은 ggm-data/state.json — 자동 동기화).
   브라우저 저장소(appStorage·localStorage) 키마다 갈래를 한곳에서 정해요. 게임 저장(starfall-projects·starfall-contract-v1…)은 저장소가 따로 관리해요(GGMStorage.managed)
   sync   — 사용자가 만든 내용·게임에 필요한 설정: PC 서버·GitHub 둘 다
   secret — 비밀(API 키·토큰)이 든 설정: PC 서버에는 그대로, GitHub에는 [뺄 칸]을 빼고(null이면 보내지 않음). 받을 때 빠진 비밀은 이 기기 것을 지킴
   keep   — 받을 때 이 기기 값을 지키는 칸(연동 설정의 기기 이름)
   device — 이 기기에만 의미 있는 값 · cache — 다시 만들 수 있는 캐시·기록 · legacy — 예전 형식 키(읽어서 새 키로 옮기기만) (셋 다 동기화 안 함)
   새 저장 키는 여기에 갈래를 정해요(tools/map.mjs가 갈래 없는 키·목록과 다른 동기화를 막아요) */
const STORE_POLICY={
  sync:['starfall-setup-done','ggm-plessons','ggm-packs','ggm-llmslot','ggm-shared-assets','ggm-drafts','ggm-draft2'],
  secret:{'starfall-nai':['key'],'starfall-sound':['fishKey','elKey'],'starfall-ai-profiles':null,'ggm-sync':null,'ggm-pub':null},
  keep:{'ggm-sync':['device']},
  device:['ggm-devid','ggm-orient','ggm-desk','ggm-a2hs','ggm-pc','ggm-proxy','ggm-proxy-off','ggm-play','ggm-start','ggm-bkdest','ggm-ng-draft','ggm-sync-idx','ggm-sync-hold'],
  cache:['starfall-live','starfall-live-html','ggm-pthumb','ggm-voice-ja','ggm-ailog','ggm-upd-notes','starfall-nai-tperr'],
  legacy:['starfall-ai']
};
function syLsKeys(withKeys){ const pj=PJ(), sec=Object.entries(STORE_POLICY.secret).filter(([,f])=>withKeys||f).map(([k])=>k); return [PJKEY,...pj.list.map(x=>pjKey(x.id)),...STORE_POLICY.sync,...sec]; }
function syStrip(k,v,withKeys){ const f=STORE_POLICY.secret[k]; if(withKeys||v==null||!f) return v; try{ const o=JSON.parse(v); f.forEach(x=>{ delete o[x]; }); return JSON.stringify(o); }catch(e){} return v; }
/* 받을 때: 빠진 비밀(GitHub로 받은 설정)과 이 기기 값(keep)은 이 기기 것을 지켜요 */
function syMerge(k,v){ if(v==null) return v; const f=[...(STORE_POLICY.secret[k]||[]),...(STORE_POLICY.keep[k]||[])]; if(!f.length) return v; try{ const cur=JSON.parse(appStorage.getItem(k)||'{}'), o=JSON.parse(v); f.forEach(x=>{ if((!o[x]||(STORE_POLICY.keep[k]||[]).includes(x))&&cur[x]) o[x]=cur[x]; }); return JSON.stringify(o); }catch(e){} return v; }
let SYJOB=null;
function syBar(t){ let el=$('#syBar'); if(!t){ if(el) el.remove(); return; } if(!el){ el=document.createElement('div'); el.id='syBar'; el.className='prepchip'; document.body.appendChild(el); } el.innerHTML=`<b>☁ ${esc(t)}</b>`; }
function syErr(e){let message=e?.status===404?'저장소·브랜치를 찾지 못했습니다. 이름과 토큰 권한을 확인해 주세요.':e?.status===401||e?.status===403?'토큰 또는 저장소 쓰기 권한을 확인해 주세요.':AIERR[e?.code]||e?.message||'다시 시도해 주세요';if(e?.status)message=`HTTP ${e.status} · `+message;if(e?.endpoint)message+=' · 단계: '+e.endpoint;if(e?.details)message+=' · '+e.details;return ghSafeMessage(message).slice(0,1000);}
