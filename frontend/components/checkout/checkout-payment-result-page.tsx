"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/sonner";
import {
  fetchCheckoutPaymentStatus,
  type CheckoutPaymentStatusResponse,
} from "@/lib/checkout/checkout-api";

type CheckoutPaymentResultPageProps = {
  token: string;
  orderId: string;
};

export function CheckoutPaymentResultPage({
  token,
  orderId,
}: CheckoutPaymentResultPageProps) {
  const router = useRouter();
  const [result, setResult] = useState<CheckoutPaymentStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const loadStatus = async () => {
      try {
        const response = await fetchCheckoutPaymentStatus(token, orderId);

        if (isCancelled) {
          return;
        }

        if (response.status === "paid" && response.redirectTo !== undefined) {
          router.replace(response.redirectTo);
          return;
        }

        setResult(response);

        if (response.status === "pending") {
          timeoutId = setTimeout(() => {
            void loadStatus();
          }, 2500);
        }
      } catch (error) {
        if (isCancelled) {
          return;
        }

        if (isAxiosError(error) && error.response?.status === 404) {
          toast.error("Payment session has expired");
        } else {
          toast.error("Unable to resolve payment status");
        }

        router.replace(token === "" ? "/" : `/checkout/${encodeURIComponent(token)}`);
      } finally {
        if (isCancelled === false) {
          setIsLoading(false);
        }
      }
    };

    void loadStatus();

    return () => {
      isCancelled = true;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [orderId, router, token]);

  if (isLoading || result === null) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#f8f6f1] px-5 text-black">
        <div className="flex flex-col items-center gap-4 text-center">
          <Spinner className="size-6" />
          <p className="font-afacad text-[13px] uppercase tracking-[0.18em] text-black/50">
            Checking payment
          </p>
        </div>
      </main>
    );
  }

  const isPending = result.status === "pending";

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#f8f6f1] px-5 py-8 text-black md:px-8 md:py-12">
      <div className="mx-auto grid w-full max-w-272 grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="border border-[#d8d3cc] bg-white px-6 py-8 shadow-[0_18px_48px_rgba(0,0,0,0.08)] md:px-9">
          <div className="flex items-start gap-4">
            {isPending ? (
              <Spinner className="mt-1 size-7 shrink-0" />
            ) : result.status === "paid" ? (
              <CheckCircle2 className="mt-1 size-7 shrink-0 text-[#237b4b]" />
            ) : (
              <AlertCircle className="mt-1 size-7 shrink-0 text-[#b14638]" />
            )}
            <div>
              <p className="font-afacad text-[13px] uppercase tracking-[0.18em] text-black/45">
                QR Payment
              </p>
              <h1 className="mt-3 font-seesans text-[30px] uppercase leading-[1.08] text-black md:text-[38px]">
                {isPending
                  ? "Waiting for payment confirmation"
                  : "Payment update"}
              </h1>
              <p className="mt-4 font-afacad text-[17px] text-black/68">
                {result.message ??
                  "We are checking your payment result with PayOS."}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 border-t border-[#e4dfd8] pt-6 md:grid-cols-2">
            <div>
              <h2 className="font-afacad text-[15px] font-semibold uppercase tracking-[0.08em]">
                Order information
              </h2>
              <p className="mt-3 font-afacad text-[15px] text-black/66">
                Order ID
              </p>
              <p className="mt-1 font-afacad text-[15px] font-semibold text-black">
                {result.orderId}
              </p>
            </div>

            <div>
              <h2 className="font-afacad text-[15px] font-semibold uppercase tracking-[0.08em]">
                Payment state
              </h2>
              <p className="mt-3 font-afacad text-[15px] text-black/66">
                {isPending
                  ? "PayOS is still confirming this payment."
                  : result.status === "paid"
                    ? "Your QR payment has been confirmed."
                    : "This payment was not completed."}
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-[#e4dfd8] pt-6">
            <h2 className="font-afacad text-[15px] font-semibold uppercase tracking-[0.08em]">
              Next step
            </h2>
            <p className="mt-3 font-afacad text-[15px] text-black/66">
              {isPending
                ? "Keep this page open for a moment while we reconcile the payment result."
                : result.status === "paid"
                  ? "We are taking you to the order success page."
                  : "You can return to checkout and create a new QR payment or switch to COD."}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {isPending ? null : (
              <Link
                href={`/checkout/${encodeURIComponent(token)}`}
                className="inline-flex min-h-12 items-center justify-center border border-black px-6 font-afacad text-[15px] font-semibold uppercase tracking-[0.08em] text-black transition-colors hover:bg-black hover:text-white"
              >
                Back to checkout
              </Link>
            )}
            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center bg-black px-6 font-afacad text-[15px] font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-black/90"
            >
              Continue shopping
            </Link>
          </div>
        </section>

        <aside className="border border-[#d8d3cc] bg-[#f1f0ee] px-5 py-6">
          <h2 className="font-afacad text-[16px] font-semibold uppercase tracking-[0.08em]">
            Payment summary
          </h2>

          <div className="mt-5 space-y-4 font-afacad text-[14px] text-black/72">
            <div className="flex justify-between gap-4">
              <span>Method</span>
              <span className="font-semibold text-black">PayOS QR</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Status</span>
              <span className="font-semibold uppercase text-black">
                {result.status}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Checkout token</span>
              <span className="truncate font-semibold text-black">{token}</span>
            </div>
          </div>

          <div className="mt-6 border-t border-[#d8d3cc] pt-5">
            <p className="font-afacad text-[14px] leading-6 text-black/64">
              The payment result shown here comes from the backend checkout
              session, not only from the PayOS return query string.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
