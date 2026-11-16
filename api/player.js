
const BASE = "https://prod.api-fortnite.com";

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const key = process.env.FORTNITE_API_KEY;

  if (!key) {
    return res.status(500).json({
      error: "FORTNITE_API_KEY is missing in Vercel Environment Variables."
    });
  }

  const username = String(req.query.username || "").trim();
  const id = String(req.query.id || "").trim();

  if ((!username && !id) || (username && id)) {
    return res.status(400).json({
      error: "Provide a username or an account ID."
    });
  }

  const path = username
    ? "/api/v1/account/displayName/" + encodeURIComponent(username)
    : "/api/v2/stats/" + encodeURIComponent(id);

  try {
    const response = await fetch(BASE + path, {
      method: "GET",
      headers: {
        "x-api-key": key,
        "Accept": "application/json"
      },
      signal: AbortSignal.timeout(15000)
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("Provider error:", response.status, result);

      return res.status(response.status).json({
        error: username
          ? "Username lookup failed."
          : "Could not retrieve player statistics.",
        providerStatus: response.status,
        providerResponse: result
      });
    }

    if (!result) {
      return res.status(502).json({
        error: "The Fortnite API returned invalid JSON."
      });
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error("Backend error:", error);

    return res.status(502).json({
      error: "Could not connect to Fortnite API.",
      details: error.message
    });
  }
};
