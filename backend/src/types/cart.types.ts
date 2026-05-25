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
  productName: string;
  variantSku: string;
  price: number;
  quantity: number;
  stock: number;
  image: string;
}

export interface CartResponseData {
  id?: string;
  ownerType?: "user" | "guest";
  userId?: string;
  guestId?: string;
  expiresAt?: string;
  items: CartItemResponse[];
}
