"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import styles from "../../STYLE/dashboard/roleDashboard.module.css";

export default function FeaturedEventsPage() {
  const ADMIN = 5;
  const ORGANIZER = 6;
  const USER = 7;

  const router = useRouter();

  const [role, setRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initialize();
  }, []);

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

      await fetchFeaturedEvents();
    } catch (err) {
      console.error("INIT ERROR:", err);
    } finally {
      setLoading(false);
    }
  }

  // ✅ SAFE DATE CHECK
  const isEventActive = (date) => {
    if (!date) return true;
    return new Date(date.replace(" ", "T")) >= new Date();
  };

  async function fetchFeaturedEvents() {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("is_featured", true)
        .order("date", { ascending: true });

      if (error) {
        console.error(error);
        setEvents([]);
        return;
      }

      const activeEvents = (data || []).filter((ev) =>
        isEventActive(ev.date)
      );

      setEvents(activeEvents);
    } catch (err) {
      console.error(err);
      setEvents([]);
    }
  }

  function handleBook(eventId) {
    router.push(`/bookings/bookevent?event_id=${eventId}`);
  }

  // =========================
  // ✅ FIXED PRICE PARSING HERE
  // =========================
  function renderEvent(ev) {
    const stages = ev.price_regular_stages || {};
    const ends = ev.end_date_stages || {};

    // 🔥 FIX: backend stores NUMBER, not {price}
    const early = Number(stages.early || 0);
    const round2 = Number(stages.round2 || 0);
    const round3 = Number(stages.round3 || 0);

    const vip = Number(ev.price_vip || 0);
    const vvip = Number(ev.price_vvip || 0);

    const renderLine = (label, price, end) => {
      if (!price || price <= 0) return null;

      return (
        <p>
          {label}: ${price}
          {end && <> | Ends: {new Date(end).toLocaleDateString()}</>}
        </p>
      );
    };

    return (
      <>
        <p>
          Date:{" "}
          {ev.date
            ? new Date(ev.date.replace(" ", "T")).toLocaleDateString()
            : "No date"}
        </p>

        <p>Location: {ev.location}</p>

        {renderLine("Early", early, ends.early)}
        {renderLine("Round2", round2, ends.round2)}
        {renderLine("Round3", round3, ends.round3)}

        {vip > 0 && <p>VIP: ${vip}</p>}
        {vvip > 0 && <p>VVIP: ${vvip}</p>}
      </>
    );
  }

  if (loading) {
    return <div className={styles.page}>Loading featured events...</div>;
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Featured Events</h1>

      {events.length === 0 ? (
        <div className={styles.emptyStateCard}>
          <p>No featured events available.</p>
        </div>
      ) : (
        <div className={styles.eventList}>
          {events.map((ev) => (
            <div key={ev.id} className={styles.eventCard}>
              <img
                src={ev.image_url || "/default-event.jpg"}
                className={styles.eventImage}
                alt={ev.title}
                onError={(e) =>
                  (e.currentTarget.src = "/default-event.jpg")
                }
              />

              <h3 className={styles.eventTitle}>{ev.title}</h3>

              {renderEvent(ev)}

              {(role === USER || role === ORGANIZER) && (
                <div className={styles.buttonGroup}>
                  <button
                    onClick={() => handleBook(ev.id)}
                    className={styles.bookButton}
                  >
                    Book
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}