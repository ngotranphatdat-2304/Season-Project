"use client";

import { useEffect } from "react";
import { bootstrapGuestCartSession } from "@/lib/cart/cart-api";

export function CartSessionBootstrap() {
  useEffect(() => {
    void bootstrapGuestCartSession().catch(() => {
      // Best-effort session bootstrap. Cart actions can retry later.
    });
  }, []);

  return null;
}
