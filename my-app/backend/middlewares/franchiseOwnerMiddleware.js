const Franchise = require('../models/FranchiseModel');

/**
 * Middleware to ensure the user is the owner of the franchise
 * This should be used after authMiddleware to ensure req.user exists
 */
const franchiseOwnerMiddleware = async (req, res, next) => {
  try {
    const franchiseId = req.params.id;
    if (!franchiseId) {
      return res.status(400).json({ success: false, message: "Franchise ID required" });
    }

    // Get the franchise post
    const franchise = await Franchise.findById(franchiseId);
    if (!franchise) {
      return res.status(404).json({ success: false, message: "Franchise not found" });
    }

    // Get user ID from auth middleware (supporting both formats)
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    // Check if user is the owner
    if (franchise.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "Not authorized - only the creator can modify this franchise" 
      });
    }

    // If user is the owner, attach the franchise to the request for use in controller
    req.franchise = franchise;
    next();
  } catch (error) {
    console.error("Franchise Owner Check Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = franchiseOwnerMiddleware;