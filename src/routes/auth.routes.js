import { Router } from "express";

/* ===============================
   CONTROLLERS
================================ */
import {
  registerUser,
  login,
  logoutUser,
  verifyEmail,
  resendEmailVerification,
  refreshAccessToken,
  forgotPasswordRequest,
  resetforgotPassword,
  changeCurrentpassword,
  getCurrentuser
} from "../controllers/auth.controller.js";

/* ===============================
   MIDDLEWARES
================================ */
import { validate } from "../middlewares/validators.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

/* ===============================
   VALIDATORS
================================ */
import {
  userRegisterValidators,
  userLoginvalidator,
  userForgotPasswordValidator,
  userResetForgotPasswordvalidator,
  userChangeCurrentPasswordValidators
} from "../validatiors/index.js";

const router = Router();

/* =========================================================
   UNSECURED ROUTES (No authentication required)
========================================================= */

// Register a new user
// collect all the errors using userRegisterValidators
// pass it to the middlewares if it is correct throw error or go ahead
// and get user registered through registerUser
router.post(
  "/register",
  userRegisterValidators(),
  validate,
  registerUser
);

// Login user
router.post(
  "/login",
  userLoginvalidator(),
  validate,
  login
);

// Verify email using verification token
router.get(
  "/verify-email/:verificationToken",
  verifyEmail
);

// Refresh access token using refresh token
router.post(
  "/refresh-token",
  refreshAccessToken
);

// Send forgot password email
router.post(
  "/forgot-password",
  userForgotPasswordValidator(),
  validate,
  forgotPasswordRequest
);

// Reset password using reset token
router.post(
  "/reset-password/:resetToken",
  userResetForgotPasswordvalidator(),
  validate,
  resetforgotPassword
);

/* =========================================================
   SECURED ROUTES (JWT authentication required)
========================================================= */

// Logout user
router.post(
  "/logout",
  verifyJWT,
  logoutUser
);

// Get currently logged-in user details
router.post(
  "/current-user",
  verifyJWT,
  getCurrentuser
);

// Change current password
router.post(
  "/change-password",
  verifyJWT,
  userChangeCurrentPasswordValidators(),
  validate,
  changeCurrentpassword
);

// Resend email verification link
router.post(
  "/resend-email-verification",
  verifyJWT,
  resendEmailVerification
);

export default router;
