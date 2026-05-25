import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import type { GuestSessionRequest } from "../middleware/guest-session.js";
import type {
  AddCartItemValidatedRequest,
  CartProductParamValidatedRequest,
  CartSkuValidatedRequest,
  UpdateCartItemValidatedRequest,
} from "../middleware/cart.validation.js";
import { AppError } from "../errors/app-error.js";
import {
  addItemToCart,
  addSkuItemToCart,
  clearCartForOwner,
  getCartForOwner,
  removeItemFromCart,
  removeSkuItemFromCart,
  updateCartItemQuantity,
  updateSkuCartItemQuantity,
} from "../services/cart.service.js";
import type { CartResponseData } from "../types/cart.types.js";
import type { ErrorResponse } from "../types/product.types.js";

type CartOwnerRequest = AuthenticatedRequest & GuestSessionRequest;
type AddCartItemRequest = CartOwnerRequest & AddCartItemValidatedRequest;
type UpdateCartItemRequest = CartOwnerRequest & UpdateCartItemValidatedRequest;
type RemoveCartItemRequest = CartOwnerRequest & CartProductParamValidatedRequest;
type CartSkuRequest = CartOwnerRequest & CartSkuValidatedRequest;

function getCartOwner(req: CartOwnerRequest): { userId?: string; guestId?: string } {
  if (req.authUserId !== undefined) {
    return { userId: req.authUserId };
  }

  if (req.guestId !== undefined) {
    return { guestId: req.guestId };
  }

  throw AppError.badRequest("Invalid cart request");
}

function getOptionalCartOwner(req: CartOwnerRequest): { userId?: string; guestId?: string } {
  if (req.authUserId !== undefined) {
    return { userId: req.authUserId };
  }

  if (req.guestId !== undefined) {
    return { guestId: req.guestId };
  }

  return {};
}

export async function addCartItem(
  req: AddCartItemRequest,
  res: Response<CartResponseData | ErrorResponse>,
): Promise<void> {
  if (req.validatedBody === undefined) {
    throw AppError.badRequest("Invalid add-to-cart request");
  }

  res.status(200).json(await addItemToCart(getCartOwner(req), req.validatedBody));
}

export async function updateCartItem(
  req: UpdateCartItemRequest,
  res: Response<CartResponseData | ErrorResponse>,
): Promise<void> {
  if (req.validatedBody === undefined) {
    throw AppError.badRequest("Invalid update-cart-item request");
  }

  res.status(200).json(
    await updateCartItemQuantity(getCartOwner(req), req.validatedBody),
  );
}

export async function removeCartItem(
  req: RemoveCartItemRequest,
  res: Response<CartResponseData | ErrorResponse>,
): Promise<void> {
  if (req.validatedProductId === undefined) {
    throw AppError.badRequest("Invalid remove-cart-item request");
  }

  res.status(200).json(
    await removeItemFromCart(getCartOwner(req), req.validatedProductId),
  );
}

export async function getCart(
  req: CartOwnerRequest,
  res: Response<CartResponseData | ErrorResponse>,
): Promise<void> {
  res.status(200).json(await getCartForOwner(getOptionalCartOwner(req)));
}

export async function addCartSkuItem(
  req: CartSkuRequest,
  res: Response<CartResponseData | ErrorResponse>,
): Promise<void> {
  if (req.validatedSkuBody === undefined) {
    throw AppError.badRequest("Invalid add-to-cart request");
  }

  res.status(200).json(
    await addSkuItemToCart(getCartOwner(req), req.validatedSkuBody),
  );
}

export async function updateCartSkuItem(
  req: CartSkuRequest,
  res: Response<CartResponseData | ErrorResponse>,
): Promise<void> {
  if (req.validatedSkuBody === undefined) {
    throw AppError.badRequest("Invalid update-cart-item request");
  }

  res.status(200).json(
    await updateSkuCartItemQuantity(getCartOwner(req), req.validatedSkuBody),
  );
}

export async function removeCartSkuItem(
  req: CartSkuRequest,
  res: Response<CartResponseData | ErrorResponse>,
): Promise<void> {
  if (req.validatedSku === undefined) {
    throw AppError.badRequest("Invalid remove-cart-item request");
  }

  res.status(200).json(
    await removeSkuItemFromCart(getCartOwner(req), req.validatedSku),
  );
}

export async function clearCart(
  req: CartOwnerRequest,
  res: Response<CartResponseData | ErrorResponse>,
): Promise<void> {
  res.status(200).json(await clearCartForOwner(getCartOwner(req)));
}

export async function bootstrapGuestCartSession(
  _req: CartOwnerRequest,
  res: Response<void>,
): Promise<void> {
  res.status(204).end();
}
