const express = require("express");
const router = express.Router();
const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
// Configure Cloudinary storage specifically for franchises
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "franchises", // Store franchise images in their own folder
    allowed_formats: ["jpg", "png", "jpeg"],
    transformation: [{ width: 1000, height: 1000, crop: "limit" }], // Optimize image size
  },
});

const upload = multer({ storage });
const authMiddleware = require("../middlewares/authMiddleware"); // ✅ import middleware
const franchiseOwnerMiddleware = require("../middlewares/franchiseOwnerMiddleware"); // Owner check middleware

const {
  createFranchise,
  getFranchises,
  getFranchiseById,
  updateFranchise,
  deleteFranchise,
} = require("../controllers/FranchiseController");

// Routes

// Protected routes (require login)
router.post("/create", authMiddleware, upload.single("image"), createFranchise);      

// Protected routes (require login + ownership)
router.put("/update/:id", authMiddleware, franchiseOwnerMiddleware, upload.single("image"), updateFranchise);  
router.delete("/delete/:id", authMiddleware, franchiseOwnerMiddleware, deleteFranchise);

// Public routes (anyone can see)
router.get("/all", getFranchises);            
router.get("/:id", getFranchiseById);         

module.exports = router;
