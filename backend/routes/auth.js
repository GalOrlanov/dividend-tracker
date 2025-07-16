const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const auth = require("../middleware/auth");
const oauthConfig = require("../config/oauth");

// Passport serialization/deserialization
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: oauthConfig.GOOGLE_CLIENT_ID,
      clientSecret: oauthConfig.GOOGLE_CLIENT_SECRET || "", // Can be empty for mobile apps
      callbackURL: oauthConfig.GOOGLE_CALLBACK_URL,
    },
    async function (accessToken, refreshToken, profile, cb) {
      try {
        // Find or create user
        let user = await User.findOne({
          $or: [{ googleId: profile.id }, { email: profile.emails[0].value }],
        });

        if (user) {
          // Update Google ID if user exists but doesn't have it
          if (!user.googleId) {
            user.googleId = profile.id;
            user.avatar = profile.photos[0].value;
            await user.save();
          }
        } else {
          // Create new user
          user = new User({
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            avatar: profile.photos[0].value,
            isEmailVerified: true, // Google users are pre-verified
          });
          await user.save();
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        return cb(null, user);
      } catch (error) {
        return cb(error, null);
      }
    }
  )
);

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, oauthConfig.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Initiate Google OAuth
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// Google OAuth callback
router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), (req, res) => {
  // Generate JWT token
  const token = generateToken(req.user._id);

  // Prepare user data
  const userData = encodeURIComponent(
    JSON.stringify({
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      avatar: req.user.avatar,
    })
  );

  // For web-based OAuth, redirect to a success page that can handle the token
  const redirectUrl = `${oauthConfig.FRONTEND_SUCCESS_URL}?token=${token}&user=${userData}`;
  res.redirect(redirectUrl);
});

// Validate token endpoint
router.get("/validate", auth, (req, res) => {
  res.json({
    valid: true,
    user: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      avatar: req.user.avatar,
    },
  });
});

// Logout endpoint
router.post("/logout", auth, (req, res) => {
  // In a real app, you might want to blacklist the token
  res.json({ success: true, message: "Logged out successfully" });
});

// Test endpoint to check if auth routes are working
router.get("/test", (req, res) => {
  res.json({
    message: "Auth routes are working",
    clientId: oauthConfig.GOOGLE_CLIENT_ID,
    hasClientSecret: !!oauthConfig.GOOGLE_CLIENT_SECRET,
    callbackUrl: oauthConfig.GOOGLE_CALLBACK_URL,
  });
});

// Register new user
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    const user = new User({
      email,
      password,
      name,
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Google Sign-In endpoint for mobile apps
router.post("/google", async (req, res) => {
  try {
    const { idToken, user: googleUser } = req.body;

    if (!idToken || !googleUser) {
      return res.status(400).json({ message: "Missing required data" });
    }

    // For now, we'll trust the user data from the client
    // In production, you should verify the ID token with Google's servers
    const { id: googleId, email, name, avatar } = googleUser;

    // Find existing user by Google ID or email
    let user = await User.findOne({
      $or: [{ googleId }, { email }],
    });

    if (user) {
      // Update Google ID if user exists but doesn't have it
      if (!user.googleId) {
        user.googleId = googleId;
        user.avatar = avatar;
        await user.save();
      }
    } else {
      // Create new user
      user = new User({
        googleId,
        email,
        name,
        avatar,
        isEmailVerified: true, // Google users are pre-verified
      });
      await user.save();
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: "Google login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get current user
router.get("/me", auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        avatar: req.user.avatar,
        isEmailVerified: req.user.isEmailVerified,
        createdAt: req.user.createdAt,
        lastLogin: req.user.lastLogin,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user profile
router.put("/profile", auth, async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (avatar) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Change password
router.put("/password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const isMatch = await req.user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Update password
    req.user.password = newPassword;
    await req.user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
