import { Router } from "express";
import {
  addCartItem,
  addCartSkuItem,
  bootstrapGuestCartSession,
  clearCart,
  getCart,
  removeCartItem,
  removeCartSkuItem,
  updateCartItem,
  updateCartSkuItem,
} from "../controllers/cart.controller.js";
import { optionalAuth } from "../middleware/auth.middleware.js";
import {
  validateAddCartItemBody,
  validateAddCartSkuBody,
  validateCartProductParam,
  validateCartSkuParam,
  validateUpdateCartItemBody,
  validateUpdateCartSkuBody,
} from "../middleware/cart.validation.js";
import { guestSession } from "../middleware/guest-session.js";

const cartRouter = Router();

cartRouter.use(optionalAuth);
cartRouter.get("/bootstrap", guestSession({ createIfMissing: true }), bootstrapGuestCartSession);
cartRouter.use(guestSession({ createIfMissing: false }));
cartRouter.get("/", getCart);
cartRouter.post("/", validateAddCartSkuBody, addCartSkuItem);
cartRouter.put("/:sku", validateCartSkuParam, validateUpdateCartSkuBody, updateCartSkuItem);
cartRouter.delete("/:sku", validateCartSkuParam, removeCartSkuItem);
cartRouter.delete("/", clearCart);
cartRouter.post("/items", validateAddCartItemBody, addCartItem);
cartRouter.patch(
  "/items/:productId",
  validateCartProductParam,
  validateUpdateCartItemBody,
  updateCartItem,
);
cartRouter.delete("/items/:productId", validateCartProductParam, removeCartItem);

export default cartRouter;
