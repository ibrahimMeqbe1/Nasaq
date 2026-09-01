"use client";

import React from "react";
import CampSettings from "../../views/CampSettings";
import { useApp } from "../context/AppContext";

export default function SettingsPage() {
  const { user, campProfile, setCampProfile, handleLogout } = useApp() || {};
  return <CampSettings user={user} campProfile={campProfile} setCampProfile={setCampProfile} onLogout={handleLogout} />;
}
