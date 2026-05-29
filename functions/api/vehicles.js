export async function onRequestPost(context) {
  const token = context.env.MAXPOSTER_TOKEN || 'Basic UGxhbmV0YUF1dG9DaGVseWFiaW5za0BtYXhwb3N0ZXIucnU6dzl1PUdNUG1jfg==';
  const body = await context.request.text();

  const resp = await fetch('https://api.maxposter.ru/partners-api/vehicles/active', {
    method: 'POST',
    headers: {
      'Authorization': token,
      'Content-Type': 'application/json',
    },
    body: body || '{"pageSize":1000}',
  });

  const data = await resp.text();
  return new Response(data, {
    headers: { 'Content-Type': 'application/json' },
  });
}
