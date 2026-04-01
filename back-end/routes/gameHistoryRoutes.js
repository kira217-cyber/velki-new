// routes/gameHistoryRoutes.js
import express from "express";
import Admin from "../models/Admin.js"; // ✅ .js extension must
const router = express.Router();

/**
 * GET /api/game-history/bet-history
 * Query params:
 *  - username (required)
 *  - page (optional, default 1)
 */
router.get("/bet-history", async (req, res) => {
  try {
    const { username } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = 15;

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    // 🔥 Find user
    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔥 Get game history array
    const gameHistory = admin.gameHistory || [];

    // 🔥 Sort by createdAt descending (latest first)
    const sortedHistory = gameHistory.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );

    // 🔥 Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginated = sortedHistory.slice(startIndex, endIndex);

    res.json({
      total: gameHistory.length,
      page,
      totalPages: Math.ceil(gameHistory.length / limit),
      data: paginated,
    });
  } catch (error) {
    console.error("Bet history error:", error);
    res.status(500).json({ message: "Server error" });
  }
});
// GET /api/game-history/summary?username=...
router.get("/summary", async (req, res) => {
  try {
    const { username } = req.query;
    const admin = await Admin.findOne({ username });

    if (!admin) return res.status(404).json({ message: "User not found" });

    const allBets = admin.gameHistory || [];

    const totalBets = allBets.length;
    const totalWon = allBets.filter(b => b.status === "won").length;
    const totalLost = allBets.filter(b => b.status === "lost").length;
    const totalAmount = allBets.reduce((acc, b) => acc + b.amount, 0).toFixed(2);

    res.json({ totalBets, totalWon, totalLost, totalAmount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
