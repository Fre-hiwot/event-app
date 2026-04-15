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

      if (error || !data) throw error;

      setEvent(data);

      // ❌ REMOVED AUTO ticketType SETTING
      // user must choose manually
    } catch (err) {
      console.error(err);
      alert("Failed to fetch event");
    } finally {
      setLoading(false);
    }
  }

  const isEventExpired = () => {
    if (!event?.date) return true;
    return new Date(event.date) < new Date();
  };

  // =========================
  // REGULAR PRICE LOGIC (FIXED)
  // =========================
  const getActiveRegularPrice = () => {
    if (!event) return 0;

    const stages = event.price_regular_stages || {};
    const ends = event.end_date_stages || {};
    const now = new Date();

    const isActive = (d) => d && new Date(d) >= now;

    const early = Number(stages?.early || 0);
    const round2 = Number(stages?.round2 || 0);
    const round3 = Number(stages?.round3 || 0);

    if (early > 0 && isActive(ends.early)) return early;
    if (round2 > 0 && isActive(ends.round2)) return round2;
    if (round3 > 0 && isActive(ends.round3)) return round3;

    return 0;
  };

  const getPrice = () => {
    if (!event) return 0;

    if (ticketType === "vip") return Number(event.price_vip || 0);
    if (ticketType === "vvip") return Number(event.price_vvip || 0);

    return getActiveRegularPrice();
  };

  const handleBook = async () => {
    if (!event) return;

    if (isEventExpired()) {
      alert("Event expired");
      return;
    }

    const price = getPrice();

    if (price <= 0) {
      alert("No ticket available for selected type");
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
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

      if (!res.ok) throw new Error(result.error);

      alert("Booking successful!");
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!event) return <p>Event not found</p>;
  if (isEventExpired()) return <p>Event expired</p>;

  const regularPrice = getActiveRegularPrice();

  return (
    <div className={style.bookeventcontainer}>
      <h1 className={style.eventTitle}>{event.title}</h1>

      <p>{event.description}</p>
      <p>Location: {event.location}</p>
      <p>Date: {new Date(event.date).toLocaleDateString()}</p>

      <label>
        Ticket Type:
        <select
          value={ticketType}
          onChange={(e) => setTicketType(e.target.value)}
          className={style.ticketTypeSelect}
        >
          {regularPrice > 0 && (
            <option value="regular">
              Regular (${regularPrice})
            </option>
          )}

          {event.price_vip > 0 && (
            <option value="vip">
              VIP (${event.price_vip})
            </option>
          )}

          {event.price_vvip > 0 && (
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
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />
      </label>

      <p>Total: ${getPrice() * quantity}</p>

      <button onClick={handleBook} disabled={submitting}>
        {submitting ? "Booking..." : "Book Now"}
      </button>
    </div>
  );
}