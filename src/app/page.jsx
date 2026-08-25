"use client";

import React from "react";
import Dashboard from "../views/Dashboard";
import LandingPage from "../views/LandingPage";
import { useApp } from "./context/AppContext";

export default function HomePage() {
  const { families, nominations, user, campProfile } = useApp() || {};

  if (user) {
    return (
      <Dashboard
        families={families || []}
        nominations={nominations || []}
        user={user}
        campProfile={campProfile}
      />
    );
  }

  return <LandingPage user={user} />;
}
