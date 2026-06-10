"use client";

import Image from "next/image";
import type { TryOnGlasses } from "@/lib/tryon/types";
import { cn } from "@/lib/utils";

type GlassesSelectorProps = {
  glassesItems: TryOnGlasses[];
  selectedGlassesId: string;
  onSelectGlasses: (glassesId: string) => void;
};

export function GlassesSelector({
  glassesItems,
  selectedGlassesId,
  onSelectGlasses,
}: GlassesSelectorProps) {
  if (glassesItems.length === 0) {
    return (
      <p className="font-afacad text-sm text-black/50">
        Glasses assets are not ready yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-afacad text-xs font-semibold uppercase tracking-[0.22em] text-black/45">
          Frame
        </h2>
        <span className="font-afacad text-xs text-black/40">
          {glassesItems.length} options
        </span>
      </div>

      <div className="space-y-2">
        {glassesItems.map((glasses) => {
          const isSelected = glasses.id === selectedGlassesId;

          return (
            <button
              key={glasses.id}
              type="button"
              aria-pressed={isSelected}
              className={cn(
                "grid w-full grid-cols-[5.5rem_1fr] items-center gap-3 rounded-lg border bg-white p-2 text-left transition-colors",
                isSelected === true
                  ? "border-black"
                  : "border-black/10 hover:border-black/35",
              )}
              onClick={() => {
                onSelectGlasses(glasses.id);
              }}
            >
              <span className="relative block aspect-[5/2] overflow-hidden rounded-md bg-[#f2f1ee]">
                <Image
                  src={glasses.imageUrl}
                  alt={glasses.name}
                  fill
                  unoptimized
                  sizes="8rem"
                  className="object-contain p-1.5"
                />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-afacad text-[14px] text-black">
                  {glasses.name}
                </span>
                <span className="mt-0.5 block font-afacad text-[11px] uppercase tracking-[0.16em] text-black/40">
                  2D PNG
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
