// Telegram bot — Zeus-style UX:
//   • /start  → main menu (inline keyboard)
//   • Register Cloudflare token (multi-account, persisted in KV)
//   • Build / Update / Recover → pick an account → action
//   • Every sub-screen has a "→ بازگشت" button back to the main menu.
//
// Per-chat state lives in KV for 30 days.

import type { Env } from "../env.js";
import { provisionAccount, updateWorkerDeployment } from "../provisioner.js";

type Chat = { id: number; type?: string; first_name?: string; username?: string };
type CbQuery = {
  id: string;
  from: { id: number; first_name?: string; username?: string };
  data: string;
  message?: { chat: Chat; message_id: number };
};
type Msg = { chat: Chat; from?: { id: number; first_name?: string; username?: string }; text?: string };
type Update = { message?: Msg; callback_query?: CbQuery };

export type StoredAccount = {
  id: string;            // internal short id
  name: string;          // Cloudflare account name
  accountId: string;     // Cloudflare account id
  token: string;         // API token (sensitive)
  worker?: string;       // worker subdomain/name if built
  panel?: string;        // panel URL if built
  adminUser?: string;
  admin?: string;        // admin password if built
  builtAt?: number;
};

type ChatState = {
  step?: "awaiting_token";
  accounts?: StoredAccount[];
};

/* ---------- keyboards ---------- */

const HOME_KB = {
  inline_keyboard: [
    [
      { text: "➕ ثبت حساب", callback_data: "menu:register" },
      { text: "🚀 ساخت پنل", callback_data: "menu:build" },
    ],
    [
      { text: "🔄 آپدیت پنل", callback_data: "menu:update" },
      { text: "🔑 بازیابی رمز", callback_data: "menu:recover" },
    ],
    [
      { text: "📊 لیست حساب‌ها", callback_data: "menu:list" },
      { text: "🗑 حذف حساب", callback_data: "menu:delete" },
    ],
    [{ text: "ℹ️ راهنما و پشتیبانی", callback_data: "menu:help" }],
  ],
};

function BACK_TO_HOME(): { inline_keyboard: unknown[][] } {
  return { inline_keyboard: [[{ text: "→ بازگشت به منوی اصلی", callback_data: "menu:home" }]] };
}

function accountPickerKb(
  accounts: StoredAccount[],
  action: "build" | "update" | "recover" | "list"
): { inline_keyboard: unknown[][] } {
  // For "build", show each account as a full-width button (the label
  // includes name + status and needs room). For other actions use a
  // 2-column layout when there are several accounts.
  const rows: unknown[][] = [];
  if (action === "build" || accounts.length <= 3) {
    for (const a of accounts) {
      const icon = a.panel ? "✅" : "⬜";
      const label = icon + " " + truncate(a.name, 26) + (a.panel ? " · ساخته‌شده" : "");
      rows.push([{ text: label, callback_data: "acct:" + a.id + ":" + action }]);
    }
  } else {
    for (let i = 0; i < accounts.length; i += 2) {
      const row = [];
      for (let j = 0; j < 2 && i + j < accounts.length; j++) {
        const a = accounts[i + j]!;
        const icon = a.panel ? "✅" : "⬜";
        row.push({
          text: icon + " " + truncate(a.name, 14),
          callback_data: "acct:" + a.id + ":" + action,
        });
      }
      rows.push(row);
    }
  }
  rows.push([{ text: "→ بازگشت به منوی اصلی", callback_data: "menu:home" }]);
  return { inline_keyboard: rows };
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

/* ---------- entry point ---------- */

export async function handleTelegramUpdate(req: Request, env: Env): Promise<Response> {
  if (!env.TELEGRAM_TOKEN) return new Response("bot disabled", { status: 404 });
  const update = (await req.json()) as Update;
  try {
    if (update.callback_query) return handleCb(update.callback_query, env);
    if (update.message) return handleMsg(update.message, env);
  } catch (e) {
    console.error("tg error", e);
  }
  return new Response("ok");
}

/* ---------- callbacks ---------- */

async function handleCb(cb: CbQuery, env: Env): Promise<Response> {
  const chat = cb.message?.chat;
  if (!chat) {
    await answerCb(env, cb.id);
    return new Response("ok");
  }
  const [ns, action, arg] = cb.data.split(":");

  if (ns === "menu") {
    await handleMenuAction(env, chat, cb.message!.message_id, action || "home");
    await answerCb(env, cb.id);
    return new Response("ok");
  }

  if (ns === "acct") {
    const state = (await getState(env, chat.id)) || { accounts: [] };
    const acc = (state.accounts || []).find((a) => a.id === action);
    if (!acc) {
      await answerCb(env, cb.id, "حساب پیدا نشد", true);
      return new Response("ok");
    }
    if (arg === "build") {
      await answerCb(env, cb.id);
      if (acc.panel) {
        // Already built — show existing panel + offer rebuild
        const kb = {
          inline_keyboard: [
            [{ text: "🔗 باز کردن پنل", url: acc.panel }],
            [{ text: "♻️ ساخت دوباره (اوررایت)", callback_data: "acct:" + acc.id + ":rebuild" }],
            [{ text: "→ بازگشت", callback_data: "menu:build" }],
          ],
        };
        await editText(
          env, chat, cb.message!.message_id,
          "این حساب قبلاً پنل دارد:\n\n🔗 " + acc.panel + "\n👤 " + (acc.adminUser || "admin") +
            "\n🔑 " + (acc.admin || "—") + "\n\nاگر بخواهی می‌توانی دوباره بسازی (ورکر جدید با D1/KV جدید).",
          kb
        );
        return new Response("ok");
      }
      await runBuild(env, chat, cb.message!.message_id, acc);
      return new Response("ok");
    }
    if (arg === "rebuild") {
      await answerCb(env, cb.id);
      await runBuild(env, chat, cb.message!.message_id, acc);
      return new Response("ok");
    }
    if (arg === "update") {
      await answerCb(env, cb.id, "در حال آپدیت...");
      if (!acc.worker) {
        await editText(env, chat, cb.message!.message_id, "این حساب هنوز پنلی نساخته.", BACK_TO_HOME());
        return new Response("ok");
      }
      try {
        const r = await updateWorkerDeployment({
          token: acc.token,
          workerName: acc.worker,
          accountId: acc.accountId,
        });
        await editText(
          env, chat, cb.message!.message_id,
          "✅ پنل با موفقیت به آخرین نسخه آپدیت شد.\n\n🔗 " + r.url + "/panel",
          HOME_KB
        );
      } catch (e) {
        await editText(
          env, chat, cb.message!.message_id,
          "❌ خطا در آپدیت: " + escapeHtml((e as Error).message),
          BACK_TO_HOME()
        );
      }
      return new Response("ok");
    }
    if (arg === "recover") {
      await answerCb(env, cb.id);
      if (acc.panel) {
        await editText(
          env, chat, cb.message!.message_id,
          "🔑 اطلاعات ورود پنل <b>" + escapeHtml(acc.name) + "</b>:\n\n" +
          "🔗 " + acc.panel + "\n👤 " + (acc.adminUser || "admin") + "\n🔑 <code>" + escapeHtml(acc.admin || "—") + "</code>",
          HOME_KB
        );
      } else {
        await editText(
          env, chat, cb.message!.message_id,
          "این حساب هنوز پنلی نساخته است.",
          BACK_TO_HOME()
        );
      }
      return new Response("ok");
    }
    if (arg === "list") {
      await answerCb(env, cb.id);
      await showAccountDetail(env, chat, cb.message!.message_id, acc);
      return new Response("ok");
    }
    if (arg === "confirmdelete") {
      await answerCb(env, cb.id);
      const kb = {
        inline_keyboard: [
          [
            { text: "✅ بله، حذف کن", callback_data: "acct:" + acc.id + ":dodelete" },
            { text: "❌ لغو", callback_data: "menu:list" },
          ],
        ],
      };
      await editText(
        env, chat, cb.message!.message_id,
        "مطمئنی می‌خوای حساب <b>" + escapeHtml(acc.name) + "</b> از ربات حذف بشه؟",
        kb
      );
      return new Response("ok");
    }
    if (arg === "dodelete") {
      await answerCb(env, cb.id, "حذف شد");
      const all = (await getState(env, chat.id)) || { accounts: [] };
      all.accounts = (all.accounts || []).filter((a) => a.id !== acc.id);
      await setState(env, chat.id, all);
      const remaining = all.accounts?.length || 0;
      await editText(
        env, chat, cb.message!.message_id,
        "✅ حساب <b>" + escapeHtml(acc.name) + "</b> از ربات حذف شد." +
          (remaining ? "\n" + remaining + " حساب باقی مانده." : "\nدیگر حسابی نداری."),
        HOME_KB
      );
      return new Response("ok");
    }
  }

  await answerCb(env, cb.id);
  return new Response("ok");
}

async function handleMenuAction(env: Env, chat: Chat, messageId: number, action: string): Promise<void> {
  if (action === "home") {
    await editText(env, chat, messageId, "🏠 <b>منوی اصلی</b>\nیکی از گزینه‌ها را انتخاب کن:", HOME_KB);
    return;
  }
  if (action === "register") {
    await setState(env, chat.id, { ...((await getState(env, chat.id)) || {}), step: "awaiting_token" });
    await editText(
      env, chat, messageId,
      "🔑 <b>ساخت توکن کلودفلر</b>\n\n" +
      "۱) برو به: https://dash.cloudflare.com/profile/api-tokens\n" +
      "۲) <b>Create Token → Custom token</b>\n" +
      "۳) این permissionها را بده:\n" +
      "   • Account · Workers Scripts → <b>Edit</b>\n" +
      "   • Account · D1 → <b>Edit</b>\n" +
      "   • Account · Workers KV → <b>Edit</b>\n" +
      "   • Account · Queues → <b>Edit</b>\n" +
      "   • Account Settings → <b>Read</b>\n" +
      "۴) Account Resources → <b>All accounts</b>\n" +
      "۵) Create Token و متن توکن را همین‌جا بفرست.\n\n" +
      "برای لغو /cancel بزن.",
      {
        inline_keyboard: [
          [{ text: "🔗 لینک مستقیم ساخت توکن", url: "https://dash.cloudflare.com/profile/api-tokens" }],
          [{ text: "→ بازگشت", callback_data: "menu:home" }],
        ],
      }
    );
    return;
  }

  const state = (await getState(env, chat.id)) || { accounts: [] };
  const accs = state.accounts || [];

  if (action === "list") {
    if (!accs.length) {
      await editText(env, chat, messageId, "هنوز حسابی ثبت نکردی. اول از «ثبت حساب کلودفلر» استفاده کن.", HOME_KB);
      return;
    }
    const text = "📋 <b>حساب‌های تو</b>\nبرای دیدن جزئیات هر حساب روی آن بزن:\n\n" + accs.map((a, i) => {
      const status = a.panel ? "✅ ساخته‌شده" : "⬜ ساخته‌نشده";
      return (i + 1) + ". <b>" + escapeHtml(a.name) + "</b> — " + status;
    }).join("\n");
    await editText(env, chat, messageId, text, accountPickerKb(accs, "list"));
    return;
  }

  if (action === "delete") {
    if (!accs.length) {
      await editText(env, chat, messageId, "حسابی برای حذف وجود ندارد.", HOME_KB);
      return;
    }
    const kb = {
      inline_keyboard: [
        ...accs.map((a) => [{
          text: "🗑 " + truncate(a.name, 24) + (a.panel ? " · ✅" : ""),
          callback_data: "acct:" + a.id + ":confirmdelete",
        }]),
        [{ text: "→ بازگشت", callback_data: "menu:home" }],
      ],
    };
    await editText(
      env, chat, messageId,
      "🗑 کدام حساب از ربات حذف شود؟\n<i>(فقط اطلاعات توکن از ربات پاک می‌شود، پنل روی کلودفلر دست نمی‌خورد)</i>",
      kb
    );
    return;
  }

  if (action === "build" || action === "update" || action === "recover") {
    if (!accs.length) {
      await editText(
        env, chat, messageId,
        "اول باید یک حساب کلودفلر ثبت کنی.\nاز دکمه زیر برو:",
        { inline_keyboard: [
          [{ text: "➕ ثبت حساب کلودفلر", callback_data: "menu:register" }],
          [{ text: "→ منوی اصلی", callback_data: "menu:home" }],
        ] }
      );
      return;
    }
    const titles = {
      build: "🚀 روی کدام حساب پنل بسازم؟",
      update: "🔄 کدام پنل آپدیت شود؟",
      recover: "🔑 رمز کدام پنل را می‌خواهی؟",
    } as const;
    const hasBuilt = accs.some((a) => !!a.panel);
    if (action !== "build" && !hasBuilt) {
      await editText(env, chat, messageId, "هیچ حسابی هنوز پنل نساخته. اول یک پنل بساز.", HOME_KB);
      return;
    }
    const filtered = action === "build" ? accs : accs.filter((a) => !!a.panel);
    await editText(env, chat, messageId, titles[action], accountPickerKb(filtered, action));
    return;
  }

  if (action === "help") {
    await editText(
      env, chat, messageId,
      "⚡️ <b>Aether Panel Bot</b>\n\n" +
      "با این ربات می‌توانی پنل اختصاصی VLESS/Trojan/VMess روی Cloudflare Worker بسازی.\n\n" +
      "• <b>ثبت حساب</b>: یک API Token می‌دهی، ربات در KV نگه می‌دارد.\n" +
      "• <b>ساخت پنل</b>: روی هر حساب یک ورکر + D1 + KV می‌سازد.\n" +
      "• <b>آپدیت</b>: آخرین سورس گیتهاب روی همان ورکر دیپلوی می‌شود.\n" +
      "• <b>بازیابی رمز</b>: رمز اولیه را نمایش می‌دهد.\n\n" +
      "پشتیبانی: @nikzadcr",
      HOME_KB
    );
    return;
  }
}

/* ---------- messages ---------- */

async function handleMsg(msg: Msg, env: Env): Promise<Response> {
  const text = (msg.text || "").trim();
  const chatId = msg.chat.id;

  if (text === "/start" || text === "/menu") {
    await clearState(env, chatId);
    await sendMessage(env, chatId, "👋 <b>به ربات Aether Panel خوش آمدی!</b>\nیکی از گزینه‌های منو را انتخاب کن:", { reply_markup: HOME_KB });
    return new Response("ok");
  }
  if (text === "/cancel" || text === "/stop") {
    await clearState(env, chatId);
    await sendMessage(env, chatId, "لغو شد.", { reply_markup: HOME_KB });
    return new Response("ok");
  }

  const state = (await getState(env, chatId)) || {};
  if (state.step === "awaiting_token") {
    if (!/^[A-Za-z0-9_\-]{30,}$/.test(text)) {
      await sendMessage(env, chatId, "❌ توکن نامعتبر است. دوباره بفرست یا /cancel بزن.", { reply_markup: BACK_TO_HOME() });
      return new Response("ok");
    }
    const waitMsg = await sendMessage(env, chatId, "🔑 توکن دریافت شد، در حال اعتبارسنجی...");
    try {
      const headers = { Authorization: "Bearer " + text, "Content-Type": "application/json" };
      const v = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", { headers });
      const vj = (await v.json()) as { success: boolean; errors?: { message: string }[] };
      if (!vj.success) throw new Error(vj.errors?.[0]?.message || "توکن نامعتبر");

      const ar = await fetch("https://api.cloudflare.com/client/v4/accounts", { headers });
      const aj = (await ar.json()) as { success: boolean; result?: Array<{ id: string; name: string }>; errors?: { message: string }[] };
      if (!aj.success || !aj.result?.length) throw new Error(aj.errors?.[0]?.message || "حسابی پیدا نشد");
      const account = aj.result[0]!;

      const newAcc: StoredAccount = {
        id: Math.random().toString(36).slice(2, 8),
        name: account.name,
        accountId: account.id,
        token: text,
      };
      const newState: ChatState = { accounts: [...(state.accounts || []), newAcc] };
      await setState(env, chatId, newState);
      await editText(
        env, { id: chatId } as Chat, waitMsg,
        "✅ حساب <b>" + escapeHtml(account.name) + "</b> با موفقیت ثبت شد.\nحالا می‌توانی از منو پنل بسازی.",
        HOME_KB
      );
    } catch (e) {
      await editText(
        env, { id: chatId } as Chat, waitMsg,
        "❌ خطا: " + escapeHtml((e as Error).message) + "\nتوکن را چک کن یا /cancel بزن.",
        BACK_TO_HOME()
      );
    }
    return new Response("ok");
  }

  await sendMessage(env, chatId, "یکی از گزینه‌های منو را انتخاب کن:", { reply_markup: HOME_KB });
  return new Response("ok");
}

/* ---------- flows ---------- */

async function runBuild(env: Env, chat: Chat, statusMsgId: number, acc: StoredAccount): Promise<void> {
  await editText(
    env, chat, statusMsgId,
    "🚀 در حال ساخت پنل روی حساب <b>" + escapeHtml(acc.name) + "</b>...\nاین کار ۲۰ تا ۴۰ ثانیه طول می‌کشد.",
    { inline_keyboard: [] }
  );
  try {
    const result = await provisionAccount({ token: acc.token });
    const all = (await getState(env, chat.id)) || { accounts: [] };
    const idx = (all.accounts || []).findIndex((a) => a.id === acc.id);
    const updated: StoredAccount = {
      ...acc,
      worker: result.workerName,
      panel: result.url + "/panel",
      adminUser: result.adminUser,
      admin: result.adminPassword,
      builtAt: Date.now(),
    };
    if (idx >= 0) {
      all.accounts![idx] = updated;
      await setState(env, chat.id, all);
    }
    await editText(
      env, chat, statusMsgId,
      "✅ <b>پنل با موفقیت ساخته شد!</b>\n\n" +
      "🔗 پنل: " + result.url + "/panel\n" +
      "👤 کاربر: <code>" + result.adminUser + "</code>\n" +
      "🔑 رمز: <code>" + result.adminPassword + "</code>\n\n" +
      "📲 اشتراک تست: " + result.url + "/sub/test\n\n" +
      "پس از ورود رمز را عوض کن و کاربرهایت را بساز.",
      {
        inline_keyboard: [
          [{ text: "🔗 باز کردن پنل", url: result.url + "/panel" }],
          [{ text: "→ منوی اصلی", callback_data: "menu:home" }],
        ],
      }
    );
  } catch (e) {
    await editText(
      env, chat, statusMsgId,
      "❌ خطا در ساخت پنل:\n" + escapeHtml((e as Error).message),
      BACK_TO_HOME()
    );
  }
}

async function showAccountDetail(env: Env, chat: Chat, messageId: number, acc: StoredAccount): Promise<void> {
  const lines = [
    "🪐 <b>" + escapeHtml(acc.name) + "</b>",
    "",
    "وضعیت: " + (acc.panel ? "✅ پنل ساخته شده" : "⬜ هنوز ساخته نشده"),
  ];
  if (acc.panel) {
    lines.push("پنل: " + acc.panel);
    lines.push("کاربر: " + (acc.adminUser || "admin"));
    lines.push("رمز: <code>" + escapeHtml(acc.admin || "—") + "</code>");
  }
  const kb = {
    inline_keyboard: [
      acc.panel
        ? [{ text: "🔗 باز کردن پنل", url: acc.panel! }]
        : [{ text: "🚀 ساخت پنل", callback_data: "acct:" + acc.id + ":build" }],
      acc.panel ? [{ text: "🔄 آپدیت", callback_data: "acct:" + acc.id + ":update" }] : [],
      acc.panel ? [{ text: "🔑 بازیابی رمز", callback_data: "acct:" + acc.id + ":recover" }] : [],
      [{ text: "→ بازگشت", callback_data: "menu:list" }],
    ].filter((r) => r.length > 0),
  };
  await editText(env, chat, messageId, lines.join("\n"), kb);
}

/* ---------- KV state ---------- */

async function getState(env: Env, chatId: number): Promise<ChatState | null> {
  try {
    const v = await env.KV.get("tgstate:" + chatId);
    return v ? (JSON.parse(v) as ChatState) : null;
  } catch {
    return null;
  }
}
async function setState(env: Env, chatId: number, state: ChatState): Promise<void> {
  // Persist permanently (no TTL) — the user explicitly said tokens should
  // stay around; security is not a concern for this bot.
  await env.KV.put("tgstate:" + chatId, JSON.stringify(state));
}
async function clearState(env: Env, chatId: number): Promise<void> {
  await env.KV.delete("tgstate:" + chatId);
}

/* ---------- Telegram API ---------- */

function api(token: string, method: string, body: unknown): Promise<Response> {
  return fetch("https://api.telegram.org/bot" + token + "/" + method, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function sendMessage(
  env: Env, chatId: number, text: string, extra: Record<string, unknown> = {}
): Promise<number> {
  const r = await api(env.TELEGRAM_TOKEN!, "sendMessage", {
    chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true, ...extra,
  });
  const j = (await r.json()) as { ok: boolean; result?: { message_id: number } };
  return j.ok && j.result ? j.result.message_id : 0;
}

async function editText(
  env: Env, chat: Chat, messageId: number, text: string, extra: Record<string, unknown> = {}
): Promise<void> {
  // Normalize keyboard: callers pass either { inline_keyboard: [...] } or
  // { reply_markup: { inline_keyboard: [...] } }. Telegram expects the
  // latter — wrap if we see the raw form.
  const payload: Record<string, unknown> = {
    chat_id: chat.id, message_id: messageId, text, parse_mode: "HTML",
    disable_web_page_preview: true,
  };
  if (extra.reply_markup) {
    payload.reply_markup = extra.reply_markup;
  } else if (extra.inline_keyboard) {
    payload.reply_markup = { inline_keyboard: extra.inline_keyboard };
  }
  for (const [k, v] of Object.entries(extra)) {
    if (k !== "inline_keyboard" && k !== "reply_markup") payload[k] = v;
  }
  if (!messageId) {
    const r = await api(env.TELEGRAM_TOKEN!, "sendMessage", {
      chat_id: chat.id, text, parse_mode: "HTML", disable_web_page_preview: true,
      reply_markup: payload.reply_markup,
    });
    await r.json().catch(() => null);
    return;
  }
  const r = await api(env.TELEGRAM_TOKEN!, "editMessageText", payload);
  if (!r.ok) {
    const errText = await r.text().catch(() => "");
    // "message is not modified" is harmless; log other errors.
    if (!/not modified|message to edit not found/i.test(errText)) {
      console.warn("tg editMessageText failed:", r.status, errText.slice(0, 300));
    }
  }
}

async function answerCb(env: Env, id: string, text?: string, alert?: boolean): Promise<void> {
  await api(env.TELEGRAM_TOKEN!, "answerCallbackQuery", {
    callback_query_id: id, text, show_alert: !!alert,
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
}
