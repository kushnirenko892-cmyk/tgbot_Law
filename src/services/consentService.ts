import { queryOne } from "../db/queries";
import { config } from "../config";
import type { ConsentRecord } from "../types/consent";

export async function hasAcceptedCurrentConsent(telegramId: number): Promise<boolean> {
  const consent = await queryOne<{ id: string }>(
    `
      select id
      from personal_data_consents
      where telegram_id = $1
        and consent_text_version = $2
      order by accepted_at desc
      limit 1
    `,
    [telegramId, config.consentTextVersion]
  );

  return Boolean(consent);
}

export async function recordPersonalDataConsent(
  clientId: string,
  telegramId: number,
  source = "telegram_bot"
): Promise<ConsentRecord> {
  const consent = await queryOne<ConsentRecord>(
    `
      insert into personal_data_consents (
        client_id,
        telegram_id,
        consent_text_version,
        source,
        personal_data_policy_url,
        user_agreement_url,
        personal_data_consent_url,
        public_offer_url
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8)
      returning
        id,
        client_id as "clientId",
        telegram_id as "telegramId",
        consent_text_version as "consentTextVersion",
        source,
        accepted_at as "acceptedAt",
        personal_data_policy_url as "personalDataPolicyUrl",
        user_agreement_url as "userAgreementUrl",
        personal_data_consent_url as "personalDataConsentUrl",
        public_offer_url as "publicOfferUrl"
    `,
    [
      clientId,
      telegramId,
      config.consentTextVersion,
      source,
      config.personalDataPolicyUrl,
      config.userAgreementUrl,
      config.personalDataConsentUrl,
      config.publicOfferUrl
    ]
  );

  if (!consent) {
    throw new Error("Failed to record personal data consent");
  }

  return consent;
}
