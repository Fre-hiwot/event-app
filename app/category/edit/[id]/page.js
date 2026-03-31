"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

export default function EditCategoryPage() {
  const router = useRouter();
  const { id } = useParams();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(""); // ✅ Image URL state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch category on load
  useEffect(() => {
    if (!id) return;
    fetchCategory();
  }, [id]);

  async function fetchCategory() {
    try {
      const res = await fetch(`/api/categories/get?id=${id}`);
      const data = await res.json();
      if (data.category) {
        setName(data.category.name || "");
        setDescription(data.category.description || "");
        setImage(data.category.image || ""); // ✅ populate image
      }
    } catch (err) {
      console.error("Fetch category error:", err);
      alert("Failed to fetch category");
    } finally {
      setLoading(false);
    }
  }

  // Update category
  async function handleUpdate() {
    if (!name.trim()) return alert("Name is required");

    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const user = session?.user;

      if (!token || !user) {
        alert("Not authenticated");
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/categories/update/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description,
          image,     // ✅ send image to backend
          user_id: user.id,
        }),
      });

      let result;
      try {
        result = await res.json();
      } catch {
        alert("Server returned invalid response");
        setSaving(false);
        return;
      }

      if (res.ok) {
        alert(result.message || "Updated successfully");
        router.push("/category"); // redirect back to categories
      } else {
        console.error("Update error:", result);
        alert(result.error || "Update failed");
      }
    } catch (err) {
      console.error("Update exception:", err);
      alert("Update failed due to server error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="p-6 text-center">Loading...</p>;

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Category</h1>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Category name"
        className="border p-2 rounded w-full mb-4"
      />

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Category description"
        className="border p-2 rounded w-full mb-4"
      />

      <input
        type="text"
        value={image}
        onChange={(e) => setImage(e.target.value)}
        placeholder="Image URL"
        className="border p-2 rounded w-full mb-4"
      />
      

      <button
        onClick={handleUpdate}
        disabled={saving}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {saving ? "Updating..." : "Update"}
      </button>
    </div>
  );
}