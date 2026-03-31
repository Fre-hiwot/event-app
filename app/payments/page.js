"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get("booking_id");

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!bookingId) {
      alert("Booking ID is missing");
      router.push("/bookings");
      return;
    }
    fetchBooking();
  }, [bookingId]);

  async function fetchBooking() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Please login first");
        router.push("/login");
        return;
      }

      const res = await fetch(`/api/bookings/get-one?id=${bookingId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await res.json();

      // adjust according to API response
      setBooking(result.booking || result); 
    } catch (err) {
      console.error(err);
      alert("Failed to fetch booking");
    } finally {
      setLoading(false);
    }
  }

  async function handlePay() {
    if (!bookingId || paying) return;

    setPaying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ booking_id: bookingId }),
      });

      const result = await res.json();

      if (res.ok) {
        setBooking(prev => ({ ...prev, status: "confirmed", payment_status: "paid" }));
        alert("Payment successful! Booking confirmed.");
      } else {
        alert(result.error || "Payment failed");
      }
    } catch (err) {
      console.error(err);
      alert("Payment failed due to server error.");
    } finally {
      setPaying(false);
    }
  }

  if (loading) return <p>Loading...</p>;
  if (!booking) return <p>Booking not found.</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Payment</h1>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-bold">{booking?.events?.title || "Event"}</h2>
        <p><strong>Tickets:</strong> {booking?.tickets}</p>
        <p><strong>Total:</strong> ${booking?.total_price}</p>
        <p><strong>Status:</strong> {booking?.status}</p>
        <p><strong>Payment Status:</strong> {booking?.payment_status}</p>

        {booking?.status === "pending" && booking?.payment_status === "pending" && (
          <button
            onClick={handlePay}
            disabled={paying}
            className={`mt-4 px-4 py-2 rounded text-white ${
              paying ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {paying ? "Processing..." : "Pay Now"}
          </button>
        )}
      </div>
    </div>
  );
}