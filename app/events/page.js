"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useParams } from "next/navigation";

export default function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);

  useEffect(() => {
    async function fetchEvent() {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      setEvent(data);
    }
    fetchEvent();
  }, [id]);

  const handleBooking = async () => {
    const res = await fetch("/api/booking-workflow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: 1,
        event_id: id,
        ticket_quantity: 1,
      }),
    });

    const data = await res.json();

    if (data.booking) {
      window.location.href = `/ticket/${data.booking.id}`;
    }
  };

  if (!event) return <p>Loading...</p>;

  return (
    <div>
      <h1>{event.title}</h1>
      <p>{event.description}</p>
      <p>Price: {event.price}</p>

      <button onClick={handleBooking}>Book Now</button>
    </div>
  );
}