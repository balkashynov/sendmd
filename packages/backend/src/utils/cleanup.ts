import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { pool } from "../services/db.js";
import { r2, BUCKET } from "../services/storage.js";

const BATCH_SIZE = 100;

export async function cleanupExpiredDocs(): Promise<{ deleted: number; errors: number }> {
  let deleted = 0;
  let errors = 0;

  // Process in batches so we don't load everything into memory
  while (true) {
    const result = await pool.query(
      `SELECT id FROM docs
       WHERE is_deleted = false AND expires_at <= NOW()
       LIMIT $1`,
      [BATCH_SIZE]
    );

    if (result.rows.length === 0) break;

    for (const row of result.rows) {
      try {
        // Delete from R2
        await r2.send(
          new DeleteObjectCommand({
            Bucket: BUCKET,
            Key: `${row.id}.md`,
          })
        );

        // Mark as deleted in DB
        await pool.query(
          `UPDATE docs SET is_deleted = true WHERE id = $1`,
          [row.id]
        );

        deleted++;
      } catch (err) {
        console.error(`Failed to clean up doc ${row.id}:`, err);
        errors++;
      }
    }
  }

  return { deleted, errors };
}
