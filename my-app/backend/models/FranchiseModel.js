// models/FranchiseModel.js
const mongoose = require("mongoose");

const franchiseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  contact: {
    type: String,
    required: true,
  },
  image: {
    type: String, // store image URL or path
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", // reference to the user who created this franchise
    required: true 
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to automatically update `updatedAt` when document is modified
franchiseSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Franchise", franchiseSchema);
