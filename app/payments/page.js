"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import styles from "../styles/dashboard/paymentpage.module.css";

export default function PaymentPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [payTickets, setPayTickets] = useState({});

  useEffect(() => {
    fetchBookings();
  }, []);

  // ======================
  // FETCH BOOKINGS
  // ======================
  async function fetchBookings() {
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        setBookings([]);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", user.id)
        .single();

      if (profileError || !profile) {
        console.error(profileError);
        setBookings([]);
        return;
      }

      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          tickets,
          total_price,
          status,
          events!bookings_event_id_fkey(title, date, location)
        `)
        .eq("user_id", profile.id)
        .eq("status", "pending");

      if (error) throw error;

      setBookings(data || []);
    } catch (err) {
      console.error(err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  // ======================
  // PAY
  // ======================
  async function handlePay(booking) {
    if (!booking || processingId) return;

    const ticketsToPay = payTickets[booking.id] || 1;
    const perTicketPrice = booking.total_price / booking.tickets;
    const totalToPay = perTicketPrice * ticketsToPay;

    setProcessingId(booking.id);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          booking_id: booking.id,
          tickets_to_pay: ticketsToPay,
          total_amount: totalToPay,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      alert("Payment successful 🎉");

      setBookings((prev) =>
        prev
          .map((b) =>
            b.id === booking.id
              ? {
                  ...b,
                  status: ticketsToPay === b.tickets ? "confirmed" : b.status,
                  tickets: b.tickets - ticketsToPay,
                  total_price: b.total_price - totalToPay,
                }
              : b
          )
          .filter((b) => b.status === "pending")
      );

      setPayTickets((prev) => ({ ...prev, [booking.id]: 1 }));
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  }

  // ======================
  // CANCEL
  // ======================
  async function handleCancel(bookingId) {
    if (!bookingId || processingId) return;

    if (!confirm("Are you sure you want to cancel this booking?")) return;

    setProcessingId(bookingId);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const { data: profile } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", session.user.id)
        .single();

      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId)
        .eq("user_id", profile.id);

      if (error) throw error;

      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  }

  // ======================
  // LOADING
  // ======================
  if (loading) {
    return <p className={styles.empty}>Loading bookings...</p>;
  }

  if (bookings.length === 0) {
    return <p className={styles.empty}>No pending bookings</p>;
  }

  // ======================
  // UI
  // ======================
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>My Bookings</h1>

      <div className={styles.grid}>
        {bookings.map((booking) => {
          const perTicketPrice = booking.total_price / booking.tickets;
          const ticketsToPay = payTickets[booking.id] || 1;
          const total = perTicketPrice * ticketsToPay;

          return (
            <div key={booking.id} className={styles.card}>
              <h2 className={styles.eventTitle}>
                {booking.events?.title}
              </h2>

              <p className={styles.text}>
                Date:{" "}
                {booking.events?.date
                  ? new Date(booking.events.date).toLocaleDateString()
                  : "N/A"}
              </p>

              <p className={styles.text}>
                Location: {booking.events?.location}
              </p>

              <p className={styles.text}>
                Tickets: {booking.tickets}
              </p>

              <label className={styles.text}>
                Tickets to pay:
                <input
                  type="number"
                  min={1}
                  max={booking.tickets}
                  value={ticketsToPay}
                  onChange={(e) =>
                    setPayTickets((prev) => ({
                      ...prev,
                      [booking.id]: parseInt(e.target.value) || 1,
                    }))
                  }
                  className={styles.input}
                />
              </label>

              <p className={styles.text}>
                Total: ${total.toFixed(2)}
              </p>

              <p className={styles.status}>
                Status:{" "}
                <span className={styles.pending}>
                  {booking.status}
                </span>
              </p>

              <div className={styles.buttonGroup}>
                <button
                  onClick={() => handlePay(booking)}
                  disabled={processingId === booking.id}
                  className={`${styles.payButton} ${
                    processingId === booking.id ? styles.disabled : ""
                  }`}
                >
                  {processingId === booking.id
                    ? "Processing..."
                    : "Pay Now"}
                </button>

                <button
                  onClick={() => handleCancel(booking.id)}
                  disabled={processingId === booking.id}
                  className={`${styles.cancelButton} ${
                    processingId === booking.id ? styles.disabled : ""
                  }`}
                >
                  {processingId === booking.id
                    ? "Processing..."
                    : "Cancel"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}