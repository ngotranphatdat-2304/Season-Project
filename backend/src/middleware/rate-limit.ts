import type { NextFunction, Request, RequestHandler, Response } from "express";
import { AppError } from "../errors/app-error.js";

interface RateLimitOptions {
  message: string;
  windowMs: number;
  maxRequests: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const MAX_TRACKED_CLIENTS = 10000;

function clientKey(req: Request): string {
  if (req.ip !== undefined && req.ip.trim() !== "") {
    return req.ip;
  }

  const remoteAddress = req.socket.remoteAddress;
  return remoteAddress === undefined || remoteAddress.trim() === ""
    ? "unknown"
    : remoteAddress;
}

function pruneExpiredEntries(
  entries: Map<string, RateLimitEntry>,
  now: number,
): void {
  for (const [key, entry] of entries) {
    if (entry.resetAt <= now) {
      entries.delete(key);
    }
  }
}

export function createIpRateLimiter(options: RateLimitOptions): RequestHandler {
  const entries = new Map<string, RateLimitEntry>();
  let requestsSincePrune = 0;

  return (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): void => {
    const now = Date.now();
    requestsSincePrune += 1;

    if (
      requestsSincePrune >= 100 ||
      entries.size >= MAX_TRACKED_CLIENTS
    ) {
      pruneExpiredEntries(entries, now);
      requestsSincePrune = 0;
    }

    const key = clientKey(req);
    const currentEntry = entries.get(key);
    const entry =
      currentEntry === undefined || currentEntry.resetAt <= now
        ? {
            count: 0,
            resetAt: now + options.windowMs,
          }
        : currentEntry;

    entry.count += 1;
    entries.set(key, entry);

    if (entry.count > options.maxRequests) {
      next(new AppError(429, options.message, "RATE_LIMITED"));
      return;
    }

    next();
  };
}
