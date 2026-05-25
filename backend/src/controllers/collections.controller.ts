import type { Request, Response } from "express";
import type { CollectionProductsValidatedRequest } from "../middleware/products.validation.js";
import {
  getCollectionFilters as getCollectionFiltersData,
  getCollectionProductsBySlug,
} from "../services/collections.service.js";
import type {
  CollectionFiltersResponseData,
  ErrorResponse,
  ProductsResponseData,
} from "../types/product.types.js";

export async function getCollectionFilters(
  _req: Request,
  res: Response<CollectionFiltersResponseData | ErrorResponse>,
): Promise<void> {
  try {
    const responseData = await getCollectionFiltersData();
    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error in getCollectionFilters controller:", error);
    res.status(500).json({
      success: false,
      error: {
        statusCode: 500,
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
    });
  }
}

export async function getCollectionProducts(
  req: CollectionProductsValidatedRequest,
  res: Response<ProductsResponseData | ErrorResponse>,
): Promise<void> {
  try {
    const slug = req.params.slug;
    const query = req.validatedQuery;

    if (slug === undefined || Array.isArray(slug) || query === undefined) {
      res.status(400).json({
        success: false,
        error: {
          statusCode: 400,
          code: "BAD_REQUEST",
          message: "Missing collection slug or query.",
        },
      });
      return;
    }

    const responseData = await getCollectionProductsBySlug(slug, query);
    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error in getCollectionProducts controller:", error);
    res.status(500).json({
      success: false,
      error: {
        statusCode: 500,
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
    });
  }
}
