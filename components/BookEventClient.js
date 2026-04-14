"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function BookEventClient({ router, supabase, style }) {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("event_id");

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;

    async function fetchEvent() {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      setEvent(data);
      setLoading(false);
    }

    fetchEvent();
  }, [eventId]);

  if (loading) return <p>Loading...</p>;
  if (!event) return <p>Event not found</p>;

  return <div>{event.title}</div>;
}