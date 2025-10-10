const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const {
  createProposal,
  getAllProposals,
  updateProposal,
  deleteProposal,
  sendInterestEmail,
  getProposalById,
} = require("../controllers/investorProposalController");

router.post("/", auth, createProposal);
router.get("/",  getAllProposals);
router.put("/:id", auth, updateProposal);
router.delete("/:id", auth, deleteProposal);
router.post("/email/:id", auth, sendInterestEmail);
router.get("/:id", auth, getProposalById);

module.exports = router;
