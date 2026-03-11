"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import Link from "next/link";

export default function MyEvents() {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState({});
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    fetchCategories();
    fetchEvents();
  }, []);

  async function fetchCategories() {
    const { data: catData, error } = await supabase.from("categories").select("*");
    if (!error && catData) {
      const catMap = {};
      catData.forEach(c => (catMap[c.id] = c.name));
      setCategories(catMap);
    }
  }

  async function fetchEvents() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (!profile) return;

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("created_by", profile.id)
      .order("date", { ascending: true });

    if (error) {
      console.error(error);
    } else {
      setEvents(data || []);
    }
  }

  async function deleteEvent(id) {
    const confirmDelete = confirm("Delete this event?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) {
      console.error(error);
    } else {
      fetchEvents();
      setOpenMenuId(null);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Manage My Events</h1>

      {events.length === 0 ? (
        <p>No events found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded shadow">
            <thead className="bg-gray-200">
              <tr>
                <th className="py-2 px-4 border-b text-left">Title</th>
                <th className="py-2 px-4 border-b text-left">Category</th>
                <th className="py-2 px-4 border-b text-left">Date</th>
                <th className="py-2 px-4 border-b text-left">Location</th>
                <th className="py-2 px-4 border-b text-left">Price</th>
                <th className="py-2 px-4 border-b text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map(event => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{event.title}</td>
                  <td className="py-2 px-4 border-b">{categories[event.category_id] || "N/A"}</td>
                  <td className="py-2 px-4 border-b">{new Date(event.date).toLocaleDateString()}</td>
                  <td className="py-2 px-4 border-b">{event.location}</td>
                  <td className="py-2 px-4 border-b">${event.price}</td>
                  <td className="py-2 px-4 border-b text-right relative">
                    {/* Actions button */}
                    <button
                      onClick={() => setOpenMenuId(openMenuId === event.id ? null : event.id)}
                      className="bg-gray-300 text-black px-3 py-1 rounded hover:bg-gray-400"
                    >
                      Actions
                    </button>

                    {/* Dropdown menu: vertical list */}
                    {openMenuId === event.id && (
                      <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow z-10 flex flex-col">
                        <Link
                          href={`/dashboard/organizer/events/edit/${event.id}`}
                          className="px-4 py-2 hover:bg-yellow-100"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => deleteEvent(event.id)}
                          className="px-4 py-2 text-left hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}