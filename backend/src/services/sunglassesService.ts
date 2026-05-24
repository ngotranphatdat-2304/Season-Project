import { Collection } from "../models/Collection.js";
import { Sunglasses } from "../models/Sunglasses.js";
import type {
  DatabaseSunglassesProduct,
  SunglassesProductResponse,
  SunglassesResponseData,
  ValidatedSunglassesQuery,
} from "../types/eyewear.js";
import { buildSort } from "./utils.js";

const PRODUCT_SELECT_FIELDS =
  "name slug type collectionId brand salePercent availability description specifications variants rating isActive";

function transformSunglassesProduct(
  product: DatabaseSunglassesProduct,
): SunglassesProductResponse {
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

export async function getSunglassesByFilters(
  query: ValidatedSunglassesQuery,
): Promise<SunglassesResponseData> {
  try {
    const filter: Record<string, unknown> = {
      isActive: true,
    };

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

    if (query.gender !== null) {
      filter["specifications.gender"] = query.gender;
    }

    if (query.sale === true) {
      filter.salePercent = { $gt: 0 };
    }

    const total = await Sunglasses.countDocuments(filter);

    const products = await Sunglasses.find(filter)
      .select(PRODUCT_SELECT_FIELDS)
      .sort(buildSort(query.sort))
      .skip(query.offset)
      .limit(query.limit)
      .lean<DatabaseSunglassesProduct[]>();

    return {
      records: products.map(transformSunglassesProduct),
      total,
    };
  } catch (error) {
    console.error("Error fetching sunglasses:", error);
    throw new Error("Failed to fetch sunglasses");
  }
}

export async function getSunglassesById(
  id: string,
): Promise<SunglassesProductResponse | null> {
  try {
    const product = await Sunglasses.findOne({
      _id: id,
      isActive: true,
    })
      .select(PRODUCT_SELECT_FIELDS)
      .lean<DatabaseSunglassesProduct | null>();

    if (product === null) {
      return null;
    }

    return transformSunglassesProduct(product);
  } catch (error) {
    console.error("Error fetching sunglasses by id:", error);
    throw new Error("Failed to fetch sunglasses");
  }
}
