export const config = { runtime: 'edge' };

const TOKEN = "Basic UGxhbmV0YUF1dG9DaGVseWFiaW5za0BtYXhwb3N0ZXIucnU6dzl1PUdNUG1jfg==";
const API = "https://api.maxposter.ru/partners-api/vehicles/active";
const CORS = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
const DEALER_FILTER = [{ "fields": ["dealer"], "type": "in", "value": [9433, 10014] }];

async function fetchPage(offset) {
  const resp = await fetch(API, {
    method: "POST",
    headers: { "Authorization": TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify({ limit: 100, offset, filters: DEALER_FILTER })
  });
  const data = await resp.json();
  return { vehicles: data.data?.vehicles || [], total: data.data?.meta?.range?.total || 0 };
}

export default async function handler(req) {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();

  const first = await fetchPage(0);
  const total = first.total;
  const pages = Math.ceil(total / 100);
  const offsets = Array.from({ length: pages - 1 }, (_, i) => (i + 1) * 100);
  const rest = await Promise.all(offsets.map(fetchPage));
  const vehicles = [first, ...rest].flatMap(p => p.vehicles);
  const v = vehicles.find(x => String(x.id) === id);

  if (!v) return new Response('{"error":"not found"}', { status: 404, headers: CORS });
  return new Response(JSON.stringify({ status: "success", data: v }), { headers: CORS });
}