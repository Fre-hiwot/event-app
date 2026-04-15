"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import styles from "../styles/event/booked.module.css";

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

  async function fetchBookingsSummary() {
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) return;

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
          created_by
        )
      `);

      if (profile.role_id === ORGANIZER_ROLE) {
        query = query.eq("events.created_by", profile.id);
      } else if (profile.role_id === USER_ROLE) {
        query = query.eq("user_id", profile.id);
      }

      const { data } = await query;

      const grouped = {};

      (data || []).forEach((b) => {
        const eid = b.event_id;
        const status = (b.status || "").toLowerCase();
        const tickets = Number(b.tickets || 0);
        const price = Number(b.total_price || 0);

        if (!grouped[eid]) {
          grouped[eid] = {
            event_id: eid,
            title: b.events?.title,
            date: b.events?.date,
            location: b.events?.location,
            image_url: b.events?.image_url,

            totalTickets: 0,
            confirmedTickets: 0,
            totalRevenue: 0,

            statusCount: {
              pending: 0,
              confirmed: 0,
              cancelled: 0,
            },
          };
        }

        grouped[eid].totalTickets += tickets;
        grouped[eid].statusCount[status] =
          (grouped[eid].statusCount[status] || 0) + tickets;

        if (status === "confirmed") {
          grouped[eid].confirmedTickets += tickets;
        }

        // ✅ FIX: include all paid bookings
        grouped[eid].totalRevenue += price;
      });

      setEventsSummary(Object.values(grouped));
    } catch (err) {
      console.error(err);
      alert("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }

  const filteredSummary = eventsSummary.filter((e) => {
    const name = e.title?.toLowerCase() || "";
    const dateStr = e.date ? new Date(e.date).toLocaleDateString("en-CA") : "";

    return (
      name.includes(search.toLowerCase()) &&
      (selectedDate ? dateStr === selectedDate : true)
    );
  });

  return (
    <div className={styles.eventsContainer}>
      <div className={styles.eventsHeader}>
        <h1 className={styles.eventsTitle}>Event Booking Summary</h1>
      </div>

      {/* FILTERS */}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search event..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.input}
        />

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className={styles.input}
        />

        <button
          onClick={() => {
            setSearch("");
            setSelectedDate("");
          }}
          className={styles.clearBtn}
        >
          Clear
        </button>
      </div>

      {/* CONTENT */}
      {loading ? (
        <p className={styles.loading}>Loading...</p>
      ) : filteredSummary.length === 0 ? (
        <p className={styles.empty}>No bookings found</p>
      ) : (
        <div className={styles.grid}>
          {filteredSummary.map((e) => (
            <div key={e.event_id} className={styles.card}>
              <img
                src={e.image_url || "/default-event.jpg"}
                className={styles.image}
                alt={e.title}
              />

              <h2 className={styles.title}>{e.title}</h2>

              <p>📍 {e.location}</p>
              <p>📅 {new Date(e.date).toLocaleDateString()}</p>

              <hr />

              <p>Total Tickets: {e.totalTickets}</p>
              <p className={styles.confirmed}>
                Confirmed: {e.confirmedTickets}
              </p>

              <p className={styles.pending}>
                Pending: {e.statusCount.pending}
              </p>

              <p className={styles.cancelled}>
                Cancelled: {e.statusCount.cancelled}
              </p>

              <hr />

              <p className={styles.revenue}>
                 Total Revenue: ${e.totalRevenue}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}