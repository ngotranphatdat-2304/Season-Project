import type { Response } from "express";
import { getEyeglassesByFilters } from "../services/eyeglassesService.js";
import type { ErrorResponse, EyewearResponseData } from "../types/eyewear.js";
import type { EyeglassesValidatedRequest } from "../middleware/validation.js";

export async function getEyeglasses(
  req: EyeglassesValidatedRequest,
  res: Response<EyewearResponseData | ErrorResponse>,
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
