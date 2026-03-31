"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../../../lib/supabase";
import { useRouter, useParams } from "next/navigation";

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id;

  const [eventData, setEventData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Controlled inputs
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // Fetch event
      const { data: event, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (eventError || !event) {
        alert("Event not found");
        router.push("/category/events");
        return;
      }

      setEventData(event);

      // Pre-fill form
      setTitle(event.title || "");
      setDescription(event.description || "");
      setLocation(event.location || "");
      setPrice(event.price || "");
      setDate(event.date ? event.date.split("T")[0] : "");
      setCategoryId(event.category_id || "");
      setImageUrl(event.image_url || "");

      // Fetch categories
      const { data: catData } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      setCategories(catData || []);
      setLoading(false);
    }

    fetchData();
  }, [eventId, router]);

  //  Handle update via API
  async function handleUpdate(e) {
    e.preventDefault();

    if (!title || !date || !categoryId) {
      alert("Please fill required fields");
      return;
    }

    try {
      //Get session token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        alert("You must be logged in");
        return;
      }

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
          price: price ? parseFloat(price) : 0,
          date,
          category_id: parseInt(categoryId),
          image_url: imageUrl || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update event");
      }

      alert("Event updated successfully!");
        router.push(`/category/events?category_id=${categoryId}`);

    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    }
  }

  if (loading) return <p className="p-6">Loading event...</p>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Event</h1>

      <form onSubmit={handleUpdate} className="flex flex-col gap-4">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="border p-2 rounded"
          required
        />

        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="border p-2 rounded"
        />

        <input
          type="text"
          value={location}
          onChange={e => setLocation(e.target.value)}
          className="border p-2 rounded"
        />

        <input
          type="number"
          value={price}
          onChange={e => setPrice(e.target.value)}
          className="border p-2 rounded"
        />

        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="border p-2 rounded"
          required
        />

        <input
          type="text"
          value={imageUrl}
          onChange={e => setImageUrl(e.target.value)}
          className="border p-2 rounded"
        />

        <button
          type="submit"
          className="bg-yellow-500 text-black py-2 rounded hover:bg-yellow-600"
        >
          Update Event
        </button>
      </form>
    </div>
  );
}