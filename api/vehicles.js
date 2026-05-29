export const config = { runtime: 'edge' };

const TOKEN = "Basic UGxhbmV0YUF1dG9DaGVseWFiaW5za0BtYXhwb3N0ZXIucnU6dzl1PUdNUG1jfg==";
const ALLOWED_DEALERS = [9433, 10014];
const API = "https://api.maxposter.ru/partners-api/vehicles/active";
const CORS = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

async function fetchPage(offset) {
  const resp = await fetch(API, {
    method: "POST",
    headers: { "Authorization": TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify({ limit: 100, offset })
  });
  const data = await resp.json();
  return { vehicles: data.data?.vehicles || [], total: data.data?.meta?.range?.total || 0 };
}

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, { headers: { ...CORS, "Access-Control-Allow-Methods": "GET,POST", "Access-Control-Allow-Headers": "Content-Type" } });

  const first = await fetchPage(0);
  const total = first.total;
  const pages = Math.ceil(total / 100);
  const offsets = Array.from({ length: pages - 1 }, (_, i) => (i + 1) * 100);
  const rest = await Promise.all(offsets.map(fetchPage));
  const all = [first, ...rest].flatMap(p => p.vehicles);
  const vehicles = all.filter(v => ALLOWED_DEALERS.includes(v.dealer?.id));

  return new Response(
    JSON.stringify({ status: "success", data: { vehicles, pagination: { total: vehicles.length } } }),
    { headers: CORS }
  );
}