import { useForm } from "react-hook-form";
import {
  FaEye,
  FaEyeSlash,
  FaUser,
  FaRedo,
} from "react-icons/fa";
import { FaShield } from "react-icons/fa6";
import { IoIosUnlock } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useContext } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthContext } from "@/context/AuthContext";
import axios from "axios";
import { toast } from "react-toastify";

const Login = () => {
  const { user, setUser, loading, setLoading } = useContext(AuthContext);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [loginImage, setLoginImage] = useState("");
  const [signupLink, setSignupLink] = useState(""); // 👈 নতুন স্টেট
  const navigate = useNavigate();
  const toastShownRef = useRef(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !toastShownRef.current) {
      toastShownRef.current = true;
      navigate("/");
    }
  }, [user, navigate]);

  // Generate random verification code
  const generateVerificationCode = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setVerificationCode(code);
  };

  useEffect(() => {
    generateVerificationCode();
  }, []);

  // Fetch login image AND signup link from navbar settings
  const fetchLoginData = async () => {
    try {
      // লগিন ইমেজ ফেচ
      const imgRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/login-image`);
      if (imgRes.data && imgRes.data.loginImageUrl) {
        setLoginImage(imgRes.data.loginImageUrl);
      }

      // navbar settings থেকে signupLink ফেচ (যেটা Navbar-এও ব্যবহার হয়)
      const navRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/navbar`);
      if (navRes.data && navRes.data.signupLink) {
        setSignupLink(navRes.data.signupLink.trim());
      } else {
        setSignupLink("/signup"); // ডিফল্ট ফলব্যাক
      }
    } catch (err) {
      console.error("Error fetching login data:", err);
      setSignupLink("/signup"); // এরর হলেও ডিফল্ট রাখো
    }
  };

  useEffect(() => {
    fetchLoginData();
  }, []);

  // Helper to get full image URL
  const getImageUrl = (img) => {
    if (!img) return "/placeholder.png";
    if (img.startsWith("http")) return img;
    const cleanImg = img.startsWith("/uploads/") ? img.replace("/uploads/", "") : img;
    return `${import.meta.env.VITE_API_URL}/uploads/${cleanImg}`;
  };

  // Handle image click → redirect to signup link
  const handleImageClick = () => {
    if (!signupLink) {
      navigate("/signup");
      return;
    }

    const isExternal = /^https?:\/\//i.test(signupLink);
    if (isExternal) {
      window.open(signupLink, "_blank", "noopener,noreferrer");
    } else {
      navigate(signupLink);
    }
  };

  // React Hook Form
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();

  const watchInputCode = watch("inputCode", "");
  const isLoginDisabled = !(watchInputCode === verificationCode);

  // Login submit
  const onSubmit = async (data) => {
    const { username, password } = data;
    try {
      setLoading(true);
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admins/user-login`,
        {
          userName: username,
          password: password,
        }
      );

      const { user: userData } = res.data;
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      toast.success("Login successful");

      if (userData.role === "MA") navigate("/ma/mother-admin");
      else if (userData.role === "SA") navigate("/sa/sub-admin");
      else navigate("/");
    } catch (error) {
      console.error("Login Error:", error);
      const msg = error.response?.data?.message || "Invalid username or password";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* Clickable Full Width Banner Image */}
      <div
        className="relative w-full h-[50vh] md:h-[60vh] cursor-pointer overflow-hidden"
        onClick={handleImageClick}
      >
        <img
          src={getImageUrl(loginImage)}
          alt="Click to Sign Up"
          className="w-full h-full object-cover"
        />
        {/* Optional: subtle overlay to indicate clickable */}
        <div className="absolute inset-0 bg-black opacity-0 hover:opacity-10 transition-opacity"></div>
      </div>

      {/* Login Form Card */}
      <div className="w-full max-w-md mx-auto -mt-10 relative z-10 bg-white rounded-t-3xl shadow-2xl px-6 pt-10 pb-8">
        <form onSubmit={handleSubmit(onSubmit)}>
          <h2 className="uppercase text-3xl font-bold text-center text-black mb-8">
            LOGIN
          </h2>

          {/* Username */}
          <div className="relative mb-6">
            <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-600" />
            <Input
              type="text"
              {...register("username", { required: "Username is required" })}
              placeholder="Username"
              className="pl-12 h-14 rounded-xl border border-gray-400 focus:ring-2 focus:ring-yellow-500 w-full"
            />
            {errors.username && <p className="text-red-500 text-sm mt-1 ml-4">{errors.username.message}</p>}
          </div>

          {/* Password */}
          <div className="relative mb-6">
            <IoIosUnlock className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl text-gray-600" />
            <Input
              type={showPassword ? "text" : "password"}
              {...register("password", {
                required: "Password is required",
                minLength: { value: 6, message: "Password must be at least 6 characters" },
              })}
              placeholder="Password"
              className="pl-12 pr-12 h-14 rounded-xl border border-gray-400 focus:ring-2 focus:ring-yellow-500 w-full"
            />
            <div
              className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl cursor-pointer text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </div>
            {errors.password && <p className="text-red-500 text-sm mt-1 ml-4">{errors.password.message}</p>}
          </div>

          {/* Verification Code */}
          <div className="relative mb-8">
            <FaShield className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-600" />
            <Input
              type="text"
              {...register("inputCode", { required: "Validation code is required" })}
              placeholder="Validation Code"
              className="pl-12 pr-20 h-14 rounded-xl border border-gray-400 focus:ring-2 focus:ring-yellow-500 w-full"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <span className="font-bold text-3xl text-black">{verificationCode}</span>
              <FaRedo
                className="text-2xl cursor-pointer text-gray-600 hover:text-black"
                onClick={() => {
                  generateVerificationCode();
                  reset({ inputCode: "" });
                }}
              />
            </div>
            {errors.inputCode && <p className="text-red-500 text-sm mt-1 ml-4">{errors.inputCode.message}</p>}
          </div>

          {/* Login Button */}
          <Button
            type="submit"
            disabled={isLoginDisabled || loading}
            className="w-full bg-[#ffc800] hover:bg-[#e6b800] text-black font-bold text-lg py-7 rounded-xl disabled:opacity-60"
          >
            {loading ? "Loading..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;