const TOKEN = "Basic UGxhbmV0YUF1dG9DaGVseWFiaW5za0BtYXhwb3N0ZXIucnU6dzl1PUdNUG1jfg==";
const ALLOWED_DEALERS = [9433, 10014];
const API = "https://api.maxposter.ru/partners-api/vehicles/active";

async function fetchAll() {
  let all = [];
  let offset = 0;
  while (true) {
    const resp = await fetch(API, {
      method: "POST",
      headers: { "Authorization": TOKEN, "Content-Type": "application/json" },
      body: JSON.stringify({ limit: 100, offset })
    });
    const data = await resp.json();
    const vehicles = data.data?.vehicles || [];
    all = all.concat(vehicles);
    const total = data.data?.meta?.range?.total || vehicles.length;
    if (all.length >= total || vehicles.length < 100) break;
    offset += 100;
  }
  return all.filter(v => ALLOWED_DEALERS.includes(v.dealer?.id));
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { id } = req.query;
  const vehicles = await fetchAll();
  const v = vehicles.find(x => String(x.id) === id);
  if (!v) return res.status(404).json({ error: "not found" });
  res.json({ status: "success", data: v });
}