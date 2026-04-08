"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import styles from "../../STYLE/dashboard/roleDashboard.module.css";

export default function FeaturedEventsPage() {
  const ADMIN = 5;
  const ORGANIZER = 6;
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
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) throw new Error("Not logged in");

      const res = await fetch("/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { user } = await res.json();

      if (!user) throw new Error("User data not found");

      setRole(user.role_id);
      setUserId(user.id);

      await fetchFeaturedEvents(user.id, user.role_id);
    } catch (err) {
      console.error("Initialization error:", err);
      setEvents([]);
      setLoading(false);
    }
  }

  async function fetchFeaturedEvents(userId, role) {
    setLoading(true);
    try {
      let query = supabase
        .from("events")
        .select("*")
        .eq("is_featured", true)
        .order("date", { ascending: true });

      // Only organizers see their own featured events
      if (role === ORGANIZER) {
        query = query.eq("created_by", userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching featured events:", error);
        setEvents([]);
      } else {
        setEvents(data || []);
      }
    } catch (err) {
      console.error("Unexpected error in fetchFeaturedEvents:", err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  function handleBook(eventId) {
    router.push(`/bookings/bookevent?event_id=${eventId}`);
  }

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "ETB",
    }).format(Number(value));

  if (loading)
    return <div className={styles.page}>Loading featured events...</div>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Featured Events</h1>

      {events.length === 0 ? (
        <div className={styles.emptyStateCard}>
          <p>
            No featured events {role === ORGANIZER ? "created by you" : ""}.
          </p>
        </div>
      ) : (
        <div className={styles.eventList}>
          {events.map((ev) => {
            const prices = [
              { label: "Regular", value: Number(ev.price_regular) },
              { label: "VIP", value: Number(ev.price_vip) },
              { label: "VVIP", value: Number(ev.price_vvip) },
            ].filter((p) => p.value > 0);

            const allFree = prices.length === 0;

            return (
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

                {allFree ? (
                  <p>Price: Free</p>
                ) : prices.length === 1 ? (
                  <p>Price: {formatCurrency(prices[0].value)}</p>
                ) : (
                  <div>
                    <p><strong>Ticket Options:</strong></p>
                    {prices.map((p) => (
                      <p key={p.label}>
                        {p.label}: {formatCurrency(p.value)}
                      </p>
                    ))}
                  </div>
                )}

                <div className={styles.buttonGroup}>
                  <button
                    onClick={() => handleBook(ev.id)}
                    className={styles.bookButton}
                  >
                    Book
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}