const express = require("express");
const router = express.Router();
const mentorController = require("../controllers/mentorController");

// Create a mentor
router.post("/", mentorController.createMentor);

// Get all mentors (controller exports as getAllMentors)
router.get("/", mentorController.getAllMentors);

// Get single mentor by id
router.get("/:id", mentorController.getMentorById);

// Update mentor
router.put("/:id", mentorController.updateMentor);

// Delete mentor
router.delete("/:id", mentorController.deleteMentor);

module.exports = router;
