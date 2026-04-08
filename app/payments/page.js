"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function PaymentPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [payTickets, setPayTickets] = useState({}); // dynamic ticket count per booking

  useEffect(() => {
    fetchBookings();
  }, []);

  // Fetch all bookings for the logged-in user
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

      const internalUserId = profile.id;

      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          tickets,
          total_price,
          status,
          events!bookings_event_id_fkey(title, date, location)
        `)
        .eq("user_id", internalUserId)
        .eq("status", "pending"); // Only fetch pending bookings

      if (error) throw error;

      setBookings(data || []);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  // Pay for a booking
  async function handlePay(booking) {
    if (!booking || processingId) return;

    const ticketsToPay = payTickets[booking.id] || 1;
    const perTicketPrice = booking.total_price / booking.tickets;
    const totalToPay = perTicketPrice * ticketsToPay;

    if (totalToPay === 0) {
      if (!confirm("This event is free. Confirm your booking?")) return;
    }

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
      if (!res.ok) throw new Error(result.error || "Payment failed");

      alert("Payment successful! 🎉");

      // Remove fully paid bookings immediately
      setBookings(prev =>
        prev
          .map(b =>
            b.id === booking.id
              ? {
                  ...b,
                  status:
                    ticketsToPay === b.tickets ? "confirmed" : b.status,
                  tickets: b.tickets - ticketsToPay,
                  total_price: b.total_price - totalToPay,
                }
              : b
          )
          .filter(b => b.status === "pending") // only keep pending
      );

      setPayTickets(prev => ({ ...prev, [booking.id]: 1 }));
    } catch (err) {
      console.error(err);
      alert(err.message || "Payment failed");
    } finally {
      setProcessingId(null);
    }
  }

  // Cancel a booking
  async function handleCancel(bookingId) {
    if (!bookingId || processingId) return;

    const confirmCancel = confirm(
      "Are you sure you want to cancel this booking?"
    );
    if (!confirmCancel) return;

    setProcessingId(bookingId);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session.user;

      const { data: profile } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", user.id)
        .single();

      const internalUserId = profile.id;

      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId)
        .eq("user_id", internalUserId);

      if (error) throw error;

      alert("Booking cancelled successfully!");

      // Remove cancelled booking immediately
      setBookings(prev => prev.filter(b => b.id !== bookingId));
    } catch (err) {
      console.error(err);
      alert(err.message || "Cancellation failed");
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) return <p className="p-6">Loading bookings...</p>;
  if (bookings.length === 0)
    return <p className="p-6">You have no pending bookings at the moment.</p>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold mb-4">My Bookings</h1>

      {bookings.map((booking) => {
        const perTicketPrice = booking.total_price / booking.tickets;
        const ticketsToPay = payTickets[booking.id] || 1;
        const dynamicTotal = perTicketPrice * ticketsToPay;

        return (
          <div
            key={booking.id}
            className="bg-white p-4 rounded shadow-md flex flex-col gap-2"
          >
            <h2 className="text-lg font-semibold">
              {booking.events?.title || "Event"}
            </h2>

            <p>
              <strong>Date:</strong>{" "}
              {booking.events?.date
                ? new Date(booking.events.date).toLocaleDateString()
                : "N/A"}
            </p>

            <p>
              <strong>Location:</strong> {booking.events?.location || "N/A"}
            </p>

            <p>
              <strong>Tickets:</strong> {booking.tickets}
            </p>

            <label>
              Tickets to pay:
              <input
                type="number"
                min={1}
                max={booking.tickets}
                value={ticketsToPay}
                onChange={e =>
                  setPayTickets(prev => ({
                    ...prev,
                    [booking.id]: parseInt(e.target.value) || 1,
                  }))
                }
                className="border p-2 rounded w-full mt-1"
              />
            </label>

            <p>
              <strong>Total:</strong> ${dynamicTotal.toFixed(2)}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              <span className="text-yellow-600 font-semibold">
                {booking.status}
              </span>
            </p>

            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handlePay(booking)}
                disabled={processingId === booking.id}
                className={`flex-1 py-2 rounded text-white ${
                  processingId === booking.id
                    ? "bg-gray-400"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {processingId === booking.id ? "Processing..." : "Pay Now"}
              </button>

              <button
                onClick={() => handleCancel(booking.id)}
                disabled={processingId === booking.id}
                className={`flex-1 py-2 rounded text-white ${
                  processingId === booking.id
                    ? "bg-gray-400"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {processingId === booking.id ? "Processing..." : "Cancel"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}