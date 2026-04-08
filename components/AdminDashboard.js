"use client";

import { useEffect, useState, useRef } from "react";
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
import style from '../app/styles/dashboard/admin/adminDashboard.module.css';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { supabase } from "../lib/supabase";

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

  const [showUsersTable, setShowUsersTable] = useState(false);
  const [showOrganizersTable, setShowOrganizersTable] = useState(false);
  const [showEventsTable, setShowEventsTable] = useState(false);

  const [usersList, setUsersList] = useState([]);
  const [organizersList, setOrganizersList] = useState([]);
  const [eventsList, setEventsList] = useState([]);

  const COLORS = ["#0088FE", "#00C49F"];
  const MONTH_ORDER = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  useEffect(() => {
    fetchDashboardData();
  }, [selectedYear, selectedMonth]);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      // Get Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) throw new Error("Not authenticated");
      const headers = { Authorization: `Bearer ${session.access_token}` };

      // ------------------ USERS ------------------
      const usersRes = await fetch("/api/users/get", { headers });
      const usersData = await usersRes.json();
      const users = usersData.users || [];

      const filteredUsers = users.filter(u => {
        if (!u.created_at) return false;
        const createdAt = new Date(u.created_at);
        const year = createdAt.getFullYear().toString();
        const month = createdAt.toLocaleString("default", { month: "short" });
        if (selectedYear && year !== selectedYear) return false;
        if (selectedMonth && month !== selectedMonth) return false;
        return true;
      });

      const organizers = filteredUsers.filter(u => u.role_id === 6);
      const normalUsers = filteredUsers.filter(u => u.role_id !== 6 && u.role_id !== 5);

      setNumOrganizers(organizers.length);
      setUsersCount(normalUsers.length);
      setUsersList(normalUsers);
      setOrganizersList(organizers);

      // ------------------ EVENTS ------------------
      const eventsRes = await fetch("/api/events/get", { headers });
      const eventsData = await eventsRes.json();
      const events = (eventsData.events || []).map(e => ({
        ...e,
        name: e.name || e.title,
        date: e.date || e.created_at,
        createdAt: e.created_at,
      }));

      const filteredEvents = events.filter(e => {
        const createdAt = new Date(e.createdAt);
        const year = createdAt.getFullYear().toString();
        const month = createdAt.toLocaleString("default", { month: "short" });
        if (selectedYear && year !== selectedYear) return false;
        if (selectedMonth && month !== selectedMonth) return false;
        return true;
      });

      setNumEvents(filteredEvents.length);
      setEventsList(filteredEvents);

      const eventGrouped = MONTH_ORDER.reduce((acc, month) => ({ ...acc, [month]: 0 }), {});
      filteredEvents.forEach(e => {
        const month = new Date(e.createdAt).toLocaleString("default", { month: "short" });
        eventGrouped[month] += 1;
      });
      const eventChart = MONTH_ORDER.map(m => ({ month: m, events: eventGrouped[m] }));
      setEventData(eventChart);

      // ------------------ INCOME ------------------
      const bookingsRes = await fetch("/api/admin/bookings", { headers });
      const bookingsData = await bookingsRes.json();
      const bookings = bookingsData.bookings || [];

      const incomeGrouped = MONTH_ORDER.reduce((acc, month) => ({ ...acc, [month]: 0 }), {});
      bookings.forEach(b => {
        if (!b.id || b.status !== "confirmed" || !b.total_price) return;

        const createdAt = new Date(b.created_at);
        const year = createdAt.getFullYear().toString();
        const month = createdAt.toLocaleString("default", { month: "short" });

        if (selectedYear && year !== selectedYear) return;
        if (selectedMonth && month !== selectedMonth) return;

        incomeGrouped[month] += Number(b.total_price);
      });

      const incomeChart = MONTH_ORDER.map(m => ({ month: m, income: incomeGrouped[m] }));
      setIncomeData(incomeChart);

    } catch (err) {
      console.error("Dashboard fetch error:", err);
      alert("Failed to load dashboard data: " + err.message);
    } finally {
      setLoading(false);
    }
  }

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

  if (loading) return <p className={style.dashboardLoading}>Loading dashboard...</p>;

  const pieData = [
    { name: "Users", value: usersCount },
    { name: "Organizers", value: numOrganizers },
  ];

  return (
    <div className={`${style.dashboardContainer} p-6`}>
      <button onClick={exportPDF} className={style.dashboardExportButton}>Export as PDF</button>

      <div ref={dashboardRef} className={style.dashboardContent}>
        <h1 className={style.dashboardTitle}>Admin Dashboard Overview</h1>

        {/* STATS */}
        <div className={style.dashboardStats}>
          <StatCard title="Users" value={usersCount} showTable={showUsersTable} setShowTable={setShowUsersTable} list={usersList} />
          <StatCard title="Organizers" value={numOrganizers} showTable={showOrganizersTable} setShowTable={setShowOrganizersTable} list={organizersList} />
          <StatCard title="Events" value={numEvents} showTable={showEventsTable} setShowTable={setShowEventsTable} list={eventsList} isEvent />
        </div>

        {/* FILTERS */}
        <div className={style.dashboardFilters}>
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className={style.dashboardFilterSelect}>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className={style.dashboardFilterSelect}>
            <option value="">All Months</option>
            {MONTH_ORDER.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* INCOME */}
        <Chart title="Income Overview" data={incomeData} dataKey="income" barColor="#8884d8" />

        {/* EVENTS */}
        <Chart title="Events Overview" data={eventData} dataKey="events" barColor="#82ca9d" />

        {/* PIE */}
        <h2 className={style.dashboardSectionTitle}>Users vs Organizers</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart className={style.dashboardPieChart}>
            <Pie data={pieData} dataKey="value" outerRadius={100} label>
              {pieData.map((entry, index) => <Cell key={index} fill={COLORS[index]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// --- Reusable Components ---
function StatCard({ title, value, showTable, setShowTable, list, isEvent }) {
  return (
    <div className={style.dashboardCard}>
      <h2 className={style.dashboardCardTitle}>{title}</h2>
      <p style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }} onClick={() => setShowTable(!showTable)}>
        {value} {showTable ? "˄" : "˅"}
      </p>
      {showTable && (
        <div className={style.eventsTableContainer}>
          <table className={style.eventsTable}>
            <thead>
              <tr>
                <th>Name</th>
                {isEvent && <th>Date</th>}
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {list.map(item => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  {isEvent && <td>{new Date(item.date).toLocaleString()}</td>}
                  <td>{new Date(item.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Chart({ title, data, dataKey, barColor }) {
  return (
    <>
      <h2 className={style.dashboardSectionTitle}>{title}</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} className={style.dashboardBarChart}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Bar dataKey={dataKey} fill={barColor} />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}