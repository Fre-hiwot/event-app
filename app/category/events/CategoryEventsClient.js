"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import styles from "../../styles/event/eventpage.module.css";

export default function CategoryEventsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const ADMIN = 5;
  const ORGANIZER = 6;

  const categoryId = searchParams.get("category_id");

  const [role, setRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDesc, setExpandedDesc] = useState({});

  // =========================
  // INIT
  // =========================
  useEffect(() => {
    if (!categoryId) {
      router.push("/category");
      return;
    }

    initialize();
  }, [categoryId]);

  async function initialize() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;
      if (!token) return;

      const res = await fetch("/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { user } = await res.json();
      if (!user) return;

      setUserId(user.id);
      setRole(user.role_id);

      const { data: cat } = await supabase
        .from("categories")
        .select("name")
        .eq("id", categoryId)
        .single();

      if (cat) setCategoryName(cat.name);

      fetchEvents(user.role_id, user.id);
    } catch (err) {
      console.error(err);
    }
  }

  // =========================
  // FETCH EVENTS
  // =========================
  async function fetchEvents(userRole, userId) {
    setLoading(true);

    try {
      let query = supabase
        .from("events")
        .select("*")
        .eq("category_id", categoryId)
        .order("date", { ascending: true });

      if (userRole === ORGANIZER) {
        query = query.eq("created_by", userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error(error);
        setEvents([]);
        return;
      }

      const activeEvents = (data || []).filter(
        (ev) => ev.date && new Date(ev.date) >= new Date()
      );

      setEvents(activeEvents);
    } catch (err) {
      console.error(err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // ACTIONS
  // =========================
  const handleCreateEvent = () =>
    router.push(`/category/events/add?category_id=${categoryId}`);

  const handleEdit = (eventId) =>
    router.push(`/category/events/edit/${eventId}?category_id=${categoryId}`);

  const handleBook = (event) =>
    router.push(`/bookings/bookevent?event_id=${event.id}`);

  const handleDelete = async (eventId) => {
    if (!confirm("Delete this event?")) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const res = await fetch("/api/events/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ event_id: eventId }),
    });

    const result = await res.json();

    if (res.ok) {
      fetchEvents(role, userId);
    } else {
      alert(result.error || "Delete failed");
    }
  };

  // =========================
  // HELPERS
  // =========================
  const toggleDescription = (id) => {
    setExpandedDesc((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString() : "";

  const isActiveTicket = (endDate) =>
    !endDate || new Date(endDate) >= new Date();

  const renderTickets = (ev) => {
    const stages = ev.price_regular_stages || {};
    const ends = ev.end_date_stages || {};

    const tickets = [];

    const early = Number(stages?.early?.price || 0);
    const round2 = Number(stages?.round2?.price || 0);
    const round3 = Number(stages?.round3?.price || 0);

    if (early > 0 && isActiveTicket(ends.early))
      tickets.push(`Early ${early} (End: ${formatDate(ends.early)})`);

    if (round2 > 0 && isActiveTicket(ends.round2))
      tickets.push(`Round2 ${round2} (End: ${formatDate(ends.round2)})`);

    if (round3 > 0 && isActiveTicket(ends.round3))
      tickets.push(`Round3 ${round3} (End: ${formatDate(ends.round3)})`);

    const vip = Number(ev.price_vip || 0);
    const vvip = Number(ev.price_vvip || 0);

    if (vip > 0) tickets.push(`VIP ${vip}`);
    if (vvip > 0) tickets.push(`VVIP ${vvip}`);

    if (tickets.length === 0) return <p>Free</p>;

    return (
      <div>
        <strong>Tickets:</strong>
        {tickets.map((t, i) => (
          <p key={i}>{t}</p>
        ))}
      </div>
    );
  };

  // =========================
  // UI STATES
  // =========================
  if (loading) {
    return <p className={styles["events-loading"]}>Loading events...</p>;
  }

  return (
    <div className={styles["events-container"]}>
      <div className={styles["events-header"]}>
        <h1 className={styles["events-title"]}>
          Events in {categoryName}
        </h1>

        {(role === ADMIN || role === ORGANIZER) && (
          <button
            className={styles["events-create-button"]}
            onClick={handleCreateEvent}
          >
            Create Event
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <p className={styles["events-empty"]}>No events found</p>
      ) : (
        <div className={styles["events-grid"]}>
          {events.map((ev) => {
            const isExpanded = expandedDesc[ev.id];
            const shortDesc = ev.description?.slice(0, 100) || "";

            return (
              <div key={ev.id} className={styles["event-card"]}>
                <img
                  src={ev.image_url || "/default-event.jpg"}
                  alt={ev.title}
                  className={styles["event-image"]}
                  onError={(e) =>
                    (e.currentTarget.src = "/default-event.jpg")
                  }
                />

                <h2 className={styles["event-name"]}>{ev.title}</h2>

                {ev.description && (
                  <p>
                    {isExpanded
                      ? ev.description
                      : shortDesc +
                        (ev.description.length > 100 ? "..." : "")}

                    {ev.description.length > 100 && (
                      <button onClick={() => toggleDescription(ev.id)}>
                        {isExpanded ? "Less" : "More"}
                      </button>
                    )}
                  </p>
                )}

                <div style={{ display: "flex", gap: "20px" }}>
                  <p>
                    <strong>Date:</strong> {formatDate(ev.date)}
                  </p>
                  <p>
                    <strong>Location:</strong> {ev.location}
                  </p>
                </div>

                {renderTickets(ev)}

                <div>
                  {(role === ADMIN || role === ORGANIZER) && (
                    <>
                      <button onClick={() => handleEdit(ev.id)}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(ev.id)}>
                        Delete
                      </button>
                    </>
                  )}

                  {role !== ADMIN && (
                    <button onClick={() => handleBook(ev)}>
                      Book
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}