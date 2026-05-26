import type { Response } from "express";
import type {
  AdminRegisterValidatedRequest,
  LoginValidatedRequest,
  RefreshTokenValidatedRequest,
  RegisterValidatedRequest,
} from "../middleware/auth.validation.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import {
  clearGuestSessionCookie,
  type GuestSessionRequest,
} from "../middleware/guest-session.js";
import { AppError } from "../errors/app-error.js";
import {
  getCurrentAuthUser,
  loginAdmin,
  loginUser,
  logoutSession,
  mergeGuestCartForUser,
  refreshAccessToken,
  registerAdmin,
  registerUser,
} from "../services/auth.service.js";
import type {
  AuthUserResponse,
  LoginResponseData,
  LogoutResponseData,
  RefreshTokenResponseData,
  RegisterResponseData,
} from "../types/auth.types.js";
import type { ErrorResponse } from "../types/product.types.js";

export async function register(
  req: RegisterValidatedRequest & GuestSessionRequest,
  res: Response<RegisterResponseData | ErrorResponse>,
): Promise<void> {
  const validatedBody = req.validatedBody;

  if (validatedBody === undefined) {
    throw AppError.badRequest("Invalid register payload");
  }

  const responseData = await registerUser(validatedBody);

  try {
    if ((await mergeGuestCartForUser(responseData.user.id, req.guestId)) === true) {
      clearGuestSessionCookie(res);
    }
  } catch (error) {
    console.warn("Failed to merge guest cart after register:", error);
  }

  res.status(201).json(responseData);
}

export async function login(
  req: LoginValidatedRequest & GuestSessionRequest,
  res: Response<LoginResponseData | ErrorResponse>,
): Promise<void> {
  const validatedBody = req.validatedBody;

  if (validatedBody === undefined) {
    throw AppError.badRequest("Invalid login payload");
  }

  const responseData = await loginUser(validatedBody);

  try {
    if ((await mergeGuestCartForUser(responseData.user.id, req.guestId)) === true) {
      clearGuestSessionCookie(res);
    }
  } catch (error) {
    console.warn("Failed to merge guest cart after login:", error);
  }

  res.status(200).json(responseData);
}

export async function adminRegister(
  req: AdminRegisterValidatedRequest & GuestSessionRequest,
  res: Response<RegisterResponseData | ErrorResponse>,
): Promise<void> {
  const validatedBody = req.validatedBody;

  if (validatedBody === undefined) {
    throw AppError.badRequest("Invalid admin register payload");
  }

  const responseData = await registerAdmin(validatedBody);

  try {
    if ((await mergeGuestCartForUser(responseData.user.id, req.guestId)) === true) {
      clearGuestSessionCookie(res);
    }
  } catch (error) {
    console.warn("Failed to merge guest cart after admin register:", error);
  }

  res.status(201).json(responseData);
}

export async function adminLogin(
  req: LoginValidatedRequest & GuestSessionRequest,
  res: Response<LoginResponseData | ErrorResponse>,
): Promise<void> {
  const validatedBody = req.validatedBody;

  if (validatedBody === undefined) {
    throw AppError.badRequest("Invalid admin login payload");
  }

  const responseData = await loginAdmin(validatedBody);

  try {
    if ((await mergeGuestCartForUser(responseData.user.id, req.guestId)) === true) {
      clearGuestSessionCookie(res);
    }
  } catch (error) {
    console.warn("Failed to merge guest cart after admin login:", error);
  }

  res.status(200).json(responseData);
}

export async function refreshToken(
  req: RefreshTokenValidatedRequest,
  res: Response<RefreshTokenResponseData | ErrorResponse>,
): Promise<void> {
  const validatedBody = req.validatedBody;

  if (validatedBody === undefined) {
    throw AppError.badRequest("Invalid refresh token payload");
  }

  const responseData = await refreshAccessToken(validatedBody);
  res.status(200).json(responseData);
}

export async function logout(
  req: RefreshTokenValidatedRequest,
  res: Response<LogoutResponseData | ErrorResponse>,
): Promise<void> {
  const validatedBody = req.validatedBody;

  if (validatedBody === undefined) {
    throw AppError.badRequest("Invalid logout payload");
  }

  const responseData = await logoutSession(validatedBody);
  res.status(200).json(responseData);
}

export async function me(
  req: AuthenticatedRequest,
  res: Response<AuthUserResponse | null | ErrorResponse>,
): Promise<void> {
  const userId = req.authUserId;

  if (userId === undefined) {
    res.status(200).json(null);
    return;
  }

  const responseData = await getCurrentAuthUser(userId);
  res.status(200).json(responseData);
}
