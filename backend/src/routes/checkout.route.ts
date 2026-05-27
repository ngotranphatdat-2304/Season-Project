import { Router } from "express";
import {
  completeCheckout,
  createPayOSCheckoutPayment,
  getPayOSCheckoutPaymentStatus,
  getCheckoutSession,
  initCheckout,
  receivePayOSWebhook,
} from "../controllers/checkout.controller.js";
import { optionalAuth } from "../middleware/auth.middleware.js";
import { validateCheckoutCompleteBody } from "../middleware/checkout.validation.js";
import { guestSession } from "../middleware/guest-session.js";

const checkoutRouter = Router();

checkoutRouter.post("/payos/webhook", receivePayOSWebhook);
checkoutRouter.use(optionalAuth);
checkoutRouter.use(guestSession({ createIfMissing: false }));
checkoutRouter.get("/payment-status", getPayOSCheckoutPaymentStatus);
checkoutRouter.post("/init", initCheckout);
checkoutRouter.get("/:token", getCheckoutSession);
checkoutRouter.post("/:token/complete", validateCheckoutCompleteBody, completeCheckout);
checkoutRouter.post(
  "/:token/payos",
  validateCheckoutCompleteBody,
  createPayOSCheckoutPayment,
);

export default checkoutRouter;
