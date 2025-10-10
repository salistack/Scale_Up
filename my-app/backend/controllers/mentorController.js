const Mentor = require("../models/Mentor");

// Create a new mentor
exports.createMentor = async (req, res) => {
  try {
    // Support optional uploaded files (e.g., photo) similar to entrepreneur posts
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => file.path);
    }

    const { name, expertise, bio } = req.body;
    if (!name || !expertise || !bio) {
      return res.status(400).json({ msg: "All fields required" });
    }

    const mentorData = {
      name,
      expertise,
      bio,
    };

    if (images.length) mentorData.images = images; // non-breaking: model may ignore unknown props

    // If authentication is present, attach creator
    if (req.user && req.user.id) {
      mentorData.createdBy = req.user.id;
    }

    const mentor = new Mentor(mentorData);
    const saved = await mentor.save();
    res.status(201).json({ msg: "Mentor created", mentor: saved });
  } catch (err) {
    console.error("Error in createMentor:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Get all mentors
exports.getAllMentors = async (req, res) => {
  try {
    const mentors = await Mentor.find().sort({ createdAt: -1 });
    res.json(mentors);
  } catch (err) {
    console.error("Error in getAllMentors:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Get single mentor by id
exports.getMentorById = async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.id);
    if (!mentor) return res.status(404).json({ msg: "Mentor not found" });
    res.json(mentor);
  } catch (err) {
    console.error("Error in getMentorById:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Update mentor
exports.updateMentor = async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.id);
    if (!mentor) return res.status(404).json({ msg: "Mentor not found" });

    // If mentor document contains ownership (createdBy), enforce that only owner can update
    if (mentor.createdBy && req.user && req.user.id && mentor.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not authorized to update this mentor" });
    }

    // Merge updates (safe: only fields present in schema will persist)
    Object.assign(mentor, req.body);
    await mentor.save();
    res.json({ msg: "Mentor updated", mentor });
  } catch (err) {
    console.error("Error in updateMentor:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Delete mentor
exports.deleteMentor = async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.id);
    if (!mentor) return res.status(404).json({ msg: "Mentor not found" });

    if (mentor.createdBy && req.user && req.user.id && mentor.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not authorized to delete this mentor" });
    }

    await Mentor.findByIdAndDelete(req.params.id);
    res.json({ msg: "Mentor deleted successfully" });
  } catch (err) {
    console.error("Error in deleteMentor:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};
