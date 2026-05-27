import nodemailer, { type Transporter } from "nodemailer";
import { render } from "@react-email/render";
import { GMAIL_APP_PASSWORD, GMAIL_USER } from "../config/constants.js";
import type { IOrder } from "../models/order.model.js";
import { OrderConfirmationEmail } from "./order-confirmation-email.js";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (
    GMAIL_USER === undefined ||
    GMAIL_USER === "" ||
    GMAIL_APP_PASSWORD === undefined ||
    GMAIL_APP_PASSWORD === ""
  ) {
    return null;
  }

  transporter ??= nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    family: 4,
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  } as nodemailer.TransportOptions);

  return transporter;
}

export async function sendOrderConfirmationEmail(
  order: IOrder,
  mailTransporter: Transporter | null = getTransporter(),
): Promise<void> {
  if (mailTransporter === null) {
    console.warn(
      "Skipping order confirmation email because Gmail mail config is not configured.",
    );
    return;
  }

  if (order.customerEmail === undefined || order.customerEmail.trim() === "") {
    console.warn(`Skipping order confirmation email for order ${order._id}`);
    return;
  }

  if (GMAIL_USER === undefined || GMAIL_USER === "") {
    throw new Error(
      `Failed to send order confirmation email for order ${order._id.toString()}: GMAIL_USER is not configured`,
    );
  }

  try {
    const html = await render(
      OrderConfirmationEmail({ order }),
    );

    await mailTransporter.sendMail({
      from: `Season <${GMAIL_USER}>`,
      to: order.customerEmail.trim(),
      subject: `Order confirmation ${order._id.toString()}`,
      html,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message.trim() !== ""
        ? error.message
        : "unknown mail transport error";

    throw new Error(
      `Failed to send order confirmation email for order ${order._id.toString()}: ${message}`,
    );
  }
}
