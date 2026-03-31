"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function CreateCategoryPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(""); // ✅ image URL
  const [loading, setLoading] = useState(false);

  // ✅ Create category
  async function handleCreate() {
    if (!name.trim()) {
      alert("Category name is required");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;
      if (!token) {
        alert("You must be logged in");
        return;
      }

      const res = await fetch("/api/categories/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description,
          image, // ✅ only URL
        }),
      });

      const result = await res.json();

      if (res.ok) {
        alert("Category created successfully");
        router.push("/category");
      } else {
        alert(result.error || "Failed to create category");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create Category</h1>

      {/* NAME */}
      <input
        type="text"
        placeholder="Category name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-2 rounded w-full mb-4"
      />

      {/* DESCRIPTION */}
      <textarea
        placeholder="Category description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="border p-2 rounded w-full mb-4"
      />

      {/* IMAGE URL */}
      <input
        type="text"
        placeholder="Image URL"
        value={image}
        onChange={(e) => setImage(e.target.value)}
        className="border p-2 rounded w-full mb-4"
      />

      {/* SHOW PREVIEW */}
      {image && (
        <img
          src={image}
          alt="Category Preview"
          className="w-full h-48 object-cover rounded mb-4"
        />
      )}

      {/* BUTTON */}
      <button
        onClick={handleCreate}
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded w-full"
      >
        {loading ? "Creating..." : "Create Category"}
      </button>
    </div>
  );
}