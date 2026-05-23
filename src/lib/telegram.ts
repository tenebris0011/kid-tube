const TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const CHAT_ID = process.env.TELEGRAM_PARENT_CHAT_ID ?? "";
const API = `https://api.telegram.org/bot${TOKEN}`;

export async function sendApprovalRequest(opts: {
  requestId: number;
  kidName: string;
  videoId: string;
  videoTitle: string;
  channelName: string;
  thumbnail: string;
}): Promise<number | null> {
  const invidiousUrl = `${process.env.INVIDIOUS_URL ?? ""}/watch?v=${opts.videoId}`;
  const text =
    `👦 <b>${opts.kidName}</b> wants to watch:\n\n` +
    `🎬 <b>${opts.videoTitle}</b>\n` +
    `📺 ${opts.channelName}\n\n` +
    `<a href="${invidiousUrl}">Preview video</a>`;

  const body = {
    chat_id: CHAT_ID,
    text,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "✅ Approve", callback_data: `approve:${opts.requestId}` },
          { text: "❌ Deny", callback_data: `deny:${opts.requestId}` },
        ],
      ],
    },
  };

  const res = await fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) return null;
  const data = await res.json() as { result?: { message_id: number } };
  return data.result?.message_id ?? null;
}

export async function editApprovalMessage(
  messageId: number,
  approved: boolean,
  kidName: string,
  videoTitle: string
) {
  const icon = approved ? "✅" : "❌";
  const word = approved ? "Approved" : "Denied";
  await fetch(`${API}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      message_id: messageId,
      text: `${icon} ${word}: <b>${videoTitle}</b> for ${kidName}`,
      parse_mode: "HTML",
    }),
  });
}
