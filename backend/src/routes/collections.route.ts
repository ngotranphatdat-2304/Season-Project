import { Router } from "express";
import {
  getCollectionFilters,
  getCollectionProducts,
} from "../controllers/collections.controller.js";
import { validateCollectionProductsQuery } from "../middleware/products.validation.js";

const router = Router();

router.get("/:slug/products", validateCollectionProductsQuery, getCollectionProducts);
router.get("/", getCollectionFilters);

export default router;
