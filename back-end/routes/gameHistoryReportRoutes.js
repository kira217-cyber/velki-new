import express from "express";
import mongoose from "mongoose";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import Admin from "../models/Admin.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const router = express.Router();

const ROLE = {
  MA: "MA",
  SA: "SA",
  MT: "MT",
  AG: "AG",
  SG: "SG",
  US: "US",
};

const ALLOWED_VIEW_ROLES = new Set([
  ROLE.MA,
  ROLE.SA,
  ROLE.MT,
  ROLE.AG,
  ROLE.SG,
  ROLE.US,
]);

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

const uniqueStringIds = (ids = []) => [...new Set(ids.map((id) => String(id)))];

async function getSelfAndDescendantIds(startIds = []) {
  if (!startIds.length) return [];

  const objectIds = startIds.map((id) => toObjectId(id));

  const rows = await Admin.aggregate([
    {
      $match: {
        _id: { $in: objectIds },
      },
    },
    {
      $graphLookup: {
        from: Admin.collection.name, // usually "admins"
        startWith: "$_id",
        connectFromField: "_id",
        connectToField: "createdBy",
        as: "descendants",
      },
    },
    {
      $project: {
        selfId: "$_id",
        descendantIds: "$descendants._id",
      },
    },
  ]);

  const allIds = [];
  for (const row of rows) {
    allIds.push(String(row.selfId));
    for (const id of row.descendantIds || []) {
      allIds.push(String(id));
    }
  }

  return uniqueStringIds(allIds);
}

async function getAllowedTreeIds(currentAdminId) {
  const ids = await getSelfAndDescendantIds([currentAdminId]);
  return ids;
}

async function getUserIdsFromTree(treeIds = []) {
  if (!treeIds.length) return [];

  const users = await Admin.find(
    {
      _id: { $in: treeIds.map((id) => toObjectId(id)) },
      role: ROLE.US,
    },
    { _id: 1 },
  ).lean();

  return uniqueStringIds(users.map((u) => u._id));
}

async function getMatchedAdminIdsWithinScope(searchText, scopedTreeIds = []) {
  if (!searchText?.trim() || !scopedTreeIds.length) return [];

  const regex = new RegExp(searchText.trim(), "i");

  const matched = await Admin.find(
    {
      _id: { $in: scopedTreeIds.map((id) => toObjectId(id)) },
      username: regex,
    },
    { _id: 1 },
  ).lean();

  return uniqueStringIds(matched.map((item) => item._id));
}

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
 * currentAdminId=...
 * currentAdminRole=MA
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
      currentAdminId = "",
      currentAdminRole = "",
    } = req.query;

    if (!currentAdminId || !mongoose.Types.ObjectId.isValid(currentAdminId)) {
      return res.status(400).json({
        success: false,
        message: "Valid currentAdminId is required",
      });
    }

    if (!currentAdminRole || !ALLOWED_VIEW_ROLES.has(currentAdminRole)) {
      return res.status(400).json({
        success: false,
        message: "Valid currentAdminRole is required",
      });
    }

    const currentAdmin = await Admin.findById(currentAdminId).lean();

    if (!currentAdmin) {
      return res.status(404).json({
        success: false,
        message: "Logged in admin not found",
      });
    }

    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const perPage = Math.max(parseInt(limit, 10) || 40, 1);
    const skip = (currentPage - 1) * perPage;

    // 1) Logged in admin এর পুরো scope বের করো
    const scopedTreeIds = await getAllowedTreeIds(currentAdminId);

    if (!scopedTreeIds.length) {
      return res.json({
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
          currentAdminId,
          currentAdminRole,
        },
        pagination: {
          page: currentPage,
          limit: perPage,
          totalRecords: 0,
          totalPages: 1,
          hasPrev: false,
          hasNext: false,
        },
        totals: {
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
        },
        data: [],
      });
    }

    // 2) এই scope এর নিচে শুধু user role যারা আছে তাদের নাও
    let effectiveUserIds = await getUserIdsFromTree(scopedTreeIds);

    // 3) Search যদি কোনো admin/user username এর সাথে match করে
    // তাহলে ওই admin/user এর নিচের সব user দেখাও
    let historySearchMatch = {};

    if (search?.trim()) {
      const matchedAdminIds = await getMatchedAdminIdsWithinScope(
        search,
        scopedTreeIds,
      );

      if (matchedAdminIds.length > 0) {
        const matchedSubtreeIds =
          await getSelfAndDescendantIds(matchedAdminIds);
        effectiveUserIds = await getUserIdsFromTree(matchedSubtreeIds);
      } else {
        const regex = new RegExp(search.trim(), "i");
        historySearchMatch = {
          $or: [
            { "gameHistory.username": regex },
            { "gameHistory.game_code": regex },
            { "gameHistory.provider_code": regex },
            { "gameHistory.transaction_id": regex },
            { username: regex }, // direct user username
          ],
        };
      }
    }

    if (!effectiveUserIds.length) {
      return res.json({
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
          currentAdminId,
          currentAdminRole,
        },
        pagination: {
          page: currentPage,
          limit: perPage,
          totalRecords: 0,
          totalPages: 1,
          hasPrev: false,
          hasNext: false,
        },
        totals: {
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
        },
        data: [],
      });
    }

    const matchStage = {
      _id: { $in: effectiveUserIds.map((id) => toObjectId(id)) },
      role: ROLE.US,
    };

    // Date range filter
    if (fromDate && toDate) {
      const fromLocal = `${fromDate} ${fromTime || "00:00:00"}`;
      const toLocal = `${toDate} ${toTime || "23:59:59"}`;

      const fromUtc = dayjs
        .tz(fromLocal, "YYYY-MM-DD HH:mm:ss", tz)
        .utc()
        .toDate();

      const toUtc = dayjs.tz(toLocal, "YYYY-MM-DD HH:mm:ss", tz).utc().toDate();

      matchStage["gameHistory.createdAt"] = {
        $gte: fromUtc,
        $lte: toUtc,
      };
    }

    if (betType && betType !== "ALL") {
      matchStage["gameHistory.bet_type"] = String(betType).toUpperCase();
    }

    if (status && status !== "ALL") {
      matchStage["gameHistory.status"] = String(status).toLowerCase();
    }

    const basePipeline = [
      {
        $match: {
          _id: { $in: effectiveUserIds.map((id) => toObjectId(id)) },
          role: ROLE.US,
        },
      },
      { $unwind: "$gameHistory" },
      {
        $match: {
          ...matchStage,
          ...historySearchMatch,
        },
      },
    ];

    const countPipeline = [...basePipeline, { $count: "totalRecords" }];

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
          role: "$role",
          createdBy: "$createdBy",

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

    const totalsPipeline = [
      ...basePipeline,
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          totalAmount: { $sum: { $ifNull: ["$gameHistory.amount", 0] } },

          totalBetAmount: {
            $sum: {
              $cond: [
                { $eq: ["$gameHistory.bet_type", "BET"] },
                { $ifNull: ["$gameHistory.amount", 0] },
                0,
              ],
            },
          },
          totalSettleAmount: {
            $sum: {
              $cond: [
                { $eq: ["$gameHistory.bet_type", "SETTLE"] },
                { $ifNull: ["$gameHistory.amount", 0] },
                0,
              ],
            },
          },
          totalCancelAmount: {
            $sum: {
              $cond: [
                { $eq: ["$gameHistory.bet_type", "CANCEL"] },
                { $ifNull: ["$gameHistory.amount", 0] },
                0,
              ],
            },
          },
          totalRefundAmount: {
            $sum: {
              $cond: [
                { $eq: ["$gameHistory.bet_type", "REFUND"] },
                { $ifNull: ["$gameHistory.amount", 0] },
                0,
              ],
            },
          },

          wonAmount: {
            $sum: {
              $cond: [
                { $eq: ["$gameHistory.status", "won"] },
                { $ifNull: ["$gameHistory.amount", 0] },
                0,
              ],
            },
          },
          lostAmount: {
            $sum: {
              $cond: [
                { $eq: ["$gameHistory.status", "lost"] },
                { $ifNull: ["$gameHistory.amount", 0] },
                0,
              ],
            },
          },
          cancelledAmount: {
            $sum: {
              $cond: [
                { $eq: ["$gameHistory.status", "cancelled"] },
                { $ifNull: ["$gameHistory.amount", 0] },
                0,
              ],
            },
          },
          refundedAmount: {
            $sum: {
              $cond: [
                { $eq: ["$gameHistory.status", "refunded"] },
                { $ifNull: ["$gameHistory.amount", 0] },
                0,
              ],
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
              {
                $add: [
                  "$totalSettleAmount",
                  "$totalRefundAmount",
                  "$totalCancelAmount",
                ],
              },
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

    return res.json({
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
        currentAdminId,
        currentAdminRole,
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
    return res.status(500).json({
      success: false,
      message: "Failed to fetch game history report",
      error: error.message,
    });
  }
});

export default router;
