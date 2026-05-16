import { Eyeglasses } from "../models/Eyeglasses.js";
import type {
  DatabaseEyeglassesProduct,
  EyeglassesProductResponse,
  EyeglassesResponseData,
  ValidatedEyeglassesQuery,
} from "../types/eyewear.js";

function buildFilter(query: ValidatedEyeglassesQuery): Record<string, unknown> {
  const filter: Record<string, unknown> = {
    isActive: true,
  };

  if (query.frameType !== null) {
    filter["specifications.frameType.material"] = query.frameType;
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
    const total = await Eyeglasses.countDocuments(filter);

    const products = await Eyeglasses.find(filter)
      .select(
        "name slug type collectionId brand salePercent availability description specifications variants rating isActive",
      )
      .skip(query.offset)
      .limit(query.limit)
      .lean<DatabaseEyeglassesProduct[]>();

    return {
      products: products.map(transformEyeglassesProduct),
      pagination: {
        offset: query.offset,
        limit: query.limit,
        total,
        hasMore: query.offset + query.limit < total,
      },
    };
  } catch (error) {
    console.error("Error fetching eyeglasses:", error);
    throw new Error("Failed to fetch eyeglasses");
  }
}
