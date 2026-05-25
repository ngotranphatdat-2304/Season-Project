import { Router } from "express";
import {
  changePassword,
  createAddress,
  deleteAddress,
  deleteMe,
  getAddresses,
  getProfile,
  setDefaultAddress,
  updateAddress,
  updateProfile,
} from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  validateAddressIdParam,
  validateChangePasswordBody,
  validateCreateAddressBody,
  validateProfileUpdateBody,
  validateUpdateAddressBody,
} from "../middleware/user.validation.js";

const router = Router();

router.use(requireAuth);
router.get("/profile", getProfile);
router.put("/profile", validateProfileUpdateBody, updateProfile);
router.put("/change-password", validateChangePasswordBody, changePassword);
router.get("/addresses", getAddresses);
router.post("/addresses", validateCreateAddressBody, createAddress);
router.put(
  "/addresses/:addressId/set-default",
  validateAddressIdParam,
  setDefaultAddress,
);
router.put(
  "/addresses/:addressId",
  validateAddressIdParam,
  validateUpdateAddressBody,
  updateAddress,
);
router.delete("/addresses/:addressId", validateAddressIdParam, deleteAddress);
router.delete("/me", deleteMe);

export default router;
