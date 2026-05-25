import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error.js";
import { readObjectId } from "./validation-readers.js";
import {
  ORDER_STATUSES,
  PAYMENT_METHODS,
  type IShippingAddress,
  type OrderStatus,
  type PaymentMethod,
} from "../models/order.model.js";
import type {
  CheckoutInput,
  OrderListQuery,
} from "../types/order.types.js";

interface JsonBodyRequest extends Request {
  body: unknown;
}

export interface CheckoutValidatedRequest extends Request {
  validatedBody?: CheckoutInput;
}

export interface OrderIdValidatedRequest extends Request {
  validatedOrderId?: string;
}

export interface OrderListValidatedRequest extends Request {
  validatedOrderListQuery?: OrderListQuery;
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

function parseShippingAddress(value: unknown): IShippingAddress | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const address = value as Record<string, unknown>;
  const recipientName = readRequiredString(address.recipientName);
  const phone = readRequiredString(address.phone);
  const line1 = readRequiredString(address.line1);
  const city = readRequiredString(address.city);
  const country = readOptionalString(address.country);
  const line2 = readOptionalString(address.line2);
  const ward = readOptionalString(address.ward);
  const district = readOptionalString(address.district);
  const province = readOptionalString(address.province);
  const postalCode = readOptionalString(address.postalCode);

  if (
    recipientName === null ||
    phone === null ||
    line1 === null ||
    city === null ||
    country === null ||
    line2 === null ||
    ward === null ||
    district === null ||
    province === null ||
    postalCode === null
  ) {
    return null;
  }

  return {
    recipientName,
    phone,
    line1,
    city,
    country: country ?? "Vietnam",
    ...(line2 === undefined ? {} : { line2 }),
    ...(ward === undefined ? {} : { ward }),
    ...(district === undefined ? {} : { district }),
    ...(province === undefined ? {} : { province }),
    ...(postalCode === undefined ? {} : { postalCode }),
  };
}

function isPaymentMethod(value: string): value is PaymentMethod {
  return PAYMENT_METHODS.includes(value as PaymentMethod);
}

function isOrderStatus(value: string): value is OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus);
}

export function validateCheckoutBody(
  req: CheckoutValidatedRequest & JsonBodyRequest,
  _res: Response,
  next: NextFunction,
): void {
  if (typeof req.body !== "object" || req.body === null) {
    next(AppError.badRequest("Invalid checkout payload", "VALIDATION_ERROR"));
    return;
  }

  const body = req.body as Record<string, unknown>;
  const shippingAddress = parseShippingAddress(body.shippingAddress);
  const paymentMethod = readOptionalString(body.paymentMethod);

  if (shippingAddress === null) {
    next(AppError.badRequest("shippingAddress is invalid", "VALIDATION_ERROR"));
    return;
  }

  if (
    paymentMethod === null ||
    (paymentMethod !== undefined && isPaymentMethod(paymentMethod) === false)
  ) {
    next(AppError.badRequest("paymentMethod is invalid", "VALIDATION_ERROR"));
    return;
  }

  req.validatedBody = {
    shippingAddress,
    ...(paymentMethod === undefined ? {} : { paymentMethod }),
  };
  next();
}

export function validateOrderIdParam(
  req: OrderIdValidatedRequest,
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

function parsePositiveQueryInteger(
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

export function validateOrderListQuery(
  req: OrderListValidatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  const page = parsePositiveQueryInteger(req.query.page, 1, 1_000_000);
  const limit = parsePositiveQueryInteger(req.query.limit, 20, 100);
  const statusValue =
    typeof req.query.status === "string"
      ? req.query.status.trim().toLowerCase()
      : undefined;

  if (page === null || limit === null) {
    next(AppError.badRequest("Pagination is invalid", "VALIDATION_ERROR"));
    return;
  }

  if (statusValue !== undefined && isOrderStatus(statusValue) === false) {
    next(AppError.badRequest("status is invalid", "VALIDATION_ERROR"));
    return;
  }

  req.validatedOrderListQuery = {
    page,
    limit,
    ...(statusValue === undefined ? {} : { status: statusValue }),
  };
  next();
}
