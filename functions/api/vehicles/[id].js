export async function onRequestGet(context) {
  const token = context.env.MAXPOSTER_TOKEN || 'Basic UGxhbmV0YUF1dG9DaGVseWFiaW5za0BtYXhwb3N0ZXIucnU6dzl1PUdNUG1jfg==';
  const { id } = context.params;

  const resp = await fetch('https://api.maxposter.ru/partners-api/vehicles/active', {
    method: 'POST',
    headers: {
      'Authorization': token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pageSize: 1000 }),
  });

  const data = await resp.json();
  const vehicle = (data.data?.vehicles || []).find(v => String(v.id) === id);

  if (!vehicle) {
    return new Response(JSON.stringify({ error: 'not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ status: 'success', data: vehicle }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
