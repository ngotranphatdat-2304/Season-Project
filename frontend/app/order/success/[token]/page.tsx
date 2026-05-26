import { OrderSuccessPage } from "@/components/checkout/order-success-page";

type OrderSuccessRouteProps = {
  params: Promise<{ token: string }>;
};

export default async function OrderSuccessRoute({
  params,
}: OrderSuccessRouteProps) {
  const { token } = await params;

  return <OrderSuccessPage token={token} />;
}
