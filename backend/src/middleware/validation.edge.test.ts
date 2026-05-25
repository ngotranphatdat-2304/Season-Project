import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import test from "node:test";
import express from "express";
import { Router } from "express";
import { AppError } from "../errors/app-error.js";
import { globalErrorHandler } from "./error-handler.js";
import {
  validateAddCartSkuBody,
  validateCartSkuParam,
} from "./cart.validation.js";
import { validateRegisterBody } from "./auth.validation.js";
import {
  validateCheckoutBody,
  validateOrderIdParam,
} from "./order.validation.js";

interface ErrorJson {
  success: false;
  error: {
    statusCode: number;
    code: string;
    message: string;
  };
}

async function listenValidationApp(): Promise<{
  baseUrl: string;
  close(): Promise<void>;
}> {
  const app = express();
  const router = Router();

  app.use(express.json());
  router.post("/cart", validateAddCartSkuBody, (_req, res) => {
    res.status(204).end();
  });
  router.put("/cart/:sku", validateCartSkuParam, validateAddCartSkuBody, (_req, res) => {
    res.status(204).end();
  });
  router.post("/auth/register", validateRegisterBody, (_req, res) => {
    res.status(204).end();
  });
  router.post("/orders", validateCheckoutBody, (_req, res) => {
    res.status(204).end();
  });
  router.get("/orders/:orderId", validateOrderIdParam, (_req, res) => {
    res.status(204).end();
  });

  app.use(router);
  app.use((_req, _res, next) => {
    next(AppError.notFound("Test route not found"));
  });
  app.use(globalErrorHandler);

  const server = app.listen(0);
  await once(server, "listening");
  const address = server.address() as AddressInfo;

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    async close(): Promise<void> {
      server.close();
      await once(server, "close");
    },
  };
}

async function readErrorJson(response: Response): Promise<ErrorJson> {
  return (await response.json()) as ErrorJson;
}

test("validation middleware returns normalized 400 for malformed cart and order inputs", async () => {
  const app = await listenValidationApp();

  try {
    const badCartBody = await fetch(`${app.baseUrl}/cart`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sku: "", quantity: "abc" }),
    });
    const badCartParam = await fetch(`${app.baseUrl}/cart/   `, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sku: "SKU-01", quantity: 1 }),
    });
    const badOrderBody = await fetch(`${app.baseUrl}/orders`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ shippingAddress: "bad" }),
    });
    const badOrderParam = await fetch(`${app.baseUrl}/orders/not-an-id`);

    assert.equal(badCartBody.status, 400);
    assert.equal((await readErrorJson(badCartBody)).error.message, "sku is required");
    assert.equal(badCartParam.status, 400);
    assert.equal((await readErrorJson(badCartParam)).error.message, "sku is invalid");
    assert.equal(badOrderBody.status, 400);
    assert.equal((await readErrorJson(badOrderBody)).error.message, "shippingAddress is invalid");
    assert.equal(badOrderParam.status, 400);
    assert.equal((await readErrorJson(badOrderParam)).error.message, "orderId is invalid");
  } finally {
    await app.close();
  }
});

test("auth validation rejects passwords that bcrypt would truncate", async () => {
  const app = await listenValidationApp();
  const longPassword = "a".repeat(73);

  try {
    const badRegisterPassword = await fetch(`${app.baseUrl}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "person@example.com",
        name: "Long Password",
        password: longPassword,
      }),
    });

    assert.equal(badRegisterPassword.status, 400);
    assert.match(
      (await readErrorJson(badRegisterPassword)).error.message,
      /72 UTF-8 bytes/,
    );
  } finally {
    await app.close();
  }
});
