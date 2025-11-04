import User from "../models/UserModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Store refresh tokens - in production, use Redis or database
let refreshTokens = [];

// Ensure token secrets are set, with fallbacks for development
const _ACCESS_TOKEN_SECRET =
  process.env._ACCESS_TOKEN_SECRET || "access_secret_dev_key";
const _REFRESH_TOKEN_SECRET =
  process.env._REFRESH_TOKEN_SECRET || "refresh_secret_dev_key";

export const register = async (req, res) => {
  try {
    console.log("📝 Register request received:", req.body); // Log request
    
    const { name, email, password, phone_number, address } = req.body;

    // Validasi input
    if (!name || !email || !password) {
      return res.status(400).json({ msg: "Nama, email, dan password wajib diisi" });
    }

    // Validasi email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ msg: "Format email tidak valid" });
    }

    // Validasi password minimal 6 karakter
    if (password.length < 6) {
      return res.status(400).json({ msg: "Password minimal 6 karakter" });
    }

    // Cek apakah email sudah terdaftar
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ msg: "Email sudah terdaftar" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Buat user baru
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      phone_number: phone_number || null,
      address: address || null,
      created_at: new Date(),
    });

    // PERBAIKAN: Gunakan variabel yang konsisten dengan .env
    const ACCESS_TOKEN_SECRET =
      process.env._ACCESS_TOKEN_SECRET || "access_secret_dev_key";
    const REFRESH_TOKEN_SECRET =
      process.env._REFRESH_TOKEN_SECRET || "refresh_secret_dev_key";

    // Generate JWT tokens dengan user_id (bukan userId)
    const accessToken = jwt.sign(
      { user_id: newUser.user_id, email: newUser.email },
      ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { user_id: newUser.user_id, email: newUser.email },
      REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    // Update refresh token di database
    await newUser.update({ refresh_token: refreshToken });

    // Set refresh token cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    // Return response
    console.log("✅ Registration successful for user:", newUser.email); // Log success
    res.status(201).json({
      msg: "Registrasi berhasil",
      accessToken,
      refreshToken,
      user: {
        user_id: newUser.user_id,
        name: newUser.name,
        email: newUser.email,
        phone_number: newUser.phone_number,
        address: newUser.address,
      },
    });
  } catch (error) {
    console.error("❌ Register error:", error); // Log error detail
    console.error("Error stack:", error.stack); // Log error stack

    // Handle Sequelize validation errors
    if (error.name === "SequelizeValidationError") {
      const messages = error.errors.map((err) => err.message);
      return res.status(400).json({ msg: messages.join(", ") });
    }

    // Handle Sequelize unique constraint errors
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ msg: "Email sudah terdaftar" });
    }

    res.status(500).json({ 
      msg: "Terjadi kesalahan pada server", 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' 
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validasi input
    if (!email || !password) {
      return res.status(400).json({ msg: "Email dan password wajib diisi" });
    }

    // Cari user berdasarkan email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ msg: "Email atau password salah" });
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ msg: "Email atau password salah" });
    }

    // PERBAIKAN: Gunakan variabel yang konsisten
    const ACCESS_TOKEN_SECRET =
      process.env._ACCESS_TOKEN_SECRET || "access_secret_dev_key";
    const REFRESH_TOKEN_SECRET =
      process.env._REFRESH_TOKEN_SECRET || "refresh_secret_dev_key";

    // Generate JWT tokens dengan user_id (bukan userId)
    const accessToken = jwt.sign(
      { user_id: user.user_id, email: user.email },
      ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { user_id: user.user_id, email: user.email },
      REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    // Update refresh token di database
    await user.update({ refresh_token: refreshToken });

    // Set refresh token cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    // Return response
    res.json({
      msg: "Login berhasil",
      accessToken,
      refreshToken,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        address: user.address,
        profile_picture: user.profile_picture,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(500)
      .json({ msg: "Terjadi kesalahan pada server", error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(204).json({ msg: "No refresh token" });
    }

    const user = await User.findOne({ where: { refresh_token: refreshToken } });
    if (!user) {
      return res.status(204).json({ msg: "User not found" });
    }

    await user.update({ refresh_token: null });
    res.clearCookie("refreshToken");
    res.json({ msg: "Logout berhasil" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ msg: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ msg: "Refresh token tidak ditemukan" });
    }

    const user = await User.findOne({ where: { refresh_token: refreshToken } });
    if (!user) {
      return res.status(403).json({ msg: "Invalid refresh token" });
    }

    // PERBAIKAN: Gunakan variabel yang konsisten
    const REFRESH_TOKEN_SECRET =
      process.env._REFRESH_TOKEN_SECRET || "refresh_secret_dev_key";
    const ACCESS_TOKEN_SECRET =
      process.env._ACCESS_TOKEN_SECRET || "access_secret_dev_key";

    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ msg: "Invalid refresh token" });
      }

      const accessToken = jwt.sign(
        { user_id: user.user_id, email: user.email },
        ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
      );

      res.json({ accessToken });
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ msg: error.message });
  }
};
