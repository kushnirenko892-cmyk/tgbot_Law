export type BotStep = "idle" | "waiting_for_consent" | "waiting_for_situation";

export interface BotSessionRecord {
  id: string;
  telegramId: string;
  step: BotStep;
  createdAt: Date;
  updatedAt: Date;
}
