const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken")
const googleClient = require("../config/google")
const user = require("../models/User")


const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  googleAuthentication,
  googleCallback,
  getCurrentUser,
  logout
} = require("../controllers/auth.controller");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");


router.post("/signup", signup);
router.post("/login", login);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);


router.get("/google", googleAuthentication);
router.get("/google/callback",googleCallback)


router.get("/me",getCurrentUser)
router.post("/logout", logout)

// Lets the website check admin access: 200 = admin, 401 = not logged in, 403 = not admin
router.get("/admin-check", verifyToken, isAdmin, (req, res) => {
  res.status(200).json({ success: true, email: req.user.email });
});




module.exports = router;
