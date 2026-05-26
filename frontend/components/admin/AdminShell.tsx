"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Boxes, LogOut, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logoutAdmin, type AdminUser } from "@/lib/admin/auth";

type AdminShellProps = {
  user: AdminUser;
  children: React.ReactNode;
};

const navigationItems = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: BarChart3,
  },
  {
    href: "/admin/catalog",
    label: "Catalog",
    icon: Boxes,
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: PackageSearch,
  },
];

export function AdminShell({ user, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(209,181,145,0.22),_transparent_28%),linear-gradient(180deg,#fbf8f2_0%,#f1ecdf_100%)] text-black">
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 gap-6 px-4 py-4 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-6 lg:py-6">
        <aside className="rounded-[2rem] border border-black/10 bg-[#121212] p-6 text-white shadow-[0_30px_80px_rgba(0,0,0,0.16)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-afacad text-xs uppercase tracking-[0.3em] text-white/45">
                Season
              </p>
              <h1 className="mt-2 font-serif text-3xl">Admin Studio</h1>
            </div>
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
            <p className="font-afacad text-xs uppercase tracking-[0.25em] text-white/45">
              Signed in
            </p>
            <p className="mt-2 font-serif text-xl">{user.name}</p>
            <p className="mt-1 text-sm text-white/60">{user.email}</p>
          </div>

          <nav className="mt-8 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors",
                    isActive
                      ? "bg-[#d7b58b] text-black"
                      : "text-white/72 hover:bg-white/8 hover:text-white",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-afacad text-base uppercase tracking-[0.14em]">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <Button
            variant="secondary"
            className="mt-8 w-full justify-between rounded-2xl bg-white/10 px-4 py-6 text-white hover:bg-white/16"
            onClick={() => {
              void logoutAdmin().finally(() => {
                router.replace("/admin/auth");
              });
            }}
          >
            <span className="font-afacad uppercase tracking-[0.18em]">Logout</span>
            <LogOut className="h-4 w-4" />
          </Button>
        </aside>

        <main className="min-w-0 rounded-[2rem] border border-black/10 bg-white/78 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.08)] backdrop-blur md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
