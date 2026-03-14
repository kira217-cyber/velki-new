import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "@/context/AuthContext";

const LiveGameDirect = () => {
  const { id } = useParams();
  const { user, balance } = useContext(AuthContext);
  const [gameUrl, setGameUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [games, setGames] = useState(null);
    const [callFetch, setCallFetch] = useState(true);


  console.log(games);

//   useEffect(() => {
//     const fetchGame = async () => {
//       try {
//         const res = await axios.get(
//           `https://apigames.oracleapi.net/api/games/${id}`,
//           {
//             headers: {
//               "x-api-key":
//                 "b4fb7adb955b1078d8d38b54f5ad7be8ded17cfba85c37e4faa729ddd679d379",
//             },
//           }
//         );
//         setGames(res.data.data || []);
//       } catch (err) {
//         toast.error("Failed to load providers");
//       }
//     };
//     fetchGame();
//   }, [id]);

  useEffect(() => {
    const launchGame = async () => {
      if (!user) {
        setError("Please login first!");
        setLoading(false);
        return;
      }


      if (callFetch === false) return;

      console.log("call ", callFetch);

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/callback-data-game/playgame-direct-gameuuid`,
          {
            gameID: id,
            username: user.username,
            money: balance ? Math.round(balance * 100) : 0,
          }
        );

        if (response.data.success && response.data.gameUrl) {
          setGameUrl(response.data.gameUrl);
          setCallFetch(false);
        } else {
          setError(response.data.message || "Game URL not received");
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to load game");
      } finally {
        setLoading(false);
      }



    };

    launchGame();
  }, [id, user, balance]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
        <div className="text-4xl font-bold animate-pulse">Launching Game</div>
        <div className="mt-4 text-xl">Please wait...</div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-black">
      <iframe
        src={gameUrl}
        title="Game"
        className="w-full h-screen border-0"
        allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
      />
    </div>
  );
};

export default LiveGameDirect;
