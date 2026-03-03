import { Router, type Router as RouterType } from "express";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";
import type { UploadRequest, UploadResponse, ErrorResponse, TtlHours } from "@sendmd/shared";
import { pool } from "../services/db.js";
import { r2, BUCKET } from "../services/storage.js";
import { hasCapacity, recordBandwidth } from "../services/bandwidth.js";
import { writeRateLimit, bandwidthGuard } from "../middleware/rateLimit.js";

export const uploadRouter: RouterType = Router();

const VALID_TTL: TtlHours[] = [1, 24, 168, 720];
const MAX_SIZE = 256 * 1024; // 256KB

// POST / — upload a markdown document
uploadRouter.post("/", writeRateLimit, bandwidthGuard, async (req, res) => {
  const ip = req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "unknown";

  try {
    const { content, ttl_hours } = req.body as UploadRequest;

    // Validate
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      await logRejection(null, ip, 0, "empty_content");
      return res.status(400).json({ error: "Content is required" } satisfies ErrorResponse);
    }

    const sizeBytes = Buffer.byteLength(content, "utf-8");
    if (sizeBytes > MAX_SIZE) {
      await logRejection(null, ip, sizeBytes, "too_large");
      return res.status(400).json({ error: "Content exceeds 256KB limit" } satisfies ErrorResponse);
    }

    if (!ttl_hours || !VALID_TTL.includes(ttl_hours)) {
      await logRejection(null, ip, sizeBytes, "invalid_ttl");
      return res.status(400).json({ error: "Invalid TTL. Must be 1, 24, 168, or 720" } satisfies ErrorResponse);
    }

    // Check bandwidth capacity before uploading
    if (!(await hasCapacity(sizeBytes))) {
      await logRejection(null, ip, sizeBytes, "bandwidth_limit");
      return res.status(503).json({ error: "Monthly bandwidth limit reached. Try again next month." } satisfies ErrorResponse);
    }

    // Generate ID and compute expiry
    const id = nanoid(8);
    const expiresAt = new Date(Date.now() + ttl_hours * 60 * 60 * 1000);

    // Upload to R2
    await r2.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: `${id}.md`,
        Body: content,
        ContentType: "text/markdown",
      })
    );

    // Insert into docs table
    await pool.query(
      `INSERT INTO docs (id, size_bytes, ttl_hours, upload_ip, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, sizeBytes, ttl_hours, ip, expiresAt.toISOString()]
    );

    // Record bandwidth usage
    await recordBandwidth(sizeBytes);

    // Log upload event
    await pool.query(
      `INSERT INTO upload_events (doc_id, ip, size_bytes, was_rejected, reject_reason)
       VALUES ($1, $2, $3, false, NULL)`,
      [id, ip, sizeBytes]
    );

    const url = `/s/${id}`;
    const response: UploadResponse = { id, url, expires_at: expiresAt.toISOString() };
    return res.status(201).json(response);
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: "Upload failed" } satisfies ErrorResponse);
  }
});

async function logRejection(docId: string | null, ip: string, sizeBytes: number, reason: string) {
  try {
    await pool.query(
      `INSERT INTO upload_events (doc_id, ip, size_bytes, was_rejected, reject_reason)
       VALUES ($1, $2, $3, true, $4)`,
      [docId, ip, sizeBytes, reason]
    );
  } catch {
    // Logging failure should not block the response
  }
}
