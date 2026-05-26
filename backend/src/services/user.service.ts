import { RefreshToken } from "../models/refresh-token.model.js";
import { Order } from "../models/order.model.js";
import { User, type IUser, type IUserAddress } from "../models/user.model.js";
import type {
  ChangePasswordInput,
  UserAddressInput,
  UserAddressListResponse,
  UserAddressResponse,
  UserAddressUpdateInput,
  UserMessageResponse,
  UserProfileResponse,
  UserProfileUpdateInput,
} from "../types/user.types.js";

export class UserServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "UserServiceError";
    this.statusCode = statusCode;
  }
}

function toAddressResponse(address: IUserAddress): UserAddressResponse {
  return {
    _id: address._id?.toString() ?? "",
    ...(address.label === undefined ? {} : { label: address.label }),
    address: address.address,
    isDefault: address.isDefault,
  };
}

function toProfileResponse(user: IUser): UserProfileResponse {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    ...(user.phone === undefined ? {} : { phone: user.phone }),
    ...(user.avatar === undefined ? {} : { avatar: user.avatar }),
    role: user.role,
    status: user.status,
    isActive: user.isActive !== false,
    addresses: user.addresses.map(toAddressResponse),
  };
}

async function requireUser(userId: string): Promise<IUser> {
  const user = await User.findById(userId);

  if (user === null || user.status !== "active" || user.isActive === false) {
    throw new UserServiceError("User not found", 404);
  }

  return user;
}

function findAddress(user: IUser, addressId: string): IUserAddress {
  const address = user.addresses.find(
    (item) => item._id !== undefined && item._id.toString() === addressId,
  );

  if (address === undefined) {
    throw new UserServiceError("Address not found", 404);
  }

  return address;
}

function clearDefaultAddresses(user: IUser): void {
  for (const address of user.addresses) {
    address.isDefault = false;
  }
}

export async function getUserProfile(
  userId: string,
): Promise<UserProfileResponse> {
  return toProfileResponse(await requireUser(userId));
}

export async function updateUserProfile(
  userId: string,
  input: UserProfileUpdateInput,
): Promise<UserProfileResponse> {
  const user = await requireUser(userId);

  if (input.name !== undefined) {
    user.name = input.name;
  }

  if (input.phone !== undefined) {
    user.phone = input.phone;
  }

  if (input.avatar !== undefined) {
    user.avatar = input.avatar;
  }

  await user.save();
  return toProfileResponse(user);
}

export async function changeUserPassword(
  userId: string,
  input: ChangePasswordInput,
): Promise<UserMessageResponse> {
  const user = await User.findById(userId).select("+password");

  if (user === null || user.status !== "active" || user.isActive === false) {
    throw new UserServiceError("User not found", 404);
  }

  if ((await user.matchPassword(input.currentPassword)) === false) {
    throw new UserServiceError("Current password is incorrect", 401);
  }

  user.password = input.newPassword;
  await user.save();
  await RefreshToken.deleteMany({ userId: user._id });

  return {
    message: "Password changed",
  };
}

export async function addUserAddress(
  userId: string,
  input: UserAddressInput,
): Promise<UserProfileResponse> {
  const user = await requireUser(userId);
  const isDefault = input.isDefault === true || user.addresses.length === 0;

  if (isDefault === true) {
    clearDefaultAddresses(user);
  }

  user.addresses.push({
    ...(input.label === undefined ? {} : { label: input.label }),
    address: input.address,
    isDefault,
  });

  await user.save();
  return toProfileResponse(user);
}

export async function listUserAddresses(
  userId: string,
): Promise<UserAddressListResponse> {
  const user = await requireUser(userId);

  return {
    records: user.addresses.map(toAddressResponse),
  };
}

export async function setDefaultUserAddress(
  userId: string,
  addressId: string,
): Promise<UserProfileResponse> {
  const user = await requireUser(userId);
  const address = findAddress(user, addressId);

  clearDefaultAddresses(user);
  address.isDefault = true;
  await user.save();
  return toProfileResponse(user);
}

export async function updateUserAddress(
  userId: string,
  addressId: string,
  input: UserAddressUpdateInput,
): Promise<UserProfileResponse> {
  const user = await requireUser(userId);
  const address = findAddress(user, addressId);

  if (input.label !== undefined) {
    address.label = input.label;
  }

  if (input.address !== undefined) {
    address.address = input.address;
  }

  if (input.isDefault === true) {
    clearDefaultAddresses(user);
    address.isDefault = true;
  } else if (input.isDefault === false) {
    address.isDefault = false;
  }

  await user.save();
  return toProfileResponse(user);
}

export async function deleteUserAddress(
  userId: string,
  addressId: string,
): Promise<UserProfileResponse> {
  const user = await requireUser(userId);
  const addressIndex = user.addresses.findIndex(
    (address) =>
      address._id !== undefined && address._id.toString() === addressId,
  );

  if (addressIndex === -1) {
    throw new UserServiceError("Address not found", 404);
  }

  const [removedAddress] = user.addresses.splice(addressIndex, 1);

  if (
    removedAddress?.isDefault === true &&
    user.addresses.length > 0 &&
    user.addresses.some((address) => address.isDefault === true) === false
  ) {
    const firstAddress = user.addresses[0];

    if (firstAddress !== undefined) {
      firstAddress.isDefault = true;
    }
  }

  await user.save();
  return toProfileResponse(user);
}

export async function deactivateCurrentUser(
  userId: string,
): Promise<UserMessageResponse> {
  const blockingOrder = await Order.exists({
    userId,
    status: { $in: ["pending"] },
  });

  if (blockingOrder !== null) {
    throw new UserServiceError(
      "Pending orders must finish before deleting the account",
      409,
    );
  }

  const user = await requireUser(userId);
  user.isActive = false;
  user.status = "banned";
  await user.save();
  await RefreshToken.deleteMany({ userId: user._id });

  return {
    message: "Tai khoan da duoc xoa (vo hieu hoa)",
  };
}
