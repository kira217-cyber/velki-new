import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";

const MotherAdminDashboard = () => {
  const { motherAdmin } = useContext(AuthContext);

  const [summary, setSummary] = useState({
    mainBalance: 0,
    subAdminBalance: 0,
    masterBalance: 0,
    agentBalance: 0,
    subAgentBalance: 0,
    userBalance: 0,
  });

  const fetchSummary = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/summary/${motherAdmin?._id}`,
      );

      if (res.data.success) {
        setSummary(res.data.data);
      }
    } catch (err) {
      console.error("Summary fetch error:", err);
    }
  };

  useEffect(() => {
    if (motherAdmin?._id) {
      fetchSummary();
    }
  }, [motherAdmin]);

  return (
    <div>
      {/* Summary Cards */}
      <div className="flex bg-[#f5f6f8] border-b mb-5 overflow-hidden flex-wrap">
        <div className="flex-1 px-4 py-3 border-r min-w-[200px]">
          <p className="text-gray-600 text-sm">Main Balance</p>
          <h2 className="font-extrabold text-lg text-black">
            PBU {summary.mainBalance.toLocaleString()}
          </h2>
        </div>

        <div className="flex-1 px-4 py-3 border-r min-w-[200px]">
          <p className="text-gray-600 text-sm">Total Senior Sub Admin Balance</p>
          <h2 className="font-extrabold text-lg text-black">
            PBU {summary.subAdminBalance.toLocaleString()}
          </h2>
        </div>

        <div className="flex-1 px-4 py-3 border-r min-w-[200px]">
          <p className="text-gray-600 text-sm">Total Sub Admin Balance</p>
          <h2 className="font-extrabold text-lg text-black">
            PBU {summary.masterBalance.toLocaleString()}
          </h2>
        </div>

        <div className="flex-1 px-4 py-3 border-r min-w-[200px]">
          <p className="text-gray-600 text-sm">Total Super Agent Balance</p>
          <h2 className="font-extrabold text-lg text-black">
            PBU {summary.agentBalance.toLocaleString()}
          </h2>
        </div>

        <div className="flex-1 px-4 py-3 border-r min-w-[200px]">
          <p className="text-gray-600 text-sm">Total Master Agent Balance</p>
          <h2 className="font-extrabold text-lg text-black">
            PBU {summary.subAgentBalance.toLocaleString()}
          </h2>
        </div>

        <div className="flex-1 px-4 py-3 min-w-[200px]">
          <p className="text-gray-600 text-sm">Total User Balance</p>
          <h2 className="font-extrabold text-lg text-black">
            PBU {summary.userBalance.toLocaleString()}
          </h2>
        </div>
      </div>
    </div>
  );
};

export default MotherAdminDashboard;
