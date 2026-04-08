"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
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
  // Initialization
  // ------------------
  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    const catId = searchParams.get("category_id");
    if (catId) {
      const id = parseInt(catId);
      setSelectedCategory(id);
      fetchEvents(id);
    }
  }, [searchParams, role]);

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

      const catRes = await fetch("/api/categories/get");
      const catData = await catRes.json();
      setCategories(catData.categories || []);

      const bookingsRes = await fetch(`/api/bookings/get?user_id=${user.id}`);
      const bookingsData = await bookingsRes.json();
      setBookedEventIds(bookingsData.bookings?.map(b => b.event_id) || []);

    } catch (err) {
      console.error("Init error:", err);
    }
  }

  async function fetchEvents(catId) {
    setLoadingEvents(true);
    try {
      let url = `/api/events/get?category_id=${catId}`;
      if (role === ORGANIZER) url += `&created_by=${userId}`;
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
  // Actions
  // ------------------
  function handleCreateEvent() {
    router.push("/events/add");
  }

  function handleEdit(eventId) {
    router.push(`/events/edit/${eventId}`);
  }

  async function handleDelete(eventId) {
    if (!confirm("Delete this event?")) return;

    try {
      const res = await fetch("/api/events/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId }),
      });
      const result = await res.json();
      if (res.ok) fetchEvents(selectedCategory);
      else alert(result.error);
    } catch (err) {
      alert("Delete failed");
    }
  }

  // ------------------
  // Redirect to booking page
  // ------------------
  function handleBook(event) {
    router.push(
      `/bookings/bookevent?event_id=${event.id}` +
      `&price_regular=${event.price_regular || 0}` +
      `&price_vip=${event.price_vip || 0}` +
      `&price_vvip=${event.price_vvip || 0}` +
      `&category_id=${selectedCategory}`
    );
  }

  function toggleDescription(id) {
    setExpandedDesc(prev => ({ ...prev, [id]: !prev[id] }));
  }

  // ------------------
  // Render
  // ------------------
  return (
    <div className={styles["events-container"]}>
      <div className={styles["events-header"]}>
        <h1 className={styles["events-title"]}>
          {selectedCategory
            ? `Events in ${categories.find(c => c.id === selectedCategory)?.name || ""}`
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
        <p className={styles["events-loading"]}>Loading events...</p>
      ) : events.length === 0 ? (
        <p className={styles["events-empty"]}>No events found</p>
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
                  onError={e => e.target.src = "/default-event.jpg"}
                />

                <h2 className={styles["event-name"]}>{event.title}</h2>
                <p className={styles["event-location"]}>{event.location}</p>
                <p className={styles["event-date"]}>{new Date(event.date).toLocaleDateString()}</p>

                {/* Tiered Prices */}
                <p className={styles["event-price"]}>
                  {event.price_regular !== undefined && <><strong>Regular:</strong> ${event.price_regular.toFixed(2)}<br/></>}
                  {event.price_vip !== undefined && <><strong>VIP:</strong> ${event.price_vip.toFixed(2)}<br/></>}
                  {event.price_vvip !== undefined && <><strong>VVIP:</strong> ${event.price_vvip.toFixed(2)}</>}
                </p>

                <div className={styles["event-description-wrapper"]}>
                  {event.description && (
                    <p
                      className={`${styles["event-description"]} ${isExpanded ? styles.expanded : ""}`}
                    >
                      {event.description}
                    </p>
                  )}
                  {event.description?.length > 100 && (
                    <button
                      onClick={() => toggleDescription(event.id)}
                      className={styles["show-more-text"]}
                    >
                      {isExpanded ? "Read less" : "Read more"}
                    </button>
                  )}
                </div>

                <div className={styles["event-actions"]}>
                  {(role === ADMIN || role === ORGANIZER) ? (
                    <>
                      <button
                        onClick={() => handleEdit(event.id)}
                        className={styles["event-edit-button"]}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className={styles["event-delete-button"]}
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleBook(event)}
                      className={styles["event-book-button"]}
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