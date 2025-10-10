const EntrepreneurPost = require("../models/EntrepreneurPost");
const PDFDocument = require("pdfkit");

exports.createPost = async (req, res) => {
  try {
    // Get Cloudinary image URLs if files uploaded
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => file.path);
    }
    // If you want to support multiple images, you can handle req.files here

    const post = new EntrepreneurPost({
      user: req.user.id,
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
    console.error("Error in createPost:", err); // Log error to console
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
  // Debug: print both IDs for comparison
  // (move after post is defined)
  try {
    const post = await EntrepreneurPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Debug: print both IDs for comparison
    console.log(
      "Post user:",
      post.user.toString(),
      "Req user id:",
      req.user.id
    );

    // Check if logged-in user is the owner
    if (post.user.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ msg: "Not authorized to delete this post" });
    }

    try {
      await EntrepreneurPost.findByIdAndDelete(req.params.id);
      res.json({ msg: "Post deleted successfully" });
    } catch (err) {
      console.error("Error removing post:", err);
      return res
        .status(500)
        .json({ msg: "Error deleting post", error: err.message });
    }
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Download post PDF
exports.downloadPostPdf = async (req, res) => {
  try {
    const post = await EntrepreneurPost.findById(req.params.id).populate(
      "user",
      "name email"
    );
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=post_${post._id}.pdf`
    );
    doc.pipe(res);

    // Title
    doc
      .fontSize(26)
      .fillColor("#333366")
      .text("Business Proposal", { align: "center", underline: true });
    doc.moveDown(1.5);

    // Section: Business Overview
    doc
      .fontSize(18)
      .fillColor("#222")
      .text("Business Overview", { underline: true });
    doc.moveDown(0.5);
    doc
      .fontSize(14)
      .fillColor("black")
      .text(`Business Title: `, { continued: true, bold: true })
      .fillColor("#444")
      .text(`${post.businessTitle || ""}`);
    doc
      .text(`Tagline: `, { continued: true, bold: true })
      .fillColor("#444")
      .text(`${post.tagline || ""}`);
    doc
      .text(`Industry: `, { continued: true, bold: true })
      .fillColor("#444")
      .text(`${post.industry || ""}`);
    doc.moveDown(1);

    // Section: Description
    doc.fontSize(18).fillColor("#222").text("Description", { underline: true });
    doc.moveDown(0.5);
    doc
      .fontSize(14)
      .fillColor("black")
      .text(`Short Description:`, { bold: true });
    doc
      .fontSize(13)
      .fillColor("#444")
      .text(`${post.shortDescription || ""}`);
    doc.moveDown(0.5);
    doc
      .fontSize(14)
      .fillColor("black")
      .text(`Long Description:`, { bold: true });
    doc
      .fontSize(13)
      .fillColor("#444")
      .text(`${post.longDescription || ""}`);
    doc.moveDown(1);

    // Section: Funding
    doc
      .fontSize(18)
      .fillColor("#222")
      .text("Funding & Needs", { underline: true });
    doc.moveDown(0.5);
    doc
      .fontSize(14)
      .fillColor("black")
      .text(`Fund Amount: `, { continued: true, bold: true })
      .fillColor("#444")
      .text(`${post.fundAmount || ""}`);
    doc
      .text(`Other Needs: `, { continued: true, bold: true })
      .fillColor("#444")
      .text(`${post.otherNeeds || ""}`);
    doc.moveDown(1);

    // Section: Author
    doc
      .fontSize(18)
      .fillColor("#222")
      .text("Author & Metadata", { underline: true });
    doc.moveDown(0.5);
    doc
      .fontSize(14)
      .fillColor("black")
      .text(`Created By: `, { continued: true, bold: true })
      .fillColor("#444")
      .text(`${post.user?.name || ""} (${post.user?.email || ""})`);
    doc
      .text(`Created At: `, { continued: true, bold: true })
      .fillColor("#444")
      .text(`${post.createdAt ? post.createdAt.toLocaleString() : ""}`);

    // Footer
    doc.moveDown(2);
    doc
      .fontSize(12)
      .fillColor("#888")
      .text("Generated by Scale_Up Platform", { align: "center" });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error generating PDF" });
  }
};
