"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { calculateTryOnOverlay } from "@/lib/tryon/overlay";
import type {
  TryOnGlasses,
  TryOnModelFace,
  TryOnRenderedSize,
} from "@/lib/tryon/types";
import { cn } from "@/lib/utils";
import { TryOnDebugOverlay } from "./TryOnDebugOverlay";

type TryOnPreviewProps = {
  modelFace: TryOnModelFace;
  glasses: TryOnGlasses;
  showDebug: boolean;
};

const EMPTY_RENDERED_SIZE: TryOnRenderedSize = {
  width: 0,
  height: 0,
};

const RESERVED_VIEWPORT_HEIGHT_REM = 8.5;

export function TryOnPreview({
  modelFace,
  glasses,
  showDebug,
}: TryOnPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [renderedSize, setRenderedSize] =
    useState<TryOnRenderedSize>(EMPTY_RENDERED_SIZE);
  const overlay = useMemo(
    () => calculateTryOnOverlay(modelFace, glasses, renderedSize),
    [glasses, modelFace, renderedSize],
  );
  const modelAspectRatio =
    modelFace.imageHeight > 0 ? modelFace.imageWidth / modelFace.imageHeight : 1;
  const previewMaxWidth = `min(100%, calc(${(
    modelAspectRatio * 100
  ).toFixed(4)}svh - ${(modelAspectRatio * RESERVED_VIEWPORT_HEIGHT_REM).toFixed(
    4,
  )}rem))`;

  useEffect(() => {
    const previewElement = previewRef.current;

    if (previewElement === null) {
      return;
    }

    const updateRenderedSize = () => {
      const rect = previewElement.getBoundingClientRect();

      setRenderedSize({
        width: rect.width,
        height: rect.height,
      });
    };

    updateRenderedSize();

    const resizeObserver = new ResizeObserver(updateRenderedSize);
    resizeObserver.observe(previewElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [modelFace.id]);

  return (
    <div
      className="mx-auto w-full"
      style={{
        aspectRatio: `${modelFace.imageWidth} / ${modelFace.imageHeight}`,
        maxHeight: `calc(100svh - ${RESERVED_VIEWPORT_HEIGHT_REM}rem)`,
        maxWidth: previewMaxWidth,
      }}
    >
      <div
        ref={previewRef}
        className="relative size-full overflow-hidden rounded-lg bg-[#e3e1dc] shadow-[0_24px_80px_rgba(42,37,30,0.16)] ring-1 ring-black/10"
      >
        <Image
          src={modelFace.imageUrl}
          alt={modelFace.name}
          fill
          priority
          unoptimized
          sizes="(max-width: 767px) calc(100vw - 32px), (max-height: 820px) 56vw, 60vw"
          className="object-contain"
        />

        {overlay !== null ? (
          <Image
            src={glasses.imageUrl}
            alt={glasses.name}
            width={glasses.imageWidth}
            height={glasses.imageHeight}
            priority
            unoptimized
            className={cn(
              "pointer-events-none absolute z-10 select-none object-contain",
              showDebug === true ? "opacity-90" : "opacity-100",
            )}
            style={{
              left: overlay.left,
              top: overlay.top,
              width: overlay.width,
              height: overlay.height,
              transform: `rotate(${overlay.angle}rad)`,
              transformOrigin: "center center",
            }}
          />
        ) : null}

        {showDebug === true ? (
          <TryOnDebugOverlay
            modelFace={modelFace}
            renderedSize={renderedSize}
            overlay={overlay}
          />
        ) : null}
      </div>
    </div>
  );
}
