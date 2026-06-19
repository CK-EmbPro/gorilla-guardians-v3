import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { Readable } from "stream";
import { v2 as cloudinary } from "cloudinary";

const router = Router();

const USE_CLOUDINARY = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (USE_CLOUDINARY) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  cb(null, allowed.includes(file.mimetype));
};

const memUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

const uploadsDir = path.join(process.cwd(), "uploads");
const diskUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

const ALLOWED_FOLDERS = new Set([
  "products", "artisans", "experiences", "events",
  "stories", "categories", "users", "guides",
  "reviews", "packages", "general",
]);

function sanitizeFolder(raw: unknown): string {
  const s = typeof raw === "string" ? raw.toLowerCase().replace(/[^a-z0-9_-]/g, "") : "";
  return ALLOWED_FOLDERS.has(s) ? s : "general";
}

function uploadToCloudinary(buffer: Buffer, mimetype: string, folder: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `gorilla-guardians/${folder}`, resource_type: "image" },
      (error, result) => {
        if (error || !result) reject(error ?? new Error("Cloudinary upload failed"));
        else resolve(result.secure_url);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
}

router.post("/upload", (req, res, next) => {
  const middleware = USE_CLOUDINARY ? memUpload.single("file") : diskUpload.single("file");
  middleware(req, res, next);
}, async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded or invalid file type (JPG, PNG, WebP only)" });
    return;
  }

  if (USE_CLOUDINARY) {
    const folder = sanitizeFolder(req.query.folder);
    const url = await uploadToCloudinary(req.file.buffer!, req.file.mimetype, folder);
    res.json({ url });
  } else {
    const url = `/api/uploads/${req.file.filename}`;
    res.json({ url });
  }
});

export default router;
