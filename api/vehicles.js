const TOKEN = "Basic UGxhbmV0YUF1dG9DaGVseWFiaW5za0BtYXhwb3N0ZXIucnU6dzl1PUdNUG1jfg==";
const ALLOWED_DEALERS = [9433, 10014];
const API = "https://api.maxposter.ru/partners-api/vehicles/active";

async function fetchPage(offset) {
  const resp = await fetch(API, {
    method: "POST",
    headers: { "Authorization": TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify({ limit: 100, offset })
  });
  const data = await resp.json();
  return { vehicles: data.data?.vehicles || [], total: data.data?.meta?.range?.total || 0 };
}

async function fetchAll() {
  const first = await fetchPage(0);
  const total = first.total;
  const pages = Math.ceil(total / 100);
  const offsets = [];
  for (let i = 1; i < pages; i++) offsets.push(i * 100);
  const rest = await Promise.all(offsets.map(fetchPage));
  const all = [first, ...rest].flatMap(p => p.vehicles);
  return all.filter(v => ALLOWED_DEALERS.includes(v.dealer?.id));
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(404).end();
  const vehicles = await fetchAll();
  res.json({ status: "success", data: { vehicles, pagination: { total: vehicles.length } } });
}