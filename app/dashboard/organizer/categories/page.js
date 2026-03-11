"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch all categories
  async function fetchCategories() {
    const { data, error } = await supabase.from("categories").select("*");
    if (error) {
      console.error("Error fetching categories:", error);
    } else {
      setCategories(data || []);
    }
  }

  // Add a new category
  async function createCategory(e) {
    e.preventDefault();
    if (!newCategory.trim()) return alert("Category name cannot be empty.");

    const { error } = await supabase
      .from("categories")
      .insert([{ name: newCategory.trim() }]);

    if (error) {
      console.error("Error creating category:", error);
      return alert("Failed to add category.");
    }

    setNewCategory("");
    fetchCategories();
  }

  // Delete a category
  async function deleteCategory(id) {
    // Check if any events are using this category
    const { data: eventsUsingCategory, error: eventError } = await supabase
      .from("events")
      .select("id")
      .eq("category_id", id)
      .limit(1);

    if (eventError) {
      console.error("Error checking events:", eventError);
      return alert("Failed to check events.");
    }

    if (eventsUsingCategory.length > 0) {
      return alert("Cannot delete this category. Some events are using it.");
    }

    if (!confirm("Are you sure you want to delete this category?")) return;

    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      console.error("Error deleting category:", error);
      return alert("Failed to delete category.");
    }

    fetchCategories(); // Refresh list
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Event Categories</h1>

      {/* Add new category */}
      <form onSubmit={createCategory} className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="New category name"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="border p-2 rounded flex-1"
        />
        <button className="bg-green-500 text-black px-4 py-2 rounded hover:bg-green-600">
          Add
        </button>
      </form>

      {/* Categories list */}
      <div className="grid grid-cols-1 gap-3">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white p-4 shadow rounded grid grid-cols-[1fr_auto] items-center"
          >
            <span className="font-medium text-black">{cat.name}</span>
            <button
              onClick={() => deleteCategory(cat.id)}
              className="bg-red-500 text-black px-4 py-1 rounded hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}