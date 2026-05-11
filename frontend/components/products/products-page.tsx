"use client";

import Image from "next/image";
import Link from "next/link";
import { Bookmark, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getProductCategoryConfig, productTabs } from "./products-data";

type ProductsPageProps = {
  category: string;
};

export function ProductsPage({ category }: ProductsPageProps) {
  const categoryConfig = getProductCategoryConfig(category);

  if (categoryConfig === undefined) {
    return (
      <main className="bg-[#f5f5f7] text-neutral-950">
        <section className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-8 md:px-8 lg:px-10 lg:py-10">
          <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
            Category not found.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-[#f5f5f7] text-neutral-950">
      <section className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-8 md:px-8 lg:px-10 lg:py-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-neutral-500">
              <Link href="/" className="hover:text-neutral-900">
                Home
              </Link>
              <ChevronRight className="size-3" />
              <span>{categoryConfig.breadcrumb}</span>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:gap-4">
              <h1 className="text-3xl font-serif uppercase tracking-[0.18em] md:text-5xl">
                {categoryConfig.title}
              </h1>
              <Badge
                variant="secondary"
                className="w-fit rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.2em]"
              >
                {categoryConfig.itemsLabel}
              </Badge>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-fit rounded-full px-5 uppercase tracking-[0.22em]"
          >
            Sort & Filter
          </Button>
        </div>

        <Separator />

        <div className="flex flex-col gap-4">
          <ScrollArea className="w-full whitespace-nowrap">
            <Tabs defaultValue="All Eyeglasses" className="w-full">
              <TabsList className="h-auto w-full justify-start rounded-none bg-transparent p-0">
                {productTabs.map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="rounded-none border-b-2 border-transparent px-4 py-3 text-xs uppercase tracking-[0.2em] text-neutral-500 data-[state=active]:border-neutral-900 data-[state=active]:bg-transparent data-[state=active]:text-neutral-950"
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>
              <ScrollBar orientation="horizontal" />

              <TabsContent value="All Eyeglasses" className="mt-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {categoryConfig.products.map((product) => (
                    <Card
                      key={product.slug}
                      className="group overflow-hidden border-0 bg-[#f5f5f7] shadow-none"
                    >
                      <CardHeader className="flex-row items-start justify-between space-y-0 p-4 pb-0">
                        <Badge
                          variant="outline"
                          className="rounded-full bg-white/80 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-neutral-500"
                        >
                          {product.colorCount}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-full opacity-70 transition-opacity group-hover:opacity-100"
                        >
                          <Bookmark data-icon="inline-start" />
                        </Button>
                      </CardHeader>

                      <CardContent className="p-4 pt-0">
                        <div className="relative aspect-[3/4] overflow-hidden bg-white shadow-[0_12px_40px_rgba(0,0,0,0.04)] transition-transform duration-500 group-hover:-translate-y-1">
                          <div className="absolute inset-0 flex items-center justify-center p-8">
                            <div className="relative aspect-square w-[80%] overflow-hidden">
                              {product.image !== "" ? (
                                <Image
                                  src={product.image}
                                  alt={product.title}
                                  fill
                                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                                />
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </CardContent>

                      <CardFooter className="flex items-end justify-between gap-3 px-4 pb-4 pt-0">
                        <div className="flex flex-col gap-1">
                          <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">
                            {product.frameType} / {product.material}
                          </p>
                          <CardTitle className="text-lg font-serif font-normal uppercase tracking-[0.12em]">
                            {product.title}
                          </CardTitle>
                        </div>
                        <div className="text-right text-sm text-neutral-600">
                          <div>{product.price.toLocaleString()} VND</div>
                          {product.isOnSale ? (
                            <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                              Sale
                            </div>
                          ) : null}
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {productTabs
                .filter((tab) => tab !== "All Eyeglasses")
                .map((tab) => (
                  <TabsContent
                    key={tab}
                    value={tab}
                    className="mt-6 text-sm text-neutral-500"
                  >
                    Filter coming soon.
                  </TabsContent>
                ))}
            </Tabs>
          </ScrollArea>
        </div>
      </section>
    </main>
  );
}
