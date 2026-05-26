import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { AppError } from "../errors/app-error.js";
import {
  ORDER_STATUSES,
  type OrderStatus,
  type PaymentStatus,
} from "../models/order.model.js";
import type {
  AdminCollectionInput,
  AdminOrderUpdateInput,
  AdminOrdersQuery,
  AdminProductInput,
  AdminProductsQuery,
} from "../types/admin.types.js";
import {
  PRODUCT_AVAILABILITIES,
  PRODUCT_GENDERS,
  type ProductAvailability,
  type ProductGender,
  type ProductType,
} from "../types/product.types.js";
import { FrameMaterial, FrameSize } from "../models/product.model.js";

interface JsonBodyRequest extends Request {
  body: unknown;
}

const PAYMENT_STATUSES: PaymentStatus[] = ["unpaid", "paid", "failed", "refunded"];
const PRODUCT_TYPES: ProductType[] = ["Eyeglasses", "Sunglasses"];

export interface AdminProductsQueryRequest extends Request {
  validatedAdminProductsQuery?: AdminProductsQuery;
}

export interface AdminOrdersQueryRequest extends Request {
  validatedAdminOrdersQuery?: AdminOrdersQuery;
}

export interface AdminProductValidatedRequest extends Request {
  validatedAdminProductBody?: AdminProductInput;
  validatedProductId?: string;
}

export interface AdminCollectionValidatedRequest extends Request {
  validatedAdminCollectionBody?: AdminCollectionInput;
  validatedCollectionId?: string;
}

export interface AdminOrderUpdateValidatedRequest extends Request {
  validatedAdminOrderBody?: AdminOrderUpdateInput;
  validatedOrderId?: string;
}

function parsePositiveInt(
  value: unknown,
  fallback: number,
  max: number,
): number | null {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number.parseInt(value, 10);
  if (Number.isInteger(parsed) === false || parsed < 1) return null;
  return Math.min(parsed, max);
}

function readOptionalString(value: unknown): string | undefined | null {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.trim() === "") return null;
  return value.trim();
}

function readRequiredString(value: unknown): string | null {
  const normalized = readOptionalString(value);
  return normalized === undefined ? null : normalized;
}

function readBoolean(value: unknown): boolean | undefined | null {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  return null;
}

function readNumber(value: unknown): number | null {
  if (typeof value !== "number" || Number.isFinite(value) === false) {
    return null;
  }

  return value;
}

function isProductType(value: string): value is ProductType {
  return PRODUCT_TYPES.includes(value as ProductType);
}

function isProductAvailability(value: string): value is ProductAvailability {
  return PRODUCT_AVAILABILITIES.includes(value as ProductAvailability);
}

function isProductGender(value: string): value is ProductGender {
  return PRODUCT_GENDERS.includes(value as ProductGender);
}

function isOrderStatus(value: string): value is OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus);
}

function isPaymentStatus(value: string): value is PaymentStatus {
  return PAYMENT_STATUSES.includes(value as PaymentStatus);
}

function readObjectId(value: unknown): string | null {
  if (typeof value !== "string" || mongoose.Types.ObjectId.isValid(value) === false) {
    return null;
  }

  return value;
}

function parseVariants(value: unknown): AdminProductInput["variants"] | null {
  if (Array.isArray(value) === false || value.length === 0) {
    return null;
  }

  const variants = value.map((item) => {
    if (typeof item !== "object" || item === null) {
      return null;
    }

    const record = item as Record<string, unknown>;
    const sku = readRequiredString(record.sku);
    const color = readOptionalString(record.color);
    const price = readNumber(record.price);
    const stock = readNumber(record.stock);
    const isDefault = readBoolean(record.isDefault) ?? false;
    const images =
      Array.isArray(record.images) &&
      record.images.every((image) => typeof image === "string")
        ? record.images.map((image) => image.trim()).filter((image) => image !== "")
        : null;

    if (
      sku === null ||
      color === null ||
      price === null ||
      stock === null ||
      stock < 0 ||
      Number.isInteger(stock) === false ||
      price < 0 ||
      images === null
    ) {
      return null;
    }

    return {
      sku,
      ...(color === undefined ? {} : { color }),
      price,
      stock,
      images,
      isDefault,
    };
  });

  if (variants.some((variant) => variant === null)) {
    return null;
  }

  const normalizedVariants = variants as AdminProductInput["variants"];

  if (normalizedVariants.every((variant) => variant.isDefault !== true)) {
    const firstVariant = normalizedVariants[0];

    if (firstVariant === undefined) {
      return null;
    }

    firstVariant.isDefault = true;
  }

  return normalizedVariants;
}

function parseProductBody(body: unknown): AdminProductInput | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const record = body as Record<string, unknown>;
  const name = readRequiredString(record.name);
  const slug = readRequiredString(record.slug);
  const type = readRequiredString(record.type);
  const collectionId = readObjectId(record.collectionId);
  const brand = readRequiredString(record.brand);
  const salePercent = readNumber(record.salePercent);
  const availability = readRequiredString(record.availability);
  const description = readRequiredString(record.description);
  const isActive = readBoolean(record.isActive);
  const variants = parseVariants(record.variants);

  if (
    name === null ||
    slug === null ||
    type === null ||
    collectionId === null ||
    brand === null ||
    salePercent === null ||
    salePercent < 0 ||
    salePercent > 30 ||
    availability === null ||
    description === null ||
    isActive === undefined ||
    isActive === null ||
    variants === null ||
    typeof record.specifications !== "object" ||
    record.specifications === null
  ) {
    return null;
  }

  if (isProductType(type) === false || isProductAvailability(availability) === false) {
    return null;
  }

  const specifications = record.specifications as Record<string, unknown>;
  const gender = readRequiredString(specifications.gender);
  const frameTypeRaw =
    typeof specifications.frameType === "object" && specifications.frameType !== null
      ? (specifications.frameType as Record<string, unknown>)
      : null;
  const sizeRaw =
    frameTypeRaw !== null &&
    typeof frameTypeRaw.size === "object" &&
    frameTypeRaw.size !== null
      ? (frameTypeRaw.size as Record<string, unknown>)
      : null;
  const material = readRequiredString(frameTypeRaw?.material);
  const sizeLabel = readRequiredString(sizeRaw?.label);
  const sizeImage = readRequiredString(sizeRaw?.image);

  if (
    gender === null ||
    material === null ||
    sizeLabel === null ||
    sizeImage === null ||
    isProductGender(gender) === false ||
    Object.values(FrameMaterial).includes(material as FrameMaterial) === false ||
    Object.values(FrameSize).includes(sizeLabel as FrameSize) === false
  ) {
    return null;
  }

  return {
    name,
    slug,
    type,
    collectionId,
    brand,
    salePercent,
    availability,
    description,
    isActive,
    variants,
    specifications: {
      gender,
      frameType: {
        material: material as FrameMaterial,
        size: {
          label: sizeLabel as FrameSize,
          image: sizeImage,
        },
      },
    },
  };
}

export function validateAdminProductsQuery(
  req: AdminProductsQueryRequest,
  _res: Response,
  next: NextFunction,
): void {
  const page = parsePositiveInt(req.query.page, 1, 1_000_000);
  const limit = parsePositiveInt(req.query.limit, 20, 100);
  const q = readOptionalString(req.query.q);
  const collectionId = readOptionalString(req.query.collectionId);
  const isActive = readBoolean(req.query.isActive);

  if (
    page === null ||
    limit === null ||
    q === null ||
    collectionId === null ||
    isActive === null ||
    (collectionId !== undefined && readObjectId(collectionId) === null)
  ) {
    next(AppError.badRequest("Invalid admin products query", "VALIDATION_ERROR"));
    return;
  }

  req.validatedAdminProductsQuery = {
    page,
    limit,
    ...(q === undefined ? {} : { q }),
    ...(collectionId === undefined ? {} : { collectionId }),
    ...(isActive === undefined ? {} : { isActive }),
  };
  next();
}

export function validateAdminOrdersQuery(
  req: AdminOrdersQueryRequest,
  _res: Response,
  next: NextFunction,
): void {
  const page = parsePositiveInt(req.query.page, 1, 1_000_000);
  const limit = parsePositiveInt(req.query.limit, 20, 100);
  const status = readOptionalString(req.query.status);
  const paymentStatus = readOptionalString(req.query.paymentStatus);

  if (
    page === null ||
    limit === null ||
    status === null ||
    paymentStatus === null ||
    (status !== undefined && isOrderStatus(status) === false) ||
    (paymentStatus !== undefined && isPaymentStatus(paymentStatus) === false)
  ) {
    next(AppError.badRequest("Invalid admin orders query", "VALIDATION_ERROR"));
    return;
  }

  req.validatedAdminOrdersQuery = {
    page,
    limit,
    ...(status === undefined ? {} : { status }),
    ...(paymentStatus === undefined ? {} : { paymentStatus }),
  };
  next();
}

export function validateAdminProductBody(
  req: AdminProductValidatedRequest & JsonBodyRequest,
  _res: Response,
  next: NextFunction,
): void {
  const body = parseProductBody(req.body);

  if (body === null) {
    next(AppError.badRequest("Invalid product payload", "VALIDATION_ERROR"));
    return;
  }

  req.validatedAdminProductBody = body;
  next();
}

export function validateProductIdParam(
  req: AdminProductValidatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  const productId = readObjectId(req.params.productId);

  if (productId === null) {
    next(AppError.badRequest("productId is invalid", "VALIDATION_ERROR"));
    return;
  }

  req.validatedProductId = productId;
  next();
}

export function validateAdminCollectionBody(
  req: AdminCollectionValidatedRequest & JsonBodyRequest,
  _res: Response,
  next: NextFunction,
): void {
  if (typeof req.body !== "object" || req.body === null) {
    next(AppError.badRequest("Invalid collection payload", "VALIDATION_ERROR"));
    return;
  }

  const record = req.body as Record<string, unknown>;
  const name = readRequiredString(record.name);
  const slug = readRequiredString(record.slug);

  if (name === null || slug === null) {
    next(AppError.badRequest("Invalid collection payload", "VALIDATION_ERROR"));
    return;
  }

  req.validatedAdminCollectionBody = { name, slug };
  next();
}

export function validateCollectionIdParam(
  req: AdminCollectionValidatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  const collectionId = readObjectId(req.params.collectionId);

  if (collectionId === null) {
    next(AppError.badRequest("collectionId is invalid", "VALIDATION_ERROR"));
    return;
  }

  req.validatedCollectionId = collectionId;
  next();
}

export function validateAdminOrderUpdateBody(
  req: AdminOrderUpdateValidatedRequest & JsonBodyRequest,
  _res: Response,
  next: NextFunction,
): void {
  if (typeof req.body !== "object" || req.body === null) {
    next(AppError.badRequest("Invalid order payload", "VALIDATION_ERROR"));
    return;
  }

  const record = req.body as Record<string, unknown>;
  const status = readOptionalString(record.status);
  const paymentStatus = readOptionalString(record.paymentStatus);

  if (
    status === null ||
    paymentStatus === null ||
    (status !== undefined && isOrderStatus(status) === false) ||
    (paymentStatus !== undefined && isPaymentStatus(paymentStatus) === false) ||
    (status === undefined && paymentStatus === undefined)
  ) {
    next(AppError.badRequest("Invalid order update payload", "VALIDATION_ERROR"));
    return;
  }

  req.validatedAdminOrderBody = {
    ...(status === undefined ? {} : { status }),
    ...(paymentStatus === undefined ? {} : { paymentStatus }),
  };
  next();
}

export function validateAdminOrderIdParam(
  req: AdminOrderUpdateValidatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  const orderId = readObjectId(req.params.orderId);

  if (orderId === null) {
    next(AppError.badRequest("orderId is invalid", "VALIDATION_ERROR"));
    return;
  }

  req.validatedOrderId = orderId;
  next();
}
