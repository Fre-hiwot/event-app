"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import {
  FaUsers,
  FaCalendarAlt,
  FaMoneyCheckAlt,
  FaChartBar,
  FaBell,
  FaCog,
  FaFileAlt,
} from "react-icons/fa";

export default function AdminDashboard() {
  // State for real-time stats
  const [stats, setStats] = useState({
    users: 0,
    events: 0,
    bookings: 0,
    revenue: 0,
  });

  useEffect(() => {
    // ✅ Fetch stats
    async function fetchStats() {
      const { count: userCount } = await supabase.from("users").select("*", { count: "exact" });
      const { count: eventCount } = await supabase.from("events").select("*", { count: "exact" });
      const { count: bookingCount } = await supabase.from("bookings").select("*", { count: "exact" });
      const { data: revenueData } = await supabase.from("bookings").select("amount");

      const totalRevenue = revenueData?.reduce((sum, b) => sum + (b.amount || 0), 0) || 0;

      setStats({
        users: userCount || 0,
        events: eventCount || 0,
        bookings: bookingCount || 0,
        revenue: totalRevenue,
      });
    }

    fetchStats();

    // ✅ Real-time subscription for changes
    const userChannel = supabase
      .channel("public:users")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        fetchStats
      )
      .subscribe();

    const eventChannel = supabase
      .channel("public:events")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        fetchStats
      )
      .subscribe();

    const bookingChannel = supabase
      .channel("public:bookings")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        fetchStats
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(userChannel);
      supabase.removeChannel(eventChannel);
      supabase.removeChannel(bookingChannel);
    };
  }, []);

  // Dashboard section cards
  const cards = [
    { name: "User Management", href: "/dashboard/admin/users", icon: <FaUsers size={30} /> },
    { name: "Event Management", href: "/dashboard/admin/events", icon: <FaCalendarAlt size={30} /> },
    { name: "Bookings & Transactions", href: "/dashboard/admin/bookings", icon: <FaMoneyCheckAlt size={30} /> },
    { name: "Analytics & Reports", href: "/dashboard/admin/analytics", icon: <FaChartBar size={30} /> },
    { name: "Notifications", href: "/dashboard/admin/notifications", icon: <FaBell size={30} /> },
    { name: "System Settings", href: "/dashboard/admin/settings", icon: <FaCog size={30} /> },
    { name: "Activity Logs", href: "/dashboard/admin/logs", icon: <FaFileAlt size={30} /> },
    { name: "Organizer Management", href: "/dashboard/admin/organizer", icon: <FaUsers size={30} /> },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-500 text-white p-4 rounded shadow">
          <p className="text-sm">Total Users</p>
          <h2 className="text-2xl font-bold">{stats.users}</h2>
        </div>
        <div className="bg-green-500 text-white p-4 rounded shadow">
          <p className="text-sm">Events</p>
          <h2 className="text-2xl font-bold">{stats.events}</h2>
        </div>
        <div className="bg-yellow-500 text-white p-4 rounded shadow">
          <p className="text-sm">Bookings</p>
          <h2 className="text-2xl font-bold">{stats.bookings}</h2>
        </div>
        <div className="bg-red-500 text-white p-4 rounded shadow">
          <p className="text-sm">Revenue</p>
          <h2 className="text-2xl font-bold">${stats.revenue}</h2>
        </div>
      </div>

      {/* Dashboard Section Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Link
            key={card.name}
            href={card.href}
            className="p-6 bg-white shadow rounded flex items-center gap-4 hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
          >
            {card.icon}
            <span className="text-lg font-medium">{card.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}