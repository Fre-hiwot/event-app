"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "../../styles/event/eventpage.module.css";

export default function EventsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("category_id");

  const ADMIN = 5;
  const ORGANIZER = 6;

  const [role, setRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDesc, setExpandedDesc] = useState({});

  // -------------------
  // Initialization
  // -------------------
  useEffect(() => {
    if (!categoryId) {
      alert("No category selected");
      router.push("/category");
      return;
    }
    initialize();
  }, [categoryId]);

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

      // Fetch category name
      const { data } = await supabase
        .from("categories")
        .select("name")
        .eq("id", categoryId)
        .single();

      if (data) setCategoryName(data.name);

      // Fetch events
      fetchEvents(user.role_id, user.id);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchEvents(userRole, userId) {
    setLoading(true);
    try {
      let query = supabase
        .from("events")
        .select("*")
        .eq("category_id", categoryId)
        .order("date", { ascending: true });

      if (userRole === ORGANIZER) query = query.eq("created_by", userId);

      const { data } = await query;
      setEvents(data || []);
    } catch (err) {
      console.error(err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  // -------------------
  // Handlers
  // -------------------
  const handleCreateEvent = () => {
    router.push(`/category/events/add?category_id=${categoryId}`);
  };

  const handleEdit = (eventId) => {
    router.push(`/category/events/edit/${eventId}?category_id=${categoryId}`);
  };

  const handleDelete = async (eventId) => {
    if (!confirm("Delete this event?")) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return alert("Unauthorized");

      const res = await fetch("/api/events/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ event_id: eventId }),
      });

      const result = await res.json();

      if (res.ok) {
        fetchEvents(role, userId);
      } else {
        alert(result.error);
      }
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  const handleBook = (event) => {
    router.push(`/bookings/bookevent?event_id=${event.id}`);
  };

  const toggleDescription = (id) => {
    setExpandedDesc(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // -------------------
  // Render
  // -------------------
  if (loading) return <p className={styles["events-loading"]}>Loading events...</p>;

  return (
    <div className={styles["events-container"]}>
      <div className={styles["events-header"]}>
        <h1 className={styles["events-title"]}>Events in {categoryName}</h1>
        {(role === ADMIN || role === ORGANIZER) && (
          <button className={styles["events-create-button"]} onClick={handleCreateEvent}>
            Create Event
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <p className={styles["events-empty"]}>No events found</p>
      ) : (
        <div className={styles["events-grid"]}>
          {events.map(ev => {
            const isExpanded = expandedDesc[ev.id];
            const shortDesc = ev.description?.slice(0, 100) || "";

            // Flexible pricing check
            const regularStages = ev.price_regular_stages || {};
            const allFree =
              (!regularStages.early && !regularStages.round2 && !regularStages.round3 &&
               (!ev.price_vip || ev.price_vip === 0) && (!ev.price_vvip || ev.price_vvip === 0));

            return (
              <div key={ev.id} className={styles["event-card"]}>
                <img
                  src={ev.image_url || "/default-event.jpg"}
                  alt={ev.title}
                  className={styles["event-image"]}
                  onError={e => (e.target.src = "/default-event.jpg")}
                />
                <h2 className={styles["event-name"]}>{ev.title}</h2>

                {ev.description && (
                  <div className={styles["event-description-wrapper"]}>
                    <p className={`${styles["event-description"]} ${isExpanded ? styles.expanded : ""}`}>
                      {isExpanded ? ev.description : shortDesc + (ev.description.length > 100 ? "..." : "")}
                    </p>
                    {ev.description.length > 100 && (
                      <button className={styles["show-more-text"]} onClick={() => toggleDescription(ev.id)}>
                        {isExpanded ? "Read less" : "Read more"}
                      </button>
                    )}
                  </div>
                )}

                <div className={styles["event-info-wrapper"]}>
                  <p className={styles["event-info"]}><strong>Location:</strong> {ev.location}</p>
                  <p className={styles["event-info"]}><strong>Date:</strong> {new Date(ev.date).toLocaleDateString()}</p>
                  <p className={styles["event-info"]}>
                    <strong>Price:</strong>{" "}
                    {allFree
                      ? "Free"
                      : (
                        <>
                          {regularStages.early > 0 && <>Early: ${regularStages.early} </>}
                          {regularStages.round2 > 0 && <>Round2: ${regularStages.round2} </>}
                          {regularStages.round3 > 0 && <>Round3+: ${regularStages.round3} </>}
                          {ev.price_vip > 0 && <>VIP: ${ev.price_vip} </>}
                          {ev.price_vvip > 0 && <>VVIP: ${ev.price_vvip}</>}
                        </>
                      )
                    }
                  </p>
                </div>

                <div className={styles["event-actions"]}>
                  {(role === ADMIN || role === ORGANIZER) && (
                    <>
                      <button className={styles["event-edit-button"]} onClick={() => handleEdit(ev.id)}>Edit</button>
                      <button className={styles["event-delete-button"]} onClick={() => handleDelete(ev.id)}>Delete</button>
                    </>
                  )}
                  <button className={styles["event-book-button"]} onClick={() => handleBook(ev)}>Book</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}