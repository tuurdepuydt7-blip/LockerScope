const API = "/api/player";
const $ = (id) => document.getElementById(id);
let currentAccountId = null;
let refreshTimer = null;

function setMessage(message, isError = false) {
  $("message").textContent = message;
  $("message").style.color = isError ? "#ff8585" : "#8ea1bc";
}
function number(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function fmt(value) {
  const n = number(value);
  return n === null ? "—" : Math.round(n).toLocaleString();
}
function flatten(obj, out = {}) {
  if (!obj || typeof obj !== "object") return out;
  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      flatten(value, out);
    } else if (value !== undefined && value !== null) {
      out[key.toLowerCase()] = value;
    }
  }
  return out;
}
function findValue(flat, aliases) {
  for (const alias of aliases) {
    const key = alias.toLowerCase();
    if (flat[key] !== undefined) return flat[key];
  }
  return null;
}
function mapStats(response) {
  console.log("FULL FORTNITE STATS RESPONSE:", response);
  const flat = flatten(response);
  console.log("FLATTENED STATS:", flat);

  const wins = findValue(flat, [
    "br_placetop1", "placetop1", "wins", "wins_total", "victories",
    "solo_wins", "duo_wins", "squad_wins"
  ]);
  const kills = findValue(flat, [
    "br_kills", "kills", "eliminations", "br_kills_total", "kills_total"
  ]);
  const deaths = findValue(flat, ["br_deaths", "deaths", "deaths_total"]);
  const matches = findValue(flat, [
    "br_matchesplayed", "matches", "matchesplayed", "matches_played", "games"
  ]);
  let kd = findValue(flat, ["br_kd", "kd", "kdr", "killdeathratio"]);
  let winRate = findValue(flat, ["br_winrate", "winrate", "win_rate"]);

  const w = number(wins), k = number(kills), d = number(deaths), m = number(matches);
  if (kd == null && k != null && d != null) kd = d === 0 ? k : k / d;
  if (winRate == null && w != null && m > 0) winRate = (w / m) * 100;

  return {
    wins: fmt(wins), kills: fmt(kills), deaths: fmt(deaths),
    matches: fmt(matches),
    kd: number(kd) === null ? "—" : number(kd).toFixed(2),
    winrate: number(winRate) === null ? "—" : `${number(winRate).toFixed(2)}%`,
    found: [wins, kills, deaths, matches, kd, winRate].some(v => v !== null && v !== undefined)
  };
}
async function requestJson(url) {
  const response = await fetch(url, { headers: { "Accept": "application/json" } });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); }
  catch { throw new Error(`Server returned non-JSON (HTTP ${response.status}). Check the Vercel deployment.`); }
  if (!response.ok) {
    const detail = data.details ? JSON.stringify(data.details) : (data.error || "");
    throw new Error(`API error ${response.status}: ${detail || "Request failed"}`);
  }
  return data;
}
async function resolveAccount(username) {
  const account = await requestJson(`${API}?username=${encodeURIComponent(username)}`);
  const id = account?.id || account?.accountId || account?.data?.id || account?.data?.accountId;
  const displayName = account?.displayName || account?.name || account?.data?.displayName || username;
  if (!id) throw new Error("The account lookup worked, but the response did not contain an account ID. Check the Vercel function logs.");
  return { id, displayName };
}
async function loadStats(accountId) {
  return requestJson(`${API}?id=${encodeURIComponent(accountId)}`);
}
function showStats(stats) {
  for (const key of ["wins", "kills", "deaths", "matches", "kd", "winrate"]) {
    $(key).textContent = stats[key];
  }
}
async function searchPlayer(username, keepMessage = false) {
  if (!username.trim()) return;
  $("searchButton").disabled = true;
  $("refreshButton").disabled = true;
  setMessage("Looking up player…");
  $("dashboard").hidden = true;
  try {
    const account = await resolveAccount(username.trim());
    currentAccountId = account.id;
    const response = await loadStats(account.id);
    const stats = mapStats(response);
    $("playerName").textContent = account.displayName;
    $("avatar").textContent = account.displayName.charAt(0).toUpperCase() || "?";
    $("accountId").textContent = `Epic account: ${account.id}`;
    showStats(stats);
    $("updated").textContent = `Updated ${new Date().toLocaleTimeString()}`;
    $("dashboard").hidden = false;
    setMessage(stats.found ? "Player statistics loaded." : "Player found, but no recognised stat fields were returned. See the browser Console for the full response.", !stats.found);
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(async () => {
      if (!currentAccountId) return;
      try {
        const updated = await loadStats(currentAccountId);
        const mapped = mapStats(updated);
        showStats(mapped);
        $("updated").textContent = `Updated ${new Date().toLocaleTimeString()}`;
      } catch (e) {
        console.error("Automatic refresh failed:", e);
        $("refreshText").textContent = `Auto-refresh error: ${e.message}`;
      }
    }, 60000);
  } catch (error) {
    console.error("LockerScope search failed:", error);
    setMessage(error.message, true);
  } finally {
    $("searchButton").disabled = false;
    $("refreshButton").disabled = false;
  }
}
$("searchForm").addEventListener("submit", event => {
  event.preventDefault();
  searchPlayer($("username").value);
});
$("refreshButton").addEventListener("click", async () => {
  if (!currentAccountId) return;
  $("refreshButton").disabled = true;
  try {
    const response = await loadStats(currentAccountId);
    const stats = mapStats(response);
    showStats(stats);
    $("updated").textContent = `Updated ${new Date().toLocaleTimeString()}`;
    setMessage(stats.found ? "Statistics refreshed." : "No recognised statistics in the API response.", !stats.found);
  } catch (error) {
    setMessage(error.message, true);
  } finally {
    $("refreshButton").disabled = false;
  }
});
