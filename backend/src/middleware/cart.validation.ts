import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error.js";
import {
  readObjectId,
  readPositiveInteger,
} from "./validation-readers.js";
import type {
  AddCartItemInput,
  CartSkuInput,
  UpdateCartItemInput,
} from "../types/cart.types.js";

interface JsonBodyRequest extends Request {
  body: unknown;
}

export interface AddCartItemValidatedRequest extends Request {
  validatedBody?: AddCartItemInput;
}

export interface UpdateCartItemValidatedRequest extends Request {
  validatedBody?: UpdateCartItemInput;
}

export interface CartProductParamValidatedRequest extends Request {
  validatedProductId?: string;
}

export interface CartSkuValidatedRequest extends Request {
  validatedSku?: string;
  validatedSkuBody?: CartSkuInput;
}

export function validateAddCartItemBody(
  req: AddCartItemValidatedRequest & JsonBodyRequest,
  res: Response,
  next: NextFunction,
): void {
  if (typeof req.body !== "object" || req.body === null) {
    next(AppError.badRequest("Invalid cart item payload", "VALIDATION_ERROR"));
    return;
  }

  const body = req.body as Record<string, unknown>;
  const productId = readObjectId(body.productId);
  const quantity = readPositiveInteger(body.quantity);

  if (productId === null) {
    next(
      AppError.badRequest(
        "productId must be a valid ObjectId",
        "VALIDATION_ERROR",
      ),
    );
    return;
  }

  if (quantity === null) {
    next(
      AppError.badRequest(
        "quantity must be a positive integer",
        "VALIDATION_ERROR",
      ),
    );
    return;
  }

  req.validatedBody = {
    productId,
    quantity,
  };
  next();
}

export function validateCartProductParam(
  req: CartProductParamValidatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const productId = readObjectId(req.params.productId);

  if (productId === null) {
    next(
      AppError.badRequest(
        "productId must be a valid ObjectId",
        "VALIDATION_ERROR",
      ),
    );
    return;
  }

  req.validatedProductId = productId;
  next();
}

export function validateUpdateCartItemBody(
  req: UpdateCartItemValidatedRequest &
    CartProductParamValidatedRequest &
    JsonBodyRequest,
  res: Response,
  next: NextFunction,
): void {
  if (typeof req.body !== "object" || req.body === null) {
    next(AppError.badRequest("Invalid cart item payload", "VALIDATION_ERROR"));
    return;
  }

  const productId = req.validatedProductId;
  const quantity = readPositiveInteger(
    (req.body as Record<string, unknown>).quantity,
  );

  if (productId === undefined) {
    next(AppError.badRequest("Invalid productId", "VALIDATION_ERROR"));
    return;
  }

  if (quantity === null) {
    next(
      AppError.badRequest(
        "quantity must be a positive integer",
        "VALIDATION_ERROR",
      ),
    );
    return;
  }

  req.validatedBody = {
    productId,
    quantity,
  };
  next();
}

function readSku(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  return value.trim();
}

export function validateAddCartSkuBody(
  req: CartSkuValidatedRequest & JsonBodyRequest,
  res: Response,
  next: NextFunction,
): void {
  if (typeof req.body !== "object" || req.body === null) {
    next(AppError.badRequest("Invalid cart item payload", "VALIDATION_ERROR"));
    return;
  }

  const body = req.body as Record<string, unknown>;
  const sku = readSku(body.sku);
  const quantity = readPositiveInteger(body.quantity);

  if (sku === null) {
    next(AppError.badRequest("sku is required", "VALIDATION_ERROR"));
    return;
  }

  if (quantity === null) {
    next(
      AppError.badRequest(
        "quantity must be a positive integer",
        "VALIDATION_ERROR",
      ),
    );
    return;
  }

  req.validatedSkuBody = {
    sku,
    quantity,
  };
  next();
}

export function validateCartSkuParam(
  req: CartSkuValidatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const sku = readSku(req.params.sku);

  if (sku === null) {
    next(AppError.badRequest("sku is invalid", "VALIDATION_ERROR"));
    return;
  }

  req.validatedSku = sku;
  next();
}

export function validateUpdateCartSkuBody(
  req: CartSkuValidatedRequest & JsonBodyRequest,
  res: Response,
  next: NextFunction,
): void {
  if (typeof req.body !== "object" || req.body === null) {
    next(AppError.badRequest("Invalid cart item payload", "VALIDATION_ERROR"));
    return;
  }

  const sku = req.validatedSku;
  const quantity = readPositiveInteger(
    (req.body as Record<string, unknown>).quantity,
  );

  if (sku === undefined) {
    next(AppError.badRequest("sku is invalid", "VALIDATION_ERROR"));
    return;
  }

  if (quantity === null) {
    next(
      AppError.badRequest(
        "quantity must be a positive integer",
        "VALIDATION_ERROR",
      ),
    );
    return;
  }

  req.validatedSkuBody = {
    sku,
    quantity,
  };
  next();
}
