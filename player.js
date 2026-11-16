
const BASE = "https://prod.api-fortnite.com";

module.exports = async function handler(req, res) {
  const key = process.env.FORTNITE_API_KEY;

  if (!key) {
    return res.status(500).json({ error: "Missing API key" });
  }

  const { username, id } = req.query;

  if ((!username && !id) || (username && id)) {
    return res.status(400).json({
      error: "Provide username OR id"
    });
  }

  const path = username
    ? `/api/v1/account/displayName/${encodeURIComponent(username)}`
    : `/api/v2/stats/${encodeURIComponent(id)}`;

  try {
    const response = await fetch(BASE + path, {
      headers: {
        "x-api-key": key,
        "Accept": "application/json"
      }
    });

    const raw = await response.text();

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return res.status(502).json({
        error: "Invalid JSON from Fortnite API",
        response: raw.slice(0, 500)
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Fortnite API error",
        providerStatus: response.status,
        details: data
      });
    }

    return res.status(200).json(data);

  } catch (error) {
    return res.status(502).json({
      error: error.message
    });
  }
};
