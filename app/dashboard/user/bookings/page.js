"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    // Get current logged-in user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get user's profile to get integer ID
    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (!profile) return;

    // Fetch bookings for this user, join event info
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id,
        tickets,
        total_price,
        payment_status,
        created_at,
        events (id, title, date, price)
      `)
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bookings:", error);
    } else {
      setBookings(data || []);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">My Bookings</h1>

      {bookings.length === 0 ? (
        <p>No bookings yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white p-4 rounded shadow border"
            >
              <h2 className="text-xl font-bold mb-1">{booking.events.title}</h2>
              <p className="text-gray-600 mb-1">
                Event Date: {new Date(booking.events.date).toLocaleDateString()}
              </p>
              <p className="text-gray-600 mb-1">Tickets: {booking.tickets}</p>
              <p className="text-gray-800 font-semibold mb-1">
                Total Price: ${booking.total_price || booking.events.price * booking.tickets}
              </p>
              <p className="text-gray-500 text-sm">Status: {booking.payment_status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}