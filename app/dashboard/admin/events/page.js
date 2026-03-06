"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";

export default function AdminEvents() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    const { data, error } = await supabase.from("events").select("*");
    if (error) console.log(error);
    else setEvents(data);
  }

  async function deleteEvent(id) {
    if (!confirm("Are you sure?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) alert(error.message);
    else fetchEvents();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Event Management</h2>
      <table className="min-w-full bg-white rounded shadow">
        <thead>
          <tr>
            <th className="p-3 border">ID</th>
            <th className="p-3 border">Title</th>
            <th className="p-3 border">Date</th>
            <th className="p-3 border">Price</th>
            <th className="p-3 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id} className="text-center">
              <td className="p-3 border">{e.id}</td>
              <td className="p-3 border">{e.title}</td>
              <td className="p-3 border">{e.date}</td>
              <td className="p-3 border">{e.price}</td>
              <td className="p-3 border">
                <button onClick={() => deleteEvent(e.id)} className="bg-red-600 text-white px-3 py-1 rounded">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}