const mongoose = require("mongoose");

const MentorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  expertise: { type: String, required: true },
  bio: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Mentor", MentorSchema);
