import { Collection } from "../models/Collection.js";
import { Eyeglasses } from "../models/Eyeglasses.js";
import type {
  DatabaseEyeglassesProduct,
  EyeglassesProductResponse,
  EyeglassesResponseData,
  ValidatedEyeglassesQuery,
} from "../types/eyewear.js";
import { buildSort } from "./utils.js";

const PRODUCT_SELECT_FIELDS =
  "name slug type collectionId brand salePercent availability description specifications variants rating isActive";

function buildFilter(query: ValidatedEyeglassesQuery): Record<string, unknown> {
  const filter: Record<string, unknown> = {
    isActive: true,
  };

  if (query.frameType !== null) {
    filter["specifications.frameType.material"] = query.frameType;
  }

  if (query.frameSize !== null) {
    filter["specifications.frameType.size"] = query.frameSize;
  }

  if (query.gender !== null) {
    filter["specifications.gender"] = query.gender;
  }

  if (query.sale === true) {
    filter.salePercent = { $gt: 0 };
  }

  return filter;
}

function transformEyeglassesProduct(
  product: DatabaseEyeglassesProduct,
): EyeglassesProductResponse {
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

export async function getEyeglassesByFilters(
  query: ValidatedEyeglassesQuery,
): Promise<EyeglassesResponseData> {
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

    const total = await Eyeglasses.countDocuments(filter);

    const products = await Eyeglasses.find(filter)
      .select(PRODUCT_SELECT_FIELDS)
      .sort(buildSort(query.sort))
      .skip(query.offset)
      .limit(query.limit)
      .lean<DatabaseEyeglassesProduct[]>();

    return {
      records: products.map(transformEyeglassesProduct),
      total,
    };
  } catch (error) {
    console.error("Error fetching eyeglasses:", error);
    throw new Error("Failed to fetch eyeglasses");
  }
}

export async function getEyeglassesById(
  id: string,
): Promise<EyeglassesProductResponse | null> {
  try {
    const product = await Eyeglasses.findOne({
      _id: id,
      isActive: true,
    })
      .select(PRODUCT_SELECT_FIELDS)
      .lean<DatabaseEyeglassesProduct | null>();

    if (product === null) {
      return null;
    }

    return transformEyeglassesProduct(product);
  } catch (error) {
    console.error("Error fetching eyeglasses by id:", error);
    throw new Error("Failed to fetch eyeglasses");
  }
}
