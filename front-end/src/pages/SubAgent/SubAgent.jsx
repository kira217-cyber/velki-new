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

const SubAgent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subAgents, setSubAgents] = useState([]);
  const [filteredSubAgents, setFilteredSubAgents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const adminsPerPage = 15;

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Edit Modal States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    adminId: "",
    username: "",
    newPassword: "",
    confirmPassword: "",
    currentPassword: "",
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
    username: "",
    password: "",
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

  // Fetch ALL Sub Agents when Mother Admin is logged in
  const fetchSubAgents = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admins`);
      const allSubAgents = res.data.filter((u) => u.role === "SG");
      setSubAgents(allSubAgents);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("❌ Failed to load sub-agent data");
    }
  };

  useEffect(() => {
    if (motherAdmin) {
      fetchSubAgents();
    }
  }, [motherAdmin]);

  // Search & Filter Logic
  useEffect(() => {
    let result = [...subAgents];

    if (searchTerm.trim()) {
      result = result.filter((admin) =>
        admin.username.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (statusFilter !== "ALL") {
      result = result.filter((admin) => admin.status === statusFilter);
    }

    setFilteredSubAgents(result);
    setCurrentPage(1);
  }, [subAgents, searchTerm, statusFilter]);

  // Pagination
  const indexOfLastAdmin = currentPage * adminsPerPage;
  const indexOfFirstAdmin = indexOfLastAdmin - adminsPerPage;
  const currentSubAgents = filteredSubAgents.slice(
    indexOfFirstAdmin,
    indexOfLastAdmin,
  );
  const totalPages = Math.ceil(filteredSubAgents.length / adminsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Calculate totals for current page
  const totals = currentSubAgents.reduce(
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
        fetchSubAgents();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "❌ Failed to change status",
      );
    }
  };

  // Edit Modal (FaUser Button)
  const openEditModal = (admin) => {
    setEditForm({
      adminId: admin._id,
      username: admin.username,
      newPassword: "",
      confirmPassword: "",
      currentPassword: "",
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
          username: editForm.username,
          newPassword: editForm.newPassword || undefined,
          currentPassword: editForm.currentPassword,
        },
      );

      if (res.data.success) {
        toast.success("✅ Sub Agent updated successfully!");
        setEditModalOpen(false);
        fetchSubAgents();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "❌ Failed to update sub agent",
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admins`,
        {
          ...formData,
          role: "SG",
          createdBy: motherAdmin?._id || null,
        },
      );
      if (res.data.success) {
        toast.success("✅ Sub Agent added successfully!");
        setIsModalOpen(false);
        setFormData({
          username: "",
          password: "",
          firstName: "",
          lastName: "",
          phone: "",
          timeZone: "Asia/Dhaka",
        });
        fetchSubAgents();
      }
    } catch (error) {
      console.error("Error adding sub-agent:", error);
      toast.error("❌ Failed to add sub-agent");
    }
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      {/* Header with Search & Filter */}
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
            <span>Add Sub Agent</span>
          </button>
          <button
            onClick={fetchSubAgents}
            className="py-2 px-4 rounded bg-yellow-50 border border-gray-200 cursor-pointer hover:bg-yellow-100"
          >
            <TfiReload size={20} />
          </button>
        </div>
      </div>

      {/* Summary Section */}
      <DashboardSwitcher />
      
      {/* Table Section */}
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full border-collapse">
          <thead className="bg-[#1f3349] text-white">
            <tr>
              <th className="p-2 text-left">Account</th>
              <th className="p-2 text-right">Credit Ref.</th>
              <th className="p-2 text-right">
                Balance <LuArrowUpDown />
              </th>
              <th className="p-2 text-right">
                Exposure <LuArrowUpDown />
              </th>
              <th className="p-2 text-right">
                Avail. bal. <LuArrowUpDown />
              </th>
              <th className="p-2 text-right">
                TotalBalance <LuArrowUpDown />
              </th>
              <th className="p-2 text-right">
                Player Balance <LuArrowUpDown />
              </th>
              <th className="p-2 text-right">
                Ref. P/L <LuArrowUpDown />
              </th>
              <th className="p-2 text-center">
                Status <LuArrowUpDown />
              </th>
              <th className="p-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {currentSubAgents.map((u, i) => (
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
                    className="bg-yellow-200 font-bold text-yellow-800 text-xs px-2 py-1 rounded-[4px] cursor-pointer hover:bg-yellow-300 transition"
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

            {/* Totals Row */}
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

      {/* ====================== ADD SUB AGENT MODAL ====================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 rounded-xl">
          <div className="bg-white shadow-lg w-1/2 rounded-2xl">
            <div className="bg-yellow-600 text-white p-2 flex justify-between items-center rounded-tl-xl rounded-tr-xl">
              <h3 className="text-lg font-bold">Add Sub Agent</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white cursor-pointer hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <div className="bg-black text-white p-2 flex justify-end items-center">
              <h3 className="text-lg font-bold text-right">Step 1</h3>
            </div>
            <div className="p-4">
              <h4 className="text-lg font-bold mb-2">Personal Information</h4>
              <form
                className="max-w-4xl mx-auto bg-white p-8 rounded-lg"
                onSubmit={handleSubmit}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-4 border-b border-gray-300 mb-36">
                  <div>
                    <div className="mb-4 flex justify-center items-center gap-4 text-nowrap">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className="w-full ml-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-red-200"
                        required
                      />
                      <span className="text-red-600">*</span>
                    </div>
                    <div className="mb-4 flex justify-center items-center gap-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full ml-2 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-red-200"
                        required
                      />
                      <span className="text-red-600">*</span>
                    </div>
                    <div className="mb-4 flex justify-center items-center gap-4 text-nowrap">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-red-200"
                        required
                      />
                      <span className="text-red-600">*</span>
                    </div>
                  </div>
                  <div>
                    <div className="mb-4 flex justify-center items-center gap-4 text-nowrap">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-red-200"
                        required
                      />
                      <span className="text-red-600">*</span>
                    </div>
                    <div className="mb-4 flex justify-center items-center gap-4 text-nowrap">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full ml-[26px] border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-red-200"
                        required
                      />
                      <span className="text-red-600">*</span>
                    </div>
                    <div className="mb-4 flex justify-center items-center gap-4 text-nowrap">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        TimeZone
                      </label>
                      <select
                        name="timeZone"
                        value={formData.timeZone}
                        onChange={handleChange}
                        className="w-full ml-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-red-200"
                        required
                      >
                        {timeZones.map((zone) => (
                          <option key={zone} value={zone}>
                            {zone}
                          </option>
                        ))}
                      </select>
                      <span className="text-red-600">*</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-yellow-600 font-bold cursor-pointer text-white px-6 py-2 rounded hover:bg-yellow-700 transition"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ====================== EDIT SUB AGENT MODAL ====================== */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white shadow-lg w-1/3 rounded-2xl">
            <div className="bg-yellow-600 text-white p-3 flex justify-between items-center rounded-tl-xl rounded-tr-xl">
              <h3 className="text-lg font-bold">Edit Sub Agent</h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-white hover:text-gray-200 text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={editForm.username}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password (leave blank if not changing)
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={editForm.newPassword}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 pr-10"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? (
                      <FaEyeSlash size={18} />
                    ) : (
                      <FaEye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={editForm.confirmPassword}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 pr-10"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <FaEyeSlash size={18} />
                    ) : (
                      <FaEye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Current Password (Verification)
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    name="currentPassword"
                    value={editForm.currentPassword}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showCurrentPassword ? (
                      <FaEyeSlash size={18} />
                    ) : (
                      <FaEye size={18} />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter your (Mother Admin) password to authorize this change
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-5 py-2 border border-gray-300 rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-yellow-600 text-white px-6 py-2 rounded hover:bg-yellow-700 transition"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {statusModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 rounded-xl">
          <div className="bg-white shadow-lg w-1/3 rounded-2xl">
            <div className="bg-yellow-600 text-white p-2 flex justify-between items-center rounded-tl-xl rounded-tr-xl">
              <h3 className="text-lg font-bold">Change Status</h3>
              <button
                onClick={() => setStatusModalOpen(false)}
                className="text-white cursor-pointer hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <form onSubmit={submitStatusChange} className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AD
                </label>
                <input
                  type="text"
                  value={selectedAdminId || ""}
                  disabled
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div className="mb-4 flex justify-center space-x-4">
                <button
                  type="button"
                  onClick={() =>
                    setStatusForm({ ...statusForm, status: "Active" })
                  }
                  className={`p-2 border rounded cursor-pointer ${statusForm.status === "Active" ? "bg-gray-300" : "bg-yellow-50"}`}
                >
                  <span className="text-green-600">✔</span> Active
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setStatusForm({ ...statusForm, status: "Suspend" })
                  }
                  className={`p-2 border rounded cursor-pointer ${statusForm.status === "Suspend" ? "bg-gray-300" : "bg-yellow-50"}`}
                >
                  <span className="text-red-600">✖</span> Suspend
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setStatusForm({ ...statusForm, status: "Locked" })
                  }
                  className={`p-2 border rounded cursor-pointer ${statusForm.status === "Locked" ? "bg-gray-300" : "bg-yellow-50"}`}
                >
                  <span className="text-gray-600">🔒</span> Locked
                </button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={statusForm.password}
                  onChange={handleStatusChange}
                  placeholder="Enter password"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-yellow-600 cursor-pointer text-white px-6 py-2 rounded hover:bg-yellow-700 transition"
                >
                  Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubAgent;
