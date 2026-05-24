import { Router } from "express";
import {
  getEyeglasses,
  getEyeglassById,
} from "../controllers/eyeglassesController.js";
import { validateEyeglassesQuery } from "../middleware/validation.js";

const router = Router();

router.get("/", validateEyeglassesQuery, getEyeglasses);
router.get("/:id", getEyeglassById);

export default router;
