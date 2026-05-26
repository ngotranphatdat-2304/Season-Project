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
  CheckoutSessionResponse,
  PendingCheckoutSessionResponse,
} from "../types/checkout.types.js";
import { sendOrderConfirmationEmail } from "./order-email.service.js";

interface CheckoutOwnerInput {
  userId?: string;
  guestId?: string;
}

type CheckoutCartQuery =
  | { userId: Types.ObjectId; guestId?: never }
  | { guestId: string; userId?: never };

type CheckoutOwnerQuery =
  | { userId: Types.ObjectId; guestId?: never }
  | { guestId: string; userId?: never };

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
): CheckoutCartQuery {
  if (owner.userId !== undefined && owner.userId.trim() !== "") {
    return { userId: new Types.ObjectId(owner.userId) };
  }

  if (owner.guestId !== undefined) {
    return { guestId: requireGuestId(owner.guestId) };
  }

  throw new CheckoutSessionServiceError(EMPTY_CART_MESSAGE, 400);
}

function resolveCheckoutOwnerQuery(
  owner: CheckoutOwnerInput,
): CheckoutOwnerQuery | null {
  if (owner.userId !== undefined && owner.userId.trim() !== "") {
    return { userId: new Types.ObjectId(owner.userId) };
  }

  if (owner.guestId !== undefined && owner.guestId.trim() !== "") {
    return { guestId: owner.guestId.trim() };
  }

  return null;
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
      ...(item.variantColor === undefined ? {} : { variantColor: item.variantColor }),
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

function toSessionItems(
  items: ICheckoutSessionItemSnapshot[],
): ICheckoutSessionItemSnapshot[] {
  return items.map((item) => ({
    productId: item.productId,
    productName: item.productName,
    variantSku: item.variantSku,
    ...(item.variantColor === undefined ? {} : { variantColor: item.variantColor }),
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
    throw new CheckoutSessionServiceError(
      `${product.name} không đủ hàng`,
      409,
    );
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

async function decrementSnapshotStock(
  items: ICheckoutSessionItemSnapshot[],
  productMap: Map<string, CheckoutProduct>,
  session: ClientSession,
): Promise<void> {
  for (const item of items) {
    const product = productMap.get(item.productId);

    if (product === undefined) {
      throw new CheckoutSessionServiceError(UNAVAILABLE_CART_MESSAGE, 409);
    }

    const stockUpdate = await Product.updateOne(
      {
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
      { $inc: { "variants.$.stock": -item.quantity } },
      { session },
    );

    if (stockUpdate.modifiedCount !== 1) {
      throw new CheckoutSessionServiceError(
        `${product.name} không đủ hàng`,
        409,
      );
    }
  }
}

function toOrderItems(
  items: ICheckoutSessionItemSnapshot[],
): IOrderItem[] {
  return items.map((item) => ({
    productId: new Types.ObjectId(item.productId),
    productName: item.productName,
    variantSku: item.variantSku,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
  }));
}

function normalizeShippingAddress(
  address: IShippingAddress,
): IShippingAddress {
  return {
    recipientName: address.recipientName,
    phone: address.phone,
    line1: address.line1,
    ...(address.line2 === undefined ? {} : { line2: address.line2 }),
    ...(address.ward === undefined ? {} : { ward: address.ward }),
    ...(address.district === undefined ? {} : { district: address.district }),
    city: address.city,
    ...(address.province === undefined ? {} : { province: address.province }),
    ...(address.postalCode === undefined ? {} : { postalCode: address.postalCode }),
    country: address.country,
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
    ...(cartQuery.userId === undefined
      ? { guestId: cartQuery.guestId }
      : { userId: cartQuery.userId }),
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
        await decrementSnapshotStock(
          checkoutSession.itemsSnapshot,
          productMap,
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

  try {
    await sendOrderConfirmationEmail(completedOrder);
  } catch (error) {
    console.error("Failed to send order confirmation email:", error);
  }

  return {
    orderId: completedOrder._id.toString(),
    token: normalizedToken,
  };
}
