import type { NextFunction, Request, Response } from "express";
import { IS_PRODUCTION } from "../config/constants.js";

export function setSecurityHeaders(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  res.setHeader("Content-Security-Policy", "default-src 'none'");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");

  if (IS_PRODUCTION === true) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }

  next();
}
