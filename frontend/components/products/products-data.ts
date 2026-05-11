import products from "./eyeglasses-data.json";

export type ProductVariant = {
  sku: string;
  color: string;
  size: string;
  price: number;
  originalPrice: number;
  images: string[];
  isDefault: boolean;
  stock: number;
};

export type ProductItem = {
  name: string;
  slug: string;
  collectionId: string;
  brand: string;
  saleInfo: {
    isOnSale: boolean;
  };
  availability: string;
  type: string;
  description: string;
  specifications: {
    frameType: {
      size: string;
      material: string;
    };
    gender: string;
  };
  variants: ProductVariant[];
  rating: {
    avg: number;
    count: number;
  };
  isActive: boolean;
};

const eyeglasses = products as ProductItem[];

export const productTabs = [
  "All Eyeglasses",
  "Men",
  "Women",
  "Best Sellers",
  "Seasonal",
  "Low Bridge Fit",
] as const;

const getVariantCountLabel = (count: number) => {
  if (count === 1) {
    return "1 Color";
  }

  return `${count} Colors`;
};

export const getProductPreview = (product: ProductItem) => {
  const defaultVariant =
    product.variants.find((variant) => variant.isDefault) ?? product.variants[0];

  return {
    title: product.name,
    slug: product.slug,
    image: defaultVariant?.images[0] ?? "",
    colorCount: getVariantCountLabel(product.variants.length),
    price: defaultVariant?.price ?? 0,
    originalPrice: defaultVariant?.originalPrice ?? 0,
    isOnSale: product.saleInfo.isOnSale,
    frameType: product.specifications.frameType.size,
    material: product.specifications.frameType.material,
  };
};

export const eyeglassesProducts = eyeglasses.map(getProductPreview);

export type ProductCategoryKey = "eyeglasses";

export type ProductCategoryConfig = {
  key: ProductCategoryKey;
  title: string;
  breadcrumb: string;
  itemsLabel: string;
  products: ReturnType<typeof getProductPreview>[];
};

export const productCategories: Record<ProductCategoryKey, ProductCategoryConfig> = {
  eyeglasses: {
    key: "eyeglasses",
    title: "Men's Eyeglasses",
    breadcrumb: "Eyeglasses",
    itemsLabel: `${eyeglassesProducts.length} Items`,
    products: eyeglassesProducts,
  },
};

export const isProductCategoryKey = (
  value: string,
): value is ProductCategoryKey => {
  return value === "eyeglasses";
};

export const getProductCategoryConfig = (value: string) => {
  if (isProductCategoryKey(value)) {
    return productCategories[value];
  }

  return undefined;
};
