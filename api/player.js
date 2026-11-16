
const BASE = "https://prod.api-fortnite.com";

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const key = process.env.FORTNITE_API_KEY;

  if (!key) {
    return res.status(500).json({ error: "Server API key is not configured." });
  }

  const username = String(req.query.username || "").trim();
  const id = String(req.query.id || "").trim();

  if ((!username && !id) || (username && id)) {
    return res.status(400).json({ error: "Provide either username or id." });
  }

  if (username && (username.length > 64 || /[\u0000-\u001f]/.test(username))) {
    return res.status(400).json({ error: "Invalid username." });
  }

  if (id && !/^[a-zA-Z0-9_-]{5,128}$/.test(id)) {
    return res.status(400).json({ error: "Invalid account ID." });
  }

  const path = username
    ? "/api/v1/account/displayName/" + encodeURIComponent(username)
    : "/api/v2/stats/" + encodeURIComponent(id);

  try {
    const upstream = await fetch(BASE + path, {
      headers: {
        "x-api-key": key,
        "Accept": "application/json"
      },
      signal: AbortSignal.timeout(10000)
    });

    const body = await upstream.json().catch(() => null);

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: upstream.status === 404
          ? "Player not found."
          : "Fortnite provider returned an error."
      });
    }

    return res.status(200).json(body);
  } catch (error) {
    console.error("Fortnite API error:", error.message);
    return res.status(502).json({ error: "Could not contact Fortnite API." });
  }
};
