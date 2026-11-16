
async function searchPlayer(event) {
  event.preventDefault();

  const username = $("username").value.trim();

  if (!username) {
    message("Enter a Fortnite username.", "#ff8585");
    return;
  }

  $("searchButton").disabled = true;
  $("searchButton").textContent = "SEARCHING...";
  $("dashboard").hidden = true;

  try {
    message("Looking up Epic account...");

    // STEP 1: Find Epic account by username
    const response = await request(
      "/api/player?username=" + encodeURIComponent(username)
    );

    const account = unwrap(response);

    // Support different account response structures
    const accountData = account?.account || account?.user || account;

    const accountId =
      accountData?.id ||
      accountData?.accountId ||
      accountData?.account_id ||
      accountData?.epicAccountId;

    const displayName =
      accountData?.displayName ||
      accountData?.display_name ||
      accountData?.name ||
      username;

    if (!accountId) {
      console.error("Account response:", response);
      throw new Error(
        "Account found response did not contain an Epic Account ID."
      );
    }

    // STEP 2: Save selected player
    currentPlayer = {
      id: accountId,
      name: displayName
    };

    previousStats = null;

    $("playerName").textContent = displayName;
    $("avatar").textContent = displayName.charAt(0).toUpperCase();
    $("accountId").textContent = "Account ID: " + accountId;
    $("dashboard").hidden = false;

    message("Account found! Loading statistics...", "#55e6a5");

    // STEP 3: Load stats
    await refreshStats();

    clearInterval(refreshTimer);
    refreshTimer = setInterval(refreshStats, 60000);

  } catch (error) {
    console.error(error);
    message(error.message, "#ff8585");

  } finally {
    $("searchButton").disabled = false;
    $("searchButton").textContent = "SEARCH PLAYER →";
  }
}
