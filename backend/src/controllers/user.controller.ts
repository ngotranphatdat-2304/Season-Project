import type { Response } from "express";
import { AppError } from "../errors/app-error.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import type {
  ChangePasswordValidatedRequest,
  UserAddressValidatedRequest,
  UserProfileUpdateValidatedRequest,
} from "../middleware/user.validation.js";
import {
  addUserAddress,
  changeUserPassword,
  deactivateCurrentUser,
  deleteUserAddress,
  getUserProfile,
  listUserAddresses,
  setDefaultUserAddress,
  updateUserAddress,
  updateUserProfile,
} from "../services/user.service.js";
import type { ErrorResponse } from "../types/product.types.js";
import type {
  UserAddressListResponse,
  UserMessageResponse,
  UserProfileResponse,
} from "../types/user.types.js";

type ProfileUpdateRequest =
  AuthenticatedRequest & UserProfileUpdateValidatedRequest;
type ChangePasswordRequest =
  AuthenticatedRequest & ChangePasswordValidatedRequest;
type AddressRequest = AuthenticatedRequest & UserAddressValidatedRequest;

function requireAuthUserId(req: AuthenticatedRequest): string {
  if (req.authUserId === undefined) {
    throw AppError.badRequest("Invalid user request");
  }

  return req.authUserId;
}

export async function getProfile(
  req: AuthenticatedRequest,
  res: Response<UserProfileResponse | ErrorResponse>,
): Promise<void> {
  res.status(200).json(await getUserProfile(requireAuthUserId(req)));
}

export async function updateProfile(
  req: ProfileUpdateRequest,
  res: Response<UserProfileResponse | ErrorResponse>,
): Promise<void> {
  const input = req.validatedProfileUpdateBody;

  if (input === undefined) {
    throw AppError.badRequest("Invalid profile request");
  }

  res.status(200).json(await updateUserProfile(requireAuthUserId(req), input));
}

export async function changePassword(
  req: ChangePasswordRequest,
  res: Response<UserMessageResponse | ErrorResponse>,
): Promise<void> {
  const input = req.validatedChangePasswordBody;

  if (input === undefined) {
    throw AppError.badRequest("Invalid password request");
  }

  res.status(200).json(await changeUserPassword(requireAuthUserId(req), input));
}

export async function createAddress(
  req: AddressRequest,
  res: Response<UserProfileResponse | ErrorResponse>,
): Promise<void> {
  const input = req.validatedAddressBody;

  if (input === undefined) {
    throw AppError.badRequest("Invalid address request");
  }

  res.status(201).json(await addUserAddress(requireAuthUserId(req), input));
}

export async function getAddresses(
  req: AuthenticatedRequest,
  res: Response<UserAddressListResponse | ErrorResponse>,
): Promise<void> {
  res.status(200).json(await listUserAddresses(requireAuthUserId(req)));
}

export async function setDefaultAddress(
  req: AddressRequest,
  res: Response<UserProfileResponse | ErrorResponse>,
): Promise<void> {
  const addressId = req.validatedAddressId;

  if (addressId === undefined) {
    throw AppError.badRequest("Invalid address request");
  }

  res
    .status(200)
    .json(await setDefaultUserAddress(requireAuthUserId(req), addressId));
}

export async function updateAddress(
  req: AddressRequest,
  res: Response<UserProfileResponse | ErrorResponse>,
): Promise<void> {
  const addressId = req.validatedAddressId;
  const input = req.validatedAddressUpdateBody;

  if (addressId === undefined || input === undefined) {
    throw AppError.badRequest("Invalid address request");
  }

  res
    .status(200)
    .json(await updateUserAddress(requireAuthUserId(req), addressId, input));
}

export async function deleteAddress(
  req: AddressRequest,
  res: Response<UserProfileResponse | ErrorResponse>,
): Promise<void> {
  const addressId = req.validatedAddressId;

  if (addressId === undefined) {
    throw AppError.badRequest("Invalid address request");
  }

  res
    .status(200)
    .json(await deleteUserAddress(requireAuthUserId(req), addressId));
}

export async function deleteMe(
  req: AuthenticatedRequest,
  res: Response<UserMessageResponse | ErrorResponse>,
): Promise<void> {
  res.status(200).json(await deactivateCurrentUser(requireAuthUserId(req)));
}
