"use client";

import { useEffect, useCallback, useState } from "react";
import { X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { subscribeToCartUpdates } from "@/lib/cart/cart-sync";
import { CartDrawerEmptyState } from "./cart-drawer-empty-state";
import { CartDrawerFooter } from "./cart-drawer-footer";
import { CartDrawerItemCard } from "./cart-drawer-item-card";
import { useCartDrawerState } from "./use-cart-drawer-state";

type CartDrawerProps = {
  children: React.ReactNode;
};

export function CartDrawer({ children }: CartDrawerProps) {
  const [open, setOpen] = useState(false);
  const {
    cartItems,
    isLoading,
    pendingSkus,
    stockErrors,
    itemCount,
    totalAmount,
    loadCart,
    handleQuantityChange,
    handleRemove,
  } = useCartDrawerState();

  const refreshCart = useCallback(() => {
    void loadCart();
  }, [loadCart]);

  useEffect(() => {
    if (open === true) {
      refreshCart();
    }
  }, [open, refreshCart]);

  useEffect(() => {
    return subscribeToCartUpdates(() => {
      if (open === true) {
        refreshCart();
      }
    });
  }, [open, refreshCart]);

  const isEmpty = isLoading === false && cartItems.length === 0;

  return (
    <Drawer
      direction="right"
      shouldScaleBackground={false}
      open={open}
      onOpenChange={setOpen}
    >
      <DrawerTrigger asChild>{children}</DrawerTrigger>

      <DrawerContent className="inset-y-0 right-0 left-auto mt-0 flex h-full w-[min(100vw,31rem)] max-w-none flex-col rounded-none border-l border-t-0 border-[#dcd7cf] bg-[#f8f6f1] p-0 [&>div:first-child]:hidden">
        <DrawerTitle className="sr-only">Giỏ hàng</DrawerTitle>
        <DrawerDescription className="sr-only">
          Drawer hiển thị trạng thái giỏ hàng
        </DrawerDescription>

        <div className="flex h-full min-h-0 flex-col">
          <header className="shrink-0 border-b border-[#e4dfd8] px-8 pb-6 pt-8">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-afacad text-[20px] font-semibold uppercase tracking-[0.02em] text-black md:text-[32px]">
                GIỎ HÀNG ({itemCount})
              </h2>

              <DrawerClose asChild>
                <button
                  type="button"
                  aria-label="Close cart drawer"
                  className="rounded-full p-1 text-black transition-opacity hover:opacity-60"
                >
                  <X className="size-5 stroke-[1.8]" />
                </button>
              </DrawerClose>
            </div>
          </header>

          {isLoading === true ? (
            <div className="flex flex-1 flex-col items-center justify-center px-8 pb-16 text-center">
              <Spinner className="size-6 text-black/55" />
              <p className="mt-4 font-afacad text-[1rem] uppercase tracking-[0.12em] text-black/45">
                Đang tải giỏ hàng
              </p>
            </div>
          ) : isEmpty ? (
            <CartDrawerEmptyState
              onNavigate={() => {
                setOpen(false);
              }}
            />
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto px-8 pb-6 pt-6">
                <div className="space-y-6">
                  {cartItems.map((item) => (
                    <CartDrawerItemCard
                      key={`${item.productId}-${item.variantSku}`}
                      item={item}
                      errorMessage={stockErrors[item.variantSku]}
                      isPending={pendingSkus[item.variantSku] === true}
                      onDecrease={() => {
                        void handleQuantityChange(item, item.quantity - 1);
                      }}
                      onIncrease={() => {
                        void handleQuantityChange(item, item.quantity + 1);
                      }}
                      onRemove={() => {
                        void handleRemove(item);
                      }}
                    />
                  ))}
                </div>
              </div>

              <CartDrawerFooter totalAmount={totalAmount} />
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
