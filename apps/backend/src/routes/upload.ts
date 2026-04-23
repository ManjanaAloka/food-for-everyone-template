import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { ah } from '../utils/asyncHandler.js';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

export const router = Router();

// Configure Cloudinary (falls back to no-op if env vars not set)
const cloudinaryConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = 'uploads/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

// ─── Upload a single image ────────────────────────────────────────────────────
router.post('/', requireAuth, upload.single('image'), ah(async (req: any, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  // If Cloudinary is configured, we could still upload there, 
  // but for local dev with XAMPP, saving to disk is more reliable.
  
  const protocol = req.protocol;
  const host = req.get('host');
  const imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

  res.json({ 
    url: imageUrl, 
    publicId: req.file.filename,
    message: 'Image uploaded locally' 
  });
}));
