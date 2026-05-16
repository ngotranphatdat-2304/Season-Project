import { Sunglasses } from "../models/Sunglasses.js";
import type {
  DatabaseSunglassesProduct,
  SunglassesProductResponse,
  SunglassesResponseData,
  ValidatedSunglassesQuery,
} from "../types/eyewear.js";

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
    const filter = { isActive: true };
    const total = await Sunglasses.countDocuments(filter);

    const products = await Sunglasses.find(filter)
      .select(
        "name slug type collectionId brand salePercent availability description specifications variants rating isActive",
      )
      .skip(query.offset)
      .limit(query.limit)
      .lean<DatabaseSunglassesProduct[]>();

    return {
      products: products.map(transformSunglassesProduct),
      pagination: {
        offset: query.offset,
        limit: query.limit,
        total,
        hasMore: query.offset + query.limit < total,
      },
    };
  } catch (error) {
    console.error("Error fetching sunglasses:", error);
    throw new Error("Failed to fetch sunglasses");
  }
}
