"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import styles from "../../styles/event/featuredEvent.module.css";

export default function FeaturedManagementPage() {
  const ADMIN = 5;
  const ORGANIZER = 6;

  const [events, setEvents] = useState([]);
  const [role, setRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    initialize();
  }, []);

  // -------------------
  // Initialization
  // -------------------
  async function initialize() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;
      if (!token) return alert("Not authenticated");

      const resUser = await fetch("/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { user } = await resUser.json();
      if (!user) return alert("User not found");

      setRole(user.role_id);
      setUserId(user.id);

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
  // Toggle Featured
  // -------------------
  async function toggleFeatured(eventId) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;
      if (!token) return alert("Not authenticated");

      const event = events.find((ev) => ev.id === eventId);
      if (!event) return alert("Event not found");

      const newFeatured = !event.is_featured;
      setUpdatingId(eventId);

      const res = await fetch("/api/events/update/featured", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          event_id: eventId,
          is_featured: newFeatured,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Update failed");

      // Update UI
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === eventId ? { ...ev, is_featured: newFeatured } : ev
        )
      );

      alert(
        `Event "${event.title}" is now ${
          newFeatured ? "featured" : "not featured"
        }`
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update featured status");
    } finally {
      setUpdatingId(null);
    }
  }

  // -------------------
  // Render
  // -------------------
  if (loading) return <p className={styles.page}>Loading events...</p>;

  if (role !== ADMIN && role !== ORGANIZER) {
    return (
      <p className={styles.page}>
        You do not have access to this page.
      </p>
    );
  }

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
              <img
                src={ev.image_url || "/default-event.jpg"}
                alt={ev.title}
                className={styles.eventImage}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/default-event.jpg";
                }}
              />

              <h3 className={styles.eventTitle}>{ev.title}</h3>

              <p>Date: {new Date(ev.date).toLocaleDateString()}</p>
              <p>Location: {ev.location}</p>

              {/* ✅ UPDATED PRICE SECTION */}
              <p>
                Price:{" "}
                {ev.price_regular
                  ? `$${ev.price_regular}`
                  : ev.price_vip || ev.price_vvip
                  ? "See VIP options"
                  : "Free"}
                {ev.price_vip ? ` (VIP: $${ev.price_vip})` : ""}
                {ev.price_vvip ? ` (VVIP: $${ev.price_vvip})` : ""}
              </p>

              <p>
                Featured:{" "}
                <span
                  className={
                    ev.is_featured
                      ? styles.featuredYes
                      : styles.featuredNo
                  }
                >
                  {ev.is_featured ? "Yes" : "No"}
                </span>
              </p>

              <button
                className={styles.featuredButton}
                onClick={() => toggleFeatured(ev.id)}
                disabled={updatingId === ev.id}
              >
                {updatingId === ev.id
                  ? "Updating..."
                  : ev.is_featured
                  ? "Remove from Featured"
                  : "Mark as Featured"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}