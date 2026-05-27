import { PayOS, type Webhook } from "@payos/node";
import {
  BACKEND_PUBLIC_BASE_URL,
  FRONTEND_PUBLIC_BASE_URL,
  PAYOS_API_KEY,
  PAYOS_CHECKSUM_KEY,
  PAYOS_CLIENT_ID,
  PAYOS_FIXED_QR_AMOUNT,
  PAYOS_WEBHOOK_PATH,
} from "../config/constants.js";
import { CheckoutSessionServiceError } from "./checkout-session.service.js";

type PayOSOrderItem = {
  name: string;
  quantity: number;
  price: number;
};

type CreatePayOSPaymentInput = {
  orderCode: number;
  orderId: string;
  token: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
};

type PayOSPaymentStatus =
  | "PENDING"
  | "PAID"
  | "CANCELLED"
  | "FAILED"
  | "EXPIRED"
  | "PROCESSING"
  | "UNDERPAID";

let payosClient: InstanceType<typeof PayOS> | null | undefined;

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function isPayOSConfigured(): boolean {
  return (
    typeof PAYOS_CLIENT_ID === "string" &&
    PAYOS_CLIENT_ID !== "" &&
    typeof PAYOS_API_KEY === "string" &&
    PAYOS_API_KEY !== "" &&
    typeof PAYOS_CHECKSUM_KEY === "string" &&
    PAYOS_CHECKSUM_KEY !== "" &&
    typeof FRONTEND_PUBLIC_BASE_URL === "string" &&
    FRONTEND_PUBLIC_BASE_URL !== "" &&
    typeof BACKEND_PUBLIC_BASE_URL === "string" &&
    BACKEND_PUBLIC_BASE_URL !== ""
  );
}

function getPayOSClient(): InstanceType<typeof PayOS> {
  if (payosClient !== undefined) {
    if (payosClient === null) {
      throw new CheckoutSessionServiceError(
        "PayOS is not configured for QR payments",
        503,
      );
    }

    return payosClient;
  }

  if (isPayOSConfigured() === false) {
    payosClient = null;
    throw new CheckoutSessionServiceError(
      "PayOS is not configured for QR payments",
      503,
    );
  }

  payosClient = new PayOS({
    clientId: PAYOS_CLIENT_ID as string,
    apiKey: PAYOS_API_KEY as string,
    checksumKey: PAYOS_CHECKSUM_KEY as string,
  });

  return payosClient;
}

export function getPayOSWebhookUrl(): string {
  if (typeof BACKEND_PUBLIC_BASE_URL !== "string" || BACKEND_PUBLIC_BASE_URL === "") {
    throw new CheckoutSessionServiceError(
      "BACKEND_PUBLIC_BASE_URL is required for PayOS",
      503,
    );
  }

  return `${trimTrailingSlash(BACKEND_PUBLIC_BASE_URL)}${PAYOS_WEBHOOK_PATH}`;
}

function buildPaymentResultUrl(token: string, orderId: string): string {
  if (
    typeof FRONTEND_PUBLIC_BASE_URL !== "string" ||
    FRONTEND_PUBLIC_BASE_URL === ""
  ) {
    throw new CheckoutSessionServiceError(
      "FRONTEND_PUBLIC_BASE_URL is required for PayOS",
      503,
    );
  }

  const baseUrl = trimTrailingSlash(FRONTEND_PUBLIC_BASE_URL);
  const query = new URLSearchParams({
    token,
    orderId,
  });

  return `${baseUrl}/checkout/payment-result?${query.toString()}`;
}

export async function createPayOSPaymentLink(input: CreatePayOSPaymentInput) {
  const client = getPayOSClient();
  const paymentResultUrl = buildPaymentResultUrl(input.token, input.orderId);

  return client.paymentRequests.create({
    orderCode: input.orderCode,
    amount: PAYOS_FIXED_QR_AMOUNT,
    description: "Thanh toan don hang",
    items: [
      {
        name: "Season QR payment",
        quantity: 1,
        price: PAYOS_FIXED_QR_AMOUNT,
      },
    ],
    buyerName: input.buyerName,
    buyerEmail: input.buyerEmail,
    buyerPhone: input.buyerPhone,
    returnUrl: paymentResultUrl,
    cancelUrl: paymentResultUrl,
  });
}

export async function getPayOSPaymentLink(orderCode: number) {
  const client = getPayOSClient();
  return client.paymentRequests.get(orderCode);
}

export async function cancelPayOSPaymentLink(
  orderCode: number,
  reason = "Checkout session could not be completed",
): Promise<void> {
  const client = getPayOSClient();
  await client.paymentRequests.cancel(orderCode, reason);
}

export function verifyPayOSWebhookPayload(payload: unknown) {
  const client = getPayOSClient();
  return client.webhooks.verify(payload as Webhook);
}

export function mapPayOSStatus(status: string | undefined): PayOSPaymentStatus {
  switch (status) {
    case "PAID":
    case "PENDING":
    case "CANCELLED":
    case "FAILED":
    case "EXPIRED":
    case "PROCESSING":
    case "UNDERPAID":
      return status;
    default:
      return "PENDING";
  }
}
