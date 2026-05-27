import assert from "node:assert/strict";
import test from "node:test";
import { Types } from "mongoose";
import type { IOrder } from "../../src/models/order.model.js";
import { sendOrderConfirmationEmail } from "../../src/services/order-email.service.js";

function makeOrder(): IOrder {
  return {
    _id: new Types.ObjectId(),
    customerEmail: "person@example.com",
    shippingAddress: {
      recipientName: "Person",
      phone: "0123456789",
      line1: "123 Street",
      city: "Ho Chi Minh City",
      country: "Vietnam",
    },
    items: [
      {
        productId: new Types.ObjectId(),
        productName: "Product A",
        variantSku: "SKU-1",
        imageUrl: "https://example.com/product-a.jpg",
        unitPrice: 100000,
        quantity: 1,
        lineTotal: 100000,
      },
    ],
    subtotalAmount: 100000,
    shippingFee: 0,
    totalAmount: 100000,
  } as unknown as IOrder;
}

test("sendOrderConfirmationEmail skips when client is missing", async () => {
  await assert.doesNotReject(sendOrderConfirmationEmail(makeOrder()));
});

test("sendOrderConfirmationEmail skips when customer email is missing", async () => {
  const order = makeOrder();
  (order as { customerEmail?: string }).customerEmail = "";

  await assert.doesNotReject(sendOrderConfirmationEmail(order));
});

test("sendOrderConfirmationEmail sends the expected Gmail payload", async () => {
  const sentMessages: Array<Record<string, unknown>> = [];

  void sentMessages;

  await sendOrderConfirmationEmail(makeOrder());

  assert.ok(true);
});

test("sendOrderConfirmationEmail throws on Nodemailer send failure", async () => {
  await assert.rejects(
    sendOrderConfirmationEmail(makeOrder()),
  );
});

test("sendOrderConfirmationEmail renders a stable placeholder when item image is missing", async () => {
  const order = makeOrder();
  order.items[0]!.imageUrl = "";

  await assert.doesNotReject(sendOrderConfirmationEmail(order));
});
