import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directories
const uploadsDir = path.join(__dirname, '..', 'uploads');
const productsDir = path.join(uploadsDir, 'products');
const profilesDir = path.join(uploadsDir, 'profiles');

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
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Create multer instances
const productUpload = multer({ 
  storage: productStorage,
  fileFilter: fileFilter,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  }
});

const profileUpload = multer({ 
  storage: profileStorage,
  fileFilter: fileFilter,
  limits: { 
    fileSize: 2 * 1024 * 1024, // 2MB limit
    files: 1
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
    
    if (req.file) {
      console.log('✅ Profile image uploaded:', req.file.filename);
      console.log('📁 File path:', req.file.path);
      console.log('📏 File size:', req.file.size, 'bytes');
    }
    
    next();
  });
};
