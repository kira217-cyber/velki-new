import axios from "axios";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../../context/AuthContext";

const PAGE_SIZE = 40;
const API_URL = import.meta.env.VITE_API_URL;

const TIMEZONES = [
  "All Timezones",
  "Asia/Dhaka",
  "UTC",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Europe/London",
  "America/New_York",
];

const getTodayRange = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return {
    fromDate: `${yyyy}-${mm}-${dd}`,
    fromTime: "00:00:00",
    toDate: `${yyyy}-${mm}-${dd}`,
    toTime: "23:59:59",
  };
};

const getYesterdayRange = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return {
    fromDate: `${yyyy}-${mm}-${dd}`,
    fromTime: "00:00:00",
    toDate: `${yyyy}-${mm}-${dd}`,
    toTime: "23:59:59",
  };
};

const getWeeklyRange = () => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 6);
  const sy = start.getFullYear();
  const sm = String(start.getMonth() + 1).padStart(2, "0");
  const sd = String(start.getDate()).padStart(2, "0");
  const ey = now.getFullYear();
  const em = String(now.getMonth() + 1).padStart(2, "0");
  const ed = String(now.getDate()).padStart(2, "0");
  return {
    fromDate: `${sy}-${sm}-${sd}`,
    fromTime: "00:00:00",
    toDate: `${ey}-${em}-${ed}`,
    toTime: "23:59:59",
  };
};

const formatNumber = (num) => {
  const n = Number(num || 0);
  return n.toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDateTime = (date, timezone) => {
  if (!date) return "-";
  const safeTimezone =
    !timezone || timezone === "All Timezones" ? "Asia/Dhaka" : timezone;
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: safeTimezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date(date));
  } catch {
    return new Date(date).toLocaleString();
  }
};

const StatBadge = ({ label, value, color = "gray" }) => {
  const styles = {
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    green: "bg-green-100 text-green-700 border-green-200",
    red: "bg-red-100 text-red-700 border-red-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
    orange: "bg-orange-100 text-orange-700 border-orange-200",
  };
  return (
    <div
      className={`border rounded-lg px-3 py-2 ${styles[color] || styles.gray}`}
    >
      <div className="text-xs font-medium">{label}</div>
      <div className="mt-1 text-sm font-bold">{value}</div>
    </div>
  );
};

const ProfitLossReportByDownLine = () => {
  const [lastTxn, setLastTxn] = useState("40 Txn");
  const { motherAdmin } = useContext(AuthContext);
  const currentAdminId = motherAdmin?._id || "";
  const currentAdminRole = motherAdmin?.role || "";

  // applied filters
  const [search, setSearch] = useState("");
  const [betType, setBetType] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [fromTime, setFromTime] = useState("00:00:00");
  const [toDate, setToDate] = useState("");
  const [toTime, setToTime] = useState("23:59:59");
  const [timezone, setTimezone] = useState("Asia/Dhaka");
  const [page, setPage] = useState(1);

  // input filters
  const [searchInput, setSearchInput] = useState("");
  const [betTypeInput, setBetTypeInput] = useState("ALL");
  const [statusInput, setStatusInput] = useState("ALL");
  const [fromDateInput, setFromDateInput] = useState("");
  const [fromTimeInput, setFromTimeInput] = useState("00:00:00");
  const [toDateInput, setToDateInput] = useState("");
  const [toTimeInput, setToTimeInput] = useState("23:59:59");
  const [timezoneInput, setTimezoneInput] = useState("Asia/Dhaka");

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({
    totalRecords: 0,
    totalAmount: 0,
    totalBetAmount: 0,
    totalSettleAmount: 0,
    totalCancelAmount: 0,
    totalRefundAmount: 0,
    wonAmount: 0,
    lostAmount: 0,
    cancelledAmount: 0,
    refundedAmount: 0,
    netPL: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    totalRecords: 0,
    totalPages: 1,
    hasPrev: false,
    hasNext: false,
  });
  const [error, setError] = useState("");

  const limit = useMemo(() => {
    const n = parseInt(lastTxn, 10);
    return Number.isFinite(n) ? n : PAGE_SIZE;
  }, [lastTxn]);

  const fetchReport = async (customPage = page, customFilters = {}) => {
    try {
      if (!currentAdminId || !currentAdminRole) return;

      setLoading(true);
      setError("");

      const params = {
        page: customPage,
        limit,
        search,
        betType,
        status,
        fromDate,
        fromTime,
        toDate,
        toTime,
        timezone: timezone === "All Timezones" ? "Asia/Dhaka" : timezone,
        currentAdminId,
        currentAdminRole,
        ...customFilters,
      };

      // Clean empty params
      Object.keys(params).forEach((key) => {
        if (
          params[key] === "" ||
          params[key] === null ||
          params[key] === undefined
        ) {
          delete params[key];
        }
      });

      const { data } = await axios.get(
        `${API_URL}/api/game-history/report-downline`,
        { params },
      );

      if (data?.success) {
        setRows(data.data || []);
        setTotals(
          data.totals || {
            totalRecords: 0,
            totalAmount: 0,
            totalBetAmount: 0,
            totalSettleAmount: 0,
            totalCancelAmount: 0,
            totalRefundAmount: 0,
            wonAmount: 0,
            lostAmount: 0,
            cancelledAmount: 0,
            refundedAmount: 0,
            netPL: 0,
          },
        );
        setPagination(
          data.pagination || {
            page: 1,
            limit,
            totalRecords: 0,
            totalPages: 1,
            hasPrev: false,
            hasNext: false,
          },
        );
      } else {
        setRows([]);
        setError(data?.message || "Failed to fetch report");
      }
    } catch (err) {
      console.error(err);
      setRows([]);
      setError(err?.response?.data?.message || "Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentAdminId || !currentAdminRole) return;
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    limit,
    search,
    betType,
    status,
    fromDate,
    fromTime,
    toDate,
    toTime,
    timezone,
    currentAdminId,
    currentAdminRole,
  ]);

  const applyFilters = () => {
    setPage(1);
    setSearch(searchInput.trim());
    setBetType(betTypeInput);
    setStatus(statusInput);
    setFromDate(fromDateInput);
    setFromTime(fromTimeInput);
    setToDate(toDateInput);
    setToTime(toTimeInput);
    setTimezone(timezoneInput);
  };

  const clearFilters = () => {
    setSearchInput("");
    setBetTypeInput("ALL");
    setStatusInput("ALL");
    setFromDateInput("");
    setFromTimeInput("00:00:00");
    setToDateInput("");
    setToTimeInput("23:59:59");
    setTimezoneInput("Asia/Dhaka");
    setPage(1);
    setSearch("");
    setBetType("ALL");
    setStatus("ALL");
    setFromDate("");
    setFromTime("00:00:00");
    setToDate("");
    setToTime("23:59:59");
    setTimezone("Asia/Dhaka");
  };

  const handleAllTime = () => {
    setFromDateInput("");
    setFromTimeInput("00:00:00");
    setToDateInput("");
    setToTimeInput("23:59:59");
  };

  const handleToday = () => {
    const t = getTodayRange();
    setFromDateInput(t.fromDate);
    setFromTimeInput(t.fromTime);
    setToDateInput(t.toDate);
    setToTimeInput(t.toTime);
  };

  const handleYesterday = () => {
    const t = getYesterdayRange();
    setFromDateInput(t.fromDate);
    setFromTimeInput(t.fromTime);
    setToDateInput(t.toDate);
    setToTimeInput(t.toTime);
  };

  const handleWeekly = () => {
    const t = getWeeklyRange();
    setFromDateInput(t.fromDate);
    setFromTimeInput(t.fromTime);
    setToDateInput(t.toDate);
    setToTimeInput(t.toTime);
  };

  const currentFilterText = useMemo(() => {
    const parts = [];
    if (search) parts.push(`Search: ${search}`);
    if (betType !== "ALL") parts.push(`BetType: ${betType}`);
    if (status !== "ALL") parts.push(`Status: ${status}`);
    if (fromDate || toDate) {
      parts.push(
        `Date: ${fromDate || "Any"} ${fromTime || ""} → ${toDate || "Any"} ${toTime || ""}`,
      );
    } else {
      parts.push("Date: All Time");
    }
    parts.push(`Timezone: ${timezone}`);
    parts.push(`Role: ${currentAdminRole || "-"}`);
    return parts.join(" | ");
  }, [
    search,
    betType,
    status,
    fromDate,
    fromTime,
    toDate,
    toTime,
    timezone,
    currentAdminRole,
  ]);

  return (
    <div className="min-h-screen bg-gray-100 p-3 sm:p-4 lg:p-6">
      <div className="mx-auto w-full max-w-[1800px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Top bar */}
        <div className="border-b border-gray-200 bg-gray-50 px-3 py-3 sm:px-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <label className="text-sm font-semibold text-gray-700">
                Last:
              </label>
              <select
                value={lastTxn}
                onChange={(e) => {
                  setLastTxn(e.target.value);
                  setPage(1);
                }}
                className="rounded-md border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option>40 Txn</option>
                <option>80 Txn</option>
                <option>120 Txn</option>
                <option>200 Txn</option>
              </select>

              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                placeholder="Search admin/user username / game code / provider code / transaction id"
                className="w-full min-w-0 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 sm:w-[320px] md:w-[360px]"
              />

              <button
                onClick={applyFilters}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Search
              </button>

              <button
                onClick={clearFilters}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear
              </button>

              <button
                onClick={() => {
                  if (pagination.hasPrev && !loading) {
                    setPage((prev) => Math.max(prev - 1, 1));
                  }
                }}
                disabled={!pagination.hasPrev || loading}
                className={`rounded-md border px-4 py-2 text-sm font-medium ${
                  !pagination.hasPrev || loading
                    ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Previous
              </button>

              <button
                onClick={() => {
                  if (pagination.hasNext && !loading) {
                    setPage((prev) => prev + 1);
                  }
                }}
                disabled={!pagination.hasNext || loading}
                className={`rounded-md border px-4 py-2 text-sm font-medium ${
                  !pagination.hasNext || loading
                    ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Next
              </button>
            </div>

            <div className="text-sm font-medium text-gray-700">
              Total Records:{" "}
              <span className="font-bold">{pagination.totalRecords || 0}</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="border-b border-gray-200 bg-gray-50 px-3 py-4 sm:px-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                From Date
              </label>
              <input
                type="date"
                value={fromDateInput}
                onChange={(e) => setFromDateInput(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                From Time
              </label>
              <input
                type="time"
                step="1"
                value={fromTimeInput}
                onChange={(e) => setFromTimeInput(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                To Date
              </label>
              <input
                type="date"
                value={toDateInput}
                onChange={(e) => setToDateInput(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                To Time
              </label>
              <input
                type="time"
                step="1"
                value={toTimeInput}
                onChange={(e) => setToTimeInput(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                Timezone
              </label>
              <select
                value={timezoneInput}
                onChange={(e) => setTimezoneInput(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                Bet Type
              </label>
              <select
                value={betTypeInput}
                onChange={(e) => setBetTypeInput(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="ALL">All Bet Type</option>
                <option value="BET">BET</option>
                <option value="SETTLE">SETTLE</option>
                <option value="CANCEL">CANCEL</option>
                <option value="REFUND">REFUND</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                Status
              </label>
              <select
                value={statusInput}
                onChange={(e) => setStatusInput(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="ALL">All Status</option>
                <option value="won">won</option>
                <option value="lost">lost</option>
                <option value="cancelled">cancelled</option>
                <option value="refunded">refunded</option>
              </select>
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <button
                onClick={handleAllTime}
                className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-100"
              >
                All Time
              </button>
              <button
                onClick={handleToday}
                className="rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-700 hover:bg-yellow-100"
              >
                Just For Today
              </button>
              <button
                onClick={handleYesterday}
                className="rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-700 hover:bg-yellow-100"
              >
                Yesterday
              </button>
              <button
                onClick={handleWeekly}
                className="rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-700 hover:bg-yellow-100"
              >
                Weekly
              </button>
              <button
                onClick={applyFilters}
                className="rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
              >
                Get P & L
              </button>
            </div>
          </div>

          <div className="mt-3 break-words text-xs text-gray-600">
            Active Filters: {currentFilterText || "None"}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 border-b border-gray-200 bg-white px-3 py-4 sm:grid-cols-3 lg:grid-cols-6 sm:px-4">
          <StatBadge
            label="Records"
            value={totals.totalRecords || 0}
            color="blue"
          />
          <StatBadge
            label="Total Amount"
            value={formatNumber(totals.totalAmount)}
            color="gray"
          />
          <StatBadge
            label="Won"
            value={formatNumber(totals.wonAmount)}
            color="green"
          />
          <StatBadge
            label="Lost"
            value={formatNumber(totals.lostAmount)}
            color="red"
          />
          <StatBadge
            label="Refund"
            value={formatNumber(totals.refundedAmount)}
            color="yellow"
          />
          <StatBadge
            label="Net P/L"
            value={formatNumber(totals.netPL)}
            color="orange"
          />
        </div>

        <div className="p-3 sm:p-4">
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-8 text-center text-red-600">
              {error}
            </div>
          ) : loading ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-center text-gray-600">
              Loading game history...
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-center text-gray-500">
              No game history found
              <div className="mt-2 text-sm text-gray-400">
                Try Clear button or All Time button
              </div>
            </div>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="grid grid-cols-1 gap-3 lg:hidden">
                {rows.map((item, index) => (
                  <div
                    key={item.gameHistoryId || item.transaction_id || index}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs text-gray-500">
                          #
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </div>
                        <div className="font-semibold text-gray-800">
                          {item.username || "-"}
                        </div>
                        <div className="text-xs text-gray-500">
                          User Doc Username: {item.adminUsername || "-"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDateTime(item.createdAt, timezone)}
                        </div>
                      </div>
                      <div
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          item.status === "won"
                            ? "bg-green-100 text-green-700"
                            : item.status === "lost"
                              ? "bg-red-100 text-red-700"
                              : item.status === "cancelled"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {item.status || "-"}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-md bg-gray-50 p-2">
                        <div className="text-xs text-gray-500">Provider</div>
                        <div className="font-medium text-gray-700">
                          {item.provider_code || "-"}
                        </div>
                      </div>
                      {/* <div className="rounded-md bg-gray-50 p-2">
                        <div className="text-xs text-gray-500">Game Code</div>
                        <div className="font-medium text-gray-700">
                          {item.game_code || "-"}
                        </div>
                      </div> */}
                      <div className="rounded-md bg-gray-50 p-2">
                        <div className="text-xs text-gray-500">Bet Type</div>
                        <div className="font-medium text-gray-700">
                          {item.bet_type || "-"}
                        </div>
                      </div>
                      <div className="rounded-md bg-gray-50 p-2">
                        <div className="text-xs text-gray-500">Amount</div>
                        <div className="font-medium text-gray-700">
                          {formatNumber(item.amount)}
                        </div>
                      </div>
                      <div className="col-span-2 rounded-md bg-gray-50 p-2 break-all">
                        <div className="text-xs text-gray-500">
                          Transaction ID
                        </div>
                        <div className="font-medium text-gray-700">
                          {item.transaction_id || "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden overflow-auto rounded-lg border border-gray-200 lg:block">
                <table className="min-w-[1180px] w-full border-collapse text-left text-sm">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="border px-3 py-2">#</th>
                      <th className="border px-3 py-2">Date Time</th>
                      <th className="border px-3 py-2">Game Username</th>
                      <th className="border px-3 py-2">User Doc Username</th>
                      <th className="border px-3 py-2">Provider Code</th>
                      <th className="border px-3 py-2">Game Code</th>
                      <th className="border px-3 py-2">Bet Type</th>
                      <th className="border px-3 py-2">Status</th>
                      <th className="border px-3 py-2 text-right">Amount</th>
                      <th className="border px-3 py-2">Transaction ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((item, index) => (
                      <tr
                        key={item.gameHistoryId || item.transaction_id || index}
                        className="hover:bg-gray-50"
                      >
                        <td className="border px-3 py-2">
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </td>
                        <td className="border px-3 py-2 whitespace-nowrap">
                          {formatDateTime(item.createdAt, timezone)}
                        </td>
                        <td className="border px-3 py-2">
                          {item.username || "-"}
                        </td>
                        <td className="border px-3 py-2">
                          {item.adminUsername || "-"}
                        </td>
                        <td className="border px-3 py-2">
                          {item.provider_code || "-"}
                        </td>
                        <td className="border px-3 py-2">
                          {item.game_code || "-"}
                        </td>
                        <td className="border px-3 py-2 font-semibold">
                          {item.bet_type || "-"}
                        </td>
                        <td className="border px-3 py-2">
                          <span
                            className={`font-semibold ${
                              item.status === "won"
                                ? "text-green-600"
                                : item.status === "lost"
                                  ? "text-red-600"
                                  : item.status === "cancelled"
                                    ? "text-orange-600"
                                    : "text-blue-600"
                            }`}
                          >
                            {item.status || "-"}
                          </span>
                        </td>
                        <td className="border px-3 py-2 text-right">
                          {formatNumber(item.amount)}
                        </td>
                        <td className="border px-3 py-2">
                          {item.transaction_id || "-"}
                        </td>
                      </tr>
                    ))}

                    {/* Grand Total Row */}
                    <tr className="bg-green-50 font-bold">
                      <td className="border px-3 py-2" colSpan="2">
                        Grand Total
                      </td>
                      <td className="border px-3 py-2" colSpan="2">
                        Records: {totals.totalRecords || 0}
                      </td>
                      <td className="border px-3 py-2" colSpan="2">
                        Won: {formatNumber(totals.wonAmount)}
                      </td>
                      <td className="border px-3 py-2" colSpan="2">
                        Lost: {formatNumber(totals.lostAmount)}
                      </td>
                      <td className="border px-3 py-2" colSpan="2">
                        Net P/L: {formatNumber(totals.netPL)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bottom pagination */}
              <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-gray-700">
                  Page <span className="font-semibold">{pagination.page}</span>{" "}
                  of{" "}
                  <span className="font-semibold">{pagination.totalPages}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() =>
                      pagination.hasPrev &&
                      setPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={!pagination.hasPrev || loading}
                    className={`rounded-md border px-4 py-2 text-sm font-medium ${
                      !pagination.hasPrev || loading
                        ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      pagination.hasNext && setPage((prev) => prev + 1)
                    }
                    disabled={!pagination.hasNext || loading}
                    className={`rounded-md border px-4 py-2 text-sm font-medium ${
                      !pagination.hasNext || loading
                        ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfitLossReportByDownLine;
