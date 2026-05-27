import { CheckoutPaymentResultPage } from "@/components/checkout/checkout-payment-result-page";

type CheckoutPaymentResultRouteProps = {
  searchParams: Promise<{
    token?: string;
    orderId?: string;
  }>;
};

export default async function CheckoutPaymentResultRoute({
  searchParams,
}: CheckoutPaymentResultRouteProps) {
  const { token = "", orderId = "" } = await searchParams;

  return <CheckoutPaymentResultPage token={token} orderId={orderId} />;
}
