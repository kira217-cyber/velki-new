import PageHeader from "@/components/shared/PageHeader";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "@/context/AuthContext";
import { ImSpinner8 } from "react-icons/im";
import { FaDice, FaCheckCircle, FaTimesCircle, FaCoins } from "react-icons/fa";

const BetsHistory = () => {
  const { user } = useContext(AuthContext);

  // 🔹 State
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 🔹 Summary (all bets)
  const [summary, setSummary] = useState({
    totalBets: 0,
    totalWon: 0,
    totalLost: 0,
    totalAmount: 0,
  });

  // 🔹 Fetch all bets summary (all pages)
  const fetchSummary = async () => {
    if (!user?.username) return;
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/game-history/summary`,
        { params: { username: user.username } }
      );
      setSummary(res.data);
    } catch (err) {
      console.error("Fetch summary error:", err);
      setSummary({ totalBets: 0, totalWon: 0, totalLost: 0, totalAmount: 0 });
    }
  };

  // 🔹 Fetch paginated bets for table
  const fetchBets = async () => {
    if (!user?.username) return;
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/game-history/bet-history`,
        { params: { username: user.username, page } }
      );
      const data = res.data.data || [];
      setBets(data);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error("Fetch bets error:", err);
      setBets([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(); // summary once
  }, [user]);

  useEffect(() => {
    fetchBets(); // paginated bets
  }, [page, user]);

  return (
    <div className="mt-16">
      <PageHeader title="Bets History" />

      {/* 🔹 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 p-2 mt-2 gap-4 mb-6">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-4 rounded-xl shadow flex items-center gap-3">
          <FaDice className="text-3xl" />
          <div>
            <p className="text-sm font-medium">Total Bets</p>
            <p className="text-xl font-bold">{summary.totalBets}</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white p-4 rounded-xl shadow flex items-center gap-3">
          <FaCheckCircle className="text-3xl" />
          <div>
            <p className="text-sm font-medium">Total Won</p>
            <p className="text-xl font-bold">{summary.totalWon}</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-4 rounded-xl shadow flex items-center gap-3">
          <FaTimesCircle className="text-3xl" />
          <div>
            <p className="text-sm font-medium">Total Lost</p>
            <p className="text-xl font-bold">{summary.totalLost}</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 rounded-xl shadow flex items-center gap-3">
          <FaCoins className="text-3xl" />
          <div>
            <p className="text-sm font-medium">Total Amount</p>
            <p className="text-xl font-bold">
              {parseFloat(summary.totalAmount).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* 🔹 Bets Table */}
      <div className="bg-[#eef6fb] min-h-[45rem] p-4 rounded-xl shadow">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <ImSpinner8 className="animate-spin text-4xl text-gray-400" />
          </div>
        ) : bets.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <h1 className="text-gray-500 text-lg">No Data</h1>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto bg-white rounded-xl shadow">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left">Game</th>
                    <th className="p-3 text-left">Type</th>
                    <th className="p-3 text-left">Amount</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {bets.map((bet) => (
                    <tr
                      key={bet._id}
                      className="text-center border-t hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-2">{bet.game_code}</td>
                      <td className="p-2">{bet.bet_type}</td>
                      <td className="p-2">{parseFloat(bet.amount).toFixed(2)}</td>
                      <td
                        className={`p-2 capitalize font-semibold ${
                          bet.status === "won"
                            ? "text-green-600"
                            : bet.status === "lost"
                              ? "text-red-600"
                              : "text-gray-500"
                        }`}
                      >
                        {bet.status}
                      </td>
                      <td className="p-2">
                        {new Date(bet.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 🔹 Pagination */}
            <div className="flex justify-center gap-3 mt-6">
              <button
                disabled={page === 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
              >
                Prev
              </button>

              <span className="px-4 py-2 font-bold">
                {page} / {totalPages}
              </span>

              <button
                disabled={page === totalPages}
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, totalPages))
                }
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BetsHistory;