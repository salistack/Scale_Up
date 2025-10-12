const express = require('express');
const router = express.Router();
const { signup, login, updateProfile, getProfile, oauthGoogle } = require('../controllers/authController');

// ✅ Import your middleware correctly
const authMiddleware = require('../middlewares/authMiddleware'); 

// Routes
router.post('/signup', signup);
router.post('/login', login);
router.put('/update', authMiddleware, updateProfile);

router.get('/me', authMiddleware, getProfile);

// OAuth
router.post('/oauth/google', oauthGoogle);

module.exports = router;
