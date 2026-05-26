"use client";

import * as React from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "error";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  imageSrc?: string;
  eyebrow?: string;
  caption?: string;
};

type ToastOptions = {
  description?: string;
  duration?: number;
  imageSrc?: string;
  eyebrow?: string;
  caption?: string;
};

type CreateToast = {
  success: (title: string, options?: ToastOptions) => string;
  error: (title: string, options?: ToastOptions) => string;
  dismiss: (id?: string) => void;
} & ((title: string, options?: ToastOptions) => string);

const DEFAULT_DURATION = 3200;
const toasts: ToastItem[] = [];
const listeners = new Set<() => void>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

function emitToast(
  variant: ToastVariant,
  title: string,
  options: ToastOptions = {},
): string {
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  toasts.unshift({
    id,
    title,
    description: options.description,
    variant,
    imageSrc: options.imageSrc,
    eyebrow: options.eyebrow,
    caption: options.caption,
  });
  notifyListeners();

  const duration = options.duration ?? DEFAULT_DURATION;
  if (duration > 0) {
    const timer = setTimeout(() => {
      timers.delete(id);
      dismissToast(id);
    }, duration);
    timers.set(id, timer);
  }

  return id;
}

function dismissToast(id?: string): void {
  if (id === undefined) {
    for (const timer of timers.values()) {
      clearTimeout(timer);
    }

    timers.clear();
    toasts.splice(0, toasts.length);
    notifyListeners();
    return;
  }

  const timer = timers.get(id);
  if (timer !== undefined) {
    clearTimeout(timer);
    timers.delete(id);
  }

  const nextIndex = toasts.findIndex((toast) => toast.id === id);
  if (nextIndex !== -1) {
    toasts.splice(nextIndex, 1);
    notifyListeners();
  }
}

export const toast = Object.assign(
  (title: string, options?: ToastOptions) =>
    emitToast("default", title, options),
  {
    success: (title: string, options?: ToastOptions) =>
      emitToast("success", title, options),
    error: (title: string, options?: ToastOptions) =>
      emitToast("error", title, options),
    dismiss: dismissToast,
  },
) as CreateToast;

function useToastStore(): ToastItem[] {
  const [snapshot, setSnapshot] = React.useState<ToastItem[]>(toasts);

  React.useEffect(() => {
    const updateSnapshot = () => {
      setSnapshot([...toasts]);
    };

    listeners.add(updateSnapshot);
    updateSnapshot();

    return () => {
      listeners.delete(updateSnapshot);
    };
  }, []);

  return snapshot;
}

export function Toaster() {
  const currentToasts = useToastStore();

  return (
    <div
      aria-live="polite"
      aria-relevant="additions text"
      className="fixed right-4 top-4 z-50 flex w-[min(100vw-2rem,30rem)] flex-col gap-3"
    >
      {currentToasts.map((item) => {
        const isError = item.variant === "error";
        const isSuccess = item.variant === "success";
        const hasProductPreview =
          (isSuccess || isError) &&
          item.imageSrc !== undefined &&
          item.eyebrow !== undefined &&
          item.caption !== undefined;
        const previewImageSrc = item.imageSrc ?? "";

        return (
          <article
            key={item.id}
            className={cn(
              "overflow-hidden border bg-background shadow-[0_18px_48px_rgba(0,0,0,0.14)] backdrop-blur",
              hasProductPreview
                ? "rounded-none border-[#b8b3ad] p-7"
                : "rounded-2xl p-4",
              isError && !hasProductPreview && "border-red-200",
              isSuccess && "border-emerald-200",
              hasProductPreview && "border-[#b8b3ad]",
            )}
          >
            <div className="flex items-start justify-between gap-4">
              {hasProductPreview ? (
                <div className="min-w-0 flex-1">
                  <p className="font-afacad text-[1rem] font-semibold uppercase tracking-[0.06em] text-black">
                    {item.eyebrow}
                  </p>

                  <div className="mt-7 grid grid-cols-[8.5rem_minmax(0,1fr)] items-center gap-6">
                    <div className="relative aspect-1.5/1 overflow-hidden bg-[#f2efea]">
                      <Image
                        src={previewImageSrc}
                        alt={item.title}
                        fill
                        className="scale-[2] object-contain object-center"
                        sizes="136px"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="font-seesans text-[1.25rem] uppercase leading-[1.05] tracking-[0.02em] text-black">
                        {item.title}
                      </p>
                      <p className="mt-3 font-afacad text-[1rem] text-black">
                        {item.caption}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="min-w-0 space-y-1">
                  <p className="font-afacad text-[0.95rem] font-semibold uppercase tracking-[0.08em] text-foreground">
                    {item.title}
                  </p>
                  {item.description !== undefined ? (
                    <p className="text-sm leading-5 text-muted-foreground">
                      {item.description}
                    </p>
                  ) : null}
                </div>
              )}

              <button
                type="button"
                aria-label="Dismiss notification"
                className={cn(
                  "rounded-full p-1 transition-colors",
                  hasProductPreview
                    ? "text-black hover:bg-black/5"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
                onClick={() => {
                  dismissToast(item.id);
                }}
              >
                <X className="size-4" />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
