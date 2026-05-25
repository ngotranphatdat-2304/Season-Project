import { Collection } from "../models/collection.model.js";
import { Product } from "../models/product.model.js";
import type {
  DatabaseProduct,
  ProductResponse,
  ProductsResponseData,
  ValidatedProductQuery,
} from "../types/product.types.js";
import { buildProductSort } from "./product-sort.util.js";

const PRODUCT_SELECT_FIELDS =
  "name slug type collectionId brand salePercent availability description specifications variants rating isActive";

function buildFilter(query: ValidatedProductQuery): Record<string, unknown> {
  const filter: Record<string, unknown> = {
    isActive: true,
  };

  if (query.type !== null) {
    filter.type = query.type;
  }

  if (query.frameType !== null) {
    filter["specifications.frameType.material"] = query.frameType;
  }

  if (query.frameSize !== null) {
    filter["specifications.frameType.size.label"] = query.frameSize;
  }

  if (query.gender !== null) {
    filter["specifications.gender"] = query.gender;
  }

  if (query.sale === true) {
    filter.salePercent = { $gt: 0 };
  }

  return filter;
}

function transformProduct(product: DatabaseProduct): ProductResponse {
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
    specifications: product.specifications,
    variants: product.variants,
    rating: product.rating,
    isActive: product.isActive,
  };
}

export async function getProductsByFilters(
  query: ValidatedProductQuery,
): Promise<ProductsResponseData> {
  try {
    const filter = buildFilter(query);

    if (query.collectionSlug !== null) {
      const collection = await Collection.findOne({
        slug: query.collectionSlug,
      })
        .select("_id")
        .lean<{ _id: unknown } | null>();

      if (collection === null) {
        return {
          records: [],
          total: 0,
        };
      }

      filter.collectionId = collection._id;
    }

    const total = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .select(PRODUCT_SELECT_FIELDS)
      .sort(buildProductSort(query.sort))
      .skip(query.offset)
      .limit(query.limit)
      .lean<DatabaseProduct[]>();

    return {
      records: products.map(transformProduct),
      total,
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    throw new Error("Failed to fetch products");
  }
}

export async function getProductById(
  id: string,
): Promise<ProductResponse | null> {
  try {
    const product = await Product.findOne({
      _id: id,
      isActive: true,
    })
      .select(PRODUCT_SELECT_FIELDS)
      .lean<DatabaseProduct | null>();

    if (product === null) {
      return null;
    }

    return transformProduct(product);
  } catch (error) {
    console.error("Error fetching product by id:", error);
    throw new Error("Failed to fetch product");
  }
}
