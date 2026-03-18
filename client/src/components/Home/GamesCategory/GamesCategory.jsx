// components/GamesCategory/GamesCategory.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { ImBooks } from "react-icons/im";
import { BsFire } from "react-icons/bs";
import { TbSortAZ } from "react-icons/tb";

const GamesCategory = ({ selectedGames = [] }) => {
  const [selectedFilter, setSelectedFilter] = useState("a-z");
  const [visibleCount, setVisibleCount] = useState(18);

  // ফিল্টার + সর্ট
  const filteredGames = selectedGames
    .filter((game) => {
      if (selectedFilter === "catalog") return game.isCatalog === true;
      if (selectedFilter === "latest") return game.isLatest === true;
      if (selectedFilter === "a-z") return true;
      return true;
    })
    .sort((a, b) => {
      if (selectedFilter === "a-z") {
        return (a.gameName || "").localeCompare(b.gameName || "");
      }
      return 0;
    });

  // যে গেমগুলো দেখানো হবে
  const visibleGames = filteredGames.slice(0, visibleCount);
  const hasMore = visibleCount < filteredGames.length;

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + 9);
  };

  const subcategories = [
    { icon: ImBooks, title: "Catalog", value: "catalog" },
    { icon: BsFire, title: "Latest", value: "latest" },
    { icon: TbSortAZ, title: "A-Z", value: "a-z" },
  ];

  // ইমেজ রেন্ডার
  const renderGameImage = (game) => {
    const imageUrl = game.image || "";

    if (!imageUrl) {
      return (
        <div className="bg-gray-200 border-2 border-dashed border-gray-400 rounded-xl w-full aspect-square flex items-center justify-center text-gray-600 text-xs sm:text-sm font-semibold">
          No Image
        </div>
      );
    }

    return (
      <img
        src={imageUrl}
        alt={game.gameName || "Game"}
        className="rounded-xl w-full aspect-square object-cover"
        onError={(e) => {
          e.target.style.display = "none";
          if (e.target.nextSibling) {
            e.target.nextSibling.style.display = "flex";
          }
        }}
      />
    );
  };

  return (
    <div className="flex px-1 sm:px-3">
      {/* Left Sidebar - Tabs */}
      <div className="w-[15%] bg-white rounded-lg p-1 h-fit">
        {subcategories.map(({ icon: Icon, title, value }) => (
          <div
            key={value}
            onClick={() => {
              setSelectedFilter(value);
              setVisibleCount(18);
            }}
            className={`flex flex-col group gap-2 py-2 justify-center items-center rounded-lg cursor-pointer transition-all ${
              selectedFilter === value
                ? "bg-yellow-400 text-black"
                : "hover:bg-yellow-400"
            }`}
          >
            <Icon className="text-3xl text-[#5a5e62] group-hover:text-black" />
            <p className="text-xs sm:text-sm font-medium">{title}</p>
          </div>
        ))}
      </div>

      {/* Right Side - Games Grid + Show More */}
      <div className="w-[80%] px-1 sm:px-2 bg-[#d5e1e6] mx-2 px-2">
        <h2 className="text-lg font-bold px-3 border-s-4 border-blue-900 rounded-md my-4">
          Games ({filteredGames.length})
        </h2>

        {visibleGames.length === 0 ? (
          <div className="text-center py-20 text-gray-500 text-lg">
            No games available in this category
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              {visibleGames.map((game) => (
                <Link
                  to={`/games/demo/${game._id}`}
                  key={game._id}
                  className="block rounded-xl overflow-hidden shadow-md hover:scale-105 transition-transform duration-200"
                >
                  <div className="relative">
                    {renderGameImage(game)}
                    {/* Hidden fallback for onError */}
                    <div
                      className="bg-gray-200 border-2 border-dashed border-gray-400 rounded-xl w-full aspect-square items-center justify-center text-gray-600 text-xs sm:text-sm font-semibold"
                      style={{ display: "none" }}
                    >
                      No Image
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Show More Button */}
            {hasMore && (
              <div className="text-center mt-10">
                <button
                  onClick={handleShowMore}
                  className="px-10 py-3 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white font-bold text-lg rounded-full shadow-xl hover:scale-105 transition-transform duration-200"
                >
                  Show More
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GamesCategory;
