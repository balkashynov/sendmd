import { Router, type Router as RouterType } from "express";
import type { ErrorResponse } from "@sendmd/shared";
import { pool } from "../services/db.js";

export const deleteRouter: RouterType = Router();

// DELETE /:id — soft-delete a document
deleteRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE docs SET is_deleted = true WHERE id = $1 AND is_deleted = false`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Document not found" } satisfies ErrorResponse);
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    return res.status(500).json({ error: "Delete failed" } satisfies ErrorResponse);
  }
});
