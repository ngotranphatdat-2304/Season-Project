"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { CheckCircle2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/sonner";
import {
  fetchCheckoutSession,
  type CompletedCheckoutSession,
} from "@/lib/checkout/checkout-api";

type OrderSuccessPageProps = {
  token: string;
};

function formatVnd(amount: number): string {
  return `${amount.toLocaleString("vi-VN")} VND`;
}

function formatAddress(
  address: CompletedCheckoutSession["order"]["shippingAddress"],
): string {
  return [
    address.line1,
    address.line2,
    address.ward,
    address.district,
    address.city,
    address.province,
    address.country,
  ]
    .filter((value): value is string => value !== undefined && value.trim() !== "")
    .join(", ");
}

function getPaymentTitle(
  paymentMethod: CompletedCheckoutSession["order"]["paymentMethod"],
): string {
  return paymentMethod === "bank_transfer" ? "Payment received" : "Payment";
}

function getPaymentDescription(
  paymentMethod: CompletedCheckoutSession["order"]["paymentMethod"],
): string {
  return paymentMethod === "bank_transfer"
    ? "Paid via PayOS QR payment. Your payment has been confirmed successfully."
    : "Cash on delivery (COD). We will contact you to confirm before delivery.";
}

export function OrderSuccessPage({ token }: OrderSuccessPageProps) {
  const router = useRouter();
  const [session, setSession] = useState<CompletedCheckoutSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const loadOrder = async () => {
      try {
        const response = await fetchCheckoutSession(token);

        console.info("[order-success] checkout session loaded", {
          token,
          status: response.status,
        });

        if (isCancelled) {
          return;
        }

        if (response.status !== "completed") {
          console.info("[order-success] session is not completed; redirecting", {
            token,
            status: response.status,
          });
          router.replace(`/checkout/${encodeURIComponent(token)}`);
          return;
        }

        setSession(response);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        if (isAxiosError(error) && error.response?.status === 404) {
          console.info("[order-success] completed session lookup returned 404", {
            token,
          });
          toast.error("Checkout session has expired");
        } else {
          console.info("[order-success] completed session lookup failed", {
            token,
            status: isAxiosError(error) ? error.response?.status : undefined,
          });
          toast.error("Unable to load order");
        }

        router.replace("/");
      } finally {
        if (isCancelled === false) {
          setIsLoading(false);
        }
      }
    };

    void loadOrder();

    return () => {
      isCancelled = true;
    };
  }, [router, token]);

  if (isLoading || session === null) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#f8f6f1] text-black">
        <div className="flex flex-col items-center gap-4 text-center">
          <Spinner className="size-6" />
          <p className="font-afacad text-[13px] uppercase tracking-[0.18em] text-black/50">
            Loading order
          </p>
        </div>
      </main>
    );
  }

  const { order } = session;

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#f8f6f1] px-5 py-8 text-black md:px-8 md:py-12">
      <div className="mx-auto grid w-full max-w-272 grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="border border-[#d8d3cc] bg-white px-6 py-8 shadow-[0_18px_48px_rgba(0,0,0,0.08)] md:px-9">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="mt-1 size-7 shrink-0 text-[#237b4b]" />
            <div>
              <p className="font-afacad text-[13px] uppercase tracking-[0.18em] text-black/45">
                Order Success
              </p>
              <h1 className="mt-3 font-seesans text-[30px] uppercase leading-[1.08] text-black md:text-[38px]">
                Thank you for your order
              </h1>
              <p className="mt-4 font-afacad text-[17px] text-black/68">
                Your order number is{" "}
                <span className="font-semibold text-black">{order.orderId}</span>.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 border-t border-[#e4dfd8] pt-6 md:grid-cols-2">
            <div>
              <h2 className="font-afacad text-[15px] font-semibold uppercase tracking-[0.08em]">
                Contact information
              </h2>
              <p className="mt-3 font-afacad text-[15px] text-black/66">
                {order.customerEmail}
              </p>
              <p className="mt-1 font-afacad text-[15px] text-black/66">
                {order.shippingAddress.phone}
              </p>
            </div>

            <div>
              <h2 className="font-afacad text-[15px] font-semibold uppercase tracking-[0.08em]">
                Delivery
              </h2>
              <p className="mt-3 font-afacad text-[15px] text-black/66">
                {order.shippingAddress.recipientName}
              </p>
              <p className="mt-1 font-afacad text-[15px] text-black/66">
                {formatAddress(order.shippingAddress)}
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-[#e4dfd8] pt-6">
            <h2 className="font-afacad text-[15px] font-semibold uppercase tracking-[0.08em]">
              {getPaymentTitle(order.paymentMethod)}
            </h2>
            <p className="mt-3 font-afacad text-[15px] text-black/66">
              {getPaymentDescription(order.paymentMethod)}
            </p>
          </div>

          <Link
            href="/"
            className="mt-8 inline-flex min-h-12 items-center justify-center bg-black px-6 font-afacad text-[15px] font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-black/90"
          >
            Continue shopping
          </Link>
        </section>

        <aside className="border border-[#d8d3cc] bg-[#f1f0ee] px-5 py-6">
          <h2 className="font-afacad text-[16px] font-semibold uppercase tracking-[0.08em]">
            Order summary
          </h2>

          <div className="mt-5 space-y-4">
            {order.items.map((item) => (
              <article
                key={`${item.productId}-${item.variantSku}`}
                className="grid grid-cols-[4rem_minmax(0,1fr)_auto] gap-3"
              >
                <div className="relative aspect-square overflow-hidden rounded-md border border-[#ded9d2] bg-white">
                  {item.imageUrl !== "" ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.productName}
                      fill
                      className="scale-[1.45] object-contain"
                      sizes="64px"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-afacad text-[13px] font-semibold uppercase tracking-[0.04em]">
                    {item.productName}
                  </h3>
                  <p className="mt-1 font-afacad text-[12px] text-black/56">
                    {item.variantSku} · Qty {item.quantity}
                  </p>
                </div>
                <p className="font-afacad text-[13px] font-semibold">
                  {formatVnd(item.lineTotal)}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-6 space-y-2 border-t border-[#d8d3cc] pt-5 font-afacad text-[14px]">
            <div className="flex justify-between gap-4">
              <span>Subtotal</span>
              <span>{formatVnd(order.subtotalAmount)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Shipping</span>
              <span>{formatVnd(order.shippingFee)}</span>
            </div>
            <div className="flex justify-between gap-4 pt-3 text-[20px] font-semibold">
              <span>Total</span>
              <span>{formatVnd(order.totalAmount)}</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
