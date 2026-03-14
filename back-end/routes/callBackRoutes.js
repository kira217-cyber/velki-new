// routes/callback.js
import express from "express";
import Admin from "../models/Admin.js";
import axios from "axios";
import qs from "qs";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const {
      account_id,
      username: rawUsername,
      provider_code,
      amount,
      game_code,
      verification_key,
      bet_type,
      transaction_id,
      times,
    } = req.body;

    console.log("Callback received ->", {
      account_id,
      rawUsername,
      provider_code,
      amount,
      bet_type,
    });

    // 🔴 Required fields check
    if (
      !rawUsername ||
      !provider_code ||
      amount === undefined ||
      !game_code ||
      !bet_type
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // 🔹 Username clean (শেষের সংখ্যা কেটে ফেলা)
    const cleanUsername = rawUsername.replace(/[0-9]+$/, "").trim();

    if (!cleanUsername) {
      return res.status(400).json({
        success: false,
        message: "Invalid username format",
      });
    }

    console.log("Searching user with username:", cleanUsername);

    // 🔹 Find player
    const player = await Admin.findOne({ username: cleanUsername });

    if (!player) {
      console.log("User NOT found for:", cleanUsername);
      return res.status(404).json({
        success: false,
        message: "User not found",
        debug: {
          searched: cleanUsername,
          original: rawUsername,
        },
      });
    }

    console.log(
      "Player found:",
      player.username,
      "Current Balance (PBU):",
      player.balance
    );

    // 🔹 Amount validation (BDT)
    const amountBDT = parseFloat(amount);
    if (isNaN(amountBDT) || amountBDT < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount value",
      });
    }

    // 🔹 Convert BDT → PBU
    // Rule: 1 PBU = 100 BDT
    const amountPBU = amountBDT / 100;

    // 🔹 Balance change (PBU)
    let balanceChange = 0;

    if (bet_type === "BET") {
      balanceChange = -amountPBU;
    } else if (bet_type === "SETTLE") {
      balanceChange = amountPBU;
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid bet_type",
      });
    }

    const previousBalance = player.balance || 0;
    const newBalance = previousBalance + balanceChange;

    // 🔹 Game history record
    const gameRecord = {
      username: player.username,
      provider_code,
      game_code,
      bet_type,
      amount_bdt: amountBDT,
      amount_pbu: amountPBU,
      transaction_id: transaction_id || null,
      verification_key: verification_key || null,
      times: times || null,
      status: balanceChange > 0 ? "won" : "lost",
      createdAt: new Date(),
    };

    // 🔹 Update DB
    const updatedPlayer = await Admin.findOneAndUpdate(
      { _id: player._id },
      {
        $set: { balance: newBalance },
        $push: { gameHistory: gameRecord },
      },
      { new: true }
    );

    return res.json({
      success: true,
      message: "Callback processed successfully",
      data: {
        original_username: rawUsername,
        matched_username: player.username,
        previous_balance_pbu: previousBalance,
        change_pbu: balanceChange,
        new_balance_pbu: updatedPlayer.balance,
        amount_bdt: amountBDT,
        amount_pbu: amountPBU,
      },
    });
  } catch (error) {
    console.error("Callback error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
});

// router.post("/playgame", async (req, res) => {
//   try {
//     const { gameID, username, money } = req.body;

//     const sanitizedMoney = Number.isFinite(Number(money))
//       ? Math.round(Number(money))
//       : 0; // provider requires whole-number balance

//     // Validation
//     if (!gameID || !username || money === undefined) {
//       return res.status(400).json({
//         success: false,
//         message: "gameID, username and money are required",
//       });
//     }

//     // Step 1: Oracle থেকে গেমের ডাটা নাও (game_uuid দরকার)
//     let gameData;
//     try {
//       const oracleRes = await axios.get(
//         `https://apigames.oracleapi.net/api/games/${gameID}`,
//         {
//           headers: {
//             "x-api-key": "b4fb7adb955b1078d8d38b54f5ad7be8ded17cfba85c37e4faa729ddd679d379",
//           },
//         }
//       );
//       gameData = oracleRes.data.data || [];

//       console.log("gameData ",gameData.game_uuid);
      

//     } catch (err) {
//       console.error("Oracle API Error:", err.response?.data || err.message);
//       return res.status(404).json({
//         success: false,
//         message: "Game not found or invalid gameID",
//       });
//     }

//     // game_uuid না থাকলে এরর
//     if (!gameData.game_uuid) {
//       return res.status(400).json({
//         success: false,
//         message: "game_uuid not found for this game",
//       });
//     }

//     // Step 2: crazybet99 এর API তে পোস্ট করো api.velki.oracelsoft.com
//     const postData = {
//       home_url: "https://velki360.com",
//       token: "5a559cc11093333dd5986df2498c6aea",
//       //    home_url: "https://cp666.live",
//       // token: "e9a26dd9196e51bb18a44016a9ca1d73",
//       username: username + "45", // চাইলে random করো
//       money: sanitizedMoney,
//       gameid:gameData.game_uuid, // এখানে game_uuid পাঠানো হচ্ছে
//       // gameid:"691ff8d38f31e", // এখানে game_uuid পাঠানো হচ্ছে
//     };
//     // const postData = {
//     //   home_url: "https://velki.oracelsoft.com",
//     //   token: "19ac2520cfee68817d1f7e928b7b79e0",
//     //   username: username + "45", // চাইলে random করো
//     //   money: money,
//     //   gameid:gameData.game_uuid, // এখানে game_uuid পাঠানো হচ্ছে
//     // };
//     // const postData = {
//     //   home_url: "https://cp666.live",
//     //   token: "e9a26dd9196e51bb18a44016a9ca1d73",
//     //   username: username + "45", // চাইলে random করো
//     //   money: money,
//     //   gameUid: gameData.game_uuid, // এখানে game_uuid পাঠানো হচ্ছে
//     // };

//     console.log("Launching game with:", postData);

//       const response = await axios.post(
//       "https://crazybet99.com/getgameurl",
//       qs.stringify(postData),
//       {
//         headers: {
//           "Content-Type": "application/x-www-form-urlencoded",
//           "x-dstgame-key": postData.token,
//         },
//         timeout: 15000,
//       }
//     );

//     const gameUrl = response.data.url || response.data.game_url || response.data;

//     if (!gameUrl) {
//       return res.status(500).json({
//         success: false,
//         message: "Game URL not received from provider",
//         providerResponse: response.data,
//       });
//     }

//     // সাকসেস — গেম URL পাঠাও
//     return res.json({
//       success: true,
//       gameUrl: gameUrl,
//       gameName: gameData.name,
//       provider: gameData.provider?.name || "Unknown",
//     });
//   } catch (error) {
//     console.error("PlayGame API Error:", error.response?.data || error.message);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to launch game 2",
//       error: error.response?.data || error.message,
//     });
//   }
// });

router.post("/playgame", async (req, res) => {
  try {
    const { gameID, username, money } = req.body;

    const sanitizedMoney = Number.isFinite(Number(money))
      ? Math.round(Number(money))
      : 0;

    // Validation
    if (!gameID || !username || money === undefined) {
      return res.status(400).json({
        success: false,
        message: "gameID, username and money are required",
      });
    }

    // Step 1: Oracle থেকে game data নাও
    let gameData;
    try {
      const oracleRes = await axios.get(
        `https://api.oraclegames.live/api/games/${gameID}`,
        {
          headers: {
            "x-api-key": "ceeeba1c-892b-4571-b05f-2bcec5c4a44e",
          },
        }
      );

      gameData = oracleRes.data?.data || null;

      console.log("gameData:", gameData);
    } catch (err) {
      console.error("Oracle API Error:", err.response?.data || err.message);
      return res.status(404).json({
        success: false,
        message: "Game not found or invalid gameID",
      });
    }

    // provider_code required
    if (!gameData?.provider?.provider_code) {
      return res.status(400).json({
        success: false,
        message: "provider_code not found for this game",
      });
    }

    // game_code required
    if (!gameData?.game_code) {
      return res.status(400).json({
        success: false,
        message: "game_code not found for this game",
      });
    }

    // Step 2: new launch payload
    const postData = {
      username: username + "45", // পুরানো functionality same রাখা হয়েছে
      money: sanitizedMoney,
      provider_code: gameData.provider.provider_code,
      game_code: gameData.game_code,
      game_type: gameData.game_type || 0,
    };

    console.log("Launching game with:", postData);

    const response = await axios.post(
      "https://crazybet99.com/getgameurl/v2",
      qs.stringify(postData),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "x-dstgame-key": process.env.DST_GAME_KEY,
        },
        timeout: 15000,
      }
    );

    // provider response direct url / object দুইটাই handle করা হয়েছে
    const gameUrl =
      response.data?.url ||
      response.data?.game_url ||
      response.data?.data ||
      response.data;

    if (!gameUrl) {
      return res.status(500).json({
        success: false,
        message: "Game URL not received from provider",
        providerResponse: response.data,
      });
    }

    // Success response same style
    return res.json({
      success: true,
      gameUrl: gameUrl,
      gameName: gameData.gameName || gameData.name || "Unknown",
      provider:
        gameData.provider?.providerName ||
        gameData.provider?.name ||
        gameData.provider?.provider_code ||
        "Unknown",
    });
  } catch (error) {
    console.error("PlayGame API Error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to launch game",
      error: error.response?.data || error.message,
    });
  }
});


router.post("/playgame-direct-gameuuid", async (req, res) => {
  try {
    const { gameID, username, money } = req.body;

    const sanitizedMoney = Number.isFinite(Number(money))
      ? Math.round(Number(money))
      : 0; // provider expects integer credits

    // Validation
    if (!gameID || !username || money == null) {
      return res.status(400).json({
        success: false,
        message: "gameID, username and money are required",
      });
    }

    console.log("Launching live game:", gameID);

   
    const postData = {
      home_url: "https://velki360.com",
      token: "5a559cc11093333dd5986df2498c6aea",
      //    home_url: "https://cp666.live",
      // token: "e9a26dd9196e51bb18a44016a9ca1d73",
      username: username + "45",
      money: sanitizedMoney,
      gameid: gameID,
    };

    console.log("this is post data -> ",postData);
    


    const response = await axios.post(
      "https://crazybet99.com/getgameurl",
      qs.stringify(postData),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "x-dstgame-key": postData.token,
        },
        timeout: 15000,
      }
    );

    console.log("Provider response:", response.data);

    // handle all possible response formats
    const gameUrl =
      response?.data?.url ||
      response?.data?.game_url ||
      (typeof response.data === "string" ? response.data : null);

    if (!gameUrl) {
      return res.status(502).json({
        success: false,
        message: "Game URL not received from provider",
        providerResponse: response.data,
      });
    }

    return res.json({
      success: true,
      gameUrl,
    });

  } catch (error) {
    console.error(
      "PlayGame API Error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to launch game 23",
      error: error.response?.data || error.message,
    });
  }
});

router.post("/test", async (req, res) => {
  try {
    const finalUsername = `roni45`;
    const postData = {
      home_url: "https://cb66.online", 
      token: "9c7bf891c268d1e0bcb1e723ae3c9b40", 
      username: finalUsername, // চাইলে random করতে পারো 
      money: 100,
      gameid: "691b3574d5cae",
    };
    // const postData = {
      // home_url: "https://velki360.com",
      // token: "5a559cc11093333dd5986df2498c6aea",
    //   username: finalUsername, // চাইলে random করতে পারো 
    //   money: 100,
    //   gameid: "691b3574d5cae",
    // };

    console.log("Post data:", postData);

    const response = await axios.post(
      "https://crazybet99.com/getgameurl",
      qs.stringify(postData),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "x-dstgame-key": postData.token,
        },
        timeout: 15000,
      }
    );

    console.log("Provider response:", response.data);

    return res.json({
      success: true,
      message: "Test endpoint working",
      providerResponse: response.data,
      receivedData: req.body,
    });
  } catch (error) {
    console.error("Test error:", {
      message: error.message,
      status: error.response?.status,
      headers: error.response?.headers,
      data: error.response,
    });

    return res.status(500).json({
      success: false,
      message: "Test failed",
      error: error.message,
      status: error.response?.status,
      providerResponse: error.response?.data,
    });
  }
});


// routes/callback.js এর ভিতরে এই route টা যোগ করো
router.post("/refund", async (req, res) => {
  try {
    const {
      account_id,
      username: rawUsername,
      provider_code,
      amount,                // এখানে integer আসবে
      game_code,
      verification_key,
      bet_type,
      transaction_id,
      times,
    } = req.body;

    console.log("Refund/CancelBET callback received →", {
      account_id,
      rawUsername,
      provider_code,
      amount,
      bet_type,
      transaction_id,
    });

    // Required fields + bet_type check
    if (
      !rawUsername ||
  
      amount === undefined ||
   
      bet_type !== "CANCELBET"
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields or invalid bet_type (only CANCELBET allowed)",
      });
    }

    // Amount কে integer হিসেবে validate করা (যদি string আসে তাহলে convert)
    const amountBDT = Number(amount);   // string হলে number-এ কনভার্ট
    if (!Number.isInteger(amountBDT) || amountBDT < 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a non-negative integer (in BDT)",
      });
    }

    // Username clean — শেষের সংখ্যা কেটে ফেলা (যেমন roni45 → roni)
    const cleanUsername = rawUsername.replace(/[0-9]+$/, "").trim();

    if (!cleanUsername) {
      return res.status(400).json({
        success: false,
        message: "Invalid username format",
      });
    }

    console.log("Searching user for refund:", cleanUsername);

    const player = await Admin.findOne({ username: cleanUsername });

    if (!player) {
      console.log("User NOT found for refund:", cleanUsername);
      return res.status(404).json({
        success: false,
        message: "User not found",
        debug: { searched: cleanUsername, original: rawUsername },
      });
    }

    console.log(
      "Player found for refund:",
      player.username,
      "Current Balance (PBU):",
      player.balance
    );

    // 1 PBU = 100 BDT → তাই amountBDT / 100
    const amountPBU = amountBDT / 100;

    // CANCELBET → refund (প্লাস হবে)
    const balanceChange = amountPBU;  // positive

    const previousBalance = player.balance || 0;
    const newBalance = previousBalance + balanceChange;

    // Game history record
    const gameRecord = {
      username: player.username,
      provider_code,
      game_code,
      bet_type: "CANCELBET",
      amount_bdt: amountBDT,
      amount_pbu: amountPBU,
      transaction_id: transaction_id || null,
      verification_key: verification_key || null,
      times: times || null,
      status: "refunded",
      createdAt: new Date(),
    };

    // DB update
    const updatedPlayer = await Admin.findOneAndUpdate(
      { _id: player._id },
      {
        $set: { balance: newBalance },
        // $push: { gameHistory: gameRecord },
      },
      { new: true }
    );

    return res.json({
      success: true,
      message: "Refund processed successfully (CANCELBET)",
      data: {
        original_username: rawUsername,
        matched_username: player.username,
        previous_balance_pbu: previousBalance,
        refunded_pbu: balanceChange,
        new_balance_pbu: updatedPlayer.balance,
        amount_bdt: amountBDT,
        amount_pbu: amountPBU,
      },
    });
  } catch (error) {
    console.error("Refund callback error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during refund",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export default router;
