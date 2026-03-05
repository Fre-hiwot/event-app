"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useParams, useRouter } from "next/navigation";

export default function BookingPage() {
  const { event_id } = useParams();
  const router = useRouter();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (!event_id) return;

    const fetchEvent = async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", Number(event_id))
        .single();

      if (error) {
        console.error("Error fetching event:", error);
      } else {
        setEvent(data);
      }
      setLoading(false);
    };

    fetchEvent();
  }, [event_id]);

  const handleBooking = async () => {
    setBookingLoading(true);

    // Replace with logged-in user ID if you have authentication
    const user_id = 1; 
    const ticket_quantity = 1;

    try {
      const res = await fetch("/api/booking-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, event_id: Number(event_id), ticket_quantity }),
      });

      const data = await res.json();

      if (data.booking) {
        router.push(`/ticket/${data.booking.id}`);
      } else {
        alert("Booking failed. Try again!");
      }
    } catch (err) {
      console.error(err);
      alert("Booking failed. Try again!");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <p>Loading event details...</p>;
  if (!event) return <p>Event not found!</p>;

  return (
    <div className="p-10 max-w-2xl mx-auto bg-white rounded shadow">
      <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
      <p className="mb-2">{event.description}</p>
      <p className="mb-2 font-semibold">Price: ${event.price}</p>
      <p className="mb-4">Category ID: {event.category_id}</p>

      <button
        onClick={handleBooking}
        disabled={bookingLoading}
        className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {bookingLoading ? "Booking..." : "Confirm Booking"}
      </button>
    </div>
  );
}