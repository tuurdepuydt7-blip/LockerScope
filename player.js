const BASE = "https://prod.api-fortnite.com";

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const key = process.env.FORTNITE_API_KEY;
  if (!key) {
    return res.status(500).json({
      error: "Missing FORTNITE_API_KEY environment variable in Vercel"
    });
  }

  const username = typeof req.query.username === "string" ? req.query.username.trim() : "";
  const id = typeof req.query.id === "string" ? req.query.id.trim() : "";
  if ((!username && !id) || (username && id)) {
    return res.status(400).json({ error: "Provide exactly one parameter: username OR id" });
  }

  const path = username
    ? `/api/v1/account/displayName/${encodeURIComponent(username)}`
    : `/api/v2/stats/${encodeURIComponent(id)}`;

  try {
    const response = await fetch(BASE + path, {
      method: "GET",
      headers: { "x-api-key": key, "Accept": "application/json" },
      signal: AbortSignal.timeout(9000)
    });
    const raw = await response.text();
    let data;
    try { data = JSON.parse(raw); }
    catch {
      return res.status(502).json({
        error: "Fortnite provider returned a non-JSON response",
        providerStatus: response.status,
        responsePreview: raw.slice(0, 300)
      });
    }
    if (!response.ok) {
      return res.status(response.status).json({
        error: "Fortnite provider request failed",
        providerStatus: response.status,
        details: data
      });
    }
    return res.status(200).json(data);
  } catch (error) {
    return res.status(502).json({ error: error.name === "TimeoutError" ? "Fortnite provider timed out" : error.message });
  }
};
