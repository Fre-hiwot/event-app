// /components/RoleBasedDashboard.js
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import AdminDashboard from "../app/dashboard/admin/page";

export default function RoleBasedDashboard() {
  const [roleId, setRoleId] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("users").select("role_id").eq("email", user.email).single();
        if (profile) setRoleId(profile.role_id);
      }
    }
    fetchUser();
  }, []);

  if (roleId === null) return <p>Loading...</p>;

  if (roleId === 5) return <AdminDashboard />; // Admin
  if (roleId === 6) return <p>Organizer Dashboard Placeholder</p>; // Organizer
  return <p>User Dashboard Placeholder</p>; // Regular user
}