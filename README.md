# Roman Personal Assistant Bot

Private Telegram AI personal assistant using Next.js, Telegram Bot API, OpenAI and Neon Postgres.

## Included
- Telegram webhook
- Owner-only access
- AI chat with OpenAI Responses API
- Neon conversation history
- Persistent memories
- `/start`, `/help`, `/remember`, `/memories`
- Webhook secret validation
- Protected webhook setup endpoint
- Vercel-ready structure
- Health endpoint

## Setup

1. Copy `.env.example` to `.env.local`.
2. Fill in the Telegram bot token, your numeric Telegram user ID, OpenAI key, Neon database URL and secrets.
3. Install dependencies:
   `npm install`
4. Run locally:
   `npm run dev`
5. Deploy to Vercel and add the same environment variables.
6. Set `APP_URL` to the deployed HTTPS URL.
7. Call `POST /api/telegram/set-webhook` with header `x-setup-secret: YOUR_SETUP_SECRET`.

Telegram will then send updates to:
`/api/telegram/webhook`

## Security
Keep all real tokens in Vercel environment variables. Never commit `.env.local`.

## Roadmap
Reminders/cron, finance tracking, email/Resend, Spotify, files, web research, richer memory search and an admin dashboard can be added on top of this foundation.