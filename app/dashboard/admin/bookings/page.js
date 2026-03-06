"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    const { data, error } = await supabase.from("bookings").select("*");
    if (error) console.log(error);
    else setBookings(data);
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Bookings</h2>
      <table className="min-w-full bg-white rounded shadow">
        <thead>
          <tr>
            <th className="p-3 border">ID</th>
            <th className="p-3 border">User ID</th>
            <th className="p-3 border">Event ID</th>
            <th className="p-3 border">Quantity</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id} className="text-center">
              <td className="p-3 border">{b.id}</td>
              <td className="p-3 border">{b.user_id}</td>
              <td className="p-3 border">{b.event_id}</td>
              <td className="p-3 border">{b.ticket_quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}