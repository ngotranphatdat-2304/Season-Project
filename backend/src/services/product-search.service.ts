import type { PipelineStage } from "mongoose";
import { Product } from "../models/product.model.js";
import type {
  DatabaseProduct,
  ProductSearchResponseData,
  SearchProductResponse,
  ValidatedProductSearchQuery,
} from "../types/product.types.js";

const PRODUCT_SEARCH_INDEX = "products_search";

type SearchAggregateRecord = DatabaseProduct & {
  score?: number;
};

function transformSearchProduct(
  product: SearchAggregateRecord,
): SearchProductResponse {
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
    score: product.score ?? 0,
  };
}

function buildSearchStage(
  query: ValidatedProductSearchQuery,
): PipelineStage.Search {
  return {
    $search: {
      index: PRODUCT_SEARCH_INDEX,
      compound: {
        should: [
          {
            text: {
              path: {
                wildcard: "*",
              },
              query: query.q,
              fuzzy: {
                maxEdits: 1,
                prefixLength: 1,
                maxExpansions: 50,
              },
              score: {
                boost: {
                  value: 8,
                },
              },
            },
          },
        ],
        minimumShouldMatch: 1,
      },
    },
  };
}

function buildPostSearchMatch(
  query: ValidatedProductSearchQuery,
): PipelineStage.Match["$match"] {
  const filter: Record<string, unknown> = {
    isActive: true,
  };

  if (query.type !== null) {
    filter.type = query.type;
  }

  if (query.gender !== null) {
    filter["specifications.gender"] = query.gender;
  }

  if (query.sale === true) {
    filter.salePercent = { $gt: 0 };
  }

  return filter;
}

export async function searchProducts(
  query: ValidatedProductSearchQuery,
): Promise<ProductSearchResponseData> {
  try {
    const searchStage = buildSearchStage(query);
    const postSearchMatch = buildPostSearchMatch(query);
    const recordsPipeline: PipelineStage[] = [
      searchStage,
      { $match: postSearchMatch },
      {
        $project: {
          name: 1,
          slug: 1,
          type: 1,
          collectionId: 1,
          brand: 1,
          salePercent: 1,
          availability: 1,
          description: 1,
          specifications: 1,
          variants: 1,
          rating: 1,
          isActive: 1,
          score: { $meta: "searchScore" },
        },
      },
      { $sort: { score: -1, _id: 1 } },
      { $skip: query.offset },
      { $limit: query.limit },
    ];

    const totalPipeline: PipelineStage[] = [
      searchStage,
      { $match: postSearchMatch },
      { $count: "total" },
    ];

    const [records, totalResult] = await Promise.all([
      Product.aggregate<SearchAggregateRecord>(recordsPipeline),
      Product.aggregate<{ total: number }>(totalPipeline),
    ]);

    return {
      records: records.map(transformSearchProduct),
      total: totalResult[0]?.total ?? 0,
    };
  } catch (error) {
    console.error("Error searching products:", error);
    throw new Error("Failed to search products");
  }
}
