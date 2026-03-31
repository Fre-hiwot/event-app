"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import styles from "../../styles/dashboard/roleDashboard.module.css";

export default function FeaturedEventsPage() {
  const ADMIN = 5;
  const ORGANIZER = 6;

  const [role, setRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // -------------------
  // Initialization
  // -------------------
  useEffect(() => {
    initialize();
  }, []);

  async function initialize() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (token) {
        // Get user role
        const res = await fetch("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { user } = await res.json();
        if (user) {
          setRole(user.role_id);
          setUserId(user.id);
        }
      }

      // Fetch featured events
      fetchFeaturedEvents();
    } catch (err) {
      console.error("Initialization error:", err);
      setEvents([]);
    }
  }

  async function fetchFeaturedEvents() {
    setLoading(true);
    try {
      const res = await fetch("/api/events/get/featured", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch featured events");

      const json = await res.json();
      setEvents(json.events || []);
    } catch (err) {
      console.error("Error fetching featured events:", err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  // -------------------
  // Event actions
  // -------------------
  async function handleBook(eventId) {
    const ticketsInput = prompt("How many tickets do you need?", "1");
    if (!ticketsInput) return;

    const tickets = parseInt(ticketsInput, 10);
    if (isNaN(tickets) || tickets <= 0) return alert("Enter a valid number of tickets");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return alert("Not authenticated");

      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ event_id: eventId, tickets }),
      });

      const result = await res.json();
      if (res.ok) alert(result.message);
      else alert(result.error);
    } catch (err) {
      console.error(err);
      alert("Booking failed");
    }
  }

  async function handleDelete(eventId) {
    if (!confirm("Delete this event?")) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch("/api/events/delete", {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ event_id: eventId }),
      });

      const result = await res.json();
      if (res.ok) fetchFeaturedEvents();
      else alert(result.error || "Delete failed");
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  }

  if (loading) return <div className={styles.page}>Loading featured events...</div>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Featured Events</h1>

      {events.length === 0 ? (
        <div className={styles.emptyStateCard}>
          <p>No events are featured yet.</p>
        </div>
      ) : (
        <div className={styles.eventList}>
          {events.map(ev => (
            <div key={ev.id} className={styles.eventCard}>
              <h3 className="font-bold text-lg">{ev.title}</h3>
              <p>Date: {new Date(ev.date).toLocaleDateString()}</p>
              <p>Location: {ev.location}</p>
              <p>
                Price: {ev.price && Number(ev.price) > 0
                  ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(ev.price))
                  : "Free"}
              </p>

              <div className="mt-2 flex gap-2">
                {/* Edit/Delete for admins/organizers */}
                {(role === ADMIN || role === ORGANIZER) && (
                  <>
                    <button
                      onClick={() => handleDelete(ev.id)}
                      className="bg-red-600 text-white px-2 py-1 rounded"
                    >
                      Delete
                    </button>
                  </>
                )}

                {/* Book button */}
                <button
                  onClick={() => handleBook(ev.id)}
                  className="px-2 py-1 rounded text-white bg-blue-600"
                >
                  Book
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}