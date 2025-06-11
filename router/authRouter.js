import express from "express";
import {  changePasHandler, forgotPasHandler, loginHandler, refreshTokenHandler, registerHandler, resendOTPHandler, resetPasHandler, saveFCMTokenHandler, sendOTPHandler, updateProfileHandler, uploadMediaHandler, uploadMultipleMediaHandler, userDetailHandler, verifyOTPHandler } from "../controller/authController.js";
import appUtils from "../utils/appUtils.js";
import authenticate from "../utils/authenticate.js";
import uploadAnyFiles from "../utils/uploadAnyFiles.js";

const authRouter = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user with profile picture
 *     tags: [Auth]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               gender:
 *                 type: integer
 *               profile_pic:
 *                 type: string
 *                 format: binary
 *               otp:
 *                 type: number
 *     responses:
 *       200:
 *         description: User registered successfully
 */

authRouter.post("/register", appUtils?.uploadFile(true), registerHandler);

/**
 * @swagger
 * /auth/sendOTP:
 *   post:
 *     summary: Send OTP to user's email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Invalid email
 *       500:
 *         description: Server error
 */

authRouter.post('/sendOTP', sendOTPHandler )

/**
 * @swagger
 * /auth/resendOTP:
 *   post:
 *     summary: Resend OTP to user's email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *       400:
 *         description: Invalid email
 *       500:
 *         description: Server error
 */

authRouter.post('/resendOTP', resendOTPHandler )
/**
 * @swagger
 * /auth/verifyOTP:
 *   post:
 *     summary: Verify OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: number
 *             required:
 *               - email
 *               - otp
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid OTP
 *       500:
 *         description: Server error
 */


authRouter.post('/verifyOTP', verifyOTPHandler )

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login success
 */

authRouter.post("/login", loginHandler);

/**
 * @swagger
 * /auth/user/details:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Get authenticated user's details
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user details
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
authRouter.get("/user/details",authenticate, userDetailHandler);

/**
 * @swagger
 * /auth/user/update_profile:
 *   patch:
 *     tags:
 *       - Auth
 *     summary: Update authenticated user's profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               username:
 *                 type: string
 *                 format: email
 *               gender:
 *                 type: string
 *               profile_pic:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Successfully updated user profile
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
authRouter.patch("/user/update_profile", authenticate, appUtils?.uploadFile(false),  updateProfileHandler );

/**
 * @swagger
 * /auth/refresh_token:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Refresh user's token
 *     description: Provide a valid refresh token to get a new access token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 example: your-refresh-token
 *     responses:
 *       200:
 *         description: New access token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid or expired refresh token
 *       500:
 *         description: Internal server error
 */
authRouter.post("/refresh_token", refreshTokenHandler );

/**
 * @swagger
 * /auth/forgot_password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Request a password reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *     responses:
 *       200:
 *         description: Password reset link sent successfully
 *       400:
 *         description: Missing or invalid email
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

authRouter.post('/forgot_password',  forgotPasHandler );

/**
 * @swagger
 * /auth/reset_password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Reset user's password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otp
 *               - newPassword
 *               - email
 *             properties:
 *               otp:
 *                 type: number
 *                 description: One-time password (OTP) for resetting the password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: The new password to set
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email associated with the account
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Missing or invalid OTP, email, or new password
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

authRouter.post('/reset_password', resetPasHandler );

/**
 * @swagger
 * /auth/change_password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Change user's password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 format: password
 *                 description: The user's current password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: The new password to set
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Missing or invalid old password or new password
 *       401:
 *         description: Unauthorized or invalid old password
 *       500:
 *         description: Internal server error
 */
authRouter.post('/change_password', authenticate, changePasHandler );

authRouter.post ('/upload_media', appUtils?.uploadFile(true), uploadMediaHandler )

authRouter.post ('/upload_multiple_files', uploadAnyFiles(true) , uploadMultipleMediaHandler );

authRouter.post('/save_FCM_Token', saveFCMTokenHandler );

export default authRouter;
