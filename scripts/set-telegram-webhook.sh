#!/usr/bin/env bash
# Registers the Worker URL as the Telegram bot webhook.
# Usage:
#   TELEGRAM_TOKEN=xxx WORKER_URL=https://aether.workers.dev bash scripts/set-telegram-webhook.sh
set -euo pipefail
: "${TELEGRAM_TOKEN:?missing}"
: "${WORKER_URL:?missing}"
URL="https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook?url=${WORKER_URL}/tg/webhook&allowed_updates=%5B%22message%22%5D"
curl -s "$URL"
echo
