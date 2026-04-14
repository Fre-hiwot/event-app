"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";

export default function OrganizerDashboard() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load user and fetch data
  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", user.id)
        .single();

      if (data) setUserId(data.id);
    }

    loadUser();
  }, []);

  useEffect(() => {
    if (userId) fetchCategoriesAndEvents();
  }, [userId]);

  // Fetch categories and events for this organizer
  async function fetchCategoriesAndEvents() {
    setLoading(true);
    try {
      const { data: catData } = await supabase
        .from("categories")
        .select("*");

      const { data: eventData } = await supabase
        .from("events")
        .select("*")
        .eq("organizer_id", userId)
        .order("date", { ascending: true });

      setCategories(catData || []);
      setEvents(eventData || []);
    } catch (err) {
      console.error("Fetch error:", err);
    }
    setLoading(false);
  }

  // Event actions
  const handleAddEvent = (categoryId) => {
    router.push(`/dashboard/events/add?category=${categoryId}`);
  };

  const handleEditEvent = (eventId) => {
    router.push(`/dashboard/events/edit/${eventId}`);
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId);

    if (error) alert("Error deleting event");
    else fetchCategoriesAndEvents();
  };

  if (loading) return <p className="p-6">Loading organizer dashboard...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">My Organizer Dashboard</h1>

      {/* Categories with event counts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {categories.map(cat => {
          const count = events.filter(e => e.category_id === cat.id).length;
          return (
            <div key={cat.id} className="bg-gray-100 p-4 rounded shadow">
              <h2 className="font-semibold text-lg">{cat.name}</h2>
              <p>{count} event(s)</p>
              <button
                onClick={() => handleAddEvent(cat.id)}
                className="mt-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Add Event
              </button>
            </div>
          );
        })}
      </div>

      {/* Events Grid */}
      <h2 className="text-xl font-bold mb-4">My Events</h2>
      {events.length === 0 ? (
        <p>No events created yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.map(event => (
            <div key={event.id} className="bg-white rounded shadow p-4 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-lg">{event.title}</h3>
                <p>{event.location}</p>
                <p>{new Date(event.date).toLocaleDateString()}</p>
                <p className="font-semibold mt-2">${event.price}</p>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleEditEvent(event.id)}
                  className="px-3 py-1 bg-yellow-500 text-black rounded hover:bg-yellow-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteEvent(event.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}