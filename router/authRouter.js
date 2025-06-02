import express from "express";
import {  loginHandler, registerHandler, resendOTPHandler, sendOTPHandler, userDetailHandler, verifyOTPHandler } from "../controller/authController.js";
import appUtils from "../utils/appUtils.js";
import authenticate from "../utils/authenticate.js";

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

authRouter.post("/register", appUtils?.uploadFile, registerHandler);

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



export default authRouter;
