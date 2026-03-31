"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function OrganizerEvents() {

  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("organizer_id", user.id);

    if (error) {
      console.log(error);
    } else {
      setEvents(data);
    }
  }

  return (
    <div>
      <h1>My Events</h1>

      <a href="/dashboard/organizer/events/create">
        <button>Create Event</button>
      </a>

      {events.map((event) => (
        <div key={event.id}>
          <h3>{event.title}</h3>
          <p>{event.description}</p>

          <a href={`/dashboard/organizer/events/edit/${event.id}`}>
            <button>Edit</button>
          </a>

          <button>Delete</button>
        </div>
      ))}

    </div>
  );
}