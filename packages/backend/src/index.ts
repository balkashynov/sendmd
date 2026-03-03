import "dotenv/config";
import express from "express";
import cors from "cors";
import { uploadRouter } from "./routes/upload.js";
import { docRouter } from "./routes/doc.js";
import { deleteRouter } from "./routes/delete.js";
import { cleanupExpiredDocs } from "./utils/cleanup.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "512kb" }));

app.use("/api/upload", uploadRouter);
app.use("/api/doc", docRouter);
app.use("/api/delete", deleteRouter);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);

  // Run cleanup once on startup, then every 24 hours
  const DAY_MS = 24 * 60 * 60 * 1000;
  const runCleanup = () => {
    cleanupExpiredDocs()
      .then(({ deleted, errors }) => {
        if (deleted > 0 || errors > 0) {
          console.log(`Cleanup: ${deleted} expired docs removed, ${errors} errors`);
        }
      })
      .catch((err) => console.error("Cleanup failed:", err));
  };
  runCleanup();
  setInterval(runCleanup, DAY_MS).unref();
});
