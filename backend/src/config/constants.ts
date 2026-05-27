import path from "node:path";
import dotenv from "dotenv";

dotenv.config({
  path: path.resolve(process.cwd(), ".env.backend"),
  quiet: true,
});

export const NODE_ENV = process.env.NODE_ENV ?? "development";
export const IS_PRODUCTION = NODE_ENV === "production";
export const DB_URI = process.env.MONGO_URI;
export const PORT = process.env.PORT ?? 3001;
export const DB_NAME = process.env.MONGO_DB;
export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
export const CLOUDINARY_URL = process.env.CLOUDINARY_URL;
export const ADMIN_REGISTRATION_SECRET = process.env.ADMIN_REGISTRATION_SECRET;
export const GMAIL_USER = process.env.GMAIL_USER?.trim();
export const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD?.trim();
export const JWT_ISSUER = process.env.JWT_ISSUER ?? "season-backend";
export const JWT_AUDIENCE = process.env.JWT_AUDIENCE ?? "season-api";
export const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID?.trim();
export const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET?.trim();
export const GMAIL_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN?.trim();
export const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID?.trim();
export const PAYOS_API_KEY = process.env.PAYOS_API_KEY?.trim();
export const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY?.trim();
export const FRONTEND_PUBLIC_BASE_URL = process.env.FRONTEND_PUBLIC_BASE_URL?.trim();
export const BACKEND_PUBLIC_BASE_URL = process.env.BACKEND_PUBLIC_BASE_URL?.trim();
export const PAYOS_WEBHOOK_PATH =
  process.env.PAYOS_WEBHOOK_PATH?.trim() || "/api/checkout/payos/webhook";

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  const parsedValue = Number.parseInt(value, 10);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

export const PAYOS_FIXED_QR_AMOUNT = parsePositiveInteger(
  process.env.PAYOS_FIXED_QR_AMOUNT,
  10000,
);

function parseAllowedOrigins(value: string | undefined): string[] {
  if (value === undefined || value.trim() === "") {
    return [];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin !== "");
}

export const ALLOWED_ORIGINS = parseAllowedOrigins(
  process.env.ALLOWED_ORIGINS ?? process.env.ALLOWED_ORIGIN,
);

function parseTokenTtlSeconds(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  const ttlSeconds = Number.parseInt(value, 10);
  return Number.isNaN(ttlSeconds) || ttlSeconds < 1 ? fallback : ttlSeconds;
}

export const JWT_ACCESS_TTL_SECONDS = parseTokenTtlSeconds(
  process.env.JWT_ACCESS_TTL_SECONDS,
  15 * 60,
);
export const JWT_REFRESH_TTL_SECONDS = parseTokenTtlSeconds(
  process.env.JWT_REFRESH_TTL_SECONDS,
  7 * 24 * 60 * 60,
);

function requireConfigValue(value: string | undefined, name: string): void {
  if (value === undefined || value.trim() === "") {
    throw new Error(`Missing ${name} in backend environment`);
  }
}

export function assertRuntimeConfig(): void {
  requireConfigValue(DB_URI, "MONGO_URI");

  const hasAccessSecret =
    JWT_ACCESS_SECRET !== undefined && JWT_ACCESS_SECRET.trim() !== "";
  const hasRefreshSecret =
    JWT_REFRESH_SECRET !== undefined && JWT_REFRESH_SECRET.trim() !== "";

  if (hasAccessSecret !== hasRefreshSecret) {
    throw new Error(
      "JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must either both be set or both be omitted",
    );
  }

  if (
    hasAccessSecret === true &&
    hasRefreshSecret === true &&
    JWT_ACCESS_SECRET === JWT_REFRESH_SECRET
  ) {
    throw new Error("JWT access and refresh secrets must be different");
  }

  if (IS_PRODUCTION === true && ALLOWED_ORIGINS.length === 0) {
    throw new Error("Set ALLOWED_ORIGINS for production CORS");
  }
}
