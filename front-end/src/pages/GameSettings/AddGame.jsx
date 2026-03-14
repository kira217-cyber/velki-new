import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const PROVIDER_API_BASE = "https://api.oraclegames.live/api/providers";
const PROVIDER_API_KEY = "ceeeba1c-892b-4571-b05f-2bcec5c4a44e";
const GAMES_PER_PAGE = 30;

const AddGame = () => {
  const [categories, setCategories] = useState([]);
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [providerGames, setProviderGames] = useState([]);
  const [selectedGames, setSelectedGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [uploadingImageId, setUploadingImageId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Fetch Categories (for provider dropdown)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/categories`,
        );
        setCategories(res.data.data || []);
      } catch (err) {
        toast.error("Failed to load providers");
      }
    };

    fetchCategories();
  }, []);

  // Fetch Already Selected Games
  useEffect(() => {
    const fetchSelectedGames = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/selected-games`,
        );
        setSelectedGames(res.data.data || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchSelectedGames();
  }, []);

  // Fetch Games when provider changes
  useEffect(() => {
    if (!selectedProviderId) {
      setProviderGames([]);
      setCurrentPage(1);
      return;
    }

    const fetchProviderGames = async () => {
      setLoadingGames(true);

      try {
        const res = await axios.get(
          `${PROVIDER_API_BASE}/${selectedProviderId}`,
          {
            headers: {
              "x-api-key": PROVIDER_API_KEY,
            },
          },
        );

        setProviderGames(res.data?.games || []);
        setCurrentPage(1);
      } catch (err) {
        toast.error("Failed to load games for this provider");
        setProviderGames([]);
      } finally {
        setLoadingGames(false);
      }
    };

    fetchProviderGames();
  }, [selectedProviderId]);

  const totalPages = Math.ceil(providerGames.length / GAMES_PER_PAGE) || 1;

  const paginatedGames = useMemo(() => {
    const start = (currentPage - 1) * GAMES_PER_PAGE;
    const end = start + GAMES_PER_PAGE;
    return providerGames.slice(start, end);
  }, [providerGames, currentPage]);

  const selectedCountOnPage = useMemo(() => {
    return paginatedGames.filter((game) =>
      selectedGames.some((sg) => sg.gameId === game._id),
    ).length;
  }, [paginatedGames, selectedGames]);

  const allCurrentPageSelected =
    paginatedGames.length > 0 && selectedCountOnPage === paginatedGames.length;

  const hasAnySelectedOnPage = selectedCountOnPage > 0;

  const handlePrevProvider = () => {
    if (!categories.length) return;

    const currentIndex = categories.findIndex(
      (cat) => cat.providerId === selectedProviderId,
    );

    if (currentIndex > 0) {
      setSelectedProviderId(categories[currentIndex - 1].providerId);
    }
  };

  const handleNextProvider = () => {
    if (!categories.length) return;

    const currentIndex = categories.findIndex(
      (cat) => cat.providerId === selectedProviderId,
    );

    if (currentIndex >= 0 && currentIndex < categories.length - 1) {
      setSelectedProviderId(categories[currentIndex + 1].providerId);
    }
  };

  const handleSelectGame = async (game) => {
    const isSelected = selectedGames.some((sg) => sg.gameId === game._id);

    try {
      if (isSelected) {
        const selectedGame = selectedGames.find((sg) => sg.gameId === game._id);

        await axios.delete(
          `${import.meta.env.VITE_API_URL}/api/selected-games/${selectedGame._id}`,
        );

        setSelectedGames((prev) => prev.filter((sg) => sg.gameId !== game._id));
        toast.success("Game removed");
      } else {
        const formData = new FormData();
        formData.append("gameId", game._id);

        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/selected-games`,
          formData,
        );

        setSelectedGames((prev) => [...prev, res.data.data]);
        toast.success("Game added successfully!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    }
  };

  const handleSelectAllCurrentPage = async () => {
    const unselectedGames = paginatedGames.filter(
      (game) => !selectedGames.some((sg) => sg.gameId === game._id),
    );

    if (unselectedGames.length === 0) {
      toast.info("All games on this page are already selected");
      return;
    }

    try {
      setBulkLoading(true);

      const requests = unselectedGames.map((game) => {
        const formData = new FormData();
        formData.append("gameId", game._id);

        return axios.post(
          `${import.meta.env.VITE_API_URL}/api/selected-games`,
          formData,
        );
      });

      const responses = await Promise.all(requests);
      const newSelected = responses.map((res) => res.data.data);

      setSelectedGames((prev) => [...prev, ...newSelected]);
      toast.success("All games on this page selected successfully!");
    } catch (err) {
      toast.error("Failed to select all games on this page");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleUnselectAllCurrentPage = async () => {
    const selectedOnPage = paginatedGames
      .map((game) => selectedGames.find((sg) => sg.gameId === game._id))
      .filter(Boolean);

    if (selectedOnPage.length === 0) {
      toast.info("No selected games on this page");
      return;
    }

    try {
      setBulkLoading(true);

      const requests = selectedOnPage.map((selectedGame) =>
        axios.delete(
          `${import.meta.env.VITE_API_URL}/api/selected-games/${selectedGame._id}`,
        ),
      );

      await Promise.all(requests);

      const selectedIdsOnPage = new Set(selectedOnPage.map((sg) => sg.gameId));

      setSelectedGames((prev) =>
        prev.filter((sg) => !selectedIdsOnPage.has(sg.gameId)),
      );

      toast.success("All selected games on this page removed!");
    } catch (err) {
      toast.error("Failed to unselect games on this page");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleFlagChange = async (gameId, flag, checked) => {
    const selectedGame = selectedGames.find((sg) => sg.gameId === gameId);
    if (!selectedGame) return;

    try {
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/selected-games/${selectedGame._id}`,
        { [flag]: checked },
      );

      setSelectedGames((prev) =>
        prev.map((sg) => (sg._id === selectedGame._id ? res.data.data : sg)),
      );

      toast.success(`${flag} updated`);
    } catch (err) {
      toast.error("Failed to update flag");
    }
  };

  const handleImageUpload = async (gameId, file) => {
    const selectedGame = selectedGames.find((sg) => sg.gameId === gameId);
    if (!selectedGame || !file) return;

    try {
      setUploadingImageId(gameId);

      const formData = new FormData();
      formData.append("image", file);

      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/selected-games/${selectedGame._id}`,
        formData,
      );

      setSelectedGames((prev) =>
        prev.map((sg) => (sg._id === selectedGame._id ? res.data.data : sg)),
      );

      toast.success("Image uploaded successfully!");
    } catch (err) {
      toast.error("Failed to upload image");
    } finally {
      setUploadingImageId("");
    }
  };

  const isGameSelected = (gameId) =>
    selectedGames.some((sg) => sg.gameId === gameId);

  const getSelectedGame = (gameId) =>
    selectedGames.find((sg) => sg.gameId === gameId);

  const getDisplayImage = (game) => {
    const selectedData = getSelectedGame(game._id);

    if (selectedData?.image) {
      if (selectedData.image.startsWith("http")) return selectedData.image;
      return `${import.meta.env.VITE_API_URL}${selectedData.image}`;
    }

    return game.image || "/no-image.png";
  };

  const currentProviderIndex = categories.findIndex(
    (cat) => cat.providerId === selectedProviderId,
  );

  return (
    <div className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold text-center mb-10 text-yellow-600">
        Add & Manage Games
      </h1>

      {/* Provider Dropdown */}
      <div className="mb-10 bg-white p-6 rounded-2xl shadow-lg border-2 border-yellow-200">
        <label className="block text-lg font-semibold text-gray-700 mb-3">
          Select Provider
        </label>

        <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
          <button
            type="button"
            onClick={handlePrevProvider}
            disabled={currentProviderIndex <= 0 || !selectedProviderId}
            className="px-6 py-4 rounded-xl bg-gray-500 text-white font-bold hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous Provider
          </button>

          <select
            value={selectedProviderId}
            onChange={(e) => setSelectedProviderId(e.target.value)}
            className="flex-1 px-6 py-4 border-2 border-yellow-300 rounded-xl text-lg focus:ring-4 focus:ring-yellow-200 focus:border-yellow-500 transition"
          >
            <option value="">-- Choose a Provider --</option>
            {categories.map((cat, index) => (
              <option key={`${cat.providerId}-${index}`} value={cat.providerId}>
                {cat.providerName} ({cat.categoryName})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleNextProvider}
            disabled={
              currentProviderIndex === -1 ||
              currentProviderIndex >= categories.length - 1
            }
            className="px-6 py-4 rounded-xl bg-gray-500 text-white font-bold hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next Provider
          </button>
        </div>
      </div>

      {/* Games Section */}
      <div className="mt-8">
        {!selectedProviderId ? (
          <div className="text-center py-20">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-32 h-32 mx-auto mb-6" />
            <p className="text-2xl text-gray-500">
              Please select a provider to view games
            </p>
          </div>
        ) : loadingGames ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-600">Loading games...</p>
          </div>
        ) : providerGames.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-32 h-32 mx-auto mb-6" />
            <p className="text-3xl font-bold text-gray-500">No Games Found</p>
            <p className="text-lg text-gray-400 mt-3">
              This provider has no games available at the moment.
            </p>
          </div>
        ) : (
          <>
            {/* Top Controls */}
            <div className="mb-8 bg-white p-5 rounded-2xl shadow-lg border-2 border-yellow-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <p className="text-lg font-bold text-gray-800">
                  Total Games: {providerGames.length}
                </p>
                <p className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages} • Showing{" "}
                  {paginatedGames.length} games
                </p>
                <p className="text-sm text-gray-600">
                  Selected on this page: {selectedCountOnPage}/
                  {paginatedGames.length}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSelectAllCurrentPage}
                  disabled={bulkLoading || allCurrentPageSelected}
                  className="px-6 py-3 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {bulkLoading ? "Processing..." : "Select All This Page"}
                </button>

                <button
                  type="button"
                  onClick={handleUnselectAllCurrentPage}
                  disabled={bulkLoading || !hasAnySelectedOnPage}
                  className="px-6 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {bulkLoading ? "Processing..." : "Unselect All This Page"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-6 py-3 rounded-xl bg-gray-500 text-white font-bold hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Previous Page
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-6 py-3 rounded-xl bg-gray-500 text-white font-bold hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next Page
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {paginatedGames.map((game) => {
                const selected = isGameSelected(game._id);
                const selectedData = getSelectedGame(game._id);
                const displayImage = getDisplayImage(game);

                return (
                  <div
                    key={game._id}
                    className={`bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:scale-105 ${
                      selected
                        ? "ring-4 ring-yellow-400 border-4 border-yellow-300"
                        : "border border-gray-200"
                    }`}
                  >
                    <div className="relative">
                      {displayImage ? (
                        <img
                          src={displayImage}
                          alt={game.gameName}
                          className="w-full h-56 object-cover"
                          onError={(e) => {
                            e.target.src = "/no-image.png";
                          }}
                        />
                      ) : (
                        <div className="w-full h-56 flex justify-center items-center bg-gray-200 text-black font-semibold">
                          Image Not Found
                        </div>
                      )}

                      {selected && (
                        <div className="absolute top-3 right-3 bg-yellow-500 text-black font-bold px-3 py-1 rounded-full text-sm">
                          Selected
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2">
                        {game.gameName}
                      </h3>

                      <p className="text-sm text-gray-500 mb-1">
                        Game Code: {game.game_code}
                      </p>

                      <p className="text-sm text-gray-500 mb-4">
                        Provider: {game.provider_code}
                      </p>

                      {/* Main Select Checkbox */}
                      <label className="flex items-center gap-3 mb-4 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => handleSelectGame(game)}
                          className="w-6 h-6 text-yellow-600 rounded focus:ring-yellow-500"
                        />
                        <span className="font-semibold text-gray-700">
                          {selected ? "Selected" : "Select this game"}
                        </span>
                      </label>

                      {/* Flags - Only show if selected */}
                      {selected && (
                        <div className="space-y-3 mt-5 pt-5 border-t border-gray-200">
                          <label className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedData?.isCatalog || false}
                              onChange={(e) =>
                                handleFlagChange(
                                  game._id,
                                  "isCatalog",
                                  e.target.checked,
                                )
                              }
                              className="w-5 h-5 text-red-600 rounded"
                            />
                            <span className="font-medium">Catelog Game</span>
                          </label>

                          <label className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedData?.isLatest || false}
                              onChange={(e) =>
                                handleFlagChange(
                                  game._id,
                                  "isLatest",
                                  e.target.checked,
                                )
                              }
                              className="w-5 h-5 text-blue-600 rounded"
                            />
                            <span className="font-medium">Latest Game</span>
                          </label>

                          <label className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedData?.isA_Z || false}
                              onChange={(e) =>
                                handleFlagChange(
                                  game._id,
                                  "isA_Z",
                                  e.target.checked,
                                )
                              }
                              className="w-5 h-5 text-green-600 rounded"
                            />
                            <span className="font-medium">A-Z Game</span>
                          </label>

                          {/* Image upload */}
                          <div className="pt-3">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Upload Custom Image
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                handleImageUpload(game._id, e.target.files[0])
                              }
                              className="w-full px-4 py-3 border-2 border-yellow-300 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-white hover:file:bg-yellow-600"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                              {uploadingImageId === game._id
                                ? "Uploading image..."
                                : selectedData?.image
                                  ? "Custom image uploaded"
                                  : "Default API image is showing"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Pagination */}
            <div className="mt-10 bg-white p-5 rounded-2xl shadow-lg border-2 border-yellow-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSelectAllCurrentPage}
                  disabled={bulkLoading || allCurrentPageSelected}
                  className="px-6 py-3 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {bulkLoading ? "Processing..." : "Select All This Page"}
                </button>

                <button
                  type="button"
                  onClick={handleUnselectAllCurrentPage}
                  disabled={bulkLoading || !hasAnySelectedOnPage}
                  className="px-6 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {bulkLoading ? "Processing..." : "Unselect All This Page"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-6 py-3 rounded-xl bg-gray-500 text-white font-bold hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-6 py-3 rounded-xl bg-gray-500 text-white font-bold hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AddGame;
