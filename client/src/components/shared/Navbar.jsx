import PrimaryButton from "./PrimaryButton";
import { FiPlusCircle } from "react-icons/fi";
import { TfiReload } from "react-icons/tfi";
import { IoMdLogIn } from "react-icons/io";
import { IoMenu } from "react-icons/io5";
import { Link, useLocation } from "react-router-dom"; // 👈 useLocation যোগ করা হয়েছে
import Sidebar from "../Sidebar";
import { useContext, useEffect, useState } from "react";
import { useGetHomeControlsQuery } from "@/redux/features/allApis/homeControlApi/homeControlApi";
import { useGetColorControlsQuery } from "@/redux/features/allApis/colorControlApi/colorControlApi";
import { AuthContext } from "@/context/AuthContext";
import axios from "axios";

const Navbar = () => {
  const { pathname } = useLocation();

  // 👇 এই কন্ডিশনে নির্দিষ্ট কিছু রুটে Navbar লুকিয়ে ফেলা হচ্ছে
  // Note: sub-folder deploy (e.g. /velki360.com/...) er jonno
  // includes/endsWith use kora hoyeche
  if (
    pathname.endsWith("/login") ||
    pathname.includes("/games/demo/") ||
    pathname.includes("/games/live/")
  ) {
    return null;
  }

  // 👇 বাকি সব কোড আগের মতোই
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { data: homeControls } = useGetHomeControlsQuery();
  const { data: colorControls } = useGetColorControlsQuery();
  const [bgColor, setBgColor] = useState("#ffffff");
  const [textColor, setTextColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(16);
  const [showSignupButton, setShowSignupButton] = useState(true);
  const [signupLink, setSignupLink] = useState("");

  const { user, reload, loading, balance, logo } = useContext(AuthContext);

  const baseUrl = import.meta.env.VITE_API_URL;
  const logoUrl = logo ? `${baseUrl}${logo}` : null;

  useEffect(() => {
    console.log(baseUrl);
    console.log(logo);
    console.log(logoUrl);
  }, [logoUrl]);

  // Helper to safely get full image URL
  const getImageUrl = (img) => {
    if (!img) return "/logo.png";
    if (img.startsWith("http")) return img;
    const cleanImg = img.startsWith("/uploads/")
      ? img.replace("/uploads/", "")
      : img;
    return `${import.meta.env.VITE_API_URL}/uploads/${cleanImg}`;
  };

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/navbar`)
      .then((res) => {
        const data = res.data;
        setBgColor(data.bgColor || "#ffffff");
        setTextColor(data.textColor || "#000000");
        setFontSize(data.fontSize || 16);
        setShowSignupButton(
          typeof data.showSignupButton === "boolean"
            ? data.showSignupButton
            : true,
        );
        setSignupLink(data.signupLink || "");
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        toast.error("Failed to fetch navbar settings!");
      });
  }, []);

  const navbarColorControl = colorControls?.find(
    (colorControl) => colorControl.section === "home-navbar",
  );

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const renderSignupButton = () => {
    if (!showSignupButton) return null;

    const trimmedLink = signupLink?.trim();
    const button = (
      <PrimaryButton icon={FiPlusCircle} background={""} size="sm">
        SignUp
      </PrimaryButton>
    );

    if (!trimmedLink) {
      return <Link to="/signup">{button}</Link>;
    }

    const isExternal = /^https?:\/\//i.test(trimmedLink);
    if (isExternal) {
      return (
        <a href={trimmedLink} target="_blank" rel="noopener noreferrer">
          {button}
        </a>
      );
    }

    return <Link to={trimmedLink}>{button}</Link>;
  };

  return (
    <div className="fixed top-0 z-20 w-full md:w-[60%] lg:w-[40%] xl:w-[30%]">
      <div className="relative">
        {isSidebarOpen && (
          <Sidebar
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={toggleSidebar}
          />
        )}

        <div
          style={{
            backgroundColor: bgColor,
            color: textColor,
            fontSize: fontSize ? fontSize : "14px",
          }}
          className="flex items-center justify-between px-3 py-2 "
        >
          {/* Left side */}
          <div className="flex flex-row items-center gap-2">
            {user && (
              <IoMenu
                className="text-black text-3xl cursor-pointer"
                onClick={toggleSidebar}
              />
            )}
            <Link to="/">
              <img className="w-[84px] h-[26px]" src={logoUrl} alt="Logo" />
            </Link>
          </div>

          {/* Right side */}
          {user ? (
            <div className="flex flex-row items-center gap-2">
              <div className="flex flex-col items-start">
                <p>@{user?.username}</p>
                <div className="flex flex-row items-center gap-1 text-sm">
                  <p>PBU {Number(balance || 0).toFixed(2)}</p>
                  <p className="text-red-500">
                    <span className="font-semibold text-black">
                      Exp ({(balance * 100).toFixed(0)})
                    </span>
                  </p>
                </div>
              </div>
              <TfiReload
                onClick={reload}
                className={`text-lg ${loading && "animate-spin"}`}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              {renderSignupButton()}
              <Link to="/login">
                <PrimaryButton icon={IoMdLogIn} background={"red"} size="sm">
                  Login
                </PrimaryButton>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
