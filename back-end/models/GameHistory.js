// models/schemas/gameHistorySchema.js

import mongoose from "mongoose";

const gameHistory = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    provider_code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    game_code: {
      type: String,
      required: true,
      trim: true,
    },
    bet_type: {
      type: String,
      enum: ["BET", "SETTLE", "CANCEL", "REFUND"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // ✅ required না
    // ✅ duplicate হলেও problem নাই
    transaction_id: {
      type: String,
      default: null,
      trim: true,
    },

    verification_key: {
      type: String,
      default: "",
    },

    times: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["won", "lost", "cancelled", "refunded"],
      default: function () {
        if (this.bet_type === "SETTLE") return "won";
        if (this.bet_type === "CANCEL") return "cancelled";
        if (this.bet_type === "REFUND") return "refunded";
        return "lost";
      },
    },

    round_id: {
      type: String,
      default: "",
    },

    bet_details: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  },
);

// ✅ normal index (duplicate allow করবে)
gameHistory.index({ transaction_id: 1 });

// ✅ other indexes
gameHistory.index({ username: 1, createdAt: -1 });
gameHistory.index({ provider_code: 1 });

export default gameHistory;
