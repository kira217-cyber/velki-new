// components/Home/CasinoGamesCategory/CasinoGamesCategory.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const CasinoGamesCategory = ({
  allGames,
  dbCategories,
  selectedMainCat,
  selectedProvider,
}) => {
  const [visibleCount, setVisibleCount] = useState(9);
  const [subFilter, setSubFilter] = useState("catalog");

  useEffect(() => {
    setVisibleCount(9);
    setSubFilter("catalog");
  }, [selectedMainCat, selectedProvider]);

  if (!selectedMainCat) {
    return (
      <div className="text-center py-32 text-2xl text-gray-600">
        Please select a category
      </div>
    );
  }

  const getProviderIdsForCategory = (categoryName) => {
    return dbCategories
      .filter((c) => c.categoryName === categoryName)
      .map((c) => String(c.providerId));
  };

  const filteredGames = allGames
    .filter((game) => {
      const gameProviderCode = String(game?.provider?.provider_code || "");
      const allowedIds = selectedProvider
        ? [String(selectedProvider.providerId)]
        : getProviderIdsForCategory(selectedMainCat.categoryName);

      return allowedIds.includes(gameProviderCode);
    })
    .filter((game) => {
      if (subFilter === "catalog") return game.isCatalog === true;
      if (subFilter === "latest") return game.isLatest === true;
      if (subFilter === "a_z") return true;
      return true;
    })
    .sort((a, b) =>
      subFilter === "a_z"
        ? (a.gameName || "").localeCompare(b.gameName || "")
        : 0,
    );

  const visibleGames = filteredGames.slice(0, visibleCount);
  const hasMore = visibleCount < filteredGames.length;

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + 9);
  };

  const renderGameImage = (game) => {
    const imageUrl = game.image || "";

    if (imageUrl) {
      return (
        <img
          src={imageUrl}
          alt={game.gameName || "Game"}
          className="rounded-tr-xl rounded-bl-xl w-full object-cover h-28 md:h-48"
          onError={(e) => {
            e.target.style.display = "none";
            if (e.target.nextSibling) {
              e.target.nextSibling.style.display = "flex";
            }
          }}
        />
      );
    }

    return (
      <div className="rounded-tr-xl rounded-bl-xl w-full h-48 bg-gray-300 flex items-center justify-center text-gray-600 text-xs">
        No Image
      </div>
    );
  };

  return (
    <div className="px-2 mt-4">
      {/* Catalog | Latest | A-Z Tabs */}
      <div className="flex bg-white border-b">
        {["Catalog", "Latest", "A-Z"].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setSubFilter(tab.toLowerCase().replace("-", "_"));
              setVisibleCount(9);
            }}
            className={`px-6 py-3 font-bold transition-all ${
              subFilter === tab.toLowerCase().replace("-", "_")
                ? "text-yellow-600 border-b-4 border-yellow-600"
                : "text-gray-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-4 md:p-8">
        <h2 className="text-xl font-bold text-yellow-600 mb-4">
          {selectedMainCat.categoryName}{" "}
          {selectedProvider ? `- ${selectedProvider.providerName}` : ""} (
          {filteredGames.length})
        </h2>

        {visibleGames.length === 0 ? (
          <div className="text-center py-20 text-gray-500 text-xl">
            No games found in this section
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              {visibleGames.map((game) => (
                <Link
                  to={`/games/demo/${game._id}`}
                  key={game._id}
                  className="block"
                >
                  <div className="relative">
                    {renderGameImage(game)}
                    <div
                      className="rounded-tr-xl rounded-bl-xl w-full h-28 md:h-48 bg-gray-300 items-center justify-center text-gray-600 text-xs"
                      style={{ display: "none" }}
                    >
                      No Image
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-10">
                <button
                  onClick={handleShowMore}
                  className="px-10 py-3 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white font-bold text-lg rounded-full shadow-xl hover:scale-105 transition"
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

export default CasinoGamesCategory;