"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../../../lib/supabase";
import { useParams, useRouter } from "next/navigation";

export default function EditEvent() {

  const { id } = useParams();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchEvent();
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const { data, error } = await supabase
      .from("categories")
      .select("*");

    if (!error) {
      setCategories(data || []);
    }
  }

  async function fetchEvent() {

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      return;
    }

    setTitle(data.title);
    setLocation(data.location);
    setDate(data.date?.split("T")[0]);
    setPrice(data.price);
    setCategoryId(data.category_id);
  }

  async function updateEvent(e) {

    e.preventDefault();

    const { error } = await supabase
      .from("events")
      .update({
        title,
        location,
        date,
        price,
        category_id: categoryId
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Failed to update event");
    } else {
      alert("Event updated successfully");
      router.push("/dashboard/organizer/events");
    }
  }

  return (
    <div className="p-6 max-w-xl">

      <h1 className="text-2xl font-bold mb-6">Edit Event</h1>

      <form onSubmit={updateEvent} className="flex flex-col gap-4">

        <input
          type="text"
          placeholder="Event Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 rounded"
          required
        />

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Select Category</option>

          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}

        </select>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border p-2 rounded"
        />

        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="border p-2 rounded"
        />

        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="border p-2 rounded"
        />

        <button
          type="submit"
          className="bg-blue-500 text-black p-2 rounded hover:bg-blue-600"
        >
          Update Event
        </button>

      </form>

    </div>
  );
}