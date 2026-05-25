export interface UserAddressInput {
  label?: string;
  address: string;
  isDefault?: boolean;
}

export interface UserAddressUpdateInput {
  label?: string;
  address?: string;
  isDefault?: boolean;
}

export interface UserAddressResponse {
  _id: string;
  label?: string;
  address: string;
  isDefault: boolean;
}

export interface UserProfileUpdateInput {
  name?: string;
  phone?: string;
  avatar?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: "admin" | "customer";
  status: "active" | "banned";
  isActive: boolean;
  addresses: UserAddressResponse[];
}

export interface UserMessageResponse {
  message: string;
}

export interface UserAddressListResponse {
  records: UserAddressResponse[];
}
