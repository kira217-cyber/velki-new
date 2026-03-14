import express from "express";
import Navbar from "../models/Navbar.js";

const router = express.Router();

// ন্যাভবার সেটিংস ফেচ
router.get("/navbar", async (req, res) => {
  try {
    const navbar = await Navbar.findOne();
    if (!navbar) return res.json({});
    res.json({
      _id: navbar._id,
      bgColor: navbar.bgColor,
      textColor: navbar.textColor,
      fontSize: navbar.fontSize,
      showSignupButton: navbar.showSignupButton,
      signupLink: navbar.signupLink,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ন্যাভবার সেটিংস আপডেট
router.post("/navbar", async (req, res) => {
  try {
    const { bgColor, textColor, fontSize, showSignupButton, signupLink } = req.body;
    const existingNavbar = await Navbar.findOne();

    if (existingNavbar) {
      existingNavbar.bgColor = bgColor || existingNavbar.bgColor;
      existingNavbar.textColor = textColor || existingNavbar.textColor;
      existingNavbar.fontSize = fontSize || existingNavbar.fontSize;
      if (typeof showSignupButton === "boolean") {
        existingNavbar.showSignupButton = showSignupButton;
      }
      if (typeof signupLink === "string") {
        existingNavbar.signupLink = signupLink;
      }
      const updatedNavbar = await existingNavbar.save();
      res.json({
        _id: updatedNavbar._id,
        bgColor: updatedNavbar.bgColor,
        textColor: updatedNavbar.textColor,
        fontSize: updatedNavbar.fontSize,
        showSignupButton: updatedNavbar.showSignupButton,
        signupLink: updatedNavbar.signupLink,
      });
    } else {
      const newNavbar = new Navbar({
        bgColor: bgColor || "#ffffff",
        textColor: textColor || "#000000",
        fontSize: fontSize || 16,
        showSignupButton:
          typeof showSignupButton === "boolean" ? showSignupButton : true,
        signupLink: typeof signupLink === "string" ? signupLink : "",
      });
      const savedNavbar = await newNavbar.save();
      res.status(201).json({
        _id: savedNavbar._id,
        bgColor: savedNavbar.bgColor,
        textColor: savedNavbar.textColor,
        fontSize: savedNavbar.fontSize,
        showSignupButton: savedNavbar.showSignupButton,
        signupLink: savedNavbar.signupLink,
      });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;