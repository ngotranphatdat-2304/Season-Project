import assert from "node:assert/strict";
import test from "node:test";
import {
  getCartStockReconciliationActions,
  type CartDrawerItem,
} from "./cart-drawer.helpers";

function cartItem(
  overrides: Partial<CartDrawerItem> & Pick<CartDrawerItem, "variantSku">,
): CartDrawerItem {
  const { variantSku, ...restOverrides } = overrides;

  return {
    productId: "product-id",
    productName: "Season Frame",
    variantSku,
    price: 1000000,
    quantity: 1,
    stock: 5,
    image: "",
    ...restOverrides,
  };
}

test("cart stock reconciliation clamps stale quantity to current stock", () => {
  assert.deepEqual(
    getCartStockReconciliationActions([
      cartItem({
        variantSku: "BLACK-01",
        quantity: 5,
        stock: 4,
      }),
    ]),
    [
      {
        type: "update",
        sku: "BLACK-01",
        quantity: 4,
      },
    ],
  );
});

test("cart stock reconciliation removes items with zero stock", () => {
  assert.deepEqual(
    getCartStockReconciliationActions([
      cartItem({
        variantSku: "GREY-02",
        quantity: 5,
        stock: 0,
      }),
    ]),
    [
      {
        type: "remove",
        sku: "GREY-02",
      },
    ],
  );
});

test("cart stock reconciliation leaves in-stock quantities unchanged", () => {
  assert.deepEqual(
    getCartStockReconciliationActions([
      cartItem({
        variantSku: "ASH-03",
        quantity: 3,
        stock: 5,
      }),
    ]),
    [],
  );
});
