import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error.js";
import { User, type UserRole, type UserStatus } from "../models/user.model.js";
import {
  verifyAccessToken,
  type VerifiedAccessTokenPayload,
} from "../utils/jwt.js";

export interface AuthenticatedRequest extends Request {
  authUserId?: string;
  authUserRole?: UserRole;
}

function readBearerToken(authorization: string | undefined): string | null {
  if (authorization === undefined || authorization.trim() === "") {
    return null;
  }

  const [scheme, token, extraPart] = authorization.trim().split(/\s+/);

  if (
    scheme !== "Bearer" ||
    token === undefined ||
    token === "" ||
    extraPart !== undefined
  ) {
    return null;
  }

  return token;
}

async function tryAuthenticateRequest(
  req: AuthenticatedRequest,
): Promise<"authenticated" | "missing" | "invalid"> {
  const accessToken = readBearerToken(req.headers.authorization);

  if (accessToken === null) {
    return "missing";
  }

  let payload: VerifiedAccessTokenPayload;

  try {
    payload = verifyAccessToken(accessToken);
  } catch {
    return "invalid";
  }

  const user = await User.findById(payload.sub)
    .select("status role isActive")
    .lean<{
      status: UserStatus;
      role: UserRole;
      isActive?: boolean;
    } | null>();

  if (user === null || user.status !== "active" || user.isActive === false) {
    return "invalid";
  }

  req.authUserId = payload.sub;
  req.authUserRole = user.role;
  return "authenticated";
}

export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  await tryAuthenticateRequest(req);
  next();
}

export async function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authResult = await tryAuthenticateRequest(req);

  if (authResult === "missing") {
    next(AppError.unauthorized("Access token is required"));
    return;
  }

  if (authResult === "invalid") {
    next(AppError.unauthorized("Access token is invalid or expired"));
    return;
  }

  next();
}

export async function requireAdmin(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authResult = await tryAuthenticateRequest(req);

  if (authResult === "missing") {
    next(AppError.unauthorized("Access token is required"));
    return;
  }

  if (authResult === "invalid") {
    next(AppError.unauthorized("Access token is invalid or expired"));
    return;
  }

  if (req.authUserRole !== "admin") {
    next(AppError.forbidden("Admin access is required"));
    return;
  }

  next();
}
