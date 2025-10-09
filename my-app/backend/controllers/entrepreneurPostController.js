const EntrepreneurPost = require("../models/EntrepreneurPost");

exports.createPost = async (req, res) => {
  try {
    // Get Cloudinary image URL if file uploaded
    let images = [];
    if (req.file && req.file.path) {
      images.push(req.file.path);
    }
    // If you want to support multiple images, you can handle req.files here

    const post = new EntrepreneurPost({
      user: req.user,
      businessTitle: req.body.businessTitle,
      tagline: req.body.tagline,
      industry: req.body.industry,
      shortDescription: req.body.shortDescription,
      longDescription: req.body.longDescription,
      fundAmount: req.body.fundAmount,
      otherNeeds: req.body.otherNeeds,
      images,
    });
    const savedPost = await post.save();
    res.status(201).json({ msg: "Post created", post: savedPost });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Get all posts
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await EntrepreneurPost.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Update post
exports.updatePost = async (req, res) => {
  try {
    const post = await EntrepreneurPost.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    if (post.user.toString() !== req.user)
      return res.status(401).json({ msg: "Not authorized" });

    Object.assign(post, req.body);
    await post.save();
    res.json({ msg: "Post updated", post });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Delete post (only owner)
exports.deletePost = async (req, res) => {
  try {
    const post = await EntrepreneurPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Check if logged-in user is the owner
    if (post.user.toString() !== req.user) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    await EntrepreneurPost.findByIdAndDelete(req.params.id);
    res.json({ msg: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};
