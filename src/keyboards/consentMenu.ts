import { InlineKeyboard } from "grammy";
import { config } from "../config";

export const CONSENT_ACCEPT_CALLBACK = "accept_documents";

export function consentMenu(): InlineKeyboard {
  return new InlineKeyboard()
    .url("Политика обработки персональных данных", config.personalDataPolicyUrl)
    .row()
    .url("Согласие на обработку персональных данных", config.personalDataConsentUrl)
    .row()
    .url("Согласие на получение информационных сообщений", config.infoMessagesConsentUrl)
    .row()
    .text("Продолжить", CONSENT_ACCEPT_CALLBACK);
}
