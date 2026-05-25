"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

type CartDrawerEmptyStateProps = {
  onNavigate: () => void;
};

export function CartDrawerEmptyState({
  onNavigate,
}: CartDrawerEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 pb-16 text-center">
      <p className="font-afacad text-[1.15rem] font-normal text-[#b6a590]">
        Giỏ hàng của bạn đang trống
      </p>

      <Button
        asChild
        className="mt-10 h-12 rounded-none bg-black px-8 font-afacad text-[0.95rem] font-semibold uppercase tracking-[0.08em] text-white hover:bg-black/88"
      >
        <Link href="/collections/the-athletes" onClick={onNavigate}>
          KHÁM PHÁ THIẾT KẾ DÀNH CHO BẠN
        </Link>
      </Button>
    </div>
  );
}
