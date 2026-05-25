import mongoose from "mongoose";
import type { Response } from "express";
import { AppError } from "../errors/app-error.js";
import {
  getProductById,
  getProductsByFilters,
} from "../services/products.service.js";
import { searchProducts } from "../services/product-search.service.js";
import type {
  ErrorResponse,
  ProductResponse,
  ProductSearchResponseData,
  ProductsResponseData,
} from "../types/product.types.js";
import type {
  ProductSearchValidatedRequest,
  ProductValidatedRequest,
} from "../middleware/products.validation.js";

export async function getProducts(
  req: ProductValidatedRequest,
  res: Response<ProductsResponseData | ErrorResponse>,
): Promise<void> {
  const validatedQuery = req.validatedQuery;

  if (validatedQuery === undefined) {
    throw AppError.badRequest("Invalid query parameters");
  }

  res.status(200).json(await getProductsByFilters(validatedQuery));
}

export async function getProduct(
  req: { params: { id?: string } },
  res: Response<ProductResponse | ErrorResponse>,
): Promise<void> {
  const id = req.params.id;

  if (id === undefined || id.trim() === "" || !mongoose.Types.ObjectId.isValid(id)) {
    throw AppError.notFound("Product not found");
  }

  const product = await getProductById(id);

  if (product === null) {
    throw AppError.notFound("Product not found");
  }

  res.status(200).json(product);
}

export async function searchProductsByQuery(
  req: ProductSearchValidatedRequest,
  res: Response<ProductSearchResponseData | ErrorResponse>,
): Promise<void> {
  const validatedQuery = req.validatedQuery;

  if (validatedQuery === undefined) {
    throw AppError.badRequest("Invalid search query parameters");
  }

  res.status(200).json(await searchProducts(validatedQuery));
}
