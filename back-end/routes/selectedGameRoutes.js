import express from "express";
import path from "path";
import multer from "multer";
import fs from "fs";
import SelectedGame from "../models/SelectedGame.js";
import { fileURLToPath } from "url";

const router = express.Router();

// __dirname setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// uploads folder ensure
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// helper
const normalizeImagePath = (img) => {
  if (!img) return "";
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  if (img.startsWith("/uploads/")) return img;
  return `/uploads/${img}`;
};

const removeFileIfExists = (imagePath) => {
  try {
    if (!imagePath) return;

    let filename = imagePath;

    if (imagePath.startsWith("/uploads/")) {
      filename = imagePath.replace("/uploads/", "");
    }

    const fullPath = path.join(uploadsDir, filename);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (err) {
    console.error("Failed to delete image:", err.message);
  }
};

// GET All Selected Games
router.get("/", async (req, res) => {
  try {
    const selectedGames = await SelectedGame.find().sort({ createdAt: -1 });

    const formatted = selectedGames.map((game) => ({
      ...game.toObject(),
      image: normalizeImagePath(game.image),
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET Only Array of gameId
router.get("/ids", async (req, res) => {
  try {
    const selectedGames = await SelectedGame.find({}, "gameId");
    const gameIds = selectedGames.map((game) => game.gameId);

    res.json({
      success: true,
      count: gameIds.length,
      data: gameIds,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST Select Game + optional image upload
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { gameId } = req.body;

    if (!gameId) {
      return res.status(400).json({
        success: false,
        message: "gameId is required",
      });
    }

    const existing = await SelectedGame.findOne({ gameId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Already selected",
      });
    }

    const newSelected = new SelectedGame({
      gameId,
      image: req.file ? `/uploads/${req.file.filename}` : "",
    });

    await newSelected.save();

    res.status(201).json({
      success: true,
      data: {
        ...newSelected.toObject(),
        image: normalizeImagePath(newSelected.image),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT Update flags and/or image
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const existing = await SelectedGame.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    const updateData = {};

    if (req.body.isCatalog !== undefined) {
      updateData.isCatalog =
        req.body.isCatalog === true || req.body.isCatalog === "true";
    }

    if (req.body.isLatest !== undefined) {
      updateData.isLatest =
        req.body.isLatest === true || req.body.isLatest === "true";
    }

    if (req.body.isA_Z !== undefined) {
      updateData.isA_Z = req.body.isA_Z === true || req.body.isA_Z === "true";
    }

    if (req.file) {
      if (existing.image && existing.image.startsWith("/uploads/")) {
        removeFileIfExists(existing.image);
      }
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const updated = await SelectedGame.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true },
    );

    res.json({
      success: true,
      data: {
        ...updated.toObject(),
        image: normalizeImagePath(updated.image),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE Deselect Game
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await SelectedGame.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    if (deleted.image && deleted.image.startsWith("/uploads/")) {
      removeFileIfExists(deleted.image);
    }

    res.json({ success: true, message: "Deselected" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
