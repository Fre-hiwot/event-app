"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch("/api/bookings/get", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const result = await res.json();
      if (res.ok) {
        setBookings(result.bookings || []);
      } else {
        alert(result.error || "Failed to fetch bookings");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p>Loading bookings...</p>;
  if (bookings.length === 0) return <p>No bookings found.</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Bookings</h1>

      <div className="grid gap-4">
        {bookings.map((booking) => (
          <div key={booking.id} className="bg-white p-4 rounded shadow">
            <h2 className="font-bold">{booking.events.title}</h2>
            <p><strong>Tickets:</strong> {booking.tickets}</p>
            <p><strong>Total:</strong> ${booking.total_price}</p>
            <p><strong>Status:</strong> {booking.status}</p>
            <p><strong>Payment Status:</strong> {booking.payment_status}</p>

            {booking.payment_status === "pending" && booking.status === "pending" && (
              <Link href={`/payment?booking_id=${booking.id}`}>
                <button className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                  Pay Now
                </button>
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}