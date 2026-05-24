"use client";

import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { ProductTypeEnum } from "@/lib/enums";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ProductCategoryConfig } from "./category-config";

type CategoryLayoutProps = {
  category: ProductTypeEnum;
  categoryConfig: ProductCategoryConfig | undefined;
  children: ReactNode;
};

export function CategoryLayout({
  category,
  categoryConfig,
  children,
}: CategoryLayoutProps) {
  const segments = useSelectedLayoutSegments();
  const activeSlug = segments[0];

  if (categoryConfig === undefined) {
    return <>{children}</>;
  }

  const visibleFilters = categoryConfig.filters.map((filter) => ({
    label: filter.label,
    slug: filter.slug,
    href: `/${category}/${filter.slug}`,
  }));

  return (
    <main className="bg-[#f5f5f7] text-neutral-950">
      <section className="mx-auto flex w-full max-w-400 flex-col gap-5 px-4 py-8 md:px-8 lg:px-10 lg:py-10">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-neutral-500">
            <Link href="/" className="hover:text-neutral-900">
              Home
            </Link>
            <ChevronRight className="size-3" />
            <span>{categoryConfig.breadcrumb}</span>
          </div>

          <h1 className="text-2xl font-serif uppercase tracking-[0.18em] md:text-5xl">
            {categoryConfig.title}
          </h1>
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex min-w-max items-center gap-1">
              {visibleFilters.map((filter) => {
                const isActive = activeSlug === filter.slug;

                return (
                  <Link
                    key={filter.slug}
                    href={filter.href}
                    className={[
                      "border-b-2 px-4 py-3 text-sm uppercase tracking-[0.2em] transition-colors",
                      isActive
                        ? "border-neutral-900 text-neutral-950"
                        : "border-transparent text-neutral-500 hover:text-neutral-900",
                    ].join(" ")}
                  >
                    {filter.label}
                  </Link>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <div className="mt-2">{children}</div>
        </div>
      </section>
    </main>
  );
}
