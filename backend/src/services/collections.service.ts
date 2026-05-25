import { Collection } from "../models/collection.model.js";
import { Product } from "../models/product.model.js";
import type {
  CollectionFiltersResponseData,
  DatabaseProduct,
  ProductResponse,
  ProductsResponseData,
  ValidatedCollectionProductsQuery,
} from "../types/product.types.js";
import { buildProductSort } from "./product-sort.util.js";
import type { Types } from "mongoose";

export async function getCollectionFilters(): Promise<CollectionFiltersResponseData> {
  const filter = { inStockCount: { $gt: 0 } };

  const collections = await Collection.find(filter)
    .select(`name slug inStockCount`)
    .sort({ name: 1 })
    .lean<
      Array<{
        _id: unknown;
        name: string;
        slug: string;
        inStockCount: number;
      }>
    >();

  return {
    records: collections.map((collection) => {
      return {
        id: String(collection._id),
        name: collection.name,
        slug: collection.slug,
        inStockCount: collection.inStockCount,
      };
    }),
  };
}

function normalizeCollectionSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const PRODUCT_SELECT_FIELDS =
  "name slug type collectionId brand salePercent availability description specifications variants rating isActive";

function transformCollectionProduct(product: DatabaseProduct): ProductResponse {
  return {
    id: product._id.toString(),
    name: product.name,
    slug: product.slug,
    type: product.type,
    collectionId: product.collectionId.toString(),
    brand: product.brand,
    salePercent: product.salePercent,
    availability: product.availability,
    description: product.description,
    variants: product.variants,
    rating: product.rating,
    isActive: product.isActive,
    specifications: product.specifications,
  };
}

export async function getCollectionProductsBySlug(
  collectionSlug: string,
  query: ValidatedCollectionProductsQuery,
): Promise<ProductsResponseData> {
  const normalizedSlug = normalizeCollectionSlug(collectionSlug);
  const collection = await Collection.findOne({ slug: normalizedSlug })
    .select("_id")
    .lean<{ _id: Types.ObjectId } | null>();

  if (collection === null) {
    return {
      records: [],
      total: 0,
    };
  }

  const match = {
    isActive: true,
    collectionId: collection._id,
  } as Record<string, unknown>;

  if (query.frameType !== null) {
    match["specifications.frameType.material"] = query.frameType;
  }

  if (query.frameSize !== null) {
    match["specifications.frameType.size.label"] = query.frameSize;
  }

  const total = await Product.countDocuments(match);
  const products = await Product.find(match)
    .select(PRODUCT_SELECT_FIELDS)
    .sort(buildProductSort(query.sort))
    .skip(query.offset)
    .limit(query.limit)
    .lean<DatabaseProduct[]>();

  return {
    records: products.map(transformCollectionProduct),
    total,
  };
}
