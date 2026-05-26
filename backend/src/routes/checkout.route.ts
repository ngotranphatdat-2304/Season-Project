import { Router } from "express";
import {
  completeCheckout,
  getCheckoutSession,
  initCheckout,
} from "../controllers/checkout.controller.js";
import { optionalAuth } from "../middleware/auth.middleware.js";
import { validateCheckoutCompleteBody } from "../middleware/checkout.validation.js";
import { guestSession } from "../middleware/guest-session.js";

const checkoutRouter = Router();

checkoutRouter.use(optionalAuth);
checkoutRouter.use(guestSession({ createIfMissing: false }));
checkoutRouter.post("/init", initCheckout);
checkoutRouter.get("/:token", getCheckoutSession);
checkoutRouter.post("/:token/complete", validateCheckoutCompleteBody, completeCheckout);

export default checkoutRouter;
