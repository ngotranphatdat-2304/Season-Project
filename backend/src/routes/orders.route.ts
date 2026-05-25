import { Router } from "express";
import {
  cancelOrder,
  checkout,
  getOrder,
  listOrders,
} from "../controllers/order.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  validateCheckoutBody,
  validateOrderIdParam,
  validateOrderListQuery,
} from "../middleware/order.validation.js";

const router = Router();

router.post("/", requireAuth, validateCheckoutBody, checkout);
router.get("/", requireAuth, validateOrderListQuery, listOrders);
router.put("/:orderId/cancel", requireAuth, validateOrderIdParam, cancelOrder);
router.get("/:orderId", requireAuth, validateOrderIdParam, getOrder);

export default router;
