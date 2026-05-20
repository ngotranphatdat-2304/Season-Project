import Image from "next/image";
import { Bookmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ProductCard } from "../../lib/model/misc";

type ProductsPageViewProps = {
  products: ProductCard[];
  totalItems: number;
};

export function ProductsPage({ products, totalItems }: ProductsPageViewProps) {
  console.log("Rendering ProductsPage with products:", products, "Total items:", totalItems);
  return (
    <div className="flex flex-col gap-4">
      <Badge
        variant="secondary"
        className="w-fit rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] sm:px-3 sm:text-[12px] md:text-[14px]"
      >
        {totalItems} Items
      </Badge>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-3">
        {products.map((product, index) => (
          <Card
            key={product.slug}
            className="group overflow-hidden border-0 bg-[#f5f5f7] shadow-none"
          >
            <CardHeader className="flex-row items-start justify-between space-y-0 p-3 pb-0 sm:p-4 sm:pb-0">
              <Badge
                variant="outline"
                className="rounded-full bg-white/80 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.16em] text-neutral-500 sm:px-3 sm:py-1 sm:text-[10px] md:text-[11.5px]"
              >
                {product.colorCount}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full opacity-70 transition-opacity group-hover:opacity-100 md:size-9"
              >
                <Bookmark data-icon="inline-start" />
              </Button>
            </CardHeader>

            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="relative aspect-4/5 overflow-hidden bg-white shadow-[0_12px_40px_rgba(0,0,0,0.04)] transition-transform duration-500 group-hover:-translate-y-1">
                <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 md:p-8">
                  <div className="relative aspect-square w-[80%] overflow-hidden">
                    {product.image !== "" ? (
                      <Image
                        src={product.image}
                        alt={product.title}
                        fill
                        loading={index === 0 ? "eager" : "lazy"}
                        className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col items-start gap-2 px-3 pb-3 pt-0 sm:px-4 sm:pb-4 md:flex-row md:items-end md:justify-between md:gap-3">
              <div className="flex flex-col gap-1">
                {product.meta ? (
                  <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 sm:text-[11px] md:text-xs">
                    {product.meta}
                  </p>
                ) : null}
                <CardTitle className="text-sm font-serif font-normal uppercase tracking-[0.08em] sm:text-base md:text-lg md:tracking-[0.12em]">
                  {product.title}
                </CardTitle>
              </div>
              <div className="text-left text-xs text-neutral-600 sm:text-sm md:text-right">
                {product.isOnSale ? (
                  <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-400 line-through sm:text-xs sm:tracking-[0.18em]">
                    {product.originalPrice.toLocaleString()} VND
                  </div>
                ) : null}
                <div>{product.price.toLocaleString()} VND</div>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
