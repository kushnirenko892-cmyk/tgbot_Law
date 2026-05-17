import { queryOne } from "../db/queries";
import type { BotSessionRecord, BotStep } from "../types/session";

export async function getSessionStep(telegramId: number): Promise<BotStep> {
  const session = await queryOne<Pick<BotSessionRecord, "step">>(
    `
      select step
      from bot_sessions
      where telegram_id = $1
    `,
    [telegramId]
  );

  return session?.step ?? "idle";
}

export async function setSessionStep(telegramId: number, step: BotStep): Promise<BotSessionRecord> {
  const session = await queryOne<BotSessionRecord>(
    `
      insert into bot_sessions (telegram_id, step, updated_at)
      values ($1, $2, now())
      on conflict (telegram_id)
      do update set
        step = excluded.step,
        updated_at = now()
      returning
        id,
        telegram_id as "telegramId",
        step,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `,
    [telegramId, step]
  );

  if (!session) {
    throw new Error("Failed to set bot session step");
  }

  return session;
}

export async function resetSession(telegramId: number): Promise<void> {
  await setSessionStep(telegramId, "idle");
}
