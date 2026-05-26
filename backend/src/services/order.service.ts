import mongoose, { type ClientSession, Types } from "mongoose";
import { Cart, type ICartItem } from "../models/cart.model.js";
import {
  Order,
  type IOrder,
  type IOrderItem,
  type OrderStatus,
} from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import type { IVariant, ProductAvailability } from "../types/product.types.js";
import type {
  CheckoutInput,
  CheckoutOrderResponse,
  OrderListQuery,
  OrderListResponse,
} from "../types/order.types.js";

interface CheckoutProduct {
  _id: Types.ObjectId;
  name: string;
  availability: ProductAvailability;
  isActive: boolean;
  variants: IVariant[];
}

const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["confirmed", "shipped", "delivered", "cancelled"],
  confirmed: ["shipped", "delivered", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export class OrderServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "OrderServiceError";
    this.statusCode = statusCode;
  }
}

interface MongoTransactionConflictError {
  code?: unknown;
  codeName?: unknown;
  errorLabels?: unknown;
  cause?: unknown;
  hasErrorLabel?: (label: string) => boolean;
}

function hasMongoErrorLabel(
  error: MongoTransactionConflictError,
  label: string,
): boolean {
  if (
    typeof error.hasErrorLabel === "function" &&
    error.hasErrorLabel(label) === true
  ) {
    return true;
  }

  if (Array.isArray(error.errorLabels) === false) {
    return false;
  }

  return error.errorLabels.includes(label);
}

export function isRetryableCheckoutConflict(error: unknown): boolean {
  if (error instanceof OrderServiceError) return false;
  if (typeof error !== "object" || error === null) return false;

  const mongoError = error as MongoTransactionConflictError;

  if (
    mongoError.code === 112 ||
    mongoError.codeName === "WriteConflict" ||
    mongoError.codeName === "TemporarilyUnavailable" ||
    hasMongoErrorLabel(mongoError, "TransientTransactionError") ||
    hasMongoErrorLabel(mongoError, "UnknownTransactionCommitResult")
  ) {
    return true;
  }

  if (mongoError.cause !== undefined) {
    return isRetryableCheckoutConflict(mongoError.cause);
  }

  return false;
}

function checkoutConflictError(): OrderServiceError {
  return new OrderServiceError(
    "Checkout conflicted with another stock update. Please retry.",
    409,
  );
}

async function findCheckoutProduct(
  item: ICartItem,
  session: ClientSession,
): Promise<CheckoutProduct | null> {
  return Product.findById(item.productId)
    .select("name availability isActive variants")
    .session(session)
    .lean<CheckoutProduct | null>();
}

function requireCheckoutVariant(product: CheckoutProduct, item: ICartItem): IVariant {
  if (product.isActive !== true || product.availability !== "in_stock") {
    throw new OrderServiceError(`Product ${product.name} is not available for sale`, 409);
  }

  const variant = product.variants.find(
    (productVariant) => productVariant.sku === item.variantSku,
  );

  if (variant === undefined) {
    throw new OrderServiceError(`Variant ${item.variantSku} is no longer available`, 409);
  }

  if (variant.stock < item.quantity) {
    throw new OrderServiceError(
      `Insufficient stock for ${product.name} (${item.variantSku})`,
      409,
    );
  }

  return variant;
}

async function decrementVariantStock(
  product: CheckoutProduct,
  item: ICartItem,
  session: ClientSession,
): Promise<void> {
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
    {
      $inc: { "variants.$.stock": -item.quantity },
    },
    { session },
  );

  if (stockUpdate.modifiedCount !== 1) {
    throw new OrderServiceError(
      `Insufficient stock for ${product.name} (${item.variantSku})`,
      409,
    );
  }
}

async function restoreOrderItemStock(
  item: IOrderItem,
  session: ClientSession,
): Promise<void> {
  const stockUpdate = await Product.updateOne(
    {
      _id: item.productId,
      "variants.sku": item.variantSku,
    },
    {
      $inc: { "variants.$.stock": item.quantity },
    },
    { session },
  );

  if (stockUpdate.modifiedCount !== 1) {
    throw new OrderServiceError(`Cannot restore stock for order item ${item.variantSku}`, 409);
  }
}

async function restoreCancelledOrderStock(order: IOrder, session: ClientSession): Promise<void> {
  for (const item of order.items) {
    await restoreOrderItemStock(item, session);
  }
}

function toCheckoutOrderResponse(order: IOrder): CheckoutOrderResponse {
  return {
    id: order._id.toString(),
    ...(order.userId === undefined ? {} : { userId: order.userId.toString() }),
    ...(order.guestId === undefined ? {} : { guestId: order.guestId }),
    ...(order.customerEmail === undefined
      ? {}
      : { customerEmail: order.customerEmail }),
    ...(order.checkoutToken === undefined
      ? {}
      : { checkoutToken: order.checkoutToken }),
    items: order.items.map((item) => ({
      productId: item.productId.toString(),
      productName: item.productName,
      variantSku: item.variantSku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    })),
    status: order.status,
    paymentStatus: order.paymentStatus,
    ...(order.paymentMethod === undefined ? {} : { paymentMethod: order.paymentMethod }),
    shippingAddress: order.shippingAddress,
    subtotalAmount: order.subtotalAmount,
    totalAmount: order.totalAmount,
    currency: order.currency,
  };
}

export function isOrderStatusTransitionAllowed(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
): boolean {
  if (currentStatus === nextStatus) return true;
  return ORDER_STATUS_TRANSITIONS[currentStatus].includes(nextStatus);
}

async function updateOrderStatusForUser(
  filter: Record<string, unknown>,
  nextStatus: OrderStatus,
): Promise<CheckoutOrderResponse> {
  const session = await mongoose.startSession();

  try {
    let updatedOrder: IOrder | null = null;

    await session.withTransaction(async () => {
      const order = await Order.findOne(filter).session(session);
      if (order === null) throw new OrderServiceError("Order not found", 404);

      if (isOrderStatusTransitionAllowed(order.status, nextStatus) === false) {
        throw new OrderServiceError(
          `Order status cannot change from ${order.status} to ${nextStatus}`,
          409,
        );
      }

      if (order.status === nextStatus) {
        updatedOrder = order;
        return;
      }

      if (nextStatus === "cancelled") {
        await restoreCancelledOrderStock(order, session);
      }

      order.status = nextStatus;

      if (nextStatus === "delivered" && order.deliveredAt === undefined) {
        order.deliveredAt = new Date();
      }

      if (nextStatus === "cancelled" && order.cancelledAt === undefined) {
        order.cancelledAt = new Date();
      }

      await order.save({ session });
      updatedOrder = order;
    });

    if (updatedOrder === null) {
      throw new OrderServiceError("Failed to update order status", 500);
    }

    return toCheckoutOrderResponse(updatedOrder);
  } finally {
    await session.endSession();
  }
}

function orderListFilter(query: OrderListQuery, userId: string): Record<string, unknown> {
  return {
    userId: new Types.ObjectId(userId),
    ...(query.status === undefined ? {} : { status: query.status }),
  };
}

export async function getOrdersForUser(
  userId: string,
  query: OrderListQuery,
): Promise<OrderListResponse> {
  const filter = orderListFilter(query, userId);
  const [total, orders] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit),
  ]);

  return {
    records: orders.map(toCheckoutOrderResponse),
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.ceil(total / query.limit),
  };
}

export async function getOrderForUser(
  userId: string,
  orderId: string,
): Promise<CheckoutOrderResponse> {
  const order = await Order.findOne({ _id: orderId, userId });
  if (order === null) throw new OrderServiceError("Order not found", 404);
  return toCheckoutOrderResponse(order);
}

export async function cancelOrderForUser(
  userId: string,
  orderId: string,
): Promise<CheckoutOrderResponse> {
  return updateOrderStatusForUser({ _id: orderId, userId }, "cancelled");
}

export async function checkoutCart(
  userId: string,
  input: CheckoutInput,
): Promise<CheckoutOrderResponse> {
  const session = await mongoose.startSession();

  try {
    let createdOrder: IOrder | null = null;

    try {
      await session.withTransaction(async () => {
        const cart = await Cart.findOne({ userId }).session(session);

        if (cart === null || cart.items.length === 0) {
          throw new OrderServiceError("Cart is empty", 400);
        }

        const orderItems: IOrderItem[] = [];

        for (const item of cart.items) {
          const product = await findCheckoutProduct(item, session);
          if (product === null) {
            throw new OrderServiceError("A cart product no longer exists", 409);
          }

          const variant = requireCheckoutVariant(product, item);
          await decrementVariantStock(product, item, session);

          orderItems.push({
            productId: product._id,
            productName: product.name,
            variantSku: item.variantSku,
            quantity: item.quantity,
            unitPrice: variant.price,
            lineTotal: item.quantity * variant.price,
          });
        }

        const [order] = await Order.create(
          [
            {
              userId: new Types.ObjectId(userId),
              items: orderItems,
              shippingAddress: input.shippingAddress,
              ...(input.paymentMethod === undefined
                ? {}
                : { paymentMethod: input.paymentMethod }),
            },
          ],
          { session },
        );

        if (order === undefined) {
          throw new OrderServiceError("Failed to create order", 500);
        }

        cart.items = [];
        await cart.save({ session });
        createdOrder = order;
      });
    } catch (error) {
      if (isRetryableCheckoutConflict(error) === true) {
        throw checkoutConflictError();
      }

      throw error;
    }

    if (createdOrder === null) {
      throw new OrderServiceError("Failed to create order", 500);
    }

    return toCheckoutOrderResponse(createdOrder);
  } finally {
    await session.endSession();
  }
}
