"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import styles from "../../../STYLE/dashboard/roleDashboard.module.css";

export default function FeaturedEventsPage() {
  const ADMIN = 5;
  const ORGANIZER = 6;
  const USER = 7;

  const router = useRouter();

  const [role, setRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    initialize();
  }, []);

  // ======================
  // INIT
  // ======================
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

      const res = await fetch("/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { user } = await res.json();

      if (!user) {
        setLoading(false);
        return;
      }

      setRole(user.role_id);
      setUserId(user.id);

      await fetchEvents(user.id, user.role_id);
    } catch (err) {
      console.error("INIT ERROR:", err);
    } finally {
      setLoading(false);
    }
  }

  // ======================
  // FETCH EVENTS
  // ======================
  async function fetchEvents(userId, role) {
    try {
      const now = new Date().toISOString();

      let query = supabase
        .from("events")
        .select("*")
        .gte("date", now)
        .order("date", { ascending: true });

      // ✅ ORGANIZER ONLY SEES THEIR OWN EVENTS
      if (role === ORGANIZER) {
        query = query.eq("created_by", userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("FETCH ERROR:", error);
        setEvents([]);
        return;
      }

      setEvents(data || []);
    } catch (err) {
      console.error(err);
      setEvents([]);
    }
  }

  // ======================
  // PERMISSION CHECK
  // ======================
  function canEditFeatured(ev) {
    if (role === ADMIN) return true;
    if (role === ORGANIZER && ev.created_by === userId) return true;
    return false;
  }

  // ======================
  // TOGGLE FEATURED
  // ======================
  async function toggleFeatured(eventId, currentValue, ev) {
    if (!canEditFeatured(ev)) {
      alert("You don't have permission to modify this event");
      return;
    }

    setUpdatingId(eventId);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      alert("No session found");
      setUpdatingId(null);
      return;
    }

    try {
      const res = await fetch("/api/events/update/featured", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          event_id: eventId,
          is_featured: !currentValue,
        }),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error);

      setEvents((prev) =>
        prev.map((item) =>
          item.id === eventId
            ? { ...item, is_featured: !item.is_featured }
            : item
        )
      );
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to update featured status");
    } finally {
      setUpdatingId(null);
    }
  }

  // ======================
  // LOADING
  // ======================
  if (loading) {
    return <div className={styles.page}>Loading events...</div>;
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Events</h1>

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
                className={styles.eventImage}
                alt={ev.title}
              />

              <h3 className={styles.eventTitle}>{ev.title}</h3>

              <p>
                Date:{" "}
                {ev.date
                  ? new Date(ev.date).toLocaleString()
                  : "No date"}
              </p>

              <p>Location: {ev.location}</p>

              {/* FEATURE BUTTON */}
              {canEditFeatured(ev) && (
                <button
                  onClick={() =>
                    toggleFeatured(ev.id, ev.is_featured, ev)
                  }
                  disabled={updatingId === ev.id}
                  className={`${styles.featureButton} ${
                    ev.is_featured
                      ? styles.featured
                      : styles.notFeatured
                  }`}
                >
                  {updatingId === ev.id
                    ? "Updating..."
                    : ev.is_featured
                    ? "Remove Featured"
                    : "Add Featured"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}