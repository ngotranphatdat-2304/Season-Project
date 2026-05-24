import mongoose from "mongoose";
import type { Response } from "express";
import {
  getEyeglassesByFilters,
  getEyeglassesById,
} from "../services/eyeglassesService.js";
import type {
  ErrorResponse,
  EyeglassesProductResponse,
  EyeglassesResponseData,
} from "../types/eyewear.js";
import type { EyeglassesValidatedRequest } from "../middleware/validation.js";

export async function getEyeglasses(
  req: EyeglassesValidatedRequest,
  res: Response<EyeglassesResponseData | ErrorResponse>,
): Promise<void> {
  try {
    const validatedQuery = req.validatedQuery;

    if (validatedQuery === undefined) {
      res.status(400).json({
        error: "Invalid query parameters",
      });
      return;
    }

    const responseData = await getEyeglassesByFilters(validatedQuery);

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error in getEyeglasses controller:", error);

    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}

export async function getEyeglassById(
  req: { params: { id?: string } },
  res: Response<EyeglassesProductResponse | ErrorResponse>,
): Promise<void> {
  try {
    const id = req.params.id;

    if (id === undefined || id.trim() === "") {
      res.status(404).json({
        error: "Product not found",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(404).json({
        error: "Product not found",
      });
      return;
    }

    const product = await getEyeglassesById(id);

    if (product === null) {
      res.status(404).json({
        error: "Product not found",
      });
      return;
    }

    res.status(200).json(product);
  } catch (error) {
    console.error("Error in getEyeglassById controller:", error);

    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
