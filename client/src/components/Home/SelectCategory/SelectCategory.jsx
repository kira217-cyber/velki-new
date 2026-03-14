import { useState, useRef, useEffect } from "react";
import SportsCategory from "../SportsCategory/SportsCategory";
import GamesCategory from "../GamesCategory/GamesCategory";
import sportsIcon from "@/assets/icons/sports.svg";
import fishingIcon from "@/assets/icons/fishing.svg";
import liveIcon from "@/assets/icons/live.svg";
import slotIcon from "@/assets/icons/slot.svg";
import tableIcon from "@/assets/icons/table.svg";
import endgameIcon from "@/assets/icons/endgame.svg";
import axios from "axios";

const ORACLE_API_KEY = "ceeeba1c-892b-4571-b05f-2bcec5c4a44e";
const GAMES_BY_IDS_API = "https://api.oraclegames.live/api/games/by-ids";

const categories = [
  {
    title: "Sports",
    image: sportsIcon,
    value: "sports",
    description: "Manage your sports preferences here.",
  },
  {
    title: "Live",
    image: liveIcon,
    value: "live",
    description: "Live streaming and events can be managed here.",
  },
  {
    title: "Table",
    image: tableIcon,
    value: "table",
    description: "Manage table games and settings here.",
  },
  {
    title: "Slot",
    image: slotIcon,
    value: "slot",
    description: "Slots games management and preferences.",
  },
  {
    title: "Fishing",
    image: fishingIcon,
    value: "fishing",
    description: "Manage fishing game settings.",
  },
  {
    title: "Egame",
    image: endgameIcon,
    value: "egame",
    description: "Egames management and preferences.",
  },
];

const normalizeImage = (image) => {
  if (!image) return "";
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (image.startsWith("/uploads/")) {
    return `${import.meta.env.VITE_API_URL}${image}`;
  }
  return `${import.meta.env.VITE_API_URL}/uploads/${image}`;
};

export function SelectCategory() {
  const [allGames, setAllGames] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(0);
  const categoryContainerRef = useRef(null);
  const [isHoveredValue, setIsHoveredValue] = useState("");

  // Web menu colors
  const [webMenuBgColor, setWebMenuBgColor] = useState("#ffffff");
  const [webMenuTextColor, setWebMenuTextColor] = useState("#000000");
  const [webMenuFontSize, setWebMenuFontSize] = useState(16);
  const [webMenuHoverColor, setWebMenuHoverColor] = useState("#cccccc");
  const [webMenuHoverTextColor, setWebMenuHoverTextColor] = useState("#000000");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingGames(true);
        setError(null);

        const [catRes, selRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/categories`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/selected-games`),
        ]);

        const categoriesList = catRes.data?.data || [];
        const selectedGamesData = selRes.data?.data || [];

        setDbCategories(categoriesList);

        const gameIds = selectedGamesData
          .map((item) => item.gameId)
          .filter(Boolean);

        if (gameIds.length === 0) {
          setAllGames([]);
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

        const mergedGames = games.map((game) => {
          const selectedInfo = selectedGamesData.find(
            (item) => String(item.gameId) === String(game._id),
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

        setAllGames(mergedGames);
      } catch (err) {
        console.error(err);
        setError("Unable to load games right now.");
      } finally {
        setLoadingGames(false);
      }
    };

    const fetchWebMenu = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/webmenu`,
        );
        const d = res.data || {};

        setWebMenuBgColor(d.webMenuBgColor || "#ffffff");
        setWebMenuTextColor(d.webMenuTextColor || "#000000");
        setWebMenuFontSize(d.webMenuFontSize || 16);
        setWebMenuHoverColor(d.webMenuHoverColor || "#cccccc");
        setWebMenuHoverTextColor(d.webMenuHoverTextColor || "#000000");
      } catch (err) {
        console.error("Webmenu config load failed:", err);
      }
    };

    fetchWebMenu();
    fetchData();
  }, []);

  // category অনুযায়ী provider_code মিলিয়ে game বের করা
  const getGamesForCategory = (catValue) => {
    const map = {
      live: "Live",
      table: "Table",
      slot: "Slot",
      fishing: "Fishing",
      egame: "Egame",
    };

    const dbCategoryName = map[catValue] || "";
    const matchedDbCats = dbCategories.filter(
      (c) =>
        String(c.categoryName).toLowerCase() === dbCategoryName.toLowerCase(),
    );

    const providerCodes = matchedDbCats.map((c) => String(c.providerId));

    return allGames.filter((game) =>
      providerCodes.includes(String(game?.provider?.provider_code || "")),
    );
  };

  const handleScroll = () => {
    if (!categoryContainerRef.current) return;

    const scrollLeft = categoryContainerRef.current.scrollLeft;
    const scrollWidth =
      categoryContainerRef.current.scrollWidth -
      categoryContainerRef.current.clientWidth;

    if (scrollWidth <= 0) {
      setCurrentPage(0);
      return;
    }

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
    if (!container) return;

    const pageWidth = container.clientWidth;
    container.scrollTo({ left: page * pageWidth, behavior: "smooth" });
    setCurrentPage(page);
  };

  const casinoGames = getGamesForCategory(selectedCategory.value);

  const renderGamesFallback = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, idx) => (
        <div
          key={idx}
          className="h-32 rounded-2xl border border-white/5 bg-white/5 animate-pulse"
        />
      ))}
    </div>
  );

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Category Tabs */}
      <div className="relative">
        <div
          style={{
            backgroundColor: webMenuBgColor,
            color: webMenuTextColor,
            fontSize: webMenuFontSize ? `${webMenuFontSize}px` : "14px",
          }}
          ref={categoryContainerRef}
          className="flex justify-start px-2 pt-2 pb-2 gap-2 w-full overflow-x-auto no-scrollbar h-auto bg-[#333333] scroll-smooth"
        >
          {categories.map((category) => {
            const availableGames = getGamesForCategory(category.value);
            const hasGames =
              category.value === "sports" ||
              loadingGames ||
              availableGames.length > 0;

            return (
              <button
                key={category.value}
                style={{
                  backgroundColor:
                    category.value === isHoveredValue
                      ? webMenuHoverColor
                      : category.value === selectedCategory.value
                        ? webMenuHoverColor
                        : "transparent",
                  color:
                    category.value === isHoveredValue
                      ? webMenuHoverTextColor
                      : category.value === selectedCategory.value
                        ? webMenuHoverTextColor
                        : webMenuTextColor,
                }}
                onMouseEnter={() => setIsHoveredValue(category.value)}
                onMouseLeave={() => setIsHoveredValue("")}
                className={`min-w-[70px] min-h-[70px] p-3 text-base flex flex-col items-center justify-center gap-1 rounded-lg transition-all ${
                  hasGames ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
                }`}
                onClick={() => hasGames && setSelectedCategory(category)}
              >
                <p className="font-medium">{category.title}</p>
                <img
                  style={{
                    filter:
                      category.value === isHoveredValue ||
                      category.value === selectedCategory.value
                        ? "brightness(0) invert(0)"
                        : "none",
                  }}
                  className="w-10"
                  src={category.image}
                  alt={category.title}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="transition-opacity duration-500 ease-in-out opacity-100 mt-5">
        {selectedCategory.value === "sports" ? (
          <div className="animate-fade-in">
            <SportsCategory />
          </div>
        ) : loadingGames ? (
          <div className="animate-fade-in space-y-4">
            <p className="text-center text-sm text-white/60">
              Loading your games...
            </p>
            {renderGamesFallback()}
          </div>
        ) : casinoGames.length ? (
          <div className="animate-fade-in">
            <GamesCategory
              selectedGames={casinoGames}
              selectedCategory={selectedCategory}
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-white/70">
            No games configured for this section yet.
          </div>
        )}
      </div>
    </div>
  );
}
