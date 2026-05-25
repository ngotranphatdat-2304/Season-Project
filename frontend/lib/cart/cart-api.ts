import { api } from "@/lib/api";

export type CartDrawerItem = {
  productId: string;
  productName: string;
  variantSku: string;
  price: number;
  quantity: number;
  stock: number;
  image: string;
};

export type CartResponse = {
  id?: string;
  ownerType?: "user" | "guest";
  userId?: string;
  guestId?: string;
  expiresAt?: string;
  items: CartDrawerItem[];
};

let bootstrapSessionPromise: Promise<void> | null = null;
let hasBootstrappedGuestSession = false;

export async function bootstrapGuestCartSession(): Promise<void> {
  if (hasBootstrappedGuestSession === true) {
    return;
  }

  if (bootstrapSessionPromise === null) {
    bootstrapSessionPromise = api
      .get("/cart/bootstrap")
      .then(() => {
        hasBootstrappedGuestSession = true;
      })
      .finally(() => {
        bootstrapSessionPromise = null;
      });
  }

  await bootstrapSessionPromise;
}

export async function fetchGuestCart(): Promise<CartResponse> {
  await bootstrapGuestCartSession().catch(() => undefined);

  const response = await api.get<CartResponse>("/cart");
  return response.data ?? { items: [] };
}

export async function addVariantToGuestCart(sku: string): Promise<CartResponse> {
  await bootstrapGuestCartSession().catch(() => undefined);

  const response = await api.post<CartResponse>("/cart", {
    sku,
    quantity: 1,
  });

  return response.data ?? { items: [] };
}

export async function updateGuestCartItemQuantity(
  sku: string,
  quantity: number,
): Promise<CartResponse> {
  await bootstrapGuestCartSession().catch(() => undefined);

  const response = await api.put<CartResponse>(`/cart/${encodeURIComponent(sku)}`, {
    quantity,
  });

  return response.data ?? { items: [] };
}

export async function removeGuestCartItem(sku: string): Promise<CartResponse> {
  await bootstrapGuestCartSession().catch(() => undefined);

  const response = await api.delete<CartResponse>(`/cart/${encodeURIComponent(sku)}`);
  return response.data ?? { items: [] };
}
