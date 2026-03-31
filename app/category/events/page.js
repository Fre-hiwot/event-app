"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useSearchParams, useRouter } from "next/navigation";

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
  const [loading, setLoading] = useState(false);

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

      // Fetch user info
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

      // Organizer sees only their events
      if (userRole === ORGANIZER) {
        query = query.eq("created_by", userId);
      }

      const { data } = await query;
      setEvents(data || []);
    } catch (err) {
      console.error(err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  function handleCreateEvent() {
    if (!categoryId) return alert("No category selected");
    router.push(`/category/events/add?category_id=${categoryId}`);
  }

  function handleEdit(eventId) {
    router.push(`/category/events/edit/${eventId}?category_id=${categoryId}`);
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
      if (res.ok) fetchEvents(role, userId);
      else alert(result.error);
    } catch (err) {
      alert("Delete failed");
    }
  }

  async function handleBook(eventId) {
  // Ask user for number of tickets
  const ticketsInput = prompt("How many tickets do you need?", "1");
  if (!ticketsInput) return; // user cancelled

  const tickets = parseInt(ticketsInput, 10);
  if (isNaN(tickets) || tickets <= 0) {
    return alert("Enter a valid number of tickets");
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return alert("Not authenticated");

    const res = await fetch("/api/bookings/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      // ❌ REMOVE user_id (your API already gets it securely)
      body: JSON.stringify({ event_id: eventId, tickets }),
    });

    const result = await res.json();

    // ✅ Use API response directly
    if (res.ok) {
      alert(result.message);

      // router.push("/bookings");
    } else {
      alert(result.error);
    }

  } catch (err) {
    console.error(err);
    alert("Booking failed");
  }
}

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Events in {categoryName}</h1>
        {(role === ADMIN || role === ORGANIZER) && (
          <button
            onClick={handleCreateEvent}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Create Event
          </button>
        )}
      </div>

      {loading ? (
        <p>Loading events...</p>
      ) : events.length === 0 ? (
        <p>No events found</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {events.map(ev => (
            <div key={ev.id} className="bg-white p-4 rounded shadow">
              <h2 className="font-bold">{ev.title}</h2>
              <p>{ev.location}</p>
              <p>{new Date(ev.date).toLocaleDateString()}</p>
              <p>${ev.price}</p>
              <div className="mt-2 flex gap-2">
                {/* Edit/Delete for admins/organizers */}
                {(role === ADMIN || role === ORGANIZER) && (
                  <>
                    <button
                      onClick={() => handleEdit(ev.id)}
                      className="bg-yellow-500 px-2 py-1 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(ev.id)}
                      className="bg-red-600 text-white px-2 py-1 rounded"
                    >
                      Delete
                    </button>
                  </>
                )}

                {/* Book button always visible */}
                <button
                  onClick={() => handleBook(ev.id)}
                  className="px-2 py-1 rounded text-white bg-blue-600"
                >
                  Book
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}