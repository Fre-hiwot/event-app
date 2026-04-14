"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "../../../styles/event/eventpage.module.css";

export default function EventsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const ADMIN = 5;
  const ORGANIZER = 6;

  const [role, setRole] = useState(null);
  const [userId, setUserId] = useState(null);

  const [categories, setCategories] = useState([]);
  const [events, setEvents] = useState([]);
  const [bookedEventIds, setBookedEventIds] = useState([]);

  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [expandedDesc, setExpandedDesc] = useState({});

  // ------------------
  // INIT
  // ------------------
  useEffect(() => {
    initialize();
  }, []);

  async function initialize() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const res = await fetch("/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { user } = await res.json();
      if (!user) return;

      setUserId(user.id);
      setRole(user.role_id);

      const [catRes, bookingsRes] = await Promise.all([
        fetch("/api/categories/get"),
        fetch(`/api/bookings/get?user_id=${user.id}`),
      ]);

      const catData = await catRes.json();
      const bookingsData = await bookingsRes.json();

      setCategories(catData.categories || []);
      setBookedEventIds(bookingsData.bookings?.map(b => b.event_id) || []);
    } catch (err) {
      console.error("Init error:", err);
    }
  }

  // ------------------
  // FETCH EVENTS
  // ------------------
  useEffect(() => {
    const catId = searchParams.get("category_id");
    if (!catId) return;

    const id = parseInt(catId);
    setSelectedCategory(id);

    if (role !== null) {
      fetchEvents(id);
    }
  }, [searchParams, role, userId]);

  async function fetchEvents(catId) {
    setLoadingEvents(true);

    try {
      let url = `/api/events/get?category_id=${catId}`;

      if (role === ORGANIZER && userId) {
        url += `&created_by=${userId}`;
      }

      const res = await fetch(url);
      const result = await res.json();

      setEvents(result.events || []);
    } catch (err) {
      console.error(err);
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }

  // ------------------
  // ACTIONS
  // ------------------
  function handleCreateEvent() {
    router.push("/events/add");
  }

  function handleEdit(eventId) {
    router.push(`/events/edit/${eventId}`);
  }

  function handleBook(event) {
    router.push(`/bookings/bookevent?event_id=${event.id}`);
  }

  async function handleDelete(eventId) {
    if (!confirm("Delete this event?")) return;

    const res = await fetch("/api/events/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: eventId }),
    });

    const result = await res.json();

    if (res.ok) {
      fetchEvents(selectedCategory);
    } else {
      alert(result.error || "Delete failed");
    }
  }

  function toggleDescription(id) {
    setExpandedDesc(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  // ------------------
  // PRICE RENDER FIX
  // ------------------
  function renderPrices(event) {
    const stages = event.price_regular_stages || {};

    return (
      <>
        {stages.early && (
          <span>
            <strong>Early:</strong> ${Number(stages.early.price || 0).toFixed(2)} <br />
          </span>
        )}

        {stages.round2 && (
          <span>
            <strong>Round 2:</strong> ${Number(stages.round2.price || 0).toFixed(2)} <br />
          </span>
        )}

        {stages.round3 && (
          <span>
            <strong>Round 3:</strong> ${Number(stages.round3.price || 0).toFixed(2)} <br />
          </span>
        )}

        <span>
          <strong>VIP:</strong> ${Number(event.price_vip || 0).toFixed(2)} <br />
        </span>

        <span>
          <strong>VVIP:</strong> ${Number(event.price_vvip || 0).toFixed(2)}
        </span>
      </>
    );
  }

  // ------------------
  // RENDER
  // ------------------
  return (
    <div className={styles["events-container"]}>
      <div className={styles["events-header"]}>
        <h1 className={styles["events-title"]}>
          {selectedCategory
            ? `Events in ${
                categories.find(c => c.id === selectedCategory)?.name || ""
              }`
            : "All Events"}
        </h1>

        {(role === ADMIN || role === ORGANIZER) && (
          <button
            onClick={handleCreateEvent}
            className={styles["events-create-button"]}
          >
            Create Event
          </button>
        )}
      </div>

      {loadingEvents ? (
        <p>Loading events...</p>
      ) : events.length === 0 ? (
        <p>No events found</p>
      ) : (
        <div className={styles["events-grid"]}>
          {events.map(event => {
            const hasBooking = bookedEventIds.includes(event.id);
            const isExpanded = expandedDesc[event.id];

            return (
              <div key={event.id} className={styles["event-card"]}>
                <img
                  src={event.image_url || "/default-event.jpg"}
                  alt={event.title}
                  className={styles["event-image"]}
                  onError={(e) => {
                    e.currentTarget.src = "/default-event.jpg";
                  }}
                />

                <h2>{event.title}</h2>
                <p>{event.location}</p>
                <p>{new Date(event.date).toLocaleDateString()}</p>

                <p>{renderPrices(event)}</p>

                <div>
                  <p
                    className={
                      isExpanded ? styles.expanded : ""
                    }
                  >
                    {event.description}
                  </p>

                  {event.description?.length > 100 && (
                    <button onClick={() => toggleDescription(event.id)}>
                      {isExpanded ? "Read less" : "Read more"}
                    </button>
                  )}
                </div>

                <div>
                  {(role === ADMIN || role === ORGANIZER) ? (
                    <>
                      <button onClick={() => handleEdit(event.id)}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(event.id)}>
                        Delete
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleBook(event)}
                      disabled={hasBooking}
                    >
                      {hasBooking ? "Booked" : "Book"}
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