"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { fetchCurrentAdmin, type AdminUser, readAdminSession } from "@/lib/admin/auth";

type AdminGuardProps = {
  children: (user: AdminUser) => React.ReactNode;
};

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      const existingSession = readAdminSession();

      if (existingSession === null) {
        router.replace(`/admin/auth?next=${encodeURIComponent(pathname)}`);
        return;
      }

      const currentUser = await fetchCurrentAdmin().catch(() => null);

      if (isMounted === false) {
        return;
      }

      if (currentUser === null || currentUser.role !== "admin") {
        router.replace(`/admin/auth?next=${encodeURIComponent(pathname)}`);
        return;
      }

      setUser(currentUser);
      setIsChecking(false);
    };

    void run();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  if (isChecking === true || user === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f0e8]">
        <div className="rounded-[2rem] border border-black/10 bg-white px-8 py-6 text-center shadow-[0_20px_80px_rgba(0,0,0,0.08)]">
          <p className="font-afacad text-sm uppercase tracking-[0.25em] text-black/45">
            Admin Access
          </p>
          <p className="mt-3 font-serif text-lg text-black/75">
            Verifying your session...
          </p>
        </div>
      </div>
    );
  }

  return <>{children(user)}</>;
}
