"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { fetchCollectionFilters } from "@/lib/model";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export function CollectionsLayout({ children }: { children: ReactNode }) {
  const activeCollectionSlug = useSelectedLayoutSegment();
  const [collectionFilters, setCollectionFilters] = useState<
    Array<{ label: string; slug: string; href: string }>
  >([]);
  const [isLoadingCollectionFilters, setIsLoadingCollectionFilters] =
    useState(true);

  useEffect(() => {
    let isCancelled = false;

    const loadCollectionFilters = async () => {
      try {
        const collections = await fetchCollectionFilters();

        if (isCancelled === true) {
          return;
        }

        setCollectionFilters(
          collections.map((collection) => ({
            label: collection.name,
            slug: collection.slug,
            href: `/collections/${collection.slug}`,
          })),
        );
        setIsLoadingCollectionFilters(false);
      } catch (error) {
        if (isCancelled === false) {
          console.error("Failed to load collection filters:", error);
          setCollectionFilters([]);
          setIsLoadingCollectionFilters(false);
        }
      }
    };

    void loadCollectionFilters();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <main className="bg-[#f5f5f7] text-neutral-950">
      <section className="mx-auto flex w-full max-w-400 flex-col gap-5 px-4 py-8 md:px-8 lg:px-10 lg:py-10">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-neutral-500">
            <Link href="/" className="hover:text-neutral-900">
              Home
            </Link>
            <ChevronRight className="size-3" />
            <span>Collections</span>
          </div>

          <h1 className="text-2xl font-serif uppercase tracking-[0.18em] md:text-5xl">
            Collections
          </h1>
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <ScrollArea className="w-full whitespace-nowrap">
            {isLoadingCollectionFilters ? (
              <div className="flex min-w-max items-center gap-1">
                <span className="border-b-2 border-transparent px-4 py-3 text-sm uppercase tracking-[0.2em] text-neutral-400">
                  Loading Collections...
                </span>
              </div>
            ) : (
              <div className="flex min-w-max items-center gap-1">
                {collectionFilters.map((filter) => {
                  const isActive = activeCollectionSlug === filter.slug;

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
            )}
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <div className="mt-2">{children}</div>
        </div>
      </section>
    </main>
  );
}
