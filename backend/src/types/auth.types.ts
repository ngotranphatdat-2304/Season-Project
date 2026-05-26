import type { UserRole, UserStatus } from "../models/user.model.js";

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface AdminRegisterInput extends RegisterInput {
  adminSecret: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface AuthUserResponse {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  isActive: boolean;
}

export interface RegisterResponseData {
  user: AuthUserResponse;
}

export interface LoginResponseData {
  user: AuthUserResponse;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponseData {
  accessToken: string;
  refreshToken: string;
}

export interface LogoutResponseData {
  message: string;
}
