const connectDB = require("./config/db");
connectDB();

const express = require("express");
const app = express();
const authRoutes = require("./routes/authRoutes");
const cors = require("cors");

// ...existing code...
app.use(cors());
app.use(express.json()); // for parsing application/json
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
