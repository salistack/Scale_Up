const Franchise = require("../models/FranchiseModel");

// Create a new franchise
const createFranchise = async (req, res) => {
  try {
    console.log("Creating franchise, request body keys:", Object.keys(req.body || {}));
    console.log("Files received:", req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: req.file.url,
      secure_url: req.file.secure_url,
      filename: req.file.filename,
    } : "No file");
    
    const { name, description, location, category, contact } = req.body;

    // Validate required fields
    if (!name || !description || !location || !category || !contact) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields. Please provide name, description, location, category, and contact information." 
      });
    }

    // Get creator ID
    const creatorId = req.user?._id || req.user?.id;
    if (!creatorId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    // Resolve Cloudinary image URL from multer-storage-cloudinary
    let imageUrl = "";
    if (req.file) {
      const f = req.file;
      // Common properties from multer-storage-cloudinary
      imageUrl = f.path || f.secure_url || f.url || "";
      // Fallback: build URL from public_id (filename) if available
      if (!imageUrl && f.filename && process.env.CLOUDINARY_CLOUD_NAME) {
        imageUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${f.filename}`;
      }
      console.log("Resolved image URL:", imageUrl);
    }
    // Also accept a direct URL from the client if provided
    if (!imageUrl) {
      const bodyUrl = (req.body && (req.body.imageUrl || req.body.image)) || "";
      if (typeof bodyUrl === 'string' && bodyUrl.trim().length > 0) {
        imageUrl = bodyUrl.trim();
        console.log("Using image from body (as-is):", imageUrl);
      }
    }

    // Create new franchise
    const newFranchise = new Franchise({
      name,
      description,
      location,
      category,
      contact,
      createdBy: creatorId,
      image: imageUrl,
    });

    console.log("Saving franchise:", newFranchise);
    const savedFranchise = await newFranchise.save();
    
    res.status(201).json({ 
      success: true, 
      message: "Franchise created successfully",
      franchise: savedFranchise 
    });
  } catch (error) {
    console.error("Create Franchise Error:", error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ 
        success: false, 
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({ success: false, message: "Server error while creating franchise" });
  }
};

// Get all franchises (public)
const getFranchises = async (req, res) => {
  try {
    console.log("GET /api/franchise/all endpoint hit");
    console.log("Request headers:", req.headers);
    
    // Use sort by createdAt in descending order to show newest franchises first
    const franchises = await Franchise.find()
      .sort({ createdAt: -1 }) // Sort by creation date, newest first
      .populate({
        path: "createdBy",
        select: "name email profilePicture", // Include profile picture for avatar
      })
      .lean(); // Convert to plain JavaScript objects
    
    console.log(`Found ${franchises.length} franchises`);
    
    // Mark franchises that are new (created in the last 48 hours)
    const now = new Date();
    const twoMeeting = 2 * 24 * 60 * 60 * 1000; // 48 hours in milliseconds
    
    const enhancedFranchises = franchises.map(franchise => {
      const createdAt = new Date(franchise.createdAt);
      const isNew = (now - createdAt) < twoMeeting;
      return {
        ...franchise,
        isNew: isNew, // Add an isNew flag for the frontend to show a badge
        formattedDate: createdAt.toLocaleDateString(),
      };
    });
    
    // Log sample data
    if (enhancedFranchises.length > 0) {
      console.log("Sample franchise data:", JSON.stringify(enhancedFranchises[0], null, 2));
    }
    
    // Add additional headers for debugging CORS issues
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // If no franchises, still return success with empty array
    const responseData = { 
      success: true, 
      franchises: enhancedFranchises,
      count: enhancedFranchises.length,
      timestamp: new Date().toISOString() 
    };
    
    console.log("Sending response:", JSON.stringify(responseData, null, 2));
    res.status(200).json(responseData);
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
    if (req.file) {
      let imageUrl = req.file.path || req.file.secure_url || req.file.url || "";
      if (!imageUrl && req.file.filename && process.env.CLOUDINARY_CLOUD_NAME) {
        imageUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${req.file.filename}`;
      }
      franchise.image = imageUrl; // update image if uploaded
    } else if (req.body && (req.body.imageUrl || req.body.image)) {
      const bodyUrl = req.body.imageUrl || req.body.image;
      if (typeof bodyUrl === 'string' && bodyUrl.startsWith('http')) {
        franchise.image = bodyUrl.trim();
      }
    }

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
