const express = require('express');
const router = express.Router();
const { signup, login, updateProfile,getProfile } = require('../controllers/authController');

// ✅ Import your middleware correctly
const authMiddleware = require('../middlewares/authMiddleware'); 

// Routes
router.post('/signup', signup);
router.post('/login', login);
router.put('/update', authMiddleware, updateProfile);

router.get('/me', authMiddleware, getProfile);

module.exports = router;
