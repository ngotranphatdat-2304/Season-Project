"use client";

import { Button } from "@/components/ui/button";

type CartDrawerFooterProps = {
  totalAmount: number;
};

export function CartDrawerFooter({ totalAmount }: CartDrawerFooterProps) {
  return (
    <footer className="shrink-0 border-t border-[#1b1b1b]/18 px-8 pb-8 pt-4">
      <div className="flex items-center justify-between gap-4 font-afacad text-[1.3rem] font-semibold text-black">
        <span>Tổng Số Tiền</span>
        <span>{totalAmount.toLocaleString("vi-VN")} VND</span>
      </div>

      <Button
        type="button"
        className="mt-5 h-12 w-full rounded-none bg-black font-afacad text-[1rem] font-semibold uppercase tracking-[0.08em] text-white hover:bg-black/92"
      >
        Thanh Toán
      </Button>
    </footer>
  );
}
