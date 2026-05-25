import assert from "node:assert/strict";
import test from "node:test";
import { Types } from "mongoose";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import { addItemToCart, addSkuItemToCart, CartServiceError } from "./cart.service.js";

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

test("addSkuItemToCart rejects duplicate variant adds with a 409 conflict", async () => {
  const productId = new Types.ObjectId();
  const guestId = "guest-duplicate-sku";
  const sku = "duplicate-sku";
  let saveCallCount = 0;

  const cartDocument = {
    guestId,
    items: [{ productId, variantSku: sku, quantity: 1 }],
    async save() {
      saveCallCount += 1;
      return this;
    },
  };

  await withPatchedProperty(Product, "findOne", ((() => ({
    select: () => ({
      lean: async () => ({
        _id: productId,
        availability: "in_stock",
        isActive: true,
        variants: [
          {
            sku,
            price: 100000,
            images: [],
            isDefault: true,
            stock: 3,
          },
        ],
      }),
    }),
  })) as unknown) as typeof Product.findOne, async () => {
    await withPatchedProperty(Cart, "findOne", (async () => cartDocument) as typeof Cart.findOne, async () => {
      await assert.rejects(
        addSkuItemToCart({ guestId }, { sku, quantity: 1 }),
        (error: unknown) =>
          error instanceof CartServiceError &&
          error.statusCode === 409 &&
          error.message === "Product already added to cart",
      );

      assert.equal(saveCallCount, 1);
      assert.equal(cartDocument.items[0]?.quantity, 1);
    });
  });
});

test("addItemToCart rejects duplicate default-variant adds with a 409 conflict", async () => {
  const productId = new Types.ObjectId();
  const userId = new Types.ObjectId().toString();
  const sku = "duplicate-default-variant";
  let saveCallCount = 0;

  const cartDocument = {
    userId,
    items: [{ productId, variantSku: sku, quantity: 1 }],
    async save() {
      saveCallCount += 1;
      return this;
    },
  };

  await withPatchedProperty(Product, "findById", ((() => ({
    select: () => ({
      lean: async () => ({
        _id: productId,
        availability: "in_stock",
        isActive: true,
        variants: [
          {
            sku,
            price: 150000,
            images: [],
            isDefault: true,
            stock: 2,
          },
        ],
      }),
    }),
  })) as unknown) as typeof Product.findById, async () => {
    await withPatchedProperty(Cart, "findOne", (async () => cartDocument) as typeof Cart.findOne, async () => {
      await assert.rejects(
        addItemToCart({ userId }, { productId: productId.toString(), quantity: 1 }),
        (error: unknown) =>
          error instanceof CartServiceError &&
          error.statusCode === 409 &&
          error.message === "Product already added to cart",
      );

      assert.equal(saveCallCount, 0);
      assert.equal(cartDocument.items[0]?.quantity, 1);
    });
  });
});
