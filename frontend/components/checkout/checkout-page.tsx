"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { CircleHelp } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/sonner";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import {
  completeCheckoutSession,
  fetchCheckoutSession,
  type CheckoutOrderPayload,
  type CheckoutSessionItem,
  type PendingCheckoutSession,
} from "@/lib/checkout/checkout-api";

type CheckoutPageProps = {
  token: string;
};

function formatVnd(amount: number): string {
  return `${amount.toLocaleString("vi-VN")} đ`;
}

function CheckoutProductRow({ item }: { item: CheckoutSessionItem }) {
  return (
    <article className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-start gap-3">
      <div className="relative aspect-square overflow-visible rounded-md border border-[#ded9d2] bg-white">
        <div className="absolute inset-0 overflow-hidden rounded-md">
          {item.imageUrl !== "" ? (
            <Image
              src={item.imageUrl}
              alt={item.productName}
              fill
              className="scale-[1.55] object-contain object-center"
              sizes="80px"
            />
          ) : null}
        </div>
        <span className="absolute -right-1.5 -top-1.5 z-10 flex size-6 items-center justify-center rounded-md bg-black font-afacad text-[12px] font-semibold leading-none text-white">
          {item.quantity}
        </span>
      </div>

      <div className="min-w-0 pt-1">
        <h3 className="truncate font-afacad text-[13px] font-semibold uppercase tracking-[0.04em] text-black">
          {item.productName}
        </h3>
        <p className="mt-1 truncate font-afacad text-[12px] text-black/56">
          SKU {item.variantSku}
        </p>
        {item.variantColor !== undefined ? (
          <p className="mt-0.5 truncate font-afacad text-[12px] text-black/56">
            {item.variantColor}
          </p>
        ) : null}
      </div>

      <p className="pt-1 text-right font-afacad text-[13px] font-semibold text-black">
        {formatVnd(item.lineTotal)}
      </p>
    </article>
  );
}

function CheckoutSummary({ session }: { session: PendingCheckoutSession }) {
  return (
    <aside className="flex min-h-0 flex-col border-l border-[#ded9d2] bg-[#f1f0ee] lg:h-full">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-7 md:px-8">
        <div className="space-y-4">
          {session.items.map((item) => (
            <CheckoutProductRow
              key={`${item.productId}-${item.variantSku}`}
              item={item}
            />
          ))}
        </div>
      </div>

      <div className="shrink-0 border-t border-[#d8d3cc] px-6 py-5 md:px-8">
        <div className="space-y-2 font-afacad text-[14px] text-black">
          <div className="flex items-center justify-between gap-4">
            <span>Tạm tính · {session.itemCount} sản phẩm</span>
            <span>{formatVnd(session.subtotalAmount)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-1.5">
              Vận chuyển
              <CircleHelp className="size-3.5 text-black/45" />
            </span>
            <span className="uppercase">MIỄN PHÍ</span>
          </div>
        </div>

        <div className="mt-5 flex items-end justify-between gap-4">
          <span className="font-afacad text-[22px] font-semibold text-black">
            Tổng
          </span>
          <div className="text-right">
            <span className="mr-2 font-afacad text-[12px] uppercase text-black/45">
              {session.currency}
            </span>
            <span className="font-afacad text-[22px] font-semibold text-black">
              {formatVnd(session.totalAmount)}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function CheckoutPage({ token }: CheckoutPageProps) {
  const router = useRouter();
  const [session, setSession] = useState<PendingCheckoutSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const loadCheckoutSession = async () => {
      setIsLoading(true);

      try {
        const response = await fetchCheckoutSession(token);

        if (isCancelled) {
          return;
        }

        if (response.status === "completed") {
          router.replace(response.redirectTo);
          return;
        }

        setSession(response);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        if (isAxiosError(error) && error.response?.status === 404) {
          toast.error("Phiên thanh toán đã hết hạn");
          router.replace("/");
          return;
        }

        toast.error("Không thể tải phiên thanh toán");
        router.replace("/");
      } finally {
        if (isCancelled === false) {
          setIsLoading(false);
        }
      }
    };

    void loadCheckoutSession();

    return () => {
      isCancelled = true;
    };
  }, [router, token]);

  const handleCheckoutSubmit = async (payload: CheckoutOrderPayload) => {
    if (isSubmitting === true) {
      return;
    }

    setIsSubmitting(true);

    try {
      await completeCheckoutSession(token, payload);
      router.push(`/order/success/${encodeURIComponent(token)}`);
    } catch (error) {
      if (isAxiosError(error)) {
        const status = error.response?.status;
        const message =
          typeof error.response?.data?.error?.message === "string"
            ? error.response.data.error.message
            : undefined;

        if (status === 404) {
          toast.error("Phiên thanh toán đã hết hạn");
          router.push("/");
          return;
        }

        if (status === 409 && message === "Đơn hàng đã được đặt") {
          router.push(`/order/success/${encodeURIComponent(token)}`);
          return;
        }

        if (status === 409) {
          toast.error(message ?? "Một số sản phẩm không đủ hàng");
          router.push("/");
          return;
        }
      }

      toast.error("Không thể đặt hàng");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || session === null) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#f5f5f7] text-black">
        <div className="flex flex-col items-center gap-4 text-center">
          <Spinner className="size-6" />
          <p className="font-afacad text-[13px] uppercase tracking-[0.18em] text-black/50">
            Đang tải thanh toán
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#f5f5f7] text-black lg:h-[calc(100vh-4rem)] lg:overflow-hidden">
      <div className="mx-auto grid min-h-full w-full max-w-304 grid-cols-1 bg-[#f5f5f7] lg:h-full lg:grid-cols-[minmax(0,1fr)_minmax(25rem,28rem)]">
        <section className="min-h-0 overflow-y-auto bg-[#f8f6f1]">
          <CheckoutForm
            isSubmitting={isSubmitting}
            onSubmit={(payload) => {
              void handleCheckoutSubmit(payload);
            }}
          />
        </section>
        <CheckoutSummary session={session} />
      </div>
    </main>
  );
}
