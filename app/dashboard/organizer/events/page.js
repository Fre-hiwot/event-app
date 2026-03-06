"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";

export default function OrganizerEvents() {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    category_id: "",
    location: "",
    date: "",
    price: "",
    capacity: "",
  });

  // 1️⃣ Get Organizer userId from Supabase UUID
  const getUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    return profile?.id || null;
  };

  // 2️⃣ Fetch categories
  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*");
    setCategories(data || []);
  };

  // 3️⃣ Fetch events created by this organizer
  const fetchEvents = async () => {
    const userId = await getUserId();
    if (!userId) return;

    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("*, categories(name)")
      .eq("created_by", userId);

    if (eventError) {
      console.error("Supabase Events Error:", eventError);
      alert("Failed to fetch events: " + (eventError.message || JSON.stringify(eventError)));
    } else {
      setEvents(eventData || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
    fetchEvents();
  }, []);

  // 4️⃣ Handle form input changes
  const handleChange = (e) => {
    setNewEvent({ ...newEvent, [e.target.name]: e.target.value });
  };

  // 5️⃣ Create new event
  const handleCreate = async () => {
    const userId = await getUserId();
    if (!userId) return alert("Organizer not found.");

    const { data, error } = await supabase
      .from("events")
      .insert({
        ...newEvent,
        category_id: Number(newEvent.category_id),
        price: Number(newEvent.price),
        capacity: Number(newEvent.capacity),
        date: new Date(newEvent.date),
        created_by: userId,
      });

    if (error) {
      console.error(error);
      alert("Failed to create event: " + error.message);
    } else {
      alert("Event created successfully!");
      setNewEvent({
        title: "",
        description: "",
        category_id: "",
        location: "",
        date: "",
        price: "",
        capacity: "",
      });
      fetchEvents();
    }
  };

  // 6️⃣ Delete event
  const handleDelete = async (eventId) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    const { error } = await supabase.from("events").delete().eq("id", eventId);
    if (error) {
      alert("Failed to delete event: " + error.message);
    } else {
      alert("Event deleted!");
      fetchEvents();
    }
  };

  if (loading) return <p>Loading events...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Events</h1>

      {/* Create Event Form */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="font-bold mb-2">Create New Event</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="title"
            placeholder="Title"
            value={newEvent.title}
            onChange={handleChange}
            className="p-2 border rounded"
          />
          <input
            name="location"
            placeholder="Location"
            value={newEvent.location}
            onChange={handleChange}
            className="p-2 border rounded"
          />
          <select name="category_id" value={newEvent.category_id} onChange={handleChange} className="p-2 border rounded">
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            name="date"
            value={newEvent.date}
            onChange={handleChange}
            className="p-2 border rounded"
          />
          <input
            type="number"
            name="price"
            placeholder="Price"
            value={newEvent.price}
            onChange={handleChange}
            className="p-2 border rounded"
          />
          <input
            type="number"
            name="capacity"
            placeholder="Capacity"
            value={newEvent.capacity}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>
        <textarea
          name="description"
          placeholder="Description"
          value={newEvent.description}
          onChange={handleChange}
          className="w-full p-2 border rounded mt-2"
        />
        <button onClick={handleCreate} className="mt-2 bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
          Create Event
        </button>
      </div>

      {/* Events Table */}
      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 border">Title</th>
            <th className="p-2 border">Category</th>
            <th className="p-2 border">Date</th>
            <th className="p-2 border">Location</th>
            <th className="p-2 border">Price</th>
            <th className="p-2 border">Capacity</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td className="p-2 border">{event.title}</td>
              <td className="p-2 border">{event.categories?.name || "N/A"}</td>
              <td className="p-2 border">{new Date(event.date).toLocaleDateString()}</td>
              <td className="p-2 border">{event.location}</td>
              <td className="p-2 border">${event.price}</td>
              <td className="p-2 border">{event.capacity}</td>
              <td className="p-2 border flex gap-2">
                <button
                  onClick={() => handleDelete(event.id)}
                  className="bg-red-500 text-white p-1 rounded hover:bg-red-600"
                >
                  Delete
                </button>
                {/* Optionally add Edit button here */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}