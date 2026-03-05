// /app/events/[id]/page.js
"use client"; // MUST be first line

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useParams, useRouter } from "next/navigation";

export default function EventDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchEvent = async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", Number(id))
        .single();

      if (error) console.error("Error fetching event:", error);
      else setEvent(data);

      setLoading(false);
    };

    fetchEvent();
  }, [id]);

  const handleBooking = () => {
    router.push(`/booking/${id}`);
  };

  if (loading) return <p>Loading event...</p>;
  if (!event) return <p>Event not found!</p>;

  return (
    <div className="p-10 max-w-2xl mx-auto bg-white rounded shadow">
      <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
      <p className="mb-2">{event.description}</p>
      <p className="mb-2 font-semibold">Price: ${event.price}</p>
      <p className="mb-4">Category ID: {event.category_id}</p>

      <button
        onClick={handleBooking}
        className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Book Now
      </button>
    </div>
  );
}