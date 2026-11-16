
function mapStats(response) {
  console.log("FULL FORTNITE STATS RESPONSE:", response);

  const data = response?.data ?? response;

  // Handle common response structures
  const stats =
    data?.stats?.all ??
    data?.stats?.lifetime ??
    data?.stats ??
    data?.all ??
    data?.lifetime ??
    data;

  console.log("EXTRACTED STATS:", stats);

  const find = (...keys) => {
    for (const key of keys) {
      if (stats?.[key] !== undefined && stats[key] !== null) {
        return stats[key];
      }
    }
    return null;
  };

  const wins = find("br_placetop1", "placetop1", "wins", "wins_total");
  const kills = find("br_kills", "kills", "eliminations", "br_kills_total");
  const deaths = find("br_deaths", "deaths");
  const matches = find("br_matchesplayed", "matches", "matchesPlayed");

  const kd = find("br_kd", "kd", "kdr");
  const winRate = find("br_winrate", "winRate", "winrate");

  return {
    wins: format(wins),
    kills: format(kills),
    deaths: format(deaths),
    matches: format(matches),
    kd: kd == null ? "—" : Number(kd).toFixed(2),
    winrate: winRate == null
      ? (wins != null && matches > 0
          ? (wins / matches * 100).toFixed(2) + "%"
          : "—")
      : Number(winRate).toFixed(2) + "%"
  };
}
