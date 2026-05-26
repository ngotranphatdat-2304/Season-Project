import { ADMIN_REGISTRATION_SECRET } from "../config/constants.js";
import { RefreshToken } from "../models/refresh-token.model.js";
import { User, type IUser } from "../models/user.model.js";
import type {
  AdminRegisterInput,
  AuthUserResponse,
  LoginInput,
  LoginResponseData,
  LogoutResponseData,
  RefreshTokenInput,
  RefreshTokenResponseData,
  RegisterInput,
  RegisterResponseData,
} from "../types/auth.types.js";
import {
  createAuthTokenPair,
  hashRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { clearCartForUser, mergeGuestCartIntoUserCart } from "./cart.service.js";

export class AuthServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "AuthServiceError";
    this.statusCode = statusCode;
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

export function toAuthUserResponse(user: IUser): AuthUserResponse {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    ...(user.phone === undefined ? {} : { phone: user.phone }),
    ...(user.avatar === undefined ? {} : { avatar: user.avatar }),
    role: user.role,
    status: user.status,
    isActive: user.isActive !== false,
  };
}

async function registerUserByRole(
  input: RegisterInput,
  role: IUser["role"],
): Promise<RegisterResponseData> {
  const email = normalizeEmail(input.email);
  const existingUser = await User.exists({ email });

  if (existingUser !== null) {
    throw new AuthServiceError("Email is already registered", 409);
  }

  try {
    const user = await User.create({
      email,
      password: input.password,
      name: input.name.trim(),
      role,
      ...(input.phone === undefined ? {} : { phone: input.phone }),
    });

    return { user: toAuthUserResponse(user) };
  } catch (error) {
    if (isDuplicateKeyError(error) === true) {
      throw new AuthServiceError("Email is already registered", 409);
    }

    throw error;
  }
}

export async function registerUser(input: RegisterInput): Promise<RegisterResponseData> {
  return registerUserByRole(input, "customer");
}

export async function registerAdmin(
  input: AdminRegisterInput,
): Promise<RegisterResponseData> {
  if (
    ADMIN_REGISTRATION_SECRET === undefined ||
    ADMIN_REGISTRATION_SECRET.trim() === ""
  ) {
    throw new AuthServiceError("Admin registration is not configured", 403);
  }

  if (input.adminSecret !== ADMIN_REGISTRATION_SECRET) {
    throw new AuthServiceError("Admin registration secret is invalid", 403);
  }

  return registerUserByRole(input, "admin");
}

export async function loginUser(input: LoginInput): Promise<LoginResponseData> {
  const email = normalizeEmail(input.email);
  const user = await User.findOne({ email }).select("+password");

  if (user === null) {
    throw new AuthServiceError("Email or password is incorrect", 401);
  }

  const passwordMatches = await user.matchPassword(input.password);

  if (passwordMatches === false) {
    throw new AuthServiceError("Email or password is incorrect", 401);
  }

  if (user.status === "banned" || user.isActive === false) {
    throw new AuthServiceError("This account has been banned", 403);
  }

  const tokens = createAuthTokenPair(user);

  await RefreshToken.create({
    userId: user._id,
    tokenHash: tokens.refreshTokenHash,
    expiresAt: tokens.refreshTokenExpiresAt,
  });

  return {
    user: toAuthUserResponse(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

export async function loginAdmin(input: LoginInput): Promise<LoginResponseData> {
  const response = await loginUser(input);

  if (response.user.role !== "admin") {
    throw new AuthServiceError("Admin account is required", 403);
  }

  return response;
}

function invalidRefreshTokenError(): AuthServiceError {
  return new AuthServiceError("Refresh token is invalid or expired", 401);
}

export async function refreshAccessToken(
  input: RefreshTokenInput,
): Promise<RefreshTokenResponseData> {
  let payload;

  try {
    payload = verifyRefreshToken(input.refreshToken);
  } catch {
    throw invalidRefreshTokenError();
  }

  const storedRefreshToken = await RefreshToken.findOneAndUpdate(
    {
      userId: payload.sub,
      tokenHash: hashRefreshToken(input.refreshToken),
      expiresAt: { $gt: new Date() },
      revokedAt: { $exists: false },
    },
    {
      $set: {
        revokedAt: new Date(),
      },
    },
    {
      new: true,
    },
  ).select("+tokenHash");

  if (storedRefreshToken === null) {
    await RefreshToken.deleteMany({
      userId: payload.sub,
      revokedAt: { $exists: false },
    });
    throw invalidRefreshTokenError();
  }

  const user = await User.findById(payload.sub);

  if (user === null || user.status === "banned" || user.isActive === false) {
    await RefreshToken.deleteMany({ userId: storedRefreshToken.userId });
    throw invalidRefreshTokenError();
  }

  const tokens = createAuthTokenPair(user);

  await RefreshToken.create({
    userId: user._id,
    tokenHash: tokens.refreshTokenHash,
    expiresAt: tokens.refreshTokenExpiresAt,
  });

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

export async function logoutSession(
  input: RefreshTokenInput,
): Promise<LogoutResponseData> {
  try {
    const payload = verifyRefreshToken(input.refreshToken);
    const refreshTokenDeletion = await RefreshToken.deleteOne({
      tokenHash: hashRefreshToken(input.refreshToken),
    });

    if (refreshTokenDeletion.deletedCount === 1) {
      await clearCartForUser(payload.sub);
    }
  } catch {
    await RefreshToken.deleteOne({
      tokenHash: hashRefreshToken(input.refreshToken),
    });
  }

  return {
    message: "Logged out",
  };
}

export async function mergeGuestCartForUser(
  userId: string,
  guestId: string | undefined,
): Promise<boolean> {
  if (guestId === undefined || guestId.trim() === "") {
    return false;
  }

  return mergeGuestCartIntoUserCart(userId, guestId);
}

export async function getCurrentAuthUser(
  userId: string,
): Promise<AuthUserResponse> {
  const user = await User.findById(userId);

  if (user === null || user.status !== "active" || user.isActive === false) {
    throw new AuthServiceError("User not found", 404);
  }

  return toAuthUserResponse(user);
}
