"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import style from "../../styles/bookings/bookevent.module.css";

export default function BookEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventIdRaw = searchParams.get("event_id");
  const eventId = eventIdRaw ? parseInt(eventIdRaw, 10) : null;

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ticketType, setTicketType] = useState("regular");
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Fetch event data
  useEffect(() => {
    async function fetchEvent() {
      if (!eventId) return;

      try {
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .eq("id", eventId)
          .single();

        if (error || !data) throw error || new Error("Event not found");
        setEvent(data);

        // Set default ticket type if available
        if (data.price_regular) setTicketType("regular");
        else if (data.price_vip) setTicketType("vip");
        else if (data.price_vvip) setTicketType("vvip");

      } catch (err) {
        console.error(err);
        alert("Failed to fetch event");
      } finally {
        setLoading(false);
      }
    }

    fetchEvent();
  }, [eventId]);

  // Get ticket price
  const getPrice = () => {
    if (!event) return 0;
    switch (ticketType) {
      case "vip":
        return event.price_vip || 0;
      case "vvip":
        return event.price_vvip || 0;
      default:
        return event.price_regular || 0;
    }
  };

  // Handle booking
  async function handleBook() {
    if (!event) return;
    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("You must be logged in to book");
        router.push("/login");
        return;
      }

      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          event_id: event.id,
          tickets: quantity,
          ticket_type: ticketType,
          total_price: getPrice() * quantity,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Booking failed");

      alert("Booking successful!");

    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="p-6">Loading event...</p>;
  if (!event) return <p className="p-6">Event not found</p>;

  return (
    <div className={style.bookeventcontainer}>
      <h1 className={style.eventTitle}>{event.title}</h1>
      <p>{event.description}</p>
      <p className={style.eventLocation}>Location: {event.location}</p>
      <p className={style.eventDate}>Date: {new Date(event.date).toLocaleDateString()}</p>

      <div className="mt-4 flex flex-col gap-3">
        <label>
          Ticket Type:
          <select
            value={ticketType}
            onChange={e => setTicketType(e.target.value)}
            className={style.ticketTypeSelect}
          >
            {event.price_regular != null && <option value="regular">Regular (${event.price_regular})</option>}
            {event.price_vip != null && <option value="vip">VIP (${event.price_vip})</option>}
            {event.price_vvip != null && <option value="vvip">VVIP (${event.price_vvip})</option>}
          </select>
        </label>

        <label>
          Quantity:
          <input
            type="number"
            min={1}
            max={event.ticket_limit || 10}
            value={isNaN(quantity) ? 1 : quantity} // Prevent NaN
            onChange={e => {
              const val = parseInt(e.target.value, 10);
              setQuantity(isNaN(val) ? 1 : val); // Fallback to 1
            }}
            className="border p-2 rounded w-full mt-1"
          />
        </label>

        <p>Total Price: ${getPrice() * quantity}</p>

        <button
          onClick={handleBook}
          disabled={submitting}
          className={style.bookButton}
        >
          {submitting ? "Booking..." : "Book Now"}
        </button>
      </div>
    </div>
  );
}