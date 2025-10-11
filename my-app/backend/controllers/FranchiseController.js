const Franchise = require("../models/FranchiseModel");

// Create a new franchise
const createFranchise = async (req, res) => {
  try {
    const { name, description, location, category, contact } = req.body;

    // support both `req.user._id` and `req.user.id` depending on auth middleware
    const creatorId = req.user?._id || req.user?.id || null;

    const newFranchise = new Franchise({
      name,
      description,
      location,
      category,
      contact,
      createdBy: creatorId, // from authMiddleware (id) or passport-style (_id)
      image: req.file?.path || "", // optional image URL from multer/cloudinary
    });

    const savedFranchise = await newFranchise.save();
    res.status(201).json({ success: true, franchise: savedFranchise });
  } catch (error) {
    console.error("Create Franchise Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all franchises (public)
const getFranchises = async (req, res) => {
  try {
    // Use lean() for better performance and fully populate the createdBy field
    const franchises = await Franchise.find()
      .populate({
        path: "createdBy",
        select: "name email", // Only return these fields from User model
      })
      .lean(); // Convert to plain JavaScript objects
      
    res.status(200).json({ success: true, franchises });
  } catch (error) {
    console.error("Get Franchises Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get franchise by ID (public)
const getFranchiseById = async (req, res) => {
  try {
    const franchise = await Franchise.findById(req.params.id)
      .populate({
        path: "createdBy",
        select: "name email", // Only return these fields from User model
      })
      .lean(); // Convert to plain JavaScript object for better performance

    if (!franchise) return res.status(404).json({ success: false, message: "Franchise not found" });

    res.status(200).json({ success: true, franchise });
  } catch (error) {
    console.error("Get Franchise by ID Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update franchise (only owner)
const updateFranchise = async (req, res) => {
  try {
    const franchise = req.franchise; // from FranchisePostOwner middleware

    const { name, description, location, category, contact } = req.body;

    // Update fields if provided
    if (name) franchise.name = name;
    if (description) franchise.description = description;
    if (location) franchise.location = location;
    if (category) franchise.category = category;
    if (contact) franchise.contact = contact;
    if (req.file?.path) franchise.image = req.file.path; // update image if uploaded

    franchise.updatedAt = Date.now();

    const updatedFranchise = await franchise.save();
    res.status(200).json({ success: true, franchise: updatedFranchise });
  } catch (error) {
    console.error("Update Franchise Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete franchise (only owner)
const deleteFranchise = async (req, res) => {
  try {
    const franchise = req.franchise; // from FranchisePostOwner middleware

    await franchise.deleteOne();
    res.status(200).json({ success: true, message: "Franchise deleted successfully" });
  } catch (error) {
    console.error("Delete Franchise Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createFranchise,
  getFranchises,
  getFranchiseById,
  updateFranchise,
  deleteFranchise,
};
