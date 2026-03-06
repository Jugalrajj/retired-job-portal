import express from "express";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

// POST /api/upload
// Changed field name from "image" to "file" since it handles both images and PDFs
router.post("/", upload.single("file"), async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    // Cloudinary file URL
    // Forced to HTTPS here so the Google Docs Viewer won't block it later!
    const fileUrl = req.file.path.replace(/^http:\/\//i, 'https://');

    // Cloudinary public id (used for deleting later)
    const publicId = req.file.filename;

    console.log("Uploaded file URL:", fileUrl);
    console.log("Cloudinary Public ID:", publicId);

    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      url: fileUrl,
      public_id: publicId
    });

  } catch (error) {
    console.error("Upload error:", error);

    res.status(500).json({
      success: false,
      message: "Upload failed",
      error: error.message
    });
  }
});

export default router;