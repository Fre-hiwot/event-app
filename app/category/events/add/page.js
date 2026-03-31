"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";

export default function AddEvent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const categoryId = searchParams.get("category_id");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState("");
  const [ticketLimit, setTicketLimit] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null); // 5 = Admin, 6 = Organizer
  const [loading, setLoading] = useState(false);
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {
    if (!categoryId) {
      alert("No category selected");
      router.push("/category");
      return;
    }
    loadUser();
    loadCategoryName();
  }, [categoryId]);

  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("users")
      .select("id, role_id")
      .eq("auth_id", user.id)
      .single();

    if (!data) return;
    setUserId(data.id);
    setUserRole(data.role_id);

    if (![5, 6].includes(data.role_id)) {
      alert("You do not have permission to create events");
      router.push("/category");
    }
  }

  async function loadCategoryName() {
    const { data } = await supabase
      .from("categories")
      .select("name")
      .eq("id", categoryId)
      .single();
    if (data) setCategoryName(data.name);
  }

  async function handleCreateEvent(e) {
    e.preventDefault();

    if (!title || !date || !ticketLimit) {
      alert("Please fill all required fields including ticket limit");
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return alert("Not authenticated");

      const res = await fetch("/api/events/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          user_role: userRole,
          title,
          description,
          location,
          price: price ? parseFloat(price) : 0,
          date,
          category_id: parseInt(categoryId),
          image_url: imageUrl || null,
          ticket_limit: parseInt(ticketLimit),
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        alert(result.error || "Failed to create event");
        return;
      }

      // Redirect to events under this category
      router.push(`/category/events?category_id=${categoryId}`);
    } catch (err) {
      console.error(err);
      alert("Failed to create event");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create Event in {categoryName}</h1>

      <form onSubmit={handleCreateEvent} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Event Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <textarea
          placeholder="Event Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={e => setLocation(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="number"
          placeholder="Price"
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
          type="number"
          placeholder="Ticket Limit"
          value={ticketLimit}
          onChange={e => setTicketLimit(e.target.value)}
          className="border p-2 rounded"
          min={1}
          required
        />
        <input
          type="text"
          placeholder="Image URL (optional)"
          value={imageUrl}
          onChange={e => setImageUrl(e.target.value)}
          className="border p-2 rounded"
        />

        <button
          type="submit"
          disabled={loading}
          className={`py-2 rounded text-white ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading ? "Creating..." : "Create Event"}
        </button>
      </form>
    </div>
  );
}