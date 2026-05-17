import { queryOne } from "../db/queries";
import type { ClientRecord, TelegramUserProfile } from "../types/client";

function telegramLinkFor(user: TelegramUserProfile): string {
  return user.username ? `https://t.me/${user.username}` : `tg://user?id=${user.id}`;
}

export async function upsertClientFromTelegram(user: TelegramUserProfile): Promise<ClientRecord> {
  const client = await queryOne<ClientRecord>(
    `
      insert into clients (
        telegram_id,
        telegram_username,
        telegram_first_name,
        telegram_last_name,
        telegram_link,
        updated_at
      )
      values ($1, $2, $3, $4, $5, now())
      on conflict (telegram_id)
      do update set
        telegram_username = excluded.telegram_username,
        telegram_first_name = excluded.telegram_first_name,
        telegram_last_name = excluded.telegram_last_name,
        telegram_link = excluded.telegram_link,
        updated_at = now()
      returning
        id,
        telegram_id as "telegramId",
        telegram_username as "telegramUsername",
        telegram_first_name as "telegramFirstName",
        telegram_last_name as "telegramLastName",
        telegram_link as "telegramLink",
        phone,
        email,
        loyalty_points as "loyaltyPoints",
        loyalty_level as "loyaltyLevel",
        notes,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `,
    [
      user.id,
      user.username ?? null,
      user.first_name ?? null,
      user.last_name ?? null,
      telegramLinkFor(user)
    ]
  );

  if (!client) {
    throw new Error("Failed to upsert client");
  }

  return client;
}
