# Pre-bundled worker

This directory contains the production bundle (`index.js`) produced by:

    npx wrangler deploy --outdir dist

The Telegram bot fetches `dist/index.js` directly from this folder on GitHub
when deploying a fresh Aether Panel to a user's Cloudflare account.
