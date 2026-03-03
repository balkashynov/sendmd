import { pool } from "./db.js";

const MONTHLY_LIMIT = 10 * 1024 * 1024 * 1024; // 10GB

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7); // '2026-03'
}

export async function recordBandwidth(bytes: number): Promise<void> {
  const month = currentMonth();
  await pool.query(
    `INSERT INTO bandwidth_usage (month, bytes_used)
     VALUES ($1, $2)
     ON CONFLICT (month) DO UPDATE SET bytes_used = bandwidth_usage.bytes_used + $2`,
    [month, bytes]
  );
}

export async function getMonthlyUsage(): Promise<number> {
  const month = currentMonth();
  const result = await pool.query(
    `SELECT bytes_used FROM bandwidth_usage WHERE month = $1`,
    [month]
  );
  return result.rows.length > 0 ? Number(result.rows[0].bytes_used) : 0;
}

export async function hasCapacity(additionalBytes: number): Promise<boolean> {
  const used = await getMonthlyUsage();
  return used + additionalBytes <= MONTHLY_LIMIT;
}

export { MONTHLY_LIMIT };
