import { randomBytes } from "node:crypto";
import mongoose, { type ClientSession, Types } from "mongoose";
import { Cart, type ICartItem } from "../models/cart.model.js";
import {
  CheckoutSession,
  type ICheckoutSession,
  type ICheckoutSessionItemSnapshot,
} from "../models/checkout-session.model.js";
import {
  Order,
  type IOrder,
  type IOrderItem,
  type IShippingAddress,
} from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import type { IVariant, ProductAvailability } from "../types/product.types.js";
import type {
  CheckoutCompleteInput,
  CheckoutCompleteResponse,
  CheckoutInitResponse,
  CheckoutPaymentStatusResponse,
  CheckoutPayOSInitResponse,
  CheckoutSessionResponse,
  PaymentPendingCheckoutSessionResponse,
  PendingCheckoutSessionResponse,
} from "../types/checkout.types.js";
import {
  createPayOSPaymentLink,
  getPayOSPaymentLink,
  mapPayOSStatus,
  verifyPayOSWebhookPayload,
} from "./payos.service.js";
import { sendOrderConfirmationEmail } from "./order-email.service.js";

interface CheckoutOwnerInput {
  guestId?: string;
}

interface CheckoutGuestQuery {
  guestId: string;
}

interface CheckoutProduct {
  _id: Types.ObjectId;
  name: string;
  availability: ProductAvailability;
  isActive: boolean;
  variants: IVariant[];
}

const CHECKOUT_TOKEN_BYTES = 12;
const CHECKOUT_SESSION_TTL_HOURS = 24;
const SHIPPING_FEE = 0;
const CURRENCY = "VND";
const EMPTY_CART_MESSAGE = "Giỏ hàng của bạn đang trống";
const UNAVAILABLE_CART_MESSAGE = "Một số sản phẩm không còn khả dụng";

export const payosGateway = {
  createPayOSPaymentLink,
  getPayOSPaymentLink,
  mapPayOSStatus,
  verifyPayOSWebhookPayload,
};

export class CheckoutSessionServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "CheckoutSessionServiceError";
    this.statusCode = statusCode;
  }
}

function createCheckoutToken(): string {
  return randomBytes(CHECKOUT_TOKEN_BYTES).toString("hex");
}

function checkoutExpiryDate(): Date {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + CHECKOUT_SESSION_TTL_HOURS);
  return expiresAt;
}

function requireGuestId(guestId: string | undefined): string {
  const trimmedGuestId = guestId?.trim() ?? "";

  if (trimmedGuestId === "") {
    throw new CheckoutSessionServiceError(EMPTY_CART_MESSAGE, 400);
  }

  return trimmedGuestId;
}

function resolveCheckoutCartQuery(
  owner: CheckoutOwnerInput,
): CheckoutGuestQuery {
  return { guestId: requireGuestId(owner.guestId) };
}

function resolveCheckoutOwnerQuery(
  owner: CheckoutOwnerInput,
): CheckoutGuestQuery | null {
  if (owner.guestId === undefined || owner.guestId.trim() === "") {
    return null;
  }

  return { guestId: owner.guestId.trim() };
}

function productKey(productId: Types.ObjectId): string {
  return productId.toString();
}

function requireVariant(product: CheckoutProduct, item: ICartItem): IVariant {
  if (product.isActive !== true || product.availability !== "in_stock") {
    throw new CheckoutSessionServiceError(
      `${product.name} không còn khả dụng`,
      409,
    );
  }

  const variant = product.variants.find(
    (candidate) => candidate.sku === item.variantSku,
  );

  if (variant === undefined) {
    throw new CheckoutSessionServiceError(
      `${product.name} không còn phiên bản này`,
      409,
    );
  }

  if (variant.stock < item.quantity) {
    throw new CheckoutSessionServiceError(
      `${product.name} không đủ số lượng trong kho`,
      409,
    );
  }

  return variant;
}

async function findCheckoutProducts(
  items: ICartItem[],
): Promise<Map<string, CheckoutProduct>> {
  const productIds = [...new Set(items.map((item) => item.productId))];

  const products = await Product.find({ _id: { $in: productIds } })
    .select("name availability isActive variants")
    .lean<CheckoutProduct[]>();

  return new Map(
    products.map((product) => [productKey(product._id), product] as const),
  );
}

async function findSnapshotProducts(
  items: ICheckoutSessionItemSnapshot[],
  session: ClientSession,
): Promise<Map<string, CheckoutProduct>> {
  const productIds = [
    ...new Set(items.map((item) => new Types.ObjectId(item.productId))),
  ];

  const products = await Product.find({ _id: { $in: productIds } })
    .select("name availability isActive variants")
    .session(session)
    .lean<CheckoutProduct[]>();

  return new Map(
    products.map((product) => [productKey(product._id), product] as const),
  );
}

function buildSnapshotItem(
  item: ICartItem,
  product: CheckoutProduct,
  variant: IVariant,
): ICheckoutSessionItemSnapshot {
  const lineTotal = item.quantity * variant.price;

  return {
    productId: product._id.toString(),
    productName: product.name,
    variantSku: item.variantSku,
    ...(variant.color === undefined || variant.color.trim() === ""
      ? {}
      : { variantColor: variant.color }),
    imageUrl: variant.images[0] ?? "",
    unitPrice: variant.price,
    quantity: item.quantity,
    lineTotal,
  };
}

async function buildSessionSnapshot(
  cartItems: ICartItem[],
): Promise<ICheckoutSessionItemSnapshot[]> {
  const productMap = await findCheckoutProducts(cartItems);

  return cartItems.map((item) => {
    const product = productMap.get(item.productId.toString());

    if (product === undefined) {
      throw new CheckoutSessionServiceError(UNAVAILABLE_CART_MESSAGE, 409);
    }

    return buildSnapshotItem(item, product, requireVariant(product, item));
  });
}

function toPendingCheckoutResponse(
  session: ICheckoutSession,
): PendingCheckoutSessionResponse {
  return {
    status: "pending",
    token: session.token,
    items: session.itemsSnapshot.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      variantSku: item.variantSku,
      ...(item.variantColor === undefined
        ? {}
        : { variantColor: item.variantColor }),
      imageUrl: item.imageUrl,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
    itemCount: session.itemsSnapshot.reduce(
      (itemCount, item) => itemCount + item.quantity,
      0,
    ),
    subtotalAmount: session.subtotalAmount,
    shippingFee: session.shippingFee,
    totalAmount: session.totalAmount,
    currency: session.currency,
    expiresAt: session.expiresAt.toISOString(),
  };
}

function toPaymentPendingCheckoutResponse(
  order: IOrder,
): PaymentPendingCheckoutSessionResponse {
  return {
    status: "payment_pending",
    redirectTo: `/checkout/payment-result?token=${encodeURIComponent(order.checkoutToken ?? "")}&orderId=${encodeURIComponent(order._id.toString())}`,
  };
}

function toSessionItems(
  items: ICheckoutSessionItemSnapshot[],
): ICheckoutSessionItemSnapshot[] {
  return items.map((item) => ({
    productId: item.productId,
    productName: item.productName,
    variantSku: item.variantSku,
    ...(item.variantColor === undefined
      ? {}
      : { variantColor: item.variantColor }),
    imageUrl: item.imageUrl,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    lineTotal: item.lineTotal,
  }));
}

function toCompletedCheckoutResponse(
  checkoutSession: ICheckoutSession,
  order: IOrder,
) {
  const completedToken = checkoutSession.token;

  return {
    status: "completed" as const,
    redirectTo: `/order/success/${completedToken}`,
    order: {
      orderId: order._id.toString(),
      customerEmail: order.customerEmail ?? "",
      ...(order.paymentMethod === undefined
        ? {}
        : { paymentMethod: order.paymentMethod }),
      shippingAddress: order.shippingAddress,
      items: toSessionItems(checkoutSession.itemsSnapshot),
      subtotalAmount: order.subtotalAmount,
      shippingFee: order.shippingFee,
      totalAmount: order.totalAmount,
      currency: order.currency,
    },
  };
}

function getVariantForSnapshotItem(
  product: CheckoutProduct,
  item: ICheckoutSessionItemSnapshot,
): IVariant {
  if (product.isActive !== true || product.availability !== "in_stock") {
    throw new CheckoutSessionServiceError(
      `${product.name} không còn khả dụng`,
      409,
    );
  }

  const variant = product.variants.find(
    (candidate) => candidate.sku === item.variantSku,
  );

  if (variant === undefined) {
    throw new CheckoutSessionServiceError(
      `${product.name} không còn phiên bản này`,
      409,
    );
  }

  if (variant.stock < item.quantity) {
    throw new CheckoutSessionServiceError(`${product.name} không đủ hàng`, 409);
  }

  return variant;
}

async function revalidateSnapshotStock(
  items: ICheckoutSessionItemSnapshot[],
  session: ClientSession,
): Promise<Map<string, CheckoutProduct>> {
  const productMap = await findSnapshotProducts(items, session);

  for (const item of items) {
    const product = productMap.get(item.productId);

    if (product === undefined) {
      throw new CheckoutSessionServiceError(UNAVAILABLE_CART_MESSAGE, 409);
    }

    getVariantForSnapshotItem(product, item);
  }

  return productMap;
}

// FIX: Thay vì N lần updateOne + N lần recalculate (loop tuần tự),
// dùng bulkWrite để gửi tất cả stock decrements trong 1 round trip,
// sau đó recalculate availability song song với Promise.all.
async function decrementSnapshotStock(
  items: ICheckoutSessionItemSnapshot[],
  productMap: Map<string, CheckoutProduct>,
  session: ClientSession,
): Promise<void> {
  // Build tất cả update operations
  const bulkOps = items.map((item) => {
    const product = productMap.get(item.productId);

    if (product === undefined) {
      throw new CheckoutSessionServiceError(UNAVAILABLE_CART_MESSAGE, 409);
    }

    return {
      updateOne: {
        filter: {
          _id: product._id,
          isActive: true,
          availability: "in_stock",
          variants: {
            $elemMatch: {
              sku: item.variantSku,
              stock: { $gte: item.quantity },
            },
          },
        },
        update: { $inc: { "variants.$.stock": -item.quantity } },
      },
    };
  });

  // 1 round trip thay vì N round trips
  const bulkResult = await Product.bulkWrite(bulkOps, { session });

  if (bulkResult.modifiedCount !== items.length) {
    throw new CheckoutSessionServiceError("Một số sản phẩm không đủ hàng", 409);
  }

  // Recalculate availability song song cho tất cả products
  const uniqueProductIds = [
    ...new Map(
      items.map((item) => {
        const product = productMap.get(item.productId)!;
        return [product._id.toString(), product._id];
      }),
    ).values(),
  ];

  await Promise.all(
    uniqueProductIds.map((productId) =>
      recalculateProductAvailability(productId, session),
    ),
  );
}

async function recalculateProductAvailability(
  productId: Types.ObjectId,
  session: ClientSession,
): Promise<void> {
  const product = await Product.findById(productId)
    .select("availability variants")
    .session(session);

  if (product === null) {
    throw new CheckoutSessionServiceError(UNAVAILABLE_CART_MESSAGE, 409);
  }

  const totalStock = product.variants.reduce(
    (sum, variant) => sum + variant.stock,
    0,
  );

  product.availability = totalStock > 0 ? "in_stock" : "out_of_stock";
  await product.save({ session });
}

function toOrderItems(items: ICheckoutSessionItemSnapshot[]): IOrderItem[] {
  return items.map((item) => ({
    productId: new Types.ObjectId(item.productId),
    productName: item.productName,
    variantSku: item.variantSku,
    imageUrl: item.imageUrl,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
  }));
}

function normalizeShippingAddress(address: IShippingAddress): IShippingAddress {
  return {
    recipientName: address.recipientName,
    phone: address.phone,
    line1: address.line1,
    ...(address.line2 === undefined ? {} : { line2: address.line2 }),
    ...(address.ward === undefined ? {} : { ward: address.ward }),
    ...(address.district === undefined ? {} : { district: address.district }),
    city: address.city,
    ...(address.province === undefined ? {} : { province: address.province }),
    ...(address.postalCode === undefined
      ? {}
      : { postalCode: address.postalCode }),
    country: address.country,
  };
}

async function releaseCancelledCheckoutToken(
  checkoutToken: string,
  ownerQuery: CheckoutGuestQuery,
  session: ClientSession,
): Promise<void> {
  await Order.updateMany(
    {
      checkoutToken,
      ...ownerQuery,
      status: "cancelled",
    },
    {
      $unset: {
        checkoutToken: 1,
      },
    },
    { session },
  );
}

function generatePayOSOrderCode(): number {
  return Date.now() * 100 + Math.floor(Math.random() * 100);
}

async function restoreSnapshotStock(
  items: ICheckoutSessionItemSnapshot[],
  session: ClientSession,
): Promise<void> {
  const bulkOps = items.map((item) => ({
    updateOne: {
      filter: {
        _id: new Types.ObjectId(item.productId),
        "variants.sku": item.variantSku,
      },
      update: {
        $inc: { "variants.$.stock": item.quantity },
      },
    },
  }));

  if (bulkOps.length > 0) {
    await Product.bulkWrite(bulkOps, { session });
  }

  const uniqueProductIds = [
    ...new Set(items.map((item) => item.productId)),
  ].map((productId) => new Types.ObjectId(productId));

  await Promise.all(
    uniqueProductIds.map((productId) =>
      recalculateProductAvailability(productId, session),
    ),
  );
}

async function restoreGuestCartFromSnapshot(
  guestId: string,
  items: ICheckoutSessionItemSnapshot[],
  session: ClientSession,
): Promise<void> {
  const cartItems = items.map((item) => ({
    productId: new Types.ObjectId(item.productId),
    variantSku: item.variantSku,
    quantity: item.quantity,
  }));

  await Cart.updateOne(
    { guestId },
    { $set: { items: cartItems } },
    { upsert: true, session },
  );
}

async function finalizePaidOrder(
  order: IOrder,
  checkoutSession: ICheckoutSession,
  session: ClientSession,
): Promise<void> {
  let didChange = false;

  if (order.paymentStatus !== "paid") {
    order.paymentStatus = "paid";
    didChange = true;
  }

  if (checkoutSession.status !== "completed") {
    checkoutSession.status = "completed";
    didChange = true;
  }

  if (didChange === false) {
    return;
  }

  await order.save({ session });
  await checkoutSession.save({ session });
}

async function revertPendingQrOrder(
  order: IOrder,
  checkoutSession: ICheckoutSession,
  session: ClientSession,
): Promise<void> {
  if (checkoutSession.guestId === undefined || checkoutSession.guestId.trim() === "") {
    throw new CheckoutSessionServiceError("Phiên thanh toán đã hết hạn", 404);
  }

  if (order.status === "cancelled" && checkoutSession.status === "pending") {
    return;
  }

  await restoreSnapshotStock(checkoutSession.itemsSnapshot, session);
  await restoreGuestCartFromSnapshot(
    checkoutSession.guestId,
    checkoutSession.itemsSnapshot,
    session,
  );

  order.status = "cancelled";
  order.paymentStatus = "failed";
  order.cancelledAt = new Date();
  checkoutSession.status = "pending";

  await order.save({ session });
  await checkoutSession.save({ session });
}

function mapCheckoutPaymentStatus(
  payosStatus: ReturnType<typeof mapPayOSStatus>,
): CheckoutPaymentStatusResponse["status"] {
  switch (payosStatus) {
    case "PAID":
      return "paid";
    case "CANCELLED":
      return "cancelled";
    case "FAILED":
      return "failed";
    case "EXPIRED":
      return "expired";
    default:
      return "pending";
  }
}

async function syncQrOrderStateByOrder(
  order: IOrder,
  checkoutSession: ICheckoutSession,
): Promise<CheckoutPaymentStatusResponse> {
  if (order.payosOrderCode === undefined) {
    throw new CheckoutSessionServiceError("QR payment is missing PayOS data", 409);
  }

  const paymentLink = await payosGateway.getPayOSPaymentLink(order.payosOrderCode);
  const payosStatus = payosGateway.mapPayOSStatus(paymentLink.status);
  const transactionSession = await mongoose.startSession();
  const shouldSendConfirmationEmail =
    payosStatus === "PAID" && order.paymentStatus !== "paid";

  try {
    await transactionSession.withTransaction(async () => {
      const freshOrder = await Order.findById(order._id).session(transactionSession);
      const freshCheckoutSession = await CheckoutSession.findById(checkoutSession._id).session(
        transactionSession,
      );

      if (freshOrder === null || freshCheckoutSession === null) {
        throw new CheckoutSessionServiceError("Đơn hàng không tồn tại", 404);
      }

      if (payosStatus === "PAID") {
        await finalizePaidOrder(freshOrder, freshCheckoutSession, transactionSession);
        order.paymentStatus = "paid";
        checkoutSession.status = "completed";
        return;
      }

      if (
        payosStatus === "CANCELLED" ||
        payosStatus === "FAILED" ||
        payosStatus === "EXPIRED"
      ) {
        await revertPendingQrOrder(
          freshOrder,
          freshCheckoutSession,
          transactionSession,
        );
        order.status = "cancelled";
        order.paymentStatus = "failed";
        checkoutSession.status = "pending";
      }
    });
  } finally {
    await transactionSession.endSession();
  }

  const status = mapCheckoutPaymentStatus(payosStatus);
  const orderId = order._id.toString();
  const token = checkoutSession.token;

  if (shouldSendConfirmationEmail === true) {
    const paidOrder = await Order.findById(order._id);

    if (paidOrder !== null) {
      sendOrderConfirmationEmail(paidOrder).catch((error) => {
        console.error("Failed to send order confirmation email:", error);
      });
    }
  }

  return {
    status,
    orderId,
    token,
    ...(status === "paid"
      ? { redirectTo: `/order/success/${encodeURIComponent(token)}` }
      : {}),
    ...(status === "cancelled"
      ? { message: "Thanh toán đã bị hủy. Bạn có thể quay lại checkout." }
      : status === "failed"
        ? { message: "Thanh toán không thành công. Vui lòng thử lại." }
        : status === "expired"
          ? { message: "Liên kết thanh toán đã hết hạn. Vui lòng thử lại." }
          : { message: "Thanh toán đang được xử lý." }),
  };
}

function isRetryableTransactionError(error: unknown): boolean {
  if (error instanceof CheckoutSessionServiceError) return false;
  if (typeof error !== "object" || error === null) return false;

  const mongoError = error as {
    code?: unknown;
    codeName?: unknown;
    errorLabels?: unknown;
    hasErrorLabel?: (label: string) => boolean;
  };

  return (
    mongoError.code === 112 ||
    mongoError.codeName === "WriteConflict" ||
    mongoError.codeName === "TemporarilyUnavailable" ||
    (typeof mongoError.hasErrorLabel === "function" &&
      (mongoError.hasErrorLabel("TransientTransactionError") === true ||
        mongoError.hasErrorLabel("UnknownTransactionCommitResult") === true)) ||
    (Array.isArray(mongoError.errorLabels) &&
      (mongoError.errorLabels.includes("TransientTransactionError") ||
        mongoError.errorLabels.includes("UnknownTransactionCommitResult")))
  );
}

export async function createCheckoutSession(
  owner: CheckoutOwnerInput,
): Promise<CheckoutInitResponse> {
  const cartQuery = resolveCheckoutCartQuery(owner);
  const cart = await Cart.findOne(cartQuery);

  if (cart === null || cart.items.length === 0) {
    throw new CheckoutSessionServiceError(EMPTY_CART_MESSAGE, 400);
  }

  const itemsSnapshot = await buildSessionSnapshot(cart.items);
  const subtotalAmount = itemsSnapshot.reduce(
    (total, item) => total + item.lineTotal,
    0,
  );
  const totalAmount = subtotalAmount + SHIPPING_FEE;
  const checkoutSessionPayload = {
    token: createCheckoutToken(),
    guestId: cartQuery.guestId,
    status: "pending",
    itemsSnapshot,
    subtotalAmount,
    shippingFee: SHIPPING_FEE,
    totalAmount,
    currency: CURRENCY,
    expiresAt: checkoutExpiryDate(),
  };
  const checkoutSession = (await CheckoutSession.create(
    checkoutSessionPayload,
  )) as ICheckoutSession;

  return { token: checkoutSession.token };
}

export async function getCheckoutSessionByToken(
  token: string,
  owner: CheckoutOwnerInput = {},
): Promise<CheckoutSessionResponse> {
  const normalizedToken = token.trim();

  if (normalizedToken === "") {
    throw new CheckoutSessionServiceError("Phiên thanh toán đã hết hạn", 404);
  }

  const ownerQuery = resolveCheckoutOwnerQuery(owner);

  if (ownerQuery === null) {
    throw new CheckoutSessionServiceError("Phiên thanh toán đã hết hạn", 404);
  }

  const checkoutSession = await CheckoutSession.findOne({
    token: normalizedToken,
    ...ownerQuery,
    expiresAt: { $gt: new Date() },
  });

  if (checkoutSession === null) {
    throw new CheckoutSessionServiceError("Phiên thanh toán đã hết hạn", 404);
  }

  if (checkoutSession.status === "completed") {
    const order = await Order.findOne({
      checkoutToken: checkoutSession.token,
      ...ownerQuery,
    });

    if (order === null) {
      throw new CheckoutSessionServiceError("Đơn hàng không tồn tại", 404);
    }

    return toCompletedCheckoutResponse(checkoutSession, order);
  }

  if (checkoutSession.status === "payment_pending") {
    const order = await Order.findOne({
      checkoutToken: checkoutSession.token,
      ...ownerQuery,
    });

    if (order === null) {
      throw new CheckoutSessionServiceError("Đơn hàng không tồn tại", 404);
    }

    return toPaymentPendingCheckoutResponse(order);
  }

  return toPendingCheckoutResponse(checkoutSession);
}

export async function completeCheckoutSession(
  token: string,
  owner: CheckoutOwnerInput,
  input: CheckoutCompleteInput,
): Promise<CheckoutCompleteResponse> {
  const normalizedToken = token.trim();
  const ownerQuery = resolveCheckoutOwnerQuery(owner);

  if (normalizedToken === "" || ownerQuery === null) {
    throw new CheckoutSessionServiceError("Phiên thanh toán đã hết hạn", 404);
  }

  const transactionSession = await mongoose.startSession();
  let createdOrder: IOrder | null = null;

  try {
    try {
      await transactionSession.withTransaction(async () => {
        const checkoutSession = await CheckoutSession.findOne({
          token: normalizedToken,
          ...ownerQuery,
          expiresAt: { $gt: new Date() },
        }).session(transactionSession);

        if (checkoutSession === null) {
          throw new CheckoutSessionServiceError(
            "Phiên thanh toán đã hết hạn",
            404,
          );
        }

        if (checkoutSession.status === "completed") {
          throw new CheckoutSessionServiceError("Đơn hàng đã được đặt", 409);
        }

        const productMap = await revalidateSnapshotStock(
          checkoutSession.itemsSnapshot,
          transactionSession,
        );

        // FIX: bulkWrite thay vì N lần updateOne tuần tự
        await decrementSnapshotStock(
          checkoutSession.itemsSnapshot,
          productMap,
          transactionSession,
        );

        await releaseCancelledCheckoutToken(
          checkoutSession.token,
          ownerQuery,
          transactionSession,
        );

        const [order] = await Order.create(
          [
            {
              ...ownerQuery,
              customerEmail: input.customerEmail,
              checkoutToken: checkoutSession.token,
              items: toOrderItems(checkoutSession.itemsSnapshot),
              status: "pending",
              paymentStatus: "unpaid",
              paymentMethod: input.paymentMethod,
              shippingAddress: normalizeShippingAddress(input.shippingAddress),
              subtotalAmount: checkoutSession.subtotalAmount,
              discountAmount: 0,
              shippingFee: checkoutSession.shippingFee,
              taxAmount: 0,
              totalAmount: checkoutSession.totalAmount,
              currency: checkoutSession.currency,
            },
          ],
          { session: transactionSession },
        );

        if (order === undefined) {
          throw new CheckoutSessionServiceError("Failed to create order", 500);
        }

        await Cart.updateOne(
          ownerQuery,
          { $set: { items: [] } },
          { session: transactionSession },
        );

        checkoutSession.status = "completed";
        await checkoutSession.save({ session: transactionSession });
        createdOrder = order;
      });
    } catch (error) {
      if (isRetryableTransactionError(error) === true) {
        throw new CheckoutSessionServiceError(
          "Checkout conflicted with another stock update. Please retry.",
          409,
        );
      }

      throw error;
    }
  } finally {
    await transactionSession.endSession();
  }

  const completedOrder = createdOrder as IOrder | null;

  if (completedOrder === null) {
    throw new CheckoutSessionServiceError("Failed to create order", 500);
  }

  // FIX: Fire-and-forget — không await email, trả response ngay lập tức.
  // Email failure không nên block hay fail checkout.
  sendOrderConfirmationEmail(completedOrder).catch((error) => {
    console.error("Failed to send order confirmation email:", error);
  });

  return {
    orderId: completedOrder._id.toString(),
    token: normalizedToken,
  };
}

export async function createPayOSCheckoutSessionPayment(
  token: string,
  owner: CheckoutOwnerInput,
  input: CheckoutCompleteInput,
): Promise<CheckoutPayOSInitResponse> {
  const normalizedToken = token.trim();
  const ownerQuery = resolveCheckoutOwnerQuery(owner);

  if (normalizedToken === "" || ownerQuery === null) {
    throw new CheckoutSessionServiceError("Phiên thanh toán đã hết hạn", 404);
  }

  const transactionSession = await mongoose.startSession();
  let createdOrder: IOrder | null = null;

  try {
    await transactionSession.withTransaction(async () => {
      const checkoutSession = await CheckoutSession.findOne({
        token: normalizedToken,
        ...ownerQuery,
        expiresAt: { $gt: new Date() },
      }).session(transactionSession);

      if (checkoutSession === null) {
        throw new CheckoutSessionServiceError("Phiên thanh toán đã hết hạn", 404);
      }

      if (checkoutSession.status === "completed") {
        throw new CheckoutSessionServiceError("Đơn hàng đã được đặt", 409);
      }

      if (checkoutSession.status === "payment_pending") {
        const existingOrder = await Order.findOne({
          checkoutToken: checkoutSession.token,
          ...ownerQuery,
        }).session(transactionSession);

        if (existingOrder === null) {
          throw new CheckoutSessionServiceError("Đơn hàng không tồn tại", 404);
        }

        createdOrder = existingOrder;
        return;
      }

      const productMap = await revalidateSnapshotStock(
        checkoutSession.itemsSnapshot,
        transactionSession,
      );

      await decrementSnapshotStock(
        checkoutSession.itemsSnapshot,
        productMap,
        transactionSession,
      );

      await releaseCancelledCheckoutToken(
        checkoutSession.token,
        ownerQuery,
        transactionSession,
      );

      const payosOrderCode = generatePayOSOrderCode();

      const [order] = await Order.create(
        [
          {
            ...ownerQuery,
            customerEmail: input.customerEmail,
            checkoutToken: checkoutSession.token,
            items: toOrderItems(checkoutSession.itemsSnapshot),
            status: "pending",
            paymentStatus: "unpaid",
            paymentMethod: "bank_transfer",
            shippingAddress: normalizeShippingAddress(input.shippingAddress),
            subtotalAmount: checkoutSession.subtotalAmount,
            discountAmount: 0,
            shippingFee: checkoutSession.shippingFee,
            taxAmount: 0,
            totalAmount: checkoutSession.totalAmount,
            currency: checkoutSession.currency,
            payosOrderCode,
          },
        ],
        { session: transactionSession },
      );

      if (order === undefined) {
        throw new CheckoutSessionServiceError("Failed to create order", 500);
      }

      await Cart.updateOne(
        ownerQuery,
        { $set: { items: [] } },
        { session: transactionSession },
      );

      checkoutSession.status = "payment_pending";
      await checkoutSession.save({ session: transactionSession });
      createdOrder = order;
    });
  } finally {
    await transactionSession.endSession();
  }

  const qrOrder = createdOrder as IOrder | null;

  if (qrOrder === null) {
    throw new CheckoutSessionServiceError("Failed to create order", 500);
  }

  if (
    qrOrder.payosOrderCode !== undefined &&
    qrOrder.payosPaymentLinkId !== undefined &&
    qrOrder.payosPaymentLinkId.trim() !== ""
  ) {
    return {
      orderId: qrOrder._id.toString(),
      token: normalizedToken,
      checkoutUrl: `/checkout/payment-result?token=${encodeURIComponent(normalizedToken)}&orderId=${encodeURIComponent(qrOrder._id.toString())}`,
    };
  }

  if (qrOrder.payosOrderCode === undefined) {
    throw new CheckoutSessionServiceError("Failed to create PayOS order", 500);
  }

  try {
    const paymentLink = await payosGateway.createPayOSPaymentLink({
      orderCode: qrOrder.payosOrderCode as number,
      orderId: qrOrder._id.toString(),
      token: normalizedToken,
      buyerName: qrOrder.shippingAddress.recipientName,
      buyerEmail: qrOrder.customerEmail ?? "",
      buyerPhone: qrOrder.shippingAddress.phone,
    });

    qrOrder.payosPaymentLinkId = paymentLink.paymentLinkId;
    await qrOrder.save();

    return {
      orderId: qrOrder._id.toString(),
      token: normalizedToken,
      checkoutUrl: paymentLink.checkoutUrl,
    };
  } catch (error) {
    const rollbackSession = await mongoose.startSession();

    try {
      await rollbackSession.withTransaction(async () => {
        const freshOrder = await Order.findById(qrOrder._id).session(rollbackSession);
        const freshCheckoutSession = await CheckoutSession.findOne({
          token: normalizedToken,
          ...ownerQuery,
        }).session(rollbackSession);

        if (freshOrder === null || freshCheckoutSession === null) {
          return;
        }

        await revertPendingQrOrder(freshOrder, freshCheckoutSession, rollbackSession);
      });
    } finally {
      await rollbackSession.endSession();
    }

    throw error;
  }
}

export async function getCheckoutPaymentStatus(
  token: string,
  orderId: string,
  owner: CheckoutOwnerInput,
): Promise<CheckoutPaymentStatusResponse> {
  const normalizedToken = token.trim();
  const ownerQuery = resolveCheckoutOwnerQuery(owner);

  if (normalizedToken === "" || ownerQuery === null || orderId.trim() === "") {
    throw new CheckoutSessionServiceError("Phiên thanh toán đã hết hạn", 404);
  }

  const checkoutSession = await CheckoutSession.findOne({
    token: normalizedToken,
    ...ownerQuery,
  });

  if (checkoutSession === null) {
    throw new CheckoutSessionServiceError("Phiên thanh toán đã hết hạn", 404);
  }

  const order = await Order.findOne({
    _id: orderId,
    ...ownerQuery,
  });

  if (order === null) {
    throw new CheckoutSessionServiceError("Đơn hàng không tồn tại", 404);
  }

  if (checkoutSession.status === "completed" || order.paymentStatus === "paid") {
    return {
      status: "paid",
      orderId: order._id.toString(),
      token: normalizedToken,
      redirectTo: `/order/success/${encodeURIComponent(normalizedToken)}`,
    };
  }

  return syncQrOrderStateByOrder(order, checkoutSession);
}

export async function handlePayOSWebhook(
  payload: unknown,
): Promise<{ success: true }> {
  const data = await payosGateway.verifyPayOSWebhookPayload(payload);
  const orderCode =
    typeof data.orderCode === "number" ? data.orderCode : Number(data.orderCode);

  if (Number.isFinite(orderCode) === false) {
    throw new CheckoutSessionServiceError("Invalid PayOS webhook payload", 400);
  }

  const order = await Order.findOne({ payosOrderCode: orderCode });

  if (order === null || order.checkoutToken === undefined || order.guestId === undefined) {
    return { success: true };
  }

  const checkoutSession = await CheckoutSession.findOne({
    token: order.checkoutToken,
    guestId: order.guestId,
  });

  if (checkoutSession === null) {
    return { success: true };
  }

  await syncQrOrderStateByOrder(order, checkoutSession);
  return { success: true };
}
