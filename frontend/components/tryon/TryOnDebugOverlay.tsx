"use client";

import { calculateRenderedPoint } from "@/lib/tryon/overlay";
import type {
  TryOnModelFace,
  TryOnOverlayStyle,
  TryOnPoint,
  TryOnRenderedSize,
} from "@/lib/tryon/types";

type TryOnDebugOverlayProps = {
  modelFace: TryOnModelFace;
  renderedSize: TryOnRenderedSize;
  overlay: TryOnOverlayStyle | null;
};

function DebugPoint({
  label,
  point,
}: {
  label: string;
  point: TryOnPoint | null;
}) {
  if (point === null) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute z-30 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-black shadow-[0_0_0_1px_rgba(0,0,0,0.45)]"
      style={{
        left: point.x,
        top: point.y,
      }}
    >
      <span className="absolute left-3 top-1/2 -translate-y-1/2 whitespace-nowrap bg-black px-1.5 py-0.5 font-afacad text-[10px] uppercase tracking-[0.12em] text-white">
        {label}
      </span>
    </div>
  );
}

export function TryOnDebugOverlay({
  modelFace,
  renderedSize,
  overlay,
}: TryOnDebugOverlayProps) {
  const leftEye = calculateRenderedPoint(
    modelFace.leftEye,
    modelFace,
    renderedSize,
  );
  const rightEye = calculateRenderedPoint(
    modelFace.rightEye,
    modelFace,
    renderedSize,
  );
  const noseBridge =
    modelFace.noseBridge === undefined
      ? null
      : calculateRenderedPoint(modelFace.noseBridge, modelFace, renderedSize);

  return (
    <>
      <DebugPoint label="L" point={leftEye} />
      <DebugPoint label="R" point={rightEye} />
      <DebugPoint label="N" point={noseBridge} />
      {overlay !== null ? (
        <div
          className="pointer-events-none absolute z-20 border border-dashed border-white/80 shadow-[0_0_0_1px_rgba(0,0,0,0.3)]"
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
    </>
  );
}
