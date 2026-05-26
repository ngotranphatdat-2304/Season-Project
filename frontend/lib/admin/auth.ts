"use client";

import { AxiosError, type AxiosRequestConfig } from "axios";
import { api } from "@/lib/api";

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: "admin" | "customer";
  status: "active" | "banned";
  isActive: boolean;
};

export type AdminSession = {
  user: AdminUser;
  accessToken: string;
  refreshToken: string;
};

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = LoginPayload & {
  name: string;
  phone?: string;
  adminSecret: string;
};

const STORAGE_KEY = "season.admin.session";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function readAdminSession(): AdminSession | null {
  if (isBrowser() === false) {
    return null;
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);

  if (rawValue === null) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as AdminSession;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function writeAdminSession(session: AdminSession): void {
  if (isBrowser() === false) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearAdminSession(): void {
  if (isBrowser() === false) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

async function refreshAdminAccessToken(session: AdminSession): Promise<AdminSession | null> {
  try {
    const response = await api.post<{
      accessToken: string;
      refreshToken: string;
    }>("/auth/refresh-token", {
      refreshToken: session.refreshToken,
    });

    const refreshedSession: AdminSession = {
      ...session,
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
    };

    writeAdminSession(refreshedSession);
    return refreshedSession;
  } catch {
    clearAdminSession();
    return null;
  }
}

export async function adminRequest<T>(
  config: AxiosRequestConfig,
): Promise<T> {
  const session = readAdminSession();

  if (session === null) {
    throw new Error("Admin session is missing");
  }

  try {
    const response = await api.request<T>({
      ...config,
      headers: {
        ...(config.headers ?? {}),
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    return response.data;
  } catch (error) {
    if ((error as AxiosError).response?.status !== 401) {
      throw error;
    }

    const refreshedSession = await refreshAdminAccessToken(session);

    if (refreshedSession === null) {
      throw error;
    }

    const retryResponse = await api.request<T>({
      ...config,
      headers: {
        ...(config.headers ?? {}),
        Authorization: `Bearer ${refreshedSession.accessToken}`,
      },
    });

    return retryResponse.data;
  }
}

export async function loginAdmin(payload: LoginPayload): Promise<AdminSession> {
  const response = await api.post<AdminSession>("/auth/admin/login", payload);
  writeAdminSession(response.data);
  return response.data;
}

export async function registerAdmin(payload: RegisterPayload): Promise<{ user: AdminUser }> {
  const response = await api.post<{ user: AdminUser }>("/auth/admin/register", payload);
  clearAdminSession();
  return response.data;
}

export async function fetchCurrentAdmin(): Promise<AdminUser | null> {
  const user = await adminRequest<AdminUser | null>({
    url: "/auth/me",
    method: "GET",
  });

  if (user === null || user.role !== "admin") {
    clearAdminSession();
    return null;
  }

  const session = readAdminSession();

  if (session !== null) {
    writeAdminSession({
      ...session,
      user,
    });
  }

  return user;
}

export async function logoutAdmin(): Promise<void> {
  const session = readAdminSession();

  try {
    if (session !== null) {
      await api.post("/auth/logout", {
        refreshToken: session.refreshToken,
      });
    }
  } finally {
    clearAdminSession();
  }
}
