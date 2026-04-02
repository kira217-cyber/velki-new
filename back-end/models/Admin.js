// models/Admin.js
import mongoose from "mongoose";
import gameHistory from "./GameHistory.js";

const adminSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true }, // ✅ NEW REQUIRED

    username: { type: String, required: true, unique: true },
    role: { type: String, default: "US" },

    password: { type: String, required: true },

    firstName: { type: String, default: "" }, // ✅ optional
    lastName: { type: String, default: "" },  // ✅ optional
    phone: { type: String, default: "" },     // ✅ optional

    reffer: { type: String, default: "" },

    loginStatus: { type: String, default: "manual" },

    credit: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    exposure: { type: Number, default: 0 },
    availBal: { type: Number, default: 0 },
    totalBal: { type: Number, default: 0 },
    playerBal: { type: Number, default: 0 },
    refPL: { type: Number, default: 0 },

    gameHistory: [gameHistory],

    timeZone: { type: String, default: "Asia/Dhaka" },

    status: { type: String, default: "Active" },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Admin", adminSchema);