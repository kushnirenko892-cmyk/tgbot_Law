import { queryOne } from "../db/queries";
import type { CreateLeadInput, LeadRecord } from "../types/lead";

export async function createLead(input: CreateLeadInput): Promise<LeadRecord> {
  const lead = await queryOne<LeadRecord>(
    `
      insert into leads (
        client_id,
        lead_type,
        message,
        source,
        updated_at
      )
      values ($1, $2, $3, $4, now())
      returning
        id,
        client_id as "clientId",
        lead_type as "leadType",
        message,
        status,
        source,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `,
    [input.clientId, input.leadType, input.message ?? null, input.source ?? "telegram_bot"]
  );

  if (!lead) {
    throw new Error("Failed to create lead");
  }

  return lead;
}
