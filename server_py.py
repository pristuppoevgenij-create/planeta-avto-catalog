#!/usr/bin/env python3
"""
Планета Авто - сервер на Python (без доп. пакетов)
Запуск: python server_py.py
"""
import http.server
import urllib.request
import urllib.error
import json
import os
import sys

PORT = int(os.environ.get('PORT', 3000))
API_BASE = 'https://api.maxposter.ru/partners-api'
AUTH = 'Basic UGxhbmV0YUF1dG9DaGVseWFiaW5za0BtYXhwb3N0ZXIucnU6dzl1PUdNUG1jfg=='
PUBLIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public')

MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon',
}

class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # тихий режим

    def send_json(self, code, data):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', len(body))
        self.end_headers()
        self.wfile.write(body)

    def proxy_post(self, url, body_bytes):
        req = urllib.request.Request(url, data=body_bytes, method='POST')
        req.add_header('Authorization', AUTH)
        req.add_header('Content-Type', 'application/json')
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return resp.read()
        except urllib.error.HTTPError as e:
            return e.read()

    def proxy_get(self, url):
        req = urllib.request.Request(url)
        req.add_header('Authorization', AUTH)
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return resp.read()
        except urllib.error.HTTPError as e:
            return e.read()

    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length)

        if self.path == '/api/vehicles':
            raw = self.proxy_post(f'{API_BASE}/vehicles/active', body)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', len(raw))
            self.end_headers()
            self.wfile.write(raw)
        else:
            self.send_json(404, {'error': 'not found'})

    def do_GET(self):
        # API: одно авто
        if self.path.startswith('/api/vehicles/'):
            vid = self.path.split('/')[-1]
            raw = self.proxy_post(
                f'{API_BASE}/vehicles/active',
                json.dumps({'pageSize': 1000}).encode()
            )
            data = json.loads(raw)
            vehicles = data.get('data', {}).get('vehicles', [])
            vehicle = next((v for v in vehicles if str(v.get('id')) == vid), None)
            if vehicle:
                self.send_json(200, {'status': 'success', 'data': vehicle})
            else:
                self.send_json(404, {'error': 'not found'})
            return

        # Статические файлы
        path = self.path.split('?')[0]
        if path == '/':
            path = '/index.html'

        file_path = os.path.join(PUBLIC_DIR, path.lstrip('/'))
        if os.path.isfile(file_path):
            ext = os.path.splitext(file_path)[1].lower()
            mime = MIME.get(ext, 'application/octet-stream')
            with open(file_path, 'rb') as f:
                content = f.read()
            self.send_response(200)
            self.send_header('Content-Type', mime)
            self.send_header('Content-Length', len(content))
            self.end_headers()
            self.wfile.write(content)
        else:
            self.send_json(404, {'error': 'file not found'})


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    print(f'\nСайт запущен!')
    print(f'   Откройте браузер: http://localhost:{PORT}\n')
    print('   Для остановки нажмите Ctrl+C\n')

    import webbrowser
    import threading
    threading.Timer(1.5, lambda: webbrowser.open(f'http://localhost:{PORT}')).start()

    server = http.server.HTTPServer(('0.0.0.0', PORT), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n Сервер остановлен.')
