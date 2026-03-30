import React, { useContext, useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "@/context/AuthContext";

const DemoGame = () => {
  const { id } = useParams(); // gameID
  const { user, balance } = useContext(AuthContext);
  const [gameUrl, setGameUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loaderRef = useRef(null);
  const iframeRef = useRef(null);
  const progressFillRef = useRef(null);
  const percentRef = useRef(null);

  // Fetch game launch URL
  useEffect(() => {
    const launchGame = async () => {
      if (!user) {
        setError("Please login first!");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/callback-data-game/playgame`,
          {
            gameID: id,
            username: user.username,
            money: balance ? Math.round(balance * 100) : 0,
          },
        );

        if (response.data.success && response.data.gameUrl) {
          setGameUrl(response.data.gameUrl);
        } else {
          setError(response.data.message || "Game URL not received");
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to load game");
      }
    };

    launchGame();
  }, [id, user, balance]);

  // Loader animation
  useEffect(() => {
    if (!gameUrl) return;

    const loader = loaderRef.current;
    const iframe = iframeRef.current;
    const fill = progressFillRef.current;
    const percentText = percentRef.current;

    let progress = 0;
    const minDisplayTime = 4000;
    const startTime = Date.now();

    const interval = setInterval(() => {
      progress += Math.random() * 8;
      if (progress >= 100) progress = 100;
      fill.style.width = progress + "%";
      percentText.innerText = Math.floor(progress) + "%";
      if (progress === 100) clearInterval(interval);
    }, 120);

    const onLoad = () => {
      progress = 100;
      fill.style.width = "100%";
      percentText.innerText = "100%";
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minDisplayTime - elapsed);
      setTimeout(() => {
        loader.style.opacity = "0";
        iframe.style.opacity = "1";
        setTimeout(() => {
          loader.style.display = "none";
        }, 600);
      }, remaining + 400);
    };

    iframe.addEventListener("load", onLoad);

    const timeout = setTimeout(() => {
      if (loader.style.display !== "none") {
        onLoad();
      }
    }, 15000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      iframe.removeEventListener("load", onLoad);
    };
  }, [gameUrl]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-red-900 text-white">
        <h1 className="text-3xl font-bold mb-4">Error</h1>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-8 py-3 bg-yellow-600 rounded-full font-bold hover:bg-yellow-500"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* Loader */}
      <div
        ref={loaderRef}
        className="loader-bg fixed top-0 left-0 w-full h-full flex flex-col items-center justify-center z-[9999] transition-opacity duration-500"
      >
        <img
          src="https://oracleapi.co.uk/upload/logo.png"
          className="loader-logo w-[500px] mb-9 animate-pulse"
        />
        <div className="loader-text text-white text-xl mb-4">
          Connecting to provider...
        </div>
        <div ref={percentRef} className="percent text-[#00c3ff] text-lg mb-3">
          0%
        </div>
        <div className="progress-bar w-[280px] h-[10px] bg-[#222] rounded-full overflow-hidden shadow-lg">
          <div
            ref={progressFillRef}
            className="progress-fill h-full w-0 bg-gradient-to-r from-[#00c3ff] to-[#00ffe0] rounded-full relative"
          ></div>
        </div>
      </div>

      {/* Game iframe */}
      {gameUrl && (
        <iframe
          ref={iframeRef}
          src={gameUrl}
          title="Game"
          className="responsive-iframe w-full h-screen border-0 absolute top-0 left-0 opacity-0 transition-opacity duration-500"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
      )}
    </div>
  );
};

export default DemoGame;
