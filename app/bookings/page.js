"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import styles from "../styles/event/eventpage.module.css";

export default function BookingsPage() {
  const [eventsSummary, setEventsSummary] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(null);

  const USER_ROLE = 7;
  const ORGANIZER_ROLE = 6;
  const ADMIN_ROLE = 5;

  useEffect(() => {
    fetchBookingsSummary();
  }, []);

  // =========================
  // CHECK EVENT ACTIVE
  // =========================
  const isEventActive = (ev) => {
    const now = new Date();

    const eventNotExpired =
      !ev.date || new Date(ev.date) >= now;

    const ends = ev.end_date_stages || {};

    const hasActiveStage = Object.values(ends).some((end) => {
      if (!end) return true;
      return new Date(end) >= now;
    });

    return eventNotExpired && hasActiveStage;
  };

  // =========================
  // FETCH SUMMARY
  // =========================
  async function fetchBookingsSummary() {
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;
      const user = session?.user;

      if (!user || !token) {
        alert("Not authenticated");
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("id, role_id")
        .eq("auth_id", user.id)
        .single();

      setRole(profile.role_id);

      let query = supabase.from("bookings").select(`
        id,
        event_id,
        status,
        user_id,
        tickets,
        total_price,
        events!inner(
          title,
          date,
          location,
          image_url,
          created_by,
          end_date_stages
        )
      `);

      if (profile.role_id === ORGANIZER_ROLE) {
        query = query.eq("events.created_by", profile.id);
      } else if (profile.role_id === USER_ROLE) {
        query = query.eq("user_id", profile.id);
      }

      const { data } = await query;

      // ❌ REMOVE EXPIRED EVENTS
      const activeData = (data || []).filter((b) =>
        isEventActive(b.events)
      );

      let summary = [];

      if (
        profile.role_id === ADMIN_ROLE ||
        profile.role_id === ORGANIZER_ROLE
      ) {
        const grouped = {};

        activeData.forEach((b) => {
          const eid = b.event_id;

          if (!grouped[eid]) {
            grouped[eid] = {
              event_id: eid,
              title: b.events?.title,
              date: b.events?.date,
              location: b.events?.location,
              image_url: b.events?.image_url,
              totalTickets: 0,
              totalRevenue: 0,
              statusCount: {
                pending: 0,
                confirmed: 0,
                cancelled: 0,
              },
            };
          }

          const tickets = b.tickets || 0;
          const status = b.status?.toLowerCase();

          grouped[eid].totalTickets += tickets;
          grouped[eid].totalRevenue += Number(b.total_price) || 0;

          if (status === "pending")
            grouped[eid].statusCount.pending += tickets;
          else if (status === "confirmed")
            grouped[eid].statusCount.confirmed += tickets;
          else if (status === "cancelled")
            grouped[eid].statusCount.cancelled += tickets;
        });

        summary = Object.values(grouped);
      } else {
        const grouped = {};

        activeData.forEach((b) => {
          const eid = b.event_id;

          if (!grouped[eid]) {
            grouped[eid] = {
              event_id: eid,
              title: b.events?.title,
              date: b.events?.date,
              location: b.events?.location,
              image_url: b.events?.image_url,
              totalTickets: 0,
              totalSpent: 0,
              statusCount: {
                pending: 0,
                confirmed: 0,
                cancelled: 0,
              },
            };
          }

          const tickets = b.tickets || 0;
          const status = b.status?.toLowerCase();

          grouped[eid].totalTickets += tickets;
          grouped[eid].totalSpent += Number(b.total_price) || 0;

          if (status === "pending")
            grouped[eid].statusCount.pending += tickets;
          else if (status === "confirmed")
            grouped[eid].statusCount.confirmed += tickets;
          else if (status === "cancelled")
            grouped[eid].statusCount.cancelled += tickets;
        });

        summary = Object.values(grouped);
      }

      setEventsSummary(summary);
    } catch (err) {
      console.error("FINAL ERROR:", err);
      alert("Failed to fetch bookings summary");
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // FILTER
  // =========================
  const filteredSummary = eventsSummary.filter((e) => {
    const name = e.title?.toLowerCase() || "";
    const eventDateStr = e.date
      ? new Date(e.date).toLocaleDateString("en-CA")
      : "";

    return (
      name.includes(search.toLowerCase()) &&
      (selectedDate ? eventDateStr === selectedDate : true)
    );
  });

  // =========================
  // UI
  // =========================
  return (
    <div className={styles["events-container"]}>
      <div className={styles["events-header"]}>
        <h1 className={styles["events-title"]}>
          {role === ADMIN_ROLE || role === ORGANIZER_ROLE
            ? "Event Booking Summary"
            : "My Bookings"}
        </h1>
      </div>

      {/* FILTERS */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <input
          type="text"
          placeholder="Search by event name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 w-full md:w-1/2 rounded"
        />

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border p-2 rounded"
        />

        <button
          onClick={() => {
            setSearch("");
            setSelectedDate("");
          }}
          className="bg-gray-500 text-white px-4 rounded"
        >
          Clear
        </button>
      </div>

      {/* CONTENT */}
      {loading ? (
        <p className={styles["events-loading"]}>Loading...</p>
      ) : filteredSummary.length === 0 ? (
        <p className={styles["events-empty"]}>No bookings found</p>
      ) : (
        <div className={styles["events-grid"]}>
          {filteredSummary.map((e) => (
            <div key={e.event_id} className={styles["event-card"]}>
              <img
                src={e.image_url || "/default-event.jpg"}
                className={styles["event-image"]}
              />

              <h2 className={styles["event-name"]}>{e.title}</h2>

              <p>
                <strong>Location:</strong> {e.location}
              </p>

              <p>
                <strong>Date:</strong>{" "}
                {e.date ? new Date(e.date).toLocaleDateString() : "N/A"}
              </p>

              {/* TOTAL */}
              <p><strong>Total Tickets:</strong> {e.totalTickets}</p>

              {/* STATUS BREAKDOWN */}
              <div style={{ marginTop: "8px" }}>
                <p style={{ color: "#eab308" }}>
                  Pending: {e.statusCount?.pending || 0}
                </p>
                <p style={{ color: "#22c55e" }}>
                  Confirmed: {e.statusCount?.confirmed || 0}
                </p>
                <p style={{ color: "#ef4444" }}>
                  Cancelled: {e.statusCount?.cancelled || 0}
                </p>
              </div>

              {/* ADMIN / USER FINANCIAL */}
              {role === ADMIN_ROLE || role === ORGANIZER_ROLE ? (
                <p>
                  <strong>Total Revenue:</strong> ${e.totalRevenue}
                </p>
              ) : (
                <p>
                  <strong>Total Spent:</strong> ${e.totalSpent}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}