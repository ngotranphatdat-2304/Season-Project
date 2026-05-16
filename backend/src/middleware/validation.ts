import type { NextFunction, Request, Response } from "express";
import type {
  EyeglassesQueryParams,
  SunglassesQueryParams,
  ValidatedEyeglassesQuery,
  ValidatedSunglassesQuery,
} from "../types/eyewear.js";

export interface EyeglassesValidatedRequest extends Request {
  validatedQuery?: ValidatedEyeglassesQuery;
}

export interface SunglassesValidatedRequest extends Request {
  validatedQuery?: ValidatedSunglassesQuery;
}

const parsePagination = (query: { offset?: number | string; limit?: number | string }) => {
  const offset = parseInt(query.offset as string) || 0;
  let limit = parseInt(query.limit as string) || 12;

  if (offset < 0) {
    return { error: "Offset must be a non-negative number" };
  }

  if (limit < 1) {
    return { error: "Limit must be at least 1" };
  }

  if (limit > 100) {
    limit = 100;
  }

  return {
    offset,
    limit,
  };
};

export const validateEyeglassesQuery = (
  req: EyeglassesValidatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  const query = req.query as EyeglassesQueryParams;
  const pagination = parsePagination(query);

  if ("error" in pagination) {
    res.status(400).json({
      error: pagination.error,
    });
    return;
  }

  let frameType = query.frameType?.trim() || null;
  if (frameType && !["acetate", "metal"].includes(frameType.toLowerCase())) {
    res.status(400).json({
      error: "Invalid frameType. Use 'Acetate' or 'Metal'",
    });
    return;
  }

  if (frameType) {
    frameType =
      frameType.charAt(0).toUpperCase() + frameType.slice(1).toLowerCase();
  }

  req.validatedQuery = {
    frameType: frameType as ValidatedEyeglassesQuery["frameType"],
    offset: pagination.offset,
    limit: pagination.limit,
  };

  next();
};

export const validateSunglassesQuery = (
  req: SunglassesValidatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  const query = req.query as SunglassesQueryParams;
  const pagination = parsePagination(query);

  if ("error" in pagination) {
    res.status(400).json({
      error: pagination.error,
    });
    return;
  }

  req.validatedQuery = pagination;
  next();
};
