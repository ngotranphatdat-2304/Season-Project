"use client";

import { isAxiosError } from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { initCheckoutSession } from "@/lib/checkout/checkout-api";

type CartDrawerFooterProps = {
  totalAmount: number;
  onCheckoutSuccess?: () => void;
};

function getCheckoutErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.error?.message;

    if (typeof message === "string" && message.trim() !== "") {
      return message;
    }
  }

  return "Một số sản phẩm không còn khả dụng";
}

export function CartDrawerFooter({
  totalAmount,
  onCheckoutSuccess,
}: CartDrawerFooterProps) {
  const router = useRouter();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = async () => {
    setIsCheckingOut(true);

    try {
      const response = await initCheckoutSession();
      onCheckoutSuccess?.();
      router.push(`/checkout/${response.token}`);
    } catch (error) {
      toast.error(getCheckoutErrorMessage(error));
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <footer className="shrink-0 border-t border-[#1b1b1b]/18 px-8 pb-8 pt-4">
      <div className="flex items-center justify-between gap-4 font-afacad text-[1.3rem] font-semibold text-black">
        <span>Tổng Số Tiền</span>
        <span>{totalAmount.toLocaleString("vi-VN")} VND</span>
      </div>

      <Button
        type="button"
        disabled={isCheckingOut}
        onClick={() => {
          void handleCheckout();
        }}
        className="mt-5 h-12 w-full rounded-none bg-black font-afacad text-[1rem] font-semibold uppercase tracking-[0.08em] text-white hover:bg-black/92"
      >
        {isCheckingOut ? "Đang xử lý..." : "Thanh Toán"}
      </Button>
    </footer>
  );
}
