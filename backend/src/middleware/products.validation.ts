import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error.js";
import { FrameMaterial, FrameSize } from "../models/product.model.js";
import {
  DEFAULT_PRODUCT_SORT,
  PRODUCT_SORTS,
  type CollectionProductsQueryParams,
  type ProductQueryParams,
  type ProductSearchQueryParams,
  type ProductType,
  type ProductGender,
  type ValidatedCollectionProductsQuery,
  type ValidatedProductQuery,
  type ValidatedProductSearchQuery,
} from "../types/product.types.js";

export interface ProductValidatedRequest extends Request {
  validatedQuery?: ValidatedProductQuery;
}

export interface CollectionProductsValidatedRequest extends Request {
  validatedQuery?: ValidatedCollectionProductsQuery;
}

export interface ProductSearchValidatedRequest extends Request {
  validatedQuery?: ValidatedProductSearchQuery;
}

export function parsePagination(query: {
  offset?: number | string;
  limit?: number | string;
}): { offset: number; limit: number } | { error: string } {
  const offset = Number.parseInt(String(query.offset ?? "0"), 10) || 0;
  let limit = Number.parseInt(String(query.limit ?? "12"), 10) || 12;

  if (offset < 0) {
    return { error: "Offset must be a non-negative number" };
  }

  if (limit < 1) {
    return { error: "Limit must be at least 1" };
  }

  if (limit > 100) {
    limit = 100;
  }

  return { offset, limit };
}

function parseTypeParam(
  typeParam?: string,
): { type: ProductType | null } | { error: string } {
  if (typeParam === undefined) {
    return { type: null };
  }

  const normalized = typeParam.trim().toLowerCase();

  if (normalized === "eyeglasses") {
    return { type: "Eyeglasses" };
  }

  if (normalized === "sunglasses") {
    return { type: "Sunglasses" };
  }

  return { error: "Invalid type. Use Eyeglasses or Sunglasses." };
}

function parseSaleParam(
  saleParam?: string,
): { sale: boolean } | { error: string } {
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
}

function parseSortParam(
  sortParam?: string,
): { sort: ValidatedProductQuery["sort"] } | { error: string } {
  if (sortParam === undefined) {
    return { sort: DEFAULT_PRODUCT_SORT };
  }

  if (PRODUCT_SORTS.includes(sortParam as ValidatedProductQuery["sort"])) {
    return { sort: sortParam as ValidatedProductQuery["sort"] };
  }

  return { error: "Invalid sort." };
}

function parseGenderParam(
  genderParam?: string,
): { gender: ProductGender | null } | { error: string } {
  if (genderParam === undefined) {
    return { gender: null };
  }

  const normalized = genderParam.trim().toLowerCase();

  if (normalized === "male" || normalized === "men") {
    return { gender: "Male" };
  }

  if (normalized === "female" || normalized === "women") {
    return { gender: "Female" };
  }

  if (normalized === "unisex") {
    return { gender: "Unisex" };
  }

  return { error: "Invalid gender. Use Male, Female, or Unisex." };
}

function parseSearchQueryParam(
  value?: string,
): { q: string } | { error: string } {
  const normalized = value?.trim() ?? "";

  if (normalized === "") {
    return { error: "Search query is required." };
  }

  if (normalized.length < 2) {
    return { error: "Search query must be at least 2 characters." };
  }

  return { q: normalized };
}

function normalizeCollectionSlug(value?: string): string | null {
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
}

function parseFrameTypeParam(
  frameTypeParam?: string,
): { frameType: FrameMaterial | null } | { error: string } {
  if (frameTypeParam === undefined) {
    return { frameType: null };
  }

  const normalized = frameTypeParam.trim().toLowerCase();

  if (normalized === "acetate") {
    return { frameType: FrameMaterial.Acetate };
  }

  if (normalized === "metal") {
    return { frameType: FrameMaterial.Metal };
  }

  return { error: "Invalid frameType." };
}

function parseFrameSizeParam(
  frameSizeParam?: string,
): { frameSize: FrameSize | null } | { error: string } {
  if (frameSizeParam === undefined) {
    return { frameSize: null };
  }

  const normalized = frameSizeParam.trim().toLowerCase();

  if (normalized === "small") {
    return { frameSize: FrameSize.Small };
  }

  if (normalized === "medium") {
    return { frameSize: FrameSize.Medium };
  }

  if (normalized === "big") {
    return { frameSize: FrameSize.Big };
  }

  return { error: "Invalid frameSize." };
}

export function validateCollectionProductsQuery(
  req: CollectionProductsValidatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  const query = req.query as CollectionProductsQueryParams;
  const pagination = parsePagination(query);

  if ("error" in pagination) {
    next(AppError.badRequest(pagination.error, "VALIDATION_ERROR"));
    return;
  }

  const frameType = parseFrameTypeParam(query.frameType);
  if ("error" in frameType) {
    next(AppError.badRequest(frameType.error, "VALIDATION_ERROR"));
    return;
  }

  const frameSize = parseFrameSizeParam(query.frameSize);
  if ("error" in frameSize) {
    next(AppError.badRequest(frameSize.error, "VALIDATION_ERROR"));
    return;
  }

  const sort = parseSortParam(query.sort);
  if ("error" in sort) {
    next(AppError.badRequest(sort.error, "VALIDATION_ERROR"));
    return;
  }

  req.validatedQuery = {
    frameType: frameType.frameType,
    frameSize: frameSize.frameSize,
    offset: pagination.offset,
    limit: pagination.limit,
    sort: sort.sort,
  };

  next();
}

export function validateProductQuery(
  req: ProductValidatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  const query = req.query as ProductQueryParams;
  const pagination = parsePagination(query);

  if ("error" in pagination) {
    next(AppError.badRequest(pagination.error, "VALIDATION_ERROR"));
    return;
  }

  const type = parseTypeParam(query.type);
  if ("error" in type) {
    next(AppError.badRequest(type.error, "VALIDATION_ERROR"));
    return;
  }

  const frameType = parseFrameTypeParam(query.frameType);
  if ("error" in frameType) {
    next(AppError.badRequest(frameType.error, "VALIDATION_ERROR"));
    return;
  }

  const frameSize = parseFrameSizeParam(query.frameSize);
  if ("error" in frameSize) {
    next(AppError.badRequest(frameSize.error, "VALIDATION_ERROR"));
    return;
  }

  const sale = parseSaleParam(query.sale);
  if ("error" in sale) {
    next(AppError.badRequest(sale.error, "VALIDATION_ERROR"));
    return;
  }

  const sort = parseSortParam(query.sort);
  if ("error" in sort) {
    next(AppError.badRequest(sort.error, "VALIDATION_ERROR"));
    return;
  }

  const gender = parseGenderParam(query.gender);
  if ("error" in gender) {
    next(AppError.badRequest(gender.error, "VALIDATION_ERROR"));
    return;
  }

  req.validatedQuery = {
    type: type.type,
    frameType: frameType.frameType,
    frameSize: frameSize.frameSize,
    collectionSlug: normalizeCollectionSlug(query.collectionSlug),
    gender: gender.gender,
    sale: sale.sale,
    offset: pagination.offset,
    limit: pagination.limit,
    sort: sort.sort,
  };

  next();
}

export function validateProductSearchQuery(
  req: ProductSearchValidatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  const query = req.query as ProductSearchQueryParams;
  const pagination = parsePagination(query);

  if ("error" in pagination) {
    next(AppError.badRequest(pagination.error, "VALIDATION_ERROR"));
    return;
  }

  const q = parseSearchQueryParam(query.q);
  if ("error" in q) {
    next(AppError.badRequest(q.error, "VALIDATION_ERROR"));
    return;
  }

  const type = parseTypeParam(query.type);
  if ("error" in type) {
    next(AppError.badRequest(type.error, "VALIDATION_ERROR"));
    return;
  }

  const gender = parseGenderParam(query.gender);
  if ("error" in gender) {
    next(AppError.badRequest(gender.error, "VALIDATION_ERROR"));
    return;
  }

  const sale = parseSaleParam(query.sale);
  if ("error" in sale) {
    next(AppError.badRequest(sale.error, "VALIDATION_ERROR"));
    return;
  }

  req.validatedQuery = {
    q: q.q,
    type: type.type,
    gender: gender.gender,
    sale: sale.sale,
    offset: pagination.offset,
    limit: pagination.limit,
  };

  next();
}
