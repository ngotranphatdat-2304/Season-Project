import assert from "node:assert/strict";
import type { CookieOptions, Request, Response } from "express";
import test from "node:test";
import {
  clearGuestSessionCookie,
  guestSession,
  guestSessionCookieOptions,
  type GuestSessionRequest,
} from "./guest-session.js";

interface MockResponse extends Partial<Response> {
  cookieCalls: Array<{
    name: string;
    value: unknown;
    options?: CookieOptions;
  }>;
  clearCookieCalls: Array<{
    name: string;
    options: CookieOptions;
  }>;
}

function createMockResponse(): Response & MockResponse {
  const response = {
    cookieCalls: [],
    clearCookieCalls: [],
    cookie(name: string, value: unknown, options?: CookieOptions) {
      this.cookieCalls.push(
        options === undefined ? { name, value } : { name, value, options },
      );
      return this as Response & MockResponse;
    },
    clearCookie(name: string, options?: CookieOptions) {
      this.clearCookieCalls.push({ name, options: options ?? {} });
      return this as Response & MockResponse;
    },
  } satisfies MockResponse;

  return response as unknown as Response & MockResponse;
}

function createGuestRequest(
  overrides: Partial<GuestSessionRequest> = {},
): GuestSessionRequest {
  return {
    cookies: {},
    headers: {},
    ...overrides,
  } as GuestSessionRequest;
}

test("guestSession creates a guestId cookie only for unauthenticated cart requests", async () => {
  const middleware = guestSession({ createIfMissing: true });
  const req = createGuestRequest();
  const res = createMockResponse();

  let nextCalled = false;
  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(typeof req.guestId, "string");
  assert.equal(res.cookieCalls.length, 1);
  const createdCookie = res.cookieCalls[0];
  assert.ok(createdCookie !== undefined);
  assert.equal(createdCookie.name, "guestId");
  assert.equal(createdCookie.options?.httpOnly, true);
});

test("guestSession reuses an existing cookie and skips authenticated requests", async () => {
  const middleware = guestSession({ createIfMissing: true });

  const guestReq = createGuestRequest({
    cookies: { guestId: "guest-123" },
  });
  const guestRes = createMockResponse();

  middleware(guestReq, guestRes, () => undefined);

  assert.equal(guestReq.guestId, "guest-123");
  assert.equal(guestRes.cookieCalls.length, 0);

  const authReq = createGuestRequest({
    authUserId: "user-123",
  } as GuestSessionRequest & { authUserId: string });
  const authRes = createMockResponse();

  middleware(authReq, authRes, () => undefined);

  assert.equal(authReq.guestId, undefined);
  assert.equal(authRes.cookieCalls.length, 0);
});

test("clearGuestSessionCookie clears the guest cookie with the expected options", async () => {
  const res = createMockResponse();

  clearGuestSessionCookie(res);

  assert.deepEqual(res.clearCookieCalls, [
    {
      name: "guestId",
      options: {
        httpOnly: guestSessionCookieOptions.httpOnly,
        secure: guestSessionCookieOptions.secure,
        sameSite: guestSessionCookieOptions.sameSite,
      },
    },
  ]);
});
