require('dotenv').config();

const connectDB = require("./config/db");
connectDB();

const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const investorProposalRoutes = require("./routes/investorProposalRoutes");
const entrepreneurPostRoutes = require("./routes/entrepreneurPostRoutes");
const franchiseRoutes = require("./routes/FranchiseRoutes");
const entrepreneurRoutes = require("./routes/entrepreneurRoutes");
const chatRoutes = require("./routes/chat");
const mentorRoutes = require("./routes/mentorRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/proposals", investorProposalRoutes);
app.use("/api/franchise", franchiseRoutes);
app.use("/api/entrepreneur/posts", entrepreneurPostRoutes);
app.use("/api/mentors", mentorRoutes);
app.use("/api/entrepreneur", entrepreneurRoutes);
app.use("/api/chat", chatRoutes);

// Add environment check
console.log('=== Environment Check ===');
console.log('GROQ_API_KEY loaded:', !!process.env.GROQ_API_KEY);
console.log('PORT:', process.env.PORT);
console.log('========================');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
