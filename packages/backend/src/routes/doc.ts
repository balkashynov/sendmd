import { Router, type Router as RouterType } from "express";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import type { DocResponse, ErrorResponse } from "@sendmd/shared";
import { pool } from "../services/db.js";
import { r2, BUCKET } from "../services/storage.js";
import { recordBandwidth } from "../services/bandwidth.js";
import { readRateLimit, bandwidthGuard } from "../middleware/rateLimit.js";

export const docRouter: RouterType = Router();

// GET /:id — retrieve a document by short id
docRouter.get("/:id", readRateLimit, bandwidthGuard, async (req, res) => {
  const { id } = req.params;
  const viewerIp = req.ip || "unknown";
  const referer = req.headers.referer || null;

  try {
    // Query doc (must exist, not deleted, not expired)
    const result = await pool.query(
      `SELECT id, size_bytes, views, ttl_hours, created_at, expires_at
       FROM docs
       WHERE id = $1 AND is_deleted = false AND expires_at > NOW()`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Document not found or expired" } satisfies ErrorResponse);
    }

    const doc = result.rows[0];

    // Fetch content from R2
    const obj = await r2.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: `${id}.md`,
      })
    );

    const content = await obj.Body!.transformToString("utf-8");

    // Record bandwidth usage for the read
    await recordBandwidth(doc.size_bytes);

    // Increment views counter
    await pool.query(`UPDATE docs SET views = views + 1 WHERE id = $1`, [id]);

    // Log view event
    await pool.query(
      `INSERT INTO view_events (doc_id, viewer_ip, referer)
       VALUES ($1, $2, $3)`,
      [id, viewerIp, referer]
    );

    const response: DocResponse = {
      id: doc.id,
      content,
      size_bytes: doc.size_bytes,
      views: doc.views + 1,
      ttl_hours: doc.ttl_hours,
      created_at: doc.created_at,
      expires_at: doc.expires_at,
    };

    return res.json(response);
  } catch (err) {
    console.error("Doc fetch error:", err);
    return res.status(500).json({ error: "Failed to retrieve document" } satisfies ErrorResponse);
  }
});
