import mongoose from "mongoose";
import type { Response } from "express";
import {
  getSunglassesByFilters,
  getSunglassesById,
} from "../services/sunglassesService.js";
import type {
  ErrorResponse,
  SunglassesProductResponse,
  SunglassesResponseData,
} from "../types/eyewear.js";
import type { SunglassesValidatedRequest } from "../middleware/validation.js";

export async function getSunglasses(
  req: SunglassesValidatedRequest,
  res: Response<SunglassesResponseData | ErrorResponse>,
): Promise<void> {
  try {
    const validatedQuery = req.validatedQuery;

    if (validatedQuery === undefined) {
      res.status(400).json({
        error: "Invalid query parameters",
      });
      return;
    }

    const responseData = await getSunglassesByFilters(validatedQuery);

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error in getSunglasses controller:", error);

    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}

export async function getSunglassById(
  req: { params: { id?: string } },
  res: Response<SunglassesProductResponse | ErrorResponse>,
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

    const product = await getSunglassesById(id);

    if (product === null) {
      res.status(404).json({
        error: "Product not found",
      });
      return;
    }

    res.status(200).json(product);
  } catch (error) {
    console.error("Error in getSunglassById controller:", error);

    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
