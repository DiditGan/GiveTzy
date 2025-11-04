import express from "express";
import db from "./config/Database.js";
import UserRoute from "./routes/UserRoute.js";
import AuthRoute from "./routes/AuthRoute.js";
import BarangRoute from "./routes/BarangRoute.js";
import TransaksiRoute from "./routes/TransaksiRoute.js";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();

// Gunakan env _CORS_ORIGIN atau fallback ke localhost:5173
const allowedOrigins = [
  process.env._CORS_ORIGIN || "http://localhost:5173",
  "http://localhost:3000", // tambahkan jika frontend kadang di port 3000
  "http://localhost:5000", // tambahkan jika testing di port backend
  "https://givetzy-frontend-469569820136.us-central1.run.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(
        new Error("CORS not allowed from this origin: " + origin),
        false
      );
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/public", express.static(path.join(path.resolve(), "public")));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create necessary directories for uploads
const uploadsDir = path.join(__dirname, 'uploads');
const productsDir = path.join(uploadsDir, 'products');
const profilesDir = path.join(uploadsDir, 'profiles');

[uploadsDir, productsDir, profilesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// Create public/images directory if it doesn't exist
const publicDir = path.join(__dirname, "public");
const imagesDir = path.join(publicDir, "images");

[publicDir, imagesDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// Add logging middleware first
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Routes - pastikan urutan sudah benar
app.use("/api/auth", AuthRoute);  // Auth routes: /api/auth/register, /api/auth/login
app.use("/api", UserRoute);       // User routes: /api/profile, /api/users/:id
app.use("/api", BarangRoute);     // Barang routes: /api/barang
app.use("/api", TransaksiRoute);  // Transaksi routes: /api/transaksi

// Test route
app.get("/api/status", (req, res) => {
  res.json({ status: "Server is running", timestamp: new Date() });
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ msg: "Internal server error" });
});

// Synchronize database and start server
(async () => {
  try {
    await db.sync(); // This will create tables if they don't exist
    console.log("Database synchronized successfully.");

    // Start the server only after successful synchronization
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to synchronize the database:", error);
  }
})();
