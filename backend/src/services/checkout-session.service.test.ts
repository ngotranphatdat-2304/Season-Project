import assert from "node:assert/strict";
import test from "node:test";
import { Types } from "mongoose";
import { Cart } from "../models/cart.model.js";
import { CheckoutSession } from "../models/checkout-session.model.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import {
  CheckoutSessionServiceError,
  createCheckoutSession,
  getCheckoutSessionByToken,
} from "./checkout-session.service.js";

function withPatchedProperty<T extends object, K extends keyof T>(
  target: T,
  property: K,
  value: T[K],
  run: () => Promise<void>,
): Promise<void> {
  const descriptor = Object.getOwnPropertyDescriptor(target, property);

  Object.defineProperty(target, property, {
    configurable: true,
    value,
  });

  return run().finally(() => {
    if (descriptor === undefined) {
      delete target[property];
      return;
    }

    Object.defineProperty(target, property, descriptor);
  });
}

test("createCheckoutSession snapshots variant display data", async () => {
  const productId = new Types.ObjectId();
  const guestId = "guest-checkout-session";
  const sku = "THE-ATHLETES-09-GREY";
  let createdPayload: Record<string, unknown> | null = null;

  await withPatchedProperty(
    Cart,
    "findOne",
    (async () => ({
      guestId,
      items: [{ productId, variantSku: sku, quantity: 2 }],
    })) as typeof Cart.findOne,
    async () => {
      await withPatchedProperty(
        Product,
        "find",
        ((() => ({
          select: () => ({
            lean: async () => [
              {
                _id: productId,
                name: "THE ATHLETES 09",
                availability: "in_stock",
                isActive: true,
                variants: [
                  {
                    sku,
                    color: "Milky Grey",
                    price: 2700000,
                    images: ["https://example.com/athletes.jpg"],
                    isDefault: true,
                    stock: 3,
                  },
                ],
              },
            ],
          }),
        })) as unknown) as typeof Product.find,
        async () => {
          await withPatchedProperty(
            CheckoutSession,
            "create",
            (async (payload: Record<string, unknown>) => {
              createdPayload = payload;
              return { token: payload.token };
            }) as typeof CheckoutSession.create,
            async () => {
              const response = await createCheckoutSession({ guestId });

              assert.match(response.token, /^[a-f0-9]{24}$/);
              assert.equal(createdPayload?.shippingFee, 0);
              assert.equal(createdPayload?.subtotalAmount, 5400000);
              assert.equal(createdPayload?.totalAmount, 5400000);

              const snapshot = createdPayload?.itemsSnapshot as
                | Array<Record<string, unknown>>
                | undefined;
              assert.equal(snapshot?.[0]?.imageUrl, "https://example.com/athletes.jpg");
              assert.equal(snapshot?.[0]?.variantColor, "Milky Grey");
              assert.equal(snapshot?.[0]?.lineTotal, 5400000);
            },
          );
        },
      );
    },
  );
});

test("createCheckoutSession rejects empty carts with 400", async () => {
  await withPatchedProperty(
    Cart,
    "findOne",
    (async () => ({ items: [] })) as typeof Cart.findOne,
    async () => {
      await assert.rejects(
        createCheckoutSession({ guestId: "empty-guest" }),
        (error: unknown) =>
          error instanceof CheckoutSessionServiceError &&
          error.statusCode === 400 &&
          error.message === "Giỏ hàng của bạn đang trống",
      );
    },
  );
});

test("createCheckoutSession rejects stale cart quantity over current stock with 409", async () => {
  const productId = new Types.ObjectId();
  const sku = "LOW-STOCK";
  let checkoutCreateCallCount = 0;

  await withPatchedProperty(
    Cart,
    "findOne",
    (async () => ({
      items: [{ productId, variantSku: sku, quantity: 5 }],
    })) as typeof Cart.findOne,
    async () => {
      await withPatchedProperty(
        Product,
        "find",
        ((() => ({
          select: () => ({
            lean: async () => [
              {
                _id: productId,
                name: "Low Stock Frame",
                availability: "in_stock",
                isActive: true,
                variants: [
                  {
                    sku,
                    price: 1000000,
                    images: [],
                    isDefault: true,
                    stock: 4,
                  },
                ],
              },
            ],
          }),
        })) as unknown) as typeof Product.find,
        async () => {
          await withPatchedProperty(
            CheckoutSession,
            "create",
            ((async () => {
              checkoutCreateCallCount += 1;
              return { token: "should-not-create" };
            }) as unknown) as typeof CheckoutSession.create,
            async () => {
              await assert.rejects(
                createCheckoutSession({ guestId: "stock-guest" }),
                (error: unknown) =>
                  error instanceof CheckoutSessionServiceError &&
                  error.statusCode === 409,
              );

              assert.equal(checkoutCreateCallCount, 0);
            },
          );
        },
      );
    },
  );
});

test("createCheckoutSession resolves authenticated carts by userId", async () => {
  const userId = new Types.ObjectId();
  const productId = new Types.ObjectId();
  const sku = "USER-CART-SKU";
  let receivedCartQuery: Record<string, unknown> | null = null;

  await withPatchedProperty(
    Cart,
    "findOne",
    ((async (query: Record<string, unknown>) => {
      receivedCartQuery = query;
      return {
        userId,
        items: [{ productId, variantSku: sku, quantity: 1 }],
      };
    }) as unknown) as typeof Cart.findOne,
    async () => {
      await withPatchedProperty(
        Product,
        "find",
        ((() => ({
          select: () => ({
            lean: async () => [
              {
                _id: productId,
                name: "Authenticated Checkout Product",
                availability: "in_stock",
                isActive: true,
                variants: [
                  {
                    sku,
                    price: 1800000,
                    images: [],
                    isDefault: true,
                    stock: 2,
                  },
                ],
              },
            ],
          }),
        })) as unknown) as typeof Product.find,
        async () => {
          await withPatchedProperty(
            CheckoutSession,
            "create",
            ((async (payload: Record<string, unknown>) => ({
              token: String(payload.token),
            })) as unknown) as typeof CheckoutSession.create,
            async () => {
              await createCheckoutSession({ userId: userId.toString() });

              assert.deepEqual(receivedCartQuery, { userId });
            },
          );
        },
      );
    },
  );
});

test("getCheckoutSessionByToken returns 404 for missing sessions", async () => {
  await withPatchedProperty(
    CheckoutSession,
    "findOne",
    (async () => null) as typeof CheckoutSession.findOne,
    async () => {
      await assert.rejects(
        getCheckoutSessionByToken("missing"),
        (error: unknown) =>
          error instanceof CheckoutSessionServiceError &&
          error.statusCode === 404,
      );
    },
  );
});

test("getCheckoutSessionByToken returns order details for completed sessions", async () => {
  const productId = new Types.ObjectId();

  await withPatchedProperty(
    CheckoutSession,
    "findOne",
    (async () => ({
      token: "completed-token",
      guestId: "guest-completed",
      status: "completed",
      itemsSnapshot: [
        {
          productId: productId.toString(),
          productName: "Completed Product",
          variantSku: "DONE-01",
          imageUrl: "",
          unitPrice: 100000,
          quantity: 1,
          lineTotal: 100000,
        },
      ],
    })) as typeof CheckoutSession.findOne,
    async () => {
      await withPatchedProperty(
        Order,
        "findOne",
        (async () => ({
          _id: new Types.ObjectId("64f000000000000000000001"),
          customerEmail: "person@example.com",
          shippingAddress: {
            recipientName: "Test Person",
            phone: "0900000000",
            line1: "1 Test Street",
            city: "Ho Chi Minh",
            country: "Vietnam",
          },
          subtotalAmount: 100000,
          shippingFee: 0,
          totalAmount: 100000,
          currency: "VND",
        })) as typeof Order.findOne,
        async () => {
          assert.deepEqual(
            await getCheckoutSessionByToken("completed-token", {
              guestId: "guest-completed",
            }),
            {
              status: "completed",
              redirectTo: "/order/success/completed-token",
              order: {
                orderId: "64f000000000000000000001",
                customerEmail: "person@example.com",
                shippingAddress: {
                  recipientName: "Test Person",
                  phone: "0900000000",
                  line1: "1 Test Street",
                  city: "Ho Chi Minh",
                  country: "Vietnam",
                },
                items: [
                  {
                    productId: productId.toString(),
                    productName: "Completed Product",
                    variantSku: "DONE-01",
                    imageUrl: "",
                    unitPrice: 100000,
                    quantity: 1,
                    lineTotal: 100000,
                  },
                ],
                subtotalAmount: 100000,
                shippingFee: 0,
                totalAmount: 100000,
                currency: "VND",
              },
            },
          );
        },
      );
    },
  );
});
