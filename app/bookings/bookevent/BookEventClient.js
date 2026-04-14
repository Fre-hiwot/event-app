"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import style from "../../styles/bookings/bookevent.module.css";

export default function BookEventClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const eventId = searchParams.get("event_id");

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ticketType, setTicketType] = useState("regular");
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // =========================
  // FETCH EVENT
  // =========================
  useEffect(() => {
    if (!eventId) {
      router.push("/category");
      return;
    }

    fetchEvent(eventId);
  }, [eventId]);

  async function fetchEvent(id) {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) throw error || new Error("Event not found");

      setEvent(data);

      if (data.price_vip) setTicketType("vip");
      else if (data.price_vvip) setTicketType("vvip");
      else setTicketType("regular");
    } catch (err) {
      console.error(err);
      alert("Failed to fetch event");
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // EVENT EXPIRED CHECK
  // =========================
  const isEventExpired = () => {
    if (!event?.date) return true;
    return new Date(event.date) < new Date();
  };

  // =========================
  // PRICE LOGIC
  // =========================
  const getActiveRegularPrice = () => {
    if (!event) return 0;

    const stages = event.price_regular_stages || {};
    const ends = event.end_date_stages || {};
    const now = new Date();

    const isActive = (d) => d && new Date(d) >= now;

    if (stages.early?.price > 0 && isActive(ends.early))
      return stages.early.price;

    if (stages.round2?.price > 0 && isActive(ends.round2))
      return stages.round2.price;

    if (stages.round3?.price > 0 && isActive(ends.round3))
      return stages.round3.price;

    return 0;
  };

  const getPrice = () => {
    if (!event) return 0;

    if (ticketType === "vip") return event.price_vip || 0;
    if (ticketType === "vvip") return event.price_vvip || 0;

    return getActiveRegularPrice();
  };

  // =========================
  // BOOK EVENT
  // =========================
  async function handleBook() {
    if (!event) return;

    if (isEventExpired()) {
      alert("This event has expired");
      return;
    }

    const price = getPrice();

    if (price <= 0) {
      alert("Tickets are no longer available");
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

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
          total_price: price * quantity,
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

  // =========================
  // STATES
  // =========================
  if (loading) return <p className="p-6">Loading event...</p>;
  if (!event) return <p className="p-6">Event not found</p>;
  if (isEventExpired()) return <p className="p-6">Event expired</p>;

  // =========================
  // UI
  // =========================
  return (
    <div className={style.bookeventcontainer}>
      <h1 className={style.eventTitle}>{event.title}</h1>

      <p>{event.description}</p>

      <p className={style.eventLocation}>
        Location: {event.location}
      </p>

      <p className={style.eventDate}>
        Date: {new Date(event.date).toLocaleDateString()}
      </p>

      <div className="mt-4 flex flex-col gap-3">
        <label>
          Ticket Type:
          <select
            value={ticketType}
            onChange={(e) => setTicketType(e.target.value)}
            className={style.ticketTypeSelect}
          >
            {getActiveRegularPrice() > 0 && (
              <option value="regular">
                Regular (${getActiveRegularPrice()})
              </option>
            )}

            {event.price_vip != null && (
              <option value="vip">
                VIP (${event.price_vip})
              </option>
            )}

            {event.price_vvip != null && (
              <option value="vvip">
                VVIP (${event.price_vvip})
              </option>
            )}
          </select>
        </label>

        <label>
          Quantity:
          <input
            type="number"
            min={1}
            max={event.ticket_limit || 10}
            value={quantity}
            onChange={(e) =>
              setQuantity(parseInt(e.target.value) || 1)
            }
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