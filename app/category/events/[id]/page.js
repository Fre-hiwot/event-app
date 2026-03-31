"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useSearchParams, useRouter } from "next/navigation";

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

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    const catId = searchParams.get("category_id");
    if (catId) {
      setSelectedCategory(parseInt(catId));
      fetchEvents(parseInt(catId));
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

  async function handleBook(eventId) {
    const quantityStr = prompt("Tickets?", "1");
    if (!quantityStr) return;
    const tickets = parseInt(quantityStr);
    if (isNaN(tickets) || tickets <= 0) return alert("Invalid");

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const userRes = await fetch("/api/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const { user } = await userRes.json();

    const res = await fetch("/api/bookings/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ user_id: user.id, event_id: eventId, tickets }),
    });
    const result = await res.json();
    if (res.ok) setBookedEventIds(prev => [...prev, eventId]);
    else alert(result.error);
  }

  // ------------------
  // UI
  // ------------------
  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {selectedCategory
            ? `Events in ${categories.find(c => c.id === selectedCategory)?.name || ""}`
            : "All Events"}
        </h1>

        {(role === ADMIN || role === ORGANIZER) && (
          <button
            onClick={handleCreateEvent}
            className="bg-green-600 text-white px-4 py-2 rounded"
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
        <div className="grid md:grid-cols-3 gap-6">
          {events.map(event => {
            const hasBooking = bookedEventIds.includes(event.id);
            return (
              <div key={event.id} className="bg-white p-4 rounded shadow">
                <h2 className="font-bold">{event.title}</h2>
                <p>{event.location}</p>
                <p>{new Date(event.date).toLocaleDateString()}</p>
                <p>${event.price}</p>

                <div className="mt-2 flex gap-2">
                  {(role === ADMIN || role === ORGANIZER) ? (
                    <>
                      <button onClick={() => handleEdit(event.id)} className="bg-yellow-500 px-2 py-1 rounded">Edit</button>
                      <button onClick={() => handleDelete(event.id)} className="bg-red-600 text-white px-2 py-1 rounded">Delete</button>
                    </>
                  ) : (
                    <button onClick={() => handleBook(event.id)} className="bg-blue-600 text-white px-2 py-1 rounded">
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