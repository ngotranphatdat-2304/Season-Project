import type { CookieOptions, NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { IS_PRODUCTION } from "../config/constants.js";

export interface GuestSessionRequest extends Request {
  guestId?: string;
}

interface GuestSessionOptions {
  createIfMissing?: boolean;
}

const GUEST_CART_COOKIE_NAME = "guestId";
const GUEST_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const guestSessionCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: "strict",
  maxAge: GUEST_COOKIE_MAX_AGE_MS,
};

export function clearGuestSessionCookie(res: Response): void {
  res.clearCookie(GUEST_CART_COOKIE_NAME, {
    httpOnly: guestSessionCookieOptions.httpOnly,
    secure: guestSessionCookieOptions.secure,
    sameSite: guestSessionCookieOptions.sameSite,
  });
}

export function guestSession(
  options: GuestSessionOptions = {},
): (
  req: GuestSessionRequest,
  res: Response,
  next: NextFunction,
) => void {
  const createIfMissing = options.createIfMissing ?? true;

  return (req, res, next): void => {
    const authenticatedRequest = req as Request & { authUserId?: string };

    if (req.guestId !== undefined || authenticatedRequest.authUserId !== undefined) {
      next();
      return;
    }

    const guestId =
      typeof (req as Request & { cookies?: Record<string, unknown> }).cookies?.[
        GUEST_CART_COOKIE_NAME
      ] === "string"
        ? String(
            (req as Request & { cookies?: Record<string, unknown> }).cookies?.[
              GUEST_CART_COOKIE_NAME
            ],
          )
        : undefined;

    if (guestId !== undefined && guestId.trim() !== "") {
      req.guestId = guestId;
      next();
      return;
    }

    if (createIfMissing === false) {
      next();
      return;
    }

    const nextGuestId = uuidv4();
    res.cookie(GUEST_CART_COOKIE_NAME, nextGuestId, guestSessionCookieOptions);
    req.guestId = nextGuestId;
    next();
  };
}
