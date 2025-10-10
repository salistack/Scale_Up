const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  // Get token from header
  const token = req.header("Authorization")?.split(" ")[1]; // Bearer <token>

  if (!token)
    return res.status(401).json({ msg: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded JWT:", decoded);

    // Attach the userId as an object for flexibility
    req.user = { id: decoded.userId };
    next();
  } catch (err) {
    console.error("JWT verify error:", err);
    res.status(401).json({ msg: "Token is not valid" });
  }
};

module.exports = authMiddleware;
