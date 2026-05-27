import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import type { CheckoutCompleteValidatedRequest } from "../middleware/checkout.validation.js";
import type { GuestSessionRequest } from "../middleware/guest-session.js";
import { AppError } from "../errors/app-error.js";
import {
  completeCheckoutSession,
  createCheckoutSession,
  createPayOSCheckoutSessionPayment,
  getCheckoutSessionByToken,
  getCheckoutPaymentStatus,
  handlePayOSWebhook,
} from "../services/checkout-session.service.js";
import type { ErrorResponse } from "../types/product.types.js";
import type {
  CheckoutCompleteResponse,
  CheckoutInitResponse,
  CheckoutPaymentStatusResponse,
  CheckoutPayOSInitResponse,
  CheckoutSessionResponse,
} from "../types/checkout.types.js";

type CheckoutInitRequest = AuthenticatedRequest & GuestSessionRequest;
type CheckoutRequest = AuthenticatedRequest & GuestSessionRequest;
type CheckoutCompleteRequest = CheckoutRequest & CheckoutCompleteValidatedRequest;

export async function initCheckout(
  req: CheckoutInitRequest,
  res: Response<CheckoutInitResponse | ErrorResponse>,
): Promise<void> {
  const checkoutOwner = {
    ...(req.guestId === undefined ? {} : { guestId: req.guestId }),
  };

  res.status(201).json(
    await createCheckoutSession(checkoutOwner),
  );
}

export async function getCheckoutSession(
  req: CheckoutRequest,
  res: Response<CheckoutSessionResponse | ErrorResponse>,
): Promise<void> {
  const token = req.params.token;
  const checkoutOwner = {
    ...(req.guestId === undefined ? {} : { guestId: req.guestId }),
  };

  res
    .status(200)
    .json(
      await getCheckoutSessionByToken(
        typeof token === "string" ? token : "",
        checkoutOwner,
      ),
    );
}

export async function completeCheckout(
  req: CheckoutCompleteRequest,
  res: Response<CheckoutCompleteResponse | ErrorResponse>,
): Promise<void> {
  const token = req.params.token;

  if (req.validatedBody === undefined) {
    throw AppError.badRequest("Invalid checkout complete request");
  }

  const checkoutOwner = {
    ...(req.guestId === undefined ? {} : { guestId: req.guestId }),
  };

  res.status(200).json(
    await completeCheckoutSession(
      typeof token === "string" ? token : "",
      checkoutOwner,
      req.validatedBody,
    ),
  );
}

export async function createPayOSCheckoutPayment(
  req: CheckoutCompleteRequest,
  res: Response<CheckoutPayOSInitResponse | ErrorResponse>,
): Promise<void> {
  const token = req.params.token;

  if (req.validatedBody === undefined) {
    throw AppError.badRequest("Invalid checkout payOS request");
  }

  const checkoutOwner = {
    ...(req.guestId === undefined ? {} : { guestId: req.guestId }),
  };

  res.status(200).json(
    await createPayOSCheckoutSessionPayment(
      typeof token === "string" ? token : "",
      checkoutOwner,
      req.validatedBody,
    ),
  );
}

export async function getPayOSCheckoutPaymentStatus(
  req: CheckoutRequest,
  res: Response<CheckoutPaymentStatusResponse | ErrorResponse>,
): Promise<void> {
  const token =
    typeof req.query.token === "string" ? req.query.token : "";
  const orderId =
    typeof req.query.orderId === "string" ? req.query.orderId : "";

  const checkoutOwner = {
    ...(req.guestId === undefined ? {} : { guestId: req.guestId }),
  };

  res.status(200).json(
    await getCheckoutPaymentStatus(token, orderId, checkoutOwner),
  );
}

export async function receivePayOSWebhook(
  req: AuthenticatedRequest,
  res: Response<{ success: true } | ErrorResponse>,
): Promise<void> {
  res.status(200).json(await handlePayOSWebhook(req.body));
}
