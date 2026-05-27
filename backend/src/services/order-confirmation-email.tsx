import * as React from "react";
import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import type { IOrder } from "../models/order.model.js";

type OrderConfirmationEmailProps = {
  order: IOrder;
};

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
    .filter(
      (value): value is string => value !== undefined && value.trim() !== "",
    )
    .join(", ");
}

function isPaidOrder(order: IOrder): boolean {
  return order.paymentMethod === "bank_transfer" || order.paymentStatus === "paid";
}

function getPreviewText(order: IOrder): string {
  return isPaidOrder(order)
    ? `Payment received for order ${order._id.toString()}`
    : `Order ${order._id.toString()} has been confirmed`;
}

function getPaymentHeading(order: IOrder): string {
  return isPaidOrder(order) ? "Payment received" : "Payment";
}

function getPaymentDescription(order: IOrder): string {
  return isPaidOrder(order)
    ? "Paid via PayOS QR payment. Your payment has been confirmed successfully."
    : "Cash on delivery (COD). We will contact you to confirm before delivery.";
}

export function OrderConfirmationEmail({
  order,
}: OrderConfirmationEmailProps): React.JSX.Element {
  const previewText = getPreviewText(order);

  return (
    <Html lang="en">
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="m-0 bg-[#f8f6f1] text-[#111111] font-[Afacad,Arial_Narrow,Helvetica_Neue,Arial,sans-serif]">
          <Container className="mx-auto max-w-192 px-5 py-8">
            <Section className="border border-[#d8d3cc] bg-white px-7 py-8">
              <Text className="m-0 text-[13px] font-semibold uppercase tracking-[0.18em] text-black/45">
                Order Success
              </Text>
              <Heading className="m-0 mt-4 font-[Afacad,Arial_Narrow,Helvetica_Neue,Arial,sans-serif] text-[34px] font-bold uppercase leading-[1.08] text-[#111111]">
                Thank you for your order
              </Heading>
              <Text className="m-0 mt-4 text-[17px] leading-[1.6] text-black/70">
                Your order number is <strong>{order._id.toString()}</strong>.
              </Text>

              <Hr className="my-6 border-[#e4dfd8]" />

              <Row>
                <Column className="w-1/2 pr-3 align-top">
                  <Text className="m-0 text-[15px] font-bold uppercase tracking-[0.08em] text-[#111111]">
                    Contact information
                  </Text>
                  <Text className="m-0 mt-3 text-[15px] leading-[1.6] text-black/65">
                    {order.customerEmail ?? ""}
                  </Text>
                  <Text className="m-0 mt-1 text-[15px] leading-[1.6] text-black/65">
                    {order.shippingAddress.phone}
                  </Text>
                </Column>

                <Column className="w-1/2 pl-3 align-top">
                  <Text className="m-0 text-[15px] font-bold uppercase tracking-[0.08em] text-[#111111]">
                    Delivery
                  </Text>
                  <Text className="m-0 mt-3 text-[15px] leading-[1.6] text-black/65">
                    {order.shippingAddress.recipientName}
                  </Text>
                  <Text className="m-0 mt-1 text-[15px] leading-[1.6] text-black/65">
                    {formatAddress(order)}
                  </Text>
                </Column>
              </Row>

              <Hr className="my-6 border-[#e4dfd8]" />

              <Section>
                <Text className="m-0 text-[15px] font-bold uppercase tracking-[0.08em] text-[#111111]">
                  {getPaymentHeading(order)}
                </Text>
                <Text className="m-0 mt-3 text-[15px] leading-[1.6] text-black/65">
                  {getPaymentDescription(order)}
                </Text>
              </Section>
            </Section>

            <Section className="h-4" />

            <Section className="border border-[#d8d3cc] bg-[#f1f0ee] px-5 py-6">
              <Text className="m-0 mb-5 text-[16px] font-bold uppercase tracking-[0.08em] text-[#111111]">
                Order summary
              </Text>

              {order.items.map((item, index) => (
                <Section
                  key={`${item.productId?.toString?.() ?? item.variantSku}-${index}`}
                >
                  <Row>
                    <Column className="w-19 align-top">
                      {item.imageUrl !== undefined &&
                      item.imageUrl.trim() !== "" ? (
                        <Section className="h-16 w-16 border border-[#ded9d2] bg-white">
                          <Img
                            alt={item.productName}
                            src={item.imageUrl}
                            width="64"
                            height="64"
                            className="h-16 w-16 object-contain object-center"
                          />
                        </Section>
                      ) : (
                        <Section className="h-16 w-16 border border-[#ded9d2] bg-[#f3f0eb] text-center">
                          <Text className="m-0 pt-6.25 text-[10px] font-bold uppercase tracking-[0.16em] text-black/40">
                            Season
                          </Text>
                        </Section>
                      )}
                    </Column>

                    <Column className="align-top pr-3">
                      <Text className="m-0 text-[13px] font-bold uppercase leading-[1.3] tracking-[0.04em] text-[#111111]">
                        {item.productName}
                      </Text>
                      <Text className="m-0 mt-1.5 text-[12px] leading-normal text-black/55">
                        {item.variantSku} · Qty {item.quantity}
                      </Text>
                    </Column>

                    <Column className="w-27.5 align-top">
                      <Text className="m-0 text-right text-[13px] font-bold text-[#111111]">
                        {formatVnd(item.lineTotal)}
                      </Text>
                    </Column>
                  </Row>
                  <Section className="h-4" />
                </Section>
              ))}

              <Hr className="mb-4.5 mt-2 border-[#e4dfd8]" />

              <Row>
                <Column>
                  <Text className="m-0 text-[14px] text-[#111111]">
                    Subtotal
                  </Text>
                </Column>
                <Column>
                  <Text className="m-0 text-right text-[14px] text-[#111111]">
                    {formatVnd(order.subtotalAmount)}
                  </Text>
                </Column>
              </Row>

              <Row>
                <Column>
                  <Text className="m-0 mt-2 text-[14px] text-[#111111]">
                    Shipping
                  </Text>
                </Column>
                <Column>
                  <Text className="m-0 mt-2 text-right text-[14px] text-[#111111]">
                    {formatVnd(order.shippingFee)}
                  </Text>
                </Column>
              </Row>

              <Hr className="mb-3.5 mt-4 border-[#e4dfd8]" />

              <Row>
                <Column>
                  <Text className="m-0 text-[20px] font-bold text-[#111111]">
                    Total
                  </Text>
                </Column>
                <Column>
                  <Text className="m-0 text-right text-[20px] font-bold text-[#111111]">
                    {formatVnd(order.totalAmount)}
                  </Text>
                </Column>
              </Row>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
