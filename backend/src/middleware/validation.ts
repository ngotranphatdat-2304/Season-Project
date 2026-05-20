import type { NextFunction, Request, Response } from "express";
import { FrameSize, FrameMaterial } from "../models/Eyeglasses.js";
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

const parsePagination = (query: {
  offset?: number | string;
  limit?: number | string;
}) => {
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

const parseSaleParam = (saleParam?: string): { sale: boolean } | { error: string } => {
  if (saleParam === undefined) {
    return { sale: false };
  }

  const normalized = saleParam.trim().toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) {
    return { sale: true };
  }

  if (["false", "0", "no"].includes(normalized)) {
    return { sale: false };
  }

  return { error: "Invalid sale. Use true or false." };
};

const normalizeCollectionSlug = (value?: string): string | null => {
  if (value === undefined) {
    return null;
  }

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized === "" ? null : normalized;
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

  const frameType =
    FrameMaterial[query.frameType as keyof typeof FrameMaterial] || null;

  if (query.frameType && frameType === null) {
    res.status(400).json({
      error: "Invalid frameType.",
    });
    return;
  }

  const frameSize =
    FrameSize[query.frameSize as keyof typeof FrameSize] || null;
  if (query.frameSize && frameSize === null) {
    res.status(400).json({
      error: "Invalid frameSize.",
    });
    return;
  }

  const sale = parseSaleParam(query.sale);
  if ("error" in sale) {
    res.status(400).json({ error: sale.error });
    return;
  }

  req.validatedQuery = {
    frameType: frameType,
    frameSize: frameSize,
    sale: sale.sale,
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

  const sale = parseSaleParam(query.sale);
  if ("error" in sale) {
    res.status(400).json({ error: sale.error });
    return;
  }

  const collectionSlug = normalizeCollectionSlug(query.collectionSlug);

  req.validatedQuery = {
    collectionSlug,
    ...pagination,
    sale: sale.sale,
  };
  next();
};
