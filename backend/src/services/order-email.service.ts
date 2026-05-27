import { google } from "googleapis";
import { render } from "@react-email/render";
import {
  GMAIL_USER,
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  GMAIL_REFRESH_TOKEN,
} from "../config/constants.js";
import type { IOrder } from "../models/order.model.js";
import { OrderConfirmationEmail } from "./order-confirmation-email.js";

function isConfigured(): boolean {
  return (
    GMAIL_USER !== undefined &&
    GMAIL_USER !== "" &&
    GMAIL_CLIENT_ID !== undefined &&
    GMAIL_CLIENT_ID !== "" &&
    GMAIL_CLIENT_SECRET !== undefined &&
    GMAIL_CLIENT_SECRET !== "" &&
    GMAIL_REFRESH_TOKEN !== undefined &&
    GMAIL_REFRESH_TOKEN !== ""
  );
}

function buildRawEmail(
  to: string,
  from: string,
  subject: string,
  html: string,
): string {
  const message = [
    `From: Season <${from}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=utf-8`,
    ``,
    html,
  ].join("\r\n");

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function getOrderEmailSubject(order: IOrder): string {
  return order.paymentMethod === "bank_transfer" || order.paymentStatus === "paid"
    ? `Payment received ${order._id.toString()}`
    : `Order confirmation ${order._id.toString()}`;
}

export async function sendOrderConfirmationEmail(order: IOrder): Promise<void> {
  if (!isConfigured()) {
    console.warn(
      "Skipping order confirmation email because Gmail OAuth2 config is not configured.",
    );
    return;
  }

  if (order.customerEmail === undefined || order.customerEmail.trim() === "") {
    console.warn(`Skipping order confirmation email for order ${order._id}`);
    return;
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      GMAIL_CLIENT_ID,
      GMAIL_CLIENT_SECRET,
    );

    oauth2Client.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN ?? null });
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const html = await render(OrderConfirmationEmail({ order }));

    const raw = buildRawEmail(
      order.customerEmail.trim(),
      GMAIL_USER!,
      getOrderEmailSubject(order),
      html,
    );

    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw },
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message.trim() !== ""
        ? error.message
        : "unknown Gmail API error";

    throw new Error(
      `Failed to send order confirmation email for order ${order._id.toString()}: ${message}`,
    );
  }
}
