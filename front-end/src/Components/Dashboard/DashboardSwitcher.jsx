import React, { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import MotherAdminDashboard from "./MotherAdminDashboard";
import OtherAdminDashboard from "./OtherAdminDashboard";

const DashboardSwitcher = () => {
  const { motherAdmin } = useContext(AuthContext);

  if (!motherAdmin) return null; // অথবা loader দিতে পারো

  return (
    <>
      {motherAdmin.role === "MA" ? (
        <MotherAdminDashboard />
      ) : (
        <OtherAdminDashboard />
      )}
    </>
  );
};

export default DashboardSwitcher;