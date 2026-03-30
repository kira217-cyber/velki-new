import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "@/context/AuthContext";

const DemoGame = () => {
  const { id } = useParams();
  const { user, balance } = useContext(AuthContext);

  const [htmlContent, setHtmlContent] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const launchGame = async () => {
      if (!user) {
        setError("Please login first!");
        return;
      }

      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/callback-data-game/playgame`,
          {
            gameID: id,
            username: user.username,
            money: balance ? Math.round(balance * 100) : 0,
          },
        );

        if (res.data.success && res.data.gameUrl) {
          // 🔥 IMPORTANT: backend already gives FULL HTML
          setHtmlContent(res.data.gameUrl);
        } else {
          setError(res.data.message || "Game not found");
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to load game");
      }
    };

    launchGame();
  }, [id, user, balance]);

  // ❌ Error UI
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        {error}
      </div>
    );
  }

  // ✅ Only iframe (everything inside HTML)
  return (
    <div className="w-full h-screen bg-black">
      {htmlContent && (
        <iframe
          srcDoc={htmlContent}
          title="Game"
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-top-navigation"
        />
      )}
    </div>
  );
};

export default DemoGame;
