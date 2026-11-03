#!/usr/bin/env python3
# 가챠 게임 메이커 PC 서버
# - 내 PC에서 게임을 띄우고, Cloudflare 임시 주소(trycloudflare)로 휴대폰에서 접속해요.
# - 게임 데이터(진행·그림)를 이 PC의 ggm-data 폴더에 저장해요.
# - AI 요청을 PC가 대신 보내서 CORS/Origin 문제 없이, 내 PC의 ComfyUI·Ollama도 휴대폰에서 쓸 수 있어요.
# 필요: Python 3.8 이상. 창을 닫으면 주소가 사라져요(다음 실행 때 새 주소 + 새 QR).
import base64, hashlib, http.server, json, os, platform, re, secrets, shutil, socket, socketserver, stat, subprocess, sys, tarfile, threading, time, urllib.error, urllib.parse, urllib.request, webbrowser

SERVER_VER = '2026.11.03.3'
PORT = int(os.environ.get('GGM_PORT', '8790'))
# 켤 때 www/를 받아 오는 곳. 이 포크의 빌드를 써요(원본으로 두면 원본 index.html로 덮어써져요). GGM_BRANCH로 브랜치도 고를 수 있어요
REPO = os.environ.get('GGM_REPO', 'mgsongct/gacha-game-maker')
BRANCH = os.environ.get('GGM_BRANCH', 'main')
RAW = os.environ.get('GGM_RAW', 'https://raw.githubusercontent.com').rstrip('/')  # 앱 받는 주소(배포본 시험에서 로컬 주소로 바꿈)
HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, 'ggm-data')
WWW = os.path.join(HERE, 'www')
BLOBS = os.path.join(DATA, 'blobs')
# 게임 데이터: index.html 옆 data/<게임id>/<종류>.json (영구 저장소). 앱의 IndexedDB는 이걸 받아 쓰는 캐시예요.
GAMES = os.environ.get('GGM_DATA_DIR') or os.path.join(HERE, 'data')
os.makedirs(BLOBS, exist_ok=True); os.makedirs(os.path.join(WWW, 'icons'), exist_ok=True)

KEYF = os.path.join(DATA, 'key.txt')
if not os.path.exists(KEYF):
    open(KEYF, 'w').write(secrets.token_urlsafe(18))
KEY = open(KEYF).read().strip()
PUBLIC = {'url': ''}
LEASE = {'id': '', 'name': '', 'at': 0, 'seen': 0, 'away': True, 'want': None}
LEASE_LOCK = threading.Lock()
STORE_LOCK = threading.Lock()

def log(*a): print(*a, flush=True)

def awrite(fp, data):
    tmp = fp + '.' + secrets.token_hex(8) + '.tmp'
    try:
        with open(tmp, 'wb') as out: out.write(data); out.flush(); os.fsync(out.fileno())
        os.replace(tmp, fp)
    finally:
        if os.path.exists(tmp): os.remove(tmp)

# ---------- 게임 데이터 폴더 (data/<게임id>/<종류>.json) ----------
# 앱 www/src/main/0525-data-folder.js 의 DATA_TYPES 와 같은 배치예요. 목록에 없는 키는 game.json에 모여요.
# ponytail: 종류별 파일 하나. 캐릭터 하나가 바뀌어도 chars.json 전체를 다시 써요(내용이 같으면 안 씀). 더 커지면 chars/<id>.json으로.
TYPES = ['meta', 'world', 'chars', 'npcs', 'rels', 'chapters', 'lib', 'threads', 'opening', 'banners', 'events', 'dispatches', 'prog']
GAME_KEY = re.compile(r'^starfall-contract-v1(?:-([A-Za-z0-9_-]{1,64}))?$')
PROJECTS = 'starfall-projects'
def game_key(gid): return 'starfall-contract-v1' if gid == 'main' else 'starfall-contract-v1-' + gid
def jdump(o): return json.dumps(o, ensure_ascii=False, indent=1).encode()
def put_json(fp, o):
    b = jdump(o)
    if os.path.exists(fp) and open(fp, 'rb').read() == b: return
    awrite(fp, b)

def jload(fp):
    try: return json.load(open(fp, encoding='utf-8'))
    except Exception as e: raise ValueError(f'{os.path.relpath(fp, os.path.dirname(GAMES))} 을(를) 읽지 못했어요(직접 고쳤다면 JSON 문법을 확인해 주세요): {e}')

def data_sig():
    """data 폴더 파일들의 (경로, 크기, 수정 시각) 요약. 서버가 쓴 뒤와 다르면 누가 직접 고친 거예요"""
    h = hashlib.sha256()
    for root, dirs, fs in os.walk(GAMES):
        dirs.sort()
        for x in sorted(fs):
            if x.endswith('.json'): st = os.stat(os.path.join(root, x)); h.update(f'{os.path.relpath(os.path.join(root, x), GAMES)}|{st.st_size}|{st.st_mtime_ns}\n'.encode())
    return h.hexdigest()

def save_games(ls, stamp):
    """ls의 게임 기록을 폴더로 나눠 쓰고, 나머지 ls와 게임 id 목록을 돌려줘요."""
    os.makedirs(GAMES, exist_ok=True); rest, games, projects = {}, {}, None
    for k, v in ls.items():  # 먼저 전부 읽고 확인한 뒤에 써요(중간에 실패해도 폴더가 반쯤 바뀌지 않게)
        m = GAME_KEY.match(k)
        if k == PROJECTS: projects = json.loads(v); continue
        if not m: rest[k] = v; continue
        g = json.loads(v)
        if not isinstance(g, dict) or not isinstance(g.get('chars'), list): raise ValueError('게임 기록 형식이 올바르지 않아요: ' + k)
        games[m.group(1) or 'main'] = g
    ix = os.path.join(GAMES, 'index.json')
    if projects is not None: put_json(ix, projects)
    elif not os.path.exists(ix):  # 앱이 게임 목록을 아직 저장한 적 없음(샘플 게임만): 폴더 목록을 알 수 있게 기본값을 써 둬요. 앱으로 보내지는 않아요
        put_json(ix, {'active': 'main', 'list': [{'id': g, 'title': str((games[g].get('meta') or {}).get('title', ''))} for g in games], 'generated': True})
    gids = list(games)
    for gid, g in games.items():
        d = os.path.join(GAMES, gid); os.makedirs(d, exist_ok=True)
        files = {t: g[t] for t in TYPES if t in g}; files['game'] = {x: y for x, y in g.items() if x not in TYPES}
        for name, o in files.items(): put_json(os.path.join(d, name + '.json'), o)
        for x in os.listdir(d):
            if x.endswith('.json') and x[:-5] not in files: os.remove(os.path.join(d, x))
    # 앱에서 지운 게임 폴더는 지우지 않고 history로 옮겨요
    for x in os.listdir(GAMES):
        d = os.path.join(GAMES, x)
        if x not in gids and os.path.isfile(os.path.join(d, 'game.json')):
            bk = os.path.join(DATA, 'history'); os.makedirs(bk, exist_ok=True); shutil.move(d, os.path.join(bk, 'deleted-' + x + '-' + stamp))
    return rest, gids

def load_state(f):
    """state.json + data 폴더 → 앱이 보낸 모양 그대로의 전체 상태"""
    st = jload(f)
    if '_dataGames' not in st: return st  # 예전 형식(게임이 state.json 안에): 다음 저장 때 폴더로 나눠요
    sig = data_sig()
    if st.get('_dataSig') and sig != st['_dataSig']:
        # data 폴더를 직접 고쳤어요: 새 저장으로 표시해서 앱이 받아 가게 해요(앱은 받기 전까지 자동 저장으로 덮어쓰지 않아요)
        st.update(at=int(time.time() * 1000), device='PC data 폴더(직접 수정)', devId='pc-data', _dataSig=sig)
        awrite(f, json.dumps(st, ensure_ascii=False).encode())
    st = dict(st); gids = st.pop('_dataGames'); st.pop('_dataSig', None)
    ls = dict(st.get('ls') or {})
    ix = os.path.join(GAMES, 'index.json')
    if os.path.exists(ix):
        pj = jload(ix)
        if not pj.get('generated'): ls[PROJECTS] = json.dumps(pj, ensure_ascii=False, separators=(',', ':'))
    for gid in gids:
        d = os.path.join(GAMES, gid)
        if not os.path.isfile(os.path.join(d, 'game.json')): raise ValueError(f'data/{gid}/game.json 이 없어요. 폴더를 지웠다면 PC 백업(ggm-data/history)에서 되살려 주세요')
        g = jload(os.path.join(d, 'game.json'))
        for t in TYPES:
            fp = os.path.join(d, t + '.json')
            if os.path.exists(fp): g[t] = jload(fp)
        if not isinstance(g.get('chars'), list): raise ValueError(f'data/{gid}/chars.json 이 없거나 배열이 아니에요')
        ls[game_key(gid)] = json.dumps(g, ensure_ascii=False, separators=(',', ':'))
    st['ls'] = ls
    return st

def migrate():
    """예전 서버의 state.json(게임 전체가 한 파일)을 data 폴더로 나눠요. 원본은 history에 복사해 둬요."""
    sf = os.path.join(DATA, 'state.json')
    if not os.path.exists(sf): return False
    st = json.load(open(sf, encoding='utf-8'))
    if '_dataGames' in st: return False
    stamp = time.strftime('%Y%m%d-%H%M%S-') + str(time.time_ns()); bk = os.path.join(DATA, 'history'); os.makedirs(bk, exist_ok=True)
    shutil.copy(sf, os.path.join(bk, 'state-' + stamp + '.json')); save_state(sf, st, stamp); return True

def save_state(f, st, stamp):
    rest, gids = save_games(st['ls'], stamp)
    awrite(f, json.dumps(dict(st, ls=rest, _dataGames=gids, _dataSig=data_sig()), ensure_ascii=False).encode())  # 게임 폴더를 다 쓴 뒤 마지막에

# ---------- 게임 파일 받기 (항상 최신) ----------
FILES = ['index.html', 'manifest.webmanifest', 'sw.js', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png']
def update_www():
    ok = 0
    for f in FILES:
        url = f'{RAW}/{REPO}/{BRANCH}/www/{f}?t={int(time.time())}'
        try:
            data = urllib.request.urlopen(url, timeout=30).read()
            open(os.path.join(WWW, f), 'wb').write(data); ok += 1
        except Exception as e:
            if not os.path.exists(os.path.join(WWW, f)): log('  ! 받지 못함:', f, e)
    log(f'게임 파일 확인 완료 ({ok}/{len(FILES)} 최신, {REPO}@{BRANCH})')

def www_build():
    try: return (re.search(r"var BUILT='([^']+)'", open(os.path.join(WWW, 'index.html'), encoding='utf-8').read()) or [None, '?'])[1]
    except Exception: return '없음'

# ---------- HTTP 서버 ----------
HOP = {'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailers', 'transfer-encoding', 'upgrade', 'host', 'origin', 'referer', 'cookie', 'content-length', 'x-ggm-key', 'accept-encoding'}
class H(http.server.SimpleHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'
    def __init__(self, *a, **k): super().__init__(*a, directory=WWW, **k)
    def log_message(self, *a): pass
    def cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS')
        self.send_header('Access-Control-Expose-Headers', '*')
    def end_headers(self):
        if self.path.startswith('/api/'): self.cors()
        super().end_headers()
    def do_OPTIONS(self):
        self.send_response(204); self.send_header('Content-Length', '0'); self.end_headers()
    def authed(self):
        q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        k = self.headers.get('X-GGM-Key') or (q.get('k') or [''])[0]
        return secrets.compare_digest(k, KEY)
    def jsend(self, code, obj):
        b = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code); self.send_header('Content-Type', 'application/json; charset=utf-8'); self.send_header('Content-Length', str(len(b))); self.end_headers(); self.wfile.write(b)
    def body(self):
        n = int(self.headers.get('Content-Length') or 0)
        return self.rfile.read(n) if n else b''
    def do_GET(self):
        if self.path.startswith('/api/'): return self.api('GET')
        if self.path.startswith('/connect'): return self.connect_page()
        p = urllib.parse.urlparse(self.path).path
        if p in ('/', ''): self.path = '/index.html'
        return super().do_GET()
    def do_POST(self): return self.api('POST') if self.path.startswith('/api/') else self.send_error(404)
    def do_PUT(self): return self.api('PUT') if self.path.startswith('/api/') else self.send_error(404)
    def do_DELETE(self): return self.api('DELETE') if self.path.startswith('/api/') else self.send_error(404)
    def do_PATCH(self): return self.api('PATCH') if self.path.startswith('/api/') else self.send_error(404)
    def connect_page(self):
        if self.client_address[0] not in ('127.0.0.1', '::1'): return self.send_error(403)
        url = PUBLIC['url']; lan = lan_url()
        html = f'''<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>가챠 게임 메이커 PC 서버</title>
<style>body{{font-family:sans-serif;background:#0b0d14;color:#eee;text-align:center;padding:30px}}a{{color:#ffb400;word-break:break-all}}.qr{{background:#fff;display:inline-block;padding:18px;margin:16px}}small{{color:#999}}</style>
<h1>가챠 게임 메이커 · PC 서버</h1><p>휴대폰 카메라로 QR을 찍으면 바로 연결돼요.</p>
<div id="q" class="qr"></div><p><a href="{url}">{url or '(외부 주소 준비 중… 잠시 뒤 새로고침 해 보세요)'}</a></p>
<h3 style="margin-top:28px">같은 와이파이라면</h3><div id="q2" class="qr"></div><p><small><a href="{lan}">{lan}</a></small></p>
<p><small>아이폰: 기본 카메라 앱으로 QR을 비추고 위에 뜨는 노란 주소를 눌러 Safari로 열어요. 게임은 이 PC(ggm-data)에 저장돼서, 주소가 바뀌어도 QR을 다시 찍으면 그대로 이어져요.<br>QR이 안 읽히면 위 주소를 카카오톡 '나와의 채팅' 등으로 휴대폰에 보내 열어도 돼요(다른 사람에게는 보내지 마세요).</small></p>
<p><small>이 창(검은 창)을 닫으면 바깥 주소가 사라져요. 주소에는 비밀 키가 들어 있으니 다른 사람에게 보내지 마세요.</small></p>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
<script>function mk(id,t){{if(!t||!window.QRCode)return;try{{new QRCode(document.getElementById(id),{{text:t,width:280,height:280,correctLevel:QRCode.CorrectLevel.L}});}}catch(e){{document.getElementById(id).textContent='QR을 만들지 못했어요. 아래 주소를 직접 열어 주세요.';}}}}
mk("q","{url}");mk("q2","{lan}");if(!"{url}")setTimeout(function(){{location.reload()}},5000);</script>'''.encode()
        self.send_response(200); self.send_header('Content-Type', 'text/html; charset=utf-8'); self.send_header('Content-Length', str(len(html))); self.end_headers(); self.wfile.write(html)
    def api(self, m):
        path = urllib.parse.urlparse(self.path).path
        if path == '/api/hello' and m == 'GET': return self.jsend(200, {'ok': True, 'app': 'ggm-pc', 'ver': SERVER_VER, 'auth': self.authed(), 'host': socket.gethostname()})
        if not self.authed(): return self.jsend(401, {'error': 'bad key'})
        try:
            if path == '/api/proxy': return self.proxy(m)
            if path == '/api/update' and m == 'POST': self.body(); update_www(); return self.jsend(200, {'ok': True})
            if path == '/api/store/state':
                f = os.path.join(DATA, 'state.json')
                if m == 'GET':
                    if not os.path.exists(f): return self.jsend(404, {'error': 'none'})
                    with STORE_LOCK: b = json.dumps(load_state(f), ensure_ascii=False).encode()
                    self.send_response(200); self.send_header('Content-Type', 'application/json'); self.send_header('Content-Length', str(len(b))); self.end_headers(); self.wfile.write(b); return
                if m not in ('POST', 'PUT'): return self.jsend(405, {'error': 'method not allowed'})
                b = self.body(); incoming = json.loads(b)
                if not isinstance(incoming, dict) or not isinstance(incoming.get('ls'), dict): return self.jsend(400, {'error': 'invalid state'})
                bk = os.path.join(DATA, 'history'); os.makedirs(bk, exist_ok=True)
                # Two devices may finish uploading together. Compare and replace under one lock.
                with STORE_LOCK:
                    current = json.load(open(f, encoding='utf-8')) if os.path.exists(f) else {}
                    if 'baseAt' in incoming and incoming['baseAt'] != current.get('at', 0): return self.jsend(409, {'error': '다른 기기에서 먼저 저장했습니다. 최신 진행을 확인한 뒤 다시 시도해 주세요.'})
                    stamp = time.strftime('%Y%m%d-%H%M%S-') + str(time.time_ns())
                    # 백업(history)은 예전처럼 전체 상태 한 파일이에요. 크게 줄어든 저장 직전 상태는 keep-으로 따로 남겨요
                    hs = sorted(x for x in os.listdir(bk) if x.startswith('state-'))
                    if hs and len(b) < os.path.getsize(os.path.join(bk, hs[-1])) * 0.6:
                        shutil.copy(os.path.join(bk, hs[-1]), os.path.join(bk, 'keep-' + stamp + '.json'))
                        ks = sorted(x for x in os.listdir(bk) if x.startswith('keep-')); [os.remove(os.path.join(bk, x)) for x in ks[:-10]]
                    save_state(f, incoming, stamp)
                    awrite(os.path.join(bk, 'state-' + stamp + '.json'), b)
                    hs = sorted(x for x in os.listdir(bk) if x.startswith('state-')); [os.remove(os.path.join(bk, x)) for x in hs[:-20]]
                return self.jsend(200, {'ok': True})
            if path == '/api/store/history' and m == 'GET':
                bk = os.path.join(DATA, 'history'); items = []
                for x in (os.listdir(bk) if os.path.isdir(bk) else []):
                    if not re.match(r'^(state|keep)-[0-9-]+\.json$', x): continue
                    fp = os.path.join(bk, x); it = {'name': x, 'keep': x.startswith('keep-'), 'size': os.path.getsize(fp), 'at': int(os.path.getmtime(fp) * 1000)}
                    try:
                        j = json.load(open(fp, encoding='utf-8')); it['at'] = j.get('at') or it['at']; it['device'] = j.get('device', '')
                        pj = json.loads((j.get('ls') or {}).get('starfall-projects') or 'null') or {}; it['games'] = [str(g.get('title', ''))[:30] for g in (pj.get('list') or [])][:6] or [str((json.loads((j.get('ls') or {}).get('starfall-contract-v1') or '{}').get('meta') or {}).get('title', ''))[:30]]
                    except Exception: pass
                    items.append(it)
                items.sort(key=lambda i: i['at'], reverse=True)
                return self.jsend(200, {'items': items})
            mh = re.match(r'^/api/store/history/((?:state|keep)-[0-9-]+\.json)$', path)
            if mh and m == 'GET':
                fp = os.path.join(DATA, 'history', mh.group(1))
                if not os.path.exists(fp): return self.jsend(404, {'error': 'none'})
                b = open(fp, 'rb').read(); self.send_response(200); self.send_header('Content-Type', 'application/json'); self.send_header('Content-Length', str(len(b))); self.end_headers(); self.wfile.write(b); return
            if path == '/api/lease':
                # 한 번에 한 기기만 플레이: claim(차지) · beat(살아 있음) · want(넘겨 달라) · give(넘겨 줌) · away(자리 비움)
                with LEASE_LOCK:
                    now = time.time() * 1000
                    if m == 'POST':
                        j = json.loads(self.body() or b'{}'); op = j.get('op'); did = str(j.get('id', ''))[:64]; nm = str(j.get('name', ''))[:40]
                        if op == 'claim': LEASE.update({'id': did, 'name': nm, 'at': now, 'seen': now, 'away': False, 'want': None})
                        elif op == 'beat' and LEASE['id'] == did: LEASE.update({'seen': now, 'away': False})
                        elif op == 'want': LEASE['want'] = {'id': did, 'name': nm, 'at': now}
                        elif op == 'give' and LEASE['id'] == did and LEASE.get('want'): w = LEASE['want']; LEASE.update({'id': w['id'], 'name': w['name'], 'at': now, 'seen': now, 'away': False, 'want': None})
                        elif op == 'away' and LEASE['id'] == did: LEASE.update({'away': True, 'seen': now})
                        elif op == 'free' and LEASE['id'] == did: LEASE.update({'id': '', 'name': '', 'away': True, 'want': None})
                    return self.jsend(200, dict(LEASE, now=now))
            if path == '/api/store/list': return self.jsend(200, {'blobs': os.listdir(BLOBS)})
            mm = re.match(r'^/api/store/blob/([0-9a-f]{64})$', path)
            if mm:
                f = os.path.join(BLOBS, mm.group(1))
                if m == 'GET':
                    if not os.path.exists(f): return self.jsend(404, {'error': 'none'})
                    b = open(f, 'rb').read(); self.send_response(200); self.send_header('Content-Type', 'application/octet-stream'); self.send_header('Content-Length', str(len(b))); self.end_headers(); self.wfile.write(b); return
                j = json.loads(self.body()); data = base64.b64decode(j['content'])
                if hashlib.sha256(data).hexdigest() != mm.group(1): return self.jsend(400, {'error': 'hash mismatch'})
                awrite(f, data)
                return self.jsend(200, {'ok': True})
            return self.jsend(404, {'error': 'unknown'})
        except Exception as e:
            try: return self.jsend(500, {'error': str(e)})
            except Exception: pass
    def proxy(self, m):
        q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query); u = (q.get('u') or [''])[0]
        t = urllib.parse.urlparse(u)
        if t.scheme not in ('http', 'https') or not t.netloc: return self.jsend(400, {'error': 'bad url'})
        hdr = {k: v for k, v in self.headers.items() if k.lower() not in HOP}
        data = self.body() if m in ('POST', 'PUT', 'PATCH', 'DELETE') else None
        if data is not None and not data: data = None if m == 'DELETE' else b''
        req = urllib.request.Request(u, data=data, headers=hdr, method=m)
        try: r = urllib.request.urlopen(req, timeout=900)
        except urllib.error.HTTPError as e: r = e
        except Exception as e: return self.jsend(502, {'error': 'PC에서 연결하지 못했어요: ' + str(e)})
        b = r.read()
        self.send_response(r.status if hasattr(r, 'status') else r.code)
        for k, v in r.headers.items():
            if k.lower() not in HOP and not k.lower().startswith('access-control') and k.lower() != 'content-encoding': self.send_header(k, v)
        self.send_header('Content-Length', str(len(b))); self.end_headers(); self.wfile.write(b)

class Srv(socketserver.ThreadingMixIn, http.server.HTTPServer): daemon_threads = True; allow_reuse_address = True

def lan_url():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.connect(('8.8.8.8', 80)); ip = s.getsockname()[0]; s.close()
        return f'http://{ip}:{PORT}/?pc={KEY}'
    except Exception: return f'http://127.0.0.1:{PORT}/?pc={KEY}'

# ---------- Cloudflare 임시 주소 ----------
def cloudflared_path():
    exe = 'cloudflared.exe' if os.name == 'nt' else 'cloudflared'
    p = shutil.which('cloudflared') or os.path.join(HERE, exe)
    if os.path.exists(p): return p
    sysn, mach = platform.system().lower(), platform.machine().lower()
    arch = 'arm64' if mach in ('arm64', 'aarch64') else 'amd64'
    base = 'https://github.com/cloudflare/cloudflared/releases/latest/download/'
    log('cloudflared 받는 중… (처음 한 번)')
    try:
        if sysn == 'windows': urllib.request.urlretrieve(base + f'cloudflared-windows-{arch}.exe', p)
        elif sysn == 'darwin':
            tg = os.path.join(HERE, 'cf.tgz'); urllib.request.urlretrieve(base + f'cloudflared-darwin-{arch}.tgz', tg)
            with tarfile.open(tg) as t: t.extractall(HERE)
            os.remove(tg)
        else: urllib.request.urlretrieve(base + f'cloudflared-linux-{arch}', p)
        if os.name != 'nt': os.chmod(p, os.stat(p).st_mode | stat.S_IEXEC)
        return p
    except Exception as e:
        log('  ! cloudflared를 받지 못했어요:', e); return None

def tunnel():
    p = cloudflared_path()
    if not p: log('  → 외부 주소 없이 같은 와이파이에서만 쓸 수 있어요.'); return
    pr = subprocess.Popen([p, 'tunnel', '--no-autoupdate', '--url', f'http://127.0.0.1:{PORT}'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8', errors='ignore')
    for line in pr.stdout:
        m = re.search(r'https://[a-z0-9-]+\.trycloudflare\.com', line)
        if m and not PUBLIC['url']:
            PUBLIC['url'] = m.group(0) + '/?pc=' + KEY
            log('\n================ 연결 주소 ================')
            log(PUBLIC['url'])
            log('QR 코드 창을 열었어요. 휴대폰 카메라로 찍으세요.')
            log('==========================================\n')
            try: webbrowser.open(f'http://127.0.0.1:{PORT}/connect')
            except Exception: pass

if __name__ == '__main__':
    log('가챠 게임 메이커 PC 서버'); log('게임 데이터:', GAMES); log('설정·그림·백업:', DATA)
    if migrate(): log('예전 저장(state.json 한 파일)을 data 폴더로 나눴어요. 원본은 ggm-data/history에 있어요')
    if '--no-update' not in sys.argv: update_www()  # --no-update: www/를 그대로 씀(포크·로컬 빌드 시험용)
    log('앱 빌드:', www_build(), '(www/index.html)')
    srv = Srv(('0.0.0.0', PORT), H)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    log(f'이 PC에서 열기: http://127.0.0.1:{PORT}/?pc={KEY}')
    log(f'같은 와이파이 휴대폰: {lan_url()}')
    if '--no-tunnel' not in sys.argv: threading.Thread(target=tunnel, daemon=True).start()
    else:
        try: webbrowser.open(f'http://127.0.0.1:{PORT}/connect')
        except Exception: pass
    log('끄려면 이 창을 닫거나 Ctrl+C')
    try:
        while True: time.sleep(3600)
    except KeyboardInterrupt: pass
