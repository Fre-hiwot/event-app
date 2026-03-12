"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("id, title, description, location, date, price, category_id");

    if (error) {
      console.error("Error fetching events:", error);
      setEvents([]);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  }

  const bookEvent = async (eventId, ticketQuantity) => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user || authError) return alert("User not logged in");

    // Fetch profile
   const { data: profile, error: profileError } = await supabase
  .from("users")
  .select("id")
  .eq("auth_id", user.id)
  .maybeSingle();

if (!profile || profileError) {
  console.error(profileError);
  return alert("User profile not found.");
}

// Insert booking with integer user ID
const { error } = await supabase.from("bookings").insert([
  {
    user_id: profile.id,      // <- integer ID from users table
    event_id: event.id,
    ticket_quantity: tickets
  }
]);

    if (error) {
      console.error("Booking error:", error);
      alert("Booking failed: " + (error.message || JSON.stringify(error)));
    } else {
      alert(`Successfully booked ${ticketQuantity} ticket(s)!`);
    }
  };

  if (loading) return <p className="p-6">Loading events...</p>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Browse Events</h1>

      {events.length === 0 ? (
        <p>No events available.</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="border p-4 rounded shadow bg-white flex flex-col gap-2">
              <h2 className="text-xl font-bold">{event.title}</h2>
              <p className="text-gray-600">{event.description}</p>
              <p className="text-gray-600">Location: {event.location}</p>
              <p className="text-gray-600">Date: {new Date(event.date).toLocaleDateString()}</p>
              <p className="text-gray-800 font-semibold">Price: ${event.price}</p>

              {/* Ticket quantity input */}
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  min="1"
                  defaultValue="1"
                  id={`ticket-quantity-${event.id}`}
                  className="border p-1 rounded w-20"
                />
                <button
                  onClick={() => {
                    const qty = document.getElementById(`ticket-quantity-${event.id}`).value;
                    bookEvent(event.id, qty);
                  }}
                  className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
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