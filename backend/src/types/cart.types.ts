export interface AddCartItemInput {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemInput {
  productId: string;
  quantity: number;
}

export interface CartSkuInput {
  sku: string;
  quantity: number;
}

export interface CartItemResponse {
  productId: string;
  variantSku: string;
  quantity: number;
}

export interface CartResponseData {
  id: string;
  ownerType: "user" | "guest";
  userId?: string;
  guestId?: string;
  expiresAt?: string;
  items: CartItemResponse[];
}
