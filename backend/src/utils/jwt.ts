import { createHash, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import {
  JWT_ACCESS_SECRET,
  JWT_ACCESS_TTL_SECONDS,
  JWT_AUDIENCE,
  JWT_ISSUER,
  JWT_REFRESH_SECRET,
  JWT_REFRESH_TTL_SECONDS,
} from "../config/constants.js";
import type { IUser } from "../models/user.model.js";

type AuthTokenType = "access" | "refresh";

interface AuthTokenPayload {
  sub: string;
  role: IUser["role"];
  tokenType: AuthTokenType;
  jti?: string;
}

export interface VerifiedRefreshTokenPayload {
  sub: string;
  role: IUser["role"];
  tokenType: "refresh";
  jti: string;
}

export interface VerifiedAccessTokenPayload {
  sub: string;
  role: IUser["role"];
  tokenType: "access";
}

export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenHash: string;
  refreshTokenExpiresAt: Date;
}

function requireSecret(secret: string | undefined, name: string): string {
  if (secret === undefined || secret.trim() === "") {
    throw new Error(`Missing ${name} in backend environment`);
  }

  return secret;
}

function signToken(
  payload: AuthTokenPayload,
  secret: string,
  expiresInSeconds: number,
): string {
  return jwt.sign(payload, secret, {
    algorithm: "HS256",
    audience: JWT_AUDIENCE,
    expiresIn: expiresInSeconds,
    issuer: JWT_ISSUER,
  });
}

function isVerifiedRefreshTokenPayload(
  payload: string | jwt.JwtPayload,
): payload is jwt.JwtPayload & VerifiedRefreshTokenPayload {
  return (
    typeof payload !== "string" &&
    typeof payload.sub === "string" &&
    (payload.role === "admin" || payload.role === "customer") &&
    payload.tokenType === "refresh" &&
    typeof payload.jti === "string"
  );
}

function isVerifiedAccessTokenPayload(
  payload: string | jwt.JwtPayload,
): payload is jwt.JwtPayload & VerifiedAccessTokenPayload {
  return (
    typeof payload !== "string" &&
    typeof payload.sub === "string" &&
    (payload.role === "admin" || payload.role === "customer") &&
    payload.tokenType === "access"
  );
}

export function hashRefreshToken(refreshToken: string): string {
  return createHash("sha256").update(refreshToken).digest("hex");
}

export function createAccessToken(user: IUser): string {
  return signToken(
    {
      sub: user._id.toString(),
      role: user.role,
      tokenType: "access",
    },
    requireSecret(JWT_ACCESS_SECRET, "JWT_ACCESS_SECRET"),
    JWT_ACCESS_TTL_SECONDS,
  );
}

export function verifyRefreshToken(
  refreshToken: string,
): VerifiedRefreshTokenPayload {
  const payload = jwt.verify(
    refreshToken,
    requireSecret(JWT_REFRESH_SECRET, "JWT_REFRESH_SECRET"),
    {
      algorithms: ["HS256"],
      audience: JWT_AUDIENCE,
      issuer: JWT_ISSUER,
    },
  );

  if (isVerifiedRefreshTokenPayload(payload) === false) {
    throw new Error("Invalid refresh token payload");
  }

  return {
    sub: payload.sub,
    role: payload.role,
    tokenType: payload.tokenType,
    jti: payload.jti,
  };
}

export function verifyAccessToken(accessToken: string): VerifiedAccessTokenPayload {
  const payload = jwt.verify(
    accessToken,
    requireSecret(JWT_ACCESS_SECRET, "JWT_ACCESS_SECRET"),
    {
      algorithms: ["HS256"],
      audience: JWT_AUDIENCE,
      issuer: JWT_ISSUER,
    },
  );

  if (isVerifiedAccessTokenPayload(payload) === false) {
    throw new Error("Invalid access token payload");
  }

  return {
    sub: payload.sub,
    role: payload.role,
    tokenType: payload.tokenType,
  };
}

export function createAuthTokenPair(user: IUser): AuthTokenPair {
  const userId = user._id.toString();
  const accessToken = createAccessToken(user);
  const refreshToken = signToken(
    {
      sub: userId,
      role: user.role,
      tokenType: "refresh",
      jti: randomUUID(),
    },
    requireSecret(JWT_REFRESH_SECRET, "JWT_REFRESH_SECRET"),
    JWT_REFRESH_TTL_SECONDS,
  );

  return {
    accessToken,
    refreshToken,
    refreshTokenHash: hashRefreshToken(refreshToken),
    refreshTokenExpiresAt: new Date(
      Date.now() + JWT_REFRESH_TTL_SECONDS * 1000,
    ),
  };
}
