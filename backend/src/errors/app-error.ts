export type AppErrorDetails = unknown;

export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: AppErrorDetails;

  constructor(
    statusCode: number,
    message: string,
    code: string,
    details?: AppErrorDetails,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;

    if (details !== undefined) {
      this.details = details;
    }
  }

  static badRequest(
    message: string,
    code = "BAD_REQUEST",
    details?: AppErrorDetails,
  ): AppError {
    return new AppError(400, message, code, details);
  }

  static unauthorized(message: string): AppError {
    return new AppError(401, message, "UNAUTHORIZED");
  }

  static forbidden(message: string): AppError {
    return new AppError(403, message, "FORBIDDEN");
  }

  static notFound(message: string): AppError {
    return new AppError(404, message, "NOT_FOUND");
  }
}
