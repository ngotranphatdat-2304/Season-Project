import { Types } from "mongoose";
import { Cart, type ICart, type ICartItem } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import type { IVariant, ProductAvailability } from "../types/product.types.js";
import type {
  AddCartItemInput,
  CartResponseData,
  CartSkuInput,
  UpdateCartItemInput,
} from "../types/cart.types.js";

interface CartOwnerInput {
  userId?: string;
  guestId?: string;
}

interface ResolvedCartOwner {
  userId?: Types.ObjectId;
  guestId?: string;
}

interface CartProduct {
  _id: Types.ObjectId;
  availability: ProductAvailability;
  isActive: boolean;
  variants: IVariant[];
}

interface CartSkuProduct extends CartProduct {
  variant: IVariant;
}

interface CartDisplayProduct {
  _id: Types.ObjectId;
  name: string;
  variants: IVariant[];
}

const GUEST_CART_TTL_DAYS = 7;
const DUPLICATE_CART_ITEM_MESSAGE = "Product already added to cart";

export class CartServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "CartServiceError";
    this.statusCode = statusCode;
  }
}

function resolveCartOwner(owner: CartOwnerInput): ResolvedCartOwner {
  if (owner.userId !== undefined) {
    return { userId: new Types.ObjectId(owner.userId) };
  }

  if (owner.guestId !== undefined && owner.guestId.trim() !== "") {
    return { guestId: owner.guestId.trim() };
  }

  throw new CartServiceError("Cart owner is required", 400);
}

function guestCartExpiryDate(): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + GUEST_CART_TTL_DAYS);
  return expiresAt;
}

function guestCartExpiryUpdate(owner: ResolvedCartOwner): Pick<ICart, "expiresAt"> | {} {
  return owner.guestId === undefined ? {} : { expiresAt: guestCartExpiryDate() };
}

function selectDefaultVariant(variants: IVariant[]): IVariant | null {
  const defaultVariant = variants.find((variant) => variant.isDefault === true);
  return defaultVariant ?? variants[0] ?? null;
}

async function findCartProduct(productId: string): Promise<CartProduct | null> {
  return Product.findById(productId)
    .select("availability isActive variants")
    .lean<CartProduct | null>();
}

async function findCartProductBySku(sku: string): Promise<CartSkuProduct | null> {
  const product = await Product.findOne({ "variants.sku": sku })
    .select("availability isActive variants")
    .lean<CartProduct | null>();

  if (product === null) {
    return null;
  }

  const variant = product.variants.find((item) => item.sku === sku);
  if (variant === undefined) {
    return null;
  }

  return { ...product, variant };
}

async function findCartDisplayProducts(
  items: ICartItem[],
): Promise<Map<string, CartDisplayProduct>> {
  const productIds = [...new Set(items.map((item) => item.productId.toString()))];

  if (productIds.length === 0) {
    return new Map<string, CartDisplayProduct>();
  }

  const products = await Product.find({ _id: { $in: productIds } })
    .select("name variants")
    .lean<CartDisplayProduct[]>();

  return new Map(
    products.map((product) => [product._id.toString(), product] as const),
  );
}

async function toCartResponse(cart: ICart): Promise<CartResponseData> {
  const displayProducts = await findCartDisplayProducts(cart.items);

  return {
    id: cart._id.toString(),
    ownerType: cart.userId !== undefined ? "user" : "guest",
    ...(cart.userId === undefined ? {} : { userId: cart.userId.toString() }),
    ...(cart.guestId === undefined ? {} : { guestId: cart.guestId }),
    ...(cart.expiresAt === undefined ? {} : { expiresAt: cart.expiresAt.toISOString() }),
    items: cart.items.flatMap((item) => {
      const product = displayProducts.get(item.productId.toString());
      const variant = product?.variants.find(
        (candidate) => candidate.sku === item.variantSku,
      );

      if (product === undefined || variant === undefined) {
        return [];
      }

      return [
        {
          productId: item.productId.toString(),
          productName: product.name,
          variantSku: item.variantSku,
          price: variant.price,
          quantity: item.quantity,
          stock: variant.stock,
          image: variant.images[0] ?? "",
        },
      ];
    }),
  };
}

function assertProductCanBeAddedToCart(product: CartProduct): IVariant {
  if (product.isActive !== true || product.availability !== "in_stock") {
    throw new CartServiceError("Product is not available for sale", 409);
  }

  const variant = selectDefaultVariant(product.variants);
  if (variant === null || variant.sku.trim() === "") {
    throw new CartServiceError("Product does not have a sellable variant", 409);
  }

  return variant;
}

function assertSkuProductCanBeAddedToCart(product: CartSkuProduct): IVariant {
  if (product.isActive !== true || product.availability !== "in_stock") {
    throw new CartServiceError("Product is not available for sale", 409);
  }

  if (product.variant.sku.trim() === "") {
    throw new CartServiceError("Product does not have a sellable variant", 409);
  }

  return product.variant;
}

function assertQuantityWithinStock(quantity: number, stock: number): void {
  if (quantity > stock) {
    throw new CartServiceError(
      `Requested quantity exceeds available stock (${stock})`,
      409,
    );
  }
}

function assertCartItemNotAlreadyAdded(existingItem: ICartItem | undefined): void {
  if (existingItem !== undefined) {
    throw new CartServiceError(DUPLICATE_CART_ITEM_MESSAGE, 409);
  }
}

function findMatchingCartItem(
  cart: ICart,
  productId: Types.ObjectId,
  variantSku: string,
): ICartItem | undefined {
  return cart.items.find(
    (item) =>
      item.productId.toString() === productId.toString() &&
      item.variantSku === variantSku,
  );
}

async function findCart(ownerInput: CartOwnerInput): Promise<ICart | null> {
  const owner = resolveCartOwner(ownerInput);

  if (owner.userId !== undefined) {
    return Cart.findOne({ userId: owner.userId });
  }

  if (owner.guestId === undefined) {
    throw new CartServiceError("Guest cart owner is invalid", 400);
  }

  return Cart.findOne({ guestId: owner.guestId });
}

async function getOrCreateCart(ownerInput: CartOwnerInput): Promise<ICart> {
  const owner = resolveCartOwner(ownerInput);
  const existingCart = await findCart(ownerInput);

  if (existingCart !== null) {
    if (owner.guestId !== undefined) {
      existingCart.expiresAt = guestCartExpiryDate();
      await existingCart.save();
    }

    return existingCart;
  }

  return Cart.create({
    ...(owner.userId === undefined ? {} : { userId: owner.userId }),
    ...(owner.guestId === undefined ? {} : { guestId: owner.guestId }),
    ...guestCartExpiryUpdate(owner),
    items: [],
  });
}

async function requireCart(ownerInput: CartOwnerInput): Promise<ICart> {
  return getOrCreateCart(ownerInput);
}

function clampQuantityToVariantStock(
  existingQuantity: number,
  nextQuantity: number,
  stock: number,
): number {
  return Math.max(0, Math.min(existingQuantity + nextQuantity, stock));
}

export async function mergeGuestCartIntoUserCart(
  userId: string,
  guestId: string,
): Promise<boolean> {
  const trimmedGuestId = guestId.trim();
  if (trimmedGuestId === "") return false;

  const [guestCart, userCart] = await Promise.all([
    Cart.findOne({ guestId: trimmedGuestId }),
    Cart.findOne({ userId }),
  ]);

  if (guestCart === null) return false;

  if (guestCart.items.length === 0) {
    await Cart.deleteOne({ _id: guestCart._id });
    return false;
  }

  if (userCart === null) {
    guestCart.userId = new Types.ObjectId(userId);
    guestCart.set("guestId", undefined);
    guestCart.set("expiresAt", undefined);
    await guestCart.save();
    return true;
  }

  for (const guestItem of guestCart.items) {
    const product = await findCartProduct(guestItem.productId.toString());
    if (product === null || product.isActive !== true) continue;

    const variant = product.variants.find((item) => item.sku === guestItem.variantSku);
    if (variant === undefined || product.availability !== "in_stock" || variant.stock < 1) {
      continue;
    }

    const existingItem = findMatchingCartItem(userCart, product._id, guestItem.variantSku);
    if (existingItem === undefined) {
      userCart.items.push({
        productId: product._id,
        variantSku: guestItem.variantSku,
        quantity: Math.min(guestItem.quantity, variant.stock),
      });
    } else {
      existingItem.quantity = clampQuantityToVariantStock(
        existingItem.quantity,
        guestItem.quantity,
        variant.stock,
      );
    }
  }

  userCart.items = userCart.items.filter((item) => item.quantity > 0);
  await Promise.all([userCart.save(), Cart.deleteOne({ _id: guestCart._id })]);
  return true;
}

export async function addItemToCart(
  owner: CartOwnerInput,
  input: AddCartItemInput,
): Promise<CartResponseData> {
  const product = await findCartProduct(input.productId);
  if (product === null) throw new CartServiceError("Product not found", 404);

  const variant = assertProductCanBeAddedToCart(product);
  const cart = await requireCart(owner);
  const existingItem = findMatchingCartItem(cart, product._id, variant.sku);
  assertCartItemNotAlreadyAdded(existingItem);
  assertQuantityWithinStock(input.quantity, variant.stock);

  cart.items.push({
    productId: product._id,
    variantSku: variant.sku,
    quantity: input.quantity,
  });

  await cart.save();
  return toCartResponse(cart);
}

export async function getCartForOwner(owner: CartOwnerInput): Promise<CartResponseData> {
  if (owner.userId === undefined && (owner.guestId === undefined || owner.guestId.trim() === "")) {
    return {
      items: [],
    };
  }

  const cart = await findCart(owner);

  if (cart === null) {
    return {
      ...(owner.userId === undefined ? {} : { ownerType: "user" as const, userId: owner.userId }),
      ...(owner.guestId === undefined ? {} : { ownerType: "guest" as const, guestId: owner.guestId }),
      items: [],
    };
  }

  return toCartResponse(cart);
}

export async function addSkuItemToCart(
  owner: CartOwnerInput,
  input: CartSkuInput,
): Promise<CartResponseData> {
  const product = await findCartProductBySku(input.sku);
  if (product === null) throw new CartServiceError("Product variant not found", 404);

  const variant = assertSkuProductCanBeAddedToCart(product);
  const cart = await requireCart(owner);
  const existingItem = findMatchingCartItem(cart, product._id, variant.sku);
  assertCartItemNotAlreadyAdded(existingItem);
  assertQuantityWithinStock(input.quantity, variant.stock);

  cart.items.push({
    productId: product._id,
    variantSku: variant.sku,
    quantity: input.quantity,
  });

  await cart.save();
  return toCartResponse(cart);
}

export async function updateCartItemQuantity(
  owner: CartOwnerInput,
  input: UpdateCartItemInput,
): Promise<CartResponseData> {
  const cart = await requireCart(owner);
  const product = await findCartProduct(input.productId);
  if (product === null) throw new CartServiceError("Product not found", 404);

  const variant = assertProductCanBeAddedToCart(product);
  const existingItem = findMatchingCartItem(cart, product._id, variant.sku);
  if (existingItem === undefined) throw new CartServiceError("Cart item not found", 404);

  assertQuantityWithinStock(input.quantity, variant.stock);
  existingItem.quantity = input.quantity;

  await cart.save();
  return toCartResponse(cart);
}

export async function updateSkuCartItemQuantity(
  owner: CartOwnerInput,
  input: CartSkuInput,
): Promise<CartResponseData> {
  const cart = await requireCart(owner);
  const product = await findCartProductBySku(input.sku);
  if (product === null) throw new CartServiceError("Product variant not found", 404);

  const variant = assertSkuProductCanBeAddedToCart(product);
  const item = findMatchingCartItem(cart, product._id, variant.sku);
  if (item === undefined) throw new CartServiceError("Cart item not found", 404);

  assertQuantityWithinStock(input.quantity, variant.stock);
  item.quantity = input.quantity;
  await cart.save();
  return toCartResponse(cart);
}

export async function removeItemFromCart(
  owner: CartOwnerInput,
  productId: string,
): Promise<CartResponseData> {
  const cart = await requireCart(owner);
  const existingItemIndex = cart.items.findIndex((item) => item.productId.toString() === productId);
  if (existingItemIndex === -1) throw new CartServiceError("Cart item not found", 404);

  cart.items.splice(existingItemIndex, 1);
  await cart.save();
  return toCartResponse(cart);
}

export async function removeSkuItemFromCart(
  owner: CartOwnerInput,
  sku: string,
): Promise<CartResponseData> {
  const cart = await requireCart(owner);
  const itemIndex = cart.items.findIndex((item) => item.variantSku === sku);
  if (itemIndex === -1) throw new CartServiceError("Cart item not found", 404);

  cart.items.splice(itemIndex, 1);
  await cart.save();
  return toCartResponse(cart);
}

export async function clearCartForOwner(owner: CartOwnerInput): Promise<CartResponseData> {
  const cart = await findCart(owner);

  if (cart === null) {
    return getCartForOwner(owner);
  }

  cart.items = [];
  await cart.save();
  return toCartResponse(cart);
}

export async function clearCartForUser(userId: string): Promise<void> {
  await Cart.updateOne({ userId: new Types.ObjectId(userId) }, { $set: { items: [] } });
}
