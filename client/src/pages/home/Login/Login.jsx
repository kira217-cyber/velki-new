import { FaEye, FaEyeSlash, FaUser, FaRedo, FaArrowLeft } from "react-icons/fa";
import { FaShield } from "react-icons/fa6";
import { IoIosUnlock } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useContext } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthContext } from "@/context/AuthContext";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

const Login = () => {
  const { user, loading, setLoading, login } = useContext(AuthContext);

  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [loginImage, setLoginImage] = useState("");
  const [signupLink, setSignupLink] = useState("");

  // Form States
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [inputCode, setInputCode] = useState("");

  const [suspendError, setSuspendError] = useState("");
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();
  const toastShownRef = useRef(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !toastShownRef.current) {
      toastShownRef.current = true;
      navigate("/");
    }
  }, [user, navigate]);

  const generateVerificationCode = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setVerificationCode(code);
  };

  useEffect(() => {
    generateVerificationCode();
  }, []);

  const fetchLoginData = async () => {
    try {
      const imgRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/login-image`,
      );
      if (imgRes.data?.loginImageUrl) setLoginImage(imgRes.data.loginImageUrl);

      const navRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/navbar`,
      );
      setSignupLink(navRes.data?.signupLink?.trim() || "/signup");
    } catch (err) {
      console.error("Error fetching login data:", err);
      setSignupLink("/signup");
    }
  };

  useEffect(() => {
    fetchLoginData();
  }, []);

  const getImageUrl = (img) => {
    if (!img) return "";
    if (img.startsWith("http")) return img;
    const cleanImg = img.startsWith("/uploads/")
      ? img.replace("/uploads/", "")
      : img;
    return `${import.meta.env.VITE_API_URL}/uploads/${cleanImg}`;
  };

  const handleImageClick = () => {
    const isExternal = /^https?:\/\//i.test(signupLink);
    if (isExternal) {
      window.open(signupLink, "_blank", "noopener,noreferrer");
    } else {
      navigate(signupLink || "/signup");
    }
  };

  // ==================== HANDLE LOGIN FUNCTION ====================
  const handleLogin = async () => {
    // Clear previous errors
    setSuspendError("");
    setErrors({});

    // Simple Validation
    const newErrors = {};
    if (!username.trim()) newErrors.username = "Username is required";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (!inputCode.trim()) newErrors.inputCode = "Validation code is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Check verification code
    if (inputCode !== verificationCode) {
      setErrors({ inputCode: "Validation code does not match" });
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admins/user-login`,
        { userName: username.trim(), password },
      );

      const { user: userData } = res.data;

      // ================== STATUS HANDLE ==================
      if (userData.status === "Suspend") {
        const msg =
          "Your account is suspended by the administrator. Please contact support.";
        setSuspendError(msg);
        toast.error(msg);
        return;
      }

      if (userData.status === "Locked") {
        const msg = "Your account is locked. Try again later.";
        setSuspendError(msg);
        toast.error(msg);
        return;
      }

      if (userData.status === "Active") {
        // ✅ Context এর login function ব্যবহার করা হয়েছে
        login(userData);

        toast.success("Login successful 🎉");

        // Small delay for toast visibility
        setTimeout(() => {
          if (userData.role === "MA") navigate("/ma/mother-admin");
          else if (userData.role === "SA") navigate("/sa/sub-admin");
          else navigate("/");
        }, 1200);
      } else {
        const msg = "Unauthorized access";
        setSuspendError(msg);
        toast.error(msg);
      }
    } catch (error) {
      console.error("Login Error:", error);

      const msg =
        error.response?.data?.message || "Invalid username or password";

      setSuspendError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen flex flex-col relative">
      <ToastContainer position="top-center" autoClose={3000} />

      {/* Back Button */}
      <div className="absolute top-4 left-0 w-full z-20 px-4">
        <button
          onClick={() => navigate("/")}
          className="bg-white/90 backdrop-blur-md p-2 rounded-full shadow-md hover:bg-gray-100 transition"
        >
          <FaArrowLeft className="text-xl text-black" />
        </button>
      </div>

      {/* Banner */}
      <div
        className="relative w-full h-[50vh] md:h-[60vh] cursor-pointer overflow-hidden"
        onClick={handleImageClick}
      >
        <img
          src={getImageUrl(loginImage)}
          alt="Login Banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black opacity-0 hover:opacity-10 transition-opacity" />
      </div>

      {/* Form Section */}
      <div className="w-full max-w-full mx-auto -mt-12 relative z-10 bg-white rounded-t-xl shadow-2xl px-10 pt-10 pb-8">
        <div className="space-y-4">
          <h2 className="uppercase text-3xl font-bold text-center text-black">
            LOGIN
          </h2>

          {/* Username */}
          <div className="relative">
            <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-600" />
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="pl-12 h-14 rounded-xl border text-md border-gray-400 focus:ring-2 focus:ring-yellow-500 w-full"
            />
            {errors.username && (
              <p className="text-red-500 text-sm mt-1 ml-4">
                {errors.username}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="relative">
            <IoIosUnlock className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl text-gray-600" />
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="pl-12 pr-12 h-14 text-md rounded-xl border border-gray-400 focus:ring-2 focus:ring-yellow-500 w-full"
            />
            <div
              className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl cursor-pointer text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1 ml-4">
                {errors.password}
              </p>
            )}
          </div>

          {/* Verification Code */}
          <div className="relative">
            <FaShield className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-600" />
            <Input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Validation Code"
              className="pl-12 pr-20 h-14 text-md rounded-xl border border-gray-400 focus:ring-2 focus:ring-yellow-500 w-full"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <span className="font-bold text-3xl text-black">
                {verificationCode}
              </span>
              <FaRedo
                className="text-2xl cursor-pointer text-gray-600 hover:text-black"
                onClick={() => {
                  generateVerificationCode();
                  setInputCode("");
                }}
              />
            </div>
            {errors.inputCode && (
              <p className="text-red-500 text-sm mt-1 ml-4">
                {errors.inputCode}
              </p>
            )}
          </div>

          {/* Login Button */}
          <Button
            type="button"
            onClick={handleLogin}
            disabled={loading || inputCode !== verificationCode}
            className="w-full bg-[#ffc800] hover:bg-[#e6b800] text-black font-bold text-lg py-7 rounded-xl disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </Button>

          {/* Suspend / Error Message */}
          {suspendError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-300 rounded-2xl flex items-start gap-3">
              <div className="text-red-600 mt-0.5">⚠️</div>
              <p className="text-red-700 text-[15px] leading-relaxed font-medium">
                {suspendError}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
