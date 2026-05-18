import "dotenv/config";
import { z } from "zod";

function booleanFromEnv(value: unknown): boolean {
  if (typeof value !== "string") {
    return Boolean(value);
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

const optionalUrl = z.union([z.string().url(), z.literal("")]).default("");

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1, "TELEGRAM_BOT_TOKEN is required"),
  TELEGRAM_ADMIN_CHAT_ID: z.string().min(1, "TELEGRAM_ADMIN_CHAT_ID is required"),
  BOT_MODE: z.enum(["polling", "webhook"]).default("polling"),
  TELEGRAM_WEBHOOK_SECRET: z.string().default(""),
  TELEGRAM_API_PROXY_URL: optionalUrl,
  PUBLIC_BOT_URL: optionalUrl,
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DATABASE_SSL: z.preprocess(booleanFromEnv, z.boolean()).default(false),
  OWNER_TELEGRAM_USERNAME: z.string().default(""),
  PUBLIC_CHANNEL_URL: optionalUrl,
  PUBLIC_SITE_URL: optionalUrl,
  PERSONAL_DATA_POLICY_URL: optionalUrl,
  USER_AGREEMENT_URL: optionalUrl,
  PERSONAL_DATA_CONSENT_URL: optionalUrl,
  INFO_MESSAGES_CONSENT_URL: optionalUrl,
  PUBLIC_OFFER_URL: optionalUrl,
  CONSENT_TEXT_VERSION: z.string().min(1).default("2026-05-17-v1"),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const message = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  throw new Error(`Invalid environment configuration: ${message}`);
}

if (parsed.data.BOT_MODE === "webhook" && parsed.data.TELEGRAM_WEBHOOK_SECRET.length === 0) {
  throw new Error("TELEGRAM_WEBHOOK_SECRET is required in webhook mode");
}

if (parsed.data.BOT_MODE === "webhook" && parsed.data.PUBLIC_BOT_URL.length === 0) {
  throw new Error("PUBLIC_BOT_URL is required in webhook mode");
}

const requiredDocumentUrls = {
  PERSONAL_DATA_POLICY_URL: parsed.data.PERSONAL_DATA_POLICY_URL,
  PERSONAL_DATA_CONSENT_URL: parsed.data.PERSONAL_DATA_CONSENT_URL,
  INFO_MESSAGES_CONSENT_URL: parsed.data.INFO_MESSAGES_CONSENT_URL
} as const;

const missingDocumentUrls = Object.entries(requiredDocumentUrls)
  .filter(([, value]) => value.length === 0)
  .map(([name]) => name);

if (missingDocumentUrls.length > 0) {
  throw new Error(
    `${missingDocumentUrls.join(", ")} are required before running the bot consent flow`
  );
}

export const config = {
  telegramBotToken: parsed.data.TELEGRAM_BOT_TOKEN,
  telegramAdminChatId: parsed.data.TELEGRAM_ADMIN_CHAT_ID,
  botMode: parsed.data.BOT_MODE,
  telegramWebhookSecret: parsed.data.TELEGRAM_WEBHOOK_SECRET,
  telegramApiProxyUrl: parsed.data.TELEGRAM_API_PROXY_URL || undefined,
  publicBotUrl: parsed.data.PUBLIC_BOT_URL,
  databaseUrl: parsed.data.DATABASE_URL,
  databaseSsl: parsed.data.DATABASE_SSL,
  ownerTelegramUsername: parsed.data.OWNER_TELEGRAM_USERNAME.replace(/^@/, ""),
  publicChannelUrl: parsed.data.PUBLIC_CHANNEL_URL,
  publicSiteUrl: parsed.data.PUBLIC_SITE_URL,
  personalDataPolicyUrl: parsed.data.PERSONAL_DATA_POLICY_URL,
  userAgreementUrl: parsed.data.USER_AGREEMENT_URL,
  personalDataConsentUrl: parsed.data.PERSONAL_DATA_CONSENT_URL,
  infoMessagesConsentUrl: parsed.data.INFO_MESSAGES_CONSENT_URL,
  publicOfferUrl: parsed.data.PUBLIC_OFFER_URL,
  consentTextVersion: parsed.data.CONSENT_TEXT_VERSION,
  port: parsed.data.PORT,
  nodeEnv: parsed.data.NODE_ENV
} as const;
