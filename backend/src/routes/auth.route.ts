import { Router } from "express";
import {
  adminLogin,
  adminRegister,
  login,
  logout,
  me,
  refreshToken,
  register,
} from "../controllers/auth.controller.js";
import { optionalAuth } from "../middleware/auth.middleware.js";
import {
  validateAdminRegisterBody,
  validateLoginBody,
  validateRefreshTokenBody,
  validateRegisterBody,
} from "../middleware/auth.validation.js";
import { guestSession } from "../middleware/guest-session.js";
import { createIpRateLimiter } from "../middleware/rate-limit.js";

const router = Router();
const authRateLimit = createIpRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 30,
  message: "Too many authentication attempts. Try again later.",
});

router.post(
  "/admin/register",
  authRateLimit,
  guestSession({ createIfMissing: false }),
  validateAdminRegisterBody,
  adminRegister,
);
router.post(
  "/admin/login",
  authRateLimit,
  guestSession({ createIfMissing: false }),
  validateLoginBody,
  adminLogin,
);
router.post(
  "/register",
  authRateLimit,
  guestSession({ createIfMissing: false }),
  validateRegisterBody,
  register,
);
router.post(
  "/login",
  authRateLimit,
  guestSession({ createIfMissing: false }),
  validateLoginBody,
  login,
);
router.get("/me", optionalAuth, me);
router.post("/refresh-token", authRateLimit, validateRefreshTokenBody, refreshToken);
router.post("/logout", validateRefreshTokenBody, logout);

export default router;
