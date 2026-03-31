"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function AdminDashboardStats() {
  const dashboardRef = useRef();

  const [numOrganizers, setNumOrganizers] = useState(0);
  const [usersCount, setUsersCount] = useState(0);
  const [numEvents, setNumEvents] = useState(0);

  const [incomeData, setIncomeData] = useState([]);
  const [eventData, setEventData] = useState([]);

  const [loading, setLoading] = useState(true);

  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedMonth, setSelectedMonth] = useState("");

  const COLORS = ["#0088FE", "#00C49F"];

  const MONTH_ORDER = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];

  // 🔥 Auto refetch when filters change
  useEffect(() => {
    fetchDashboardData();
  }, [selectedYear, selectedMonth]);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) throw new Error("Not authenticated");

      // USERS
      const { data: users } = await supabase
        .from("users")
        .select("id, role_id");

      const organizers = users?.filter((u) => u.role_id === 6) || [];
      const normalUsers = users?.filter((u) => u.role_id !== 6) || [];

      setNumOrganizers(organizers.length);
      setUsersCount(normalUsers.length);

      // EVENTS
      const { data: events } = await supabase
        .from("events")
        .select("id, created_at");

      setNumEvents(events?.length || 0);

      let filteredEvents = events || [];

      if (selectedYear) {
        filteredEvents = filteredEvents.filter(
          (e) =>
            new Date(e.created_at).getFullYear().toString() === selectedYear
        );
      }

      const eventGrouped = {};

      filteredEvents.forEach((e) => {
        const date = new Date(e.created_at);
        const month = date.toLocaleString("default", { month: "short" });

        if (selectedMonth && month !== selectedMonth) return;

        eventGrouped[month] = (eventGrouped[month] || 0) + 1;
      });

      const eventChart = MONTH_ORDER
        .filter((m) => eventGrouped[m])
        .map((month) => ({
          month,
          events: eventGrouped[month],
        }));

      setEventData(eventChart);

      // BOOKINGS (INCOME)
      let bookingQuery = supabase
        .from("bookings")
        .select("total_price, created_at")
        .eq("status", "confirmed");

      if (selectedYear) {
        bookingQuery = bookingQuery
          .gte("created_at", `${selectedYear}-01-01`)
          .lte("created_at", `${selectedYear}-12-31`);
      }

      const { data: bookings } = await bookingQuery;

      const incomeGrouped = {};

      bookings?.forEach((b) => {
        const date = new Date(b.created_at);
        const month = date.toLocaleString("default", { month: "short" });

        if (selectedMonth && month !== selectedMonth) return;

        incomeGrouped[month] =
          (incomeGrouped[month] || 0) + b.total_price;
      });

      const incomeChart = MONTH_ORDER
        .filter((m) => incomeGrouped[m])
        .map((month) => ({
          month,
          income: incomeGrouped[month],
        }));

      setIncomeData(incomeChart);

    } catch (err) {
      console.error(err);
      alert("Failed to load dashboard data: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // 📄 EXPORT PDF
  const exportPDF = async () => {
    const element = dashboardRef.current;

    const canvas = await html2canvas(element, { scale: 3 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save("admin-dashboard.pdf");
  };

  if (loading) return <p>Loading dashboard...</p>;

  const pieData = [
    { name: "Users", value: usersCount },
    { name: "Organizers", value: numOrganizers },
  ];

  return (
    <div className="p-6">
      {/* 🔹 EXPORT BUTTON */}
      <button
        onClick={exportPDF}
        className="bg-green-600 text-white px-4 py-2 rounded mb-4"
      >
        Export as PDF
      </button>

      <div ref={dashboardRef}>
        <h1 className="text-3xl font-bold mb-6">
          Admin Dashboard Overview
        </h1>

        {/* STATS */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded shadow text-center">
            <h2 className="font-bold text-xl mb-2">Users</h2>
            <p className="text-2xl">{usersCount}</p>
          </div>

          <div className="bg-white p-6 rounded shadow text-center">
            <h2 className="font-bold text-xl mb-2">Organizers</h2>
            <p className="text-2xl">{numOrganizers}</p>
          </div>

          <div className="bg-white p-6 rounded shadow text-center">
            <h2 className="font-bold text-xl mb-2">Events</h2>
            <p className="text-2xl">{numEvents}</p>
          </div>
        </div>

        {/* FILTERS */}
        <div className="flex gap-4 mb-6">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="border p-2"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border p-2"
          >
            <option value="">All Months</option>
            {MONTH_ORDER.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* INCOME */}
        <h2 className="text-2xl font-bold mb-4">Income Overview</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={incomeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="income" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>

        {/* EVENTS */}
        <h2 className="text-2xl font-bold mt-10 mb-4">Events Overview</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={eventData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="events" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>

        {/* PIE */}
        <h2 className="text-2xl font-bold mt-10 mb-4">
          Users vs Organizers
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={pieData} dataKey="value" outerRadius={100} label>
              {pieData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}