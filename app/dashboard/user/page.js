"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import Link from "next/link";

export default function UserDashboard() {
  const [categories, setCategories] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchCategories();
    fetchEvents();
  }, []);

  // Fetch all categories
  async function fetchCategories() {
    const { data, error } = await supabase.from("categories").select("*");
    if (error) return console.error("Error fetching categories:", error);
    setCategories(data || []);
  }

  // Fetch all events
  async function fetchEvents() {
    const { data, error } = await supabase.from("events").select("*");
    if (error) return console.error("Error fetching events:", error);
    setEvents(data || []);
  }

  async function bookEvent(event) {
    const tickets = prompt(`Enter the number of tickets for "${event.title}":`, "1");
    if (!tickets || isNaN(tickets) || parseInt(tickets) <= 0)
      return alert("Invalid ticket quantity.");

    const ticketCount = parseInt(tickets);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("You must be logged in to book.");

    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .maybeSingle();
    if (!profile) return alert("User profile not found.");

    const { error } = await supabase.from("bookings").insert([
      {
        user_id: profile.id,
        event_id: event.id,
        tickets: ticketCount,
        total_price: ticketCount * event.price
      }
    ]);

    if (error) {
      console.error("Booking error:", error);
      alert("Booking failed: " + error.message);
    } else {
      alert(`Successfully booked ${ticketCount} ticket(s) for "${event.title}"!`);
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Browse Events by Category</h1>
        <div className="flex gap-4">
          <Link
            href="/dashboard/user/bookings"
            className="bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-600"
          >
            My Bookings
          </Link>
          <Link
            href="/dashboard/user/profile"
            className="bg-purple-500 text-white px-4 py-2 rounded shadow hover:bg-purple-600"
          >
            Profile
          </Link>
        </div>
      </div>

      {/* Categories with Events */}
      {categories.length === 0 ? (
        <p>No categories found.</p>
      ) : (
        categories.map((cat) => {
          const catEvents = events.filter((e) => e.category_id === cat.id);
          return (
            <div key={cat.id} className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{cat.name}</h2>
              {catEvents.length === 0 ? (
                <p className="text-gray-500 mb-4">No events in this category.</p>
              ) : (
                <div className="grid md:grid-cols-3 gap-6">
                  {catEvents.map((event) => (
                    <div key={event.id} className="bg-white p-4 rounded shadow">
                      <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                      <p className="text-gray-600 mb-1">{event.location}</p>
                      <p className="text-gray-600 mb-1">
                        {new Date(event.date).toLocaleDateString()}
                      </p>
                      <p className="text-gray-800 font-semibold mb-2">${event.price}</p>

                      <button
                        onClick={() => setSelectedEvent(event)}
                        className="bg-gray-500 text-white px-4 py-2 rounded shadow hover:bg-gray-600 mr-2"
                      >
                        Details
                      </button>

                      <button
                        onClick={() => bookEvent(event)}
                        className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600"
                      >
                        Book Now
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Modal for Event Details */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 max-w-lg w-full relative">
            <h2 className="text-2xl font-bold mb-4">{selectedEvent.title}</h2>
            <p className="mb-4">{selectedEvent.description || "No description available."}</p>
            <p className="text-gray-600 mb-2">Location: {selectedEvent.location}</p>
            <p className="text-gray-600 mb-2">
              Date: {new Date(selectedEvent.date).toLocaleDateString()}
            </p>
            <p className="text-gray-800 font-semibold mb-4">Price: ${selectedEvent.price}</p>
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}