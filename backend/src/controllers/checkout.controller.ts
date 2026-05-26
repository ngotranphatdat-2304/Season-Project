import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import type { CheckoutCompleteValidatedRequest } from "../middleware/checkout.validation.js";
import type { GuestSessionRequest } from "../middleware/guest-session.js";
import { AppError } from "../errors/app-error.js";
import {
  completeCheckoutSession,
  createCheckoutSession,
  getCheckoutSessionByToken,
} from "../services/checkout-session.service.js";
import type { ErrorResponse } from "../types/product.types.js";
import type {
  CheckoutCompleteResponse,
  CheckoutInitResponse,
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
    ...(req.authUserId === undefined ? {} : { userId: req.authUserId }),
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
    ...(req.authUserId === undefined ? {} : { userId: req.authUserId }),
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
    ...(req.authUserId === undefined ? {} : { userId: req.authUserId }),
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
