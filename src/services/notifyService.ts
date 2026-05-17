import type { Bot } from "grammy";
import { config } from "../config";
import type { ClientRecord } from "../types/client";
import type { LeadRecord, LeadType } from "../types/lead";
import { escapeHtml } from "./html";

const leadTitleByType: Record<LeadType, string> = {
  personal_consultation: "личная консультация",
  situation_description: "описание ситуации",
  loyalty_interest: "интерес к системе лояльности"
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Moscow"
  }).format(date);
}

function profileLink(client: ClientRecord): string {
  if (client.telegramUsername) {
    const username = escapeHtml(client.telegramUsername);
    return `<a href="https://t.me/${username}">https://t.me/${username}</a>`;
  }

  return `<a href="tg://user?id=${escapeHtml(client.telegramId)}">tg://user?id=${escapeHtml(
    client.telegramId
  )}</a>`;
}

export async function notifyLeadCreated(bot: Bot, client: ClientRecord, lead: LeadRecord): Promise<void> {
  const username = client.telegramUsername ? `@${client.telegramUsername}` : "не указан";
  const fullName = [client.telegramFirstName, client.telegramLastName].filter(Boolean).join(" ");

  const lines = [
    `<b>Новая заявка: ${escapeHtml(leadTitleByType[lead.leadType])}</b>`,
    "",
    `<b>Пользователь:</b> ${escapeHtml(fullName || "не указано")}`,
    `<b>Username:</b> ${escapeHtml(username)}`,
    `<b>Telegram ID:</b> <code>${escapeHtml(client.telegramId)}</code>`,
    `<b>Профиль:</b> ${profileLink(client)}`,
    `<b>Статус:</b> ${escapeHtml(lead.status)}`,
    `<b>Источник:</b> ${escapeHtml(lead.source)}`,
    `<b>Дата:</b> ${escapeHtml(formatDate(lead.createdAt))}`,
    `<b>Lead ID:</b> <code>${escapeHtml(lead.id)}</code>`
  ];

  if (lead.message) {
    lines.push("", `<b>Сообщение:</b>`, escapeHtml(lead.message));
  }

  await bot.api.sendMessage(config.telegramAdminChatId, lines.join("\n"), {
    parse_mode: "HTML"
  });
}
