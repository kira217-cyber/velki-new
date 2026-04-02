import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import {
  FaSearch,
  FaCog,
  FaUser,
  FaLock,
  FaExchangeAlt,
  FaClock,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { IoMdAdd } from "react-icons/io";
import { LuArrowUpDown } from "react-icons/lu";
import { TfiReload } from "react-icons/tfi";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router";
import DashboardSwitcher from "../../Components/Dashboard/DashboardSwitcher";

const Agent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [agents, setAgents] = useState([]);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const adminsPerPage = 15;

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Edit Modal States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    adminId: "",
    email: "",
    username: "",
    newPassword: "",
    confirmPassword: "",
    currentPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    timeZone: "Asia/Dhaka",
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  // Status Modal States
  const [selectedAdminId, setSelectedAdminId] = useState(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusForm, setStatusForm] = useState({
    adminId: "",
    status: "Active",
    password: "",
  });

  const { motherAdmin } = useContext(AuthContext);
  const navigate = useNavigate();

  const timeZones = [
    "Asia/Dhaka",
    "Asia/Kolkata",
    "America/New_York",
    "Europe/London",
    "Australia/Sydney",
  ];

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    timeZone: "Asia/Dhaka",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  // Fetch ALL Agents (role === "AG")
  // Fetch Agents (role === "AG") with proper permission logic
  const fetchAgents = async () => {
    try {
      let res;

      // If Mother Admin is logged in → show ALL AG
      if (motherAdmin?.role === "MA") {
        res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admins`);
      }
      // If other admin (SA, MT, SG etc.) is logged in → show only their created AG
      else {
        res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admins/created/${motherAdmin?._id}`,
        );
      }

      // Filter only Agents (AG)
      const allAgents = res.data.filter((u) => u.role === "AG");
      setAgents(allAgents);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("❌ Failed to load agent data");
    }
  };

  useEffect(() => {
    if (motherAdmin) {
      fetchAgents();
    }
  }, [motherAdmin]);

  // Search & Filter Logic
  useEffect(() => {
    let result = [...agents];

    if (searchTerm.trim()) {
      result = result.filter((admin) =>
        admin.username.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (statusFilter !== "ALL") {
      result = result.filter((admin) => admin.status === statusFilter);
    }

    setFilteredAgents(result);
    setCurrentPage(1);
  }, [agents, searchTerm, statusFilter]);

  // Pagination
  const indexOfLastAdmin = currentPage * adminsPerPage;
  const indexOfFirstAdmin = indexOfLastAdmin - adminsPerPage;
  const currentAgents = filteredAgents.slice(
    indexOfFirstAdmin,
    indexOfLastAdmin,
  );
  const totalPages = Math.ceil(filteredAgents.length / adminsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Calculate totals
  const totals = currentAgents.reduce(
    (acc, u) => {
      acc.credit += u.credit || 0;
      acc.balance += u.balance || 0;
      acc.exposure += u.exposure || 0;
      acc.availBal += u.availBal || 0;
      acc.totalBal += u.totalBal || 0;
      acc.playerBal += u.playerBal || 0;
      acc.refPL += u.refPL || 0;
      return acc;
    },
    {
      credit: 0,
      balance: 0,
      exposure: 0,
      availBal: 0,
      totalBal: 0,
      playerBal: 0,
      refPL: 0,
    },
  );

  const menuItems = [
    { icon: <FaExchangeAlt />, label: "Betting Profit & Loss" },
    { icon: <FaClock />, label: "Betting History" },
    { icon: <FaUser />, label: "Profile" },
    { icon: <FaCog />, label: "Change Status" },
    { icon: <FaLock />, label: "Block Market" },
  ];

  const handleStatusChange = (e) => {
    setStatusForm({ ...statusForm, [e.target.name]: e.target.value });
  };

  const openStatusModal = (adminId) => {
    setSelectedAdminId(adminId);
    setStatusForm({ adminId, status: "Active", password: "" });
    setStatusModalOpen(true);
  };

  const submitStatusChange = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admins/change-status`,
        statusForm,
      );
      if (res.data.success) {
        toast.success("✅ Status changed successfully!");
        setStatusModalOpen(false);
        fetchAgents();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "❌ Failed to change status",
      );
    }
  };

  // ==================== ADD SUPER AGENT ====================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.username || !formData.password) {
      return toast.error("❌ Email, Username and Password are required");
    }

    if (formData.password !== formData.confirmPassword) {
      return toast.error("❌ Password and Confirm Password do not match");
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admins`,
        {
          ...formData,
          role: "AG",
          createdBy: motherAdmin?._id || null,
        },
      );

      if (res.data.success) {
        toast.success("✅ Super Agent added successfully!");
        setIsModalOpen(false);
        setFormData({
          email: "",
          username: "",
          password: "",
          confirmPassword: "",
          firstName: "",
          lastName: "",
          phone: "",
          timeZone: "Asia/Dhaka",
        });
        fetchAgents();
      }
    } catch (error) {
      console.error("Error adding agent:", error);
      toast.error(
        error.response?.data?.message || "❌ Failed to add Super Agent",
      );
    }
  };

  // ==================== EDIT SUPER AGENT ====================
  const openEditModal = (admin) => {
    setEditForm({
      adminId: admin._id,
      email: admin.email || "",
      username: admin.username || "",
      newPassword: "",
      confirmPassword: "",
      currentPassword: "",
      firstName: admin.firstName || "",
      lastName: admin.lastName || "",
      phone: admin.phone || "",
      timeZone: admin.timeZone || "Asia/Dhaka",
    });
    setEditModalOpen(true);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setShowCurrentPassword(false);
  };

  const submitEdit = async (e) => {
    e.preventDefault();

    if (
      editForm.newPassword &&
      editForm.newPassword !== editForm.confirmPassword
    ) {
      return toast.error("❌ New passwords do not match");
    }

    try {
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/admins/${editForm.adminId}/update`,
        {
          email: editForm.email,
          username: editForm.username,
          newPassword: editForm.newPassword || undefined,
          currentPassword: editForm.currentPassword,
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          phone: editForm.phone,
          timeZone: editForm.timeZone,
        },
      );

      if (res.data.success) {
        toast.success("✅ Super Agent updated successfully!");
        setEditModalOpen(false);
        fetchAgents();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "❌ Failed to update Super Agent",
      );
    }
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Find by username"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 w-64 focus:outline-none"
          />
          <FaSearch className="text-gray-600" />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none"
          >
            <option value="ALL">ALL</option>
            <option value="Active">ACTIVE</option>
            <option value="Suspend">SUSPEND</option>
            <option value="Locked">LOCKED</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            className="bg-yellow-50 border border-gray-200 cursor-pointer hover:bg-yellow-100 text-black px-3 py-1 rounded flex items-center space-x-1"
            onClick={() => setIsModalOpen(true)}
          >
            <IoMdAdd />
            <span>Add Super Agent</span>
          </button>
          <button
            onClick={fetchAgents}
            className="py-2 px-4 rounded bg-yellow-50 border border-gray-200 cursor-pointer hover:bg-yellow-100"
          >
            <TfiReload size={20} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <DashboardSwitcher />

      {/* Main Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full border-collapse">
          <thead className="bg-[#1f3349] text-white">
            <tr>
              <th className="p-2 text-left">Account</th>
              <th className="p-2 text-right">Credit Ref.</th>
              <th className="p-2 text-right">
                <span className="flex items-center justify-center">
                  Balance <LuArrowUpDown />
                </span>
              </th>
              <th className="p-2 text-right">
                <span className="flex items-center justify-center">
                  Exposure <LuArrowUpDown />
                </span>
              </th>
              <th className="p-2 text-right">
                <span className="flex items-center justify-center">
                  Avail. bal. <LuArrowUpDown />
                </span>
              </th>
              <th className="p-2 text-right">
                <span className="flex items-center justify-center">
                  TotalBalance <LuArrowUpDown />
                </span>
              </th>
              <th className="p-2 text-right">
                <span className="flex items-center justify-center">
                  Player Balance <LuArrowUpDown />
                </span>
              </th>
              <th className="p-2 text-right">
                <span className="flex items-center justify-center">
                  Ref. P/L <LuArrowUpDown />
                </span>
              </th>
              <th className="p-2 text-center">
                <span className="flex items-center justify-center">
                  Status <LuArrowUpDown />
                </span>
              </th>
              <th className="p-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {currentAgents.map((u, i) => (
              <tr
                key={u._id}
                className={`border-b text-sm ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
              >
                <td className="p-2 flex items-center space-x-1">
                  <span
                    onClick={() =>
                      navigate(
                        `/${motherAdmin.role.toLowerCase()}/created-admins/${u._id}`,
                      )
                    }
                    className="bg-gray-200 font-bold text-gray-800 text-xs px-2 py-1 rounded-[4px] cursor-pointer hover:bg-gray-300 transition"
                  >
                    {u.role}
                  </span>
                  <span className="text-blue-600 font-bold underline cursor-pointer hover:no-underline">
                    {u.username}
                  </span>
                </td>
                <td className="p-2 text-right">{u.credit?.toLocaleString()}</td>
                <td className="p-2 text-right">
                  {u.balance?.toLocaleString()}
                </td>
                <td className="p-2 text-right text-yellow-600">
                  {u.exposure?.toLocaleString()}
                </td>
                <td className="p-2 text-right">
                  {u.availBal?.toLocaleString()}
                </td>
                <td className="p-2 text-right">
                  {u.totalBal?.toLocaleString()}
                </td>
                <td className="p-2 text-right">
                  {u.playerBal?.toLocaleString()}
                </td>
                <td className="p-2 text-right text-yellow-600">
                  {u.refPL?.toLocaleString()}
                </td>
                <td className="p-2 text-center">
                  <span
                    className={`px-2 py-0.5 rounded-sm font-bold ${
                      u.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : u.status === "Suspend"
                          ? "bg-red-100 text-red-700"
                          : u.status === "Locked"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    ● {u.status}
                  </span>
                </td>
                <td className="p-2 text-center">
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={() => openStatusModal(u._id)}
                      className="p-2 border rounded bg-yellow-50 hover:bg-yellow-100 cursor-pointer"
                    >
                      <FaCog size={16} />
                    </button>
                    <button
                      onClick={() => openEditModal(u)}
                      className="p-2 border rounded bg-yellow-50 hover:bg-yellow-100 cursor-pointer"
                    >
                      <FaUser size={16} />
                    </button>
                    <button className="p-2 border rounded bg-yellow-50 hover:bg-yellow-100 cursor-pointer">
                      <FaLock size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            <tr className="bg-[#FFEDD5] border-t font-semibold">
              <td className="p-2">Total (Page {currentPage})</td>
              <td className="p-2 text-right">
                {totals.credit.toLocaleString()}
              </td>
              <td className="p-2 text-right">
                {totals.balance.toLocaleString()}
              </td>
              <td className="p-2 text-right text-yellow-600">
                {totals.exposure.toLocaleString()}
              </td>
              <td className="p-2 text-right">
                {totals.availBal.toLocaleString()}
              </td>
              <td className="p-2 text-right">
                {totals.totalBal.toLocaleString()}
              </td>
              <td className="p-2 text-right">
                {totals.playerBal.toLocaleString()}
              </td>
              <td className="p-2 text-right text-yellow-600">
                {totals.refPL.toLocaleString()}
              </td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-center p-3 border-t border-b border-dashed text-sm mt-4">
          <button
            onClick={prevPage}
            disabled={currentPage === 1}
            className="border border-gray-200 px-2 py-1 rounded hover:bg-[#DBEAFE] cursor-pointer disabled:opacity-50"
          >
            Prev
          </button>
          <span className="px-3 rounded text-black py-1 bg-[#DBEAFE]">
            {currentPage}
          </span>
          <button
            onClick={nextPage}
            disabled={currentPage === totalPages}
            className="border border-gray-200 px-2 py-1 rounded hover:bg-[#DBEAFE] cursor-pointer disabled:opacity-50"
          >
            Next
          </button>
        </div>

        {/* Bottom Menu */}
        <div className="flex flex-wrap justify-end mr-8 items-center gap-3 py-2 bg-white border-t border-gray-300">
          {menuItems.map((item, index) => (
            <React.Fragment key={index}>
              <div className="flex items-center gap-2 bg-[#fff8e1] hover:bg-[#fef3c7] transition-colors border border-gray-200 px-3 py-2 rounded-md cursor-pointer">
                <span className="text-black">{item.icon}</span>
              </div>
              <span className="text-sm text-gray-800 whitespace-nowrap">
                {item.label}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ====================== ADD SUPER AGENT MODAL (Same Design) ====================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-[800px] bg-white shadow-lg border">
            <div className="bg-yellow-500 flex justify-between items-center px-4 py-2">
              <h2 className="font-bold text-black">Add Super Agent</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-black cursor-pointer text-yellow-400 w-6 h-6 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-black text-white text-right px-4 py-1 text-sm font-semibold">
              STEP 1
            </div>

            <div className="bg-gray-200 p-6 min-h-[420px] flex flex-col justify-between">
              <form onSubmit={handleSubmit} className="flex flex-col h-full">
                <div>
                  <h3 className="font-semibold text-lg mb-4">
                    Personal Information
                  </h3>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <label className="w-32 text-right">
                        Email <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        placeholder="Enter Email"
                        value={formData.email}
                        onChange={handleChange}
                        className="flex-1 border px-2 py-1 bg-white"
                        required
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="w-32 text-right">
                        Username <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        name="username"
                        placeholder="Enter username"
                        value={formData.username}
                        onChange={handleChange}
                        className="flex-1 border px-2 py-1 bg-white"
                        required
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="w-32 text-right">
                        Password <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="password"
                        name="password"
                        placeholder="Enter Password"
                        value={formData.password}
                        onChange={handleChange}
                        className="flex-1 border px-2 py-1 bg-white"
                        required
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="w-32 text-right">
                        Confirm Password <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="flex-1 border px-2 py-1 bg-white"
                        required
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="w-32 text-right">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        placeholder="Enter FirstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="flex-1 border px-2 py-1 bg-white"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="w-32 text-right">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        placeholder="Enter LastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="flex-1 border px-2 py-1 bg-white"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="w-32 text-right">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        placeholder="Enter Phone Number"
                        value={formData.phone}
                        onChange={handleChange}
                        className="flex-1 border px-2 py-1 bg-white"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="w-32 text-right">TimeZone</label>
                      <select
                        name="timeZone"
                        value={formData.timeZone}
                        onChange={handleChange}
                        className="flex-1 border px-2 py-1 bg-white"
                      >
                        {timeZones.map((zone) => (
                          <option key={zone} value={zone}>
                            {zone}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-10 border-t pt-4">
                  <button
                    type="submit"
                    className="bg-yellow-500 cursor-pointer hover:bg-yellow-600 px-6 py-2 text-black font-semibold border"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ====================== EDIT SUPER AGENT MODAL ====================== */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-[800px] bg-white shadow-lg border">
            <div className="bg-yellow-500 flex justify-between items-center px-4 py-2">
              <h2 className="font-bold text-black">Edit Super Agent</h2>
              <button
                onClick={() => setEditModalOpen(false)}
                className="bg-black cursor-pointer text-yellow-400 w-6 h-6 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-black text-white text-right px-4 py-1 text-sm font-semibold">
              STEP 1
            </div>

            <div className="bg-gray-200 p-6 min-h-[520px] flex flex-col justify-between">
              <form onSubmit={submitEdit} className="flex flex-col h-full">
                <div>
                  <h3 className="font-semibold text-lg mb-4">
                    Personal Information
                  </h3>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <label className="w-32 text-right">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={editForm.email}
                        onChange={handleEditChange}
                        className="flex-1 border px-2 py-1 bg-white"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="w-32 text-right">Username</label>
                      <input
                        type="text"
                        name="username"
                        value={editForm.username}
                        onChange={handleEditChange}
                        className="flex-1 border px-2 py-1 bg-white"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="w-32 text-right">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={editForm.firstName}
                        onChange={handleEditChange}
                        className="flex-1 border px-2 py-1 bg-white"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="w-32 text-right">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={editForm.lastName}
                        onChange={handleEditChange}
                        className="flex-1 border px-2 py-1 bg-white"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="w-32 text-right">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={editForm.phone}
                        onChange={handleEditChange}
                        className="flex-1 border px-2 py-1 bg-white"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="w-32 text-right">TimeZone</label>
                      <select
                        name="timeZone"
                        value={editForm.timeZone}
                        onChange={handleEditChange}
                        className="flex-1 border px-2 py-1 bg-white"
                      >
                        {timeZones.map((zone) => (
                          <option key={zone} value={zone}>
                            {zone}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Password Section */}
                <div className="mt-6 border-t pt-4">
                  <h4 className="font-semibold mb-3">
                    Change Password (Optional)
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <label className="w-32 text-right">New Password</label>
                      <div className="relative flex-1">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          name="newPassword"
                          value={editForm.newPassword}
                          onChange={handleEditChange}
                          className="w-full border px-2 py-1 pr-8 bg-white"
                          placeholder="Optional"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                          {showNewPassword ? (
                            <FaEyeSlash size={16} />
                          ) : (
                            <FaEye size={16} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="w-32 text-right">
                        Confirm Password
                      </label>
                      <div className="relative flex-1">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={editForm.confirmPassword}
                          onChange={handleEditChange}
                          className="w-full border px-2 py-1 pr-8 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                          {showConfirmPassword ? (
                            <FaEyeSlash size={16} />
                          ) : (
                            <FaEye size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current Password Verification */}
                <div className="mt-6">
                  <div className="flex items-center gap-2 text-sm">
                    <label className="w-32 text-right">
                      Current Password <span className="text-red-600">*</span>
                    </label>
                    <div className="relative flex-1">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        name="currentPassword"
                        value={editForm.currentPassword}
                        onChange={handleEditChange}
                        className="w-full border px-2 py-1 pr-8 bg-white"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showCurrentPassword ? (
                          <FaEyeSlash size={16} />
                        ) : (
                          <FaEye size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 ml-32">
                    Enter your password to confirm update
                  </p>
                </div>

                <div className="flex justify-end mt-8 border-t pt-4 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-5 cursor-pointer py-1 border"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-yellow-500 cursor-pointer px-6 py-1 font-semibold border"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ====================== CHANGE STATUS MODAL ====================== */}
      {statusModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-[600px] bg-white shadow-lg border">
            <div className="bg-yellow-500 flex justify-between items-center px-4 py-2">
              <h2 className="font-bold text-black">Change Status</h2>
              <button
                onClick={() => setStatusModalOpen(false)}
                className="bg-black cursor-pointer text-yellow-400 w-6 h-6 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-black text-white text-right px-4 py-1 text-sm font-semibold">
              STEP 1
            </div>

            <div className="bg-gray-200 p-6 min-h-[280px] flex flex-col justify-between">
              <form
                onSubmit={submitStatusChange}
                className="flex flex-col h-full"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <label className="w-32 text-right">Admin ID</label>
                    <input
                      type="text"
                      value={selectedAdminId || ""}
                      disabled
                      className="flex-1 border px-2 py-1 bg-gray-100"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <label className="w-32 text-right">Status</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setStatusForm({ ...statusForm, status: "Active" })
                        }
                        className={`px-3 py-1 border flex items-center gap-1 ${statusForm.status === "Active" ? "bg-gray-300" : "bg-white"}`}
                      >
                        <span className="text-green-600">✔</span> Active
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setStatusForm({ ...statusForm, status: "Suspend" })
                        }
                        className={`px-3 py-1 border flex items-center gap-1 ${statusForm.status === "Suspend" ? "bg-gray-300" : "bg-white"}`}
                      >
                        <span className="text-red-600">✖</span> Suspend
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setStatusForm({ ...statusForm, status: "Locked" })
                        }
                        className={`px-3 py-1 border flex items-center gap-1 ${statusForm.status === "Locked" ? "bg-gray-300" : "bg-white"}`}
                      >
                        <span className="text-gray-600">🔒</span> Locked
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <label className="w-32 text-right">
                      Password <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={statusForm.password}
                      onChange={handleStatusChange}
                      placeholder="Enter password"
                      className="flex-1 border px-2 py-1 bg-white"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-6 border-t pt-4">
                  <button
                    type="submit"
                    className="bg-yellow-500 cursor-pointer px-6 py-1 font-semibold border"
                  >
                    Change Status
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agent;
