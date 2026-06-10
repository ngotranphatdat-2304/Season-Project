"use client";

import Image from "next/image";
import type { TryOnModelFace } from "@/lib/tryon/types";
import { cn } from "@/lib/utils";

type ModelSelectorProps = {
  models: TryOnModelFace[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
};

export function ModelSelector({
  models,
  selectedModelId,
  onSelectModel,
}: ModelSelectorProps) {
  if (models.length === 0) {
    return (
      <p className="font-afacad text-sm text-black/50">
        Model images are not ready yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-afacad text-xs font-semibold uppercase tracking-[0.22em] text-black/45">
          Model
        </h2>
        <span className="font-afacad text-xs text-black/40">
          {models.length} options
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {models.map((model) => {
          const isSelected = model.id === selectedModelId;

          return (
            <button
              key={model.id}
              type="button"
              aria-pressed={isSelected}
              className={cn(
                "group min-w-0 rounded-lg border bg-white p-1.5 text-left transition-colors",
                isSelected === true
                  ? "border-black"
                  : "border-black/10 hover:border-black/35",
              )}
              onClick={() => {
                onSelectModel(model.id);
              }}
            >
              <span
                className="relative block overflow-hidden rounded-md bg-[#ecebe8]"
                style={{
                  aspectRatio: `${model.imageWidth} / ${model.imageHeight}`,
                }}
              >
                <Image
                  src={model.imageUrl}
                  alt={model.name}
                  fill
                  unoptimized
                  sizes="8rem"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </span>
              <span className="mt-2 block truncate font-afacad text-[12px] text-black/70">
                {model.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
