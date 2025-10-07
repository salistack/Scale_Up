require('dotenv').config();

const connectDB = require("./config/db");
connectDB();

const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const investorProposalRoutes = require("./routes/investorProposalRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/proposals", investorProposalRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
