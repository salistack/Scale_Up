require('dotenv').config();

const connectDB = require("./config/db");
connectDB();

const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const investorProposalRoutes = require("./routes/investorProposalRoutes");
const entrepreneurPostRoutes = require("./routes/entrepreneurPostRoutes");
const mentorRoutes = require("./routes/mentorRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/proposals", investorProposalRoutes);
app.use("/api/entrepreneur/posts", entrepreneurPostRoutes);
app.use("/api/mentors", mentorRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Make sure your backend server is running and listening on the correct IP and port.
// If running locally, try using "localhost" instead of your LAN IP in frontend API URLs.
// Check firewall settings and network connectivity.
