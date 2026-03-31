"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function UserDashboard() {
  const [categories, setCategories] = useState([]);
  const [eventCounts, setEventCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      setLoading(true);
      const catRes = await fetch("/api/categories/get");
      const catResult = await catRes.json();
      const categoriesData = catResult.categories || [];

      const eventRes = await fetch("/api/events/get");
      const eventResult = await eventRes.json();
      const eventsData = eventResult.events || [];

      const counts = {};
      eventsData.forEach(e => {
        counts[e.category_id] = (counts[e.category_id] || 0) + 1;
      });

      setCategories(categoriesData);
      setEventCounts(counts);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setCategories([]);
      setEventCounts({});
      setLoading(false);
    }
  }

  async function handleCategoryClick(catId) {
    if (selectedCategory === catId) {
      setSelectedCategory(null);
      setEvents([]);
      return;
    }

    setSelectedCategory(catId);
    setEvents([]);
    setEventsLoading(true);

    try {
      const res = await fetch(`/api/events/get?category_id=${catId}`);
      const result = await res.json();
      setEvents(result.events || []);
      setEventsLoading(false);
    } catch (err) {
      console.error(err);
      setEvents([]);
      setEventsLoading(false);
    }
  }

  async function handleBook(eventId) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        alert("You must be logged in to book an event.");
        return;
      }

      const quantityStr = prompt("How many tickets do you need?", "1");
      if (!quantityStr) return;

      const quantity = parseInt(quantityStr);
      if (isNaN(quantity) || quantity <= 0) {
        alert("Invalid number of tickets.");
        return;
      }

      const bookingRes = await fetch("/api/bookings/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ event_id: eventId, tickets: quantity }),
      });

      const bookingData = await bookingRes.json();
      if (!bookingRes.ok) return alert(bookingData.error || "Booking failed");

      const bookingId = bookingData.booking.id;
      alert("Booking created with status: pending");

      const paymentRes = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ booking_id: bookingId }),
      });

      const paymentData = await paymentRes.json();
      if (!paymentRes.ok) return alert(paymentData.error || "Payment creation failed");

      const paymentId = paymentData.payment.id;
      alert("Payment created with status: pending");

      const success = confirm("Simulate payment success? OK = success, Cancel = failed");

      const confirmRes = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ payment_id: paymentId, success }),
      });

      const confirmData = await confirmRes.json();
      if (confirmRes.ok) {
        alert(`Payment ${success ? "successful" : "failed"}.\nBooking status updated accordingly.`);
      } else {
        alert(confirmData.error || "Payment confirmation failed");
      }
    } catch (err) {
      alert("Booking/payment process failed: " + err.message);
    }
  }

  if (loading) return <p className="loadingText">Loading categories...</p>;

  return (
    <div className="userDashboardContainer">
      <h1 className="dashboardTitle">Event Categories</h1>

      <div className="categoriesGrid">
        {categories.map(cat => (
          <div key={cat.id} className="categoryWrapper">
            <div
              onClick={() => handleCategoryClick(cat.id)}
              className="categoryCard"
              
            >
              
              <h2 className="categoryName">{cat.name}</h2>
              <p className="categoryEventCount">{eventCounts[cat.id] || 0} Events</p>
            </div>

            {selectedCategory === cat.id && (
              <div className="eventsGrid">
                {eventsLoading ? (
                  <p className="loadingText">Loading events...</p>
                ) : events.length === 0 ? (
                  <p className="noEventsText">No events in this category.</p>
                ) : (
                  events.map(event => (
                    <div key={event.id} className="eventCard">
                      <h3 className="eventTitle">{event.title}</h3>
                      <p className="eventDate">{event.date}</p>
                      <p className="eventLocation">{event.location}</p>
                      <p className="eventDescription">{event.description}</p>
                      <button
                        onClick={() => handleBook(event.id)}
                        className="bookButton"
                      >
                        Book
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}