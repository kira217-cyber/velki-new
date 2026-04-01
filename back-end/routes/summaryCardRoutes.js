import express from "express";
import Admin from "../models/Admin.js";

const router = express.Router();

router.get("/:adminId", async (req, res) => {
  try {
    const { adminId } = req.params;

    // 🔹 Main Admin
    const mainAdmin = await Admin.findById(adminId);

    if (!mainAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // 🔥 Get ALL users (global)
    const allUsers = await Admin.find();

    // 🔹 Sum helper
    const sumByRole = (role) =>
      allUsers
        .filter((u) => u.role === role)
        .reduce((acc, u) => acc + (u.balance || 0), 0);

    // 🔹 Format to 2 decimal
    const format = (num) => Number(num || 0).toFixed(2);

    const data = {
      mainBalance: format(mainAdmin.balance),

      subAdminBalance: format(sumByRole("SA")),
      masterBalance: format(sumByRole("MT")),
      agentBalance: format(sumByRole("AG")),
      subAgentBalance: format(sumByRole("SAG")),
      userBalance: format(sumByRole("US")),
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error("Summary Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
