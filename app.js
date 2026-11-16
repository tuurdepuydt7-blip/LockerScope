const form = document.getElementById('searchForm');
const usernameInput = document.getElementById('username');
const searchButton = document.getElementById('searchButton');
const refreshButton = document.getElementById('refreshButton');
const message = document.getElementById('message');
const dashboard = document.getElementById('dashboard');

let currentAccountId = null;
let currentDisplayName = '';
let refreshTimer = null;

function format(value) {
  if (value === null || value === undefined || value === '') return '—';
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString() : String(value);
}

function getStatsObject(response) {
  let data = response?.data ?? response;
  // Some API responses wrap the stats in one or more objects.
  if (data?.data) data = data.data;
  const candidates = [
    data?.stats?.all,
    data?.stats?.keyboardMouse,
    data?.stats?.keyboard_mouse,
    data?.stats?.lifetime,
    data?.stats,
    data?.all,
    data?.lifetime,
    data
  ];
  return candidates.find(value => value && typeof value === 'object' && !Array.isArray(value)) ?? {};
}

function firstValue(object, keys) {
  for (const key of keys) {
    const value = object?.[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return null;
}

function mapStats(response) {
  console.log('FULL FORTNITE STATS RESPONSE:', response);
  const stats = getStatsObject(response);
  console.log('EXTRACTED STATS:', stats);

  const wins = firstValue(stats, ['br_placetop1', 'placetop1', 'wins', 'wins_total', 'winsTotal']);
  const kills = firstValue(stats, ['br_kills', 'kills', 'eliminations', 'br_kills_total', 'kills_total']);
  const deaths = firstValue(stats, ['br_deaths', 'deaths', 'deaths_total']);
  const matches = firstValue(stats, ['br_matchesplayed', 'matches', 'matchesPlayed', 'matches_played']);
  let kd = firstValue(stats, ['br_kd', 'kd', 'kdr']);
  let winRate = firstValue(stats, ['br_winrate', 'winRate', 'winrate', 'win_rate']);

  if (kd == null && kills != null && deaths != null && Number(deaths) > 0) {
    kd = Number(kills) / Number(deaths);
  }
  if (winRate == null && wins != null && matches != null && Number(matches) > 0) {
    winRate = Number(wins) / Number(matches) * 100;
  }

  return {
    wins: format(wins),
    kills: format(kills),
    deaths: format(deaths),
    matches: format(matches),
    kd: kd == null ? '—' : Number(kd).toFixed(2),
    winrate: winRate == null ? '—' : `${Number(winRate).toFixed(2)}%`
  };
}

async function requestJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  const raw = await response.text();
  let data;
  try { data = raw ? JSON.parse(raw) : {}; }
  catch { throw new Error(`The server returned invalid data (HTTP ${response.status}).`); }

  if (!response.ok) {
    const detail = data?.error || data?.message || `HTTP ${response.status}`;
    const providerStatus = data?.providerStatus ? ` (provider: ${data.providerStatus})` : '';
    throw new Error(`${detail}${providerStatus}`);
  }
  return data;
}

function showMessage(text, isError = false) {
  message.textContent = text;
  message.style.color = isError ? '#ff7777' : '';
}

function setStats(stats) {
  for (const [key, value] of Object.entries(stats)) {
    const element = document.getElementById(key);
    if (element) element.textContent = value;
  }
  document.getElementById('playerName').textContent = currentDisplayName;
  document.getElementById('avatar').textContent = (currentDisplayName.trim()[0] || '?').toUpperCase();
  document.getElementById('accountId').textContent = currentAccountId || '';
  document.getElementById('updated').textContent = `Updated ${new Date().toLocaleTimeString()}`;
  dashboard.hidden = false;
}

async function loadStats() {
  if (!currentAccountId) return;
  const response = await requestJson(`/api/player?id=${encodeURIComponent(currentAccountId)}`);
  const stats = mapStats(response);
  setStats(stats);
  const hasAnyStats = Object.values(stats).some(value => value !== '—');
  if (!hasAnyStats) {
    showMessage('Player found, but the API did not return recognizable statistics. Check the Vercel function response.', true);
  } else {
    showMessage('Player statistics loaded successfully.');
  }
}

async function searchPlayer(name) {
  const cleanName = name.trim();
  if (!cleanName) {
    showMessage('Please enter a Fortnite username.', true);
    return;
  }

  searchButton.disabled = true;
  searchButton.textContent = 'SEARCHING…';
  dashboard.hidden = true;
  showMessage('Looking up Fortnite player…');
  currentAccountId = null;
  if (refreshTimer) clearInterval(refreshTimer);

  try {
    const account = await requestJson(`/api/player?username=${encodeURIComponent(cleanName)}`);
    const accountData = account?.data ?? account;
    const accountId = accountData?.id ?? accountData?.accountId ?? accountData?.account_id ?? accountData?.epicAccountId;
    if (!accountId) {
      console.error('Account lookup response:', account);
      throw new Error('The account lookup succeeded, but no account ID was found in its response.');
    }

    currentAccountId = String(accountId);
    currentDisplayName = accountData?.displayName || accountData?.display_name || cleanName;
    await loadStats();
    refreshTimer = setInterval(async () => {
      try { await loadStats(); }
      catch (error) { console.error('Automatic refresh failed:', error); showMessage(`Refresh failed: ${error.message}`, true); }
    }, 60000);
  } catch (error) {
    console.error('LockerScope search failed:', error);
    showMessage(error.message || 'Something went wrong while searching.', true);
  } finally {
    searchButton.disabled = false;
    searchButton.textContent = 'SEARCH PLAYER →';
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  searchPlayer(usernameInput.value);
});

refreshButton.addEventListener('click', async () => {
  if (!currentAccountId) return;
  refreshButton.disabled = true;
  try { await loadStats(); }
  catch (error) { showMessage(`Refresh failed: ${error.message}`, true); }
  finally { refreshButton.disabled = false; }
});
