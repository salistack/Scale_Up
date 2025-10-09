const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");
// const multer = require('multer');
// const { CloudinaryStorage } = require('multer-storage-cloudinary');
// const cloudinary = require('../config/cloudinary');

// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: 'entrepreneur_posts', // or any folder name
//     allowed_formats: ['jpg', 'png', 'jpeg'],
//   },
// });

// const upload = multer({ storage: storage });

const {
  createPost,
  getAllPosts,
  updatePost,
  deletePost,
} = require("../controllers/entrepreneurPostController");

// Use upload.single('image') for image upload
router.post("/", auth, upload.single("image"), createPost);
router.get("/", auth, getAllPosts);
router.put("/:id", auth, updatePost);
router.delete("/:id", auth, deletePost);

module.exports = router;
