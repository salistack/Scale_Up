const Mentor = require("../models/Mentor");

exports.createMentor = async (req, res) => {
  try {
    const { name, expertise, bio } = req.body;
    if (!name || !expertise || !bio) {
      return res.status(400).json({ msg: "All fields required" });
    }
    const mentor = new Mentor({ name, expertise, bio });
    await mentor.save();
    res.status(201).json({ msg: "Mentor added", mentor });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.getMentors = async (req, res) => {
  try {
    const mentors = await Mentor.find().sort({ createdAt: -1 });
    res.json(mentors);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};
