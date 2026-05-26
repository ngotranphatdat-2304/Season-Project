import { CheckoutPage } from "@/components/checkout/checkout-page";

type CheckoutTokenPageProps = {
  params: Promise<{ token: string }>;
};

export default async function CheckoutTokenPage({
  params,
}: CheckoutTokenPageProps) {
  const { token } = await params;

  return <CheckoutPage token={token} />;
}
