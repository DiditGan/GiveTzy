import express from "express";
import { register, login, logout, refreshToken } from "../controllers/AuthController.js";

const router = express.Router();

// Auth routes - pastikan path sudah benar
router.post("/register", register); // URL lengkap: /api/auth/register
router.post("/login", login);       // URL lengkap: /api/auth/login
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);

export default router;