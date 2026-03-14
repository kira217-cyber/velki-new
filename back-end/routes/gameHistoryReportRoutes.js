import express from "express";
import mongoose from "mongoose";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import Admin from "../models/Admin.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const router = express.Router();

/**
 * GET /api/game-history/report-downline
 *
 * Query params:
 * page=1
 * limit=40
 * search=
 * betType=
 * status=
 * fromDate=2026-03-10
 * fromTime=00:00:00
 * toDate=2026-03-11
 * toTime=23:59:59
 * timezone=Asia/Dhaka
 */
router.get("/report-downline", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 40,
      search = "",
      betType = "",
      status = "",
      fromDate = "",
      fromTime = "00:00:00",
      toDate = "",
      toTime = "23:59:59",
      timezone: tz = "Asia/Dhaka",
    } = req.query;

    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const perPage = Math.max(parseInt(limit, 10) || 40, 1);
    const skip = (currentPage - 1) * perPage;

    const matchStage = {};

    // ✅ Date range filter
    if (fromDate && toDate) {
      const fromLocal = `${fromDate} ${fromTime || "00:00:00"}`;
      const toLocal = `${toDate} ${toTime || "23:59:59"}`;

      const fromUtc = dayjs.tz(fromLocal, "YYYY-MM-DD HH:mm:ss", tz).utc().toDate();
      const toUtc = dayjs.tz(toLocal, "YYYY-MM-DD HH:mm:ss", tz).utc().toDate();

      matchStage["gameHistory.createdAt"] = {
        $gte: fromUtc,
        $lte: toUtc,
      };
    }

    // ✅ Bet type filter
    if (betType && betType !== "ALL") {
      matchStage["gameHistory.bet_type"] = betType.toUpperCase();
    }

    // ✅ Status filter
    if (status && status !== "ALL") {
      matchStage["gameHistory.status"] = status.toLowerCase();
    }

    // ✅ Search filter
    let searchMatch = {};
    if (search?.trim()) {
      const regex = new RegExp(search.trim(), "i");
      searchMatch = {
        $or: [
          { username: regex }, // parent admin username
          { "gameHistory.username": regex },
          { "gameHistory.game_code": regex },
          { "gameHistory.provider_code": regex },
          { "gameHistory.transaction_id": regex },
        ],
      };
    }

    const basePipeline = [
      { $unwind: "$gameHistory" },
      {
        $match: {
          ...matchStage,
          ...searchMatch,
        },
      },
    ];

    // ✅ Total records count
    const countPipeline = [
      ...basePipeline,
      { $count: "totalRecords" },
    ];

    // ✅ Paginated data
    const dataPipeline = [
      ...basePipeline,
      {
        $project: {
          _id: 0,
          adminId: "$_id",
          adminUsername: "$username",
          firstName: "$firstName",
          lastName: "$lastName",
          phone: "$phone",

          gameHistoryId: "$gameHistory._id",
          username: "$gameHistory.username",
          provider_code: "$gameHistory.provider_code",
          game_code: "$gameHistory.game_code",
          bet_type: "$gameHistory.bet_type",
          amount: "$gameHistory.amount",
          transaction_id: "$gameHistory.transaction_id",
          verification_key: "$gameHistory.verification_key",
          times: "$gameHistory.times",
          status: "$gameHistory.status",
          round_id: "$gameHistory.round_id",
          bet_details: "$gameHistory.bet_details",
          createdAt: "$gameHistory.createdAt",
          updatedAt: "$gameHistory.updatedAt",
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: perPage },
    ];

    // ✅ Grand totals for all filtered data
    const totalsPipeline = [
      ...basePipeline,
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          totalAmount: { $sum: "$gameHistory.amount" },

          totalBetAmount: {
            $sum: {
              $cond: [{ $eq: ["$gameHistory.bet_type", "BET"] }, "$gameHistory.amount", 0],
            },
          },
          totalSettleAmount: {
            $sum: {
              $cond: [{ $eq: ["$gameHistory.bet_type", "SETTLE"] }, "$gameHistory.amount", 0],
            },
          },
          totalCancelAmount: {
            $sum: {
              $cond: [{ $eq: ["$gameHistory.bet_type", "CANCEL"] }, "$gameHistory.amount", 0],
            },
          },
          totalRefundAmount: {
            $sum: {
              $cond: [{ $eq: ["$gameHistory.bet_type", "REFUND"] }, "$gameHistory.amount", 0],
            },
          },

          wonAmount: {
            $sum: {
              $cond: [{ $eq: ["$gameHistory.status", "won"] }, "$gameHistory.amount", 0],
            },
          },
          lostAmount: {
            $sum: {
              $cond: [{ $eq: ["$gameHistory.status", "lost"] }, "$gameHistory.amount", 0],
            },
          },
          cancelledAmount: {
            $sum: {
              $cond: [{ $eq: ["$gameHistory.status", "cancelled"] }, "$gameHistory.amount", 0],
            },
          },
          refundedAmount: {
            $sum: {
              $cond: [{ $eq: ["$gameHistory.status", "refunded"] }, "$gameHistory.amount", 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalRecords: 1,
          totalAmount: 1,
          totalBetAmount: 1,
          totalSettleAmount: 1,
          totalCancelAmount: 1,
          totalRefundAmount: 1,
          wonAmount: 1,
          lostAmount: 1,
          cancelledAmount: 1,
          refundedAmount: 1,
          netPL: {
            $subtract: [
              { $add: ["$totalSettleAmount", "$totalRefundAmount", "$totalCancelAmount"] },
              "$totalBetAmount",
            ],
          },
        },
      },
    ];

    const [countResult, rows, totalsResult] = await Promise.all([
      Admin.aggregate(countPipeline),
      Admin.aggregate(dataPipeline),
      Admin.aggregate(totalsPipeline),
    ]);

    const totalRecords = countResult[0]?.totalRecords || 0;
    const totalPages = Math.ceil(totalRecords / perPage) || 1;
    const totals = totalsResult[0] || {
      totalRecords: 0,
      totalAmount: 0,
      totalBetAmount: 0,
      totalSettleAmount: 0,
      totalCancelAmount: 0,
      totalRefundAmount: 0,
      wonAmount: 0,
      lostAmount: 0,
      cancelledAmount: 0,
      refundedAmount: 0,
      netPL: 0,
    };

    res.json({
      success: true,
      filters: {
        page: currentPage,
        limit: perPage,
        search,
        betType,
        status,
        fromDate,
        fromTime,
        toDate,
        toTime,
        timezone: tz,
      },
      pagination: {
        page: currentPage,
        limit: perPage,
        totalRecords,
        totalPages,
        hasPrev: currentPage > 1,
        hasNext: currentPage < totalPages,
      },
      totals,
      data: rows,
    });
  } catch (error) {
    console.error("❌ report-downline error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch game history report",
      error: error.message,
    });
  }
});

export default router;