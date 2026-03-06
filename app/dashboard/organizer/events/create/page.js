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

    const { data: user } = await supabase.auth.getUser();

    await supabase.from("events").insert([
      {
        ...form,
        organizer_id: user.user.id
      }
    ]);

    router.push("/dashboard/organizer/events");
  }

  return (
    <div className="p-6">

      <h1 className="text-2xl font-bold mb-4">Create Event</h1>

      <form onSubmit={createEvent} className="flex flex-col gap-4">

        <input
          placeholder="Event Title"
          onChange={(e)=>setForm({...form,title:e.target.value})}
        />

        <textarea
          placeholder="Description"
          onChange={(e)=>setForm({...form,description:e.target.value})}
        />

        <input
          placeholder="Location"
          onChange={(e)=>setForm({...form,location:e.target.value})}
        />

        <input
          type="date"
          onChange={(e)=>setForm({...form,date:e.target.value})}
        />

        <input
          type="number"
          placeholder="Price"
          onChange={(e)=>setForm({...form,price:e.target.value})}
        />

        <select
          onChange={(e)=>setForm({...form,category_id:e.target.value})}
        >

          <option>Select Category</option>

          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}

        </select>

        <button className="bg-blue-500 text-black p-2 rounded">
          Create 
        </button>

      </form>

    </div>
  );
}