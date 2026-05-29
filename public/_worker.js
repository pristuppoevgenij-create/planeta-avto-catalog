const API_BASE = 'https://api.maxposter.ru/partners-api';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const token = env.MAXPOSTER_TOKEN || 'Basic UGxhbmV0YUF1dG9DaGVseWFiaW5za0BtYXhwb3N0ZXIucnU6dzl1PUdNUG1jfg==';

    // POST /api/vehicles — список авто
    if (url.pathname === '/api/vehicles' && request.method === 'POST') {
      const body = await request.text();
      const resp = await fetch(`${API_BASE}/vehicles/active`, {
        method: 'POST',
        headers: { 'Authorization': token, 'Content-Type': 'application/json' },
        body: body || '{"pageSize":1000}',
      });
      const data = await resp.text();
      return new Response(data, { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }

    // GET /api/vehicles/:id — одно авто
    const match = url.pathname.match(/^\/api\/vehicles\/(\d+)$/);
    if (match && request.method === 'GET') {
      const id = match[1];
      const resp = await fetch(`${API_BASE}/vehicles/active`, {
        method: 'POST',
        headers: { 'Authorization': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageSize: 1000 }),
      });
      const data = await resp.json();
      const vehicle = (data.data?.vehicles || []).find(v => String(v.id) === id);
      if (!vehicle) return new Response(JSON.stringify({ error: 'not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ status: 'success', data: vehicle }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Всё остальное — статические файлы
    return env.ASSETS.fetch(request);
  }
};
