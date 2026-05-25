"use client";

import Image from "next/image";
import Link from "next/link";
import { Bookmark, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useState } from "react";

export type CartDrawerItem = {
  id: string;
  name: string;
  variantLabel: string;
  quantity: number;
  price: number;
  image: string;
};

type CartDrawerProps = {
  children: React.ReactNode;
};

const MOCK_CART_ITEMS: CartDrawerItem[] = [
  {
    id: "the-athletes-01-sunglasses",
    name: "THE ATHLETES 01 SUNGLASSES",
    variantLabel: "Silver - Black",
    quantity: 1,
    price: 3350000,
    image:
      "https://res.cloudinary.com/ddjjdi6qo/image/upload/v1775332363/kinh-can/the-soap-08-sunglasses-grey-rhino/image_01.jpg",
  },
];

function CartItemCard({ item }: { item: CartDrawerItem }) {
  return (
    <article className="grid grid-cols-[7rem_minmax(0,1fr)] gap-4 border-b border-[#e4dfd8] pb-6 pt-2">
      <div className="relative aspect-[1.45/1] overflow-hidden bg-[#f6f4ef]">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-contain"
          sizes="112px"
        />
      </div>

      <div className="flex min-w-0 flex-col justify-between gap-4">
        <div className="space-y-2">
          <h3 className="font-seesans text-[1.05rem] uppercase leading-[1.1] tracking-[0.04em] text-black">
            {item.name}
          </h3>
          <p className="font-afacad text-[0.95rem] text-black/72">
            {item.variantLabel}
          </p>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Remove item"
              className="text-black transition-opacity hover:opacity-60"
            >
              <Trash2 className="size-4 stroke-[1.8]" />
            </button>
            <button
              type="button"
              aria-label="Save to wishlist"
              className="text-black transition-opacity hover:opacity-60"
            >
              <Bookmark className="size-4 stroke-[1.8]" />
            </button>
          </div>

          <div className="flex items-end gap-6">
            <div className="flex items-center gap-3 font-afacad text-[0.95rem] text-black">
              <button type="button" aria-label="Decrease quantity">
                -
              </button>
              <span>{item.quantity}</span>
              <button type="button" aria-label="Increase quantity">
                +
              </button>
            </div>

            <p className="font-afacad text-[1.15rem] font-semibold uppercase tracking-[0.04em] text-black">
              {item.price.toLocaleString("vi-VN")} VND
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

export function CartDrawer({ children }: CartDrawerProps) {
  const cartItems: CartDrawerItem[] = [];
  const isEmpty = cartItems.length === 0;
  const itemCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const [open, setOpen] = useState(false);

  return (
    <Drawer
      direction="right"
      shouldScaleBackground={false}
      open={open}
      onOpenChange={setOpen}
    >
      <DrawerTrigger asChild>{children}</DrawerTrigger>

      <DrawerContent
        className="inset-y-0 right-0 left-auto mt-0 flex h-full w-[min(100vw,31rem)] max-w-none flex-col rounded-none border-l border-t-0 border-[#dcd7cf] bg-[#f8f6f1] p-0 [&>div:first-child]:hidden"
      >
        <DrawerTitle className="sr-only">Gio hang</DrawerTitle>
        <DrawerDescription className="sr-only">
          Drawer hien thi trang thai gio hang
        </DrawerDescription>

        <div className="flex h-full flex-col">
          <header className="border-b border-[#e4dfd8] px-8 pb-6 pt-8">
            <div className="pr-10">
              <h2 className="font-afacad text-[2rem] font-semibold uppercase tracking-[0.02em] text-black">
                GIỎ HÀNG ({itemCount})
              </h2>
            </div>
          </header>

          {isEmpty ? (
            <div className="flex flex-1 flex-col items-center justify-center px-8 pb-16 text-center">
              <p className="font-afacad text-[1.15rem] font-normal text-[#b6a590]">
                Giỏ hàng của bạn đang trống
              </p>

              <Button
                asChild
                className="mt-10 h-12 rounded-none bg-black px-8 font-afacad text-[0.95rem] font-semibold uppercase tracking-[0.08em] text-white hover:bg-black/88"
              >
                <Link
                  href="/collections/the-athletes"
                  onClick={() => {
                    setOpen(false);
                  }}
                >
                  KHÁM PHÁ THIẾT KẾ DÀNH CHO BẠN
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-8 pb-8 pt-6">
              <div className="space-y-6">
                {cartItems.map((item) => (
                  <CartItemCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="hidden">
          {MOCK_CART_ITEMS.map((item) => (
            <CartItemCard key={`mock-${item.id}`} item={item} />
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
