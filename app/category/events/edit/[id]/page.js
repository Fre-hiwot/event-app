"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../../../lib/supabase";
import { useRouter, useParams } from "next/navigation";
import styles from "../../../../styles/event/editevent.module.css";

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id;

  const ADMIN = 5;
  const ORGANIZER = 6;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Basic fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  // Pricing + stage dates
  const [regularEarly, setRegularEarly] = useState("");
  const [earlyEnd, setEarlyEnd] = useState("");

  const [regularRound2, setRegularRound2] = useState("");
  const [round2End, setRound2End] = useState("");

  const [regularRound3, setRegularRound3] = useState("");
  const [round3End, setRound3End] = useState("");

  const [priceVIP, setPriceVIP] = useState("");
  const [priceVVIP, setPriceVVIP] = useState("");

  const [date, setDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ticketLimit, setTicketLimit] = useState("");

  const [role, setRole] = useState(null);

  // -------------------
  // Fetch Data
  // -------------------
  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const userRes = await supabase
        .from("users")
        .select("role_id")
        .eq("auth_id", session.user.id)
        .single();

      setRole(userRes.data?.role_id);

      const { data: event } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (!event) {
        alert("Event not found");
        router.push("/category/events");
        return;
      }

      // Fill data
      setTitle(event.title || "");
      setDescription(event.description || "");
      setLocation(event.location || "");

      const stages = event.price_regular_stages || {};

      setRegularEarly(stages.early?.price || "");
      setEarlyEnd(stages.early?.end || "");

      setRegularRound2(stages.round2?.price || "");
      setRound2End(stages.round2?.end || "");

      setRegularRound3(stages.round3?.price || "");
      setRound3End(stages.round3?.end || "");

      setPriceVIP(event.price_vip || "");
      setPriceVVIP(event.price_vvip || "");
      setDate(event.date?.split("T")[0] || "");
      setCategoryId(event.category_id || "");
      setImageUrl(event.image_url || "");
      setTicketLimit(event.ticket_limit || "");

      const { data: catData } = await supabase.from("categories").select("*");
      setCategories(catData || []);

      setLoading(false);
    }

    fetchData();
  }, [eventId]);

  // -------------------
  // Update
  // -------------------
  async function handleUpdate(e) {
    e.preventDefault();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`/api/events/update/${eventId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        title,
        description,
        location,
        price_regular_stages: {
          early: {
            price: parseFloat(regularEarly) || 0,
            end: earlyEnd || null,
          },
          round2: {
            price: parseFloat(regularRound2) || 0,
            end: round2End || null,
          },
          round3: {
            price: parseFloat(regularRound3) || 0,
            end: round3End || null,
          },
        },
        price_vip: parseFloat(priceVIP) || 0,
        price_vvip: parseFloat(priceVVIP) || 0,
        date,
        category_id: parseInt(categoryId),
        image_url: imageUrl || null,
        ticket_limit: parseInt(ticketLimit) || 0,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    alert("Updated successfully");
    router.push(`/category/events?category_id=${categoryId}`);
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div className={styles.container}>
      <h1>Edit Event</h1>

      <form onSubmit={handleUpdate} className={styles.form}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />

        <textarea value={description} onChange={e => setDescription(e.target.value)} />

        <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" />

        {/* EARLY */}
        <h3>Early Bird</h3>
        <input type="number" value={regularEarly} onChange={e => setRegularEarly(e.target.value)} placeholder="Price" />
        <input type="date" value={earlyEnd} onChange={e => setEarlyEnd(e.target.value)} />

        {/* ROUND 2 */}
        <h3>Round 2</h3>
        <input type="number" value={regularRound2} onChange={e => setRegularRound2(e.target.value)} placeholder="Price"  />
        <input type="date" value={round2End} onChange={e => setRound2End(e.target.value)} />

        {/* ROUND 3 */}
        <h3>Round 3</h3>
        <input type="number" value={regularRound3} onChange={e => setRegularRound3(e.target.value)} placeholder="Price" />
        <input type="date" value={round3End} onChange={e => setRound3End(e.target.value)} />

        {/* VIP & VVIP */}
        <h3>VIP</h3>
        <input type="number" value={priceVIP} onChange={e => setPriceVIP(e.target.value)} placeholder="VIP" />

        <h3>VVIP</h3>
        <input type="number" value={priceVVIP} onChange={e => setPriceVVIP(e.target.value)} placeholder="VVIP" />

        <h3>Event Date</h3>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} placeholder="Event Date" />

        <h3>Category</h3>
        <select value={categoryId} onChange={e => setCategoryId(e.target.value)} placeholder="Select Category" >
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

         <h3>Ticket Limit</h3>
        <input type="number" value={ticketLimit} onChange={e => setTicketLimit(e.target.value)} placeholder="Limit" />
        <h3>Image URL</h3>
        <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Image URL" />
        

        <button type="submit">Update</button>
      </form>
    </div>
  );
}