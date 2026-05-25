import express from "express";
import {
  getProduct,
  getProducts,
} from "../controllers/products.controller.js";
import { validateProductQuery } from "../middleware/products.validation.js";

const router = express.Router();

router.get("/", validateProductQuery, getProducts);
router.get("/:id", getProduct);

export default router;
