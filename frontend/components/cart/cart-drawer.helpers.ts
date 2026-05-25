import type { CartDrawerItem } from "@/lib/cart/cart-api";

export const STOCK_LIMIT_ERROR = "Không thể vượt quá số lượng trong kho";

export function getItemCount(items: CartDrawerItem[]): number {
  return items.reduce((count, item) => count + item.quantity, 0);
}

export function getTotalAmount(items: CartDrawerItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function getOverstockedItems(
  items: CartDrawerItem[],
): CartDrawerItem[] {
  return items.filter((item) => item.quantity > item.stock);
}

export function buildStockErrors(
  items: CartDrawerItem[],
): Record<string, string | undefined> {
  return items.reduce<Record<string, string | undefined>>((errors, item) => {
    if (item.quantity > item.stock) {
      errors[item.variantSku] = STOCK_LIMIT_ERROR;
    }

    return errors;
  }, {});
}
