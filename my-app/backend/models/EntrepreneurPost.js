const mongoose = require("mongoose");

const EntrepreneurPostSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  businessTitle: { type: String, required: true },
  tagline: String,
  industry: String,
  shortDescription: String,
  longDescription: String,
  fundAmount: Number,
  otherNeeds: String,
  images: [String], // store image URLs or paths
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("EntrepreneurPost", EntrepreneurPostSchema);