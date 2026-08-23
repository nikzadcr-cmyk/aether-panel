// Telegram bot — onboarding flow for self-service deployment.
//
// Conversation states (per chat id) live in a Durable Object so the
// bot can survive isolate eviction. The flow is:
//
//   /start            → welcome + "🪐 ساخت پنل من" button
//   click build       → ask for Cloudflare API token
//   user sends token  → validate, call provisioner, return URL+password
//   /status           → bot health
//
// The bot also supports the legacy admin commands when the sender
// is TELEGRAM_ADMIN_ID.

import type { Env } from "../env.js";
import { provisionAccount } from "../provisioner.js";

type TgChat = { id: number; type?: string };
type TgFrom = { id: number; username?: string; first_name?: string };
type TgCallback = { id: string; data: string; message?: { chat: TgChat } };
type TgMessage = {
  message_id: number;
  chat: TgChat;
  from?: TgFrom;
  text?: string;
};
type TgUpdate = { message?: TgMessage; callback_query?: TgCallback };

type ChatState = {
  step?: "awaiting_token";
  attempts?: number;
  last?: number;
  deployments?: Array<{ at: number; url: string; user: string; pass: string }>;
};

export async function handleTelegramUpdate(req: Request, env: Env): Promise<Response> {
  if (!env.TELEGRAM_TOKEN) return new Response("bot disabled", { status: 404 });
  const update = (await req.json()) as TgUpdate;
  try {
    if (update.callback_query) return handleCallback(update.callback_query, env);
    if (update.message) return handleMessage(update.message, env);
  } catch (e) {
    console.error("telegram bot error", e);
  }
  return new Response("ok");
}

async function handleCallback(cb: TgCallback, env: Env): Promise<Response> {
  const chatId = cb.message?.chat.id;
  if (!chatId) return new Response("ok");
  await answerCb(env, cb.id);
  if (cb.data === "build:start") {
    await setState(env, chatId, { step: "awaiting_token", attempts: 0 });
    await sendMessage(env, chatId, [
      "🪐 <b>ساخت پنل اختصاصی Aether</b>",
      "",
      "برای ساختن پنل روی حساب کلودفلر خودت، یک API Token بساز و همین‌جا بفرست:",
      "",
      "۱) برو به: https://dash.cloudflare.com/profile/api-tokens",
      "۲) <b>Create Token → Custom token</b>",
      "۳) این permissionها را بده:",
      "   • Account / Workers Scripts: <b>Edit</b>",
      "   • Account / D1: <b>Edit</b>",
      "   • Account / Workers KV: <b>Edit</b>",
      "   • Account / Queues: <b>Edit</b>",
      "   • Account Settings: <b>Read</b>",
      "۴) Account Resources: <b>All accounts</b> (یا حسابت)",
      "۵) Create Token و متن توکن را کپی کن و اینجا بفرست.",
      "",
      "⏱ توکن فقط برای ساخت پنل استفاده می‌شود و بعد از پایان عملیات، در جایی ذخیره نمی‌شود. برای امنیت بیشتر بعداً توکن را Revoke کن.",
      "",
      "برای انصراف /cancel را بفرست.",
    ].join("\n"), { link_preview: false });
  }
  return new Response("ok");
}

async function handleMessage(msg: TgMessage, env: Env): Promise<Response> {
  const chatId = msg.chat.id;
  const text = (msg.text || "").trim();
  const fromId = msg.from?.id;

  // admin commands
  if (fromId && String(fromId) === String(env.TELEGRAM_ADMIN_ID || "")) {
    if (text === "/list" || text === "/users") {
      const { results } = await env.DB.prepare(
        "SELECT username, is_active, used_gb, expiry_days FROM users ORDER BY id DESC LIMIT 15"
      ).all();
      const lines = (results || []).map((u: unknown) => {
        const r = u as { username: string; is_active: number; used_gb: number; expiry_days: number | null };
        return (r.is_active ? "🟢 " : "🔴 ") + r.username + " — " + r.used_gb.toFixed(2) + "GB / " + (r.expiry_days ?? "∞") + "d";
      });
      await sendMessage(env, chatId, lines.length ? lines.join("\n") : "کاربری نیست.");
      return new Response("ok");
    }
  }

  if (text === "/start") { await sendStart(env, chatId); return new Response("ok"); }
  if (text === "/status") { await sendMessage(env, chatId, "✅ ربات آنلاین است.\nنسخه: " + env.APP_VERSION); return new Response("ok"); }
  if (text === "/cancel" || text === "/stop") {
    await clearState(env, chatId);
    await sendMessage(env, chatId, "لغو شد.");
    return new Response("ok");
  }

  const state = await getState(env, chatId);
  if (state?.step === "awaiting_token") {
    if (!/^[A-Za-z0-9_\-]{30,}$/.test(text)) {
      await sendMessage(env, chatId, "❌ توکن نامعتبر به نظر می‌رسد. دوباره بفرست یا /cancel بزن.");
      return new Response("ok");
    }
    const attempts = (state.attempts || 0) + 1;
    if (attempts > 3) {
      await clearState(env, chatId);
      await sendMessage(env, chatId, "تلاش‌های ناموفق زیاد بود. برای شروع دوباره /start بزن.");
      return new Response("ok");
    }
    await setState(env, chatId, { ...state, attempts, last: Date.now() });

    const statusMsg = await sendMessage(env, chatId, "🔑 توکن دریافت شد. در حال ساخت پنل روی حساب کلودفلرت...\n(این کار حدود ۳۰ ثانیه طول می‌کشد)");

    try {
      const result = await provisionAccount({ token: text });
      await clearState(env, chatId);

      // call auto-bootstrap to set the admin password on the new worker
      try {
        await fetch(result.url + "/api/auth/auto-bootstrap", { method: "POST" });
      } catch {}

      const text2 = [
        "✅ <b>پنل اختصاصی تو با موفقیت ساخته شد!</b>",
        "",
        "🔗 <b>پنل:</b> " + result.url + "/panel",
        "👤 <b>نام کاربری:</b> <code>" + result.adminUser + "</code>",
        "🔑 <b>رمز عبور:</b> <code>" + result.adminPassword + "</code>",
        "",
        "📲 <b>لینک اشتراک:</b> " + result.url + "/sub/<b>test</b>",
        "   (یک کاربر test با ۵۰GB و ۳۶۵ روز به‌صورت خودکار ساخته نشده؛ بعد از ورود به پنل کاربر دلخواهت را بساز.)",
        "",
        "🛡 <b>توصیه امنیتی:</b> بعد از اولین ورود، رمز را عوض کن و توکن کلودفلر را Revoke کن.",
        "",
        "برای ساخت پنل دیگر /start بزن.",
      ].join("\n");
      if (statusMsg) await editMessage(env, chatId, statusMsg, text2);
      else await sendMessage(env, chatId, text2);
    } catch (e) {
      const errMsg = (e as Error).message || "خطای ناشناخته";
      await setState(env, chatId, { ...state, attempts, last: Date.now() });
      if (statusMsg) await editMessage(env, chatId, statusMsg, "❌ خطا: " + escapeHtml(errMsg) + "\n\nتوکن را چک کن و دوباره بفرست، یا /cancel بزن.");
      else await sendMessage(env, chatId, "❌ خطا: " + errMsg);
    }
    return new Response("ok");
  }

  return sendStart(env, chatId);
}

async function sendStart(env: Env, chatId: number): Promise<Response> {
  await sendMessage(env, chatId, [
    "⚡ <b>Aether Panel Bot</b>",
    "",
    "با این ربات می‌توانی پنل اختصاصی خودت را روی Cloudflare Worker بسازی — بدون نیاز به سرور، کاملاً رایگان.",
    "",
    "ویژگی‌ها:",
    "  • VLESS + Trojan + VMess روی WebSocket",
    "  • D1 + Durable Objects برای شمارش دقیق ترافیک",
    "  • پنل فارسی مدرن و موبایل‌فرندلی",
    "  • ربات تلگرام، QR کد، استخر پروکسی و...",
    "",
    "برای شروع روی دکمه زیر بزن.",
  ].join("\n"), {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🪐 ساخت پنل اختصاصی من", callback_data: "build:start" }],
      ],
    },
  });
  return new Response("ok");
}

/* ------------ state in KV ------------ */

function stateKey(chatId: number): string { return "tgstate:" + chatId; }

async function getState(env: Env, chatId: number): Promise<ChatState | null> {
  try {
    const v = await env.KV.get(stateKey(chatId));
    return v ? (JSON.parse(v) as ChatState) : null;
  } catch { return null; }
}

async function setState(env: Env, chatId: number, state: ChatState): Promise<void> {
  await env.KV.put(stateKey(chatId), JSON.stringify(state), { expirationTtl: 30 * 60 });
}

async function clearState(env: Env, chatId: number): Promise<void> {
  await env.KV.delete(stateKey(chatId));
}

/* ------------ Telegram API ------------ */

async function sendMessage(
  env: Env,
  chatId: number,
  text: string,
  extra: Record<string, unknown> = {}
): Promise<number | null> {
  const body = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...extra,
  };
  const r = await fetch("https://api.telegram.org/bot" + env.TELEGRAM_TOKEN + "/sendMessage", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = (await r.json()) as { ok: boolean; result?: { message_id: number } };
  return j.ok && j.result ? j.result.message_id : null;
}

async function editMessage(env: Env, chatId: number, messageId: number, text: string): Promise<void> {
  await fetch("https://api.telegram.org/bot" + env.TELEGRAM_TOKEN + "/editMessageText", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      text,
    }),
  });
}

async function answerCb(env: Env, id: string): Promise<void> {
  await fetch("https://api.telegram.org/bot" + env.TELEGRAM_TOKEN + "/answerCallbackQuery", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ callback_query_id: id }),
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
}
