/**
 * PrintShop — Auth Controller
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User'); // Mongoose Model
const { readDB, writeDB } = require('../config/db'); // Used only for 'keys' collection
const { sanitize, validateEmail } = require('../middleware/validate');
const JWT_SECRET = process.env.JWT_SECRET;
const crypto = require('crypto');

async function signup(req, res) {
  try {
    const { name, email, password, role, accessKey } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const allowedRoles = ['student', 'coordinator', 'shop'];
    const userRole = allowedRoles.includes(role) ? role : 'student';
    const normalizedEmail = email.toLowerCase().trim();

    // Check MongoDB for duplicates
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Coordinator access key validation (unchanged logic)
    if (userRole === 'coordinator') {
      if (!accessKey) {
        return res.status(400).json({ error: 'Coordinator access key is required' });
      }
      const keys = readDB('keys');
      const keyIndex = keys.findIndex(k => k.key === accessKey);
      if (keyIndex === -1) {
        return res.status(400).json({ error: 'Invalid access key' });
      }
      if (keys[keyIndex].used) {
        return res.status(400).json({ error: 'This access key has already been used' });
      }
      keys[keyIndex].used = true;
      writeDB('keys', keys);
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      name: sanitize(name),
      email: normalizedEmail,
      password: hashed,
      role: userRole,
      authType: 'local'
    });

    await user.save();
    res.status(201).json({ success: true, message: 'Signup successful' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function login(req, res) {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!JWT_SECRET) {
      console.error("JWT_SECRET missing");
      return res.status(500).json({ error: "Server config error" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || user.role !== role) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.authType === 'google' || !user.password) {
      return res.status(400).json({ error: "Please use Google Sign-In" });
    }

    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch (bcryptErr) {
      console.error("bcrypt compare error:", bcryptErr);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id || user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: "Login successful",
      token,
      user: { id: user._id || user.id, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error("LOGIN ERROR FULL:", {
      message: err.message,
      stack: err.stack,
      body: req.body
    });
    res.status(500).json({ error: "Internal server error" });
  }
}

function verifyToken(req, res) {
  res.json({ valid: true, user: req.user });
}

// ==================== GOOGLE LOGIN ====================
async function googleLogin(req, res) {
  try {
    const { token } = req.body; // Google ID token
    if (!token) return res.status(400).json({ error: "No token provided" });

    // Verify token using Google tokeninfo endpoint
    const googleRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    const data = googleRes.data;

    if (!data.email) {
      return res.status(400).json({ error: "Invalid google token data" });
    }

    const email = data.email.toLowerCase().trim();
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if not exists
      user = new User({
        name: data.name || 'Google User',
        email: email,
        role: "student", // default role based on instructions
        password: null,
        authType: "google"
      });
      await user.save();
    }

    // Generate JWT payload identically to standard login
    const backendToken = jwt.sign(
      { id: user._id || user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' } 
    );

    res.json({
      success: true,
      token: backendToken,
      user: { id: user._id || user.id, name: user.name, email: user.email, role: user.role }
    });

  } catch (err) {
    console.error("Google Auth backend error:", err.response ? err.response.data : err.message);
    res.status(401).json({ error: "Invalid Google token" });
  }
}

// Forgot / Reset password
const resetTokens = {};

setInterval(() => {
  const now = Date.now();
  for (const token in resetTokens) {
    if (resetTokens[token].expiresAt < now) {
      delete resetTokens[token];
    }
  }
}, 5 * 60 * 1000);

async function forgotPassword(req, res) {
  try {
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase().trim(), role: (role || 'student') });

    if (!user || user.authType === 'google') {
      return res.json({ success: true, message: 'If a local account exists, a reset link has been sent.' });
    }

    const { v4: uuidv4 } = require('uuid');
    const token = uuidv4().replace(/-/g, '').slice(0, 20);
    resetTokens[token] = { email: user.email, role: user.role, expiresAt: Date.now() + 15 * 60000 };

    console.log('\n  ============================================');
    console.log('  📧 PASSWORD RESET EMAIL (Demo)');
    console.log(`  To: ${user.email}`);
    console.log(`  Token: ${token}`);
    console.log(`  Link: https://print-shop-boqx.onrender.com/reset-password.html?token=${token}`);
    console.log('  ============================================\n');

    res.json({ success: true, message: 'If a local account exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password are required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const entry = resetTokens[token];
    if (!entry || Date.now() > entry.expiresAt) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const user = await User.findOne({ email: entry.email, role: entry.role });
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    
    delete resetTokens[token];
    res.json({ success: true, message: 'Password reset successful. You can now login.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getCoordinators(req, res) {
  try {
    const coordinators = await User.find({ role: 'coordinator' });
    const formatted = coordinators.map(u => ({ id: u._id || u.id, name: u.name, email: u.email }));
    res.json(formatted);
  } catch (error) {
    console.error('Get coordinators error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  signup,
  login,
  verifyToken,
  forgotPassword,
  resetPassword,
  getCoordinators,
  googleLogin
};
