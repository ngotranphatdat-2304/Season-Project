import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error.js";
import type {
  AdminRegisterInput,
  LoginInput,
  RefreshTokenInput,
  RegisterInput,
} from "../types/auth.types.js";

interface JsonBodyRequest extends Request {
  body: unknown;
}

const BCRYPT_MAX_PASSWORD_BYTES = 72;

export interface RegisterValidatedRequest extends Request {
  validatedBody?: RegisterInput;
}

export interface LoginValidatedRequest extends Request {
  validatedBody?: LoginInput;
}

export interface AdminRegisterValidatedRequest extends Request {
  validatedBody?: AdminRegisterInput;
}

export interface RefreshTokenValidatedRequest extends Request {
  validatedBody?: RefreshTokenInput;
}

function readRequiredString(
  body: unknown,
  key: string,
): { value: string } | { error: string } {
  if (typeof body !== "object" || body === null || key in body === false) {
    return { error: `${key} is required` };
  }

  const value = (body as Record<string, unknown>)[key];

  if (typeof value !== "string" || value.trim() === "") {
    return { error: `${key} is required` };
  }

  return { value: value.trim() };
}

function readOptionalString(
  body: unknown,
  key: string,
): { value?: string } | { error: string } {
  if (typeof body !== "object" || body === null || key in body === false) {
    return {};
  }

  const value = (body as Record<string, unknown>)[key];

  if (typeof value !== "string" || value.trim() === "") {
    return { error: `${key} is invalid` };
  }

  return { value: value.trim() };
}

function isPasswordWithinBcryptLimit(password: string): boolean {
  return Buffer.byteLength(password, "utf8") <= BCRYPT_MAX_PASSWORD_BYTES;
}

function rejectLongPassword(
  password: string,
  fieldName: "password" | "newPassword",
  next: NextFunction,
): boolean {
  if (isPasswordWithinBcryptLimit(password) === true) {
    return false;
  }

  next(
    AppError.badRequest(
      `${fieldName} must be at most ${BCRYPT_MAX_PASSWORD_BYTES} UTF-8 bytes`,
      "VALIDATION_ERROR",
    ),
  );
  return true;
}

export function validateRegisterBody(
  req: RegisterValidatedRequest & JsonBodyRequest,
  _res: Response,
  next: NextFunction,
): void {
  const email = readRequiredString(req.body, "email");
  const password = readRequiredString(req.body, "password");
  const name = readRequiredString(req.body, "name");
  const phone = readOptionalString(req.body, "phone");

  if ("error" in email) return next(AppError.badRequest(email.error, "VALIDATION_ERROR"));
  if ("error" in password) return next(AppError.badRequest(password.error, "VALIDATION_ERROR"));
  if ("error" in name) return next(AppError.badRequest(name.error, "VALIDATION_ERROR"));
  if ("error" in phone) return next(AppError.badRequest(phone.error, "VALIDATION_ERROR"));

  if (password.value.length < 8) {
    next(AppError.badRequest("password must be at least 8 characters", "VALIDATION_ERROR"));
    return;
  }

  if (rejectLongPassword(password.value, "password", next) === true) {
    return;
  }

  req.validatedBody = {
    email: email.value,
    password: password.value,
    name: name.value,
    ...(phone.value === undefined ? {} : { phone: phone.value }),
  };
  next();
}

export function validateAdminRegisterBody(
  req: AdminRegisterValidatedRequest & JsonBodyRequest,
  _res: Response,
  next: NextFunction,
): void {
  const email = readRequiredString(req.body, "email");
  const password = readRequiredString(req.body, "password");
  const name = readRequiredString(req.body, "name");
  const phone = readOptionalString(req.body, "phone");
  const adminSecret = readRequiredString(req.body, "adminSecret");

  if ("error" in email) return next(AppError.badRequest(email.error, "VALIDATION_ERROR"));
  if ("error" in password) return next(AppError.badRequest(password.error, "VALIDATION_ERROR"));
  if ("error" in name) return next(AppError.badRequest(name.error, "VALIDATION_ERROR"));
  if ("error" in phone) return next(AppError.badRequest(phone.error, "VALIDATION_ERROR"));
  if ("error" in adminSecret) {
    return next(AppError.badRequest(adminSecret.error, "VALIDATION_ERROR"));
  }

  if (password.value.length < 8) {
    next(AppError.badRequest("password must be at least 8 characters", "VALIDATION_ERROR"));
    return;
  }

  if (rejectLongPassword(password.value, "password", next) === true) {
    return;
  }

  req.validatedBody = {
    email: email.value,
    password: password.value,
    name: name.value,
    adminSecret: adminSecret.value,
    ...(phone.value === undefined ? {} : { phone: phone.value }),
  };
  next();
}

export function validateLoginBody(
  req: LoginValidatedRequest & JsonBodyRequest,
  _res: Response,
  next: NextFunction,
): void {
  const email = readRequiredString(req.body, "email");
  const password = readRequiredString(req.body, "password");

  if ("error" in email) return next(AppError.badRequest(email.error, "VALIDATION_ERROR"));
  if ("error" in password) return next(AppError.badRequest(password.error, "VALIDATION_ERROR"));

  if (rejectLongPassword(password.value, "password", next) === true) {
    return;
  }

  req.validatedBody = { email: email.value, password: password.value };
  next();
}

export function validateRefreshTokenBody(
  req: RefreshTokenValidatedRequest & JsonBodyRequest,
  _res: Response,
  next: NextFunction,
): void {
  const refreshToken = readRequiredString(req.body, "refreshToken");

  if ("error" in refreshToken) {
    next(AppError.badRequest(refreshToken.error, "VALIDATION_ERROR"));
    return;
  }

  req.validatedBody = {
    refreshToken: refreshToken.value,
  };
  next();
}
