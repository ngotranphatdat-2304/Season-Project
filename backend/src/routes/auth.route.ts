import { Router } from "express";
import {
  login,
  logout,
  me,
  refreshToken,
  register,
} from "../controllers/auth.controller.js";
import { optionalAuth } from "../middleware/auth.middleware.js";
import {
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
