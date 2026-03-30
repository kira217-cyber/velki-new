import express from "express";
import Admin from "../models/Admin.js";

const router = express.Router();

// 🔥 Recursive (works for ALL roles)
const getAllDownlines = async (adminId) => {
  let result = [];

  const children = await Admin.find({ createdBy: adminId });

  for (let child of children) {
    result.push(child);

    const sub = await getAllDownlines(child._id);
    result = result.concat(sub);
  }

  return result;
};

router.get("/:adminId", async (req, res) => {
  try {
    const { adminId } = req.params;

    const mainAdmin = await Admin.findById(adminId);

    if (!mainAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // 🔥 ALL downlines (respect hierarchy automatically)
    const downlines = await getAllDownlines(adminId);

    // 🔹 Total Downline Balance (ALL roles)
    const totalDownlineBalance = downlines.reduce(
      (acc, u) => acc + (u.balance || 0),
      0
    );

    // 🔥 ONLY USERS (game players)
    const users = downlines.filter((u) => u.role === "US");

    let totalProfit = 0;
    let totalLoss = 0;

    users.forEach((user) => {
      user.gameHistory?.forEach((g) => {
        if (g.status === "won") totalProfit += g.amount || 0;
        if (g.status === "lost") totalLoss += g.amount || 0;
      });
    });

    // 🔹 Net Exposure
    const netExposure = totalProfit - totalLoss;

    const format = (num) => Number(num || 0).toFixed(2);

    res.json({
      success: true,
      data: {
        mainBalance: format(mainAdmin.balance),
        netExposure: format(netExposure),
        totalDownlineBalance: format(totalDownlineBalance),
        profitBalance: format(totalProfit),
        lossBalance: format(totalLoss),
      },
    });

  } catch (error) {
    console.error("Admin Summary Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;