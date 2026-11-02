#!/usr/bin/env python3
# PC 서버 데이터 폴더 검사: python3 pc/test_store.py
# 실제 HTTP로 저장·받기를 해서 data/<게임id>/<종류>.json 배치, 왕복 동일성, 바뀐 파일만 쓰기, 충돌 409, 삭제 보존, 예전 형식 이전을 확인해요.
import importlib.util, json, os, shutil, sys, tempfile, threading, urllib.request, urllib.error

tmp = tempfile.mkdtemp(prefix='ggm-pc-')
try:
    shutil.copy(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ggm-server.py'), tmp)
    spec = importlib.util.spec_from_file_location('ggm', os.path.join(tmp, 'ggm-server.py')); S = importlib.util.module_from_spec(spec); spec.loader.exec_module(S)
    srv = S.Srv(('127.0.0.1', 0), S.H); threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{srv.server_address[1]}'

    def call(method, path, body=None):
        req = urllib.request.Request(base + path, method=method, data=None if body is None else json.dumps(body).encode(), headers={'X-GGM-Key': S.KEY, 'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(req) as r: return r.status, json.loads(r.read() or b'{}')
        except urllib.error.HTTPError as e: return e.code, json.loads(e.read() or b'{}')

    game = lambda title, gold: {'ver': 3, 'meta': {'title': title}, 'world': {'factions': []}, 'chars': [{'id': 'sera', 'name': '세라'}], 'chapters': [], 'lib': [], 'threads': [], 'prog': {'gold': gold, 'savedAt': 1}, 'extra': {'x': 1}}
    ls = {'starfall-projects': json.dumps({'active': 'main', 'list': [{'id': 'main', 'title': 'A'}, {'id': 'g2', 'title': 'B'}]}),
          'starfall-contract-v1': json.dumps(game('A', 1), ensure_ascii=False), 'starfall-contract-v1-g2': json.dumps(game('B', 2), ensure_ascii=False), 'starfall-sound': '{"bgmVol":0.5}'}
    st = {'v': 1, 'at': 100, 'baseAt': 0, 'device': 't', 'ls': ls, 'bin': {}, 'types': {}}
    assert call('POST', '/api/store/state', st) == (200, {'ok': True})

    D = S.GAMES
    assert sorted(os.listdir(D)) == ['g2', 'index.json', 'main'], os.listdir(D)
    assert sorted(os.listdir(os.path.join(D, 'main'))) == sorted(['meta.json', 'world.json', 'chars.json', 'chapters.json', 'lib.json', 'threads.json', 'prog.json', 'game.json'])
    assert json.load(open(os.path.join(D, 'main', 'chars.json'), encoding='utf-8'))[0]['name'] == '세라'
    assert json.load(open(os.path.join(D, 'main', 'game.json'))) == {'ver': 3, 'extra': {'x': 1}}
    small = json.load(open(os.path.join(S.DATA, 'state.json')))
    assert 'starfall-contract-v1' not in small['ls'] and small['_dataGames'] == ['main', 'g2'], small
    print('ok 1  data/<게임id>/<종류>.json 으로 나눠 저장, state.json에는 게임이 없음')

    code, got = call('GET', '/api/store/state')
    assert code == 200 and '_dataGames' not in got and set(got['ls']) == set(ls)
    assert all(json.loads(got['ls'][k]) == json.loads(v) for k, v in ls.items())
    print('ok 2  받기: 앱이 보낸 상태와 같은 내용으로 다시 합쳐짐')

    mt = {f: os.stat(os.path.join(D, 'main', f)).st_mtime_ns for f in os.listdir(os.path.join(D, 'main'))}
    ls2 = dict(ls, **{'starfall-contract-v1': json.dumps(game('A', 999), ensure_ascii=False)})
    assert call('POST', '/api/store/state', dict(st, at=200, baseAt=100, ls=ls2))[0] == 200
    changed = [f for f, t in mt.items() if os.stat(os.path.join(D, 'main', f)).st_mtime_ns != t]
    assert changed == ['prog.json'], changed
    print('ok 3  바뀐 종류(prog.json)만 다시 씀')

    assert call('POST', '/api/store/state', dict(st, at=300, baseAt=100))[0] == 409
    print('ok 4  다른 기기가 먼저 저장했으면 409 (덮어쓰지 않음)')

    ls3 = {k: v for k, v in ls2.items() if k != 'starfall-contract-v1-g2'}
    assert call('POST', '/api/store/state', dict(st, at=400, baseAt=200, ls=ls3))[0] == 200
    hist = os.listdir(os.path.join(S.DATA, 'history'))
    assert 'g2' not in os.listdir(D) and any(x.startswith('deleted-g2-') for x in hist), hist
    assert len([x for x in hist if x.startswith('state-')]) == 3
    print('ok 5  앱에서 지운 게임 폴더는 history/deleted-* 로 옮김, 저장마다 전체 백업 유지')

    shutil.rmtree(D); json.dump(dict(st, ls=ls), open(os.path.join(S.DATA, 'state.json'), 'w'))  # 예전 서버 형식
    assert S.migrate() and not S.migrate()
    code, got = call('GET', '/api/store/state')
    assert sorted(os.listdir(D)) == ['g2', 'index.json', 'main'] and all(json.loads(got['ls'][k]) == json.loads(v) for k, v in ls.items())
    print('ok 6  예전 state.json → data 폴더 이전 (한 번만, 내용 같음)')
    srv.shutdown()
finally:
    shutil.rmtree(tmp, ignore_errors=True)
