"use client";

import Image from "next/image";
import { Trash2 } from "lucide-react";
import type { CartDrawerItem } from "@/lib/cart/cart-api";

type CartDrawerItemCardProps = {
  item: CartDrawerItem;
  errorMessage?: string;
  isPending: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
  onRemove: () => void;
};

export function CartDrawerItemCard({
  item,
  errorMessage,
  isPending,
  onDecrease,
  onIncrease,
  onRemove,
}: CartDrawerItemCardProps) {
  const minusDisabled = isPending || item.quantity <= 1;
  const plusDisabled = isPending || item.quantity >= item.stock;

  return (
    <article className="grid grid-cols-[5rem_minmax(0,1fr)] gap-5 border-b border-[#d8d2cb] pb-6 pt-2">
      <div className="relative aspect-square overflow-visible rounded-md border border-[#ded9d2] bg-white">
        <div className="absolute inset-0 overflow-hidden rounded-md">
          {item.image !== "" ? (
            <Image
              src={item.image}
              alt={item.productName}
              fill
              className="scale-[1.55] object-contain object-center"
              sizes="80px"
            />
          ) : null}
        </div>
        <span className="absolute -right-1.5 -top-1.5 z-10 flex size-6 items-center justify-center rounded-md bg-black font-afacad text-[12px] font-semibold leading-none text-white">
          {item.quantity}
        </span>
      </div>

      <div className="flex min-w-0 flex-col justify-between gap-4">
        <div className="space-y-2">
          <h3 className="font-seesans text-[1.5rem] uppercase leading-[1.05] tracking-[0.03em] text-black">
            {item.productName}
          </h3>
          <p className="font-afacad text-[1rem] text-black/78">
            {item.variantSku}
          </p>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-5 font-afacad text-[1rem] text-black">
              <button
                type="button"
                aria-label={`Decrease quantity for ${item.productName}`}
                disabled={minusDisabled}
                className="transition-opacity hover:opacity-65 disabled:cursor-not-allowed disabled:opacity-25"
                onClick={onDecrease}
              >
                -
              </button>
              <span className="min-w-4 text-center">{item.quantity}</span>
              <button
                type="button"
                aria-label={`Increase quantity for ${item.productName}`}
                disabled={plusDisabled}
                className="transition-opacity hover:opacity-65 disabled:cursor-not-allowed disabled:opacity-25"
                onClick={onIncrease}
              >
                +
              </button>
            </div>

            {errorMessage !== undefined ? (
              <p className="max-w-56 font-afacad text-[0.8rem] leading-4 text-[#9f3b2f]">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="button"
              aria-label={`Remove ${item.productName}`}
              disabled={isPending}
              className="text-black transition-opacity hover:opacity-60 disabled:cursor-not-allowed disabled:opacity-25"
              onClick={onRemove}
            >
              <Trash2 className="size-4 stroke-[1.8]" />
            </button>
          </div>

          <p className="shrink-0 font-afacad text-[1.3rem] font-semibold uppercase tracking-[0.04em] text-black">
            {(item.price * item.quantity).toLocaleString("vi-VN")} VND
          </p>
        </div>
      </div>
    </article>
  );
}
