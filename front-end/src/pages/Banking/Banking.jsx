import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { TbReload } from "react-icons/tb";

const Banking = () => {
  const { motherAdmin } = useContext(AuthContext);
  const [admins, setAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");

  const [selectedAdminsD, setSelectedAdminsD] = useState([]); // For Deposit
  const [selectedAdminsW, setSelectedAdminsW] = useState([]); // For Withdraw

  const [amountsD, setAmountsD] = useState({}); // Deposit amounts
  const [amountsW, setAmountsW] = useState({}); // Withdraw amounts

  const [myBalance, setMyBalance] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [historyTotals, setHistoryTotals] = useState({
    totalDepositUpline: "0.00",
    totalDepositDownline: "0.00",
    totalWithdrawUpline: "0.00",
    totalWithdrawDownline: "0.00",
  });

  // Fetch all admins for Mother Admin, otherwise only created ones
  const fetchAdmins = async () => {
    try {
      let response;
      if (motherAdmin?.role === "MA") {
        response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admins`,
        );
      } else {
        response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admins/created/${motherAdmin?._id}`,
        );
      }
      setAdmins(response.data);
    } catch (error) {
      console.error("Error fetching admins:", error);
      toast.error("Failed to load admins");
    }
  };

  // Fetch own balance
  const fetchMyBalance = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admins/${motherAdmin._id}`,
      );
      setMyBalance(response.data.balance || 0);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  useEffect(() => {
    if (motherAdmin) {
      fetchAdmins();
      fetchMyBalance();
    }
  }, [motherAdmin]);

  // Fetch transaction history for a specific admin
  const fetchAdminTransactions = async (adminId) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admins/transaction-history/${adminId}`,
      );
      setSelectedTransactions(response.data.data || []);
      setHistoryTotals(
        response.data.totals || {
          totalDepositUpline: "0.00",
          totalDepositDownline: "0.00",
          totalWithdrawUpline: "0.00",
          totalWithdrawDownline: "0.00",
        },
      );
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to fetch transaction history");
    }
  };

  // Handle Deposit / Withdraw
  const handleTransaction = async (type) => {
    const selectedAdmins = type === "D" ? selectedAdminsD : selectedAdminsW;
    const amounts = type === "D" ? amountsD : amountsW;

    if (!selectedAdmins.length) {
      toast.error(
        `Please select at least one admin for ${type === "D" ? "Deposit" : "Withdraw"}`,
      );
      return;
    }

    const amountKey = selectedAdmins[0];
    const amount = parseFloat(amounts[amountKey]);

    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admins/transaction`,
        {
          fromAdminId: motherAdmin._id,
          toAdminIds: selectedAdmins,
          amount: amount,
          type: type,
        },
      );

      // Update local state
      setAdmins((prev) =>
        prev.map((admin) =>
          selectedAdmins.includes(admin._id)
            ? {
                ...admin,
                balance:
                  response.data.toAdminBalances?.[admin._id] || admin.balance,
              }
            : admin,
        ),
      );

      setMyBalance(response.data.fromAdminBalance || myBalance);

      toast.success(
        `Successfully ${type === "D" ? "deposited" : "withdrawn"} ${amount} ${type === "D" ? "to" : "from"} ${selectedAdmins.length} admin(s)!`,
      );

      // Clear selections and amounts
      if (type === "D") {
        setSelectedAdminsD([]);
        setAmountsD({});
      } else {
        setSelectedAdminsW([]);
        setAmountsW({});
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Transaction failed");
    }
    setLoading(false);
  };

  // Amount Change Handlers
  const handleAmountChangeD = (adminId, value) => {
    setAmountsD((prev) => ({ ...prev, [adminId]: value }));
  };

  const handleAmountChangeW = (adminId, value) => {
    setAmountsW((prev) => ({ ...prev, [adminId]: value }));
  };

  // Toggle Selection
  const toggleAdminSelectionD = (adminId) => {
    setSelectedAdminsD((prev) =>
      prev.includes(adminId)
        ? prev.filter((id) => id !== adminId)
        : [...prev, adminId],
    );
    setSelectedAdminsW((prev) => prev.filter((id) => id !== adminId));
  };

  const toggleAdminSelectionW = (adminId) => {
    setSelectedAdminsW((prev) =>
      prev.includes(adminId)
        ? prev.filter((id) => id !== adminId)
        : [...prev, adminId],
    );
    setSelectedAdminsD((prev) => prev.filter((id) => id !== adminId));
  };

  // Filter Admins
  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch = admin.username
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "ACTIVE"
        ? admin.status === "Active"
        : statusFilter === "INACTIVE"
          ? admin.status !== "Active"
          : true;
    return matchesSearch && matchesStatus;
  });

  // Totals
  const totalBalance = filteredAdmins.reduce(
    (sum, admin) => sum + (admin.balance || 0),
    0,
  );
  const totalExposure = filteredAdmins.reduce(
    (sum, admin) => sum + (admin.exposure || 0),
    0,
  );
  const totalCreditReference = filteredAdmins.reduce(
    (sum, admin) => sum + (admin.credit || 0),
    0,
  );
  const totalRefPL = filteredAdmins.reduce(
    (sum, admin) => sum + (admin.refPL || 0),
    0,
  );

  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div className="p-4 bg-white">
      {/* Top Search Bar */}
      <div className="flex justify-between items-center mb-4 p-2 bg-gray-50 rounded">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Enter userid..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 px-3 py-1 rounded text-sm w-40"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 px-3 py-1 rounded text-sm"
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
          <button className="bg-red-500 text-white px-4 py-1 rounded text-sm">
            Search
          </button>
        </div>

        <div className="flex items-center gap-1 text-sm">
          <span className="text-green-600 font-bold">
            Status: {statusFilter}
          </span>
          <button
            className="ml-2 cursor-pointer text-blue-500"
            onClick={() => window.location.reload()}
          >
            <TbReload size={20} />
          </button>
        </div>
      </div>

      {/* Balance Display */}
      <div className="bg-gray-100 p-3 mb-4 rounded border">
        <span className="font-bold text-lg">
          Your Balance | PBU : {myBalance.toFixed(2)}
        </span>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-[#2d3748] text-white">
              <th className="border border-gray-300 p-2">UID</th>
              <th className="border border-gray-300 p-2">Balance</th>
              <th className="border border-gray-300 p-2">Exposure</th>
              <th className="border border-gray-300 p-2">Deposit</th>
              <th className="border border-gray-300 p-2">Withdraw</th>
              <th className="border border-gray-300 p-2">Credit Reference</th>
              <th className="border border-gray-300 p-2">Reference P/L</th>
              <th className="border border-gray-300 p-2">Remark</th>
              <th className="border border-gray-300 p-2">All Log</th>
            </tr>
          </thead>
          <tbody>
            {filteredAdmins.map((admin) => (
              <tr
                key={admin._id}
                className={`border-b border-gray-300 ${
                  selectedAdminsD.includes(admin._id) ||
                  selectedAdminsW.includes(admin._id)
                    ? "bg-green-50"
                    : ""
                } ${filteredAdmins.indexOf(admin) % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
              >
                <td className="border border-gray-300 p-2">
                  <span
                    className={`font-bold text-xs px-2 py-1 rounded-[4px] cursor-pointer transition
                    ${
                      admin.role === "MA"
                        ? "bg-purple-200 text-purple-800"
                        : admin.role === "SA"
                          ? "bg-blue-200 text-blue-800"
                          : admin.role === "MT"
                            ? "bg-green-200 text-green-800"
                            : admin.role === "AG"
                              ? "bg-yellow-200 text-yellow-800"
                              : admin.role === "SG"
                                ? "bg-pink-200 text-pink-800"
                                : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {admin.role}
                  </span>{" "}
                  <span className="ml-2">{admin.username}</span>
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {admin.balance?.toFixed(2) || "0.00"}
                </td>
                <td className="border border-gray-300 p-2 text-center text-red-600 font-bold">
                  {admin.exposure?.toFixed(2) || "0.00"}
                </td>

                {/* Deposit Column */}
                <td className="border border-gray-300 p-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      className={`px-2 py-1 rounded text-xs font-bold ${selectedAdminsD.includes(admin._id) ? "bg-green-600 text-white" : "bg-white border"}`}
                      onClick={() => toggleAdminSelectionD(admin._id)}
                    >
                      D
                    </button>
                    <input
                      type="number"
                      value={amountsD[admin._id] || ""}
                      onChange={(e) =>
                        handleAmountChangeD(admin._id, e.target.value)
                      }
                      className={`border rounded px-2 py-1 w-16 text-center ${selectedAdminsD.includes(admin._id) ? "border-green-500 bg-green-50" : "border-gray-300"}`}
                      placeholder="0.00"
                      disabled={!selectedAdminsD.includes(admin._id)}
                      step="0.01"
                    />
                  </div>
                </td>

                {/* Withdraw Column */}
                <td className="border border-gray-300 p-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      className={`px-2 py-1 rounded text-xs font-bold ${selectedAdminsW.includes(admin._id) ? "bg-red-600 text-white" : "bg-white border"}`}
                      onClick={() => toggleAdminSelectionW(admin._id)}
                    >
                      W
                    </button>
                    <input
                      type="number"
                      value={amountsW[admin._id] || ""}
                      onChange={(e) =>
                        handleAmountChangeW(admin._id, e.target.value)
                      }
                      className={`border rounded px-2 py-1 w-16 text-center ${selectedAdminsW.includes(admin._id) ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                      placeholder="0.00"
                      disabled={!selectedAdminsW.includes(admin._id)}
                      step="0.01"
                    />
                  </div>
                </td>

                <td className="border border-gray-300 p-2 text-center">
                  {admin.credit?.toFixed(2) || "0.00"}
                </td>
                <td className="border border-gray-300 p-2 text-center text-red-600 font-bold">
                  ({admin.refPL?.toFixed(2) || "0.00"})
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  Remark
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  <button
                    className="bg-blue-500 text-white px-3 py-1 rounded text-xs"
                    onClick={() => {
                      setSelectedAdmin(admin);
                      fetchAdminTransactions(admin._id);
                      setShowModal(true);
                    }}
                  >
                    Log
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom Buttons */}
      <div className="flex justify-between items-center mt-4 p-3 bg-gray-50 rounded">
        <div className="flex gap-2">
          <button className="bg-gray-300 px-3 py-1 rounded text-sm">
            Prev 1
          </button>
          <button className="bg-gray-300 px-3 py-1 rounded text-sm">
            Next 1
          </button>
        </div>

        <div className="flex gap-3">
          <button
            className={`px-5 py-2 rounded text-sm font-bold ${loading || !selectedAdminsD.length ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 text-white"}`}
            onClick={() => handleTransaction("D")}
            disabled={loading || !selectedAdminsD.length}
          >
            {loading ? "Processing..." : "Submit Deposit"}
          </button>

          <button
            className={`px-5 py-2 rounded text-sm font-bold ${loading || !selectedAdminsW.length ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 text-white"}`}
            onClick={() => handleTransaction("W")}
            disabled={loading || !selectedAdminsW.length}
          >
            {loading ? "Processing..." : "Submit Withdraw"}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mt-3 p-3 rounded text-center font-bold ${message.includes("success") ? "text-green-600" : "text-red-600"}`}
        >
          {message}
        </div>
      )}

      {/* Transaction History Modal */}
      {showModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-11/12 max-w-5xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Transaction History - {selectedAdmin.username}
              </h2>
              <button
                className="text-red-600 font-bold text-xl"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border text-sm">
                <thead className="bg-gray-700 text-white">
                  <tr>
                    <th className="p-2 border">Date/Time</th>
                    <th className="p-2 border">Deposit by Upline</th>
                    <th className="p-2 border">Deposit to Downline</th>
                    <th className="p-2 border">Withdraw by Upline</th>
                    <th className="p-2 border">Withdraw from Downline</th>
                    <th className="p-2 border">Balance</th>
                    <th className="p-2 border">Remark</th>
                    <th className="p-2 border">From/To</th>
                    <th className="p-2 border">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTransactions.map((item, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="p-2 border">{item.datetime}</td>
                      <td className="p-2 border text-right">
                        {item.depositUpline}
                      </td>
                      <td className="p-2 border text-right">
                        {item.depositDownline}
                      </td>
                      <td className="p-2 border text-right">
                        {item.withdrawUpline}
                      </td>
                      <td className="p-2 border text-right">
                        {item.withdrawDownline}
                      </td>
                      <td className="p-2 border text-right font-medium">
                        {item.balance}
                      </td>
                      <td className="p-2 border">{item.remark}</td>
                      <td className="p-2 border">{item.fromto}</td>
                      <td className="p-2 border">{item.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Banking;
