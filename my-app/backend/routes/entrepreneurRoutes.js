const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

// Get all entrepreneur posts
router.get("/posts", async (req, res) => {
  try {
    const Post = require("../models/Post");
    const posts = await Post.find()
      .populate("user", "name email profilePic")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// Delete a post
router.delete("/posts/:postId", auth, async (req, res) => {
  try {
    const Post = require("../models/Post");
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    
    // Check if user owns the post
    if (post.user.toString() !== req.user.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    await Post.findByIdAndDelete(req.params.postId);
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ error: "Failed to delete post" });
  }
});

// Download PDF
router.get("/posts/:postId/download-pdf", auth, async (req, res) => {
  try {
    const Post = require("../models/Post");
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    
    // TODO: Generate PDF logic here
    res.status(501).json({ message: "PDF generation not implemented yet" });
  } catch (error) {
    console.error("Error downloading PDF:", error);
    res.status(500).json({ error: "Failed to download PDF" });
  }
});

module.exports = router;
