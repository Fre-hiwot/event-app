"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../../../../../lib/supabase";
import { useParams, useRouter } from "next/navigation";

export default function EditEvent() {

  const router = useRouter();
  const { id } = useParams();

  const [form, setForm] = useState({
    title:"",
    description:"",
    location:"",
    price:""
  });

  useEffect(() => {
    fetchEvent();
  }, []);

  async function fetchEvent(){

    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    setForm(data);
  }

  async function updateEvent(e){

    e.preventDefault();

    await supabase
      .from("events")
      .update(form)
      .eq("id", id);

    router.push("/dashboard/organizer/events");
  }

  return (
    <div className="p-6">

      <h1 className="text-2xl font-bold mb-4">Edit Event</h1>

      <form onSubmit={updateEvent} className="flex flex-col gap-4">

        <input
          value={form.title}
          onChange={(e)=>setForm({...form,title:e.target.value})}
        />

        <textarea
          value={form.description}
          onChange={(e)=>setForm({...form,description:e.target.value})}
        />

        <input
          value={form.location}
          onChange={(e)=>setForm({...form,location:e.target.value})}
        />

        <input
          value={form.price}
          onChange={(e)=>setForm({...form,price:e.target.value})}
        />

        <button className="bg-blue-500 text-white p-2 rounded">
          Update Event
        </button>

      </form>

    </div>
  );
}