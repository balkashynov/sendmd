import type { RequestHandler } from "express";
import { getMonthlyUsage, MONTHLY_LIMIT } from "../services/bandwidth.js";

// ── Limits ──
// Writes (uploads)
const WRITE_IP_PER_SEC = 2;
const WRITE_IP_PER_MIN = 10;
const WRITE_IP_PER_HOUR = 30;
const WRITE_GLOBAL_PER_SEC = 10;
const WRITE_GLOBAL_PER_MIN = 100;
const WRITE_GLOBAL_PER_HOUR = 1000;

// Reads (doc fetches)
const READ_IP_PER_SEC = 5;
const READ_IP_PER_MIN = 30;
const READ_IP_PER_HOUR = 200;
const READ_GLOBAL_PER_SEC = 50;
const READ_GLOBAL_PER_MIN = 500;
const READ_GLOBAL_PER_HOUR = 10000;

// ── Sliding window counter ──
interface WindowCounter {
  sec: { count: number; resetAt: number };
  min: { count: number; resetAt: number };
  hour: { count: number; resetAt: number };
}

function freshCounter(): WindowCounter {
  const now = Date.now();
  return {
    sec: { count: 0, resetAt: now + 1000 },
    min: { count: 0, resetAt: now + 60_000 },
    hour: { count: 0, resetAt: now + 3_600_000 },
  };
}

function resetExpired(c: WindowCounter): void {
  const now = Date.now();
  if (now >= c.sec.resetAt) { c.sec.count = 0; c.sec.resetAt = now + 1000; }
  if (now >= c.min.resetAt) { c.min.count = 0; c.min.resetAt = now + 60_000; }
  if (now >= c.hour.resetAt) { c.hour.count = 0; c.hour.resetAt = now + 3_600_000; }
}

function checkAndIncrement(
  c: WindowCounter,
  perSec: number,
  perMin: number,
  perHour: number
): boolean {
  resetExpired(c);
  if (c.sec.count >= perSec || c.min.count >= perMin || c.hour.count >= perHour) {
    return false;
  }
  c.sec.count++;
  c.min.count++;
  c.hour.count++;
  return true;
}

// ── State ──
const writeIpCounters = new Map<string, WindowCounter>();
const readIpCounters = new Map<string, WindowCounter>();
const writeGlobal = freshCounter();
const readGlobal = freshCounter();

function getIp(req: Parameters<RequestHandler>[0]): string {
  return req.ip || "unknown";
}

function getOrCreateIp(map: Map<string, WindowCounter>, ip: string): WindowCounter {
  let c = map.get(ip);
  if (!c) {
    c = freshCounter();
    map.set(ip, c);
  }
  return c;
}

// ── Middleware factories ──

export const writeRateLimit: RequestHandler = (req, res, next) => {
  const ip = getIp(req);
  const ipCounter = getOrCreateIp(writeIpCounters, ip);

  if (!checkAndIncrement(ipCounter, WRITE_IP_PER_SEC, WRITE_IP_PER_MIN, WRITE_IP_PER_HOUR)) {
    return res.status(429).json({ error: "Too many uploads. Slow down.", code: "IP_RATE_LIMIT" });
  }
  if (!checkAndIncrement(writeGlobal, WRITE_GLOBAL_PER_SEC, WRITE_GLOBAL_PER_MIN, WRITE_GLOBAL_PER_HOUR)) {
    return res.status(429).json({ error: "Service is busy. Try again shortly.", code: "GLOBAL_RATE_LIMIT" });
  }
  next();
};

export const readRateLimit: RequestHandler = (req, res, next) => {
  const ip = getIp(req);
  const ipCounter = getOrCreateIp(readIpCounters, ip);

  if (!checkAndIncrement(ipCounter, READ_IP_PER_SEC, READ_IP_PER_MIN, READ_IP_PER_HOUR)) {
    return res.status(429).json({ error: "Too many requests. Slow down.", code: "IP_RATE_LIMIT" });
  }
  if (!checkAndIncrement(readGlobal, READ_GLOBAL_PER_SEC, READ_GLOBAL_PER_MIN, READ_GLOBAL_PER_HOUR)) {
    return res.status(429).json({ error: "Service is busy. Try again shortly.", code: "GLOBAL_RATE_LIMIT" });
  }
  next();
};

// ── Bandwidth guard: 10GB/month R2 free tier ──
export const bandwidthGuard: RequestHandler = async (_req, res, next) => {
  try {
    const used = await getMonthlyUsage();
    if (used >= MONTHLY_LIMIT) {
      return res.status(503).json({
        error: "Monthly bandwidth limit reached. Try again next month.",
        code: "BANDWIDTH_EXHAUSTED",
      });
    }
    next();
  } catch {
    next();
  }
};

// Clean up stale IP entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, c] of writeIpCounters) {
    if (now >= c.hour.resetAt) writeIpCounters.delete(ip);
  }
  for (const [ip, c] of readIpCounters) {
    if (now >= c.hour.resetAt) readIpCounters.delete(ip);
  }
}, 10 * 60 * 1000).unref();
