"use client";

import { useEffect, useState } from "react";
import styles from "../../../styles/dashboard/roleDashboard.module.css";
import { supabase } from "../../../lib/supabase";

export default function FeaturedManagementPage() {
  const ADMIN = 5;
  const ORGANIZER = 6;

  const [events, setEvents] = useState([]);
  const [role, setRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initialize();
  }, []);

  // -------------------
  // Initialization
  // -------------------
  async function initialize() {
    try {
      // Get user session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return alert("Not authenticated");

      // Fetch user info via API
      const resUser = await fetch("/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { user } = await resUser.json();
      if (!user) return alert("User not found");

      setRole(user.role_id);
      setUserId(user.id);

      // Fetch events
      await fetchEvents(user.role_id, user.id, token);
    } catch (err) {
      console.error("Initialization failed:", err);
      setLoading(false);
    }
  }

  // -------------------
  // Fetch Events
  // -------------------
  async function fetchEvents(userRole, userId, token) {
    setLoading(true);
    try {
      const res = await fetch("/api/events/get", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch events");

      let { events } = await res.json();
      if (!events) events = [];

      // Organizer sees only their events
      if (userRole === ORGANIZER) {
        events = events.filter((ev) => ev.created_by === userId);
      }

      setEvents(events);
    } catch (err) {
      console.error("Fetch events failed:", err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  // -------------------
  // Toggle Featured Status
  // -------------------
  async function toggleFeatured(eventId, currentState) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return alert("Not authenticated");

      const res = await fetch("/api/events/update/featured", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ event_id: eventId, is_featured: !currentState }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Update failed");

      // Update locally
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === eventId ? { ...ev, is_featured: !currentState } : ev
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update featured status");
    }
  }

  // -------------------
  // Render
  // -------------------
  if (loading) return <p className={styles.page}>Loading events...</p>;

  if (role !== ADMIN && role !== ORGANIZER)
    return <p className={styles.page}>You do not have access to this page.</p>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Manage Featured Events</h1>

      {events.length === 0 ? (
        <div className={styles.emptyStateCard}>
          <p>No events found.</p>
        </div>
      ) : (
        <div className={styles.eventList}>
          {events.map((ev) => (
            <div key={ev.id} className={styles.eventCard}>
              <h3 className="font-bold text-lg">{ev.title}</h3>
              <p>Date: {new Date(ev.date).toLocaleDateString()}</p>
              <p>Location: {ev.location}</p>
              <p>Price: ${ev.price ?? 0}</p>
              <p>
                Featured:{" "}
                <span className={ev.is_featured ? "text-green-600" : "text-gray-500"}>
                  {ev.is_featured ? "Yes" : "No"}
                </span>
              </p>

              <button
                className="mt-2 px-3 py-1 bg-blue-600 text-white rounded"
                onClick={() => toggleFeatured(ev.id, ev.is_featured)}
              >
                {ev.is_featured ? "Remove from Featured" : "Mark as Featured"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}