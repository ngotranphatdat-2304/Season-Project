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
  initPayOSCheckoutPayment,
  type CheckoutOrderPayload,
  type CheckoutSessionItem,
  type PendingCheckoutSession,
} from "@/lib/checkout/checkout-api";

type CheckoutPageProps = {
  token: string;
};

function formatVnd(amount: number): string {
  return `${amount.toLocaleString("vi-VN")} VND`;
}

function getCheckoutSuccessPath(token: string): string {
  return `/order/success/${encodeURIComponent(token)}`;
}

function CheckoutProductRow({ item }: { item: CheckoutSessionItem }) {
  return (
    <article className="grid grid-cols-[4.75rem_minmax(0,1fr)] gap-3 rounded-lg border border-[#ded9d2] bg-white/62 p-2.5 shadow-[0_12px_28px_rgba(0,0,0,0.04)] sm:grid-cols-[5.25rem_minmax(0,1fr)_auto] md:grid-cols-[5.75rem_minmax(0,1fr)_auto] md:gap-4 md:p-3">
      <div className="relative aspect-square overflow-visible rounded-lg border border-[#ded9d2] bg-white">
        <div className="absolute inset-0 overflow-hidden rounded-lg">
          {item.imageUrl !== "" ? (
            <Image
              src={item.imageUrl}
              alt={item.productName}
              fill
              className="scale-[1.48] object-contain object-center"
              sizes="92px"
            />
          ) : null}
        </div>
        <span className="absolute -right-1.5 -top-1.5 z-10 flex size-7 items-center justify-center rounded-md bg-black font-afacad text-[13px] font-semibold leading-none text-white">
          {item.quantity}
        </span>
      </div>

      <div className="min-w-0 self-center">
        <h3 className="line-clamp-2 font-afacad text-[15px] font-semibold uppercase leading-tight tracking-[0.04em] text-black md:text-[16px]">
          {item.productName}
        </h3>
        <p className="mt-1.5 truncate font-afacad text-[13px] text-black/56 md:text-[14px]">
          SKU {item.variantSku}
        </p>
        {item.variantColor !== undefined ? (
          <p className="mt-1 truncate font-afacad text-[13px] text-black/56 md:text-[14px]">
            {item.variantColor}
          </p>
        ) : null}
      </div>

      <p className="col-span-2 text-right font-afacad text-[15px] font-semibold text-black sm:col-span-1 sm:self-center md:text-[16px]">
        {formatVnd(item.lineTotal)}
      </p>
    </article>
  );
}

function CheckoutSummary({ session }: { session: PendingCheckoutSession }) {
  return (
    <aside className="order-1 flex min-h-0 flex-col border-b border-[#ded9d2] bg-[#f1f0ee] lg:order-2 lg:h-full lg:border-b-0 lg:border-l">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-7 md:py-7">
        <div className="space-y-4.5">
          {session.items.map((item) => (
            <CheckoutProductRow
              key={`${item.productId}-${item.variantSku}`}
              item={item}
            />
          ))}
        </div>
      </div>

      <div className="shrink-0 border-t border-[#d8d3cc] px-5 py-5 md:px-7">
        <div className="space-y-3 font-afacad text-[15px] text-black md:text-[16px]">
          <div className="flex items-center justify-between gap-4">
            <span>Subtotal · {session.itemCount} items</span>
            <span>{formatVnd(session.subtotalAmount)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-1.5">
              Shipping
              <CircleHelp className="size-3.5 text-black/45" />
            </span>
            <span className="uppercase">FREE</span>
          </div>
        </div>

        <div className="mt-5 flex items-end justify-between gap-4">
          <span className="font-afacad text-[24px] font-semibold text-black md:text-[26px]">
            Total
          </span>
          <div className="text-right">
            <span className="mr-2 font-afacad text-[12px] uppercase text-black/45 md:text-[13px]">
              {session.currency}
            </span>
            <span className="font-afacad text-[24px] font-semibold text-black md:text-[26px]">
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

        if (response.status === "payment_pending") {
          router.replace(response.redirectTo);
          return;
        }

        setSession(response);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        if (isAxiosError(error) && error.response?.status === 404) {
          toast.error("Checkout session has expired");
          router.replace("/");
          return;
        }

        toast.error("Unable to load checkout session");
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
      if (payload.paymentMethod === "bank_transfer") {
        const payosResponse = await initPayOSCheckoutPayment(token, payload);
        window.location.assign(payosResponse.checkoutUrl);
        return;
      }

      const response = await completeCheckoutSession(token, payload);
      const successPath = getCheckoutSuccessPath(response.token);

      console.info("[checkout] complete response received", {
        token: response.token,
        successPath,
      });
      console.info("[checkout] BEFORE router.replace", { successPath });
      router.replace(successPath);
      console.info("[checkout] AFTER router.replace", { successPath });
      return;
    } catch (error) {
      if (isAxiosError(error)) {
        const status = error.response?.status;
        const message =
          typeof error.response?.data?.error?.message === "string"
            ? error.response.data.error.message
            : undefined;

        if (status === 404) {
          toast.error("Checkout session has expired");
          router.push("/");
          return;
        }

        if (status === 409 && message === "Đơn hàng đã được đặt") {
          const successPath = getCheckoutSuccessPath(token);

          console.info("[checkout] already completed; redirecting", {
            token,
            successPath,
          });
          router.replace(successPath);
          return;
        }

        if (status === 409 && message === "Đơn hàng không tồn tại") {
          toast.error("Unable to resume QR payment");
          router.replace(`/checkout/${encodeURIComponent(token)}`);
          return;
        }

        if (status === 409) {
          toast.error(message ?? "Some products do not have enough stock");
          router.push("/");
          return;
        }

        if (status === 503) {
          toast.error("QR payment is not configured yet");
          return;
        }
      }

      setIsSubmitting(false);
      toast.error("Unable to place order");
      return;
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
            Loading checkout
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#f5f5f7] text-black lg:h-[calc(100vh-4rem)] lg:overflow-hidden">
      <div className="mx-auto grid min-h-full w-full max-w-312 grid-cols-1 bg-[#f5f5f7] lg:h-full lg:grid-cols-[minmax(0,1fr)_minmax(27rem,30rem)]">
        <section className="order-2 min-h-0 overflow-y-auto bg-[#f8f6f1] lg:order-1">
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
