"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../../../lib/supabase";
import { useRouter, useParams } from "next/navigation";
import styles from "../../../../styles/event/editevent.module.css";

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);

  // basic
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  // prices
  const [earlyPrice, setEarlyPrice] = useState("");
  const [round2Price, setRound2Price] = useState("");
  const [round3Price, setRound3Price] = useState("");

  // end dates
  const [earlyEnd, setEarlyEnd] = useState("");
  const [round2End, setRound2End] = useState("");
  const [round3End, setRound3End] = useState("");

  const [vip, setVip] = useState("");
  const [vvip, setVvip] = useState("");

  const [date, setDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState(""); // ✅ already exists
  const [ticketLimit, setTicketLimit] = useState("");

  useEffect(() => {
    if (!eventId) return;

    async function load() {
      setLoading(true);

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) return router.push("/login");

      const { data: event } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      const stages = event.price_regular_stages || {};
      const ends = event.end_date_stages || {};

      setTitle(event.title || "");
      setDescription(event.description || "");
      setLocation(event.location || "");

      setEarlyPrice(stages.early?.price || "");
      setRound2Price(stages.round2?.price || "");
      setRound3Price(stages.round3?.price || "");

      setEarlyEnd(ends.early || "");
      setRound2End(ends.round2 || "");
      setRound3End(ends.round3 || "");

      setVip(event.price_vip || "");
      setVvip(event.price_vvip || "");

      setDate(event.date?.split("T")[0] || "");
      setCategoryId(event.category_id || "");
      setImageUrl(event.image_url || ""); // ✅ load image
      setTicketLimit(event.ticket_limit || "");

      const { data: cats } = await supabase.from("categories").select("*");
      setCategories(cats || []);

      setLoading(false);
    }

    load();
  }, [eventId]);

  async function handleUpdate(e) {
    e.preventDefault();
    setSaving(true);

    const { data: sessionData } = await supabase.auth.getSession();

    const res = await fetch(`/api/events/update/${eventId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionData.session.access_token}`,
      },
      body: JSON.stringify({
        title,
        description,
        location,

        price_regular_stages: {
          early: { price: earlyPrice },
          round2: { price: round2Price },
          round3: { price: round3Price },
        },

        end_date_stages: {
          early: earlyEnd,
          round2: round2End,
          round3: round3End,
        },

        price_vip: vip,
        price_vvip: vvip,
        date,
        category_id: categoryId,
        image_url: imageUrl, // ✅ send image
        ticket_limit: ticketLimit,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) return alert(data.error);

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

        <h3>Early</h3>
        <input type="number" value={earlyPrice} onChange={e => setEarlyPrice(e.target.value)} />
        <input type="date" value={earlyEnd} onChange={e => setEarlyEnd(e.target.value)} />

        <h3>Round 2</h3>
        <input type="number" value={round2Price} onChange={e => setRound2Price(e.target.value)} />
        <input type="date" value={round2End} onChange={e => setRound2End(e.target.value)} />

        <h3>Round 3</h3>
        <input type="number" value={round3Price} onChange={e => setRound3Price(e.target.value)} />
        <input type="date" value={round3End} onChange={e => setRound3End(e.target.value)} />

        <h3>VIP / VVIP</h3>
        <input value={vip} onChange={e => setVip(e.target.value)} />
        <input value={vvip} onChange={e => setVvip(e.target.value)} />

        <h3>Date</h3>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />

        <h3>Category</h3>
        <select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

            {/* ✅ IMAGE INPUT */}
        <h3>Image</h3>
        <input
          placeholder="Image URL"
          value={imageUrl}
          onChange={e => setImageUrl(e.target.value)}
        />

        {/* ✅ IMAGE PREVIEW */}
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Preview"
            className={styles.imagePreview}
            
          />
        )}

        <button disabled={saving}>
          {saving ? "Updating..." : "Update"}
        </button>
      </form>
    </div>
  );
}