import { Router } from "express";
import {
  getSunglasses,
  getSunglassById,
} from "../controllers/sunglassesController.js";
import { validateSunglassesQuery } from "../middleware/validation.js";

const router = Router();

router.get("/", validateSunglassesQuery, getSunglasses);
router.get("/:id", getSunglassById);

export default router;
