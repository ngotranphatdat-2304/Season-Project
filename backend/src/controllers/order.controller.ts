import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import type {
  CheckoutValidatedRequest,
  OrderIdValidatedRequest,
  OrderListValidatedRequest,
} from "../middleware/order.validation.js";
import { AppError } from "../errors/app-error.js";
import {
  cancelOrderForUser,
  checkoutCart,
  getOrderForUser,
  getOrdersForUser,
} from "../services/order.service.js";
import type { ErrorResponse } from "../types/product.types.js";
import type {
  CheckoutOrderResponse,
  OrderListResponse,
} from "../types/order.types.js";

type CheckoutRequest = AuthenticatedRequest & CheckoutValidatedRequest;
type UserOrderIdRequest = AuthenticatedRequest & OrderIdValidatedRequest;
type UserOrderListRequest = AuthenticatedRequest & OrderListValidatedRequest;

export async function checkout(
  req: CheckoutRequest,
  res: Response<CheckoutOrderResponse | ErrorResponse>,
): Promise<void> {
  if (req.authUserId === undefined || req.validatedBody === undefined) {
    throw AppError.badRequest("Invalid checkout request");
  }

  res.status(201).json(await checkoutCart(req.authUserId, req.validatedBody));
}

export async function listOrders(
  req: UserOrderListRequest,
  res: Response<OrderListResponse | ErrorResponse>,
): Promise<void> {
  if (req.authUserId === undefined || req.validatedOrderListQuery === undefined) {
    throw AppError.badRequest("Invalid order list request");
  }

  res.status(200).json(await getOrdersForUser(req.authUserId, req.validatedOrderListQuery));
}

export async function getOrder(
  req: UserOrderIdRequest,
  res: Response<CheckoutOrderResponse | ErrorResponse>,
): Promise<void> {
  if (req.authUserId === undefined || req.validatedOrderId === undefined) {
    throw AppError.badRequest("Invalid order request");
  }

  res.status(200).json(await getOrderForUser(req.authUserId, req.validatedOrderId));
}

export async function cancelOrder(
  req: UserOrderIdRequest,
  res: Response<CheckoutOrderResponse | ErrorResponse>,
): Promise<void> {
  if (req.authUserId === undefined || req.validatedOrderId === undefined) {
    throw AppError.badRequest("Invalid order cancellation request");
  }

  res.status(200).json(
    await cancelOrderForUser(req.authUserId, req.validatedOrderId),
  );
}
