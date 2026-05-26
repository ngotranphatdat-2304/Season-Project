"use client";

import { isAxiosError } from "axios";
import { startTransition, useCallback, useState } from "react";
import { toast } from "@/components/ui/sonner";
import {
  fetchGuestCart,
  removeGuestCartItem,
  type CartDrawerItem,
  updateGuestCartItemQuantity,
} from "@/lib/cart/cart-api";
import {
  buildStockErrors,
  getCartStockReconciliationActions,
  getItemCount,
  getTotalAmount,
  STOCK_LIMIT_ERROR,
} from "./cart-drawer.helpers";

type UseCartDrawerStateResult = {
  cartItems: CartDrawerItem[];
  isLoading: boolean;
  pendingSkus: Record<string, boolean>;
  stockErrors: Record<string, string | undefined>;
  itemCount: number;
  totalAmount: number;
  loadCart: () => Promise<void>;
  handleQuantityChange: (
    item: CartDrawerItem,
    nextQuantity: number,
  ) => Promise<void>;
  handleRemove: (item: CartDrawerItem) => Promise<void>;
};

export function useCartDrawerState(): UseCartDrawerStateResult {
  const [cartItems, setCartItems] = useState<CartDrawerItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingSkus, setPendingSkus] = useState<Record<string, boolean>>({});
  const [stockErrors, setStockErrors] = useState<
    Record<string, string | undefined>
  >({});

  const applyCartSnapshot = useCallback((items: CartDrawerItem[]) => {
    startTransition(() => {
      setCartItems(items);
      setStockErrors(buildStockErrors(items));
    });
  }, []);

  const setSkuPending = useCallback((sku: string, value: boolean) => {
    setPendingSkus((current) => {
      if (value === false) {
        const nextState = { ...current };
        delete nextState[sku];
        return nextState;
      }

      return {
        ...current,
        [sku]: true,
      };
    });
  }, []);

  const clearSkuError = useCallback((sku: string) => {
    setStockErrors((current) => {
      if (current[sku] === undefined) {
        return current;
      }

      const nextState = { ...current };
      delete nextState[sku];
      return nextState;
    });
  }, []);

  const setSkuError = useCallback((sku: string, message: string) => {
    setStockErrors((current) => ({
      ...current,
      [sku]: message,
    }));
  }, []);

  const reconcileOverstockedItems = useCallback(
    async (items: CartDrawerItem[]): Promise<CartDrawerItem[]> => {
      const reconciliationActions = getCartStockReconciliationActions(items);

      if (reconciliationActions.length === 0) {
        return items;
      }

      for (const action of reconciliationActions) {
        setSkuPending(action.sku, true);
      }

      let latestItems = items;

      try {
        for (const action of reconciliationActions) {
          if (action.type === "update") {
            const updatedCart = await updateGuestCartItemQuantity(
              action.sku,
              action.quantity,
            );
            latestItems = updatedCart.items ?? [];
          } else {
            const updatedCart = await removeGuestCartItem(action.sku);
            latestItems = updatedCart.items ?? [];
          }
        }
      } catch {
        const fallbackCart = await fetchGuestCart();
        latestItems = fallbackCart.items ?? [];
      } finally {
        for (const action of reconciliationActions) {
          setSkuPending(action.sku, false);
        }
      }

      return latestItems;
    },
    [setSkuPending],
  );

  const loadCart = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetchGuestCart();
      const nextItems = response.items ?? [];

      applyCartSnapshot(nextItems);

      const reconciledItems = await reconcileOverstockedItems(nextItems);
      if (reconciledItems !== nextItems) {
        applyCartSnapshot(reconciledItems);
      }
    } catch {
      applyCartSnapshot([]);
    } finally {
      setIsLoading(false);
    }
  }, [applyCartSnapshot, reconcileOverstockedItems]);

  const refreshCartAfterConflict = useCallback(
    async (sku: string) => {
      const latestCart = await fetchGuestCart();
      applyCartSnapshot(latestCart.items ?? []);
      setSkuError(sku, STOCK_LIMIT_ERROR);
    },
    [applyCartSnapshot, setSkuError],
  );

  const handleQuantityChange = useCallback(
    async (item: CartDrawerItem, nextQuantity: number) => {
      if (nextQuantity < 1) {
        return;
      }

      clearSkuError(item.variantSku);
      setSkuPending(item.variantSku, true);

      try {
        const response = await updateGuestCartItemQuantity(
          item.variantSku,
          nextQuantity,
        );
        applyCartSnapshot(response.items ?? []);
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 409) {
          await refreshCartAfterConflict(item.variantSku);
        } else {
          toast.error("Unable to update cart", {
            description: "Please try again.",
          });
        }
      } finally {
        setSkuPending(item.variantSku, false);
      }
    },
    [applyCartSnapshot, clearSkuError, refreshCartAfterConflict, setSkuPending],
  );

  const handleRemove = useCallback(
    async (item: CartDrawerItem) => {
      clearSkuError(item.variantSku);
      setSkuPending(item.variantSku, true);

      try {
        const response = await removeGuestCartItem(item.variantSku);
        applyCartSnapshot(response.items ?? []);
      } catch {
        toast.error("Unable to remove item", {
          description: "Please try again.",
        });
      } finally {
        setSkuPending(item.variantSku, false);
      }
    },
    [applyCartSnapshot, clearSkuError, setSkuPending],
  );

  return {
    cartItems,
    isLoading,
    pendingSkus,
    stockErrors,
    itemCount: getItemCount(cartItems),
    totalAmount: getTotalAmount(cartItems),
    loadCart,
    handleQuantityChange,
    handleRemove,
  };
}
