const express = require("express");
const router = express.Router();
const { storage } = require("../config/cloudinary");
const multer = require("multer");
const upload = multer({ storage });
const authMiddleware = require("../middlewares/authMiddleware"); // ✅ import middleware
const franchiseOwnerMiddleware = require("../middlewares/franchiseOwnerMiddleware"); // Owner check middleware

const {
  createFranchise,
  getFranchises,
  getFranchiseById,
  updateFranchise,
  deleteFranchise,
} = require("../controllers/franchiseController");

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
