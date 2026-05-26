"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { CartSessionBootstrap } from "@/components/cart/cart-session-bootstrap";
import { Footer } from "@/components/sections/Footer";
import { Header } from "@/components/sections/Header";

type SiteShellProps = {
  children: React.ReactNode;
};

export function SiteShell({ children }: SiteShellProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <CartSessionBootstrap />
      <Suspense fallback={null}>
        <Header />
      </Suspense>
      {children}
      <Footer />
    </>
  );
}
