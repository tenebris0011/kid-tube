# KidTube

A self-hosted, parent-controlled YouTube front-end for kids. Kids search for videos and request permission to watch them. Parents approve or deny via Telegram. Videos play through an [Invidious](https://invidious.io) instance — no YouTube recommendations, no ads, no rabbit holes.

## Features

- **Kid accounts** — each child has their own login
- **Search** — powered by your self-hosted Invidious instance (no Google API key required)
- **Approval flow** — kids request a video, parent gets a Telegram message with a preview link and Approve/Deny buttons
- **Allowed channels** — pre-approve creators so their videos play instantly without needing approval
- **Watch history** — parents can see what each kid has watched
- **Embedded player** — videos play inside the app via Invidious, hiding related videos and YouTube UI

## Requirements

- A self-hosted [Invidious](https://github.com/iv-org/invidious) instance
- A [Telegram bot](https://core.telegram.org/bots#how-do-i-create-a-bot) (create via BotFather)
- Your Telegram chat ID (send a message to your bot, then check `https://api.telegram.org/bot<TOKEN>/getUpdates`)
- Docker + Docker Compose
- [Traefik](https://traefik.io) reverse proxy (or adapt the labels for your own proxy)

## Setup

### 1. Clone and configure

```bash
git clone https://github.com/tenebris0011/kid-tube.git
cd kid-tube
cp .env.example .env
```

Edit `.env`:

```env
INVIDIOUS_URL=https://your-invidious-instance.example.com
APP_DOMAIN=kids-videos.yourdomain.com
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_PARENT_CHAT_ID=your_telegram_chat_id
JWT_SECRET=generate-a-long-random-string
```

Generate a JWT secret:
```bash
openssl rand -base64 32
```

### 2. Deploy

```bash
docker compose up -d --build
```

### 3. Create the parent account

Visit `https://your-app-domain/setup` to create the parent account. This endpoint is disabled once the first parent account exists.

### 4. Add kid accounts

Log in as the parent, go to **Manage Kids**, and create accounts for each child.

## How it works

```
Kid searches → selects video → clicks "Ask to watch"
    ↓
Telegram message sent to parent with video title, channel, and preview link
    ↓
Parent taps ✅ Approve or ❌ Deny
    ↓
Kid's requests page updates (polls every 5s) → Watch button appears
```

Telegram approval uses **long polling** (the app reaches out to Telegram) so it works on home servers behind NAT with no port-forwarding required.

If a video is from an **allowed channel**, it is approved automatically without a Telegram notification.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Runtime | Bun |
| Database | SQLite via `bun:sqlite` |
| Auth | JWT (jose) + bcrypt |
| Video | Invidious API + embed player |
| Notifications | Telegram Bot API |
| Proxy | Traefik v3 |

## Project structure

```
src/
├── app/
│   ├── api/          # API routes (auth, search, requests, channels, history)
│   ├── login/        # Login page
│   ├── setup/        # One-time parent account setup
│   ├── search/       # Kid video search
│   ├── requests/     # Kid's pending/approved requests
│   ├── watch/        # Video player
│   └── parent/       # Parent dashboard (requests, channels, kids, history)
├── lib/
│   ├── db.ts         # SQLite setup and schema
│   ├── auth.ts       # JWT helpers
│   ├── invidious.ts  # Invidious API client
│   └── telegram.ts   # Telegram bot helpers
telegram-poller.ts    # Long-poll Telegram updates (runs as separate container)
```

## Local development

```bash
cp .env.example .env.local
# fill in .env.local values

bun install
bun run dev
```

Visit `http://localhost:3000/setup` to create your parent account.
