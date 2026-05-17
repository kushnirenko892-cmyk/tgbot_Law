import { pool } from "./pool";

export async function query<T>(text: string, values: readonly unknown[] = []): Promise<T[]> {
  const result = await pool.query(text, [...values]);
  return result.rows as T[];
}

export async function queryOne<T>(text: string, values: readonly unknown[] = []): Promise<T | null> {
  const rows = await query<T>(text, values);
  return rows[0] ?? null;
}
