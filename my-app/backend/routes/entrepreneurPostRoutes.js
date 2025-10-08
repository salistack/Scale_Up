const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const {
  createPost,
  getAllPosts,
  updatePost,
  deletePost,
} = require("../controllers/entrepreneurPostController");

router.post("/", auth, createPost);
router.get("/", auth, getAllPosts);
router.put("/:id", auth, updatePost);
router.delete("/:id", auth, deletePost);

module.exports = router;
