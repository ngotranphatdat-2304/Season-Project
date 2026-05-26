import assert from "node:assert/strict";
import test from "node:test";
import { Types } from "mongoose";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import {
  addItemToCart,
  addSkuItemToCart,
  CartServiceError,
} from "./cart.service.js";

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

function cartDocument(
  item: { productId: Types.ObjectId; sku: string; quantity: number } | null,
) {
  return {
    _id: new Types.ObjectId(),
    guestId: "guest-cart",
    userId: new Types.ObjectId(),
    items:
      item === null
        ? []
        : [
            {
              productId: item.productId,
              variantSku: item.sku,
              quantity: item.quantity,
            },
          ],
    saveCallCount: 0,
    async save() {
      this.saveCallCount += 1;
      return this;
    },
  };
}

function patchCartDisplayResponse(run: () => Promise<void>): Promise<void> {
  return withPatchedProperty(
    Product,
    "find",
    ((() => ({
      select: () => ({
        lean: async () => [],
      }),
    })) as unknown) as typeof Product.find,
    run,
  );
}

function patchSkuProduct(
  productId: Types.ObjectId,
  sku: string,
  stock: number,
  run: () => Promise<void>,
): Promise<void> {
  return withPatchedProperty(
    Product,
    "findOne",
    ((() => ({
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
              stock,
            },
          ],
        }),
      }),
    })) as unknown) as typeof Product.findOne,
    run,
  );
}

function patchDefaultVariantProduct(
  productId: Types.ObjectId,
  sku: string,
  stock: number,
  run: () => Promise<void>,
): Promise<void> {
  return withPatchedProperty(
    Product,
    "findById",
    ((() => ({
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
              stock,
            },
          ],
        }),
      }),
    })) as unknown) as typeof Product.findById,
    run,
  );
}

test("addSkuItemToCart increments an existing SKU below stock", async () => {
  const productId = new Types.ObjectId();
  const sku = "duplicate-sku-increment";
  const cart = cartDocument({ productId, sku, quantity: 1 });

  await patchSkuProduct(productId, sku, 3, async () => {
    await withPatchedProperty(Cart, "findOne", (async () => cart) as typeof Cart.findOne, async () => {
      await patchCartDisplayResponse(async () => {
        await addSkuItemToCart({ guestId: "guest-cart" }, { sku, quantity: 1 });

        assert.equal(cart.saveCallCount, 2);
        assert.equal(cart.items[0]?.quantity, 2);
      });
    });
  });
});

test("addSkuItemToCart rejects increments that would exceed stock", async () => {
  const productId = new Types.ObjectId();
  const sku = "duplicate-sku-clamp";
  const cart = cartDocument({ productId, sku, quantity: 2 });

  await patchSkuProduct(productId, sku, 3, async () => {
    await withPatchedProperty(Cart, "findOne", (async () => cart) as typeof Cart.findOne, async () => {
      await assert.rejects(
        addSkuItemToCart({ guestId: "guest-cart" }, { sku, quantity: 2 }),
        (error: unknown) =>
          error instanceof CartServiceError &&
          error.statusCode === 409 &&
          error.message === "Requested quantity exceeds available stock (3)",
      );

      assert.equal(cart.items[0]?.quantity, 2);
    });
  });
});

test("addSkuItemToCart rejects adds when an SKU is already at stock", async () => {
  const productId = new Types.ObjectId();
  const sku = "duplicate-sku-max";
  const cart = cartDocument({ productId, sku, quantity: 3 });

  await patchSkuProduct(productId, sku, 3, async () => {
    await withPatchedProperty(Cart, "findOne", (async () => cart) as typeof Cart.findOne, async () => {
      await assert.rejects(
        addSkuItemToCart({ guestId: "guest-cart" }, { sku, quantity: 1 }),
        (error: unknown) =>
          error instanceof CartServiceError &&
          error.statusCode === 409 &&
          error.message === "Requested quantity exceeds available stock (3)",
      );

      assert.equal(cart.items[0]?.quantity, 3);
    });
  });
});

test("addItemToCart increments an existing default variant below stock", async () => {
  const productId = new Types.ObjectId();
  const userId = new Types.ObjectId().toString();
  const sku = "default-variant-increment";
  const cart = cartDocument({ productId, sku, quantity: 1 });

  await patchDefaultVariantProduct(productId, sku, 2, async () => {
    await withPatchedProperty(Cart, "findOne", (async () => cart) as typeof Cart.findOne, async () => {
      await patchCartDisplayResponse(async () => {
        await addItemToCart(
          { userId },
          { productId: productId.toString(), quantity: 1 },
        );

        assert.equal(cart.items[0]?.quantity, 2);
      });
    });
  });
});

test("addItemToCart rejects adds when a default variant is already at stock", async () => {
  const productId = new Types.ObjectId();
  const userId = new Types.ObjectId().toString();
  const sku = "default-variant-max";
  const cart = cartDocument({ productId, sku, quantity: 2 });

  await patchDefaultVariantProduct(productId, sku, 2, async () => {
    await withPatchedProperty(Cart, "findOne", (async () => cart) as typeof Cart.findOne, async () => {
      await assert.rejects(
        addItemToCart(
          { userId },
          { productId: productId.toString(), quantity: 1 },
        ),
        (error: unknown) =>
          error instanceof CartServiceError &&
          error.statusCode === 409 &&
          error.message === "Requested quantity exceeds available stock (2)",
      );

      assert.equal(cart.items[0]?.quantity, 2);
    });
  });
});

test("addSkuItemToCart still rejects new item quantities above stock", async () => {
  const productId = new Types.ObjectId();
  const sku = "new-item-over-stock";
  const cart = cartDocument(null);

  await patchSkuProduct(productId, sku, 1, async () => {
    await withPatchedProperty(Cart, "findOne", (async () => cart) as typeof Cart.findOne, async () => {
      await assert.rejects(
        addSkuItemToCart({ guestId: "guest-cart" }, { sku, quantity: 2 }),
        (error: unknown) =>
          error instanceof CartServiceError &&
          error.statusCode === 409 &&
          error.message === "Requested quantity exceeds available stock (1)",
      );

      assert.equal(cart.items.length, 0);
    });
  });
});
