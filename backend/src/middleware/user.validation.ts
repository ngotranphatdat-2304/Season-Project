import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error.js";
import type {
  ChangePasswordInput,
  UserAddressInput,
  UserAddressUpdateInput,
  UserProfileUpdateInput,
} from "../types/user.types.js";
import { readObjectId } from "./validation-readers.js";

interface JsonBodyRequest extends Request {
  body: unknown;
}

export interface UserProfileUpdateValidatedRequest extends Request {
  validatedProfileUpdateBody?: UserProfileUpdateInput;
}

export interface ChangePasswordValidatedRequest extends Request {
  validatedChangePasswordBody?: ChangePasswordInput;
}

export interface UserAddressValidatedRequest extends Request {
  validatedAddressBody?: UserAddressInput;
  validatedAddressUpdateBody?: UserAddressUpdateInput;
  validatedAddressId?: string;
}

export interface UserIdValidatedRequest extends Request {
  validatedUserId?: string;
}

function hasOwn(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function readRequiredString(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  return value.trim();
}

function readOptionalBoolean(value: unknown): boolean | undefined | null {
  if (value === undefined) {
    return undefined;
  }

  return typeof value === "boolean" ? value : null;
}

function readOptionalStringField(
  body: Record<string, unknown>,
  key: string,
): string | undefined | null {
  if (hasOwn(body, key) === false) {
    return undefined;
  }

  return readRequiredString(body[key]);
}

export function validateProfileUpdateBody(
  req: UserProfileUpdateValidatedRequest & JsonBodyRequest,
  res: Response,
  next: NextFunction,
): void {
  if (typeof req.body !== "object" || req.body === null) {
    next(AppError.badRequest("Invalid profile payload", "VALIDATION_ERROR"));
    return;
  }

  const body = req.body as Record<string, unknown>;
  const name = readOptionalStringField(body, "name");
  const phone = readOptionalStringField(body, "phone");
  const avatar = readOptionalStringField(body, "avatar");

  if (name === null || phone === null || avatar === null) {
    next(AppError.badRequest("Profile fields are invalid", "VALIDATION_ERROR"));
    return;
  }

  if (name === undefined && phone === undefined && avatar === undefined) {
    next(
      AppError.badRequest(
        "Provide at least one profile field to update",
        "VALIDATION_ERROR",
      ),
    );
    return;
  }

  req.validatedProfileUpdateBody = {
    ...(name === undefined ? {} : { name }),
    ...(phone === undefined ? {} : { phone }),
    ...(avatar === undefined ? {} : { avatar }),
  };
  next();
}

export function validateChangePasswordBody(
  req: ChangePasswordValidatedRequest & JsonBodyRequest,
  res: Response,
  next: NextFunction,
): void {
  if (typeof req.body !== "object" || req.body === null) {
    next(AppError.badRequest("Invalid password payload", "VALIDATION_ERROR"));
    return;
  }

  const body = req.body as Record<string, unknown>;
  const currentPassword = readRequiredString(body.currentPassword);
  const newPassword = readRequiredString(body.newPassword);

  if (currentPassword === null) {
    next(
      AppError.badRequest("currentPassword is required", "VALIDATION_ERROR"),
    );
    return;
  }

  if (newPassword === null || newPassword.length < 8) {
    next(
      AppError.badRequest(
        "newPassword must be at least 8 characters",
        "VALIDATION_ERROR",
      ),
    );
    return;
  }

  req.validatedChangePasswordBody = {
    currentPassword,
    newPassword,
  };
  next();
}

export function validateAddressIdParam(
  req: UserAddressValidatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const addressId = readObjectId(req.params.addressId);

  if (addressId === null) {
    next(AppError.badRequest("addressId is invalid", "VALIDATION_ERROR"));
    return;
  }

  req.validatedAddressId = addressId;
  next();
}

export function validateUserIdParam(
  req: UserIdValidatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const userId = readObjectId(req.params.userId);

  if (userId === null) {
    next(AppError.badRequest("userId is invalid", "VALIDATION_ERROR"));
    return;
  }

  req.validatedUserId = userId;
  next();
}

export function validateCreateAddressBody(
  req: UserAddressValidatedRequest & JsonBodyRequest,
  res: Response,
  next: NextFunction,
): void {
  if (typeof req.body !== "object" || req.body === null) {
    next(AppError.badRequest("Invalid address payload", "VALIDATION_ERROR"));
    return;
  }

  const body = req.body as Record<string, unknown>;
  const address = readRequiredString(body.address);
  const label = readOptionalStringField(body, "label");
  const isDefault = readOptionalBoolean(body.isDefault);

  if (address === null) {
    next(AppError.badRequest("address is required", "VALIDATION_ERROR"));
    return;
  }

  if (label === null || isDefault === null) {
    next(AppError.badRequest("Address fields are invalid", "VALIDATION_ERROR"));
    return;
  }

  req.validatedAddressBody = {
    address,
    ...(label === undefined ? {} : { label }),
    ...(isDefault === undefined ? {} : { isDefault }),
  };
  next();
}

export function validateUpdateAddressBody(
  req: UserAddressValidatedRequest & JsonBodyRequest,
  res: Response,
  next: NextFunction,
): void {
  if (typeof req.body !== "object" || req.body === null) {
    next(AppError.badRequest("Invalid address payload", "VALIDATION_ERROR"));
    return;
  }

  const body = req.body as Record<string, unknown>;
  const address = readOptionalStringField(body, "address");
  const label = readOptionalStringField(body, "label");
  const isDefault = hasOwn(body, "isDefault")
    ? readOptionalBoolean(body.isDefault)
    : undefined;

  if (address === null || label === null || isDefault === null) {
    next(AppError.badRequest("Address fields are invalid", "VALIDATION_ERROR"));
    return;
  }

  if (address === undefined && label === undefined && isDefault === undefined) {
    next(
      AppError.badRequest(
        "Provide at least one address field to update",
        "VALIDATION_ERROR",
      ),
    );
    return;
  }

  req.validatedAddressUpdateBody = {
    ...(address === undefined ? {} : { address }),
    ...(label === undefined ? {} : { label }),
    ...(isDefault === undefined ? {} : { isDefault }),
  };
  next();
}
