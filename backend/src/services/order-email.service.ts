import { Resend } from "resend";
import {
  RESEND_API_KEY,
  RESEND_FROM_EMAIL,
} from "../config/constants.js";
import type { IOrder } from "../models/order.model.js";

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (RESEND_API_KEY === undefined || RESEND_API_KEY.trim() === "") {
    return null;
  }

  resendClient ??= new Resend(RESEND_API_KEY);
  return resendClient;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatVnd(amount: number): string {
  return `${amount.toLocaleString("vi-VN")} VND`;
}

function formatAddress(order: IOrder): string {
  const address = order.shippingAddress;

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

function buildOrderConfirmationHtml(order: IOrder): string {
  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;">${escapeHtml(item.productName)}<br><span style="color:#666;">SKU ${escapeHtml(item.variantSku)}</span></td>
          <td style="padding:8px 0;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 0;text-align:right;">${formatVnd(item.lineTotal)}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;color:#111;line-height:1.5;">
      <h1>Cảm ơn ${escapeHtml(order.shippingAddress.recipientName)}</h1>
      <p>Đơn hàng của bạn đã được ghi nhận. Bạn sẽ thanh toán khi nhận hàng.</p>
      <p><strong>Mã đơn hàng:</strong> ${escapeHtml(order._id.toString())}</p>
      <p><strong>Người nhận:</strong> ${escapeHtml(order.shippingAddress.recipientName)}</p>
      <p><strong>Số điện thoại:</strong> ${escapeHtml(order.shippingAddress.phone)}</p>
      <p><strong>Địa chỉ giao hàng:</strong> ${escapeHtml(formatAddress(order))}</p>
      <table style="width:100%;border-collapse:collapse;border-top:1px solid #ddd;border-bottom:1px solid #ddd;margin-top:20px;">
        <thead>
          <tr>
            <th style="padding:8px 0;text-align:left;">Sản phẩm</th>
            <th style="padding:8px 0;text-align:center;">SL</th>
            <th style="padding:8px 0;text-align:right;">Tổng</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p><strong>Tạm tính:</strong> ${formatVnd(order.subtotalAmount)}</p>
      <p><strong>Vận chuyển:</strong> ${formatVnd(order.shippingFee)}</p>
      <p><strong>Tổng cộng:</strong> ${formatVnd(order.totalAmount)}</p>
    </div>
  `;
}

export async function sendOrderConfirmationEmail(order: IOrder): Promise<void> {
  const resend = getResendClient();

  if (resend === null) {
    console.warn(
      "Skipping order confirmation email because RESEND_API_KEY is not configured.",
    );
    return;
  }

  if (order.customerEmail === undefined || order.customerEmail.trim() === "") {
    console.warn(`Skipping order confirmation email for order ${order._id}`);
    return;
  }

  await resend.emails.send({
    from: RESEND_FROM_EMAIL,
    to: order.customerEmail,
    subject: `Xác nhận đơn hàng ${order._id.toString()}`,
    html: buildOrderConfirmationHtml(order),
  });
}
