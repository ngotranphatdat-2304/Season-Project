import mongoose, { Types } from "mongoose";
import { Collection } from "../models/collection.model.js";
import {
  Order,
  type IOrder,
  type OrderStatus,
  type PaymentStatus,
} from "../models/order.model.js";
import { Product, type IProduct } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import { AppError } from "../errors/app-error.js";
import type {
  AdminCollectionInput,
  AdminCollectionListResponse,
  AdminCollectionResponse,
  AdminDashboardResponse,
  AdminOrderListResponse,
  AdminOrderResponse,
  AdminOrderUpdateInput,
  AdminOrdersQuery,
  AdminProductInput,
  AdminProductListResponse,
  AdminProductResponse,
  AdminProductsQuery,
} from "../types/admin.types.js";

type TimestampedProduct = IProduct & { createdAt: Date; updatedAt: Date };
type TimestampedOrder = IOrder & { createdAt: Date; updatedAt: Date };
type TimestampedCollection = {
  _id: Types.ObjectId | string;
  name: string;
  slug: string;
  inStockCount: number;
  createdAt: Date;
  updatedAt: Date;
};

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function ensureSingleDefaultVariant(input: AdminProductInput): AdminProductInput {
  const defaultVariantIndex = input.variants.findIndex((item) => item.isDefault === true);
  const variants = input.variants.map((variant, index) => ({
    sku: variant.sku,
    ...(variant.color === undefined ? {} : { color: variant.color }),
    price: variant.price,
    images: variant.images,
    stock: variant.stock,
    isDefault: variant.isDefault === true && index === defaultVariantIndex,
  }));

  if (variants.every((variant) => variant.isDefault !== true)) {
    const firstVariant = variants[0];

    if (firstVariant !== undefined) {
      variants[0] = { ...firstVariant, isDefault: true };
    }
  }

  return {
    ...input,
    variants,
  };
}

function toWeekdayLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
}

function getLastSevenDays(): Array<{ key: string; label: string }> {
  const days: Array<{ key: string; label: string }> = [];
  const now = new Date();

  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - offset);
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;

    days.push({
      key,
      label: `${toWeekdayLabel(day)} ${String(day.getDate()).padStart(2, "0")}/${String(day.getMonth() + 1).padStart(2, "0")}`,
    });
  }

  return days;
}

function isCompletedOrder(order: Pick<IOrder, "status" | "paymentStatus">): boolean {
  return order.status === "delivered" && order.paymentStatus === "paid";
}

async function refreshCollectionInStockCounts(collectionIds: string[]): Promise<void> {
  const uniqueIds = [...new Set(collectionIds.filter((id) => Types.ObjectId.isValid(id)))];

  await Promise.all(
    uniqueIds.map(async (collectionId) => {
      const inStockCount = await Product.countDocuments({
        collectionId: new Types.ObjectId(collectionId),
        isActive: true,
        availability: "in_stock",
      });

      await Collection.updateOne(
        { _id: collectionId },
        { $set: { inStockCount } },
      );
    }),
  );
}

function toAdminCollectionResponse(collection: TimestampedCollection): AdminCollectionResponse {
  return {
    id: String(collection._id),
    name: collection.name,
    slug: collection.slug,
    inStockCount: collection.inStockCount,
    createdAt: collection.createdAt.toISOString(),
    updatedAt: collection.updatedAt.toISOString(),
  };
}

function toAdminProductResponse(
  product: TimestampedProduct,
  collectionNameById: Map<string, string>,
): AdminProductResponse {
  return {
    id: product._id.toString(),
    name: product.name,
    slug: product.slug,
    type: product.type,
    collectionId: product.collectionId.toString(),
    ...(collectionNameById.has(product.collectionId.toString())
      ? { collectionName: collectionNameById.get(product.collectionId.toString()) as string }
      : {}),
    brand: product.brand,
    salePercent: product.salePercent,
    availability: product.availability,
    description: product.description,
    isActive: product.isActive,
    specifications: product.specifications,
    variants: product.variants,
    rating: product.rating,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

async function buildCollectionNameMap(collectionIds: string[]): Promise<Map<string, string>> {
  const collections = await Collection.find({
    _id: { $in: collectionIds.map((id) => new Types.ObjectId(id)) },
  })
    .select("name")
    .lean<Array<{ _id: Types.ObjectId; name: string }>>();

  return new Map(
    collections.map((collection) => [collection._id.toString(), collection.name] as const),
  );
}

async function buildUserMap(userIds: string[]): Promise<Map<string, { name: string; email: string }>> {
  const validUserIds = userIds.filter((id) => Types.ObjectId.isValid(id));

  if (validUserIds.length === 0) {
    return new Map();
  }

  const users = await User.find({
    _id: { $in: validUserIds.map((id) => new Types.ObjectId(id)) },
  })
    .select("name email")
    .lean<Array<{ _id: Types.ObjectId; name: string; email: string }>>();

  return new Map(
    users.map((user) => [user._id.toString(), { name: user.name, email: user.email }] as const),
  );
}

function toAdminOrderResponse(
  order: TimestampedOrder,
  userMap: Map<string, { name: string; email: string }>,
): AdminOrderResponse {
  const customer =
    order.userId === undefined ? undefined : userMap.get(order.userId.toString());
  const customerName =
    customer?.name ?? order.shippingAddress.recipientName ?? order.customerEmail ?? "Guest customer";
  const customerEmail = customer?.email ?? order.customerEmail ?? "";

  return {
    id: order._id.toString(),
    ...(order.userId === undefined ? {} : { userId: order.userId.toString() }),
    customerName,
    customerEmail,
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
    discountAmount: order.discountAmount,
    shippingFee: order.shippingFee,
    taxAmount: order.taxAmount,
    totalAmount: order.totalAmount,
    currency: order.currency,
    ...(order.placedAt === undefined ? {} : { placedAt: order.placedAt.toISOString() }),
    ...(order.cancelledAt === undefined ? {} : { cancelledAt: order.cancelledAt.toISOString() }),
    ...(order.deliveredAt === undefined ? {} : { deliveredAt: order.deliveredAt.toISOString() }),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export async function getAdminDashboard(): Promise<AdminDashboardResponse> {
  const lastSevenDays = getLastSevenDays();
  const dailyRevenueMap = new Map<string, { revenue: number; orders: number }>(
    lastSevenDays.map((day) => [day.key, { revenue: 0, orders: 0 }] as const),
  );

  const [totalOrders, activeCustomers, pendingOrders, allOrdersRaw, recentOrders, lowStockProducts] =
    await Promise.all([
      Order.countDocuments(),
      User.countDocuments({ role: "customer", status: "active", isActive: true }),
      Order.countDocuments({ status: { $in: ["pending", "confirmed", "shipped"] } }),
      Order.find({ status: { $ne: "cancelled" } }).select(
        "userId customerEmail shippingAddress items totalAmount status paymentStatus placedAt createdAt cancelledAt deliveredAt",
      ),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("userId customerEmail shippingAddress items totalAmount status paymentStatus placedAt createdAt"),
      Product.find({
        isActive: true,
        availability: "in_stock",
        "variants.stock": { $lte: 2 },
      }).select("_id"),
    ]);

  const allOrders = allOrdersRaw as unknown as Array<
    IOrder & { createdAt: Date; placedAt?: Date }
  >;

  const recentUserMap = await buildUserMap(
    recentOrders.flatMap((order) =>
      order.userId === undefined ? [] : [order.userId.toString()],
    ),
  );

  let completedOrders = 0;
  let completedRevenue = 0;
  let unitsSold = 0;
  const topProductMap = new Map<string, { productId: string; productName: string; unitsSold: number; revenue: number }>();

  for (const order of allOrders) {
    if (isCompletedOrder(order) === false) {
      continue;
    }

    completedOrders += 1;
    completedRevenue += order.totalAmount;

    const placedAtDate = order.placedAt ?? order.createdAt ?? new Date();
    const dayKey = `${placedAtDate.getFullYear()}-${String(placedAtDate.getMonth() + 1).padStart(2, "0")}-${String(placedAtDate.getDate()).padStart(2, "0")}`;
    const currentDaily = dailyRevenueMap.get(dayKey);

    if (currentDaily !== undefined) {
      currentDaily.revenue += order.totalAmount;
      currentDaily.orders += 1;
    }

    for (const item of order.items) {
      unitsSold += item.quantity;

      const key = `${item.productId.toString()}:${item.productName}`;
      const current =
        topProductMap.get(key) ?? {
          productId: item.productId.toString(),
          productName: item.productName,
          unitsSold: 0,
          revenue: 0,
        };

      current.unitsSold += item.quantity;
      current.revenue += item.lineTotal;
      topProductMap.set(key, current);
    }
  }

  const revenueTrend = lastSevenDays.map((day) => {
    const value = dailyRevenueMap.get(day.key) ?? { revenue: 0, orders: 0 };

    return {
      day: day.label,
      revenue: value.revenue,
      orders: value.orders,
    };
  });

  const topProducts = [...topProductMap.values()]
    .sort((a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue)
    .slice(0, 3);

  return {
    summary: {
      totalOrders,
      completedOrders,
      activeCustomers,
      pendingOrders,
      grossRevenue: completedRevenue,
      deliveredRevenue: completedRevenue,
      unitsSold,
      lowStockProducts: lowStockProducts.length,
    },
    revenueTrend,
    topProducts,
    recentOrders: recentOrders.map((order) => {
      const customer =
        order.userId === undefined ? undefined : recentUserMap.get(order.userId.toString());

      return {
        id: order._id.toString(),
        customerName:
          customer?.name ?? order.shippingAddress.recipientName ?? order.customerEmail ?? "Guest customer",
        customerEmail: customer?.email ?? order.customerEmail ?? "",
        totalAmount: order.totalAmount,
        status: order.status,
        paymentStatus: order.paymentStatus,
        ...(order.placedAt === undefined ? {} : { placedAt: order.placedAt.toISOString() }),
      };
    }),
  };
}

export async function listAdminCollections(): Promise<AdminCollectionListResponse> {
  const [total, collections] = await Promise.all([
    Collection.countDocuments(),
    Collection.find()
      .sort({ name: 1 })
      .lean<TimestampedCollection[]>(),
  ]);

  return {
    records: collections.map(toAdminCollectionResponse),
    total,
  };
}

export async function createAdminCollection(
  input: AdminCollectionInput,
): Promise<AdminCollectionResponse> {
  const collection = await Collection.create({
    name: input.name.trim(),
    slug: normalizeSlug(input.slug),
  });

  return toAdminCollectionResponse(
    collection.toObject() as unknown as TimestampedCollection,
  );
}

export async function updateAdminCollection(
  collectionId: string,
  input: AdminCollectionInput,
): Promise<AdminCollectionResponse> {
  const collection = await Collection.findByIdAndUpdate(
    collectionId,
    {
      $set: {
        name: input.name.trim(),
        slug: normalizeSlug(input.slug),
      },
    },
    { new: true, runValidators: true },
  );

  if (collection === null) {
    throw AppError.notFound("Collection not found");
  }

  return toAdminCollectionResponse(
    collection.toObject() as unknown as TimestampedCollection,
  );
}

export async function listAdminProducts(
  query: AdminProductsQuery,
): Promise<AdminProductListResponse> {
  const filter: Record<string, unknown> = {};

  if (query.q !== undefined && query.q.trim() !== "") {
    const regex = new RegExp(query.q.trim(), "i");
    filter.$or = [{ name: regex }, { brand: regex }, { slug: regex }];
  }

  if (query.collectionId !== undefined) {
    filter.collectionId = new Types.ObjectId(query.collectionId);
  }

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive;
  }

  const [total, products] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter)
      .sort({ updatedAt: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit),
  ]);

  const timestampedProducts = products as unknown as TimestampedProduct[];
  const collectionNameMap = await buildCollectionNameMap(
    timestampedProducts.map((product) => product.collectionId.toString()),
  );

  return {
    records: timestampedProducts.map((product) =>
      toAdminProductResponse(product, collectionNameMap),
    ),
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.ceil(total / query.limit),
  };
}

export async function createAdminProduct(
  input: AdminProductInput,
): Promise<AdminProductResponse> {
  const normalizedInput = ensureSingleDefaultVariant(input);
  const collection = await Collection.findById(normalizedInput.collectionId).select("name");

  if (collection === null) {
    throw AppError.badRequest("collectionId is invalid", "VALIDATION_ERROR");
  }

  const product = await Product.create({
    ...normalizedInput,
    slug: normalizeSlug(normalizedInput.slug),
    name: normalizedInput.name.trim(),
    brand: normalizedInput.brand.trim(),
    description: normalizedInput.description.trim(),
  });

  await refreshCollectionInStockCounts([product.collectionId.toString()]);

  return toAdminProductResponse(
    product.toObject() as unknown as TimestampedProduct,
    new Map([[product.collectionId.toString(), collection.name]]),
  );
}

export async function updateAdminProduct(
  productId: string,
  input: AdminProductInput,
): Promise<AdminProductResponse> {
  const existingProduct = await Product.findById(productId);

  if (existingProduct === null) {
    throw AppError.notFound("Product not found");
  }

  const previousCollectionId = existingProduct.collectionId.toString();
  const normalizedInput = ensureSingleDefaultVariant(input);
  const collection = await Collection.findById(normalizedInput.collectionId).select("name");

  if (collection === null) {
    throw AppError.badRequest("collectionId is invalid", "VALIDATION_ERROR");
  }

  existingProduct.name = normalizedInput.name.trim();
  existingProduct.slug = normalizeSlug(normalizedInput.slug);
  existingProduct.type = normalizedInput.type;
  existingProduct.collectionId = new Types.ObjectId(normalizedInput.collectionId);
  existingProduct.brand = normalizedInput.brand.trim();
  existingProduct.salePercent = normalizedInput.salePercent;
  existingProduct.availability = normalizedInput.availability;
  existingProduct.description = normalizedInput.description.trim();
  existingProduct.isActive = normalizedInput.isActive;
  existingProduct.specifications = normalizedInput.specifications;
  existingProduct.variants = normalizedInput.variants;

  await existingProduct.save();
  await refreshCollectionInStockCounts([
    existingProduct.collectionId.toString(),
    previousCollectionId,
  ]);

  return toAdminProductResponse(
    existingProduct.toObject() as unknown as TimestampedProduct,
    new Map([[existingProduct.collectionId.toString(), collection.name]]),
  );
}

export async function listAdminOrders(
  query: AdminOrdersQuery,
): Promise<AdminOrderListResponse> {
  const filter: Record<string, unknown> = {};

  if (query.status !== undefined) {
    filter.status = query.status;
  }

  if (query.paymentStatus !== undefined) {
    filter.paymentStatus = query.paymentStatus;
  }

  const [total, orders] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .select("userId customerEmail shippingAddress items totalAmount status paymentStatus paymentMethod placedAt createdAt updatedAt"),
  ]);

  const timestampedOrders = orders as unknown as TimestampedOrder[];
  const userMap = await buildUserMap(
    timestampedOrders.flatMap((order) =>
      order.userId === undefined ? [] : [order.userId.toString()],
    ),
  );

  return {
    records: timestampedOrders.map((order) => toAdminOrderResponse(order, userMap)),
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.ceil(total / query.limit),
  };
}

async function restoreOrderItemStocks(order: IOrder, session: mongoose.ClientSession): Promise<void> {
  for (const item of order.items) {
    const update = await Product.updateOne(
      { _id: item.productId, "variants.sku": item.variantSku },
      { $inc: { "variants.$.stock": item.quantity } },
      { session },
    );

    if (update.modifiedCount !== 1) {
      throw AppError.badRequest(`Unable to restore stock for ${item.variantSku}`);
    }
  }
}

async function reserveOrderItemStocks(order: IOrder, session: mongoose.ClientSession): Promise<void> {
  for (const item of order.items) {
    const update = await Product.updateOne(
      {
        _id: item.productId,
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

    if (update.modifiedCount !== 1) {
      throw AppError.badRequest(`Unable to reserve stock for ${item.variantSku}`);
    }
  }
}

export async function updateAdminOrder(
  orderId: string,
  input: AdminOrderUpdateInput,
): Promise<AdminOrderResponse> {
  const session = await mongoose.startSession();

  try {
    let updatedOrder: TimestampedOrder | null = null;

    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);

      if (order === null) {
        throw AppError.notFound("Order not found");
      }

      const previousStatus = order.status;

      if (input.status !== undefined && previousStatus !== input.status) {
        if (previousStatus === "cancelled" && input.status !== "cancelled") {
          await reserveOrderItemStocks(order, session);
          delete order.cancelledAt;
        }

        if (input.status === "cancelled") {
          await restoreOrderItemStocks(order, session);
          await refreshCollectionInStockCounts(
            [...new Set(order.items.map((item) => item.productId.toString()))],
          ).catch(() => undefined);
          order.cancelledAt = new Date();
        }

        order.status = input.status as OrderStatus;

        if (input.status === "delivered" && order.deliveredAt === undefined) {
          order.deliveredAt = new Date();
        }
      }

      if (input.paymentStatus !== undefined) {
        order.paymentStatus = input.paymentStatus as PaymentStatus;
      }

      await order.save({ session });
      updatedOrder = order.toObject() as unknown as TimestampedOrder;
    });

    if (updatedOrder === null) {
      throw AppError.badRequest("Failed to update order");
    }

    const finalOrder = updatedOrder as TimestampedOrder;
    const userMap = await buildUserMap(
      finalOrder.userId === undefined ? [] : [finalOrder.userId.toString()],
    );
    return toAdminOrderResponse(finalOrder, userMap);
  } finally {
    await session.endSession();
  }
}
