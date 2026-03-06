"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../../../lib/supabase";
import { useRouter } from "next/navigation";

export default function CreateEvent() {
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    date: "",
    price: "",
    category_id: ""
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const { data } = await supabase
      .from("categories")
      .select("*");

    setCategories(data || []);
  }

  async function createEvent(e) {
    e.preventDefault();

    // 1️⃣ Get current authenticated user UUID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("You must be logged in!");

    // 2️⃣ Get integer user id from users table
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (profileError || !profile) {
      console.error(profileError);
      return alert("Failed to fetch user profile.");
    }

    // 3️⃣ Insert new event
    const { error } = await supabase.from("events").insert([
      {
        ...form,
        category_id: Number(form.category_id),
        price: Number(form.price),
        created_by: profile.id,
        date: new Date(form.date)
      }
    ]);

    if (error) {
      console.error(error);
      return alert("Failed to create event: " + error.message);
    }

    alert("Event created successfully!");
    router.push("/dashboard/organizer/events"); // Redirect to "My Events"
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Create Event</h1>

      <form onSubmit={createEvent} className="flex flex-col gap-4">

        <input
          placeholder="Event Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="p-2 border rounded"
          required
        />

        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="p-2 border rounded"
        />

        <input
          placeholder="Location"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          className="p-2 border rounded"
        />

        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="p-2 border rounded"
          required
        />

        <input
          type="number"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="p-2 border rounded"
        />

        <select
          value={form.category_id}
          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          className="p-2 border rounded"
          required
        >
          <option value="">Select Category</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <button type="submit" className="bg-blue-500 text-black p-2 rounded hover:bg-blue-600">
          Create
        </button>
      </form>
    </div>
  );
}