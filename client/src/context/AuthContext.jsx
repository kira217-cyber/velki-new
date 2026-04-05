import axios from "axios";
import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [logo, setLogo] = useState(null);

  // Fetch Balance
  const fetchBalance = async (userId) => {
    if (!userId) return;
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admins/${userId}`,
      );
      setBalance(response.data.balance || 0);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  // Fetch Logo
  const fetchLogo = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/logo`,
      );
      setLogo(response.data?.path || null);
    } catch (error) {
      console.error("Error fetching logo:", error);
    }
  };

  // Load user from localStorage on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      if (userData?._id) {
        fetchBalance(userData._id);
      }
    }
    setLoading(false);
  }, []);

  // Fetch logo once
  useEffect(() => {
    fetchLogo();
  }, []);

  // Auto refresh balance every 5 seconds
  useEffect(() => {
    let intervalId;
    if (user && user._id) {
      intervalId = setInterval(() => {
        fetchBalance(user._id);
      }, 5000);
    }
    return () => clearInterval(intervalId);
  }, [user]);

  // ✅ Improved Login Function
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));

    if (userData?._id) {
      fetchBalance(userData._id);
    }
  };

  const logout = () => {
    setUser(null);
    setBalance(0);
    localStorage.removeItem("user");
  };

  const reload = async () => {
    if (user && user._id) {
      await fetchBalance(user._id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        balance,
        loading,
        setLoading,
        login, // ← এটি Login component এ ব্যবহার করবেন
        logout,
        reload,
        logo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
