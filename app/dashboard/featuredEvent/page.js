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

  // =========================
  // INIT
  // =========================
  async function initialize() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;
      if (!token) {
        setLoading(false);
        return;
      }

      const resUser = await fetch("/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { user } = await resUser.json();
      if (!user) {
        setLoading(false);
        return;
      }

      setRole(user.role_id);
      setUserId(user.id);

      await fetchEvents(user.role_id, user.id, token);
    } catch (err) {
      console.error("Initialization failed:", err);
      setLoading(false);
    }
  }

  // =========================
  // ONLY DATE CHECK (IMPORTANT)
  // =========================
  const isEventActive = (date) => {
    if (!date) return false;
    return new Date(date).getTime() >= Date.now();
  };

  // =========================
  // FETCH EVENTS (FILTERED)
  // =========================
  async function fetchEvents(userRole, userId, token) {
    setLoading(true);

    try {
      const res = await fetch("/api/events/get", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      let events = Array.isArray(data) ? data : data.events || [];

      // ORGANIZER ONLY THEIR EVENTS
      if (userRole === ORGANIZER) {
        events = events.filter((ev) => ev.created_by === userId);
      }

      // ❌ REMOVE EXPIRED EVENTS (ONLY BY DATE)
      const activeEvents = events.filter((ev) =>
        isEventActive(ev.date)
      );

      setEvents(activeEvents);
    } catch (err) {
      console.error("Fetch events failed:", err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // TOGGLE FEATURED
  // =========================
  async function toggleFeatured(eventId) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;
      if (!token) return alert("Not authenticated");

      const event = events.find((ev) => ev.id === eventId);
      if (!event) return;

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
      if (!res.ok) throw new Error(result.error);

      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === eventId
            ? { ...ev, is_featured: newFeatured }
            : ev
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update featured status");
    } finally {
      setUpdatingId(null);
    }
  }

  // =========================
  // STAGES DISPLAY (UNCHANGED)
  // =========================
  function renderStages(ev) {
    const stages = ev.price_regular_stages || {};
    const ends = ev.end_date_stages || {};

    return (
      <div>
        <p>
          Early: ${stages.early?.price || 0} | End:{" "}
          {ends.early ? new Date(ends.early).toLocaleDateString() : "N/A"}
        </p>

        <p>
          Round2: ${stages.round2?.price || 0} | End:{" "}
          {ends.round2 ? new Date(ends.round2).toLocaleDateString() : "N/A"}
        </p>

        <p>
          Round3: ${stages.round3?.price || 0} | End:{" "}
          {ends.round3 ? new Date(ends.round3).toLocaleDateString() : "N/A"}
        </p>

        <p>VIP: ${ev.price_vip || 0}</p>
        <p>VVIP: ${ev.price_vvip || 0}</p>
      </div>
    );
  }

  // =========================
  // LOADING / ACCESS
  // =========================
  if (loading) return <p className={styles.page}>Loading...</p>;

  if (role !== ADMIN && role !== ORGANIZER) {
    return <p className={styles.page}>No access</p>;
  }

  // =========================
  // UI
  // =========================
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Manage Featured Events</h1>

      {events.length === 0 ? (
        <p>No events found</p>
      ) : (
        <div className={styles.eventList}>
          {events.map((ev) => (
            <div key={ev.id} className={styles.eventCard}>
              <img
                src={ev.image_url || "/default-event.jpg"}
                className={styles.eventImage}
              />

              <h3>{ev.title}</h3>

              <p>
                Date:{" "}
                {ev.date
                  ? new Date(ev.date).toLocaleDateString()
                  : "No date"}
              </p>

              <p>Location: {ev.location}</p>

              {renderStages(ev)}

              <p>
                Featured: {ev.is_featured ? "Yes" : "No"}
              </p>

              <button
                onClick={() => toggleFeatured(ev.id)}
                disabled={updatingId === ev.id}
              >
                {updatingId === ev.id
                  ? "Updating..."
                  : ev.is_featured
                  ? "Remove Featured"
                  : "Make Featured"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}