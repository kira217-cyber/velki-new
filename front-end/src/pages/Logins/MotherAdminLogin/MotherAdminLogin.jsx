import React, { useContext, useEffect, useState } from "react";
import { FaSyncAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import axios from "axios";
import { AuthContext } from "../../../context/AuthContext";
import { useNavigate } from "react-router";
import bg from "../../../assets/bg.jpg";

const MotherAdminLogin = () => {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [validationInput, setValidationInput] = useState("");
  const [adminImage, setAdminImage] = useState(null);
  const [code, setCode] = useState(generateCode());
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  function generateCode() {
    return Math.floor(1000 + Math.random() * 9000);
  }

  const fetchAdminImage = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin-login-image`,
      );
      if (res.data && res.data.loginImageUrl) {
        const fullImageUrl = `${import.meta.env.VITE_API_URL}${res.data.loginImageUrl}`;
        setAdminImage(fullImageUrl);
      }
    } catch (err) {
      console.error("Error fetching admin image:", err);
    }
  };

  useEffect(() => {
    fetchAdminImage();
  }, []);

  const handleRefresh = () => setCode(generateCode());

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Validation Code Check
    if (validationInput != code) {
      toast.error("Validation code mismatch!");
      return;
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admins/ad-login`,
        { userName, password },
      );

      const data = res.data;

      if (data?.user) {
        // ✅ STATUS CHECK START
        if (data.user.status === "Suspend") {
          toast.error("❌ Your account is suspended!");
          return;
        }

        if (data.user.status === "Locked") {
          toast.error("🔒 Your account is locked!");
          return;
        }

        if (data.user.status !== "Active") {
          toast.error("⚠️ Invalid account status!");
          return;
        }
        // ✅ STATUS CHECK END

        // ✅ LOGIN SUCCESS
        login(data.user);
        toast.success("Login successful!");

        if (data.user.role === "MA") {
          navigate("/ma/mother-admin");
        } else {
          toast.error("You do not have permission to access this page!");
          navigate("/restricted");
        }
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Something went wrong. Try again!",
      );
    }
  };

  return (
    <div
      className="min-h-screen flex justify-center items-center bg-left md:bg-center relative px-4"
      style={{
        backgroundImage: `url(${bg})`,
      }}
    >
      {/* Overlay */}
      {/* <div className="absolute inset-0 bg-black/50"></div> */}

      {/* Main Container */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 lg:gap-20 p-6 md:p-10 rounded-lg w-full max-w-4xl">
        {/* Logo */}
        {adminImage && (
          <img src={adminImage} alt="Logo" className="w-28 md:w-36 lg:w-40" />
        )}

        {/* Form Section */}
        <div className="w-full md:border-l-2 md:border-white md:pl-6">
          <h2 className="text-center md:text-left text-white text-xl md:text-2xl font-bold mb-6">
            Mother Admin{" "}
            <span className="text-gray-300 font-normal">Login</span>
          </h2>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 md:space-y-5 grid grid-cols-1"
          >
            {/* Username */}
            <input
              type="text"
              placeholder="Username"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full md:w-1/2 px-4 py-2 bg-white text-black rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-600"
              required
            />

            {/* Password */}
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full md:w-1/2 px-4 py-2 bg-white text-black rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-600"
              required
            />

            {/* Validation Code */}
            <div className="flex items-center md:w-1/3">
              <input
                type="text"
                required
                value={validationInput}
                onChange={(e) => setValidationInput(e.target.value)}
                placeholder="Validation Code"
                className="flex-1 w-44.5 px-3 md:px-4 py-2 bg-white text-black rounded-l-md focus:outline-none focus:ring-2 focus:ring-yellow-600 text-sm md:text-base"
              />
              <span className="px-3 md:px-4 py-2 bg-white text-black font-bold border-l border-gray-400 text-sm md:text-base">
                {code}
              </span>
              <button
                type="button"
                onClick={handleRefresh}
                className="px-3 md:px-4 py-2.5 bg-yellow-600 hover:bg-yellow-700 rounded-r-md flex items-center justify-center"
              >
                <FaSyncAlt size={18} className="text-white" />
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full md:w-1/2 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-md transition-all duration-200"
            >
              Login
            </button>
          </form>

          {/* APK Download */}
          <div className="flex justify-center md:justify-start mt-6">
            <button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-md">
              <img
                src="https://cdn-icons-png.flaticon.com/512/226/226770.png"
                alt="apk"
                className="w-5"
              />
              <span className="text-sm">Download APK</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MotherAdminLogin;
