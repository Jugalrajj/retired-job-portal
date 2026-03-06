import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

// Cloudinary Storage Configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // CLEAN FILENAME: Remove extension and replace spaces with underscores
    const cleanFileName = file.originalname.split(".")[0].replace(/\s+/g, "_");

    // Separate folders for better organization
    if (file.mimetype === "application/pdf") {
      return {
        folder: "ivgjobs_uploads/resumes",
        // CRITICAL FIX: Use "image" instead of "raw" so it can be viewed inline in the iframe
        resource_type: "image", 
        format: "pdf", // Explicitly format as pdf
        public_id: `${Date.now()}-${cleanFileName}` 
      };
    } else {
      return {
        folder: "ivgjobs_uploads/images",
        resource_type: "image", // For images
        allowed_formats: ["jpg", "png", "jpeg", "webp", "avif"],
        public_id: `${Date.now()}-${cleanFileName}`
      };
    }
  },
});

// File Filter
const fileFilter = (req, file, cb) => {
  console.log(
    `Processing upload: ${file.originalname} | MimeType: ${file.mimetype}`
  );

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
    "application/pdf",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file format: ${file.mimetype}. Allowed: JPG, PNG, WEBP, AVIF, PDF`
      ),
      false
    );
  }
};

// Multer Upload Middleware
const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 5, // 5MB
  },
  fileFilter,
});

export default upload;