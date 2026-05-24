import { Collection } from "../models/Collection.js";
import { Eyeglasses } from "../models/Eyeglasses.js";
import { Sunglasses } from "../models/Sunglasses.js";
import type {
  CollectionFiltersResponseData,
  CollectionProductResponse,
  CollectionProductsResponseData,
  EyeglassesProductResponse,
  SunglassesProductResponse,
  ValidatedCollectionProductsQuery,
} from "../types/eyewear.js";
import { buildSort } from "./utils.js";
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

function buildCollectionProductsProject(type: "Eyeglasses" | "Sunglasses") {
  return {
    _id: 1,
    name: 1,
    slug: 1,
    type: { $literal: type },
    collectionId: 1,
    brand: 1,
    salePercent: 1,
    availability: 1,
    description: 1,
    variants: 1,
    rating: 1,
    isActive: 1,
    specifications: 1,
    sortPrice: {
      $ifNull: [{ $arrayElemAt: ["$variants.price", 0] }, 0],
    },
  };
}

function transformCollectionProduct(product: {
  _id: unknown;
  name: string;
  slug: string;
  type: string;
  collectionId: Types.ObjectId | string;
  brand: string;
  salePercent: number;
  availability: string;
  description: string;
  variants: unknown[];
  rating: unknown;
  isActive: boolean;
  specifications: unknown;
}): CollectionProductResponse {
  if (product.type === "Eyeglasses") {
    return {
      id: String(product._id),
      name: product.name,
      slug: product.slug,
      type: product.type,
      collectionId: String(product.collectionId),
      brand: product.brand,
      salePercent: product.salePercent,
      availability: product.availability as EyeglassesProductResponse["availability"],
      description: product.description,
      variants: product.variants as EyeglassesProductResponse["variants"],
      rating: product.rating as EyeglassesProductResponse["rating"],
      isActive: product.isActive,
      specifications:
        product.specifications as EyeglassesProductResponse["specifications"],
    };
  }

  return {
    id: String(product._id),
    name: product.name,
    slug: product.slug,
    type: product.type,
    collectionId: String(product.collectionId),
    brand: product.brand,
    salePercent: product.salePercent,
    availability: product.availability as SunglassesProductResponse["availability"],
    description: product.description,
    variants: product.variants as SunglassesProductResponse["variants"],
    rating: product.rating as SunglassesProductResponse["rating"],
    isActive: product.isActive,
    specifications:
      product.specifications as SunglassesProductResponse["specifications"],
  };
}

export async function getCollectionProductsBySlug(
  collectionSlug: string,
  query: ValidatedCollectionProductsQuery,
): Promise<CollectionProductsResponseData> {
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
  };

  const aggregation = await Eyeglasses.aggregate<{
    records: Array<{
      _id: unknown;
      name: string;
      slug: string;
      type: string;
      collectionId: Types.ObjectId | string;
      brand: string;
      salePercent: number;
      availability: string;
      description: string;
      variants: unknown[];
      rating: unknown;
      isActive: boolean;
      specifications: unknown;
    }>;
    total: Array<{ count: number }>;
  }>([
    { $match: match },
    { $project: buildCollectionProductsProject("Eyeglasses") },
    {
      $unionWith: {
        coll: Sunglasses.collection.name,
        pipeline: [
          { $match: match },
          { $project: buildCollectionProductsProject("Sunglasses") },
        ],
      },
    },
    { $sort: buildSort(query.sort) },
    {
      $facet: {
        records: [
          { $skip: query.offset },
          { $limit: query.limit },
          { $project: { sortPrice: 0 } },
        ],
        total: [{ $count: "count" }],
      },
    },
  ]);

  const result = aggregation[0] ?? { records: [], total: [] };

  return {
    records: result.records.map(transformCollectionProduct),
    total: result.total[0]?.count ?? 0,
  };
}
