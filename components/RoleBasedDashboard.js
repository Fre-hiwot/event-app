"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

import AdminDashboard from "../app/dashboard/admin/page";
import OrganizerDashboard from "../app/dashboard/organizer/page";
//import UserDashboard from "../app/dashboard/user/page";

export default function RoleBasedDashboard() {

  const [roleId, setRoleId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserRole();
  }, []);

  async function getUserRole() {

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile, error } = await supabase
      .from("users")
      .select("role_id")
      .eq("email", user.email)
      .single();

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setRoleId(profile.role_id);
    setLoading(false);
  }

  if (loading) return <p>Loading dashboard...</p>;

  // Role Routing
  if (roleId === 5) return <AdminDashboard />;
  if (roleId === 6) return <OrganizerDashboard />;
  if (roleId === 7) return <UserDashboard />;

  return <p>Access Denied</p>;
}