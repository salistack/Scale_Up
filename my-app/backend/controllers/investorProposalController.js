const InvestorProposal = require("../models/InvestorProposal");
const User = require("../models/User");
const nodemailer = require("nodemailer");

// Create Proposal
exports.createProposal = async (req, res) => {
  try {
    console.log("Request userId:", req.user); // Should log userId

    if (!req.user) return res.status(401).json({ msg: "Unauthorized: user not found" });

    const { investmentAmount, fundingType, expectedROI, interestLevel, description } = req.body;

    const proposal = new InvestorProposal({
      investor: req.user,
      investmentAmount,
      fundingType,
      expectedROI,
      interestLevel,
      description,
    });

    const savedProposal = await proposal.save();
    res.status(201).json({ msg: "Proposal created", proposal: savedProposal });
  } catch (err) {
    console.error("Error creating proposal:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Get all proposals
exports.getAllProposals = async (req, res) => {
  try {
    const proposals = await InvestorProposal.find()
      .populate("investor", "name email")
      .sort({ createdAt: -1 });
    res.json(proposals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Update proposal
exports.updateProposal = async (req, res) => {
  try {
    const proposal = await InvestorProposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ msg: "Proposal not found" });

    if (proposal.investor.toString() !== req.user)
      return res.status(401).json({ msg: "Not authorized" });

    Object.assign(proposal, req.body);
    await proposal.save();
    res.json({ msg: "Proposal updated", proposal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Delete proposal (only owner)
exports.deleteProposal = async (req, res) => {
  try {
    const proposal = await InvestorProposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).json({ msg: "Proposal not found" });
    }

    // Check if logged-in user is the owner
    if (proposal.investor.toString() !== req.user) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    await InvestorProposal.findByIdAndDelete(req.params.id);
    res.json({ msg: "Proposal deleted successfully" });
  } catch (err) {
    console.error("Error deleting proposal:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};



// Send interest email
exports.sendInterestEmail = async (req, res) => {
  try {
    // Get proposal and investor info
    const proposal = await InvestorProposal.findById(req.params.id)
      .populate("investor", "email name");
    if (!proposal) return res.status(404).json({ msg: "Proposal not found" });

    // Get entrepreneur info (from logged-in user)
    const entrepreneur = await User.findById(req.user).select("name email");
    if (!entrepreneur) return res.status(404).json({ msg: "Entrepreneur not found" });

    // Email setup
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: proposal.investor.email,
      subject: "Someone is interested in your proposal!",
      text: `${entrepreneur.name} (${entrepreneur.email}) is interested in your investment proposal: "${proposal.description}".`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ msg: "Interest email sent successfully" });
  } catch (err) {
    console.error("Error sending email:", err);
    res.status(500).json({ msg: "Failed to send email", error: err.message });
  }
};


// ✅ Get proposal by ID
exports.getProposalById = async (req, res) => {
  try {
    const proposal = await InvestorProposal.findById(req.params.id)
      .populate("investor", "name email");
    if (!proposal) return res.status(404).json({ msg: "Proposal not found" });
    res.json(proposal);
  } catch (err) {
    console.error("Error fetching proposal by ID:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};