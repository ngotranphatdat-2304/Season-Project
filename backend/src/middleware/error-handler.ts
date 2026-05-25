import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from "express";
import mongoose from "mongoose";
import { AppError, type AppErrorDetails } from "../errors/app-error.js";
import type { ErrorResponse } from "../types/product.types.js";

interface NormalizedError {
  statusCode: number;
  code: string;
  message: string;
  details?: AppErrorDetails;
}

interface ErrorWithStatus {
  message?: unknown;
  status?: unknown;
  statusCode?: unknown;
}

function defaultCodeForStatus(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    default:
      return statusCode >= 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_ERROR";
  }
}

function readStatusCode(error: unknown): number | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const errorWithStatus = error as ErrorWithStatus;
  const statusCode =
    typeof errorWithStatus.statusCode === "number"
      ? errorWithStatus.statusCode
      : errorWithStatus.status;

  if (
    typeof statusCode !== "number" ||
    Number.isInteger(statusCode) === false ||
    statusCode < 400 ||
    statusCode > 599
  ) {
    return null;
  }

  return statusCode;
}

function readSafeMessage(error: unknown, statusCode: number): string {
  if (statusCode >= 500) {
    return "Internal server error";
  }

  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim() !== ""
  ) {
    return error.message;
  }

  return "Request failed";
}

function isDuplicateKeyError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  return "code" in error && error.code === 11000;
}

function normalizeMongooseValidationError(
  error: mongoose.Error.ValidationError,
): NormalizedError {
  const details = Object.values(error.errors).map((validationError) => ({
    path: validationError.path,
    message: validationError.message,
  }));

  return {
    statusCode: 400,
    code: "VALIDATION_ERROR",
    message: "Request validation failed",
    details,
  };
}

function normalizeError(error: unknown): NormalizedError {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      ...(error.details === undefined ? {} : { details: error.details }),
    };
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return normalizeMongooseValidationError(error);
  }

  if (error instanceof mongoose.Error.CastError) {
    return {
      statusCode: 400,
      code: "CAST_ERROR",
      message: `${error.path} is invalid`,
    };
  }

  if (error instanceof mongoose.Error.VersionError) {
    return {
      statusCode: 409,
      code: "CONCURRENT_UPDATE",
      message: "Record changed during update. Retry the request.",
    };
  }

  if (isDuplicateKeyError(error)) {
    return {
      statusCode: 409,
      code: "DUPLICATE_KEY",
      message: "A record with that value already exists",
    };
  }

  const statusCode = readStatusCode(error);

  if (statusCode !== null) {
    return {
      statusCode,
      code: defaultCodeForStatus(statusCode),
      message: readSafeMessage(error, statusCode),
    };
  }

  return {
    statusCode: 500,
    code: "INTERNAL_SERVER_ERROR",
    message: "Internal server error",
  };
}

export function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

export const globalErrorHandler: ErrorRequestHandler = (
  error: unknown,
  _req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction,
): void => {
  if (res.headersSent === true) {
    next(error);
    return;
  }

  const normalizedError = normalizeError(error);

  if (normalizedError.statusCode >= 500) {
    console.error("Unhandled backend error:", error);
  }

  res.status(normalizedError.statusCode).json({
    success: false,
    error: {
      statusCode: normalizedError.statusCode,
      code: normalizedError.code,
      message: normalizedError.message,
      ...(normalizedError.details === undefined
        ? {}
        : { details: normalizedError.details }),
    },
  });
};
