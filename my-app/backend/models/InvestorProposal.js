const mongoose = require("mongoose");

const InvestorProposalSchema = new mongoose.Schema({
  investor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  investmentAmount: { type: Number, required: true },
  fundingType: { type: String, enum: ["Equity", "Loan", "Grant"], required: true },
  expectedROI: { type: Number, required: true },
  interestLevel: { type: Number, min: 1, max: 5 },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("InvestorProposal", InvestorProposalSchema);
