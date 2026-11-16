
const $ = id => document.getElementById(id);
let currentPlayer = null;
let refreshTimer = null;
let previousStats = null;

function message(text, color="#8ea1bc") {
  $("message").textContent = text;
  $("message").style.color = color;
}

async function request(url) {
  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function unwrap(data) {
  return data?.data ?? data?.result ?? data;
}

function format(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "—";
  return Number(value).toLocaleString();
}

function mapStats(raw) {
  const s = raw?.stats || raw?.all || raw?.lifetime || raw;

  const wins = s.wins ?? s.placetop1 ?? s.placementTop1;
  const kills = s.kills ?? s.eliminations;
  const deaths = s.deaths;
  const matches = s.matches ?? s.matchesPlayed ?? s.matches_played;
  const kd = s.kd ?? s.kdr ?? (
    kills != null && deaths > 0 ? kills / deaths : null
  );
  const winRate = s.winRate ?? s.winrate ?? (
    wins != null && matches > 0 ? wins / matches * 100 : null
  );

  return {
    wins: format(wins),
    kills: format(kills),
    deaths: format(deaths),
    matches: format(matches),
    kd: kd == null ? "—" : Number(kd).toFixed(2),
    winrate: winRate == null ? "—" : Number(winRate).toFixed(2) + "%"
  };
}

function showStats(stats) {
  for (const key of Object.keys(stats)) {
    $(key).textContent = stats[key];
  }

  const changed = previousStats &&
    JSON.stringify(previousStats) !== JSON.stringify(stats);

  $("refreshText").textContent = changed
    ? "📈 Statistics changed since the previous update!"
    : "Statistics refresh automatically every 60 seconds.";

  previousStats = stats;
  $("updated").textContent = "Updated " + new Date().toLocaleTimeString();
}

async function refreshStats() {
  if (!currentPlayer) return;

  try {
    message("Updating statistics...");
    const response = await request(
      "/api/player?id=" + encodeURIComponent(currentPlayer.id)
    );

    const stats = mapStats(unwrap(response));
    showStats(stats);
    message("Statistics successfully updated.", "#55e6a5");
  } catch (error) {
    message(error.message, "#ff8585");
  }
}

async function searchPlayer(event) {
  event.preventDefault();

  const username = $("username").value.trim();
  if (!username) return;

  $("searchButton").disabled = true;
  $("searchButton").textContent = "SEARCHING...";
  $("dashboard").hidden = true;
  message("Searching for player...");

  try {
    const response = await request(
      "/api/player?username=" + encodeURIComponent(username)
    );

    const account = unwrap(response);
    const id = account?.id || account?.accountId || account?.account_id;
    const name = account?.displayName || account?.display_name || account?.name || username;

    if (!id) throw new Error("No supported public account was found.");

    currentPlayer = { id, name };
    previousStats = null;

    $("playerName").textContent = name;
    $("avatar").textContent = name.charAt(0).toUpperCase();
    $("accountId").textContent = "Account ID: " + id;
    $("dashboard").hidden = false;

    await refreshStats();

    clearInterval(refreshTimer);
    refreshTimer = setInterval(refreshStats, 60000);
  } catch (error) {
    message(error.message, "#ff8585");
  } finally {
    $("searchButton").disabled = false;
    $("searchButton").textContent = "SEARCH PLAYER →";
  }
}

$("searchForm").addEventListener("submit", searchPlayer);
$("refreshButton").addEventListener("click", refreshStats);
