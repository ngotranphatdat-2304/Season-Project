import type { Response } from "express";
import { AppError } from "../errors/app-error.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import type {
  AdminCollectionValidatedRequest,
  AdminOrderUpdateValidatedRequest,
  AdminOrdersQueryRequest,
  AdminProductValidatedRequest,
  AdminProductsQueryRequest,
} from "../middleware/admin.validation.js";
import type { ErrorResponse } from "../types/product.types.js";
import type {
  AdminCollectionListResponse,
  AdminCollectionResponse,
  AdminDashboardResponse,
  AdminOrderListResponse,
  AdminOrderResponse,
  AdminProductListResponse,
  AdminProductResponse,
} from "../types/admin.types.js";
import {
  createAdminCollection,
  createAdminProduct,
  getAdminDashboard,
  listAdminCollections,
  listAdminOrders,
  listAdminProducts,
  updateAdminCollection,
  updateAdminOrder,
  updateAdminProduct,
} from "../services/admin.service.js";

function assertAdminRequest(req: AuthenticatedRequest): void {
  if (req.authUserId === undefined || req.authUserRole !== "admin") {
    throw AppError.forbidden("Admin access is required");
  }
}

export async function getDashboard(
  req: AuthenticatedRequest,
  res: Response<AdminDashboardResponse | ErrorResponse>,
): Promise<void> {
  assertAdminRequest(req);
  res.status(200).json(await getAdminDashboard());
}

export async function getProducts(
  req: AuthenticatedRequest & AdminProductsQueryRequest,
  res: Response<AdminProductListResponse | ErrorResponse>,
): Promise<void> {
  assertAdminRequest(req);

  if (req.validatedAdminProductsQuery === undefined) {
    throw AppError.badRequest("Invalid admin products query");
  }

  res.status(200).json(await listAdminProducts(req.validatedAdminProductsQuery));
}

export async function createProduct(
  req: AuthenticatedRequest & AdminProductValidatedRequest,
  res: Response<AdminProductResponse | ErrorResponse>,
): Promise<void> {
  assertAdminRequest(req);

  if (req.validatedAdminProductBody === undefined) {
    throw AppError.badRequest("Invalid product payload");
  }

  res.status(201).json(await createAdminProduct(req.validatedAdminProductBody));
}

export async function updateProduct(
  req: AuthenticatedRequest & AdminProductValidatedRequest,
  res: Response<AdminProductResponse | ErrorResponse>,
): Promise<void> {
  assertAdminRequest(req);

  if (
    req.validatedProductId === undefined ||
    req.validatedAdminProductBody === undefined
  ) {
    throw AppError.badRequest("Invalid product payload");
  }

  res
    .status(200)
    .json(await updateAdminProduct(req.validatedProductId, req.validatedAdminProductBody));
}

export async function getCollections(
  req: AuthenticatedRequest,
  res: Response<AdminCollectionListResponse | ErrorResponse>,
): Promise<void> {
  assertAdminRequest(req);
  res.status(200).json(await listAdminCollections());
}

export async function createCollection(
  req: AuthenticatedRequest & AdminCollectionValidatedRequest,
  res: Response<AdminCollectionResponse | ErrorResponse>,
): Promise<void> {
  assertAdminRequest(req);

  if (req.validatedAdminCollectionBody === undefined) {
    throw AppError.badRequest("Invalid collection payload");
  }

  res.status(201).json(await createAdminCollection(req.validatedAdminCollectionBody));
}

export async function updateCollection(
  req: AuthenticatedRequest & AdminCollectionValidatedRequest,
  res: Response<AdminCollectionResponse | ErrorResponse>,
): Promise<void> {
  assertAdminRequest(req);

  if (
    req.validatedCollectionId === undefined ||
    req.validatedAdminCollectionBody === undefined
  ) {
    throw AppError.badRequest("Invalid collection payload");
  }

  res
    .status(200)
    .json(await updateAdminCollection(req.validatedCollectionId, req.validatedAdminCollectionBody));
}

export async function getOrders(
  req: AuthenticatedRequest & AdminOrdersQueryRequest,
  res: Response<AdminOrderListResponse | ErrorResponse>,
): Promise<void> {
  assertAdminRequest(req);

  if (req.validatedAdminOrdersQuery === undefined) {
    throw AppError.badRequest("Invalid admin orders query");
  }

  res.status(200).json(await listAdminOrders(req.validatedAdminOrdersQuery));
}

export async function updateOrder(
  req: AuthenticatedRequest & AdminOrderUpdateValidatedRequest,
  res: Response<AdminOrderResponse | ErrorResponse>,
): Promise<void> {
  assertAdminRequest(req);

  if (req.validatedOrderId === undefined || req.validatedAdminOrderBody === undefined) {
    throw AppError.badRequest("Invalid order payload");
  }

  res.status(200).json(await updateAdminOrder(req.validatedOrderId, req.validatedAdminOrderBody));
}
