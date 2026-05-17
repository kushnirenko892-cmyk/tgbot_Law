import { Bot, type Context } from "grammy";
import { config } from "./config";
import { consentMenu, CONSENT_ACCEPT_CALLBACK } from "./keyboards/consentMenu";
import { mainMenu, MAIN_MENU_LABELS } from "./keyboards/mainMenu";
import { contactsMessage, messages } from "./messages/botMessages";
import { upsertClientFromTelegram } from "./services/clientService";
import { hasAcceptedCurrentConsent, recordPersonalDataConsent } from "./services/consentService";
import { createLead } from "./services/leadService";
import { notifyLeadCreated } from "./services/notifyService";
import { getSessionStep, resetSession, setSessionStep } from "./services/sessionService";
import type { ClientRecord, TelegramUserProfile } from "./types/client";
import type { LeadType } from "./types/lead";

type BotContext = Context;

function telegramUserFromContext(ctx: BotContext): TelegramUserProfile {
  if (!ctx.from) {
    throw new Error("Telegram user is missing in context");
  }

  return {
    id: ctx.from.id,
    username: ctx.from.username,
    first_name: ctx.from.first_name,
    last_name: ctx.from.last_name
  };
}

async function replyWithConsent(ctx: BotContext): Promise<void> {
  if (ctx.from) {
    await setSessionStep(ctx.from.id, "waiting_for_consent");
  }

  await ctx.reply(messages.consent, {
    reply_markup: consentMenu()
  });
}

async function replyWithMainMenu(ctx: BotContext): Promise<void> {
  await ctx.reply(messages.mainMenu, {
    reply_markup: mainMenu()
  });
}

async function ensureConsent(ctx: BotContext): Promise<boolean> {
  if (!ctx.from) {
    return false;
  }

  const accepted = await hasAcceptedCurrentConsent(ctx.from.id);

  if (accepted) {
    return true;
  }

  await ctx.reply(messages.consentRequired);
  await replyWithConsent(ctx);
  return false;
}

async function createLeadAndNotify(
  bot: Bot,
  client: ClientRecord,
  leadType: LeadType,
  message?: string
): Promise<void> {
  const lead = await createLead({
    clientId: client.id,
    leadType,
    message
  });

  await notifyLeadCreated(bot, client, lead);
}

export function createBot(): Bot {
  const bot = new Bot(config.telegramBotToken);

  bot.command("start", async (ctx) => {
    if (!ctx.from) {
      return;
    }

    const accepted = await hasAcceptedCurrentConsent(ctx.from.id);

    if (!accepted) {
      await replyWithConsent(ctx);
      return;
    }

    await resetSession(ctx.from.id);
    await replyWithMainMenu(ctx);
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(messages.help);
  });

  bot.command("cancel", async (ctx) => {
    if (ctx.from && (await hasAcceptedCurrentConsent(ctx.from.id))) {
      await resetSession(ctx.from.id);
      await ctx.reply(messages.cancelled, {
        reply_markup: mainMenu()
      });
      return;
    }

    await ctx.reply(messages.consentRequired);
    await replyWithConsent(ctx);
  });

  bot.callbackQuery(CONSENT_ACCEPT_CALLBACK, async (ctx) => {
    if (!ctx.from) {
      await ctx.answerCallbackQuery();
      return;
    }

    const client = await upsertClientFromTelegram(telegramUserFromContext(ctx));
    await recordPersonalDataConsent(client.id, ctx.from.id);
    await resetSession(ctx.from.id);
    await ctx.answerCallbackQuery({ text: "Согласие принято" });
    await replyWithMainMenu(ctx);
  });

  bot.hears(MAIN_MENU_LABELS.personalConsultation, async (ctx) => {
    if (!ctx.from || !(await ensureConsent(ctx))) {
      return;
    }

    const client = await upsertClientFromTelegram(telegramUserFromContext(ctx));
    await createLeadAndNotify(bot, client, "personal_consultation", "Пользователь хочет записаться лично.");
    await resetSession(ctx.from.id);
    await ctx.reply(messages.personalConsultationReceived, {
      reply_markup: mainMenu()
    });
  });

  bot.hears(MAIN_MENU_LABELS.situationDescription, async (ctx) => {
    if (!ctx.from || !(await ensureConsent(ctx))) {
      return;
    }

    await setSessionStep(ctx.from.id, "waiting_for_situation");
    await ctx.reply(messages.situationPrompt);
  });

  bot.hears(MAIN_MENU_LABELS.loyalty, async (ctx) => {
    if (!ctx.from || !(await ensureConsent(ctx))) {
      return;
    }

    const client = await upsertClientFromTelegram(telegramUserFromContext(ctx));
    await createLeadAndNotify(bot, client, "loyalty_interest", "Пользователь интересуется системой лояльности.");
    await resetSession(ctx.from.id);
    await ctx.reply(messages.loyalty, {
      reply_markup: mainMenu()
    });
  });

  bot.hears(MAIN_MENU_LABELS.contacts, async (ctx) => {
    if (!ctx.from || !(await ensureConsent(ctx))) {
      return;
    }

    await resetSession(ctx.from.id);
    await ctx.reply(contactsMessage(), {
      reply_markup: mainMenu()
    });
  });

  bot.on("message:text", async (ctx) => {
    if (!ctx.from || !(await ensureConsent(ctx))) {
      return;
    }

    const step = await getSessionStep(ctx.from.id);

    if (step === "waiting_for_situation") {
      const client = await upsertClientFromTelegram(telegramUserFromContext(ctx));
      await createLeadAndNotify(bot, client, "situation_description", ctx.message.text);
      await resetSession(ctx.from.id);
      await ctx.reply(messages.situationReceived, {
        reply_markup: mainMenu()
      });
      return;
    }

    await ctx.reply(messages.unknownText, {
      reply_markup: mainMenu()
    });
  });

  bot.catch((error) => {
    console.error("Bot error", error);
  });

  return bot;
}
