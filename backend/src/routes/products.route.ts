import express from "express";
import {
  getProduct,
  getProducts,
  searchProductsByQuery,
} from "../controllers/products.controller.js";
import {
  validateProductQuery,
  validateProductSearchQuery,
} from "../middleware/products.validation.js";

const router = express.Router();

router.get("/search", validateProductSearchQuery, searchProductsByQuery);
router.get("/", validateProductQuery, getProducts);
router.get("/:id", getProduct);

export default router;
