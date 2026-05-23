const TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const APP_URL = process.env.APP_URL ?? "http://kidtube:3000";
const API = `https://api.telegram.org/bot${TOKEN}`;

let offset = 0;

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForApp() {
  while (true) {
    try {
      const res = await fetch(`${APP_URL}/api/auth/me`);
      if (res.ok || res.status === 200) return;
    } catch {
      // app not ready yet
    }
    console.log("Waiting for app to be ready…");
    await sleep(3000);
  }
}

async function poll() {
  await waitForApp();
  console.log("Telegram poller started");

  while (true) {
    try {
      const res = await fetch(
        `${API}/getUpdates?timeout=30&offset=${offset}&allowed_updates=["callback_query"]`,
        { signal: AbortSignal.timeout(35_000) }
      );

      if (!res.ok) {
        console.error("getUpdates failed:", res.status);
        await sleep(5000);
        continue;
      }

      const data = (await res.json()) as {
        result: { update_id: number; callback_query?: unknown }[];
      };

      for (const update of data.result) {
        offset = update.update_id + 1;
        if (!update.callback_query) continue;

        try {
          await fetch(`${APP_URL}/api/telegram/webhook`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(update),
          });
        } catch (e) {
          console.error("Failed to forward update:", e);
        }
      }
    } catch (e) {
      console.error("Poll error:", e);
      await sleep(5000);
    }
  }
}

poll();
