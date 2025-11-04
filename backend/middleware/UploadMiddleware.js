import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
const productsDir = path.join(uploadsDir, 'products');
const profilesDir = path.join(uploadsDir, 'profiles');

// Ensure directories exist
[uploadsDir, productsDir, profilesDir].forEach(dir => {
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Storage configuration for product images
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Storage configuration for profile pictures
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profilesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Create multer instances
const productUpload = multer({ 
  storage: productStorage,
  fileFilter: fileFilter,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file at a time
  }
});

const profileUpload = multer({ 
  storage: profileStorage,
  fileFilter: fileFilter,
  limits: { 
    fileSize: 2 * 1024 * 1024, // 2MB limit
    files: 1 // Only one file at a time
  }
});

// Middleware wrapper for product images
export const uploadProductImage = (req, res, next) => {
  productUpload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ msg: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ msg: err.message });
    }
    
    // Log for debugging
    if (req.file) {
      console.log('✅ Product image uploaded:', req.file.filename);
      console.log('📁 File path:', req.file.path);
      console.log('📏 File size:', req.file.size, 'bytes');
    }
    
    next();
  });
};

// Middleware wrapper for profile pictures
export const uploadProfileImage = (req, res, next) => {
  profileUpload.single('profileImage')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ msg: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ msg: err.message });
    }
    
    // Log for debugging
    if (req.file) {
      console.log('✅ Profile image uploaded:', req.file.filename);
      console.log('📁 File path:', req.file.path);
      console.log('📏 File size:', req.file.size, 'bytes');
    }
    
    next();
  });
};
