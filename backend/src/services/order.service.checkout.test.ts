import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import mongoose, { Types } from "mongoose";
import { Cart } from "../models/cart.model.js";
import { FrameMaterial, FrameSize, Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import {
  checkoutCart,
  isRetryableCheckoutConflict,
  OrderServiceError,
} from "./order.service.js";
import type { CheckoutInput } from "../types/order.types.js";

const checkoutInput: CheckoutInput = {
  shippingAddress: {
    recipientName: "Concurrency Test",
    phone: "0900000000",
    line1: "1 Test Street",
    city: "Ho Chi Minh",
    country: "Vietnam",
  },
  paymentMethod: "cash_on_delivery",
};

test("checkout conflict detector accepts Mongo transaction retry signals", () => {
  assert.equal(isRetryableCheckoutConflict({ code: 112 }), true);
  assert.equal(isRetryableCheckoutConflict({ codeName: "WriteConflict" }), true);
  assert.equal(
    isRetryableCheckoutConflict({ errorLabels: ["TransientTransactionError"] }),
    true,
  );
  assert.equal(
    isRetryableCheckoutConflict({
      cause: { errorLabels: ["UnknownTransactionCommitResult"] },
    }),
    true,
  );
  assert.equal(
    isRetryableCheckoutConflict(new OrderServiceError("Out of stock", 409)),
    false,
  );
});

test("checkout maps transaction write conflict to a retry-friendly 409", async () => {
  const startSessionDescriptor = Object.getOwnPropertyDescriptor(mongoose, "startSession");
  let sessionEnded = false;

  Object.defineProperty(mongoose, "startSession", {
    configurable: true,
    value: async () => ({
      async withTransaction(): Promise<void> {
        throw { code: 112, codeName: "WriteConflict" };
      },
      async endSession(): Promise<void> {
        sessionEnded = true;
      },
    }),
  });

  try {
    await assert.rejects(
      checkoutCart(new Types.ObjectId().toString(), checkoutInput),
      (error: unknown) =>
        error instanceof OrderServiceError &&
        error.statusCode === 409 &&
        error.message.includes("Please retry"),
    );
    assert.equal(sessionEnded, true);
  } finally {
    if (startSessionDescriptor === undefined) {
      throw new Error("mongoose.startSession descriptor is missing");
    }

    Object.defineProperty(mongoose, "startSession", startSessionDescriptor);
  }
});

test(
  "stock of one allows only one parallel checkout",
  {
    skip:
      process.env.TEST_MONGO_URI === undefined ||
      process.env.TEST_MONGO_URI.trim() === ""
        ? "Set TEST_MONGO_URI to a disposable MongoDB replica set database URI"
        : false,
  },
  async () => {
    const testMongoUri = process.env.TEST_MONGO_URI;

    if (testMongoUri === undefined || testMongoUri.trim() === "") {
      throw new Error("TEST_MONGO_URI is required");
    }

    const databaseName = `season_checkout_concurrency_${randomUUID().replaceAll("-", "")}`;
    const firstUserId = new Types.ObjectId();
    const secondUserId = new Types.ObjectId();
    const sku = `checkout-stock-one-${randomUUID()}`;

    await mongoose.connect(testMongoUri, { dbName: databaseName });

    try {
      const product = await Product.create({
        name: "Concurrency Eyeglasses",
        slug: `concurrency-eyeglasses-${randomUUID()}`,
        collectionId: new Types.ObjectId(),
        brand: "Season Test",
        description: "Product used to verify concurrent checkout stock.",
        availability: "in_stock",
        type: "Eyeglasses",
        variants: [
          {
            sku,
            price: 100000,
            images: [],
            isDefault: true,
            stock: 1,
          },
        ],
        specifications: {
          frameType: {
            material: FrameMaterial.Metal,
            size: {
              label: FrameSize.Small,
              image: "https://example.com/size/small.jpg",
            },
          },
          gender: "Unisex",
        },
      });

      await Cart.create([
        {
          userId: firstUserId,
          items: [{ productId: product._id, variantSku: sku, quantity: 1 }],
        },
        {
          userId: secondUserId,
          items: [{ productId: product._id, variantSku: sku, quantity: 1 }],
        },
      ]);

      const checkoutResults = await Promise.allSettled([
        checkoutCart(firstUserId.toString(), checkoutInput),
        checkoutCart(secondUserId.toString(), checkoutInput),
      ]);
      const successfulCheckouts = checkoutResults.filter(
        (result) => result.status === "fulfilled",
      );
      const failedCheckouts = checkoutResults.filter(
        (result) => result.status === "rejected",
      );

      assert.equal(successfulCheckouts.length, 1);
      assert.equal(failedCheckouts.length, 1);

      const failure = failedCheckouts[0];

      if (failure === undefined || failure.status !== "rejected") {
        throw new Error("Expected one rejected checkout");
      }

      assert.ok(failure.reason instanceof OrderServiceError);
      assert.equal(failure.reason.statusCode, 409);

      const storedProduct = await Product.findById(product._id).lean();
      const storedVariant = storedProduct?.variants.find((variant) => variant.sku === sku);
      const orderCount = await Order.countDocuments({
        "items.productId": product._id,
        "items.variantSku": sku,
      });
      const carts = await Cart.find({
        userId: { $in: [firstUserId, secondUserId] },
      }).lean();
      const remainingCartItemCount = carts.reduce(
        (itemCount, cart) => itemCount + cart.items.length,
        0,
      );

      assert.equal(storedVariant?.stock, 0);
      assert.equal(orderCount, 1);
      assert.equal(remainingCartItemCount, 1);
    } finally {
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    }
  },
);
