"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useParams, useRouter } from "next/navigation";

export default function CategoryEvents() {
  const { id } = useParams();
  const router = useRouter();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!id) return;

    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("category_id", id);

      if (!error) {
        setEvents(data);
      }
    };

    fetchEvents();
  }, [id]);

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-6">
        Events in Category {id}
      </h1>

      {events.length === 0 ? (
        <p>No events found in this category.</p>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {events.map((event) => (
            <div
              key={event.id}
              onClick={() => router.push(`/events/${event.id}`)}
              className="p-6 bg-white rounded shadow cursor-pointer hover:scale-105 transition"
            >
              <h2 className="text-xl font-semibold">{event.title}</h2>
              <p>{event.description}</p>
              <p className="font-bold">Price: {event.price}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}