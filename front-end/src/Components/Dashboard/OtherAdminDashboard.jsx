import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";

const OtherAdminDashboard = () => {
  const { motherAdmin } = useContext(AuthContext);

  const [data, setData] = useState({
    mainBalance: "0.00",
    netExposure: "0.00",
    totalDownlineBalance: "0.00",
    profitBalance: "0.00",
    lossBalance: "0.00",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin-summary/${motherAdmin?._id}`,
      );

      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Dashboard error:", err);
      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (motherAdmin?._id) {
      fetchSummary();

      // 🔥 Auto refresh every 10 sec
      const interval = setInterval(fetchSummary, 10000);
      return () => clearInterval(interval);
    }
  }, [motherAdmin]);

  // 🔹 Dynamic color for exposure
  const exposureColor =
    Number(data.netExposure) >= 0 ? "text-green-600" : "text-red-600";

  return (
    <div>
      {/* 🔴 Error */}
      {error && (
        <div className="bg-red-100 text-red-600 p-2 mb-3 rounded">{error}</div>
      )}

      <div className="flex bg-[#f5f6f8] border-b mb-5 overflow-hidden flex-wrap">
        {/* Main Balance */}
        <div className="flex-1 px-4 py-3 border-r min-w-[200px]">
          <p className="text-gray-600 text-sm">Main Balance</p>
          <h2 className="font-extrabold text-lg text-black">
            {loading ? "Loading..." : `PBU ${data.mainBalance}`}
          </h2>
        </div>

        {/* Net Exposure */}
        <div className="flex-1 px-4 py-3 border-r min-w-[200px]">
          <p className="text-gray-600 text-sm">Net Exposure</p>
          <h2 className={`font-extrabold text-lg ${exposureColor}`}>
            {loading ? "Loading..." : `PBU ${data.netExposure}`}
          </h2>
        </div>

        {/* Downline Balance */}
        <div className="flex-1 px-4 py-3 border-r min-w-[200px]">
          <p className="text-gray-600 text-sm">Total Downline Balance</p>
          <h2 className="font-extrabold text-lg text-black">
            {loading ? "Loading..." : `PBU ${data.totalDownlineBalance}`}
          </h2>
        </div>

        {/* Profit */}
        <div className="flex-1 px-4 py-3 border-r min-w-[200px]">
          <p className="text-gray-600 text-sm">Profit Balance</p>
          <h2 className="font-extrabold text-lg text-green-600">
            {loading ? "Loading..." : `PBU ${data.profitBalance}`}
          </h2>
        </div>

        {/* Loss */}
        <div className="flex-1 px-4 py-3 min-w-[200px]">
          <p className="text-gray-600 text-sm">Loss Balance</p>
          <h2 className="font-extrabold text-lg text-red-600">
            {loading ? "Loading..." : `PBU ${data.lossBalance}`}
          </h2>
        </div>
      </div>
    </div>
  );
};

export default OtherAdminDashboard;
