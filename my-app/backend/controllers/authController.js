const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");



// Signup controller
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "User already exists" });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    user = new User({ name, email, password: hashedPassword });
    await user.save();

    // Create JWT using secret from .env
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });

    res.status(201).json({
      msg: "User registered successfully",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// Login controller
exports.login = async (req, res) => {
  try {
    const { name, password } = req.body;
    console.log("Login attempt:", { name });

    // Find user by username
    const user = await User.findOne({ name });
    console.log("User found:", user);

    if (!user) {
      console.log("User not found");
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match:", isMatch);

    if (!isMatch) {
      console.log("Password does not match");
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Create JWT using secret from .env
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });
    console.log("JWT created:", token);

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Add this to authController.js
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password'); // exclude password
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ msg: 'Server error' });
  }
};




exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;  // comes from your middleware
    const { name, email, password } = req.body;

    // Find user
    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Update fields if provided
    if (name) user.name = name;
    if (email) user.email = email;

    // If password is provided, hash it
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    res.json({
      msg: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

const { OAuth2Client } = require('google-auth-library');

// OAuth: Google sign-in - handle both tokens and authorization codes
exports.oauthGoogle = async (req, res) => {
  try {
    const { idToken, accessToken, authCode, redirectUri } = req.body || {};
    
    console.log("OAuth request received:", { 
      hasIdToken: !!idToken, 
      hasAccessToken: !!accessToken, 
      hasAuthCode: !!authCode, 
      redirectUri 
    });
    
    if (!idToken && !accessToken && !authCode) {
      return res.status(400).json({ msg: "Missing idToken, accessToken, or authCode" });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    if (!clientId) {
      return res.status(500).json({ msg: "Server missing GOOGLE_CLIENT_ID" });
    }

    const client = new OAuth2Client(clientId, clientSecret, redirectUri);
    let payload;

    try {
      if (authCode) {
        // Exchange authorization code for tokens (for web application flow)
        console.log("Exchanging auth code for tokens...");
        const { tokens } = await client.getToken(authCode);
        console.log("Received tokens:", { ...tokens, access_token: '***', id_token: '***' });
        
        if (tokens.id_token) {
          // Verify the ID token we just received
          const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: clientId,
          });
          payload = ticket.getPayload();
        } else if (tokens.access_token) {
          // Use access token to get user info
          const response = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${tokens.access_token}`);
          if (!response.ok) {
            throw new Error('Failed to get user info with access token');
          }
          payload = await response.json();
        }
      } else if (idToken) {
        // Verify ID token directly (for mobile app flow)
        const ticket = await client.verifyIdToken({
          idToken: idToken,
          audience: clientId,
        });
        payload = ticket.getPayload();
      } else if (accessToken) {
        // Verify access token by making a request to Google's userinfo endpoint
        const response = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${accessToken}`);
        if (!response.ok) {
          throw new Error('Failed to verify access token');
        }
        payload = await response.json();
      }

      if (!payload) {
        return res.status(401).json({ msg: "Failed to verify token" });
      }

      // Check if email is verified
      if (payload.email_verified === false) {
        return res.status(401).json({ msg: "Email not verified by Google" });
      }

      const email = payload.email;
      const name = payload.name || (email ? email.split("@")[0] : "User");
      const picture = payload.picture;

      console.log("OAuth payload:", { email, name, email_verified: payload.email_verified });

      // Find or create user
      let user = await User.findOne({ email });
      if (!user) {
        // Create with a random password to satisfy schema requirement
        const randomPwd = Math.random().toString(36).slice(2) + Date.now();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(randomPwd, salt);
        user = new User({ 
          name, 
          email, 
          password: hashedPassword,
          picture: picture // Store profile picture if your User model supports it
        });
        await user.save();
        console.log("Created new user:", user._id);
      } else {
        console.log("Found existing user:", user._id);
      }

      // Issue JWT
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });

      return res.json({
        token,
        user: { 
          id: user._id, 
          name: user.name, 
          email: user.email,
          picture: user.picture 
        },
        provider: "google",
      });
    } catch (error) {
      console.error("Google token verification failed:", error);
      return res.status(401).json({ 
        msg: "Invalid Google token", 
        details: error.message 
      });
    }
  } catch (err) {
    console.error("oauthGoogle error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};
