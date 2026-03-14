// pages/Casino.jsx
import CasinoGamesCategory from "@/components/Home/CasinoGamesCategory/CasinoGamesCategory";
import axios from "axios";
import { useState, useEffect, useRef } from "react";

const ORACLE_API_KEY = "ceeeba1c-892b-4571-b05f-2bcec5c4a44e";
const GAMES_BY_IDS_API = "https://api.oraclegames.live/api/games/by-ids";

const normalizeImage = (image) => {
  if (!image) return "";
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (image.startsWith("/uploads/")) {
    return `${import.meta.env.VITE_API_URL}${image}`;
  }
  return `${import.meta.env.VITE_API_URL}/uploads/${image}`;
};

const Casino = () => {
  const [allGames, setAllGames] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [selectedMainCat, setSelectedMainCat] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [loading, setLoading] = useState(true);

  const fixedCategories = [
    {
      title: "Popular",
      value: "popular",
      image: "https://www.wickspin24.live/casino/nav/popular.svg",
      hoverImage: "https://www.wickspin24.live/casino/nav/hover-popular.svg",
    },
    {
      title: "Live",
      value: "live",
      image: "https://www.wickspin24.live/casino/nav/live.svg",
      hoverImage: "https://www.wickspin24.live/casino/nav/hover-live.svg",
    },
    {
      title: "Table",
      value: "table",
      image: "https://www.wickspin24.live/casino/nav/table.svg",
      hoverImage: "https://www.wickspin24.live/casino/nav/hover-table.svg",
    },
    {
      title: "Slot",
      value: "slot",
      image: "https://www.wickspin24.live/casino/nav/slot.svg",
      hoverImage: "https://www.wickspin24.live/casino/nav/hover-slot.svg",
    },
    {
      title: "Fishing",
      value: "fishing",
      image: "https://www.wickspin24.live/casino/nav/fishing.svg",
      hoverImage: "https://www.wickspin24.live/casino/nav/hover-fishing.svg",
    },
    {
      title: "Egame",
      value: "egame",
      image: "https://www.wickspin24.live/casino/nav/egame.svg",
      hoverImage: "https://www.wickspin24.live/casino/nav/hover-egame.svg",
    },
  ];

  const categoryContainerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, selectedRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/categories`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/selected-games`),
        ]);

        const categories = catRes.data?.data || [];
        const selectedGamesData = selectedRes.data?.data || [];

        setDbCategories(categories);

        const gameIds = selectedGamesData
          .map((item) => item.gameId)
          .filter(Boolean);

        if (gameIds.length === 0) {
          setAllGames([]);
          const popularCats = categories.filter(
            (c) => c.categoryName === "Popular",
          );
          if (popularCats.length > 0) {
            setSelectedMainCat(popularCats[0]);
            setSelectedProvider(null);
          }
          return;
        }

        const idsParam = gameIds.join(",");

        const gamesRes = await axios.get(
          `${GAMES_BY_IDS_API}?ids=${idsParam}`,
          {
            headers: {
              "x-api-key": ORACLE_API_KEY,
            },
          },
        );

        const games = gamesRes.data?.data || [];

        const gamesWithFlags = games.map((game) => {
          const selectedInfo = selectedGamesData.find(
            (s) => String(s.gameId) === String(game._id),
          );

          const dbImage = selectedInfo?.image
            ? normalizeImage(selectedInfo.image)
            : "";
          const finalImage = dbImage || game.image || "/no-image.png";

          return {
            ...game,
            image: finalImage,
            defaultApiImage: game.image || "",
            customImage: dbImage || "",
            isCatalog: selectedInfo?.isCatalog || false,
            isLatest: selectedInfo?.isLatest || false,
            isA_Z: selectedInfo?.isA_Z || false,
          };
        });

        setAllGames(gamesWithFlags);

        const popularCats = categories.filter(
          (c) => c.categoryName === "Popular",
        );
        if (popularCats.length > 0) {
          setSelectedMainCat(popularCats[0]);
          setSelectedProvider(null);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getActiveProvidersForCategory = (categoryName) => {
    return dbCategories
      .filter((cat) => cat.categoryName === categoryName)
      .filter((cat) =>
        allGames.some(
          (g) =>
            String(g?.provider?.provider_code || "") === String(cat.providerId),
        ),
      );
  };

  const handleScroll = () => {
    if (!categoryContainerRef.current) return;
    const scrollLeft = categoryContainerRef.current.scrollLeft;
    const scrollWidth =
      categoryContainerRef.current.scrollWidth -
      categoryContainerRef.current.clientWidth;
    const dots = Math.ceil(
      scrollWidth / categoryContainerRef.current.clientWidth,
    );
    setCurrentPage(Math.round((scrollLeft / scrollWidth) * dots));
  };

  useEffect(() => {
    const container = categoryContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const scrollToPage = (page) => {
    const container = categoryContainerRef.current;
    const pageWidth = container.clientWidth;
    container.scrollTo({ left: page * pageWidth, behavior: "smooth" });
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-3xl text-yellow-600">
        Loading Games...
      </div>
    );
  }

  return (
    <div>
      {/* Fixed 6 Categories */}
      <div className="relative mt-14">
        <div
          ref={categoryContainerRef}
          className="flex justify-start px-2 pt-2 pb-8 gap-2 w-full overflow-x-auto no-scrollbar h-auto"
          style={{
            backgroundImage:
              "url('https://www.wickspin24.live/images/nav_bg.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {fixedCategories.map((cat) => {
            const activeProviders = getActiveProvidersForCategory(cat.title);
            const hasAnyGame = activeProviders.length > 0;

            return (
              <div
                key={cat.value}
                className={`min-w-20 min-h-20 flex flex-col items-center justify-center gap-1 p-4 text-lg rounded-lg cursor-pointer transition-all ${
                  selectedMainCat &&
                  activeProviders.some((p) => p._id === selectedMainCat._id)
                    ? "bg-[#474a4e] text-[#CCB386]"
                    : hasAnyGame
                      ? "text-[#946F3B] hover:text-[#CCB386] hover:bg-[#474a4e]"
                      : "text-gray-500 opacity-50 cursor-not-allowed"
                }`}
                onClick={() => {
                  if (hasAnyGame) {
                    setSelectedMainCat(activeProviders[0]);
                    setSelectedProvider(null);
                  }
                }}
              >
                <p className="font-semibold">{cat.title}</p>
                <img
                  src={
                    selectedMainCat &&
                    activeProviders.some((p) => p._id === selectedMainCat._id)
                      ? cat.hoverImage
                      : cat.image
                  }
                  alt={cat.title}
                  className={!hasAnyGame ? "grayscale" : ""}
                />
              </div>
            );
          })}
        </div>

        {/* <div className="flex justify-center p-2 bg-black absolute w-full bottom-2">
          {Array.from({ length: 6 }, (_, i) => (
            <button key={i} onClick={() => scrollToPage(i)} className={`h-2 mx-1 rounded-full ${currentPage === i ? "bg-[#f4c004] w-7" : "bg-[#828486] w-2"}`} />
          ))}
        </div> */}
      </div>

      {/* Provider Tabs */}
      {selectedMainCat && (
        <div className="bg-[#333333] py-4 px-6 flex gap-4 overflow-x-auto no-scrollbar whitespace-nowrap">
          <button
            onClick={() => setSelectedProvider(null)}
            className={`px-6 py-2 rounded-full font-bold transition-all ${
              !selectedProvider
                ? "bg-white text-black shadow-xl scale-110"
                : "bg-black/40 text-white hover:bg-white/30"
            }`}
          >
            ALL
          </button>

          {getActiveProvidersForCategory(selectedMainCat.categoryName).map(
            (cat) => (
              <button
                key={cat._id}
                onClick={() => setSelectedProvider(cat)}
                className={`px-6 py-2 rounded-full font-bold transition-all ${
                  selectedProvider?._id === cat._id
                    ? "bg-white text-black shadow-xl scale-110"
                    : "bg-black/40 text-white hover:bg-white/30"
                }`}
              >
                {cat.providerName}
              </button>
            ),
          )}
        </div>
      )}

      {/* Games Grid with Show More */}
      <CasinoGamesCategory
        allGames={allGames}
        dbCategories={dbCategories}
        selectedMainCat={selectedMainCat}
        selectedProvider={selectedProvider}
      />
    </div>
  );
};

export default Casino;
