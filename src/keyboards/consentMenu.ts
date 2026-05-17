import { InlineKeyboard } from "grammy";
import { config } from "../config";

export const CONSENT_ACCEPT_CALLBACK = "accept_documents";

export function consentMenu(): InlineKeyboard {
  return new InlineKeyboard()
    .url("Политика обработки персональных данных", config.personalDataPolicyUrl)
    .row()
    .url("Пользовательское соглашение", config.userAgreementUrl)
    .row()
    .url("Согласие на обработку персональных данных", config.personalDataConsentUrl)
    .row()
    .url("Оферта", config.publicOfferUrl)
    .row()
    .text("✅ Согласен, продолжить", CONSENT_ACCEPT_CALLBACK);
}
