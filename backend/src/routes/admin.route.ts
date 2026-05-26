import { Router } from "express";
import {
  createCollection,
  createProduct,
  getCollections,
  getDashboard,
  getOrders,
  getProducts,
  updateCollection,
  updateOrder,
  updateProduct,
} from "../controllers/admin.controller.js";
import { requireAdmin } from "../middleware/auth.middleware.js";
import {
  validateAdminCollectionBody,
  validateAdminOrderIdParam,
  validateAdminOrderUpdateBody,
  validateAdminOrdersQuery,
  validateAdminProductBody,
  validateAdminProductsQuery,
  validateCollectionIdParam,
  validateProductIdParam,
} from "../middleware/admin.validation.js";

const router = Router();

router.use(requireAdmin);

router.get("/dashboard", getDashboard);

router.get("/products", validateAdminProductsQuery, getProducts);
router.post("/products", validateAdminProductBody, createProduct);
router.put("/products/:productId", validateProductIdParam, validateAdminProductBody, updateProduct);

router.get("/collections", getCollections);
router.post("/collections", validateAdminCollectionBody, createCollection);
router.put(
  "/collections/:collectionId",
  validateCollectionIdParam,
  validateAdminCollectionBody,
  updateCollection,
);

router.get("/orders", validateAdminOrdersQuery, getOrders);
router.patch(
  "/orders/:orderId",
  validateAdminOrderIdParam,
  validateAdminOrderUpdateBody,
  updateOrder,
);

export default router;
